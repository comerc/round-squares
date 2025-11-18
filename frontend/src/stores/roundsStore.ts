import { create } from 'zustand'
import { roundsApi } from '@/api/rounds.api.js'
import type { Round } from '@/types/index.js'

interface RoundsState {
  rounds: Round[]
  currentRound: Round | null
  isLoading: boolean
  error: string | null
  fetchRounds: () => Promise<void>
  fetchRound: (id: string) => Promise<void>
  createRound: (cooldownDuration?: number, roundDuration?: number) => Promise<Round>
  clearError: () => void
}

export const useRoundsStore = create<RoundsState>((set, get) => ({
  rounds: [],
  currentRound: null,
  isLoading: false,
  error: null,

  fetchRounds: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await roundsApi.getRounds()
      set({ rounds: response.rounds, isLoading: false })
    } catch (error: any) {
      set({
        error: error.message || 'Ошибка загрузки раундов',
        isLoading: false,
      })
    }
  },

  fetchRound: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const round = await roundsApi.getRound(id)
      set({ currentRound: round, isLoading: false })
    } catch (error: any) {
      set({
        error: error.message || 'Ошибка загрузки раунда',
        isLoading: false,
      })
      throw error
    }
  },

  createRound: async (cooldownDuration?: number, roundDuration?: number) => {
    set({ isLoading: true, error: null })
    try {
      const round = await roundsApi.createRound({ cooldownDuration, roundDuration })
      set((state) => ({
        rounds: [round, ...state.rounds],
        isLoading: false,
      }))
      return round
    } catch (error: any) {
      set({
        error: error.message || 'Ошибка создания раунда',
        isLoading: false,
      })
      throw error
    }
  },

  clearError: () => set({ error: null }),
}))
