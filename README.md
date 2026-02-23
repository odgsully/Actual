# GS Personal App Suite - Monorepo

A Turborepo monorepo containing multiple applications deployed to separate domains via Vercel.

## Monorepo Structure

```
Actual/
├── apps/
│   ├── gs-crm/             # Real estate CRM (port 3004)
│   ├── wabbit-re/          # Property ranking platform (port 3000)
│   ├── wabbit/             # Gesture-driven content ranking (port 3002)
│   ├── gs-site/            # Personal dashboard hub (port 3003)
│   └── growthadvisory/     # Marketing site (port 3005)
├── packages/
│   ├── auth/               # Shared authentication utilities
│   ├── supabase/           # Shared Supabase client & helpers
│   ├── ui/                 # Shared UI components
│   └── utils/              # Common utilities
├── docs/                   # Cross-project documentation & archives
├── turbo.json              # Turborepo build pipeline
└── package.json            # Root workspace config
```

## Quick Start

### Prerequisites

- Node.js 18.17+ (currently running v24)
- npm 9+ (uses npm workspaces)
- Supabase account (for database)

### Installation

```bash
npm install
```

### Running Apps

```bash
# Run all apps in parallel
npm run dev

# Run a specific app
npm run dev -w wabbit-re      # Property ranking on :3000
npm run dev -w gs-site         # Dashboard on :3003
npm run dev -w gs-crm          # CRM on :3004
npm run dev -w growthadvisory  # Marketing site on :3005
```

### Root Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `npm run dev` | `turbo dev` | Start all apps in parallel |
| `npm run build` | `turbo build` | Build all apps |
| `npm run lint` | `turbo lint` | Lint all apps |
| `npm run typecheck` | `turbo typecheck` | TypeScript checks across all apps |
| `npm run test` | `turbo test` | Run tests across all apps |
| `npm run format` | `prettier --write` | Format all files |

Database and app-specific scripts live in each app's `package.json`. For example:

```bash
# wabbit-re database scripts
npm run db:migrate -w wabbit-re
npm run db:seed -w wabbit-re
npm run db:seed-demo -w wabbit-re

# gs-crm database scripts
npm run db:migrate -w gs-crm
npm run db:apply-rls -w gs-crm
```

## Deployment

All apps deploy to **Vercel** (Pro Plan - odgsullys-projects).

| Domain | App | Vercel Project | Status |
|--------|-----|----------------|--------|
| `wabbit-rank.ai` | `apps/wabbit-re` | wabbit-property-scraping | Deployed |
| `pickleballisapsyop.com` | `apps/gs-site` | gs-site | In Progress |
| `growthadvisory.ai` | `apps/growthadvisory` | TBD | Needs Vercel Project |

### Deploy Commands

```bash
# Deploy specific app
cd apps/wabbit-re && vercel --prod

# Build for production (all apps)
npm run build
```

### Environment Variables

Configured in **Vercel Dashboard** (Settings > Environment Variables) per project:

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `NEXT_PUBLIC_APP_URL` - Application URL
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps API key
- `OPENAI_API_KEY` - OpenAI API key
- `CRON_SECRET` - Vercel cron authentication

### Vercel Configuration

- Root `vercel.json` handles monorepo routing
- Per-app configs in `apps/*/vercel.json`
- Cron jobs configured for wabbit-re (requires Pro plan for hourly intervals)

## Apps

### wabbit-re (Property Ranking Platform)

**Domain:** wabbit-rank.ai | **Port:** 3000

Property scraping, ranking, and evaluation platform for Maricopa County, Arizona.

**Key Routes:**
- `/` - Landing page
- `/signup` - User registration
- `/signin` - Sign in
- `/form` - 7-page preferences questionnaire
- `/rank-feed` - Property evaluation interface (4-tile layout)
- `/list-view` - Property browsing with filters
- `/settings` - User preferences & account management
- `/setup/[token]` - Magic link setup flow
- `/agent-view` - Agent dashboard
- `/map-test` - Map testing

