# GS Site Tile Logic & Goals (Source of Truth)

> **IMPORTANT**: This file is the PRIMARY source of truth for tile logic and goals.
> Notion is the secondary reference. When discrepancies exist, this file takes precedence.
>
> **Last Synced from Notion**: December 23, 2025
> **Total Tiles**: 47

---

## Source References
- **Notion Page**: "GS SITE [in Monorepo]"
- **Page ID**: `26fcf08f-4499-80e7-9514-da5905461e73`
- **Tiles Database ID**: `28fcf08f-4499-8017-b530-ff06c9f64f97`
- **URL**: https://www.notion.so/GS-SITE-in-Monorepo-26fcf08f449980e79514da5905461e73

---

## Quick Stats

| Metric | Count |
|--------|-------|
| **Total Tiles** | 47 |
| **Not Started** | 45 |
| **In Progress** | 2 |
| **Done** | 0 |

### By Menu Category
| Category | Count |
|----------|-------|
| Org | 21 |
| Software | 15 |
| Health | 10 |
| Content | 7 |
| Real Estate | 5 |
| Learn | 2 |

### By Third Party Integration
| Integration | Count | Notes |
|-------------|-------|-------|
| Logic | 22 | Internal logic/computation |
| EXTRA LOGIC | 11 | Complex/additional logic needed |
| Notion | 7 | Notion API integration |
| Wabbit | 6 | Cross-app integration |
| GitHub | 5 | GitHub API |
| Scheduler 3rd P | 3 | Social scheduling platform |
| Google | 3 | Google Forms/APIs |
| Whoop | 2 | Health tracking API |
| Twilio | 2 | Communication API |
| Brother Printer | 2 | Local printer automation |
| Apple | 2 | Apple Contacts/APIs |
| YouTube 3rd P | 1 | YouTube API |
| GS Site Realty | 1 | Internal app link |
| Datadog | 1 | Monitoring dashboard |

---

## Tile Database Schema

| Property | Type | Description |
|----------|------|-------------|
| **Name** | Title | Tile name/label |
| **MENU** | Multi-select | Category filter (Real Estate, Software, Org, Content, Health, Learn) |
| **Status** | Status | Not started / In progress / Done |
| **Desc** | Rich Text | Detailed description and logic requirements |
| **shadcn** | Multi-select | UI components needed (Button, Form, Graphic, Logic, etc.) |
| **Phase** | Multi-select | When tile displays (GS Site Standing, Morning, Evening) |
| **Select** | Select | Priority (1, 2, 3) |
| **3rd P** | Multi-select | Third party integrations required |
| **Action warning?** | Checkbox | Has active warning |
| **Action desc** | Rich Text | Warning description |
| **SETTINGS** | Multi-select | Admin-configurable settings |

---

## Complete Tile Reference

### Priority 1 Tiles (Critical)

#### EPSN3 Bin
- **Status**: Not started
- **Menu**: Content
- **Phase**: GS Site Standing
- **Components**: React plugin, Dropzone
- **Third Party**: -
- **Description**: Upload/choose file button for ESPN3 content

---

#### 13. Panel for Days Till... Space Ad MUST SHOOT
- **Status**: Not started
- **Menu**: Org, Content
- **Phase**: GS Site Standing
- **Components**: Graphic, Logic
- **Third Party**: Logic
- **Description**: Count of days till 04/14/2026. Countdown timer graphic.

---

#### 18. Natural SQL language query UI for all databases toggle
- **Status**: Not started
- **Menu**: Real Estate, Software, Org, Content, Health
- **Phase**: GS Site Standing
- **Components**: Logic
- **Third Party**: Logic, GitHub, EXTRA LOGIC
- **Description**: Supabase Setup for all Projects to be able to query in natural language. Make a copy from tac-8 from /Users/garrettsullivan/Desktop/AUTOMATE/IndyDevDan/TAC/

---

#### 15. Forms (monthly) & printoff
- **Status**: Not started
- **Menu**: Org
- **Phase**: GS Site Standing
- **Components**: Form, Logic
- **Third Party**: Logic
- **Description**: Monthly Make+Track KPIs. Create a pdf report with all KPI's.

---

#### 1. Whoop API Insights Dash
- **Status**: Not started
- **Menu**: Org, Health
- **Phase**: GS Site Standing
- **Components**: Graphic, Logic
- **Third Party**: Whoop, EXTRA LOGIC
- **Description**: Background logic to:
  1. Actually Request from Whoop site on a timer
  2. Filter through
  3. Display insights

---

