/**
 * Analysis Sheet Generator
 *
 * Generates the 40-column Analysis sheet per REPORTIT_FIELD_MAPPING.md specification
 * Combines MLS and MCAO data with proper field priority logic
 */

import ExcelJS from 'exceljs'
import type { MCAOApiResponse } from '@/lib/types/mcao-data'

const LOG_PREFIX = '[Analysis Generator]'

/**
 * Type Conversion Helpers - Ensure proper Excel data types
 * These functions convert string values from CSV to proper number/date types
 * so Excel numFmt formatting works correctly
 */

/**
 * Parse date value to Excel-compatible format
 * Handles: "2025-10-25", "10/25/2025", Excel serial numbers, Date objects
 * Returns: Date object or empty string
 */
function parseExcelDate(value: any): Date | string {
  if (!value || value === '') return ''

  // If already a Date object, return as-is
  if (value instanceof Date) return value

  // If it's a number (Excel serial date), convert to Date
  if (typeof value === 'number') {
    // Excel serial date (days since 1900-01-01, with 1900 leap year bug)
    const excelEpoch = new Date(1899, 11, 30) // December 30, 1899
    return new Date(excelEpoch.getTime() + value * 86400000)
  }

  // If it's a string, try to parse it
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return ''

    // Try parsing as ISO date or common formats
    const parsed = new Date(trimmed)
    if (!isNaN(parsed.getTime())) {
      return parsed
    }
  }

  return ''
}

/**
 * Parse number value to whole integer (no decimals)
 * Used for: prices, SQFT, lot size
 * Returns: Rounded integer or empty string
 */
function parseWholeNumber(value: any): number | string {
  if (value === null || value === undefined || value === '') return ''

  // If already a number, round and return
  if (typeof value === 'number') {
    return Math.round(value)
  }

  // If it's a string, parse and round
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return ''

    // Remove currency symbols, commas, etc.
    const cleaned = trimmed.replace(/[$,]/g, '')
    const parsed = parseFloat(cleaned)

    if (!isNaN(parsed)) {
      return Math.round(parsed)
    }
  }

  return ''
}

/**
 * Parse number value keeping decimals (for bathrooms)
 * Rounds to nearest 0.5 (e.g., 2.3 → 2.5, 2.7 → 3.0)
 * Returns: Number with .0 or .5 decimal, or empty string
 */
function parseDecimalNumber(value: any, allowHalf: boolean = true): number | string {
  if (value === null || value === undefined || value === '') return ''

  // If already a number
  if (typeof value === 'number') {
    if (allowHalf) {
      // Round to nearest 0.5
      return Math.round(value * 2) / 2
    }
    return value
  }

  // If it's a string, parse it
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return ''

    const parsed = parseFloat(trimmed)

    if (!isNaN(parsed)) {
      if (allowHalf) {
        // Round to nearest 0.5
        return Math.round(parsed * 2) / 2
      }
      return parsed
    }
  }

  return ''
}

export interface PropertyDataForAnalysis {
  itemLabel: string // "Residential 1.5 Mile Comps", etc.
  mlsData?: any
  mcaoData?: MCAOApiResponse
  address: string
  apn?: string // APN for the property
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
  properties: PropertyDataForAnalysis[],
  subjectManualInputs?: {
    bedrooms?: number
    bathrooms?: number
    latitude?: number
    longitude?: number
    fullAddress?: string
    dwellingType?: string
    yearBuilt?: number
  }
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

