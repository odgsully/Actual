# GS Site Integration Summary

## Source
- **Notion Page**: "GS SITE MAPPED/ INTEGRATE all codebases"
- **Page ID**: `26fcf08f-4499-80e7-9514-da5905461e73`
- **URL**: https://www.notion.so/GS-SITE-MAPPED-INTEGRATE-all-codebases-26fcf08f449980e79514da5905461e73
- **Last Edited**: December 14, 2025
- **Retrieved**: December 19, 2025

---

## Overview

GS Site is a personal dashboard hub accessible at `wabbit-rank.ai/gs-site-home`. The site should be "Caffeinated for all-time ON screen" - always visible and actively monitored.

### Key Objective
Create a unified dashboard that integrates data from:
- Supabase (Wabbit Task List)
- Notion databases (Habits, Calendar)
- External APIs (Whoop, YouTube, X/Twitter, Apple Contacts)

---

## I. Cali & Habit Insights

### A. Calendar Insights
Fetch from Supabase Wabbit for Task List (rank 0-3) calendar productivity rank. Tiles for most productive:

1. **Time of Day** - Best productivity hours
2. **Days** - Most productive days of the week
3. **Category** - Productivity by task category
4. **Specific Task Item** - Highest rank tasks from previous week

### B. Habit Insights
Insights from Habits database (Notion + Supabase):

1. **Streak Count** - With motivational slideshow (images from `/youcandoit/`)
2. **% Summary** - Percentage completion for each habit
3. **Weight & Body Fat Graph** - With time range buttons: 2w, 1m, 3m, 6m

---

## II. Other Tiles (Complete Database - 44 Records)

### Health & Fitness
- **Whoop API Insights Dash** - Health/fitness dashboard from Whoop API
- **Days since bloodwork done Counter** - Track time since last bloodwork
- **Create Eating Challenges** - Food challenge tracker
- **Create tracker chart** - General tracking visualization

### Productivity & Task Management
- **Cali Task List to do Rankings this week Count** - Count /out of Total or threshold of GRADES [A,B+,B,B-,C+]
- **Forms completed this week Count** - Weekly form completion tracking
- **Forms Streak** - Track form completion streaks (Minimum 2x/day)
- **Forms Monthly Make+Track KPIs / Forms Quarterly Make+Track KPIs** - Accountability category
- **Prev day, prev week Time Spent pie chart** - Time Allocation dropdown with two pie charts. Counterbalance Note at bottom with Re-Balance suggestions
- **Some sort of once a 2week poll** - Asks what kind of phase the last week & upcoming week feels like

### Quick Links & Navigation
- **CRM/ADHS; Link** - Link to CRM dashboard
- **New GS Wab; auto-sign into main Wab; Link** - Auto-sign into main Wabbit
- **Jump to Wab: Task List (rank 0-3)** - Quick access to task ranking
- **Jump to Wab:** - Generic Wabbit jump link
- **Go to my Wabbit; Link** - Personal Wabbit link
- **Open House To-Do form** - Real estate form (Status: In Progress)

### Workflow Triggers
- **Physically print tomorrow DAILY UI trigger; Link** - Daily workflow print trigger
- **Physically print WEEKLIES workflow trigger; Link** - Weekly workflow print trigger

### Content & Media
- **EPSN3 Bin; upload/choose file button** - File upload functionality
- **GS socials Scheduler; calendar view with what posts scheduled** - Social media scheduling
- **YouTube wrapper/Timeline Open> &! yt drop URL in for Transcript analysis** - YouTube integration with transcript analysis
- **Socials stats; YouTube & X (both accounts) stats** - Social media statistics

