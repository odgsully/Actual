/**
 * Tests for useDualFilter hook
 *
 * These tests verify the dual-filter (menu + typeII) behavior.
 * Important: Tests the current default of 'Org' - after FIX #2, update to expect 'ALL'.
 */
import { renderHook, act } from '@testing-library/react';
import { useDualFilter } from '@/hooks/useDualFilter';
import type { Tile } from '@/lib/types/tiles';

// Mock tiles for testing
const mockTiles: Tile[] = [
  {
    id: '1',
    name: 'Org Button Tile',
    menu: ['Org'],
    status: 'Done',
    desc: 'Test',
    shadcn: ['Button'],
    phase: ['GS Site Standing'],
    thirdParty: [],
    actionWarning: false,
    actionDesc: null,
    priority: '1',
    typeII: 'Button',
  },
  {
    id: '2',
    name: 'Software Graph Tile',
    menu: ['Software'],
    status: 'Done',
    desc: 'Test',
    shadcn: ['Graphic'],
    phase: ['GS Site Standing'],
    thirdParty: [],
    actionWarning: false,
    actionDesc: null,
    priority: '2',
    typeII: 'Graph',
  },
  {
    id: '3',
    name: 'Org Graph Tile',
    menu: ['Org'],
    status: 'In progress',
    desc: 'Test',
    shadcn: ['Graphic'],
    phase: ['GS Site Standing'],
    thirdParty: [],
    actionWarning: true,
    actionDesc: 'Warning',
    priority: '1',
    typeII: 'Graph',
  },
  {
    id: '4',
    name: 'Health Form Tile',
    menu: ['Health'],
    status: 'Done',
    desc: 'Test',
    shadcn: ['Form'],
    phase: ['Morning'],
    thirdParty: [],
    actionWarning: false,
    actionDesc: null,
    priority: '3',
    typeII: 'Form',
  },
  {
    id: '5',
    name: 'Multi-Category Tile',
    menu: ['Org', 'Software'],
    status: 'Done',
    desc: 'Test',
    shadcn: ['Button'],
    phase: ['GS Site Standing'],
    thirdParty: [],
    actionWarning: false,
    actionDesc: null,
    priority: '2',
    typeII: 'Button',
  },
];

