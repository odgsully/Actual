# GS Site Dashboard — SKILLS.md

> Slash-command skills for Claude Code development on the personal productivity dashboard.
>
> **Port:** 3003 | **Domain:** pickleballisapsyop.com | **Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, Tanstack React Query, Zustand

---

## Quick Reference

| Skill | Purpose | When to Use |
|-------|---------|-------------|
| `/gs-prime` | Load session context | Starting a new session |
| `/add-tile` | Scaffold new tile | Adding a tile to the dashboard |
| `/tile-debug` | Diagnose broken tile | Tile not rendering |
| `/why-tile-missing` | Quick missing tile check | Tile not visible |
| `/convert-tile-to-popup` | Move tile content to modal | Tile content exceeds 112px |
| `/phase-tiles` | List tiles by phase | Understanding phase workflows |
| `/tile-status-update` | Update tile dev status | Marking tile progress |
| `/health-check` | Check all integrations | Diagnosing data issues |
| `/add-integration` | Add new 3rd party service | New data source |
| `/integration-status` | Show integration matrix | Quick status overview |
| `/export-tiles` | Regenerate tile docs | After tile changes |
| `/gs-test` | Run full test suite | Before committing |
| `/gs-build` | Build in isolation | Catch build errors |
| `/smoke-test` | Quick manual test | Verify core paths work |
| `/tile-data-flow` | Trace tile data pipeline | Debug missing data |
| `/notion-debug` | Debug Notion integration | Habits/tasks not loading |
| `/github-debug` | Debug GitHub integration | Commits not loading |
| `/deploy-gs-site` | Deploy to production | Shipping changes |

---

## Session Management

### /gs-prime

**Load GS site session context**

Run this first when starting a new session.

**Actions:**
1. Read `lib/data/tiles.ts` — current tile count, definitions, status breakdown
2. Check configured integrations via env var presence (Notion, GitHub, Google, LIFX, Whoop)
3. List recent git changes in `apps/gs-site/`
4. Generate summary: active tile count, status breakdown, integration health, any tiles with actionWarnings

**Output:** Context summary ready for development

---

## Tile Development

### /add-tile

**Scaffold a new tile with all boilerplate**

**Required Input:**
- Tile name (display name)
- Type: `Graphic` | `Button` | `Form` | `Logic` | `Dropzone` | `Calendar`
- Phase(s): `Morning` | `GS Site Standing` | `Evening`
- Categories: `Org` | `Health` | `Software` | `Content` | `Real Estate` | `Learn`
- Third-party dependencies (if any)

**Actions:**
1. Add tile definition to `lib/data/tiles.ts` in `LOCAL_TILES` array
2. Create component in appropriate subdirectory:
   - Graphics: `components/tiles/graphics/[TileName]Tile.tsx`
   - Logic: `components/tiles/logic/[TileName]Tile.tsx`
   - Forms: `components/tiles/forms/[TileName]Tile.tsx`
3. Add lazy import to `components/tiles/TileRegistry.tsx`
4. Create case mapping in `getTileComponent()` switch
5. If tile fetches data: create hook in `hooks/use[TileName]Data.ts` using React Query
6. If tile has API: create route in `app/api/[endpoint]/route.ts`

**Tile Definition Template:**
```typescript
{
  id: "local-[kebab-name]",
  name: "[Display Name]",
  menu: ["Health"],
  status: "Not started",
  desc: "Brief description",
  shadcn: ["Graphic"],
  phase: ["GS Site Standing"],
  thirdParty: [],
  actionWarning: false,
  actionDesc: null,
  priority: "2",
  typeII: "Metric",
}
```

