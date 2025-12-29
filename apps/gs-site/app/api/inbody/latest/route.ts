import { NextResponse } from 'next/server';
import {
  getInBodyInsightsForUser,
  isInBodyConfigured,
  getMockInBodyInsights,
} from '@/lib/inbody/client';

// Force dynamic - DB queries must be fresh
export const dynamic = 'force-dynamic';

/**
 * GET /api/inbody/latest
 *
 * Fetches the latest InBody scan data.
 *
 * InBody data is LOW FREQUENCY (weekly gym scans), so we use aggressive caching:
 * - 24 hour cache with 7 day stale-while-revalidate
 *
 * Query params:
 * - mock=true: Return mock data for testing without API credentials
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const useMock = searchParams.get('mock') === 'true';

  // Return mock data if requested (for UI development)
  if (useMock) {
    const mockInsights = getMockInBodyInsights();
    return NextResponse.json({
      ...mockInsights,
      isMock: true,
    });
  }

  // Check configuration
  if (!isInBodyConfigured()) {
    return NextResponse.json(
      {
        error: 'InBody not configured',
        connected: false,
        setupUrl: '/admin/connections',
        message: 'Set INBODY_API_KEY environment variable',
      },
      { status: 503 }
    );
  }

  // For now, use default user since we don't have full auth
  const userId = 'default-user';

  try {
    const insights = await getInBodyInsightsForUser(userId);

    if (!insights.connected) {
      return NextResponse.json(
        {
          error: 'InBody not connected',
          connected: false,
          setupUrl: '/admin/connections',
          message: 'Please configure your LookinBody credentials',
        },
        { status: 401 }
      );
    }

    return NextResponse.json(insights, {
      headers: {
        // 24 hour cache, 7 day stale-while-revalidate
        // InBody data is very low-frequency (weekly scans)
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    });
  } catch (error) {
    console.error('[INBODY API] Error fetching latest scan:', error);

    if (error instanceof Error) {
      if (error.message === 'INBODY_RATE_LIMITED') {
        return NextResponse.json(
          { error: 'Rate limited by InBody API. Please try again later.' },
          { status: 429 }
        );
      }
      if (error.message === 'INBODY_AUTH_FAILED') {
        return NextResponse.json(
          {
            error: 'InBody authentication failed',
            connected: false,
            setupUrl: '/admin/connections',
          },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch InBody data' },
      { status: 500 }
    );
  }
}
