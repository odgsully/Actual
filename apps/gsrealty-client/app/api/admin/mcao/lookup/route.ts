/**
 * MCAO Lookup API Route
 *
 * POST /api/admin/mcao/lookup
 * Lookup property by APN using MCAO API with database caching
 *
 * @see lib/mcao/client.ts for MCAO API client
 * @see lib/database/mcao.ts for database operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMCAOClient } from '@/lib/mcao/client'
import { saveMCAOData, getMCAODataByAPN } from '@/lib/database/mcao'
import type { MCAOLookupRequest } from '@/lib/types/mcao-data'
import { isValidAPN, formatAPN } from '@/lib/types/mcao-data'

interface LookupRequest {
  apn: string
  includeHistory?: boolean
  includeTax?: boolean
  refresh?: boolean // Force API call, bypass cache
}

/**
 * POST: Lookup property by APN
 *
 * Request body:
 * - apn: Assessor Parcel Number (XXX-XX-XXXA)
 * - includeHistory: Include sales history (optional)
 * - includeTax: Include tax details (optional)
 * - refresh: Bypass cache and fetch fresh data (optional)
 *
 * Response:
 * - success: Boolean indicating success
 * - data: MCAO API response data
 * - cached: Boolean indicating if from cache
 * - source: 'database' | 'api' | 'client_cache'
 */
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body: LookupRequest = await req.json()
    const { apn: rawAPN, includeHistory, includeTax, refresh } = body

    // Validate APN
    if (!rawAPN) {
      return NextResponse.json(
        { success: false, error: 'APN is required' },
        { status: 400 }
      )
    }

    const apn = formatAPN(rawAPN)
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

    console.log('[MCAO Lookup API] Looking up APN:', apn, { refresh })

    // Check database cache first (unless refresh requested)
    if (!refresh) {
      const { data: dbData, error: dbError } = await getMCAODataByAPN(apn)

      if (dbData && !dbError) {
        console.log('[MCAO Lookup API] Found in database cache')
        return NextResponse.json({
          success: true,
          data: dbData.api_response,
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

    // Return API response
    return NextResponse.json({
      success: true,
      data: result.data,
      cached: result.cached || false,
      source: result.cached ? 'client_cache' : 'api',
      cachedAt: result.cachedAt,
      timestamp: new Date().toISOString(),
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
