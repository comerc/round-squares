import type { FastifyInstance } from 'fastify'
import { db } from '@/db/index.js'
import { rounds, userRounds, users } from '@/db/schema.js'
import { eq, desc, sql } from 'drizzle-orm'
import { authenticate, requireAdmin } from '@/middleware/auth.js'
import { getRoundStatus } from '@/utils/round.js'
import { z } from 'zod'
import dotenv from 'dotenv'

dotenv.config()

const ROUND_DURATION = parseInt(process.env.ROUND_DURATION || '60', 10)
const COOLDOWN_DURATION = parseInt(process.env.COOLDOWN_DURATION || '30', 10)

const createRoundSchema = z.object({
  cooldownDuration: z.number().int().positive().optional(),
  roundDuration: z.number().int().positive().optional(),
})

export async function roundsRoutes(fastify: FastifyInstance) {
  fastify.get('/rounds', { preHandler: [authenticate] }, async (request, reply) => {
    const allRounds = await db.select().from(rounds).orderBy(desc(rounds.createdAt))

    const roundsWithStatus = allRounds.map((round) => {
      const status = getRoundStatus(round.startTime, round.endTime, round.cooldownDuration)
      return {
        ...round,
        status,
      }
    })

    return { rounds: roundsWithStatus }
  })

  fastify.get('/rounds/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const [round] = await db.select().from(rounds).where(eq(rounds.id, id)).limit(1)

    if (!round) {
      return reply.code(404).send({ error: 'Round not found' })
    }

    const status = getRoundStatus(round.startTime, round.endTime, round.cooldownDuration)

    return {
      ...round,
      status,
    }
  })

  fastify.post('/rounds', { preHandler: [requireAdmin] }, async (request, reply) => {
    const body = createRoundSchema.parse(request.body || {})

    const cooldown = body.cooldownDuration || COOLDOWN_DURATION
    const duration = body.roundDuration || ROUND_DURATION

    const now = new Date()
    const startTime = new Date(now.getTime() + cooldown * 1000)
    const endTime = new Date(startTime.getTime() + duration * 1000)

    const [newRound] = await db
      .insert(rounds)
      .values({
        startTime,
        endTime,
        cooldownDuration: cooldown,
        totalScore: 0,
      })
      .returning()

    const status = getRoundStatus(newRound.startTime, newRound.endTime, newRound.cooldownDuration)

    return {
      ...newRound,
      status,
    }
  })

  fastify.get('/rounds/:id/stats', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const userId = request.user?.userId

    const [round] = await db.select().from(rounds).where(eq(rounds.id, id)).limit(1)

    if (!round) {
      return reply.code(404).send({ error: 'Round not found' })
    }

    // Получаем топ игроков
    const topPlayers = await db
      .select({
        userId: userRounds.userId,
        username: users.username,
        score: userRounds.score,
        tapCount: userRounds.tapCount,
      })
      .from(userRounds)
      .innerJoin(users, eq(userRounds.userId, users.id))
      .where(eq(userRounds.roundId, id))
      .orderBy(desc(userRounds.score))
      .limit(10)

    // Получаем статистику текущего пользователя
    let myStats = null
    if (userId) {
      const [myRound] = await db
        .select()
        .from(userRounds)
        .where(sql`${userRounds.userId} = ${userId} AND ${userRounds.roundId} = ${id}`)
        .limit(1)

      if (myRound) {
        myStats = {
          score: myRound.score,
          tapCount: myRound.tapCount,
        }
      }
    }

    return {
      round: {
        id: round.id,
        totalScore: round.totalScore,
        startTime: round.startTime,
        endTime: round.endTime,
      },
      topPlayers,
      myStats,
    }
  })
}