#### 14. Forms Streak
- **Status**: Not started
- **Menu**: Org, Health
- **Phase**: GS Site Standing
- **Components**: Graphic, Logic
- **Third Party**: Google, Logic
- **Description**: If Minimum 2x/day Form submitted, this counts as a day of Forms created streak. This tile is populating with the prev. days data i.e. the current day should not count. i.e. if Monday 3 forms were submitted and Tuesday 2 forms were submitted, but Wednesday is today & it is 11:58pm, & there is 0 forms submitted. Then what should the streak counter show? It should show 2 day streak.

---

#### Jump to Wab: Task List Value
- **Status**: Not started
- **Menu**: Software
- **Phase**: GS Site Standing
- **Components**: Button
- **Third Party**: Wabbit
- **Description**: Button to jump to Wabbit Task List ranking interface

---

#### GS socials Scheduler
- **Status**: Not started
- **Menu**: Content
- **Phase**: GS Site Standing
- **Components**: Calendar & Date Picker, Graphic
- **Third Party**: Scheduler 3rd P
- **Description**: Calendar view with what posts scheduled to come out. Link with recurring Task List Notion. Graphic for missed timeslots.

---

#### 11. Prev day, prev week Time Spent pie charts
- **Status**: Not started
- **Menu**: Org
- **Phase**: GS Site Standing
- **Components**: Graphic, Logic
- **Third Party**: Notion
- **Description**: Have a Time Allocation dropdown where you can click to dropdown these two pie charts. Categorize Notion Task List table records dynamically, this Notion page saved, LLM calls (local Kimi?) for every task created. Counterbalance Note somewhere at the bottom where based on algorithm it suggests a task to do today that can help Re-Bal (rebalance).

---

#### YouTube wrapper/Timeline Open
- **Status**: Not started
- **Menu**: Content
- **Phase**: GS Site Standing
- **Components**: Button
- **Third Party**: YouTube 3rd P
- **Description**: Drop URL in for Transcript analysis. Track Screentime in MINE & Apple screentime or yt plugin.

---

#### 2. Random Daily Contact
- **Status**: Not started
- **Menu**: Real Estate, Software, Health
- **Phase**: GS Site Standing
- **Components**: Button
- **Third Party**: Apple
- **Description**: For this, we need Access to Apple contacts. Use motion primitives 'Typewriter' component.

---

#### Call my Questioning Agent: Daniel Park
- **Status**: Not started
- **Menu**: Software
- **Phase**: GS Site Standing
- **Components**: Button, Logic
- **Third Party**: Logic, EXTRA LOGIC
- **Description**: Upon a call with an agent, A unique Menu. For Daniel Park, Menu: "Hello? This is Daniel."
  1. Want to hear my thoughts on the codebase with the most critical gaps?
  2. Can I get some clarity on goals for your codebases?

---

#### ~~Select Github Repo dropdown~~ [HIDDEN]
- **Status**: HIDDEN - Removed from dashboard
- **Menu**: Software
- **Phase**: GS Site Standing
- **Components**: Button, Logic
- **Third Party**: Logic, EXTRA LOGIC, GitHub
- **Description**: ~~Needs to on a timer scrape/understand GitHub repositories for odgsully account.~~

---

#### Datadog
- **Status**: Not started
- **Menu**: Software
- **Phase**: GS Site Standing
- **Components**: Button
- **Third Party**: Datadog
- **Description**: *(no subtitle)*

---

#### Forms completed this week Count
- **Status**: Not started
- **Menu**: Org
- **Phase**: GS Site Standing
- **Components**: Logic, Graphic
- **Third Party**: Google
- **Description**: Count all Google Forms for given week starting on Sunday AM. Ending Sat night. Much same logic as Forms streak tile record.

---

#### Jarvis_Briefme report
- **Status**: Not started
- **Menu**: Learn
- **Phase**: GS Site Standing
- **Components**: Button
- **Third Party**: Logic
- **Description**: Pull in Jarvis_briefme repository & instead of having an output everyday in gmail drafts, put them in Supabase & store in gs site new pdf subpage.

---

#### Cali Task List DONE
- **Status**: Not started
- **Menu**: Org
- **Phase**: GS Site Standing
- **Components**: Button
- **Third Party**: Wabbit, Notion
- **Description**: Wabbit Rankings this week Count /out of Total or threshold of GRADES [A,B+,B,B-,C+, C]. This includes tiles for most productive:
  1. Time of Day
  2. Days
  3. Category
  4. Specific task item for previous week (highest rank)

---

