# GS Site Tile Logic - Implementation Plan

> **Purpose**: Transform the current static tile grid into a dynamic, Notion-synced dashboard with intelligent warnings, 3rd party integrations, and component-specific UI patterns.
>
> **Last Updated**: December 22, 2025
> **Branch**: `gssite-dec18-per-notion`

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Target Architecture](#target-architecture)
3. [Tile Component Types](#tile-component-types)
4. [3rd Party Integration Groups](#3rd-party-integration-groups)
5. [Action Warning System](#action-warning-system)
6. [Phase System](#phase-system)
7. [Implementation Phases](#implementation-phases)
8. [File Structure](#file-structure)
9. [Data Flow](#data-flow)

---

## Current State Analysis

### What Exists (apps/gs-site)

| Component | Status | Location |
|-----------|--------|----------|
| Homepage with tile grid | Working | `app/page.tsx` |
| MenuFilter component | Working | `components/MenuFilter.tsx` |
| Notion API endpoint | Working | `app/api/notion/route.ts` |
| BG Animate Button | Installed | `components/ui/bg-animate-button.tsx` |
| Motion-primitives | Installed | via npm |
| CultUI components | Installed | via npm |

### Notion Database Schema (54 Tiles)

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

### Core Concept

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
Notion Tiles DB → API Route → React Query Cache → Tile Components
                     ↓
              3rd Party APIs (Notion, GitHub, Whoop, etc.)
                     ↓
              Warning State Evaluation
                     ↓
              Border Trail Activation
```

---

## Tile Component Types

Based on the `shadcn` column in Notion, each tile renders differently:

### 1. Button Tiles (27 tiles)

**Purpose**: URL navigation - small button capable of showing hover action, icon, title, and short description.

**Implementation**:
```tsx
interface ButtonTile {
  type: 'button';
  href: string;
  external?: boolean;
  icon: ReactNode;
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
- LLM Arena, GitHub Repos, Jarvis Briefme, Memento Morri, etc.

---

### 2. Graphic Tiles (18 tiles)

**Purpose**: Data visualizations, charts, counters, progress indicators.

**Implementation Strategy** - use best judgment per tile context:

| Tile | Recommended Graphic |
|------|---------------------|
| Whoop Insights | Recharts line/area chart |
| RealtyOne KPIs | Recharts bar + formula display |
| Forms Streak | Animated counter + flame icon |
| Time Spent Pie | Recharts pie chart (2 pies) |
| Health Tracker | Recharts multi-line chart |
| Habits STREAKS | Heatmap calendar grid |
| Socials Stats | Multi-metric cards |
| Days Till Counter | Large countdown number |
| Y-Combinator Invites | Progress bar 0/20 |
| iCloud Folders | Tree/folder icon with count |
| Recurring Dots | Dot matrix grid |
| Task Wabbed % | Circular progress |

**Component Strategy**:
```tsx
// components/tiles/graphics/
├── ChartTile.tsx        // Recharts wrapper
├── CounterTile.tsx      // Animated numbers
├── ProgressTile.tsx     // Bars and circles
├── HeatmapTile.tsx      // Calendar heatmap
└── MetricCardTile.tsx   // Multi-stat display
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

**Features**:
- Mini calendar view in tile
- Hover reveals large detailed popup
- Content-rich display in popup
- Link with recurring Task List
- Missed timeslot warnings (Border Trail)

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

**Implementation**:
```tsx
// lib/github/client.ts
export async function searchRepos(query: string) { ... }
export async function getCommitCount(username: string, year: number) { ... }
export async function getUserRepos(username: string) { ... }
```

---

### Group 3: Wabbit Apps (6 tiles)

**Setup Required**: Internal monorepo routing

**Tiles**:
- Jump to Wab: Task List Value
- New GS Wab; auto-sign into main Wab
- Jump to Wab:
- Go to my Wabbit
- Cali Task List to do
- Task List Wabbed %

**Implementation**: Direct links to monorepo apps with optional auth pass-through.

---

### Group 4: Google/Apple (5 tiles)

**Tiles**:
- Forms Streak (Google integration)
- Forms Count (Google)
- Random Daily Contact (Apple Contacts)
- Time Spent Pie (Apple)
- Non-Google Form (Google alternative)

---

### Group 5: Whoop API (3 tiles)

**Setup Required**: Whoop OAuth integration

**Tiles**:
- Whoop Insights Dash
- Health Tracker Chart
- (Data for health metrics)

---

### Group 6: Content APIs (4 tiles)

**Tiles**:
- YouTube wrapper (YouTube API)
- Socials Stats (YouTube + X APIs)
- GS Scheduler (Scheduler 3rd P)

---

### Group 7: Device/Hardware (2 tiles)

**Tiles**:
- Print WEEKLIES (Brother Printer)
- Print DAILY (Brother Printer)

**Note**: Requires local network/device setup.

---

### Group 8: Logic-Only (Internal) (12+ tiles)

**Tiles requiring only internal logic**:
- Days Till Counter
- Claude Code Usage
- Y-Combinator Invites
- Bloodwork Counter
- Eating Challenges
- iCloud Folders
- Recurring Dots
- And others...

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
            size={120} // Longer tail for visibility
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

### Warning State Management

```tsx
// hooks/useTileWarnings.ts
import { useQuery } from '@tanstack/react-query';

interface TileWarning {
  tileId: string;
  active: boolean;
  message: string;
}

export function useTileWarnings() {
  return useQuery({
    queryKey: ['tile-warnings'],
    queryFn: async () => {
      // Check each warning condition
      const warnings: TileWarning[] = [];

      // Example: Whoop API check
      const whoopConnected = await checkWhoopConnection();
      if (!whoopConnected) {
        warnings.push({
          tileId: 'whoop-insights',
          active: true,
          message: 'Broken Link Whoop'
        });
      }

      return warnings;
    },
    refetchInterval: 60000, // Check every minute
  });
}
```

---

## Phase System

### Soft Reminder Implementation

Phase gating uses **soft reminder only** - dashboard is fully accessible but shows reminder for incomplete phases.

```tsx
// components/PhaseReminder.tsx
'use client';

import { useState, useEffect } from 'react';
import { Sunrise, X } from 'lucide-react';

export function PhaseReminder() {
  const [dismissed, setDismissed] = useState(false);
  const [morningFormComplete, setMorningFormComplete] = useState(false);

  // Check if Morning Form completed today
  useEffect(() => {
    const checkMorningForm = async () => {
      // Query Notion/Supabase for today's Morning Form completion
      const completed = await checkTodaysMorningForm();
      setMorningFormComplete(completed);
    };
    checkMorningForm();
  }, []);

  if (morningFormComplete || dismissed) return null;

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mx-6 mt-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Sunrise className="w-5 h-5 text-amber-500" />
        <div>
          <p className="text-sm font-medium text-amber-200">Morning Form Incomplete</p>
          <p className="text-xs text-amber-400/70">Complete your AM check-in for full tracking</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          className="px-3 py-1.5 text-xs bg-amber-500 text-black rounded-md font-medium hover:bg-amber-400"
          onClick={() => {/* Open Morning Form modal */}}
        >
          Complete Now
        </button>
        <button
          className="p-1 text-amber-500/50 hover:text-amber-500"
          onClick={() => setDismissed(true)}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
```

### Phase Definitions

| Phase | Time | Requirements |
|-------|------|--------------|
| Morning | 5am - 10am | Morning Form completion |
| GS Site Standing | Always | Main dashboard (51 tiles) |
| Evening | 6pm - 11pm | Evening check-in |

---

## Implementation Phases

### Phase 1: Foundation (Week 1)

**Goal**: Establish data pipeline and component architecture

- [ ] **1.1** Create `/lib/notion/tiles-client.ts` - Fetch and cache Notion tiles
- [ ] **1.2** Create `/lib/types/tiles.ts` - TypeScript interfaces matching Notion schema
- [ ] **1.3** Create `/hooks/useTiles.ts` - React Query hook for tiles data
- [ ] **1.4** Update `app/page.tsx` to use real Notion data instead of static array
- [ ] **1.5** Install Border Trail: `npx motion-primitives@latest add border-trail`
- [ ] **1.6** Create `WarningBorderTrail` wrapper component
- [ ] **1.7** Create `PhaseReminder` component

### Phase 2: Notion Integration (Week 2)

**Goal**: Complete all Notion-dependent tiles

- [ ] **2.1** Create `/lib/notion/habits.ts` - Habits database queries
- [ ] **2.2** Create `/lib/notion/tasks.ts` - Task List database queries
- [ ] **2.3** Implement `Notion Habits STREAKS` graphic tile
- [ ] **2.4** Implement `Task List Wabbed %` graphic tile
- [ ] **2.5** Implement `Calendar Insights` tile
- [ ] **2.6** Implement `Habit Insights` tile
- [ ] **2.7** Implement `Cali Task List` button tile
- [ ] **2.8** Implement `RealtyOne Events button` tile

### Phase 3: GitHub Integration (Week 3)

**Goal**: Complete all GitHub-dependent tiles

- [ ] **3.1** Create `/lib/github/client.ts` - GitHub API wrapper
- [ ] **3.2** Add GitHub PAT to environment variables
- [ ] **3.3** Implement `Github API Search` tile (AZ repos)
- [ ] **3.4** Implement `Annual Github Commits` graphic tile
- [ ] **3.5** Implement `odgsully Github repos` button tile
- [ ] **3.6** Implement `Select Github Repo` dropdown tile

### Phase 4: Graphic Tiles (Week 4)

**Goal**: Build out visualization components

- [ ] **4.1** Install Recharts: `npm install recharts`
- [ ] **4.2** Create `ChartTile` base component
- [ ] **4.3** Implement `RealtyOne KPIs` calculator graphic
- [ ] **4.4** Implement `Forms Streak` animated counter
- [ ] **4.5** Implement `Time Spent Pie` dual pie chart
- [ ] **4.6** Implement `Days Till Counter` countdown
- [ ] **4.7** Implement `Y-Combinator Invites` progress (0/20)

### Phase 5: Calendar Tiles (Week 5)

**Goal**: Build calendar views with hover popups

- [ ] **5.1** Create `CalendarTile` base component
- [ ] **5.2** Create large hover popup component
- [ ] **5.3** Implement `GS Scheduler` calendar tile
- [ ] **5.4** Implement `Accountability Report` calendar tile
- [ ] **5.5** Implement `Multi-wk Phase Form` tile

### Phase 6: Wabbit & Internal Links (Week 6)

**Goal**: Connect internal monorepo apps

- [ ] **6.1** Implement all Wabbit link tiles (6 tiles)
- [ ] **6.2** Add auth pass-through logic
- [ ] **6.3** Implement internal navigation tiles

### Phase 7: Warning System (Week 7)

**Goal**: Activate all warning indicators

- [ ] **7.1** Create warning state evaluation service
- [ ] **7.2** Implement API health checks for each 3rd P
- [ ] **7.3** Wire up Border Trail to warning tiles
- [ ] **7.4** Add hover tooltips with Action desc
- [ ] **7.5** Test all 9 warning tile scenarios

### Phase 8: External APIs (Week 8+)

**Goal**: Integrate remaining 3rd party services

- [ ] **8.1** Whoop OAuth flow + API integration
- [ ] **8.2** Apple Contacts integration (if feasible)
- [ ] **8.3** YouTube API integration
- [ ] **8.4** X/Twitter API integration
- [ ] **8.5** Brother Printer local integration

---

## File Structure

```
apps/gs-site/
├── app/
│   ├── page.tsx                    # Main dashboard (refactored)
│   ├── api/
│   │   ├── notion/
│   │   │   ├── route.ts            # Existing
│   │   │   ├── tiles/route.ts      # Tiles fetch
│   │   │   ├── habits/route.ts     # Habits fetch
│   │   │   └── tasks/route.ts      # Tasks fetch
│   │   ├── github/
│   │   │   ├── repos/route.ts
│   │   │   └── commits/route.ts
│   │   ├── whoop/
│   │   │   └── route.ts
│   │   └── warnings/
│   │       └── route.ts            # Warning state checks
├── components/
│   ├── MenuFilter.tsx              # Existing
│   ├── PhaseReminder.tsx           # NEW
│   ├── tiles/
│   │   ├── TileCard.tsx            # Refactored base tile
│   │   ├── WarningBorderTrail.tsx  # NEW
│   │   ├── ButtonTile.tsx          # NEW
│   │   ├── CalendarTile.tsx        # NEW
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
│   ├── useTiles.ts                 # NEW
│   ├── useTileWarnings.ts          # NEW
│   └── usePhaseStatus.ts           # NEW
├── lib/
│   ├── notion/
│   │   ├── client.ts               # Notion API client
│   │   ├── tiles-client.ts         # Tiles-specific
│   │   ├── habits.ts
│   │   └── tasks.ts
│   ├── github/
│   │   └── client.ts
│   ├── whoop/
│   │   └── client.ts
│   └── types/
│       └── tiles.ts                # TypeScript interfaces
└── tile-logic-untile.md            # This plan
```

---

## Data Flow

### Notion → Tiles Pipeline

```
1. Server Component loads page
   ↓
2. React Query fetches from /api/notion/tiles
   ↓
3. API route calls Notion SDK
   ↓
4. Data normalized to Tile interface
   ↓
5. Tiles rendered with type-specific components
   ↓
6. Warning hook evaluates each tile's status
   ↓
7. Border Trail activates on warning tiles
```

### Warning Evaluation Logic

```typescript
// Pseudo-code for warning evaluation
function evaluateWarning(tile: Tile): boolean {
  if (!tile.actionWarning) return false;

  switch (tile.thirdP) {
    case 'Whoop':
      return !whoopApiConnected;
    case 'Brother Printer':
      return !printerReachable;
    case 'Apple':
      return !appleContactsAccess;
    // ... etc
  }

  // Frequency-based warnings
  if (tile.actionDesc.includes('Frequency')) {
    return lastActivity > frequencyThreshold;
  }

  return false;
}
```

---

## Next Steps

1. **Immediate**: Run `npx motion-primitives@latest add border-trail` to install Border Trail
2. **Today**: Create `lib/types/tiles.ts` with full TypeScript interfaces
3. **This Week**: Refactor `page.tsx` to fetch from Notion instead of static data
4. **Review**: Check warning tile list and verify all Action desc messages are captured

---

## References

- **Notion Tiles DB**: `28fcf08f-4499-8017-b530-ff06c9f64f97`
- **GS Site Page**: `26fcf08f-4499-80e7-9514-da5905461e73`
- **Motion-Primitives**: https://motion-primitives.com/docs/border-trail
- **Current Summary**: `gs-site-notion-sum.md`
