import { NextRequest, NextResponse } from 'next/server';
import { getHabitsHeatmapData, isHabitsDatabaseConfigured } from '@/lib/notion/habits';

/**
 * GET /api/notion/habits/heatmap?days=90
 *
 * Returns habit data formatted for heatmap visualization.
 */
export async function GET(request: NextRequest) {
  try {
    if (!isHabitsDatabaseConfigured()) {
      return NextResponse.json(
        { error: 'Habits database not configured' },
        { status: 503 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '90', 10);

    // Validate days parameter
    if (isNaN(days) || days < 1 || days > 365) {
      return NextResponse.json(
        { error: 'Invalid days parameter (1-365)' },
        { status: 400 }
      );
    }

    const heatmapData = await getHabitsHeatmapData(days);

    return NextResponse.json(heatmapData, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error fetching heatmap data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch heatmap data' },
      { status: 500 }
    );
  }
}
