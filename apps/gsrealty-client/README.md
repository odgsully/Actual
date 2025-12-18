# GSRealty Client Management System

**A comprehensive client management platform for real estate professionals servicing Maricopa County, Arizona.**

---

## Project Overview

GSRealty is a modern web application designed specifically for realtors to manage client relationships, process MLS comparable sales data, integrate with Maricopa County Assessor's Office (MCAO) property lookups, and organize client files efficiently.

**Business Owner:** Garrett Sullivan
**Market Focus:** Maricopa County, Arizona
**Status:** Architecture & Planning Complete - Ready for Development

---

## Key Features

### For Admin (Realtor)
- ✅ Secure admin dashboard with client management
- ✅ File upload system (CSV, XLSX, HTML)
- ✅ Automated MLS data processing with ExcelJS
- ✅ MCAO property lookup via APN integration
- ✅ Automated client folder creation (`LastName MM.YY` format)
- ✅ Login activity tracking and analytics
- ✅ Template-based Excel file generation

### For Clients (Sellers/Buyers)
- ✅ Secure client dashboard
- ✅ View property portfolios
- ✅ Review comparable sales analysis
- ✅ Access uploaded documents
- ✅ Profile management

---

## Technology Stack

### Frontend
- **Framework:** Next.js 14.2.33 (React 18, TypeScript)
- **Styling:** Tailwind CSS + Radix UI
- **File Processing:** ExcelJS 4.4.0 (secure Excel parsing)
- **State Management:** React Query + Context API

### Backend
- **API:** Next.js API routes (TypeScript)
- **Optional:** Django Ninja REST Framework (Python)
- **Database:** Supabase (PostgreSQL with RLS)
- **File Storage:** Local + Supabase Storage

### Integrations
- **MCAO API:** Maricopa County Assessor property data
- **APN Lookup:** Python-based APN validation
- **PV Splittable MCAO-UI:** Property lookup interface

### Hosting
- **Platform:** Vercel
- **Database:** Supabase Cloud
- **Domain:** TBD (e.g., gsrealty.vercel.app)

---

## Project Structure

```
apps/gsrealty-client/
├── DOCUMENTATION/           # Comprehensive project documentation
│   ├── GSREALTY_PROJECT_REQUIREMENTS.md  # Master requirements ✅
│   ├── TEMPLATE_FIELDS_REFERENCE.md      # Excel template guide ✅
│   └── PROJECT_STRUCTURE.md              # File organization ✅
│
├── app/                     # Next.js App Router
│   ├── admin/               # Admin dashboard routes
│   ├── client/              # Client dashboard routes
│   └── api/                 # API endpoints
│
├── components/              # Reusable UI components
│   ├── admin/               # Admin components
│   ├── client/              # Client components
│   └── shared/              # Shared components
│
├── lib/                     # Core library code
│   ├── supabase/            # Database client
│   ├── database/            # Data access layer
│   ├── processing/          # File processing logic
│   ├── mcao/                # MCAO API integration
│   └── validation/          # Zod schemas
│
├── APN/                     # APN lookup integration
├── templates/               # Excel templates
├── supabase/                # Database migrations
└── tests/                   # Test files
```

**Full structure:** See `PROJECT_STRUCTURE.md` for complete directory tree.

---

## Documentation

### Core Documents

| Document                              | Purpose                                           | Status |
|---------------------------------------|---------------------------------------------------|--------|
| `README.md`                           | Project overview (this file)                      | ✅     |
| `GSREALTY_PROJECT_REQUIREMENTS.md`    | Complete system requirements and specifications   | ✅     |
| `TEMPLATE_FIELDS_REFERENCE.md`        | Excel template field definitions and rules        | ✅     |
| `PROJECT_STRUCTURE.md`                | File organization and architecture                | ✅     |
| `API_DOCUMENTATION.md`                | API endpoint reference                            | 📝 TBD  |
| `DEPLOYMENT_GUIDE.md`                 | Deployment instructions                           | 📝 TBD  |
| `USER_GUIDE_ADMIN.md`                 | Admin user manual                                 | 📝 TBD  |
| `USER_GUIDE_CLIENT.md`                | Client user manual                                | 📝 TBD  |
| `DEVELOPMENT_SETUP.md`                | Local development setup                           | 📝 TBD  |

---

## Current Status

### ✅ Completed
- Database schema created (6 GSRealty tables in Supabase)
- Supabase CLI linked to project
- Next.js 14.2.33 upgraded (security patches)
- ExcelJS 4.4.0 installed (secure alternative to xlsx)
- 0 security vulnerabilities
- Comprehensive documentation (1500+ lines)
- Project architecture defined

### 🚧 In Progress
- Clean up Wabbit RE branding
- Create new GSRealty-branded UI
- Implement authentication system
- Build admin dashboard
- Develop file upload system

