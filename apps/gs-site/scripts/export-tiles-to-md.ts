#!/usr/bin/env npx tsx
/**
 * Reverse Sync Script: Code → Markdown
 *
 * Exports tile definitions FROM working code TO documentation.
 * Direction: tiles.ts + TileRegistry.tsx → gs-site-notion-sum.md
 *
 * Usage:
 *   npm run export-tiles              # Write to gs-site-notion-sum.md
 *   npm run export-tiles -- --dry-run # Preview without writing
 *   npm run export-tiles -- --output=custom.md  # Write to custom file
 *
 * Safety:
 *   - Read-only from code (tiles.ts, TileRegistry.tsx, component files)
 *   - Write-only to markdown (never touches Notion)
 *   - Creates backup before overwriting
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GS_SITE_ROOT = resolve(__dirname, '..');

// =============================================================================
// Types
// =============================================================================

interface TileFromCode {
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
  source: 'local' | 'notion';
  hidden: boolean;
  // Computed fields
  implementationStatus?: 'Done' | 'In progress' | 'Not started';
  componentName?: string;
  componentPath?: string;
  dataHooks?: string[];
  typeII?: string;
}

interface SpecializedTileMatch {
  pattern: string;
  componentName: string;
  componentPath: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

function truncateDesc(desc: string | null | undefined, maxLen: number): string {
  if (!desc || desc.trim() === '') return '-';
  // Clean up newlines and extra spaces
  const cleaned = desc.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maxLen) return cleaned;
  return cleaned.slice(0, maxLen - 3) + '...';
}

// =============================================================================
// Data Hook Patterns (for deep scanning)
// =============================================================================

const DATA_HOOK_PATTERNS = [
  // React Query hooks
  /useQuery\s*\(/,
  /useMutation\s*\(/,
  // Custom data hooks (from gs-site)
  /useHabitsStreak/,
  /useHabitsHeatmap/,
  /useTaskCompletion/,
  /useHighPriorityTasks/,
  /useOdgsullyAnnualCommits/,
  /useGmailStats/,
  /useConnectGmail/,
  /useMyYouTubeStats/,
  /useMyTwitterStats/,
  /useWhoopInsights/,
  /useConnectWhoop/,
  /useWabbitAppHealth/,
  // API fetch patterns
  /fetch\s*\(\s*['"`]\/api\//,
  /fetch\s*\(\s*['"`]https:\/\/api\./,
];

// =============================================================================
// Step 1: Parse tiles.ts
// =============================================================================

/**
 * Parse LOCAL_TILES from tiles.ts
 * Note: As of Jan 2026, all tiles are in LOCAL_TILES (STATIC_TILES deprecated)
 */
function parseTilesFile(): {
  tiles: TileFromCode[];
} {
  const tilesPath = resolve(GS_SITE_ROOT, 'lib/data/tiles.ts');
  const content = readFileSync(tilesPath, 'utf-8');

  // Extract LOCAL_TILES array - this is now the only source of tiles
  const localTilesMatch = content.match(
    /export const LOCAL_TILES:\s*Tile\[\]\s*=\s*(\[[\s\S]*?\]);/
  );
  const tiles: TileFromCode[] = [];
  if (localTilesMatch) {
    try {
      // Parse the JSON-like array (it's valid JSON)
      const parsed = JSON.parse(localTilesMatch[1].replace(/,\s*\]/g, ']'));
      for (const tile of parsed) {
        tiles.push({ ...tile, source: 'local', hidden: false });
      }
    } catch (e) {
      console.warn('Warning: Could not parse LOCAL_TILES as JSON, using regex fallback');
    }
  }

  return { tiles };
}

// =============================================================================
// Step 2: Parse TileRegistry.tsx for SPECIALIZED_TILES
// =============================================================================

