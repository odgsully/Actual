/**
 * Unified Enrichment Result Types
 *
 * Phase 0.5a: Single error model for ArcGIS, MCAO client, and batch processors.
 * Replaces 3 incompatible error shapes with one consistent interface.
 */

// ─── Error classification ────────────────────────────────

export type EnrichmentErrorCode =
  // APN resolution errors
  | 'APN_NOT_FOUND'
  | 'APN_SKIPPED'        // Pre-filtered (PO Box, no number, too short)
  | 'APN_AMBIGUOUS'      // Multiple candidates, low confidence
  // MCAO fetch errors
  | 'MCAO_NOT_FOUND'
  | 'MCAO_PARSE_ERROR'
  | 'MCAO_CACHE_ERROR'
  // Network/service errors
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'RATE_LIMIT'
  | 'SERVICE_UNAVAILABLE'
  // Validation
  | 'INVALID_INPUT'
  | 'INVALID_APN'

export type EnrichmentErrorSeverity = 'permanent' | 'retryable' | 'skipped'

/** Classify an error code as retryable, permanent, or skipped */
export function classifyError(code: EnrichmentErrorCode): EnrichmentErrorSeverity {
  switch (code) {
    case 'TIMEOUT':
    case 'NETWORK_ERROR':
    case 'RATE_LIMIT':
    case 'SERVICE_UNAVAILABLE':
    case 'MCAO_CACHE_ERROR':
      return 'retryable'
    case 'APN_SKIPPED':
      return 'skipped'
    default:
      return 'permanent'
  }
}

// ─── Per-record result ───────────────────────────────────

export interface EnrichmentResult {
  /** The input address that was looked up */
  address: string

  /** Whether enrichment succeeded */
  success: boolean

  /** APN resolution outcome */
  apn: string | null

  /** How the APN was resolved */
  method: 'exact_where' | 'loose_where' | 'geocode_identify' | 'cached' | 'skipped' | 'not_found'

  /** Confidence score (0.0–1.0) */
  confidence: number

  /** MCAO data if fetched successfully */
  mcaoData?: Record<string, unknown>

  /** Error details if failed */
  error?: EnrichmentError

  /** Processing time in ms */
  durationMs: number
}

export interface EnrichmentError {
  code: EnrichmentErrorCode
  severity: EnrichmentErrorSeverity
  message: string
  /** Original error details (not exposed to API responses) */
  internal?: string
}

// ─── Batch-level summary ─────────────────────────────────

export interface EnrichmentBatchSummary {
  /** Total records in batch */
  total: number

  /** Successfully resolved (APN found + MCAO fetched) */
  resolved: number

  /** APN found but MCAO fetch failed */
  apnOnlyResolved: number

  /** APN not found */
  apnFailed: number

  /** Skipped (pre-filtered) */
  skipped: number

  /** Retryable failures */
  retryable: number

  /** Permanent failures */
  permanent: number

  /** Total processing time in ms */
  durationMs: number

  /** Whether batch was aborted due to threshold */
  aborted: boolean

  /** Abort reason if aborted */
  abortReason?: string
}

/** Compute batch summary from individual results */
export function computeBatchSummary(
  results: EnrichmentResult[],
  durationMs: number,
  aborted: boolean = false,
  abortReason?: string
): EnrichmentBatchSummary {
  let resolved = 0
  let apnOnlyResolved = 0
  let apnFailed = 0
  let skipped = 0
  let retryable = 0
  let permanent = 0

  for (const r of results) {
    if (r.success && r.mcaoData) {
      resolved++
    } else if (r.success && r.apn && !r.mcaoData) {
      apnOnlyResolved++
    } else if (r.error?.severity === 'skipped') {
      skipped++
    } else if (r.error?.severity === 'retryable') {
      retryable++
    } else {
      // permanent failure or apn not found
      if (r.method === 'not_found') {
        apnFailed++
      } else {
        permanent++
      }
    }
  }

  return {
    total: results.length,
    resolved,
    apnOnlyResolved,
    apnFailed,
    skipped,
    retryable,
    permanent,
    durationMs,
    aborted,
    abortReason,
  }
}

// ─── Conversion helpers (from legacy shapes) ─────────────

/** Convert APNLookupResult (from arcgis-lookup.ts) to EnrichmentResult */
export function fromAPNLookupResult(
  address: string,
  legacy: { apn: string | null; method: string; confidence: number; notes: string },
  durationMs: number
): EnrichmentResult {
  const success = legacy.apn !== null
  const method = legacy.method as EnrichmentResult['method']

  let error: EnrichmentError | undefined
  if (!success) {
    const code: EnrichmentErrorCode =
      method === 'skipped' ? 'APN_SKIPPED' :
      legacy.notes.includes('timeout') ? 'TIMEOUT' :
      legacy.notes.includes('Error') ? 'NETWORK_ERROR' :
      'APN_NOT_FOUND'

    error = {
      code,
      severity: classifyError(code),
      message: `APN lookup failed via ${method}`,
      internal: legacy.notes,
    }
  }

  return {
    address,
    success,
    apn: legacy.apn,
    method,
    confidence: legacy.confidence,
    error,
    durationMs,
  }
}

/** Convert MCAOLookupResult (from client.ts) to partial EnrichmentResult update */
export function applyMCAOResult(
  result: EnrichmentResult,
  mcaoResult: { success: boolean; flattenedData?: Record<string, unknown>; error?: { code: string; message: string } }
): EnrichmentResult {
  if (mcaoResult.success && mcaoResult.flattenedData) {
    return { ...result, mcaoData: mcaoResult.flattenedData }
  }

  const code: EnrichmentErrorCode =
    mcaoResult.error?.code === 'APN_NOT_FOUND' ? 'MCAO_NOT_FOUND' :
    mcaoResult.error?.code === 'TIMEOUT' ? 'TIMEOUT' :
    mcaoResult.error?.code === 'NETWORK_ERROR' ? 'NETWORK_ERROR' :
    mcaoResult.error?.code === 'RATE_LIMIT' ? 'RATE_LIMIT' :
    mcaoResult.error?.code === 'PARSE_ERROR' ? 'MCAO_PARSE_ERROR' :
    'MCAO_NOT_FOUND'

  return {
    ...result,
    error: {
      code,
      severity: classifyError(code),
      message: mcaoResult.error?.message || 'MCAO fetch failed',
    },
  }
}
