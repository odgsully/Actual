# MyFitnessPal Integration Setup

This document describes how to set up and use the MyFitnessPal integration in gs-site.

## Overview

The MyFitnessPal tile displays your food diary, weight, and exercise data from MyFitnessPal Premium. Due to MFP's security measures, data must be imported via **manual CSV upload**.

## Prerequisites

1. **MyFitnessPal Premium subscription** - The export feature requires Premium ($20/month)
2. **gs-site running** - The dashboard must be deployed or running locally

## Why Manual CSV Upload?

### The Problem: Multiple Layers of Protection

MyFitnessPal has implemented aggressive anti-bot measures that prevent automated data access:

1. **Hidden CAPTCHA (August 2022)** - Login page includes invisible CAPTCHA that blocks script-based authentication
2. **Cloudflare Protection** - All MFP pages are behind Cloudflare with JavaScript challenges (`cf-mitigated: challenge`)
3. **Server-Side Request Blocking** - Even with valid session cookies, server-side requests from Node.js are blocked with 403 errors

### What Doesn't Work

| Approach | Result |
|----------|--------|
| Cookie-based fetch | Blocked by Cloudflare challenge |
| Session scraping | Blocked by Cloudflare |
| Direct API calls | No public API available |
| Automated login | Blocked by hidden CAPTCHA |

### What Works

**Manual CSV Export + Upload** - You export your data from MFP's website (which you access with your browser that passes Cloudflare checks) and upload the CSV files to gs-site.

## Setup Instructions

### Step 1: Export from MyFitnessPal

1. Log into [myfitnesspal.com](https://www.myfitnesspal.com) in your browser
2. Go to **[Reports > Export](https://www.myfitnesspal.com/reports/export)**
3. Select your date range (e.g., last 7 days, last 30 days, or custom)
4. Click **Export**
5. You'll receive a ZIP file containing 3 CSV files:
   - `Nutrition Summary.csv` - Daily food/calorie data
   - `Progress.csv` - Weight and measurements
   - `Exercise.csv` - Workout entries

### Step 2: Upload to gs-site

1. Open gs-site dashboard (http://localhost:3003)
2. Find the **MyFitnessPal** tile (Health category)
3. Click the tile to open the modal
4. Go to the **Settings** tab
5. Use the CSV upload feature (or use the API directly - see below)

### Alternative: Direct API Upload

You can upload CSV content directly via the API:

```bash
# Upload nutrition data
curl -X POST http://localhost:3003/api/myfitnesspal/upload \
  -H "Content-Type: application/json" \
  -d '{
    "nutrition": "Date,Meal,Calories,Fat,...\n2026-01-01,Breakfast,450,12,...",
    "progress": "Date,Weight,...",
    "exercise": "Date,Exercise Name,..."
  }'
```

## Tile Features

### Compact View (Dashboard)
- Today's/Yesterday's calorie count
- Progress bar (percentage of goal)
- Current streak (consecutive days logged)

### Modal View (Click to Open)

**Today Tab**
- Full macro breakdown (calories, protein, carbs, fat)
- Additional nutrients (fiber, sugar, sodium)
- Meals logged count

**Week Tab**
- 7-day summary with averages
- Daily calorie bar chart
- Current streak

**Weight Tab**
- Latest weight measurement
- Weight change over period
- Trend indicator (losing/gaining/stable)

**Settings Tab**
- Connection status
- CSV upload functionality
- Last sync timestamp

## Recommended Workflow

Since automatic sync isn't possible, here's the recommended workflow:

### Weekly Routine (Recommended)
1. Every Sunday, export last 7 days from MFP
2. Upload the CSV to gs-site
3. Data updates in the tile

### Daily Routine (Optional)
1. Export yesterday's data each morning
2. Quick upload via API or UI
3. Track daily progress

## Database Tables

The integration uses these Supabase tables:

| Table | Purpose |
|-------|---------|
| `mfp_food_diary` | Daily calorie/macro aggregates |
| `mfp_measurements` | Weight and body measurements |
| `mfp_exercise` | Exercise entries |
| `mfp_sync_status` | Sync status tracking |
| `user_integrations` | Connection metadata |

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/myfitnesspal/status` | GET | Connection status + today's stats |
| `/api/myfitnesspal/upload` | POST | Upload CSV data (working method) |
| `/api/myfitnesspal/data` | GET | Get cached data for display |
| `/api/myfitnesspal/connect` | POST | Store connection info |
| `/api/myfitnesspal/connect` | DELETE | Disconnect |

### Deprecated Endpoints (Don't Work Due to Cloudflare)

| Endpoint | Method | Status |
|----------|--------|--------|
| `/api/myfitnesspal/sync` | POST | ❌ Blocked by Cloudflare |
| `/api/cron/mfp-daily-sync` | GET | ❌ Blocked by Cloudflare |

## CSV Format Reference

### Nutrition Summary.csv
```csv
Date,Meal,Calories,Fat,Saturated Fat,Polyunsaturated Fat,Monounsaturated Fat,Trans Fat,Cholesterol,Sodium,Potassium,Carbohydrates,Fiber,Sugar,Protein,Vitamin A,Vitamin C,Calcium,Iron,Note
2026-01-01,Breakfast,450,12,4,2,5,0,120,800,400,55,5,12,25,15,20,10,15,
```

### Progress.csv
```csv
Date,Weight,Body Fat %,Neck,Waist,Hips
2026-01-01,185.5,18.5,15.5,34,38
```

### Exercise.csv
```csv
Date,Exercise Name,Exercise Minutes,Exercise Calories Burned
2026-01-01,Running,30,350
```

## Troubleshooting

### No Data Showing
1. Export fresh data from MFP website
2. Upload via the Settings tab or API
3. Refresh the dashboard

### Upload Failed
1. Check CSV format matches expected columns
2. Ensure dates are in a parseable format (YYYY-MM-DD or MM/DD/YYYY)
3. Check browser console for errors

### Tile Not Appearing
1. Ensure tile is registered in `TileRegistry.tsx`
2. Check that `local-myfitnesspal` exists in `lib/data/tiles.ts`
3. Filter by "Health" category

## Files Reference

| File | Purpose |
|------|---------|
| `lib/myfitnesspal/types.ts` | TypeScript interfaces |
| `lib/myfitnesspal/client.ts` | Database operations |
| `lib/myfitnesspal/parser.ts` | CSV parsing utilities |
| `hooks/useMyFitnessPalStats.ts` | React Query hooks |
| `components/tiles/graphics/MyFitnessPalTile.tsx` | Tile component |
| `components/tiles/graphics/MyFitnessPalModal.tsx` | Modal component |
| `app/api/myfitnesspal/upload/route.ts` | CSV upload endpoint |
| `migrations/006_create_mfp_tables.sql` | Database schema |

## Known Limitations

1. **Manual upload required** - Cloudflare blocks automated access
2. **No real-time sync** - Must manually export/upload periodically
3. **Premium required** - MFP export is a Premium feature
4. **Single user** - Currently configured for `default-user`

## Future Improvements

Potential solutions that could enable automated sync:

1. **Playwright with stealth plugins** - Browser automation that can pass Cloudflare
2. **BrowserBase** - Cloud browser service with anti-detection
3. **MFP API partnership** - Official API access (requires business agreement)
4. **Apple Health bridge** - Sync MFP → Apple Health → gs-site

For now, the manual CSV upload is the reliable approach.
