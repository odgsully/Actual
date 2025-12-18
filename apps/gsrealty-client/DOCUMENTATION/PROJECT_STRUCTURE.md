# GSRealty Client Management System - Project Structure

**Project:** GSRealty Client Management System
**Purpose:** Define complete file/folder organization and architecture
**Created:** October 15, 2025

---

## Directory Tree

```
apps/gsrealty-client/
├── .env.local                          # Environment variables (local dev)
├── .env.production                     # Environment variables (production)
├── .gitignore                          # Git ignore rules
├── package.json                        # Node dependencies
├── tsconfig.json                       # TypeScript configuration
├── next.config.js                      # Next.js configuration
├── tailwind.config.js                  # Tailwind CSS config
├── postcss.config.js                   # PostCSS config
├── README.md                           # Project README
│
├── DOCUMENTATION/                      # Project documentation
│   ├── GSREALTY_PROJECT_REQUIREMENTS.md # Master requirements ✅
│   ├── TEMPLATE_FIELDS_REFERENCE.md    # Excel template guide ✅
│   ├── API_DOCUMENTATION.md            # API endpoint reference
│   ├── DEPLOYMENT_GUIDE.md             # Deployment instructions
│   ├── USER_GUIDE_ADMIN.md             # Admin manual
│   ├── USER_GUIDE_CLIENT.md            # Client manual
│   └── DEVELOPMENT_SETUP.md            # Local setup guide
│
├── app/                                # Next.js App Router
│   ├── globals.css                     # Global styles
│   ├── layout.tsx                      # Root layout
│   ├── page.tsx                        # Landing page (GSRealty branding)
│   │
│   ├── signin/                         # Sign-in page
│   │   └── page.tsx                    # Universal sign-in (admin + client)
│   │
│   ├── admin/                          # Admin-only routes
│   │   ├── layout.tsx                  # Admin layout (sidebar nav)
│   │   ├── dashboard/                  # Admin dashboard
│   │   │   └── page.tsx
│   │   ├── clients/                    # Client management
│   │   │   ├── page.tsx                # List all clients
│   │   │   ├── new/
│   │   │   │   └── page.tsx            # Add new client form
│   │   │   └── [id]/
│   │   │       ├── page.tsx            # Client details
│   │   │       └── edit/
│   │   │           └── page.tsx        # Edit client
│   │   ├── upload/                     # File upload
│   │   │   └── page.tsx                # Upload HTML/CSV/XLSX
│   │   ├── mcao/                       # MCAO lookup tool
│   │   │   └── page.tsx                # APN lookup interface
│   │   ├── analytics/                  # Analytics & reports
│   │   │   └── page.tsx
│   │   └── settings/                   # Admin settings
│   │       └── page.tsx
│   │
│   ├── client/                         # Client-only routes
│   │   ├── layout.tsx                  # Client layout (top nav)
│   │   ├── dashboard/                  # Client dashboard
│   │   │   └── page.tsx
│   │   ├── properties/                 # Client properties
│   │   │   ├── page.tsx                # List properties
│   │   │   └── [id]/
│   │   │       └── page.tsx            # Property details
│   │   ├── comps/                      # Comparable sales
│   │   │   └── [propertyId]/
│   │   │       └── page.tsx            # View comps for property
│   │   ├── documents/                  # Document library
│   │   │   └── page.tsx
│   │   └── profile/                    # Client profile
│   │       └── page.tsx
│   │
│   └── api/                            # API routes
│       ├── health/                     # Health check
│       │   └── route.ts
│       │
│       ├── admin/                      # Admin API routes
│       │   ├── auth/
│       │   │   ├── signin/
│       │   │   │   └── route.ts
│       │   │   ├── signout/
│       │   │   │   └── route.ts
│       │   │   └── session/
│       │   │       └── route.ts
│       │   ├── clients/
│       │   │   ├── route.ts            # GET (list), POST (create)
│       │   │   └── [id]/
│       │   │       └── route.ts        # GET, PUT, DELETE
│       │   ├── upload/
│       │   │   ├── html/
│       │   │   │   └── route.ts
│       │   │   ├── csv/
│       │   │   │   └── route.ts
│       │   │   └── xlsx/
│       │   │       └── route.ts
│       │   ├── properties/
│       │   │   ├── [clientId]/
│       │   │   │   └── route.ts
│       │   │   └── process/
│       │   │       └── route.ts
│       │   ├── mcao/
│       │   │   ├── lookup/
│       │   │   │   └── route.ts
│       │   │   └── property/
│       │   │       └── [apn]/
│       │   │           └── route.ts
│       │   ├── analytics/
│       │   │   ├── logins/
│       │   │   │   └── route.ts
│       │   │   └── clients/
│       │   │       └── route.ts
│       │   └── files/
│       │       └── [clientId]/
│       │           └── route.ts
│       │
│       └── client/                     # Client API routes
│           ├── auth/
│           │   ├── signin/
│           │   │   └── route.ts
│           │   ├── signout/
│           │   │   └── route.ts
│           │   └── session/
│           │       └── route.ts
│           ├── dashboard/
│           │   └── route.ts
│           ├── properties/
│           │   └── route.ts
│           ├── comps/
│           │   └── [propertyId]/
│           │       └── route.ts
│           └── documents/
│               └── route.ts
│
├── components/                         # Reusable UI components
│   ├── admin/                          # Admin components
│   │   ├── Sidebar.tsx                 # Admin sidebar navigation
│   │   ├── ClientTable.tsx             # Client list table
│   │   ├── ClientForm.tsx              # Add/Edit client form
│   │   ├── FileUploadForm.tsx          # File upload interface
│   │   ├── MCAOLookup.tsx              # MCAO lookup tool
│   │   ├── AnalyticsDashboard.tsx      # Analytics widgets
│   │   └── AdminHeader.tsx             # Admin header
│   │
│   ├── client/                         # Client components
│   │   ├── ClientNav.tsx               # Client navigation
│   │   ├── PropertyCard.tsx            # Property display card
│   │   ├── CompsTable.tsx              # Comparable sales table
│   │   ├── DocumentList.tsx            # Document library
│   │   └── ClientHeader.tsx            # Client header
│   │
│   ├── shared/                         # Shared components
│   │   ├── Button.tsx                  # Button component
│   │   ├── Input.tsx                   # Input component
│   │   ├── Select.tsx                  # Dropdown select
│   │   ├── Table.tsx                   # Table component
│   │   ├── Card.tsx                    # Card container
│   │   ├── Modal.tsx                   # Modal dialog
│   │   ├── Loading.tsx                 # Loading spinner
│   │   ├── ErrorMessage.tsx            # Error display
│   │   └── Toast.tsx                   # Toast notifications
│   │
│   ├── auth/                           # Authentication components
│   │   ├── SignInForm.tsx              # Sign-in form
│   │   ├── ProtectedRoute.tsx          # Route protection HOC
│   │   └── RoleGuard.tsx               # Role-based access control
│   │
│   └── ui/                             # Radix UI components
│       ├── button.tsx
│       ├── input.tsx
│       ├── select.tsx
│       ├── dialog.tsx
│       └── ... (other Radix components)
│
├── lib/                                # Core library code
│   ├── supabase/                       # Supabase integration
│   │   ├── client.ts                   # Browser client
│   │   ├── server.ts                   # Server client
│   │   └── middleware.ts               # Auth middleware
│   │
│   ├── database/                       # Database access layer
│   │   ├── users.ts                    # User operations
│   │   ├── clients.ts                  # Client operations
│   │   ├── properties.ts               # Property operations
│   │   ├── comps.ts                    # Comparable sales operations
│   │   ├── files.ts                    # File metadata operations
│   │   ├── login-activity.ts           # Login tracking
│   │   └── mcao-data.ts                # MCAO data operations
│   │
│   ├── processing/                     # File processing logic
│   │   ├── excel-processor.ts          # ExcelJS processing
│   │   ├── csv-processor.ts            # CSV parsing (papaparse)
│   │   ├── file-validator.ts           # File validation
│   │   ├── folder-creator.ts           # Local folder creation
│   │   ├── template-populator.ts       # Populate template.xlsx
│   │   └── data-transformer.ts         # Data mapping/transformation
│   │
│   ├── mcao/                           # MCAO API integration
│   │   ├── mcao-client.ts              # MCAO API client
│   │   ├── apn-parser.ts               # APN format validation
│   │   └── property-enricher.ts        # Enrich property data
│   │
│   ├── validation/                     # Validation schemas
│   │   ├── client-schema.ts            # Client form validation (Zod)
│   │   ├── upload-schema.ts            # File upload validation
│   │   ├── property-schema.ts          # Property data validation
│   │   └── auth-schema.ts              # Auth validation
│   │
│   ├── utils/                          # Utility functions
│   │   ├── date-helpers.ts             # Date formatting
│   │   ├── currency-helpers.ts         # Currency formatting
│   │   ├── distance-calculator.ts      # Haversine distance
│   │   ├── string-helpers.ts           # String utilities
│   │   ├── file-helpers.ts             # File name sanitization
│   │   └── error-handler.ts            # Error handling
│   │
│   └── constants/                      # Constants & config
│       ├── file-types.ts               # Allowed file types
│       ├── routes.ts                   # Route paths
│       ├── roles.ts                    # User roles
│       └── config.ts                   # App configuration
│
├── hooks/                              # Custom React hooks
│   ├── useAuth.ts                      # Authentication hook
│   ├── useClients.ts                   # Client data hook
│   ├── useProperties.ts                # Property data hook
│   ├── useFileUpload.ts                # File upload hook
│   ├── useMCAO.ts                      # MCAO lookup hook
│   └── useToast.ts                     # Toast notifications hook
│
├── contexts/                           # React contexts
│   ├── AuthContext.tsx                 # Authentication state
│   └── ToastContext.tsx                # Toast notifications
│
├── types/                              # TypeScript type definitions
│   ├── database.ts                     # Database types (from Supabase)
│   ├── api.ts                          # API request/response types
│   ├── client.ts                       # Client types
│   ├── property.ts                     # Property types
│   ├── comp.ts                         # Comparable sale types
│   ├── mcao.ts                         # MCAO API types
│   ├── file.ts                         # File types
│   └── user.ts                         # User types
│
├── middleware.ts                       # Next.js middleware (auth)
│
├── APN/                                # APN lookup integration
│   ├── apn_lookup.py                   # Python APN lookup script (copied)
│   ├── README.md                       # APN tool documentation
│   └── requirements.txt                # Python dependencies
│
├── templates/                          # Excel templates
│   ├── template.xlsx                   # Master template
│   ├── template_blank.xlsx             # Blank template for new clients
│   └── README.md                       # Template usage guide
│
├── public/                             # Static assets
│   ├── logo.png                        # GSRealty logo
│   ├── favicon.ico                     # Favicon
│   ├── assets/                         # Images, icons
│   │   ├── placeholder-property.jpg
│   │   └── icons/
│   └── mcao-ui/                        # MCAO-UI static files (if ported)
│
├── supabase/                           # Supabase configuration
│   ├── config.toml                     # Supabase config
│   ├── migrations/                     # Database migrations
│   │   ├── 20251015153522_create_gsrealty_base_tables.sql ✅
│   │   ├── 20251015_add_comps_table.sql
│   │   └── 20251015_add_mcao_data_table.sql
│   └── seed.sql                        # Seed data (optional)
│
├── backend/                            # Django Ninja REST API (optional)
│   ├── manage.py                       # Django management script
│   ├── requirements.txt                # Python dependencies
│   ├── .env                            # Django environment variables
│   │
│   ├── gsrealty/                       # Django project
│   │   ├── __init__.py
│   │   ├── settings.py                 # Django settings
│   │   ├── urls.py                     # URL routing
│   │   ├── wsgi.py                     # WSGI config
│   │   └── asgi.py                     # ASGI config
│   │
│   ├── api/                            # Django Ninja API app
│   │   ├── __init__.py
│   │   ├── admin_api.py                # Admin endpoints
│   │   ├── client_api.py               # Client endpoints
│   │   ├── mcao_api.py                 # MCAO endpoints
│   │   ├── processing_api.py           # File processing endpoints
│   │   └── schemas.py                  # Pydantic schemas
│   │
│   ├── services/                       # Business logic services
│   │   ├── __init__.py
│   │   ├── mcao_client.py              # MCAO API client
│   │   ├── apn_lookup.py               # APN lookup service
│   │   ├── file_processor.py           # File processing service
│   │   └── excel_generator.py          # Excel generation service
│   │
│   └── models/                         # Django models (if needed)
│       ├── __init__.py
│       └── ... (optional ORM models)
│
├── scripts/                            # Utility scripts
│   ├── seed-demo-data.ts               # Seed demo client data
│   ├── migrate-wabbit-to-gsrealty.ts   # Migration script (cleanup)
│   ├── test-mcao-api.ts                # Test MCAO integration
│   ├── test-excel-processing.ts        # Test Excel processing
│   └── cleanup-old-files.ts            # Cleanup script
│
├── tests/                              # Test files
│   ├── unit/                           # Unit tests
│   │   ├── lib/
│   │   │   ├── processing/
│   │   │   │   ├── excel-processor.test.ts
│   │   │   │   └── csv-processor.test.ts
│   │   │   ├── mcao/
│   │   │   │   └── mcao-client.test.ts
│   │   │   └── utils/
│   │   │       └── distance-calculator.test.ts
│   │   └── api/
│   │       ├── admin/
│   │       │   └── clients.test.ts
│   │       └── client/
│   │           └── properties.test.ts
│   │
│   ├── integration/                    # Integration tests
│   │   ├── file-upload.test.ts
│   │   ├── mcao-integration.test.ts
│   │   └── client-workflow.test.ts
│   │
│   └── e2e/                            # End-to-end tests (Playwright)
│       ├── admin-flow.spec.ts
│       ├── client-flow.spec.ts
│       └── upload-flow.spec.ts
│
└── .claude/                            # Claude Code configuration
    └── settings.json                   # Claude settings (hooks disabled)
```

