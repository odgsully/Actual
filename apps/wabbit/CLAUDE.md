# Wabbit — CLAUDE.md

## What is Wabbit

Gesture-driven content ranking tool with async collaboration. Human-in-the-Loop for AI-generated content (images, video, text, 3D, audio, decks). Teams rank generated media to reach consensus via RAVG (Ranked Average).

**Not to be confused with** Wabbit RE (`apps/wabbit-re`) — the real estate property ranking app at wabbit-rank.ai.

## Architecture

- **Web App**: Vite 6 + React 18 + React Router 7 + Tailwind 4 + Zustand (SPA, no SSR)
- **Landing Page**: Astro 5 + React Islands (static HTML for SEO/GEO)
- **Backend**: Supabase (PostgreSQL + GoTrue Auth + Realtime + Storage + Edge Functions)
- **Agent Layer**: OpenClaw + MCP Server — parallel Supabase consumers, NOT clients of the web app
- **Diagrams**: `ref/diagrams/*.svg`

All three consumer layers (Web App, MCP, OpenClaw) connect directly to Supabase. The agent API lives in Supabase Edge Functions (Deno), not in the web framework.

## Key Files

| File | Purpose |
|------|---------|
| `v2BUILD_PLAN.md` | Master build document — source of truth for implementation |
| `v2MONETIZATION.md` | Monetization strategy, tier definitions, agent-first onboarding |
| `ref/schema.sql` | Production-ready database schema (all tables, RLS, triggers, views) |
| `ref/diagrams/monetization.svg` | Visual monetization architecture diagram |
| `ref/docs/ARCHITECTURE.md` | Full technical architecture |
| `ref/docs/PRD.md` | Product requirements document |
| `ref/docs/GLOSSARY.md` | Canonical terminology definitions |
| `ref/docs/INTEGRATIONS.md` | Integration priority tiers and phasing |
| `ref/core/Wabbit-webapp.md` | Core product concept document |
| `ref/page.tsx` | Reference ranking page component |
| `ref/RankingGestureView.swift` | Reference iOS gesture view |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Build | Vite 6, Turborepo |
| UI | React 18, React Router 7, TypeScript |
| Styling | Tailwind 4, Glassmorphism design system |
| State | Zustand (3 stores: ranking, sidebar, layout) |
| DnD | @dnd-kit (folder tree reorganization) |
| PWA | vite-plugin-pwa (service worker, Web Push, install prompt) |
| Landing | Astro 5, React islands, Schema.org JSON-LD |
| Auth | Supabase GoTrue (Google + GitHub OAuth) |
| Database | Supabase PostgreSQL with Row Level Security |
| Realtime | Supabase Realtime (WebSocket) |
| Storage | Supabase Storage (S3-compatible) |
| Server Logic | Supabase Edge Functions (Deno runtime) |
| Agent | OpenClaw (local gateway), MCP Server (Node.js npm package) |

## Build Waves

| Wave | Name | Status | Key Deliverables |
|------|------|--------|-----------------|
| 0 | Dev Environment | ✅ Done | Vite/Astro scaffold, Supabase project, Turborepo config |
| 1 | Foundation | ✅ Done | OAuth auth, Zustand stores, 3-column layout shell, storage bucket |
| 2 | Core Ranking | ✅ Done | Folder CRUD, 4 ranking modes, sidebar tree, leaderboard, progress dots |
| 3 | UI Polish | ✅ Done | Glassmorphism system, settings popup (6 tabs), video player, layer viewer. Landing page (10 sections). InteractiveDemo React island deferred |
| 4 | Collaboration | ✅ Done | RAVG engine + unit tests, collaborator API, branching menu, realtime hardened (callbackRef, debounce, reconnection). RAVGDisplay prop mismatch documented |
| 5 | Integrations | ❌ 0% | OpenClaw skills, MCP server (incl. `wabbit_launch_ranking`), agent onboarding, magic links |
| 6 | Record Population | ✅ Done | Upload UI, records API (createRecordWithAsset, bulkCreateRecords), manage-windows edge fn (jump-to-correct-window). Known: duration change retroactive |
| 7 | Monetization | ❌ 0% | Stripe subscriptions, feature gates, usage metering, upgrade prompts |
| Phase 2+ | Mobile & Advanced | — | iOS native (SwiftUI, free all tiers), Timeline Rank mode, Remotion video assembly (8-node templates + fal.ai), real-time notifications |

## Database

### Core Tables
`profiles`, `folders`, `collections`, `records`, `rankings`, `collaborators`

### Agent Tables (Wave 5)
`agent_api_keys`, `agent_events`, `agent_sessions`

### Monetization Tables (Wave 7)
`api_usage`, `storage_usage` (+ `subscription_tier` column on `profiles`)

### PWA Table (Wave 5)
`push_subscriptions`

### Views
`record_scores`, `record_choices`, `collection_leaderboard`, `user_progress`

### Key Enums
`wab_type` (standard, vetted_ref), `ranking_mode` (one_axis, two_axis, quaternary, binary), `output_type` (image, video, text, 3d, audio, deck), `collaborator_role` (owner, contributor, viewer), `agent_optimization_level` (none, low, medium, high)

## Roles & RLS

