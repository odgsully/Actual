import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/client';

/**
 * GET /api/jarvis/[date]
 *
 * Returns a single Jarvis briefing by date.
 *
 * @param date - Briefing date in YYYY-MM-DD format
 *
 * @example
 * /api/jarvis/2025-12-25
 *
 * Response:
 * {
 *   id: "uuid",
 *   date: "2025-12-25",
 *   title: "Daily Briefing - December 25, 2025",
 *   content_html: "<div>...</div>",
 *   pdf_url: "https://...",
 *   ...
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  try {
    const { date } = params;

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Expected YYYY-MM-DD' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('jarvis_briefings')
      .select('*')
      .eq('date', date)
      .single();

    if (error) {
      // Handle not found case
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: `No briefing found for ${date}` },
          { status: 404 }
        );
      }

      console.error(`Error fetching briefing for ${date}:`, error);
      return NextResponse.json(
        { error: 'Failed to fetch briefing' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, {
      headers: {
        // Cache for 10 minutes, serve stale for 2 hours
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=7200',
      },
    });
  } catch (error) {
    console.error('Unexpected error in /api/jarvis/[date]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
