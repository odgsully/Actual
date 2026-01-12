# Decouple Notion Tile Definitions - Implementation Plan

> **Created:** January 11, 2026
> **Updated:** January 11, 2026 (v2 - 10 critical fixes added)
> **Branch:** `decouple-notion-tiles`
> **Status:** Ready for implementation

---

## Critical Fixes Added (v2)

| # | Issue | Severity | Fix |
|---|-------|----------|-----|
| 1 | Helper functions use STATIC_TILES directly | CRITICAL | Update to use LOCAL_TILES |
| 2 | useDualFilter has hardcoded 'Org' at 3 locations | CRITICAL | Create DEFAULT_MENU constant |
| 3 | Build pipeline missing automation | HIGH | Add prebuild hook to package.json |
| 4 | Proxy wrapper causes TypeScript errors | HIGH | Use simple empty array instead |
| 5 | Admin tile settings uses hardcoded IDs | MEDIUM | Add verification step |
| 6 | export-tiles-to-md.ts script will break | MEDIUM | Update script after changes |
| 7 | Verification scripts use wrong module syntax | MEDIUM | Use `npx tsx` not `node` |
| 8 | React Query adds unnecessary complexity | LOW | Remove entirely, use sync function |
| 9 | No test coverage exists | LOW | Add Phase 0 for tests |
| 10 | TileRegistry name matchers may break | LOW | Add verification step |

---

## Context & Problem Statement

**User Intent:**
- Notion sync was meant for **initial reference only** during build
- Live Notion API should **only provide DATA** (habits values, tasks values)
- ALL ~55 tile definitions should be **LOCAL** (hardcoded)

**Current Architecture (Wrong):**
- `STATIC_TILES` (47 tiles) - Synced from Notion definitions
- `LOCAL_TILES` (8 tiles) - Hardcoded locally
- Split creates unnecessary Notion dependency for tile DEFINITIONS

**Why Not All 49+ Tiles Show:**
1. Default menu filter = "Org" (hides non-Org tiles)
2. 6 tiles excluded by name pattern
3. 2 tiles excluded by ID
4. TypeII filter can further restrict

---

## Phase 0: Pre-Work (FIX #9 - Create Tests First)

**Commit after this phase:** `git commit -m "test(gs-site): add tile system test coverage"`

Before making changes, create tests to catch regressions:

### Step 0.1: Create Tile Hook Tests
**Create:** `apps/gs-site/__tests__/hooks/useTiles.test.ts`

```typescript
import { renderHook } from '@testing-library/react';
import { useTiles, useStaticTiles } from '@/hooks/useTiles';

describe('useTiles', () => {
  it('returns tiles immediately (no loading state)', () => {
    const { result } = renderHook(() => useTiles());
    expect(result.current.tiles.length).toBeGreaterThan(0);
    expect(result.current.isLoading).toBe(false);
  });

  it('filters by phase correctly', () => {
    const { result } = renderHook(() => useTiles({ phase: 'Morning' }));
    result.current.tiles.forEach(tile => {
      expect(tile.phase).toContain('Morning');
    });
  });

  it('filters warnings only', () => {
    const { result } = renderHook(() => useTiles({ warningsOnly: true }));
    result.current.tiles.forEach(tile => {
      expect(tile.actionWarning).toBe(true);
    });
  });

  it('excludes tiles by name pattern', () => {
    const { result } = renderHook(() => useTiles());
    const names = result.current.tiles.map(t => t.name.toLowerCase());
    expect(names.some(n => n.includes('youtube wrapper'))).toBe(false);
    expect(names.some(n => n.includes('gs site admin'))).toBe(false);
  });
});
```

### Step 0.2: Create Dual Filter Tests
**Create:** `apps/gs-site/__tests__/hooks/useDualFilter.test.ts`

```typescript
import { renderHook, act } from '@testing-library/react';
import { useDualFilter } from '@/hooks/useDualFilter';

const mockTiles = [
  { id: '1', name: 'Test', menu: ['Org'], typeII: 'Button' },
  { id: '2', name: 'Test2', menu: ['Software'], typeII: 'Graph' },
];

describe('useDualFilter', () => {
  it('defaults to ALL menu (FIX #2 verification)', () => {
    const { result } = renderHook(() => useDualFilter(mockTiles));
    expect(result.current.activeCategory).toBe('ALL');
  });

  it('filters by menu category', () => {
    const { result } = renderHook(() => useDualFilter(mockTiles));
    act(() => result.current.setActiveCategory('Org'));
    expect(result.current.filteredTiles.length).toBe(1);
  });

  it('does not write ALL to URL (should be clean)', () => {
    // URL should not contain ?menu=ALL
    const { result } = renderHook(() => useDualFilter(mockTiles));
    // Verify URL handling
  });
});
```

### Step 0.3: Create Helper Function Tests
**Create:** `apps/gs-site/__tests__/lib/tiles.test.ts`

