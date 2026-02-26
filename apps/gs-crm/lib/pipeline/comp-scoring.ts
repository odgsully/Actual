/**
 * Comp Scoring — Weighted Similarity Engine for Comparable Property Ranking
 *
 * Phase 1 Milestone 2: Produces deterministic, explainable comp rankings.
 *
 * Two contexts supported:
 * 1. MLSRow + SubjectProperty (MLS pipeline)
 * 2. PropertyData subject + PropertyData[] comps (breakups pipeline)
 *
 * Algorithm:
 *   Each comp is scored against a subject across 6 factors (0–1 each).
 *   Factors are weighted and combined into a 0–100 overall score.
 *   Comps are then tiered as primary (≥70), supporting (≥40), or context (<40).
 *   Ranking is deterministic: ties broken by higher factor count, then MLS number.
 */

import type { MLSRow, SubjectProperty } from '../types/mls-data'
import type { PropertyData } from '../processing/breakups-generator'

// ─── Types ──────────────────────────────────────────────────

/** Individual factor scores, each 0–1 */
export interface SimilarityFactors {
  /** Proximity: 1.0 = same location, 0.0 = at or beyond max distance */
  distance: number | null
  /** Price similarity: 1.0 = identical price, 0.0 = ≥100% deviation */
  price: number | null
  /** Square footage similarity: 1.0 = identical sqft, 0.0 = ≥100% deviation */
  sqft: number | null
  /** Age similarity: 1.0 = same year built, 0.0 = ≥30yr difference */
  age: number | null
  /** Bedroom/bathroom match: 1.0 = exact, 0.5 = ±1, 0.0 = ±3+ */
  bedBath: number | null
  /** Feature match: pool, garage, HOA match rate */
  features: number | null
}

/** Comp tier based on overall score */
export type CompTier = 'primary' | 'supporting' | 'context'

/** Scored comparable with full explainability */
export interface ScoredComp {
  /** Overall similarity score 0–100 */
  overallScore: number
  /** Comp tier classification */
  tier: CompTier
  /** Factor-level scores */
  factors: SimilarityFactors
  /** Which factors contributed (had non-null inputs) */
  factorsAvailable: number
  /** Total factors possible */
  factorsTotal: number
  /** Human-readable explanation of score */
  explanation: string
}

/** Configurable weights for each factor (must sum to 1.0) */
export interface ScoringWeights {
  distance: number
  price: number
  sqft: number
  age: number
  bedBath: number
  features: number
}

/** Configuration for the scoring engine */
export interface ScoringConfig {
  weights: ScoringWeights
  /** Max distance in miles where score = 0 (default: 3.0) */
  maxDistance: number
  /** Max age difference in years where score = 0 (default: 30) */
  maxAgeDiff: number
  /** Tier thresholds */
  primaryThreshold: number
  supportingThreshold: number
}

/** Result of ranking a batch of comps */
export interface RankedComps<T> {
  /** Comps sorted by overallScore descending (deterministic) */
  ranked: Array<T & { compScore: ScoredComp }>
  /** Count by tier */
  tierCounts: Record<CompTier, number>
  /** Summary statistics */
  summary: {
    avgScore: number
    medianScore: number
    totalScored: number
    factorCoverage: Record<keyof SimilarityFactors, number>
  }
}

// ─── Default Configuration ──────────────────────────────────

export const DEFAULT_WEIGHTS: ScoringWeights = {
  distance: 0.25,
  price: 0.20,
  sqft: 0.20,
  age: 0.15,
  bedBath: 0.10,
  features: 0.10,
}

export const DEFAULT_CONFIG: ScoringConfig = {
  weights: DEFAULT_WEIGHTS,
  maxDistance: 3.0,
  maxAgeDiff: 30,
  primaryThreshold: 70,
  supportingThreshold: 40,
}

// ─── Factor Scoring Functions ───────────────────────────────

/**
 * Distance score: linear decay from 1.0 (same location) to 0.0 (at maxDistance).
 * Returns null if distance is unavailable.
 */
export function scoreDistance(
  distanceMiles: number | null | undefined,
  maxDistance: number = DEFAULT_CONFIG.maxDistance
): number | null {
  if (distanceMiles === null || distanceMiles === undefined || !isFinite(distanceMiles)) {
    return null
  }
  if (distanceMiles <= 0) return 1.0
  if (distanceMiles >= maxDistance) return 0.0
  return round4(1.0 - distanceMiles / maxDistance)
}