**Component Template:**
```typescript
'use client';

import { TileComponentProps } from '../TileDispatcher';
import { GraphicTile } from './base/GraphicTile';
import { use[TileName]Data } from '@/hooks/use[TileName]Data';

export function [TileName]Tile({ tile }: TileComponentProps) {
  const { data, isLoading, error } = use[TileName]Data();

  return (
    <GraphicTile tile={tile} isLoading={isLoading} error={error}>
      <div className="flex flex-col items-center justify-center h-full gap-2">
        {/* Content here — keep under 112px height */}
      </div>
    </GraphicTile>
  );
}
```

**React Query Hook Template:**
```typescript
'use client';

import { useQuery } from '@tanstack/react-query';

export function use[TileName]Data() {
  return useQuery({
    queryKey: ['[kebab-name]'],
    queryFn: async () => {
      const response = await fetch('/api/[endpoint]');
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
```

**Constraints:**
- All tiles are 112px tall (`h-28`) — no variable heights
- Content overflow opens modal/subpage, not in-tile
- Component must be a named export matching `[TileName]Tile`

---

### /tile-debug [tile-name]

**Diagnose why a tile isn't rendering**

**Checks:**
1. Tile exists in `lib/data/tiles.ts` (`LOCAL_TILES`)
2. Tile is not in `EXCLUDED_TILE_NAMES` in `hooks/useTiles.ts`
3. Tile's phase array matches current phase
4. `components/tiles/TileRegistry.tsx` has name mapping
5. Component file exists at expected path
6. Component has correct named export
7. Lazy import exists in registry
8. Data hook doesn't throw errors

**Common Issues:**
- Name case mismatch (registry is case-sensitive)
- Missing lazy import in TileRegistry
- Phase filtering hiding tile
- Component throws in useEffect (shows fallback)

---

### /why-tile-missing [tile-name]

**Quick check: why isn't this tile showing?**

One-line diagnosis for common tile visibility issues. Returns reason + fix in 1-2 sentences.

---

### /convert-tile-to-popup [tile-name]

**Convert a tile to open a modal for more content space**

**Actions:**
1. Add modal state to component
2. Create modal in `components/tiles/modals/[TileName]Modal.tsx`
3. Update tile to show launcher + click handler
4. Modal uses `max-w-5xl h-[90vh]` sizing
5. Add close (X), Escape key, backdrop click handlers

**Modal Template:**
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
  <div className="relative w-full max-w-5xl h-[90vh] bg-background rounded-xl overflow-hidden flex flex-col">
    {/* Header with close button */}
    {/* Scrollable content area */}
  </div>
</div>
```

---

### /phase-tiles [morning|standing|evening]

**List all tiles for a specific phase**

Output: Table with Name | Type | Status | Priority | Integrations | Has Warning

---

### /tile-status-update [tile-name] [status]

**Update tile development status**

Status values: `Not started` | `In progress` | `Done`

Updates `lib/data/tiles.ts` and optionally regenerates docs with `npm run export-tiles`.

---

## Integration Skills

### /health-check

**Check status of all third-party integrations**

**Checks env vars and connectivity for:**
- Notion: `NOTION_API_KEY`, `NOTION_HABITS_DATABASE_ID`, `NOTION_TASKS_DATABASE_ID`
- GitHub: `GITHUB_TOKEN` or `GITHUB_PAT`
- Google: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- LIFX: `LIFX_TOKEN`
- Whoop: `WHOOP_CLIENT_ID`, `WHOOP_CLIENT_SECRET`
- InBody: `INBODY_API_KEY`

Output: Status table — Service | Configured | Connected | Notes

---

### /add-integration [service-name]

**Add a new third-party data source**

**Creates:**
1. Client at `lib/[service]/client.ts` with `is[Service]Configured()` export
2. API route(s) at `app/api/[service]/route.ts` with cache headers
3. React Query hook at `hooks/use[Service]Data.ts`
4. Updates `.env.example` with required variables

**Client Template:**
```typescript
const API_KEY = process.env.[SERVICE_NAME]_API_KEY;

export function is[ServiceName]Configured(): boolean {
  return !!API_KEY;
}

