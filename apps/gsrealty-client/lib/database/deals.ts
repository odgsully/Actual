/**
 * GSRealty Deals Database Functions
 *
 * CRUD operations for gsrealty_deals table
 * Tracks buyer/seller deals for Active Deals count and Revenue calculation
 */

import { createClient as createSupabaseClient } from '@/lib/supabase/client'

export interface GSRealtyDeal {
  id: string
  client_id: string
  type: 'buyer' | 'seller'
  stage: 'on_radar' | 'official_representation' | 'touring' | 'offers_in' | 'under_contract' | 'closed'
  property_address: string | null
  deal_value: number
  commission_rate: number
  expected_commission: number
  representation_end_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CreateDealInput {
  client_id: string
  type: 'buyer' | 'seller'
  stage: GSRealtyDeal['stage']
  property_address?: string
  deal_value?: number
  commission_rate?: number
  representation_end_date?: string
  notes?: string
}

export interface UpdateDealInput {
  type?: 'buyer' | 'seller'
  stage?: GSRealtyDeal['stage']
  property_address?: string
  deal_value?: number
  commission_rate?: number
  representation_end_date?: string
  notes?: string
}

/**
 * Get count of active deals (not closed)
 * Used for dashboard "Active Deals" stat
 */
export async function getActiveDealsCount(): Promise<{
  count: number
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { count, error } = await supabase
      .from('gsrealty_deals')
      .select('*', { count: 'exact', head: true })
      .neq('stage', 'closed')

    if (error) throw error

    return { count: count ?? 0, error: null }
  } catch (error) {
    console.error('[GSRealty] Error counting active deals:', error)
    return { count: 0, error: error as Error }
  }
}

/**
 * Get total expected revenue from active deals
 * Used for dashboard "Revenue" stat
 */
export async function getTotalRevenue(): Promise<{
  revenue: number
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from('gsrealty_deals')
      .select('expected_commission')
      .neq('stage', 'closed')

    if (error) throw error

    const total = data?.reduce((sum, deal) => sum + (Number(deal.expected_commission) || 0), 0) ?? 0
    return { revenue: total, error: null }
  } catch (error) {
    console.error('[GSRealty] Error calculating revenue:', error)
    return { revenue: 0, error: error as Error }
  }
}

/**
 * Get deal value for a specific client
 * Used for Recent Contacts "value" display
 */
export async function getClientDealValue(clientId: string): Promise<{
  value: number
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from('gsrealty_deals')
      .select('expected_commission')
      .eq('client_id', clientId)
      .neq('stage', 'closed')

    if (error) throw error

    const total = data?.reduce((sum, deal) => sum + (Number(deal.expected_commission) || 0), 0) ?? 0
    return { value: total, error: null }
  } catch (error) {
    console.error('[GSRealty] Error getting client deal value:', error)
    return { value: 0, error: error as Error }
  }
}

/**
 * Get all deals for a client
 */
export async function getClientDeals(clientId: string): Promise<{
  deals: GSRealtyDeal[]
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from('gsrealty_deals')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { deals: data ?? [], error: null }
  } catch (error) {
    console.error('[GSRealty] Error fetching client deals:', error)
    return { deals: [], error: error as Error }
  }
}

/**
 * Get all active deals
 */
export async function getAllActiveDeals(): Promise<{
  deals: GSRealtyDeal[]
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from('gsrealty_deals')
      .select('*')
      .neq('stage', 'closed')
      .order('created_at', { ascending: false })

    if (error) throw error

    return { deals: data ?? [], error: null }
  } catch (error) {
    console.error('[GSRealty] Error fetching active deals:', error)
    return { deals: [], error: error as Error }
  }
}

/**
 * Get deal by ID
 */
export async function getDealById(id: string): Promise<{
  deal: GSRealtyDeal | null
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from('gsrealty_deals')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    return { deal: data, error: null }
  } catch (error) {
    console.error('[GSRealty] Error fetching deal:', error)
    return { deal: null, error: error as Error }
  }
}

/**
 * Create a new deal
 */
