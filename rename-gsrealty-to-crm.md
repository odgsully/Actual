# CRM Platform Plan: Rename + Multi-Tenant Architecture

**Created**: January 18, 2026
**Updated**: January 19, 2026
**Status**: Planning

---

## Document Overview

This document covers **two major initiatives**:

| Part | Scope | Complexity | Status |
|------|-------|------------|--------|
| **Part 1** | Rename `gsrealty-client` → `CRM` | Low | Ready to execute |
| **Part 2** | Multi-tenant architecture for individuals + teams | High | Planning |

**Recommended approach**: Complete Part 1 first, then proceed with Part 2 phases incrementally.

---

# Part 1: Directory Rename (`gsrealty-client` → `CRM`)

**Feasibility Rating**: 8/10 (Highly Feasible)
**Risk Level**: Low-Medium

## Executive Summary

This section outlines the plan to rename `apps/gsrealty-client` to `apps/CRM` in the monorepo. The rename is highly feasible due to:

- No cross-app import dependencies
- No JWT `app_context` implementation in RLS policies
- Existing scaffolding (`dev:crm`, `build:crm` scripts already exist)
- Database tables remain unchanged (just directory rename)

---

## Pre-Flight Checklist

Complete ALL checks before proceeding with the rename.

### 1. Verify No Active Development

- [ ] No uncommitted changes in `apps/gsrealty-client/`
- [ ] No open PRs targeting gsrealty-client files
- [ ] Current branch is clean: `git status`

```bash
# Run this check
git status apps/gsrealty-client/
```

### 2. Verify Build Works Before Rename

- [ ] Current build succeeds

```bash
npm run build:gsrealty
```

### 3. Verify Database State

- [ ] Confirm 12 gsrealty_* tables exist (do NOT rename these)

| Table | Required |
|-------|----------|
| `gsrealty_admin_settings` | ✓ |
| `gsrealty_campaigns` | ✓ |
| `gsrealty_clients` | ✓ |
| `gsrealty_deals` | ✓ |
| `gsrealty_event_entries` | ✓ |
| `gsrealty_invitations` | ✓ |
| `gsrealty_login_activity` | ✓ |
| `gsrealty_mcao_data` | ✓ |
| `gsrealty_outreach` | ✓ |
| `gsrealty_properties` | ✓ |
| `gsrealty_uploaded_files` | ✓ |
| `gsrealty_users` | ✓ |

### 4. Verify No JWT app_context Dependencies

- [ ] Confirm RLS uses table lookup, not JWT claims

```bash
# Should return NO results for app_context in active code
grep -r "app_context" apps/gsrealty-client/lib/ apps/gsrealty-client/app/
```

### 5. Backup Current State

- [ ] Create safety branch

```bash
git checkout -b backup/pre-crm-rename-$(date +%Y%m%d)
git push origin backup/pre-crm-rename-$(date +%Y%m%d)
git checkout gsrealty-crm  # or your working branch
```

---

## Decision Point: URL Path

**Before proceeding, decide on URL routing strategy:**

| Option | Path | Pros | Cons |
|--------|------|------|------|
| **A** (Recommended) | Keep `/gsrealty` | No breaking changes, bookmarks work | Slight naming inconsistency |
| **B** | Change to `/crm` | Clean naming | Breaks existing bookmarks/links |

**Selected Option**: [ ] A - Keep `/gsrealty` | [ ] B - Change to `/crm`

---

## Implementation Plan

### Phase 1: Core Directory Rename

**Risk**: Low
**Reversible**: Yes (git checkout)

#### Step 1.1: Rename Directory

```bash
# From repo root
git mv apps/gsrealty-client apps/CRM
```

#### Step 1.2: Update Package Name

Edit `apps/CRM/package.json`:

```diff
- "name": "gsrealty-client",
+ "name": "crm",
```

#### Step 1.3: Verify Turborepo Discovery

```bash
# Should show "crm" in the list
npx turbo run build --dry-run --filter=crm
```

#### Step 1.4: Clean Old Scripts from Root package.json

Edit `package.json` (root) - remove old scripts:

```diff
- "dev:gsrealty": "turbo run dev --filter=gsrealty-client",
- "build:gsrealty": "turbo run build --filter=gsrealty-client",
- "test:gsrealty": "turbo run test --filter=gsrealty-client",
```

Keep the existing `dev:crm` and `build:crm` scripts (already correct).

