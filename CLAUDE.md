# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## User Communication Rules

**"Reply in chat"** = Text response only. NO tool calls (no Read, Write, Edit, Bash, etc.). Just answer conversationally.

**"ULTRATHINK"** = Use extended thinking for deep analysis before responding.

## ⚠️ Critical Context (September 5, 2024)

**IMPORTANT**: This is the restored working version from the `main` branch. The `clean-deployment` branch was corrupted (missing 34,199 files including authentication) and should NOT be used. See `Fix_explain_09.05.md` and `docs/deployment/DEPLOYMENT_FIX_CONTEXT.md` for restoration details.

## Safety Documentation

For detailed safety protocols, database ownership, and emergency procedures, see:
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) - System overview
- [docs/DATABASE_OWNERSHIP.md](./docs/DATABASE_OWNERSHIP.md) - Table ownership rules
- [docs/SAFETY_PROTOCOLS.md](./docs/SAFETY_PROTOCOLS.md) - Guardrails and protection
- [docs/RUNBOOK.md](./docs/RUNBOOK.md) - Emergency procedures
- [docs/ESCAPE_HATCHES.md](./docs/ESCAPE_HATCHES.md) - Legitimate bypasses

## Monorepo Migration Documentation

**Current Status:** 60% Complete (Phase 2) - See documents below for details.

| Document | Purpose |
|----------|---------|
| [`MIGRATION_PROGRESS_TRACKER.md`](./MIGRATION_PROGRESS_TRACKER.md) | **Primary roadmap** - Day-to-day progress, troubleshooting, operational status |
| [`MIGRATION_SAFETY_PROTOCOLS.md`](./MIGRATION_SAFETY_PROTOCOLS.md) | **Safety reference** - Ultra-conservative procedures for high-risk operations |

**When to use Safety Protocols:** Database schema changes, production deployments, file moves/deletes, any operation that could cause data loss.

## Common Development Commands

### Development & Build
- `npm run dev` - Start Next.js development server on port 3000
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality checks
- `npm run typecheck` - Run TypeScript type checking with `tsc --noEmit`
- `npm run format` - Format code with Prettier

### Testing
- `npm test` - Run Jest unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:e2e` - Run Playwright end-to-end tests

### Database Operations
- `npm run db:migrate` - Push database migrations to Supabase
- `npm run db:seed` - Seed database with initial data
- `npm run db:seed-demo` - Create demo account
- `npm run db:update-demo` - Update demo account password
- `npm run db:seed-data` - Seed sample property data

### Deployment
- PM2 process management: `pm2 start ecosystem.config.js`
- Deploy script location: `deployment/deploy.sh`
- Nginx config: `deployment/nginx.conf`
- Server setup: `deployment/server-setup.sh`

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 14.1.0 with React 18, TypeScript
- **Styling**: Tailwind CSS with Radix UI components
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Maps**: Google Maps API with @googlemaps/js-api-loader
- **AI**: OpenAI API for location intelligence
- **State Management**: Zustand for client state, React Query for server state
- **Forms**: React Hook Form with Zod validation
- **Process Management**: PM2 for production
- **Server**: Nginx reverse proxy with Let's Encrypt SSL

### Project Structure
```
/app                    # Next.js App Router pages and API routes
  /api                  # API endpoints (health, email, preferences, setup)
  /form                 # Multi-step preferences questionnaire
  /rank-feed           # 4-tile property ranking interface
  /list-view           # Property list/grid view
  /settings            # User settings and preferences
  /signup              # User registration flow
  /setup/[token]       # Token-based setup flow
/components            # Reusable UI components
  /auth               # Authentication components (SignInModal)
  /form               # Form components (ResponseSummary)
/contexts              # React context providers
  AuthContext.tsx     # Authentication state management
/lib                   # Core utilities
  /database            # Database access functions (users, properties, rankings, preferences)
  /supabase            # Supabase client configuration
