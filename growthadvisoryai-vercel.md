# growthadvisory.ai Vercel Deployment

> Last Updated: January 11, 2025
> Status: **Code Complete** - Pending Vercel Dashboard Configuration

---

## Quick Status

| Phase | Status |
|-------|--------|
| Code Configuration | ✅ Complete |
| Vercel Dashboard Setup | ⏳ Pending |
| DNS Configuration | ⏳ Pending |
| OAuth Updates | ⏳ Pending |
| Testing & Verification | ⏳ Pending |

---

## Target URL Structure

| URL | App | Description |
|-----|-----|-------------|
| `growthadvisory.ai/` | - | Redirects to `/private/gs-site` |
| `growthadvisory.ai/private/gs-site` | gs-site | Personal dashboard |
| `growthadvisory.ai/private/realty-admin` | gsrealty-client | Realty CRM admin |

---

## Progress Checklist

### Phase 1: Code Configuration ✅

- [x] Update `apps/gs-site/next.config.js`
  - Added `DEPLOY_TARGET` env var support
  - basePath = `/private/gs-site` when `DEPLOY_TARGET=growthadvisory`

- [x] Update `apps/gsrealty-client/next.config.js`
  - Added `DEPLOY_TARGET` env var support
  - basePath = `/private/realty-admin` when `DEPLOY_TARGET=growthadvisory`

- [x] Update root `vercel.json`
  - Added domain-conditional rewrites for growthadvisory.ai
  - Added redirects: `/` → `/private/gs-site`
  - Added redirects: `/private` → `/private/gs-site`

- [x] Add gs-site crons to root `vercel.json`
  - LIFX sunrise tick
  - LIFX evening lock
  - LIFX midnight reset
  - MFP daily sync

- [x] Create documentation
  - `docs/deployment/GROWTHADVISORY_DOMAIN_SETUP.md`

### Phase 2: Vercel Dashboard Setup ⏳

- [ ] Add domain in Vercel Dashboard
  1. Go to https://vercel.com/odgsullys-projects/wabbit-property-scraping
  2. Settings → Domains → Add Domain
  3. Enter `growthadvisory.ai`
  4. Note the DNS configuration instructions

- [ ] (Optional) Add `www.growthadvisory.ai` subdomain

### Phase 3: DNS Configuration ⏳

- [ ] Configure DNS in Cloudflare (or your DNS provider)

  **Option A: CNAME (Recommended for Cloudflare)**
  | Type | Name | Content | Proxy |
  |------|------|---------|-------|
  | CNAME | @ | cname.vercel-dns.com | Proxied |
  | CNAME | www | cname.vercel-dns.com | Proxied |

  **Option B: A Record (If CNAME not supported for root)**
  | Type | Name | Content |
  |------|------|---------|
  | A | @ | 76.76.21.21 |
  | CNAME | www | cname.vercel-dns.com |

- [ ] Wait for DNS propagation (up to 48 hours, usually minutes)
- [ ] Verify SSL certificate is issued (automatic via Vercel)

### Phase 4: Deploy ⏳

- [ ] Deploy to production
  ```bash
  cd /Users/garrettsullivan/Desktop/AUTOMATE/Vibe\ Code/Wabbit/clients/sullivan_realestate/Actual
  vercel --prod
  ```

- [ ] Verify deployment in Vercel Dashboard

### Phase 5: OAuth Updates ⏳

- [ ] Update Google Cloud Console (if using Google OAuth)
  1. Go to https://console.cloud.google.com/apis/credentials
  2. Select your OAuth 2.0 Client
  3. Add authorized redirect URIs:
     - `https://growthadvisory.ai/private/gs-site/api/auth/google/callback`

- [ ] Update any other OAuth providers as needed

### Phase 6: Testing & Verification ⏳

- [ ] Test root redirect
  ```bash
  curl -I https://growthadvisory.ai/
  # Should redirect to /private/gs-site
  ```

- [ ] Test gs-site access
  ```bash
  curl -I https://growthadvisory.ai/private/gs-site
  # Should return 200
  ```

- [ ] Test realty-admin access
  ```bash
  curl -I https://growthadvisory.ai/private/realty-admin
  # Should return 200
  ```

- [ ] Test gs-site functionality
  - [ ] Dashboard loads correctly
  - [ ] Tiles render properly
  - [ ] Navigation works
  - [ ] OAuth login works (if configured)

- [ ] Test realty-admin functionality
  - [ ] CRM loads correctly
  - [ ] Client list works
  - [ ] Forms work
  - [ ] File uploads work

- [ ] Verify cron jobs running
  - Check Vercel Dashboard → Functions → Cron

---

## Files Modified

| File | Change |
|------|--------|
| `vercel.json` | Added growthadvisory.ai rewrites/redirects |
| `apps/gs-site/next.config.js` | Added DEPLOY_TARGET basePath logic |
| `apps/gsrealty-client/next.config.js` | Added DEPLOY_TARGET basePath logic |
| `docs/deployment/GROWTHADVISORY_DOMAIN_SETUP.md` | Created setup documentation |

---

## Architecture

```
                    growthadvisory.ai
                          │
                          ▼
                   ┌──────────────┐
                   │   Vercel     │
                   │   Edge       │
                   └──────────────┘
                          │
            ┌─────────────┼─────────────┐
            │             │             │
            ▼             ▼             ▼
      /private/      /private/         /
      gs-site/*    realty-admin/*   (redirect)
            │             │             │
            ▼             ▼             │
      ┌──────────┐ ┌──────────────┐    │
      │ gs-site  │ │gsrealty-client│   │
      │   app    │ │     app      │    │
      └──────────┘ └──────────────┘    │
                                       ▼
                              /private/gs-site
```

---

## Existing Domain (Unchanged)

The existing deployment continues to work:

| Domain | Path | App |
|--------|------|-----|
| wabbit-property-scraping.vercel.app | `/` | gs-site |
| wabbit-property-scraping.vercel.app | `/wabbit-re/*` | wabbit-re |
| wabbit-property-scraping.vercel.app | `/wabbit/*` | wabbit |
| wabbit-property-scraping.vercel.app | `/gsrealty/*` | gsrealty-client |

---

## Troubleshooting

### Domain not resolving
```bash
# Check DNS
dig growthadvisory.ai

# Should show Vercel IP or CNAME
```

### 404 errors on paths
- Redeploy: `vercel --prod`
- Check vercel.json rewrites are correct
- Verify domain is connected in Vercel Dashboard

### SSL certificate not issued
- Wait for DNS to propagate
- Check domain ownership verification in Vercel

### OAuth callback fails
- Verify redirect URI matches exactly
- Include the full path with basePath

---

## Next Steps (In Order)

1. **Add domain in Vercel Dashboard** ← START HERE
2. Configure DNS in Cloudflare
3. Wait for DNS propagation
4. Deploy with `vercel --prod`
5. Test all endpoints
6. Update OAuth redirect URIs
7. Full functionality test

---

## Related Documentation

- [Vercel Deployment Status](./docs/deployment/VERCEL_DEPLOYMENT_STATUS.md)
- [Domain Setup Guide](./docs/deployment/GROWTHADVISORY_DOMAIN_SETUP.md)
- [Vercel Domains Docs](https://vercel.com/docs/projects/domains)
