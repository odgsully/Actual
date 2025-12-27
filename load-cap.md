# Load Capacity Analysis

> **Last Updated**: December 19, 2025
> **Purpose**: Comprehensive analysis of system capacity, scalability limits, and recommendations for multi-user/multi-device support
> **Status**: Analysis Complete - Action Items Identified
> **Revision**: Connection pooling assessment updated after codebase verification

---

## Executive Summary

This monorepo contains **4 applications** sharing a single **Supabase PostgreSQL** database, deployed on **Vercel** with **Turborepo**. Current architecture supports **50-100 concurrent users** out of the box due to proper REST API usage (no connection pooling issues). Bottlenecks that will emerge at scale are primarily around rate limiting, memory management, and real-time features.

| Metric | Current Capacity | Recommended Capacity | Gap |
|--------|------------------|---------------------|-----|
| Concurrent Users | ~50-100 | 500+ | **5x improvement needed** |
| Database Connections | N/A (REST API) | N/A | **Not a concern** (see below) |
| Max Properties in DB | ~10,000 | 100,000+ | **Indexing/partitioning needed** |
| API Rate Limits | Implemented | Required | **Done** |
| Real-time Updates | Not implemented | Needed for collaboration | **Missing feature** |

> **Connection Pooling Update**: Codebase verified to use `@supabase/supabase-js` exclusively via REST API (PostgREST). No direct PostgreSQL connections exist. Supabase handles connection management automatically for REST clients.

---

## Application-by-Application Analysis

### 1. gsrealty-client (Port 3004) - PRIMARY CRM

#### Overview
- **Purpose**: Real estate CRM for managing clients, properties, MCAO lookups, and ReportIt PDF generation
- **Database Tables Owned**: `clients`, `files`, `mcao_cache`, `invitations`, `events`, `client_properties`
- **External APIs**: MCAO/ArcGIS, Google Maps, OpenAI, Resend (email)

#### The Good
- **Comprehensive feature set**: PDF generation, Excel processing, email invitations
- **Proper RLS policies**: User-specific data isolation implemented
- **Type-safe**: Full TypeScript with Zod validation
- **Testing infrastructure**: Jest + Playwright configured
- **Caching**: MCAO data cached to reduce API calls

#### The Bad
- **No rate limiting**: API endpoints unprotected from abuse
- **Synchronous PDF generation**: Blocking operation, no queue
- **Large file handling**: Sharp image processing in-memory, no streaming
- **Single-tenant mindset**: No multi-organization support

#### The Ugly
- **MCAO dependency**: Single point of failure for property lookups
- **No retry logic**: External API failures not handled gracefully
- **Memory-intensive operations**: PDF/Excel generation loads entire files into memory
- **No horizontal scaling strategy**: Stateful operations assume single instance

#### Capacity Estimates

| Operation | Current Limit | Bottleneck |
|-----------|--------------|------------|
| Concurrent PDF generations | ~3-5 | Memory (each ~50-100MB) |
| MCAO lookups/hour | ~100 | External API rate limits |
| File uploads | ~10MB max | Vercel function size limits |
| Concurrent users | ~50-75 | Vercel function concurrency |

#### Recommendations

1. **Implement job queue for PDF generation**
   - Use Supabase Edge Functions or external queue (Upstash/SQS)
   - Process async, notify user on completion

2. **Implement rate limiting**
   - Add middleware: `10 requests/minute` for expensive operations
   - Use Upstash Redis for distributed rate limiting

3. **Stream large files**
   - Use streaming responses for PDF downloads
   - Process Excel files in chunks

---

### 2. wabbit-re (Port 3000) - Property Ranking Platform

#### Overview
- **Purpose**: Property ranking/comparison platform for home buyers
- **Database Tables Owned**: `properties`, `rankings`, `user_preferences`, `property_notifications`, `scraping_metrics`, `user_scraping_quota`
- **External APIs**: Google Maps, OpenAI, property scraping targets (Zillow, Redfin, Homes.com)

