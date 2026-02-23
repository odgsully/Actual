# ReportIt Field Mapping Specification

**Project:** GSRealty Client Management System - ReportIt Feature
**Purpose:** Detailed field mapping for Analysis sheet generation
**Created:** October 23, 2024
**Version:** 1.0

---

## Overview

This document provides comprehensive field mapping specifications for the ReportIt Analysis sheet. The Analysis sheet consolidates data from multiple sources (MLS-Comps and Full-MCAO-API) into a unified 40-column format for property analysis.

**Key Principle:** Column A is reserved for source identification, all data fields start from Column B onward.

---

## Source Data Sheets

### 1. MLS-Comps Sheet
**Source:** Combined data from 4 MLS uploads
- Residential 1.5mile-comps (T-12 months)
- Residential Lease 1.5mile-comps (T-12 months)
- Residential 3yr-direct-subdivision-comps (T-36 months)
- Residential Lease 3yr-direct-subdivision-comps (T-36 months)

**Structure:**
- Column A: Reserved for manual notes (blank on import)
- Column B+: MLS data fields

### 2. Full-MCAO-API Sheet
**Source:** MCAO API response data
**Structure:**
- Column A: "Item" field for manual notes
- Column B+: MCAO response fields

---

## Analysis Sheet Field Mapping (40 Columns)

### Column Definitions

#### Column A: Item
- **Field Name:** Item
- **Source:** UI Input
- **Type:** String
- **Description:** Source identifier for the data row
- **Values:** "1.5mi", "direct", "residential", "lease"
- **Logic:** Populated based on which MLS upload file the row originated from

#### Column B: FULL_ADDRESS
- **Field Name:** FULL_ADDRESS
- **Source:** MCAO
- **MCAO Field:** Column D 'PropertyAddress'
- **Type:** String
- **Format:** "4600 N 68TH ST UNIT 371"
- **Fallback:** If MCAO unavailable, construct from MLS address fields

#### Column C: APN
- **Field Name:** APN
- **Source:** MCAO
- **MCAO Field:** Column KA 'APN'
- **Type:** String
- **Format:** "173-35-524"
- **Validation:** Must match pattern XXX-XX-XXX

#### Column D: STATUS
- **Field Name:** STATUS
- **Source:** MLS
- **MLS Field:** Column R 'Status'
- **Type:** String
- **Values:**
  - "A" = Active
  - "C" = Closed
  - "P" = Pending
  - "CS" = Coming Soon
  - "X" = Cancelled
  - "AB" = Accepting Backups
- **Default:** "N/A" if not in MLS

#### Column E: OG_LIST_DATE
- **Field Name:** OG_LIST_DATE
- **Source:** MLS
- **MLS Field:** Column N 'List Date'
- **Type:** Date
- **Format:** "YYYY-MM-DD"
- **Default:** "N/A" if not listed

#### Column F: OG_LIST_PRICE
- **Field Name:** OG_LIST_PRICE
- **Source:** MLS
- **MLS Field:** Column W 'Original List Price'
- **Type:** Currency
- **Format:** Numeric (no symbols)
- **Default:** "N/A" if never listed

#### Column G: SALE_DATE
- **Field Name:** SALE_DATE
- **Source:** MLS (Conditional)
- **MLS Field:** Column T 'Status Change Date'
- **Type:** Date
- **Logic:** Only populate if Column R 'Status' = "C" (Closed)
- **Format:** "YYYY-MM-DD"
- **Default:** "N/A" if not sold

#### Column H: SALE_PRICE
- **Field Name:** SALE_PRICE
- **Source:** MLS
- **MLS Field:** Column Y 'Sold Price'
- **Type:** Currency
- **Format:** Numeric (no symbols)
- **Default:** "N/A" if not sold

#### Column I: SELLER_BASIS
- **Field Name:** SELLER_BASIS
- **Source:** MCAO
- **MCAO Field:** Column AG 'Owner_SalePrice'
- **Type:** Currency
- **Description:** Previous purchase price from MCAO records
- **Format:** Numeric (no symbols)

