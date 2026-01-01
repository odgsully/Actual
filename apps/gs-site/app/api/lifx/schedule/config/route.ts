import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/lifx/schedule/config
 * Fetch schedule configuration
 */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('lifx_schedule_config')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Return defaults if no config exists
    const config = data || {
      morning_start_hour: 6,
      morning_start_minute: 0,
      morning_end_hour: 9,
      morning_end_minute: 0,
      morning_color: 'kelvin:3000',
      evening_lock_hour: 20,
      evening_lock_minute: 30,
      evening_lock_color: 'purple',
      evening_lock_brightness: 0.7,
      lifx_selector: 'all',
      morning_enabled: true,
      evening_enabled: true,
    };

    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error('LIFX config GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch config',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/lifx/schedule/config
 * Update schedule configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const updates = await request.json();

    // Get existing config ID or create new
    const { data: existing } = await supabase
      .from('lifx_schedule_config')
      .select('id')
      .single();

    let result;

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('lifx_schedule_config')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('lifx_schedule_config')
        .insert({
          ...updates,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ success: true, config: result });
  } catch (error) {
    console.error('LIFX config PUT error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update config',
      },
      { status: 500 }
    );
  }
}
