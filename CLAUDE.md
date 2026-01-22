# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## User Communication Rules

**"Reply in chat"** = No modifying tools. Reading files is OK (Read, Glob, Grep, WebFetch). NO Write, Edit, Bash, or any tool that changes files/state. Answer conversationally using existing knowledge or read-only research.

**"ULTRATHINK"** = Use extended thinking for deep analysis before responding.

### Shortcut Abbreviations

| Shortcut   | Meaning                                              |
| ---------- | ---------------------------------------------------- |
| **ric**    | Reply in chat (read-only tools OK, no modifications) |
| **susin**  | Spin up subagents if needed                          |
| **aacqin** | Ask any clarifying questions if needed               |

## Previous Session Reference

**Trigger phrases**: When the user mentions any of the following, proactively ask if they want to reference previous session history:

- "previous session"
- "last session"
- "earlier session"
- "previous instance of Claude Code"
- "previous CC session"
- "in another chat"
- "we discussed before"

**How to access session history**:

Claude Code stores full conversation transcripts locally:

```
~/.claude/projects/[project-path-encoded]/[session-id].jsonl
```

**To find relevant sessions**:

```bash
# List recent sessions for this project
ls -lt ~/.claude/projects/-Users-garrettsullivan-Desktop-AUTOMATE-Vibe-Code-Wabbit-clients-sullivan-realestate-Actual/*.jsonl | head -10

# Search for sessions mentioning a keyword
for f in $(ls -t ~/.claude/projects/[project-path]/*.jsonl | head -15); do
  if grep -l -i "keyword" "$f" 2>/dev/null; then
    echo "--- Found in: $f ---"
    head -1 "$f" | jq -r '.summary // "no summary"'
  fi
done

# Extract conversation from a session
cat [session-file].jsonl | jq -r 'select(.type == "user" or .type == "assistant") | ...'
```

**Session JSONL structure**:

- `type: "summary"` - Session title/summary
- `type: "user"` - User messages
- `type: "assistant"` - Claude responses (includes tool calls)
- `type: "file-history-snapshot"` - File state tracking

**Proactive question to ask**:

> "Would you like me to look up the previous session history? I can search for sessions by keyword or list recent ones. What topic/keyword should I search for?"

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

**Current Status:** 95% Complete (Phase 4) - See documents below for details.

| Document                                                           | Purpose                                                                        |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| [`MIGRATION_PROGRESS_TRACKER.md`](./MIGRATION_PROGRESS_TRACKER.md) | **Primary roadmap** - Day-to-day progress, troubleshooting, operational status |
| [`MIGRATION_SAFETY_PROTOCOLS.md`](./MIGRATION_SAFETY_PROTOCOLS.md) | **Safety reference** - Ultra-conservative procedures for high-risk operations  |

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

### Deployment (Vercel - Current)

- Deploy to production: `vercel --prod`
- Vercel project: `wabbit-property-scraping` (odgsullys-projects)
- Vercel config: `vercel.json` (root and per-app)
- Environment variables: Configured in Vercel Dashboard
- See `docs/deployment/VERCEL_DEPLOYMENT_STATUS.md` for current status

### Legacy Deployment Files (Hetzner - Discontinued)

> **Note**: Hetzner/PM2/Nginx deployment was discontinued in favor of Vercel. These files are kept for reference only.

- `ecosystem.config.js` - Legacy PM2 config
- `deployment/nginx.conf` - Legacy Nginx config
- `deployment/deploy.sh` - Legacy deploy script
- `deployment/DEPLOYMENT_GUIDE.md` - Legacy Hetzner guide

## Architecture Overview

### Tech Stack

