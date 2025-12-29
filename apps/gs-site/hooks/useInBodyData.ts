'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  InBodyInsights,
  InBodyHistoricalData,
  InBodyScore,
} from '@/lib/inbody/client';

// ============================================================
// Types
// ============================================================

export interface InBodyInsightsResponse extends InBodyInsights {
  error?: string;
  setupUrl?: string;
  isMock?: boolean;
}

export interface InBodyHistoricalResponse extends InBodyHistoricalData {
  error?: string;
  isMock?: boolean;
}

export interface ManualInBodyScan {
  id: string;
  scanDate: string;
  weightKg: number;
  bodyFatPercent: number;
  muscleMassKg: number;
  bodyFatMassKg?: number;
  bmi?: number;
  bmr?: number;
  visceralFatLevel?: number;
  inbodyScore?: number;
  totalBodyWaterL?: number;
  locationName?: string;
  notes?: string;
  source: string;
  notionPageId?: string;
  createdAt: string;
}

export interface ManualInBodyResponse {
  scans: ManualInBodyScan[];
  count: number;
  trends: {
    weightChange: number;
    fatChange: number;
    muscleChange: number;
    periodDays: number;
  } | null;
}

interface UseInBodyOptions {
  enabled?: boolean;
  useMock?: boolean;
}

// ============================================================
// Fetchers
// ============================================================

/**
 * Fetch manual InBody entries from Supabase
 */
async function fetchManualScans(limit: number = 20): Promise<ManualInBodyResponse> {
  const response = await fetch(`/api/inbody/manual?limit=${limit}`);

  if (!response.ok) {
    throw new Error('Failed to fetch manual scans');
  }

  return response.json();
}

async function fetchInBodyLatest(useMock: boolean = false): Promise<InBodyInsightsResponse> {
  const url = useMock ? '/api/inbody/latest?mock=true' : '/api/inbody/latest';
  const response = await fetch(url);

  if (response.status === 401 || response.status === 503) {
    const data = await response.json();
    return {
      latestScan: null,
      connected: false,
      lastUpdated: new Date().toISOString(),
      daysSinceLastScan: null,
      error: data.error,
      setupUrl: data.setupUrl,
    };
  }

  if (!response.ok) {
    throw new Error('Failed to fetch InBody data');
  }

  return response.json();
}

async function fetchInBodyHistory(
  limit: number = 10,
  useMock: boolean = false
): Promise<InBodyHistoricalResponse> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (useMock) params.set('mock', 'true');

  const response = await fetch(`/api/inbody/history?${params.toString()}`);

  if (!response.ok) {
    if (response.status === 401 || response.status === 503) {
      throw new Error('InBody not connected');
    }
    throw new Error('Failed to fetch InBody history');
  }

  return response.json();
}

// ============================================================
// Hooks
// ============================================================

/**
 * React Query hook for fetching latest InBody scan data
 *
 * InBody data is VERY low frequency (weekly gym scans), so we use aggressive caching:
 * - 24 hour staleTime (data considered fresh)
 * - 7 day gcTime (keep in memory)
 * - No automatic refetching
 *
 * @param options.enabled - Whether the query should run (default: true)
 * @param options.useMock - Use mock data for testing (default: false)
 */
export function useInBodyLatest(options: UseInBodyOptions = {}) {
  const { enabled = true, useMock = false } = options;

  return useQuery({
    queryKey: ['inbodyLatest', { useMock }],
    queryFn: () => fetchInBodyLatest(useMock),
    enabled,
    // InBody data is very low-frequency (weekly scans at gym)
    // Aggressive caching prevents unnecessary API calls
    staleTime: 24 * 60 * 60 * 1000,        // 24 hours - data considered fresh
    gcTime: 7 * 24 * 60 * 60 * 1000,       // 7 days - keep in memory
    retry: 1,                               // Only retry once for auth failures
    refetchOnWindowFocus: false,            // No refetch on tab focus
    refetchInterval: false,                 // No automatic refetching
  });
}

/**
 * React Query hook for fetching InBody historical data for charts
 *
 * @param limit - Number of scans to fetch (default: 10)
 * @param options.enabled - Whether the query should run
 * @param options.useMock - Use mock data for testing
 */
