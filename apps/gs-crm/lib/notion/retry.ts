/**
 * Retry Logic with Exponential Backoff
 *
 * Notion API has a rate limit of 3 requests per second.
 * This module provides retry functionality with exponential backoff.
 */

import { parseNotionError, NotionError } from './errors'

interface RetryOptions {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
  onRetry?: (attempt: number, error: Error, delayMs: number) => void
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry'>> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
}

/**
 * Execute a function with retry logic and exponential backoff
 *
 * @param fn - The async function to execute
 * @param options - Retry configuration options
 * @returns The result of the function
 * @throws NotionError if all retries fail
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries, baseDelay, maxDelay } = { ...DEFAULT_OPTIONS, ...options }
  const { onRetry } = options

  let lastError: NotionError | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = parseNotionError(error)

      // Don't retry if the error is not retryable
      if (!lastError.retryable) {
        throw lastError
      }

      // Don't retry if we've exhausted all attempts
      if (attempt >= maxRetries) {
        throw lastError
      }

      // Calculate delay with exponential backoff and jitter
      const exponentialDelay = baseDelay * Math.pow(2, attempt)
      const jitter = Math.random() * 200 // Add 0-200ms of jitter
      const delay = Math.min(exponentialDelay + jitter, maxDelay)

      // Call the onRetry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, lastError, delay)
      }

      // Wait before retrying
      await sleep(delay)
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new NotionError('Unknown error', 'UNKNOWN', false)
}

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Create a rate-limited version of a function
 * Ensures at least `minDelay` ms between calls
 */
export function createRateLimitedFn<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  minDelay: number = 350 // ~3 requests per second for Notion
): T {
  let lastCallTime = 0

  return (async (...args: Parameters<T>) => {
    const now = Date.now()
    const timeSinceLastCall = now - lastCallTime

    if (timeSinceLastCall < minDelay) {
      await sleep(minDelay - timeSinceLastCall)
    }

    lastCallTime = Date.now()
    return fn(...args)
  }) as T
}
