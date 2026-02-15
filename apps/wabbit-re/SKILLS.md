# Wabbit Real Estate Platform — SKILLS.md

> Slash-command skills for Claude Code development on the property scraping and ranking platform.
>
> **Port:** 3000 | **Domain:** wabbit-rank.ai | **Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, Supabase + PostGIS, Playwright

---

## Quick Reference

| Skill | Purpose | When to Use |
|-------|---------|-------------|
| `/wabbit-setup` | Initialize dev environment | New session, fresh clone |
| `/scraper-debug` | Diagnose scraper failures | Zillow/Redfin/Homes.com down |
| `/scraper-test` | Test individual scraper | Verify scraper output |
| `/property-score` | Debug ranking/matching | Scoring algorithm issues |
| `/verify-rank` | End-to-end pipeline test | Full pipeline validation |
| `/db-migrations` | Execute/troubleshoot migrations | Schema changes |
| `/db-schema-docs` | Generate schema documentation | Schema reference |
| `/monitor-cron` | Check cron job status | Verify automated tasks |
| `/performance-check` | Analyze scraping throughput | Optimization |
| `/quota-reset` | Manage user scraping quotas | Rate limit issues |
| `/property-import` | Import from Excel/MLS | Bulk data seeding |
| `/user-prefs-load` | Debug preferences form | Form load failures |
| `/notify-test` | Test notification system | Alerts not sending |
| `/api-test` | Test API endpoints | Endpoint debugging |
| `/cron-setup` | Configure Vercel cron jobs | Deployment prep |

---

## Property Scraping System

### /wabbit-setup

**Initialize the complete development environment**

**Actions:**
1. Verify Node.js >= 18.17.0
2. Install npm dependencies
3. Run Supabase migrations (PostGIS, scraping tables, RPC functions)
4. Seed demo user account
5. Create test properties
6. Verify Google Maps API configuration
7. Confirm Playwright browsers installed
8. Output health check report

**Key Files:**
- `package.json` — dependencies, scripts
- `migrations/001_enable_postgis_spatial_features.sql`
- `migrations/002_add_scraping_tables_final.sql`
- `scripts/seed-demo-account.ts`

---

### /scraper-debug [source]

**Diagnose why property scrapers are failing**

**Sources:** `zillow` | `redfin` | `homes.com` | `all`

**Checks:**
1. Playwright browser availability
2. Rate limit configuration per source
3. Network connectivity to scraping sources
4. Recent errors from `scraping_errors` table
5. Blocked URLs in `blocked_urls` table
6. Queue status from `scraping_metrics` table

**Key Files:**
- `lib/scraping/error-handler.ts`
- `lib/scraping/queue-manager.ts`
- `app/api/admin/monitoring/route.ts`

---

### /scraper-test [source] --city [city] --min-price [n] --max-price [n]

**Test an individual scraper with real search parameters**

**Returns:**
- Number of properties found
- Data quality metrics
- Execution time
- Schema validation results
- Duplicate handling report
- Image processing results

**Key Files:**
- `lib/scraping/scrapers/zillow-scraper.ts`
- `lib/scraping/scrapers/redfin-scraper.ts`
- `lib/scraping/scrapers/homes-scraper.ts`
- `app/api/scrape/test/route.ts`

**Test Command:**
```bash
curl -X POST http://localhost:3000/api/scrape/test \
  -H "Content-Type: application/json" \
  -d '{"source": "zillow", "searchCriteria": {"city": "Scottsdale"}}'
```

---

### /property-score --property-id [uuid]

**Debug property matching scores and ranking algorithm**

**Shows:**
- Point-by-point scoring breakdown (Price:Value, Location, Layout, Turnkey)
- Property characteristics vs user preferences comparison
- Why properties score above/below 70% threshold
- Preference matching edge cases
- Algorithm improvement suggestions

**Key Files:**
- `lib/pipeline/data-normalizer.ts` — scoring logic
- `lib/scraping/types.ts` — NormalizedProperty, UserPreferences
- `lib/database/property-manager.ts`

---

### /verify-rank --user [email] --source [source]

**Test the complete ranking pipeline end-to-end**

**Pipeline:**
1. Scrape test properties from source
2. Apply data normalization
3. Run preference matching against user
4. Calculate ranking scores
5. Store results
6. Compare against expected behavior
7. Generate performance report

**Key Files:**
- `lib/scraping/` — all scrapers
- `lib/pipeline/data-normalizer.ts`
- `app/api/cron/hourly-scrape/route.ts`

---

## Database & Migrations

### /db-migrations [status|run|rollback]

**Execute, verify, and troubleshoot migrations**

**Subcommands:**
- `status` — list migrations with current state
- `run --all` — execute pending migrations
- `run [filename]` — execute specific migration
- `rollback --to [n]` — revert to migration number

**Migration Files:**
- `migrations/001_enable_postgis_spatial_features.sql`
- `migrations/002_add_scraping_tables_final.sql`
- `migrations/002_spatial_rpc_functions.sql`
- `migrations/003_fix_search_areas_display.sql`

---

### /db-schema-docs

**Generate comprehensive database schema documentation**

