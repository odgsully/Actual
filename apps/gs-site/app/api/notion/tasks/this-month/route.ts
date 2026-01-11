import { NextResponse } from 'next/server';
import {
  getTasksThisMonth,
  getMonthStart,
  getMonthEnd,
  isTasksDatabaseConfigured,
} from '@/lib/notion/tasks';

/**
 * GET /api/notion/tasks/this-month
 *
 * Returns all tasks for the current month.
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

    const tasks = await getTasksThisMonth();
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'Done').length;
    const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    const monthStart = getMonthStart();
    const monthEnd = getMonthEnd();

    return NextResponse.json(
      {
        tasks,
        stats: {
          total,
          completed,
          completionPercentage,
        },
        period: {
          start: monthStart.toISOString(),
          end: monthEnd.toISOString(),
          label: monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching monthly tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monthly tasks' },
      { status: 500 }
    );
  }
}
