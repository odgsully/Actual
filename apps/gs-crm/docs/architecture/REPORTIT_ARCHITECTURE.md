# ReportIt Page - Architecture & Data Flow

## Component Hierarchy

```
AdminLayout (app/admin/layout.tsx)
└── ReportItPage (app/admin/reportit/page.tsx)
    ├── Heading & Description
    ├── Upload Cards Grid (2 columns)
    │   ├── renderUploadCard('breakups', ...)
    │   │   ├── Card
    │   │   │   ├── CardHeader
    │   │   │   │   ├── CardTitle: "Upload for Break-ups Report"
    │   │   │   │   └── CardDescription
    │   │   │   └── CardContent
    │   │   │       ├── [if status === 'idle']
    │   │   │       │   ├── Drag-Drop Area
    │   │   │       │   │   ├── Upload Icon
    │   │   │       │   │   ├── Instructions Text
    │   │   │       │   │   ├── File Input (hidden)
    │   │   │       │   │   └── Select File Button
    │   │   │       │   └── Green Ribbon (conditional)
    │   │   │       │       ├── CheckCircle Icon
    │   │   │       │       ├── File Info
    │   │   │       │       │   ├── File Name
    │   │   │       │       │   └── File Size
    │   │   │       │       └── Action Buttons
    │   │   │       │           ├── Upload & Process
    │   │   │       │           └── Cancel
    │   │   │       ├── [if status === 'uploading']
    │   │   │       │   ├── Loader2 Icon (spinning)
    │   │   │       │   ├── Progress Message
    │   │   │       │   └── Progress Bar
    │   │   │       ├── [if status === 'processing']
    │   │   │       │   ├── Loader2 Icon (spinning)
    │   │   │       │   ├── Processing Message
    │   │   │       │   └── Alert (with details)
    │   │   │       ├── [if status === 'complete']
    │   │   │       │   ├── Success Alert
    │   │   │       │   └── Action Buttons
    │   │   │       │       ├── Download Button
    │   │   │       │       └── Upload Another
    │   │   │       └── [if status === 'error']
    │   │   │           ├── Error Alert
    │   │   │           └── Try Again Button
    │   │   │
    │   └── renderUploadCard('propertyradar', ...)
    │       └── [Same structure as above]
    │
    ├── Generate Report Card (centered)
    │   └── Card
    │       └── Generate Report Button
    │
    └── Instructions Card
        └── Card
            ├── Pipeline Instructions
            ├── File Requirements List
            ├── Two Upload Options Details
            └── File Path Alert
```

---

## State Management Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        ReportItPage State                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Break-ups Section                PropertyRadar Section         │
│  ┌────────────────────┐          ┌────────────────────┐        │
│  │ selectedBreakupsFile│          │selectedPropertyRadar│       │
│  │ File | null         │          │File | null          │       │
│  └────────────────────┘          └────────────────────┘        │
│                                                                  │
│  ┌────────────────────┐          ┌────────────────────┐        │
│  │ breakupsStatus     │          │propertyRadarStatus  │       │
│  │ UploadStatus       │          │UploadStatus         │       │
│  │ {                  │          │{                    │       │
│  │   status: 'idle'   │          │  status: 'idle'     │       │
│  │   message?: string │          │  message?: string   │       │
│  │   progress?: number│          │  progress?: number  │       │
│  │   downloadUrl?     │          │  downloadUrl?       │       │
│  │ }                  │          │}                    │       │
│  └────────────────────┘          └────────────────────┘        │
│                                                                  │
│  ┌────────────────────┐          ┌────────────────────┐        │
│  │dragActiveBreakups  │          │dragActiveProperty   │       │
│  │boolean             │          │Radar: boolean       │       │
│  └────────────────────┘          └────────────────────┘        │
│                                                                  │
│  ┌────────────────────────────────────────────────────┐        │
│  │              toast (from useToast)                  │        │
│  │  Used for: Error messages, Success notifications   │        │
│  └────────────────────────────────────────────────────┘        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Event Flow Diagrams

