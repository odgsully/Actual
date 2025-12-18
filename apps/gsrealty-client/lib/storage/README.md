# GSRealty Storage System

**Built by:** Agent H (File Storage System)
**Date:** October 16, 2025

---

## Quick Start

### Import Storage Functions

```typescript
import {
  // Supabase Storage
  uploadToSupabase,
  downloadFromSupabase,
  deleteFromSupabase,

  // Local Storage
  createClientFolder,
  saveFileToFolder,

  // Configuration
  STORAGE_CONFIG,
  generateFilename,
} from '@/lib/storage'
```

### Upload File Example

```typescript
import { uploadBufferToSupabase, generateStoragePath } from '@/lib/storage'

const buffer = Buffer.from('file data')
const path = generateStoragePath(clientId, 'processed', 'file.xlsx')

const { url, path, error } = await uploadBufferToSupabase(
  buffer,
  path,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
)
```

### Download File Example

```typescript
import { downloadFromSupabase } from '@/lib/storage'

const { blob, error } = await downloadFromSupabase(storagePath)
```

### Create Local Folder Example

```typescript
import { createClientFolder } from '@/lib/storage'

const { folderPath, folderName, error } = await createClientFolder(
  'Sullivan',
  new Date()
)
// Creates: "Sullivan 10.25/"
```

---

## File Structure

```
lib/storage/
├── index.ts              # Main exports (use this!)
├── config.ts             # Configuration constants
├── supabase-storage.ts   # Supabase Storage integration
├── local-storage.ts      # Local MacOS storage
└── README.md             # This file
```

---

## Storage Architecture

### Dual Storage Approach

1. **Supabase Storage (Primary)**
   - Cloud-based, permanent storage
   - Bucket: `gsrealty-uploads`
   - Secure with RLS policies

2. **Local MacOS (Backup)**
   - Path: `/Users/garrettsullivan/Desktop/‼️/RE/RealtyONE/MY LISTINGS/`
   - Format: `{LastName} {MM.YY}/`
   - Convenient local access

### Storage Path Structure

```
Supabase:
  gsrealty-uploads/
    └── clients/
        └── {clientId}/
            ├── uploads/       # Original files
            └── processed/     # Populated templates

Local:
  MY LISTINGS/
    ├── Mozingo 10.25/
    ├── Sullivan 10.24/
    └── Johnson 11.25/
```

---

## API Routes

Built-in API routes for file operations:

- **POST** `/api/admin/upload/store` - Store processed files
- **GET** `/api/admin/upload/download/[fileId]` - Download files
- **DELETE** `/api/admin/upload/delete/[fileId]` - Delete files

See `DOCUMENTATION/STORAGE_SETUP.md` for details.

---

## Key Functions

### Supabase Storage

| Function | Purpose |
|----------|---------|
| `initializeStorage()` | Create bucket if not exists |
| `uploadToSupabase(file, path)` | Upload File object |
| `uploadBufferToSupabase(buffer, path, type)` | Upload Buffer (for processed files) |
| `downloadFromSupabase(path)` | Download file as Blob |
| `createSignedUrl(path, expiry)` | Get temporary access URL |
| `deleteFromSupabase(path)` | Delete file |
| `listClientFiles(clientId)` | List all files for client |

### Local Storage

| Function | Purpose |
|----------|---------|
| `createClientFolder(lastName, date)` | Create "LastName MM.YY" folder |
| `saveFileToFolder(folderName, fileName, buffer)` | Save file to folder |
| `listLocalFiles(folderPath)` | List files in folder |
| `deleteLocalFile(folderName, fileName)` | Delete file |
| `ensureBasePathExists()` | Verify base path (call on startup) |

### Configuration

| Function | Purpose |
|----------|---------|
| `generateStoragePath(clientId, folder, filename)` | Create Supabase path |
| `generateLocalFolderName(lastName, date)` | Create folder name |
| `generateFilename(clientName, uploadType, original)` | Create unique filename |
| `isValidFileSize(size)` | Validate file size |
| `isValidFileType(mimeType)` | Validate MIME type |

---

## Database Functions

File metadata is stored in `gsrealty_uploaded_files` table.

