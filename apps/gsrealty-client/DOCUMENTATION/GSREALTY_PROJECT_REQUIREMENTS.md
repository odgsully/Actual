# GSRealty Client Management System - Requirements Document

**Project Owner:** Garrett Sullivan
**Business:** Sullivan Real Estate, Maricopa County, Arizona
**Created:** October 15, 2025
**Status:** Architecture & Planning Phase

---

## Executive Summary

A comprehensive client management system for a realtor servicing Maricopa County, Arizona. The system provides separate dashboards for **Admin (Realtor)** and **Clients (Sellers/Buyers)** with intelligent file processing, property data management, and integration with Maricopa County Assessor's Office (MCAO) property lookup.

**Core Purpose:**
- Manage seller/buyer client relationships
- Process and organize MLS comparable sales data
- Integrate MCAO property lookups via APN
- Automate client folder creation and file organization
- Provide clean, professional client-facing dashboard

---

## 1. System Architecture

### Technology Stack

**Frontend:**
- Next.js 14.2.33 (React 18, TypeScript)
- Tailwind CSS for styling
- Radix UI for components
- ExcelJS 4.4.0 for Excel file processing (secure alternative to xlsx)

**Backend:**
- Django Ninja REST Framework (Python)
- TypeScript API routes (Next.js)
- Python scripts for data processing

**Database:**
- Supabase (PostgreSQL with Row Level Security)
- Tables: `gsrealty_users`, `gsrealty_clients`, `gsrealty_properties`, etc.

**Hosting:**
- Vercel (frontend + API routes)
- Python scripts via serverless functions or external service

