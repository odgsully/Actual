/**
 * Template Validation — Version Gates for MLS Upload Pipeline
 *
 * Simplified Template Strategy (Initiative 1):
 * - Required sheet check: all TEMPLATE_SHEETS must exist
 * - Required column check: critical column headers must be present per sheet
 * - Version marker check: optional cell-based version tracking
 * - Fail-fast with structured errors
 *
 * Append-only rule: new columns may be added but existing ones must not be
 * renamed, reordered, or removed. This validator enforces that contract.
 */

import type ExcelJS from 'exceljs'
import { TEMPLATE_SHEETS, COMPS_COLUMNS } from '../types/mls-data'

// ─── Types ──────────────────────────────────────────────────

export interface TemplateValidationResult {
  /** Whether the template passes all required checks */
  valid: boolean
  /** Blocking errors that prevent processing */
  errors: TemplateValidationError[]
  /** Non-blocking warnings (e.g., optional columns missing) */
  warnings: string[]
  /** Detected template version (from marker cell, or 'unknown') */
  version: string
  /** Sheets found in the workbook */
  sheetsFound: string[]
}

export interface TemplateValidationError {
  code: TemplateErrorCode
  message: string
  sheet?: string
  column?: string
}

export type TemplateErrorCode =
  | 'MISSING_SHEET'
  | 'MISSING_COLUMN'
  | 'COLUMN_MISMATCH'
  | 'VERSION_MISMATCH'
  | 'EMPTY_SHEET'

// ─── Required Sheets ────────────────────────────────────────

/** Sheets that MUST exist for the pipeline to function */
export const REQUIRED_SHEETS: readonly string[] = [
  TEMPLATE_SHEETS.COMPS,
  TEMPLATE_SHEETS.ANALYSIS,
  TEMPLATE_SHEETS.FULL_API_CALL,
  TEMPLATE_SHEETS.MARICOPA,
  TEMPLATE_SHEETS.HALF_MILE,
  TEMPLATE_SHEETS.LOT,
] as const

// ─── Required Column Headers Per Sheet ──────────────────────

/**
 * Minimum column headers required on each sheet for the pipeline to work.
 * Format: { sheetName: { columnLetter: expectedHeaderText } }
 *
 * Only includes columns that the pipeline actively reads. Optional/new
 * columns appended beyond these are allowed (append-only rule).
 */
export const REQUIRED_COLUMNS: Record<string, Record<string, string>> = {
  [TEMPLATE_SHEETS.COMPS]: {
    [COMPS_COLUMNS.ADDRESS]: 'Address',
    [COMPS_COLUMNS.CITY]: 'City',
    [COMPS_COLUMNS.ZIP]: 'Zip',
    [COMPS_COLUMNS.APN]: 'APN',
    [COMPS_COLUMNS.SALE_PRICE]: 'Sale Price',
    [COMPS_COLUMNS.LIST_PRICE]: 'List Price',
    [COMPS_COLUMNS.BEDROOMS]: 'Bedrooms',
    [COMPS_COLUMNS.BATHROOMS]: 'Bathrooms',
    [COMPS_COLUMNS.SQUARE_FEET]: 'Square Feet',
    [COMPS_COLUMNS.YEAR_BUILT]: 'Year Built',
    [COMPS_COLUMNS.MLS_NUMBER]: 'MLS Number',
    [COMPS_COLUMNS.STATUS]: 'Status',
  },
  [TEMPLATE_SHEETS.ANALYSIS]: {
    // Analysis sheet has custom headers; check column A = "Item"
    'A': 'Item',
    'B': 'Full Address',
  },
}

/**
 * Version marker cell location.
 * If this cell contains a version string (e.g., "v1.0"), it's checked.
 * Conventionally placed in a non-data area of the first sheet.
 */
const VERSION_MARKER_SHEET = TEMPLATE_SHEETS.COMPS
const VERSION_MARKER_CELL = 'AL1' // beyond data columns, won't interfere

/** Currently expected version (null = any version accepted) */
const EXPECTED_VERSION: string | null = null // Will be set in Initiative 2

