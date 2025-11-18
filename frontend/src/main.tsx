import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@ant-design/v5-patch-for-react-19'
import '@/index.css'
import { RouterProvider } from 'react-router-dom'
import router from '@/app/router'
import { useAuthStore } from '@/app/store'

// Проверяем авторизацию при загрузке приложения
// Зачем: восстанавливаем сессию пользователя после рефреша страницы
// Если есть валидный cookie, синхронизируем состояние Zustand с сервером
// Это позволяет сразу показать username в header без задержки
function isAuthenticated(): boolean {
  return document.cookie.split('; ').some((row) => row.startsWith('token='))
}

if (isAuthenticated()) {
  // Выполняем асинхронно, не блокируя рендер
  useAuthStore
    .getState()
    .checkAuth()
    .catch(() => {
      // Если токен невалиден, checkAuth сам очистит состояние
    })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
