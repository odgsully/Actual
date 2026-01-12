/**
 * Screen Time Types
 * TypeScript interfaces for Apple Screen Time screenshot processing
 */

// ============================================================
// LLM Extraction Types (from OpenAI Vision)
// ============================================================

export interface LLMScreenTimeExtraction {
  /** Whether this is a week or day view */
  period: 'week' | 'day';

  /** Daily average screen time in total minutes */
  dailyAverageMinutes: number | null;

  /** Week-over-week change percentage (e.g., 16 for +16%) */
  weekOverWeekChangePercent: number | null;

  /** Category breakdown with minutes per category */
  categories: Record<string, number> | null;

  /** Top apps with their screen time in minutes */
  topApps: Array<{
    name: string;
    minutes: number;
  }> | null;

  /** Pickup statistics */
  pickups: {
    dailyAverage: number | null;
    weekOverWeekChangePercent: number | null;
  } | null;

  /** Notification statistics */
  notifications: {
    dailyAverage: number | null;
    weekOverWeekChangePercent: number | null;
  } | null;

  /** Apps typically opened first after phone pickup */
  firstAppsAfterPickup: string[] | null;
}

// ============================================================
// Database Types (Supabase)
// ============================================================

export interface ScreenTimeUpload {
  id: string;
  user_id: string;
  week_start: string; // DATE as ISO string
  storage_path: string;
  file_name: string | null;
  file_size_bytes: number | null;
  processed: boolean;
  processed_at: string | null;
  created_at: string;
}

export interface ScreenTimeWeekly {
  id: string;
  user_id: string;
  week_start: string; // DATE as ISO string

  // Overall metrics
  daily_avg_minutes: number | null;
  total_minutes: number | null;
  week_over_week_change: number | null;

  // Pickups & notifications
  daily_avg_pickups: number | null;
  daily_avg_notifications: number | null;

  // JSON fields
  categories: Record<string, number> | null;
  top_apps: Array<{ name: string; minutes: number }> | null;
  first_apps_after_pickup: string[] | null;
  raw_extraction: LLMScreenTimeExtraction | null;

  created_at: string;
  updated_at: string;
}

// ============================================================
// API Types
// ============================================================

export interface ScreenTimeUploadRequest {
  weekStart: string; // ISO date string for the Sunday of the week
}

export interface ScreenTimeUploadResponse {
  success: boolean;
  uploadId?: string;
  storagePath?: string;
  error?: string;
}

export interface ScreenTimeProcessResponse {
  success: boolean;
  weeklyId?: string;
  extracted?: LLMScreenTimeExtraction;
  error?: string;
}

export interface ScreenTimeStatsResponse {
  success: boolean;
  currentWeek?: ScreenTimeWeeklyFormatted | null;
  previousWeeks?: ScreenTimeWeeklyFormatted[];
  error?: string;
}

// ============================================================
// Frontend Display Types
// ============================================================

export interface ScreenTimeWeeklyFormatted {
  weekStart: string;
  weekLabel: string; // e.g., "Dec 29 - Jan 4"

  // Formatted metrics
  dailyAverage: string | null; // e.g., "9h 57m"
  dailyAverageMinutes: number | null;
  totalTime: string | null; // e.g., "59h 42m"
  totalMinutes: number | null;
  weekOverWeekChange: number | null; // percentage

  // Pickups & notifications
  dailyPickups: number | null;
  dailyNotifications: number | null;

  // Category data for pie chart
  categories: Array<{
    name: string;
    minutes: number;
    formatted: string; // e.g., "24h 47m"
    percentage: number;
    color: string;
  }> | null;

  // Top apps list
  topApps: Array<{
    name: string;
    minutes: number;
    formatted: string;
  }> | null;

  // First apps after pickup
  firstAppsAfterPickup: string[] | null;

  // Has data flag
  hasData: boolean;
}

// ============================================================
// Utility Types
// ============================================================

/** Predefined category colors for pie chart */
export const CATEGORY_COLORS: Record<string, string> = {
  'Entertainment': '#f472b6', // pink
  'Utilities': '#60a5fa',     // blue
  'Social': '#34d399',        // green
  'Productivity': '#fbbf24',  // yellow
  'Other': '#a78bfa',         // purple
  'Information & Reading': '#fb923c', // orange
  'Creativity': '#f87171',    // red
  'Health & Fitness': '#2dd4bf', // teal
  'Education': '#818cf8',     // indigo
};

/** Default color for unknown categories */
export const DEFAULT_CATEGORY_COLOR = '#94a3b8'; // gray

// ============================================================
// Helper Functions
// ============================================================

/**
 * Format minutes into human-readable duration (e.g., "9h 57m")
 */
export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}m`;
  }
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
}

/**
 * Get the Sunday (start) of the week for a given date
 */
export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

/**
 * Format a week range label (e.g., "Dec 29 - Jan 4")
 */
export function formatWeekLabel(weekStart: string): string {
  const start = new Date(weekStart + 'T00:00:00');
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
  const startDay = start.getDate();
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
  const endDay = end.getDate();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} - ${endDay}`;
  }
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
}

/**
 * Get color for a category, with fallback
 */
export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] || DEFAULT_CATEGORY_COLOR;
}
