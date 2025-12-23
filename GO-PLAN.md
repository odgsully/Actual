# GS Site 3rd Party Integrations & Admin Dashboard

## Overview

Connect all tiles in the Notion "Tiles GS Site" database to their 3rd party services, implement action warning tests, and create the GS Site Admin Dashboard.

| Metric | Count |
|--------|-------|
| Source of Truth | Notion DB `28fcf08f-4499-8017-b530-ff06c9f64f97` |
| Total Tiles | 47 |
| Tiles with Action Warnings | 19 |
| Tiles with SETTINGS | 9 |

**Last Updated:** December 23, 2025

> **NOTE:** Forms have transitioned from Google Forms to our custom Productivity Accountability Form system. Form streak and completion tracking now uses the internal `productivity_form_submissions` Supabase table.

---

## Phase 1: Foundation & Infrastructure

### 1.1 Connection Health Check System

- [x] `lib/integrations/types.ts` - Integration type definitions, service configs, error severity
- [x] `lib/integrations/health-checker.ts` - Core health check logic with caching
- [x] `lib/integrations/warning-tests.ts` - Warning test functions for 19 tiles
- [x] `lib/integrations/index.ts` - Barrel exports
- [x] `hooks/useConnectionHealth.ts` - React Query hook for tile health status

### 1.2 Environment Variables

- [x] Add cross-app URLs to `.env.sample`:
  - [x] `WABBIT_RE_URL`
  - [x] `GSREALTY_URL`
  - [x] `WABBIT_URL`
