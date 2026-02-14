# growthadvisory.ai Vercel Deployment

> Last Updated: January 11, 2026
> Status: **LIVE** - Successfully deployed and accessible

---

## Quick Status

| Phase | Status |
|-------|--------|
| Build Fixes | ✅ Complete |
| Code Configuration | ✅ Complete |
| Vercel Dashboard Setup | ✅ Complete |
| DNS Configuration | ✅ Complete |
| Testing & Verification | ✅ Complete |

**Live URLs:**
- https://growthadvisory.ai ✅
- https://www.growthadvisory.ai ✅

---

## Current Architecture (Simplified)

The original plan was to deploy multiple apps (gs-site, gsrealty-client, wabbit, wabbit-re) with path-based routing. However, due to Vercel's monorepo limitations and build issues, we simplified to deploy **gs-site only**.

```
                    growthadvisory.ai
                          │
                          ▼
                   ┌──────────────┐
                   │   Vercel     │
                   │   Edge       │
                   └──────────────┘
                          │
                          ▼
                    ┌──────────┐
                    │ gs-site  │
                    │   app    │
                    │  (root)  │
                    └──────────┘
```

**Why simplified?**
- Vercel's monorepo support requires separate projects per app, or complex build configurations
- The original rewrites to `/apps/wabbit-re/:path*` don't work because only gs-site's `.next` output is deployed
- Multi-app routing would require either separate Vercel projects or a custom server setup

---

## Build Fixes Required

Multiple build issues had to be resolved before deployment was possible. Here's a detailed breakdown:

### 1. DataDog Instrumentation (dd-trace) - REMOVED

**Files Changed:**
- `apps/wabbit/instrumentation.ts` - DELETED
- `apps/wabbit-re/instrumentation.ts` - DELETED
- `apps/gsrealty-client/instrumentation.ts` - DELETED
- `apps/wabbit/next.config.js` - Disabled instrumentationHook
- `apps/wabbit-re/next.config.js` - Disabled instrumentationHook
- `apps/gsrealty-client/next.config.js` - Disabled instrumentationHook

**The Problem:**
```typescript
// instrumentation.ts was importing dd-trace which wasn't installed
import { default: tracer } from 'dd-trace';
```

The `instrumentationHook` experimental feature was enabled in next.config.js, and instrumentation.ts files existed that imported `dd-trace`. However, dd-trace was never added to package.json dependencies.

**Why it failed:**
- Webpack resolves imports at build time, not runtime
- Even with try/catch around the import, webpack still tries to resolve the module
- The build fails with "Module not found: Can't resolve 'dd-trace'"

**The Fix:**
1. Deleted all `instrumentation.ts` files since DataDog APM wasn't actually configured
2. Removed/commented out `instrumentationHook: true` from next.config.js files
3. Added comments explaining how to re-enable when DataDog is properly set up

**next.config.js change:**
```javascript
// Before
experimental: {
  instrumentationHook: true,
}

// After
// Note: instrumentationHook disabled - dd-trace not installed
// Re-enable when DataDog APM is configured
```

---

### 2. Next.js Version Mismatch

**Files Changed:**
- `apps/wabbit/package.json` - Updated next to 14.2.33
- `apps/wabbit-re/package.json` - Updated next to 14.2.33
- `package-lock.json` - Regenerated

**The Problem:**
```
Mismatching @next/swc version, detected: 14.2.33 while Next.js is on 14.1.0
```

Different apps had different Next.js versions:
- gs-site: 14.2.35
- gsrealty-client: 14.2.33
- wabbit-re: 14.1.0 (old)
- wabbit: 14.1.0 (old)

**Why it failed:**
- In a monorepo, npm hoists shared dependencies
- @next/swc (the Rust compiler) was being shared across apps
- Version 14.2.33 of @next/swc was incompatible with Next.js 14.1.0
- This caused "missing field `hashSalt`" errors during build

