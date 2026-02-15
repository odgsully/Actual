# CRM Rename Plan: Complete Impact Assessment

**Created**: January 18, 2026
**Updated**: February 14, 2026 (validated against live codebase + conservative audit + 5-agent sweep)
**Status**: Ready to Execute (Part 1) | Planning (Part 2)

---

## Document Overview

| Part | Scope | Complexity | Status |
|------|-------|------------|--------|
| **Part 1** | Rename `gsrealty-client` → `gs-crm` | Low-Medium | Ready to execute |
| **Part 2** | Multi-tenant architecture for individuals + teams | High | Planning |

**Recommended approach**: Complete Part 1 first, then proceed with Part 2 phases incrementally.

---

## Conservative Audit Addendum (February 15, 2026)

This addendum narrows Part 1 to reduce regression risk while preserving all currently working behavior.

### Conservative Constraints (Part 1)

- Keep URL path as **Option A** (`/gsrealty`) for the first deployment.
- Keep `GSREALTY_URL` env var name unchanged in Part 1.
- Keep `WABBIT_APPS.gsrealty` key unchanged in Part 1 (rename display text to "CRM" only).
- Use two commits for fast/low-risk rollout:
  - Commit A: runtime/config changes only
  - Commit B: docs/copy cleanup after runtime verification
- Keep app-level lockfile in Part 1 and regenerate it at the new path (`apps/gs-crm/package-lock.json`).

### Why this is safer

- Changing `WABBIT_APPS.gsrealty` to `crm` triggers a type cascade in `gs-site` (`WabbitAppKey`), which is avoidable for a directory/package rename.
- Keeping `/gsrealty` avoids breaking bookmarks, existing links, and current deployment verification scripts.
- Runtime changes and documentation changes are separated so rollback and diff review stay clear.

### Revised Sequence (Part 1)

1. Runtime/config rename only (directory, package name, Vercel rewrite destination, CI filters, env file paths).
2. Build/typecheck and preview deployment verification.
3. Production deploy.
4. Documentation/copy follow-up commit.

---

# Part 1: Directory Rename (`gsrealty-client` → `gs-crm`)

**Feasibility Rating**: 8/10 (Highly Feasible)
**Risk Level**: Medium (upgraded from Low-Medium after adversarial vetting)
**Total Scope**: ~58 files, ~150+ individual changes

### Naming Convention

| Context | Name | Example |
|---------|------|---------|
| **Directory** | `gs-crm` | `apps/gs-crm/` |
| **Package name** | `gs-crm` | `"name": "gs-crm"` in package.json |
| **Turbo filter** | `gs-crm` | `--filter=gs-crm` |
| **Vercel paths** | `gs-crm` | `/apps/gs-crm/:path*` |
| **Code identifiers** | `crm` | `crmClient`, `useCrmStats`, WabbitAppKey `'crm'` |
| **Display name** | `CRM` | `name: 'CRM'` in WABBIT_APPS |
| **Deep link keys** | `crm-*` | `'crm-admin'`, `'crm-clients'` |

> Directory/package uses `gs-crm` (consistent with `gs-site`). Code identifiers use `crm` (cleaner for imports/types).

---

## Pre-Flight Checklist

- [ ] No uncommitted changes in the repository (`git status` clean)
- [ ] Current build succeeds: `npx turbo run build --filter=gsrealty-client`
- [ ] Create safety branch: `git checkout -b backup/pre-crm-rename-$(date +%Y%m%d)`
- [ ] Push backup: `git push origin backup/pre-crm-rename-$(date +%Y%m%d)`
- [ ] Confirm no `app_context` JWT dependencies (verified clean Feb 2026)
- [ ] Verify `layout.tsx` and `branding.ts` still contain expected strings: `grep -n "gsrealty\|GSRealty" apps/gsrealty-client/app/layout.tsx apps/gsrealty-client/lib/constants/branding.ts` (may have been updated already — skip Phase 3 items that are already clean)

---

## Decision Point: URL Path

**Before proceeding, decide on URL routing strategy:**

| Option | Path | Pros | Cons |
|--------|------|------|------|
| **A** (Recommended) | Keep `/gsrealty` | No breaking changes, bookmarks work, cron jobs untouched | Naming inconsistency |
| **B** | Change to `/crm` | Clean naming | Breaks bookmarks, requires cron path updates |

**Selected Option**: [x] A - Keep `/gsrealty` | [ ] B - Change to `/crm`

> **If Option B**: You MUST add 301 redirects to avoid breaking bookmarks, external links, and SEO:
> ```json
> { "source": "/gsrealty/:path*", "destination": "/crm/:path*", "permanent": true }
> ```

---

## Commit Strategy

**REQUIRED: Two-commit rollout for speed + safety.**

- **Commit A (Runtime/Config)**: everything required for working deploy.
- **Commit B (Docs/Copy)**: documentation and non-runtime wording only, after Commit A is verified in production.

```
1. Update runtime/config files (Phases 2-6, runtime items only)
2. git mv apps/gsrealty-client apps/gs-crm
3. Update apps/gs-crm/package.json name
4. Rename vercel.gsrealty.json -> vercel.gs-crm.json
5. rm -rf node_modules package-lock.json .turbo apps/gs-crm/package-lock.json
6. npm install
7. (cd apps/gs-crm && npm install --package-lock-only)
8. npx turbo run build --filter=gs-crm
9. npx turbo run typecheck --filter=gs-site
10. Commit A
11. Deploy to Vercel preview first (NOT --prod)
12. Test preview URL, then promote to production
13. Commit B docs/copy cleanup
```

> **Note on `vercel.gs-crm.json` rename**: no in-repo runtime consumers were found, but any external scripts/aliases using `--local-config vercel.gsrealty.json` must be updated.

---

## Fast-Rollout Defaults (Chosen)

- [x] URL path: keep `/gsrealty` in Part 1
- [x] Keep `WABBIT_APPS.gsrealty` key in Part 1
- [x] Keep `GSREALTY_URL` env var name in Part 1
- [x] Rename `vercel.gsrealty.json` to `vercel.gs-crm.json` in Part 1
- [x] Keep app-level lockfile and regenerate at `apps/gs-crm/package-lock.json`
- [x] Use two commits: runtime first, docs second

---

## Risk Matrix

