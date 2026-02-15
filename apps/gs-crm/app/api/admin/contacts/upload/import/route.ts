/**
 * API: Execute Contact Import
 *
 * POST /api/admin/contacts/upload/import
 * Creates import batch and imports all valid contacts
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAllRows, validateRows, extractValidClients } from '@/lib/processing/contact-parser'
import {
  createImportBatch,
  updateImportBatchStatus,
  bulkCreateClients,
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
    if (!mapping.first_name || !mapping.last_name) {
      return NextResponse.json(
        { success: false, error: 'First Name and Last Name fields must be mapped' },
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

    // Create import batch record
    const fileType = file.name.toLowerCase().endsWith('.csv') ? 'csv' : 'xlsx'
    const { batch, error: batchError } = await createImportBatch({
      file_name: file.name,
      file_type: fileType,
      file_size_bytes: file.size,
      total_rows: validation.summary.totalRows,
      field_mapping: mapping,
    })

    if (batchError || !batch) {
      return NextResponse.json(
        { success: false, error: 'Failed to create import batch' },
        { status: 500 }
      )
    }

    // Update status to processing
    await updateImportBatchStatus(batch.id, 'processing')

    // Extract valid clients
    const validClients = extractValidClients(validation.validRows)

    if (validClients.length === 0) {
      // No valid rows to import
      await updateImportBatchStatus(batch.id, 'completed', {
        imported_count: 0,
        skipped_count: validation.summary.skipCount,
        error_count: validation.summary.errorCount,
        skipped_rows: validation.skippedRows,
        error_rows: validation.errorRows,
      })

      return NextResponse.json({
        success: true,
        data: {
          batchId: batch.id,
          importedCount: 0,
          skippedCount: validation.summary.skipCount,
          errorCount: validation.summary.errorCount,
          contacts: [],
        },
      })
    }

    // Bulk create clients
    const { created, error: createError } = await bulkCreateClients(batch.id, validClients)

    if (createError) {
      await updateImportBatchStatus(batch.id, 'failed', {
        skipped_rows: validation.skippedRows,
        error_rows: validation.errorRows,
      })

      return NextResponse.json(
        { success: false, error: 'Failed to import contacts' },
        { status: 500 }
      )
    }

    // Update batch status to completed
    await updateImportBatchStatus(batch.id, 'completed', {
      imported_count: created.length,
      skipped_count: validation.summary.skipCount,
      error_count: validation.summary.errorCount,
      skipped_rows: validation.skippedRows,
      error_rows: validation.errorRows,
    })

    return NextResponse.json({
      success: true,
      data: {
        batchId: batch.id,
        importedCount: created.length,
        skippedCount: validation.summary.skipCount,
        errorCount: validation.summary.errorCount,
        contacts: created,
      },
    })
  } catch (error) {
    console.error('[API] Error importing contacts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to import contacts. Please try again.' },
      { status: 500 }
    )
  }
}
