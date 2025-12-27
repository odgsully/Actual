import { NextRequest, NextResponse } from 'next/server';
import { getHabitCompletionRate, isHabitsDatabaseConfigured } from '@/lib/notion/habits';

/**
 * GET /api/notion/habits/completion?days=7
 *
 * Returns habit completion rate over the specified number of days.
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
    const days = parseInt(searchParams.get('days') || '7', 10);

    // Validate days parameter
    if (isNaN(days) || days < 1 || days > 90) {
      return NextResponse.json(
        { error: 'Invalid days parameter (1-90)' },
        { status: 400 }
      );
    }

    const completionRate = await getHabitCompletionRate(days);

    return NextResponse.json(completionRate, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error fetching completion rate:', error);
    return NextResponse.json(
      { error: 'Failed to fetch completion rate' },
      { status: 500 }
    );
  }
}
