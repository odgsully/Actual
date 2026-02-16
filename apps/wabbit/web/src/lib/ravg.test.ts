import { describe, test, expect } from 'vitest'
import {
  calculateRAVG,
  calculateVoteTally,
  type RankingInput,
  type CollaboratorInfo,
  type RAVGConfig,
} from './ravg'

// ── Helpers ────────────────────────────────────────────────────────

function makeConfig(overrides: Partial<RAVGConfig> = {}): RAVGConfig {
  return {
    formula: 'simple_mean',
    memberWeights: {},
    supervisorWeight: 1.0,
    ownerId: 'owner',
    ...overrides,
  }
}

function makeCollabs(...roles: Array<[string, string]>): CollaboratorInfo[] {
  return roles.map(([userId, role]) => ({
    userId,
    role: role as CollaboratorInfo['role'],
  }))
}

// ── simple_mean ────────────────────────────────────────────────────

describe('simple_mean', () => {
  test('3 rankers', () => {
    const rankings: RankingInput[] = [
      { userId: 'a', score: 6 },
      { userId: 'b', score: 8 },
      { userId: 'c', score: 10 },
    ]
    const result = calculateRAVG(rankings, [], makeConfig())
    expect(result.teamRAVG).toBe(8)
    expect(result.rankCount).toBe(3)
  })

  test('single ranker', () => {
    const result = calculateRAVG(
      [{ userId: 'a', score: 7.5 }],
      [],
      makeConfig()
    )
    expect(result.teamRAVG).toBe(7.5)
  })

  test('0 rankers returns 0', () => {
    const result = calculateRAVG([], [], makeConfig())
    expect(result.teamRAVG).toBe(0)
    expect(result.superRAVG).toBeNull()
    expect(result.rankCount).toBe(0)
  })

  test('all same score', () => {
    const rankings = Array.from({ length: 5 }, (_, i) => ({
      userId: `u${i}`,
      score: 5,
    }))
    const result = calculateRAVG(rankings, [], makeConfig())
    expect(result.teamRAVG).toBe(5)
  })
})

// ── weighted_by_role ───────────────────────────────────────────────

describe('weighted_by_role', () => {
  test('owner gets 2x weight', () => {
    const rankings: RankingInput[] = [
      { userId: 'owner', score: 10 },
      { userId: 'contrib', score: 5 },
    ]
    const collabs = makeCollabs(['owner', 'owner'], ['contrib', 'contributor'])
    const config = makeConfig({ formula: 'weighted_by_role' })

    const result = calculateRAVG(rankings, collabs, config)
    // (10*2 + 5*1) / (2+1) = 25/3 ≈ 8.333
    expect(result.teamRAVG).toBeCloseTo(8.333, 2)
  })

  test('no matching collaborator defaults to weight 1', () => {
    const rankings: RankingInput[] = [
      { userId: 'unknown1', score: 4 },
      { userId: 'unknown2', score: 8 },
    ]
    const config = makeConfig({ formula: 'weighted_by_role' })
    const result = calculateRAVG(rankings, [], config)
    // Both default weight 1: (4+8)/2 = 6
    expect(result.teamRAVG).toBe(6)
  })
})

// ── exclude_outliers ───────────────────────────────────────────────

describe('exclude_outliers', () => {
  test('trims top/bottom 10% with 10 rankers', () => {
    // Sorted: 1,2,3,4,5,6,7,8,9,10 → trim 1 from each end → 2..9
    const rankings = Array.from({ length: 10 }, (_, i) => ({
      userId: `u${i}`,
      score: i + 1,
    }))
    const config = makeConfig({ formula: 'exclude_outliers' })
    const result = calculateRAVG(rankings, [], config)
    // (2+3+4+5+6+7+8+9) / 8 = 44/8 = 5.5
    expect(result.teamRAVG).toBe(5.5)
  })

  test('falls back to simple mean with < 3 rankers', () => {
    const rankings: RankingInput[] = [
      { userId: 'a', score: 1 },
      { userId: 'b', score: 10 },
    ]
    const config = makeConfig({ formula: 'exclude_outliers' })
    const result = calculateRAVG(rankings, [], config)
    expect(result.teamRAVG).toBe(5.5)
  })

  test('handles 3 rankers (trims 1 from each end)', () => {
    const rankings: RankingInput[] = [
      { userId: 'a', score: 0 },
      { userId: 'b', score: 5 },
      { userId: 'c', score: 10 },
    ]
    const config = makeConfig({ formula: 'exclude_outliers' })
    const result = calculateRAVG(rankings, [], config)
    // Trim 1 each end → just middle score: 5
    expect(result.teamRAVG).toBe(5)
  })
})

// ── custom weights ─────────────────────────────────────────────────

