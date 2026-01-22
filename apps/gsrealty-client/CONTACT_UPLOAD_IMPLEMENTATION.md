# Contact Upload Implementation Plan

**Feature:** Bulk Contact Import from CSV/XLSX
**Project:** GSRealty Client Management System
**Created:** January 21, 2026
**Status:** Implementation Ready

---

## Overview

A bulk contact import feature that allows uploading CSV or XLSX files, mapping file columns to CRM fields, previewing data, and importing contacts with full tracking and rollback capability.

### Key Requirements

| Requirement | Decision |
|-------------|----------|
| File Types | CSV, XLSX |
| Max Contacts | 5,000 per import |
| Duplicate Handling | Skip if email OR phone exists |
| Preview | First 10 rows with validation |
| Import History | Yes, with rollback capability |
| Tracking | Import batch ID on all imported contacts |

---

## Database Schema

### Table: `gsrealty_import_batches`

Tracks each import operation for history and rollback.

```sql
CREATE TABLE gsrealty_import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Import metadata
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('csv', 'xlsx')),
  file_size_bytes INTEGER,

  -- Import stats
  total_rows INTEGER NOT NULL DEFAULT 0,
  imported_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,

  -- Field mapping snapshot (JSONB)
  field_mapping JSONB NOT NULL,
  -- Example: {"first_name": "First Name", "last_name": "Last", "email": "Email Address"}

  -- Skipped/error details for review
  skipped_rows JSONB DEFAULT '[]',
  -- Example: [{"row": 5, "reason": "duplicate_email", "email": "john@example.com"}]

  error_rows JSONB DEFAULT '[]',
  -- Example: [{"row": 12, "reason": "missing_required", "field": "first_name"}]

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Upload received, not yet processed
    'processing',   -- Currently importing
    'completed',    -- Import finished successfully
    'failed',       -- Import failed (error)
    'rolled_back'   -- Import was rolled back (contacts deleted)
  )),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  rolled_back_at TIMESTAMPTZ,

  -- Who performed the import
  created_by UUID
);

-- Indexes
CREATE INDEX idx_import_batches_status ON gsrealty_import_batches(status);
CREATE INDEX idx_import_batches_created_at ON gsrealty_import_batches(created_at DESC);

-- RLS
ALTER TABLE gsrealty_import_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON gsrealty_import_batches
  FOR ALL TO authenticated USING (true);
```

### Alter: `gsrealty_clients`

Add import tracking column to existing clients table.

```sql
-- Add import_batch_id to track which import created the contact
ALTER TABLE gsrealty_clients
ADD COLUMN import_batch_id UUID REFERENCES gsrealty_import_batches(id) ON DELETE SET NULL;

-- Index for efficient rollback queries
CREATE INDEX idx_clients_import_batch ON gsrealty_clients(import_batch_id)
WHERE import_batch_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN gsrealty_clients.import_batch_id IS
  'References the import batch that created this contact. NULL = manually created.';
```

---

## Field Mapping

### Target Fields (gsrealty_clients)

| Field | Type | Required | Mappable | Notes |
|-------|------|----------|----------|-------|
| first_name | TEXT | Yes | Yes | **Must be mapped** |
| last_name | TEXT | Yes | Yes | **Must be mapped** |
| email | TEXT | No | Yes | Used for duplicate detection |
| phone | TEXT | No | Yes | Used for duplicate detection |
| address | TEXT | No | Yes | Client's personal address |
| client_type | ENUM | No | Yes | buyer/seller/both (default: buyer) |
| status | ENUM | No | Yes | active/inactive/prospect (default: prospect) |
| notes | TEXT | No | Yes | Any additional notes |

### Mapping Interface Specification

