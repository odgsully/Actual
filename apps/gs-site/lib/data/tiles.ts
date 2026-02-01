/**
 * Local tile definitions - all tiles are now stored locally.
 *
 * Notion is used only for DATA (habits values, task values), NOT for tile definitions.
 * This file is the source of truth for tile structure.
 * Dynamic data (streaks, counts) is fetched per-tile at runtime.
 *
 * Last consolidated: 2026-01-11
 *
 * EXCLUSIONS APPLIED AT MERGE TIME (Layer 1):
 * - 2cecf08f-4499-805a-ad9b-ed3ba40ea4d9 (Habitat Pic check)
 * - 2aacf08f-4499-80ec-8f5d-dcbefbc44878 (Select Github Repo dropdown)
 *
 * NAME OVERRIDES APPLIED:
 * - "RealtyOne Events button" → "RE Events"
 * - "LLM Arena" → "LLM Benchmarks"
 * - "AI Agent workforce admin board" → "Audio Agent Admin"
 * - "Link to Datadog Dash" → "Datadog"
 */
import type { Tile } from '@/lib/types/tiles';

/**
 * DEPRECATED: All tiles are now in LOCAL_TILES.
 * Do NOT use STATIC_TILES - it's empty and will cause bugs.
 * Kept for backwards compatibility with any code that references it.
 */
export const STATIC_TILES: Tile[] = [];

/**
 * All tile definitions - consolidated from former STATIC_TILES and LOCAL_TILES.
 * This is now the single source of truth for all tile definitions.
 */
