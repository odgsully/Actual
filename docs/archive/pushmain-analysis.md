# Push to Main Analysis — cleanup-checkpoint → main

> Analyzed: 2026-02-14
> Overall Safety Rating: **9.5/10**

---

## Per-App Safety Ratings

| App | Rating | Production URL | Changes |
|-----|--------|---------------|---------|
| **gs-site** | 9.5/10 | pickleballisapsyop.com | 2 comment edits, deleted junk files |
| **growthadvisory** | 10/10 | growthadvisory.ai (not yet deployed) | 1 doc added, 1 auto-gen deleted |
| **wabbit** | 10/10 | (no deployment) | 15 planning/ref docs added |
| **wabbit-re** | 9.5/10 | wabbit-rank.ai | 6 unused deps removed, 16 files added, path updates |
| **gsrealty-client** | 9.5/10 | (CRM, not public) | 5 unused deps removed, 18 dead scripts deleted |

---

## Items Preventing 10/10

### 1. gsrealty-client: stale script reference in map-test page

- `apps/gsrealty-client/app/map-test/page.tsx` line 296 references deleted `db:setup-spatial` script
- Impact: cosmetic only — help text on a test page, not functional code
- Fix: update or remove the reference post-merge

### 2. wabbit-re: DEMO_PROPERTIES_SETUP.md references removed script

- `apps/wabbit-re/docs/setup/DEMO_PROPERTIES_SETUP.md` references deleted `setup-demo-properties.sh`
- Impact: documentation only — no runtime effect
- Fix: update doc to inline the steps or remove the reference

### 3. Dependency removals in wabbit-re + gsrealty-client

- `embla-carousel-react`, `framer-motion`, `zustand`, `swr`, `node-cron` removed from both apps
- `@playwright/test` + `test:e2e` script removed from wabbit-re
- All verified with grep: zero imports in source code
- Theoretical risk: Turborepo workspace hoisting or shared `packages/*` code relying on sibling deps
- Mitigation: gs-site retains its own copies, no shared package imports these

### 4. .gitignore overhaul has broad scope

- New rules: `.turbo/`, `tsconfig.tsbuildinfo`, `coverage/`, `~$*`, `*.bak`, `next-env.d.ts`
- SQL blanket ignore (`*.sql`) now has negation rules to track migration files
- All changes verified correct, but touches every app's file visibility
- First deploy after merge may behave slightly differently if Vercel picks up newly-tracked files

### 5. Root `package-lock.json` changed

- 6 packages removed from lockfile due to dependency cleanup
- `npm install` after merge should resolve cleanly, but lock file diffs can occasionally cause unexpected resolution changes

### 6. Untracked SQL migration files need separate attention

- `apps/gs-site/migrations/` and `apps/gs-site/supabase/` contain untracked SQL files (visible in `git status`)
- These predate the cleanup — NOT part of this merge
- Should be reviewed and committed separately
- Not a blocker, but loose ends

---

## What IS Safe (confirmed by 6-agent audit)

### gs-site (9.5/10)
- Only 2 comment edits (`GO-PLAN.md` path update) + deleted junk (`.bak`, `.vcf`, logo assets)
- All 5 LIFX cron routes verified present
- Zero changes to: API routes, tile components, OAuth, Notion, forms, env vars
- Zero changes to: vercel.json, next.config, tsconfig, tailwind, package.json
- Build passes, tiles confirmed working locally

### growthadvisory (10/10)
- 1 doc added (`docs/growthadvisoryai-vercel.md`), 1 auto-gen deleted (`next-env.d.ts`)
- Zero source code changes, zero config changes, zero dependency changes
- App not yet deployed to Vercel — zero production risk

### wabbit (10/10)
- 15 documentation/reference files added (CLAUDE.md, build plans, architecture docs, SVG diagrams)
- Zero existing files modified or deleted
- No build system exists — cannot break anything
- All additions match cleanup plan exactly

### wabbit-re (9.5/10)
- 16 files added: docs, SQL reference files, helper scripts
- 6 unused deps removed (grep-verified zero imports)
- Script path updates all verified correct (`verify-setup.js`, `check-spatial-setup.ts`)
- `tsconfig.json` cleaned up stale excludes for non-existent dirs
- Zero changes to: API routes, components, lib, hooks, contexts

### gsrealty-client (9.5/10)
- 18 dead scripts deleted (`_scripts_WABBIT_RE_DO_NOT_USE/`)
- 18 coverage report files deleted
- 5 unused deps removed (grep-verified zero imports)
- 7 broken `db:*` scripts removed from package.json (targets never existed)
- `tsconfig.json` cleaned up stale excludes
- 1 doc added (`docs/rename-gsrealty-to-crm.md`)
- Zero changes to: API routes, components, lib, active scripts

---

## Post-Merge Checklist

1. Run `npm install` to sync lockfile
2. Run `npm run build` per-app to verify
3. Fix `gsrealty-client/app/map-test/page.tsx:296` stale script reference
4. Fix `wabbit-re/docs/setup/DEMO_PROPERTIES_SETUP.md` stale script reference
5. Review untracked SQL migrations in gs-site (separate commit)
6. Monitor first Vercel deploy for any newly-tracked file surprises
