'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type AuthContextType = {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  isDemo: boolean
  setIsDemo: (value: boolean) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    console.log('[AuthContext] Initializing auth state...')
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      console.log('[AuthContext] Initial user check:', user ? `User: ${user.email}` : 'No user')
      setUser(user)
      setIsDemo(user?.email === 'support@wabbit-rank.ai')
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AuthContext] Auth state changed:', event, session?.user ? `User: ${session.user.email}` : 'No user')
      setUser(session?.user ?? null)
      setIsDemo(session?.user?.email === 'support@wabbit-rank.ai')
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error
      
      // Check if this is the demo account and handle navigation
      if (email === 'support@wabbit-rank.ai') {
        setIsDemo(true)
        // Navigation will be handled by the calling component for demo mode
      }
      
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      })
      
      if (error) throw error

      // Create user profile using API route with service role
      if (data.user) {
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: data.user.id,
            email: email,
            firstName: metadata?.firstName || '',
            lastName: metadata?.lastName || '',
            privacyAccepted: metadata?.privacyAccepted || false,
            marketingOptIn: metadata?.marketingOptIn || false,
          }),
        })

        const result = await response.json()
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to create profile')
        }
        
        // Force refresh the session to ensure auth state is up to date
        console.log('[AuthContext] Refreshing session after signup...')
        const refreshResult = await supabase.auth.refreshSession()
        console.log('[AuthContext] Session refresh result:', refreshResult.data.session ? 'Session active' : 'No session')
        
        // Get the current session to confirm it's established
        const { data: sessionData } = await supabase.auth.getSession()
        console.log('[AuthContext] Current session after signup:', sessionData.session ? `Valid - ${sessionData.session.user.email}` : 'Invalid')
      }
      
      return { error: null, user: data.user }
    } catch (error) {
      return { error: error as Error, user: null }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setIsDemo(false)
    router.push('/')
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signUp,
      signOut,
      isDemo,
      setIsDemo,
    }}>
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