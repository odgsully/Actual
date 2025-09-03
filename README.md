# Wabbit Real Estate Platform

A sophisticated real estate discovery platform with intelligent property matching and collaborative ranking features.

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

### Current Implementation
- ✅ User registration and authentication UI
- ✅ 7-page dynamic preferences form
- ✅ Property ranking interface (4-tile layout)
- ✅ List view with filtering
- ✅ Settings and preferences management
- ✅ Responsive design
- ✅ Dark/Light mode preparation

### Pending Implementation
- ⏳ Supabase backend integration
- ⏳ Real MLS data import
- ⏳ Google Maps integration
- ⏳ OpenAI location intelligence
- ⏳ Multi-user collaboration
- ⏳ Third-party platform connections
- ⏳ Real-time data sync

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

### Vercel Deployment
```bash
npm run build
vercel --prod
```

### Environment Variables Required
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `OPENAI_API_KEY`

## Contributing

See `SUBAGENT_PLAN.md` for the development roadmap and agent architecture.

## License

Private - All rights reserved

## Support

For issues or questions, refer to the documentation:
- `WABBIT_PRD.md` - Complete product requirements
- `SUBAGENT_PLAN.md` - Development execution plan
- `database-schema.sql` - Database structure