| Phase | Risk | Blast Radius | Why |
|-------|------|-------------|-----|
| Phase 1 (Directory) | MEDIUM | Build failure | Stale symlinks, Turbo cache, package-lock need full cleanup |
| **Phase 2 (Vercel)** | **HIGH** | **Production 404s** | **Wrong rewrite destination = all `/gsrealty/*` routes unreachable** |
| Phase 3 (Internal) | LOW | Local dev only | Config files are self-contained |
| Phase 4 (gs-site conservative mode) | LOW-MEDIUM | gs-site display-only drift | Key freeze avoids type cascade in Part 1 |
| Phase 5 (CI/CD) | MEDIUM | Future PRs blocked | Workflow assumptions can fail if script/filter mismatch |
| Phase 6 (Env vars) | LOW | Local dev | Env files are not deployed |
| Phase 7 (Docs) | NONE | Documentation only | No runtime impact |

---

## Phase 1: Core Directory Rename

**Risk**: Medium | **Reversible**: Yes (`git checkout`) | **Files**: 2

- [ ] Rename directory: `git mv apps/gsrealty-client apps/gs-crm`
- [ ] Update `apps/gs-crm/package.json`: `"name": "gsrealty-client"` → `"name": "gs-crm"`

> **NOTE**: No app-specific scripts exist in root package.json and none are needed. Turbo handles all app filtering via `--filter=gs-crm`. The root workspace uses `"apps/*"` glob pattern, so the new directory is auto-discovered.

> **CLEANUP REQUIRED**: After rename, you MUST do a full workspace reset. `npm install` alone is insufficient — `package-lock.json` has explicit `gsrealty-client` workspace entries, and `node_modules/` contains stale symlinks to the old path.
> ```bash
> rm -rf node_modules package-lock.json .turbo apps/gs-crm/.next apps/gs-crm/package-lock.json
> npm install
> (cd apps/gs-crm && npm install --package-lock-only)
> ```

---

## Phase 2: Vercel Routing

**Risk**: HIGH | **Reversible**: Yes (revert config files) | **Files**: 2, 8 changes

> **THIS IS THE HIGHEST-RISK PHASE.** If the rewrite destination is wrong, all `/gsrealty/*` routes return 404 in production. Cron jobs (hourly scrape, daily cleanup, health check) will also fail silently. The rewrite destination path maps to the build output — it MUST match the new directory name.

### vercel.json (6 references)

- [ ] Line 17: Rewrite destination `/apps/gsrealty-client/:path*` → `/apps/gs-crm/:path*`
- [ ] Line 16: Rewrite source `/gsrealty/:path*` — keep as-is (Option A) or change to `/crm/:path*` (Option B)
- [ ] Line 34: Cron path `/gsrealty/api/cron/hourly-scrape` — keep or update per URL decision
- [ ] Line 38: Cron path `/gsrealty/api/cron/daily-cleanup` — keep or update per URL decision
- [ ] Line 42: Cron path `/gsrealty/api/cron/check-health` — keep or update per URL decision

### vercel.gsrealty.json (standalone config, 2 references)

- [ ] Line 3: `buildCommand` — `apps/gsrealty-client` → `apps/gs-crm`
- [ ] Line 6: `outputDirectory` — `apps/gsrealty-client/.next` → `apps/gs-crm/.next`
- [ ] Rename file to `vercel.gs-crm.json`
- [ ] Run impact grep: `rg -n "vercel\\.gsrealty\\.json|vercel\\.gs-crm\\.json" .`
- [ ] Update any external/local scripts that call `vercel --local-config vercel.gsrealty.json` (if any)

---

## Phase 3: gs-crm Internal Config

**Risk**: Low | **Reversible**: Yes | **Files**: 20

These files are INSIDE the app (will be at `apps/gs-crm/` after move):

### App Config
- [ ] **`next.config.js`** — Lines 6, 13: basePath `/gsrealty` (keep if Option A, change to `/crm` if Option B). Note: basePath is a URL path, independent of directory name.
- [ ] **`next.config.js`** — Line 36: `NEXT_PUBLIC_APP_NAME: 'GSRealty Client Manager'` → `'Sullivan Realty CRM'`
- [ ] **`app/layout.tsx`** — Line 12: `title: 'GS Realty Client Management'` → `'Sullivan Realty CRM'` (**VERIFY FIRST** — may already be updated; grep before changing)
- [ ] **`lib/constants/branding.ts`** — Lines 11-12, 64: `'GS Realty'` → `'Sullivan Realty CRM'`, full name update (**VERIFY FIRST** — may already be refactored; grep before changing)

### Email Config
- [ ] **`lib/email/resend-client.ts`** — Line 23: `no-reply@gsrealty.com` default sender — update if email domain changes
- [ ] **`lib/email/resend-client.ts`** — Lines 92, 146, 198: Email subjects contain `'GSRealty'` → update to `'Sullivan Realty CRM'`
- [ ] **`lib/processing/breakups-packager.ts`** — Line 288: `support@gsrealty.com` — update if email domain changes
- [ ] **`.env.sample`** (app-level) — Line 27: `RESEND_FROM_EMAIL=no-reply@gsrealty.com`, Line 28: `RESEND_REPLY_TO_EMAIL=support@gsrealty.com`
- [ ] **`lib/database/settings.ts`** — Contains `@gsrealty.com` email domain reference — update if email domain changes
- [ ] **`scripts/test-email-system.ts`** — Contains `@gsrealty.com` email domain reference — update if email domain changes
- [ ] **`README.md`** (app-level) — Contains `@gsrealty.com` email domain reference — update if email domain changes

### Email Templates (user-facing branding — Commit A)
- [ ] **`lib/email/templates/password-reset.tsx`** — Lines 35, 45, 74: `'GSRealty'` heading, body text, footer → `'Sullivan Realty CRM'`
- [ ] **`lib/email/templates/invitation.tsx`** — Lines 37, 42, 47, 84: `'GSRealty'` heading, welcome text, body, footer → `'Sullivan Realty CRM'`
- [ ] **`lib/email/templates/welcome.tsx`** — Lines 33, 38, 43, 86: `'GSRealty'` heading, welcome text, body, footer → `'Sullivan Realty CRM'`

