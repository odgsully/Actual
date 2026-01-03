import { NextResponse } from 'next/server';
import {
  getMFPConnectionStatus,
  getMFPCookies,
  getSyncStatus,
  getFoodDiary,
  calculateStreak,
  getWeekAverageCalories,
  getLatestWeight,
} from '@/lib/myfitnesspal/client';
import type { MFPStatusResponse } from '@/lib/myfitnesspal/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/myfitnesspal/status
 *
 * Get MFP connection status and summary statistics.
 * Used by the tile to display current state.
 */
export async function GET(): Promise<NextResponse<MFPStatusResponse>> {
  try {
    // Check if connected
    const connectionStatus = await getMFPConnectionStatus();

    if (!connectionStatus.connected) {
      return NextResponse.json({
        connected: false,
      });
    }

    // Get sync status
    const syncStatus = await getSyncStatus();

    // Get today's data
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Get today's food diary
    const todayData = await getFoodDiary(today, today);
    const todayEntry = todayData.find((d) => d.date === todayStr);

    // Get yesterday's data if today is empty (for "yesterday" display)
    let displayEntry = todayEntry;
    let isYesterdayData = false;

    if (!todayEntry || !todayEntry.calories) {
      const yesterdayData = await getFoodDiary(yesterday, yesterday);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const yesterdayEntry = yesterdayData.find((d) => d.date === yesterdayStr);

      if (yesterdayEntry && yesterdayEntry.calories) {
        displayEntry = yesterdayEntry;
        isYesterdayData = true;
      }
    }

    // Calculate streak and week average
    const [streak, weekAvgCalories, latestWeight] = await Promise.all([
      calculateStreak(),
      getWeekAverageCalories(),
      getLatestWeight(),
    ]);

    // Determine sync status type
    let lastSyncStatus = syncStatus?.last_sync_status as MFPStatusResponse['lastSyncStatus'];
    if (lastSyncStatus === 'session_expired') {
      lastSyncStatus = 'session_expired';
    }

    return NextResponse.json(
      {
        connected: true,
        username: connectionStatus.username,
        lastSyncAt: syncStatus?.last_sync_at ?? undefined,
        lastSyncStatus,
        stats: {
          todayCalories: displayEntry?.calories ?? null,
          todayGoal: displayEntry?.calorie_goal ?? 2000, // Default goal if not set
          todayProtein: displayEntry?.protein_g ? Number(displayEntry.protein_g) : null,
          weekAvgCalories,
          streak,
          isYesterdayData,
          latestWeight: latestWeight.weightLbs,
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error) {
    console.error('[MFP Status] Error:', error);

    return NextResponse.json(
      {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
