# Wabbit - Technical Architecture

> Synthesized from Opus4.6 prototype files, Notion build notes, v2MONETIZATION.md, and v2BUILD_PLAN.md.
>
> **Sources of Truth:**
> - `v2MONETIZATION.md` — Monetization strategy, tier definitions, agent-first onboarding
> - `v2BUILD_PLAN.md` — Master build document (Waves 0–7)
> - `ref/docs/PRD.md` — Product requirements
> - `ref/docs/GLOSSARY.md` — Canonical terminology

---

## System Diagram

```
                    ┌──────────────────────┐
                    │     Supabase         │
                    │  ┌────────────────┐  │
                    │  │  PostgreSQL DB  │  │
                    │  │  + RLS Policies │  │
                    │  └────────────────┘  │
                    │  ┌────────────────┐  │
                    │  │  Auth (GoTrue)  │  │
                    │  └────────────────┘  │
                    │  ┌────────────────┐  │
                    │  │ Edge Functions  │  │
                    │  │ (Agent API,    │  │
                    │  │  Stripe hooks, │  │
                    │  │  usage meter)  │  │
                    │  └────────────────┘  │
                    │  ┌────────────────┐  │
                    │  │   Realtime WS   │  │
                    │  └────────────────┘  │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼──────────────────┐
              │                │                  │
     ┌────────▼──────┐  ┌─────▼──────┐  ┌───────▼───────┐
     │   Web App     │  │  iOS App   │  │  Slack App    │
     │  Vite+React   │  │  SwiftUI   │  │  Edge Fns     │
     │  SPA          │  │  + UIKit   │  │  + Slack API  │
     │  Tailwind     │  │  Gestures  │  │               │
     │  Zustand      │  │  Haptics   │  │               │
     └───────┬───────┘  └────────────┘  └───────────────┘
             │
     ┌───────▼───────┐        ┌──────────────────┐
     │  Landing Page │        │  Agent Layer      │
     │  Astro static │        │  OpenClaw + MCP   │
     │  SEO/GEO      │        │  (parallel        │
     │  React Islands│        │   Supabase        │
     └───────────────┘        │   consumers)      │
                              └──────────────────┘
```

All five consumer layers (Web App, iOS App, Slack App, Landing Page, Agent Layer) connect to Supabase. The Agent Layer is also a **distribution channel** — agents proactively create Wabbs and send magic links to onboard humans. See `v2MONETIZATION.md` §6.

---

## Project Structure (Target)

```
wabbit/
├── ref/                   # Reference materials (this folder)
│   ├── README.md          # Original Opus4.6 architecture overview
│   ├── schema.sql         # Reference database schema
│   ├── page.tsx           # Reference web page component
│   ├── RankingGestureView.swift  # Reference iOS gesture view
│   ├── files.zip          # Archived prototype files
│   └── docs/              # Synthesized documentation (you are here)
│       ├── PRD.md
│       ├── ARCHITECTURE.md
│       ├── INTEGRATIONS.md
│       ├── GLOSSARY.md
│       └── TASKS.md
├── supabase/              # Database schema, migrations, edge functions
│   └── schema.sql         # Core tables + RLS policies
├── web/                   # Vite + React SPA (ranking app — behind auth)
│   └── src/
│       ├── pages/         # Client-side routes (react-router)
│       ├── components/    # React components
│       │   ├── RankingSlider.tsx
│       │   └── RecordCard.tsx
│       ├── lib/           # Supabase clients, Zustand store
│       └── types/         # TypeScript types (generated from Supabase)
├── landing/               # Astro static site (SEO/GEO-optimized marketing page)
│   └── src/
│       ├── pages/         # Astro pages (static HTML output)
│       ├── components/    # Astro + React island components
│       └── layouts/       # Page layouts with Schema.org JSON-LD
├── packages/
│   ├── mcp-server/        # MCP server (proprietary npm pkg, Wave 5)
│   │   └── src/tools/     # 3 high-level + 7 granular MCP tools
│   └── openclaw-skills/   # OpenClaw skill pack (6 skills, Wave 5)
├── ios/                   # Native iOS application (Phase 2, free at all tiers)
│   └── Wabbit/
│       ├── Views/         # SwiftUI views
│       ├── Gestures/      # UIKit gesture recognizer bridge
│       │   └── RankingGestureView.swift
│       ├── Models/        # Data models
│       └── Services/      # Supabase SDK integration
└── slack/                 # Slack app integration (Team+ tier)
    └── functions/         # Edge functions for Slack events
```

