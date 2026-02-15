/**
 * ReportIt Download API Route - PropertyRadar
 *
 * Serves generated PropertyRadar XLSX files
 *
 * @route GET /api/admin/reportit/download/propertyradar
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { requireAdmin } from '@/lib/api/admin-auth';

const LOG_PREFIX = '[ReportIt API - Download PropertyRadar]';
const UPLOAD_DIR = join(process.cwd(), 'tmp', 'reportit');

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Verify admin authentication
  const auth = await requireAdmin()
  if (!auth.success) return auth.response

  console.log(`${LOG_PREFIX} Received download request`);

  try {
    // Get fileId from query params
    const searchParams = request.nextUrl.searchParams;
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'File ID required',
            code: 'NO_FILE_ID',
          },
        },
        { status: 400 }
      );
    }

    // Construct file path
    const fileName = `${fileId}.xlsx`;
    const filePath = join(UPLOAD_DIR, fileName);

    console.log(`${LOG_PREFIX} Looking for file:`, filePath);

    // Check if file exists
    if (!existsSync(filePath)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'File not found',
            code: 'FILE_NOT_FOUND',
          },
        },
        { status: 404 }
      );
    }

    // Read file
    const buffer = await readFile(filePath);

    console.log(`${LOG_PREFIX} Serving file:`, {
      fileId,
      size: buffer.length,
    });

    // Extract original filename or generate one
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const downloadFileName = `PropertyRadar_Extract_${timestamp}.xlsx`;

    // Return file as download
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${downloadFileName}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error(`${LOG_PREFIX} Download error:`, error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          code: 'INTERNAL_ERROR',
        },
      },
      { status: 500 }
    );
  }
}
