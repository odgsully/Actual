/**
 * GSRealty Pipeline Database Functions
 *
 * Operations for the deal pipeline kanban board
 * Handles stage transitions and position ordering
 */

import { createClient as createSupabaseClient } from '@/lib/supabase/client'
import type { GSRealtyDeal } from './deals'

export type DealStage = 'on_radar' | 'official_representation' | 'touring' | 'offers_in' | 'under_contract' | 'closed'
export type DealType = 'buyer' | 'seller'

export interface DealWithClient extends GSRealtyDeal {
  client?: {
    id: string
    first_name: string
    last_name: string
    email: string | null
    phone: string | null
  }
}

export const STAGE_CONFIG: Record<DealStage, { label: string; color: string }> = {
  on_radar: { label: 'On Radar', color: 'text-purple-400' },
  official_representation: { label: 'Official Rep', color: 'text-blue-400' },
  touring: { label: 'Touring', color: 'text-cyan-400' },
  offers_in: { label: 'Offers In', color: 'text-yellow-400' },
  under_contract: { label: 'Under Contract', color: 'text-orange-400' },
  closed: { label: 'Closed', color: 'text-green-400' },
}

export const STAGES: DealStage[] = [
  'on_radar',
  'official_representation',
  'touring',
  'offers_in',
  'under_contract',
  'closed',
]

/**
 * Get all deals for pipeline view with client info
 */
export async function getPipelineDeals(type?: DealType): Promise<{
  deals: DealWithClient[]
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    let query = supabase
      .from('gsrealty_deals')
      .select(`
        *,
        client:gsrealty_clients(id, first_name, last_name, email, phone)
      `)
      .order('stage')
      .order('position')

    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query

    if (error) throw error

    return { deals: data ?? [], error: null }
  } catch (error) {
    console.error('[GSRealty] Error fetching pipeline deals:', error)
    return { deals: [], error: error as Error }
  }
}

/**
 * Get deals grouped by stage
 */
export async function getDealsByStage(type?: DealType): Promise<{
  dealsByStage: Record<DealStage, DealWithClient[]>
  error: Error | null
}> {
  const { deals, error } = await getPipelineDeals(type)

  if (error) {
    return {
      dealsByStage: {
        on_radar: [],
        official_representation: [],
        touring: [],
        offers_in: [],
        under_contract: [],
        closed: [],
      },
      error,
    }
  }

  const dealsByStage: Record<DealStage, DealWithClient[]> = {
    on_radar: [],
    official_representation: [],
    touring: [],
    offers_in: [],
    under_contract: [],
    closed: [],
  }

  deals.forEach((deal) => {
    const stage = deal.stage as DealStage
    if (dealsByStage[stage]) {
      dealsByStage[stage].push(deal)
    }
  })

  return { dealsByStage, error: null }
}

/**
 * Update deal stage and position (for drag and drop)
 * Note: Position is stored in-memory only for now. Stage is persisted to database.
 */
export async function updateDealStageAndPosition(
  dealId: string,
  newStage: DealStage,
  newPosition: number
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const supabase = createSupabaseClient()

    // Only update stage - position column doesn't exist in database yet
    const { error } = await supabase
      .from('gsrealty_deals')
      .update({
        stage: newStage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dealId)

    if (error) throw error

    console.log('[GSRealty] Deal moved:', dealId, 'to', newStage)
    return { success: true, error: null }
  } catch (error) {
    console.error('[GSRealty] Error updating deal stage:', error)
    return { success: false, error: error as Error }
  }
}

/**
 * Batch update positions for multiple deals (after reordering)
 * Note: Position is not persisted to database yet. Only stage changes are saved.
 */
export async function batchUpdatePositions(
  updates: { id: string; position: number; stage?: DealStage }[]
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const supabase = createSupabaseClient()

    // Only update deals that have a stage change
    const stageUpdates = updates.filter(u => u.stage)

    if (stageUpdates.length === 0) {
      // No stage changes, just position reordering within same stage
      // Position is UI-only for now, return success
      return { success: true, error: null }
    }

    // Use Promise.all for batch stage updates
    const results = await Promise.all(
      stageUpdates.map(({ id, stage }) => {
        return supabase
          .from('gsrealty_deals')
          .update({
            stage,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
      })
    )

    const hasError = results.some((r) => r.error)
    if (hasError) {
      const errors = results.filter(r => r.error).map(r => r.error)
      console.error('[GSRealty] Batch update errors:', errors)
      throw new Error('Some stage updates failed')
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('[GSRealty] Error batch updating:', error)
    return { success: false, error: error as Error }
  }
}

/**
 * Get pipeline statistics
 */
export async function getPipelineStats(type?: DealType): Promise<{
  stats: {
    total: number
    byStage: Record<DealStage, number>
    totalValue: number
    totalCommission: number
  }
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    let query = supabase
      .from('gsrealty_deals')
      .select('stage, deal_value, expected_commission')

    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query

    if (error) throw error

    const byStage: Record<DealStage, number> = {
      on_radar: 0,
      official_representation: 0,
      touring: 0,
      offers_in: 0,
      under_contract: 0,
      closed: 0,
    }

    let totalValue = 0
    let totalCommission = 0

    data?.forEach((deal) => {
      const stage = deal.stage as DealStage
      if (byStage[stage] !== undefined) {
        byStage[stage]++
      }
      totalValue += Number(deal.deal_value) || 0
      totalCommission += Number(deal.expected_commission) || 0
    })

    return {
      stats: {
        total: data?.length ?? 0,
        byStage,
        totalValue,
        totalCommission,
      },
      error: null,
    }
  } catch (error) {
    console.error('[GSRealty] Error fetching pipeline stats:', error)
    return {
      stats: {
        total: 0,
        byStage: {
          on_radar: 0,
          official_representation: 0,
          touring: 0,
          offers_in: 0,
          under_contract: 0,
          closed: 0,
        },
        totalValue: 0,
        totalCommission: 0,
      },
      error: error as Error,
    }
  }
}