#### Column J: SELLER_BASIS_DATE
- **Field Name:** SELLER_BASIS_DATE
- **Source:** MCAO
- **MCAO Field:** Column AH 'Owner_SaleDate'
- **Type:** Date
- **Format:** "YYYY-MM-DD"
- **Description:** Date of previous purchase

#### Column K: BR
- **Field Name:** BR
- **Source:** MLS
- **MLS Field:** Column AS '# Bedrooms'
- **Type:** Integer
- **Range:** 0-10
- **Default:** "N/A" if not available

#### Column L: BA
- **Field Name:** BA
- **Source:** MLS
- **MLS Field:** Column AT 'Total Bathrooms'
- **Type:** Decimal
- **Format:** X.X (e.g., "2.5")
- **Default:** "N/A" if not available

#### Column M: SQFT
- **Field Name:** SQFT
- **Source:** EITHER (MLS preferred, MCAO fallback)
- **Priority Logic:**
  1. First check MLS Column AP 'Approx SQFT'
  2. If MLS unavailable, use MCAO Column EW 'ResidentialPropertyData_LivableSpace'
- **Type:** Integer
- **Confidence:** Use Alignment.md confidence scoring
- **Default:** "N/A" if both unavailable

#### Column N: LOT_SIZE
- **Field Name:** LOT_SIZE
- **Source:** MCAO
- **MCAO Field:** 'LotSquareFootage'
- **Type:** Integer
- **Unit:** Square feet
- **Default:** "N/A" if not available

#### Column O: MLS_MCAO_DISCREPENCY_CONCAT
- **Field Name:** MLS_MCAO_DISCREPENCY_CONCAT
- **Source:** CALCULATED
- **Type:** String
- **Logic:**
  ```javascript
  function calculateDiscrepancy(mlsSqft, mcaoSqft) {
    if (!mlsSqft || !mcaoSqft) return "";

    const difference = Math.abs(mlsSqft - mcaoSqft);
    const percentDiff = (difference / mlsSqft) * 100;

    if (percentDiff > 5) {
      return `SQFT_VARIANCE_${percentDiff.toFixed(1)}%`;
    }
    return "";
  }
  ```
- **Format:** "SQFT_VARIANCE_X.X%"

#### Column P: IS_RENTAL
- **Field Name:** IS_RENTAL
- **Source:** MCAO
- **MCAO Field:** Column AO 'IsRental'
- **Type:** Boolean
- **Values:** "Y" or "N"
- **Default:** "N" if not specified

#### Column Q: AGENCY_PHONE
- **Field Name:** AGENCY_PHONE
- **Source:** MLS
- **MLS Field:** Column D 'Agency Phone'
- **Type:** String
- **Format:** "XXX-XXX-XXXX"
- **Default:** "N/A" if not available

#### Column R: RENOVATE_SCORE
- **Field Name:** RENOVATE_SCORE
- **Source:** MANUAL
- **Type:** Number
- **Values:** Integer 1-10 (legacy Y/N/0.5 auto-coerced: Y→7, 0.5→5, N→2)
- **Tiers:** High (7-10), Mid (4-6), Low (1-3)
- **Description:** Manual entry field - left blank for initial upload
- **Note:** User enters this value manually in Excel before ReportIt upload

#### Column S: PROPERTY_RADAR-COMP-Y-N
- **Field Name:** PROPERTY_RADAR-COMP-Y-N
- **Source:** MANUAL
- **Type:** String
- **Values:** "Y" or "N"
- **Description:** Whether property is a Property Radar comp
- **Note:** Left blank for initial upload

#### Column T: IN_MLS?
- **Field Name:** IN_MLS?
- **Source:** CALCULATED
- **Type:** String
- **Values:** "Y" or "N"
- **Logic:** "Y" if property found in MLS data, "N" otherwise

#### Column U: IN_MCAO?
- **Field Name:** IN_MCAO?
- **Source:** CALCULATED
- **Type:** String
- **Values:** "Y" or "N"
- **Logic:** "Y" if property found in MCAO data, "N" otherwise

