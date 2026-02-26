/**
 * Bulk MCAO Lookup Route
 *
 * Phase 0.5b: Replaced Python subprocess with TypeScript EnrichmentService.
 * Accepts CSV/Excel upload, resolves APNs via ArcGIS, fetches MCAO data,
 * returns ZIP with APN_Grab + MCAO + Original files.
 */

import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import { ZipGenerator } from '@/lib/mcao/zip-generator'
import { ExcelGenerator } from '@/lib/mcao/excel-generator'
import { requireAdmin } from '@/lib/api/admin-auth'
import { createEnrichmentService } from '@/lib/pipeline/enrichment-service'

export const maxDuration = 300 // 5 minutes (Pro plan max is 800s)
export const dynamic = 'force-dynamic'

const LOG_PREFIX = '[MCAO Bulk]'

export async function POST(request: NextRequest) {
  // Verify admin authentication
  const auth = await requireAdmin()
  if (!auth.success) return auth.response

  try {
    // Parse the form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.csv') && !fileName.endsWith('.xlsx')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a CSV or Excel file.' },
        { status: 400 }
      )
    }

    // Check file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 50MB.' },
        { status: 400 }
      )
    }

    // Parse file to extract addresses
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const addresses = extractAddresses(fileName, buffer)

    if (addresses.length === 0) {
      return NextResponse.json(
        { error: 'No valid addresses found in the file.' },
        { status: 400 }
      )
    }

    console.log(`${LOG_PREFIX} Starting enrichment for ${addresses.length} addresses`)

    // Enrich via unified EnrichmentService (replaces Python subprocess)
    const service = createEnrichmentService({ minConfidence: 0.75 })
    const { results, summary } = await service.enrichBatch(
      addresses.map(a => ({ address: a.address, existingApn: a.existingApn })),
      (progress) => {
        console.log(`${LOG_PREFIX} Progress: ${progress.percentage}% (${progress.successful} resolved)`)
      }
    )

    if (summary.aborted) {
      console.error(`${LOG_PREFIX} Enrichment aborted: ${summary.abortReason}`)
      return NextResponse.json(
        { error: `Enrichment aborted: ${summary.abortReason}`, summary },
        { status: 422 }
      )
    }

    console.log(`${LOG_PREFIX} Enrichment complete: ${summary.resolved} resolved, ${summary.apnFailed} failed`)

    // Build address records for Excel generation (backward-compatible shape)
    const addressRecords = results.map((r, i) => ({
      address: r.address,
      apn: r.apn || '',
      originalRow: addresses[i].originalRow,
      mcaoData: r.mcaoData || null,
      error: r.error?.message,
    }))

    // Create timestamp for file naming
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19)

    // Generate APN_Grab Excel (address + APN + method + confidence)
    const excelGenerator = new ExcelGenerator()
    const apnGrabBuffer = await excelGenerator.generateAPNGrabFile(addressRecords, timestamp)

    // Generate MCAO Excel file
    const mcaoBuffer = await excelGenerator.generateMCAOFile(addressRecords, timestamp)

    // Create ZIP with all three files
    const zipGenerator = new ZipGenerator()
    const zipBuffer = await zipGenerator.createZip({
      [`APN_Grab_${timestamp}.xlsx`]: apnGrabBuffer,
      [`MCAO_${timestamp}.xlsx`]: mcaoBuffer,
      [`Original_${file.name}`]: buffer,
    })

    // Return the ZIP file
    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="MCAO_Bulk_${timestamp}.zip"`,
      },
    })

  } catch (error) {
    console.error(`${LOG_PREFIX} Processing error:`, error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json(
      { error: 'Failed to process file.' },
      { status: 500 }
    )
  }
}

// ─── Address extraction from uploaded files ─────────────────

interface ExtractedAddress {
  address: string
  existingApn?: string
  originalRow: any
}

function extractAddresses(fileName: string, buffer: Buffer): ExtractedAddress[] {
  if (fileName.endsWith('.csv')) {
    return extractFromCSV(buffer)
  }
  return extractFromExcel(buffer)
}

function extractFromCSV(buffer: Buffer): ExtractedAddress[] {
  const text = buffer.toString('utf-8')
  const result = Papa.parse(text, { header: true, skipEmptyLines: true })
  const addresses: ExtractedAddress[] = []

  for (const row of result.data as Record<string, string>[]) {
    const address = findAddressValue(row)
    if (address) {
      addresses.push({
        address,
        existingApn: findAPNValue(row) || undefined,
        originalRow: row,
      })
    }
  }

  return addresses
}

function extractFromExcel(buffer: Buffer): ExtractedAddress[] {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellText: true })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) return []

  const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { raw: false, defval: '' }) as Record<string, string>[]
  const addresses: ExtractedAddress[] = []

  for (const row of data) {
    const address = findAddressValue(row)
    if (address) {
      addresses.push({
        address,
        existingApn: findAPNValue(row) || undefined,
        originalRow: row,
      })
    }
  }

  return addresses
}

/** Find the address column value in a row */
function findAddressValue(row: Record<string, string>): string | null {
  const addressKeys = [
    'Address', 'address', 'FULL_ADDRESS', 'full_address', 'FullAddress',
    'Property Address', 'property_address', 'Street Address', 'street_address',
    'Location', 'location', 'Addr', 'addr',
  ]

  for (const key of addressKeys) {
    if (row[key] && typeof row[key] === 'string' && row[key].trim().length > 5) {
      return row[key].trim()
    }
  }

  // Fallback: find first column with address-like content
  for (const key of Object.keys(row)) {
    if (key.toLowerCase().includes('address') || key.toLowerCase().includes('addr')) {
      const value = row[key]
      if (value && typeof value === 'string' && value.trim().length > 5) {
        return value.trim()
      }
    }
  }

  return null
}

/** Find the APN column value in a row */
function findAPNValue(row: Record<string, string>): string | null {
  const apnKeys = [
    'APN', 'apn', 'Assessor Number', 'assessor_number', 'Parcel',
    'parcel', 'Parcel Number', 'parcel_number',
  ]

  for (const key of apnKeys) {
    if (row[key] && typeof row[key] === 'string' && row[key].trim()) {
      return row[key].trim()
    }
  }

  return null
}
