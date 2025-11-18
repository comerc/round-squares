import { BONUS_TAP_MULTIPLIER, BONUS_SCORE, REGULAR_SCORE } from './constants.js'

export type RoundStatus = 'cooldown' | 'active' | 'finished'

export function getRoundStatus(
  startTime: Date,
  endTime: Date,
  cooldownDuration: number,
): RoundStatus {
  const now = new Date()
  const cooldownStart = new Date(startTime.getTime() - cooldownDuration * 1000)

  // Cooldown период: от cooldownStart до startTime
  if (now >= cooldownStart && now < startTime) {
    return 'cooldown'
  }

  // Активный период: от startTime до endTime
  if (now >= startTime && now < endTime) {
    return 'active'
  }

  // Завершен: после endTime или до cooldownStart (если раунд еще не начался)
  return 'finished'
}

export function calculateScore(tapCount: number): number {
  // Каждый 11-й тап дает 10 очков, остальные - 1 очко
  // Например: 10 тапов = 10 очков, 11 тапов = 20 очков (10*1 + 1*10)
  const bonusTaps = Math.floor(tapCount / BONUS_TAP_MULTIPLIER) // Количество бонусных тапов
  const regularTaps = tapCount - bonusTaps // Остальные тапы (исключая бонусные)
  return regularTaps * REGULAR_SCORE + bonusTaps * BONUS_SCORE
}
