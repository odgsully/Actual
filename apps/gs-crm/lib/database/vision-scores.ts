/**
 * Vision Scores Database Functions
 *
 * CRUD operations for gsrealty_scoring_batches, gsrealty_vision_scores,
 * and gsrealty_scoring_failures tables.
 *
 * All functions accept a SupabaseClient as first arg (server routes pass
 * auth.supabase from requireAdmin()).
 */

import { SupabaseClient } from '@supabase/supabase-js'
import type { PropertyScore, ScoringFailure } from '@/lib/processing/renovation-scoring/types'
import { normalizeAddress } from '@/lib/utils/normalize-address'

const LOG_PREFIX = '[Vision Scores DB]'

// ============================================================================
// Types
// ============================================================================

export type BatchStatus = 'pending' | 'scoring' | 'complete' | 'error' | 'timed_out'

export interface ScoringBatch {
  id: string
  client_id: string | null
  status: BatchStatus
  total_pages: number
  total_scored: number
  total_failed: number
  total_unmatched: number
  estimated_cost: number | null
  storage_paths: string[]
  total_input_tokens: number
  total_output_tokens: number
  error_message: string | null
  created_at: string
  completed_at: string | null
  created_by: string | null
}

export interface VisionScoreRow {
  id: string
  batch_id: string
  client_id: string | null
  address: string
  detected_address: string | null
  mls_number: string | null
  address_normalized: string
  renovation_score: number
  reno_year_estimate: number | null
  confidence: 'high' | 'medium' | 'low'
  era_baseline: string | null
  reasoning: string | null
  rooms: any[]
  unit_scores: any[] | null
  dwelling_subtype: string | null
  page_number: number
  source_pdf_path: string | null
  model_version: string | null
  input_tokens: number | null
  output_tokens: number | null
  scored_at: string
}

// Re-export normalizeAddress for convenience
export { normalizeAddress }

// ============================================================================
// Batch Operations
// ============================================================================

export async function createScoringBatch(
  supabase: SupabaseClient,
  params: {
    clientId: string
    storagePaths: string[]
    totalPages: number
    estimatedCost: number
    createdBy: string
  }
): Promise<{ batch: ScoringBatch | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('gsrealty_scoring_batches')
      .insert({
        client_id: params.clientId,
        status: 'scoring',
        total_pages: params.totalPages,
        estimated_cost: params.estimatedCost,
        storage_paths: params.storagePaths,
        created_by: params.createdBy,
      })
      .select()
      .single()

    if (error) throw error

    console.log(`${LOG_PREFIX} Batch created: ${data.id}`)
    return { batch: data as ScoringBatch, error: null }
  } catch (error) {
    console.error(`${LOG_PREFIX} Error creating batch:`, error)
    return { batch: null, error: error as Error }
  }
}

export async function updateBatchStatus(
  supabase: SupabaseClient,
  batchId: string,
  status: BatchStatus,
  stats?: {
    totalScored?: number
    totalFailed?: number
    totalUnmatched?: number
    totalInputTokens?: number
    totalOutputTokens?: number
  },
  errorMessage?: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const updateData: Record<string, any> = { status }

    if (status === 'complete' || status === 'error' || status === 'timed_out') {
      updateData.completed_at = new Date().toISOString()
    }

    if (stats) {
      if (stats.totalScored !== undefined) updateData.total_scored = stats.totalScored
      if (stats.totalFailed !== undefined) updateData.total_failed = stats.totalFailed
      if (stats.totalUnmatched !== undefined) updateData.total_unmatched = stats.totalUnmatched
      if (stats.totalInputTokens !== undefined) updateData.total_input_tokens = stats.totalInputTokens
      if (stats.totalOutputTokens !== undefined) updateData.total_output_tokens = stats.totalOutputTokens
    }

    if (errorMessage) {
      updateData.error_message = errorMessage
    }

    const { error } = await supabase
      .from('gsrealty_scoring_batches')
      .update(updateData)
      .eq('id', batchId)

    if (error) throw error

    console.log(`${LOG_PREFIX} Batch ${batchId} updated to ${status}`)
    return { success: true, error: null }
  } catch (error) {
    console.error(`${LOG_PREFIX} Error updating batch:`, error)
    return { success: false, error: error as Error }
  }
}

