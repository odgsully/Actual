# GSRealty Client Management System

**A comprehensive client management platform for real estate professionals servicing Maricopa County, Arizona.**

---

## Overview

GSRealty is a production-ready web application for realtors to manage client relationships, process MLS comparable sales data, integrate with Maricopa County Assessor's Office (MCAO) property lookups, send client invitations, and organize files.

| | |
|---|---|
| **Business Owner** | Garrett Sullivan |
| **Market Focus** | Maricopa County, Arizona |
| **Status** | Production Ready |
| **Version** | 1.0.0 |

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.2.33 | React framework with App Router |
| React | 18 | UI library |
| TypeScript | Strict mode | Type safety |
| Tailwind CSS | 3.x | Utility-first styling |
| Radix UI | Latest | Accessible component primitives |
| Framer Motion | Latest | Animations |
| React Hook Form | Latest | Form state management |
| Zod | Latest | Schema validation |

### Backend & Database
| Technology | Purpose |
|------------|---------|
| Next.js API Routes | RESTful endpoints |
| Supabase | PostgreSQL database + Auth + Storage |
| Row Level Security | Database-level access control |

### Key Libraries
| Library | Purpose |
|---------|---------|
| ExcelJS 4.4.0 | Secure Excel file processing |
| Resend | Transactional email delivery |
| @googlemaps/js-api-loader | Google Maps integration |
| OpenAI API | Location intelligence |
| PDF-lib / PDFKit | PDF generation |
| Archiver | ZIP file creation |
| Playwright | E2E testing |

### Hosting & Infrastructure
| Service | Purpose |
|---------|---------|
| Vercel (Pro Plan) | Application hosting |
| Supabase Cloud | Managed PostgreSQL |
| Cloudflare | DNS management |

---

## Features

### Admin Features
- Client management (create, edit, delete)
- Email invitation system with token-based signup
- MLS file upload & processing (CSV, XLSX)
- MCAO property lookup (by APN or address)
- Bulk property lookups
- Report-It property analysis tools
- Activity/event tracking
- System settings & notifications
- Login activity monitoring
- File download & deletion

### Client Features
- Secure portal with personal dashboard
- View assigned properties
- Search & filter properties
- Favorite/bookmark properties
- Download uploaded documents
- View activity feed
- Profile management

### System Features
- Role-based access control (admin/client)
- JWT authentication via Supabase Auth
- Row Level Security (RLS) policies
- Email notifications
- Excel file generation & parsing
- PDF report generation
- Cron jobs (hourly scrape, daily cleanup)
- Health monitoring

---

## Pages & Routes

### Public Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing Page | Hero section, features overview, CTA buttons |
| `/signin` | Sign In | Email/password authentication form |
| `/auth/forgot-password` | Forgot Password | Password reset request form |
| `/auth/reset-password` | Reset Password | New password entry form |
| `/setup/[token]` | Account Setup | Token-based registration for invited clients |

### Admin Routes (`/admin/*`)

| Route | Page | Description |
|-------|------|-------------|
| `/admin` | Dashboard | Stats cards, quick actions, overview |
| `/admin/clients` | Client List | Searchable client table with actions |
| `/admin/clients/new` | New Client | Create client form |
| `/admin/clients/[id]` | Edit Client | Edit client details, send invite |
| `/admin/upload` | File Upload | MLS data upload & processing interface |
| `/admin/reportit` | Report-It | Property analysis tools |
| `/admin/mcao` | MCAO Lookup | Property lookup by APN or address |
| `/admin/settings` | Settings | System preferences & notifications |

### Client Routes (`/client/*`)

| Route | Page | Description |
|-------|------|-------------|
| `/client/dashboard` | Dashboard | Files, events, quick links |
| `/client/properties` | Properties | View & favorite assigned properties |
| `/client/files` | Files | Document library with downloads |
| `/client/profile` | Profile | Edit personal information |

---

## UI Layout

