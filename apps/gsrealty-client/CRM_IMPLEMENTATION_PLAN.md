# GSRealty CRM Implementation Plan

## Overview

Replace hardcoded dashboard values with real Supabase data. **UI stays exactly the same** - only data sources change.

---

## Current State Analysis

**Project ID**: `fsaluvvszosucvzaedtj` (Real Estate view)

### Dashboard Stats (app/admin/page.tsx, lines 43-48)

| Stat | Current | Source | Status |
|------|---------|--------|--------|
| Total Contacts | Live from Supabase | `getClientCount()` | ✅ Working |
| Active Deals | Hardcoded `156` | None | ❌ Dummy |
| Revenue | Hardcoded `$89.2K` | None | ❌ Dummy |
| Calls Placed | Hardcoded `47` | None | ❌ Dummy |

### Recent Contacts (lines 115-128)

| Field | Current | Source | Status |
|-------|---------|--------|--------|
| Name, Email, Phone | Live from Supabase | `getAllClients()` | ✅ Working |
| Value (e.g. "$12.5K") | Random from array | `generateValue()` | ❌ Dummy |
| Status | Calculated from `created_at` | - | ✅ Working |

### Sales Target Card (lines 343-386)

| Field | Current | Target | Status |
|-------|---------|--------|--------|
| Monthly Target | `$125K` | Outreach count target | ❌ Hardcoded |
| Achieved | `$85K` (68%) | Actual outreach count | ❌ Hardcoded |
| Quarterly Target | `$375K` | Outreach count target | ❌ Hardcoded |
| Achieved | `$168K` (45%) | Actual outreach count | ❌ Hardcoded |

---

## Phase 1: Database Tables

### Table: `gsrealty_deals`

Tracks buyer/seller deals for Active Deals count and Revenue calculation.

```sql
CREATE TABLE gsrealty_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES gsrealty_clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('buyer', 'seller')),
  stage TEXT NOT NULL CHECK (stage IN (
    'on_radar',
    'official_representation',
    'touring',
    'offers_in',
    'under_contract',
    'closed'
  )),
  property_address TEXT,
  deal_value DECIMAL(12,2) DEFAULT 0,
  commission_rate DECIMAL(5,4) DEFAULT 0.03,
  expected_commission DECIMAL(12,2) GENERATED ALWAYS AS (deal_value * commission_rate) STORED,
  representation_end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_deals_client_id ON gsrealty_deals(client_id);
CREATE INDEX idx_deals_stage ON gsrealty_deals(stage);
CREATE INDEX idx_deals_type ON gsrealty_deals(type);

-- RLS
ALTER TABLE gsrealty_deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON gsrealty_deals
  FOR ALL TO authenticated USING (true);

-- Updated_at trigger
CREATE TRIGGER update_gsrealty_deals_updated_at
  BEFORE UPDATE ON gsrealty_deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Stage Definitions:**
- `on_radar` - Initial contact, exploring options
- `official_representation` - Signed buyer/seller agreement
- `touring` - Actively viewing properties
- `offers_in` - Offers submitted
- `under_contract` - Accepted offer, in escrow
- `closed` - Transaction complete

**Active Deals = all deals WHERE stage != 'closed'**

---

### Table: `gsrealty_outreach`

Tracks calls, emails, meetings for Calls Placed count and Sales Target progress.

```sql
CREATE TABLE gsrealty_outreach (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES gsrealty_clients(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'text', 'other')),
  notes TEXT,
  outcome TEXT, -- e.g., 'left voicemail', 'scheduled showing', 'no answer'
  duration_minutes INTEGER, -- for calls
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_outreach_client_id ON gsrealty_outreach(client_id);
CREATE INDEX idx_outreach_type ON gsrealty_outreach(type);
CREATE INDEX idx_outreach_created_at ON gsrealty_outreach(created_at);

-- RLS
ALTER TABLE gsrealty_outreach ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON gsrealty_outreach
  FOR ALL TO authenticated USING (true);
```

**Calls This Month = WHERE type='call' AND created_at >= start_of_month**

---

## Phase 2: Database Query Functions

### File: `lib/database/deals.ts`

```typescript
import { createClient } from '@/lib/supabase/server'