---

## Key Directory Explanations

### `/app` - Next.js App Router
- **Structure:** File-system based routing
- **Admin routes:** `/admin/*` - Protected, admin-only access
- **Client routes:** `/client/*` - Protected, client-only access
- **API routes:** `/api/*` - RESTful endpoints
- **Layout files:** Nested layouts for admin/client sections

### `/components` - UI Components
- **admin/:** Admin dashboard widgets
- **client/:** Client dashboard components
- **shared/:** Reusable across admin + client
- **ui/:** Radix UI primitive wrappers
- **auth/:** Authentication components

### `/lib` - Core Library
- **supabase/:** Database client configuration
- **database/:** Data access layer (repository pattern)
- **processing/:** File upload and Excel processing logic
- **mcao/:** MCAO API integration
- **validation/:** Zod schemas for validation
- **utils/:** Helper functions
- **constants/:** Configuration constants

### `/backend` - Django Ninja (Optional)
- **Purpose:** Heavy processing tasks, Python-specific logic
- **When to use:** If TypeScript API routes are insufficient
- **Alternative:** Keep all logic in Next.js API routes (simpler deployment)

### `/templates` - Excel Templates
- **template.xlsx:** Master template with all sheets defined
- **Usage:** Basis for all processed client files

### `/APN` - APN Lookup Tool
- **apn_lookup.py:** Copied from external source
- **Integration:** Called from Next.js API routes or Django backend

