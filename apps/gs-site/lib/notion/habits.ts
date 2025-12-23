/**
 * Notion Habits Database Client
 *
 * Queries the Habits database for streak tracking, completion rates,
 * and habit history. Used by the Habits STREAKS graphic tile.
 *
 * Database Schema (expected):
 * - Name: Title (habit name)
 * - Date: Date (when habit was performed)
 * - Completed: Checkbox (whether completed)
 * - Category: Select (optional grouping)
 */

const NOTION_API_VERSION = '2022-06-28';

// TODO: Replace with actual Habits database ID from Notion
const HABITS_DATABASE_ID = process.env.NOTION_HABITS_DATABASE_ID || '';

/**
 * Get Notion API key from environment
 */
function getNotionApiKey(): string | null {
  return process.env.NOTION_API_KEY || null;
}

/**
 * Make a request to Notion API
 */
async function notionFetch(endpoint: string, body?: object): Promise<any> {
  const apiKey = getNotionApiKey();

  if (!apiKey) {
    throw new Error('NOTION_API_KEY not configured');
  }

  const url = `https://api.notion.com/v1${endpoint}`;

  const response = await fetch(url, {
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Notion-Version': NOTION_API_VERSION,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Notion API error: ${response.status} - ${error}`);
  }

  return response.json();
}

export interface HabitEntry {
  id: string;
  name: string;
  date: string; // ISO date string
  completed: boolean;
  category?: string;
}

export interface HabitStreak {
  habitName: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  completionRate7Days: number;
  completionRate30Days: number;
}

export interface HabitsDateRange {
  date: string;
  completedCount: number;
  totalCount: number;
  habits: Array<{ name: string; completed: boolean }>;
}

/**
 * Fetch habit entries for a date range
 */
export async function getHabitsForDateRange(
  startDate: Date,
  endDate: Date
): Promise<HabitEntry[]> {
  if (!HABITS_DATABASE_ID) {
    console.warn('NOTION_HABITS_DATABASE_ID not configured');
    return [];
  }

  try {
    const response = await notionFetch(`/databases/${HABITS_DATABASE_ID}/query`, {
      filter: {
        and: [
          {
            property: 'Date',
            date: {
              on_or_after: startDate.toISOString().split('T')[0],
            },
          },
          {
            property: 'Date',
            date: {
              on_or_before: endDate.toISOString().split('T')[0],
            },
          },
        ],
      },
      sorts: [
        {
          property: 'Date',
          direction: 'descending',
        },
      ],
      page_size: 100,
    });

    return response.results.map((page: any) => ({
      id: page.id,
      name: page.properties.Name?.title?.[0]?.plain_text || 'Unknown',
      date: page.properties.Date?.date?.start || '',
      completed: page.properties.Completed?.checkbox || false,
      category: page.properties.Category?.select?.name,
    }));
  } catch (error) {
    console.error('Error fetching habits:', error);
    throw error;
  }
}

/**
 * Calculate current streak for a specific habit
 */
export async function getCurrentStreak(habitName: string): Promise<number> {
  if (!HABITS_DATABASE_ID) {
    return 0;
  }

  try {
    // Get last 90 days of this habit
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);

    const response = await notionFetch(`/databases/${HABITS_DATABASE_ID}/query`, {
      filter: {
        and: [
          {
            property: 'Name',
            title: {
              equals: habitName,
            },
          },
          {
            property: 'Completed',
            checkbox: {
              equals: true,
            },
          },
          {
            property: 'Date',
            date: {
              on_or_after: startDate.toISOString().split('T')[0],
            },
          },
        ],
      },
      sorts: [
        {
          property: 'Date',
          direction: 'descending',
        },
      ],
      page_size: 100,
    });

    if (response.results.length === 0) {
      return 0;
    }

    // Calculate consecutive days from today
    const completedDates = new Set(
      response.results.map((page: any) => page.properties.Date?.date?.start)
    );

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 90; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];

      if (completedDates.has(dateStr)) {
        streak++;
      } else if (i > 0) {
        // Allow today to be incomplete, but break on any other missed day
        break;
      }
    }

    return streak;
  } catch (error) {
    console.error(`Error calculating streak for ${habitName}:`, error);
    return 0;
  }
}

