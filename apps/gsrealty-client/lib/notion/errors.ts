/**
 * Notion API Error Handling
 *
 * Provides typed errors and parsing for Notion API responses
 */

export type NotionErrorCode =
  | 'RATE_LIMITED'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'VALIDATION'
  | 'NETWORK'
  | 'UNKNOWN'

export class NotionError extends Error {
  constructor(
    message: string,
    public code: NotionErrorCode,
    public retryable: boolean = false,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'NotionError'
  }
}

/**
 * Parse an unknown error into a typed NotionError
 */
export function parseNotionError(error: unknown): NotionError {
  if (error instanceof NotionError) {
    return error
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase()

    // Rate limiting
    if (message.includes('rate limit') || message.includes('429')) {
      return new NotionError(
        'Rate limited by Notion API. Please wait a moment.',
        'RATE_LIMITED',
        true,
        429
      )
    }

    // Not found
    if (message.includes('not found') || message.includes('404') || message.includes('could not find')) {
      return new NotionError(
        'The requested resource was not found in Notion.',
        'NOT_FOUND',
        false,
        404
      )
    }

    // Unauthorized
    if (message.includes('unauthorized') || message.includes('401') || message.includes('invalid token')) {
      return new NotionError(
        'Notion API key is invalid or missing permissions.',
        'UNAUTHORIZED',
        false,
        401
      )
    }

    // Validation errors
    if (message.includes('validation') || message.includes('400') || message.includes('invalid')) {
      return new NotionError(
        'Invalid data sent to Notion API.',
        'VALIDATION',
        false,
        400
      )
    }

    // Network errors
    if (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('econnrefused') ||
      message.includes('timeout')
    ) {
      return new NotionError(
        'Network error connecting to Notion.',
        'NETWORK',
        true
      )
    }

    // Pass through the original message for unknown errors
    return new NotionError(
      error.message || 'An unknown error occurred',
      'UNKNOWN',
      false
    )
  }

  return new NotionError(
    'An unknown error occurred',
    'UNKNOWN',
    false
  )
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  const notionError = parseNotionError(error)
  return notionError.retryable
}