function parseSpecializedTiles(): SpecializedTileMatch[] {
  const registryPath = resolve(GS_SITE_ROOT, 'components/tiles/TileRegistry.tsx');
  const content = readFileSync(registryPath, 'utf-8');

  const matches: SpecializedTileMatch[] = [];

  // Find the SPECIALIZED_TILES array - it has a type annotation
  // Format: const SPECIALIZED_TILES: Array<{...}> = [
  const arrayStartMatch = content.match(/const SPECIALIZED_TILES[\s\S]*?=\s*\[/);
  if (!arrayStartMatch) {
    console.warn('Warning: Could not find SPECIALIZED_TILES array');
    return matches;
  }

  const startIndex = arrayStartMatch.index! + arrayStartMatch[0].length;

  // Find the matching closing bracket
  let bracketCount = 1;
  let endIndex = startIndex;
  while (bracketCount > 0 && endIndex < content.length) {
    if (content[endIndex] === '[') bracketCount++;
    if (content[endIndex] === ']') bracketCount--;
    endIndex++;
  }

  const arrayContent = content.slice(startIndex, endIndex - 1);

  // Split into entries by looking for "component:" patterns
  // Each entry looks like: { match: (name) => ..., component: ComponentName, }
  const entryRegex = /\{\s*match:\s*\(([^)]*)\)\s*=>\s*([\s\S]*?),\s*component:\s*(\w+)\s*,?\s*\}/g;

  let entry;
  while ((entry = entryRegex.exec(arrayContent)) !== null) {
    const matchExpr = entry[2].trim();
    const componentName = entry[3].trim();

    // Skip if this looks like a type definition
    if (componentName === 'ComponentType' || matchExpr.includes('boolean')) {
      continue;
    }

    // Determine component path from imports
    // Format: const ComponentName = dynamic(() => import('./path/to/Component').then(...))
    let componentPath = '';
    const importRegex = new RegExp(
      `const ${componentName}\\s*=\\s*dynamic\\s*\\([\\s\\S]*?import\\s*\\(\\s*['"]([^'"]+)['"]\\s*\\)`
    );
    const importMatch = content.match(importRegex);
    if (importMatch) {
      componentPath = importMatch[1].replace('./', '');
      if (!componentPath.endsWith('.tsx') && !componentPath.endsWith('.ts')) {
        componentPath += '.tsx';
      }
    }

    matches.push({
      pattern: matchExpr,
      componentName,
      componentPath,
    });
  }

  return matches;
}

// =============================================================================
// Step 3: Deep scan component for data hooks
// =============================================================================

function scanComponentForHooks(componentPath: string): string[] {
  if (!componentPath) return [];

  // Ensure .tsx extension
  let normalizedPath = componentPath;
  if (!normalizedPath.endsWith('.tsx') && !normalizedPath.endsWith('.ts')) {
    normalizedPath += '.tsx';
  }

  const fullPath = resolve(GS_SITE_ROOT, 'components/tiles', normalizedPath);

  if (!existsSync(fullPath)) {
    return [];
  }

  // Check if it's a file, not a directory
  try {
    const stats = require('fs').statSync(fullPath);
    if (stats.isDirectory()) {
      // Try looking for index.tsx inside the directory
      const indexPath = resolve(fullPath, 'index.tsx');
      if (existsSync(indexPath)) {
        return scanComponentForHooksFromFile(indexPath);
      }
      return [];
    }
  } catch {
    return [];
  }

  return scanComponentForHooksFromFile(fullPath);
}

function scanComponentForHooksFromFile(filePath: string): string[] {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const foundHooks: string[] = [];

    for (const pattern of DATA_HOOK_PATTERNS) {
      if (pattern.test(content)) {
        // Extract the hook name
        const match = content.match(pattern);
        if (match) {
          foundHooks.push(match[0].replace(/\s*\($/, ''));
        }
      }
    }

    return [...new Set(foundHooks)];
  } catch {
    return [];
  }
}

// =============================================================================
// Step 4: Match tiles to components and determine status
// =============================================================================

