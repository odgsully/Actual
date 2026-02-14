# Dashboard Reskin Plan - GS Realty CRM

**Created:** January 2026
**Status:** Implementation In Progress (Phase 6)
**Branch:** `gsrealty-crm`
**Last Updated:** January 15, 2026

---

## Part 1: Overview & Goals

### Objective
Reskin the GS Realty admin dashboard to match the CRM Pro template design while:
- Preserving all existing functionality
- Keeping authentication intact
- Enabling real data display (replacing hardcoded "0" values)
- Conservative migration approach

### Template Reference
- **Source:** `/new-template/crm-dash-templ/`
- **Main Component:** `components/crm-dashboard.tsx`
- **Design:** Glassmorphism with 3-column layout

### Key Design Elements from Template
- Left sidebar with categorized navigation (Main Menu, CRM Tools, Administration)
- Right sidebar with Quick Actions, Recent Activity, Top Performers
- 4 stat cards in main content area
- Recent Contacts list with avatars and badges
- Sales Target / Performance metrics card

---

## Part 2: Research Findings & Downstream Impact Analysis

### 2.1 Admin Pages Inventory

| Page | Route | Key Dependencies | Impact Level |
|------|-------|------------------|--------------|
| Dashboard | `/admin` | `useAuth`, `CreateEventModal` | **HIGH** - Main reskin target |
| Clients List | `/admin/clients` | `getAllClients()`, Supabase | LOW - Route rename only |
| New Client | `/admin/clients/new` | `createClient()` | NONE |
| Client Detail | `/admin/clients/[id]` | `getClientById()`, `updateClient()` | NONE |
| MCAO Lookup | `/admin/mcao` | MCAO API, `MCAOCategorizedData` | LOW - Menu reorganization |
| ReportIt | `/admin/reportit` | File upload API | LOW - Menu reorganization |
| Upload MLS | `/admin/upload` | Multi-stage upload flow | LOW - Menu reorganization |
| Settings | `/admin/settings` | Local state only | NONE |

### 2.2 Authentication System - DO NOT MODIFY

**Critical Files (No Changes Allowed):**

| File | Purpose | Why Protected |
|------|---------|---------------|
| `contexts/AuthContext.tsx` | Core auth state | Manages user/role/loading globally |
| `middleware.ts` | Route protection | Server-side auth checks |
| `lib/supabase/auth.ts` | Auth functions | signIn, signOut, role checks |
| `hooks/useAuth.ts` | Hook export | Used by all protected pages |
| `app/layout.tsx` | AuthProvider wrapper | Must wrap entire app |

**Auth Flow (Must Remain Intact):**
```
User → Middleware → AuthContext → useAuth() → Component
         ↓
    /admin/* requires admin role
    /client/* requires client role
```

**Role Determination Logic:**
1. If email = `gbsullivan@mac.com` → `admin`
2. Else check `gsrealty_users.role` → `admin` or `client`
3. Default fallback: `client`

### 2.3 Component Dependencies

**UI Primitives (Safe to Use):**
- `Button` - 6 variants (default, destructive, outline, secondary, ghost, link)
- `Card` - 6 exports (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter)
- `Badge` - Status indicators
- `Avatar` - User initials display
- `Input` - Form inputs
- `Alert` - Notifications

**Admin Components (May Need Updates):**
- `QuickActionsPanel.tsx` - **MODIFY** for new quick actions
- `CreateEventModal.tsx` - Keep as-is
- `MCAOCategorizedData.tsx` - Keep as-is

### 2.4 Database & API Integration

**Current Dashboard Data:** All hardcoded to "0"
```typescript
// Current state in app/admin/page.tsx
const stats = [
  { name: 'Total Clients', value: '0' },      // Hardcoded
  { name: 'Properties Tracked', value: '0' }, // Hardcoded
  { name: 'Files Uploaded', value: '0' },     // Hardcoded
  { name: 'MCAO Lookups', value: '0' },       // Hardcoded
]
```

**Available Data Sources:**

| Metric | Table | Query Function | Status |
|--------|-------|----------------|--------|
| Total Contacts | `gsrealty_clients` | `getClientCount()` | Exists |
| Properties | `gsrealty_properties` | Need to create | Missing |
| Files Uploaded | `gsrealty_uploaded_files` | Need to create | Missing |
| MCAO Lookups | `gsrealty_mcao_data` | `getMCAOStats()` | Exists |
| Events/Meetings | `gsrealty_event_entries` | Need to create | Missing |
| Revenue | `properties.list_price` | Need to create | Missing |

