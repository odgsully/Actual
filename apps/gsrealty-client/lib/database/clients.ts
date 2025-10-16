/**
 * GSRealty Client Database Functions
 *
 * CRUD operations for gsrealty_clients table
 * Handles all client data management
 */

import { createClient as createSupabaseClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export interface GSRealtyClient {
  id: string
  user_id?: string | null
  first_name: string
  last_name: string
  phone?: string | null
  email?: string | null
  address?: string | null
  property_address?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface CreateClientInput {
  first_name: string
  last_name: string
  phone?: string
  email?: string
  address?: string
  property_address?: string
  notes?: string
  user_id?: string
}

export interface UpdateClientInput {
  first_name?: string
  last_name?: string
  phone?: string
  email?: string
  address?: string
  property_address?: string
  notes?: string
}

/**
 * Get all clients
 */
export async function getAllClients(): Promise<{
  clients: GSRealtyClient[] | null
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from('gsrealty_clients')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return { clients: data, error: null }
  } catch (error) {
    console.error('[GSRealty] Error fetching clients:', error)
    return { clients: null, error: error as Error }
  }
}

/**
 * Get client by ID
 */
export async function getClientById(id: string): Promise<{
  client: GSRealtyClient | null
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from('gsrealty_clients')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    return { client: data, error: null }
  } catch (error) {
    console.error('[GSRealty] Error fetching client:', error)
    return { client: null, error: error as Error }
  }
}

/**
 * Search clients by name or email
 */
export async function searchClients(query: string): Promise<{
  clients: GSRealtyClient[] | null
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from('gsrealty_clients')
      .select('*')
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { clients: data, error: null }
  } catch (error) {
    console.error('[GSRealty] Error searching clients:', error)
    return { clients: null, error: error as Error }
  }
}

/**
 * Create new client
 */
export async function createClient(input: CreateClientInput): Promise<{
  client: GSRealtyClient | null
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from('gsrealty_clients')
      .insert({
        first_name: input.first_name,
        last_name: input.last_name,
        phone: input.phone || null,
        email: input.email || null,
        address: input.address || null,
        property_address: input.property_address || null,
        notes: input.notes || null,
        user_id: input.user_id || null,
      })
      .select()
      .single()

    if (error) throw error

    console.log('[GSRealty] Client created:', data.id)
    return { client: data, error: null }
  } catch (error) {
    console.error('[GSRealty] Error creating client:', error)
    return { client: null, error: error as Error }
  }
}

/**
 * Update existing client
 */
export async function updateClient(
  id: string,
  input: UpdateClientInput
): Promise<{
  client: GSRealtyClient | null
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const updateData: any = {}
    if (input.first_name !== undefined) updateData.first_name = input.first_name
    if (input.last_name !== undefined) updateData.last_name = input.last_name
    if (input.phone !== undefined) updateData.phone = input.phone || null
    if (input.email !== undefined) updateData.email = input.email || null
    if (input.address !== undefined) updateData.address = input.address || null
    if (input.property_address !== undefined) updateData.property_address = input.property_address || null
    if (input.notes !== undefined) updateData.notes = input.notes || null

    const { data, error } = await supabase
      .from('gsrealty_clients')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    console.log('[GSRealty] Client updated:', id)
    return { client: data, error: null }
  } catch (error) {
    console.error('[GSRealty] Error updating client:', error)
    return { client: null, error: error as Error }
  }
}

/**
 * Delete client
 */
export async function deleteClient(id: string): Promise<{
  success: boolean
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { error } = await supabase
      .from('gsrealty_clients')
      .delete()
      .eq('id', id)

    if (error) throw error

    console.log('[GSRealty] Client deleted:', id)
    return { success: true, error: null }
  } catch (error) {
    console.error('[GSRealty] Error deleting client:', error)
    return { success: false, error: error as Error }
  }
}

/**
 * Get client count (for stats)
 */
export async function getClientCount(): Promise<{
  count: number
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { count, error } = await supabase
      .from('gsrealty_clients')
      .select('*', { count: 'exact', head: true })

    if (error) throw error

    return { count: count || 0, error: null }
  } catch (error) {
    console.error('[GSRealty] Error counting clients:', error)
    return { count: 0, error: error as Error }
  }
}