```typescript
import { getTileCountsByCategory, getStaticTilesByPhase, getStaticWarningTiles } from '@/lib/data/tiles';

describe('tile helper functions', () => {
  it('getTileCountsByCategory returns correct counts', () => {
    const counts = getTileCountsByCategory();
    expect(counts.ALL).toBeGreaterThan(0);
    expect(typeof counts.Org).toBe('number');
  });

  it('getStaticTilesByPhase filters correctly', () => {
    const tiles = getStaticTilesByPhase('GS Site Standing');
    tiles.forEach(tile => {
      expect(tile.phase).toContain('GS Site Standing');
    });
  });

  it('getStaticWarningTiles returns only warning tiles', () => {
    const tiles = getStaticWarningTiles();
    tiles.forEach(tile => {
      expect(tile.actionWarning).toBe(true);
    });
  });
});
```

- [ ] Create test files
- [ ] Run tests: `npm test` - all should pass with current code
- [ ] Tests will catch regressions during refactor

---

## Safety Checklist (Pre-Implementation)

- [ ] Create new branch: `decouple-notion-tiles`
- [ ] Backup `lib/data/tiles.ts` → `lib/data/tiles.ts.backup`
- [ ] Backup `hooks/useTiles.ts` → `hooks/useTiles.ts.backup`
- [ ] Verify dev server runs before changes

### Pre-flight Tile Count Snapshot
Capture current state for verification:
```bash
cd apps/gs-site

# Count STATIC_TILES
grep -c '"id":' lib/data/tiles.ts
# Expected: ~55 (47 static + 8 local)

# Document by category (FIX #7: Use tsx, not node - tiles.ts is ESM)
npx tsx -e "
import { STATIC_TILES, LOCAL_TILES } from './lib/data/tiles';
console.log('STATIC_TILES:', STATIC_TILES.length);
console.log('LOCAL_TILES:', LOCAL_TILES.length);
console.log('Total:', STATIC_TILES.length + LOCAL_TILES.length);
"
```
- [ ] Record counts: STATIC_TILES=___, LOCAL_TILES=___, Total=___

### Pre-flight Import Dependency Check
Verify what imports tiles-client before deprecating:
```bash
# Check all imports of tiles-client
grep -r "tiles-client" apps/gs-site --include="*.ts" --include="*.tsx"

# Check direct imports of STATIC_TILES
grep -r "STATIC_TILES" apps/gs-site --include="*.ts" --include="*.tsx"

# Check direct imports of LOCAL_TILES
grep -r "LOCAL_TILES" apps/gs-site --include="*.ts" --include="*.tsx"
```
- [ ] Document all files that import these (may need updates)

### Pre-flight Notion DATA API Test
Verify DATA APIs work BEFORE changes (baseline):
```bash
# Start dev server first: npm run dev

# Test habits API
curl -s http://localhost:3003/api/notion/habits/streaks | head -c 200

# Test tasks API
curl -s http://localhost:3003/api/notion/tasks/completion | head -c 200
```
- [ ] Confirm both return valid JSON data

---

## Phase 1: Consolidate Tile Definitions

**Commit after this phase:** `git commit -m "feat(gs-site): consolidate tile definitions into LOCAL_TILES"`

### Step 1.1: Run Automated Merge Script
Instead of manual copy/paste, use this TypeScript script to merge tiles with overrides applied.

**IMPORTANT:** The tiles file is TypeScript, so we must use `tsx` (not plain `node`).

**Create:** `apps/gs-site/scripts/merge-tiles.ts`
```typescript
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
console.log('STATIC_TILES (after exclusions):', processedStatic.length);
console.log('Total merged:', merged.length);

// Output as JSON for manual review
fs.writeFileSync(
  path.join(__dirname, 'merged-tiles.json'),
  JSON.stringify(merged, null, 2)
);
console.log('\nWrote merged-tiles.json for review');
```

- [ ] Create the merge script as `.ts` file
- [ ] Run: `cd apps/gs-site && npx tsx scripts/merge-tiles.ts`
- [ ] Review `scripts/merged-tiles.json` output
- [ ] Verify tile count matches expected
- [ ] Check for duplicate names (see Step 1.1a)

### Step 1.1a: Verify No Duplicate Names (Critical)
Name overrides create multiple tiles with same display name. Verify React keys use `id`, not `name`:

```bash
# Check for duplicate names in merged output
cat scripts/merged-tiles.json | jq '[.[].name] | group_by(.) | map(select(length > 1)) | .[][0]'
# If any output, those are duplicates - ensure keying uses tile.id

# Verify TileRegistry keys by id (should already be true)
grep -n "key=" apps/gs-site/components/tiles/TileRegistry.tsx
grep -n "key=" apps/gs-site/app/private/gs-site/page.tsx
# Should see: key={tile.id} NOT key={tile.name}
```
- [ ] Confirm all React keys use `tile.id`
- [ ] If duplicate names exist, that's OK as long as keying is by ID

