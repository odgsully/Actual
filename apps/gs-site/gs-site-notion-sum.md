# GS Site Integration Summary

## Source
- **Notion Page**: "GS SITE [in Monorepo]"
- **Page ID**: `26fcf08f-4499-80e7-9514-da5905461e73`
- **Tiles Database ID**: `28fcf08f-4499-8017-b530-ff06c9f64f97`
- **URL**: https://www.notion.so/GS-SITE-in-Monorepo-26fcf08f449980e79514da5905461e73
- **Last Edited**: December 22, 2025
- **Retrieved**: December 22, 2025

---

## Overview

GS Site is a personal dashboard hub accessible at `wabbit-rank.ai/gs-site`. The site should be "Caffeinated for all-time ON screen" - always visible and actively monitored.

### Key Objective
Create a unified dashboard that integrates data from:
- Supabase (Wabbit Task List)
- Notion databases (Habits, Calendar, Tiles)
- External APIs (Whoop, YouTube, X/Twitter, Apple Contacts, GitHub)

---

## Menu Filtering System

### Implementation Plan

Use **CULTUI's BG Animate Button** component for category filtering at the top of GS Site.

#### Button Layout (Left to Right)
```
[ALL] [Real Estate] [Software] [Org] [Content] [Health] [Learn]
```

#### Component: `components/ui/bg-animate-button.tsx`
Already installed. Supports gradients: `sunrise`, `ocean`, `candy`, `forest`, `sunset`, `nebula`, `default`

#### Suggested Gradient Assignments
| Button | Gradient | Notion Color |
|--------|----------|--------------|
| ALL | `default` (purple) | - |
| Real Estate | `sunset` (orange-red) | brown |
| Software | `ocean` (blue) | blue |
| Org | `nebula` (purple) | purple |
| Content | `candy` (pink-red) | red |
| Health | `forest` (green) | yellow |
| Learn | `sunrise` (warm) | pink |

#### Filtering Logic
```typescript
type MenuCategory = 'Real Estate' | 'Software' | 'Org' | 'Content' | 'Health' | 'Learn';

interface Tile {
  name: string;
  menu: MenuCategory[];  // Multi-select - tile can belong to multiple categories
  status: 'Not started' | 'In progress' | 'Done';
  desc: string;
  shadcn: string[];
  phase: string[];
}

// Filter function
const filterTiles = (tiles: Tile[], category: MenuCategory | 'ALL') => {
  if (category === 'ALL') return tiles;
  return tiles.filter(tile => tile.menu.includes(category));
};
```

#### Multi-Category Tiles
Tiles with multiple MENU values appear **identical** in each filtered view. Example:
- "18. Natural SQL language query UI" appears in: Real Estate, Software, Org, Content, Health (5 categories)

---

## Tiles Database Schema

### Properties
| Property | Type | Description |
|----------|------|-------------|
| **Name** | Title | Tile name/label |
| **MENU** | Multi-select | Category filter (Real Estate, Software, Org, Content, Health, Learn) |
| **Status** | Status | Not started / In progress / Done |
| **Desc** | Rich Text | Detailed description |
| **shadcn** | Multi-select | UI components needed (Button, Form, Graphic, Logic, etc.) |
| **Phase** | Multi-select | When tile displays (GS Site Standing, Morning, Evening) |
| **Select** | Select | Priority (1, 2, 3) |

### MENU Options
| Category | Color | Tile Count |
|----------|-------|------------|
| Real Estate | Brown | 10 |
| Software | Blue | 21 |
| Org | Purple | 28 |
| Content | Red | 8 |
| Health | Yellow | 12 |
| Learn | Pink | 2 |

---

## Complete Tiles Database (56 Records)

### By MENU Category

---

### Real Estate (10 tiles)

