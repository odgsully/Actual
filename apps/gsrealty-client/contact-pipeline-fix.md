# Contact Pipeline Fix: Multi-Property System

## Overview

Build a multi-property contact system for `gsrealty-client` where contacts can be Buyer, Seller, or Both, with multiple properties that flow into the Sales Pipeline kanban.

---

## Design Decisions

| Question | Decision |
|----------|----------|
| Can two clients have same property? | Yes (buyer & seller on same address) - No alert needed |
| When property added, create deal? | Yes - immediately creates deal at "On Radar" stage |
| Deal type vs client type mismatch? | Warn user, offer to change client_type to "Both" |
| Primary property marker? | No - not needed |
| Migration strategy | Manual classification (see existing data below) |
| **Address source of truth?** | `gsrealty_client_properties.property_address` is canonical; edits propagate to linked deal |
| **Old property_address column?** | Deprecate after migration, drop in follow-up release |
| **Status ↔ Deal sync?** | Closing property status prompts to close deal (user confirms) |

### Existing Data Classification

| Client | Client Type | Properties |
|--------|-------------|------------|
| Mozingo | Seller | (existing property) |
| Tim Sullivan | Both | San Juan (Selling), San Juan (Buying) |

---

## Current State Analysis

### Problem

- `gsrealty_clients` has single `property_address` field - can't track multiple properties
- No `client_type` field to distinguish Buyer/Seller/Both
- Properties can't be managed independently before becoming deals

### Existing Architecture

```
gsrealty_clients (1) -----> (N) gsrealty_deals
                     client_id

Current Fields:
- clients: property_address (single, limiting)
- deals: type (buyer/seller), stage, property_address
```

---

## Proposed Schema Changes

### 1. Add `client_type` to `gsrealty_clients`

```sql
ALTER TABLE gsrealty_clients
ADD COLUMN client_type TEXT DEFAULT 'buyer'
CHECK (client_type IN ('buyer', 'seller', 'both'));

-- Update existing data
UPDATE gsrealty_clients
SET client_type = 'seller'
WHERE first_name = 'Mozingo' OR last_name = 'Mozingo';

UPDATE gsrealty_clients
SET client_type = 'both'
WHERE first_name = 'Tim' AND last_name = 'Sullivan';
```

### 2. Create `gsrealty_client_properties` Junction Table

```sql
CREATE TABLE gsrealty_client_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES gsrealty_clients(id) ON DELETE CASCADE,
  property_address TEXT NOT NULL,
  property_type TEXT NOT NULL CHECK (property_type IN ('buying', 'selling')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'closed')),
  deal_id UUID REFERENCES gsrealty_deals(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, property_address, property_type)
);

CREATE INDEX idx_client_properties_client ON gsrealty_client_properties(client_id);
CREATE INDEX idx_client_properties_status ON gsrealty_client_properties(status) WHERE status = 'active';
CREATE INDEX idx_client_properties_deal ON gsrealty_client_properties(deal_id);

ALTER TABLE gsrealty_client_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage client properties"
  ON gsrealty_client_properties FOR ALL TO authenticated USING (true);
```

### 3. Performance Indexes for Deals

```sql
CREATE INDEX idx_deals_client_stage ON gsrealty_deals(client_id, stage);
CREATE INDEX idx_deals_property_address ON gsrealty_deals(property_address) WHERE property_address IS NOT NULL;
```

### 4. Cascade Protection (Prevent Accidental Deletion)

```sql
CREATE OR REPLACE FUNCTION check_active_deals_before_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM gsrealty_deals
    WHERE client_id = OLD.id AND stage != 'closed'
  ) THEN
    RAISE EXCEPTION 'Cannot delete client with active deals. Close or reassign deals first.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_client_delete_with_active_deals
BEFORE DELETE ON gsrealty_clients
FOR EACH ROW EXECUTE FUNCTION check_active_deals_before_delete();
```

### 5. Data Migration

```sql
-- Migrate existing property_address to new table
-- Default to 'buying' type, will be manually corrected
INSERT INTO gsrealty_client_properties (client_id, property_address, property_type, status)
SELECT id, property_address,
  CASE
    WHEN client_type = 'seller' THEN 'selling'
    WHEN client_type = 'buyer' THEN 'buying'
    ELSE 'buying'  -- Default for 'both', can add second entry manually
  END,
  'active'
FROM gsrealty_clients
WHERE property_address IS NOT NULL AND property_address != '';
```

### 6. Deprecate Old Column (Post-Migration)

```sql
-- After verifying migration success, mark column as deprecated
COMMENT ON COLUMN gsrealty_clients.property_address IS
  'DEPRECATED: Use gsrealty_client_properties table instead. Will be dropped in future release.';

-- OPTIONAL: Drop in follow-up release after confirming no code references it
-- ALTER TABLE gsrealty_clients DROP COLUMN property_address;
```

**Note:** Do NOT drop the column in the same migration. Verify all code paths use the new table first, then drop in a separate release.

---

## Data Integrity Rules

### Address Source of Truth