    // For Subject Property (Row 2), pass manual inputs
    const isSubjectProperty = property.itemLabel === 'Subject Property'
    addPropertyRow(sheet, rowNumber, property, mlsDataFromSheet, isSubjectProperty ? subjectManualInputs : undefined)
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
  mlsDataFromSheet: any,
  manualInputs?: {
    bedrooms?: number
    bathrooms?: number
    latitude?: number
    longitude?: number
    fullAddress?: string
    dwellingType?: string
    yearBuilt?: number
  }
): void {
  const row = sheet.getRow(rowNumber)
  const mls = property.mlsData
  const mcao = property.mcaoData

  // Get data from MLS sheet (already populated in workbook)
  const rawData = mlsDataFromSheet || {}

  // Column A: Item (origin label)
  row.getCell(ANALYSIS_COLUMNS.ITEM).value = property.itemLabel

  // Column B: FULL_ADDRESS - For Subject Property, use manual input first
  if (property.itemLabel === 'Subject Property' && manualInputs?.fullAddress) {
    row.getCell(ANALYSIS_COLUMNS.FULL_ADDRESS).value = manualInputs.fullAddress
  } else {
    row.getCell(ANALYSIS_COLUMNS.FULL_ADDRESS).value =
      mcao?.propertyAddress?.fullAddress ||
      property.address ||
      'Subject Property'
  }

  // Column C: APN (property.apn for Subject Property, then MCAO or MLS)
  row.getCell(ANALYSIS_COLUMNS.APN).value = property.apn || mcao?.apn || rawData['Assessor Number'] || 'N/A'

  // Column D: STATUS (MLS CSV field)
  row.getCell(ANALYSIS_COLUMNS.STATUS).value = rawData['Status'] || 'N/A'

  // Column E: OG_LIST_DATE (MLS CSV field "List Date")
  row.getCell(ANALYSIS_COLUMNS.OG_LIST_DATE).value = parseExcelDate(rawData['List Date'])

  // Column F: OG_LIST_PRICE (MLS CSV field "Original List Price" or "List Price")
  row.getCell(ANALYSIS_COLUMNS.OG_LIST_PRICE).value = parseWholeNumber(
    rawData['Original List Price'] || rawData['List Price']
  )

  // Column G: SALE_DATE (MLS CSV field "Close of Escrow Date" - only if status = 'C')
  const status = rawData['Status']
  row.getCell(ANALYSIS_COLUMNS.SALE_DATE).value =
    (status === 'C' || status === 'Closed') ? parseExcelDate(rawData['Close of Escrow Date']) : ''

  // Column H: SALE_PRICE (MLS CSV field "Sold Price")
  row.getCell(ANALYSIS_COLUMNS.SALE_PRICE).value = parseWholeNumber(rawData['Sold Price'])

  // Column I: SELLER_BASIS (MCAO - Owner_SalePrice from Full-MCAO-API)
  // This comes from the flattened MCAO data column AG 'Owner_SalePrice'
  const mcaoFlattened = mcao ? flattenObject(mcao) : {}
  row.getCell(ANALYSIS_COLUMNS.SELLER_BASIS).value = parseWholeNumber(
    (mcaoFlattened as any)['Owner_SalePrice'] ||
    (mcaoFlattened as any)['owner_saleprice'] ||
    mcao?.salesHistory?.[0]?.salePrice
  )

  // Column J: SELLER_BASIS_DATE (MCAO - Owner_SaleDate from Full-MCAO-API)
  // This comes from the flattened MCAO data column AH 'Owner_SaleDate'
  row.getCell(ANALYSIS_COLUMNS.SELLER_BASIS_DATE).value = parseExcelDate(
    (mcaoFlattened as any)['Owner_SaleDate'] ||
    (mcaoFlattened as any)['owner_saledate'] ||
    mcao?.salesHistory?.[0]?.saleDate
  )

  // Column K: BR - For Subject Property, use manual input first
  if (manualInputs?.bedrooms !== undefined) {
    row.getCell(ANALYSIS_COLUMNS.BR).value = manualInputs.bedrooms
  } else {
    row.getCell(ANALYSIS_COLUMNS.BR).value = rawData['# Bedrooms'] || mcao?.bedrooms || ''
  }

  // Column L: BA - For Subject Property, use manual input first
  if (manualInputs?.bathrooms !== undefined) {
    row.getCell(ANALYSIS_COLUMNS.BA).value = parseDecimalNumber(manualInputs.bathrooms)
  } else {
    row.getCell(ANALYSIS_COLUMNS.BA).value = parseDecimalNumber(rawData['Total Bathrooms'] || mcao?.bathrooms)
  }

  // Column M: SQFT - For Subject Property, use specific MCAO field ResidentialPropertyData_LivableSpace
  const mlsSqft = rawData['Approx SQFT']
  let mcaoSqft = mcao?.improvementSize
  if (property.itemLabel === 'Subject Property') {
    // For subject property, use ResidentialPropertyData_LivableSpace from flattened MCAO
    const mcaoFlattened = mcao ? flattenObject(mcao) : {}
    mcaoSqft = (mcaoFlattened as any)['ResidentialPropertyData_LivableSpace'] || mcao?.improvementSize
  }
  const sqft = mlsSqft || mcaoSqft
  row.getCell(ANALYSIS_COLUMNS.SQFT).value = parseWholeNumber(sqft)

  // Column N: LOT_SIZE - For Subject Property, use specific MCAO field
  if (property.itemLabel === 'Subject Property') {
    // For subject property, use LotSize field (should be at top level or in flattened data)
    row.getCell(ANALYSIS_COLUMNS.LOT_SIZE).value = parseWholeNumber(
      mcao?.lotSize || (mcao as any)?.LotSize || rawData['Approx Lot SqFt']
    )
  } else {
    row.getCell(ANALYSIS_COLUMNS.LOT_SIZE).value = parseWholeNumber(
      mcao?.lotSize || rawData['Approx Lot SqFt']
    )
  }

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

  // Column V: CANCEL_DATE (MLS CSV field "Cancel Date" - column U in MLS sheets)
  row.getCell(ANALYSIS_COLUMNS.CANCEL_DATE).value =
    rawData['Cancel Date'] ||
    rawData['Cancellation Date'] ||
    rawData['Cancelled Date'] || ''

  // Column W: UC_DATE (MLS CSV field "Under Contract Date" - column P in MLS sheets)
  row.getCell(ANALYSIS_COLUMNS.UC_DATE).value = parseExcelDate(
    rawData['Under Contract Date'] ||
    rawData['UC Date'] ||
    rawData['Contract Date']
  )

  // Column X: LAT - For Subject Property, use manual input first
  if (manualInputs?.latitude !== undefined) {
    row.getCell(ANALYSIS_COLUMNS.LAT).value = manualInputs.latitude
  } else {
    row.getCell(ANALYSIS_COLUMNS.LAT).value =
      rawData['Geo Lat'] ||
      (mcaoFlattened as any)['latitude'] ||
      (mcaoFlattened as any)['Latitude'] || 'N/A'
  }

  // Column Y: LON - For Subject Property, use manual input first
  if (manualInputs?.longitude !== undefined) {
    row.getCell(ANALYSIS_COLUMNS.LON).value = manualInputs.longitude
  } else {
    row.getCell(ANALYSIS_COLUMNS.LON).value =
      rawData['Geo Lon'] ||
      (mcaoFlattened as any)['longitude'] ||
      (mcaoFlattened as any)['Longitude'] || 'N/A'
  }

  // Column Z: YEAR_BUILT - For Subject Property, use manual input first
  if (property.itemLabel === 'Subject Property') {
    if (manualInputs?.yearBuilt) {
      row.getCell(ANALYSIS_COLUMNS.YEAR_BUILT).value = manualInputs.yearBuilt
    } else {
      row.getCell(ANALYSIS_COLUMNS.YEAR_BUILT).value =
        (mcaoFlattened as any)['RentalInformation_YearBuilt'] ||
        rawData['Year Built'] ||
        mcao?.yearBuilt || 'N/A'
    }
  } else {
    row.getCell(ANALYSIS_COLUMNS.YEAR_BUILT).value = rawData['Year Built'] || mcao?.yearBuilt || 'N/A'
  }

  // Column AA: DAYS_ON_MARKET (MLS CSV field "Days on Market")
  row.getCell(ANALYSIS_COLUMNS.DAYS_ON_MARKET).value = rawData['Days on Market'] || ''

  // Column AB: DWELLING_TYPE - For Subject Property, use manual input first
  if (property.itemLabel === 'Subject Property') {
    if (manualInputs?.dwellingType) {
      row.getCell(ANALYSIS_COLUMNS.DWELLING_TYPE).value = manualInputs.dwellingType
    } else {
      row.getCell(ANALYSIS_COLUMNS.DWELLING_TYPE).value =
        mcao?.propertyType ||
        (mcao as any)?.PropertyType ||
        rawData['Dwelling Type'] || 'N/A'
    }
  } else {
    row.getCell(ANALYSIS_COLUMNS.DWELLING_TYPE).value = rawData['Dwelling Type'] || mcao?.propertyType || 'N/A'
  }

  // Column AC: SUBDIVISION_NAME - For Subject Property, use SubdivisionName
  if (property.itemLabel === 'Subject Property') {
    row.getCell(ANALYSIS_COLUMNS.SUBDIVISION_NAME).value =
      mcao?.subdivision ||
      (mcao as any)?.SubdivisionName ||
      (mcaoFlattened as any)['SubdivisionName'] ||
      rawData['Subdivision'] || 'N/A'
  } else {
    row.getCell(ANALYSIS_COLUMNS.SUBDIVISION_NAME).value = rawData['Subdivision'] || mcao?.subdivision || 'N/A'
  }

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
 * Flatten nested object to match MCAO template columns
 * Example: { assessedValue: { total: 100000 } } => { 'assessedValue_total': 100000 }
 */
function flattenObject(obj: any, prefix = '', result: any = {}): any {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key]
      const newKey = prefix ? `${prefix}_${key}` : key

      if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        // Recursively flatten nested objects
        flattenObject(value, newKey, result)
      } else if (Array.isArray(value)) {
        // Flatten array elements (e.g., Valuations_0_, Valuations_1_)
        value.forEach((item, index) => {
          if (item !== null && typeof item === 'object') {
            flattenObject(item, `${newKey}_${index}`, result)
          } else {
            result[`${newKey}_${index}`] = item
          }
        })
      } else {
        result[newKey] = value
      }
    }
  }
  return result
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

  // Apply consistent formatting for specific columns
  // Columns E:H (Dates and Prices) and L:N (Numbers) and J, W (Dates)
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return // Skip header row

    // Column E: OG_LIST_DATE - Date format (m/d/yy)
    const ogListDateCell = row.getCell('E')
    if (ogListDateCell.value) {
      ogListDateCell.numFmt = 'm/d/yy'
    }

    // Column F: OG_LIST_PRICE - Currency format, no decimals
    const ogListPriceCell = row.getCell('F')
    if (ogListPriceCell.value && typeof ogListPriceCell.value === 'number') {
      ogListPriceCell.numFmt = '$#,##0'
    }

    // Column G: SALE_DATE - Date format (m/d/yy)
    const saleDateCell = row.getCell('G')
    if (saleDateCell.value) {
      saleDateCell.numFmt = 'm/d/yy'
    }

    // Column H: SALE_PRICE - Currency format, no decimals
    const salePriceCell = row.getCell('H')
    if (salePriceCell.value && typeof salePriceCell.value === 'number') {
      salePriceCell.numFmt = '$#,##0'
    }

    // Column I: SELLER_BASIS - Accounting/Currency format, no decimals
    const sellerBasisCell = row.getCell('I')
    if (sellerBasisCell.value && typeof sellerBasisCell.value === 'number') {
      sellerBasisCell.numFmt = '$#,##0'
    }

    // Column J: SELLER_BASIS_DATE - Date format (m/d/yy)
    const sellerBasisDateCell = row.getCell('J')
    if (sellerBasisDateCell.value) {
      sellerBasisDateCell.numFmt = 'm/d/yy'
    }

    // Column L: BA (Bathrooms) - Number format, allows .5 but hides .0
    const baCell = row.getCell('L')
    if (baCell.value && typeof baCell.value === 'number') {
      baCell.numFmt = '0.##'  // Shows 2.5 as "2.5", 2.0 as "2" (no trailing decimal)
    }

    // Column M: SQFT - Number format, no decimals (whole numbers)
    const sqftCell = row.getCell('M')
    if (sqftCell.value && typeof sqftCell.value === 'number') {
      sqftCell.numFmt = '#,##0'
    }

    // Column N: LOT_SIZE - Number format, no decimals (whole numbers)
    const lotSizeCell = row.getCell('N')
    if (lotSizeCell.value && typeof lotSizeCell.value === 'number') {
      // Round to whole number and format with commas
      lotSizeCell.value = Math.round(lotSizeCell.value as number)
      lotSizeCell.numFmt = '#,##0'
    }

    // Column W: UC_DATE - Date format (m/d/yy)
    const ucDateCell = row.getCell('W')
    if (ucDateCell.value) {
      ucDateCell.numFmt = 'm/d/yy'
    }
  })
}
