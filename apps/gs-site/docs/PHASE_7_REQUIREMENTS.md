# Phase 7 Requirements: Whoop & Content API Integrations

> **Purpose**: Comprehensive requirements documentation for Phase 7 tiles - Whoop health metrics and social media content APIs
>
> **Created**: December 22, 2025
> **Status**: Research Complete - Ready for Implementation
> **Related**: `/apps/gs-site/tile-logic-untile.md` (Phase 7)

---

## Table of Contents

1. [Overview](#overview)
2. [Whoop API Integration](#whoop-api-integration)
3. [YouTube Data API Integration](#youtube-data-api-integration)
4. [X (Twitter) API Integration](#x-twitter-api-integration)
5. [Environment Variables](#environment-variables)
6. [Caching Strategy](#caching-strategy)
7. [Effort Estimates](#effort-estimates)
8. [Implementation Checklist](#implementation-checklist)
9. [Resources & References](#resources--references)

---

## Overview

Phase 7 introduces 7 new tiles that integrate with health tracking (Whoop) and social media platforms (YouTube, X/Twitter):

### Whoop Tiles (3)

| Tile | Data Displayed | API Endpoint |
|------|----------------|--------------|
| **Whoop Insights** | HRV, Recovery %, Strain | `/v1/recovery`, `/v1/cycle` |
| **Health Tracker** | Multi-day trends (7-14 days) | `/v1/cycle` (paginated) |
| **Bloodwork Counter** | Days since last test | Static config + date math |

### Content Tiles (4)

| Tile | API | Data Displayed |
|------|-----|----------------|
| **YouTube wrapper** | YouTube Data API v3 | Subscriber count, recent views |
| **Socials Stats** | YouTube + X APIs | Multi-platform metrics |
| **GS socials Scheduler** | Internal DB | Scheduled posts calendar |
| **Accountability Report** | Notion + custom | Monthly reports with media |

**Note**: GS socials Scheduler and Accountability Report use internal APIs/Notion (already covered in Phase 2). This document focuses on the 3rd party integrations: **Whoop**, **YouTube**, and **X**.

---

## Whoop API Integration

### 1. API Overview

- **Base URL**: `https://api.prod.whoop.com`
- **Protocol**: OAuth 2.0 (Authorization Code Flow)
- **API Version**: v2 (as of 2025 - v1 deprecated October 1, 2025)
- **Developer Portal**: [developer.whoop.com](https://developer.whoop.com/)
- **Dashboard**: [developer-dashboard.whoop.com](https://developer-dashboard.whoop.com/)

### 2. OAuth 2.0 Authentication Flow

#### Step 1: Register App in Developer Dashboard

1. **Prerequisites**:
   - WHOOP account (same credentials for developer login)
   - Access to [developer-dashboard.whoop.com](https://developer-dashboard.whoop.com/)

2. **Create Team** (if first app):
   - Navigate to App creation flow
   - Create a Team (required before creating apps)

3. **Configure App**:
   - **App Name**: "GS Site Dashboard"
   - **Redirect URLs**:
     - `http://localhost:3000/api/auth/whoop/callback` (development)
     - `https://gssite.vercel.app/api/auth/whoop/callback` (production)
   - **Scopes** (minimum required):
     - `read:recovery` - Access recovery scores, HRV, RHR
     - `read:cycles` - Access physiological cycles with strain/HR metrics
     - `read:sleep` - Access sleep data (optional, for enhanced insights)
     - `read:workout` - Access workout data (optional, for activity correlation)
     - `offline` - Get refresh token for long-lived access

4. **Receive Credentials**:
   - **Client ID**: Public identifier (safe to expose in frontend)
   - **Client Secret**: **NEVER expose client-side** - server-side only

5. **App Limitations**:
   - Development apps limited to **10 WHOOP members**
   - For production launch to all users, submit app for approval
   - Can create up to **5 apps** per team

#### Step 2: OAuth Flow Implementation

```typescript
// lib/whoop/auth.ts

// 1. Redirect user to authorization URL
const authUrl = `https://api.prod.whoop.com/oauth/oauth2/auth?` +
  `client_id=${WHOOP_CLIENT_ID}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&response_type=code` +
  `&scope=read:recovery+read:cycles+offline`;

// 2. User logs in, grants permission → redirected to callback with code

// 3. Exchange code for access token (server-side only)
const tokenResponse = await fetch('https://api.prod.whoop.com/oauth/oauth2/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    client_id: WHOOP_CLIENT_ID,
    client_secret: WHOOP_CLIENT_SECRET,
    grant_type: 'authorization_code',
    code: authorizationCode,
    redirect_uri: REDIRECT_URI,
  }),
});

const { access_token, refresh_token, expires_in } = await tokenResponse.json();

// 4. Store tokens securely (encrypted in database)
// access_token: Use for API requests (expires in ~1 hour)
// refresh_token: Use to get new access tokens (long-lived)
```

#### Step 3: Token Refresh Strategy

Refresh tokens **every hour** or when access token expires:

```typescript
// Refresh access token using refresh token
const refreshResponse = await fetch('https://api.prod.whoop.com/oauth/oauth2/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    client_id: WHOOP_CLIENT_ID,
    client_secret: WHOOP_CLIENT_SECRET,
    grant_type: 'refresh_token',
    refresh_token: storedRefreshToken,
  }),
});
```

**Best Practice**: Refresh proactively before expiration, not reactively on 401 errors.

### 3. API Endpoints & Data Models

#### Recovery Data (`read:recovery` scope)

```http
GET https://api.prod.whoop.com/developer/v1/recovery
Authorization: Bearer {access_token}
```

**Query Parameters**:
- `limit`: Number of records (max 25)
- `start`: ISO 8601 start date filter
- `end`: ISO 8601 end date filter
- `nextToken`: Pagination token

**Response Schema**:
```json
{
  "records": [
    {
      "cycle_id": "12345",
      "sleep_id": "67890",
      "score": 75,
      "user_calibrating": false,
      "survey_response_id": null,
      "created_at": "2025-12-22T10:00:00Z",
      "updated_at": "2025-12-22T10:15:00Z",
      "score_state": "SCORED",
      "recovery_score": {
        "user_calibrating": false,
        "recovery_score": 75,
        "resting_heart_rate": 52,
        "hrv_rmssd": 85.5,
        "spo2_percentage": 97.2,
        "skin_temp_celsius": 33.4
      }
    }
  ],
  "next_token": null
}
```

**Key Metrics**:
- `recovery_score`: Overall recovery percentage (0-100)
- `resting_heart_rate`: RHR in BPM
- `hrv_rmssd`: Heart Rate Variability (HRV) in milliseconds
- `spo2_percentage`: Blood oxygen saturation (WHOOP 4.0+)
- `skin_temp_celsius`: Skin temperature deviation

#### Cycle Data (`read:cycles` scope)

```http
GET https://api.prod.whoop.com/developer/v1/cycle
Authorization: Bearer {access_token}
```

**Response Schema** (includes strain metrics):
```json
{
  "records": [
    {
      "id": 12345,
      "user_id": 67890,
      "created_at": "2025-12-22T05:00:00Z",
      "updated_at": "2025-12-22T23:59:59Z",
      "start": "2025-12-22T05:00:00Z",
      "end": "2025-12-23T04:59:59Z",
      "timezone_offset": "-08:00",
      "score_state": "SCORED",
      "score": {
        "strain": 12.5,
        "average_heart_rate": 68,
        "max_heart_rate": 145,
        "kilojoules": 8500.3,
        "day_strain": 8.2,
        "workout_strain": 4.3
      }
    }
  ]
}
```

**Key Metrics**:
- `strain`: Overall strain score (0-21)
- `day_strain`: Strain from daily activities
- `workout_strain`: Strain from workouts
- `kilojoules`: Energy expenditure

### 4. Rate Limits

**Official Documentation**: Not explicitly published in public docs

**Best Practices**:
- Implement exponential backoff on 429 errors
- Max 3 retries per request
- Use webhooks for real-time updates instead of polling
- Cache aggressively (see Caching Strategy section)

**Observed Limits** (from third-party integrations):
- Likely follows standard OAuth 2.0 rate limiting
- Refresh token endpoint: ~1 request/hour recommended
- Data endpoints: Reasonable polling (e.g., every 15 minutes)

### 5. Webhooks (Alternative to Polling)

WHOOP v2 API supports webhooks for real-time data updates:

```http
POST https://api.prod.whoop.com/developer/v1/webhook
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "url": "https://gssite.vercel.app/api/webhooks/whoop",
  "enabled": true
}
```

**Benefits**:
- Receive notifications when new recovery/cycle data available
- Reduces API calls (no need for frequent polling)
- Stays within rate limits

**Recommended for Production**: Use webhooks + cache instead of polling every 15 minutes.

### 6. Data Refresh Frequency

Based on how WHOOP devices work:

| Data Type | Update Frequency | Recommended Cache |
|-----------|------------------|-------------------|
| Recovery Score | Once per sleep cycle (morning) | 15 minutes |
| Strain | Continuous (real-time on device) | 15 minutes |
| Sleep | After sleep ends (~morning) | 1 hour |
| Workouts | After workout ends | 30 minutes |

**Note**: WHOOP devices sync data periodically to the cloud. Data may not be available immediately after recording.

### 7. Security & Privacy Considerations

- **HIPAA Compliance**: WHOOP data is health data - handle securely
- **Token Storage**: Encrypt access/refresh tokens in database
- **Token Exposure**: Never log tokens or expose in frontend
- **User Consent**: Clearly explain what data you're accessing
- **Revocation**: Provide UI for users to disconnect WHOOP
- **Data Retention**: Don't store raw health data longer than needed

### 8. Error Handling

```typescript
// lib/whoop/client.ts
async function getRecoveryData(accessToken: string) {
  try {
    const response = await fetch('https://api.prod.whoop.com/developer/v1/recovery', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (response.status === 401) {
      // Token expired - refresh and retry
      const newToken = await refreshAccessToken();
      return getRecoveryData(newToken);
    }

    if (response.status === 429) {
      // Rate limited - exponential backoff
      await sleep(Math.pow(2, retryCount) * 1000);
      return getRecoveryData(accessToken);
    }

    if (!response.ok) {
      throw new Error(`Whoop API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    // Graceful degradation - tile shows "Whoop unavailable"
    console.error('Whoop API error:', error);
    return null;
  }
}
```

### 9. Tile Implementation Notes

#### Whoop Insights Tile

**Display**:
- Large recovery score (0-100) with color coding:
  - 67-100: Green (good recovery)
  - 34-66: Yellow (moderate recovery)
  - 0-33: Red (poor recovery)
- HRV value (ms) with trend arrow
- Strain score (0-21) with color coding

**Data Source**: Latest recovery + today's cycle

**Warning Trigger**: API connection failed → red border trail + "Broken Link Whoop"

#### Health Tracker Tile

**Display**:
- Multi-line chart (Recharts) with 7-14 days of data:
  - Recovery % (line 1 - green)
  - Strain (line 2 - orange)
  - RHR (line 3 - blue, secondary Y-axis)

**Data Source**: Paginated cycle/recovery requests for date range

**Cache**: 30 minutes (historical data doesn't change)

#### Bloodwork Counter Tile

**Display**:
- Large number: "X days since last bloodwork"
- Color coding:
  - 0-90 days: Green
  - 91-180 days: Yellow
  - 180+ days: Red

**Data Source**: Static config in Notion or local file (not from Whoop API)

**Implementation**: Pure frontend date math (no API needed)

---

## YouTube Data API Integration

### 1. API Overview

- **Base URL**: `https://www.googleapis.com/youtube/v3`
- **Protocol**: OAuth 2.0 OR API Key (public data only)
- **API Version**: v3
- **Documentation**: [developers.google.com/youtube/v3](https://developers.google.com/youtube/v3)
- **Console**: [console.cloud.google.com](https://console.cloud.google.com)

### 2. OAuth 2.0 vs API Key

| Method | Use Case | Setup Complexity |
|--------|----------|------------------|
| **API Key** | Public data (subscriber count, video stats) | Low - Just enable API |
| **OAuth 2.0** | Private data (analytics, playlists, uploads) | High - User consent required |

**Recommendation for GS Site**: Use **API Key** for public channel stats (simpler, no user login required).

### 3. Setup Steps

#### Step 1: Create Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create new project: "GS Site Dashboard"
3. Enable APIs: **YouTube Data API v3**
4. Navigate to: APIs & Services > Credentials

#### Step 2: Create API Key

1. Click "Create Credentials" → "API Key"
2. Copy the generated key (e.g., `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`)
3. **Restrict the key** (recommended):
   - Application restrictions: HTTP referrers (websites)
     - `https://gssite.vercel.app/*`
     - `http://localhost:3000/*` (for development)
   - API restrictions: YouTube Data API v3

#### Step 3: OAuth 2.0 Setup (Optional - for Private Data)

If you need OAuth (e.g., for upload notifications, private analytics):

1. **Configure OAuth Consent Screen**:
   - User Type: **External** (for testing with limited users)
   - App Name: "GS Site Dashboard"
   - User Support Email: your email
   - Developer Contact: your email
   - Scopes: Add required scopes (see below)

2. **Add Test Users** (required for External apps):
   - Add your Google account email
   - App stays in "Testing" mode (100 users max)

3. **Create OAuth 2.0 Client ID**:
   - Application Type: **Web Application**
   - Authorized Redirect URIs:
     - `http://localhost:3000/api/auth/youtube/callback`
     - `https://gssite.vercel.app/api/auth/youtube/callback`
   - Save Client ID and Client Secret

4. **Request Verification** (if going public):
   - Submit verification request to remove "Unverified app" warning
   - Required for public apps accessing user data

### 4. Required Scopes

For public channel data (no OAuth needed):
- **None** - Use API key

For authenticated user data (OAuth required):

| Scope | Permission | Use Case |
|-------|------------|----------|
| `https://www.googleapis.com/auth/youtube.readonly` | View YouTube account | General read access |
| `https://www.googleapis.com/auth/yt-analytics.readonly` | View analytics | Detailed metrics |
| `https://www.googleapis.com/auth/yt-analytics-monetary.readonly` | View revenue | Financial reports |
| `https://www.googleapis.com/auth/youtube.upload` | Upload videos | Post new content |

**Recommendation**: Start with API key for public data. Add OAuth later if needed.

### 5. API Endpoints

#### Get Channel Statistics (Subscriber Count)

```http
GET https://www.googleapis.com/youtube/v3/channels?part=statistics&id={CHANNEL_ID}&key={API_KEY}
```

**Example Request**:
```bash
curl "https://www.googleapis.com/youtube/v3/channels?part=statistics&id=UC_x5XG1OV2P6uZZ5FSM9Ttw&key=YOUR_API_KEY"
```

**Response**:
```json
{
  "items": [
    {
      "id": "UC_x5XG1OV2P6uZZ5FSM9Ttw",
      "statistics": {
        "viewCount": "12345678",
        "subscriberCount": "5000",
        "hiddenSubscriberCount": false,
        "videoCount": "120"
      }
    }
  ]
}
```

**Quota Cost**: 1 unit

#### Get Recent Videos

```http
GET https://www.googleapis.com/youtube/v3/search?part=snippet&channelId={CHANNEL_ID}&order=date&maxResults=10&key={API_KEY}
```

**Quota Cost**: 100 units

#### Get Video Statistics

```http
GET https://www.googleapis.com/youtube/v3/videos?part=statistics&id={VIDEO_ID}&key={API_KEY}
```

**Response** (includes view count, likes, comments):
```json
{
  "items": [
    {
      "id": "dQw4w9WgXcQ",
      "statistics": {
        "viewCount": "1000000",
        "likeCount": "50000",
        "commentCount": "1200"
      }
    }
  ]
}
```

**Quota Cost**: 1 unit

### 6. Quota Limits

**Daily Quota**: **10,000 units per day** (default)

**Quota Costs**:
| Operation | Cost (units) | Daily Max |
|-----------|--------------|-----------|
| Read (channels, videos) | 1 | 10,000 requests |
| Search | 100 | 100 searches |
| Upload video | 1,600 | 6 uploads |

**Quota Reset**: Midnight Pacific Time (PT) - no rollover

**Exceeding Quota**:
- HTTP 403: `quotaExceeded` error
- Blocked until midnight PT reset
- Example: Exceed at 11 PM PT → blocked 1 hour. Exceed at 1 AM PT → blocked 23 hours.

**Requesting Quota Increase**:
1. Fill out [Quota Extension Form](https://support.google.com/youtube/contact/yt_api_form)
2. Demonstrate compliance with API Terms of Service
3. Verify OAuth consent screen (required for large quotas)
4. Free to request - approval based on merit
5. Note: "Queries per minute per user" limit **cannot** be changed

**2025 Quota Best Practices**:
- Cache aggressively (see Caching Strategy)
- Use batch requests where possible
- Avoid search endpoint (100 units) - use direct ID lookups (1 unit)
- Monitor quota usage in Google Cloud Console

### 7. Caching Recommendations

| Data | Update Frequency | Recommended Cache |
|------|------------------|-------------------|
| Subscriber count | ~Daily | 6-12 hours |
| Video view counts | ~Hourly | 30-60 minutes |
| Recent videos list | ~Daily | 12-24 hours |
| Video metadata | Rarely changes | 24 hours |

**Why Cache Aggressively**:
- Quota is limited (10,000/day)
- Subscriber counts update slowly (not real-time)
- Reduces API latency

**Implementation**:
```typescript
// Use React Query with long staleTime
const { data } = useQuery({
  queryKey: ['youtube-stats', channelId],
  queryFn: () => fetchYouTubeStats(channelId),
  staleTime: 6 * 60 * 60 * 1000, // 6 hours
  cacheTime: 24 * 60 * 60 * 1000, // 24 hours
});
```

### 8. Error Handling

```typescript
async function getChannelStats(channelId: string, apiKey: string) {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${apiKey}`
    );

    if (response.status === 403) {
      const error = await response.json();
      if (error.error.errors[0].reason === 'quotaExceeded') {
        // Quota exceeded - use cached data
        console.error('YouTube quota exceeded - using cached data');
        return getCachedStats(channelId);
      }
    }

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    // Graceful degradation
    console.error('YouTube API error:', error);
    return null;
  }
}
```

### 9. Tile Implementation Notes

#### YouTube Wrapper Tile

**Display**:
- Subscriber count (formatted: "5.2K", "1.2M")
- Last 7 days view count
- Optional: Thumbnail of latest video

**Data Source**:
- Channels endpoint (statistics part)
- Optional: Videos endpoint for latest video

**Warning Trigger**: "Track Screentime..." if daily API usage exceeds threshold

**Quota Impact**: 1 unit per refresh (low cost)

#### Socials Stats Tile (YouTube portion)

**Display**:
- Subscriber count
- Total views
- Video count
- Trend indicators (up/down arrows)

**Data Source**: Same as YouTube wrapper

**Multi-platform Strategy**: Fetch YouTube and X data in parallel, show partial data if one fails

---

## X (Twitter) API Integration

### 1. API Overview

- **Base URL**: `https://api.x.com/2` (v2 API)
- **Protocol**: OAuth 2.0 OR Bearer Token (app-only)
- **API Version**: v2 (recommended)
- **Documentation**: [developer.x.com](https://developer.x.com)
- **Portal**: [developer.x.com/portal](https://developer.x.com/portal)

### 2. API Access Tiers (2025 Pricing)

| Tier | Monthly Cost | Posts/Month | Read Requests/Month | Features |
|------|--------------|-------------|---------------------|----------|
| **Free** | $0 | 500 | 100 | Basic read access, Limited posts |
| **Basic** | $100 | 50,000 | ~10,000 | Higher limits, Follower counts |
| **Pro** | $5,000+ | Unlimited | ~1M | Advanced analytics, Ads API |
| **Enterprise** | Custom | Unlimited | Unlimited | Full data streams, Dedicated support |

**2025 Update**: X introduced **pay-per-use pricing** (beta) - Pay for individual operations instead of fixed tiers. Similar to AWS/GCP consumption billing.

**Recommendation for GS Site**:
- **Start with Free tier** for development/testing
- **Upgrade to Basic ($100/month)** for production if need follower counts and engagement metrics
- Free tier is **severely limited** (1 request per 24 hours on most endpoints)

### 3. Authentication Methods

#### Option 1: Bearer Token (App-Only)

**Use Case**: Public data without user context (follower count, tweets)

**Setup**:
1. Create app in [developer.x.com/portal](https://developer.x.com/portal)
2. Get Bearer Token from app settings
3. Use in requests: `Authorization: Bearer {TOKEN}`

**Rate Limits**: App-level (e.g., 450 requests per 15 minutes)

**Example**:
```bash
curl "https://api.x.com/2/users/by/username/odgsully?user.fields=public_metrics" \
  -H "Authorization: Bearer YOUR_BEARER_TOKEN"
```

#### Option 2: OAuth 2.0 (User Context)

**Use Case**: Acting on behalf of a user (post tweets, read DMs)

**Setup**: Similar to Whoop/YouTube OAuth flow

**Rate Limits**: User-level (e.g., 900 requests per 15 minutes per user)

**Recommendation**: Use **Bearer Token** for GS Site (simpler, public data only).

### 4. Setup Steps

1. **Create Developer Account**:
   - Go to [developer.x.com/portal](https://developer.x.com/portal)
   - Apply for Developer Access (usually approved within hours)

2. **Create App**:
   - App Name: "GS Site Dashboard"
   - App Description: "Personal dashboard for social media analytics"
   - Website URL: `https://gssite.vercel.app`

3. **Get Bearer Token**:
   - Navigate to app settings → "Keys and tokens"
   - Generate Bearer Token
   - **Save securely** - shown only once

4. **Choose API Tier**:
   - Free tier: Auto-assigned
   - Basic tier: Upgrade in billing settings ($100/month)

### 5. API Endpoints

#### Get User Information (Follower Count)

```http
GET https://api.x.com/2/users/by/username/{username}?user.fields=public_metrics
Authorization: Bearer {BEARER_TOKEN}
```

**Response**:
```json
{
  "data": {
    "id": "123456789",
    "name": "Garrett Sullivan",
    "username": "odgsully",
    "public_metrics": {
      "followers_count": 1234,
      "following_count": 567,
      "tweet_count": 8901,
      "listed_count": 10,
      "like_count": 2345
    }
  }
}
```

**Quota Cost** (Basic tier): 1 request per call

**Rate Limit**:
- Free tier: **1 request per 24 hours**
- Basic tier: 300 requests per 15 minutes (app-level)

#### Get Tweet Engagement Metrics

```http
GET https://api.x.com/2/tweets/{tweet_id}?tweet.fields=public_metrics
Authorization: Bearer {BEARER_TOKEN}
```

**Response**:
```json
{
  "data": {
    "id": "987654321",
    "text": "Building amazing things...",
    "public_metrics": {
      "retweet_count": 50,
      "reply_count": 10,
      "like_count": 200,
      "quote_count": 5,
      "bookmark_count": 15,
      "impression_count": 5000
    }
  }
}
```

**Note**: `impression_count` requires OAuth with tweet owner's credentials (not available with Bearer Token).

### 6. Rate Limits

#### Free Tier

- **User lookup**: 1 request per 24 hours
- **Tweet lookup**: 1 request per 24 hours
- **Effectively unusable** for production apps

#### Basic Tier ($100/month)

- **App-level** (Bearer Token): 300-450 requests per 15 minutes (varies by endpoint)
- **User-level** (OAuth): 900 requests per 15 minutes per user

#### Rate Limit Response

```json
{
  "errors": [
    {
      "message": "Too Many Requests",
      "type": "https://api.twitter.com/2/problems/resource-not-found"
    }
  ]
}
```

**HTTP Status**: 429 Too Many Requests

**Retry-After Header**: Indicates when rate limit resets (typically 15 minutes)

### 7. Recent API Changes (Twitter → X)

- **Branding**: Twitter rebranded to X (URLs still use twitter.com and x.com interchangeably)
- **Pricing**: Massive price increases in 2023-2024, stabilized in 2025
- **Free tier**: Severely restricted (1 request/24h makes it unusable for dashboards)
- **Basic tier**: Required minimum for any real application ($100/month)
- **Webhooks**: Enterprise-only feature now

### 8. Caching Recommendations

| Data | Update Frequency | Recommended Cache |
|------|------------------|-------------------|
| Follower count | ~Daily | 12-24 hours |
| Tweet metrics | ~Hourly | 1-2 hours |
| User profile | Rarely changes | 24 hours |

**Why Cache Aggressively**:
- Free tier: 1 request per 24 hours (cache is mandatory)
- Basic tier: Rate limits still restrictive
- Follower counts update slowly (not real-time)

**Implementation**:
```typescript
// Use React Query with very long staleTime for Free tier
const { data } = useQuery({
  queryKey: ['twitter-stats', username],
  queryFn: () => fetchTwitterStats(username),
  staleTime: 24 * 60 * 60 * 1000, // 24 hours (Free tier)
  cacheTime: 7 * 24 * 60 * 60 * 1000, // 7 days
  retry: 1, // Don't retry on rate limit
});
```

### 9. Error Handling

```typescript
async function getTwitterStats(username: string, bearerToken: string) {
  try {
    const response = await fetch(
      `https://api.x.com/2/users/by/username/${username}?user.fields=public_metrics`,
      {
        headers: { Authorization: `Bearer ${bearerToken}` },
      }
    );

    if (response.status === 429) {
      // Rate limited - use cached data
      const retryAfter = response.headers.get('retry-after');
      console.error(`X API rate limited. Retry after ${retryAfter} seconds`);
      return getCachedStats(username);
    }

    if (response.status === 403) {
      // Quota exceeded or tier limitation
      console.error('X API quota exceeded - upgrade tier or use cached data');
      return getCachedStats(username);
    }

    if (!response.ok) {
      throw new Error(`X API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    // Graceful degradation
    console.error('X API error:', error);
    return null;
  }
}
```

### 10. Tile Implementation Notes

#### Socials Stats Tile (X portion)

**Display**:
- Follower count (formatted: "1.2K", "5.6M")
- Total tweets
- Engagement rate (if OAuth available)
- Trend indicators

**Data Source**: Users endpoint with `public_metrics` field

**Warning Trigger**: "Broken Link Instagram/X/Youtube" if any platform API fails

**Quota Impact**:
- Free tier: 1 request per tile refresh (max 1/day)
- Basic tier: 1 request per refresh (within 300/15min limit)

**Multi-platform Strategy**:
```typescript
// Fetch all platforms in parallel
const [youtubeData, twitterData, instagramData] = await Promise.allSettled([
  fetchYouTubeStats(),
  fetchTwitterStats(),
  fetchInstagramStats(),
]);

// Show partial results if some fail
if (twitterData.status === 'rejected') {
  // Show "X unavailable" instead of hiding entire tile
}
```

---

## Environment Variables

Add these to `.env.local` (development) and Vercel/deployment config (production):

```bash
# ============================================================
# WHOOP API
# ============================================================
WHOOP_CLIENT_ID=your_whoop_client_id
WHOOP_CLIENT_SECRET=your_whoop_client_secret_KEEP_SECRET
WHOOP_REDIRECT_URI=http://localhost:3000/api/auth/whoop/callback
# Production:
# WHOOP_REDIRECT_URI=https://gssite.vercel.app/api/auth/whoop/callback

# ============================================================
# YouTube Data API
# ============================================================
YOUTUBE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
YOUTUBE_CHANNEL_ID=UC_x5XG1OV2P6uZZ5FSM9Ttw
# Optional: OAuth credentials (if needed)
# YOUTUBE_CLIENT_ID=xxx.apps.googleusercontent.com
# YOUTUBE_CLIENT_SECRET=xxx

# ============================================================
# X (Twitter) API
# ============================================================
TWITTER_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAAAAxxxxxxxxxxxxxxxxxxxxxxx
TWITTER_USERNAME=odgsully
# Optional: OAuth credentials (if needed)
# TWITTER_API_KEY=xxx
# TWITTER_API_SECRET=xxx

# ============================================================
# Encryption Key (for storing OAuth tokens)
# ============================================================
OAUTH_ENCRYPTION_KEY=generate_random_32_byte_key_here
```

**Security Notes**:
- **NEVER commit** `.env.local` to git
- Add to `.env.sample` with placeholder values
- Rotate secrets every 90 days
- Use Vercel Environment Variables dashboard for production

---

## Caching Strategy

### 1. Per-Tile Cache Configuration

Based on the plan's recommendation: "Whoop 15min, YouTube varies"

```typescript
// lib/cache-config.ts
export const CACHE_CONFIG = {
  whoop: {
    recovery: 15 * 60 * 1000,      // 15 minutes
    cycle: 15 * 60 * 1000,         // 15 minutes
    historical: 30 * 60 * 1000,    // 30 minutes (doesn't change)
  },
  youtube: {
    subscriberCount: 6 * 60 * 60 * 1000,  // 6 hours (slow changes)
    viewCount: 30 * 60 * 1000,             // 30 minutes
    videoList: 12 * 60 * 60 * 1000,        // 12 hours
  },
  twitter: {
    followerCount: 24 * 60 * 60 * 1000,    // 24 hours (Free tier: mandatory)
    tweetMetrics: 2 * 60 * 60 * 1000,      // 2 hours (if Basic tier)
  },
};
```

### 2. React Query Implementation

```typescript
// hooks/useWhoopData.ts
import { useQuery } from '@tanstack/react-query';
import { CACHE_CONFIG } from '@/lib/cache-config';

export function useWhoopRecovery() {
  return useQuery({
    queryKey: ['whoop-recovery'],
    queryFn: () => fetchWhoopRecovery(),
    staleTime: CACHE_CONFIG.whoop.recovery,
    cacheTime: CACHE_CONFIG.whoop.recovery * 2,
    retry: 1,
    refetchOnWindowFocus: false, // Don't refetch on tab focus
  });
}

// hooks/useYouTubeData.ts
export function useYouTubeStats(channelId: string) {
  return useQuery({
    queryKey: ['youtube-stats', channelId],
    queryFn: () => fetchYouTubeStats(channelId),
    staleTime: CACHE_CONFIG.youtube.subscriberCount,
    cacheTime: CACHE_CONFIG.youtube.subscriberCount * 2,
    retry: 1,
  });
}

// hooks/useTwitterData.ts
export function useTwitterStats(username: string) {
  return useQuery({
    queryKey: ['twitter-stats', username],
    queryFn: () => fetchTwitterStats(username),
    staleTime: CACHE_CONFIG.twitter.followerCount,
    cacheTime: CACHE_CONFIG.twitter.followerCount * 2,
    retry: 1,
  });
}
```

### 3. Server-Side Caching (API Routes)

```typescript
// app/api/whoop/recovery/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const data = await fetchWhoopRecovery();

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
      // 15 minutes cache, 30 minutes stale-while-revalidate
    },
  });
}
```

### 4. Fallback Strategy on Cache Miss

```typescript
async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number
): Promise<T | null> {
  try {
    // Try fresh fetch
    const data = await fetcher();
    // Store in cache (Redis, Vercel KV, or in-memory)
    await cache.set(key, data, { ex: ttl / 1000 });
    return data;
  } catch (error) {
    // On error, try to return stale cache
    const cachedData = await cache.get(key);
    if (cachedData) {
      console.warn(`Using stale cache for ${key} due to API error`);
      return cachedData;
    }
    // No cache available - return null (tile shows error state)
    return null;
  }
}
```

### 5. Cache Invalidation Triggers

| Event | Action | APIs Affected |
|-------|--------|---------------|
| User clicks "Refresh" button | Clear cache for that tile | All |
| Whoop webhook received | Invalidate Whoop cache | Whoop only |
| Manual override in settings | Clear all API caches | All |
| OAuth token refreshed | No invalidation needed | All |
| API error (5xx) | Keep using stale cache | All |

---

## Effort Estimates

### Per-Tile Breakdown

| Tile | Complexity | API Integration | Frontend Work | Backend Work | Total Hours |
|------|------------|-----------------|---------------|--------------|-------------|
| **Whoop Insights** | Medium | OAuth + 2 endpoints | 4h (graphic tile) | 6h (OAuth, tokens) | **10h** |
| **Health Tracker** | Medium | Pagination logic | 5h (multi-line chart) | 3h (data aggregation) | **8h** |
| **Bloodwork Counter** | Low | None (static) | 2h (counter tile) | 1h (config management) | **3h** |
| **YouTube wrapper** | Low | API key setup | 3h (metric display) | 2h (API calls) | **5h** |
| **Socials Stats** | High | 2 APIs (YT + X) | 6h (multi-metric tile) | 4h (parallel fetching) | **10h** |
| **GS socials Scheduler** | Medium | Internal DB | 4h (calendar view) | 3h (CRUD API) | **7h** |
| **Accountability Report** | Medium | Notion integration | 5h (report layout) | 3h (Notion queries) | **8h** |

### Phase-Level Estimates

| Component | Hours | Notes |
|-----------|-------|-------|
| **Whoop OAuth Setup** | 6 | One-time: Token management, refresh logic |
| **YouTube Setup** | 2 | One-time: API key, quota monitoring |
| **X Setup** | 3 | One-time: Bearer token, tier selection |
| **Whoop Tiles (3)** | 21 | Insights (10h) + Tracker (8h) + Counter (3h) |
| **Content Tiles (4)** | 30 | YouTube (5h) + Socials (10h) + Scheduler (7h) + Report (8h) |
| **Error Handling & Testing** | 8 | Graceful degradation, boundary testing |
| **Documentation** | 4 | API docs, environment setup guide |
| **Buffer (20%)** | 15 | Unexpected issues, iterations |
| **TOTAL** | **89 hours** | ~11 days at 8h/day, or ~3 weeks part-time |

### Dependency Chain

```
Week 1:
├─ Whoop OAuth setup (6h)
├─ YouTube API key setup (2h)
├─ X Bearer token setup (3h)
└─ Whoop Insights tile (10h) ← First tile to validate OAuth

Week 2:
├─ Health Tracker tile (8h)
├─ Bloodwork Counter tile (3h)
├─ YouTube wrapper tile (5h)
└─ Start Socials Stats tile (partial)

Week 3:
├─ Complete Socials Stats tile (10h total)
├─ GS socials Scheduler tile (7h)
├─ Accountability Report tile (8h)
└─ Error handling, testing, docs (12h)
```

### Risk Factors

| Risk | Impact | Mitigation |
|------|--------|------------|
| Whoop OAuth complexity | +5-10h | Use library (Passport.js), follow official tutorials |
| YouTube quota exceeded during dev | +2-3h | Aggressive caching from day 1, use test channel |
| X API tier limitations | +0-5h | Start with Basic tier ($100), accept Free tier limits |
| Token security issues | +3-5h | Use proven encryption (Vercel KV, encrypted DB) |
| Multi-API error coordination | +4-6h | Test each platform independently first |

---

## Implementation Checklist

### Pre-Implementation (Setup Phase)

- [ ] **Whoop**
  - [ ] Create WHOOP account (if needed)
  - [ ] Register app in [developer-dashboard.whoop.com](https://developer-dashboard.whoop.com/)
  - [ ] Configure scopes: `read:recovery`, `read:cycles`, `offline`
  - [ ] Add redirect URIs (localhost + production)
  - [ ] Save Client ID and Client Secret to `.env.local`
  - [ ] Test OAuth flow with Postman/curl

- [ ] **YouTube**
  - [ ] Create Google Cloud project
  - [ ] Enable YouTube Data API v3
  - [ ] Generate API Key
  - [ ] Restrict API key (HTTP referrers + API restrictions)
  - [ ] Save API Key and Channel ID to `.env.local`
  - [ ] Test API with curl (channels endpoint)

- [ ] **X (Twitter)**
  - [ ] Apply for Developer Account
  - [ ] Create app in Developer Portal
  - [ ] Choose tier (start with Free, plan for Basic)
  - [ ] Generate Bearer Token
  - [ ] Save Bearer Token and Username to `.env.local`
  - [ ] Test API with curl (users endpoint)

### Implementation Phase

- [ ] **Backend - OAuth & Token Management**
  - [ ] Create `/lib/whoop/client.ts` - OAuth flow functions
  - [ ] Create `/lib/whoop/token-manager.ts` - Token storage/refresh
  - [ ] Create `/app/api/auth/whoop/callback/route.ts` - OAuth callback
  - [ ] Set up token encryption (use `crypto` or Vercel KV)
  - [ ] Implement token refresh logic (runs every hour)
  - [ ] Add token revocation endpoint (user disconnect)

- [ ] **Backend - API Clients**
  - [ ] Create `/lib/whoop/api.ts` - Whoop API wrapper
    - [ ] `getRecoveryData(accessToken)`
    - [ ] `getCycleData(accessToken, dateRange)`
    - [ ] `getSleepData(accessToken)` (optional)
  - [ ] Create `/lib/youtube/api.ts` - YouTube API wrapper
    - [ ] `getChannelStats(channelId, apiKey)`
    - [ ] `getRecentVideos(channelId, apiKey)` (optional)
  - [ ] Create `/lib/twitter/api.ts` - X API wrapper
    - [ ] `getUserStats(username, bearerToken)`
    - [ ] `getTweetMetrics(tweetId, bearerToken)` (optional)

- [ ] **Backend - API Routes**
  - [ ] `/app/api/whoop/recovery/route.ts` - Fetch recovery data
  - [ ] `/app/api/whoop/cycle/route.ts` - Fetch cycle/strain data
  - [ ] `/app/api/youtube/stats/route.ts` - Fetch channel stats
  - [ ] `/app/api/twitter/stats/route.ts` - Fetch user stats
  - [ ] Add cache headers to all routes (`s-maxage`, `stale-while-revalidate`)

- [ ] **Frontend - Hooks**
  - [ ] Create `/hooks/useWhoopData.ts`
    - [ ] `useWhoopRecovery()` - 15min cache
    - [ ] `useWhoopCycle()` - 15min cache
    - [ ] `useWhoopHistorical()` - 30min cache
  - [ ] Create `/hooks/useYouTubeData.ts`
    - [ ] `useYouTubeStats()` - 6h cache
  - [ ] Create `/hooks/useTwitterData.ts`
    - [ ] `useTwitterStats()` - 24h cache

- [ ] **Frontend - Tiles**
  - [ ] Create `/components/tiles/graphics/WhoopInsightsTile.tsx`
    - [ ] Recovery score display (large number)
    - [ ] HRV value with trend
    - [ ] Strain score with color coding
    - [ ] Error state: "Whoop unavailable"
    - [ ] Warning border trail on API failure
  - [ ] Create `/components/tiles/graphics/HealthTrackerTile.tsx`
    - [ ] Multi-line chart (Recovery, Strain, RHR)
    - [ ] Date range selector (7/14/30 days)
    - [ ] Loading skeleton
    - [ ] Error state with retry button
  - [ ] Create `/components/tiles/graphics/BloodworkCounterTile.tsx`
    - [ ] Large day count
    - [ ] Color coding (green/yellow/red)
    - [ ] Config: last bloodwork date
  - [ ] Create `/components/tiles/graphics/YouTubeTile.tsx`
    - [ ] Subscriber count
    - [ ] Last 7 days views (optional)
    - [ ] Latest video thumbnail (optional)
  - [ ] Create `/components/tiles/graphics/SocialsStatsTile.tsx`
    - [ ] YouTube metrics
    - [ ] X metrics
    - [ ] Trend indicators
    - [ ] Graceful degradation (show partial data)
    - [ ] Warning border on any platform failure

- [ ] **Error Handling & Testing**
  - [ ] Test OAuth flow end-to-end (Whoop)
  - [ ] Test token refresh logic (expire token manually)
  - [ ] Test API rate limiting (simulate 429 errors)
  - [ ] Test quota exceeded (YouTube)
  - [ ] Test Free tier limitations (X)
  - [ ] Test graceful degradation (disconnect network)
  - [ ] Test cache behavior (stale data on API failure)
  - [ ] Test multi-API failure (Socials Stats tile)

- [ ] **Security & Privacy**
  - [ ] Verify tokens encrypted in database
  - [ ] Verify tokens never logged
  - [ ] Add user consent flow (WHOOP OAuth)
  - [ ] Add "Disconnect Whoop" button in settings
  - [ ] Add privacy policy link (health data handling)
  - [ ] Test token expiration scenarios

- [ ] **Documentation**
  - [ ] Update `.env.sample` with all new variables
  - [ ] Create setup guide: `/docs/PHASE_7_SETUP.md`
  - [ ] Document API rate limits and quotas
  - [ ] Document caching strategy per API
  - [ ] Add troubleshooting section (common errors)

### Deployment Phase

- [ ] **Environment Variables**
  - [ ] Add all secrets to Vercel dashboard
  - [ ] Test production OAuth redirect URIs
  - [ ] Verify API keys work in production

- [ ] **Monitoring**
  - [ ] Set up quota monitoring (YouTube)
  - [ ] Set up rate limit alerts (X)
  - [ ] Monitor token refresh failures (Whoop)
  - [ ] Track API error rates per platform

- [ ] **Production Testing**
  - [ ] Test Whoop OAuth on production URL
  - [ ] Verify YouTube API key restrictions work
  - [ ] Test X API with production Bearer token
  - [ ] Smoke test all 7 tiles
  - [ ] Verify caching behavior in production

---

## Resources & References

### Official Documentation

**Whoop**:
- [WHOOP Developer Portal](https://developer.whoop.com/)
- [OAuth 2.0 Guide](https://developer.whoop.com/docs/developing/oauth/)
- [API Reference](https://developer.whoop.com/api/)
- [Getting Started Tutorial](https://developer.whoop.com/docs/developing/getting-started/)
- [v1 to v2 Migration Guide](https://developer.whoop.com/docs/developing/v1-v2-migration/)

**YouTube**:
- [YouTube Data API Overview](https://developers.google.com/youtube/v3/getting-started)
- [OAuth 2.0 Implementation](https://developers.google.com/youtube/v3/guides/authentication)
- [Channels Endpoint](https://developers.google.com/youtube/v3/docs/channels/list)
- [Quota Calculator](https://developers.google.com/youtube/v3/determine_quota_cost)
- [Quota & Compliance Audits](https://developers.google.com/youtube/v3/guides/quota_and_compliance_audits)

**X (Twitter)**:
- [X Developer Platform](https://developer.x.com)
- [API v2 Documentation](https://developer.x.com/en/docs/x-api)
- [Rate Limits Guide](https://developer.x.com/en/docs/x-api/rate-limits)
- [Users Lookup Endpoint](https://developer.x.com/en/docs/x-api/users/lookup)
- [OAuth 2.0 Guide](https://developer.x.com/en/docs/authentication/oauth-2-0)

### Third-Party Guides

**Whoop**:
- [WHOOP Integration Series (Terra)](https://tryterra.co/blog/whoop-integration-series-part-2-data-available-from-the-api-ec4337a9455b)
- [WHOOP API Client (Ruby)](https://github.com/xdevplatform/engagement-api-client-ruby)

**YouTube**:
- [Complete Guide to YouTube Data API v3](https://elfsight.com/blog/youtube-data-api-v3-limits-operations-resources-methods-etc/)
- [Understanding YouTube Quota System](https://docs.expertflow.com/cx/4.9/understanding-the-youtube-data-api-v3-quota-system)
- [YouTube API Limits: How to Fix Quota Exceeded](https://getlate.dev/blog/youtube-api-limits-how-to-calculate-api-usage-cost-and-fix-exceeded-api-quota)

**X (Twitter)**:
- [How to Get X API Key: 2025 Guide](https://elfsight.com/blog/how-to-get-x-twitter-api-key-in-2025/)
- [X API Pricing Tiers 2025](https://twitterapi.io/blog/twitter-api-pricing-2025)
- [Twitter API Limits Guide](https://9meters.com/entertainment/social-media/x-api-rate-limits-formerly-twitter)

### Libraries & Tools

**OAuth Libraries**:
- [NextAuth.js](https://next-auth.js.org/) - OAuth for Next.js (supports custom providers)
- [Passport.js](http://www.passportjs.org/) - Node.js authentication middleware

**API Clients**:
- [@notionhq/client](https://www.npmjs.com/package/@notionhq/client) - Official Notion SDK
- [googleapis](https://www.npmjs.com/package/googleapis) - Official Google APIs client
- [twitter-api-v2](https://www.npmjs.com/package/twitter-api-v2) - Unofficial but robust X/Twitter client

**React Query**:
- [@tanstack/react-query](https://tanstack.com/query/latest) - Data fetching & caching

**Encryption**:
- [crypto](https://nodejs.org/api/crypto.html) - Built-in Node.js crypto module
- [@vercel/kv](https://vercel.com/docs/storage/vercel-kv) - Vercel KV storage with encryption

### Search Result Sources

**Whoop API**:
- [OAuth 2.0 | WHOOP for Developers](https://developer.whoop.com/docs/developing/oauth/)
- [WHOOP API Docs](https://developer.whoop.com/api/)
- [Recovery | WHOOP for Developers](https://developer.whoop.com/docs/developing/user-data/recovery/)
- [Getting Started | WHOOP for Developers](https://developer.whoop.com/docs/developing/getting-started/)
- [WHOOP Integration series Part 2: Data available from the API](https://tryterra.co/blog/whoop-integration-series-part-2-data-available-from-the-api-ec4337a9455b)

**YouTube Data API**:
- [Quota and Compliance Audits | YouTube Data API](https://developers.google.com/youtube/v3/guides/quota_and_compliance_audits)
- [YouTube Data API Overview](https://developers.google.com/youtube/v3/getting-started)
- [Channels: list | YouTube Data API](https://developers.google.com/youtube/v3/docs/channels/list)
- [OAuth 2.0 for Web Server Applications](https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps)
- [Your Complete Guide to YouTube Data API v3](https://elfsight.com/blog/youtube-data-api-v3-limits-operations-resources-methods-etc/)

**X (Twitter) API**:
- [Rate limits - X Developer Platform](https://developer.x.com/en/docs/x-api/v1/rate-limits)
- [How to Get X API Key: Complete 2025 Guide](https://elfsight.com/blog/how-to-get-x-twitter-api-key-in-2025/)
- [X (Twitter) Official API Pricing Tiers 2025](https://twitterapi.io/blog/twitter-api-pricing-2025)
- [Engagement API - X Developer Platform](https://developer.x.com/en/docs/x-api/enterprise/engagement-api/overview)
- [X API Rate Limits (Formerly Twitter) - 9meters](https://9meters.com/entertainment/social-media/x-api-rate-limits-formerly-twitter)

---

## Next Steps

1. **Review this document** with stakeholders
2. **Prioritize tiles** based on business value:
   - High: Whoop Insights, Socials Stats (most user engagement)
   - Medium: YouTube wrapper, Health Tracker
   - Low: Bloodwork Counter (static data)
3. **Allocate budget**:
   - X API Basic tier: $100/month
   - YouTube quota increase: Free (if needed)
   - Whoop: Free (under 10 users)
4. **Start with Whoop OAuth setup** (most complex, unlocks 3 tiles)
5. **Implement tiles incrementally** (one per week)
6. **Test thoroughly** with graceful degradation in mind

---

**Document Version**: 1.0
**Last Updated**: December 22, 2025
**Author**: Claude (Research & Documentation Agent)
**Status**: Ready for Implementation