export interface Deal {
  id: string
  client_id: string
  type: 'buyer' | 'seller'
  stage: 'on_radar' | 'official_representation' | 'touring' | 'offers_in' | 'under_contract' | 'closed'
  property_address: string | null
  deal_value: number
  commission_rate: number
  expected_commission: number
  representation_end_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

/**
 * Get count of active deals (not closed)
 */
export async function getActiveDealsCount(): Promise<{ count: number; error: Error | null }> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('gsrealty_deals')
    .select('*', { count: 'exact', head: true })
    .neq('stage', 'closed')

  return { count: count ?? 0, error }
}

/**
 * Get total expected revenue from active deals
 */
export async function getTotalRevenue(): Promise<{ revenue: number; error: Error | null }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('gsrealty_deals')
    .select('expected_commission')
    .neq('stage', 'closed')

  if (error) return { revenue: 0, error }

  const total = data?.reduce((sum, deal) => sum + (deal.expected_commission || 0), 0) ?? 0
  return { revenue: total, error: null }
}

/**
 * Get deal value for a specific client (for Recent Contacts display)
 */
export async function getClientDealValue(clientId: string): Promise<{ value: number; error: Error | null }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('gsrealty_deals')
    .select('expected_commission')
    .eq('client_id', clientId)
    .neq('stage', 'closed')

  if (error) return { value: 0, error }

  const total = data?.reduce((sum, deal) => sum + (deal.expected_commission || 0), 0) ?? 0
  return { value: total, error: null }
}

/**
 * Get all deals for a client
 */
export async function getClientDeals(clientId: string): Promise<{ deals: Deal[]; error: Error | null }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('gsrealty_deals')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  return { deals: data ?? [], error }
}

/**
 * Create a new deal
 */
export async function createDeal(deal: Omit<Deal, 'id' | 'expected_commission' | 'created_at' | 'updated_at'>): Promise<{ deal: Deal | null; error: Error | null }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('gsrealty_deals')
    .insert(deal)
    .select()
    .single()

  return { deal: data, error }
}
```

---

### File: `lib/database/outreach.ts`

```typescript
import { createClient } from '@/lib/supabase/server'

export interface Outreach {
  id: string
  client_id: string | null
  type: 'call' | 'email' | 'meeting' | 'text' | 'other'
  notes: string | null
  outcome: string | null
  duration_minutes: number | null
  created_by: string | null
  created_at: string
}

/**
 * Get calls placed this month
 */
export async function getCallsThisMonth(): Promise<{ count: number; error: Error | null }> {
  const supabase = await createClient()

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count, error } = await supabase
    .from('gsrealty_outreach')
    .select('*', { count: 'exact', head: true })
    .eq('type', 'call')
    .gte('created_at', startOfMonth.toISOString())

  return { count: count ?? 0, error }
}

/**
 * Get total outreach this month (for Sales Target)
 */
export async function getOutreachThisMonth(): Promise<{ count: number; error: Error | null }> {
  const supabase = await createClient()

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count, error } = await supabase
    .from('gsrealty_outreach')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfMonth.toISOString())

  return { count: count ?? 0, error }
}

/**
 * Get total outreach this quarter (for Sales Target)
 */
export async function getOutreachThisQuarter(): Promise<{ count: number; error: Error | null }> {
  const supabase = await createClient()

  const now = new Date()
  const quarter = Math.floor(now.getMonth() / 3)
  const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1)
  startOfQuarter.setHours(0, 0, 0, 0)

  const { count, error } = await supabase
    .from('gsrealty_outreach')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfQuarter.toISOString())

  return { count: count ?? 0, error }
}

/**
 * Get recent outreach for a client
 */
export async function getClientOutreach(clientId: string, limit: number = 10): Promise<{ outreach: Outreach[]; error: Error | null }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('gsrealty_outreach')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(limit)

  return { outreach: data ?? [], error }
}

/**
 * Log a new outreach activity
 */
export async function logOutreach(outreach: Omit<Outreach, 'id' | 'created_at'>): Promise<{ outreach: Outreach | null; error: Error | null }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('gsrealty_outreach')
    .insert(outreach)
    .select()
    .single()

  return { outreach: data, error }
}
```

---

## Phase 3: Dashboard Page Updates

### Import Changes (line 24)

```typescript
// Add after existing imports
import { getActiveDealsCount, getTotalRevenue, getClientDealValue } from '@/lib/database/deals'
import { getCallsThisMonth, getOutreachThisMonth, getOutreachThisQuarter } from '@/lib/database/outreach'
```

### State Changes (lines 43-48)

```typescript
const [dashboardStats, setDashboardStats] = useState({
  totalContacts: 0,
  activeDeals: 0,        // Changed from 156
  revenue: '$0',         // Changed from '$89.2K'
  callsPlaced: 0         // Changed from 47
})

