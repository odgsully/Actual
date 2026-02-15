# Excel Template Fields Reference

**Document:** Template.xlsx Field Definitions
**Project:** GSRealty Client Management System
**Purpose:** Define data structure and population rules for template.xlsx Excel file
**Created:** October 15, 2025

---

## Overview

This document defines the structure, fields, and population rules for `template.xlsx`, the master template for MLS comparable sales data processing in the GSRealty system.

**Template Purpose:**
- Standardized format for MLS data import
- Automated processing by ExcelJS backend
- Consistent data structure for all clients
- Integration with MCAO property data

---

## Template Structure

### Sheet List

| Sheet Name     | Purpose                                    | Data Source          |
|----------------|--------------------------------------------|----------------------|
| `comps`        | Comparable sales data from MLS             | MLS CSV/XLSX uploads |
| `Full_API_call`| Complete MCAO API response                 | MCAO API             |
| `Analysis`     | Summary analysis and insights              | Calculated           |
| `Calcs`        | Backend calculations and formulas          | Calculated           |
| `Maricopa`     | Maricopa County specific data              | MCAO API             |
| `.5mile`       | Comps within 0.5 mile radius               | Filtered from comps  |
| `Lot`          | Lot-specific details and information       | MCAO + MLS           |

---

## Sheet 1: `comps` - Comparable Sales

### Purpose
Contains comparable sales data from MLS (Multiple Listing Service) uploads. This is the primary dataset for market analysis.

### Column Layout

**CRITICAL RULE:** Column A is RESERVED and always BLANK

- **Column A:** `Notes` (header only) - MANUALLY filled by realtor
- **Column B onwards:** MLS data fields

### Why Column A is Reserved

**Reason:** MLS export files do NOT include a "Notes" column. To prevent data misalignment:
1. Column A header says "Notes" but is blank
2. All MLS uploaded data populates starting in **Column B**
3. Realtor can manually add notes in Column A later
4. Prevents off-by-one column errors during import

### Column Definitions (B through Z+)

**Required Columns (MLS Standard):**

| Column | Field Name         | Data Type      | Description                                    | Example                  |
|--------|--------------------|----------------|------------------------------------------------|--------------------------|
| B      | Address            | Text           | Full property address                          | "123 Main St"            |
| C      | City               | Text           | City name                                      | "Phoenix"                |
| D      | State              | Text (2 char)  | State abbreviation                             | "AZ"                     |
| E      | ZIP                | Text (5-10)    | ZIP code (can include +4)                      | "85001" or "85001-1234"  |
| F      | APN                | Text           | Assessor Parcel Number                         | "123-45-678A"            |
| G      | Sale Price         | Currency       | Final sale price                               | "$450,000"               |
| H      | Sale Date          | Date           | Date property sold                             | "10/15/2024"             |
| I      | List Price         | Currency       | Original listing price                         | "$475,000"               |
| J      | Days on Market     | Integer        | Number of days listed before sale              | "45"                     |
| K      | Property Type      | Text           | Type of property                               | "Single Family"          |
| L      | Bedrooms           | Integer        | Number of bedrooms                             | "4"                      |
| M      | Bathrooms          | Decimal        | Number of bathrooms (half baths as 0.5)        | "2.5"                    |
| N      | Square Feet        | Integer        | Living area square footage                     | "2150"                   |
| O      | Lot Size           | Integer        | Lot size in square feet                        | "8000"                   |
| P      | Year Built         | Integer (YYYY) | Year property was built                        | "2005"                   |
| Q      | Garage Spaces      | Integer        | Number of garage spaces                        | "2"                      |
| R      | Pool               | Boolean (Y/N)  | Has pool?                                      | "Y" or "N"               |
| S      | Stories            | Integer        | Number of stories                              | "2"                      |
| T      | HOA                | Boolean (Y/N)  | Has HOA?                                       | "Y" or "N"               |
| U      | HOA Fee            | Currency       | Monthly HOA fee (if applicable)                | "$75"                    |
| V      | Price per SqFt     | Currency       | Calculated or provided                         | "$209"                   |
| W      | Distance (miles)   | Decimal        | Distance from subject property                 | "0.35"                   |
| X      | MLS Number         | Text           | MLS listing number                             | "6587123"                |
| Y      | Status             | Text           | Sale status                                    | "Closed" or "Pending"    |
| Z      | Remarks            | Text (long)    | Property description/remarks                   | "Beautiful corner lot..."|\|

