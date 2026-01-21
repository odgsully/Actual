/**
 * Download File API Route
 *
 * GET /api/admin/upload/download/[fileId]
 * Downloads file from Supabase Storage by file ID
 */

import { NextRequest, NextResponse } from 'next/server'
import { getFileById } from '@/lib/database/files'
import { downloadFromSupabase, createSignedUrl } from '@/lib/storage/supabase-storage'
import { requireAdmin } from '@/lib/api/admin-auth'

/**
 * GET: Download file by ID
 *
 * Path parameter:
 * - fileId: File UUID from database
 *
 * Query parameters (optional):
 * - mode: 'download' (default) | 'url'
 *   - 'download': Returns file as downloadable attachment
 *   - 'url': Returns signed URL for temporary access
 *
 * Response:
 * - mode=download: File data as blob
 * - mode=url: JSON with signed URL
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    // Verify admin authentication
    const auth = await requireAdmin()
    if (!auth.success) return auth.response

    const { fileId } = await params
    const searchParams = req.nextUrl.searchParams
    const mode = searchParams.get('mode') || 'download'

    // Validate fileId
    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      )
    }

    // Get file metadata from database
    const { file, error: dbError } = await getFileById(fileId)
    if (dbError || !file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Mode: Return signed URL
    if (mode === 'url') {
      const { url, error: urlError } = await createSignedUrl(file.storage_path, 3600)
      if (urlError || !url) {
        return NextResponse.json(
          { error: 'Failed to create download URL' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        url,
        fileName: file.file_name,
        fileSize: file.file_size,
        expiresIn: 3600, // 1 hour
      })
    }

    // Mode: Download file directly
    const { blob, error: downloadError } = await downloadFromSupabase(file.storage_path)
    if (downloadError || !blob) {
      return NextResponse.json(
        { error: 'Failed to download file' },
        { status: 500 }
      )
    }

    // Determine content type
    const contentTypeMap: Record<string, string> = {
      csv: 'text/csv',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      html: 'text/html',
      pdf: 'application/pdf',
    }
    const contentType = contentTypeMap[file.file_type] || 'application/octet-stream'

    // Return file as downloadable attachment
    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${file.file_name}"`,
        'Content-Length': file.file_size.toString(),
      },
    })
  } catch (error) {
    console.error('[Download API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
