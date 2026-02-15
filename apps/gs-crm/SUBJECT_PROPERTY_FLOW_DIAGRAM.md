# Subject Property Data Flow - Visual Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          API REQUEST BODY (PUT)                              │
│                  /api/admin/upload/generate-excel/route.ts                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    │                                   │
            ┌───────▼───────┐                  ┌────────▼────────┐
            │ subjectProperty│                  │   mcaoData      │
            │  (minimal)     │                  │ (full MCAO API) │
            └───────┬────────┘                  └────────┬────────┘
                    │                                    │
                    └─────────────┬──────────────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │  buildMasterPropertyList()│
                    │        Line 220            │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │   Subject Property Entry   │
                    │   (Lines 231-243)          │
                    │                            │
                    │ ✓ itemLabel: "Subject     │
                    │    Property"               │
                    │ ✓ source: "subject"        │
                    │ ✓ mlsData: null            │
                    │ ✓ mcaoData: [full object]  │
                    │ ✓ hasApn: true/false       │
                    │ ✓ hasMCAOData: true        │
                    │ ✓ needsLookup: false       │
                    └─────────────┬─────────────┘
                                  │
                                  │ masterList[0]
                                  │
                    ┌─────────────▼─────────────┐
                    │    MASTER LIST ARRAY       │
                    │                            │
                    │  [0] Subject Property      │
                    │  [1] Resi 1.5 Mile Comp 1  │
                    │  [2] Resi 1.5 Mile Comp 2  │
                    │  ...                       │
                    └─────────────┬─────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        │ SKIP APN                │ SKIP ArcGIS             │ SKIP MCAO
        │ Extraction              │ Lookup                  │ Fetch
        │ (Line 71)               │ (Line 89)               │ (Line 127)
        │ !mlsData                │ source !== 'subject'    │ mcaoData exists
        │ ✓ Correct               │ ✓ Correct               │ ✓ Correct
        │                         │                         │
        └─────────────────────────┴─────────────────────────┘
                                  │
                                  │ masterList unchanged
                                  │
        ┌─────────────────────────┴─────────────────────────┐
        │                                                     │
        ▼                                                     ▼
┌───────────────────┐                             ┌─────────────────────┐
│ PATH A:           │                             │ PATH B:             │
│ Full-MCAO-API     │                             │ Analysis Sheet      │
│ Sheet             │                             │                     │
└───────┬───────────┘                             └──────┬──────────────┘
        │                                                │
        │ populateFullMCAOAPISheet()                     │ generateAnalysisSheet()
        │ Lines 436-472                                  │ Lines 154-208
        │                                                │
        ▼                                                ▼
┌───────────────────┐                         ┌─────────────────────────┐
│ Filter Logic      │                         │ Transform Properties    │
│ Line 450-452      │                         │ Lines 174-180           │
│                   │                         │                         │
│ EXPLICIT INCLUDE: │                         │ propertiesForAnalysis = │
│ ┌─────────────┐   │                         │   masterList.map(p => ({ │
│ │p.itemLabel  │   │                         │     itemLabel: p.item.. │
│ │===          │   │                         │     mlsData: p.mlsData  │
│ │'Subject     │   │                         │     mcaoData: p.mcao..  │
│ │Property'    │   │                         │     address: p.addr..   │
│ └─────────────┘   │                         │   }))                   │
│        OR         │                         │                         │
│ ┌─────────────┐   │                         │ Subject preserved:      │
│ │p.hasApn &&  │   │                         │ ┌─────────────────┐    │
│ │p.apn        │   │                         │ │itemLabel: 'Subj'│    │
│ └─────────────┘   │                         │ │mlsData: null    │    │
│                   │                         │ │mcaoData: [full] │    │
│ ✓ Subject ALWAYS  │                         │ │address: "123..."│    │
│   included        │                         │ └─────────────────┘    │
└───────┬───────────┘                         └──────┬──────────────────┘
        │                                            │
        │ propertiesWithAPN.forEach()                │ buildMLSDataIndex()
        │ Line 466                                   │ Lines 63-108
        │                                            │
        ▼                                            ▼
┌───────────────────┐                       ┌───────────────────────────┐
│ Row Assignment    │                       │ MLS Sheet Index           │
│                   │                       │                           │
│ index=0 → Row 2   │                       │ [Reads MLS-Resi-Comps]   │
│ (First data row)  │                       │ [Reads MLS-Lease-Comps]  │
│                   │                       │                           │
│ Subject Property  │                       │ Subject NOT in index     │
│ guaranteed row 2  │                       │ ✓ Correct (no MLS data)  │
└───────┬───────────┘                       └──────┬───────────────────┘
        │                                          │
        │ populateMCAORowFromTemplate()            │ findMLSDataForProperty()
        │ Lines 482-558                            │ Lines 114-148
        │                                          │
        ▼                                          ▼