### Landing Page (`/`)
```
┌─────────────────────────────────────────────────┐
│  Logo                              Sign In btn  │
├─────────────────────────────────────────────────┤
│                                                 │
│              HERO SECTION                       │
│        "GSRealty Client Management"             │
│              [Get Started]                      │
│                                                 │
├─────────────────────────────────────────────────┤
│   Feature   │   Feature   │   Feature   │   Feature   │
│    Card     │    Card     │    Card     │    Card     │
├─────────────────────────────────────────────────┤
│                   Footer                        │
└─────────────────────────────────────────────────┘
```

### Admin Dashboard (`/admin`)
```
┌──────────┬──────────────────────────────────────┐
│          │  Header: Page Title    [User Menu]  │
│  SIDEBAR ├──────────────────────────────────────┤
│          │                                      │
│ Dashboard│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐    │
│ Clients  │  │Stat │ │Stat │ │Stat │ │Stat │    │
│ Upload   │  │Card │ │Card │ │Card │ │Card │    │
│ MCAO     │  └─────┘ └─────┘ └─────┘ └─────┘    │
│ Report-It│                                      │
│ Settings │  ┌───────────┐ ┌───────────┐        │
│          │  │  Quick    │ │  Quick    │        │
│          │  │  Action   │ │  Action   │        │
│          │  └───────────┘ └───────────┘        │
│          │                                      │
│          │  ┌───────────────────────────┐      │
│          │  │    Feature Overview        │      │
│          │  │    Section                 │      │
│          │  └───────────────────────────┘      │
└──────────┴──────────────────────────────────────┘
```
**Colors:** Black sidebar, white content area, red accents

### Client Dashboard (`/client/dashboard`)
```
┌─────────────────────────────────────────────────┐
│  Logo    Dashboard  Properties  Files  Profile  │
├─────────────────────────────────────────────────┤
│                                                 │
│  Welcome, [Name]                                │
│                                                 │
│  ┌─────────────────┐  ┌─────────────────┐      │
│  │   Recent Files  │  │   Upcoming      │      │
│  │   List          │  │   Events        │      │
│  └─────────────────┘  └─────────────────┘      │
│                                                 │
└─────────────────────────────────────────────────┘
```

### File Upload (`/admin/upload`)
```
┌──────────┬──────────────────────────────────────┐
│          │  Upload MLS Data           [User]    │
│  SIDEBAR ├──────────────────────────────────────┤
│          │                                      │
│          │  ┌───────────────────────────────┐  │
│          │  │  Select Client: [Dropdown]    │  │
│          │  │  Upload Type:   [Dropdown]    │  │
│          │  │                               │  │
│          │  │  ┌─────────────────────────┐  │  │
│          │  │  │   DRAG & DROP ZONE      │  │  │
│          │  │  │   or click to browse    │  │  │
│          │  │  └─────────────────────────┘  │  │
│          │  │                               │  │
│          │  │  [Upload Button]              │  │
│          │  └───────────────────────────────┘  │
│          │                                      │
│          │  ┌───────────────────────────────┐  │
│          │  │  Processing Progress Bar      │  │
│          │  └───────────────────────────────┘  │
│          │                                      │
│          │  ┌───────────────────────────────┐  │
│          │  │  Upload History Table         │  │
│          │  └───────────────────────────────┘  │
└──────────┴──────────────────────────────────────┘
```

---

## Forms & Inputs

### Sign In Form
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| Email | email | Valid email format | Yes |
| Password | password | Min 8 characters | Yes |

**Output:** JWT session token, redirect to admin or client dashboard

### Create Client Form
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| First Name | text | 1-50 characters | Yes |
| Last Name | text | 1-50 characters | Yes |
| Email | email | Valid email format | No |
| Phone | tel | Valid phone format | No |
| Address | text | Free text | No |
| Notes | textarea | Free text | No |

**Output:** New client record in `gsrealty_clients` table

### File Upload Form
| Field | Type | Options | Required |
|-------|------|---------|----------|
| Client | select | All clients from database | Yes |
| Upload Type | select | residential_15_mile, lease_15_mile, land_15_mile, commercial_15_mile | Yes |
| File | file | .csv, .xlsx (max 10MB) | Yes |

**Output:** Processed file, database records, optional MCAO enrichment