### 📝 Planned (Phase 1-9)
See `GSREALTY_PROJECT_REQUIREMENTS.md` Section 13 for complete roadmap.

---

## Quick Start

### Prerequisites
- Node.js 18+ (npm 9+)
- Python 3.11+ (for APN lookup and Django backend)
- Supabase account
- Vercel account (for deployment)
- macOS (for local file storage paths)

### Installation

```bash
# Navigate to project
cd apps/gsrealty-client

# Install dependencies
npm install

# Set up environment variables
cp .env.sample .env.local
# Edit .env.local with your Supabase keys

# Link Supabase CLI
supabase link --project-ref fsaluvvszosucvzaedtj

# Run database migrations
npm run db:migrate

# Start development server
npm run dev

# Open http://localhost:3004
```

### Environment Variables Required

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://fsaluvvszosucvzaedtj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Admin credentials
ADMIN_USERNAME=garrett_admin
ADMIN_PASSWORD_HASH=your_hashed_password

# Local file storage
LOCAL_STORAGE_PATH=/Users/garrettsullivan/Desktop/‼️/RE/RealtyONE/MY LISTINGS/

# MCAO API
MCAO_API_URL=https://mcaoapi.maricopa.gov
MCAO_API_KEY=your_mcao_api_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3004
NODE_ENV=development
```

---

## Development Commands

### Core Commands
```bash
npm run dev              # Start dev server (http://localhost:3004)
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run typecheck        # TypeScript type checking
npm run format           # Format code with Prettier
```

### Testing
```bash
npm test                 # Run Jest unit tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
npm run test:e2e         # Run Playwright E2E tests
```

### Database
```bash
npm run db:migrate       # Push migrations to Supabase
npm run db:reset         # Reset database
npm run db:seed          # Seed demo data
```

### Utilities
```bash
npm run mcao:test        # Test MCAO API integration
npm run excel:test       # Test Excel processing
npm run cleanup          # Clean up old client files
```

---

## Database Schema

### Tables Created (Supabase)
- **gsrealty_users** - User accounts (admin + clients)
- **gsrealty_clients** - Client contact information
- **gsrealty_properties** - Property records
- **gsrealty_comps** - Comparable sales data
- **gsrealty_mcao_data** - MCAO API response data
- **gsrealty_uploaded_files** - File upload metadata
- **gsrealty_login_activity** - Login tracking
- **gsrealty_admin_settings** - Application settings

### Key Relationships
```
gsrealty_users
  └─> gsrealty_clients (user_id)
      ├─> gsrealty_properties (client_id)
      │   ├─> gsrealty_comps (property_id)
      │   └─> gsrealty_mcao_data (property_id)
      └─> gsrealty_uploaded_files (client_id)
```

**Details:** See migration files in `/supabase/migrations/`

---

## Excel Template Processing

### Template: `template.xlsx`

**Sheets:**
1. **comps** - Comparable sales from MLS
2. **Full_API_call** - Complete MCAO API response
3. **Analysis** - Market analysis summary
4. **Calcs** - Backend calculations
5. **Maricopa** - Maricopa County specific data
6. **. 5mile** - Comps within 0.5 mile radius
7. **Lot** - Lot-specific details (all cells light grey)

**Critical Rules:**
- **Column A reserved:** Always blank for manual "Notes"
- **MLS data starts Column B:** All uploads populate from B onwards
- **Maricopa sheet:** Rows 2-24 use B/C format, row 26+ matrix format
- **Data sources:** MLS uploads + MCAO API calls

**Full specifications:** See `TEMPLATE_FIELDS_REFERENCE.md` (700+ lines)

---

## File Upload Workflow

### 1. Admin uploads CSV/XLSX
- Via admin dashboard
- Select client from dropdown
- Choose file type (Direct comps / All scopes / Half mile)

### 2. Backend processes file
- Validate format
- Parse with ExcelJS (secure)
- Extract property data
- Calculate distances
- Validate required fields

### 3. MCAO API integration
- Extract APNs from upload
- Call MCAO API for each property
- Retrieve official county data
- Populate `Full_API_call` and `Maricopa` sheets

### 4. Save to database
- Insert records into `gsrealty_properties`
- Link comparable sales to `gsrealty_comps`
- Store MCAO data in `gsrealty_mcao_data`
- Log upload in `gsrealty_uploaded_files`

### 5. Create local folder
- Format: `LastName MM.YY` (e.g., "Mozingo 10.25")
- Path: `/Users/garrettsullivan/Desktop/‼️/RE/RealtyONE/MY LISTINGS/`
- Save original upload + processed template

### 6. Return success
- Show processing summary
- Display property count
- Link to view properties

---

## MCAO Integration

### APN Lookup
**Source:** `/APN/apn_lookup.py` (copied from external project)

**Usage:**
```typescript
// app/api/admin/mcao/lookup/route.ts
const response = await fetch('/api/admin/mcao/lookup', {
  method: 'POST',
  body: JSON.stringify({ apn: '123-45-678A' })
});
const propertyData = await response.json();
```

### MCAO-UI Integration
**Source:** `/Users/garrettsullivan/Desktop/‼️/RE/Projects/PV Splittable/MCAO-UI`

**Options:**
1. **Port to Next.js** (recommended) - Rebuild in React/TypeScript
2. **Iframe embed** - Embed existing Flask app
3. **External service** - Deploy separately, link from dashboard

**Current:** Flask app with `app.py` - localhost v3 HTML

---

## Security

### Authentication
- Supabase Auth (email + password)
- JWT session tokens
- Role-based access control (admin/client)

### Authorization
- Row Level Security (RLS) in Supabase
- Clients can only access their own data
- Admin has full access
- Middleware route protection

### Data Protection
- HTTPS only in production
- Encrypted environment variables
- Password hashing (bcrypt)
- Input validation (Zod schemas)
- Safe Excel parsing (ExcelJS)

### Security Status
- ✅ 0 npm vulnerabilities
- ✅ Next.js 14.2.33 (latest security patches)
- ✅ ExcelJS (no prototype pollution)
- ✅ Secure authentication flow

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

# Set environment variables in Vercel Dashboard
# Settings → Environment Variables
```