export async function getScoringBatch(
  supabase: SupabaseClient,
  batchId: string
): Promise<{ batch: ScoringBatch | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('gsrealty_scoring_batches')
      .select('*')
      .eq('id', batchId)
      .single()

    if (error) throw error

    return { batch: data as ScoringBatch, error: null }
  } catch (error) {
    console.error(`${LOG_PREFIX} Error fetching batch:`, error)
    return { batch: null, error: error as Error }
  }
}

export async function getLatestBatchForClient(
  supabase: SupabaseClient,
  clientId: string
): Promise<{ batch: ScoringBatch | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('gsrealty_scoring_batches')
      .select('*')
      .eq('client_id', clientId)
      .eq('status', 'complete')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error

    return { batch: data as ScoringBatch | null, error: null }
  } catch (error) {
    console.error(`${LOG_PREFIX} Error fetching latest batch:`, error)
    return { batch: null, error: error as Error }
  }
}

export async function getBatchesForClient(
  supabase: SupabaseClient,
  clientId: string
): Promise<{ batches: ScoringBatch[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('gsrealty_scoring_batches')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { batches: (data as ScoringBatch[]) || [], error: null }
  } catch (error) {
    console.error(`${LOG_PREFIX} Error fetching batches:`, error)
    return { batches: [], error: error as Error }
  }
}

/**
 * Auto-fail batches stuck in 'scoring' for more than 10 minutes.
 * Called at the start of a new scoring run to clean up orphaned state.
 */
export async function recoverStaleBatches(
  supabase: SupabaseClient
): Promise<{ recovered: number; error: Error | null }> {
  try {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('gsrealty_scoring_batches')
      .update({
        status: 'timed_out',
        error_message: 'Auto-recovered: batch stuck in scoring state for >10 minutes',
        completed_at: new Date().toISOString(),
      })
      .eq('status', 'scoring')
      .lt('created_at', tenMinutesAgo)
      .select('id')

    if (error) throw error

    const count = data?.length || 0
    if (count > 0) {
      console.log(`${LOG_PREFIX} Recovered ${count} stale batch(es)`)
    }
    return { recovered: count, error: null }
  } catch (error) {
    console.error(`${LOG_PREFIX} Error recovering stale batches:`, error)
    return { recovered: 0, error: error as Error }
  }
}

// ============================================================================
// Score Operations
// ============================================================================

/**
 * Upsert a chunk of scores as they complete (called per-chunk, not at end).
 * Uses ON CONFLICT (client_id, address_normalized) DO UPDATE so latest score wins.
 */
export async function saveScoresIncremental(
  supabase: SupabaseClient,
  batchId: string,
  clientId: string,
  scores: PropertyScore[],
  modelVersion?: string
): Promise<{ savedCount: number; error: Error | null }> {
  if (scores.length === 0) return { savedCount: 0, error: null }

  try {
    const rows = scores.map(s => ({
      batch_id: batchId,
      client_id: clientId,
      address: s.address,
      detected_address: s.detectedAddress || null,
      mls_number: s.mlsNumber || null,
      address_normalized: normalizeAddress(s.address),
      renovation_score: s.renovationScore,
      reno_year_estimate: s.renoYearEstimate,
      confidence: s.confidence,
      era_baseline: s.eraBaseline || null,
      reasoning: s.reasoning || null,
      rooms: s.rooms || [],
      unit_scores: s.unitScores || null,
      dwelling_subtype: s.propertySubtype || null,
      page_number: s.pageNumber,
      model_version: modelVersion || null,
    }))

    // Batch in chunks of 100 to stay under Supabase payload limits
    const CHUNK_SIZE = 100
    let totalSaved = 0

    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE)

      const { error } = await supabase
        .from('gsrealty_vision_scores')
        .upsert(chunk, {
          onConflict: 'client_id,address_normalized',
          ignoreDuplicates: false,
        })

      if (error) throw error
      totalSaved += chunk.length
    }

    console.log(`${LOG_PREFIX} Saved ${totalSaved} scores for batch ${batchId}`)
    return { savedCount: totalSaved, error: null }
  } catch (error) {
    console.error(`${LOG_PREFIX} Error saving scores:`, error)
    return { savedCount: 0, error: error as Error }
  }
}

