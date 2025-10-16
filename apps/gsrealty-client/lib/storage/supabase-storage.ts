/**
 * Supabase Storage Integration
 *
 * Handles file uploads, downloads, and deletions in Supabase Storage
 * Bucket: gsrealty-uploads
 */

import { createClient } from '@/lib/supabase/client'
import type {
  UploadResult,
  DownloadResult,
  DeleteResult,
  ListFilesResult,
  StorageFile,
} from '@/lib/types/storage'
import { STORAGE_CONFIG } from './config'

/**
 * Initialize Supabase Storage bucket
 * Creates bucket if it doesn't exist
 */
export async function initializeStorage(): Promise<void> {
  const supabase = createClient()

  // Check if bucket exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()

  if (listError) {
    console.error('[Storage] Error listing buckets:', listError)
    throw new Error('Failed to list storage buckets')
  }

  const bucketExists = buckets?.some((b) => b.name === STORAGE_CONFIG.bucket)

  if (!bucketExists) {
    // Create bucket with public access disabled
    const { data, error } = await supabase.storage.createBucket(STORAGE_CONFIG.bucket, {
      public: false,
      fileSizeLimit: STORAGE_CONFIG.maxFileSize,
      allowedMimeTypes: [...STORAGE_CONFIG.allowedTypes],
    })

    if (error) {
      console.error('[Storage] Error creating bucket:', error)
      throw new Error('Failed to create storage bucket')
    }

    console.log('[Storage] Bucket created:', STORAGE_CONFIG.bucket)
  } else {
    console.log('[Storage] Bucket already exists:', STORAGE_CONFIG.bucket)
  }
}

/**
 * Upload file to Supabase Storage
 *
 * @param file - File to upload
 * @param path - Storage path (e.g., clients/{clientId}/uploads/file.xlsx)
 * @param bucket - Bucket name (defaults to gsrealty-uploads)
 * @returns Upload result with URL and path
 */
export async function uploadToSupabase(
  file: File,
  path: string,
  bucket: string = STORAGE_CONFIG.bucket
): Promise<UploadResult> {
  try {
    const supabase = createClient()

    // Validate file size
    if (file.size > STORAGE_CONFIG.maxFileSize) {
      throw new Error(
        `File size ${file.size} exceeds maximum ${STORAGE_CONFIG.maxFileSize} bytes`
      )
    }

    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false, // Don't overwrite existing files
      })

    if (error) {
      console.error('[Storage] Upload error:', error)
      return { url: null, path: null, error }
    }

    // Get public URL (even though bucket is private, we'll use signed URLs later)
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)

    console.log('[Storage] File uploaded successfully:', path)
    return {
      url: urlData.publicUrl,
      path: data.path,
      error: null,
    }
  } catch (error) {
    console.error('[Storage] Upload exception:', error)
    return {
      url: null,
      path: null,
      error: error as Error,
    }
  }
}

/**
 * Upload buffer to Supabase Storage
 * Useful for processed files
 *
 * @param buffer - File buffer
 * @param path - Storage path
 * @param contentType - MIME type
 * @param bucket - Bucket name
 * @returns Upload result
 */
export async function uploadBufferToSupabase(
  buffer: Buffer,
  path: string,
  contentType: string,
  bucket: string = STORAGE_CONFIG.bucket
): Promise<UploadResult> {
  try {
    const supabase = createClient()

    // Upload buffer
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType,
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('[Storage] Buffer upload error:', error)
      return { url: null, path: null, error }
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)

    console.log('[Storage] Buffer uploaded successfully:', path)
    return {
      url: urlData.publicUrl,
      path: data.path,
      error: null,
    }
  } catch (error) {
    console.error('[Storage] Buffer upload exception:', error)
    return {
      url: null,
      path: null,
      error: error as Error,
    }
  }
}

/**
 * Download file from Supabase Storage
 *
 * @param path - Storage path
 * @param bucket - Bucket name
 * @returns Download result with blob
 */
export async function downloadFromSupabase(
  path: string,
  bucket: string = STORAGE_CONFIG.bucket
): Promise<DownloadResult> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.storage.from(bucket).download(path)

    if (error) {
      console.error('[Storage] Download error:', error)
      return { blob: null, error }
    }

    console.log('[Storage] File downloaded successfully:', path)
    return { blob: data, error: null }
  } catch (error) {
    console.error('[Storage] Download exception:', error)
    return { blob: null, error: error as Error }
  }
}

/**
 * Create signed URL for temporary access
 *
 * @param path - Storage path
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @param bucket - Bucket name
 * @returns Signed URL or null
 */
export async function createSignedUrl(
  path: string,
  expiresIn: number = 3600,
  bucket: string = STORAGE_CONFIG.bucket
): Promise<{ url: string | null; error: Error | null }> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn)

    if (error) {
      console.error('[Storage] Signed URL error:', error)
      return { url: null, error }
    }

    return { url: data.signedUrl, error: null }
  } catch (error) {
    console.error('[Storage] Signed URL exception:', error)
    return { url: null, error: error as Error }
  }
}

