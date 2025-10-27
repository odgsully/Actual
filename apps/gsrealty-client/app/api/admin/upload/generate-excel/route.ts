/**
 * Generate Excel API Route - TEMPLATE-BASED VERSION
 *
 * PUT /api/admin/upload/generate-excel
 * Generates populated Excel file from uploaded MLS data with:
 * - Uses ACTUAL template file as base (preserves ALL columns)
 * - Separate MLS-Resi-Comps (100 cols) and MLS-Lease-Comps (98 cols) sheets
 * - Column A (Item) origin labels for all properties
 * - Batch APN lookups for missing APNs
 * - Full-MCAO-API sheet (287 cols) with ALL properties
 * - Complete 40-column Analysis sheet
 */

import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import * as fs from 'fs'
import * as path from 'path'
import { batchLookupAPNs, extractAddressesFromMLSData } from '@/lib/mcao/batch-apn-lookup'
import { batchFetchMCAOProperties } from '@/lib/mcao/fetch-property-data'
import { generateAnalysisSheet } from '@/lib/processing/analysis-sheet-generator'
import type {
  PropertyMasterListEntry,
  ItemLabel,
  MLSSourceType,
  UploadGenerationMetadata
} from '@/lib/types/mls-data'

const LOG_PREFIX = '[Generate Excel]'

