import { api } from './client.js'
import type { User } from '@/types/index.js'

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  password: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface OtpRequest {
  username: string
  email: string
  password: string
}

export interface OtpVerifyRequest {
  username: string
  email: string
  otp: string
}

export interface OtpResponse {
  otpSent: boolean
  message?: string
}

export const authApi = {
  login: (credentials: LoginRequest) => api.post<AuthResponse>('/api/auth/login', credentials),

  sendOtp: (data: OtpRequest) => api.post<OtpResponse>('/api/auth/login-with-otp', data),

  verifyOtp: (data: OtpVerifyRequest) => api.post<AuthResponse>('/api/auth/verify-otp', data),

  register: (data: RegisterRequest) => api.post<AuthResponse>('/api/auth/register', data),

  logout: () => api.post('/api/auth/logout'),

  me: () => api.get<{ user: User }>('/api/auth/me'),
}
