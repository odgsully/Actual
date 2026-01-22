/**
 * GSRealty Client Properties Database Functions
 *
 * CRUD operations for gsrealty_client_properties table
 * Manages multi-property system where contacts can have multiple buying/selling properties
 * Auto-creates deals when properties are added
 */

import { createClient as createSupabaseClient } from '@/lib/supabase/client'
import { createDeal, updateDeal, type GSRealtyDeal } from './deals'
import { refreshClientStatus } from './clients'

export type PropertyType = 'buying' | 'selling'
export type PropertyStatus = 'active' | 'inactive' | 'closed'

export interface ClientProperty {
  id: string
  client_id: string
  property_address: string
  property_type: PropertyType
  status: PropertyStatus
  deal_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ClientPropertyWithDeal extends ClientProperty {
  deal?: GSRealtyDeal | null
}

export interface AddPropertyInput {
  property_address: string
  property_type: PropertyType
  notes?: string
}

export interface UpdatePropertyInput {
  property_address?: string
  notes?: string
}

/**
 * Get all properties for a client
 */
export async function getClientProperties(clientId: string): Promise<{
  properties: ClientPropertyWithDeal[]
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from('gsrealty_client_properties')
      .select(`
        *,
        deal:gsrealty_deals(*)
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { properties: data ?? [], error: null }
  } catch (error) {
    console.error('[GSRealty] Error fetching client properties:', error)
    return { properties: [], error: error as Error }
  }
}

/**
 * Get a single property by ID
 */
export async function getPropertyById(propertyId: string): Promise<{
  property: ClientPropertyWithDeal | null
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from('gsrealty_client_properties')
      .select(`
        *,
        deal:gsrealty_deals(*)
      `)
      .eq('id', propertyId)
      .single()

    if (error) throw error

    return { property: data, error: null }
  } catch (error) {
    console.error('[GSRealty] Error fetching property:', error)
    return { property: null, error: error as Error }
  }
}

/**
 * Add a property to a client and auto-create a deal at "On Radar" stage
 * Returns both the property and the created deal
 */
export async function addClientProperty(
  clientId: string,
  input: AddPropertyInput
): Promise<{
  property: ClientProperty | null
  deal: GSRealtyDeal | null
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    // Step 1: Create the deal first (at "On Radar" stage)
    const dealType = input.property_type === 'buying' ? 'buyer' : 'seller'
    const { deal, error: dealError } = await createDeal({
      client_id: clientId,
      type: dealType,
      stage: 'on_radar',
      property_address: input.property_address,
    })

    if (dealError || !deal) {
      throw dealError || new Error('Failed to create deal')
    }

    // Step 2: Create the property with the deal_id linked
    const { data: property, error: propertyError } = await supabase
      .from('gsrealty_client_properties')
      .insert({
        client_id: clientId,
        property_address: input.property_address,
        property_type: input.property_type,
        status: 'active',
        deal_id: deal.id,
        notes: input.notes || null,
      })
      .select()
      .single()

    if (propertyError) throw propertyError

    // Refresh client status since we added a new active property
    await refreshClientStatus(clientId)

    console.log('[GSRealty] Property added with deal:', property.id, '→', deal.id)
    return { property, deal, error: null }
  } catch (error) {
    console.error('[GSRealty] Error adding client property:', error)
    return { property: null, deal: null, error: error as Error }
  }
}

/**
 * Update a property (address or notes)
 * Address changes are automatically synced to the linked deal via database trigger
 */
export async function updateClientProperty(
  propertyId: string,
  input: UpdatePropertyInput
): Promise<{
  property: ClientProperty | null
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    if (input.property_address !== undefined) updateData.property_address = input.property_address
    if (input.notes !== undefined) updateData.notes = input.notes || null

    const { data, error } = await supabase
      .from('gsrealty_client_properties')
      .update(updateData)
      .eq('id', propertyId)
      .select()
      .single()

    if (error) throw error

    console.log('[GSRealty] Property updated:', propertyId)
    return { property: data, error: null }
  } catch (error) {
    console.error('[GSRealty] Error updating property:', error)
    return { property: null, error: error as Error }
  }
}

/**
 * Update property status
 * - 'active' → Shows in pipeline
 * - 'inactive' → Hidden from pipeline (soft archive)
 * - 'closed' → Historical record, should prompt to close deal too
 *
 * Returns closeDealPrompt=true if status is 'closed' and deal is not already closed
 */
export async function updatePropertyStatus(
  propertyId: string,
  status: PropertyStatus
): Promise<{
  property: ClientProperty | null
  closeDealPrompt: boolean
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    // First get the current property to check deal status
    const { data: currentProperty, error: fetchError } = await supabase
      .from('gsrealty_client_properties')
      .select(`
        *,
        deal:gsrealty_deals(id, stage)
      `)
      .eq('id', propertyId)
      .single()

    if (fetchError) throw fetchError

    // Update the property status
    const { data, error } = await supabase
      .from('gsrealty_client_properties')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', propertyId)
      .select()
      .single()

    if (error) throw error

    // Check if we should prompt to close the deal
    const closeDealPrompt =
      status === 'closed' &&
      currentProperty?.deal &&
      currentProperty.deal.stage !== 'closed'

    // Refresh client status since property status changed
    await refreshClientStatus(currentProperty.client_id)

    console.log('[GSRealty] Property status updated:', propertyId, '→', status)
    return { property: data, closeDealPrompt, error: null }
  } catch (error) {
    console.error('[GSRealty] Error updating property status:', error)
    return { property: null, closeDealPrompt: false, error: error as Error }
  }
}

/**
 * Remove a property
 * Note: This does NOT delete the linked deal - deals are preserved for historical records
 */
export async function removeClientProperty(propertyId: string): Promise<{
  success: boolean
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    // Get client_id before deleting so we can refresh their status
    const { data: property, error: fetchError } = await supabase
      .from('gsrealty_client_properties')
      .select('client_id')
      .eq('id', propertyId)
      .single()

    if (fetchError) throw fetchError

    const clientId = property?.client_id

    const { error } = await supabase
      .from('gsrealty_client_properties')
      .delete()
      .eq('id', propertyId)

    if (error) throw error

    // Refresh client status since property was removed
    if (clientId) {
      await refreshClientStatus(clientId)
    }

    console.log('[GSRealty] Property removed:', propertyId)
    return { success: true, error: null }
  } catch (error) {
    console.error('[GSRealty] Error removing property:', error)
    return { success: false, error: error as Error }
  }
}

/**
 * Get properties by status (useful for pipeline filtering)
 */
export async function getPropertiesByStatus(status: PropertyStatus): Promise<{
  properties: ClientPropertyWithDeal[]
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from('gsrealty_client_properties')
      .select(`
        *,
        deal:gsrealty_deals(*)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { properties: data ?? [], error: null }
  } catch (error) {
    console.error('[GSRealty] Error fetching properties by status:', error)
    return { properties: [], error: error as Error }
  }
}

/**
 * Get active properties count for a client
 */
export async function getClientActivePropertiesCount(clientId: string): Promise<{
  count: number
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { count, error } = await supabase
      .from('gsrealty_client_properties')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('status', 'active')

    if (error) throw error

    return { count: count ?? 0, error: null }
  } catch (error) {
    console.error('[GSRealty] Error counting client properties:', error)
    return { count: 0, error: error as Error }
  }
}

