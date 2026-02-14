# Wabbit Real Estate Platform - Product Requirements Document

## Executive Summary
Wabbit is a sophisticated real estate platform designed to streamline the home buying process through intelligent property matching, collaborative ranking, and comprehensive data integration. The platform combines user preferences with MLS data to create a personalized property discovery and evaluation experience.

## Table of Contents
1. [Project Overview](#project-overview)
2. [User Authentication & Credentials](#user-authentication--credentials)
3. [Dynamic Preferences Form](#dynamic-preferences-form)
4. [Core Application Features](#core-application-features)
5. [Data Architecture](#data-architecture)
6. [Technical Specifications](#technical-specifications)
7. [Multi-User Collaboration](#multi-user-collaboration)
8. [Third-Party Integrations](#third-party-integrations)
9. [Future Roadmap](#future-roadmap)

## Project Overview

### Vision
Create a seamless, data-driven real estate discovery platform that intelligently matches buyers with properties based on comprehensive preferences and collaborative decision-making.

### Key Features
- Intelligent property matching based on detailed buyer preferences
- Collaborative ranking system with 4 key metrics
- Interactive mapping with commute analysis
- Multi-user decision support
- MLS data integration
- Third-party platform connectivity (Zillow, Redfin, Homes.com)

### Technology Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Mapping**: Google Maps API, js-markerclusterer
- **AI Integration**: OpenAI API for location intelligence
- **Deployment**: Vercel with Cloudflare CDN

## User Authentication & Credentials

### Sign-Up Process
The authentication flow provides a streamlined onboarding experience:

#### Entry Fields
- **First Name** (required, text)
- **Last Name** (required, text)
- **Email** (required, email validation)
- **Privacy Statement** (required checkbox)
- **Marketing Updates** (optional checkbox)

#### Technical Implementation
```typescript
interface SignUpData {
  firstName: string;
  lastName: string;
  email: string;
  privacyAccepted: boolean;
  marketingOptIn: boolean;
}
```

#### User Flow
1. User lands on sign-up page
2. Completes registration form
3. Email verification sent
4. Upon verification, redirected to preferences form
5. Profile created in database

#### Security Requirements
- Email verification required
- Password-less authentication via magic links
- Session management with JWT tokens
- Row Level Security (RLS) in PostgreSQL

## Dynamic Preferences Form

### Architecture Overview
A sophisticated multi-page form system that adapts based on existing user data and provides a Typeform-like experience.

### Data Source Structure
Based on `ref/data/CRM-Buyer-preferences.xlsx`:
- **Columns B-J**: User identification fields
- **Columns K-AB**: Preference questions
- **Row 1**: Page index for form flow
- **Row 2**: Field type specifications
- **Row 4+**: User data records

### Form Pages & Fields

#### Page 0: User Search
- **Feature**: Name lookup with auto-populate
- **Implementation**: Search against existing database
- **Fallback**: Continue with blank form

#### Page 1: Property Type
- **Field**: Interest in property types
- **Type**: Dropdown scroll
- **Options**: Single Family, Condo, Townhouse, etc.

#### Page 2: Size Requirements
- **Minimum Square Footage**: Dropdown scroll
- **Minimum Lot Size**: Text input
- **Price Range**: Dual text boxes (min-max)

#### Page 3: Commute Preferences
- **Commute Address 1**: Text input with max minutes
- **Commute Address 2**: Text input with max minutes
- **Validation**: Address verification via Google Maps

#### Page 4: Room Requirements
- **Bedrooms Needed**: Numeric input
- **Bathrooms Needed**: Numeric input

#### Page 5: Location Preferences
- **City Focus**: Multi-select (Scottsdale, Paradise Valley, Phoenix)
- **Preferred Zip Codes**: Text input
- **Validation**: Zip code format checking

#### Page 6: Home Features
- **Home Style**: Single-story vs Multi-level
- **Pool Preference**: Yes/No/Neutral
- **Garage Spaces**: Numeric input
- **HOA Preference**: Multi-option scale

#### Page 7: Current Residence Feedback
- **Current Address**: Text input
- **What Works Well**: Text area
- **What Doesn't Work**: Text area

### Form State Management
```typescript
interface FormState {
  currentPage: number;
  responses: Record<string, any>;
  isPreFilled: boolean;
  userId?: string;
  completionStatus: PageStatus[];
}
```

## Core Application Features

### Wabbit Launch Experience

#### Initial User Journey
1. **Quick Tour Overlay**: Interactive walkthrough
2. **AI Enhancement Popup**: "Help AI do more For You"
3. **Platform Connections**: Zillow, Redfin, Homes.com integration prompts
4. **Rank Feed Launch**: Begin property evaluation

### Main Navigation Menu

#### 1. Rank Feed
The primary property evaluation interface with 4-quadrant layout:

##### Layout Structure (Reference: `1-rankv2.png`)
```
+------------------+------------------+
| Property_Info    | Rank_Tile        |
+------------------+------------------+
| Google_Map       | Image_Carousel   |
+------------------+------------------+
```

##### Property Info Tile
Displays key property details:
- Property Address
- List Price
- City, ZIP
- Schools
- HOA Status
- Renovation Year
- Build Year
- Jurisdiction

##### Rank Tile
Interactive ranking system with 4 key metrics:
1. **Price:Value** (1-10 scale with slider)
2. **Location** (1-10 scale with slider)
3. **Layout** (1-10 scale with slider)
4. **Turnkey** (1-10 scale with slider)

##### Google Interactive Map
Displays multiple data layers:
- Property location (primary marker)
- Commute destinations (if specified)
- Schools (via OpenAI API)
- Entertainment districts
- Grocery stores (including Costco, Trader Joe's)

##### Property Image Carousel
- Sources from `MLS_Image_scrape_[BuyerEmail]/[PropertyAddress]`
- Swipeable gallery interface
- Full-screen view capability

#### 2. List View (Reference: `2-list-view.png`)
Comprehensive property listing interface:
- Grid/List toggle
- Sort by: Price, Date Added, Ranking Score
- Filter options: Price range, Location, Features
- Quick actions: Star favorite, View details, Share

#### 3. More Settings (Reference: `3-more.png`)
User preferences and app settings:
- **Theme Toggle**: Light/Dark mode
- **Font Size**: 5-level scale (small 'a' to large 'A')
- **Invite Friends**: Email/Phone number input
- **Account Settings**: Profile, Preferences, History
- **Platform Connections**: Zillow, Redfin, Homes.com icons

## Data Architecture

### Database Schema

#### Core Tables

##### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  first_name VARCHAR,
  last_name VARCHAR,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

##### buyer_preferences
```sql
CREATE TABLE buyer_preferences (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  preference_data JSONB,
  form_version INTEGER,
  completed_at TIMESTAMP
);
```

##### properties
```sql
CREATE TABLE properties (
  id UUID PRIMARY KEY,
  mls_number VARCHAR UNIQUE,
  address VARCHAR,
  list_price DECIMAL,
  details JSONB,
  created_at TIMESTAMP
);
```

##### rankings
```sql
CREATE TABLE rankings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  property_id UUID REFERENCES properties(id),
  price_value_score INTEGER,
  location_score INTEGER,
  layout_score INTEGER,
  turnkey_score INTEGER,
  created_at TIMESTAMP
);
```

### Data Import Process

#### Excel to Database Migration
1. Parse `ref/data/CRM-Buyer-preferences.xlsx`
2. Map columns to database fields
3. Import existing user records
4. Maintain data integrity with foreign keys

#### MLS Data Integration
1. Process `MLS scrape_[BuyerEmail].xlsx`
2. Extract property details
3. Link to user accounts via email
4. Store in properties table

#### Image Management
1. Parse directory structure: `/MLS_Image_scrape_[BuyerEmail]/[PropertyAddress]`
2. Upload to Supabase Storage
3. Create image references in database
4. Implement CDN caching

## Technical Specifications

### Frontend Architecture

#### Component Structure
```
/components
  /auth
    - SignUpForm.tsx
    - LoginForm.tsx
  /form
    - MultiPageForm.tsx
    - FormStep.tsx
    - FieldTypes/
  /property
    - RankFeed.tsx
    - ListView.tsx
    - PropertyCard.tsx
  /map
    - InteractiveMap.tsx
    - MarkerCluster.tsx
  /shared
    - Layout.tsx
    - Navigation.tsx
```

#### State Management
- React Context for global state
- React Hook Form for form handling
- SWR for data fetching
- Zustand for complex state

### API Structure

#### Endpoints
```typescript
// Authentication
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/logout

// Preferences
GET /api/preferences/:userId
POST /api/preferences
PUT /api/preferences/:id

// Properties
GET /api/properties
GET /api/properties/:id
POST /api/properties/search

// Rankings
GET /api/rankings/:propertyId
POST /api/rankings
PUT /api/rankings/:id
```

### Security Implementation

#### Authentication Flow
1. Email-based magic links
2. JWT token generation
3. Refresh token rotation
4. Session management

#### Data Protection
- Row Level Security (RLS) policies
- Encrypted data transmission
- API rate limiting
- Input sanitization

## Multi-User Collaboration

### Invitation System

#### Flow
1. User navigates to More → Invite
2. Enters email or phone number
3. Unique invitation code generated
4. Recipient creates account with code
5. Accounts linked for collaboration

### Shared Features

#### Collaborative Ranking
- Average scores displayed for shared properties
- Individual score tracking
- Consensus indicators
- Discussion threads

#### UI Indicators
- **2-voter icon**: Shows collaborative ranking (Reference: `2voted_placeholder.png`)
- **Score averaging**: Real-time calculation
- **Activity feed**: Track partner actions

### Database Support
```sql
CREATE TABLE shared_accounts (
  id UUID PRIMARY KEY,
  primary_user_id UUID REFERENCES users(id),
  secondary_user_id UUID REFERENCES users(id),
  invitation_code VARCHAR,
  status VARCHAR,
  created_at TIMESTAMP
);
```

## Third-Party Integrations

### Platform Connections

#### Zillow Integration
- OAuth 2.0 authentication
- Favorite properties import
- Saved searches sync
- Property alerts

#### Redfin Integration
- API key authentication
- Collection sync
- Tour scheduling
- Market data access

#### Homes.com Integration
- User credential storage
- Favorites import
- Search history sync

### Implementation Status
Currently placeholder implementations with:
- Logo-branded login modals
- Credential storage preparation
- Future API integration points

### OpenAI Integration

#### Location Intelligence
Automated data enrichment for each property:

##### Schools Analysis
```typescript
interface SchoolData {
  type: 'Private' | 'Public';
  gradeLevel: string;
  distance: number;
  studentPopulation: number;
}
```

##### Entertainment Districts
```typescript
interface EntertainmentDistrict {
  name: string;
  address: string;
  distance: number;
  type: string;
}
```

##### Grocery Locations
```typescript
interface GroceryStore {
  name: string;
  address: string;
  distance: number;
  chain: 'Costco' | 'Trader Joes' | 'Other';
}
```

## Future Roadmap

### Phase 1: Current Implementation
- Manual MLS data import
- Basic authentication
- Core ranking features
- Single market focus

### Phase 2: Automation
- SparkAPI integration for live MLS data
- Automated image retrieval
- Enhanced AI recommendations
- Multi-market support

### Phase 3: Advanced Features
- Virtual tour integration
- Predictive analytics
- Mortgage calculator
- Agent collaboration tools

### Phase 4: Scale & Optimization
- Mobile applications
- Real-time notifications
- Advanced filtering
- Performance optimization

## Development Guidelines

### Code Standards
- TypeScript strict mode
- ESLint + Prettier configuration
- Component testing with Jest
- E2E testing with Playwright

### Git Workflow
- Feature branch strategy
- PR reviews required
- Automated CI/CD
- Semantic versioning

### Documentation Requirements
- Inline code comments
- API documentation
- Component storybook
- User guides

## Deployment Strategy

### Infrastructure
- **Production**: Vercel deployment
- **Database**: Supabase hosted
- **CDN**: Cloudflare
- **Monitoring**: Vercel Analytics

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
GOOGLE_MAPS_API_KEY=
OPENAI_API_KEY=
```

### Performance Targets
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Lighthouse Score: > 90
- API Response Time: < 200ms

## Support & Maintenance

### Monitoring
- Error tracking with Sentry
- Performance monitoring
- User analytics
- Database metrics

### Backup Strategy
- Daily database backups
- Image storage redundancy
- Configuration versioning
- Disaster recovery plan

---

## Appendices

### A. File Structure Reference
- `ref/data/CRM-Buyer-preferences.xlsx`: User preference data
- `/MLS scrape_[BuyerEmail].xlsx`: Property listings
- `/MLS_Image_scrape_[BuyerEmail]/`: Property images
- `/dev_buildout/wireframes-ref/`: UI references
- `/dev_buildout/js-markerclusterer-main/`: Map clustering library

### B. UI/UX Guidelines
- Material Design principles
- Accessibility WCAG 2.1 AA
- Responsive breakpoints
- Animation standards

### C. API Documentation
Detailed endpoint specifications available in `/docs/api/`

### D. Testing Procedures
Comprehensive testing guide in `/docs/testing/`