export function useInBodyHistory(limit: number = 10, options: UseInBodyOptions = {}) {
  const { enabled = true, useMock = false } = options;

  return useQuery({
    queryKey: ['inbodyHistory', { limit, useMock }],
    queryFn: () => fetchInBodyHistory(limit, useMock),
    enabled,
    // Historical data is even more stable
    staleTime: 24 * 60 * 60 * 1000,        // 24 hours
    gcTime: 7 * 24 * 60 * 60 * 1000,       // 7 days
    retry: 1,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });
}

/**
 * Hook to check if InBody is connected
 */
export function useInBodyConnection() {
  const { data, isLoading, error } = useInBodyLatest();

  return {
    isConnected: data?.connected ?? false,
    isLoading,
    error,
    setupUrl: data?.setupUrl,
  };
}

/**
 * Hook to get formatted InBody metrics for display
 */
export function useInBodyMetrics(options: UseInBodyOptions = {}) {
  const { data, isLoading, error, refetch } = useInBodyLatest(options);

  const scan = data?.latestScan;
  const score = scan?.score;

  // Body fat color coding
  // Men: <15% = green, 15-25% = yellow, >25% = red
  // Women: <20% = green, 20-30% = yellow, >30% = red
  // Using neutral thresholds
  const getBodyFatColor = (percent: number): 'green' | 'yellow' | 'red' => {
    if (percent < 20) return 'green';
    if (percent < 25) return 'yellow';
    return 'red';
  };

  // BMI color coding
  const getBMIColor = (bmi: number): 'green' | 'yellow' | 'red' => {
    if (bmi >= 18.5 && bmi < 25) return 'green';
    if (bmi >= 25 && bmi < 30) return 'yellow';
    return 'red';
  };

  // Muscle mass trend indicator
  const getMuscleStatus = (smm: number): 'good' | 'average' | 'low' => {
    // Simplified threshold (would need height/gender for accurate assessment)
    if (smm > 35) return 'good';
    if (smm > 28) return 'average';
    return 'low';
  };

  return {
    isLoading,
    error,
    isConnected: data?.connected ?? false,
    isMock: data?.isMock ?? false,
    lastUpdated: data?.lastUpdated,
    daysSinceLastScan: data?.daysSinceLastScan,
    refetch,

    // Core metrics
    weight: score?.weight ?? null,
    bodyFatPercent: score?.bodyFatPercent ?? null,
    bodyFatColor: score?.bodyFatPercent ? getBodyFatColor(score.bodyFatPercent) : null,
    skeletalMuscleMass: score?.skeletalMuscleMass ?? null,
    muscleStatus: score?.skeletalMuscleMass ? getMuscleStatus(score.skeletalMuscleMass) : null,
    bodyFatMass: score?.bodyFatMass ?? null,

    // Derived metrics
    bmi: score?.bmi ?? null,
    bmiColor: score?.bmi ? getBMIColor(score.bmi) : null,
    bmr: score?.bmr ?? null,

    // Water analysis
    totalBodyWater: score?.totalBodyWater ?? null,

    // Additional metrics
    visceralFatLevel: score?.visceralFatLevel ?? null,
    inbodyScore: score?.inbodyScore ?? null,

    // Segmental data
    hasSegmental: Boolean(score?.segmental),
    segmental: score?.segmental ?? null,

    // Scan info
    scanDate: scan?.scanDate ?? null,
    locationName: scan?.locationName ?? null,
  };
}

/**
 * Hook for historical data with trend analysis
 */
export function useInBodyTrends(options: UseInBodyOptions = {}) {
  const { data, isLoading, error } = useInBodyHistory(10, options);

  const getTrendIcon = (value: number | null): 'up' | 'down' | 'neutral' => {
    if (value === null || Math.abs(value) < 0.1) return 'neutral';
    return value > 0 ? 'up' : 'down';
  };

  return {
    isLoading,
    error,
    scans: data?.scans ?? [],
    isMock: data?.isMock ?? false,

    // Trend data
    weightTrend: data?.trends.weightChange ?? null,
    weightTrendIcon: getTrendIcon(data?.trends.weightChange ?? null),

    fatTrend: data?.trends.fatChange ?? null,
    fatTrendIcon: getTrendIcon(data?.trends.fatChange ?? null),
    // For fat, down is good
    fatTrendColor: data?.trends.fatChange
      ? data.trends.fatChange < 0
        ? 'green'
        : 'red'
      : null,

    muscleTrend: data?.trends.muscleChange ?? null,
    muscleTrendIcon: getTrendIcon(data?.trends.muscleChange ?? null),
    // For muscle, up is good
    muscleTrendColor: data?.trends.muscleChange
      ? data.trends.muscleChange > 0
        ? 'green'
        : 'red'
      : null,

    // Chart data
    chartData: data?.scans.map((scan) => ({
      date: scan.scanDate,
      weight: scan.score.weight,
      bodyFat: scan.score.bodyFatPercent,
      muscle: scan.score.skeletalMuscleMass,
    })) ?? [],
  };
}