#### Clean iCloud folder structure graphic
- **Status**: Not started
- **Menu**: Org
- **Phase**: GS Site Standing
- **Components**: Graphic, Button, Logic
- **Third Party**: Logic, EXTRA LOGIC
- **Description**: Permissions to view & COUNT unplaced folders for main. Those in !!, those in BHRF. Dropdown style underneath the Main count Graphics detailing which files. BHRF The following are 'typical': Desktop The following are 'typical': BHRF, AUTOMATE, !!, every cc [copy], thinorswim. AUTOMATE The following are 'typical': consult, Directory Logic, IndyDevDan, Research, STOCK, Vibe Code.

---

#### Forms (quarterly) & printoff
- **Status**: Not started
- **Menu**: Org
- **Phase**: GS Site Standing
- **Components**: Form, Logic
- **Third Party**: Logic
- **Description**: Forms Quarterly Make+Track KPIs. Create a pdf report with all KPI's.

---

#### ~~Habitat Pic check~~ [HIDDEN]
- **Status**: HIDDEN - Removed from dashboard
- **Menu**: Org, Health
- **Phase**: Evening
- **Components**: Dropzone
- **Third Party**: Logic
- **Description**: ~~Photo upload for environment pictures.~~

---

#### Morning Form
- **Status**: Not started
- **Menu**: Org
- **Phase**: Morning
- **Components**: Pop-up
- **Third Party**: Logic, EXTRA LOGIC
- **Description**: This form must be completed prior to any ability to get to GS Site Standing.
  1. Notion Habits -> AM Weight
  2. Record 45 second AM prompted vid. i.e. Goals, yday review. ABILITY TO OPEN CAMERA app. or record & output to Supabase. Or local folder.

---

#### GS Site Admin view Gear Button
- **Status**: Not started
- **Menu**: Org
- **Phase**: GS Site Standing
- **Components**: Button
- **Third Party**: Logic
- **Description**: Gear button able to go to separate page of GS Site. For those with values in SETTINGS column, have these backend settings available. It's variables, description, etc should be in the Admin view where it can be changed & saved.

---

#### Accountability Report send-off to Circle
- **Status**: Not started
- **Menu**: Org
- **Phase**: GS Site Standing
- **Components**: Calendar & Date Picker
- **Third Party**: Logic, Scheduler 3rd P, Twilio
- **Description**: Every month, circle gets a report via their email on progress. If they had access to a little gif/comment library to send back, that would be awesome.

---

#### Notion Habits STREAKS
- **Status**: Not started
- **Menu**: Health, Org
- **Phase**: GS Site Standing
- **Components**: Graphic, Logic
- **Third Party**: Notion
- **Description**: Notion database inline 'Habits' from 'Habits' page actually has consistency where it uses COUNT the table for days in a row (not yet counting the current day) 1 day offset.

---

### Priority 2 Tiles (Important)

#### 5. Create Eating Challenges
- **Status**: Not started
- **Menu**: Health, Content
- **Phase**: GS Site Standing
- **Components**: Graphic, Logic
- **Third Party**: Logic, EXTRA LOGIC
- **Description**: Create a recipe with ingredients that are in my Inventory. Inventory create by documenting all from MyFitnessPal.

---

#### Physically print WEEKLIES workflow trigger
- **Status**: Not started
- **Menu**: Org
- **Phase**: GS Site Standing
- **Components**: Button
- **Third Party**: Brother Printer
- **Description**: Button that will automate ordering the Brother 0DW print of a designated WEEKLIES pdf. Exporting from Notion into local Files.

---

#### New GS Wab; auto-sign into main Wab
- **Status**: Not started
- **Menu**: Software
- **Phase**: GS Site Standing
- **Components**: Button
- **Third Party**: Wabbit
- **Description**: Link to wabbit site new wab.

---

#### Go to my Wabbit
- **Status**: Not started
- **Menu**: Software
- **Phase**: GS Site Standing
- **Components**: Button
- **Third Party**: Wabbit
- **Description**: Link to wabbit site home.

---

#### Codebase Duolingo
- **Status**: Not started
- **Menu**: Software, Org
- **Phase**: GS Site Standing
- **Components**: Logic
- **Third Party**: GitHub, Logic, EXTRA LOGIC
- **Description**: *(no subtitle)*

---

#### 3. Socials stats
- **Status**: Not started
- **Menu**: Content
- **Phase**: GS Site Standing
- **Components**: Graphic
- **Third Party**: Scheduler 3rd P
- **Description**: YouTube videos & Shorts posted. X (both accounts) stats such as Tweets sent. Instagram posts sent. Instagram stories sent.

---