---

## Database Schema

### Entity Relationship

```
profiles (1) ──── (*) folders
                      │
                 (1)  │ (optional)
                      │
profiles (1) ──── (*) collaborators (*) ──── (1) collections
                                                    │
                                               (1)  │
                                                    │
                                               (*) records
                                                    │
                                               (1)  │
                                                    │
profiles (1) ──── (*) rankings (*) ────────── (1) records
```

### Tables

#### `profiles`
Extends Supabase Auth. Auto-created on signup via trigger.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | References auth.users |
| display_name | text | Defaults to email |
| avatar_url | text | From OAuth provider |
| subscription_tier | text | `free`, `pro`, `team`, `business`. Default `free`. (Wave 7) |
| stripe_customer_id | text | Stripe customer ID. Nullable. (Wave 7) |
| stripe_subscription_id | text | Stripe subscription ID. Nullable. (Wave 7) |
| subscription_status | text | `active`, `past_due`, `canceled`, `trialing`. Default `active`. (Wave 7) |
| created_at | timestamptz | |
| updated_at | timestamptz | Auto-updated via trigger |

#### `folders`
User-created organizational containers for the sidebar file system. Two-level hierarchy: Folders > Wabbs.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| owner_id | UUID (FK → profiles) | |
| name | text | Required |
| sort_order | integer | Default 0 |
| created_at | timestamptz | |
| updated_at | timestamptz | Auto-updated via trigger |

#### `collections` (Wabbs)
A project/set of records to be ranked.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| owner_id | UUID (FK → profiles) | |
| folder_id | UUID (FK → folders) | NULL = Unfiled |
| title | text | Required |
| description | text | |
| output_type | enum | `image`, `video`, `text`, `3d`, `audio`, `deck` — determines content type; used for sidebar filtering |
| wab_type | enum | `standard`, `vetted_ref` — Vetted Ref Wabbs are centered around replicating aspects of a proven end result |
| ranking_mode | enum | `one_axis`, `two_axis`, `quaternary`, `binary` — determines the scoring UI |
| quaternary_labels | JSONB | Custom labels for A/B/C/D options when ranking_mode = quaternary. Default: `{"a":"A","b":"B","c":"C","d":"D"}`. Labels are configurable per-Wabb; changing a label triggers a Branched Wabb with user confirmation. |
| agent_optimization_level | enum | `none`, `low`, `medium`, `high` — Default `none`. Phase 1: stored but not wired to agent logic |
| ravg_formula | enum | `simple_mean`, `weighted_by_role`, `exclude_outliers`, `custom` — Default `simple_mean`. Determines how RAVG is calculated for this Wabb |
| ravg_member_weights | JSONB | Per-member weight multipliers. Default: `{}` (empty = equal weight). Format: `{"user_id": 1.5, ...}`. Used when ravg_formula = `custom` or in combination with predefined formulas |
| supervisor_weight | numeric(3,1) | Supervisor/Owner weight multiplier for Super RAVG calculation. Default `1.0`. Separately configurable from team RAVG weights |
| window_duration | interval | Duration per Wabb Time Window (sprint). NULL = No Expiration (windowing disabled) |
| current_window | integer | Current window number. Default 1. NULL if windowing disabled |
| is_active | boolean | Default true |
| parent_collection_id | UUID (FK → collections) | NULL unless this is a Branched Wabb |
| branch_carry_over | JSONB | What was carried over from parent when branching. NULL unless this is a Branched Wabb. Format: `{"asset_library": true, "display_features": true, "team": false, "context_docs": false, "agent_optimization": false, "notifications": false}` |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### `records`
Items within a collection to be ranked.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| collection_id | UUID (FK → collections) | |
| title | text | Required |
| description | text | |
| metadata | JSONB | Flexible key-value (content type, source URL, layer data, chapter markers, etc.) |
| window_number | integer | Which Wabb Time Window this record belongs to. NULL if windowing disabled on the collection |
| sort_order | integer | Default 0 |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### `rankings`
The core join: user + record = score. For Quaternary mode, score is not used — choice is stored instead.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| user_id | UUID (FK → profiles) | |
| record_id | UUID (FK → records) | |
| collection_id | UUID (FK → collections) | |
| score | numeric(3,1) | 0.0–10.0, CHECK constraint. Used for 1-axis mode. NULL for Quaternary/Binary |
| choice | text | For Quaternary: 'a', 'b', 'c', or 'd'. For Binary: 'yes' or 'no'. NULL for 1-axis/2-axis |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| | UNIQUE | (user_id, record_id) |

