# cleantime-wabbit-re.md — Internal Restructure Plan

> **Scope**: Internal reorganization of `apps/wabbit-re/` only. No directory renaming. No cross-app changes except documentation reference updates.

---

## Current State (181 source files, 17 top-level directories)

```
apps/wabbit-re/
├── .claude/                    # Claude Code settings
├── .next/                      # Build artifacts
├── .turbo/                     # Turbo logs
├── app/                        # 38 files (pages + API routes)
├── components/                 # 15 files (3 subdirs: auth/, form/, map/)
├── contexts/                   # 2 files (AuthContext, MapContext)
├── docs/                       # 26 files (flat + 5 subdirs)
├── email-templates/            # 2 files
├── hooks/                      # 2 files
├── legal/                      # 3 files
├── lib/                        # 24 files (7 subdirs)
├── migrations/                 # 7 files (numbering conflict)
├── node_modules/               # Hoisted deps
├── public/                     # 4 files
├── ref/                        # 8 SQL files
├── scrape_3rd/                 # 4 files (LEGACY - Python)
├── scripts/                    # 22 files (flat, mixed purposes)
├── UI Prompts for Wabbit RE.docx  # MISPLACED
├── SKILLS.md
├── SUBAGENT_PLAN.md
├── middleware.ts
├── instrumentation.ts
├── next.config.js, package.json, tsconfig.json, tailwind.config.js, postcss.config.js
└── 4x .DS_Store files
```

### Problems Identified

| Issue | Location | Impact |
|-------|----------|--------|
| `scrape_3rd/` is 100% redundant | Root | Dead code, replaced by `lib/scraping/` |
| 5 SQL files duplicated | `ref/sql/` vs `docs/reference/` | Confusion over canonical source |
| `scripts/` is a flat dump of 22 files | `scripts/` | No organization by purpose |
| No `components/ui/` directory | `components/` | Radix used raw, no reusable wrappers |
| No `lib/types/` directory | `lib/` | Types scattered across files and inline |
| Large page files with inline components | `app/form/` (680 LOC), `app/list-view/` (499 LOC) | Hard to maintain, not reusable |
| `contexts/` inconsistent with sibling apps | Root | gs-crm uses `components/providers/` |
| `.DS_Store` files tracked in git | 4 locations | Noise in version control |
| `UI Prompts for Wabbit RE.docx` at root | Root | Misplaced non-code file |
| Migration numbering conflict | `migrations/` | Two `002_` files |
| `docs/` has flat files mixed with subdirs | `docs/` | No clear organization |

---

## Proposed Target State

