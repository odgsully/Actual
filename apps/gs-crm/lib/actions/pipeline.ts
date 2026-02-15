'use server'

/**
 * Server actions for pipeline operations
 * Using server actions ensures proper authentication and reliable database updates
 */

import { createClient } from '@/lib/supabase/server'
import type { DealStage } from '@/lib/database/pipeline'

export async function updateDealStage(
  dealId: string,
  newStage: DealStage
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()

    // Get the current user to verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[Pipeline Action] Not authenticated:', authError)
      return { success: false, error: 'You must be logged in to update deals' }
    }

    // Update the deal stage and return the updated row to verify it worked
    const { data, error } = await supabase
      .from('gsrealty_deals')
      .update({
        stage: newStage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dealId)
      .select('id, stage')
      .single()

    if (error) {
      console.error('[Pipeline Action] Update error:', error)
      return { success: false, error: error.message }
    }

    if (!data) {
      console.error('[Pipeline Action] No data returned - deal may not exist or RLS blocked update')
      return { success: false, error: 'Deal not found or update not permitted' }
    }

    if (data.stage !== newStage) {
      console.error('[Pipeline Action] Stage mismatch - expected:', newStage, 'got:', data.stage)
      return { success: false, error: 'Update failed - stage was not changed' }
    }

    console.log('[Pipeline Action] Successfully updated deal:', dealId, 'to stage:', newStage)
    return { success: true, error: null }
  } catch (error) {
    console.error('[Pipeline Action] Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

export async function batchUpdateDealStages(
  updates: Array<{ id: string; stage: DealStage }>
): Promise<{ success: boolean; error: string | null; failedIds: string[] }> {
  try {
    const supabase = await createClient()

    // Get the current user to verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[Pipeline Action] Not authenticated:', authError)
      return {
        success: false,
        error: 'You must be logged in to update deals',
        failedIds: updates.map(u => u.id)
      }
    }

    const failedIds: string[] = []

    // Update each deal
    await Promise.all(
      updates.map(async ({ id, stage }) => {
        const { data, error } = await supabase
          .from('gsrealty_deals')
          .update({
            stage,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select('id, stage')
          .single()

        if (error || !data || data.stage !== stage) {
          console.error('[Pipeline Action] Failed to update deal:', id, error?.message)
          failedIds.push(id)
        }
      })
    )

    if (failedIds.length > 0) {
      return {
        success: false,
        error: `Failed to update ${failedIds.length} deal(s)`,
        failedIds,
      }
    }

    console.log('[Pipeline Action] Batch update successful for', updates.length, 'deals')
    return { success: true, error: null, failedIds: [] }
  } catch (error) {
    console.error('[Pipeline Action] Unexpected batch error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      failedIds: updates.map(u => u.id)
    }
  }
}
