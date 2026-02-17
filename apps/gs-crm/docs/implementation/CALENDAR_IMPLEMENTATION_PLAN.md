# GSRealty Calendar Implementation Plan

## Overview

Build a Calendar page for GSRealty CRM that syncs with the Notion "Task List" database, filtered by `Project = "RealtyOne"`. Supports viewing, creating, and editing tasks.

---

## Upstream & Downstream Impact Summary

### Upstream Dependencies (Must Exist Before Implementation)

| Dependency | Status | Notes |
|------------|--------|-------|
| Notion API Key | ⚠️ Required | Must be added to `.env.local` |
| Notion Integration Access | ⚠️ Required | Integration must have access to "Task List" database |
| `@notionhq/client` package | ❌ Not installed | Must add to package.json |
| `date-fns` package | ❌ Not installed | Must add for date manipulation |
| `react-day-picker` package | ❌ Not installed | Must add for date picker component |
| `@radix-ui/react-popover` | ❌ Not installed | Must add for dropdown/popover components |
| Admin layout nav item | ✅ Exists | Needs href update from `#` to `/admin/calendar` |

### Downstream Impacts (Systems Affected by This Implementation)

| System | Impact | Action Required |
|--------|--------|-----------------|
| **Dashboard** | Should display upcoming tasks | Future: Add upcoming tasks widget |
| **Client Detail Page** | Tasks could link to clients | Future: Add `client_id` relation |
| **Outreach Logging** | Calendar events may become logged activities | Future: Connect to `gsrealty_outreach` |
| **QuickActionsPanel** | "Book Meeting" currently opens `CreateEventModal` | Evaluate: Should this also create Notion tasks? |
| **Notification System** | Users need task reminders | Future: Add notification integration |

---

## Notion Database Reference

**Database Name**: Task List
**Database ID**: `1c1cf08f-4499-803d-b5df-000b0d8c6e11`
**Filter**: `Project` select equals `"RealtyOne"`

### Properties Schema

| Property | ID | Type | Description | Required for Calendar |
|----------|-----|------|-------------|----------------------|
| `Task` | `title` | title | Task name | ✅ Yes |
| `Date` | `Sl@P` | date | Start/end datetime | ✅ Yes |
| `Project` | `d_c~` | select | Must be "RealtyOne" | ✅ Yes (auto-set) |
| `Priority` | `XWPx` | select | S/A/B/C Tier | Optional |
| `Tags` | `>ZB=` | multi_select | HABIT, NETWORK, etc. | Optional |
| `Notes` | `IPXl` | rich_text | Task details | Optional |
| `Mins Exp` | `{DjD` | number | Expected duration | Optional |
| `Created At` | `UxyE` | created_time | Auto-set | Read-only |
| `Part _ of Multiple?` | `Fq?p` | checkbox | Multi-part task | Optional |
| `Doc'd for Context?` | `x\Ym` | checkbox | Documentation flag | Optional |

### Sample Task Response

```json
{
  "id": "1c4cf08f-4499-800a-8c20-f4a1a32a08c9",
  "properties": {
    "Task": {
      "title": [{ "plain_text": "Setup a in person meet with Brian Juris" }]
    },
    "Date": {
      "date": {
        "start": "2025-03-28T08:20:00.000-07:00",
        "end": "2025-03-28T08:30:00.000-07:00"
      }
    },
    "Project": {
      "select": { "name": "RealtyOne", "color": "pink" }
    },
    "Priority": {
      "select": { "name": "S Tier", "color": "blue" }
    },
    "Tags": {
      "multi_select": [{ "name": "NETWORK", "color": "red" }]
    },
    "Notes": {
      "rich_text": [{ "plain_text": "Discuss listing strategy" }]
    },
    "Mins Exp": {
      "number": 30
    }
  }
}
```

### Project Select Option

When creating tasks, use this exact value:
```json
{
  "Project": {
    "select": {
      "name": "RealtyOne"
    }
  }
}
```

### Priority Options

| Value | Color | Calendar Color |
|-------|-------|----------------|
| `S Tier` | blue | `bg-blue-500/30 text-blue-400` |
| `A Tier` | default | `bg-white/20 text-white` |
| `B Tier` | orange | `bg-orange-500/30 text-orange-400` |
| `C tier` | brown | `bg-amber-700/30 text-amber-400` |

### Tags Options (Available)

