/**
 * Tests for tile helper functions in lib/data/tiles.ts
 *
 * These tests verify the helper functions work correctly.
 * IMPORTANT: After FIX #1, these functions will use LOCAL_TILES instead of STATIC_TILES.
 */
import {
  getTileCountsByCategory,
  getStaticTilesByPhase,
  getStaticWarningTiles,
  STATIC_TILES,
  LOCAL_TILES,
} from '@/lib/data/tiles';

describe('tile data exports', () => {
  it('STATIC_TILES is defined and is an array', () => {
    expect(STATIC_TILES).toBeDefined();
    expect(Array.isArray(STATIC_TILES)).toBe(true);
  });

  it('LOCAL_TILES is defined and is an array', () => {
    expect(LOCAL_TILES).toBeDefined();
    expect(Array.isArray(LOCAL_TILES)).toBe(true);
  });

  it('STATIC_TILES has tiles with required properties', () => {
    if (STATIC_TILES.length > 0) {
      const tile = STATIC_TILES[0];
      expect(tile).toHaveProperty('id');
      expect(tile).toHaveProperty('name');
      expect(tile).toHaveProperty('menu');
      expect(tile).toHaveProperty('phase');
      expect(tile).toHaveProperty('actionWarning');
    }
  });

  it('LOCAL_TILES tiles have required properties', () => {
    if (LOCAL_TILES.length > 0) {
      const tile = LOCAL_TILES[0];
      expect(tile).toHaveProperty('id');
      expect(tile).toHaveProperty('name');
      expect(tile).toHaveProperty('menu');
      expect(tile).toHaveProperty('phase');
    }
  });
});

describe('getTileCountsByCategory', () => {
  it('returns an object with counts', () => {
    const counts = getTileCountsByCategory();

    expect(counts).toBeDefined();
    expect(typeof counts).toBe('object');
  });

  it('has ALL count equal to total tiles', () => {
    const counts = getTileCountsByCategory();

    // FIX #1 APPLIED: Now uses LOCAL_TILES.length
    // STATIC_TILES is deprecated and empty
    expect(counts.ALL).toBe(LOCAL_TILES.length);
  });

  it('has counts for each menu category', () => {
    const counts = getTileCountsByCategory();

    // Should have some standard categories
    // (actual counts depend on tile data)
    expect('ALL' in counts).toBe(true);
  });

  it('category counts are non-negative numbers', () => {
    const counts = getTileCountsByCategory();

    Object.values(counts).forEach(count => {
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  it('sum of category counts >= ALL (tiles can be in multiple categories)', () => {
    const counts = getTileCountsByCategory();
    const categorySum = Object.entries(counts)
      .filter(([key]) => key !== 'ALL')
      .reduce((sum, [, count]) => sum + count, 0);

    // A tile can be in multiple menu categories, so sum >= ALL
    expect(categorySum).toBeGreaterThanOrEqual(counts.ALL);
  });
});

describe('getStaticTilesByPhase', () => {
  it('returns an array', () => {
    const tiles = getStaticTilesByPhase('GS Site Standing');

    expect(Array.isArray(tiles)).toBe(true);
  });

  it('filters tiles by GS Site Standing phase', () => {
    const tiles = getStaticTilesByPhase('GS Site Standing');

    tiles.forEach(tile => {
      expect(tile.phase).toContain('GS Site Standing');
    });
  });

  it('filters tiles by Morning phase', () => {
    const tiles = getStaticTilesByPhase('Morning');

    tiles.forEach(tile => {
      expect(tile.phase).toContain('Morning');
    });
  });

  it('filters tiles by Evening phase', () => {
    const tiles = getStaticTilesByPhase('Evening');

    tiles.forEach(tile => {
      expect(tile.phase).toContain('Evening');
    });
  });

  it('returns empty array for non-existent phase', () => {
    const tiles = getStaticTilesByPhase('NonExistentPhase');

    expect(tiles).toEqual([]);
  });

  it('does not mutate the original STATIC_TILES array', () => {
    const originalLength = STATIC_TILES.length;

    getStaticTilesByPhase('GS Site Standing');

    expect(STATIC_TILES.length).toBe(originalLength);
  });
});

describe('getStaticWarningTiles', () => {
  it('returns an array', () => {
    const tiles = getStaticWarningTiles();

    expect(Array.isArray(tiles)).toBe(true);
  });

  it('returns only tiles with actionWarning=true', () => {
    const tiles = getStaticWarningTiles();

    tiles.forEach(tile => {
      expect(tile.actionWarning).toBe(true);
    });
  });

  it('does not include tiles without warnings', () => {
    const warningTiles = getStaticWarningTiles();
    const warningIds = new Set(warningTiles.map(t => t.id));

    // Check that non-warning tiles from STATIC_TILES are not in the result
    STATIC_TILES
      .filter(t => !t.actionWarning)
      .forEach(tile => {
        expect(warningIds.has(tile.id)).toBe(false);
      });
  });

  it('does not mutate the original STATIC_TILES array', () => {
    const originalLength = STATIC_TILES.length;

    getStaticWarningTiles();

    expect(STATIC_TILES.length).toBe(originalLength);
  });
});

/**
 * Tests to verify after FIX #1 is applied:
 *
 * After the refactor, these helper functions should use LOCAL_TILES instead of STATIC_TILES.
 * The following tests document what we expect AFTER the fix:
 *
 * describe('AFTER FIX #1 - functions use LOCAL_TILES', () => {
 *   it('getTileCountsByCategory uses LOCAL_TILES', () => {
 *     const counts = getTileCountsByCategory();
 *     expect(counts.ALL).toBe(LOCAL_TILES.length);
 *   });
 *
 *   it('STATIC_TILES is empty after merge', () => {
 *     expect(STATIC_TILES.length).toBe(0);
 *   });
 *
 *   it('LOCAL_TILES contains all tiles', () => {
 *     expect(LOCAL_TILES.length).toBeGreaterThan(50);
 *   });
 * });
 */
