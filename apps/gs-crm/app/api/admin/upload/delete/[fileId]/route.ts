/**
 * Delete File API Route
 *
 * DELETE /api/admin/upload/delete/[fileId]
 * Deletes file from Supabase Storage, local folder, and database
 */

import { NextRequest, NextResponse } from 'next/server'
import { getFileById, deleteFileRecord } from '@/lib/database/files'
import { deleteFromSupabase } from '@/lib/storage/supabase-storage'
import { deleteLocalFile } from '@/lib/storage/local-storage'
import { requireAdmin } from '@/lib/api/admin-auth'

/**
 * DELETE: Remove file completely
 *
 * Path parameter:
 * - fileId: File UUID from database
 *
 * Query parameters (optional):
 * - includeLocal: 'true' | 'false' (default: 'false')
 *   - If true, also deletes local copy
 *
 * Response:
 * - success: boolean
 * - deletedFrom: Array of locations deleted from
 * - errors: Array of any errors encountered
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    // Verify admin authentication
    const auth = await requireAdmin()
    if (!auth.success) return auth.response

    const { fileId } = await params
    const searchParams = req.nextUrl.searchParams
    const includeLocal = searchParams.get('includeLocal') === 'true'

    // Validate fileId
    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      )
    }

    // Get file metadata
    const { file, error: dbError } = await getFileById(fileId)
    if (dbError || !file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    const deletedFrom: string[] = []
    const errors: string[] = []

    // 1. Delete from Supabase Storage
    const { success: storageDeleted, error: storageError } = await deleteFromSupabase(
      file.storage_path
    )

    if (storageDeleted) {
      deletedFrom.push('supabase_storage')
    } else {
      errors.push(`Supabase Storage: ${storageError?.message || 'Unknown error'}`)
    }

    // 2. Delete from local folder (if requested and path exists)
    if (includeLocal && file.local_path) {
      try {
        // Extract folder name and filename from local path
        const pathParts = file.local_path.split('/')
        const fileName = pathParts[pathParts.length - 1]
        const folderName = pathParts[pathParts.length - 2]

        const { success: localDeleted, error: localError } = await deleteLocalFile(
          folderName,
          fileName
        )

        if (localDeleted) {
          deletedFrom.push('local_storage')
        } else {
          errors.push(`Local Storage: ${localError?.message || 'Unknown error'}`)
        }
      } catch (localError) {
        errors.push(`Local Storage: ${localError}`)
      }
    }

    // 3. Delete database record
    const { success: dbDeleted, error: deleteError } = await deleteFileRecord(fileId)

    if (dbDeleted) {
      deletedFrom.push('database')
    } else {
      errors.push(`Database: ${deleteError?.message || 'Unknown error'}`)
    }

    // Determine overall success
    const success = deletedFrom.length > 0 && dbDeleted

    return NextResponse.json({
      success,
      fileId,
      fileName: file.file_name,
      deletedFrom,
      errors: errors.length > 0 ? errors : undefined,
      message: success
        ? 'File deleted successfully'
        : 'File deletion partially failed',
    })
  } catch (error) {
    console.error('[Delete API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET: Get deletion preview
 * Shows what will be deleted without actually deleting
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      )
    }

    // Get file metadata
    const { file, error: dbError } = await getFileById(fileId)
    if (dbError || !file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      fileId: file.id,
      fileName: file.file_name,
      fileType: file.file_type,
      fileSize: file.file_size,
      uploadDate: file.upload_date,
      locations: {
        supabase: {
          path: file.storage_path,
          willDelete: true,
        },
        local: {
          path: file.local_path || null,
          willDelete: !!file.local_path,
        },
        database: {
          willDelete: true,
        },
      },
      warning: 'This action cannot be undone',
    })
  } catch (error) {
    console.error('[Delete API] Preview error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
