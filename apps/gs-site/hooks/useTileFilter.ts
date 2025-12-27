'use client';

import { useState, useMemo, useCallback } from 'react';
import type { MenuCategory } from '@/components/MenuFilter';
import type { Tile } from '@/lib/types/tiles';

interface UseTileFilterOptions {
  initialCategory?: MenuCategory;
}

interface UseTileFilterReturn {
  activeCategory: MenuCategory;
  setActiveCategory: (category: MenuCategory) => void;
  filterTiles: (tiles: Tile[]) => Tile[];
  filteredTiles: Tile[];
  tileCounts: Record<MenuCategory, number>;
}

/**
 * Hook for filtering tiles by menu category
 *
 * @example
 * ```tsx
 * const { activeCategory, setActiveCategory, filteredTiles } = useTileFilter(allTiles);
 *
 * return (
 *   <>
 *     <MenuFilter activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
 *     <TileGrid tiles={filteredTiles} />
 *   </>
 * );
 * ```
 */
export function useTileFilter(
  tiles: Tile[],
  options: UseTileFilterOptions = {}
): UseTileFilterReturn {
  const { initialCategory = 'Org' } = options;
  const [activeCategory, setActiveCategory] = useState<MenuCategory>(initialCategory);

  const filterTiles = useCallback(
    (tilesToFilter: Tile[]): Tile[] => {
      if (activeCategory === 'ALL') {
        return tilesToFilter;
      }
      return tilesToFilter.filter((tile) => tile.menu.includes(activeCategory));
    },
    [activeCategory]
  );

  const filteredTiles = useMemo(() => filterTiles(tiles), [tiles, filterTiles]);

  const tileCounts = useMemo(() => {
    const counts: Record<MenuCategory, number> = {
      'ALL': tiles.length,
      'Real Estate': 0,
      'Software': 0,
      'Org': 0,
      'Content': 0,
      'Health': 0,
      'Learn': 0,
    };

    tiles.forEach((tile) => {
      tile.menu.forEach((category) => {
        if (category in counts) {
          counts[category as MenuCategory]++;
        }
      });
    });

    return counts;
  }, [tiles]);

  return {
    activeCategory,
    setActiveCategory,
    filterTiles,
    filteredTiles,
    tileCounts,
  };
}

export default useTileFilter;
