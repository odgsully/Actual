# Wabbit - Glossary of Terms

> Canonical definitions for the Wabbit product vocabulary.

---

## Product Terms

| Term | Definition |
|------|-----------|
| **Wabbit** | The product — a gesture-driven ranking/scoring tool with async collaboration for AI-generated content |
| **Wabb** | A single project/collection; a set of records to be ranked by one or more users |
| **Record** | An individual item within a Wabb (could be an image, video, text output, design asset, etc.) |
| **Ranking** | A single user's numeric score (0.0–10.0) for a given record |
| **RAVG** | Ranked Average — the weighted average score across all rankers for a record, factoring in collaborator weights and permissions |
| **Collaborator** | A user who has access to a Wabb; has a role that determines their permissions |
| **Leaderboard** | Records within a Wabb ordered by their RAVG score, showing consensus ranking |
| **Folder** | User-created organizational container in the sidebar file system. Two-level hierarchy: Folders > Wabbs. Wabbs without a folder appear in an "Unfiled" section |

## Roles

| Role | Permissions |
|------|------------|
| **Owner** | Full CRUD on collection, records, collaborators. Rankings count toward RAVG. |
| **Contributor** | Can add records and submit rankings. Rankings count toward RAVG. |
| **Viewer** | Can view records and rankings. Cannot score or add records. |

## Ranking Modes

| Mode | Description |
|------|-------------|
| **1-axis** | Simple 0–10 slider/gesture scoring. Default mode. |
| **2-axis** | Category-based scoring — swiping to corners tags a type/quality dimension. Per-Wabb toggle. |
| **Quaternary** | 4-option multiple choice (A/B/C/D) — qualitative polling mode for categorical decisions rather than numeric scoring. Labels are configurable per-Wabb. Changing a Quaternary label triggers a Branched Wabb with user confirmation prompt. Per-Wabb toggle. |
| **Binary** | Yes/No — simple binary approval/rejection. Per-Wabb toggle. |
| **Timeline Rank** | SoundCloud-esque ranking at specific timestamps within video/audio content. Future mode (Phase 4+). |

## Project Lifecycle Terms

| Term | Definition |
|------|-----------|
| **Wabb Time Window** | Sprint-based lifecycle for a Wabb's record generation period. Closing a window locks that sprint's generation but rankings remain visible and referenceable. Can be reopened as "Window 2", "Window 3", etc. Optional — Wabbs can be set to **No Expiration** to disable windowing entirely. |
| **Branched Wabb** | An offshoot of a Wabb created when a project evolves past its original outline. Rankings do NOT carry over — always starts fresh. A branching menu with smart defaults lets users select what to bring over: Asset Library and Display Features are pre-checked; Team assignments, Context Docs/SOPs, Agent Optimization Level, and Notification Preferences are unchecked by default. Changing a Quaternary label also triggers a Branch (with user confirmation prompt). |
| **Wabb Proposal** | A request from a Contributor to an Owner for a new or Branched Wabb |
| **Wabb Path** | Pipeline view from creation through to post/end result. Shows all document references (assets, SOP, project goal, overview, etc.) |
| **Wabb Timeline** | View of all users and supervisors active on a project and their activity over time |
| **Vetted Ref** | A Wabb type centered around a proven end result (the "vet"). The Wabb is structured around replicating and recycling aspects of that reference — generating variations inspired by what already worked |

## Content & Asset Terms

| Term | Definition |
|------|-----------|
| **Asset Library** | Central repository of all loaded and saved assets across Wabbs |
| **Rank History Gallery** | All records assigned to a user — both voted and unvoted — for quantitative polls |
| **ALL EVER Table** | Raw overall database view of all client's records across all Wabbs and windows |

## Scoring Terms

| Term | Definition |
|------|-----------|
| **RAVG** | Ranked Average — default: simple arithmetic mean of all ranker scores (Contributor+ roles). Customizable per-Wabb at creation or in Settings: choose from predefined formulas (weighted by role, exclude outliers, etc.) and/or assign granular per-member weight multipliers |
| **Super RAVG** | RAVG that additionally incorporates the Owner's score at a separate weight. The owner is excluded from the level 1 team RAVG; their score is applied as level 2 with a separately configurable supervisor weight. (In the database, this is the collection owner. "Supervisor" refers to the level 2 weighting concept, not a separate role.) |

## Agent Terms

| Term | Definition |
|------|-----------|
| **Agent Optimization Level** | Per-Wabb setting controlling how autonomous the AI agent operates. Four levels: **No** (disabled), **Low** (always asks Owner), **Medium** (makes obvious decisions without asking — recommended), **High** (fully autonomous optimization). Phase 1: UI settings toggle only; agent logic wired up in later phases. |

## Interaction Terms