### `/DOCUMENTATION` - Project Docs
- **All .md files:** Comprehensive documentation
- **For:** Developers, admins, clients, deployment

### `/supabase` - Database Management
- **migrations/:** SQL migration files
- **config.toml:** Supabase configuration
- **Versioned:** Track database schema changes

---

## File Naming Conventions

### TypeScript/React Files
- **Components:** PascalCase (e.g., `ClientTable.tsx`)
- **Utilities:** kebab-case (e.g., `distance-calculator.ts`)
- **API Routes:** route.ts (Next.js convention)
- **Types:** kebab-case (e.g., `client-types.ts`)

### Python Files
- **Modules:** snake_case (e.g., `mcao_client.py`)
- **Classes:** PascalCase (e.g., `class MCAOClient`)
- **Functions:** snake_case (e.g., `def fetch_property_data()`)

### Documentation
- **Markdown:** SCREAMING_SNAKE_CASE (e.g., `API_DOCUMENTATION.md`)
- **README:** Always `README.md`

---

## Environment Variables Structure

### `.env.local` (Local Development)
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://fsaluvvszosucvzaedtj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Admin
ADMIN_USERNAME=garrett_admin
ADMIN_PASSWORD_HASH=$2b$10$...hashed_password_here

# File Storage
LOCAL_STORAGE_PATH=/Users/garrettsullivan/Desktop/‼️/RE/RealtyONE/MY LISTINGS/

