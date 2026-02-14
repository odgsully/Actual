# Demo Properties Setup Guide

## Overview
This guide explains how to set up the 8 specific Scottsdale properties for the demo user (support@wabbit-rank.ai) to replace the hardcoded placeholders in List View.

## The 8 Target Properties
These properties will be scraped with real, accurate data:
1. 7622 N VIA DE MANANA, Scottsdale, AZ 85258
2. 8347 E VIA DE DORADO DR, Scottsdale, AZ 85258
3. 6746 E MONTEROSA ST, Scottsdale, AZ 85251
4. 8520 E TURNEY AVE, Scottsdale, AZ 85251
5. 12028 N 80TH PL, Scottsdale, AZ 85260
6. 6911 E THUNDERBIRD RD, Scottsdale, AZ 85254
7. 7043 E HEARN RD, Scottsdale, AZ 85254
8. 13034 N 48TH PL, Scottsdale, AZ 85254

## Quick Setup (Recommended)

~~The automated `setup-demo-properties.sh` script was removed during the Feb 2026 monorepo cleanup (legacy, no longer functional).~~

To set up demo properties manually, follow the **Manual Setup** steps below.

## Manual Setup

If the automated script doesn't work, follow these steps:

### Step 1: Run Database Migration

```bash
# Using Supabase CLI
supabase db push --file migrations/006_add_image_and_demo_columns.sql

# OR using npm script (if configured)
npm run db:migrate
```

The migration adds these columns to the properties table:
- `primary_image_url` - Stores the main property image
- `primary_image_stored` - Tracks if image is in Supabase Storage
- `last_scraped_at` - Timestamp of last scrape
- `is_demo` - Marks demo properties
- `county` - County location (defaults to Maricopa)

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Run the Scraping Script

```bash
# Compile TypeScript
npx tsc scripts/seed-specific-demo-properties.ts --outDir dist --esModuleInterop --resolveJsonModule --skipLibCheck

# Run the script
node dist/scripts/seed-specific-demo-properties.js

# Clean up
rm -rf dist
```

## Verification

After setup, verify the properties are loaded:

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Sign in as the demo user:
   - Email: `support@wabbit-rank.ai`
   - The account auto-signs in

3. Navigate to List View:
   - Should see 8 real properties with accurate data
   - Each property should have:
     - Correct address
     - Actual listing price
     - Real bed/bath counts
     - Accurate square footage
     - Primary image (if available from scraping)

## Troubleshooting

### Properties Not Showing

1. Check if migration ran successfully:
   ```sql
   -- In Supabase SQL editor
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'properties' 
   AND column_name IN ('primary_image_url', 'is_demo');
   ```

2. Check if properties were inserted:
   ```sql
   SELECT id, address, city, is_demo, primary_image_url 
   FROM properties 
   WHERE is_demo = true;
   ```

3. Check console logs in browser for errors

### Scraping Fails

- **Rate Limiting**: Wait 5-10 minutes and try again
- **Network Issues**: Check internet connection
- **Zillow Blocking**: The scraper may be detected; try using a VPN
- **Properties Not Found**: Some addresses might not be listed currently

### Images Not Showing

- Images are scraped from Zillow when available
- If no image found, falls back to placeholder
- Check `primary_image_url` column in database

## Data Accuracy

The scraper prioritizes data accuracy:
- Only stores properties with complete critical data (price, beds, baths)
- Validates property status (prefers active/coming soon)
- Uses exact address matching when possible
- Falls back to closest match if exact address not found

## Updating Properties

To refresh the demo properties with latest data:

```bash
# Re-run the seeding script
node dist/scripts/seed-specific-demo-properties.js
```

This will:
- Clear existing demo properties
- Scrape fresh data for all 8 addresses
- Update with current market information

## Important Notes

1. **Development Only**: The scraping endpoints only work in development mode
2. **Rate Limits**: Zillow limits requests to ~100/hour, so the script includes delays
3. **Data Freshness**: Properties update based on MLS listing status
4. **Favorites**: First 3 properties are automatically favorited for demo user

## Files Modified

- `migrations/006_add_image_and_demo_columns.sql` - Database schema updates
- `scripts/seed-specific-demo-properties.ts` - Scraping script for 8 properties
- `app/list-view/page.tsx` - Removed hardcoded properties, now fetches from DB
- `app/api/admin/run-migration/route.ts` - Helper endpoint to run migrations
- ~~`setup-demo-properties.sh`~~ - Removed (Feb 2026 cleanup)

## Next Steps

After successful setup:
1. Test the rank-feed page with real properties
2. Verify property filtering works correctly
3. Test favoriting functionality
4. Check that property details are accurate