```
┌─────────────────────────────────────────────────────────────────┐
│ Contact Upload - Field Mapping                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Your Field              Maps To (from file)                    │
│  ─────────────────────   ─────────────────────────────────────  │
│                                                                 │
│  First Name *            [▼ Select column...          ]         │
│                          ├─ First Name                          │
│                          ├─ FirstName                           │
│                          ├─ Given Name                          │
│                          ├─ Contact First                       │
│                          └─ (Don't import)                      │
│                                                                 │
│  Last Name *             [▼ Last Name                 ]  ✓      │
│                                                                 │
│  Email                   [▼ Email Address             ]  ✓      │
│                                                                 │
│  Phone                   [▼ Phone Number              ]  ✓      │
│                                                                 │
│  Address                 [▼ (Don't import)            ]         │
│                                                                 │
│  Client Type             [▼ Type                      ]  ✓      │
│                          (Values: buyer, seller, both)          │
│                                                                 │
│  Status                  [▼ (Don't import)            ]         │
│                          (Default: prospect)                    │
│                                                                 │
│  Notes                   [▼ Notes                     ]  ✓      │
│                                                                 │
│  * Required fields must be mapped                               │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ File columns detected: First Name, Last Name, Email     │    │
│  │ Address, Phone Number, Type, Notes, Company, Source     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│            [Cancel]                      [Preview Import →]     │
└─────────────────────────────────────────────────────────────────┘
```

### Auto-Mapping Logic

Attempt to auto-map common column names:

```typescript
const AUTO_MAP_RULES: Record<string, string[]> = {
  first_name: ['first name', 'firstname', 'first', 'given name', 'forename'],
  last_name: ['last name', 'lastname', 'last', 'surname', 'family name'],
  email: ['email', 'e-mail', 'email address', 'emailaddress'],
  phone: ['phone', 'telephone', 'phone number', 'mobile', 'cell', 'tel'],
  address: ['address', 'street address', 'mailing address', 'home address'],
  client_type: ['type', 'client type', 'contact type', 'category'],
  status: ['status', 'contact status', 'state'],
  notes: ['notes', 'comments', 'description', 'memo', 'remarks']
}

function autoMapColumns(fileColumns: string[]): Record<string, string | null> {
  const mapping: Record<string, string | null> = {}

  for (const [field, aliases] of Object.entries(AUTO_MAP_RULES)) {
    const match = fileColumns.find(col =>
      aliases.includes(col.toLowerCase().trim())
    )
    mapping[field] = match || null
  }

  return mapping
}
```

---

## Preview & Validation

### Preview Display (First 10 Rows)

```
┌─────────────────────────────────────────────────────────────────┐
│ Import Preview - 10 of 247 contacts                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ✓ 243 contacts ready to import                          │    │
│  │ ⚠ 3 duplicates will be skipped (email/phone exists)     │    │
│  │ ✗ 1 row has errors (missing required field)             │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────┬──────────┬──────────┬─────────────────┬──────────┐    │
│  │ Row │ First    │ Last     │ Email           │ Status   │    │
│  ├─────┼──────────┼──────────┼─────────────────┼──────────┤    │
│  │ 1   │ John     │ Smith    │ john@email.com  │ ✓ Ready  │    │
│  │ 2   │ Jane     │ Doe      │ jane@email.com  │ ✓ Ready  │    │
│  │ 3   │ Bob      │ Wilson   │ bob@exist.com   │ ⚠ Skip   │    │
│  │ 4   │ Alice    │ Johnson  │ alice@email.com │ ✓ Ready  │    │
│  │ 5   │          │ Brown    │ test@email.com  │ ✗ Error  │    │
│  │ ... │ ...      │ ...      │ ...             │ ...      │    │
│  └─────┴──────────┴──────────┴─────────────────┴──────────┘    │
│                                                                 │
│  ⚠ Row 3: Skipped - email "bob@exist.com" already exists        │
│  ✗ Row 5: Error - first_name is required                        │
│                                                                 │
│        [← Back to Mapping]              [Import 243 Contacts]   │
└─────────────────────────────────────────────────────────────────┘
```

### Validation Rules

