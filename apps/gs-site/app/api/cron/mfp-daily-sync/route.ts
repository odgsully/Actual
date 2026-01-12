import { NextRequest, NextResponse } from 'next/server';
import {
  getMFPCookies,
  getMFPConnectionStatus,
  fetchMFPDailyDiary,
  storeFoodDiary,
  updateSyncStatus,
} from '@/lib/myfitnesspal/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Longer timeout for cron operations
export const maxDuration = 300; // 5 minutes

/**
 * GET /api/cron/mfp-daily-sync
 *
 * Vercel Cron Job: Daily sync of MyFitnessPal data
 * Schedule: 0 6 * * * (6 AM UTC daily)
 *
 * Syncs the last 7 days of data to catch any late entries.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[MFP Daily Sync] Starting...');

    // Check if connected
    const connectionStatus = await getMFPConnectionStatus();
    if (!connectionStatus.connected) {
      console.log('[MFP Daily Sync] Not connected, skipping');
      return NextResponse.json({
        success: true,
        skipped: true,
        message: 'MyFitnessPal not connected',
      });
    }

    // Get cookies
    const cookies = await getMFPCookies();
    if (!cookies) {
      console.log('[MFP Daily Sync] No cookies found, skipping');
      return NextResponse.json({
        success: true,
        skipped: true,
        message: 'No MFP credentials found',
      });
    }

    const username = connectionStatus.username || 'garrett_sullivan';
    const days = 7; // Sync last 7 days to catch late entries

    console.log(`[MFP Daily Sync] Syncing ${days} days for user ${username}`);

    // Mark sync as in progress
    await updateSyncStatus({
      last_sync_status: 'in_progress',
      last_sync_error: null,
    });

    // Calculate date range (yesterday back to 7 days ago)
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 1); // Start from yesterday
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days + 1);

    // Fetch data for each day
    let daysProcessed = 0;
    let entriesSynced = 0;
    const errors: string[] = [];

    for (let d = 0; d < days; d++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + d);
      const dateStr = currentDate.toISOString().split('T')[0];

      try {
        console.log(`[MFP Daily Sync] Fetching ${dateStr}...`);

        // Fetch daily diary via HTML scraping
        const diaryData = await fetchMFPDailyDiary(cookies, username, currentDate);

        // Only store if there's actual data
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
          entriesSynced++;
          console.log(`[MFP Daily Sync] ${dateStr}: ${diaryData.calories} cal`);
        } else {
          console.log(`[MFP Daily Sync] ${dateStr}: No data logged`);
        }

        daysProcessed++;

        // Rate limiting - wait 1 second between requests
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';

        if (errorMsg.includes('SESSION_EXPIRED')) {
          // Session expired - update status and stop
          console.error('[MFP Daily Sync] Session expired');

          await updateSyncStatus({
            last_sync_at: new Date().toISOString(),
            last_sync_status: 'session_expired',
            last_sync_error: 'Session expired. Please reconnect MyFitnessPal.',
            days_synced: daysProcessed,
          });

          return NextResponse.json({
            success: false,
            daysProcessed,
            entriesSynced,
            error: 'Session expired. Please reconnect MyFitnessPal.',
          });
        }

        console.error(`[MFP Daily Sync] Error fetching ${dateStr}:`, error);
        errors.push(`${dateStr}: ${errorMsg}`);
      }
    }

    // Update sync status
    const finalStatus = errors.length > 0 ? 'failed' : 'success';
    await updateSyncStatus({
      last_sync_at: new Date().toISOString(),
      last_sync_status: finalStatus,
      last_sync_error: errors.length > 0 ? errors.join('; ') : null,
      days_synced: daysProcessed,
      latest_date: endDate.toISOString().split('T')[0],
    });

    console.log(
      `[MFP Daily Sync] Complete. Processed ${daysProcessed} days, synced ${entriesSynced} entries.`
    );

    return NextResponse.json({
      success: errors.length === 0,
      daysProcessed,
      entriesSynced,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('[MFP Daily Sync] Fatal error:', error);

    await updateSyncStatus({
      last_sync_at: new Date().toISOString(),
      last_sync_status: 'failed',
      last_sync_error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
