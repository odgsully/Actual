# 📋 Monorepo Migration Progress Tracker

> **Related Document**: See [`MIGRATION_SAFETY_PROTOCOLS.md`](./MIGRATION_SAFETY_PROTOCOLS.md) for ultra-conservative safety procedures, disaster recovery, and backup protocols. Use those protocols for high-risk operations (database changes, production deployments).

---

## 🎯 Overview
Migrating from single Wabbit Real Estate app to a 4-app monorepo architecture under one domain, creating a personal app suite with isolated functionality.

**Target Architecture**: Monorepo with Turborepo, Vercel subdirectory routing, shared Supabase
**Risk Level**: Low (with proper backups) → MEDIUM (critical gaps identified Dec 18, 2025)
**Timeline**: 4 weeks + 1 week for security hardening
**Feasibility**: 8/10 → 9/10 (after addressing blockers)
**Status**: ✅ Phase 0-1 Complete | ✅ Phase 2 95% | ⚠️ BLOCKERS IDENTIFIED (Dec 18, 2025)

### ⚠️ CRITICAL BLOCKERS STATUS (December 18, 2025)

| Issue | Severity | Phase | Status |
|-------|----------|-------|--------|
| React 18 vs 19 version conflict | **CRITICAL** | Phase 2 | ✅ **RESOLVED** |
| 11 tables missing RLS policies | **CRITICAL** | Phase 3 | ⏳ Pending |
| Shared packages created but unused | **HIGH** | Phase 2 | ⏳ Pending |
| No CI/CD automated testing gates | **HIGH** | Phase 2.5 | ⏳ Pending |
| 35-45% code duplication across apps | **MEDIUM** | Phase 5 | ⏳ Pending |

> **Progress**: 1 of 2 CRITICAL blockers resolved. Database RLS hardening remains before Phase 3.

---

## ⚠️ CRITICAL: Claude Code Hooks Compatibility

### ⛔ DO NOT USE `cd` COMMANDS IN MONOREPO
**Issue**: Claude Code hooks use relative paths from `.claude/hooks/`. Changing directories breaks hook execution and can "brick" the Claude instance.

**Solution**: Always operate from project root using npm workspace commands or `--prefix` flags.

### ✅ SAFE COMMAND PATTERNS
```bash
# NEVER DO THIS:
cd apps/wabbit-re && npm run dev  # ❌ Breaks hooks

# ALWAYS DO THIS:
npm run dev:wabbit-re              # ✅ From root, using script
npm --prefix apps/wabbit-re dev    # ✅ From root, using prefix
```

---

## ⚠️ CRITICAL: Manual Environment Setup Required

### 🔴 BLOCKER: Environment Variables Not Loading in Monorepo
**Issue**: Next.js apps in the monorepo cannot access `.env.local` from the root directory.
**Impact**: No database access, authentication broken, API routes fail.

### 📝 MANUAL FIX REQUIRED (Do this before continuing):

#### Option 1: Create Symlink (Recommended)
```bash
# From project root, create a symbolic link:
ln -s ../../.env.local apps/wabbit-re/.env.local

# Verify it worked:
ls -la apps/wabbit-re/.env.local
# Should show: .env.local -> ../../.env.local
```

#### Option 2: Copy Environment File
```bash
# If symlink doesn't work, manually copy:
# 1. Copy your .env.local to the app directory:
cp .env.local apps/wabbit-re/.env.local

# 2. For each new app in Phase 2, repeat:
cp .env.local apps/wabbit/.env.local
cp .env.local apps/crm/.env.local
cp .env.local apps/gs-site/.env.local
```

#### Option 3: Use Root Environment Variables (Future improvement)
```bash
# Add to apps/wabbit-re/package.json scripts:
"dev": "DOTENV_CONFIG_PATH=../../.env.local next dev"
```

### ✅ Verify Environment Variables are Working:
```bash
# 1. Restart the dev server:
pkill -f "next dev"
npm run dev:wabbit-re

# 2. Test an API endpoint:
curl http://localhost:3000/wabbit-re/api/health

# Should return: {"status":"ok"}
# NOT an error about Supabase credentials
```

---

## ✅ PHASE 1 COMPLETE - Ready for Phase 2 (January 15, 2025)

### Current State Summary
✅ **Phase 1 FULLY Completed:**
- Monorepo structure created and operational
- Wabbit RE successfully moved to `apps/wabbit-re/`
- Root `package.json` with workspaces fully configured
- Turborepo installed and `turbo.json` fixed (tasks vs pipeline)
- Vercel configuration ready
- All workspace dependencies installed
- Dev server running successfully on port 3000
- Build pipeline tested and working
- Claude Code hooks issue RESOLVED
- Environment variables WORKING via symlink ✅
- Database connection VERIFIED ✅
- API routes FUNCTIONAL ✅

🎯 **Ready for Phase 2:**
- Fork Wabbit from Wabbit RE
- Migrate CRM if available
- Create GS Site Dashboard
- Set up shared packages

### Priority Tasks (Next 24-48 hours) ✅ COMPLETED

#### 1. Verify Current Setup (2-3 hours) ✅ DONE
```bash
# Run these commands in order FROM PROJECT ROOT:
# Stay in: /Users/garrettsullivan/Desktop/AUTOMATE/Vibe Code/Wabbit/clients/sullivan_realestate/Actual

# 1. Install dependencies and verify workspaces ✅
npm install

# 2. Check if Wabbit RE dependencies are resolved ✅
npm --prefix apps/wabbit-re list --depth=0

# 3. Try running Wabbit RE from root ✅
npm run dev:wabbit-re

# Result: App runs successfully on localhost:3001
```

