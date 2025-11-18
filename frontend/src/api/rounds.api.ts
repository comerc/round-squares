import { api } from './client.js'
import type { Round, RoundStats } from '@/types/index.js'

export interface CreateRoundRequest {
  cooldownDuration?: number
  roundDuration?: number
}

export const roundsApi = {
  getRounds: () => api.get<{ rounds: Round[] }>('/api/rounds'),

  getRound: (id: string) => api.get<Round>(`/api/rounds/${id}`),

  createRound: (data?: CreateRoundRequest) => api.post<Round>('/api/rounds', data),

  getRoundStats: (id: string) => api.get<RoundStats>(`/api/rounds/${id}/stats`),
}