### Developer Tools
- **/prime-cc improvements on any given codebase** - Also update jarvis_briefme. Duolingo 3-minute style multiple choice for Best Practices. Optional BRANCH→ TEST → new TEST result in new file. Give ID to Supabase for reference in next attempt/cycle
- **/tools custom-command random for various any given codebase** - Also a Duolingo style matching and definition review of codebase tools
- **LLM Arena link/preview?** - LLM comparison integration
- **Natural SQL language query UI for all databases toggle** - Natural language SQL queries (Data category)
- **GitHub API? search for Arizona related public repos** - Future could be a lookup
- **Github Commits count Annual (both odgsully & odgsully-agent)** - Annual commit counter
- **Claude Code usage MAX plan usage. Token OpenRouter usage** - API usage monitoring

### AI & Agents
- **Call my Questioning Agent** - Invoke questioning agent
- **Call any of my Personality Agents** - Invoke personality agents
- **Call tree Launch** - Interactive UI IF/THEN, train Agents to marginally deviate to improve
- **Jarvis_Briefme report Button** - URL highlight & transcribe read. Connected to whisper or Google - ask it questions

### Business & Real Estate
- **RealtyOne KPI's calculator formula vibe** - Edit Assumptions for Annual Commission, adjusts ABSs, listings needed, average commission, closed volume needed, closed volume, closed avg sales price, transactions needed (total vs. per month), budgeted expenses, listings needed to hit goal at 80% close rate
- **Random Daily Contact; Access to Apple contacts** - Contact outreach randomizer
- **Panel for Days Till… Space Ad MUST SHOOT** - Countdown timer

### Infrastructure & DevOps
- **MIGRATE from GS site at directory** - `/Users/garrettsullivan/Desktop/AUTOMATE/Vibe Code/GS Site`. Button to bring to GS-clients Admin Dash page
- **Notion & Github ADW Workflow for designated device Jump to Button** - This is IDP
- **IDP Homebase Button** - Health of all tests, scrapers & other pipelines/codebases
- **Permissions to view & COUNT unplaced folders for main** - Those in ❗❗, those in BHRF
- **Main dots style for Recurring important tasks** - Like TECH SORT 7

### Metrics & Counters
- **out of 20 invites remaining on Y-Combinator** - "0/20"=green "20/20"=red

### UI Resources
- **UI LIBRARIES** - Kokonut UI, StyleUI, CultUI, Motion-primitives, Prompt-kit

---

## III. Site Style

### A. Style Guidelines
- Use `site-ref` folder assets:
  - `grid.png`
  - `gradient.png`
  - `grain.png`
- Layout inspiration: https://ui.shadcn.com/ (style, not necessarily the tool)

### B. Top of Site
- Dashboard with header section
- Nice title "GS" with `signature.png` file

---

## Additional Context

### Related Notion Databases
- **GS site** - Main site database
- **Other Tiles** - Tile configuration database (44 records)
- **GS Wabs** - Wabbit-related items with domains (3D, Text, Image, Video, UI, Gif, Audio)
- **Site Walk Schedule** - Contact scheduling with Role/Trade tags

### AI Opportunity Assessment
- 10-20 page document planned
- Value-Added Reseller Agreement (tool provider)
- DemandGen integration
- AI that learns investment thesis

### TODOs from Notion
- [ ] Start new repo and directory for client GS Site

---

## Technical Implementation Notes

### Data Sources
1. **Supabase** - Primary backend for Wabbit data
2. **Notion API** - Habits, Calendar, Task databases
3. **External APIs**:
   - Whoop (fitness data)
   - YouTube API (channel stats)
   - X/Twitter API (social stats)
   - Apple Contacts (contact randomizer)
   - GitHub API (repo search, commit counts)
   - OpenRouter (token usage)
   - Claude Code API (usage monitoring)

### Integration Pattern
```
Notion Databases -> Supabase Sync -> GS Site Dashboard
                                   -> Wabbit Apps
```

### Current Tech Stack (apps/gs-site)
- Next.js 14
- Tailwind CSS
- Notion API integration (existing `/api/notion` endpoint)
- Health check endpoint (`/api/health`)

---

## Files Referenced
- `signature.png` - Header signature image
- `grid.png`, `gradient.png`, `grain.png` - Background textures (in `site-ref` folder)
- `/youcandoit/` - Motivational images for streak celebrations
