'use client'

// Re-export from shared package with app-specific createClient
import { AuthProvider as SharedAuthProvider, useAuth, type AuthContextType } from '@gs-site/auth'
import { createClient } from '@/lib/supabase/client'
import { ReactNode } from 'react'

// Wrap the shared AuthProvider with our app's createClient
export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SharedAuthProvider createClient={createClient}>
      {children}
    </SharedAuthProvider>
  )
}

// Re-export useAuth and types
export { useAuth, type AuthContextType }