The `gsrealty_client_properties.property_address` field is the **canonical source**. When a property is added:

1. Address stored in `gsrealty_client_properties`
2. Deal auto-created with same address copied to `gsrealty_deals.property_address`
3. **If address is edited** → Update propagates to linked deal

```sql
-- Trigger to sync address changes to linked deal
CREATE OR REPLACE FUNCTION sync_property_address_to_deal()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.property_address != OLD.property_address AND NEW.deal_id IS NOT NULL THEN
    UPDATE gsrealty_deals
    SET property_address = NEW.property_address
    WHERE id = NEW.deal_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_address_on_property_update
AFTER UPDATE OF property_address ON gsrealty_client_properties
FOR EACH ROW EXECUTE FUNCTION sync_property_address_to_deal();
```

### Status ↔ Deal Synchronization

Property status and deal stage are **intentionally independent**, but closing a property should prompt the user:

| Action | Behavior |
|--------|----------|
| Property status → `closed` | Prompt: "Also close the linked deal?" (Yes/No) |
| Deal stage → `closed` | Auto-update property status to `closed` |
| Property status → `inactive` | Deal remains at current stage (hidden from pipeline view only) |
| Property status → `active` (from inactive) | Deal reappears in pipeline at previous stage |

**Implementation:** Handle in application layer (`updatePropertyStatus` function), not database trigger.

---

## Dual Status Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONTACT PROPERTIES                           │
│  (gsrealty_client_properties)                                   │
│                                                                 │
│  Property Status: [Active] [Inactive] [Closed]                  │
│  └─ Controls visibility in pipeline                             │
│  └─ Only "Active" properties appear in kanban                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Auto-creates deal (On Radar)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SALES PIPELINE                               │
│  (gsrealty_deals)                                               │
│                                                                 │
│  Deal Stage: On Radar → Official Rep → Touring → Offers In →   │
│              Under Contract → Closed                            │
│  └─ Tracks deal progression through sales cycle                 │
│  └─ Drag-and-drop in kanban                                     │
└─────────────────────────────────────────────────────────────────┘
```

**Property Status Logic:**
- `active` → Shows in pipeline, deal visible in kanban
- `inactive` → Hidden from pipeline, archived but recoverable
- `closed` → Deal completed or lost, historical record

---

## UI Design

### Contact Detail Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ 👤 John Smith                                    [Delete]       │
│ Contact Details                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Contact Type                                                    │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐                            │
│ │  Buyer  │ │ Seller  │ │  Both   │  ← Toggle (saves on click) │
│ └─────────┘ └─────────┘ └─────────┘                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 🏠 Properties Interested In (Buying)                    [+ Add] │
│ (Visible if: Buyer or Both)                                     │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 123 Main St, Phoenix AZ 85001                               │ │
│ │ Status: [Active ▼]        Stage: 🟣 On Radar                │ │
│ │                                                             │ │
│ │ [📋 View in Pipeline]                   [✏️ Edit] [🗑️ Remove]│ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 456 Oak Ave, Scottsdale AZ 85250                            │ │
│ │ Status: [Active ▼]        Stage: 🟢 Touring                 │ │
│ │                                                             │ │
│ │ [📋 View in Pipeline]                   [✏️ Edit] [🗑️ Remove]│ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 🏷️ Properties Listing (Selling)                         [+ Add] │
│ (Visible if: Seller or Both)                                    │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 789 Pine Rd, Mesa AZ 85201                                  │ │
│ │ Status: [Inactive ▼]                    (Not in pipeline)   │ │
│ │                                                             │ │
│ │ [Set Active to add to pipeline]         [✏️ Edit] [🗑️ Remove]│ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Property Card States

| State | Status | Deal | UI Shows |
|-------|--------|------|----------|
| **New property (active)** | Active | Auto-created (On Radar) | Stage badge + "View in Pipeline" |
| **In pipeline** | Active | Linked | Stage badge + "View in Pipeline" |
| **Paused** | Inactive | Unlinked | "Set Active to add to pipeline" |
| **Completed** | Closed | Closed deal | "Closed" badge, read-only |

### Deal Type Mismatch Warning

When user tries to add a "selling" property but client_type is "buyer":

```
┌─────────────────────────────────────────────────────────────────┐
│ ⚠️ Client Type Mismatch                                         │
│                                                                 │
│ This client is currently set as "Buyer" but you're adding a    │
│ selling property.                                               │
│                                                                 │
│ Would you like to change this client to "Both"?                 │
│                                                                 │
│              [Change to Both]     [Cancel]                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Behaviors

1. **Adding a property** → Automatically creates deal at "On Radar" stage
2. **Contact Type toggle** → Dynamically shows/hides property sections
3. **Property status = inactive** → Deal hidden from pipeline (soft archive)
4. **Property status = closed** → Prompts "Also close linked deal?" then historical record, read-only
5. **Deal stage = closed** → Auto-updates linked property status to `closed`
6. **"View in Pipeline"** → Navigates to `/admin/pipeline` (auto-scrolls to deal)
7. **Delete client with active deals** → Blocked with error message
8. **Edit property address** → Change propagates to linked deal automatically

