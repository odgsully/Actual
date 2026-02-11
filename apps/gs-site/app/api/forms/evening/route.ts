import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface EveningFormSubmission {
  deepWorkHours?: number;
  accomplishments?: string;
  improvements?: string;
  dayRating?: number;
  foodTracked?: boolean;
  habitatPhotoCount?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: EveningFormSubmission = await request.json();

    const today = new Date().toISOString().split("T")[0];

    const dbRecord = {
      entry_date: today,
      deep_work_hours: body.deepWorkHours ?? null,
      accomplishments: body.accomplishments || null,
      improvements: body.improvements || null,
      day_rating: body.dayRating ?? null,
      food_tracked: body.foodTracked ?? false,
      habitat_photo_count: body.habitatPhotoCount ?? 0,
      submitted_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("evening_checkin_submissions")
      .upsert([dbRecord], { onConflict: "entry_date" })
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to save evening check-in", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        id: data.id,
        submittedAt: data.submitted_at,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error processing evening check-in:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    const { data, error, count } = await supabase
      .from("evening_checkin_submissions")
      .select("*", { count: "exact" })
      .order("entry_date", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch submissions" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data,
      total: count,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
