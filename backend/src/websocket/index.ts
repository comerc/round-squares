import type { FastifyInstance } from 'fastify'
import { verifyToken } from '@/utils/jwt.js'
import type { JWTPayload } from '@/types/auth.js'
import { setupPostgresPubSub } from '@/db/pubsub.js'

interface WebSocketConnection {
  socket: any
  userId: string
  subscribedRounds: Set<string>
}

class WebSocketManager {
  private connections: Map<string, WebSocketConnection> = new Map()
  private roundRooms: Map<string, Set<string>> = new Map() // roundId -> Set<connectionId>

  addConnection(connectionId: string, socket: any, userId: string) {
    this.connections.set(connectionId, {
      socket,
      userId,
      subscribedRounds: new Set(),
    })
  }

  removeConnection(connectionId: string) {
    const connection = this.connections.get(connectionId)
    if (connection) {
      // Отписываемся от всех раундов
      connection.subscribedRounds.forEach((roundId) => {
        this.unsubscribeFromRound(connectionId, roundId)
      })
      this.connections.delete(connectionId)
    }
  }

  subscribeToRound(connectionId: string, roundId: string) {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    connection.subscribedRounds.add(roundId)

    if (!this.roundRooms.has(roundId)) {
      this.roundRooms.set(roundId, new Set())
    }
    this.roundRooms.get(roundId)!.add(connectionId)
  }

  unsubscribeFromRound(connectionId: string, roundId: string) {
    const connection = this.connections.get(connectionId)
    if (connection) {
      connection.subscribedRounds.delete(roundId)
    }

    const room = this.roundRooms.get(roundId)
    if (room) {
      room.delete(connectionId)
      if (room.size === 0) {
        this.roundRooms.delete(roundId)
      }
    }
  }

  broadcastToRound(roundId: string, message: object) {
    const room = this.roundRooms.get(roundId)
    if (!room) return

    const messageStr = JSON.stringify(message)
    room.forEach((connectionId) => {
      const connection = this.connections.get(connectionId)
      if (connection && connection.socket.readyState === 1) {
        // WebSocket.OPEN = 1
        connection.socket.send(messageStr)
      }
    })
  }

  broadcastToUser(userId: string, message: object) {
    const messageStr = JSON.stringify(message)
    this.connections.forEach((connection) => {
      if (connection.userId === userId && connection.socket.readyState === 1) {
        connection.socket.send(messageStr)
      }
    })
  }
}

export const wsManager = new WebSocketManager()

export async function setupWebSocket(fastify: FastifyInstance) {
  const { default: websocketPlugin } = await import('@fastify/websocket')
  await fastify.register(websocketPlugin)

  // Настраиваем PostgreSQL Pub/Sub для межсерверного broadcast
  await setupPostgresPubSub((channel, payload) => {
    try {
      const message = JSON.parse(payload)

      if (channel === 'round_updates' && message.roundId) {
        // Broadcast обновления раунда всем подписанным клиентам
        wsManager.broadcastToRound(message.roundId, message)
      } else if (channel === 'user_score_updates' && message.userId) {
        // Broadcast обновления личного счета пользователю
        wsManager.broadcastToUser(message.userId, message)
      }
    } catch (error) {
      console.error('Error processing PostgreSQL notification:', error)
    }
  })

  fastify.get('/ws', { websocket: true }, (connection, req) => {
    const connectionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Аутентификация через query параметр или cookie
    const token = (req.query as { token?: string }).token || req.cookies.token

    if (!token) {
      connection.socket.close(1008, 'Unauthorized')
      return
    }

    let payload: JWTPayload
    try {
      payload = verifyToken(token)
    } catch (error) {
      connection.socket.close(1008, 'Invalid token')
      return
    }

    wsManager.addConnection(connectionId, connection.socket, payload.userId)

    connection.socket.on('message', (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString())

        if (data.type === 'subscribe' && data.roundId) {
          wsManager.subscribeToRound(connectionId, data.roundId)
          connection.socket.send(
            JSON.stringify({
              type: 'subscribed',
              roundId: data.roundId,
            }),
          )
        } else if (data.type === 'unsubscribe' && data.roundId) {
          wsManager.unsubscribeFromRound(connectionId, data.roundId)
          connection.socket.send(
            JSON.stringify({
              type: 'unsubscribed',
              roundId: data.roundId,
            }),
          )
        }
      } catch (error) {
        console.error('WebSocket message error:', error)
      }
    })

    connection.socket.on('close', () => {
      wsManager.removeConnection(connectionId)
    })

    connection.socket.on('error', (error: Error) => {
      console.error('WebSocket error:', error)
      wsManager.removeConnection(connectionId)
    })
  })

  // Добавляем методы broadcast в fastify instance
  ;(fastify as any).websocketServer = {
    broadcast: (message: string) => {
      // Broadcast всем подключенным клиентам
      fastify.websocketServer.clients.forEach((client: any) => {
        if (client.readyState === 1) {
          client.send(message)
        }
      })
    },
    broadcastToRound: (roundId: string, message: object) => {
      wsManager.broadcastToRound(roundId, message)
    },
  }
}
