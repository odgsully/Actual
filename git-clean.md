# Git Branch Cleanup & Merge Plan

**Document Created:** 2025-12-18
**Current Branch:** `11.13MCAO_lookup_finish_add_APNlookup`
**Target Branch:** `main`
**Backup Tag:** `backup/pre-merge-20251218-1220`

---

## Overall Goal

Safely merge all work from `11.13MCAO_lookup_finish_add_APNlookup` to `main` while:
- Preserving all functionality (MCAO, ReportIt, Scraping, Admin Portal)
- Ensuring no data loss from any branch
- Maintaining code quality
- Cleaning up stale/corrupted branches
- Documenting the process for future reference

---

## Executive Summary

| Metric | Value |
|--------|-------|
| Commits to merge | 37 |
| Files changed | 996 |
| Lines added | +363,098 |
| Lines removed | -2,337 |
| Merge conflicts | **0** (fast-forward safe) |
| TypeScript errors | 23 (in progress) |

---

## Branch Analysis Summary

### Branches to MERGE
| Branch | Status | Action |
|--------|--------|--------|
| `11.13MCAO_lookup_finish_add_APNlookup` | CURRENT | Merge to main |

### Branches to DELETE (Already Merged/Superseded)
| Branch | Reason | Safe? |
|--------|--------|-------|
| `populate-property-scraped` | Already ancestor of current | ✅ |
| `populate-property-upload` | Already ancestor of current | ✅ |
| `10.25finish-gsrealty` | Superseded by current | ✅ |
| `10.14monorepo-migration` | Superseded by current | ✅ |
| `feat/monorepo-migration` | Superseded by current | ✅ |
| `backup/wabbit-re-stable` | Duplicate of populate-property-scraped | ✅ |
| `clean-deployment` | CORRUPTED (lost 34,199 files) | ✅ |
| `10 2.14monorepo-migration` | BROKEN ref (space in name) | ✅ |

### Branches to KEEP
| Branch | Reason |
|--------|--------|
| `main` | Primary branch |
| `backup-before-reportit-v2-merge-*` | Recent safety backup (keep 30 days) |
| `deployment-ready-verified` | Deployment reference |

### Worktrees to REMOVE
| Worktree | Location | Reason |
|----------|----------|--------|
| `nifty-ardinghelli` | `~/.claude-worktrees/Actual/nifty-ardinghelli` | Already ancestor of current |

---

## Phase Checklist

### Phase 0: SNAPSHOT & BACKUP
**Status:** ✅ COMPLETED

- [x] Create git tag backup
  ```bash
  git tag -a "backup/pre-merge-20251218-1220" -m "BACKUP: Before merging to main"
  ```
- [x] Verify backup tag points to current HEAD
  ```bash
  git rev-parse backup/pre-merge-20251218-1220^{commit}
  # Should match: 5634bbb9b8201e79aa866e619c8bf708959829d9
  ```
- [x] Document baseline state
  - Branch: `11.13MCAO_lookup_finish_add_APNlookup`
  - Commit: `5634bbb`
  - Total tracked files: 1,320
  - Commits ahead of main: 37

**Gate:** ✅ PASSED - Backup verified accessible

---

### Phase 1: SECURITY & DEPENDENCY AUDIT
**Status:** ✅ COMPLETED (with noted issues)

- [x] Run npm audit
  ```bash
  cd apps/gsrealty-client && npm audit
  ```
  **Result:** 6 vulnerabilities found
  - 1 critical: Next.js RCE (fixable)
  - 4 high: Next.js DoS (fixable)
  - 1 high: xlsx prototype pollution (NO FIX)

- [x] Scan for hardcoded secrets
  ```bash
  git diff main...HEAD -- "*.ts" "*.tsx" | grep -iE "(api_key|secret|password|token)"
  ```
  **Result:** ✅ No real secrets found (only test values in .claude settings)

- [x] Audit environment variables
  **Result:** ⚠️ 8 env vars used but not in .env.sample:
  - `ADMIN_DELETE_KEY`
  - `ADMIN_USERNAME`
  - `ALERT_WEBHOOK_URL`
  - `CRON_SECRET`
  - `MCAO_API_KEY`
  - `MCAO_API_URL`
  - `NEXT_PUBLIC_ADMIN_EMAIL`

**Gate:** ⚠️ PASSED with notes
- Run `npm audit fix` after merge
- `xlsx` vulnerability has no fix - accept risk
- Update .env.sample with missing vars (non-blocking)

---

### Phase 2: CODE QUALITY FIXES
**Status:** 🔄 IN PROGRESS

