import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { calculateStreak, getStartOfWeek } from "@/lib/utils/streak";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface MorningStatsResponse {
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
    weight: number | null;
    teethGrindRating: number | null;
    retainerCompliancePercent: number | null;
    photoVideoCompletionPercent: number | null;
  };
  recentSubmissions: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: submissions, error } = await supabase
      .from("morning_checkin_submissions")
      .select("*")
      .gte("entry_date", startDate.toISOString().split("T")[0])
      .order("entry_date", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch morning stats", details: error.message },
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

    // Average weight
    const weights = (submissions || [])
      .map((s) => parseFloat(s.weight))
      .filter((v) => !isNaN(v) && v > 0);
    const avgWeight =
      weights.length > 0
        ? Math.round(
            (weights.reduce((a, b) => a + b, 0) / weights.length) * 10
          ) / 10
        : null;

    // Average teeth grind rating
    const grindRatings = (submissions || [])
      .map((s) => s.teeth_grind_rating)
      .filter((r): r is number => r != null);
    const avgGrind =
      grindRatings.length > 0
        ? Math.round(
            (grindRatings.reduce((a, b) => a + b, 0) / grindRatings.length) *
              10
          ) / 10
        : null;

    // Retainer compliance percentage
    const retainerEntries = (submissions || []).filter(
      (s) => s.retainer !== null && s.retainer !== undefined
    );
    const retainerCompliance =
      retainerEntries.length > 0
        ? Math.round(
            (retainerEntries.filter((s) => s.retainer === true).length /
              retainerEntries.length) *
              100
          )
        : null;

    // Photo/video completion rate (3 boolean fields per submission)
    const totalSlots = (submissions || []).length * 3;
    const completedSlots = (submissions || []).reduce((sum, s) => {
      return (
        sum +
        (s.video_recorded ? 1 : 0) +
        (s.body_photo_taken ? 1 : 0) +
        (s.face_photo_taken ? 1 : 0)
      );
    }, 0);
    const photoVideoCompletion =
      totalSlots > 0 ? Math.round((completedSlots / totalSlots) * 100) : null;

    const response: MorningStatsResponse = {
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
        weight: avgWeight,
        teethGrindRating: avgGrind,
        retainerCompliancePercent: retainerCompliance,
        photoVideoCompletionPercent: photoVideoCompletion,
      },
      recentSubmissions: submissions?.length || 0,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching morning stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