#### The Good
- **Quota system implemented**: User scraping limits in database
- **Notification infrastructure**: Queue-based email digest system
- **Match scoring**: Automated property-to-preference matching
- **PostGIS support**: Spatial queries for location-based features
- **Price history tracking**: Historical data for price drop alerts

#### The Bad
- **Scraping rate limits hardcoded**: 100-150 requests/hour per source in code
- **No WebSocket for real-time**: Polling required for collaborative rankings
- **Image processing synchronous**: Sharp operations block requests
- **No CDN for property images**: Direct Supabase storage access

#### The Ugly
- **Scraping legal concerns**: No robots.txt compliance verification
- **No retry queue for failed scrapes**: Lost data on transient failures
- **Collaborative rankings via polling**: Inefficient for real-time updates
- **Monolithic scraping job**: Single cron can overwhelm database

#### Capacity Estimates

| Operation | Current Limit | Bottleneck |
|-----------|--------------|------------|
| Properties in database | ~50,000 | Query performance degrades |
| Concurrent ranking sessions | ~10-15 | Database write conflicts |
| Scraping jobs/hour | 300-450 | External rate limits |
| Concurrent users (list view) | ~30-40 | Complex query joins |
| Real-time collaboration | Not supported | No WebSocket |

#### Recommendations

1. **Add Supabase Realtime for collaboration**
   - Subscribe to `rankings` table changes
   - Live collaborative scoring without polling

2. **Implement CDN for property images**
   - Cloudflare Images or Vercel Image Optimization
   - Reduces Supabase bandwidth costs

3. **Shard scraping jobs**
   - Split by source: separate crons for Zillow, Redfin, Homes.com
   - Add exponential backoff on failures

4. **Add database indexes for common queries**
   ```sql
   CREATE INDEX idx_properties_location_price
   ON properties(city, zip_code, list_price)
   WHERE status = 'active';

   CREATE INDEX idx_rankings_user_overall
   ON rankings(user_id, overall_score DESC);
   ```

---

### 3. wabbit (Port 3002) - General Ranking Platform

#### Overview
- **Purpose**: Non-real estate ranking platform (blog content, social voting)
- **Database Tables Owned**: `rankings_general`, `content_items`
- **Status**: Minimal development, shares infrastructure with wabbit-re

#### The Good
- **Lightweight**: Minimal complexity
- **Reuses infrastructure**: Shared Supabase, shared UI components
- **Generic design**: Extensible to any ranking use case

#### The Bad
- **Orphaned codebase**: Duplicates wabbit-re code
- **No unique functionality**: Just a fork with different branding
- **Maintenance burden**: Two apps to update for same features

#### The Ugly
- **Confusion with wabbit-re**: Same migration files, unclear ownership
- **Script duplication**: `_scripts_WABBIT_RE_DO_NOT_USE/` indicates past issues

#### Capacity Estimates
- Inherits all limitations from wabbit-re
- Additional overhead from code duplication

#### Recommendations

1. **Merge into wabbit-re with feature flag**
   - Single codebase, toggle for real estate vs. general mode
   - Reduces maintenance burden by 50%

2. **OR deprecate entirely**
   - If general ranking isn't a priority, archive and focus resources

---

### 4. gs-site (Port 3003) - Personal Dashboard Hub

#### Overview
- **Purpose**: Navigation hub, Notion integration, component showcase
- **Database Tables Owned**: None (read-only aggregator)
- **External APIs**: Notion API

#### The Good
- **Read-only design**: Cannot corrupt shared data
- **Component library**: Motion-Primitives + CultUI showcase
- **Notion integration**: Live data from external workspace
- **No database writes**: Zero impact on main database load

#### The Bad
- **No caching**: Every Notion request hits API
- **No aggregation optimization**: Separate queries per widget
- **Styling dependencies**: Missing packages cause build failures (styled-jsx)

