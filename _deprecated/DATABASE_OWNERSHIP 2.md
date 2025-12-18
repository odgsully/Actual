# Database Ownership Registry

> Last Updated: December 2025
> Purpose: Define which app owns which tables to prevent cross-contamination

## Critical Rules

1. **Apps MUST NOT write to tables they don't own**
2. **Cross-app reads require explicit documentation**
3. **Schema changes require owner app approval**
4. **Destructive operations require backup verification**

---

## Ownership Matrix

### gsrealty-client (Port 3004)

| Table | Access | Description |
|-------|--------|-------------|
| `clients` | **OWNER** | Real estate client records |
| `files` | **OWNER** | Uploaded files metadata |
| `mcao_cache` | **OWNER** | MCAO property data cache |
| `invitations` | **OWNER** | Client invitation tokens |
| `events` | **OWNER** | Activity log/audit trail |
| `client_properties` | **OWNER** | Client-property associations |

**Scripts that modify these tables**:
- `lib/database/clients.ts`
- `lib/database/files.ts`
- `lib/database/mcao.ts`
- `lib/database/invitations.ts`

---

### wabbit-re (Port 3000)

| Table | Access | Description |
|-------|--------|-------------|
| `properties` | **OWNER** | Property listings |
| `rankings` | **OWNER** | User property rankings |
| `user_preferences` | **OWNER** | Buyer preference questionnaire |
| `property_notifications` | **OWNER** | Match notifications |
| `notification_queue` | **OWNER** | Email digest queue |
| `user_notification_preferences` | **OWNER** | Notification settings |
| `user_scraping_quota` | **OWNER** | Usage limits |
| `scraping_metrics` | **OWNER** | Performance tracking |
| `property_price_history` | **OWNER** | Price tracking |

**Scripts that modify these tables**:
- `lib/database/properties.ts`
- `lib/database/rankings.ts`
- `lib/database/preferences.ts`
- `lib/database/property-manager.ts`

---

### Shared Tables (All Apps)

| Table | Access | Description |
|-------|--------|-------------|
| `users` | READ/WRITE | Supabase Auth managed |
| `profiles` | READ/WRITE | Extended user profiles |

**Note**: These tables are managed by Supabase Auth. Direct manipulation should be avoided.

---

### gs-site (Port 3003)

| Table | Access | Description |
|-------|--------|-------------|
| (none) | READ-ONLY | Aggregator app, no owned tables |

**Allowed reads**:
- `clients` (count only)
- `properties` (count only)
- `users` (own profile only)

---

### wabbit (Port 3002)

| Table | Access | Description |
|-------|--------|-------------|
| `rankings_general` | **OWNER** | General content rankings |
| `content_items` | **OWNER** | Non-real estate content |

---

## Forbidden Cross-Access

### gsrealty-client MUST NOT:
```sql
-- ❌ FORBIDDEN
INSERT INTO properties ...
UPDATE rankings SET ...
DELETE FROM user_preferences ...
TRUNCATE properties
```

### wabbit-re MUST NOT:
```sql
-- ❌ FORBIDDEN
INSERT INTO clients ...
UPDATE files SET ...
DELETE FROM mcao_cache ...
TRUNCATE invitations
```

---

## Allowed Cross-Reads

### gsrealty-client MAY read:
```sql
-- ✅ ALLOWED (read-only)
SELECT * FROM properties WHERE ...  -- For client property matching
SELECT COUNT(*) FROM rankings ...   -- For analytics
```

### wabbit-re MAY read:
```sql
-- ✅ ALLOWED (read-only)
SELECT * FROM clients WHERE ...     -- For user context
SELECT * FROM files WHERE ...       -- For property images
```

---

## Dangerous Scripts Registry

These scripts can modify multiple tables. Use with extreme caution.

| Script | Location | Risk Level | Affected Tables |
|--------|----------|------------|-----------------|
| `clean-all-properties.ts` | `_scripts_WABBIT_RE_DO_NOT_USE/` | 🔴 CRITICAL | properties, rankings |
| `seed-demo-account.ts` | `_scripts_WABBIT_RE_DO_NOT_USE/` | 🟠 HIGH | users, properties |
| `run-migration` | `app/api/admin/run-migration/` | 🔴 CRITICAL | ALL |

---

## Migration Ownership

| Migration File | Owner App | Affects |
|----------------|-----------|---------|
| `001_initial_schema.sql` | wabbit-re | Core tables |
| `002_add_scraping_tables.sql` | wabbit-re | Scraping system |
| `003_gsrealty_tables.sql` | gsrealty-client | CRM tables |
| `004_mcao_cache.sql` | gsrealty-client | MCAO system |

**Rule**: Only the owner app should run migrations for its tables.

---

## RLS Policy Recommendations

### Future Implementation

```sql
-- Example: Enforce app context via JWT claims
CREATE POLICY "gsrealty_clients_isolation" ON clients
FOR ALL
USING (
  auth.jwt() ->> 'app_context' = 'gsrealty-client'
  OR auth.role() = 'service_role'
);

-- Example: Read-only cross-app access
CREATE POLICY "wabbit_read_clients" ON clients
FOR SELECT
USING (
  auth.jwt() ->> 'app_context' = 'wabbit-re'
);
```

---

## Verification Queries

Run these to verify ownership is respected:

```sql
-- Check for unexpected writes (run periodically)
SELECT
  table_name,
  COUNT(*) as write_count,
  MAX(created_at) as last_write
FROM audit_log
WHERE operation IN ('INSERT', 'UPDATE', 'DELETE')
  AND app_context != expected_owner
GROUP BY table_name;
```

---

## Related Documentation

- [Architecture](./ARCHITECTURE.md) - System overview
- [Safety Protocols](./SAFETY_PROTOCOLS.md) - Guardrails
- [Runbook](./RUNBOOK.md) - Emergency procedures