| Role | Can View | Can Rank | Can Add Records | Can Manage |
|------|----------|----------|-----------------|-----------|
| Owner | Yes | Yes | Yes | Full CRUD |
| Contributor | Yes | Yes | Yes | No |
| Viewer | Yes | No | No | No |

Rankings INSERT/UPDATE policies verify collaborator role — not just `auth.uid()`.

## Ranking Modes

| Mode | Input | Storage |
|------|-------|---------|
| 1-axis | 0–10 slider (default) | `score` column (numeric) |
| 2-axis | Category-based X/Y | `score` column |
| Binary | Yes / No | `choice` column |
| Quaternary | A/B/C/D (configurable labels) | `choice` column |

Changing a Quaternary label triggers a Branched Wabb (with user confirmation).

## RAVG System

- **Level 1 (Team RAVG)**: Configurable per-Wabb formula — `simple_mean`, `weighted_by_role`, `exclude_outliers`, `custom`. Per-member weight multipliers via `ravg_member_weights` JSONB.
- **Level 2 (Super RAVG)**: Owner score applied ON TOP of team RAVG with separate `supervisor_weight`. Owner is **excluded** from level 1 calculation.
- When only the owner has ranked, Super RAVG returns their score directly.

## Zustand Stores

| Store | Key State |
|-------|----------|
| `useRankingStore` | currentRecordIndex, pendingScore, rankings Map, submitRanking() |
| `useSidebarStore` | expandedFolders, activeFilters, sortOrder, searchQuery |
| `useLayoutStore` | contextPanelOpen, mobileDrawerOpen |

## Three-Column Layout

```
Sidebar (280px) | Main Content (flex-1) | Context Panel (320px, collapsed default)
```

- **Desktop**: CSS Grid, all 3 columns visible
- **Tablet**: Context panel collapses to toggle button
- **Mobile**: Sidebar becomes hamburger drawer, context panel hidden

## Design System — Glassmorphism

Dark backgrounds (#0a0a0f), frosted glass effects, rounded corners.

| Class | Tailwind |
|-------|----------|
| `glass-card` | `backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl` |
| `glass-button` | `bg-white/10 hover:bg-white/20 border border-white/20 text-white duration-700` |
| `glass-input` | `bg-white/5 border-white/20 rounded-xl text-white placeholder:text-white/40` |

Always use `duration-700 ease-out` for transitions. Hover scale: `hover:scale-[1.02]`.

## Terminology Quick Reference

| Term | Meaning |
|------|---------|
| Wabb | A collection — project/set of records to rank |
| Record | Individual item (image, video, text, 3D, audio, deck) |
| RAVG | Ranked Average — weighted team consensus score |
| Super RAVG | RAVG + Owner's level-2 supervisor weight |
| Branched Wabb | Offshoot with fresh rankings, configurable carry-over |
| Window | Sprint-based generation period (lockable, reopenable) |
| Vetted Ref | Wabb type structured around replicating a proven reference |

## Project Structure (Target)

```
apps/wabbit/
├── v2BUILD_PLAN.md          # Master build document
├── CLAUDE.md                # This file
├── ref/                     # Reference materials (read-only docs, schema, diagrams)
├── web/                     # Vite + React SPA
├── landing/                 # Astro marketing site
├── supabase/                # Migrations, Edge Functions, seed data
├── packages/
│   ├── mcp-server/          # MCP server (npm package)
│   └── openclaw-skills/     # OpenClaw skill pack
├── ios/                     # Native iOS app (Phase 2+)
└── slack/                   # Slack integration (Phase 3)
```

## Common Commands (when implemented)

```bash
npm run dev              # Vite dev server (:5173)
npm run dev:landing      # Astro dev server (:4321)
supabase start           # Local Supabase
supabase db push         # Apply migrations
npx supabase gen types typescript --local > web/src/lib/database.types.ts
```

## OpenClaw & MCP

**OpenClaw Skills** (6): search-wabbs, rank-record, my-progress, get-leaderboard, wabb-detail, digest

**MCP High-Level Tools** (3): `wabbit_launch_ranking` (one-call setup + magic link), `wabbit_get_results` (poll/webhook for results), `wabbit_quick_poll` (binary on small sets)

**MCP Granular Tools** (7): wabbit_search_wabbs, wabbit_get_wabb, wabbit_get_records, wabbit_submit_ranking, wabbit_get_leaderboard, wabbit_get_progress, wabbit_create_wabb

Both connect to Supabase directly — never through the web app. The agent layer is also a **distribution channel**: agents proactively create Wabbs and send magic links to humans. See `v2MONETIZATION.md` §6 for the agent-first onboarding flow.

## Monetization Model

**Tiers:** Free ($0) / Pro ($29/mo) / Team ($149/mo) / Business ($299/mo). Flat pricing, unlimited rankers at all tiers.

**iOS is free at all tiers** — distribution channel, not revenue gate.

**Key gates:** Agent CRUD (Pro+), Super RAVG + Windows (Team+), SSO + audit logs (Business). See `v2MONETIZATION.md` for full tier table.

**Two front doors:** Humans discover organically (web/app store) + agents discover via MCP and onboard humans proactively with magic links.

## Git Commit Style

- Do **not** include `Co-Authored-By` lines in commit messages
- Write detailed but concise commit messages that explain the "why" and summarize key changes
