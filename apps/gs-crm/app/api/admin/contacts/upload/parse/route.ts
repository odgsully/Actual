/**
 * API: Parse Contact Upload File
 *
 * POST /api/admin/contacts/upload/parse
 * Parses CSV/XLSX file and returns columns for mapping
 */

import { NextRequest, NextResponse } from 'next/server'
import { parseFileBuffer } from '@/lib/processing/contact-parser'
import { requireAdmin } from '@/lib/api/admin-auth'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_ROWS = 5000

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.success) return auth.response

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.csv') && !fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only CSV and XLSX files are supported.' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    // Read file buffer
    const buffer = await file.arrayBuffer()

    // Parse file
    const parsed = parseFileBuffer(buffer, file.name)

    // Validate row count
    if (parsed.totalRows > MAX_ROWS) {
      return NextResponse.json(
        { success: false, error: `File has ${parsed.totalRows} rows. Maximum is ${MAX_ROWS} contacts per import.` },
        { status: 400 }
      )
    }

    if (parsed.totalRows === 0) {
      return NextResponse.json(
        { success: false, error: 'File is empty or has no data rows.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        fileName: parsed.fileName,
        fileType: parsed.fileType,
        totalRows: parsed.totalRows,
        columns: parsed.columns,
        sampleRows: parsed.sampleRows,
        suggestedMapping: parsed.suggestedMapping,
      },
    })
  } catch (error) {
    console.error('[API] Error parsing contact file:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to parse file. Please check the format and try again.' },
      { status: 500 }
    )
  }
}
