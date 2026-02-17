# GS Site - Tiles Dialed Implementation Plan

**Created**: January 19, 2026
**Branch**: `tile-dialed`
**Alignment Score**: 9/10 (verified against TypeScript interfaces)
**Last Updated**: January 19, 2026

---

## Current Status

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Quick Wins | ✅ Complete | LLM Benchmarks + Form Deadlines Tile |
| Phase 2: Morning Form | ✅ Code Complete | Pending Notion DB property setup |
| Phase 3: Notifications | ✅ Code Complete | Pending Supabase tables + env vars |
| Phase 4: Complex Tiles | ✅ Code Complete | Habit Detail ✅, Photo Slideshow ✅, Budget ✅ |
| Phase 5: Admin Red Tails | ⏳ Not Started | Warning rules system |

---

## Decisions Made

- **Budget tile**: Manual entry (Supabase tables)
- **Photo storage**: Supabase Storage (upload through app)
- **Notifications**: SMS (Twilio) + Slack (webhooks) — both optional, use either or both
- **Cali Goals**: Notion Task List completion tracking

---

## Critical: Implementation Order for New Tiles

**To prevent import errors and API fetch failures, follow this order for each new tile:**

```
1. Database    → Create Supabase tables (if needed)
2. Types       → Create TypeScript types/interfaces
3. Lib/Client  → Create data fetching utilities
4. API Routes  → Create API endpoints (if needed)
5. Hooks       → Create React Query hooks
6. Component   → Create tile component file
7. Registry    → Add dynamic import to TileRegistry.tsx
8. Matcher     → Add to SPECIALIZED_TILES array
9. Definition  → Add tile to LOCAL_TILES in lib/data/tiles.ts
```

**Why this order matters:**
- TileRegistry imports must resolve → component must exist first
- Components fetch data → APIs must exist first
- APIs query database → tables must exist first

---

## Verified Type Alignment

All tile definitions use these verified types from `lib/types/tiles.ts`:

| Field | Type | Valid Values |
|-------|------|--------------|
| `id` | string | Use `local-*` prefix for new tiles |
| `name` | string | Unique, used for SPECIALIZED_TILES matching |
| `menu` | MenuCategory[] | ALL, Real Estate, Software, Org, Content, Health, Learn |
| `status` | TileStatus | Not started, In progress, Done |
| `shadcn` | ShadcnComponent[] | Button, Graphic, Chart, Form, Logic, Dropzone, Calendar & Date Picker, Pop-up, Toggle List, React plugin |
| `phase` | TilePhase[] | GS Site Standing, Morning, Evening |
| `thirdParty` | ThirdPartyIntegration[] | Logic, Notion, GitHub, Twilio, LIFX, etc. (17 valid values) |
| `actionWarning` | boolean | true/false |
| `actionDesc` | string \| null | Warning message or null |
| `priority` | TilePriority | "1", "2", "3", or null |
| `typeII` | TypeIICategory \| null | Button, Graph, Metric, Form, Counter, Calendar, Dropzone, Logic |

---

## Phase 1: Quick Wins ✅ COMPLETED

### LLM Benchmarks Edit ✅
- [x] Add `leanaileaderboard.com` to `BENCHMARK_SITES` array in `components/tiles/graphics/LLMBenchmarksTile.tsx`
- [x] Import `Gauge` icon from lucide-react (used for Lean AI Leaderboard)
- [x] Update tile preview count from "2 sites" to "3 sites"

### Form Deadlines Tile (New) ✅ — No API needed, pure frontend

**Implementation Order:**
1. [x] **Component**: Create `components/tiles/logic/FormTimingTile.tsx`
   - [x] Calculate days until next 1st-of-month (Monthly form)
   - [x] Calculate days until next quarter start (Jan 1, Apr 1, Jul 1, Oct 1)
   - [x] Add urgency color coding (green ≥14d, yellow 7-13d, red <7d)
2. [x] **Registry**: Add dynamic import to `TileRegistry.tsx` (lines 177-180)
3. [x] **Matcher**: Add to SPECIALIZED_TILES array (lines 501-507)
4. [x] **Definition**: Add tile to `lib/data/tiles.ts` LOCAL_TILES (id: "local-form-timing")

---

## Phase 2: Morning Form Edits ✅ CODE COMPLETE (Pending Notion Setup)

