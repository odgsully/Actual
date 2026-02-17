# MLS Field Mapping - ARMLS to Template

**Document:** Arizona Regional MLS (ARMLS) Field Mapping
**Project:** GSRealty Client Management System
**Purpose:** Map ARMLS CSV export fields to template.xlsx columns
**Created:** October 15, 2025
**Based On:** Actual MLS CSV exports in `/mcao-upload-temp/`

---

## Overview

This document provides the exact field mapping from Arizona Regional MLS (ARMLS) CSV exports to the `gsrealty-client-template.xlsx` file. This mapping is used by the file processing system to correctly populate the template.

**Data Source:** ARMLS MLS System (Arizona Regional Multiple Listing Service)
**Export Format:** CSV with 90+ columns
**Target:** `comps` sheet in template.xlsx

---

## Critical Processing Rules

### Column A Reserved Rule
- **NEVER populate Column A from MLS data**
- Column A header = "Notes" (for manual entry)
- All MLS data starts at **Column B**
- This prevents off-by-one errors during import

### MLS CSV Structure
- **Header Row:** Row 1 contains column names (quoted strings)
- **Data Rows:** Row 2+ contain property data
- **Delimiter:** Comma (`,`)
- **Quoting:** Fields with commas are quoted (`"value"`)
- **Features Field:** Pipe-delimited key-value pairs at end

---

## MLS to Template Column Mapping

### Core Property Fields

| Template Col | Field Name (Template) | ARMLS CSV Field        | Example Value                    | Notes                          |
|--------------|-----------------------|------------------------|----------------------------------|--------------------------------|
| A            | Notes                 | (manual only)          | ""                               | Always blank on import         |
| B            | Address               | House Number + Street Name + Unit # | "4620 N 68TH ST 155"      | Concatenated from multiple     |
| C            | City                  | City/Town Code         | "Scottsdale"                     | City name                      |
| D            | State                 | State/Province         | "AZ"                             | 2-letter state code            |
| E            | ZIP                   | Zip Code               | "85251"                          | 5-digit ZIP                    |
| F            | APN                   | Assessor Number        | "173-35-361"                     | Assessor Parcel Number         |
| G            | Sale Price            | Sold Price             | "325900.00"                      | Final sale price (if sold)     |
| H            | Sale Date             | Close of Escrow Date   | "2025-07-15"                     | Date sold (if closed)          |
| I            | List Price            | List Price             | "325900.00"                      | Current or original list price |
| J            | Days on Market        | Days on Market         | "102"                            | Calculated by MLS              |
| K            | Property Type         | Property Type          | "Residential"                    | Type of property               |
| L            | Bedrooms              | # Bedrooms             | "1"                              | Number of bedrooms             |
| M            | Bathrooms             | Total Bathrooms        | "1.00"                           | Total baths (full + half/2)    |
| N            | Square Feet           | Approx SQFT            | "702.00"                         | Living area square footage     |
| O            | Lot Size              | Approx Lot SqFt        | "71.00"                          | Lot size in square feet        |
| P            | Year Built            | Year Built             | "1974"                           | Year constructed               |
| Q            | Garage Spaces         | Garage Spaces          | "0"                              | From parking features          |
| R            | Pool                  | Private Pool Y/N       | "N"                              | Y/N                            |
| S            | Stories               | Exterior Stories       | "1"                              | Number of stories              |
| T            | HOA                   | HOA Y/N                | "Y"                              | From features field            |
| U            | HOA Fee               | HOA Fee                | "346.5"                          | From features field            |
| V            | Price per SqFt        | Price/SqFt             | "464.25"                         | Calculated: Price / SqFt       |
| W            | Distance (miles)      | (calculated)           | "0.35"                           | Haversine from subject property|
| X            | MLS Number            | List Number            | "6888371"                        | MLS listing ID                 |
| Y            | Status                | Status                 | "A"                              | A=Active, C=Closed, etc.       |
| Z            | Remarks               | Public Remarks         | "Walk across the street..."      | Property description           |

