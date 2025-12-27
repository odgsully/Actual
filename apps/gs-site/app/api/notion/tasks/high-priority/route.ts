import { NextResponse } from 'next/server';
import { getHighPriorityTasks, isTasksDatabaseConfigured } from '@/lib/notion/tasks';

/**
 * GET /api/notion/tasks/high-priority
 *
 * Returns high priority tasks (rank 0 and 1) that aren't completed.
 */
export async function GET() {
  try {
    if (!isTasksDatabaseConfigured()) {
      return NextResponse.json(
        { error: 'Tasks database not configured' },
        { status: 503 }
      );
    }

    const tasks = await getHighPriorityTasks();

    return NextResponse.json(tasks, {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Error fetching high priority tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch high priority tasks' },
      { status: 500 }
    );
  }
}