/**
 * Price similarity: 1.0 = identical, decays linearly to 0.0 at ≥100% deviation.
 * Returns null if either price is unavailable/zero.
 */
export function scorePriceSimilarity(
  compPrice: number | null | undefined,
  subjectPrice: number | null | undefined
): number | null {
  if (!compPrice || !subjectPrice || compPrice <= 0 || subjectPrice <= 0) {
    return null
  }
  const deviation = Math.abs(compPrice - subjectPrice) / subjectPrice
  if (deviation >= 1.0) return 0.0
  return round4(1.0 - deviation)
}

/**
 * Square footage similarity: 1.0 = identical, decays linearly to 0.0 at ≥100% deviation.
 * Returns null if either sqft is unavailable/zero.
 */
export function scoreSqftSimilarity(
  compSqft: number | null | undefined,
  subjectSqft: number | null | undefined
): number | null {
  if (!compSqft || !subjectSqft || compSqft <= 0 || subjectSqft <= 0) {
    return null
  }
  const deviation = Math.abs(compSqft - subjectSqft) / subjectSqft
  if (deviation >= 1.0) return 0.0
  return round4(1.0 - deviation)
}

/**
 * Age similarity: 1.0 = same year built, decays to 0.0 at maxAgeDiff years apart.
 * Returns null if either year is unavailable/zero.
 */
export function scoreAgeSimilarity(
  compYear: number | null | undefined,
  subjectYear: number | null | undefined,
  maxAgeDiff: number = DEFAULT_CONFIG.maxAgeDiff
): number | null {
  if (!compYear || !subjectYear || compYear <= 0 || subjectYear <= 0) {
    return null
  }
  const diff = Math.abs(compYear - subjectYear)
  if (diff >= maxAgeDiff) return 0.0
  return round4(1.0 - diff / maxAgeDiff)
}

/**
 * Bedroom/bathroom match:
 *   Exact match on both = 1.0
 *   ±1 on either = 0.7 (still a good comp)
 *   ±2 on either = 0.3
 *   ±3+ on either = 0.0
 * Returns null if either bed or bath count is unavailable.
 */
export function scoreBedBathMatch(
  compBed: number | null | undefined,
  compBath: number | null | undefined,
  subjectBed: number | null | undefined,
  subjectBath: number | null | undefined
): number | null {
  if (
    compBed === null || compBed === undefined ||
    compBath === null || compBath === undefined ||
    subjectBed === null || subjectBed === undefined ||
    subjectBath === null || subjectBath === undefined
  ) {
    return null
  }
  const bedDiff = Math.abs(compBed - subjectBed)
  const bathDiff = Math.abs(compBath - subjectBath)
  const maxDiff = Math.max(bedDiff, bathDiff)

  if (maxDiff === 0) return 1.0
  if (maxDiff === 1) return 0.7
  if (maxDiff === 2) return 0.3
  return 0.0
}

/**
 * Feature match: proportion of boolean features that match the subject.
 * Compares: pool, garage (>0), HOA.
 * Returns null if insufficient feature data.
 */
export function scoreFeatureMatch(
  comp: { pool: boolean; garageSpaces: number; hoa: boolean },
  subject: { pool: boolean; garageSpaces: number; hoa: boolean }
): number | null {
  let matches = 0
  let total = 3

  if (comp.pool === subject.pool) matches++
  if ((comp.garageSpaces > 0) === (subject.garageSpaces > 0)) matches++
  if (comp.hoa === subject.hoa) matches++

  return round4(matches / total)
}

// ─── MLS Context Scoring ────────────────────────────────────

/** Subject descriptor extracted from MLSRow or SubjectProperty */
interface SubjectDescriptor {
  latitude?: number | null
  longitude?: number | null
  price?: number | null
  squareFeet?: number | null
  yearBuilt?: number | null
  bedrooms?: number | null
  bathrooms?: number | null
  pool?: boolean
  garageSpaces?: number
  hoa?: boolean
}

/**
 * Score a single MLSRow against a subject.
 * Uses the comp's distance field if pre-computed, otherwise computes from coordinates.
 */
