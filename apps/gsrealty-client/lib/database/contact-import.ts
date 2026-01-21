/**
 * GSRealty Contact Import Database Functions
 *
 * Handles bulk contact imports with tracking and rollback capability
 */

import { createClient as createSupabaseClient } from '@/lib/supabase/client'
import type { CreateClientInput, GSRealtyClient } from './clients'

// Import batch status types
export type ImportStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'rolled_back'

// Import batch interface
export interface ImportBatch {
  id: string
  file_name: string
  file_type: 'csv' | 'xlsx'
  file_size_bytes: number | null
  total_rows: number
  imported_count: number
  skipped_count: number
  error_count: number
  field_mapping: Record<string, string | null>
  skipped_rows: SkippedRow[]
  error_rows: ErrorRow[]
  status: ImportStatus
  created_at: string
  completed_at: string | null
  rolled_back_at: string | null
  created_by: string | null
}

export interface SkippedRow {
  row: number
  reason: 'duplicate_email' | 'duplicate_phone'
  email?: string
  phone?: string
}

export interface ErrorRow {
  row: number
  reason: 'missing_first_name' | 'missing_last_name' | 'invalid_email' | 'parse_error'
  field?: string
  value?: string
}

// Field mapping type
export interface FieldMapping {
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  address: string | null
  client_type: string | null
  status: string | null
  notes: string | null
}

// Create import batch input
export interface CreateImportBatchInput {
  file_name: string
  file_type: 'csv' | 'xlsx'
  file_size_bytes?: number
  total_rows: number
  field_mapping: FieldMapping
}

/**
 * Create a new import batch record
 */
export async function createImportBatch(input: CreateImportBatchInput): Promise<{
  batch: ImportBatch | null
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from('gsrealty_import_batches')
      .insert({
        file_name: input.file_name,
        file_type: input.file_type,
        file_size_bytes: input.file_size_bytes || null,
        total_rows: input.total_rows,
        field_mapping: input.field_mapping,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error

    console.log('[GSRealty] Import batch created:', data.id)
    return { batch: data, error: null }
  } catch (error) {
    console.error('[GSRealty] Error creating import batch:', error)
    return { batch: null, error: error as Error }
  }
}

/**
 * Update import batch status
 */
export async function updateImportBatchStatus(
  batchId: string,
  status: ImportStatus,
  stats?: {
    imported_count?: number
    skipped_count?: number
    error_count?: number
    skipped_rows?: SkippedRow[]
    error_rows?: ErrorRow[]
  }
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const supabase = createSupabaseClient()

    const updateData: Record<string, unknown> = { status }

    if (stats?.imported_count !== undefined) updateData.imported_count = stats.imported_count
    if (stats?.skipped_count !== undefined) updateData.skipped_count = stats.skipped_count
    if (stats?.error_count !== undefined) updateData.error_count = stats.error_count
    if (stats?.skipped_rows) updateData.skipped_rows = stats.skipped_rows
    if (stats?.error_rows) updateData.error_rows = stats.error_rows

    if (status === 'completed' || status === 'failed') {
      updateData.completed_at = new Date().toISOString()
    }

    if (status === 'rolled_back') {
      updateData.rolled_back_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('gsrealty_import_batches')
      .update(updateData)
      .eq('id', batchId)

    if (error) throw error

    console.log('[GSRealty] Import batch status updated:', batchId, '→', status)
    return { success: true, error: null }
  } catch (error) {
    console.error('[GSRealty] Error updating import batch:', error)
    return { success: false, error: error as Error }
  }
}

/**
 * Get import batch by ID
 */
export async function getImportBatch(batchId: string): Promise<{
  batch: ImportBatch | null
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from('gsrealty_import_batches')
      .select('*')
      .eq('id', batchId)
      .single()

    if (error) throw error

    return { batch: data, error: null }
  } catch (error) {
    console.error('[GSRealty] Error fetching import batch:', error)
    return { batch: null, error: error as Error }
  }
}

/**
 * Get all import batches (history)
 */
