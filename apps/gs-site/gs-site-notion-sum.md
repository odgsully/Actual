# GS Site Tiles - Source of Truth

> **IMPORTANT**: This file is auto-generated from working code.
> Run `npm run export-tiles` to regenerate. Manual edits will be overwritten.
>
> **Last Synced**: 2025-12-29
> **Source**: `tiles.ts` + `TileRegistry.tsx` (deep scan)

---

## Quick Stats

| Metric | Count |
|--------|-------|
| **Total Visible** | 49 |
| **Hidden** | 1 |
| **Done** | 12 |
| **In Progress** | 13 |
| **Not Started** | 24 |

### By Category

| Category | Count |
|----------|-------|
| Org | 20 |
| Software | 16 |
| Health | 12 |
| Content | 7 |
| Real Estate | 6 |
| Learn | 2 |

---

## All Tiles (Sorted by Priority)

| Name | Status | Type II | Description | Pri | 3rd Party |
|------|--------|---------|-------------|-----|-----------|
| Goals | In progress | Button | 2026 Goals, 3-Year Goals, and Someday Goals with progress tracking | 1 | - |
| InBody Scan | In progress | Graph, Form | Body composition from gym InBody scans. Manual entry popup. | 2 | InBody |
| Printoffs & KPIs | In progress | Button | Dailies, weeklies, monthlies, quarterlies | 1 | - |
| Evening Check-In | Done | Form | Daily evening reflection form | 1 | Notion |
| Core Habits | Done | Graph | HR Up, Stillness, Food Tracked - the 3 key daily habits | 1 | Notion |
| EPSN3 Bin | In progress | Dropzone | upload/choose file button | 1 | - |
| SpaceAd | In progress | Metric | Count of days till 04/14/2026 - MUST SHOOT. | 1 | Logic |
| Natural SQL language query UI for all databases toggle | Not started | Logic | Supabase Setup for all Projects to be able to query in na... | 1 | Logic, GitHub |
| Whoop API Insights Dash | Done | Graph | Background logic to 1. Actually Request from Whoop site o... | 1 | Whoop |
| Forms Streak | In progress | Metric | If Minimum 2x/day Form submitted, this counts as a day of... | 1 | Google, Logic |
| Jump to Wab: Task List Value | Not started | Button | Notion Database ‘Task List’ (Rank the ‘VALUE’ options bei... | 1 | Wabbit |
| GS socials Scheduler | Not started | Calendar | Calendar view with what posts scheduled to come out Link ... | 1 | Scheduler 3rd P |
| Prev day, prev week Time Spent pie chart: | Not started | Metric | Have a Time Allocation dropdown where you can click to dr... | 1 | Apple |
| YouTube wrapper/Timeline Open | Not started | Button | > &! yt drop URL in for Transcript analysis | 1 | YouTube 3rd P |
| Random Daily Contact. | Done | Button | For this, we need Access to Apple contacts. Use shadcn | 1 | Apple |
| Call Daniel | In progress | Logic | - | 1 | - |
| Datadog | Not started | Button | - | 1 | Datadog |
| Forms Wk Goal | In progress | Metric | Count all Google Forms for given week starting on Sunday ... | 1 | Google |
| Jarvis_Briefme report | In progress | Button | Pull in Jarvis_briefme repository & instead of having an ... | 1 | Logic |
| Cali Task List to do | Not started | Metric | Wabbit Rankings this week Count /out of Total or threshol... | 1 | Wabbit, Notion |
| Clean iCloud folder structure graphic | Not started | Metric | Permissions to view & COUNT unplaced folders for main…. t... | 1 | Logic |
| Morning Form | Done | Form | This form must be completed prior to any ability to get t... | 1 | Logic |
| Accountability Report send-off to Circle | Not started | Calendar | Every month, circle gets a report via their email on prog... | 1 | Logic, Scheduler 3rd P |
| Notion Habits STREAKS | Done | Metric | Notion database inline ‘Habits’ from ‘Habits’ page actual... | 1 | Notion |
| Audio Agent Admin | Not started | Form | Voice AI agents for real estate ops | 2 | - |
| Create Eating Challenges | Not started | Graph | Create a recipe with ingrediants that are in my Inventory... | 2 | Logic |
| New GS Wab; auto-sign into main Wab | Not started | Button | Link to wabbit site new wab | 2 | Wabbit |
| Jump to Wab: | Not started | Button | - | 2 | Wabbit |
| Go to my Wabbit | Done | Button | Link to wabbit site home | 2 | Wabbit |
| Codebase Form | Not started | Form | (new form could be Supabase backend & setup w/ whisper or... | 2 | Logic |
| Codebase Duolingo | Not started | Logic | - | 2 | GitHub, Logic |
| Socials stats | Not started | Metric | YouTube videos & Shorts posted X (both accounts) stats su... | 2 | Apple, Scheduler 3rd P |
| Call tree Launch | Not started | Button | Interactive UI IF/THEN, train Agents to marginally deviat... | 2 | Logic |
| Days since bloodwork done Counter | In progress | Metric | Preview Days since count of Date of 2/28/2025. Link to pa... | 2 | Logic |
| Claude Code MAX plan usage | In progress | Logic | 1. Is it possible to do this on a timer or is this Anthro... | 2 | Logic |
| Annual Github Commits count | Done | Metric | For (both odgsully & odgsully-agent), use GitHub API or o... | 2 | GitHub |
| RE KPI's & Calc | Not started | Graph | formula where you can edit at any point the Assumptions d... | 2 | Logic |
| odgsully Github repos | In progress | Button | Link | 2 | GitHub |
| Task List Wabbed % | Done | Metric | This weeks/months (toggle) Task list percent wabbed. | 2 | Wabbit, Notion |
| RE Events | Not started | Button | - | 3 | Notion |
| Create Health tracker chart | Done | Graph | - | 3 | Whoop |
| LLM Benchmarks | In progress | Button | Quick access to LLM benchmark sites: LM Arena and Artificial Analysis | 3 | - |
| Y-Combinator invites | Not started | Graph | Scrape YC with login permissions (Browserbase?). or Playw... | 3 | Logic |
| Memento Morri | In progress | Button | Weeks expected to live, 50 years. Same template as printe... | 3 | Logic |
| GS-clients Admin Dash page | Not started | Button | Link to gsrealty-client site | - | GS Site Realty |
| Audio Agent Admin | Not started | Button | - | - | Logic |
| Calendar Insights | Not started | Button | 1. Fetching from supabase Wabbit for Task List (rank 0-3)... | - | Wabbit, Notion |
| Emails sent | Done | Metric | Count from all gbsullivan@mac.com and gbsullivan6@gmail.com | - | Logic, Apple, Google |
| Habit Insights | Done | Graph | 1. Goal here is to give insights into Habits coming from ... | - | Notion |

---

## Implementation Details

### Fully Implemented (14 tiles)

| Tile | Component | Data Hooks |
|------|-----------|------------|
| Goals | GoalsTile | localStorage (completed goals state) |
| InBody Scan | InBodyTile | useManualInBodyMetrics |
| Evening Check-In | EveningCheckInTile | fetch('/api/ |
| Core Habits | CoreHabitsTile | useHabitsStreak |
| Whoop API Insights Dash | WhoopInsightsTile | useWhoopInsights, useConnectWhoop |
| Random Daily Contact. | RandomContactTile | fetch('/api/ |
| Morning Form | MorningFormTile | fetch('/api/ |
| Notion Habits STREAKS | HabitsStreakTile | useHabitsStreak, useHabitsHeatmap |
| Go to my Wabbit | WabbitLinkTile | useWabbitAppHealth |
| Annual Github Commits count | GitHubCommitsTile | useOdgsullyAnnualCommits |
| Task List Wabbed % | TaskWabbedTile | useTaskCompletion |
| Create Health tracker chart | HealthTrackerTile | useConnectWhoop |
| Emails sent | EmailsSentTile | useGmailStats, useConnectGmail |
| Habit Insights | HabitInsightsTile | useQuery, fetch('/api/ |

### Stub/Placeholder (11 tiles)

| Tile | Component | Path |
|------|-----------|------|
| Printoffs & KPIs | PrintoffsKPIsTile | printoffs/PrintoffsKPIsTile.tsx |
| EPSN3 Bin | EPSN3BinTile | logic/EPSN3BinTile.tsx |
| SpaceAd | DaysTillCounterTile | logic/DaysTillCounterTile.tsx |
| Forms Streak | FormStreakTile | graphics/FormStreakTile.tsx |
| Call Daniel | CallAgentTile | logic/CallAgentTile.tsx |
| Forms Wk Goal | FormsCompletedTile | graphics/FormsCompletedTile.tsx |
| Jarvis_Briefme report | JarvisBriefingTile | JarvisBriefingTile.tsx |
| Days since bloodwork done Counter | DaysSinceBloodworkTile | logic/DaysSinceBloodworkTile.tsx |
| Claude Code MAX plan usage | ClaudeCodeUsageTile | logic/ClaudeCodeUsageTile.tsx |
| odgsully Github repos | GitHubReposTile | graphics/GitHubReposTile.tsx |
| Memento Morri | MementoMorriTile | logic/MementoMorriTile.tsx |

### Not Yet Implemented (24 tiles)

| Tile | Falls Back To | Reason |
|------|---------------|--------|
| Natural SQL language query UI for all databases toggle | ButtonTile | No custom component |
| Jump to Wab: Task List Value | ButtonTile | No custom component |
| GS socials Scheduler | ButtonTile | No custom component |
| Prev day, prev week Time Spent pie chart: | ButtonTile | No custom component |
| YouTube wrapper/Timeline Open | ButtonTile | No custom component |
| Datadog | ButtonTile | No custom component |
| Cali Task List to do | ButtonTile | No custom component |
| Clean iCloud folder structure graphic | ButtonTile | No custom component |
| Accountability Report send-off to Circle | ButtonTile | No custom component |
| Audio Agent Admin | ButtonTile | No custom component |
| Create Eating Challenges | ButtonTile | No custom component |
| New GS Wab; auto-sign into main Wab | ButtonTile | No custom component |
| Jump to Wab: | ButtonTile | No custom component |
| Codebase Form | ButtonTile | No custom component |
| Codebase Duolingo | ButtonTile | No custom component |
| Socials stats | ButtonTile | No custom component |
| Call tree Launch | ButtonTile | No custom component |
| RE KPI's & Calc | ButtonTile | No custom component |
| RE Events | ButtonTile | No custom component |
| LLM Benchmarks | LLMBenchmarksTile | Popup with LM Arena + Artificial Analysis |
| Y-Combinator invites | ButtonTile | No custom component |
| GS-clients Admin Dash page | ButtonTile | No custom component |
| Audio Agent Admin | ButtonTile | No custom component |
| Calendar Insights | ButtonTile | No custom component |

---

## Full Tile Descriptions

Detailed descriptions from Notion for each tile.

### Goals
**Status**: In progress | **Priority**: 1 | **Type**: Button

2026 Goals, 3-Year Goals, and Someday Goals with progress tracking.

**Features:**
- Tabbed popup with 3 goal categories
- Checkable goals with fade-out animation on completion
- Progress bar showing overall completion
- localStorage persistence for checked state
- 36 total goals across categories

**Goal Categories:**
1. **2026 Goals** (11 items): Core habits, SpaceAd shoot, fitness milestones, professional targets
2. **3-Year Goals** (10 items): Health achievements, travel, financial milestones, creative projects
3. **Someday Goals** (15 items): Life aspirations, legacy goals, major achievements

### Printoffs & KPIs
**Status**: In progress | **Priority**: 1 | **Type**: Button

Dailies, weeklies, monthlies, quarterlies

### Evening Check-In
**Status**: Done | **Priority**: 1 | **Type**: Form

Daily evening reflection form

### Core Habits
**Status**: Done | **Priority**: 1 | **Type**: Graph

HR Up, Stillness, Food Tracked - the 3 key daily habits

### EPSN3 Bin
**Status**: In progress | **Priority**: 1 | **Type**: Dropzone

upload/choose file button

### SpaceAd
**Status**: In progress | **Priority**: 1 | **Type**: Metric

Count of days till 04/14/2026 - MUST SHOOT.

### Natural SQL language query UI for all databases toggle
**Status**: Not started | **Priority**: 1 | **Type**: Logic

Supabase Setup for all Projects to be able to query in natural language
  
  Make a copy from tac-8 from...

### Whoop API Insights Dash
**Status**: Done | **Priority**: 1 | **Type**: Graph

Background logic to 
  1. Actually Request from Whoop site on a timer.
  2. Filter through 
  3.

### Forms Streak
**Status**: In progress | **Priority**: 1 | **Type**: Metric

If Minimum 2x/day Form submitted, this counts as a day of Forms created streak. 
  
  This tile is popul...

### Jump to Wab: Task List Value
**Status**: Not started | **Priority**: 1 | **Type**: Button

Notion Database ‘Task List’ (Rank the ‘VALUE’ options being 0-3)

### GS socials Scheduler
**Status**: Not started | **Priority**: 1 | **Type**: Calendar

Calendar view with what posts scheduled to come out
  
  Link with reocurring Task List Notion 
  
  Graphic...

### Prev day, prev week Time Spent pie chart:
**Status**: Not started | **Priority**: 1 | **Type**: Metric

Have a Time Allocation dropdown where you can click to dropdown these two pie chart. Counterbalance ...

### YouTube wrapper/Timeline Open
**Status**: Not started | **Priority**: 1 | **Type**: Button

>  &! yt drop URL in for Transcript analysis

### Random Daily Contact.
**Status**: Done | **Priority**: 1 | **Type**: Button

For this, we need Access to Apple contacts.
  
  Use shadcn

### Forms Wk Goal
**Status**: In progress | **Priority**: 1 | **Type**: Metric

Count all Google Forms for given week starting on Sunday AM. Ending Sat night.
  
  Much same logic as F...

### Jarvis_Briefme report
**Status**: In progress | **Priority**: 1 | **Type**: Button

Pull in Jarvis_briefme repository & instead of having an output everyday in gmail drafts, put them i...

### Cali Task List to do
**Status**: Not started | **Priority**: 1 | **Type**: Metric

Wabbit Rankings this week Count /out of Total or threshold of GRADES [A,B+,B,B-,C+]

### Clean iCloud folder structure graphic
**Status**: Not started | **Priority**: 1 | **Type**: Metric

Permissions to view & COUNT unplaced folders for main….  those in❗❗, those in BHRF
  
  Dropdown style u...

### Morning Form
**Status**: Done | **Priority**: 1 | **Type**: Form

This form must be completed prior to any ability to get to GS Site Standing. 
  
  1. AM Weight → Notion...

### Accountability Report send-off to Circle
**Status**: Not started | **Priority**: 1 | **Type**: Calendar

Every month, circle gets a report via their email on progress. 
  
  If they had access to a little gif/...

### Notion Habits STREAKS
**Status**: Done | **Priority**: 1 | **Type**: Metric

Notion database inline ‘Habits’ from ‘Habits’ page actually has consistancy where it uses COUNT the ...

### Audio Agent Admin
**Status**: Not started | **Priority**: 2 | **Type**: Form

Voice AI agents for real estate ops

### Create Eating Challenges
**Status**: Not started | **Priority**: 2 | **Type**: Graph

Create a recipe with ingrediants that are in my Inventory
  
  Inventory create by documenting all from ...

### New GS Wab; auto-sign into main Wab
**Status**: Not started | **Priority**: 2 | **Type**: Button

Link to wabbit site new wab

### Go to my Wabbit
**Status**: Done | **Priority**: 2 | **Type**: Button

Link to wabbit site home

### Codebase Form
**Status**: Not started | **Priority**: 2 | **Type**: Form

(new form could be Supabase backend & setup w/ whisper or audio API and include something with Git s...

### Socials stats
**Status**: Not started | **Priority**: 2 | **Type**: Metric

YouTube videos & Shorts posted
  
  X (both accounts) stats such as Tweets sent
  
  Instagram posts sent
  
  I...

### Call tree Launch
**Status**: Not started | **Priority**: 2 | **Type**: Button

Interactive UI IF/THEN, train Agents to marginally deviate to improve

### Days since bloodwork done Counter
**Status**: In progress | **Priority**: 2 | **Type**: Metric

Preview Days since count of Date of 2/28/2025.
  
  Link to page that contains
  
  1. Contains general heal...

### Claude Code MAX plan usage
**Status**: In progress | **Priority**: 2 | **Type**: Logic

1. Is it possible to do this on a timer or is this Anthropic API credits at that point that cant eve...

### Annual Github Commits count
**Status**: Done | **Priority**: 2 | **Type**: Metric

For  (both odgsully & odgsully-agent), use GitHub API or otherwise to count across codebases all com...

### RE KPI's & Calc
**Status**: Not started | **Priority**: 2 | **Type**: Graph

formula where you can edit at any point the Assumptions dollar amount text boxes for Annual Commissi...

### odgsully Github repos
**Status**: In progress | **Priority**: 2 | **Type**: Button

Link

### Task List Wabbed %
**Status**: Done | **Priority**: 2 | **Type**: Metric

This weeks/months (toggle) Task list percent wabbed.

### Y-Combinator invites
**Status**: Not started | **Priority**: 3 | **Type**: Graph

Scrape YC with login permissions (Browserbase?). or Playwright script
  out of 20 invites remaining on...

### Memento Morri
**Status**: In progress | **Priority**: 3 | **Type**: Button

Weeks expected to live, 50 years. Same template as printed. Every time it’s openned up→ animation th...

### GS-clients Admin Dash page
**Status**: Not started | **Priority**: None | **Type**: Button

Link to gsrealty-client site

### Calendar Insights
**Status**: Not started | **Priority**: None | **Type**: Button

1. Fetching from supabase Wabbit for Task List (rank 0-3) calendar productivity rank, we want to get...

### Emails sent
**Status**: Done | **Priority**: None | **Type**: Metric

Count from all  gbsullivan@mac.com  and gbsullivan6@gmail.com

### Habit Insights
**Status**: Done | **Priority**: None | **Type**: Graph

1. Goal here is to give insights into Habits coming from the Habits database in Notion and Supabase,...

### InBody Scan
**Status**: In progress | **Priority**: 2 | **Type**: Graph, Form

Body composition metrics from gym InBody scans. Click tile to open manual entry form.

**Features:**
- Manual entry popup form for logging gym scans
- Stores in Supabase `inbody_scans` table
- Optional Notion sync (requires NOTION_INBODY_DATABASE_ID)
- Tracks: weight, body fat %, muscle mass, BMI, BMR, visceral fat, InBody score
- Color-coded body fat display (green/yellow/red)
- Trend indicators for fat and muscle changes
- Days since last scan counter

**Data Flow:**
- Click tile → InBodyFormModal opens
- Fill form with values from InBody printout
- Submit → POST /api/inbody/manual
- Data saved to Supabase + synced to Notion (if configured)
- Tile refreshes to show latest scan

---

## Hidden Tiles

These tiles are defined but filtered from the dashboard display.

| Name | ID | Reason |
|------|----|----- |
| GS Site Admin view | `2cecf08f-4499-8087-a384-cc48e79c18d1` | Accessible via header gear icon |

---

## Notion Database References

- **Tiles Database ID**: `28fcf08f-4499-8017-b530-ff06c9f64f97`
- **GS Site Page ID**: `26fcf08f-4499-80e7-9514-da5905461e73`

---

## Type II Legend

| Type II | Description | Count |
|---------|-------------|-------|
| **Button** | Simple navigation, links | 17 |
| **Graph** | Data visualization, charts | 7 |
| **Metric** | Counts, percentages, streaks | 12 |
| **Form** | User input, forms | 4 |
| **Counter** | Countdowns, days since | 0 |
| **Calendar** | Calendar views, date pickers | 2 |
| **Dropzone** | File upload | 1 |
| **Logic** | Complex backend processing | 4 |

---

*Generated by `scripts/export-tiles-to-md.ts` on 2025-12-29*