---

### Phase 2: Vercel Routing

**Risk**: Medium
**Reversible**: Yes (revert vercel.json)

#### Step 2.1: Update vercel.json Destinations

Edit `vercel.json`:

**If keeping `/gsrealty` URL path (Option A):**

```diff
{
  "source": "/gsrealty/:path*",
- "destination": "/apps/gsrealty-client/:path*"
+ "destination": "/apps/CRM/:path*"
}
```

**If changing to `/crm` URL path (Option B):**

```diff
- "source": "/gsrealty/:path*",
+ "source": "/crm/:path*",
- "destination": "/apps/gsrealty-client/:path*"
+ "destination": "/apps/CRM/:path*"
}
```

#### Step 2.2: Update All Destination References

Find and replace in `vercel.json`:
- `/apps/gsrealty-client/:path*` → `/apps/CRM/:path*`
- `/apps/gsrealty-client` → `/apps/CRM`

Expected changes: **3 locations**

#### Step 2.3: Update Cron Paths (if Option B)

Only if changing URL path to `/crm`:

```diff
- "/gsrealty/api/cron/hourly-scrape"
+ "/crm/api/cron/hourly-scrape"

- "/gsrealty/api/cron/daily-cleanup"
+ "/crm/api/cron/daily-cleanup"

- "/gsrealty/api/cron/check-health"
+ "/crm/api/cron/check-health"
```

---

### Phase 3: gs-site Cross-App Integration

**Risk**: Low
**Reversible**: Yes

#### Step 3.1: Update `apps/gs-site/lib/wabbit/client.ts`

```diff
// App configuration (lines 18-23)
- gsrealty: {
-   name: 'GS Realty',
+ crm: {
+   name: 'CRM',
    baseUrl: process.env.GSREALTY_URL || 'http://localhost:3004',
-   description: 'Real estate CRM',
+   description: 'Sullivan Realty CRM',
    healthEndpoint: '/api/health',
  },

// WabbitStats interface (lines 54-59)
- gsrealty: {
+ crm: {
    totalClients?: number;
    activeClients?: number;
    pendingInvites?: number;
    recentUploads?: number;
  };

// Deep links (lines 94-105)
- 'gsrealty-admin': {
-   app: 'gsrealty',
+ 'crm-admin': {
+   app: 'crm',
    path: '/admin',
-   label: 'GS Clients Admin',
+   label: 'CRM Admin',
    description: 'Admin dashboard for real estate clients',
  },
- 'gsrealty-clients': {
-   app: 'gsrealty',
+ 'crm-clients': {
+   app: 'crm',
    path: '/admin/clients',
    label: 'Client List',
    description: 'Manage real estate clients',
  },

// Client export (lines 242-280)
- export const gsrealtyClient = {
+ export const crmClient = {
    async getStats(): Promise<WabbitStats['crm']> {
      // ... update WABBIT_APPS.gsrealty → WABBIT_APPS.crm
    },
  };

// getAllStats function (lines 346-356)
- const [wabbitReStats, gsrealtyStats, wabbitStats] = await Promise.all([
+ const [wabbitReStats, crmStats, wabbitStats] = await Promise.all([
    wabbitReClient.getStats(),
-   gsrealtyClient.getStats(),
+   crmClient.getStats(),
    wabbitClient.getStats(),
  ]);

  return {
    wabbitRe: wabbitReStats,
-   gsrealty: gsrealtyStats,
+   crm: crmStats,
    wabbit: wabbitStats,
  };
```

#### Step 3.2: Update `apps/gs-site/hooks/useWabbitStats.ts`

```diff
// Import
- gsrealtyClient,
+ crmClient,

// Hook (lines 85-92)
- export function useGsrealtyStats(options?: { enabled?: boolean }) {
+ export function useCrmStats(options?: { enabled?: boolean }) {
    return useQuery({
-     queryKey: wabbitQueryKeys.statsApp('gsrealty'),
+     queryKey: wabbitQueryKeys.statsApp('crm'),
-     queryFn: gsrealtyClient.getStats,
+     queryFn: crmClient.getStats,
      staleTime: 60_000,
      enabled: options?.enabled ?? true,
    });
  }
```

#### Step 3.3: Update `apps/gs-site/components/tiles/WabbitLinkTile.tsx`

