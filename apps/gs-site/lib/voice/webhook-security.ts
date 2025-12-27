/**
 * Webhook Security
 * Signature verification and security utilities for voice webhooks
 */

import crypto from 'crypto';

// ============================================================================
// SIGNATURE VERIFICATION
// ============================================================================

/**
 * Verify Retell webhook signature
 * Retell signs webhooks with HMAC-SHA256
 *
 * @param payload - Raw request body as string
 * @param signature - X-Retell-Signature header value
 * @param secret - RETELL_WEBHOOK_SECRET from env
 * @returns true if signature is valid
 */
export function verifyRetellSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!payload || !signature || !secret) {
    console.error('[Webhook Security] Missing payload, signature, or secret');
    return false;
  }

  try {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  } catch (error) {
    console.error('[Webhook Security] Signature verification failed:', error);
    return false;
  }
}

// ============================================================================
// IDEMPOTENCY
// ============================================================================

/**
 * Generate idempotency key for webhook deduplication
 * Combines external call ID with event type
 */
export function generateIdempotencyKey(
  externalCallId: string,
  eventType: string
): string {
  return `${externalCallId}:${eventType}`;
}

// ============================================================================
// RATE LIMITING
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

/**
 * Simple in-memory rate limiter for webhook endpoints
 * In production, use Redis for distributed rate limiting
 *
 * @param key - Rate limit key (e.g., IP address)
 * @param limit - Max requests per window
 * @param windowMs - Window duration in milliseconds
 * @returns true if request is allowed
 */
export function checkRateLimit(
  key: string,
  limit: number = 100,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count++;
  return true;
}

// ============================================================================
// PAYLOAD SANITIZATION
// ============================================================================

/**
 * Sanitize webhook payload by removing sensitive fields
 * Use before logging or storing
 */
export function sanitizePayload(payload: Record<string, unknown>): Record<string, unknown> {
  const sensitiveFields = [
    'api_key',
    'apiKey',
    'secret',
    'password',
    'token',
    'authorization',
  ];

  const sanitized = { ...payload };

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

// ============================================================================
// WEBHOOK VALIDATION
// ============================================================================

export interface WebhookValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate webhook request
 * Checks signature, content type, and basic structure
 */
export function validateWebhookRequest(
  payload: string,
  signature: string | null,
  contentType: string | null,
  secret: string
): WebhookValidationResult {
  // Check content type
  if (!contentType?.includes('application/json')) {
    return { valid: false, error: 'Invalid content type' };
  }

  // Check signature presence
  if (!signature) {
    return { valid: false, error: 'Missing signature header' };
  }

  // Verify signature
  if (!verifyRetellSignature(payload, signature, secret)) {
    return { valid: false, error: 'Invalid signature' };
  }

  // Parse and check payload structure
  try {
    const data = JSON.parse(payload);
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'Invalid payload structure' };
    }
  } catch {
    return { valid: false, error: 'Invalid JSON' };
  }

  return { valid: true };
}

// ============================================================================
// LOGGING
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Log webhook event with consistent format
 */
export function logWebhookEvent(
  level: LogLevel,
  event: string,
  data?: Record<string, unknown>
): void {
  const timestamp = new Date().toISOString();
  const prefix = `[Voice Webhook] [${timestamp}]`;

  const sanitizedData = data ? sanitizePayload(data) : undefined;

  switch (level) {
    case 'debug':
      console.debug(prefix, event, sanitizedData);
      break;
    case 'info':
      console.info(prefix, event, sanitizedData);
      break;
    case 'warn':
      console.warn(prefix, event, sanitizedData);
      break;
    case 'error':
      console.error(prefix, event, sanitizedData);
      break;
  }
}