/**
 * Insert failure records for audit trail.
 */
export async function saveFailures(
  supabase: SupabaseClient,
  batchId: string,
  failures: ScoringFailure[]
): Promise<{ savedCount: number; error: Error | null }> {
  if (failures.length === 0) return { savedCount: 0, error: null }

  try {
    const rows = failures.map(f => ({
      batch_id: batchId,
      page_number: f.pageNumber,
      address: f.address || null,
      reason: f.reason,
      detail: f.detail || null,
    }))

    const { error } = await supabase
      .from('gsrealty_scoring_failures')
      .insert(rows)

    if (error) throw error

    console.log(`${LOG_PREFIX} Saved ${rows.length} failures for batch ${batchId}`)
    return { savedCount: rows.length, error: null }
  } catch (error) {
    console.error(`${LOG_PREFIX} Error saving failures:`, error)
    return { savedCount: 0, error: error as Error }
  }
}

/**
 * Lookup existing scores by normalized address for a client.
 * This is the cache check — returns scores that already exist so
 * we can skip re-scoring them.
 */
export async function getCachedScores(
  supabase: SupabaseClient,
  clientId: string,
  addresses: string[]
): Promise<{ scores: VisionScoreRow[]; error: Error | null }> {
  if (addresses.length === 0) return { scores: [], error: null }

  try {
    const normalizedAddresses = addresses.map(normalizeAddress)

    const { data, error } = await supabase
      .from('gsrealty_vision_scores')
      .select('*')
      .eq('client_id', clientId)
      .in('address_normalized', normalizedAddresses)

    if (error) throw error

    console.log(`${LOG_PREFIX} Cache check: ${data?.length || 0}/${addresses.length} addresses found`)
    return { scores: (data as VisionScoreRow[]) || [], error: null }
  } catch (error) {
    console.error(`${LOG_PREFIX} Error checking cache:`, error)
    return { scores: [], error: error as Error }
  }
}

/**
 * Get all scores for a specific batch.
 */
export async function getScoresByBatch(
  supabase: SupabaseClient,
  batchId: string
): Promise<{ scores: VisionScoreRow[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('gsrealty_vision_scores')
      .select('*')
      .eq('batch_id', batchId)
      .order('address', { ascending: true })

    if (error) throw error

    return { scores: (data as VisionScoreRow[]) || [], error: null }
  } catch (error) {
    console.error(`${LOG_PREFIX} Error fetching scores by batch:`, error)
    return { scores: [], error: error as Error }
  }
}

/**
 * Get all scores for a client (from their latest complete batch).
 */
export async function getClientScores(
  supabase: SupabaseClient,
  clientId: string
): Promise<{ scores: VisionScoreRow[]; batch: ScoringBatch | null; error: Error | null }> {
  try {
    const { batch, error: batchError } = await getLatestBatchForClient(supabase, clientId)
    if (batchError) throw batchError
    if (!batch) return { scores: [], batch: null, error: null }

    const { scores, error: scoresError } = await getScoresByBatch(supabase, batch.id)
    if (scoresError) throw scoresError

    return { scores, batch, error: null }
  } catch (error) {
    console.error(`${LOG_PREFIX} Error fetching client scores:`, error)
    return { scores: [], batch: null, error: error as Error }
  }
}
