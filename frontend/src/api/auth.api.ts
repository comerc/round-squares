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

export const authApi = {
  login: (credentials: LoginRequest) => api.post<AuthResponse>('/api/auth/login', credentials),

  register: (data: RegisterRequest) => api.post<AuthResponse>('/api/auth/register', data),

  logout: () => api.post('/api/auth/logout'),

  me: () => api.get<{ user: User }>('/api/auth/me'),
}