describe('custom', () => {
  test('applies per-member weight multipliers', () => {
    const rankings: RankingInput[] = [
      { userId: 'a', score: 10 },
      { userId: 'b', score: 5 },
    ]
    const config = makeConfig({
      formula: 'custom',
      memberWeights: { a: 3.0, b: 1.0 },
    })
    const result = calculateRAVG(rankings, [], config)
    // (10*3 + 5*1) / (3+1) = 35/4 = 8.75
    expect(result.teamRAVG).toBe(8.75)
  })

  test('missing weights default to 1', () => {
    const rankings: RankingInput[] = [
      { userId: 'a', score: 8 },
      { userId: 'b', score: 4 },
    ]
    const config = makeConfig({ formula: 'custom', memberWeights: { a: 2.0 } })
    const result = calculateRAVG(rankings, [], config)
    // (8*2 + 4*1) / (2+1) = 20/3 ≈ 6.667
    expect(result.teamRAVG).toBeCloseTo(6.667, 2)
  })

  test('all weights zero falls back to simple mean', () => {
    const rankings: RankingInput[] = [
      { userId: 'a', score: 10 },
      { userId: 'b', score: 2 },
    ]
    const config = makeConfig({
      formula: 'custom',
      memberWeights: { a: 0, b: 0 },
    })
    const result = calculateRAVG(rankings, [], config)
    expect(result.teamRAVG).toBe(6) // simple mean fallback
  })
})

// ── Super RAVG ─────────────────────────────────────────────────────

describe('Super RAVG', () => {
  test('excludes owner from level 1 and applies at level 2', () => {
    const rankings: RankingInput[] = [
      { userId: 'owner', score: 10 },
      { userId: 'u2', score: 6 },
      { userId: 'u3', score: 8 },
    ]
    const config = makeConfig({ supervisorWeight: 2.0, ownerId: 'owner' })
    const result = calculateRAVG(rankings, [], config)

    // Level 1: (6+8)/2 = 7 (owner excluded)
    expect(result.teamRAVG).toBe(7)
    // Level 2: (7 + 10*2) / (1+2) = 27/3 = 9
    expect(result.superRAVG).toBe(9)
  })

  test('owner is only ranker → returns owner score directly', () => {
    const rankings: RankingInput[] = [{ userId: 'owner', score: 8.5 }]
    const config = makeConfig({ supervisorWeight: 3.0, ownerId: 'owner' })
    const result = calculateRAVG(rankings, [], config)

    expect(result.superRAVG).toBe(8.5)
  })

  test('owner has not ranked yet → Super RAVG equals Team RAVG', () => {
    const rankings: RankingInput[] = [
      { userId: 'u1', score: 6 },
      { userId: 'u2', score: 8 },
    ]
    const config = makeConfig({ supervisorWeight: 2.0, ownerId: 'owner' })
    const result = calculateRAVG(rankings, [], config)

    expect(result.teamRAVG).toBe(7)
    expect(result.superRAVG).toBe(7)
  })

  test('inactive when supervisorWeight === 1.0', () => {
    const rankings: RankingInput[] = [
      { userId: 'owner', score: 10 },
      { userId: 'u2', score: 5 },
    ]
    const config = makeConfig({ supervisorWeight: 1.0, ownerId: 'owner' })
    const result = calculateRAVG(rankings, [], config)

    // Owner included in level 1 normally
    expect(result.teamRAVG).toBe(7.5)
    expect(result.superRAVG).toBeNull()
  })
})

// ── Vote Tally ─────────────────────────────────────────────────────

describe('calculateVoteTally', () => {
  test('binary votes', () => {
    const choices = [
      { userId: 'a', choice: 'yes' },
      { userId: 'b', choice: 'no' },
      { userId: 'c', choice: 'yes' },
      { userId: 'd', choice: 'yes' },
    ]
    const result = calculateVoteTally(choices)
    expect(result.tally).toEqual({ yes: 3, no: 1 })
    expect(result.total).toBe(4)
    expect(result.winner).toBe('yes')
  })

  test('quaternary votes', () => {
    const choices = [
      { userId: 'a', choice: 'a' },
      { userId: 'b', choice: 'c' },
      { userId: 'c', choice: 'a' },
      { userId: 'd', choice: 'b' },
    ]
    const result = calculateVoteTally(choices)
    expect(result.tally).toEqual({ a: 2, c: 1, b: 1 })
    expect(result.winner).toBe('a')
  })

  test('tie produces null winner', () => {
    const choices = [
      { userId: 'a', choice: 'yes' },
      { userId: 'b', choice: 'no' },
    ]
    const result = calculateVoteTally(choices)
    expect(result.winner).toBeNull()
  })

  test('empty choices', () => {
    const result = calculateVoteTally([])
    expect(result.tally).toEqual({})
    expect(result.total).toBe(0)
    expect(result.winner).toBeNull()
  })
})
