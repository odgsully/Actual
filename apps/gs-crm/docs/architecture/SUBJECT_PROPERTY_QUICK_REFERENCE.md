# Subject Property Quick Reference Card

**For Developers Working on Upload Pipeline**

---

## 🎯 TL;DR - Subject Property Journey

1. **Entry**: API receives `subjectProperty` + `mcaoData`
2. **Creation**: Added to masterList as FIRST entry (Line 231)
3. **Processing**: SKIPS APN lookup, ArcGIS, MCAO fetch (already has data)
4. **Output**: Written to BOTH sheets at row 2 (first data row)

**Key Insight**: Subject Property has MCAO data, NOT MLS data (opposite of comparables)

---

## 🔍 Quick Debug Checklist

### Is Subject Property Missing from Output?

**Check 1**: API Input
```bash
# Look for this in logs:
[Generate Excel] Starting Excel generation for client: Smith
```
✅ If client name appears, API route was called

**Check 2**: Master List Creation
```bash
# Look for this count (should be 1 + comps):
[Generate Excel] Master list created with X properties
```
✅ If count includes +1 for subject, it was added

**Check 3**: Full-MCAO-API Filter
```bash
# Look for this count:
[Generate Excel] Full-MCAO-API: X properties (including subject) with APNs
```
✅ "(including subject)" indicates explicit inclusion worked

**Check 4**: Analysis Sheet Generation
```bash
# Look for this:
[Analysis Generator] Generating Analysis sheet for X properties
```
✅ Count should match master list (includes subject)

**Check 5**: Excel Row 2
- Open generated Excel file
- Check Full-MCAO-API sheet, column B, row 2
- Check Analysis sheet, column A, row 2
✅ Both should say "Subject Property"

---

## 📍 Key Code Locations

### Where Subject Property is Created
```typescript
// app/api/admin/upload/generate-excel/route.ts
// Lines 231-243

if (subjectProperty && mcaoData) {
  masterList.push({
    itemLabel: 'Subject Property',  // ← EXACT STRING
    source: 'subject',
    mcaoData: mcaoData.data,        // ← HAS MCAO DATA
    mlsData: null,                  // ← NO MLS DATA
    // ...
  })
}
```

### Where Subject Property is Included in Full-MCAO-API
```typescript
// app/api/admin/upload/generate-excel/route.ts
// Lines 450-452

const propertiesWithAPN = masterList.filter(p =>
  p.itemLabel === 'Subject Property' ||  // ← ALWAYS TRUE for subject
  (p.hasApn && p.apn)
)
```

### Where Subject Property MLS Matching is Skipped
```typescript
// lib/processing/analysis-sheet-generator.ts
// Lines 120-122

if (property.itemLabel === 'Subject Property') {
  return {}  // ← Returns empty (correct - no MLS data)
}
```

### Where Subject Property Address is Built
```typescript
// app/api/admin/upload/generate-excel/route.ts
// Lines 491-497

if (property.itemLabel === 'Subject Property' && mcao?.propertyAddress?.fullAddress) {
  fullAddress = mcao.propertyAddress.fullAddress  // ← MCAO for subject
} else {
  fullAddress = buildFullAddress(rawData, property.address)  // ← MLS for comps
}
```

---

## 🚨 What Can Go Wrong

### Problem 1: Subject Property Not Created
**Symptom**: Master list count doesn't include subject

**Cause**: Line 231 condition failed
```typescript
if (subjectProperty && mcaoData) { ... }
//     ↓                  ↓
//   Missing          Missing
```

**Fix**: Ensure API request includes both fields:
```json
{
  "subjectProperty": { "address": "..." },
  "mcaoData": { "data": { /* full MCAO response */ } }
}
```

---

### Problem 2: Subject Property Missing from Full-MCAO-API
**Symptom**: Comparables present, subject missing

**Cause**: itemLabel doesn't match exact string

**Fix**: Check itemLabel is EXACTLY `'Subject Property'` (case-sensitive, no whitespace)

---

### Problem 3: Subject Property Has Blank Data
**Symptom**: Row 2 exists but columns are empty

**Cause**: MCAO data structure doesn't match expected format