#### The Ugly
- **Feature creep risk**: UI library showcase distracts from core purpose
- **No clear value proposition**: Dashboard for single user?

#### Capacity Estimates

| Operation | Current Limit | Bottleneck |
|-----------|--------------|------------|
| Notion API calls | 3 requests/second | Notion rate limits |
| Concurrent users | 50+ | Mostly static, low resource use |
| Build time | ~12 seconds | Component library size |

#### Recommendations

1. **Add Redis caching for Notion data**
   - Cache queries for 5-15 minutes
   - Reduces API calls by 90%+

2. **Lazy load component showcases**
   - Don't bundle Motion-Primitives demos in main build
   - Load on-demand when user navigates to showcase

---

## Database Analysis (Supabase)

### Current Configuration

| Setting | Current | Production Recommendation |
|---------|---------|--------------------------|
| Plan | Free/Pro | Pro (minimum) |
| Max Connections | N/A (REST API) | N/A |
| Storage | 500MB-8GB | 100GB+ for images |
| Bandwidth | 2GB-50GB | 200GB+ |
| Point-in-time Recovery | No/Yes | Required |
| Read Replicas | No | 1-2 for read scaling |

### Connection Pool Analysis

> **VERIFIED (December 19, 2025)**: Connection pooling is **NOT a concern** for this codebase.

#### Verification Results

Searched for direct PostgreSQL connections:

| Pattern | Results | Status |
|---------|---------|--------|
| `postgres://` | None found | **Clean** |
| `from 'pg'` | None found | **Clean** |
| `DATABASE_URL` | Docs only (.md files) | **Clean** |
| Port `5432` | Street addresses + local dev config | **Clean** |

#### Architecture (Correct as-is)

```
Current Flow (Already Optimal for REST):
User Request → Vercel Function → Supabase REST API → PostgREST → DB
                                 ↑
                          Supabase manages
                          connection pooling
                          internally
```

The codebase uses `@supabase/supabase-js` and `@supabase/ssr` exclusively, which communicate via HTTP to Supabase's PostgREST layer. Supabase handles all connection pooling internally for REST API clients.

#### When Connection Pooling WOULD Be Needed

Only if the project adds:
- Direct `pg` library connections
- Prisma/Drizzle with direct connection strings
- Raw SQL via connection string (not `supabase.rpc()`)

**Current Status**: No action required.

### Table Size Projections

| Table | Current Rows | 1 Year Projection | Action Needed |
|-------|-------------|-------------------|---------------|
| `properties` | ~5,000 | 100,000+ | Add partitioning by city |
| `rankings` | ~500 | 50,000+ | Index on (user_id, overall_score) |
| `property_images` | ~20,000 | 500,000+ | Move to CDN, keep metadata only |
| `mcao_cache` | ~1,000 | 50,000+ | Add TTL, auto-expire old entries |
| `scraping_metrics` | ~5,000 | 500,000+ | Partition by month, auto-archive |

### RLS Performance Impact

Current RLS policies add overhead to every query:

```sql
USING (auth.uid() IS NOT NULL)
```

**Recommendation**:
- Add `SET ROLE` optimization for service-role operations
- Batch operations where possible to reduce RLS checks

---

## Vercel Deployment Analysis

### Current Configuration

```json
{
  "crons": [
    {"path": "/wabbit-re/api/cron/hourly-scrape", "schedule": "0 * * * *"},
    {"path": "/wabbit-re/api/cron/daily-cleanup", "schedule": "0 3 * * *"},
    {"path": "/gsrealty/api/cron/hourly-scrape", "schedule": "0 * * * *"},
    {"path": "/gsrealty/api/cron/daily-cleanup", "schedule": "0 3 * * *"}
  ]
}
```

### Identified Issues