### MCAO Lookup Form
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| Search Type | radio | APN or Address | Yes |
| APN | text | Format: ###-##-#### or ###-##-####A | If APN selected |
| Address | text | Maricopa County address | If Address selected |

**Output:** MCAO property data (owner, tax value, lot size, year built, etc.)

### Client Profile Form
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| First Name | text | 1-50 characters | Yes |
| Last Name | text | 1-50 characters | Yes |
| Email | email | Valid format | No |
| Phone | tel | Valid format | No |
| Address | textarea | Free text | No |

### Admin Settings
| Setting | Type | Description |
|---------|------|-------------|
| Email Notifications | toggle | Enable/disable all email notifications |
| Client Invite Notifications | toggle | Notify when client accepts invite |
| File Upload Notifications | toggle | Notify on upload completion |
| Auto-Archive | toggle | Auto-archive old files |
| Email Signature | textarea | Custom email signature |

---

## API Endpoints

### Authentication & Invites
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user (disabled) |
| POST | `/api/admin/invites/send` | Send invitation email to client |
| POST | `/api/admin/invites/resend` | Resend expired invitation |
| POST | `/api/admin/invites/verify` | Verify invitation token |
| DELETE | `/api/admin/delete-user` | Delete user account |

### File Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/upload/process` | Process CSV/XLSX file |
| POST | `/api/admin/upload/store` | Store file in Supabase Storage |
| POST | `/api/admin/upload/generate-excel` | Generate Excel template |
| GET | `/api/admin/upload/download/[id]` | Download processed file |
| DELETE | `/api/admin/upload/delete/[id]` | Delete uploaded file |

### MCAO Property Lookup
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/mcao/lookup` | Lookup by APN or address |
| POST | `/api/admin/mcao/bulk` | Bulk property lookups |
| POST | `/api/admin/mcao/arcgis-lookup` | Convert address to APN |
| GET | `/api/admin/mcao/property/[apn]` | Get MCAO data for APN |
| GET | `/api/admin/mcao/download` | Download MCAO results |
| GET | `/api/admin/mcao/status` | MCAO API health check |

### Report-It
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/reportit/upload` | Upload Property Radar report |
| GET | `/api/admin/reportit/download/breakups` | Download breakups report |
| GET | `/api/admin/reportit/download/propertyradar` | Download Property Radar data |

### Client Portal
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/client/files` | List client's files |
| GET | `/api/client/files/[id]/download` | Download specific file |
| GET | `/api/preferences/load` | Load user preferences |
| POST | `/api/preferences/save` | Save preferences |

### Events & Areas
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | List all events |
| POST | `/api/admin/events` | Create new event |
| GET | `/api/areas/list` | List saved areas |
| POST | `/api/areas/save` | Save new area |

### System
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/cron/hourly-scrape` | Scheduled property scraping |
| POST | `/api/cron/daily-cleanup` | Daily database cleanup |
| GET | `/api/admin/monitoring` | Admin monitoring dashboard |

---

## Authentication System

### Architecture
- **Provider:** Supabase Auth (email + password)
- **Tokens:** JWT stored in HTTP-only cookies
- **Roles:** `admin` | `client`

### Sign In Flow
1. User enters email/password at `/signin`
2. Supabase Auth validates credentials
3. System determines role (admin email check or database lookup)
4. User redirected to `/admin` or `/client/dashboard`
5. Login activity recorded in `gsrealty_login_activity`

### Client Invitation Flow
1. Admin creates client via `/admin/clients/new`
2. Admin clicks "Send Invitation" from client detail page
3. System generates UUID token with 7-day expiration
4. Email sent via Resend with setup link: `/setup/[token]`
5. Client clicks link, verifies token, sets password
6. Supabase Auth user created with `role: 'client'`
7. User linked to client record via `auth_user_id`

### Admin Identification
```typescript
// Admin email (environment variable)
NEXT_PUBLIC_ADMIN_EMAIL=gbsullivan@mac.com
```

### Route Protection
| Route Pattern | Access |
|---------------|--------|
| `/admin/*` | Admin only |
| `/client/*` | Client only |
| `/signin`, `/setup/*` | Public |
| `/` | Public |

