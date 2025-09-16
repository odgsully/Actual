/**
 * Health check cron job
 * Runs every 15 minutes to monitor system health and send alerts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { getQueueManager } from '@/lib/scraping/queue-manager';
import { getErrorHandler } from '@/lib/scraping/error-handler';
import { headers } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface HealthAlert {
  level: 'warning' | 'critical';
  component: string;
  message: string;
  metric?: any;
}

/**
 * GET /api/cron/check-health
 * System health check
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron authentication - accept both Vercel's signature and manual triggers
    const vercelCronSignature = headers().get('x-vercel-cron-signature');
    const authHeader = headers().get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // Allow either Vercel's cron signature OR manual Bearer token
    const isVercelCron = vercelCronSignature === cronSecret;
    const isManualTrigger = cronSecret && authHeader === `Bearer ${cronSecret}`;
    
    // If cron secret is set, require authentication
    if (cronSecret && !isVercelCron && !isManualTrigger) {
      console.log('Cron auth failed:', { 
        hasVercelSignature: !!vercelCronSignature,
        hasAuthHeader: !!authHeader 
      });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createClient();
    const queueManager = getQueueManager();
    const errorHandler = getErrorHandler();
    
    const alerts: HealthAlert[] = [];
    const metrics: Record<string, any> = {};

    // 1. Check queue health
    const queueStats = queueManager.getQueueStats();
    const activeJobs = queueManager.getActiveJobs();
    
    metrics.queue = {
      stats: queueStats,
      activeJobs: activeJobs.length
    };

    // Check for stuck jobs (running for more than 10 minutes)
    const stuckJobs = activeJobs.filter(job => {
      if (job.startedAt) {
        const runningTime = Date.now() - job.startedAt.getTime();
        return runningTime > 10 * 60 * 1000; // 10 minutes
      }
      return false;
    });

    if (stuckJobs.length > 0) {
      alerts.push({
        level: 'warning',
        component: 'queue',
        message: `${stuckJobs.length} job(s) stuck for more than 10 minutes`,
        metric: stuckJobs.map(j => j.id)
      });
    }

    // Check for queue backup
    const totalPending = queueStats.reduce((sum, stat) => sum + stat.pending, 0);
    if (totalPending > 100) {
      alerts.push({
        level: 'critical',
        component: 'queue',
        message: `Queue backup detected: ${totalPending} pending jobs`,
        metric: totalPending
      });
    }

    // 2. Check error rates
    const systemHealth = errorHandler.getSystemHealth();
    metrics.errors = systemHealth;

    if (systemHealth.status === 'critical') {
      alerts.push({
        level: 'critical',
        component: 'errors',
        message: 'System health critical',
        metric: systemHealth
      });
    } else if (systemHealth.status === 'degraded') {
      alerts.push({
        level: 'warning',
        component: 'errors',
        message: 'System health degraded',
        metric: systemHealth
      });
    }

    // 3. Check database connectivity and performance
    const dbCheckStart = Date.now();
    const { data: dbTest, error: dbError } = await supabase
      .from('properties')
      .select('id')
      .limit(1);
    
    const dbResponseTime = Date.now() - dbCheckStart;
    metrics.database = {
      connected: !dbError,
      responseTime: dbResponseTime
    };

    if (dbError) {
      alerts.push({
        level: 'critical',
        component: 'database',
        message: 'Database connection failed',
        metric: dbError.message
      });
    } else if (dbResponseTime > 1000) {
      alerts.push({
        level: 'warning',
        component: 'database',
        message: `Slow database response: ${dbResponseTime}ms`,
        metric: dbResponseTime
      });
    }

    // 4. Check scraping success rate (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const { data: recentJobs } = await supabase
      .from('activity_log')
      .select('details')
      .eq('action_type', 'hourly_scrape')
      .gte('created_at', oneHourAgo.toISOString());

    if (recentJobs && recentJobs.length > 0) {
      const successfulJobs = recentJobs.filter(job => 
        job.details?.jobs_created > 0
      ).length;
      
      const successRate = (successfulJobs / recentJobs.length) * 100;
      metrics.scraping = {
        recentJobs: recentJobs.length,
        successRate: Math.round(successRate)
      };

      if (successRate < 50) {
        alerts.push({
          level: 'critical',
          component: 'scraping',
          message: `Low scraping success rate: ${Math.round(successRate)}%`,
          metric: successRate
        });
      } else if (successRate < 80) {
        alerts.push({
          level: 'warning',
          component: 'scraping',
          message: `Scraping success rate below target: ${Math.round(successRate)}%`,
          metric: successRate
        });
      }
    }

    // 5. Check storage usage
    const { data: storageInfo } = await supabase
      .from('property_images')
      .select('id', { count: 'exact' });

    const imageCount = storageInfo?.length || 0;
    metrics.storage = {
      imageCount,
      estimatedSizeMB: Math.round(imageCount * 0.5) // Rough estimate
    };

    // Alert if storage is getting high
    if (imageCount > 100000) {
      alerts.push({
        level: 'warning',
        component: 'storage',
        message: `High storage usage: ${imageCount} images`,
        metric: imageCount
      });
    }

    // 6. Check for missing hourly runs
    const { data: hourlyCrons } = await supabase
      .from('activity_log')
      .select('created_at')
      .eq('action_type', 'hourly_scrape')
      .gte('created_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (!hourlyCrons || hourlyCrons.length === 0) {
      alerts.push({
        level: 'critical',
        component: 'cron',
        message: 'No hourly scrape runs in last 2 hours',
        metric: null
      });
    }

    // 7. Send alerts if needed
    if (alerts.length > 0) {
      await sendAlerts(alerts, metrics);
    }

    // Log health check
    await supabase
      .from('activity_log')
      .insert({
        action_type: 'health_check',
        entity_type: 'system',
        details: {
          metrics,
          alerts,
          timestamp: new Date().toISOString()
        }
      });

    return NextResponse.json({
      success: true,
      healthy: alerts.filter(a => a.level === 'critical').length === 0,
      alerts,
      metrics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Health check error:', error);
    
    // Even if health check fails, try to log it
    try {
      const supabase = createClient();
      await supabase
        .from('activity_log')
        .insert({
          action_type: 'health_check_error',
          entity_type: 'system',
          details: {
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          }
        });
    } catch (logError) {
      console.error('Failed to log health check error:', logError);
    }
    
    return NextResponse.json(
      { 
        success: false,
        healthy: false,
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Send alerts via email/webhook
 */
async function sendAlerts(alerts: HealthAlert[], metrics: any): Promise<void> {
  // Critical alerts
  const criticalAlerts = alerts.filter(a => a.level === 'critical');
  
  if (criticalAlerts.length > 0) {
    console.error('CRITICAL ALERTS:', criticalAlerts);
    
    // In production, you would:
    // 1. Send email notifications
    // 2. Send to monitoring service (Datadog, New Relic, etc.)
    // 3. Send to Slack/Discord webhook
    // 4. Trigger PagerDuty if severe
    
    // Example webhook call (implement your preferred notification method)
    if (process.env.ALERT_WEBHOOK_URL) {
      try {
        await fetch(process.env.ALERT_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            level: 'critical',
            alerts: criticalAlerts,
            metrics,
            timestamp: new Date().toISOString()
          })
        });
      } catch (error) {
        console.error('Failed to send webhook alert:', error);
      }
    }
  }
  
  // Log all alerts
  console.log('Health check alerts:', alerts);
}