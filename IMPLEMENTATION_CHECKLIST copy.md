# 📋 Monorepo Migration Implementation Checklist

## 🎯 Overview
Migrating from single Wabbit Real Estate app to a 4-app monorepo architecture under one domain, creating a personal app suite with isolated functionality.

**Target Architecture**: Monorepo with Turborepo, Vercel subdirectory routing, shared Supabase
**Risk Level**: Low (with proper backups)
**Timeline**: 4 weeks
**Feasibility**: 8/10

### 📱 Target Applications
1. **Wabbit RE** (`/wabbit-re`) - Real estate ranking/discovery platform (current codebase)
2. **Wabbit** (`/wabbit`) - General ranking platform with different features (fork of Wabbit RE, non-real estate)
3. **Cursor MY MAP** (`/crm`) - Standalone CRM system (completely independent from ranking apps)
4. **GS Site Dashboard** (`/` or `/dashboard`) - Personal dashboard/launcher with Notion integration for navigating between apps

### 🏗️ Architecture Decisions
- **Routing**: Subdirectory-based (`domain.com/app-name`)
- **Data Strategy**: Full isolation between apps (user sharing TBD)
- **Shared Resources**: Infrastructure, deployment pipeline, UI components library
- **Authentication**: SSO capability but isolated user experiences per app

---

## 📦 Phase 0: Pre-Migration Preparation
*Duration: 1-2 days*

### Git Safety
- [ ] Commit all current work in Wabbit RE
- [ ] Push all branches to remote
- [ ] Document any local-only configurations
- [ ] Note environment variables not in .env files

### Backup Creation
- [ ] Create Git tag: `git tag v1.0.0-pre-monorepo`
- [ ] Push tag: `git push --tags`
- [ ] Create backup branch: `git checkout -b backup/wabbit-re-stable`
- [ ] Push backup: `git push origin backup/wabbit-re-stable`
- [ ] Create local zip backup: `zip -r wabbit-re-backup-$(date +%Y%m%d).zip /path/to/wabbit-re`
- [ ] Store zip in safe location (external drive/cloud)

### Documentation
- [ ] Document current folder structure
- [ ] List all active cron jobs and their schedules
- [ ] Document current Vercel configuration
- [ ] Note all API endpoints and their purposes
- [ ] Record current deployment URL

### Verification
- [ ] Confirm Wabbit RE is working in production
- [ ] Test all critical features
- [ ] Verify database backups are current
- [ ] Check Supabase backup/export

---

## 🏗️ Phase 1: Foundation Setup
*Duration: 5-7 days*

### Create Monorepo Structure
- [ ] Create feature branch: `git checkout -b feat/monorepo-migration`
- [ ] Create directories:
  ```bash
  mkdir -p apps packages
  mkdir -p packages/supabase packages/ui packages/utils
  ```
- [ ] Move Wabbit RE to apps folder:
  ```bash
  mkdir apps/wabbit-re
  git mv !(apps|packages) apps/wabbit-re/
  git mv .* apps/wabbit-re/ 2>/dev/null || true
  ```
- [ ] Commit structure: `git commit -m "refactor: move wabbit-re to monorepo structure"`

### Setup Workspace Configuration
- [ ] Create root `package.json`:
  - [ ] Add workspace configuration
  - [ ] Add Turborepo scripts
  - [ ] Configure shared dependencies
- [ ] Install Turborepo: `npm install -D turbo`
- [ ] Create `turbo.json` configuration
- [ ] Test workspace: `npm install`
- [ ] Verify Wabbit RE still runs: `npm run dev:wabbit-re`

### Update Wabbit RE Paths
- [ ] Update import paths in Wabbit RE
- [ ] Update `next.config.js` for subdirectory
- [ ] Update API route paths
- [ ] Update public asset paths
- [ ] Test locally with new structure

### Vercel Configuration
- [ ] Create new `vercel.json` in root:
  - [ ] Add subdirectory rewrites
  - [ ] Update cron job paths
  - [ ] Configure build commands
- [ ] Test build: `npm run build`
- [ ] Document new deployment process

### Verification Checkpoint 1
- [ ] Wabbit RE runs in new location
- [ ] All tests pass
- [ ] Build succeeds
- [ ] Can navigate to app locally
- [ ] No broken imports

---

## 🚀 Phase 2: App Expansion
*Duration: 5-7 days*

### Fork Wabbit from Wabbit RE
- [ ] Copy Wabbit RE: `cp -r apps/wabbit-re apps/wabbit`
- [ ] Update `apps/wabbit/package.json`:
  - [ ] Change name to `@your-domain/wabbit`
  - [ ] Update description to reflect non-real estate ranking
- [ ] Remove real estate specific features:
  - [ ] Property scraping integrations
  - [ ] MLS data connections
  - [ ] Real estate specific UI elements
- [ ] Modify for general ranking use case:
  - [ ] Update ranking categories/metrics
  - [ ] Adjust UI components for new domain
  - [ ] Remove property-specific database calls
- [ ] Update environment variables
- [ ] Test Wabbit app: `npm run dev:wabbit`
- [ ] Commit: `git commit -m "feat: create wabbit app from wabbit-re fork"`

### Migrate Cursor MY MAP (CRM)
- [ ] If in separate repo:
  ```bash
  cd /path/to/cursor-map
  git remote add monorepo /path/to/gs-site
  git fetch monorepo
  ```
- [ ] Move to monorepo: `apps/crm`
- [ ] Update package.json:
  - [ ] Change name to `@your-domain/crm`
  - [ ] Update description to reflect CRM functionality
