# Wabbit v2 Build Plan

> **Last Updated:** 2026-02-16 (status audit — corrected wave completion markers)
> **Status:** Wave 0-2 Complete | Wave 3 ~90% (landing page stub) | Wave 4 ~60% (components built, untested) | Wave 6 ~50% (upload UI + edge fn scaffolds) | Waves 5 & 7 Not Started
> **Product:** Gesture-driven ranking/scoring tool with async collaboration for AI-generated content
>
> **Sources of Truth:**
> - `v2MONETIZATION.md` — Monetization strategy, tier definitions, agent-first onboarding
> - `ref/core/Wabbit-webapp.md` — Core product concept
> - `ref/docs/PRD.md` — Product requirements
> - `ref/docs/ARCHITECTURE.md` — Technical architecture
> - `ref/docs/INTEGRATIONS.md` — Integration priorities
> - `ref/docs/GLOSSARY.md` — Canonical terminology
> - `ref/docs/TASKS.md` — Build tasks from Notion
> - `ref/schema.sql` — Reference database schema (6 tables, 5 enums, 4 views, 12 RLS policies, 3 triggers)
> - `ref/page.tsx` — Reference ranking page component
> - `ref/RankingGestureView.swift` — Reference iOS gesture view
> - `docs/OPENCLAW_WABBIT_ARCHITECTURE.md` — Three-layer agent architecture
> - `docs/OPENCLAW_IMPLEMENTATION_PLAN.md` — Agent implementation (6 phases)

---

## Table of Contents