### Processing/Log Prefixes (Commit B — non-runtime cosmetic)
- [ ] **`lib/processing/csv-processor.ts`** — Line 30: `LOG_PREFIX = '[GSRealty Excel - CSV]'` → `'[CRM Excel - CSV]'`
- [ ] **`lib/processing/excel-processor.ts`** — Line 25: `LOG_PREFIX = '[GSRealty Excel - XLSX]'` → `'[CRM Excel - XLSX]'`
- [ ] **`lib/processing/template-populator.ts`** — Line 31: `LOG_PREFIX = '[GSRealty Excel - Template]'` → `'[CRM Excel - Template]'`
- [ ] **`lib/processing/template-populator.ts`** — Line 884: hardcoded `'gsrealty-client-template.xlsx'` filename — update to `'gs-crm-template.xlsx'` (and rename the actual file)
- [ ] **`lib/processing/breakups-packager.ts`** — Line 139: regex pattern `GSRealty_Analysis_` — update to `CRM_Analysis_` or keep for backward compat with existing PDFs

### Supabase Config
- [ ] **`supabase/config.toml`** — Line 5: `project_id = "gsrealty-client"` → `"gs-crm"`

### Observability
- [ ] **`.env.sample`** (app-level) — Line 49: `DD_SERVICE=gsrealty-client` → `DD_SERVICE=gs-crm`

### Vercel & Claude CLI
- [ ] **`.vercel/project.json`** — `"projectName":"gsrealty-client"` — delete and re-link:
  ```bash
  cd apps/gs-crm
  rm -rf .vercel
  vercel link  # Choose existing project or create new
  ```
- [ ] **`vercel.json`** (app-level) — Cron paths are basePath-relative so no edits needed, but moves with directory rename
- [ ] **`.claude/settings.local.json`** (app-level) — 7 bash command paths hardcoded to `apps/gsrealty-client` directory (lines 4-6, 16-17 confirmed)
- [ ] **Root `.claude/settings.local.json`** — 22 permission entries with hardcoded `apps/gsrealty-client` paths (total: 29 paths across root + app-level)

---

## Phase 4: gs-site Cross-App Integration

**Risk**: LOW-MEDIUM in conservative mode | **Reversible**: Yes

### Part 1 (Required now): no type/key cascade

- [ ] Keep `WABBIT_APPS.gsrealty` key unchanged
- [ ] Keep deep link keys `gsrealty-admin` and `gsrealty-clients` unchanged
- [ ] Update display text only (`GS Realty` → `CRM`) where user-facing
- [ ] Update tile description copy (`"Link to gsrealty-client site"` → `"Link to CRM"`) in `lib/data/tiles.ts` line 525
- [ ] Update `lib/wabbit/client.ts` line 6 comment: `gsrealty-client (port 3004)` → `gs-crm (port 3004)` (Commit B)
- [ ] Update `lib/data-qa/prompts.ts` line 151: suggested query `'Show all gsrealty clients with status active'` — update display text to reference CRM (table name `gsrealty_clients` stays unchanged)

### Deferred (after Part 1 stability): key rename cascade

- [ ] `WABBIT_APPS.gsrealty` → `WABBIT_APPS.crm`
- [ ] `WabbitStats['gsrealty']` → `WabbitStats['crm']`
- [ ] `gsrealtyClient` → `crmClient`, hook/query key updates, tile key remapping
- [ ] Run strict typecheck immediately after deferred rename: `npx turbo run typecheck --filter=gs-site`

---

## Phase 5: CI/CD Workflows

**Risk**: Low-Medium | **Reversible**: Yes | **Files**: 3, 7 changes

### `.github/workflows/test.yml`

- [ ] Line 38: Matrix `app: [wabbit-re, wabbit, gsrealty-client]` → `app: [wabbit-re, wabbit, gs-crm]`
- [ ] Validate build command compatibility: workflow currently calls `npm run build:${{ matrix.app }}`; if root scripts do not exist, switch to `npx turbo run build --filter=${{ matrix.app }}`

### `.github/workflows/deploy-production.yml`

- [ ] Line 201: Display text `GSRealty: https://wabbit-rank.ai/gsrealty` — update display name to `CRM`

### `.github/workflows/deploy-staging.yml`

- [ ] Line 133: Step name `Verify GSRealty` → `Verify CRM`
- [ ] Line 135: Echo text `Checking GSRealty...` → `Checking CRM...`
- [ ] Line 136: Health check URL `/gsrealty/api/health` — keep for Option A
- [ ] Line 163: Preview URL display `GSRealty` → `CRM`

---

## Phase 6: Environment Variables

**Risk**: Low | **Reversible**: Yes | **Files**: 5, 10+ changes

### Decision Point: Rename `GSREALTY_URL` env var?

| Option | Impact | Recommendation |
|--------|--------|----------------|
| **Keep `GSREALTY_URL`** | Inconsistent naming but zero risk | **Selected for Part 1** |
| **Rename to `CRM_URL`** | Must update: Vercel dashboard, `client.ts`, `.env.sample`, `.env.local` | Do later if at all |

### Changes

- [ ] **`apps/gs-site/.env.sample`** — Line 25: keep `GSREALTY_URL=http://localhost:3004` for Part 1
- [ ] **`.env.sample`** (root) — Line 32: `TEMPLATE_PATH` contains full path to `apps/gsrealty-client/` → update to `apps/gs-crm/`
- [ ] **`.env.local`** — Line 32: Same `TEMPLATE_PATH` → update to `apps/gs-crm/`
- [ ] **`.env.sample`** (root) — Line 23: Section comment `# GSRealty-Specific Configuration` → `# CRM-Specific Configuration`
- [ ] **`.env.sample`** (root) — Line 108: Comment lists `gsrealty-client` in app enumeration → update to `gs-crm`
- [ ] **`.env.local`** — Line 23: Section comment `# GSRealty-Specific Configuration` → `# CRM-Specific Configuration`
- [ ] **`.env.local`** — Line 41: `EMAIL_FROM=noreply@gsrealty.dev` — update if email domain changes
- [ ] **`.env.local`** — Line 44: Comment `# GS Site Integration (GSRealty accessed from GS personal site)` → update text
- [ ] **`.env.local`** — Line 108: Comment lists `gsrealty-client` in app enumeration → update to `gs-crm`
- [ ] **`.env.vercel`** — Line 3: `EMAIL_FROM="noreply@gsrealty.dev"` — update if email domain changes

