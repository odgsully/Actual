'use client';

import { useQuery } from '@tanstack/react-query';

export interface GmailStats {
  connected: boolean;
  email?: string;
  stats?: {
    sentToday: number;
    sentThisWeek: number;
    sentThisMonth: number;
    lastSentAt: string | null;
  };
  error?: string;
}

interface UseGmailStatsOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

async function fetchGmailStats(): Promise<GmailStats> {
  const response = await fetch('/api/google/emails/sent');

  if (!response.ok) {
    throw new Error('Failed to fetch Gmail statistics');
  }

  return response.json();
}

/**
 * React Query hook for fetching Gmail sent email statistics
 *
 * @param options - Configuration options
 * @param options.enabled - Whether the query should run (default: true)
 * @param options.refetchInterval - Refetch interval in milliseconds (default: 5 minutes)
 *
 * @returns Query result with Gmail statistics
 */
export function useGmailStats(options: UseGmailStatsOptions = {}) {
  const { enabled = true, refetchInterval = 5 * 60 * 1000 } = options;

  return useQuery({
    queryKey: ['gmailStats'],
    queryFn: fetchGmailStats,
    enabled,
    refetchInterval,
    staleTime: 60 * 1000, // Consider data stale after 1 minute
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 1, // Only retry once for auth failures
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to initiate Gmail OAuth connection
 */
export function useConnectGmail() {
  const connect = (returnUrl?: string) => {
    const url = new URL('/api/auth/google', window.location.origin);
    if (returnUrl) {
      url.searchParams.set('returnUrl', returnUrl);
    }
    window.location.href = url.toString();
  };

  return { connect };
}

export default useGmailStats;
