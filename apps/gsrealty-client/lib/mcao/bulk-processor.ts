import * as ExcelJS from 'exceljs'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import { lookupAPNFromAddress } from './arcgis-lookup'
import { MCAOClient } from './client'
import { ExcelGenerator } from './excel-generator'
import { ZipGenerator } from './zip-generator'

interface ProcessResult {
  success: boolean
  zipBuffer?: Buffer
  fileName?: string
  error?: string
}

interface AddressRecord {
  originalRow: any
  address: string
  apn?: string
  mcaoData?: any
  error?: string
}

export class BulkProcessor {
  private mcaoClient: MCAOClient

  constructor() {
    this.mcaoClient = new MCAOClient()
  }

  async processFile(file: File): Promise<ProcessResult> {
    try {
      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Parse the file to extract addresses
      const records = await this.parseFile(file.name, buffer)

      if (!records || records.length === 0) {
        return {
          success: false,
          error: 'No valid addresses found in the file',
        }
      }

      // Process each address
      const processedRecords = await this.processAddresses(records)

      // Generate output files
      const excelGenerator = new ExcelGenerator()

      // Generate APN_Grab file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19)
      const apnGrabBuffer = await excelGenerator.generateAPNGrabFile(processedRecords, timestamp)

      // Generate MCAO file
      const mcaoBuffer = await excelGenerator.generateMCAOFile(processedRecords, timestamp)

      // Create ZIP with all three files
      const zipGenerator = new ZipGenerator()
      const zipBuffer = await zipGenerator.createZip({
        [`APN_Grab_${timestamp}.xlsx`]: apnGrabBuffer,
        [`MCAO_${timestamp}.xlsx`]: mcaoBuffer,
        [file.name]: buffer as Buffer,
      })

      return {
        success: true,
        zipBuffer,
        fileName: `MCAO_Bulk_${timestamp}.zip`,
      }
    } catch (error) {
      console.error('Processing error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  private async parseFile(fileName: string, buffer: Buffer): Promise<AddressRecord[]> {
    const records: AddressRecord[] = []

    if (fileName.toLowerCase().endsWith('.csv')) {
      // Parse CSV
      const text = buffer.toString('utf-8')
      const result = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
      })

      if (result.errors.length > 0) {
        console.warn('CSV parsing warnings:', result.errors)
      }

      // Find address column
      const addressColumn = this.findAddressColumn(result.data[0])
      if (!addressColumn) {
        throw new Error('No address column found. Please ensure your file has a column with addresses.')
      }

      // Extract addresses
      for (const row of result.data as Record<string, string>[]) {
        const address = row[addressColumn]
        if (address && typeof address === 'string' && address.trim()) {
          records.push({
            originalRow: row,
            address: address.trim(),
          })
        }
      }
    } else {
      // Parse Excel - try ExcelJS first, fall back to XLSX if it fails
      let data: any[] = []

      try {
        // Try parsing with ExcelJS first
        const workbook = new ExcelJS.Workbook()
        // @ts-expect-error - ExcelJS types incompatible with Node.js 20+ Buffer types
        await workbook.xlsx.load(buffer)

        // Get the first worksheet - try multiple methods
        let worksheet = workbook.getWorksheet(1)
        if (!worksheet && workbook.worksheets && workbook.worksheets.length > 0) {
          worksheet = workbook.worksheets[0]
        }
        if (!worksheet) {
          // Try getting by name if index doesn't work
          const sheetNames = workbook.worksheets.map(ws => ws.name)
          if (sheetNames.length > 0) {
            worksheet = workbook.getWorksheet(sheetNames[0])
          }
        }

        if (!worksheet) {
          throw new Error('No worksheet found with ExcelJS')
        }

        let headers: string[] = []
        let hasData = false

        worksheet.eachRow((row, rowNumber) => {
          // Skip completely empty rows
          const values = row.values as any[]
          if (!values || values.every(v => v === null || v === undefined || v === '')) {
            return
          }

          if (rowNumber === 1 || (!hasData && headers.length === 0)) {
            // First non-empty row is headers
            headers = []
            row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
              const value = cell.value
              if (value !== null && value !== undefined && value !== '') {
                // Store header with its column number
                headers[colNumber] = String(value).trim()
              }
            })
            hasData = true
          } else if (hasData) {
            // Data rows
            const rowData: any = {}
            row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
              const header = headers[colNumber]
              if (header) {
                const cellValue = cell.value
                // Handle different cell value types
                if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
                  if (typeof cellValue === 'object' && 'text' in cellValue) {
                    // Handle rich text cells
                    rowData[header] = cellValue.text
                  } else {
                    rowData[header] = String(cellValue).trim()
                  }
                }
              }
            })
            if (Object.keys(rowData).length > 0) {
              data.push(rowData)
            }
          }
        })
      } catch (excelJsError) {
        console.log('ExcelJS parsing failed, trying XLSX library:', excelJsError)

        // Fall back to XLSX library
        try {
          const workbook = XLSX.read(buffer, { type: 'buffer', cellText: true, cellDates: true })
          const sheetName = workbook.SheetNames[0]

          if (!sheetName) {
            throw new Error('No worksheet found in Excel file')
          }

          const worksheet = workbook.Sheets[sheetName]
          data = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: '' })

          console.log('XLSX parsed data length:', data.length)
          if (data.length > 0) {
            console.log('XLSX first row:', data[0])
          }
        } catch (xlsxError) {
          console.error('Both Excel parsers failed:', xlsxError)
          throw new Error('Failed to parse Excel file. Please ensure it is a valid Excel file.')
        }
      }

      if (!data || data.length === 0) {
        throw new Error('No data found in Excel file')
      }

      // Find address column
      console.log('First row of data:', data[0])
      console.log('Available columns:', Object.keys(data[0] || {}))

      const addressColumn = this.findAddressColumn(data[0])
      if (!addressColumn) {
        const availableColumns = Object.keys(data[0] || {}).join(', ')
        throw new Error(`No address column found. Available columns: ${availableColumns}. Please ensure your file has a column with addresses (e.g., Address, FULL_ADDRESS, Property Address).`)
      }

      console.log('Found address column:', addressColumn)

      // Extract addresses
      for (const row of data) {
        const address = (row as any)[addressColumn]
        if (address && typeof address === 'string' && address.trim()) {
          records.push({
            originalRow: row,
            address: address.trim(),
          })
        }
      }
    }

    return records
  }

  private findAddressColumn(firstRow: any): string | null {
    if (!firstRow || typeof firstRow !== 'object') return null

    const keys = Object.keys(firstRow)
    console.log('Looking for address column among:', keys)

    // First, try exact match for "Address" (case-sensitive)
    if (keys.includes('Address')) {
      return 'Address'
    }

    // Flexible column header matching
    const possibleHeaders = [
      'address',
      'full_address',
      'fulladdress',
      'property_address',
      'propertyaddress',
      'street_address',
      'streetaddress',
      'location',
      'property',
      'addr',
      'full address',
      'property address',
      'street address',
    ]

    // Try exact match (case-insensitive)
    for (const key of keys) {
      const normalizedKey = key.toLowerCase().trim().replace(/[_\s-]/g, '')
      if (possibleHeaders.includes(normalizedKey)) {
        console.log(`Found address column by normalized match: ${key}`)
        return key
      }
    }

    // Try partial match
    for (const key of keys) {
      const normalizedKey = key.toLowerCase().trim()
      if (normalizedKey.includes('address') || normalizedKey.includes('addr')) {
        console.log(`Found address column by partial match: ${key}`)
        return key
      }
    }

    // If still not found, look for the first column that looks like an address
    for (const key of keys) {
      const value = firstRow[key]
      if (typeof value === 'string' && this.looksLikeAddress(value)) {
        console.log(`Found address column by content pattern: ${key}`)
        return key
      }
    }

    return null
  }

  private looksLikeAddress(value: string): boolean {
    // Basic check for address-like patterns
    const trimmed = value.trim()

    // Check for common address patterns
    const hasNumber = /^\d+/.test(trimmed)
    const hasStreetKeyword = /\b(st|street|ave|avenue|rd|road|dr|drive|ln|lane|blvd|boulevard|way|ct|court|pl|place)\b/i.test(trimmed)

    return hasNumber && hasStreetKeyword && trimmed.length > 10
  }

  private async processAddresses(records: AddressRecord[]): Promise<AddressRecord[]> {
    const batchSize = 10
    const processedRecords: AddressRecord[] = []

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, Math.min(i + batchSize, records.length))

      // Process batch in parallel
      const batchResults = await Promise.all(
        batch.map(async (record) => {
          try {
            // Step 1: Look up APN from address
            const apnResult = await lookupAPNFromAddress(record.address)

            if (apnResult.apn) {
              record.apn = apnResult.apn

              // Step 2: Fetch MCAO data using the APN
              const mcaoResult = await this.mcaoClient.lookupByAPN({ apn: apnResult.apn })

              if (mcaoResult.success && mcaoResult.flattenedData) {
                record.mcaoData = mcaoResult.flattenedData
              } else {
                // Include APN even if MCAO lookup fails
                record.error = mcaoResult.error?.message || 'MCAO lookup failed'
              }
            } else {
              // Include address with blank APN if lookup fails
              record.apn = ''
              record.error = apnResult.notes || 'APN not found'
            }
          } catch (error) {
            record.apn = ''
            record.error = error instanceof Error ? error.message : 'Processing error'
          }

          return record
        })
      )

      processedRecords.push(...batchResults)

      // Rate limiting - wait a bit between batches
      if (i + batchSize < records.length) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }

    return processedRecords
  }
}