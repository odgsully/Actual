# Cross-App API & Communication

> Last Updated: December 2025
> Purpose: Define how apps can safely share data and communicate

## Philosophy

Apps in this monorepo are **isolated by default**. Cross-app communication must be:

1. **Explicit** - Documented and intentional
2. **Read-preferring** - Prefer reads over writes
3. **API-mediated** - No direct database access across apps
4. **Auditable** - Logged for troubleshooting

---

## Current Cross-App Data Needs

### gsrealty-client → wabbit-re

| Data | Direction | Purpose | Method |
|------|-----------|---------|--------|
| Property listings | READ | Show available properties to clients | API call |
| Property images | READ | Display in client portal | Direct storage URL |

### wabbit-re → gsrealty-client

| Data | Direction | Purpose | Method |
|------|-----------|---------|--------|
| Client preferences | READ | Match properties to buyers | API call |
| Client contact info | READ | Send notifications | API call |

### gs-site → All Apps

| Data | Direction | Purpose | Method |
|------|-----------|---------|--------|
| Aggregate counts | READ | Dashboard statistics | API calls |
| User session | READ | Authentication status | Shared auth |

---

## Recommended Patterns

### Pattern 1: Shared Package Functions

For frequently accessed cross-app data, create functions in `packages/`:

```typescript
// packages/supabase/src/cross-app/properties.ts
export async function getPropertiesForClient(clientId: string) {
  // Centralized, auditable access
  const { data, error } = await supabase
    .from('properties')
    .select('id, address, price, image_url')
    .eq('status', 'active');

  logCrossAppAccess('gsrealty-client', 'properties', 'read', clientId);

  return { data, error };
}
```

### Pattern 2: Internal API Routes

For complex operations, use internal API routes:

```typescript
// apps/wabbit-re/app/api/internal/properties/route.ts
import { validateInternalRequest } from '@repo/utils/internal-api';

export async function GET(request: Request) {
  // Validate request comes from another app in the monorepo
  const { valid, appContext } = await validateInternalRequest(request);

  if (!valid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Log the cross-app access
  await logCrossAppAccess(appContext, 'properties', 'read');

  // Return data
  const properties = await getProperties();
  return Response.json(properties);
}
```

### Pattern 3: Shared Database Views (Read-Only)

For simple reads, create database views:

```sql
-- View for gsrealty-client to read property summaries
CREATE VIEW gsrealty_property_summary AS
SELECT
  id,
  address,
  city,
  price,
  bedrooms,
  bathrooms,
  primary_image_url
FROM properties
WHERE status = 'active';

-- Grant read-only access
GRANT SELECT ON gsrealty_property_summary TO authenticated;
```

---

## Forbidden Patterns

### ❌ Direct Cross-App Database Writes

```typescript
// WRONG - gsrealty-client writing to wabbit-re table
import { supabase } from '@/lib/supabase/client';

await supabase
  .from('properties')  // This is wabbit-re's table!
  .insert({ ... });    // DON'T DO THIS
```

### ❌ Importing From Other Apps

```typescript
// WRONG - Importing directly from another app
import { PropertyCard } from '../../../wabbit-re/components/PropertyCard';

// RIGHT - Use shared packages
import { PropertyCard } from '@repo/ui/PropertyCard';
```

### ❌ Sharing Service Keys

```bash
# WRONG - Same service key for all apps
SUPABASE_SERVICE_ROLE_KEY=xxx  # Shared

# RIGHT - App-specific keys (future)
SUPABASE_SERVICE_KEY_GSREALTY=xxx
SUPABASE_SERVICE_KEY_WABBIT=xxx
```

---

## Event-Based Communication (Future)

For real-time cross-app updates, consider:

### Supabase Realtime Channels

```typescript
// gsrealty-client subscribing to property updates
const channel = supabase
  .channel('property-updates')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'properties'
  }, (payload) => {
    // Handle new property
    notifyClientsOfNewProperty(payload.new);
  })
  .subscribe();
```

### Custom Event System

```typescript
// packages/utils/src/events.ts
export async function emitCrossAppEvent(
  sourceApp: string,
  eventType: string,
  payload: unknown
) {
  await supabase
    .from('cross_app_events')
    .insert({
      source_app: sourceApp,
      event_type: eventType,
      payload,
      created_at: new Date().toISOString()
    });
}

// Usage in gsrealty-client
await emitCrossAppEvent('gsrealty-client', 'client_updated', { clientId: '123' });
```

---

## Access Logging

All cross-app access should be logged:

```typescript
// packages/utils/src/cross-app-logger.ts
export async function logCrossAppAccess(
  requestingApp: string,
  targetResource: string,
  operation: 'read' | 'write',
  context?: Record<string, unknown>
) {
  const entry = {
    timestamp: new Date().toISOString(),
    requesting_app: requestingApp,
    target_resource: targetResource,
    operation,
    context
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[CROSS-APP]', entry);
  }

  // Log to database in production
  if (process.env.NODE_ENV === 'production') {
    await supabase.from('cross_app_access_log').insert(entry);
  }
}
```

---

## Quick Reference: Who Can Access What

```
┌─────────────────────────────────────────────────────────────────┐
│                    ACCESS MATRIX                                │
├─────────────────┬───────────────┬───────────────┬──────────────┤
│                 │ gsrealty-     │ wabbit-re     │ gs-site      │
│                 │ client tables │ tables        │ (read-only)  │
├─────────────────┼───────────────┼───────────────┼──────────────┤
│ gsrealty-client │ READ/WRITE    │ READ          │ N/A          │
│ wabbit-re       │ READ          │ READ/WRITE    │ N/A          │
│ gs-site         │ READ (counts) │ READ (counts) │ N/A          │
│ wabbit          │ NONE          │ NONE          │ N/A          │
└─────────────────┴───────────────┴───────────────┴──────────────┘
```

---

## Related Documentation

- [Database Ownership](./DATABASE_OWNERSHIP.md) - Table ownership rules
- [Architecture](./ARCHITECTURE.md) - System overview
- [Safety Protocols](./SAFETY_PROTOCOLS.md) - Protection measures
