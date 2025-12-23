/**
 * Notion Habits Database Client
 *
 * Queries the Habits database for streak tracking, completion rates,
 * and habit history. Used by the Habits STREAKS graphic tile.
 *
 * ACTUAL Database Schema (from Notion):
 * - Name: Title (day label/notes)
 * - Date: Date (the day)
 * - Weight: Number (body weight)
 * - Checkbox columns for each habit:
 *   - Box pack, Across room set, Heart rate UP, Stillness,
 *   - Duolingo, Food Tracked, No DAJO, Box grabbed
 * - Total Progress: Formula (calculates daily completion rate)
 * - Day Key: Formula (formats date as YYYY-MM-DD)
 *
 * Structure: One row per DAY with multiple habit checkboxes
 */

const NOTION_API_VERSION = '2022-06-28';

const HABITS_DATABASE_ID = process.env.NOTION_HABITS_DATABASE_ID || '';

/**
 * List of habit checkbox column names in Notion
 * These are the actual property names from your Habits database
 */
const HABIT_COLUMNS = [
  'Duolingo',
  'Food Tracked',
  'Heart rate UP',
  'Stillness',
  'Box pack',
  'Across room set',
  'No DAJO',
  'Box grabbed',
] as const;

export type HabitName = (typeof HABIT_COLUMNS)[number];

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

/**
 * A single day's habit record with all checkbox values
 */
export interface DailyHabitRecord {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  weight?: number;
  habits: Record<HabitName, boolean>;
  totalProgress?: number; // From Notion formula if available
}

/**
 * Legacy interface for backward compatibility
 * Represents a single habit occurrence (flattened from daily record)
 */
export interface HabitEntry {
  id: string;
  name: string;
  date: string;
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
 * Parse a Notion page into a DailyHabitRecord
 */
function parseDailyRecord(page: any): DailyHabitRecord {
  const habits: Record<string, boolean> = {};

  // Extract each habit checkbox
  for (const habitName of HABIT_COLUMNS) {
    habits[habitName] = page.properties[habitName]?.checkbox || false;
  }

  return {
    id: page.id,
    date: page.properties.Date?.date?.start || '',
    weight: page.properties.Weight?.number ?? undefined,
    habits: habits as Record<HabitName, boolean>,
    totalProgress: page.properties['Total Progress']?.formula?.number ?? undefined,
  };
}

/**
 * Convert daily records to flattened HabitEntry array (for backward compatibility)
 */
function flattenToHabitEntries(records: DailyHabitRecord[]): HabitEntry[] {
  const entries: HabitEntry[] = [];

  for (const record of records) {
    for (const habitName of HABIT_COLUMNS) {
      entries.push({
        id: `${record.id}-${habitName}`,
        name: habitName,
        date: record.date,
        completed: record.habits[habitName] || false,
      });
    }
  }

  return entries;
}

/**
 * Fetch daily habit records for a date range
 */
export async function getDailyRecordsForDateRange(
  startDate: Date,
  endDate: Date
): Promise<DailyHabitRecord[]> {
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

    return response.results.map(parseDailyRecord);
  } catch (error) {
    console.error('Error fetching habits:', error);
    throw error;
  }
}

/**
 * Fetch habit entries for a date range (backward compatible)
 * Returns flattened array of habit entries
 */
export async function getHabitsForDateRange(
  startDate: Date,
  endDate: Date
): Promise<HabitEntry[]> {
  const records = await getDailyRecordsForDateRange(startDate, endDate);
  return flattenToHabitEntries(records);
}

/**
 * Calculate current streak for a specific habit
 */
export async function getCurrentStreak(habitName: string): Promise<number> {
  if (!HABITS_DATABASE_ID) {
    return 0;
  }

  // Validate habit name
  if (!HABIT_COLUMNS.includes(habitName as HabitName)) {
    console.warn(`Unknown habit: ${habitName}`);
    return 0;
  }

  try {
    // Get last 90 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);

    const records = await getDailyRecordsForDateRange(startDate, endDate);

    if (records.length === 0) {
      return 0;
    }

    // Build set of dates where this specific habit was completed
    const completedDates = new Set<string>();
    for (const record of records) {
      if (record.habits[habitName as HabitName]) {
        completedDates.add(record.date);
      }
    }

    // Calculate consecutive days from today
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

    const records = await getDailyRecordsForDateRange(startDate, endDate);

    let completed = 0;
    let total = 0;

    for (const record of records) {
      for (const habitName of HABIT_COLUMNS) {
        total++;
        if (record.habits[habitName]) {
          completed++;
        }
      }
    }

    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, rate };
  } catch (error) {
    console.error('Error calculating completion rate:', error);
    return { completed: 0, total: 0, rate: 0 };
  }
}

/**
 * Get all habit streaks summary
 * Returns streak data for each individual habit column
 */
export async function getAllHabitStreaks(): Promise<HabitStreak[]> {
  if (!HABITS_DATABASE_ID) {
    return [];
  }

  try {
    // Get all records from last 90 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);

    const records = await getDailyRecordsForDateRange(startDate, endDate);

    const streaks: HabitStreak[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (const habitName of HABIT_COLUMNS) {
      // Build set of completed dates for this habit
      const completedDates = new Set<string>();
      for (const record of records) {
        if (record.habits[habitName]) {
          completedDates.add(record.date);
        }
      }

      // Calculate current streak
      let currentStreak = 0;
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

      // Calculate longest streak
      let longestStreak = 0;
      let tempStreak = 0;
      const sortedDates = Array.from(completedDates).sort();

      for (let i = 0; i < sortedDates.length; i++) {
        if (i === 0) {
          tempStreak = 1;
        } else {
          const prevDate = new Date(sortedDates[i - 1]);
          const currDate = new Date(sortedDates[i]);
          const diffDays = Math.round(
            (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (diffDays === 1) {
            tempStreak++;
          } else {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 1;
          }
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

      // Last completed date
      const reversedDates = Array.from(completedDates).sort().reverse();
      const lastCompletedDate = reversedDates[0] || null;

      // 7-day completion rate
      let completed7 = 0;
      for (let i = 0; i < 7; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];
        if (completedDates.has(dateStr)) {
          completed7++;
        }
      }
      const completionRate7Days = Math.round((completed7 / 7) * 100);

      // 30-day completion rate
      let completed30 = 0;
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];
        if (completedDates.has(dateStr)) {
          completed30++;
        }
      }
      const completionRate30Days = Math.round((completed30 / 30) * 100);

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

    const records = await getDailyRecordsForDateRange(startDate, endDate);

    const result: HabitsDateRange[] = records.map((record) => {
      const habits: Array<{ name: string; completed: boolean }> = [];
      let completedCount = 0;

      for (const habitName of HABIT_COLUMNS) {
        const completed = record.habits[habitName] || false;
        habits.push({ name: habitName, completed });
        if (completed) completedCount++;
      }

      return {
        date: record.date,
        completedCount,
        totalCount: HABIT_COLUMNS.length,
        habits,
      };
    });

    // Sort by date ascending
    return result.sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error('Error getting heatmap data:', error);
    return [];
  }
}

/**
 * Get list of available habit names
 */
export function getHabitNames(): readonly string[] {
  return HABIT_COLUMNS;
}

/**
 * Check if Habits database is configured
 */
export function isHabitsDatabaseConfigured(): boolean {
  return Boolean(HABITS_DATABASE_ID && getNotionApiKey());
}