/**
 * Create a deal for an existing property that doesn't have one
 * Used for properties that were created before auto-deal creation was implemented
 */
export async function createDealForProperty(propertyId: string): Promise<{
  property: ClientProperty | null
  deal: GSRealtyDeal | null
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    // Get the property first
    const { data: property, error: fetchError } = await supabase
      .from('gsrealty_client_properties')
      .select('*')
      .eq('id', propertyId)
      .single()

    if (fetchError || !property) {
      throw fetchError || new Error('Property not found')
    }

    // Check if already has a deal
    if (property.deal_id) {
      throw new Error('Property already has a linked deal')
    }

    // Create the deal
    const dealType = property.property_type === 'buying' ? 'buyer' : 'seller'
    const { deal, error: dealError } = await createDeal({
      client_id: property.client_id,
      type: dealType,
      stage: 'on_radar',
      property_address: property.property_address,
    })

    if (dealError || !deal) {
      throw dealError || new Error('Failed to create deal')
    }

    // Link the deal to the property
    const { data: updatedProperty, error: updateError } = await supabase
      .from('gsrealty_client_properties')
      .update({
        deal_id: deal.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', propertyId)
      .select()
      .single()

    if (updateError) throw updateError

    console.log('[GSRealty] Deal created for existing property:', propertyId, '→', deal.id)
    return { property: updatedProperty, deal, error: null }
  } catch (error) {
    console.error('[GSRealty] Error creating deal for property:', error)
    return { property: null, deal: null, error: error as Error }
  }
}

/**
 * Link a property to an existing deal (for migration or manual linking)
 */
export async function linkPropertyToDeal(
  propertyId: string,
  dealId: string
): Promise<{
  property: ClientProperty | null
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from('gsrealty_client_properties')
      .update({
        deal_id: dealId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', propertyId)
      .select()
      .single()

    if (error) throw error

    console.log('[GSRealty] Property linked to deal:', propertyId, '→', dealId)
    return { property: data, error: null }
  } catch (error) {
    console.error('[GSRealty] Error linking property to deal:', error)
    return { property: null, error: error as Error }
  }
}
