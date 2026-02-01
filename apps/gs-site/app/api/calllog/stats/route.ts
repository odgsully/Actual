/**
 * Call Log Stats API
 *
 * GET: Retrieve call log statistics for display
 *      Returns current week + previous weeks data
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';
import {
  getWeekStart,
  formatWeekLabel,
  formatDuration,
  formatCallDateTime,
  formatPhoneNumber,
} from '@/lib/calllog/types';
import type {
  CallLogWeeklyFormatted,
  CallEntryFormatted,
  CallEntry,
  CallDirection,
} from '@/lib/calllog/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const weeksParam = searchParams.get('weeks');
    const weeks = weeksParam ? parseInt(weeksParam, 10) : 4;
    const userId = 'default-user';

    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 503 }
      );
    }

    // Calculate week boundaries
    const currentWeekStart = getWeekStart();
    const oldestWeekStart = new Date(currentWeekStart);
    oldestWeekStart.setDate(oldestWeekStart.getDate() - (weeks - 1) * 7);
    const oldestWeekStartStr = oldestWeekStart.toISOString().split('T')[0];

    // Fetch weekly records
    const { data: weeklyRecords, error: weeklyError } = await supabase
      .from('call_log_weekly')
      .select('*')
      .eq('user_id', userId)
      .gte('week_start', oldestWeekStartStr)
      .order('week_start', { ascending: false });

    if (weeklyError) {
      console.error('Failed to fetch weekly records:', weeklyError);
      // Return empty data if table doesn't exist
      return NextResponse.json({
        success: true,
        currentWeek: null,
        previousWeeks: [],
        recentCalls: [],
      });
    }

    // Fetch recent daily records for call list
    const { data: dailyRecords } = await supabase
      .from('call_log_daily')
      .select('calls, date')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(7);

    // Format weekly data
    const formattedWeeks: CallLogWeeklyFormatted[] = (weeklyRecords || []).map((week) => {
      const totalCalls = (week.total_outbound || 0) + (week.total_inbound || 0) + (week.total_missed || 0);
      const totalDurationSeconds = week.total_duration_seconds || 0;
      const avgDuration = totalCalls > 0 ? Math.round(totalDurationSeconds / totalCalls) : 0;

      return {
        weekStart: week.week_start,
        weekLabel: formatWeekLabel(week.week_start),
        outboundCount: week.total_outbound || 0,
        inboundCount: week.total_inbound || 0,
        missedCount: week.total_missed || 0,
        totalCalls,
        totalDuration: formatDuration(totalDurationSeconds),
        totalDurationSeconds,
        avgCallDuration: formatDuration(avgDuration),
        dailyAvgOutbound: week.daily_avg_outbound || 0,
        dailyAvgInbound: week.daily_avg_inbound || 0,
        dailyAvgTotal: (week.daily_avg_outbound || 0) + (week.daily_avg_inbound || 0),
        weekOverWeekChange: week.week_over_week_change,
        topContacts: (week.top_contacts || []).map((c: { name: string; phoneNumber: string; callCount: number; totalDuration: number }) => ({
          name: c.name,
          phoneNumber: c.phoneNumber,
          callCount: c.callCount,
          totalDuration: formatDuration(c.totalDuration),
        })),
        hasData: totalCalls > 0,
      };
    });

    // Separate current week from previous
    const currentWeek = formattedWeeks.find((w) => w.weekStart === currentWeekStart) || null;
    const previousWeeks = formattedWeeks.filter((w) => w.weekStart !== currentWeekStart);

    // Format recent calls
    const recentCalls: CallEntryFormatted[] = [];
    for (const daily of dailyRecords || []) {
      const calls = (daily.calls || []) as CallEntry[];
      for (const call of calls) {
        if (recentCalls.length >= 20) break;

        recentCalls.push({
          phoneNumber: call.phoneNumber || '',
          contactName: call.contactName || null,
          dateTime: call.dateTime || daily.date,
          dateLabel: call.dateTime ? formatCallDateTime(call.dateTime) : daily.date,
          duration: formatDuration(call.durationSeconds || 0),
          durationSeconds: call.durationSeconds || 0,
          direction: (call.direction || 'outgoing') as CallDirection,
          directionIcon: (call.direction || 'outgoing') as 'outgoing' | 'incoming' | 'missed',
        });
      }
    }

    // Sort by date descending
    recentCalls.sort((a, b) => {
      const dateA = new Date(a.dateTime).getTime();
      const dateB = new Date(b.dateTime).getTime();
      return dateB - dateA;
    });

    return NextResponse.json({
      success: true,
      currentWeek,
      previousWeeks,
      recentCalls: recentCalls.slice(0, 20),
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