### Extended Fields (Columns AA+)

| Template Col | Field Name            | ARMLS CSV Field              | Notes                               |
|--------------|-----------------------|------------------------------|-------------------------------------|
| AA           | Fireplace             | Fireplace YN                 | From features field                 |
| AB           | View                  | (extracted from Features)    | Parsed from features pipe           |
| AC           | Subdivision           | Subdivision                  | Subdivision name                    |
| AD           | Listing Agent         | Listing Agent                | Agent name                          |
| AE           | Listing Agency        | Agency Name                  | Brokerage name                      |
| AF           | Under Contract Date   | Under Contract Date          | Date offer accepted                 |
| AG           | Tax Year              | Tax Year                     | Year of tax data                    |
| AH           | Taxes (Annual)        | Taxes                        | Annual property taxes               |
| AI           | Legal Description     | Legal Description (Abbrev)   | Legal description                   |
| AJ           | Geo Lat               | Geo Lat                      | Latitude for mapping                |
| AK           | Geo Lon               | Geo Lon                      | Longitude for mapping               |

---

## Address Concatenation Logic

ARMLS provides address in separate fields. Concatenate as follows:

```typescript
function buildAddress(row: any): string {
  const parts = [
    row['House Number'],
    row['Building Number'], // If exists
    row['Compass'], // N, S, E, W
    row['Street Name'],
    row['Unit #'], // If exists
    row['St Dir Sfx'], // Street direction suffix
    row['St Suffix'] // ST, AVE, RD, etc.
  ].filter(Boolean); // Remove empty parts

  return parts.join(' ').trim();
}

// Example:
// Input: House Number="4620", Compass="N", Street Name="68TH", St Suffix="ST", Unit #="155"
// Output: "4620 N 68TH ST 155"
```

---

## Status Code Mapping

| ARMLS Status | Description                | Template Display |
|--------------|----------------------------|------------------|
| A            | Active                     | "Active"         |
| C            | Closed                     | "Sold"           |
| P            | Pending                    | "Pending"        |
| U            | Under Contract             | "Under Contract" |
| X            | Cancelled                  | "Cancelled"      |
| T            | Temporary Off Market       | "Temp Off"       |
| W            | Withdrawn                  | "Withdrawn"      |

---

## Features Field Parsing

The "Features" column contains pipe-delimited (`|`) key-value pairs:

**Example:**
```
Association & Fees|HOA Y/N|Y;Association & Fees|HOA Fee|346.5;Fireplace|Fireplace YN|N;Private Pool Features|No Pool|Yes
```

**Parse Logic:**
1. Split by semicolon (`;`) to get feature groups
2. Split each group by pipe (`|`) to get category, subcategory, value
3. Extract relevant fields (HOA Fee, Pool, etc.)

```typescript
function parseFeatures(featuresString: string): Record<string, any> {
  const features: Record<string, any> = {};

  const groups = featuresString.split(';');
  groups.forEach(group => {
    const parts = group.split('|');
    if (parts.length === 3) {
      const [category, subcategory, value] = parts;

      // Extract HOA Fee
      if (subcategory === 'HOA Fee') {
        features.hoaFee = parseFloat(value);
      }

      // Extract Fireplace
      if (subcategory === 'Fireplace YN') {
        features.fireplace = value === 'Y' ? 'Yes' : 'No';
      }

      // Extract Pool
      if (subcategory.includes('Pool') && value === 'Yes') {
        features.pool = 'Y';
      }

      // ... more extractions
    }
  });

  return features;
}
```

---

## Data Type Conversions

### Currency Fields
- **Input:** String with decimal ("325900.00")
- **Process:** Parse as float
- **Output:** Number (325900.00)
- **Display:** Format as currency ("$325,900")

### Date Fields
- **Input:** String ("2025-07-15" or "2025-07-03")
- **Process:** Parse as Date object
- **Output:** Excel date serial number
- **Display:** Format as "MM/DD/YYYY"

