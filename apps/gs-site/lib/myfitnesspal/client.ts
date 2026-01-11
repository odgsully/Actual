/**
 * MyFitnessPal Client
 *
 * Cookie-based client for fetching data from MyFitnessPal.
 * Uses session cookies extracted from user's browser for authentication.
 *
 * Why cookies? MFP has hidden CAPTCHA on login (since Aug 2022) that blocks
 * automated logins. The workaround is to use existing browser session cookies.
 */

import { createClient } from '@supabase/supabase-js';
import type {
  MFPCookies,
  MFPConnectionStatus,
  MFPExportData,
  MFPIntegrationMetadata,
  MFPFoodDiaryRow,
  MFPMeasurementRow,
  MFPExerciseRow,
  MFPSyncStatusRow,
} from './types';
import { parseMFPExport } from './parser';

const MFP_BASE_URL = 'https://www.myfitnesspal.com';
const DEFAULT_USER_ID = 'default-user';

// User agent to mimic a real browser
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Get Supabase client with service role key for server-side operations
 */
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase credentials');
  }

  return createClient(url, key);
}

/**
 * Format cookies object into a cookie header string
 */
function formatCookies(cookies: MFPCookies): string {
  const parts: string[] = [];

  if (cookies.mfpSession) {
    parts.push(`MFP_SESSION=${cookies.mfpSession}`);
  }
  if (cookies.mfpUserId) {
    parts.push(`user-id=${cookies.mfpUserId}`);
  }
  if (cookies.mfpToken) {
    parts.push(`token=${cookies.mfpToken}`);
  }

  return parts.join('; ');
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get MFP cookies from user_integrations table
 */
export async function getMFPCookies(
  userId: string = DEFAULT_USER_ID
): Promise<MFPCookies | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('user_integrations')
    .select('metadata')
    .eq('user_id', userId)
    .eq('service', 'myfitnesspal')
    .single();

  if (error || !data?.metadata) {
    return null;
  }

  const metadata = data.metadata as MFPIntegrationMetadata;

  return {
    mfpSession: metadata.mfp_session,
    mfpUserId: metadata.mfp_user_id,
    mfpToken: metadata.mfp_token,
  };
}

/**
 * Store MFP cookies in user_integrations table
 */
export async function storeMFPCookies(
  cookies: MFPCookies,
  username?: string,
  userId: string = DEFAULT_USER_ID
): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  const metadata: MFPIntegrationMetadata = {
    mfp_session: cookies.mfpSession,
    mfp_user_id: cookies.mfpUserId,
    mfp_token: cookies.mfpToken,
    mfp_username: username,
    cookies_updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('user_integrations').upsert(
    {
      user_id: userId,
      service: 'myfitnesspal',
      access_token: 'mfp-cookie-auth', // Not used for MFP but column requires a value
      metadata,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'user_id,service',
    }
  );

  if (error) {
    console.error('[MFP] Failed to store cookies:', error);
    return false;
  }

  console.log('[MFP] Cookies stored successfully for user:', userId);
  return true;
}

/**
 * Verify MFP session is still valid by hitting a lightweight endpoint
 */
export async function verifyMFPSession(cookies: MFPCookies): Promise<boolean> {
  try {
    const cookieString = formatCookies(cookies);

    // Try to access user settings page - will redirect/fail if not authenticated
    const response = await fetch(`${MFP_BASE_URL}/account/my-account`, {
      method: 'GET',
      headers: {
        Cookie: cookieString,
        'User-Agent': USER_AGENT,
        Accept: 'text/html',
      },
      redirect: 'manual', // Don't follow redirects automatically
    });

    // If we get a redirect to login page, session is invalid
    if (response.status === 302 || response.status === 301) {
      const location = response.headers.get('location');
      if (location?.includes('login') || location?.includes('signin')) {
        return false;
      }
    }

    // 200 means authenticated
    return response.ok;
  } catch (error) {
    console.error('[MFP] Session verification failed:', error);
    return false;
  }
}

/**
 * Get MFP connection status
 */
