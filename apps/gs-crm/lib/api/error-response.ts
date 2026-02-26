/**
 * Standardized API Error Response Utility
 *
 * Provides a consistent error envelope for all API routes.
 * Phase -1: Contract hardening for the MLS upload patch plan.
 */

import { NextResponse } from 'next/server'

export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: string
  }
}

export interface ApiSuccessResponse<T = unknown> {
  success: true
  data: T
}

type HttpStatus = 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500 | 503

const ERROR_CODES = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'UNPROCESSABLE_ENTITY',
  429: 'RATE_LIMITED',
  500: 'INTERNAL_ERROR',
  503: 'SERVICE_UNAVAILABLE',
} as const

/**
 * Create a standardized error response.
 *
 * @example
 * return apiError(400, 'Missing required field: clientId')
 * return apiError(500, 'Failed to generate report', error.message)
 */
export function apiError(
  status: HttpStatus,
  message: string,
  details?: string
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false as const,
      error: {
        code: ERROR_CODES[status],
        message,
        ...(details ? { details } : {}),
      },
    },
    { status }
  )
}

/**
 * Create a standardized success response.
 *
 * @example
 * return apiSuccess({ properties: [...], count: 42 })
 */
export function apiSuccess<T>(data: T, status: number = 200): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true as const,
      data,
    },
    { status }
  )
}
