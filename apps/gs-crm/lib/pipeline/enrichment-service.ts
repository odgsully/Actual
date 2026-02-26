/**
 * EnrichmentService — Single entry point for APN resolution + MCAO data fetch
 *
 * Phase 0.5b: Consolidates 3 redundant enrichment paths into one service:
 * - bulk-processor.ts processAddresses()
 * - batch-apn-lookup.ts batchLookupAPNs()
 * - Python subprocess (scripts/bulk_apn_lookup.py)
 *
 * Features:
 * - Pre-flight ArcGIS health check
 * - APN resolution via ArcGIS (exact → loose → geocode)
 * - MCAO data fetch for resolved APNs
 * - Confidence filtering (reject low-confidence matches)
 * - Abort thresholds (APN + MCAO failure rates)
 * - Per-record + batch-level persistence (fire-and-forget)
 * - Unified EnrichmentResult throughout
 */

import { lookupAPNFromAddress, preflightHealthCheck, sleepForRate } from '../mcao/arcgis-lookup'
import { MCAOClient } from '../mcao/client'
import type { EnrichmentResult, EnrichmentBatchSummary } from './enrichment-types'
import { fromAPNLookupResult, applyMCAOResult, computeBatchSummary } from './enrichment-types'
import { evaluateAPNThreshold, evaluateMCAOThreshold, ENRICHMENT_BATCH_TIMEOUT_MS } from './thresholds'
import { saveEnrichmentOutcome, saveBatchSummary } from '../database/mcao'

// ─── Configuration ──────────────────────────────────────────

export interface EnrichmentServiceOptions {
  /** Minimum confidence to accept an APN match (0.0–1.0). Default: 0.8 */
  minConfidence?: number
  /** Batch size for parallel processing. Default: 10 */
  batchSize?: number
  /** Whether to fetch MCAO data after APN resolution. Default: true */
  fetchMCAO?: boolean
  /** Whether to persist results to database. Default: true */
  persistResults?: boolean
  /** Whether to run pre-flight health check. Default: true */
  preflight?: boolean
}

const DEFAULT_OPTIONS: Required<EnrichmentServiceOptions> = {
  minConfidence: 0.8,
  batchSize: 10,
  fetchMCAO: true,
  persistResults: true,
  preflight: true,
}

// ─── Progress callback ──────────────────────────────────────

export interface EnrichmentProgress {
  total: number
  completed: number
  successful: number
  failed: number
  skipped: number
  percentage: number
  phase: 'preflight' | 'apn' | 'mcao' | 'complete'
}

// ─── Input types ────────────────────────────────────────────

export interface EnrichmentInput {
  address: string
  existingApn?: string
}

// ─── Service ────────────────────────────────────────────────

export class EnrichmentService {
  private options: Required<EnrichmentServiceOptions>
  private mcaoClient: MCAOClient

  constructor(options?: EnrichmentServiceOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
    this.mcaoClient = new MCAOClient()
  }