# MCAO API
MCAO_API_URL=https://mcaoapi.maricopa.gov
MCAO_API_KEY=your_mcao_api_key_here

# App
NEXT_PUBLIC_APP_URL=http://localhost:3004
NODE_ENV=development

# Django Backend (if used)
DJANGO_API_URL=http://localhost:8000
DJANGO_SECRET_KEY=your_django_secret_here

# Security
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_encryption_key_here
```

### `.env.production` (Vercel Deployment)
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://fsaluvvszosucvzaedtj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Admin
ADMIN_USERNAME=garrett_admin
ADMIN_PASSWORD_HASH=$2b$10$...hashed_password_here

# File Storage (Production uses Supabase Storage)
SUPABASE_STORAGE_BUCKET=gsrealty-files

# MCAO API
MCAO_API_URL=https://mcaoapi.maricopa.gov
MCAO_API_KEY=your_mcao_api_key_here

# App
NEXT_PUBLIC_APP_URL=https://gsrealty.vercel.app
NODE_ENV=production

# Django Backend (if deployed separately)
DJANGO_API_URL=https://gsrealty-backend.herokuapp.com

# Security
JWT_SECRET=production_jwt_secret_here
ENCRYPTION_KEY=production_encryption_key_here

# Monitoring (optional)
SENTRY_DSN=your_sentry_dsn_here
```

