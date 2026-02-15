/**
 * CRM Settings Database Functions
 *
 * CRUD operations for gsrealty_settings table
 * Manages admin-configurable settings for the CRM
 */

import { createClient as createSupabaseClient } from '@/lib/supabase/client'

// Setting key types
export type SettingKey = 'outreach_targets' | 'notifications' | 'system' | 'email'

// Setting value interfaces
export interface OutreachTargets {
  monthlyTarget: number
  quarterlyTarget: number
  monthlyAchieved: number
  quarterlyAchieved: number
}

export interface NotificationSettings {
  emailNotifications: boolean
  clientInviteNotifications: boolean
  fileUploadNotifications: boolean
}

export interface SystemSettings {
  autoArchiveClients: boolean
  archiveAfterDays: number
}

export interface EmailSettings {
  replyToEmail: string
  emailSignature: string
}

// Combined settings type
export interface AllSettings {
  outreach_targets: OutreachTargets
  notifications: NotificationSettings
  system: SystemSettings
  email: EmailSettings
}

// Default values
export const DEFAULT_SETTINGS: AllSettings = {
  outreach_targets: {
    monthlyTarget: 50,
    quarterlyTarget: 150,
    monthlyAchieved: 0,
    quarterlyAchieved: 0
  },
  notifications: {
    emailNotifications: true,
    clientInviteNotifications: true,
    fileUploadNotifications: false
  },
  system: {
    autoArchiveClients: false,
    archiveAfterDays: 90
  },
  email: {
    replyToEmail: 'support@sullivanrealty.com',
    emailSignature: 'Best regards,\nGS Realty Team'
  }
}

/**
 * Get a specific setting by key
 */
export async function getSetting<K extends SettingKey>(
  key: K
): Promise<{ value: AllSettings[K]; error: Error | null }> {
  try {
    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from('gsrealty_settings')
      .select('value')
      .eq('key', key)
      .single()

    if (error) {
      // If not found, return default
      if (error.code === 'PGRST116') {
        return { value: DEFAULT_SETTINGS[key], error: null }
      }
      throw error
    }

    return { value: data.value as AllSettings[K], error: null }
  } catch (error) {
    console.error(`[GSRealty] Error fetching setting ${key}:`, error)
    return { value: DEFAULT_SETTINGS[key], error: error as Error }
  }
}

/**
 * Get outreach targets specifically (convenience function for dashboard)
 */
export async function getOutreachTargets(): Promise<{
  targets: OutreachTargets
  error: Error | null
}> {
  const { value, error } = await getSetting('outreach_targets')
  return { targets: value, error }
}

/**
 * Get all settings at once
 */
export async function getAllSettings(): Promise<{
  settings: AllSettings
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from('gsrealty_settings')
      .select('key, value')

    if (error) throw error

    // Build settings object from rows
    const settings: AllSettings = { ...DEFAULT_SETTINGS }

    data?.forEach((row) => {
      const key = row.key as SettingKey
      if (key in settings) {
        (settings as unknown as Record<string, unknown>)[key] = row.value
      }
    })

    return { settings, error: null }
  } catch (error) {
    console.error('[GSRealty] Error fetching all settings:', error)
    return { settings: DEFAULT_SETTINGS, error: error as Error }
  }
}

/**
 * Update a specific setting
 */
export async function updateSetting<K extends SettingKey>(
  key: K,
  value: AllSettings[K]
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const supabase = createSupabaseClient()

    const { error } = await supabase
      .from('gsrealty_settings')
      .upsert(
        { key, value, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      )

    if (error) throw error

    console.log(`[GSRealty] Setting ${key} updated`)
    return { success: true, error: null }
  } catch (error) {
    console.error(`[GSRealty] Error updating setting ${key}:`, error)
    return { success: false, error: error as Error }
  }
}

/**
 * Update outreach targets specifically (convenience function)
 */
export async function updateOutreachTargets(
  targets: OutreachTargets
): Promise<{ success: boolean; error: Error | null }> {
  return updateSetting('outreach_targets', targets)
}

/**
 * Update multiple settings at once
 */
export async function updateAllSettings(
  settings: Partial<AllSettings>
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const supabase = createSupabaseClient()

    // Build upsert array
    const upserts = Object.entries(settings).map(([key, value]) => ({
      key,
      value,
      updated_at: new Date().toISOString()
    }))

    const { error } = await supabase
      .from('gsrealty_settings')
      .upsert(upserts, { onConflict: 'key' })

    if (error) throw error

    console.log('[GSRealty] All settings updated')
    return { success: true, error: null }
  } catch (error) {
    console.error('[GSRealty] Error updating all settings:', error)
    return { success: false, error: error as Error }
  }
}
