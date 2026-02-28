/**
 * Zod Request Schemas for Critical API Endpoints
 *
 * Phase -1: Contract hardening — strict request-body validation
 * for endpoints in the MLS upload and report pipeline.
 */

import { z } from 'zod'

// ─── Shared primitives ────────────────────────────────────

const apnFormat = z
  .string()
  .regex(/^\d{3}-\d{2}-\d{3}[A-Z]?$/, 'APN must be in format XXX-XX-XXXA')

const nonEmptyString = z.string().min(1, 'Must not be empty')

// ─── generate-excel ───────────────────────────────────────

export const subjectPropertySchema = z.object({
  address: z.string().optional(),
  apn: z.string().optional(),
})

export const visionScoreSchema = z.object({
  address: nonEmptyString,
  score: z.number().min(1).max(10),
  renoYear: z.number().int().min(1900).max(2100).optional(),
  confidence: z.unknown().transform((v) => {
    if (v == null || v === '') return undefined
    const n = Number(v)
    return Number.isFinite(n) ? n : undefined
  }).pipe(z.number().min(0).max(1).optional()),
  dwellingType: z.string().optional(),
})

export const generateExcelSchema = z.object({
  subjectProperty: subjectPropertySchema.optional(),
  residential15Mile: z.array(z.record(z.unknown())).optional().default([]),
  residentialLease15Mile: z.array(z.record(z.unknown())).optional().default([]),
  residential3YrDirect: z.array(z.record(z.unknown())).optional().default([]),
  residentialLease3YrDirect: z.array(z.record(z.unknown())).optional().default([]),
  mcaoData: z.record(z.unknown()).optional(),
  clientName: z.string().optional().default(''),
  subjectManualInputs: z.record(z.unknown()).optional(),
  visionScores: z.array(visionScoreSchema).optional().default([]),
  batchId: z.string().optional(),
})

export type GenerateExcelInput = z.infer<typeof generateExcelSchema>

// ─── score-pdf ────────────────────────────────────────────

export const scorePdfSchema = z.object({
  storagePaths: z.array(nonEmptyString).min(1, 'At least one storage path required').max(100),
  propertyData: z.array(z.record(z.unknown())).min(1, 'At least one property required'),
  clientId: nonEmptyString,
  forceRescore: z.boolean().optional().default(false),
  options: z.record(z.unknown()).optional(),
})

export type ScorePdfInput = z.infer<typeof scorePdfSchema>

// ─── MCAO lookup ──────────────────────────────────────────

export const mcaoLookupSchema = z
  .object({
    apn: apnFormat.optional(),
    address: z.string().optional(),
    includeHistory: z.boolean().optional().default(false),
    includeTax: z.boolean().optional().default(false),
    refresh: z.boolean().optional().default(false),
  })
  .refine((data) => data.apn || data.address, {
    message: 'Either apn or address is required',
  })

export type MCAOLookupInput = z.infer<typeof mcaoLookupSchema>

// ─── contact upload (import) ──────────────────────────────

export const fieldMappingSchema = z.object({
  first_name: nonEmptyString,
  last_name: nonEmptyString,
  email: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  notes: z.string().optional(),
  tags: z.string().optional(),
  source: z.string().optional(),
})

export type FieldMappingInput = z.infer<typeof fieldMappingSchema>

// ─── delete-user ──────────────────────────────────────────

export const deleteUserSchema = z.object({
  email: z.string().email('Valid email required'),
})

export type DeleteUserInput = z.infer<typeof deleteUserSchema>

// ─── run-migration ────────────────────────────────────────

export const runMigrationSchema = z.object({
  migrationFile: z
    .string()
    .regex(/^[\w.-]+\.sql$/, 'Migration filename must end in .sql and contain only safe characters')
    .optional()
    .default('006_add_image_and_demo_columns.sql'),
})

export type RunMigrationInput = z.infer<typeof runMigrationSchema>

// ─── reportit/upload ─────────────────────────────────────

export const reportitUploadSchema = z.object({
  type: z.enum(['breakups', 'propertyradar']),
})

export type ReportitUploadInput = z.infer<typeof reportitUploadSchema>

// ─── upload/process (template generation) ────────────────

export const templateGenerationSchema = z.object({
  compsData: z.array(z.record(z.unknown())).min(1, 'At least one comp required'),
  subjectProperty: z.record(z.unknown()),
  mcaoData: z.record(z.unknown()).optional(),
})

export type TemplateGenerationInput = z.infer<typeof templateGenerationSchema>

// ─── upload/store ────────────────────────────────────────

export const uploadStoreSchema = z.object({
  clientId: z.string().uuid('clientId must be a valid UUID'),
  fileName: z.string().min(1).max(255).regex(/^[a-zA-Z0-9][a-zA-Z0-9_. -]*$/, 'fileName contains invalid characters'),
  fileType: z.enum(['csv', 'xlsx', 'html', 'pdf']),
  uploadType: z.enum(['direct_comps', 'all_scopes', 'half_mile']).optional(),
  fileBuffer: z.string().min(1, 'fileBuffer is required'),
  contentType: z.string().min(1),
  uploadedBy: z.string().uuid('uploadedBy must be a valid UUID'),
})

export type UploadStoreInput = z.infer<typeof uploadStoreSchema>

// ─── Helper: validate request body ────────────────────────

/**
 * Parse and validate a JSON request body against a Zod schema.
 * Returns the validated data or a formatted error string.
 *
 * @example
 * const result = await validateBody(request, generateExcelSchema)
 * if (!result.success) return apiError(400, result.error)
 * const data = result.data
 */
export async function validateBody<T extends z.ZodTypeAny>(
  request: Request,
  schema: T
): Promise<{ success: true; data: z.infer<T> } | { success: false; error: string }> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return { success: false, error: 'Invalid JSON body' }
  }

  const result = schema.safeParse(body)
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ')
    return { success: false, error: issues }
  }

  return { success: true, data: result.data }
}