#### Days since bloodwork done Counter
- **Status**: Not started
- **Menu**: Health
- **Phase**: GS Site Standing
- **Components**: Logic
- **Third Party**: Logic
- **Description**: Preview Days since count of Date of 2/28/2025. Upon click, Link to page that contains:
  1. Contains general health information on me. Autobiographical... picky, workout frequency, medications nil
  2. Report of diet, report of Workout habits, whoop, etc

---

#### Claude Code MAX plan usage
- **Status**: Not started
- **Menu**: Software
- **Phase**: GS Site Standing
- **Components**: Logic
- **Third Party**: Logic
- **Description**: Ability to view/scrape within the Max plan automated? Or can I do it/call it with OpenRouter or does it need to be Anthropic API key use?

---

#### Annual Github Commits count
- **Status**: In progress
- **Menu**: Software
- **Phase**: GS Site Standing
- **Components**: Logic
- **Third Party**: GitHub
- **Description**: For (both odgsully & odgsully-agent), use GitHub API or otherwise to count across codebases all commits for both accounts.

---

#### RealtyOne KPI's calculator
- **Status**: Not started
- **Menu**: Real Estate
- **Phase**: GS Site Standing
- **Components**: Graphic
- **Third Party**: Logic
- **Description**: Tile area with multiple text boxes that can edit & dynamically modify other boxes. Excel esque.
  1. Assumptions dollar amount text boxes for: Annual Commission, and that adjusts ABS's, listings needed to hit, average commission, closed volume needed, closed volume, closed avg sales price, transactions needed (total vs. per month), budgeted expenses.
  How many listings you need to hit your goal if...

---

#### odgsully Github repos
- **Status**: Not started
- **Menu**: Software
- **Phase**: GS Site Standing
- **Components**: Button
- **Third Party**: GitHub
- **Description**: Link to GitHub repos.

---

#### Task List Wabbed %
- **Status**: Not started
- **Menu**: Org
- **Phase**: GS Site Standing
- **Components**: Graphic, Logic
- **Third Party**: Wabbit, Notion
- **Description**: Toggle switch between 1. This weeks & 2. this months Task list Wab percent completed.

---

### Priority 3 Tiles (Nice to Have)

#### 10. RealtyOne Events button
- **Status**: In progress
- **Menu**: Real Estate
- **Phase**: GS Site Standing
- **Components**: Button
- **Third Party**: Notion
- **Description**: Button to Notion URL for RealtyOne Events.

---

#### 6. Create Health tracker chart
- **Status**: Not started
- **Menu**: Org, Health
- **Phase**: GS Site Standing
- **Components**: Graphic
- **Third Party**: Whoop, EXTRA LOGIC
- **Description**: 2 Week chart with x-axis as dates (short format) & certain toggles for Weight (line chart), Mood, HR up chart (y-axis has max of 2 meaning 2 times that day).

---

#### LLM Arena
- **Status**: Not started
- **Menu**: Software
- **Phase**: GS Site Standing
- **Components**: Button
- **Third Party**: -
- **Description**: *(no subtitle)*

---

#### Physically print tomorrow DAILY UI trigger
- **Status**: Not started
- **Menu**: Org
- **Phase**: GS Site Standing
- **Components**: Button
- **Third Party**: Brother Printer
- **Description**: Button that will automate ordering the Brother 0DW print of a designated DAILY pdf.

---

#### Y-Combinator invites
- **Status**: Not started
- **Menu**: Learn
- **Phase**: GS Site Standing
- **Components**: Logic, Graphic
- **Third Party**: Logic
- **Description**: Scrape YC with login permissions (Browserbase?). or Playwright script out of 20 invites remaining on. "0/20"=green "20/20"=red.
- **Implementation Note**: Weekly reset on Saturday night. State persisted in localStorage with `lastResetAt` tracking.

---

#### Memento Morri
- **Status**: Not started
- **Menu**: Health
- **Phase**: GS Site Standing
- **Components**: Button
- **Third Party**: Logic, EXTRA LOGIC
- **Description**: Create a simple Memento Morri referencing template of Life in Weeks.png. This should be completed in modern shadcn style. Weeks expected to live, 50 years. Every time it's opened up -> Long trail animation from Motion-Primitives that circle perimeter of weeks boxes since last time this page was opened.

---

### No Priority Set

#### GS-clients Admin Dash page
- **Status**: Not started
- **Menu**: Real Estate, Software
- **Phase**: GS Site Standing
- **Components**: Button
- **Third Party**: GS Site Realty
- **Description**: Link to gsrealty-client site.

---