#### Column V: CANCEL_DATE
- **Field Name:** CANCEL_DATE
- **Source:** MLS
- **MLS Field:** Column U 'Cancel Date'
- **Type:** Date
- **Format:** "YYYY-MM-DD"
- **Default:** "N/A" if never cancelled

#### Column W: UC_DATE
- **Field Name:** UC_DATE
- **Source:** MLS
- **MLS Field:** Column P 'Under Contract Date'
- **Type:** Date
- **Format:** "YYYY-MM-DD"
- **Default:** "N/A" if never under contract

#### Column X: LAT
- **Field Name:** LAT
- **Source:** EITHER (MLS preferred, MCAO fallback)
- **Priority Logic:**
  1. First check MLS Column AN 'Geo Lat'
  2. If MLS unavailable, use MCAO Column AL 'Geo_lat'
- **Type:** Decimal
- **Format:** XX.XXXXXX (6 decimal places)
- **Range:** 33.0 to 34.0 (Maricopa County)

#### Column Y: LON
- **Field Name:** LON
- **Source:** EITHER (MLS preferred, MCAO fallback)
- **Priority Logic:**
  1. First check MLS Column AO 'Geo Lon'
  2. If MLS unavailable, use MCAO Column AM 'Geo_long'
- **Type:** Decimal
- **Format:** -XXX.XXXXXX (6 decimal places)
- **Range:** -113.0 to -111.0 (Maricopa County)

#### Column Z: YEAR_BUILT
- **Field Name:** YEAR_BUILT
- **Source:** MLS
- **MLS Field:** Column AR 'Year Built'
- **Type:** Integer
- **Range:** 1900-2024
- **Default:** "N/A" if not available

#### Column AA: DAYS_ON_MARKET
- **Field Name:** DAYS_ON_MARKET
- **Source:** MLS
- **MLS Field:** Column CT 'Days on Market'
- **Type:** Integer
- **Range:** 0-999
- **Default:** "N/A" if not listed

#### Column AB: DWELLING_TYPE
- **Field Name:** DWELLING_TYPE
- **Source:** MLS / MCAO (varies by CSV type)
- **Type:** String
- **Values:** "Single Family", "Condo", "Townhouse", "Mobile Home", etc.
- **Residential CSVs:** Sourced from MLS field `Dwelling Type`
- **Multifamily CSVs:** Derived from `Property Type` + `Total # of Units`
- **Fallback:** MCAO Column Q 'PropertyType'

#### Column AC: SUBDIVISION_NAME
- **Field Name:** SUBDIVISION_NAME
- **Source:** MCAO
- **MCAO Field:** Column L 'SubdivisionName'
- **Type:** String
- **Example:** "CAMELBACK HOUSE"

#### Column AD: RENO_YEAR_EST
- **Field Name:** RENO_YEAR_EST
- **Source:** MANUAL
- **Type:** Number
- **Values:** Integer year (e.g., 2022) or null
- **Description:** Estimated year of most recent renovation. Used with RENOVATE_SCORE for 2D NOI multiplier lookup (Score x Recency).
- **Recency buckets:** Fresh (<=3yr), Mid (4-10yr), Dated (>10yr)
- **Note:** Left blank for initial upload; blank defaults to 'Mid' recency (neutral)

#### Columns AE-AP: Property Radar Comparisons (Manual)
- **Column AE:** Property-Radar-comp-1
- **Column AF:** Property-Radar-comp-2
- **Column AG:** Property-Radar-comp-3
- **Column AH:** Property-Radar-comp-4
- **Column AI:** Property-Radar-comp-5
- **Column AJ:** Property-Radar-comp-6
- **Column AK:** Property-Radar-comp-7
- **Column AL:** Property-Radar-comp-8
- **Column AM:** Property-Radar-comp-9
- **Column AN:** Property-Radar-comp-10
- **Column AO:** Property-Radar-comp-11
- **Column AP:** Property-Radar-comp-12

