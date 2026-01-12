import { NextResponse } from 'next/server';
import {
  getTasksThisQuarter,
  getQuarterStart,
  getQuarterEnd,
  isTasksDatabaseConfigured,
} from '@/lib/notion/tasks';

/**
 * GET /api/notion/tasks/this-quarter
 *
 * Returns all tasks for the current quarter.
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

    const tasks = await getTasksThisQuarter();
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'Done').length;
    const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    const quarterStart = getQuarterStart();
    const quarterEnd = getQuarterEnd();
    const quarter = Math.floor(quarterStart.getMonth() / 3) + 1;
    const year = quarterStart.getFullYear();

    return NextResponse.json(
      {
        tasks,
        stats: {
          total,
          completed,
          completionPercentage,
        },
        period: {
          start: quarterStart.toISOString(),
          end: quarterEnd.toISOString(),
          label: `Q${quarter} ${year}`,
          quarter,
          year,
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching quarterly tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quarterly tasks' },
      { status: 500 }
    );
  }
}
