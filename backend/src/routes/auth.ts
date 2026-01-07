import type { FastifyInstance } from 'fastify'
import { db } from '@/db/index.js'
import { users } from '@/db/schema.js'
import { eq } from 'drizzle-orm'
import { hashPassword, comparePassword } from '@/utils/password.js'
import { signToken } from '@/utils/jwt.js'
import { determineRole } from '@/utils/role.js'
import { authenticate } from '@/middleware/auth.js'
import { generateOtp, saveOtp, verifyOtp } from '@/utils/otp.js'
import { z } from 'zod'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  email: z.string().email('Invalid email format').min(1, 'Email is required'),
})

const verifySchema = z.object({
  username: z.string().min(1, 'Username is required'),
  code: z.string().length(6, 'Code must be 6 digits'),
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

      // Generate and send OTP
      const code = generateOtp()
      saveOtp(user.username, code)

      // Log "sending" email
      console.log(
        `[Email Mock] Sending OTP ${code} to ${body.email} for user ${user.username}`,
      )

      return {
        require2fa: true,
        message: 'Code sent to email',
      }
    } catch (error: any) {
      // Обработка ошибок валидации Zod
      if (error.name === 'ZodError') {
        const firstError = error.errors[0]
        return reply
          .code(400)
          .send({ error: firstError.message || 'Ошибка валидации' })
      }
      throw error
    }
  })

  fastify.post('/2fa/verify', async (request, reply) => {
    try {
      const body = verifySchema.parse(request.body)

      const isValid = verifyOtp(body.username, body.code)
      if (!isValid) {
        return reply.code(401).send({ error: 'Invalid or expired code' })
      }

      // Code is valid, issue token
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, body.username))
        .limit(1)

      if (!user) {
        return reply.code(404).send({ error: 'User not found' })
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
      if (error.name === 'ZodError') {
        const firstError = error.errors[0]
        return reply
          .code(400)
          .send({ error: firstError.message || 'Validation error' })
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

  fastify.post(
    '/logout',
    { schema: { body: false } },
    async (request, reply) => {
      reply.clearCookie('token', { path: '/' })
      return { message: 'Logged out successfully' }
    },
  )

  fastify.get('/me', { preHandler: [authenticate] }, async (request, reply) => {
    if (!request.user) {
      return reply.code(401).send({ error: 'Unauthorized' })
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, request.user.userId))
      .limit(1)

    if (!user) {
      return reply.code(404).send({ error: 'User not found' })
    }

    const { passwordHash, ...userWithoutPassword } = user
    return { user: userWithoutPassword }
  })
}