**API Endpoints Available:**
- `GET /api/admin/events` - List events
- `GET /api/admin/monitoring` - System metrics
- `POST /api/admin/mcao/lookup` - Property lookup
- No dedicated dashboard stats endpoint (needs creation)

### 2.5 Downstream Impact Matrix

| Change | Files Affected | Risk | Mitigation |
|--------|----------------|------|------------|
| Rename "Clients" → "Contacts" | `layout.tsx` only | LOW | Display text only, routes unchanged |
| Add Reports dropdown | `layout.tsx` | LOW | New state for expand/collapse |
| Update stat cards | `page.tsx` | MEDIUM | Add data fetching, loading states |
| Add Recent Contacts | `page.tsx` | MEDIUM | New API endpoint needed |
| Update Quick Actions | `QuickActionsPanel.tsx` | LOW | Prop changes only |
| Add Top Performers | `QuickActionsPanel.tsx` | LOW | New section, mock data OK |

---

## Part 3: Navigation Restructure Plan

### 3.1 Current Navigation
```
MAIN MENU
├── Dashboard (/admin)
└── Clients (/admin/clients)

CRM TOOLS
├── Upload MLS (/admin/upload)
├── ReportIt (/admin/reportit)
└── MCAO Lookup (/admin/mcao)

ADMINISTRATION
└── Settings (/admin/settings)
```

### 3.2 Target Navigation
```
MAIN MENU
├── Contacts (/admin/clients)     ← RENAMED from "Clients"
├── Analytics                      ← Placeholder (disabled)
├── Sales Pipeline                 ← Placeholder (disabled)
├── Calendar                       ← Placeholder (disabled)
└── Campaigns                      ← Placeholder (disabled)

CRM TOOLS
├── Reports ▼                      ← NEW DROPDOWN
│   ├── ReportIt (/admin/reportit)
│   ├── MCAO Lookup (/admin/mcao)
│   └── Upload MLS (/admin/upload)
├── Deals                          ← Placeholder (disabled)
├── Messages                       ← Placeholder (disabled)
├── Data Import                    ← Placeholder (disabled)
└── Forecasting                    ← Placeholder (disabled)

ADMINISTRATION
├── Settings (/admin/settings)
└── Automations                    ← Placeholder (disabled)
```

### 3.3 Implementation Details

**Reports Dropdown State:**
```typescript
const [reportsExpanded, setReportsExpanded] = useState(false)
```

**Placeholder Items:**
- Show as disabled (opacity-50, cursor-not-allowed)
- Optional: Toast "Coming Soon" on click
- Do NOT create routes for these yet

---

## Part 4: Dashboard Content Plan

### 4.1 Stat Cards (4 cards)

| Card | Icon | Color | Data Source | Initial Value |
|------|------|-------|-------------|---------------|
| Total Contacts | Users | Blue | `gsrealty_clients` COUNT | Dynamic |
| Active Deals | TrendingUp | Green | Mock data | "156" |
| Revenue | DollarSign | Yellow | Mock data | "$89.2K" |
| Meetings | Calendar | Purple | `gsrealty_event_entries` COUNT | Dynamic |

**Implementation:**
- Phase 1: Use mock data for Active Deals and Revenue
- Phase 2: Wire to real data via new API endpoint

### 4.2 Recent Contacts Card

**Layout:**
- Header: "Recent Contacts 👥" + Filter/Export buttons
- List: 5 most recent clients
- Each item: Avatar, Name, Company/Phone, Value, Status Badge

**Data Query:**
```typescript
const { data } = await supabase
  .from('gsrealty_clients')
  .select('id, first_name, last_name, email, phone, created_at')
  .order('created_at', { ascending: false })
  .limit(5)
```

**Status Badge Logic:**
- Active: Has activity in last 30 days
- Prospect: Created in last 7 days, no uploads
- Inactive: No activity in 60+ days

### 4.3 Sales Target / Performance Card

**Layout:**
- Header: "Sales Target 🎯" + Settings icon
- Monthly Target progress bar (mock: 68%)
- Quarterly Target progress bar (mock: 45%)
- Team Performance section (mock data)
- "Days left in month" counter (calculated)

**Implementation:**
- Use mock data initially
- Future: Connect to actual sales/deals tracking

### 4.4 Right Sidebar - Quick Actions

**New Actions:**
| Action | Icon | Behavior |
|--------|------|----------|
| Schedule Call | Phone | Open modal or link to calendar |
| Send Email | Mail | Open mailto: or email modal |
| Book Meeting | Calendar | Open CreateEventModal |
| Add Note | Plus | Open note creation modal |

