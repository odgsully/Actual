# InBody Integration - Complete Reference

> **Last Updated:** December 28, 2025
> **Mode:** Manual Entry (no API required)
> **Status:** Production Ready

## Table of Contents

1. [Overview](#overview)
2. [Manual Entry Mode](#manual-entry-mode)
3. [Architecture](#architecture)
4. [Setup Guide](#setup-guide)
5. [API Endpoints](#api-endpoints)
6. [Database Schema](#database-schema)
7. [Notion Sync](#notion-sync)
8. [File Reference](#file-reference)

---

## Overview

GS-Site integrates with InBody to display body composition metrics:

| Metric | Source | Update Frequency |
|--------|--------|------------------|
| Body Fat % | InBody scan | Weekly (gym visits) |
| Skeletal Muscle Mass (kg) | InBody scan | Weekly |
| Weight (kg) | InBody scan | Weekly |
| BMI | Calculated | Weekly |
| BMR (Basal Metabolic Rate) | InBody scan | Weekly |
| Segmental Analysis | InBody scan (model-dependent) | Weekly |
| Visceral Fat Level | InBody scan | Weekly |
| InBody Score | InBody scan | Weekly |

### Key Insight: InBody Data is Very Low-Frequency

InBody scans happen at the **gym**, typically **once per week** or less. This means:
- **Aggressive caching is appropriate** (24+ hours)
- **No real-time polling needed**
- **Data rarely changes between scans**

---

## Manual Entry Mode

Since LookinBody API access requires gym owner cooperation (unlikely), we use **manual entry**:

### How It Works

1. **Get scanned at gym** → Receive InBody printout
2. **Click InBody tile** → Modal form opens
3. **Enter values from printout** → Weight, Body Fat %, Muscle Mass, etc.
4. **Submit** → Data saved to Supabase + synced to Notion
5. **View trends** → Tile shows latest scan with trend arrows

### Why Manual Entry?

| Approach | Feasibility | Cost |
|----------|-------------|------|
| LookinBody API | Requires gym cooperation | N/A |
| Terra API | Works but expensive | $400+/month |
| **Manual Entry** | **Always works** | **Free** |

### User Experience

```
┌──────────────────────────────────────┐
│  InBody Scan                    5d ago│
│  ┌─────────────┐                     │
│  │ 💧 18.2%    │ Body Fat            │
│  │ (green)     │ ↓ improving         │
│  └─────────────┘                     │
│  🏋️ 38.4 kg muscle  ⚖️ 82.5 kg      │
│  Score: 78 | BMI: 24.1               │
│                                      │
│  [ Hover: "Log Scan" button ]        │
└──────────────────────────────────────┘
         ↓ Click
┌──────────────────────────────────────┐
│  Log InBody Scan            [X]      │
│──────────────────────────────────────│
│  Scan Date: [2025-12-28]             │
│  Location:  [LA Fitness Scottsdale]  │
│                                      │
│  Core Metrics:                       │
│  Weight (kg)*:     [82.5]            │
│  Body Fat %*:      [18.2]            │
│  Muscle Mass (kg)*:[38.4]            │
│                                      │
│  Additional:                         │
│  BMI: [24.1]  BMR: [1820]            │
│  InBody Score: [78]                  │
│                                      │
│  [Cancel]           [Save Scan]      │
└──────────────────────────────────────┘
```

---

## Architecture (Manual Entry)

### Primary Resources

| Resource | URL |
|----------|-----|
| **API Documentation** | https://apiusa.lookinbody.com/Home/Document |
| **LookinBody Web Portal** | https://lookinbody.com |

### API Base URL

```
US Region: https://apiusa.lookinbody.com/api
```

### Authentication

InBody uses **API-KEY authentication** (not OAuth):

```
Header: API-KEY: your_api_key_here
```

### User Identification

There are three ways to identify a user's data:

| Method | Use Case | Header |
|--------|----------|--------|
| `UserID` | Single gym location | Works only for that gym's device |
| `UserToken` | Phone-linked account | Works across all locations |
| `Phone` | Phone number lookup | Alternative to UserToken |

### Rate Limits

LookinBody doesn't publish explicit rate limits, but:
- Keep requests minimal (data changes weekly at most)
- Use caching aggressively
- Don't poll frequently

---

## Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT SIDE                              │
├─────────────────────────────────────────────────────────────────┤
│  InBodyTile.tsx                                                 │
│         │                                                        │
│         ▼                                                        │
│  useInBodyMetrics() hook (React Query)                          │
│         │                                                        │
│         │ staleTime: 24 hours                                   │
│         │ gcTime: 7 days                                        │
│         │ refetchOnWindowFocus: false                           │
│         ▼                                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ fetch('/api/inbody/latest')
┌─────────────────────────────────────────────────────────────────┐
│                         SERVER SIDE                              │
├─────────────────────────────────────────────────────────────────┤
│  /api/inbody/latest/route.ts                                    │
│         │                                                        │
│         │ Cache-Control: s-maxage=86400 (24hr)                  │
│         ▼                                                        │
│  getInBodyInsightsForUser('default-user')                       │
│         │                                                        │
│         ▼                                                        │
│  getInBodyCredentials() ──► Supabase user_integrations table    │
│         │                                                        │
│         ▼                                                        │
│  getLatestScan(credentials)                                     │
│         │                                                        │
│         ▼                                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTPS + API-KEY
┌─────────────────────────────────────────────────────────────────┐
│                     LOOKINBODY API                               │
├─────────────────────────────────────────────────────────────────┤
│  GET /api/measurements/bytoken?UserToken=xxx&Limit=1            │
│  or                                                              │
│  GET /api/measurements/byuserid?UserID=xxx&Limit=1              │
└─────────────────────────────────────────────────────────────────┘
```

### Authentication Flow

Unlike WHOOP (which uses OAuth), InBody uses API keys:

```
1. User obtains LookinBody Web credentials from their gym
2. Admin enters UserID/UserToken in settings
3. Credentials stored in Supabase user_integrations table
4. API calls use stored credentials + INBODY_API_KEY header
```

---

## Setup Guide

### 1. Get LookinBody Web Access

Contact your gym that has an InBody device:

1. Ask if they use **LookinBody Web** for results
2. Request your **UserID** or set up phone-linked account
3. Log into https://lookinbody.com to verify access

### 2. Obtain API Key

For direct API access:

1. Contact LookinBody support or your gym
2. Request API access for your location
3. Obtain your API-KEY

### 3. Environment Variables

```bash
# .env.local
INBODY_API_KEY=your_api_key_here
```

### 4. Store User Credentials

Currently, credentials are stored via the admin connections page or directly in Supabase:

```sql
INSERT INTO user_integrations (user_id, service, access_token, metadata)
VALUES (
  'default-user',
  'inbody',
  'your_user_token',
  '{"inbody_user_token": "your_user_token"}'::jsonb
);
```

### 5. Test Connection

```bash
# Check if configured (doesn't hit InBody API)
curl http://localhost:3003/api/inbody/health

# Test with mock data
curl http://localhost:3003/api/inbody/latest?mock=true

# Test real API (requires credentials)
curl http://localhost:3003/api/inbody/latest
```

---

## Caching Strategy

### Why Aggressive Caching?

InBody data is inherently very low-frequency:

| Data Type | How Often It Changes | Our Cache Duration |
|-----------|---------------------|-------------------|
| Body composition | Weekly (gym visits) | 24 hours |
| Historical data | Weekly | 24 hours |

### Cache Layers

#### Layer 1: React Query (Client)
```typescript
// hooks/useInBodyData.ts
staleTime: 24 * 60 * 60 * 1000,  // 24 hours - data considered fresh
gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days - keep in memory
refetchInterval: false,          // No automatic refetching
refetchOnWindowFocus: false,     // No refetch on tab focus
```

#### Layer 2: HTTP Cache Headers (Server)
```typescript
// /api/inbody/latest/route.ts
'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800'
// = 24 hour cache, serve stale for 7 days while revalidating
```

### Manual Refresh

Users can force a refresh via the tile's settings icon (dev mode) or by visiting `/admin/connections`.

---

## API Endpoints

### Health Check

```
GET /api/inbody/health
```

Returns connection status without hitting InBody API:

```json
// Connected
{ "status": "connected", "service": "inbody", "updatedAt": "2025-12-28T..." }

// Not configured
{ "status": "not_configured", "message": "Missing INBODY_API_KEY" }

// Not connected
{ "status": "not_connected", "message": "No credentials found", "setupUrl": "/admin/connections" }
```

### Latest Scan

```
GET /api/inbody/latest
GET /api/inbody/latest?mock=true  (for testing)
```

Returns most recent InBody scan:

```json
{
  "latestScan": {
    "id": "scan-123",
    "scanDate": "2025-12-23T10:30:00Z",
    "score": {
      "weight": 82.5,
      "bodyFatPercent": 18.2,
      "skeletalMuscleMass": 38.4,
      "bodyFatMass": 15.0,
      "bmi": 24.1,
      "bmr": 1820,
      "visceralFatLevel": 8,
      "inbodyScore": 78
    }
  },
  "connected": true,
  "lastUpdated": "2025-12-28T...",
  "daysSinceLastScan": 5
}
```

### Historical Data

```
GET /api/inbody/history?limit=10
GET /api/inbody/history?limit=10&mock=true
```

Returns historical scans with trends:

```json
{
  "scans": [...],
  "trends": {
    "weightChange": -1.5,
    "fatChange": -0.8,
    "muscleChange": 0.5
  }
}
```

---

## Database Schema

InBody uses the same `user_integrations` table as other services:

```sql
-- Uses existing user_integrations table
-- Service = 'inbody'
-- Metadata contains InBody-specific credentials

SELECT * FROM user_integrations WHERE service = 'inbody';

-- Example record:
{
  "id": "uuid-here",
  "user_id": "default-user",
  "service": "inbody",
  "access_token": "user_token_or_id",
  "refresh_token": null,
  "expires_at": null,  -- API keys don't expire
  "metadata": {
    "inbody_user_id": "12345",
    "inbody_user_token": "token_here",
    "inbody_phone": "+1234567890"
  }
}
```

### Optional: Local Cache Table

For reducing API calls, you can cache scans locally:

```sql
CREATE TABLE inbody_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  scan_date TIMESTAMPTZ NOT NULL,
  weight_kg NUMERIC,
  body_fat_percent NUMERIC,
  muscle_mass_kg NUMERIC,
  bmi NUMERIC,
  bmr INTEGER,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inbody_scans_user_date ON inbody_scans(user_id, scan_date DESC);
```

---

## Common Pitfalls & Solutions

### 1. "InBody not configured"

**Cause:** Missing `INBODY_API_KEY` environment variable.

**Solution:**
```bash
# Add to .env.local
INBODY_API_KEY=your_api_key_here
```

### 2. "InBody not connected"

**Cause:** No credentials stored in database.

**Solution:**
```sql
-- Store credentials in Supabase
INSERT INTO user_integrations (user_id, service, access_token, metadata)
VALUES (
  'default-user',
  'inbody',
  'your_identifier',
  '{"inbody_user_token": "your_token"}'::jsonb
);
```

### 3. Authentication Failed

**Cause:** Invalid API key or user credentials.

**Solution:**
1. Verify API key with LookinBody
2. Confirm UserID/UserToken from LookinBody Web portal
3. Check if credentials have access to the data

### 4. No Scan Data

**Cause:** User hasn't done an InBody scan at their gym, or credentials don't have access.

**Solution:**
- Verify user has scan history in LookinBody Web portal
- Check if UserID/UserToken matches the gym location

---

## Debugging Guide

### Server Logs

Look for these patterns:

```
[INBODY] getInBodyCredentials called for user: default-user
[INBODY] Credentials found in database
[INBODY API] Fetching measurements from: https://apiusa.lookinbody.com/api/...
[INBODY] Successfully fetched 1 measurement(s)
```

### Debug Endpoints

```bash
# Check configuration (doesn't hit API)
curl http://localhost:3003/api/inbody/health

# Test with mock data (no API needed)
curl http://localhost:3003/api/inbody/latest?mock=true

# Test real API
curl http://localhost:3003/api/inbody/latest
```

### Testing Without API Access

The integration includes a mock mode for UI development:

```typescript
// In InBodyTile.tsx - click the settings icon to toggle mock data
// Or use query param:
// /api/inbody/latest?mock=true
// /api/inbody/history?mock=true&limit=10
```

---

## File Reference

| File | Purpose |
|------|---------|
| `lib/inbody/client.ts` | InBody API client, credential management |
| `app/api/inbody/health/route.ts` | Health check (DB only, no InBody API) |
| `app/api/inbody/latest/route.ts` | Latest scan data |
| `app/api/inbody/history/route.ts` | Historical scans for trending |
| `hooks/useInBodyData.ts` | React Query hooks with long cache |
| `components/tiles/graphics/InBodyTile.tsx` | Body composition display tile |
| `lib/types/tiles.ts` | ThirdPartyIntegration includes 'InBody' |
| `lib/integrations/types.ts` | Service config for health checks |

---

## Key Metrics Display

The InBodyTile displays these metrics with color coding:

| Metric | Color Logic |
|--------|-------------|
| **Body Fat %** | Green < 20%, Yellow 20-25%, Red > 25% |
| **BMI** | Green 18.5-25, Yellow 25-30, Red outside |
| **Weight Trend** | Up/Down/Stable arrow |
| **Muscle Trend** | Green = gaining, Red = losing |
| **Fat Trend** | Green = losing, Red = gaining |

---

## Environment Variables

```bash
# Required
INBODY_API_KEY=xxx              # LookinBody API key

# Optional (for local development)
# Credentials are stored in database, not env vars
```

---

## Changelog

| Date | Change |
|------|--------|
| 2025-12-28 | Initial InBody integration with LookinBody Web API |
| 2025-12-28 | Added mock data support for UI development |
| 2025-12-28 | Implemented aggressive caching (24hr stale, 7d gc) |