---

## Phase 7: Documentation

**Risk**: None | **Reversible**: Yes | **Files**: ~30 | **Commit**: B (after runtime verification)

### Critical Docs (update first)

- [ ] **`CLAUDE.md`** (root) — ~20 references: project structure listing, design system section header (`gsrealty-client`), env vars (`GSREALTY_URL`), tile mappings, port listing, dev commands. Update all `gsrealty-client` → `gs-crm`
- [ ] **`README.md`** (root) — Lines 10, 48, 71-73, 157-159: structure tree, dev command, db scripts, section header
- [ ] **`CONTRIBUTING.md`** (root) — Lines 57, 64, 67, 127, 130: workspace commands, section header `### Working on gsrealty-client`

### Architecture & Operations Docs

- [ ] **`docs/ARCHITECTURE.md`** — Lines 15, 32, 146, 170, 172, 180, 194: overview, port mapping, dev commands
- [ ] **`docs/CROSS_APP_API.md`** — Lines 19, 26, 57, 93-107, 142, 155, 188-189, 234-237: API specs
- [ ] **`docs/DATABASE_OWNERSHIP.md`** — Lines 17, 93, 115, 149-150, 162, 165: table ownership
- [ ] **`docs/POST_CLEANUP_STRUCTURE.md`** — Lines 33, 48, 64, 70, 184-185, 232, 279-281: mermaid diagrams
- [ ] **`docs/RUNBOOK.md`** — Lines 100, 229, 289: emergency procedures

### Deployment Docs

- [ ] **`docs/deployment/GROWTHADVISORY_DOMAIN_SETUP.md`** — Lines 9, 16, 25, 33-36, 150: multi-domain routing
- [ ] **`docs/deployment/VERCEL_ARCHITECTURE_DECISION_2026-01-11.md`** — 21+ references: deployment strategy

### gs-site Internal Docs

- [ ] **`apps/gs-site/gs-site-notion-sum.md`** — Lines 82, 391
- [ ] **`apps/gs-site/docs/GO-PLAN.md`** — Lines 34, 127, 134, 478, 550
- [ ] **`apps/gs-site/docs/OPEN_SOURCE_PLAN.md`** — Line 80
- [ ] **`apps/gs-site/tile-logic-untile.md`** — Lines 254, 800, 805, 1458, 1601
- [ ] **`apps/gs-site/update-dec28-notion.md`** — Line 21
- [ ] **`apps/gs-site/decouplenotion.md`** — Line 666
- [ ] **`apps/gs-site/push-to-main-jan1.md`** — Line 51: cross-app APM mention
- [ ] **`apps/gs-site/scripts/merged-tiles.json`** — Line 429: old tile definition

### gs-site Tiles Directory (rename or archive)

- [ ] **`apps/gs-site/tiles/gsrealty-client/`** — Rename directory to `tiles/gs-crm/` or archive to `tiles/archive/gsrealty-client/`
- [ ] **`tiles/gsrealty-client/GSREALTY_BUILD_PLAN.md`** — title + 5 references
- [ ] **`tiles/gsrealty-client/GSREALTY_BUILD_PLAN_v2.md`** — 50+ references

### CRM Internal Docs (move with directory)

- [ ] **`docs/rename-gsrealty-to-crm.md`** — this plan itself
- [ ] **`lib/processing/BREAKUPS_VISUALIZER_README.md`** — Lines 375, 461: path and branding references

### Root-Level Docs (previously unlisted)

- [ ] **`load-cap.md`** (root) — Lines 29, 57: `gsrealty-client` references

### growthadvisory Docs

- [ ] **`apps/growthadvisory/docs/growthadvisoryai-vercel.md`** — 15+ historical references

---

## Phase 8: Cleanup, Build & Local Verification

### 8.1: Full Workspace Reset

> **Do NOT skip this.** `npm install` alone is insufficient.

```bash
rm -rf node_modules package-lock.json .turbo apps/gs-crm/.next apps/gs-crm/package-lock.json
npm install
(cd apps/gs-crm && npm install --package-lock-only)
```

### 8.2: Intermediate Checks (before committing)

- [ ] Validate JSON: `cat vercel.json | npx json5` or `jq .`
- [ ] No lingering references in config: `grep -r "gsrealty-client" vercel.json vercel.gs-crm.json .github/workflows/`
- [ ] No lingering self-references inside renamed app: `grep -rn "gsrealty-client" apps/gs-crm/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.json" --include="*.toml"`
- [ ] Verify email domain references updated: `grep -rn "@gsrealty\\.com\|@gsrealty\\.dev" apps/gs-crm/ --include="*.ts" --include="*.tsx" --include="*.md"`
- [ ] TypeScript passes: `npx turbo run typecheck --filter=gs-crm --filter=gs-site`
- [ ] Build succeeds: `npx turbo run build --filter=gs-crm`
- [ ] Dev server starts on port 3004: `npx turbo run dev --filter=gs-crm`
- [ ] Database queries still work (table names unchanged)

### 8.3: Commit A (Runtime/Config Only)

```bash
git add -A
git commit -m "refactor: rename apps/gsrealty-client to apps/gs-crm (runtime/config)"
```

### 8.4: Vercel Preview Deployment (BEFORE production)

> **Do NOT deploy to production first.** Test on preview.

```bash
vercel deploy  # No --prod flag
```

- [ ] Preview build succeeds in Vercel dashboard
- [ ] Preview URL `/gsrealty/api/health` returns 200
- [ ] Preview URL `/gsrealty/_next/` static assets load (check browser network tab)
- [ ] Preview URL `/gsrealty/admin` loads correctly

### 8.5: Promote to Production

```bash
vercel --prod
```

### 8.6: Post-Deploy Monitoring (monitor for 1 hour)

- [ ] Health endpoint responds: `/gsrealty/api/health`
- [ ] gs-site tiles link correctly to CRM
- [ ] Check Vercel Functions logs for errors (Vercel Dashboard → Functions → Logs)
- [ ] Cron job fires at next scheduled time (check at :00 or :15 past the hour)
- [ ] No 404s in Vercel logs
- [ ] Verify error rate < 1% in Vercel analytics

