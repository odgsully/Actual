/**
 * Storage Configuration for GSRealty
 *
 * Defines storage paths, limits, and settings
 * for file uploads and local folder organization
 */

export const STORAGE_CONFIG = {
  // Supabase Storage
  bucket: 'gsrealty-uploads',
  maxFileSize: 10 * 1024 * 1024, // 10 MB
  allowedTypes: [
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/html',
    'application/pdf',
  ],

  // Local MacOS Storage
  localBasePath: '/Users/garrettsullivan/Desktop/‼️/RE/RealtyONE/MY LISTINGS/',

  // File Retention
  retentionDays: 365, // Keep files for 1 year

  // Processing
  processingTimeout: 60000, // 60 seconds
} as const

/**
 * File types supported by the system
 */
export const FILE_TYPES = {
  CSV: 'csv',
  XLSX: 'xlsx',
  HTML: 'html',
  PDF: 'pdf',
} as const

/**
 * Upload types for MLS data
 */
export const UPLOAD_TYPES = {
  DIRECT_COMPS: 'direct_comps',
  ALL_SCOPES: 'all_scopes',
  HALF_MILE: 'half_mile',
} as const

/**
 * Processing status values
 */
export const PROCESSING_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETE: 'complete',
  ERROR: 'error',
} as const

/**
 * Get file extension from MIME type
 */
export function getFileExtension(mimeType: string): string {
  const typeMap: Record<string, string> = {
    'text/csv': 'csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-excel': 'xlsx',
    'text/html': 'html',
    'application/pdf': 'pdf',
  }

  return typeMap[mimeType] || 'unknown'
}

/**
 * Validate file size
 */
export function isValidFileSize(size: number): boolean {
  return size > 0 && size <= STORAGE_CONFIG.maxFileSize
}

/**
 * Validate file type
 */
export function isValidFileType(mimeType: string): boolean {
  return (STORAGE_CONFIG.allowedTypes as readonly string[]).includes(mimeType)
}

/**
 * Generate storage path for Supabase
 * Format: clients/{clientId}/{folder}/{filename}
 */
export function generateStoragePath(
  clientId: string,
  folder: 'uploads' | 'processed',
  filename: string
): string {
  return `clients/${clientId}/${folder}/${filename}`
}

/**
 * Generate local folder name
 * Format: "LastName MM.YY"
 */
export function generateLocalFolderName(
  lastName: string,
  date: Date = new Date()
): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = String(date.getFullYear()).slice(-2)
  return `${lastName} ${month}.${year}`
}

/**
 * Generate timestamped filename
 * Format: {clientName}_{uploadType}_{timestamp}.{ext}
 */
export function generateFilename(
  clientName: string,
  uploadType: string,
  originalFilename: string
): string {
  const timestamp = Date.now()
  const extension = originalFilename.split('.').pop()
  const cleanName = clientName.replace(/[^a-zA-Z0-9]/g, '_')
  return `${cleanName}_${uploadType}_${timestamp}.${extension}`
}
