import { NextResponse } from 'next/server';
import { fetchTiles, fetchTilesByPhase, fetchWarningTiles } from '@/lib/notion/tiles-client';

export const revalidate = 60; // Revalidate every 60 seconds

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phase = searchParams.get('phase') as 'GS Site Standing' | 'Morning' | 'Evening' | null;
    const warningsOnly = searchParams.get('warnings') === 'true';

    let tiles;

    if (warningsOnly) {
      tiles = await fetchWarningTiles();
    } else if (phase) {
      tiles = await fetchTilesByPhase(phase);
    } else {
      tiles = await fetchTiles();
    }

    return NextResponse.json({ tiles, count: tiles.length });
  } catch (error) {
    console.error('Error in tiles API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tiles', message: (error as Error).message },
      { status: 500 }
    );
  }
}
