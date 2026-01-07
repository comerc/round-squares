import { describe, it, expect } from 'vitest'
import { authApi } from '../api/auth.api'

describe('authApi', () => {
  it('should export authApi object', () => {
    expect(authApi).toBeDefined()
    expect(typeof authApi.sendOtp).toBe('function')
    expect(typeof authApi.verifyOtp).toBe('function')
    expect(typeof authApi.login).toBe('function')
    expect(typeof authApi.me).toBe('function')
  })

  it('should have correct API methods', () => {
    // Basic smoke test - methods exist
    expect(authApi.sendOtp).toBeInstanceOf(Function)
    expect(authApi.verifyOtp).toBeInstanceOf(Function)
    expect(authApi.login).toBeInstanceOf(Function)
    expect(authApi.register).toBeInstanceOf(Function)
    expect(authApi.logout).toBeInstanceOf(Function)
    expect(authApi.me).toBeInstanceOf(Function)
  })
})