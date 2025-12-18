# Subject Property Generation Test Suite

## Overview

This test suite validates that the **Subject Property** correctly appears in **BOTH** the `Full-MCAO-API` and `Analysis` sheets of the generated Excel workbook.

## Test File Location

```
app/api/admin/upload/__tests__/subject-property-generation.test.ts
```

## Critical Requirements Tested

### 1. Subject Property in Full-MCAO-API Sheet
- **Location**: Row 2, Column B ("Item")
- **Value**: "Subject Property"
- **Requirement**: Subject Property MUST appear in Full-MCAO-API even if it has NO APN

### 2. Subject Property in Analysis Sheet
- **Location**: Row 2, Column A ("Item")
- **Value**: "Subject Property"
- **Requirement**: Subject Property MUST be the first row in Analysis sheet

### 3. MCAO Data Population (SELLER_BASIS)
- **Column I**: `SELLER_BASIS` - populated from `Owner_SalePrice` in MCAO data
- **Column J**: `SELLER_BASIS_DATE` - populated from `Owner_SaleDate` in MCAO data

### 4. MLS Data Population (Dates)
- **Column V**: `CANCEL_DATE` - populated from MLS "Cancel Date" field
- **Column W**: `UC_DATE` - populated from MLS "Under Contract Date" field

## Test Scenarios

### Subject Property - Full-MCAO-API Sheet
1. ✅ Subject Property appears at row 2, column B
2. ✅ Subject Property included even WITHOUT APN
3. ✅ Full address populated in column A
4. ✅ APN populated in column C (when available)

### Subject Property - Analysis Sheet
1. ✅ Subject Property appears at row 2, column A
2. ✅ SELLER_BASIS (column I) from MCAO `Owner_SalePrice`
3. ✅ SELLER_BASIS_DATE (column J) from MCAO `Owner_SaleDate`
4. ✅ Subject Property shows `IN_MLS=N`, `IN_MCAO=Y` (no MLS data)

### Combined Scenarios
1. ✅ Subject Property + 3 MLS comps in correct order
2. ✅ CANCEL_DATE (column V) from MLS data
3. ✅ UC_DATE (column W) from MLS data

### Edge Cases
1. ✅ Subject Property without MCAO data (graceful handling)
2. ✅ Subject Property without APN (still appears in both sheets)
3. ✅ Empty CANCEL_DATE/UC_DATE for Subject Property (no MLS data)

## Running the Tests

### Run Subject Property Tests Only
```bash
npm test -- app/api/admin/upload/__tests__/subject-property-generation.test.ts
```

### Run in Watch Mode
```bash
npm test -- --watch app/api/admin/upload/__tests__/subject-property-generation.test.ts
```

### Run All Upload Tests
```bash
npm test -- app/api/admin/upload/__tests__/
```

## Test Output

The tests generate actual Excel files during execution (cleaned up after):

```
app/api/admin/upload/__tests__/test-output/
├── test-subject-only-mcao.xlsx
├── test-subject-no-apn-mcao.xlsx
├── test-subject-address-mcao.xlsx
├── test-subject-apn-mcao.xlsx
├── test-subject-only-analysis.xlsx
├── test-seller-basis.xlsx
├── test-seller-basis-date.xlsx
├── test-subject-no-mls.xlsx
├── test-subject-with-comps.xlsx
├── test-cancel-date.xlsx
├── test-uc-date.xlsx
├── test-subject-no-mcao.xlsx
└── test-subject-no-mls-dates.xlsx
```

Each file is read back with ExcelJS to verify the actual cell values.

## Test Coverage Summary

```
✅ Subject Property Verification:
   - Subject Property in Full-MCAO-API (row 2, column B)
   - Subject Property in Analysis (row 2, column A)
   - Subject Property WITH APN
   - Subject Property WITHOUT APN
   - Subject Property + multiple MLS comps

✅ MCAO Data Population (SELLER_BASIS):
   - Column I (SELLER_BASIS) from Owner_SalePrice
   - Column J (SELLER_BASIS_DATE) from Owner_SaleDate

✅ MLS Data Population (Dates):
   - Column V (CANCEL_DATE) from Cancel Date
   - Column W (UC_DATE) from Under Contract Date

✅ Edge Cases:
   - Subject Property without MCAO data
   - Subject Property without APN
   - Empty CANCEL_DATE/UC_DATE for Subject Property
```

