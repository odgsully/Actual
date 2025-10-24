/**
 * Analysis Sheet Generator
 *
 * Generates the 40-column Analysis sheet per REPORTIT_FIELD_MAPPING.md specification
 * Combines MLS and MCAO data with proper field priority logic
 */

import ExcelJS from 'exceljs'
import type { MCAOApiResponse } from '@/lib/types/mcao-data'

const LOG_PREFIX = '[Analysis Generator]'

export interface PropertyDataForAnalysis {
  itemLabel: string // "Residential 1.5 Mile Comps", etc.
  mlsData?: any
  mcaoData?: MCAOApiResponse
  address: string
}

/**
 * Column definitions for Analysis sheet (40 columns A-AO)
 */
const ANALYSIS_COLUMNS = {
  // Column A
  ITEM: 'A',

  // Columns B-AO (from REPORTIT_FIELD_MAPPING.md)
  FULL_ADDRESS: 'B',
  APN: 'C',
  STATUS: 'D',
  OG_LIST_DATE: 'E',
  OG_LIST_PRICE: 'F',
  SALE_DATE: 'G',
  SALE_PRICE: 'H',
  SELLER_BASIS: 'I',
  SELLER_BASIS_DATE: 'J',
  BR: 'K',
  BA: 'L',
  SQFT: 'M',
  LOT_SIZE: 'N',
  MLS_MCAO_DISCREPENCY_CONCAT: 'O',
  IS_RENTAL: 'P',
  AGENCY_PHONE: 'Q',
  RENOVATE_SCORE: 'R', // MANUAL
  PROPERTY_RADAR_COMP_YN: 'S', // MANUAL
  IN_MLS: 'T',
  IN_MCAO: 'U',
  CANCEL_DATE: 'V',
  UC_DATE: 'W',
  LAT: 'X',
  LON: 'Y',
  YEAR_BUILT: 'Z',
  DAYS_ON_MARKET: 'AA',
  DWELLING_TYPE: 'AB',
  SUBDIVISION_NAME: 'AC',
  // Property Radar columns (AD-AO) removed - now in separate PropertyRadar template
} as const

/**
 * Build index of MLS sheet data
 * Returns array of row data objects with their row numbers
 */
function buildMLSDataIndex(
  mlsResiSheet: ExcelJS.Worksheet | undefined,
  mlsLeaseSheet: ExcelJS.Worksheet | undefined
): any[] {
  const index: any[] = []

  // Helper to read a sheet into index
  const readSheet = (sheet: ExcelJS.Worksheet | undefined) => {
    if (!sheet) return

    // Get headers from row 1
    const headers: string[] = []
    const headerRow = sheet.getRow(1)
    headerRow.eachCell((cell, colNumber) => {
      headers[colNumber - 1] = cell.value?.toString() || ''
    })

    // Read data rows (starting from row 2)
    for (let rowNum = 2; rowNum <= sheet.rowCount; rowNum++) {
      const row = sheet.getRow(rowNum)
      const rowData: any = {
        _rowNumber: rowNum,
        _sheetName: sheet.name,
      }

      // Map each cell to header name
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1]
        if (header) {
          rowData[header] = cell.value
        }
      })

      // Only add if row has data (check if Item column exists)
      if (rowData['Item']) {
        index.push(rowData)
      }
    }
  }

  readSheet(mlsResiSheet)
  readSheet(mlsLeaseSheet)

  console.log(`${LOG_PREFIX} Built MLS data index with ${index.length} rows`)
  return index
}

/**
 * Find MLS data for a property from the index
 * Uses Item label and index within that label group to match
 */
function findMLSDataForProperty(
  property: PropertyDataForAnalysis,
  mlsDataIndex: any[],
  labelIndexWithinGroup: number
): any {
  // For Subject Property, we don't have MLS data
  if (property.itemLabel === 'Subject Property') {
    return {}
  }

  // Filter by Item label
  const matchingItems = mlsDataIndex.filter(
    (item) => item.Item === property.itemLabel
  )

  if (matchingItems.length === 0) {
    console.warn(`${LOG_PREFIX} No MLS data found for: ${property.itemLabel}`)
    return {}
  }

  // Get the item at the specific index within this label group
  if (labelIndexWithinGroup >= 0 && labelIndexWithinGroup < matchingItems.length) {
    const foundData = matchingItems[labelIndexWithinGroup]
    console.log(
      `${LOG_PREFIX} Matched property #${labelIndexWithinGroup} of "${property.itemLabel}" to row ${foundData._rowNumber} in ${foundData._sheetName}`
    )
    return foundData
  }

  // If index out of bounds, warn and return empty
  console.warn(
    `${LOG_PREFIX} Index ${labelIndexWithinGroup} out of bounds for "${property.itemLabel}" (found ${matchingItems.length} matches)`
  )
  return {}
}