#### Audio Agent Admin
- **Status**: Not started
- **Menu**: Org, Software
- **Phase**: GS Site Standing
- **Components**: Button
- **Third Party**: Logic, Twilio, EXTRA LOGIC
- **Description**: *(no subtitle)*

---

#### Cali Forward look
- **Status**: Not started
- **Menu**: (none)
- **Phase**: (none)
- **Components**: (none)
- **Third Party**: Notion, Wabbit
- **Description**: Fetching from not done Task List & Never Ending To Do. We want to rank tasks from this table via Wabbit to GIVE ADDITIONAL CONTEXT for creating Calendar Suggestions.

---

#### Emails sent
- **Status**: Not started
- **Menu**: (none)
- **Phase**: (none)
- **Components**: (none)
- **Third Party**: Logic, Apple, Google
- **Description**: Count from all gbsullivan@mac.com and gbsullivan6@gmail.com.

---

#### Habit Insights
- **Status**: Not started
- **Menu**: (none)
- **Phase**: (none)
- **Components**: Graphic
- **Third Party**: Notion
- **Description**: Goal here is to give insights into Habits coming from the Habits database in Notion and Supabase, this includes tiles for:
  1. Streak Count... Slideshow corner click for motivation with the images from /youcandoit/
  2. % summary of each
  3. Weight (lbs) & Body fat % Graph, should have buttons for 2w, 1m, 3m, 6m

---

## Implementation Status by Component Type

### Buttons (Simple Links)
| Tile | Status | Target |
|------|--------|--------|
| Go to my Wabbit | Not started | wabbit-re home |
| New GS Wab | Not started | wabbit-re new wab |
| GS-clients Admin | Not started | gsrealty-client admin |
| Jump to Wab: Task List | Not started | Wabbit task ranking |
| LLM Arena | Not started | lmarena.ai |
| odgsully Github repos | Not started | github.com/odgsully |
| Datadog | Not started | Datadog dashboard |
| RealtyOne Events | In progress | Notion page |

### Graphics (Data Visualization)
| Tile | Status | Data Source |
|------|--------|-------------|
| Notion Habits STREAKS | Not started | Notion Habits DB |
| Task List Wabbed % | Not started | Notion + Wabbit |
| Forms Streak | Not started | Google Forms |
| Time Spent pie charts | Not started | Notion Task List |
| Health tracker chart | Not started | Whoop API |
| Space Ad Countdown | Not started | Static date (04/14/2026) |
| Y-Combinator invites | Not started | localStorage (weekly reset) |

### Forms (User Input)
| Tile | Status | Backend |
|------|--------|---------|
| Morning Form | Not started | Notion + Supabase |
| Forms (monthly) | Not started | PDF generation |
| Forms (quarterly) | Not started | PDF generation |

### Logic (Complex Backend)
| Tile | Status | Integrations |
|------|--------|--------------|
| Natural SQL query UI | Not started | Supabase, LLM |
| Whoop Insights | Not started | Whoop API |
| Claude Code usage | Not started | Anthropic API? |
| Codebase Duolingo | Not started | GitHub API |
| Random Daily Contact | Not started | Apple Contacts |

---

## Phase System

| Phase | Description | Tile Count |
|-------|-------------|------------|
| **GS Site Standing** | Always visible, main dashboard | 44 |
| **Morning** | Must complete before accessing Standing | 1 |
| **Evening** | Evening check-in tiles | 1 |
| **Unassigned** | No phase set | 1 |

---

## Environment Variables Required

```bash
# Notion Integration
NOTION_API_KEY=secret_xxx
NOTION_HABITS_DATABASE_ID=xxx
NOTION_TASKS_DATABASE_ID=xxx
NOTION_TILES_DATABASE_ID=28fcf08f-4499-8017-b530-ff06c9f64f97

# External APIs
WHOOP_CLIENT_ID=xxx
WHOOP_CLIENT_SECRET=xxx
GITHUB_TOKEN=xxx
GOOGLE_FORMS_API_KEY=xxx

# Cross-App Integration
WABBIT_RE_URL=http://localhost:3000
GSREALTY_URL=http://localhost:3004
WABBIT_URL=http://localhost:3002
```

---

## Sync History

| Date | Action | Notes |
|------|--------|-------|
| 2025-12-23 | Full sync from Notion | 47 tiles, all fields captured |
| 2025-12-22 | Initial creation | Based on Notion page structure |

---

## How to Update This File

1. **Manual updates**: Edit directly when implementing tile logic
2. **Notion sync**: Run `npm run sync-tiles` for tile definitions only
3. **Full resync**: Use Claude Code to fetch from Notion API and regenerate

**Remember**: This file is the source of truth. Notion is secondary.
