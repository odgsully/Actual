import { NextResponse } from 'next/server';
import {
  shouldShowMasochistBanner,
  getRandomChallenge,
  recordBannerAppearance,
} from '@/lib/banners/masochist';
import { createServerClient } from '@/lib/supabase/client';

/**
 * GET /api/banners/masochist/check
 *
 * Checks if the Masochist Moment banner should be shown.
 * If yes, returns a random challenge and records the appearance.
 */
export async function GET() {
  try {
    // Check if banner should show
    const shouldShow = await shouldShowMasochistBanner();

    if (!shouldShow) {
      return NextResponse.json({ show: false });
    }

    // Get a random challenge
    const challenge = getRandomChallenge();

    // Record the appearance and get the ID
    const supabase = createServerClient();
    const now = new Date();

    const { data, error } = await supabase
      .from('banner_appearances')
      .insert({
        banner_type: 'masochist',
        date: now.toISOString().split('T')[0],
        shown_at: now.toISOString(),
        action_taken: `shown:${challenge.id}`,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error recording banner appearance:', error);
      // Still show the banner even if recording fails
      return NextResponse.json({
        show: true,
        challenge,
        appearanceId: null,
      });
    }

    return NextResponse.json({
      show: true,
      challenge,
      appearanceId: data.id,
    });
  } catch (error) {
    console.error('Error checking masochist banner:', error);
    return NextResponse.json(
      { error: 'Failed to check banner status' },
      { status: 500 }
    );
  }
}
