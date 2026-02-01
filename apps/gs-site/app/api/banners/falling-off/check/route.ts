import { NextResponse } from 'next/server';
import {
  shouldShowFallingOffBanner,
  recordFallingOffAppearance,
} from '@/lib/banners/falling-off';

/**
 * GET /api/banners/falling-off/check
 *
 * Checks if the Falling Off Warning banner should be shown.
 * If yes, returns the data and records the appearance.
 */
export async function GET() {
  try {
    // Check if banner should show
    const data = await shouldShowFallingOffBanner();

    if (!data) {
      return NextResponse.json({ show: false });
    }

    // Record the appearance
    const appearanceId = await recordFallingOffAppearance(data);

    return NextResponse.json({
      show: true,
      atRiskHabits: data.atRiskHabits,
      completionRate: data.completionRate,
      message: data.message,
      severity: data.severity,
      appearanceId,
    });
  } catch (error) {
    console.error('Error checking falling off banner:', error);
    return NextResponse.json(
      { error: 'Failed to check banner status' },
      { status: 500 }
    );
  }
}