| Name | Status | Description | Components |
|------|--------|-------------|------------|
| **CRM** | Not started | Link to gsrealty-client site | Button |
| **10. Open House To-Do form** | In progress | - | Toggle List, Button |
| **GS-clients Admin Dash page** | Not started | - | Button |
| **2. Random Daily Contact** | Not started | Access to Apple contacts. | Button |
| **RealtyOne KPI's calculator** | Not started | Formula vibe where you can edit Assumptions for Annual Commission, adjusts ABSs, listings needed, average commission, closed volume needed, closed avg sales price, transactions needed (total vs. per month), budgeted expenses, listings needed at 80% close rate | Graphic |
| **Call tree Launch** | Not started | Interactive UI IF/THEN, train Agents to marginally deviate to improve | Button |
| **18. Natural SQL language query UI** | Not started | Supabase Setup for all Projects to query in natural language | Logic |
| **12. Multi-wk time frame Phase form** | Not started | Once a 2-week poll asking what kind of phase the last week & upcoming week feels like | Form |
| **9. /prime-cc** | Not started | Improvements on any given codebase. Duolingo style multiple choice for Best Practices. Optional BRANCH→TEST→new TEST result. Give ID to Supabase for reference | Logic |

---

### Software (21 tiles)

| Name | Status | Description | Components |
|------|--------|-------------|------------|
| **Jump to Wab: Task List Value** | Not started | Notion Database 'Task List' (Rank VALUE 0-3) | Button |
| **GS-clients Admin Dash page** | Not started | - | Button |
| **New GS Wab; auto-sign into main Wab** | Not started | Link to wabbit site new wab | Button |
| **Jump to Wab:** | Not started | - | Button |
| **Go to my Wabbit** | Not started | Link to wabbit site home | Button |
| **7. LLM Arena link/preview?** | Not started | - | Button |
| **8. /tools** | Not started | Custom-command random for codebases. Duolingo style matching & definition review of tools | Logic |
| **17. Github API?** | Not started | Search for Arizona related public repos. Should this be a tile or report? | Button, Logic |
| **Call my Questioning Agent: Daniel Park** | Not started | Upon call with agent, unique menu. "Hello? This is Daniel." 1. Codebase critical gaps? 2. Clarity on goals? | Button, Logic |
| **Select Github Repo dropdown** | Not started | Goes to New Issue [ADW Workflow button]. This is my IDP | Button, Logic |
| **IDP Datadog Dash** | Not started | Homebase Button. Health of all tests, scrapers & pipelines/codebases | Button |
| **Claude Code usage MAX plan** | Not started | Token OpenRouter usage. Is it possible on timer or Anthropic API credits? | Logic |
| **Annual Github Commits count** | Not started | For both odgsully & odgsully-agent | Logic |
| **AI Agent workforce admin board** | Not started | Jump to: 1. Notion overview 2. Agents admin nitty gritty | Button |
| **odgsully Github repos** | Not started | Link | Button |
| **9. /prime-cc** | Not started | Improvements on any given codebase (also update jarvis_briefme) | Logic |
| **18. Natural SQL language query UI** | Not started | Supabase Setup for all Projects | Logic |
| **12. Multi-wk time frame Phase form** | Not started | 2-week poll on phase feeling | Form |
| **2. Random Daily Contact** | Not started | Access to Apple contacts | Button |

---

### Org (28 tiles)