1. **Duplicate cron jobs**: Both apps have identical scraping crons
2. **No cold start mitigation**: First request after idle is slow (~2-3s)
3. **Function timeout**: 10s (Hobby) / 60s (Pro) limits long operations
4. **No edge caching**: Every request hits origin

### Capacity Limits (Vercel Pro)

| Metric | Limit | Impact |
|--------|-------|--------|
| Function Duration | 60 seconds | PDF generation may timeout |
| Payload Size | 4.5MB | Large Excel uploads fail |
| Concurrent Executions | 1000 | Sufficient for 500+ users |
| Bandwidth | 1TB/month | Adequate with CDN |

### Recommendations

1. **Enable Edge Caching**
   ```javascript
   export const config = {
     runtime: 'edge',
     regions: ['iad1', 'sfo1'],
   };
   ```

2. **Add ISR for static pages**
   - Property list views: Revalidate every 60 seconds
   - Dashboard widgets: Revalidate every 300 seconds

3. **Consolidate cron jobs**
   - Single scraping orchestrator that calls both apps
   - Reduces cold starts by 50%

---

## Multi-User / Multi-Device Feasibility

### Current State

| Feature | Status | Notes |
|---------|--------|-------|
| Multi-user authentication | **Working** | Supabase Auth |
| User data isolation | **Working** | RLS policies active |
| Concurrent sessions | **Partial** | No conflict resolution |
| Real-time sync | **Not Implemented** | Requires WebSocket |
| Offline support | **Not Implemented** | No service worker |
| Device sync | **Not Implemented** | No sync mechanism |

### Required for True Multi-Device Support

1. **Supabase Realtime**
   ```typescript
   supabase
     .channel('rankings')
     .on('postgres_changes', {
       event: '*',
       schema: 'public',
       table: 'rankings',
       filter: `user_id=eq.${userId}`
     }, handleChange)
     .subscribe()
   ```

2. **Optimistic Updates**
   - Client predicts state change
   - Rollback on conflict

3. **Last-Write-Wins or CRDT**
   - Simple: Timestamp-based resolution
   - Complex: Conflict-free data types for collaborative editing

---

## Maximum Capacity Estimates

### Current Architecture (Without Changes)

| Metric | Maximum | Confidence |
|--------|---------|------------|
| Concurrent active users | 50-100 | High |
| Peak requests/minute | 1,000 | Medium |
| Database rows (properties) | 50,000 | High |
| Total registered users | 1,000 | Medium |
| Daily active users | 100 | High |

> **Note**: Capacity estimates revised upward after confirming REST API architecture (no connection pooling bottleneck).

### With Recommended Optimizations

| Metric | Maximum | Required Changes |
|--------|---------|-----------------|
| Concurrent active users | 500+ | Rate limiting, caching |
| Peak requests/minute | 5,000+ | Edge functions, CDN |
| Database rows (properties) | 1,000,000+ | Partitioning, read replicas |
| Total registered users | 10,000+ | User management optimization |
| Daily active users | 1,000+ | All optimizations |

---

## Priority Recommendations

### Critical (Do Immediately)

| # | Item | Impact | Effort | Status |
|---|------|--------|--------|--------|
| 1 | Add rate limiting to API routes | Prevents abuse/DDoS | Medium | **DONE** |
| 2 | Fix PDF generation memory issues | Prevents OOM crashes | Medium | Pending |

> ~~Enable Supabase connection pooler~~ - **REMOVED**: Verified that codebase uses REST API exclusively. Supabase handles pooling internally.

#### Rate Limiting Implementation (December 19, 2025)

Created `lib/rate-limit.ts` with pre-configured limiters:

| Limiter | Limit | Window | Applied To |
|---------|-------|--------|------------|
| `auth` | 10 req | 60s | `/api/auth/signup` |
| `expensive` | 5 req | 60s | `/api/admin/reportit/upload` |
| `admin` | 30 req | 60s | `/api/admin/mcao/lookup` |
| `scraping` | 10 req | 3600s | `/api/scrape/on-demand` |
| `standard` | 60 req | 60s | Available for other routes |
| `public` | 20 req | 60s | Available for unauthenticated routes |

