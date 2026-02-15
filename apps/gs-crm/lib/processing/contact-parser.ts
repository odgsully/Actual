/**
 * Contact File Parser
 *
 * Parses CSV and XLSX files for contact import
 * Returns columns, sample rows, and auto-mapping suggestions
 */

import * as XLSX from 'xlsx'
import type { FieldMapping, SkippedRow, ErrorRow } from '@/lib/database/contact-import'
import {
  normalizePhone,
  isValidEmail,
} from '@/lib/database/contact-import'

// Parsed file result
export interface ParsedFile {
  fileName: string
  fileType: 'csv' | 'xlsx'
  totalRows: number
  columns: string[]
  sampleRows: Record<string, string>[]
  suggestedMapping: FieldMapping
}

// Validation result for a single row
export interface RowValidation {
  row: number
  status: 'valid' | 'skip' | 'error'
  reason?: string
  data?: Record<string, string | null>
}

// Auto-mapping rules for common column names
const AUTO_MAP_RULES: Record<keyof FieldMapping, string[]> = {
  first_name: ['first name', 'firstname', 'first', 'given name', 'forename', 'fname'],
  last_name: ['last name', 'lastname', 'last', 'surname', 'family name', 'lname'],
  email: ['email', 'e-mail', 'email address', 'emailaddress', 'mail'],
  phone: ['phone', 'telephone', 'phone number', 'mobile', 'cell', 'tel', 'phonenumber', 'phone1', 'primary phone'],
  address: ['address', 'street address', 'mailing address', 'home address', 'street', 'address1'],
  client_type: ['type', 'client type', 'contact type', 'category', 'lead type'],
  status: ['status', 'contact status', 'state', 'lead status'],
  notes: ['notes', 'comments', 'description', 'memo', 'remarks', 'note'],
}

/**
 * Parse a file buffer into structured data
 */
export function parseFileBuffer(
  buffer: ArrayBuffer,
  fileName: string
): ParsedFile {
  const fileType = getFileType(fileName)

  if (fileType === 'csv') {
    return parseCSV(buffer, fileName)
  } else {
    return parseXLSX(buffer, fileName)
  }
}

/**
 * Determine file type from extension
 */
function getFileType(fileName: string): 'csv' | 'xlsx' {
  const ext = fileName.toLowerCase().split('.').pop()
  if (ext === 'csv') return 'csv'
  return 'xlsx'
}

/**
 * Parse CSV file
 */
function parseCSV(buffer: ArrayBuffer, fileName: string): ParsedFile {
  // Convert buffer to string
  const decoder = new TextDecoder('utf-8')
  const csvString = decoder.decode(buffer)

  // Use xlsx library to parse CSV (handles quoted fields properly)
  const workbook = XLSX.read(csvString, { type: 'string' })
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]

  // Convert to JSON array
  const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(worksheet, {
    defval: '',
    raw: false,
  })

  const columns = rows.length > 0 ? Object.keys(rows[0]) : []
  const totalRows = rows.length
  const sampleRows = rows.slice(0, 5)

  return {
    fileName,
    fileType: 'csv',
    totalRows,
    columns,
    sampleRows,
    suggestedMapping: autoMapColumns(columns),
  }
}

/**
 * Parse XLSX file
 */
function parseXLSX(buffer: ArrayBuffer, fileName: string): ParsedFile {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]

  // Convert to JSON array
  const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(worksheet, {
    defval: '',
    raw: false,
  })

  const columns = rows.length > 0 ? Object.keys(rows[0]) : []
  const totalRows = rows.length
  const sampleRows = rows.slice(0, 5)

  return {
    fileName,
    fileType: 'xlsx',
    totalRows,
    columns,
    sampleRows,
    suggestedMapping: autoMapColumns(columns),
  }
}

/**
 * Auto-map columns based on common naming patterns
 */
function autoMapColumns(fileColumns: string[]): FieldMapping {
  const mapping: FieldMapping = {
    first_name: null,
    last_name: null,
    email: null,
    phone: null,
    address: null,
    client_type: null,
    status: null,
    notes: null,
  }

  for (const [field, aliases] of Object.entries(AUTO_MAP_RULES)) {
    const match = fileColumns.find(col =>
      aliases.includes(col.toLowerCase().trim())
    )
    if (match) {
      mapping[field as keyof FieldMapping] = match
    }
  }

  return mapping
}

/**
 * Get all rows from file buffer
 */
export function getAllRows(buffer: ArrayBuffer, fileName: string): Record<string, string>[] {
  const fileType = getFileType(fileName)

  if (fileType === 'csv') {
    const decoder = new TextDecoder('utf-8')
    const csvString = decoder.decode(buffer)
    const workbook = XLSX.read(csvString, { type: 'string' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    return XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false })
  } else {
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    return XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false })
  }
}

/**
 * Validate all rows against mapping and existing data
 */
