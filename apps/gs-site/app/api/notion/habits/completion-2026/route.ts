import { NextResponse } from 'next/server';
import { isHabitsDatabaseConfigured } from '@/lib/notion/habits';

const NOTION_API_VERSION = '2022-06-28';
const HABITS_DATABASE_ID = process.env.NOTION_HABITS_DATABASE_ID || '';

/**
 * List of checkbox property names that represent habits
 */
const HABIT_PROPERTIES = [
  'Heart rate UP',
  'Duolingo',
  'Food Tracked',
  'Stillness',
  'No DAJO',
  'Box pack',
  'Across room set',
  'Box grabbed',
] as const;

const HABIT_EMOJIS: Record<string, string> = {
  'Heart rate UP': '💪',
  'Duolingo': '🦉',
  'Food Tracked': '🍎',
  'Stillness': '🧘',
  'No DAJO': '🚫',
  'Box pack': '📦',
  'Across room set': '🎯',
  'Box grabbed': '📥',
};

interface HabitCompletion2026 {
  name: string;
  emoji: string;
  completedDays: number;
  totalDays: number;
  completionRate: number;
  last7Days: boolean[]; // true = completed, most recent first
}

/**
 * GET /api/notion/habits/completion-2026
 *
 * Returns per-habit completion data for 2026 only.
 * Includes completion rate and last 7 days status.
 */
export async function GET() {
  try {
    if (!isHabitsDatabaseConfigured()) {
      return NextResponse.json(
        { error: 'Habits database not configured' },
        { status: 503 }
      );
    }

    const apiKey = process.env.NOTION_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Notion API key not configured' },
        { status: 503 }
      );
    }

    // Fetch all records from 2026
    const startDate = '2026-01-01';
    const allRecords: Array<{
      date: string;
      habits: Record<string, boolean>;
    }> = [];

    let hasMore = true;
    let startCursor: string | undefined;

    while (hasMore) {
      const response = await fetch(
        `https://api.notion.com/v1/databases/${HABITS_DATABASE_ID}/query`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Notion-Version': NOTION_API_VERSION,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filter: {
              property: 'Date',
              date: {
                on_or_after: startDate,
              },
            },
            sorts: [
              {
                property: 'Date',
                direction: 'descending',
              },
            ],
            page_size: 100,
            ...(startCursor && { start_cursor: startCursor }),
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('Notion API error:', error);
        return NextResponse.json(
          { error: 'Failed to fetch habits data' },
          { status: 500 }
        );
      }

      const data = await response.json();

      for (const page of data.results) {
        const props = page.properties || {};
        const date = props.Date?.date?.start;

        if (!date) continue;

        const habits: Record<string, boolean> = {};
        for (const habitName of HABIT_PROPERTIES) {
          habits[habitName] = props[habitName]?.checkbox === true;
        }

        allRecords.push({ date, habits });
      }

      hasMore = data.has_more;
      startCursor = data.next_cursor;
    }

    if (allRecords.length === 0) {
      return NextResponse.json({
        habits: [],
        totalDays: 0,
        year: 2026,
      });
    }

    // Sort by date descending (most recent first)
    allRecords.sort((a, b) => b.date.localeCompare(a.date));

    // Calculate per-habit completion data
    const habitCompletions: HabitCompletion2026[] = [];

    for (const habitName of HABIT_PROPERTIES) {
      const completedDays = allRecords.filter((r) => r.habits[habitName]).length;

      // Get last 7 days (most recent first)
      const last7Days = allRecords
        .slice(0, 7)
        .map((r) => r.habits[habitName]);

      habitCompletions.push({
        name: habitName,
        emoji: HABIT_EMOJIS[habitName] || '✓',
        completedDays,
        totalDays: allRecords.length,
        completionRate: allRecords.length > 0
          ? Math.round((completedDays / allRecords.length) * 100)
          : 0,
        last7Days,
      });
    }

    // Sort by completion rate descending
    habitCompletions.sort((a, b) => b.completionRate - a.completionRate);

    return NextResponse.json({
      habits: habitCompletions,
      totalDays: allRecords.length,
      year: 2026,
      asOf: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching 2026 completion data:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
