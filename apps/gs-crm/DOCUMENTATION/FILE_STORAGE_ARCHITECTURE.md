# File Storage Architecture - GSRealty

**Document:** File Storage & Retention System
**Created:** October 15, 2025
**Purpose:** Explain how uploaded files are stored and accessed

---

## User Question Answered

**Q:** "Files uploaded will be from local but app should retain memory within app every login for client and admin."

**A:** ✅ Supabase Storage (Cloud-Based File Persistence)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  User's Computer                                            │
│  ┌──────────────┐                                           │
│  │ Local Files  │ (MLS CSV, XLSX from user's machine)      │
│  └──────┬───────┘                                           │
│         │ Upload (drag & drop or file picker)              │
│         ▼                                                    │
│  ┌────────────────────────────────────────────────────────┐│
│  │ GSRealty App (localhost:3004 or gsrealty.vercel.app)  ││
│  │                                                        ││
│  │  1. Validate file                                      ││
│  │  2. Process with ExcelJS                               ││
│  │  3. Upload to Supabase Storage (cloud)                 ││
│  │  4. Save metadata to Supabase Database                 ││
│  └────────────────────────┬───────────────────────────────┘│
└────────────────────────────┼────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase Cloud (Persistent Storage)                        │
│                                                              │
│  ┌──────────────────────┐  ┌──────────────────────────────┐│
│  │ Storage Bucket       │  │ PostgreSQL Database           ││
│  │ "gsrealty-files"     │  │                               ││
│  │                      │  │ gsrealty_uploaded_files table ││
│  │ /clients/            │  │ - file_name                   ││
│  │   /client-123/       │  │ - storage_path                ││
│  │     original.xlsx    │  │ - file_size                   ││
│  │     processed.xlsx   │  │ - uploaded_by                 ││
│  │     comps.csv        │  │ - upload_date                 ││
│  │   /client-456/       │  │                               ││
│  │     data.xlsx        │  │ gsrealty_properties           ││
│  │                      │  │ - client_id                   ││
│  └──────────────────────┘  │ - property_data (JSON)        ││
│                             └───────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                             │
                             │ Access on every login
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  Any Device, Anytime                                         │
│  - Admin logs in → sees all client files                     │
│  - Client logs in → sees their files                         │
│  - Files persist forever (until manually deleted)            │
└─────────────────────────────────────────────────────────────┘
```

---

## How It Works

### 1. File Upload (From User's Local Machine)

**User Action:**
- Admin or client selects files from their computer
- Files can be CSV, XLSX, HTML, PDF (up to 10 MB each)

**Upload Process:**
```typescript
// User selects file from local machine
<input type="file" accept=".csv,.xlsx,.html,.pdf" />

// File uploaded to GSRealty app
const formData = new FormData();
formData.append('file', selectedFile);
formData.append('clientId', clientId);

// Posted to API endpoint
fetch('/api/admin/upload/xlsx', {
  method: 'POST',
  body: formData
});
```

---

### 2. Processing & Storage

**Server-Side Processing:**
```typescript
// app/api/admin/upload/xlsx/route.ts
export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  const clientId = formData.get('clientId') as string;

  // Step 1: Read file into memory (from user's upload)
  const buffer = Buffer.from(await file.arrayBuffer());

  // Step 2: Process with ExcelJS
  const processed = await processMLSExcel(buffer);

  // Step 3: Upload BOTH original AND processed to Supabase Storage
  const originalPath = `clients/${clientId}/original_${file.name}`;
  const processedPath = `clients/${clientId}/processed_${file.name}`;

  await supabase.storage
    .from('gsrealty-files')
    .upload(originalPath, buffer);

  await supabase.storage
    .from('gsrealty-files')
    .upload(processedPath, processed);

  // Step 4: Save metadata to database
  await supabase
    .from('gsrealty_uploaded_files')
    .insert({
      client_id: clientId,
      file_name: file.name,
      storage_path: originalPath,
      file_size: file.size,
      uploaded_by: userId,
      processed: true
    });

  // Step 5: Extract property data and save to gsrealty_properties
  await savePropertiesToDatabase(clientId, extractedData);
}
```

---

### 3. File Retention & Access

**✅ Files Are Stored Permanently in Supabase Cloud**

- **NOT** stored on user's computer
- **NOT** temporary
- **YES** accessible from any device
- **YES** available on every login
- **YES** backed up by Supabase

**Access on Login:**
```typescript
// When admin logs in
const { data: adminFiles } = await supabase
  .from('gsrealty_uploaded_files')
  .select('*')
  .order('upload_date', { ascending: false });

// Shows ALL files ever uploaded for all clients