### Notion Database Setup (Manual) — USER ACTION REQUIRED
- [ ] Add `Teeth Grind Rating` property (Number, 1-5)
- [ ] Add `Retainer` property (Checkbox)
- [ ] Add `Shoulder Measurement` property (Number, inches)
- [ ] Add `Thigh Measurement` property (Number, inches)

### API Refactor ✅
- [x] Update `/api/notion/habits/update/route.ts` to support multiple property types:
  - [x] Accept `property`, `value`, `type` parameters
  - [x] Handle `number` type
  - [x] Handle `checkbox` type
  - [x] Maintain backward compatibility with `habit`/`completed` format
- [x] Add `updatePropertyForToday()` function to `lib/notion/habits.ts`

### Frontend Updates (`components/tiles/forms/MorningFormTile.tsx`) ✅
- [x] Add Teeth Grind Rating field (1-5 scale buttons, after Weight)
  - [x] State: `teethGrindRating`, `isSavingGrind`, `grindSaved`
  - [x] UI: 5 buttons with "None" to "Severe" labels
  - [x] Save inline on click
- [x] Add Retainer Y/N field (checkbox, after Teeth Grind)
  - [x] State: `retainer`, `isSavingRetainer`, `retainerSaved`
  - [x] UI: Checkbox button with "Wore Retainer" label
  - [x] Save inline on toggle
- [x] Add Body Measurements section (after Retainer)
  - [x] Shoulder Measurement input (number, inches, debounced save)
  - [x] Thigh Measurement input (number, inches, debounced save)
  - [x] States for each: value, isSaving, saved
- [x] Update `MorningFormModal` component with same fields

---

## Phase 3: Notification System ✅ CODE COMPLETE (Pending DB Setup + Env Vars)

### Database Setup — USER ACTION REQUIRED
Run the SQL in `lib/banners/migrations.sql` in Supabase SQL Editor:
- [ ] Create `banner_appearances` table
- [ ] Create `notification_preferences` table

### Environment Variables — USER ACTION REQUIRED
Add these to `.env.local` and Vercel:
- [ ] `TWILIO_ACCOUNT_SID` (optional - for SMS)
- [ ] `TWILIO_AUTH_TOKEN` (optional - for SMS)
- [ ] `TWILIO_PHONE_NUMBER` (optional - sender number for SMS)
- [ ] `STREAK_ALERT_PHONE` (optional - your phone for SMS alerts)
- [ ] `SLACK_WEBHOOK_URL` (optional - from Slack App > Incoming Webhooks)
- [ ] `CRON_SECRET` (for Vercel cron authentication)

**Note**: Configure either Twilio, Slack, or both. At least one is needed for alerts.

### Twilio SMS Client ✅
- [x] Create `lib/notifications/twilio.ts`
  - [x] `sendSMS(to: string, message: string)` function
  - [x] `formatStreakAlertMessage()` helper
  - [x] `isTwilioConfigured()` check

### Slack Webhook Client ✅
- [x] Create `lib/notifications/slack.ts`
  - [x] `sendSlackMessage()` function with Block Kit support
  - [x] `sendStreakAlertToSlack()` with rich formatting
  - [x] `isSlackConfigured()` check

### Masochist Moment Banner ✅
- [x] Create `lib/banners/masochist.ts`
  - [x] `shouldShowMasochistBanner()` - check time, monthly count, days since last
  - [x] `MASOCHIST_CHALLENGES` array (10 challenges)
  - [x] Config: max 3/month, 9AM-5PM MST, min 5 days between, 10% random chance
- [x] Create `components/MasochistBanner.tsx`
  - [x] Red/orange gradient styling
  - [x] Random challenge display
  - [x] "I Accept" and "Not Today" buttons
- [x] Create `/api/banners/masochist/check/route.ts`
- [x] Create `/api/banners/masochist/record/route.ts`

### Falling Off Warning Banner ✅
- [x] Create `lib/banners/falling-off.ts`
  - [x] `shouldShowFallingOffBanner()` - check habits data
  - [x] Trigger: 3+ habits at risk OR completion rate < 50%
  - [x] 24-hour cooldown between appearances
- [x] Create `components/FallingOffBanner.tsx`
  - [x] Dark/somber styling with warning icon
  - [x] Shows at-risk habits with streak counts
  - [x] Completion rate display
- [x] Create `/api/banners/falling-off/check/route.ts`
- [x] Create `/api/banners/falling-off/record/route.ts`

