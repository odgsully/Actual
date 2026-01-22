import { NextResponse } from 'next/server';
import { recordBannerDismissal, recordBannerCompletion } from '@/lib/banners/masochist';

/**
 * POST /api/banners/masochist/record
 *
 * Records an action on the Masochist Moment banner.
 *
 * Body:
 * - appearanceId: number - The banner appearance ID
 * - action: 'dismiss' | 'complete' - The action taken
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { appearanceId, action } = body;

    if (!appearanceId || typeof appearanceId !== 'number') {
      return NextResponse.json(
        { error: 'Appearance ID is required' },
        { status: 400 }
      );
    }

    if (!action || !['dismiss', 'complete'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be "dismiss" or "complete"' },
        { status: 400 }
      );
    }

    let success: boolean;

    if (action === 'dismiss') {
      success = await recordBannerDismissal(appearanceId);
    } else {
      success = await recordBannerCompletion(appearanceId);
    }

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to record action' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      action,
      appearanceId,
    });
  } catch (error) {
    console.error('Error recording masochist banner action:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to record action' },
      { status: 500 }
    );
  }
}
