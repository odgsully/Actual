'use client';

import { useQuery } from '@tanstack/react-query';
import type { Tile, TilePhase } from '@/lib/types/tiles';
import { STATIC_TILES, LOCAL_TILES } from '@/lib/data/tiles';

interface TilesResponse {
  tiles: Tile[];
  count: number;
}

interface UseTilesOptions {
  phase?: TilePhase;
  warningsOnly?: boolean;
  enabled?: boolean;
  /**
   * If true, skip API fetch entirely and only use static data.
   * Useful when you know the API is unavailable.
   */
  staticOnly?: boolean;
}

/**
 * Hook to get tiles with static-first fallback.
 *
 * Architecture:
 * 1. Returns static tiles IMMEDIATELY (no loading state for initial render)
 * 2. Attempts to fetch fresh data from Notion API in background
 * 3. If API succeeds, merges fresh data
 * 4. If API fails, logs warning and continues with static data
 *
 * This ensures the dashboard ALWAYS renders, even without Notion connectivity.
 *
 * @example
 * ```tsx
 * // Fetch all tiles (static immediately, API enrichment in background)
 * const { tiles, isLoading, isRefreshing } = useTiles();
 *
 * // Fetch only Morning phase tiles
 * const { tiles } = useTiles({ phase: 'Morning' });
 *
 * // Fetch only tiles with warnings
 * const { tiles } = useTiles({ warningsOnly: true });
 *
 * // Use only static data (no API call)
 * const { tiles } = useTiles({ staticOnly: true });
 * ```
 */
export function useTiles(options: UseTilesOptions = {}) {
  const { phase, warningsOnly = false, enabled = true, staticOnly = false } = options;

  // Get static tiles (always available, filtered as needed)
  const staticTiles = getFilteredStaticTiles({ phase, warningsOnly });

  const queryKey = ['tiles', { phase, warningsOnly }];

  const fetchFn = async (): Promise<TilesResponse> => {
    const params = new URLSearchParams();
    if (phase) params.set('phase', phase);
    if (warningsOnly) params.set('warnings', 'true');

    const url = `/api/tiles${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch tiles from Notion');
    }

    return response.json();
  };

  const query = useQuery({
    queryKey,
    queryFn: fetchFn,
    // Only enable if not static-only mode
    enabled: enabled && !staticOnly,
    // Don't refetch too aggressively - tiles don't change often
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
    // Don't throw on error - we have static fallback
    throwOnError: false,
    // Retry once, then give up
    retry: 1,
    retryDelay: 1000,
  });

  // Log API errors but don't crash
  if (query.error) {
    console.warn(
      '⚠️ Notion API unavailable, using static tile data:',
      (query.error as Error).message
    );
  }

  // Merge API data with local tiles, or use static data alone
  // LOCAL_TILES are always prepended (they don't come from Notion)
  const apiOrStaticTiles = query.data?.tiles ?? staticTiles;
  // Always include LOCAL_TILES, whether using API data or static fallback
  const tiles = [...LOCAL_TILES, ...apiOrStaticTiles];
  const count = tiles.length;

  return {
    /**
     * Tiles to render - always available (static or API-enriched)
     */
    tiles,
    /**
     * Total count of tiles
     */
    count,
    /**
     * True only on very first load before static data is processed
     * (should almost never be true in practice)
     */
    isLoading: false, // Static data is always immediately available
    /**
     * True while fetching fresh data from API (background refresh)
     */
    isRefreshing: query.isFetching,
    /**
     * True if API call failed (tiles still available via static fallback)
     */
    isError: query.isError,
    /**
     * True if we're using static data (API not yet loaded or failed)
     */
    isStatic: !query.data,
    /**
     * The error if API failed (for logging/debugging)
     */
    error: query.error,
    /**
     * Manually trigger a refresh from the API
     */
    refetch: query.refetch,
  };
}

/**
 * Tile names to exclude (case-insensitive partial match)
 * Mirrors the API exclusion list for consistency
 */
const EXCLUDED_TILE_NAMES = [
  'forms (monthly) & printoff',
  'forms (quarterly) & printoff',
  'physically print weeklies',
  'physically print tomorrow daily',
  'gs site admin',
  'youtube wrapper', // Legacy tile - use "Socials stats" instead
];

/**
 * Filter static tiles by phase and/or warning status
 */
function getFilteredStaticTiles(options: {
  phase?: TilePhase;
  warningsOnly?: boolean;
}): Tile[] {
  let tiles = [...STATIC_TILES];

  // Filter out excluded tiles by name
  tiles = tiles.filter((t) => {
    const nameLower = t.name.toLowerCase();
    return !EXCLUDED_TILE_NAMES.some((excluded) => nameLower.includes(excluded));
  });

  if (options.phase) {
    tiles = tiles.filter((t) => t.phase.includes(options.phase!));
  }

  if (options.warningsOnly) {
    tiles = tiles.filter((t) => t.actionWarning);
  }

  return tiles;
}

/**
 * Hook to fetch only tiles with action warnings
 */
export function useWarningTiles() {
  return useTiles({ warningsOnly: true });
}

/**
 * Hook to fetch tiles for a specific phase
 */
export function usePhaseTiles(phase: TilePhase) {
  return useTiles({ phase });
}

/**
 * Hook to get static tiles only (no API call)
 */
export function useStaticTiles() {
  return useTiles({ staticOnly: true });
}

export default useTiles;
