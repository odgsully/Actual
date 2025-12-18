import * as ExcelJS from 'exceljs'

interface AddressRecord {
  originalRow: any
  address: string
  apn?: string
  mcaoData?: any
  error?: string
}

export class ExcelGenerator {
  async generateAPNGrabFile(records: AddressRecord[], timestamp: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('APN Lookup Results')

    // Set column headers
    worksheet.columns = [
      { header: 'Address', key: 'address', width: 50 },
      { header: 'APN', key: 'apn', width: 20 },
    ]

    // Style the header row
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    }

    // Add data rows
    for (const record of records) {
      worksheet.addRow({
        address: record.address,
        apn: record.apn || '',
      })
    }

    // Add borders to all cells
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        }
      })
    })

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer()
    return Buffer.from(buffer)
  }

  async generateMCAOFile(records: AddressRecord[], timestamp: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('MCAO Data')

    // Collect all unique field names from all records
    const allFields = new Set<string>()
    allFields.add('Address')
    allFields.add('APN')

    // Gather all unique MCAO fields
    for (const record of records) {
      if (record.mcaoData) {
        Object.keys(record.mcaoData).forEach(field => allFields.add(field))
      }
    }

    // Convert to array and sort (keeping Address and APN first)
    const fieldArray = Array.from(allFields)
    const primaryFields = ['Address', 'APN']
    const mcaoFields = fieldArray.filter(f => !primaryFields.includes(f)).sort()
    const allFieldsSorted = [...primaryFields, ...mcaoFields]

    // Set columns with field names as headers
    worksheet.columns = allFieldsSorted.map(field => ({
      header: field,
      key: field,
      width: this.getColumnWidth(field),
    }))

    // Style the header row
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }, // Blue header
    }
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } } // White text

    // Add data rows
    for (const record of records) {
      const rowData: any = {
        Address: record.address,
        APN: record.apn || '',
      }

      // Add MCAO data fields
      if (record.mcaoData) {
        for (const field of mcaoFields) {
          rowData[field] = record.mcaoData[field] !== undefined ? record.mcaoData[field] : ''
        }
      }

      worksheet.addRow(rowData)
    }

    // Style the data
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        // Alternate row colors for better readability
        if (rowNumber % 2 === 0) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF2F2F2' },
          }
        }
      }

      // Add borders to all cells
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        }

        // Wrap text for better readability
        cell.alignment = { wrapText: true, vertical: 'top' }
      })
    })

    // Freeze the header row and first two columns
    worksheet.views = [
      {
        state: 'frozen',
        xSplit: 2,
        ySplit: 1,
        topLeftCell: 'C2',
      },
    ]

    // Auto-filter on all columns
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: allFieldsSorted.length },
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer()
    return Buffer.from(buffer)
  }

  private getColumnWidth(field: string): number {
    // Set appropriate column widths based on field names
    const fieldLower = field.toLowerCase()

    if (fieldLower.includes('address')) return 50
    if (fieldLower.includes('description')) return 40
    if (fieldLower.includes('name')) return 30
    if (fieldLower.includes('apn')) return 20
    if (fieldLower.includes('date')) return 15
    if (fieldLower.includes('value') || fieldLower.includes('amount')) return 15
    if (fieldLower.includes('id') || fieldLower.includes('code')) return 12
    if (fieldLower.includes('comments') || fieldLower.includes('notes')) return 50

    // Default width
    return 20
  }
}