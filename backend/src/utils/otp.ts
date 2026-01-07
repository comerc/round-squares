interface OtpData {
  code: string
  expiresAt: number
}

const otpStore = new Map<string, OtpData>()

export function generateOtp(length: number = 6): string {
  let otp = ''
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10).toString()
  }
  return otp
}

export function saveOtp(
  username: string,
  code: string,
  ttlSeconds: number = 300,
): void {
  const expiresAt = Date.now() + ttlSeconds * 1000
  otpStore.set(username, { code, expiresAt })
}

export function verifyOtp(username: string, code: string): boolean {
  const data = otpStore.get(username)
  if (!data) return false

  if (Date.now() > data.expiresAt) {
    otpStore.delete(username)
    return false
  }

  if (data.code !== code) {
    return false
  }

  // Consume OTP on success
  otpStore.delete(username)
  return true
}
