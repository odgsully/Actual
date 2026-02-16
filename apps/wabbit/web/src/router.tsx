import { createBrowserRouter } from 'react-router-dom'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { AuthCallback } from '@/components/auth/AuthCallback'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/pages/LoginPage'
import { HomePage } from '@/pages/HomePage'
import { WabbPage } from '@/pages/WabbPage'
import { LeaderboardPage } from '@/pages/LeaderboardPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/auth/callback', element: <AuthCallback /> },
  {
    element: <AuthGuard />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <HomePage /> },
          { path: '/wabb/:id', element: <WabbPage /> },
          { path: '/leaderboard/:id', element: <LeaderboardPage /> },
        ],
      },
    ],
  },
])