- `HABIT` (purple)
- `NETWORK` (red)
- `PROMPT` (pink)
- `DEEP RESEARCH` (blue)
- `PERSONAL` (green)
- `ORGANIZED` (orange)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Calendar Page                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ CalendarHeader (month nav, view toggle, add btn)    │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ CalendarGrid (month view with day cells)            │    │
│  │  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐       │    │
│  │  │ Sun │ Mon │ Tue │ Wed │ Thu │ Fri │ Sat │       │    │
│  │  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤       │    │
│  │  │     │  1  │  2  │  3  │  4  │  5  │  6  │       │    │
│  │  │     │ ░░░ │     │ ░░░ │     │     │     │       │    │
│  │  │     │ ░░░ │     │     │     │     │     │       │    │
│  │  └─────┴─────┴─────┴─────┴─────┴─────┴─────┘       │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ TaskSlideOut (detail/edit panel - slides from right)│    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
apps/gsrealty-client/
├── app/
│   ├── admin/
│   │   ├── calendar/
│   │   │   └── page.tsx              # Main calendar page
│   │   └── layout.tsx                # Update nav item here
│   └── api/
│       └── admin/
│           └── calendar/
│               └── route.ts          # API endpoint for Notion sync
├── components/
│   └── admin/
│       └── calendar/
│           ├── index.ts              # Exports
│           ├── CalendarHeader.tsx    # Month nav, view toggle, add button
│           ├── CalendarGrid.tsx      # Month view grid
│           ├── CalendarDayCell.tsx   # Individual day cell
│           ├── CalendarEventCard.tsx # Task card in cell
│           ├── TaskSlideOut.tsx      # Detail/edit slide-out panel
│           ├── CreateTaskModal.tsx   # New task creation modal
│           └── DatePickerInput.tsx   # Reusable date picker component
└── lib/
    ├── notion/
    │   ├── calendar.ts               # Notion API wrapper functions
    │   ├── errors.ts                 # NotionError class and parser
    │   └── retry.ts                  # Retry logic with exponential backoff
    ├── query/
    │   └── calendar.ts               # React Query hooks for calendar
    └── utils/
        └── timezone.ts               # Timezone conversion utilities
```

---

## Implementation Steps

### Step 0: Install Dependencies (REQUIRED FIRST)

Before any implementation, install required packages:

```bash
npm install @notionhq/client date-fns react-day-picker @radix-ui/react-popover
```

**Package purposes:**
- `@notionhq/client` - Official Notion SDK for API calls
- `date-fns` - Date manipulation (startOfMonth, endOfMonth, format, parse, etc.)
- `react-day-picker` - Accessible date picker component
- `@radix-ui/react-popover` - Popover for date picker dropdown

**Verify installation:**
```bash
npm ls @notionhq/client date-fns react-day-picker @radix-ui/react-popover
```

---

### Step 1: Notion API Wrapper

**File**: `lib/notion/calendar.ts`

```typescript
import { Client } from '@notionhq/client'

const notion = new Client({ auth: process.env.NOTION_API_KEY })

const TASK_LIST_DB_ID = '1c1cf08f-4499-803d-b5df-000b0d8c6e11'
const REALTYONE_PROJECT_ID = '1f1bbadb-144d-476b-87d9-67de1d69135f'

export interface CalendarTask {
  id: string
  title: string
  start: string | null        // ISO datetime
  end: string | null          // ISO datetime (optional)
  allDay: boolean
  priority: 'S Tier' | 'A Tier' | 'B Tier' | 'C tier' | null
  tags: string[]
  notes: string
  minsExpected: number | null
  notionUrl: string
  createdAt: string
}

export interface CreateTaskInput {
  title: string
  start: string               // ISO datetime or YYYY-MM-DD
  end?: string                // Optional end time
  priority?: 'S Tier' | 'A Tier' | 'B Tier' | 'C tier'
  tags?: string[]
  notes?: string
  minsExpected?: number
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  id: string
}

/**
 * Fetch RealtyOne tasks within a date range
 */
export async function fetchRealtyOneTasks(
  startDate: string,  // YYYY-MM-DD
  endDate: string     // YYYY-MM-DD
): Promise<{ tasks: CalendarTask[]; error: Error | null }>

/**
 * Create a new task in Notion
 * Auto-sets Project to "RealtyOne"
 */
export async function createNotionTask(
  input: CreateTaskInput
): Promise<{ task: CalendarTask | null; error: Error | null }>

/**
 * Update an existing task
 */
export async function updateNotionTask(
  input: UpdateTaskInput
): Promise<{ task: CalendarTask | null; error: Error | null }>

/**
 * Delete a task (move to trash in Notion)
 */
export async function deleteNotionTask(
  taskId: string
): Promise<{ success: boolean; error: Error | null }>
```

**Environment Variable Required**:
```bash
NOTION_API_KEY=secret_xxx
```

**Note**: The Notion MCP tools are available in the codebase. Use them directly:
- `mcp__notion__API-query-data-source` for fetching
- `mcp__notion__API-post-page` for creating
- `mcp__notion__API-patch-page` for updating

---

### Step 2: API Route

**File**: `app/api/admin/calendar/route.ts`

```typescript
// GET /api/admin/calendar?start=2026-01-01&end=2026-01-31
// Returns: { tasks: CalendarTask[] }

