# Dynamic Table System Plan - Wabbit

> **Status**: Planning
> **Created**: January 28, 2026
> **Target Users**: 600 users
> **Stack**: Next.js 14 + Supabase + TypeScript

---

## Executive Summary

This document outlines the architecture for a dynamic table system in Wabbit that allows users to:
- Create custom tables (like Notion databases or Airtable bases)
- Define custom columns with various data types
- Build dynamic dashboards with their data
- Collaborate in real-time with other users

---

## Table of Contents

1. [Core Architecture](#1-core-architecture)
2. [Database Schema](#2-database-schema)
3. [Column Types](#3-column-types)
4. [API Design](#4-api-design)
5. [Frontend Components](#5-frontend-components)
6. [Real-Time Sync](#6-real-time-sync)
7. [Performance Considerations](#7-performance-considerations)
8. [Security & RLS](#8-security--rls)
9. [Migration Strategy](#9-migration-strategy)
10. [Implementation Phases](#10-implementation-phases)
11. [Open Questions](#11-open-questions)

---

## 1. Core Architecture

### Design Philosophy

**Hybrid Schema Approach** - We use fixed PostgreSQL tables with JSONB for flexible user data, rather than creating actual database tables per user.

```
┌─────────────────────────────────────────────────────────────────┐
│  FIXED SCHEMA (Managed by us)                                   │
│  - user_tables: Defines what tables a user has                  │
│  - user_table_columns: Defines columns for each table           │
│  - user_table_rows: Stores actual data as JSONB                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  USER PERSPECTIVE (What they see)                               │
│  - "My Projects" table with Name, Status, Due Date columns      │
│  - "Inventory" table with Item, Quantity, Price columns         │
│  - Feels like real tables, but stored as JSONB                  │
└─────────────────────────────────────────────────────────────────┘
```

### Why This Approach?

| Approach | Pros | Cons |
|----------|------|------|
| **Real tables per user** | Native SQL queries, indexes | Migration nightmare, connection limits, security risks |
| **JSONB in fixed tables** | Easy migrations, RLS works, scalable | Slightly slower queries, no native constraints |
| **Separate database per user** | Full isolation | Expensive, operational overhead |

**Decision**: JSONB in fixed tables - best balance for 600 users scaling to thousands.

---

## 2. Database Schema

### Core Tables

```sql
-- ============================================
-- USER TABLES (Table Definitions)
-- ============================================
CREATE TABLE user_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Identity
  name TEXT NOT NULL,
  slug TEXT NOT NULL, -- URL-safe: "my-projects", "inventory"
  description TEXT,

  -- UI Configuration
  icon TEXT DEFAULT 'table', -- Lucide icon name
  color TEXT DEFAULT '#6366f1', -- Hex color
  emoji TEXT, -- Optional emoji prefix

  -- Settings
  settings JSONB DEFAULT '{
    "default_view": "table",
    "allow_comments": true,
    "allow_attachments": true,
    "row_height": "medium"
  }',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ, -- Soft delete

  -- Constraints
  UNIQUE(user_id, slug)
);

-- Index for fast lookups
CREATE INDEX idx_user_tables_user_id ON user_tables(user_id);
CREATE INDEX idx_user_tables_slug ON user_tables(user_id, slug);

-- ============================================
-- USER TABLE COLUMNS (Column Definitions)
-- ============================================
CREATE TABLE user_table_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID REFERENCES user_tables(id) ON DELETE CASCADE NOT NULL,

  -- Identity
  name TEXT NOT NULL, -- Display name: "Project Name"
  slug TEXT NOT NULL, -- Data key: "project_name"

  -- Type Configuration
  column_type TEXT NOT NULL, -- See Column Types section
  config JSONB DEFAULT '{}', -- Type-specific configuration

  -- Display
  position INT NOT NULL DEFAULT 0,
  width INT DEFAULT 200, -- Pixel width
  visible BOOLEAN DEFAULT TRUE,

  -- Validation
  required BOOLEAN DEFAULT FALSE,
  default_value JSONB, -- Default when creating new row

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(table_id, slug)
);

-- Index for ordering
CREATE INDEX idx_user_table_columns_position ON user_table_columns(table_id, position);

-- ============================================
-- USER TABLE ROWS (Actual Data)
-- ============================================
CREATE TABLE user_table_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID REFERENCES user_tables(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- For RLS

  -- The actual data (column_slug -> value)
  data JSONB NOT NULL DEFAULT '{}',

  -- Row metadata
  position INT, -- For manual ordering
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Indexes for performance
CREATE INDEX idx_user_table_rows_table_id ON user_table_rows(table_id);
CREATE INDEX idx_user_table_rows_user_id ON user_table_rows(user_id);
CREATE INDEX idx_user_table_rows_data ON user_table_rows USING GIN (data); -- JSONB queries
CREATE INDEX idx_user_table_rows_position ON user_table_rows(table_id, position);

-- ============================================
-- USER TABLE VIEWS (Saved Views)
-- ============================================
CREATE TABLE user_table_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID REFERENCES user_tables(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Identity
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,

  -- View Configuration
  view_type TEXT NOT NULL DEFAULT 'table', -- 'table', 'kanban', 'calendar', 'gallery', 'list'
  config JSONB NOT NULL DEFAULT '{}',
  -- Table view: { "visible_columns": ["name", "status"], "sort": [{"column": "created_at", "dir": "desc"}], "filters": [...] }
  -- Kanban: { "group_by": "status", "card_fields": ["name", "assignee", "due_date"] }
  -- Calendar: { "date_field": "due_date", "title_field": "name", "color_field": "status" }
  -- Gallery: { "cover_field": "image", "title_field": "name", "subtitle_field": "description" }

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER TABLE RELATIONS (Table-to-Table Links)
-- ============================================
CREATE TABLE user_table_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source (where the relation column lives)
  source_table_id UUID REFERENCES user_tables(id) ON DELETE CASCADE NOT NULL,
  source_column_id UUID REFERENCES user_table_columns(id) ON DELETE CASCADE NOT NULL,

  -- Target (what table it links to)
  target_table_id UUID REFERENCES user_tables(id) ON DELETE CASCADE NOT NULL,
  target_display_column_id UUID REFERENCES user_table_columns(id), -- Column to show as label

  -- Relation type
  relation_type TEXT DEFAULT 'many_to_one', -- 'many_to_one', 'many_to_many'

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Triggers

```sql
-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_tables_updated_at
  BEFORE UPDATE ON user_tables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_table_rows_updated_at
  BEFORE UPDATE ON user_table_rows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_table_views_updated_at
  BEFORE UPDATE ON user_table_views
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 3. Column Types

### Supported Types

| Type | Stored As | Config Options | Example Value |
|------|-----------|----------------|---------------|
| `text` | string | `maxLength`, `placeholder` | `"Hello world"` |
| `number` | number | `min`, `max`, `precision`, `format` | `42.5` |
| `checkbox` | boolean | none | `true` |
| `date` | ISO string | `includeTime`, `format` | `"2026-01-28"` |
| `datetime` | ISO string | `timezone` | `"2026-01-28T14:30:00Z"` |
| `select` | string | `options[]`, `allowMultiple` | `"in_progress"` |
| `multi_select` | string[] | `options[]` | `["tag1", "tag2"]` |
| `relation` | UUID or UUID[] | `targetTable`, `allowMultiple` | `"uuid-here"` |
| `file` | object | `allowedTypes`, `maxSize` | `{url, name, size, type}` |
| `image` | object | `allowedTypes`, `maxSize` | `{url, name, width, height}` |
| `url` | string | none | `"https://example.com"` |
| `email` | string | none | `"user@example.com"` |
| `phone` | string | `format` | `"+1-555-123-4567"` |
| `rating` | number | `max`, `icon` | `4` |
| `progress` | number | `max` | `75` |
| `currency` | object | `currency`, `locale` | `{amount: 100, currency: "USD"}` |
| `formula` | computed | `expression` | (computed at read time) |
| `rollup` | computed | `relation`, `targetColumn`, `aggregation` | (computed at read time) |
| `created_at` | ISO string | (auto) | `"2026-01-28T10:00:00Z"` |
| `updated_at` | ISO string | (auto) | `"2026-01-28T12:30:00Z"` |
| `created_by` | UUID | (auto) | `"user-uuid"` |

### Column Config Examples

```typescript
// Select column
{
  column_type: "select",
  config: {
    options: [
      { value: "todo", label: "To Do", color: "#gray" },
      { value: "in_progress", label: "In Progress", color: "#blue" },
      { value: "done", label: "Done", color: "#green" }
    ]
  }
}

// Relation column
{
  column_type: "relation",
  config: {
    targetTableId: "uuid-of-other-table",
    displayColumn: "name", // Which column to show as label
    allowMultiple: false
  }
}

// Formula column
{
  column_type: "formula",
  config: {
    expression: "{{price}} * {{quantity}}", // Computed from other columns
    outputType: "number",
    format: "currency"
  }
}

// Rollup column
{
  column_type: "rollup",
  config: {
    relationColumn: "tasks", // Relation column in this table
    targetColumn: "status", // Column in related table
    aggregation: "count_where", // count, sum, avg, min, max, count_where
    condition: { "status": "done" }
  }
}
```

### Type Validation

```typescript
// lib/dynamic-tables/validators.ts
const validators: Record<ColumnType, (value: any, config: any) => boolean> = {
  text: (value, config) => {
    if (typeof value !== 'string') return false;
    if (config.maxLength && value.length > config.maxLength) return false;
    return true;
  },

  number: (value, config) => {
    if (typeof value !== 'number' || isNaN(value)) return false;
    if (config.min !== undefined && value < config.min) return false;
    if (config.max !== undefined && value > config.max) return false;
    return true;
  },

  select: (value, config) => {
    const validValues = config.options.map(o => o.value);
    return validValues.includes(value);
  },

  relation: (value, config) => {
    if (config.allowMultiple) {
      return Array.isArray(value) && value.every(v => isValidUUID(v));
    }
    return isValidUUID(value);
  },

  // ... other validators
};
```

---

## 4. API Design

### REST Endpoints

```
Tables
------
GET    /api/tables                    # List user's tables
POST   /api/tables                    # Create new table
GET    /api/tables/[tableId]          # Get table with columns
PATCH  /api/tables/[tableId]          # Update table settings
DELETE /api/tables/[tableId]          # Archive table

Columns
-------
GET    /api/tables/[tableId]/columns           # List columns
POST   /api/tables/[tableId]/columns           # Add column
PATCH  /api/tables/[tableId]/columns/[colId]   # Update column
DELETE /api/tables/[tableId]/columns/[colId]   # Delete column
POST   /api/tables/[tableId]/columns/reorder   # Reorder columns

Rows
----
GET    /api/tables/[tableId]/rows              # List rows (paginated, filterable)
POST   /api/tables/[tableId]/rows              # Create row
GET    /api/tables/[tableId]/rows/[rowId]      # Get single row
PATCH  /api/tables/[tableId]/rows/[rowId]      # Update row
DELETE /api/tables/[tableId]/rows/[rowId]      # Delete row
POST   /api/tables/[tableId]/rows/bulk         # Bulk operations

Views
-----
GET    /api/tables/[tableId]/views             # List views
POST   /api/tables/[tableId]/views             # Create view
PATCH  /api/tables/[tableId]/views/[viewId]    # Update view
DELETE /api/tables/[tableId]/views/[viewId]    # Delete view
```

### Query Parameters for Rows

```
GET /api/tables/[tableId]/rows?
  page=1&
  limit=50&
  sort=created_at:desc&
  filter={"status":{"eq":"active"},"priority":{"gte":3}}&
  search=keyword&
  columns=name,status,due_date
```

### API Implementation

```typescript
// app/api/tables/[tableId]/rows/route.ts
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { tableId: string } }
) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
  const sortParam = searchParams.get('sort'); // "column:dir"
  const filterParam = searchParams.get('filter'); // JSON
  const search = searchParams.get('search');

  // Verify table ownership
  const { data: table } = await supabase
    .from('user_tables')
    .select('id, user_id')
    .eq('id', params.tableId)
    .single();

  if (!table || table.user_id !== user.id) {
    return NextResponse.json({ error: 'Table not found' }, { status: 404 });
  }

  // Build query
  let query = supabase
    .from('user_table_rows')
    .select('*', { count: 'exact' })
    .eq('table_id', params.tableId);

  // Apply filters
  if (filterParam) {
    const filters = JSON.parse(filterParam);
    for (const [column, conditions] of Object.entries(filters)) {
      for (const [operator, value] of Object.entries(conditions as Record<string, any>)) {
        // JSONB filtering: data->>'column' operator value
        switch (operator) {
          case 'eq':
            query = query.eq(`data->>${column}`, value);
            break;
          case 'neq':
            query = query.neq(`data->>${column}`, value);
            break;
          case 'gt':
            query = query.gt(`data->>${column}`, value);
            break;
          case 'gte':
            query = query.gte(`data->>${column}`, value);
            break;
          case 'lt':
            query = query.lt(`data->>${column}`, value);
            break;
          case 'lte':
            query = query.lte(`data->>${column}`, value);
            break;
          case 'like':
            query = query.ilike(`data->>${column}`, `%${value}%`);
            break;
          case 'in':
            query = query.in(`data->>${column}`, value);
            break;
        }
      }
    }
  }

  // Apply search (full-text across all text columns)
  if (search) {
    // Note: For better search, consider pg_trgm or full-text search
    query = query.or(`data.cs.{"name":"${search}"},data.cs.{"title":"${search}"}`);
  }

  // Apply sorting
  if (sortParam) {
    const [column, dir] = sortParam.split(':');
    if (column === 'created_at' || column === 'updated_at') {
      query = query.order(column, { ascending: dir === 'asc' });
    } else {
      // JSONB column sorting
      query = query.order(`data->>${column}`, { ascending: dir === 'asc' });
    }
  } else {
    query = query.order('created_at', { ascending: false });
  }

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data: rows, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    rows,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil((count || 0) / limit),
    },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { tableId: string } }
) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  // Verify table ownership
  const { data: table } = await supabase
    .from('user_tables')
    .select('id, user_id')
    .eq('id', params.tableId)
    .single();

  if (!table || table.user_id !== user.id) {
    return NextResponse.json({ error: 'Table not found' }, { status: 404 });
  }

  // Get columns for validation
  const { data: columns } = await supabase
    .from('user_table_columns')
    .select('*')
    .eq('table_id', params.tableId);

  // Validate data against column definitions
  const validationErrors = validateRowData(body.data, columns);
  if (validationErrors.length > 0) {
    return NextResponse.json({ errors: validationErrors }, { status: 400 });
  }

  // Apply defaults for missing required fields
  const dataWithDefaults = applyColumnDefaults(body.data, columns);

  // Insert row
  const { data: row, error } = await supabase
    .from('user_table_rows')
    .insert({
      table_id: params.tableId,
      user_id: user.id,
      data: dataWithDefaults,
      created_by: user.id,
      updated_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ row }, { status: 201 });
}
```

---

## 5. Frontend Components

### Component Hierarchy

```
<TableProvider tableId={id}>              # Context for table state
  <TableToolbar />                        # Search, filters, view switcher
  <TableViewSwitcher>                     # Tabs for different views
    <TableView />                         # Spreadsheet-like grid
    <KanbanView />                         # Card columns by status
    <CalendarView />                       # Date-based calendar
    <GalleryView />                        # Image grid
  </TableViewSwitcher>
  <TablePagination />                     # Page navigation
</TableProvider>
```

### Core Components

```typescript
// components/dynamic-tables/TableProvider.tsx
'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface TableContextValue {
  table: UserTable | null;
  columns: UserTableColumn[];
  rows: UserTableRow[];
  views: UserTableView[];
  currentView: UserTableView | null;
  isLoading: boolean;

  // Actions
  createRow: (data: Record<string, any>) => Promise<void>;
  updateRow: (rowId: string, data: Record<string, any>) => Promise<void>;
  deleteRow: (rowId: string) => Promise<void>;
  updateColumn: (columnId: string, updates: Partial<UserTableColumn>) => Promise<void>;
  setCurrentView: (viewId: string) => void;

  // Filters & Sorting
  filters: FilterCondition[];
  setFilters: (filters: FilterCondition[]) => void;
  sort: SortConfig | null;
  setSort: (sort: SortConfig | null) => void;
  search: string;
  setSearch: (search: string) => void;
}

const TableContext = createContext<TableContextValue | null>(null);

export function TableProvider({
  tableId,
  children
}: {
  tableId: string;
  children: ReactNode;
}) {
  const queryClient = useQueryClient();
  const [currentViewId, setCurrentViewId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterCondition[]>([]);
  const [sort, setSort] = useState<SortConfig | null>(null);
  const [search, setSearch] = useState('');

  // Fetch table with columns
  const { data: tableData, isLoading: tableLoading } = useQuery({
    queryKey: ['table', tableId],
    queryFn: async () => {
      const res = await fetch(`/api/tables/${tableId}`);
      return res.json();
    },
  });

  // Fetch rows with filters
  const { data: rowsData, isLoading: rowsLoading } = useQuery({
    queryKey: ['table-rows', tableId, filters, sort, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.length) params.set('filter', JSON.stringify(filters));
      if (sort) params.set('sort', `${sort.column}:${sort.direction}`);
      if (search) params.set('search', search);

      const res = await fetch(`/api/tables/${tableId}/rows?${params}`);
      return res.json();
    },
  });

  // Mutations
  const createRowMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const res = await fetch(`/api/tables/${tableId}/rows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['table-rows', tableId] });
    },
  });

  const updateRowMutation = useMutation({
    mutationFn: async ({ rowId, data }: { rowId: string; data: Record<string, any> }) => {
      const res = await fetch(`/api/tables/${tableId}/rows/${rowId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['table-rows', tableId] });
    },
  });

  const value: TableContextValue = {
    table: tableData?.table ?? null,
    columns: tableData?.columns ?? [],
    rows: rowsData?.rows ?? [],
    views: tableData?.views ?? [],
    currentView: tableData?.views?.find((v: any) => v.id === currentViewId) ?? null,
    isLoading: tableLoading || rowsLoading,

    createRow: (data) => createRowMutation.mutateAsync(data),
    updateRow: (rowId, data) => updateRowMutation.mutateAsync({ rowId, data }),
    deleteRow: async (rowId) => { /* ... */ },
    updateColumn: async (columnId, updates) => { /* ... */ },
    setCurrentView: setCurrentViewId,

    filters,
    setFilters,
    sort,
    setSort,
    search,
    setSearch,
  };

  return (
    <TableContext.Provider value={value}>
      {children}
    </TableContext.Provider>
  );
}

export function useTable() {
  const context = useContext(TableContext);
  if (!context) {
    throw new Error('useTable must be used within a TableProvider');
  }
  return context;
}
```

### Table View Component

```typescript
// components/dynamic-tables/TableView.tsx
'use client';

import { useTable } from './TableProvider';
import { CellRenderer } from './cells/CellRenderer';
import { ColumnHeader } from './ColumnHeader';
import { AddRowButton } from './AddRowButton';

export function TableView() {
  const { columns, rows, isLoading, updateRow } = useTable();

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-white/10">
            {columns
              .filter((col) => col.visible)
              .sort((a, b) => a.position - b.position)
              .map((column) => (
                <ColumnHeader key={column.id} column={column} />
              ))}
            <th className="w-10" /> {/* Add column button */}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-white/5 hover:bg-white/5 transition-colors"
            >
              {columns
                .filter((col) => col.visible)
                .sort((a, b) => a.position - b.position)
                .map((column) => (
                  <td
                    key={`${row.id}-${column.id}`}
                    className="p-2"
                    style={{ width: column.width }}
                  >
                    <CellRenderer
                      column={column}
                      value={row.data[column.slug]}
                      rowId={row.id}
                      onChange={(newValue) => {
                        updateRow(row.id, {
                          ...row.data,
                          [column.slug]: newValue,
                        });
                      }}
                    />
                  </td>
                ))}
            </tr>
          ))}
        </tbody>
      </table>
      <AddRowButton />
    </div>
  );
}
```

### Cell Renderer (Dynamic by Type)

```typescript
// components/dynamic-tables/cells/CellRenderer.tsx
import { TextCell } from './TextCell';
import { NumberCell } from './NumberCell';
import { SelectCell } from './SelectCell';
import { DateCell } from './DateCell';
import { CheckboxCell } from './CheckboxCell';
import { RelationCell } from './RelationCell';
import { FileCell } from './FileCell';
import { RatingCell } from './RatingCell';

const CellComponents: Record<string, React.ComponentType<CellProps>> = {
  text: TextCell,
  number: NumberCell,
  select: SelectCell,
  multi_select: MultiSelectCell,
  date: DateCell,
  datetime: DateTimeCell,
  checkbox: CheckboxCell,
  relation: RelationCell,
  file: FileCell,
  image: ImageCell,
  url: UrlCell,
  email: EmailCell,
  phone: PhoneCell,
  rating: RatingCell,
  progress: ProgressCell,
  currency: CurrencyCell,
  formula: FormulaCell,
  rollup: RollupCell,
  created_at: ReadOnlyDateCell,
  updated_at: ReadOnlyDateCell,
  created_by: UserCell,
};

interface CellProps {
  column: UserTableColumn;
  value: any;
  rowId: string;
  onChange: (value: any) => void;
}

export function CellRenderer({ column, value, rowId, onChange }: CellProps) {
  const CellComponent = CellComponents[column.column_type] || TextCell;

  return (
    <CellComponent
      column={column}
      value={value}
      rowId={rowId}
      onChange={onChange}
    />
  );
}
```

### Example Cell Component

```typescript
// components/dynamic-tables/cells/SelectCell.tsx
'use client';

import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface SelectCellProps {
  column: UserTableColumn;
  value: string;
  onChange: (value: string) => void;
}

export function SelectCell({ column, value, onChange }: SelectCellProps) {
  const [open, setOpen] = useState(false);
  const options = column.config?.options || [];
  const selectedOption = options.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/10 transition-colors w-full text-left">
          {selectedOption ? (
            <span
              className="px-2 py-0.5 rounded text-sm"
              style={{ backgroundColor: selectedOption.color + '20', color: selectedOption.color }}
            >
              {selectedOption.label}
            </span>
          ) : (
            <span className="text-white/40">Select...</span>
          )}
          <ChevronDown className="ml-auto h-4 w-4 text-white/40" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1 glass-card">
        {options.map((option) => (
          <button
            key={option.value}
            className="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-white/10 transition-colors"
            onClick={() => {
              onChange(option.value);
              setOpen(false);
            }}
          >
            <span
              className="px-2 py-0.5 rounded text-sm"
              style={{ backgroundColor: option.color + '20', color: option.color }}
            >
              {option.label}
            </span>
            {option.value === value && (
              <Check className="ml-auto h-4 w-4 text-green-400" />
            )}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
```

---

## 6. Real-Time Sync

### Supabase Realtime Integration

```typescript
// hooks/useRealtimeRows.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export function useRealtimeRows(tableId: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel(`table-rows:${tableId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_table_rows',
          filter: `table_id=eq.${tableId}`,
        },
        (payload) => {
          // Optimistically update cache
          queryClient.setQueryData(
            ['table-rows', tableId],
            (old: any) => {
              if (!old) return old;

              switch (payload.eventType) {
                case 'INSERT':
                  return {
                    ...old,
                    rows: [payload.new, ...old.rows],
                  };
                case 'UPDATE':
                  return {
                    ...old,
                    rows: old.rows.map((row: any) =>
                      row.id === payload.new.id ? payload.new : row
                    ),
                  };
                case 'DELETE':
                  return {
                    ...old,
                    rows: old.rows.filter((row: any) => row.id !== payload.old.id),
                  };
                default:
                  return old;
              }
            }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableId, queryClient, supabase]);
}
```

### Presence (Who's Viewing)

```typescript
// hooks/useTablePresence.ts
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PresenceUser {
  user_id: string;
  email: string;
  name?: string;
  cursor?: { rowId: string; columnId: string };
}

export function useTablePresence(tableId: string) {
  const [users, setUsers] = useState<PresenceUser[]>([]);
  const { user } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel(`table-presence:${tableId}`, {
      config: {
        presence: { key: user.id },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const present = Object.values(state).flat() as PresenceUser[];
        setUsers(present.filter((u) => u.user_id !== user.id)); // Exclude self
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            email: user.email,
            name: user.user_metadata?.name,
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableId, user, supabase]);

  // Function to update cursor position
  const updateCursor = async (rowId: string, columnId: string) => {
    const channel = supabase.channel(`table-presence:${tableId}`);
    await channel.track({
      user_id: user?.id,
      email: user?.email,
      name: user?.user_metadata?.name,
      cursor: { rowId, columnId },
    });
  };

  return { users, updateCursor };
}
```

---

## 7. Performance Considerations

### JSONB Query Optimization

```sql
-- Create GIN index for fast JSONB queries
CREATE INDEX idx_user_table_rows_data ON user_table_rows USING GIN (data);

-- For specific column queries, consider expression indexes
CREATE INDEX idx_rows_status ON user_table_rows ((data->>'status'));
CREATE INDEX idx_rows_created_at ON user_table_rows ((data->>'created_at'));
```

### Pagination Strategy

```typescript
// Use cursor-based pagination for large tables
interface CursorPagination {
  cursor: string | null; // Base64 encoded {id, sortValue}
  limit: number;
}

// API implementation
const decodeCursor = (cursor: string) => {
  return JSON.parse(Buffer.from(cursor, 'base64').toString('utf8'));
};

const encodeCursor = (row: any, sortColumn: string) => {
  return Buffer.from(JSON.stringify({
    id: row.id,
    sortValue: row.data[sortColumn] || row.created_at,
  })).toString('base64');
};
```

### Client-Side Caching

```typescript
// React Query configuration for optimal caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      gcTime: 1000 * 60 * 5, // 5 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
    },
  },
});
```

### Virtual Scrolling for Large Tables

```typescript
// Use TanStack Virtual for tables with 1000+ rows
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualizedTableBody({ rows }: { rows: UserTableRow[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40, // Row height in pixels
    overscan: 10,
  });

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <TableRow
            key={rows[virtualRow.index].id}
            row={rows[virtualRow.index]}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## 8. Security & RLS

### Row Level Security Policies

```sql
-- Enable RLS
ALTER TABLE user_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_table_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_table_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_table_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_table_relations ENABLE ROW LEVEL SECURITY;

-- Tables: Users can only access their own tables
CREATE POLICY "Users manage own tables"
  ON user_tables FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Columns: Access tied to table ownership
CREATE POLICY "Users manage columns of own tables"
  ON user_table_columns FOR ALL
  USING (
    table_id IN (
      SELECT id FROM user_tables WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    table_id IN (
      SELECT id FROM user_tables WHERE user_id = auth.uid()
    )
  );

-- Rows: Access tied to table ownership
CREATE POLICY "Users manage rows in own tables"
  ON user_table_rows FOR ALL
  USING (
    table_id IN (
      SELECT id FROM user_tables WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    table_id IN (
      SELECT id FROM user_tables WHERE user_id = auth.uid()
    )
  );

-- Views: Users manage their own views
CREATE POLICY "Users manage own views"
  ON user_table_views FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Relations: Tied to source table ownership
CREATE POLICY "Users manage relations for own tables"
  ON user_table_relations FOR ALL
  USING (
    source_table_id IN (
      SELECT id FROM user_tables WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    source_table_id IN (
      SELECT id FROM user_tables WHERE user_id = auth.uid()
    )
  );
```

### Future: Shared Tables (Collaboration)

```sql
-- Table sharing (future implementation)
CREATE TABLE user_table_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID REFERENCES user_tables(id) ON DELETE CASCADE,
  shared_with_user_id UUID REFERENCES auth.users(id),
  permission TEXT DEFAULT 'view', -- 'view', 'edit', 'admin'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Updated RLS policy for shared tables
CREATE POLICY "Users can view shared tables"
  ON user_tables FOR SELECT
  USING (
    user_id = auth.uid() OR
    id IN (
      SELECT table_id FROM user_table_shares
      WHERE shared_with_user_id = auth.uid()
    )
  );
```

---

## 9. Migration Strategy

### Phase 1: Schema Creation

```bash
# Create migration file
supabase migration new add_dynamic_tables

# Apply migration
supabase db push
```

### Phase 2: Seed Default Tables (Optional)

```typescript
// scripts/seed-default-tables.ts
const defaultTableTemplates = [
  {
    name: 'Tasks',
    slug: 'tasks',
    icon: 'check-square',
    columns: [
      { name: 'Task', slug: 'task', column_type: 'text', required: true },
      { name: 'Status', slug: 'status', column_type: 'select', config: { options: [...] } },
      { name: 'Due Date', slug: 'due_date', column_type: 'date' },
      { name: 'Priority', slug: 'priority', column_type: 'select', config: { options: [...] } },
    ],
  },
  {
    name: 'Notes',
    slug: 'notes',
    icon: 'file-text',
    columns: [
      { name: 'Title', slug: 'title', column_type: 'text', required: true },
      { name: 'Content', slug: 'content', column_type: 'text' },
      { name: 'Tags', slug: 'tags', column_type: 'multi_select' },
    ],
  },
];
```

---

## 10. Implementation Phases

### Phase 1: Core Tables (Week 1-2)
- [ ] Create database schema
- [ ] Implement RLS policies
- [ ] Build basic CRUD API routes
- [ ] Create TableProvider context

### Phase 2: Table View (Week 3-4)
- [ ] Build column header component
- [ ] Implement all cell type renderers
- [ ] Add inline editing
- [ ] Build add row/column UI

### Phase 3: Advanced Features (Week 5-6)
- [ ] Filtering system
- [ ] Sorting (single & multi-column)
- [ ] Search functionality
- [ ] Column resize/reorder

### Phase 4: Views (Week 7-8)
- [ ] Saved views system
- [ ] Kanban view
- [ ] Calendar view
- [ ] Gallery view

### Phase 5: Real-Time (Week 9)
- [ ] Realtime row updates
- [ ] Presence indicators
- [ ] Conflict resolution

### Phase 6: Polish (Week 10)
- [ ] Performance optimization
- [ ] Virtual scrolling
- [ ] Import/export (CSV, Excel)
- [ ] Keyboard navigation

---

## 11. Open Questions

### Questions for Clarification

1. **Table Sharing**
   - Do users need to share tables with other users (collaboration)?
   - If yes, what permission levels? (view, edit, admin)

2. **Table Templates**
   - Should we provide pre-built table templates? (Tasks, CRM, Inventory)
   - Can users create and share their own templates?

3. **Row Limits**
   - Should there be a limit on rows per table? (1000? 10000? unlimited?)
   - Different limits for free vs paid users?

4. **File Attachments**
   - Where should files be stored? (Supabase Storage)
   - Size limits per file? Per table?

5. **Formula Complexity**
   - How complex should formulas be? (Basic math vs full expression language)
   - Support for cross-table formulas?

6. **History/Versioning**
   - Should we track row change history?
   - Ability to restore previous versions?

7. **API Access**
   - Should users be able to access their tables via API?
   - Rate limits for API access?

8. **Integration with Rankings**
   - How does the dynamic table system integrate with Wabbit's core ranking features?
   - Can rankings be stored in dynamic tables?

---

## Appendix: Type Definitions

```typescript
// types/dynamic-tables.ts

interface UserTable {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description?: string;
  icon: string;
  color: string;
  emoji?: string;
  settings: TableSettings;
  created_at: string;
  updated_at: string;
  archived_at?: string;
}

interface TableSettings {
  default_view: 'table' | 'kanban' | 'calendar' | 'gallery' | 'list';
  allow_comments: boolean;
  allow_attachments: boolean;
  row_height: 'small' | 'medium' | 'large';
}

interface UserTableColumn {
  id: string;
  table_id: string;
  name: string;
  slug: string;
  column_type: ColumnType;
  config: ColumnConfig;
  position: number;
  width: number;
  visible: boolean;
  required: boolean;
  default_value?: any;
  created_at: string;
}

type ColumnType =
  | 'text'
  | 'number'
  | 'checkbox'
  | 'date'
  | 'datetime'
  | 'select'
  | 'multi_select'
  | 'relation'
  | 'file'
  | 'image'
  | 'url'
  | 'email'
  | 'phone'
  | 'rating'
  | 'progress'
  | 'currency'
  | 'formula'
  | 'rollup'
  | 'created_at'
  | 'updated_at'
  | 'created_by';

interface ColumnConfig {
  // Text
  maxLength?: number;
  placeholder?: string;

  // Number
  min?: number;
  max?: number;
  precision?: number;
  format?: 'number' | 'percent' | 'currency';

  // Select
  options?: SelectOption[];
  allowMultiple?: boolean;

  // Relation
  targetTableId?: string;
  displayColumn?: string;

  // Formula
  expression?: string;
  outputType?: 'text' | 'number' | 'date';

  // Rollup
  relationColumn?: string;
  targetColumn?: string;
  aggregation?: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'count_where';
  condition?: Record<string, any>;

  // Rating
  maxRating?: number;
  icon?: 'star' | 'heart' | 'thumb';

  // Currency
  currency?: string;
  locale?: string;
}

interface SelectOption {
  value: string;
  label: string;
  color: string;
}

interface UserTableRow {
  id: string;
  table_id: string;
  user_id: string;
  data: Record<string, any>;
  position?: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

interface UserTableView {
  id: string;
  table_id: string;
  user_id: string;
  name: string;
  is_default: boolean;
  view_type: 'table' | 'kanban' | 'calendar' | 'gallery' | 'list';
  config: ViewConfig;
  created_at: string;
  updated_at: string;
}

interface ViewConfig {
  // Table view
  visible_columns?: string[];
  column_widths?: Record<string, number>;
  sort?: SortConfig[];
  filters?: FilterCondition[];

  // Kanban view
  group_by?: string;
  card_fields?: string[];

  // Calendar view
  date_field?: string;
  title_field?: string;
  color_field?: string;

  // Gallery view
  cover_field?: string;
  title_field?: string;
  subtitle_field?: string;
}

interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

interface FilterCondition {
  column: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in' | 'is_empty' | 'is_not_empty';
  value: any;
}
```

---

*Document generated by Claude Code on January 28, 2026*
