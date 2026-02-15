/**
 * GSRealty File Database Functions
 *
 * CRUD operations for gsrealty_uploaded_files table
 * Handles file metadata storage and tracking
 */

import { createClient as createSupabaseClient } from '@/lib/supabase/client'
import type {
  UploadedFile,
  RecordFileUploadInput,
  ProcessingStatus,
} from '@/lib/types/storage'

/**
 * Record file upload metadata in database
 *
 * @param data - File upload information
 * @returns Created file record
 */
export async function recordFileUpload(data: RecordFileUploadInput): Promise<{
  file: UploadedFile | null
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { data: fileRecord, error } = await supabase
      .from('gsrealty_uploaded_files')
      .insert({
        client_id: data.clientId,
        file_name: data.fileName,
        file_type: data.fileType,
        storage_path: data.storagePath,
        file_size: data.fileSize,
        uploaded_by: data.uploadedBy,
        processed: false,
        processing_status: data.processingStatus || 'pending',
      })
      .select()
      .single()

    if (error) throw error

    console.log('[Files DB] File record created:', fileRecord.id)
    return { file: fileRecord as UploadedFile, error: null }
  } catch (error) {
    console.error('[Files DB] Error recording file upload:', error)
    return { file: null, error: error as Error }
  }
}

/**
 * Update file processing status
 *
 * @param fileId - File UUID
 * @param status - New processing status
 * @param errorMessage - Optional error message
 * @returns Success status
 */
export async function updateFileStatus(
  fileId: string,
  status: ProcessingStatus,
  errorMessage?: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const supabase = createSupabaseClient()

    const updateData: any = {
      processing_status: status,
      processed: status === 'complete',
    }

    if (errorMessage) {
      updateData.processing_errors = { message: errorMessage }
    }

    const { error } = await supabase
      .from('gsrealty_uploaded_files')
      .update(updateData)
      .eq('id', fileId)

    if (error) throw error

    console.log('[Files DB] File status updated:', fileId, status)
    return { success: true, error: null }
  } catch (error) {
    console.error('[Files DB] Error updating file status:', error)
    return { success: false, error: error as Error }
  }
}

/**
 * Update file with local path after saving to MacOS folder
 *
 * @param fileId - File UUID
 * @param localPath - Local file system path
 * @returns Success status
 */
export async function updateFileLocalPath(
  fileId: string,
  localPath: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const supabase = createSupabaseClient()

    const { error } = await supabase
      .from('gsrealty_uploaded_files')
      .update({ local_path: localPath })
      .eq('id', fileId)

    if (error) throw error

    console.log('[Files DB] Local path updated:', fileId)
    return { success: true, error: null }
  } catch (error) {
    console.error('[Files DB] Error updating local path:', error)
    return { success: false, error: error as Error }
  }
}

/**
 * Get all files for a client
 *
 * @param clientId - Client UUID
 * @returns Array of uploaded files
 */
export async function getClientFiles(clientId: string): Promise<{
  files: UploadedFile[]
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from('gsrealty_uploaded_files')
      .select('*')
      .eq('client_id', clientId)
      .order('upload_date', { ascending: false })

    if (error) throw error

    return { files: (data as UploadedFile[]) || [], error: null }
  } catch (error) {
    console.error('[Files DB] Error fetching client files:', error)
    return { files: [], error: error as Error }
  }
}

/**
 * Get file by ID
 *
 * @param fileId - File UUID
 * @returns File record
 */
export async function getFileById(fileId: string): Promise<{
  file: UploadedFile | null
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from('gsrealty_uploaded_files')
      .select('*')
      .eq('id', fileId)
      .single()

    if (error) throw error

    return { file: data as UploadedFile, error: null }
  } catch (error) {
    console.error('[Files DB] Error fetching file:', error)
    return { file: null, error: error as Error }
  }
}

/**
 * Get all files (admin view)
 *
 * @param limit - Maximum number of files to return
 * @returns Array of all uploaded files
 */
export async function getAllFiles(limit: number = 100): Promise<{
  files: UploadedFile[]
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from('gsrealty_uploaded_files')
      .select('*')
      .order('upload_date', { ascending: false })
      .limit(limit)

    if (error) throw error

    return { files: (data as UploadedFile[]) || [], error: null }
  } catch (error) {
    console.error('[Files DB] Error fetching all files:', error)
    return { files: [], error: error as Error }
  }
}