export async function getImportHistory(limit: number = 50): Promise<{
  batches: ImportBatch[]
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from('gsrealty_import_batches')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return { batches: data || [], error: null }
  } catch (error) {
    console.error('[GSRealty] Error fetching import history:', error)
    return { batches: [], error: error as Error }
  }
}

/**
 * Bulk create clients from import
 */
export async function bulkCreateClients(
  batchId: string,
  clients: CreateClientInput[]
): Promise<{
  created: GSRealtyClient[]
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    // Add import_batch_id to each client
    const clientsWithBatch = clients.map(client => ({
      first_name: client.first_name,
      last_name: client.last_name,
      phone: client.phone || null,
      email: client.email || null,
      address: client.address || null,
      property_address: client.property_address || null,
      client_type: client.client_type || 'buyer',
      status: client.status || 'prospect',
      notes: client.notes || null,
      user_id: client.user_id || null,
      import_batch_id: batchId,
    }))

    const { data, error } = await supabase
      .from('gsrealty_clients')
      .insert(clientsWithBatch)
      .select()

    if (error) throw error

    console.log('[GSRealty] Bulk created', data?.length || 0, 'clients for batch:', batchId)
    return { created: data || [], error: null }
  } catch (error) {
    console.error('[GSRealty] Error bulk creating clients:', error)
    return { created: [], error: error as Error }
  }
}

/**
 * Rollback an import batch (delete all clients from that batch)
 */
export async function rollbackImportBatch(batchId: string): Promise<{
  deletedCount: number
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    // First, count how many clients will be deleted
    const { count, error: countError } = await supabase
      .from('gsrealty_clients')
      .select('*', { count: 'exact', head: true })
      .eq('import_batch_id', batchId)

    if (countError) throw countError

    // Delete all clients from this batch
    const { error: deleteError } = await supabase
      .from('gsrealty_clients')
      .delete()
      .eq('import_batch_id', batchId)

    if (deleteError) throw deleteError

    // Update batch status to rolled_back
    await updateImportBatchStatus(batchId, 'rolled_back')

    console.log('[GSRealty] Rolled back import batch:', batchId, 'deleted:', count || 0, 'clients')
    return { deletedCount: count || 0, error: null }
  } catch (error) {
    console.error('[GSRealty] Error rolling back import batch:', error)
    return { deletedCount: 0, error: error as Error }
  }
}

/**
 * Check for existing emails in database
 */
export async function getExistingEmails(): Promise<{
  emails: Set<string>
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from('gsrealty_clients')
      .select('email')
      .not('email', 'is', null)

    if (error) throw error

    const emailSet = new Set<string>()
    data?.forEach(row => {
      if (row.email) {
        emailSet.add(row.email.toLowerCase().trim())
      }
    })

    return { emails: emailSet, error: null }
  } catch (error) {
    console.error('[GSRealty] Error fetching existing emails:', error)
    return { emails: new Set(), error: error as Error }
  }
}

/**
 * Check for existing phone numbers in database
 */
export async function getExistingPhones(): Promise<{
  phones: Set<string>
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from('gsrealty_clients')
      .select('phone')
      .not('phone', 'is', null)

    if (error) throw error

    const phoneSet = new Set<string>()
    data?.forEach(row => {
      if (row.phone) {
        // Normalize phone for comparison (digits only)
        const normalized = row.phone.replace(/\D/g, '')
        if (normalized.length >= 10) {
          phoneSet.add(normalized.slice(-10)) // Last 10 digits
        }
      }
    })

    return { phones: phoneSet, error: null }
  } catch (error) {
    console.error('[GSRealty] Error fetching existing phones:', error)
    return { phones: new Set(), error: error as Error }
  }
}

/**
 * Normalize phone number to 10 digits
 */
export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null

  const digits = phone.replace(/\D/g, '')

  // Handle various formats
  if (digits.length === 10) {
    return digits
  } else if (digits.length === 11 && digits.startsWith('1')) {
    return digits.slice(1)
  } else if (digits.length > 10) {
    return digits.slice(-10)
  }

  return digits.length >= 7 ? digits : null
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Format phone number for display
 */
export function formatPhone(phone: string | null): string {
  if (!phone) return ''

  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return phone
}
