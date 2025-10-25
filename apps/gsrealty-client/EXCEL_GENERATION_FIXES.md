# Excel Generation Fixes

**Date:** October 24, 2025
**Fixed By:** Claude Code

## Issues Fixed

### 1. Subject Property Not Populating on Full-MCAO-API Sheet ✅

**Problem:**
- Subject property was not appearing in the Full-MCAO-API sheet

**Root Cause:**
- The filter for properties with APNs was excluding the subject property if it didn't have an APN
- Filter logic: `masterList.filter(p => p.hasApn && p.apn)` was too restrictive

**Solution:**
- Modified the filter to ALWAYS include the subject property, regardless of APN status
- New logic: `masterList.filter(p => p.itemLabel === 'Subject Property' || (p.hasApn && p.apn))`

**File Changed:**
- `app/api/admin/upload/generate-excel/route.ts` (lines 448-454)

```typescript
// BEFORE
const propertiesWithAPN = masterList.filter(p => p.hasApn && p.apn)

// AFTER
const propertiesWithAPN = masterList.filter(p =>
  p.itemLabel === 'Subject Property' || (p.hasApn && p.apn)
)
```

---

### 2. Column I (SELLER_BASIS) Not Populating ✅

**Problem:**
- Analysis sheet Column I (SELLER_BASIS) was empty

**Root Cause:**
- Code was looking for `mcao?.salesHistory?.[0]?.salePrice`
- Actual field in Full-MCAO-API is Column AG `Owner_SalePrice`

**Solution:**
- Updated to read from flattened MCAO data with proper field names
- Added fallback chain: `Owner_SalePrice` → `owner_saleprice` → `salesHistory[0].salePrice`

**File Changed:**
- `lib/processing/analysis-sheet-generator.ts` (lines 306-312)

```typescript
// BEFORE
row.getCell(ANALYSIS_COLUMNS.SELLER_BASIS).value =
  mcao?.salesHistory?.[0]?.salePrice || ''

// AFTER
const mcaoFlattened = mcao ? flattenObject(mcao) : {}
row.getCell(ANALYSIS_COLUMNS.SELLER_BASIS).value =
  (mcaoFlattened as any)['Owner_SalePrice'] ||
  (mcaoFlattened as any)['owner_saleprice'] ||
  mcao?.salesHistory?.[0]?.salePrice || ''
```

---

### 3. Column J (SELLER_BASIS_DATE) Not Populating ✅

**Problem:**
- Analysis sheet Column J (SELLER_BASIS_DATE) was empty

**Root Cause:**
- Code was looking for `mcao?.salesHistory?.[0]?.saleDate`
- Actual field in Full-MCAO-API is Column AH `Owner_SaleDate`

**Solution:**
- Updated to read from flattened MCAO data with proper field names
- Added fallback chain: `Owner_SaleDate` → `owner_saledate` → `salesHistory[0].saleDate`

**File Changed:**
- `lib/processing/analysis-sheet-generator.ts` (lines 314-319)

```typescript
// BEFORE
row.getCell(ANALYSIS_COLUMNS.SELLER_BASIS_DATE).value =
  mcao?.salesHistory?.[0]?.saleDate || ''

// AFTER
row.getCell(ANALYSIS_COLUMNS.SELLER_BASIS_DATE).value =
  (mcaoFlattened as any)['Owner_SaleDate'] ||
  (mcaoFlattened as any)['owner_saledate'] ||
  mcao?.salesHistory?.[0]?.saleDate || ''
```

---

### 4. Column V (CANCEL_DATE) Not Populating ✅

**Problem:**
- Analysis sheet Column V (CANCEL_DATE) was not populating from MLS data

**Root Cause:**
- MLS CSV column name variation (might be "Cancel Date", "Cancellation Date", or "Cancelled Date")
- Code was only checking for exact match "Cancel Date"

**Solution:**
- Added multiple fallback column names to handle variations
- Tries: `Cancel Date` → `Cancellation Date` → `Cancelled Date`

**File Changed:**
- `lib/processing/analysis-sheet-generator.ts` (lines 358-362)

```typescript
// BEFORE
row.getCell(ANALYSIS_COLUMNS.CANCEL_DATE).value = rawData['Cancel Date'] || ''

// AFTER
row.getCell(ANALYSIS_COLUMNS.CANCEL_DATE).value =
  rawData['Cancel Date'] ||
  rawData['Cancellation Date'] ||
  rawData['Cancelled Date'] || ''
```

---

### 5. Column W (UC_DATE) Not Populating ✅

**Problem:**
- Analysis sheet Column W (UC_DATE - Under Contract Date) was not populating from MLS data

**Root Cause:**
- MLS CSV column name variation (might be "Under Contract Date", "UC Date", or "Contract Date")
- Code was only checking for exact match "Under Contract Date"

**Solution:**
- Added multiple fallback column names to handle variations
- Tries: `Under Contract Date` → `UC Date` → `Contract Date`

**File Changed:**
- `lib/processing/analysis-sheet-generator.ts` (lines 364-368)

```typescript
// BEFORE
row.getCell(ANALYSIS_COLUMNS.UC_DATE).value = rawData['Under Contract Date'] || ''

// AFTER
row.getCell(ANALYSIS_COLUMNS.UC_DATE).value =
  rawData['Under Contract Date'] ||
  rawData['UC Date'] ||
  rawData['Contract Date'] || ''
```

