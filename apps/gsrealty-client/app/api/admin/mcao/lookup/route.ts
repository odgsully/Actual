/**
 * MCAO Lookup API Route
 *
 * POST /api/admin/mcao/lookup
 * Lookup property by APN OR ADDRESS using MCAO API with database caching
 * Now supports address-based lookup using ArcGIS (same as MLS Upload)
 *
 * @see lib/mcao/client.ts for MCAO API client
 * @see lib/mcao/arcgis-lookup.ts for address to APN lookup
 * @see lib/database/mcao.ts for database operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMCAOClient } from '@/lib/mcao/client'
import { saveMCAOData, getMCAODataByAPN } from '@/lib/database/mcao'
import type { MCAOLookupRequest } from '@/lib/types/mcao-data'
import { isValidAPN, formatAPN } from '@/lib/types/mcao-data'
import { lookupAPNFromAddress } from '@/lib/mcao/arcgis-lookup'

interface LookupRequest {
  apn?: string
  address?: string // NEW: Support address-based lookup
  includeHistory?: boolean
  includeTax?: boolean
  refresh?: boolean // Force API call, bypass cache
}

/**
 * POST: Lookup property by APN or ADDRESS
 *
 * Request body:
 * - apn: Assessor Parcel Number (XXX-XX-XXXA) OR
 * - address: Full address (e.g., "1234 N Main St, Phoenix, AZ 85001")
 * - includeHistory: Include sales history (optional)
 * - includeTax: Include tax details (optional)
 * - refresh: Bypass cache and fetch fresh data (optional)
 *
 * Response:
 * - success: Boolean indicating success
 * - data: MCAO API response data
 * - cached: Boolean indicating if from cache
 * - source: 'database' | 'api' | 'client_cache'
 * - apn: The APN used for lookup (if address was provided)
 * - lookupMethod: Method used to find APN (if address was provided)
 */
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body: LookupRequest = await req.json()
    const { apn: rawAPN, address, includeHistory, includeTax, refresh } = body

    // Validate that either APN or address is provided
    if (!rawAPN && !address) {
      return NextResponse.json(
        { success: false, error: 'Either APN or address is required' },
        { status: 400 }
      )
    }

    let apn: string
    let lookupMethod: string | undefined
    let lookupConfidence: number | undefined

    // If address provided, look up APN using ArcGIS (same as MLS Upload)
    if (address) {
      console.log('[MCAO Lookup API] Looking up APN for address:', address)

      const arcgisResult = await lookupAPNFromAddress(address)

      if (!arcgisResult.apn) {
        return NextResponse.json(
          {
            success: false,
            error: 'Could not find APN for this address',
            details: arcgisResult.notes,
            method: arcgisResult.method,
          },
          { status: 404 }
        )
      }

      apn = arcgisResult.apn
      lookupMethod = arcgisResult.method
      lookupConfidence = arcgisResult.confidence
      console.log('[MCAO Lookup API] Found APN via', arcgisResult.method, ':', apn)
    } else {
      // Use provided APN
      apn = formatAPN(rawAPN!)
      if (!isValidAPN(apn)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid APN format',
            details: 'APN must be in format XXX-XX-XXXA (e.g., 123-45-678A)',
          },
          { status: 400 }
        )
      }
    }

    console.log('[MCAO Lookup API] Looking up APN:', apn, { refresh })

    // Check database cache first (unless refresh requested)
    if (!refresh) {
      const { data: dbData, error: dbError } = await getMCAODataByAPN(apn)

      if (dbData && !dbError) {
        console.log('[MCAO Lookup API] Found in database cache')
        // Process cached data through client to get categorized fields
        const mcaoClient = getMCAOClient()
        const processedData = dbData.api_response

        // Manually process to add flattened/categorized data
        const { flattenJSON, categorizeMCAOData } = await import('@/lib/types/mcao-data')
        const flattenedData = processedData.rawResponse ? flattenJSON(processedData.rawResponse) : {}
        const categorizedData = categorizeMCAOData(flattenedData)
        const fieldCount = Object.keys(flattenedData).length

        return NextResponse.json({
          success: true,
          data: dbData.api_response,
          flattenedData,
          categorizedData,
          fieldCount,
          cached: true,
          source: 'database',
          cachedAt: dbData.fetched_at,
          timestamp: new Date().toISOString(),
        })
      }
    }

    // Call MCAO API
    const mcaoClient = getMCAOClient()
    const lookupRequest: MCAOLookupRequest = {
      apn,
      includeHistory,
      includeTax,
      refresh,
    }

    const result = await mcaoClient.lookupByAPN(lookupRequest)

    if (!result.success) {
      console.error('[MCAO Lookup API] API error:', result.error)
      return NextResponse.json(
        {
          success: false,
          error: result.error?.message || 'MCAO API lookup failed',
          errorCode: result.error?.code,
          details: result.error?.details,
        },
        { status: 400 }
      )
    }

    // Save to database for future caching
    if (result.data) {
      const { error: saveError } = await saveMCAOData(apn, result.data)
      if (saveError) {
        console.warn('[MCAO Lookup API] Failed to save to database:', saveError)
        // Continue anyway, not critical
      }
    }

    // Return complete API response with categorized data
    return NextResponse.json({
      success: true,
      data: result.data,
      flattenedData: result.flattenedData,
      categorizedData: result.categorizedData,
      fieldCount: result.fieldCount,
      cached: result.cached || false,
      source: result.cached ? 'client_cache' : 'api',
      cachedAt: result.cachedAt,
      timestamp: new Date().toISOString(),
      apn, // Include resolved APN
      lookupMethod, // Include lookup method if address was used
      lookupConfidence, // Include confidence if address was used
    })
  } catch (error) {
    console.error('[MCAO Lookup API] Unexpected error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET: Lookup endpoint documentation
 */
export async function GET() {
  return NextResponse.json({
    endpoint: 'POST /api/admin/mcao/lookup',
    description: 'Lookup property by APN using MCAO API',
    authentication: 'Required: Admin role',
    parameters: {
      apn: {
        type: 'string',
        required: true,
        format: 'XXX-XX-XXXA',
        example: '123-45-678A',
        description: 'Assessor Parcel Number',
      },
      includeHistory: {
        type: 'boolean',
        required: false,
        default: false,
        description: 'Include sales history in response',
      },
      includeTax: {
        type: 'boolean',
        required: false,
        default: false,
        description: 'Include tax details in response',
      },
      refresh: {
        type: 'boolean',
        required: false,
        default: false,
        description: 'Bypass cache and fetch fresh data from API',
      },
    },
    response: {
      success: 'boolean',
      data: 'MCAOApiResponse object',
      cached: 'boolean',
      source: '"database" | "api" | "client_cache"',
      cachedAt: 'ISO timestamp (if cached)',
      timestamp: 'ISO timestamp',
    },
    example: {
      request: {
        apn: '123-45-678A',
        includeHistory: true,
        refresh: false,
      },
      response: {
        success: true,
        data: {
          apn: '123-45-678A',
          ownerName: 'John Doe',
          propertyAddress: {
            fullAddress: '123 Main St, Phoenix, AZ 85001',
          },
          assessedValue: {
            total: 350000,
          },
          taxInfo: {
            taxAmount: 3500,
          },
        },
        cached: true,
        source: 'database',
        cachedAt: '2025-10-16T10:00:00Z',
        timestamp: '2025-10-16T10:05:00Z',
      },
    },
  })
}
