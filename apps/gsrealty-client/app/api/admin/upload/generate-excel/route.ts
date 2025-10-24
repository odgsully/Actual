/**
 * Generate Excel API Route - UPDATED
 *
 * PUT /api/admin/upload/generate-excel
 * Generates populated Excel file from uploaded MLS data with:
 * - Separate MLS-Resi-Comps and MLS-Lease-Comps sheets
 * - Column A origin labels for all properties
 * - Batch APN lookups for missing APNs
 * - Full-MCAO-API sheet with ALL properties
 * - Complete 40-column Analysis sheet
 */

import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { batchLookupAPNs, extractAddressesFromMLSData } from '@/lib/mcao/batch-apn-lookup'
import { generateAnalysisSheet } from '@/lib/processing/analysis-sheet-generator'
import type {
  PropertyMasterListEntry,
  ItemLabel,
  MLSSourceType,
  UploadGenerationMetadata
} from '@/lib/types/mls-data'

const LOG_PREFIX = '[Generate Excel]'

export async function PUT(req: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await req.json()
    const {
      subjectProperty,
      residential15Mile,
      residentialLease15Mile,
      residential3YrDirect,
      residentialLease3YrDirect,
      mcaoData,
      clientName
    } = body

    console.log(`${LOG_PREFIX} Starting Excel generation for client: ${clientName}`)
    console.log(`${LOG_PREFIX} Property counts:`, {
      res15: residential15Mile?.length || 0,
      resLease15: residentialLease15Mile?.length || 0,
      res3Yr: residential3YrDirect?.length || 0,
      resLease3Yr: residentialLease3YrDirect?.length || 0,
    })

    // Step 1: Build master property list
    const masterList = buildMasterPropertyList(
      subjectProperty,
      residential15Mile || [],
      residentialLease15Mile || [],
      residential3YrDirect || [],
      residentialLease3YrDirect || [],
      mcaoData
    )

    console.log(`${LOG_PREFIX} Master list created with ${masterList.length} properties`)

    // Step 2: Batch lookup missing APNs
    const addressesForLookup = masterList
      .filter(p => !p.hasApn && p.source !== 'subject')
      .map(p => ({
        address: p.address,
        city: p.mlsData?.city,
        zip: p.mlsData?.zip,
        existingApn: p.apn,
      }))

    console.log(`${LOG_PREFIX} ${addressesForLookup.length} addresses need APN lookup`)

    let lookupResults: any[] = []
    if (addressesForLookup.length > 0) {
      try {
        lookupResults = await batchLookupAPNs(addressesForLookup, (progress) => {
          console.log(`${LOG_PREFIX} Lookup progress: ${progress.percentage}% (${progress.successful}/${progress.total})`)
        })

        // Enrich master list with lookup results
        enrichMasterListWithLookupResults(masterList, lookupResults)

        console.log(`${LOG_PREFIX} APN lookup complete: ${lookupResults.filter(r => r.success).length} successful`)
      } catch (error) {
        console.error(`${LOG_PREFIX} APN lookup failed, continuing without:`, error)
      }
    }

    // Step 3: Create workbook
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'GSRealty Upload System'
    workbook.created = new Date()

    // Step 4: Create MLS-Resi-Comps sheet
    await createMLSResiCompsSheet(workbook, masterList)

    // Step 5: Create MLS-Lease-Comps sheet
    await createMLSLeaseCompsSheet(workbook, masterList)

    // Step 6: Create Full-MCAO-API sheet with ALL properties
    await createFullMCAOAPISheet(workbook, masterList)

    // Step 7: Create Analysis sheet (40 columns)
    const propertiesForAnalysis = masterList.map(p => ({
      itemLabel: p.itemLabel,
      mlsData: p.mlsData,
      mcaoData: p.mcaoData,
      address: p.address,
    }))
    await generateAnalysisSheet(workbook, propertiesForAnalysis)

    // Step 8: Generate buffer
    const buffer = await workbook.xlsx.writeBuffer()

    // Generate filename
    const now = new Date()
    const timestamp = formatTimestamp(now)
    const lastName = (clientName || 'Client').split(' ')[0].replace(/[^a-zA-Z0-9]/g, '')
    const filename = `Upload_${lastName}_${timestamp}.xlsx`

    const generationTime = Date.now() - startTime

    console.log(`${LOG_PREFIX} Excel generation complete in ${generationTime}ms`)
    console.log(`${LOG_PREFIX} Filename: ${filename}`)

    // Return file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })

  } catch (error) {
    console.error(`${LOG_PREFIX} Error:`, error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate Excel file'
      },
      { status: 500 }
    )
  }
}

/**
 * Build master property list with all sources
 */
