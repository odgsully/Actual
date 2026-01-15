/**
 * One-time script to merge STATIC_TILES into LOCAL_TILES
 * with name overrides and exclusions applied.
 *
 * Run: npx tsx scripts/merge-tiles.ts
 * (tsx is already a dev dependency in gs-site)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Current tiles
import { STATIC_TILES, LOCAL_TILES } from '../lib/data/tiles';

// Name overrides to apply
const NAME_OVERRIDES: Record<string, { name: string; desc?: string }> = {
  'RealtyOne Events button': { name: 'RE Events', desc: '' },
  '10. RealtyOne Events button': { name: 'RE Events', desc: '' },
  "RealtyOne KPI's calulator": { name: "RE KPI's & Calc" },
  "RealtyOne KPI\u2019s calulator": { name: "RE KPI's & Calc" },
  'LLM Arena': { name: 'LLM Benchmarks', desc: '' },
  '7. LLM Arena': { name: 'LLM Benchmarks', desc: '' },
  'LLM Arena link/preview?': { name: 'LLM Benchmarks', desc: '' },
  'AI Agent workforce admin board': { name: 'Audio Agent Admin', desc: '' },
  'Codebase Duolingo': { name: 'Codebase Duolingo', desc: '' },
  'Link to Datadog Dash': { name: 'Datadog', desc: '' },
};

// IDs to exclude entirely
const EXCLUDED_IDS = new Set([
  '2cecf08f-4499-805a-ad9b-ed3ba40ea4d9', // Habitat Pic check
  '2aacf08f-4499-80ec-8f5d-dcbefbc44878', // Select Github Repo dropdown
]);

// Process STATIC_TILES
const processedStatic = STATIC_TILES
  .filter(tile => !EXCLUDED_IDS.has(tile.id))
  .map(tile => {
    const override = NAME_OVERRIDES[tile.name];
    if (override) {
      return {
        ...tile,
        name: override.name,
        desc: override.desc !== undefined ? override.desc : tile.desc,
      };
    }
    return tile;
  });

// Merge: LOCAL first, then processed STATIC
const merged = [...LOCAL_TILES, ...processedStatic];

console.log('LOCAL_TILES:', LOCAL_TILES.length);
console.log('STATIC_TILES (original):', STATIC_TILES.length);
console.log('STATIC_TILES (after exclusions):', processedStatic.length);
console.log('Total merged:', merged.length);

// Check for duplicate names (informational)
const nameCount = new Map<string, number>();
merged.forEach(t => nameCount.set(t.name, (nameCount.get(t.name) || 0) + 1));
const duplicates = [...nameCount.entries()].filter(([_, count]) => count > 1);
if (duplicates.length > 0) {
  console.log('\nDuplicate names (OK if keying by ID):');
  duplicates.forEach(([name, count]) => console.log(`  - "${name}" (${count}x)`));
}

// Output as JSON for manual review
const outputPath = path.join(__dirname, 'merged-tiles.json');
fs.writeFileSync(outputPath, JSON.stringify(merged, null, 2));
console.log('\nWrote merged-tiles.json for review');
console.log('Path:', outputPath);