**External Integrations:**
- MCAO API (Maricopa County Assessor's Office)
- APN Lookup System
- PV Splittable MCAO-UI integration

---

## 2. User Roles & Access

### 2.1 Admin (Realtor) Dashboard

**User:** Garrett Sullivan
**Credentials:** Secured admin username/password (stored in gsrealty_users with role='admin')

**Access:** Full system access including:
- Client management (CRUD operations)
- File uploads and processing
- MLS data import
- MCAO property lookups
- Client folder management
- HTML upload for custom client pages
- Analytics and login tracking

### 2.2 Client Dashboard

**Users:** Individual sellers/buyers
**Credentials:** Email + password (stored in gsrealty_users with role='client')

**Access:** Limited to:
- View their own property data
- View comparable sales analysis
- View uploaded documents
- Basic profile management
- No access to other clients' data

---

## 3. Core Features & Functionality

### 3.1 Authentication System

**Requirements:**
- Simple sign-in flow (email + password)
- Supabase authentication integration
- Role-based access control (admin vs client)
- Session management
- Password reset functionality
- Login activity tracking (gsrealty_login_activity table)

**Implementation:**
- Sign-in page at `/signin`
- Redirect admin to `/admin/dashboard`
- Redirect clients to `/client/dashboard`
- Track login frequency and last login time

---

### 3.2 Admin Dashboard Features

#### 3.2.1 Client Management

**View All Clients:**
- Table/grid view of all clients
- Search and filter functionality
- Client status indicators
- Quick actions (edit, delete, view details)

**Add New Client:**
- Form with fields:
  - First Name (required)
  - Last Name (required)
  - Phone
  - Email
  - Property Address (subject property)
  - Client Address (their address)
  - Notes (text area)
- Auto-creates client folder on save
- Option to upload files during creation

**Edit Client:**
- Update any client information
- View upload history
- View login activity
- Delete client (with confirmation)

#### 3.2.2 File Upload System

**Upload Types Supported:**
1. **HTML Files** - Custom client pages
2. **CSV Files** - MLS comparable sales data
3. **XLSX Files** - MLS comparable sales data (Excel format)

**Upload Workflows:**

**A. Quick Upload (from Client View)**
- Button: "Upload HTML"
- Select client from dropdown
- Choose file
- Auto-saves to client folder

**B. Form-Based Upload (New Client)**
- Integrated with "Add New Client" form
- Upload buttons for:
  - CSV upload (MLS comps - direct comparison)
  - XLSX upload (MLS comps - all scopes)
  - XLSX upload (MLS comps - half mile radius)
- Files processed and saved during client creation

#### 3.2.3 File Processing & Organization

**Automated Processing:**

When CSV/XLSX uploaded:
1. **Validate file format** (check headers match template)
2. **Parse data** using ExcelJS (secure parsing)
3. **Extract property data:**
   - Address
   - APN (Assessor Parcel Number)
   - Sale price
   - Sale date
   - Property details (beds, baths, sqft, lot size)
4. **Save to database** (gsrealty_properties table linked to client)
5. **Create local folder** with naming convention: `[LastName] [MM.YY]`
6. **Save files** to `/Users/garrettsullivan/Desktop/‼️/RE/RealtyONE/MY LISTINGS/[folder]/`

**File Storage Structure:**
```
/Users/garrettsullivan/Desktop/‼️/RE/RealtyONE/MY LISTINGS/
├── Mozingo 10.25/
│   ├── original_upload.xlsx
│   ├── processed_data.json
│   ├── client_page.html
│   └── images/
├── Smith 11.25/
│   └── ...
```

#### 3.2.4 MCAO Integration Tile

**Feature:** Embedded MCAO-UI from PV Splittable project

**Source Location:**
`/Users/garrettsullivan/Desktop/‼️/RE/Projects/PV Splittable/MCAO-UI`

**Implementation:**
- Tile/card in admin dashboard
- Button: "Launch MCAO Property Lookup"
- Opens iframe or new window with MCAO-UI
- Current localhost configuration: `app.py` (Python Flask)
- Integration approach:
  - Option A: Embed as iframe in dashboard
  - Option B: Launch in new tab with shared session
  - Option C: Rebuild MCAO-UI components directly in Next.js

**Functionality (from MCAO-UI):**
- APN-based property lookup
- Maricopa County Assessor data retrieval
- Property details, tax information, ownership history

#### 3.2.5 APN Lookup Tool

**Source Script (HISTORICAL - now integrated):**
~~Originally from external BHRF directory~~ - Now implemented in project via:
- `lib/mcao/arcgis-lookup.ts` - ArcGIS-based lookup
- `lib/mcao/batch-apn-lookup.ts` - Batch processing
- `scripts/bulk_apn_lookup.py` - Python bulk processor

**Integration (COMPLETE):**
- Implemented at `/apps/gsrealty-client/lib/mcao/`
- Create API endpoint: `/api/admin/apn-lookup`
- Accept APN as input
- Return property data from MCAO
- Display results in admin dashboard

**Usage:**
- Quick lookup from admin dashboard
- Auto-populate property details when APN entered
- Link APN to client properties

---

### 3.3 Client Dashboard Features

#### 3.3.1 Dashboard Overview

**Landing Page:**
- Welcome message with client name
- Summary cards:
  - Number of properties in portfolio
  - Recent activity
  - Upcoming appointments (future feature)
- Quick links to sections

#### 3.3.2 Property Portfolio

**View Properties:**
- Grid or list view
- Each property card shows:
  - Address
  - Property image (if available)
  - Key details (beds, baths, sqft)
  - Status
- Click to view detailed page

#### 3.3.3 Comparable Sales Analysis

**View Comps:**
- Table view of comparable sales
- Sortable columns
- Filter by date, price range, distance
- Export to PDF (future feature)

#### 3.3.4 Document Library

**Uploaded Documents:**
- List of all files admin has uploaded for this client
- Download links
- Document types: HTML, PDF, Excel, CSV

---

## 4. Excel Template Processing

### 4.1 Template Structure

**Template File:** `template.xlsx`

**Sheets:**
1. `comps` - Comparable sales data
2. `Full_API_call` - MCAO API response data
3. `Analysis` - Analysis and calculations
4. `Calcs` - Calculation formulas
5. `Maricopa` - Maricopa County specific data
6. `.5mile` - Half-mile radius comps
7. `Lot` - Lot-specific details

### 4.2 Sheet-Specific Processing Rules

#### Sheet: `comps`

**Column A Handling:**
- Column A is RESERVED for manual "Notes"
- MLS uploads will NOT include "Notes" header
- All MLS data starts in **Column B**
- Column A always remains blank for manual entry

**Data Population:**
- Headers starting in B1: Address, Price, Beds, Baths, etc.
- Data rows starting in B2
- Format: Standard MLS export format

#### Sheet: `Full_API_call`

**Column A Handling:**
- Same as `comps` - Column A reserved for "Notes"
- MLS uploads start in Column B

**Data Source:**
- Raw API response from MCAO
- JSON data flattened into columns
- Full property details from assessor

#### Sheet: `Analysis`

**Purpose:** Summary analysis and insights

**Data Population:**
- Auto-calculated fields based on comps
- Price per sqft analysis
- Market trends
- Comparable property scores

#### Sheet: `Calcs`

**Purpose:** Backend calculations and formulas

**Implementation:**
- Excel formulas preserved
- Calculations reference other sheets
- Used for derived metrics

#### Sheet: `Maricopa`

**Data Population Rules:**

**Rows 2-24:**
- Column B: Field labels
- Column C: Populate data corresponding to row label in B

Example:
```
Row 2:
  B2: "APN"
  C2: "123-45-678A" (populated from MCAO)
Row 3:
  B3: "Owner Name"
  C3: "John Smith" (populated from MCAO)
```

**Matrix starting Row 26:**
- Row 26+: Multi-column matrix
- Column C and D populated accordingly
- Data sourced from MCAO API call results

**Data Source:**
- 100% from MCAO API calls
- Maricopa County Assessor's Office official data

#### Sheet: `.5mile`

**Purpose:** Comparable sales within 0.5 mile radius

**Data Population:**
- Filter comps by distance
- Distance calculated from subject property
- Same column structure as `comps` sheet

#### Sheet: `Lot`

**Special Formatting:**
- ALL cells: Light grey background (`#F2F2F2` or similar)
- Entire sheet has uniform styling
- Contains lot-specific details:
  - Lot size
  - Zoning
  - Lot dimensions
  - Easements
  - Restrictions

---

## 5. Database Schema

### 5.1 Existing Tables (Created)

**Tables:**
- `gsrealty_users` - User accounts (admin + clients)
- `gsrealty_clients` - Client information
- `gsrealty_properties` - Property records
- `gsrealty_login_activity` - Login tracking
- `gsrealty_uploaded_files` - File upload metadata
- `gsrealty_admin_settings` - Application settings

### 5.2 Additional Tables Needed

**Table: `gsrealty_comps`**
```sql
CREATE TABLE gsrealty_comps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES gsrealty_properties(id) ON DELETE CASCADE,
  comp_address TEXT NOT NULL,
  sale_price DECIMAL(12,2),
  sale_date DATE,
  beds INTEGER,
  baths DECIMAL(3,1),
  sqft INTEGER,
  lot_size INTEGER,
  distance_miles DECIMAL(4,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Table: `gsrealty_mcao_data`**
```sql
CREATE TABLE gsrealty_mcao_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES gsrealty_properties(id),
  apn TEXT UNIQUE NOT NULL,
  owner_name TEXT,
  legal_description TEXT,
  tax_amount DECIMAL(10,2),
  assessed_value DECIMAL(12,2),
  api_response JSONB,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6. API Endpoints

### 6.1 Admin API Routes

**Authentication:**
- `POST /api/admin/auth/signin` - Admin login
- `POST /api/admin/auth/signout` - Admin logout
- `GET /api/admin/auth/session` - Check admin session

**Client Management:**
- `GET /api/admin/clients` - List all clients
- `GET /api/admin/clients/:id` - Get client details
- `POST /api/admin/clients` - Create new client
- `PUT /api/admin/clients/:id` - Update client
- `DELETE /api/admin/clients/:id` - Delete client

**File Upload:**
- `POST /api/admin/upload/html` - Upload HTML file
- `POST /api/admin/upload/csv` - Upload CSV MLS data
- `POST /api/admin/upload/xlsx` - Upload Excel MLS data
- `GET /api/admin/files/:clientId` - List client files

**Property Data:**
- `GET /api/admin/properties/:clientId` - Get client properties
- `POST /api/admin/properties/process` - Process uploaded property data

**MCAO Integration:**
- `POST /api/admin/mcao/lookup` - APN lookup
- `GET /api/admin/mcao/property/:apn` - Get MCAO property data

**Analytics:**
- `GET /api/admin/analytics/logins` - Login activity report
- `GET /api/admin/analytics/clients` - Client statistics

### 6.2 Client API Routes

**Authentication:**
- `POST /api/client/auth/signin` - Client login
- `POST /api/client/auth/signout` - Client logout
- `GET /api/client/auth/session` - Check client session

**Dashboard:**
- `GET /api/client/dashboard` - Get dashboard data
- `GET /api/client/properties` - Get my properties
- `GET /api/client/comps/:propertyId` - Get comparable sales
- `GET /api/client/documents` - Get uploaded documents

---

## 7. File Processing Backend

### 7.1 TypeScript Processing

**Location:** `/apps/gsrealty-client/lib/processing/`

**Files:**
- `excel-processor.ts` - ExcelJS processing logic
- `csv-processor.ts` - CSV parsing
- `file-validator.ts` - File validation
- `folder-creator.ts` - Local folder creation

**Key Functions:**

```typescript
// excel-processor.ts
async function processMLSUpload(
  file: File,
  clientId: string,
  uploadType: 'direct' | 'all-scopes' | 'half-mile'
): Promise<ProcessingResult>

// folder-creator.ts
async function createClientFolder(
  lastName: string,
  month: string,
  year: string
): Promise<string> // Returns: "Mozingo 10.25"
```

### 7.2 Django Ninja REST API

**Purpose:** Heavy data processing and external API calls

**Location:** `/apps/gsrealty-client/backend/` (new Django project)

**Structure:**
```
backend/
├── manage.py
├── gsrealty/
│   ├── settings.py
│   ├── urls.py
│   └── api/
│       ├── admin_api.py
│       ├── client_api.py
│       ├── mcao_api.py
│       └── processing.py
├── services/
│   ├── mcao_client.py
│   ├── apn_lookup.py
│   └── file_processor.py
└── requirements.txt
```

**Key Endpoints (Django Ninja):**

```python
# admin_api.py
@api.post("/admin/process-mls")
async def process_mls_upload(request, file: UploadedFile, client_id: str):
    # Process Excel/CSV
    # Extract property data
    # Save to database
    # Create local folder
    # Return processing results

@api.post("/admin/mcao-lookup")
async def mcao_lookup(request, apn: str):
    # Call MCAO API
    # Parse response
    # Save to database
    # Return property data
```

---

## 8. Frontend Pages & Routes

### 8.1 Public Routes

- `/` - Landing page (GSRealty branding, sign-in options)
- `/signin` - Sign-in page (detects admin vs client)
- `/signup/client` - Client registration (by invite only?)

### 8.2 Admin Routes (Protected)

- `/admin/dashboard` - Admin overview
- `/admin/clients` - Client list/management
- `/admin/clients/new` - Add new client form
- `/admin/clients/:id` - Client details page
- `/admin/clients/:id/edit` - Edit client
- `/admin/upload` - File upload page
- `/admin/mcao` - MCAO lookup tool
- `/admin/analytics` - Reports and analytics
- `/admin/settings` - Admin settings

### 8.3 Client Routes (Protected)

- `/client/dashboard` - Client dashboard
- `/client/properties` - My properties
- `/client/properties/:id` - Property details
- `/client/comps/:propertyId` - Comparable sales
- `/client/documents` - Document library
- `/client/profile` - Profile settings

---

## 9. Integration Requirements

### 9.1 MCAO-UI Integration

**Source:** `/Users/garrettsullivan/Desktop/‼️/RE/Projects/PV Splittable/MCAO-UI`

**Current Tech:** Python Flask (`app.py`)

**Integration Options:**

**Option A: Iframe Embed**
```tsx
// apps/gsrealty-client/app/admin/dashboard/page.tsx
<div className="mcao-tile">
  <h3>MCAO Property Lookup</h3>
  <button onClick={() => setShowMCAO(true)}>Launch MCAO</button>
  {showMCAO && (
    <iframe
      src="http://localhost:5000"
      width="100%"
      height="800px"
    />
  )}
</div>
```

**Option B: Port to Next.js**
- Convert Flask routes to Next.js API routes
- Rebuild UI in React/Next.js
- Better integration, more maintainable

**Option C: External Service**
- Deploy MCAO-UI separately
- API communication between services
- Keep original Flask app

**Recommended:** Option B (Port to Next.js) for better integration

### 9.2 APN Lookup Integration

**Status:** ✅ COMPLETE - Now using ArcGIS-based lookup

**Current Implementation:**
- `lib/mcao/arcgis-lookup.ts` - Primary ArcGIS lookup
- `app/api/admin/mcao/arcgis-lookup/route.ts` - API endpoint

**Original Integration Steps (HISTORICAL):**
1. ~~Copy apn_lookup.py~~ - Replaced with TypeScript implementation
2. Review Python dependencies
3. Create Next.js API route wrapper:
```typescript
// app/api/admin/apn-lookup/route.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(req: Request) {
  const { apn } = await req.json();

  const { stdout } = await execAsync(
    `python3 APN/apn_lookup.py ${apn}`
  );

  const propertyData = JSON.parse(stdout);
  return Response.json(propertyData);
}
```
4. Or port Python logic to TypeScript for better performance

---

## 10. UI/UX Design Requirements

### 10.1 Branding

**Name:** GSRealty Client Management System
**Primary Colors:**
- Professional blue: #1e40af
- Accent green: #059669
- Neutral gray: #64748b

**Typography:**
- Headers: Inter (bold)
- Body: Inter (regular)

**Logo:** [To be designed or provided]

### 10.2 Admin Dashboard Layout

**Navigation:**
- Sidebar with sections:
  - Dashboard
  - Clients
  - Upload Files
  - MCAO Lookup
  - Analytics
  - Settings

**Dashboard Tiles:**
- Total clients count
- Recent uploads
- Login activity summary
- MCAO quick lookup
- Quick actions (Add Client, Upload File)

### 10.3 Client Dashboard Layout

**Navigation:**
- Top navigation bar
- Sections:
  - Dashboard
  - My Properties
  - Documents
  - Profile

**Dashboard Cards:**
- Property summary
- Recent documents
- Market insights (future)
- Contact realtor button

---

## 11. Security Considerations

### 11.1 Authentication

- Secure password hashing (Supabase handles this)
- Session management with JWT
- CSRF protection
- Rate limiting on login attempts

### 11.2 Authorization

- Row Level Security (RLS) in Supabase
- Clients can only access their own data
- Admin has full access
- Middleware to protect routes

### 11.3 File Upload Security

- File type validation (whitelist: .xlsx, .csv, .html, .pdf)
- File size limits (10MB max)
- Virus scanning (future feature)
- Sanitize filenames
- Store files in secure location
- Use ExcelJS for safe Excel parsing (no prototype pollution)

### 11.4 Data Privacy

- Encrypt sensitive data at rest
- HTTPS only in production
- Secure API keys in environment variables
- Audit logging for admin actions

---

## 12. Deployment Strategy

### 12.1 Hosting

**Frontend (Next.js):**
- Deploy to Vercel
- Environment variables configured
- Custom domain: `gsrealty.vercel.app` or custom domain

**Backend (Django - if used):**
- Option A: Vercel serverless functions (limited Python support)
- Option B: Heroku/Railway for Django backend
- Option C: AWS Lambda for Python scripts

**Database:**
- Supabase (already configured)
- Connection string in environment variables

### 12.2 File Storage

**Local Development:**
- Save to `/Users/garrettsullivan/Desktop/‼️/RE/RealtyONE/MY LISTINGS/`

**Production:**
- Option A: Supabase Storage buckets
- Option B: AWS S3
- Option C: Vercel Blob storage
- Sync to local machine via script/API

### 12.3 Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://fsaluvvszosucvzaedtj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Admin credentials
ADMIN_USERNAME=garrett_admin
ADMIN_PASSWORD_HASH=hashed_password

# File storage
LOCAL_STORAGE_PATH=/Users/garrettsullivan/Desktop/‼️/RE/RealtyONE/MY LISTINGS/

# MCAO API
MCAO_API_KEY=your_mcao_key
MCAO_API_URL=https://mcaoapi.maricopa.gov

# Django backend (if separate)
DJANGO_API_URL=https://your-django-backend.herokuapp.com
```

---

## 13. Development Roadmap

### Phase 1: Foundation (Week 1-2)
- ✅ Database schema created (gsrealty tables)
- ✅ Supabase connection established
- ✅ Next.js 14.2.33 with ExcelJS installed
- 🔨 Create project documentation (this file)
- 🔨 Design UI mockups
- 🔨 Set up project structure

### Phase 2: Authentication (Week 3)
- Implement admin sign-in
- Implement client sign-in
- Role-based routing
- Session management
- Login activity tracking

### Phase 3: Admin Dashboard (Week 4-5)
- Client list view
- Add/edit/delete clients
- Client details page
- Basic analytics dashboard
- Admin settings page

### Phase 4: File Upload System (Week 6-7)
- HTML upload functionality
- CSV upload and parsing
- Excel upload with ExcelJS
- File validation
- Processing backend
- Local folder creation
- Database storage

### Phase 5: Excel Template Processing (Week 8-9)
- Template.xlsx parsing
- Sheet-specific logic (comps, Maricopa, etc.)
- Column A handling (Notes)
- MCAO data population
- Formula preservation
- Export processed files

### Phase 6: MCAO Integration (Week 10)
- Copy and integrate MCAO-UI
- Implement APN lookup
- MCAO API integration
- Property data enrichment
- Admin dashboard tile

### Phase 7: Client Dashboard (Week 11-12)
- Client dashboard UI
- Property list view
- Comparable sales view
- Document library
- Profile management

### Phase 8: Testing & Deployment (Week 13-14)
- Unit testing
- Integration testing
- Security audit
- Performance optimization
- Deploy to Vercel
- Production environment setup
- Documentation finalization

### Phase 9: Enhancements (Future)
- Email notifications
- Automated MLS data sync
- Market reports generation
- Mobile app
- AI-powered property insights

---

## 14. Technical Specifications

### 14.1 Dependencies

**Package.json (additions needed):**
```json
{
  "dependencies": {
    "exceljs": "^4.4.0",
    "papaparse": "^5.4.1",
    "date-fns": "^2.30.0",
    "react-dropzone": "^14.2.3",
    "recharts": "^2.10.3"
  },
  "devDependencies": {
    "@types/papaparse": "^5.3.14",
    "@types/node": "^20.10.0"
  }
}
```

**Python Requirements (if Django backend):**
```
Django==5.0
django-ninja==1.0.1
python-dotenv==1.0.0
openpyxl==3.1.2
pandas==2.1.4
requests==2.31.0
psycopg2-binary==2.9.9
gunicorn==21.2.0
```

### 14.2 System Requirements

**Development:**
- Node.js 18+ (npm 9+)
- Python 3.11+ (if using Django)
- macOS (local file storage)
- Supabase account
- Vercel account

**Production:**
- Vercel hosting
- Supabase database
- Custom domain (optional)
- MCAO API access

---

## 15. Documentation Artifacts

### 15.1 Required Documentation

1. **This file:** `GSREALTY_PROJECT_REQUIREMENTS.md` - Master requirements
2. `TEMPLATE_FIELDS_REFERENCE.md` - Excel template field definitions
3. `API_DOCUMENTATION.md` - API endpoint reference
4. `DEPLOYMENT_GUIDE.md` - Deployment instructions
5. `USER_GUIDE_ADMIN.md` - Admin user manual
6. `USER_GUIDE_CLIENT.md` - Client user manual
7. `DEVELOPMENT_SETUP.md` - Local development setup

### 15.2 Code Documentation

- TypeScript interfaces for all data models
- JSDoc comments for functions
- README in each major directory
- Inline comments for complex logic

---

## 16. Success Criteria

### Must-Have Features (MVP)
- ✅ Admin can sign in securely
- ✅ Admin can add/edit/delete clients
- ✅ Admin can upload CSV/XLSX files
- ✅ System processes MLS data correctly
- ✅ Local folders created automatically
- ✅ Client can sign in and view their data
- ✅ MCAO property lookup functional
- ✅ Template.xlsx processing works correctly
- ✅ Secure and fast

### Nice-to-Have Features (Post-MVP)
- Email notifications
- Automated MLS sync
- PDF report generation
- Mobile responsive design
- Analytics dashboards
- Bulk operations
- Export functionality
- API for third-party integrations

---

## 17. Constraints & Assumptions

### Constraints
- Local file storage path: `/Users/garrettsullivan/Desktop/‼️/RE/RealtyONE/MY LISTINGS/`
- Maricopa County, Arizona only
- Single admin user (Garrett)
- MLS data format specific to source
- Template.xlsx structure fixed

### Assumptions
- MLS CSV/XLSX exports follow consistent format
- MCAO API is accessible and reliable
- Clients have basic computer literacy
- Internet connection available
- Template.xlsx will not change frequently

---

## 18. Risk Mitigation

### Technical Risks
- **Risk:** Excel parsing errors
  **Mitigation:** Use ExcelJS (secure), extensive testing, error handling

- **Risk:** MCAO API changes
  **Mitigation:** Version API calls, monitor for changes, fallback handling

- **Risk:** File storage limits
  **Mitigation:** Regular cleanup scripts, archive old clients, compression

### Business Risks
- **Risk:** Client data privacy breach
  **Mitigation:** RLS policies, encryption, security audit, compliance

- **Risk:** System downtime
  **Mitigation:** Vercel 99.9% uptime, monitoring, quick rollback capability

---

## 19. Compliance & Legal

### Data Privacy
- Client data is confidential
- Comply with Real Estate data handling regulations
- No sharing of client data with third parties
- Secure storage and transmission

### Disclaimers
- Property data from MCAO is for informational purposes
- Not a substitute for professional appraisal
- Market analysis is automated, requires human review

---

## 20. Questions & Clarifications Needed

1. **Template.xlsx Location:** Where is the template.xlsx file located?
2. **MLS Data Format:** Can you provide a sample MLS CSV/XLSX export?
3. **MCAO API Access:** Do you have API keys for Maricopa County Assessor?
4. **Client Invitations:** How should clients be invited? Email? Manual creation?
5. **Branding:** Do you have a logo or specific color scheme for GSRealty?
6. **Custom Domains:** Will you use a custom domain like `gsrealty.com`?
7. **Backup Strategy:** How often should client data be backed up?
8. **Retention Policy:** How long should old client data be kept?

---

## Document Status

**Version:** 1.0
**Status:** Draft - Awaiting Approval
**Next Steps:**
1. Review and approve requirements
2. Answer clarification questions
3. Create UI mockups
4. Begin Phase 1 development

**Approved By:** ________________
**Date:** ________________

---

## Appendix

### A. Glossary

- **APN:** Assessor Parcel Number - Unique property identifier
- **MCAO:** Maricopa County Assessor's Office
- **MLS:** Multiple Listing Service - Real estate database
- **Comps:** Comparable sales - Similar properties for price comparison
- **RLS:** Row Level Security - Database access control
- **ExcelJS:** JavaScript library for Excel file processing

### B. References

- Supabase Documentation: https://supabase.com/docs
- Next.js Documentation: https://nextjs.org/docs
- Django Ninja: https://django-ninja.rest-framework.com/
- ExcelJS: https://github.com/exceljs/exceljs
- MCAO Website: https://mcassessor.maricopa.gov/

---

**END OF REQUIREMENTS DOCUMENT**
