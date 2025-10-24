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
  // Property Radar columns (AD-AO) - all MANUAL
  PR_COMP_1: 'AD',
  PR_COMP_2: 'AE',
  PR_COMP_3: 'AF',
  PR_COMP_4: 'AG',
  PR_COMP_5: 'AH',
  PR_COMP_6: 'AI',
  PR_COMP_7: 'AJ',
  PR_COMP_8: 'AK',
  PR_COMP_9: 'AL',
  PR_COMP_10: 'AM',
  PR_COMP_11: 'AN',
  PR_COMP_12: 'AO',
} as const

/**
 * Generate Analysis sheet with 40 columns
 */
export async function generateAnalysisSheet(
  workbook: ExcelJS.Workbook,
  properties: PropertyDataForAnalysis[]
): Promise<void> {
  console.log(`${LOG_PREFIX} Generating Analysis sheet for ${properties.length} properties`)

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

  // Add data rows
  properties.forEach((property, index) => {
    const rowNumber = index + 2 // Row 1 is header
    addPropertyRow(sheet, rowNumber, property)
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
    'Property-Radar-comp-1',              // AD
    'Property-Radar-comp-2',              // AE
    'Property-Radar-comp-3',              // AF
    'Property-Radar-comp-4',              // AG
    'Property-Radar-comp-5',              // AH
    'Property-Radar-comp-6',              // AI
    'Property-Radar-comp-7',              // AJ
    'Property-Radar-comp-8',              // AK
    'Property-Radar-comp-9',              // AL
    'Property-Radar-comp-10',             // AM
    'Property-Radar-comp-11',             // AN
    'Property-Radar-comp-12',             // AO
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
 */
function addPropertyRow(
  sheet: ExcelJS.Worksheet,
  rowNumber: number,
  property: PropertyDataForAnalysis
): void {
  const row = sheet.getRow(rowNumber)
  const mls = property.mlsData
  const mcao = property.mcaoData

  // Column A: Item (origin label)
  row.getCell(ANALYSIS_COLUMNS.ITEM).value = property.itemLabel

  // Column B: FULL_ADDRESS (MCAO preferred, fallback to MLS)
  row.getCell(ANALYSIS_COLUMNS.FULL_ADDRESS).value =
    mcao?.propertyAddress?.fullAddress ||
    property.address ||
    'N/A'

  // Column C: APN (MCAO)
  row.getCell(ANALYSIS_COLUMNS.APN).value = mcao?.apn || mls?.apn || 'N/A'

  // Column D: STATUS (MLS)
  row.getCell(ANALYSIS_COLUMNS.STATUS).value = mls?.status || 'N/A'

  // Column E: OG_LIST_DATE (MLS)
  row.getCell(ANALYSIS_COLUMNS.OG_LIST_DATE).value = mls?.listDate || 'N/A'

  // Column F: OG_LIST_PRICE (MLS)
  row.getCell(ANALYSIS_COLUMNS.OG_LIST_PRICE).value = mls?.price || mls?.listPrice || 'N/A'

  // Column G: SALE_DATE (MLS - only if status = 'C')
  row.getCell(ANALYSIS_COLUMNS.SALE_DATE).value =
    (mls?.status === 'C' || mls?.status === 'Closed') ? (mls?.soldDate || 'N/A') : 'N/A'

  // Column H: SALE_PRICE (MLS)
  row.getCell(ANALYSIS_COLUMNS.SALE_PRICE).value = mls?.salePrice || mls?.soldPrice || 'N/A'

  // Column I: SELLER_BASIS (MCAO)
  row.getCell(ANALYSIS_COLUMNS.SELLER_BASIS).value =
    mcao?.salesHistory?.[0]?.salePrice || 'N/A'

  // Column J: SELLER_BASIS_DATE (MCAO)
  row.getCell(ANALYSIS_COLUMNS.SELLER_BASIS_DATE).value =
    mcao?.salesHistory?.[0]?.saleDate || 'N/A'

  // Column K: BR (MLS)
  row.getCell(ANALYSIS_COLUMNS.BR).value = mls?.bedrooms || mcao?.bedrooms || 'N/A'

  // Column L: BA (MLS)
  row.getCell(ANALYSIS_COLUMNS.BA).value = mls?.bathrooms || mcao?.bathrooms || 'N/A'

  // Column M: SQFT (EITHER - MLS preferred, MCAO fallback)
  const mlsSqft = mls?.squareFeet || mls?.sqft
  const mcaoSqft = mcao?.improvementSize
  const sqft = mlsSqft || mcaoSqft || 'N/A'
  row.getCell(ANALYSIS_COLUMNS.SQFT).value = sqft

  // Column N: LOT_SIZE (MCAO)
  row.getCell(ANALYSIS_COLUMNS.LOT_SIZE).value = mcao?.lotSize || 'N/A'

  // Column O: MLS_MCAO_DISCREPENCY_CONCAT (CALCULATED)
  row.getCell(ANALYSIS_COLUMNS.MLS_MCAO_DISCREPENCY_CONCAT).value =
    calculateDiscrepancy(mlsSqft, mcaoSqft)

  // Column P: IS_RENTAL (MCAO)
  row.getCell(ANALYSIS_COLUMNS.IS_RENTAL).value = 'N' // Default, could check property type

  // Column Q: AGENCY_PHONE (MLS)
  row.getCell(ANALYSIS_COLUMNS.AGENCY_PHONE).value = mls?.agencyPhone || 'N/A'

  // Column R: RENOVATE_SCORE (MANUAL - leave blank)
  row.getCell(ANALYSIS_COLUMNS.RENOVATE_SCORE).value = ''

  // Column S: PROPERTY_RADAR-COMP-Y-N (MANUAL - leave blank)
  row.getCell(ANALYSIS_COLUMNS.PROPERTY_RADAR_COMP_YN).value = ''

  // Column T: IN_MLS? (CALCULATED)
  row.getCell(ANALYSIS_COLUMNS.IN_MLS).value = mls ? 'Y' : 'N'

  // Column U: IN_MCAO? (CALCULATED)
  row.getCell(ANALYSIS_COLUMNS.IN_MCAO).value = mcao ? 'Y' : 'N'

  // Column V: CANCEL_DATE (MLS)
  row.getCell(ANALYSIS_COLUMNS.CANCEL_DATE).value = mls?.cancelDate || 'N/A'

  // Column W: UC_DATE (MLS)
  row.getCell(ANALYSIS_COLUMNS.UC_DATE).value = mls?.underContractDate || 'N/A'

  // Column X: LAT (EITHER - MLS preferred, MCAO fallback)
  row.getCell(ANALYSIS_COLUMNS.LAT).value =
    mls?.latitude || mcao?.propertyAddress?.latitude || 'N/A'

  // Column Y: LON (EITHER - MLS preferred, MCAO fallback)
  row.getCell(ANALYSIS_COLUMNS.LON).value =
    mls?.longitude || mcao?.propertyAddress?.longitude || 'N/A'

  // Column Z: YEAR_BUILT (MLS)
  row.getCell(ANALYSIS_COLUMNS.YEAR_BUILT).value = mls?.yearBuilt || mcao?.yearBuilt || 'N/A'

  // Column AA: DAYS_ON_MARKET (MLS)
  row.getCell(ANALYSIS_COLUMNS.DAYS_ON_MARKET).value = mls?.dom || mls?.daysOnMarket || 'N/A'

  // Column AB: DWELLING_TYPE (MCAO)
  row.getCell(ANALYSIS_COLUMNS.DWELLING_TYPE).value = mcao?.propertyType || 'N/A'

  // Column AC: SUBDIVISION_NAME (MCAO)
  row.getCell(ANALYSIS_COLUMNS.SUBDIVISION_NAME).value = mcao?.subdivision || 'N/A'

  // Columns AD-AO: Property Radar comps (MANUAL - leave blank)
  for (let i = 1; i <= 12; i++) {
    const col = String.fromCharCode(65 + 3 + i) // AD = 68, AE = 69, etc.
    if (col.length === 1) {
      row.getCell(col).value = ''
    } else {
      // Handle two-letter columns (AA, AB, etc.)
      const colLetter = 'A' + String.fromCharCode(65 + (i - 1))
      row.getCell(colLetter).value = ''
    }
  }
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
    // Property Radar columns
    { width: 20 },  // AD - PR_COMP_1
    { width: 20 },  // AE - PR_COMP_2
    { width: 20 },  // AF - PR_COMP_3
    { width: 20 },  // AG - PR_COMP_4
    { width: 20 },  // AH - PR_COMP_5
    { width: 20 },  // AI - PR_COMP_6
    { width: 20 },  // AJ - PR_COMP_7
    { width: 20 },  // AK - PR_COMP_8
    { width: 20 },  // AL - PR_COMP_9
    { width: 20 },  // AM - PR_COMP_10
    { width: 20 },  // AN - PR_COMP_11
    { width: 20 },  // AO - PR_COMP_12
  ]
}