1. [What We're Building](#1-what-were-building)
2. [Architecture Decisions](#2-architecture-decisions)
3. [Target Project Structure](#3-target-project-structure)
4. [Database Schema](#4-database-schema)
5. [Wave 0 — Dev Environment & Tooling](#wave-0--dev-environment--tooling)
6. [Wave 1 — Foundation](#wave-1--foundation)
7. [Wave 2 — Core Ranking](#wave-2--core-ranking)
8. [Wave 3 — UI Polish & Layout](#wave-3--ui-polish--layout)
9. [Wave 4 — Collaboration & RAVG Engine](#wave-4--collaboration--ravg-engine)
10. [Wave 5 — Integrations & Agent Layer](#wave-5--integrations--agent-layer)
11. [Wave 6 — Record Population Pipeline](#wave-6--record-population-pipeline)
12. [Wave 7 — Monetization & Billing](#wave-7--monetization--billing)
13. [Phase 2+ Roadmap](#phase-2-roadmap)
14. [Deferred Features (NOT YET SCOPED)](#deferred-features-not-yet-scoped)
14. [Environment Variables](#environment-variables)
15. [Acceptance Criteria by Wave](#acceptance-criteria-by-wave)
16. [Open Questions](#open-questions)
17. [Testing Strategy](#testing-strategy)
18. [Deployment Strategy](#deployment-strategy)
19. [Security Considerations](#security-considerations)
20. [Dependency Chain](#dependency-chain)
21. [File Count Summary](#file-count-summary)
22. [Cross-Reference: PRD to Build Steps](#cross-reference-prd-to-build-steps)
23. [Appendix: Terminology Quick Reference](#appendix-terminology-quick-reference)

---

## 1. What We're Building

**Wabbit** is a team-oriented content ranking system that connects to content generation APIs, populates records on a timer, and lets individuals or teams score content to reach consensus on quality via a weighted Ranked Average (RAVG).

### One-Liner

> Quality via Quantity. Get better media generations by parsing through more datapoints in less time — individually and/or as a team — all the while giving more context to your agentic layer.

### Core Value Proposition (HIL — Human in the Loop)

When content is customer-facing, skipping team review is a risk too costly for the business impact. Wabbit threads the needle between AI content generation speed and team quality consensus.

### What It Polls On

Text, prompts, images, videos, 3D assets/scenes, decks, demos, audio.

### Target Users

| Segment | Description |
|---------|-------------|
| **B2IC** | Tech-first intrapreneurs at forward-looking teams in larger corporations |
| **B2EC** | Solopreneurs, small business owners, individual creators |
| **B2B** | Marketing agencies integrating Wabbit into client workflows |
| **Content Creators** | Social media influencers, video creators, digital storytellers |
| **Content Production Engineers** | Agentic engineers running generation pipelines |

---

## 2. Architecture Decisions

### Why Vite + React SPA (NOT Next.js)

The ranking app is **behind auth** — no SEO/SSR needed. SPA is simpler, faster DX, no server component complexity. Supabase handles all backend concerns. The three-column layout with sidebar, real-time progress dots, and drag-to-reorganize is textbook SPA territory.

### Why Astro for Landing Page

Static HTML output maximizes SEO and **GEO** (Generative Engine Optimization — AI crawler visibility for Perplexity, Google AI Overviews, ChatGPT search). React islands for interactive demos without shipping a full JS framework.

### Why Supabase as the Integration Hub

Auth, RLS, Realtime, Edge Functions, PostgREST, Storage all in one platform. The web app, iOS app, OpenClaw, and MCP server are all just Supabase clients. No custom backend needed.

### Why Agent API Lives in Supabase Edge Functions

Agent endpoints (events, actions, API keys) are backend infrastructure, not UI. Edge Functions deploy independently. OpenClaw subscribes to Supabase Realtime directly (WebSocket-native) — no SSE proxy needed. MCP server calls PostgREST directly — never touches the web app.

### System Diagram

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

### Full Tech Stack

**Web App (Ranking SPA):**
| Layer | Technology |
|-------|-----------|
| Build | Vite 6+ |
| UI | React 18 + TypeScript |
| Routing | React Router 7 |
| Styling | Tailwind CSS 4 (Glassmorphism) |
| Client State | Zustand (3 stores) |
| Server State | Supabase client SDK |
| Real-time | Supabase Realtime (WebSocket) |
| Auth | Supabase Auth (Google + GitHub OAuth) |
| Forms | React Hook Form + Zod |
| Drag & Drop | @dnd-kit/core |
| PWA | vite-plugin-pwa |

**Landing Page:**
| Layer | Technology |
|-------|-----------|
| Framework | Astro 5+ |
| Interactive | React islands |
| SEO/GEO | Schema.org JSON-LD, sitemap, semantic HTML |

**Backend:**
| Layer | Technology |
|-------|-----------|
| Database | Supabase PostgreSQL + RLS |
| Auth | Supabase Auth (GoTrue) |
| Real-time | Supabase Realtime |
| Storage | Supabase Storage |
| Edge Functions | Supabase Edge Functions (Deno) |
| PostgREST | Auto-generated REST API |

---

## 3. Target Project Structure

```
apps/wabbit/
├── ref/                              # Reference materials (read-only)
│   ├── core/Wabbit-webapp.md         # Core product concept
│   ├── docs/                         # PRD, Architecture, Glossary, Tasks, Integrations
│   ├── schema.sql                    # Reference database schema
│   ├── page.tsx                      # Reference ranking page component
│   ├── RankingGestureView.swift      # Reference iOS gesture view
│   └── README.md                     # Architecture overview
├── v2BUILD_PLAN.md                   # THIS FILE
├── supabase/                         # Database & Edge Functions
│   ├── migrations/                   # SQL migration files
│   │   ├── 001_initial_schema.sql    # Tables, enums, views, RLS, triggers
│   │   ├── 002_ravg_fields.sql       # RAVG formula + weights on collections
│   │   └── 003_agent_tables.sql      # Agent events, API keys, sessions (Wave 5)
│   ├── functions/                    # Supabase Edge Functions (Deno)
│   │   ├── agent-events/             # SSE/WebSocket for agent subscriptions
│   │   ├── agent-actions/            # Agent write actions
│   │   ├── agent-keys/              # CRUD: API key management
│   │   ├── ingest-records/           # Webhook for external record population
│   │   ├── manage-windows/           # Window expiration detection + increment
│   │   └── slack-webhook/            # Slack event handler
│   └── config.toml                   # Supabase project config
├── web/                              # Vite + React SPA (ranking app)
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   ├── .env.local.example
│   └── src/
│       ├── main.tsx                  # Entry point
│       ├── App.tsx                   # Router + three-column layout shell
│       ├── router.tsx                # React Router route definitions
│       ├── index.css                 # Tailwind directives + glassmorphism classes
│       ├── pages/
│       │   ├── WabbPage.tsx          # /wabb/:id — main ranking page
│       │   ├── LeaderboardPage.tsx   # /leaderboard/:id
│       │   ├── LoginPage.tsx         # /login — OAuth buttons
│       │   └── HomePage.tsx          # / — placeholder (becomes redirect)
│       ├── components/
│       │   ├── auth/
│       │   │   ├── AuthGuard.tsx     # Redirects to /login if not authenticated
│       │   │   └── AuthCallback.tsx  # Handles OAuth redirect
│       │   ├── layout/
│       │   │   ├── Sidebar.tsx       # Left column (280px)
│       │   │   ├── ContextPanel.tsx  # Right column (320px, collapsed)
│       │   │   ├── TopBar.tsx        # Wabb title + record counter + gear
│       │   │   └── AppLayout.tsx     # Three-column shell
│       │   ├── sidebar/
│       │   │   ├── FolderTree.tsx    # Collapsible folder tree
│       │   │   ├── FolderItem.tsx    # Single folder (collapsible, context menu)
│       │   │   ├── WabbItem.tsx      # Wabb entry with progress dot
│       │   │   ├── ProgressDot.tsx   # Color-coded completion indicator
│       │   │   ├── SearchInput.tsx   # Filter Wabbs by name
│       │   │   ├── FilterChips.tsx   # Content type toggles
│       │   │   ├── SortDropdown.tsx  # Sort options
│       │   │   └── NewWabbButton.tsx # "+" button at bottom
│       │   ├── ranking/
│       │   │   ├── RankingControls.tsx   # Mode-dependent controls wrapper
│       │   │   ├── OneAxisSlider.tsx     # 0-10 slider
│       │   │   ├── BinaryControls.tsx    # Yes/No
│       │   │   ├── QuaternaryPicker.tsx  # A/B/C/D
│       │   │   ├── TwoAxisGrid.tsx      # 2-axis category swiping
│       │   │   └── RecordCard.tsx        # Record display (image/video/text)
│       │   ├── context/
│       │   │   ├── RAVGDisplay.tsx       # Current record's RAVG + formula badge
│       │   │   ├── TeamProgress.tsx      # Collaborator completion % + scores
│       │   │   └── WabbStats.tsx         # Total records, ranked count, window
│       │   ├── media/
│       │   │   ├── VideoPlayer.tsx       # Lightweight + chapter markers
│       │   │   ├── LayerViewer.tsx       # Read-only layer toggle
│       │   │   └── AudioPlayer.tsx       # HTML5 audio with waveform
│       │   ├── records/
│       │   │   ├── RecordUploader.tsx    # Drag-and-drop upload UI
│       │   │   ├── BulkUploader.tsx      # Upload multiple files
│       │   │   └── RecordForm.tsx        # Manual text/metadata entry
│       │   ├── wabb/
│       │   │   ├── NewWabbForm.tsx       # Create Wabb modal
│       │   │   ├── WabbSettingsPopup.tsx # Settings gear modal (6 tabs)
│       │   │   ├── BranchingMenu.tsx     # Branch carry-over selection
│       │   │   ├── RAVGConfig.tsx        # Formula + weight configuration
│       │   │   ├── CollaboratorList.tsx  # Team members with roles + progress
│       │   │   └── InviteForm.tsx        # Invite by email + role select
│       │   └── ui/                       # Shared primitives
│       │       ├── Card.tsx
│       │       ├── Button.tsx
│       │       ├── Input.tsx
│       │       ├── Modal.tsx
│       │       ├── Select.tsx
│       │       ├── Toggle.tsx
│       │       └── Tooltip.tsx
│       ├── stores/
│       │   ├── rankingStore.ts       # useRankingStore
│       │   ├── sidebarStore.ts       # useSidebarStore
│       │   └── layoutStore.ts        # useLayoutStore
│       ├── lib/
│       │   ├── supabase.ts           # Supabase client singleton
│       │   ├── ravg.ts               # RAVG calculation engine
│       │   └── api/                  # Supabase query helpers
│       │       ├── folders.ts
│       │       ├── collections.ts
│       │       ├── records.ts
│       │       ├── rankings.ts
│       │       ├── collaborators.ts
│       │       └── leaderboard.ts
│       ├── schemas/
│       │   └── newWabb.ts            # Zod validation schema
│       ├── hooks/
│       │   ├── useAuth.ts            # Auth state + signIn/signOut
│       │   ├── useCollection.ts      # Fetch Wabb + records
│       │   ├── useRanking.ts         # Submit/upsert ranking
│       │   ├── useRealtime.ts        # Supabase Realtime subscriptions
│       │   └── useProgress.ts        # User progress tracking
│       └── types/
│           ├── database.ts           # Generated from Supabase
│           └── app.ts                # App-specific types
├── landing/                          # Astro marketing site
│   ├── astro.config.mjs
│   ├── package.json
│   └── src/
│       ├── pages/
│       │   └── index.astro           # Landing page (10 sections)
│       ├── components/
│       │   ├── Hero.astro
│       │   ├── Features.astro
│       │   ├── HowItWorks.astro
│       │   ├── RankingModes.astro
│       │   ├── UseCases.astro
│       │   ├── Pricing.astro
│       │   ├── CTA.astro
│       │   ├── Footer.astro
│       │   └── InteractiveDemo.tsx   # React island
│       ├── layouts/
│       │   └── BaseLayout.astro      # Schema.org JSON-LD
│       └── styles/
│           └── global.css
├── packages/
│   ├── mcp-server/                   # MCP server (Wave 5)
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── auth.ts              # API key validation
│   │   │   └── tools/               # 7 MCP tools
│   │   └── package.json
│   └── openclaw-skills/              # OpenClaw skill pack (Wave 5)
│       ├── SKILL.md
│       ├── skills/                   # 6 skills
│       ├── setup/
│       │   └── api-key-setup.md
│       └── README.md
└── ios/                              # Native iOS (Phase 2)
    └── Wabbit/
        ├── Views/
        ├── Gestures/
        │   └── RankingGestureView.swift
        ├── Models/
        └── Services/
```

---

## 4. Database Schema

**Reference:** `ref/schema.sql` (production-ready, includes RAVG fields inline)

### Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `profiles` | Extends Supabase Auth | id (FK auth.users), display_name, avatar_url |
| `folders` | Sidebar file system containers | owner_id, name, sort_order |
| `collections` | Wabbs (projects) | owner_id, folder_id, title, output_type, wab_type, ranking_mode, quaternary_labels, agent_optimization_level, window_duration, current_window, parent_collection_id, collaboration_mode, ravg_formula, ravg_member_weights, supervisor_weight, branch_carry_over |
| `records` | Items to rank | collection_id, title, metadata (JSONB), window_number, sort_order |
| `rankings` | User + record + score/choice | user_id, record_id, score (0.0-10.0), choice (a/b/c/d/yes/no), UNIQUE(user_id, record_id) |
| `collaborators` | User access to collections | user_id, collection_id, role (owner/contributor/viewer), invited_at, accepted_at |

### Enums

| Enum | Values |
|------|--------|
| `wab_type` | standard, vetted_ref |
| `ranking_mode` | one_axis, two_axis, quaternary, binary |
| `agent_optimization_level` | none, low, medium, high |
| `output_type` | image, video, text, 3d, audio, deck |
| `collaborator_role` | owner, contributor, viewer |

### RAVG Extension Fields

> These columns are now included inline in `ref/schema.sql` (no separate migration needed for fresh installs).
> Migration 002 (`002_ravg_fields.sql`) exists for upgrading existing databases.

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `ravg_formula` | text | `'simple_mean'` | RAVG calculation formula |
| `ravg_member_weights` | jsonb | `'{}'` | Per-member weight multipliers |
| `supervisor_weight` | numeric(3,1) | `1.0` | Owner/supervisor level 2 weight for Super RAVG |
| `branch_carry_over` | jsonb | `null` | Records what was carried over from parent branch |
| `collaboration_mode` | text | `'solo'` | Whether Wabb is solo or team |

### Views

| View | Purpose |
|------|---------|
| `record_scores` | Per-record avg, min, max, stddev (quantitative modes) |
| `record_choices` | Per-record choice tallies (quaternary/binary modes) |
| `collection_leaderboard` | Records ranked by avg score with `rank() over` |
| `user_progress` | Completion % per user per collection |

### RLS Summary

- All 6 tables have RLS enabled
- Profiles: viewable by everyone, updatable by self
- Folders: owner-scoped (full CRUD)
- Collections: visible to owner + collaborators; CRUD by owner
- Records: visible to collection collaborators; insertable by owner/contributor
- Rankings: visible to collection collaborators; insertable/updatable by self (owner/contributor role required — viewers cannot rank)
- Collaborators: visible to collection owner + self; manageable by collection owner

---

## Wave 0 — Dev Environment & Tooling

> **Goal:** Scaffold the project structure, configure tooling, create a new Supabase project.

### Tasks

| # | Task | Deliverable |
|---|------|-------------|
| 0.1 | Create `apps/wabbit/web/` scaffold | Vite 6 + React 18 + TS + React Router 7 + Tailwind 4 + Zustand |
| 0.2 | Create `apps/wabbit/landing/` scaffold | Astro 5 + Tailwind 4 + @astrojs/sitemap |
| 0.3 | Create `apps/wabbit/supabase/` directory | migrations/ + functions/ + config.toml |
| 0.4 | Set up new Supabase project | Separate from gs-site/wabbit-re. New project for Wabbit content ranking |
| 0.5 | Configure Turborepo | Add `web` and `landing` to turbo.json tasks |
| 0.6 | TypeScript generation | `supabase gen types typescript` output to `web/src/types/database.ts` |
| 0.7 | Environment variables | `.env.local` with `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| 0.8 | Dev commands | `npm run dev` starts web on :5173, landing on :4321 |

### vite.config.ts

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Wabbit',
        short_name: 'Wabbit',
        description: 'Gesture-driven content ranking with async collaboration',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: { port: 5173 },
})
```

### package.json (web/)

```json
{
  "name": "wabbit-web",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "gen:types": "npx supabase gen types typescript --project-id <id> > src/types/database.ts"
  },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router": "^7.0.0",
    "@supabase/supabase-js": "^2.45.0",
    "@supabase/auth-helpers-react": "^0.5.0",
    "zustand": "^5.0.0",
    "react-hook-form": "^7.54.0",
    "@hookform/resolvers": "^3.9.0",
    "zod": "^3.24.0",
    "@dnd-kit/core": "^6.3.0",
    "@dnd-kit/sortable": "^10.0.0",
    "clsx": "^2.1.0"
  },
  "devDependencies": {
    "vite": "^6.1.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.7.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "vite-plugin-pwa": "^0.21.0",
    "supabase": "^2.0.0",
    "eslint": "^9.0.0",
    "@eslint/js": "^9.0.0",
    "typescript-eslint": "^8.0.0",
    "vitest": "^3.0.0",
    "@testing-library/react": "^16.0.0"
  }
}
```

### package.json (landing/)

```json
{
  "name": "wabbit-landing",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview"
  },
  "dependencies": {
    "astro": "^5.0.0",
    "@astrojs/react": "^4.0.0",
    "@astrojs/tailwind": "^6.0.0",
    "@astrojs/sitemap": "^4.0.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  }
}
```

### .env.local.example

```env
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>

# Edge Functions only (never in client)
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

### Supabase Project Setup Steps

1. Create new Supabase project at supabase.com (separate from gs-site/wabbit-re)
2. Note project URL and keys
3. Install Supabase CLI: `npm install -g supabase`
4. Link project: `supabase link --project-ref <project-id>`
5. Configure auth providers:
   - **Google OAuth:** Google Cloud Console → Credentials → OAuth 2.0. Redirect: `https://<project>.supabase.co/auth/v1/callback`
   - **GitHub OAuth:** GitHub → Settings → Developer Settings → OAuth App. Same redirect.
   - Add both to Supabase Dashboard → Auth → Providers
6. Run `ref/schema.sql` in SQL Editor (or via `supabase db push`)
7. Enable Realtime on tables: `rankings`, `collections`, `records`, `collaborators`
8. Generate types: `npx supabase gen types typescript --project-id <id> > src/types/database.ts`

### Acceptance Criteria

- [x] `cd apps/wabbit/web && npm run dev` starts Vite dev server on :5173
- [x] `cd apps/wabbit/landing && npm run dev` starts Astro dev server on :4321
- [x] Supabase project created and accessible
- [x] TypeScript types generated from schema
- [x] Turbo `dev` task starts both web and landing in parallel

---

## Wave 1 — Foundation

> **Goal:** Database migration applied. Auth working. Storage bucket created. Basic routing in place. Empty three-column layout renders.

### Tasks

| # | Task | Deliverable |
|---|------|-------------|
| 1.1 | Apply database migration | `supabase/migrations/001_initial_schema.sql` — all tables, enums, views, indexes, RLS, triggers from `ref/schema.sql` |
| 1.2 | Set up Supabase Auth | Google + GitHub OAuth configured in Supabase Dashboard |
| 1.3 | Supabase client | `web/src/lib/supabase.ts` — client initialization with env vars |
| 1.4 | Auth hook | `web/src/hooks/useAuth.ts` — session management, signIn, signOut |
| 1.5 | Auth pages | `LoginPage.tsx` + `AuthGuard.tsx` + `AuthCallback.tsx` |
| 1.6 | Realtime hook | `web/src/hooks/useRealtime.ts` — generic subscription helper |
| 1.7 | Three Zustand stores | `rankingStore`, `sidebarStore`, `layoutStore` |
| 1.8 | App layout shell | `AppLayout.tsx` — three-column grid |
| 1.9 | Router setup | React Router 7 with AuthGuard wrapper |
| 1.10 | Supabase Storage | Create `record-assets` bucket with RLS policies |

### supabase.ts

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

### useAuth.ts

```typescript
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    )

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })

  const signInWithGitHub = () =>
    supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })

  const signOut = () => supabase.auth.signOut()

  return { user, loading, signInWithGoogle, signInWithGitHub, signOut }
}
```

### useRealtime.ts

```typescript
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export function useRealtime<T extends Record<string, unknown>>(
  table: string,
  filter: string | undefined,
  callback: (payload: RealtimePostgresChangesPayload<T>) => void
) {
  useEffect(() => {
    const channel = supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter },
        callback
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [table, filter])
}
```

### router.tsx

```typescript
import { createBrowserRouter } from 'react-router'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { LoginPage } from '@/pages/LoginPage'
import { AuthCallback } from '@/components/auth/AuthCallback'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/auth/callback', element: <AuthCallback /> },
  {
    element: <AuthGuard />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/wabb/:id', element: <WabbPage /> },
      { path: '/leaderboard/:id', element: <LeaderboardPage /> },
    ],
  },
])
```

### Zustand Store Shapes

```typescript
// rankingStore.ts
interface RankingState {
  collectionId: string | null
  records: Record[]
  currentRecordIndex: number
  pendingScore: number | null
  pendingChoice: string | null
  rankings: Map<string, number | string>  // recordId → score or choice
  setCollection: (id: string, records: Record[]) => void
  setPendingScore: (score: number) => void
  setPendingChoice: (choice: string) => void
  submitRanking: (recordId: string, value: number | string) => void
  nextRecord: () => void
  previousRecord: () => void
  goToFirstUnranked: () => void
}

// sidebarStore.ts
interface SidebarState {
  expandedFolders: Set<string>
  activeFilters: Set<OutputType>
  sortOrder: 'start_date' | 'window_finish' | 'branches' | 'alpha' | 'progress'
  searchQuery: string
  selectedWabbId: string | null
  toggleFolder: (folderId: string) => void
  setFilters: (filters: Set<OutputType>) => void
  setSortOrder: (order: SortOrder) => void
  setSearchQuery: (query: string) => void
  selectWabb: (wabbId: string) => void
}

// layoutStore.ts
interface LayoutState {
  contextPanelOpen: boolean
  mobileDrawerOpen: boolean
  toggleContextPanel: () => void
  toggleMobileDrawer: () => void
}
```

### Supabase Storage Setup

Create `record-assets` bucket. File path convention: `{collection_id}/{record_id}/{filename}`

```sql
-- Storage RLS: collection collaborators can access record assets
CREATE POLICY "Collaborators can read record assets"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'record-assets'
    AND EXISTS (
      SELECT 1 FROM public.collaborators c
      WHERE c.user_id = auth.uid()
      AND c.collection_id = (storage.foldername(name))[1]::uuid
    )
  );

CREATE POLICY "Owner and contributors can upload record assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'record-assets'
    AND EXISTS (
      SELECT 1 FROM public.collaborators c
      WHERE c.user_id = auth.uid()
      AND c.collection_id = (storage.foldername(name))[1]::uuid
      AND c.role IN ('owner', 'contributor')
    )
  );
```

### Acceptance Criteria

- [x] User can sign up / sign in via Google or GitHub
- [x] Auto-profile creation on signup (trigger fires)
- [x] Protected routes redirect to `/login`
- [x] Three-column layout renders (sidebar | main | context panel)
- [x] All 6 tables visible in Supabase Dashboard with RLS enabled
- [x] `record-assets` storage bucket created with RLS

---

## Wave 2 — Core Ranking

> **Goal:** Users can create Wabbs, add records, rank them in all 4 modes, and see the leaderboard.
> **Source:** PRD §7.1-7.2, ARCHITECTURE.md §WabbPage, TASKS.md

### Tasks

| # | Task | Deliverable |
|---|------|-------------|
| 2.1 | API layer | 6 files in `lib/api/` — folders, collections, records, rankings, collaborators, leaderboard |
| 2.2 | Folder CRUD | Create, rename, delete folders. Drag Wabbs between folders via @dnd-kit |
| 2.3 | Sidebar file tree | `FolderTree.tsx` — collapsible folders, Wabb items with progress dots, "Unfiled" section |
| 2.4 | Search + filters | `SearchInput.tsx`, `FilterChips.tsx`, `SortDropdown.tsx` |
| 2.5 | New Wabb form | `NewWabbForm.tsx` — modal triggered by sidebar "+" button |
| 2.6 | Wabb page | `WabbPage.tsx` — fetches collection + records, shows first unranked record |
| 2.7 | Record display | `RecordCard.tsx` — renders media based on output_type |
| 2.8 | Ranking controls | `RankingControls.tsx` dispatcher + all 4 mode components |
| 2.9 | Ranking submission | Upsert to `rankings` table (onConflict: user_id, record_id) |
| 2.10 | Navigation | Previous / Submit & Next. Auto-advance to next unranked record |
| 2.11 | Leaderboard view | `LeaderboardPage.tsx` — records ordered by RAVG |
| 2.12 | Progress dots | Color-coded completion indicator on Wabb items in sidebar |

### API Layer

#### lib/api/folders.ts

```typescript
import { supabase } from '@/lib/supabase'

export async function getFolders() {
  return supabase.from('folders').select('*').order('sort_order')
}

export async function createFolder(name: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return supabase.from('folders').insert({ owner_id: user.id, name })
}

export async function updateFolder(id: string, data: { name?: string; sort_order?: number }) {
  return supabase.from('folders').update(data).eq('id', id)
}

export async function deleteFolder(id: string) {
  return supabase.from('folders').delete().eq('id', id)
}

export async function reorderFolders(orderedIds: string[]) {
  const updates = orderedIds.map((id, index) =>
    supabase.from('folders').update({ sort_order: index }).eq('id', id)
  )
  return Promise.all(updates)
}
```

#### lib/api/collections.ts

```typescript
import { supabase } from '@/lib/supabase'
import type { NewWabbForm, BranchCarryOver } from '@/types/app'

export async function getCollections() {
  return supabase
    .from('collections')
    .select('*, folders(name), collaborators(user_id, role)')
    .order('created_at', { ascending: false })
}

export async function getCollection(id: string) {
  return supabase
    .from('collections')
    .select('*, folders(name), collaborators(user_id, role, profiles(display_name, avatar_url))')
    .eq('id', id)
    .single()
}

export async function createCollection(data: NewWabbForm) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  return supabase.from('collections').insert({
    owner_id: user.id,
    folder_id: data.folderId || null,
    title: data.title,
    description: data.description,
    output_type: data.outputType,
    wab_type: data.wabType,
    ranking_mode: data.rankingMode,
    quaternary_labels: data.quaternaryLabels,
    agent_optimization_level: data.agentLevel,
    window_duration: data.windowDuration || null,
    collaboration_mode: data.collaboration || 'solo',
    ravg_formula: data.ravgFormula || 'simple_mean',
    ravg_member_weights: data.ravgMemberWeights || {},
    supervisor_weight: data.supervisorWeight || 1.0,
  })
}

export async function updateCollection(id: string, data: Partial<NewWabbForm>) {
  return supabase.from('collections').update(data).eq('id', id)
}

export async function deleteCollection(id: string) {
  return supabase.from('collections').delete().eq('id', id)
}

export async function branchCollection(parentId: string, carryOver: BranchCarryOver) {
  const { data: parent } = await getCollection(parentId)
  if (!parent) throw new Error('Parent collection not found')

  return supabase.from('collections').insert({
    owner_id: parent.owner_id,
    folder_id: parent.folder_id,
    title: `${parent.title} (Branch)`,
    description: parent.description,
    output_type: parent.output_type,
    wab_type: parent.wab_type,
    ranking_mode: parent.ranking_mode,
    quaternary_labels: parent.quaternary_labels,
    agent_optimization_level: carryOver.agent_optimization ? parent.agent_optimization_level : 'none',
    window_duration: parent.window_duration,
    parent_collection_id: parentId,
    branch_carry_over: carryOver,
    current_window: 1,
    // Rankings NEVER carry over — always starts fresh (ref: PRD §7.4)
  })
}
```

#### lib/api/records.ts

```typescript
import { supabase } from '@/lib/supabase'

export async function getRecords(collectionId: string) {
  return supabase
    .from('records')
    .select('*')
    .eq('collection_id', collectionId)
    .order('sort_order')
}

export async function getRecordsByWindow(collectionId: string, windowNumber: number) {
  return supabase
    .from('records')
    .select('*')
    .eq('collection_id', collectionId)
    .eq('window_number', windowNumber)
    .order('sort_order')
}

export async function createRecord(data: {
  collectionId: string; title: string; description?: string;
  metadata?: Record<string, unknown>; windowNumber?: number;
}) {
  return supabase.from('records').insert({
    collection_id: data.collectionId, title: data.title,
    description: data.description, metadata: data.metadata || {},
    window_number: data.windowNumber,
  })
}

export async function uploadRecordAsset(collectionId: string, recordId: string, file: File) {
  const path = `${collectionId}/${recordId}/${file.name}`
  return supabase.storage.from('record-assets').upload(path, file)
}
```

#### lib/api/rankings.ts

```typescript
import { supabase } from '@/lib/supabase'

export async function submitRanking(data: {
  userId: string; recordId: string; collectionId: string;
  score?: number; choice?: string;
}) {
  return supabase.from('rankings').upsert(
    {
      user_id: data.userId, record_id: data.recordId,
      collection_id: data.collectionId,
      score: data.score ?? null, choice: data.choice ?? null,
    },
    { onConflict: 'user_id,record_id' }
  )
}

export async function getUserRankings(collectionId: string, userId: string) {
  return supabase.from('rankings')
    .select('record_id, score, choice')
    .eq('collection_id', collectionId).eq('user_id', userId)
}

export async function getRecordRankings(recordId: string) {
  return supabase.from('rankings')
    .select('*, profiles(display_name, avatar_url)')
    .eq('record_id', recordId)
}
```

#### lib/api/leaderboard.ts

```typescript
import { supabase } from '@/lib/supabase'

export async function getLeaderboard(collectionId: string) {
  return supabase.from('collection_leaderboard')
    .select('*').eq('collection_id', collectionId)
    .order('avg_score', { ascending: false })
}

export async function getRecordChoices(recordId: string) {
  return supabase.from('record_choices').select('*').eq('record_id', recordId)
}

export async function getProgressView(userId: string) {
  return supabase.from('user_progress').select('*').eq('user_id', userId)
}
```

### Zod Schema (schemas/newWabb.ts)

```typescript
import { z } from 'zod'

export const newWabbSchema = z.object({
  title: z.string().min(1, 'Name is required'),
  folderId: z.string().uuid().nullable().optional(),
  description: z.string().optional(),
  outputType: z.enum(['image', 'video', 'text', '3d', 'audio', 'deck']),
  wabType: z.enum(['standard', 'vetted_ref']).default('standard'),
  rankingMode: z.enum(['one_axis', 'two_axis', 'quaternary', 'binary']).default('one_axis'),
  quaternaryLabels: z.object({
    a: z.string().default('A'), b: z.string().default('B'),
    c: z.string().default('C'), d: z.string().default('D'),
  }).optional(),  // conditional: shown only when rankingMode === 'quaternary'
  agentLevel: z.enum(['none', 'low', 'medium', 'high']).default('none'),
  windowDuration: z.string().nullable().optional(),
  ravgFormula: z.enum(['simple_mean', 'weighted_by_role', 'exclude_outliers', 'custom']).default('simple_mean'),
  collaboration: z.enum(['solo', 'team']).default('solo'),
})

export type NewWabbForm = z.infer<typeof newWabbSchema>
```

### RankingControls Dispatcher

```typescript
interface Props {
  mode: 'one_axis' | 'two_axis' | 'quaternary' | 'binary'
  quaternaryLabels?: { a: string; b: string; c: string; d: string }
  onScore: (score: number) => void
  onChoice: (choice: string) => void
  onSubmit: () => void
}

export function RankingControls({ mode, ...props }: Props) {
  switch (mode) {
    case 'one_axis':    return <OneAxisSlider {...props} />
    case 'two_axis':    return <TwoAxisGrid {...props} />
    case 'quaternary':  return <QuaternaryPicker labels={props.quaternaryLabels} {...props} />
    case 'binary':      return <BinaryControls {...props} />
  }
}
```

### Ranking Mode Component Specs

| Component | Visual | Interaction |
|-----------|--------|-------------|
| `OneAxisSlider` | Range 0.0-10.0, step 0.1. Glass track + thumb. Numeric value above thumb. Visual pulse at integer boundaries. Stronger emphasis at key scores (0, 1, 5, 9, 10) — mirroring iOS haptics | Drag slider → Submit button below |
| `QuaternaryPicker` | 4 `glass-card` buttons in 2x2 grid. Labels from `collection.quaternary_labels` | Click = select + auto-submit |
| `BinaryControls` | Two large buttons side-by-side. Yes: `bg-green-500/10 border-green-500/30`. No: `bg-red-500/10 border-red-500/30` | Click = select + auto-submit |
| `TwoAxisGrid` | 2D plane, each quadrant = category. Click/drag within plane | Score derived from position. Phase 1: simplified grid click |

### RecordCard Content Type Rendering

| Output Type | RecordCard Renders |
|-------------|-------------------|
| `image` | `<img>` with lightbox zoom |
| `video` | `VideoPlayer` with chapter markers (Wave 3.6) |
| `text` | Formatted text content with scroll |
| `3d` | Placeholder embed (future: Three.js viewer) |
| `audio` | `AudioPlayer` with waveform display |
| `deck` | Multi-slide viewer with navigation |

### WabbPage Behavior

> Source: PRD §7.2 — "immediately shows the first unranked record"

1. `useParams()` gets `id` from URL
2. Fetch collection config (ranking mode, labels, RAVG formula)
3. Fetch records for this collection
4. Call `goToFirstUnranked()` — **no intermediate overview page**
5. Render `RecordCard` + `RankingControls` based on `ranking_mode`
6. Submit → upsert → auto-advance to next unranked
7. Show record counter: "12 of 45" in top bar
8. Settings gear icon (top-right) → opens `WabbSettingsPopup`

**"You're All Caught Up" state** (when all records ranked):
- Title: "You're All Caught Up"
- Subtitle: "There are no more generations for you to vote on at this time"
- Action: Link to leaderboard view

### Progress Dot Colors

```typescript
function getProgressColor(pct: number): string {
  if (pct >= 100) return 'bg-green-700'       // dark green — fully ranked
  if (pct >= 70)  return 'bg-green-400'       // light green — almost complete
  if (pct >= 40)  return 'bg-blue-400'        // blue — average progress
  if (pct >= 20)  return 'bg-yellow-400'      // yellow — moderate progress
  return 'bg-orange-400'                       // orange — needs attention
}
```

### Acceptance Criteria

- [x] User can create a folder and a Wabb within it
- [x] Wabb appears in sidebar with correct output type icon + progress dot
- [x] Clicking a Wabb shows the first unranked record (no intermediate overview page)
- [x] User can rank a record via 1-axis slider (0.0-10.0, one decimal)
- [x] User can rank via Binary (Yes/No)
- [x] User can rank via Quaternary (A/B/C/D with custom labels)
- [x] User can rank via 2-axis
- [x] Score persists via upsert — re-ranking updates (doesn't duplicate)
- [x] Auto-advances to next unranked record after submit
- [x] "You're All Caught Up" shown when all records ranked
- [x] Leaderboard shows records ordered by avg score
- [x] Sidebar progress dot updates as user ranks

---

## Wave 3 — UI Polish & Layout

> **Status:** ~90% — All web app UI complete. Landing page is stub only (no marketing content, no Schema.org, no pricing).
>
> **Goal:** Glassmorphism styling applied. Three-column layout fully functional. Landing page built. Media display components working.
> **Source:** TASKS.md §UI, ARCHITECTURE.md §Layout

### Tasks

| # | Task | Deliverable |
|---|------|-------------|
| 3.1 | Glassmorphism design system | `index.css` — glass classes (ref: gsrealty-client) |
| 3.2 | Three-column layout | `AppLayout.tsx` — desktop grid, tablet collapse, mobile hamburger |
| 3.3 | Wabb settings popup | `WabbSettingsPopup.tsx` — gear icon → 6-tab modal |
| 3.4 | Top bar | `TopBar.tsx` — Wabb title, "12 of 45", settings gear |
| 3.5 | Context panel | `RAVGDisplay`, `TeamProgress`, `WabbStats` components |
| 3.6 | Sidebar polish | Full component suite with drag-to-reorganize |
| 3.7 | Video player | `VideoPlayer.tsx` — chapter markers. NOT Timeline Rank (Phase 4+) |
| 3.8 | Layer viewer | `LayerViewer.tsx` — read-only layer visibility toggle |
| 3.9 | Mobile responsive | Sidebar → hamburger drawer. Context panel hidden |
| 3.10 | Landing page build | Astro: 10 sections + Schema.org JSON-LD + React islands |

### Glassmorphism CSS (index.css)

```css
@import 'tailwindcss';

.glass-card {
  @apply backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl;
}
.glass-card-hover {
  @apply transition-all duration-700 ease-out hover:scale-[1.02] hover:bg-white/15;
}
.glass-button {
  @apply bg-white/10 hover:bg-white/20 border border-white/20 text-white
         duration-700 hover:scale-[1.02] rounded-xl px-4 py-2;
}
.glass-input {
  @apply bg-white/5 border border-white/20 rounded-xl text-white
         placeholder:text-white/40 focus:border-white/40 px-4 py-2;
}
.glass-nav-item {
  @apply text-white/80 hover:text-white hover:bg-white/10
         transition-all duration-700 rounded-xl px-3 py-2;
}
.glass-nav-active {
  @apply bg-white/20 text-white border border-white/30;
}
```

**Glassmorphism Rules:**

DO:
- `glass-card` for all containers. White text with transparency (`/60`, `/80`). Rounded corners (`rounded-xl`, `rounded-3xl`). `duration-700 ease-out` transitions. Dark image + `bg-black/30` overlay backgrounds.

DON'T:
- Solid opaque backgrounds (`bg-white`, `bg-gray-100`). Black text on light backgrounds. Sharp corners. Fast transitions (`duration-150`, `duration-200`). Skip dark overlay on background images.

### Three-Column Layout (App.tsx)

```typescript
export function App() {
  const { contextPanelOpen, mobileDrawerOpen } = useLayoutStore()

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: '...' }} />
      <div className="absolute inset-0 bg-black/30" />

      {/* Desktop */}
      <div className="relative z-10 hidden md:grid h-screen"
           style={{ gridTemplateColumns: `280px 1fr ${contextPanelOpen ? '320px' : '48px'}` }}>
        <Sidebar />
        <main><Outlet /></main>
        <ContextPanel />
      </div>

      {/* Mobile */}
      <div className="relative z-10 md:hidden h-screen flex flex-col">
        <MobileDrawer open={mobileDrawerOpen} />
        <main><Outlet /></main>
      </div>
    </div>
  )
}
```

**Responsive:** Desktop (md+): full 3-col. Tablet: sidebar collapses to 64px icon strip. Mobile: hamburger drawer, no context panel.

### Wabb Settings Popup — 6 Tabs

| Tab | Content |
|-----|---------|
| **Overview** | Edit name, description, output type, wabb type |
| **Ranking** | Change ranking mode, RAVG formula picker, per-member weight sliders, supervisor weight |
| **Team** | Collaborator list with roles, invite form, remove collaborators |
| **Window** | Current window number, time remaining, close window / start new window |
| **Branch** | Branch history tree, create new branch button → BranchingMenu |
| **Agent** | Agent Optimization Level toggle (Phase 1: UI only) |

### Context Panel Components

**Collapsed state:** 48px wide toggle button (team/users icon). `transition-all duration-700 ease-out`.
**Expanded state:** 320px, slides open.

| Component | Content |
|-----------|---------|
| `RAVGDisplay` | Current record's RAVG (large number) + formula indicator badge. If Super RAVG: separate supervisor score line |
| `TeamProgress` | Collaborator list: avatar + name + completion % bar + score on current record (if ranked). Viewer role marked "View only" |
| `WabbStats` | Total records, ranked count (by current user), current window + time remaining, branch count |

Realtime: subscribe to `rankings` table changes for this collection → update team progress live.

### Sidebar Component Details

| Component | Behavior |
|-----------|----------|
| `SearchInput` | Filter Wabbs by name (`glass-input`) |
| `FilterChips` | Multi-select toggles: Image, Video, Text, 3D, Audio, Deck. Maps to `collections.output_type` |
| `SortDropdown` | Options: Start date (default), Window finish date, Branches, Alphabetical, Progress % |
| `FolderTree` | Collapsible folders + Wabbs. @dnd-kit for reorder. Wabbs draggable between folders |
| `FolderItem` | Right-click context menu: Rename, Delete (with "Wabbs become Unfiled" confirmation) |
| `WabbItem` | Truncated name + ranking mode icon + output type icon + `ProgressDot` |
| `NewWabbButton` | "+" at bottom of sidebar → opens NewWabbForm modal |

### Media Components

**VideoPlayer:**
- HTML5 `<video>` with glassmorphism custom controls
- Chapter markers from `record.metadata.chapters`: `[{ time: 0, label: "Intro" }, { time: 30, label: "Feature" }]`
- Chapter dots on timeline bar below video. Click dot → seek to timestamp
- Play/pause, volume, fullscreen. **NOT Timeline Rank** (Phase 4+)

**LayerViewer:**
- Reads `record.metadata.layers`: `[{ name: "Background", visible: true }, { name: "Text", visible: true }]`
- Toggle switch per layer → CSS opacity show/hide
- **Read-only** — no manipulation

**AudioPlayer:**
- HTML5 `<audio>` with waveform display. Play/pause, scrub

### Landing Page — 10 Sections

> References: v0.app/templates/react-3d-slider-5zQj43dFZEa, v0.app/templates/arc-images-RS4IgaEabFu, unicorn.studio

| # | Section | Content |
|---|---------|---------|
| 1 | **Hero** | Product tagline ("Quality via Quantity"), animated product screenshot, CTA button |
| 2 | **Problem/Solution** | Over-adoption risk vs under-adoption risk (PRD §2) |
| 3 | **How It Works** | 3-step: Create Wabb → Rank Records → Reach Consensus |
| 4 | **Ranking Modes** | Visual demos of 1-axis, binary, quaternary, 2-axis |
| 5 | **Use Cases** | B2IC, B2EC, B2B cards (PRD §3) |
| 6 | **Interactive Demo** | React island: mini ranking slider you can play with |
| 7 | **Integrations** | Logo grid (Slack, Figma, Notion, etc.) |
| 8 | **Pricing Preview** | Freemium / Pro / Enterprise tiers (PRD §10) |
| 9 | **CTA** | Sign up / Get Started |
| 10 | **Footer** | Links, social, legal |

### BaseLayout.astro (Schema.org JSON-LD)

```astro
---
interface Props { title: string; description: string }
const { title, description } = Astro.props
---
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{title}</title>
  <meta name="description" content={description} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:type" content="website" />
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Wabbit",
    "description": "Gesture-driven content ranking tool with async team collaboration for AI-generated content.",
    "applicationCategory": "ProductivityApplication",
    "operatingSystem": "Web, iOS",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "featureList": ["Content Ranking", "Team Collaboration", "AIGC Review", "Gesture-Driven Scoring", "RAVG Consensus"]
  }
  </script>
</head>
<body><slot /></body>
</html>
```

### Acceptance Criteria

- [x] Glassmorphism styling consistent across all components
- [x] Dark backgrounds, white text, frosted glass, `duration-700 ease-out` transitions
- [x] Settings gear popup opens with 6 tabs
- [x] Context panel toggles open/closed with smooth animation
- [x] Video player plays with chapter marker navigation
- [x] Layer viewer toggles layer visibility (read-only)
- [x] Mobile: sidebar slides in as drawer, context panel hidden
- [ ] Landing page: 10 sections, Astro static, Schema.org JSON-LD *(deferred — stub only)*
- [ ] Landing page: interactive demo via React island *(deferred — stub only)*

---

## Wave 4 — Collaboration & RAVG Engine

> **Status:** ~60% — Components and engine code built. Multi-user invite flow, Super RAVG integration, and real-time collab updates need integration testing. Acceptance criteria unchecked.
>
> **Goal:** Multi-user collaboration. RAVG with customizable formulas and weights. Branching flow complete.
> **Source:** PRD §7.3-7.5, GLOSSARY.md §RAVG, §Super RAVG, §Branched Wabb

### Tasks

| # | Task | Deliverable | Status |
|---|------|-------------|--------|
| 4.1 | RAVG migration | `supabase/migrations/002_ravg_fields.sql` | ✅ Built |
| 4.2 | Collaborator invites | Owner invites by email. Creates `collaborators` row with `accepted_at = NULL` | ⚠️ UI built, `invite-by-email` edge fn scaffolded, untested end-to-end |
| 4.3 | Role-based access | Owner, Contributor, Viewer permissions enforced | ⚠️ Code exists, untested with real multi-user flow |
| 4.4 | RAVG calculation engine | `web/src/lib/ravg.ts` | ✅ Built + unit tests |
| 4.5 | RAVG config UI | `RAVGConfig.tsx` — formula picker + per-member weight sliders | ✅ Built |
| 4.6 | Super RAVG | Supervisor weight separately configurable | ⚠️ Engine code exists, UI integration unclear |
| 4.7 | User progress tracking | `user_progress` view in Context Panel | ✅ Built |
| 4.8 | Team progress display | Per-collaborator completion % + scores on current record | ⚠️ Component exists, real-time updates not fully wired |
| 4.9 | Branching flow | `BranchingMenu.tsx` — smart defaults, confirmation prompt | ✅ Built |
| 4.10 | Quaternary label change trigger | Auto-triggers Branch with confirmation | ⚠️ Untested |
| 4.11 | Supabase Realtime | Live updates for progress dots, RAVG, team activity | ⚠️ Subscription exists, not fully wired to all components |

### Role Permissions Matrix

| Role | View Records | Rank | Add Records | Manage Team | Edit Wabb | Delete Wabb |
|------|:---:|:---:|:---:|:---:|:---:|:---:|
| **Owner** | Y | Y | Y | Y | Y | Y |
| **Contributor** | Y | Y | Y | N | N | N |
| **Viewer** | Y | N | N | N | N | N |

### RAVG Calculation Engine (lib/ravg.ts)

```typescript
type RAVGFormula = 'simple_mean' | 'weighted_by_role' | 'exclude_outliers' | 'custom'

interface RAVGInput {
  rankings: { userId: string; score: number }[]  // All rankings including owner
  formula: RAVGFormula
  memberWeights: Record<string, number>
  collaborators: { userId: string; role: string }[]
  supervisorWeight: number  // Level 2 weight — applied to owner's score in Super RAVG
  ownerId: string           // Owner is excluded from level 1 team RAVG when Super RAVG is active
}

function calculateRAVG(input: RAVGInput): number {
  const { rankings, formula, memberWeights, collaborators } = input
  if (rankings.length === 0) return 0

  switch (formula) {
    case 'simple_mean':
      return mean(rankings.map(r => r.score))

    case 'weighted_by_role':
      return weightedMean(rankings, r => {
        const collab = collaborators.find(c => c.userId === r.userId)
        return collab?.role === 'owner' ? 2 : 1
      })

    case 'exclude_outliers':
      return trimmedMean(rankings.map(r => r.score), 0.1)

    case 'custom':
      return weightedMean(rankings, r => memberWeights[r.userId] ?? 1)
  }
}

function calculateSuperRAVG(input: RAVGInput): number {
  // Level 1: team RAVG excludes the owner (they are level 2)
  const teamRankings = input.rankings.filter(r => r.userId !== input.ownerId)
  if (teamRankings.length === 0) {
    // Owner is the only ranker — return their score directly
    const ownerRanking = input.rankings.find(r => r.userId === input.ownerId)
    return ownerRanking?.score ?? 0
  }

  const teamInput = { ...input, rankings: teamRankings }
  const teamRAVG = calculateRAVG(teamInput)
  const ownerRanking = input.rankings.find(r => r.userId === input.ownerId)
  if (!ownerRanking) return teamRAVG

  // Level 2 (owner/supervisor weight) on top of level 1 (team contributors)
  const totalWeight = 1 + input.supervisorWeight
  return (teamRAVG + ownerRanking.score * input.supervisorWeight) / totalWeight
}

// Utilities
function mean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

function weightedMean(
  rankings: { score: number; userId: string }[],
  getWeight: (r: { score: number; userId: string }) => number
): number {
  const totalWeight = rankings.reduce((sum, r) => sum + getWeight(r), 0)
  const weightedSum = rankings.reduce((sum, r) => sum + r.score * getWeight(r), 0)
  return weightedSum / totalWeight
}

function trimmedMean(values: number[], trimPct: number): number {
  const sorted = [...values].sort((a, b) => a - b)
  const trimCount = Math.floor(sorted.length * trimPct)
  const trimmed = sorted.slice(trimCount, sorted.length - trimCount)
  return mean(trimmed.length > 0 ? trimmed : sorted)
}
```

### Branching Flow

> Source: PRD §7.4, GLOSSARY.md §Branched Wabb

1. User triggers Branch from Wabb Settings (or system detects Quaternary label change)
2. Confirmation prompt: "This change will create a Branch — proceed?"
3. Branching menu with smart defaults:

| Carry-Over Item | Default | Description |
|-----------------|:-------:|-------------|
| Asset Library | Pre-checked | All loaded & saved assets |
| Display Features | Pre-checked | Ranking mode, output type, visual config |
| Team | Unchecked | Collaborator assignments |
| Context Docs/SOPs | Unchecked | Project documentation references |
| Agent Optimization Level | Unchecked | Agent autonomy setting |
| Notification Preferences | Unchecked | Per-user notification config |

4. User customizes carry-over selections
5. New Branched Wabb created with `parent_collection_id` → original
6. **Rankings NEVER carry over** — always starts fresh
7. Carried-over items are **copied** (not linked)

**Asset Library Carry-Over Storage:**
When "Asset Library" is checked during branching, all files from the parent collection's Supabase Storage path (`{parent_collection_id}/`) are copied to the new branch's storage path (`{new_collection_id}/`). Record rows are NOT copied — only the storage files. The branch starts with fresh records and rankings, but the uploaded assets are available for re-use via the record upload UI.

### Acceptance Criteria

- [ ] Owner can invite collaborators by email
- [ ] Collaborator can accept invite and gains correct role permissions
- [ ] Viewer cannot access ranking controls (graceful disabled state)
- [ ] RAVG calculates correctly with simple mean for 3+ rankers
- [ ] Weighted by role gives owner 2x weight
- [ ] Exclude outliers drops top/bottom 10%
- [ ] Custom weights apply per-member multipliers
- [ ] Super RAVG applies supervisor weight independently
- [ ] Owner can change RAVG formula and per-member weights in Settings
- [ ] RAVG recalculates when formula/weights change
- [ ] Context panel shows team progress (completion % per member)
- [ ] Branch creates new Wabb with parent reference + fresh rankings
- [ ] `branch_carry_over` JSONB correctly reflects user selections
- [ ] Quaternary label change auto-triggers Branch confirmation
- [ ] Sidebar progress dots update in real-time via Supabase Realtime
- [ ] RAVG updates in real-time as team members rank

### User Progress & Rank History

> Source: Wabbit-webapp.md §D (Rank History Gallery), PRD §7.3

**User progress view (Context Panel → TeamProgress):**
- Uses `user_progress` database view
- Shows completion % per collaborator
- Color-coded progress bars matching sidebar dot colors

**Rank History Gallery:**
- Dropdown: select team member (defaults to current user)
- Gallery view (like Instagram):
  - Ranked records: score shown + 50% opacity grey
  - Unranked records: clickable → opens condensed preview → can rank inline
  - "Go to Full Vote View" button to go back to main ranking page
- Option to view all team members' activity

---

## Wave 5 — Integrations & Agent Layer

> **Status:** ❌ Not Started — No MCP server, no OpenClaw skills, no API key system, no PWA, no magic links, no rate limiting. This is the critical differentiator wave.
>
> **Goal:** Agent API surface built. MCP server functional. OpenClaw skill pack created. Slack integration started.
>
> **Reference:** `docs/OPENCLAW_WABBIT_ARCHITECTURE.md` and `docs/OPENCLAW_IMPLEMENTATION_PLAN.md`

### Three-Layer Architecture

```
LAYER 1: "Normie"    → Wabbit Web App (Vite SPA) + PWA
LAYER 2: "Coding"    → Claude Code + MCP Server
LAYER 3: "Agent"     → OpenClaw Gateway + Wabbit Skills
              ═══════════════════════════════════
              SHARED: Supabase (PostgreSQL + Realtime + Auth)
```

> **Infrastructure Note:** Inngest event functions and Upstash rate limiting run in
> **Supabase Edge Functions** (Deno), NOT in the Vite SPA client. The Vite app is
> purely client-side; all server-side concerns (rate limiting, event fan-out, cron
> replacement) are handled by Edge Functions. The Inngest serve endpoint is an Edge
> Function, not a Vite route.

### Sub-Phases (from OPENCLAW_IMPLEMENTATION_PLAN.md)

| Sub-Phase | Name | Deliverable |
|-----------|------|-------------|
| 5.0 | Security Foundation | API key system (SHA-256 HMAC), auth middleware, rate limiting (Upstash Redis) |
| 5.1 | Agent Data Layer | `agent_events`, `agent_api_keys`, `agent_sessions` tables. Supabase Realtime enabled. SSE + REST endpoints |
| 5.2 | OpenClaw Integration | Wabbit skill pack (6 skills). End-to-end notification loop |
| 5.3 | MCP Server | `packages/mcp-server/` with 7 MCP tools. Published to npm |
| 5.4 | PWA + Mobile | manifest.json, service worker, Web Push (VAPID), offline caching |
| 5.5 | Scale + Monitoring | Inngest event functions, connection pooling, monitoring dashboard |

### Agent Database Tables (Migration 003)

```sql
-- API keys: SHA-256 HMAC hashed (not bcrypt — keys are high-entropy, not passwords)
CREATE TABLE agent_api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  short_token TEXT NOT NULL UNIQUE,       -- 8 chars, indexed for fast lookups
  long_token_hash TEXT NOT NULL,          -- HMAC-SHA-256(pepper, long_token)
  scopes TEXT[] DEFAULT '{}',
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,                -- null = active; soft-delete on revoke
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_api_keys_short_token ON agent_api_keys(short_token);

CREATE TABLE agent_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'new_record', 'ranking_submitted', 'ravg_updated',
    'window_closing', 'branch_created', 'collaborator_joined'
  )),
  payload JSONB NOT NULL DEFAULT '{}',
  collection_id UUID REFERENCES collections(id),
  processed BOOLEAN DEFAULT FALSE,
  source TEXT NOT NULL DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_events_user_unprocessed
  ON agent_events(user_id, created_at DESC) WHERE processed = FALSE;

ALTER PUBLICATION supabase_realtime ADD TABLE agent_events;

CREATE TABLE agent_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  api_key_id UUID REFERENCES agent_api_keys(id),
  agent_type TEXT NOT NULL CHECK (agent_type IN ('openclaw', 'claude_code', 'cloud_worker', 'custom')),
  platform TEXT,
  status TEXT DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected')),
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- RLS on all agent tables
ALTER TABLE agent_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own keys" ON agent_api_keys FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own events" ON agent_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users see own sessions" ON agent_sessions FOR SELECT USING (auth.uid() = user_id);
```

### API Key Format

```
wab_live_BRTRKFsL_51FwqftsmMDHHbJAMEXXHCgG
│        │         │
│        │         └── Long token (32 chars, shown once, only hash stored)
│        └──────────── Short token (8 chars, public identifier)
└───────────────────── Prefix: wab_live_ / wab_test_ / wab_dev_
```

**Permission Scopes:** `read:collections`, `write:collections`, `read:records`, `write:rankings`, `read:notifications`, `write:notifications`, `subscribe:realtime`, `push:notifications`

### MCP Tools

**High-Level Tools** (what agents use 90% of the time — opinionated happy-path):

| Tool | Scopes Required | Description |
|------|----------------|-------------|
| `wabbit_launch_ranking` | `write:collections`, `write:records` | **One-call setup:** provision user if needed, create Wabb, populate records, return magic link. This is the agent-first onboarding entry point. |
| `wabbit_get_results` | `read:collections` | Poll or webhook for completed rankings, return sorted leaderboard |
| `wabbit_quick_poll` | `write:collections`, `write:records` | Binary yes/no on small set (< 10 records), even faster flow |

**Granular CRUD Tools:**

| Tool | Scopes Required | Description |
|------|----------------|-------------|
| `wabbit_search_wabbs` | `read:collections` | Search collections by criteria |
| `wabbit_get_wabb` | `read:collections` | Full Wabb details + records |
| `wabbit_get_records` | `read:records` | Records in a collection |
| `wabbit_submit_ranking` | `write:rankings` | Submit a score/choice for a record |
| `wabbit_get_leaderboard` | `read:collections` | Records ranked by RAVG |
| `wabbit_get_progress` | `read:collections` | User progress on a Wabb |
| `wabbit_create_wabb` | `write:collections` | Create a new collection |

### Agent-First Onboarding Flow

Agents act proactively — they create value and notify humans. See `v2MONETIZATION.md` §6 for full strategy.

**`wabbit_launch_ranking` request:**
```json
{
  "human_email": "user@company.com",
  "wabb_name": "Landing Page Heroes — Round 1",
  "records": [
    { "url": "https://...", "label": "Option A" },
    { "url": "https://...", "label": "Option B" }
  ],
  "ranking_mode": "one_axis",
  "message": "Rank these by visual impact. Top 5 go to production."
}
```

**Response:**
```json
{
  "wabb_id": "abc123",
  "magic_link": "https://wabbit.app/r/x7k9m2",
  "records_count": 40,
  "estimated_rank_time": "4 min",
  "suggested_message": "I put together a ranking session for your 40 hero images..."
}
```

**Magic link requirements:**
- Authenticates user (no login screen, JWT embedded)
- Deep links to specific Wabb (iOS Universal Link or mobile web fallback)
- Short, clean URL: `wabbit.app/r/{6-char-code}`
- Expires gracefully (7-30 days)
- If user doesn't exist, provisions Free account invisibly

**Tier gating on agent access:**
- **Free:** Read-only (agents can check results, not create)
- **Pro ($29/mo):** Full CRUD — agents can create Wabbs, populate records, read results
- **Team ($149/mo):** + Batch operations + webhook subscriptions
- **Business ($299/mo):** Unlimited + custom rate limits

**MCP Configuration (`.claude/.mcp.json`):**

```json
{
  "mcpServers": {
    "wabbit": {
      "command": "npx",
      "args": ["-y", "wabbit-mcp-server"],
      "env": {
        "WABBIT_API_URL": "https://wabbit.ai",
        "WABBIT_API_KEY": "wab_live_..."
      }
    }
  }
}
```

### OpenClaw Skills

```
~/.openclaw/workspace/skills/wabbit/
├── SKILL.md              # Skill manifest
├── search-wabbs.md       # "Search for collections matching criteria"
├── rank-record.md        # "Score a record in a Wabb"
├── my-progress.md        # "Show my ranking progress across Wabbs"
├── get-leaderboard.md    # "Show top-ranked records in a Wabb"
├── wabb-detail.md        # "Get full details on a specific Wabb"
└── digest.md             # "Generate my daily/weekly ranking summary"
```

### Acceptance Criteria

- [ ] User can create/revoke API keys from Settings
- [ ] Agent can authenticate with Bearer token and access scoped endpoints
- [ ] Agent events table receives events when rankings are submitted
- [ ] Supabase Realtime broadcasts events to subscribed agents
- [ ] MCP server installable and functional from Claude Code
- [ ] `wabbit_launch_ranking` one-call flow works (provision + create + magic link)
- [ ] Magic link authenticates user and deep links to Wabb
- [ ] OpenClaw skill pack works end-to-end (query → action → confirmation)
- [ ] PWA installable on mobile with service worker
- [ ] Rate limiting active on all agent routes (Upstash Redis), tiered by subscription
- [ ] API response includes `suggested_message` template for agent UX
- [ ] API documentation covers all endpoints (OpenAPI/Swagger)

---

## Wave 6 — Record Population Pipeline

> **Status:** ~50% — Upload UI components built (`RecordUploader`, `BulkUploader`, `RecordForm`, `AddRecordsModal`). Edge functions `ingest-records/` and `manage-windows/` scaffolded early. Window expiration logic, window number tracking, and 3rd-party connectors not done.
>
> **Goal:** Records can be populated into Wabbs manually, via API, or on a timer/schedule.

### Tasks

| # | Task | Deliverable | Status |
|---|------|-------------|--------|
| 6.1 | Manual record upload | `RecordUploader.tsx` — drag-and-drop + file picker | ✅ Built |
| 6.2 | Bulk upload | `BulkUploader.tsx` — multiple files → multiple records | ✅ Built |
| 6.3 | API record ingestion | `supabase/functions/ingest-records/` — webhook endpoint | ⚠️ Scaffolded, not verified against spec |
| 6.4 | Content source config | Per-Wabb: which API, what prompt, how often | ❌ Not started |
| 6.5 | Timer/schedule | `supabase/functions/manage-windows/` — window expiration + increment | ⚠️ Scaffolded, logic incomplete |
| 6.6 | Window number tracking | Records tagged with current `window_number` | ❌ Not started |

### Manual Upload — File Acceptance by Output Type

| Output Type | Accepted Formats |
|-------------|-----------------|
| Image | jpg, png, webp, gif, svg |
| Video | mp4, webm, mov |
| Audio | mp3, wav, ogg |
| Text | Entered inline (no file upload) |
| Deck | pdf, pptx |
| 3D | glb, gltf, fbx |

Upload to Supabase Storage → create `records` row with storage URL in `metadata`.

### Ingest Webhook Payload (supabase/functions/ingest-records/)

```typescript
interface IngestPayload {
  collectionId: string
  records: {
    title: string
    description?: string
    metadata: {
      type: 'image' | 'video' | 'text' | 'audio' | '3d' | 'deck'
      sourceUrl?: string
      sourceApi?: string        // e.g., 'midjourney', 'dall-e', 'runway'
      generationPrompt?: string
      [key: string]: unknown
    }
  }[]
}
```

### Zapier/Automation Pipeline Pattern

External automation tools (Zapier/Make/n8n) can generate content and POST to the ingest endpoint:

```
Schedule → AI Generation (ChatGPT/DALL-E/Midjourney/Sora)
    → Transform payload → POST to ingest-records Edge Function
    → Records appear in Wabb automatically
```

### Content Source Integrations (Inbound)

| Source | Content Type | Population Method |
|--------|-------------|-------------------|
| AI Image Models (DALL-E, Midjourney, Stable Diffusion) | Images | API / webhook |
| AI Video Models (Sora, Runway) | Video | API / webhook |
| AI Text Models (GPT, Claude) | Copy/text | API |
| Manual Upload | Any | Drag-and-drop |
| Apify Scrapers | Mixed | Agentic pipeline |
| Timer/Schedule | Any | Cron-based from connected APIs |

### Acceptance Criteria

- [ ] Manual drag-and-drop upload creates records with storage URLs
- [ ] Bulk upload handles 10+ files in one action
- [ ] Ingest webhook creates records from external API calls
- [ ] API authentication required on ingest endpoint (API key)
- [ ] Records tagged with correct `window_number`
- [ ] Window expiration detected and handled (lock sprint, increment, notify)

---

## Wave 7 — Monetization & Billing

> **Status:** ❌ Not Started — No Stripe integration, no feature gates, no usage metering, no tier enforcement.
>
> **Goal:** Subscription infrastructure built. Feature gates enforced. Usage metering active. Stripe integration functional.
>
> **Reference:** `v2MONETIZATION.md` — Pricing model, tier definitions, agent-first onboarding strategy

### Sub-Phases

| Sub-Phase | Name | Deliverable |
|-----------|------|-------------|
| 7.0 | Subscription Schema | `subscription_tier` column on profiles, subscription tables, usage tracking tables |
| 7.1 | Stripe Integration | Stripe Checkout, webhook handlers, subscription lifecycle (create/upgrade/cancel) |
| 7.2 | Feature Gate Middleware | Tier-based enforcement on RAVG formulas, Wabb limits, agent access, integrations |
| 7.3 | Usage Metering | API call counting, storage tracking, quota enforcement with overage handling |
| 7.4 | Upgrade Prompts | In-app upgrade flows, agent-surfaced upgrade suggestions, pricing page on landing site |

### Database Schema (Migration 005)

```sql
-- Add subscription tier to profiles
ALTER TABLE profiles ADD COLUMN subscription_tier TEXT NOT NULL DEFAULT 'free'
  CHECK (subscription_tier IN ('free', 'pro', 'team', 'business'));
ALTER TABLE profiles ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE profiles ADD COLUMN stripe_subscription_id TEXT;
ALTER TABLE profiles ADD COLUMN subscription_status TEXT DEFAULT 'active'
  CHECK (subscription_status IN ('active', 'past_due', 'canceled', 'trialing'));

-- API usage tracking (daily buckets)
CREATE TABLE api_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  calls_count INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);

ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own usage" ON api_usage FOR SELECT USING (auth.uid() = user_id);

-- Storage usage tracking
CREATE TABLE storage_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  bytes_used BIGINT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE storage_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own storage" ON storage_usage FOR SELECT USING (auth.uid() = user_id);
```

### Tier Limits (enforced at application + RLS level)

| Limit | Free | Pro ($29) | Team ($149) | Business ($299) |
|-------|------|-----------|-------------|-----------------|
| Creators | 1 | 3 | 10 | 25 |
| Active Wabbs | 3 | Unlimited | Unlimited | Unlimited |
| Ranking Modes | 1-axis + binary | All 4 | All 4 + label customization | All 4 |
| RAVG Formulas | simple_mean | + weighted + exclude_outliers | + custom + Super RAVG | Full + cross-Wabb |
| Agent Access | Read-only | Full CRUD | + Batch + webhooks | Unlimited |
| API Calls/day | 100 | 1,000 | 10,000 | Unlimited |
| Storage | 2 GB | 50 GB | 500 GB | 2 TB |
| iOS App | Yes | Yes | Yes | Yes |

### Edge Functions (Wave 7)

| Function | Purpose |
|----------|---------|
| `supabase/functions/stripe-webhook/` | Handle Stripe subscription events (checkout.session.completed, invoice.paid, customer.subscription.updated/deleted) |
| `supabase/functions/check-tier/` | Validate user's tier before allowing gated actions |
| `supabase/functions/usage-meter/` | Increment API call counter, check quota, return 429 with upgrade prompt when exceeded |

### Acceptance Criteria

- [ ] `subscription_tier` column on profiles, defaults to 'free'
- [ ] Stripe Checkout flow creates subscription and updates tier
- [ ] Webhook handles upgrades, downgrades, cancellations
- [ ] Free tier limited to 3 active Wabbs (enforced)
- [ ] RAVG formula restricted by tier (enforced)
- [ ] Agent CRUD blocked on Free tier, functional on Pro+
- [ ] API call counter increments per request, returns 429 at limit
- [ ] Storage usage tracked, upload blocked when quota exceeded
- [ ] Upgrade prompt shown when tier limit hit (in-app + agent response)
- [ ] Landing page pricing section reflects 4 tiers

---

## Phase 2+ Roadmap

### Phase 2: Native iOS App (2026 H2)

**iOS is free at all tiers** — it's a distribution channel, not a revenue gate. See `v2MONETIZATION.md` §4 Layer 2 for rationale.

- Gesture system is the star
- UIKit gesture recognizers bridged to SwiftUI
- CoreHaptics feedback at score boundaries
- Symmetry with web ranking experience
- 4corners category swiping exploration
- Magic link deep linking (Universal Links → straight to Wabb)
- Rankings sync to RAVG regardless of tier

**Gesture Mapping (from ref/RankingGestureView.swift):**

| Gesture | Score Behavior |
|---------|---------------|
| Tap | Quick score = 5.0, auto-submit |
| Tap + Drag | Anchor 5.0, vertical maps to 0-10 (300pt = full range) |
| Long Press (0.5s) | Secondary action — options menu |
| Two-Finger Tap | Undo last ranking |

**Haptic Feedback:** Integer boundaries: intensity 0.4. Key scores (0, 1, 5, 9, 10): intensity 0.8.

### Phase 3: Slack + Social Scheduling (2027)

- Slack Marketplace App
- Notifications for new records to rank
- Interactive ranking directly in Slack (score buttons in messages)
- Edge Functions for Slack event handling
- Social Media Scheduler (cross-platform publishing from ranked content)

### Phase 4: Suite Expansion (2027+)

- Timeline Editor (SoundCloud-esque timestamp-based ranking — distinct from basic video player)
- Mobile P2P payment features
- Template library with marketplace ("Crowd Coffees")

### Phase 5: Advanced (2028+)

- 3D content creation tooling
- Robotics integration for automated capture
- Advanced analytics and data integrations
- Model fine-tuning from ranking data

---

## Deferred Features (NOT YET SCOPED)

These features are referenced in source docs but have no build spec yet. Explicitly out of scope for Phase 1.

| Feature | Source | Notes |
|---------|--------|-------|
| **Wabb Proposal** | GLOSSARY.md | Request from Contributor to Owner for new/forked Wabb |
| **Wabb Path** | GLOSSARY.md | Pipeline view from creation to end result |
| **Wabb Timeline** | GLOSSARY.md | User activity timeline view |
| **ALL EVER Table** | Wabbit-webapp.md §D | Raw database view of all records across all Wabbs |
| **Asset Library** (standalone view) | GLOSSARY.md | Central repository of all assets — referenced in branching but no standalone view |
| **Dark/Light Mode** | — | Glassmorphism is dark-first; light mode would need full theme system |
| **Vetted Ref workflow** | PRD §4 | The "vet" selection and reference-based generation flow needs detailed UX spec |
| **Admin Dashboard** | — | Multi-client admin view for B2B — needs scoping |
| **Suggested Prompt Ranking** | — | Ranking prompts (not just content) — separate ranking target type |
| **RAVG-based record routing** | — | Auto-route: RAVG 8+ → POST, 4-7.9 → MAYBE, 0-3.9 → Delete. Needs rules engine |
| **HRR (Hit Record & Roll)** | PRD §4, GLOSSARY.md | Spontaneous content creation approach. No UI implementation yet — content approach taxonomy for future UX differentiation |
| **P2P (Plan to Perfection)** | PRD §4, GLOSSARY.md | Methodical storyboarded content approach. No UI implementation yet — content approach taxonomy for future UX differentiation |

---

## Environment Variables

### Wave 0-4 (Core App)

| Variable | Sensitive | Purpose |
|----------|-----------|---------|
| `VITE_SUPABASE_URL` | No | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | No | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role (server-side only) |

### Wave 5 (Agent Layer)

| Variable | Sensitive | Purpose |
|----------|-----------|---------|
| `API_KEY_HMAC_PEPPER` | Yes | API key HMAC hashing pepper |
| `UPSTASH_REDIS_REST_URL` | No | Rate limiting Redis URL |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | Rate limiting Redis auth |
| `SUPABASE_JWT_SECRET` | Yes | JWT minting for agent Realtime access |
| `VAPID_PUBLIC_KEY` | No | Web Push public key |
| `VAPID_PRIVATE_KEY` | Yes | Web Push private key |
| `VAPID_SUBJECT` | No | Web Push contact email |
| `INNGEST_SIGNING_KEY` | Yes | Inngest webhook validation |
| `INNGEST_EVENT_KEY` | Yes | Inngest event sending |

### Wave 7 (Monetization)

| Variable | Sensitive | Purpose |
|----------|-----------|---------|
| `STRIPE_SECRET_KEY` | Yes | Stripe API (server-side only) |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook signature verification |
| `VITE_STRIPE_PUBLISHABLE_KEY` | No | Stripe Checkout (client-side) |

---

## Acceptance Criteria by Wave

### Wave 0: Dev Environment ✅
- [x] Project scaffolded (web/, landing/, supabase/)
- [x] Supabase project created
- [x] TypeScript types generated
- [x] Dev servers start (:5173 + :4321)

### Wave 1: Foundation ✅
- [x] Auth working (Google + GitHub OAuth)
- [x] Database schema applied with RLS
- [x] Three-column layout renders
- [x] Protected routing functional
- [x] Storage bucket created with RLS

### Wave 2: Core Ranking ✅
- [x] Full CRUD on folders and Wabbs
- [x] All 4 ranking modes working (1-axis, 2-axis, Quaternary, Binary)
- [x] Upsert ranking persists correctly
- [x] "You're All Caught Up" shown when done
- [x] Leaderboard displays ranked records
- [x] Progress dots update

### Wave 3: UI Polish ⚠️ ~90%
- [x] Glassmorphism styling consistent (DO/DON'T rules followed)
- [x] Settings popup with 6 tabs functional
- [x] Video player with chapter markers
- [x] Layer viewer + audio player working
- [ ] Landing page live (10 sections, Astro, Schema.org) *(deferred — stub only)*

### Wave 4: Collaboration ⚠️ ~60% (components built, needs integration testing)
- [ ] Multi-user invites and roles (Owner/Contributor/Viewer) *(UI + edge fn scaffolded, untested e2e)*
- [x] RAVG calculation engine with all 4 formulas *(engine + unit tests built)*
- [ ] Super RAVG with separate supervisor weight *(engine code exists, UI integration unclear)*
- [x] Branching flow with smart defaults *(BranchingMenu built)*
- [ ] Real-time updates via Supabase Realtime *(subscription exists, not fully wired)*

### Wave 5: Agent Layer ❌ Not Started
- [ ] API key system functional (SHA-256 HMAC)
- [ ] MCP server published and working (including `wabbit_launch_ranking`)
- [ ] Magic link auth + deep linking functional
- [ ] OpenClaw skills functional
- [ ] PWA installable
- [ ] Rate limiting active (Upstash Redis), tiered by subscription

### Wave 6: Population ⚠️ ~50% (upload UI built, pipeline incomplete)
- [x] Manual upload + bulk upload UI components built *(RecordUploader, BulkUploader, RecordForm, AddRecordsModal)*
- [ ] API ingestion endpoint functional *(edge fn scaffolded, not verified against spec)*
- [ ] Window number tracking correct
- [ ] Window expiration handled *(edge fn scaffolded, logic incomplete)*

### Wave 7: Monetization & Billing ❌ Not Started
- [ ] Stripe subscription flow working (checkout → webhook → tier update)
- [ ] Feature gates enforced (Wabb limit, RAVG formulas, agent access)
- [ ] API call metering with quota enforcement
- [ ] Storage metering with quota enforcement
- [ ] Upgrade prompts in-app and via agent API responses
- [ ] Landing page pricing section live

### Undocumented Additions (not in original build plan)
- `apps/wabbit/studio/` — Remotion 4 project for shortform video compositions
- `apps/wabbit/marketing/` — Shortform marketing scripts
- `supabase/functions/invite-by-email/` — Email invitation edge function (built ahead of Wave 5)
- `supabase/migrations/004_fix_rls_recursion.sql` — RLS fix migration (not in wave spec)

---

## Open Questions

| # | Question | Status |
|---|----------|--------|
| 1 | ~~RAVG weighting formula~~ | **RESOLVED** — Default simple mean + customizable per-Wabb |
| 2 | **3-axis ranking** | **RESOLVED** — Explicitly NO. 1-axis, 2-axis, Quaternary, Binary only |
| 3 | **Timeline Rank mode** | Phase 4+. How does it interact with standard record ranking? Separate mode or same Wabb? |
| 4 | **Crypto/Crowd Coffees** | How tightly coupled to MVP? Coinbase Base integration scope? |
| 5 | **Template marketplace** | Phase 1 or later? Minimum template sharing flow? |
| 6 | **4corners mobile UX** | Replacement for 1-10 slider on mobile, or additional mode? |
| 10 | ~~iOS tier gating~~ | **RESOLVED** — iOS is free at all tiers. Distribution channel, not revenue gate. See v2MONETIZATION.md §4 |
| 11 | ~~Pricing model (seat vs flat)~~ | **RESOLVED** — Flat tier pricing with unlimited rankers. Not per-seat. See v2MONETIZATION.md §5 |
| 7 | ~~Branched Wabb mechanics~~ | **RESOLVED** — Rankings never carry over. Smart defaults menu. |
| 8 | ~~Quaternary labels~~ | **RESOLVED** — Configurable per-Wabb. Change triggers Branch. |
| 9 | **Separate Supabase project** | New project for Wabbit content ranking vs. sharing with existing monorepo apps? (Recommended: separate) |

---

## Testing Strategy

### Unit Tests (Vitest)

**Files:** `src/**/*.test.ts`

**Priority test targets:**

| Module | What to Test |
|--------|-------------|
| `lib/ravg.ts` | All 4 RAVG formulas + Super RAVG with edge cases (0 rankers, 1 ranker, 100 rankers, all same score, extreme outliers) |
| `lib/schemas/newWabb.ts` | Zod validation: valid/invalid inputs, conditional fields |
| `lib/api/*.ts` | Supabase query construction (mock Supabase client) |
| `components/ranking/*.tsx` | Ranking controls render correctly per mode, score/choice callbacks fire |
| `components/sidebar/ProgressDot.tsx` | Color mapping at boundary values (0%, 20%, 40%, 70%, 100%) |

### Integration Tests

**Test database interactions with Supabase local instance:**

```bash
supabase start        # Local Supabase
npm run test:e2e      # Playwright or Vitest with real DB
```

**Key flows to test:**
1. Sign up → profile created (trigger)
2. Create collection → collaborator added (trigger)
3. Submit ranking → upsert behavior (create, then update)
4. RLS: user A can't see user B's collections
5. Branch collection → parent linked, rankings not copied
6. Realtime subscription fires on ranking insert

### E2E Tests (Playwright)

**Critical paths:**
1. Login → OAuth redirect → landing on home page
2. Create Wabb → add records → rank all → see leaderboard
3. Invite collaborator → both users rank → RAVG calculates
4. Branch Wabb → verify carry-over vs fresh start
5. Mobile: hamburger menu → navigate → rank

---

## Deployment Strategy

### Web App (Vite SPA)

| Aspect | Choice | Notes |
|--------|--------|-------|
| **Platform** | Vercel or Cloudflare Pages | Static files — no server needed |
| **Build** | `npm run build` → `dist/` | Vite outputs static assets |
| **Domain** | TBD (wabbit.ai or similar) | Separate from wabbit-rank.ai (real estate) |
| **SSL** | Automatic via platform | |
| **Preview** | PR previews on Vercel | |

### Landing Page (Astro)

| Aspect | Choice | Notes |
|--------|--------|-------|
| **Platform** | Vercel or Cloudflare Pages | Static HTML output |
| **Build** | `npm run build` → `dist/` | Pure HTML, minimal JS |
| **Domain** | Same domain, different subdomain | e.g., wabbit.ai (landing) vs app.wabbit.ai (SPA) |

### Supabase

| Aspect | Choice | Notes |
|--------|--------|-------|
| **Plan** | Pro ($25/mo minimum) | Required for: Realtime, Edge Functions, custom domains |
| **Region** | US East (closest to users) | |
| **Migrations** | `supabase db push` or migration files | Track in `supabase/migrations/` |

### Deployment Environment Variables

**Web app (Vercel):**
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

**Edge Functions (Supabase Secrets):**
```
SUPABASE_SERVICE_ROLE_KEY
SLACK_BOT_TOKEN          # Phase 3
SLACK_SIGNING_SECRET     # Phase 3
```

---

## Security Considerations

### Authentication
- Supabase Auth with Google + GitHub OAuth
- No password-based auth in Phase 1 (OAuth only)
- Profile auto-created via `SECURITY DEFINER` trigger (bypasses RLS safely)
- Agent auth via long-lived API keys (stored as HMAC-SHA-256 hash — keys are high-entropy, not passwords, so bcrypt is unnecessary)

### Data Access
- RLS enabled on ALL tables — no exceptions
- Collections only visible to owner + collaborators
- Rankings: read all in your collections, write only your own (owner/contributor role required)
- Viewer role cannot insert or update rankings (RLS policy checks collaborator role)
- Storage access scoped to collection collaborators

### Client-Side
- Supabase anon key is public (designed for this — RLS does the heavy lifting)
- Service role key NEVER in client code
- CORS configured on Supabase project
- CSP headers on Vercel deployment

### Agent Layer
- API keys have scoped permissions (read-only, read-write, admin)
- API keys can be revoked by user (soft-delete via `revoked_at`)
- API keys have optional expiration
- Rate limiting on agent endpoints (Upstash Redis)
- Short token (8 chars) for fast lookup, long token HMAC-SHA-256 hashed

---

## Dependency Chain

```
Wave 0 (Dev Environment)
    ↓
Wave 1.1 (Supabase schema + auth)
    ↓
Wave 1.2-1.9 (Vite scaffold + auth + stores) ←── Landing scaffold [parallel]
    ↓                                                    ↓
Wave 1.10 (Storage setup)                    Landing page content (3.10)
    ↓
Wave 2.1 (API layer — folders, collections, records, rankings)
    ↓
Wave 2.8 (Ranking controls — 4 modes)
    ↓
Wave 2.6 (WabbPage) ←── Wave 2.5 (New Wabb form) [parallel]
    ↓                           ↓
Wave 3.3 (Wabb Settings)  Wave 2.11 (Leaderboard)
    ↓
Wave 3.2 (Three-column layout)
    ↓
Wave 3.6 (Sidebar) + Wave 3.5 (Context panel) + Wave 3.7-3.8 (Media) [parallel]
    ↓
Wave 3.1 (Glassmorphism pass) + Wave 3.10 (Landing page build) [parallel]
    ↓
Wave 4.2 (Collaborator invites) → Wave 4.4 (RAVG engine) → Wave 4.9 (Branching)
    ↓
Wave 4.7-4.8 (User progress & history)
    ↓
Wave 5.0-5.1 (Agent API + DB tables + Security)
    ↓
Wave 5.2 (OpenClaw) + Wave 5.3 (MCP) [parallel]
    ↓
Wave 5.4 (PWA + Mobile)
    ↓
Wave 5.5 (Scale + Monitoring)
    ↓
Wave 6.1 (Manual upload) → Wave 6.3 (API ingest) → Wave 6.5 (Window management)
```

---

## File Count Summary

| Wave | New Files | Focus |
|------|----------|-------|
| **Wave 0** | ~5 | Dev environment, CLAUDE.md, workspace config |
| **Wave 1** | ~30 | Scaffold (Vite, Astro, configs, stores, auth, base UI, storage) |
| **Wave 2** | ~20 | Core ranking (API layer, ranking controls, forms, WabbPage, settings, leaderboard) |
| **Wave 3** | ~25 | Three-column layout, sidebar, context panel, glassmorphism, landing page, media |
| **Wave 4** | ~10 | Collaboration (invites, RAVG engine, branching, history) |
| **Wave 5** | ~20 | Agent layer (Edge Functions, DB tables, MCP, OpenClaw, PWA, monitoring) |
| **Wave 6** | ~8 | Record population (upload, API ingest, window management) |
| **Total** | **~118** | |

---

## Cross-Reference: PRD to Build Steps

| PRD Section | Build Wave | Status |
|-------------|-----------|--------|
| §2 Problem Statement | Landing page (3.10) | Content only |
| §3 Target Users | Landing page (3.10) | Content only |
| §4 Core Concepts | All waves | Terminology used throughout |
| §5.1 Platform Architecture | Wave 0, Wave 1 | Scaffolding |
| §5.2 Web App Layout | Wave 3.2, 3.5, 3.6 | Three-column + sidebar + context |
| §5.3 iOS Gesture System | **Deferred → Phase 2** | RankingGestureView.swift ready |
| §6 Data Model | Wave 1.1 | Schema deployment |
| §7.1 Create a Wabb | Wave 2.5 | New Wabb form. "Connected API/source" and "Timer/schedule" fields deferred to Wave 6 (Record Population Pipeline) |
| §7.2 Rank Records | Wave 2.6-2.10 | Ranking flow + WabbPage |
| §7.3 Team Consensus | Wave 4.2-4.3 | Collaborators + RAVG |
| §7.4 Branch a Wabb | Wave 4.9-4.10 | Branching flow |
| §7.5 Customize RAVG | Wave 4.4-4.6, 3.3 | RAVG engine + settings UI |
| §7.6 Slack Integration | Wave 5.2 | Edge Functions + Slack API |
| §8 Authentication | Wave 1.1-1.5 | Supabase Auth + OAuth |
| §9 Integrations Matrix | Wave 5, 6 | Agent layer + record ingest |
| §10 Business Model | Landing page (3.10) | Pricing section |
| §11 Phase Roadmap | All waves | Mapped above |
| §12 Build Tasks | All waves | Covered in TASKS.md cross-ref |
| §13 Development Approach | Wave 0 | Ralph Wiggum + TAC |
| §14 Success Metrics | Post-launch | Tracking setup needed |
| §15 Open Questions | Various | Resolved items implemented, open items deferred |

---

## Appendix: Terminology Quick Reference

| Term | Definition |
|------|-----------|
| **Wabb** | A project/collection — set of records to be ranked |
| **Record** | Individual item within a Wabb (image, video, text, etc.) |
| **Ranking** | User's score (0.0-10.0) or choice (A/B/C/D, Yes/No) for a record |
| **RAVG** | Ranked Average — customizable per-Wabb (default: simple mean) |
| **Super RAVG** | RAVG + supervisor weight (separately configurable) |
| **Branched Wabb** | Offshoot with fresh rankings. Parent reference via `parent_collection_id` |
| **Wabb Time Window** | Sprint lifecycle. Closing locks generation; rankings remain visible |
| **Vetted Ref** | Wabb type centered on replicating aspects of a proven end result |
| **Agent Optimization Level** | No / Low / Medium / High. Phase 1: UI toggle only |
| **HIL** | Human in the Loop — core value proposition |
| **GEO** | Generative Engine Optimization — AI crawler visibility |
| **SPA** | Single Page Application — behind auth, no SSR needed |
| **OpenClaw** | Open-source AI agent framework. Runs locally. WebSocket gateway |
| **MCP** | Model Context Protocol. Exposes Wabbit as tools for AI assistants |

---

> **Next Steps:** Begin Wave 0 scaffolding. Set up Supabase project. Install dependencies.