- **Frontend**: Next.js 14.1.0 with React 18, TypeScript
- **Styling**: Tailwind CSS with Radix UI components
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Maps**: Google Maps API with @googlemaps/js-api-loader
- **AI**: OpenAI API for location intelligence
- **State Management**: Zustand for client state, React Query for server state
- **Forms**: React Hook Form with Zod validation
- **Hosting**: Vercel (Pro Plan) with automatic SSL
- **Build**: Turborepo for monorepo builds

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
- `MIGRATION_PROGRESS_TRACKER.md` - **Main development roadmap** (95% complete)
- `MIGRATION_SAFETY_PROTOCOLS.md` - Ultra-conservative safety procedures for migrations
- `WABBIT_PRD.md` - Product requirements document
- `SUBAGENT_PLAN.md` - Architecture and implementation plan
- `docs/supabase/SUPABASE_SETUP.md` - Database setup instructions
- `apps/wabbit-re/docs/setup/GOOGLE_MAPS_SETUP.md` - Maps API configuration
- `apps/wabbit-re/docs/setup/DEMO_SETUP.md` - Demo account setup instructions
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

- **Production Platform**: Vercel (Pro Plan - odgsullys-projects)
- **Production URL**: https://wabbit-property-scraping.vercel.app
- **Domain**: wabbit-rank.ai with Cloudflare DNS
- **SSL**: Automatic via Vercel
- **Cron Jobs**: Configured in `vercel.json` (requires Pro plan)
- **Monitoring**: Vercel Dashboard → Functions → Logs
- **Env Vars**: Managed in Vercel Dashboard (not in repo)

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

## GS Site Dashboard (Updated January 2026)

### Architecture Note (Jan 2026)

**Tiles are now fully local.** The `decouple-notion-tiles` branch decoupled tile definitions from Notion:

- All 53 tile definitions are in `lib/data/tiles.ts` (LOCAL_TILES)
- Notion is used **only for DATA** (habits values, task completion)
- The tile sync script (`npm run sync-tiles`) has been deprecated

### Development Status

See [`apps/gs-site/tile-logic-untile.md`](./apps/gs-site/tile-logic-untile.md) for the complete implementation plan.

| Phase     | Status      | Description                                                                        |
| --------- | ----------- | ---------------------------------------------------------------------------------- |
| Phase 0   | ✅ Complete | Foundation Resilience - Static tiles                                               |
| Phase 1   | ✅ Complete | Core UI Components - ButtonTile, GraphicTile, CalendarTile, FormTile, DropzoneTile |
| Phase 2   | ✅ Complete | Notion Dynamic Data - Habits streaks, task completion                              |
| Phase 3   | ✅ Complete | GitHub Integration - Commits, repos, search                                        |
| Phase 4   | ✅ Complete | Graphic Components - ChartTile, CounterTile, ProgressTile, HeatmapTile             |
| Phase 5   | 🚧 Next Up  | Wabbit Apps Integration - **NOT YET CONFIGURED**                                   |
| Phase 6-8 | ⏳ Pending  | Google/Apple, Whoop/Content, Device/Logic                                          |

### ⚠️ Wabbit Apps Integration (Phase 5) - NOT CONFIGURED

Cross-app integration between gs-site and other Wabbit apps is **not yet implemented**. The following are pending:

**Missing Components**:

- `/lib/wabbit/client.ts` - Internal API wrapper
- `useWabbitStats()` hook - Fetch counts from each app
- Deep links to specific app routes
- Cross-app authentication check

**Environment Variables Needed** (not yet added):

```bash
WABBIT_RE_URL=http://localhost:3000
GSREALTY_URL=http://localhost:3004
WABBIT_URL=http://localhost:3002
```

**Affected Tiles** (6 tiles):

- CRM → gsrealty-client
- Go to my Wabbit → wabbit-re
- New GS Wab → wabbit
- Jump to Wab: Task List → wabbit
- Wab: Task Tile → wabbit
- GS-clients Admin → gsrealty-client

### GS Site Commands

- `npm run dev` - Start gs-site on port 3003
- `npm run export-tiles` - Export tile data to markdown documentation

