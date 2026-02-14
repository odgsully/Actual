# Wabbit - Build Tasks

> Synced from Notion "Wabbit Build! Tasks" database on 2026-02-11.

---

## Task Board

### UI

| Task | Status | Notes |
|------|--------|-------|
| Wabb settings: toggle 1-axis, 2-axis, Quaternary (A/B/C/D), Binary (Yes/No) — save for all of Wabb | Not started | NEEDS symmetry with mobile click experience. No 3-axis. |
| Quaternary mode UI — 4-option A/B/C/D selector with configurable labels | Not started | Owner can customize option labels per-Wabb. Changing a label triggers a Branch with confirmation prompt. |
| Binary mode UI — Yes/No approval/rejection interface | Not started | |
| Agent Optimization Level toggle (No/Low/Medium/High) in Wabb settings | Not started | Phase 1: UI toggle only, agent logic wired later |
| Wabb type selector (Standard / Vetted Ref) on New Wabb form | Not started | Vetted Ref = replicate aspects of proven end result |
| Wabb Time Window settings (duration or No Expiration) on New Wabb form | Not started | Sprint-based; previous window rankings stay visible |
| Branching Menu UI — carry-over selection with smart defaults | Not started | Smart defaults: Asset Library + Display Features pre-checked; Team, Context Docs/SOPs, Agent Optimization Level, Notifications unchecked. Includes confirmation prompt ("This change will create a Branch — proceed?"). Rankings never carry over. |
| RAVG customization — formula picker + per-member weights | Not started | Default: simple mean. Predefined formulas (weighted by role, exclude outliers, etc.) + granular per-member weight multipliers. Configurable at Wabb creation and in Settings. |
| Super RAVG — separately configurable supervisor weight | Not started | Supervisor weight is independently configurable from team RAVG formula/weights |
| Quaternary label change → Branch trigger with confirmation | Not started | System detects label change, prompts "This change will create a Branch — proceed?", auto-triggers branching flow |
| Basic video player with chapter markers | Not started | Lightweight player for video records. Not Timeline Rank (Phase 4+) |
| Read-only layer visibility viewer for design comps | Not started | Toggle layer visibility, no manipulation |
| Web app right side controls — low opacity, glass esque (ref: gsrealty-client) | Not started | Glassmorphism design system |
| Landing page (Astro): react-3d-slider template | Not started | Reference: v0.app/templates/react-3d-slider-5zQj43dFZEa. Astro static site with React islands. |
| Landing page (Astro): arc-images template | Not started | Reference: v0.app/templates/arc-images-RS4IgaEabFu |
| Landing page (Astro): Schema.org JSON-LD + sitemap + meta tags for SEO/GEO | Not started | Maximize AI crawler visibility (Perplexity, Google AI Overviews, ChatGPT search) |
| unicorn.studio reference | Not started | Design inspiration from X/Twitter |

### Auth

| Task | Status | Notes |
|------|--------|-------|
| GitHub Auth | Not started | OAuth integration via Supabase |
| Google Auth | Not started | OAuth integration via Supabase |

### MCP / API

| Task | Status | Notes |
|------|--------|-------|
| Full API buildout docs | Not started | Tags: MCP, API |
| MCP alignment comparable to Notion | Not started | Tags: MCP |

### First Passes

| Task | Status | Notes |
|------|--------|-------|
| Ralph Wiggum pass | Not started | Automated `while :; do cat PROMPT.md \| claude-code ; done` loop |
| Hybrid TAC pass | Not started | Think-Act-Check development methodology |

---

## Build Order (Recommended)

Based on the Notion page's stated order of operations and dependencies:

