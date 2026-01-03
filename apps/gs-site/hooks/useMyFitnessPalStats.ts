'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  MFPStatusResponse,
  MFPSyncResponse,
  MFPDataResponse,
  MFPConnectRequest,
  MFPConnectResponse,
  UseMFPStatsOptions,
} from '@/lib/myfitnesspal/types';

/**
 * Fetch MFP status from API
 */
async function fetchMFPStatus(): Promise<MFPStatusResponse> {
  const response = await fetch('/api/myfitnesspal/status');
  if (!response.ok) {
    throw new Error('Failed to fetch MFP status');
  }
  return response.json();
}

/**
 * Fetch MFP data from API
 */
async function fetchMFPData(
  range: 'today' | 'week' | 'month' = 'week'
): Promise<MFPDataResponse> {
  const response = await fetch(`/api/myfitnesspal/data?range=${range}&type=all`);
  if (!response.ok) {
    throw new Error('Failed to fetch MFP data');
  }
  return response.json();
}

/**
 * Connect to MFP
 */
async function connectMFP(data: MFPConnectRequest): Promise<MFPConnectResponse> {
  const response = await fetch('/api/myfitnesspal/connect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await response.json();

  // Always return the result - it contains success/error info
  // The caller checks result.success to determine if it worked
  return result;
}

/**
 * Trigger MFP sync
 */
async function triggerMFPSync(days: number = 7): Promise<MFPSyncResponse> {
  const response = await fetch('/api/myfitnesspal/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ days }),
  });
  return response.json();
}

/**
 * Disconnect MFP
 */
async function disconnectMFP(): Promise<{ success: boolean }> {
  const response = await fetch('/api/myfitnesspal/connect', {
    method: 'DELETE',
  });
  return response.json();
}

/**
 * Hook for MFP status and summary stats (used by tile)
 */
export function useMyFitnessPalStats(options: UseMFPStatsOptions = {}) {
  const { enabled = true, refetchInterval = 5 * 60 * 1000 } = options;

  const query = useQuery({
    queryKey: ['mfpStatus'],
    queryFn: fetchMFPStatus,
    enabled,
    refetchInterval,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    refetchOnWindowFocus: true,
  });

  const data = query.data;

  // Compute derived values
  const caloriePercent =
    data?.stats?.todayCalories && data?.stats?.todayGoal
      ? Math.round((data.stats.todayCalories / data.stats.todayGoal) * 100)
      : null;

  const needsReconnect = data?.lastSyncStatus === 'session_expired';

  return {
    // Query state
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,

    // Connection status
    isConnected: data?.connected ?? false,
    username: data?.username,

    // Today's data
    todayCalories: data?.stats?.todayCalories ?? null,
    todayGoal: data?.stats?.todayGoal ?? null,
    todayProtein: data?.stats?.todayProtein ?? null,
    caloriePercent,
    isYesterdayData: (data?.stats as { isYesterdayData?: boolean })?.isYesterdayData ?? false,

    // Trends
    weekAvgCalories: data?.stats?.weekAvgCalories ?? null,
    streak: data?.stats?.streak ?? 0,

    // Sync status
    lastSyncAt: data?.lastSyncAt ?? null,
    lastSyncStatus: data?.lastSyncStatus ?? null,
    needsReconnect,
  };
}

/**
 * Hook for MFP detailed data (used by modal)
 */
export function useMyFitnessPalData(
  range: 'today' | 'week' | 'month' = 'week',
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['mfpData', range],
    queryFn: () => fetchMFPData(range),
    enabled,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for connecting to MFP
 */
export function useConnectMFP() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: connectMFP,
    onSuccess: () => {
      // Invalidate status query to refresh tile
      queryClient.invalidateQueries({ queryKey: ['mfpStatus'] });
      queryClient.invalidateQueries({ queryKey: ['mfpData'] });
    },
  });
}

/**
 * Hook for disconnecting from MFP
 */
export function useDisconnectMFP() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: disconnectMFP,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mfpStatus'] });
      queryClient.invalidateQueries({ queryKey: ['mfpData'] });
    },
  });
}

/**
 * Hook for triggering manual sync
 */
export function useSyncMFP() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (days: number = 7) => triggerMFPSync(days),
    onSuccess: () => {
      // Invalidate data queries after sync
      queryClient.invalidateQueries({ queryKey: ['mfpStatus'] });
      queryClient.invalidateQueries({ queryKey: ['mfpData'] });
    },
  });
}

/**
 * Upload CSV content to MFP
 */
interface MFPUploadRequest {
  nutrition?: string;
  progress?: string;
  exercise?: string;
}

interface MFPUploadResponse {
  success: boolean;
  imported?: {
    food: number;
    weight: number;
    exercise: number;
  };
  error?: string;
}

async function uploadMFPCSV(data: MFPUploadRequest): Promise<MFPUploadResponse> {
  const response = await fetch('/api/myfitnesspal/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

/**
 * Hook for uploading CSV data
 */
export function useUploadMFP() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadMFPCSV,
    onSuccess: () => {
      // Invalidate data queries after upload
      queryClient.invalidateQueries({ queryKey: ['mfpStatus'] });
      queryClient.invalidateQueries({ queryKey: ['mfpData'] });
    },
  });
}
