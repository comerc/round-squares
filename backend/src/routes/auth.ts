import type { FastifyInstance } from 'fastify'
import { db } from '@/db/index.js'
import { users } from '@/db/schema.js'
import { eq } from 'drizzle-orm'
import { hashPassword, comparePassword } from '@/utils/password.js'
import { signToken } from '@/utils/jwt.js'
import { determineRole } from '@/utils/role.js'
import { authenticate } from '@/middleware/auth.js'
import { storeOtp, verifyOtp } from '@/utils/otp.js'
import { sendOtpEmail } from '@/utils/email.js'
import { z } from 'zod'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

const registerSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

const loginWithOtpSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

const verifyOtpSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  email: z.string().email('Invalid email format'),
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must contain only digits'),
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
      // Обработка ошибок валидации Zod
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

  // OTP-based login endpoints
  fastify.post('/login-with-otp', async (request, reply) => {
    try {
      const body = loginWithOtpSchema.parse(request.body)

      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, body.username))
        .limit(1)

      if (!existingUser) {
        return reply.code(404).send({ error: 'User not found' })
      }

      // Verify password
      const isValid = await comparePassword(body.password, existingUser.passwordHash)
      if (!isValid) {
        return reply.code(401).send({ error: 'Invalid password' })
      }

      // Generate and store OTP
      const otpCode = storeOtp(body.email)

      // Send OTP via email
      try {
        await sendOtpEmail(body.email, otpCode)
      } catch (error) {
        console.error('Failed to send OTP email:', error)
        return reply.code(500).send({ error: 'Failed to send OTP' })
      }

      return { otpSent: true, message: 'OTP sent to email' }
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const firstError = error.errors[0]
        return reply.code(400).send({ error: firstError.message || 'Validation error' })
      }
      throw error
    }
  })

  fastify.post('/verify-otp', async (request, reply) => {
    try {
      const body = verifyOtpSchema.parse(request.body)

      // Verify OTP
      const isValidOtp = verifyOtp(body.email, body.otp)
      if (!isValidOtp) {
        return reply.code(401).send({ error: 'Invalid or expired OTP' })
      }

      // Get user data
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, body.username))
        .limit(1)

      if (!user) {
        return reply.code(404).send({ error: 'User not found' })
      }

      // Generate JWT token
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
        return reply.code(400).send({ error: firstError.message || 'Validation error' })
      }
      throw error
    }
  })
}
