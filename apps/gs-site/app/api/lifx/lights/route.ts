import { NextRequest, NextResponse } from 'next/server';
import { getLIFXClient } from '@/lib/lifx/client';

/**
 * GET /api/lifx/lights
 * List all LIFX lights or filter by selector
 *
 * Query params:
 * - selector: 'all' (default), 'id:xxx', 'label:xxx', 'group:xxx'
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const selector = searchParams.get('selector') || 'all';

    const client = getLIFXClient();
    const lights = await client.listLights(selector);

    return NextResponse.json({
      success: true,
      lights,
      count: lights.length,
    });
  } catch (error) {
    console.error('LIFX lights error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch lights',
      },
      { status: 500 }
    );
  }
}