**All Property Radar columns:**
- **Source:** MANUAL
- **Type:** String
- **Format:** Property address or APN
- **Note:** Left blank for initial upload, manually entered before ReportIt

---

## Data Confidence Scoring

Based on Alignment.md analysis, apply confidence scoring when choosing between sources:

### High Confidence (95-100%)
- Property address
- APN
- Year built
- Sale price
- Sale date

### Medium Confidence (70-95%)
- Square footage
- Lot size
- Geographic coordinates
- Tax assessments

### Low Confidence (<70%)
- Estimated values
- Condition assessments
- Market predictions

---

## Processing Logic

### Source Priority Rules

1. **MLS Preferred Fields:**
   - Status
   - List dates
   - List prices
   - Sale information
   - Days on market
   - Agency information

2. **MCAO Preferred Fields:**
   - APN
   - Legal description
   - Tax information
   - Lot size
   - Property type
   - Subdivision

3. **Either Source (with priority):**
   - Square footage (MLS first, MCAO fallback)
   - Coordinates (MLS first, MCAO fallback)
   - Year built (either, validate match)

### Missing Data Handling

- **String fields:** Populate with "N/A"
- **Numeric fields:** Leave blank or use 0 based on context
- **Date fields:** Populate with "N/A"
- **Boolean fields:** Default to "N"

### Validation Rules

1. **Required Fields:**
   - FULL_ADDRESS (Column B)
   - APN (Column C)
   - At least one of: IN_MLS or IN_MCAO must be "Y"

2. **Conditional Requirements:**
   - If STATUS = "C", then SALE_DATE and SALE_PRICE should be populated
   - If IS_RENTAL = "Y", consider rental-specific analysis

3. **Data Type Validation:**
   - Dates: YYYY-MM-DD format
   - Currency: Numeric only, no symbols
   - Coordinates: Valid lat/lon ranges for Maricopa County

---

## Implementation Notes

### Excel Processing with ExcelJS

```javascript
// Example field mapping implementation
async function mapAnalysisField(row, fieldConfig) {
  const { column, source, mlsField, mcaoField, calculationLogic, defaultValue } = fieldConfig;

  let value;

  switch(source) {
    case 'MLS':
      value = row.mls?.[mlsField] || defaultValue || "N/A";
      break;

    case 'MCAO':
      value = row.mcao?.[mcaoField] || defaultValue || "N/A";
      break;

    case 'EITHER':
      value = row.mls?.[mlsField] || row.mcao?.[mcaoField] || defaultValue || "N/A";
      break;

    case 'CALCULATED':
      value = calculationLogic ? calculationLogic(row) : defaultValue || "N/A";
      break;

    case 'MANUAL':
      value = ""; // Leave blank for manual entry
      break;

    default:
      value = defaultValue || "N/A";
  }

  return { column, value };
}
```

### Health Check Integration

Before processing, validate that source sheets have expected columns:

```javascript
const requiredMLSColumns = [
  'Status', 'List Date', 'Original List Price',
  'Sold Price', '# Bedrooms', 'Total Bathrooms'
];

const requiredMCAOColumns = [
  'PropertyAddress', 'APN', 'Owner_SalePrice',
  'Owner_SaleDate', 'LotSquareFootage'
];

function validateSourceSheets(mlsSheet, mcaoSheet) {
  // Validation logic
}
```

---

## Testing Checklist

- [ ] All 40 columns populate correctly
- [ ] Source priority logic works as expected
- [ ] Discrepancy calculation accurate
- [ ] Manual fields left blank appropriately
- [ ] "N/A" values populate for missing data
- [ ] Date formats consistent
- [ ] Numeric fields handle nulls correctly
- [ ] Validation rules enforce data quality

---

## Change Log

| Version | Date | Changes | Author |
|---------|------|---------|---------|
| 1.0 | 2024-10-23 | Initial field mapping specification | GSRealty Team |

---

**Next Document:** REPORTIT_BREAKUPS_ANALYSIS.md