describe('useDualFilter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('defaults to Org menu category (CURRENT BEHAVIOR - will change to ALL)', () => {
      const { result } = renderHook(() => useDualFilter(mockTiles));

      // CURRENT: defaults to 'Org'
      // AFTER FIX #2: should default to 'ALL'
      expect(result.current.activeCategory).toBe('Org');
    });

    it('defaults to ALL typeII category', () => {
      const { result } = renderHook(() => useDualFilter(mockTiles));

      expect(result.current.activeTypeII).toBe('ALL');
    });

    it('accepts custom initial values', () => {
      const { result } = renderHook(() =>
        useDualFilter(mockTiles, {
          initialMenuCategory: 'Software',
          initialTypeII: 'Graph',
          persistToUrl: false,
        })
      );

      expect(result.current.activeCategory).toBe('Software');
      expect(result.current.activeTypeII).toBe('Graph');
    });
  });

  describe('menu filtering', () => {
    it('filters tiles by menu category', () => {
      const { result } = renderHook(() =>
        useDualFilter(mockTiles, { persistToUrl: false })
      );

      // With default 'Org', should only show Org tiles
      const orgTileIds = result.current.filteredTiles.map(t => t.id);

      // Tiles 1, 3, 5 have 'Org' in menu
      expect(orgTileIds).toContain('1');
      expect(orgTileIds).toContain('3');
      expect(orgTileIds).toContain('5');

      // Tile 2 (Software only) and 4 (Health only) should not be included
      expect(orgTileIds).not.toContain('2');
      expect(orgTileIds).not.toContain('4');
    });

    it('shows all tiles when menu is ALL', () => {
      const { result } = renderHook(() =>
        useDualFilter(mockTiles, { initialMenuCategory: 'ALL', persistToUrl: false })
      );

      expect(result.current.filteredTiles.length).toBe(mockTiles.length);
    });

    it('updates filtered tiles when category changes', () => {
      const { result } = renderHook(() =>
        useDualFilter(mockTiles, { persistToUrl: false })
      );

      act(() => {
        result.current.setActiveCategory('Software');
      });

      expect(result.current.activeCategory).toBe('Software');

      // Should now show tiles with Software in menu
      const softwareTileIds = result.current.filteredTiles.map(t => t.id);
      expect(softwareTileIds).toContain('2'); // Software only
      expect(softwareTileIds).toContain('5'); // Org + Software
    });
  });

  describe('typeII filtering', () => {
    it('filters by typeII after menu filter (AND logic)', () => {
      const { result } = renderHook(() =>
        useDualFilter(mockTiles, {
          initialMenuCategory: 'Org',
          initialTypeII: 'Graph',
          persistToUrl: false,
        })
      );

      // Should show Org tiles that are also Graph type
      // Tile 3 is Org + Graph
      const filteredIds = result.current.filteredTiles.map(t => t.id);
      expect(filteredIds).toContain('3');
      expect(filteredIds).not.toContain('1'); // Org but Button
      expect(filteredIds).not.toContain('5'); // Org but Button
    });

    it('shows all typeII when set to ALL', () => {
      const { result } = renderHook(() =>
        useDualFilter(mockTiles, {
          initialMenuCategory: 'Org',
          initialTypeII: 'ALL',
          persistToUrl: false,
        })
      );

      // Should show all Org tiles regardless of typeII
      expect(result.current.filteredTiles.length).toBe(3); // tiles 1, 3, 5
    });
  });

  describe('counts', () => {
    it('returns correct menu counts from full tile set', () => {
      const { result } = renderHook(() =>
        useDualFilter(mockTiles, { persistToUrl: false })
      );

      expect(result.current.menuCounts.ALL).toBe(5);
      expect(result.current.menuCounts.Org).toBe(3); // tiles 1, 3, 5
      expect(result.current.menuCounts.Software).toBe(2); // tiles 2, 5
      expect(result.current.menuCounts.Health).toBe(1); // tile 4
    });

    it('returns correct typeII counts from menu-filtered set', () => {
      const { result } = renderHook(() =>
        useDualFilter(mockTiles, {
          initialMenuCategory: 'Org',
          persistToUrl: false,
        })
      );

      // After filtering to Org (tiles 1, 3, 5)
      expect(result.current.typeIICounts.ALL).toBe(3);
      expect(result.current.typeIICounts.Button).toBe(2); // tiles 1, 5
      expect(result.current.typeIICounts.Graph).toBe(1); // tile 3
    });
  });

  describe('resetFilters', () => {
    it('resets to default values (CURRENT: Org, will be ALL after FIX #2)', () => {
      const { result } = renderHook(() =>
        useDualFilter(mockTiles, { persistToUrl: false })
      );

      // Change filters
      act(() => {
        result.current.setActiveCategory('Software');
        result.current.setActiveTypeII('Graph');
      });

      expect(result.current.activeCategory).toBe('Software');
      expect(result.current.activeTypeII).toBe('Graph');

      // Reset
      act(() => {
        result.current.resetFilters();
      });

      // CURRENT: resets to 'Org'
      // AFTER FIX #2: should reset to 'ALL'
      expect(result.current.activeCategory).toBe('Org');
      expect(result.current.activeTypeII).toBe('ALL');
    });
  });

  describe('setters', () => {
    it('setActiveCategory updates the category', () => {
      const { result } = renderHook(() =>
        useDualFilter(mockTiles, { persistToUrl: false })
      );

      act(() => {
        result.current.setActiveCategory('Health');
      });

      expect(result.current.activeCategory).toBe('Health');
    });

    it('setActiveTypeII updates the typeII', () => {
      const { result } = renderHook(() =>
        useDualFilter(mockTiles, { persistToUrl: false })
      );

      act(() => {
        result.current.setActiveTypeII('Form');
      });

      expect(result.current.activeTypeII).toBe('Form');
    });
  });
});

/**
 * NOTE: URL persistence tests are difficult to test without a full Next.js environment.
 * The URL behavior is tested manually via the verification steps in decouplenotion.md.
 *
 * Key URL behaviors to verify manually:
 * 1. Default (Org/ALL) should NOT appear in URL
 * 2. Non-default values should appear as ?menu=X&type=Y
 * 3. Loading a URL with params should restore filter state
 */
