import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/lifx/schedule/status
 * Get current lock status and schedule info
 */
export async function GET() {
  try {
    // Convert UTC to MST (UTC-7) to match cron handlers — Arizona doesn't observe DST
    const MST_OFFSET_HOURS = -7;
    const now = new Date();
    const mstNow = new Date(now.getTime() + MST_OFFSET_HOURS * 60 * 60 * 1000);
    const today = mstNow.toISOString().split('T')[0];
    const currentHour = mstNow.getUTCHours();
    const currentMinute = mstNow.getUTCMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;

    // Fetch today's state
    const { data: state } = await supabase
      .from('lifx_schedule_state')
      .select('*')
      .eq('date', today)
      .single();

    // Fetch config
    const { data: config } = await supabase
      .from('lifx_schedule_config')
      .select('*')
      .single();

    const cfg = config || {
      morning_start_hour: 6,
      morning_end_hour: 9,
      evening_lock_hour: 20,
      evening_lock_minute: 30,
    };

    // Determine lock status
    let isLocked = false;
    let lockReason: string | null = null;
    let unlockAction: string | null = null;

    // Evening lock check (8:30 PM until form submitted or midnight)
    const eveningLockTime = cfg.evening_lock_hour * 60 + cfg.evening_lock_minute;

    if (currentTimeMinutes >= eveningLockTime && !state?.evening_form_submitted) {
      isLocked = true;
      lockReason = 'evening_checkin';
      unlockAction = 'Submit evening check-in form';
    }

    // Calculate sunrise brightness if in window
    let sunriseBrightness: number | null = null;
    let isSunriseActive = false;

    const sunriseStart = cfg.morning_start_hour * 60;
    const sunriseEnd = cfg.morning_end_hour * 60;

    if (
      currentTimeMinutes >= sunriseStart &&
      !state?.morning_form_submitted
    ) {
      isSunriseActive = true;

      if (currentTimeMinutes < sunriseEnd) {
        // During sunrise window: calculate brightness
        const elapsed = currentTimeMinutes - sunriseStart;
        const duration = sunriseEnd - sunriseStart;
        sunriseBrightness = Math.min(1, Math.max(0, elapsed / duration));
      } else {
        // Past 9 AM but form not submitted: stay at 100%
        sunriseBrightness = 1;
      }
    }

    return NextResponse.json({
      success: true,
      isLocked,
      lockReason,
      unlockAction,
      sunriseBrightness,
      isSunriseActive,
      state: state || null,
      config: cfg,
    });
  } catch (error) {
    console.error('LIFX schedule status error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check status',
      },
      { status: 500 }
    );
  }
}
