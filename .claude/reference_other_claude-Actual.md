# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in NOT THIS REPOSITORY but rather /Users/garrettsullivan/Desktop/AUTOMATE/Vibe Code/Wabbit/clients/sullivan_realestate/Actual.

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
/contexts              # React context providers
/lib                   # Core utilities
  /database            # Database access functions (users, properties, rankings, preferences)
  /supabase            # Supabase client configuration
/deployment            # Production deployment scripts and configs
/scripts               # Database seeding and utility scripts
/scrape_3rd           # MLS data scraping utilities
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
Production deployment requires these in `.env.production`:
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

### Deployment Notes
- Server: Hetzner CPX11 (2 vCPU, 2GB RAM, Ubuntu 24.04)
- Domain: wabbit-rank.ai with Cloudflare DNS
- SSL: Let's Encrypt via Certbot
- Process Manager: PM2 with automatic restarts
- Monitoring: Hetzner metrics + PM2 monitoring
- Backups: Weekly Hetzner snapshots

### Data Processing
The platform processes:
- Client preferences from `CRM-Buyer-preferences.xlsx`
- MLS property data from `MLS scrape_[BuyerEmail].xlsx`
- Property images from `/MLS_Image_scrape_[BuyerEmail]/`

### Current Implementation Status
✅ Complete:
- User authentication UI
- 7-page preferences form
- Property ranking interface (4-tile layout)
- List view with filtering
- Settings management
- Responsive design

⏳ Pending:
- Supabase backend integration
- Real MLS data import
- Google Maps integration
- OpenAI location intelligence
- Multi-user collaboration features