**Optional Columns (AA+):**

| Column | Field Name         | Data Type | Description                         |
|--------|--------------------|-----------|-------------------------------------|
| AA     | Fireplace          | Boolean   | Has fireplace?                      |
| AB     | View               | Text      | View type (Mountain, Golf, etc.)    |
| AC     | Special Features   | Text      | Special features                    |
| AD     | Roof Type          | Text      | Roof material                       |
| AE     | Flooring           | Text      | Primary flooring type               |
| AF     | Cooling            | Text      | Cooling type                        |
| AG     | Heating            | Text      | Heating type                        |
| AH     | Water Source       | Text      | Water source type                   |
| AI     | Sewer              | Text      | Sewer type                          |

### Data Population Rules

**During Upload:**
1. Parse MLS CSV/XLSX file
2. Map headers to column letters (starting at B)
3. Validate required fields present
4. Insert data rows starting at B2
5. Leave Column A completely blank
6. Format currency and date fields
7. Calculate derived fields (Price per SqFt, Distance)

**Validation Rules:**
- Sale Price must be > $0
- Square Feet must be > 0
- Date fields must be valid dates
- APN format validation (###-##-####)
- Required fields cannot be empty

---

## Sheet 2: `Full_API_call` - Complete MCAO Response

### Purpose
Stores the complete raw response from Maricopa County Assessor's Office (MCAO) API call. This is the authoritative source for official property data.

### Column Layout

**CRITICAL RULE:** Column A is RESERVED and always BLANK (same as `comps` sheet)

- **Column A:** `Notes` (header only) - MANUALLY filled
- **Column B onwards:** MCAO API response fields

### Why Column A Reserved

Same reasoning as `comps` sheet - consistency across all sheets and room for manual notes.

### Column Definitions (B through Z+)

**MCAO API Standard Fields:**

| Column | Field Name                | Data Type | Description                              | Source API Field       |
|--------|---------------------------|-----------|------------------------------------------|------------------------|
| B      | APN                       | Text      | Assessor Parcel Number                   | `parcel_number`        |
| C      | Parcel ID                 | Text      | Internal parcel ID                       | `parcel_id`            |
| D      | Owner Name                | Text      | Property owner name                      | `owner_name`           |
| E      | Owner Address             | Text      | Mailing address of owner                 | `owner_address`        |
| F      | Legal Description         | Text      | Legal property description               | `legal_desc`           |
| G      | Property Address          | Text      | Physical property address                | `property_address`     |
| H      | Property City             | Text      | City                                     | `property_city`        |
| I      | Property ZIP              | Text      | ZIP code                                 | `property_zip`         |
| J      | Property Class            | Text      | Property classification                  | `property_class`       |
| K      | Land Use Code             | Text      | Land use code                            | `land_use_code`        |
| L      | Legal Class               | Text      | Legal classification                     | `legal_class`          |
| M      | Subdivision               | Text      | Subdivision name                         | `subdivision_name`     |
| N      | Lot Number                | Text      | Lot number within subdivision            | `lot_number`           |
| O      | Block Number              | Text      | Block number                             | `block_number`         |
| P      | Section                   | Text      | Section number (government survey)       | `section`              |
| Q      | Township                  | Text      | Township                                 | `township`             |
| R      | Range                     | Text      | Range                                    | `range`                |
| S      | Assessed Value (Land)     | Currency  | Assessed land value                      | `assessed_land_value`  |
| T      | Assessed Value (Improvement)| Currency| Assessed improvement value               | `assessed_imp_value`   |
| U      | Assessed Value (Total)    | Currency  | Total assessed value                     | `total_assessed_value` |
| V      | Full Cash Value (Land)    | Currency  | Full cash value - land                   | `fcv_land`             |
| W      | Full Cash Value (Improvement)| Currency| Full cash value - improvements          | `fcv_improvement`      |
| X      | Full Cash Value (Total)   | Currency  | Total full cash value                    | `fcv_total`            |
| Y      | Tax Amount                | Currency  | Current year tax amount                  | `tax_amount`           |
| Z      | Tax Year                  | Integer   | Tax year                                 | `tax_year`             |
| AA     | Square Feet (Living)      | Integer   | Living area square feet                  | `sqft_living`          |
| AB     | Square Feet (Lot)         | Integer   | Lot square feet                          | `sqft_lot`             |
| AC     | Year Built                | Integer   | Year built                               | `year_built`           |
| AD     | Bedrooms                  | Integer   | Number of bedrooms                       | `bedrooms`             |
| AE     | Bathrooms                 | Decimal   | Number of bathrooms                      | `bathrooms`            |
| AF     | Pool                      | Boolean   | Has pool                                 | `has_pool`             |
| AG     | Garage Type               | Text      | Garage type                              | `garage_type`          |
| AH     | Garage Capacity           | Integer   | Garage spaces                            | `garage_spaces`        |
| AI     | Stories                   | Integer   | Number of stories                        | `stories`              |
| AJ     | Construction Type         | Text      | Construction material                    | `construction_type`    |
| AK     | Roof Type                 | Text      | Roof type/material                       | `roof_type`            |
| AL     | Exterior Walls            | Text      | Exterior wall material                   | `exterior_walls`       |
| AM     | Last Sale Date            | Date      | Most recent sale date                    | `last_sale_date`       |
| AN     | Last Sale Price           | Currency  | Most recent sale price                   | `last_sale_price`      |
| AO     | Last Sale Document        | Text      | Recording document number                | `sale_doc_number`      |
| AP     | Zoning                    | Text      | Zoning classification                    | `zoning`               |
| AQ     | API Call Timestamp        | Datetime  | When API was called                      | (system generated)     |
| AR     | API Response Status       | Text      | Success or error message                 | (system generated)     |

### Data Population Rules

**When API Called:**
1. Make POST/GET request to MCAO API with APN
2. Parse JSON response
3. Map JSON fields to Excel columns
4. Populate starting at Column B, row 2
5. Leave Column A blank
6. Format currency, dates, booleans
7. Handle missing/null values (display as "N/A")
8. Store timestamp of API call
9. Log API response status

**Validation:**
- Verify APN matches request
- Check API response for errors
- Validate required fields present
- Cross-reference with `comps` sheet data

---

## Sheet 3: `Analysis` - Market Analysis Summary

### Purpose
Automated analysis and insights based on comparable sales data. Provides summary statistics, market trends, and property comparison scores.

### Structure

**Layout:** Summary cards/sections rather than strict table

**Sections:**

#### Section 1: Subject Property Summary (Rows 2-10)
- Address
- APN
- Current owner
- Assessed value
- Property details (beds/baths/sqft)

#### Section 2: Comparable Sales Statistics (Rows 12-25)
| Row | Field                      | Formula/Source                          |
|-----|----------------------------|-----------------------------------------|
| 12  | Number of Comps            | COUNT(comps!B:B)                        |
| 13  | Average Sale Price         | AVERAGE(comps!G:G)                      |
| 14  | Median Sale Price          | MEDIAN(comps!G:G)                       |
| 15  | Min Sale Price             | MIN(comps!G:G)                          |
| 16  | Max Sale Price             | MAX(comps!G:G)                          |
| 17  | Std Deviation              | STDEV(comps!G:G)                        |
| 18  | Average Price per SqFt     | AVERAGE(comps!V:V)                      |
| 19  | Median Price per SqFt      | MEDIAN(comps!V:V)                       |
| 20  | Average Days on Market     | AVERAGE(comps!J:J)                      |
| 21  | Average Square Feet        | AVERAGE(comps!N:N)                      |
| 22  | Average Lot Size           | AVERAGE(comps!O:O)                      |
| 23  | Average Year Built         | AVERAGE(comps!P:P)                      |
| 24  | % With Pool                | COUNTIF(comps!R:R,"Y")/COUNT(comps!R:R) |
| 25  | % With HOA                 | COUNTIF(comps!T:T,"Y")/COUNT(comps!T:T) |

#### Section 3: Market Trends (Rows 27-35)
- Sale volume by month
- Price trends (up/down/stable)
- Inventory levels
- Market temperature (hot/warm/cold)

#### Section 4: Subject Property Comparison (Rows 37-50)
- How subject compares to average comp
- Above/below market indicators
- Competitive advantages
- Areas of concern

### Data Population

**Automated:**
- Formulas calculate statistics from `comps` sheet
- Conditional formatting highlights outliers
- Charts/graphs embedded (optional)

**Manual:**
- Market temperature assessment
- Competitive narrative
- Recommendations

---

## Sheet 4: `Calcs` - Calculation Formulas

### Purpose
Backend sheet containing complex calculations, intermediate values, and formula logic. Not typically viewed by end users.

### Structure

**Helper Columns:**

| Column | Purpose                          | Example Formula                              |
|--------|----------------------------------|----------------------------------------------|
| A      | Comp ID                          | `comps!B2` (reference)                       |
| B      | Distance Score                   | `=1 - (comps!W2 / MAX(comps!W:W))`           |
| C      | Price Similarity Score           | `=1 - ABS((comps!G2 - $Subject$Price) / $Subject$Price)` |
| D      | SqFt Similarity Score            | `=1 - ABS((comps!N2 - $Subject$SqFt) / $Subject$SqFt)` |
| E      | Age Similarity Score             | `=1 - ABS((comps!P2 - $Subject$YearBuilt) / 100)` |
| F      | Bed/Bath Match Score             | `=IF(AND(comps!L2=$Subject$Beds, comps!M2=$Subject$Baths), 1, 0.5)` |
| G      | Overall Comp Score               | `=AVERAGE(B2:F2) * 100`                      |
| H      | Adjusted Sale Price              | `=comps!G2 * (1 + CompAdjustments!A2)`       |
| I      | Days on Market Category          | `=IF(comps!J2<30,"Fast",IF(comps!J2<60,"Normal","Slow"))` |
| J      | Price Trend Indicator            | `=SLOPE(prices, dates)`                      |

**Named Ranges:**
- `Subject$Price` = Subject property sale price/estimate
- `Subject$SqFt` = Subject property square feet
- `Subject$Beds` = Subject property bedrooms
- `Subject$Baths` = Subject property bathrooms
- `Subject$YearBuilt` = Subject property year built

### Data Population

**Automated:**
- Formulas reference `comps` and `Full_API_call` sheets
- Calculations update when source data changes
- No manual entry required

**Usage:**
- `Analysis` sheet references these calculations
- `Maricopa` sheet may use derived values
- Hidden from most users

---

## Sheet 5: `Maricopa` - Maricopa County Data

### Purpose
Maricopa County Assessor-specific data formatted for official reports and analysis.

### Critical Layout Rules

#### Rows 2-24: Two-Column Format

**Structure:**
- Column A: Reserved (Notes)
- Column B: Field labels
- Column C: Data values populated from MCAO API

**Example:**

| Row | Column B Label            | Column C Value (from MCAO)       |
|-----|---------------------------|----------------------------------|
| 2   | APN                       | `=Full_API_call!B2`              |
| 3   | Owner Name                | `=Full_API_call!D2`              |
| 4   | Legal Description         | `=Full_API_call!F2`              |
| 5   | Property Address          | `=Full_API_call!G2`              |
| 6   | Subdivision               | `=Full_API_call!M2`              |
| 7   | Lot Number                | `=Full_API_call!N2`              |
| 8   | Section/Township/Range    | `=Full_API_call!P2 & "/" & Full_API_call!Q2 & "/" & Full_API_call!R2` |
| 9   | Assessed Value (Land)     | `=Full_API_call!S2`              |
| 10  | Assessed Value (Improvements) | `=Full_API_call!T2`          |
| 11  | Total Assessed Value      | `=Full_API_call!U2`              |
| 12  | Full Cash Value (Land)    | `=Full_API_call!V2`              |
| 13  | Full Cash Value (Improvements) | `=Full_API_call!W2`         |
| 14  | Full Cash Value (Total)   | `=Full_API_call!X2`              |
| 15  | Tax Amount                | `=Full_API_call!Y2`              |
| 16  | Tax Year                  | `=Full_API_call!Z2`              |
| 17  | Year Built                | `=Full_API_call!AC2`             |
| 18  | Living Area (SqFt)        | `=Full_API_call!AA2`             |
| 19  | Lot Size (SqFt)           | `=Full_API_call!AB2`             |
| 20  | Bedrooms                  | `=Full_API_call!AD2`             |
| 21  | Bathrooms                 | `=Full_API_call!AE2`             |
| 22  | Pool                      | `=IF(Full_API_call!AF2="Y","Yes","No")` |
| 23  | Zoning                    | `=Full_API_call!AP2`             |
| 24  | Last Sale Date            | `=Full_API_call!AM2`             |

**Formatting:**
- Column B: Bold, left-aligned
- Column C: Regular, left-aligned (or right for numbers/currency)
- Currency fields: `$#,##0.00`
- Date fields: `MM/DD/YYYY`

#### Rows 26+: Matrix Format

**Structure:** Multi-column matrix with headers starting at Row 26

**Purpose:** Tax history, assessment history, or comparative data

**Example Matrix (Tax History):**

| Row | Column B Header | Column C Header | Column D Header | Column E Header |
|-----|-----------------|-----------------|-----------------|-----------------|
| 26  | Tax Year        | Assessed Value  | Tax Amount      | Tax Rate        |
| 27  | 2024            | $450,000        | $4,500          | 1.0%            |
| 28  | 2023            | $435,000        | $4,350          | 1.0%            |
| 29  | 2022            | $420,000        | $4,200          | 1.0%            |
| 30  | 2021            | $405,000        | $4,050          | 1.0%            |
| 31  | 2020            | $390,000        | $3,900          | 1.0%            |

**Column C and D Population:**
- Columns C and D (and additional columns as needed) populated from MCAO API historical data
- Data sorted by year (most recent first)
- Calculated fields (Tax Rate) use formulas

### Data Population Rules

**Rows 2-24:**
1. Column A: Always blank (Notes)
2. Column B: Static labels (defined in template)
3. Column C: Formulas referencing `Full_API_call` sheet
4. Auto-update when `Full_API_call` changes

**Rows 26+ (Matrix):**
1. Column B: Year or identifier
2. Columns C, D, E, etc.: Historical or comparative data
3. Populated from MCAO API `/history` endpoint
4. Formulas for calculated columns

**Data Source:**
- 100% from `Full_API_call` sheet (which comes from MCAO API)
- No MLS data in this sheet
- Official county records only

---

## Sheet 6: `.5mile` - Half-Mile Radius Comps

### Purpose
Filtered subset of `comps` sheet containing only comparable sales within 0.5 miles of subject property.

### Structure

**Identical to `comps` sheet:**
- Column A: Reserved (Notes)
- Columns B-Z+: Same fields as `comps`

**Filter Criteria:**
- Distance (comps!W) <= 0.5 miles

### Data Population

**Automated:**
```excel
=FILTER(comps!B:Z, comps!W:W <= 0.5)
```
Or during upload processing:
1. Calculate distance for each comp
2. If distance <= 0.5, also insert row in `.5mile` sheet
3. Maintain synchronization

**Usage:**
- More focused comparable analysis
- Required by some appraisal standards
- Quick reference for nearby sales

**Formatting:**
- Identical to `comps` sheet
- Conditional formatting to highlight closest comps
- Sort by distance (closest first)

---

## Sheet 7: `Lot` - Lot-Specific Details

### Purpose
Detailed lot information including zoning, easements, restrictions, and physical characteristics.

### Critical Formatting Rule

**ALL CELLS: Light Grey Background**
- Background color: `#F2F2F2` (light light grey) or RGB(242, 242, 242)
- Entire sheet uniformly styled
- Purpose: Visual distinction from other sheets

### Structure

#### Section 1: Lot Dimensions (Rows 2-15)

| Row | Column B Label             | Column C Value              |
|-----|----------------------------|-----------------------------|
| 2   | Lot Size (SqFt)            | `=Full_API_call!AB2`        |
| 3   | Lot Size (Acres)           | `=C2 / 43560`               |
| 4   | Lot Dimensions (Front)     | (from MCAO or manual)       |
| 5   | Lot Dimensions (Rear)      | (from MCAO or manual)       |
| 6   | Lot Dimensions (Left)      | (from MCAO or manual)       |
| 7   | Lot Dimensions (Right)     | (from MCAO or manual)       |
| 8   | Lot Shape                  | Rectangular / Irregular     |
| 9   | Corner Lot                 | Yes / No                    |
| 10  | Cul-de-Sac                 | Yes / No                    |
| 11  | Flag Lot                   | Yes / No                    |
| 12  | Frontage (feet)            | (from legal description)    |
| 13  | Depth (feet)               | (from legal description)    |
| 14  | Topography                 | Level / Sloped / Irregular  |
| 15  | Landscaping                | Mature / Minimal / Desert   |

#### Section 2: Zoning & Use (Rows 17-25)

| Row | Column B Label             | Column C Value              |
|-----|----------------------------|-----------------------------|
| 17  | Zoning Classification      | `=Full_API_call!AP2`        |
| 18  | Land Use Code              | `=Full_API_call!K2`         |
| 19  | Legal Class                | `=Full_API_call!L2`         |
| 20  | Permitted Uses             | (from zoning research)      |
| 21  | Setback Requirements       | Front: ___ Side: ___ Rear: ___ |
| 22  | Maximum Building Height    | (from zoning)               |
| 23  | Maximum Lot Coverage (%)   | (from zoning)               |
| 24  | Parking Requirements       | (from zoning)               |
| 25  | Special Use Permits        | (if applicable)             |

#### Section 3: Easements & Restrictions (Rows 27-35)

| Row | Column B Label             | Column C Value              |
|-----|----------------------------|-----------------------------|
| 27  | Utility Easements          | Description or "None"       |
| 28  | Access Easements           | Description or "None"       |
| 29  | Drainage Easements         | Description or "None"       |
| 30  | Right of Way               | Description or "None"       |
| 31  | HOA Restrictions           | Yes / No                    |
| 32  | CC&Rs                      | Link to document            |
| 33  | Building Restrictions      | Description                 |
| 34  | Architectural Review       | Required / Not Required     |
| 35  | Notes                      | (free text)                 |

#### Section 4: Utilities & Services (Rows 37-45)

| Row | Column B Label             | Column C Value              |
|-----|----------------------------|-----------------------------|
| 37  | Water Source               | `=Full_API_call!AH2` or City/Well |
| 38  | Water Provider             | City / Private / Well       |
| 39  | Sewer                      | `=Full_API_call!AI2` or City/Septic |
| 40  | Sewer Provider             | City / Septic               |
| 41  | Electric Provider          | APS / SRP / Other           |
| 42  | Gas Service                | Southwest Gas / None        |
| 43  | Cable/Internet Providers   | Available providers         |
| 44  | Trash Service              | Provider name               |
| 45  | Flood Zone                 | X / A / AE / Other          |

### Data Population

**Automated (from MCAO API):**
- Lot size
- Zoning
- Land use code
- Water/sewer (if available)

**Manual (realtor research):**
- Lot dimensions
- Easements
- Restrictions
- Utility providers
- Detailed zoning requirements

**Formatting:**
- All cells: `#F2F2F2` background
- Column B: Bold labels
- Column C: Regular data
- Currency: `$#,##0.00`
- Percentages: `0.00%`
- Text wrapped for long descriptions

---

## Data Validation Rules (All Sheets)

### Currency Fields
- Format: `$#,##0.00`
- Allow negatives: No (except adjustments)
- Range: $0 to $99,999,999

### Date Fields
- Format: `MM/DD/YYYY`
- Range: 1/1/1900 to 12/31/2099
- Validate as real date

### Integer Fields
- No decimals
- Range appropriate to field (e.g., beds 0-99)

### Boolean Fields
- Values: "Y", "N", "Yes", "No", "TRUE", "FALSE"
- Displayed as: "Yes" or "No"

### APN Format
- Pattern: `###-##-####` (letters allowed at end)
- Example: `123-45-678A`
- Required format for Maricopa County

### Percentage Fields
- Format: `0.00%`
- Range: 0% to 100%

---

## Error Handling

### Missing Data
- Display as: `N/A` or leave blank
- Color: Light gray text
- Do not break formulas

### API Errors
- Mark cell with red background
- Display error message
- Log error in `admin_logs` table

### Invalid Data
- Highlight in yellow
- Show validation message
- Prevent save until resolved

### Calculation Errors
- Display `#ERR` or descriptive message
- Check formula references
- Verify source data exists

---

## Processing Workflow

### Upload to Database Flow

1. **Upload:** User uploads CSV/XLSX via admin dashboard
2. **Validate:** Check file format, required columns, data types
3. **Parse:** Use ExcelJS to read workbook
4. **Transform:** Map to database schema
5. **Populate Sheets:**
   - `comps`: Insert MLS data (Column B onwards)
   - `Full_API_call`: Make MCAO API call for each APN
   - `Analysis`: Formulas auto-calculate
   - `Calcs`: Formulas auto-calculate
   - `Maricopa`: Reference Full_API_call
   - `.5mile`: Filter comps by distance
   - `Lot`: Populate from MCAO + manual fields
6. **Save:** Write to database (gsrealty_properties, gsrealty_comps tables)
7. **Export:** Generate processed template.xlsx
8. **Store:** Save to client folder: `/MY LISTINGS/[LastName MM.YY]/`

### MCAO API Integration

**For Each Property:**
1. Extract APN from upload
2. Call MCAO API: `POST /api/parcel/{apn}`
3. Parse JSON response
4. Map to `Full_API_call` sheet columns
5. Populate `Maricopa` sheet from API data
6. Cache API response (avoid duplicate calls)
7. Handle errors gracefully

---

## Formulas Reference

### Common Calculations

**Price per Square Foot:**
```excel
=IFERROR(G2/N2, "N/A")
```

**Distance Calculation (Haversine):**
```typescript
// Calculated in TypeScript backend
function haversineDistance(lat1, lon1, lat2, lon2): number
```

**Comp Score:**
```excel
=AVERAGE(Calcs!B2:Calcs!F2) * 100
```

**Market Trend:**
```excel
=SLOPE(G2:G100, H2:H100)
```

**Assessment Ratio:**
```excel
=Full_API_call!U2 / Full_API_call!X2
```

---

## Version Control

**Template Version:** 1.0
**Last Updated:** October 15, 2025
**Changelog:**
- v1.0: Initial template structure
- Future: To be updated as requirements evolve

**Backwards Compatibility:**
- New columns added at end (right side)
- Core columns (B-Z) remain stable
- Old templates can be migrated

---

## Appendix: MLS Field Mapping

### Common MLS Export Fields → Template Columns

| MLS Export Header       | Template Column | Field Name      |
|-------------------------|-----------------|-----------------|
| PropertyAddress         | B               | Address         |
| City                    | C               | City            |
| StateOrProvince         | D               | State           |
| PostalCode              | E               | ZIP             |
| ParcelNumber            | F               | APN             |
| ListPrice               | I               | List Price      |
| ClosePrice              | G               | Sale Price      |
| CloseDate               | H               | Sale Date       |
| DaysOnMarket            | J               | Days on Market  |
| PropertyType            | K               | Property Type   |
| BedroomsTotal           | L               | Bedrooms        |
| BathroomsTotalInteger   | M               | Bathrooms       |
| LivingArea              | N               | Square Feet     |
| LotSizeSquareFeet       | O               | Lot Size        |
| YearBuilt               | P               | Year Built      |
| GarageSpaces            | Q               | Garage Spaces   |
| PoolFeatures            | R               | Pool (Y/N)      |
| Stories Number          | S               | Stories         |
| AssociationYN           | T               | HOA (Y/N)       |
| AssociationFee          | U               | HOA Fee         |
| ListingId               | X               | MLS Number      |
| StandardStatus          | Y               | Status          |
| PublicRemarks           | Z               | Remarks         |

---

**END OF TEMPLATE FIELDS REFERENCE**
