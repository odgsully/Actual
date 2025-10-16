'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

export default function DemoBanner() {
  const { isDemo, signOut } = useAuth()
  const router = useRouter()

  if (!isDemo) return null

  const handleExitDemo = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">
            DEMO MODE
          </span>
          <span className="text-sm">
            You're viewing the platform with sample data as an admin user
          </span>
        </div>
        <button
          onClick={handleExitDemo}
          className="text-sm font-medium underline hover:no-underline"
        >
          Click here to return to Menu
        </button>
      </div>
    </div>
  )
}