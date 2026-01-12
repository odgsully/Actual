'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { MenuCategory } from '@/components/MenuFilter';
import type { TypeIICategory } from '@/components/TypeIIFilter';
import type { Tile } from '@/lib/types/tiles';

interface UseDualFilterOptions {
  initialMenuCategory?: MenuCategory;
  initialTypeII?: TypeIICategory;
  persistToUrl?: boolean; // Enable URL query param sync
}

interface UseDualFilterReturn {
  activeCategory: MenuCategory;
  setActiveCategory: (category: MenuCategory) => void;
  activeTypeII: TypeIICategory;
  setActiveTypeII: (typeII: TypeIICategory) => void;
  filteredTiles: Tile[];
  menuCounts: Record<MenuCategory, number>;
  typeIICounts: Record<TypeIICategory, number>;
  resetFilters: () => void;
}

const VALID_MENU_CATEGORIES: MenuCategory[] = [
  'ALL',
  'Real Estate',
  'Software',
  'Org',
  'Content',
  'Health',
  'Learn',
];

/**
 * Default menu category - changed from 'Org' to 'ALL' as part of
 * decouple-notion-tiles migration to show all tiles by default.
 */
const DEFAULT_MENU: MenuCategory = 'ALL';

const VALID_TYPE_II: TypeIICategory[] = [
  'ALL',
  'Button',
  'Graph',
  'Metric',
  'Form',
  'Counter',
  'Calendar',
  'Dropzone',
  'Logic',
];

export function useDualFilter(
  tiles: Tile[],
  options: UseDualFilterOptions = {}
): UseDualFilterReturn {
  const {
    initialMenuCategory = DEFAULT_MENU,
    initialTypeII = 'ALL',
    persistToUrl = true,
  } = options;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read initial values from URL if available
  const getInitialMenu = (): MenuCategory => {
    if (!persistToUrl) return initialMenuCategory;
    const param = searchParams.get('menu');
    if (param && VALID_MENU_CATEGORIES.includes(param as MenuCategory)) {
      return param as MenuCategory;
    }
    return initialMenuCategory;
  };

  const getInitialTypeII = (): TypeIICategory => {
    if (!persistToUrl) return initialTypeII;
    const param = searchParams.get('type');
    if (param && VALID_TYPE_II.includes(param as TypeIICategory)) {
      return param as TypeIICategory;
    }
    return initialTypeII;
  };

  const [activeCategory, setActiveCategoryState] = useState<MenuCategory>(getInitialMenu);
  const [activeTypeII, setActiveTypeIIState] = useState<TypeIICategory>(getInitialTypeII);

  // Sync state to URL
  const updateUrl = useCallback(
    (menu: MenuCategory, typeII: TypeIICategory) => {
      if (!persistToUrl) return;

      const params = new URLSearchParams(searchParams.toString());

      // Only add non-default values to URL (default is ALL, not Org)
      if (menu !== DEFAULT_MENU) {
        params.set('menu', menu);
      } else {
        params.delete('menu');
      }

      if (typeII !== 'ALL') {
        params.set('type', typeII);
      } else {
        params.delete('type');
      }

      const newUrl = params.toString() ? `${pathname}?${params}` : pathname;
      router.replace(newUrl, { scroll: false });
    },
    [persistToUrl, pathname, searchParams, router]
  );

  // Wrapped setters that also update URL
  const setActiveCategory = useCallback(
    (category: MenuCategory) => {
      setActiveCategoryState(category);
      updateUrl(category, activeTypeII);
    },
    [activeTypeII, updateUrl]
  );

  const setActiveTypeII = useCallback(
    (typeII: TypeIICategory) => {
      setActiveTypeIIState(typeII);
      updateUrl(activeCategory, typeII);
    },
    [activeCategory, updateUrl]
  );

  // Filter by menu category first
  const menuFilteredTiles = useMemo(() => {
    if (activeCategory === 'ALL') return tiles;
    return tiles.filter((tile) => tile.menu.includes(activeCategory));
  }, [tiles, activeCategory]);

  // Then filter by Type II (AND logic)
  const filteredTiles = useMemo(() => {
    if (activeTypeII === 'ALL') return menuFilteredTiles;
    return menuFilteredTiles.filter((tile) => tile.typeII === activeTypeII);
  }, [menuFilteredTiles, activeTypeII]);

  // Count tiles by menu category (from full set)
  const menuCounts = useMemo(() => {
    const counts: Record<MenuCategory, number> = {
      ALL: tiles.length,
      'Real Estate': 0,
      Software: 0,
      Org: 0,
      Content: 0,
      Health: 0,
      Learn: 0,
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

  // Count tiles by Type II (from menu-filtered set)
  const typeIICounts = useMemo(() => {
    const counts: Record<TypeIICategory, number> = {
      ALL: menuFilteredTiles.length,
      Button: 0,
      Graph: 0,
      Metric: 0,
      Form: 0,
      Counter: 0,
      Calendar: 0,
      Dropzone: 0,
      Logic: 0,
    };

    menuFilteredTiles.forEach((tile) => {
      if (tile.typeII && tile.typeII in counts) {
        counts[tile.typeII as TypeIICategory]++;
      }
    });

    return counts;
  }, [menuFilteredTiles]);

  const resetFilters = useCallback(() => {
    setActiveCategoryState(DEFAULT_MENU);
    setActiveTypeIIState('ALL');
    updateUrl(DEFAULT_MENU, 'ALL');
  }, [updateUrl]);

  return {
    activeCategory,
    setActiveCategory,
    activeTypeII,
    setActiveTypeII,
    filteredTiles,
    menuCounts,
    typeIICounts,
    resetFilters,
  };
}

export default useDualFilter;