### Banner Integration ✅
- [x] Add banners to `/app/private/gs-site/page.tsx` after `<PhaseReminder />`
- [x] Banners stack vertically with spacing

### 8PM MST Streak Alert Cron ✅
- [x] Create `/api/cron/streak-alert/route.ts`
  - [x] Verify `CRON_SECRET`
  - [x] Query `getAllHabitStreaks()` from Notion
  - [x] Filter at-risk streaks (active streak, not completed today)
  - [x] Format message with habit names and streak counts
  - [x] Send to SMS (Twilio) and/or Slack (whichever are configured)
  - [x] Report per-channel success/failure in response
- [x] Add to `vercel.json`: `"schedule": "0 3 * * *"` (8PM MST)

---

## Phase 4: Complex Tiles

### Habit Detail Tile (New) ✅ COMPLETE — Uses existing Notion API + new endpoint

**Implementation Order:**
1. [x] **API**: Create `/api/notion/habits/completion-2026/route.ts`
   - [x] Filter records to 2026 only
   - [x] Calculate per-habit completion percentage
2. [x] **Hook**: Create `hooks/useHabitDetail.ts`
   - [x] Combine streaks + heatmap + 2026 completion data
3. [x] **Components**: Create tile and modal
   - [x] `components/tiles/graphics/HabitDetailTile.tsx`
     - [x] Compact tile: top habit streak + mini indicator
     - [x] Opens modal on click
   - [x] `components/tiles/graphics/HabitDetailModal.tsx` (inline in HabitDetailTile.tsx)
     - [x] List all habits with:
       - [x] Habit name + emoji
       - [x] Current streak count
       - [x] 7 dots for last 7 days (filled = completed)
       - [x] 2026 completion % progress bar
4. [x] **Registry**: Add dynamic import to `TileRegistry.tsx`:
   ```typescript
   const HabitDetailTile = dynamic(
     () => import('./graphics/HabitDetailTile').then(mod => ({ default: mod.HabitDetailTile })),
     { loading: () => <TileSkeleton variant="graphic" />, ssr: false }
   );
   ```
5. [x] **Matcher**: Add to SPECIALIZED_TILES array:
   ```typescript
   {
     match: (name) => name.toLowerCase() === 'habit detail' ||
                      name.toLowerCase().includes('habit specific'),
     component: HabitDetailTile,
   },
   ```
6. [x] **Definition**: Add tile to `lib/data/tiles.ts` LOCAL_TILES:
   ```typescript
   {
     id: "local-habit-detail",
     name: "Habit Detail",
     menu: ["Health", "Org"],
     status: "Not started",
     desc: "Per-habit streak counts, 7-day dots, and 2026 completion percentage",
     shadcn: ["Graphic", "Logic", "Chart"],
     phase: ["GS Site Standing"],
     thirdParty: ["Notion"],
     actionWarning: false,
     actionDesc: null,
     priority: "1",
     typeII: "Metric"
   }
   ```

### Photo Slideshow Tile (New) ✅ CODE COMPLETE — Supabase Storage + new tables

**Database Setup Required**: Run `lib/slideshow/migrations.sql` in Supabase + create Storage bucket `photo-slideshow`.

**Implementation Order:**
1. [ ] **Database**: Create Supabase Storage bucket + table (USER ACTION REQUIRED)
   - [ ] Run `lib/slideshow/migrations.sql` in Supabase SQL Editor
   - [ ] Create Storage bucket: `photo-slideshow` (public, 10MB limit)
2. [x] **Types**: Create `lib/slideshow/types.ts`
   - [x] `PhotoCategory` type: grub-villain, family, friends, habitat, dogs, quotes, inspo, linkedin-ppl
   - [x] `Photo` interface
3. [x] **Lib**: Create `lib/slideshow/categories.ts`
   - [x] Category definitions with icons and colors
4. [x] **APIs**: Create API routes
   - [x] `/api/slideshow/photos/route.ts` (GET)
   - [x] `/api/slideshow/upload/route.ts` (POST)
   - [x] `/api/slideshow/[photoId]/route.ts` (PATCH, DELETE)