/**
 * Get completion rate for all habits over a time period
 */
export async function getHabitCompletionRate(
  days: number = 7
): Promise<{ completed: number; total: number; rate: number }> {
  if (!HABITS_DATABASE_ID) {
    return { completed: 0, total: 0, rate: 0 };
  }

  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const entries = await getHabitsForDateRange(startDate, endDate);

    const completed = entries.filter((e) => e.completed).length;
    const total = entries.length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, rate };
  } catch (error) {
    console.error('Error calculating completion rate:', error);
    return { completed: 0, total: 0, rate: 0 };
  }
}

/**
 * Get all habit streaks summary
 */
export async function getAllHabitStreaks(): Promise<HabitStreak[]> {
  if (!HABITS_DATABASE_ID) {
    return [];
  }

  try {
    // Get all habits from last 90 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);

    const entries = await getHabitsForDateRange(startDate, endDate);

    // Group by habit name
    const habitGroups = new Map<string, HabitEntry[]>();
    entries.forEach((entry) => {
      const existing = habitGroups.get(entry.name) || [];
      existing.push(entry);
      habitGroups.set(entry.name, existing);
    });

    // Calculate streaks for each habit
    const streaks: HabitStreak[] = [];

    for (const [habitName, habitEntries] of habitGroups) {
      const completedEntries = habitEntries.filter((e) => e.completed);
      const completedDates = new Set(completedEntries.map((e) => e.date));

      // Current streak
      let currentStreak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < 90; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];

        if (completedDates.has(dateStr)) {
          currentStreak++;
        } else if (i > 0) {
          break;
        }
      }

      // Longest streak (simplified - just use current for now)
      const longestStreak = currentStreak;

      // Last completed date
      const sortedDates = Array.from(completedDates).sort().reverse();
      const lastCompletedDate = sortedDates[0] || null;

      // 7-day rate
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const last7Days = habitEntries.filter(
        (e) => new Date(e.date) >= sevenDaysAgo
      );
      const completed7 = last7Days.filter((e) => e.completed).length;
      const completionRate7Days =
        last7Days.length > 0 ? Math.round((completed7 / 7) * 100) : 0;

      // 30-day rate
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const last30Days = habitEntries.filter(
        (e) => new Date(e.date) >= thirtyDaysAgo
      );
      const completed30 = last30Days.filter((e) => e.completed).length;
      const completionRate30Days =
        last30Days.length > 0 ? Math.round((completed30 / 30) * 100) : 0;

      streaks.push({
        habitName,
        currentStreak,
        longestStreak,
        lastCompletedDate,
        completionRate7Days,
        completionRate30Days,
      });
    }

    // Sort by current streak descending
    return streaks.sort((a, b) => b.currentStreak - a.currentStreak);
  } catch (error) {
    console.error('Error getting habit streaks:', error);
    return [];
  }
}

/**
 * Get habit data formatted for heatmap visualization
 * Returns data for the last N days grouped by date
 */
export async function getHabitsHeatmapData(
  days: number = 90
): Promise<HabitsDateRange[]> {
  if (!HABITS_DATABASE_ID) {
    return [];
  }

  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const entries = await getHabitsForDateRange(startDate, endDate);

    // Group by date
    const dateGroups = new Map<string, HabitEntry[]>();
    entries.forEach((entry) => {
      const existing = dateGroups.get(entry.date) || [];
      existing.push(entry);
      dateGroups.set(entry.date, existing);
    });

    // Convert to array format
    const result: HabitsDateRange[] = [];

    for (const [date, dayEntries] of dateGroups) {
      const completedCount = dayEntries.filter((e) => e.completed).length;
      result.push({
        date,
        completedCount,
        totalCount: dayEntries.length,
        habits: dayEntries.map((e) => ({
          name: e.name,
          completed: e.completed,
        })),
      });
    }

    // Sort by date
    return result.sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error('Error getting heatmap data:', error);
    return [];
  }
}

/**
 * Check if Habits database is configured
 */
export function isHabitsDatabaseConfigured(): boolean {
  return Boolean(HABITS_DATABASE_ID && getNotionApiKey());
}