export function scoreMLSComp(
  comp: MLSRow,
  subject: SubjectDescriptor,
  config: ScoringConfig = DEFAULT_CONFIG
): ScoredComp {
  const factors: SimilarityFactors = {
    distance: scoreDistance(comp.distance, config.maxDistance),
    price: scorePriceSimilarity(comp.salePrice ?? comp.listPrice, subject.price),
    sqft: scoreSqftSimilarity(comp.squareFeet, subject.squareFeet),
    age: scoreAgeSimilarity(comp.yearBuilt, subject.yearBuilt, config.maxAgeDiff),
    bedBath: scoreBedBathMatch(comp.bedrooms, comp.bathrooms, subject.bedrooms, subject.bathrooms),
    features: (subject.pool !== undefined && subject.garageSpaces !== undefined && subject.hoa !== undefined)
      ? scoreFeatureMatch(comp, subject as { pool: boolean; garageSpaces: number; hoa: boolean })
      : null,
  }

  return buildScoredComp(factors, config)
}

/**
 * Score and rank a batch of MLSRows against a subject.
 * Returns deterministically ranked results.
 */
export function rankMLSComps(
  comps: MLSRow[],
  subject: SubjectDescriptor,
  config: ScoringConfig = DEFAULT_CONFIG
): RankedComps<MLSRow> {
  const scored = comps.map(comp => ({
    ...comp,
    compScore: scoreMLSComp(comp, subject, config),
  }))

  return buildRankedResult(scored, s => s.mlsNumber)
}

// ─── Breakups Context Scoring ───────────────────────────────

/**
 * Score a single PropertyData comp against a subject PropertyData.
 * Handles the breakups-specific field names.
 */
export function scoreBreakupsComp(
  comp: PropertyData,
  subject: PropertyData,
  config: ScoringConfig = DEFAULT_CONFIG
): ScoredComp {
  // Distance from lat/lon if available
  let distanceMiles: number | null = null
  const compLat = typeof comp.LAT === 'number' ? comp.LAT : parseFloat(String(comp.LAT))
  const compLon = typeof comp.LON === 'number' ? comp.LON : parseFloat(String(comp.LON))
  const subjLat = typeof subject.LAT === 'number' ? subject.LAT : parseFloat(String(subject.LAT))
  const subjLon = typeof subject.LON === 'number' ? subject.LON : parseFloat(String(subject.LON))

  if (isFinite(compLat) && isFinite(compLon) && isFinite(subjLat) && isFinite(subjLon)) {
    distanceMiles = haversineDistance(subjLat, subjLon, compLat, compLon)
  }

  const factors: SimilarityFactors = {
    distance: scoreDistance(distanceMiles, config.maxDistance),
    price: scorePriceSimilarity(comp.SALE_PRICE, subject.SALE_PRICE || subject.OG_LIST_PRICE),
    sqft: scoreSqftSimilarity(comp.SQFT, subject.SQFT),
    age: scoreAgeSimilarity(comp.YEAR_BUILT, subject.YEAR_BUILT, config.maxAgeDiff),
    bedBath: scoreBedBathMatch(comp.BR, comp.BA, subject.BR, subject.BA),
    features: null, // PropertyData doesn't carry pool/garage/HOA booleans directly
  }

  return buildScoredComp(factors, config)
}

/**
 * Score and rank a batch of PropertyData comps against a subject.
 */
export function rankBreakupsComps(
  comps: PropertyData[],
  subject: PropertyData,
  config: ScoringConfig = DEFAULT_CONFIG
): RankedComps<PropertyData> {
  const scored = comps.map(comp => ({
    ...comp,
    compScore: scoreBreakupsComp(comp, subject, config),
  }))

  return buildRankedResult(scored, s => s.APN || s.FULL_ADDRESS)
}

// ─── Internal Helpers ───────────────────────────────────────

/**
 * Combine factor scores into a ScoredComp using weighted average.
 * Factors with null scores are excluded — their weight is redistributed
 * proportionally to available factors.
 */
function buildScoredComp(
  factors: SimilarityFactors,
  config: ScoringConfig
): ScoredComp {
  const { weights } = config
  const factorEntries: Array<{
    key: keyof SimilarityFactors
    score: number | null
    weight: number
  }> = [
    { key: 'distance', score: factors.distance, weight: weights.distance },
    { key: 'price', score: factors.price, weight: weights.price },
    { key: 'sqft', score: factors.sqft, weight: weights.sqft },
    { key: 'age', score: factors.age, weight: weights.age },
    { key: 'bedBath', score: factors.bedBath, weight: weights.bedBath },
    { key: 'features', score: factors.features, weight: weights.features },
  ]

  // Separate available and unavailable factors
  const available = factorEntries.filter(e => e.score !== null)
  const totalAvailableWeight = available.reduce((sum, e) => sum + e.weight, 0)

  let overallScore = 0
  if (totalAvailableWeight > 0) {
    // Redistribute weights proportionally across available factors
    const weightedSum = available.reduce(
      (sum, e) => sum + e.score! * (e.weight / totalAvailableWeight),
      0
    )
    overallScore = Math.round(weightedSum * 100)
  }

  // Clamp to 0-100
  overallScore = Math.max(0, Math.min(100, overallScore))

  const tier = classifyTier(overallScore, config)
  const explanation = buildExplanation(factors, overallScore, tier, available.length, factorEntries.length)

  return {
    overallScore,
    tier,
    factors,
    factorsAvailable: available.length,
    factorsTotal: factorEntries.length,
    explanation,
  }
}

