/**
 * MCAO Database Functions
 *
 * CRUD operations for gsrealty_mcao_data table
 * Handles MCAO API response caching and property linking
 *
 * @see lib/types/mcao-data.ts for type definitions
 * @see supabase/migrations/004_add_mcao_tables.sql for schema
 */

import { createClient as createSupabaseClient } from '@/lib/supabase/client'
import type {
  APN,
  MCAOApiResponse,
  MCAODatabaseRecord,
} from '@/lib/types/mcao-data'
import { formatAPN, isValidAPN } from '@/lib/types/mcao-data'
import type { EnrichmentResult, EnrichmentBatchSummary } from '@/lib/pipeline/enrichment-types'

/**
 * Save MCAO data to database
 *
 * @param apn - Assessor Parcel Number
 * @param data - MCAO API response data
 * @returns Database record or error
 */
export async function saveMCAOData(
  apn: APN,
  data: MCAOApiResponse
): Promise<{
  record: MCAODatabaseRecord | null
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()
    const formattedAPN = formatAPN(apn)

    if (!isValidAPN(formattedAPN)) {
      throw new Error(`Invalid APN format: ${apn}`)
    }

    // Upsert (insert or update if APN exists)
    const { data: record, error } = await supabase
      .from('gsrealty_mcao_data')
      .upsert(
        {
          apn: formattedAPN,
          owner_name: data.ownerName,
          legal_description: data.legalDescription,
          tax_amount: data.taxInfo.taxAmount,
          assessed_value: data.assessedValue.total,
          api_response: data as any, // JSONB
          fetched_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'apn', // Update if APN already exists
        }
      )
      .select()
      .single()

    if (error) throw error

    console.log('[MCAO DB] Data saved for APN:', formattedAPN)
    return { record, error: null }
  } catch (error) {
    console.error('[MCAO DB] Error saving data:', error)
    return { record: null, error: error as Error }
  }
}

/**
 * Get MCAO data by APN from database cache
 *
 * @param apn - Assessor Parcel Number
 * @returns Cached MCAO data or null
 */
export async function getMCAODataByAPN(apn: APN): Promise<{
  data: MCAODatabaseRecord | null
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()
    const formattedAPN = formatAPN(apn)

    if (!isValidAPN(formattedAPN)) {
      throw new Error(`Invalid APN format: ${apn}`)
    }

    const { data, error } = await supabase
      .from('gsrealty_mcao_data')
      .select('*')
      .eq('apn', formattedAPN)
      .single()

    if (error) {
      // Not found is not an error, just return null
      if (error.code === 'PGRST116') {
        return { data: null, error: null }
      }
      throw error
    }

    console.log('[MCAO DB] Data retrieved for APN:', formattedAPN)
    return { data, error: null }
  } catch (error) {
    console.error('[MCAO DB] Error getting data:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Link MCAO data to a property record
 *
 * @param apn - Assessor Parcel Number
 * @param propertyId - UUID of property in gsrealty_properties
 * @returns Success or error
 */
export async function linkMCAOToProperty(
  apn: APN,
  propertyId: string
): Promise<{
  success: boolean
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()
    const formattedAPN = formatAPN(apn)

    if (!isValidAPN(formattedAPN)) {
      throw new Error(`Invalid APN format: ${apn}`)
    }

    const { error } = await supabase
      .from('gsrealty_mcao_data')
      .update({ property_id: propertyId })
      .eq('apn', formattedAPN)

    if (error) throw error

    console.log('[MCAO DB] Linked APN to property:', formattedAPN, propertyId)
    return { success: true, error: null }
  } catch (error) {
    console.error('[MCAO DB] Error linking to property:', error)
    return { success: false, error: error as Error }
  }
}

/**
 * Search MCAO data by owner name
 *
 * @param ownerName - Owner name (supports partial match)
 * @returns Array of matching records
 */
export async function searchMCAOByOwner(ownerName: string): Promise<{
  results: MCAODatabaseRecord[] | null
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from('gsrealty_mcao_data')
      .select('*')
      .ilike('owner_name', `%${ownerName}%`)
      .order('updated_at', { ascending: false })
      .limit(50) // Limit to 50 results

    if (error) throw error

    console.log('[MCAO DB] Found', data?.length || 0, 'results for owner:', ownerName)
    return { results: data, error: null }
  } catch (error) {
    console.error('[MCAO DB] Error searching by owner:', error)
    return { results: null, error: error as Error }
  }
}