**The Fix:**
Updated wabbit and wabbit-re to use Next.js 14.2.33 (matching gsrealty-client):
```bash
cd apps/wabbit && npm pkg set dependencies.next="14.2.33"
cd apps/wabbit-re && npm pkg set dependencies.next="14.2.33"
```

Then regenerated the lockfile:
```bash
rm -rf node_modules package-lock.json
npm install
```

---

### 3. TypeScript Map Iteration Error

**Files Changed:**
- `apps/wabbit-re/lib/rate-limit.ts`
- `apps/gsrealty-client/lib/rate-limit.ts`

**The Problem:**
```typescript
// This pattern fails with default TypeScript settings
for (const [key, entry] of this.store.entries()) {
  // ...
}
```

Error: "Type 'MapIterator<[string, RateLimitEntry]>' can only be iterated through when using the '--downlevelIteration' flag"

**Why it failed:**
- TypeScript's default target doesn't support Map iteration with for...of
- Would require enabling `downlevelIteration` in tsconfig.json
- Or converting to a compatible pattern

**The Fix:**
Converted to Array.from() which works without config changes:
```typescript
// Before
for (const [key, entry] of this.store.entries()) {
  if (entry.resetTime < now) {
    this.store.delete(key)
  }
}

// After
Array.from(this.store.entries()).forEach(([key, entry]) => {
  if (entry.resetTime < now) {
    this.store.delete(key)
  }
})
```

---

### 4. Type Casting Errors in CallLog API

**Files Changed:**
- `apps/gs-site/app/api/calllog/process/route.ts`

**The Problem:**
```typescript
const merged = mergeExtractions(extractions) as LLMCallLogExtraction;
// Error: Conversion may be a mistake because neither type sufficiently overlaps
```

**Why it failed:**
- `mergeExtractions()` returns `Record<string, unknown>`
- Direct casting to `LLMCallLogExtraction` fails TypeScript's type overlap check
- This is a safety feature to prevent accidental type mismatches

**The Fix:**
Cast through `unknown` first (standard pattern for intentional type assertions):
```typescript
// Before
const merged = mergeExtractions(extractions) as LLMCallLogExtraction;

// After
const merged = mergeExtractions(extractions) as unknown as LLMCallLogExtraction;
```

Applied same pattern to other type assertions in the file.

---

### 5. Missing Function Exports

**Files Changed:**
- `apps/gs-site/app/api/github/search/route.ts` - Stubbed out
- `apps/gs-site/app/api/notion/habits/update/route.ts` - Refactored
- `apps/gs-site/lib/integrations/index.ts` - Fixed exports

**Problem A - GitHub Search Route:**
```typescript
// Importing functions that don't exist
import { searchRepos, searchArizonaRepos } from '@/lib/github/client';
```

The route was importing `searchRepos` and `searchArizonaRepos` which were never implemented in the GitHub client.

**Fix:** Stubbed the route to return 501 Not Implemented:
```typescript
export async function GET() {
  return NextResponse.json(
    { error: 'GitHub search not yet implemented' },
    { status: 501 }
  );
}
```

**Problem B - Habits Update Route:**
```typescript
// Importing non-existent function
import { createDailyRecord } from '@/lib/notion/habits';
```

The route was importing `createDailyRecord` which doesn't exist. It also expected `getTodaysRecord(date)` but the actual function takes no parameters.

**Fix:** Refactored to use actual exported functions:
```typescript
// Before
import { getTodaysRecord, createDailyRecord } from '@/lib/notion/habits';
// ...
let record = await getTodaysRecord(targetDate);
if (!record) {
  pageId = await createDailyRecord(targetDate);
}

// After
import { updateHabitForToday } from '@/lib/notion/habits';
// ...
const success = await updateHabitForToday(habit, completed);
```

**Problem C - Integrations Index:**
```typescript
// Exporting things that don't exist
export { WARNING_TESTS, TILE_WARNING_MAP, getWarningTestForTile } from './warning-tests';
```