Import from `@/lib/database/files`:

```typescript
import {
  recordFileUpload,
  getClientFiles,
  getFileById,
  updateFileStatus,
  deleteFileRecord,
} from '@/lib/database/files'
```

See `lib/database/files.ts` for all available functions.

---

## Types

Import types from `@/lib/types/storage`:

```typescript
import type {
  UploadedFile,
  FileType,
  UploadType,
  ProcessingStatus,
  UploadResult,
  DownloadResult,
} from '@/lib/types/storage'
```

---

## Configuration Constants

```typescript
import { STORAGE_CONFIG } from '@/lib/storage'

STORAGE_CONFIG.bucket            // 'gsrealty-uploads'
STORAGE_CONFIG.maxFileSize       // 10 MB
STORAGE_CONFIG.allowedTypes      // ['text/csv', 'application/vnd...']
STORAGE_CONFIG.localBasePath     // '/Users/.../MY LISTINGS/'
STORAGE_CONFIG.retentionDays     // 365
```

---

## Setup Required

### 1. Create Supabase Bucket

```typescript
import { initializeStorage } from '@/lib/storage'

await initializeStorage() // Creates 'gsrealty-uploads' bucket
```

### 2. Apply RLS Policies

Run SQL scripts from `DOCUMENTATION/STORAGE_SETUP.md` in Supabase SQL Editor.

### 3. Verify Local Path

Ensure base path exists on startup:

```typescript
import { ensureBasePathExists } from '@/lib/storage'

await ensureBasePathExists()
```

---

## Error Handling

All functions return structured results:

```typescript
{
  data: T | null,
  error: Error | null
}
```

Example:

```typescript
const { blob, error } = await downloadFromSupabase(path)

if (error) {
  console.error('Download failed:', error)
  return
}

// Use blob
```

---

## Security

### RLS Policies

- **Admins:** Full access to all files
- **Clients:** Read-only access to own files
- **Anonymous:** No access

### File Validation

- Max file size: 10 MB
- Allowed types: CSV, XLSX, HTML, PDF
- Filename sanitization

### Signed URLs

Temporary access URLs expire after 1 hour:

```typescript
const { url } = await createSignedUrl(path, 3600) // 1 hour
```

---

## Usage Examples

### Complete Upload Flow

```typescript
import {
  uploadBufferToSupabase,
  createClientFolder,
  saveFileToFolder,
  generateStoragePath,
  generateFilename,
} from '@/lib/storage'
import { recordFileUpload } from '@/lib/database/files'
import { getClientById } from '@/lib/database/clients'

async function storeProcessedFile(
  clientId: string,
  fileName: string,
  buffer: Buffer
) {
  // 1. Get client details
  const { client } = await getClientById(clientId)

  // 2. Generate paths
  const uniqueName = generateFilename(
    `${client.first_name}_${client.last_name}`,
    'processed',
    fileName
  )
  const storagePath = generateStoragePath(clientId, 'processed', uniqueName)

  // 3. Upload to Supabase
  const { url } = await uploadBufferToSupabase(
    buffer,
    storagePath,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  )

  // 4. Record in database
  const { file } = await recordFileUpload({
    clientId,
    fileName: uniqueName,
    fileType: 'xlsx',
    storagePath,
    fileSize: buffer.length,
    uploadedBy: 'admin-id',
    processingStatus: 'complete',
  })

  // 5. Save to local folder
  const { folderName } = await createClientFolder(client.last_name)
  await saveFileToFolder(folderName, uniqueName, buffer)

  return { fileId: file.id, url, folderName }
}
```

---

## Documentation

- **Setup Guide:** `DOCUMENTATION/STORAGE_SETUP.md`
- **Completion Report:** `DOCUMENTATION/AGENT_H_COMPLETION_REPORT.md`
- **API Routes:** See route files in `app/api/admin/upload/`

---

## Support

For issues or questions, refer to:
1. Setup documentation (`STORAGE_SETUP.md`)
2. Completion report (`AGENT_H_COMPLETION_REPORT.md`)
3. Code comments in source files

**Built with ❤️ by Agent H**
