/**
 * MCAO API Client
 *
 * Client for interacting with Maricopa County Assessor's Office API
 * Includes caching, error handling, and retry logic
 *
 * @see lib/types/mcao-data.ts for type definitions
 */

import type {
  APN,
  MCAOApiResponse,
  MCAOLookupRequest,
  MCAOLookupResult,
  MCAOApiConfig,
  MCAOCacheEntry,
  MCAOApiStatus
} from '../types/mcao-data'
import { isValidAPN, formatAPN, MCAOErrorCode } from '../types/mcao-data'

/**
 * Default API Configuration
 */
const DEFAULT_CONFIG: MCAOApiConfig = {
  baseUrl: process.env.MCAO_API_URL || 'https://mcassessor.maricopa.gov/api',
  apiKey: process.env.MCAO_API_KEY,
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  cacheEnabled: true,
  cacheDuration: 3600 // 1 hour
}

/**
 * In-memory cache for MCAO API responses
 */
class MCAOCache {
  private cache: Map<APN, MCAOCacheEntry> = new Map()

  set(apn: APN, data: MCAOApiResponse, duration: number): void {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + duration * 1000)

    this.cache.set(apn, {
      apn,
      data,
      cachedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      hitCount: 0
    })
  }

  get(apn: APN): MCAOApiResponse | null {
    const entry = this.cache.get(apn)

    if (!entry) {
      return null
    }

    // Check if expired
    const now = new Date()
    const expiresAt = new Date(entry.expiresAt)

    if (now > expiresAt) {
      this.cache.delete(apn)
      return null
    }

    // Increment hit count
    entry.hitCount++
    return entry.data
  }

  has(apn: APN): boolean {
    return this.get(apn) !== null
  }

  delete(apn: APN): boolean {
    return this.cache.delete(apn)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }

  getStats(): { size: number; entries: Array<{ apn: APN; hitCount: number; cachedAt: string }> } {
    const entries = Array.from(this.cache.entries()).map(([apn, entry]) => ({
      apn,
      hitCount: entry.hitCount,
      cachedAt: entry.cachedAt
    }))

    return {
      size: this.cache.size,
      entries
    }
  }
}

/**
 * MCAO API Client Class
 */
export class MCAOClient {
  private config: MCAOApiConfig
  private cache: MCAOCache

  constructor(config?: Partial<MCAOApiConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.cache = new MCAOCache()
  }

