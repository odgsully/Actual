# Sales Campaigns Kanban Board - Implementation Plan

## Overview
Build a Sales Campaigns Kanban board for `gsrealty-client` with drag-and-drop functionality, Supabase persistence, and glassmorphism UI styling.

**Kanban Stages:** Ideas → Planning → Active → Completed
**Card Fields:** Title, Description, Priority, Due Date
**DnD Library:** @dnd-kit/core

---

## Phase 1: Database Setup

### Migration SQL
Create `gsrealty_campaigns` table in Supabase:

```sql
CREATE TABLE gsrealty_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TIMESTAMP WITH TIME ZONE,
  stage VARCHAR(20) NOT NULL DEFAULT 'ideas' CHECK (stage IN ('ideas', 'planning', 'active', 'completed')),
  position INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_campaigns_stage_position ON gsrealty_campaigns(stage, position);
ALTER TABLE gsrealty_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage campaigns"
  ON gsrealty_campaigns FOR ALL TO authenticated USING (true);
```

---

## Phase 2: Install Dependencies

```bash
cd apps/gsrealty-client && npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

---

## Phase 3: File Structure

```
apps/gsrealty-client/
├── app/admin/campaigns/
│   └── page.tsx                          # Main Kanban page
├── components/admin/campaigns/
│   ├── KanbanBoard.tsx                   # DndContext wrapper + state
│   ├── KanbanColumn.tsx                  # Droppable stage column
│   ├── KanbanCard.tsx                    # Draggable campaign card
│   ├── CreateCampaignModal.tsx           # New campaign form
│   └── EditCampaignModal.tsx             # Edit campaign form
├── lib/database/
│   └── campaigns.ts                      # CRUD operations
└── app/api/admin/campaigns/
    ├── route.ts                          # GET all, POST create
    └── [id]/route.ts                     # PATCH, DELETE single
```

---

## Phase 4: Implementation Steps

### Step 1: Create database layer
**File:** `apps/gsrealty-client/lib/database/campaigns.ts`

Functions to implement:
- `getAllCampaigns()` - Fetch all campaigns ordered by stage/position
- `createCampaign(input)` - Create with auto-position
- `updateCampaign(id, input)` - Update fields including stage/position
- `deleteCampaign(id)` - Delete campaign
- `updateCampaignPositions(updates)` - Batch update for drag-and-drop

Pattern reference: `lib/database/clients.ts`

### Step 2: Create API routes
**File:** `apps/gsrealty-client/app/api/admin/campaigns/route.ts`
- GET: Return all campaigns
- POST: Create new campaign

**File:** `apps/gsrealty-client/app/api/admin/campaigns/[id]/route.ts`
- PATCH: Update campaign (including stage/position changes)
- DELETE: Delete campaign

### Step 3: Create KanbanCard component
**File:** `apps/gsrealty-client/components/admin/campaigns/KanbanCard.tsx`

```tsx
// Key patterns:
// - useSortable hook from @dnd-kit/sortable
// - Glassmorphism: bg-white/5 border-white/10 rounded-xl
// - Priority badges with color variants
// - Click handler to open edit modal
```

### Step 4: Create KanbanColumn component
**File:** `apps/gsrealty-client/components/admin/campaigns/KanbanColumn.tsx`

```tsx
// Key patterns:
// - useDroppable hook from @dnd-kit/core
// - glass-card styling for column container
// - Stage header with icon and count badge
// - SortableContext wrapping cards
```

### Step 5: Create modal components
**Files:** `CreateCampaignModal.tsx`, `EditCampaignModal.tsx`

Pattern reference: `components/admin/CreateEventModal.tsx`
- Form fields: title (required), description, priority select, due date picker
- Glassmorphism modal styling
- Loading states and error handling

### Step 6: Create KanbanBoard component
**File:** `apps/gsrealty-client/components/admin/campaigns/KanbanBoard.tsx`

```tsx
// Key patterns:
// - DndContext with closestCorners collision detection
// - Local state for optimistic updates
// - handleDragEnd for stage/position updates
// - 4-column grid layout
```

### Step 7: Create page component
**File:** `apps/gsrealty-client/app/admin/campaigns/page.tsx`

```tsx
// Key patterns:
// - Fetch campaigns on mount
// - Header card with "New Campaign" button
// - KanbanBoard with refresh callback
// - Loading skeleton with glass-card styling
```

### Step 8: Enable navigation
**File:** `apps/gsrealty-client/app/admin/layout.tsx` (line 54)

Change:
```tsx
{ name: 'Campaigns', href: '#', icon: Target, disabled: true },
```
To:
```tsx
{ name: 'Campaigns', href: '/admin/campaigns', icon: Target },
```

---

## Phase 5: UI Styling Reference

### Priority Badge Colors
```tsx
const priorityColors = {
  low: 'bg-gray-500/20 text-gray-400 border-gray-400/30',
  medium: 'bg-blue-500/20 text-blue-400 border-blue-400/30',
  high: 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30',
  urgent: 'bg-red-500/20 text-red-400 border-red-400/30',
};
```

### Stage Configuration
```tsx
const stageConfig = {
  ideas: { title: 'Ideas', icon: Lightbulb, color: 'text-purple-400' },
  planning: { title: 'Planning', icon: FileText, color: 'text-blue-400' },
  active: { title: 'Active', icon: Zap, color: 'text-green-400' },
  completed: { title: 'Completed', icon: CheckCircle, color: 'text-gray-400' },
};
```

### Card Styling
```tsx
<div className="bg-white/5 border border-white/10 rounded-xl p-4
               hover:bg-white/10 transition-all duration-300 cursor-grab">
```

---

## Verification

1. **Create campaign:** Click "New Campaign" → fill form → verify appears in Ideas column
2. **Drag between stages:** Drag card from Ideas → Planning → verify stage persists after refresh
3. **Reorder within stage:** Drag cards to reorder → verify position persists
4. **Edit campaign:** Click card → modify fields → save → verify changes persist
5. **Delete campaign:** Click delete in edit modal → confirm → verify removed
6. **Auth check:** Sign out → navigate to /admin/campaigns → verify redirects to signin

---

## Critical Files

| File | Purpose |
|------|---------|
| `app/admin/layout.tsx:54` | Enable Campaigns nav link |
| `lib/database/clients.ts` | CRUD pattern reference |
| `components/admin/CreateEventModal.tsx` | Modal pattern reference |
| `app/globals.css:78-106` | Glassmorphism classes |
