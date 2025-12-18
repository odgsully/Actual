'use client'

import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { useRouter } from 'next/navigation'

export function useRequireAuth(redirectTo = '/') {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [showSignIn, setShowSignIn] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      setShowSignIn(true)
    }
  }, [user, loading])

  return {
    user,
    loading,
    showSignIn,
    setShowSignIn,
  }
}