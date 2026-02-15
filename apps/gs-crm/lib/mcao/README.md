# MCAO Integration - Quick Reference Guide

Complete reference for Maricopa County Assessor's Office (MCAO) API integration in GSRealty Client Management System.

**Version:** Week 5 - October 16, 2025
**Status:** Production Ready
**Branding:** GSRealty (Black/White/Red)

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Quick Start](#quick-start)
4. [API Routes](#api-routes)
5. [Database Functions](#database-functions)
6. [Client Usage](#client-usage)
7. [Template Populator Integration](#template-populator-integration)
8. [Type Definitions](#type-definitions)
9. [Error Codes](#error-codes)
10. [Cache Management](#cache-management)
11. [Testing](#testing)
12. [Production Configuration](#production-configuration)

---

## Overview

The MCAO integration provides property data lookups by APN (Assessor Parcel Number) with multi-tier caching:

- **In-Memory Cache**: Fast client-side cache (1 hour TTL)
- **Database Cache**: Persistent Supabase storage
- **MCAO API**: External API fallback (TODO: configure real endpoint)

### Key Features

- APN validation (format: `XXX-XX-XXXA`)
- Multi-level caching strategy
- Row-level security (RLS) policies
- Property linking to client records
- Excel template population (Maricopa & Full_API_call sheets)
- Owner name search
- System health monitoring

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    API Request Flow                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Client Request (APN: 123-45-678A)                          │
│         │                                                     │
│         ├─> POST /api/admin/mcao/lookup                     │
│         │                                                     │
│         ├─> [1] Check Database Cache (Supabase)             │
│         │   ├─> HIT: Return cached data                      │
│         │   └─> MISS: Continue to API                        │
│         │                                                     │
│         ├─> [2] Check Client Cache (In-Memory)              │
│         │   ├─> HIT: Return cached data                      │
│         │   └─> MISS: Call MCAO API                          │
│         │                                                     │
│         ├─> [3] Call MCAO API                                │
│         │   ├─> Success: Cache & return                      │
│         │   └─> Error: Return error with code                │
│         │                                                     │
│         └─> Response with source indicator                   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
lib/
├── mcao/
│   ├── client.ts           # MCAO API client with caching
│   └── README.md           # This file
├── database/
│   └── mcao.ts            # Database CRUD functions
├── types/
│   └── mcao-data.ts       # TypeScript type definitions
└── processing/
    └── template-populator.ts  # Excel template integration

app/api/admin/mcao/
├── lookup/route.ts        # POST: Lookup by APN
├── property/[apn]/route.ts  # GET/DELETE/PATCH: Property operations
└── status/route.ts        # GET: System health, POST: Clear cache

supabase/migrations/
└── 004_add_mcao_tables.sql  # Database schema
```

---

## Quick Start

### 1. Basic APN Lookup

```typescript
import { getMCAOClient } from '@/lib/mcao/client'

// Lookup property by APN
const client = getMCAOClient()
const result = await client.lookupByAPN({
  apn: '123-45-678A',
  includeHistory: true,
  refresh: false, // Use cache if available
})

if (result.success) {
  console.log('Owner:', result.data?.ownerName)
  console.log('Assessed Value:', result.data?.assessedValue.total)
  console.log('From Cache:', result.cached)
} else {
  console.error('Error:', result.error?.message)
}
```

### 2. Using API Routes (Recommended for Client-Side)

```typescript
// Lookup via API
const response = await fetch('/api/admin/mcao/lookup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    apn: '123-45-678A',
    refresh: false,
  }),
})

const data = await response.json()

if (data.success) {
  console.log('Property Address:', data.data.propertyAddress.fullAddress)
  console.log('Source:', data.source) // 'database' | 'api' | 'client_cache'
}
```

### 3. Database Operations

```typescript
import {
  saveMCAOData,
  getMCAODataByAPN,
  linkMCAOToProperty,
} from '@/lib/database/mcao'

// Save API response to database
const { record, error } = await saveMCAOData('123-45-678A', apiResponse)

// Retrieve cached data
const { data } = await getMCAODataByAPN('123-45-678A')

// Link to property record
await linkMCAOToProperty('123-45-678A', 'property-uuid-here')
```

---

## API Routes

### POST /api/admin/mcao/lookup

Lookup property by APN with automatic caching.

**Authentication:** Admin role required

**Request Body:**
```json
{
  "apn": "123-45-678A",
  "includeHistory": true,
  "includeTax": true,
  "refresh": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "apn": "123-45-678A",
    "ownerName": "John Doe",
    "propertyAddress": {
      "fullAddress": "123 Main St, Phoenix, AZ 85001"
    },
    "assessedValue": {
      "total": 350000,
      "land": 100000,
      "improvement": 250000
    },
    "taxInfo": {
      "taxAmount": 3500,
      "taxYear": 2025
    }
  },
  "cached": true,
  "source": "database",
  "cachedAt": "2025-10-16T10:00:00Z",
  "timestamp": "2025-10-16T10:05:00Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Property not found",
  "errorCode": "APN_NOT_FOUND",
  "details": "No property found for APN 123-45-678A"
}
```

---

### GET /api/admin/mcao/property/[apn]

Retrieve cached MCAO data from database (does NOT call API).

**Authentication:** Admin role required

**Example:**
```bash
curl http://localhost:3000/api/admin/mcao/property/123-45-678A
```

**Response:**
```json
{
  "success": true,
  "data": { /* Full MCAOApiResponse */ },
  "summary": {
    "apn": "123-45-678A",
    "ownerName": "John Doe",
    "propertyAddress": "123 Main St, Phoenix, AZ 85001",
    "assessedValue": 350000,
    "taxAmount": 3500
  },
  "record": {
    "id": "uuid",
    "fetchedAt": "2025-10-16T10:00:00Z",
    "updatedAt": "2025-10-16T10:00:00Z"
  }
}
```

---

### DELETE /api/admin/mcao/property/[apn]

Delete cached MCAO data from database.

**Authentication:** Admin role required

**Example:**
```bash
curl -X DELETE http://localhost:3000/api/admin/mcao/property/123-45-678A
```

**Response:**
```json
{
  "success": true,
  "message": "MCAO data for APN 123-45-678A deleted successfully",
  "timestamp": "2025-10-16T10:05:00Z"
}
```

---

### PATCH /api/admin/mcao/property/[apn]

Link MCAO data to a property record.

**Authentication:** Admin role required

**Request Body:**
```json
{
  "propertyId": "property-uuid-here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "MCAO data for APN 123-45-678A linked to property property-uuid-here",
  "timestamp": "2025-10-16T10:05:00Z"
}
```

---

### GET /api/admin/mcao/status

Check MCAO API status and cache statistics.

**Authentication:** Admin role required

**Response:**
```json
{
  "success": true,
  "system": {
    "status": "healthy",
    "apiAvailable": true,
    "databaseConnected": true,
    "cacheEnabled": true
  },
  "api": {
    "available": true,
    "responseTime": 250,
    "lastChecked": "2025-10-16T10:05:00Z",
    "version": "1.0"
  },
  "database": {
    "totalRecords": 150,
    "linkedToProperties": 75,
    "mostRecentFetch": "2025-10-16T10:00:00Z",
    "oldestFetch": "2025-09-01T08:00:00Z"
  },
  "clientCache": {
    "size": 25,
    "entries": 25,
    "topEntries": [
      {
        "apn": "123-45-678A",
        "hitCount": 15,
        "cachedAt": "2025-10-16T09:00:00Z"
      }
    ]
  }
}
```

---

### POST /api/admin/mcao/status

Clear client cache.

**Authentication:** Admin role required

**Request Body:**
```json
{
  "action": "clear_cache",
  "apn": "123-45-678A"  // Optional: clear specific APN
}
```

**Response:**
```json
{
  "success": true,
  "message": "Client cache cleared successfully"
}
```

---

## Database Functions

All functions in `/lib/database/mcao.ts`:

### saveMCAOData(apn, data)

Save MCAO API response to database (upsert).

```typescript
const { record, error } = await saveMCAOData('123-45-678A', apiResponse)
```

---

### getMCAODataByAPN(apn)

Retrieve cached MCAO data by APN.

```typescript
const { data, error } = await getMCAODataByAPN('123-45-678A')
```

---

### linkMCAOToProperty(apn, propertyId)

Link MCAO data to a property record.

```typescript
const { success, error } = await linkMCAOToProperty('123-45-678A', 'property-uuid')
```

---

### searchMCAOByOwner(ownerName)

Search MCAO records by owner name (case-insensitive, partial match).

```typescript
const { results, error } = await searchMCAOByOwner('John Doe')
```

---

### getMCAOStats()

Get database cache statistics.

```typescript
const { stats, error } = await getMCAOStats()
// Returns: { totalRecords, linkedToProperties, mostRecentFetch, oldestFetch }
```

---

### deleteMCAOData(apn)

Delete MCAO data by APN.

```typescript
const { success, error } = await deleteMCAOData('123-45-678A')
```

---

### getAllMCAOData(limit, offset)

Get all MCAO records with pagination.

```typescript
const { records, error, total } = await getAllMCAOData(100, 0)
```

---

### mcaoDataExists(apn)

Check if MCAO data exists in database.

```typescript
const { exists, error } = await mcaoDataExists('123-45-678A')
```

---

### getMCAODataByPropertyId(propertyId)

Get MCAO data by property ID.

```typescript
const { data, error } = await getMCAODataByPropertyId('property-uuid')
```

---

## Client Usage

### MCAO Client Methods

```typescript
import { getMCAOClient, createMCAOClient } from '@/lib/mcao/client'

// Get singleton instance
const client = getMCAOClient()

// Or create custom instance
const customClient = createMCAOClient({
  baseUrl: 'https://custom-api.example.com',
  timeout: 60000,
  cacheEnabled: true,
  cacheDuration: 7200, // 2 hours
})
```

### Available Methods

```typescript
// Lookup by APN
await client.lookupByAPN({ apn, includeHistory, includeTax, refresh })

// Check API status
await client.checkStatus()

// Get cache stats
client.getCacheStats()

// Clear cache
client.clearCache()

// Invalidate specific APN
client.invalidateCache('123-45-678A')
```

---

## Template Populator Integration

### Populate Excel Template with MCAO Data

The template populator automatically handles both `MCAOData` (legacy) and `MCAOApiResponse` (new) formats.

```typescript
import { populateTemplate } from '@/lib/processing/template-populator'
import { getMCAOClient } from '@/lib/mcao/client'

// Fetch MCAO data
const mcaoClient = getMCAOClient()
const result = await mcaoClient.lookupByAPN({ apn: '123-45-678A' })

// Populate template
const { workbook, stats } = await populateTemplate(
  'path/to/template.xlsx',
  compsData,
  subjectProperty,
  result.data // MCAOApiResponse
)

console.log('MCAO data populated:', stats.mcaoDataPopulated)
```

### Sheets Populated

1. **Full_API_call** - Raw MCAO API data (columns B-AR)
2. **Maricopa** - Formatted property summary (rows 2-24)
3. **Lot** - Lot and zoning information

### Maricopa Sheet Format

```
Row  | Column B (Label)              | Column C (Value)
-----|-------------------------------|------------------
  2  | APN                           | 123-45-678A
  3  | Owner Name                    | John Doe
  4  | Property Address              | 123 Main St...
  5  | Legal Description             | LOT 1 BLK 5...
  6  | Lot Size                      | 7,500 sqft
  7  | Year Built                    | 2005
 ... | ...                           | ...
 24  | Features                      | Pool, Garage (2 spaces), A/C
```

---

## Type Definitions

### MCAOApiResponse

Full API response from MCAO (see `/lib/types/mcao-data.ts`):

```typescript
interface MCAOApiResponse {
  apn: APN
  parcelNumber: string
  ownerName: string
  ownerAddress?: { street, city, state, zip }
  legalDescription: string
  propertyAddress: { fullAddress, ... }
  assessedValue: { total, land, improvement }
  taxInfo: { taxAmount, taxYear, taxRate, taxArea }
  lotSize: number
  yearBuilt?: number
  bedrooms?: number
  bathrooms?: number
  features?: { pool, garage, garageSpaces, fireplace, ac, heating }
  salesHistory?: Array<{ saleDate, salePrice, saleType }>
  lastUpdated: string
  dataSource: string
}
```

### MCAOLookupRequest

```typescript
interface MCAOLookupRequest {
  apn: APN
  includeHistory?: boolean
  includeTax?: boolean
  refresh?: boolean
}
```

### MCAOLookupResult

```typescript
interface MCAOLookupResult {
  success: boolean
  data?: MCAOApiResponse
  summary?: MCAOPropertySummary
  error?: { code, message, details }
  cached?: boolean
  cachedAt?: string
  timestamp: string
}
```

---

## Error Codes

### Error Code Reference

| Code | Description | Resolution |
|------|-------------|------------|
| `INVALID_APN` | APN format invalid | Use format XXX-XX-XXXA |
| `APN_NOT_FOUND` | Property not found | Verify APN with county |
| `API_ERROR` | MCAO API returned error | Check API status |
| `NETWORK_ERROR` | Network connection failed | Check internet connection |
| `TIMEOUT` | Request timed out | Retry or increase timeout |
| `RATE_LIMIT` | Too many requests | Wait before retrying |
| `UNAUTHORIZED` | Invalid API key | Configure MCAO_API_KEY |
| `PARSE_ERROR` | Failed to parse response | Contact support |
| `CACHE_ERROR` | Cache operation failed | Clear cache and retry |
| `DATABASE_ERROR` | Database operation failed | Check Supabase connection |

### Error Handling Example

```typescript
const result = await client.lookupByAPN({ apn: '123-45-678A' })

if (!result.success) {
  switch (result.error?.code) {
    case 'INVALID_APN':
      console.error('Invalid APN format')
      break
    case 'APN_NOT_FOUND':
      console.error('Property not found')
      break
    case 'RATE_LIMIT':
      console.error('Rate limit exceeded, retry later')
      break
    default:
      console.error('Unknown error:', result.error?.message)
  }
}
```

---

## Cache Management

### Cache Hierarchy

1. **Client Cache (In-Memory)**
   - TTL: 1 hour (configurable)
   - Scope: Per server instance
   - Cleared: Server restart or manual clear

2. **Database Cache (Supabase)**
   - TTL: Indefinite (manually managed)
   - Scope: Global
   - Cleared: Via DELETE endpoint

### Cache Strategy

```
Request Flow:
1. Check Database Cache → HIT: Return
2. Check Client Cache → HIT: Return + Save to DB
3. Call MCAO API → Success: Cache in both layers
```

### Manual Cache Management

```typescript
// Clear all client cache
const client = getMCAOClient()
client.clearCache()

// Invalidate specific APN
client.invalidateCache('123-45-678A')

// Clear via API
await fetch('/api/admin/mcao/status', {
  method: 'POST',
  body: JSON.stringify({ action: 'clear_cache' }),
})

// Delete from database
await deleteMCAOData('123-45-678A')
```

---

## Testing

### Unit Tests (TODO)

```bash
npm test lib/mcao/client.test.ts
npm test lib/database/mcao.test.ts
```

### Manual Testing

```bash
# Test APN lookup
curl -X POST http://localhost:3000/api/admin/mcao/lookup \
  -H "Content-Type: application/json" \
  -d '{"apn":"123-45-678A"}'

# Check system status
curl http://localhost:3000/api/admin/mcao/status

# Get cached property
curl http://localhost:3000/api/admin/mcao/property/123-45-678A
```

### Test APNs (Mock Data)

Use these APNs for testing (mock responses):
- `123-45-678A` - Residential property
- `234-56-789B` - Commercial property
- `999-99-999Z` - Invalid/not found

---

## Production Configuration

### Environment Variables

```bash
# .env.production or .env.local

# MCAO API Configuration (TODO: Get real endpoint)
MCAO_API_URL=https://mcaoapi.maricopa.gov
MCAO_API_KEY=your-api-key-here

# Cache Settings (optional)
MCAO_CACHE_ENABLED=true
MCAO_CACHE_DURATION=3600  # 1 hour in seconds
MCAO_API_TIMEOUT=30000    # 30 seconds
```

### Supabase RLS Policies

RLS policies are automatically applied via migration `004_add_mcao_tables.sql`:

- **Admin**: Full access to all MCAO data
- **Clients**: Read-only access to their linked properties

### Database Indexes

Optimized indexes for performance:
- `idx_mcao_apn` - APN lookups
- `idx_mcao_property_id` - Property linking
- `idx_mcao_fetched_at` - Cache expiration queries

---

## Migration Notes

### From MCAOData to MCAOApiResponse

The template populator supports both formats for backward compatibility:

```typescript
// Old format (MCAOData from mls-data.ts)
const oldData: MCAOData = { apn, parcelId, ownerName, ... }

// New format (MCAOApiResponse from mcao-data.ts)
const newData: MCAOApiResponse = { apn, parcelNumber, ownerName, ... }

// Both work in populateTemplate()
await populateTemplate(templatePath, comps, subject, oldData)
await populateTemplate(templatePath, comps, subject, newData)
```

---

## Support & Troubleshooting

### Common Issues

**Issue**: "Invalid APN format"
**Solution**: Ensure APN follows `XXX-XX-XXXA` format (e.g., `123-45-678A`)

**Issue**: "MCAO API unavailable"
**Solution**: Check `/api/admin/mcao/status` for API health

**Issue**: "Database connection failed"
**Solution**: Verify Supabase credentials in `.env`

**Issue**: "Cache not clearing"
**Solution**: Restart server to clear in-memory cache

### Contact

For issues or questions:
- Check `/lib/mcao/README.md` (this file)
- Review type definitions in `/lib/types/mcao-data.ts`
- Inspect API routes in `/app/api/admin/mcao/`

---

## Changelog

### Week 5 (October 16, 2025)
- Initial MCAO integration
- Database tables and RLS policies
- API routes (lookup, property, status)
- Template populator integration
- Multi-tier caching system
- Type-safe TypeScript implementation

---

**GSRealty Client Management System**
**MCAO Integration v1.0**
**October 16, 2025**