### Step 1.2: Update tiles.ts with Merged Data
**File:** `apps/gs-site/lib/data/tiles.ts`

- [ ] Replace `LOCAL_TILES` array with contents from `merged-tiles.json`
- [ ] Set `STATIC_TILES` to empty with runtime warning (see below)
- [ ] Delete the merge script and JSON output after use

**FIX #4: Use Simple Empty Array (NOT Proxy)**
The Proxy approach causes TypeScript errors (`Proxy<Tile[]>` not assignable to `Tile[]`).
Use simple deprecation instead:

```typescript
// DEPRECATED: All tiles now in LOCAL_TILES
// Do NOT use STATIC_TILES - it's empty and will cause bugs
export const STATIC_TILES: Tile[] = [];

// Add runtime warning in development (optional - in consuming code)
// if (process.env.NODE_ENV === 'development' && tiles === STATIC_TILES) {
//   console.warn('[DEPRECATED] STATIC_TILES is empty - use LOCAL_TILES');
// }
```
- [ ] Set `STATIC_TILES = []` (simple empty array, no Proxy)
- [ ] Add comment explaining deprecation

**Verification:**
```bash
# Count total tiles
grep -c '"id":' apps/gs-site/lib/data/tiles.ts
# Expected: ~53 (55 minus 2 excluded)
```

### Step 1.3: Update Header Comment
- [ ] Change comment to indicate these are **local definitions only**
- [ ] Remove "synced from Notion" references
- [ ] Add note: "Notion is used only for DATA (habits, tasks), not definitions"

### Step 1.4: FIX #1 - Update Helper Functions to Use LOCAL_TILES
**File:** `apps/gs-site/lib/data/tiles.ts` (lines ~1200+)

These functions currently reference `STATIC_TILES` and will return 0/empty after changes:

```typescript
// BEFORE (BROKEN after changes):
export function getTileCountsByCategory(): Record<string, number> {
  const counts: Record<string, number> = { ALL: STATIC_TILES.length }; // Returns 0!
  for (const tile of STATIC_TILES) { ... }  // Never executes!
}

// AFTER (FIXED):
export function getTileCountsByCategory(): Record<string, number> {
  const counts: Record<string, number> = { ALL: LOCAL_TILES.length };
  for (const tile of LOCAL_TILES) {
    for (const category of tile.menu) {
      counts[category] = (counts[category] || 0) + 1;
    }
  }
  return counts;
}
```

- [ ] Update `getTileCountsByCategory()` to use `LOCAL_TILES`
- [ ] Update `getStaticTilesByPhase()` to use `LOCAL_TILES` (rename to `getTilesByPhase()`)
- [ ] Update `getStaticWarningTiles()` to use `LOCAL_TILES` (rename to `getWarningTiles()`)
- [ ] Search for any other functions using STATIC_TILES: `grep -n "STATIC_TILES" lib/data/tiles.ts`

### Step 1.5: FIX #3 - Add Build Automation to package.json
**File:** `apps/gs-site/package.json`

Ensure merge runs on every build (not just manually):

```json
{
  "scripts": {
    "prebuild": "npx tsx scripts/merge-tiles.ts || true",
    "build": "next build",
    "dev": "next dev -p 3003"
  }
}
```

**Note:** The `|| true` ensures build continues even if merge script doesn't exist (for CI after script is removed).

- [ ] Add `prebuild` script to package.json
- [ ] Test: `npm run build` should run merge first
- [ ] After architecture is stable, remove prebuild hook (tiles are now static)

---

## Phase 2: Simplify useTiles Hook

**Commit after this phase:** `git commit -m "feat(gs-site): simplify useTiles to use local data only"`

### Step 2.1: FIX #8 - Remove React Query Entirely (Simplify to Sync)
**File:** `apps/gs-site/hooks/useTiles.ts`

Current flow:
```
LOCAL_TILES + (API fetch OR STATIC_TILES fallback)
→ React Query with 5-min stale time, caching, error handling
```

New flow:
```
LOCAL_TILES only (synchronous, no async, no caching)
```

