import { create } from 'zustand'
import type { WebSocketMessage } from '@/types/index.js'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000'

interface WebSocketState {
  ws: WebSocket | null
  isConnected: boolean
  error: string | null
  messages: WebSocketMessage[]
  connect: () => void
  disconnect: () => void
  subscribe: (roundId: string) => void
  unsubscribe: (roundId: string) => void
  clearMessages: () => void
}

export const useWebSocketStore = create<WebSocketState>((set, get) => {
  let ws: WebSocket | null = null
  let reconnectTimeout: NodeJS.Timeout | null = null
  let reconnectAttempts = 0
  const maxReconnectAttempts = 5
  const baseReconnectDelay = 1000

  const connect = () => {
    if (ws?.readyState === WebSocket.OPEN) {
      return
    }

    // Получаем токен из cookie
    const token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('token='))
      ?.split('=')[1]

    if (!token) {
      set({ error: 'No authentication token' })
      return
    }

    try {
      ws = new WebSocket(`${WS_URL}/ws?token=${token}`)

      ws.onopen = () => {
        reconnectAttempts = 0
        set({ ws, isConnected: true, error: null })
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          set((state) => ({
            messages: [...state.messages, message],
          }))
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        set({ error: 'WebSocket connection error' })
      }

      ws.onclose = () => {
        set({ isConnected: false, ws: null })

        // Автоматическое переподключение с exponential backoff
        if (reconnectAttempts < maxReconnectAttempts) {
          const delay = baseReconnectDelay * Math.pow(2, reconnectAttempts)
          reconnectAttempts++
          reconnectTimeout = setTimeout(() => {
            connect()
          }, delay)
        } else {
          set({ error: 'Max reconnection attempts reached' })
        }
      }
    } catch (error) {
      set({ error: 'Failed to create WebSocket connection' })
    }
  }

  const disconnect = () => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }
    if (ws) {
      ws.close()
      ws = null
    }
    set({ ws: null, isConnected: false })
  }

  const subscribe = (roundId: string) => {
    const currentWs = get().ws
    if (currentWs?.readyState === WebSocket.OPEN) {
      currentWs.send(
        JSON.stringify({
          type: 'subscribe',
          roundId,
        }),
      )
    }
  }

  const unsubscribe = (roundId: string) => {
    const currentWs = get().ws
    if (currentWs?.readyState === WebSocket.OPEN) {
      currentWs.send(
        JSON.stringify({
          type: 'unsubscribe',
          roundId,
        }),
      )
    }
  }

  return {
    ws: null,
    isConnected: false,
    error: null,
    messages: [],
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    clearMessages: () => set({ messages: [] }),
  }
})