┌───────────────────────────────┐       ┌────────────────────────────────┐
│ Address Building (489-497)    │       │ Special Subject Handling       │
│                               │       │                                │
│ IF itemLabel === 'Subject     │       │ IF itemLabel === 'Subject      │
│    Property':                 │       │    Property':                  │
│   ✓ Use MCAO fullAddress      │       │   RETURN {} (empty object)     │
│ ELSE:                         │       │ ELSE:                          │
│   ✓ Build from MLS rawData    │       │   Match by Item label + index  │
│                               │       │                                │
│ Fallback chain:               │       │ ✓ Subject gets empty rawData   │
│ mcao.fullAddress →            │       │                                │
│ property.address →            │       │                                │
│ 'Subject Property'            │       │                                │
└───────┬───────────────────────┘       └──────┬─────────────────────────┘
        │                                      │
        │ Column Mapping (513-557)             │ addPropertyRow()
        │                                      │ Lines 264-395
        │                                      │
        ▼                                      ▼
┌───────────────────────────────┐     ┌──────────────────────────────────┐
│ Full-MCAO-API Row 2:          │     │ Analysis Row 2:                  │
│                               │     │                                  │
│ Col A: FULL_ADDRESS           │     │ Col A: "Subject Property"        │
│   → mcao.propertyAddress      │     │ Col B: FULL_ADDRESS              │
│                               │     │   → mcao.propertyAddress         │
│ Col B: "Subject Property"     │     │ Col C: APN                       │
│   → property.itemLabel        │     │   → mcao.apn                     │
│                               │     │                                  │
│ Col C: APN                    │     │ MCAO Columns (K-N, Z, AB-AC):    │
│   → property.apn              │     │   → mcao.bedrooms, bathrooms,    │
│                               │     │      improvementSize, lotSize,   │
│ Cols D-AJL: MCAO Data         │     │      yearBuilt, propertyType,    │
│   → flattenedMCAO[header]     │     │      subdivision                 │
│   → 285+ MCAO API fields      │     │                                  │
│                               │     │ MLS Columns (D-H, Q, V, W, AA):  │
└───────────────────────────────┘     │   → 'N/A' or '' (no MLS data)    │
                                      │                                  │
                                      │ Col T: IN_MLS? = 'N'             │
                                      │ Col U: IN_MCAO? = 'Y'            │
                                      └──────────────────────────────────┘

                    ┌─────────────────────────────┐
                    │      FINAL WORKBOOK         │
                    │                             │
                    │ ✓ Full-MCAO-API Sheet       │
                    │   - Row 1: Headers (289)    │
                    │   - Row 2: Subject Property │
                    │   - Row 3+: Comparables     │
                    │                             │
                    │ ✓ Analysis Sheet            │
                    │   - Row 1: Headers (29)     │
                    │   - Row 2: Subject Property │
                    │   - Row 3+: Comparables     │
                    │                             │
                    │ ✓ MLS-Resi-Comps Sheet      │
                    │   - No Subject Property     │
                    │   - Only Resi comps         │
                    │                             │
                    │ ✓ MLS-Lease-Comps Sheet     │
                    │   - No Subject Property     │
                    │   - Only Lease comps        │
                    └─────────────────────────────┘