### 4.5 Right Sidebar - Additional Sections

**Recent Activity (Keep Existing):**
- Activity items with colored status dots
- Time-based display

**Top Performers (New):**
```typescript
const topPerformers = [
  { name: 'Alex Smith', deals: 12, avatar: 'AS' },
  { name: 'Maria Garcia', deals: 9, avatar: 'MG' },
  { name: 'John Doe', deals: 7, avatar: 'JD' },
]
```

---

## Part 5: Implementation Phases

### Phase 1: Foundation (Low Risk) ✅ COMPLETE
**Estimated Effort:** 1-2 hours
**Completed:** January 15, 2026

- [x] Verify UI components exist (Avatar, Badge)
- [x] Review template styles match current CSS approach
- [x] Create backup branch before changes

**Files:** None modified

### Phase 2: Left Sidebar Restructure ✅ COMPLETE
**Estimated Effort:** 2-3 hours
**Completed:** January 15, 2026

- [x] Add `reportsExpanded` state to layout
- [x] Rename "Clients" display text to "Contacts"
- [x] Create Reports dropdown with sub-items
- [x] Add placeholder nav items (disabled state)
- [x] Update mobile sidebar to match
- [x] Test all existing routes still work
- [x] Build verified successful

**Files Modified:**
- `app/admin/layout.tsx` - Added 12 new icons, reportsExpanded state, new nav arrays, Reports dropdown
- `lib/rate-limit.ts` - Fixed pre-existing MapIterator TypeScript error

**Files NOT Modified:**
- All route handlers (`/admin/clients/*`, `/admin/mcao`, etc.)
- `useAuth` hook usage
- Sign out functionality

**New Navigation Structure Implemented:**
```
MAIN MENU
├── Contacts (/admin/clients) ✓
├── Analytics (disabled)
├── Sales Pipeline (disabled)
├── Calendar (disabled)
└── Campaigns (disabled)

CRM TOOLS
├── Reports ▼ (dropdown)
│   ├── ReportIt (/admin/reportit)
│   ├── MCAO Lookup (/admin/mcao)
│   └── Upload MLS (/admin/upload)
├── Deals (disabled)
├── Messages (disabled)
├── Data Import (disabled)
└── Forecasting (disabled)

ADMINISTRATION
├── Settings (/admin/settings) ✓
└── Automations (disabled)
```

### Phase 3: Dashboard Stat Cards ✅ COMPLETE
**Estimated Effort:** 2-3 hours
**Completed:** January 15, 2026

- [x] Update stat card array with new metrics (Total Contacts, Active Deals, Revenue, Meetings)
- [x] Add CRM-style icons and colors (Users, TrendingUp, DollarSign, Calendar)
- [x] Implement loading state for async data
- [x] Wire Total Contacts to real data via `getClientCount()`
- [x] Use mock data for Active Deals, Revenue, and Meetings
- [x] Update header card with "Dashboard 📊" title
- [x] Add search input and "Add Contact" button to header
- [x] Add Recent Contacts card placeholder (Phase 4)
- [x] Add Sales Target card with progress bars (mock data)
- [x] Build verified successful

**Files Modified:**
- `app/admin/page.tsx` - Complete rewrite with new CRM-style dashboard

**Key Changes:**
- New imports: `useEffect`, `Link`, `getClientCount`, new icons
- Added `statsLoading` and `dashboardStats` state
- 4 stat cards: Total Contacts (real), Active Deals, Revenue, Meetings (mock)
- Two-column layout with Recent Contacts and Sales Target cards
- Progress bars with gradient styling
- "Days left in month" calculator

### Phase 4: Dashboard Main Content ✅ COMPLETE
**Estimated Effort:** 3-4 hours
**Completed:** January 15, 2026

- [x] Add Recent Contacts card component
- [x] Implement contact list with avatars (initials-based AvatarFallback)
- [x] Add status badges (Active/Prospect/Inactive based on creation date)
- [x] Add Sales Target / Performance card
- [x] Implement progress bars with mock data (Monthly 68%, Quarterly 45%)
- [x] Add "Days left in month" calculator (dynamic)

**Files Modified:**
- `app/admin/page.tsx` - Complete dashboard with Recent Contacts and Sales Target cards

**Implementation Notes:**
- Recent Contacts fetches from `getAllClients()` directly (no separate API endpoint needed)
- Status logic: Prospect (≤7 days), Active (≤30 days), Inactive (>30 days)
- Mock values for contact deal amounts (randomized from preset list)
- Fixed TypeScript null/undefined handling for email and phone fields