---

## Package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev -p 3004",
    "build": "next build",
    "start": "next start -p 3004",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write \"**/*.{ts,tsx,md}\"",

    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",

    "db:migrate": "supabase db push",
    "db:reset": "supabase db reset",
    "db:seed": "tsx scripts/seed-demo-data.ts",

    "mcao:test": "tsx scripts/test-mcao-api.ts",
    "excel:test": "tsx scripts/test-excel-processing.ts",

    "cleanup": "tsx scripts/cleanup-old-files.ts"
  }
}
```

---

## Database Schema Organization

### Supabase Tables (PostgreSQL)

**Core Tables:**
- `gsrealty_users` - User accounts
- `gsrealty_clients` - Client information
- `gsrealty_properties` - Property records
- `gsrealty_comps` - Comparable sales
- `gsrealty_mcao_data` - MCAO property data
- `gsrealty_uploaded_files` - File metadata
- `gsrealty_login_activity` - Login tracking
- `gsrealty_admin_settings` - Settings

**Relationships:**
```
gsrealty_users
  ├─> gsrealty_clients (user_id)
  │   ├─> gsrealty_properties (client_id)
  │   │   ├─> gsrealty_comps (property_id)
  │   │   └─> gsrealty_mcao_data (property_id)
  │   └─> gsrealty_uploaded_files (client_id)
  └─> gsrealty_login_activity (user_id)