#### 2. Fix Path Issues (3-4 hours)
**File: `apps/wabbit-re/next.config.js`**
```javascript
// Add basePath for subdirectory routing
module.exports = {
  basePath: '/wabbit-re',
  // ... existing config
}
```

**Update all internal links:**
- Search for `href="/"` → replace with `href="/wabbit-re/"`
- Update API calls from `/api/` → `/wabbit-re/api/`
- Fix image paths: `/assets/` → `/wabbit-re/assets/`

#### 3. Update Vercel Configuration (2 hours)
**File: `vercel.json`**
```json
{
  "buildCommand": "turbo run build",
  "outputDirectory": ".next",
  "rewrites": [
    { "source": "/wabbit-re/:path*", "destination": "/apps/wabbit-re/:path*" }
  ],
  "functions": {
    "apps/wabbit-re/api/cron/hourly-scrape/route.ts": {
      "schedule": "0 * * * *"
    }
  }
}
```

#### 4. Test Build Pipeline (1 hour) ✅ DONE
```bash
# Test build from root (STAY IN ROOT DIRECTORY) ✅
npm run build:wabbit-re

# If successful, test production build locally ✅
npm run start

# Access at http://localhost:3001/wabbit-re
```

#### 5. Configure Root Scripts (30 mins) ✅ DONE
**Root package.json has these scripts configured:**
```json
{
  "scripts": {
    "dev:wabbit-re": "turbo run dev --filter=wabbit-re", ✅
    "build:wabbit-re": "turbo run build --filter=wabbit-re", ✅
    "test:wabbit-re": "turbo run test --filter=wabbit-re", ✅
    "db:migrate": "npm --prefix apps/wabbit-re run db:migrate", ✅
    "db:seed": "npm --prefix apps/wabbit-re run db:seed" ✅
  }
}
```

### Decision Points Needed

1. **Authentication Strategy:**
   - [ ] Decide: Shared users across apps or isolated?
   - [ ] If shared: Need to implement SSO in Phase 3
   - [ ] If isolated: Keep current auth as-is

2. **Domain Strategy:**
   - [ ] Confirm subdirectory approach vs subdomains
   - [ ] Current plan: `domain.com/wabbit-re`, `domain.com/crm`, etc.

3. **Database Isolation:**
   - [ ] Confirm schema strategy (separate schemas vs prefixed tables)
   - [ ] Plan RLS policy updates

### Risk Mitigation
- ✅ Backups created (git tags, branches, zip files)
- ⚠️ Keep monitoring build times (monorepo may increase)
- 📝 Document any path changes for rollback

### Known Issues & Solutions

#### Issue 1: Next.js basePath conflicts
**Problem:** API routes may not work correctly with basePath
**Solution:**
```javascript
// In apps/wabbit-re/next.config.js
module.exports = {
  basePath: '/wabbit-re',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/wabbit-re/api/:path*',
      },
    ];
  },
};
```

#### Issue 2: Environment variables not loading
**Problem:** Turborepo may not pick up .env files correctly
**Solution:**
- Ensure `.env.local` is in the root directory
- Add to `turbo.json` globalDependencies: `["**/.env.*local"]`
- Use `dotenv-cli` if needed: `npm install -D dotenv-cli`

#### Issue 3: Vercel deployment failing
**Problem:** Vercel may not detect monorepo structure
**Solution:**
- Set root directory in Vercel settings to `/`
- Override build command: `npm run build:wabbit-re` or `turbo run build --filter=wabbit-re`
- Set output directory: `apps/wabbit-re/.next`

#### Issue 4: Shared dependencies version conflicts
**Problem:** Different apps may need different versions of same package
**Solution:**
- Use `overrides` in root package.json for critical packages
- Consider using `pnpm` instead of `npm` for better monorepo support

### Testing Checklist Before Moving to Phase 2 ✅ COMPLETE
- [x] `npm install` completes without errors (FROM ROOT)
- [x] `npm run dev:wabbit-re` starts the app (FROM ROOT)
- [x] Can access app at `http://localhost:3000/wabbit-re`
- [x] All API routes work with new paths (health & preferences tested)
- [x] Authentication pages load (signin/signup render correctly)
- [x] Database connections work (confirmed via health API)
- [x] Build completes: `npm run build:wabbit-re` (FROM ROOT)
- [x] Production build runs: `npm run start` (FROM ROOT)
- [x] All commands work WITHOUT using `cd` into subdirectories
- [x] UI renders properly with React/Next.js
- [x] Static assets served (though src paths need updating)

### 🔑 Environment Variables Checklist ✅ COMPLETE
- [x] Create `.env.local` symlink or copy in `apps/wabbit-re/` ✅
- [x] Restart dev server after env setup ✅
- [x] Verify API health check returns `{"status":"healthy"}` ✅
- [x] Test database connection (confirmed "database":"configured") ✅
- [x] Confirm no Supabase errors in console ✅

### 📝 Minor Issues to Address in Phase 2 (Non-Blockers)
- [ ] Update static asset paths from `/assets/` to `/wabbit-re/assets/` in components
- [ ] Fix test suite timeout issue (optional)
- [ ] Address Edge Runtime warnings in build (Supabase compatibility)

---

### 📱 Target Applications
1. **Wabbit RE** (`/wabbit-re`) - Real estate ranking/discovery platform (current codebase)
2. **Wabbit** (`/wabbit`) - General ranking platform with different features (fork of Wabbit RE, non-real estate)
3. **GSRealty Client** (`/gsrealty` or port 3004) - Real estate CRM system (MCAO lookup, ReportIt, client management)
4. **GS Site Dashboard** (`/` or `/dashboard`) - Personal dashboard/launcher with Notion integration for navigating between apps