function buildMasterPropertyList(
  subjectProperty: any,
  residential15Mile: any[],
  residentialLease15Mile: any[],
  residential3YrDirect: any[],
  residentialLease3YrDirect: any[],
  mcaoData: any
): PropertyMasterListEntry[] {
  const masterList: PropertyMasterListEntry[] = []

  // Add subject property if exists
  if (subjectProperty && mcaoData) {
    masterList.push({
      address: mcaoData.data?.propertyAddress?.fullAddress || subjectProperty.address || 'Subject Property',
      apn: mcaoData.data?.apn,
      itemLabel: 'Subject Property',
      source: 'subject',
      mlsData: null,
      mcaoData: mcaoData.data,
      hasApn: !!mcaoData.data?.apn,
      hasMCAOData: true,
      needsLookup: false,
    })
  }

  // Helper to add properties with source tracking
  const addProperties = (
    properties: any[],
    source: MLSSourceType,
    itemLabel: ItemLabel
  ) => {
    properties.forEach(prop => {
      const address = prop.address || prop.propertyAddress || prop.fullAddress || ''
      const apn = prop.apn || prop.APN

      masterList.push({
        address,
        apn,
        itemLabel,
        source,
        mlsData: prop,
        mcaoData: null,
        hasApn: !!apn,
        hasMCAOData: false,
        needsLookup: !apn,
      })
    })
  }

  // Add all MLS properties with their labels
  addProperties(residential15Mile, 'residential15Mile', 'Residential 1.5 Mile Comps')
  addProperties(residentialLease15Mile, 'residentialLease15Mile', 'Residential Lease 1.5 Mile Comps')
  addProperties(residential3YrDirect, 'residential3YrDirect', 'Residential 3 yr Direct Subdivision Comps')
  addProperties(residentialLease3YrDirect, 'residentialLease3YrDirect', 'Residential Lease 3yr Direct Subdivision Comps')

  return masterList
}

/**
 * Enrich master list with APN lookup results
 */
function enrichMasterListWithLookupResults(
  masterList: PropertyMasterListEntry[],
  lookupResults: any[]
) {
  lookupResults.forEach(result => {
    const entry = masterList.find(p =>
      p.address.toLowerCase().trim() === result.address.toLowerCase().trim()
    )

    if (entry) {
      entry.lookupAttempted = true
      if (result.success) {
        entry.apn = result.apn
        entry.mcaoData = result.mcaoData
        entry.hasApn = true
        entry.hasMCAOData = !!result.mcaoData
        entry.needsLookup = false
      } else {
        entry.lookupError = result.error
      }
    }
  })
}

/**
 * Create MLS-Resi-Comps sheet with Column A origin labels
 */
async function createMLSResiCompsSheet(
  workbook: ExcelJS.Workbook,
  masterList: PropertyMasterListEntry[]
) {
  console.log(`${LOG_PREFIX} Creating MLS-Resi-Comps sheet`)

  const sheet = workbook.addWorksheet('MLS-Resi-Comps')

  // Filter residential comps only
  const resiComps = masterList.filter(p =>
    p.itemLabel === 'Residential 1.5 Mile Comps' ||
    p.itemLabel === 'Residential 3 yr Direct Subdivision Comps'
  )

  console.log(`${LOG_PREFIX} MLS-Resi-Comps: ${resiComps.length} properties`)

  // Add headers
  addMLSSheetHeaders(sheet)

  // Add data rows
  resiComps.forEach((prop, index) => {
    const row = sheet.getRow(index + 2) // Row 1 is headers
    populateMLSRow(row, prop)
  })

  // Auto-fit columns
  sheet.columns.forEach(column => {
    column.width = 15
  })
}

/**
 * Create MLS-Lease-Comps sheet with Column A origin labels
 */
async function createMLSLeaseCompsSheet(
  workbook: ExcelJS.Workbook,
  masterList: PropertyMasterListEntry[]
) {
  console.log(`${LOG_PREFIX} Creating MLS-Lease-Comps sheet`)

  const sheet = workbook.addWorksheet('MLS-Lease-Comps')

  // Filter lease comps only
  const leaseComps = masterList.filter(p =>
    p.itemLabel === 'Residential Lease 1.5 Mile Comps' ||
    p.itemLabel === 'Residential Lease 3yr Direct Subdivision Comps'
  )

  console.log(`${LOG_PREFIX} MLS-Lease-Comps: ${leaseComps.length} properties`)

  // Add headers
  addMLSSheetHeaders(sheet)

  // Add data rows
  leaseComps.forEach((prop, index) => {
    const row = sheet.getRow(index + 2)
    populateMLSRow(row, prop)
  })

  // Auto-fit columns
  sheet.columns.forEach(column => {
    column.width = 15
  })
}

/**
 * Add headers to MLS sheets
 */
