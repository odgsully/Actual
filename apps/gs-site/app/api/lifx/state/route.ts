import { NextRequest, NextResponse } from 'next/server';
import { getLIFXClient, LIFXStateRequest } from '@/lib/lifx/client';

interface StateRequestBody extends LIFXStateRequest {
  selector?: string;
}

/**
 * PUT /api/lifx/state
 * Set the state of LIFX lights
 *
 * Body:
 * - selector: 'all' (default), 'id:xxx', 'label:xxx', 'group:xxx'
 * - power: 'on' | 'off'
 * - brightness: 0-1
 * - color: 'red', '#ff0000', 'kelvin:2700', etc.
 * - duration: transition time in seconds
 */
export async function PUT(request: NextRequest) {
  try {
    const body: StateRequestBody = await request.json();
    const { selector = 'all', ...state } = body;

    if (Object.keys(state).length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one state parameter required' },
        { status: 400 }
      );
    }

    const client = getLIFXClient();
    const result = await client.setState(selector, state);

    return NextResponse.json({
      success: true,
      results: result.results,
    });
  } catch (error) {
    console.error('LIFX state error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set state',
      },
      { status: 500 }
    );
  }
}
