import { api } from './client.js'

export interface TapResponse {
  tapCount: number
  score: number
  roundTotalScore: number
  roundId: string
}

export const tapApi = {
  tap: (roundId: string) => api.post<TapResponse>(`/api/rounds/${roundId}/tap`),
}
