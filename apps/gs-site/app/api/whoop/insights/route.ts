import { NextRequest, NextResponse } from 'next/server';
import { getWhoopInsightsForUser } from '@/lib/whoop/client';

/**
 * GET /api/whoop/insights
 *
 * Fetches the latest WHOOP recovery and strain data.
 * Returns cached data with 15-minute stale-while-revalidate.
 */
export async function GET(request: NextRequest) {
  // For now, use default user since we don't have full auth
  // In production, this would come from the session
  const userId = 'default-user';

  try {
    const insights = await getWhoopInsightsForUser(userId);

    if (!insights) {
      return NextResponse.json(
        {
          error: 'WHOOP not connected',
          connected: false,
          connectUrl: '/api/auth/whoop',
        },
        { status: 401 }
      );
    }

    if (!insights.connected) {
      return NextResponse.json(
        {
          error: 'WHOOP connection expired',
          connected: false,
          connectUrl: '/api/auth/whoop',
        },
        { status: 401 }
      );
    }

    return NextResponse.json(insights, {
      headers: {
        // 15 minutes cache, 30 minutes stale-while-revalidate
        'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
      },
    });
  } catch (error) {
    console.error('[WHOOP API] Error fetching insights:', error);

    if (error instanceof Error) {
      if (error.message === 'WHOOP_RATE_LIMITED') {
        return NextResponse.json(
          { error: 'Rate limited by WHOOP API. Please try again in a few minutes.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch WHOOP data' },
      { status: 500 }
    );
  }
}
