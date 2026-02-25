# Plaid Account Setup & Access Tiers

> **Status:** Sandbox Access Only
> **Last Updated:** February 24, 2026
> **Dashboard:** https://dashboard.plaid.com/
> **Related:** [PLAID_INTEGRATION.md](./PLAID_INTEGRATION.md) (technical implementation plan)

---

## Current Status

| Item | Status |
|------|--------|
| Plaid Dashboard Account | Created |
| Client ID | Available (Dashboard → Developers → Keys) |
| Sandbox Secret | Available |
| Production Secret | Not available (not yet approved) |
| Vercel Env Vars | None configured |
| Supabase Tables | Not yet created |
| Code Implementation | Complete (lib, API routes, hooks, components) |

---

## Plaid Access Tiers

Plaid has three environments. Each requires progressively more approval.

### Tier 1: Sandbox (Current)

| Detail | Value |
|--------|-------|
| **Access** | Instant on signup |
| **Cost** | Free |
| **Data** | Fake test data only |
| **Real Banks** | No — uses Plaid test institutions |
| **API Calls** | Unlimited |
| **Use Case** | Development, testing flows, verifying code works |

**What you can do:**
- Test the full Link → token exchange → sync flow
- Use test credentials (user_good / pass_good)
- Verify category mapping, encryption, webhook handling
- No real bank connections possible

**Credentials available:**
- `PLAID_CLIENT_ID` — same across all environments
- `PLAID_SECRET` — sandbox-specific secret from Dashboard

---

### Tier 2: Limited Production

| Detail | Value |
|--------|-------|
| **Access** | Request via Dashboard (self-service) |
| **Cost** | Free (capped API calls) |
| **Data** | Real bank data |
| **Real Banks** | Yes — connect actual FirstBank, Discover, etc. |
| **API Calls** | Limited (sufficient for personal use) |
| **Use Case** | Testing with real accounts before full production |

**What you can do:**
- Connect real bank accounts (FirstBank CO, Discover)
- Pull actual transaction data
- Validate category mapping against real transactions
- Test re-auth flows with real institutions
- Operate indefinitely for personal/low-volume use

**This is likely sufficient for GS Site** since we're only connecting 2 personal accounts (FirstBank + Discover). Limited Production may be all that's needed — no need for full production unless Plaid caps are too restrictive.

**How to request:**
1. Log into https://dashboard.plaid.com/
2. Look for "Test with Real Data" or "Request Limited Production"
3. Complete the Application Profile and Company Profile
4. Submit — typically approved quickly (self-service)

---

### Tier 3: Full Production

| Detail | Value |
|--------|-------|
| **Access** | Application + security questionnaire review |
| **Cost** | Paid per API call (~$10-20/month for 2 items) |
| **Data** | Real bank data |
| **Real Banks** | Yes — all supported institutions |
| **API Calls** | Unlimited (paid) |
| **Use Case** | Production apps serving multiple users |

**When you need this:**
- Serving external users (not just personal accounts)
- Need guaranteed uptime SLAs
- Need webhook support in production
- Hit Limited Production API caps

**How to request:**
1. Complete Application Profile in Dashboard
2. Complete Company Profile in Dashboard
3. Submit Security Questionnaire (this is the main gate)
4. Wait for Plaid review (days to weeks)
5. Contact account manager to expedite if needed

**Security Questionnaire covers:**
- How access tokens are stored (we use AES-256-GCM encryption)
- Data handling practices
- Application architecture
- User authentication methods

---

## Personal API Usage vs Application Production

This is an important distinction:

| | Personal Use | Application Production |
|---|---|---|
| **Who connects** | You (the developer) only | Multiple end users |
| **Accounts** | 1-3 personal bank accounts | Many users' bank accounts |
| **Tier needed** | Limited Production (free) | Full Production (paid) |
| **Approval** | Self-service, quick | Security review required |
| **Cost** | Free or minimal | Per-item/per-call pricing |
| **Compliance** | Minimal | SOC 2, data handling policies |

**For GS Site:** This is personal use — connecting your own FirstBank and Discover accounts to your own dashboard. **Limited Production should be sufficient.** You don't need full production approval unless you plan to let other users connect their banks.

---

## Step-by-Step: Sandbox to Production

### Phase A: Sandbox Testing (NOW)

**Goal:** Verify the full integration works with test data.

- [ ] Add Sandbox env vars to Vercel (see Env Vars section below)
- [ ] Redeploy gs-site
- [ ] Open Budget tile → Connected Accounts tab
- [ ] Click "Link Account" → use Plaid test institution
- [ ] Test credentials: `user_good` / `pass_good`
- [ ] Verify token exchange completes
- [ ] Verify transactions sync to `budget_entries`
- [ ] Verify category mapping works
- [ ] Test manual "Sync Now" button
- [ ] Test unlink flow

### Phase B: Limited Production (NEXT)

**Goal:** Connect real bank accounts with free tier.

