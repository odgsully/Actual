/**
 * Rate Limiting Utility for API Routes
 *
 * This provides basic rate limiting for serverless environments.
 * Note: In-memory rate limiting has limitations in serverless (each instance has its own cache).
 * For production scale, consider upgrading to Upstash Redis.
 *
 * Usage:
 *   import { rateLimit, RateLimitConfig } from '@/lib/rate-limit'
 *
 *   const limiter = rateLimit({ limit: 10, window: 60 }) // 10 requests per 60 seconds
 *
 *   export async function POST(request: NextRequest) {
 *     const rateLimitResult = await limiter.check(request)
 *     if (!rateLimitResult.success) {
 *       return rateLimitResult.response
 *     }
 *     // ... rest of handler
 *   }
 */

import { NextRequest, NextResponse } from 'next/server'

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number
  /** Time window in seconds */
  window: number
  /** Optional: Custom identifier function (defaults to IP) */
  identifier?: (request: NextRequest) => string
  /** Optional: Custom error message */
  message?: string
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
  response?: NextResponse
}

// In-memory store with automatic cleanup
// Note: This is per-instance in serverless, but still provides protection
class RateLimitStore {
  private store = new Map<string, RateLimitEntry>()
  private cleanupInterval: NodeJS.Timeout | null = null
  private readonly maxEntries = 10000 // Prevent memory leaks

  constructor() {
    // Cleanup expired entries every 60 seconds
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), 60000)
    }
  }

  get(key: string): RateLimitEntry | undefined {
    return this.store.get(key)
  }

  set(key: string, entry: RateLimitEntry): void {
    // Evict oldest entries if we hit the limit
    if (this.store.size >= this.maxEntries) {
      const oldestKey = this.store.keys().next().value
      if (oldestKey) this.store.delete(oldestKey)
    }
    this.store.set(key, entry)
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime < now) {
        this.store.delete(key)
      }
    }
  }
}

// Singleton store
const store = new RateLimitStore()

/**
 * Get client identifier from request
 * Uses X-Forwarded-For header (Vercel), falling back to X-Real-IP, then a default
 */
function getClientIdentifier(request: NextRequest): string {
  // Vercel provides the real IP in x-forwarded-for
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // x-forwarded-for can be a comma-separated list; take the first one
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback for local development
  return 'anonymous'
}

/**
 * Create a rate limiter with the specified configuration
 */
export function rateLimit(config: RateLimitConfig) {
  const {
    limit,
    window,
    identifier = getClientIdentifier,
    message = 'Too many requests. Please try again later.',
  } = config

  return {
    /**
     * Check if the request should be rate limited
     * Returns { success: true } if allowed, or { success: false, response } if limited
     */
    async check(request: NextRequest): Promise<RateLimitResult> {
      const id = identifier(request)
      const key = `${request.nextUrl.pathname}:${id}`
      const now = Date.now()
      const windowMs = window * 1000

      let entry = store.get(key)

      // If no entry or window expired, create new entry
      if (!entry || entry.resetTime < now) {
        entry = {
          count: 1,
          resetTime: now + windowMs,
        }
        store.set(key, entry)

        return {
          success: true,
          limit,
          remaining: limit - 1,
          reset: entry.resetTime,
        }
      }

      // Increment count
      entry.count++
      store.set(key, entry)

      // Check if over limit
      if (entry.count > limit) {
        const retryAfter = Math.ceil((entry.resetTime - now) / 1000)

        const response = NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message,
            retryAfter,
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': entry.resetTime.toString(),
              'Retry-After': retryAfter.toString(),
            },
          }
        )

        return {
          success: false,
          limit,
          remaining: 0,
          reset: entry.resetTime,
          response,
        }
      }

      return {
        success: true,
        limit,
        remaining: limit - entry.count,
        reset: entry.resetTime,
      }
    },
  }
}

/**
 * Pre-configured rate limiters for common use cases
 */
export const rateLimiters = {
  /** Standard API: 60 requests per minute */
  standard: rateLimit({ limit: 60, window: 60 }),

  /** Auth endpoints: 10 requests per minute (prevent brute force) */
  auth: rateLimit({
    limit: 10,
    window: 60,
    message: 'Too many authentication attempts. Please wait before trying again.',
  }),

  /** Expensive operations (PDF, Excel, scraping): 5 per minute */
  expensive: rateLimit({
    limit: 5,
    window: 60,
    message: 'This operation is resource-intensive. Please wait before trying again.',
  }),

  /** Admin operations: 30 per minute */
  admin: rateLimit({ limit: 30, window: 60 }),

  /** Public/unauthenticated: 20 per minute */
  public: rateLimit({ limit: 20, window: 60 }),

  /** Scraping endpoints: 10 per hour */
  scraping: rateLimit({
    limit: 10,
    window: 3600,
    message: 'Scraping quota exceeded. Please try again later.',
  }),
}

/**
 * Helper to add rate limit headers to a successful response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  response.headers.set('X-RateLimit-Limit', result.limit.toString())
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
  response.headers.set('X-RateLimit-Reset', result.reset.toString())
  return response
}