/**
 * Delete file from Supabase Storage
 *
 * @param path - Storage path
 * @param bucket - Bucket name
 * @returns Delete result
 */
export async function deleteFromSupabase(
  path: string,
  bucket: string = STORAGE_CONFIG.bucket
): Promise<DeleteResult> {
  try {
    const supabase = createClient()

    const { error } = await supabase.storage.from(bucket).remove([path])

    if (error) {
      console.error('[Storage] Delete error:', error)
      return { success: false, error }
    }

    console.log('[Storage] File deleted successfully:', path)
    return { success: true, error: null }
  } catch (error) {
    console.error('[Storage] Delete exception:', error)
    return { success: false, error: error as Error }
  }
}

/**
 * Delete multiple files from Supabase Storage
 *
 * @param paths - Array of storage paths
 * @param bucket - Bucket name
 * @returns Delete result
 */
export async function deleteMultipleFromSupabase(
  paths: string[],
  bucket: string = STORAGE_CONFIG.bucket
): Promise<DeleteResult> {
  try {
    const supabase = createClient()

    const { error } = await supabase.storage.from(bucket).remove(paths)

    if (error) {
      console.error('[Storage] Delete multiple error:', error)
      return { success: false, error }
    }

    console.log('[Storage] Files deleted successfully:', paths.length)
    return { success: true, error: null }
  } catch (error) {
    console.error('[Storage] Delete multiple exception:', error)
    return { success: false, error: error as Error }
  }
}

/**
 * List files in a folder
 *
 * @param folderPath - Folder path (e.g., clients/{clientId}/uploads)
 * @param bucket - Bucket name
 * @returns List of files
 */
export async function listFilesInFolder(
  folderPath: string,
  bucket: string = STORAGE_CONFIG.bucket
): Promise<ListFilesResult> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.storage.from(bucket).list(folderPath, {
      limit: 1000,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' },
    })

    if (error) {
      console.error('[Storage] List files error:', error)
      return { files: [], error }
    }

    // Convert to StorageFile format
    const files: StorageFile[] = (data || []).map((item) => ({
      name: item.name,
      path: `${folderPath}/${item.name}`,
      size: item.metadata?.size || 0,
      created_at: item.created_at || '',
      updated_at: item.updated_at,
      last_accessed_at: item.last_accessed_at,
      metadata: item.metadata,
    }))

    return { files, error: null }
  } catch (error) {
    console.error('[Storage] List files exception:', error)
    return { files: [], error: error as Error }
  }
}

/**
 * List all files for a client
 * Searches both uploads and processed folders
 *
 * @param clientId - Client UUID
 * @returns List of all client files
 */
export async function listClientFiles(clientId: string): Promise<ListFilesResult> {
  try {
    const supabase = createClient()

    // List files in uploads folder
    const { files: uploadFiles, error: uploadError } = await listFilesInFolder(
      `clients/${clientId}/uploads`
    )

    if (uploadError) {
      console.error('[Storage] Error listing upload files:', uploadError)
    }

    // List files in processed folder
    const { files: processedFiles, error: processedError } = await listFilesInFolder(
      `clients/${clientId}/processed`
    )

    if (processedError) {
      console.error('[Storage] Error listing processed files:', processedError)
    }

    // Combine results
    const allFiles = [...(uploadFiles || []), ...(processedFiles || [])]

    return {
      files: allFiles,
      error: uploadError || processedError || null,
    }
  } catch (error) {
    console.error('[Storage] List client files exception:', error)
    return { files: [], error: error as Error }
  }
}

/**
 * Check if file exists in storage
 *
 * @param path - Storage path
 * @param bucket - Bucket name
 * @returns True if file exists
 */
export async function fileExists(
  path: string,
  bucket: string = STORAGE_CONFIG.bucket
): Promise<boolean> {
  try {
    const supabase = createClient()

    // Try to get file metadata
    const { data, error } = await supabase.storage.from(bucket).list(path.split('/').slice(0, -1).join('/'), {
      search: path.split('/').pop(),
    })

    if (error) return false
    return (data?.length || 0) > 0
  } catch (error) {
    console.error('[Storage] File exists check exception:', error)
    return false
  }
}

/**
 * Get file metadata
 *
 * @param path - Storage path
 * @param bucket - Bucket name
 * @returns File metadata or null
 */
export async function getFileMetadata(
  path: string,
  bucket: string = STORAGE_CONFIG.bucket
): Promise<{ size: number; created_at: string } | null> {
  try {
    const supabase = createClient()

    const folderPath = path.split('/').slice(0, -1).join('/')
    const fileName = path.split('/').pop()

    const { data, error } = await supabase.storage.from(bucket).list(folderPath, {
      search: fileName,
    })

    if (error || !data || data.length === 0) {
      return null
    }

    const file = data[0]
    return {
      size: file.metadata?.size || 0,
      created_at: file.created_at || '',
    }
  } catch (error) {
    console.error('[Storage] Get metadata exception:', error)
    return null
  }
}