  /**
   * Enrich a batch of addresses with APN resolution + optional MCAO data.
   * Single entry point replacing all 3 legacy paths.
   */
  async enrichBatch(
    inputs: EnrichmentInput[],
    onProgress?: (progress: EnrichmentProgress) => void
  ): Promise<{
    results: EnrichmentResult[]
    summary: EnrichmentBatchSummary
  }> {
    const batchStart = Date.now()

    // ── Pre-flight health check ──
    if (this.options.preflight) {
      onProgress?.({
        total: inputs.length, completed: 0, successful: 0, failed: 0, skipped: 0,
        percentage: 0, phase: 'preflight',
      })

      const health = await preflightHealthCheck()
      if (!health.healthy) {
        const downEndpoints = health.results
          .filter(r => !r.healthy)
          .map(r => `${r.endpoint}: ${r.error || 'unreachable'}`)
          .join('; ')

        return {
          results: [],
          summary: computeBatchSummary([], Date.now() - batchStart, true,
            `ArcGIS pre-flight failed — ${downEndpoints}`),
        }
      }
    }

    // ── Separate pre-resolved from needing lookup ──
    const results: EnrichmentResult[] = []
    const needsLookup: Array<{ index: number; input: EnrichmentInput }> = []

    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i]
      if (input.existingApn) {
        // Pre-resolved — skip APN lookup
        results.push({
          address: input.address,
          success: true,
          apn: input.existingApn,
          method: 'cached',
          confidence: 1.0,
          durationMs: 0,
        })
      } else {
        needsLookup.push({ index: i, input })
        results.push(null as any) // placeholder
      }
    }

    // ── Process APN lookups in batches ──
    let completed = 0
    let successful = results.filter(r => r?.success).length
    let failed = 0
    let skipped = 0
    let aborted = false
    let abortReason: string | undefined

    const batches = chunk(needsLookup, this.options.batchSize)

    for (const batch of batches) {
      if (aborted) break

      // Check batch timeout
      if (Date.now() - batchStart > ENRICHMENT_BATCH_TIMEOUT_MS) {
        aborted = true
        abortReason = `Batch timeout exceeded (${ENRICHMENT_BATCH_TIMEOUT_MS / 1000}s)`
        break
      }

      // Process batch in parallel
      const batchResults = await Promise.all(
        batch.map(async ({ index, input }) => {
          const lookupStart = Date.now()

          try {
            // Step 1: APN resolution via ArcGIS
            const apnResult = await lookupAPNFromAddress(input.address)
            let enrichment = fromAPNLookupResult(
              input.address,
              apnResult,
              Date.now() - lookupStart
            )

            // Confidence filtering — reject low-confidence matches
            if (enrichment.apn && enrichment.confidence < this.options.minConfidence) {
              enrichment = {
                ...enrichment,
                apn: null,
                success: false,
                error: {
                  code: 'APN_AMBIGUOUS',
                  severity: 'permanent',
                  message: `Confidence ${enrichment.confidence.toFixed(2)} below threshold ${this.options.minConfidence}`,
                },
              }
            }

            // Step 2: MCAO data fetch (if APN resolved and option enabled)
            if (enrichment.apn && this.options.fetchMCAO) {
              const mcaoResult = await this.mcaoClient.lookupByAPN({ apn: enrichment.apn })
              enrichment = applyMCAOResult(enrichment, {
                success: mcaoResult.success,
                flattenedData: mcaoResult.flattenedData as Record<string, unknown> | undefined,
                error: mcaoResult.error ? {
                  code: mcaoResult.error.code,
                  message: mcaoResult.error.message,
                } : undefined,
              })
              enrichment.durationMs = Date.now() - lookupStart
            }

            return { index, enrichment }
          } catch (error) {
            return {
              index,
              enrichment: {
                address: input.address,
                success: false,
                apn: null,
                method: 'not_found' as const,
                confidence: 0,
                durationMs: Date.now() - lookupStart,
                error: {
                  code: 'NETWORK_ERROR' as const,
                  severity: 'retryable' as const,
                  message: error instanceof Error ? error.message : 'Unknown error',
                },
              } satisfies EnrichmentResult,
            }
          }
        })
      )

      // Collect results
      for (const { index, enrichment } of batchResults) {
        results[index] = enrichment
        completed++

        if (enrichment.success) {
          successful++
        } else if (enrichment.error?.severity === 'skipped') {
          skipped++
        } else {
          failed++
        }

        // Persist per-record outcome (fire-and-forget)
        if (this.options.persistResults) {
          saveEnrichmentOutcome(enrichment).catch(() => {})
        }
      }

      // Report progress
      onProgress?.({
        total: inputs.length,
        completed: successful + failed + skipped + results.filter(r => r?.method === 'cached').length,
        successful,
        failed,
        skipped,
        percentage: Math.round(((completed + results.filter(r => r?.method === 'cached').length) / inputs.length) * 100),
        phase: 'apn',
      })

      // ── Threshold checks ──
      const allResults = results.filter(Boolean)
      const apnFailed = allResults.filter(r => !r.apn).length
      const mcaoFailed = allResults.filter(r => r.apn && !r.mcaoData).length
      const mcaoAttempted = allResults.filter(r => r.apn).length

      const apnCheck = evaluateAPNThreshold(apnFailed, allResults.length)
      if (apnCheck.action === 'abort') {
        aborted = true
        abortReason = apnCheck.message
        break
      }

      if (mcaoAttempted > 0 && this.options.fetchMCAO) {
        const mcaoCheck = evaluateMCAOThreshold(mcaoFailed, mcaoAttempted)
        if (mcaoCheck.action === 'abort') {
          aborted = true
          abortReason = mcaoCheck.message
          break
        }
      }

      // Rate limiting between batches
      if (!aborted) {
        await sleepForRate()
      }
    }

    // ── Compute summary ──
    const finalResults = results.filter(Boolean)
    const summary = computeBatchSummary(finalResults, Date.now() - batchStart, aborted, abortReason)

    // Persist batch summary (fire-and-forget)
    if (this.options.persistResults) {
      saveBatchSummary(summary).catch(() => {})
    }

    onProgress?.({
      total: inputs.length,
      completed: finalResults.length,
      successful,
      failed,
      skipped,
      percentage: 100,
      phase: 'complete',
    })

    return { results: finalResults, summary }
  }

  /**
   * Enrich a single address. Convenience wrapper around enrichBatch.
   */
  async enrichSingle(address: string, existingApn?: string): Promise<EnrichmentResult> {
    const { results } = await this.enrichBatch(
      [{ address, existingApn }],
      undefined
    )
    return results[0]
  }

  /**
   * Run pre-flight health check only (without processing).
   */
  async checkHealth() {
    return preflightHealthCheck()
  }
}

// ─── Singleton ──────────────────────────────────────────────

let defaultService: EnrichmentService | null = null

/** Get singleton EnrichmentService with default options */
export function getEnrichmentService(): EnrichmentService {
  if (!defaultService) {
    defaultService = new EnrichmentService()
  }
  return defaultService
}

/** Create a new EnrichmentService with custom options */
export function createEnrichmentService(options: EnrichmentServiceOptions): EnrichmentService {
  return new EnrichmentService(options)
}

// ─── Helpers ────────────────────────────────────────────────

function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}
