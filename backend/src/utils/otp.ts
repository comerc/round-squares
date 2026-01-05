// Предопределенные легко запоминаемые 5-значные коды
const MEMORABLE_OTP_CODES = [
  '11223', '22334', '33445', '44556', '55667', '66778', '77889', '88990',
  '99887', '88776', '77665', '66554', '55443', '44332', '33221', '22110',
  '13579', '24680', '12345', '54321', '11111', '22222', '33333', '44444'
]

export function generateOTP(): string {
  // Выбираем случайный код из предопределенного списка
  return MEMORABLE_OTP_CODES[Math.floor(Math.random() * MEMORABLE_OTP_CODES.length)]
}

interface OTPEntity {
  code: string
  expiresAt: number
  attempts: number
}

class OTPStore {
  private store = new Map<string, OTPEntity>()

  set(key: string, code: string, ttlMinutes = 1): void {
    this.store.set(key, {
      code,
      expiresAt: Date.now() + (ttlMinutes * 60 * 1000),
      attempts: 0
    })
  }

  verify(key: string, inputCode: string): boolean {
    const entity = this.store.get(key)
    if (!entity) return false

    entity.attempts++

    // Проверяем expiration
    if (Date.now() > entity.expiresAt) {
      this.store.delete(key)
      return false
    }

    // Проверяем attempts (макс 3 попытки)
    if (entity.attempts > 3) {
      this.store.delete(key)
      return false
    }

    const isValid = entity.code === inputCode
    if (isValid) {
      this.store.delete(key) // Одноразовый - удаляем после использования
    }

    return isValid
  }

  cleanup(): void {
    // Очистка истекших кодов
    for (const [key, entity] of this.store.entries()) {
      if (Date.now() > entity.expiresAt) {
        this.store.delete(key)
      }
    }
  }

  // Для генерации уникального ключа логина
  generateLoginKey(username: string): string {
    return `${username}:${Date.now()}:${Math.random()}`
  }
}

export const otpStore = new OTPStore()

// Запускаем cleanup каждые 5 минут
setInterval(() => otpStore.cleanup(), 5 * 60 * 1000)