/**
 * Get MCAO database statistics
 *
 * @returns Statistics about cached MCAO data
 */
export async function getMCAOStats(): Promise<{
  stats: {
    totalRecords: number
    linkedToProperties: number
    mostRecentFetch: string | null
    oldestFetch: string | null
  } | null
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    // Get total count
    const { count: totalRecords, error: countError } = await supabase
      .from('gsrealty_mcao_data')
      .select('*', { count: 'exact', head: true })

    if (countError) throw countError

    // Get linked count
    const { count: linkedToProperties, error: linkedError } = await supabase
      .from('gsrealty_mcao_data')
      .select('*', { count: 'exact', head: true })
      .not('property_id', 'is', null)

    if (linkedError) throw linkedError

    // Get most recent fetch
    const { data: mostRecent, error: recentError } = await supabase
      .from('gsrealty_mcao_data')
      .select('fetched_at')
      .order('fetched_at', { ascending: false })
      .limit(1)
      .single()

    // Get oldest fetch
    const { data: oldest, error: oldestError } = await supabase
      .from('gsrealty_mcao_data')
      .select('fetched_at')
      .order('fetched_at', { ascending: true })
      .limit(1)
      .single()

    const stats = {
      totalRecords: totalRecords || 0,
      linkedToProperties: linkedToProperties || 0,
      mostRecentFetch: mostRecent?.fetched_at || null,
      oldestFetch: oldest?.fetched_at || null,
    }

    console.log('[MCAO DB] Stats:', stats)
    return { stats, error: null }
  } catch (error) {
    console.error('[MCAO DB] Error getting stats:', error)
    return { stats: null, error: error as Error }
  }
}

/**
 * Delete MCAO data by APN
 *
 * @param apn - Assessor Parcel Number
 * @returns Success or error
 */
export async function deleteMCAOData(apn: APN): Promise<{
  success: boolean
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()
    const formattedAPN = formatAPN(apn)

    if (!isValidAPN(formattedAPN)) {
      throw new Error(`Invalid APN format: ${apn}`)
    }

    const { error } = await supabase
      .from('gsrealty_mcao_data')
      .delete()
      .eq('apn', formattedAPN)

    if (error) throw error

    console.log('[MCAO DB] Data deleted for APN:', formattedAPN)
    return { success: true, error: null }
  } catch (error) {
    console.error('[MCAO DB] Error deleting data:', error)
    return { success: false, error: error as Error }
  }
}

/**
 * Get all MCAO records (with optional pagination)
 *
 * @param limit - Max number of records (default: 100)
 * @param offset - Offset for pagination (default: 0)
 * @returns Array of MCAO records
 */
export async function getAllMCAOData(
  limit: number = 100,
  offset: number = 0
): Promise<{
  records: MCAODatabaseRecord[] | null
  error: Error | null
  total: number | null
}> {
  try {
    const supabase = createSupabaseClient()

    // Get records with pagination
    const { data, error, count } = await supabase
      .from('gsrealty_mcao_data')
      .select('*', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    console.log('[MCAO DB] Retrieved', data?.length || 0, 'records (total:', count, ')')
    return { records: data, error: null, total: count }
  } catch (error) {
    console.error('[MCAO DB] Error getting all data:', error)
    return { records: null, error: error as Error, total: null }
  }
}

/**
 * Check if MCAO data exists for APN
 *
 * @param apn - Assessor Parcel Number
 * @returns True if data exists in database
 */
export async function mcaoDataExists(apn: APN): Promise<{
  exists: boolean
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()
    const formattedAPN = formatAPN(apn)

    if (!isValidAPN(formattedAPN)) {
      throw new Error(`Invalid APN format: ${apn}`)
    }

    const { count, error } = await supabase
      .from('gsrealty_mcao_data')
      .select('*', { count: 'exact', head: true })
      .eq('apn', formattedAPN)

    if (error) throw error

    return { exists: (count || 0) > 0, error: null }
  } catch (error) {
    console.error('[MCAO DB] Error checking existence:', error)
    return { exists: false, error: error as Error }
  }
}

