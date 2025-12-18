'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  signInWithEmail,
  signOut as authSignOut,
  getCurrentUser,
  getUserRole,
  updateLastLogin,
  recordLoginActivity,
  type GSRealtyUser,
} from '@/lib/supabase/auth'

type UserRole = 'admin' | 'client'

type AuthContextType = {
  user: GSRealtyUser | null
  role: UserRole | null
  loading: boolean
  isAdmin: boolean
  isClient: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: Error | null; user: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<GSRealtyUser | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  // Initialize auth state
  useEffect(() => {
    console.log('[GSRealty Auth] Initializing...')

    const initializeAuth = async () => {
      const currentUser = await getCurrentUser()
      console.log('[GSRealty Auth] User:', currentUser?.email || 'None', '| Role:', currentUser?.role || 'None')
      setUser(currentUser)
      setRole(currentUser?.role || null)
      setLoading(false)
    }

    initializeAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[GSRealty Auth] State changed:', event)

      if (session?.user) {
        const userRole = await getUserRole(session.user)
        const gsUser: GSRealtyUser = { ...session.user, role: userRole }
        setUser(gsUser)
        setRole(userRole)
        console.log('[GSRealty Auth] User:', gsUser.email, '| Role:', userRole)
      } else {
        setUser(null)
        setRole(null)
        console.log('[GSRealty Auth] User signed out')
      }

      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const signIn = async (email: string, password: string) => {
    try {
      console.log('[GSRealty Auth] Sign in attempt:', email)

      const { user: signedInUser, error } = await signInWithEmail(email, password)

      if (error) {
        console.error('[GSRealty Auth] Sign in failed:', error.message)
        throw error
      }

      if (!signedInUser) {
        throw new Error('Sign in failed')
      }

      console.log('[GSRealty Auth] Sign in successful:', signedInUser.email, '| Role:', signedInUser.role)

      // Update last login timestamp
      await updateLastLogin(signedInUser.id)

      // Record login activity
      await recordLoginActivity(signedInUser.id)

      // Update state
      setUser(signedInUser)
      setRole(signedInUser.role || 'client')

      // Navigate based on role
      const redirectPath = signedInUser.role === 'admin' ? '/admin' : '/client'
      console.log('[GSRealty Auth] Redirecting to:', redirectPath)
      router.push(redirectPath)

      return { error: null }
    } catch (error) {
      console.error('[GSRealty Auth] Error:', error)
      return { error: error as Error }
    }
  }

  const signUp = async (email: string, password: string, metadata?: any) => {
    // GSRealty doesn't allow public signups - only admin can invite clients
    console.warn('[GSRealty Auth] Public signup attempt blocked')
    return {
      error: new Error('Public signups are disabled. Contact admin for an invitation.'),
      user: null
    }
  }

  const signOut = async () => {
    console.log('[GSRealty Auth] Signing out...')
    await authSignOut()
    setUser(null)
    setRole(null)
    router.push('/')
  }

  const value: AuthContextType = {
    user,
    role,
    loading,
    isAdmin: role === 'admin',
    isClient: role === 'client',
    signIn,
    signUp,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