### 1. File Selection via Click

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER CLICKS "SELECT FILE"                    │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  File Dialog Opens     │
                    │  (Browser native)      │
                    └────────────┬───────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  User Selects File     │
                    └────────────┬───────────┘
                                 │
                                 ▼
        ┌────────────────────────────────────────────┐
        │  handleFileSelect(e, type) CALLED          │
        │  - Extract: e.target.files[0]              │
        │  - Validate: file.name matches pattern     │
        └────────────┬───────────────┬───────────────┘
                     │               │
            ✅ Valid │               │ ❌ Invalid
                     │               │
                     ▼               ▼
        ┌────────────────┐   ┌──────────────────┐
        │ setSelected     │   │ toast({          │
        │ BreakupsFile    │   │   variant:       │
        │ (file)          │   │   "destructive"  │
        └────────┬───────┘   │ })               │
                 │            └──────────────────┘
                 │
                 ▼
        ┌────────────────────┐
        │ Green Ribbon       │
        │ Renders            │
        │ - File name        │
        │ - File size        │
        │ - Action buttons   │
        └────────────────────┘
```

### 2. File Selection via Drag-Drop

```
┌─────────────────────────────────────────────────────────────────┐
│                  USER DRAGS FILE OVER AREA                       │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  handleDrag(e, type)   │
                    │  Event: dragenter      │
                    │  → setDragActive(true) │
                    └────────────┬───────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  Visual Feedback:      │
                    │  border-blue-500       │
                    │  bg-blue-50            │
                    └────────────┬───────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  USER DROPS FILE       │
                    └────────────┬───────────┘
                                 │
                                 ▼
        ┌────────────────────────────────────────────┐
        │  handleDrop(e, type) CALLED                │
        │  - e.preventDefault()                      │
        │  - e.stopPropagation()                     │
        │  - setDragActive(false)                    │
        │  - Extract: e.dataTransfer.files[0]        │
        │  - Validate: file.name matches pattern     │
        └────────────┬───────────────┬───────────────┘
                     │               │
            ✅ Valid │               │ ❌ Invalid
                     │               │
                     ▼               ▼
        ┌────────────────┐   ┌──────────────────┐
        │ setSelected     │   │ toast({          │
        │ PropertyRadar   │   │   variant:       │
        │ File(file)      │   │   "destructive"  │
        └────────┬───────┘   │ })               │
                 │            └──────────────────┘
                 │
                 ▼
        ┌────────────────────┐
        │ Green Ribbon       │
        │ Renders            │
        └────────────────────┘
```

### 3. Upload & Process Flow

```
┌─────────────────────────────────────────────────────────────────┐
│            USER CLICKS "UPLOAD & PROCESS" BUTTON                 │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │ confirmAndUpload(type) │
                    │ - Get selected file    │
                    │ - Call handleFile()    │
                    └────────────┬───────────┘
                                 │
                                 ▼
        ┌────────────────────────────────────────────┐
        │          handleFile(file, type)            │
        └────────────┬───────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────────────┐
        │  STAGE 1: UPLOADING                        │
        │  - setStatus({ status: 'uploading' })      │
        │  - Start progress interval (0% → 90%)      │
        │  - Create FormData with file               │
        │  - [TODO: POST to API endpoint]            │
        │  - Simulate 2 second delay                 │
        └────────────┬───────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────────────┐
        │  STAGE 2: PROCESSING                       │
        │  - clearInterval(progressInterval)         │
        │  - setStatus({ status: 'processing' })     │
        │  - progress: 100%                          │
        │  - Show processing message                 │
        │  - Simulate 3 second processing            │
        └────────────┬───────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────────────┐
        │  STAGE 3: COMPLETE                         │
        │  - [TODO: Get download URL from API]       │
        │  - setStatus({                             │
        │      status: 'complete',                   │
        │      message: 'Success!',                  │
        │      downloadUrl: '/api/...'               │
        │    })                                      │
        │  - toast({ title: 'Success!' })            │
        └────────────┬───────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────────────┐
        │  UI Updates:                               │
        │  - Hide upload area                        │
        │  - Show success alert                      │
        │  - Show download button                    │
        │  - Show "Upload Another File" button       │
        └────────────────────────────────────────────┘
```

### 4. Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              ERROR OCCURS DURING UPLOAD/PROCESSING               │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  catch (error) block   │
                    │  in handleFile()       │
                    └────────────┬───────────┘
                                 │
                                 ▼
        ┌────────────────────────────────────────────┐
        │  - clearInterval(progressInterval)         │
        │  - setStatus({                             │
        │      status: 'error',                      │
        │      message: 'An error occurred...'       │
        │    })                                      │
        │  - toast({                                 │
        │      title: 'Error',                       │
        │      variant: 'destructive'                │
        │    })                                      │
        └────────────┬───────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────────────┐
        │  UI Updates:                               │
        │  - Hide progress bar                       │
        │  - Show red error alert                    │
        │  - Show "Try Again" button                 │
        │    → Calls resetUpload(type)               │
        └────────────────────────────────────────────┘
```

