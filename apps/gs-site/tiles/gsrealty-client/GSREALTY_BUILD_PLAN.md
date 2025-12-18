# GSRealty Client Management System - Implementation Checklist

## Project Overview
Real estate client management system with Admin and Client dashboards, Supabase integration, and Vercel deployment for Maricopa County, Arizona realtor services.

## Tech Stack
- [ ] Frontend: Next.js 14+ with TypeScript
- [ ] Styling: Tailwind CSS + shadcn/ui
- [ ] Backend: Django Ninja REST API
- [ ] Database: Supabase (PostgreSQL)
- [ ] Hosting: Vercel
- [ ] File Storage: Local filesystem

## Phase 1: Project Setup & Configuration

### Initial Setup
- [ ] Create project directory structure at `/tiles/GSrealty-client/`
- [ ] Initialize Next.js project with TypeScript
  ```bash
  npx create-next-app@latest frontend --typescript --tailwind --app
  ```
- [ ] Set up Django Ninja backend
  ```bash
  pip install django ninja
  django-admin startproject backend
  ```
- [ ] Install required dependencies
  - [ ] Frontend: `@supabase/supabase-js`, `shadcn/ui`, `react-hook-form`, `zod`
  - [ ] Backend: `django-ninja`, `pandas`, `openpyxl`, `python-dotenv`

### Environment Configuration
- [ ] Create `.env.local` for frontend with:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `MCAO_API_KEY`
  - [ ] `MCAO_API_BASE_URL`