export async function getMFPConnectionStatus(
  userId: string = DEFAULT_USER_ID
): Promise<MFPConnectionStatus> {
  const supabase = getSupabaseAdmin();

  const { data } = await supabase
    .from('user_integrations')
    .select('metadata, updated_at')
    .eq('user_id', userId)
    .eq('service', 'myfitnesspal')
    .single();

  if (!data?.metadata) {
    return { connected: false };
  }

  const metadata = data.metadata as MFPIntegrationMetadata;

  return {
    connected: true,
    username: metadata.mfp_username,
    cookiesUpdatedAt: metadata.cookies_updated_at,
    lastVerifiedAt: metadata.last_verified_at,
  };
}

/**
 * Fetch MFP Premium export data
 *
 * This triggers the official MFP export which produces a ZIP file containing:
 * - Nutrition Summary.csv
 * - Progress.csv
 * - Exercise.csv
 *
 * Requires Premium subscription.
 */
export async function fetchMFPExport(
  cookies: MFPCookies,
  startDate: Date,
  endDate: Date
): Promise<MFPExportData> {
  const cookieString = formatCookies(cookies);
  const from = formatDate(startDate);
  const to = formatDate(endDate);

  // MFP export endpoint - returns a ZIP file
  // Note: The exact URL structure may need adjustment based on actual MFP implementation
  const exportUrl = `${MFP_BASE_URL}/reports/exportdata?from=${from}&to=${to}`;

  console.log(`[MFP] Fetching export from ${from} to ${to}`);

  const response = await fetch(exportUrl, {
    method: 'GET',
    headers: {
      Cookie: cookieString,
      'User-Agent': USER_AGENT,
      Accept: 'application/zip, application/octet-stream, */*',
    },
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('MFP_SESSION_EXPIRED');
    }
    throw new Error(`MFP_EXPORT_FAILED: ${response.status} ${response.statusText}`);
  }

  // Get the ZIP file as an ArrayBuffer
  const zipBuffer = await response.arrayBuffer();

  // Parse the ZIP and extract CSV data
  return parseMFPExport(zipBuffer);
}

/**
 * Alternative: Scrape the daily diary page directly
 *
 * This is a fallback if the export endpoint doesn't work or for more granular data.
 * URL format: /food/diary/USERNAME?date=YYYY-MM-DD
 */
export async function fetchMFPDailyDiary(
  cookies: MFPCookies,
  username: string,
  date: Date
): Promise<{
  calories: number;
  carbs: number;
  fat: number;
  protein: number;
  mealsLogged: number;
}> {
  const cookieString = formatCookies(cookies);
  const dateStr = formatDate(date);
  const diaryUrl = `${MFP_BASE_URL}/food/diary/${username}?date=${dateStr}`;

  console.log(`[MFP] Fetching diary for ${dateStr}`);
  console.log(`[MFP] URL: ${diaryUrl}`);
  console.log(`[MFP] Cookie length: ${cookieString.length}`);

  const response = await fetch(diaryUrl, {
    method: 'GET',
    headers: {
      Cookie: cookieString,
      'User-Agent': USER_AGENT,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Cache-Control': 'no-cache',
    },
    redirect: 'manual', // Don't auto-follow redirects
  });

  console.log(`[MFP] Response status: ${response.status}`);
  console.log(`[MFP] Response headers:`, Object.fromEntries(response.headers.entries()));

  // Check for redirects (usually means not authenticated)
  if (response.status === 302 || response.status === 301) {
    const location = response.headers.get('location');
    console.log(`[MFP] Redirect to: ${location}`);
    if (location?.includes('login') || location?.includes('signin') || location?.includes('account')) {
      throw new Error('MFP_SESSION_EXPIRED');
    }
  }

  if (!response.ok && response.status !== 302) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('MFP_SESSION_EXPIRED');
    }
    throw new Error(`MFP_DIARY_FETCH_FAILED: ${response.status}`);
  }

  const html = await response.text();

  // Parse the HTML to extract nutrition data
  // This is a basic implementation - the actual selectors may need adjustment
  const totals = {
    calories: 0,
    carbs: 0,
    fat: 0,
    protein: 0,
    mealsLogged: 0,
  };

  // Look for the totals row in the diary table
  // MFP uses a table with id "diary-table" and a "total" row
  const totalMatch = html.match(/class="total"[^>]*>[\s\S]*?<\/tr>/i);
  if (totalMatch) {
    const totalRow = totalMatch[0];

    // Extract numeric values from the total row
    const numbers = totalRow.match(/>(\d+(?:,\d+)?)</g) || [];
    const values = numbers.map((n) => parseInt(n.replace(/[>,<]/g, '').replace(',', ''), 10));

    if (values.length >= 4) {
      totals.calories = values[0] || 0;
      totals.carbs = values[1] || 0;
      totals.fat = values[2] || 0;
      totals.protein = values[3] || 0;
    }
  }

  // Count meals logged by looking for meal sections with entries
  const mealSections = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
  for (const meal of mealSections) {
    if (html.includes(`>${meal}<`) && html.match(new RegExp(`${meal}[\\s\\S]*?bottom[\\s\\S]*?\\d+`, 'i'))) {
      totals.mealsLogged++;
    }
  }

  return totals;
}