### 8.7: Commit B (Docs/Copy Only, after Commit A is stable)

```bash
git add -A
git commit -m "docs: rename gsrealty-client references to gs-crm and CRM labels"
```

### 8.8: Vercel CLI Re-link

```bash
cd apps/gs-crm
rm -rf .vercel
vercel link  # Choose existing project or create new
```

---

## What NOT to Change

| Item | Reason |
|------|--------|
| Database table names (`gsrealty_*`) | 13 tables, 30+ RLS policies, 19+ indexes, 6 functions — massive migration with no functional benefit |
| RLS function names (`is_gsrealty_admin`, `get_gsrealty_user_id`) | Coupled to table names, just identifiers |
| Supabase `.from('gsrealty_*')` calls in `lib/database/*.ts` | Table names stay the same |
| TypeScript types (`GSRealtyClient`, `GSRealtyDeal`, etc.) | Optional rename, internal to CRM app, no functional impact |
| Storage bucket `gsrealty-uploads` | Would require Supabase storage migration |
| Port 3004 | No reason to change |
| `GSREALTY_URL` env var | Keep unchanged in Part 1 to avoid Vercel/dashboard drift |
| `WABBIT_APPS.gsrealty` key | Keep unchanged in Part 1 to avoid cross-app type cascade |
| `gs-site/lib/data-qa/prompts.ts` suggested queries | Reference table names which are unchanged |
| Middleware route matching (`/admin`, `/client`) | URL paths, not directory names — rewrite-agnostic |
| Relative imports using `@/` aliases | TypeScript path mapping in tsconfig, not directory-dependent |
| `process.cwd()` calls | Resolve at runtime to wherever the app runs, not the source directory |

---

## Full Impact Inventory

| Category | Files | Changes |
|----------|-------|---------|
| Directory rename | 1 | `git mv apps/gsrealty-client apps/gs-crm` |
| Package config | 1 | package.json name → `gs-crm` |
| Vercel config | 2 | vercel.json + vercel.gsrealty.json → vercel.gs-crm.json (8 changes) |
| Internal app config | 20 | next.config (basePath + APP_NAME), layout, branding, email client + 3 templates, processing x4, .env.sample (app), supabase/config.toml, DD_SERVICE, .vercel, vercel.json (app), .claude settings x2, settings.ts, test-email-system.ts, README (app) |
| gs-site integration | 7 | client.ts, hook, tile component, tiles data, schema, merged-tiles, tiles/gsrealty-client/ dir (~25 changes) |
| CI/CD workflows | 3 | test.yml, deploy-production, deploy-staging (7 changes) |
| Environment files | 5 | .env.sample (root + gs-site + app), .env.local, .env.vercel |
| Workspace cleanup | 3 | node_modules/, package-lock.json, .turbo/ (delete and regenerate) |
| Documentation | ~30 | CLAUDE.md, README, CONTRIBUTING.md, architecture, deployment, internal docs, load-cap.md, processing README, gs-site tiles dir |
| **Total** | **~62 files** | **~160+ individual changes** |

---

## Database Footprint (Reference — NOT changing)

### Tables (14)

| # | Table | Purpose |
|---|-------|---------|
| 1 | `gsrealty_users` | User accounts with roles (admin/client) |
| 2 | `gsrealty_clients` | Client contact information |
| 3 | `gsrealty_properties` | Property records |
| 4 | `gsrealty_client_properties` | Client-property associations |
| 5 | `gsrealty_uploaded_files` | File metadata and tracking |
| 6 | `gsrealty_login_activity` | Login audit log |
| 7 | `gsrealty_admin_settings` | Application configuration |
| 8 | `gsrealty_invitations` | Email invitations for setup |
| 9 | `gsrealty_event_entries` | Admin-created events |
| 10 | `gsrealty_mcao_data` | Maricopa County Assessor data cache |
| 11 | `gsrealty_deals` | Deal pipeline stages |
| 12 | `gsrealty_outreach` | Sales activities |
| 13 | `gsrealty_campaigns` | Marketing campaigns |
| 14 | `gsrealty_campaign_leads` | Campaign-to-client attribution |

### Database Functions (6)

| Function | Purpose |
|----------|---------|
| `is_gsrealty_admin()` | Check if current user is admin |
| `get_gsrealty_user_id()` | Get current user's gsrealty_users id |
| `cleanup_expired_invitations()` | Delete expired invitations |
| `mark_invitation_used(token)` | Mark invitation as used |
| `update_updated_at_column()` | Auto-update timestamps |
| `update_gsrealty_event_entries_updated_at()` | Trigger for event entries |

### Storage Bucket

- `gsrealty-uploads` — with RLS policies for admin/client access

### Migration Files (7)

1. `20251015153522_create_gsrealty_base_tables.sql`
2. `20251017000000_create_invitations_table.sql`
3. `20251017200000_create_event_entries.sql`
4. `003_apply_storage_rls.sql`
5. `004_add_mcao_tables.sql`
6. `20260120000000_add_deals_outreach_campaigns.sql`
7. `20251218000000_comprehensive_rls_policies.sql`

---

## Rollback Plan

### Pre-Deploy Rollback (before git push)

```bash
# Recommended: switch back to backup branch (safe, avoids discarding unrelated work)
git switch backup/pre-crm-rename-YYYYMMDD

# Clean workspace state
rm -rf node_modules package-lock.json .turbo apps/gs-crm/package-lock.json
npm install
(cd apps/gs-crm && npm install --package-lock-only)
```

### Post-Deploy Rollback (after Vercel deployment)

1. **Immediate**: Vercel Dashboard → Deployments → Click previous deployment → "Promote to Production" (instant rollback, < 30 seconds)
2. **Then locally**:
   ```bash
   git revert HEAD  # Revert the rename commit
   rm -rf node_modules package-lock.json .turbo apps/gsrealty-client/package-lock.json
   npm install
   (cd apps/gsrealty-client && npm install --package-lock-only)
   git push  # Triggers Vercel rebuild with old paths
   ```
3. **Verify**: Confirm `/gsrealty/api/health` returns 200 after rollback deployment completes

### Post-Deploy Cron Recovery

If cron jobs failed during the rename window, they will auto-recover on next schedule after rollback. No manual intervention needed — Vercel crons are stateless.

---

## Approval

