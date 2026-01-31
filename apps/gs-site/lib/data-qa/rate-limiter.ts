/**
 * Rate Limiter
 *
 * In-memory sliding window rate limiter for Data Q&A queries.
 * Prevents abuse and manages API costs.
 */

import type { RateLimitResult } from './types';

// ============================================================================
// Configuration
// ============================================================================

const RATE_LIMIT_CONFIG = {
  maxRequests: 10,        // Maximum requests allowed
  windowMs: 60_000,       // Time window in milliseconds (1 minute)
} as const;

// ============================================================================
// In-Memory Store
// ============================================================================

interface RequestRecord {
  timestamps: number[];
}

/**
 * In-memory store for request timestamps.
 * Maps identifier (IP or session) to request history.
 *
 * Note: This resets on server restart. For persistent rate limiting,
 * consider using Redis or Supabase in production.
 */
const requestStore = new Map<string, RequestRecord>();

// ============================================================================
// Rate Limiting Functions
// ============================================================================

/**
 * Check if a request is allowed under the rate limit.
 *
 * @param identifier - Unique identifier for the requester (IP address, session ID, etc.)
 * @returns RateLimitResult with allowed status, remaining requests, and reset time
 */
export function checkRateLimit(identifier: string): RateLimitResult {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_CONFIG.windowMs;

  // Get or create request record
  let record = requestStore.get(identifier);
  if (!record) {
    record = { timestamps: [] };
    requestStore.set(identifier, record);
  }

  // Filter out timestamps outside the current window
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  // Check if limit exceeded
  if (record.timestamps.length >= RATE_LIMIT_CONFIG.maxRequests) {
    // Calculate when the oldest request in window expires
    const oldestInWindow = Math.min(...record.timestamps);
    const resetMs = oldestInWindow + RATE_LIMIT_CONFIG.windowMs - now;

    return {
      allowed: false,
      remaining: 0,
      resetMs: Math.max(0, resetMs),
    };
  }

  // Request is allowed - record it
  record.timestamps.push(now);

  return {
    allowed: true,
    remaining: RATE_LIMIT_CONFIG.maxRequests - record.timestamps.length,
    resetMs: RATE_LIMIT_CONFIG.windowMs,
  };
}

/**
 * Get current rate limit status without consuming a request.
 *
 * @param identifier - Unique identifier for the requester
 * @returns Current remaining requests and reset time
 */
export function getRateLimitStatus(identifier: string): { remaining: number; resetMs: number } {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_CONFIG.windowMs;

  const record = requestStore.get(identifier);
  if (!record) {
    return {
      remaining: RATE_LIMIT_CONFIG.maxRequests,
      resetMs: RATE_LIMIT_CONFIG.windowMs,
    };
  }

  // Count requests in current window
  const recentRequests = record.timestamps.filter((ts) => ts > windowStart);
  const remaining = Math.max(0, RATE_LIMIT_CONFIG.maxRequests - recentRequests.length);

  // Calculate reset time
  let resetMs = RATE_LIMIT_CONFIG.windowMs;
  if (recentRequests.length > 0) {
    const oldestInWindow = Math.min(...recentRequests);
    resetMs = oldestInWindow + RATE_LIMIT_CONFIG.windowMs - now;
  }

  return {
    remaining,
    resetMs: Math.max(0, resetMs),
  };
}

/**
 * Clear rate limit data for an identifier.
 * Useful for testing or admin override.
 *
 * @param identifier - Identifier to clear
 */
export function clearRateLimit(identifier: string): void {
  requestStore.delete(identifier);
}

/**
 * Get the rate limit configuration.
 * Useful for displaying limits to users.
 */
export function getRateLimitConfig(): typeof RATE_LIMIT_CONFIG {
  return RATE_LIMIT_CONFIG;
}

// ============================================================================
// Cleanup
// ============================================================================

/**
 * Cleanup old entries to prevent memory leaks.
 * Should be called periodically (e.g., every 5 minutes).
 */
export function cleanupOldEntries(): void {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_CONFIG.windowMs;

  for (const [identifier, record] of requestStore.entries()) {
    // Remove timestamps outside window
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    // If no recent requests, remove the entry entirely
    if (record.timestamps.length === 0) {
      requestStore.delete(identifier);
    }
  }
}

// Run cleanup every 5 minutes (only in Node.js environment)
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupOldEntries, 5 * 60 * 1000);
}
