/**
 * MCAO Property API Route (Dynamic APN)
 *
 * GET /api/admin/mcao/property/[apn]
 * Get cached MCAO property data by APN from database
 *
 * @see lib/database/mcao.ts for database operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMCAODataByAPN, deleteMCAOData } from '@/lib/database/mcao'
import { isValidAPN, formatAPN, parseToSummary } from '@/lib/types/mcao-data'

interface RouteParams {
  params: {
    apn: string
  }
}

/**
 * GET: Retrieve MCAO property data by APN
 *
 * Returns cached data from database only (does NOT call MCAO API)
 * Use /api/admin/mcao/lookup for API calls
 *
 * Response:
 * - success: Boolean
 * - data: Full MCAO API response (JSONB)
 * - summary: Simplified property summary
 * - record: Database record metadata
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { apn: rawAPN } = params

    // Validate APN
    if (!rawAPN) {
      return NextResponse.json(
        { success: false, error: 'APN parameter is required' },
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

    console.log('[MCAO Property API] Retrieving data for APN:', apn)

    // Get from database
    const { data: dbRecord, error: dbError } = await getMCAODataByAPN(apn)

    if (dbError) {
      console.error('[MCAO Property API] Database error:', dbError)
      return NextResponse.json(
        {
          success: false,
          error: 'Database query failed',
          details: dbError.message,
        },
        { status: 500 }
      )
    }

    if (!dbRecord) {
      return NextResponse.json(
        {
          success: false,
          error: 'Property not found',
          details: `No MCAO data found for APN ${apn}`,
          hint: 'Use POST /api/admin/mcao/lookup to fetch from MCAO API',
        },
        { status: 404 }
      )
    }

    // Parse summary from full API response
    const summary = parseToSummary(dbRecord.api_response)

    // Return data
    return NextResponse.json({
      success: true,
      data: dbRecord.api_response,
      summary,
      record: {
        id: dbRecord.id,
        apn: dbRecord.apn,
        propertyId: dbRecord.property_id,
        fetchedAt: dbRecord.fetched_at,
        updatedAt: dbRecord.updated_at,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[MCAO Property API] Unexpected error:', error)
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
 * DELETE: Remove MCAO property data by APN
 *
 * Deletes cached data from database
 * Requires admin authentication
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { apn: rawAPN } = params

    // Validate APN
    if (!rawAPN) {
      return NextResponse.json(
        { success: false, error: 'APN parameter is required' },
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

    console.log('[MCAO Property API] Deleting data for APN:', apn)

    // Delete from database
    const { success, error } = await deleteMCAOData(apn)

    if (error) {
      console.error('[MCAO Property API] Delete error:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete property data',
          details: error.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `MCAO data for APN ${apn} deleted successfully`,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[MCAO Property API] Unexpected error:', error)
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
 * PATCH: Update property linking
 *
 * Links MCAO data to a property record in gsrealty_properties table
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { apn: rawAPN } = params
    const body = await req.json()
    const { propertyId } = body

    // Validate APN
    if (!rawAPN) {
      return NextResponse.json(
        { success: false, error: 'APN parameter is required' },
        { status: 400 }
      )
    }

    if (!propertyId) {
      return NextResponse.json(
        { success: false, error: 'propertyId is required in request body' },
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

    console.log('[MCAO Property API] Linking APN to property:', apn, propertyId)

    // Import linkMCAOToProperty here to avoid circular dependency
    const { linkMCAOToProperty } = await import('@/lib/database/mcao')
    const { success, error } = await linkMCAOToProperty(apn, propertyId)

    if (error) {
      console.error('[MCAO Property API] Link error:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to link property',
          details: error.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `MCAO data for APN ${apn} linked to property ${propertyId}`,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[MCAO Property API] Unexpected error:', error)
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
