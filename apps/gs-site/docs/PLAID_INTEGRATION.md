# Plaid Integration Plan - Budget Tile Automation

> **Status:** Planning
> **Feasibility:** 8/10
> **Created:** January 27, 2026
> **Target Accounts:** FirstBank Colorado, Discover

---

## Overview

This document outlines the integration plan for connecting Plaid to the GS Site Budget tile, enabling automatic transaction imports from FirstBank Colorado and Discover accounts.

### Problem Statement

Currently, budget data is populated via manual CSV imports:
- Discover: XLS export → manual upload
- FirstBank: CSV export → manual upload

This requires ~15-30 minutes of manual work per month and is prone to being forgotten.

### Proposed Solution

Integrate Plaid's API to automatically sync transactions from both accounts, eliminating manual imports entirely.

---

## Feasibility Assessment

### Score: 8/10

| Factor | Score | Notes |
|--------|-------|-------|
| Bank Support | 9/10 | Both FirstBank CO and Discover confirmed supported |
| Technical Complexity | 7/10 | Well-documented API, good SDKs |
| Cost | 6/10 | ~$10-20/mo for production (2 accounts) |
| Maintenance | 7/10 | Occasional re-auth needed when connections expire |
| Security | 9/10 | Plaid handles credentials, tokens encrypted |

### Bank Support Verification

| Institution | Plaid Support | Products Available |
|-------------|---------------|-------------------|
| **FirstBank Colorado** | ✅ Confirmed | Auth, Balance, Assets, Transactions (likely) |
| **Discover** | ✅ Confirmed | Transactions, Balance, Liabilities |

**Sources:**
- https://plaid.com/institutions/first-bank/
- https://fintable.io/coverage/banks/United%20States/23125_firstbank-colorado-personal-online-banking

---

## Cost Analysis

### Development Phase (Free)
- Plaid Sandbox: Unlimited test calls
- Plaid Development: 100 Items free (sufficient for testing with real banks)

### Production Phase
| Cost Type | Estimate | Notes |
|-----------|----------|-------|
| Per-connection fee | $0.30-0.50/item/month | 2 items = ~$0.60-1.00/month |
| Transaction calls | Variable | Usually included in base |
| **Estimated Monthly** | **$10-20** | Depends on plan tier |

### Alternatives Considered

| Option | Feasibility | Cost | Decision |
|--------|-------------|------|----------|
| Manual CSV Import | 10/10 | Free | Current - works but tedious |
| **Plaid** | 8/10 | $10-20/mo | **Recommended** |
| Teller.io | 6/10 | Similar | Less documentation |
| SimpleFIN | 5/10 | ~$1.50/mo | Screen scraping, fragile |
| Email Parsing | 4/10 | Free | Too fragile |

---

## Technical Architecture

### System Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   User Browser  │────▶│   Plaid Link    │────▶│   Bank OAuth    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Budget Tile    │◀────│   GS Site API   │◀────│  Plaid API      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │    Supabase     │
                        │  (tokens, txns) │
                        └─────────────────┘
```

### Data Flow

1. **Link Flow (One-time per account)**
   - User clicks "Link Account" in Budget modal
   - Plaid Link opens in iframe/modal
   - User authenticates with bank
   - Plaid returns `public_token`
   - Backend exchanges for `access_token`
   - Store encrypted `access_token` in Supabase

2. **Sync Flow (Daily/On-demand)**
   - Cron job or user trigger calls `/api/plaid/sync`
   - Fetch transactions using `access_token`
   - Map Plaid categories to budget categories
   - Insert new transactions into `budget_entries`
   - Update `last_synced` timestamp

3. **Webhook Flow (Real-time)**
   - Plaid sends webhook on new transactions
   - Backend processes and inserts entries
   - Budget tile updates automatically

---

## Implementation Plan

### Phase 1: Setup & Authentication (4 hours)

#### 1.1 Plaid Account Setup
- [ ] Create Plaid developer account
- [ ] Generate API keys (sandbox, development)
- [ ] Configure allowed redirect URIs
- [ ] Test institution search for FirstBank + Discover

#### 1.2 Environment Configuration
```bash
# Add to .env.local
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_sandbox_secret
PLAID_ENV=sandbox
NEXT_PUBLIC_PLAID_ENV=sandbox
```

#### 1.3 Install Dependencies
```bash
npm install plaid react-plaid-link
```

### Phase 2: Database Schema (1 hour)

#### 2.1 New Tables

```sql
-- Plaid connection storage
CREATE TABLE plaid_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,  -- Encrypt at application level
  item_id TEXT NOT NULL UNIQUE,
  institution_id TEXT,
  institution_name TEXT,
  status TEXT DEFAULT 'active',  -- active, error, pending_reauth
  error_code TEXT,
  consent_expiration TIMESTAMPTZ,
  last_synced TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Linked accounts within each item
