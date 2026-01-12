# GS Site - Claude Code Instructions

## Source of Truth

**Tile Definitions**: All tile definitions are now stored locally in `lib/data/tiles.ts`.
Notion is used **only for DATA** (habits values, task completion), NOT for tile definitions.

**Documentation**: The file `gs-site-notion-sum.md` contains implementation specs and goals.

## Architecture (Updated Jan 2026)

Tiles are fully decoupled from Notion:
- **Tile definitions**: `lib/data/tiles.ts` (LOCAL_TILES array)
- **Habits data**: Notion API via `lib/notion/habits.ts`
- **Tasks data**: Notion API via `lib/notion/tasks.ts`

The old tile sync infrastructure has been deprecated (see `scripts/archive/`).

## Key Files

| File | Purpose |
|------|---------|
| `lib/data/tiles.ts` | **Source of truth** - All tile definitions (LOCAL_TILES) |
| `lib/notion/habits.ts` | Notion Habits database client (DATA only) |
| `lib/notion/tasks.ts` | Notion Task List database client (DATA only) |
| `gs-site-notion-sum.md` | Implementation specs and goals documentation |
| `tile-logic-untile.md` | Implementation plan and phase breakdown |

## Notion Integration Status

**Note**: Notion is used for DATA only (habits, tasks), NOT for tile definitions.

### Working
- Habits API routes (`/api/notion/habits/*`)
- Tasks API routes (`/api/notion/tasks/*`)
- React Query hooks for data fetching

### Deprecated (Jan 2026)
- Tile sync script (archived to `scripts/archive/`)
- Tiles API route (`/api/tiles`) - removed
- `tiles-client.ts` (archived to `lib/notion/archive/`)

### Needs Configuration
```bash
# Required in .env.local
NOTION_API_KEY=secret_xxx
NOTION_HABITS_DATABASE_ID=xxx
NOTION_TASKS_DATABASE_ID=xxx
```

### Database IDs
- **Habits Database**: Referenced in `lib/notion/habits.ts`
- **Tasks Database**: Referenced in `lib/notion/tasks.ts`

## Development Commands

```bash
npm run dev              # Start gs-site on port 3003 (MUST be 3003)
npm run build            # Production build
npm run typecheck        # TypeScript type checking
npm run test             # Run Jest tests
```

## Google OAuth Configuration

**CRITICAL**: Google OAuth is configured for `localhost:3003`. Always run gs-site on port 3003.

- **OAuth Redirect URI**: `http://localhost:3003/api/auth/google/callback`
- **Required env vars**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- **Test user**: Must be added in Google Cloud Console → OAuth consent screen
- **Gmail API**: Must be enabled in Google Cloud Console

If OAuth fails with `auth_failed`, check:
1. Server is running on port 3003 (not 3000 or other)
2. Test user email is added in Google Cloud Console
3. Gmail API is enabled
4. Redirect URI matches exactly in Google Cloud Console

## Architecture Notes

### Tile Types
- **Button**: Simple navigation/links
- **Graphic**: Data visualization (charts, counters)
- **Form**: User input collection
- **Logic**: Complex backend computation
- **Dropzone**: File upload areas

### Phase System
- **Morning**: Blocking tiles (must complete to access dashboard)
- **GS Site Standing**: Main dashboard tiles
- **Evening**: End-of-day check-in tiles

### Third-Party Integrations
See `gs-site-notion-sum.md` for full integration matrix. Key ones:
- **Notion**: Habits, Tasks, Calendar data
- **Wabbit**: Cross-app task ranking
- **GitHub**: Commit counts, repo listing
- **Whoop**: Health/fitness data (not yet implemented)
- **Google Gmail**: ✅ Sent email count tracking (implemented Dec 2025)
- **Google Forms**: Forms data (not yet implemented)

## Tile Sizing & Aesthetic Guidelines (Dec 2025)

### Uniform Tile Sizing
**ALL tiles must be uniform size.** Do NOT create variable-height tiles.

- **Grid**: react-grid-layout with uniform `h:1` for all tiles
- **Row Height**: 112px (configured in `app/page.tsx`)
- **Tile Height**: `h-28` (112px) - matches row height exactly
- **No variable heights**: Removed h:2 system due to "error perimeter" issues

### Tiles as Launchers (NOT Containers)
Tiles should be **compact launchers** that open detail views on click:

| Pattern | Use Case | Implementation |
|---------|----------|----------------|
| **Modal/Popup** | Forms, calculators, settings | Click tile → modal overlay |
| **Subpage** | Complex data views, dashboards | Click tile → `/tile-name` route |
| **External Link** | Third-party services | Click tile → new tab |

**DO NOT** try to fit complex content inside the tile itself. If content doesn't fit in 112px height, it should open a popup/subpage.

### Navigation Patterns
```
Tile Click → Modal (preferred for forms/quick actions)
Tile Click → Subpage (for complex data that needs full screen)
Tile Click → External URL (for third-party links)
```

### Modal/Popup Sizing Guidelines
Modals should fill majority of the viewport, not be cramped:
- **Width**: `max-w-5xl` (fills most of screen)
- **Height**: `h-[90vh]` (90% of viewport)
- **Padding**: `p-6 lg:p-8` (generous spacing)
- **Close options**: X button in header + Escape key + backdrop click
- **Layout**: Use `max-w-3xl mx-auto` or `max-w-4xl mx-auto` for content sections
- **Typography**: Larger text in modals (text-xl headers, text-lg inputs)

Example modal structure:
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
  <div className="relative w-full max-w-5xl h-[90vh] bg-background rounded-xl overflow-hidden flex flex-col">
    {/* Header with close button */}
    {/* Tab navigation (if needed) */}
    {/* Scrollable content area */}
  </div>
</div>
```

### Content-Heavy Tiles (Convert to Popup Pattern)
These tiles have content that exceeds 112px and should open popups/subpages:
- RE KPI's & Calc → Popup calculator
- Task List → Popup with full task view
- Habits (heatmap) → Popup with detailed view
- Calendar tiles → Popup with full calendar
- Forms Wk Goal → Popup with detailed metrics

### Tile Visual Rules
- Fixed height: `h-28` (112px)
- Consistent padding: `p-4`
- Status indicator: top-right dot (blue=in progress, green=done)
- Truncate long text with `line-clamp-2` or `truncate`
- Show "preview" data only - full data in popup

## When Implementing Tiles

1. Check `gs-site-notion-sum.md` for the tile's full spec
2. Note the Priority (1 = Critical, 3 = Nice to have)
3. Check Third Party dependencies
4. **If content exceeds 112px height → implement as popup/subpage launcher**
5. Update the tile's status in gs-site-notion-sum.md when done
6. Add implementation notes if the logic differs from original spec
