import { NextRequest, NextResponse } from 'next/server';
import {
  getMFPCookies,
  getMFPConnectionStatus,
  fetchMFPDailyDiary,
  storeFoodDiary,
  updateSyncStatus,
} from '@/lib/myfitnesspal/client';
import type { MFPSyncRequest, MFPSyncResponse } from '@/lib/myfitnesspal/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Longer timeout for sync operations
export const maxDuration = 60;

/**
 * POST /api/myfitnesspal/sync
 *
 * Manually trigger a sync of MFP data.
 * Fetches data for the specified number of days (default: 7).
 */
export async function POST(request: NextRequest): Promise<NextResponse<MFPSyncResponse>> {
  try {
    // Check if connected
    const connectionStatus = await getMFPConnectionStatus();
    if (!connectionStatus.connected) {
      return NextResponse.json(
        {
          success: false,
          daysProcessed: 0,
          newEntries: 0,
          updatedEntries: 0,
          error: 'MyFitnessPal not connected. Please connect first.',
        },
        { status: 400 }
      );
    }

    // Get cookies
    const cookies = await getMFPCookies();
    if (!cookies) {
      return NextResponse.json(
        {
          success: false,
          daysProcessed: 0,
          newEntries: 0,
          updatedEntries: 0,
          error: 'No MFP credentials found',
        },
        { status: 400 }
      );
    }

    // Parse request body
    let body: MFPSyncRequest = { days: 7 };
    try {
      body = await request.json();
    } catch {
      // Use defaults if no body
    }

    const days = body.days || 7;
    const username = connectionStatus.username || 'garrett_sullivan';

    console.log(`[MFP Sync] Starting sync for ${days} days...`);

    // Mark sync as in progress
    await updateSyncStatus({
      last_sync_status: 'in_progress',
      last_sync_error: null,
    });

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);

    // Fetch data for each day
    let daysProcessed = 0;
    let newEntries = 0;
    const errors: string[] = [];

    for (let d = 0; d < days; d++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + d);
      const dateStr = currentDate.toISOString().split('T')[0];

      try {
        console.log(`[MFP Sync] Fetching ${dateStr}...`);

        // Fetch daily diary (HTML scraping fallback)
        const diaryData = await fetchMFPDailyDiary(cookies, username, currentDate);

        // Store the data
        if (diaryData.calories > 0) {
          await storeFoodDiary([
            {
              date: dateStr,
              calories: diaryData.calories,
              carbs_g: diaryData.carbs,
              fat_g: diaryData.fat,
              protein_g: diaryData.protein,
              meals_logged: diaryData.mealsLogged,
            },
          ]);
          newEntries++;
        }

        daysProcessed++;

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';

        if (errorMsg.includes('SESSION_EXPIRED')) {
          // Session expired - stop sync and update status
          await updateSyncStatus({
            last_sync_at: new Date().toISOString(),
            last_sync_status: 'session_expired',
            last_sync_error: 'Session expired. Please reconnect.',
            days_synced: daysProcessed,
          });

          return NextResponse.json(
            {
              success: false,
              daysProcessed,
              newEntries,
              updatedEntries: 0,
              error: 'Session expired. Please reconnect MyFitnessPal.',
            },
            { status: 401 }
          );
        }

        console.error(`[MFP Sync] Error fetching ${dateStr}:`, error);
        errors.push(`${dateStr}: ${errorMsg}`);
      }
    }

    // Update sync status
    await updateSyncStatus({
      last_sync_at: new Date().toISOString(),
      last_sync_status: errors.length > 0 ? 'failed' : 'success',
      last_sync_error: errors.length > 0 ? errors.join('; ') : null,
      days_synced: daysProcessed,
      latest_date: endDate.toISOString().split('T')[0],
    });

    console.log(
      `[MFP Sync] Complete. Processed ${daysProcessed} days, ${newEntries} new entries.`
    );

    return NextResponse.json({
      success: errors.length === 0,
      daysProcessed,
      newEntries,
      updatedEntries: 0,
      error: errors.length > 0 ? `Errors: ${errors.join('; ')}` : undefined,
    });
  } catch (error) {
    console.error('[MFP Sync] Error:', error);

    await updateSyncStatus({
      last_sync_at: new Date().toISOString(),
      last_sync_status: 'failed',
      last_sync_error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      {
        success: false,
        daysProcessed: 0,
        newEntries: 0,
        updatedEntries: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
