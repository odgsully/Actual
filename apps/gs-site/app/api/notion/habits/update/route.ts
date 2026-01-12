import { NextResponse } from 'next/server';
import { isHabitsDatabaseConfigured, updateHabitForToday } from '@/lib/notion/habits';

/**
 * POST /api/notion/habits/update
 *
 * Updates a checkbox habit property on today's habit record in Notion.
 *
 * Body:
 * - habit: string - The habit name (must be a valid HabitName)
 * - completed: boolean - Whether the habit is completed
 */
export async function POST(request: Request) {
  try {
    if (!isHabitsDatabaseConfigured()) {
      return NextResponse.json(
        { error: 'Habits database not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { habit, completed } = body;

    if (typeof habit !== 'string' || habit.trim() === '') {
      return NextResponse.json(
        { error: 'Habit name is required' },
        { status: 400 }
      );
    }

    if (typeof completed !== 'boolean') {
      return NextResponse.json(
        { error: 'Completed must be a boolean' },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const success = await updateHabitForToday(habit as any, completed);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update habit - check server logs' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      habit,
      completed,
    });
  } catch (error) {
    console.error('Error updating habit:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update habit' },
      { status: 500 }
    );
  }
}
