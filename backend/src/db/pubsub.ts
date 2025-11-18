import postgres from 'postgres'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}

// Отдельное подключение для LISTEN (нужно для блокирующих операций)
const listenClient = postgres(connectionString, {
  max: 1, // Одно соединение для LISTEN
})

// Отдельное подключение для NOTIFY (чтобы не блокировать основное)
const notifyClient = postgres(connectionString, {
  max: 1,
})

export interface NotificationHandler {
  (channel: string, payload: string): void
}

let notificationHandler: NotificationHandler | null = null
let isListening = false

/**
 * Подписывается на PostgreSQL каналы для межсерверного broadcast
 */
export async function setupPostgresPubSub(handler: NotificationHandler) {
  if (isListening) {
    return
  }

  notificationHandler = handler

  // Подписываемся на каналы
  await listenClient.unsafe('LISTEN round_updates')
  await listenClient.unsafe('LISTEN user_score_updates')

  // Обработка уведомлений
  listenClient.listen('round_updates', (msg) => {
    if (notificationHandler) {
      notificationHandler('round_updates', msg.payload)
    }
  })

  listenClient.listen('user_score_updates', (msg) => {
    if (notificationHandler) {
      notificationHandler('user_score_updates', msg.payload)
    }
  })

  isListening = true
  console.log('PostgreSQL Pub/Sub: Listening to channels')
}

/**
 * Отправляет уведомление через PostgreSQL NOTIFY
 * Используется в транзакциях для межсерверного broadcast
 */
export async function notify(channel: string, payload: object) {
  const payloadStr = JSON.stringify(payload)
  await notifyClient.unsafe(`NOTIFY ${channel}, ${notifyClient.unsafe.escapeLiteral(payloadStr)}`)
}

/**
 * Закрывает соединения для LISTEN и NOTIFY
 */
export async function closePubSub() {
  if (isListening) {
    await listenClient.unsafe('UNLISTEN round_updates')
    await listenClient.unsafe('UNLISTEN user_score_updates')
    await listenClient.end()
    await notifyClient.end()
    isListening = false
  }
}
