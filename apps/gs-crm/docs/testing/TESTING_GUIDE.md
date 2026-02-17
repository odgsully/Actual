# Full-MCAO-API Population Testing Guide

## What to Look For

### 1. Upload the CSV Files
Navigate to MLS Uploads page and upload your 4 CSV files from:
`/Users/garrettsullivan/Desktop/‼️/RE/RealtyONE/MY LISTINGS/Mozingo 10.25/comps/THIS/`

### 2. Watch Console Logs (Critical Debug Info)

#### Step 2 - APN Extraction:
```
[Generate Excel] Extracting APNs from MLS data...
[Generate Excel] Found APN in MLS data for <address>: 173-24-323
[Generate Excel] 249/249 properties have APNs from MLS data
```

#### Step 3 - ArcGIS APN Lookup (if needed):
```
[Generate Excel] 0 addresses still need APN lookup via ArcGIS
```
(Should be 0 since all MLS data has APNs)

#### Step 4 - MCAO Property Data Fetch (CRITICAL):
```
[Generate Excel] Fetching full MCAO property data for 249 APNs...
[MCAO Property Data] Fetching property data for APN: 173-24-323
[MCAO Property Data] ✓ Found property data for APN 173-24-323 (85 fields)
[Generate Excel] MCAO fetch progress: 10/249
[Generate Excel] MCAO fetch progress: 20/249
...
[Generate Excel] MCAO data fetch complete: 249 properties enriched
```

#### Step 9 - Full-MCAO-API Population (DEBUG):
```
[Generate Excel] Full-MCAO-API: 249 properties with APNs
[Generate Excel] [DEBUG] First property MCAO data:
  Address: 4620 N 68TH ST 155, Scottsdale, AZ 85251
  APN: 173-24-323
  Has MCAO data: true
  MCAO fields: 85
  First 10 MCAO fields: ['apn', 'OBJECTID', 'APN', 'APN_DASH', 'PHYSICAL_ADDRESS', ...]
[Generate Excel] [DEBUG] Column 1 (FULL_ADDRESS): 4620 N 68TH ST 155, Scottsdale, AZ 85251
[Generate Excel] [DEBUG] Column 2 (Item): Residential 1.5 Mile Comps
[Generate Excel] [DEBUG] Column 3 (APN): 173-24-323
[Generate Excel] [DEBUG] Column 4 (MCR): <some value>
[Generate Excel] [DEBUG] Column 5 (MoreAssociatedParcelsExist): <some value>
...
[Generate Excel] Populated 249 rows in Full-MCAO-API
```

### 3. Expected Excel Output

**Full-MCAO-API Sheet:**
- ✅ Column A: FULL_ADDRESS (e.g., "4620 N 68TH ST 155, Scottsdale, AZ 85251")
- ✅ Column B: Item label (e.g., "Residential 1.5 Mile Comps")
- ✅ Column C: APN (e.g., "173-24-323")
- ✅ Column D+: MCAO data fields (MCR, PropertyAddress, LotSize, etc.)

### 4. Debugging Steps

#### If columns D+ are still blank:

**Check the debug logs for:**
1. **"MCAO fields: 85"** - Should show ~80-100 fields fetched
2. **"First 10 MCAO fields: [...]"** - Shows actual field names from API
3. **Column debug logs** - Shows which columns matched

**Common issue:** Field name mismatch
- Template column: `MCR`
- API field name: `PHYSICAL_STREET_NUM` or similar

**Solution:** The logs will show us the exact field names so we can add a mapping.

### 5. What to Send Back

If columns D+ are still blank, please send:
1. Screenshot of the Excel Full-MCAO-API sheet
2. **Console logs** showing:
   - "MCAO fields: XX"
   - "First 10 MCAO fields: [...]"
   - Column debug logs (columns 4-15)

This will show us exactly which field names the MCAO API returns vs what the template expects.

---

## Current Status

✅ Column A: FULL_ADDRESS - Should populate
✅ Column B: Item label - Should populate
✅ Column C: APN - Should populate (confirmed from screenshot)
❓ Columns D+: MCAO data - **Waiting for debug logs to diagnose**

The fix is in place to fetch the data. The debug logs will tell us if we need a field name mapping.
