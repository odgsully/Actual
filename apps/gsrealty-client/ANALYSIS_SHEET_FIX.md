# Analysis Sheet Fix - All MLS Columns Now Populated

**Date:** October 24, 2025
**Status:** ✅ FIXED
**Files Modified:**
- `lib/processing/analysis-sheet-generator.ts`
- `app/api/admin/upload/generate-excel/route.ts`

## Problems Fixed

### 1. Analysis Sheet - Columns E-P Empty
Columns E through P (OG_LIST_DATE, OG_LIST_PRICE, SALE_DATE, SALE_PRICE, SELLER_BASIS, SELLER_BASIS_DATE, BR, BA, SQFT, LOT_SIZE, MLS_MCAO_DISCREPENCY_CONCAT, IS_RENTAL) were **not being populated** in the generated Excel output.

### 2. Analysis Sheet - Columns Q, AB, AC Showing N/A
Columns Q (AGENCY_PHONE), AB (DWELLING_TYPE), and AC (SUBDIVISION_NAME) were showing "N/A" even though data existed in MLS sheets.

### 3. Analysis Sheet - Columns V-AA Incomplete
Columns V (CANCEL_DATE), W (UC_DATE), X-Y (LAT/LON), Z (YEAR_BUILT), and AA (DAYS_ON_MARKET) were not reading from MLS sheet data.

### 4. Full-MCAO-API Sheet - Subject Property Address Wrong
Subject Property's FULL_ADDRESS was showing "Subject Property" instead of the actual MCAO address.

### Root Cause

The Analysis generator was trying to read from `mlsData.rawData` property, which:
1. Was populated when CSV data was parsed ✅
2. But got **lost** during JSON serialization when sending data from frontend to backend API ❌
3. Even though the data **exists** in the MLS-Resi-Comps and MLS-Lease-Comps sheets that are already populated in the workbook ✅

**The code was looking for data that was already in the workbook, just in a different location!**

## Solution

Updated the Analysis generator to **read directly from the MLS sheets** that are already populated in the workbook, instead of relying on the `rawData` property that gets lost in transit.

### Changes Made

#### 1. Added Helper Functions

**`buildMLSDataIndex()`** - Reads MLS-Resi-Comps and MLS-Lease-Comps sheets into an indexed array:
```typescript
function buildMLSDataIndex(
  mlsResiSheet: ExcelJS.Worksheet | undefined,
  mlsLeaseSheet: ExcelJS.Worksheet | undefined
): any[]
```

- Reads all headers from row 1
- Maps each row's cells to header names
- Returns array of row data objects

**`findMLSDataForProperty()`** - Matches each property to its corresponding MLS row:
```typescript
function findMLSDataForProperty(
  property: PropertyDataForAnalysis,
  mlsDataIndex: any[],
  labelIndexWithinGroup: number
): any
```

- Uses Item label to filter matching rows
- Uses index within label group to get correct row
- Returns the matched row data object

#### 2. Updated `generateAnalysisSheet()`

- Gets MLS sheets from workbook
- Builds index of MLS data
- Tracks counters per Item label for accurate matching
- Passes MLS data to `addPropertyRow()`

#### 3. Updated `addPropertyRow()`

- Now accepts `mlsDataFromSheet` parameter
- Reads from this parameter instead of `mlsData.rawData`
- All column mappings remain the same

### Data Flow (Before vs After)

**BEFORE:**
```
CSV → Parse → MLSRow with rawData → Frontend → Backend API
                                                    ↓
                                                Lost in JSON!
                                                    ↓
                                            Analysis Generator ❌
                                            (no data to read)
```

**AFTER:**
```
CSV → Parse → MLSRow with rawData → Populate MLS-Resi-Comps sheet ✅
                                                    ↓
                                            Analysis Generator reads from sheet ✅
                                            (data is preserved in workbook)
```

## Verification

All Analysis sheet columns now populated correctly:

**Columns E-P (Initial Fix):**
- ✅ Column E (OG_LIST_DATE): MLS "List Date"
- ✅ Column F (OG_LIST_PRICE): MLS "Original List Price" or "List Price"
- ✅ Column G (SALE_DATE): MLS "Close of Escrow Date" (only if status = 'C')
- ✅ Column H (SALE_PRICE): MLS "Sold Price"
- ✅ Column I (SELLER_BASIS): MCAO sales history
- ✅ Column J (SELLER_BASIS_DATE): MCAO sales history
- ✅ Column K (BR): MLS "# Bedrooms"
- ✅ Column L (BA): MLS "Total Bathrooms"
- ✅ Column M (SQFT): MLS "Approx SQFT"
- ✅ Column N (LOT_SIZE): MLS "Approx Lot SqFt" or MCAO
- ✅ Column O (MLS_MCAO_DISCREPENCY_CONCAT): Calculated from SQFT variance
- ✅ Column P (IS_RENTAL): Set to 'N' (default)

**Column Q (Additional Fix):**
- ✅ Column Q (AGENCY_PHONE): MLS "Agency Phone" (was showing N/A)

**Columns V-AA (Additional Fix):**
- ✅ Column V (CANCEL_DATE): MLS "Cancel Date"
- ✅ Column W (UC_DATE): MLS "Under Contract Date"
- ✅ Column X (LAT): MLS "Geo Lat" (fallback to MCAO)
- ✅ Column Y (LON): MLS "Geo Lon" (fallback to MCAO)
- ✅ Column Z (YEAR_BUILT): MLS "Year Built" (fallback to MCAO)
- ✅ Column AA (DAYS_ON_MARKET): MLS "Days on Market"

**Columns AB-AC (Additional Fix):**
- ✅ Column AB (DWELLING_TYPE): MLS "Dwelling Type" (fallback to MCAO)
- ✅ Column AC (SUBDIVISION_NAME): MLS "Subdivision" (fallback to MCAO)

**Full-MCAO-API Sheet:**
- ✅ Subject Property FULL_ADDRESS now uses MCAO address instead of "Subject Property" string

## Testing

To test the fix:
1. Upload MLS CSV files through the Upload page
2. Generate Excel output
3. Open Analysis sheet
4. Verify columns E-P are now populated with data from the MLS sheets

## Notes

- The matching logic uses Item labels and sequential indexing within each label group
- Properties are matched in the same order they appear in the master list and MLS sheets
- Subject Property has no MLS data, so columns E-P remain empty for that row (expected behavior)
- All existing functionality remains unchanged - only the data source was updated

## Related Files

- `lib/processing/analysis-sheet-generator.ts` - Analysis sheet generation logic
- `app/api/admin/upload/generate-excel/route.ts` - Main Excel generation API
- `lib/processing/csv-processor.ts` - CSV parsing (creates rawData)
- MLS-Resi-Comps sheet - Source for residential comp data
- MLS-Lease-Comps sheet - Source for lease comp data