- [x] Add OAuth placeholders to `.env.sample`:
  - [x] `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
  - [x] `WHOOP_CLIENT_ID` / `WHOOP_CLIENT_SECRET`
  - [x] `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_PHONE_NUMBER`

### 1.3 Update Tile Types

- [x] Add `Twilio` to `ThirdPartyIntegration` type
- [x] Add `EXTRA LOGIC` to `ThirdPartyIntegration` type

---

## Phase 2: GS Site Admin Dashboard

### 2.1 Admin Routes

- [x] `app/admin/layout.tsx` - Admin layout with sidebar navigation
- [x] `app/admin/page.tsx` - Admin overview dashboard
- [x] `app/admin/connections/page.tsx` - 3rd party connection status
- [x] `app/admin/tiles/page.tsx` - Configurable tiles list
- [x] `app/admin/health/page.tsx` - System health monitoring
- [x] `app/admin/tiles/[tileId]/page.tsx` - Individual tile settings

### 2.2 Admin API & Storage

- [x] `app/api/admin/settings/route.ts` - Settings CRUD API
- [x] `lib/admin/tile-settings.ts` - Settings storage/retrieval logic (localStorage)
- [x] Create Supabase `tile_settings` table (`migrations/002_create_tile_settings.sql`)
- [x] Create Supabase `connection_health_cache` table (`migrations/003_create_connection_health_cache.sql`)

### 2.3 Configurable Tiles (9 total)

| Tile | Setting | UI Component | Status |
|------|---------|--------------|--------|
| 10. RealtyOne Events button | Modify Notion link | URL input | [x] |
| 13. Panel for Days Till… | Target date | Date picker | [x] |
| 5. Create Eating Challenges | Inventory list | Textarea | [x] |
| Codebase Duolingo | Difficulty 1-3 | Slider | [x] |
| Days since bloodwork done | Start date | Date picker | [x] |
| Morning Form | Video duration | Number input | [x] |
| Memento Morri | Color toggle | Color wheel | [x] |
| 2. Random Daily Contact | CRM tags toggle | Multi-select | [x] |
| Accountability Report | Circle emails, frequency | Email list + picker | [x] |

---

## Phase 3: Action Warning Test System

### 3.1 Warning Infrastructure

- [x] Create `WARNING_TESTS` record with test functions
- [x] Create `TILE_WARNING_MAP` mapping tiles to tests
- [x] Implement `shouldShowWarning()` function
- [x] Integrate `useConnectionHealth` into ButtonTile

### 3.2 Warning Tests (19 Tiles)

| # | Tile | Test Key | Status |
|---|------|----------|--------|
| 1 | EPSN3 Bin | `frequency-not-met` | [x] Implemented |
| 2 | 10. RealtyOne Events | `notion-disconnected` | [x] Implemented |
| 3 | 1. Whoop API Insights | `whoop-disconnected` | [x] Stub (coming soon) |
| 4 | Physically print WEEKLIES | `brother-disconnected` | [x] Stub (coming soon) |
| 5 | 6. Health tracker chart | `whoop-disconnected` | [x] Stub (coming soon) |
| 6 | GS socials Scheduler | `scheduler-disconnected` | [x] Stub (coming soon) |
| 7 | 11. Time Spent pie charts | `local-model-disconnected` | [x] Implemented |
| 8 | YouTube wrapper | `youtube-disconnected` | [x] Stub (coming soon) |
| 9 | 7. LLM Arena | `link-not-found` | [x] Implemented |
| 10 | 2. Random Daily Contact | `apple-disconnected` | [x] Stub (coming soon) |
| 11 | Physically print DAILY | `brother-disconnected` | [x] Stub (coming soon) |
| 12 | 3. Socials stats | `scheduler-disconnected` | [x] Stub (coming soon) |
| 13 | Clean iCloud | `icloud-disconnected` | [x] Stub (coming soon) |
| 14 | Cali Task List DONE | `notion-disconnected` | [x] Implemented |
| 15 | Notion Habits STREAKS | `notion-disconnected` | [x] Implemented |
| 16 | Task List Wabbed % | `notion-disconnected` | [x] Implemented |
| 17 | Cali Forward look | `notion-disconnected` | [x] Implemented |
| 18 | Emails sent | `google-disconnected` | [x] Stub (coming soon) |
| 19 | Habit Insights | `notion-disconnected` | [x] Implemented |

---

## Phase 4: Cross-App Integration (Wabbit Apps)

### 4.1 Wabbit Client Library

- [x] `lib/wabbit/client.ts` - API wrapper for Wabbit apps
- [x] `hooks/useWabbitStats.ts` - Fetch stats from Wabbit apps

### 4.2 Cross-App Health Checks

- [x] `wabbit-disconnected` warning test
- [x] `gsrealty-disconnected` warning test

### 4.3 Affected Tiles (6)

| Tile | Target | Status |
|------|--------|--------|
| Jump to Wab: Task List Value | `WABBIT_URL/tasks` | [x] WabbitLinkTile |
| GS-clients Admin Dash page | `GSREALTY_URL/admin` | [x] WabbitLinkTile |
| New GS Wab | `WABBIT_URL/new` | [x] WabbitLinkTile |
| Go to my Wabbit | `WABBIT_RE_URL` | [x] WabbitLinkTile |
| Cali Task List DONE | Fetch from Wabbit + Notion | [x] Existing CaliTaskListTile |
| Task List Wabbed % | Fetch % from Wabbit | [x] Existing TaskWabbedTile |

---

## Phase 5: OAuth & Custom Integrations

### 5.1 Custom Productivity Form (2 tiles) ✅ INFRASTRUCTURE COMPLETE

> **Forms have transitioned from Google Forms to our custom system.**
> Data stored in Supabase `productivity_form_submissions` table.

| Component | Status |
|-----------|--------|
| `app/new-form/page.tsx` | ✅ 2-page Productivity Accountability Form |
| `app/api/forms/productivity/route.ts` | ✅ POST/GET API for submissions |
| `app/api/forms/productivity/stats/route.ts` | ✅ Streak & weekly completion stats |
| `components/tiles/graphics/FormStreakTile.tsx` | ✅ Current form streak display |
| `components/tiles/graphics/FormsCompletedTile.tsx` | ✅ Forms completed this week |
| `hooks/useFormStats.ts` | ✅ React Query hook for form statistics |

**Form Fields Tracked:**
- Date, Time entries (multiple per day)
- Deep Work hours (12:45pm, 3:45pm, 6:45pm, EOD)
- What got done, How to improve
- Clean desk/desktop checkboxes
- PDF status tracking
- Notion Calendar Grade (C to A)
- Mood (C to A)
- Bi-weekly phase reflection

### 5.2 Gmail OAuth (1 tile) ✅ COMPLETE

- [x] `app/api/auth/google/route.ts` - OAuth flow (Gmail only)
- [x] `app/api/auth/google/callback/route.ts` - OAuth callback handler
- [x] `lib/integrations/google/gmail-client.ts` - Gmail API wrapper
- [x] `app/api/google/emails/sent/route.ts` - Fetch sent email count
- [x] `components/tiles/graphics/EmailsSentTile.tsx` - Emails sent today/week display
- [x] `hooks/useGmailStats.ts` - React Query hook for Gmail statistics
- [x] `migrations/004_create_user_integrations.sql` - OAuth token storage table

### 5.3 Apple OAuth (3 tiles)

- [ ] `app/api/auth/apple/route.ts` - OAuth flow
- [ ] `lib/integrations/apple/client.ts` - Apple/CloudKit wrapper
- [ ] Random Daily Contact tile
- [ ] Emails sent tile (Apple Mail)
- [ ] Clean iCloud tile

### 5.4 Whoop OAuth (2 tiles)

- [ ] `app/api/auth/whoop/route.ts` - OAuth flow
- [ ] `lib/integrations/whoop/client.ts` - Whoop API wrapper
- [ ] Whoop API Insights Dash tile
- [ ] Create Health tracker chart tile

---

## Phase 6: Scheduler & Content Integrations

### 6.1 Social Media Scheduler (3 tiles)

- [ ] Choose scheduler solution (Buffer/Later/Custom)
- [ ] `lib/integrations/scheduler/client.ts`
- [ ] GS socials Scheduler tile
- [ ] Socials stats tile
- [ ] Accountability Report tile

### 6.2 YouTube Integration (1 tile)

- [ ] `lib/integrations/youtube/client.ts`
- [ ] YouTube wrapper/Timeline tile

---

## Phase 7: Hardware & Local Integrations

### 7.1 Brother Printer (2 tiles)

- [ ] `lib/integrations/printer/client.ts`
- [ ] Physically print WEEKLIES tile
- [ ] Physically print tomorrow DAILY tile

### 7.2 Local LLM (1 tile)

- [ ] `lib/integrations/local-llm/client.ts`
- [ ] Prev day/week Time Spent pie charts tile

---

## Phase 8: Logic-Only Tiles

| Tile | Status |
|------|--------|
| 13. Days Till Counter | [x] `DaysTillCounterTile` exists |
| Memento Morri | [x] `MementoMorriTile` exists |
| EPSN3 Bin | [x] `EPSN3BinTile` exists |
| Recurring Dots | [x] `RecurringDotsTile` exists |
| RealtyOne KPIs calculator | [x] `RealtyOneKPIsTile` - Interactive KPI calculator |
| Y-Combinator invites | [x] `YCombinatorInvitesTile` - Counter with goal tracking |
| Days since bloodwork | [x] `DaysSinceBloodworkTile` - Uses admin settings |
| Claude Code MAX usage | [ ] API call to Anthropic |
| Codebase Duolingo | [ ] Game logic engine |

---

## Phase 9: External Service Links

| Tile | URL | Status |
|------|-----|--------|
| 7. LLM Arena | https://lmarena.ai/leaderboard | [x] ButtonTile |
| Link to Datadog Dash | Datadog URL (from settings) | [ ] |
| odgsully Github repos | https://github.com/odgsully | [x] ButtonTile |
| Jarvis_briefme report | Internal PDF link | [ ] |

---

## Notion Tile Components

### Completed

- [x] `HabitsStreakTile` - Habit streaks with mini heatmap
- [x] `TaskWabbedTile` - Wabbed percentage display
- [x] `HabitInsightsTile` - Weight tracking, completion rates, streak
- [x] `CaliTaskListTile` - High-priority tasks with progress ring
- [x] `CaliForwardLookTile` - Overdue + upcoming tasks

### Pending

- [ ] `CaliTaskRankingTile` - Full ranking display (if different from CaliTaskListTile)

---

## GitHub Tile Components

### Completed

- [x] `GitHubSearchTile` - Search repos
- [x] `GitHubCommitsTile` - Annual commits count
- [x] `GitHubReposTile` - User repos list

### Pending

- [ ] `CodebaseDuolingoTile` - GitHub gamification
- [ ] `SelectGithubRepoTile` - Repo dropdown + New Issue link

---

## Coming Soon Stub Component

- [x] Create `ComingSoonTile.tsx` for unimplemented integrations
- [x] Create `WabbitLinkTile.tsx` for cross-app navigation with health status

### Tiles to Stub (10)

| Tile | Service | Status |
|------|---------|--------|
| 1. Whoop API Insights Dash | Whoop | [x] ComingSoonTile |
| 6. Create Health tracker chart | Whoop | [x] ComingSoonTile |
| 2. Random Daily Contact | Apple | [x] ComingSoonTile |
| Physically print WEEKLIES | Brother Printer | [x] ComingSoonTile |
| Physically print DAILY | Brother Printer | [x] ComingSoonTile |
| YouTube wrapper/Timeline | YouTube 3rd P | [x] ComingSoonTile |
| GS socials Scheduler | Scheduler 3rd P | [x] ComingSoonTile |
| 3. Socials stats | Scheduler 3rd P | [x] ComingSoonTile |
| Accountability Report | Scheduler/Twilio | [x] ComingSoonTile |
| Emails sent | Apple/Google | [x] ComingSoonTile |

---

## Sprint Progress

### Sprint 1: Foundation & Notion Tiles ✅ COMPLETE

- [x] Phase 1.1 - Health check system
- [x] Phase 1.2 - Environment variables
- [x] Phase 1.3 - Update types
- [x] HabitInsightsTile + API route
- [x] CaliTaskListTile component
- [x] CaliForwardLookTile component
- [x] Update TileRegistry with new tiles

### Sprint 2: Admin Dashboard & Warning Integration ✅ COMPLETE

- [x] Phase 2.1 - Admin routes (layout, overview, connections, tiles, health)
- [x] Phase 2.2 - Admin API & storage (settings API, tile-settings lib)
- [x] Phase 2.3 - Tile settings UI (individual tile pages)
- [x] Integrate `useConnectionHealth` into ButtonTile
- [x] Create Supabase tables for persistent storage

### Sprint 3: Cross-App & Stubs ✅ COMPLETE

- [x] Phase 4.1-4.2 - Wabbit client library (`lib/wabbit/client.ts`, `hooks/useWabbitStats.ts`)
- [x] Create `ComingSoonTile` component
- [x] Create `WabbitLinkTile` component for cross-app navigation
- [x] Stub tiles for: Whoop, Apple, Brother Printer, YouTube, Scheduler
- [x] Update TileRegistry with cross-app and coming soon tile mappings

### Sprint 4: Logic-Only Tiles ✅ COMPLETE

- [x] `DaysSinceBloodworkTile` - Days elapsed counter with warning thresholds
- [x] `RealtyOneKPIsTile` - Interactive real estate KPI calculator
- [x] `YCombinatorInvitesTile` - Counter with goal tracking for YC invites
- [x] Update TileRegistry with new logic tile mappings

### Sprint 5: Forms & Gmail Integration ✅ COMPLETE

**Phase 5.1 - Custom Form Stats**
- [x] `app/api/forms/productivity/stats/route.ts` - Streak & weekly stats API
- [x] `components/tiles/graphics/FormStreakTile.tsx` - Form streak display
- [x] `components/tiles/graphics/FormsCompletedTile.tsx` - Weekly completion display
- [x] `hooks/useFormStats.ts` - React Query hook

**Phase 5.2 - Gmail OAuth**
- [x] `app/api/auth/google/route.ts` - Google OAuth flow
- [x] `app/api/auth/google/callback/route.ts` - OAuth callback handler
- [x] `lib/integrations/google/gmail-client.ts` - Gmail API wrapper
- [x] `app/api/google/emails/sent/route.ts` - Sent emails API
- [x] `hooks/useGmailStats.ts` - React Query hook
- [x] `components/tiles/graphics/EmailsSentTile.tsx` - Emails sent tile
- [x] `migrations/004_create_user_integrations.sql` - OAuth token storage
- [x] Updated `warning-tests.ts` with `form-streak-broken` and `gmail-disconnected` tests

### Sprint 6+: Future (Lower Priority)

- [ ] Whoop OAuth
- [ ] Apple OAuth (evaluate feasibility)
- [ ] Brother Printer integration
- [ ] YouTube transcript analysis
- [ ] Social media scheduler

---

## Database Schema

### `tile_settings` Table

```sql
CREATE TABLE tile_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tile_id TEXT NOT NULL UNIQUE,
  tile_name TEXT NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tile_settings_tile_id ON tile_settings(tile_id);