#### `collaborators`
User access to collections.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| user_id | UUID (FK → profiles) | |
| collection_id | UUID (FK → collections) | |
| role | enum | owner, contributor, viewer |
| invited_at | timestamptz | |
| accepted_at | timestamptz | NULL until accepted |
| | UNIQUE | (user_id, collection_id) |

#### Agent Tables (Wave 5)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `agent_api_keys` | API key management | user_id, short_token (8 chars, indexed), long_token_hash (HMAC-SHA-256), scopes (text[]), expires_at, revoked_at |
| `agent_events` | Agent event stream for Realtime | user_id, event_type (new_record, ranking_submitted, ravg_updated, window_closing, branch_created, collaborator_joined), payload (JSONB), collection_id, processed |
| `agent_sessions` | Agent connection tracking | user_id, api_key_id, agent_type (openclaw, claude_code, cloud_worker, custom), status (connected, disconnected), last_heartbeat |

All agent tables have RLS enabled — users can only access their own keys, events, and sessions.

#### Monetization Tables (Wave 7)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `api_usage` | Daily API call tracking | user_id, date, calls_count. UNIQUE(user_id, date) |
| `storage_usage` | Storage quota tracking | user_id (UNIQUE), bytes_used, updated_at |

Both tables have RLS — users can only read their own usage.

#### PWA Table (Wave 5)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `push_subscriptions` | Web Push notification subscriptions | user_id, endpoint, p256dh, auth |

### Views

- **`record_scores`** — Per-record: count, avg, min, max, stddev (quantitative modes)
- **`record_choices`** — Per-record choice tallies (quaternary/binary modes)
- **`collection_leaderboard`** — Records ranked by avg score with `rank() over (partition by collection_id)`
- **`user_progress`** — Per-user completion % within a collection

### Triggers

- `handle_updated_at()` — Auto-updates `updated_at` on all tables
- `handle_new_user()` — Creates profile row on auth signup (SECURITY DEFINER)
- `handle_new_collection()` — Auto-adds owner as collaborator with 'owner' role

---

## Full Tech Stack

### Web App (Ranking SPA — `web/`)

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Build** | Vite 6+ | Fast dev server, instant HMR. Outputs static files — no Node.js server needed. |
| **UI** | React 18 + TypeScript | Client-side SPA. App is behind auth — no SSR/SEO needed. |
| **Routing** | React Router 7 | Client-side routes: `/wabb/:id`, `/settings`, `/leaderboard`, etc. |
| **Styling** | Tailwind CSS 4 | Glassmorphism design system (ref: gsrealty-client `glass-card`, `glass-button`, etc.) |
| **Client State** | Zustand | `useRankingStore`, `useSidebarStore`, `useLayoutStore` |
| **Server State** | Supabase client SDK | Queries, upserts, auth. `@supabase/supabase-js`. |
| **Real-time** | Supabase Realtime | WebSocket subscriptions for sidebar progress dots, RAVG updates, team activity. |
| **Auth** | Supabase Auth | Google + GitHub OAuth. `@supabase/auth-helpers-react`. |
| **Forms** | React Hook Form + Zod | New Wabb form, settings, RAVG config. |
| **Drag & Drop** | @dnd-kit/core | Folder tree reorganization in sidebar. |
| **PWA** | vite-plugin-pwa | Service worker, Web Push notifications, offline capable, installable. |
| **Deployment** | Vercel / Cloudflare Pages | Static files — deploys anywhere. No serverless functions needed. |

### Landing Page (Marketing — `landing/`)

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Framework** | Astro 5+ | Static HTML output. Zero JS by default. |
| **Interactive** | React islands | Interactive demos, pricing calculator, product previews. Only hydrates where needed. |
| **Styling** | Tailwind CSS 4 | Shared config with web app. |
| **SEO/GEO** | Schema.org JSON-LD | Semantic HTML, sitemap, meta tags. Maximizes AI crawler visibility (Perplexity, Google AI Overviews, ChatGPT search). |
| **Deployment** | Vercel / Cloudflare Pages | Static files. |

