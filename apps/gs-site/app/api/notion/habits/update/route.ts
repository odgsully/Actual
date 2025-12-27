import { NextResponse } from 'next/server';
import { isHabitsDatabaseConfigured, getTodaysRecord, createDailyRecord } from '@/lib/notion/habits';

const NOTION_API_VERSION = '2022-06-28';

/**
 * POST /api/notion/habits/update
 *
 * Updates a property on today's habit record in Notion.
 * Creates a new record if one doesn't exist for today.
 *
 * Body:
 * - property: string - The property name (e.g., "Weight", "Duolingo")
 * - value: boolean | number - The value to set
 * - type?: "checkbox" | "number" - Property type (defaults to checkbox)
 * - date?: string - Optional date (YYYY-MM-DD), defaults to today
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
    const { property, value, type = 'checkbox', date } = body;

    if (typeof property !== 'string' || property.trim() === '') {
      return NextResponse.json(
        { error: 'Property name is required' },
        { status: 400 }
      );
    }

    // Validate value based on type
    if (type === 'checkbox' && typeof value !== 'boolean') {
      return NextResponse.json(
        { error: 'Value must be a boolean for checkbox type' },
        { status: 400 }
      );
    }

    if (type === 'number' && typeof value !== 'number') {
      return NextResponse.json(
        { error: 'Value must be a number for number type' },
        { status: 400 }
      );
    }

    const targetDate = date || new Date().toISOString().split('T')[0];

    // Get or create today's record
    let record = await getTodaysRecord(targetDate);
    let pageId: string;

    if (record) {
      pageId = record.id;
    } else {
      pageId = await createDailyRecord(targetDate);
    }

    // Build the property update based on type
    const propertyUpdate: Record<string, unknown> = {};

    if (type === 'number') {
      propertyUpdate[property] = { number: value };
    } else {
      propertyUpdate[property] = { checkbox: value };
    }

    // Update the page
    const apiKey = process.env.NOTION_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'NOTION_API_KEY not configured' },
        { status: 503 }
      );
    }

    const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Notion-Version': NOTION_API_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ properties: propertyUpdate }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Notion API error:', error);
      return NextResponse.json(
        { error: `Failed to update habit: ${response.status}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      pageId,
      property,
      value,
      type,
      date: targetDate,
    });
  } catch (error) {
    console.error('Error updating habit:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update habit' },
      { status: 500 }
    );
  }
}