- [ ] Request Limited Production access in Plaid Dashboard
- [ ] Complete Application Profile
- [ ] Complete Company Profile
- [ ] Wait for approval (typically quick)
- [ ] Update `PLAID_ENV` to `production` in Vercel
- [ ] Update `PLAID_SECRET` to production secret in Vercel
- [ ] Set `PLAID_WEBHOOK_URL` to `https://pickleballisapsyop.com/api/plaid/webhook`
- [ ] Create Supabase tables (see PLAID_INTEGRATION.md Phase 2)
- [ ] Connect FirstBank Colorado (real account)
- [ ] Connect Discover (real account)
- [ ] Verify real transactions import correctly
- [ ] Verify category mapping accuracy with real data
- [ ] Confirm daily cron sync works (6 AM UTC)

### Phase C: Full Production (IF NEEDED)

**Goal:** Remove API caps, enable webhooks, get production SLA.

- [ ] Submit Security Questionnaire in Dashboard
- [ ] Prepare answers:
  - Token storage: AES-256-GCM encrypted in Supabase
  - Auth: Supabase auth (Row Level Security)
  - Data retention: Transactions stored in budget_entries, raw Plaid data not retained
  - Webhook endpoint: HTTPS with signature verification
- [ ] Wait for Plaid security review
- [ ] Update production secret if it changes
- [ ] Configure webhook URL in Plaid Dashboard
- [ ] Verify webhook events are received and processed
- [ ] Monitor via Plaid Dashboard Activity Log

---

## Environment Variables

### Required for All Tiers

| Variable | Value | Where to Find |
|----------|-------|---------------|
| `PLAID_CLIENT_ID` | Your client ID | Dashboard → Developers → Keys |
| `PLAID_SECRET` | Environment-specific secret | Dashboard → Developers → Keys |
| `PLAID_ENV` | `sandbox`, or `production` | Set based on current tier |
| `PLAID_ENCRYPTION_KEY` | 64 hex characters | Generate: `openssl rand -hex 32` |

### Optional

| Variable | Value | When Needed |
|----------|-------|-------------|
| `PLAID_WEBHOOK_URL` | `https://pickleballisapsyop.com/api/plaid/webhook` | Production with webhooks |
| `NEXT_PUBLIC_PLAID_ENV` | Same as PLAID_ENV | If frontend needs to know env |

### Vercel Deployment Status (Feb 24, 2026)

**None of the Plaid env vars are currently configured in Vercel.**

To add them:
```bash
cd apps/gs-site
vercel env add PLAID_CLIENT_ID        # All environments
vercel env add PLAID_SECRET           # Sandbox secret for now
vercel env add PLAID_ENV              # "sandbox"
vercel env add PLAID_ENCRYPTION_KEY   # Output of: openssl rand -hex 32
```

---

## Supabase Tables Required

These tables must be created before Plaid can function. See `PLAID_INTEGRATION.md` Phase 2 for full SQL, or summary:

| Table | Purpose | Status |
|-------|---------|--------|
| `plaid_items` | Stores encrypted access tokens per bank connection | Not created |
| `plaid_accounts` | Individual bank accounts within each connection | Not created |
| `plaid_sync_cursors` | Cursor state for incremental transaction sync | Not created |
| `budget_entries` | Synced transactions (shared with manual imports) | Check if exists |
| `budget_accounts` | Budget account definitions | Check if exists |
| `budget_categories` | Category definitions for mapping | Check if exists |

---

## Code Implementation Status

All code is implemented and ready. No additional development needed to start testing.

| Component | Location | Status |
|-----------|----------|--------|
| Plaid client | `lib/plaid/client.ts` | Complete |
| Token encryption | `lib/plaid/tokens.ts` | Complete |
| Transaction sync | `lib/plaid/sync.ts` | Complete |
| Category mapping | `lib/plaid/categories.ts` | Complete |
| Types | `lib/plaid/types.ts` | Complete |
| Create link token API | `app/api/plaid/create-link-token/route.ts` | Complete |
| Exchange token API | `app/api/plaid/exchange-token/route.ts` | Complete |
| Accounts API | `app/api/plaid/accounts/route.ts` | Complete |
| Sync API | `app/api/plaid/sync/route.ts` | Complete |
| Unlink API | `app/api/plaid/unlink/route.ts` | Complete |
| Webhook API | `app/api/plaid/webhook/route.ts` | Complete |
| React hooks | `hooks/usePlaid.ts` | Complete |
| Budget tile integration | `components/budget/BudgetTile.tsx` | Complete |
| Daily cron job | `vercel.json` (0 6 * * *) | Configured |

---

## Important Notes

1. **Development environment was deprecated** by Plaid in June 2024. The path is now Sandbox → Production (with Limited Production as an intermediate free tier).

2. **Limited Production is likely all you need** for GS Site. You're connecting 2 personal accounts, not building a multi-user fintech app.

3. **OAuth institutions** (like Schwab) may have additional wait times of up to 5 weeks after Plaid approval. FirstBank and Discover should not have this issue.

4. **Re-authentication** will occasionally be required when bank connections expire. The webhook handler (`ITEM/PENDING_EXPIRATION`) already handles this notification.

5. **Plaid Dashboard Activity Log** shows the last 14 days of API calls, responses, and webhook events — use this for debugging.
