/**
 * Admin Authentication Helper
 *
 * Provides reusable authentication and authorization checks
 * for admin API routes.
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { SupabaseClient, User } from '@supabase/supabase-js'

export interface AuthResult {
  success: true
  user: User
  supabase: SupabaseClient
}

export interface AuthError {
  success: false
  response: NextResponse
}

export type AdminAuthResult = AuthResult | AuthError

/**
 * Verifies that the request is from an authenticated admin user.
 *
 * Usage:
 * ```ts
 * const auth = await requireAdmin()
 * if (!auth.success) return auth.response
 * const { user, supabase } = auth
 * ```
 */
export async function requireAdmin(): Promise<AdminAuthResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Unauthorized - Authentication required' },
          { status: 401 }
        )
      }
    }

    // Check admin role in gsrealty_users table
    const { data: gsUser, error: userError } = await supabase
      .from('gsrealty_users')
      .select('role')
      .eq('auth_user_id', user.id)
      .single()

    if (userError || gsUser?.role !== 'admin') {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Forbidden - Admin access required' },
          { status: 403 }
        )
      }
    }

    return {
      success: true,
      user,
      supabase
    }
  } catch (error) {
    console.error('Admin auth error:', error)
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      )
    }
  }
}

/**
 * Verifies that the request is from an authenticated user (any role).
 *
 * Usage:
 * ```ts
 * const auth = await requireAuth()
 * if (!auth.success) return auth.response
 * const { user, supabase } = auth
 * ```
 */
export async function requireAuth(): Promise<AdminAuthResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Unauthorized - Authentication required' },
          { status: 401 }
        )
      }
    }

    return {
      success: true,
      user,
      supabase
    }
  } catch (error) {
    console.error('Auth error:', error)
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      )
    }
  }
}