// POST /api/admin/calendar
// Body: CreateTaskInput
// Returns: { task: CalendarTask }

// PATCH /api/admin/calendar
// Body: UpdateTaskInput
// Returns: { task: CalendarTask }

// DELETE /api/admin/calendar?id=xxx
// Returns: { success: boolean }
```

**Caching Strategy**:
- Cache GET responses for 60 seconds (stale-while-revalidate)
- Invalidate cache on POST/PATCH/DELETE
- Use `unstable_cache` from Next.js or React Query on client

---

### Step 3: Calendar Page

**File**: `app/admin/calendar/page.tsx`

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  CalendarHeader,
  CalendarGrid,
  TaskSlideOut,
  CreateTaskModal
} from '@/components/admin/calendar'
import type { CalendarTask } from '@/lib/notion/calendar'

export default function CalendarPage() {
  // Current month being viewed
  const [currentDate, setCurrentDate] = useState(new Date())

  // Tasks for current month
  const [tasks, setTasks] = useState<CalendarTask[]>([])
  const [loading, setLoading] = useState(true)

  // Selected task for slide-out
  const [selectedTask, setSelectedTask] = useState<CalendarTask | null>(null)
  const [slideOutOpen, setSlideOutOpen] = useState(false)

  // Create modal
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createDate, setCreateDate] = useState<string | null>(null)

  // Fetch tasks for current month
  const fetchTasks = useCallback(async () => {
    const start = startOfMonth(currentDate)
    const end = endOfMonth(currentDate)
    // API call...
  }, [currentDate])

  // Navigation handlers
  const goToPrevMonth = () => { /* ... */ }
  const goToNextMonth = () => { /* ... */ }
  const goToToday = () => { /* ... */ }

  // Task handlers
  const handleTaskClick = (task: CalendarTask) => {
    setSelectedTask(task)
    setSlideOutOpen(true)
  }

  const handleDayClick = (date: string) => {
    setCreateDate(date)
    setCreateModalOpen(true)
  }

  const handleTaskCreate = async (input: CreateTaskInput) => { /* ... */ }
  const handleTaskUpdate = async (input: UpdateTaskInput) => { /* ... */ }
  const handleTaskDelete = async (taskId: string) => { /* ... */ }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="glass-card p-6">
        <CalendarHeader
          currentDate={currentDate}
          onPrevMonth={goToPrevMonth}
          onNextMonth={goToNextMonth}
          onToday={goToToday}
          onAddTask={() => setCreateModalOpen(true)}
        />
      </Card>

      {/* Calendar Grid */}
      <Card className="glass-card p-6">
        <CalendarGrid
          currentDate={currentDate}
          tasks={tasks}
          loading={loading}
          onTaskClick={handleTaskClick}
          onDayClick={handleDayClick}
        />
      </Card>

      {/* Task Slide-Out */}
      <TaskSlideOut
        isOpen={slideOutOpen}
        task={selectedTask}
        onClose={() => setSlideOutOpen(false)}
        onUpdate={handleTaskUpdate}
        onDelete={handleTaskDelete}
      />

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={createModalOpen}
        defaultDate={createDate}
        onClose={() => {
          setCreateModalOpen(false)
          setCreateDate(null)
        }}
        onCreate={handleTaskCreate}
      />
    </div>
  )
}
```

---

### Step 4: Calendar Components

#### CalendarHeader.tsx

```typescript
interface CalendarHeaderProps {
  currentDate: Date
  onPrevMonth: () => void
  onNextMonth: () => void
  onToday: () => void
  onAddTask: () => void
}

// Features:
// - Month/Year display (e.g., "January 2026")
// - Prev/Next month arrows
// - "Today" button
// - "Add Task" button (primary CTA)
// - Glassmorphism styling
```

#### CalendarGrid.tsx

```typescript
interface CalendarGridProps {
  currentDate: Date
  tasks: CalendarTask[]
  loading: boolean
  onTaskClick: (task: CalendarTask) => void
  onDayClick: (date: string) => void  // YYYY-MM-DD
}

// Features:
// - 7-column grid (Sun-Sat)
// - Day headers
// - 5-6 rows for weeks
// - Days outside current month shown muted
// - Today highlighted
// - Click empty space to add task on that day
```

#### CalendarDayCell.tsx

