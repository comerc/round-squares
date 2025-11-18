import { create } from 'zustand'
import { tapApi } from '@/api/tap.api.js'
import { calculateScore } from '@/utils/round.js'

interface TapState {
  myScore: number
  tapCount: number
  isLoading: boolean
  error: string | null
  tap: (roundId: string) => Promise<void>
  setScore: (score: number, tapCount: number) => void
  resetTap: () => void
  clearError: () => void
}

// Очередь запросов для предотвращения пропусков кликов
let tapQueue: Array<{
  roundId: string
  resolve: (response: any) => void
  reject: (error: any) => void
}> = []
let isProcessingQueue = false

async function processTapQueue() {
  if (isProcessingQueue || tapQueue.length === 0) return

  isProcessingQueue = true

  while (tapQueue.length > 0) {
    const { roundId, resolve, reject } = tapQueue.shift()!

    try {
      const response = await tapApi.tap(roundId)
      resolve(response)
    } catch (error) {
      reject(error)
    }
  }

  isProcessingQueue = false
}

export const useTapStore = create<TapState>((set, get) => ({
  myScore: 0,
  tapCount: 0,
  isLoading: false,
  error: null,

  tap: async (roundId: string) => {
    // Оптимистичное обновление - сразу увеличиваем счетчик
    const currentTapCount = get().tapCount
    const optimisticTapCount = currentTapCount + 1
    const optimisticScore = calculateScore(optimisticTapCount)

    set({
      tapCount: optimisticTapCount,
      myScore: optimisticScore,
      isLoading: true,
      error: null,
    })

    // Добавляем запрос в очередь и обрабатываем последовательно
    return new Promise<void>((resolve, reject) => {
      tapQueue.push({
        roundId,
        resolve: (response) => {
          // Обновляем состояние с сервера после успешного запроса
          set({
            myScore: response.score,
            tapCount: response.tapCount,
            isLoading: false,
          })
          resolve()
        },
        reject: (error: any) => {
          // В случае ошибки откатываем оптимистичное обновление
          // Но не показываем ошибку, если раунд просто завершился
          const isRoundFinished = error.message === 'Round is not active. Current status: finished'

          set({
            tapCount: currentTapCount,
            myScore: calculateScore(currentTapCount),
            error: isRoundFinished ? null : error.message || 'Ошибка тапа',
            isLoading: false,
          })
          reject(error)
        },
      })

      // Запускаем обработку очереди
      processTapQueue()
    })
  },

  setScore: (score: number, tapCount: number) => {
    set({ myScore: score, tapCount })
  },

  resetTap: () => {
    set({ myScore: 0, tapCount: 0 })
    tapQueue = []
    isProcessingQueue = false
  },

  clearError: () => set({ error: null }),
}))
