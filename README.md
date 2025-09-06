# Wabbit Real Estate Platform

A sophisticated real estate discovery platform with intelligent property matching and collaborative ranking features.

## 🚨 Important Notice (September 5, 2024)

This is the **verified working version** restored from the `main` branch. The previous `clean-deployment` branch was missing critical authentication features and has been replaced. See `Fix_explain_09.05.md` for details about the restoration process.

## Quick Start

### Prerequisites
- Node.js 18.17.0 or higher
- npm or yarn
- Supabase account (for database)
- Google Maps API key (for mapping features)
- OpenAI API key (for location intelligence)

### Installation

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp .env.sample .env.local
```
Then edit `.env.local` with your API keys.

3. **Start the development server:**
```bash
npm run dev
```

4. **Open your browser:**
Navigate to [http://localhost:3000](http://localhost:3000)

## Available Scripts

### Development
- `npm run dev` - Start development server on port 3000
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run format` - Format code with Prettier

### Testing
- `npm test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:e2e` - Run end-to-end tests

### Database
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data

## Preview Pages

The platform includes several preview pages to demonstrate functionality:

### 1. **Sign Up** (`/signup`)
- User registration form
- Privacy and marketing preferences
- Email validation

### 2. **Preferences Form** (`/form`)
- 7-page questionnaire
- Dynamic form with progress tracking
- User preference collection including:
  - Property type preferences
  - Size and budget requirements
  - Commute preferences
  - Room requirements
  - Location preferences
  - Home features
  - Current residence feedback

### 3. **Rank Feed** (`/rank-feed`)
- 4-tile property evaluation interface:
  - **Property Info**: Details about the listing
  - **Ranking Tile**: 4 key metrics (Price:Value, Location, Layout, Turnkey)
  - **Interactive Map**: Location visualization
  - **Image Carousel**: Property photos
- Interactive sliders for ranking (1-10 scale)
- Real-time average score calculation

### 4. **List View** (`/list-view`)
- Grid/List toggle view
- Property cards with key information
- Filtering and sorting options
- Favorite marking
- Multi-user voting indicators

### 5. **Settings** (`/settings`)
- Dark/Light mode toggle
- Font size adjustment
- Friend invitation system
- Third-party platform connections (Zillow, Redfin, Homes.com)
- Account management

## Project Structure

```
/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── globals.css        # Global styles
│   ├── signup/            # Sign-up flow
│   ├── form/              # Multi-page preferences form
│   ├── rank-feed/         # Property ranking interface
│   ├── list-view/         # Property list view
│   └── settings/          # User settings
├── components/            # Reusable components (to be created)
├── lib/                   # Utility functions (to be created)
├── public/                # Static assets
├── database-schema.sql    # PostgreSQL schema
├── package.json           # Dependencies
└── WABBIT_PRD.md         # Product requirements document
```

## Data Sources

The platform processes data from:
- `CRM-Buyer-preferences.xlsx` - Existing client preferences
- `MLS scrape_[BuyerEmail].xlsx` - Property listings
- `/MLS_Image_scrape_[BuyerEmail]/` - Property images

## Features

### Current Implementation (Verified Working)
- ✅ **User Authentication System**
  - Sign up with email/password
  - Sign in/Sign out functionality
  - Demo account support (`support@wabbit-rank.ai`)
  - Email verification flow
  - Token-based account setup
- ✅ **7-Page Dynamic Preferences Form**
  - Property type and size preferences
  - Budget and location requirements
  - Commute preferences
  - Home features selection
  - Current residence feedback
- ✅ **Property Ranking Interface** (4-tile layout)
  - Property details display
  - Interactive ranking system
  - Map integration preparation
  - Image carousel
- ✅ **List View** with filtering capabilities
- ✅ **Settings Management**
  - User preferences
  - Dark/Light mode toggle
  - Account settings
- ✅ **Responsive Design** for all screen sizes

### Pending Implementation
- ⏳ Supabase backend integration (partial)
- ⏳ Real MLS data import
- ⏳ Google Maps API activation
- ⏳ OpenAI location intelligence
- ⏳ Multi-user collaboration features
- ⏳ Third-party platform connections (Zillow, Redfin, etc.)
- ⏳ Real-time data synchronization

## Development Workflow

1. **Start with the home page** (`/`) to see all available previews
2. **Test the sign-up flow** to understand user onboarding
3. **Complete the form** to see the 7-page questionnaire
4. **Explore Rank Feed** for the main property evaluation interface
5. **Browse List View** for property management
6. **Adjust Settings** to see customization options

## Database Setup

To set up the database:

1. Create a Supabase project
2. Run the SQL schema:
```bash
psql -h [your-supabase-url] -U postgres -d postgres -f database-schema.sql
```
3. Configure Row Level Security policies
4. Import initial data from Excel files

## Deployment

### Production Server Deployment
The application is deployed on a Hetzner server (5.78.100.116) with PM2 process management and Nginx reverse proxy.

```bash
# Build for production
npm run build

# Deploy with PM2
pm2 start ecosystem.config.js

# Or use deployment script
./deployment/deploy.sh
```

### Vercel Deployment (Alternative)
```bash
npm run build
vercel --prod
```

### Environment Variables Required
Production deployment requires these in `.env.production`:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key  
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `NEXT_PUBLIC_APP_URL` - Application URL (https://wabbit-rank.ai)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps API key
- `OPENAI_API_KEY` - OpenAI API key for location intelligence

### Deployment Files
- `ecosystem.config.js` - PM2 configuration
- `deployment/nginx.conf` - Nginx configuration
- `deployment/server-setup.sh` - Server setup script
- `deployment/deploy.sh` - Deployment script

## Contributing

See `SUBAGENT_PLAN.md` for the development roadmap and agent architecture.

## License

Private - All rights reserved

## Important Documentation

### Core Documentation
- `README.md` - This file, project overview
- `WABBIT_PRD.md` - Complete product requirements document
- `SUBAGENT_PLAN.md` - Development execution plan
- `CLAUDE.md` - AI assistant guidance for development

### Database Documentation
- `database-schema.sql` - Complete database structure
- `database-migration-temp-preferences.sql` - Temporary preferences migration
- `SUPABASE_SETUP.md` - Supabase configuration guide

### Setup Guides
- `GOOGLE_MAPS_SETUP.md` - Google Maps API configuration
- `DEMO_SETUP.md` - Demo account setup instructions
- `test-verification-flow.md` - Testing email verification

### Deployment & Recovery
- `DEPLOYMENT_FIX_CONTEXT.md` - Deployment fix procedures
- `Fix_explain_09.05.md` - Directory restoration documentation
- `deployment/DEPLOYMENT_GUIDE.md` - Complete deployment guide

## Support

For issues or questions, contact the development team or refer to the documentation above.