export const LOCAL_TILES: Tile[] = [
  {
    "id": "local-myfitnesspal",
    "name": "MyFitnessPal",
    "menu": [
      "Health"
    ],
    "status": "In progress",
    "desc": "Track daily nutrition, calories, and macros from MyFitnessPal data exports.",
    "shadcn": [
      "Graphic",
      "Logic"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [
      "MyFitnessPal"
    ],
    "actionWarning": false,
    "actionDesc": null,
    "priority": "1",
    "typeII": "Metric"
  },
  {
    "id": "local-call-log",
    "name": "Call Log",
    "menu": [
      "Org"
    ],
    "status": "In progress",
    "desc": "Track inbound/outbound calls from Verizon or iPhone call log screenshots.",
    "shadcn": [
      "Graphic",
      "Dropzone"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [
      "Logic"
    ],
    "actionWarning": false,
    "actionDesc": null,
    "priority": "2",
    "typeII": "Metric"
  },
  {
    "id": "local-inbody",
    "name": "InBody",
    "menu": [
      "Health"
    ],
    "status": "Not started",
    "desc": "Body composition data from InBody scans - muscle mass, body fat %, water weight.",
    "shadcn": [
      "Graphic",
      "Logic"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [
      "InBody"
    ],
    "actionWarning": true,
    "actionDesc": "InBody disconnected",
    "priority": "2",
    "typeII": "Metric"
  },
  {
    "id": "local-word-of-month",
    "name": "Word of Month",
    "menu": [
      "Org"
    ],
    "status": "Done",
    "desc": "Monthly focus word to guide intentions and priorities.",
    "shadcn": [
      "Graphic"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [],
    "actionWarning": false,
    "actionDesc": null,
    "priority": "3",
    "typeII": "Metric"
  },
  {
    "id": "local-lifx",
    "name": "LIFX Lights",
    "menu": [
      "Org"
    ],
    "status": "Done",
    "desc": "Smart lighting control for LIFX bulbs - power, brightness, color, scenes.",
    "shadcn": [
      "Graphic",
      "Logic"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [
      "LIFX"
    ],
    "actionWarning": false,
    "actionDesc": null,
    "priority": "2",
    "typeII": "Metric"
  },
  {
    "id": "local-goals",
    "name": "Goals",
    "menu": [
      "Org"
    ],
    "status": "Done",
    "desc": "2026 goals tracker with checkable items organized by category.",
    "shadcn": [
      "Graphic",
      "Logic"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [],
    "actionWarning": false,
    "actionDesc": null,
    "priority": "1",
    "typeII": "Metric"
  },
  {
    "id": "local-printoffs-kpis",
    "name": "Printoffs & KPIs",
    "menu": [
      "Org"
    ],
    "status": "In progress",
    "desc": "Consolidated tile for all printoff triggers and KPI reports.",
    "shadcn": [
      "Graphic",
      "Logic"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [
      "Brother Printer"
    ],
    "actionWarning": false,
    "actionDesc": null,
    "priority": "2",
    "typeII": "Metric"
  },
  {
    "id": "local-form-timing",
    "name": "Days Left",
    "menu": [
      "Org"
    ],
    "status": "Not started",
    "desc": "Days until next Monthly and Quarterly form deadlines.",
    "shadcn": [
      "Graphic",
      "Logic"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [
      "Logic"
    ],
    "actionWarning": false,
    "actionDesc": null,
    "priority": "1",
    "typeII": "Metric"
  },
  {
    "id": "local-habit-detail",
    "name": "Habit Detail",
    "menu": [
      "Health",
      "Org"
    ],
    "status": "Not started",
    "desc": "Per-habit streak counts, 7-day dots, and 2026 completion percentage.",
    "shadcn": [
      "Graphic",
      "Logic",
      "Chart"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [
      "Notion"
    ],
    "actionWarning": false,
    "actionDesc": null,
    "priority": "1",
    "typeII": "Metric"
  },
  {
    "id": "local-photo-slideshow",
    "name": "Photo Slideshow",
    "menu": [
      "Content",
      "Org"
    ],
    "status": "Not started",
    "desc": "Personal photo slideshow with category filters: Grub Villain, Family, Friends, Habitat, Dogs, Quotes, Inspo, LinkedIn.",
    "shadcn": [
      "Graphic",
      "Logic"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [],
    "actionWarning": false,
    "actionDesc": null,
    "priority": "2",
    "typeII": "Metric"
  },
  {
    "id": "local-budget",
    "name": "Budget",
    "menu": [
      "Org"
    ],
    "status": "Not started",
    "desc": "Personal budget tracking - monthly spending vs budget with categories.",
    "shadcn": [
      "Graphic",
      "Logic",
      "Form"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [],
    "actionWarning": false,
    "actionDesc": null,
    "priority": "2",
    "typeII": "Metric"
  },
  {
    "id": "local-core-habits",
    "name": "Core Habits",
    "menu": [
      "Health",
      "Org"
    ],
    "status": "In progress",
    "desc": "Daily core habits checklist - AM/PM routines, exercise, meditation.",
    "shadcn": [
      "Graphic",
      "Logic"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [
      "Notion"
    ],
    "actionWarning": false,
    "actionDesc": null,
    "priority": "1",
    "typeII": "Metric"
  },
  {
    "id": "28fcf08f-4499-8001-9919-cc014edf3fd6",
    "name": "EPSN3 Bin",
    "menu": [
      "Content"
    ],
    "status": "Not started",
    "desc": "upload/choose file button",
    "shadcn": [
      "React plugin",
      "Dropzone",
      "Chart"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [],
    "actionWarning": true,
    "actionDesc": "Frequency not being met",
    "priority": "1",
    "typeII": "Dropzone"
  },
  {
    "id": "28fcf08f-4499-8008-a952-fe7d8291a383",
    "name": "RE Events",
    "menu": [
      "Real Estate"
    ],
    "status": "In progress",
    "desc": "",
    "shadcn": [
      "Button"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [
      "Notion"
    ],
    "actionWarning": true,
    "actionDesc": "Notion dissconnected",
    "priority": "3",
    "typeII": "Button"
  },
  {
    "id": "28fcf08f-4499-800b-9b9c-c4eae6784d62",
    "name": "Panel for Days Till… Space Ad MUST SHOOT",
    "menu": [
      "Org",
      "Content"
    ],
    "status": "Done",
    "desc": "Count of days till 04/14/2026.",
    "shadcn": [
      "Graphic",
      "Logic"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [
      "Logic"
    ],
    "actionWarning": false,
    "actionDesc": null,
    "priority": "1",
    "typeII": "Metric"
  },
  {
    "id": "28fcf08f-4499-8020-9e93-fdc05c3f858b",
    "name": "Forms (monthly) & printoff",
    "menu": [
      "Org"
    ],
    "status": "Not started",
    "desc": "Monthly Make+Track KPIs\n\nCreate a pdf report with all KPI's…",
    "shadcn": [
      "Form",
      "Logic"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [
      "Logic"
    ],
    "actionWarning": false,
    "actionDesc": null,
    "priority": "1",
    "typeII": "Form"
  },
  {
    "id": "28fcf08f-4499-8039-a853-c6b044981548",
    "name": "Create Eating Challenges",
    "menu": [
      "Health",
      "Content"
    ],
    "status": "Not started",
    "desc": "Create a recipe with ingrediants that are in my Inventory\n\nInventory create by documenting all from ...",
    "shadcn": [
      "Graphic",
      "Logic"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [
      "Logic",
      "EXTRA LOGIC"
    ],
    "actionWarning": false,
    "actionDesc": null,
    "priority": "2",
    "typeII": "Metric"
  },
  {
    "id": "28fcf08f-4499-804d-8853-f103d70d0156",
    "name": "Whoop API Insights Dash",
    "menu": [
      "Org",
      "Health"
    ],
    "status": "In progress",
    "desc": "Background logic to \n1. Actually Request from Whoop site on a timer.\n2. Filter through \n3.",
    "shadcn": [
      "Graphic",
      "Logic"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [
      "Whoop",
      "EXTRA LOGIC"
    ],
    "actionWarning": true,
    "actionDesc": "Whoop disconnected",
    "priority": "1",
    "typeII": "Metric"
  },
  {
    "id": "28fcf08f-4499-8058-b6ff-e87d14381392",
    "name": "Physically print WEEKLIES workflow trigger",
    "menu": [
      "Org"
    ],
    "status": "Not started",
    "desc": "Button that will automate ordering the Brother 0DW print of a designated WEEKLIES pdf.\n\nExporting fr...",
    "shadcn": [
      "Button",
      "Chart"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [
      "Brother Printer"
    ],
    "actionWarning": true,
    "actionDesc": "Broken Link Brother\nBroken Link Mac Studio",
    "priority": "2",
    "typeII": "Graph"
  },
  {
    "id": "28fcf08f-4499-806e-8923-c77e5e2688ec",
    "name": "Forms Streak",
    "menu": [
      "Org",
      "Health"
    ],
    "status": "Done",
    "desc": "If Minimum 2x/day Form submitted, this counts as a day of Forms created streak. \n\nThis tile is popul...",
    "shadcn": [
      "Graphic",
      "Logic",
      "Chart"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [
      "Logic"
    ],
    "actionWarning": false,
    "actionDesc": null,
    "priority": "1",
    "typeII": "Metric"
  },
  {
    "id": "28fcf08f-4499-8087-b120-e84e02c3b9ec",
    "name": "Jump to Wab: Task List Value",
    "menu": [
      "Software"
    ],
    "status": "Not started",
    "desc": "Button to jump to this Link:",
    "shadcn": [
      "Button"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [
      "Wabbit"
    ],
    "actionWarning": false,
    "actionDesc": null,
    "priority": "1",
    "typeII": "Button"
  },
  {
    "id": "28fcf08f-4499-808c-a5fe-e3923b9a5721",
    "name": "GS-clients Admin Dash page",
    "menu": [
      "Real Estate",
      "Software"
    ],
    "status": "Not started",
    "desc": "Link to gsrealty-client site",
    "shadcn": [
      "Button"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [
      "GS Site Realty"
    ],
    "actionWarning": false,
    "actionDesc": null,
    "priority": null,
    "typeII": "Button"
  },
  {
    "id": "28fcf08f-4499-80ad-92ca-dd14cea1e8b0",
    "name": "New GS Wab; auto-sign into main Wab",
    "menu": [
      "Software"
    ],
    "status": "Not started",
    "desc": "Link to wabbit site new wab:",
    "shadcn": [
      "Button"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [
      "Wabbit"
    ],
    "actionWarning": false,
    "actionDesc": null,
    "priority": "2",
    "typeII": "Button"
  },
  {
    "id": "28fcf08f-4499-80ad-b900-f629182fc49a",
    "name": "Create Health tracker chart",
    "menu": [
      "Org",
      "Health"
    ],
    "status": "In progress",
    "desc": "2 Week chart with x-axis as dates (short format) & certain toggles for Weight (line chart), Mood, HR...",
    "shadcn": [
      "Graphic",
      "Chart"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [
      "Whoop",
      "EXTRA LOGIC"
    ],
    "actionWarning": true,
    "actionDesc": "Whoop disconnected",
    "priority": "3",
    "typeII": "Graph"
  },
  {
    "id": "28fcf08f-4499-80b4-b33b-cc152f6c03f6",
    "name": "GS socials Scheduler",
    "menu": [
      "Content"
    ],
    "status": "Not started",
    "desc": "Calendar view with what posts scheduled to come out\n\nLink with reocurring Task List Notion \n\nGraphic...",
    "shadcn": [
      "Calendar & Date Picker",
      "Graphic",
      "Chart"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [
      "Scheduler 3rd P"
    ],
    "actionWarning": true,
    "actionDesc": "Scheduler disconnected",
    "priority": "1",
    "typeII": "Calendar"
  },
  {
    "id": "28fcf08f-4499-80bf-941a-fc4af26e91d7",
    "name": "Prev day, prev week Time Spent pie charts:",
    "menu": [
      "Org"
    ],
    "status": "In progress",
    "desc": "Have a Time Allocation dropdown where you can click to dropdown these two pie chart. \n\nCategorize No...",
    "shadcn": [
      "Graphic",
      "Logic"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [
      "Notion"
    ],
    "actionWarning": true,
    "actionDesc": "Local model dissconnected",
    "priority": "1",
    "typeII": "Metric"
  },
  {
    "id": "28fcf08f-4499-80c0-ab94-eae40920112f",
    "name": "YouTube wrapper/Timeline Open",
    "menu": [
      "Content"
    ],
    "status": "Not started",
    "desc": ">  &! yt drop URL in for Transcript analysis\n\nTrack Screentime in MINE\n&\nApple screentime or yt plug...",
    "shadcn": [
      "Button"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [
      "YouTube 3rd P"
    ],
    "actionWarning": true,
    "actionDesc": "Youtube 3rd P disconnected",
    "priority": "1",
    "typeII": "Button"
  },
  {
    "id": "28fcf08f-4499-80c7-9a66-ef4d44b3ee5a",
    "name": "Go to my Wabbit",
    "menu": [
      "Software"
    ],
    "status": "Not started",
    "desc": "Link to wabbit site home:",
    "shadcn": [
      "Button"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [
      "Wabbit"
    ],
    "actionWarning": false,
    "actionDesc": null,
    "priority": "2",
    "typeII": "Button"
  },
  {
    "id": "28fcf08f-4499-80ca-83ba-c9817b2e5938",
    "name": "LLM Benchmarks",
    "menu": [
      "Software"
    ],
    "status": "Not started",
    "desc": "",
    "shadcn": [
      "Button"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [],
    "actionWarning": true,
    "actionDesc": "Link not found.",
    "priority": "3",
    "typeII": "Button"
  },
  {
    "id": "28fcf08f-4499-80cf-a77c-f20c4a4dc9b3",
    "name": "Random Daily Contact.",
    "menu": [
      "Real Estate",
      "Software",
      "Health"
    ],
    "status": "Not started",
    "desc": "For this, we need Access to Apple contacts.\n\nUse motion primitives. 'Typewriter' component",
    "shadcn": [
      "Button",
      "Chart"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [
      "Apple"
    ],
    "actionWarning": true,
    "actionDesc": "Apple Contacts disconnected",
    "priority": "1",
    "typeII": "Graph"
  },
  {
    "id": "28fcf08f-4499-80d6-ad09-f924db307996",
    "name": "Physically print tomorrow DAILY UI trigger",
    "menu": [
      "Org"
    ],
    "status": "Not started",
    "desc": "Button that will automate ordering the Brother 0DW print of a designated DAILY pdf",
    "shadcn": [
      "Button",
      "Chart"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [
      "Brother Printer"
    ],
    "actionWarning": true,
    "actionDesc": "Brother disconnected\nMac Studio disconnected",
    "priority": "3",
    "typeII": "Graph"
  },
  {
    "id": "28fcf08f-4499-80e4-b63f-d4e0b3bbe0fb",
    "name": "Codebase Duolingo",
    "menu": [
      "Software",
      "Org"
    ],
    "status": "Not started",
    "desc": "",
    "shadcn": [
      "Logic"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [
      "GitHub",
      "Logic",
      "EXTRA LOGIC"
    ],
    "actionWarning": false,
    "actionDesc": null,
    "priority": "2",
    "typeII": "Logic"
  },
  {
    "id": "28fcf08f-4499-80e7-b635-c8f06d418de0",
    "name": "Socials stats",
    "menu": [
      "Content"
    ],
    "status": "Not started",
    "desc": "YouTube videos & Shorts posted\n\nX (both accounts) stats such as Tweets sent\n\nInstagram posts sent\n\nI...",
    "shadcn": [
      "Graphic",
      "Chart"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [
      "Scheduler 3rd P"
    ],
    "actionWarning": true,
    "actionDesc": "Instagram disconnected\nX disconnected\nYoutube disconnected",
    "priority": "2",
    "typeII": "Graph"
  },
  {
    "id": "2a8cf08f-4499-804f-8fe2-d8760b31d800",
    "name": "Call my Questioning Agent: Daniel Park",
    "menu": [
      "Software"
    ],
    "status": "Not started",
    "desc": "Upon a call with an agent, A unique Menu.\n\nFor Daniel Park,\nMenu:\n\"Hello? This is Daniel.\"\n\n1. Want ...",
    "shadcn": [
      "Button",
      "Logic",
      "Chart"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [
      "Logic",
      "EXTRA LOGIC"
    ],
    "actionWarning": false,
    "actionDesc": null,
    "priority": "1",
    "typeII": "Metric"
  },
  {
    "id": "2abcf08f-4499-8068-a6e7-fc49d9a41a08",
    "name": "Datadog",
    "menu": [
      "Software"
    ],
    "status": "Not started",
    "desc": "",
    "shadcn": [
      "Button"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [
      "Datadog"
    ],
    "actionWarning": false,
    "actionDesc": null,
    "priority": "1",
    "typeII": "Button"
  },
  {
    "id": "2b4cf08f-4499-8014-85f6-fff9ab241d4a",
    "name": "Y-Combinator invites",
    "menu": [
      "Learn"
    ],
    "status": "Done",
    "desc": "Scrape YC with login permissions (Browserbase?). or Playwright script\nout of 20 invites remaining on...",
    "shadcn": [
      "Logic",
      "Graphic",
      "Chart"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [
      "Logic"
    ],
    "actionWarning": false,
    "actionDesc": null,
    "priority": "3",
    "typeII": "Metric"
  },
  {
    "id": "2b4cf08f-4499-80b2-a92b-ca092bdb8eed",
    "name": "Days since bloodwork done Counter",
    "menu": [
      "Health"
    ],
    "status": "Done",
    "desc": "Preview Days since count of Date of 2/28/2025.\n\nUpon click, Link to page that contains\n\n1. Contains ...",
    "shadcn": [
      "Logic"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [
      "Logic"
    ],
    "actionWarning": false,
    "actionDesc": null,
    "priority": "2",
    "typeII": "Logic"
  },
  {
    "id": "2c4cf08f-4499-8095-8473-f5e761eeb665",
    "name": "Claude Code MAX plan usage",
    "menu": [
      "Software"
    ],
    "status": "Not started",
    "desc": "Ability to view/scrape within the Max plan automated?\n\nOr can I do it/call it with OpenRouter or doe...",
    "shadcn": [
      "Logic",
      "Chart"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [
      "Logic"
    ],
    "actionWarning": false,
    "actionDesc": null,
    "priority": "2",
    "typeII": "Metric"
  },
  {
    "id": "2c4cf08f-4499-80df-942e-dc86c02501df",
    "name": "Annual Github Commits count",
    "menu": [
      "Software"
    ],
    "status": "Done",
    "desc": "For  (both odgsully & odgsully-agent), use GitHub API or otherwise to count across codebases all com...",
    "shadcn": [
      "Logic",
      "Chart"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [
      "GitHub"
    ],
    "actionWarning": false,
    "actionDesc": null,
    "priority": "2",
    "typeII": "Metric"
  },
  {
    "id": "2c5cf08f-4499-8055-b5b8-d38ef417e4ec",
    "name": "Forms completed this week Count",
    "menu": [
      "Org"
    ],
    "status": "Not started",
    "desc": "Count all Google Forms for given week starting on Sunday AM. Ending Sat night.\n\nMuch same logic as F...",
    "shadcn": [
      "Logic",
      "Graphic",
      "Chart"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [],
    "actionWarning": false,
    "actionDesc": null,
    "priority": "1",
    "typeII": "Metric"
  },
  {
    "id": "2c5cf08f-4499-80aa-9952-ccf4df1a7d34",
    "name": "RE KPI's & Calc",
    "menu": [
      "Real Estate"
    ],
    "status": "In progress",
    "desc": "Tile area with multiple text boxes that can edit & dynamically modify other boxes. Excel esque.\n\n1. ...",
    "shadcn": [
      "Graphic"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [
      "Logic"
    ],
    "actionWarning": false,
    "actionDesc": null,
    "priority": "2",
    "typeII": "Graph"
  },
  {
    "id": "2c5cf08f-4499-80bd-9665-d65d26ac7bc5",
    "name": "Jarvis_Briefme report",
    "menu": [
      "Learn"
    ],
    "status": "Not started",
    "desc": "Pull in Jarvis_briefme repository & instead of having an output everyday in gmail drafts, put them i...",
    "shadcn": [
      "Button",
      "Chart"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [
      "Logic"
    ],
    "actionWarning": false,
    "actionDesc": null,
    "priority": "1",
    "typeII": "Graph"
  },
  {
    "id": "2c5cf08f-4499-80e8-a932-fd7ddb183f7f",
    "name": "Cali Task List DONE",
    "menu": [
      "Org"
    ],
    "status": "In progress",
    "desc": "Wabbit Rankings this week Count /out of Total or threshold of GRADES [A,B+,B,B-,C+, C]\n\nThis include...",
    "shadcn": [
      "Button",
      "Chart"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [
      "Wabbit",
      "Notion"
    ],
    "actionWarning": true,
    "actionDesc": "Notion dissconnected",
    "priority": "1",
    "typeII": "Graph"
  },
  {
    "id": "2c9cf08f-4499-800a-9a6a-ed2859d023e9",
    "name": "Clean iCloud folder structure graphic",
    "menu": [
      "Org"
    ],
    "status": "Not started",
    "desc": "Permissions to view & COUNT unplaced folders for main….  those in ‼️, those in BHRF\n\nDropdown style ...",
    "shadcn": [
      "Graphic",
      "Button",
      "Logic"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [
      "Logic",
      "EXTRA LOGIC"
    ],
    "actionWarning": true,
    "actionDesc": "iCloud disconnected",
    "priority": "1",
    "typeII": "Metric"
  },
  {
    "id": "2cecf08f-4499-8001-8df6-db3ad27d914b",
    "name": "Forms (quarterly) & printoff",
    "menu": [
      "Org"
    ],
    "status": "Not started",
    "desc": "Forms Quarterly Make+Track KPIs\n\nCreate a pdf report with all KPI's…",
    "shadcn": [
      "Form",
      "Logic"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [
      "Logic"
    ],
    "actionWarning": false,
    "actionDesc": null,
    "priority": "1",
    "typeII": "Form"
  },
  {
    "id": "2cecf08f-4499-8005-b7aa-ec1eb12abdb0",
    "name": "Audio Agent Admin",
    "menu": [
      "Org",
      "Software"
    ],
    "status": "Not started",
    "desc": "",
    "shadcn": [
      "Button"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [
      "Logic",
      "Twilio",
      "EXTRA LOGIC"
    ],
    "actionWarning": false,
    "actionDesc": null,
    "priority": null,
    "typeII": "Button"
  },
  {
    "id": "2cecf08f-4499-8051-be4d-d5605fdea6a1",
    "name": "odgsully Github repos",
    "menu": [
      "Software"
    ],
    "status": "Done",
    "desc": "Link",
    "shadcn": [
      "Button"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [
      "GitHub"
    ],
    "actionWarning": false,
    "actionDesc": null,
    "priority": "2",
    "typeII": "Button"
  },
  {
    "id": "2cecf08f-4499-8082-acff-d23a1e45f27f",
    "name": "Morning Form",
    "menu": [
      "Org"
    ],
    "status": "In progress",
    "desc": "This form must be completed prior to any ability to get to GS Site Standing. \n\n1. Notion Habits → AM...",
    "shadcn": [
      "Pop-up",
      "Chart"
    ],
    "phase": [
      "Morning"
    ],
    "thirdParty": [
      "Logic",
      "EXTRA LOGIC"
    ],
    "actionWarning": false,
    "actionDesc": null,
    "priority": "1",
    "typeII": "Form"
  },
  {
    "id": "2cecf08f-4499-8087-a384-cc48e79c18d1",
    "name": "GS Site Admin view Gear Button",
    "menu": [
      "Org"
    ],
    "status": "In progress",
    "desc": "Gear button able to go to seperate page of GS Site.\n\nFor those with values in SETTINGS column, have ...",
    "shadcn": [
      "Button"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [
      "Logic"
    ],
    "actionWarning": false,
    "actionDesc": null,
    "priority": "1",
    "typeII": "Button"
  },
  {
    "id": "2cecf08f-4499-808b-94a1-ecd055408be7",
    "name": "Accountability Report send-off to Circle",
    "menu": [
      "Org"
    ],
    "status": "Not started",
    "desc": "Every month, circle gets a report via their email on progress. \n\nIf they had access to a little gif/...",
    "shadcn": [
      "Calendar & Date Picker"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [
      "Logic",
      "Scheduler 3rd P",
      "Twilio"
    ],
    "actionWarning": false,
    "actionDesc": null,
    "priority": "1",
    "typeII": "Calendar"
  },
  {
    "id": "2cecf08f-4499-8093-af13-ee7599ca65ac",
    "name": "Notion Habits STREAKS",
    "menu": [
      "Health",
      "Org"
    ],
    "status": "In progress",
    "desc": "Notion database inline 'Habits' from 'Habits' page actually has consistancy where it uses COUNT the ...",
    "shadcn": [
      "Graphic",
      "Logic",
      "Chart"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [
      "Notion"
    ],
    "actionWarning": true,
    "actionDesc": "Notion dissconnected",
    "priority": "1",
    "typeII": "Metric"
  },
  {
    "id": "2cecf08f-4499-80d1-b02f-e3fe58a3adaf",
    "name": "Task List Wabbed %",
    "menu": [
      "Org"
    ],
    "status": "Not started",
    "desc": "Toggle switch between 1. This weeks & 2. this months \nTask list Wab percent completed.",
    "shadcn": [
      "Graphic",
      "Logic",
      "Chart"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [
      "Wabbit",
      "Notion"
    ],
    "actionWarning": true,
    "actionDesc": "Notion disconnected",
    "priority": "2",
    "typeII": "Metric"
  },
  {
    "id": "2cecf08f-4499-80da-bb12-f94dbe9ff327",
    "name": "Memento Morri",
    "menu": [
      "Health"
    ],
    "status": "In progress",
    "desc": "Create a simple Memento Morri referencing template of Life in Weeks.png\nThis should be completed in ...",
    "shadcn": [
      "Button"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [
      "Logic",
      "EXTRA LOGIC"
    ],
    "actionWarning": false,
    "actionDesc": null,
    "priority": "3",
    "typeII": "Button"
  },
  {
    "id": "2d1cf08f-4499-807a-a551-fce8a145260f",
    "name": "Cali Forward look",
    "menu": [],
    "status": "In progress",
    "desc": "1. Fetching from not done Task List & Never Ending To Do \n\nWe want to rank tasks from this table via...",
    "shadcn": [],
    "phase": [],
    "thirdParty": [
      "Notion",
      "Wabbit"
    ],
    "actionWarning": true,
    "actionDesc": "Notion discconected",
    "priority": null,
    "typeII": null
  },
  {
    "id": "2d1cf08f-4499-80c8-a7ee-cd9bf69aac80",
    "name": "Emails sent",
    "menu": [],
    "status": "In progress",
    "desc": "Count from all  gbsullivan@mac.com  and gbsullivan6@gmail.com",
    "shadcn": [
      "Chart"
    ],
    "phase": [],
    "thirdParty": [
      "Logic",
      "Apple",
      "Google"
    ],
    "actionWarning": true,
    "actionDesc": "Google disconnected\nMac disconnected",
    "priority": null,
    "typeII": "Graph"
  },
  {
    "id": "2d1cf08f-4499-80e2-9380-cc16c4a892b5",
    "name": "Habit Insights",
    "menu": [],
    "status": "Not started",
    "desc": "1. Goal here is to give insights into Habits coming from the Habits database in Notion and Supabase,...",
    "shadcn": [
      "Graphic"
    ],
    "phase": [],
    "thirdParty": [
      "Notion"
    ],
    "actionWarning": true,
    "actionDesc": "Notion disconnected",
    "priority": null,
    "typeII": "Graph"
  },
  {
    "id": "local-data-qa",
    "name": "Data Q&A",
    "menu": [
      "Org",
      "Software"
    ],
    "status": "In progress",
    "desc": "Ask natural language questions about your data. Converts to SQL and displays results from Supabase.",
    "shadcn": [
      "Logic",
      "Graphic"
    ],
    "phase": [
      "GS Site Standing"
    ],
    "thirdParty": [
      "OpenAI",
      "Logic"
    ],
    "actionWarning": false,
    "actionDesc": null,
    "priority": "1",
    "typeII": "Logic"
  }
];

export default LOCAL_TILES;

/**
 * Get tile count by category
 * Uses LOCAL_TILES (all tiles are now local)
 */
export function getTileCountsByCategory(): Record<string, number> {
  const counts: Record<string, number> = { ALL: LOCAL_TILES.length };

  for (const tile of LOCAL_TILES) {
    for (const category of tile.menu) {
      counts[category] = (counts[category] || 0) + 1;
    }
  }

  return counts;
}

/**
 * Get tiles by phase
 * Uses LOCAL_TILES (all tiles are now local)
 */
export function getTilesByPhase(phase: string): Tile[] {
  return LOCAL_TILES.filter(tile => tile.phase.includes(phase as any));
}

/**
 * @deprecated Use getTilesByPhase instead
 */
export function getStaticTilesByPhase(phase: string): Tile[] {
  return getTilesByPhase(phase);
}

/**
 * Get tiles with warnings
 * Uses LOCAL_TILES (all tiles are now local)
 */
export function getWarningTiles(): Tile[] {
  return LOCAL_TILES.filter(tile => tile.actionWarning);
}

/**
 * @deprecated Use getWarningTiles instead
 */
export function getStaticWarningTiles(): Tile[] {
  return getWarningTiles();
}