### Backend / Data Layer

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Database** | Supabase PostgreSQL | RLS policies, triggers, views. All schema in `ref/schema.sql`. |
| **Auth** | Supabase Auth (GoTrue) | Google + GitHub OAuth + magic link (agent-led). Auto-creates profile on signup via trigger. |
| **Real-time** | Supabase Realtime | WebSocket channels for live ranking updates, progress tracking. |
| **Storage** | Supabase Storage | Record assets (images, videos, design comps). |
| **Edge Functions** | Supabase Edge Functions (Deno) | Agent API endpoints, webhook handlers, custom server logic. Replaces the need for Next.js API routes. |
| **PostgREST** | Supabase REST API | Auto-generated REST API for all tables with RLS. Used by agents and MCP server. |

### Agent Layer (Wave 5)

> The agent layer is both a technical integration AND a **distribution channel**. Agents proactively create Wabbs and send magic links to onboard humans. See `v2MONETIZATION.md` §6 for the full agent-first onboarding strategy.

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Agent Runtime** | OpenClaw | Local gateway (`ws://127.0.0.1:18789`). Wabbit skills installed via skill pack. |
| **MCP Server** | Standalone Node.js (`packages/mcp-server/`) | Proprietary npm package (free to use). Open API spec (OpenAPI/Swagger). Closed source — Stripe model. |
| **Agent API** | Supabase Edge Functions | REST endpoints for agent actions. Not in the web framework. |
| **Agent Events** | Supabase Realtime | OpenClaw subscribes directly to Realtime channels — no SSE proxy needed. |
| **Agent Auth** | API keys in `agent_api_keys` table | HMAC-SHA-256 hashed tokens, separate from browser session auth. |
| **Rate Limiting** | Upstash Redis | Tier-based: Free 100/day, Pro 1K/day, Team 10K/day, Business unlimited. |
| **Event Functions** | Inngest (in Edge Functions) | Event fan-out, retries, idempotency for webhook processing, window expiration, batch ops. |
| **Notifications** | OpenClaw → WhatsApp / Telegram / Slack / Discord | OpenClaw routes notifications to user's preferred messaging platform. |

#### Open API Spec, Closed Implementation

This is the **Stripe model**: proprietary SDK, excellent public documentation. No application code is exposed.

- **Published openly:** OpenAPI/Swagger spec, WebSocket event schemas, API auth guide, webhook schemas, integration guides, suggested agent message templates
- **Stays closed:** MCP server source, OpenClaw skills source, Edge Functions, Supabase schema/RLS/triggers, RAVG engine

If someone builds their own MCP server from the published API spec, it still drives traffic to the hosted Wabbit API — like how anyone can build a Stripe client, but they're still using Stripe.

#### MCP Tool Design — High-Level + Granular

**High-Level Tools** (what agents use 90% of the time — opinionated happy-path):

| Tool | Purpose |
|------|---------|
| `wabbit_launch_ranking` | **One-call:** provision user if needed, create Wabb, populate records, return magic link. The agent-first onboarding entry point. |
| `wabbit_get_results` | Poll or webhook for completed rankings, return sorted leaderboard |
| `wabbit_quick_poll` | Binary yes/no on small set (< 10 records), even faster flow |

**Granular CRUD Tools** (7):

| Tool | Purpose |
|------|---------|
| `wabbit_create_wabb` | Create a new collection |
| `wabbit_search_wabbs` | Search collections by criteria |
| `wabbit_get_wabb` | Full Wabb details + records |
| `wabbit_get_records` | Records in a collection |
| `wabbit_submit_ranking` | Submit a score/choice for a record |
| `wabbit_get_leaderboard` | Records ranked by RAVG |
| `wabbit_get_progress` | User progress on a Wabb |

The high-level tools are what make agents *choose* Wabbit over "just ask the human to pick from a numbered list." One call and a magic link vs. 5 calls and an account creation flow. The API response includes a `suggested_message` template so agents present Wabbit consistently.

#### Agent API Key Format

