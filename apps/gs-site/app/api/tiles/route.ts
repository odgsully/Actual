import { NextResponse } from 'next/server';
import { fetchTiles, fetchTilesByPhase, fetchWarningTiles } from '@/lib/notion/tiles-client';
import type { Tile } from '@/lib/types/tiles';

export const revalidate = 60; // Revalidate every 60 seconds

/**
 * Tile name overrides - map old Notion names to display names
 * This allows updating tile names without changing Notion
 */
const TILE_NAME_OVERRIDES: Record<string, { name: string; desc?: string }> = {
  // RealtyOne tiles
  'RealtyOne Events button': { name: 'RE Events', desc: '' },
  '10. RealtyOne Events button': { name: 'RE Events', desc: '' },
  "RealtyOne KPI's calulator": { name: "RE KPI's & Calc" },  // straight apostrophe
  "RealtyOne KPI\u2019s calulator": { name: "RE KPI's & Calc" },  // smart/curly apostrophe (from Notion)
  // LLM Arena
  '7. LLM Arena': { name: 'LLM Arena', desc: '' },
  'LLM Arena link/preview?': { name: 'LLM Arena', desc: '' },
  // AI Agent → Audio Agent
  'AI Agent workforce admin board': { name: 'Audio Agent Admin', desc: '' },
  // Codebase Duolingo (keep name, clear subtitle)
  'Codebase Duolingo': { name: 'Codebase Duolingo', desc: '' },
  // Datadog
  'Link to Datadog Dash': { name: 'Datadog', desc: '' },
};

/**
 * Tiles to completely hide from the dashboard
 * These tiles exist in Notion but should not be displayed
 */
const EXCLUDED_TILE_IDS = new Set([
  '2cecf08f-4499-805a-ad9b-ed3ba40ea4d9', // Habitat Pic check
  '2aacf08f-4499-80ec-8f5d-dcbefbc44878', // Select Github Repo dropdown: Go's to New Issue
]);

/**
 * Tile names to exclude (case-insensitive partial match)
 * More robust than IDs which can change
 */
const EXCLUDED_TILE_NAMES = [
  'forms (monthly) & printoff',
  'forms (quarterly) & printoff',
  'physically print weeklies',
  'physically print tomorrow daily',
  'gs site admin',
];

/**
 * Filter out excluded tiles by ID or name
 */
function filterExcludedTiles(tiles: Tile[]): Tile[] {
  return tiles.filter(tile => {
    // Check ID exclusion
    if (EXCLUDED_TILE_IDS.has(tile.id)) return false;
    // Check name exclusion (case-insensitive)
    const nameLower = tile.name.toLowerCase();
    if (EXCLUDED_TILE_NAMES.some(excluded => nameLower.includes(excluded))) return false;
    return true;
  });
}

/**
 * Apply name overrides to tiles fetched from Notion
 */
function applyTileOverrides(tiles: Tile[]): Tile[] {
  return tiles.map((tile) => {
    const override = TILE_NAME_OVERRIDES[tile.name];
    if (override) {
      return {
        ...tile,
        name: override.name,
        desc: override.desc !== undefined ? override.desc : tile.desc,
      };
    }
    return tile;
  });
}

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

    // Filter excluded tiles and apply name overrides before returning
    tiles = filterExcludedTiles(tiles);
    tiles = applyTileOverrides(tiles);

    return NextResponse.json({ tiles, count: tiles.length });
  } catch (error) {
    console.error('Error in tiles API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tiles', message: (error as Error).message },
      { status: 500 }
    );
  }
}