- [ ] Pre-flight checklist completed
- [ ] URL path decision made: ___________
- [ ] Backup branch created
- [ ] Ready to proceed

**Approved by**: ___________________
**Date**: ___________________

---
---

# Part 2: Multi-Tenant CRM Architecture

> **Vision**: Transform the CRM from a single-user application into a multi-tenant platform supporting individual agents AND team-based organizations, with proper data isolation and authentication.

**Added**: January 19, 2026
**Dependency**: Complete Part 1 (rename) first
**Complexity**: High
**Risk Level**: Medium-High

---

## Decision Point: Business Model

**CRITICAL**: Before implementing multi-tenancy, decide on the business model. This affects architecture, pricing, support expectations, and feature priorities.

| Option | Model | Description | Implications |
|--------|-------|-------------|--------------|
| **A** | **SaaS Product** | Users/orgs pay monthly subscription for self-service access | Need: billing integration, onboarding flows, usage limits, support ticketing, uptime SLAs |
| **B** | **Consulting Buildout** | Custom development for specific clients who own their instance | Need: client handoff docs, white-labeling, separate deployments per client |
| **C** | **Hybrid** | Core platform is SaaS, with premium consulting tier for customization | Need: both above, plus feature flagging for custom vs standard |

**Selected Option**: [ ] A - SaaS | [ ] B - Consulting | [ ] C - Hybrid

### Questions to Answer

- [ ] Who owns the data? (Platform vs individual tenant)
- [ ] Who handles support? (Self-service vs dedicated)
- [ ] Is there a free tier?
- [ ] What's the pricing model? (Per seat, per org, usage-based)
- [ ] Do tenants need custom branding?
- [ ] Do tenants need custom domains?

---

## User Model: Individuals + Teams

### User Types

| Type | Description | Access Level |
|------|-------------|--------------|
| **Individual Agent** | Solo real estate agent with own client book | Full access to own data |
| **Team Admin** | Creates/manages the organization | Full org access + user management |
| **Team Member** | Belongs to an organization | Access per role assignment |
| **Super Admin** | Platform operator (you) | Cross-tenant access for support |

### Organization Structure

```
┌─────────────────────────────────────────────────────────────┐
│                        PLATFORM                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │  Organization A │  │  Organization B │  │ Individual  │  │
│  │  (Team of 5)    │  │  (Team of 12)   │  │ Agent C     │  │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────┤  │
│  │ • Admin         │  │ • Admin         │  │ • Solo User │  │
│  │ • Agent 1       │  │ • Manager 1     │  │   (is own   │  │
│  │ • Agent 2       │  │ • Manager 2     │  │    admin)   │  │
│  │ • Agent 3       │  │ • Agent 1-10    │  │             │  │
│  │ • Assistant     │  │                 │  │             │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
│                                                              │
│  Each org/individual has ISOLATED data via RLS              │
└─────────────────────────────────────────────────────────────┘
```

### Role-Based Access Control (RBAC)

| Role | Permissions |
|------|-------------|
| `owner` | Full access, billing, delete org, transfer ownership |
| `admin` | Manage users, all data CRUD, settings |
| `manager` | View all org data, manage assigned agents |
| `agent` | CRUD own clients/deals, view shared resources |
| `assistant` | Read-only + limited write (notes, tasks) |
| `viewer` | Read-only access to assigned data |

---

## Data Isolation Strategy: Row-Level Security

### Why RLS (vs Schema/DB per Tenant)

| Approach | Pros | Cons |
|----------|------|------|
| **RLS (Chosen)** | Single schema, simple migrations, lower cost, Supabase-native | Requires careful policy design |
| Schema per tenant | Better isolation, easier data export | Complex migrations, connection pooling issues |
| DB per tenant | Maximum isolation | Highest cost, operational complexity |

### RLS Implementation Pattern

Every tenant-scoped table gets an `organization_id` column:

```sql
-- Example: gsrealty_clients table
ALTER TABLE gsrealty_clients
ADD COLUMN organization_id UUID REFERENCES organizations(id);

-- RLS Policy: Users can only see their org's data
CREATE POLICY "Users can view own org clients"
ON gsrealty_clients
FOR SELECT
USING (
  organization_id = (
    SELECT organization_id
    FROM organization_members
    WHERE user_id = auth.uid()
  )
);

-- Individual agents: organization_id = their personal org
-- Team members: organization_id = team's org
```

### Tables Requiring `organization_id`

| Table | Current State | Migration Needed |
|-------|---------------|------------------|
| `gsrealty_clients` | No org_id | Add column + backfill |
| `gsrealty_deals` | No org_id | Add column + backfill |
| `gsrealty_properties` | No org_id | Add column + backfill |
| `gsrealty_client_properties` | No org_id | Add column + backfill |
| `gsrealty_campaigns` | No org_id | Add column + backfill |
| `gsrealty_campaign_leads` | No org_id | Add column + backfill |
| `gsrealty_outreach` | No org_id | Add column + backfill |
| `gsrealty_uploaded_files` | No org_id | Add column + backfill |
| `gsrealty_event_entries` | No org_id | Add column + backfill |
| `gsrealty_users` | Has user context | Link to org_members |
| `gsrealty_admin_settings` | Global | Becomes per-org settings |
| `gsrealty_invitations` | No org_id | Add column |
| `gsrealty_login_activity` | User-scoped | Keep as-is (audit log) |
| `gsrealty_mcao_data` | Shared data | Keep global (reference data) |

---

## New Database Tables

### Core Multi-Tenancy Tables

```sql
-- Organizations (tenants)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- URL-friendly identifier
  type TEXT NOT NULL CHECK (type IN ('individual', 'team', 'enterprise')),

  -- Billing (if SaaS)
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'professional', 'enterprise')),
  stripe_customer_id TEXT,
  subscription_status TEXT DEFAULT 'active',

  -- Branding (if white-label)
  logo_url TEXT,
  primary_color TEXT,
  custom_domain TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Organization membership
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('owner', 'admin', 'manager', 'agent', 'assistant', 'viewer')),

  -- Permissions override (optional fine-grained control)
  permissions JSONB DEFAULT '{}',

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended')),
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, user_id)
);

-- Organization invitations
CREATE TABLE organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'agent',
  invited_by UUID REFERENCES auth.users(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_invites_token ON organization_invitations(token);
CREATE INDEX idx_org_invites_email ON organization_invitations(email);
```

