import { NextRequest, NextResponse } from 'next/server';
import { printPdf, isPrinterConfigured, getStatus } from '@/lib/printer/client';
import type { PrintSubmitResponse, PrinterApiResponse, PrintJobOptions } from '@/lib/printer/types';

/**
 * POST /api/printer/print
 *
 * Submit a print job to the Brother printer.
 *
 * Body (multipart/form-data or JSON):
 * - document: PDF file or base64 encoded PDF
 * - jobName: Optional job name
 * - copies: Optional number of copies (default: 1)
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<PrinterApiResponse<PrintSubmitResponse>>> {
  try {
    if (!isPrinterConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Printer not configured. Set BROTHER_PRINTER_IP environment variable.',
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    const contentType = request.headers.get('content-type') || '';

    let documentBuffer: Buffer;
    let jobName: string | undefined;
    let options: PrintJobOptions = {};

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData();
      const file = formData.get('document') as File | null;
      const name = formData.get('jobName') as string | null;
      const copies = formData.get('copies') as string | null;

      if (!file) {
        return NextResponse.json(
          {
            success: false,
            error: 'No document provided. Include a PDF file as "document" in form data.',
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      documentBuffer = Buffer.from(arrayBuffer);
      jobName = name || file.name || undefined;

      if (copies) {
        options.copies = parseInt(copies, 10);
      }
    } else if (contentType.includes('application/json')) {
      // Handle JSON with base64 document
      const body = await request.json();

      if (!body.document) {
        return NextResponse.json(
          {
            success: false,
            error: 'No document provided. Include base64 PDF as "document" in JSON body.',
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
      }

      documentBuffer = Buffer.from(body.document, 'base64');
      jobName = body.jobName;
      options = {
        copies: body.copies,
        colorMode: body.colorMode,
        duplex: body.duplex,
        quality: body.quality,
      };
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid content type. Use multipart/form-data or application/json.',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Validate PDF (basic magic number check)
    if (documentBuffer.slice(0, 4).toString() !== '%PDF') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid document format. Only PDF files are supported.',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Submit print job
    const result = await printPdf(documentBuffer, jobName, options);

    // Get current printer status after submission
    const printerStatus = await getStatus();

    return NextResponse.json({
      success: result.success,
      data: {
        job: result,
        printerStatus,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Printer API] Error submitting print job:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit print job',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
