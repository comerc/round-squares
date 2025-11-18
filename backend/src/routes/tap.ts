import type { FastifyInstance } from 'fastify'
import { db } from '@/db/index.js'
import { rounds, userRounds, users } from '@/db/schema.js'
import { eq, sql } from 'drizzle-orm'
import { authenticate } from '@/middleware/auth.js'
import { getRoundStatus, calculateScore } from '@/utils/round.js'
import { notify } from '@/db/pubsub.js'
import { z } from 'zod'

const tapSchema = z.object({
  roundId: z.string().uuid(),
})

export async function tapRoutes(fastify: FastifyInstance) {
  fastify.post('/rounds/:id/tap', { preHandler: [authenticate] }, async (request, reply) => {
    const { id: roundId } = request.params as { id: string }
    const userId = request.user?.userId

    if (!userId) {
      return reply.code(401).send({ error: 'Unauthorized' })
    }

    // Получаем пользователя для проверки роли
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)

    if (!user) {
      return reply.code(404).send({ error: 'User not found' })
    }

    // Транзакция с блокировками для предотвращения race conditions
    try {
      const result = await db.transaction(async (tx) => {
        // Блокируем раунд для обновления (SELECT FOR UPDATE)
        const [round] = await tx
          .select()
          .from(rounds)
          .where(eq(rounds.id, roundId))
          .for('update')
          .limit(1)

        if (!round) {
          const error: any = new Error('Round not found')
          error.statusCode = 404
          throw error
        }

        // Проверяем статус раунда
        const status = getRoundStatus(round.startTime, round.endTime, round.cooldownDuration)

        if (status !== 'active') {
          const error: any = new Error(`Round is not active. Current status: ${status}`)
          error.statusCode = 400
          throw error
        }

        // Блокируем запись пользователя для обновления
        const [existingUserRound] = await tx
          .select()
          .from(userRounds)
          .where(sql`${userRounds.userId} = ${userId} AND ${userRounds.roundId} = ${roundId}`)
          .for('update')
          .limit(1)

        let newTapCount: number
        let newScore: number
        let roundScoreDelta: number

        if (user.role === 'nikita') {
          // Для Никиты тапы не считаются, но запрос работает
          // Не обновляем счетчики
          if (existingUserRound) {
            newTapCount = existingUserRound.tapCount
            newScore = existingUserRound.score
          } else {
            newTapCount = 0
            newScore = 0
          }
          roundScoreDelta = 0
        } else {
          // Для обычных пользователей увеличиваем счетчики
          const currentTapCount = existingUserRound ? existingUserRound.tapCount : 0
          newTapCount = currentTapCount + 1
          newScore = calculateScore(newTapCount)

          const oldScore = existingUserRound ? existingUserRound.score : 0
          roundScoreDelta = newScore - oldScore

          // Обновляем или создаем запись пользователя
          if (existingUserRound) {
            await tx
              .update(userRounds)
              .set({
                tapCount: newTapCount,
                score: newScore,
                updatedAt: new Date(),
              })
              .where(sql`${userRounds.userId} = ${userId} AND ${userRounds.roundId} = ${roundId}`)
          } else {
            await tx.insert(userRounds).values({
              userId,
              roundId,

              tapCount: newTapCount,
              score: newScore,
            })
          }

          // Обновляем общий счет раунда
          await tx
            .update(rounds)
            .set({
              totalScore: sql`${rounds.totalScore} + ${roundScoreDelta}`,
              updatedAt: new Date(),
            })
            .where(eq(rounds.id, roundId))
        }

        // Получаем обновленный раунд
        const [updatedRound] = await tx.select().from(rounds).where(eq(rounds.id, roundId)).limit(1)

        return {
          tapCount: newTapCount,
          score: newScore,
          roundTotalScore: updatedRound?.totalScore || 0,
          roundId,
        }
      })

      // Broadcast через PostgreSQL NOTIFY для межсерверного broadcast
      // Все инстансы получат уведомление через LISTEN и отправят через WebSocket
      // Ошибки notify не должны ломать основной запрос
      notify('round_updates', {
        type: 'round:update',
        roundId,
        data: {
          totalScore: result.roundTotalScore,
          userScore: result.score,
          userId,
        },
      }).catch((err) => console.error('Failed to notify round_updates:', err))

      // Отправляем обновление личного счета пользователю
      notify('user_score_updates', {
        type: 'user:score',
        roundId,
        userId,
        data: {
          score: result.score,
          tapCount: result.tapCount,
        },
      }).catch((err) => console.error('Failed to notify user_score_updates:', err))

      return result
    } catch (error: any) {
      if (error.statusCode) {
        return reply.code(error.statusCode).send({ error: error.message })
      }
      if (error.message?.includes('not active') || error.message?.includes('not found')) {
        return reply.code(400).send({ error: error.message })
      }
      throw error
    }
  })
}
