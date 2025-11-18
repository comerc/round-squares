import Fastify from 'fastify'
import dotenv from 'dotenv'
import { authRoutes } from '@/routes/auth.js'
import { roundsRoutes } from '@/routes/rounds.js'
import { tapRoutes } from '@/routes/tap.js'
import { setupWebSocket } from '@/websocket/index.js'
import cookie from '@fastify/cookie'
import cors from '@fastify/cors'

dotenv.config()

const PORT = parseInt(process.env.PORT || '3000', 10)

async function buildServer() {
  const fastify = Fastify({
    logger: true,
  })

  // Регистрируем плагины
  await fastify.register(cookie, {
    secret: process.env.JWT_SECRET || 'default-secret',
  })

  await fastify.register(cors, {
    origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:5173'],
    credentials: true,
  })

  // Регистрируем WebSocket
  await setupWebSocket(fastify)

  // Регистрируем роуты
  await fastify.register(authRoutes, { prefix: '/api/auth' })
  await fastify.register(roundsRoutes, { prefix: '/api' })
  await fastify.register(tapRoutes, { prefix: '/api' })

  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok' }
  })

  return fastify
}

async function start() {
  try {
    const server = await buildServer()
    await server.listen({ port: PORT, host: '0.0.0.0' })
    console.log(`Server listening on http://localhost:${PORT}`)
  } catch (err) {
    console.error('Error starting server:', err)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  const { closePubSub } = await import('@/db/pubsub.js')
  await closePubSub()
  process.exit(0)
})

process.on('SIGINT', async () => {
  const { closePubSub } = await import('@/db/pubsub.js')
  await closePubSub()
  process.exit(0)
})

start()