### Helper Functions

```sql
-- Get current user's organization
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id
  FROM organization_members
  WHERE user_id = auth.uid()
    AND status = 'active'
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if user has role in org
CREATE OR REPLACE FUNCTION user_has_role(required_roles TEXT[])
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members
    WHERE user_id = auth.uid()
      AND status = 'active'
      AND role = ANY(required_roles)
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if user is org admin
CREATE OR REPLACE FUNCTION is_org_admin()
RETURNS BOOLEAN AS $$
  SELECT user_has_role(ARRAY['owner', 'admin']);
$$ LANGUAGE SQL SECURITY DEFINER STABLE;
```

---

## Authentication Enhancement Plan

### Current State (Supabase Auth)

- [x] Basic email/password authentication
- [x] Magic link support
- [ ] OAuth providers (Google, Microsoft)
- [ ] Organization-aware session

### Required Enhancements

#### 1. Post-Authentication Organization Resolution

```typescript
// After sign-in, determine user's organization
async function resolveUserOrganization(userId: string) {
  const { data: memberships } = await supabase
    .from('organization_members')
    .select('organization_id, role, organizations(name, slug)')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (memberships.length === 0) {
    // New user - create personal organization
    return createPersonalOrganization(userId);
  }

  if (memberships.length === 1) {
    // Single org - auto-select
    return memberships[0];
  }

  // Multiple orgs - show org picker
  return { requiresOrgSelection: true, memberships };
}
```

#### 2. Organization Switching (Multi-Org Users)

Some users may belong to multiple organizations:
- Personal solo practice
- Team they're part of
- Consulting access to client orgs

Need: Org switcher in UI, session context update

#### 3. Invitation Flow

```
1. Admin sends invite → Creates organization_invitations row
2. Email sent with magic link containing token
3. Recipient clicks link → Validates token
4. If new user: Sign up flow → Auto-join org
5. If existing user: Confirm join → Add to org_members
```

#### 4. Sign-Up Flow Changes

| Scenario | Flow |
|----------|------|
| Direct sign-up | Create user → Create personal org → Set as owner |
| Invited sign-up | Create user → Join existing org → Set invited role |
| SSO/OAuth | Create user → Check domain → Auto-join or create personal |

---

## Implementation Phases

### Phase A: Foundation (Pre-requisite: Part 1 Complete)

**Goal**: Add organization tables without breaking existing functionality

1. Create `organizations` table
2. Create `organization_members` table
3. Create `organization_invitations` table
4. Create helper functions
5. Create "default" organization for existing data
6. Migrate existing users to default org as owners

**Migration SQL**:

```sql
-- Create default org for existing data
INSERT INTO organizations (id, name, slug, type)
VALUES ('00000000-0000-0000-0000-000000000001', 'Sullivan Realty', 'sullivan-realty', 'team');

-- Add all existing gsrealty_users to default org
INSERT INTO organization_members (organization_id, user_id, role, status, joined_at)
SELECT
  '00000000-0000-0000-0000-000000000001',
  id,
  CASE WHEN role = 'admin' THEN 'admin' ELSE 'agent' END,
  'active',
  NOW()
FROM gsrealty_users;
```

**Risk**: Low (additive only)

---

### Phase B: Add Organization Context to Tables

**Goal**: Add `organization_id` to all tenant-scoped tables

1. Add `organization_id` column to each table (nullable initially)
2. Backfill with default org ID
3. Add foreign key constraint
4. Make column NOT NULL
5. Add indexes

**Per-table migration pattern**:

```sql
-- Step 1: Add column
ALTER TABLE gsrealty_clients
ADD COLUMN organization_id UUID REFERENCES organizations(id);

-- Step 2: Backfill
UPDATE gsrealty_clients
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

-- Step 3: Make required
ALTER TABLE gsrealty_clients
ALTER COLUMN organization_id SET NOT NULL;

-- Step 4: Index
CREATE INDEX idx_clients_org ON gsrealty_clients(organization_id);
```

**Risk**: Medium (schema changes, but backward compatible)

---

### Phase C: Implement RLS Policies

**Goal**: Enforce data isolation at database level