---

## Database Schema

### Tables Overview

| Table | Records | Purpose |
|-------|---------|---------|
| `gsrealty_users` | User accounts | Authentication & authorization |
| `gsrealty_clients` | Client profiles | Contact information & notes |
| `gsrealty_properties` | Property records | Address, price, features |
| `gsrealty_comps` | Comparable sales | Linked to properties |
| `gsrealty_mcao_data` | MCAO API data | Tax & county info |
| `gsrealty_uploaded_files` | File metadata | Upload tracking |
| `gsrealty_invitations` | Client invites | Token-based signup |
| `gsrealty_login_activity` | Activity logs | Login tracking |
| `gsrealty_admin_settings` | App settings | System configuration |
| `gsrealty_events` | Activity feed | Events & notifications |
| `gsrealty_areas` | Saved areas | Geographic search zones |

### Table: `gsrealty_users`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| auth_user_id | uuid | Supabase Auth user ID |
| email | text | User email (unique) |
| role | text | 'admin' or 'client' |
| full_name | text | Display name |
| last_login | timestamp | Last login time |
| created_at | timestamp | Account creation |

### Table: `gsrealty_clients`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | FK to gsrealty_users |
| first_name | text | First name |
| last_name | text | Last name |
| email | text | Contact email |
| phone | text | Phone number |
| address | text | Physical address |
| notes | text | Admin notes |
| created_at | timestamp | Record creation |
| updated_at | timestamp | Last update |

### Table: `gsrealty_properties`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| client_id | uuid | FK to gsrealty_clients |
| address | text | Street address |
| city | text | City |
| state | text | State (default: AZ) |
| zip | text | ZIP code |
| bedrooms | integer | Bedroom count |
| bathrooms | decimal | Bathroom count |
| sqft | integer | Square footage |
| lot_size | decimal | Lot size (acres) |
| year_built | integer | Year constructed |
| price | decimal | Listing/sale price |
| mls_number | text | MLS listing ID |
| status | text | Active/Sold/Pending |
| created_at | timestamp | Record creation |

### Table: `gsrealty_comps`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| property_id | uuid | FK to gsrealty_properties |
| comp_address | text | Comparable address |
| sale_price | decimal | Sale price |
| sale_date | date | Date sold |
| distance | decimal | Miles from subject |
| sqft | integer | Square footage |
| bedrooms | integer | Bedroom count |
| bathrooms | decimal | Bathroom count |
| price_per_sqft | decimal | Calculated $/sqft |

### Table: `gsrealty_mcao_data`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| property_id | uuid | FK to gsrealty_properties |
| apn | text | Assessor Parcel Number |
| owner_name | text | Recorded owner |
| legal_description | text | Legal property desc |
| lot_size | decimal | Lot size (acres) |
| year_built | integer | Year constructed |
| tax_value | decimal | Assessed tax value |
| land_value | decimal | Land value |
| improvement_value | decimal | Structure value |
| zoning | text | Zoning classification |
| raw_response | jsonb | Full API response |
| fetched_at | timestamp | API call timestamp |

### Table: `gsrealty_uploaded_files`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| client_id | uuid | FK to gsrealty_clients |
| file_name | text | Original filename |
| file_type | text | MIME type |
| file_size | integer | Size in bytes |
| storage_path | text | Supabase Storage path |
| local_path | text | Local filesystem path |
| upload_type | text | residential/lease/etc |
| processed | boolean | Processing complete |
| created_at | timestamp | Upload timestamp |

### Table: `gsrealty_invitations`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| client_id | uuid | FK to gsrealty_clients |
| email | text | Invitation email |
| token | uuid | Unique invitation token |
| expires_at | timestamp | Token expiration |
| used_at | timestamp | When accepted (null if unused) |
| created_at | timestamp | Invitation creation |

### Table: `gsrealty_login_activity`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | FK to gsrealty_users |
| ip_address | text | Client IP |
| user_agent | text | Browser/device info |
| success | boolean | Login successful |
| created_at | timestamp | Attempt timestamp |