```

**Row Level Security (RLS):**
- Clients can only see their own data
- Admin can see all data
- Enforced at database level

---

## API Route Organization

### Admin API (`/api/admin/*`)
- **Auth:** `/api/admin/auth/*`
- **Clients:** `/api/admin/clients/*`
- **Files:** `/api/admin/upload/*` and `/api/admin/files/*`
- **Properties:** `/api/admin/properties/*`
- **MCAO:** `/api/admin/mcao/*`
- **Analytics:** `/api/admin/analytics/*`

### Client API (`/api/client/*`)
- **Auth:** `/api/client/auth/*`
- **Dashboard:** `/api/client/dashboard`
- **Properties:** `/api/client/properties`
- **Comps:** `/api/client/comps/*`
- **Documents:** `/api/client/documents`

**Middleware Protection:**
- All `/admin/*` routes: Check admin role
- All `/client/*` routes: Check client role
- Implemented in `middleware.ts`

---

## Component Hierarchy

```
App (RootLayout)
│
├── Admin Routes
│   └── AdminLayout (Sidebar + Header)
│       ├── AdminHeader
│       ├── Sidebar
│       └── [Page Components]
│           ├── Dashboard
│           ├── ClientTable
│           ├── ClientForm
│           ├── FileUploadForm
│           └── MCAOLookup
│
└── Client Routes
    └── ClientLayout (TopNav + Header)
        ├── ClientHeader
        ├── ClientNav
        └── [Page Components]
            ├── Dashboard
            ├── PropertyCard
            ├── CompsTable
            └── DocumentList
```

---

## State Management Strategy

### Server State (React Query)
- API data fetching
- Caching
- Automatic refetching
- Optimistic updates

**Example:**
```typescript
// hooks/useClients.ts
import { useQuery } from '@tanstack/react-query';

export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: () => fetch('/api/admin/clients').then(res => res.json())
  });
}
```

### Client State (React Context)
- Authentication state
- Toast notifications
- Theme preferences
- UI state (modals, sidebars)

**Example:**
```typescript
// contexts/AuthContext.tsx
const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // ...auth logic
  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
```

---

## Testing Strategy

### Unit Tests (`/tests/unit`)
- **Library functions:** utils, processing, mcao
- **API handlers:** Business logic
- **Components:** Isolated component testing
- **Tool:** Jest + React Testing Library

### Integration Tests (`/tests/integration`)
- **File upload workflow:** Upload → Process → Save
- **MCAO integration:** API call → Parse → Store
- **Client workflow:** Create client → Add property → View data

### E2E Tests (`/tests/e2e`)
- **Admin flow:** Sign in → Add client → Upload file → View result
- **Client flow:** Sign in → View properties → View comps
- **Tool:** Playwright

---

## Deployment Structure

### Vercel (Recommended)
```
vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase-service-key"
  }
}
```

### Project Structure on Vercel
```
Project: gsrealty-client
  ├── Environment Variables (Production)
  ├── Domains: gsrealty.vercel.app
  ├── Git: GitHub integration
  └── Settings: Auto-deploy on push
```

---

## Local File Storage Structure

### Development Path
```
/Users/garrettsullivan/Desktop/‼️/RE/RealtyONE/MY LISTINGS/
├── Mozingo 10.25/
│   ├── original_upload.xlsx
│   ├── processed_template.xlsx
│   ├── client_page.html
│   └── metadata.json
├── Smith 11.25/
│   └── ...
└── [LastName MM.YY]/
    └── ...
```

**Folder Naming:** `[LastName] [MM.YY]`
- LastName: Client's last name (capitalized)
- MM: Two-digit month
- YY: Two-digit year

### Production Storage
- **Supabase Storage:** Bucket `gsrealty-files`
- **Path:** `clients/{clientId}/{filename}`
- **Sync:** Optional script to download to local machine

---

## MCAO-UI Integration Approaches

### Option 1: Port to Next.js (Recommended)
```
app/admin/mcao/
├── page.tsx                # Main MCAO UI
└── components/
    ├── APNSearch.tsx       # APN search form
    ├── PropertyResult.tsx  # Result display
    └── TaxHistory.tsx      # Tax history table
```

### Option 2: Iframe Embed
```tsx
// app/admin/mcao/page.tsx
export default function MCAOPage() {
  return (
    <iframe
      src="http://localhost:5000"
      width="100%"
      height="800px"
      title="MCAO Lookup"
    />
  );
}
```

### Option 3: External Service
- Deploy Flask app separately
- API communication via REST
- Link from admin dashboard

**Recommended:** Option 1 for better integration

---

## Security Layers

### 1. Authentication (Supabase Auth)
- Email + password
- JWT tokens
- Session management

### 2. Authorization (RLS + Middleware)
- Row Level Security in Supabase
- Next.js middleware for route protection
- Role-based access control

### 3. Data Validation
- Zod schemas for all inputs
- ExcelJS for safe Excel parsing
- File type/size validation

### 4. Encryption
- HTTPS in production
- Encrypted environment variables
- Hashed passwords

### 5. Audit Logging
- `gsrealty_login_activity` table
- Admin action logs (future)
- File upload logs

---

## Performance Optimization

### Build Optimization
- Next.js automatic code splitting
- Image optimization
- Static page generation where possible

### Runtime Optimization
- React Query caching
- Lazy loading components
- Debounced search inputs
- Optimistic UI updates

### Database Optimization
- Indexed columns (APN, client_id, user_id)
- Connection pooling (Supabase)
- Query optimization

---

## Monitoring & Logging

### Development
- Console logs
- Next.js build logs
- Supabase Studio

### Production
- Vercel Analytics (built-in)
- Sentry for error tracking (optional)
- Supabase logs
- Custom logging table (optional)

---

## Maintenance & Operations

### Regular Tasks
- Database backups (weekly)
- Clean old files (monthly)
- Security updates (as needed)
- Dependency updates (monthly)

### Scripts
- `scripts/cleanup-old-files.ts` - Remove old client data
- `scripts/backup-database.ts` - Manual backup script
- `scripts/update-dependencies.ts` - Check for updates

---

## Development Workflow

### 1. Local Development
```bash
# Clone repo
git clone <repo>
cd apps/gsrealty-client

# Install dependencies
npm install

# Set up environment
cp .env.sample .env.local
# Edit .env.local with your keys

# Link Supabase
supabase link --project-ref fsaluvvszosucvzaedtj

# Run migrations
npm run db:migrate

# Start dev server
npm run dev

# Open http://localhost:3004
```

### 2. Making Changes
```bash
# Create feature branch
git checkout -b feature/add-mcao-lookup

# Make changes
# ... code ...

# Run tests
npm run test
npm run typecheck
npm run lint

# Commit
git add .
git commit -m "feat: add MCAO lookup integration"

# Push
git push origin feature/add-mcao-lookup

# Create PR on GitHub
```

### 3. Deployment
```bash
# Merge PR to main
# Vercel auto-deploys

# Or manual deploy
vercel --prod
```

---

## Migration from Wabbit RE

### Steps to Clean Up
1. **Remove Wabbit branding:** Update app/layout.tsx, app/page.tsx
2. **Update branding:** Replace logo, colors, text
3. **Remove unused features:** rank-feed, agent-view, etc.
4. **Keep shared components:** Auth, settings, theme
5. **Add GSRealty features:** Admin dashboard, file upload, MCAO

### Migration Script
```typescript
// scripts/migrate-wabbit-to-gsrealty.ts
// Automate cleanup tasks
```

---

## Documentation Maintenance

### When to Update Docs
- New features added
- API changes
- Deployment process changes
- Security updates
- Bug fixes affecting usage

### Doc Files to Maintain
- `README.md` - Keep up to date
- `GSREALTY_PROJECT_REQUIREMENTS.md` - Update requirements
- `API_DOCUMENTATION.md` - Document new endpoints
- `TEMPLATE_FIELDS_REFERENCE.md` - Update template changes

---

## Conclusion

This project structure provides:
- ✅ Clear separation of concerns
- ✅ Scalable architecture
- ✅ Maintainable codebase
- ✅ Comprehensive documentation
- ✅ Security-first design
- ✅ Developer-friendly organization

**Next Steps:**
1. Review and approve structure
2. Begin Phase 1 implementation
3. Create UI mockups
4. Set up Django backend (if needed)
5. Implement authentication
6. Build admin dashboard
7. Add file upload system
8. Integrate MCAO

---

**END OF PROJECT STRUCTURE DOCUMENT**
