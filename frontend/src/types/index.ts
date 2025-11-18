export type UserRole = 'admin' | 'survivor' | 'nikita'

export type RoundStatus = 'cooldown' | 'active' | 'finished'

export interface User {
  id: string
  username: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

export interface Round {
  id: string
  startTime: string
  endTime: string
  cooldownDuration: number
  totalScore: number
  status: RoundStatus
  createdAt: string
  updatedAt: string
}

export interface UserRound {
  userId: string
  roundId: string
  tapCount: number
  score: number
  createdAt: string
  updatedAt: string
}

export interface RoundStats {
  round: {
    id: string
    totalScore: number
    startTime: string
    endTime: string
  }
  topPlayers: Array<{
    userId: string
    username: string
    score: number
    tapCount: number
  }>
  myStats: {
    score: number
    tapCount: number
  } | null
}

export interface WebSocketMessage {
  type: 'round:update' | 'round:status' | 'user:score' | 'subscribed' | 'unsubscribed'
  roundId?: string
  data?: any
}
