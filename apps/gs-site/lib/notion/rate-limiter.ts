/**
 * Notion API Rate Limiter
 *
 * Notion API allows 3 requests/second. This module provides a queue-based
 * rate limiter with exponential backoff on 429 errors.
 */

interface QueuedRequest {
  execute: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  retries: number;
}

const MAX_REQUESTS_PER_SECOND = 3;
const MIN_REQUEST_INTERVAL_MS = Math.ceil(1000 / MAX_REQUESTS_PER_SECOND); // ~334ms
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

class NotionRateLimiter {
  private queue: QueuedRequest[] = [];
  private processing = false;
  private lastRequestTime = 0;

  /**
   * Add a request to the queue
   */
  async enqueue<T>(execute: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        execute,
        resolve,
        reject,
        retries: 0,
      });

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  /**
   * Process queued requests with rate limiting
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const request = this.queue.shift()!;

      // Ensure minimum interval between requests
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < MIN_REQUEST_INTERVAL_MS) {
        await this.sleep(MIN_REQUEST_INTERVAL_MS - timeSinceLastRequest);
      }

      try {
        this.lastRequestTime = Date.now();
        const result = await request.execute();
        request.resolve(result);
      } catch (error: any) {
        // Handle rate limit errors with exponential backoff
        if (error?.message?.includes('429') && request.retries < MAX_RETRIES) {
          const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, request.retries);
          console.warn(
            `Notion rate limit hit, retrying in ${backoffMs}ms (attempt ${request.retries + 1}/${MAX_RETRIES})`
          );

          await this.sleep(backoffMs);

          // Re-queue with incremented retry count
          this.queue.unshift({
            ...request,
            retries: request.retries + 1,
          });
        } else {
          request.reject(error);
        }
      }
    }

    this.processing = false;
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get current queue length (for monitoring)
   */
  getQueueLength(): number {
    return this.queue.length;
  }

  /**
   * Clear the queue (for cleanup)
   */
  clearQueue(): void {
    const pending = this.queue.splice(0);
    pending.forEach((req) =>
      req.reject(new Error('Queue cleared'))
    );
  }
}

// Singleton instance
export const notionRateLimiter = new NotionRateLimiter();

/**
 * Wrap a Notion API call with rate limiting
 *
 * @example
 * ```ts
 * const result = await rateLimitedFetch(() =>
 *   notionClient.databases.query({ database_id: '...' })
 * );
 * ```
 */
export async function rateLimitedFetch<T>(
  fetchFn: () => Promise<T>
): Promise<T> {
  return notionRateLimiter.enqueue(fetchFn);
}

/**
 * Batch multiple Notion requests with rate limiting
 */
export async function batchRateLimitedFetch<T>(
  fetchFns: Array<() => Promise<T>>
): Promise<T[]> {
  return Promise.all(fetchFns.map((fn) => rateLimitedFetch(fn)));
}