export async function fetch[ServiceName]Data() {
  if (!is[ServiceName]Configured()) {
    throw new Error('[ServiceName] not configured');
  }
  const response = await fetch('https://api.[service].com/...', {
    headers: { 'Authorization': `Bearer ${API_KEY}` },
    next: { revalidate: 300 },
  });
  if (!response.ok) throw new Error(`[ServiceName] API error: ${response.status}`);
  return response.json();
}
```

---

### /integration-status

**Matrix view of all integration states**

Categories:
- **Implemented** (working): List with env var status
- **Coming Soon** (UI ready): Setup steps needed
- **Not Configured**: Integration guide

---

## Data & Performance

### /export-tiles

**Regenerate tile documentation**

```bash
cd apps/gs-site && npm run export-tiles
```

Updates `gs-site-notion-sum.md` with tile matrix, stats, and status breakdown.

---

## Testing & QA

### /gs-test

**Run full test suite**
```bash
cd apps/gs-site && npm run typecheck && npm run lint && npm run test
```

### /gs-build

**Build in isolation — catch build-time errors**
```bash
cd apps/gs-site && npm run build
```

### /smoke-test

**Quick manual smoke test of critical paths**

Checklist:
1. Dev server on port 3003 — dashboard renders
2. Tiles load (may show loading states)
3. Click a working tile — modal opens
4. Filter buttons work (Org, Health, etc.)
5. Edit mode toggle works
6. Admin panel at `/admin` loads
7. No TypeScript errors in console

---

## Debugging

### /tile-data-flow [tile-name]

**Trace the complete data pipeline for a tile**

Traces: definition → component → hook → API endpoint → response

Reports findings with fix recommendations.

### /notion-debug

**Diagnose Notion integration issues**

1. Verify `NOTION_API_KEY` validity
2. Verify database IDs
3. Test API: `curl -s https://api.notion.com/v1/users/me -H "Authorization: Bearer [KEY]"`
4. Check database schema matches expectations
5. Check API usage limits

### /github-debug

**Diagnose GitHub integration issues**

1. Verify `GITHUB_TOKEN` validity
2. Check rate limits: `curl -s https://api.github.com/rate_limit`
3. Verify token scopes (`public_repo`, `read:user`)

---

## Deployment

### /deploy-gs-site

**Full production deployment workflow**

**Prerequisites:**
- All tests passing
- No TypeScript errors
- OAuth env vars match domain (`pickleballisapsyop.com`)

**Steps:**
1. Run smoke tests locally
2. Commit changes
3. Trigger Vercel deployment (auto on push to main)
4. Monitor Vercel Functions logs
5. Verify critical tiles load on production
6. Check Google OAuth works on domain

---

## Key File Paths

| Purpose | Path |
|---------|------|
| Tile definitions | `lib/data/tiles.ts` |
| Tile components | `components/tiles/` |
| Base tile types | `components/tiles/` (ButtonTile, GraphicTile, etc.) |
| Specialized tiles | `components/tiles/graphics/`, `logic/`, `forms/` |
| Tile registry | `components/tiles/TileRegistry.tsx` |
| Data hooks | `hooks/use[TileName]Data.ts` |
| API routes | `app/api/[service]/route.ts` |
| Integration clients | `lib/[service]/client.ts` |
| Type definitions | `lib/types/tiles.ts` |

## Tile Constraints

- **Height:** Fixed 112px (`h-28`) — all tiles same size
- **Width:** Grid-responsive (2-5 columns)
- **Content overflow:** Opens modal/subpage
- **Phase visibility:** Morning (blocking) | GS Site Standing (main) | Evening (check-in)

## Common Commands

```bash
npm run dev              # Start dev server (port 3003)
npm run build            # Production build
npm run typecheck        # Type safety check
npm run lint             # Code quality
npm run test             # Unit tests
npm run export-tiles     # Generate tile docs
```