**Complete Rewrite - Remove React Query:**
```typescript
import { useMemo } from 'react';
import { LOCAL_TILES } from '@/lib/data/tiles';
import type { Tile, TilePhase } from '@/lib/types/tiles';

const EXCLUDED_TILE_NAMES = [
  'forms (monthly) & printoff',
  'forms (quarterly) & printoff',
  'physically print weeklies',
  'physically print tomorrow daily',
  'gs site admin',
  'youtube wrapper',
];

interface UseTilesOptions {
  phase?: TilePhase;
  warningsOnly?: boolean;
}

function getFilteredTiles(options: UseTilesOptions = {}): Tile[] {
  const { phase, warningsOnly = false } = options;

  let tiles = LOCAL_TILES.filter(tile => {
    const nameLower = tile.name.toLowerCase();
    return !EXCLUDED_TILE_NAMES.some(excluded => nameLower.includes(excluded));
  });

  if (phase) {
    tiles = tiles.filter(t => t.phase.includes(phase));
  }

  if (warningsOnly) {
    tiles = tiles.filter(t => t.actionWarning);
  }

  return tiles;
}

export function useTiles(options: UseTilesOptions = {}) {
  const tiles = useMemo(() => getFilteredTiles(options), [options.phase, options.warningsOnly]);

  return {
    tiles,
    count: tiles.length,
    isLoading: false,      // Always false - sync data
    isRefreshing: false,   // Removed - no API
    isError: false,        // Removed - no API
    isStatic: true,        // Always true now
    error: null,
    refetch: () => Promise.resolve(), // No-op for compatibility
  };
}

// Convenience hooks
export const useWarningTiles = () => useTiles({ warningsOnly: true });
export const usePhaseTiles = (phase: TilePhase) => useTiles({ phase });
export const useStaticTiles = () => useTiles(); // Same as useTiles now
```

- [ ] Remove all React Query imports (`useQuery`, `QueryClient`)
- [ ] Remove `fetchFn` and API fetch logic
- [ ] Simplify to synchronous `useMemo` approach
- [ ] Keep same return shape for compatibility
- [ ] Remove `isRefreshing`, `isStatic` (or keep as static values)

### Step 2.2: Clarify Exclusion Systems (Two Layers)
**IMPORTANT:** There are TWO exclusion mechanisms. Document clearly to avoid confusion:

**Layer 1: Merge-Time Exclusion (by ID) - Applied in Step 1.1**
These tiles are REMOVED from LOCAL_TILES entirely:
```
- 2cecf08f-4499-805a-ad9b-ed3ba40ea4d9 (Habitat Pic check)
- 2aacf08f-4499-80ec-8f5d-dcbefbc44878 (Select Github Repo dropdown)
```
**Result:** These tiles don't exist in the data at all.

**Layer 2: Runtime Exclusion (by Name) - Applied in useTiles hook**
These tiles exist in LOCAL_TILES but are filtered out at runtime:
```typescript
const EXCLUDED_TILE_NAMES = [
  'forms (monthly) & printoff',
  'forms (quarterly) & printoff',
  'physically print weeklies',
  'physically print tomorrow daily',
  'gs site admin',
  'youtube wrapper',
];
```
**Result:** These tiles exist in data but never render.

- [ ] Add clear comment in `useTiles.ts` explaining this is Layer 2 exclusion
- [ ] Add clear comment in `tiles.ts` explaining Layer 1 exclusions were applied at merge time
- [ ] Consider: Should Layer 2 tiles also be removed at merge time for simplicity?

---

## Phase 3: Update Default Filters

**Commit after this phase:** `git commit -m "feat(gs-site): change default tile filter to ALL"`

### Step 3.1: FIX #2 - Fix ALL Hardcoded 'Org' References (CRITICAL)
**File:** `apps/gs-site/hooks/useDualFilter.ts`

**CRITICAL:** There are 3+ hardcoded 'Org' references that MUST ALL be changed:

**Location 1 - useState default (line ~81):**
```typescript
// BEFORE:
const [activeCategory, setActiveCategoryState] = useState<MenuCategory>('Org');

// AFTER:
const DEFAULT_MENU: MenuCategory = 'ALL';
const [activeCategory, setActiveCategoryState] = useState<MenuCategory>(DEFAULT_MENU);
```

**Location 2 - updateUrl comparison (line ~92):**
```typescript
// BEFORE:
if (menu !== 'Org') {  // ← HARDCODED!
  params.set('menu', menu);
} else {
  params.delete('menu');
}

// AFTER:
if (menu !== DEFAULT_MENU) {
  params.set('menu', menu);
} else {
  params.delete('menu');
}
```

**Location 3 - resetFilters (line ~186):**
```typescript
// BEFORE:
const resetFilters = useCallback(() => {
  setActiveCategoryState('Org');  // ← HARDCODED!
  setActiveTypeIIState('ALL');
  updateUrl('Org', 'ALL');        // ← HARDCODED!
}, [updateUrl]);

// AFTER:
const resetFilters = useCallback(() => {
  setActiveCategoryState(DEFAULT_MENU);
  setActiveTypeIIState('ALL');
  updateUrl(DEFAULT_MENU, 'ALL');
}, [updateUrl]);
```

**Location 4 - initialMenuCategory default (line ~53):**
```typescript
// BEFORE:
const { initialMenuCategory = 'Org', ... } = options;

// AFTER:
const { initialMenuCategory = DEFAULT_MENU, ... } = options;
```

