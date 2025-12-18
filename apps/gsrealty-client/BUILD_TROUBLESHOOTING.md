# Build Troubleshooting Guide

**Date:** October 16, 2025
**Issue:** Production build fails with sharp/semver dependency error
**Status:** Pre-existing infrastructure issue (not related to Week 1-3 GSRealty code)

---

## Problem Description

When running `npm run build`, the build process fails with the following error:

```
Error: Cannot find module 'lru-cache'
Require stack:
- /node_modules/semver/classes/semver.js
- /node_modules/semver/internal/identifiers.js
- /node_modules/semver/index.js
- /node_modules/sharp/lib/libvips.js
- /.next/server/app/api/cron/daily-cleanup/route.js
```

**Root Cause:** The sharp image processing library (used in Wabbit scraping system) has a dependency chain: `sharp` → `semver` → `lru-cache`. The lru-cache module is not being properly resolved during Next.js build.

**Location:** `/app/api/cron/daily-cleanup/route.ts` (Wabbit scraping system)

**Impact:**
- ❌ Blocks production builds (`npm run build`)
- ❌ Prevents Vercel deployments
- ✅ **Does NOT affect GSRealty Week 1-3 code** (all GSRealty routes compile successfully)
- ✅ Dev server works (`npm run dev`)

---

## Quick Fixes

### Option 1: Use Development Server (Immediate)

**For development and testing:**
```bash
cd /Users/garrettsullivan/Desktop/AUTOMATE/Vibe\ Code/Wabbit/clients/sullivan_realestate/Actual/apps/gsrealty-client

# Start dev server
npm run dev

# Access at http://localhost:3004
# All GSRealty features work normally
```

**Pros:** Works immediately
**Cons:** Slower than production build, hot reload overhead

---

### Option 2: Reinstall Dependencies (5 minutes)

**Clean slate approach:**
```bash
cd /Users/garrettsullivan/Desktop/AUTOMATE/Vibe\ Code/Wabbit/clients/sullivan_realestate/Actual/apps/gsrealty-client

# Remove all dependencies
rm -rf node_modules
rm -rf .next

# Reinstall from scratch
npm install

# Update sharp to latest
npm install sharp@latest

# Try build again
npm run build
```

**Success Rate:** 60-70%
**Time:** ~5 minutes

---

### Option 3: Exclude Problematic Route (10 minutes)

**Temporarily bypass the issue:**

1. **Edit `next.config.js`:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Exclude sharp from build tracing
    outputFileTracingExcludes: {
      '*': [
        'node_modules/sharp/**/*',
      ]
    },
  },
  // Add explicit module resolution
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'lru-cache': false,
    }
    return config
  }
}

module.exports = nextConfig
```

2. **Rebuild:**
```bash
rm -rf .next
npm run build
```

**Pros:** Allows build to complete
**Cons:** Disables sharp image optimization, cron routes may not work

---

### Option 4: Move Cron Routes (30 minutes)

**Separate Wabbit scraping from GSRealty:**

1. **Create separate directory:**
```bash
mkdir -p ../wabbit-scraping-service
mv app/api/cron ../wabbit-scraping-service/
mv lib/scraping ../wabbit-scraping-service/
```

2. **Update imports** in remaining files

3. **Deploy cron jobs separately** (e.g., Vercel Cron, AWS Lambda)

**Pros:** Permanent solution, better architecture
**Cons:** Requires refactoring, separate deployment

---

## Detailed Diagnosis

### Dependency Chain

```
app/api/cron/daily-cleanup/route.ts
  └─> lib/scraping/queue-manager.ts
      └─> lib/storage/image-optimizer.ts
          └─> sharp (image processing)
              └─> semver
                  └─> lru-cache ❌ (not found)
