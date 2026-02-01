import { NextResponse } from 'next/server';
import { recordFallingOffDismissal } from '@/lib/banners/falling-off';

/**
 * POST /api/banners/falling-off/record
 *
 * Records a dismissal action on the Falling Off Warning banner.
 *
 * Body:
 * - appearanceId: number - The banner appearance ID
 * - action: 'dismiss' - The action taken
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

    if (action !== 'dismiss') {
      return NextResponse.json(
        { error: 'Action must be "dismiss"' },
        { status: 400 }
      );
    }

    const success = await recordFallingOffDismissal(appearanceId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to record dismissal' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      action,
      appearanceId,
    });
  } catch (error) {
    console.error('Error recording falling off banner action:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to record action' },
      { status: 500 }
    );
  }
}
