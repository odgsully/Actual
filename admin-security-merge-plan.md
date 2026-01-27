# Admin Security Merge Plan

**Date:** January 22, 2026
**Branch:** `tile-dialed`
**Target:** Merge security fixes from `main`

---

## Problem Summary

The `tile-dialed` branch is missing `requireAdmin()` security checks that were added to `main` in commit `13c0ece` (Jan 21, 2025). This leaves 23 admin API routes unprotected.

### Affected Routes
- `/api/admin/mcao/*` (6 routes)
- `/api/admin/upload/*` (5 routes)
- `/api/admin/contacts/upload/*` (5 routes)
- `/api/admin/reportit/*` (3 routes)
- `/api/admin/calendar/route.ts`
- `/api/admin/monitoring/route.ts`
- `/api/admin/delete-user/route.ts`
- `/api/admin/outreach/route.ts`

---

## Analysis

### Branch Divergence
- **tile-dialed** modified: `apps/gs-site/*` (tiles, banners, marketing)
- **main** modified: `apps/gsrealty-client/*` (CRM, security, calendar)
- **Key insight:** NO OVERLAP - security file `lib/api/admin-auth.ts` is NEW on main

### What Gets Preserved
- All 53 gs-site tiles in `lib/data/tiles.ts`
- LIFX integration, banner persistence
- Marketing components
- Private dashboard & privacy policy

### What Gets Added
- `lib/api/admin-auth.ts` with `requireAdmin()`
- Security checks on 23 admin API routes
- Calendar, contacts, deals pages from CRM work

---

## Pre-Merge (Safety First)

```bash
# 1. Ensure you're on tile-dialed
git checkout tile-dialed

# 2. Verify clean working directory
git status

# 3. Create backup branch
git branch tile-dialed-pre-security-merge

# 4. Fetch latest from remote
git fetch origin
```

---

## Execute the Merge

```bash
git merge main -m "Merge main: add admin API security (requireAdmin) to gsrealty-client

Brings in security commit 13c0ece and related CRM enhancements:
- Add lib/api/admin-auth.ts with requireAdmin() helper
- Add security checks to 23 admin API routes
- Add calendar, contacts, deals, analytics pages
- Keep all gs-site tile work intact"
```

---

## Expected Conflicts & Resolutions

### 1. `.gitignore`
Both branches added entries. Keep both.
```bash
# Edit .gitignore to include both:
# From tile-dialed: .mcp.json
# From main: .env.vercel
git add .gitignore
```

### 2. `apps/gsrealty-client/lib/rate-limit.ts`
Both branches made the same ES5 compatibility fix. Keep tile-dialed version.
```bash
git checkout --ours apps/gsrealty-client/lib/rate-limit.ts
git add apps/gsrealty-client/lib/rate-limit.ts
```

### 3. `package.json`
Accept main's simplified structure, then add back caniuse-lite if needed.
```bash
git checkout --theirs package.json
# Manually verify caniuse-lite is in devDependencies if needed
git add package.json
```

### 4. `package-lock.json`
Regenerate after resolving package.json.
```bash
rm package-lock.json
npm install
git add package-lock.json
```

### 5. Complete the Merge
```bash
git commit
```

---

## Post-Merge Verification

### File Checks
```bash
# Check security file exists
ls -la apps/gsrealty-client/lib/api/admin-auth.ts

# Verify requireAdmin import in routes
grep -l "requireAdmin" apps/gsrealty-client/app/api/admin/mcao/*/route.ts

# Verify gs-site tiles intact
head -20 apps/gs-site/lib/data/tiles.ts
```

### Build Checks
```bash
# TypeScript check
npm run typecheck

# Start dev server
npm run dev
```

### Security Test
```bash
# Test admin endpoint without auth (should return 401)
curl -X POST http://localhost:3003/api/admin/mcao/lookup \
  -H "Content-Type: application/json" \
  -d '{"apn": "123-45-678A"}'

# Expected response:
# {"error":"Unauthorized - Authentication required"}
```

---

## Verification Checklist

- [ ] `apps/gsrealty-client/lib/api/admin-auth.ts` exists
- [ ] All 23 admin routes have `import { requireAdmin } from '@/lib/api/admin-auth'`
- [ ] All gs-site tile files are intact
- [ ] TypeScript compiles without errors
- [ ] Dev server starts successfully
- [ ] Unauthenticated admin requests return 401/403
- [ ] gs-site dashboard and tiles work correctly

---

## Rollback Strategy

### During Merge (if conflicts are too complex)
```bash
git merge --abort
```

### After Merge Commit
```bash
# Reset to backup branch
git reset --hard tile-dialed-pre-security-merge
```

### Alternative: Cherry-pick Security Only
If full merge is too complex, cherry-pick just the security additions:
```bash
git checkout tile-dialed
git checkout -b tile-dialed-with-security
git cherry-pick 13c0ece
```

---

## Push to Remote

After successful merge and verification:
```bash
# Push the merged branch
git push origin tile-dialed

# Optional: Push backup branch for safety
git push origin tile-dialed-pre-security-merge
```

---

## Key Commits Reference

| Commit | Description |
|--------|-------------|
| `13c0ece` | Added `lib/api/admin-auth.ts` with security checks |
| `3a33e4a` | Merged gsrealty-crm into main |
| `e7dbe8b` | Latest gs-site tile work (current HEAD) |
| `cf9dca1` | Settings enhancements added |

---

## Notes

- The merge is low-risk because gs-site and gsrealty-client changes don't overlap
- Always test security endpoints after merge to confirm protection is active
- Keep the backup branch until you've verified everything works in production
