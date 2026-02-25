/**
 * PropertyRadar Excel Generator
 *
 * Generates a separate PropertyRadar Excel file from Complete_*.xlsx uploads
 * Reads Property Radar data from Analysis sheet columns AE-AP (31-42) if they exist
 * Validates column count before copying to prevent writing garbage data
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
    const buf = await templateWorkbook.xlsx.writeBuffer()
    return Buffer.from(buf)
  }

  console.log(`${LOG_PREFIX} Reading Analysis sheet with ${analysisSheet.rowCount} rows`)

  // Copy PropertyRadar data from Analysis sheet
  // PropertyRadar comp columns should be at positions 31-42 (AE-AP) if they exist
  // If Analysis sheet only has 30 columns (A-AD), these columns won't exist
  // To populate PropertyRadar export, add 12 comp columns (AE-AP) to the Analysis sheet

  // Detect actual column count from header row
  const headerRow = analysisSheet.getRow(1)
  let lastHeaderCol = 0
  headerRow.eachCell((cell, colNumber) => {
    if (cell.value) lastHeaderCol = colNumber
  })

  console.log(`${LOG_PREFIX} Analysis sheet has ${lastHeaderCol} columns (need 42 for PR data)`)

  let rowsPopulated = 0
  const PR_START_COL = 31 // AE = column 31 (first PR comp column, after AD=30)
  const PR_END_COL = 42   // AP = column 42 (12th PR comp column)

  // Only attempt copy if PR columns exist in the Analysis sheet
  if (lastHeaderCol >= PR_END_COL) {
    for (let sourceRow = 2; sourceRow <= analysisSheet.rowCount; sourceRow++) {
      const destRow = sourceRow
      const itemLabel = analysisSheet.getRow(sourceRow).getCell(1).value
      if (!itemLabel) continue

      const targetRow = sheet.getRow(destRow)

      for (let i = 0; i < 12; i++) {
        const sourceCol = PR_START_COL + i
        const destCol = 1 + i
        const value = analysisSheet.getRow(sourceRow).getCell(sourceCol).value
        targetRow.getCell(destCol).value = value || ''
      }
      rowsPopulated++
    }
  } else {
    console.warn(`${LOG_PREFIX} Analysis sheet only has ${lastHeaderCol} columns - PropertyRadar comp columns (AE-AP) not found. Export will be empty.`)
    console.warn(`${LOG_PREFIX} To populate PropertyRadar export, add 12 comp columns (AE-AP) to the Analysis sheet.`)
  }

  console.log(`${LOG_PREFIX} Populated ${rowsPopulated} rows in PropertyRadar template`)

  // Set column widths
  sheet.columns = Array(12).fill({ width: 25 })

  // Generate buffer
  const buffer = await templateWorkbook.xlsx.writeBuffer()

  console.log(`${LOG_PREFIX} PropertyRadar Excel generated successfully`)

  return Buffer.from(buffer)
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