```
wab_live_BRTRKFsL_51FwqftsmMDHHbJAMEXXHCgG
│        │         │
│        │         └── Long token (32 chars, shown once, only hash stored)
│        └──────────── Short token (8 chars, public identifier)
└───────────────────── Prefix: wab_live_ / wab_test_ / wab_dev_
```

**Scopes:** `read:collections`, `write:collections`, `read:records`, `write:rankings`, `read:notifications`, `write:notifications`, `subscribe:realtime`, `push:notifications`

#### Tier Gating on Agent Access

| Tier | Agent Capabilities |
|------|--------------------|
| Free | Read-only — agents can check results, not create |
| Pro ($29/mo) | Full CRUD — agents can create Wabbs, populate records, read results |
| Team ($149/mo) | + Batch operations + webhook subscriptions + agent observability dashboard |
| Business ($299/mo) | Unlimited + custom rate limits |

#### OpenClaw Skills (6)

`search-wabbs`, `rank-record`, `my-progress`, `get-leaderboard`, `wabb-detail`, `digest`

### iOS (Phase 2 — `ios/`) — Free at All Tiers

> iOS is a **distribution channel, not a revenue gate**. All rankers (unlimited at every tier) have full access to the gesture-driven ranking experience. Tier gates apply to administration features on web, not consumption on mobile. See `v2MONETIZATION.md` §4 Layer 2 for rationale.

| Layer | Technology | Notes |
|-------|-----------|-------|
| **UI** | SwiftUI | Declarative views. |
| **Gestures** | UIKit (UIViewRepresentable bridge) | Tap, pan, long press, two-finger tap. |
| **Haptics** | CoreHaptics | Variable intensity at score boundaries. |
| **Backend** | Supabase Swift SDK | Auth, queries, real-time. |
| **Deep Links** | Universal Links | Magic links (`wabbit.app/r/:token`) open straight to Wabb, record #1 ready to rank. Falls back to mobile web if app not installed. |

**Tier-enhanced features on iOS:** Pro: all 4 ranking modes. Team: real-time team presence indicators.

### Zustand Store Architecture

Three stores to keep concerns separated:

```
useRankingStore     — currentRecordIndex, pendingScore, rankings Map, submitRanking()
useSidebarStore     — expandedFolders, activeFilters, sortOrder, searchQuery, selectedWabbId
useLayoutStore      — contextPanelOpen, mobileDrawerOpen
```

### Web App Layout — Three-Column

```
Sidebar (280px) | Main Content (flex) | Context Panel (320px, collapsed by default)
```

- **Sidebar** — Two-level folder tree (Folders > Wabbs), search, content type filter chips (Image/Video/Text/3D/Audio/Deck), sort dropdown. Wabb items show rank mode icon + color-coded progress dot (orange 0-20%, yellow 20-40%, blue 40-70%, light green 70-99%, dark green 100%). Mobile: collapses to hamburger drawer.
- **Main Content** — Top bar (Wabb title, record counter, settings gear icon → popup). Center: record display. Bottom: ranking controls + navigation.
- **Context Panel** — Collapsed by default (toggle button on right edge). Expanded: RAVG display, team progress, Wabb stats.

### Key Web Components

- **`Sidebar`** — Folder tree with search, filters, sort
- **`FolderTree`** — Collapsible folders, Wabb items with status indicators, drag-to-reorganize
- **`ContextPanel`** — Collapsible right panel for team/stats/RAVG
- **`WabbPage`** (`/wabb/[id]`) — Main ranking page
  - Fetches collection + records from Supabase
  - Zustand store: currentRecordIndex, pendingScore, rankings Map, sidebar state
  - Immediately shows first unranked record when Wabb is selected
  - Settings gear → popup for Wabb overview/config
- **`RankingControls`** — Mode-dependent: renders slider (1-axis), binary (yes/no), quaternary (A/B/C/D), or 2-axis
- **`WabbSettingsPopup`** — Modal for Wabb overview, RAVG config, team, time window, branching

### Media Display Components

