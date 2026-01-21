/**
 * MCAO Download API Route
 *
 * POST /api/admin/mcao/download
 * Download single APN data as Excel file
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMCAOClient } from '@/lib/mcao/client'
import { formatAPN } from '@/lib/types/mcao-data'
import ExcelJS from 'exceljs'
import { requireAdmin } from '@/lib/api/admin-auth'

interface DownloadRequest {
  apn: string
}

/**
 * POST: Download MCAO data as Excel
 */
export async function POST(req: NextRequest) {
  // Verify admin authentication
  const auth = await requireAdmin()
  if (!auth.success) return auth.response

  try {
    const body: DownloadRequest = await req.json()
    const { apn: rawAPN } = body

    if (!rawAPN) {
      return NextResponse.json(
        { success: false, error: 'APN is required' },
        { status: 400 }
      )
    }

    const apn = formatAPN(rawAPN)

    // Get MCAO data
    const mcaoClient = getMCAOClient()
    const result = await mcaoClient.lookupByAPN({ apn })

    if (!result.success || !result.flattenedData) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch MCAO data' },
        { status: 400 }
      )
    }

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('MCAO Data')

    // Add headers
    worksheet.columns = [
      { header: 'Field', key: 'field', width: 40 },
      { header: 'Value', key: 'value', width: 60 }
    ]

    // Add data rows
    const flatData = result.flattenedData
    Object.entries(flatData).forEach(([key, value]) => {
      worksheet.addRow({
        field: key,
        value: value !== null && value !== undefined ? String(value) : 'N/A'
      })
    })

    // Style the header row
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    }

    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer()

    // Generate filename
    const timestamp = new Date().toISOString().slice(0, 10)
    const filename = `MCAO-${apn}-${timestamp}.xlsx`

    // Return file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('[MCAO Download API] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate Excel file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