function matchTileToComponent(
  tile: TileFromCode,
  specializedTiles: SpecializedTileMatch[]
): { componentName: string; componentPath: string } | null {
  const name = tile.name.toLowerCase();

  // Check each specialized tile pattern
  for (const spec of specializedTiles) {
    const pattern = spec.pattern.toLowerCase();

    // First check for exact match patterns: === 'something'
    const exactMatches = [...pattern.matchAll(/===\s*['"]([^'"]+)['"]/g)];
    for (const exactMatch of exactMatches) {
      if (name === exactMatch[1].toLowerCase()) {
        return { componentName: spec.componentName, componentPath: spec.componentPath };
      }
    }

    // Check for includes patterns: .includes('something')
    const includesMatches = [...pattern.matchAll(/\.includes\s*\(\s*['"]([^'"]+)['"]\s*\)/g)];
    if (includesMatches.length > 0) {
      // All includes must match (AND logic typically in these patterns)
      let allMatch = true;
      for (const incl of includesMatches) {
        if (!name.includes(incl[1].toLowerCase())) {
          allMatch = false;
          break;
        }
      }
      if (allMatch) {
        return { componentName: spec.componentName, componentPath: spec.componentPath };
      }
    }

    // Check for startsWith patterns: .startsWith('something')
    const startsWithMatches = [...pattern.matchAll(/\.startsWith\s*\(\s*['"]([^'"]+)['"]\s*\)/g)];
    for (const swMatch of startsWithMatches) {
      if (name.startsWith(swMatch[1].toLowerCase())) {
        return { componentName: spec.componentName, componentPath: spec.componentPath };
      }
    }
  }

  return null;
}

function determineImplementationStatus(
  tile: TileFromCode,
  specializedTiles: SpecializedTileMatch[]
): TileFromCode {
  const match = matchTileToComponent(tile, specializedTiles);

  if (!match) {
    return {
      ...tile,
      implementationStatus: 'Not started',
      componentName: 'ButtonTile',
      componentPath: 'ButtonTile.tsx',
      dataHooks: [],
    };
  }

  // Normalize component path
  let componentPath = match.componentPath || '';
  if (!componentPath.endsWith('.tsx') && !componentPath.endsWith('.ts')) {
    componentPath += '.tsx';
  }

  const fullPath = resolve(GS_SITE_ROOT, 'components/tiles', componentPath);

  // Check if component exists (file or directory with index)
  let componentExists = false;
  try {
    if (existsSync(fullPath)) {
      const stats = require('fs').statSync(fullPath);
      componentExists = stats.isFile();
      if (stats.isDirectory()) {
        componentExists = existsSync(resolve(fullPath, 'index.tsx'));
      }
    }
  } catch {
    componentExists = false;
  }

  if (!componentExists) {
    return {
      ...tile,
      implementationStatus: 'Not started',
      componentName: match.componentName,
      componentPath: componentPath,
      dataHooks: [],
    };
  }

  const dataHooks = scanComponentForHooks(componentPath);

  if (dataHooks.length > 0) {
    return {
      ...tile,
      implementationStatus: 'Done',
      componentName: match.componentName,
      componentPath: componentPath,
      dataHooks,
    };
  }

  return {
    ...tile,
    implementationStatus: 'In progress',
    componentName: match.componentName,
    componentPath: componentPath,
    dataHooks: [],
  };
}

// =============================================================================
// Step 5: Determine Type II
// =============================================================================

function getTypeII(tile: TileFromCode): string {
  const shadcn = tile.shadcn || [];
  const desc = (tile.desc || '').toLowerCase();

  if (shadcn.includes('Dropzone') || shadcn.includes('React plugin')) return 'Dropzone';
  if (shadcn.includes('Calendar & Date Picker')) return 'Calendar';
  if (shadcn.includes('Form') || shadcn.includes('Pop-up')) return 'Form';

  // Check for metric indicators
  if (
    desc.includes('count') ||
    desc.includes('streak') ||
    desc.includes('percent') ||
    desc.includes('%') ||
    desc.includes('stats')
  ) {
    return 'Metric';
  }

  // Check for counter indicators
  if (desc.includes('days till') || desc.includes('days since') || desc.includes('countdown')) {
    return 'Counter';
  }

  if (shadcn.includes('Graphic')) {
    if (desc.includes('chart') || desc.includes('graph') || desc.includes('visualization')) {
      return 'Graph';
    }
    return 'Graph';
  }

  if (shadcn.includes('Logic')) return 'Logic';

  return 'Button';
}

// =============================================================================
// Step 6: Generate Markdown
// =============================================================================

