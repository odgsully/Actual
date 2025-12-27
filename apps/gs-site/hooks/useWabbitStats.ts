'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  WabbitStats,
  AppHealthResponse,
  WabbitAppKey,
  checkAllAppsHealth,
  checkAppHealth,
  getAllStats,
  wabbitClient,
  gsrealtyClient,
  wabbitReClient,
} from '@/lib/wabbit/client';

/**
 * Query keys for Wabbit data
 */
export const wabbitQueryKeys = {
  all: ['wabbit'] as const,
  health: () => [...wabbitQueryKeys.all, 'health'] as const,
  healthApp: (app: WabbitAppKey) => [...wabbitQueryKeys.health(), app] as const,
  stats: () => [...wabbitQueryKeys.all, 'stats'] as const,
  statsApp: (app: WabbitAppKey) => [...wabbitQueryKeys.stats(), app] as const,
  wabbedPercentage: () => [...wabbitQueryKeys.all, 'wabbed-percentage'] as const,
};

/**
 * Hook to check health of all Wabbit apps
 */
export function useWabbitAppsHealth(options?: { enabled?: boolean; refetchInterval?: number }) {
  return useQuery<AppHealthResponse[]>({
    queryKey: wabbitQueryKeys.health(),
    queryFn: checkAllAppsHealth,
    staleTime: 30_000, // 30 seconds
    refetchInterval: options?.refetchInterval ?? 60_000, // 1 minute default
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook to check health of a specific Wabbit app
 */
export function useWabbitAppHealth(
  app: WabbitAppKey,
  options?: { enabled?: boolean; refetchInterval?: number }
) {
  return useQuery<AppHealthResponse>({
    queryKey: wabbitQueryKeys.healthApp(app),
    queryFn: () => checkAppHealth(app),
    staleTime: 30_000,
    refetchInterval: options?.refetchInterval ?? 60_000,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook to get stats from all Wabbit apps
 */
export function useWabbitStats(options?: { enabled?: boolean; refetchInterval?: number }) {
  return useQuery<WabbitStats>({
    queryKey: wabbitQueryKeys.stats(),
    queryFn: getAllStats,
    staleTime: 60_000, // 1 minute
    refetchInterval: options?.refetchInterval ?? 300_000, // 5 minutes default
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook to get Wabbit RE stats only
 */
export function useWabbitReStats(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: wabbitQueryKeys.statsApp('wabbit-re'),
    queryFn: wabbitReClient.getStats,
    staleTime: 60_000,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook to get GS Realty stats only
 */
export function useGsrealtyStats(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: wabbitQueryKeys.statsApp('gsrealty'),
    queryFn: gsrealtyClient.getStats,
    staleTime: 60_000,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook to get Wabbit (general) stats only
 */
export function useWabbitGeneralStats(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: wabbitQueryKeys.statsApp('wabbit'),
    queryFn: wabbitClient.getStats,
    staleTime: 60_000,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook to get the "Wabbed %" completion rate
 * Used by the Task List Wabbed % tile
 */
export function useWabbedPercentage(options?: { enabled?: boolean; refetchInterval?: number }) {
  return useQuery<number | null>({
    queryKey: wabbitQueryKeys.wabbedPercentage(),
    queryFn: wabbitClient.getWabbedPercentage,
    staleTime: 30_000,
    refetchInterval: options?.refetchInterval ?? 60_000,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook to prefetch all Wabbit data
 * Useful for dashboard initial load
 */
export function usePrefetchWabbitData() {
  const queryClient = useQueryClient();

  return async () => {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: wabbitQueryKeys.health(),
        queryFn: checkAllAppsHealth,
      }),
      queryClient.prefetchQuery({
        queryKey: wabbitQueryKeys.stats(),
        queryFn: getAllStats,
      }),
    ]);
  };
}

/**
 * Hook to invalidate all Wabbit queries
 * Useful for manual refresh
 */
export function useRefreshWabbitData() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: wabbitQueryKeys.all });
  };
}

/**
 * Combined hook for dashboard tiles that need both health and stats
 */
export function useWabbitDashboard(options?: { enabled?: boolean }) {
  const health = useWabbitAppsHealth({ enabled: options?.enabled });
  const stats = useWabbitStats({ enabled: options?.enabled });

  return {
    health: health.data ?? [],
    stats: stats.data,
    isLoading: health.isLoading || stats.isLoading,
    isError: health.isError || stats.isError,
    error: health.error || stats.error,
    refetch: async () => {
      await Promise.all([health.refetch(), stats.refetch()]);
    },
  };
}

/**
 * Hook to get connection status summary
 */
export function useWabbitConnectionSummary() {
  const { data: healthResults, isLoading } = useWabbitAppsHealth();

  if (isLoading || !healthResults) {
    return {
      isLoading: true,
      connected: 0,
      disconnected: 0,
      total: 3,
      allConnected: false,
    };
  }

  const connected = healthResults.filter((r) => r.healthy).length;
  const disconnected = healthResults.filter((r) => !r.healthy).length;

  return {
    isLoading: false,
    connected,
    disconnected,
    total: healthResults.length,
    allConnected: disconnected === 0,
  };
}
