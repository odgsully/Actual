import { NextResponse } from 'next/server';

/**
 * GET /api/notion/habits/insights
 *
 * Returns comprehensive habit insights including:
 * - Current streak across all habits
 * - Per-habit completion rates
 * - Weight tracking data (if available)
 * - Trend analysis
 *
 * Database Schema (Notion Habits - 16dcf08f-4499-8107-811d-000bd96cf68c):
 * - Date: date
 * - Weight: number (nullable)
 * - Heart rate UP: checkbox
 * - Duolingo: checkbox
 * - Food Tracked: checkbox
 * - Stillness: checkbox
 * - Total Progress: formula (0-1)
 */

const NOTION_API_VERSION = '2022-06-28';
const HABITS_DATABASE_ID = process.env.NOTION_HABITS_DATABASE_ID || '';

interface HabitDay {
  date: string;
  weight: number | null;
  heartRateUp: boolean;
  duolingo: boolean;
  foodTracked: boolean;
  stillness: boolean;
  totalProgress: number;
}

interface HabitsInsightsResponse {
  currentStreak: number;
  habitCompletionRates: {
    heartRateUp: number;
    duolingo: number;
    foodTracked: number;
    stillness: number;
  };
  weightData: Array<{ date: string; weight: number }>;
  latestWeight: number | null;
  weightTrend: 'up' | 'down' | 'stable' | null;
  last28Days: HabitDay[];
}

async function fetchHabitsFromNotion(days: number = 90): Promise<HabitDay[]> {
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey) {
    throw new Error('NOTION_API_KEY not configured');
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const response = await fetch(`https://api.notion.com/v1/databases/${HABITS_DATABASE_ID}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Notion-Version': NOTION_API_VERSION,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filter: {
        property: 'Date',
        date: {
          on_or_after: startDate.toISOString().split('T')[0],
        },
      },
      sorts: [{ property: 'Date', direction: 'descending' }],
      page_size: 100,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Notion API error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  return data.results.map((page: any) => ({
    date: page.properties.Date?.date?.start ?? '',
    weight: page.properties.Weight?.number ?? null,
    heartRateUp: page.properties['Heart rate UP']?.checkbox ?? false,
    duolingo: page.properties.Duolingo?.checkbox ?? false,
    foodTracked: page.properties['Food Tracked']?.checkbox ?? false,
    stillness: page.properties.Stillness?.checkbox ?? false,
    totalProgress: page.properties['Total Progress']?.formula?.number ?? 0,
  }));
}

function calculateStreak(habits: HabitDay[]): number {
  if (habits.length === 0) return 0;

  const today = new Date().toISOString().split('T')[0];
  let streak = 0;

  // Sort by date descending (most recent first)
  const sortedHabits = [...habits].sort((a, b) => b.date.localeCompare(a.date));

  for (const habit of sortedHabits) {
    // Skip today (may not be complete yet)
    if (habit.date === today) continue;

    if (habit.totalProgress > 0) {
      streak++;
    } else {
      break; // Streak broken
    }
  }

  return streak;
}

function calculateCompletionRates(habits: HabitDay[], days: number = 28) {
  const recent = habits.slice(0, days);
  const total = Math.max(recent.length, 1);

  return {
    heartRateUp: recent.filter((h) => h.heartRateUp).length / total,
    duolingo: recent.filter((h) => h.duolingo).length / total,
    foodTracked: recent.filter((h) => h.foodTracked).length / total,
    stillness: recent.filter((h) => h.stillness).length / total,
  };
}

function extractWeightData(habits: HabitDay[]): Array<{ date: string; weight: number }> {
  return habits
    .filter((h) => h.weight !== null)
    .map((h) => ({ date: h.date, weight: h.weight! }))
    .sort((a, b) => a.date.localeCompare(b.date)); // Chronological order
}

function calculateWeightTrend(weightData: Array<{ date: string; weight: number }>): 'up' | 'down' | 'stable' | null {
  if (weightData.length < 2) return null;

  // Compare first week average to last week average
  const firstWeek = weightData.slice(0, Math.min(7, weightData.length));
  const lastWeek = weightData.slice(-Math.min(7, weightData.length));

  const firstAvg = firstWeek.reduce((sum, d) => sum + d.weight, 0) / firstWeek.length;
  const lastAvg = lastWeek.reduce((sum, d) => sum + d.weight, 0) / lastWeek.length;

  const diff = lastAvg - firstAvg;
  const threshold = 1; // 1 lb threshold for "stable"

  if (diff > threshold) return 'up';
  if (diff < -threshold) return 'down';
  return 'stable';
}

export async function GET() {
  try {
    if (!process.env.NOTION_API_KEY || !HABITS_DATABASE_ID) {
      return NextResponse.json(
        { error: 'Habits database not configured' },
        { status: 503 }
      );
    }

    const habits = await fetchHabitsFromNotion(90);

    const currentStreak = calculateStreak(habits);
    const habitCompletionRates = calculateCompletionRates(habits);
    const weightData = extractWeightData(habits);
    const weightTrend = calculateWeightTrend(weightData);
    const latestWeight = weightData.length > 0 ? weightData[weightData.length - 1].weight : null;

    const response: HabitsInsightsResponse = {
      currentStreak,
      habitCompletionRates,
      weightData,
      latestWeight,
      weightTrend,
      last28Days: habits.slice(0, 28),
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error fetching habits insights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch habits insights' },
      { status: 500 }
    );
  }
}