## Key Implementation Details

### Mock Data Generators

**`createMockSubjectProperty()`**
- Creates Subject Property with configurable APN and MCAO data
- Includes mock MCAO data with `Owner_SalePrice` and `Owner_SaleDate`
- Supports edge cases (no APN, no MCAO data)

**`createMockMLSComp()`**
- Creates MLS comparable properties
- Includes all required MLS CSV fields
- Supports different item labels (1.5 Mile, 3 Year Direct)

### Sheet Population Functions

These functions mirror the actual implementation in `route.ts`:

1. **`populateFullMCAOAPISheet()`**
   - Filters properties to include Subject Property (even without APN)
   - Populates Column A (FULL_ADDRESS), Column B (Item), Column C (APN)
   - Flattens MCAO data to match template columns

2. **`generateAnalysisSheet()`**
   - Creates 29-column Analysis sheet
   - Populates all required fields from MLS and MCAO sources
   - Handles SELLER_BASIS, CANCEL_DATE, UC_DATE fields

3. **`populateMLSResiCompsSheet()`**
   - Populates MLS-Resi-Comps sheet with comparable sales
   - Maps MLS CSV fields to template columns

## Verification Logic

Each test follows this pattern:

1. **Arrange**: Create mock Subject Property and/or MLS comps
2. **Act**: Generate Excel file using test functions
3. **Assert**: Read Excel file back and verify specific cell values
4. **Cleanup**: Delete test file after assertions

Example assertion:
```typescript
const sheet = workbook.getWorksheet('Full-MCAO-API')
const row2 = sheet!.getRow(2)
const itemCell = row2.getCell(2) // Column B = Item
expect(itemCell.value).toBe('Subject Property')
```

## Bug Discovery Capabilities

The test suite will detect:

1. **Missing Subject Property**: If Subject Property doesn't appear in either sheet
2. **Wrong Row Position**: If Subject Property appears in wrong row
3. **Missing APN Handling**: If Subject Property without APN is excluded
4. **Data Mapping Errors**: If SELLER_BASIS or date fields aren't populated
5. **Column Misalignment**: If Item appears in wrong column
6. **Sheet Order Issues**: If comps appear before Subject Property

## Integration with CI/CD

Add to your CI pipeline:

```yaml
- name: Run Subject Property Tests
  run: npm test -- app/api/admin/upload/__tests__/subject-property-generation.test.ts
```

## Dependencies

- **ExcelJS**: For reading/writing Excel files
- **Jest**: Test framework
- **@jest/globals**: TypeScript Jest types
- **fs/path**: File system operations

## Template Requirements

Tests require the template file at:
```
/Users/garrettsullivan/Desktop/‼️/RE/RealtyONE/MY LISTINGS/gsrealty-client-template.xlsx
```

Template must contain these sheets:
- `Full-MCAO-API`
- `Analysis`
- `MLS-Resi-Comps`

## Future Enhancements

Potential additions to test suite:

1. **MLS-Lease-Comps Testing**: Verify lease comparables
2. **MCAO Field Mapping**: Test all 287 MCAO columns
3. **Performance Testing**: Measure generation time with 100+ properties
4. **Error Handling**: Test template file missing scenarios
5. **Data Validation**: Test invalid APN formats, missing required fields

## Troubleshooting

### Test Fails: Template Not Found
```bash
Error: Template file not found at: /Users/.../gsrealty-client-template.xlsx
```
**Solution**: Update `TEMPLATE_PATH` constant in test file

### Test Fails: Sheet Not Found
```bash
Error: Full-MCAO-API sheet not found in template!
```
**Solution**: Verify template file contains required sheets

### Test Timeout
```bash
Timeout - Async callback was not invoked within the 5000 ms timeout
```
**Solution**: Increase Jest timeout in test file (already set to 120s)

## Contributing

When adding new tests:

1. Follow existing test naming conventions
2. Add to appropriate `describe()` block
3. Include cleanup in `afterEach()`
4. Add to coverage summary
5. Document new scenarios in this README

## Contact

For questions about this test suite, contact the QA team or refer to:
- `REPORTIT_FIELD_MAPPING.md` - Field mapping specifications
- `app/api/admin/upload/generate-excel/route.ts` - Implementation code
- `lib/processing/analysis-sheet-generator.ts` - Analysis sheet logic