```
apps/wabbit-re/
├── app/                            # UNCHANGED structure (App Router)
│   ├── api/                        # All API routes (no changes)
│   ├── auth/
│   ├── agent-view/
│   ├── form/
│   ├── list-view/
│   ├── map-test/
│   ├── rank-feed/
│   ├── settings/
│   ├── setup/[token]/
│   ├── signin/
│   ├── signup/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   └── ethereum-polyfill.tsx
│
├── components/                     # EXPANDED with feature dirs + ui/
│   ├── auth/                       # (existing) ProfileMenu, SignInModal
│   ├── form/                       # (existing) ResponseSummary
│   │                               #   + extracted FormPage components
│   ├── map/                        # (existing) all map components
│   ├── rank-feed/                  # NEW - extracted from rank-feed/page.tsx
│   ├── list-view/                  # NEW - extracted from list-view/page.tsx
│   ├── providers/                  # NEW - moved from contexts/
│   │   ├── AuthProvider.tsx        #   (renamed from AuthContext.tsx)
│   │   └── MapProvider.tsx         #   (renamed from MapContext.tsx)
│   ├── ui/                         # NEW - Radix wrapper components
│   ├── AuthLoadingScreen.tsx       # (existing)
│   ├── DemoBanner.tsx              # (existing)
│   ├── PropertyDetailModal.tsx     # (existing)
│   ├── footer.tsx                  # (existing)
│   └── theme-provider.tsx          # (existing)
│
├── hooks/                          # UNCHANGED
│   ├── useAuth.ts
│   └── useRequireAuth.ts
│
├── lib/                            # EXPANDED with types/ and constants/
│   ├── database/                   # (existing)
│   ├── map/                        # (existing)
│   ├── notifications/              # (existing)
│   ├── pipeline/                   # (existing)
│   ├── scraping/                   # (existing, including scrapers/)
│   ├── storage/                    # (existing)
│   ├── supabase/                   # (existing)
│   ├── types/                      # NEW - consolidated types
│   │   ├── scraping.ts             #   (moved from scraping/types.ts)
│   │   ├── database.ts             #   (extracted inline types)
│   │   └── index.ts                #   (barrel export)
│   ├── constants/                  # NEW - app-wide constants
│   └── rate-limit.ts              # (existing)
│
├── scripts/                        # REORGANIZED into subdirs
│   ├── seed/                       # All seed-*.ts scripts
│   ├── spatial/                    # setup-spatial, check-spatial
│   ├── verify/                     # verify-*, validate-*
│   ├── admin/                      # delete-user, clean-all, update-demo
│   └── test/                       # test-scrapers, test-scraping, monitor
│
├── migrations/                     # RENUMBERED (fix 002 conflict)
│   ├── 001_enable_postgis_spatial_features.sql
│   ├── 002_add_scraping_tables_final.sql
│   ├── 003_spatial_rpc_functions.sql        # was 002_
│   ├── 004_fix_search_areas_display.sql     # was 003_
│   ├── 005_populate_missing_coordinates.sql # was 004_
│   ├── 006_debug_check_areas.sql            # was 005_
│   └── 007_add_image_and_demo_columns.sql   # was 006_
│
├── ref/                            # CONSOLIDATED (canonical SQL location)
│   └── sql/                        # All 8 SQL files (unchanged)
│
├── docs/                           # REORGANIZED into clear subdirs
│   ├── setup/                      # (existing) GOOGLE_MAPS, DEMO, DEMO_PROPERTIES
│   ├── auth/                       # (existing) AUTH_FIXES, AUTH_TEST_SCENARIOS
│   ├── fixes/                      # (existing) PROPERTY_DISPLAY_FIX
│   ├── scraping/                   # NEW subdir - moved from flat
│   │   ├── SCRAPING_SYSTEM_STATUS.md
│   │   ├── PROPERTY_SCRAPING_PLAN.md
│   │   ├── ZILLOW_FAVORITES_EXTRACTION.md
│   │   ├── ZILLOW_INTELLIGENCE_PLAN.md
│   │   └── ZILLOW_SCRAPING_FEASIBILITY.md
│   ├── plans/                      # NEW subdir - moved from flat
│   │   ├── DASHBOARD_RESKIN_PLAN.md
│   │   └── DEVELOPMENT_PLAN.md
│   ├── reference/                  # CLEANED - removed duplicate SQL
│   │   └── sample-data/            # CRM-Buyer-preferences.xlsx, CSVs, PDFs
│   ├── WABBIT_RE_PRD.md            # Stays at docs root (primary doc)
│   ├── OPERATIONS_GUIDE.md         # Stays at docs root
│   ├── ACCURATE_DATA_STATUS.md
│   ├── USER_DELETION_GUIDE.md
│   └── test-verification-flow.md
│
├── email-templates/                # UNCHANGED
├── legal/                          # UNCHANGED
├── public/                         # UNCHANGED
│
├── SKILLS.md                       # (stays at root)
├── SUBAGENT_PLAN.md                # (stays at root)
├── middleware.ts                    # (stays at root - Next.js requirement)
├── instrumentation.ts              # (stays at root)
├── next.config.js
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── postcss.config.js
```

---

## Phase Breakdown

### Phase 0: Safe Deletions (zero risk)

**What:**
- Delete 4x `.DS_Store` files
- Delete `scrape_3rd/` directory (4 files — 100% redundant, already excluded from Vercel via `.vercelignore`)
- Delete `docs/reference/legacy-schema/` (2 files — identical copies exist in `ref/sql/`)
- Delete `docs/reference/sql-fixes/` (3 files — identical copies exist in `ref/sql/`)
- Move `UI Prompts for Wabbit RE.docx` → `docs/reference/`
- Add `.DS_Store` to `.gitignore` if not already present

**Why safe:**
- `scrape_3rd/`: Zero code references. Python scrapers fully replaced by TypeScript `lib/scraping/scrapers/`. Already excluded from Vercel deploys.
- Duplicate SQL files: `ref/sql/` is the canonical location (all active docs/code reference it). `docs/reference/` copies are from Sep 2025, zero references point to them.

**Verification:**
- `npm run build` succeeds
- `npm run dev` starts without errors

