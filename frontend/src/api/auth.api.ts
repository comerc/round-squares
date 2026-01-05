import { api } from './client.js'
import type { User } from '@/types/index.js'

export interface LoginRequest {
  username: string
  password: string
  email: string
}

export interface LoginResponse {
  requiresOTP: boolean
  loginKey?: string
  message?: string
  user?: User
  token?: string
}

export interface VerifyOTPRequest {
  loginKey: string
  otpCode: string
}

export interface RegisterRequest {
  username: string
  password: string
}

export interface AuthResponse {
  user: User
  token: string
}

export const authApi = {
  login: (credentials: LoginRequest) => api.post<LoginResponse>('/api/auth/login', credentials),

  verify2FA: (data: VerifyOTPRequest) => api.post<AuthResponse>('/api/auth/verify-2fa', data),

  register: (data: RegisterRequest) => api.post<AuthResponse>('/api/auth/register', data),

  logout: () => api.post('/api/auth/logout'),

  me: () => api.get<{ user: User }>('/api/auth/me'),
}
