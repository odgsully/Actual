import { NextRequest, NextResponse } from 'next/server';
import { getTasksByRank, isTasksDatabaseConfigured, type TaskRank } from '@/lib/notion/tasks';

/**
 * GET /api/notion/tasks/by-rank?rank=0
 *
 * Returns tasks filtered by priority rank (0-3).
 */
export async function GET(request: NextRequest) {
  try {
    if (!isTasksDatabaseConfigured()) {
      return NextResponse.json(
        { error: 'Tasks database not configured' },
        { status: 503 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const rankStr = searchParams.get('rank');

    if (rankStr === null) {
      return NextResponse.json(
        { error: 'Missing rank parameter' },
        { status: 400 }
      );
    }

    const rank = parseInt(rankStr, 10);

    // Validate rank parameter
    if (isNaN(rank) || ![0, 1, 2, 3].includes(rank)) {
      return NextResponse.json(
        { error: 'Invalid rank parameter (0-3)' },
        { status: 400 }
      );
    }

    const tasks = await getTasksByRank(rank as TaskRank);

    return NextResponse.json(tasks, {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Error fetching tasks by rank:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}
