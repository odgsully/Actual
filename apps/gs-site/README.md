# GS Site - Personal Dashboard Hub

A dynamic personal productivity dashboard built with Next.js 14, featuring a tile-based interface with 53+ configurable tiles, third-party integrations, and Notion-synced data.

**Port:** 3003 (required for Google OAuth)
**Status:** Active Development
**Owner:** Garrett Sullivan

---

## Overview

GS Site is the central hub of the personal app suite, providing:
- **Tile-based dashboard** with drag-and-drop grid layout
- **Phase system** (Morning/Standing/Evening) for time-based tile visibility
- **Third-party integrations** (Notion, GitHub, Google, Whoop, LIFX, etc.)
- **Graceful degradation** - dashboard always renders even when APIs fail

---

## Quick Start

```bash
# From monorepo root
npm run dev:dashboard    # Starts on port 3003

# Or directly
cd apps/gs-site && npm run dev
```

**Important:** Always run on port 3003 - Google OAuth is configured for this port.

---

## Architecture

### Tile System (Decoupled from Notion - Jan 2026)

Tiles are fully local - Notion is used only for DATA (habits, tasks), not definitions.

```
lib/data/tiles.ts          # Source of truth - 53 tile definitions
    ↓
hooks/useTiles.ts          # Direct import, no API call
    ↓
components/TileGrid        # Renders tiles with react-grid-layout
    ↓
Per-tile data fetching     # Each tile fetches its own data (can fail independently)
```

### Graceful Degradation

| Scenario | Old Behavior | Current Behavior |
|----------|--------------|------------------|
| Notion API down | Page crashes | Page renders, data tiles show fallback |
| Single tile API fails | N/A | Only that tile shows error state |
| No env vars | Page crashes | Static tiles always display |

---

## Key Features

### Tile Types
- **ButtonTile** - Navigation/links
- **GraphicTile** - Charts, counters, progress bars
- **FormTile** - User input collection
- **CalendarTile** - Date/calendar displays
- **DropzoneTile** - File upload areas
- **LogicTile** - Complex backend computation

### Phase System
| Phase | Time | Purpose |
|-------|------|---------|
| Morning | AM | Blocking tiles (must complete) |
| GS Site Standing | All day | Main dashboard tiles |
| Evening | PM | End-of-day check-in |

### Third-Party Integrations
| Service | Status | Purpose |
|---------|--------|---------|
| **Notion** | Working | Habits data, Tasks data |
| **GitHub** | Working | Commit counts, repo listing |
| **Google Gmail** | Working | Sent email count tracking |
| **Google OAuth** | Working | Authentication |
| **LIFX** | Working | Smart light control |
| **Whoop** | OAuth Done | Health/fitness metrics |
| **MyFitnessPal** | Implemented | Nutrition tracking |
| **YouTube** | Implemented | Video data |
| **Twitter** | Implemented | Social metrics |

---

## Project Structure

```
apps/gs-site/
├── app/
│   ├── page.tsx                 # Main dashboard (tile grid)
│   ├── admin/                   # Admin panel
│   │   ├── connections/         # Integration connections
│   │   ├── health/              # System health
│   │   └── tiles/               # Tile management
│   ├── api/                     # API routes
│   │   ├── notion/              # Notion API (habits, tasks)
│   │   ├── github/              # GitHub integration
│   │   ├── auth/google/         # Google OAuth
│   │   └── lifx/                # LIFX smart lights
│   ├── codebase-learn/          # Learning platform
│   ├── jarvis/                  # Jarvis AI integration
│   ├── printoffs/               # Print templates (daily/weekly/monthly)
│   ├── private/gs-site/         # Private dashboard
│   └── crm/                     # Contact management
├── components/
│   ├── tiles/                   # Tile components
│   │   ├── ButtonTile.tsx
│   │   ├── GraphicTile.tsx
│   │   ├── TileErrorBoundary.tsx
│   │   └── WarningBorderTrail.tsx
│   ├── marketing/               # Marketing components
│   └── ui/                      # shadcn/ui components
├── hooks/
│   ├── useTiles.ts              # Tile data hook
│   ├── useTileFilter.ts         # Filter management
│   └── useDualFilter.ts         # Dual filter system
├── lib/
│   ├── data/tiles.ts            # Tile definitions (LOCAL_TILES)
│   ├── notion/                  # Notion clients
│   │   ├── habits.ts            # Habits database
│   │   └── tasks.ts             # Tasks database
│   ├── github/client.ts         # GitHub API
│   ├── integrations/google/     # Google Gmail
│   ├── lifx/client.ts           # LIFX API
│   ├── whoop/client.ts          # Whoop API
│   └── voice/                   # Voice/Retell integration
└── CLAUDE.md                    # Claude Code instructions
```

---

## Environment Variables

```bash
# Required
NOTION_API_KEY=secret_xxx
NOTION_HABITS_DATABASE_ID=xxx
NOTION_TASKS_DATABASE_ID=xxx

# Google OAuth (must match port 3003)
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx

# Optional integrations
GITHUB_TOKEN=xxx
LIFX_TOKEN=xxx
WHOOP_CLIENT_ID=xxx
WHOOP_CLIENT_SECRET=xxx
```

---

## Development Commands

```bash
npm run dev              # Start on port 3003
npm run build            # Production build
npm run typecheck        # TypeScript checking
npm run lint             # ESLint
npm run test             # Jest tests
```

---

## Tile Sizing Guidelines

**All tiles are uniform size** (112px height). Content that exceeds this opens in popups/subpages.

| Pattern | When to Use |
|---------|-------------|
| Modal/Popup | Forms, calculators, quick actions |
| Subpage | Complex data views, full dashboards |
| External Link | Third-party services |

---

## Implementation Status

### Complete
- Phase 0-4: Foundation, UI Components, Notion Data, GitHub, Graphics
- Gmail Integration (Dec 2025)
- LIFX Integration
- Goals popup, LLM Benchmarks popup, Directory Health scanner

### In Progress
- Phase 5: Wabbit Apps Integration (blocked - awaiting Wabbit app)
- Phase 6-8: Google/Apple, Whoop/Content, Device/Logic

### Key Documentation
- `CLAUDE.md` - Claude Code instructions
- `tile-logic-untile.md` - Implementation plan
- `gs-site-notion-sum.md` - Full specs and goals

---

## Routes

| Route | Description |
|-------|-------------|
| `/` | Main tile dashboard |
| `/admin` | Admin panel |
| `/admin/connections` | Integration status |
| `/admin/tiles` | Tile management |
| `/jarvis` | Jarvis AI interface |
| `/codebase-learn` | Learning platform |
| `/printoffs` | Print templates |
| `/crm` | Contact management |
| `/private/gs-site` | Private dashboard |

---

## Troubleshooting

### OAuth fails with `auth_failed`
1. Verify running on port 3003 (not 3000)
2. Check test user added in Google Cloud Console
3. Verify Gmail API enabled
4. Confirm redirect URI: `http://localhost:3003/api/auth/google/callback`

### Tiles not loading
- Tiles should always render (static definitions are local)
- Check browser console for per-tile API errors
- Verify `.env.local` has required Notion keys

### Notion data empty
- Check `NOTION_API_KEY` is valid
- Verify database IDs match your Notion workspace
- Notion failures don't block page - tiles show fallback states

---

## License

Proprietary - All rights reserved

---

**Last Updated:** January 2026
**Version:** 2.0.0 (Post-Notion Decoupling)
