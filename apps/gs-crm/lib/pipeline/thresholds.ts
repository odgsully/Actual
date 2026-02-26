/**
 * Pipeline Safety Thresholds
 *
 * Codified abort/continue criteria for the MLS upload and enrichment pipeline.
 * Phase -1: Define thresholds as constants (not magic numbers).
 * Phase 0.5a: Wire into batch processors with actual abort logic.
 */

// ─── APN Resolution ─────────────────────────────────────

/** If more than this % of addresses fail APN resolution, abort the batch */
export const APN_UNRESOLVED_ABORT_THRESHOLD = 0.40 // 40%

/** Warn (but don't abort) if APN unresolved rate exceeds this */
export const APN_UNRESOLVED_WARN_THRESHOLD = 0.20 // 20%

/** Minimum batch size before thresholds apply (small batches are noisy) */
export const APN_MIN_BATCH_FOR_THRESHOLD = 5

// ─── MCAO Fetch ──────────────────────────────────────────

/** If more than this % of MCAO lookups fail, abort the batch */
export const MCAO_FAILURE_ABORT_THRESHOLD = 0.50 // 50%

/** Warn (but don't abort) if MCAO failure rate exceeds this */
export const MCAO_FAILURE_WARN_THRESHOLD = 0.25 // 25%

/** Minimum records with APNs before MCAO thresholds apply */
export const MCAO_MIN_BATCH_FOR_THRESHOLD = 3

// ─── Parsing ─────────────────────────────────────────────

/** If more than this % of rows fail parsing, abort the upload */
export const PARSE_FAILURE_ABORT_THRESHOLD = 0.30 // 30%

/** Warn if parse failure rate exceeds this */
export const PARSE_FAILURE_WARN_THRESHOLD = 0.10 // 10%

/** Minimum row count before parse thresholds apply */
export const PARSE_MIN_ROWS_FOR_THRESHOLD = 5

// ─── Output Completeness ─────────────────────────────────

/** Minimum analyses that must succeed for breakups report to be valid */
export const BREAKUPS_MIN_SUCCESSFUL_ANALYSES = 15 // out of 26 total

/** Minimum chart generation success rate */
export const CHARTS_MIN_SUCCESS_RATE = 0.70 // 70%

// ─── ArcGIS Health ───────────────────────────────────────

/** Timeout for ArcGIS health-check probes (ms) */
export const ARCGIS_HEALTH_CHECK_TIMEOUT_MS = 10_000

/** Max consecutive ArcGIS failures before marking service unhealthy */
export const ARCGIS_MAX_CONSECUTIVE_FAILURES = 3

// ─── Batch Timing ────────────────────────────────────────

/** Max total enrichment time per batch before timeout (ms) */
export const ENRICHMENT_BATCH_TIMEOUT_MS = 4 * 60 * 1000 // 4 minutes (within 5-min Vercel limit)

/** Max time for a single APN lookup (ms) — already exists in arcgis-lookup.ts as TIMEOUT_MS */
export const SINGLE_LOOKUP_TIMEOUT_MS = 20_000

// ─── Threshold evaluation helpers ────────────────────────

export interface ThresholdResult {
  action: 'continue' | 'warn' | 'abort'
  rate: number
  threshold: number
  message: string
}

/**
 * Evaluate a failure rate against warn/abort thresholds.
 * Returns 'continue' if below warn, 'warn' if between warn and abort, 'abort' if above abort.
 */
export function evaluateThreshold(
  failedCount: number,
  totalCount: number,
  minBatch: number,
  warnThreshold: number,
  abortThreshold: number,
  label: string
): ThresholdResult {
  if (totalCount < minBatch) {
    return {
      action: 'continue',
      rate: 0,
      threshold: abortThreshold,
      message: `${label}: batch too small (${totalCount} < ${minBatch}), skipping threshold check`,
    }
  }

  const rate = failedCount / totalCount

  if (rate >= abortThreshold) {
    return {
      action: 'abort',
      rate,
      threshold: abortThreshold,
      message: `${label}: failure rate ${(rate * 100).toFixed(1)}% exceeds abort threshold ${(abortThreshold * 100).toFixed(0)}%`,
    }
  }

  if (rate >= warnThreshold) {
    return {
      action: 'warn',
      rate,
      threshold: warnThreshold,
      message: `${label}: failure rate ${(rate * 100).toFixed(1)}% exceeds warn threshold ${(warnThreshold * 100).toFixed(0)}%`,
    }
  }

  return {
    action: 'continue',
    rate,
    threshold: warnThreshold,
    message: `${label}: failure rate ${(rate * 100).toFixed(1)}% within acceptable range`,
  }
}

/** Convenience: evaluate APN resolution threshold */
export function evaluateAPNThreshold(failed: number, total: number): ThresholdResult {
  return evaluateThreshold(
    failed, total,
    APN_MIN_BATCH_FOR_THRESHOLD,
    APN_UNRESOLVED_WARN_THRESHOLD,
    APN_UNRESOLVED_ABORT_THRESHOLD,
    'APN resolution'
  )
}

/** Convenience: evaluate MCAO fetch threshold */
export function evaluateMCAOThreshold(failed: number, total: number): ThresholdResult {
  return evaluateThreshold(
    failed, total,
    MCAO_MIN_BATCH_FOR_THRESHOLD,
    MCAO_FAILURE_WARN_THRESHOLD,
    MCAO_FAILURE_ABORT_THRESHOLD,
    'MCAO fetch'
  )
}

/** Convenience: evaluate parse failure threshold */
export function evaluateParseThreshold(failed: number, total: number): ThresholdResult {
  return evaluateThreshold(
    failed, total,
    PARSE_MIN_ROWS_FOR_THRESHOLD,
    PARSE_FAILURE_WARN_THRESHOLD,
    PARSE_FAILURE_ABORT_THRESHOLD,
    'Row parsing'
  )
}
