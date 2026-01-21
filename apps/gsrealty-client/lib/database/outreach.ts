/**
 * GSRealty Outreach Database Functions
 *
 * CRUD operations for gsrealty_outreach table
 * Tracks calls, emails, meetings for sales activity and targets
 */

import { createClient as createSupabaseClient } from '@/lib/supabase/client'

export interface GSRealtyOutreach {
  id: string
  client_id: string | null
  type: 'call' | 'email' | 'meeting' | 'text' | 'other'
  notes: string | null
  outcome: string | null
  duration_minutes: number | null
  created_by: string | null
  created_at: string
}

export interface CreateOutreachInput {
  client_id?: string
  type: GSRealtyOutreach['type']
  notes?: string
  outcome?: string
  duration_minutes?: number
  created_by?: string
}

/**
 * Get calls placed this month
 * Used for dashboard "Calls Placed" stat
 */
export async function getCallsThisMonth(): Promise<{
  count: number
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count, error } = await supabase
      .from('gsrealty_outreach')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'call')
      .gte('created_at', startOfMonth.toISOString())

    if (error) throw error

    return { count: count ?? 0, error: null }
  } catch (error) {
    console.error('[GSRealty] Error counting calls this month:', error)
    return { count: 0, error: error as Error }
  }
}

/**
 * Get total outreach this month (all types)
 * Used for Sales Target monthly progress
 */
export async function getOutreachThisMonth(): Promise<{
  count: number
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count, error } = await supabase
      .from('gsrealty_outreach')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString())

    if (error) throw error

    return { count: count ?? 0, error: null }
  } catch (error) {
    console.error('[GSRealty] Error counting outreach this month:', error)
    return { count: 0, error: error as Error }
  }
}

/**
 * Get total outreach this quarter
 * Used for Sales Target quarterly progress
 */
export async function getOutreachThisQuarter(): Promise<{
  count: number
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const now = new Date()
    const quarter = Math.floor(now.getMonth() / 3)
    const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1)
    startOfQuarter.setHours(0, 0, 0, 0)

    const { count, error } = await supabase
      .from('gsrealty_outreach')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfQuarter.toISOString())

    if (error) throw error

    return { count: count ?? 0, error: null }
  } catch (error) {
    console.error('[GSRealty] Error counting outreach this quarter:', error)
    return { count: 0, error: error as Error }
  }
}

/**
 * Get recent outreach for a client
 */
export async function getClientOutreach(
  clientId: string,
  limit: number = 10
): Promise<{
  outreach: GSRealtyOutreach[]
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from('gsrealty_outreach')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return { outreach: data ?? [], error: null }
  } catch (error) {
    console.error('[GSRealty] Error fetching client outreach:', error)
    return { outreach: [], error: error as Error }
  }
}

/**
 * Get all recent outreach (for activity feed)
 */
export async function getRecentOutreach(limit: number = 20): Promise<{
  outreach: GSRealtyOutreach[]
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from('gsrealty_outreach')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return { outreach: data ?? [], error: null }
  } catch (error) {
    console.error('[GSRealty] Error fetching recent outreach:', error)
    return { outreach: [], error: error as Error }
  }
}

/**
 * Log a new outreach activity
 */
export async function logOutreach(input: CreateOutreachInput): Promise<{
  outreach: GSRealtyOutreach | null
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from('gsrealty_outreach')
      .insert({
        client_id: input.client_id || null,
        type: input.type,
        notes: input.notes || null,
        outcome: input.outcome || null,
        duration_minutes: input.duration_minutes || null,
        created_by: input.created_by || null,
      })
      .select()
      .single()

    if (error) throw error

    console.log('[GSRealty] Outreach logged:', data.id)
    return { outreach: data, error: null }
  } catch (error) {
    console.error('[GSRealty] Error logging outreach:', error)
    return { outreach: null, error: error as Error }
  }
}

/**
 * Delete outreach record
 */
export async function deleteOutreach(id: string): Promise<{
  success: boolean
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { error } = await supabase
      .from('gsrealty_outreach')
      .delete()
      .eq('id', id)

    if (error) throw error

    console.log('[GSRealty] Outreach deleted:', id)
    return { success: true, error: null }
  } catch (error) {
    console.error('[GSRealty] Error deleting outreach:', error)
    return { success: false, error: error as Error }
  }
}

/**
 * Get outreach stats by type for a time period
 */
export async function getOutreachStatsByType(
  startDate: Date,
  endDate?: Date
): Promise<{
  stats: Record<string, number>
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    let query = supabase
      .from('gsrealty_outreach')
      .select('type')
      .gte('created_at', startDate.toISOString())

    if (endDate) {
      query = query.lte('created_at', endDate.toISOString())
    }

    const { data, error } = await query

    if (error) throw error

    // Count by type
    const stats: Record<string, number> = {
      call: 0,
      email: 0,
      meeting: 0,
      text: 0,
      other: 0,
    }

    data?.forEach((item) => {
      if (item.type in stats) {
        stats[item.type]++
      }
    })

    return { stats, error: null }
  } catch (error) {
    console.error('[GSRealty] Error getting outreach stats:', error)
    return { stats: {}, error: error as Error }
  }
}
