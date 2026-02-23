/**
 * Upload PDF API Route
 *
 * POST /api/admin/upload/upload-pdf
 * Creates Supabase Storage signed upload URLs for PDF files.
 * Used by the vision scoring pipeline to upload FlexMLS 7-Photo Flyer PDFs.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-auth'

export const dynamic = 'force-dynamic'

interface UploadPDFRequest {
  clientId: string
  files: Array<{
    fileName: string
    contentType: string // Should be 'application/pdf'
    fileSize: number // Bytes
  }>
}

const BUCKET_NAME = 'reportit-pdfs'
const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
const MAX_FILES = 4 // Up to 4 FlexMLS CSV scopes = 4 PDFs

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth.success) return auth.response
    const { supabase } = auth

    const body: UploadPDFRequest = await req.json()
    const { clientId, files } = body

    if (!clientId) {
      return NextResponse.json(
        { error: 'Missing clientId' },
        { status: 400 }
      )
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES} PDF files allowed` },
        { status: 400 }
      )
    }

    // Validate file types and sizes
    for (const file of files) {
      if (file.contentType !== 'application/pdf') {
        return NextResponse.json(
          { error: `Invalid file type: ${file.contentType}. Only PDF files are accepted.` },
          { status: 400 }
        )
      }
      if (file.fileSize > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File ${file.fileName} exceeds maximum size of 100MB` },
          { status: 400 }
        )
      }
    }

    // Generate storage paths and signed upload URLs
    const timestamp = Date.now()
    const uploadUrls = await Promise.all(
      files.map(async (file) => {
        const storagePath = `${clientId}/${timestamp}/${file.fileName}`

        // Create signed upload URL (valid for 1 hour)
        const { data, error } = await supabase.storage
          .from(BUCKET_NAME)
          .createSignedUploadUrl(storagePath)

        if (error) {
          throw new Error(
            `Failed to create upload URL for ${file.fileName}: ${error.message}`
          )
        }

        return {
          fileName: file.fileName,
          storagePath,
          signedUrl: data.signedUrl,
          token: data.token,
        }
      })
    )

    return NextResponse.json({
      success: true,
      bucket: BUCKET_NAME,
      uploadUrls,
    })
  } catch (error: any) {
    console.error('[upload-pdf] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create upload URLs' },
      { status: 500 }
    )
  }
}
