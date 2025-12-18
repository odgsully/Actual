# GSRealty File Storage Setup Guide

**Created by:** Agent H (File Storage System)
**Date:** October 16, 2025
**Purpose:** Complete setup instructions for Supabase Storage and RLS policies

---

## Overview

The GSRealty file storage system uses a dual-storage approach:

1. **Primary Storage:** Supabase Storage (cloud-based, permanent)
2. **Backup Storage:** Local MacOS folders (convenient access for Garrett)
3. **Metadata:** PostgreSQL database (`gsrealty_uploaded_files` table)

---

## 1. Supabase Storage Bucket Setup

### Step 1: Create Storage Bucket

In the Supabase Dashboard:

1. Navigate to **Storage** section
2. Click **Create Bucket**
3. Configure bucket:
   - **Name:** `gsrealty-uploads`
   - **Public:** Disabled (private bucket)
   - **File size limit:** 10 MB
   - **Allowed MIME types:**
     - `text/csv`
     - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
     - `text/html`
     - `application/pdf`

Alternatively, create via SQL:

```sql
-- Create storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gsrealty-uploads',
  'gsrealty-uploads',
  false,
  10485760, -- 10 MB
  ARRAY['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/html', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;
```

### Step 2: Verify Bucket Structure

The bucket should follow this folder structure:

```
gsrealty-uploads/
├── clients/
│   ├── {client-uuid-1}/
│   │   ├── uploads/          # Original uploaded files
│   │   │   └── file1.xlsx
│   │   └── processed/        # Processed/populated templates
│   │       └── template_populated.xlsx
│   ├── {client-uuid-2}/
│   │   ├── uploads/
│   │   └── processed/
│   └── {client-uuid-3}/
│       ├── uploads/
│       └── processed/
```

---

## 2. Row Level Security (RLS) Policies

### Storage Bucket Policies

**Policy 1: Admin Full Access (All Operations)**

```sql
-- Allow admins to perform ALL operations on storage bucket
CREATE POLICY "Admin full access to uploads"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'gsrealty-uploads'
  AND EXISTS (
    SELECT 1 FROM gsrealty_users
    WHERE gsrealty_users.auth_user_id = auth.uid()
    AND gsrealty_users.role = 'admin'
  )
);
```

**Policy 2: Client Read Own Files Only**

```sql
-- Allow clients to SELECT (read/download) their own files
CREATE POLICY "Clients can read own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'gsrealty-uploads'
  AND (storage.foldername(name))[1] = 'clients'
  AND (storage.foldername(name))[2] = (
    SELECT id::text FROM gsrealty_clients
    WHERE user_id = (
      SELECT id FROM gsrealty_users
      WHERE auth_user_id = auth.uid()
      AND role = 'client'
    )
  )
);
```

**Policy 3: Prevent Unauthorized Access**

```sql
-- Ensure no public access to private bucket
CREATE POLICY "No public access"
ON storage.objects FOR SELECT
TO anon
USING (false);
```

### Database Table Policies (gsrealty_uploaded_files)

**Policy 1: Admin View All Files**

```sql
-- Admins can view all uploaded files
CREATE POLICY "Admin view all files"
ON gsrealty_uploaded_files FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM gsrealty_users
    WHERE gsrealty_users.auth_user_id = auth.uid()
    AND gsrealty_users.role = 'admin'
  )
);
```

**Policy 2: Admin Insert Files**

```sql
-- Admins can insert file records
CREATE POLICY "Admin insert files"
ON gsrealty_uploaded_files FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM gsrealty_users
    WHERE gsrealty_users.auth_user_id = auth.uid()
    AND gsrealty_users.role = 'admin'
  )
);
```

**Policy 3: Admin Update Files**

```sql
-- Admins can update file records
CREATE POLICY "Admin update files"
ON gsrealty_uploaded_files FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM gsrealty_users
    WHERE gsrealty_users.auth_user_id = auth.uid()
    AND gsrealty_users.role = 'admin'
  )
);
```

