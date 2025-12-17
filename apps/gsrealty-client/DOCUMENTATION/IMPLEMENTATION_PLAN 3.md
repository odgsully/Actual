# GSRealty Implementation Plan - Detailed Steps

**Project:** GSRealty Client Management System
**Created:** October 15, 2025
**Last Updated:** October 15, 2025 - Conservative Subagent Approach Approved
**Status:** ✅ IN PROGRESS - Week 1, Day 1 Complete
**Estimated Timeline:** 10 weeks (conservative subagent approach)

---

## 🤖 Execution Strategy: Conservative Subagent Approach

**Approved Approach:** Hybrid execution with selective parallelization

### How This Works

**Primary Agent (Main):** Handles most work sequentially (Weeks 1-2, 4-5, 10)

**Specialized Subagents:** Used ONLY for 3 proven-safe parallel phases:
- **Week 3** (File System): 3 agents work simultaneously
- **Week 6-7** (Portal + Email): 2 agents work simultaneously
- **Week 8-9** (Testing): 3 agents work simultaneously

### Timeline Comparison

| Approach | Timeline | Risk | Coordination |
|----------|----------|------|--------------|
| Original Sequential | 12 weeks | None | None |
| **Conservative (Active)** | **10 weeks** | **Very Low** | **Minimal** |
| Aggressive Parallel | 8-9 weeks | Low-Medium | High |

### When Subagents Launch

```
Week 1-2:  ████ Main Agent Only (Foundation + Client CRUD)
Week 3:    ██ 3 Subagents (File Processing) 🤖🤖🤖
Week 4:    ████ Main Agent Only (Integration)
Week 5:    ████ Main Agent Only (MCAO)
Week 6-7:  ██ 2 Subagents (Portal + Email) 🤖🤖
Week 8-9:  █ 3 Subagents (Testing) 🤖🤖🤖
Week 10:   ████ Main Agent Only (Deployment)
```

**Total Speedup:** 2 weeks saved vs sequential (17% faster)
**Risk Level:** Very Low (only 3 parallel phases, clear file ownership)

### Documentation References

- **This File:** Detailed task breakdown (what to build)
- **SUBAGENT_PARALLELIZATION_STRATEGY.md:** Full parallelization analysis
- **When to consult:** Use this file for task details, check parallelization doc for agent coordination

---

## 📊 Progress Tracker

### Week 1: Foundation & Auth (Current)
- ✅ Day 1: Branding & Landing Page (COMPLETED)
  - ✅ Remove Wabbit branding
  - ✅ Create branding constants
  - ✅ Update Tailwind config
  - ✅ Copy logo1.png
  - ✅ Create GSRealty landing page
  - ✅ Test build
- ⏳ Day 2-4: Authentication System (NEXT)
- ⏸️ Day 5: Admin Dashboard Shell

### Week 2: Client Management
- ⏸️ Day 1-2: Client List & CRUD
- ⏸️ Day 3: Add/Edit Forms
- ⏸️ Day 4-5: Client Details & Edit

### Week 3: File Upload (🤖 3 Subagents)
- ⏸️ Day 1-5: Parallel work by 3 agents

### Week 4-10: Remaining Phases
- ⏸️ To be started

**Legend:** ✅ Complete | ⏳ In Progress | ⏸️ Not Started | 🤖 Subagent Phase

---

## ⚠️ Critical Context

### Project Relationship Clarification