### Boolean Fields (Y/N)
- **Input:** "Y" or "N" (sometimes "Yes"/"No")
- **Process:** Normalize to Y/N
- **Output:** "Y" or "N"
- **Display:** "Yes" or "No"

### Integer Fields
- **Input:** String ("1", "2", "702.00")
- **Process:** Parse as integer (floor for decimals)
- **Output:** Number (1, 2, 702)

---

## Field Validation Rules

### Required Fields
These fields MUST have values, or the row is skipped:
- Address (House Number + Street Name)
- # Bedrooms (must be >= 0)
- Approx SQFT (must be > 0)
- Status (must be valid code)

### Optional Fields
These can be blank/null:
- Sold Price (only if not yet sold)
- Close of Escrow Date (only if not closed)
- Pool (defaults to "N")
- HOA Fee (defaults to 0)
- Garage Spaces (defaults to 0)

### Validation Logic
```typescript
function validateRow(row: any): boolean {
  // Address required
  if (!row['House Number'] || !row['Street Name']) {
    return false;
  }

  // Square feet must be positive
  const sqft = parseFloat(row['Approx SQFT']);
  if (!sqft || sqft <= 0) {
    return false;
  }

  // Bedrooms must be >= 0
  const beds = parseInt(row['# Bedrooms']);
  if (isNaN(beds) || beds < 0) {
    return false;
  }

  // Status must be valid
  const validStatuses = ['A', 'C', 'P', 'U', 'X', 'T', 'W'];
  if (!validStatuses.includes(row['Status'])) {
    return false;
  }

  return true;
}
```

---

## Distance Calculation

Distance from subject property to comp property (Haversine formula):

```typescript
function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 3959; // Earth radius in miles

  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in miles
}

// Usage:
const subjectLat = 33.504731;
const subjectLon = -111.935166;

const compLat = parseFloat(row['Geo Lat']);
const compLon = parseFloat(row['Geo Lon']);

const distance = haversineDistance(subjectLat, subjectLon, compLat, compLon);
// Result: 0.35 miles
```

---

## Example Processing Flow

### Input CSV Row:
```csv
"6888371","Realty ONE Group","(602) 953-4000","Marco Da Silva","","Residential",...,"4620","","N","68","155","","ST","Scottsdale","AZ",...,"325900.00","702.00","1","1.00","1974","173-35-361"
```

### Processing Steps:

1. **Parse CSV** → Extract fields into object
2. **Validate** → Check required fields
3. **Build Address** → "4620 N 68TH ST 155"
4. **Extract Core Fields** → Map to template columns B-Z
5. **Parse Features** → Extract HOA, pool, etc.
6. **Calculate Distance** → From subject property
7. **Format Data** → Convert types, format currency/dates
8. **Insert to Template** → Starting at Column B, Row 2+

### Output Template Row (Columns B-Z):
```
B: "4620 N 68TH ST 155"
C: "Scottsdale"
D: "AZ"
E: "85251"
F: "173-35-361"
G: 325900.00
H: (empty - not yet sold)
I: 325900.00
J: 102
K: "Residential"
L: 1
M: 1.00
N: 702
O: 71
P: 1974
Q: 0
R: "N"
S: 1
T: "Y"
U: 346.50
V: 464.25
W: 0.35
X: "6888371"
Y: "A"
Z: "Walk across the street to Fashion Square Mall..."
```

---

## Error Handling

### Common Issues

**Missing Required Field:**
```typescript
if (!row['# Bedrooms']) {
  logWarning(`Row ${rowNumber}: Missing bedrooms, skipping`);
  continue; // Skip this row
}
```

**Invalid Number:**
```typescript
const price = parseFloat(row['Sold Price']);
if (isNaN(price)) {
  logWarning(`Row ${rowNumber}: Invalid price "${row['Sold Price']}", using 0`);
  price = 0;
}
```

**Missing Geo Coordinates:**
```typescript
if (!row['Geo Lat'] || !row['Geo Lon']) {
  logWarning(`Row ${rowNumber}: Missing coordinates, distance will be N/A`);
  distance = null;
}
```

