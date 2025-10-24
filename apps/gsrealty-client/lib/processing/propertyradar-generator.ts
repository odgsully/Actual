/**
 * PropertyRadar Excel Generator
 *
 * Generates a separate PropertyRadar Excel file from Complete_*.xlsx uploads
 * Reads Property Radar data from Analysis sheet columns S and AD-AO
 * Outputs to Upload-template-PropertyRadar.xlsx format (12 columns A-L)
 */

import ExcelJS from 'exceljs'
import * as path from 'path'

const LOG_PREFIX = '[PropertyRadar Generator]'

// PropertyRadar template path
const PROPERTY_RADAR_TEMPLATE_PATH = path.join(
  process.cwd(),
  'Upload-template-PropertyRadar.xlsx'
)

/**
 * Generate PropertyRadar Excel file from uploaded Complete file
 */
export async function generatePropertyRadarExcel(
  uploadedWorkbook: ExcelJS.Workbook,
  clientName: string
): Promise<Buffer> {
  console.log(`${LOG_PREFIX} Generating PropertyRadar Excel for client: ${clientName}`)

  // Load the PropertyRadar template
  const templateWorkbook = new ExcelJS.Workbook()
  await templateWorkbook.xlsx.readFile(PROPERTY_RADAR_TEMPLATE_PATH)

  // Get the sheet from template (Sheet1)
  const sheet = templateWorkbook.getWorksheet('Sheet1')
  if (!sheet) {
    throw new Error('Sheet1 not found in PropertyRadar template')
  }

  // Read Analysis sheet from uploaded Complete file
  const analysisSheet = uploadedWorkbook.getWorksheet('Analysis')
  if (!analysisSheet) {
    console.warn(`${LOG_PREFIX} No Analysis sheet found in uploaded file`)
    // Return empty template
    return await templateWorkbook.xlsx.writeBuffer() as Buffer
  }

  console.log(`${LOG_PREFIX} Reading Analysis sheet with ${analysisSheet.rowCount} rows`)

  // Copy PropertyRadar data from Analysis sheet
  // Analysis columns S (19) and AD-AO (30-41) map to PropertyRadar A-L (1-12)
  // Note: Column S (PROPERTY_RADAR-COMP-Y-N) is not copied - only AD-AO

  let rowsPopulated = 0

  // Start from row 2 (skip header)
  for (let sourceRow = 2; sourceRow <= analysisSheet.rowCount; sourceRow++) {
    const destRow = sourceRow

    // Read Item label from column A
    const itemLabel = analysisSheet.getRow(sourceRow).getCell(1).value

    // Only copy rows with data
    if (!itemLabel) continue

    const targetRow = sheet.getRow(destRow)

    // Copy Property Radar columns AD-AO (30-41) to A-L (1-12)
    for (let i = 0; i < 12; i++) {
      const sourceCol = 30 + i // AD = 30, AE = 31, ..., AO = 41
      const destCol = 1 + i   // A = 1, B = 2, ..., L = 12

      const value = analysisSheet.getRow(sourceRow).getCell(sourceCol).value
      targetRow.getCell(destCol).value = value || ''
    }

    rowsPopulated++
  }

  console.log(`${LOG_PREFIX} Populated ${rowsPopulated} rows in PropertyRadar template`)

  // Set column widths
  sheet.columns = Array(12).fill({ width: 25 })

  // Generate buffer
  const buffer = await templateWorkbook.xlsx.writeBuffer()

  console.log(`${LOG_PREFIX} PropertyRadar Excel generated successfully`)

  return buffer as Buffer
}

/**
 * Format timestamp for filename
 */
export function formatTimestamp(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}-${hours}${minutes}`
}

/**
 * Generate PropertyRadar filename
 */
export function generatePropertyRadarFilename(clientName: string): string {
  const now = new Date()
  const timestamp = formatTimestamp(now)
  const lastName = (clientName || 'Client').split(' ')[0].replace(/[^a-zA-Z0-9]/g, '')

  return `PropertyRadar_${lastName}_${timestamp}.xlsx`
}
