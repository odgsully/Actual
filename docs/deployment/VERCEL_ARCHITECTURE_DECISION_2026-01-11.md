# Vercel Deployment Architecture Decision

> Date: January 11, 2026
> Status: **Decision Made** - Proceeding with 2 Vercel projects
> Author: Claude Code Session

---

## Executive Summary

After analyzing the monorepo deployment situation, the recommendation is to **keep the monorepo structure** but use **2 separate Vercel projects** for the apps that need deployment. This is both best practice and cost-efficient.

---

## App Purposes & Audiences

| App | Purpose | Audience | Auth Required |
|-----|---------|----------|---------------|
| **gs-site** | Personal dashboard for mobile, tablet, desktop | Single user (you) | Yes (currently missing!) |
| **Growth Advisory Landing** | Public landing page with call booking | Public visitors | No |
| **gsrealty-client** | Internal CRM, designed to be forked and sold as product | Internal use, then customers fork | No (by design) |
| **wabbit-re** | Reference implementation for apps/wabbit | Documentation only | Has auth, multi-user |
| **wabbit** | General ranking app (future) | Multiple users | Yes |

### gs-site Structure (Dual Purpose)

The gs-site app serves **two distinct purposes** at different routes:

```
growthadvisory.ai/                     → Public landing page
                                         - Marketing components (components/marketing/*)
                                         - HeroSection, ServicesSection, CTASection, etc.
                                         - Call booking functionality
                                         - NO AUTH (public)

growthadvisory.ai/private/gs-site      → Personal dashboard
                                         - Tile-based dashboard (components/tiles/*)
                                         - DraggableGrid, TileDispatcher, etc.
                                         - NEEDS AUTH (currently unprotected!)
```

### Landing Page Status

The landing page (`/`) exists with dedicated marketing components:
- `components/marketing/HeroSection.tsx`
- `components/marketing/ServicesSection.tsx`
- `components/marketing/CTASection.tsx`
- `components/marketing/TestimonialsSection.tsx`
- `components/marketing/MethodologySection.tsx`
- `components/marketing/PainPointsSection.tsx`
- `components/marketing/MarketingNav.tsx`
- `components/marketing/MarketingFooter.tsx`

**Refinement needed**:
1. Currently shares underlying UI primitives (Tailwind, shadcn) with dashboard - may need distinct visual identity
2. Call booking is **UI placeholder only** - needs integration (Calendly, Cal.com, or custom)

### gsrealty-client as Product

This app is designed to be:
1. Used internally at `crm.growthadvisory.ai`
2. Forked by customers who get their own deployments
3. Sold under the Growth Advisory brand

No auth by design - customers handle their own auth in their forks.

### wabbit-re as Reference

- **Not deployed** - kept in codebase only
- **Purpose**: Reference implementation for `apps/wabbit`
- **Features preserved**: Auth system, multi-user support, data storage patterns
- **Database**: Tables remain in Supabase for documentation

---

## Background: What Happened Today

### Original Setup (Before Today)
The vercel.json attempted complex multi-app routing:
```json
{
  "buildCommand": "turbo run build",
  "rewrites": [
    { "source": "/wabbit-re/:path*", "destination": "/apps/wabbit-re/:path*" },
    { "source": "/gsrealty/:path*", "destination": "/apps/gsrealty-client/:path*" },
    // + growthadvisory.ai host-based routing
  ],
  "crons": [/* 10 crons across all apps */]
}
```

### Why It Failed
- Vercel's `framework: "nextjs"` expects a **single** Next.js app per project
- Rewrites to `/apps/wabbit-re/:path*` don't work because only one app's `.next` output is deployed
- Multi-app routing requires either separate Vercel projects or a custom server

### The "Fix" (Today's Changes)
Simplified to deploy gs-site only:
```json
{
  "buildCommand": "cd apps/gs-site && npm run build",
  "outputDirectory": "apps/gs-site/.next",
  "crons": [/* gs-site crons only */]
}
```

### Unintended Consequences
| App | Intended URL | Status After Changes |
|-----|--------------|---------------------|
| gs-site | growthadvisory.ai | ✅ Working |
| gsrealty-client | crm.growthadvisory.ai | ❌ 404 - Orphaned |
| wabbit-re | wabbit-rank.ai | ⚠️ Showing gs-site (accidental) |
| wabbit | (not deployed) | 🔸 Unchanged |

