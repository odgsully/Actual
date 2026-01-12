import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/cron/lifx-midnight-reset
 * Vercel Cron: Triggered at midnight daily
 * Resets all schedule flags for new day
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Convert UTC to MST (UTC-7) - Arizona doesn't observe DST
    const MST_OFFSET_HOURS = -7;
    const now = new Date();
    const mstNow = new Date(now.getTime() + MST_OFFSET_HOURS * 60 * 60 * 1000);
    const today = mstNow.toISOString().split('T')[0];

    // Create fresh record for new day
    await supabase.from('lifx_schedule_state').upsert(
      {
        date: today,
        morning_sunrise_started: false,
        morning_sunrise_start_time: null,
        morning_form_submitted: false,
        morning_form_submitted_at: null,
        morning_lights_off: false,
        evening_lock_started: false,
        evening_lock_start_time: null,
        evening_form_submitted: false,
        evening_form_submitted_at: null,
        evening_lights_off: false,
        controller_locked: false,
        lock_reason: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'date' }
    );

    // Clean up old records (keep last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0];

    await supabase.from('lifx_schedule_state').delete().lt('date', cutoffDate);

    console.log('[LIFX Midnight Reset] Daily state reset complete');

    return NextResponse.json({
      success: true,
      message: 'Midnight reset complete',
      date: today,
    });
  } catch (error) {
    console.error('[LIFX Midnight Reset] Cron error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Cron failed',
      },
      { status: 500 }
    );
  }
}