### 🏗️ Architecture Decisions
- **Routing**: Subdirectory-based (`domain.com/app-name`)
- **Data Strategy**: Full isolation between apps (user sharing TBD)
- **Shared Resources**: Infrastructure, deployment pipeline, UI components library
- **Authentication**: SSO capability but isolated user experiences per app

---

## 📦 Phase 0: Pre-Migration Preparation ✅ COMPLETED
*Duration: 1-2 days*

### Git Safety
- [x] Commit all current work in Wabbit RE
- [x] Push all branches to remote
- [x] Document any local-only configurations
- [x] Note environment variables not in .env files

### Backup Creation
- [x] Create Git tag: `git tag v1.0.0-pre-monorepo`
- [x] Push tag: `git push --tags`
- [x] Create backup branch: `git checkout -b backup/wabbit-re-stable`
- [x] Push backup: `git push origin backup/wabbit-re-stable`
- [x] Create local zip backup: `zip -r wabbit-re-backup-$(date +%Y%m%d).zip /path/to/wabbit-re`
- [x] Store zip in safe location (external drive/cloud)

### Documentation
- [x] Document current folder structure (PRE_MONOREPO_DOCUMENTATION.md created)
- [x] List all active cron jobs and their schedules (Documented: hourly-scrape, daily-cleanup, check-health)
- [x] Document current Vercel configuration (Project: wabbit-property-scraping)
- [x] Note all API endpoints and their purposes (Complete list in PRE_MONOREPO_DOCUMENTATION.md)
- [x] Record current deployment URL (https://wabbit-property-scraping.vercel.app)

### Verification
- [x] Confirm Wabbit RE is working in production
- [x] Test all critical features
- [x] Verify database backups are current
- [x] Check Supabase backup/export

---

## 🏗️ Phase 1: Foundation Setup ✅ COMPLETE
*Duration: 5-7 days*
*Started: January 15, 2025*
*Completed: January 15, 2025* 🎉

### Create Monorepo Structure ✅ COMPLETE
- [x] Create feature branch: `git checkout -b feat/monorepo-migration`
- [x] Create directories:
  ```bash
  mkdir -p apps packages
  mkdir -p packages/supabase packages/ui packages/utils
  ```
- [x] Move Wabbit RE to apps folder:
  ```bash
  mkdir apps/wabbit-re
  # Files have been moved to apps/wabbit-re/
  ```
- [x] Commit structure: `git commit -m "refactor: move wabbit-re to monorepo structure"`

### Setup Workspace Configuration ✅ COMPLETE
- [x] Create root `package.json`:
  - [x] Add workspace configuration
  - [x] Add Turborepo scripts
  - [x] Configure shared dependencies
- [x] Install Turborepo: `npm install -D turbo`
- [x] Create `turbo.json` configuration (fixed: tasks vs pipeline)
- [x] Test workspace: `npm install` ✅
- [x] Verify Wabbit RE still runs: `npm run dev:wabbit-re` ✅

### Update Wabbit RE Paths ⏸️ DEFERRED TO PHASE 3
- [ ] Update import paths in Wabbit RE
- [ ] Update `next.config.js` for subdirectory (needs basePath)
- [ ] Update API route paths
- [ ] Update public asset paths
- [ ] Test locally with new structure

### Vercel Configuration ✅ COMPLETE
- [x] Create new `vercel.json` in root:
  - [x] Add subdirectory rewrites
  - [x] Update cron job paths (in vercel.json)
  - [x] Configure build commands
- [x] Test build: `npm run build:wabbit-re`
- [x] Document new deployment process

### Verification Checkpoint 1 ✅ COMPLETE (January 15, 2025)
- [x] Wabbit RE runs in new location (port 3000 with basePath /wabbit-re)
- [x] All tests configured (timeout issue needs adjustment)
- [x] Build succeeds (with minor Edge Runtime warnings)
- [x] Can navigate to app locally
- [x] No broken imports
- [x] All commands work WITHOUT using `cd` into subdirectories
- [x] UI renders properly (homepage, auth pages)
- [x] API routes functional (health, preferences)
- [x] Database connected and verified
- [x] Environment variables loading correctly

### ✅ Final Phase 0-1 Verification (January 15, 2025)
**All Critical Systems Operational:**
- ✅ Monorepo structure working
- ✅ Environment variables via symlink
- ✅ Database connectivity confirmed
- ✅ API routing with basePath
- ✅ UI rendering without errors
- ✅ Authentication pages accessible
- ✅ No Claude Code hooks issues
- ✅ Build and dev processes functional

### ⚠️ Key Learnings for Phase 2
1. **NEVER use `cd` commands** - Always operate from project root
2. **Use npm scripts or --prefix flags** for subdirectory operations
3. **Turbo.json needs "tasks" not "pipeline"** (Turborepo v2 change)
4. **Workspace dependencies install correctly** with standard `npm install`
5. **Dev server works** on port 3000 (or 3001 if occupied)
6. **Create env symlinks** for each new app: `ln -s ../../.env.local apps/[app-name]/.env.local`
7. **Static assets** need path updates in components (fix during fork)

---

## 🚀 Phase 2: App Expansion ✅ SUBSTANTIALLY COMPLETE (Jan 16, 2025)
*Duration: 5-7 days* - Completed in 1 day

### Fork Wabbit from Wabbit RE
- [x] Copy Wabbit RE (FROM ROOT): `cp -r apps/wabbit-re apps/wabbit` ✅
- [x] Update `apps/wabbit/package.json`: ✅
  - [x] Change name to `wabbit` (not @your-domain/wabbit to match filter)
  - [x] Update description to reflect non-real estate ranking
- [x] Remove real estate specific features: ✅
  - [x] Property scraping integrations
  - [x] MLS data connections
  - [x] Real estate specific UI elements
- [x] Modify for general ranking use case: ✅
  - [x] Update ranking categories/metrics
  - [x] Adjust UI components for new domain (tagline, panel colors)
  - [ ] Remove property-specific database calls
- [x] Update environment variables ✅
- [x] Test Wabbit app (FROM ROOT): `npm run dev:wabbit` ✅
- [ ] Commit: `git commit -m "feat: create wabbit app from wabbit-re fork"`

### GSRealty Client (CRM) - Already in Monorepo ✅
- [x] GSRealty Client exists at `apps/gsrealty-client/` ✅
- [x] Running on port 3004 ✅
- [x] Has own package.json with name `gsrealty-client` ✅
- [x] Complete independence from ranking apps:
  - [x] Separate database tables (clients, files, mcao_cache, invitations)
  - [x] Independent API routes (/api/admin/*, /api/events/*)
  - [x] No shared data models with wabbit apps
- [x] Environment variables configured ✅
- [x] Test: `npm run dev:gsrealty` ✅
- **Note**: Replaces originally planned "Cursor MY MAP" - that migration is no longer needed

### Create GS Site Dashboard
- [x] Create Next.js app (FROM ROOT): `npx create-next-app@latest apps/gs-site --typescript --tailwind` ✅
- [x] Configure as personal hub: ✅
  - [x] Create app launcher UI with cards for each app
  - [x] Add navigation to: Wabbit RE, Wabbit, CRM
  - [ ] Integrate Notion API for 2nd brain content (IN PROGRESS)
  - [x] Design personal branding/landing page
  - [ ] Add authentication check (optional per app)
- [x] Setup Notion integration: ✅ COMPLETE (Jan 16, 2025)
  - [x] Configure Notion API credentials (API key: ntn_5557552860130...)
  - [x] Create data fetching utilities (/lib/notion.ts)
  - [x] Build UI components for Notion content (NotionWidget component)
- [x] Test: `npm run dev:dashboard` ✅
- [ ] Commit: `git commit -m "feat: initialize gs-site personal dashboard"`

### Setup Shared Packages
- [x] Create `packages/supabase`: ✅ COMPLETE
  - [x] Create package.json
  - [x] Move shared Supabase client (client.ts, server.ts)
  - [x] Add type definitions (types.ts)
  - [x] Export utilities (index.ts)
- [x] Create `packages/ui`: ✅
  - [x] Create package.json
  - [ ] Move shared components
  - [ ] Setup component library
- [x] Create `packages/utils`: ✅
  - [x] Create package.json
  - [ ] Move shared utilities
  - [ ] Add common helpers
- [ ] Update app imports to use packages
- [ ] Test all apps still work

### Verification Checkpoint 2
- [x] All apps run independently ✅ (3 apps + CRM landing page)
- [x] Shared packages created ✅ (supabase, ui, utils)
- [x] No circular dependencies ✅
- [x] Build succeeds for all apps ✅
- [x] Can navigate between apps locally ✅

### ✅ Version Alignment (COMPLETED - December 18, 2025)
*Added: December 18, 2025 | Completed: December 18, 2025*

**Decision: Standardized on React 18** (safer, less work, better ecosystem compatibility)

**Final Aligned Versions:**
```
App              Next.js    React     Tailwind   Status
─────────────────────────────────────────────────────────
wabbit-re        14.2.35    18.3.1    3.4.1      ✅ Aligned
wabbit           14.2.35    18.3.1    3.4.1      ✅ Aligned
gs-site          14.2.35    18.3.1    3.4.1      ✅ Downgraded
gsrealty-client  14.2.35    18.3.1    3.4.1      ✅ Downgraded
```

**Changes Made:**
- [x] **DECISION**: Standardize on React 18 ✅
  - [x] Option A: Downgrade gs-site/gsrealty to React 18 ✅
- [x] Standardized Next.js to 14.2.35 (patched security version)
- [x] Aligned Tailwind to 3.4.1 across all apps
- [x] All 4 apps build successfully ✅
- [ ] Commit: `git commit -m "fix: align React/Next.js versions across all apps"`

**Additional fixes for gs-site:**
- Replaced Geist font (Next.js 15+) with Inter
- Updated Tailwind 4 → Tailwind 3 config format
- Fixed ESLint 9 flat config → ESLint 8 .eslintrc.json
- Fixed Notion API type errors

### 🔗 Shared Package Integration (INCOMPLETE - HIGH PRIORITY)
*Added: December 18, 2025*

**Current State:** Packages exist but are completely orphaned - NO app imports from them.

```
packages/supabase/  → Created, NOT imported by any app
packages/ui/        → Created, NO components defined
packages/utils/     → Created, only exports safety.ts
```

**Each app has duplicate implementations:**
- `apps/*/lib/supabase/client.ts` (4 copies)
- `apps/*/lib/supabase/server.ts` (4 copies)
- `apps/*/contexts/AuthContext.tsx` (3 copies with hardcoded demo account)

**Tasks:**
- [ ] Move Supabase client to packages/supabase:
  - [ ] Export createBrowserClient, createServerClient
  - [ ] Update all apps to import from `@gs-site/supabase`
  - [ ] Delete duplicate `lib/supabase/` in each app
- [ ] Create packages/auth:
  - [ ] Move AuthContext to shared package
  - [ ] Remove hardcoded demo account (use env var: `DEMO_USER_EMAIL`)
  - [ ] Implement shared useAuth hook
- [ ] Update tsconfig.json in each app:
  - [ ] Add path alias: `"@gs-site/*": ["../../packages/*"]`
- [ ] Verify turbo.json has package dependencies defined
- [ ] Test all apps after migration to shared packages

---

## 🔧 Phase 2.5: CI/CD Foundation (NEW)
*Duration: 2-3 days*
*Added: December 18, 2025*

> **Why this phase?** Currently NO automated testing gates exist. Broken code can reach production. This phase adds critical safety infrastructure.

### Automated Testing Gate
- [ ] Create `.github/workflows/test.yml`:
  ```yaml
  name: Test
  on: [pull_request, push]
  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
        - run: npm ci
        - run: npm run lint
        - run: npm run typecheck
        - run: npm run test
        - run: npm run build
  ```
- [ ] Add branch protection to main:
  - [ ] Require status checks to pass before merge
  - [ ] Require PR review before merge
- [ ] Test workflow on a feature branch

### Pre-commit Hooks
- [ ] Install husky: `npm install -D husky lint-staged`
- [ ] Initialize husky: `npx husky init`
- [ ] Create `.husky/pre-commit`:
  ```bash
  #!/bin/sh
  npx lint-staged
  ```
- [ ] Add to package.json:
  ```json
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
  ```
- [ ] Create `.husky/pre-push`:
  ```bash
  #!/bin/sh
  npm run test
  ```
- [ ] Test hooks locally

### Deployment Automation (Vercel)
- [ ] Create `.github/workflows/deploy-staging.yml`:
  - [ ] Deploy to Vercel preview on push to main
  - [ ] Run smoke tests against staging URL
  - [ ] Post staging URL to PR comments
- [ ] Create `.github/workflows/deploy-production.yml`:
  - [ ] Manual trigger only (workflow_dispatch)
  - [ ] Require all tests passing
  - [ ] Deploy to production
  - [ ] Run post-deploy health checks
  - [ ] Alert on failure (Slack/Discord webhook)

### Verification Checkpoint 2.5
- [ ] All PRs require passing tests before merge
- [ ] Pre-commit hooks prevent bad commits
- [ ] Staging deploys automatically on push to main
- [ ] Production deploys require manual approval
- [ ] Team notified on deploy success/failure

---

## 🔗 Phase 3: Integration
*Duration: 5-7 days*

### 🚨 Database Security Hardening (NEW - CRITICAL)
*Added: December 18, 2025*

> **CRITICAL:** 11 tables are missing RLS policies. Any authenticated user can read ALL data from these tables.

**Tables Exposed to ALL Authenticated Users:**

| Table | App Owner | Data at Risk |
|-------|-----------|--------------|
| `properties` | wabbit-re | All property listings |
| `property_images` | wabbit-re | All property photos |
| `property_locations` | wabbit-re | Location intelligence data |
| `activity_log` | shared | Complete audit trail |
| `gsrealty_clients` | gsrealty | Client contact information |
| `gsrealty_properties` | gsrealty | Client property records |
| `gsrealty_users` | gsrealty | User credentials/roles |
| `gsrealty_login_activity` | gsrealty | Login audit records |
| `gsrealty_admin_settings` | gsrealty | Application configuration |
| `third_party_connections` | wabbit-re | External API credentials |
| `user_profiles` (INSERT) | shared | Missing INSERT policy |

**Required RLS Policies:**
- [ ] Add RLS to `properties` table:
  ```sql
  ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Public read access" ON properties FOR SELECT USING (true);
  ```
- [ ] Add RLS to `gsrealty_clients` (role-based):
  ```sql
  ALTER TABLE gsrealty_clients ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Admin full access" ON gsrealty_clients FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin');
  CREATE POLICY "Client own data" ON gsrealty_clients FOR SELECT
    USING (user_id = auth.uid());
  ```
- [ ] Add RLS to `gsrealty_users` (admin-only write, self-read)
- [ ] Add RLS to `gsrealty_properties` (role-based like clients)
- [ ] Add RLS to `gsrealty_login_activity` (admin-only read)
- [ ] Add RLS to `gsrealty_admin_settings` (admin-only)
- [ ] Add RLS to `activity_log` (admin-only read)
- [ ] Add INSERT policy to `user_profiles`
- [ ] Hash invitation tokens (currently plaintext in database)
- [ ] Add `app_context` column to audit tables for cross-app tracking
- [ ] Test RLS policies from each app's context
- [ ] Document RLS policies in `docs/DATABASE_OWNERSHIP.md`

### 🔧 basePath Standardization (NEW - MEDIUM PRIORITY)
*Added: December 18, 2025*

**Current Inconsistency:**

| App | basePath Config | Behavior | Issue |
|-----|-----------------|----------|-------|
| wabbit-re | Conditional on NODE_ENV | Dev: `/`, Prod: `/wabbit-re` | ✅ Correct |
| wabbit | Always `/wabbit` | Always uses basePath | ❌ Inconsistent |
| gs-site | None | Always at root | ⚠️ May conflict |
| gsrealty-client | Commented out, env var unused | Deployed at root | ❌ Broken config |

**Tasks:**
- [ ] **DECISION**: Subdirectory routing or separate deployments?
  - [ ] Option A: All apps behind reverse proxy with basePath
  - [ ] Option B: Separate Vercel deployments per app (different URLs)
- [ ] If Option A (subdirectory):
  - [ ] Standardize all apps to use conditional basePath:
    ```javascript
    // next.config.js pattern for ALL apps
    const basePath = process.env.NODE_ENV === 'production' ? '/app-name' : '';
    module.exports = { basePath, assetPrefix: basePath };
    ```
  - [ ] Fix gsrealty-client to use `NEXT_PUBLIC_BASE_PATH` env var
  - [ ] Configure Nginx reverse proxy (see `deployment/nginx.conf`)
  - [ ] Test all apps at their subdirectory paths
- [ ] If Option B (separate deployments):
  - [ ] Remove basePath from all apps
  - [ ] Create separate `vercel.json` per app
  - [ ] Configure separate domains/subdomains
- [ ] Update all hardcoded URLs to use relative paths or env vars
- [ ] Test navigation between apps in production-like environment

### Database Updates
- [ ] Design isolated schema strategy:
  - [ ] Wabbit RE tables: `properties`, `user_properties`, `rankings`
  - [ ] Wabbit tables: `items`, `user_items`, `rankings_general`
  - [ ] GSRealty Client tables: `clients`, `files`, `mcao_cache`, `invitations`, `events`
  - [ ] Shared tables (if any): `users` (TBD on sharing)
- [ ] Add `app_source` column to any shared tables:
  ```sql
  ALTER TABLE users ADD COLUMN app_source VARCHAR(20);
  ALTER TABLE users ADD COLUMN last_app_accessed VARCHAR(20);
  ```
- [ ] Create app-specific schemas:
  ```sql
  CREATE SCHEMA IF NOT EXISTS wabbit_re;
  CREATE SCHEMA IF NOT EXISTS wabbit;
  CREATE SCHEMA IF NOT EXISTS gsrealty;
  ```
- [ ] Update RLS policies for complete app isolation
- [ ] Test database access from each app
- [ ] Verify data isolation works
- [x] Document which tables belong to which app - **See `docs/DATABASE_OWNERSHIP.md`** ✅

### Implement SSO (Optional - TBD)
- [ ] Decide on user strategy:
  - [ ] Option A: Completely separate users per app
  - [ ] Option B: Shared users with app-specific profiles
  - [ ] Option C: Single sign-on with app permissions
- [ ] If implementing SSO:
  - [ ] Configure shared authentication in `packages/supabase`
  - [ ] Update auth flows in all apps
  - [ ] Test login/logout across apps
  - [ ] Implement session sharing
  - [ ] Add auth guards where needed
- [ ] If keeping separate:
  - [ ] Ensure auth isolation between apps
  - [ ] Separate user tables or app-specific user records
  - [ ] Independent session management

### Configure Routing
- [ ] Update Vercel rewrites for subdirectory routing:
  - [ ] `/wabbit-re/*` → Wabbit RE app
  - [ ] `/wabbit/*` → Wabbit app
  - [ ] `/gsrealty/*` → GSRealty Client (or keep on port 3004)
  - [ ] `/` or `/dashboard` → GS Site Dashboard
- [ ] Configure Next.js `basePath` for each app:
  - [ ] `wabbit-re`: basePath = '/wabbit-re'
  - [ ] `wabbit`: basePath = '/wabbit'
  - [ ] `gsrealty-client`: basePath = '/gsrealty' (or separate deployment)
  - [ ] `gs-site`: basePath = '/' or '/dashboard'
- [ ] Test subdirectory routing locally
- [ ] Update all internal links to respect basePath
- [ ] Verify API routes work with new paths

### Environment Variables
- [ ] Create `.env.example` for each app
- [ ] Document all required variables
- [ ] Setup shared variables in root
- [ ] Configure app-specific variables
- [ ] Test with production-like values

### Update Cron Jobs
- [ ] Update cron job paths in `vercel.json`
- [ ] Test cron endpoints with new paths
- [ ] Verify cron authentication
- [ ] Document new cron structure

### Verification Checkpoint 3
- [ ] Authentication strategy implemented (SSO or isolated)
- [ ] Routing works correctly with subdirectories
- [ ] Database isolation confirmed between apps
- [ ] Each app has its own data space
- [ ] Cron jobs accessible (Wabbit RE specific)
- [ ] Environment variables loaded per app

---

## 🚢 Phase 4: Deployment
*Duration: 3-5 days*

### 🛡️ Deployment Hardening (NEW)
*Added: December 18, 2025*

> **Current Gaps:** No staging environment, weak verification (only health check), no automated rollback, no monitoring.

### Create Staging Environment (NEW - HIGH PRIORITY)
- [ ] Set up staging.wabbit-rank.ai or Vercel preview environment
- [ ] Configure staging with same env vars as production
- [ ] Create staging deployment workflow:
  - [ ] Auto-deploy to staging on push to main
  - [ ] Run smoke tests against staging
  - [ ] Manual approval gate for production promotion
- [ ] Add staging URL to allowed domains in Google Cloud Console

### Enhanced Verification (NEW)
- [ ] Create `scripts/verify-deployment.sh`:
  ```bash
  #!/bin/bash
  # Health check
  curl -f $APP_URL/api/health || exit 1
  # API route verification
  curl -f $APP_URL/api/preferences || exit 1
  curl -f $APP_URL/api/setup/validate || exit 1
  # Database connectivity
  npm run test:smoke || exit 1
  # Check for errors in logs
  vercel logs --since 2m | grep -i error && exit 1
  echo "All checks passed!"
  ```
- [ ] Add to deployment pipeline: run verification after each deploy
- [ ] Fail deployment if any verification fails
- [ ] Alert team on verification failure

### Automated Rollback (NEW)
- [ ] Store previous deployment URL before promoting
- [ ] Create rollback trigger:
  - [ ] If health check fails 3x in 5 minutes → auto-rollback
  - [ ] Alert on Slack/Discord when rollback triggered
- [ ] For Hetzner/PM2 deployments:
  - [ ] Store last 3 deployments in cloud storage (S3/Cloudflare R2)
  - [ ] Create `scripts/rollback.sh` with verification
- [ ] Test rollback procedure monthly
- [ ] Document rollback steps in `docs/RUNBOOK.md`

### Pre-Deployment Testing
- [ ] Full build test: `npm run build`
- [ ] Run all test suites
- [ ] Test production build locally
- [ ] Verify all features work
- [ ] Check for console errors
- [ ] **NEW:** Validate environment variables exist
- [ ] **NEW:** Run database schema compatibility check

### Vercel Deployment Setup
- [ ] Create new Vercel project (or update existing)
- [ ] Configure environment variables in Vercel
- [ ] Set up build commands
- [ ] Configure domains/subdomains
- [ ] Test preview deployment
- [ ] **NEW:** Configure deployment protection (require team member approval)

### Deploy to Staging
- [ ] Push to staging branch
- [ ] Deploy to Vercel preview
- [ ] Test all apps on staging URL
- [ ] Verify subdirectory routing
- [ ] Test cross-app navigation
- [ ] **NEW:** Run full E2E test suite against staging
- [ ] **NEW:** Performance baseline comparison

### Production Deployment
- [ ] Final backup of current production
- [ ] Merge to main branch
- [ ] Monitor deployment
- [ ] Test production URLs immediately
- [ ] Monitor error logs
- [ ] **NEW:** Wait 5 minutes, then run enhanced verification
- [ ] **NEW:** Monitor error rate for first 30 minutes

### Post-Deployment
- [ ] Verify all apps accessible
- [ ] Test critical user flows
- [ ] Check cron job execution
- [ ] Monitor performance metrics
- [ ] Document any issues
- [ ] **NEW:** Send deployment notification to team
- [ ] **NEW:** Update deployment log with timestamp and commit hash

### Verification Checkpoint 4
- [ ] All apps live and accessible
- [ ] No errors in production logs
- [ ] Performance acceptable
- [ ] Users can navigate between apps
- [ ] Data flowing correctly
- [ ] **NEW:** Automated rollback tested and working
- [ ] **NEW:** Monitoring alerts configured

---

## 🛟 Phase 5: Stabilization
*Duration: 2-3 days*

### 🔄 Code Consolidation (NEW - MEDIUM PRIORITY)
*Added: December 18, 2025*

> **Current State:** 35-45% code duplication across apps. Same logic implemented 3-4 times.

**Duplicated Code Identified:**

| Category | Files Duplicated | Location |
|----------|------------------|----------|
| Auth Context | 3 copies | `apps/*/contexts/AuthContext.tsx` |
| Supabase Client | 4 copies | `apps/*/lib/supabase/client.ts` |
| Supabase Server | 4 copies | `apps/*/lib/supabase/server.ts` |
| Database Queries | 3 copies | `apps/*/lib/database/*.ts` |
| UI Components | 3 copies | Button, Card, Modal patterns |
| Form Validation | 3 copies | Similar Zod schemas |

**Consolidation Tasks:**
- [ ] Extract to `packages/auth`:
  - [ ] Move AuthContext from apps
  - [ ] Create shared useAuth hook
  - [ ] Move SignInModal component
  - [ ] Remove hardcoded demo account (use `DEMO_USER_EMAIL` env var)
  - [ ] Update all apps to import from `@gs-site/auth`

- [ ] Extract to `packages/database`:
  - [ ] Move user profile queries
  - [ ] Move preference management
  - [ ] Create common query patterns (CRUD helpers)
  - [ ] Update all apps to use shared database layer

- [ ] Extract to `packages/ui`:
  - [ ] Move Button, Card, Modal components
  - [ ] Move theme provider
  - [ ] Create Radix UI wrapper components
  - [ ] Export from single entry point

- [ ] Measure duplication:
  - [ ] Run `npx jscpd .` to measure before/after
  - [ ] Target: < 15% duplication (down from 35-45%)

- [ ] Update imports across all apps
- [ ] Test all apps after consolidation
- [ ] Commit: `git commit -m "refactor: consolidate shared code into packages"`

### Monitoring
- [ ] Set up error tracking (Sentry/similar)
- [ ] Configure uptime monitoring (UptimeRobot/Checkly)
- [ ] Set up alerts for failures (Slack/Discord webhooks)
- [ ] Monitor database performance (Supabase dashboard)
- [ ] Track user analytics
- [ ] **NEW:** Set up deployment notifications
- [ ] **NEW:** Configure performance monitoring (Web Vitals)

### Documentation
- [ ] Update all README files
- [ ] Document deployment process
- [ ] Create troubleshooting guide
- [x] Document architecture decisions - **See `docs/ARCHITECTURE.md`** ✅
- [ ] Update API documentation
- [x] Safety protocols documented - **See `docs/SAFETY_PROTOCOLS.md`** ✅
- [x] Emergency runbook created - **See `docs/RUNBOOK.md`** ✅

### Cleanup
- [ ] Remove old deployment configurations
- [ ] Clean up unused branches
- [ ] Archive old backups (keep some)
- [ ] Update CI/CD pipelines
- [ ] Remove temporary files

### Team Handoff
- [ ] Create architecture diagram
- [ ] Document common tasks
- [ ] Record video walkthrough
- [ ] Share access credentials
- [ ] Schedule knowledge transfer

---

## ✅ Final Checklist

### Success Criteria
- [ ] All 4 apps accessible via subdirectories/ports:
  - [ ] `/wabbit-re` - Real estate ranking platform
  - [ ] `/wabbit` - General ranking platform
  - [ ] `/gsrealty` (or port 3004) - GSRealty Client CRM
  - [ ] `/` or `/dashboard` - Personal dashboard hub
- [ ] Authentication working (SSO or isolated per decision)
- [ ] Database properly isolated between apps
- [ ] GS Site Dashboard successfully integrates Notion content
- [ ] Performance acceptable
- [ ] No data loss
- [ ] Backups available
- [ ] Documentation complete

### Rollback Plan Ready
- [ ] Backup branches accessible
- [ ] Old deployment still available
- [ ] Database backup restorable
- [ ] Rollback steps documented
- [ ] Team knows rollback process

---

## 🚨 Emergency Contacts & Resources

### Quick Commands
```bash
# IMPORTANT: ALL COMMANDS RUN FROM PROJECT ROOT - NO cd COMMANDS!

# Rollback to backup
git checkout backup/wabbit-re-stable

# Check app status (FROM ROOT)
npm run dev:wabbit-re      # Runs on port 3000 or 3001
npm run dev:wabbit         # When created
npm run dev:crm            # When created
npm run dev:dashboard      # When created

# Build specific apps (FROM ROOT)
npm run build:wabbit-re
npm run build              # Build all apps

# Database commands (FROM ROOT)
npm run db:migrate
npm run db:seed
npm run db:seed-demo

# Deploy to Vercel
vercel --prod

# Access apps locally (basePath configured)
# http://localhost:3001/wabbit-re  (if port 3000 in use)
# http://localhost:3000/wabbit-re  (default)
# Future apps will have their own basePaths
```

### Troubleshooting
1. **App won't start**: Check environment variables
2. **Routing broken**: Verify vercel.json rewrites
3. **Auth issues**: Check Supabase URL/keys
4. **Build fails**: Check turbo.json pipeline
5. **Database errors**: Verify RLS policies

### Documentation Links
- [Turborepo Docs](https://turbo.build/repo/docs)
- [Vercel Monorepo Guide](https://vercel.com/docs/monorepos)
- [Next.js Multi-Zones](https://nextjs.org/docs/advanced-features/multi-zones)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)

---

**Remember**: Take it slow, verify each step, and maintain backups throughout the process. The goal is zero downtime and zero data loss.

**App Suite Summary**:
- **Wabbit RE**: Real estate-specific ranking and property discovery
- **Wabbit**: General-purpose ranking platform (non-real estate)
- **GSRealty Client**: Real estate CRM (MCAO lookup, ReportIt, client management) - *replaces originally planned "Cursor MY MAP"*
- **GS Site Dashboard**: Personal hub with Notion integration

**Last Updated**: December 18, 2025
**Checklist Version**: 2.0.0 (Major update with security hardening)
**Risk Assessment**: MEDIUM → LOW (after addressing critical blockers)

---

## 📊 Migration Progress Summary (December 18, 2025)

### Overall Progress: 50% Functional / 65% Structural 🔧

> **Note:** Version alignment resolved (Dec 18). Remaining: database security, shared packages, CI/CD.

**Phase Completion:**
- ✅ Phase 0: Pre-Migration Preparation - **100% Complete**
- ✅ Phase 1: Foundation Setup - **100% Complete** ✨
- ⚠️ Phase 2: App Expansion - **85% Complete** (1 blocker resolved)
  - ✅ Version alignment complete (React 18.3.1)
  - ❌ Shared packages unused
- 🆕 Phase 2.5: CI/CD Foundation - **0% (NEW - Not Started)**
- 🚀 Phase 3: Integration - **BLOCKED** (requires Phase 2 completion)
- ⏳ Phase 4: Deployment - **0% (Not Started)**
- ⏳ Phase 5: Stabilization - **0% (Not Started)**

**Current Status:**
- ✅ Monorepo structure fully operational
- ✅ **4 Apps Running:**
  - Wabbit RE: Real estate platform (port 3000, path /wabbit-re)
  - Wabbit: General ranking platform (port 3002, path /wabbit)
  - GS Dashboard: Personal hub with Notion (port 3003, root path)
  - GSRealty Client: Real estate CRM (port 3004)
- ✅ **Notion Integration:** Connected with API key
- ⚠️ **Shared Packages:** Created but NOT used by any app
- ✅ **GSRealty Client:** Full CRM at apps/gsrealty-client/ (port 3004)
- ✅ All apps have database connectivity
- ✅ Build process completes successfully
- ✅ No circular dependencies

**Critical Blockers Status (Dec 18, 2025):** 🔧
| Issue | Severity | Status |
|-------|----------|--------|
| React 18 vs 19 conflict | CRITICAL | ✅ **RESOLVED** - All apps on React 18.3.1 |
| 11 tables missing RLS | CRITICAL | ⏳ Pending |
| Shared packages orphaned | HIGH | ⏳ Pending |
| No CI/CD pipeline | HIGH | ⏳ Pending |

**Priority Action Items:**

**This Week (BLOCKING):**
1. [x] Version alignment decision - React 18 ✅
2. [ ] Add RLS to critical tables (gsrealty_clients, gsrealty_users)
3. [ ] Create basic CI workflow (lint + typecheck + test)

**Next Week (HIGH):**
4. [ ] Integrate shared packages - Start with packages/supabase
5. [ ] Fix basePath inconsistency across apps
6. [ ] Add pre-commit hooks (husky + lint-staged)

**This Month (MEDIUM):**
7. [ ] Create staging environment
8. [ ] Enhanced deployment verification
9. [ ] Set up Sentry monitoring

**Next Milestone:**
Complete Phase 2 blockers (version alignment, shared packages) before proceeding to Phase 2.5 (CI/CD)

**Estimated Time to Production-Ready:** 3-4 weeks (including new Phase 2.5)