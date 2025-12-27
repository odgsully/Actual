import { NextRequest, NextResponse } from 'next/server';
import { getWhoopTokens, getHistoricalData } from '@/lib/whoop/client';

/**
 * GET /api/whoop/historical
 *
 * Fetches historical WHOOP data for trend analysis.
 * Supports 7, 14, or 30 day ranges.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const daysParam = searchParams.get('days');
  const days = daysParam ? parseInt(daysParam, 10) : 7;

  // Validate days parameter
  if (![7, 14, 30].includes(days)) {
    return NextResponse.json(
      { error: 'Invalid days parameter. Use 7, 14, or 30.' },
      { status: 400 }
    );
  }

  // For now, use default user since we don't have full auth
  const userId = 'default-user';

  try {
    const tokens = await getWhoopTokens(userId);

    if (!tokens) {
      return NextResponse.json(
        {
          error: 'WHOOP not connected',
          connected: false,
          connectUrl: '/api/auth/whoop',
        },
        { status: 401 }
      );
    }

    const data = await getHistoricalData(tokens.access_token, days);

    // Transform data for charting (V2 API structure)
    const chartData = data.recoveries.map((recovery, index) => {
      const cycle = data.cycles[index];
      return {
        date: recovery.created_at,
        recovery: recovery.score?.recovery_score || 0,
        hrv: recovery.score?.hrv_rmssd_milli || null,
        rhr: recovery.score?.resting_heart_rate || null,
        strain: cycle?.score?.strain || null,
      };
    }).reverse(); // Oldest first for charts

    return NextResponse.json(
      {
        days,
        chartData,
        raw: {
          recoveries: data.recoveries,
          cycles: data.cycles,
        },
        lastUpdated: new Date().toISOString(),
      },
      {
        headers: {
          // 30 minutes cache for historical data (doesn't change often)
          'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
        },
      }
    );
  } catch (error) {
    console.error('[WHOOP API] Error fetching historical data:', error);

    if (error instanceof Error) {
      if (error.message === 'WHOOP_TOKEN_EXPIRED') {
        return NextResponse.json(
          {
            error: 'WHOOP connection expired',
            connected: false,
            connectUrl: '/api/auth/whoop',
          },
          { status: 401 }
        );
      }
      if (error.message === 'WHOOP_RATE_LIMITED') {
        return NextResponse.json(
          { error: 'Rate limited by WHOOP API. Please try again in a few minutes.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch WHOOP historical data' },
      { status: 500 }
    );
  }
}
