/**
 * Jarvis Briefings Client
 *
 * React Query hooks and utilities for fetching Jarvis daily briefings.
 *
 * Data source: jarvis_briefings table in Supabase
 * Schema: { id, date, title, content_json, content_html, content_text, pdf_url, metadata }
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';

// ============================================================
// Types
// ============================================================

export interface JarvisBriefing {
  id: string;
  date: string; // YYYY-MM-DD
  title: string | null;
  content_json: Record<string, any> | null;
  content_html: string | null;
  content_text: string | null;
  pdf_url: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface BriefingsListResponse {
  briefings: JarvisBriefing[];
  total: number;
  hasMore: boolean;
}

// ============================================================
// API Functions
// ============================================================

/**
 * Fetch list of briefings with pagination
 */
async function fetchBriefings(
  limit: number = 10,
  offset: number = 0
): Promise<BriefingsListResponse> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  const response = await fetch(`/api/jarvis?${params.toString()}`);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch briefings: ${error}`);
  }

  return response.json();
}

/**
 * Fetch a single briefing by date
 */
async function fetchBriefingByDate(date: string): Promise<JarvisBriefing> {
  const response = await fetch(`/api/jarvis/${date}`);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch briefing for ${date}: ${error}`);
  }

  return response.json();
}

// ============================================================
// React Query Hooks
// ============================================================

/**
 * Hook to fetch list of briefings
 *
 * @param limit Number of briefings to fetch (default: 10)
 * @param offset Pagination offset (default: 0)
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useJarvisBriefings(20, 0);
 * if (isLoading) return <Loading />;
 * if (error) return <Error error={error} />;
 * return <BriefingsList briefings={data.briefings} />;
 * ```
 */
export function useJarvisBriefings(
  limit: number = 10,
  offset: number = 0
): UseQueryResult<BriefingsListResponse, Error> {
  return useQuery({
    queryKey: ['jarvis', 'briefings', limit, offset],
    queryFn: () => fetchBriefings(limit, offset),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

/**
 * Hook to fetch a single briefing by date
 *
 * @param date Briefing date in YYYY-MM-DD format
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useJarvisBriefing('2025-12-25');
 * if (isLoading) return <Loading />;
 * if (error) return <Error error={error} />;
 * return <BriefingDetail briefing={data} />;
 * ```
 */
export function useJarvisBriefing(
  date: string
): UseQueryResult<JarvisBriefing, Error> {
  return useQuery({
    queryKey: ['jarvis', 'briefing', date],
    queryFn: () => fetchBriefingByDate(date),
    enabled: Boolean(date), // Only fetch if date is provided
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  });
}

/**
 * Hook to fetch the latest briefing
 *
 * Convenience wrapper around useJarvisBriefings that returns just the first briefing
 */
export function useLatestBriefing() {
  const query = useJarvisBriefings(1, 0);

  return {
    data: query.data?.briefings[0] ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isPending: query.isPending,
    isSuccess: query.isSuccess,
    refetch: query.refetch,
  };
}

// ============================================================
// Utility Functions
// ============================================================

/**
 * Format briefing date for display
 */
export function formatBriefingDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Get relative time string (e.g., "2 days ago")
 */
export function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

/**
 * Extract preview text from briefing
 */
export function getBriefingPreview(briefing: JarvisBriefing, maxLength: number = 200): string {
  const text = briefing.content_text || briefing.content_html || '';

  // Strip HTML tags if content_html
  const plainText = text.replace(/<[^>]*>/g, '');

  if (plainText.length <= maxLength) {
    return plainText;
  }

  return plainText.substring(0, maxLength).trim() + '...';
}

export const jarvisClient = {
  fetchBriefings,
  fetchBriefingByDate,
  formatBriefingDate,
  getRelativeTime,
  getBriefingPreview,
};

export default jarvisClient;