**External updates needed:**
- `CLAUDE.md` (root): Remove `scrape_3rd/` mention from project structure
- `.vercelignore`: Remove `scrape_3rd/` line (directory no longer exists)

---

### Phase 1: Docs Reorganization (no code impact)

**What:**
- Create `docs/scraping/` — move 5 scraping-related docs from `docs/` root:
  - `SCRAPING_SYSTEM_STATUS.md`
  - `PROPERTY_SCRAPING_PLAN.md`
  - `ZILLOW_FAVORITES_EXTRACTION.md`
  - `ZILLOW_INTELLIGENCE_PLAN.md`
  - `ZILLOW_SCRAPING_FEASIBILITY.md`
- Create `docs/plans/` — move 2 plan docs:
  - `DASHBOARD_RESKIN_PLAN.md`
  - `DEVELOPMENT_PLAN.md`

**Why safe:** Documentation-only. No code imports docs.

**Verification:**
- Grep for any hardcoded doc paths in code or CLAUDE.md and update references
- Known references to update:
  - `CLAUDE.md` line referencing `apps/wabbit-re/docs/SCRAPING_SYSTEM_STATUS.md`
  - `SKILLS.md` if it references doc paths
  - `apps/wabbit-re/docs/auth/AUTH_FIXES_SUMMARY.md` (references `ref/sql/` — no change needed)

---

### Phase 2: Scripts Reorganization (no runtime impact)

**What:**
- Create subdirectories in `scripts/`:

```
scripts/
├── seed/
│   ├── seed-demo-account.ts
│   ├── seed-demo-basic.ts
│   ├── seed-demo-manual.ts
│   ├── seed-realistic-demo.ts
│   ├── seed-sample-data.ts
│   ├── seed-live-demo-properties.ts
│   ├── seed-specific-demo-properties.ts
│   ├── seed-accurate-zillow-properties.ts
│   └── seed-verified-properties.ts
├── spatial/
│   ├── setup-spatial.ts
│   └── check-spatial-setup.ts
├── verify/
│   ├── verify-demo-properties.ts
│   ├── verify-setup.js
│   ├── verify-deployment.sh
│   └── validate-cleanup-paths.sh
├── admin/
│   ├── delete-user.js
│   ├── delete-user-complete.sql
│   ├── clean-all-properties.ts
│   └── update-demo-password.ts
└── test/
    ├── test-scrapers.js
    ├── test-scraping.ts
    └── monitor-scraping.js
```

**Impact — `package.json` script paths must update:**

```json
{
  "db:seed": "tsx scripts/seed/seed-database.ts",
  "db:seed-demo": "tsx scripts/seed/seed-demo-account.ts",
  "db:seed-live-demo": "tsx scripts/seed/seed-live-demo-properties.ts",
  "db:setup-spatial": "tsx scripts/spatial/setup-spatial.ts",
  "db:check-spatial": "tsx scripts/spatial/check-spatial-setup.ts"
}
```

**Impact — relative imports in scripts:**
Scripts use `../lib/` relative imports. Moving scripts one level deeper means imports become `../../lib/`. All script files with relative imports must be updated.

Files with relative imports to check:
- `seed-specific-demo-properties.ts` (imports `../lib/scraping/scrapers/zillow-scraper`)
- `seed-live-demo-properties.ts` (imports from `../lib/`)
- `seed-accurate-zillow-properties.ts` (imports from `../lib/`)
- All other seed scripts importing from `../lib/`
- `check-spatial-setup.ts`, `setup-spatial.ts`

**Verification:**
- All `npm run db:*` commands execute without error
- `tsx scripts/seed/seed-demo-account.ts` resolves imports correctly

---

### Phase 3: Migration Renumbering (cosmetic — verify before executing)

**What:**
- Renumber to fix the `002_` conflict:

| Current | New |
|---------|-----|
| `001_enable_postgis_spatial_features.sql` | `001_` (no change) |
| `002_add_scraping_tables_final.sql` | `002_` (no change) |
| `002_spatial_rpc_functions.sql` | `003_spatial_rpc_functions.sql` |
| `003_fix_search_areas_display.sql` | `004_fix_search_areas_display.sql` |
| `004_populate_missing_coordinates.sql` | `005_populate_missing_coordinates.sql` |
| `005_debug_check_areas.sql` | `006_debug_check_areas.sql` |
| `006_add_image_and_demo_columns.sql` | `007_add_image_and_demo_columns.sql` |

