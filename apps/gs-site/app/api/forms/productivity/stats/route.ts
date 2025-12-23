import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client with service role for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface FormStatsResponse {
  streak: {
    current: number;
    longest: number;
    lastSubmissionDate: string | null;
  };
  thisWeek: {
    completed: number;
    target: number; // 7 days per week
    percentage: number;
  };
  averages: {
    mood: string | null;
    calendarGrade: string | null;
    deepWorkHoursPerDay: number | null;
  };
  recentSubmissions: number;
}

// Grade values for averaging (C=1, C+=2, B-=3, B=4, B+=5, A-=6, A=7)
const GRADE_VALUES: Record<string, number> = {
  "C": 1,
  "C+": 2,
  "B-": 3,
  "B": 4,
  "B+": 5,
  "A-": 6,
  "A": 7,
};

const VALUE_TO_GRADE: Record<number, string> = {
  1: "C",
  2: "C+",
  3: "B-",
  4: "B",
  5: "B+",
  6: "A-",
  7: "A",
};

function calculateStreak(dates: string[]): { current: number; longest: number } {
  if (dates.length === 0) return { current: 0, longest: 0 };

  // Sort dates in descending order (most recent first)
  const sortedDates = [...dates].sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  );

  // Remove duplicates (multiple submissions on same day)
  const uniqueDates = [...new Set(sortedDates)];

  // Calculate current streak
  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Check if most recent submission is today or yesterday
  const mostRecent = new Date(uniqueDates[0]);
  mostRecent.setHours(0, 0, 0, 0);

  if (mostRecent.getTime() === today.getTime() || mostRecent.getTime() === yesterday.getTime()) {
    currentStreak = 1;
    let expectedDate = new Date(mostRecent);
    expectedDate.setDate(expectedDate.getDate() - 1);

    for (let i = 1; i < uniqueDates.length; i++) {
      const currentDate = new Date(uniqueDates[i]);
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

  for (let i = 0; i < uniqueDates.length - 1; i++) {
    const current = new Date(uniqueDates[i]);
    const next = new Date(uniqueDates[i + 1]);
    current.setHours(0, 0, 0, 0);
    next.setHours(0, 0, 0, 0);

    const diffDays = (current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24);

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
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function averageGrade(grades: string[]): string | null {
  if (grades.length === 0) return null;

  const validGrades = grades.filter(g => GRADE_VALUES[g] !== undefined);
  if (validGrades.length === 0) return null;

  const sum = validGrades.reduce((acc, g) => acc + GRADE_VALUES[g], 0);
  const avg = Math.round(sum / validGrades.length);

  return VALUE_TO_GRADE[avg] || null;
}

function parseDeepWorkHours(value: string | null): number {
  if (!value) return 0;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    // Fetch submissions from the last N days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: submissions, error } = await supabase
      .from("productivity_form_submissions")
      .select("*")
      .gte("entry_date", startDate.toISOString().split("T")[0])
      .order("entry_date", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch form submissions", details: error.message },
        { status: 500 }
      );
    }

    const allDates = submissions?.map(s => s.entry_date) || [];
    const { current, longest } = calculateStreak(allDates);

    // Calculate this week's submissions
    const startOfWeek = getStartOfWeek(new Date());
    const thisWeekSubmissions = submissions?.filter(s => {
      const entryDate = new Date(s.entry_date);
      return entryDate >= startOfWeek;
    }) || [];

    // Get unique days this week
    const uniqueDaysThisWeek = new Set(thisWeekSubmissions.map(s => s.entry_date)).size;

    // Calculate averages from this week's submissions
    const moods = thisWeekSubmissions.map(s => s.mood).filter(Boolean);
    const calendarGrades = thisWeekSubmissions.map(s => s.notion_calendar_grade).filter(Boolean);

    // Calculate average deep work hours
    let totalDeepWork = 0;
    let deepWorkCount = 0;

    thisWeekSubmissions.forEach(s => {
      const noon = parseDeepWorkHours(s.deep_work_noon);
      const pm245 = parseDeepWorkHours(s.deep_work_245pm);
      const pm545 = parseDeepWorkHours(s.deep_work_545pm);
      const eod = parseDeepWorkHours(s.deep_work_eod);

      // Use the highest value as the total for that day (cumulative tracking)
      const dayTotal = Math.max(noon, pm245, pm545, eod);
      if (dayTotal > 0) {
        totalDeepWork += dayTotal;
        deepWorkCount++;
      }
    });

    const response: FormStatsResponse = {
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
        mood: averageGrade(moods),
        calendarGrade: averageGrade(calendarGrades),
        deepWorkHoursPerDay: deepWorkCount > 0
          ? Math.round((totalDeepWork / deepWorkCount) * 10) / 10
          : null,
      },
      recentSubmissions: submissions?.length || 0,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching form stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