/**
 * Generate Analysis sheet with 40 columns
 * Reads data from MLS-Resi-Comps and MLS-Lease-Comps sheets
 */
export async function generateAnalysisSheet(
  workbook: ExcelJS.Workbook,
  properties: PropertyDataForAnalysis[]
): Promise<void> {
  console.log(`${LOG_PREFIX} Generating Analysis sheet for ${properties.length} properties`)

  // Get MLS sheets
  const mlsResiSheet = workbook.getWorksheet('MLS-Resi-Comps')
  const mlsLeaseSheet = workbook.getWorksheet('MLS-Lease-Comps')

  // Build index of MLS sheet data by Item label
  const mlsDataIndex = buildMLSDataIndex(mlsResiSheet, mlsLeaseSheet)

  // Create or get Analysis sheet
  let sheet = workbook.getWorksheet('Analysis')
  if (!sheet) {
    sheet = workbook.addWorksheet('Analysis')
  } else {
    // Clear existing data
    sheet.spliceRows(1, sheet.rowCount)
  }

  // Add header row
  addHeaderRow(sheet)

  // Track counters per item label for matching
  const labelCounters: Record<string, number> = {}

  // Add data rows
  properties.forEach((property, index) => {
    const rowNumber = index + 2 // Row 1 is header

    // Initialize counter for this label if not exists
    if (!labelCounters[property.itemLabel]) {
      labelCounters[property.itemLabel] = 0
    }

    // Find corresponding MLS data from sheets
    const mlsDataFromSheet = findMLSDataForProperty(
      property,
      mlsDataIndex,
      labelCounters[property.itemLabel]
    )

    // Increment counter for this label
    labelCounters[property.itemLabel]++

    addPropertyRow(sheet, rowNumber, property, mlsDataFromSheet)
  })

  // Format columns
  formatAnalysisSheet(sheet)

  console.log(`${LOG_PREFIX} Analysis sheet generated with ${properties.length} properties`)
}

/**
 * Add header row to Analysis sheet
 */
