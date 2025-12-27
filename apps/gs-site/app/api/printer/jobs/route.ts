import { NextResponse } from 'next/server';
import { getJobs, isPrinterConfigured } from '@/lib/printer/client';
import type { PrintJob, PrinterApiResponse } from '@/lib/printer/types';

/**
 * GET /api/printer/jobs
 *
 * Returns the current print queue.
 */
export async function GET(): Promise<NextResponse<PrinterApiResponse<PrintJob[]>>> {
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

    const jobs = await getJobs();

    return NextResponse.json(
      {
        success: true,
        data: jobs,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          // Very short cache - queue changes frequently
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=20',
        },
      }
    );
  } catch (error) {
    console.error('[Printer API] Error getting print queue:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get print queue',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