```typescript
interface CalendarDayCellProps {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  tasks: CalendarTask[]
  onTaskClick: (task: CalendarTask) => void
  onDayClick: () => void
}

// Features:
// - Date number in corner
// - List of task cards (max 3 visible, "+N more" if overflow)
// - Click day background to create task
// - Hover state with "+" icon
```

#### CalendarEventCard.tsx

```typescript
interface CalendarEventCardProps {
  task: CalendarTask
  onClick: () => void
  compact?: boolean  // For overflow/small display
}

// Features:
// - Priority color indicator (left border or dot)
// - Task title (truncated if needed)
// - Time display if not all-day
// - Tag badges (first 1-2 only in compact mode)
// - Hover state
```

**Styling Example**:
```tsx
<div
  className={`
    px-2 py-1 rounded-lg text-xs cursor-pointer
    transition-all duration-300 hover:scale-[1.02]
    ${getPriorityClasses(task.priority)}
  `}
  onClick={onClick}
>
  <div className="flex items-center gap-1">
    {task.start && !task.allDay && (
      <span className="text-white/60 font-mono">
        {formatTime(task.start)}
      </span>
    )}
    <span className="text-white truncate">{task.title}</span>
  </div>
</div>

// Priority classes helper:
function getPriorityClasses(priority: string | null) {
  switch (priority) {
    case 'S Tier': return 'bg-blue-500/30 border-l-2 border-blue-400'
    case 'A Tier': return 'bg-white/20 border-l-2 border-white/40'
    case 'B Tier': return 'bg-orange-500/30 border-l-2 border-orange-400'
    case 'C tier': return 'bg-amber-700/30 border-l-2 border-amber-400'
    default: return 'bg-white/10 border-l-2 border-white/20'
  }
}
```

#### TaskSlideOut.tsx

```typescript
interface TaskSlideOutProps {
  isOpen: boolean
  task: CalendarTask | null
  onClose: () => void
  onUpdate: (input: UpdateTaskInput) => Promise<void>
  onDelete: (taskId: string) => Promise<void>
}

// Features:
// - Slides in from right (fixed position)
// - Backdrop blur overlay
// - Close button (X)
// - Task title (editable)
// - Date/time picker
// - Priority dropdown
// - Tags multi-select
// - Notes textarea
// - Duration input (Mins Expected)
// - Save button
// - Delete button (with confirmation)
// - Link to Notion page
```

**Slide-out Structure**:
```tsx
{isOpen && (
  <>
    {/* Backdrop */}
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
      onClick={onClose}
    />

    {/* Panel */}
    <div className="fixed right-0 top-0 h-full w-full max-w-md bg-gray-900/95 backdrop-blur-xl border-l border-white/10 z-50 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <h2 className="text-xl font-bold text-white">Task Details</h2>
        <button onClick={onClose}>
          <X className="w-5 h-5 text-white/60" />
        </button>
      </div>

      {/* Form fields */}
      <div className="p-6 space-y-6">
        {/* Title input */}
        {/* Date picker */}
        {/* Priority select */}
        {/* Tags multi-select */}
        {/* Notes textarea */}
        {/* Duration input */}
      </div>

      {/* Actions */}
      <div className="p-6 border-t border-white/10 flex justify-between">
        <Button variant="destructive" onClick={handleDelete}>
          Delete
        </Button>
        <Button onClick={handleSave}>
          Save Changes
        </Button>
      </div>
    </div>
  </>
)}
```

#### CreateTaskModal.tsx

```typescript
interface CreateTaskModalProps {
  isOpen: boolean
  defaultDate: string | null  // YYYY-MM-DD from day click
  onClose: () => void
  onCreate: (input: CreateTaskInput) => Promise<void>
}

// Features:
// - Modal overlay
// - Title input (required)
// - Date picker (pre-filled if defaultDate)
// - Time inputs (optional - start/end)
// - Priority dropdown
// - Tags multi-select
// - Notes textarea
// - Duration input
// - Cancel/Create buttons
```

---

### Step 5: Enable Nav Item

**File**: `app/admin/layout.tsx`

Find the Calendar nav item in the `mainMenuItems` array (around line 56) and update **both** the `href` and remove `disabled`:

```tsx
// CURRENT (disabled with placeholder href):
{ name: 'Calendar', href: '#', icon: Calendar, disabled: true },

// CHANGE TO (enabled with real route):
{ name: 'Calendar', href: '/admin/calendar', icon: Calendar },
```

**Important**: The current code has `href: '#'` which must be changed to `/admin/calendar`. Simply removing `disabled` is not sufficient.

---

## Notion API Integration Details

### Query Tasks (GET)

Using MCP tool `mcp__notion__API-query-data-source`:

```typescript
const response = await mcp__notion__API-query-data-source({
  data_source_id: '1c1cf08f-4499-803d-b5df-000b0d8c6e11',
  filter: {
    and: [
      {
        property: 'Project',
        select: { equals: 'RealtyOne' }
      },
      {
        property: 'Date',
        date: { is_not_empty: true }
      },
      {
        property: 'Date',
        date: { on_or_after: '2026-01-01' }
      },
      {
        property: 'Date',
        date: { on_or_before: '2026-01-31' }
      }
    ]
  },
  sorts: [
    { property: 'Date', direction: 'ascending' }
  ]
})
```

### Create Task (POST)

Using MCP tool `mcp__notion__API-post-page`:

```typescript
const response = await mcp__notion__API-post-page({
  parent: {
    database_id: '1c1cf08f-4499-803d-b5df-000b0d8c6e11'
  },
  properties: {
    // Task title (required)
    Task: {
      title: [
        {
          text: { content: 'Meeting with client' }
        }
      ]
    },
    // Date (required)
    Date: {
      date: {
        start: '2026-01-20T10:00:00',
        end: '2026-01-20T11:00:00'  // Optional
      }
    },
    // Project = RealtyOne (required - auto-set)
    Project: {
      select: { name: 'RealtyOne' }
    },
    // Priority (optional)
    Priority: {
      select: { name: 'A Tier' }
    },
    // Tags (optional)
    Tags: {
      multi_select: [
        { name: 'NETWORK' }
      ]
    },
    // Notes (optional)
    Notes: {
      rich_text: [
        { text: { content: 'Discuss listing strategy' } }
      ]
    },
    // Duration (optional)
    'Mins Exp': {
      number: 60
    }
  }
})
```

### Update Task (PATCH)

Using MCP tool `mcp__notion__API-patch-page`:

```typescript
const response = await mcp__notion__API-patch-page({
  page_id: 'task-id-here',
  properties: {
    // Only include properties being updated
    Task: {
      title: [{ text: { content: 'Updated title' } }]
    },
    Date: {
      date: { start: '2026-01-21T14:00:00' }
    }
  }
})
```

### Delete Task

Using MCP tool `mcp__notion__API-update-a-block` with archived:

```typescript
const response = await mcp__notion__API-patch-page({
  page_id: 'task-id-here',
  archived: true
})
```

---

## UI Styling Reference

Follow existing glassmorphism patterns from `globals.css`:

```css
/* Cards */
.glass-card {
  @apply backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl;
}

/* Buttons */
.glass-button {
  @apply bg-white/10 hover:bg-white/20 border border-white/20 text-white;
  @apply transition-all duration-700 ease-out hover:scale-[1.02];
}

/* Inputs */
.glass-input {
  @apply bg-white/5 border-white/20 rounded-xl text-white;
  @apply placeholder:text-white/40 focus:border-white/40 focus:bg-white/10;
}
```

**Color Palette**:
- Primary text: `text-white`
- Secondary text: `text-white/60`
- Muted text: `text-white/40`
- Backgrounds: `bg-white/5`, `bg-white/10`, `bg-white/15`
- Borders: `border-white/10`, `border-white/20`
- CTA: `bg-brand-red hover:bg-brand-red-hover`

---

## Timezone Handling (Critical)

Calendars are timezone-sensitive. This implementation must handle timezones correctly to avoid data corruption.

### Strategy

1. **Storage**: Notion stores dates in ISO 8601 format with timezone offset
2. **Display**: Always convert to user's local timezone for display
3. **Input**: Convert user input from local timezone to ISO before saving

### Utility Functions

**File**: `lib/utils/timezone.ts`

```typescript
import { format, parseISO, startOfDay, endOfDay } from 'date-fns'
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz'

/**
 * Get user's timezone (browser)
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

/**
 * Convert ISO string from Notion to user's local Date
 */
export function notionToLocal(isoString: string): Date {
  return parseISO(isoString)
}

/**
 * Convert local Date to ISO string for Notion
 * Preserves the local time as entered by user
 */
export function localToNotion(date: Date, includeTime: boolean = true): string {
  if (includeTime) {
    return date.toISOString()
  }
  return format(date, 'yyyy-MM-dd')
}

/**
 * Format time for display (e.g., "2:30 PM")
 */
export function formatTime(isoString: string): string {
  return format(parseISO(isoString), 'h:mm a')
}

/**
 * Format date for display (e.g., "Jan 15, 2026")
 */
export function formatDate(isoString: string): string {
  return format(parseISO(isoString), 'MMM d, yyyy')
}

/**
 * Check if a date is all-day (no time component)
 */
export function isAllDay(dateObj: { start: string; end?: string | null }): boolean {
  // Notion all-day events have date-only format (YYYY-MM-DD)
  return !dateObj.start.includes('T')
}
```

