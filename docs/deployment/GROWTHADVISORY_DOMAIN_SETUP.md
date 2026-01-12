# growthadvisory.ai Domain Setup

> Last Updated: January 2025

## Overview

This document describes how to set up the `growthadvisory.ai` domain to serve:
- **gs-site** at `/private/gs-site`
- **gsrealty-client** at `/private/realty-admin`

## URL Structure

| Domain | Path | App |
|--------|------|-----|
| growthadvisory.ai | `/private/gs-site` | gs-site (dashboard) |
| growthadvisory.ai | `/private/realty-admin` | gsrealty-client (CRM) |
| growthadvisory.ai | `/` | Redirects to `/private/gs-site` |
| growthadvisory.ai | `/private` | Redirects to `/private/gs-site` |

## Configuration Files Modified

### 1. Root `vercel.json`
Added domain-conditional rewrites and redirects:
- `/private/gs-site/*` → gs-site app (when host = growthadvisory.ai)
- `/private/realty-admin/*` → gsrealty-client app (when host = growthadvisory.ai)
- Root redirect to `/private/gs-site` (when host = growthadvisory.ai)

### 2. `apps/gs-site/next.config.js`
Added `DEPLOY_TARGET` environment variable support:
- `DEPLOY_TARGET=growthadvisory` → basePath = `/private/gs-site`
- Default → basePath = `` (root)

### 3. `apps/gsrealty-client/next.config.js`
Added `DEPLOY_TARGET` environment variable support:
- `DEPLOY_TARGET=growthadvisory` → basePath = `/private/realty-admin`
- Default → basePath = `/gsrealty`

## Vercel Dashboard Setup

### Step 1: Add Domain

1. Go to [Vercel Dashboard](https://vercel.com/odgsullys-projects/wabbit-property-scraping)
2. Navigate to **Settings** → **Domains**
3. Click **Add Domain**
4. Enter `growthadvisory.ai`
5. Follow DNS configuration instructions

### Step 2: DNS Configuration (Cloudflare)

Add these records in Cloudflare for `growthadvisory.ai`:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| CNAME | @ | cname.vercel-dns.com | Proxied |
| CNAME | www | cname.vercel-dns.com | Proxied |

Or if using Vercel nameservers:
- Update nameservers to Vercel's (shown in Vercel Dashboard)

### Step 3: Environment Variables (Optional)

If you need separate builds for growthadvisory.ai with different basePaths:

1. Go to **Settings** → **Environment Variables**
2. Add `DEPLOY_TARGET` = `growthadvisory`
3. Set scope to **Production** only

**Note**: With the current rewrite-based setup, separate environment variables may not be needed since Vercel handles the routing at the edge.

### Step 4: Deploy

```bash
vercel --prod
```

Or push to the main branch for automatic deployment.

## Testing

After deployment, verify:

```bash
# Test gs-site at new path
curl -I https://growthadvisory.ai/private/gs-site

# Test realty-admin at new path
curl -I https://growthadvisory.ai/private/realty-admin

# Test root redirect
curl -I https://growthadvisory.ai/

# Test /private redirect
curl -I https://growthadvisory.ai/private
```

## OAuth Callback Updates

If using Google OAuth or other OAuth providers, add new redirect URIs:

### Google Cloud Console
Add these authorized redirect URIs:
- `https://growthadvisory.ai/private/gs-site/api/auth/google/callback`
- `https://growthadvisory.ai/private/realty-admin/api/auth/callback` (if applicable)

## Cron Jobs

The gs-site cron jobs are configured in the root `vercel.json`:
- `/api/cron/lifx-sunrise-tick` - Every minute 13:00-15:59 UTC
- `/api/cron/lifx-evening-lock` - Daily at 03:30 UTC
- `/api/cron/lifx-midnight-reset` - Daily at 07:00 UTC
- `/api/cron/mfp-daily-sync` - Daily at 20:00 UTC

**Note**: Cron jobs run on all domains. The gs-site crons use root paths (`/api/cron/*`) since gs-site is the root app on the main deployment.

## Troubleshooting

### Issue: 404 on growthadvisory.ai paths
- Verify domain is properly connected in Vercel Dashboard
- Check DNS propagation: `dig growthadvisory.ai`
- Redeploy: `vercel --prod`

### Issue: Assets not loading (CSS/JS)
- Check that `assetPrefix` matches `basePath` in next.config.js
- Verify the app was built with correct environment variables

### Issue: OAuth callback fails
- Update redirect URIs in OAuth provider settings
- Ensure callback path matches the app's basePath

### Issue: Internal links broken
- Ensure `NEXT_PUBLIC_BASE_PATH` is set correctly
- Use Next.js `Link` component (automatically handles basePath)
- For manual URLs, use `process.env.NEXT_PUBLIC_BASE_PATH`

## Architecture Notes

This setup uses **Vercel rewrites with host conditions** to route requests based on the incoming domain. This allows:

1. **Single deployment** serving multiple domains
2. **Different URL structures** per domain
3. **No separate builds required** (rewrites happen at edge)

The apps are built once and Vercel's edge network handles the routing.

## Related Documentation

- [Vercel Deployment Status](./VERCEL_DEPLOYMENT_STATUS.md)
- [Root vercel.json](/vercel.json)
- [gs-site next.config.js](/apps/gs-site/next.config.js)
- [gsrealty-client next.config.js](/apps/gsrealty-client/next.config.js)
