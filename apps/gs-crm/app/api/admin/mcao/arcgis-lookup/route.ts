/**
 * ArcGIS MCAO APN Lookup API
 *
 * POST /api/admin/mcao/arcgis-lookup
 * Uses public Maricopa County ArcGIS services (NO AUTH REQUIRED)
 */

import { NextRequest, NextResponse } from 'next/server'
import { lookupAPNFromAddress } from '@/lib/mcao/arcgis-lookup'
import { requireAdmin } from '@/lib/api/admin-auth'

const LOG_PREFIX = '[API: ArcGIS Lookup]'

export async function POST(req: NextRequest) {
  try {
    // Verify admin authentication
    const auth = await requireAdmin()
    if (!auth.success) return auth.response

    const body = await req.json()
    const { address } = body

    if (!address) {
      return NextResponse.json(
        {
          success: false,
          error: 'Address is required',
          details: 'Please provide an address in the request body'
        },
        { status: 400 }
      )
    }

    console.log(`${LOG_PREFIX} Looking up APN (method: arcgis)`)

    const result = await lookupAPNFromAddress(address)

    if (result.apn) {
      console.log(`${LOG_PREFIX} ✓ Found APN (method: ${result.method}, confidence: ${result.confidence})`)

      return NextResponse.json({
        success: true,
        data: {
          apn: result.apn,
          address: address,
          method: result.method,
          confidence: result.confidence,
          notes: result.notes
        }
      })
    } else {
      console.log(`${LOG_PREFIX} ✗ No APN found (method: ${result.method})`)

      return NextResponse.json({
        success: false,
        error: 'APN not found',
        details: result.notes,
        method: result.method
      })
    }
  } catch (error) {
    console.error(`${LOG_PREFIX} Error:`, error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: 'Internal server error during APN lookup'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'Maricopa County ArcGIS APN Lookup',
    version: '1.0.0',
    endpoints: {
      parcels: 'https://gis.mcassessor.maricopa.gov/arcgis/rest/services/Parcels/MapServer/0/query',
      geocoder: 'https://gis.mcassessor.maricopa.gov/arcgis/rest/services/AssessorCompositeLocator/GeocodeServer/findAddressCandidates',
      identify: 'https://gis.mcassessor.maricopa.gov/arcgis/rest/services/Parcels/MapServer/identify'
    },
    authentication: 'None required (public service)',
    methods: ['exact_where', 'loose_where', 'geocode_identify']
  })
}
