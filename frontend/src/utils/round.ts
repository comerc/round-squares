import type { RoundStatus } from '@/types/index.js'
import { differenceInSeconds, format } from 'date-fns'
import { ru } from 'date-fns/locale'

export function getRoundStatus(
  startTime: string,
  endTime: string,
  cooldownDuration: number,
): RoundStatus {
  const now = new Date()
  const start = new Date(startTime)
  const end = new Date(endTime)
  const cooldownStart = new Date(start.getTime() - cooldownDuration * 1000)

  // Cooldown период: от cooldownStart до startTime
  if (now >= cooldownStart && now < start) {
    return 'cooldown'
  }

  // Активный период: от startTime до endTime
  if (now >= start && now < end) {
    return 'active'
  }

  // Завершен: после endTime или до cooldownStart (если раунд еще не начался)
  return 'finished'
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export function calculateScore(tapCount: number): number {
  // Каждый 11-й тап дает 10 очков, остальные - 1 очко
  // Например: 10 тапов = 10 очков, 11 тапов = 20 очков (10*1 + 1*10)
  const bonusTaps = Math.floor(tapCount / 11) // Количество бонусных тапов
  const regularTaps = tapCount - bonusTaps // Остальные тапы (исключая бонусные)
  return regularTaps * 1 + bonusTaps * 10
}

export function formatDate(dateString: string): string {
  return format(new Date(dateString), 'dd.MM.yyyy, HH:mm:ss', { locale: ru })
}

export function getStatusText(status: string): string {
  switch (status) {
    case 'cooldown':
      return 'Cooldown'
    case 'active':
      return 'Активен'
    case 'finished':
      return 'Завершен'
    default:
      return ''
  }
}

export function getStatusTitle(status: string | null | undefined): string {
  switch (status) {
    case 'cooldown':
      return 'Cooldown'
    case 'active':
      return 'Раунд'
    case 'finished':
      return 'Раунд завершен'
    default:
      return ''
  }
}

export function calculateTimeRemaining(
  startTime: string,
  endTime: string,
  cooldownDuration: number,
): number | null {
  const now = new Date()
  const start = new Date(startTime)
  const end = new Date(endTime)
  const cooldownEnd = new Date(start.getTime() - cooldownDuration * 1000)

  if (now < cooldownEnd) {
    return differenceInSeconds(cooldownEnd, now)
  }

  if (now >= start && now < end) {
    return differenceInSeconds(end, now)
  }

  return 0
}