| Term | Definition |
|------|-----------|
| **Quick Score** | Single tap = automatic 5.0 score and submit (iOS gesture) |
| **Drag Score** | Tap and drag vertically to set score; up = higher, down = lower (iOS gesture) |
| **4corners** | Mobile concept where swiping a tile to each corner tags a different category |

## Business Terms

| Term | Definition |
|------|-----------|
| **B2IC** | Business to Intrapreneurial Consumers — tech-forward employees at larger companies |
| **B2EC** | Business to Entrepreneurial Consumers — solopreneurs, small biz owners, individual creators |
| **B2B** | Business to Business — marketing agencies integrating Wabbit into client workflows |
| **HIL** | Human in the Loop — the core thesis: AI generates, humans curate via ranking |
| **HRR** | Hit Record & Roll — spontaneous, fast content creation approach |
| **P2P** | Plan to Perfection — methodical, storyboarded content creation approach |
| **GS Wabb** | A Wabbit micro-app / feasibility study circuit with Wabbit promotion built in |
| **ESPN3** | "ESPN Top Three" format — engaging social media content format showcasing Wabbit use cases |
| **Crowd Coffee** | Micro-transaction unit — incentive for template sharing and Wabb invite participation (potentially crypto-tied) |
| **Work Displacement Maximization** | Pricing philosophy — charge based on value of time saved and productivity gained |

## Technical Terms

| Term | Definition |
|------|-----------|
| **SPA** | Single Page Application — the browser loads one HTML page, then JavaScript handles all navigation and rendering. No full page reloads. The Wabbit ranking app is a SPA because it's behind auth (no SEO/SSR needed). |
| **SSR** | Server-Side Rendering — the server builds HTML for each page request. Used for SEO. Wabbit does NOT use SSR for the ranking app — the Astro landing page handles SEO instead. |
| **GEO** | Generative Engine Optimization — optimizing content so AI models (Perplexity, ChatGPT search, Google AI Overviews) cite and reference your product. Requires clean HTML in page source, Schema.org markup, semantic structure. |
| **Collection** | Database-level synonym for Wabb (the `collections` table) |
| **Folder** | Database-level organizational container (the `folders` table). Two-level hierarchy: Folders > Wabbs. Wabbs without a folder appear in "Unfiled" section. |
| **Metadata (JSONB)** | Flexible key-value field on records for content-type-specific data (source URL, dimensions, model used, layer data, chapter markers, etc.) |
| **Upsert** | Insert-or-update pattern — ensures one ranking per user per record |
| **RLS** | Row Level Security — Supabase/Postgres policy system scoping data access to collaborators |
| **Edge Function** | Supabase serverless function (Deno runtime). Used for agent API endpoints, Slack webhooks, and custom server logic. Replaces the need for framework API routes. |
| **PostgREST** | Supabase's auto-generated REST API for all database tables. Respects RLS policies. Used by agents and MCP server to access Wabbit data. |
| **React Island** | Astro pattern: a React component that hydrates on an otherwise static HTML page. Used on the landing page for interactive demos without shipping a full JS framework. |
| **Ralph Wiggum Loop** | Automated Claude Code development loop: `while :; do cat PROMPT.md \| claude-code ; done` |
| **TAC** | Think-Act-Check — hybrid development pass methodology |

## Stack References

| Term | What It Is |
|------|-----------|
| **Vite** | Build tool for the ranking SPA. Fast dev server, instant HMR, outputs static files. No Node.js server needed in production. |
| **Astro** | Framework for the landing page. Outputs static HTML for SEO/GEO. React islands for interactivity. |
| **Zustand** | Lightweight React state management. Three stores: `useRankingStore`, `useSidebarStore`, `useLayoutStore`. |
| **React Router** | Client-side routing for the SPA. Routes like `/wabb/:id`, `/settings`, `/leaderboard`. |
| **@dnd-kit** | Drag and drop library for folder tree reorganization in the sidebar. |
| **vite-plugin-pwa** | PWA plugin for service worker, Web Push notifications, offline capability, install prompt. |
| **OpenClaw** | Open-source AI agent framework. Runs locally. Wabbit skills let agents rank content, query Wabbs, and route notifications via WhatsApp/Telegram/Slack. |
| **MCP** | Model Context Protocol. Wabbit exposes data as MCP tools so AI assistants (Claude Code, etc.) can interact programmatically. Standalone package, not part of the web app. |

## Platform References

| Term | What It Is |
|------|-----------|
| **Wabbit RE** | Wabbit Real Estate — the existing `apps/wabbit-re` property ranking app at wabbit-rank.ai |
| **Wabbit (classic)** | The non-real-estate Wabbit app — this product (content ranking for marketing/creative teams) |
| **4corners** | Proposed domain/mobile concept: 4corners.rocks or 4corners.it.com |
| **unicorn.studio** | UI design inspiration reference |
