/**
 * Batch APN Lookup Utility
 *
 * Efficiently looks up APNs from MCAO API for multiple addresses
 * with rate limiting, retry logic, and error resilience.
 */

import type { MCAOApiResponse } from '@/lib/types/mcao-data'
import type { EnrichmentResult, EnrichmentBatchSummary } from '@/lib/pipeline/enrichment-types'
import { computeBatchSummary } from '@/lib/pipeline/enrichment-types'
import { evaluateAPNThreshold } from '@/lib/pipeline/thresholds'

const LOG_PREFIX = '[Batch APN Lookup]'

// Rate limiting configuration
const REQUESTS_PER_SECOND = 5
const BATCH_SIZE = 10
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000

export interface AddressLookup {
  address: string
  city?: string
  zip?: string
  existingApn?: string
}

export interface LookupResult {
  address: string
  success: boolean
  apn?: string
  mcaoData?: MCAOApiResponse
  error?: string
  /** Unified enrichment result (when available) */
  enrichment?: EnrichmentResult
}

export interface BatchLookupProgress {
  total: number
  completed: number
  successful: number
  failed: number
  percentage: number
}

export interface BatchLookupResult {
  results: LookupResult[]
  summary: EnrichmentBatchSummary
}

/**
 * Batch lookup APNs for multiple addresses.
 * Returns both legacy LookupResult[] and unified EnrichmentBatchSummary.
 * Evaluates APN resolution threshold after each batch — aborts if exceeded.
 */
export async function batchLookupAPNs(
  addresses: AddressLookup[],
  onProgress?: (progress: BatchLookupProgress) => void
): Promise<BatchLookupResult> {
  const batchStart = Date.now()
  console.log(`${LOG_PREFIX} Starting batch lookup for ${addresses.length} addresses`)

  // Filter addresses that need lookup (no existing APN)
  const needLookup = addresses.filter(addr => !addr.existingApn)
  const haveApn = addresses.filter(addr => addr.existingApn)

  console.log(`${LOG_PREFIX} ${needLookup.length} addresses need lookup, ${haveApn.length} already have APNs`)

  // Build enrichment results for pre-existing APNs
  const enrichmentResults: EnrichmentResult[] = haveApn.map(addr => ({
    address: addr.address,
    success: true,
    apn: addr.existingApn!,
    method: 'cached' as const,
    confidence: 1.0,
    durationMs: 0,
  }))

  if (needLookup.length === 0) {
    console.log(`${LOG_PREFIX} No lookups needed, all addresses have APNs`)
    return {
      results: haveApn.map(addr => ({
        address: addr.address,
        success: true,
        apn: addr.existingApn!,
      })),
      summary: computeBatchSummary(enrichmentResults, Date.now() - batchStart),
    }
  }

  const results: LookupResult[] = []
  let completed = 0
  let successful = 0
  let failed = 0
  let aborted = false
  let abortReason: string | undefined

  // Add pre-existing APNs to results
  haveApn.forEach(addr => {
    results.push({
      address: addr.address,
      success: true,
      apn: addr.existingApn!,
    })
  })

  // Process in batches
  const batches = chunkArray(needLookup, BATCH_SIZE)
  console.log(`${LOG_PREFIX} Processing ${batches.length} batches of ${BATCH_SIZE}`)

  for (let i = 0; i < batches.length; i++) {
    if (aborted) break

    const batch = batches[i]
    console.log(`${LOG_PREFIX} Processing batch ${i + 1}/${batches.length}`)

    // Process batch in parallel with rate limiting
    const batchResults = await Promise.all(
      batch.map((addr, idx) =>
        lookupWithRateLimit(addr, idx, REQUESTS_PER_SECOND)
      )
    )

    // Collect results + build enrichment records
    batchResults.forEach(result => {
      results.push(result)
      completed++
      if (result.success) {
        successful++
      } else {
        failed++
      }

      // Build unified enrichment result from legacy LookupResult
      enrichmentResults.push({
        address: result.address,
        success: result.success,
        apn: result.apn || null,
        method: result.success ? 'exact_where' : 'not_found',
        confidence: result.success ? 0.9 : 0,
        durationMs: 0,
        error: result.error ? {
          code: 'APN_NOT_FOUND' as const,
          severity: 'permanent' as const,
          message: result.error,
        } : undefined,
      })
    })

    // ── Threshold check after each batch ──
    const lookupFailed = enrichmentResults.filter(r => !r.apn).length
    const totalProcessed = enrichmentResults.length
    const apnCheck = evaluateAPNThreshold(lookupFailed, totalProcessed)

    if (apnCheck.action === 'abort') {
      console.error(`${LOG_PREFIX} ${apnCheck.message}`)
      aborted = true
      abortReason = apnCheck.message
      break
    }
    if (apnCheck.action === 'warn') {
      console.warn(`${LOG_PREFIX} ${apnCheck.message}`)
    }

    // Report progress
    if (onProgress) {
      onProgress({
        total: needLookup.length,
        completed,
        successful,
        failed,
        percentage: Math.round((completed / needLookup.length) * 100)
      })
    }
  }

  const summary = computeBatchSummary(
    enrichmentResults,
    Date.now() - batchStart,
    aborted,
    abortReason
  )

  console.log(`${LOG_PREFIX} Batch lookup complete: ${successful} successful, ${failed} failed${aborted ? ' (ABORTED)' : ''}`)

  return { results, summary }
}

