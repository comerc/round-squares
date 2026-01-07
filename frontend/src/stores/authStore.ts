import { create } from 'zustand'
import { authApi } from '@/api/auth.api.js'
import type { User } from '@/types/index.js'
import { setAuthenticated } from '@/utils/auth.js'

interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
  otpSent: boolean
  login: (username: string, password: string) => Promise<void>
  sendOtp: (username: string, email: string, password: string) => Promise<void>
  verifyOtp: (username: string, email: string, otp: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,
  otpSent: false,

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

  sendOtp: async (username: string, email: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      await authApi.sendOtp({ username, email, password })
      set({ otpSent: true, isLoading: false })
    } catch (error: any) {
      set({
        error: error.message || 'Ошибка отправки OTP',
        isLoading: false,
      })
      throw error
    }
  },

  verifyOtp: async (username: string, email: string, otp: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authApi.verifyOtp({ username, email, otp })
      set({ user: response.user, otpSent: false, isLoading: false })
      setAuthenticated(true)
    } catch (error: any) {
      set({
        error: error.message || 'Неверный OTP',
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
