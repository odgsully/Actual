/**
 * Upload Form Validation Schema
 *
 * Zod schemas for validating file uploads for MLS data processing
 */

import { z } from 'zod'

/**
 * Upload types supported by the system
 */
export const UPLOAD_TYPES = {
  DIRECT_COMPS: 'direct_comps',
  ALL_SCOPES: 'all_scopes',
  HALF_MILE: 'half_mile',
} as const

export type UploadType = typeof UPLOAD_TYPES[keyof typeof UPLOAD_TYPES]

/**
 * File validation constants
 */
export const FILE_CONSTRAINTS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10 MB
  ACCEPTED_TYPES: [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  ACCEPTED_EXTENSIONS: ['.csv', '.xlsx', '.xls'],
} as const

/**
 * Upload form validation schema
 */
export const uploadFormSchema = z.object({
  clientId: z
    .string()
    .uuid({ message: 'Please select a valid client' })
    .min(1, { message: 'Client selection is required' }),

  uploadType: z
    .enum([UPLOAD_TYPES.DIRECT_COMPS, UPLOAD_TYPES.ALL_SCOPES, UPLOAD_TYPES.HALF_MILE], {
      required_error: 'Please select an upload type',
      invalid_type_error: 'Invalid upload type selected',
    }),

  file: z
    .instanceof(File, { message: 'Please select a file to upload' })
    .refine(
      (file: File) => file.size > 0,
      { message: 'File is empty, please select a valid file' }
    )
    .refine(
      (file: File) => file.size <= FILE_CONSTRAINTS.MAX_SIZE,
      {
        message: `File size must be less than ${FILE_CONSTRAINTS.MAX_SIZE / 1024 / 1024}MB`,
      }
    )
    .refine(
      (file: File) => {
        const extension = ('.' + file.name.split('.').pop()?.toLowerCase()) as '.csv' | '.xlsx' | '.xls'
        return FILE_CONSTRAINTS.ACCEPTED_EXTENSIONS.includes(extension)
      },
      {
        message: 'Only CSV and Excel files (.csv, .xlsx, .xls) are allowed',
      }
    )
    .refine(
      (file: File) => {
        const acceptedTypes = FILE_CONSTRAINTS.ACCEPTED_TYPES as readonly string[]
        return acceptedTypes.includes(file.type) || file.type === ''
      },
      {
        message: 'Invalid file type, please upload a CSV or Excel file',
      }
    ),
})

export type UploadFormData = z.infer<typeof uploadFormSchema>

/**
 * Upload result schema (for processing results)
 */
export const uploadResultSchema = z.object({
  success: z.boolean(),
  uploadId: z.string().optional(),
  totalRows: z.number().optional(),
  validRows: z.number().optional(),
  skippedRows: z.number().optional(),
  errors: z.array(z.string()).optional(),
  warnings: z.array(z.string()).optional(),
  downloadUrl: z.string().optional(),
  message: z.string().optional(),
  /** Phase 0.5a: Enrichment batch summary (abort reason, resolution stats) */
  enrichmentSummary: z.object({
    total: z.number(),
    resolved: z.number(),
    apnFailed: z.number(),
    skipped: z.number(),
    retryable: z.number(),
    durationMs: z.number(),
    aborted: z.boolean(),
    abortReason: z.string().optional(),
  }).optional(),
})

export type UploadResult = z.infer<typeof uploadResultSchema>

/**
 * Processing status types
 */
export const PROCESSING_STATUS = {
  IDLE: 'idle',
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  COMPLETE: 'complete',
  ERROR: 'error',
} as const

export type ProcessingStatus = typeof PROCESSING_STATUS[keyof typeof PROCESSING_STATUS]

/**
 * Helper function to validate file before upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size === 0) {
    return { valid: false, error: 'File is empty' }
  }

  if (file.size > FILE_CONSTRAINTS.MAX_SIZE) {
    return {
      valid: false,
      error: `File is too large. Maximum size is ${FILE_CONSTRAINTS.MAX_SIZE / 1024 / 1024}MB`,
    }
  }

  // Check file extension
  const extension = ('.' + file.name.split('.').pop()?.toLowerCase()) as '.csv' | '.xlsx' | '.xls'
  const acceptedExtensions = FILE_CONSTRAINTS.ACCEPTED_EXTENSIONS as readonly string[]
  if (!acceptedExtensions.includes(extension)) {
    return {
      valid: false,
      error: 'Invalid file type. Only CSV and Excel files are allowed',
    }
  }

  return { valid: true }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Get upload type label for display
 */
export function getUploadTypeLabel(type: UploadType): string {
  switch (type) {
    case UPLOAD_TYPES.DIRECT_COMPS:
      return 'Direct Comparables'
    case UPLOAD_TYPES.ALL_SCOPES:
      return 'All Scopes'
    case UPLOAD_TYPES.HALF_MILE:
      return 'Half Mile Radius'
    default:
      return 'Unknown'
  }
}