// When client logs in
const { data: clientFiles } = await supabase
  .from('gsrealty_uploaded_files')
  .select('*')
  .eq('client_id', currentClientId);

// Shows only THEIR files
```

---

## Storage Structure

### Supabase Storage Bucket: `gsrealty-files`

**Folder Organization:**
```
gsrealty-files/
├── clients/
│   ├── {client-uuid-123}/
│   │   ├── original_comps_20251015.csv
│   │   ├── processed_template_20251015.xlsx
│   │   ├── client_page_20251015.html
│   │   └── property_images/
│   │       ├── image1.jpg
│   │       └── image2.jpg
│   │
│   ├── {client-uuid-456}/
│   │   ├── original_data_20251016.xlsx
│   │   └── processed_template_20251016.xlsx
│   │
│   └── {client-uuid-789}/
│       └── ...
│
└── templates/
    ├── gsrealty-client-template.xlsx
    └── email-templates/
        ├── invite.html
        └── notification.html
```

---

## Database Tables

### `gsrealty_uploaded_files` - File Metadata

| Column | Type | Purpose |
|--------|------|---------|
| id | UUID | Unique file ID |
| client_id | UUID | Which client this file belongs to |
| file_name | TEXT | Original filename |
| file_type | TEXT | csv, xlsx, html, pdf |
| storage_path | TEXT | Path in Supabase Storage |
| file_size | BIGINT | Size in bytes |
| uploaded_by | UUID | User who uploaded (admin or client) |
| upload_date | TIMESTAMP | When uploaded |
| processed | BOOLEAN | Has it been processed? |
| processing_status | TEXT | Status message |
| processing_errors | JSONB | Any errors encountered |

**Query Examples:**
```sql
-- Get all files for a client
SELECT * FROM gsrealty_uploaded_files
WHERE client_id = 'client-uuid-123'
ORDER BY upload_date DESC;

-- Get recent uploads
SELECT * FROM gsrealty_uploaded_files
ORDER BY upload_date DESC
LIMIT 10;

-- Get unprocessed files
SELECT * FROM gsrealty_uploaded_files
WHERE processed = false;
```

---

### `gsrealty_properties` - Extracted Property Data

| Column | Type | Purpose |
|--------|------|---------|
| id | UUID | Unique property ID |
| client_id | UUID | Which client this property belongs to |
| apn | TEXT | Assessor Parcel Number |
| address | TEXT | Property address |
| city | TEXT | City |
| state | TEXT | State (AZ) |
| zip | TEXT | ZIP code |
| property_data | JSONB | Full property details (JSON) |
| created_at | TIMESTAMP | When added |
| updated_at | TIMESTAMP | Last updated |

**property_data JSONB structure:**
```json
{
  "sale_price": 325900,
  "bedrooms": 1,
  "bathrooms": 1.0,
  "sqft": 702,
  "lot_size": 71,
  "year_built": 1974,
  "hoa": true,
  "hoa_fee": 346.50,
  "mls_number": "6888371",
  "status": "Active",
  "comps": [
    {
      "address": "4620 N 68TH ST 155",
      "distance": 0.35,
      "price": 325900
    }
  ]
}
```

---

## File Access Permissions

### Row Level Security (RLS) Policies

**Supabase Storage Policies:**

```sql
-- Policy 1: Admins can access all files
CREATE POLICY "Admin full access"
ON storage.objects FOR ALL
USING (
  bucket_id = 'gsrealty-files'
  AND auth.uid() IN (
    SELECT id FROM gsrealty_users WHERE role = 'admin'
  )
);

-- Policy 2: Clients can only access their own files
CREATE POLICY "Client read own files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'gsrealty-files'
  AND storage.foldername(name)[1] = 'clients'
  AND storage.foldername(name)[2] = (
    SELECT id::text FROM gsrealty_clients
    WHERE user_id = auth.uid()
  )
);
```

**Database Table Policies:**

```sql
-- Admins can see all uploaded files
CREATE POLICY "Admin view all files"
ON gsrealty_uploaded_files FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM gsrealty_users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Clients can only see files uploaded for them
CREATE POLICY "Client view own files"
ON gsrealty_uploaded_files FOR SELECT
USING (
  client_id IN (
    SELECT id FROM gsrealty_clients
    WHERE user_id = auth.uid()
  )
);
```

---

## File Lifecycle

### Upload → Process → Store → Access

```
1. UPLOAD
   User selects file from local computer
   ↓
2. VALIDATE
   Check file type, size, format
   ↓
3. PROCESS
   Parse with ExcelJS, extract data
   ↓
4. STORE
   Upload to Supabase Storage
   Save metadata to database
   ↓