### Environment Variables (Production)
Add in Vercel Dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD_HASH`
- `MCAO_API_KEY`
- `SUPABASE_STORAGE_BUCKET` (for file storage)

### Domain Setup
- **Option A:** Use Vercel subdomain `gsrealty.vercel.app`
- **Option B:** Custom domain (configure in Vercel DNS)

**Guide:** See `DEPLOYMENT_GUIDE.md` (TBD)

---

## API Endpoints

### Admin Endpoints
- `POST /api/admin/auth/signin` - Admin login
- `GET /api/admin/clients` - List clients
- `POST /api/admin/clients` - Create client
- `POST /api/admin/upload/xlsx` - Upload Excel file
- `POST /api/admin/mcao/lookup` - APN lookup
- `GET /api/admin/analytics/logins` - Login reports

### Client Endpoints
- `POST /api/client/auth/signin` - Client login
- `GET /api/client/dashboard` - Dashboard data
- `GET /api/client/properties` - My properties
- `GET /api/client/comps/:propertyId` - Comparable sales
- `GET /api/client/documents` - Document library

**Full reference:** See `API_DOCUMENTATION.md` (TBD)

---

## Testing

### Unit Tests
```bash
npm test
```
- Library functions
- API handlers
- Components
- Coverage target: 80%+

### Integration Tests
```bash
npm run test:integration
```
- File upload workflow
- MCAO API integration
- Client workflow

### E2E Tests
```bash
npm run test:e2e
```
- Admin: Sign in → Add client → Upload file
- Client: Sign in → View properties → View comps
- Tool: Playwright

---

## Troubleshooting

### Build Errors
**Issue:** TypeScript errors in old Wabbit files
**Solution:** Exclude `_scripts_WABBIT_RE_DO_NOT_USE` in `tsconfig.json`

**Issue:** Excel parsing errors
**Solution:** Verify template.xlsx format, check Column A reserved rule

### Database Issues
**Issue:** RLS policies blocking access
**Solution:** Check user role, verify RLS policies in Supabase Studio

**Issue:** Migration fails
**Solution:** Check for encoding issues, run `supabase db push --dry-run`

### MCAO Integration
**Issue:** API returns 401
**Solution:** Verify `MCAO_API_KEY` in environment variables

**Issue:** APN not found
**Solution:** Validate APN format (`###-##-####`), check Maricopa County

---

## Contributing

### Branch Strategy
- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - Feature branches

### Commit Convention
```
feat: Add MCAO lookup integration
fix: Resolve Excel parsing error
docs: Update API documentation
style: Format code with Prettier
test: Add unit tests for file processor
chore: Update dependencies
```

### Pull Request Process
1. Create feature branch
2. Make changes
3. Run tests (`npm test`, `npm run typecheck`, `npm run lint`)
4. Commit with conventional commit message
5. Push and create PR
6. Request review
7. Merge after approval

---

## Roadmap

### Phase 1: Foundation (Week 1-2) - CURRENT
- ✅ Database schema
- ✅ Supabase connection
- ✅ Documentation
- 🚧 Project structure
- 📝 UI mockups

### Phase 2: Authentication (Week 3)
- Admin sign-in
- Client sign-in
- Role-based routing
- Session management

### Phase 3: Admin Dashboard (Week 4-5)
- Client management CRUD
- File upload system
- Basic analytics

