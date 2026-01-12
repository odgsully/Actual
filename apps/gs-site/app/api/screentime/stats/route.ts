/**
 * Screen Time Stats API
 *
 * GET: Fetch weekly screen time data for display
 *
 * Query params:
 *   - weeks: number (default 4) - how many weeks of history to fetch
 *   - weekStart: string - specific week to fetch (optional)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';
import {
  getWeekStart,
  formatMinutes,
  formatWeekLabel,
  getCategoryColor,
  type ScreenTimeWeekly,
  type ScreenTimeWeeklyFormatted,
} from '@/lib/screentime/types';

/**
 * Transform database record to formatted display data
 */
function formatWeeklyRecord(record: ScreenTimeWeekly): ScreenTimeWeeklyFormatted {
  // Calculate category percentages and format
  let formattedCategories: ScreenTimeWeeklyFormatted['categories'] = null;
  if (record.categories && typeof record.categories === 'object') {
    const entries = Object.entries(record.categories as Record<string, number>);
    const totalCategoryMinutes = entries.reduce((sum, [, mins]) => sum + mins, 0);

    formattedCategories = entries.map(([name, minutes]) => ({
      name,
      minutes,
      formatted: formatMinutes(minutes),
      percentage: totalCategoryMinutes > 0 ? Math.round((minutes / totalCategoryMinutes) * 100) : 0,
      color: getCategoryColor(name),
    }));

    // Sort by minutes descending
    formattedCategories.sort((a, b) => b.minutes - a.minutes);
  }

  // Format top apps
  let formattedTopApps: ScreenTimeWeeklyFormatted['topApps'] = null;
  if (Array.isArray(record.top_apps)) {
    formattedTopApps = record.top_apps.map((app) => ({
      name: app.name,
      minutes: app.minutes,
      formatted: formatMinutes(app.minutes),
    }));
  }

  return {
    weekStart: record.week_start,
    weekLabel: formatWeekLabel(record.week_start),

    // Formatted metrics
    dailyAverage: record.daily_avg_minutes ? formatMinutes(record.daily_avg_minutes) : null,
    dailyAverageMinutes: record.daily_avg_minutes,
    totalTime: record.total_minutes ? formatMinutes(record.total_minutes) : null,
    totalMinutes: record.total_minutes,
    weekOverWeekChange: record.week_over_week_change,

    // Pickups & notifications
    dailyPickups: record.daily_avg_pickups,
    dailyNotifications: record.daily_avg_notifications,

    // Category data for pie chart
    categories: formattedCategories,

    // Top apps list
    topApps: formattedTopApps,

    // First apps after pickup
    firstAppsAfterPickup: record.first_apps_after_pickup,

    // Has data flag
    hasData: Boolean(
      record.daily_avg_minutes ||
      record.categories ||
      record.top_apps
    ),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const weeksCount = parseInt(searchParams.get('weeks') || '4', 10);
    const specificWeek = searchParams.get('weekStart');
    const userId = 'default-user';

    const supabase = createServerClient();
    const currentWeekStart = getWeekStart();

    // If specific week requested, just fetch that
    if (specificWeek) {
      const { data, error } = await supabase
        .from('screen_time_weekly')
        .select('*')
        .eq('user_id', userId)
        .eq('week_start', specificWeek)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = not found
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        week: data ? formatWeeklyRecord(data as ScreenTimeWeekly) : null,
      });
    }

    // Fetch multiple weeks of history
    const { data: weeks, error } = await supabase
      .from('screen_time_weekly')
      .select('*')
      .eq('user_id', userId)
      .order('week_start', { ascending: false })
      .limit(weeksCount);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Find current week data
    const currentWeekData = weeks?.find(
      (w) => w.week_start === currentWeekStart
    ) as ScreenTimeWeekly | undefined;

    // Previous weeks (excluding current)
    const previousWeeksData = (weeks || [])
      .filter((w) => w.week_start !== currentWeekStart)
      .map((w) => formatWeeklyRecord(w as ScreenTimeWeekly));

    // Check if there are pending uploads for current week
    const { data: pendingUploads } = await supabase
      .from('screen_time_uploads')
      .select('id')
      .eq('user_id', userId)
      .eq('week_start', currentWeekStart)
      .eq('processed', false);

    return NextResponse.json({
      success: true,
      currentWeek: currentWeekData
        ? formatWeeklyRecord(currentWeekData)
        : {
            weekStart: currentWeekStart,
            weekLabel: formatWeekLabel(currentWeekStart),
            dailyAverage: null,
            dailyAverageMinutes: null,
            totalTime: null,
            totalMinutes: null,
            weekOverWeekChange: null,
            dailyPickups: null,
            dailyNotifications: null,
            categories: null,
            topApps: null,
            firstAppsAfterPickup: null,
            hasData: false,
          },
      previousWeeks: previousWeeksData,
      pendingUploads: pendingUploads?.length || 0,
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