/deployment            # Production deployment scripts and configs
/scripts               # Database seeding and utility scripts
/scrape_3rd           # MLS data scraping utilities
/hooks                 # Custom React hooks
/public                # Static assets
```

### Key Application Routes
- `/` - Landing page with navigation to all features
- `/signup` - New user registration
- `/form` - 7-page preferences questionnaire
- `/rank-feed` - Main property evaluation interface (4-tile layout)
- `/list-view` - Property browsing with filters
- `/settings` - User preferences and account management
- `/setup/[token]` - Magic link setup flow

### API Endpoints
- `/api/health` - Health check endpoint
- `/api/email/verify` - Email verification
- `/api/preferences/submit` - Submit user preferences
- `/api/setup/validate` - Validate setup token
- `/api/setup/complete` - Complete account setup

### Environment Variables Required
Production deployment requires these in `.env.production` or `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `NEXT_PUBLIC_APP_URL` - Application URL (https://wabbit-rank.ai)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps API key
- `OPENAI_API_KEY` - OpenAI API key for location intelligence

### TypeScript Configuration
- Strict mode enabled
- Path aliases configured (@/components, @/lib, etc.)
- Excludes: node_modules, dev_buildout, "every cc [copy] copy"

### Important Documentation Files
- `README.md` - Project overview and quick start
- `MIGRATION_PROGRESS_TRACKER.md` - **Main development roadmap** (60% complete)
- `MIGRATION_SAFETY_PROTOCOLS.md` - Ultra-conservative safety procedures for migrations
- `WABBIT_PRD.md` - Product requirements document
- `SUBAGENT_PLAN.md` - Architecture and implementation plan
- `docs/supabase/SUPABASE_SETUP.md` - Database setup instructions
- `GOOGLE_MAPS_SETUP.md` - Maps API configuration
- `DEMO_SETUP.md` - Demo account setup instructions
- `database-schema.sql` - Complete database schema
- `test-verification-flow.md` - Testing documentation

### Data Processing
The platform processes:
- Client preferences from `CRM-Buyer-preferences.xlsx`
- MLS property data from `MLS scrape_[BuyerEmail].xlsx`
- Property images from `/MLS_Image_scrape_[BuyerEmail]/`

### Current Implementation Status
✅ Complete:
- User authentication system (sign up, sign in, sign out)
- Email verification with magic links
- 7-page preferences form
- Property ranking interface (4-tile layout)
- List view with filtering
- Settings management
- Responsive design
- Demo account system (support@wabbit-rank.ai)
- Token-based account setup flow

⏳ Pending:
- Supabase backend integration (partial)
- Real MLS data import
- Google Maps integration
- OpenAI location intelligence
- Multi-user collaboration features
- Third-party platform connections

### Critical Deployment Notes
- **Production Server**: Hetzner CPX11 (5.78.100.116)
- **Domain**: wabbit-rank.ai with Cloudflare DNS
- **SSL**: Let's Encrypt via Certbot
- **Process Manager**: PM2 with ecosystem.config.js
- **Monitoring**: Hetzner metrics + PM2 monitoring
- **Backups**: Weekly Hetzner snapshots

### Known Issues & Fixes
- **September 5, 2024**: Restored from `clean-deployment` branch corruption
  - Lost 34,199 files including authentication
  - Recovered from `main` branch (Actual-clean directory)
  - See `Fix_explain_09.05.md` for details
- **DNS Issue**: Nameserver mismatch between Namecheap and Cloudflare
  - Required: lana.ns.cloudflare.com and leif.ns.cloudflare.com
  - See `docs/deployment/DEPLOYMENT_FIX_CONTEXT.md` for resolution steps

### Testing Checklist
Before deployment, verify:
- [ ] User can sign up with email/password
- [ ] User can sign in and sign out
- [ ] Demo account auto-signs in correctly
- [ ] Preferences form saves data
- [ ] Email verification sends (check console in dev)
- [ ] Token-based setup flow works
- [ ] All routes load without errors
- [ ] Property scrapers work (`/api/scrape/test`)
- [ ] Vercel cron jobs are configured
- [ ] Health monitoring is active

### Branch Guidelines
- **USE**: `main` branch (verified working)
- **DO NOT USE**: `clean-deployment` (corrupted, missing files)
- **ALTERNATIVE**: `deployment-config` (has deployment files)

## Vercel Deployment Status (January 9, 2025)

### Current Status
- **Project**: wabbit-property-scraping (linked to Vercel)
- **Account**: odgsullys-projects (Pro Plan Active)
- **Branch**: populate-property-scraped
- **Environment Variables**: All configured in Vercel Dashboard
- **Google Maps API**: Secured with domain restrictions
- **Ready for**: `vercel --prod --force` deployment

### Known Limitations
- Google Maps doesn't work on Vercel preview deployments (wildcard pattern not supported)
- Pro plan required for hourly cron jobs

## Property Scraping System (January 9, 2025)

### Overview
Complete property scraping and filtering system for Maricopa County, Arizona with automated hourly updates via Vercel Cron.

### Scraping Capabilities
- **Sources**: Zillow, Redfin, Homes.com
- **Rate Limits**: 100-150 requests/hour per source
- **Processing**: 300-450 properties/hour total
- **Coverage**: 50+ Maricopa County cities, 100+ ZIP codes
- **Filtering**: Automatic Maricopa County validation

### Key Components
- **Scrapers**: `/lib/scraping/scrapers/` (Playwright-based)
- **Queue Manager**: `/lib/scraping/queue-manager.ts`
- **Data Normalizer**: `/lib/pipeline/data-normalizer.ts`
- **Property Manager**: `/lib/database/property-manager.ts`
- **Image Optimizer**: `/lib/storage/image-optimizer.ts`
- **Notifier**: `/lib/notifications/property-notifier.ts`

### Vercel Cron Jobs
Configured in `vercel.json`:
- **Hourly Scrape**: `0 * * * *` - Updates properties
- **Daily Cleanup**: `0 3 * * *` - Database maintenance
- **Health Check**: `*/15 * * * *` - System monitoring

### API Endpoints
- `/api/cron/hourly-scrape` - Automated property updates
- `/api/cron/daily-cleanup` - Data cleanup
- `/api/cron/check-health` - Health monitoring
- `/api/scrape/on-demand` - User-triggered scraping
- `/api/scrape/test` - Development testing
- `/api/admin/monitoring` - Admin dashboard

### User Features
- On-demand scraping with quota (10/hour free tier)
- Instant notifications for matches >70% score
- Price drop alerts for favorited properties
- Preference-based automatic matching

### Database Tables (New)
Run `migrations/002_add_scraping_tables.sql` for:
- `property_notifications` - User alerts
- `notification_queue` - Email digest queue
- `user_notification_preferences` - Settings
- `user_scraping_quota` - Usage limits
- `scraping_metrics` - Performance tracking
- `property_price_history` - Price tracking

### Testing Scrapers
```bash
# Test Zillow scraper
curl -X POST http://localhost:3000/api/scrape/test \
  -H "Content-Type: application/json" \
  -d '{"source": "zillow", "searchCriteria": {"city": "Scottsdale"}}'

# Check system health
curl http://localhost:3000/api/cron/check-health
```

### Required Environment Variables (Additional)
- `CRON_SECRET` - Vercel cron authentication
- `ALERT_WEBHOOK_URL` - Optional monitoring webhook

### Deployment Note
After deploying to Vercel, verify cron jobs are active in Vercel Dashboard → Functions → Cron.

For detailed implementation status, see `SCRAPING_SYSTEM_STATUS.md`.