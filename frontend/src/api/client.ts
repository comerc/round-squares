// Обоснование использования fetch вместо axios:
// 1. Нативный API браузера - не требует зависимостей
// 2. Меньший размер бандла (axios ~13KB)
// 3. Достаточно для наших задач (cookies, JSON, error handling)
// 4. Современный стандарт Web API
// axios был бы полезен для interceptors и более сложной логики, но здесь избыточен

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public data?: any,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_URL}${endpoint}`
  const headers: HeadersInit = {
    ...(options.headers || {}),
  }

  // Добавляем Content-Type только если есть body
  if (options.body) {
    const headersObj = headers as Record<string, string>
    if (!headersObj['Content-Type']) {
      headersObj['Content-Type'] = 'application/json'
    }
  }

  const config: RequestInit = {
    ...options,
    credentials: 'include',
    headers,
  }

  try {
    const response = await fetch(url, config)

    if (response.status === 401) {
      // Unauthorized - редирект на логин
      window.location.href = '/'
      throw new ApiError('Unauthorized', 401)
    }

    const data = await response.json()

    if (!response.ok) {
      throw new ApiError(data.error || 'Request failed', response.status, data)
    }

    return data
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError('Network error', 0, error)
  }
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body?: any) => {
    const options: RequestInit = {
      method: 'POST',
    }
    if (body) {
      options.body = JSON.stringify(body)
    }
    return request<T>(endpoint, options)
  },
  put: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
}

export { ApiError }