---

## Current App Status

### gs-site (Landing + Personal Dashboard)
- **Status**: Active, deployed
- **URLs**:
  - `growthadvisory.ai/` → Landing page ✅ Working (needs refinement)
  - `growthadvisory.ai/private/gs-site` → Dashboard ⚠️ Working but UNPROTECTED
- **Owner**: Personal use
- **Deployment**: Current Vercel project
- **Security Issue**: Dashboard has no auth protection

### gsrealty-client (CRM)
- **Status**: Needs deployment
- **URL**: https://crm.growthadvisory.ai (currently 404)
- **Owner**: Internal use, then customers fork
- **Deployment**: Needs new Vercel project
- **Priority**: HIGH - needs to be live

### wabbit-re (Property Ranking Reference)
- **Status**: Discontinued as deployed app
- **URL**: wabbit-rank.ai (accidentally showing gs-site)
- **Purpose**: Reference implementation for apps/wabbit
- **Database**: Tables preserved for documentation
- **Deployment**: Not needed - codebase reference only

### wabbit (General Ranking)
- **Status**: Future development
- **Deployment**: Not needed now
- **Note**: Will use wabbit-re as reference for auth/multi-user patterns

---

## Architecture Decision

### Decision: Keep Monorepo, Use 2 Vercel Projects

```
Git Monorepo (unchanged)
├── apps/gs-site          → Vercel Project: "gs-site-dashboard"
│                            Domain: growthadvisory.ai
│
├── apps/gsrealty-client  → Vercel Project: "gsrealty-client" (NEW)
│                            Domain: crm.growthadvisory.ai
│
├── apps/wabbit-re        → Not deployed (discontinued)
├── apps/wabbit           → Not deployed (future)
└── packages/             → Shared code
         │
         ▼
    Single Supabase Project (unchanged)
```

### Why 2 Projects Instead of 1

| Factor | Single Project | 2 Projects |
|--------|---------------|------------|
| Vercel compatibility | ❌ Can't route multiple Next.js apps | ✅ Each project = one app |
| Build efficiency | Builds everything | Only builds changed app |
| Cron isolation | Shared, confusing | Clear ownership |
| Cost (Pro plan) | 1 project | Same cost (Pro is per-team) |
| Code sharing | ✅ Monorepo | ✅ Still monorepo |
| Supabase | ✅ Single project | ✅ Single project |

### Why NOT Split the Git Repo

- Shared code in `packages/` would require npm publishing
- Same Supabase project = tightly coupled anyway
- Git history preservation
- Easier cross-app refactoring
- Turborepo caching benefits

---

## Implementation Plan

### Phase 1: Set Up gsrealty-client Vercel Project

#### Step 1: Create New Vercel Project
```bash
cd apps/gsrealty-client
vercel link
# Select: Create new project
# Project name: gsrealty-client
# Framework: Next.js
# Root directory: apps/gsrealty-client
```

#### Step 2: Configure Build Settings
Either via Vercel Dashboard or `apps/gsrealty-client/vercel.json`:
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run build",
  "installCommand": "cd ../.. && npm install",
  "framework": "nextjs",
  "crons": [
    {
      "path": "/api/cron/daily-cleanup",
      "schedule": "0 3 * * *"
    }
  ]
}
```

#### Step 3: Add Environment Variables
Required in Vercel Dashboard for gsrealty-client project:
```
NEXT_PUBLIC_SUPABASE_URL=<same as gs-site>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<same as gs-site>
SUPABASE_SERVICE_ROLE_KEY=<same as gs-site>
RESEND_API_KEY=<email service>
RESEND_FROM_EMAIL=no-reply@growthadvisory.ai
CRON_SECRET=<generate new or share>
```

#### Step 4: Add Domain
```bash
vercel domains add crm.growthadvisory.ai
```

Or via Vercel Dashboard: Project Settings → Domains → Add `crm.growthadvisory.ai`

#### Step 5: Configure DNS
Add to Namecheap/DNS provider:
```
Type: CNAME
Host: crm
Value: cname.vercel-dns.com
```

### Phase 2: Clean Up wabbit-rank.ai

Options:
1. **Remove domain entirely** - If wabbit-re is discontinued
2. **Point to maintenance page** - Static "Service discontinued" page
3. **Keep as gs-site** - If intentional redirect

### Phase 3: Verify Deployment

```bash
# Test gsrealty-client
curl -sI https://crm.growthadvisory.ai | head -5
# Expected: HTTP/2 200