/**
 * Store food diary data in Supabase
 */
export async function storeFoodDiary(
  data: Partial<MFPFoodDiaryRow>[],
  userId: string = DEFAULT_USER_ID
): Promise<number> {
  const supabase = getSupabaseAdmin();

  const rows = data.map((d) => ({
    ...d,
    user_id: userId,
    synced_at: new Date().toISOString(),
  }));

  const { data: result, error } = await supabase
    .from('mfp_food_diary')
    .upsert(rows, { onConflict: 'user_id,date' })
    .select();

  if (error) {
    console.error('[MFP] Error storing food diary:', error);
    throw error;
  }

  return result?.length || 0;
}

/**
 * Store measurements data in Supabase
 */
export async function storeMeasurements(
  data: Partial<MFPMeasurementRow>[],
  userId: string = DEFAULT_USER_ID
): Promise<number> {
  const supabase = getSupabaseAdmin();

  const rows = data.map((d) => ({
    ...d,
    user_id: userId,
    synced_at: new Date().toISOString(),
  }));

  const { data: result, error } = await supabase
    .from('mfp_measurements')
    .upsert(rows, { onConflict: 'user_id,date' })
    .select();

  if (error) {
    console.error('[MFP] Error storing measurements:', error);
    throw error;
  }

  return result?.length || 0;
}

/**
 * Store exercise data in Supabase
 */
export async function storeExercises(
  data: Partial<MFPExerciseRow>[],
  userId: string = DEFAULT_USER_ID
): Promise<number> {
  const supabase = getSupabaseAdmin();

  const rows = data.map((d) => ({
    ...d,
    user_id: userId,
    synced_at: new Date().toISOString(),
  }));

  // For exercises, we don't have a unique constraint, so just insert
  // First delete existing exercises for the dates we're syncing
  const dates = [...new Set(rows.map((r) => r.date))];

  if (dates.length > 0) {
    await supabase
      .from('mfp_exercise')
      .delete()
      .eq('user_id', userId)
      .in('date', dates);
  }

  const { data: result, error } = await supabase
    .from('mfp_exercise')
    .insert(rows)
    .select();

  if (error) {
    console.error('[MFP] Error storing exercises:', error);
    throw error;
  }

  return result?.length || 0;
}

/**
 * Update sync status
 */