CREATE TABLE plaid_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plaid_item_id UUID REFERENCES plaid_items(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,  -- Plaid's account ID
  budget_account_id UUID REFERENCES budget_accounts(id),  -- Link to existing
  name TEXT,
  official_name TEXT,
  type TEXT,  -- depository, credit, etc.
  subtype TEXT,  -- checking, credit card, etc.
  mask TEXT,  -- Last 4 digits
  current_balance DECIMAL(12,2),
  available_balance DECIMAL(12,2),
  last_synced TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transaction sync cursor for incremental sync
CREATE TABLE plaid_sync_cursors (
  plaid_item_id UUID PRIMARY KEY REFERENCES plaid_items(id) ON DELETE CASCADE,
  cursor TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_plaid_items_user ON plaid_items(user_id);
CREATE INDEX idx_plaid_accounts_item ON plaid_accounts(plaid_item_id);
```

### Phase 3: Backend API Routes (4 hours)

#### 3.1 API Route Structure

```
apps/gs-site/app/api/plaid/
├── create-link-token/route.ts   # Initialize Plaid Link
├── exchange-token/route.ts      # Exchange public token
├── accounts/route.ts            # List linked accounts
├── sync/route.ts                # Trigger transaction sync
├── unlink/route.ts              # Remove a linked account
└── webhook/route.ts             # Handle Plaid webhooks
```

#### 3.2 Core Implementation Files

```
apps/gs-site/lib/plaid/
├── client.ts          # Plaid client initialization
├── tokens.ts          # Token encryption/decryption
├── sync.ts            # Transaction sync logic
├── categories.ts      # Plaid → Budget category mapping
└── types.ts           # TypeScript types
```

### Phase 4: Frontend Integration (3 hours)

#### 4.1 Components

```
apps/gs-site/components/budget/
├── PlaidLinkButton.tsx      # Trigger Plaid Link
├── LinkedAccountsList.tsx   # Show connected accounts
├── AccountSyncStatus.tsx    # Show sync status/errors
└── UnlinkAccountDialog.tsx  # Confirm unlink
```

#### 4.2 Budget Modal Updates

Add new tab to BudgetModal: "Connected Accounts"
- Show linked FirstBank + Discover accounts
- Display last sync time
- Manual "Sync Now" button
- Unlink option

### Phase 5: Category Mapping (2 hours)

#### 5.1 Plaid to Budget Category Map

```typescript
const PLAID_CATEGORY_MAP: Record<string, string> = {
  // Food & Dining
  'FOOD_AND_DRINK': 'food-dining',
  'FOOD_AND_DRINK_RESTAURANTS': 'food-dining',
  'FOOD_AND_DRINK_COFFEE': 'food-dining',
  'FOOD_AND_DRINK_GROCERIES': 'groceries',

  // Transportation
  'TRANSPORTATION': 'transportation',
  'TRANSPORTATION_GAS': 'transportation',
  'TRANSPORTATION_PARKING': 'transportation',

  // Shopping
  'GENERAL_MERCHANDISE': 'shopping',
  'GENERAL_MERCHANDISE_ONLINE_MARKETPLACES': 'shopping',

  // Bills & Utilities
  'RENT_AND_UTILITIES': 'bills',
  'RENT_AND_UTILITIES_INTERNET_AND_CABLE': 'bills',

  // Entertainment
  'ENTERTAINMENT': 'entertainment',
  'ENTERTAINMENT_MUSIC_AND_AUDIO': 'subscriptions',
  'ENTERTAINMENT_TV_AND_MOVIES': 'subscriptions',

  // Health
  'MEDICAL': 'health',
  'PERSONAL_CARE': 'health',

  // Default
  'OTHER': 'other',
};
```

### Phase 6: Sync Automation (2 hours)

#### 6.1 Cron Job (Daily Sync)

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/plaid/sync",
      "schedule": "0 6 * * *"
    }
  ]
}
```

#### 6.2 Webhook Configuration

Configure in Plaid Dashboard:
- URL: `https://your-domain.com/api/plaid/webhook`
- Events: `TRANSACTIONS`, `ITEM`

---

## Security Considerations

### Token Storage
- Access tokens encrypted with AES-256 before storage
- Encryption key stored in environment variable
- Never log or expose tokens

### API Security
- All Plaid routes require authentication
- Rate limiting on sync endpoints
- Webhook signature verification

### Data Handling
- Transaction data stored in existing `budget_entries` table
- No raw Plaid data retained after processing
- User can unlink and delete all data

---

## Timeline Estimate

| Phase | Effort | Dependencies |
|-------|--------|--------------|
| Phase 1: Setup | 4 hours | Plaid account approval |
| Phase 2: Database | 1 hour | - |
| Phase 3: Backend | 4 hours | Phase 1, 2 |
| Phase 4: Frontend | 3 hours | Phase 3 |
| Phase 5: Categories | 2 hours | Phase 3 |
| Phase 6: Automation | 2 hours | Phase 3-5 |
| **Total** | **~16 hours** | |

---

## Testing Plan

### Sandbox Testing
1. Use Plaid sandbox credentials
2. Test with sandbox institutions
3. Verify token exchange flow
4. Test transaction sync

### Development Testing (Real Banks)
1. Link personal FirstBank account
2. Link personal Discover account
3. Verify transaction import
4. Test category mapping accuracy
5. Test error handling (expired tokens, etc.)

### Production Checklist
- [ ] All sandbox tests passing
- [ ] Real bank connections working in development
- [ ] Webhook endpoint receiving events
- [ ] Error alerting configured
- [ ] Token encryption verified
- [ ] Rate limiting in place

---

## Rollback Plan

If Plaid integration causes issues:
1. Disable Plaid sync cron job
2. Remove Plaid Link button from UI
3. Manual CSV import still available as fallback
4. Existing `budget_entries` data unaffected

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-27 | Proceed with Plaid | Both banks supported, feasibility 8/10 |
| 2026-01-27 | Use incremental sync | More efficient than full sync each time |
| 2026-01-27 | Keep CSV import | Fallback option, zero additional cost |

---

## References

- [Plaid Quickstart Guide](https://plaid.com/docs/quickstart/)
- [Plaid Transactions API](https://plaid.com/docs/api/products/transactions/)
- [react-plaid-link](https://github.com/plaid/react-plaid-link)
- [Plaid Webhooks](https://plaid.com/docs/api/webhooks/)
- [FirstBank Plaid Page](https://plaid.com/institutions/first-bank/)