function addHeaderRow(sheet: ExcelJS.Worksheet): void {
  const headers = [
    'Item',                               // A
    'FULL_ADDRESS',                       // B
    'APN',                                // C
    'STATUS',                             // D
    'OG_LIST_DATE',                       // E
    'OG_LIST_PRICE',                      // F
    'SALE_DATE',                          // G
    'SALE_PRICE',                         // H
    'SELLER_BASIS',                       // I
    'SELLER_BASIS_DATE',                  // J
    'BR',                                 // K
    'BA',                                 // L
    'SQFT',                               // M
    'LOT_SIZE',                           // N
    'MLS_MCAO_DISCREPENCY_CONCAT',        // O
    'IS_RENTAL',                          // P
    'AGENCY_PHONE',                       // Q
    'RENOVATE_SCORE',                     // R
    'PROPERTY_RADAR-COMP-Y-N',            // S
    'IN_MLS?',                            // T
    'IN_MCAO?',                           // U
    'CANCEL_DATE',                        // V
    'UC_DATE',                            // W
    'LAT',                                // X
    'LON',                                // Y
    'YEAR_BUILT',                         // Z
    'DAYS_ON_MARKET',                     // AA
    'DWELLING_TYPE',                      // AB
    'SUBDIVISION_NAME',                   // AC
    // Property Radar columns removed - now in separate PropertyRadar template
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
 * Add property data row
 * NOTE: Now reads from MLS sheets in workbook instead of rawData
 */
function addPropertyRow(
  sheet: ExcelJS.Worksheet,
  rowNumber: number,
  property: PropertyDataForAnalysis,
  mlsDataFromSheet: any
): void {
  const row = sheet.getRow(rowNumber)
  const mls = property.mlsData
  const mcao = property.mcaoData

  // Get data from MLS sheet (already populated in workbook)
  const rawData = mlsDataFromSheet || {}

  // Column A: Item (origin label)
  row.getCell(ANALYSIS_COLUMNS.ITEM).value = property.itemLabel

  // Column B: FULL_ADDRESS (MCAO preferred, fallback to MLS)
  row.getCell(ANALYSIS_COLUMNS.FULL_ADDRESS).value =
    mcao?.propertyAddress?.fullAddress ||
    property.address ||
    'N/A'

  // Column C: APN (MCAO or MLS)
  row.getCell(ANALYSIS_COLUMNS.APN).value = mcao?.apn || rawData['Assessor Number'] || 'N/A'

  // Column D: STATUS (MLS CSV field)
  row.getCell(ANALYSIS_COLUMNS.STATUS).value = rawData['Status'] || 'N/A'

  // Column E: OG_LIST_DATE (MLS CSV field "List Date")
  row.getCell(ANALYSIS_COLUMNS.OG_LIST_DATE).value = rawData['List Date'] || ''

  // Column F: OG_LIST_PRICE (MLS CSV field "Original List Price" or "List Price")
  row.getCell(ANALYSIS_COLUMNS.OG_LIST_PRICE).value = rawData['Original List Price'] || rawData['List Price'] || ''

  // Column G: SALE_DATE (MLS CSV field "Close of Escrow Date" - only if status = 'C')
  const status = rawData['Status']
  row.getCell(ANALYSIS_COLUMNS.SALE_DATE).value =
    (status === 'C' || status === 'Closed') ? (rawData['Close of Escrow Date'] || '') : ''

  // Column H: SALE_PRICE (MLS CSV field "Sold Price")
  row.getCell(ANALYSIS_COLUMNS.SALE_PRICE).value = rawData['Sold Price'] || ''

  // Column I: SELLER_BASIS (MCAO - last sale price)
  row.getCell(ANALYSIS_COLUMNS.SELLER_BASIS).value =
    mcao?.salesHistory?.[0]?.salePrice || ''

  // Column J: SELLER_BASIS_DATE (MCAO - last sale date)
  row.getCell(ANALYSIS_COLUMNS.SELLER_BASIS_DATE).value =
    mcao?.salesHistory?.[0]?.saleDate || ''

  // Column K: BR (MLS CSV field "# Bedrooms")
  row.getCell(ANALYSIS_COLUMNS.BR).value = rawData['# Bedrooms'] || mcao?.bedrooms || ''

  // Column L: BA (MLS CSV field "Total Bathrooms")
  row.getCell(ANALYSIS_COLUMNS.BA).value = rawData['Total Bathrooms'] || mcao?.bathrooms || ''

  // Column M: SQFT (MLS CSV field "Approx SQFT", fallback to MCAO)
  const mlsSqft = rawData['Approx SQFT']
  const mcaoSqft = mcao?.improvementSize
  const sqft = mlsSqft || mcaoSqft || ''
  row.getCell(ANALYSIS_COLUMNS.SQFT).value = sqft

  // Column N: LOT_SIZE (MCAO or MLS "Approx Lot SqFt")
  row.getCell(ANALYSIS_COLUMNS.LOT_SIZE).value = mcao?.lotSize || rawData['Approx Lot SqFt'] || ''

  // Column O: MLS_MCAO_DISCREPENCY_CONCAT (CALCULATED)
  row.getCell(ANALYSIS_COLUMNS.MLS_MCAO_DISCREPENCY_CONCAT).value =
    calculateDiscrepancy(mlsSqft, mcaoSqft)

  // Column P: IS_RENTAL (MCAO)
  row.getCell(ANALYSIS_COLUMNS.IS_RENTAL).value = 'N' // Default, could check property type

  // Column Q: AGENCY_PHONE (MLS CSV field "Agency Phone")
  row.getCell(ANALYSIS_COLUMNS.AGENCY_PHONE).value = rawData['Agency Phone'] || 'N/A'

  // Column R: RENOVATE_SCORE (MANUAL - leave blank)
  row.getCell(ANALYSIS_COLUMNS.RENOVATE_SCORE).value = ''

  // Column S: PROPERTY_RADAR-COMP-Y-N (MANUAL - leave blank)
  row.getCell(ANALYSIS_COLUMNS.PROPERTY_RADAR_COMP_YN).value = ''

  // Column T: IN_MLS? (CALCULATED)
  row.getCell(ANALYSIS_COLUMNS.IN_MLS).value = mls ? 'Y' : 'N'

  // Column U: IN_MCAO? (CALCULATED)
  row.getCell(ANALYSIS_COLUMNS.IN_MCAO).value = mcao ? 'Y' : 'N'

  // Column V: CANCEL_DATE (MLS CSV field "Cancel Date")
  row.getCell(ANALYSIS_COLUMNS.CANCEL_DATE).value = rawData['Cancel Date'] || ''

  // Column W: UC_DATE (MLS CSV field "Under Contract Date")
  row.getCell(ANALYSIS_COLUMNS.UC_DATE).value = rawData['Under Contract Date'] || ''

  // Column X: LAT (MLS CSV field "Geo Lat", fallback to MCAO)
  row.getCell(ANALYSIS_COLUMNS.LAT).value =
    rawData['Geo Lat'] || mcao?.propertyAddress?.latitude || 'N/A'

  // Column Y: LON (MLS CSV field "Geo Lon", fallback to MCAO)
  row.getCell(ANALYSIS_COLUMNS.LON).value =
    rawData['Geo Lon'] || mcao?.propertyAddress?.longitude || 'N/A'

  // Column Z: YEAR_BUILT (MLS CSV field "Year Built", fallback to MCAO)
  row.getCell(ANALYSIS_COLUMNS.YEAR_BUILT).value = rawData['Year Built'] || mcao?.yearBuilt || 'N/A'

  // Column AA: DAYS_ON_MARKET (MLS CSV field "Days on Market")
  row.getCell(ANALYSIS_COLUMNS.DAYS_ON_MARKET).value = rawData['Days on Market'] || ''

  // Column AB: DWELLING_TYPE (MLS CSV field "Dwelling Type", fallback to MCAO)
  row.getCell(ANALYSIS_COLUMNS.DWELLING_TYPE).value = rawData['Dwelling Type'] || mcao?.propertyType || 'N/A'

  // Column AC: SUBDIVISION_NAME (MLS CSV field "Subdivision", fallback to MCAO)
  row.getCell(ANALYSIS_COLUMNS.SUBDIVISION_NAME).value = rawData['Subdivision'] || mcao?.subdivision || 'N/A'

  // Columns AD-AO removed - now in separate PropertyRadar template
}

/**
 * Calculate square footage discrepancy
 */
function calculateDiscrepancy(mlsSqft: number | undefined, mcaoSqft: number | undefined): string {
  if (!mlsSqft || !mcaoSqft) return ''

  const difference = Math.abs(mlsSqft - mcaoSqft)
  const percentDiff = (difference / mlsSqft) * 100

  if (percentDiff > 5) {
    return `SQFT_VARIANCE_${percentDiff.toFixed(1)}%`
  }

  return ''
}

/**
 * Format Analysis sheet columns
 */
function formatAnalysisSheet(sheet: ExcelJS.Worksheet): void {
  // Set column widths
  sheet.columns = [
    { width: 35 },  // A - Item
    { width: 30 },  // B - FULL_ADDRESS
    { width: 15 },  // C - APN
    { width: 10 },  // D - STATUS
    { width: 12 },  // E - OG_LIST_DATE
    { width: 12 },  // F - OG_LIST_PRICE
    { width: 12 },  // G - SALE_DATE
    { width: 12 },  // H - SALE_PRICE
    { width: 12 },  // I - SELLER_BASIS
    { width: 15 },  // J - SELLER_BASIS_DATE
    { width: 8 },   // K - BR
    { width: 8 },   // L - BA
    { width: 10 },  // M - SQFT
    { width: 12 },  // N - LOT_SIZE
    { width: 20 },  // O - DISCREPENCY
    { width: 10 },  // P - IS_RENTAL
    { width: 15 },  // Q - AGENCY_PHONE
    { width: 15 },  // R - RENOVATE_SCORE
    { width: 15 },  // S - PR_COMP_YN
    { width: 10 },  // T - IN_MLS
    { width: 10 },  // U - IN_MCAO
    { width: 12 },  // V - CANCEL_DATE
    { width: 12 },  // W - UC_DATE
    { width: 12 },  // X - LAT
    { width: 12 },  // Y - LON
    { width: 10 },  // Z - YEAR_BUILT
    { width: 12 },  // AA - DAYS_ON_MARKET
    { width: 15 },  // AB - DWELLING_TYPE
    { width: 20 },  // AC - SUBDIVISION_NAME
    // Property Radar columns removed - now in separate PropertyRadar template
  ]
}