---

## Data Types

```typescript
// File state
type File = Browser File API object

// Upload status type
interface UploadStatus {
  status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error'
  message?: string
  progress?: number
  downloadUrl?: string
}

// Upload type identifier
type UploadType = 'breakups' | 'propertyradar'

// Handler function signatures
handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>, type: UploadType) => void
handleDrag: (e: React.DragEvent, type: UploadType) => void
handleDrop: (e: React.DragEvent, type: UploadType) => void
confirmAndUpload: (type: UploadType) => Promise<void>
handleFile: (file: File, type: UploadType) => Promise<void>
handleDownload: (type: UploadType) => void
resetUpload: (type: UploadType) => void
```

---

## File Validation Rules

```
FILENAME PATTERN: /Complete_.*\.xlsx$/

Valid Examples:
  ✅ Complete_Smith_2024-10-29-1200.xlsx
  ✅ Complete_Johnson_2024-01-15-0930.xlsx
  ✅ Complete_TestClient_2024-12-31-2359.xlsx
  ✅ Complete_ABC.xlsx
  ✅ Complete_123.xlsx

Invalid Examples:
  ❌ complete_smith.xlsx (lowercase 'complete')
  ❌ Smith_Complete.xlsx (wrong order)
  ❌ Complete.xlsx (missing underscore)
  ❌ Complete_Smith.xls (wrong extension)
  ❌ Complete_Smith.csv (wrong extension)
  ❌ test.xlsx (missing 'Complete_')
```

---

## API Integration Points (TODO)

```typescript
// Line 123-128: Upload Endpoint
// Current: Simulated with setTimeout
// Required: POST /api/admin/reportit/upload
// Payload: FormData with { file: File, type: 'breakups' | 'propertyradar' }
// Response: { success: boolean, fileId: string, message: string }

// Line 146-148: Download URL Generation
// Current: Static URL template
// Required: GET /api/admin/reportit/download/{type}/{fileId}
// Response: File download or { downloadUrl: string }

// Break-ups Endpoint
// Expected: /api/admin/reportit/download/breakups
// Returns: .zip file with:
//   - Enhanced Excel with 22 break-ups analyses
//   - Visualization charts (PNGs)
//   - 5 PDF reports
//   - Raw data files

// PropertyRadar Endpoint
// Expected: /api/admin/reportit/download/propertyradar
// Returns: .xlsx file with:
//   - 12 Property Radar comp columns
//   - Template format: PropertyRadar_LastName_Timestamp.xlsx
```

---

## Component Reusability

The `renderUploadCard` function is designed for reusability:

```typescript
renderUploadCard(
  type: UploadType,              // 'breakups' | 'propertyradar'
  status: UploadStatus,          // Current upload state
  dragActive: boolean,           // Drag-over visual feedback
  selectedFile: File | null,     // Currently selected file
  title: string,                 // Card title
  description: string            // Card description
)
```

This allows easy addition of more upload types in the future by:
1. Adding new state variables
2. Calling `renderUploadCard` with new parameters
3. No changes to core logic required

---

## Performance Considerations

- ✅ **useCallback** for event handlers prevents unnecessary re-renders
- ✅ **Conditional rendering** reduces DOM nodes when not needed
- ✅ **Progress interval** cleared on completion/error prevents memory leaks
- ✅ **Toast auto-dismiss** (5 seconds) prevents accumulation
- ✅ **File object** stored in state (not file contents) is memory efficient

---

## Security Considerations

- ✅ **Authentication required** via middleware
- ✅ **Admin-only route** (role-based access)
- ✅ **File type validation** (client-side)
- ⚠️ **Server-side validation required** in API (TODO)
- ⚠️ **File size limits required** in API (TODO)
- ⚠️ **Virus scanning recommended** for production (TODO)

---

## Testing Strategy

### Unit Tests (Recommended)
- Test `handleFileSelect` with valid/invalid files
- Test `handleDrop` with valid/invalid files
- Test `confirmAndUpload` calls `handleFile`
- Test `resetUpload` clears state correctly
- Test `renderUploadCard` with different statuses

### Integration Tests (Recommended)
- Test full upload flow from selection to completion
- Test error handling with failed API calls
- Test both upload sections work independently
- Test cancel functionality

### E2E Tests (Provided)
- See `test-reportit.mjs` for Playwright-based tests
- Tests complete user workflow with authentication

---

**Document Version:** 1.0
**Last Updated:** October 29, 2025
**Status:** Architecture Complete - Ready for Backend Integration
