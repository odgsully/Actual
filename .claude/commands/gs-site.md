# GS Site Dashboard Skills

Skills for developing and managing the GS Site personal productivity dashboard.

---

## /gs-prime

Load GS site context for a new session.

**Actions:**
1. Read `apps/gs-site/lib/data/tiles.ts` to get current tile count and definitions
2. Check integration health by reading env vars for Notion, GitHub, Google, LIFX, Whoop
3. List recent changes in `apps/gs-site/` directory
4. Summarize: tile count, active integrations, phase breakdown, any tiles with warnings

**Output:** Context summary ready for development work.

---

## /add-tile

Scaffold a new tile with all required boilerplate.

**Required input:** Tile name, type (Graphic|Button|Form|Logic), phase, integrations

**Actions:**
1. Add tile definition to `apps/gs-site/lib/data/tiles.ts` in LOCAL_TILES array
2. Create component file in appropriate directory:
   - Graphic tiles: `apps/gs-site/components/tiles/graphics/[TileName]Tile.tsx`
   - Logic tiles: `apps/gs-site/components/tiles/logic/[TileName]Tile.tsx`
   - Form tiles: `apps/gs-site/components/tiles/forms/[TileName]Tile.tsx`
3. Add lazy import to `apps/gs-site/components/tiles/TileRegistry.tsx`
4. Add case mapping in `getTileComponent()` function
5. If tile needs data: create hook in `apps/gs-site/hooks/use[TileName]Data.ts`
6. If tile needs API: create route in `apps/gs-site/app/api/[endpoint]/route.ts`

**Tile definition template:**
```typescript
{
  id: "local-[kebab-name]",
  name: "[Display Name]",
  menu: ["Org"],  // Health | Org | Tracking
  status: "Not started",
  desc: "[Description]",
  shadcn: ["Graphic"],  // Graphic | Button | Form | Logic | Dropzone
  phase: ["GS Site Standing"],  // Morning | GS Site Standing | Evening
  thirdParty: [],  // Notion | GitHub | Google | etc.
  actionWarning: false,
  actionDesc: null,
  priority: "2",  // 1 | 2 | 3 | null
  typeII: null,
}
```

**Component template (Graphic):**
```typescript
'use client';

import { TileComponentProps } from '../TileDispatcher';
import { GraphicTile } from '../base/GraphicTile';

export function [TileName]Tile({ tile }: TileComponentProps) {
  // const { data, isLoading, error } = use[TileName]Data();

  return (
    <GraphicTile
      tile={tile}
      // isLoading={isLoading}
      // error={error}
    >
      <div className="flex flex-col items-center justify-center h-full">
        {/* Tile content */}
      </div>
    </GraphicTile>
  );
}
```

---

## /health-check

Check status of all GS site integrations.

**Actions:**
1. Check environment variables for each service:
   - `NOTION_API_KEY` + `NOTION_HABITS_DATABASE_ID` + `NOTION_TASKS_DATABASE_ID`
   - `GITHUB_PAT` or `GITHUB_TOKEN` or `GITHUB_ACCESS_TOKEN`
   - `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`
   - `LIFX_TOKEN`
   - `WHOOP_CLIENT_ID` + `WHOOP_CLIENT_SECRET`
2. For configured services, make test API calls:
   - Notion: Fetch habits database metadata
   - GitHub: Fetch authenticated user
   - Google: Check OAuth token validity
3. Report status table:

| Service | Configured | Connected | Notes |
|---------|------------|-----------|-------|
| Notion  | Yes/No     | Yes/No    | ...   |
| GitHub  | Yes/No     | Yes/No    | ...   |
| ...     | ...        | ...       | ...   |

**Key files:**
- `apps/gs-site/lib/integrations/health-checker.ts`
- `apps/gs-site/lib/integrations/types.ts`

---

## /tile-debug [tile-name]

Debug why a specific tile isn't rendering or behaving correctly.

**Actions:**
1. Search for tile in `apps/gs-site/lib/data/tiles.ts` - check if it exists
2. Check if tile is in `EXCLUDED_TILE_NAMES` in `apps/gs-site/hooks/useTiles.ts`
3. Check tile's `phase` property - is it filtered out by current phase?
4. Search `apps/gs-site/components/tiles/TileRegistry.tsx` for the tile name mapping
5. Verify component file exists at expected path
6. Check component exports match what registry expects
7. If tile has data hook, verify hook is working (check for errors)
8. Report findings with fix recommendations

**Common issues:**
- Tile name mismatch between `tiles.ts` and `TileRegistry.tsx` case statement
- Component not exported as named export
- Missing lazy import in registry
- Phase filtering hiding the tile
- Tile in exclusion list

---

## /why-tile-missing [tile-name]

Quick check for why a tile doesn't appear on dashboard.

**Actions:**
1. Check `LOCAL_TILES` in `lib/data/tiles.ts` - does tile exist?
2. Check `EXCLUDED_TILE_NAMES` in `hooks/useTiles.ts` - is it excluded?
3. Check tile's `phase` array - what phases show this tile?
4. Check tile's `status` - if "Done", it shows with 60% opacity
5. Check `TileRegistry.tsx` - is there a case for this tile name?

**Output:** Reason tile is missing + fix steps

---

## /integration-status

Show current state of all third-party integrations.

**Actions:**
1. Read `apps/gs-site/lib/integrations/types.ts` for service classifications
2. List services by status:

