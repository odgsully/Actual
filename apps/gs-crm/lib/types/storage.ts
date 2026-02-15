/**
 * TypeScript Types for Storage System
 *
 * Type definitions for file storage, uploads, and metadata
 */

/**
 * File types allowed in the system
 */
export type FileType = 'csv' | 'xlsx' | 'html' | 'pdf'

/**
 * Upload types for MLS data processing
 */
export type UploadType = 'direct_comps' | 'all_scopes' | 'half_mile'

/**
 * Processing status for uploaded files
 */
export type ProcessingStatus = 'pending' | 'processing' | 'complete' | 'error'

/**
 * Storage folder types in Supabase
 */
export type StorageFolder = 'uploads' | 'processed'

/**
 * Uploaded file record from database
 * Matches gsrealty_uploaded_files table schema
 */
export interface UploadedFile {
  id: string
  client_id: string
  file_name: string
  file_type: FileType
  upload_type?: UploadType
  storage_path: string
  local_path?: string | null
  file_size: number
  uploaded_by: string
  upload_date: string
  processed: boolean
  processing_status?: string | null
  processing_errors?: Record<string, any> | null
}

/**
 * Input for recording a new file upload
 */
export interface RecordFileUploadInput {
  clientId: string
  fileName: string
  fileType: FileType
  uploadType?: UploadType
  storagePath: string
  localPath?: string
  fileSize: number
  uploadedBy: string
  processingStatus?: ProcessingStatus
}

/**
 * File from Supabase Storage listing
 */
export interface StorageFile {
  name: string
  path: string
  size: number
  created_at: string
  updated_at?: string
  last_accessed_at?: string
  metadata?: Record<string, any>
}

/**
 * Result from upload operation
 */
export interface UploadResult {
  url: string | null
  path: string | null
  error: Error | null
}

/**
 * Result from download operation
 */
export interface DownloadResult {
  blob: Blob | null
  error: Error | null
}

/**
 * Result from delete operation
 */
export interface DeleteResult {
  success: boolean
  error: Error | null
}

/**
 * Result from list files operation
 */
export interface ListFilesResult {
  files: StorageFile[]
  error: Error | null
}

/**
 * Local folder creation result
 */
export interface LocalFolderResult {
  folderPath: string | null
  folderName: string
  error: Error | null
}

/**
 * Local file save result
 */
export interface LocalFileSaveResult {
  path: string | null
  error: Error | null
}

/**
 * File validation result
 */
export interface FileValidation {
  valid: boolean
  errors: string[]
}

/**
 * Upload metadata for tracking
 */
export interface UploadMetadata {
  clientId: string
  clientName: string
  uploadType?: UploadType
  originalFilename: string
  uploadedBy: string
  timestamp: number
}

/**
 * Storage statistics
 */
export interface StorageStats {
  totalFiles: number
  totalSize: number
  filesByType: Record<FileType, number>
  filesByStatus: Record<ProcessingStatus, number>
}
