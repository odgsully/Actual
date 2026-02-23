# Jarvis Briefings Frontend - Implementation Guide

**Status**: ✅ Complete
**Date**: December 25, 2025
**Branch**: `gssite-dec18-per-notion`

---

## Overview

Complete frontend implementation for viewing Jarvis daily briefings in the GS Site dashboard. The system displays AI-generated daily briefings with full HTML content, PDF downloads, and navigation.

## Architecture

### Database Schema

**Table**: `jarvis_briefings`

```sql
CREATE TABLE jarvis_briefings (
  id UUID PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  title TEXT,
  content_json JSONB,
  content_html TEXT,
  content_text TEXT,
  pdf_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Migration**: `/supabase/migrations/20251225_create_jarvis_briefings.sql`

### Files Created

| File | Purpose |
|------|---------|
| `/lib/supabase/client.ts` | Supabase client utilities (browser & server) |
| `/lib/jarvis/client.ts` | React Query hooks & API wrapper |
| `/app/api/jarvis/route.ts` | GET briefings list with pagination |
| `/app/api/jarvis/[date]/route.ts` | GET single briefing by date |
| `/app/jarvis/page.tsx` | Briefings list page |
| `/app/jarvis/[date]/page.tsx` | Single briefing detail page |
| `/components/tiles/JarvisBriefingTile.tsx` | Dashboard tile component |
| `/components/tiles/TileRegistry.tsx` | Updated with Jarvis tile |

## Features Implemented

### 1. Briefings List Page (`/jarvis`)

- Paginated list of briefings (10 per page)
- Date, title, and preview text
- Click to view full briefing
- PDF download button
- Pagination controls (Previous/Next)
- Loading skeleton
- Error handling
- Empty state

### 2. Single Briefing Page (`/jarvis/[date]`)

- Full HTML content display
- PDF download button
- Navigation to previous/next day
- Metadata display
- Breadcrumb navigation
- Loading skeleton
- Error handling

### 3. Dashboard Tile

- Shows latest briefing date
- Links to `/jarvis`
- Loading state
- Hover effects
- Consistent with GS Site design

### 4. API Routes

#### GET `/api/jarvis`

Query params:
- `limit` (default: 10, max: 100)
- `offset` (default: 0)

Response:
```json
{
  "briefings": [...],
  "total": 150,
  "hasMore": true
}
```

Cache: 5 minutes, stale-while-revalidate: 1 hour

#### GET `/api/jarvis/[date]`

Params:
- `date` (YYYY-MM-DD format)

Response:
```json
{
  "id": "uuid",
  "date": "2025-12-25",
  "title": "Daily Briefing",
  "content_html": "<div>...</div>",
  "pdf_url": "https://...",
  "metadata": {...},
  ...
}
```

Cache: 10 minutes, stale-while-revalidate: 2 hours

### 5. React Query Hooks

```typescript
// List briefings with pagination
const { data, isLoading } = useJarvisBriefings(limit, offset);

// Get single briefing by date
const { data, isLoading } = useJarvisBriefing('2025-12-25');

// Get latest briefing (convenience)
const { data, isLoading } = useLatestBriefing();
```

## Environment Setup

### Required Environment Variables

Add to `.env.local`:

```bash
# Supabase Configuration (required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Database Setup

1. Run the migration:
```bash
# Using Supabase CLI
supabase db push

# Or manually apply the migration SQL
psql -h your-db-host -U postgres -d postgres < supabase/migrations/20251225_create_jarvis_briefings.sql
```

2. Verify table creation:
```sql
SELECT * FROM jarvis_briefings LIMIT 1;
```

## Usage

### Adding Jarvis Tile to Dashboard

1. Add tile to Notion "Tiles" database (or `lib/data/tiles.ts`):

```typescript
{
  id: 'jarvis-briefings',
  name: 'Jarvis Briefings',
  desc: 'Daily AI briefings',
  shadcn: ['Button'],
  menu: ['Software'],
  thirdParty: [],
  status: 'In progress',
  priority: '2',
}
```

2. Tile will automatically appear on dashboard
3. Click tile to navigate to `/jarvis`