- [ ] Create `.env` for backend with:
  - [ ] `DATABASE_URL`
  - [ ] `SECRET_KEY`
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_KEY`

## Phase 2: Database Schema (Supabase)

### Create Tables
- [ ] **users** table (extends auth.users)
  ```sql
  - id (uuid, primary key)
  - email (text, unique)
  - full_name (text)
  - role (enum: 'admin', 'client')
  - created_at (timestamp)
  - last_login (timestamp)
  ```

- [ ] **clients** table
  ```sql
  - id (uuid, primary key)
  - user_id (uuid, foreign key)
  - first_name (text)
  - last_name (text)
  - phone (text)
  - address (text)
  - property_address (text)
  - created_at (timestamp)
  - updated_at (timestamp)
  ```

- [ ] **properties** table
  ```sql
  - id (uuid, primary key)
  - client_id (uuid, foreign key)
  - apn (text)
  - address (text)
  - city (text)
  - state (text)
  - zip (text)
  - property_data (jsonb)
  - created_at (timestamp)
  ```

- [ ] **login_activity** table
  ```sql
  - id (uuid, primary key)
  - user_id (uuid, foreign key)
  - login_time (timestamp)
  - ip_address (text)
  - user_agent (text)
  ```

- [ ] **uploaded_files** table
  ```sql
  - id (uuid, primary key)
  - client_id (uuid, foreign key)
  - file_name (text)
  - file_type (enum: 'csv', 'xlsx')
  - file_path (text)
  - upload_date (timestamp)
  ```

- [ ] **admin_settings** table
  ```sql
  - id (uuid, primary key)
  - setting_key (text, unique)
  - setting_value (jsonb)
  - updated_at (timestamp)
  ```

### Row Level Security
- [ ] Enable RLS on all tables
- [ ] Create policies for admin access (full CRUD)
- [ ] Create policies for client access (read own data only)
- [ ] Create service role policies for backend operations

## Phase 3: Authentication System

### Supabase Auth Setup
- [ ] Configure Supabase Auth providers
- [ ] Create custom auth hooks in Next.js
- [ ] Implement login/logout functions
- [ ] Create session management utilities
- [ ] Add activity tracking on login

### Admin Authentication
- [ ] Create admin-specific login route
- [ ] Implement admin credential validation
- [ ] Set up admin session management
- [ ] Create admin middleware for protected routes

### Client Authentication
- [ ] Create client login page
- [ ] Implement client registration flow
- [ ] Add password reset functionality
- [ ] Create client middleware for protected routes

## Phase 4: Admin Dashboard

### Dashboard Layout
- [ ] Create admin layout component
- [ ] Build navigation sidebar
- [ ] Implement responsive design
- [ ] Add breadcrumb navigation

### Main Dashboard View
- [ ] Create dashboard home page at `/admin`
- [ ] Build client overview table with:
  - [ ] Search functionality
  - [ ] Filter by status/date
  - [ ] Sort capabilities
  - [ ] Pagination
- [ ] Add recent activity feed component
- [ ] Create quick actions panel

### Client Management Section
- [ ] Create new client form at `/admin/clients/new`
  - [ ] Basic information fields
  - [ ] Property details section
  - [ ] Contact information
  - [ ] Notes/comments field
- [ ] Build client list view at `/admin/clients`
- [ ] Create client detail/edit page at `/admin/clients/[id]`
- [ ] Add delete client functionality with confirmation

### File Upload System
- [ ] Create file upload component with drag-and-drop
- [ ] Implement CSV upload handler
- [ ] Implement XLSX upload handler
- [ ] Add file validation (size, type, structure)
- [ ] Create progress indicator for uploads
- [ ] Build file processing queue system

### HTML Upload Feature
- [ ] Create HTML upload interface
- [ ] Implement HTML file validation
- [ ] Add HTML preview functionality
- [ ] Create client-specific HTML storage

### Folder Creation Logic
- [ ] Implement automatic folder creation function
- [ ] Format: "LastName MM.YY"
- [ ] Target directory: `/Users/garrettsullivan/Desktop/‼️/RE/RealtyONE/MY LISTINGS/`
- [ ] Add error handling for existing folders
- [ ] Create folder structure validation

### MCAO-UI Integration Tile
- [ ] Copy MCAO-UI functionality from PV Splittable
- [ ] Create MCAO tile component in admin dashboard
- [ ] Port Flask routes to Next.js API routes:
  - [ ] `/api/mcao/search-apn`
  - [ ] `/api/mcao/bulk-upload`
  - [ ] `/api/mcao/download`
- [ ] Adapt frontend UI to match existing design
- [ ] Integrate with existing MCAO API

## Phase 5: Client Dashboard

### Client Layout
- [ ] Create client-specific layout
- [ ] Build client navigation
- [ ] Add profile section
- [ ] Implement responsive design

### Dashboard Features
- [ ] Create client home at `/client`
- [ ] Build property details view
- [ ] Add document access section
- [ ] Create market analysis display
- [ ] Implement communication portal
- [ ] Add activity history timeline

## Phase 6: File Processing & Storage

### Excel Template Processing
- [ ] Create template processor service
- [ ] Implement sheet mapping:
  - [ ] **comps**: Column A blank (manual notes), MLS data starts Column B
  - [ ] **Full_API_call**: Column A blank, MLS data starts Column B
  - [ ] **Analysis**: Full data processing
  - [ ] **Calcs**: Calculations sheet
  - [ ] **Maricopa**: Rows 2-24 in Column C, matrix from row 26
  - [ ] **0.5mile**: Half-mile radius comps
  - [ ] **Lot**: All cells light grey background

### Upload Processing Pipeline
- [ ] Create file upload API endpoint
- [ ] Implement file parsing logic
- [ ] Add data validation
- [ ] Create Excel generation service
- [ ] Implement error handling and logging

### File Storage Management
- [ ] Create file storage service
- [ ] Implement versioning system
- [ ] Add file cleanup utilities
- [ ] Create backup mechanism

## Phase 7: APN Integration

### Setup APN Module
- [ ] Copy `apn_lookup.py` to `/tiles/GSrealty-client/APN/`
- [ ] Install Python dependencies:
  ```bash
  pip install pandas requests usaddress openpyxl
  ```
- [ ] Create Python microservice wrapper
- [ ] Add API endpoints for APN lookup

### Integration Points
- [ ] Create APN lookup component in admin
- [ ] Add bulk APN processing
- [ ] Integrate with property creation
- [ ] Add geocoding visualization

## Phase 8: API Development (Django Ninja)

### Client Endpoints
- [ ] `GET /api/clients` - List all clients
- [ ] `GET /api/clients/{id}` - Get client details
- [ ] `POST /api/clients` - Create new client
- [ ] `PUT /api/clients/{id}` - Update client
- [ ] `DELETE /api/clients/{id}` - Delete client

### File Upload Endpoints
- [ ] `POST /api/upload/csv` - Upload CSV file
- [ ] `POST /api/upload/xlsx` - Upload Excel file
- [ ] `POST /api/upload/html` - Upload HTML for client
- [ ] `GET /api/files/{client_id}` - List client files
- [ ] `GET /api/download/{file_id}` - Download file

### MCAO Endpoints
- [ ] `POST /api/mcao/search` - Single APN search
- [ ] `POST /api/mcao/bulk` - Bulk APN processing
- [ ] `GET /api/mcao/download/{id}` - Download results

### APN Endpoints
- [ ] `POST /api/apn/lookup` - Address to APN
- [ ] `POST /api/apn/bulk` - Bulk address lookup
- [ ] `GET /api/apn/verify/{apn}` - Verify APN

### Authentication Endpoints
- [ ] `POST /api/auth/login` - User login
- [ ] `POST /api/auth/logout` - User logout
- [ ] `POST /api/auth/refresh` - Refresh token
- [ ] `GET /api/auth/me` - Current user info

## Phase 9: Testing & Optimization

### Unit Tests
- [ ] Write tests for file processing functions
- [ ] Test data validation logic
- [ ] Test authentication flows
- [ ] Test API endpoints

### Integration Tests
- [ ] Test file upload pipeline
- [ ] Test Supabase operations
- [ ] Test MCAO API integration
- [ ] Test APN lookup functionality

### End-to-End Tests
- [ ] Test complete client creation flow
- [ ] Test file upload and processing
- [ ] Test admin workflows
- [ ] Test client portal access

### Performance Optimization
- [ ] Optimize large file processing
- [ ] Add caching for MCAO queries
- [ ] Implement lazy loading for tables
- [ ] Add pagination for large datasets

### Security Audit
- [ ] Review authentication implementation
- [ ] Audit file upload security
- [ ] Check SQL injection prevention
- [ ] Validate input sanitization
- [ ] Review RLS policies

## Phase 10: Deployment

### Vercel Setup
- [ ] Create Vercel project
- [ ] Connect GitHub repository
- [ ] Configure build settings
- [ ] Set up custom domain (if available)

### Environment Variables
- [ ] Configure production env vars in Vercel
- [ ] Set up production Supabase instance
- [ ] Configure production API keys
- [ ] Set up monitoring tools

### Deployment Steps
- [ ] Deploy frontend to Vercel
- [ ] Deploy Django API (as serverless functions or separate service)
- [ ] Run database migrations
- [ ] Test production endpoints
- [ ] Configure CORS settings

### Post-Deployment
- [ ] Set up error monitoring (Sentry)
- [ ] Configure analytics (if needed)
- [ ] Set up backup schedules
- [ ] Create deployment documentation

## Documentation

### Create Documentation Files
- [ ] `template-fields.md` - Excel template field definitions
- [ ] `API_DOCUMENTATION.md` - API endpoint reference
- [ ] `ADMIN_GUIDE.md` - Admin dashboard user guide
- [ ] `CLIENT_GUIDE.md` - Client portal documentation
- [ ] `DEPLOYMENT_GUIDE.md` - Deployment instructions
- [ ] `TROUBLESHOOTING.md` - Common issues and solutions

### Template Fields Documentation
- [ ] Document all Excel sheet structures
- [ ] Define column mappings
- [ ] Explain data processing rules
- [ ] Provide example files

## Additional Features (Future Enhancement)

### Nice-to-Have Features
- [ ] Email notifications for new uploads
- [ ] Automated report generation
- [ ] Mobile app version
- [ ] Advanced analytics dashboard
- [ ] Integration with other MLS systems
- [ ] Automated property valuation models
- [ ] Client communication chat system
- [ ] Document e-signing integration

## Notes

### Important Paths
- **Client Listings Directory**: (external - user's local listings)
- **MCAO-UI Source**: ~~HISTORICAL~~ Now integrated at `apps/gsrealty-client/lib/mcao/`
- **APN Script Source**: ~~HISTORICAL~~ Now integrated at `apps/gsrealty-client/lib/mcao/arcgis-lookup.ts`
- **Project Location**: `apps/gsrealty-client/`

### Key Requirements
- Supabase table: `GSRealty-client`
- Admin login: Custom credentials
- File naming: `LastName MM.YY` format
- Template processing: Column A manual notes, MLS data from Column B
- Hosting: Vercel deployment

### Dependencies to Install
```bash
# Frontend
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install react-hook-form zod @hookform/resolvers
npm install lucide-react date-fns
npm install xlsx papaparse

# Backend
pip install django django-ninja
pip install pandas openpyxl requests
pip install python-dotenv supabase
pip install usaddress
```

---

**Status**: Ready for implementation
**Last Updated**: October 14, 2025
**Model Switch**: Ready for Sonnet 4.5 execution