```diff
const TILE_DEEP_LINK_MAP: Record<string, string> = {
- 'GS-clients Admin Dash page': 'gsrealty-admin',
+ 'GS-clients Admin Dash page': 'crm-admin',
- CRM: 'gsrealty-clients',
+ CRM: 'crm-clients',
};

const TILE_APP_MAP: Record<string, WabbitAppKey> = {
- 'GS-clients Admin Dash page': 'gsrealty',
+ 'GS-clients Admin Dash page': 'crm',
- CRM: 'gsrealty',
+ CRM: 'crm',
};

const APP_ICONS: Record<WabbitAppKey, typeof Home> = {
  'wabbit-re': Home,
- gsrealty: Users,
+ crm: Users,
  wabbit: ListTodo,
};
```

#### Step 3.4: Update `apps/gs-site/lib/data/tiles.ts`

```diff
// Line 461
- "desc": "Link to gsrealty-client site",
+ "desc": "Link to CRM site",
```

---

### Phase 4: CI/CD Updates

**Risk**: Low
**Reversible**: Yes

#### Step 4.1: Update `.github/workflows/test.yml`

```diff
matrix:
- app: [wabbit-re, wabbit, gsrealty-client]
+ app: [wabbit-re, wabbit, crm]
```

#### Step 4.2: Update `.github/workflows/deploy-production.yml`

Update any health check URLs if changed.

#### Step 4.3: Update `.github/workflows/deploy-staging.yml`

Update health check endpoints if Option B chosen.

---

### Phase 5: Documentation Updates

**Risk**: None
**Reversible**: Yes

#### Step 5.1: Priority Documentation

| File | Action |
|------|--------|
| `CLAUDE.md` | Update UI design system section |
| `README.md` | Update project structure |
| `MIGRATION_PROGRESS_TRACKER.md` | Update app references |
| `docs/ARCHITECTURE.md` | Update app listing, ports |

#### Step 5.2: Batch Update Remaining Docs

```bash
# Find all remaining references
grep -r "gsrealty-client" --include="*.md" . | grep -v node_modules | grep -v .next
```

---

### Phase 6: Cleanup & Verification

#### Step 6.1: Clear Build Caches

```bash
rm -rf apps/CRM/.next
rm -rf node_modules/.cache
```

#### Step 6.2: Reinstall Dependencies

```bash
npm install
```

#### Step 6.3: Verify Build

```bash
npm run build:crm
```

#### Step 6.4: Verify Turbo Filter

```bash
npx turbo run dev --filter=crm --dry-run
```

#### Step 6.5: Update Local Claude Settings (Optional)

Edit `.claude/settings.local.json` to update Bash permission patterns if needed.

#### Step 6.6: Re-link Vercel (If Needed)

```bash
cd apps/CRM
vercel link
```

---

## Post-Rename Verification Checklist

- [ ] `npm run build:crm` succeeds
- [ ] `npm run dev:crm` starts on port 3004
- [ ] gs-site tiles link correctly to CRM
- [ ] Vercel preview deployment works
- [ ] Health endpoint responds: `/gsrealty/api/health` (or `/crm/api/health`)
- [ ] Cron jobs trigger correctly
- [ ] Database queries still work (tables unchanged)

---

## Rollback Plan

If issues occur, rollback is straightforward:

```bash
# Revert all changes
git checkout -- .

# Or revert to backup branch
git checkout backup/pre-crm-rename-YYYYMMDD
```

---

## What NOT to Change

| Item | Reason |
|------|--------|
| Database table names (`gsrealty_*`) | Would require migration, RLS updates |
| RLS function names (`is_gsrealty_admin`) | Just identifiers, still work |
| External template path | Outside repo |
| Environment variable `GSREALTY_URL` | Optional rename, not required |

---

## Files Changed Summary

| Category | Count | Files |
|----------|-------|-------|
| Directory rename | 1 | `apps/gsrealty-client/` → `apps/CRM/` |
| Package config | 2 | `apps/CRM/package.json`, root `package.json` |
| Vercel config | 1 | `vercel.json` (3 changes) |
| gs-site integration | 4 | client.ts, useWabbitStats.ts, WabbitLinkTile.tsx, tiles.ts |
| CI/CD | 3 | `.github/workflows/*.yml` |
| Documentation | ~10-15 | Various `.md` files |
| **Total** | ~22-27 | files |

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
| `gsrealty_campaigns` | No org_id | Add column + backfill |
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
- [ ] Add `organization_id` to `gsrealty_campaigns`
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