### Table: `gsrealty_events`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| client_id | uuid | FK to gsrealty_clients (nullable) |
| title | text | Event title |
| body | text | Event description |
| tags | text[] | Event tags array |
| created_at | timestamp | Event timestamp |

### Table: `gsrealty_areas`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Area name |
| coordinates | jsonb | Boundary coordinates |
| geometry | geography | PostGIS geometry |
| created_at | timestamp | Creation timestamp |

### Relationships Diagram
```
gsrealty_users (1) ─┬─→ (M) gsrealty_login_activity
                    │
                    └─→ (M) gsrealty_clients
                              │
                    ┌─────────┼─────────┬─────────┐
                    ↓         ↓         ↓         ↓
              (M) properties  (M) files  (M) invites  (M) events
                    │
              ┌─────┴─────┐
              ↓           ↓
         (M) comps   (M) mcao_data
```

---

## Environment Variables

### Required Variables
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://fsaluvvszosucvzaedtj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3004
NEXT_PUBLIC_APP_NAME=GSRealty
NEXT_PUBLIC_ADMIN_EMAIL=gbsullivan@mac.com
NODE_ENV=development

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@gsrealty.com
RESEND_REPLY_TO_EMAIL=support@gsrealty.com

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_key

# OpenAI (Location Intelligence)
OPENAI_API_KEY=sk-xxxxxxxxxxxxx
```

### Optional Variables
```bash
# Local file storage (macOS)
LOCAL_STORAGE_PATH=/Users/garrettsullivan/Desktop/‼️/RE/RealtyONE/MY LISTINGS/

# MCAO API
MCAO_API_URL=https://mcaoapi.maricopa.gov
MCAO_API_KEY=your_mcao_key

# Cron Jobs (Vercel)
CRON_SECRET=your_cron_secret

# Monitoring
DD_API_KEY=your_datadog_key
DD_SITE=datadoghq.com
DD_SERVICE=gsrealty-client
DD_ENV=production
```

---

## Development Commands

### Core
```bash
npm run dev          # Start dev server (port 3004)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint check
npm run typecheck    # TypeScript validation
npm run format       # Prettier formatting
```

### Testing
```bash
npm test             # Jest unit tests
npm run test:watch   # Watch mode
npm run test:e2e     # Playwright E2E tests
```

### Database
```bash
npm run db:migrate   # Push migrations to Supabase
npm run db:seed      # Seed demo data
```

---

## Quick Start

### Prerequisites
- Node.js 18+ (npm 9+)
- Supabase account
- Vercel account (for deployment)

### Installation
```bash
# Navigate to project
cd apps/gsrealty-client

# Install dependencies
npm install

# Copy environment template
cp .env.sample .env.local

# Configure environment variables in .env.local

# Start development server
npm run dev

# Open http://localhost:3004
```

### First-Time Setup
1. Configure Supabase project
2. Run database migrations: `npm run db:migrate`
3. Create admin account in Supabase Auth
4. Add admin email to environment variables
5. Start development server

---

## Security

| Feature | Implementation |
|---------|----------------|
| Authentication | Supabase Auth with JWT |
| Authorization | Role-based (admin/client) |
| Database Security | Row Level Security (RLS) |
| Password Storage | Bcrypt hashing |
| Input Validation | Zod schema validation |
| Transport | HTTPS in production |
| XSS Protection | React sanitization |
| CSRF | Next.js built-in protection |
| Secrets | Environment variables |
| Activity Logging | Login tracking |

---

## Deployment

### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to production
vercel --prod
```

### Vercel Cron Jobs
Configured in `vercel.json`:
| Schedule | Endpoint | Purpose |
|----------|----------|---------|
| `0 * * * *` | `/api/cron/hourly-scrape` | Property updates |
| `0 3 * * *` | `/api/cron/daily-cleanup` | Database maintenance |
| `*/15 * * * *` | `/api/cron/check-health` | Health monitoring |