```

---

## Key Decision Points

### 1. masterList Creation (Line 231)
```
┌─────────────────────────────────────┐
│ if (subjectProperty && mcaoData)    │
├─────────────────────────────────────┤
│ ✅ TRUE  → Subject added to list    │
│ ❌ FALSE → Subject LOST (HIGH RISK) │
└─────────────────────────────────────┘
```

### 2. Full-MCAO-API Filter (Line 450)
```
┌──────────────────────────────────────────────┐
│ p.itemLabel === 'Subject Property'           │
│              OR                              │
│ (p.hasApn && p.apn)                          │
├──────────────────────────────────────────────┤
│ Subject Property: ✅ ALWAYS TRUE (first cond)│
│ Comparables:      ✅ TRUE if has APN         │
└──────────────────────────────────────────────┘
```

### 3. MCAO Address Logic (Line 491)
```
┌────────────────────────────────────────────────┐
│ if (itemLabel === 'Subject Property' &&       │
│     mcao?.propertyAddress?.fullAddress)        │
├────────────────────────────────────────────────┤
│ ✅ TRUE  → Use MCAO address (authoritative)   │
│ ❌ FALSE → Build from MLS data (comparables)  │
└────────────────────────────────────────────────┘
```

### 4. MLS Data Lookup (Line 120)
```
┌────────────────────────────────────────────────┐
│ if (property.itemLabel === 'Subject Property')│
├────────────────────────────────────────────────┤
│ ✅ TRUE  → Return {} (no MLS data needed)     │
│ ❌ FALSE → Match from MLS sheet index         │
└────────────────────────────────────────────────┘
```

---

## Data Priority Matrix

### Subject Property Column Sources

| Column | MLS Data | MCAO Data | Result |
|--------|----------|-----------|--------|
| **FULL_ADDRESS** | ❌ | ✅ | MCAO |
| **APN** | ❌ | ✅ | MCAO |
| **STATUS** | ❌ | ❌ | 'N/A' |
| **BR** | ❌ | ✅ | MCAO |
| **BA** | ❌ | ✅ | MCAO |
| **SQFT** | ❌ | ✅ | MCAO |
| **LOT_SIZE** | ❌ | ✅ | MCAO |
| **YEAR_BUILT** | ❌ | ✅ | MCAO |
| **DWELLING_TYPE** | ❌ | ✅ | MCAO |
| **SUBDIVISION** | ❌ | ✅ | MCAO |
| **LAT/LON** | ❌ | ✅ | MCAO |
| **SELLER_BASIS** | ❌ | ✅ | MCAO |
| **OG_LIST_PRICE** | ❌ | ❌ | '' |
| **SALE_PRICE** | ❌ | ❌ | '' |
| **DAYS_ON_MARKET** | ❌ | ❌ | '' |
| **AGENCY_PHONE** | ❌ | ❌ | 'N/A' |
| **IN_MLS?** | ❌ | - | 'N' |
| **IN_MCAO?** | - | ✅ | 'Y' |

### Comparable Property Column Sources (for contrast)

| Column | MLS Data | MCAO Data | Result |
|--------|----------|-----------|--------|
| **FULL_ADDRESS** | ✅ | ✅ | MLS (built) |
| **APN** | ✅ | ✅ | MLS or MCAO |
| **STATUS** | ✅ | ❌ | MLS |
| **BR** | ✅ | ✅ | MLS (fallback MCAO) |
| **BA** | ✅ | ✅ | MLS (fallback MCAO) |
| **SQFT** | ✅ | ✅ | MLS (fallback MCAO) |
| **LOT_SIZE** | ✅ | ✅ | MCAO (fallback MLS) |
| **OG_LIST_PRICE** | ✅ | ❌ | MLS |
| **SALE_PRICE** | ✅ | ❌ | MLS |
| **DAYS_ON_MARKET** | ✅ | ❌ | MLS |
| **AGENCY_PHONE** | ✅ | ❌ | MLS |
| **IN_MLS?** | ✅ | - | 'Y' |
| **IN_MCAO?** | - | ✅/❌ | 'Y' or 'N' |

---

## Protection Mechanisms

### 1. Explicit Inclusion (Line 450)
```
Subject Property Filter:
  p.itemLabel === 'Subject Property'  ← Does NOT depend on hasApn
        OR
  (p.hasApn && p.apn)

Protection Level: 🟢 STRONG
- Subject included even without APN
- Subject included even without MCAO data (if itemLabel set)
```

### 2. Source Type Exclusion (Line 89)
```
ArcGIS Lookup Filter:
  !p.hasApn && p.source !== 'subject'
                         ↑
                    Explicit exclusion

Protection Level: 🟢 STRONG
- Subject never goes through unnecessary ArcGIS lookup
- Prevents API quota waste
```

### 3. Special Case Handling (Line 120, 491)
```
Multiple explicit checks:
  if (property.itemLabel === 'Subject Property') { ... }

Protection Level: 🟢 STRONG
- Subject handled specially in 3 locations
- Prevents wrong data source usage
```

### 4. Triple Fallback Chain (Line 233)
```
Address Resolution:
  mcao.propertyAddress.fullAddress
    ↓ (if missing)
  subjectProperty.address
    ↓ (if missing)
  'Subject Property' (literal)

Protection Level: 🟢 STRONG
- Prevents blank addresses
- Guarantees some identifier
```

---

## Critical Path Summary

**Total Steps**: 11 stages
**Branching Points**: 2 (PATH A and PATH B)
**Filter Checks**: 4 explicit Subject Property checks
**Data Sources**: 2 (subjectProperty input, mcaoData input)
**Output Sheets**: 2 (Full-MCAO-API, Analysis)
**Row Position**: Always row 2 (guaranteed first data row)

**Single Point of Failure**: Line 231 (`if (subjectProperty && mcaoData)`)
- If FALSE: Subject Property completely lost
- All other protections downstream become irrelevant
- **Mitigation**: Add API contract validation + comprehensive logging
