// In-memory cache for OTP codes
// Key: email (hashed for security)
// Value: { code: string, expiresAt: number }

const otpCache = new Map<string, { code: string; expiresAt: number }>()

// OTP lifetime: 5 minutes
const OTP_TTL = 5 * 60 * 1000

/**
 * Generate a 6-digit OTP code
 */
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Hash email for cache key (simple hash for demo)
 */
function hashEmail(email: string): string {
  let hash = 0
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return hash.toString()
}

/**
 * Store OTP code for email
 */
export function storeOtp(email: string): string {
  const code = generateOtp()
  const expiresAt = Date.now() + OTP_TTL
  const key = hashEmail(email)

  otpCache.set(key, { code, expiresAt })
  return code
}

/**
 * Verify OTP code for email
 */
export function verifyOtp(email: string, code: string): boolean {
  const key = hashEmail(email)
  const entry = otpCache.get(key)

  if (!entry) {
    return false
  }

  // Check if expired
  if (Date.now() > entry.expiresAt) {
    otpCache.delete(key)
    return false
  }

  // Check code
  if (entry.code === code) {
    otpCache.delete(key) // One-time use
    return true
  }

  return false
}

/**
 * Clean up expired OTP codes
 */
export function cleanupExpiredOtps(): void {
  const now = Date.now()
  for (const [key, entry] of otpCache.entries()) {
    if (now > entry.expiresAt) {
      otpCache.delete(key)
    }
  }
}

// Run cleanup every minute
setInterval(cleanupExpiredOtps, 60 * 1000)