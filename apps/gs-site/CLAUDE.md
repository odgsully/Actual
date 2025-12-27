# GS Site - Claude Code Instructions

## Source of Truth

**CRITICAL**: The file `gs-site-notion-sum.md` is the PRIMARY source of truth for:
- Tile definitions and logic
- Implementation goals and requirements
- Third-party integration specs
- Priority and phase assignments

**Notion is SECONDARY**. When implementing features:
1. Read `gs-site-notion-sum.md` first
2. Only query Notion API if you need real-time data (habits, tasks)
3. When logic conflicts exist, this local file takes precedence

## Keeping Documentation Current

The `gs-site-notion-sum.md` file MUST be kept up to date:

| When | Action |
|------|--------|
| **Tile logic changes** | Update the tile's description in gs-site-notion-sum.md |
| **New tile implemented** | Add implementation notes to the tile entry |
| **Status changes** | Update status in gs-site-notion-sum.md (NOT just Notion) |
| **Weekly sync** | Consider running full Notion sync to catch any additions |

### Sync Commands
```bash
# Quick tile sync (definitions only)
npm run sync-tiles

# Full resync via Claude Code
# Ask Claude to "sync tiles from Notion to gs-site-notion-sum.md"
```

## Key Files

| File | Purpose |
|------|---------|
| `gs-site-notion-sum.md` | **Source of truth** - All tile logic and goals |
| `lib/data/tiles.ts` | Runtime tile definitions (synced from Notion) |
| `lib/notion/habits.ts` | Notion Habits database client |
| `lib/notion/tasks.ts` | Notion Task List database client |
| `tile-logic-untile.md` | Implementation plan and phase breakdown |

## Notion Integration Status

### Working
- Tile sync script (`npm run sync-tiles`)
- API route structure for habits and tasks
- React Query hooks for data fetching

### Needs Configuration
```bash
# Required in .env.local
NOTION_API_KEY=secret_xxx
NOTION_HABITS_DATABASE_ID=xxx
NOTION_TASKS_DATABASE_ID=xxx
```

### Database IDs
- **Tiles Database**: `28fcf08f-4499-8017-b530-ff06c9f64f97`
- **GS Site Page**: `26fcf08f-4499-80e7-9514-da5905461e73`

## Development Commands

```bash
npm run dev              # Start gs-site on port 3003 (MUST be 3003)
npm run dev:dashboard    # Alias for dev on port 3003
npm run sync-tiles       # Sync tile definitions from Notion
npm run build            # Production build
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

## When Implementing Tiles

1. Check `gs-site-notion-sum.md` for the tile's full spec
2. Note the Priority (1 = Critical, 3 = Nice to have)
3. Check Third Party dependencies
4. Update the tile's status in gs-site-notion-sum.md when done
5. Add implementation notes if the logic differs from original spec