#### Fixed TypeScript Errors (27 → 23)
- [x] `lib/processing/transaction-utils.ts` - 8 errors (PropertyData → PropertyDataBase)
- [x] `lib/supabase/server.ts` - 3 errors (await cookies())
- [x] `lib/processing/breakups-visualizer.ts` - 10 errors (function signatures)
- [x] `lib/processing/breakups-packager.ts` - 3 errors (archiver import + types)
- [x] `lib/processing/propertyradar-generator.ts` - 2 errors (Buffer types)
- [x] `lib/processing/analysis-sheet-generator.ts` - 1 error (SubdivisionName)

#### Remaining TypeScript Errors (23)
See [TypeScript Error Resolution Options](#typescript-error-resolution-options) below.

**Gate:** ⏳ PENDING - Choose option and implement

---

### Phase 3: TEST VERIFICATION
**Status:** ⏳ PENDING

- [ ] Run TypeScript check
  ```bash
  cd apps/gsrealty-client && npm run typecheck
  ```
- [ ] Run linting
  ```bash
  npm run lint
  ```
- [ ] Run unit tests
  ```bash
  npm test
  ```
- [ ] Run build
  ```bash
  npm run build
  ```

**Gate:** All commands must pass with 0 errors

---

### Phase 4: DRY-RUN MERGE
**Status:** ⏳ PENDING

- [ ] Perform test merge without committing
  ```bash
  git checkout main
  git merge --no-commit --no-ff 11.13MCAO_lookup_finish_add_APNlookup
  ```
- [ ] Review merged state
  ```bash
  git diff --cached --stat
  ```
- [ ] Run tests on merged state
  ```bash
  cd apps/gsrealty-client && npm run typecheck && npm run build
  ```
- [ ] Abort dry-run
  ```bash
  git merge --abort
  ```

**Gate:** Dry-run shows no conflicts, tests pass

---

### Phase 5: CLEANUP PRE-MERGE
**Status:** ⏳ PENDING

- [ ] Remove corrupted git references
  ```bash
  git update-ref -d "refs/heads/10 2.14monorepo-migration" 2>/dev/null
  ```
- [ ] Delete corrupted remote branch
  ```bash
  git push origin --delete clean-deployment
  ```
- [ ] Remove nifty-ardinghelli worktree
  ```bash
  git worktree remove /Users/garrettsullivan/.claude-worktrees/Actual/nifty-ardinghelli
  ```
- [ ] Clean untracked test files (optional)
  ```bash
  rm -rf apps/gsrealty-client/scripts/__pycache__/
  rm apps/gsrealty-client/test-*.csv
  rm -rf apps/gsrealty-client/test-output*/
  ```
- [ ] Verify git status is clean
  ```bash
  git status
  git fsck --no-dangling
  ```

**Gate:** No broken refs, worktree removed

---

### Phase 6: EXECUTE MERGE
**Status:** ⏳ PENDING

- [ ] Switch to main branch
  ```bash
  git checkout main
  ```
- [ ] Pull latest main
  ```bash
  git pull origin main
  ```
- [ ] Perform merge with explicit commit
  ```bash
  git merge 11.13MCAO_lookup_finish_add_APNlookup --no-ff -m "$(cat <<'EOF'
  Merge branch '11.13MCAO_lookup_finish_add_APNlookup' into main

  Features merged:
  - Complete MCAO bulk Address→APN→MCAO lookup pipeline
  - ReportIt 26-analysis system with PDF generation
  - Monorepo structure (gsrealty-client, gs-site, wabbit-re)
  - Property scraping system (Zillow, Redfin, Homes.com)
  - Admin dashboard with client management
  - Client portal with file management
  - Safety documentation and protocols

  37 commits, 996 files changed

  🤖 Generated with Claude Code
  EOF
  )"
  ```
- [ ] Verify merge commit
  ```bash
  git log --oneline -5
  ```
- [ ] **DO NOT PUSH YET**

**Gate:** Merge succeeds, git log shows correct history

---

### Phase 7: POST-MERGE VALIDATION
**Status:** ⏳ PENDING

- [ ] Run TypeScript check on main
  ```bash
  cd apps/gsrealty-client && npm run typecheck
  ```
- [ ] Run build on main
  ```bash
  npm run build
  ```
- [ ] Run unit tests
  ```bash
  npm test
  ```
- [ ] Manual smoke test (start dev server)
  ```bash
  npm run dev
  ```
- [ ] Verify key pages load:
  - [ ] Home page (`/`)
  - [ ] Admin login (`/admin`)
  - [ ] MCAO lookup (`/admin/mcao`)
  - [ ] ReportIt upload (`/admin/reportit`)

**Gate:** All checks pass on main branch

---

### Phase 8: PUSH & VERIFY
**Status:** ⏳ PENDING

- [ ] Push main to remote
  ```bash
  git push origin main
  ```
- [ ] Push backup tag to remote
  ```bash
  git push origin backup/pre-merge-20251218-1220
  ```
- [ ] Verify CI/CD pipeline (if exists)
- [ ] Deploy to staging (if exists)
- [ ] Smoke test on staging

**Gate:** Remote updated successfully

---

### Phase 9: CLEANUP & DOCUMENTATION
**Status:** ⏳ PENDING

#### Delete Merged Branches (Local)
```bash
git branch -d populate-property-upload
git branch -d populate-property-scraped
git branch -d 10.25finish-gsrealty
git branch -d 10.14monorepo-migration
git branch -d feat/monorepo-migration
git branch -d backup/wabbit-re-stable
git branch -d 11.13MCAO_lookup_finish_add_APNlookup
```

#### Delete Merged Branches (Remote)
```bash
git push origin --delete populate-property-scraped
git push origin --delete 10.25finish-gsrealty
git push origin --delete 10.14monorepo-migration
git push origin --delete backup/wabbit-re-stable
```

#### Create Release Tag
```bash
git tag -a "v2.0.0-gsrealty" -m "$(cat <<'EOF'
GSRealty Client Complete Release

Major Features:
- MCAO Lookup System (single & bulk)
- ReportIt Analysis & PDF Generation
- Monorepo Architecture
- Admin Portal
- Client Portal
- Property Scraping System
- Safety Documentation

🤖 Generated with Claude Code
EOF
)"
git push origin v2.0.0-gsrealty
```

#### Update Documentation
- [ ] Update CLAUDE.md with new branch status
- [ ] Update README.md with release notes
- [ ] Archive or delete backup branches (after 30 days)

**Gate:** Repository clean, documentation current

---

## TypeScript Error Resolution Options

### Current Status
- **Original errors:** 27
- **Fixed:** 27
- **New errors discovered:** 23
- **Total remaining:** 23

### Error Categories

| Category | Count | Cause |
|----------|-------|-------|
| Next.js 15 async `headers()`/`cookies()` | 10 | Next.js 15 migration |
| Buffer type mismatch | 5 | Node.js types vs Web API |
| Property case mismatch | 3 | MCAOApiResponse type |
| archiver import | 2 | CommonJS vs ESM |
| Other | 3 | Various |

### Affected Files

```
app/api/admin/events/route.ts (2 errors)
app/api/admin/mcao/bulk/route.ts (1 error)
app/api/admin/mcao/property/[apn]/route.ts (1 error)
app/api/admin/reportit/download/breakups/route.ts (1 error)
app/api/admin/reportit/download/propertyradar/route.ts (1 error)
app/api/admin/reportit/upload/route.ts (1 error)
app/api/cron/check-health/route.ts (2 errors)
app/api/cron/daily-cleanup/route.ts (2 errors)
app/api/cron/hourly-scrape/route.ts (2 errors)
app/api/events/route.ts (1 error)
lib/mcao/batch-apn-lookup.ts (2 errors)
lib/mcao/bulk-processor.ts (2 errors)
lib/mcao/zip-generator.ts (2 errors)
lib/processing/__tests__/breakups-visualizer.example.ts (2 errors)
lib/processing/analysis-sheet-generator.ts (2 errors)
```

---

### Option A: Fix All Errors (Recommended)
**Time Estimate:** 20-30 minutes
**Risk:** Low
**Technical Debt:** None

**Approach:**
1. Fix Next.js 15 async APIs by adding `await` to `headers()` and `cookies()` calls
2. Fix Buffer types by using `Uint8Array` or proper type assertions
3. Fix property case mismatches (`LotSize` → `lotSize`, etc.)
4. Fix archiver import in zip-generator.ts
5. Fix test file type errors

**Pros:**
- Clean TypeScript compilation
- No technical debt
- Proper Next.js 15 compatibility

**Cons:**
- Takes more time
- Touches many files

**Commands after fix:**
```bash
cd apps/gsrealty-client
npm run typecheck  # Should pass
npm run build      # Should pass
```

---

### Option B: Suppress with @ts-expect-error (Quick)
**Time Estimate:** 5-10 minutes
**Risk:** Medium
**Technical Debt:** Creates follow-up work

**Approach:**
Add targeted `// @ts-expect-error` comments to suppress specific errors:

```typescript
// @ts-expect-error - Next.js 15 async headers() migration pending
const headersList = headers()
```

**Pros:**
- Quick to implement
- Allows merge to proceed
- Errors are documented

**Cons:**
- Creates technical debt
- Errors not actually fixed
- Need follow-up PR

**Follow-up Required:**
- Create issue/ticket to fix errors properly
- Schedule fix within 2 weeks

---

### Option C: Relax TypeScript Config (Not Recommended)
**Time Estimate:** 2 minutes
**Risk:** High
**Technical Debt:** Significant

**Approach:**
Modify `tsconfig.json` to reduce strictness:

```json
{
  "compilerOptions": {
    "strict": false,
    "noImplicitAny": false
  }
}
```

**Pros:**
- Fastest option
- All errors disappear

**Cons:**
- Hides real bugs
- Reduces type safety
- Goes against best practices
- Makes future debugging harder

**NOT RECOMMENDED** - Only use as last resort

---

### Recommended Decision Matrix

| Criteria | Option A | Option B | Option C |
|----------|----------|----------|----------|
| Time | 20-30 min | 5-10 min | 2 min |
| Code Quality | ✅ High | ⚠️ Medium | ❌ Low |
| Technical Debt | ✅ None | ⚠️ Some | ❌ High |
| Risk | ✅ Low | ⚠️ Medium | ❌ High |
| **Recommendation** | **✅ Best** | ⚠️ Acceptable | ❌ Avoid |

---

## Rollback Procedures

### If Merge Fails (Phase 6)
```bash
git merge --abort
```

### If Tests Fail Post-Merge (Phase 7)
```bash
git checkout main
git reset --hard HEAD~1
```

### If Push Fails (Phase 8)
```bash
git reset --hard origin/main
```

### If Production Issues (After Deploy)
```bash
git checkout main
git reset --hard backup/pre-merge-20251218-1220
git push origin main --force-with-lease
```

---

## Smoke Test Checklist

After merge, verify these critical paths work:

### Admin Portal
- [ ] `/admin` - Dashboard loads
- [ ] `/admin/clients` - Client list loads
- [ ] `/admin/mcao` - MCAO lookup page loads
- [ ] `/admin/mcao` - Single APN lookup works
- [ ] `/admin/mcao` - Bulk upload works
- [ ] `/admin/reportit` - ReportIt page loads
- [ ] `/admin/reportit` - File upload generates PDF

### Client Portal
- [ ] `/client/dashboard` - Dashboard loads
- [ ] `/client/files` - File list loads
- [ ] `/client/properties` - Properties load

### Authentication
- [ ] Admin login works
- [ ] Client login works
- [ ] Session persists on refresh

---

## Environment Variables Checklist

Ensure these are set before deployment:

### Required (Existing)
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
RESEND_REPLY_TO_EMAIL=
```

### Required (New - Add to .env.sample)
```bash
ADMIN_USERNAME=
CRON_SECRET=
MCAO_API_URL=
```

### Optional
```bash
ADMIN_DELETE_KEY=
ALERT_WEBHOOK_URL=
MCAO_API_KEY=
NEXT_PUBLIC_ADMIN_EMAIL=
```

---

## Post-Merge Tasks

- [ ] Run `npm audit fix` to address Next.js vulnerabilities
- [ ] Update `.env.sample` with new environment variables
- [ ] Consider replacing `xlsx` package (has unfixable vulnerability)
- [ ] Schedule TypeScript error fixes if Option B was chosen
- [ ] Update JIRA/project board with completion
- [ ] Notify team of merge completion

---

## Reference

### Key Commits Being Merged
```
5634bbb docs: Consolidate migration docs, cleanup duplicates, establish safety protocols
3df8d50 feat(mcao): Complete bulk Address→APN→MCAO lookup pipeline
aecdca9 Report UI decent
325432c ReportIt pdf's now generate but are bad
68b5f33 done with MLS Uploads
```

### Repository Statistics
- Total tracked files: 1,320
- apps/gsrealty-client files: 1,771 (TS/TSX)
- apps/wabbit-re files: 5,106 (TS/TSX)
- Test files: 181
- Integration tests: 122+
- E2E tests: 40+

### Documentation Updated
- `MIGRATION_PROGRESS_TRACKER.md`
- `MIGRATION_SAFETY_PROTOCOLS.md`
- `docs/ARCHITECTURE.md`
- `docs/DATABASE_OWNERSHIP.md`
- `docs/SAFETY_PROTOCOLS.md`
- `docs/RUNBOOK.md`
- `docs/ESCAPE_HATCHES.md`