---

## Processing Statistics

Track these metrics during import:

```typescript
interface ProcessingStats {
  totalRows: number;         // Total rows in CSV
  validRows: number;         // Rows that passed validation
  skippedRows: number;       // Rows skipped (invalid)
  warnings: string[];        // List of warnings
  errors: string[];          // List of errors
  processingTime: number;    // Time in milliseconds
}
```

---

## Sample MLS Files

Located in `/mcao-upload-temp/`:

| File                    | Size   | Rows | Type          | Description                    |
|-------------------------|--------|------|---------------|--------------------------------|
| v0-direct-comps.csv     | 35 KB  | ~50  | Direct comps  | Closest comparables            |
| all-scopes.csv          | 196 KB | ~300 | All scopes    | Broader market data            |
| 1mi-allcomps.csv        | 885 KB | ~1000| 1-mile radius | All comps within 1 mile        |

---

## Field Reference Table

Complete list of all 90+ ARMLS CSV fields:

```
List Number, Agency Name, Agency Phone, Listing Agent, Co-Listing Agent,
Property Type, Card Format, Selling Agency, Selling Agent, Co-Selling Agent,
End Date, Dwelling Type, List Date, Close of Escrow Date, Under Contract Date,
Fallthrough Date, Status, Status Change Date, Temp Off Market Date, Cancel Date,
UCB or CCBS, Original List Price, List Price, Sold Price, Price/SqFt,
Map Code/Grid, House Number, Building Number, Compass, Street Name, Unit #,
St Dir Sfx, St Suffix, City/Town Code, State/Province, County Code, Country,
Zip Code, Geo Lat, Geo Lon, Approx SQFT, Bedrooms Plus, Year Built, # Bedrooms,
Total Bathrooms, # of Interior Levels, Exterior Stories, Source Apx Lot SqFt,
Taxes, Tax Year, Legal Description (Abbrev), Public Remarks, Assessor Number,
Legal, Directions, Ownr/Occ Name - DND2, Owner/Occ Phn - DND2, Marketing Name,
Builder Name, mod_timestamp, Assessor Parcel Ltr, Source of SqFt,
Tax Municipality, Auction, Horses, Ownership, Hundred Block, Type,
Elementary School, Jr. High School, High School, Model, Hndrd Blk Directionl,
Zip4, Week Avail Timeshare, Guest House SqFt, Approx Lot SqFt, Assessor's Book #,
Assessor's Map #, Assessor's Parcel #, Off Market Date, Cross Street, Subdivision,
Dwelling Styles, Flood Zone, Approx Lot Acres, On Market Date, Private Pool Y/N,
Full Bathrooms, Half Bathrooms, Lead Based Hazard Disclosure, Fireplace YN,
Fireplaces Total, Co-Ownership (Fractional) Agreement YN, Community Pool Y/N,
Photo URL, Days on Market, Rooms, Features
```

---

## Implementation Code

Location: `/lib/processing/mls-parser.ts`

```typescript
import papaparse from 'papaparse';

export interface MLSRow {
  // ... type definition based on mapping above
}

export interface ParsedComps {
  comps: MLSRow[];
  stats: ProcessingStats;
}

export async function parseMLSCSV(
  file: File,
  subjectProperty: { lat: number; lon: number }
): Promise<ParsedComps> {
  return new Promise((resolve, reject) => {
    papaparse.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = processRows(results.data, subjectProperty);
        resolve(parsed);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}

function processRows(rows: any[], subjectProperty: any): ParsedComps {
  // Implementation based on mapping above
  // ...
}
```

---

## Testing

Test file processing with actual samples:

```bash
npm run excel:test
```

This script:
1. Loads `v0-direct-comps.csv`
2. Processes through MLS parser
3. Validates output format
4. Displays statistics
5. Writes to test template

---

**END OF MLS FIELD MAPPING DOCUMENT**