  /**
   * Lookup property by APN
   */
  async lookupByAPN(request: MCAOLookupRequest): Promise<MCAOLookupResult> {
    const { apn: rawAPN, refresh = false } = request
    const apn = formatAPN(rawAPN)

    // Validate APN format
    if (!isValidAPN(apn)) {
      return {
        success: false,
        error: {
          code: 'INVALID_APN',
          message: 'Invalid APN format',
          details: `APN must be in format XXX-XX-XXXA (received: ${apn})`
        },
        timestamp: new Date().toISOString()
      }
    }

    // Check cache (unless refresh requested)
    if (this.config.cacheEnabled && !refresh) {
      const cachedData = this.cache.get(apn)
      if (cachedData) {
        return {
          success: true,
          data: cachedData,
          cached: true,
          cachedAt: cachedData.lastUpdated,
          timestamp: new Date().toISOString()
        }
      }
    }

    // Fetch from API
    try {
      const data = await this.fetchFromAPI(apn, request)

      // Cache the result
      if (this.config.cacheEnabled && data) {
        this.cache.set(apn, data, this.config.cacheDuration)
      }

      return {
        success: true,
        data,
        cached: false,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return this.handleError(error, apn)
    }
  }

  /**
   * Fetch property data from MCAO API
   * @private
   */
  private async fetchFromAPI(apn: APN, request: MCAOLookupRequest): Promise<MCAOApiResponse> {
    const url = `${this.config.baseUrl}/property/${apn}`

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }

    if (this.config.apiKey) {
      headers['X-API-Key'] = this.config.apiKey
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`APN_NOT_FOUND: Property not found for APN ${apn}`)
        } else if (response.status === 401) {
          throw new Error(`UNAUTHORIZED: Invalid API key`)
        } else if (response.status === 429) {
          throw new Error(`RATE_LIMIT: Too many requests`)
        } else {
          throw new Error(`API_ERROR: HTTP ${response.status} - ${response.statusText}`)
        }
      }

      const rawData = await response.json()

      // Transform API response to our format
      return this.transformAPIResponse(apn, rawData)

    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`TIMEOUT: Request timed out after ${this.config.timeout}ms`)
        }
        throw error
      }

      throw new Error(`NETWORK_ERROR: ${String(error)}`)
    }
  }

  /**
   * Transform raw API response to MCAOApiResponse format
   * @private
   */
  private transformAPIResponse(apn: APN, rawData: any): MCAOApiResponse {
    // This is a placeholder transformation
    // Real implementation will depend on actual MCAO API response format
    return {
      apn,
      parcelNumber: rawData.parcelNumber || apn,
      ownerName: rawData.ownerName || 'Unknown Owner',
      ownerAddress: rawData.ownerAddress || undefined,
      legalDescription: rawData.legalDescription || '',
      subdivision: rawData.subdivision,
      lot: rawData.lot,
      block: rawData.block,
      propertyAddress: {
        number: rawData.propertyAddress?.number || '',
        street: rawData.propertyAddress?.street || '',
        unit: rawData.propertyAddress?.unit,
        city: rawData.propertyAddress?.city || 'Phoenix',
        state: 'AZ',
        zip: rawData.propertyAddress?.zip || '',
        fullAddress: rawData.propertyAddress?.fullAddress || ''
      },
      propertyType: rawData.propertyType || 'Residential',
      landUse: rawData.landUse || 'Single Family',
      zoning: rawData.zoning,
      lotSize: rawData.lotSize || 0,
      lotDimensions: rawData.lotDimensions,
      improvementSize: rawData.improvementSize,
      yearBuilt: rawData.yearBuilt,
      bedrooms: rawData.bedrooms,
      bathrooms: rawData.bathrooms,
      stories: rawData.stories,
      constructionType: rawData.constructionType,
      roofType: rawData.roofType,
      assessedValue: {
        total: rawData.assessedValue?.total || 0,
        land: rawData.assessedValue?.land || 0,
        improvement: rawData.assessedValue?.improvement || 0
      },
      taxInfo: {
        taxYear: rawData.taxInfo?.taxYear || new Date().getFullYear(),
        taxAmount: rawData.taxInfo?.taxAmount || 0,
        taxRate: rawData.taxInfo?.taxRate || 0,
        taxArea: rawData.taxInfo?.taxArea || ''
      },
      salesHistory: rawData.salesHistory,
      features: rawData.features,
      lastUpdated: new Date().toISOString(),
      dataSource: 'MCAO API',
      apiVersion: rawData.apiVersion || '1.0',
      rawResponse: rawData
    }
  }

  /**
   * Handle API errors
   * @private
   */
  private handleError(error: unknown, apn: APN): MCAOLookupResult {
    let errorCode: MCAOErrorCode = MCAOErrorCode.API_ERROR
    let message = 'Unknown error occurred'
    let details = ''

    if (error instanceof Error) {
      const errorMessage = error.message

      if (errorMessage.startsWith('INVALID_APN')) {
        errorCode = MCAOErrorCode.INVALID_APN
        message = 'Invalid APN format'
        details = errorMessage.replace('INVALID_APN: ', '')
      } else if (errorMessage.startsWith('APN_NOT_FOUND')) {
        errorCode = MCAOErrorCode.APN_NOT_FOUND
        message = 'Property not found'
        details = `No property found for APN ${apn}`
      } else if (errorMessage.startsWith('TIMEOUT')) {
        errorCode = MCAOErrorCode.TIMEOUT
        message = 'Request timed out'
        details = errorMessage.replace('TIMEOUT: ', '')
      } else if (errorMessage.startsWith('NETWORK_ERROR')) {
        errorCode = MCAOErrorCode.NETWORK_ERROR
        message = 'Network connection failed'
        details = errorMessage.replace('NETWORK_ERROR: ', '')
      } else if (errorMessage.startsWith('RATE_LIMIT')) {
        errorCode = MCAOErrorCode.RATE_LIMIT
        message = 'API rate limit exceeded'
        details = 'Too many requests. Please try again later.'
      } else if (errorMessage.startsWith('UNAUTHORIZED')) {
        errorCode = MCAOErrorCode.UNAUTHORIZED
        message = 'API authentication failed'
        details = 'Invalid or missing API key'
      } else {
        details = errorMessage
      }
    } else {
      details = String(error)
    }

    return {
      success: false,
      error: {
        code: errorCode,
        message,
        details
      },
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Check MCAO API status
   */
  async checkStatus(): Promise<MCAOApiStatus> {
    const startTime = Date.now()

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(`${this.config.baseUrl}/health`, {
        method: 'GET',
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      const responseTime = Date.now() - startTime

      return {
        available: response.ok,
        lastChecked: new Date().toISOString(),
        responseTime,
        version: response.headers.get('X-API-Version') || undefined,
        message: response.ok ? 'API is available' : 'API returned error'
      }
    } catch (error) {
      return {
        available: false,
        lastChecked: new Date().toISOString(),
        message: `API check failed: ${error instanceof Error ? error.message : String(error)}`
      }
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats()
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Remove specific APN from cache
   */
  invalidateCache(apn: APN): boolean {
    return this.cache.delete(formatAPN(apn))
  }
}

/**
 * Singleton instance for shared use
 */
let clientInstance: MCAOClient | null = null

/**
 * Get singleton MCAO client instance
 */
export function getMCAOClient(): MCAOClient {
  if (!clientInstance) {
    clientInstance = new MCAOClient()
  }
  return clientInstance
}

/**
 * Create new MCAO client with custom configuration
 */
export function createMCAOClient(config?: Partial<MCAOApiConfig>): MCAOClient {
  return new MCAOClient(config)
}

// Export default instance
export default getMCAOClient()