**CRITICAL CHECK before executing:**
- Verify if Supabase tracks migrations by filename. If `supabase db push` uses filenames to determine which migrations have been applied, renaming would cause it to re-run already-applied migrations.
- Run `supabase migration list` to check.
- **If filenames are tracked: SKIP this phase entirely.** The numbering conflict is cosmetic only.

---

### Phase 4: Contexts → components/providers/ (code changes)

**What:**
- Move `contexts/AuthContext.tsx` → `components/providers/AuthProvider.tsx`
- Move `contexts/MapContext.tsx` → `components/providers/MapProvider.tsx`
- Update all imports from `@/contexts/AuthContext` → `@/components/providers/AuthProvider`
- Update all imports from `@/contexts/MapContext` → `@/components/providers/MapProvider`
- Delete empty `contexts/` directory

**Files impacted** (search for `@/contexts/`):
- `app/layout.tsx` (imports AuthContext)
- `app/form/page.tsx` (imports AuthContext)
- `app/rank-feed/page.tsx` (imports AuthContext)
- `app/list-view/page.tsx` (imports AuthContext, MapContext)
- `app/settings/page.tsx` (imports AuthContext)
- `app/signin/page.tsx` (imports AuthContext)
- `app/signup/page.tsx` (imports AuthContext)
- `app/setup/[token]/page.tsx` (imports AuthContext)
- `app/agent-view/page.tsx` (imports AuthContext)
- `app/map-test/page.tsx` (imports MapContext)
- `components/auth/ProfileMenu.tsx` (imports AuthContext)
- `components/DemoBanner.tsx` (imports AuthContext)
- `hooks/useAuth.ts` (imports AuthContext)
- `hooks/useRequireAuth.ts` (imports AuthContext)

**tsconfig.json**: No change needed. `@/*` maps to `./*`, so `@/components/providers/` resolves correctly.

**Verification:**
- `npm run typecheck` passes
- `npm run build` succeeds
- All pages render correctly in dev

---

### Phase 5: Create lib/types/ (code changes)

**What:**
- Move `lib/scraping/types.ts` → `lib/types/scraping.ts`
- Extract common database-related interfaces from inline definitions → `lib/types/database.ts`
- Create `lib/types/index.ts` barrel export

**Files impacted** (search for `@/lib/scraping/types` or `from '../types'` within lib/scraping/):
- `lib/scraping/property-scraper.ts`
- `lib/scraping/queue-manager.ts`
- `lib/scraping/error-handler.ts`
- `lib/scraping/scrapers/zillow-scraper.ts`
- `lib/scraping/scrapers/redfin-scraper.ts`
- `lib/scraping/scrapers/homes-scraper.ts`
- `lib/pipeline/data-normalizer.ts`
- `lib/database/property-manager.ts`
- `lib/storage/image-optimizer.ts`
- `lib/notifications/property-notifier.ts`
- `app/api/scrape/on-demand/route.ts`
- `app/api/scrape/test/route.ts`
- `app/api/cron/hourly-scrape/route.ts`
- Any scripts importing from `lib/scraping/types`

**Approach:**
- Within `lib/scraping/`, files currently import via relative path (`from './types'` or `from '../types'`). After moving to `lib/types/scraping.ts`, update these to `@/lib/types/scraping`.
- Alternatively, leave a re-export at `lib/scraping/types.ts` that re-exports from `@/lib/types/scraping` to minimize breakage. This is the safer approach.

**Verification:**
- `npm run typecheck` passes
- `npm run build` succeeds

---

### Phase 6: Component Extraction (code changes — largest phase)

**What:**
Extract inline components from oversized page files into dedicated component directories.

#### 6a. `app/form/page.tsx` (680 LOC) → `components/form/`

Read the file to identify extractable components. Likely candidates:
- Individual form page/step components (7-page wizard)
- Form field wrapper components
- Progress indicator
- Navigation buttons

Page file becomes a thin orchestrator importing from `components/form/`.

#### 6b. `app/list-view/page.tsx` (499 LOC) → `components/list-view/`

Likely candidates:
- PropertyCard / PropertyListItem
- FilterBar / SortControls
- Pagination controls
- Empty state component

#### 6c. `app/rank-feed/page.tsx` → `components/rank-feed/`