### Phase 5: Right Sidebar Enhancement ✅ COMPLETE
**Estimated Effort:** 1-2 hours
**Completed:** January 15, 2026

- [x] Update QuickActionsPanel with new actions (Schedule Call, Send Email, Book Meeting, Add Note)
- [x] Add Top Performers section (mock data with avatars and rank badges)
- [x] Keep Recent Activity section (with colored status dots)
- [x] Remove "Getting Started Tip" card (N/A - never existed)
- [x] Connect "Book Meeting" action to CreateEventModal

**Files Modified:**
- `components/admin/QuickActionsPanel.tsx` - New CRM-style quick actions, Recent Activity, Top Performers
- `app/admin/layout.tsx` - Added CreateEventModal and onBookMeeting prop connection

**Implementation Notes:**
- Book Meeting button now opens CreateEventModal (moved from page.tsx to layout.tsx)
- Quick actions use lucide-react icons (Phone, Mail, Calendar, Plus)
- Top Performers shows ranked list with avatar initials and deal counts

### Phase 6: Polish & Testing
**Estimated Effort:** 1-2 hours

- [ ] Cross-browser testing
- [ ] Mobile responsive verification
- [ ] Auth flow testing (sign in/out)
- [ ] All existing routes accessible
- [ ] No console errors
- [ ] Performance check (no unnecessary re-renders)

---

## Part 6: File Change Summary

### Files to MODIFY

| File | Changes | Risk |
|------|---------|------|
| `app/admin/layout.tsx` | Nav restructure, Reports dropdown | Medium |
| `app/admin/page.tsx` | New stat cards, content sections | Medium |
| `components/admin/QuickActionsPanel.tsx` | New actions, Top Performers | Low |

### Files to CREATE

| File | Purpose |
|------|---------|
| `app/api/admin/dashboard/stats/route.ts` | Dashboard metrics API |
| `app/api/admin/dashboard/recent-clients/route.ts` | Recent contacts API |

### Files NOT to MODIFY (Auth Protected)

| File | Reason |
|------|--------|
| `contexts/AuthContext.tsx` | Core auth state |
| `middleware.ts` | Route protection |
| `lib/supabase/auth.ts` | Auth functions |
| `hooks/useAuth.ts` | Hook export |
| `app/layout.tsx` | AuthProvider wrapper |
| `app/admin/clients/*` | Existing functionality |
| `app/admin/mcao/page.tsx` | Existing functionality |
| `app/admin/reportit/page.tsx` | Existing functionality |
| `app/admin/upload/page.tsx` | Existing functionality |
| `app/admin/settings/page.tsx` | Existing functionality |

---

## Part 7: Rollback Plan

### If Issues Arise:

1. **Git Revert:** All changes are in single branch
   ```bash
   git checkout main
   git branch -D gsrealty-crm-broken
   git checkout -b gsrealty-crm
   ```

2. **Partial Rollback:** Revert specific files
   ```bash
   git checkout main -- app/admin/layout.tsx
   git checkout main -- app/admin/page.tsx
   ```

3. **Auth Issues:** If auth breaks, immediately revert:
   ```bash
   git checkout main -- contexts/AuthContext.tsx
   git checkout main -- middleware.ts
   ```

---

## Part 8: Testing Checklist

### Pre-Implementation
- [ ] Create feature branch from current state
- [ ] Verify dev server runs without errors
- [ ] Confirm auth flow works (sign in as admin)

### Post-Implementation
- [ ] Sign in as admin → redirects to /admin
- [ ] Sign out → redirects to home
- [ ] All nav items clickable and route correctly
- [ ] Reports dropdown expands/collapses
- [ ] Dashboard loads without console errors
- [ ] Stat cards display (mock or real data)
- [ ] Recent Contacts list renders
- [ ] Quick Actions buttons work
- [ ] Mobile sidebar functions correctly
- [ ] Existing pages (/admin/clients, /admin/mcao, etc.) still work

---