// CORRECT template path
const TEMPLATE_PATH = '/Users/garrettsullivan/Desktop/‼️/RE/RealtyONE/MY LISTINGS/gsrealty-client-template.xlsx'

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
      clientName,
      subjectManualInputs
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

    // Step 2: Extract APNs from MLS data (Assessor Number column)
    console.log(`${LOG_PREFIX} Extracting APNs from MLS data...`)
    masterList.forEach(p => {
      if (p.mlsData && !p.hasApn) {
        const rawData = (p.mlsData as any).rawData || p.mlsData
        // MLS CSV has "Assessor Number" column with APN in format "173-24-323"
        const apnFromMLS = rawData['Assessor Number'] || rawData['Assessor\'s Parcel #']
        if (apnFromMLS && apnFromMLS.toString().trim()) {
          p.apn = apnFromMLS.toString().trim()
          p.hasApn = true
          console.log(`${LOG_PREFIX} Found APN in MLS data for ${p.address}: ${p.apn}`)
        }
      }
    })

    const propertiesWithApn = masterList.filter(p => p.hasApn).length
    console.log(`${LOG_PREFIX} ${propertiesWithApn}/${masterList.length} properties have APNs from MLS data`)

    // Step 3: Batch lookup missing APNs via ArcGIS (optional)
    // Use FULL_ADDRESS built from MLS data for accurate lookups
    const addressesForLookup = masterList
      .filter(p => !p.hasApn && p.source !== 'subject')
      .map(p => {
        const mls = p.mlsData || {}
        const rawData = (mls as any).rawData || mls
        const fullAddress = buildFullAddress(rawData, p.address)

        return {
          address: fullAddress, // Use full formatted address
          city: rawData['City/Town Code'] || p.mlsData?.city,
          zip: rawData['Zip Code'] || p.mlsData?.zip,
          existingApn: p.apn,
        }
      })

    console.log(`${LOG_PREFIX} ${addressesForLookup.length} addresses still need APN lookup via ArcGIS`)
    if (addressesForLookup.length > 0) {
      console.log(`${LOG_PREFIX} Sample lookup address: ${addressesForLookup[0].address}`)
    }

    let lookupResults: any[] = []
    if (addressesForLookup.length > 0) {
      try {
        console.log(`${LOG_PREFIX} Starting ArcGIS batch lookup...`)
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

    // Step 4: Fetch full MCAO property data for all APNs
    const apnsToFetch = masterList
      .filter(p => p.hasApn && p.apn && !p.mcaoData)
      .map(p => p.apn!)

    console.log(`${LOG_PREFIX} Fetching full MCAO property data for ${apnsToFetch.length} APNs...`)

    if (apnsToFetch.length > 0) {
      try {
        const mcaoDataMap = await batchFetchMCAOProperties(apnsToFetch, (completed, total) => {
          const percentage = Math.round((completed / total) * 100)
          console.log(`${LOG_PREFIX} MCAO fetch progress: ${percentage}% (${completed}/${total})`)
        })

        // Enrich master list with MCAO data
        masterList.forEach(p => {
          if (p.apn && mcaoDataMap.has(p.apn)) {
            p.mcaoData = mcaoDataMap.get(p.apn) as any
            p.hasMCAOData = true
          }
        })

        console.log(`${LOG_PREFIX} MCAO data fetch complete: ${mcaoDataMap.size} properties enriched`)
      } catch (error) {
        console.error(`${LOG_PREFIX} MCAO data fetch failed, continuing without:`, error)
      }
    }

    // Step 6: Load template workbook (preserves ALL columns)
    console.log(`${LOG_PREFIX} Loading template from: ${TEMPLATE_PATH}`)
    const workbook = new ExcelJS.Workbook()

    if (!fs.existsSync(TEMPLATE_PATH)) {
      throw new Error(`Template file not found at: ${TEMPLATE_PATH}`)
    }

    await workbook.xlsx.readFile(TEMPLATE_PATH)
    console.log(`${LOG_PREFIX} Template loaded with sheets: ${workbook.worksheets.map(w => w.name).join(', ')}`)

    // Step 7: Populate MLS-Resi-Comps sheet (preserves 100 columns)
    await populateMLSResiCompsSheet(workbook, masterList)

    // Step 8: Populate MLS-Lease-Comps sheet (preserves 98 columns)
    await populateMLSLeaseCompsSheet(workbook, masterList)

    // Step 9: Populate Full-MCAO-API sheet (preserves 288 columns with new Column B APN)
    await populateFullMCAOAPISheet(workbook, masterList)

    // Step 10: Populate Analysis sheet (40 columns)
    const propertiesForAnalysis = masterList.map(p => ({
      itemLabel: p.itemLabel,
      mlsData: p.mlsData,
      mcaoData: p.mcaoData,
      address: p.address,
    }))
    await generateAnalysisSheet(workbook, propertiesForAnalysis, subjectManualInputs)

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
    console.log(`${LOG_PREFIX} ========== SUBJECT PROPERTY DEBUG ==========`)
    console.log(`${LOG_PREFIX} mcaoData structure:`, {
      hasData: !!mcaoData.data,
      hasSuccess: !!mcaoData.success,
      topLevelKeys: Object.keys(mcaoData || {})
    })

    // CRITICAL FIX: MCAO data is nested in rawResponse!
    // The API returns a wrapper with summary fields at top level,
    // but the full 285 fields are in data.rawResponse
    let actualMCAOData = mcaoData.data

    if (mcaoData.data?.rawResponse) {
      console.log(`${LOG_PREFIX} ✓ Found rawResponse with detailed data!`)
      // Use rawResponse for detailed property data
      actualMCAOData = mcaoData.data.rawResponse
      console.log(`${LOG_PREFIX} rawResponse has ${Object.keys(actualMCAOData).length} fields`)
    } else if (mcaoData.data) {
      const dataKeys = Object.keys(mcaoData.data)
      console.log(`${LOG_PREFIX} mcaoData.data has ${dataKeys.length} top-level keys (no rawResponse found)`)
      console.log(`${LOG_PREFIX} First 15 keys:`, dataKeys.slice(0, 15))
    } else {
      console.error(`${LOG_PREFIX} ⚠️  WARNING: mcaoData.data is ${mcaoData.data}!`)
    }

    // Log critical fields from actual data
    if (actualMCAOData) {
      console.log(`${LOG_PREFIX} Critical fields check:`)
      console.log(`  - apn: ${actualMCAOData.apn || mcaoData.data?.apn || 'MISSING'}`)
      console.log(`  - propertyAddress.fullAddress: ${actualMCAOData.propertyAddress?.fullAddress || mcaoData.data?.propertyAddress?.fullAddress || 'MISSING'}`)
      console.log(`  - bedrooms: ${actualMCAOData.bedrooms ?? 'MISSING'}`)
      console.log(`  - bathrooms: ${actualMCAOData.bathrooms ?? 'MISSING'}`)
      console.log(`  - improvementSize: ${actualMCAOData.improvementSize ?? 'MISSING'}`)
      console.log(`  - lotSize: ${actualMCAOData.lotSize ?? mcaoData.data?.lotSize ?? 'MISSING'}`)
      console.log(`  - yearBuilt: ${actualMCAOData.yearBuilt ?? 'MISSING'}`)
      console.log(`  - propertyType: ${actualMCAOData.propertyType || mcaoData.data?.propertyType || 'MISSING'}`)
    }

    masterList.push({
      address: actualMCAOData?.propertyAddress?.fullAddress || mcaoData.data?.propertyAddress?.fullAddress || subjectProperty.address || 'Subject Property',
      apn: actualMCAOData?.apn || mcaoData.data?.apn,
      itemLabel: 'Subject Property',
      source: 'subject',
      mlsData: null,
      mcaoData: actualMCAOData,  // ← USE ACTUAL DATA (rawResponse if exists)
      hasApn: !!(actualMCAOData?.apn || mcaoData.data?.apn),
      hasMCAOData: true,
      needsLookup: false,
    })

    console.log(`${LOG_PREFIX} ✓ Subject Property added to master list`)
    console.log(`${LOG_PREFIX} ========================================`)
  } else {
    console.error(`${LOG_PREFIX} ⚠️  Subject Property NOT added:`, {
      hasSubjectProperty: !!subjectProperty,
      hasMcaoData: !!mcaoData
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
 * Populate MLS-Resi-Comps sheet (preserves template's 100 columns)
 */
async function populateMLSResiCompsSheet(
  workbook: ExcelJS.Workbook,
  masterList: PropertyMasterListEntry[]
) {
  console.log(`${LOG_PREFIX} Populating MLS-Resi-Comps sheet`)

  const sheet = workbook.getWorksheet('MLS-Resi-Comps')
  if (!sheet) {
    console.error(`${LOG_PREFIX} MLS-Resi-Comps sheet not found in template!`)
    return
  }

  // Filter residential comps only
  const resiComps = masterList.filter(p =>
    p.itemLabel === 'Residential 1.5 Mile Comps' ||
    p.itemLabel === 'Residential 3 yr Direct Subdivision Comps'
  )

  console.log(`${LOG_PREFIX} MLS-Resi-Comps: ${resiComps.length} properties`)

  // Read template headers from row 1
  const headerRow = sheet.getRow(1)
  const templateHeaders: string[] = []
  headerRow.eachCell((cell, colNumber) => {
    templateHeaders[colNumber - 1] = cell.value?.toString() || ''
  })

  console.log(`${LOG_PREFIX} Template has ${templateHeaders.length} columns. First 10:`, templateHeaders.slice(0, 10))

  // Populate data rows (starting at row 2)
  resiComps.forEach((prop, index) => {
    const row = sheet.getRow(index + 2)
    populateMLSRowFromTemplate(row, prop, templateHeaders)
  })

  // Apply consistent formatting
  formatMLSSheet(sheet, 'Resi')

  console.log(`${LOG_PREFIX} Populated ${resiComps.length} rows in MLS-Resi-Comps`)
}

/**
 * Populate MLS-Lease-Comps sheet (preserves template's 98 columns)
 */
async function populateMLSLeaseCompsSheet(
  workbook: ExcelJS.Workbook,
  masterList: PropertyMasterListEntry[]
) {
  console.log(`${LOG_PREFIX} Populating MLS-Lease-Comps sheet`)

  const sheet = workbook.getWorksheet('MLS-Lease-Comps')
  if (!sheet) {
    console.error(`${LOG_PREFIX} MLS-Lease-Comps sheet not found in template!`)
    return
  }

  // Filter lease comps only
  const leaseComps = masterList.filter(p =>
    p.itemLabel === 'Residential Lease 1.5 Mile Comps' ||
    p.itemLabel === 'Residential Lease 3yr Direct Subdivision Comps'
  )

  console.log(`${LOG_PREFIX} MLS-Lease-Comps: ${leaseComps.length} properties`)

  // Read template headers from row 1
  const headerRow = sheet.getRow(1)
  const templateHeaders: string[] = []
  headerRow.eachCell((cell, colNumber) => {
    templateHeaders[colNumber - 1] = cell.value?.toString() || ''
  })

  console.log(`${LOG_PREFIX} Template has ${templateHeaders.length} columns. First 10:`, templateHeaders.slice(0, 10))

  // Populate data rows (starting at row 2)
  leaseComps.forEach((prop, index) => {
    const row = sheet.getRow(index + 2)
    populateMLSRowFromTemplate(row, prop, templateHeaders)
  })

  // Apply consistent formatting
  formatMLSSheet(sheet, 'Lease')

  console.log(`${LOG_PREFIX} Populated ${leaseComps.length} rows in MLS-Lease-Comps`)
}

/**
 * Populate a single MLS row using template column headers (1:1 mapping)
 * Maps CSV column names to template column names exactly
 * Uses rawData from CSV to preserve ALL original columns (99 columns from MLS)
 */
function populateMLSRowFromTemplate(
  row: ExcelJS.Row,
  property: PropertyMasterListEntry,
  templateHeaders: string[]
) {
  const mls = property.mlsData || {}
  // Use rawData which contains ALL original CSV columns
  const rawData = (mls as any).rawData || mls

  // Iterate through each template column and populate if we have matching data
  templateHeaders.forEach((header, index) => {
    const colNumber = index + 1
    const headerLower = header.toLowerCase().trim()

    // Column 1: "Item" - Always set to source label
    if (headerLower === 'item') {
      row.getCell(colNumber).value = property.itemLabel
      return
    }

    // Try exact match first (CSV column name matches template column name)
    let value = rawData[header]

    // If no exact match, try case-insensitive match
    if (value === undefined || value === null || value === '') {
      const matchingKey = Object.keys(rawData).find(key =>
        key.toLowerCase().trim() === headerLower
      )
      if (matchingKey) {
        value = rawData[matchingKey]
      }
    }

    // Set the value if we found it
    if (value !== undefined && value !== null && value !== '') {
      row.getCell(colNumber).value = value
    }
  })
}

/**
 * Populate Full-MCAO-API sheet (preserves template's 288 columns including new Column B APN)
 * Populates ALL properties that have APNs (from MLS or ArcGIS lookup)
 */
async function populateFullMCAOAPISheet(
  workbook: ExcelJS.Workbook,
  masterList: PropertyMasterListEntry[]
) {
  console.log(`${LOG_PREFIX} Populating Full-MCAO-API sheet`)

  const sheet = workbook.getWorksheet('Full-MCAO-API')
  if (!sheet) {
    console.error(`${LOG_PREFIX} Full-MCAO-API sheet not found in template!`)
    return
  }

  // Filter properties with APNs (either from MLS or ArcGIS lookup)
  // ALWAYS include subject property even if APN is missing
  const propertiesWithAPN = masterList.filter(p =>
    p.itemLabel === 'Subject Property' || (p.hasApn && p.apn)
  )

  console.log(`${LOG_PREFIX} Full-MCAO-API: ${propertiesWithAPN.length} properties (including subject) with APNs`)

  // Read template headers from row 1
  const headerRow = sheet.getRow(1)
  const templateHeaders: string[] = []
  headerRow.eachCell((cell, colNumber) => {
    templateHeaders[colNumber - 1] = cell.value?.toString() || ''
  })

  console.log(`${LOG_PREFIX} Template has ${templateHeaders.length} columns. First 5:`, templateHeaders.slice(0, 5))

  // Populate data rows (starting at row 2)
  propertiesWithAPN.forEach((prop, index) => {
    const row = sheet.getRow(index + 2)
    populateMCAORowFromTemplate(row, prop, templateHeaders)
  })

  console.log(`${LOG_PREFIX} Populated ${propertiesWithAPN.length} rows in Full-MCAO-API`)
}

/**
 * Populate a single MCAO row using template column headers (1:1 mapping)
 * Template now has 289 columns:
 *   Column A (1): FULL_ADDRESS - Full property address
 *   Column B (2): Item - Source label
 *   Column C (3): APN - APN from MLS or ArcGIS lookup
 *   Columns D+ (4+): MCAO API data (if available)
 */
function populateMCAORowFromTemplate(
  row: ExcelJS.Row,
  property: PropertyMasterListEntry,
  templateHeaders: string[]
) {
  const mcao = property.mcaoData || {}

  // Build full address - prefer MCAO for Subject Property, MLS for others
  let fullAddress: string
  if (property.itemLabel === 'Subject Property' && mcao?.propertyAddress?.fullAddress) {
    // CRITICAL: Ensure fullAddress is a string, not an object (prevents Excel corruption)
    const rawFullAddress = mcao.propertyAddress.fullAddress
    if (typeof rawFullAddress === 'string') {
      fullAddress = rawFullAddress
    } else if (typeof rawFullAddress === 'object' && rawFullAddress !== null) {
      // If it's an object, build from components
      const addr = mcao.propertyAddress || {}
      fullAddress = [
        addr.number,
        addr.street,
        addr.unit
      ].filter(Boolean).join(' ') + ', ' +
      [addr.city, addr.state, addr.zip].filter(Boolean).join(' ')
    } else {
      fullAddress = property.address || 'Subject Property'
    }
  } else {
    const mls = property.mlsData || {}
    const rawData = (mls as any).rawData || mls
    fullAddress = buildFullAddress(rawData, property.address)
  }

  // Flatten the MCAO data object (for nested fields like Valuations_0_TaxYear)
  const flattenedMCAO = flattenObject(mcao)

  // Log first property (Subject Property) to debug
  if (row.number === 2) {
    console.log(`${LOG_PREFIX} ========== ROW 2 (SUBJECT PROPERTY) DEBUG ==========`)
    console.log(`${LOG_PREFIX} Item Label: ${property.itemLabel}`)
    console.log(`${LOG_PREFIX} Address: ${fullAddress}`)
    console.log(`${LOG_PREFIX} Address type: ${typeof fullAddress}`)
    console.log(`${LOG_PREFIX} APN: ${property.apn}`)
    console.log(`${LOG_PREFIX} Has MCAO data: ${property.hasMCAOData}`)

    // Log raw MCAO data structure BEFORE flattening
    if (mcao) {
      const mcaoKeys = Object.keys(mcao)
      console.log(`${LOG_PREFIX} Raw MCAO data has ${mcaoKeys.length} top-level keys`)
      console.log(`${LOG_PREFIX} Raw MCAO keys (first 20):`, mcaoKeys.slice(0, 20))

      // Count non-null values in raw MCAO data
      const nonNullCount = mcaoKeys.filter(key => {
        const value = mcao[key]
        return value !== null && value !== undefined && value !== ''
      }).length
      console.log(`${LOG_PREFIX} Raw MCAO has ${nonNullCount} non-null/non-empty values`)
    } else {
      console.error(`${LOG_PREFIX} ⚠️  WARNING: mcao is ${mcao}!`)
    }

    // Log flattened data
    console.log(`${LOG_PREFIX} Flattened MCAO fields: ${Object.keys(flattenedMCAO).length}`)
    console.log(`${LOG_PREFIX} First 30 flattened keys:`, Object.keys(flattenedMCAO).slice(0, 30))

    // Check specific important fields
    const importantFields = [
      'apn', 'propertyAddress_fullAddress', 'bedrooms', 'bathrooms',
      'improvementSize', 'lotSize', 'yearBuilt', 'propertyType',
      'Owner_SalePrice', 'Owner_SaleDate'
    ]
    console.log(`${LOG_PREFIX} Important fields status:`)
    importantFields.forEach(field => {
      const value = flattenedMCAO[field]
      const status = value !== undefined && value !== null && value !== '' ? '✓' : '✗'
      console.log(`  ${status} ${field}: ${value === undefined ? 'undefined' : value === null ? 'null' : value === '' ? 'empty' : value}`)
    })

    // Log raw propertyAddress to see if it's an object
    if (mcao?.propertyAddress) {
      console.log(`${LOG_PREFIX} propertyAddress type: ${typeof mcao.propertyAddress}`)
      console.log(`${LOG_PREFIX} propertyAddress.fullAddress type: ${typeof mcao.propertyAddress.fullAddress}`)
      if (typeof mcao.propertyAddress.fullAddress === 'object') {
        console.error(`${LOG_PREFIX} ⚠️  WARNING: propertyAddress.fullAddress is an OBJECT:`, mcao.propertyAddress.fullAddress)
      }
    }

    console.log(`${LOG_PREFIX} ====================================================`)
  }

  // Iterate through each template column and populate if we have matching data
  templateHeaders.forEach((header, index) => {
    const colNumber = index + 1
    const headerLower = header.toLowerCase().trim()

    // Column A (1): FULL_ADDRESS
    if (colNumber === 1 || headerLower === 'full_address' || headerLower.includes('full address')) {
      row.getCell(colNumber).value = fullAddress
      return
    }

    // Column B (2): Item - Source label
    if (colNumber === 2 || headerLower.includes('item')) {
      row.getCell(colNumber).value = property.itemLabel
      return
    }

    // Column C (3): APN
    if (colNumber === 3 || headerLower === 'apn') {
      row.getCell(colNumber).value = property.apn || ''
      return
    }

    // Columns D+ (4+): Try to match MCAO API data
    let value = flattenedMCAO[header]

    // If no exact match, try case-insensitive match
    if (value === undefined || value === null || value === '') {
      const matchingKey = Object.keys(flattenedMCAO).find(key =>
        key.toLowerCase().replace(/[^a-z0-9]/g, '') === headerLower.replace(/[^a-z0-9]/g, '')
      )
      if (matchingKey) {
        value = flattenedMCAO[matchingKey]
      }
    }

    // Set the value if we found it
    if (value !== undefined && value !== null && value !== '') {
      // CRITICAL: Sanitize value to prevent Excel corruption
      // Only write primitive types (string, number, boolean, Date)
      let sanitizedValue: string | number | boolean | Date

      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        sanitizedValue = value
      } else if (value instanceof Date) {
        sanitizedValue = value
      } else if (typeof value === 'object' && value !== null) {
        // Convert objects to JSON string to prevent corruption
        sanitizedValue = JSON.stringify(value)
      } else {
        // Convert anything else to string
        sanitizedValue = String(value)
      }

      row.getCell(colNumber).value = sanitizedValue

      // Log first few successful matches for debugging
      if (row.number === 2 && colNumber <= 15) {
        console.log(`${LOG_PREFIX} [DEBUG] Column ${colNumber} (${header}): ${sanitizedValue}`)
      }
    }
  })
}

/**
 * Build full address from MLS raw data
 * Used for both APN lookups and Full-MCAO-API display
 */
function buildFullAddress(rawData: any, fallback: string): string {
  if (!rawData) return fallback

  // Try to build from MLS components (matches Analysis sheet FULL_ADDRESS format)
  const parts: string[] = []

  if (rawData['House Number']) parts.push(rawData['House Number'])
  if (rawData['Building Number']) parts.push(rawData['Building Number'])
  if (rawData['Compass']) parts.push(rawData['Compass'])
  if (rawData['Street Name']) parts.push(rawData['Street Name'])
  if (rawData['Unit #']) parts.push(rawData['Unit #'])
  if (rawData['St Dir Sfx']) parts.push(rawData['St Dir Sfx'])
  if (rawData['St Suffix']) parts.push(rawData['St Suffix'])

  const street = parts.filter(Boolean).join(' ').trim()

  if (street) {
    const city = rawData['City/Town Code'] || ''
    const state = rawData['State/Province'] || 'AZ'
    const zip = rawData['Zip Code'] || ''

    // Format: "4620 N 68TH ST 155, Scottsdale, AZ 85251"
    return `${street}, ${city}, ${state} ${zip}`.trim()
  }

  return fallback
}

/**
 * Flatten nested object to match MCAO template columns
 * Example: { assessedValue: { total: 100000 } } => { 'assessedValue_total': 100000 }
 * CRITICAL: Only store primitive values to prevent Excel corruption
 */
function flattenObject(obj: any, prefix = '', result: any = {}): any {
  // Prevent circular references and excessive depth
  if (prefix.split('_').length > 10) {
    console.warn(`${LOG_PREFIX} Skipping deeply nested key: ${prefix}`)
    return result
  }

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key]
      const newKey = prefix ? `${prefix}_${key}` : key

      // Skip if value is undefined, null, or empty string
      if (value === undefined || value === null || value === '') {
        continue
      }

      // Handle different value types
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        // Primitive - safe to store
        result[newKey] = value
      } else if (value instanceof Date) {
        // Date - safe to store
        result[newKey] = value
      } else if (Array.isArray(value)) {
        // Flatten array elements (e.g., Valuations_0_, Valuations_1_)
        value.forEach((item, index) => {
          if (item !== null && typeof item === 'object' && !(item instanceof Date)) {
            flattenObject(item, `${newKey}_${index}`, result)
          } else if (item !== undefined && item !== null && item !== '') {
            // Only store primitive array items
            result[`${newKey}_${index}`] = item
          }
        })
      } else if (typeof value === 'object') {
        // Try to convert to string first to check if it's serializable
        try {
          const jsonStr = JSON.stringify(value)
          // If it's a simple object, flatten it
          if (jsonStr.length < 1000) {
            flattenObject(value, newKey, result)
          } else {
            console.warn(`${LOG_PREFIX} Skipping large object at key: ${newKey}`)
          }
        } catch (err) {
          // Circular reference or non-serializable object
          console.warn(`${LOG_PREFIX} Skipping non-serializable object at key: ${newKey}`)
        }
      }
    }
  }
  return result
}