---

## Files to Create/Modify

### Phase 1: Database

| File | Action |
|------|--------|
| Supabase migration | CREATE - Schema changes + data migration + address sync trigger |
| Follow-up migration (later) | CREATE - Drop deprecated `property_address` column after code cleanup |

### Phase 2: Backend

| File | Action |
|------|--------|
| `lib/database/client-properties.ts` | CREATE - CRUD functions |
| `lib/database/clients.ts` | MODIFY - Add client_type to types |
| `lib/database/deals.ts` | MODIFY - Add createDealFromProperty |

### Phase 3: UI Components

| File | Action |
|------|--------|
| `components/admin/clients/ClientTypeToggle.tsx` | CREATE |
| `components/admin/clients/PropertyCard.tsx` | CREATE |
| `components/admin/clients/AddPropertyModal.tsx` | CREATE |
| `components/admin/clients/ClientTypeMismatchModal.tsx` | CREATE |
| `components/admin/clients/CloseDealConfirmModal.tsx` | CREATE - "Also close linked deal?" prompt |

### Phase 4: Page Integration

| File | Action |
|------|--------|
| `app/admin/clients/[id]/page.tsx` | MODIFY - Integrate components |
| `app/admin/clients/new/page.tsx` | MODIFY - Add client_type field |
| `app/admin/clients/page.tsx` | MODIFY - Add type badge to list |

---

## Implementation Phases

```
Phase 1: Database Migration
├── Add client_type column (default: 'buyer')
├── Create gsrealty_client_properties table
├── Add cascade protection trigger
├── Add address sync trigger (property → deal)
├── Migrate existing property_address data
├── Update Mozingo → seller
├── Update Tim Sullivan → both
├── Add performance indexes
└── Deprecate old property_address column (comment only, drop later)

Phase 2: Backend Functions
├── lib/database/client-properties.ts
│   ├── getClientProperties(clientId)
│   ├── addClientProperty(clientId, input) → auto-creates deal
│   ├── updateClientProperty(propertyId, input) → syncs address to deal
│   ├── removeClientProperty(propertyId)
│   └── updatePropertyStatus(propertyId, status) → prompts deal close if 'closed'
├── Update clients.ts types for client_type
├── Update deals.ts for property linking
└── Add closeDeal() → auto-updates linked property status to 'closed'

Phase 3: UI Components
├── ClientTypeToggle (Buyer/Seller/Both)
├── PropertyCard (with status dropdown + stage badge)
├── AddPropertyModal (address input + type)
├── ClientTypeMismatchModal (warn + change to Both)
└── CloseDealConfirmModal (prompt when closing property with active deal)

Phase 4: Contact Detail Page Integration
├── Add ClientTypeToggle to header section
├── Add Properties sections (conditional by type)
├── Wire up add/edit/remove actions
├── Auto-create deal on property add
└── Link to pipeline for existing deals

Phase 5: Testing & Polish
├── Test full flow: Contact → Property → Deal → Kanban
├── Test status filtering (active only in pipeline)
├── Test client type mismatch warning
├── Test delete protection with active deals
└── Verify data migration for existing contacts
```

---

## Upstream/Downstream Impacts

### Files Requiring Changes

| File | Impact | Priority |
|------|--------|----------|
| `lib/database/clients.ts` | Add client_type to interfaces + CRUD | HIGH |
| `app/admin/clients/new/page.tsx` | Add client_type field | HIGH |
| `app/admin/clients/[id]/page.tsx` | Major refactor - properties section | HIGH |
| `app/admin/clients/page.tsx` | Add type badge, optional filtering | MEDIUM |
| `lib/database/__tests__/clients.test.ts` | Update mocks | HIGH |
| `app/admin/deals/new/page.tsx` | Optional: pre-populate from property | LOW |
| `components/admin/pipeline/DealCard.tsx` | Optional: show property link | LOW |
| `app/admin/page.tsx` | Optional: buyer/seller stats | LOW |

---

## Verification Checklist

### Core Functionality
- [ ] Client type toggle saves to database
- [ ] Properties section shows based on client type
- [ ] Adding property auto-creates deal at "On Radar"
- [ ] Property status dropdown works (active/inactive/closed)
- [ ] Inactive properties hidden from pipeline
- [ ] "View in Pipeline" navigates correctly
- [ ] Type mismatch warning appears and offers "Change to Both"
- [ ] Cannot delete client with active deals

### Data Integrity (New)
- [ ] Editing property address syncs to linked deal
- [ ] Closing property status prompts "Also close deal?"
- [ ] Closing deal auto-updates property status to 'closed'
- [ ] Old `property_address` column on clients is deprecated (has comment)
- [ ] No code references old `gsrealty_clients.property_address` field

### Migration Verification
- [ ] Mozingo shows as Seller
- [ ] Tim Sullivan shows as Both
- [ ] Existing properties migrated correctly
- [ ] All migrated properties have linked deals