export async function updateSyncStatus(
  status: Partial<MFPSyncStatusRow>,
  userId: string = DEFAULT_USER_ID
): Promise<void> {
  const supabase = getSupabaseAdmin();

  await supabase.from('mfp_sync_status').upsert(
    {
      user_id: userId,
      ...status,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );
}

/**
 * Get sync status
 */
export async function getSyncStatus(
  userId: string = DEFAULT_USER_ID
): Promise<MFPSyncStatusRow | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('mfp_sync_status')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * Get cached food diary data
 */
export async function getFoodDiary(
  startDate: Date,
  endDate: Date,
  userId: string = DEFAULT_USER_ID
): Promise<MFPFoodDiaryRow[]> {
  const supabase = getSupabaseAdmin();

  const startStr = formatDate(startDate);
  const endStr = formatDate(endDate);

  // Get all data and filter in JavaScript (Supabase client filter operators have issues)
  const { data: allData, error: allError } = await supabase
    .from('mfp_food_diary')
    .select('*')
    .order('date', { ascending: false });

  if (allError) {
    console.error('[MFP] Error fetching food diary:', allError);
    return [];
  }

  // Filter in JavaScript
  return (allData || []).filter(row =>
    row.user_id === userId &&
    row.date >= startStr &&
    row.date <= endStr
  );
}

/**
 * Get cached measurements
 */
export async function getMeasurements(
  startDate: Date,
  endDate: Date,
  userId: string = DEFAULT_USER_ID
): Promise<MFPMeasurementRow[]> {
  const supabase = getSupabaseAdmin();

  const startStr = formatDate(startDate);
  const endStr = formatDate(endDate);

  const { data: allData, error } = await supabase
    .from('mfp_measurements')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('[MFP] Error fetching measurements:', error);
    return [];
  }

  return (allData || []).filter(row =>
    row.user_id === userId &&
    row.date >= startStr &&
    row.date <= endStr
  );
}

/**
 * Get cached exercises
 */
export async function getExercises(
  startDate: Date,
  endDate: Date,
  userId: string = DEFAULT_USER_ID
): Promise<MFPExerciseRow[]> {
  const supabase = getSupabaseAdmin();

  const startStr = formatDate(startDate);
  const endStr = formatDate(endDate);

  const { data: allData, error } = await supabase
    .from('mfp_exercise')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('[MFP] Error fetching exercises:', error);
    return [];
  }

  return (allData || []).filter(row =>
    row.user_id === userId &&
    row.date >= startStr &&
    row.date <= endStr
  );
}

/**
 * Calculate streak (consecutive days with food logged)
 */
export async function calculateStreak(
  userId: string = DEFAULT_USER_ID
): Promise<number> {
  const supabase = getSupabaseAdmin();

  // Get last 90 days of food diary entries
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const ninetyDaysAgoStr = formatDate(ninetyDaysAgo);

  const { data: allData, error } = await supabase
    .from('mfp_food_diary')
    .select('date, calories, user_id')
    .order('date', { ascending: false });

  if (error) {
    return 0;
  }

  // Filter in JS
  const data = (allData || []).filter(row =>
    row.user_id === userId &&
    row.date >= ninetyDaysAgoStr
  );

  if (!data?.length) {
    return 0;
  }

  // Filter to days with actual data logged (calories > 0)
  const loggedDates = new Set(
    data.filter((d) => d.calories && d.calories > 0).map((d) => d.date)
  );

  // Count consecutive days from yesterday backwards
  let streak = 0;
  const today = new Date();
  const checkDate = new Date(today);
  checkDate.setDate(checkDate.getDate() - 1); // Start from yesterday

  while (loggedDates.has(formatDate(checkDate))) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
}

/**
 * Get week average calories
 */
export async function getWeekAverageCalories(
  userId: string = DEFAULT_USER_ID
): Promise<number> {
  const supabase = getSupabaseAdmin();

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = formatDate(weekAgo);

  const { data: allData, error } = await supabase
    .from('mfp_food_diary')
    .select('calories, user_id, date')
    .order('date', { ascending: false });

  if (error) {
    return 0;
  }

  const data = (allData || []).filter(row =>
    row.user_id === userId &&
    row.date >= weekAgoStr &&
    row.calories != null
  );

  if (!data.length) {
    return 0;
  }

  const total = data.reduce((sum, d) => sum + (d.calories || 0), 0);
  return Math.round(total / data.length);
}

/**
 * Get latest weight measurement
 */