Likely candidates:
- RankingTile (the 4-tile card)
- ScoreInput components
- Navigation/swipe controls
- Comment/notes input

**Approach:**
- Read each page file before extracting
- Identify component boundaries (look for inline function components, large JSX blocks)
- Extract to named files in the corresponding `components/` subdirectory
- Page files import and compose the extracted components
- Ensure all state management stays where it needs to be (page-level state stays in page, component-local state moves with the component)

**Verification (per page):**
- `npm run typecheck` passes
- `npm run build` succeeds
- Visual regression check: page renders identically in dev
- All interactivity works (form submission, ranking, filtering)

---

### Phase 7: Create components/ui/ (optional, additive)

**What:**
- Create `components/ui/` directory
- Add Radix wrapper components as needed (Button, Dialog, Select, etc.)
- Follows the pattern established in gs-crm's `components/ui/`

**When:** This phase is optional and can be done incrementally as new features are built. No existing code needs to change — new components would simply use the wrappers instead of raw Radix.

**Not urgent.** Include in plan for completeness but deprioritize.

---

## Upstream/Downstream Impact Matrix

| Phase | Vercel Deploy | Supabase | Cross-App Refs | tsconfig | package.json |
|-------|:---:|:---:|:---:|:---:|:---:|
| 0 — Deletions | No impact | No impact | Update CLAUDE.md, .vercelignore | No | No |
| 1 — Docs | No impact | No impact | Update CLAUDE.md doc paths | No | No |
| 2 — Scripts | No impact | No impact | None | No | **Yes** — script paths |
| 3 — Migrations | No impact | **CHECK** if filenames tracked | None | No | No |
| 4 — Contexts | Rebuild needed | No impact | None | No | No |
| 5 — Types | Rebuild needed | No impact | None | No | No |
| 6 — Components | Rebuild needed | No impact | None | No | No |
| 7 — UI | Rebuild needed | No impact | None | No | No |

### Cross-App References (what to update outside wabbit-re)

| File | What to Update | Phase |
|------|----------------|-------|
| Root `CLAUDE.md` | Remove `scrape_3rd/` from project structure | 0 |
| Root `CLAUDE.md` | Update `docs/SCRAPING_SYSTEM_STATUS.md` → `docs/scraping/SCRAPING_SYSTEM_STATUS.md` | 1 |
| Root `.vercelignore` | Remove `scrape_3rd/` line | 0 |
| `apps/gs-site/lib/wabbit/client.ts` | No changes needed (uses env vars, not file paths) | — |
| `apps/gs-site/hooks/useWabbitStats.ts` | No changes needed | — |

### Things That Must NOT Change

| Item | Why |
|------|-----|
| `app/api/**` route paths | Vercel cron jobs reference exact paths (`/wabbit-re/api/cron/*`) |
| `lib/supabase/` client structure | Shared package re-exports depend on this |
| `next.config.js` basePath (`/wabbit-re`) | Production routing depends on this |
| `middleware.ts` at app root | Next.js requires this location |
| `@/*` path alias resolution | tsconfig stays the same, all `@/` imports resolve from app root |
| `vercel.json` rewrite rules | Maps `/wabbit-re/:path*` → `/apps/wabbit-re/:path*` |
| Environment variable names | Vercel Dashboard has these configured |

---

## Notes for Future Consideration

- **Shared packages**: wabbit-re already uses `@gs-site/auth` and `@gs-site/supabase` via re-exports in `lib/supabase/client.ts`. Could further adopt `@gs-site/ui` and `@gs-site/utils` when building new features rather than duplicating utilities.
- **`contexts/` → `components/providers/`**: Aligns with gs-crm's established pattern. The functional behavior is identical — only import paths change.
- **Component extraction (Phase 6)**: This is the highest-effort phase but delivers the most maintainability benefit. Can be done one page at a time across multiple sessions.

---

## Execution Order Summary

```
Phase 0  ──▶  Phase 1  ──▶  Phase 2  ──▶  Phase 3  ──▶  Phase 4  ──▶  Phase 5  ──▶  Phase 6  ──▶  Phase 7
(delete)     (docs)        (scripts)     (migrations)   (contexts)    (types)       (components)   (ui)
 SAFE         SAFE          LOW RISK      CHECK FIRST    CODE CHANGE   CODE CHANGE   CODE CHANGE    OPTIONAL
```

Each phase is independently deployable. Run `npm run typecheck && npm run build` after each phase before proceeding.
