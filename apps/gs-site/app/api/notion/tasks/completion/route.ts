import { NextResponse } from 'next/server';
import { getWabbedPercentage, isTasksDatabaseConfigured } from '@/lib/notion/tasks';

/**
 * GET /api/notion/tasks/completion
 *
 * Returns task completion stats including Wabbed percentage.
 */
export async function GET() {
  try {
    if (!isTasksDatabaseConfigured()) {
      return NextResponse.json(
        { error: 'Tasks database not configured' },
        { status: 503 }
      );
    }

    const stats = await getWabbedPercentage();

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Error fetching task completion:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task completion' },
      { status: 500 }
    );
  }
}