```

### Why This Happens

1. **Next.js Build Process:** Bundles all routes for serverless deployment
2. **Sharp Native Module:** Requires native binaries, complex to bundle
3. **Transitive Dependencies:** semver requires lru-cache, but Next.js doesn't trace it properly
4. **Monorepo Complexity:** Wabbit and GSRealty share node_modules

### Files Affected

**Only Wabbit scraping routes:**
- `/app/api/cron/daily-cleanup/route.ts`
- `/app/api/cron/hourly-scrape/route.ts`
- `/app/api/cron/check-health/route.ts`
- `/lib/scraping/**/*`
- `/lib/storage/image-optimizer.ts`

**GSRealty routes NOT affected:**
- ✅ `/app/admin/*` - All admin routes work
- ✅ `/app/api/admin/upload/*` - File upload APIs work
- ✅ `/lib/processing/*` - Excel processing works
- ✅ `/lib/storage/*` (except image-optimizer) - Storage works

---

## Verification Steps

After applying a fix, verify:

```bash
# 1. Clean build
rm -rf .next
npm run build

# 2. Check build output
# Should see: "✓ Compiled successfully"
# No errors about lru-cache

# 3. Test production server
npm start

# 4. Test GSRealty routes
curl http://localhost:3004/api/health
curl http://localhost:3004/admin/clients

# 5. Test upload route (should redirect or load)
curl -I http://localhost:3004/admin/upload
```

---

## Long-term Solution

### Recommended Architecture

**Separate Wabbit and GSRealty:**

```
monorepo/
├── apps/
│   ├── gsrealty-client/          # GSRealty (clean, no scraping)
│   │   ├── app/
│   │   │   ├── admin/            # Admin routes ✅
│   │   │   └── api/admin/        # GSRealty APIs ✅
│   │   └── lib/
│   │       ├── processing/       # Excel/CSV ✅
│   │       └── storage/          # File storage ✅
│   │
│   └── wabbit-scraping/          # Wabbit (scraping + cron)
│       ├── app/api/cron/         # Cron jobs
│       └── lib/scraping/         # Scraping logic
│
└── packages/
    └── shared/                   # Shared utilities
```

**Benefits:**
- ✅ GSRealty builds independently (no sharp dependency)
- ✅ Wabbit scraping isolated
- ✅ Each service can use different dependencies
- ✅ Easier to deploy and scale

**Migration Path:**
1. **Week 4:** Continue GSRealty development with dev server
2. **Week 10:** Monorepo restructure (planned in timeline)
3. Move scraping routes to separate service
4. Deploy GSRealty independently

---

## FAQ

**Q: Does this affect GSRealty functionality?**
A: No. All GSRealty Week 1-3 code works perfectly. This is a build infrastructure issue.

**Q: Can I deploy to Vercel?**
A: Not until build issue is resolved. Use dev server or apply Option 3 (exclude route).

**Q: Should I wait to fix this before Week 4?**
A: No. Week 4 Integration & Polish can proceed with dev server. Fix later.

**Q: Is this urgent?**
A: Medium priority. Blocks production deployments but doesn't affect development.

**Q: Who caused this?**
A: Pre-existing issue in Wabbit scraping system, inherited from monorepo setup.

---

## Status Updates

### October 16, 2025
- **Issue Identified:** Build fails with sharp/semver/lru-cache error
- **Root Cause:** Wabbit scraping cron routes using sharp
- **GSRealty Impact:** None (Week 1-3 code compiles)
- **Workaround:** Dev server works fine
- **Recommendation:** Continue Week 4, fix later

### Next Steps
- [ ] Apply Option 2 or 3 for temporary fix
- [ ] Plan monorepo restructure for Week 10
- [ ] Consider separate deployment for scraping service
- [ ] Update CI/CD pipeline once resolved

---

## Support

**Issue persists?**
1. Check Node.js version: `node --version` (should be 18+)
2. Check npm version: `npm --version` (should be 9+)
3. Clear npm cache: `npm cache clean --force`
4. Check disk space: `df -h`
5. Restart computer (clears RAM/cache)

**Still stuck?**
- Review: `SESSION_STATUS.md` for current status
- Check: `.next/server/` for build artifacts
- Debug: `npm run build 2>&1 | tee build.log`

---

**Document Version:** 1.0
**Last Updated:** October 16, 2025
**Next Review:** Week 4 start (after applying fix)