```typescript
interface ValidationResult {
  row: number
  status: 'valid' | 'skip' | 'error'
  reason?: string
  data?: Record<string, any>
}

async function validateRow(
  row: Record<string, any>,
  rowNumber: number,
  mapping: Record<string, string>,
  existingEmails: Set<string>,
  existingPhones: Set<string>
): Promise<ValidationResult> {
  const firstName = row[mapping.first_name]?.trim()
  const lastName = row[mapping.last_name]?.trim()
  const email = row[mapping.email]?.trim()?.toLowerCase()
  const phone = normalizePhone(row[mapping.phone])

  // Required field validation
  if (!firstName) {
    return { row: rowNumber, status: 'error', reason: 'missing_first_name' }
  }
  if (!lastName) {
    return { row: rowNumber, status: 'error', reason: 'missing_last_name' }
  }

  // Duplicate detection
  if (email && existingEmails.has(email)) {
    return {
      row: rowNumber,
      status: 'skip',
      reason: 'duplicate_email',
      data: { email }
    }
  }
  if (phone && existingPhones.has(phone)) {
    return {
      row: rowNumber,
      status: 'skip',
      reason: 'duplicate_phone',
      data: { phone }
    }
  }

  // Email format validation (if provided)
  if (email && !isValidEmail(email)) {
    return { row: rowNumber, status: 'error', reason: 'invalid_email' }
  }

  return { row: rowNumber, status: 'valid' }
}
```

---

## API Endpoints

### POST `/api/admin/contacts/upload/parse`

Parse uploaded file and return columns for mapping.

**Request:**
```typescript
// multipart/form-data
{
  file: File  // CSV or XLSX file
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    fileName: "contacts.csv",
    fileType: "csv",
    totalRows: 247,
    columns: ["First Name", "Last Name", "Email", "Phone", "Notes"],
    sampleRows: [
      { "First Name": "John", "Last Name": "Smith", "Email": "john@email.com", ... },
      { "First Name": "Jane", "Last Name": "Doe", "Email": "jane@email.com", ... },
      // First 5 rows for reference
    ],
    suggestedMapping: {
      first_name: "First Name",
      last_name: "Last Name",
      email: "Email",
      phone: "Phone",
      notes: "Notes",
      address: null,
      client_type: null,
      status: null
    }
  }
}
```

### POST `/api/admin/contacts/upload/preview`

Validate mapping and return preview with validation results.

**Request:**
```typescript
{
  fileName: string,
  mapping: {
    first_name: string,      // Column name from file
    last_name: string,
    email: string | null,
    phone: string | null,
    address: string | null,
    client_type: string | null,
    status: string | null,
    notes: string | null
  }
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    summary: {
      totalRows: 247,
      validCount: 243,
      skipCount: 3,
      errorCount: 1
    },
    preview: [
      { row: 1, status: 'valid', data: { first_name: "John", ... } },
      { row: 2, status: 'valid', data: { first_name: "Jane", ... } },
      { row: 3, status: 'skip', reason: 'duplicate_email', data: { email: "bob@exist.com" } },
      // ... first 10 rows
    ],
    allSkipped: [
      { row: 3, reason: 'duplicate_email', email: "bob@exist.com" },
      { row: 45, reason: 'duplicate_phone', phone: "602-555-1234" },
      // ... all skipped rows
    ],
    allErrors: [
      { row: 5, reason: 'missing_first_name' },
      // ... all error rows
    ]
  }
}
```

### POST `/api/admin/contacts/upload/import`

Execute the import.

**Request:**
```typescript
{
  fileName: string,
  mapping: Record<string, string | null>
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    batchId: "uuid-of-import-batch",
    importedCount: 243,
    skippedCount: 3,
    errorCount: 1,
    contacts: [
      { id: "uuid", first_name: "John", last_name: "Smith", ... },
      // All imported contacts
    ]
  }
}
```

### GET `/api/admin/contacts/upload/history`

Get import history.