# Test gs-site still works
curl -sI https://growthadvisory.ai | head -5
# Expected: HTTP/2 200

# Verify cron jobs
vercel crons ls --project=gsrealty-client
vercel crons ls --project=gs-site-dashboard
```

---

## Supabase Impact

### No Changes Required

Both Vercel projects connect to the same Supabase project:
- Same `SUPABASE_URL` and keys
- Same user authentication pool
- Table ownership rules still apply (see `docs/DATABASE_OWNERSHIP.md`)

### Table Ownership Reminder

| App | Owned Tables |
|-----|--------------|
| gsrealty-client | clients, files, mcao_cache, invitations, events |
| wabbit-re | properties, rankings, user_preferences, scraping_* |
| gs-site | None (read-only aggregator) |
| Shared | users, profiles (Supabase Auth) |

---

## Cost Analysis

### Vercel Pro Plan
- **Billing**: Per-team, not per-project
- **Projects**: Unlimited on Pro
- **Cost for 2 projects**: Same as 1 project

### Resource Usage
- **gs-site**: ~4 cron jobs (LIFX, MFP sync)
- **gsrealty-client**: ~1-2 cron jobs (cleanup)
- **Combined**: Well within Pro limits

---

## Files to Update

### Already Correct
- `/vercel.json` - gs-site configuration (current)
- `/apps/gs-site/vercel.json` - gs-site crons

### Need Creation
- `/apps/gsrealty-client/vercel.json` - New file for gsrealty build config

### Need Update
- `/apps/gsrealty-client/.vercel/project.json` - Will be created by `vercel link`
- `CLAUDE.md` - Document new deployment architecture

---

## Rollback Plan

If issues arise:
1. gsrealty-client project can be deleted without affecting gs-site
2. Domains can be reassigned between projects
3. Monorepo structure unchanged - no code rollback needed

---

## Questions Resolved

| Question | Answer |
|----------|--------|
| Split from monorepo? | **No** - keep monorepo |
| Were today's changes correct? | **Partially** - gs-site fine, gsrealty orphaned |
| Why can't single Vercel project work? | Vercel limitation: 1 Next.js app per project |
| Extra cost for 2 projects? | **No** - Pro is per-team |
| What about wabbit-re? | Discontinued, no deployment needed |

---

## Next Steps

### Priority 1: Deploy gsrealty-client
1. [ ] Create Vercel project for gsrealty-client
2. [ ] Configure environment variables
3. [ ] Add crm.growthadvisory.ai domain
4. [ ] Configure DNS CNAME record
5. [ ] Deploy and verify

### Priority 1: Landing Page Refinement
6. [ ] Review marketing components visual identity
7. [ ] Ensure distinct look from dashboard
8. [ ] Implement call booking (currently UI placeholder only - needs Calendly/Cal.com integration)
9. [ ] Mobile responsiveness check

### Priority 2: Security
10. [ ] Add auth protection to `/private/*` routes in gs-site
11. [ ] Options: Supabase Auth, NextAuth, Vercel Password Protection, or simple middleware
12. [ ] Until fixed, dashboard is publicly accessible!

### Priority 3: Cleanup
13. [ ] Decide fate of wabbit-rank.ai domain:
    - Option A: Remove from Vercel entirely
    - Option B: Point to "Service discontinued" page
    - Option C: Redirect to growthadvisory.ai
14. [ ] Update CLAUDE.md with new deployment architecture

---

## Security Warning

⚠️ **CRITICAL**: The personal dashboard at `growthadvisory.ai/private/gs-site` is currently **publicly accessible** with no authentication. Anyone who knows the URL can access your personal dashboard.

**Temporary mitigation options**:
1. Vercel Password Protection (Pro feature) for `/private/*` paths
2. Next.js middleware auth check
3. Simple environment variable password gate

**Recommended long-term**: Implement proper auth using existing Supabase Auth infrastructure with protected routes.

---

## Related Documentation

- [Database Ownership](./DATABASE_OWNERSHIP.md)
- [growthadvisory.ai Vercel Setup](../growthadvisoryai-vercel.md)
- [Vercel Deployment Status](./VERCEL_DEPLOYMENT_STATUS.md)
- [Safety Protocols](./SAFETY_PROTOCOLS.md)