**Fix:** Updated to only export actual functions:
```typescript
export {
  shouldShowWarning,
  registerWarningTest,
  unregisterWarningTest,
} from './warning-tests';
```

---

### 6. Resend Client Build-Time Initialization

**Files Changed:**
- `apps/gsrealty-client/lib/email/resend-client.ts`

**The Problem:**
```typescript
// This runs at module load time (during build)
const resend = new Resend(process.env.RESEND_API_KEY);
```

**Why it failed:**
- Module-level code executes when the module is imported
- During Vercel's static analysis phase, environment variables may not be available
- This caused "Failed to collect page data" errors for routes importing this module

**The Fix:**
Lazy-initialize the client only when actually needed:
```typescript
// Before
const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_CONFIG = {
  from: process.env.RESEND_FROM_EMAIL || 'no-reply@gsrealty.com',
};

// After
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

function getEmailConfig() {
  return {
    from: process.env.RESEND_FROM_EMAIL || 'no-reply@gsrealty.com',
  };
}
```

---

### 7. Turborepo Environment Variables

**Files Changed:**
- `turbo.json`

**The Problem:**
```
Warning - the following environment variables are set on your Vercel project,
but missing from "turbo.json". These variables WILL NOT be available to your
application and may cause your build to fail.
```

**Why it failed:**
- Turborepo caches builds based on inputs
- If env vars aren't declared in turbo.json, they're not considered as cache keys
- This can cause stale builds or missing variables

**The Fix:**
Added `globalEnv` to turbo.json:
```json
{
  "globalEnv": [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
    "OPENAI_API_KEY",
    "RESEND_API_KEY",
    "EMAIL_FROM",
    "CRON_SECRET",
    "NOTION_API_KEY",
    "NOTION_HABITS_DATABASE_ID",
    "NOTION_TASKS_DATABASE_ID",
    "GITHUB_ACCESS_TOKEN",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET"
  ]
}
```

---

## Vercel Configuration Changes

### Original vercel.json (Complex Multi-App)

The original configuration attempted to:
1. Route `/wabbit-re/*` to wabbit-re app
2. Route `/wabbit/*` to wabbit app
3. Route `/gsrealty/*` to gsrealty-client app
4. For growthadvisory.ai host: route `/private/gs-site/*` to gs-site
5. For growthadvisory.ai host: route `/private/realty-admin/*` to gsrealty-client
6. Redirect growthadvisory.ai root to `/private/gs-site`

**Why it didn't work:**
- `"framework": "nextjs"` expects a single Next.js app
- Rewrites to `/apps/wabbit-re/:path*` fail because only gs-site's `.next` is in the output
- Vercel's monorepo support doesn't work this way with a single project