5. RETAIN
   File stays in cloud forever
   (until manually deleted)
   ↓
6. ACCESS
   User logs in on ANY device
   Sees file in their dashboard
   Can download, view, or re-process
```

---

## Download Flow

**When User Wants to Download a File:**

```typescript
// Client clicks "Download" button
async function downloadFile(filePath: string, fileName: string) {
  // Get signed URL from Supabase Storage
  const { data, error } = await supabase.storage
    .from('gsrealty-files')
    .createSignedUrl(filePath, 3600); // Valid for 1 hour

  if (data) {
    // Trigger browser download
    const link = document.createElement('a');
    link.href = data.signedUrl;
    link.download = fileName;
    link.click();
  }
}
```

**Result:** File downloads to user's computer (from cloud)

---

## Local Storage vs Cloud Storage

### ❌ Local Storage (NOT Used)

**Problems:**
- Files only on one computer
- Lost if computer crashes
- Can't access from different device
- Manual backup required
- Hard to share with clients

### ✅ Supabase Cloud Storage (Used)

**Benefits:**
- Accessible from anywhere
- Automatic backups
- Access from any device
- Secure with RLS policies
- Easy to share with clients
- Professional and reliable

---

## Storage Costs

**Supabase Free Tier:**
- 1 GB storage included
- 2 GB bandwidth/month
- Enough for ~1,000 Excel files

**Estimated Usage:**
- Average Excel file: 100 KB
- 10 files per client
- 100 clients = 100 MB total
- Well within free tier

**If You Exceed:**
- Supabase Pro: $25/month
- 100 GB storage
- 200 GB bandwidth
- Supports 10,000+ clients

---

## Backup Strategy

**Supabase Automatic Backups:**
- Daily backups (Pro plan)
- Point-in-time recovery
- Stored in different region

**Additional Backup (Optional):**
```typescript
// Script to download all files to local machine
async function backupAllFiles() {
  const { data: files } = await supabase
    .from('gsrealty_uploaded_files')
    .select('storage_path, file_name');

  for (const file of files) {
    const { data } = await supabase.storage
      .from('gsrealty-files')
      .download(file.storage_path);

    // Save to local backup folder
    fs.writeFileSync(
      `/backup/${file.file_name}`,
      Buffer.from(await data.arrayBuffer())
    );
  }
}
```

---

## Security

**File Upload Security:**
- Max file size: 10 MB (prevents DoS)
- Allowed types: .csv, .xlsx, .html, .pdf (prevents malware)
- Virus scanning (future enhancement)
- RLS policies (access control)

**File Access Security:**
- Signed URLs (temporary access)
- RLS policies (role-based)
- Audit logging (track downloads)

---

## Summary: Answer to Your Question

**Q:** Files uploaded from local, but app should retain memory within app every login for client and admin.

**A:** ✅ **YES! Here's how:**

1. **Upload:** User uploads file FROM their local computer
2. **Process:** App processes the file
3. **Store:** App saves file TO Supabase Cloud (permanent storage)
4. **Retain:** File stays in cloud forever (not on user's computer)
5. **Access:** On EVERY login (any device, anywhere):
   - Admin sees ALL files ever uploaded
   - Client sees THEIR files ever uploaded
6. **Download:** User can download files back to local computer anytime

**You never lose files. They're always accessible. Stored in professional cloud infrastructure.**

---

## Implementation Code

**File Upload Component:**
```typescript
// components/admin/FileUploadForm.tsx
export function FileUploadForm({ clientId }: { clientId: string }) {
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('clientId', clientId);

    const response = await fetch('/api/admin/upload/xlsx', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    console.log('File uploaded and stored in cloud:', result);
  };

  return (
    <div>
      <input
        type="file"
        accept=".csv,.xlsx"
        onChange={(e) => setFile(e.files?.[0] || null)}
      />
      <button onClick={handleUpload}>Upload to Cloud</button>
    </div>
  );
}
```

**File List Component:**
```typescript
// components/client/FileList.tsx
export function FileList({ clientId }: { clientId: string }) {
  const { data: files } = useQuery({
    queryKey: ['files', clientId],
    queryFn: async () => {
      const { data } = await supabase
        .from('gsrealty_uploaded_files')
        .select('*')
        .eq('client_id', clientId);
      return data;
    }
  });

  return (
    <div>
      <h2>Your Files (Stored in Cloud)</h2>
      {files?.map(file => (
        <div key={file.id}>
          <span>{file.file_name}</span>
          <span>{new Date(file.upload_date).toLocaleDateString()}</span>
          <button onClick={() => downloadFile(file.storage_path, file.file_name)}>
            Download
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

**END OF FILE STORAGE DOCUMENTATION**