/**
 * Lookup single address with retry logic
 * Uses new ArcGIS-based lookup service (public Maricopa County endpoints)
 */
async function lookupSingleAddress(address: AddressLookup): Promise<LookupResult> {
  let lastError = 'Failed to lookup APN'

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`${LOG_PREFIX} Looking up address (attempt ${attempt}/${MAX_RETRIES})`)

      // Use new ArcGIS lookup endpoint (public, no auth required)
      const response = await fetch('/api/admin/mcao/arcgis-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: address.address
        }),
      })

      const result = await response.json()

      if (result.success && result.data) {
        console.log(`${LOG_PREFIX} ✓ APN resolved (method: ${result.data.method}, confidence: ${result.data.confidence})`)
        return {
          address: address.address,
          success: true,
          apn: result.data.apn,
          mcaoData: {
            apn: result.data.apn,
            method: result.data.method,
            confidence: result.data.confidence,
            notes: result.data.notes
          } as any, // Minimal MCAO data for now
        }
      } else {
        lastError = result.error || result.details || 'Unknown error'
        console.warn(`${LOG_PREFIX} ✗ APN lookup failed (method: ${result.method})`)

        // Don't retry if it's a "not found" error
        if (lastError.toLowerCase().includes('not found') ||
            lastError.toLowerCase().includes('no results') ||
            result.method === 'skipped') {
          break
        }
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Network error'
      console.error(`${LOG_PREFIX} Lookup error:`, error instanceof Error ? error.message : 'Unknown')
    }

    // Wait before retry (exponential backoff)
    if (attempt < MAX_RETRIES) {
      await delay(RETRY_DELAY_MS * attempt)
    }
  }

  return {
    address: address.address,
    success: false,
    error: lastError,
  }
}

/**
 * Lookup with rate limiting delay
 */
async function lookupWithRateLimit(
  address: AddressLookup,
  index: number,
  requestsPerSecond: number
): Promise<LookupResult> {
  // Calculate delay based on index to spread out requests
  const delayMs = (index * 1000) / requestsPerSecond
  await delay(delayMs)

  return lookupSingleAddress(address)
}

/**
 * Split array into chunks
 */
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize))
  }
  return chunks
}

/**
 * Delay helper
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Extract unique addresses from MLS data
 */
export function extractAddressesFromMLSData(
  residential15Mile: any[],
  residentialLease15Mile: any[],
  residential3YrDirect: any[],
  residentialLease3YrDirect: any[]
): AddressLookup[] {
  const allProperties = [
    ...residential15Mile.map(p => ({ ...p, source: 'residential15Mile' })),
    ...residentialLease15Mile.map(p => ({ ...p, source: 'residentialLease15Mile' })),
    ...residential3YrDirect.map(p => ({ ...p, source: 'residential3YrDirect' })),
    ...residentialLease3YrDirect.map(p => ({ ...p, source: 'residentialLease3YrDirect' })),
  ]

  // Deduplicate by address
  const uniqueAddresses = new Map<string, AddressLookup>()

  allProperties.forEach(prop => {
    const address = prop.address || prop.propertyAddress || prop.fullAddress
    if (!address) return

    const key = address.toLowerCase().trim()

    if (!uniqueAddresses.has(key)) {
      uniqueAddresses.set(key, {
        address,
        city: prop.city,
        zip: prop.zip,
        existingApn: prop.apn || prop.APN,
      })
    }
  })

  return Array.from(uniqueAddresses.values())
}
