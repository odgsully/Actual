import { NextResponse } from 'next/server';
import { getOverdueTasks, isTasksDatabaseConfigured } from '@/lib/notion/tasks';

/**
 * GET /api/notion/tasks/overdue
 *
 * Returns overdue tasks with days overdue calculation.
 */
export async function GET() {
  try {
    if (!isTasksDatabaseConfigured()) {
      return NextResponse.json(
        { error: 'Tasks database not configured' },
        { status: 503 }
      );
    }

    const overdueTasks = await getOverdueTasks();

    return NextResponse.json(overdueTasks, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error fetching overdue tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch overdue tasks' },
      { status: 500 }
    );
  }
}
