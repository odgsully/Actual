'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tile, ThirdPartyIntegration } from '@/lib/types/tiles';
import {
  ConnectionStatus,
  HealthCheckResult,
  COMING_SOON_SERVICES,
} from '@/lib/integrations/types';
import { checkHealth, checkServicesHealth } from '@/lib/integrations/health-checker';
import { shouldShowWarning } from '@/lib/integrations/warning-tests';

interface UseConnectionHealthResult {
  /** Whether the warning border should be shown */
  shouldShowWarning: boolean;
  /** Status of each 3rd party service for this tile */
  connectionStatuses: Record<string, ConnectionStatus>;
  /** Whether we're currently checking connections */
  isChecking: boolean;
  /** Error message if health check failed */
  error: string | null;
  /** Manually trigger a recheck of all connections */
  recheckAll: () => Promise<void>;
  /** Time of last health check */
  lastChecked: Date | null;
}

/**
 * Hook to check connection health for a tile's 3rd party services
 * Provides real-time health status and warning state
 */
export function useConnectionHealth(tile: Tile): UseConnectionHealthResult {
  const queryClient = useQueryClient();
  const [warningState, setWarningState] = useState(false);

  // Filter out Logic services - they're always "connected"
  const checkableServices = (tile.thirdParty || []).filter(
    (service) => service !== 'Logic' && service !== 'EXTRA LOGIC'
  );

  // Use React Query for health checks with caching
  const {
    data: healthResults,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['connection-health', tile.id, checkableServices.join(',')],
    queryFn: async () => {
      if (checkableServices.length === 0) return [];
      return checkServicesHealth(checkableServices as ThirdPartyIntegration[]);
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 60 * 1000, // 1 minute
    enabled: checkableServices.length > 0,
    refetchOnWindowFocus: true,
    refetchInterval: 60 * 1000, // Recheck every minute
  });

  // Check warning test when tile has actionWarning flag
  useEffect(() => {
    if (!tile.actionWarning) {
      setWarningState(false);
      return;
    }

    let mounted = true;

    const checkWarning = async () => {
      const result = await shouldShowWarning(tile.name);
      if (mounted) {
        setWarningState(result);
      }
    };

    checkWarning();

    // Recheck every 30 seconds
    const interval = setInterval(checkWarning, 30 * 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [tile.actionWarning, tile.name]);

  // Build connection statuses map
  const connectionStatuses: Record<string, ConnectionStatus> = {};
  if (healthResults) {
    for (const result of healthResults) {
      connectionStatuses[result.service] = result.status;
    }
  }

  // Determine if any service is disconnected
  const hasDisconnectedService = healthResults?.some(
    (r) => r.status === 'disconnected'
  ) ?? false;

  // Final warning state: actionWarning flag + (warning test passed OR disconnected service)
  const finalShouldShowWarning = tile.actionWarning && (warningState || hasDisconnectedService);

  const recheckAll = useCallback(async () => {
    await refetch();
    if (tile.actionWarning) {
      const result = await shouldShowWarning(tile.name);
      setWarningState(result);
    }
  }, [refetch, tile.actionWarning, tile.name]);

  const lastChecked = healthResults?.[0]?.lastChecked ?? null;

  return {
    shouldShowWarning: finalShouldShowWarning,
    connectionStatuses,
    isChecking: isLoading,
    error: error ? (error as Error).message : null,
    recheckAll,
    lastChecked,
  };
}

/**
 * Hook to get health status for all services
 * Useful for admin dashboard / connections page
 */
export function useAllConnectionsHealth() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['all-connections-health'],
    queryFn: async () => {
      const { checkAllHealth } = await import('@/lib/integrations/health-checker');
      return checkAllHealth();
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const summary = {
    connected: data?.filter((r) => r.status === 'connected') ?? [],
    disconnected: data?.filter((r) => r.status === 'disconnected') ?? [],
    comingSoon: data?.filter((r) => r.status === 'coming_soon') ?? [],
    notConfigured: data?.filter((r) => r.status === 'not_configured') ?? [],
  };

  return {
    results: data ?? [],
    summary,
    isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  };
}

/**
 * Hook to check a single service's health
 */
export function useServiceHealth(service: ThirdPartyIntegration) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['service-health', service],
    queryFn: () => checkHealth(service),
    staleTime: 30 * 1000,
    gcTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });

  return {
    status: data?.status ?? 'checking',
    lastChecked: data?.lastChecked ?? null,
    latencyMs: data?.latencyMs,
    errorMessage: data?.errorMessage,
    isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  };
}
