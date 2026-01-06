interface OtpData {
  code: string
  expiresAt: number
  attempts: number
}

const OTP_TTL = 60 * 1000 // 1 minute
const CLEANUP_INTERVAL = 5 * 60 * 1000 // 5 minutes
const MAX_ATTEMPTS = 3

export class OtpStore {
  private store: Map<string, OtpData> = new Map()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    this.cleanupInterval = setInterval(() => this.cleanup(), CLEANUP_INTERVAL)
  }

  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  saveOtp(username: string, code: string) {
    this.store.set(username, {
      code,
      expiresAt: Date.now() + OTP_TTL,
      attempts: 0,
    })
  }

  verifyOtp(
    username: string,
    code: string,
  ): { valid: boolean; reason?: 'expired' | 'invalid' | 'max_attempts' } {
    const data = this.store.get(username)
    if (!data) {
      return { valid: false, reason: 'invalid' }
    }

    if (Date.now() > data.expiresAt) {
      this.store.delete(username)
      return { valid: false, reason: 'expired' }
    }

    if (data.attempts >= MAX_ATTEMPTS) {
      this.store.delete(username)
      return { valid: false, reason: 'max_attempts' }
    }

    if (data.code !== code) {
      data.attempts++
      this.store.set(username, data) // Update attempts
      if (data.attempts >= MAX_ATTEMPTS) {
        this.store.delete(username)
        return { valid: false, reason: 'max_attempts' }
      }
      return { valid: false, reason: 'invalid' }
    }

    this.store.delete(username)
    return { valid: true }
  }

  private cleanup() {
    const now = Date.now()
    for (const [username, data] of this.store.entries()) {
      if (now > data.expiresAt) {
        this.store.delete(username)
      }
    }
  }

  stop() {
    clearInterval(this.cleanupInterval)
  }
}

export const otpStore = new OtpStore()
