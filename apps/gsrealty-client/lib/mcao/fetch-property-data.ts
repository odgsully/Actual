/**
 * Fetch Full MCAO Property Data by APN
 *
 * Uses Official Maricopa County Assessor API
 * Base URL: https://mcassessor.maricopa.gov
 * Requires AUTHORIZATION header with API token
 *
 * Returns complete parcel data matching the 289-column Full-MCAO-API template.
 */

const LOG_PREFIX = '[MCAO Property Data]'

// CORRECT MCAO API endpoint (from documentation)
const MCAO_BASE_URL = process.env.MCAO_API_URL || 'https://mcassessor.maricopa.gov'
const MCAO_API_KEY = process.env.MCAO_API_KEY
const TIMEOUT_MS = 20000

export interface MCAOPropertyData {
  apn: string
  [key: string]: any // All parcel fields
}

/**
 * Fetch full property data for a single APN using Official MCAO API
 */
export async function fetchMCAOPropertyByAPN(apn: string): Promise<MCAOPropertyData | null> {
  if (!apn || !apn.trim()) {
    return null
  }

  if (!MCAO_API_KEY) {
    console.error(`${LOG_PREFIX} MCAO_API_KEY not set in environment variables`)
    return null
  }

  try {
    console.log(`${LOG_PREFIX} Fetching property data for APN: ${apn}`)

    // Clean APN format (API accepts with or without dashes)
    const apnFormatted = apn.trim()

    // Official MCAO API endpoint: GET /parcel/{apn}
    const url = `${MCAO_BASE_URL}/parcel/${encodeURIComponent(apnFormatted)}`

    console.log(`${LOG_PREFIX} Calling MCAO API: ${url}`)

    const response = await fetchWithTimeout(url, TIMEOUT_MS, {
      method: 'GET',
      headers: {
        'AUTHORIZATION': MCAO_API_KEY,
        'user-agent': 'null', // Required by MCAO API
        'Accept': 'application/json'
      }
    })

    // Check response status
    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`${LOG_PREFIX} Property not found for APN: ${apn}`)
        return null
      }
      if (response.status === 401) {
        console.error(`${LOG_PREFIX} Unauthorized - check MCAO_API_KEY`)
        return null
      }
      if (response.status === 429) {
        console.warn(`${LOG_PREFIX} Rate limited for APN: ${apn} - will retry with delay`)
        // Wait and retry once
        await delay(5000) // Wait 5 seconds
        const retryResponse = await fetchWithTimeout(url, TIMEOUT_MS, {
          method: 'GET',
          headers: {
            'AUTHORIZATION': MCAO_API_KEY,
            'user-agent': 'null',
            'Accept': 'application/json'
          }
        })
        if (!retryResponse.ok) {
          console.warn(`${LOG_PREFIX} Retry failed for APN: ${apn}`)
          return null
        }
        const retryData = await retryResponse.json()
        return { apn, ...retryData }
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    console.log(`${LOG_PREFIX} ✓ Found property data for APN ${apn} (${Object.keys(data).length} top-level fields)`)

    return {
      apn,
      ...data
    }

  } catch (error) {
    console.error(`${LOG_PREFIX} Error fetching property data for APN ${apn}:`, error)
    return null
  }
}

/**
 * Batch fetch property data for multiple APNs
 * Rate limited to avoid 429 errors
 */
export async function batchFetchMCAOProperties(
  apns: string[],
  onProgress?: (completed: number, total: number) => void
): Promise<Map<string, MCAOPropertyData>> {
  console.log(`${LOG_PREFIX} Batch fetching property data for ${apns.length} APNs`)

  const results = new Map<string, MCAOPropertyData>()
  const batchSize = 5  // Reduced from 10 to 5
  const delayMs = 1000 // Increased from 200ms to 1000ms (1 request/second)

  for (let i = 0; i < apns.length; i += batchSize) {
    const batch = apns.slice(i, i + batchSize)

    // Process batch in parallel with staggered delays
    const batchPromises = batch.map(async (apn, idx) => {
      // Stagger requests within batch
      await delay(idx * delayMs)
      const data = await fetchMCAOPropertyByAPN(apn)
      if (data) {
        results.set(apn, data)
      }
      return data
    })

    await Promise.all(batchPromises)

    // Add delay between batches to avoid rate limiting
    if (i + batchSize < apns.length) {
      await delay(2000) // 2 second pause between batches
    }

    // Report progress
    const completed = Math.min(i + batchSize, apns.length)
    if (onProgress) {
      onProgress(completed, apns.length)
    }

    console.log(`${LOG_PREFIX} Progress: ${completed}/${apns.length} (${results.size} successful)`)
  }

  console.log(`${LOG_PREFIX} Batch fetch complete: ${results.size}/${apns.length} properties found`)

  return results
}

// Removed formatAPNWithDashes - MCAO API handles both formats

/**
 * Fetch with timeout and custom options
 */
async function fetchWithTimeout(url: string, timeoutMs: number, options?: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    clearTimeout(timeout)

    return response
  } catch (error) {
    clearTimeout(timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`)
    }
    throw error
  }
}

/**
 * Delay helper
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