/** Classify a score into a tier */
function classifyTier(score: number, config: ScoringConfig): CompTier {
  if (score >= config.primaryThreshold) return 'primary'
  if (score >= config.supportingThreshold) return 'supporting'
  return 'context'
}

/** Build a human-readable explanation */
function buildExplanation(
  factors: SimilarityFactors,
  overallScore: number,
  tier: CompTier,
  available: number,
  total: number
): string {
  const parts: string[] = []

  if (factors.distance !== null) {
    parts.push(`distance: ${pct(factors.distance)}`)
  }
  if (factors.price !== null) {
    parts.push(`price: ${pct(factors.price)}`)
  }
  if (factors.sqft !== null) {
    parts.push(`sqft: ${pct(factors.sqft)}`)
  }
  if (factors.age !== null) {
    parts.push(`age: ${pct(factors.age)}`)
  }
  if (factors.bedBath !== null) {
    parts.push(`bed/bath: ${pct(factors.bedBath)}`)
  }
  if (factors.features !== null) {
    parts.push(`features: ${pct(factors.features)}`)
  }

  const factorStr = parts.length > 0 ? parts.join(', ') : 'no factors available'
  return `Score ${overallScore}/100 (${tier}) — ${available}/${total} factors: ${factorStr}`
}

/** Format a 0-1 score as percentage string */
function pct(score: number): string {
  return `${Math.round(score * 100)}%`
}

/**
 * Sort scored items deterministically and build the RankedComps result.
 * Tiebreak: higher factorsAvailable → lexicographic ID.
 */
function buildRankedResult<T>(
  scored: Array<T & { compScore: ScoredComp }>,
  getId: (item: T) => string
): RankedComps<T> {
  // Deterministic sort
  const ranked = [...scored].sort((a, b) => {
    // Primary: higher score first
    if (a.compScore.overallScore !== b.compScore.overallScore) {
      return b.compScore.overallScore - a.compScore.overallScore
    }
    // Tiebreak 1: more factors available = more reliable
    if (a.compScore.factorsAvailable !== b.compScore.factorsAvailable) {
      return b.compScore.factorsAvailable - a.compScore.factorsAvailable
    }
    // Tiebreak 2: lexicographic ID for determinism
    return getId(a as T).localeCompare(getId(b as T))
  })

  // Tier counts
  const tierCounts: Record<CompTier, number> = { primary: 0, supporting: 0, context: 0 }
  for (const item of ranked) {
    tierCounts[item.compScore.tier]++
  }

  // Factor coverage
  const factorCoverage: Record<keyof SimilarityFactors, number> = {
    distance: 0, price: 0, sqft: 0, age: 0, bedBath: 0, features: 0,
  }
  for (const item of ranked) {
    const f = item.compScore.factors
    if (f.distance !== null) factorCoverage.distance++
    if (f.price !== null) factorCoverage.price++
    if (f.sqft !== null) factorCoverage.sqft++
    if (f.age !== null) factorCoverage.age++
    if (f.bedBath !== null) factorCoverage.bedBath++
    if (f.features !== null) factorCoverage.features++
  }

  // Summary stats
  const scores = ranked.map(r => r.compScore.overallScore)
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
  const medianScore = scores.length > 0 ? median(scores) : 0

  return {
    ranked,
    tierCounts,
    summary: {
      avgScore,
      medianScore,
      totalScored: ranked.length,
      factorCoverage,
    },
  }
}

// ─── Utilities ──────────────────────────────────────────────

function round4(n: number): number {
  return Math.round(n * 10000) / 10000
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[mid - 1] + sorted[mid]) / 2)
  }
  return sorted[mid]
}

/** Haversine distance in miles */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c * 100) / 100
}
