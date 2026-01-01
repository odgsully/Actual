import { NextRequest, NextResponse } from 'next/server';
import { getLIFXClient, LIFXEffectRequest } from '@/lib/lifx/client';

interface EffectRequestBody extends LIFXEffectRequest {
  selector?: string;
  effect: 'breathe' | 'pulse' | 'off';
  color?: string;
}

/**
 * POST /api/lifx/effects
 * Run effects on LIFX lights
 *
 * Body:
 * - selector: 'all' (default), 'id:xxx', 'label:xxx'
 * - effect: 'breathe' | 'pulse' | 'off'
 * - color: target color for the effect
 * - period: time in seconds for one cycle (default: 1)
 * - cycles: number of cycles (default: 1, Infinity for continuous)
 * - persist: keep color after effect ends (default: false)
 * - power_on: turn on if off (default: true)
 */
export async function POST(request: NextRequest) {
  try {
    const body: EffectRequestBody = await request.json();
    const { selector = 'all', effect, color, ...options } = body;

    if (!effect) {
      return NextResponse.json(
        { success: false, error: 'Effect type required (breathe, pulse, or off)' },
        { status: 400 }
      );
    }

    const client = getLIFXClient();
    let result;

    switch (effect) {
      case 'breathe':
        if (!color) {
          return NextResponse.json(
            { success: false, error: 'Color required for breathe effect' },
            { status: 400 }
          );
        }
        result = await client.breathe(selector, color, options);
        break;

      case 'pulse':
        if (!color) {
          return NextResponse.json(
            { success: false, error: 'Color required for pulse effect' },
            { status: 400 }
          );
        }
        result = await client.pulse(selector, color, options);
        break;

      case 'off':
        result = await client.effectsOff(selector, options.power_on === false);
        break;

      default:
        return NextResponse.json(
          { success: false, error: `Unknown effect: ${effect}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      results: result.results,
    });
  } catch (error) {
    console.error('LIFX effects error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to run effect',
      },
      { status: 500 }
    );
  }
}