**Files modified:**
- `apps/gsrealty-client/lib/rate-limit.ts` (new)
- `apps/wabbit-re/lib/rate-limit.ts` (new)
- `apps/gsrealty-client/app/api/auth/signup/route.ts`
- `apps/wabbit-re/app/api/auth/signup/route.ts`
- `apps/gsrealty-client/app/api/scrape/on-demand/route.ts`
- `apps/gsrealty-client/app/api/admin/reportit/upload/route.ts`
- `apps/gsrealty-client/app/api/admin/mcao/lookup/route.ts`

**Note:** In-memory rate limiting provides per-instance protection in serverless. For distributed rate limiting at scale, upgrade to Upstash Redis.

### High (Do This Quarter)

| # | Item | Impact | Effort |
|---|------|--------|--------|
| 4 | Implement CDN for images | 10x bandwidth reduction | Medium |
| 5 | Add database indexes | 5x query performance | Low |
| 6 | Consolidate cron jobs | 50% cold start reduction | Low |
| 7 | Add Supabase Realtime for rankings | Real-time collaboration | High |

### Medium (Plan for Next Quarter)

| # | Item | Impact | Effort |
|---|------|--------|--------|
| 8 | Merge wabbit into wabbit-re | 50% maintenance reduction | High |
| 9 | Add Redis caching layer | 10x API response time | Medium |
| 10 | Implement job queue for heavy operations | Async processing | High |

### Low (Future Consideration)

| # | Item | Impact | Effort |
|---|------|--------|--------|
| 11 | Database partitioning | Scale to 1M+ rows | High |
| 12 | Read replicas | Geographic distribution | High |
| 13 | PWA/Offline support | Offline-first experience | Very High |

---

## Cost Projections

### Current Estimated Monthly Costs

| Service | Tier | Cost/Month |
|---------|------|------------|
| Vercel | Pro | $20 |
| Supabase | Pro | $25 |
| Google Maps | Pay-as-go | $50-200 |
| OpenAI | Pay-as-go | $20-100 |
| Resend | Starter | $0-20 |
| **Total** | | **$115-365** |

### Scaled (500+ Users) Estimated Costs

| Service | Tier | Cost/Month |
|---------|------|------------|
| Vercel | Pro/Enterprise | $20-400 |
| Supabase | Pro + Compute | $75-200 |
| Google Maps | Higher volume | $200-500 |
| OpenAI | Higher volume | $100-500 |
| Resend | Pro | $50-100 |
| Redis (Upstash) | Pay-as-go | $20-50 |
| CDN (Cloudflare) | Pro | $20-50 |
| **Total** | | **$485-1,800** |

---

## Conclusion

The current architecture is suitable for **early-stage production usage** with 50-100 concurrent users. Key findings:

1. **Connection Pooling**: ✅ **Not needed** - Codebase verified to use REST API exclusively; Supabase handles pooling internally
2. **Rate Limiting**: ✅ **Implemented** - Auth, scraping, and expensive operations protected
3. **Short-term**: Add caching, CDN, and better indexes
4. **Long-term**: Implement real-time sync, job queues, and consider database partitioning

The system has a **stronger foundation than initially assessed**. The REST API architecture eliminates the most common serverless scaling pitfall (connection exhaustion). Focus efforts on API protection and memory management.

---

## Related Documentation

- [Architecture Overview](./docs/ARCHITECTURE.md)
- [Database Ownership](./docs/DATABASE_OWNERSHIP.md)
- [Safety Protocols](./docs/SAFETY_PROTOCOLS.md)
- [Migration Progress](./MIGRATION_PROGRESS_TRACKER.md)
