import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getLIFXClient } from '@/lib/lifx/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/cron/lifx-evening-lock
 * Vercel Cron: Triggered at 8:30 PM daily
 * Turns lights purple and locks controller if evening form not submitted
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const today = new Date().toISOString().split('T')[0];

    // Check if evening form already submitted today
    const { data: state } = await supabase
      .from('lifx_schedule_state')
      .select('evening_form_submitted')
      .eq('date', today)
      .single();

    if (state?.evening_form_submitted) {
      console.log('[LIFX Evening Lock] Form already submitted, skipping lock');
      return NextResponse.json({
        success: true,
        skipped: true,
        message: 'Evening form already submitted, skipping lock',
      });
    }

    // Fetch config for selector and color
    const { data: config } = await supabase
      .from('lifx_schedule_config')
      .select('lifx_selector, evening_lock_color, evening_lock_brightness, evening_enabled')
      .single();

    if (!config?.evening_enabled) {
      console.log('[LIFX Evening Lock] Evening schedule disabled');
      return NextResponse.json({
        success: true,
        skipped: true,
        message: 'Evening schedule is disabled',
      });
    }

    const selector = config?.lifx_selector || 'all';
    const color = config?.evening_lock_color || 'purple';
    const brightness = config?.evening_lock_brightness || 0.7;

    // Turn lights purple
    const lifx = getLIFXClient();
    await lifx.setState(selector, {
      power: 'on',
      color: color,
      brightness: brightness,
      duration: 2,
    });

    // Update schedule state - set lock
    await supabase.from('lifx_schedule_state').upsert(
      {
        date: today,
        evening_lock_started: true,
        evening_lock_start_time: new Date().toISOString(),
        controller_locked: true,
        lock_reason: 'evening_checkin',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'date' }
    );

    console.log('[LIFX Evening Lock] Activated - lights set to purple, controller locked');

    return NextResponse.json({
      success: true,
      message: 'Evening lock activated, lights set to purple',
      color,
      brightness,
    });
  } catch (error) {
    console.error('[LIFX Evening Lock] Cron error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Cron failed',
      },
      { status: 500 }
    );
  }
}
