/**
 * API: Preview Contact Import
 *
 * POST /api/admin/contacts/upload/preview
 * Validates mapping and returns preview with validation results
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAllRows, validateRows } from '@/lib/processing/contact-parser'
import {
  getExistingEmails,
  getExistingPhones,
  type FieldMapping,
} from '@/lib/database/contact-import'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const mappingJson = formData.get('mapping') as string | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!mappingJson) {
      return NextResponse.json(
        { success: false, error: 'No field mapping provided' },
        { status: 400 }
      )
    }

    const mapping: FieldMapping = JSON.parse(mappingJson)

    // Validate required mappings
    if (!mapping.first_name) {
      return NextResponse.json(
        { success: false, error: 'First Name field must be mapped' },
        { status: 400 }
      )
    }

    if (!mapping.last_name) {
      return NextResponse.json(
        { success: false, error: 'Last Name field must be mapped' },
        { status: 400 }
      )
    }

    // Read file buffer
    const buffer = await file.arrayBuffer()

    // Get all rows
    const rows = getAllRows(buffer, file.name)

    // Get existing emails and phones from database
    const [{ emails: existingEmails }, { phones: existingPhones }] = await Promise.all([
      getExistingEmails(),
      getExistingPhones(),
    ])

    // Validate rows
    const validation = validateRows(rows, mapping, existingEmails, existingPhones)

    // Return preview (first 10 rows) and full validation summary
    const preview = validation.validRows.slice(0, 10)

    return NextResponse.json({
      success: true,
      data: {
        summary: validation.summary,
        preview,
        allSkipped: validation.skippedRows,
        allErrors: validation.errorRows,
      },
    })
  } catch (error) {
    console.error('[API] Error previewing contact import:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to preview import. Please try again.' },
      { status: 500 }
    )
  }
}