5. [x] **Hook**: Create `hooks/usePhotoSlideshow.ts`
6. [x] **Components**: Create tile and modal
   - [x] `components/tiles/graphics/PhotoSlideshowTile.tsx`
     - [x] Mini carousel auto-advancing every 5 seconds
     - [x] Category badge, photo count
     - [x] Opens modal on click
   - [x] Modal inline in PhotoSlideshowTile.tsx
     - [x] Filter tabs: All | Grub Villain | Family | Friends | Habitat | Dogs | Quotes | Inspo | LinkedIn
     - [x] Full carousel with navigation arrows
     - [x] Add Photos button with file upload
     - [x] Delete photo functionality
7. [x] **Registry**: Add dynamic import to `TileRegistry.tsx`
8. [x] **Matcher**: Add to SPECIALIZED_TILES array
9. [x] **Definition**: Add tile to `lib/data/tiles.ts` LOCAL_TILES

### Budget Tile (New) ✅ CODE COMPLETE — Manual entry with Supabase tables

**Database Setup Required**: Run `lib/budget/migrations.sql` in Supabase SQL Editor.

**Implementation Order:**
1. [ ] **Database**: Create Supabase tables (USER ACTION REQUIRED)
   - [ ] Run `lib/budget/migrations.sql` in Supabase SQL Editor
2. [x] **Types**: Create `lib/budget/types.ts`
3. [x] **APIs**: Create API routes
   - [x] `/api/budget/entries/route.ts` (GET, POST)
   - [x] `/api/budget/summary/route.ts` (GET)
   - [x] `/api/budget/categories/route.ts` (GET, POST)
4. [x] **Hook**: Create `hooks/useBudgetData.ts`
5. [x] **Components**: Create tile and modal
   - [x] `components/tiles/graphics/BudgetTile.tsx`
     - [x] Progress ring: spent/total budget
     - [x] Current month label
     - [x] Warning indicator if over budget
     - [x] Opens modal on click
   - [x] Modal inline in BudgetTile.tsx
     - [x] Month selector
     - [x] Category-wise spending bars
     - [x] Quick expense entry form
     - [x] Recent transactions list
6. [x] **Registry**: Add dynamic import to `TileRegistry.tsx`
7. [x] **Matcher**: Add to SPECIALIZED_TILES array
8. [x] **Definition**: Add tile to `lib/data/tiles.ts` LOCAL_TILES

---

## Phase 5: Admin Red Tails System

### Warning Rules Data Structure
- [ ] Create `lib/admin/warning-rules.ts`
  - [ ] `WarningRule` interface with rule types:
    - [ ] `threshold` - metric < or > value
    - [ ] `service_status` - integration disconnected
    - [ ] `time_based` - not completed in X hours
    - [ ] `data_condition` - API response check
    - [ ] `custom` - reference existing test function
  - [ ] `getWarningRules()` - read from localStorage
  - [ ] `saveWarningRule()` - write to localStorage
  - [ ] `deleteWarningRule()` - remove from localStorage

### Rule Evaluation Engine
- [ ] Update `lib/integrations/warning-tests.ts`
  - [ ] `shouldShowWarning()` - check rule-based system first, fall back to hardcoded
  - [ ] `evaluateRule()` - dispatch to type-specific evaluators
  - [ ] `evaluateThreshold()` - compare metric against value
  - [ ] `evaluateServiceStatus()` - check integration connections
  - [ ] `evaluateTimeBased()` - check last completion timestamp
  - [ ] `evaluateDataCondition()` - fetch API and check response

### Admin UI
- [ ] Create `/app/admin/warnings/page.tsx`
  - [ ] List all tiles with current warning status
  - [ ] Quick toggle to enable/disable warnings
  - [ ] Filter by: Active warnings, Configured, None
- [ ] Create `components/admin/WarningRuleForm.tsx`
  - [ ] Rule type dropdown
  - [ ] Type-specific configuration forms:
    - [ ] Threshold: metric select, operator, value, data source
    - [ ] Service Status: multi-select services, require all/any
    - [ ] Time-based: frequency, grace period hours
    - [ ] Data Condition: API endpoint, JSON path, condition
    - [ ] Custom: test name dropdown
  - [ ] Warning message input
  - [ ] Severity selector (low/medium/high)
  - [ ] Test Rule button
  - [ ] Save/Cancel buttons

### Integration
- [ ] Update `hooks/useConnectionHealth.ts` to use rule-based system
- [ ] Update `components/tiles/WarningBorderTrail.tsx` to accept severity prop
- [ ] Add link to warnings admin in `/app/admin/page.tsx`

