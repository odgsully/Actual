import { NextResponse } from 'next/server';
import { getStatus, isPrinterConfigured } from '@/lib/printer/client';
import type { PrintStatusResponse, PrinterApiResponse } from '@/lib/printer/types';

/**
 * GET /api/printer/status
 *
 * Returns the current status of the Brother printer.
 * Checks if printer is online, ink levels, and queue status.
 */
export async function GET(): Promise<NextResponse<PrinterApiResponse<PrintStatusResponse>>> {
  try {
    const isConfigured = isPrinterConfigured();

    if (!isConfigured) {
      return NextResponse.json(
        {
          success: false,
          error: 'Printer not configured. Set BROTHER_PRINTER_IP environment variable.',
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    const status = await getStatus();

    return NextResponse.json(
      {
        success: true,
        data: {
          status,
          isConfigured,
        },
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          // Short cache - printer status can change quickly
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    );
  } catch (error) {
    console.error('[Printer API] Error getting status:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get printer status',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