**GSRealty is SEPARATE from Wabbit RE:**
- ✅ **GS Realty**: Admin tool for Garrett Sullivan's real estate business
- ✅ **Access Point**: Button/link from GS Site (Garrett's personal website)
- ✅ **NOT** part of Wabbit RE property ranking platform
- ✅ **Tied to**: `apps/gs-site` more than `apps/wabbit-re`

**Architecture:**
```
apps/gs-site (Garrett's Personal Site)
  └─> Button: "Client Management"
       └─> Opens: apps/gsrealty-client (This App)
            ├─> Admin Dashboard (Garrett only)
            └─> Client Dashboards (Invited clients)
```

**Separate Apps in Monorepo:**
- `apps/wabbit` - Property ranking platform (Wab bit RE)
- `apps/wabbit-re` - Wabbit RE variant
- `apps/gs-site` - Garrett's personal/business site ⭐
- `apps/gsrealty-client` - **THIS APP** - Client management ⭐

---

## Resources Available

### ✅ Already Complete
- Database schema (6 tables created in Supabase)
- Supabase CLI linked
- Next.js 14.2.33 with ExcelJS 4.4.0
- 0 security vulnerabilities
- 4,000+ lines of documentation
- Template file (`gsrealty-client-template.xlsx`)
- Sample MLS data (3 CSV files)
- Logo (`logo1.png`)
- MCAO API key configured

### 📋 Configuration Details
- **MCAO API Key:** `cc6f7947-2054-479b-ae49-f3fa1c57f3d8`
- **Template Path:** `/apps/gsrealty-client/gsrealty-client-template.xlsx`
- **Sample Data:** `/apps/gsrealty-client/mcao-upload-temp/`
- **Logo:** `/apps/gsrealty-client/logo1.png` (1000x1000 PNG)
- **Branding:** Black & white with red accents, clean modern design

---

## Implementation Approach

**Chosen Strategy:** Option A - Full Rebuild (Clean GSRealty-branded UI)

**Why:**
- Complete separation from Wabbit RE
- Clean, professional realtor-focused interface
- No legacy code complications
- Easier to maintain long-term

**Trade-offs:**
- Longer initial development (12-14 weeks)
- More upfront work
- But: Better quality, cleaner codebase

---

## Phase 1: Foundation & Setup (Week 1)

### Week 1, Day 1-2: Project Cleanup & Branding

**Tasks:**

1. **Remove Wabbit RE Branding**
   ```bash
   # Files to update:
   - app/layout.tsx (change title, meta tags)
   - app/page.tsx (replace entire landing page)
   - Remove Wabbit logo references
   - Update favicon
   ```

   **Steps:**
   - Read `app/layout.tsx`
   - Replace title: "Wabbit" → "GS Realty Client Management"
   - Update metadata description
   - Change favicon to GS logo
   - Read `app/page.tsx`
   - Replace entire homepage with GS Realty landing
   - Add logo1.png to top right
   - Create sign-in CTA

2. **Configure Branding Constants**
   ```typescript
   // lib/constants/branding.ts
   export const BRAND = {
     name: 'GS Realty',
     fullName: 'GS Realty Client Management',
     tagline: 'Professional Client & Property Management',
     colors: {
       primary: '#000000',    // Black
       secondary: '#FFFFFF',  // White
       accent: '#DC2626',     // Red (Tailwind red-600)
       background: '#F9FAFB', // Light gray
       text: '#111827'        // Dark gray
     },
     logo: '/logo1.png'
   };
   ```

3. **Update Tailwind Config**
   ```javascript
   // tailwind.config.js
   theme: {
     extend: {
       colors: {
         brand: {
           black: '#000000',
           white: '#FFFFFF',
           red: '#DC2626',
           'gray-light': '#F9FAFB',
           'gray-dark': '#111827'
         }
       }
     }
   }
   ```

4. **Create GSRealty Landing Page**
   - Simple, professional design
   - Sign in button (admin/client)
   - Logo top right
   - Black/white/red color scheme
   - Link back to GS Site (if accessed directly)

### Week 1, Day 3-4: Authentication System

**Tasks:**

1. **Set Up Supabase Auth**
   ```typescript
   // lib/supabase/auth.ts
   export async function signInWithEmail(email: string, password: string)
   export async function signOut()
   export async function getCurrentUser()
   export async function checkUserRole(): Promise<'admin' | 'client'>
   ```

2. **Create Auth Context**
   ```typescript
   // contexts/AuthContext.tsx
   - Wrap app with AuthProvider
   - Provide user state
   - Provide sign in/out functions
   - Handle role detection
   ```

3. **Build Sign-In Page**
   ```typescript
   // app/signin/page.tsx
   - Email + password form
   - Simple, clean design
   - Redirect to /admin or /client based on role
   - Error handling
   - Loading states
   ```

4. **Implement Middleware Protection**
   ```typescript
   // middleware.ts
   - Protect /admin/* routes (admin role only)
   - Protect /client/* routes (client role only)
   - Redirect unauthenticated users to /signin
   ```

5. **Create Protected Route Wrapper**
   ```typescript
   // components/auth/ProtectedRoute.tsx
   - Check auth status
   - Check role
   - Show loading spinner
   - Redirect if unauthorized
   ```

### Week 1, Day 5: Admin Dashboard Shell

**Tasks:**

1. **Create Admin Layout**
   ```typescript
   // app/admin/layout.tsx
   - Sidebar navigation
   - Header with logo (top right)
   - User menu (sign out)
   - Black sidebar, white content area
   ```

2. **Build Sidebar Navigation**
   ```typescript
   // components/admin/Sidebar.tsx
   - Dashboard link
   - Clients link
   - Upload Files link
   - MCAO Lookup link
   - Analytics link
   - Settings link
   - Collapsible on mobile
   ```

3. **Create Admin Dashboard Page**
   ```typescript
   // app/admin/dashboard/page.tsx
   - Welcome message: "Welcome, Garrett"
   - Summary cards:
     - Total clients
     - Recent uploads
     - Login activity
   - Quick actions:
     - Add Client button
     - Upload File button
   ```

4. **Style with Black/White/Red Theme**
   - Black sidebar
   - White content background
   - Red accent for buttons/links
   - Clean, minimal design

---

## Phase 2: Client Management (Week 2)

### Week 2, Day 1-2: Client List & CRUD

**Tasks:**

1. **Create Client List Page**
   ```typescript
   // app/admin/clients/page.tsx
   - Table view of all clients
   - Columns: Name, Email, Phone, Properties, Last Login, Actions
   - Search bar
   - Sort functionality
   - Pagination (if >50 clients)
   - "Add Client" button
   ```

2. **Build Client Table Component**
   ```typescript
   // components/admin/ClientTable.tsx
   - Fetch clients from Supabase
   - Display in table
   - Actions: View, Edit, Delete
   - Click row to view details
   ```

3. **Implement Client Data Hook**
   ```typescript
   // hooks/useClients.ts
   import { useQuery } from '@tanstack/react-query';

   export function useClients() {
     return useQuery({
       queryKey: ['clients'],
       queryFn: async () => {
         const { data } = await supabase
           .from('gsrealty_clients')
           .select('*')
           .order('created_at', { ascending: false });
         return data;
       }
     });
   }
   ```

4. **Create Database Functions**
   ```typescript
   // lib/database/clients.ts
   export async function getClients()
   export async function getClientById(id: string)
   export async function createClient(data: ClientInput)
   export async function updateClient(id: string, data: Partial<ClientInput>)
   export async function deleteClient(id: string)
   ```

### Week 2, Day 3: Add/Edit Client Forms

**Tasks:**

1. **Create Add Client Page**
   ```typescript
   // app/admin/clients/new/page.tsx
   - Form with fields:
     - First Name (required)
     - Last Name (required)
     - Email
     - Phone
     - Property Address (subject property)
     - Client Address
     - Notes
   - File upload section (optional):
     - CSV upload (Direct comps)
     - XLSX upload (All scopes)
     - XLSX upload (Half mile)
   - Submit button
   - Cancel button
   ```

2. **Build Client Form Component**
   ```typescript
   // components/admin/ClientForm.tsx
   - Use React Hook Form
   - Zod validation
   - Error messages
   - Loading states
   - File upload dropzones
   ```

3. **Create Validation Schema**
   ```typescript
   // lib/validation/client-schema.ts
   import { z } from 'zod';

   export const clientSchema = z.object({
     firstName: z.string().min(1, 'Required'),
     lastName: z.string().min(1, 'Required'),
     email: z.string().email().optional(),
     phone: z.string().optional(),
     propertyAddress: z.string().optional(),
     clientAddress: z.string().optional(),
     notes: z.string().optional()
   });
   ```

4. **Implement Folder Creation**
   ```typescript
   // lib/processing/folder-creator.ts
   export async function createClientFolder(
     lastName: string,
     month: string,
     year: string
   ): Promise<string> {
     const folderName = `${lastName} ${month}.${year}`;
     const path = `${process.env.LOCAL_STORAGE_PATH}/${folderName}`;
     // Create folder, return path
   }
   ```

### Week 2, Day 4-5: Client Details & Edit

**Tasks:**

1. **Create Client Details Page**
   ```typescript
   // app/admin/clients/[id]/page.tsx
   - Client info display
   - List of properties
   - Upload history
   - Login activity
   - Edit button
   - Delete button (with confirmation)
   ```

2. **Build Edit Client Page**
   ```typescript
   // app/admin/clients/[id]/edit/page.tsx
   - Pre-populated form
   - Same fields as Add Client
   - Save Changes button
   - Cancel button
   ```

3. **Implement Delete with Confirmation**
   ```typescript
   // components/admin/DeleteClientModal.tsx
   - Confirmation dialog
   - Warning about deleting all associated data
   - "Are you sure?" message
   - Delete & Cancel buttons
   ```

---

## Phase 3: File Upload System (Week 3-4)

### Week 3, Day 1-2: File Upload UI

**Tasks:**

1. **Create Upload Page**
   ```typescript
   // app/admin/upload/page.tsx
   - Select client dropdown
   - Upload type selector:
     - HTML file
     - CSV (Direct comps)
     - XLSX (All scopes)
     - XLSX (Half mile)
   - File dropzone (react-dropzone)
   - Upload button
   - Progress indicator
   - Success/error messages
   ```

2. **Build File Upload Component**
   ```typescript
   // components/admin/FileUploadForm.tsx
   - Client selection
   - File type selection
   - Drag & drop zone
   - File preview
   - Validation
   ```

3. **Implement File Validation**
   ```typescript
   // lib/validation/upload-schema.ts
   - Max file size: 10 MB
   - Allowed types: .csv, .xlsx, .html
   - APN validation
   - Column header validation
   ```

### Week 3, Day 3-5: CSV/Excel Processing

**Tasks:**

1. **Build MLS CSV Parser**
   ```typescript
   // lib/processing/csv-processor.ts
   import papaparse from 'papaparse';

   export async function parseMLSCSV(file: File) {
     // Parse CSV with papaparse
     // Map ARMLS fields to template columns
     // Validate each row
     // Return processed data + stats
   }
   ```

2. **Build Excel Processor**
   ```typescript
   // lib/processing/excel-processor.ts
   import ExcelJS from 'exceljs';

   export async function processMLSExcel(file: File, uploadType: string) {
     // Load template.xlsx
     // Parse uploaded Excel
     // Map columns
     // Populate comps sheet
     // Return workbook
   }
   ```

3. **Implement Template Populator**
   ```typescript
   // lib/processing/template-populator.ts
   export async function populateTemplate(
     templatePath: string,
     compsData: MLSRow[],
     mcaoData: MCAOData[]
   ): Promise<ExcelJS.Workbook> {
     const workbook = new ExcelJS.Workbook();
     await workbook.xlsx.readFile(templatePath);

     const compsSheet = workbook.getWorksheet('comps');
     // Populate Column B onwards (A is reserved)
     // ...
   }
   ```

4. **Create Processing API Endpoint**
   ```typescript
   // app/api/admin/upload/xlsx/route.ts
   export async function POST(req: Request) {
     const formData = await req.formData();
     const file = formData.get('file') as File;
     const clientId = formData.get('clientId') as string;

     // 1. Validate file
     // 2. Parse with ExcelJS
     // 3. Process data
     // 4. Save to database
     // 5. Create client folder
     // 6. Save processed template
     // 7. Return success
   }
   ```

### Week 4, Day 1-2: File Storage & Database

**Tasks:**

1. **Implement Local File Storage**
   ```typescript
   // lib/storage/local-storage.ts
   export async function saveToLocalFolder(
     clientFolder: string,
     filename: string,
     data: Buffer
   ): Promise<string> {
     const path = `${LOCAL_STORAGE_PATH}/${clientFolder}/${filename}`;
     // Save file
     // Return path
   }
   ```

2. **Save File Metadata to Database**
   ```typescript
   // lib/database/files.ts
   export async function recordFileUpload(data: {
     clientId: string;
     fileName: string;
     fileType: string;
     storagePath: string;
     fileSize: number;
     uploadedBy: string;
   }) {
     return await supabase
       .from('gsrealty_uploaded_files')
       .insert(data);
   }
   ```

3. **Save Property Data**
   ```typescript
   // lib/database/properties.ts
   export async function saveProperties(
     clientId: string,
     properties: PropertyInput[]
   ) {
     // Insert into gsrealty_properties
     // Insert comps into gsrealty_comps
     // Return IDs
   }
   ```

### Week 4, Day 3-5: Processing Status & UI

**Tasks:**

1. **Add Processing Status Tracking**
   ```typescript
   // app/api/admin/upload/status/[uploadId]/route.ts
   - Track processing progress
   - Return status: pending, processing, complete, error
   - Show progress percentage
   ```

2. **Build Upload Progress UI**
   ```typescript
   // components/admin/UploadProgress.tsx
   - Progress bar
   - Status messages
   - Processing stats
   - Success/error display
   ```

3. **Show Processing Results**
   ```typescript
   // components/admin/ProcessingResults.tsx
   - Total rows processed
   - Valid comps
   - Skipped rows
   - Warnings/errors
   - Link to view properties
   ```

---

## Phase 4: MCAO Integration (Week 5)

### Week 5, Day 1-2: APN Lookup Integration

**Tasks:**

1. **APN Lookup Script** ✅ COMPLETE
   - ~~HISTORICAL: Originally copied from external directory~~
   - Now implemented natively at `lib/mcao/arcgis-lookup.ts`

2. **Create APN Lookup API**
   ```typescript
   // app/api/admin/mcao/lookup/route.ts
   export async function POST(req: Request) {
     const { apn } = await req.json();

     // Option A: Call Python script
     const result = await execAsync(`python3 APN/apn_lookup.py ${apn}`);

     // Option B: Direct HTTP call to MCAO API
     const response = await fetch(`${MCAO_API_URL}/parcel/${apn}`, {
       headers: { 'X-API-Key': MCAO_API_KEY }
     });

     return Response.json(await response.json());
   }
   ```

3. **Build MCAO Client**
   ```typescript
   // lib/mcao/mcao-client.ts
   export class MCAOClient {
     constructor(private apiKey: string, private apiUrl: string) {}

     async lookupByAPN(apn: string): Promise<MCAOPropertyData> {
       const response = await fetch(`${this.apiUrl}/parcel/${apn}`, {
         headers: {
           'X-API-Key': this.apiKey,
           'Content-Type': 'application/json'
         }
       });

       if (!response.ok) {
         throw new Error(`MCAO API error: ${response.statusText}`);
       }

       return await response.json();
     }
   }
   ```

4. **Implement APN Validation**
   ```typescript
   // lib/mcao/apn-parser.ts
   export function validateAPNFormat(apn: string): boolean {
     // Maricopa County format: ###-##-####[A]
     const pattern = /^\d{3}-\d{2}-\d{3,4}[A-Z]?$/;
     return pattern.test(apn);
   }

   export function normalizeAPN(apn: string): string {
     // Remove spaces, ensure dashes
     return apn.trim().replace(/\s+/g, '');
   }
   ```

### Week 5, Day 3: MCAO Lookup UI

**Tasks:**

1. **Create MCAO Lookup Page**
   ```typescript
   // app/admin/mcao/page.tsx
   - APN input field
   - Search button
   - Results display
   - Save to client option
   ```

2. **Build MCAO Lookup Component**
   ```typescript
   // components/admin/MCAOLookup.tsx
   - Input with validation
   - Loading state
   - Results table/card
   - Error handling
   ```

3. **Display