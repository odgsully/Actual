/**
 * Monitoring dashboard API for scraping system
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { getQueueManager } from '@/lib/scraping/queue-manager';
import { getErrorHandler } from '@/lib/scraping/error-handler';
import { getPropertyManager } from '@/lib/database/property-manager';
import { getImageOptimizer } from '@/lib/storage/image-optimizer';
import { requireAdmin } from '@/lib/api/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/monitoring
 * Get comprehensive monitoring data
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const auth = await requireAdmin();
    if (!auth.success) return auth.response;

    const supabase = createClient();
    const queueManager = getQueueManager();
    const errorHandler = getErrorHandler();
    const propertyManager = getPropertyManager();
    const imageOptimizer = getImageOptimizer();

    // Get time range from query params
    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get('range') || '24h';
    
    const now = new Date();
    const startTime = new Date();
    
    switch (timeRange) {
      case '1h':
        startTime.setHours(now.getHours() - 1);
        break;
      case '24h':
        startTime.setHours(now.getHours() - 24);
        break;
      case '7d':
        startTime.setDate(now.getDate() - 7);
        break;
      case '30d':
        startTime.setDate(now.getDate() - 30);
        break;
      default:
        startTime.setHours(now.getHours() - 24);
    }

    // 1. Queue Statistics
    const queueStats = queueManager.getQueueStats();
    const activeJobs = queueManager.getActiveJobs();

    // 2. Error Metrics
    const systemHealth = errorHandler.getSystemHealth();
    const errorMetrics = errorHandler.getMetrics();

    // 3. Property Statistics
    const propertyStats = await propertyManager.getPropertyStats();

    // 4. Scraping Activity (from database)
    const { data: recentActivity } = await supabase
      .from('activity_log')
      .select('*')
      .eq('action_type', 'hourly_scrape')
      .gte('created_at', startTime.toISOString())
      .order('created_at', { ascending: false })
      .limit(100);

    // 5. Recent Properties
    const { data: recentProperties } = await supabase
      .from('properties')
      .select('id, address, city, list_price, source, created_at, last_scraped_at')
      .gte('last_scraped_at', startTime.toISOString())
      .order('last_scraped_at', { ascending: false })
      .limit(20);

    // 6. User Activity
    const { data: activeUsers } = await supabase
      .from('buyer_preferences')
      .select('user_id, completed_at, updated_at')
      .not('completed_at', 'is', null)
      .gte('updated_at', startTime.toISOString());

    // 7. Storage Statistics
    const storageStats = await imageOptimizer.getStorageStats();

    // 8. Performance Metrics
    const performanceMetrics = calculatePerformanceMetrics(recentActivity || []);

    // 9. Source Distribution
    const sourceDistribution = await getSourceDistribution(supabase, startTime);

    // 10. Error Rate Trends
    const errorTrends = calculateErrorTrends(errorMetrics, timeRange);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      timeRange,
      queue: {
        stats: queueStats,
        activeJobs: activeJobs.length,
        activeJobDetails: activeJobs.slice(0, 5) // First 5 jobs
      },
      health: {
        status: systemHealth.status,
        errorRate: systemHealth.errorRate,
        blockedUrls: systemHealth.blockedUrlCount,
        recommendations: systemHealth.recommendations
      },
      errors: {
        summary: errorMetrics.map(m => ({
          source: m.source,
          type: m.errorType,
          count: m.count,
          lastOccurred: m.lastOccurred
        })),
        trends: errorTrends
      },
      properties: {
        stats: propertyStats,
        recentCount: recentProperties?.length || 0,
        recent: recentProperties?.slice(0, 10) // First 10
      },
      scraping: {
        activityCount: recentActivity?.length || 0,
        successRate: performanceMetrics.successRate,
        averageDuration: performanceMetrics.averageDuration,
        totalPropertiesScraped: performanceMetrics.totalProperties
      },
      users: {
        activeCount: activeUsers?.length || 0,
        recentlyUpdated: activeUsers?.slice(0, 5).map(u => u.user_id)
      },
      storage: {
        totalImages: storageStats.totalImages,
        totalSizeMB: Math.round(storageStats.totalSizeBytes / (1024 * 1024)),
        averageSizeKB: Math.round(storageStats.averageSizeBytes / 1024)
      },
      sources: sourceDistribution
    });

  } catch (error) {
    console.error('Monitoring error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get monitoring data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate performance metrics from activity log
 */
function calculatePerformanceMetrics(activities: any[]): {
  successRate: number;
  averageDuration: number;
  totalProperties: number;
} {
  if (activities.length === 0) {
    return { successRate: 0, averageDuration: 0, totalProperties: 0 };
  }

  let successful = 0;
  let totalDuration = 0;
  let totalProperties = 0;

  activities.forEach(activity => {
    const details = activity.details || {};
    if (details.jobs_created > 0) {
      successful++;
    }
    if (details.duration) {
      totalDuration += details.duration;
    }
    if (details.stale_properties) {
      totalProperties += details.stale_properties;
    }
  });

  return {
    successRate: Math.round((successful / activities.length) * 100),
    averageDuration: Math.round(totalDuration / activities.length),
    totalProperties
  };
}

/**
 * Get source distribution
 */
async function getSourceDistribution(
  supabase: any,
  startTime: Date
): Promise<Record<string, number>> {
  const { data } = await supabase
    .from('properties')
    .select('data_source')
    .gte('last_scraped_at', startTime.toISOString());

  const distribution: Record<string, number> = {
    zillow: 0,
    redfin: 0,
    'homes.com': 0
  };

  if (data) {
    data.forEach((item: any) => {
      const source = item.data_source || 'unknown';
      distribution[source] = (distribution[source] || 0) + 1;
    });
  }

  return distribution;
}

/**
 * Calculate error trends
 */
function calculateErrorTrends(
  metrics: any[],
  timeRange: string
): { hourly?: number[]; daily?: number[] } {
  // Simplified trend calculation
  // In production, you'd want more sophisticated time-series analysis
  
  const trends: any = {};
  
  if (timeRange === '1h' || timeRange === '24h') {
    // Hourly trends for last 24 hours
    trends.hourly = new Array(24).fill(0);
    metrics.forEach(m => {
      const hour = new Date(m.lastOccurred).getHours();
      trends.hourly[hour] += m.count;
    });
  }
  
  if (timeRange === '7d' || timeRange === '30d') {
    // Daily trends
    trends.daily = new Array(7).fill(0);
    metrics.forEach(m => {
      const day = new Date(m.lastOccurred).getDay();
      trends.daily[day] += m.count;
    });
  }

  return trends;
}

/**
 * POST /api/admin/monitoring/reset
 * Reset monitoring metrics
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const auth = await requireAdmin();
    if (!auth.success) return auth.response;

    const body = await request.json();
    const { resetType } = body;

    const errorHandler = getErrorHandler();

    switch (resetType) {
      case 'errors':
        errorHandler.resetMetrics();
        break;
      case 'blocked':
        errorHandler.clearBlockedUrls();
        break;
      case 'all':
        errorHandler.resetMetrics();
        errorHandler.clearBlockedUrls();
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid reset type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Reset ${resetType} completed`
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Reset failed' },
      { status: 500 }
    );
  }
}