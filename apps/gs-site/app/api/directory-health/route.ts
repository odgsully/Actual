/**
 * Directory Health API Route
 *
 * GET /api/directory-health
 *
 * Returns the current state of monitored directories,
 * listing any unexpected files/folders.
 *
 * SAFETY: This endpoint only performs READ operations
 * on whitelisted directories defined in config.
 */

import { NextResponse } from 'next/server';
import { scanAllDirectories, getScanSummary } from '@/lib/directory-health';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const result = await scanAllDirectories();

    // Log summary for debugging (server-side only)
    if (process.env.NODE_ENV === 'development') {
      console.log(getScanSummary(result));
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Directory health scan failed:', error);

    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        totalUnexpected: 0,
        directories: [],
        status: 'error',
        error: error instanceof Error ? error.message : 'Scan failed',
      },
      { status: 500 }
    );
  }
}
