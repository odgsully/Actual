# PropertyRadar Template Split - October 24, 2025

> **Note (Feb 2026):** RENOVATE_SCORE upgraded from Y/N/0.5 to 1-10 numeric + RENO_YEAR_EST.
> Vision AI auto-scoring via FlexMLS PDF pipeline now available. See
> `docs/calibration/` for current schema and `docs/reference/vision-scoring-pipeline.md`
> for the AI pipeline reference.

## Overview

Property Radar columns (formerly AD-AO in Analysis sheet) have been moved to a separate Excel template and download option. This provides a cleaner Upload output and dedicated PropertyRadar workflow.

## Changes Made

### 1. Analysis Sheet Template Updated ✅
**File:** `gsrealty-client-template.xlsx`

**Removed Columns:**
- AD through AO (Property-Radar-comp-1 through 12)

**New Column Count:**
- Before: 41 columns (A-AO with headers ending at AC)
- After: 29 columns (A-AC)

**Remaining Columns:**
- A: ITEM
- B-AC: All MLS and MCAO data fields
- Analysis now ends at AC (SUBDIVISION_NAME)

### 2. New PropertyRadar Template Created ✅
**File:** `Upload-template-PropertyRadar.xlsx`

**Structure:**
- Single sheet: "Sheet1"
- 12 columns (A-L): Property-Radar-comp-1 through 12
- Template format matches the removed Analysis columns AD-AO

### 3. Code Updates ✅

**A. Analysis Sheet Generator** (`lib/processing/analysis-sheet-generator.ts`)
- Removed Property Radar column definitions from `ANALYSIS_COLUMNS` constant
- Removed Property Radar headers from header array (AD-AO)
- Removed Property Radar column generation loop
- Removed Property Radar column width settings
- Updated comments to reference separate PropertyRadar template

**B. PropertyRadar Generator Created** (`lib/processing/propertyradar-generator.ts`)
- New module for generating PropertyRadar Excel files
- `generatePropertyRadarExcel()`: Reads Complete file, extracts Property Radar data
- Reads from Analysis sheet columns AD-AO (if they exist in uploaded Complete files)
- Outputs to PropertyRadar template format (A-L)
- `generatePropertyRadarFilename()`: Creates filename PropertyRadar_LastName_Timestamp.xlsx
- Handles missing data gracefully (returns empty template)

### 4. ReportIt UI Updated ✅
**File:** `app/admin/reportit/page.tsx`

**Interface Changes:**
- Added `propertyRadarUrl` to UploadStatus interface

**UI Changes:**
- Two download buttons when processing complete:
  1. "Download Break-ups Report (.zip)" - Main report (primary button)
  2. "Download PropertyRadar (.xlsx)" - Property Radar file (secondary button)
- Updated upload instructions:
  - Changed from "Property Radar columns (S, AD-AO)" to "Property Radar column (S)"
  - Updated sheet list: MLS-Resi-Comps, MLS-Lease-Comps, Full-MCAO-API, Analysis
- Added "Output includes TWO downloads" section explaining both files

## Workflow

### Upload Flow (Main Template)
1. User uploads MLS CSV files via `/admin/upload`
2. System generates `Upload_LastName_Timestamp.xlsx` with Analysis sheet (A-AC)
3. Analysis sheet now ends at column AC (no more AD-AO)

### ReportIt Flow (Complete File Processing)
1. User fills in RENOVATE_SCORE (column R) and Property Radar Y/N (column S)
2. Uploads Complete file to `/admin/reportit`
3. System processes and generates TWO outputs:
   - **Break-ups Report (.zip)**: Complete analysis package
   - **PropertyRadar File (.xlsx)**: Separate Property Radar template

### PropertyRadar Generation
**Input:** Complete_LastName_Timestamp.xlsx
- Reads Analysis sheet
- Extracts data from columns AD-AO (if present from old files)
- Or provides empty template for manual entry

**Output:** PropertyRadar_LastName_Timestamp.xlsx
- 12 columns (A-L) for Property Radar comps
- Ready for manual data entry

## Template Locations

```
apps/gsrealty-client/
├── gsrealty-client-template.xlsx        # Main template (29 columns A-AC)
└── Upload-template-PropertyRadar.xlsx   # PropertyRadar template (12 columns A-L)
```

## API Endpoints (To Be Implemented)

**Note:** Current ReportIt implementation uses placeholder/TODO code. These endpoints need to be created:

1. `/api/admin/reportit/upload` - Upload Complete file
2. `/api/admin/reportit/download/breakups` - Download break-ups report
3. `/api/admin/reportit/download/propertyradar` - Download PropertyRadar file

## Migration Notes

### For Existing Complete Files
- Old Complete files may have Property Radar data in columns AD-AO
- PropertyRadar generator can extract this data
- New Complete files will not have AD-AO (only A-AC)

### For New Workflows
1. Analysis sheet ends at AC
2. Property Radar is a separate download
3. Users fill in PropertyRadar file manually after ReportIt processing

## Benefits

### Cleaner Upload Output
- Analysis sheet focused on core property data
- No empty Property Radar columns for properties that don't need them

### Dedicated PropertyRadar Workflow
- Separate file for Property Radar comps
- Easier to share and track
- Clear distinction between automated and manual data

### Flexibility
- Users can choose to download PropertyRadar file only when needed
- Property Radar tracking independent of main analysis

## Related Files

- `lib/processing/analysis-sheet-generator.ts` - Analysis sheet generation (updated)
- `lib/processing/propertyradar-generator.ts` - PropertyRadar file generation (new)
- `app/admin/reportit/page.tsx` - ReportIt UI (updated)
- `ANALYSIS_SHEET_FIX.md` - Related Analysis sheet fixes

## Testing

To test the changes:

1. **Upload Flow:**
   - Upload MLS CSVs via `/admin/upload`
   - Download generated Upload file
   - Verify Analysis sheet ends at column AC
   - Verify no AD-AO columns

2. **ReportIt Flow** (when implemented):
   - Upload Complete file via `/admin/reportit`
   - Verify two download buttons appear
   - Download both files
   - Verify Break-ups report contains analysis
   - Verify PropertyRadar file has 12 columns (A-L)

## Next Steps

1. ✅ Analysis sheet generator updated
2. ✅ PropertyRadar generator created
3. ✅ ReportIt UI updated
4. ⏳ Implement ReportIt API endpoints
5. ⏳ Wire up PropertyRadar generator to ReportIt API
6. ⏳ Test end-to-end workflow
7. ⏳ Update user documentation
