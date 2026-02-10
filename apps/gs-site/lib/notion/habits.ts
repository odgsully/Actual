/**
 * Notion Habits Database Client
 *
 * Queries the Habits database which stores DAILY RECORDS with checkbox columns
 * for each habit. Calculates streaks and completion rates from this data.
 *
 * Database Structure:
 * - Each row = one day
 * - Date property = the date
 * - Multiple checkbox properties = individual habits (Duolingo, Food Tracked, etc.)
 * - Total Progress = formula calculating daily completion %
 *
 * Required Environment Variables:
 * - NOTION_API_KEY: Notion integration token
 * - NOTION_HABITS_DATABASE_ID: Database ID for habits tracking
 */

const NOTION_API_VERSION = '2022-06-28';

const HABITS_DATABASE_ID = process.env.NOTION_HABITS_DATABASE_ID || '';

/**
 * List of checkbox property names that represent habits
 * These are the columns in your Notion database
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

type HabitName = (typeof HABIT_PROPERTIES)[number];

/**
 * Get Notion API key from environment
 */
function getNotionApiKey(): string | null {
  return process.env.NOTION_API_KEY || null;
}

/**
 * Check if habits database is configured
 */
export function isHabitsDatabaseConfigured(): boolean {
  return Boolean(getNotionApiKey() && HABITS_DATABASE_ID);
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

// ============================================================
// Types
// ============================================================

export interface HabitStreak {
  id: string;
  name: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  completionRate7Days: number;
  completionRate30Days: number;
  emoji?: string;
}

export interface HabitCompletionData {
  habitName: string;
  completedDays: number;
  totalDays: number;
  rate: number;
}

export interface HeatmapDay {
  date: string;
  count: number;
  total: number;
  habits: string[];
}

export interface DailyRecord {
  id: string;
  date: string;
  habits: Record<string, boolean>;
  weight?: number;
  totalProgress?: number;
}

// ============================================================
// Core Data Fetching
// ============================================================

/**
 * Fetch all daily records from the last N days
 */
async function fetchDailyRecords(days: number): Promise<DailyRecord[]> {
  if (!isHabitsDatabaseConfigured()) {
    return [];
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  try {
    const allRecords: DailyRecord[] = [];
    let hasMore = true;
    let startCursor: string | undefined;

    while (hasMore) {
      const response = await notionFetch(`/databases/${HABITS_DATABASE_ID}/query`, {
        filter: {
          property: 'Date',
          date: {
            on_or_after: startDate.toISOString().split('T')[0],
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
      });

      for (const page of response.results) {
        const record = parseDailyRecord(page);
        if (record) {
          allRecords.push(record);
        }
      }

      hasMore = response.has_more;
      startCursor = response.next_cursor;
    }

    return allRecords;
  } catch (error) {
    console.error('Error fetching daily records:', error);
    return [];
  }
}

/**
 * Parse a Notion page into a DailyRecord
 */
function parseDailyRecord(page: any): DailyRecord | null {
  const props = page.properties || {};
  const date = props.Date?.date?.start;

  if (!date) return null;

  const habits: Record<string, boolean> = {};

  for (const habitName of HABIT_PROPERTIES) {
    const prop = props[habitName];
    habits[habitName] = prop?.checkbox === true;
  }

  return {
    id: page.id,
    date,
    habits,
    weight: props.Weight?.number ?? undefined,
    totalProgress: props['Total Progress']?.formula?.number ?? undefined,
  };
}

// ============================================================
// Streak Calculation
// ============================================================

/**
 * Calculate streak for a single habit from daily records
 *
 * Streak logic:
 * - If today is completed, include it and count backward
 * - If today is NOT completed, skip today (don't break streak) and count from yesterday
 * - A streak breaks when there's a gap (incomplete day) before yesterday
 */
function calculateHabitStreak(
  habitName: string,
  records: DailyRecord[]
): { current: number; longest: number; lastCompleted: string | null } {
  // Sort by date descending (most recent first)
  const sortedRecords = [...records].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  let longestStreak = 0;
  let tempStreak = 0;
  let lastCompletedDate: string | null = null;

  // Get today's date string
  const today = new Date().toISOString().split('T')[0];

  // First pass: find lastCompletedDate and calculate longest streak
  for (const record of sortedRecords) {
    const completed = record.habits[habitName] === true;

    if (completed) {
      if (!lastCompletedDate) {
        lastCompletedDate = record.date;
      }
      tempStreak++;
    } else {
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
      tempStreak = 0;
    }
  }
  // Check final streak
  if (tempStreak > longestStreak) {
    longestStreak = tempStreak;
  }

  // Second pass: calculate current streak
  // Start from today or yesterday (whichever has data) and count backward
  // Today being incomplete does NOT break the streak - we just skip it
  let currentStreak = 0;
  let expectingDate = new Date();

  // Check if today's record exists and is incomplete - if so, start from yesterday
  const todayRecord = sortedRecords.find(r => r.date === today);
  const todayCompleted = todayRecord?.habits[habitName] === true;

  if (!todayCompleted) {
    // Skip today - start expecting yesterday
    expectingDate.setDate(expectingDate.getDate() - 1);
  }

  for (const record of sortedRecords) {
    const recordDate = new Date(record.date + 'T12:00:00'); // Noon to avoid timezone issues
    const expectedDateStr = expectingDate.toISOString().split('T')[0];

    // Skip future dates or dates we're not expecting yet
    if (record.date > expectedDateStr) {
      continue;
    }

    // If there's a gap (record date is before expected date), streak is broken
    if (record.date < expectedDateStr) {
      break;
    }

    // This is the expected date - check if completed
    const completed = record.habits[habitName] === true;

    if (completed) {
      currentStreak++;
      // Move to expect the previous day
      expectingDate.setDate(expectingDate.getDate() - 1);
    } else {
      // Not completed on expected date - streak broken
      break;
    }
  }

  return {
    current: currentStreak,
    longest: Math.max(longestStreak, currentStreak),
    lastCompleted: lastCompletedDate,
  };
}

/**
 * Calculate completion rate for a habit over N days
 */
function calculateCompletionRate(habitName: string, records: DailyRecord[], days: number): number {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const relevantRecords = records.filter(
    (r) => new Date(r.date) >= cutoffDate
  );

  if (relevantRecords.length === 0) return 0;

  const completedCount = relevantRecords.filter(
    (r) => r.habits[habitName] === true
  ).length;

  return Math.round((completedCount / relevantRecords.length) * 100);
}

// ============================================================
// Public API Functions
// ============================================================

/**
 * Emoji mapping for habits
 */
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

/**
 * Get all habit streaks sorted by current streak descending
 */
export async function getAllHabitStreaks(): Promise<HabitStreak[]> {
  if (!isHabitsDatabaseConfigured()) {
    return [];
  }

  try {
    // Fetch last 90 days to calculate streaks accurately
    const records = await fetchDailyRecords(90);

    if (records.length === 0) {
      return [];
    }

    const streaks: HabitStreak[] = [];

    for (const habitName of HABIT_PROPERTIES) {
      const streakData = calculateHabitStreak(habitName, records);
      const rate7 = calculateCompletionRate(habitName, records, 7);
      const rate30 = calculateCompletionRate(habitName, records, 30);

      streaks.push({
        id: habitName.toLowerCase().replace(/\s+/g, '-'),
        name: habitName,
        currentStreak: streakData.current,
        longestStreak: streakData.longest,
        lastCompletedDate: streakData.lastCompleted,
        completionRate7Days: rate7,
        completionRate30Days: rate30,
        emoji: HABIT_EMOJIS[habitName],
      });
    }

    // Sort by current streak descending
    return streaks.sort((a, b) => b.currentStreak - a.currentStreak);
  } catch (error) {
    console.error('Error calculating habit streaks:', error);
    return [];
  }
}

/**
 * Get habit completion rate for a time period
 */
export async function getHabitCompletionRate(days = 30): Promise<HabitCompletionData[]> {
  if (!isHabitsDatabaseConfigured()) {
    return [];
  }

  try {
    const records = await fetchDailyRecords(days);

    if (records.length === 0) {
      return [];
    }

    const completionData: HabitCompletionData[] = [];

    for (const habitName of HABIT_PROPERTIES) {
      const completedDays = records.filter((r) => r.habits[habitName] === true).length;

      completionData.push({
        habitName,
        completedDays,
        totalDays: records.length,
        rate: Math.round((completedDays / records.length) * 100),
      });
    }

    return completionData.sort((a, b) => b.rate - a.rate);
  } catch (error) {
    console.error('Error fetching habit completion rate:', error);
    return [];
  }
}

/**
 * Get overall completion rate (all habits combined)
 */
export async function getOverallCompletionRate(days = 7): Promise<{
  completed: number;
  total: number;
  rate: number;
}> {
  if (!isHabitsDatabaseConfigured()) {
    return { completed: 0, total: 0, rate: 0 };
  }

  try {
    const records = await fetchDailyRecords(days);

    if (records.length === 0) {
      return { completed: 0, total: 0, rate: 0 };
    }

    let totalChecks = 0;
    let completedChecks = 0;

    for (const record of records) {
      for (const habitName of HABIT_PROPERTIES) {
        totalChecks++;
        if (record.habits[habitName] === true) {
          completedChecks++;
        }
      }
    }

    return {
      completed: completedChecks,
      total: totalChecks,
      rate: totalChecks > 0 ? Math.round((completedChecks / totalChecks) * 100) : 0,
    };
  } catch (error) {
    console.error('Error fetching overall completion rate:', error);
    return { completed: 0, total: 0, rate: 0 };
  }
}

/**
 * Get heatmap data for habits
 */
export async function getHabitsHeatmapData(days = 90): Promise<HeatmapDay[]> {
  if (!isHabitsDatabaseConfigured()) {
    return [];
  }

  try {
    const records = await fetchDailyRecords(days);

    return records.map((record) => {
      const completedHabits = HABIT_PROPERTIES.filter(
        (h) => record.habits[h] === true
      );

      return {
        date: record.date,
        count: completedHabits.length,
        total: HABIT_PROPERTIES.length,
        habits: completedHabits as string[],
      };
    }).sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error('Error fetching heatmap data:', error);
    return [];
  }
}

/**
 * Get today's habit record
 */
export async function getTodaysRecord(): Promise<DailyRecord | null> {
  if (!isHabitsDatabaseConfigured()) {
    return null;
  }

  const today = new Date().toISOString().split('T')[0];

  try {
    const response = await notionFetch(`/databases/${HABITS_DATABASE_ID}/query`, {
      filter: {
        property: 'Date',
        date: {
          equals: today,
        },
      },
    });

    if (response.results.length === 0) {
      return null;
    }

    return parseDailyRecord(response.results[0]);
  } catch (error) {
    console.error("Error fetching today's record:", error);
    return null;
  }
}

/**
 * Update a habit checkbox for today
 */
export async function updateHabitForToday(
  habitName: HabitName,
  completed: boolean
): Promise<boolean> {
  if (!isHabitsDatabaseConfigured()) {
    return false;
  }

  try {
    const todayRecord = await getTodaysRecord();

    if (!todayRecord) {
      console.error('No record found for today');
      return false;
    }

    const apiKey = getNotionApiKey();
    if (!apiKey) return false;

    const response = await fetch(`https://api.notion.com/v1/pages/${todayRecord.id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Notion-Version': NOTION_API_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          [habitName]: {
            checkbox: completed,
          },
        },
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error updating habit:', error);
    return false;
  }
}

/**
 * Supported property types for updatePropertyForToday
 */
export type NotionPropertyType = 'checkbox' | 'number';

/**
 * Update any property for today's record
 * Supports: checkbox (boolean), number
 */
export async function updatePropertyForToday(
  propertyName: string,
  value: boolean | number,
  type: NotionPropertyType
): Promise<boolean> {
  if (!isHabitsDatabaseConfigured()) {
    return false;
  }

  try {
    const todayRecord = await getTodaysRecord();

    if (!todayRecord) {
      console.error('No record found for today');
      return false;
    }

    const apiKey = getNotionApiKey();
    if (!apiKey) return false;

    // Build property value based on type
    let propertyValue: object;
    switch (type) {
      case 'checkbox':
        propertyValue = { checkbox: value as boolean };
        break;
      case 'number':
        propertyValue = { number: value as number };
        break;
      default:
        console.error(`Unsupported property type: ${type}`);
        return false;
    }

    const response = await fetch(`https://api.notion.com/v1/pages/${todayRecord.id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Notion-Version': NOTION_API_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          [propertyName]: propertyValue,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`Failed to update property ${propertyName}:`, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error updating property ${propertyName}:`, error);
    return false;
  }
}

/**
 * Get list of all tracked habits
 */
export function getTrackedHabits(): Array<{ name: string; emoji: string }> {
  return HABIT_PROPERTIES.map((name) => ({
    name,
    emoji: HABIT_EMOJIS[name] || '✓',
  }));
}
