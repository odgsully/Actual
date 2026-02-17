import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const today = new Date().toISOString().split("T")[0];

    // Fetch recent submissions to calculate streak
    const { data, error } = await supabase
      .from("context_dump_submissions")
      .select("entry_date")
      .order("entry_date", { ascending: false })
      .limit(365);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch stats" },
        { status: 500 }
      );
    }

    const dates = new Set((data || []).map((d) => d.entry_date));
    const todayCompleted = dates.has(today);

    // Calculate current streak
    let currentStreak = 0;
    const checkDate = new Date();
    // If today isn't done yet, start counting from yesterday
    if (!todayCompleted) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dateStr = checkDate.toISOString().split("T")[0];
      if (dates.has(dateStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // If today is done, include it in the streak
    if (todayCompleted) {
      currentStreak++;
    }

    return NextResponse.json({
      todayCompleted,
      currentStreak,
      totalEntries: dates.size,
    });
  } catch (error) {
    console.error("Error fetching context dump stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