export async function getLatestWeight(
  userId: string = DEFAULT_USER_ID
): Promise<{ weightLbs: number | null; date: string | null }> {
  const supabase = getSupabaseAdmin();

  const { data: allData, error } = await supabase
    .from('mfp_measurements')
    .select('weight_lbs, date, user_id')
    .order('date', { ascending: false });

  if (error) {
    return { weightLbs: null, date: null };
  }

  // Filter in JS and get first matching
  const data = (allData || []).find(row =>
    row.user_id === userId &&
    row.weight_lbs != null
  );

  if (!data) {
    return { weightLbs: null, date: null };
  }

  return { weightLbs: data.weight_lbs, date: data.date };
}

/**
 * Get the last N days that have logged data (not calendar days)
 * This returns actual logged days, skipping gaps
 */
export async function getLastNLoggedDays(
  n: number = 7,
  userId: string = DEFAULT_USER_ID
): Promise<MFPFoodDiaryRow[]> {
  const supabase = getSupabaseAdmin();

  const { data: allData, error } = await supabase
    .from('mfp_food_diary')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('[MFP] Error fetching last N logged days:', error);
    return [];
  }

  // Filter to user's data with actual calories logged, then take first N
  return (allData || [])
    .filter(row => row.user_id === userId && row.calories && row.calories > 0)
    .slice(0, n);
}

/**
 * Get rolling averages for comparison periods
 * Returns averages for last 7 logged days, last 30 logged days, and previous 30 logged days
 */
