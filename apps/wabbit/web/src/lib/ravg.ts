import type { CollaboratorRole, RAVGFormula } from '@/types/app'

// ── Types ──────────────────────────────────────────────────────────

export interface RankingInput {
  userId: string
  score: number
}

export interface ChoiceInput {
  userId: string
  choice: string
}

export interface CollaboratorInfo {
  userId: string
  role: CollaboratorRole
}

export interface RAVGConfig {
  formula: RAVGFormula
  memberWeights: Record<string, number>
  supervisorWeight: number
  ownerId: string
}

export interface RAVGResult {
  teamRAVG: number
  superRAVG: number | null
  rankCount: number
  contributors: string[]
}

export interface VoteTallyResult {
  tally: Record<string, number>
  total: number
  winner: string | null
}

// ── RAVG Calculation ───────────────────────────────────────────────

export function calculateRAVG(
  rankings: RankingInput[],
  collaborators: CollaboratorInfo[],
  config: RAVGConfig
): RAVGResult {
  if (rankings.length === 0) {
    return { teamRAVG: 0, superRAVG: null, rankCount: 0, contributors: [] }
  }

  const contributors = rankings.map((r) => r.userId)
  const useSuperRAVG = config.supervisorWeight > 1.0

  // Level 1: Team RAVG
  // When Super RAVG is active, exclude owner from level 1
  const teamRankings = useSuperRAVG
    ? rankings.filter((r) => r.userId !== config.ownerId)
    : rankings

  const teamRAVG =
    teamRankings.length > 0
      ? applyFormula(teamRankings, config.formula, collaborators, config.memberWeights)
      : 0

  // Level 2: Super RAVG
  let superRAVG: number | null = null
  if (useSuperRAVG) {
    const ownerRanking = rankings.find((r) => r.userId === config.ownerId)

    if (teamRankings.length === 0 && ownerRanking) {
      // Owner is the only ranker — return their score directly
      superRAVG = ownerRanking.score
    } else if (ownerRanking) {
      // Weighted combination: (teamRAVG + ownerScore * supervisorWeight) / (1 + supervisorWeight)
      superRAVG =
        (teamRAVG + ownerRanking.score * config.supervisorWeight) /
        (1 + config.supervisorWeight)
    } else {
      // Owner hasn't ranked yet — Super RAVG equals Team RAVG
      superRAVG = teamRAVG
    }
  }

  return {
    teamRAVG,
    superRAVG,
    rankCount: rankings.length,
    contributors,
  }
}

// ── Vote Tally (binary / quaternary) ───────────────────────────────

export function calculateVoteTally(choices: ChoiceInput[]): VoteTallyResult {
  if (choices.length === 0) {
    return { tally: {}, total: 0, winner: null }
  }

  const tally: Record<string, number> = {}
  for (const c of choices) {
    tally[c.choice] = (tally[c.choice] ?? 0) + 1
  }

  let winner: string | null = null
  let maxVotes = 0
  for (const [choice, count] of Object.entries(tally)) {
    if (count > maxVotes) {
      maxVotes = count
      winner = choice
    } else if (count === maxVotes) {
      winner = null // tie — no winner
    }
  }

  return { tally, total: choices.length, winner }
}

// ── Formula Implementations ────────────────────────────────────────

function applyFormula(
  rankings: RankingInput[],
  formula: RAVGFormula,
  collaborators: CollaboratorInfo[],
  memberWeights: Record<string, number>
): number {
  switch (formula) {
    case 'simple_mean':
      return simpleMean(rankings)
    case 'weighted_by_role':
      return weightedByRole(rankings, collaborators)
    case 'exclude_outliers':
      return excludeOutliers(rankings)
    case 'custom':
      return customWeights(rankings, memberWeights)
  }
}

function simpleMean(rankings: RankingInput[]): number {
  const sum = rankings.reduce((acc, r) => acc + r.score, 0)
  return sum / rankings.length
}

function weightedByRole(
  rankings: RankingInput[],
  collaborators: CollaboratorInfo[]
): number {
  let weightedSum = 0
  let totalWeight = 0

  for (const r of rankings) {
    const collab = collaborators.find((c) => c.userId === r.userId)
    const weight = collab?.role === 'owner' ? 2 : 1
    weightedSum += r.score * weight
    totalWeight += weight
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0
}

function excludeOutliers(rankings: RankingInput[]): number {
  // Fall back to simple mean for < 3 rankers (trimming doesn't make sense)
  if (rankings.length < 3) return simpleMean(rankings)

  const sorted = [...rankings].sort((a, b) => a.score - b.score)
  const trimCount = Math.max(1, Math.floor(sorted.length * 0.1))
  const trimmed = sorted.slice(trimCount, sorted.length - trimCount)

  // Safety: if trimming removed everything, fall back
  return trimmed.length > 0 ? simpleMean(trimmed) : simpleMean(rankings)
}

function customWeights(
  rankings: RankingInput[],
  memberWeights: Record<string, number>
): number {
  let weightedSum = 0
  let totalWeight = 0

  for (const r of rankings) {
    const weight = memberWeights[r.userId] ?? 1
    weightedSum += r.score * weight
    totalWeight += weight
  }

  // All weights zero → fall back to simple mean
  return totalWeight > 0 ? weightedSum / totalWeight : simpleMean(rankings)
}