**Response:**
```typescript
{
  success: true,
  data: {
    batches: [
      {
        id: "uuid",
        file_name: "contacts.csv",
        file_type: "csv",
        total_rows: 247,
        imported_count: 243,
        skipped_count: 3,
        error_count: 1,
        status: "completed",
        created_at: "2026-01-21T10:30:00Z",
        completed_at: "2026-01-21T10:30:15Z"
      },
      // ... more batches
    ]
  }
}
```

### DELETE `/api/admin/contacts/upload/batch/[id]`

Rollback an import batch (delete all contacts from that batch).

**Response:**
```typescript
{
  success: true,
  data: {
    batchId: "uuid",
    deletedCount: 243,
    status: "rolled_back"
  }
}
```

---

## File Structure

```
apps/gsrealty-client/
├── app/
│   └── admin/
│       └── contacts/
│           └── upload/
│               ├── page.tsx              # Main upload page
│               └── history/
│                   └── page.tsx          # Import history page
├── components/
│   └── admin/
│       └── contacts/
│           ├── ContactUploadDropzone.tsx # File dropzone
│           ├── FieldMappingForm.tsx      # Mapping interface
│           ├── ImportPreview.tsx         # Preview table
│           ├── ImportProgress.tsx        # Progress indicator
│           └── ImportHistoryTable.tsx    # History list
├── lib/
│   ├── database/
│   │   └── contact-import.ts             # Database functions
│   └── processing/
│       ├── csv-contact-parser.ts         # CSV parsing
│       └── xlsx-contact-parser.ts        # XLSX parsing
└── app/
    └── api/
        └── admin/
            └── contacts/
                └── upload/
                    ├── parse/
                    │   └── route.ts       # Parse endpoint
                    ├── preview/
                    │   └── route.ts       # Preview endpoint
                    ├── import/
                    │   └── route.ts       # Import endpoint
                    ├── history/
                    │   └── route.ts       # History endpoint
                    └── batch/
                        └── [id]/
                            └── route.ts   # Rollback endpoint
```

---

## UI Flow

### Step 1: File Upload

```
┌─────────────────────────────────────────────────────────────────┐
│ Contact Upload                                        [History] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │     ┌───────────┐                                       │    │
│  │     │   📁      │                                       │    │
│  │     └───────────┘                                       │    │
│  │                                                         │    │
│  │     Drag and drop your CSV or Excel file here           │    │
│  │     or click to browse                                  │    │
│  │                                                         │    │
│  │     Supported: .csv, .xlsx (max 5,000 contacts)         │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 💡 Tips:                                                 │    │
│  │ • First row should contain column headers               │    │
│  │ • Required fields: First Name, Last Name                │    │
│  │ • Duplicates (by email/phone) will be skipped           │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Step 2: Field Mapping

(See Mapping Interface Specification above)

### Step 3: Preview

(See Preview Display above)

### Step 4: Import Progress

```
┌─────────────────────────────────────────────────────────────────┐
│ Importing Contacts...                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ████████████████████░░░░░░░░░░░░░░░░░░░░  45%           │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  Imported: 109 of 243 contacts                                  │
│  Elapsed: 12 seconds                                            │
│                                                                 │
│  Please don't close this window...                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Step 5: Success

```
┌─────────────────────────────────────────────────────────────────┐
│ Import Complete! ✓                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  ✓ 243 contacts imported successfully                   │    │
│  │  ⚠ 3 duplicates skipped                                 │    │
│  │  ✗ 1 row had errors                                     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  Import ID: abc123-def456                                       │
│  Time: 27 seconds                                               │
│                                                                 │
│  [View Skipped Rows]  [View Error Rows]                         │
│                                                                 │
│        [Upload Another]              [Go to Contacts →]         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Import History Page

```
┌─────────────────────────────────────────────────────────────────┐
│ Import History                                      [← Back]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ File           │ Date       │ Imported │ Status │ Action │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ contacts.csv   │ Jan 21     │ 243      │ ✓ Done │ [🗑️]   │   │
│  │ leads.xlsx     │ Jan 18     │ 156      │ ✓ Done │ [🗑️]   │   │
│  │ old_crm.csv    │ Jan 15     │ 0        │ ↩ Rolled│ —     │   │
│  │ prospects.csv  │ Jan 10     │ 89       │ ✓ Done │ [🗑️]   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  🗑️ = Rollback (delete all contacts from this import)          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Checklist