- [ ] Ensure complete independence:
  - [ ] No shared data models with ranking apps
  - [ ] Separate database tables/schemas
  - [ ] Independent API routes
- [ ] Fix import paths
- [ ] Update environment variables
- [ ] Test: `npm run dev:crm`
- [ ] Commit: `git commit -m "feat: migrate cursor-map CRM to monorepo"`

### Create GS Site Dashboard
- [ ] Create Next.js app: `cd apps && npx create-next-app@latest gs-site --typescript --tailwind`
- [ ] Configure as personal hub:
  - [ ] Create app launcher UI with cards for each app
  - [ ] Add navigation to: Wabbit RE, Wabbit, CRM
  - [ ] Integrate Notion API for 2nd brain content
  - [ ] Design personal branding/landing page
  - [ ] Add authentication check (optional per app)
- [ ] Setup Notion integration:
  - [ ] Configure Notion API credentials
  - [ ] Create data fetching utilities
  - [ ] Build UI components for Notion content
- [ ] Test: `npm run dev:dashboard`
- [ ] Commit: `git commit -m "feat: initialize gs-site personal dashboard"`

### Setup Shared Packages
- [ ] Create `packages/supabase`:
  - [ ] Move shared Supabase client
  - [ ] Add type definitions
  - [ ] Export utilities
- [ ] Create `packages/ui`:
  - [ ] Move shared components
  - [ ] Setup component library
- [ ] Create `packages/utils`:
  - [ ] Move shared utilities
  - [ ] Add common helpers
- [ ] Update app imports to use packages
- [ ] Test all apps still work

### Verification Checkpoint 2
- [ ] All 4 apps run independently
- [ ] Shared packages work
- [ ] No circular dependencies
- [ ] Build succeeds for all apps
- [ ] Can navigate between apps locally

---

## 🔗 Phase 3: Integration
*Duration: 5-7 days*

### Database Updates
- [ ] Design isolated schema strategy:
  - [ ] Wabbit RE tables: `properties`, `user_properties`, `rankings`
  - [ ] Wabbit tables: `items`, `user_items`, `rankings_general`
  - [ ] CRM tables: `contacts`, `deals`, `activities`, `pipelines`
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
  CREATE SCHEMA IF NOT EXISTS crm;
  ```
- [ ] Update RLS policies for complete app isolation
- [ ] Test database access from each app
- [ ] Verify data isolation works
- [ ] Document which tables belong to which app

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
  - [ ] `/crm/*` → Cursor MY MAP CRM
  - [ ] `/` or `/dashboard` → GS Site Dashboard
- [ ] Configure Next.js `basePath` for each app:
  - [ ] `wabbit-re`: basePath = '/wabbit-re'
  - [ ] `wabbit`: basePath = '/wabbit'
  - [ ] `crm`: basePath = '/crm'
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

### Pre-Deployment Testing
- [ ] Full build test: `npm run build`
- [ ] Run all test suites
- [ ] Test production build locally
- [ ] Verify all features work
- [ ] Check for console errors

### Vercel Deployment Setup
- [ ] Create new Vercel project (or update existing)
- [ ] Configure environment variables in Vercel
- [ ] Set up build commands
- [ ] Configure domains/subdomains
- [ ] Test preview deployment

### Deploy to Staging
- [ ] Push to staging branch
- [ ] Deploy to Vercel preview
- [ ] Test all apps on staging URL
- [ ] Verify subdirectory routing
- [ ] Test cross-app navigation

### Production Deployment
- [ ] Final backup of current production
- [ ] Merge to main branch
- [ ] Monitor deployment
- [ ] Test production URLs immediately
- [ ] Monitor error logs

### Post-Deployment
- [ ] Verify all apps accessible
- [ ] Test critical user flows
- [ ] Check cron job execution
- [ ] Monitor performance metrics
- [ ] Document any issues

### Verification Checkpoint 4
- [ ] All apps live and accessible
- [ ] No errors in production logs
- [ ] Performance acceptable
- [ ] Users can navigate between apps
- [ ] Data flowing correctly

---

## 🛟 Phase 5: Stabilization
*Duration: 2-3 days*

### Monitoring
- [ ] Set up error tracking (Sentry/similar)
- [ ] Configure uptime monitoring
- [ ] Set up alerts for failures
- [ ] Monitor database performance
- [ ] Track user analytics

### Documentation
- [ ] Update all README files
- [ ] Document deployment process
- [ ] Create troubleshooting guide
- [ ] Document architecture decisions
- [ ] Update API documentation

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
- [ ] All 4 apps accessible via subdirectories:
  - [ ] `/wabbit-re` - Real estate ranking platform
  - [ ] `/wabbit` - General ranking platform
  - [ ] `/crm` - CRM system
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
# Rollback to backup
git checkout backup/wabbit-re-stable

# Check app status
npm run dev:wabbit-re
npm run dev:wabbit
npm run dev:crm
npm run dev:dashboard

# Build all apps
npm run build

# Deploy to Vercel
vercel --prod

# Access apps locally
# http://localhost:3000/wabbit-re
# http://localhost:3000/wabbit
# http://localhost:3000/crm
# http://localhost:3000/ (dashboard)
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
- **Cursor MY MAP**: Standalone CRM system
- **GS Site Dashboard**: Personal hub with Notion integration

**Last Updated**: January 2025
**Checklist Version**: 1.1.0
**Risk Assessment**: LOW (with proper backups)