/**
 * Get files by processing status
 *
 * @param status - Processing status to filter by
 * @returns Array of files with matching status
 */
export async function getFilesByStatus(status: ProcessingStatus): Promise<{
  files: UploadedFile[]
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from('gsrealty_uploaded_files')
      .select('*')
      .eq('processing_status', status)
      .order('upload_date', { ascending: false })

    if (error) throw error

    return { files: (data as UploadedFile[]) || [], error: null }
  } catch (error) {
    console.error('[Files DB] Error fetching files by status:', error)
    return { files: [], error: error as Error }
  }
}

/**
 * Get files by type
 *
 * @param fileType - File type to filter by
 * @returns Array of files with matching type
 */
export async function getFilesByType(fileType: string): Promise<{
  files: UploadedFile[]
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from('gsrealty_uploaded_files')
      .select('*')
      .eq('file_type', fileType)
      .order('upload_date', { ascending: false })

    if (error) throw error

    return { files: (data as UploadedFile[]) || [], error: null }
  } catch (error) {
    console.error('[Files DB] Error fetching files by type:', error)
    return { files: [], error: error as Error }
  }
}

/**
 * Delete file record from database
 *
 * @param fileId - File UUID
 * @returns Success status
 */
export async function deleteFileRecord(fileId: string): Promise<{
  success: boolean
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { error } = await supabase
      .from('gsrealty_uploaded_files')
      .delete()
      .eq('id', fileId)

    if (error) throw error

    console.log('[Files DB] File record deleted:', fileId)
    return { success: true, error: null }
  } catch (error) {
    console.error('[Files DB] Error deleting file record:', error)
    return { success: false, error: error as Error }
  }
}

/**
 * Get file count for a client
 *
 * @param clientId - Client UUID
 * @returns File count
 */
export async function getClientFileCount(clientId: string): Promise<{
  count: number
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { count, error } = await supabase
      .from('gsrealty_uploaded_files')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)

    if (error) throw error

    return { count: count || 0, error: null }
  } catch (error) {
    console.error('[Files DB] Error counting client files:', error)
    return { count: 0, error: error as Error }
  }
}

/**
 * Get total file count (admin stats)
 *
 * @returns Total file count
 */
export async function getTotalFileCount(): Promise<{
  count: number
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { count, error } = await supabase
      .from('gsrealty_uploaded_files')
      .select('*', { count: 'exact', head: true })

    if (error) throw error

    return { count: count || 0, error: null }
  } catch (error) {
    console.error('[Files DB] Error counting total files:', error)
    return { count: 0, error: error as Error }
  }
}

/**
 * Get file statistics grouped by type
 *
 * @returns File counts by type
 */
export async function getFileStatsByType(): Promise<{
  stats: Record<string, number>
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from('gsrealty_uploaded_files')
      .select('file_type')

    if (error) throw error

    // Count by type
    const stats: Record<string, number> = {}
    data?.forEach((file) => {
      const type = file.file_type || 'unknown'
      stats[type] = (stats[type] || 0) + 1
    })

    return { stats, error: null }
  } catch (error) {
    console.error('[Files DB] Error getting file stats:', error)
    return { stats: {}, error: error as Error }
  }
}

/**
 * Get recent uploads (last 7 days)
 *
 * @returns Array of recent files
 */
export async function getRecentUploads(days: number = 7): Promise<{
  files: UploadedFile[]
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const { data, error } = await supabase
      .from('gsrealty_uploaded_files')
      .select('*')
      .gte('upload_date', cutoffDate.toISOString())
      .order('upload_date', { ascending: false })

    if (error) throw error

    return { files: (data as UploadedFile[]) || [], error: null }
  } catch (error) {
    console.error('[Files DB] Error fetching recent uploads:', error)
    return { files: [], error: error as Error }
  }
}

/**
 * Search files by name
 *
 * @param query - Search query
 * @returns Array of matching files
 */
export async function searchFilesByName(query: string): Promise<{
  files: UploadedFile[]
  error: Error | null
}> {
  try {
    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from('gsrealty_uploaded_files')
      .select('*')
      .ilike('file_name', `%${query}%`)
      .order('upload_date', { ascending: false })

    if (error) throw error

    return { files: (data as UploadedFile[]) || [], error: null }
  } catch (error) {
    console.error('[Files DB] Error searching files:', error)
    return { files: [], error: error as Error }
  }
}
