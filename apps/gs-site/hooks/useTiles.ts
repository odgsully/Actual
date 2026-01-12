'use client';

import { useMemo } from 'react';
import type { Tile, TilePhase } from '@/lib/types/tiles';
import { LOCAL_TILES } from '@/lib/data/tiles';

/**
 * Tile names to exclude at runtime (case-insensitive partial match)
 * Layer 2 exclusion - these tiles exist in LOCAL_TILES but are hidden from the UI.
 *
 * Note: Layer 1 exclusions (by ID) were applied at merge time and
 * those tiles don't exist in LOCAL_TILES at all.
 */
const EXCLUDED_TILE_NAMES = [
  'forms (monthly) & printoff',
  'forms (quarterly) & printoff',
  'physically print weeklies',
  'physically print tomorrow daily',
  'gs site admin',
  'youtube wrapper',
];

interface UseTilesOptions {
  phase?: TilePhase;
  warningsOnly?: boolean;
}

/**
 * Get filtered tiles synchronously.
 * All tiles are now local - no API calls needed.
 */
function getFilteredTiles(options: UseTilesOptions = {}): Tile[] {
  const { phase, warningsOnly = false } = options;

  let tiles = LOCAL_TILES.filter(tile => {
    const nameLower = tile.name.toLowerCase();
    return !EXCLUDED_TILE_NAMES.some(excluded => nameLower.includes(excluded));
  });

  if (phase) {
    tiles = tiles.filter(t => t.phase.includes(phase));
  }

  if (warningsOnly) {
    tiles = tiles.filter(t => t.actionWarning);
  }

  return tiles;
}

/**
 * Hook to get tiles - now fully synchronous with local data only.
 *
 * Architecture (Post-Decouple):
 * - All tiles are stored locally in LOCAL_TILES
 * - No API calls - tiles are available immediately
 * - Notion is used only for DATA (habits, tasks), not tile definitions
 *
 * @example
 * ```tsx
 * // Get all tiles
 * const { tiles, count } = useTiles();
 *
 * // Get only Morning phase tiles
 * const { tiles } = useTiles({ phase: 'Morning' });
 *
 * // Get only tiles with warnings
 * const { tiles } = useTiles({ warningsOnly: true });
 * ```
 */
export function useTiles(options: UseTilesOptions = {}) {
  const { phase, warningsOnly = false } = options;

  const tiles = useMemo(
    () => getFilteredTiles({ phase, warningsOnly }),
    [phase, warningsOnly]
  );

  return {
    /**
     * Tiles to render - always available immediately
     */
    tiles,
    /**
     * Total count of filtered tiles
     */
    count: tiles.length,
    /**
     * Always false - data is synchronous
     */
    isLoading: false,
    /**
     * Always false - no API to refresh
     * @deprecated No longer used - kept for compatibility
     */
    isRefreshing: false,
    /**
     * Always false - no API that can fail
     * @deprecated No longer used - kept for compatibility
     */
    isError: false,
    /**
     * Always true - all tiles are now local
     * @deprecated No longer meaningful - kept for compatibility
     */
    isStatic: true,
    /**
     * Always null - no API errors possible
     * @deprecated No longer used - kept for compatibility
     */
    error: null,
    /**
     * No-op for compatibility - nothing to refetch
     * @deprecated No longer used - kept for compatibility
     */
    refetch: () => Promise.resolve(),
  };
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
 * Hook to get static tiles only
 * @deprecated Same as useTiles now - all tiles are local
 */
export function useStaticTiles() {
  return useTiles();
}

export default useTiles;
