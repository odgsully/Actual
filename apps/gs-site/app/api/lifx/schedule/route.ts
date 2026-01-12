import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * GET /api/lifx/schedule
 * Fetch today's schedule state
 */
export async function GET() {
  try {
    const today = getTodayDate();

    const { data, error } = await supabase
      .from('lifx_schedule_state')
      .select('*')
      .eq('date', today)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Return default state if no record exists
    const state = data || {
      date: today,
      morning_sunrise_started: false,
      morning_form_submitted: false,
      morning_lights_off: false,
      evening_lock_started: false,
      evening_form_submitted: false,
      evening_lights_off: false,
      controller_locked: false,
      lock_reason: null,
    };

    return NextResponse.json({ success: true, state });
  } catch (error) {
    console.error('LIFX schedule GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch state',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/lifx/schedule
 * Update today's schedule state
 */
export async function PUT(request: NextRequest) {
  try {
    const today = getTodayDate();
    const updates = await request.json();

    // Upsert today's record
    const { data, error } = await supabase
      .from('lifx_schedule_state')
      .upsert(
        {
          date: today,
          ...updates,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'date' }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, state: data });
  } catch (error) {
    console.error('LIFX schedule PUT error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update state',
      },
      { status: 500 }
    );
  }
}