## Part 9: Visual Reference

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [Logo] GS Realty    │  Dashboard 📊                    │ Quick Actions ⚡│
│ Admin Panel         │  Welcome back! Here's your...    │                 │
│─────────────────────│──────────────────────────────────│─────────────────│
│ MAIN MENU           │  [Search...]  🔔  [+ Add Contact]│ 📞 Schedule Call│
│ 👥 Contacts ←active │                                  │ ✉️ Send Email   │
│ 📈 Analytics        │  ┌────────┬────────┬────────┬────│ 📅 Book Meeting │
│ 💰 Sales Pipeline   │  │Contacts│ Deals  │Revenue │Meet│ ➕ Add Note     │
│ 📅 Calendar         │  │ 2,847  │  156   │$89.2K  │ 24 │─────────────────│
│ 🎯 Campaigns        │  │ +12%   │  +8%   │ +23%   │ +5%│ Recent Activity │
│─────────────────────│  └────────┴────────┴────────┴────│ 📈              │
│ CRM TOOLS           │                                  │ • Contact added │
│ 📄 Reports ▼        │  ┌─────────────┬─────────────┐   │ • Deal closed   │
│   └─ ReportIt       │  │Recent       │Sales Target │   │ • Meeting set   │
│   └─ MCAO Lookup    │  │Contacts 👥  │🎯           │   │─────────────────│
│   └─ Upload MLS     │  │             │             │   │ Top Performers  │
│ 💼 Deals            │  │ [Avatar] SJ │ Monthly 68% │   │ 🏆              │
│ 💬 Messages         │  │ Sarah J.    │ ████████░░  │   │ #1 Alex Smith   │
│ 📥 Data Import      │  │ $12.5K      │             │   │ #2 Maria Garcia │
│ 📊 Forecasting      │  │             │ Quarterly   │   │ #3 John Doe     │
│─────────────────────│  │ [Avatar] MC │ 45%         │   │                 │
│ ADMINISTRATION      │  │ Michael C.  │ █████░░░░░  │   │                 │
│ ⚙️ Settings         │  │ $8.2K       │             │   │                 │
│ ⚡ Automations       │  └─────────────┴─────────────┘   │                 │
│─────────────────────│                                  │                 │
│ ❓ Contact Support  │                                  │                 │
│ 🚪 Sign Out         │                                  │                 │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Part 10: Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| Jan 2026 | Reports as dropdown | User preference, cleaner UI |
| Jan 2026 | CRM-style metrics | Match template aesthetic |
| Jan 2026 | Option B quick actions | Schedule Call, Send Email, Book Meeting, Add Note |
| Jan 2026 | Skip AI Chat card | Not relevant to current use case |
| Jan 2026 | Add Recent Contacts + Performance | User confirmed |
| Jan 2026 | Mock data for deals/revenue | Phase 1 - real data in future |

---

## Appendix A: Template Component Reference

**Template File:** `new-template/crm-dash-templ/components/crm-dashboard.tsx`

**Key Patterns to Adopt:**
- Glass card styling: `backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl`
- Hover transitions: `transition-all duration-700 ease-out hover:scale-[1.02]`
- Nav active state: `bg-white/20 text-white border border-white/30`
- Progress bars: `bg-gradient-to-r from-green-400 to-blue-500`

---

## Appendix B: Database Schema Reference

**Key Tables:**
```sql
gsrealty_clients (id, first_name, last_name, email, phone, created_at)
gsrealty_properties (id, client_id, apn, address, property_data)
gsrealty_uploaded_files (id, client_id, file_name, processed)
gsrealty_event_entries (id, title, tags, client_id, created_at)
gsrealty_mcao_data (id, apn, api_response, fetched_at)
```

**Count Queries:**
```typescript
// Total Contacts
supabase.from('gsrealty_clients').select('*', { count: 'exact', head: true })

// Meetings Count
supabase.from('gsrealty_event_entries').select('*', { count: 'exact', head: true })
  .gte('created_at', lastWeekDate)

// Recent Clients
supabase.from('gsrealty_clients')
  .select('id, first_name, last_name, email, created_at')
  .order('created_at', { ascending: false })
  .limit(5)
```

---

## Progress Summary

| Phase | Status | Completed |
|-------|--------|-----------|
| Phase 1: Foundation | ✅ Complete | Jan 15, 2026 |
| Phase 2: Left Sidebar | ✅ Complete | Jan 15, 2026 |
| Phase 3: Stat Cards | ✅ Complete | Jan 15, 2026 |
| Phase 4: Main Content | ✅ Complete | Jan 15, 2026 |
| Phase 5: Right Sidebar | ✅ Complete | Jan 15, 2026 |
| Phase 6: Polish & Testing | ⏳ Pending | - |

---

**Plan Status:** Implementation In Progress
**Current Phase:** Phase 6 - Polish & Testing
**Next Step:** Cross-browser testing, mobile responsive verification, auth flow testing
