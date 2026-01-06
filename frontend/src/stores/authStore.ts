import { create } from 'zustand'
import { authApi } from '@/api/auth.api.js'
import type { User } from '@/types/index.js'
import { setAuthenticated } from '@/utils/auth.js'

interface AuthState {
  user: User | null
  isLoading: boolean
  isOtpSent: boolean
  error: string | null
  login: (username: string, password: string, email: string) => Promise<void>
  verifyOtp: (username: string, otp: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isOtpSent: false,
  error: null,

  login: async (username: string, password: string, email: string) => {
    set({ isLoading: true, error: null })
    try {
      await authApi.login({ username, password, email })
      set({ isLoading: false, isOtpSent: true })
      // Не устанавливаем user и authenticated, ждем OTP
    } catch (error: any) {
      set({
        error: error.message || 'Ошибка входа',
        isLoading: false,
        isOtpSent: false,
      })
      throw error
    }
  },

  verifyOtp: async (username: string, otp: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authApi.verifyOtp({ username, otp })
      set({ user: response.user, isLoading: false, isOtpSent: false })
      setAuthenticated(true)
    } catch (error: any) {
      set({
        error: error.message || 'Ошибка проверки кода',
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
      set({ user: null, isOtpSent: false })
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