1. Enable RLS on all tenant tables
2. Create SELECT policies (users see only their org's data)
3. Create INSERT policies (users can only insert to their org)
4. Create UPDATE policies (users can only update their org's data)
5. Create DELETE policies (admins only, within their org)

**Example policy set for `gsrealty_clients`**:

```sql
ALTER TABLE gsrealty_clients ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view their org's clients
CREATE POLICY "select_org_clients" ON gsrealty_clients
FOR SELECT USING (organization_id = get_user_organization_id());

-- INSERT: Users can create clients in their org
CREATE POLICY "insert_org_clients" ON gsrealty_clients
FOR INSERT WITH CHECK (organization_id = get_user_organization_id());

-- UPDATE: Users can update their org's clients
CREATE POLICY "update_org_clients" ON gsrealty_clients
FOR UPDATE USING (organization_id = get_user_organization_id());

-- DELETE: Only admins can delete
CREATE POLICY "delete_org_clients" ON gsrealty_clients
FOR DELETE USING (
  organization_id = get_user_organization_id()
  AND is_org_admin()
);
```

**Risk**: High (incorrect policies = data leaks or lockouts)

**Testing required**:
- [ ] User A cannot see User B's data
- [ ] Team members see shared team data
- [ ] Admins can perform admin actions
- [ ] Service role bypasses RLS for admin operations

---

### Phase D: Update Application Code

**Goal**: Application respects organization context

1. Update AuthContext to include organization info
2. Add org context to all API routes
3. Update data fetching to NOT filter by org (RLS handles it)
4. Add organization management UI
5. Add user invitation flow
6. Add organization switcher (if multi-org)

**AuthContext changes**:

```typescript
interface AuthContextType {
  user: User | null;
  organization: Organization | null;  // NEW
  membership: OrganizationMember | null;  // NEW
  isOrgAdmin: boolean;  // NEW
  switchOrganization: (orgId: string) => Promise<void>;  // NEW
  // ... existing methods
}
```

**Risk**: Medium (significant code changes)

---

### Phase E: New User Onboarding

**Goal**: Seamless experience for new sign-ups

1. Sign-up creates personal organization automatically
2. OR sign-up via invitation joins existing org
3. Onboarding wizard for new orgs
4. Import existing data option

**Risk**: Low

---

### Phase F: Organization Management UI

**Goal**: Admins can manage their organization

Pages/features needed:
- [ ] `/admin/organization` - Org settings
- [ ] `/admin/organization/members` - User list
- [ ] `/admin/organization/invitations` - Pending invites
- [ ] `/admin/organization/roles` - Role management
- [ ] `/admin/organization/billing` - Subscription (if SaaS)

**Risk**: Low (new UI, no breaking changes)

---

## Migration Safety Protocols

### Before Multi-Tenancy Migration

- [ ] Full database backup
- [ ] Test migration on staging/branch
- [ ] Document rollback procedure
- [ ] Notify existing users of maintenance window
- [ ] Verify RLS policies in test environment

### Rollback Plan

```sql
-- If RLS causes issues, disable temporarily
ALTER TABLE gsrealty_clients DISABLE ROW LEVEL SECURITY;

-- Or drop specific policy
DROP POLICY IF EXISTS "select_org_clients" ON gsrealty_clients;

-- Emergency: Remove org_id constraint
ALTER TABLE gsrealty_clients
ALTER COLUMN organization_id DROP NOT NULL;
```

---

## Future Considerations

### If SaaS (Option A Selected)

- [ ] Stripe integration for billing
- [ ] Usage metering (clients, storage, API calls)
- [ ] Plan limits enforcement
- [ ] Trial periods
- [ ] Upgrade/downgrade flows

### If Consulting (Option B Selected)

- [ ] Client handoff documentation
- [ ] White-label configuration
- [ ] Separate deployment scripts
- [ ] Client-specific customization flags
- [ ] Support/maintenance contracts

### Feature Flags for Gradual Rollout

```typescript
const FEATURE_FLAGS = {
  MULTI_TENANCY_ENABLED: false,  // Enable after Phase D complete
  TEAM_FEATURES: false,          // Enable after org UI complete
  BILLING_ENABLED: false,        // Enable when Stripe ready
  CUSTOM_DOMAINS: false,         // Premium feature
};
```

---

## Multi-Tenancy Checklist

### Phase A: Foundation
- [ ] Create `organizations` table
- [ ] Create `organization_members` table
- [ ] Create `organization_invitations` table
- [ ] Create helper functions
- [ ] Migrate existing data to default org

### Phase B: Schema Updates
- [ ] Add `organization_id` to `gsrealty_clients`
- [ ] Add `organization_id` to `gsrealty_deals`
- [ ] Add `organization_id` to `gsrealty_properties`
- [ ] Add `organization_id` to `gsrealty_client_properties`
- [ ] Add `organization_id` to `gsrealty_campaigns`
- [ ] Add `organization_id` to `gsrealty_campaign_leads`
- [ ] Add `organization_id` to `gsrealty_outreach`
- [ ] Add `organization_id` to `gsrealty_uploaded_files`
- [ ] Add `organization_id` to `gsrealty_event_entries`
- [ ] Add `organization_id` to `gsrealty_invitations`

### Phase C: RLS Policies
- [ ] Enable RLS on all tenant tables
- [ ] Create policies for each table
- [ ] Test isolation between orgs
- [ ] Test admin vs member permissions

### Phase D: Application Code
- [ ] Update AuthContext
- [ ] Update API routes
- [ ] Remove manual org filtering (RLS handles it)
- [ ] Add organization context to queries

### Phase E: Onboarding
- [ ] Auto-create personal org on sign-up
- [ ] Invitation acceptance flow
- [ ] Onboarding wizard

### Phase F: Management UI
- [ ] Organization settings page
- [ ] Member management
- [ ] Invitation management
- [ ] Role management

---

## Appendix: Quick Reference

### Key Database Functions

| Function | Purpose |
|----------|---------|
| `get_user_organization_id()` | Returns current user's org ID |
| `user_has_role(roles[])` | Check if user has any of the roles |
| `is_org_admin()` | Check if user is owner or admin |

### Organization Types

| Type | Description | Use Case |
|------|-------------|----------|
| `individual` | Single-person org | Solo agents |
| `team` | Small-medium team | Brokerages, offices |
| `enterprise` | Large organization | Multi-office firms |

### Member Roles Hierarchy

```
owner > admin > manager > agent > assistant > viewer
```

---

## Document History

| Date | Author | Changes |
|------|--------|---------|
| 2026-01-18 | Claude | Initial rename plan (Part 1) |
| 2026-01-19 | Claude | Added multi-tenancy architecture (Part 2) |
| 2026-02-14 | Claude | Full codebase audit: corrected table count (13→14), fixed script assumptions, expanded impact from ~27 to ~48 files, added missing files (vercel.gsrealty.json, branding.ts, email configs, data-qa/schema.ts, CLAUDE.md, .vercel/project.json, CONTRIBUTING.md, .env.local), added database footprint reference section |
| 2026-02-14 | Garrett | Changed target directory name from `CRM` to `gs-crm` for consistency with `gs-site` naming convention. Code identifiers (WabbitAppKey, exports, hooks) stay as `crm` for cleaner usage |
| 2026-02-14 | Claude | Adversarial vetting (6 agents): upgraded risk to Medium, added commit strategy, risk matrix, 9 missing files (supabase/config.toml, DD_SERVICE, .claude settings x2, app .env.sample, .env.local comment, email env entries), enhanced Phase 8 with preview deployment + monitoring, enhanced rollback plan for post-deploy, added intermediate testing steps, workspace cleanup requirements |
| 2026-02-14 | Claude | 5-agent validation sweep: added 8 missing items — email templates (3 files, ~12 branding strings), `next.config.js` APP_NAME, processing log prefixes (4 files), `template-populator.ts` hardcoded filename, `gs-site/tiles/gsrealty-client/` directory, `load-cap.md`, `push-to-main-jan1.md`, `merged-tiles.json`. Corrected `.claude/settings.local.json` count (8→15+). Added verify-first notes for `layout.tsx`/`branding.ts` (may already be clean). Added self-reference grep to Phase 8.2. Added staging workflow step names (lines 133, 135). Updated totals: ~50→~58 files, ~135→~150+ changes |