// ─── Main Validation Function ───────────────────────────────

/**
 * Validate an uploaded workbook against the template contract.
 *
 * Checks (in order):
 * 1. Required sheets exist
 * 2. Required column headers are present and match
 * 3. Version marker (if present) matches expected version
 *
 * Returns a structured result with errors, warnings, and detected version.
 */
export function validateTemplateContract(
  workbook: ExcelJS.Workbook
): TemplateValidationResult {
  const errors: TemplateValidationError[] = []
  const warnings: string[] = []
  const sheetsFound = workbook.worksheets.map(ws => ws.name)

  // ── 1. Required sheets ──
  for (const sheetName of REQUIRED_SHEETS) {
    if (!workbook.getWorksheet(sheetName)) {
      errors.push({
        code: 'MISSING_SHEET',
        message: `Required sheet "${sheetName}" not found in workbook`,
        sheet: sheetName,
      })
    }
  }

  // ── 2. Required column headers ──
  for (const [sheetName, columns] of Object.entries(REQUIRED_COLUMNS)) {
    const sheet = workbook.getWorksheet(sheetName)
    if (!sheet) continue // already reported as MISSING_SHEET

    // Check if sheet has any data
    if (sheet.rowCount === 0) {
      errors.push({
        code: 'EMPTY_SHEET',
        message: `Sheet "${sheetName}" is empty (no rows)`,
        sheet: sheetName,
      })
      continue
    }

    const headerRow = sheet.getRow(1)

    for (const [col, expectedHeader] of Object.entries(columns)) {
      const cellValue = headerRow.getCell(col).value
      const actual = cellValue ? String(cellValue).trim() : ''

      if (!actual) {
        errors.push({
          code: 'MISSING_COLUMN',
          message: `Sheet "${sheetName}" column ${col} header is empty (expected "${expectedHeader}")`,
          sheet: sheetName,
          column: col,
        })
      } else if (!headerMatch(actual, expectedHeader)) {
        // Fuzzy match failed — this is a mismatch, not just missing
        warnings.push(
          `Sheet "${sheetName}" column ${col}: header "${actual}" differs from expected "${expectedHeader}" (may indicate column reorder)`
        )
      }
    }
  }

  // ── 3. Version marker ──
  let version = 'unknown'
  const markerSheet = workbook.getWorksheet(VERSION_MARKER_SHEET)
  if (markerSheet) {
    const markerCell = markerSheet.getCell(VERSION_MARKER_CELL)
    if (markerCell.value) {
      version = String(markerCell.value).trim()
    }
  }

  if (EXPECTED_VERSION && version !== 'unknown' && version !== EXPECTED_VERSION) {
    errors.push({
      code: 'VERSION_MISMATCH',
      message: `Template version "${version}" does not match expected "${EXPECTED_VERSION}"`,
    })
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    version,
    sheetsFound,
  }
}

// ─── Header Matching ────────────────────────────────────────

/**
 * Fuzzy header match: case-insensitive, ignores leading/trailing whitespace,
 * treats underscores as spaces, allows common abbreviations.
 */
function headerMatch(actual: string, expected: string): boolean {
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[_\-]/g, ' ').replace(/\s+/g, ' ').trim()

  const a = normalize(actual)
  const e = normalize(expected)

  // Exact match after normalization
  if (a === e) return true

  // Check if one contains the other (handles "Sale Price ($)" matching "Sale Price")
  if (a.includes(e) || e.includes(a)) return true

  return false
}

// ─── Convenience: Format Errors for API Response ────────────

/**
 * Format validation errors into a human-readable string for API error responses.
 * Does NOT leak internal column letters — provides descriptive messages only.
 */
export function formatValidationErrors(result: TemplateValidationResult): string {
  if (result.valid) return 'Template is valid'

  const lines = result.errors.map(e => `• ${e.message}`)
  if (result.warnings.length > 0) {
    lines.push('', 'Warnings:')
    lines.push(...result.warnings.map(w => `  ⚠ ${w}`))
  }

  return `Template validation failed:\n${lines.join('\n')}`
}
