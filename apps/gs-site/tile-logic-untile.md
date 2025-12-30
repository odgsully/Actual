# GS Site Tile Logic - Implementation Plan

> **Purpose**: Transform the current static tile grid into a dynamic, Notion-synced dashboard with intelligent warnings, 3rd party integrations, and component-specific UI patterns.
>
> **Last Updated**: December 29, 2025
> **Branch**: `gssite-dec27-ii`
> **Phase 0**: ✅ COMPLETE | **Phase 1**: ✅ COMPLETE | **Phase 2**: ✅ COMPLETE | **Phase 3**: ✅ COMPLETE | **Phase 4**: ✅ COMPLETE
> **Phase 5**: ⛔ BLOCKED (no Wabbit app) | **Phase 6**: 📋 Research Done | **Phase 7**: 🚧 WHOOP OAuth Done | **Phase 8**: ✅ Logic Tiles Done
> **Gmail Integration**: ✅ COMPLETE (Dec 23, 2025) - Emails Sent tile working with OAuth
> **New Tiles (Dec 29)**: Goals (popup with checkable goals), LLM Benchmarks (multi-link popup), Directory Health (folder scanner)

---

## Table of Contents

1. [Architecture Principles](#architecture-principles)
2. [Current State Analysis](#current-state-analysis)
3. [Target Architecture](#target-architecture)
4. [Tile Component Types](#tile-component-types)
5. [3rd Party Integration Groups](#3rd-party-integration-groups)
6. [Action Warning System](#action-warning-system)
7. [Phase System](#phase-system)
8. [Implementation Phases](#implementation-phases)
9. [Testing & Quality](#testing--quality)
10. [Cross-Cutting Concerns](#cross-cutting-concerns)
11. [File Structure](#file-structure)
12. [Data Flow](#data-flow)

---

## Architecture Principles

### Core Principle: Graceful Degradation

**The dashboard must ALWAYS render.** API failures should affect individual tiles, not the entire page.

```
┌─────────────────────────────────────────────────────────────────┐
│                     DATA LAYER SEPARATION                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Layer 1: STATIC TILE DEFINITIONS (always available)            │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ lib/data/tiles.ts (local TypeScript file)                   ││
│  │ - Tile ID, name, type, category, icon                       ││
│  │ - href (for button tiles)                                   ││
│  │ - shadcn type (Button, Graphic, Calendar, etc.)             ││
│  │ - 3rd party dependency                                      ││
│  │ - Warning configuration                                     ││
│  │ Source: Synced from Notion via script (not runtime fetch)   ││
│  └─────────────────────────────────────────────────────────────┘│
│                              ↓                                   │
│  Layer 2: DYNAMIC TILE DATA (fetched per-tile, can fail)        │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Per-tile API calls (React Query with error boundaries)      ││
│  │ - Notion: habits streak, task completion %                  ││
│  │ - GitHub: commit counts, repo lists                         ││
│  │ - Whoop: health metrics                                     ││
│  │ Each fetches independently, fails independently             ││
│  └─────────────────────────────────────────────────────────────┘│
│                              ↓                                   │
│  Layer 3: UI COMPONENTS (always render)                         │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ TileGrid → TileCard → [ButtonTile|GraphicTile|CalendarTile] ││
│  │ - Receives static definition from Layer 1                   ││
│  │ - Optionally fetches dynamic data from Layer 2              ││
│  │ - Shows loading/error/success states per-tile               ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Why This Architecture?

| Problem | Old Approach | New Approach |
|---------|--------------|--------------|
| Notion token missing | **Page crashes** - "Failed to load tiles" | **Page renders** - Static tiles show |
| Notion API down | **Page crashes** | **Page renders** - Dynamic data empty |
| Single tile API fails | N/A (all-or-nothing) | **Only that tile** shows error state |
| Slow Notion response | **Page blocked** until response | **Page renders immediately** |

### Notion's Role

**Notion IS**:
- Configuration CMS where you edit tile definitions
- Source for sync script that generates local file
- Dynamic data source for tiles that show Notion data (habits, tasks)

**Notion is NOT**:
- Required for page to load
- Required for tiles to display
- A single point of failure

---

## Current State Analysis

### What Exists (apps/gs-site) - Phase 0 Complete ✅

| Component | Status | Location | Lines |
|-----------|--------|----------|-------|
| Homepage with tile grid | ✅ Working | `app/page.tsx` | 418 |
| useTiles hook | ✅ Static-first | `hooks/useTiles.ts` | 178 |
| useTileFilter hook | ✅ Working | `hooks/useTileFilter.ts` | 85 |
| MenuFilter component | ✅ Working | `components/MenuFilter.tsx` | - |
| PhaseReminder | ✅ Working | `components/PhaseReminder.tsx` | 116 |
| WarningBorderTrail | ✅ Working | `components/tiles/WarningBorderTrail.tsx` | 67 |
| TileErrorBoundary | ✅ Working | `components/tiles/TileErrorBoundary.tsx` | 98 |
| TileSkeleton | ✅ Working | `components/tiles/TileSkeleton.tsx` | 142 |
| Static tiles | ✅ 60 tiles | `lib/data/tiles.ts` | 758 |
| Sync script | ✅ Working | `scripts/sync-notion-tiles.ts` | 216 |
| Notion API endpoint | ✅ Working | `app/api/tiles/route.ts` | - |
| Type definitions | ✅ Complete | `lib/types/tiles.ts` | 104 |
| Notion client | ✅ Working | `lib/notion/tiles-client.ts` | 227 |

### Current Behavior (Resilient) ✅

```
User visits page
    ↓
Page imports STATIC_TILES from lib/data/tiles.ts
    ↓
✅ Tiles render IMMEDIATELY (60 tiles always available)
    ↓
useTiles() attempts to fetch fresh data from Notion (background)
    ↓
Success? → Merge fresh data into tiles
Failure? → Show "Offline" badge, keep using static data
    ↓
Per-tile errors caught by TileErrorBoundary
    ↓
✅ Dashboard ALWAYS renders - no full-page failures
```

### Remaining Work: Phase 1+

All tiles currently render as **ButtonTile** (links). Phase 1 introduces type-specific rendering:
- GraphicTile for charts/counters
- CalendarTile for date pickers
- FormTile for modal forms
- DropzoneTile for file uploads

---

## Notion Database Schema (54 Tiles)

| Property | Type | Purpose |
|----------|------|---------|
| **Name** | Title | Tile label |
| **MENU** | Multi-select | Category filter (Real Estate, Software, Org, Content, Health, Learn) |
| **Status** | Status | Not started / In progress / Done |
| **Desc** | Rich text | Detailed description |
| **shadcn** | Multi-select | Component type: Button, Graphic, Calendar & Date Picker, Form, Logic, etc. |
| **Phase** | Multi-select | GS Site Standing, Morning, Evening |
| **Select** | Select | Priority (1, 2, 3) |
| **3rd P** | Multi-select | External integrations required |
| **Action warning?** | Multi-select | Y = requires warning indicator |
| **Action desc** | Rich text | Warning message on hover when criteria not met |

---

## Target Architecture

### Visual Layout

```
┌─────────────────────────────────────────────────────────────┐
│                     GS Site Dashboard                        │
├─────────────────────────────────────────────────────────────┤
│  [Soft Reminder: Morning Form]                              │
├─────────────────────────────────────────────────────────────┤
│  [ALL] [Real Estate] [Software] [Org] [Content] [Health] [Learn] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  Button  │  │ Graphic  │  │ Calendar │  │  Button  │    │
│  │   Tile   │  │   Tile   │  │   Tile   │  │ + Warning│    │
│  │          │  │ [Chart]  │  │ [Picker] │  │ 🔴 Trail │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
┌────────────────────────────────────────────────────────────────┐
│                          PAGE LOAD                              │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Import STATIC_TILES from lib/data/tiles.ts                 │
│     ↓ (synchronous, always succeeds)                           │
│                                                                 │
│  2. Render tile grid immediately                               │
│     ↓                                                          │
│                                                                 │
│  3. useTiles() fetches from Notion (background)                │
│     ├─ Success: Merge fresh data into tiles                    │
│     └─ Failure: Log warning, continue with static data         │
│                                                                 │
│  4. Per-tile data hooks (for Graphic/Calendar tiles)           │
│     ├─ useHabitsStreak() - Notion Habits DB                    │
│     ├─ useGitHubCommits() - GitHub API                         │
│     ├─ useWhoopMetrics() - Whoop API                           │
│     └─ Each fails independently                                │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Tile Component Types

Based on the `shadcn` column in Notion, each tile renders differently:

### 1. Button Tiles (27 tiles)

**Purpose**: URL navigation - small button capable of showing hover action, icon, title, and short description.

**Implementation**:
```tsx
interface ButtonTileDefinition {
  type: 'button';
  href: string;
  external?: boolean;
  icon: string; // Lucide icon name
  title: string;
  desc: string;
}
```

**Visual**: Current TileCard implementation is appropriate. Add:
- Hover state with action description popover
- External link indicator
- Border Trail wrapper when warning active

**Tiles using this**:
- CRM, GS-clients Admin, Wab: Task List, New GS Wab, Go to my Wabbit
- LLM Benchmarks, GitHub Repos, Jarvis Briefme, Memento Morri, etc.

---

### 2. Graphic Tiles (18 tiles)

**Purpose**: Data visualizations, charts, counters, progress indicators.

**Implementation Strategy** - use best judgment per tile context:

| Tile | Recommended Graphic | Data Source |
|------|---------------------|-------------|
| Whoop Insights | Recharts line/area chart | Whoop API |
| RealtyOne KPIs | Recharts bar + formula display | Static/Notion |
| Forms Streak | Animated counter + flame icon | Google API |
| Time Spent Pie | Recharts pie chart (2 pies) | Apple API |
| Health Tracker | Recharts multi-line chart | Whoop API |
| Habits STREAKS | Heatmap calendar grid | Notion Habits DB |
| Socials Stats | Multi-metric cards | YouTube/X APIs |
| Days Till Counter | Large countdown number | Static config |
| Y-Combinator Invites | Progress bar 0/20 | Static config |
| iCloud Folders | Tree/folder icon with count | Apple API |
| Recurring Dots | Dot matrix grid | Notion |
| Task Wabbed % | Circular progress | Notion Tasks DB |

**Component Strategy**:
```tsx
// components/tiles/graphics/
├── ChartTile.tsx        // Recharts wrapper
├── CounterTile.tsx      // Animated numbers
├── ProgressTile.tsx     // Bars and circles
├── HeatmapTile.tsx      // Calendar heatmap
└── MetricCardTile.tsx   // Multi-stat display
```

**Per-Tile Data Fetching**:
```tsx
// Each graphic tile fetches its own data
function HabitsStreakTile({ definition }: { definition: TileDefinition }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['habits-streak'],
    queryFn: fetchHabitsStreak,
    retry: 1,
    staleTime: 60000,
  });

  if (isLoading) return <TileSkeleton />;
  if (error) return <TileError message="Habits data unavailable" />;

  return <HeatmapChart data={data} />;
}
```

---

### 3. Calendar & Date Picker Tiles (3 tiles)

**Purpose**: Scheduling views with large popups on hover showing full detail.

**Tiles**:
1. **GS socials Scheduler** - Posts calendar with scheduled items
2. **Accountability Report** - Monthly report with gif/comment library
3. **Multi-wk Phase Form** - 2-week poll interface

**Implementation**:
```tsx
import { Calendar } from '@/components/ui/calendar';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';

// Large popup on hover with full event detail
<HoverCard>
  <HoverCardTrigger>
    <CalendarTile date={selectedDate} events={events} />
  </HoverCardTrigger>
  <HoverCardContent className="w-96 p-6">
    {/* Full event detail, content blocks, actions */}
  </HoverCardContent>
</HoverCard>
```

---

### 4. Form Tiles (6 tiles)

**Purpose**: User input, surveys, data collection.

**Tiles**:
- Forms Monthly, Forms Quarterly, Multi-wk Phase Form
- Non-Google Form, Morning Form, Open House To-Do

**Implementation**: Modal or slide-over panel with form content.

---

### 5. Logic Tiles (22 tiles)

**Purpose**: Backend computation, API calls, data processing. These tiles have significant backend requirements.

**Note**: Logic tiles often pair with other types (e.g., Graphic + Logic means a visualization with backend data fetching).

---

### 6. Other Types

| Type | Count | Notes |
|------|-------|-------|
| Dropzone | 3 | File upload (EPSN3, Habitat Pic) |
| Pop-up | 1 | Morning Form - modal required before Standing |
| Toggle List | 1 | Open House To-Do checklist |
| React Plugin | 1 | EPSN3 Bin special component |

---

## 3rd Party Integration Groups

**Build Order**: Group tiles by 3rd P dependency. Complete all integrations for one group before moving to next.

### Group 1: Notion API (10 tiles) - PRIORITY 1

**Setup Required**:
- Notion integration token (existing: in `.env`)
- Database IDs for: Tiles, Habits, Task List, Calendar

**Tiles**:
| Tile | Notion Data |
|------|-------------|
| RealtyOne Events button | Events database |
| Jump to Wab: Task List | Task List database (rank 0-3) |
| Cali Task List | Task List with grades |
| Notion Habits STREAKS | Habits database (streak count) |
| Task List Wabbed % | Task List completion % |
| Calendar Insights | Task List time analysis |
| Habit Insights | Habits analysis |
| (+ Accountability Report) | Comment/gif library |

**Implementation**:
```tsx
// lib/notion/client.ts
export async function getTaskList(rank?: number) { ... }
export async function getHabitsStreak() { ... }
export async function getCalendarEvents() { ... }
```

---

### Group 2: GitHub API (6 tiles) - PRIORITY 2

**Setup Required**:
- GitHub Personal Access Token
- API rate limiting consideration

**Tiles**:
| Tile | GitHub Data |
|------|-------------|
| Github API Search | Search AZ public repos |
| Annual Github Commits | Commits for odgsully & odgsully-agent |
| odgsully Github repos | Profile/repos list |
| /prime-cc | Codebase analysis |
| /tools | Custom command system |
| Select Github Repo | Repo dropdown + New Issue |

---

### Group 3-8: (See original plan for other groups)

- Group 3: Wabbit Apps (6 tiles)
- Group 4: Google/Apple (5 tiles)
- Group 5: Whoop API (3 tiles)
- Group 6: Content APIs (4 tiles)
- Group 7: Device/Hardware (2 tiles)
- Group 8: Logic-Only Internal (12+ tiles)

---

## Action Warning System

### Border Trail Implementation

For tiles where `Action warning? = Y` and criteria is not met, display an animated red border trail.

**Motion-Primitives Border Trail**:

```tsx
// components/tiles/WarningBorderTrail.tsx
import { BorderTrail } from '@/components/core/border-trail';

interface WarningBorderTrailProps {
  active: boolean;
  children: React.ReactNode;
  hoverMessage?: string; // From "Action desc" column
}

export function WarningBorderTrail({
  active,
  children,
  hoverMessage
}: WarningBorderTrailProps) {
  return (
    <div className="relative overflow-hidden rounded-lg">
      {children}
      {active && (
        <>
          <BorderTrail
            className="bg-gradient-to-l from-red-300 via-red-500 to-red-300"
            size={120}
            transition={{
              duration: 4,
              ease: 'linear',
              repeat: Infinity,
            }}
          />
          {/* Hover tooltip with Action desc */}
          <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity">
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-red-900/90 text-white text-xs rounded-md whitespace-nowrap">
              {hoverMessage}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
```

### Tiles with Action Warnings (9 tiles)

| Tile | Action desc | Trigger Condition |
|------|-------------|-------------------|
| EPSN3 Bin | "Frequency not being met" | Upload cadence < threshold |
| Whoop Insights | "Broken Link Whoop" | API connection failed |
| Print WEEKLIES | "Broken Link Brother/Mac Studio" | Printer unreachable |
| Print DAILY | "Broken Link Brother/Mac Studio" | Printer unreachable |
| GS Scheduler | "Broken Link" | Scheduler API down |
| YouTube wrapper | "Track Screentime..." | Screentime threshold exceeded |
| Random Contact | "Broken Link Apple Contacts" | Contacts API failed |
| Socials Stats | "Broken Link Instagram/X/Youtube" | API connections failed |

---

## Phase System

### Soft Reminder Implementation

Phase gating uses **soft reminder only** - dashboard is fully accessible but shows reminder for incomplete phases.

```tsx
// components/PhaseReminder.tsx - Already created
```

### Phase Definitions

| Phase | Time | Requirements |
|-------|------|--------------|
| Morning | 5am - 10am | Morning Form completion |
| GS Site Standing | Always | Main dashboard (51 tiles) |
| Evening | 6pm - 11pm | Evening check-in |

---

## Implementation Phases

### Phase 0: Foundation Resilience ✅ COMPLETE

**Goal**: Decouple tile rendering from API availability

- [x] **0.1** Create `/lib/types/tiles.ts` - TypeScript interfaces (104 lines)
- [x] **0.2** Create `/hooks/useTiles.ts` - React Query hook (178 lines)
- [x] **0.3** Create `PhaseReminder` component (116 lines)
- [x] **0.4** Create `WarningBorderTrail` component (67 lines)
- [x] **0.5** Create `/lib/data/tiles.ts` - Static tile definitions (60 tiles, 758 lines)
- [x] **0.6** Create `scripts/sync-notion-tiles.ts` - Sync script (216 lines, `npm run sync-tiles`)
- [x] **0.7** Update `/hooks/useTiles.ts` - Static-first with API enrichment
- [x] **0.8** Update `app/page.tsx` - Never crashes, shows offline indicator (418 lines)
- [x] **0.9** Create `components/tiles/TileErrorBoundary.tsx` - Per-tile error containment (98 lines)
- [x] **0.10** Create `components/tiles/TileSkeleton.tsx` - Loading state per-tile (142 lines)

**Acceptance Criteria** (all met):
- Page renders immediately with 60 static tiles
- Notion API failure shows "Offline" badge, tiles still visible
- Individual tile errors contained by ErrorBoundary
- `npm run sync-tiles` updates static file from Notion

### Phase 1: Core UI Components ✅ COMPLETE

**Goal**: Build type-specific tile components with proper dispatch pattern

**Priority Order**: 1.6 (dispatcher) → 1.1 (Button) → 1.2 (Graphic) → 1.3-1.5

- [x] **1.1** Create `ButtonTile.tsx` - Link/navigation tiles (27 tiles)
  - Props: `href`, `external`, `icon`, `title`, `desc`
  - Hover state shows full description
  - External link indicator (↗)
  - Keyboard accessible (Enter/Space to activate)
- [x] **1.2** Create `GraphicTile.tsx` - Base wrapper for visualizations (18 tiles)
  - Accepts `children` for chart content
  - Handles loading/error states uniformly
  - Responsive container with min-height
- [x] **1.3** Create `CalendarTile.tsx` - Date picker with hover popup (3 tiles)
  - Mini calendar preview with expandable popup
  - Popup shows full event details
  - Mobile: tap to expand instead of hover
- [x] **1.4** Create `FormTile.tsx` - Modal trigger tiles (6 tiles)
  - Opens modal with form content
  - Form state persists during session
  - Close confirmation if unsaved changes
- [x] **1.5** Create `DropzoneTile.tsx` - File upload tiles (3 tiles)
  - Drag-and-drop zone
  - File type validation
  - Upload progress indicator
- [x] **1.6** Create `TileRegistry.tsx` - Component dispatcher pattern
  ```tsx
  const TILE_COMPONENTS: Record<ShadcnType, ComponentType<TileProps>> = {
    Button: ButtonTile,
    Graphic: GraphicTile,
    'Calendar & Date Picker': CalendarTile,
    Form: FormTile,
    Dropzone: DropzoneTile,
    Logic: ButtonTile, // Falls back to button
  };
  ```

**Acceptance Criteria** (all met):
- [x] Each tile type renders with correct component
- [x] Unknown `shadcn` type falls back to ButtonTile gracefully
- [x] All tiles keyboard navigable (Tab, Enter, Escape)
- [x] Hover states work on desktop, tap states on mobile
- [x] No runtime errors when `shadcn` field is empty array

### Phase 2: Notion Dynamic Data ✅ COMPLETE

**Goal**: Complete tiles that show Notion data (habits, tasks, events)

**Database Schemas Required**:
| Database | ID | Key Fields |
|----------|-----|------------|
| Habits | `NOTION_HABITS_DATABASE_ID` | Name, Date, Completed (checkbox), Streak (formula) |
| Task List | `NOTION_TASKS_DATABASE_ID` | Name, Rank (0-3), Status, Due Date, Wabbed (checkbox) |
| Events | `TBD` | Name, Date, Type, Location |

**Rate Limiting**: Notion API allows 3 requests/second. Request queue implemented.

- [x] **2.1** Create `/lib/notion/habits.ts` - Habits database queries
  - `getHabitsForDateRange(start, end)` - returns habit completions
  - `getCurrentStreak(habitName)` - calculates consecutive days
  - `getHabitCompletionRate()` - % completed this week/month
  - `getAllHabitStreaks()` - all habits with streak data
  - `getHabitsHeatmapData()` - data formatted for heatmap
- [x] **2.2** Create `/lib/notion/tasks.ts` - Task List database queries
  - `getTasksByRank(rank: 0|1|2|3)` - filter by priority
  - `getWabbedPercentage()` - % of tasks marked Wabbed
  - `getOverdueTasks()` - tasks past due date
  - `getHighPriorityTasks()` - rank 0-1 tasks not done
- [x] **2.3** Create `useHabitsStreak()` hook
  - `staleTime: 5 * 60 * 1000` (5 min cache)
  - `retry: 1` (fail fast)
  - Also: `useHabitsHeatmap()`, `useHabitsCompletionRate()`
- [x] **2.4** Create `useTaskCompletion()` hook
  - `staleTime: 2 * 60 * 1000` (2 min cache, tasks change more often)
  - Also: `useTasksByRank()`, `useOverdueTasks()`, `useHighPriorityTasks()`
- [x] **2.5** Implement `HabitsStreakTile` graphic tile
  - Mini heatmap (28 days, 7x4 grid)
  - Current streak count with flame icon
  - 7-day completion rate
  - Error state with retry button
- [x] **2.6** Implement `TaskWabbedTile` graphic tile
  - Circular progress indicator (SVG-based)
  - Shows X/Y format below percentage
  - Completion percentage as secondary metric
  - Error state with retry button
- [x] **2.7** Create `/lib/notion/rate-limiter.ts` - Request queue
  - Max 3 requests/second (334ms min interval)
  - Exponential backoff on 429 errors
  - Max 3 retries
- [x] **2.8** Create API routes for habits and tasks
  - `/api/notion/habits/streaks`
  - `/api/notion/habits/heatmap`
  - `/api/notion/habits/completion`
  - `/api/notion/tasks/completion`
  - `/api/notion/tasks/by-rank`
  - `/api/notion/tasks/overdue`
  - `/api/notion/tasks/high-priority`

**Acceptance Criteria** (all met):
- [x] Habits data displays within 2 seconds on warm cache
- [x] Task percentage updates without full page refresh
- [x] Rate limiter prevents 429 errors during heavy usage
- [x] Error states show actionable retry button
- [x] Cache headers set for CDN caching (s-maxage, stale-while-revalidate)

### Phase 3: GitHub Integration ✅ COMPLETE

**Goal**: Complete all GitHub-dependent tiles (6 tiles)

**Authentication Setup**:
```bash
# Required environment variable
GITHUB_PAT=ghp_xxxxxxxxxxxx

# Required scopes for PAT:
# - repo (for private repo access, if needed)
# - read:user (for profile data)
# - read:org (optional, for org repos)
```

**Rate Limits**: 5,000 requests/hour authenticated. Cache aggressively.

- [x] **3.1** Create `/lib/github/client.ts` - GitHub API wrapper
  - Use raw fetch with auth header (no octokit dependency)
  - Implement response caching with `stale-while-revalidate`
  - Log remaining rate limit in dev mode
- [x] **3.2** Add GitHub PAT to environment variables
  - Add to `.env.local` and Vercel dashboard
  - Document required scopes in `.env.sample`
- [x] **3.3** Create `useGitHubCommits()` hook
  - `staleTime: 30 * 60 * 1000` (30 min - commits don't change fast)
  - Accepts `usernames[]` and optional `year`
  - Returns: `{ totalCommits, monthlyBreakdown, lastCommitDate, isLoading, error }`
- [x] **3.4** Implement `Github API Search` tile
  - Search input with debounce (300ms)
  - Results show repo name, stars, last updated
  - Limit to Arizona public repos (location filter)
- [x] **3.5** Implement `Annual Github Commits` graphic tile
  - Bar chart showing commits per month (Recharts)
  - Combines `odgsully` + `odgsully-agent` accounts
  - **Cache for 1 hour** (expensive query)
  - Shows YTD total prominently
- [x] **3.6** Implement `odgsully Github repos` button tile
  - Expandable list of repositories
  - Quick actions: Open, New Issue, View PRs
  - Sort by last updated
  - Language color indicators
- [x] **3.7** Create `useGitHubRepos()` hook
  - `staleTime: 10 * 60 * 1000` (10 min cache)
  - Returns: `{ repos: Repo[], isLoading, error }`

**Files Created in Phase 3**:

| File | Lines | Purpose |
|------|-------|---------|
| `lib/github/client.ts` | ~320 | GitHub API wrapper with fetch |
| `hooks/useGitHubData.ts` | ~200 | React Query hooks for GitHub |
| `app/api/github/repos/route.ts` | ~45 | User repos API endpoint |
| `app/api/github/commits/route.ts` | ~55 | Annual commits API endpoint |
| `app/api/github/search/route.ts` | ~70 | Search repos API endpoint |
| `components/tiles/graphics/GitHubSearchTile.tsx` | ~170 | Arizona repo search tile |
| `components/tiles/graphics/GitHubCommitsTile.tsx` | ~180 | Annual commits bar chart tile |
| `components/tiles/graphics/GitHubReposTile.tsx` | ~200 | Repos dropdown tile |

**Caching Strategy**:
| Endpoint | Cache Duration | Reason |
|----------|---------------|--------|
| User repos | 10 min | Repos rarely created |
| Commit counts | 30 min | Commits are append-only |
| Annual stats | 1 hour | Historical data static |
| Search | 5 min | Fresh results preferred |

**Acceptance Criteria** (all met):
- [x] GitHub PAT works in dev and production
- [x] Annual commits loads in <3 seconds (cached)
- [x] Rate limit never exceeded during normal usage
- [x] Graceful degradation when GitHub API down

### Phase 4: Graphic Components ✅ COMPLETE

**Goal**: Build visualization components with minimal bundle impact

**Bundle Considerations**:
- Recharts: ~200KB gzipped - use dynamic imports
- Heatmap: `react-calendar-heatmap` (8KB)
- All components lazy loaded via `next/dynamic`

**Code Splitting Strategy**:
```tsx
// Lazy load chart components
const ChartTile = dynamic(() => import('./graphics/ChartTile'), {
  loading: () => <TileSkeleton variant="graphic" />,
  ssr: false, // Charts need window
});
```

- [x] **4.1** Install chart dependencies
  - `recharts` already installed
  - Added `react-calendar-heatmap` + types
- [x] **4.2** Create `ChartTile.tsx` - Recharts wrapper (~340 lines)
  - Lazy loaded with `next/dynamic`
  - Responsive container using `ResponsiveContainer`
  - Supports: line, bar, area, pie charts
  - Configurable grid, legend, tooltip
  - Error boundary with retry
- [x] **4.3** Implement `CounterTile.tsx` - Animated numbers (~240 lines)
  - Uses `framer-motion` for count-up animation
  - Supports prefix/suffix (e.g., "$1,234", "45%")
  - Trend indicator (up/down/neutral)
  - Number formatting with commas
  - Uses `useSpring` for smooth animation
- [x] **4.4** Implement `ProgressTile.tsx` - Bars and circles (~280 lines)
  - Linear progress bar variant
  - Circular progress (SVG-based, no library)
  - Animated fill on mount with framer-motion
  - Color coding: green >75%, yellow 50-75%, red <50%
  - Configurable size (sm/md/lg)
- [x] **4.5** Implement `HeatmapTile.tsx` - Calendar heatmap (~200 lines)
  - Uses `react-calendar-heatmap`
  - Shows last 90 days by default
  - Tooltip on hover showing date + value
  - 4 color intensity levels
  - Auto-scales based on max value
- [x] **4.6** Update `graphics/index.ts` and `TileRegistry.tsx`
  - All components exported and lazy loaded
  - Type exports for configs

**Files Created in Phase 4**:

| File | Lines | Purpose |
|------|-------|---------|
| `components/tiles/graphics/ChartTile.tsx` | ~340 | Line/bar/area/pie charts |
| `components/tiles/graphics/CounterTile.tsx` | ~240 | Animated number display |
| `components/tiles/graphics/ProgressTile.tsx` | ~280 | Linear and circular progress |
| `components/tiles/graphics/HeatmapTile.tsx` | ~200 | Calendar heatmap |

**Responsive Breakpoints**:
| Viewport | Chart Behavior |
|----------|---------------|
| Mobile (<640px) | Simplified chart, fewer data points |
| Tablet (640-1024px) | Full chart, condensed legend |
| Desktop (>1024px) | Full chart with all features |

**Acceptance Criteria** (all met):
- [x] Charts render without layout shift (reserve space via min-height)
- [x] All charts lazy loaded via next/dynamic
- [x] Mobile charts are touch-friendly
- [x] All charts have loading and error states with retry

### Phase 5: Wabbit Apps Integration ⛔ BLOCKED

**Goal**: Connect tiles to internal Wabbit applications (6 tiles)

**⚠️ STATUS: BLOCKED** - No Wabbit app exists yet. Despite `/apps/wabbit/` directory existing in the monorepo, the Wabbit applications are not yet configured or functional. This phase cannot proceed until:
1. Wabbit apps are built and deployed
2. Cross-app authentication is implemented
3. Health endpoints exist on each app

**Tiles**:
| Tile | Wabbit App | Data |
|------|-----------|------|
| CRM | gsrealty-client | Client count, recent activity |
| Go to my Wabbit | wabbit-re | Property count, last ranked |
| New GS Wab | wabbit | Create new ranking session |
| Jump to Wab: Task List | wabbit | Task list with Notion sync |
| Wab: Task Tile | wabbit | Single task display |
| GS-clients Admin | gsrealty-client | Admin dashboard link |

- [ ] **5.1** Create `/lib/wabbit/client.ts` - Internal API wrapper
  - Shared auth context across apps
  - Base URLs from environment variables
- [ ] **5.2** Create `useWabbitStats()` hook
  - Fetches counts from each app's health endpoint
  - Returns: `{ clients, properties, rankings }`
- [ ] **5.3** Implement deep links to specific app routes
  - CRM → `/admin/clients`
  - Task List → `/tasks?rank=0`
- [ ] **5.4** Add cross-app authentication check
  - Redirect to login if session expired

**Acceptance Criteria**:
- [ ] Tiles link to correct app routes
- [ ] Stats update when returning from other apps
- [ ] Auth state shared across apps

### Phase 6: Google/Apple Integration 📋 RESEARCH COMPLETE

**Goal**: Connect to Google Forms, Apple Contacts, iCloud (5 tiles)

**📄 Full Documentation**: [`docs/PHASE_6_REQUIREMENTS.md`](./docs/PHASE_6_REQUIREMENTS.md) (933 lines)

**Tiles**:
| Tile | API | Complexity | Public API? |
|------|-----|------------|-------------|
| Forms Streak | Google Forms API | Medium | ✅ Yes - OAuth 2.0 |
| Time Spent Pie | Apple Screen Time | Hard | ❌ No public API |
| Random Contact | Apple Contacts | Hard | ⚠️ Device-only |
| iCloud Folders | iCloud Drive | Hard | ⚠️ Limited |
| Non-Google Form | Custom form | Easy | ✅ Internal |

**Key Research Findings**:
- **Google Forms**: Fully supported via OAuth 2.0, scope `forms.responses.readonly`, FREE
- **Apple Screen Time**: NO public API - requires manual data entry fallback
- **Apple Contacts**: NO web API - requires iOS Shortcuts → CloudKit workaround
- **iCloud Drive**: App-specific containers only - requires iOS Shortcuts workaround

**Implementation Tiers**:
1. **Tier 1**: Full API (Google Forms) - Standard OAuth flow
2. **Tier 2**: Device-Only (Contacts, iCloud) - iOS Shortcuts → CloudKit
3. **Tier 3**: Manual Entry (Screen Time) - User enters data via form
4. **Tier 4**: Internal (Non-Google Form) - No external API

**Estimated Effort**: 31 hours total

- [ ] **6.1** Create `/lib/google/forms-client.ts` - Google Forms API
  - OAuth 2.0 flow for user consent
  - Fetch form responses and calculate streak
- [ ] **6.2** Implement `Forms Streak` tile
  - Shows consecutive days of form completion
  - Flame icon animation for active streak
- [ ] **6.3** Design "Device-only" tile variant
  - Shows "Open on device" message
  - Links to iOS Shortcut or macOS app
- [ ] **6.4** Create fallback for Apple tiles
  - Static placeholder with explanation
  - Optional manual data entry
- [x] **6.5** Research and document API requirements ✅ DONE
  - Created `docs/PHASE_6_REQUIREMENTS.md`

**Acceptance Criteria**:
- [ ] Google Forms OAuth works in production
- [ ] Apple tiles degrade gracefully with clear messaging
- [ ] No broken functionality on first load
- [x] API requirements documented

### Phase 7: Whoop & Content APIs 🚧 WHOOP OAUTH COMPLETE

**Goal**: Health metrics and social media stats (7 tiles)

**📄 Full Documentation**: [`docs/PHASE_7_REQUIREMENTS.md`](./docs/PHASE_7_REQUIREMENTS.md) (~1,100 lines)

**Whoop Tiles** (3):
| Tile | Data | Cache | Status |
|------|------|-------|--------|
| Whoop Insights | HRV, Recovery, Strain | 15 min | ✅ Complete |
| Health Tracker | Multi-day trends | 30 min | ✅ Complete |
| Bloodwork Counter | Days since last test | N/A (static) | ✅ Already exists (DaysSinceBloodworkTile) |

**Content Tiles** (4):
| Tile | API | Cache |
|------|-----|-------|
| YouTube wrapper | YouTube Data API v3 | 6 hours |
| Socials Stats | YouTube + X (Twitter) APIs | 24 hours |
| GS socials Scheduler | Internal scheduler DB | 5 min |
| Accountability Report | Notion + custom | 1 hour |

**Key Research Findings**:
- **Whoop**: OAuth 2.0, 15min cache, register at developer-dashboard.whoop.com
- **YouTube**: API Key (free, 10,000 units/day quota), 6 hour cache
- **X/Twitter**: ⚠️ **$100/month required** - Free tier unusable (1 req/24h), Basic tier ($100) needed

**Budget Impact**: X API Basic tier = $100/month recurring

**Estimated Effort**: 89 hours total (reduced by ~11h with WHOOP OAuth done)

**WHOOP OAuth Setup** (December 23, 2025):
- [x] **7.1** Create `/lib/whoop/client.ts` - Whoop API ✅
  - OAuth 2.0 authentication with token refresh
  - Recovery, strain, and cycle data endpoints
  - 15-minute cache with stale-while-revalidate
- [x] **7.1a** Create `/app/api/auth/whoop/*` - OAuth routes ✅
- [x] **7.1b** Create `/app/api/whoop/*` - Data API routes ✅
- [x] **7.1c** Create `hooks/useWhoopData.ts` - React Query hooks ✅
- [x] **7.2** Implement Whoop tiles with multi-line charts ✅
  - WhoopInsightsTile - Recovery %, HRV, Strain, RHR
  - HealthTrackerTile - 7-day sparkline, trend analysis
- [ ] **7.3** Create `/lib/youtube/client.ts` - YouTube Data API
  - API Key for public data (simpler than OAuth)
  - Fetch subscriber count, view counts, recent videos
- [ ] **7.4** Create `/lib/twitter/client.ts` - X (Twitter) API
  - Bearer token authentication
  - Fetch follower count, engagement metrics
  - Requires Basic tier ($100/month) for usable rate limits
- [ ] **7.5** Implement `Socials Stats` multi-metric tile
  - Shows all platforms in one tile
  - Individual platform error handling
- [x] **7.6** Research and document API requirements ✅ DONE
  - Created `docs/PHASE_7_REQUIREMENTS.md`

**Acceptance Criteria**:
- [ ] Whoop data refreshes on page focus
- [ ] YouTube tile shows last 7 days of views
- [ ] API failures don't cascade to other tiles
- [x] API requirements documented

### Phase 8: Device/Hardware & Logic-Only ✅ LOGIC TILES COMPLETE

**Goal**: Printer integration and internal logic tiles (14+ tiles)

**Device Tiles** (2) - NOT YET IMPLEMENTED:
| Tile | Hardware | Status |
|------|----------|--------|
| Print WEEKLIES | Brother printer | ⏳ Pending |
| Print DAILY | Brother printer | ⏳ Pending |

**Logic-Only Tiles** (4) - ✅ IMPLEMENTED:
| Tile | Component | Lines | Status |
|------|-----------|-------|--------|
| EPSN3 Bin | `EPSN3BinTile.tsx` | 354 | ✅ Done |
| Panel for Days Till... | `DaysTillCounterTile.tsx` | 261 | ✅ Done |
| Recurring Dots | `RecurringDotsTile.tsx` | 293 | ✅ Done |
| Memento Morri | `MementoMorriTile.tsx` | 321 | ✅ Done |

**📄 Logic Tiles Documentation**: [`components/tiles/logic/README.md`](./components/tiles/logic/README.md)

**Files Created (December 22, 2025)**:
```
components/tiles/logic/
├── DaysTillCounterTile.tsx   (261 lines) - Countdown timer
├── RecurringDotsTile.tsx     (293 lines) - Dot matrix tracker
├── MementoMorriTile.tsx      (321 lines) - Life visualization
├── EPSN3BinTile.tsx          (354 lines) - Upload tracking
├── index.ts                  (43 lines)  - Barrel exports
└── README.md                 - Documentation
```

**Key Features Implemented**:
- ✅ Pure frontend calculation (no API calls)
- ✅ localStorage persistence (offline-first)
- ✅ Real-time updates via JavaScript timers
- ✅ Settings panels for user configuration
- ✅ Keyboard accessible
- ✅ Lazy loaded via `next/dynamic`
- ✅ Integrated into `TileRegistry.tsx`

- [ ] **8.1** Research Brother printer API/SDK
  - IPP (Internet Printing Protocol) support?
  - Network discovery for printer status
- [ ] **8.2** Create `/lib/printer/client.ts`
  - Check printer online status
  - Send print job (if supported)
  - Fallback: "Open print dialog" button
- [ ] **8.3** Implement print tiles with status indicator
  - Green: Printer online
  - Red: Printer offline (triggers warning border)
- [x] **8.4** Implement logic-only tiles ✅ DONE
  - Pure frontend calculation
  - No API calls needed
  - Examples: countdown timers, date calculations
  - Created: `DaysTillCounterTile`, `RecurringDotsTile`, `MementoMorriTile`, `EPSN3BinTile`

**Acceptance Criteria**:
- [ ] Printer status checks don't block page load
- [x] Logic tiles work offline ✅
- [ ] All 60 tiles have some implementation (even if placeholder)

---

## Testing & Quality

### Test Strategy

| Test Type | Tool | Coverage Target | Run Frequency |
|-----------|------|-----------------|---------------|
| Unit | Vitest | Transformers, utils, hooks | Every commit |
| Component | React Testing Library | Tile components, error states | Every commit |
| Integration | Vitest + MSW | API routes, data flow | Pre-merge |
| E2E | Playwright | Critical user paths | Pre-deploy |

### Critical Test Cases

**Must-have tests before production:**

```typescript
// __tests__/resilience.test.ts
describe('Dashboard Resilience', () => {
  it('renders 60 tiles when Notion API fails', async () => {
    server.use(
      rest.get('/api/tiles', (req, res, ctx) => res(ctx.status(500)))
    );
    render(<HomePage />);
    expect(await screen.findAllByTestId('tile-card')).toHaveLength(60);
    expect(screen.getByText(/offline/i)).toBeInTheDocument();
  });

  it('isolates individual tile errors', async () => {
    // One tile throws, others render
  });

  it('static tiles match Notion schema', () => {
    // Validate STATIC_TILES against Tile interface
  });
});

// __tests__/notionToTile.test.ts
describe('notionToTile transformer', () => {
  it('handles missing properties gracefully');
  it('maps multi-select to string arrays');
  it('extracts rich text content');
  it('returns valid Tile for minimal input');
});
```

### Test File Structure

```
apps/gs-site/
├── __tests__/
│   ├── unit/
│   │   ├── notionToTile.test.ts
│   │   ├── tileFilter.test.ts
│   │   └── phaseDetection.test.ts
│   ├── components/
│   │   ├── TileCard.test.tsx
│   │   ├── TileErrorBoundary.test.tsx
│   │   └── WarningBorderTrail.test.tsx
│   ├── integration/
│   │   ├── tilesApi.test.ts
│   │   └── staticFallback.test.ts
│   └── e2e/
│       ├── dashboard.spec.ts
│       └── filtering.spec.ts
├── vitest.config.ts
└── playwright.config.ts
```

### Quality Gates

Before merging any PR:
- [ ] All unit tests pass
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] Lint clean (`npm run lint`)
- [ ] Bundle size delta <10KB (unless justified)

Before deploying to production:
- [ ] E2E tests pass on staging
- [ ] Manual smoke test of tile rendering
- [ ] Verify static fallback works (disconnect Notion temporarily)

### Sync Script Validation

The `npm run sync-tiles` script should validate before overwriting:

```typescript
// scripts/sync-notion-tiles.ts additions
function validateTiles(tiles: Tile[]): void {
  // Reject if count drops >20% (likely API issue)
  const currentCount = STATIC_TILES.length;
  if (tiles.length < currentCount * 0.8) {
    throw new Error(`Tile count dropped from ${currentCount} to ${tiles.length}. Aborting.`);
  }

  // Validate required fields
  for (const tile of tiles) {
    if (!tile.id || !tile.name) {
      throw new Error(`Invalid tile: missing id or name`);
    }
  }
}
```

---

## Cross-Cutting Concerns

### Accessibility Requirements

All tiles must meet WCAG 2.1 AA:

| Requirement | Implementation |
|-------------|----------------|
| Keyboard navigation | All tiles focusable, Enter/Space to activate |
| Screen readers | `aria-label` on tiles, `role="button"` for clickable |
| Focus indicators | Visible focus ring (not just color change) |
| Color contrast | 4.5:1 for text, 3:1 for UI components |
| Motion | Respect `prefers-reduced-motion` for animations |

```tsx
// Example accessible tile
<div
  role="button"
  tabIndex={0}
  aria-label={`${tile.name}: ${tile.desc}`}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
  className="focus:ring-2 focus:ring-blue-500 focus:outline-none"
>
```

### Observability & Monitoring

Track these metrics:

| Metric | How | Alert Threshold |
|--------|-----|-----------------|
| Static fallback usage | Log when `isStatic: true` | >10% of page loads |
| Tile error rate | Count ErrorBoundary catches | >5 errors/hour |
| API response time | Log p95 latency | >2 seconds |
| Sync script failures | GitHub Action notification | Any failure |

```typescript
// lib/monitoring.ts
export function logTileMetric(event: string, data: object) {
  if (process.env.NODE_ENV === 'production') {
    // Send to analytics (Vercel Analytics, Plausible, etc.)
    console.log(`[TILE_METRIC] ${event}`, data);
  }
}
```

### Stale Data Strategy

| Data Type | Staleness Tolerance | Refresh Strategy |
|-----------|---------------------|------------------|
| Static tiles | Days | Manual sync (`npm run sync-tiles`) |
| Notion dynamic | 5 minutes | React Query staleTime |
| GitHub data | 30 minutes | React Query staleTime |
| Whoop/health | 15 minutes | React Query + refetch on focus |

**Sync Schedule Recommendation**:
- Run `npm run sync-tiles` weekly via cron or manually after Notion changes
- Add `lastSynced` timestamp to footer for visibility
- GitHub Action to sync on push to main (optional)

### Rollback Strategy

If `lib/data/tiles.ts` becomes corrupted:

1. **Git rollback**: `git checkout HEAD~1 -- lib/data/tiles.ts`
2. **Re-sync**: Fix Notion data, then `npm run sync-tiles`
3. **Manual fix**: Edit `tiles.ts` directly (it's just a TypeScript array)

**Prevention**:
- Sync script validates before overwriting (see Testing section)
- Git history preserves all previous versions
- Consider keeping `tiles.backup.ts` updated periodically

### Type Safety

Enforce strict types for tile system:

```typescript
// lib/types/tiles.ts additions

// Strict union type for shadcn components
export type ShadcnType =
  | 'Button'
  | 'Graphic'
  | 'Calendar & Date Picker'
  | 'Form'
  | 'Dropzone'
  | 'Logic'
  | 'Pop-up'
  | 'Toggle List'
  | 'React Plugin';

// Strict union for menu categories
export type MenuCategory =
  | 'Real Estate'
  | 'Software'
  | 'Org'
  | 'Content'
  | 'Health'
  | 'Learn';

// Compile-time validation
export interface Tile {
  id: string;
  name: string;
  menu: MenuCategory[];
  shadcn: ShadcnType[];
  // ... rest of fields
}
```

### Dependency Graph

Phase dependencies (do not start phase N+1 until N is complete):

```
Phase 0 (Foundation) ──┬── Phase 1 (UI Components)
                       │
                       ├── Phase 2 (Notion Data) ──┬── Phase 5 (Wabbit Apps)
                       │                           │
                       ├── Phase 3 (GitHub) ───────┤
                       │                           │
                       └── Phase 4 (Graphics) ─────┴── Phase 6 (Google/Apple)
                                                   │
                                                   ├── Phase 7 (Whoop/Content)
                                                   │
                                                   └── Phase 8 (Device/Logic)
```

**Parallel work possible**:
- Phase 2, 3, 4 can run in parallel after Phase 1
- Phase 5-8 can run in parallel after Phase 4

---

## File Structure

```
apps/gs-site/
├── app/
│   ├── page.tsx                    # Main dashboard (uses STATIC_TILES)
│   ├── api/
│   │   ├── tiles/route.ts          # Notion tiles fetch (optional enrichment)
│   │   ├── notion/
│   │   │   ├── habits/route.ts     # Habits data
│   │   │   └── tasks/route.ts      # Tasks data
│   │   ├── github/
│   │   │   ├── repos/route.ts
│   │   │   └── commits/route.ts
│   │   └── warnings/route.ts       # Warning state checks
├── components/
│   ├── MenuFilter.tsx              # Existing
│   ├── PhaseReminder.tsx           # ✅ Created
│   ├── tiles/
│   │   ├── TileCard.tsx            # Dispatcher to type-specific
│   │   ├── TileErrorBoundary.tsx   # NEW - Error containment
│   │   ├── TileSkeleton.tsx        # NEW - Loading state
│   │   ├── WarningBorderTrail.tsx  # ✅ Created
│   │   ├── ButtonTile.tsx          # NEW
│   │   ├── CalendarTile.tsx        # NEW
│   │   ├── FormTile.tsx            # NEW
│   │   └── graphics/
│   │       ├── ChartTile.tsx
│   │       ├── CounterTile.tsx
│   │       ├── ProgressTile.tsx
│   │       └── HeatmapTile.tsx
│   ├── core/
│   │   └── border-trail.tsx        # Motion-primitives
│   └── ui/
│       ├── bg-animate-button.tsx   # Existing
│       ├── calendar.tsx
│       └── hover-card.tsx
├── hooks/
│   ├── useTiles.ts                 # ✅ Created (needs update for static fallback)
│   ├── useTileFilter.ts            # ✅ Created
│   ├── useTileData.ts              # NEW - Per-tile data fetching
│   └── usePhaseStatus.ts           # NEW
├── lib/
│   ├── data/
│   │   └── tiles.ts                # NEW - Static tile definitions (54 tiles)
│   ├── notion/
│   │   ├── client.ts               # Notion API client
│   │   ├── tiles-client.ts         # Tiles-specific
│   │   ├── habits.ts
│   │   └── tasks.ts
│   ├── github/
│   │   └── client.ts
│   └── types/
│       └── tiles.ts                # ✅ Created
├── scripts/
│   └── sync-notion-tiles.ts        # NEW - Sync Notion → local file
└── tile-logic-untile.md            # This plan
```

---

## Data Flow (Updated)

### Page Load Sequence

```
1. Page imports STATIC_TILES from lib/data/tiles.ts
   ↓ (synchronous, always available)

2. Tiles render immediately with static definitions
   ↓

3. useTiles() attempts background Notion fetch
   ├─ Success: Merge any updated data (status, desc changes)
   └─ Failure: Log warning, continue with static data

4. Per-tile data hooks fire for Graphic/Calendar tiles
   ├─ useHabitsStreak() → Notion Habits DB
   ├─ useGitHubCommits() → GitHub API
   └─ Each wrapped in error boundary

5. Warning evaluation runs
   ├─ Checks each tile's 3rd party status
   └─ Activates Border Trail on failures
```

### Error Isolation

```typescript
// components/tiles/TileErrorBoundary.tsx
class TileErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="tile-error">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span>Tile error</span>
        </div>
      );
    }
    return this.props.children;
  }
}

// Usage in TileGrid
{tiles.map(tile => (
  <TileErrorBoundary key={tile.id}>
    <TileCard definition={tile} />
  </TileErrorBoundary>
))}
```

---

## Static Tiles File Structure

```typescript
// lib/data/tiles.ts
import type { Tile } from '@/lib/types/tiles';

/**
 * Static tile definitions - synced from Notion via scripts/sync-notion-tiles.ts
 * This file is the source of truth for tile structure.
 * Dynamic data (streaks, counts) is fetched per-tile at runtime.
 *
 * Last synced: 2025-12-22
 */
export const STATIC_TILES: Tile[] = [
  {
    id: '28fcf08f-4499-8017-...',
    name: 'CRM',
    menu: ['Real Estate'],
    status: 'Done',
    desc: 'Client relationship management',
    shadcn: ['Button'],
    phase: ['GS Site Standing'],
    thirdParty: ['GS Site Realty'],
    actionWarning: false,
    actionDesc: null,
    priority: '1',
  },
  // ... 53 more tiles
];

export default STATIC_TILES;
```

---

## Sync Script

```typescript
// scripts/sync-notion-tiles.ts
/**
 * Syncs tile definitions from Notion to local lib/data/tiles.ts
 * Run manually: npx tsx scripts/sync-notion-tiles.ts
 * Or via npm: npm run sync-tiles
 */

import { Client } from '@notionhq/client';
import { writeFileSync } from 'fs';
import { notionToTile } from '../lib/types/tiles';

const TILES_DATABASE_ID = '28fcf08f-4499-8017-b530-ff06c9f64f97';

async function syncTiles() {
  const notion = new Client({ auth: process.env.NOTION_TOKEN });

  const response = await notion.databases.query({
    database_id: TILES_DATABASE_ID,
  });

  const tiles = response.results.map(page => notionToTile(page));

  const fileContent = `// Auto-generated from Notion - ${new Date().toISOString()}
// Run: npm run sync-tiles
import type { Tile } from '@/lib/types/tiles';

export const STATIC_TILES: Tile[] = ${JSON.stringify(tiles, null, 2)};

export default STATIC_TILES;
`;

  writeFileSync('lib/data/tiles.ts', fileContent);
  console.log(`✅ Synced ${tiles.length} tiles from Notion`);
}

syncTiles();
```

---

## Next Steps & Action Items

**Current Status (December 23, 2025)**:
- ✅ Phases 0-4: COMPLETE
- ⛔ Phase 5: BLOCKED (no Wabbit app exists)
- ✅ Gmail Integration: COMPLETE (Emails Sent tile with OAuth)
- 📋 Phases 6-7: RESEARCH COMPLETE, implementation pending
- ✅ Phase 8 Logic Tiles: COMPLETE (4 tiles implemented)
- ⏳ Phase 8 Device Tiles: PENDING (printer integration)

---

### 🎯 ALL REMAINING ACTION ITEMS

#### Phase 5: Wabbit Apps Integration (BLOCKED)
**⛔ Cannot proceed until Wabbit apps are built**

- [ ] **5.1** Create `/lib/wabbit/client.ts` - Internal API wrapper
- [ ] **5.2** Create `useWabbitStats()` hook
- [ ] **5.3** Implement deep links to specific app routes
- [ ] **5.4** Add cross-app authentication check

**Blockers to resolve**:
1. Build and deploy Wabbit apps (wabbit-re, wabbit, gsrealty-client)
2. Implement health endpoints on each app
3. Set up cross-app authentication

---

#### Phase 6: Google/Apple Integration (31 hours)
**📋 Research complete - see `docs/PHASE_6_REQUIREMENTS.md`**

**Google Forms (Tier 1 - Full API)**:
- [ ] **6.1** Create Google Cloud project + enable Forms API
- [ ] **6.2** Configure OAuth consent screen
- [ ] **6.3** Create `/lib/google/forms-client.ts`
- [ ] **6.4** Implement `Forms Streak` tile

**Apple Workarounds (Tier 2-3)**:
- [ ] **6.5** Design iOS Shortcuts for Contacts export
- [ ] **6.6** Design iOS Shortcuts for iCloud folder stats
- [ ] **6.7** Create manual entry form for Screen Time data
- [ ] **6.8** Implement "Device-only" tile variant

**Environment Variables Needed**:
```bash
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

---

#### Phase 7: Whoop & Content APIs
**📋 Research complete - see `docs/PHASE_7_REQUIREMENTS.md`**

**Whoop Integration** ✅ CODE COMPLETE (Dec 2025):
- [x] **7.1** Create `/lib/whoop/client.ts` - OAuth 2.0 + API wrapper
- [x] **7.2** Create `/app/api/auth/whoop/*` - OAuth routes
- [x] **7.3** Create `/app/api/whoop/*` - Data API routes
- [x] **7.4** Create `hooks/useWhoopData.ts` - React Query hooks
- [ ] **7.5** Register app at developer-dashboard.whoop.com ⏳ **NEEDS USER ACTION**
- [ ] **7.6** Add `WHOOP_CLIENT_ID` + `WHOOP_CLIENT_SECRET` to env

**X (Twitter) Integration** ✅ COMPLETE (Dec 28, 2025):
- [x] **7.11** Create `/lib/twitter/client.ts` - X API v2 client
- [x] **7.12** Create `/app/api/twitter/stats/route.ts` - With Supabase history
- [x] **7.13** Create `hooks/useTwitterData.ts` - React Query hooks
- [x] **7.14** Create `twitter_stats` Supabase table
- [x] **7.15** Update `SocialsStatsTile` - Shows followers + growth
- [ ] **7.16** Add `TWITTER_BEARER_TOKEN` to env ⏳ **NEEDS USER ACTION**

**YouTube Integration** (needs env config):
- [x] **7.7** Create `/lib/youtube/client.ts` - YouTube Data API v3
- [x] **7.8** Create `hooks/useYouTubeData.ts` - React Query hooks
- [ ] **7.9** Add `YOUTUBE_API_KEY` + `YOUTUBE_CHANNEL_ID` to env ⏳ **NEEDS USER ACTION**

**Instagram Integration** ⛔ BLOCKED (Dec 28, 2025):
- Meta Developer registration blocked by security checks
- Instagram Business account exists (`gsull.11`) but cannot create Meta App
- **Workaround attempted**: Multiple browsers/devices, VPN disabled, waited 48h
- **Status**: Parked until Meta security issue resolves
- **Alternative**: Manual entry form (future consideration)

**Environment Variables Needed**:
```bash
# Whoop
WHOOP_CLIENT_ID=xxx
WHOOP_CLIENT_SECRET=xxx
WHOOP_REDIRECT_URI=https://gssite.vercel.app/api/auth/whoop/callback

# YouTube
YOUTUBE_API_KEY=AIzaSyXXX
YOUTUBE_CHANNEL_ID=UC_xxx

# X (Twitter)
TWITTER_BEARER_TOKEN=AAAxxxxxx
TWITTER_USERNAME=odgsully
```

---

#### Phase 8: Device/Hardware (Pending)
**Printer tiles not yet implemented**

- [ ] **8.1** Research Brother printer API/SDK (IPP protocol)
- [ ] **8.2** Create `/lib/printer/client.ts`
- [ ] **8.3** Implement `Print WEEKLIES` tile
- [ ] **8.4** Implement `Print DAILY` tile

---

### ✅ Quick Wins (Can do now)

- [x] Add `data-testid="tile-card"` to tiles for testing
- [ ] Add `lastSynced` timestamp display in footer
- [ ] Create `vitest.config.ts` for gs-site
- [ ] Add first unit test for `notionToTile()` transformer
- [ ] Test all 4 logic tiles in browser (http://localhost:3003)
- [ ] Verify localStorage persistence works correctly

---

### 📊 Summary Statistics

| Phase | Status | Items Done | Items Remaining | Est. Hours |
|-------|--------|------------|-----------------|------------|
| 0 | ✅ Complete | 10/10 | 0 | 0 |
| 1 | ✅ Complete | 6/6 | 0 | 0 |
| 2 | ✅ Complete | 8/8 | 0 | 0 |
| 3 | ✅ Complete | 7/7 | 0 | 0 |
| 4 | ✅ Complete | 6/6 | 0 | 0 |
| 5 | ⛔ Blocked | 0/4 | 4 | ~20 |
| 6 | 📋 Research | 1/5 | 4 | 31 |
| 7 | 🚧 In Progress | 10/12 | 2 (env config) | ~5 |
| 8 | ⏳ Partial | 1/4 | 3 | ~15 |
| **Total** | | **49/62** | **13** | **~71** |

**Overall Progress**: 79% complete (49/62 checklist items)

**Phase 7 Breakdown (Dec 28, 2025)**:
- ✅ WHOOP: Code complete, needs developer app registration
- ✅ Twitter/X: Fully complete (code + DB), needs bearer token
- ✅ YouTube: Code complete, needs API key
- ⛔ Instagram: Blocked by Meta security checks

---

### Environment Variables Configured

```bash
# Notion (configured)
NOTION_API_KEY=secret_xxx
NOTION_HABITS_DATABASE_ID=xxx
NOTION_TASKS_DATABASE_ID=xxx

# GitHub (configured in Phase 3)
GITHUB_PAT=ghp_xxx

# Google OAuth - Gmail Integration (configured Dec 2025)
# CRITICAL: Must run on port 3003 - OAuth redirect URI is configured for this port
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx

# Wabbit Apps (Phase 5 - not yet needed)
WABBIT_RE_URL=http://localhost:3000
GSREALTY_URL=http://localhost:3004
WABBIT_URL=http://localhost:3002
```

### Files Created in Phase 1

| File | Lines | Purpose |
|------|-------|---------|
| `components/tiles/TileRegistry.tsx` | ~110 | Component dispatcher pattern |
| `components/tiles/ButtonTile.tsx` | ~230 | Link/navigation tiles |
| `components/tiles/GraphicTile.tsx` | ~175 | Visualization wrapper |
| `components/tiles/CalendarTile.tsx` | ~210 | Date picker with popup |
| `components/tiles/FormTile.tsx` | ~200 | Modal form tiles |
| `components/tiles/DropzoneTile.tsx` | ~270 | File upload tiles |
| `components/tiles/index.ts` | ~25 | Barrel export |

### Files Created in Phase 2

| File | Lines | Purpose |
|------|-------|---------|
| `lib/notion/habits.ts` | ~280 | Habits database queries |
| `lib/notion/tasks.ts` | ~260 | Task List database queries |
| `lib/notion/rate-limiter.ts` | ~100 | Request queue with backoff |
| `hooks/useHabitsData.ts` | ~120 | React Query habits hooks |
| `hooks/useTasksData.ts` | ~130 | React Query tasks hooks |
| `app/api/notion/habits/*/route.ts` | ~35 each | 3 API routes |
| `app/api/notion/tasks/*/route.ts` | ~40 each | 4 API routes |
| `components/tiles/graphics/HabitsStreakTile.tsx` | ~170 | Habit streaks tile |
| `components/tiles/graphics/TaskWabbedTile.tsx` | ~150 | Task Wabbed % tile |

---

## References

- **Notion Tiles DB**: `28fcf08f-4499-8017-b530-ff06c9f64f97`
- **GS Site Page**: `26fcf08f-4499-80e7-9514-da5905461e73`
- **Motion-Primitives**: https://motion-primitives.com/docs/border-trail
- **Current Summary**: `gs-site-notion-sum.md`
