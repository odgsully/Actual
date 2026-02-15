# Wabbit Content Ranking Platform — SKILLS.md

> Slash-command skills for Claude Code development on the gesture-driven content ranking system.
>
> **Stack:** Vite 6 + React 18 + React Router 7 (SPA), Tailwind 4, Zustand, Supabase (PostgreSQL + Auth + Realtime + Edge Functions)
> **Design:** Glassmorphism UI | **Build System:** Wave-based (Waves 0-6)

---

## Quick Reference

| Skill | Purpose | When to Use |
|-------|---------|-------------|
| `/wab-prime` | Load session context | Starting a new session |
| `/wab-check` | Health check dev environment | Before starting work |
| `/rank-mode-add` | Scaffold new ranking mode | Adding ranking interaction |
| `/component-scaffold` | Generate UI component | New feature UI |
| `/store-scaffold` | Generate Zustand store | New state management |
| `/schema-validate` | Validate DB schema vs reference | After migrations |
| `/migration-create` | Create new DB migration | Schema changes |
| `/edge-function-create` | Scaffold Supabase Edge Function | Server-side logic |
| `/ravg-debug` | Debug RAVG calculation | Consensus scores wrong |
| `/ravg-formula-bench` | Benchmark RAVG formulas | Choosing formula |
| `/test-add` | Generate test file | Writing tests |
| `/lint-fix` | Auto-fix lint issues | Before committing |
| `/type-check` | Run TypeScript checking | Catching type errors |
| `/gesture-debug` | Debug gesture recognition | Input not registering |
| `/realtime-monitor` | Monitor Supabase Realtime | Multi-user sync issues |
| `/auth-debug` | Debug authentication | Login/permission issues |
| `/glossary-lookup` | Wabbit terminology | "What's a Branched Wabb?" |
| `/wave-status` | Current build wave progress | What's in scope now? |
| `/roadmap-view` | Full build roadmap | Planning work |
| `/deploy-prep` | Pre-deployment checklist | Before deploying |

---

## Session Management

### /wab-prime

**Load full context for a new Wabbit development session**

**Actions:**
1. Display architecture overview and tech stack
2. Show current build wave + acceptance criteria
3. List recent git commits and branch status
4. Display uncommitted changes
5. Show environment variable checklist
6. Link to relevant v2BUILD_PLAN.md sections

---

### /wab-check

**Quick health check for the development environment**

**Checks:**
1. Node.js version compatibility
2. npm packages installed
3. Supabase connection (query `profiles` table)
4. TypeScript compilation
5. `.env.local` with required vars
6. Active Supabase migrations

---

## Scaffolding & Component Creation

### /rank-mode-add [mode-name]

**Scaffold a new ranking mode component**

**4 Ranking Modes:**
- 1-axis slider (0-10)
- 2-axis grid (X/Y category swiping)
- Quaternary A/B/C/D picker
- Binary yes/no toggle

**Creates:**
1. Component: `components/ranking/[ModeNameControls].tsx`
2. Hook: `hooks/use[ModeName]Ranking.ts`
3. Test: `components/ranking/__tests__/[ModeNameControls].test.ts`
4. Updates `RankingControls.tsx` wrapper
5. Updates Zod schema and TypeScript `ranking_mode` enum

**Component includes:** Props interface, Zustand store integration, gesture handlers, glassmorphism styling

---

### /component-scaffold [type] [name]

**Generate boilerplate for new UI component**

**Types:** `modal` | `card` | `form` | `sidebar-item` | `panel`

**Creates:**
1. Component: `components/[Type]/[Name].tsx`
2. Test: `components/[Type]/__tests__/[Name].test.tsx`

**Includes:** Props interface with JSDoc, glassmorphism classes, event handlers, loading/error states, accessibility attributes

---

### /store-scaffold [store-name]

**Generate a new Zustand store**

**Existing Stores:** `rankingStore`, `sidebarStore`, `layoutStore`

**Creates:**
1. Store: `stores/[storeName].ts`
2. Test: `stores/__tests__/[storeName].test.ts`
3. Updates `stores/index.ts` exports

