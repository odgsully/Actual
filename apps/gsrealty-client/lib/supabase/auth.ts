/**
 * GSRealty Authentication Functions
 *
 * Handles user authentication with role-based access control
 * Roles: 'admin' (Garrett) | 'client' (invited clients)
 */

import { createClient } from './client'
import type { User } from '@supabase/supabase-js'

export interface GSRealtyUser extends User {
  role?: 'admin' | 'client'
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { user: null, error }
  }

  // Determine user role
  const role = await getUserRole(data.user)

  return {
    user: { ...data.user, role } as GSRealtyUser,
    error: null
  }
}

/**
 * Sign out current user
 */
export async function signOut() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  return { error }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<GSRealtyUser | null> {
  const supabase = createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  // Determine user role
  const role = await getUserRole(user)

  return { ...user, role } as GSRealtyUser
}

/**
 * Determine user role based on email and database records
 */
export async function getUserRole(user: User | null): Promise<'admin' | 'client'> {
  if (!user) return 'client'

  // Admin is identified by email
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'gbsullivan@mac.com'
  if (user.email === adminEmail) {
    return 'admin'
  }

  // Check database for user role
  const supabase = createClient()
  const { data } = await supabase
    .from('gsrealty_users')
    .select('role')
    .eq('auth_user_id', user.id)
    .single()

  return data?.role === 'admin' ? 'admin' : 'client'
}

/**
 * Check if current user is admin
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === 'admin'
}

/**
 * Check if current user is client
 */
export async function isClient(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === 'client'
}

/**
 * Create admin user in database (run once during setup)
 */
export async function createAdminUser(email: string, userId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('gsrealty_users')
    .insert({
      auth_user_id: userId,
      email,
      full_name: 'Garrett Sullivan',
      role: 'admin',
    })
    .select()
    .single()

  return { data, error }
}

/**
 * Create client user in database (called when inviting clients)
 */
export async function createClientUser(email: string, userId: string, fullName?: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('gsrealty_users')
    .insert({
      auth_user_id: userId,
      email,
      full_name: fullName,
      role: 'client',
    })
    .select()
    .single()

  return { data, error }
}

/**
 * Update last login timestamp
 */
export async function updateLastLogin(userId: string) {
  const supabase = createClient()

  await supabase
    .from('gsrealty_users')
    .update({ last_login: new Date().toISOString() })
    .eq('auth_user_id', userId)
}

/**
 * Record login activity
 */
export async function recordLoginActivity(userId: string, ipAddress?: string, userAgent?: string) {
  const supabase = createClient()

  // Get user database ID
  const { data: userData } = await supabase
    .from('gsrealty_users')
    .select('id')
    .eq('auth_user_id', userId)
    .single()

  if (!userData) return

  await supabase
    .from('gsrealty_login_activity')
    .insert({
      user_id: userData.id,
      ip_address: ipAddress,
      user_agent: userAgent,
    })
}
