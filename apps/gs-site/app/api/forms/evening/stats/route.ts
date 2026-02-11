import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface EveningStatsResponse {
  streak: {
    current: number;
    longest: number;
    lastSubmissionDate: string | null;
  };
  thisWeek: {
    completed: number;
    target: number;
    percentage: number;
  };
  averages: {
    dayRating: number | null;
    deepWorkHoursPerDay: number | null;
  };
  recentSubmissions: number;
}

function calculateStreak(dates: string[]): { current: number; longest: number } {
  if (dates.length === 0) return { current: 0, longest: 0 };

  const sortedDates = [...new Set(dates)].sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  // Calculate current streak
  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const mostRecent = new Date(sortedDates[0]);
  mostRecent.setHours(0, 0, 0, 0);

  if (
    mostRecent.getTime() === today.getTime() ||
    mostRecent.getTime() === yesterday.getTime()
  ) {
    currentStreak = 1;
    let expectedDate = new Date(mostRecent);
    expectedDate.setDate(expectedDate.getDate() - 1);

    for (let i = 1; i < sortedDates.length; i++) {
      const currentDate = new Date(sortedDates[i]);
      currentDate.setHours(0, 0, 0, 0);

      if (currentDate.getTime() === expectedDate.getTime()) {
        currentStreak++;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 1;

  for (let i = 0; i < sortedDates.length - 1; i++) {
    const current = new Date(sortedDates[i]);
    const next = new Date(sortedDates[i + 1]);
    current.setHours(0, 0, 0, 0);
    next.setHours(0, 0, 0, 0);

    const diffDays =
      (current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return { current: currentStreak, longest: longestStreak };
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: submissions, error } = await supabase
      .from("evening_checkin_submissions")
      .select("*")
      .gte("entry_date", startDate.toISOString().split("T")[0])
      .order("entry_date", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch evening stats", details: error.message },
        { status: 500 }
      );
    }

    const allDates = submissions?.map((s) => s.entry_date) || [];
    const { current, longest } = calculateStreak(allDates);

    // This week's submissions
    const startOfWeek = getStartOfWeek(new Date());
    const thisWeekSubmissions =
      submissions?.filter((s) => new Date(s.entry_date) >= startOfWeek) || [];
    const uniqueDaysThisWeek = new Set(
      thisWeekSubmissions.map((s) => s.entry_date)
    ).size;

    // Averages
    const ratings = (submissions || [])
      .map((s) => s.day_rating)
      .filter((r): r is number => r != null);
    const avgRating =
      ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : null;

    const deepWorkValues = (submissions || [])
      .map((s) => parseFloat(s.deep_work_hours))
      .filter((v) => !isNaN(v) && v > 0);
    const avgDeepWork =
      deepWorkValues.length > 0
        ? Math.round(
            (deepWorkValues.reduce((a, b) => a + b, 0) / deepWorkValues.length) * 10
          ) / 10
        : null;

    const response: EveningStatsResponse = {
      streak: {
        current,
        longest,
        lastSubmissionDate: allDates[0] || null,
      },
      thisWeek: {
        completed: uniqueDaysThisWeek,
        target: 7,
        percentage: Math.round((uniqueDaysThisWeek / 7) * 100),
      },
      averages: {
        dayRating: avgRating,
        deepWorkHoursPerDay: avgDeepWork,
      },
      recentSubmissions: submissions?.length || 0,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching evening stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