### Final vercel.json (Simplified)

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "cd apps/gs-site && npm run build",
  "installCommand": "npm install",
  "framework": "nextjs",
  "outputDirectory": "apps/gs-site/.next",
  "crons": [
    {
      "path": "/api/cron/lifx-sunrise-tick",
      "schedule": "* 13-15 * * *"
    },
    {
      "path": "/api/cron/lifx-evening-lock",
      "schedule": "30 3 * * *"
    },
    {
      "path": "/api/cron/lifx-midnight-reset",
      "schedule": "0 7 * * *"
    },
    {
      "path": "/api/cron/mfp-daily-sync",
      "schedule": "0 20 * * *"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

**Key changes:**
1. `buildCommand`: Changed from `turbo run build` to `cd apps/gs-site && npm run build`
   - Only builds gs-site, avoiding issues with other apps
2. `outputDirectory`: Set to `apps/gs-site/.next`
   - Tells Vercel where to find the build output
3. Removed all `rewrites` and `redirects`
   - These were causing 404 errors since paths didn't exist
4. Kept only gs-site's cron jobs
   - Other apps' crons removed since they're not deployed

---

## DNS Configuration

**Registrar:** Namecheap (using registrar-servers.com nameservers)

**Records Added:**
| Type | Host | Value |
|------|------|-------|
| A | @ | 76.76.21.21 |
| A | www | 76.76.21.21 |

**Verification:**
```bash
$ dig growthadvisory.ai +short
76.76.21.21

$ dig www.growthadvisory.ai +short
76.76.21.21
```

---

## Complete File Change Summary

| File | Action | Reason |
|------|--------|--------|
| `vercel.json` | Modified | Simplified for gs-site only deployment |
| `turbo.json` | Modified | Added globalEnv for build variables |
| `apps/wabbit/next.config.js` | Modified | Disabled instrumentationHook |
| `apps/wabbit-re/next.config.js` | Modified | Disabled instrumentationHook |
| `apps/gsrealty-client/next.config.js` | Modified | Disabled instrumentationHook |
| `apps/wabbit/package.json` | Modified | Updated Next.js to 14.2.33 |
| `apps/wabbit-re/package.json` | Modified | Updated Next.js to 14.2.33 |
| `apps/wabbit-re/lib/rate-limit.ts` | Modified | Fixed Map iteration pattern |
| `apps/gsrealty-client/lib/rate-limit.ts` | Modified | Fixed Map iteration pattern |
| `apps/gsrealty-client/lib/email/resend-client.ts` | Modified | Lazy-init Resend client |
| `apps/gs-site/app/api/calllog/process/route.ts` | Modified | Fixed type casting |
| `apps/gs-site/app/api/github/search/route.ts` | Modified | Stubbed unimplemented endpoint |
| `apps/gs-site/app/api/notion/habits/update/route.ts` | Modified | Fixed to use actual exports |
| `apps/gs-site/lib/integrations/index.ts` | Modified | Fixed export list |
| `apps/wabbit/instrumentation.ts` | Deleted | dd-trace not installed |
| `apps/wabbit-re/instrumentation.ts` | Deleted | dd-trace not installed |
| `apps/gsrealty-client/instrumentation.ts` | Deleted | dd-trace not installed |
| `package-lock.json` | Regenerated | Sync with updated dependencies |

---

## Future Improvements

### To Deploy Other Apps

If you need to deploy wabbit, wabbit-re, or gsrealty-client:

**Option A: Separate Vercel Projects**
1. Create a new Vercel project for each app
2. Set the Root Directory to `apps/[app-name]`
3. Configure environment variables per project
4. Use separate domains or subdomains

**Option B: Custom Build Script**
1. Create a custom build script that builds all apps
2. Use a custom server (like Express) to route between apps
3. More complex but keeps everything in one project

### To Re-enable DataDog APM

1. Install dd-trace:
   ```bash
   cd apps/wabbit && npm install dd-trace
   ```

2. Recreate instrumentation.ts:
   ```typescript
   export async function register() {
     if (process.env.NEXT_RUNTIME === 'nodejs') {
       const { default: tracer } = await import('dd-trace');
       tracer.init({
         service: process.env.DD_SERVICE || 'wabbit',
         env: process.env.DD_ENV || 'production',
       });
     }
   }
   ```

3. Re-enable in next.config.js:
   ```javascript
   experimental: {
     instrumentationHook: true,
   }
   ```

4. Add DD_API_KEY to Vercel environment variables

---

## Verification Commands

```bash
# Check DNS resolution
dig growthadvisory.ai +short
# Expected: 76.76.21.21

# Test HTTPS
curl -sI https://growthadvisory.ai | head -5
# Expected: HTTP/2 200

# Test www redirect
curl -sI https://www.growthadvisory.ai | head -5
# Expected: HTTP/2 200

# Check Vercel domains
vercel domains ls
# Should show growthadvisory.ai and www.growthadvisory.ai

# Check deployment status
vercel ls | head -5
# Should show ● Ready for latest production deployment
```

---

## Exact Code Diffs from Session History

The following are the **exact code changes** extracted from Claude Code session `a1ede7d2-42b3-49f7-95b0-aa1788ec948b` (January 11, 2026).

### Diff 1: apps/wabbit/instrumentation.ts (then deleted)

First attempted to wrap in try/catch, then deleted entirely:

```diff
 export async function register() {
   if (process.env.NEXT_RUNTIME === 'nodejs') {
-    const { default: tracer } = await import('dd-trace');
-
-    tracer.init({
-      service: process.env.DD_SERVICE || 'wabbit',
-      env: process.env.DD_ENV || process.env.NODE_ENV || 'development',
-      version: process.env.DD_VERSION || '1.0.0',
-      logInjection: true,
-      runtimeMetrics: false,
-      profiling: false,
-      appsec: false,
-    });
+    try {
+      const { default: tracer } = await import('dd-trace');
+      tracer.init({
+        service: process.env.DD_SERVICE || 'wabbit',
+        env: process.env.DD_ENV || process.env.NODE_ENV || 'development',
+        version: process.env.DD_VERSION || '1.0.0',
+        logInjection: true,
+        runtimeMetrics: false,
+        profiling: false,
+        appsec: false,
+      });
+    } catch {
+      // dd-trace not installed - skip DataDog APM initialization
+    }
   }
 }
```

**Note**: File was ultimately **deleted** because try/catch doesn't prevent webpack from attempting to resolve the import at build time.

---

### Diff 2: apps/wabbit/next.config.js

```diff
 /** @type {import('next').NextConfig} */
 const nextConfig = {
   reactStrictMode: true,
-  experimental: {
-    instrumentationHook: true,
-  },
+  // Note: instrumentationHook disabled - dd-trace not installed
+  // Re-enable when DataDog APM is configured
```

Same change applied to `apps/wabbit-re/next.config.js` and `apps/gsrealty-client/next.config.js`.

---

### Diff 3: apps/wabbit-re/lib/rate-limit.ts

```diff
   private cleanup(): void {
     const now = Date.now()
-    for (const [key, entry] of this.store.entries()) {
+    Array.from(this.store.entries()).forEach(([key, entry]) => {
       if (entry.resetTime < now) {
         this.store.delete(key)
       }
-    }
+    })
   }
```

Same change applied to `apps/gsrealty-client/lib/rate-limit.ts`.

---

### Diff 4: apps/gs-site/lib/integrations/index.ts

```diff
 // Warning test utilities
 export {
-  WARNING_TESTS,
-  TILE_WARNING_MAP,
-  getWarningTestForTile,
   shouldShowWarning,
-  checkWarningsForTiles,
-  getTilesWithWarnings,
+  registerWarningTest,
+  unregisterWarningTest,
 } from './warning-tests';
```

---

### Diff 5: turbo.json

```diff
 {
   "$schema": "https://turbo.build/schema.json",
   "globalDependencies": ["**/.env.*local"],
+  "globalEnv": [
+    "NEXT_PUBLIC_SUPABASE_URL",
+    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
+    "SUPABASE_SERVICE_ROLE_KEY",
+    "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
+    "OPENAI_API_KEY",
+    "RESEND_API_KEY",
+    "EMAIL_FROM",
+    "CRON_SECRET",
+    "NOTION_API_KEY",
+    "NOTION_HABITS_DATABASE_ID",
+    "NOTION_TASKS_DATABASE_ID",
+    "GITHUB_ACCESS_TOKEN",
+    "GOOGLE_CLIENT_ID",
+    "GOOGLE_CLIENT_SECRET"
+  ],
   "tasks": {
```

---

### Diff 6: apps/gsrealty-client/lib/email/resend-client.ts

```diff
 import { Resend } from 'resend';
-import { InvitationEmail } from './templates/invitation';
-import { PasswordResetEmail } from './templates/password-reset';
-import { WelcomeEmail } from './templates/welcome';

-// Initialize Resend client
-const resend = new Resend(process.env.RESEND_API_KEY);
+// Lazy-initialize Resend client to avoid build-time errors
+let resendClient: Resend | null = null;

-// Default sender email
-const DEFAULT_FROM = process.env.RESEND_FROM_EMAIL || 'no-reply@gsrealty.com';
+function getResendClient(): Resend {
+  if (!resendClient) {
+    resendClient = new Resend(process.env.RESEND_API_KEY);
+  }
+  return resendClient;
+}

-// Email configuration
-const EMAIL_CONFIG = {
-  from: DEFAULT_FROM,
-  replyTo: process.env.RESEND_REPLY_TO_EMAIL || DEFAULT_FROM,
-};
+function getEmailConfig() {
+  return {
+    from: process.env.RESEND_FROM_EMAIL || 'no-reply@gsrealty.com',
+    replyTo: process.env.RESEND_REPLY_TO_EMAIL || process.env.RESEND_FROM_EMAIL || 'no-reply@gsrealty.com',
+  };
+}
```

---

### Diff 7: apps/gs-site/app/api/notion/habits/update/route.ts (complete rewrite)

**Before** (non-functional - used non-existent imports):
```typescript
import { NextResponse } from 'next/server';
import { getTodaysRecord, createDailyRecord, ... } from '@/lib/notion/habits';
// ... used functions that didn't exist
```

**After** (working - uses actual exports):
```typescript
import { NextResponse } from 'next/server';
import { isHabitsDatabaseConfigured, updateHabitForToday } from '@/lib/notion/habits';

export async function POST(request: Request) {
  try {
    if (!isHabitsDatabaseConfigured()) {
      return NextResponse.json(
        { error: 'Habits database not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { habit, completed } = body;

    if (typeof habit !== 'string' || habit.trim() === '') {
      return NextResponse.json(
        { error: 'Habit name is required' },
        { status: 400 }
      );
    }

    if (typeof completed !== 'boolean') {
      return NextResponse.json(
        { error: 'Completed must be a boolean' },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const success = await updateHabitForToday(habit as any, completed);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update habit - check server logs' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      habit,
      completed,
    });
  } catch (error) {
    console.error('Error updating habit:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update habit' },
      { status: 500 }
    );
  }
}
```

---

### Diff 8: vercel.json (complete rewrite)

**Before** (complex multi-app routing that didn't work):
```json
{
  "rewrites": [
    { "source": "/wabbit-re/:path*", "destination": "/apps/wabbit-re/:path*" },
    { "source": "/wabbit/:path*", "destination": "/apps/wabbit/:path*" },
    ...
  ],
  "redirects": [
    {
      "source": "/",
      "destination": "/private/gs-site",
      "has": [{ "type": "host", "value": "growthadvisory.ai" }]
    }
  ]
}
```

**After** (simplified gs-site only):
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "cd apps/gs-site && npm run build",
  "installCommand": "npm install",
  "framework": "nextjs",
  "outputDirectory": "apps/gs-site/.next",
  "crons": [
    { "path": "/api/cron/lifx-sunrise-tick", "schedule": "* 13-15 * * *" },
    { "path": "/api/cron/lifx-evening-lock", "schedule": "30 3 * * *" },
    { "path": "/api/cron/lifx-midnight-reset", "schedule": "0 7 * * *" },
    { "path": "/api/cron/mfp-daily-sync", "schedule": "0 20 * * *" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

---

## Session Metadata

| Field | Value |
|-------|-------|
| Session ID | `a1ede7d2-42b3-49f7-95b0-aa1788ec948b` |
| Date | January 11, 2026 |
| Session Title | Vercel MCP Setup for Domain Configuration |
| Total Edits | 24 tool calls (Edit + Write) |
| Files Modified | 14 unique files |
| Files Deleted | 3 (instrumentation.ts files) |

---

## Related Documentation

- [Vercel Deployment Status](./docs/deployment/VERCEL_DEPLOYMENT_STATUS.md)
- [Domain Setup Guide](./docs/deployment/GROWTHADVISORY_DOMAIN_SETUP.md)
- [Vercel Domains Docs](https://vercel.com/docs/projects/domains)
- [Turborepo Environment Variables](https://turborepo.com/docs/crafting-your-repository/using-environment-variables)