**Includes:** Store interface, initial state, actions, selectors, DevTools middleware, optional localStorage persistence

---

## Database & Schema

### /schema-validate

**Validate database schema against reference**

**Checks:**
- Tables: `profiles`, `folders`, `collections`, `records`, `rankings`, `collaborators`
- Column types and constraints
- Enum types: `wab_type`, `ranking_mode`, `output_type`, `collaborator_role`
- Views: `record_scores`, `record_choices`, `collection_leaderboard`, `user_progress`
- All RLS policies enabled
- Primary keys and unique constraints
- Index recommendations

---

### /migration-create [name]

**Generate a new database migration file**

**Types:** `schema` | `RLS` | `seed data` | `trigger` | `index`

**Creates:**
- `supabase/migrations/[timestamp]_[name].sql`
- BEGIN/COMMIT transaction wrapper
- Rollback documentation
- Dry-run validation

---

### /edge-function-create [name]

**Scaffold a new Supabase Edge Function**

**Trigger Types:** HTTP endpoint | webhook | cron | realtime event

**Creates:**
1. `supabase/functions/[name]/index.ts` — Deno runtime
2. `supabase/functions/[name]/__tests__/index.test.ts`
3. CORS headers, auth validation, error handling
4. cURL testing examples

---

## Ranking & RAVG Engine

### /ravg-debug [collection-id]

**Debug RAVG (Ranked Average) calculation for a collection**

**Traces for each record:**
- All individual ranker scores
- Ranked role per ranker (owner, contributor, viewer)
- Raw average calculation
- Formula applied (simple_mean, weighted_by_role, exclude_outliers, custom)
- Weight multipliers
- Final RAVG
- Super RAVG (if applicable): owner score + supervisor_weight

**Example Output:**
```
Record: "Homepage Hero Design A"
  alice:   score 8.5 (owner, weight 1.0x)
  bob:     score 7.2 (contributor, weight 0.8x)
  charlie: score 6.9 (contributor, weight 0.6x)

  Weighted sum = (8.5x1.0) + (7.2x0.8) + (6.9x0.6) = 18.62
  Weight sum = 1.0 + 0.8 + 0.6 = 2.4
  RAVG = 18.62 / 2.4 = 7.76
```

---

### /ravg-formula-bench [collection-id]

**Benchmark different RAVG formulas against test data**

**Formulas Compared:**
- `simple_mean` — equal weight for all rankers
- `weighted_by_role` — weight by team role
- `exclude_outliers` — remove statistical outliers
- `custom` — user-defined formula

**Output:** Calculation time, ranking stability, formula recommendation based on team size

---

## Testing & Quality

### /test-add [module-path]

**Generate a test file for a component or module**

**Test Types:** `unit` | `integration` | `snapshot`

**Creates:**
- Jest/Vitest setup
- Mock Supabase client and Zustand stores
- Happy path, edge cases, error states
- Accessibility checks (for components)

---

### /lint-fix

**Run ESLint with automatic fixing**

Runs ESLint on changed files, auto-fixes (import sorting, semicolons, trailing commas), reports unfixable issues, runs Prettier.

---

### /type-check

**Run TypeScript type checking**

```bash
tsc --noEmit
```

Categorizes errors, suggests fixes for common patterns.

---

## Debugging & Analysis

### /gesture-debug

**Debug gesture recognition and scoring logic**

**Traces gesture flow:**
1. `pointerdown` — touch start position
2. `pointermove` — delta calculation, score preview
3. `pointerup` — final score, haptic feedback, DB submission

**Compares against:** `ref/RankingGestureView.swift` gesture spec

**Output:** Step-by-step gesture trace with score calculations, exported as JSON

---

### /realtime-monitor [collection-id]

**Monitor Supabase Realtime events**

**Monitors:** INSERT, UPDATE, DELETE on rankings, records, collaborators

**Shows:**
- Events with timestamps and user attribution
- Event payload (before/after for updates)
- Latency (server → client)
- Duplicate/out-of-order detection
- Connection status