## GSRealty CRM UI Design System (January 2026)

### Glassmorphism Design Language

The `gsrealty-client` app uses a **glassmorphism UI** with dark backgrounds and frosted glass effects. **Always prefer these patterns when building new features.**

### Required CSS Classes (defined in `apps/gsrealty-client/app/globals.css`)

| Class               | Use Case                  | Tailwind Equivalent                                                                                |
| ------------------- | ------------------------- | -------------------------------------------------------------------------------------------------- |
| `.glass-card`       | Cards, panels, containers | `backdrop-blur-xl bg-white/10 border-white/20 rounded-3xl`                                         |
| `.glass-card-hover` | Interactive cards         | `transition-all duration-700 ease-out hover:scale-[1.02] hover:bg-white/15`                        |
| `.glass-button`     | Buttons (secondary/ghost) | `bg-white/10 hover:bg-white/20 border border-white/20 text-white duration-700 hover:scale-[1.02]`  |
| `.glass-input`      | Form inputs               | `bg-white/5 border-white/20 rounded-xl text-white placeholder:text-white/40 focus:border-white/40` |
| `.glass-nav-item`   | Sidebar navigation items  | White text with hover states                                                                       |
| `.glass-nav-active` | Active nav state          | `bg-white/20 text-white border border-white/30`                                                    |

### Layout Patterns

**Page Structure:**

```jsx
<div className="min-h-screen relative overflow-hidden">
  {/* Background Image */}
  <div
    className="absolute inset-0 bg-cover bg-center"
    style={{ backgroundImage: "url(...)" }}
  />
  {/* Dark Overlay */}
  <div className="absolute inset-0 bg-black/30" />
  {/* Content */}
  <div className="relative z-10">...</div>
</div>
```

**Admin Layout:** 3-column grid on desktop (`grid-cols-12`), mobile sidebar slide-in

### Color Conventions

| Element          | Pattern                                                                                       |
| ---------------- | --------------------------------------------------------------------------------------------- |
| Text primary     | `text-white`                                                                                  |
| Text secondary   | `text-white/60` or `text-white/80`                                                            |
| Card backgrounds | `bg-white/5`, `bg-white/10`, `bg-white/15`                                                    |
| Borders          | `border-white/10`, `border-white/20`, `border-white/30`                                       |
| Primary CTA      | `bg-brand-red` with `hover:bg-brand-red-hover`                                                |
| Icons            | Colored per-function: `text-blue-400`, `text-green-400`, `text-yellow-400`, `text-purple-400` |

### Animation Conventions

- **Transitions:** Always use `duration-700 ease-out` for smooth, premium feel
- **Hover scale:** `hover:scale-[1.02]` for interactive elements
- **Background transitions:** `hover:bg-white/15` or `hover:bg-white/20`

### Do's and Don'ts

**DO:**

- Use `<Card className="glass-card p-6">` for all container elements
- Apply `glass-button` class or equivalent Tailwind to buttons
- Use white text with transparency variants (`/60`, `/80`)
- Include backdrop-blur on floating/overlay elements
- Use rounded corners (`rounded-xl`, `rounded-3xl`)

**DON'T:**

- Use solid opaque backgrounds (no `bg-white`, `bg-gray-100`, etc.)
- Use black text on light backgrounds
- Skip the dark overlay on background images
- Use sharp corners (always round)
- Use fast transitions (avoid `duration-150`, `duration-200`)

### Component Import Pattern

```tsx
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Usage
<Card className="glass-card p-6">
  <Input className="glass-input" placeholder="Search..." />
  <Button className="glass-button">Action</Button>
</Card>;
```

### Reference Implementation

See `apps/gsrealty-client/app/admin/page.tsx` for the canonical dashboard implementation with:

- Stats grid with colored icons
- Recent contacts list with avatars and badges
- Sales target progress bars
- Proper glass card usage throughout
