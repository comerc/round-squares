import { Link } from 'react-router-dom'
import { Button, Spin, message } from 'antd'
import UserHeader from '@/components/UserHeader'
import { useRoundsStore, useAuthStore } from '@/app/store'
import { useEffect, useState } from 'react'
import { formatDate, getStatusText, getRoundStatus } from '@/utils/round'

function RoundsListPage() {
  const { rounds, isLoading, error, fetchRounds, createRound, clearError } = useRoundsStore()
  const user = useAuthStore((state) => state.user)
  const isAdmin = user?.role === 'admin'
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  useEffect(() => {
    fetchRounds().finally(() => setIsInitialLoad(false))
  }, [fetchRounds])

  useEffect(() => {
    if (error) {
      message.error(error)
      clearError()
    }
  }, [error, clearError])

  const handleCreateRound = async () => {
    try {
      await createRound()
      message.success('Раунд создан успешно')
    } catch (err) {
      // Ошибка уже обработана в store
    }
  }

  return (
    <div className="my-12 flex h-full min-h-0 w-[600px] flex-col border-2 border-blue-500 bg-white">
      <UserHeader title="Список РАУНДОВ" />
      <div className="flex flex-1 flex-col overflow-y-auto px-5 py-3">
        {isAdmin && (
          <div className="mb-3">
            <Button type="primary" onClick={handleCreateRound} loading={isLoading}>
              Создать раунд
            </Button>
          </div>
        )}
        {isInitialLoad ? (
          <div className="flex justify-center py-10">
            <Spin size="large" />
          </div>
        ) : rounds.length === 0 ? (
          <div className="flex justify-center py-10 text-gray-500">Нет раундов</div>
        ) : (
          rounds.map((round) => <RoundItem key={round.id} round={round} />)
        )}
      </div>
    </div>
  )
}

function RoundItem({
  round,
}: {
  round: {
    id: string
    startTime: string
    endTime: string
    status: string
    cooldownDuration: number
  }
}) {
  const [currentStatus, setCurrentStatus] = useState(round.status)

  // Обновляем статус в реальном времени
  useEffect(() => {
    const updateStatus = () => {
      const status = getRoundStatus(round.startTime, round.endTime, round.cooldownDuration)
      setCurrentStatus(status)
    }

    // Обновляем сразу
    updateStatus()

    // Обновляем каждую секунду
    const interval = setInterval(updateStatus, 1000)

    return () => clearInterval(interval)
  }, [round.startTime, round.endTime, round.cooldownDuration])

  return (
    <div className="mt-3 mb-5 flex flex-col border-2 border-purple-500 px-5 py-2">
      <div>
        ● Round ID:{' '}
        <Link
          className="text-blue-500 visited:text-purple-500 hover:text-red-500"
          title="Раунд"
          to={`/round/${round.id}`}
        >
          {round.id}
        </Link>
      </div>
      <div className="mt-5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <div>Start:</div>
        <div>{formatDate(round.startTime)}</div>
        <div>End:</div>
        <div>{formatDate(round.endTime)}</div>
        <div className="col-span-2 mt-5">
          <hr className="border-1" />
        </div>
        <div>Статус:</div>
        <div>{getStatusText(currentStatus)}</div>
      </div>
    </div>
  )
}

export default RoundsListPage