**Implemented (can health-check):**
- Notion, GitHub, Google, Whoop, InBody, Brother Printer, Logic, EXTRA LOGIC

**Coming Soon (UI prepared):**
- Apple, YouTube 3rd P, Scheduler 3rd P, Datadog

**Not Configured (needs setup):**
- Twilio, Wabbit, GS Site Realty

3. For each implemented service, show:
   - Required env vars
   - Current configuration status
   - Tiles that depend on this integration

---

## /phase-tiles [morning|standing|evening]

List all tiles for a specific phase.

**Actions:**
1. Read `apps/gs-site/lib/data/tiles.ts`
2. Filter by phase (case-insensitive):
   - `morning` → "Morning"
   - `standing` → "GS Site Standing"
   - `evening` → "Evening"
3. Output table with: Name, Type, Status, Priority, Integrations, Has Warning

**Example output:**
```
Morning Phase Tiles (12 total):

| Name              | Type    | Status      | Priority | Integrations |
|-------------------|---------|-------------|----------|--------------|
| Morning Check-in  | Form    | Not started | 1        | Notion       |
| Habits Streak     | Graphic | In progress | 1        | Notion       |
| ...               | ...     | ...         | ...      | ...          |
```

---

## /warning-tiles

List all tiles with actionWarning enabled.

**Actions:**
1. Read `apps/gs-site/lib/data/tiles.ts`
2. Filter tiles where `actionWarning: true`
3. Output with warning descriptions

**Output:**
```
Tiles with Warnings (X total):

1. [Tile Name]
   Warning: [actionDesc value]
   Integrations: [thirdParty array]

2. ...
```

---

## /add-integration

Add a new third-party integration to GS site.

**Required input:** Service name, auth type (API key | OAuth | None), data endpoints needed

**Actions:**
1. Create client in `apps/gs-site/lib/[service]/client.ts`:
   - Export `is[Service]Configured()` function
   - Export data fetching functions
   - Handle errors gracefully

2. Create API route(s) in `apps/gs-site/app/api/[service]/route.ts`:
   - Check configuration first
   - Set appropriate cache headers
   - Return typed JSON responses

3. Create React Query hook in `apps/gs-site/hooks/use[Service]Data.ts`:
   - Use consistent staleTime (5-30 min)
   - Disable refetchOnWindowFocus
   - Handle loading/error states

4. Add to health checker in `apps/gs-site/lib/integrations/types.ts`:
   - Add to appropriate service list
   - Define required env vars
   - Set timeout and retry config

5. Update `.env.example` with required variables

**Client template:**
```typescript
const API_KEY = process.env.[SERVICE]_API_KEY;

export function is[Service]Configured(): boolean {
  return !!API_KEY;
}

export async function fetch[Service]Data() {
  if (!is[Service]Configured()) {
    throw new Error('[Service] not configured');
  }

  const response = await fetch('https://api.[service].com/...', {
    headers: { 'Authorization': `Bearer ${API_KEY}` },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`[Service] API error: ${response.status}`);
  }

  return response.json();
}
```

---

## /gs-test

Run tests for gs-site app only.

**Actions:**
```bash
cd apps/gs-site && npm run typecheck && npm run lint && npm run test
```

---

## /gs-build

Build gs-site in isolation to catch errors.

**Actions:**
```bash
cd apps/gs-site && npm run build
```

---

## /cache-clear

Clear React Query cache for debugging stale data issues.

**Actions:**
1. In browser devtools, run:
```javascript
// Clear all cache
window.__REACT_QUERY_DEVTOOLS_GLOBAL_HOOK__?.getQueryClient()?.clear()

// Or clear specific query
window.__REACT_QUERY_DEVTOOLS_GLOBAL_HOOK__?.getQueryClient()?.invalidateQueries(['habits'])
```

2. Or restart dev server to clear server-side cache

3. For ISR cache, redeploy or use Vercel dashboard to purge

---

## /api-latency

Profile API route response times.

**Actions:**
1. Run timing tests against each data endpoint:
```bash
# Test each endpoint
time curl -s http://localhost:3003/api/notion/habits/streaks > /dev/null
time curl -s http://localhost:3003/api/notion/habits/heatmap > /dev/null
time curl -s http://localhost:3003/api/github/commits > /dev/null
# ... etc
```

2. Report latency table with recommendations for slow endpoints

---

## /export-tiles

Export tile definitions to markdown documentation.

**Actions:**
```bash
cd apps/gs-site && npm run export-tiles
```

Output goes to `apps/gs-site/docs/tiles.md`

---

## Quick Reference

### Key Directories
- Tile definitions: `apps/gs-site/lib/data/tiles.ts`
- Tile components: `apps/gs-site/components/tiles/`
- Tile registry: `apps/gs-site/components/tiles/TileRegistry.tsx`
- Data hooks: `apps/gs-site/hooks/`
- API routes: `apps/gs-site/app/api/`
- Integration clients: `apps/gs-site/lib/[service]/`

### Tile Types
- **ButtonTile** - Navigation/links
- **GraphicTile** - Data visualization (charts, counters, heatmaps)
- **FormTile** - User input (opens modal)
- **CalendarTile** - Date displays
- **DropzoneTile** - File uploads
- **LogicTile** - Computation-heavy displays

### Phases
- **Morning** - Blocking tiles (must complete first)
- **GS Site Standing** - Main dashboard
- **Evening** - End-of-day check-in