**Note**: Install `date-fns-tz` for advanced timezone conversions:
```bash
npm install date-fns-tz
```

---

## Error Handling Patterns

### API Error Types

```typescript
// lib/notion/errors.ts

export class NotionError extends Error {
  constructor(
    message: string,
    public code: 'RATE_LIMITED' | 'NOT_FOUND' | 'UNAUTHORIZED' | 'VALIDATION' | 'NETWORK' | 'UNKNOWN',
    public retryable: boolean = false
  ) {
    super(message)
    this.name = 'NotionError'
  }
}

export function parseNotionError(error: unknown): NotionError {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()

    if (message.includes('rate limit')) {
      return new NotionError('Rate limited by Notion API', 'RATE_LIMITED', true)
    }
    if (message.includes('not found') || message.includes('404')) {
      return new NotionError('Task not found', 'NOT_FOUND', false)
    }
    if (message.includes('unauthorized') || message.includes('401')) {
      return new NotionError('Notion API key invalid', 'UNAUTHORIZED', false)
    }
    if (message.includes('network') || message.includes('fetch')) {
      return new NotionError('Network error', 'NETWORK', true)
    }
  }

  return new NotionError('Unknown error occurred', 'UNKNOWN', false)
}
```

### Rate Limiting Strategy

Notion API has a rate limit of **3 requests per second**. Implement exponential backoff:

```typescript
// lib/notion/retry.ts

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      const notionError = parseNotionError(error)

      if (!notionError.retryable) {
        throw notionError
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}
```

### UI Error States

```typescript
// In CalendarPage.tsx

const [error, setError] = useState<NotionError | null>(null)

// Error display component
{error && (
  <Card className="glass-card p-6 border-red-500/30">
    <div className="flex items-center gap-3">
      <AlertCircle className="w-5 h-5 text-red-400" />
      <div>
        <p className="text-white font-medium">
          {error.code === 'RATE_LIMITED' ? 'Too many requests' : 'Failed to load tasks'}
        </p>
        <p className="text-white/60 text-sm">{error.message}</p>
      </div>
      {error.retryable && (
        <Button className="glass-button ml-auto" onClick={fetchTasks}>
          Retry
        </Button>
      )}
    </div>
  </Card>
)}
```

---

## Data Fetching with React Query

The app already has `@tanstack/react-query` installed. Use it for better caching and state management.

### Setup Query Client

**File**: `lib/query/calendar.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { CalendarTask, CreateTaskInput, UpdateTaskInput } from '@/lib/notion/calendar'

const CALENDAR_QUERY_KEY = 'calendar-tasks'

/**
 * Hook to fetch tasks for a date range
 */
export function useCalendarTasks(startDate: string, endDate: string) {
  return useQuery({
    queryKey: [CALENDAR_QUERY_KEY, startDate, endDate],
    queryFn: async () => {
      const res = await fetch(`/api/admin/calendar?start=${startDate}&end=${endDate}`)
      if (!res.ok) throw new Error('Failed to fetch tasks')
      const data = await res.json()
      return data.tasks as CalendarTask[]
    },
    staleTime: 60_000, // 1 minute
    gcTime: 5 * 60_000, // 5 minutes (formerly cacheTime)
  })
}

/**
 * Hook to create a task
 */
export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const res = await fetch('/api/admin/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) throw new Error('Failed to create task')
      return res.json()
    },
    onSuccess: () => {
      // Invalidate all calendar queries to refresh
      queryClient.invalidateQueries({ queryKey: [CALENDAR_QUERY_KEY] })
    },
  })
}

/**
 * Hook to update a task
 */
export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateTaskInput) => {
      const res = await fetch('/api/admin/calendar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) throw new Error('Failed to update task')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CALENDAR_QUERY_KEY] })
    },
  })
}

/**
 * Hook to delete a task
 */
export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (taskId: string) => {
      const res = await fetch(`/api/admin/calendar?id=${taskId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete task')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CALENDAR_QUERY_KEY] })
    },
  })
}
```

### Updated Page Component

```typescript
// In CalendarPage.tsx - simplified with React Query

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())

  const startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd')
  const endDate = format(endOfMonth(currentDate), 'yyyy-MM-dd')

  const { data: tasks = [], isLoading, error, refetch } = useCalendarTasks(startDate, endDate)
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()

  // ... rest of component uses these hooks
}
```

---

## Accessibility Requirements

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Move between interactive elements |
| `Arrow Left/Right` | Navigate between days |
| `Arrow Up/Down` | Navigate between weeks |
| `Enter` | Select day / open task |
| `Escape` | Close modal/slide-out |
| `Home` | Go to first day of month |
| `End` | Go to last day of month |

### ARIA Labels

```tsx
// CalendarGrid.tsx
<div
  role="grid"
  aria-label={`Calendar for ${format(currentDate, 'MMMM yyyy')}`}