### Phase 4: Excel Processing (Week 6-7)
- Template parsing
- MCAO data population
- Local folder creation

### Phase 5: MCAO Integration (Week 8)
- APN lookup
- MCAO-UI integration
- Property enrichment

### Phase 6: Client Dashboard (Week 9-10)
- Property views
- Comps analysis
- Document library

### Phase 7: Testing & Deployment (Week 11-12)
- Comprehensive testing
- Security audit
- Production deployment

### Phase 8: Enhancements (Future)
- Email notifications
- Automated MLS sync
- PDF reports
- Mobile app

**Full roadmap:** See `GSREALTY_PROJECT_REQUIREMENTS.md` Section 13

---

## FAQ

**Q: Why is this separate from Wabbit RE?**
A: GSRealty is a completely different application with a realtor-focused workflow, not a property ranking platform like Wabbit RE.

**Q: Where is template.xlsx located?**
A: TBD - User to provide or we'll create based on specifications in `TEMPLATE_FIELDS_REFERENCE.md`.

**Q: Does this work for properties outside Maricopa County?**
A: Currently no. The MCAO integration is Maricopa County-specific. Could be extended in the future.

**Q: Can I use this with a different MLS provider?**
A: Yes, as long as the CSV/XLSX export follows the column mapping defined in `TEMPLATE_FIELDS_REFERENCE.md`.

**Q: Why ExcelJS instead of xlsx library?**
A: ExcelJS is actively maintained, has no security vulnerabilities (xlsx had high-severity issues), and provides better TypeScript support.

**Q: Will this work on Windows/Linux?**
A: The Next.js app will work anywhere. Local file storage paths are currently macOS-specific. Production uses Supabase Storage (cross-platform).

**Q: How do I add a new admin user?**
A: Currently single admin (Garrett). Multi-admin support can be added by inserting into `gsrealty_users` with role='admin'.

---

## Support

### Documentation
- Check `/DOCUMENTATION/` folder for detailed guides
- Read `GSREALTY_PROJECT_REQUIREMENTS.md` for specifications
- See `TEMPLATE_FIELDS_REFERENCE.md` for Excel template questions

### Issues
- Create GitHub issue
- Include: Steps to reproduce, expected behavior, actual behavior
- Attach screenshots if applicable

### Contact
- **Project Owner:** Garrett Sullivan
- **Business:** Sullivan Real Estate, Maricopa County, AZ

---

## License

**Proprietary** - © 2025 Sullivan Real Estate. All rights reserved.

This software is proprietary and confidential. Unauthorized copying, distribution, or use of this software, via any medium, is strictly prohibited.

---

## Acknowledgments

- **Next.js** - React framework
- **Supabase** - Database and authentication
- **ExcelJS** - Excel file processing
- **Tailwind CSS** - Styling framework
- **Radix UI** - Component library
- **Vercel** - Hosting platform

---

## Project Status Summary

| Component                | Status      | Notes                              |
|--------------------------|-------------|------------------------------------|
| Database Schema          | ✅ Complete  | 6 tables created in Supabase       |
| Documentation            | ✅ Complete  | 1500+ lines of comprehensive docs  |
| Project Structure        | ✅ Complete  | Architecture defined               |
| Next.js Setup            | ✅ Complete  | v14.2.33 with security patches     |
| ExcelJS Integration      | ✅ Complete  | v4.4.0 installed and tested        |
| Security Audit           | ✅ Complete  | 0 vulnerabilities                  |
| Authentication System    | 📝 Pending   | Phase 2                            |
| Admin Dashboard          | 📝 Pending   | Phase 3                            |
| File Upload System       | 📝 Pending   | Phase 3-4                          |
| MCAO Integration         | 📝 Pending   | Phase 5                            |
| Client Dashboard         | 📝 Pending   | Phase 6                            |
| Production Deployment    | 📝 Pending   | Phase 7                            |

---

## Next Steps

1. **Review documentation:** Read all files in `/DOCUMENTATION/`
2. **Provide template.xlsx:** Or confirm we should create from specs
3. **Clarify questions:** Answer questions in Section 20 of requirements doc
4. **Approve architecture:** Confirm project structure and approach
5. **Begin Phase 1:** Start implementation

**Ready to proceed when you are!** 🚀

---

**Project:** GSRealty Client Management System
**Version:** 1.0.0 (Documentation Phase)
**Last Updated:** October 15, 2025
**Status:** Architecture Complete - Ready for Development

---

For detailed information, see:
- **Master Requirements:** `/DOCUMENTATION/GSREALTY_PROJECT_REQUIREMENTS.md`
- **Template Reference:** `/DOCUMENTATION/TEMPLATE_FIELDS_REFERENCE.md`
- **Project Structure:** `/DOCUMENTATION/PROJECT_STRUCTURE.md`
