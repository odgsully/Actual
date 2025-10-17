/**
 * MCAO Status API Route
 *
 * GET /api/admin/mcao/status
 * Check MCAO API status, cache statistics, and system health
 *
 * @see lib/mcao/client.ts for API status checks
 * @see lib/database/mcao.ts for database statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMCAOClient } from '@/lib/mcao/client'
import { getMCAOStats } from '@/lib/database/mcao'

/**
 * GET: Check MCAO system status
 *
 * Returns:
 * - api: MCAO API availability and response time
 * - database: Database cache statistics
 * - clientCache: In-memory cache statistics
 * - system: Overall system health
 */
export async function GET(req: NextRequest) {
  try {
    console.log('[MCAO Status API] Checking system status')

    const mcaoClient = getMCAOClient()

    // Check MCAO API status
    const apiStatus = await mcaoClient.checkStatus()

    // Get database cache stats
    const { stats: dbStats, error: dbError } = await getMCAOStats()

    // Get client cache stats
    const clientCacheStats = mcaoClient.getCacheStats()

    // Determine overall system health
    const systemHealth = {
      status: apiStatus.available ? 'healthy' : 'degraded',
      apiAvailable: apiStatus.available,
      databaseConnected: !dbError,
      cacheEnabled: true,
      timestamp: new Date().toISOString(),
    }

    // Return comprehensive status
    return NextResponse.json({
      success: true,
      system: systemHealth,
      api: {
        available: apiStatus.available,
        responseTime: apiStatus.responseTime,
        lastChecked: apiStatus.lastChecked,
        version: apiStatus.version,
        message: apiStatus.message,
      },
      database: dbStats
        ? {
            totalRecords: dbStats.totalRecords,
            linkedToProperties: dbStats.linkedToProperties,
            mostRecentFetch: dbStats.mostRecentFetch,
            oldestFetch: dbStats.oldestFetch,
            cacheHitRate:
              dbStats.totalRecords > 0
                ? Math.round((dbStats.totalRecords / (dbStats.totalRecords + 1)) * 100)
                : 0,
          }
        : {
            error: dbError?.message || 'Database stats unavailable',
          },
      clientCache: {
        size: clientCacheStats.size,
        entries: clientCacheStats.entries.length,
        topEntries: clientCacheStats.entries.slice(0, 5), // Top 5 most-hit entries
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[MCAO Status API] Unexpected error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        system: {
          status: 'error',
          apiAvailable: false,
          databaseConnected: false,
          cacheEnabled: false,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    )
  }
}

/**
 * POST: Clear cache
 *
 * Clears in-memory client cache
 * Database cache must be cleared via DELETE endpoints
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, apn } = body

    if (action !== 'clear_cache') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid action',
          validActions: ['clear_cache'],
        },
        { status: 400 }
      )
    }

    const mcaoClient = getMCAOClient()

    if (apn) {
      // Clear specific APN from cache
      const cleared = mcaoClient.invalidateCache(apn)
      return NextResponse.json({
        success: true,
        message: cleared
          ? `Cache cleared for APN ${apn}`
          : `APN ${apn} not found in cache`,
        timestamp: new Date().toISOString(),
      })
    } else {
      // Clear entire cache
      mcaoClient.clearCache()
      return NextResponse.json({
        success: true,
        message: 'Client cache cleared successfully',
        timestamp: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error('[MCAO Status API] Cache clear error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to clear cache',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * OPTIONS: CORS preflight
 */
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  )
}