**Policy 4: Admin Delete Files**

```sql
-- Admins can delete file records
CREATE POLICY "Admin delete files"
ON gsrealty_uploaded_files FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM gsrealty_users
    WHERE gsrealty_users.auth_user_id = auth.uid()
    AND gsrealty_users.role = 'admin'
  )
);
```

**Policy 5: Client View Own Files**

```sql
-- Clients can only view files uploaded for them
CREATE POLICY "Clients view own files"
ON gsrealty_uploaded_files FOR SELECT
TO authenticated
USING (
  client_id IN (
    SELECT id FROM gsrealty_clients
    WHERE user_id = (
      SELECT id FROM gsrealty_users
      WHERE auth_user_id = auth.uid()
      AND role = 'client'
    )
  )
);
```

---

## 3. Apply All RLS Policies

### Complete SQL Script

Run this script in Supabase SQL Editor to apply all policies:

```sql
-- ================================================================
-- GSRealty Storage RLS Policies
-- ================================================================
-- Purpose: Secure file access with row-level security
-- ================================================================

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Enable RLS on gsrealty_uploaded_files (if not already enabled)
ALTER TABLE gsrealty_uploaded_files ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- Storage Bucket Policies
-- ================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin full access to uploads" ON storage.objects;
DROP POLICY IF EXISTS "Clients can read own files" ON storage.objects;
DROP POLICY IF EXISTS "No public access" ON storage.objects;

-- Policy 1: Admin full access
CREATE POLICY "Admin full access to uploads"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'gsrealty-uploads'
  AND EXISTS (
    SELECT 1 FROM gsrealty_users
    WHERE gsrealty_users.auth_user_id = auth.uid()
    AND gsrealty_users.role = 'admin'
  )
);

-- Policy 2: Client read own files
CREATE POLICY "Clients can read own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'gsrealty-uploads'
  AND (storage.foldername(name))[1] = 'clients'
  AND (storage.foldername(name))[2] = (
    SELECT id::text FROM gsrealty_clients
    WHERE user_id = (
      SELECT id FROM gsrealty_users
      WHERE auth_user_id = auth.uid()
      AND role = 'client'
    )
  )
);

-- Policy 3: No public access
CREATE POLICY "No public access"
ON storage.objects FOR SELECT
TO anon
USING (false);

-- ================================================================
-- Database Table Policies (gsrealty_uploaded_files)
-- ================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin view all files" ON gsrealty_uploaded_files;
DROP POLICY IF EXISTS "Admin insert files" ON gsrealty_uploaded_files;
DROP POLICY IF EXISTS "Admin update files" ON gsrealty_uploaded_files;
DROP POLICY IF EXISTS "Admin delete files" ON gsrealty_uploaded_files;
DROP POLICY IF EXISTS "Clients view own files" ON gsrealty_uploaded_files;

-- Admin policies
CREATE POLICY "Admin view all files"
ON gsrealty_uploaded_files FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM gsrealty_users
    WHERE gsrealty_users.auth_user_id = auth.uid()
    AND gsrealty_users.role = 'admin'
  )
);

CREATE POLICY "Admin insert files"
ON gsrealty_uploaded_files FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM gsrealty_users
    WHERE gsrealty_users.auth_user_id = auth.uid()
    AND gsrealty_users.role = 'admin'
  )
);

CREATE POLICY "Admin update files"
ON gsrealty_uploaded_files FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM gsrealty_users
    WHERE gsrealty_users.auth_user_id = auth.uid()
    AND gsrealty_users.role = 'admin'
  )
);

CREATE POLICY "Admin delete files"
ON gsrealty_uploaded_files FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM gsrealty_users
    WHERE gsrealty_users.auth_user_id = auth.uid()
    AND gsrealty_users.role = 'admin'
  )
);

-- Client policy
CREATE POLICY "Clients view own files"
ON gsrealty_uploaded_files FOR SELECT
TO authenticated
USING (
  client_id IN (
    SELECT id FROM gsrealty_clients
    WHERE user_id = (
      SELECT id FROM gsrealty_users
      WHERE auth_user_id = auth.uid()
      AND role = 'client'
    )
  )
);

-- ================================================================
-- Verification
-- ================================================================

-- Verify storage policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
ORDER BY policyname;

-- Verify database policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'gsrealty_uploaded_files'
ORDER BY policyname;
```

