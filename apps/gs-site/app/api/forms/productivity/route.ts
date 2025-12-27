import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client with service role for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface FormSubmission {
  entryDate: string;
  entryTime: string[];
  entryTimeOther: string;
  deepWorkNoon: string;
  deepWork245pm: string;
  deepWork545pm: string;
  deepWorkEod: string;
  whatGotDone: string;
  improveHow: string;
  cleanDesk: boolean;
  cleanDesktop: boolean;
  pdfStatus: string;
  pdfsAdded: string;
  notionCalendarGrade: string;
  mood: string;
  biweeklyPhaseReflection?: string;
  biweeklyCycleNumber?: number | null;
}

export async function POST(request: NextRequest) {
  try {
    const body: FormSubmission = await request.json();

    // Validate required fields
    if (!body.entryDate) {
      return NextResponse.json(
        { error: "Date is required" },
        { status: 400 }
      );
    }

    if (!body.entryTime || body.entryTime.length === 0) {
      return NextResponse.json(
        { error: "Time is required" },
        { status: 400 }
      );
    }

    const validGrades = ["C", "C+", "B-", "B", "B+", "A-", "A"];

    if (!body.notionCalendarGrade || !validGrades.includes(body.notionCalendarGrade)) {
      return NextResponse.json(
        { error: "Notion Calendar Grade is required (C to A)" },
        { status: 400 }
      );
    }

    if (!body.mood || !validGrades.includes(body.mood)) {
      return NextResponse.json(
        { error: "Mood is required (C to A)" },
        { status: 400 }
      );
    }

    // Transform data for database insertion
    const dbRecord = {
      entry_date: body.entryDate,
      entry_time: body.entryTime,
      entry_time_other: body.entryTimeOther || null,
      deep_work_noon: body.deepWorkNoon || null,
      deep_work_245pm: body.deepWork245pm || null,
      deep_work_545pm: body.deepWork545pm || null,
      deep_work_eod: body.deepWorkEod || null,
      what_got_done: body.whatGotDone || null,
      improve_how: body.improveHow || null,
      clean_desk: body.cleanDesk,
      clean_desktop: body.cleanDesktop,
      pdf_status: body.pdfStatus || null,
      pdfs_added: body.pdfsAdded || null,
      notion_calendar_grade: body.notionCalendarGrade,
      mood: body.mood,
      biweekly_phase_reflection: body.biweeklyPhaseReflection || null,
      biweekly_cycle_number: body.biweeklyCycleNumber || null,
      submitted_at: new Date().toISOString(),
    };

    // Insert into Supabase
    const { data, error } = await supabase
      .from("productivity_form_submissions")
      .insert([dbRecord])
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to save form submission", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Form submitted successfully",
        id: data.id,
        submittedAt: data.submitted_at
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error processing form submission:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve submissions (optional, for admin use)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    const { data, error, count } = await supabase
      .from("productivity_form_submissions")
      .select("*", { count: "exact" })
      .order("submitted_at", { ascending: false })
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
