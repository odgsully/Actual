# MCAO Property Lookup - Address Support Update

**Date:** October 24, 2025
**Updated By:** Claude Code

## Summary

Updated the MCAO Property lookup page to accept full addresses in addition to APNs, using the same ArcGIS lookup logic as the MLS Upload page. Users can now search properties by address alone - no APN required!

## Changes Made

### 1. Backend API Update (`app/api/admin/mcao/lookup/route.ts`)

**What Changed:**
- Added support for address-based lookup using ArcGIS
- API now accepts either `apn` OR `address` in request body
- Automatically looks up APN from address using the same `arcgis-lookup.ts` service used by MLS Upload

**New Features:**
- Address → APN lookup using public Maricopa County ArcGIS endpoints
- Three lookup methods: exact_where, loose_where, geocode_identify
- Returns lookup method and confidence score when address is used
- Maintains backward compatibility with direct APN input

**Request Format:**
```json
// Option 1: By Address (NEW!)
{
  "address": "1234 N Main St, Phoenix, AZ 85001"
}

// Option 2: By APN (still supported)
{
  "apn": "123-45-678"
}
```

**Response Additions:**
```json
{
  "success": true,
  "apn": "123-45-678A",           // Resolved APN
  "lookupMethod": "exact_where",   // How APN was found
  "lookupConfidence": 1.0,         // Confidence (0-1)
  "data": { ... },                 // MCAO property data
  "categorizedData": { ... },
  "fieldCount": 287
}
```

### 2. Frontend UI Update (`app/admin/mcao/page.tsx`)

**What Changed:**
- Renamed state from `apn` to `searchInput` to reflect dual input support
- Input field now accepts both addresses and APNs
- Added helpful UI note explaining address-only search capability
- Shows APN lookup info (method & confidence) when address is used

**UI Improvements:**
1. **Input Field:**
   - New placeholder: "Enter address (e.g., 1234 N Main St, Phoenix, AZ) or APN (123-45-678)"
   - Automatically detects input type (APN vs address) using regex pattern
   - Sends appropriate request format to API

2. **Info Banner:**
   - Added note: "💡 You can now search by full address only - no APN needed!"
   - Explains same logic as MLS Upload page

3. **Results Display:**
   - Shows APN lookup details when address is used:
     ```
     ✓ Found APN: 123-45-678A via exact_where (confidence: 100%)
     ```
   - Blue info banner clearly shows how APN was resolved

### 3. Logic Flow

**Address Input Flow:**
```
User enters address
    ↓
Frontend detects it's not an APN (no XXX-XX-XXX pattern)
    ↓
Sends { address: "..." } to API
    ↓
API calls lookupAPNFromAddress() from arcgis-lookup.ts
    ↓
ArcGIS tries 3 methods:
    1. Exact WHERE query (street + number + type + city)
    2. Loose WHERE query (without street type)
    3. Geocode + Identify (coordinate-based)
    ↓
Returns APN + method + confidence
    ↓
API proceeds with normal MCAO lookup using APN
    ↓
Returns full property data + lookup metadata
    ↓
UI displays results with APN resolution info
```

**APN Input Flow (unchanged):**
```
User enters APN
    ↓
Frontend detects APN pattern (XXX-XX-XXX)
    ↓
Sends { apn: "..." } to API
    ↓
API validates and formats APN
    ↓
Proceeds directly to MCAO lookup
    ↓
Returns property data (no lookup metadata)
```

## Files Modified

1. `/apps/gsrealty-client/app/api/admin/mcao/lookup/route.ts`
   - Added address parameter support
   - Integrated arcgis-lookup service
   - Added lookup metadata to response

2. `/apps/gsrealty-client/app/admin/mcao/page.tsx`
   - Updated state management (apn → searchInput)
   - Smart input detection (APN vs address)
   - Enhanced results display with lookup info

## Testing Recommendations

### Test Cases:

1. **Address Lookup (Standard Format):**
   ```
   Input: "1234 N Main St, Phoenix, AZ 85001"
   Expected: APN found via exact_where, confidence 100%
   ```

2. **Address Lookup (No Street Type):**
   ```
   Input: "1234 N Main, Phoenix, AZ"
   Expected: APN found via loose_where, confidence 85%
   ```

3. **Address Lookup (Geocode Fallback):**
   ```
   Input: "1234 Main Street Phoenix"
   Expected: APN found via geocode_identify, confidence 75%
   ```

4. **Direct APN Lookup:**
   ```
   Input: "123-45-678"
   Expected: Direct MCAO lookup, no lookup metadata
   ```

5. **Invalid Address:**
   ```
   Input: "PO Box 123"
   Expected: Error - "Could not find APN for this address"
   ```

## Benefits

1. **User Convenience:** No need to find APN separately - just enter the address
2. **Consistency:** Same lookup logic as MLS Upload page
3. **Transparency:** Shows exactly how APN was found (method + confidence)
4. **Backward Compatible:** Still accepts direct APN input
5. **Smart Detection:** Automatically determines input type

## Technical Notes

- Uses public Maricopa County ArcGIS endpoints (no API key required)
- Same `arcgis-lookup.ts` service as MLS Upload (shared logic)
- Rate limiting: 5 requests/second
- Timeout: 20 seconds per lookup
- Pre-filters invalid addresses (PO Boxes, no street number, too short)

## Related Files

- `/lib/mcao/arcgis-lookup.ts` - ArcGIS lookup service (shared with MLS Upload)
- `/lib/mcao/batch-apn-lookup.ts` - Batch lookup utility (used by MLS Upload)
- `/app/api/admin/upload/generate-excel/route.ts` - MLS Upload page (reference implementation)

## Next Steps

- [ ] Test with various address formats
- [ ] Monitor ArcGIS lookup success rates
- [ ] Consider adding address validation/autocomplete
- [ ] Update bulk upload to support address column (future enhancement)