function generateMarkdown(tiles: TileFromCode[]): string {
  const timestamp = new Date().toISOString().split('T')[0];
  const visibleTiles = tiles.filter((t) => !t.hidden);
  const hiddenTiles = tiles.filter((t) => t.hidden);

  // Count stats
  const doneCount = visibleTiles.filter((t) => t.implementationStatus === 'Done').length;
  const inProgressCount = visibleTiles.filter((t) => t.implementationStatus === 'In progress').length;
  const notStartedCount = visibleTiles.filter((t) => t.implementationStatus === 'Not started').length;

  // Count by category
  const categoryCounts: Record<string, number> = {};
  for (const tile of visibleTiles) {
    for (const cat of tile.menu || []) {
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }
  }

  // Sort tiles by priority (1 first, null last)
  const sortedTiles = [...visibleTiles].sort((a, b) => {
    const priorityOrder: Record<string, number> = { '1': 0, '2': 1, '3': 2 };
    const aOrder = a.priority ? priorityOrder[a.priority] ?? 3 : 4;
    const bOrder = b.priority ? priorityOrder[b.priority] ?? 3 : 4;
    return aOrder - bOrder;
  });

  let md = `# GS Site Tiles - Source of Truth

> **IMPORTANT**: This file is auto-generated from working code.
> Run \`npm run export-tiles\` to regenerate. Manual edits will be overwritten.
>
> **Last Synced**: ${timestamp}
> **Source**: \`tiles.ts\` + \`TileRegistry.tsx\` (deep scan)

---

## Quick Stats

| Metric | Count |
|--------|-------|
| **Total Visible** | ${visibleTiles.length} |
| **Hidden** | ${hiddenTiles.length} |
| **Done** | ${doneCount} |
| **In Progress** | ${inProgressCount} |
| **Not Started** | ${notStartedCount} |

### By Category

| Category | Count |
|----------|-------|
${Object.entries(categoryCounts)
  .sort((a, b) => b[1] - a[1])
  .map(([cat, count]) => `| ${cat} | ${count} |`)
  .join('\n')}

---

## All Tiles (Sorted by Priority)

| Name | Status | Type II | Description | Pri | 3rd Party |
|------|--------|---------|-------------|-----|-----------|
${sortedTiles
  .map((t) => {
    const thirdParty = (t.thirdParty || []).join(', ') || '-';
    const priority = t.priority || '-';
    const desc = truncateDesc(t.desc, 60);
    return `| ${t.name} | ${t.implementationStatus} | ${t.typeII} | ${desc} | ${priority} | ${thirdParty} |`;
  })
  .join('\n')}

---

## Implementation Details

### Fully Implemented (${doneCount} tiles)

| Tile | Component | Data Hooks |
|------|-----------|------------|
${sortedTiles
  .filter((t) => t.implementationStatus === 'Done')
  .map((t) => `| ${t.name} | ${t.componentName} | ${(t.dataHooks || []).join(', ') || '-'} |`)
  .join('\n')}

### Stub/Placeholder (${inProgressCount} tiles)

| Tile | Component | Path |
|------|-----------|------|
${sortedTiles
  .filter((t) => t.implementationStatus === 'In progress')
  .map((t) => `| ${t.name} | ${t.componentName} | ${t.componentPath} |`)
  .join('\n')}

### Not Yet Implemented (${notStartedCount} tiles)

| Tile | Falls Back To | Reason |
|------|---------------|--------|
${sortedTiles
  .filter((t) => t.implementationStatus === 'Not started')
  .map((t) => `| ${t.name} | ButtonTile | No custom component |`)
  .join('\n')}

---

## Full Tile Descriptions

Detailed descriptions from Notion for each tile.

${sortedTiles
  .filter((t) => t.desc && t.desc.trim() !== '')
  .map((t) => {
    const desc = t.desc.replace(/\n/g, '\n  ');
    return `### ${t.name}
**Status**: ${t.implementationStatus} | **Priority**: ${t.priority || 'None'} | **Type**: ${t.typeII}

${desc}
`;
  })
  .join('\n')}

---

## Hidden Tiles

These tiles are defined but filtered from the dashboard display.

| Name | ID | Reason |
|------|----|----- |
${hiddenTiles.map((t) => `| ${t.name} | \`${t.id}\` | Accessible via header gear icon |`).join('\n') || '| (none) | - | - |'}