function addMLSSheetHeaders(sheet: ExcelJS.Worksheet) {
  const headers = [
    'Item',                  // Column A
    'Address',
    'City',
    'State',
    'ZIP',
    'Price',
    'Bedrooms',
    'Bathrooms',
    'Square Feet',
    'Lot Size',
    'Year Built',
    'Status',
    'List Date',
    'Sold Date',
    'DOM',
    'Price Per SF',
    'APN',                   // Important: APN is here
    'Source'
  ]

  const headerRow = sheet.getRow(1)
  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1)
    cell.value = header
    cell.font = { bold: true }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    }
  })
}

/**
 * Populate a single MLS row with Column A = origin label
 */
function populateMLSRow(row: ExcelJS.Row, property: PropertyMasterListEntry) {
  const mls = property.mlsData || {}

  // Column A: Item (origin label) - CRITICAL!
  row.getCell(1).value = property.itemLabel

  // Column B+: MLS data
  row.getCell(2).value = property.address || mls.address || ''
  row.getCell(3).value = mls.city || ''
  row.getCell(4).value = mls.state || 'AZ'
  row.getCell(5).value = mls.zip || ''
  row.getCell(6).value = mls.price || mls.salePrice || mls.listPrice || ''
  row.getCell(7).value = mls.bedrooms || ''
  row.getCell(8).value = mls.bathrooms || ''
  row.getCell(9).value = mls.squareFeet || mls.sqft || ''
  row.getCell(10).value = mls.lotSize || ''
  row.getCell(11).value = mls.yearBuilt || ''
  row.getCell(12).value = mls.status || ''
  row.getCell(13).value = mls.listDate || ''
  row.getCell(14).value = mls.soldDate || mls.saleDate || ''
  row.getCell(15).value = mls.dom || mls.daysOnMarket || ''
  row.getCell(16).value = mls.pricePerSF || ''
  row.getCell(17).value = property.apn || mls.apn || '' // APN from lookup or MLS
  row.getCell(18).value = property.itemLabel // Redundant source for clarity
}

/**
 * Create Full-MCAO-API sheet with ALL properties that have MCAO data
 */
async function createFullMCAOAPISheet(
  workbook: ExcelJS.Workbook,
  masterList: PropertyMasterListEntry[]
) {
  console.log(`${LOG_PREFIX} Creating Full-MCAO-API sheet`)

  const sheet = workbook.addWorksheet('Full-MCAO-API')

  // Filter properties with MCAO data
  const propertiesWithMCAO = masterList.filter(p => p.hasMCAOData && p.mcaoData)

  console.log(`${LOG_PREFIX} Full-MCAO-API: ${propertiesWithMCAO.length} properties with MCAO data`)

  // Add headers
  addMCAOSheetHeaders(sheet)

  // Add data rows
  propertiesWithMCAO.forEach((prop, index) => {
    const row = sheet.getRow(index + 2)
    populateMCAORow(row, prop)
  })

  // Auto-fit columns
  sheet.columns.forEach(column => {
    column.width = 20
  })
}

/**
 * Add headers to Full-MCAO-API sheet
 */
function addMCAOSheetHeaders(sheet: ExcelJS.Worksheet) {
  const headers = [
    'Item',                    // Column A - origin label
    'APN',
    'Address',
    'Owner',
    'Assessed Value',
    'Property Type',
    'Land Use',
    'Lot Size',
    'Year Built',
    'Bedrooms',
    'Bathrooms',
    'Living Area',
    'Last Sale Price',
    'Last Sale Date',
  ]

  const headerRow = sheet.getRow(1)
  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1)
    cell.value = header
    cell.font = { bold: true }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    }
  })
}

/**
 * Populate a single MCAO row with Column A = origin label
 */
function populateMCAORow(row: ExcelJS.Row, property: PropertyMasterListEntry) {
  const mcao = property.mcaoData || {}

  // Column A: Item (origin label) - CRITICAL!
  row.getCell(1).value = property.itemLabel

  // Column B+: MCAO data (API response fields start here)
  row.getCell(2).value = mcao.apn || ''
  row.getCell(3).value = mcao.propertyAddress?.fullAddress || property.address || ''
  row.getCell(4).value = mcao.ownerName || ''
  row.getCell(5).value = mcao.assessedValue?.total || ''
  row.getCell(6).value = mcao.propertyType || ''
  row.getCell(7).value = mcao.landUse || ''
  row.getCell(8).value = mcao.lotSize || ''
  row.getCell(9).value = mcao.yearBuilt || ''
  row.getCell(10).value = mcao.bedrooms || ''
  row.getCell(11).value = mcao.bathrooms || ''
  row.getCell(12).value = mcao.improvementSize || ''
  row.getCell(13).value = mcao.salesHistory?.[0]?.salePrice || ''
  row.getCell(14).value = mcao.salesHistory?.[0]?.saleDate || ''
}

/**
 * Format timestamp for filename
 */
function formatTimestamp(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}-${hours}${minutes}`
}