/**
 * Apply consistent formatting to MLS sheets
 * Ensures dates, prices, and numbers are formatted uniformly
 */
function formatMLSSheet(sheet: ExcelJS.Worksheet, type: 'Resi' | 'Lease'): void {
  console.log(`${LOG_PREFIX} Applying consistent formatting to MLS-${type}-Comps sheet`)

  // Get header row to identify columns
  const headerRow = sheet.getRow(1)
  const headers: { [colLetter: string]: string } = {}

  headerRow.eachCell((cell, colNumber) => {
    const colLetter = sheet.getColumn(colNumber).letter
    headers[colLetter] = cell.value?.toString().toLowerCase() || ''
  })

  // Apply formatting to all data rows
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return // Skip header row

    row.eachCell((cell, colNumber) => {
      const colLetter = sheet.getColumn(colNumber).letter
      const header = headers[colLetter]

      if (!header || !cell.value) return

      // DATE COLUMNS - Format as m/d/yy (e.g., 4/29/25)
      if (
        header.includes('date') ||
        header.includes('list date') ||
        header.includes('close of escrow') ||
        header.includes('cancel') ||
        header.includes('under contract')
      ) {
        cell.numFmt = 'm/d/yy'
      }

      // PRICE/CURRENCY COLUMNS - Format as currency with no decimals
      else if (
        header.includes('price') ||
        header.includes('sold') ||
        header.includes('list price') ||
        header.includes('original list')
      ) {
        if (typeof cell.value === 'number') {
          cell.numFmt = '$#,##0'
        }
      }

      // NUMBER COLUMNS - Format as whole numbers with commas
      else if (
        header.includes('sqft') ||
        header.includes('square') ||
        header.includes('lot') ||
        header.includes('acreage') ||
        header.includes('bedroom') ||
        header.includes('bathroom') ||
        header.includes('bath') ||
        header.includes('year built')
      ) {
        if (typeof cell.value === 'number') {
          // Bathrooms can have .5, others should be whole
          if (header.includes('bathroom') || header.includes('bath')) {
            cell.numFmt = '0.#' // Shows 2.5 or 2 (not 2.0)
          } else {
            // Round to whole number and format with commas
            cell.value = Math.round(cell.value as number)
            cell.numFmt = '#,##0' // Whole numbers with commas
          }
        }
      }
    })
  })

  console.log(`${LOG_PREFIX} Formatting complete for MLS-${type}-Comps sheet`)
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