---

## Files Reference

### Critical Files to Modify
- `components/tiles/graphics/LLMBenchmarksTile.tsx` - Add leanaileaderboard.com
- `components/tiles/forms/MorningFormTile.tsx` - Add new fields
- `app/api/notion/habits/update/route.ts` - Support multiple property types
- `lib/notion/habits.ts` - Add updatePropertyForToday()
- `app/private/gs-site/page.tsx` - Add banner components
- `lib/integrations/warning-tests.ts` - Rule-based evaluation
- `hooks/useConnectionHealth.ts` - Use new warning system
- `vercel.json` - Add streak-alert cron

### New Files to Create
- `components/tiles/logic/FormTimingTile.tsx`
- `components/tiles/graphics/HabitDetailTile.tsx`
- `components/tiles/graphics/HabitDetailModal.tsx`
- `components/tiles/graphics/PhotoSlideshowTile.tsx`
- `components/tiles/graphics/PhotoSlideshowModal.tsx`
- `components/tiles/graphics/BudgetTile.tsx`
- `components/tiles/graphics/BudgetModal.tsx`
- `components/MasochistBanner.tsx`
- `components/FallingOffBanner.tsx`
- `lib/banners/masochist.ts`
- `lib/banners/falling-off.ts`
- `lib/notifications/twilio.ts`
- `lib/slideshow/types.ts`
- `lib/slideshow/categories.ts`
- `lib/budget/types.ts`
- `lib/budget/client.ts`
- `lib/admin/warning-rules.ts`
- `hooks/useHabitDetail.ts`
- `hooks/usePhotoSlideshow.ts`
- `hooks/useBudgetData.ts`
- `app/api/cron/streak-alert/route.ts`
- `app/api/banners/masochist/check/route.ts`
- `app/api/banners/masochist/record/route.ts`
- `app/api/banners/falling-off/check/route.ts`
- `app/api/banners/falling-off/record/route.ts`
- `app/api/notion/habits/completion-2026/route.ts`
- `app/api/slideshow/photos/route.ts`
- `app/api/slideshow/upload/route.ts`
- `app/api/slideshow/[photoId]/route.ts`
- `app/api/budget/entries/route.ts`
- `app/api/budget/summary/route.ts`
- `app/api/budget/categories/route.ts`
- `app/admin/warnings/page.tsx`
- `components/admin/WarningRuleForm.tsx`

---

## Environment Variables Needed

```bash
# Twilio (for SMS notifications)
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx

# Your phone number for alerts
STREAK_ALERT_PHONE=+1xxxxxxxxxx
```

---

## Notes

- All tiles use 112px height and open popups/modals for complex content
- Follow existing patterns in `TileRegistry.tsx` for component registration
- Use React Query hooks for data fetching (follow existing patterns)
- MST timezone: UTC-7 (no DST adjustment needed)
- Non-sleep hours for banners: 9AM - 5PM MST

---

## Tile Loading Flow (Verified)

```
lib/data/tiles.ts (LOCAL_TILES)
         ↓
hooks/useTiles.ts (imports directly, applies EXCLUDED_TILE_NAMES filter)
         ↓
hooks/useDualFilter.ts (filters by MenuCategory + TypeII)
         ↓
components/tiles/TileRegistry.tsx → TileDispatcher:
    1. Check SPECIALIZED_TILES array (name-based match)
    2. Fall back to TILE_COMPONENTS (shadcn type-based)
    3. Ultimate fallback: ButtonTile
```

**Key Files:**
- `lib/data/tiles.ts` — Source of truth for tile definitions (LOCAL_TILES array)
- `lib/types/tiles.ts` — TypeScript interfaces (Tile, ShadcnComponent, etc.)
- `components/tiles/TileRegistry.tsx` — Component dispatch logic
- `hooks/useTiles.ts` — Tile loading hook (excludes certain tiles at runtime)

**Runtime Exclusions** (tiles in LOCAL_TILES but hidden from UI):
- 'forms (monthly) & printoff'
- 'forms (quarterly) & printoff'
- 'physically print weeklies'
- 'physically print tomorrow daily'
- 'gs site admin'
- 'youtube wrapper'

**TileComponentProps Interface:**
```typescript
interface TileComponentProps {
  tile: Tile;
  className?: string;
}
```
All tile components must accept these props.
