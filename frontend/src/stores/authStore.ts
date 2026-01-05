import { create } from 'zustand'
import { authApi } from '@/api/auth.api.js'
import type { User } from '@/types/index.js'
import { setAuthenticated } from '@/utils/auth.js'

interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
  // 2FA states
  loginStep: 'credentials' | 'otp'
  loginKey: string | null
  pendingLoginData: { username: string; password: string; email: string } | null
  // Actions
  login: (username: string, password: string, email: string) => Promise<void>
  verifyOTP: (otpCode: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  clearError: () => void
  resetLoginFlow: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,
  loginStep: 'credentials',
  loginKey: null,
  pendingLoginData: null,

  login: async (username: string, password: string, email: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authApi.login({ username, password, email })

      if (response.requiresOTP && response.loginKey) {
        // Переходим к шагу OTP
        set({
          loginStep: 'otp',
          loginKey: response.loginKey,
          pendingLoginData: { username, password, email },
          isLoading: false
        })
      } else if (response.user && response.token) {
        // Прямой логин (старый flow для обратной совместимости)
        set({ user: response.user, isLoading: false })
        setAuthenticated(true)
      }
    } catch (error: any) {
      set({
        error: error.message || 'Ошибка входа',
        isLoading: false,
      })
      throw error
    }
  },

  verifyOTP: async (otpCode: string) => {
    const { loginKey } = get()
    if (!loginKey) {
      throw new Error('No login session found')
    }

    set({ isLoading: true, error: null })
    try {
      const response = await authApi.verify2FA({ loginKey, otpCode })
      set({
        user: response.user,
        loginStep: 'credentials',
        loginKey: null,
        pendingLoginData: null,
        isLoading: false
      })
      setAuthenticated(true)
    } catch (error: any) {
      set({
        error: error.message || 'Неверный код OTP',
        isLoading: false,
      })
      throw error
    }
  },

  resetLoginFlow: () => set({
    loginStep: 'credentials',
    loginKey: null,
    pendingLoginData: null,
    error: null
  }),

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
