import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState, useCallback } from 'react'
import UserHeader from '@/components/UserHeader'
import { useRoundsStore, useTapStore, useWebSocketStore } from '@/app/store'
import { roundsApi } from '@/api/rounds.api.js'
import type { RoundStatus, RoundStats } from '@/types/index.js'
import { formatTime, getRoundStatus, getStatusTitle } from '@/utils/round'
import { Spin, message } from 'antd'
import { differenceInSeconds } from 'date-fns'

const guss = `
        ░░░░░░░░░░░░░░░         
      ░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░        
    ░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░      
    ░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░      
  ░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░    
░░▒▒▒▒░░░░▓▓▓▓▓▓▓▓▓▓▓▓░░░░▒▒▒▒░░
░░▒▒▒▒▒▒▒▒░░░░░░░░░░░░▒▒▒▒▒▒▒▒░░
░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░
  ░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░  
    ░░░░░░░░░░░░░░░░░░░░░░░░░░  

`

function RoundDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentRound, fetchRound, isLoading } = useRoundsStore()
  const { myScore, tapCount, tap, setScore, resetTap, isLoading: isTapping } = useTapStore()
  const { connect, disconnect, subscribe, unsubscribe, messages } = useWebSocketStore()
  const [stats, setStats] = useState<RoundStats | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [currentStatus, setCurrentStatus] = useState<RoundStatus | null>(null)

  // Загрузка раунда
  useEffect(() => {
    if (!id) {
      navigate('/rounds')
      return
    }

    fetchRound(id).catch(() => {
      navigate('/rounds')
    })
  }, [id, fetchRound, navigate])

  // Загрузка статистики
  useEffect(() => {
    if (!id) return

    const loadStats = async () => {
      try {
        const data = await roundsApi.getRoundStats(id)
        setStats(data)
        if (data.myStats) {
          setScore(data.myStats.score, data.myStats.tapCount)
        }
      } catch (error) {
        console.error('Failed to load stats:', error)
      }
    }

    loadStats()
    const interval = setInterval(loadStats, 5000) // Обновляем каждые 5 секунд

    return () => clearInterval(interval)
  }, [id, setScore])

  // При завершении раунда сразу обновляем статистику
  useEffect(() => {
    if (!id || currentStatus !== 'finished') return

    const loadFinalStats = async () => {
      try {
        const data = await roundsApi.getRoundStats(id)
        setStats(data)
        if (data.myStats) {
          setScore(data.myStats.score, data.myStats.tapCount)
        }
      } catch (error) {
        console.error('Failed to load final stats:', error)
      }
    }

    loadFinalStats()
  }, [id, currentStatus, setScore])

  // WebSocket подключение и подписка
  useEffect(() => {
    if (!id) return

    connect()
    subscribe(id)

    return () => {
      unsubscribe(id)
      disconnect()
    }
  }, [id, connect, disconnect, subscribe, unsubscribe])

  // Обработка WebSocket сообщений
  useEffect(() => {
    messages.forEach((msg) => {
      if (msg.type === 'user:score' && msg.roundId === id) {
        setScore(msg.data.score, msg.data.tapCount)
      } else if (msg.type === 'round:update' && msg.roundId === id) {
        // Обновляем статистику при обновлении раунда
        roundsApi.getRoundStats(id).then(setStats).catch(console.error)
      }
    })
  }, [messages, id, setScore])

  // Таймер и обновление статуса
  useEffect(() => {
    if (!currentRound) return

    const updateTimerAndStatus = () => {
      const now = new Date()
      const startTime = new Date(currentRound.startTime)
      const endTime = new Date(currentRound.endTime)
      const cooldownStart = new Date(startTime.getTime() - currentRound.cooldownDuration * 1000)

      // Обновляем статус динамически
      const status = getRoundStatus(
        currentRound.startTime,
        currentRound.endTime,
        currentRound.cooldownDuration,
      )
      setCurrentStatus(status)

      // Обновляем таймер
      let remaining: number

      if (now >= cooldownStart && now < startTime) {
        // Cooldown
        remaining = differenceInSeconds(startTime, now)
      } else if (now >= startTime && now < endTime) {
        // Active
        remaining = differenceInSeconds(endTime, now)
      } else {
        // Finished
        remaining = 0
      }

      setTimeRemaining(remaining)
    }

    updateTimerAndStatus()
    const interval = setInterval(updateTimerAndStatus, 1000)

    return () => clearInterval(interval)
  }, [currentRound])

  const handleTap = useCallback(async () => {
    if (!id || !currentRound || currentStatus !== 'active' || isTapping) return

    try {
      await tap(id)
    } catch (error: any) {
      // Не показываем ошибку, если раунд завершился во время тапа
      if (error.message === 'Round is not active. Current status: finished') {
        // Раунд завершился - это нормально, просто обновим статус
        return
      }
      message.error(error.message || 'Ошибка тапа')
    }
  }, [id, currentRound, currentStatus, tap, isTapping])

  const title = isLoading ? 'Загрузка...' : getStatusTitle(currentStatus)

  return (
    <div className="mt-[calc(50vh-200px)] flex flex-col border-2 border-blue-500 bg-white">
      <UserHeader title={title} />
      <div className="flex flex-1 flex-col items-center justify-center pb-5">
        <>
          <div
            className={`px-10 py-5 leading-none text-gray-500 transition-transform select-none ${
              currentStatus === 'active'
                ? 'cursor-pointer hover:text-red-500 active:scale-95 active:text-yellow-500'
                : 'cursor-not-allowed opacity-50'
            }`}
            onClick={handleTap}
          >
            <code className="whitespace-pre">{guss}</code>
          </div>
          {currentStatus === 'cooldown' && (
            <CooldownComponent timeRemaining={timeRemaining} formatTime={formatTime} />
          )}
          {currentStatus === 'active' && (
            <ActiveRoundComponent
              timeRemaining={timeRemaining}
              myScore={myScore}
              formatTime={formatTime}
            />
          )}
          {currentStatus === 'finished' && (
            <RoundResultComponent stats={stats} myScore={stats?.myStats?.score ?? myScore} />
          )}{' '}
        </>
      </div>
    </div>
  )
}

function CooldownComponent({
  timeRemaining,
  formatTime,
}: {
  timeRemaining: number | null
  formatTime: (seconds: number) => string
}) {
  return (
    <>
      <div>Cooldown</div>
      <div>до начала раунда {timeRemaining !== null ? formatTime(timeRemaining) : '--:--'}</div>
    </>
  )
}

function ActiveRoundComponent({
  timeRemaining,
  myScore,
  formatTime,
}: {
  timeRemaining: number | null
  myScore: number
  formatTime: (seconds: number) => string
}) {
  return (
    <>
      <div>Раунд активен!</div>
      <div>До конца осталось: {timeRemaining !== null ? formatTime(timeRemaining) : '--:--'}</div>
      <div>Мои очки - {myScore}</div>
    </>
  )
}

function RoundResultComponent({ stats, myScore }: { stats: RoundStats | null; myScore: number }) {
  const winner = stats?.topPlayers?.[0]

  return (
    <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
      <div className="col-span-2">
        <hr className="border-1" />
      </div>
      <div>Всего</div>
      <div>{stats?.round.totalScore || 0}</div>
      {winner && (
        <>
          <div>Победитель - {winner.username}</div>
          <div>{winner.score}</div>
        </>
      )}
      <div>Мои очки</div>
      <div>{myScore}</div>
    </div>
  )
}

export default RoundDetailsPage