---

## Notion Database References

- **Tiles Database ID**: \`28fcf08f-4499-8017-b530-ff06c9f64f97\`
- **GS Site Page ID**: \`26fcf08f-4499-80e7-9514-da5905461e73\`

---

## Type II Legend

| Type II | Description | Count |
|---------|-------------|-------|
| **Button** | Simple navigation, links | ${visibleTiles.filter((t) => t.typeII === 'Button').length} |
| **Graph** | Data visualization, charts | ${visibleTiles.filter((t) => t.typeII === 'Graph').length} |
| **Metric** | Counts, percentages, streaks | ${visibleTiles.filter((t) => t.typeII === 'Metric').length} |
| **Form** | User input, forms | ${visibleTiles.filter((t) => t.typeII === 'Form').length} |
| **Counter** | Countdowns, days since | ${visibleTiles.filter((t) => t.typeII === 'Counter').length} |
| **Calendar** | Calendar views, date pickers | ${visibleTiles.filter((t) => t.typeII === 'Calendar').length} |
| **Dropzone** | File upload | ${visibleTiles.filter((t) => t.typeII === 'Dropzone').length} |
| **Logic** | Complex backend processing | ${visibleTiles.filter((t) => t.typeII === 'Logic').length} |

---

*Generated by \`scripts/export-tiles-to-md.ts\` on ${timestamp}*
`;

  return md;
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const outputArg = args.find((a) => a.startsWith('--output='));
  const outputFile = outputArg
    ? outputArg.replace('--output=', '')
    : 'gs-site-notion-sum.md';
  const outputPath = resolve(GS_SITE_ROOT, outputFile);

  console.log('🔄 Exporting tiles from code to markdown...\n');

  // Step 1: Parse tiles.ts (all tiles are now in LOCAL_TILES)
  console.log('📖 Reading tiles.ts...');
  const { tiles } = parseTilesFile();
  console.log(`   Found ${tiles.length} tiles in LOCAL_TILES`);

  // Step 2: Parse TileRegistry.tsx
  console.log('\n📖 Reading TileRegistry.tsx...');
  const specializedTiles = parseSpecializedTiles();
  console.log(`   Found ${specializedTiles.length} SPECIALIZED_TILES patterns`);

  // Step 3 & 4: Determine implementation status for each tile
  console.log('\n🔍 Deep scanning components for data hooks...');
  const allTiles: TileFromCode[] = [];

  for (const tile of tiles) {
    const enriched = determineImplementationStatus(tile, specializedTiles);
    enriched.typeII = getTypeII(enriched);
    allTiles.push(enriched);
  }

  // Count stats
  const visible = allTiles.filter((t) => !t.hidden);
  const done = visible.filter((t) => t.implementationStatus === 'Done').length;
  const inProgress = visible.filter((t) => t.implementationStatus === 'In progress').length;
  const notStarted = visible.filter((t) => t.implementationStatus === 'Not started').length;

  console.log(`\n📊 Implementation Status:`);
  console.log(`   Done: ${done}`);
  console.log(`   In Progress: ${inProgress}`);
  console.log(`   Not Started: ${notStarted}`);

  // Step 5: Generate markdown
  console.log('\n📝 Generating markdown...');
  const markdown = generateMarkdown(allTiles);

  if (dryRun) {
    console.log('\n--- DRY RUN: Preview of generated markdown ---\n');
    console.log(markdown);
    console.log('\n--- End of preview ---');
    console.log(`\nRun without --dry-run to write to ${outputFile}`);
  } else {
    // Create backup if file exists
    if (existsSync(outputPath)) {
      const backupPath = outputPath + '.backup';
      copyFileSync(outputPath, backupPath);
      console.log(`\n💾 Backup created: ${outputFile}.backup`);
    }

    // Write output
    writeFileSync(outputPath, markdown, 'utf-8');
    console.log(`\n✅ Successfully exported ${allTiles.length} tiles to ${outputFile}`);
  }
}

main().catch((err) => {
  console.error('❌ Export failed:', err);
  process.exit(1);
});
