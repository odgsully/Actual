/**
 * Hourly cron job for property scraping
 * This endpoint should be called by a cron service (Vercel Cron, AWS EventBridge, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { getQueueManager } from '@/lib/scraping/queue-manager';
import { ScrapeJob, PropertySource } from '@/lib/scraping/types';
import { headers } from 'next/headers';

// Cron schedule: Run every hour
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

/**
 * GET /api/cron/hourly-scrape
 * Triggered hourly to scrape properties
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron authentication - accept both Vercel's signature and manual triggers
    const headersList = await headers();
    const vercelCronSignature = headersList.get('x-vercel-cron-signature');
    const authHeader = headersList.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // Allow either Vercel's cron signature OR manual Bearer token
    const isVercelCron = vercelCronSignature === cronSecret;
    const isManualTrigger = cronSecret && authHeader === `Bearer ${cronSecret}`;
    
    // Fail-closed: always require authentication
    if (!cronSecret) {
      console.error('CRON_SECRET not configured — rejecting request');
      return NextResponse.json(
        { error: 'Server misconfiguration' },
        { status: 500 }
      );
    }

    if (!isVercelCron && !isManualTrigger) {
      console.log('Cron auth failed:', {
        hasVercelSignature: !!vercelCronSignature,
        hasAuthHeader: !!authHeader,
        isVercelCron,
        isManualTrigger
      });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const startTime = Date.now();
    const supabase = createClient();
    const queueManager = getQueueManager();

    // Get active user preferences that need updating
    const { data: activeUsers } = await supabase
      .from('buyer_preferences')
      .select(`
        user_id,
        property_type,
        min_square_footage,
        min_lot_square_footage,
        price_range_min,
        price_range_max,
        bedrooms_needed,
        bathrooms_needed,
        city_preferences,
        preferred_zip_codes,
        home_style,
        pool_preference,
        min_garage_spaces,
        hoa_preference
      `)
      .not('completed_at', 'is', null)
      .limit(10); // Process up to 10 users per hour

    if (!activeUsers || activeUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active users to process',
        duration: Date.now() - startTime
      });
    }

    // Get properties that haven't been scraped in 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: staleProperties } = await supabase
      .from('properties')
      .select('id, external_url, data_source')
      .eq('status', 'active')
      .or(`last_scraped_at.is.null,last_scraped_at.lt.${twentyFourHoursAgo}`)
      .limit(30); // Limit to 30 properties per hour

    const jobs: ScrapeJob[] = [];
    const sources: PropertySource[] = ['zillow', 'redfin', 'homes.com'];
    
    // Create jobs for user preferences (priority 1)
    for (const user of activeUsers) {
      // Rotate through sources for each user
      const source = sources[Math.floor(Math.random() * sources.length)];
      
      const job: ScrapeJob = {
        id: `user-${user.user_id}-${Date.now()}`,
        type: 'scheduled',
        source,
        userId: user.user_id,
        userPreferences: {
          userId: user.user_id,
          propertyTypes: user.property_type ? [user.property_type] : ['Single Family'],
          minBedrooms: user.bedrooms_needed || 2,
          minBathrooms: user.bathrooms_needed || 1,
          minSquareFeet: user.min_square_footage,
          minLotSize: user.min_lot_square_footage,
          priceMin: user.price_range_min || 100000,
          priceMax: user.price_range_max || 5000000,
          cities: user.city_preferences || [],
          zipCodes: user.preferred_zip_codes || [],
          homeStyle: user.home_style === 'single-story' ? 'single-story' : 
                    user.home_style === 'multi-level' ? 'multi-level' : 'any',
          poolPreference: user.pool_preference === 'yes' ? 'required' :
                         user.pool_preference === 'no' ? 'avoid' : 'neutral',
          hoaPreference: user.hoa_preference === 'dont_want' ? 'avoid' :
                        user.hoa_preference === 'need' ? 'required' : 'neutral',
          minGarageSpaces: user.min_garage_spaces,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        priority: 'high',
        status: 'pending',
        attempts: 0,
        maxAttempts: 3
      };
      
      jobs.push(job);
    }

    // Create jobs for stale properties (priority 2)
    if (staleProperties) {
      for (const property of staleProperties) {
        if (property.external_url && property.data_source) {
          const job: ScrapeJob = {
            id: `property-${property.id}-${Date.now()}`,
            type: 'scheduled',
            source: property.data_source as PropertySource,
            url: property.external_url,
            priority: 'medium',
            status: 'pending',
            attempts: 0,
            maxAttempts: 2
          };
          
          jobs.push(job);
        }
      }
    }

    // Add jobs to queue
    const queuePromises = jobs.map(job => queueManager.addJob(job));
    await Promise.allSettled(queuePromises);

    // Get queue statistics
    const stats = queueManager.getQueueStats();

    // Log activity
    await supabase
      .from('activity_log')
      .insert({
        action_type: 'hourly_scrape',
        entity_type: 'cron_job',
        details: {
          jobs_created: jobs.length,
          users_processed: activeUsers.length,
          stale_properties: staleProperties?.length || 0,
          queue_stats: stats,
          duration: Date.now() - startTime
        }
      });

    return NextResponse.json({
      success: true,
      message: 'Hourly scrape initiated',
      jobs_created: jobs.length,
      users_processed: activeUsers.length,
      stale_properties_updated: staleProperties?.length || 0,
      queue_stats: stats,
      duration: Date.now() - startTime
    });

  } catch (error) {
    console.error('Hourly scrape error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Hourly scrape failed'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/hourly-scrape
 * Manual trigger for testing
 */
export async function POST(request: NextRequest) {
  // Allow manual triggering in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Manual triggering only allowed in development' },
      { status: 403 }
    );
  }

  return GET(request);
}