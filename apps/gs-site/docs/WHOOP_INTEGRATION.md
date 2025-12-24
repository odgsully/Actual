# WHOOP Integration Setup

## Overview

GS-Site integrates with WHOOP to display health metrics including:
- Recovery score (%)
- Heart Rate Variability (HRV)
- Resting Heart Rate (RHR)
- Strain score
- Sleep data

## Prerequisites

1. WHOOP account with active membership
2. WHOOP Developer account at https://developer-dashboard.whoop.com/

## WHOOP Developer App Configuration

### 1. Create App in WHOOP Developer Dashboard

Go to https://developer-dashboard.whoop.com/ and create a new app with:

| Field | Value |
|-------|-------|
| App Name | GS-Site |
| Privacy Policy | https://gssite.vercel.app/privacy |
| Redirect URL #1 | `http://localhost:3003/api/auth/whoop/callback` |
| Redirect URL #2 | `https://gssite.vercel.app/api/auth/whoop/callback` |

### 2. Required Scopes

Enable ALL of these scopes in your WHOOP Developer Dashboard:

- [x] `read:recovery` - Recovery scores, HRV, RHR
- [x] `read:cycles` - Strain and cycle data
- [x] `read:sleep` - Sleep duration and stages
- [x] `read:workout` - Workout data
- [x] `read:profile` - User profile (needed for user_id)
- [x] `read:body_measurement` - Body measurements

**Note:** The `offline` scope is NOT available in WHOOP's dashboard - do not request it in code.

### 3. Environment Variables

Add to `.env.local`:

```bash
# WHOOP Integration
WHOOP_CLIENT_ID=your_client_id_here
WHOOP_CLIENT_SECRET=your_client_secret_here
```

Get these from your WHOOP Developer Dashboard → Credentials section.

## API Endpoints

### OAuth Flow

| Endpoint | Purpose |
|----------|---------|
| `GET /api/auth/whoop` | Initiates OAuth flow, redirects to WHOOP |
| `GET /api/auth/whoop/callback` | Handles OAuth callback, stores tokens |

### Data Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/whoop/insights` | Latest recovery + strain data |
| `GET /api/whoop/historical?days=7` | Historical data (7, 14, or 30 days) |

## WHOOP API Version

**Using V2 API** (`/developer/v2/`)

The V1 API is deprecated. Key differences:
- Recovery and sleep endpoints only work on V2
- V2 uses different response structure for recovery scores
- Field name: `hrv_rmssd_milli` (not `hrv_rmssd`)

## Database Schema

Tokens are stored in `user_integrations` table:

```sql
CREATE TABLE user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  service TEXT NOT NULL,  -- 'whoop'
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  email TEXT,
  metadata JSONB DEFAULT '{}',  -- Contains whoop_user_id
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Troubleshooting

### "WHOOP not connected" even after authorization

1. **Check tokens in database:**
   ```sql
   SELECT * FROM user_integrations WHERE service = 'whoop';
   ```

2. **Test token validity:**
   ```bash
   curl -s "https://api.prod.whoop.com/developer/v2/recovery?limit=1" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
   ```

3. **If token is invalid, force fresh tokens:**
   - Revoke app access in WHOOP mobile app (Settings → Connected Apps)
   - Clear browser cache or use Incognito
   - Delete old record: `DELETE FROM user_integrations WHERE service = 'whoop';`
   - Re-authorize at `http://localhost:3003/api/auth/whoop`

### "Authorization was not valid" from WHOOP API

This usually means:
1. Token expired and refresh failed
2. User revoked access in WHOOP app
3. Scopes mismatch between code and dashboard

**Fix:** Ensure scopes in code EXACTLY match WHOOP Developer Dashboard.

### Recovery/Sleep endpoints return 404

- **V1 API:** Returns 404 for recovery/sleep (deprecated)
- **V2 API:** Returns data correctly

Ensure `apiBaseUrl` is set to:
```typescript
apiBaseUrl: 'https://api.prod.whoop.com/developer/v2'
```

### Token not updating after re-authorization

Check server logs for `[WHOOP]` messages:
```
[WHOOP] exchangeCodeForTokens called...
[WHOOP] NEW access_token preview: xxx...
[WHOOP] storeWhoopTokens called...
[WHOOP] Tokens stored successfully
```

If logs don't appear, the callback isn't running (browser caching old redirect).

## Development Notes

### Test Users Limit

WHOOP Developer apps in development mode are limited to **10 test users**. To add test users:
1. Go to WHOOP Developer Dashboard
2. Add WHOOP member emails as test users

### Rate Limits

| Limit | Value |
|-------|-------|
| API Day Rate Limit | 10,000 requests |
| API Minute Rate Limit | 100 requests |

### Data Refresh

- Insights: Cached 15 minutes, stale-while-revalidate 30 minutes
- Historical: Cached 30 minutes, stale-while-revalidate 60 minutes

## Files

| File | Purpose |
|------|---------|
| `lib/whoop/client.ts` | WHOOP API client, OAuth, token management |
| `app/api/auth/whoop/route.ts` | OAuth initiation |
| `app/api/auth/whoop/callback/route.ts` | OAuth callback |
| `app/api/whoop/insights/route.ts` | Latest data endpoint |
| `app/api/whoop/historical/route.ts` | Historical data endpoint |
| `hooks/useWhoopData.ts` | React Query hooks |
| `components/tiles/graphics/WhoopInsightsTile.tsx` | Recovery display tile |
| `components/tiles/graphics/HealthTrackerTile.tsx` | Trend chart tile |

## Related Documentation

- [WHOOP API Docs](https://developer.whoop.com/api/)
- [WHOOP OAuth Guide](https://developer.whoop.com/docs/developing/oauth/)
- [V1 to V2 Migration](https://developer.whoop.com/docs/developing/v1-v2-migration/)