- [ ] Add constant: `const DEFAULT_MENU: MenuCategory = 'ALL';`
- [ ] Update useState default (location 1)
- [ ] Update updateUrl comparison (location 2)
- [ ] Update resetFilters (location 3)
- [ ] Update initialMenuCategory default (location 4)
- [ ] Search for any other 'Org' references: `grep -n "'Org'" hooks/useDualFilter.ts`

### Step 3.2: Verify URL Handling (Critical Edge Case)
The filter hook syncs state to URL. Changing default requires careful handling:

**Current behavior to verify:**
```typescript
// useDualFilter.ts likely has:
// 1. Initialize from URL: const menu = searchParams.get('menu') || 'Org'
// 2. Write to URL on change: router.push(`?menu=${menu}`)
```

**Requirements:**
1. `ALL` should NOT appear in URL (it's the new default)
2. Old bookmarks with `?menu=Org` should still work
3. No "URL thrash" (constant rewriting on load)

**Verify with these tests:**
```bash
# Test 1: Fresh load (no params)
# Open http://localhost:3003/private/gs-site
# Expected: ALL tiles shown, URL stays clean (no ?menu=ALL)

# Test 2: Old bookmark
# Open http://localhost:3003/private/gs-site?menu=Org
# Expected: Only Org tiles shown, URL keeps ?menu=Org

# Test 3: Click filter then back
# Click "Software" filter, then browser back button
# Expected: Returns to previous state without breaking
```

- [ ] Verify URL initialization logic handles missing param as "ALL"
- [ ] Verify "ALL" is not written to URL (only non-default values)
- [ ] Verify old deep links (`?menu=Org`) still work
- [ ] Test browser back/forward navigation

---

## Phase 4: Deprecate Notion Tile Sync

**Commit after this phase:** `git commit -m "chore(gs-site): deprecate Notion tile sync infrastructure"`

### Step 4.1: Remove Sync Script from package.json
**File:** `apps/gs-site/package.json`

- [ ] Remove or comment out: `"sync-tiles": "tsx scripts/sync-notion-tiles.ts"`
- [ ] Add deprecation comment if keeping for reference

### Step 4.2: Archive Sync Script
**File:** `apps/gs-site/scripts/sync-notion-tiles.ts`

- [ ] Move to `scripts/archive/sync-notion-tiles.ts.deprecated`
- [ ] Or add header comment: "DEPRECATED - tiles now local only"

### Step 4.3: Check API Route Consumers FIRST
**Before removing `/api/tiles`, verify no other consumers exist:**

```bash
# Search entire monorepo for /api/tiles usage
grep -r "api/tiles" . --include="*.ts" --include="*.tsx" --include="*.js" | grep -v node_modules | grep -v ".backup"

# Search for fetch calls to this endpoint
grep -r "fetch.*tiles" apps/ --include="*.ts" --include="*.tsx"

# Check if any other apps in monorepo use it
grep -r "api/tiles" apps/wabbit apps/wabbit-re apps/gsrealty-client --include="*.ts" --include="*.tsx" 2>/dev/null

# Check for diagnostic/admin pages
grep -r "tiles" apps/gs-site/app/admin --include="*.tsx"
```

**If consumers found:**
- [ ] Option A: Keep route, but return LOCAL_TILES directly (no Notion fetch)
- [ ] Option B: Update consumers to import from `lib/data/tiles` directly

**If NO consumers found:**
- [ ] Delete `app/api/tiles/route.ts` entirely
- [ ] Or move to `app/api/tiles/route.ts.deprecated` for reference

**File:** `apps/gs-site/app/api/tiles/route.ts`

### Step 4.4: Deprecate tiles-client.ts
**File:** `apps/gs-site/lib/notion/tiles-client.ts`

- [ ] Move to `lib/notion/archive/tiles-client.ts.deprecated`
- [ ] Or delete if no longer needed

---

## Phase 4.5: Update Dependent Scripts & Verify Matchers

**Commit after this phase:** `git commit -m "fix(gs-site): update scripts and verify tile matchers"`

### Step 4.5.1: FIX #6 - Update export-tiles-to-md.ts Script
**File:** `apps/gs-site/scripts/export-tiles-to-md.ts`

This script reads `STATIC_TILES` and `LOCAL_TILES` separately. After changes:
- `STATIC_TILES` = [] (empty)
- `LOCAL_TILES` = 53 tiles

The script may misreport stats or fail.

**Required Changes:**
```typescript
// BEFORE:
const allTiles = [...STATIC_TILES, ...LOCAL_TILES];
const staticCount = STATIC_TILES.length;
const localCount = LOCAL_TILES.length;

// AFTER:
const allTiles = LOCAL_TILES;  // All tiles are now in LOCAL_TILES
const totalCount = LOCAL_TILES.length;
// Remove separate static/local counting
```

- [ ] Update script to only read `LOCAL_TILES`
- [ ] Remove references to `STATIC_TILES`
- [ ] Update any stats/reporting that showed separate counts
- [ ] Test: `npm run export-tiles` should still generate valid markdown

### Step 4.5.2: FIX #5 - Verify Admin Tile Settings IDs
**File:** `apps/gs-site/lib/admin/tile-settings.ts`

Has `CONFIGURABLE_TILES` with hardcoded IDs. Verify they exist in LOCAL_TILES:

```bash
# List configurable tile IDs
grep -E "id.*:" lib/admin/tile-settings.ts

# Verify each ID exists in LOCAL_TILES
npx tsx -e "
import { LOCAL_TILES } from './lib/data/tiles';
const EXPECTED_IDS = [
  'realtyone-events',
  'days-till-counter',
  'eating-challenges',
  'codebase-duolingo',
  'days-since-bloodwork',
  'morning-form',
  'memento-morri',
  'random-contact',
  'accountability-report',
];
const existingIds = new Set(LOCAL_TILES.map(t => t.id));
EXPECTED_IDS.forEach(id => {
  console.log(id, existingIds.has(id) ? '✓' : '✗ MISSING');
});
"
```

- [ ] Run verification script
- [ ] If any IDs are missing, update `tile-settings.ts` or add tiles to LOCAL_TILES

### Step 4.5.3: FIX #10 - Verify TileRegistry Name Matchers Still Work
**File:** `apps/gs-site/components/tiles/TileRegistry.tsx`

Has 108+ name matchers like:
```typescript
if (name.includes('habits streak')) return HabitsStreakTile;
if (name.toLowerCase() === 're events') return RealtyOneEventsTile;
```

Name overrides could break these. Verify all matchers still match:

```bash
# Extract all tile names from LOCAL_TILES
npx tsx -e "
import { LOCAL_TILES } from './lib/data/tiles';
LOCAL_TILES.forEach(t => console.log(t.name));
" > /tmp/tile-names.txt

# Check if TileRegistry patterns match
# (Manual review or automated test)
```

**Potential Breaking Changes:**
| Original Name | Override | Matcher Pattern | Status |
|---------------|----------|-----------------|--------|
| RealtyOne Events button | RE Events | `.includes('realtyone')` | May break |
| LLM Arena | LLM Benchmarks | `.includes('llm arena')` | May break |

- [ ] Review TileRegistry matchers for overridden names
- [ ] Update matchers if needed to match new names
- [ ] Test: Each tile should render the correct component

---

## Phase 5: PRESERVE Notion DATA APIs (Critical)

**DO NOT MODIFY these files - they must remain functional:**

### Habits APIs (5 routes):
- [ ] Verify: `/api/notion/habits/streaks` works
- [ ] Verify: `/api/notion/habits/heatmap` works
- [ ] Verify: `/api/notion/habits/completion` works
- [ ] Verify: `/api/notion/habits/insights` works
- [ ] Verify: `/api/notion/habits/update` works

### Tasks APIs (7 routes):
- [ ] Verify: `/api/notion/tasks/completion` works
- [ ] Verify: `/api/notion/tasks/by-rank` works
- [ ] Verify: `/api/notion/tasks/overdue` works
- [ ] Verify: `/api/notion/tasks/high-priority` works
- [ ] Verify: `/api/notion/tasks/this-week` works
- [ ] Verify: `/api/notion/tasks/this-month` works
- [ ] Verify: `/api/notion/tasks/this-quarter` works

### Data Hooks (preserve completely):
- [ ] Verify: `useHabitsData.ts` unchanged
- [ ] Verify: `useTasksData.ts` unchanged

### Notion Clients (preserve completely):
- [ ] Verify: `lib/notion/habits.ts` unchanged
- [ ] Verify: `lib/notion/tasks.ts` unchanged

---

## Phase 6: Update Documentation

### Step 6.1: Update CLAUDE.md
**File:** `apps/gs-site/CLAUDE.md`

- [ ] Update "Notion Integration Status" section
- [ ] Clarify: Notion is for DATA only, not tile definitions
- [ ] Remove references to `npm run sync-tiles`

### Step 6.2: Update tile-logic-untile.md
- [ ] Add note about architecture change
- [ ] Document that tiles are now fully local

---

## Verification Checklist (Post-Implementation)

### Tile Count Verification:
```bash
cd apps/gs-site

# FIX #7: Use tsx, not node (tiles.ts is ESM)
npx tsx -e "
import { STATIC_TILES, LOCAL_TILES } from './lib/data/tiles';
console.log('STATIC_TILES:', STATIC_TILES.length, '(should be 0)');
console.log('LOCAL_TILES:', LOCAL_TILES.length, '(should be ~53)');
"
```
- [ ] STATIC_TILES = 0 (empty)
- [ ] LOCAL_TILES = ~53 (all tiles minus 2 excluded by ID)

### Tile Rendering (Visual Check):
- [ ] All ~53 tiles render when menu = "ALL"
- [ ] Filter by "Org" shows Org-tagged tiles only
- [ ] Filter by "Software" shows Software-tagged tiles
- [ ] TypeII filters work correctly
- [ ] Priority sorting works (1 → 2 → 3 → null)
- [ ] Name overrides display correctly (e.g., "RE Events" not "RealtyOne Events")

### Notion DATA API Verification:
```bash
# Test habits API (should return same data as pre-flight)
curl -s http://localhost:3003/api/notion/habits/streaks | jq 'length'

# Test tasks API (should return same data as pre-flight)
curl -s http://localhost:3003/api/notion/tasks/completion | jq '.total'

# Test habits update (POST)
curl -s -X POST http://localhost:3003/api/notion/habits/update \
  -H "Content-Type: application/json" \
  -d '{"habitName":"Duolingo","completed":true}'
```
- [ ] Habits streaks returns data (compare to pre-flight baseline)
- [ ] Tasks completion returns data (compare to pre-flight baseline)
- [ ] Habits update responds successfully

### Component Visual Verification:
- [ ] HabitsStreakTile shows streak data
- [ ] CoreHabitsTile shows habit checkboxes
- [ ] CaliTaskListTile shows tasks
- [ ] TaskWabbedTile shows completion %
- [ ] Morning Form can update habits

### Build & Lint:
```bash
cd apps/gs-site
npm run build
npm run lint
npm run typecheck
```
- [ ] Build succeeds: `npm run build`
- [ ] Lint passes: `npm run lint`
- [ ] TypeScript passes: `npm run typecheck`
- [ ] No console errors on dashboard load
- [ ] No React Query errors in browser console

---

## File Change Summary

### Commit 0: Create Tests (Phase 0)
| File | Action | Risk |
|------|--------|------|
| `__tests__/hooks/useTiles.test.ts` | CREATE | None |
| `__tests__/hooks/useDualFilter.test.ts` | CREATE | None |
| `__tests__/lib/tiles.test.ts` | CREATE | None |

### Commit 1: Consolidate Tiles (Phase 1)
| File | Action | Risk |
|------|--------|------|
| `scripts/merge-tiles.ts` | CREATE (temporary) | None |
| `lib/data/tiles.ts` | Merge STATIC into LOCAL | Low |
| `lib/data/tiles.ts` | Update helper functions (FIX #1) | Medium |
| `package.json` | Add prebuild hook (FIX #3) | Low |

### Commit 2: Simplify Hook (Phase 2)
| File | Action | Risk |
|------|--------|------|
| `hooks/useTiles.ts` | Remove React Query entirely (FIX #8) | Medium |

### Commit 3: Change Default Filter (Phase 3)
| File | Action | Risk |
|------|--------|------|
| `hooks/useDualFilter.ts` | Fix 4 hardcoded 'Org' refs (FIX #2) | CRITICAL |

### Commit 4: Deprecate Notion Sync (Phase 4)
| File | Action | Risk |
|------|--------|------|
| `app/api/tiles/route.ts` | DELETE or archive | Low |
| `lib/notion/tiles-client.ts` | DELETE or archive | Low |
| `scripts/sync-notion-tiles.ts` | Archive | Low |
| `package.json` | Remove sync-tiles script | Low |

### Commit 4.5: Update Scripts (Phase 4.5)
| File | Action | Risk |
|------|--------|------|
| `scripts/export-tiles-to-md.ts` | Update to use LOCAL_TILES (FIX #6) | Medium |
| `lib/admin/tile-settings.ts` | Verify IDs exist (FIX #5) | Low |
| `components/tiles/TileRegistry.tsx` | Update name matchers (FIX #10) | Medium |
| `CLAUDE.md` | Update docs | Low |

### DO NOT TOUCH (Notion DATA APIs)
| File | Reason |
|------|--------|
| **lib/notion/habits.ts** | Live Notion data client |
| **lib/notion/tasks.ts** | Live Notion data client |
| **hooks/useHabitsData.ts** | Data fetching hook |
| **hooks/useTasksData.ts** | Data fetching hook |
| **app/api/notion/habits/*** | 5 data routes |
| **app/api/notion/tasks/*** | 7 data routes |

---

## Rollback Plan

### Per-Phase Rollback (Granular)
Each commit can be individually reverted:
```bash
# Revert most recent commit only
git revert HEAD

# Revert specific commit by hash
git revert <commit-hash>
```

### Full Rollback (Nuclear Option)
If multiple issues arise:
```bash
# Option 1: Restore backups
cp lib/data/tiles.ts.backup lib/data/tiles.ts
cp hooks/useTiles.ts.backup hooks/useTiles.ts

# Option 2: Reset to main
git checkout main
git branch -D decouple-notion-tiles  # Delete failed branch

# Option 3: Hard reset to before changes
git reset --hard HEAD~4  # Undo last 4 commits
```

### Verification After Rollback
```bash
npm run dev
# Open http://localhost:3003
# Verify tiles render and Notion DATA APIs work
```

---

## User Decisions (Confirmed)

1. **Excluded tiles**: KEEP HIDDEN (6 tiles remain excluded)
2. **Default filter**: YES, change from "Org" → "ALL"
3. **API route**: REMOVE Notion connection, but PRESERVE name overrides by baking them into LOCAL_TILES directly

---

## Review Summary - All 10 Issues Addressed

### GPT 5.2 Original Issues (6)
| Issue | Resolution |
|-------|------------|
| **TS script won't run with `node`** | Changed to `.ts` file with `npx tsx` |
| **Silent STATIC_TILES = [] hides bugs** | FIX #4: Use simple empty array (removed Proxy) |
| **Duplicate names → React key issues** | Added Step 1.1a to verify keys use `tile.id` |
| **Two exclusion systems confusing** | Documented Layer 1 (merge) vs Layer 2 (runtime) |
| **URL edge cases with ALL default** | FIX #2: Fix hardcoded 'Org' at 4 locations |
| **API route may have other consumers** | Added grep checks before removal in Step 4.3 |

### Deep Analysis Issues (10 total)
| # | Issue | Severity | Phase | Status |
|---|-------|----------|-------|--------|
| 1 | Helper functions use STATIC_TILES | CRITICAL | 1.4 | Step added |
| 2 | useDualFilter hardcoded 'Org' x4 | CRITICAL | 3.1 | Step updated |
| 3 | Build pipeline missing automation | HIGH | 1.5 | Step added |
| 4 | Proxy causes TypeScript errors | HIGH | 1.2 | Approach changed |
| 5 | Admin tile settings hardcoded IDs | MEDIUM | 4.5.2 | Step added |
| 6 | export-tiles-to-md.ts breaks | MEDIUM | 4.5.1 | Step added |
| 7 | Verification uses wrong syntax | MEDIUM | All | Fixed to use tsx |
| 8 | React Query unnecessary | LOW | 2.1 | Complete rewrite |
| 9 | No test coverage | LOW | 0 | Phase 0 added |
| 10 | TileRegistry matchers may break | LOW | 4.5.3 | Step added |

---

## Quick Reference: Key Files

```
apps/gs-site/
├── __tests__/                 # ← CREATE (Phase 0)
│   ├── hooks/
│   │   ├── useTiles.test.ts
│   │   └── useDualFilter.test.ts
│   └── lib/
│       └── tiles.test.ts
├── lib/
│   ├── data/
│   │   └── tiles.ts           # ← MODIFY: Merge tiles + update helpers (FIX #1)
│   ├── admin/
│   │   └── tile-settings.ts   # ← VERIFY IDs exist (FIX #5)
│   └── notion/
│       ├── habits.ts          # DO NOT TOUCH
│       ├── tasks.ts           # DO NOT TOUCH
│       └── tiles-client.ts    # ← DEPRECATE
├── hooks/
│   ├── useTiles.ts            # ← REWRITE: Remove React Query (FIX #8)
│   ├── useDualFilter.ts       # ← FIX: 4 hardcoded 'Org' refs (FIX #2 CRITICAL)
│   ├── useHabitsData.ts       # DO NOT TOUCH
│   └── useTasksData.ts        # DO NOT TOUCH
├── components/
│   └── tiles/
│       └── TileRegistry.tsx   # ← VERIFY: Name matchers (FIX #10)
├── app/
│   ├── api/
│   │   ├── tiles/
│   │   │   └── route.ts       # ← DELETE
│   │   └── notion/
│   │       ├── habits/        # DO NOT TOUCH (5 routes)
│   │       └── tasks/         # DO NOT TOUCH (7 routes)
│   └── private/
│       └── gs-site/
│           └── page.tsx       # Main dashboard (verify keys)
├── scripts/
│   ├── merge-tiles.ts         # ← CREATE (temporary)
│   ├── export-tiles-to-md.ts  # ← UPDATE (FIX #6)
│   └── sync-notion-tiles.ts   # ← ARCHIVE
├── package.json               # ← ADD prebuild hook (FIX #3)
└── CLAUDE.md                  # ← UPDATE docs
```

## Implementation Order (Recommended)

```
Phase 0  → Create tests first (catch regressions)
Phase 1  → Consolidate tiles + fix helpers + add build hook
Phase 2  → Simplify useTiles (remove React Query)
Phase 3  → Fix useDualFilter (CRITICAL - 4 hardcoded refs)
Phase 4  → Deprecate Notion tile sync
Phase 4.5 → Update scripts + verify matchers
Phase 5  → Verify Notion DATA APIs still work
Phase 6  → Update documentation
```