**Debug**:
```typescript
// Add logging at line 504
console.log('Subject MCAO data:', JSON.stringify(mcao, null, 2))
console.log('Flattened fields:', Object.keys(flattenedMCAO).slice(0, 20))
```

---

### Problem 4: Subject Property in Wrong Row
**Symptom**: Subject not in row 2

**Cause**: masterList order corrupted

**Fix**: Subject MUST be added first (line 231 before line 270)
```typescript
// Correct order:
masterList.push({ /* subject */ })          // Line 231
addProperties(residential15Mile, ...)        // Line 270
addProperties(residentialLease15Mile, ...)   // Line 271
```

---

## 🛡️ Protection Mechanisms

### Protection 1: Explicit Inclusion Filter
**Location**: Line 450
```typescript
p.itemLabel === 'Subject Property'  // ← Doesn't depend on hasApn
```
**Protects Against**: Missing APN, hasApn flag not set

---

### Protection 2: Source Type Exclusion
**Location**: Line 89
```typescript
p.source !== 'subject'  // ← Explicitly skip subject
```
**Protects Against**: Unnecessary ArcGIS lookups, API quota waste

---

### Protection 3: Special Case Handling
**Locations**: Lines 120, 491
```typescript
if (property.itemLabel === 'Subject Property') { ... }
```
**Protects Against**: Using wrong data source (MLS vs MCAO)

---

### Protection 4: Triple Fallback Chain
**Location**: Line 233
```typescript
mcao.fullAddress || subjectProperty.address || 'Subject Property'
```
**Protects Against**: Blank address fields

---

## 📊 Expected Data Structure

### Subject Property Input
```json
{
  "subjectProperty": {
    "address": "123 Main St"  // Minimal - just identifier
  },
  "mcaoData": {
    "data": {
      "apn": "123-45-678",
      "propertyAddress": {
        "fullAddress": "123 Main St, Phoenix, AZ 85001"
      },
      "bedrooms": 3,
      "bathrooms": 2,
      "improvementSize": 1500,
      "lotSize": 7200,
      "yearBuilt": 2005,
      // ... 285+ more fields
    }
  }
}
```

### masterList Entry
```typescript
{
  address: "123 Main St, Phoenix, AZ 85001",
  apn: "123-45-678",
  itemLabel: "Subject Property",        // EXACT string
  source: "subject",
  mlsData: null,                         // Always null
  mcaoData: { /* full MCAO object */ },
  hasApn: true,
  hasMCAOData: true,
  needsLookup: false
}
```

### Analysis Sheet Row 2
```
| Item              | FULL_ADDRESS                     | APN        | STATUS | ... |
|-------------------|----------------------------------|------------|--------|-----|
| Subject Property  | 123 Main St, Phoenix, AZ 85001  | 123-45-678 | N/A    | ... |
```

### Full-MCAO-API Sheet Row 2
```
| FULL_ADDRESS                     | Item             | APN        | Owner_Name | ... |
|----------------------------------|------------------|------------|------------|-----|
| 123 Main St, Phoenix, AZ 85001  | Subject Property | 123-45-678 | John Doe   | ... |
```

---

## 🧪 Testing Subject Property

### Manual Test
```bash
# 1. Send POST request with subject + MCAO data
curl -X PUT http://localhost:3000/api/admin/upload/generate-excel \
  -H "Content-Type: application/json" \
  -d '{
    "subjectProperty": {"address": "123 Main St"},
    "mcaoData": {"data": { /* MCAO response */ }},
    "clientName": "Test Client"
  }'

# 2. Check logs for these lines:
#    "Master list created with X properties" (X >= 1)
#    "Full-MCAO-API: X properties (including subject)"
#    "Generating Analysis sheet for X properties"

# 3. Download Excel file

# 4. Verify row 2 in both sheets contains "Subject Property"
```

