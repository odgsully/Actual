# Conservative Merge Analysis: `gssite-dec27-ii` → `main`

**Date:** January 1, 2026
**Branch:** `gssite-dec27-ii`
**Target:** `main`

---

## Branch Statistics

| Metric | Value |
|--------|-------|
| Commits | 13 |
| Files Changed | 114 |
| Insertions | +13,214 |
| Deletions | -7,463 |
| New Files | 69 |
| Modified Files | 33 |
| Deleted Files | 1 |

---

## Risk Matrix

### 🔴 HIGH RISK — Must Address Before Merge

| Issue | Location | Impact | Action Required |
|-------|----------|--------|-----------------|
| **package-lock.json DELETED** | `apps/gs-site/` | npm install will regenerate from scratch; deps may resolve differently | Run `npm install` immediately after merge to regenerate |
| **useDualFilter replaces useTileFilter** | `hooks/useDualFilter.ts` | New filtering logic in `page.tsx` | Test all filter scenarios match old behavior |
| **Major page.tsx refactor** | `app/page.tsx` (+137 lines) | DraggableGrid, edit mode, keyboard shortcuts | Full UI regression test needed |

### 🟡 MEDIUM RISK — Verify Before Production

| Issue | Location | Impact | Action Required |
|-------|----------|--------|-----------------|
| **10 new API endpoints** | `app/api/*/` | All must exist & respond correctly | Test each endpoint manually |
| **GitHub health endpoint changed** | `lib/integrations/types.ts` | `?limit=1` → `?username=odgsully` | Verify endpoint works with new query |
| **next-themes version jump** | `package.json` | 0.2.1 → 0.4.4 (2 minor versions) | Test dark/light mode switching |
| **TileRegistry.tsx** | `components/tiles/` | 10+ new tiles added | Verify Notion database has matching entries |
| **Database migrations needed** | (not in branch) | 3 new tables required | Must run before features work |

### 🟢 LOW RISK — Safe to Merge

| Category | Notes |
|----------|-------|
| **LIFX integration** | Fully isolated, no existing code modified |
| **Word of Month tile** | Fully isolated, single table dependency |
| **New hooks** (6 total) | All additive, no replacements except useDualFilter |
| **New API routes** | All new namespaces, no conflicts |
| **Cross-app APM setup** | Consistent pattern across wabbit-re, gsrealty-client, wabbit |
| **Documentation/assets** | Non-functional additions |

---

## Untracked Files (New Features)

All new untracked files are **completely isolated**:

| Feature | Files | External Deps | DB Tables Needed |
|---------|-------|---------------|------------------|
| **LIFX Smart Lights** | 9 files | LIFX API | `lifx_schedule_state`, `lifx_schedule_config` |
| **Word of Month** | 2 files | None | `word_of_month` |
| **Cron Jobs** | 3 routes + vercel.json | None | None |

### Environment Variables Required

```bash
LIFX_API_TOKEN=<from cloud.lifx.com>
CRON_SECRET=<any secure string>
```

---

## New API Endpoints to Verify

These endpoints must exist and return valid responses:

1. `/api/google/health`
2. `/api/inbody/health`
3. `/api/inbody/history`
4. `/api/inbody/latest`
5. `/api/inbody/manual`
6. `/api/whoop/health`
7. `/api/claude-code/stats`
8. `/api/twitter/stats`
9. `/api/youtube/stats`
10. `/api/directory-health`

---

## Pre-Merge Checklist

### Critical (Block Merge)

- [ ] Verify all 10 new API endpoints return valid responses
- [ ] Test `useDualFilter` provides same filtering as old system
- [ ] Confirm database migrations ready for 3 new tables
- [ ] Add missing env vars to `.env.sample`

### Important (Before Production)

- [ ] Run `npm install` to regenerate lock file
- [ ] `npm run build` passes
- [ ] `npm run typecheck` passes
- [ ] Test draggable grid edit mode + Escape key
- [ ] Test theme switching (next-themes upgrade)
- [ ] Verify TileRegistry tile name matching works

### Nice to Have

- [ ] Run `npm run sync-tiles` to verify Notion sync
- [ ] Document LIFX setup process

---

## Recommended Merge Strategy

### Conservative 3-Step Approach

```bash
# 1. Create test branch from main
git checkout main
git pull origin main
git checkout -b test-merge-gssite-dec27-ii

# 2. Merge with no-ff (preserves history)
git merge --no-ff gssite-dec27-ii

# 3. Regenerate lock file and verify
npm install
npm run build
npm run typecheck
```

If build/typecheck pass:

```bash
git checkout main
git merge --no-ff test-merge-gssite-dec27-ii
```

---

## Database Migrations Needed

### LIFX Tables

```sql
-- Table 1: Daily schedule state tracking
CREATE TABLE IF NOT EXISTS lifx_schedule_state (
  date TEXT PRIMARY KEY,
  morning_sunrise_started BOOLEAN DEFAULT FALSE,
  morning_form_submitted BOOLEAN DEFAULT FALSE,
  evening_form_submitted BOOLEAN DEFAULT FALSE,
  controller_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table 2: User schedule configuration
CREATE TABLE IF NOT EXISTS lifx_schedule_config (
  id SERIAL PRIMARY KEY,
  morning_start_hour INT DEFAULT 6,
  morning_end_hour INT DEFAULT 9,
  evening_lock_hour INT DEFAULT 20,
  evening_lock_minute INT DEFAULT 30,
  lock_color TEXT DEFAULT 'purple',
  selector TEXT DEFAULT 'all',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Word of Month Table

```sql
CREATE TABLE IF NOT EXISTS word_of_the_month (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  month_year TEXT NOT NULL,
  category TEXT NOT NULL,
  word TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(month_year, category)
);
```

---

## Summary

| Assessment | Details |
|------------|---------|
| **Overall Risk** | 🟡 **MODERATE** — Significant feature additions with one architectural refactor |
| **Breaking Changes** | None identified — all changes are additive |
| **Biggest Concern** | `useDualFilter` replacing old filter logic in page.tsx |
| **Safest Path** | Merge in test branch first, run full build + manual UI test |
| **Merge Readiness** | ✅ Safe after pre-merge checklist items |

The new LIFX and Word of Month features are well-isolated and pose minimal risk. The main concern is the `page.tsx` refactor with the new draggable grid system — this should be tested thoroughly before production deployment.

---

## Post-Merge Verification

After merging to main, verify:

1. [ ] `npm run dev` starts without errors
2. [ ] Dashboard loads with all tiles visible
3. [ ] Draggable grid edit mode works (click Edit button)
4. [ ] Escape key exits edit mode
5. [ ] Filter dropdowns work correctly
6. [ ] Theme toggle (dark/light) works
7. [ ] No console errors in browser DevTools
