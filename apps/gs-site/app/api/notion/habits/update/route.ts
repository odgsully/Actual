import { NextResponse } from 'next/server';
import { isHabitsDatabaseConfigured, updateHabitForToday, updatePropertyForToday } from '@/lib/notion/habits';

/**
 * POST /api/notion/habits/update
 *
 * Updates a property on today's habit record in Notion.
 * Supports multiple property types: checkbox, number.
 *
 * Body (New Format - preferred):
 * - property: string - The property name in Notion
 * - value: any - The value to set (boolean for checkbox, number for number)
 * - type: 'checkbox' | 'number' - The property type
 *
 * Body (Legacy Format - backward compatible):
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

    // Check for new format (property, value, type)
    if (body.property && body.type) {
      const { property, value, type } = body;

      if (typeof property !== 'string' || property.trim() === '') {
        return NextResponse.json(
          { error: 'Property name is required' },
          { status: 400 }
        );
      }

      // Validate based on type
      if (type === 'number') {
        if (typeof value !== 'number' || isNaN(value)) {
          return NextResponse.json(
            { error: 'Value must be a valid number for number type' },
            { status: 400 }
          );
        }
      } else if (type === 'checkbox') {
        if (typeof value !== 'boolean') {
          return NextResponse.json(
            { error: 'Value must be a boolean for checkbox type' },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { error: `Unsupported property type: ${type}. Supported types: checkbox, number` },
          { status: 400 }
        );
      }

      const success = await updatePropertyForToday(property, value, type);

      if (!success) {
        return NextResponse.json(
          { error: 'Failed to update property - check server logs' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        property,
        value,
        type,
      });
    }

    // Legacy format (habit, completed)
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
