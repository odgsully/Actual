'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  WhoopInsights,
  WhoopRecovery,
  WhoopCycle,
} from '@/lib/whoop/client';

// ============================================================
// Types
// ============================================================

export interface WhoopInsightsResponse extends WhoopInsights {
  error?: string;
  connectUrl?: string;
}

export interface WhoopHistoricalResponse {
  days: number;
  chartData: WhoopChartDataPoint[];
  raw: {
    recoveries: WhoopRecovery[];
    cycles: WhoopCycle[];
  };
  lastUpdated: string;
}

export interface WhoopChartDataPoint {
  date: string;
  recovery: number;
  hrv: number | null;
  rhr: number | null;
  strain: number | null;
}

interface UseWhoopOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

// ============================================================
// Fetchers
// ============================================================

async function fetchWhoopInsights(): Promise<WhoopInsightsResponse> {
  const response = await fetch('/api/whoop/insights');

  if (response.status === 401) {
    const data = await response.json();
    return {
      recovery: null,
      cycle: null,
      connected: false,
      lastUpdated: new Date().toISOString(),
      error: data.error,
      connectUrl: data.connectUrl,
    };
  }

  if (!response.ok) {
    throw new Error('Failed to fetch WHOOP insights');
  }

  return response.json();
}

async function fetchWhoopHistorical(days: number): Promise<WhoopHistoricalResponse> {
  const response = await fetch(`/api/whoop/historical?days=${days}`);

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('WHOOP not connected');
    }
    throw new Error('Failed to fetch WHOOP historical data');
  }

  return response.json();
}

// ============================================================
// Hooks
// ============================================================

/**
 * React Query hook for fetching latest WHOOP insights (recovery + strain)
 *
 * @param options - Configuration options
 * @param options.enabled - Whether the query should run (default: true)
 * @param options.refetchInterval - Refetch interval in ms (default: 15 minutes)
 *
 * @returns Query result with WHOOP insights
 */
export function useWhoopInsights(options: UseWhoopOptions = {}) {
  const { enabled = true, refetchInterval = false } = options;

  return useQuery({
    queryKey: ['whoopInsights'],
    queryFn: fetchWhoopInsights,
    enabled,
    refetchInterval,
    // WHOOP data is low-frequency (recovery calculated once/day, strain accumulates slowly)
    // Long cache prevents rate limiting - WHOOP has strict API limits
    staleTime: 6 * 60 * 60 * 1000, // Consider data fresh for 6 hours
    gcTime: 12 * 60 * 60 * 1000, // Keep in cache for 12 hours
    retry: 1, // Only retry once for auth failures
    refetchOnWindowFocus: false, // Disable to prevent rate limiting
  });
}

/**
 * React Query hook for fetching WHOOP historical data for charts
 *
 * @param days - Number of days of data (7, 14, or 30)
 * @param options - Configuration options
 *
 * @returns Query result with historical WHOOP data
 */
export function useWhoopHistorical(days: 7 | 14 | 30 = 7, options: UseWhoopOptions = {}) {
  const { enabled = true, refetchInterval = false } = options;

  return useQuery({
    queryKey: ['whoopHistorical', days],
    queryFn: () => fetchWhoopHistorical(days),
    enabled,
    refetchInterval,
    // Historical data changes very slowly - long cache prevents rate limiting
    staleTime: 12 * 60 * 60 * 1000, // Consider data fresh for 12 hours
    gcTime: 24 * 60 * 60 * 1000, // Keep in cache for 24 hours
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to check if WHOOP is connected
 */
export function useWhoopConnection() {
  const { data, isLoading, error } = useWhoopInsights({
    refetchInterval: 0, // Don't auto-refetch for connection check
  });

  return {
    isConnected: data?.connected ?? false,
    isLoading,
    error,
    connectUrl: data?.connectUrl,
  };
}

/**
 * Hook to handle OAuth callback and invalidate cache
 *
 * This hook detects when the user returns from WHOOP OAuth with
 * `whoop_connected=true` in the URL, invalidates the React Query cache,
 * and cleans up the URL parameter.
 */
export function useWhoopOAuthCallback() {
  const queryClient = useQueryClient();
  const [justConnected, setJustConnected] = useState(false);

  useEffect(() => {
    // Check if we just returned from WHOOP OAuth
    const params = new URLSearchParams(window.location.search);
    const whoopConnected = params.get('whoop_connected');

    if (whoopConnected === 'true') {
      console.log('[WHOOP] OAuth callback detected, invalidating cache...');
      setJustConnected(true);

      // Invalidate all WHOOP-related queries to force refetch
      queryClient.invalidateQueries({ queryKey: ['whoopInsights'] });
      queryClient.invalidateQueries({ queryKey: ['whoopHistorical'] });

      // Clean up URL parameters (remove whoop_connected and whoop_user_id)
      params.delete('whoop_connected');
      params.delete('whoop_user_id');

      const newUrl = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;

      window.history.replaceState({}, '', newUrl);
      console.log('[WHOOP] Cache invalidated, URL cleaned up');
    }
  }, [queryClient]);

  return { justConnected };
}

/**
 * Hook to initiate WHOOP OAuth connection
 */
export function useConnectWhoop() {
  const [isConnecting, setIsConnecting] = useState(false);

  const connect = (returnUrl?: string) => {
    setIsConnecting(true);
    const url = new URL('/api/auth/whoop', window.location.origin);
    if (returnUrl) {
      url.searchParams.set('returnUrl', returnUrl);
    }
    window.location.href = url.toString();
  };

  return { connect, isConnecting };
}

/**
 * Hook to get formatted WHOOP metrics for display
 */
export function useWhoopMetrics() {
  const { data, isLoading, error, refetch } = useWhoopInsights();

  const recovery = data?.recovery;
  const cycle = data?.cycle;

  // Recovery color coding
  const getRecoveryColor = (score: number): 'green' | 'yellow' | 'red' => {
    if (score >= 67) return 'green';
    if (score >= 34) return 'yellow';
    return 'red';
  };

  // Strain color coding (0-21 scale)
  const getStrainColor = (strain: number): 'green' | 'yellow' | 'red' => {
    if (strain <= 10) return 'green';
    if (strain <= 15) return 'yellow';
    return 'red';
  };

  return {
    isLoading,
    error,
    isConnected: data?.connected ?? false,
    lastUpdated: data?.lastUpdated,
    refetch,

    // Recovery metrics (V2 API structure)
    recoveryScore: recovery?.score?.recovery_score ?? null,
    recoveryColor: recovery?.score?.recovery_score ? getRecoveryColor(recovery.score.recovery_score) : null,
    hrv: recovery?.score?.hrv_rmssd_milli ?? null,
    rhr: recovery?.score?.resting_heart_rate ?? null,
    spo2: recovery?.score?.spo2_percentage ?? null,
    skinTemp: recovery?.score?.skin_temp_celsius ?? null,
    isCalibrating: recovery?.score?.user_calibrating ?? false,

    // Strain metrics
    strain: cycle?.score?.strain ?? null,
    strainColor: cycle?.score?.strain ? getStrainColor(cycle.score.strain) : null,
    dayStrain: cycle?.score?.day_strain ?? null,
    workoutStrain: cycle?.score?.workout_strain ?? null,
    kilojoules: cycle?.score?.kilojoules ?? null,
    avgHr: cycle?.score?.average_heart_rate ?? null,
    maxHr: cycle?.score?.max_heart_rate ?? null,
  };
}

export default useWhoopInsights;
