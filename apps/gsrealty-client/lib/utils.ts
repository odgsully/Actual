import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================
// Timezone Utilities for Calendar
// ============================================

/**
 * Get user's timezone (browser)
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

/**
 * Convert ISO string from Notion to user's local Date
 */
export function notionToLocal(isoString: string): Date {
  return parseISO(isoString)
}

/**
 * Convert local Date to ISO string for Notion
 * Preserves the local time as entered by user
 */
export function localToNotion(date: Date, includeTime: boolean = true): string {
  if (includeTime) {
    return date.toISOString()
  }
  return format(date, 'yyyy-MM-dd')
}

/**
 * Format time for display (e.g., "2:30 PM")
 */
export function formatTime(isoString: string): string {
  return format(parseISO(isoString), 'h:mm a')
}

/**
 * Format date for display (e.g., "Jan 15, 2026")
 */
export function formatDateDisplay(isoString: string): string {
  return format(parseISO(isoString), 'MMM d, yyyy')
}

/**
 * Check if a date is all-day (no time component)
 */
export function isAllDay(dateObj: { start: string; end?: string | null }): boolean {
  // Notion all-day events have date-only format (YYYY-MM-DD)
  return !dateObj.start.includes('T')
}