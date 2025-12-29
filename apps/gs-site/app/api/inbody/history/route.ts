import { NextResponse } from 'next/server';
import {
  getInBodyHistoricalForUser,
  isInBodyConfigured,
  getMockInBodyScan,
} from '@/lib/inbody/client';
import type { InBodyScan, InBodyHistoricalData } from '@/lib/inbody/client';

// Force dynamic - DB queries must be fresh
export const dynamic = 'force-dynamic';

/**
 * GET /api/inbody/history
 *
 * Fetches historical InBody scans for trending visualization.
 *
 * Query params:
 * - limit: Number of scans to return (default: 10, max: 50)
 * - mock: Return mock data for testing
 *
 * InBody data is very low frequency, so caching is aggressive:
 * - 24 hour cache with 7 day stale-while-revalidate
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const useMock = searchParams.get('mock') === 'true';
  const limitParam = searchParams.get('limit');
  const limit = Math.min(Math.max(parseInt(limitParam || '10', 10), 1), 50);

  // Return mock data if requested
  if (useMock) {
    const mockScans = generateMockHistory(limit);
    return NextResponse.json({
      ...mockScans,
      isMock: true,
    });
  }

  // Check configuration
  if (!isInBodyConfigured()) {
    return NextResponse.json(
      {
        error: 'InBody not configured',
        setupUrl: '/admin/connections',
      },
      { status: 503 }
    );
  }

  const userId = 'default-user';

  try {
    const historical = await getInBodyHistoricalForUser(userId, limit);

    if (!historical) {
      return NextResponse.json(
        {
          error: 'InBody not connected',
          setupUrl: '/admin/connections',
        },
        { status: 401 }
      );
    }

    return NextResponse.json(historical, {
      headers: {
        // 24 hour cache, 7 day stale-while-revalidate
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    });
  } catch (error) {
    console.error('[INBODY API] Error fetching history:', error);

    if (error instanceof Error) {
      if (error.message === 'INBODY_RATE_LIMITED') {
        return NextResponse.json(
          { error: 'Rate limited. Please try again later.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch InBody history' },
      { status: 500 }
    );
  }
}

/**
 * Generate mock historical data for UI development
 */
function generateMockHistory(count: number): InBodyHistoricalData {
  const scans: InBodyScan[] = [];
  const baseScan = getMockInBodyScan();

  for (let i = 0; i < count; i++) {
    const daysAgo = i * 7; // Weekly scans
    const scanDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    // Simulate gradual progress (losing fat, gaining muscle)
    const weightDelta = i * 0.2;
    const fatDelta = i * 0.15;
    const muscleDelta = i * -0.1;

    scans.push({
      id: `mock-scan-${i.toString().padStart(3, '0')}`,
      scanDate: scanDate.toISOString(),
      score: {
        ...baseScan.score,
        weight: baseScan.score.weight + weightDelta,
        bodyFatPercent: baseScan.score.bodyFatPercent + fatDelta,
        skeletalMuscleMass: baseScan.score.skeletalMuscleMass - muscleDelta,
        percentBodyFat: baseScan.score.bodyFatPercent + fatDelta,
      },
    });
  }

  // Calculate trends
  const newest = scans[0];
  const oldest = scans[scans.length - 1];

  return {
    scans,
    trends: {
      weightChange: newest.score.weight - oldest.score.weight,
      fatChange: newest.score.bodyFatPercent - oldest.score.bodyFatPercent,
      muscleChange: newest.score.skeletalMuscleMass - oldest.score.skeletalMuscleMass,
    },
  };
}
