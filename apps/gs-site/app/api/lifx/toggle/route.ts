import { NextRequest, NextResponse } from 'next/server';
import { getLIFXClient } from '@/lib/lifx/client';

interface ToggleRequestBody {
  selector?: string;
  duration?: number;
}

/**
 * POST /api/lifx/toggle
 * Toggle power on LIFX lights
 * If any are on, turn all off. If all off, turn all on.
 *
 * Body:
 * - selector: 'all' (default), 'id:xxx', 'label:xxx'
 * - duration: transition time in seconds
 */
export async function POST(request: NextRequest) {
  try {
    const body: ToggleRequestBody = await request.json().catch(() => ({}));
    const { selector = 'all', duration } = body;

    const client = getLIFXClient();
    const result = await client.togglePower(selector, duration);

    return NextResponse.json({
      success: true,
      results: result.results,
    });
  } catch (error) {
    console.error('LIFX toggle error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to toggle',
      },
      { status: 500 }
    );
  }
}