| Name | Status | Description | Components |
|------|--------|-------------|------------|
| **GS Site Admin view** | Not started | Wherever shadcn column has 'Logic', its variables, description should be in Admin view | Button |
| **Physically print WEEKLIES workflow trigger** | Not started | Automate ordering Brother 0DW print of WEEKLIES pdf. Exporting from Notion to Files | Button |
| **Physically print tomorrow DAILY UI trigger** | Not started | Automate ordering Brother 0DW print of DAILY pdf | Button |
| **15. Forms (monthly) & printoff** | Not started | Monthly Make+Track KPIs | Form, Logic |
| **Forms (quarterly) & printoff** | Not started | Quarterly Make+Track KPIs | Form, Logic |
| **14. Forms Streak** | Not started | Minimum 2x/day | Graphic, Logic |
| **Forms completed this week Count** | Not started | - | Logic, Graphic |
| **11. Prev day, prev week Time Spent pie chart** | Not started | Time Allocation dropdown with two pie charts. Counterbalance Note with Re-Balance suggestions | Graphic, Logic |
| **4. Non-Google Form** | Not started | Supabase backend with whisper/audio API. Git summary, record Loom & transcribe. LLM /prime for mission & codebase | Form, Button |
| **1. Whoop API Insights Dash** | Not started | Background logic: 1. Request from Whoop on timer 2. Filter through 3. Display | Graphic, Logic |
| **6. Create Health tracker chart** | Not started | - | Graphic |
| **Clean iCloud folder structure graphic** | Not started | Permissions to view & COUNT unplaced folders. Dropdown detailing files | Graphic, Button, Logic |
| **Main dots style for Recurring Monthly important tasks** | Not started | Like TECH SORT 7 | Graphic |
| **UI LIBRARIES** | Done | Kokonut UI, StyleUI, CultUI, Motion-primitives, Prompt-kit | - |
| **Habitat Pic check** | Not started | Photo upload of organized environment: clean sink, clothes laid out, phone across room | Dropzone |
| **Morning Form** | Not started | Must complete prior to GS Site Standing. 1. AM Weight→Notion Habits 2. Record 45sec AM vid | Pop-up |
| **Accountability Report send-off to Circle** | Not started | Monthly report to circle via email. Gif/comment library to send back | Calendar & Date Picker |
| **Notion Habits STREAKS** | Not started | COUNT table for days in a row (1 day offset) | Graphic, Logic |
| **Task List Wabbed %** | Not started | This weeks/months (toggle) Task list percent wabbed | Graphic, Logic |
| **Cali Task List to do** | Not started | Wabbit Rankings this week Count /out of Total or threshold of GRADES [A,B+,B,B-,C+] | Button |
| **8. /tools** | Not started | Custom-command random for codebases | Logic |
| **9. /prime-cc** | Not started | Improvements on any given codebase | Logic |
| **13. Panel for Days Till… Space Ad MUST SHOOT** | Not started | Countdown timer | Graphic, Logic |
| **18. Natural SQL language query UI** | Not started | Natural language queries | Logic |
| **12. Multi-wk time frame Phase form** | Not started | 2-week poll | Form |
| **Call tree Launch** | Not started | Interactive UI IF/THEN | Button |
| **AI Agent workforce admin board** | Not started | Jump to Notion overview and Agents admin | Button |

---

### Content (8 tiles)

| Name | Status | Description | Components |
|------|--------|-------------|------------|
| **EPSN3 Bin** | Not started | Upload/choose file button | React plugin, Dropzone |
| **GS socials Scheduler** | Not started | Calendar view with scheduled posts. Link with recurring Task List. Graphic for missed timeslots | Calendar & Date Picker, Graphic |
| **YouTube wrapper/Timeline Open** | Not started | Drop URL for Transcript analysis | Button |
| **3. Socials stats** | Not started | YouTube & X (both accounts) stats | Graphic |
| **5. Create Eating Challenges** | Not started | Create recipe with ingredients from Inventory | Graphic, Logic |
| **13. Panel for Days Till… Space Ad MUST SHOOT** | Not started | Countdown | Graphic, Logic |
| **18. Natural SQL language query UI** | Not started | Natural language queries | Logic |
| **12. Multi-wk time frame Phase form** | Not started | 2-week poll | Form |

---

### Health (12 tiles)

| Name | Status | Description | Components |
|------|--------|-------------|------------|
| **1. Whoop API Insights Dash** | Not started | Health/fitness dashboard from Whoop API | Graphic, Logic |
| **Days since bloodwork done Counter** | Not started | Entire Garrett MD export PDF. Contains autobiographical health info | Logic |
| **5. Create Eating Challenges** | Not started | Create recipe with inventory ingredients | Graphic, Logic |
| **6. Create Health tracker chart** | Not started | - | Graphic |
| **14. Forms Streak** | Not started | Minimum 2x/day | Graphic, Logic |
| **2. Random Daily Contact** | Not started | Access to Apple contacts | Button |
| **Habitat Pic check** | Not started | Photo upload of organized environment | Dropzone |
| **Notion Habits STREAKS** | Not started | COUNT days in a row | Graphic, Logic |
| **Memento Morri** | Not started | Weeks expected to live, 50 years. Animation enlarges & scratches boxes | Button |
| **18. Natural SQL language query UI** | Not started | Natural language queries | Logic |
| **12. Multi-wk time frame Phase form** | Not started | 2-week poll | Form |

---

### Learn (2 tiles)

| Name | Status | Description | Components |
|------|--------|-------------|------------|
| **out of 20 invites remaining on Y-Combinator** | Not started | Scrape YC with login (Browserbase/Playwright). "0/20"=green "20/20"=red | Logic |
| **Jarvis_Briefme report** | Not started | URL highlight & transcribe read. Connected to whisper/Google - ask questions | Button |

---

### No Category (2 tiles)

