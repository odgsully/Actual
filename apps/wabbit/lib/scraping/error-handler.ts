/**
 * Comprehensive error handling and retry logic for scraping operations
 */

import { ScrapeError, ScrapeErrorType, PropertySource } from './types';

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
}

export interface ErrorMetrics {
  source: PropertySource;
  errorType: ScrapeErrorType;
  count: number;
  lastOccurred: Date;
  urls: string[];
}

export class ErrorHandler {
  private errorMetrics: Map<string, ErrorMetrics>;
  private retryConfigs: Map<ScrapeErrorType, RetryConfig>;
  private blockedUrls: Set<string>;
  private errorLog: ScrapeError[];
  private maxErrorLogSize: number = 1000;

  constructor() {
    this.errorMetrics = new Map();
    this.blockedUrls = new Set();
    this.errorLog = [];

    // Configure retry strategies for different error types
    this.retryConfigs = new Map([
      [ScrapeErrorType.NETWORK_ERROR, {
        maxRetries: 3,
        initialDelay: 5000,
        maxDelay: 60000,
        backoffMultiplier: 2,
        jitter: true
      }],
      [ScrapeErrorType.TIMEOUT, {
        maxRetries: 2,
        initialDelay: 10000,
        maxDelay: 30000,
        backoffMultiplier: 1.5,
        jitter: true
      }],
      [ScrapeErrorType.RATE_LIMIT, {
        maxRetries: 1,
        initialDelay: 60000,
        maxDelay: 300000,
        backoffMultiplier: 1,
        jitter: false
      }],
      [ScrapeErrorType.PARSE_ERROR, {
        maxRetries: 1,
        initialDelay: 2000,
        maxDelay: 5000,
        backoffMultiplier: 1,
        jitter: false
      }],
      [ScrapeErrorType.BLOCKED, {
        maxRetries: 0, // Don't retry blocked requests
        initialDelay: 0,
        maxDelay: 0,
        backoffMultiplier: 1,
        jitter: false
      }],
      [ScrapeErrorType.INVALID_DATA, {
        maxRetries: 1,
        initialDelay: 3000,
        maxDelay: 10000,
        backoffMultiplier: 1,
        jitter: true
      }],
      [ScrapeErrorType.UNKNOWN, {
        maxRetries: 2,
        initialDelay: 5000,
        maxDelay: 20000,
        backoffMultiplier: 2,
        jitter: true
      }]
    ]);
  }

  /**
   * Handle an error and determine if it should be retried
   */
  async handleError(
    error: ScrapeError,
    attemptNumber: number = 1
  ): Promise<{ shouldRetry: boolean; delay: number }> {
    // Log the error
    this.logError(error);

    // Update metrics
    this.updateMetrics(error);

    // Check if URL is blocked
    if (error.url && this.blockedUrls.has(error.url)) {
      return { shouldRetry: false, delay: 0 };
    }

    // Block URL if it's a blocking error
    if (error.type === ScrapeErrorType.BLOCKED && error.url) {
      this.blockedUrls.add(error.url);
      return { shouldRetry: false, delay: 0 };
    }

    // Get retry configuration
    const retryConfig = this.retryConfigs.get(error.type);
    if (!retryConfig) {
      return { shouldRetry: false, delay: 0 };
    }

    // Check if we've exceeded max retries
    if (attemptNumber > retryConfig.maxRetries) {
      return { shouldRetry: false, delay: 0 };
    }

    // Calculate delay with exponential backoff
    let delay = this.calculateDelay(attemptNumber, retryConfig);

    // Override with specific retry time if provided
    if (error.retryAfter) {
      const retryDelay = error.retryAfter.getTime() - Date.now();
      if (retryDelay > 0) {
        delay = Math.min(retryDelay, retryConfig.maxDelay);
      }
    }

    return { shouldRetry: true, delay };
  }

  /**
   * Calculate retry delay with exponential backoff and optional jitter
   */
  private calculateDelay(attemptNumber: number, config: RetryConfig): number {
    // Calculate base delay with exponential backoff
    let delay = config.initialDelay * Math.pow(config.backoffMultiplier, attemptNumber - 1);

    // Apply max delay cap
    delay = Math.min(delay, config.maxDelay);

    // Add jitter if configured (±25% randomization)
    if (config.jitter) {
      const jitterRange = delay * 0.25;
      const jitter = (Math.random() - 0.5) * 2 * jitterRange;
      delay = Math.round(delay + jitter);
    }

    return Math.max(delay, 0);
  }

  /**
   * Log an error
   */
  private logError(error: ScrapeError): void {
    // Add to error log
    this.errorLog.push(error);

    // Trim log if it exceeds max size
    if (this.errorLog.length > this.maxErrorLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxErrorLogSize);
    }

    // Log to console with appropriate level
    const logMessage = `[${error.source}] ${error.type}: ${error.message}`;
    