export function validateRows(
  rows: Record<string, string>[],
  mapping: FieldMapping,
  existingEmails: Set<string>,
  existingPhones: Set<string>
): {
  validRows: RowValidation[]
  skippedRows: SkippedRow[]
  errorRows: ErrorRow[]
  summary: {
    totalRows: number
    validCount: number
    skipCount: number
    errorCount: number
  }
} {
  const validRows: RowValidation[] = []
  const skippedRows: SkippedRow[] = []
  const errorRows: ErrorRow[] = []

  // Track emails/phones seen in this import to catch duplicates within file
  const seenEmails = new Set<string>()
  const seenPhones = new Set<string>()

  rows.forEach((row, index) => {
    const rowNumber = index + 1

    // Extract values based on mapping
    const firstName = mapping.first_name ? row[mapping.first_name]?.trim() : null
    const lastName = mapping.last_name ? row[mapping.last_name]?.trim() : null
    const email = mapping.email ? row[mapping.email]?.trim()?.toLowerCase() : null
    const phone = mapping.phone ? normalizePhone(row[mapping.phone]) : null

    // Required field validation
    if (!firstName) {
      errorRows.push({ row: rowNumber, reason: 'missing_first_name' })
      validRows.push({ row: rowNumber, status: 'error', reason: 'missing_first_name' })
      return
    }

    if (!lastName) {
      errorRows.push({ row: rowNumber, reason: 'missing_last_name' })
      validRows.push({ row: rowNumber, status: 'error', reason: 'missing_last_name' })
      return
    }

    // Email format validation
    if (email && !isValidEmail(email)) {
      errorRows.push({ row: rowNumber, reason: 'invalid_email', value: email })
      validRows.push({ row: rowNumber, status: 'error', reason: 'invalid_email' })
      return
    }

    // Duplicate detection - existing in database
    if (email && existingEmails.has(email)) {
      skippedRows.push({ row: rowNumber, reason: 'duplicate_email', email })
      validRows.push({ row: rowNumber, status: 'skip', reason: 'duplicate_email' })
      return
    }

    if (phone && existingPhones.has(phone)) {
      skippedRows.push({ row: rowNumber, reason: 'duplicate_phone', phone })
      validRows.push({ row: rowNumber, status: 'skip', reason: 'duplicate_phone' })
      return
    }

    // Duplicate detection - within this import file
    if (email && seenEmails.has(email)) {
      skippedRows.push({ row: rowNumber, reason: 'duplicate_email', email })
      validRows.push({ row: rowNumber, status: 'skip', reason: 'duplicate_email' })
      return
    }

    if (phone && seenPhones.has(phone)) {
      skippedRows.push({ row: rowNumber, reason: 'duplicate_phone', phone })
      validRows.push({ row: rowNumber, status: 'skip', reason: 'duplicate_phone' })
      return
    }

    // Track this row's email/phone
    if (email) seenEmails.add(email)
    if (phone) seenPhones.add(phone)

    // Extract all mapped fields
    const data: Record<string, string | null> = {
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone: phone,
      address: mapping.address ? row[mapping.address]?.trim() || null : null,
      client_type: mapping.client_type ? normalizeClientType(row[mapping.client_type]) : null,
      status: mapping.status ? normalizeStatus(row[mapping.status]) : null,
      notes: mapping.notes ? row[mapping.notes]?.trim() || null : null,
    }

    validRows.push({ row: rowNumber, status: 'valid', data })
  })

  return {
    validRows,
    skippedRows,
    errorRows,
    summary: {
      totalRows: rows.length,
      validCount: validRows.filter(r => r.status === 'valid').length,
      skipCount: skippedRows.length,
      errorCount: errorRows.length,
    },
  }
}

/**
 * Normalize client_type value
 */
function normalizeClientType(value: string | undefined): 'buyer' | 'seller' | 'both' | null {
  if (!value) return null

  const normalized = value.toLowerCase().trim()

  if (['buyer', 'buy', 'buying', 'purchaser'].includes(normalized)) {
    return 'buyer'
  }
  if (['seller', 'sell', 'selling', 'vendor'].includes(normalized)) {
    return 'seller'
  }
  if (['both', 'buyer/seller', 'buyer and seller', 'dual'].includes(normalized)) {
    return 'both'
  }

  return null // Will default to 'buyer' on insert
}

/**
 * Normalize status value
 */
function normalizeStatus(value: string | undefined): 'active' | 'inactive' | 'prospect' | null {
  if (!value) return null

  const normalized = value.toLowerCase().trim()

  if (['active', 'current', 'engaged'].includes(normalized)) {
    return 'active'
  }
  if (['inactive', 'dormant', 'cold', 'closed'].includes(normalized)) {
    return 'inactive'
  }
  if (['prospect', 'lead', 'new', 'potential'].includes(normalized)) {
    return 'prospect'
  }

  return null // Will default to 'prospect' on insert
}

/**
 * Extract valid client data from validation results
 */
export function extractValidClients(
  validRows: RowValidation[]
): Array<{
  first_name: string
  last_name: string
  email?: string
  phone?: string
  address?: string
  client_type?: 'buyer' | 'seller' | 'both'
  status?: 'active' | 'inactive' | 'prospect'
  notes?: string
}> {
  return validRows
    .filter(row => row.status === 'valid' && row.data)
    .map(row => {
      const data = row.data!
      return {
        first_name: data.first_name!,
        last_name: data.last_name!,
        email: data.email || undefined,
        phone: data.phone || undefined,
        address: data.address || undefined,
        client_type: (data.client_type as 'buyer' | 'seller' | 'both') || undefined,
        status: (data.status as 'active' | 'inactive' | 'prospect') || undefined,
        notes: data.notes || undefined,
      }
    })
}