| Name | Status | Description | Components |
|------|--------|-------------|------------|
| **Calendar Insights** | Not started | Fetch from Supabase Wabbit Task List (rank 0-3). Tiles for most productive: Time of Day, Days, Category, Specific task item | - |
| **Habit Insights** | Not started | Insights from Habits (Notion/Supabase). Tiles: Streak Count with motivation slideshow, % summary, Weight & Body fat graph (2w, 1m, 3m, 6m buttons) | - |

---

## Phase System

Tiles display at different times based on Phase:

| Phase | Description | Tile Count |
|-------|-------------|------------|
| **GS Site Standing** | Always visible, main dashboard | 51 |
| **Morning** | Must complete before accessing Standing | 1 |
| **Evening** | Evening check-in tiles | 1 |

---

## Component Requirements Summary

| Component | Count | Tiles |
|-----------|-------|-------|
| **Button** | 27 | Navigation, links, triggers |
| **Graphic** | 18 | Charts, visualizations, counters |
| **Logic** | 22 | Backend computation, APIs |
| **Form** | 6 | User input, surveys |
| **Calendar & Date Picker** | 3 | Scheduling, dates |
| **Dropzone** | 3 | File uploads |
| **Pop-up** | 1 | Morning Form |
| **Toggle List** | 1 | Open House To-Do |
| **React plugin** | 1 | EPSN3 Bin |

---

## Site Style

### Style Guidelines
- Use `site-ref` folder assets: `grid.png`, `gradient.png`, `grain.png`
- Layout inspiration: https://ui.shadcn.com/

### Top of Site
1. Dashboard header with "GS" title + `signature.png`
2. **Menu Filter Bar** using BG Animate Buttons:
   - 7 buttons: ALL, Real Estate, Software, Org, Content, Health, Learn
   - Client-side filtering
   - Instant show/hide of tiles

---

## Data Sources

### Primary
1. **Supabase** - Wabbit data, user preferences
2. **Notion API** - Tiles, Habits, Calendar, Task databases

### External APIs
- **Whoop** - Fitness/health data
- **YouTube API** - Channel stats
- **X/Twitter API** - Social stats
- **Apple Contacts** - Contact randomizer
- **GitHub API** - Repo search, commit counts
- **OpenRouter** - Token usage
- **Claude Code API** - Usage monitoring

---

## Technical Implementation

### Menu Filter Component (Proposed)
```tsx
// components/MenuFilter.tsx
'use client';

import { useState } from 'react';
import { BgAnimateButton } from '@/components/ui/bg-animate-button';

const MENU_CATEGORIES = [
  { id: 'ALL', label: 'ALL', gradient: 'default' as const },
  { id: 'Real Estate', label: 'Real Estate', gradient: 'sunset' as const },
  { id: 'Software', label: 'Software', gradient: 'ocean' as const },
  { id: 'Org', label: 'Org', gradient: 'nebula' as const },
  { id: 'Content', label: 'Content', gradient: 'candy' as const },
  { id: 'Health', label: 'Health', gradient: 'forest' as const },
  { id: 'Learn', label: 'Learn', gradient: 'sunrise' as const },
];

interface MenuFilterProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export function MenuFilter({ activeCategory, onCategoryChange }: MenuFilterProps) {
  return (
    <div className="flex gap-2 flex-wrap justify-center p-4">
      {MENU_CATEGORIES.map((cat) => (
        <BgAnimateButton
          key={cat.id}
          gradient={cat.gradient}
          animation="spin-slow"
          rounded="full"
          shadow={activeCategory === cat.id ? 'deep' : 'soft'}
          size="sm"
          onClick={() => onCategoryChange(cat.id)}
          className={activeCategory === cat.id ? 'ring-2 ring-white' : ''}
        >
          {cat.label}
        </BgAnimateButton>
      ))}
    </div>
  );
}
```

### Current Tech Stack
- Next.js 14
- Tailwind CSS
- shadcn/ui + CULTUI + motion-primitives
- Notion API integration (`/api/notion`)
- Health check endpoint (`/api/health`)

---

## Files Referenced
- `signature.png` - Header signature image
- `grid.png`, `gradient.png`, `grain.png` - Background textures
- `/youcandoit/` - Motivational images for streak celebrations
- `components/ui/bg-animate-button.tsx` - Animated gradient button component