```

### `productivity_form_submissions` Table (Custom Forms)

```sql
CREATE TABLE productivity_form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date DATE NOT NULL,
  entry_time TEXT[] NOT NULL,
  entry_time_other TEXT,
  deep_work_noon TEXT,
  deep_work_245pm TEXT,
  deep_work_545pm TEXT,
  deep_work_eod TEXT,
  what_got_done TEXT,
  improve_how TEXT,
  clean_desk BOOLEAN DEFAULT FALSE,
  clean_desktop BOOLEAN DEFAULT FALSE,
  pdf_status TEXT,
  pdfs_added TEXT,
  notion_calendar_grade TEXT NOT NULL,
  mood TEXT NOT NULL,
  biweekly_phase_reflection TEXT,
  biweekly_cycle_number INTEGER,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_form_submissions_entry_date ON productivity_form_submissions(entry_date DESC);
CREATE INDEX idx_form_submissions_submitted_at ON productivity_form_submissions(submitted_at DESC);
```

### `connection_health_cache` Table

```sql
CREATE TABLE connection_health_cache (
  service TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('connected', 'disconnected', 'checking')),
  last_checked TIMESTAMPTZ DEFAULT NOW(),
  error_message TEXT,
  metadata JSONB DEFAULT '{}'
);
```

---

## Files Created (Sprint 1)

| File | Purpose |
|------|---------|
| `lib/integrations/types.ts` | Connection types, service configs |
| `lib/integrations/health-checker.ts` | Health check functions with caching |
| `lib/integrations/warning-tests.ts` | 19 warning test functions |
| `lib/integrations/index.ts` | Barrel exports |
| `hooks/useConnectionHealth.ts` | React Query health hook |
| `app/api/notion/habits/insights/route.ts` | Habits insights API |
| `components/tiles/graphics/HabitInsightsTile.tsx` | Weight/streak/completion tile |
| `components/tiles/graphics/CaliTaskListTile.tsx` | High-priority tasks tile |
| `components/tiles/graphics/CaliForwardLookTile.tsx` | Upcoming/overdue tasks tile |

## Files Modified (Sprint 1)

| File | Changes |
|------|---------|
| `.env.sample` | Added cross-app URLs + OAuth placeholders |
| `lib/types/tiles.ts` | Added Twilio, EXTRA LOGIC types |
| `components/tiles/graphics/index.ts` | Exported new tiles |
| `components/tiles/TileRegistry.tsx` | Added dynamic imports + specialized mappings |

## Files Created (Sprint 2)

| File | Purpose |
|------|---------|
| `app/admin/layout.tsx` | Admin sidebar layout with nav |
| `app/admin/page.tsx` | Admin overview dashboard |
| `app/admin/connections/page.tsx` | 3rd party connection status |
| `app/admin/tiles/page.tsx` | Configurable tiles list |
| `app/admin/health/page.tsx` | System health monitoring |
| `app/admin/tiles/[tileId]/page.tsx` | Individual tile settings UI (all 9 configurable tiles) |
| `app/api/admin/settings/route.ts` | Settings CRUD API |
| `lib/admin/tile-settings.ts` | Settings storage + useTileSettings hook |
| `migrations/002_create_tile_settings.sql` | Supabase tile_settings table + RLS + helper functions |
| `migrations/003_create_connection_health_cache.sql` | Supabase connection_health_cache table + RLS + helper functions |

## Files Modified (Sprint 2)

| File | Changes |
|------|---------|
| `components/tiles/ButtonTile.tsx` | Integrated useConnectionHealth for real-time warnings |

## Files Created (Sprint 3)

| File | Purpose |
|------|---------|
| `lib/wabbit/client.ts` | Cross-app API wrapper for wabbit-re, gsrealty, wabbit apps |
| `hooks/useWabbitStats.ts` | React Query hooks for Wabbit app health & stats |
| `components/tiles/ComingSoonTile.tsx` | Placeholder tile for unimplemented 3rd party services |
| `components/tiles/WabbitLinkTile.tsx` | Cross-app navigation tile with real-time health status |

## Files Modified (Sprint 3)

| File | Changes |
|------|---------|
| `components/tiles/TileRegistry.tsx` | Added ComingSoonTile and WabbitLinkTile mappings |
| `components/tiles/index.ts` | Exported new tile components |

## Files Created (Sprint 4)

| File | Purpose |
|------|---------|
| `components/tiles/logic/DaysSinceBloodworkTile.tsx` | Days elapsed counter with color-coded warnings |
| `components/tiles/logic/RealtyOneKPIsTile.tsx` | Interactive KPI calculator for real estate agents |
| `components/tiles/logic/YCombinatorInvitesTile.tsx` | YC invite counter with goal progress |

## Files Modified (Sprint 4)

| File | Changes |
|------|---------|
| `components/tiles/logic/index.ts` | Exported new logic tile components |
| `components/tiles/TileRegistry.tsx` | Added new logic tile mappings |

## Files Created (Sprint 5)

| File | Purpose |
|------|---------|
| `app/api/forms/productivity/stats/route.ts` | Form streak & weekly completion stats API |
| `hooks/useFormStats.ts` | React Query hook for form statistics |
| `components/tiles/graphics/FormStreakTile.tsx` | Form streak display with warning |
| `components/tiles/graphics/FormsCompletedTile.tsx` | Weekly completion progress ring |
| `app/api/auth/google/route.ts` | Google OAuth initiation |
| `app/api/auth/google/callback/route.ts` | Google OAuth callback handler |
| `lib/integrations/google/gmail-client.ts` | Gmail API wrapper with token management |
| `app/api/google/emails/sent/route.ts` | Sent emails count API |
| `hooks/useGmailStats.ts` | React Query hook for Gmail statistics |
| `components/tiles/graphics/EmailsSentTile.tsx` | Gmail sent emails display |
| `migrations/004_create_user_integrations.sql` | OAuth token storage table |

## Files Modified (Sprint 5)

| File | Changes |
|------|---------|
| `GO-PLAN.md` | Updated Forms transition notes, Phase 5 structure |
| `lib/integrations/warning-tests.ts` | Added `form-streak-broken` and `gmail-disconnected` tests |
| `components/tiles/graphics/index.ts` | Exported new Form and Gmail tiles |
| `components/tiles/TileRegistry.tsx` | Added Form and Gmail tile mappings |

---

## Quick Reference

### Service Health Status Types

```typescript
type ConnectionStatus =
  | 'connected'      // Service is reachable
  | 'disconnected'   // Service unreachable
  | 'checking'       // Currently checking
  | 'coming_soon'    // Not yet implemented
  | 'not_configured' // Missing credentials/config
```

### Implemented Services

- **Notion** - Full health check + API
- **GitHub** - Full health check + API
- **Logic/EXTRA LOGIC** - Always connected (frontend-only)
- **Wabbit Apps** - Cross-app integration (wabbit-re, gsrealty, wabbit)
- **Custom Forms** - Productivity Accountability Form with streak tracking
- **Gmail** - OAuth + sent emails tracking (requires GOOGLE_CLIENT_ID/SECRET)

### Coming Soon Services

- Whoop, Apple, Brother Printer, YouTube 3rd P, Scheduler 3rd P, Datadog

### Requires Configuration

- **Gmail** - Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`
- **Twilio** - Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
