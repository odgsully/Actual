/**
 * Store Processed File API Route
 *
 * POST /api/admin/upload/store
 * Stores processed files to Supabase Storage, local folder, and database
 */

import { NextRequest, NextResponse } from 'next/server'
import { uploadBufferToSupabase } from '@/lib/storage/supabase-storage'
import { saveFileToFolder, createClientFolder } from '@/lib/storage/local-storage'
import { recordFileUpload, updateFileLocalPath, updateFileStatus } from '@/lib/database/files'
import { getClientById } from '@/lib/database/clients'
import { generateStoragePath, generateFilename } from '@/lib/storage/config'
import type { FileType, UploadType } from '@/lib/types/storage'

interface StoreFileRequest {
  clientId: string
  fileName: string
  fileType: FileType
  uploadType?: UploadType
  fileBuffer: string // Base64 encoded
  contentType: string
  uploadedBy: string
}

/**
 * POST: Store processed file
 *
 * Request body:
 * - clientId: Client UUID
 * - fileName: Original file name
 * - fileType: 'csv' | 'xlsx' | 'html' | 'pdf'
 * - uploadType: Optional 'direct_comps' | 'all_scopes' | 'half_mile'
 * - fileBuffer: Base64 encoded file data
 * - contentType: MIME type
 * - uploadedBy: User UUID who uploaded
 *
 * Response:
 * - fileId: Database record ID
 * - storagePath: Supabase Storage path
 * - localPath: Local MacOS folder path
 * - downloadUrl: Supabase public URL
 */
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body: StoreFileRequest = await req.json()
    const { clientId, fileName, fileType, uploadType, fileBuffer, contentType, uploadedBy } = body

    // Validate required fields
    if (!clientId || !fileName || !fileType || !fileBuffer || !uploadedBy) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get client details
    const { client, error: clientError } = await getClientById(clientId)
    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Decode base64 buffer
    const buffer = Buffer.from(fileBuffer, 'base64')

    // Generate unique filename
    const uniqueFileName = generateFilename(
      `${client.first_name}_${client.last_name}`,
      uploadType || 'upload',
      fileName
    )

    // 1. Upload to Supabase Storage
    const storagePath = generateStoragePath(clientId, 'processed', uniqueFileName)
    const { url, error: uploadError } = await uploadBufferToSupabase(
      buffer,
      storagePath,
      contentType
    )

    if (uploadError) {
      console.error('[Store API] Supabase upload failed:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload to cloud storage' },
        { status: 500 }
      )
    }

    // 2. Record in database
    const { file, error: dbError } = await recordFileUpload({
      clientId,
      fileName: uniqueFileName,
      fileType,
      uploadType,
      storagePath,
      fileSize: buffer.length,
      uploadedBy,
      processingStatus: 'complete',
    })

    if (dbError || !file) {
      console.error('[Store API] Database record failed:', dbError)
      return NextResponse.json(
        { error: 'Failed to record file metadata' },
        { status: 500 }
      )
    }

    // 3. Save to local MacOS folder
    const currentDate = new Date()
    const { folderPath, folderName, error: folderError } = await createClientFolder(
      client.last_name,
      currentDate
    )

    let localPath: string | null = null
    if (!folderError && folderPath) {
      const { path, error: saveError } = await saveFileToFolder(
        folderName,
        uniqueFileName,
        buffer
      )

      if (!saveError && path) {
        localPath = path
        // Update database with local path
        await updateFileLocalPath(file.id, path)
      } else {
        console.warn('[Store API] Local save failed (non-critical):', saveError)
      }
    } else {
      console.warn('[Store API] Folder creation failed (non-critical):', folderError)
    }

    // Return success
    return NextResponse.json({
      success: true,
      fileId: file.id,
      storagePath,
      localPath,
      downloadUrl: url,
      fileName: uniqueFileName,
      folderName,
    })
  } catch (error) {
    console.error('[Store API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET: Check storage system health
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'GSRealty File Storage',
    endpoints: {
      store: 'POST /api/admin/upload/store',
      download: 'GET /api/admin/upload/download/[fileId]',
      delete: 'DELETE /api/admin/upload/delete/[fileId]',
    },
  })
}