>
  <div role="row" className="grid grid-cols-7">
    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
      <div key={day} role="columnheader" aria-label={day}>
        {day}
      </div>
    ))}
  </div>
  {/* Day cells */}
</div>

// CalendarDayCell.tsx
<div
  role="gridcell"
  aria-label={`${format(date, 'EEEE, MMMM d')}. ${tasks.length} tasks.`}
  tabIndex={0}
  onKeyDown={handleKeyDown}
>
  {/* content */}
</div>

// TaskSlideOut.tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="slideout-title"
>
  <h2 id="slideout-title">Task Details</h2>
  {/* content */}
</div>
```

### Focus Management

```typescript
// Focus trap for slide-out
import { useEffect, useRef } from 'react'

function TaskSlideOut({ isOpen, onClose, ... }) {
  const panelRef = useRef<HTMLDivElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      // Store previous focus
      previousFocus.current = document.activeElement as HTMLElement
      // Focus first focusable element in panel
      panelRef.current?.querySelector<HTMLElement>('button, input')?.focus()
    } else if (previousFocus.current) {
      // Restore focus when closing
      previousFocus.current.focus()
    }
  }, [isOpen])

  // ... rest of component
}
```

### Screen Reader Announcements

```typescript
// Announce task count when month changes
useEffect(() => {
  if (!isLoading && tasks) {
    const message = `${format(currentDate, 'MMMM yyyy')}. ${tasks.length} tasks scheduled.`
    // Use a live region to announce
    const announcement = document.getElementById('calendar-announcement')
    if (announcement) {
      announcement.textContent = message
    }
  }
}, [currentDate, tasks, isLoading])

// In JSX
<div
  id="calendar-announcement"
  role="status"
  aria-live="polite"
  className="sr-only"
/>
```

---

## Client Linking (Future Enhancement)

For CRM integration, tasks should be linkable to clients. This section outlines the data model for future implementation.

### Extended Task Schema

```typescript
export interface CalendarTask {
  // ... existing fields ...

  // Future: Link to CRM client
  clientId?: string      // gsrealty_clients.id
  clientName?: string    // Denormalized for display
  dealId?: string        // gsrealty_deals.id (if task is deal-related)
}
```

### Notion Property Addition

When ready to implement, add a `Client` relation property to the Notion database:

1. Add "Client ID" text property to Task List database
2. Update `CreateTaskInput` to accept optional `clientId`
3. Add client selector to CreateTaskModal
4. Display client badge on CalendarEventCard

### Integration Points

- **Client Detail Page**: Add "Schedule Task" button that opens calendar modal with client pre-selected
- **Pipeline View**: Show task count per deal, link to calendar filtered by deal
- **Activity Timeline**: After task date passes, prompt to log as outreach activity

---

## Testing Checklist

### Core Functionality
- [ ] Calendar displays current month by default
- [ ] Prev/Next month navigation works
- [ ] "Today" button returns to current month
- [ ] Tasks from Notion appear on correct dates
- [ ] Only RealtyOne tasks are shown (filtered correctly)
- [ ] Click task opens slide-out with correct data
- [ ] Edit task in slide-out and save updates Notion
- [ ] Delete task removes from Notion (with confirmation)
- [ ] Click empty day opens create modal with date pre-filled
- [ ] Create new task appears on calendar immediately
- [ ] All-day events display differently from timed events
- [ ] Priority colors are correct (S/A/B/C tier)
- [ ] Tags display correctly
- [ ] Mobile responsive (slide-out becomes full-screen)

### Error Handling
- [ ] Network failure shows error message with retry button
- [ ] Rate limit error is handled gracefully (auto-retry)
- [ ] Invalid Notion API key shows clear error
- [ ] Task not found error handled (e.g., deleted in Notion)
- [ ] Form validation prevents invalid submissions

### Timezone & Dates
- [ ] Tasks display in user's local timezone
- [ ] Creating a task at 2pm local time saves as 2pm
- [ ] DST transitions handled correctly (if applicable)
- [ ] All-day events don't shift dates across timezones
- [ ] Multi-day events span correctly across date boundaries

### Accessibility
- [ ] Tab navigation moves through all interactive elements
- [ ] Arrow keys navigate between calendar days
- [ ] Enter key selects day or opens task
- [ ] Escape closes modal/slide-out
- [ ] Screen reader announces month and task count
- [ ] Focus returns to trigger element when modal closes
- [ ] All interactive elements have visible focus indicators

### Performance
- [ ] Calendar loads within 2 seconds
- [ ] Month navigation doesn't refetch if data is cached
- [ ] Creating/updating tasks shows optimistic UI
- [ ] Large number of tasks (50+) renders smoothly

---

## Environment Setup

### 1. Install Dependencies

```bash
npm install @notionhq/client date-fns date-fns-tz react-day-picker @radix-ui/react-popover
```

### 2. Add Environment Variables

Add to `.env.local`:

```bash
# Notion Integration
NOTION_API_KEY=secret_your_notion_api_key_here
```

### 3. Configure Notion Access

The Notion integration must have access to the "Task List" database:

1. Go to Notion → Settings → Integrations
2. Find your integration (or create one)
3. Copy the "Internal Integration Token" → this is your `NOTION_API_KEY`
4. Go to the "Task List" database in Notion
5. Click "..." menu → "Add connections" → Select your integration

**Verification**: After setup, run:
```bash
curl -X POST 'https://api.notion.com/v1/databases/1c1cf08f-4499-803d-b5df-000b0d8c6e11/query' \
  -H 'Authorization: Bearer YOUR_NOTION_API_KEY' \
  -H 'Notion-Version: 2022-06-28' \
  -H 'Content-Type: application/json' \
  -d '{"page_size": 1}'
