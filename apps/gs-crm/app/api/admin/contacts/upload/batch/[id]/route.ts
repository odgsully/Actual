/**
 * API: Rollback Contact Import Batch
 *
 * DELETE /api/admin/contacts/upload/batch/[id]
 * Deletes all contacts from the specified import batch
 */

import { NextRequest, NextResponse } from 'next/server'
import { getImportBatch, rollbackImportBatch } from '@/lib/database/contact-import'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: batchId } = await params

    if (!batchId) {
      return NextResponse.json(
        { success: false, error: 'Batch ID is required' },
        { status: 400 }
      )
    }

    // Get batch to verify it exists and hasn't been rolled back
    const { batch, error: fetchError } = await getImportBatch(batchId)

    if (fetchError || !batch) {
      return NextResponse.json(
        { success: false, error: 'Import batch not found' },
        { status: 404 }
      )
    }

    if (batch.status === 'rolled_back') {
      return NextResponse.json(
        { success: false, error: 'This import has already been rolled back' },
        { status: 400 }
      )
    }

    // Rollback the batch
    const { deletedCount, error: rollbackError } = await rollbackImportBatch(batchId)

    if (rollbackError) {
      return NextResponse.json(
        { success: false, error: 'Failed to rollback import' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        batchId,
        deletedCount,
        status: 'rolled_back',
      },
    })
  } catch (error) {
    console.error('[API] Error rolling back import batch:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to rollback import' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: batchId } = await params

    if (!batchId) {
      return NextResponse.json(
        { success: false, error: 'Batch ID is required' },
        { status: 400 }
      )
    }

    const { batch, error } = await getImportBatch(batchId)

    if (error || !batch) {
      return NextResponse.json(
        { success: false, error: 'Import batch not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: batch,
    })
  } catch (error) {
    console.error('[API] Error fetching import batch:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch import batch' },
      { status: 500 }
    )
  }
}