### Production Checklist
- [ ] Environment variables set in Vercel Dashboard
- [ ] Supabase RLS policies enabled
- [ ] Admin email configured
- [ ] Email sending tested
- [ ] MCAO API connectivity verified
- [ ] Health endpoint responding

---

## Project Structure

```
apps/gsrealty-client/
├── app/                          # Next.js App Router
│   ├── admin/                    # Admin pages
│   │   ├── page.tsx              # Dashboard
│   │   ├── clients/              # Client management
│   │   ├── upload/               # File upload
│   │   ├── mcao/                 # MCAO lookup
│   │   ├── reportit/             # Report-It tools
│   │   └── settings/             # Admin settings
│   ├── client/                   # Client portal pages
│   │   ├── dashboard/            # Client dashboard
│   │   ├── properties/           # Property viewing
│   │   ├── files/                # Document library
│   │   └── profile/              # Profile management
│   ├── api/                      # API routes
│   │   ├── admin/                # Admin endpoints
│   │   ├── client/               # Client endpoints
│   │   ├── auth/                 # Auth endpoints
│   │   └── cron/                 # Scheduled jobs
│   ├── signin/                   # Sign in page
│   ├── setup/                    # Invitation setup
│   └── auth/                     # Auth callbacks
│
├── components/                   # React components
│   ├── admin/                    # Admin components
│   │   ├── FileUploadForm.tsx
│   │   ├── FileDropzone.tsx
│   │   ├── InviteClientModal.tsx
│   │   └── MCAOCategorizedData.tsx
│   ├── client/                   # Client components
│   │   ├── ClientNav.tsx
│   │   ├── FileList.tsx
│   │   └── PropertyCard.tsx
│   ├── map/                      # Map components
│   └── ui/                       # Shared UI components
│
├── lib/                          # Core libraries
│   ├── supabase/                 # Supabase clients
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client
│   │   └── auth.ts               # Auth utilities
│   ├── database/                 # Data access layer
│   │   ├── clients.ts
│   │   ├── properties.ts
│   │   ├── invitations.ts
│   │   └── files.ts
│   ├── processing/               # File processing
│   │   ├── excel-processor.ts
│   │   └── csv-processor.ts
│   ├── validation/               # Zod schemas
│   └── constants/                # App constants
│       └── branding.ts
│
├── contexts/                     # React contexts
│   └── AuthContext.tsx
│
├── hooks/                        # Custom hooks
│   └── useAuth.ts
│
├── DOCUMENTATION/                # Project documentation
├── supabase/                     # Database migrations
├── templates/                    # Excel templates
└── tests/                        # Test files
```

---

## Documentation

| Document | Location | Purpose |
|----------|----------|---------|
| README.md | Root | Project overview (this file) |
| GSREALTY_PROJECT_REQUIREMENTS.md | /DOCUMENTATION | Full specifications |
| TEMPLATE_FIELDS_REFERENCE.md | /DOCUMENTATION | Excel template guide |
| PROJECT_STRUCTURE.md | /DOCUMENTATION | File organization |
| MLS_FIELD_MAPPING.md | /DOCUMENTATION | MLS data mapping |

---

## FAQ

**Q: How do I add a new admin user?**
A: Update the `NEXT_PUBLIC_ADMIN_EMAIL` environment variable or add additional admin detection logic in `lib/supabase/auth.ts`.

**Q: Why can't clients self-register?**
A: Registration is invitation-only for security. Admins send invitations via the client management interface.

**Q: Does this work outside Maricopa County?**
A: The MCAO integration is Maricopa County-specific. Property management features work anywhere.

**Q: What file formats are supported for upload?**
A: CSV and XLSX files up to 10MB. See `/lib/validation/upload-schema.ts` for details.

---

## Support

### Contact
- **Project Owner:** Garrett Sullivan
- **Business:** Sullivan Real Estate, Maricopa County, AZ

### Issues
- Create GitHub issue with steps to reproduce
- Include screenshots if applicable

---

## License

**Proprietary** - (c) 2025 Sullivan Real Estate. All rights reserved.

---

**Project:** GSRealty Client Management System
**Version:** 1.0.0
**Status:** Production Ready
**Last Updated:** January 2026
