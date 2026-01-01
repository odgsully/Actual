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
 * GET /api/cron/lifx-sunrise-tick
 * Vercel Cron: Triggered every minute from 6 AM to 8:59 AM
 * Gradually increases brightness from 0% to 100% over 3 hours
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Check if morning form already submitted
    const { data: state } = await supabase
      .from('lifx_schedule_state')
      .select('morning_form_submitted, morning_sunrise_started')
      .eq('date', today)
      .single();

    if (state?.morning_form_submitted) {
      console.log('[LIFX Sunrise] Morning form submitted, skipping');
      return NextResponse.json({
        success: true,
        skipped: true,
        message: 'Morning form submitted, sunrise complete',
      });
    }

    // Fetch config
    const { data: config } = await supabase
      .from('lifx_schedule_config')
      .select('*')
      .single();

    if (!config?.morning_enabled) {
      console.log('[LIFX Sunrise] Morning schedule disabled');
      return NextResponse.json({
        success: true,
        skipped: true,
        message: 'Morning schedule is disabled',
      });
    }

    const cfg = config || {
      morning_start_hour: 6,
      morning_end_hour: 9,
      morning_color: 'kelvin:3000',
      lifx_selector: 'all',
    };

    // Calculate brightness (0-1 scale over 3 hours)
    const sunriseStartMinutes = cfg.morning_start_hour * 60 + (cfg.morning_start_minute || 0);
    const sunriseEndMinutes = cfg.morning_end_hour * 60 + (cfg.morning_end_minute || 0);
    const currentTimeMinutes = currentHour * 60 + currentMinute;

    const totalDuration = sunriseEndMinutes - sunriseStartMinutes; // 180 minutes
    const elapsed = currentTimeMinutes - sunriseStartMinutes;

    // If before sunrise start, brightness is 0
    // If past sunrise end, brightness is 1 (stays at 100%)
    let brightness: number;
    if (elapsed <= 0) {
      brightness = 0;
    } else if (elapsed >= totalDuration) {
      brightness = 1;
    } else {
      brightness = elapsed / totalDuration;
    }

    // Set light state
    const lifx = getLIFXClient();
    await lifx.setState(cfg.lifx_selector, {
      power: 'on',
      color: cfg.morning_color,
      brightness: brightness,
      duration: 60, // Smooth 1-minute transition
    });

    // Mark sunrise as started if first tick
    if (!state?.morning_sunrise_started) {
      await supabase.from('lifx_schedule_state').upsert(
        {
          date: today,
          morning_sunrise_started: true,
          morning_sunrise_start_time: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'date' }
      );
    }

    const brightnessPercent = Math.round(brightness * 100);
    console.log(`[LIFX Sunrise] Set to ${brightnessPercent}% brightness`);

    return NextResponse.json({
      success: true,
      brightness: brightnessPercent,
      message: `Sunrise at ${brightnessPercent}% brightness`,
    });
  } catch (error) {
    console.error('[LIFX Sunrise] Cron error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Cron failed',
      },
      { status: 500 }
    );
  }
}