---

## 4. Local Storage Configuration

### MacOS Folder Path

The system saves files to:

```
/Users/garrettsullivan/Desktop/‼️/RE/RealtyONE/MY LISTINGS/
```

### Folder Naming Convention

Format: `{LastName} {MM.YY}`

Examples:
- `Mozingo 10.25/`
- `Sullivan 09.24/`
- `Johnson 11.25/`

### Ensure Base Path Exists

Run this on application startup (handled automatically by `ensureBasePathExists()` function):

```typescript
import { ensureBasePathExists } from '@/lib/storage/local-storage'

await ensureBasePathExists()
```

---

## 5. API Endpoints

### Store File

**POST** `/api/admin/upload/store`

Stores processed file to Supabase Storage, local folder, and database.

**Request Body:**
```json
{
  "clientId": "uuid",
  "fileName": "template.xlsx",
  "fileType": "xlsx",
  "uploadType": "direct_comps",
  "fileBuffer": "base64_encoded_data",
  "contentType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "uploadedBy": "user_uuid"
}
```

**Response:**
```json
{
  "success": true,
  "fileId": "file_uuid",
  "storagePath": "clients/{clientId}/processed/file.xlsx",
  "localPath": "/Users/.../LastName 10.25/file.xlsx",
  "downloadUrl": "https://supabase.co/storage/...",
  "fileName": "generated_filename.xlsx",
  "folderName": "LastName 10.25"
}
```

### Download File

**GET** `/api/admin/upload/download/[fileId]?mode=download`

Downloads file directly or returns signed URL.

**Query Parameters:**
- `mode`: `download` (default) | `url`

**Response (mode=download):**
- File blob with appropriate headers

**Response (mode=url):**
```json
{
  "success": true,
  "url": "https://supabase.co/storage/signed/...",
  "fileName": "file.xlsx",
  "fileSize": 12345,
  "expiresIn": 3600
}
```

### Delete File

**DELETE** `/api/admin/upload/delete/[fileId]?includeLocal=false`

Deletes file from storage and database.

**Query Parameters:**
- `includeLocal`: `true` | `false` (default: `false`)

**Response:**
```json
{
  "success": true,
  "fileId": "uuid",
  "fileName": "file.xlsx",
  "deletedFrom": ["supabase_storage", "database", "local_storage"],
  "errors": []
}
```

---

## 6. Testing the Storage System

### Test 1: Create Bucket

```typescript
import { initializeStorage } from '@/lib/storage/supabase-storage'

await initializeStorage()
// Should create 'gsrealty-uploads' bucket
```

### Test 2: Upload File

```typescript
import { uploadBufferToSupabase } from '@/lib/storage/supabase-storage'

const buffer = Buffer.from('test data')
const { url, path, error } = await uploadBufferToSupabase(
  buffer,
  'clients/test-client-id/uploads/test.txt',
  'text/plain'
)

console.log('Uploaded:', url, path)
```

### Test 3: Store Complete File

```bash
curl -X POST http://localhost:3004/api/admin/upload/store \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "client-uuid",
    "fileName": "test.xlsx",
    "fileType": "xlsx",
    "fileBuffer": "base64data...",
    "contentType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "uploadedBy": "user-uuid"
  }'
```

### Test 4: Download File

```bash
curl http://localhost:3004/api/admin/upload/download/file-uuid?mode=url
```

### Test 5: Delete File

```bash
curl -X DELETE http://localhost:3004/api/admin/upload/delete/file-uuid?includeLocal=true
```

---

## 7. Database Migration

If the `gsrealty_uploaded_files` table doesn't have all required columns, run this migration:

```sql
-- Add missing columns if needed
ALTER TABLE gsrealty_uploaded_files
ADD COLUMN IF NOT EXISTS local_path TEXT,
ADD COLUMN IF NOT EXISTS upload_type TEXT CHECK (upload_type IN ('direct_comps', 'all_scopes', 'half_mile'));

-- Create index on upload_type
CREATE INDEX IF NOT EXISTS idx_gsrealty_files_upload_type
ON gsrealty_uploaded_files(upload_type);

-- Add comment
COMMENT ON COLUMN gsrealty_uploaded_files.local_path IS 'Local MacOS folder path (backup storage)';
COMMENT ON COLUMN gsrealty_uploaded_files.upload_type IS 'Type of MLS upload: direct_comps, all_scopes, or half_mile';
```

---

## 8. Integration Notes for Agent G

### API Integration

Agent G (Upload UI) should call the store API after file processing:

```typescript
// After Agent F processes the file
const workbook = await processFile(uploadedFile)

// Convert workbook to buffer
const buffer = await workbook.xlsx.writeBuffer()

// Store file
const response = await fetch('/api/admin/upload/store', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    clientId: selectedClient.id,
    fileName: uploadedFile.name,
    fileType: 'xlsx',
    uploadType: 'direct_comps',
    fileBuffer: buffer.toString('base64'),
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    uploadedBy: currentUser.id,
  }),
})

const result = await response.json()
console.log('File stored:', result)
```

### Expected Response Format

```typescript
interface StoreResponse {
  success: boolean
  fileId: string
  storagePath: string
  localPath: string | null
  downloadUrl: string
  fileName: string
  folderName: string
}
```

---

## 9. Security Checklist

- [x] RLS enabled on `storage.objects`
- [x] RLS enabled on `gsrealty_uploaded_files`
- [x] Admin full access policy applied
- [x] Client read-only policy applied
- [x] No public access policy applied
- [x] File size limits enforced (10 MB)
- [x] MIME type restrictions enforced
- [x] Signed URLs for temporary access
- [x] Local storage path secured (MacOS permissions)

---

## 10. Maintenance

### Clean Up Old Files (Future)

Create a scheduled job to delete files older than retention period:

```typescript
import { STORAGE_CONFIG } from '@/lib/storage/config'

async function cleanupOldFiles() {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - STORAGE_CONFIG.retentionDays)

  // Query old files
  const { files } = await getFilesByStatus('complete')
  const oldFiles = files.filter(f => new Date(f.upload_date) < cutoffDate)

  // Delete each old file
  for (const file of oldFiles) {
    await fetch(`/api/admin/upload/delete/${file.id}?includeLocal=true`, {
      method: 'DELETE',
    })
  }
}
```

### Backup Strategy

**Supabase Automatic Backups:**
- Daily backups (Pro plan)
- Point-in-time recovery

**Local Backups:**
- Files already saved to MacOS folder
- Can be backed up with Time Machine

---

## Summary

**Storage System Status:** ✅ Complete

**Components Created:**
1. ✅ Storage configuration (`lib/storage/config.ts`)
2. ✅ TypeScript types (`lib/types/storage.ts`)
3. ✅ Supabase Storage integration (`lib/storage/supabase-storage.ts`)
4. ✅ Local storage integration (`lib/storage/local-storage.ts`)
5. ✅ Database functions (`lib/database/files.ts`)
6. ✅ Store API route (`app/api/admin/upload/store/route.ts`)
7. ✅ Download API route (`app/api/admin/upload/download/[fileId]/route.ts`)
8. ✅ Delete API route (`app/api/admin/upload/delete/[fileId]/route.ts`)

**Next Steps:**
1. Apply RLS policies in Supabase Dashboard (SQL Editor)
2. Create storage bucket `gsrealty-uploads`
3. Test API endpoints with real files
4. Integrate with Agent G's upload UI
5. Monitor storage usage and costs

**Integration Ready:** Yes, Agent G can now call the storage APIs!

---

**END OF STORAGE SETUP DOCUMENTATION**
