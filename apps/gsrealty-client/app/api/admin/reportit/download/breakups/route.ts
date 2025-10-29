/**
 * ReportIt Download API Route - Breakups
 *
 * Serves generated break-ups report ZIP files
 *
 * @route GET /api/admin/reportit/download/breakups
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const LOG_PREFIX = '[ReportIt API - Download Breakups]';
const UPLOAD_DIR = join(process.cwd(), 'tmp', 'reportit');

export async function GET(request: NextRequest): Promise<NextResponse> {
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

    // Construct file path - try both .xlsx and .zip
    let fileName = `${fileId}.xlsx`;
    let filePath = join(UPLOAD_DIR, fileName);
    let contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    let fileExtension = 'xlsx';

    // Check if .xlsx exists, otherwise try .zip
    if (!existsSync(filePath)) {
      fileName = `${fileId}.zip`;
      filePath = join(UPLOAD_DIR, fileName);
      contentType = 'application/zip';
      fileExtension = 'zip';
    }

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
      type: fileExtension,
    });

    // Extract original filename or generate one
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const downloadFileName = `Breakups_Report_${timestamp}.${fileExtension}`;

    // Return file as download
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
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