### Wave 1: Foundation
1. **Database schema** — Apply `ref/schema.sql` to new Supabase project (separate from gs-site). Includes `folders`, `collections`, `records`, `rankings`, `collaborators` tables + enums + views + RLS + triggers.
2. **Auth setup** — Google + GitHub OAuth via Supabase
3. **Web app scaffold** — Vite 6 + React 18 + TypeScript + React Router 7 + Tailwind 4 + Zustand. Three stores: `useRankingStore`, `useSidebarStore`, `useLayoutStore`. Supabase client SDK + Realtime. React Hook Form + Zod. `@dnd-kit/core` for sidebar drag. `vite-plugin-pwa` for service worker + Web Push.
3b. **Landing page scaffold** — Astro 5 + Tailwind + `@astrojs/sitemap`. Schema.org JSON-LD layouts. React islands for interactive demos.

### Wave 2: Core Ranking
4. **Collection CRUD** — Create/read/update Wabbs (including Branched Wabbs via parent_collection_id)
5. **Record management** — Add records to collections (manual + API), window_number tracking
6. **Ranking flow** — 1-axis (score 0-10), 2-axis, Quaternary (A/B/C/D choice), Binary (Yes/No), upsert, navigation, leaderboard view
7. **New Wabb form** — Output type, Wabb type (standard/Vetted Ref), ranking mode (1-axis/2-axis/Quaternary/Binary), collaboration, Agent Optimization Level (UI toggle), Wabb Time Window (duration or No Expiration), API source

### Wave 3: UI Polish
8. **Glassmorphism styling** — Reference gsrealty-client design system
9. **Landing page (Astro)** — 3D slider / arc-images templates, Schema.org JSON-LD, semantic HTML for GEO
10. **Three-column layout** — Sidebar (280px, two-level folder tree with search/filters/sort, color-coded progress dots) | Main Content (record display + ranking controls, settings gear → popup) | Context Panel (320px, collapsed by default: RAVG, team progress, Wabb stats)

### Wave 4: Collaboration
11. **Collaborator invites** — Owner invites users, role assignment
12. **RAVG calculation** — Default: simple mean. Predefined formulas (weighted by role, exclude outliers, etc.) + granular per-member weight multipliers. Configurable at Wabb creation and in Settings.
13. **Super RAVG** — Supervisor weight separately configurable from team RAVG weights
14. **User progress tracking** — Completion % per collaborator
15. **Branching flow** — Branching menu with smart defaults (Asset Library + Display Features pre-checked; Team, Context Docs/SOPs, Agent Optimization Level, Notifications unchecked). Quaternary label change auto-triggers Branch with confirmation. Rankings never carry over.

### Wave 5: Integrations & Agent Layer
16. **Agent API** — Supabase Edge Functions for agent endpoints (events, actions, API key auth). NOT in the web framework — agents are parallel Supabase consumers.
17. **MCP server** — Standalone `packages/mcp-server/` exposing Wabbit data as MCP tools (query collections, submit rankings, read leaderboards). See OPENCLAW_WABBIT_ARCHITECTURE.md.
18. **OpenClaw skill pack** — `packages/openclaw-skills/` with Wabbit skills (search Wabbs, rank records, get digest). Subscribes to Supabase Realtime directly.
19. **Slack app** — Notifications + interactive ranking via Supabase Edge Functions
20. **API docs** — Full endpoint documentation

---

## Notion Source Links

- **Wabbit Build!** — https://www.notion.so/2d7cf08f44998006a97cc7b784d979e2
- **Wabbit Build! Tasks DB** — https://www.notion.so/2d7cf08f4499804aaff3ffd75227c8b2
- **Business Plan** — https://www.notion.so/29ecf08f449980e2b2a1c0519a843bdf
- **Features** — https://www.notion.so/255cf08f449980739ffec4caaeefb25d
- **Integrations** — https://www.notion.so/239cf08f44998024bbfbf9f7a2673448
- **GS Wabbs** — https://www.notion.so/265cf08f449980ef994ef9eee1f137fc
- **Rapid Prototyping** — https://www.notion.so/2f6cf08f44998003be95e3bffe7f1490