---

### /auth-debug

**Debug authentication issues**

**Checks:**
- OAuth config (Google/GitHub credentials)
- JWT tokens (decode, expiry, scopes)
- User profile creation
- RLS policy simulation per user
- Auth state in Zustand store

---

## Documentation & Learning

### /glossary-lookup [term]

**Quick lookup of Wabbit terminology**

Key terms: Wabb, Branched Wabb, RAVG, Super RAVG, Quaternary, Wabb Time Window, OpenClaw, Record, Collection

---

### /wave-status

**Show current build wave status and next steps**

**Build Waves:**
| Wave | Name | Focus |
|------|------|-------|
| 0 | Dev Environment | Vite/Astro scaffold, Supabase, Turborepo |
| 1 | Foundation | OAuth, Zustand stores, 3-column layout |
| 2 | Core Ranking | Folder CRUD, 4 ranking modes, leaderboard |
| 3 | UI Polish | Glassmorphism, settings popup, media players |
| 4 | Collaboration | Multi-user, RAVG engine, branching |
| 5 | Integrations | OpenClaw, MCP, PWA, webhooks |
| 6 | Population | Manual upload, API ingestion, scheduling |

Shows completed/in-progress/pending acceptance criteria per wave.

---

### /roadmap-view

**High-level view of entire build roadmap**

Shows all waves with timelines, current position, dependencies, and Phase 2+ plans (native iOS, Slack integration, social scheduling).

---

## Deployment

### /deploy-prep

**Pre-deployment checklist**

**Checks:**
1. TypeScript: 0 errors
2. ESLint: 0 errors
3. Tests: all passing
4. Build: success
5. Environment variables configured
6. Database schema up to date
7. RLS policies enabled
8. No breaking changes

---

## App Architecture

### 3-Column Layout
```
┌──────────┬──────────────────┬──────────────┐
│ Sidebar  │   Main Content   │ Context Panel│
│ (folders,│   (ranking UI,   │ (details,    │
│  tree)   │   leaderboard)   │  settings)   │
└──────────┴──────────────────┴──────────────┘
```

### 4 Ranking Modes
1. **1-axis slider** — 0-10 scale, vertical swipe
2. **2-axis grid** — X/Y category swiping
3. **Quaternary** — A/B/C/D configurable labels
4. **Binary** — Yes/No toggle

### State Management (Zustand)
- `rankingStore` — scores, active collection, ranking mode
- `sidebarStore` — folder tree, selection state
- `layoutStore` — column visibility, responsive breakpoints

---

## Environment Variables

```env
# Required (Wave 0-4)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Wave 5 (Integrations)
API_KEY_HMAC_PEPPER=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
SUPABASE_JWT_SECRET=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=
INNGEST_SIGNING_KEY=
INNGEST_EVENT_KEY=
```

## Common Commands

```bash
# Development
npm run dev              # Start Vite dev server (:5173)
npm run dev:landing      # Start Astro landing page (:4321)
supabase start           # Start local Supabase

# Database
supabase db push         # Apply pending migrations
supabase gen types typescript --local > src/lib/database.types.ts

# Testing & Quality
npm test                 # Run tests
npm run test:watch       # Watch mode
npm run lint             # ESLint
npm run typecheck        # TypeScript compiler
npm run format           # Prettier

# Build & Deploy
npm run build            # Build Vite SPA (dist/)
vercel --prod            # Deploy to production
```

## Key References

| Document | Purpose |
|----------|---------|
| `v2BUILD_PLAN.md` | Master build plan with wave acceptance criteria |
| `CLAUDE.md` | Architecture overview, tech stack |
| `ref/docs/PRD.md` | Product requirements |
| `ref/docs/ARCHITECTURE.md` | Technical architecture |
| `ref/docs/GLOSSARY.md` | Terminology definitions |
| `ref/schema.sql` | Database schema |
| `ref/page.tsx` | Reference ranking page component |
| `ref/RankingGestureView.swift` | iOS gesture recognition reference |