### Automated Test (recommended)
```typescript
describe('Subject Property Flow', () => {
  it('should include subject in master list', () => {
    const masterList = buildMasterPropertyList(
      { address: '123 Main' },
      [], [], [], [],
      { data: { apn: '123-45-678' } }
    )
    expect(masterList[0].itemLabel).toBe('Subject Property')
  })

  it('should include subject in Full-MCAO-API filter', () => {
    const props = [
      { itemLabel: 'Subject Property', hasApn: false },
      { itemLabel: 'Residential 1.5 Mile Comps', hasApn: true, apn: '999' }
    ]
    const filtered = props.filter(p =>
      p.itemLabel === 'Subject Property' || (p.hasApn && p.apn)
    )
    expect(filtered.length).toBe(2)
    expect(filtered[0].itemLabel).toBe('Subject Property')
  })
})
```

---

## 📝 Common Scenarios

### Scenario 1: Subject Has APN
```typescript
// Input
mcaoData.data.apn = "123-45-678"

// Result
✅ hasApn = true
✅ Included in Full-MCAO-API (via itemLabel check)
✅ APN column populated
```

### Scenario 2: Subject Missing APN
```typescript
// Input
mcaoData.data.apn = undefined

// Result
✅ hasApn = false
✅ STILL included in Full-MCAO-API (via itemLabel check)
✅ APN column shows ''
```

### Scenario 3: Subject Has Minimal Data
```typescript
// Input
mcaoData.data = { apn: "123-45-678" }  // Only APN, no other fields

// Result
✅ Included in both sheets
✅ Most columns show '' or 'N/A'
✅ APN and Item columns populated
⚠️  User sees incomplete data (expected)
```

### Scenario 4: Subject Missing Entirely
```typescript
// Input
subjectProperty = null  // OR mcaoData = null

// Result
❌ NOT created in master list
❌ NOT in Full-MCAO-API sheet
❌ NOT in Analysis sheet
🔴 HIGH RISK - Complete loss of subject
```

---

## 🎓 Design Principles

### 1. Subject Property is Special
- Has MCAO data (NOT MLS data)
- Always first in masterList
- Always row 2 in output sheets
- Gets explicit inclusion in filters

### 2. No MLS Data for Subject
- `mlsData` field is always `null`
- MLS-only columns show 'N/A' or ''
- `IN_MLS?` column shows 'N'
- This is CORRECT (not a bug)

### 3. MCAO Data is Authoritative
- Address from MCAO (not built from MLS parts)
- Property characteristics from MCAO
- Sales history from MCAO
- This is the SOURCE OF TRUTH for subject

### 4. Explicit > Implicit
- Filter uses explicit string check: `p.itemLabel === 'Subject Property'`
- NOT using hasApn or hasMCAOData flags
- Prevents accidental exclusion

---

## 🔗 Related Files

| File | Purpose | Subject Property Role |
|------|---------|----------------------|
| `route.ts` | Main API handler | Creates subject in masterList |
| `analysis-sheet-generator.ts` | Analysis sheet | Handles subject specially in MLS matching |
| `batch-apn-lookup.ts` | APN lookup | Skips subject (already has data) |
| `fetch-property-data.ts` | MCAO data fetch | Skips subject (already has data) |
| `types/mls-data.ts` | Type definitions | Defines `ItemLabel` type |

---

## 💡 Pro Tips

1. **Always check itemLabel first** when debugging subject issues
2. **Subject Property is masterList[0]** - if not, something went wrong earlier
3. **Log everything** at line 231 - this is the single point of failure
4. **MCAO data structure varies** - use defensive coding (`mcao?.field`)
5. **itemLabel is case-sensitive** - 'Subject Property' !== 'subject property'

---

## 🚀 Future Enhancements

### Recommended Improvements

1. **Add itemLabel normalization**
   ```typescript
   const normalizeLabel = (s) => (s || '').trim()
   ```

2. **Add comprehensive logging**
   ```typescript
   console.log(`✓ Subject Property: ${address} (APN: ${apn})`)
   ```

3. **Add final verification**
   ```typescript
   const row2Item = sheet.getRow(2).getCell(2).value
   assert(row2Item === 'Subject Property')
   ```

4. **Add API contract validation**
   ```typescript
   if (!mcaoData?.data) {
     throw new Error('Subject Property requires MCAO data')
   }
   ```

---

**Quick Reference Version**: 1.0
**Last Updated**: 2025-10-24
**Covers**: route.ts (lines 33-634), analysis-sheet-generator.ts (lines 1-481)
