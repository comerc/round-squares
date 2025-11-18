import type { FastifyRequest, FastifyReply } from 'fastify'
import { verifyToken } from '@/utils/jwt.js'
import type { JWTPayload } from '@/types/auth.js'

declare module 'fastify' {
  interface FastifyRequest {
    user?: JWTPayload
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const token = request.cookies.token

    if (!token) {
      return reply.code(401).send({ error: 'Unauthorized' })
    }

    const payload = verifyToken(token)
    request.user = payload
  } catch (error) {
    return reply.code(401).send({ error: 'Invalid token' })
  }
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  await authenticate(request, reply)

  if (request.user?.role !== 'admin') {
    return reply.code(403).send({ error: 'Forbidden: Admin access required' })
  }
}
