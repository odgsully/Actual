/**
 * On-demand property scraping API
 * Allows users to trigger immediate scraping of specific properties or searches
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { getQueueManager } from '@/lib/scraping/queue-manager';
import { ScrapeJob, PropertySource } from '@/lib/scraping/types';
import { getUserPreferences } from '@/lib/database/preferences';
import { rateLimiters } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST /api/scrape/on-demand
 * Trigger immediate property scraping
 */
export async function POST(request: NextRequest) {
  // Rate limit: 10 scraping requests per hour per IP (additional layer on top of quota)
  const rateLimitResult = await rateLimiters.scraping.check(request)
  if (!rateLimitResult.success) {
    return rateLimitResult.response
  }

  try {
    const supabase = createClient();
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      type,
      url,
      urls,
      searchCriteria,
      usePreferences = false,
      source = 'zillow'
    } = body;

    // Validate request
    if (!type || !['url', 'urls', 'search', 'preferences'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid request type' },
        { status: 400 }
      );
    }

    // Check user's scraping quota (implement your own logic)
    const quotaCheck = await checkUserQuota(user.id);
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        { 
          error: 'Quota exceeded',
          message: quotaCheck.message,
          resetAt: quotaCheck.resetAt
        },
        { status: 429 }
      );
    }

    const queueManager = getQueueManager();
    const jobs: ScrapeJob[] = [];

    switch (type) {
      case 'url':
        // Single URL scraping
        if (!url) {
          return NextResponse.json(
            { error: 'URL is required' },
            { status: 400 }
          );
        }

        const urlSource = detectSourceFromUrl(url);
        if (!urlSource) {
          return NextResponse.json(
            { error: 'Unsupported URL. Please use Zillow, Redfin, or Homes.com URLs' },
            { status: 400 }
          );
        }

        jobs.push(createScrapeJob({
          userId: user.id,
          source: urlSource,
          url,
          priority: 'high'
        }));
        break;

      case 'urls':
        // Multiple URLs scraping
        if (!urls || !Array.isArray(urls)) {
          return NextResponse.json(
            { error: 'URLs array is required' },
            { status: 400 }
          );
        }

        if (urls.length > 10) {
          return NextResponse.json(
            { error: 'Maximum 10 URLs allowed per request' },
            { status: 400 }
          );
        }

        for (const url of urls) {
          const urlSource = detectSourceFromUrl(url);
          if (urlSource) {
            jobs.push(createScrapeJob({
              userId: user.id,
              source: urlSource,
              url,
              priority: 'high'
            }));
          }
        }
        break;

      case 'search':
        // Search-based scraping
        if (!searchCriteria) {
          return NextResponse.json(
            { error: 'Search criteria is required' },
            { status: 400 }
          );
        }

        // Validate source
        if (!['zillow', 'redfin', 'homes.com'].includes(source)) {
          return NextResponse.json(
            { error: 'Invalid source' },
            { status: 400 }
          );
        }

        jobs.push(createScrapeJob({
          userId: user.id,
          source: source as PropertySource,
          searchCriteria,
          priority: 'high'
        }));
        break;

      case 'preferences':
        // Use user's saved preferences
        const preferences = await getUserPreferences(user.id);
        
        if (!preferences) {
          return NextResponse.json(
            { error: 'No preferences found. Please complete the preferences form first.' },
            { status: 400 }
          );
        }

        // Create jobs for each source
        const sources: PropertySource[] = ['zillow', 'redfin', 'homes.com'];
        for (const src of sources) {
          jobs.push(createScrapeJob({
            userId: user.id,
            source: src,
            userPreferences: {
              userId: user.id,
              propertyTypes: preferences.property_type ? [preferences.property_type] : ['Single Family'],
              minBedrooms: preferences.bedrooms_needed || 2,
              minBathrooms: preferences.bathrooms_needed || 1,
              minSquareFeet: preferences.min_square_footage,
              minLotSize: preferences.min_lot_square_footage,
              priceMin: preferences.price_range_min || 100000,
              priceMax: preferences.price_range_max || 5000000,
              cities: preferences.city_preferences || [],
              zipCodes: preferences.preferred_zip_codes || [],
              homeStyle: preferences.home_style === 'single-story' ? 'single-story' : 
                        preferences.home_style === 'multi-level' ? 'multi-level' : 'any',
              poolPreference: preferences.pool_preference === 'yes' ? 'required' :
                             preferences.pool_preference === 'no' ? 'avoid' : 'neutral',
              hoaPreference: preferences.hoa_preference === 'dont_want' ? 'avoid' :
                            preferences.hoa_preference === 'need' ? 'required' : 'neutral',
              minGarageSpaces: preferences.min_garage_spaces,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            priority: 'high'
          }));
        }
        break;
    }

    if (jobs.length === 0) {
      return NextResponse.json(
        { error: 'No valid scraping jobs created' },
        { status: 400 }
      );
    }

    // Add jobs to queue
    const jobIds: string[] = [];
    const queuePromises = jobs.map(async (job) => {
      jobIds.push(job.id);
      return queueManager.addJob(job);
    });

    await Promise.allSettled(queuePromises);

    // Log activity
    await supabase
      .from('activity_log')
      .insert({
        user_id: user.id,
        action_type: 'on_demand_scrape',
        entity_type: 'scrape_job',
        details: {
          type,
          jobCount: jobs.length,
          jobIds,
          source: source || 'mixed'
        }
      });

    // Update user quota
    await updateUserQuota(user.id, jobs.length);

    return NextResponse.json({
      success: true,
      message: `${jobs.length} scraping job(s) queued`,
      jobIds,
      estimatedTime: jobs.length * 5, // Rough estimate in seconds
      quota: await getUserQuotaStatus(user.id)
    });

  } catch (error) {
    console.error('On-demand scraping error:', error);
    
    return NextResponse.json(
      { 
        error: 'Scraping request failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/scrape/on-demand/status
 * Get status of user's scraping jobs
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's recent scraping activity
    const { data: recentActivity } = await supabase
      .from('activity_log')
      .select('*')
      .eq('user_id', user.id)
      .eq('action_type', 'on_demand_scrape')
      .order('created_at', { ascending: false })
      .limit(10);

    // Get queue status
    const queueManager = getQueueManager();
    const activeJobs = queueManager.getActiveJobs()
      .filter(job => job.userId === user.id);

    // Get quota status
    const quota = await getUserQuotaStatus(user.id);

    return NextResponse.json({
      activeJobs: activeJobs.map(job => ({
        id: job.id,
        status: job.status,
        source: job.source,
        priority: job.priority,
        startedAt: job.startedAt
      })),
      recentActivity: recentActivity?.map(activity => ({
        timestamp: activity.created_at,
        type: activity.details?.type,
        jobCount: activity.details?.jobCount,
        source: activity.details?.source
      })),
      quota
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    );
  }
}

/**
 * Helper: Detect source from URL
 */
function detectSourceFromUrl(url: string): PropertySource | null {
  if (url.includes('zillow.com')) return 'zillow';
  if (url.includes('redfin.com')) return 'redfin';
  if (url.includes('homes.com')) return 'homes.com';
  return null;
}

/**
 * Helper: Create scrape job
 */
function createScrapeJob(params: {
  userId: string;
  source: PropertySource;
  url?: string;
  searchCriteria?: any;
  userPreferences?: any;
  priority: 'high' | 'medium' | 'low';
}): ScrapeJob {
  return {
    id: `on-demand-${params.userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'on-demand',
    source: params.source,
    userId: params.userId,
    url: params.url,
    searchCriteria: params.searchCriteria,
    userPreferences: params.userPreferences,
    priority: params.priority,
    status: 'pending',
    attempts: 0,
    maxAttempts: 3
  };
}

/**
 * Helper: Check user quota
 */
async function checkUserQuota(userId: string): Promise<{
  allowed: boolean;
  message?: string;
  resetAt?: Date;
}> {
  const supabase = createClient();
  
  // Get user's scraping activity in last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const { data, error } = await supabase
    .from('activity_log')
    .select('details')
    .eq('user_id', userId)
    .eq('action_type', 'on_demand_scrape')
    .gte('created_at', oneHourAgo.toISOString());

  if (error) {
    console.error('Error checking quota:', error);
    return { allowed: true }; // Allow on error
  }

  // Count total jobs in last hour
  let totalJobs = 0;
  data?.forEach(activity => {
    totalJobs += activity.details?.jobCount || 0;
  });

  // Free tier: 10 jobs per hour
  const hourlyLimit = 10;
  
  if (totalJobs >= hourlyLimit) {
    return {
      allowed: false,
      message: `You've reached your hourly limit of ${hourlyLimit} scraping jobs`,
      resetAt: new Date(oneHourAgo.getTime() + 60 * 60 * 1000)
    };
  }

  return { allowed: true };
}

/**
 * Helper: Update user quota
 */
async function updateUserQuota(userId: string, jobCount: number): Promise<void> {
  // In production, you might want to track this in a separate table
  // For now, we're using the activity_log
}

/**
 * Helper: Get user quota status
 */
async function getUserQuotaStatus(userId: string): Promise<{
  used: number;
  limit: number;
  remaining: number;
  resetAt: Date;
}> {
  const supabase = createClient();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const { data } = await supabase
    .from('activity_log')
    .select('details')
    .eq('user_id', userId)
    .eq('action_type', 'on_demand_scrape')
    .gte('created_at', oneHourAgo.toISOString());

  let used = 0;
  data?.forEach(activity => {
    used += activity.details?.jobCount || 0;
  });

  const limit = 10; // Free tier limit
  
  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    resetAt: new Date(oneHourAgo.getTime() + 60 * 60 * 1000)
  };
}