export async function getRollingAverages(
  userId: string = DEFAULT_USER_ID
): Promise<{
  last7Days: { avgCalories: number; avgProtein: number; avgCarbs: number; avgFat: number; count: number };
  last30Days: { avgCalories: number; avgProtein: number; avgCarbs: number; avgFat: number; count: number };
  previous30Days: { avgCalories: number; avgProtein: number; avgCarbs: number; avgFat: number; count: number };
  weekOverWeekChange: number;
  monthOverMonthChange: number;
}> {
  const supabase = getSupabaseAdmin();

  const { data: allData, error } = await supabase
    .from('mfp_food_diary')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('[MFP] Error fetching rolling averages:', error);
    return {
      last7Days: { avgCalories: 0, avgProtein: 0, avgCarbs: 0, avgFat: 0, count: 0 },
      last30Days: { avgCalories: 0, avgProtein: 0, avgCarbs: 0, avgFat: 0, count: 0 },
      previous30Days: { avgCalories: 0, avgProtein: 0, avgCarbs: 0, avgFat: 0, count: 0 },
      weekOverWeekChange: 0,
      monthOverMonthChange: 0,
    };
  }

  // Filter to user's data with actual calories
  const loggedDays = (allData || [])
    .filter(row => row.user_id === userId && row.calories && row.calories > 0);

  // Calculate averages for different periods
  const calculateAvg = (rows: typeof loggedDays) => {
    if (rows.length === 0) {
      return { avgCalories: 0, avgProtein: 0, avgCarbs: 0, avgFat: 0, count: 0 };
    }
    const totals = rows.reduce(
      (acc, row) => ({
        calories: acc.calories + (row.calories || 0),
        protein: acc.protein + (Number(row.protein_g) || 0),
        carbs: acc.carbs + (Number(row.carbs_g) || 0),
        fat: acc.fat + (Number(row.fat_g) || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    return {
      avgCalories: Math.round(totals.calories / rows.length),
      avgProtein: Math.round(totals.protein / rows.length),
      avgCarbs: Math.round(totals.carbs / rows.length),
      avgFat: Math.round(totals.fat / rows.length),
      count: rows.length,
    };
  };

  // Last 7 logged days
  const last7 = loggedDays.slice(0, 7);
  const last7Stats = calculateAvg(last7);

  // Last 30 logged days
  const last30 = loggedDays.slice(0, 30);
  const last30Stats = calculateAvg(last30);

  // Previous 30 logged days (days 31-60)
  const previous30 = loggedDays.slice(30, 60);
  const previous30Stats = calculateAvg(previous30);

  // Week-over-week: compare last 7 to previous 7 (days 8-14)
  const previous7 = loggedDays.slice(7, 14);
  const previous7Stats = calculateAvg(previous7);
  const weekOverWeekChange = previous7Stats.avgCalories > 0
    ? Math.round(((last7Stats.avgCalories - previous7Stats.avgCalories) / previous7Stats.avgCalories) * 100)
    : 0;

  // Month-over-month
  const monthOverMonthChange = previous30Stats.avgCalories > 0
    ? Math.round(((last30Stats.avgCalories - previous30Stats.avgCalories) / previous30Stats.avgCalories) * 100)
    : 0;

  return {
    last7Days: last7Stats,
    last30Days: last30Stats,
    previous30Days: previous30Stats,
    weekOverWeekChange,
    monthOverMonthChange,
  };
}

/**
 * Get data coverage information
 * Returns earliest/latest dates and total days logged
 */
export async function getDataCoverage(
  userId: string = DEFAULT_USER_ID
): Promise<{
  earliestDate: string | null;
  latestDate: string | null;
  totalDaysLogged: number;
  daysSinceLastLog: number;
}> {
  const supabase = getSupabaseAdmin();

  const { data: allData, error } = await supabase
    .from('mfp_food_diary')
    .select('date, calories, user_id')
    .order('date', { ascending: false });

  if (error) {
    console.error('[MFP] Error fetching data coverage:', error);
    return { earliestDate: null, latestDate: null, totalDaysLogged: 0, daysSinceLastLog: 0 };
  }

  // Filter to user's data with actual calories
  const loggedDays = (allData || [])
    .filter(row => row.user_id === userId && row.calories && row.calories > 0);

  if (loggedDays.length === 0) {
    return { earliestDate: null, latestDate: null, totalDaysLogged: 0, daysSinceLastLog: 0 };
  }

  const latestDate = loggedDays[0].date;
  const earliestDate = loggedDays[loggedDays.length - 1].date;

  // Calculate days since last log
  const today = new Date();
  const lastLogDate = new Date(latestDate);
  const daysSinceLastLog = Math.floor((today.getTime() - lastLogDate.getTime()) / (1000 * 60 * 60 * 24));

  return {
    earliestDate,
    latestDate,
    totalDaysLogged: loggedDays.length,
    daysSinceLastLog,
  };
}

/**
 * Get weekly comparison data for charts
 * Returns data grouped by week for visualization
 */
export async function getWeeklyComparison(
  weeksBack: number = 4,
  userId: string = DEFAULT_USER_ID
): Promise<{
  weeks: Array<{
    weekStart: string;
    weekEnd: string;
    avgCalories: number;
    avgProtein: number;
    daysLogged: number;
  }>;
}> {
  const supabase = getSupabaseAdmin();

  const { data: allData, error } = await supabase
    .from('mfp_food_diary')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('[MFP] Error fetching weekly comparison:', error);
    return { weeks: [] };
  }

  // Filter to user's data with actual calories
  const loggedDays = (allData || [])
    .filter(row => row.user_id === userId && row.calories && row.calories > 0);

  // Group by week (Sunday-Saturday)
  const weekMap = new Map<string, typeof loggedDays>();

  for (const day of loggedDays) {
    const date = new Date(day.date);
    const dayOfWeek = date.getDay();
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - dayOfWeek);
    const weekKey = formatDate(weekStart);

    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, []);
    }
    weekMap.get(weekKey)!.push(day);
  }

  // Convert to array and take last N weeks
  const weeks = Array.from(weekMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0])) // Most recent first
    .slice(0, weeksBack)
    .map(([weekStart, days]) => {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const totals = days.reduce(
        (acc, day) => ({
          calories: acc.calories + (day.calories || 0),
          protein: acc.protein + (Number(day.protein_g) || 0),
        }),
        { calories: 0, protein: 0 }
      );

      return {
        weekStart,
        weekEnd: formatDate(weekEnd),
        avgCalories: days.length > 0 ? Math.round(totals.calories / days.length) : 0,
        avgProtein: days.length > 0 ? Math.round(totals.protein / days.length) : 0,
        daysLogged: days.length,
      };
    });

  return { weeks };
}
