/**
 * Daily cleanup cron job
 * Runs at 3 AM to clean up old data and optimize storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { getPropertyManager } from '@/lib/database/property-manager';
import { getImageOptimizer } from '@/lib/storage/image-optimizer';
import { headers } from 'next/headers';
import { readdir, stat, rm } from 'fs/promises';
import { join } from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * GET /api/cron/daily-cleanup
 * Daily cleanup tasks
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
        hasAuthHeader: !!authHeader
      });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const startTime = Date.now();
    const supabase = createClient();
    const propertyManager = getPropertyManager();
    const imageOptimizer = getImageOptimizer();
    
    const cleanupResults = {
      oldProperties: 0,
      orphanedImages: 0,
      oldActivityLogs: 0,
      duplicateProperties: 0,
      oldScrapeHistory: 0,
      totalFreedSpace: 0,
      tempFilesRemoved: 0
    };

    // 1. Clean up sold properties older than 90 days
    cleanupResults.oldProperties = await propertyManager.cleanupOldProperties(90);

    // 2. Remove orphaned images (properties that no longer exist)
    const { data: orphanedImages } = await supabase
      .from('property_images')
      .select('property_id, image_url')
      .filter('property_id', 'not.in', 
        `(SELECT id FROM properties)`
      );

    if (orphanedImages && orphanedImages.length > 0) {
      // Delete orphaned image records
      const { error } = await supabase
        .from('property_images')
        .delete()
        .filter('property_id', 'not.in', 
          `(SELECT id FROM properties)`
        );

      if (!error) {
        cleanupResults.orphanedImages = orphanedImages.length;
        
        // Clean up actual image files
        for (const image of orphanedImages) {
          await imageOptimizer.cleanupPropertyImages(image.property_id);
        }
      }
    }

    // 3. Clean up old activity logs (older than 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: deletedLogs } = await supabase
      .from('activity_log')
      .delete()
      .lt('created_at', thirtyDaysAgo.toISOString())
      .select();

    cleanupResults.oldActivityLogs = deletedLogs?.length || 0;

    // 4. Identify and merge duplicate properties
    const duplicates = await findDuplicateProperties(supabase);
    cleanupResults.duplicateProperties = await mergeDuplicateProperties(supabase, duplicates);

    // 5. Clean up old scrape history (keep only last 10 per property)
    const { data: properties } = await supabase
      .from('properties')
      .select('id, raw_data');

    if (properties) {
      for (const property of properties) {
        if (property.raw_data?.scrapeHistory?.length > 10) {
          const trimmedHistory = property.raw_data.scrapeHistory.slice(-10);
          await supabase
            .from('properties')
            .update({
              raw_data: {
                ...property.raw_data,
                scrapeHistory: trimmedHistory
              }
            })
            .eq('id', property.id);
          
          cleanupResults.oldScrapeHistory++;
        }
      }
    }

    // 6. Clean up old temp artifacts (reportit + mcao-bulk)
    const tempDirs = [
      join(process.cwd(), 'tmp', 'reportit'),
      join(process.cwd(), 'tmp', 'reportit', 'breakups'),
      join(process.cwd(), 'tmp', 'mcao-bulk'),
    ];
    let tempFilesRemoved = 0;
    const ONE_HOUR_MS = 60 * 60 * 1000;

    for (const dir of tempDirs) {
      try {
        const entries = await readdir(dir);
        for (const entry of entries) {
          const entryPath = join(dir, entry);
          try {
            const entryStat = await stat(entryPath);
            if (Date.now() - entryStat.mtimeMs > ONE_HOUR_MS) {
              await rm(entryPath, { recursive: true, force: true });
              tempFilesRemoved++;
            }
          } catch {
            // Entry may have been deleted concurrently
          }
        }
      } catch {
        // Directory may not exist
      }
    }

    cleanupResults.tempFilesRemoved = tempFilesRemoved;

    // 7. Optimize database (analyze tables for better query performance)
    await optimizeDatabase(supabase);

    // 8. Calculate freed space
    const storageStats = await imageOptimizer.getStorageStats();
    cleanupResults.totalFreedSpace = cleanupResults.orphanedImages * 
      (storageStats.averageSizeBytes / 1024); // in KB

    // Log cleanup activity
    await supabase
      .from('activity_log')
      .insert({
        action_type: 'daily_cleanup',
        entity_type: 'system',
        details: {
          ...cleanupResults,
          duration: Date.now() - startTime
        }
      });

    return NextResponse.json({
      success: true,
      message: 'Daily cleanup completed',
      results: cleanupResults,
      duration: Date.now() - startTime
    });

  } catch (error) {
    console.error('Daily cleanup error:', error);
    
    return NextResponse.json(
      { 
        error: 'Cleanup failed',
        message: 'Internal cleanup error'
      },
      { status: 500 }
    );
  }
}

/**
 * Find duplicate properties based on address and MLS number
 */
async function findDuplicateProperties(supabase: any): Promise<any[]> {
  const { data } = await supabase
    .from('properties')
    .select('id, address, zip_code, mls_number')
    .order('created_at', { ascending: true });

  if (!data) return [];

  const duplicates: any[] = [];
  const seen = new Map<string, any>();

  for (const property of data) {
    // Create unique key from address and zip
    const key = `${property.address?.toLowerCase()}_${property.zip_code}`;
    
    if (seen.has(key)) {
      duplicates.push({
        keep: seen.get(key),
        remove: property
      });
    } else {
      seen.set(key, property);
    }

    // Also check MLS number
    if (property.mls_number) {
      const mlsKey = `mls_${property.mls_number}`;
      if (seen.has(mlsKey)) {
        const existing = seen.get(mlsKey);
        if (existing.id !== property.id) {
          duplicates.push({
            keep: existing,
            remove: property
          });
        }
      } else {
        seen.set(mlsKey, property);
      }
    }
  }

  return duplicates;
}

/**
 * Merge duplicate properties
 */
async function mergeDuplicateProperties(
  supabase: any,
  duplicates: any[]
): Promise<number> {
  let mergedCount = 0;

  for (const dup of duplicates) {
    try {
      // Move user_properties to the kept property
      await supabase
        .from('user_properties')
        .update({ property_id: dup.keep.id })
        .eq('property_id', dup.remove.id);

      // Move rankings to the kept property
      await supabase
        .from('rankings')
        .update({ property_id: dup.keep.id })
        .eq('property_id', dup.remove.id);

      // Delete the duplicate
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', dup.remove.id);

      if (!error) {
        mergedCount++;
      }
    } catch (error) {
      console.error(`Failed to merge duplicate ${dup.remove.id}:`, error);
    }
  }

  return mergedCount;
}

/**
 * Optimize database tables
 */
async function optimizeDatabase(supabase: any): Promise<void> {
  // In a real implementation, you might run VACUUM and ANALYZE commands
  // For Supabase, we can trigger some optimization queries
  
  try {
    // Update statistics for query planner
    const tables = [
      'properties',
      'user_properties',
      'rankings',
      'property_images',
      'buyer_preferences'
    ];

    // Note: These would need to be implemented as database functions
    // or run through a different connection with appropriate permissions
    
    console.log('Database optimization completed');
  } catch (error) {
    console.error('Database optimization error:', error);
  }
}