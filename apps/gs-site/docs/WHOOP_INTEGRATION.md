# WHOOP Integration - Complete Reference

> **Last Updated:** December 28, 2025
> **API Version:** V2 (`/developer/v2/`)
> **Status:** Production Ready

## Table of Contents

1. [Overview](#overview)
2. [WHOOP API Official Documentation](#whoop-api-official-documentation)
3. [Architecture](#architecture)
4. [Setup Guide](#setup-guide)
5. [Caching Strategy](#caching-strategy)
6. [API Endpoints](#api-endpoints)
7. [Database Schema](#database-schema)
8. [Common Pitfalls & Solutions](#common-pitfalls--solutions)
9. [Debugging Guide](#debugging-guide)
10. [File Reference](#file-reference)

---

## Overview

GS-Site integrates with WHOOP to display health metrics:

| Metric | Source | Update Frequency |
|--------|--------|------------------|
| Recovery Score (%) | WHOOP recovery endpoint | Once per day (after wake) |
| HRV (ms) | Recovery score object | Once per day |
| Resting Heart Rate | Recovery score object | Once per day |
| Strain Score | Cycle endpoint | Accumulates throughout day |
| Sleep Data | Sleep endpoint | Once per day |

### Key Insight: WHOOP Data is Low-Frequency

Unlike real-time fitness trackers, WHOOP calculates metrics at specific times:
- **Recovery**: Calculated ONCE when you wake up
- **Strain**: Accumulates throughout the day, finalized at end
- **Sleep**: Calculated after sleep ends

This means **frequent API polling is wasteful and risks rate limiting**.

---

## WHOOP API Official Documentation

### Primary Resources

| Resource | URL |
|----------|-----|
| **API Reference** | https://developer.whoop.com/api/ |
| **OAuth Guide** | https://developer.whoop.com/docs/developing/oauth/ |
| **Developer Dashboard** | https://developer-dashboard.whoop.com/ |
| **V1→V2 Migration** | https://developer.whoop.com/docs/developing/v1-v2-migration/ |

### API Base URLs

```
Production: https://api.prod.whoop.com
OAuth Auth: https://api.prod.whoop.com/oauth/oauth2/auth
OAuth Token: https://api.prod.whoop.com/oauth/oauth2/token
API V2 Base: https://api.prod.whoop.com/developer/v2
```

### Rate Limits (From WHOOP Docs)

| Limit | Value | Notes |
|-------|-------|-------|
| Daily Limit | 10,000 requests | Per app, all users combined |
| Minute Limit | 100 requests | Burst protection |
| Test Users | 10 max | During development mode |

**Warning:** These limits are STRICT. WHOOP will return 429 errors and may temporarily block your app.

### Available Scopes

| Scope | Purpose | Required |
|-------|---------|----------|
| `read:profile` | Get user_id | Yes |
| `read:recovery` | Recovery scores, HRV, RHR | Yes |
| `read:cycles` | Strain, physiological cycles | Yes |
| `read:sleep` | Sleep duration, stages | Optional |
| `read:workout` | Workout data | Optional |
| `read:body_measurement` | Body measurements | Optional |

**Note:** The `offline` scope does NOT exist in WHOOP's system - never request it.

### V2 API Response Structures

#### Recovery Response
```json
{
  "records": [
    {
      "cycle_id": 93845,
      "sleep_id": "abc123-uuid",
      "user_id": 28322113,
      "created_at": "2025-12-28T14:25:02.445Z",
      "updated_at": "2025-12-28T14:25:02.445Z",
      "score_state": "SCORED",
      "score": {
        "user_calibrating": false,
        "recovery_score": 67,
        "resting_heart_rate": 52,
        "hrv_rmssd_milli": 45.3,
        "spo2_percentage": 98.5,
        "skin_temp_celsius": 33.2
      }
    }
  ],
  "next_token": null
}
```

#### Cycle (Strain) Response
```json
{
  "records": [
    {
      "id": 93845,
      "user_id": 28322113,
      "created_at": "2025-12-28T06:00:00.000Z",
      "updated_at": "2025-12-28T20:30:00.000Z",
      "start": "2025-12-28T06:00:00.000Z",
      "end": null,
      "timezone_offset": "-07:00",
      "score_state": "SCORED",
      "score": {
        "strain": 12.4,
        "average_heart_rate": 72,
        "max_heart_rate": 165,
        "kilojoules": 2450.5
      }
    }
  ],
  "next_token": null
}
```

---

## Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT SIDE                              │
├─────────────────────────────────────────────────────────────────┤
│  WhoopInsightsTile.tsx                                          │
│         │                                                        │
│         ▼                                                        │
│  useWhoopInsights() hook (React Query)                          │
│         │                                                        │
│         │ staleTime: 6 hours                                    │
│         │ gcTime: 12 hours                                      │
│         │ refetchOnWindowFocus: false                           │
│         ▼                                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ fetch('/api/whoop/insights')
┌─────────────────────────────────────────────────────────────────┐
│                         SERVER SIDE                              │
├─────────────────────────────────────────────────────────────────┤
│  /api/whoop/insights/route.ts                                   │
│         │                                                        │
│         │ Cache-Control: s-maxage=21600 (6hr)                   │
│         ▼                                                        │
│  getWhoopInsightsForUser('default-user')                        │
│         │                                                        │
│         ▼                                                        │
│  getWhoopTokens() ──► Supabase user_integrations table          │
│         │                                                        │
│         │ (auto-refresh if expired)                             │
│         ▼                                                        │
│  getLatestInsights(access_token)                                │
│         │                                                        │
│         ▼                                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                        WHOOP API                                 │
├─────────────────────────────────────────────────────────────────┤
│  GET /developer/v2/recovery?limit=1                             │
│  GET /developer/v2/cycle?limit=1                                │
└─────────────────────────────────────────────────────────────────┘
```

### OAuth Flow

```
User clicks "Connect WHOOP"
         │
         ▼
GET /api/auth/whoop
         │
         │ Generate state token
         │ Build auth URL with scopes
         ▼
REDIRECT ──► https://api.prod.whoop.com/oauth/oauth2/auth
         │
         │ User logs in, grants permissions
         ▼
REDIRECT ◄── /api/auth/whoop/callback?code=xxx&state=xxx
         │
         │ Exchange code for tokens
         │ Fetch user profile for user_id
         │ Store tokens in Supabase
         ▼
REDIRECT ──► /admin/connections?whoop_connected=true
```

---

## Setup Guide

### 1. Create WHOOP Developer App

1. Go to https://developer-dashboard.whoop.com/
2. Create new app with these settings:

| Field | Value |
|-------|-------|
| App Name | GS-Site |
| Privacy Policy | https://your-domain.com/privacy |
| Redirect URL #1 | `http://localhost:3003/api/auth/whoop/callback` |
| Redirect URL #2 | `https://your-production-url/api/auth/whoop/callback` |

### 2. Configure Scopes

In WHOOP Developer Dashboard, enable:
- [x] `read:recovery`
- [x] `read:cycles`
- [x] `read:sleep`
- [x] `read:workout`
- [x] `read:profile`
- [x] `read:body_measurement`

### 3. Environment Variables

```bash
# .env.local
WHOOP_CLIENT_ID=your_client_id_from_dashboard
WHOOP_CLIENT_SECRET=your_client_secret_from_dashboard
```

### 4. Database Table

Ensure `user_integrations` table exists (see [Database Schema](#database-schema)).

### 5. Test Connection

1. Start dev server: `npm run dev` (must be port 3003)
2. Navigate to: `http://localhost:3003/api/auth/whoop`
3. Complete OAuth flow
4. Check: `http://localhost:3003/api/whoop/health`

---

## Caching Strategy

### Why Long Caching?

WHOOP's API has strict rate limits AND the data is inherently low-frequency:

| Data Type | How Often It Changes | Our Cache Duration |
|-----------|---------------------|-------------------|
| Recovery | Once/day (after wake) | 6 hours |
| Strain | Slowly throughout day | 6 hours |
| Historical | Once/day | 12 hours |

### Cache Layers

#### Layer 1: React Query (Client)
```typescript
// hooks/useWhoopData.ts
staleTime: 6 * 60 * 60 * 1000,  // 6 hours - data considered fresh
gcTime: 12 * 60 * 60 * 1000,    // 12 hours - keep in memory
refetchInterval: false,          // No automatic refetching
refetchOnWindowFocus: false,     // No refetch on tab focus
```

#### Layer 2: HTTP Cache Headers (Server)
```typescript
// /api/whoop/insights/route.ts
'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=43200'
// = 6 hour cache, serve stale for 12 hours while revalidating
```

### Manual Refresh

Users can force a refresh via the "Retry" button in tiles, which calls `refetch()`.

### Previous Settings (Caused Rate Limiting)

```typescript
// DON'T DO THIS - caused rate limiting issues
staleTime: 5 * 60 * 1000,       // 5 min - too aggressive
refetchInterval: 15 * 60 * 1000, // Every 15 min - wasteful
refetchOnWindowFocus: true,      // Refetch on every tab switch
```

---

## API Endpoints

### Health Check

```
GET /api/whoop/health
```

Returns connection status without hitting WHOOP API:

```json
// Connected
{ "status": "connected", "expiresAt": "2025-12-28T21:01:17Z", "message": "Connected" }

// Token expired
{ "status": "expired", "message": "Token expired, refresh needed" }

// Not connected
{ "status": "not_connected", "connectUrl": "/api/auth/whoop" }
```

### Latest Insights

```
GET /api/whoop/insights
```

Returns current recovery and strain:

```json
{
  "recovery": { "score": { "recovery_score": 67, "hrv_rmssd_milli": 45.3, ... } },
  "cycle": { "score": { "strain": 12.4, ... } },
  "connected": true,
  "lastUpdated": "2025-12-28T20:30:00.000Z"
}
```

### Historical Data

```
GET /api/whoop/historical?days=7
GET /api/whoop/historical?days=14
GET /api/whoop/historical?days=30
```

Returns chart-ready data:

```json
{
  "days": 7,
  "chartData": [
    { "date": "2025-12-22", "recovery": 72, "hrv": 48.2, "rhr": 51, "strain": 14.2 },
    ...
  ],
  "lastUpdated": "2025-12-28T20:30:00.000Z"
}
```

### OAuth Endpoints

```
GET /api/auth/whoop          # Start OAuth flow
GET /api/auth/whoop/callback # Handle WHOOP redirect
```

---

## Database Schema

```sql
CREATE TABLE user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,           -- 'default-user' for single-user mode
  service TEXT NOT NULL,           -- 'whoop'
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  email TEXT,
  metadata JSONB DEFAULT '{}',     -- Contains { "whoop_user_id": "28322113" }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, service)
);
```

### Query Tokens

```sql
-- Check if connected
SELECT * FROM user_integrations WHERE user_id = 'default-user' AND service = 'whoop';

-- Check token expiry
SELECT expires_at, NOW() > expires_at AS is_expired FROM user_integrations WHERE service = 'whoop';
```

---

## Common Pitfalls & Solutions

### 1. Rate Limiting (429 Errors)

**Symptoms:**
- Tiles show "Connection error"
- API returns `{ "error": "Rate limited by WHOOP API" }`
- Works sometimes, fails other times

**Cause:** Too many API requests. Development with frequent refreshes burns through limits.

**Solution:**
- Use long cache durations (already implemented)
- Avoid `refetchOnWindowFocus: true`
- Use `/api/whoop/health` to check status (doesn't hit WHOOP API)

### 2. "WHOOP not connected" After Successful OAuth

**Symptoms:**
- OAuth completes, URL shows `whoop_connected=true`
- But tiles show "not connected"

**Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| React Query cached old error | Hard refresh (Cmd+Shift+R) or clear site data |
| Server cached error response | Restart dev server, clear `.next` folder |
| Token not stored in DB | Check logs for `[WHOOP] Tokens stored successfully` |

### 3. Recovery Score is Null

**Symptoms:**
- `connected: true` but `recovery.score` is null
- Tile appears empty

**Cause:** WHOOP hasn't calculated today's recovery yet (happens after you wake up).

**Solution:** This is normal. Check WHOOP app - if no recovery there, our app won't have it either.

### 4. 401 Unauthorized from WHOOP API

**Symptoms:**
- `WHOOP_TOKEN_EXPIRED` error
- Logs show `401 Unauthorized`

**Causes:**
1. Token actually expired and refresh failed
2. User revoked app access in WHOOP mobile app
3. Scopes in code don't match WHOOP Dashboard

**Solution:**
```sql
-- Delete old tokens
DELETE FROM user_integrations WHERE service = 'whoop';
```
Then re-authenticate at `/api/auth/whoop`

### 5. 404 on Recovery/Sleep Endpoints

**Cause:** Using deprecated V1 API.

**Solution:** Ensure `apiBaseUrl` is:
```typescript
apiBaseUrl: 'https://api.prod.whoop.com/developer/v2'
```

### 6. OAuth Redirect Mismatch

**Symptoms:**
- WHOOP shows "redirect_uri mismatch"
- OAuth never completes

**Cause:** Redirect URL in code doesn't exactly match WHOOP Dashboard.

**Solution:** URLs must match EXACTLY, including:
- Protocol (`http` vs `https`)
- Port (`:3003`)
- Path (`/api/auth/whoop/callback`)

---

## Debugging Guide

### Server Logs to Look For

The WHOOP client logs extensively. Look for these patterns:

#### Successful OAuth
```
[WHOOP] exchangeCodeForTokens called with code: abc123...
[WHOOP] Token exchange response status: 200
[WHOOP] NEW access_token preview: eyJ0eXAi...
[WHOOP] Fetching user profile to get user_id...
[WHOOP] User profile response: { user_id: 28322113 }
[WHOOP] storeWhoopTokens called for user: default-user
[WHOOP] Tokens stored successfully
```

#### Successful Data Fetch
```
[WHOOP] getWhoopTokens called for user: default-user
[WHOOP] Token found in database
[WHOOP] getLatestInsights called
[WHOOP API] Fetching recovery from: .../recovery?limit=1
[WHOOP API] Fetching cycle from: .../cycle?limit=1
[WHOOP] API calls succeeded!
[WHOOP] Recovery records: 1
[WHOOP] Cycle records: 1
```

#### Token Expired
```
[WHOOP] getWhoopTokens called for user: default-user
[WHOOP] Token found in database
[WHOOP] Token preview: eyJ0eXAi...
[WHOOP] Expires at: 2025-12-28T20:01:17.615Z
[WHOOP API] Recovery request failed: { status: 401, body: "Unauthorized" }
[WHOOP API] 401 Unauthorized - token may be invalid or scopes insufficient
```

#### Rate Limited
```
[WHOOP API] Recovery request failed: { status: 429 }
```

### Debug Endpoints

```bash
# Check if tokens exist (doesn't hit WHOOP API)
curl http://localhost:3003/api/whoop/health

# Check actual data (hits WHOOP API)
curl http://localhost:3003/api/whoop/insights

# Test WHOOP API directly
curl "https://api.prod.whoop.com/developer/v2/recovery?limit=1" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Nuclear Reset

If all else fails:

```bash
# 1. Clear database tokens
psql -c "DELETE FROM user_integrations WHERE service = 'whoop';"

# 2. Clear Next.js cache
rm -rf .next

# 3. Clear browser data
# DevTools → Application → Storage → Clear site data

# 4. Restart dev server
npm run dev

# 5. Re-authenticate
open http://localhost:3003/api/auth/whoop
```

---

## File Reference

| File | Purpose |
|------|---------|
| `lib/whoop/client.ts` | WHOOP API client, OAuth flow, token management |
| `app/api/auth/whoop/route.ts` | Initiates OAuth redirect to WHOOP |
| `app/api/auth/whoop/callback/route.ts` | Handles WHOOP OAuth callback |
| `app/api/whoop/health/route.ts` | Health check (DB only, no WHOOP API) |
| `app/api/whoop/insights/route.ts` | Latest recovery + strain data |
| `app/api/whoop/historical/route.ts` | Historical data for charts |
| `hooks/useWhoopData.ts` | React Query hooks with long cache |
| `components/tiles/graphics/WhoopInsightsTile.tsx` | Recovery/strain display tile |
| `components/tiles/graphics/HealthTrackerTile.tsx` | Historical trend chart tile |
| `lib/integrations/types.ts` | Health check configuration |

---

## Changelog

| Date | Change |
|------|--------|
| 2025-12-28 | Implemented long-cache strategy to prevent rate limiting |
| 2025-12-28 | Added `/api/whoop/health` endpoint for DB-only status check |
| 2025-12-27 | Initial V2 API integration |
