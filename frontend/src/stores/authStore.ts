import { create } from 'zustand'
import { authApi } from '@/api/auth.api.js'
import type { User } from '@/types/index.js'
import { setAuthenticated } from '@/utils/auth.js'

interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authApi.login({ username, password })
      set({ user: response.user, isLoading: false })
      setAuthenticated(true)
    } catch (error: any) {
      set({
        error: error.message || 'Ошибка входа',
        isLoading: false,
      })
      throw error
    }
  },

  register: async (username: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authApi.register({ username, password })
      set({ user: response.user, isLoading: false })
      setAuthenticated(true)
    } catch (error: any) {
      set({
        error: error.message || 'Ошибка регистрации',
        isLoading: false,
      })
      throw error
    }
  },

  logout: async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      set({ user: null })
      setAuthenticated(false)
    }
  },

  checkAuth: async () => {
    set({ isLoading: true })
    try {
      const response = await authApi.me()
      set({ user: response.user, isLoading: false })
      setAuthenticated(true)
    } catch (error) {
      set({ user: null, isLoading: false })
      setAuthenticated(false)
    }
  },

  clearError: () => set({ error: null }),
}))
