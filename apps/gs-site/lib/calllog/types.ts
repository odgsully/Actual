/**
 * Call Log Types
 * TypeScript interfaces for Verizon/iPhone call log screenshot processing
 */

// ============================================================
// LLM Extraction Types (from OpenAI Vision)
// ============================================================

export type CallDirection = 'incoming' | 'outgoing' | 'missed';

export interface CallEntry {
  /** Phone number in E.164 format or as displayed */
  phoneNumber: string | null;

  /** Contact name if available */
  contactName: string | null;

  /** Call date/time in ISO 8601 format */
  dateTime: string | null;

  /** Call duration in seconds (0 for missed calls) */
  durationSeconds: number | null;

  /** Call direction */
  direction: CallDirection | null;
}

export interface LLMCallLogExtraction {
  /** Source of the screenshot (verizon app, iphone recents, etc.) */
  source: 'verizon' | 'iphone' | 'unknown';

  /** List of call entries extracted */
  calls: CallEntry[];

  /** Date range visible in the screenshot */
  dateRange: {
    start: string | null; // ISO date
    end: string | null; // ISO date
  } | null;

  /** Total calls visible in screenshot */
  totalCallsVisible: number;

  /** Confidence score 0-1 */
  confidence: number;
}

// ============================================================
// Database Types (Supabase)
// ============================================================

export interface CallLogUpload {
  id: string;
  user_id: string;
  period_start: string; // DATE as ISO string
  storage_path: string;
  file_name: string | null;
  file_size_bytes: number | null;
  processed: boolean;
  processed_at: string | null;
  created_at: string;
}

export interface CallLogDaily {
  id: string;
  user_id: string;
  date: string; // DATE as ISO string

  // Aggregated metrics
  outbound_count: number;
  inbound_count: number;
  missed_count: number;
  total_duration_seconds: number;

  // Raw calls data
  calls: CallEntry[] | null;
  raw_extraction: LLMCallLogExtraction | null;

  created_at: string;
  updated_at: string;
}

export interface CallLogWeekly {
  id: string;
  user_id: string;
  week_start: string; // DATE as ISO string (Sunday)

  // Aggregated metrics
  total_outbound: number;
  total_inbound: number;
  total_missed: number;
  total_duration_seconds: number;
  daily_avg_outbound: number;
  daily_avg_inbound: number;
  week_over_week_change: number | null; // percentage

  // Top contacts
  top_contacts: Array<{
    name: string;
    phoneNumber: string;
    callCount: number;
    totalDuration: number;
  }> | null;

  created_at: string;
  updated_at: string;
}

// ============================================================
// API Types
// ============================================================

export interface CallLogUploadRequest {
  periodStart?: string; // ISO date string
}

export interface CallLogUploadResponse {
  success: boolean;
  uploadId?: string;
  storagePath?: string;
  error?: string;
}

export interface CallLogProcessResponse {
  success: boolean;
  extracted?: LLMCallLogExtraction;
  callsProcessed?: number;
  error?: string;
}

export interface CallLogStatsResponse {
  success: boolean;
  currentWeek?: CallLogWeeklyFormatted | null;
  previousWeeks?: CallLogWeeklyFormatted[];
  recentCalls?: CallEntryFormatted[];
  error?: string;
}

// ============================================================
// Frontend Display Types
// ============================================================

export interface CallEntryFormatted {
  phoneNumber: string;
  contactName: string | null;
  dateTime: string;
  dateLabel: string; // e.g., "Today 2:30 PM"
  duration: string; // e.g., "5m 32s"
  durationSeconds: number;
  direction: CallDirection;
  directionIcon: 'outgoing' | 'incoming' | 'missed';
}

export interface CallLogWeeklyFormatted {
  weekStart: string;
  weekLabel: string; // e.g., "Dec 29 - Jan 4"

  // Counts
  outboundCount: number;
  inboundCount: number;
  missedCount: number;
  totalCalls: number;

  // Duration
  totalDuration: string; // e.g., "2h 45m"
  totalDurationSeconds: number;
  avgCallDuration: string; // e.g., "3m 12s"

  // Daily averages
  dailyAvgOutbound: number;
  dailyAvgInbound: number;
  dailyAvgTotal: number;

  // Change
  weekOverWeekChange: number | null;

  // Top contacts
  topContacts: Array<{
    name: string;
    phoneNumber: string;
    callCount: number;
    totalDuration: string;
  }> | null;

  // Has data flag
  hasData: boolean;
}

// ============================================================
// Utility Types & Constants
// ============================================================

/** Direction colors for display */
export const DIRECTION_COLORS: Record<CallDirection, string> = {
  outgoing: '#22c55e', // green
  incoming: '#3b82f6', // blue
  missed: '#ef4444', // red
};

// ============================================================
// Helper Functions
// ============================================================

/**
 * Format seconds into human-readable duration (e.g., "5m 32s")
 */
export function formatDuration(seconds: number): string {
  if (seconds === 0) return '0s';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    if (secs === 0) return `${minutes}m`;
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

/**
 * Format phone number for display (US format)
 */
export function formatPhoneNumber(phone: string): string {
  // Remove non-digits
  const digits = phone.replace(/\D/g, '');

  // Format as (XXX) XXX-XXXX for 10-digit numbers
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // Format as +1 (XXX) XXX-XXXX for 11-digit numbers starting with 1
  if (digits.length === 11 && digits[0] === '1') {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  // Return as-is for other formats
  return phone;
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
 * Format date/time for call entry display
 */
export function formatCallDateTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const callDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (callDate.getTime() === today.getTime()) {
    return `Today ${timeStr}`;
  }
  if (callDate.getTime() === yesterday.getTime()) {
    return `Yesterday ${timeStr}`;
  }

  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  return `${dateStr} ${timeStr}`;
}
