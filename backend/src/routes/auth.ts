import type { FastifyInstance } from 'fastify'
import { db } from '@/db/index.js'
import { users } from '@/db/schema.js'
import { eq } from 'drizzle-orm'
import { hashPassword, comparePassword } from '@/utils/password.js'
import { signToken } from '@/utils/jwt.js'
import { determineRole } from '@/utils/role.js'
import { authenticate } from '@/middleware/auth.js'
import { emailService } from '@/services/email.js'
import { generateOTP, otpStore } from '@/utils/otp.js'
import { z } from 'zod'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  email: z.string().email('Valid email is required'),
})

const verifyOTPSchema = z.object({
  loginKey: z.string().min(1, 'Login key is required'),
  otpCode: z.string().min(5, 'OTP code must be 5 digits').max(5, 'OTP code must be 5 digits'),
})

const registerSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/login', async (request, reply) => {
    try {
      const body = loginSchema.parse(request.body)

      // Дополнительная проверка: пароль не должен быть пустым
      if (!body.password || body.password.trim().length === 0) {
        return reply.code(400).send({ error: 'Пароль обязателен' })
      }

      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, body.username))
        .limit(1)

      let user

      if (!existingUser) {
        // Пользователя нет в базе - создаем нового автоматически
        const passwordHash = await hashPassword(body.password)
        const role = determineRole(body.username)

        const [newUser] = await db
          .insert(users)
          .values({
            username: body.username,
            passwordHash,
            role,
          })
          .returning()

        user = newUser
      } else {
        // Пользователь есть - проверяем пароль
        const isValid = await comparePassword(body.password, existingUser.passwordHash)

        if (!isValid) {
          return reply.code(401).send({ error: 'Invalid credentials' })
        }

        user = existingUser
      }

      // Генерируем OTP и отправляем на email
      const otpCode = generateOTP()
      const loginKey = otpStore.generateLoginKey(body.username)

      try {
        await emailService.sendOTP(body.email, otpCode)
        otpStore.set(loginKey, otpCode, 1) // 1 минута

        return {
          requiresOTP: true,
          loginKey,
          message: 'OTP code sent to your email'
        }
      } catch (emailError) {
        console.error('Failed to send OTP email:', emailError)
        return reply.code(500).send({ error: 'Failed to send OTP email' })
      }
    } catch (error: any) {
      // Обработка ошибок валидации Zod
      if (error.name === 'ZodError') {
        const firstError = error.errors[0]
        return reply.code(400).send({ error: firstError.message || 'Ошибка валидации' })
      }
      throw error
    }
  })

  fastify.post('/verify-2fa', async (request, reply) => {
    try {
      const body = verifyOTPSchema.parse(request.body)

      // Проверяем OTP
      const isValidOTP = otpStore.verify(body.loginKey, body.otpCode)

      if (!isValidOTP) {
        return reply.code(401).send({ error: 'Invalid or expired OTP code' })
      }

      // Извлекаем username из loginKey
      const username = body.loginKey.split(':')[0]

      // Получаем пользователя из БД
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1)

      if (!user) {
        return reply.code(404).send({ error: 'User not found' })
      }

      // Генерируем JWT токен
      const token = signToken({
        userId: user.id,
        username: user.username,
        role: user.role,
      })

      reply.setCookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      })

      const { passwordHash: _, ...userWithoutPassword } = user

      return {
        user: userWithoutPassword,
        token,
      }
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const firstError = error.errors[0]
        return reply.code(400).send({ error: firstError.message || 'Ошибка валидации' })
      }
      throw error
    }
  })

  fastify.post('/register', async (request, reply) => {
    const body = registerSchema.parse(request.body)

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.username, body.username))
      .limit(1)

    if (existingUser) {
      return reply.code(409).send({ error: 'Username already exists' })
    }

    const passwordHash = await hashPassword(body.password)
    const role = determineRole(body.username)

    const [newUser] = await db
      .insert(users)
      .values({
        username: body.username,
        passwordHash,
        role,
      })
      .returning()

    const token = signToken({
      userId: newUser.id,
      username: newUser.username,
      role: newUser.role,
    })

    reply.setCookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    })

    const { passwordHash: _, ...userWithoutPassword } = newUser

    return {
      user: userWithoutPassword,
      token,
    }
  })

  fastify.post('/logout', { schema: { body: false } }, async (request, reply) => {
    reply.clearCookie('token', { path: '/' })
    return { message: 'Logged out successfully' }
  })

  fastify.get('/me', { preHandler: [authenticate] }, async (request, reply) => {
    if (!request.user) {
      return reply.code(401).send({ error: 'Unauthorized' })
    }

    const [user] = await db.select().from(users).where(eq(users.id, request.user.userId)).limit(1)

    if (!user) {
      return reply.code(404).send({ error: 'User not found' })
    }

    const { passwordHash, ...userWithoutPassword } = user
    return { user: userWithoutPassword }
  })
}
