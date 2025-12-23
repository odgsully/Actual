import { NextResponse } from 'next/server';
import { getAllHabitStreaks, isHabitsDatabaseConfigured } from '@/lib/notion/habits';

/**
 * GET /api/notion/habits/streaks
 *
 * Returns all habit streaks sorted by current streak descending.
 */
export async function GET() {
  try {
    if (!isHabitsDatabaseConfigured()) {
      return NextResponse.json(
        { error: 'Habits database not configured' },
        { status: 503 }
      );
    }

    const streaks = await getAllHabitStreaks();

    return NextResponse.json(streaks, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error fetching habit streaks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch habit streaks' },
      { status: 500 }
    );
  }
}