// ============================================================
// Manual Entry Hooks (Primary data source for InBody)
// ============================================================

/**
 * React Query hook for fetching manual InBody scan entries
 *
 * This is the PRIMARY data source for InBody since we're using
 * manual entry rather than API integration.
 */
export function useManualInBodyScans(limit: number = 20) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['inbodyManual', { limit }],
    queryFn: () => fetchManualScans(limit),
    staleTime: 5 * 60 * 1000,        // 5 minutes
    gcTime: 60 * 60 * 1000,          // 1 hour
    refetchOnWindowFocus: false,
  });

  // Helper to invalidate and refetch after adding new scan
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['inbodyManual'] });
  };

  return {
    ...query,
    invalidate,
  };
}

/**
 * Hook to get formatted metrics from manual InBody entries
 *
 * This is the main hook used by InBodyTile for display.
 */
export function useManualInBodyMetrics() {
  const { data, isLoading, error, refetch, invalidate } = useManualInBodyScans(10);

  const latestScan = data?.scans?.[0];
  const hasScan = Boolean(latestScan);

  // Calculate days since last scan
  const daysSinceLastScan = latestScan
    ? Math.floor(
        (new Date().getTime() - new Date(latestScan.scanDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  // Body fat color coding
  const getBodyFatColor = (percent: number): 'green' | 'yellow' | 'red' => {
    if (percent < 20) return 'green';
    if (percent < 25) return 'yellow';
    return 'red';
  };

  // BMI color coding
  const getBMIColor = (bmi: number): 'green' | 'yellow' | 'red' => {
    if (bmi >= 18.5 && bmi < 25) return 'green';
    if (bmi >= 25 && bmi < 30) return 'yellow';
    return 'red';
  };

  // Trend calculations
  const getTrendIcon = (value: number | null): 'up' | 'down' | 'neutral' => {
    if (value === null || Math.abs(value) < 0.1) return 'neutral';
    return value > 0 ? 'up' : 'down';
  };

  return {
    isLoading,
    error,
    hasScan,
    scanCount: data?.count ?? 0,
    daysSinceLastScan,
    refetch,
    invalidate,

    // Latest scan metrics
    weightKg: latestScan?.weightKg ?? null,
    bodyFatPercent: latestScan?.bodyFatPercent ?? null,
    bodyFatColor: latestScan?.bodyFatPercent
      ? getBodyFatColor(latestScan.bodyFatPercent)
      : null,
    muscleMassKg: latestScan?.muscleMassKg ?? null,
    bodyFatMassKg: latestScan?.bodyFatMassKg ?? null,
    bmi: latestScan?.bmi ?? null,
    bmiColor: latestScan?.bmi ? getBMIColor(latestScan.bmi) : null,
    bmr: latestScan?.bmr ?? null,
    visceralFatLevel: latestScan?.visceralFatLevel ?? null,
    inbodyScore: latestScan?.inbodyScore ?? null,
    totalBodyWaterL: latestScan?.totalBodyWaterL ?? null,
    locationName: latestScan?.locationName ?? null,
    scanDate: latestScan?.scanDate ?? null,

    // Trend data
    trends: data?.trends,
    fatTrendIcon: getTrendIcon(data?.trends?.fatChange ?? null),
    muscleTrendIcon: getTrendIcon(data?.trends?.muscleChange ?? null),
    weightTrendIcon: getTrendIcon(data?.trends?.weightChange ?? null),

    // All scans for charts
    allScans: data?.scans ?? [],
  };
}

export default useInBodyLatest;
