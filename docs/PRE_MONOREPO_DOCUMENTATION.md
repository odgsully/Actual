# Pre-Monorepo Documentation
## Date: January 2025
## Branch: populate-property-scraped

## Current Folder Structure

```
Actual/
├── app/                         # Next.js App Router
│   ├── api/                    # API Routes
│   │   ├── admin/              # Admin endpoints
│   │   ├── areas/              # Search area management
│   │   ├── auth/               # Authentication
│   │   ├── cron/               # Scheduled jobs (hourly-scrape, daily-cleanup, check-health)
│   │   ├── email/              # Email verification
│   │   ├── health/             # Health check
│   │   ├── preferences/        # User preferences
│   │   ├── properties/         # Property spatial queries
│   │   ├── scrape/             # Property scraping (test, on-demand)
│   │   └── setup/              # Account setup
│   ├── agent-view/             # Agent view page
│   ├── auth/                   # Auth pages (confirm, forgot-password, reset-password)
│   ├── form/                   # 7-page preferences form
│   ├── list-view/              # Property list/grid view
│   ├── map-test/               # Map testing page
│   ├── rank-feed/              # 4-tile property ranking interface
│   ├── settings/               # User settings
│   ├── setup/                  # Token-based setup flow
│   ├── signin/                 # Sign in page
│   ├── signup/                 # Sign up page
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Landing page
├── components/                  # React components
│   ├── auth/                   # Auth components
│   ├── form/                   # Form components
│   └── map/                    # Map components
├── contexts/                   # React contexts
│   ├── AuthContext.tsx         # Authentication state
│   └── MapContext.tsx          # Map state
├── hooks/                      # Custom React hooks
├── lib/                        # Core utilities
│   ├── database/               # Database functions
│   ├── map/                    # Map utilities
│   ├── notifications/          # Notification system
│   ├── pipeline/               # Data processing
│   ├── scraping/               # Scraping system
│   ├── storage/                # Image storage
│   └── supabase/               # Supabase clients
├── migrations/                 # Database migrations
├── public/                     # Static assets
├── scripts/                    # Utility scripts
├── scrape_3rd/                # MLS scraping tools
├── .claude/                    # Claude Code configuration
├── .vercel/                    # Vercel configuration
├── email-templates/            # Email templates
└── deployment/                 # Deployment scripts

## API Endpoints

### Authentication
- POST `/api/auth/signup` - User registration
- GET `/api/auth/confirm` - Email confirmation

### User Management
- POST `/api/email/verify` - Email verification
- GET `/api/setup/validate` - Validate setup token
- POST `/api/setup/complete` - Complete account setup

### Preferences
- POST `/api/preferences/submit` - Submit user preferences
- GET `/api/preferences/load` - Load user preferences
- POST `/api/preferences/save` - Save preferences

### Property Scraping
- POST `/api/scrape/test` - Test scraping endpoint
- POST `/api/scrape/on-demand` - On-demand property scraping

### Search Areas
- GET `/api/areas/list` - List user's search areas
- POST `/api/areas/save` - Save search area
- PUT `/api/areas/update` - Update search area
- DELETE `/api/areas/delete` - Delete search area

### Properties
- POST `/api/properties/spatial` - Spatial property queries

### Admin
- POST `/api/admin/delete-user` - Delete user account
- GET `/api/admin/monitoring` - System monitoring
- POST `/api/admin/run-migration` - Run database migration

### System
- GET `/api/health` - Health check endpoint

## Cron Jobs (Vercel)

### Configured in vercel.json:
1. **Hourly Scrape** (`/api/cron/hourly-scrape`)
   - Schedule: `0 * * * *` (Every hour)
   - Max Duration: 300 seconds
   - Purpose: Scrape properties from Zillow, Redfin, Homes.com

2. **Daily Cleanup** (`/api/cron/daily-cleanup`)
   - Schedule: `0 3 * * *` (3 AM daily)
   - Max Duration: 60 seconds
   - Purpose: Clean up old data, optimize database

3. **Health Check** (`/api/cron/check-health`)
   - Schedule: `*/15 * * * *` (Every 15 minutes)
   - Max Duration: 10 seconds
   - Purpose: Monitor system health

## Environment Variables

### Required for Production:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `NEXT_PUBLIC_APP_URL` - Application URL
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps API key
- `OPENAI_API_KEY` - OpenAI API key
- `CRON_SECRET` - Cron job authentication secret

## Deployment Configuration

### Vercel
- Project: wabbit-property-scraping
- Account: odgsullys-projects (Pro Plan)
- Production URL: https://wabbit-property-scraping.vercel.app
- Branch: populate-property-scraped

### Database
- Provider: Supabase
- Authentication: Email/Password
- Demo Account: support@wabbit-rank.ai
- Row Level Security: Enabled

## Key Features

### Implemented
- User authentication system
- 7-page preferences questionnaire
- 4-tile property ranking interface
- Property list/grid view
- Automated property scraping (Zillow, Redfin, Homes.com)
- Search area management with map
- Email verification
- Demo account system
- Responsive design

### Pending
- Full Supabase backend integration
- Real MLS data import
- Google Maps on preview deployments
- OpenAI location intelligence
- Multi-user collaboration

## Important Files

### Configuration
- `vercel.json` - Vercel deployment config with cron jobs
- `next.config.js` - Next.js configuration
- `tsconfig.json` - TypeScript configuration
- `.env.sample` - Environment variables template

### Documentation
- `README.md` - Project overview
- `CLAUDE.md` - Claude Code instructions
- `MIGRATION_PROGRESS_TRACKER.md` - Monorepo migration roadmap (formerly IMPLEMENTATION_CHECKLIST copy.md)
- `MIGRATION_SAFETY_PROTOCOLS.md` - Ultra-conservative safety procedures
- `docs/deployment/VERCEL_DEPLOYMENT_STATUS.md` - Deployment status
- `docs/supabase/SUPABASE_SETUP.md` - Database setup guide

### Database
- `database-schema.sql` - Main database schema
- Various migration files in `/migrations/`

## Git Information

### Branches
- `populate-property-scraped` (current)
- `main`
- `deployment-ready-verified`
- `backup/wabbit-re-stable` (backup created today)

### Tags
- `v1.0.0-pre-monorepo` (created today)

### Remote
- Origin: https://github.com/odgsully/Actual.git

## Notes

- Working tree clean as of backup
- All changes committed and pushed
- Backup zip created: wabbit-re-backup-[timestamp].zip
- Ready for monorepo migration Phase 1