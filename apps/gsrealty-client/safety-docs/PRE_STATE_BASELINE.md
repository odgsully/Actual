# Pre-GSRealty Baseline State

**Date**: October 14, 2025
**Purpose**: Document wabbit-re state BEFORE gsrealty work begins

---

## Build Status (BEFORE GSRealty)

### Wabbit-RE Build
**Status**: ⚠️ TIMEOUT (Pre-existing issue)
**Error**: Static worker timeout during page data collection
**Cause**: Property data fetching during static generation
**Impact**: This is NOT caused by gsrealty - exists before gsrealty created

**Note**: This timeout also affected gsrealty-client build since it was forked from wabbit-re. Both apps have the same static generation issue.

### Build Command Tested
```bash
npm run build:wabbit-re
```

**Result**: Exit code 1 (timeout after 60 seconds)

---

## Current Apps in Monorepo (BEFORE GSRealty)

1. **apps/wabbit-re/** - Real estate ranking platform
2. **apps/wabbit/** - General ranking platform
3. **apps/gs-site/** - Personal dashboard

**Total**: 3 apps

**After GSRealty**: Will be 4 apps

---

## Directory Structure (BEFORE GSRealty)

```
apps/
├── gs-site/
├── wabbit/
└── wabbit-re/

packages/
├── supabase/
├── ui/
└── utils/
```

---

## Package.json Scripts (BEFORE GSRealty)

```json
{
  "dev:wabbit-re": "turbo run dev --filter=wabbit-re",
  "dev:wabbit": "turbo run dev --filter=wabbit",
  "dev:crm": "turbo run dev --filter=crm",
  "dev:dashboard": "turbo run dev --filter=gs-site-dashboard",
  "build:wabbit-re": "turbo run build --filter=wabbit-re",
  "build:wabbit": "turbo run build --filter=wabbit",
  "build:crm": "turbo run build --filter=crm",
  "build:dashboard": "turbo run build --filter=gs-site-dashboard"
}
```

**No gsrealty scripts yet**

---

## Vercel.json (BEFORE GSRealty)

```json
{
  "rewrites": [
    { "source": "/wabbit-re/:path*", ... },
    { "source": "/wabbit/:path*", ... },
    { "source": "/crm/:path*", ... }
  ]
}
```

**No /gsrealty route yet**

---

## Environment Variables (BEFORE GSRealty)

**Location**: `.env.local` (root)

**Variables Present** (redacted):
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- NEXT_PUBLIC_APP_URL
- NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
- OPENAI_API_KEY
- CRON_SECRET

**No GSREALTY_* variables yet**

---

## Shared Packages State (BEFORE GSRealty)

### packages/supabase/
- client.ts
- server.ts
- types.ts
- middleware.ts

### packages/ui/
- Basic UI component structure

### packages/utils/
- Basic utility structure

**Note**: These should NOT be modified during gsrealty development

---

## Known Issues (PRE-EXISTING)

1. **Build Timeout**: Both wabbit-re and wabbit have static generation timeouts
   - Not blocking development
   - Doesn't affect dev server
   - Can be fixed later by disabling static generation for data-fetching pages

2. **No Impact from GSRealty**: Since gsrealty hasn't been built yet, any issues documented here are pre-existing

---

## Safety Baseline Established

✅ **Pre-state documented**
✅ **Build issues noted (pre-existing)**
✅ **No gsrealty impact yet**
✅ **Ready to proceed with safety checks**

---

## Next Steps

1. Document Supabase database state
2. List all existing tables
3. Create rollback scripts
4. Proceed to Phase 1 with caution

**Principle**: Any NEW issues after this point must be investigated as potentially gsrealty-related.
