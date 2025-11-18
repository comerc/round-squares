import type { User } from '@/db/schema.js'

export interface JWTPayload {
  userId: string
  username: string
  role: 'admin' | 'survivor' | 'nikita'
}

export interface AuthRequest {
  username: string
  password: string
}

export interface AuthResponse {
  user: Omit<User, 'passwordHash'>
  token: string
}