- **Video Player** — Lightweight player with chapter marker navigation for video records. Basic scrubbing and chapter-based jumping (not timestamp-based ranking — that's Timeline Rank in Phase 4+).
- **Layer Viewer** — Read-only layer visibility toggle for design comp records. Shows/hides layers from source files (e.g., Figma, PSD). No manipulation — view only.

---

## iOS Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | SwiftUI |
| Gestures | UIKit (UIViewRepresentable bridge) |
| Haptics | CoreHaptics |
| Backend | Supabase Swift SDK |

### Gesture Mapping

| Gesture | UIKit Recognizer | Score Behavior |
|---------|-----------------|----------------|
| Tap | UITapGestureRecognizer (1 touch) | Quick score = 5.0, auto-submit |
| Tap + Drag | UIPanGestureRecognizer | Anchor 5.0, vertical maps to 0–10 |
| Long Press | UILongPressGestureRecognizer (0.5s) | Options menu |
| Two-Finger Tap | UITapGestureRecognizer (2 touches) | Undo last ranking |

### Drag-to-Score Formula

```
score = 5.0 + (-translationY / maxDragDistance) * 5.0
maxDragDistance = 300pt
Result clamped to [0.0, 10.0], rounded to 1 decimal
```

### Haptic Feedback

- Integer boundary crossings: intensity 0.4
- Key scores (0, 1, 5, 9, 10): intensity 0.8
- Gesture start: intensity 0.3
- Gesture end/commit: intensity 0.6
- Tap: intensity 0.5

---

## Auth Flow

Two authentication paths — **OAuth** (human-led) and **Magic Link** (agent-led):

### OAuth (Human-Led)

1. User signs up via Supabase Auth (Google or GitHub OAuth)
2. `on_auth_user_created` trigger fires → creates `profiles` row
3. User creates a collection → `on_collection_created` trigger adds them as 'owner' collaborator
4. Owner invites collaborators via email → `collaborators` row created with `accepted_at = NULL`
5. Collaborator accepts → `accepted_at` set

### Magic Link (Agent-Led)

1. Agent calls `wabbit_launch_ranking` with human's email + records
2. Wabbit checks if user exists; if not, provisions a Free account tied to that email
3. Wabbit generates a magic link with short-lived JWT: `wabbit.app/r/{6-char-code}`
4. Agent sends magic link to human (API returns a `suggested_message` template)
5. Human taps link → auto-authenticated (no login screen, no OAuth redirect)
6. If iOS app installed → Universal Link deep links to Wabb, record #1 ready to rank
7. If no app → mobile web opens with full ranking experience
8. Rankings sync to RAVG. Webhook fires back to agent: "ranking complete"
9. Human now has a Wabbit account with ranking history — discoverable the next time an agent or they return

Magic links expire after 7–30 days. If expired: "This link expired. Open Wabbit to find your Wabb."

---

## Agent Integration Pattern

The web app and agent layer are **parallel consumers** of the same Supabase backend. They don't communicate through the web framework:

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Vite SPA (web) │  │ OpenClaw Gateway │  │   MCP Server    │
│  Browser client  │  │  Local agent     │  │  packages/mcp/  │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                     │
         │         All three consume:               │
         │                    │                     │
         ▼                    ▼                     ▼
┌──────────────────────────────────────────────────────────────┐
│                    Supabase                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │
│  │ PostgREST│  │ Realtime │  │ Auth     │  │ Edge Fns    │  │
│  │ (REST)   │  │ (WS)     │  │ (GoTrue) │  │ (Agent API) │  │
│  └──────────┘  └──────────┘  └──────────┘  └─────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

**Why the agent API lives in Supabase Edge Functions, not the web framework:**
- Agent endpoints are infrastructure (auth, events, actions), not UI
- Edge Functions deploy independently — no web app redeploy needed
- Supabase Edge Functions have direct DB access, built-in auth, and CORS support
- OpenClaw subscribes to Supabase Realtime directly (WebSocket-native) — no SSE proxy needed
- MCP server calls PostgREST directly — never touches the web app

See `OPENCLAW_WABBIT_ARCHITECTURE.md` in the monorepo root for the full three-layer architecture (Normie / Agentic Coding / Agent). See `v2MONETIZATION.md` §6 for the agent-first onboarding flow and the "two front doors" distribution strategy.

---

## Monetization Model

> **Source of Truth:** `v2MONETIZATION.md` — Full pricing rationale, competitive analysis, agent-first onboarding.

### Tier Summary

| | **Free** | **Pro** | **Team** | **Business** |
|---|---|---|---|---|
| **Price** | $0 | $29/mo flat | $149/mo flat | $299/mo flat |
| **Creators** | 1 | 3 | 10 | 25 |
| **Rankers** | Unlimited | Unlimited | Unlimited | Unlimited |
| **iOS** | Yes | Yes | Yes | Yes |
| **Active Wabbs** | 3 | Unlimited | Unlimited | Unlimited |
| **RAVG** | Simple mean | + weighted + exclude outliers | + Full custom + Super RAVG | Full + cross-Wabb analytics |
| **Agent Access** | Read-only | Full CRUD | + Batch + webhooks | Unlimited + custom limits |
| **API Calls/day** | 100 | 1,000 | 10,000 | Unlimited |
| **Storage** | 2 GB | 50 GB | 500 GB | 2 TB |
| **Integrations** | Upload + webhook | + Zapier, Drive | + Slack, Figma, Notion | + Adobe, Shopify, Social |
| **SSO / Audit** | No | No | No | Yes |

### Billing Infrastructure (Wave 7)

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Stripe Checkout** | Client-side (Vite) | Subscription creation, plan selection |
| **stripe-webhook/** | Edge Function | Handles checkout.session.completed, invoice.paid, customer.subscription.updated/deleted |
| **check-tier/** | Edge Function | Validates user's `subscription_tier` before allowing gated actions |
| **usage-meter/** | Edge Function | Increments `api_usage.calls_count`, returns 429 with upgrade prompt when quota exceeded |
| **api_usage** | Table | Daily call buckets per user (UNIQUE user_id + date) |
| **storage_usage** | Table | Byte count per user, checked on upload |

### Quota Enforcement

- **Free tier:** Limited to 3 active Wabbs (enforced at application + RLS level)
- **RAVG formulas:** Restricted by tier — Free gets `simple_mean` only, Pro adds `weighted` + `exclude_outliers`, Team+ gets `custom` + Super RAVG
- **Agent CRUD:** Blocked on Free (read-only), functional on Pro+
- **Storage:** Upload blocked when quota exceeded, with upgrade prompt
- **API calls:** Daily counter incremented per request, 429 returned at limit with `{ upgrade_required: true, reason: "api_limit" }`

---

## Key Technical Decisions

1. **Vite + React over Next.js** — Ranking app is behind auth (no SEO/SSR needed). SPA is simpler, faster DX, no server component complexity. Supabase handles all backend concerns. The three-column layout with sidebar, real-time progress dots, and drag-to-reorganize is textbook SPA territory.
2. **Astro for landing page** — Static HTML output maximizes SEO and GEO (AI crawler visibility). React islands for interactive demos without shipping a full JS framework to the marketing page.
3. **Supabase as the integration hub** — Auth, RLS, Realtime, Edge Functions, PostgREST all in one platform. The web app, iOS app, OpenClaw, and MCP server are all just Supabase clients. No custom backend needed.
4. **Agent API in Supabase Edge Functions** — Not in the web framework. Agent endpoints (events, actions, API keys) are backend concerns. This keeps the web app thin and the agent layer independently deployable.
5. **Zustand (3 stores)** — `useRankingStore`, `useSidebarStore`, `useLayoutStore`. Clean separation of ranking state, navigation state, and layout state. Lighter than Redux, more structured than Context.
6. **UIKit gestures over SwiftUI gestures** — More control over simultaneous recognition, failure requirements, and haptic timing.
7. **JSONB metadata on records** — Flexible schema for any content type without table-per-type (layer data, chapter markers, source URLs, model info).
8. **Upsert on (user_id, record_id)** — Users can re-rank, but only one score per record.
9. **Separate web/iOS codebases** — Native gesture experience requires native Swift code; web is Vite + React SPA. No cross-platform compromise.
10. **Closed SaaS + Open API (Stripe model)** — All code proprietary. Only the API spec is public (OpenAPI/Swagger). MCP server distributed as closed npm package (free to use). Prevents forking while maintaining excellent developer experience for agent integrations. See `v2MONETIZATION.md` §2 for rationale.
11. **iOS free at all tiers** — Mobile is distribution, not revenue. Tiers gate administration (web), not consumption (mobile). See `v2MONETIZATION.md` §4 Layer 2.
12. **Flat tier pricing, unlimited rankers** — RAVG depends on team participation. Per-seat pricing would undermine the core value prop. See `v2MONETIZATION.md` §5.