// Add sales target state
const [salesTarget, setSalesTarget] = useState({
  monthlyTarget: 50,      // Outreach count, not dollar amount
  monthlyAchieved: 0,
  quarterlyTarget: 150,
  quarterlyAchieved: 0
})
```

### useEffect Changes (lines 101-139)

```typescript
useEffect(() => {
  const fetchData = async () => {
    try {
      // Existing: Fetch total contacts count
      const { count: contactCount } = await getClientCount()

      // NEW: Fetch active deals count
      const { count: dealsCount } = await getActiveDealsCount()

      // NEW: Fetch total revenue
      const { revenue } = await getTotalRevenue()

      // NEW: Fetch calls this month
      const { count: callsCount } = await getCallsThisMonth()

      // NEW: Fetch outreach for sales targets
      const { count: monthlyOutreach } = await getOutreachThisMonth()
      const { count: quarterlyOutreach } = await getOutreachThisQuarter()

      // Format revenue
      const formattedRevenue = revenue >= 1000
        ? `$${(revenue / 1000).toFixed(1)}K`
        : `$${revenue.toFixed(0)}`

      setDashboardStats({
        totalContacts: contactCount || 0,
        activeDeals: dealsCount || 0,
        revenue: formattedRevenue,
        callsPlaced: callsCount || 0
      })

      setSalesTarget(prev => ({
        ...prev,
        monthlyAchieved: monthlyOutreach || 0,
        quarterlyAchieved: quarterlyOutreach || 0
      }))

      // Fetch recent contacts with real deal values
      const { clients } = await getAllClients()
      if (clients) {
        const recentWithValues = await Promise.all(
          clients
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5)
            .map(async (client) => {
              const { value } = await getClientDealValue(client.id)
              return {
                id: client.id,
                first_name: client.first_name,
                last_name: client.last_name,
                email: client.email ?? null,
                phone: client.phone ?? null,
                created_at: client.created_at,
                status: getContactStatus(client.created_at),
                value: value > 0
                  ? `$${(value / 1000).toFixed(1)}K`
                  : '$0'
              }
            })
        )
        setRecentContacts(recentWithValues)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setStatsLoading(false)
      setContactsLoading(false)
    }
  }

  fetchData()
}, [])
```

### Sales Target Card Changes (lines 343-386)

Replace hardcoded values with state:

```typescript
{/* Monthly Target */}
<div className="space-y-3">
  <div className="flex justify-between items-center">
    <span className="text-white/80 text-sm">Monthly Outreach Target</span>
    <span className="text-white font-semibold">{salesTarget.monthlyTarget}</span>
  </div>
  <div className="w-full bg-white/10 rounded-full h-3">
    <div
      className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full"
      style={{ width: `${Math.min((salesTarget.monthlyAchieved / salesTarget.monthlyTarget) * 100, 100)}%` }}
    />
  </div>
  <div className="flex justify-between text-sm">
    <span className="text-green-400">{salesTarget.monthlyAchieved} completed</span>
    <span className="text-white/60">
      {Math.round((salesTarget.monthlyAchieved / salesTarget.monthlyTarget) * 100)}%
    </span>
  </div>
</div>

{/* Quarterly Target */}
<div className="space-y-3">
  <div className="flex justify-between items-center">
    <span className="text-white/80 text-sm">Quarterly Outreach Target</span>
    <span className="text-white font-semibold">{salesTarget.quarterlyTarget}</span>
  </div>
  <div className="w-full bg-white/10 rounded-full h-3">
    <div
      className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full"
      style={{ width: `${Math.min((salesTarget.quarterlyAchieved / salesTarget.quarterlyTarget) * 100, 100)}%` }}
    />
  </div>
  <div className="flex justify-between text-sm">
    <span className="text-yellow-400">{salesTarget.quarterlyAchieved} completed</span>
    <span className="text-white/60">
      {Math.round((salesTarget.quarterlyAchieved / salesTarget.quarterlyTarget) * 100)}%
    </span>
  </div>