export async function createDeal(input: CreateDealInput): Promise<{
  deal: GSRealtyDeal | null
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from('gsrealty_deals')
      .insert({
        client_id: input.client_id,
        type: input.type,
        stage: input.stage,
        property_address: input.property_address || null,
        deal_value: input.deal_value || 0,
        commission_rate: input.commission_rate || 0.03,
        representation_end_date: input.representation_end_date || null,
        notes: input.notes || null,
      })
      .select()
      .single()

    if (error) throw error

    console.log('[GSRealty] Deal created:', data.id)
    return { deal: data, error: null }
  } catch (error) {
    console.error('[GSRealty] Error creating deal:', error)
    return { deal: null, error: error as Error }
  }
}

/**
 * Update existing deal
 */
export async function updateDeal(
  id: string,
  input: UpdateDealInput
): Promise<{
  deal: GSRealtyDeal | null
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const updateData: Record<string, unknown> = {}
    if (input.type !== undefined) updateData.type = input.type
    if (input.stage !== undefined) updateData.stage = input.stage
    if (input.property_address !== undefined) updateData.property_address = input.property_address || null
    if (input.deal_value !== undefined) updateData.deal_value = input.deal_value
    if (input.commission_rate !== undefined) updateData.commission_rate = input.commission_rate
    if (input.representation_end_date !== undefined) updateData.representation_end_date = input.representation_end_date || null
    if (input.notes !== undefined) updateData.notes = input.notes || null

    const { data, error } = await supabase
      .from('gsrealty_deals')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    console.log('[GSRealty] Deal updated:', id)
    return { deal: data, error: null }
  } catch (error) {
    console.error('[GSRealty] Error updating deal:', error)
    return { deal: null, error: error as Error }
  }
}

/**
 * Delete deal
 */
export async function deleteDeal(id: string): Promise<{
  success: boolean
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { error } = await supabase
      .from('gsrealty_deals')
      .delete()
      .eq('id', id)

    if (error) throw error

    console.log('[GSRealty] Deal deleted:', id)
    return { success: true, error: null }
  } catch (error) {
    console.error('[GSRealty] Error deleting deal:', error)
    return { success: false, error: error as Error }
  }
}

/**
 * Close a deal and auto-update the linked property status to 'closed'
 * This maintains sync between deal stage and property status
 */
export async function closeDeal(id: string): Promise<{
  deal: GSRealtyDeal | null
  propertyUpdated: boolean
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    // Step 1: Update the deal stage to 'closed'
    const { data: deal, error: dealError } = await supabase
      .from('gsrealty_deals')
      .update({ stage: 'closed' })
      .eq('id', id)
      .select()
      .single()

    if (dealError) throw dealError

    // Step 2: Find and update any linked property to 'closed' status
    const { data: linkedProperties, error: fetchError } = await supabase
      .from('gsrealty_client_properties')
      .select('id')
      .eq('deal_id', id)

    if (fetchError) {
      console.warn('[GSRealty] Could not fetch linked properties:', fetchError)
      return { deal, propertyUpdated: false, error: null }
    }

    let propertyUpdated = false
    if (linkedProperties && linkedProperties.length > 0) {
      const { error: updateError } = await supabase
        .from('gsrealty_client_properties')
        .update({
          status: 'closed',
          updated_at: new Date().toISOString()
        })
        .eq('deal_id', id)

      if (updateError) {
        console.warn('[GSRealty] Could not update linked property status:', updateError)
      } else {
        propertyUpdated = true
        console.log('[GSRealty] Linked property status updated to closed')
      }
    }

    console.log('[GSRealty] Deal closed:', id)
    return { deal, propertyUpdated, error: null }
  } catch (error) {
    console.error('[GSRealty] Error closing deal:', error)
    return { deal: null, propertyUpdated: false, error: error as Error }
  }
}

/**
 * Get deal by property ID (reverse lookup)
 */
export async function getDealByPropertyId(propertyId: string): Promise<{
  deal: GSRealtyDeal | null
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    // First get the deal_id from the property
    const { data: property, error: propertyError } = await supabase
      .from('gsrealty_client_properties')
      .select('deal_id')
      .eq('id', propertyId)
      .single()

    if (propertyError) throw propertyError
    if (!property?.deal_id) {
      return { deal: null, error: null }
    }

    // Then fetch the deal
    const { data: deal, error: dealError } = await supabase
      .from('gsrealty_deals')
      .select('*')
      .eq('id', property.deal_id)
      .single()

    if (dealError) throw dealError

    return { deal, error: null }
  } catch (error) {
    console.error('[GSRealty] Error fetching deal by property:', error)
    return { deal: null, error: error as Error }
  }
}
