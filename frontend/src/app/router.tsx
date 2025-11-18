import { createBrowserRouter, redirect } from 'react-router-dom'
import { isAuthenticated, setAuthenticated } from '@/utils/auth'
import { useAuthStore } from '@/app/store'

import AppLayout from '@/layouts/App'
import PageLayout from '@/layouts/Page'
import RoundsListPage from '@/pages/RoundsList'
import RoundDetailsPage from '@/pages/RoundDetails'
import NotFoundPage from '@/pages/NotFound'
import LoginPage from '@/pages/Login'

function protectedLoader() {
  if (!isAuthenticated()) {
    throw redirect('/')
  }
  // Проверяем авторизацию через API
  const store = useAuthStore.getState()
  if (!store.user) {
    store.checkAuth().catch(() => {
      throw redirect('/')
    })
  }
  return null
}

export default createBrowserRouter([
  {
    Component: AppLayout,
    children: [
      {
        Component: PageLayout,
        children: [
          {
            index: true,
            loader: () => {
              if (isAuthenticated()) {
                throw redirect('/rounds')
              }
              return null
            },
            Component: LoginPage,
          },
          {
            path: 'logout',
            loader: async () => {
              const store = useAuthStore.getState()
              await store.logout()
              throw redirect('/')
            },
          },
          {
            path: 'rounds/*',
            loader: () => {
              throw redirect('/rounds')
            },
          },
          {
            path: 'rounds',
            loader: protectedLoader,
            Component: RoundsListPage,
          },
          {
            path: 'round',
            loader: () => {
              throw redirect('/rounds')
            },
          },
          {
            path: 'round/:id',
            loader: protectedLoader,
            Component: RoundDetailsPage,
          },
        ],
      },
      {
        path: '*',
        loader: protectedLoader,
        Component: NotFoundPage,
      },
    ],
  },
])
