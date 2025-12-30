#!/usr/bin/env npx tsx
/**
 * Syncs tile definitions from Notion to local lib/data/tiles.ts
 *
 * Run manually: npx tsx scripts/sync-notion-tiles.ts
 * Or via npm: npm run sync-tiles
 *
 * Requirements:
 * - NOTION_API_KEY environment variable
 */

import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const TILES_DATABASE_ID = '28fcf08f-4499-8017-b530-ff06c9f64f97';
const NOTION_API_VERSION = '2022-06-28';

interface NotionPage {
  id: string;
  properties: {
    Name: { title: Array<{ plain_text: string }> };
    MENU: { multi_select: Array<{ name: string }> };
    Status: { status: { name: string } | null };
    Desc: { rich_text: Array<{ plain_text: string }> };
    shadcn: { multi_select: Array<{ name: string }> };
    Phase: { multi_select: Array<{ name: string }> };
    '3rd P': { multi_select: Array<{ name: string }> };
    'Action warning?': { multi_select: Array<{ name: string }> };
    'Action desc': { rich_text: Array<{ plain_text: string }> };
    Select: { select: { name: string } | null };
  };
}

type TypeIICategory = 'Button' | 'Graph' | 'Metric' | 'Form' | 'Counter' | 'Calendar' | 'Dropzone' | 'Logic';

interface Tile {
  id: string;
  name: string;
  menu: string[];
  status: string;
  desc: string;
  shadcn: string[];
  phase: string[];
  thirdParty: string[];
  actionWarning: boolean;
  actionDesc: string | null;
  priority: string | null;
  typeII: TypeIICategory | null;
}

/**
 * Derive TypeII category from shadcn components
 * Priority-based: more specific types take precedence
 */
function deriveTypeII(shadcn: string[]): TypeIICategory | null {
  if (!shadcn || shadcn.length === 0) return null;

  // Priority-based derivation (matches update-dec28-notion.md)
  if (shadcn.includes('Dropzone')) return 'Dropzone';
  if (shadcn.includes('Calendar & Date Picker')) return 'Calendar';
  if (shadcn.includes('Form') || shadcn.includes('Pop-up')) return 'Form';
  // Chart and Graphic are both visualization types
  if (shadcn.includes('Graphic') || shadcn.includes('Chart')) {
    // Graphic/Chart + Logic = Metric (stats, counts, etc.)
    if (shadcn.includes('Logic')) return 'Metric';
    return 'Graph';
  }
  if (shadcn.includes('Logic')) return 'Logic';
  return 'Button'; // Default fallback
}

async function fetchNotionTiles(): Promise<NotionPage[]> {
  const apiKey = process.env.NOTION_API_KEY;

  if (!apiKey) {
    throw new Error(
      'NOTION_API_KEY not found in environment variables.\n' +
        'Set it with: export NOTION_API_KEY=your_key_here'
    );
  }

  const response = await fetch(
    `https://api.notion.com/v1/databases/${TILES_DATABASE_ID}/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Notion-Version': NOTION_API_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ page_size: 100 }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Notion API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.results as NotionPage[];
}

function notionPageToTile(page: NotionPage): Tile {
  const props = page.properties;

  // Clean the name: remove newlines and leading numbers
  let name = props.Name?.title?.[0]?.plain_text || 'Untitled';
  name = name.replace(/\n/g, '').replace(/^\d+\.\s*/, '').trim();

  // Get description
  const desc = (props.Desc?.rich_text || [])
    .map((rt) => rt.plain_text)
    .join(' ')
    .trim();

  // Truncate long descriptions for the static file
  const truncatedDesc = desc.length > 100 ? desc.substring(0, 100) + '...' : desc;

  // Check for action warning
  const actionWarningValues = props['Action warning?']?.multi_select || [];
  const actionWarning = actionWarningValues.some((v) => v.name === 'Y');

  // Get action desc
  const actionDescText = (props['Action desc']?.rich_text || [])
    .map((rt) => rt.plain_text)
    .join(' ')
    .trim();

  // Extract shadcn array to derive typeII
  const shadcnArray = (props.shadcn?.multi_select || []).map((s) => s.name);

  return {
    id: page.id,
    name,
    menu: (props.MENU?.multi_select || []).map((m) => m.name),
    status: props.Status?.status?.name || 'Not started',
    desc: truncatedDesc,
    shadcn: shadcnArray,
    phase: (props.Phase?.multi_select || []).map((p) => p.name),
    thirdParty: (props['3rd P']?.multi_select || []).map((t) => t.name),
    actionWarning,
    actionDesc: actionDescText || null,
    priority: props.Select?.select?.name || null,
    typeII: deriveTypeII(shadcnArray),
  };
}

function generateTilesFile(tiles: Tile[]): string {
  const timestamp = new Date().toISOString().split('T')[0];

  return `/**
 * Static tile definitions - synced from Notion via scripts/sync-notion-tiles.ts
 * This file is the source of truth for tile structure.
 * Dynamic data (streaks, counts) is fetched per-tile at runtime.
 *
 * Auto-generated from Notion - ${timestamp}
 * Run: npm run sync-tiles
 */
import type { Tile } from '@/lib/types/tiles';

export const STATIC_TILES: Tile[] = ${JSON.stringify(tiles, null, 2)};

export default STATIC_TILES;

/**
 * Get tile count by category
 */
export function getTileCountsByCategory(): Record<string, number> {
  const counts: Record<string, number> = { ALL: STATIC_TILES.length };

  for (const tile of STATIC_TILES) {
    for (const category of tile.menu) {
      counts[category] = (counts[category] || 0) + 1;
    }
  }

  return counts;
}

/**
 * Get tiles by phase
 */
export function getStaticTilesByPhase(phase: string): Tile[] {
  return STATIC_TILES.filter(tile => tile.phase.includes(phase as any));
}

/**
 * Get tiles with warnings
 */
export function getStaticWarningTiles(): Tile[] {
  return STATIC_TILES.filter(tile => tile.actionWarning);
}
`;
}

async function main() {
  console.log('🔄 Syncing tiles from Notion...\n');

  try {
    // Fetch tiles from Notion
    const notionPages = await fetchNotionTiles();
    console.log(`📥 Fetched ${notionPages.length} tiles from Notion`);

    // Transform to Tile format
    const tiles = notionPages.map(notionPageToTile);

    // Generate the TypeScript file content
    const fileContent = generateTilesFile(tiles);

    // Get the output path
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const outputPath = resolve(__dirname, '../lib/data/tiles.ts');

    // Write the file
    writeFileSync(outputPath, fileContent, 'utf-8');

    console.log(`✅ Successfully synced ${tiles.length} tiles to lib/data/tiles.ts`);
    console.log('\nTile breakdown:');

    // Count by category
    const categoryCounts: Record<string, number> = {};
    for (const tile of tiles) {
      for (const cat of tile.menu) {
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      }
    }

    for (const [cat, count] of Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${cat}: ${count}`);
    }

    // Count by Type II
    console.log('\nType II breakdown:');
    const typeIICounts: Record<string, number> = {};
    for (const tile of tiles) {
      const typeII = tile.typeII || 'null';
      typeIICounts[typeII] = (typeIICounts[typeII] || 0) + 1;
    }
    for (const [type, count] of Object.entries(typeIICounts).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${type}: ${count}`);
    }

    // Count warnings
    const warningCount = tiles.filter((t) => t.actionWarning).length;
    console.log(`\n⚠️  Tiles with action warnings: ${warningCount}`);
  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  }
}

main();