**Implemented Features:**
- User authentication (sign up, sign in, sign out, email verification, magic links)
- Demo account system (`support@wabbit-rank.ai`)
- 7-page dynamic preferences form
- Property ranking interface (4-tile layout with interactive sliders)
- List view with filtering and favorites
- Property scraping system (Zillow, Redfin, Homes.com)
- Automated hourly scraping via Vercel cron jobs
- Property notifications and price drop alerts
- Supabase backend with Row Level Security

**Pending:**
- Google Maps API activation
- OpenAI location intelligence
- Multi-user collaboration
- Direct MLS data connections

### gs-site (Personal Dashboard)

**Domain:** pickleballisapsyop.com | **Port:** 3003

Tile-based personal dashboard with integrations (Notion, GitHub, LIFX, etc.). Tile definitions are fully local in `lib/data/tiles.ts`.

### gs-crm (Real Estate CRM)

**Port:** 3004

CRM platform with glassmorphism UI. See `CLAUDE.md` for the design system.

### growthadvisory (Marketing Site)

**Domain:** growthadvisory.ai | **Port:** 3005

Static marketing landing page for Growth Advisory consulting.

### wabbit (Content Ranking Tool)

**Port:** 3002

Gesture-driven content ranking tool. Early development — no package.json yet.

## Property Scraping System

The wabbit-re app includes a complete property scraping pipeline:

- **Scrapers:** Playwright-based (Zillow, Redfin, Homes.com) in `apps/wabbit-re/lib/scraping/scrapers/`
- **Queue Manager:** Rate-limited processing (100-150 requests/hour per source)
- **Coverage:** 50+ Maricopa County cities, 100+ ZIP codes
- **Cron Jobs:** Hourly scrape, daily cleanup, 15-min health checks
- **APIs:** `/api/cron/hourly-scrape`, `/api/scrape/on-demand`, `/api/scrape/test`

See `apps/wabbit-re/docs/SCRAPING_SYSTEM_STATUS.md` for details.

## Database

**Provider:** Supabase (PostgreSQL with Row Level Security)

```bash
# Schema reference
apps/wabbit-re/ref/sql/database-schema.sql

# Migrations
apps/wabbit-re/migrations/

# Setup guide
docs/supabase/SUPABASE_SETUP.md
```

## Known Limitations

- **Google Maps on Vercel previews** - Wildcard subdomain patterns not supported by Google Cloud Console. Test map features locally or in production only.
- **Vercel Pro Plan required** - Hourly cron jobs need Pro plan (daily only on Hobby).
- **Google Maps not yet active** - Setup guide exists at `apps/wabbit-re/docs/setup/GOOGLE_MAPS_SETUP.md` but API is not yet configured.

## Documentation

| Document | Location | Purpose |
|----------|----------|---------|
| CLAUDE.md | `./CLAUDE.md` | AI assistant guidance & project conventions |
| Product Requirements | `apps/wabbit-re/docs/WABBIT_RE_PRD.md` | Wabbit RE product spec |
| Architecture Plan | `apps/wabbit-re/SUBAGENT_PLAN.md` | Development execution plan |
| Supabase Setup | `docs/supabase/SUPABASE_SETUP.md` | Database configuration guide |
| Google Maps Setup | `apps/wabbit-re/docs/setup/GOOGLE_MAPS_SETUP.md` | Maps API configuration |
| Demo Setup | `apps/wabbit-re/docs/setup/DEMO_SETUP.md` | Demo account setup |
| Scraping Status | `apps/wabbit-re/docs/SCRAPING_SYSTEM_STATUS.md` | Scraping system details |
| Deployment Context | `docs/deployment/DEPLOYMENT_FIX_CONTEXT.md` | Historical deployment fixes |
| GS Site Tile Plan | `apps/gs-site/tile-logic-untile.md` | Dashboard implementation plan |

## Branch Guidelines

- **USE:** `main` (verified working, primary development branch)
- **DO NOT USE:** `clean-deployment` (corrupted Sept 2024, missing 34,199 files)

See `docs/Fix_explain_09.05.md` for restoration details.

## License

Private - All rights reserved