    switch (error.type) {
      case ScrapeErrorType.BLOCKED:
      case ScrapeErrorType.RATE_LIMIT:
        console.error(logMessage);
        break;
      case ScrapeErrorType.NETWORK_ERROR:
      case ScrapeErrorType.TIMEOUT:
        console.warn(logMessage);
        break;
      default:
        console.log(logMessage);
    }
  }

  /**
   * Update error metrics
   */
  private updateMetrics(error: ScrapeError): void {
    const key = `${error.source}-${error.type}`;
    const existing = this.errorMetrics.get(key);

    if (existing) {
      existing.count++;
      existing.lastOccurred = error.timestamp;
      if (error.url && !existing.urls.includes(error.url)) {
        existing.urls.push(error.url);
        // Keep only last 10 URLs
        if (existing.urls.length > 10) {
          existing.urls = existing.urls.slice(-10);
        }
      }
    } else {
      this.errorMetrics.set(key, {
        source: error.source,
        errorType: error.type,
        count: 1,
        lastOccurred: error.timestamp,
        urls: error.url ? [error.url] : []
      });
    }
  }

  /**
   * Execute a function with retry logic
   */
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    source: PropertySource,
    url?: string,
    maxAttempts: number = 3
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        // Convert to ScrapeError if needed
        const scrapeError: ScrapeError = error instanceof Object && 'type' in error
          ? error as ScrapeError
          : {
              type: ScrapeErrorType.UNKNOWN,
              message: error instanceof Error ? error.message : 'Unknown error',
              source,
              url,
              timestamp: new Date(),
              retryable: true
            };

        // Check if we should retry
        const { shouldRetry, delay } = await this.handleError(scrapeError, attempt);
        
        if (!shouldRetry || attempt === maxAttempts) {
          throw error;
        }

        // Wait before retrying
        if (delay > 0) {
          console.log(`Retrying in ${delay}ms (attempt ${attempt}/${maxAttempts})`);
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error('Max retry attempts reached');
  }

  /**
   * Check if a URL is blocked
   */
  isUrlBlocked(url: string): boolean {
    return this.blockedUrls.has(url);
  }

  /**
   * Unblock a URL
   */
  unblockUrl(url: string): void {
    this.blockedUrls.delete(url);
  }

  /**
   * Clear all blocked URLs
   */
  clearBlockedUrls(): void {
    this.blockedUrls.clear();
  }

  /**
   * Get error metrics
   */
  getMetrics(): ErrorMetrics[] {
    return Array.from(this.errorMetrics.values());
  }

  /**
   * Get error summary for a specific source
   */
  getSourceErrorSummary(source: PropertySource): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    recentErrors: ScrapeError[];
  } {
    const sourceErrors = this.errorLog.filter(e => e.source === source);
    const errorsByType: Record<string, number> = {};
    
    for (const error of sourceErrors) {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
    }

    return {
      totalErrors: sourceErrors.length,
      errorsByType,
      recentErrors: sourceErrors.slice(-10)
    };
  }

  /**
   * Check system health based on error rates
   */
  getSystemHealth(): {
    status: 'healthy' | 'degraded' | 'critical';
    errorRate: number;
    blockedUrlCount: number;
    recommendations: string[];
  } {
    const recentErrors = this.errorLog.filter(
      e => e.timestamp.getTime() > Date.now() - 3600000 // Last hour
    );

    const errorRate = recentErrors.length;
    const blockedUrlCount = this.blockedUrls.size;
    const recommendations: string[] = [];

    let status: 'healthy' | 'degraded' | 'critical' = 'healthy';

    // Determine health status
    if (errorRate > 100 || blockedUrlCount > 50) {
      status = 'critical';
      recommendations.push('High error rate detected. Consider pausing scraping.');
      recommendations.push('Review blocked URLs and error patterns.');
    } else if (errorRate > 50 || blockedUrlCount > 20) {
      status = 'degraded';
      recommendations.push('Elevated error rate. Monitor closely.');
      recommendations.push('Consider reducing scraping rate.');
    }

    // Specific recommendations based on error types
    const rateLimitErrors = recentErrors.filter(
      e => e.type === ScrapeErrorType.RATE_LIMIT
    ).length;
    
    if (rateLimitErrors > 10) {
      recommendations.push('Many rate limit errors. Reduce request frequency.');
    }

    const blockErrors = recentErrors.filter(
      e => e.type === ScrapeErrorType.BLOCKED
    ).length;
    
    if (blockErrors > 5) {
      recommendations.push('Detection/blocking occurring. Rotate user agents or use proxies.');
    }

    return {
      status,
      errorRate,
      blockedUrlCount,
      recommendations
    };
  }

  /**
   * Reset error metrics
   */
  resetMetrics(): void {
    this.errorMetrics.clear();
    this.errorLog = [];
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
let errorHandlerInstance: ErrorHandler | null = null;

export function getErrorHandler(): ErrorHandler {
  if (!errorHandlerInstance) {
    errorHandlerInstance = new ErrorHandler();
  }
  return errorHandlerInstance;
}