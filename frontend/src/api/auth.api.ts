import { api } from './client.js'
import type { User } from '@/types/index.js'

export interface LoginRequest {
  username: string
  password: string
  email: string
}

export interface Verify2faRequest {
  username: string
  code: string
}

export interface RegisterRequest {
  username: string
  password: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface LoginResponse {
  require2fa: boolean
  message?: string
  user?: User
  token?: string
}

export const authApi = {
  login: (credentials: LoginRequest) => api.post<LoginResponse>('/api/auth/login', credentials),

  verify2fa: (data: Verify2faRequest) => api.post<AuthResponse>('/api/auth/2fa/verify', data),

  register: (data: RegisterRequest) => api.post<AuthResponse>('/api/auth/register', data),

  logout: () => api.post('/api/auth/logout'),

  me: () => api.get<{ user: User }>('/api/auth/me'),
}