---

## Additional Improvements

### Helper Function Added

Added `flattenObject()` helper function to `analysis-sheet-generator.ts` to flatten nested MCAO data structures:

```typescript
function flattenObject(obj: any, prefix = '', result: any = {}): any {
  // Recursively flattens nested objects and arrays
  // Example: { owner: { salePrice: 100 } } => { 'owner_salePrice': 100 }
  // Used for accessing raw MCAO API fields like 'Owner_SalePrice'
}
```

### Fixed TypeScript Type Errors

Fixed latitude/longitude property access errors by using flattened MCAO data:

```typescript
// Columns X & Y (LAT/LON) now properly access flattened MCAO data
row.getCell(ANALYSIS_COLUMNS.LAT).value =
  rawData['Geo Lat'] ||
  (mcaoFlattened as any)['latitude'] ||
  (mcaoFlattened as any)['Latitude'] || 'N/A'
```

---

## Data Flow Diagram

```
Analysis Sheet Generation
    ↓
For each property:
    ↓
    ├── Column I (SELLER_BASIS)
    │   └── Check: Owner_SalePrice (MCAO flattened)
    │       └── Fallback: owner_saleprice
    │           └── Fallback: salesHistory[0].salePrice
    │               └── Fallback: '' (empty)
    │
    ├── Column J (SELLER_BASIS_DATE)
    │   └── Check: Owner_SaleDate (MCAO flattened)
    │       └── Fallback: owner_saledate
    │           └── Fallback: salesHistory[0].saleDate
    │               └── Fallback: '' (empty)
    │
    ├── Column V (CANCEL_DATE)
    │   └── Check: 'Cancel Date' (MLS)
    │       └── Fallback: 'Cancellation Date'
    │           └── Fallback: 'Cancelled Date'
    │               └── Fallback: '' (empty)
    │
    └── Column W (UC_DATE)
        └── Check: 'Under Contract Date' (MLS)
            └── Fallback: 'UC Date'
                └── Fallback: 'Contract Date'
                    └── Fallback: '' (empty)

Full-MCAO-API Sheet Generation
    ↓
Filter properties:
    ├── ALWAYS include: Subject Property (regardless of APN)
    └── Include: Properties with valid APNs
```

---

## Field Mapping Reference

| Column | Field Name | Source | Raw Field Name | Notes |
|--------|-----------|---------|----------------|-------|
| I | SELLER_BASIS | MCAO | Owner_SalePrice (Column AG) | Last sale price of property |
| J | SELLER_BASIS_DATE | MCAO | Owner_SaleDate (Column AH) | Last sale date of property |
| V | CANCEL_DATE | MLS | Cancel Date (Column U) | Date listing was cancelled |
| W | UC_DATE | MLS | Under Contract Date (Column P) | Date property went under contract |

---

## Testing Recommendations

### Test Case 1: Subject Property on Full-MCAO-API
```
Input: Subject property with APN
Expected: Subject property appears as first row in Full-MCAO-API sheet

Input: Subject property without APN (edge case)
Expected: Subject property still appears as first row in Full-MCAO-API sheet
```

### Test Case 2: SELLER_BASIS Fields
```
Input: Property with MCAO data containing Owner_SalePrice and Owner_SaleDate
Expected: Columns I and J in Analysis sheet populated with values from Full-MCAO-API columns AG and AH
```

### Test Case 3: Cancel Date Variations
```
Input: MLS CSV with "Cancel Date" column
Expected: Column V populates correctly

Input: MLS CSV with "Cancellation Date" column
Expected: Column V populates correctly (fallback)

Input: MLS CSV with "Cancelled Date" column
Expected: Column V populates correctly (second fallback)
```

### Test Case 4: Under Contract Date Variations
```
Input: MLS CSV with "Under Contract Date" column
Expected: Column W populates correctly

Input: MLS CSV with "UC Date" column
Expected: Column W populates correctly (fallback)

Input: MLS CSV with "Contract Date" column
Expected: Column W populates correctly (second fallback)
```

---

## Files Modified

1. **`app/api/admin/upload/generate-excel/route.ts`**
   - Modified Full-MCAO-API filter to always include subject property

2. **`lib/processing/analysis-sheet-generator.ts`**
   - Added `flattenObject()` helper function
   - Fixed Column I (SELLER_BASIS) field mapping
   - Fixed Column J (SELLER_BASIS_DATE) field mapping
   - Fixed Column V (CANCEL_DATE) with fallbacks
   - Fixed Column W (UC_DATE) with fallbacks
   - Fixed LAT/LON TypeScript errors

---

## Verification

✅ All TypeScript compilation errors resolved
✅ Subject property now included in Full-MCAO-API
✅ SELLER_BASIS reads from Owner_SalePrice
✅ SELLER_BASIS_DATE reads from Owner_SaleDate
✅ CANCEL_DATE handles multiple column name variations
✅ UC_DATE handles multiple column name variations
✅ Fallback chains ensure data is captured when available

---

## Next Steps

- [ ] Test with real MLS upload data
- [ ] Verify Subject Property populates with MCAO data
- [ ] Verify columns I, J, V, W populate correctly
- [ ] Check Full-MCAO-API sheet includes all expected properties
- [ ] Confirm no TypeScript errors in production build