</div>
```

---

## Phase 4: Remove Dummy Code

### Delete `generateValue()` function (lines 62-65)

```typescript
// DELETE THIS:
const generateValue = (): string => {
  const values = ['$12.5K', '$8.2K', '$15.7K', '$3.1K', '$9.8K', '$22.4K', '$6.9K']
  return values[Math.floor(Math.random() * values.length)]
}
```

---

## Implementation Checklist

### Step 1: Database Migration
- [ ] Run SQL to create `gsrealty_deals` table
- [ ] Run SQL to create `gsrealty_outreach` table
- [ ] Verify tables exist in Supabase dashboard
- [ ] Verify RLS policies are active

### Step 2: Create Database Functions
- [ ] Create `lib/database/deals.ts`
- [ ] Create `lib/database/outreach.ts`
- [ ] Verify TypeScript compilation passes

### Step 3: Update Dashboard
- [ ] Add imports for new database functions
- [ ] Update `dashboardStats` initial state
- [ ] Add `salesTarget` state
- [ ] Update `useEffect` to fetch real data
- [ ] Update Sales Target card JSX
- [ ] Delete `generateValue()` function

### Step 4: Testing
- [ ] Insert test deal via Supabase
- [ ] Insert test outreach via Supabase
- [ ] Verify dashboard shows real values
- [ ] Verify Recent Contacts show real deal values
- [ ] Verify Sales Target shows real progress

---

## Test Data SQL

```sql
-- Insert test deal
INSERT INTO gsrealty_deals (client_id, type, stage, property_address, deal_value)
SELECT id, 'buyer', 'touring', '123 Test Street, Phoenix, AZ', 500000
FROM gsrealty_clients LIMIT 1;

-- Insert test outreach
INSERT INTO gsrealty_outreach (client_id, type, notes, outcome)
SELECT id, 'call', 'Discussed property tour schedule', 'scheduled showing'
FROM gsrealty_clients LIMIT 1;

-- Verify
SELECT COUNT(*) as active_deals FROM gsrealty_deals WHERE stage != 'closed';
SELECT SUM(expected_commission) as revenue FROM gsrealty_deals WHERE stage != 'closed';
SELECT COUNT(*) as calls_this_month FROM gsrealty_outreach
  WHERE type = 'call'
  AND created_at >= date_trunc('month', CURRENT_DATE);
```

---

## Summary

| What Changes | What Stays Same |
|--------------|-----------------|
| 3 hardcoded stats → Supabase queries | All UI components |
| 2 new database tables | Glassmorphism styling |
| 2 new lib/database files | Layout structure |
| `useEffect` data fetching | Card designs |
| Sales Target: $ → outreach count | Recent Contacts list |
| | Animation/transitions |

**Zero UI changes. Only data sources change.**

---

## Future Enhancements

### Completed (Phase 2)

- [x] **Outreach logging modal** - `components/admin/LogOutreachModal.tsx`
  - Activity types: Call, Email, Meeting, Text, Other
  - Duration tracking with quick presets (15, 30, 45, 60 min)
  - Outcome dropdown (Interested, Not Interested, Follow-up, etc.)
  - Notes with character count
  - Auto-refreshes dashboard stats on success

- [x] **Activity timeline on contact profile** - `app/admin/clients/[id]/page.tsx`
  - Shows recent outreach history with type icons
  - Displays timestamps, outcomes, notes, duration
  - Log Call, Log Email, Log Meeting quick action buttons

- [x] **API route for outreach** - `app/api/admin/outreach/route.ts`
  - POST: Create new outreach record
  - GET: Fetch outreach by client
  - DELETE: Remove outreach record
  - Admin role verification on all endpoints

- [x] **Dashboard quick actions** - `components/admin/QuickActionsPanel.tsx`
  - "Log Call" button opens modal with call type pre-selected
  - "Log Email" button opens modal with email type pre-selected

- [x] **Clients list quick log** - `app/admin/clients/page.tsx`
  - Activity icon in hover actions for each contact row
  - Opens modal with client pre-selected

### In Progress

- [ ] Deal pipeline kanban board - `/admin/pipeline` (partially built)

### Pending

- [ ] Admin settings for target configuration
- [ ] Reports page with deal analytics