### Viewing Briefings

**List View** (`/jarvis`):
- Browse all briefings
- Click any briefing to view details
- Download PDF directly from list
- Use pagination to load more

**Detail View** (`/jarvis/2025-12-25`):
- Read full HTML content
- Download PDF
- View metadata (sources, generation stats)
- Navigate to previous/next day

## Integration with Jarvis_BriefMe

The frontend is ready to receive briefings from the Jarvis_BriefMe automation. The backend service should:

1. Generate daily briefing content
2. Insert into `jarvis_briefings` table:

```typescript
import { createServerClient } from '@/lib/supabase/client';

const supabase = createServerClient();

await supabase.from('jarvis_briefings').insert({
  date: '2025-12-25',
  title: 'Daily Briefing - December 25, 2025',
  content_html: '<div>...</div>',
  content_text: 'Plain text version...',
  content_json: {
    news: [...],
    repos: [...],
    countries: [...],
    // ... other sections
  },
  pdf_url: 'https://storage.supabase.com/path/to/briefing.pdf',
  metadata: {
    sources_count: 50,
    generation_time_ms: 2500,
    model: 'claude-opus-4.5',
  }
});
```

3. Frontend will automatically display new briefings

## Styling & Design

- Uses shadcn/ui components (Card, Button)
- Tailwind CSS for styling
- Responsive design (mobile-first)
- Dark mode support
- Consistent with GS Site design system

## Testing Checklist

- [ ] Briefings list loads with pagination
- [ ] Single briefing displays full content
- [ ] PDF download works (if URL provided)
- [ ] Navigation (prev/next) works correctly
- [ ] Dashboard tile shows latest briefing date
- [ ] Loading states display correctly
- [ ] Error states display correctly
- [ ] Empty state displays when no briefings
- [ ] Responsive on mobile/tablet/desktop
- [ ] Dark mode works correctly

## Known Limitations

1. **Date Navigation**: Simple day increment (doesn't account for missing dates)
   - **Fix**: Add API endpoint to get prev/next available dates
2. **No Search**: Can't search briefings by keyword
   - **Future**: Add full-text search with Supabase
3. **No Filtering**: Can't filter by date range or metadata
   - **Future**: Add date picker and filters
4. **Hardcoded Pagination**: 10 items per page
   - **Future**: Make configurable per user

## Future Enhancements

### Phase 1 - Search & Filters
- Full-text search across briefings
- Date range picker
- Filter by metadata (sources, topics)

### Phase 2 - User Preferences
- Save favorite briefings
- Mark as read/unread
- Custom notification preferences

### Phase 3 - Analytics
- Reading time tracking
- Most viewed sections
- User engagement metrics

### Phase 4 - Sharing
- Share briefing via email
- Generate shareable links
- Export to Markdown/PDF

## Troubleshooting

### "Failed to fetch briefings"

**Cause**: Supabase credentials not configured

**Fix**:
1. Check `.env.local` has correct Supabase URL and keys
2. Verify Supabase project is accessible
3. Check browser console for detailed error

### "No briefings found"

**Cause**: Empty `jarvis_briefings` table

**Fix**:
1. Verify migration ran successfully
2. Insert test briefing manually:
```sql
INSERT INTO jarvis_briefings (date, title, content_html)
VALUES ('2025-12-25', 'Test Briefing', '<p>Test content</p>');
```

### PDF download doesn't work

**Cause**: `pdf_url` is null or invalid

**Fix**:
1. Verify Supabase Storage is configured
2. Upload PDF to Storage
3. Update briefing with public URL

### Tile doesn't appear on dashboard

**Cause**: Tile not registered or name mismatch

**Fix**:
1. Verify tile name in Notion/tiles.ts contains "jarvis" and "brief"
2. Check TileRegistry.tsx has correct matcher
3. Run `npm run sync-tiles` if using Notion

## Support

For issues or questions:
- Check `/docs/JARVIS_INTEGRATION.md` (if exists)
- Review Supabase logs
- Check Next.js console output
- Verify environment variables

---

**Implementation Complete**: All 7 tasks finished ✅