### Phase 1: Database (Day 1)
- [ ] Create `gsrealty_import_batches` table migration
- [ ] Add `import_batch_id` column to `gsrealty_clients`
- [ ] Apply migration to Supabase
- [ ] Create `lib/database/contact-import.ts` with CRUD functions

### Phase 2: File Parsing (Day 1-2)
- [ ] Create `lib/processing/csv-contact-parser.ts`
- [ ] Create `lib/processing/xlsx-contact-parser.ts`
- [ ] Implement auto-mapping logic
- [ ] Implement validation logic
- [ ] Add phone number normalization

### Phase 3: API Endpoints (Day 2-3)
- [ ] Create `/api/admin/contacts/upload/parse` endpoint
- [ ] Create `/api/admin/contacts/upload/preview` endpoint
- [ ] Create `/api/admin/contacts/upload/import` endpoint
- [ ] Create `/api/admin/contacts/upload/history` endpoint
- [ ] Create `/api/admin/contacts/upload/batch/[id]` (DELETE) endpoint

### Phase 4: UI Components (Day 3-4)
- [ ] Build `ContactUploadDropzone.tsx`
- [ ] Build `FieldMappingForm.tsx` with dropdowns
- [ ] Build `ImportPreview.tsx` with validation display
- [ ] Build `ImportProgress.tsx` with progress bar
- [ ] Build `ImportHistoryTable.tsx`

### Phase 5: Pages & Integration (Day 4-5)
- [ ] Create `/admin/contacts/upload/page.tsx` (main flow)
- [ ] Create `/admin/contacts/upload/history/page.tsx`
- [ ] Update sidebar navigation (rename Data Import → Contact Upload)
- [ ] Wire up all components
- [ ] Add glassmorphism styling

### Phase 6: Testing (Day 5)
- [ ] Test CSV upload with various formats
- [ ] Test XLSX upload
- [ ] Test duplicate detection
- [ ] Test validation error handling
- [ ] Test large file (5,000 rows)
- [ ] Test rollback functionality
- [ ] Verify imported contacts appear in client list

---

## Dependencies

```json
{
  "dependencies": {
    "papaparse": "^5.4.1",
    "exceljs": "^4.4.0",
    "react-dropzone": "^14.2.3"
  },
  "devDependencies": {
    "@types/papaparse": "^5.3.14"
  }
}
```

**Note:** ExcelJS is already installed. May need to add papaparse and react-dropzone if not present.

---

## Error Messages

| Code | User-Facing Message |
|------|---------------------|
| `missing_first_name` | "First name is required" |
| `missing_last_name` | "Last name is required" |
| `duplicate_email` | "A contact with this email already exists" |
| `duplicate_phone` | "A contact with this phone number already exists" |
| `invalid_email` | "Invalid email format" |
| `file_too_large` | "File exceeds 5,000 contact limit" |
| `invalid_file_type` | "Only CSV and XLSX files are supported" |
| `parse_error` | "Could not parse file. Please check the format." |

---

## Security Considerations

1. **File Validation** - Verify file type by content, not just extension
2. **Size Limits** - Enforce 5,000 row limit server-side
3. **Sanitization** - Sanitize all text inputs before database insert
4. **Rate Limiting** - Limit to 1 import per minute per user
5. **Auth Check** - Verify admin role on all endpoints

---

## Future Enhancements

- [ ] Import deals in bulk
- [ ] Import outreach history
- [ ] Template download (example CSV)
- [ ] Duplicate merge (instead of skip)
- [ ] Undo single contact from batch
- [ ] Schedule imports
- [ ] Import from Google Contacts / Outlook

---

**END OF IMPLEMENTATION PLAN**
