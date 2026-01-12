/**
 * Tests for useTiles hook
 *
 * These tests verify the tile loading and filtering behavior.
 * They should pass with the current implementation before refactoring.
 */
import { renderHook } from '@testing-library/react';
import { useTiles, useWarningTiles, usePhaseTiles, useStaticTiles } from '@/hooks/useTiles';

// Mock the data imports
jest.mock('@/lib/data/tiles', () => {
  const mockTiles = [
    {
      id: 'test-1',
      name: 'Test Tile 1',
      menu: ['Org'],
      status: 'Done',
      desc: 'Test description',
      shadcn: ['Button'],
      phase: ['GS Site Standing'],
      thirdParty: [],
      actionWarning: false,
      actionDesc: null,
      priority: '1',
      typeII: 'Button',
    },
    {
      id: 'test-2',
      name: 'Test Tile 2',
      menu: ['Software'],
      status: 'In progress',
      desc: 'Another test',
      shadcn: ['Graphic'],
      phase: ['Morning'],
      thirdParty: ['Notion'],
      actionWarning: true,
      actionDesc: 'Needs attention',
      priority: '2',
      typeII: 'Graph',
    },
    {
      id: 'test-3',
      name: 'YouTube Wrapper Legacy',
      menu: ['Content'],
      status: 'Done',
      desc: 'Should be excluded',
      shadcn: ['Button'],
      phase: ['GS Site Standing'],
      thirdParty: [],
      actionWarning: false,
      actionDesc: null,
      priority: '3',
      typeII: 'Button',
    },
    {
      id: 'test-4',
      name: 'GS Site Admin Panel',
      menu: ['Org'],
      status: 'Done',
      desc: 'Should also be excluded',
      shadcn: ['Logic'],
      phase: ['GS Site Standing'],
      thirdParty: [],
      actionWarning: false,
      actionDesc: null,
      priority: null,
      typeII: 'Logic',
    },
  ];

  const mockLocalTiles = [
    {
      id: 'local-1',
      name: 'Local Tile',
      menu: ['Org'],
      status: 'Done',
      desc: 'A local-only tile',
      shadcn: ['Graphic'],
      phase: ['GS Site Standing'],
      thirdParty: [],
      actionWarning: false,
      actionDesc: null,
      priority: '1',
      typeII: 'Metric',
    },
  ];

  return {
    STATIC_TILES: mockTiles,
    LOCAL_TILES: mockLocalTiles,
  };
});

describe('useTiles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns tiles immediately (no loading state)', () => {
    const { result } = renderHook(() => useTiles());

    expect(result.current.tiles).toBeDefined();
    expect(result.current.tiles.length).toBeGreaterThan(0);
    expect(result.current.isLoading).toBe(false);
  });

  it('includes LOCAL_TILES in the result', () => {
    const { result } = renderHook(() => useTiles());

    const localTile = result.current.tiles.find(t => t.id === 'local-1');
    expect(localTile).toBeDefined();
    expect(localTile?.name).toBe('Local Tile');
  });

  it('excludes tiles by name pattern (youtube wrapper)', () => {
    const { result } = renderHook(() => useTiles());

    const names = result.current.tiles.map(t => t.name.toLowerCase());
    expect(names.some(n => n.includes('youtube wrapper'))).toBe(false);
  });

  it('excludes tiles by name pattern (gs site admin)', () => {
    const { result } = renderHook(() => useTiles());

    const names = result.current.tiles.map(t => t.name.toLowerCase());
    expect(names.some(n => n.includes('gs site admin'))).toBe(false);
  });

  it('returns correct count', () => {
    const { result } = renderHook(() => useTiles());

    expect(result.current.count).toBe(result.current.tiles.length);
  });

  it('provides refetch function', () => {
    const { result } = renderHook(() => useTiles());

    expect(typeof result.current.refetch).toBe('function');
  });
});

describe('useTiles with phase filter', () => {
  it('filters by Morning phase', () => {
    const { result } = renderHook(() => useTiles({ phase: 'Morning' }));

    // All returned tiles should have Morning in their phase array
    result.current.tiles.forEach(tile => {
      // LOCAL_TILES may not have Morning phase, so we check STATIC tiles only
      if (!tile.id.startsWith('local-')) {
        expect(tile.phase).toContain('Morning');
      }
    });
  });

  it('filters by GS Site Standing phase', () => {
    const { result } = renderHook(() => useTiles({ phase: 'GS Site Standing' }));

    // Should include tiles with this phase (minus excluded ones)
    expect(result.current.tiles.length).toBeGreaterThan(0);
  });
});

describe('useTiles with warningsOnly filter', () => {
  it('returns only tiles with actionWarning=true', () => {
    const { result } = renderHook(() => useTiles({ warningsOnly: true }));

    // Filter out LOCAL_TILES for this check
    const nonLocalTiles = result.current.tiles.filter(t => !t.id.startsWith('local-'));

    if (nonLocalTiles.length > 0) {
      nonLocalTiles.forEach(tile => {
        expect(tile.actionWarning).toBe(true);
      });
    }
  });
});

describe('useWarningTiles', () => {
  it('is equivalent to useTiles({ warningsOnly: true })', () => {
    const { result: warningResult } = renderHook(() => useWarningTiles());
    const { result: manualResult } = renderHook(() => useTiles({ warningsOnly: true }));

    expect(warningResult.current.tiles.length).toBe(manualResult.current.tiles.length);
  });
});

describe('usePhaseTiles', () => {
  it('filters by the specified phase', () => {
    const { result } = renderHook(() => usePhaseTiles('Morning'));

    // Non-local tiles should have Morning in their phase
    const nonLocalTiles = result.current.tiles.filter(t => !t.id.startsWith('local-'));
    nonLocalTiles.forEach(tile => {
      expect(tile.phase).toContain('Morning');
    });
  });
});

describe('useStaticTiles', () => {
  it('returns tiles without API call (staticOnly mode)', () => {
    const { result } = renderHook(() => useStaticTiles());

    expect(result.current.tiles).toBeDefined();
    expect(result.current.tiles.length).toBeGreaterThan(0);
    expect(result.current.isStatic).toBe(true);
  });
});