**Output:**
- All tables, columns, types, constraints
- RLS policies and effects
- RPC functions and triggers
- Data dictionary with descriptions

**Reference:** `ref/sql/database-schema.sql`

---

## Monitoring & Operations

### /monitor-cron

**Check Vercel cron job execution status**

**Cron Jobs:**
| Schedule | Endpoint | Purpose |
|----------|----------|---------|
| `0 * * * *` | `/api/cron/hourly-scrape` | Property updates |
| `*/15 * * * *` | `/api/cron/check-health` | System monitoring |
| `0 3 * * *` | `/api/cron/daily-cleanup` | Database maintenance |

**Checks:**
- Last run time, duration, success/failure
- Error patterns
- Missed execution windows
- CRON_SECRET configuration
- Processing queue depth

---

### /performance-check --range [24h|7d|30d]

**Analyze scraping system performance metrics**

**Rate Limits (per hour):**
| Source | Requests/hr | Delay |
|--------|------------|-------|
| Zillow | 100 | 5 sec |
| Redfin | 120 | 4 sec |
| Homes.com | 150 | 3 sec |

**Metrics:**
- Properties/hour by source
- Average processing time
- Error rates and types
- Queue depth and speed
- Image processing performance

---

### /quota-reset --user-id [uuid]

**Manage user scraping quotas**

**Tiers:**
| Tier | Hourly | Daily | Monthly |
|------|--------|-------|---------|
| Free | 10 | 100 | 1,000 |
| Premium | Configurable | Configurable | Configurable |

**Actions:** View status, reset counters, change tier, generate usage reports

---

## Data Import

### /property-import --file [path]

**Import properties from Excel/MLS data**

**Actions:**
1. Parse Excel files (`MLS scrape_*.xlsx`)
2. Validate against Maricopa County boundaries
3. Handle duplicate detection (address, MLS number, coordinates)
4. Normalize address formats
5. Compute coordinates from addresses
6. Generate import report

---

### /user-prefs-load --user-id [uuid]

**Debug user preference form loading**

**Checks:**
- Load preferences from `buyer_preferences` table
- Validate form structure against schema
- Identify missing or corrupted fields
- Test form auto-population
- Verify completion status

---

## Notifications

### /notify-test --user-id [uuid] --type [type]

**Test the notification system**

**Notification Types:**
- `new_match` — property scores >70%
- `price_drop` — favorited property price decrease
- `status_change` — listing status update
- `back_on_market` — re-listed property

**Key Files:**
- `lib/notifications/property-notifier.ts`
- Tables: `property_notifications`, `notification_queue`, `user_notification_preferences`

---

## API Testing

### /api-test [endpoint]

**Test API endpoints with various payloads**

**Endpoints:**
- `/api/health` — health check
- `/api/scrape/test` — scraper testing
- `/api/scrape/on-demand` — user-triggered scrape
- `/api/preferences/load` — load user prefs
- `/api/preferences/submit` — save user prefs
- `/api/cron/hourly-scrape` — cron job trigger
- `/api/admin/monitoring` — admin dashboard

---

## Scraping Pipeline Architecture

```
Queue Manager → Scrapers → Data Normalizer → Property Manager → Notifier
     ↓              ↓            ↓                  ↓              ↓
queue-manager.ts  scrapers/  data-normalizer.ts  property-manager.ts  property-notifier.ts
                                                       ↓
                                                 Image Optimizer
                                                 image-optimizer.ts
```

**Key Concepts:**
- All scrapers auto-filter for Maricopa County, AZ only
- Playwright required for browser automation
- Rate limiting strictly enforced to avoid detection
- Data normalized to consistent schema before storage
- Duplicate detection by address, MLS number, and coordinates
- PostGIS enables polygon-based search area support
- Cron jobs have 5-minute timeout

---

## Environment Variables

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

# Optional
OPENAI_API_KEY=              # Future location intelligence
ALERT_WEBHOOK_URL=           # Monitoring webhook
```

## Common Commands

```bash
# Development
npm run dev                  # Start dev server (port 3000)
npm run typecheck            # Type safety check
npm run lint                 # Code quality

# Database
npm run db:migrate           # Push migrations
npm run db:seed-demo         # Create demo account
npm run db:seed-data         # Seed sample properties

# Testing
npm test                     # Run Jest tests
npm run test:watch           # Watch mode
npm run test:e2e             # Playwright E2E

# Deployment
npm run build                # Production build
vercel --prod                # Deploy to production
```

## Common Workflows

### Complete Scraping Workflow
1. `/wabbit-setup`
2. `/scraper-test zillow --city Scottsdale`
3. `/verify-rank --source zillow --sample-size 20`
4. `/performance-check --range 24h`
5. `/monitor-cron`

### Troubleshooting Pipeline
1. `/monitor-cron`
2. `/scraper-debug zillow`
3. `/scraper-test zillow --verbose`
4. `/property-score --property-id [uuid]`
5. `/performance-check --verbose`

### Database Operations
1. `/db-schema-docs`
2. `/db-migrations status`
3. `/db-migrations run --all`
4. `/property-import --file data.xlsx --validate-only`
5. `/verify-rank`