```

Should return `200 OK` with results (not `401 Unauthorized`).

---

## Estimated Implementation Order

### Phase 1: Foundation (P0 - Blocking)
1. **Step 0: Install dependencies** - Run npm install command
2. **lib/utils/timezone.ts** - Timezone utilities
3. **lib/notion/errors.ts** - Error handling classes
4. **lib/notion/retry.ts** - Retry logic with backoff
5. **lib/notion/calendar.ts** - Notion API wrapper

### Phase 2: API Layer
6. **app/api/admin/calendar/route.ts** - REST API endpoint
7. **lib/query/calendar.ts** - React Query hooks

### Phase 3: UI Components (Build in parallel)
8. **CalendarHeader.tsx** - Navigation, month display, add button
9. **CalendarEventCard.tsx** - Task card with priority colors
10. **CalendarDayCell.tsx** - Day cell with task list
11. **CalendarGrid.tsx** - Month grid with keyboard nav
12. **DatePickerInput.tsx** - Date picker using react-day-picker

### Phase 4: Main Features
13. **app/admin/calendar/page.tsx** - Main page orchestration
14. **TaskSlideOut.tsx** - Detail/edit slide-out panel
15. **CreateTaskModal.tsx** - New task creation form

### Phase 5: Integration
16. **Enable nav item** - Update `app/admin/layout.tsx`
17. **Accessibility audit** - Verify keyboard nav, ARIA labels

### Phase 6: Quality Assurance
18. **Manual testing** - All checklist items
19. **Cross-browser testing** - Chrome, Firefox, Safari
20. **Mobile testing** - Responsive behavior

### File Dependency Graph

```
timezone.ts ─┐
errors.ts ───┼──► calendar.ts ──► route.ts ──► calendar-hooks.ts
retry.ts ────┘                                      │
                                                    ▼
DatePickerInput.tsx ──────────────────────► CreateTaskModal.tsx
                                                    │
CalendarHeader.tsx ───┐                             │
CalendarEventCard.tsx ┼──► CalendarGrid.tsx ──► page.tsx
CalendarDayCell.tsx ──┘                             │
                                                    ▼
                                            TaskSlideOut.tsx
```

### Reference: Existing Modal Patterns

Before building `CreateTaskModal.tsx` and `TaskSlideOut.tsx`, review these existing components for consistent patterns:
- `components/admin/CreateEventModal.tsx` - Modal structure, form handling
- `components/admin/LogOutreachModal.tsx` - Select dropdowns, form validation

---

## Future Enhancements (Out of Scope)

### High Value (Recommended Next)
- **Client Linking** - Link tasks to CRM clients (see "Client Linking" section above)
- **Dashboard Widget** - Show upcoming tasks on admin dashboard
- **Outreach Integration** - Convert completed tasks to logged activities
- **Task Notifications** - Reminder emails/push for upcoming tasks

### Medium Value
- **Week View** - 7-day view with hourly slots
- **Day View** - Single day with time blocks
- **Drag-and-Drop** - Reschedule tasks by dragging
- **Task Completion** - Checkbox to mark done (sync with Notion)

### Nice to Have
- **Recurring Tasks** - Daily/weekly/monthly patterns
- **Calendar Export** - ICS file download
- **Google Calendar Sync** - Two-way sync with Google
- **Team Calendars** - View multiple agent calendars
