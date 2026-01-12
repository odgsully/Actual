import { NextResponse } from 'next/server';
import {
  getTasksThisWeek,
  getWeekStart,
  getWeekEnd,
  isTasksDatabaseConfigured,
} from '@/lib/notion/tasks';

/**
 * GET /api/notion/tasks/this-week
 *
 * Returns all tasks for the current week (Sunday to Saturday).
 * Filters by the Date field in Notion.
 */
export async function GET() {
  try {
    if (!isTasksDatabaseConfigured()) {
      return NextResponse.json(
        { error: 'Tasks database not configured' },
        { status: 503 }
      );
    }

    const tasks = await getTasksThisWeek();
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'Done').length;
    const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    const weekStart = getWeekStart();
    const weekEnd = getWeekEnd();

    return NextResponse.json(
      {
        tasks,
        stats: {
          total,
          completed,
          completionPercentage,
        },
        period: {
          start: weekStart.toISOString(),
          end: weekEnd.toISOString(),
          label: `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching weekly tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weekly tasks' },
      { status: 500 }
    );
  }
}