/**
 * Get MCAO data by property ID
 *
 * @param propertyId - UUID of property in gsrealty_properties
 * @returns MCAO data linked to property
 */
export async function getMCAODataByPropertyId(propertyId: string): Promise<{
  data: MCAODatabaseRecord | null
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from('gsrealty_mcao_data')
      .select('*')
      .eq('property_id', propertyId)
      .single()

    if (error) {
      // Not found is not an error, just return null
      if (error.code === 'PGRST116') {
        return { data: null, error: null }
      }
      throw error
    }

    console.log('[MCAO DB] Data retrieved for property:', propertyId)
    return { data, error: null }
  } catch (error) {
    console.error('[MCAO DB] Error getting data by property ID:', error)
    return { data: null, error: error as Error }
  }
}

// ─── Phase 0.5a: Enrichment outcome persistence ─────────────

/**
 * Save per-record enrichment outcome to gsrealty_mcao_data.
 * If the record has an APN, upserts with enrichment metadata.
 * If no APN (failed lookup), logs to enrichment_batches only.
 */
export async function saveEnrichmentOutcome(
  result: EnrichmentResult
): Promise<{ success: boolean; error: Error | null }> {
  try {
    // Skip records with no APN — they can't be keyed in the APN table
    if (!result.apn) {
      return { success: true, error: null }
    }

    const supabase = createSupabaseClient()
    const formattedAPN = formatAPN(result.apn)

    if (!isValidAPN(formattedAPN)) {
      // Invalid APN format — log but don't fail the batch
      console.warn('[MCAO DB] Skipping invalid APN for enrichment save:', result.apn)
      return { success: true, error: null }
    }

    const { error } = await supabase
      .from('gsrealty_mcao_data')
      .upsert(
        {
          apn: formattedAPN,
          enrichment_success: result.success,
          enrichment_method: result.method,
          enrichment_confidence: result.confidence,
          enrichment_duration_ms: result.durationMs,
          enrichment_error_code: result.error?.code || null,
          api_response: result.mcaoData || {},
          fetched_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'apn' }
      )

    if (error) throw error

    return { success: true, error: null }
  } catch (error) {
    console.error('[MCAO DB] Error saving enrichment outcome:', error)
    return { success: false, error: error as Error }
  }
}

/**
 * Save batch-level enrichment summary to gsrealty_enrichment_batches.
 */
export async function saveBatchSummary(
  summary: EnrichmentBatchSummary
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const supabase = createSupabaseClient()

    const { error } = await supabase
      .from('gsrealty_enrichment_batches')
      .insert({
        total: summary.total,
        resolved: summary.resolved,
        apn_only_resolved: summary.apnOnlyResolved,
        apn_failed: summary.apnFailed,
        skipped: summary.skipped,
        retryable: summary.retryable,
        permanent: summary.permanent,
        duration_ms: summary.durationMs,
        aborted: summary.aborted,
        abort_reason: summary.abortReason || null,
      })

    if (error) throw error

    console.log('[MCAO DB] Batch summary saved:', {
      total: summary.total,
      resolved: summary.resolved,
      aborted: summary.aborted,
    })
    return { success: true, error: null }
  } catch (error) {
    console.error('[MCAO DB] Error saving batch summary:', error)
    return { success: false, error: error as Error }
  }
}
