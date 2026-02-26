/**
 * Reconciled Analysis Outputs — Confidence-Graded Value Estimates
 *
 * Phase 1 Milestone 3: Grounds income/value estimates in actual comp data
 * rather than relying solely on predetermined multiplier tables.
 *
 * Key improvements over existing NOI analyses (21-22):
 * 1. Derives market rent from actual lease comps (when available)
 * 2. Cross-references modeled NOI vs. lease-observed NOI
 * 3. Produces confidence grades (high/medium/low/synthetic)
 * 4. Uses M1 computed metrics + M2 comp scoring for weighted value estimates
 *
 * Does NOT modify existing breakups-generator functions. Augments output only.
 */

import type { PropertyData, ExpectedNOIResult, LeaseVsSaleResult } from '../processing/breakups-generator'
import type { ScoredComp, CompTier } from './comp-scoring'
import type { BreakupsComputedMetrics } from './computed-metrics'

// ─── Types ──────────────────────────────────────────────────

/**
 * Confidence grade for a value estimate.
 * - high: derived from ≥3 closed comps with strong similarity scores
 * - medium: derived from 1-2 closed comps or weaker similarity
 * - low: derived from pending/active comps only, or very weak similarity
 * - synthetic: modeled from multiplier table with no lease comp validation
 */
export type ConfidenceGrade = 'high' | 'medium' | 'low' | 'synthetic'

/**
 * Market-derived rental estimate from actual lease comps.
 */
export interface MarketRentEstimate {
  /** Estimated monthly rent based on comparable lease data */
  monthlyRent: number
  /** Annual rent (monthlyRent × 12) */
  annualRent: number
  /** Rent per sqft per month */
  rentPerSqFtMonthly: number
  /** Number of lease comps used */
  leaseCompCount: number
  /** Average similarity score of lease comps used (0-100) */
  avgCompScore: number
  /** Confidence in this estimate */
  confidence: ConfidenceGrade
  /** How the estimate was derived */
  method: 'comp-weighted' | 'comp-average' | 'synthetic-multiplier'
}

/**
 * Reconciled NOI that compares modeled vs. market-based estimates.
 */
export interface ReconciledNOI {
  /** NOI from the existing multiplier table (analysis 21) */
  modeledNOI: number
  /** NOI from market-derived lease data */
  marketNOI: number | null
  /** Reconciled (best estimate) NOI */
  reconciledNOI: number
  /** Reconciled cap rate */
  reconciledCapRate: number | null
  /** Confidence in the reconciled estimate */
  confidence: ConfidenceGrade
  /** Divergence between modeled and market estimates (percentage) */
  divergence: number | null
  /** Source of the reconciled value */
  source: 'market' | 'blended' | 'modeled'
  /** Explanation */
  explanation: string
}

/**
 * Reconciled value estimate for a subject property.
 */
export interface ReconciledValueEstimate {
  /** Weighted average sale price from scored comps */
  compWeightedValue: number | null
  /** Median sale price from primary-tier comps */
  primaryCompMedian: number | null
  /** Income approach value (reconciledNOI / capRate) */
  incomeApproachValue: number | null
  /** Final reconciled value (blended) */
  reconciledValue: number | null
  /** Confidence in the final estimate */
  confidence: ConfidenceGrade
  /** Value range (low–high) */
  range: { low: number; high: number } | null
  /** Approaches used and their contributions */
  approaches: ValueApproach[]
}

interface ValueApproach {
  name: 'sales-comparison' | 'income' | 'cost'
  value: number | null
  weight: number
  confidence: ConfidenceGrade
  compCount: number
}

/**
 * Complete reconciled output for a subject property.
 * Augments (does not replace) the existing BreakupsAnalysisResult.
 */
export interface ReconciliationResult {
  marketRent: MarketRentEstimate
  reconciledNOI: ReconciledNOI
  valueEstimate: ReconciledValueEstimate
  diagnostics: ReconciliationDiagnostics
}

interface ReconciliationDiagnostics {
  /** Total comps scored */
  totalCompsScored: number
  /** Comps by tier */
  compsByTier: Record<CompTier, number>
  /** Lease comps available */
  leaseCompsAvailable: number
  /** Sale comps available (status C) */
  saleCompsAvailable: number
  /** Whether market rent could be derived */
  hasMarketRent: boolean
  /** Whether existing NOI analysis was available for comparison */
  hasModeledNOI: boolean
}

// ─── Constants ──────────────────────────────────────────────

/** Operating expense ratio (consistent with existing analysis 21) */
const OPERATING_EXPENSE_RATIO = 0.35

/** Cap rate assumption for income approach value (consistent with existing insights) */
const DEFAULT_CAP_RATE = 0.065

/** Minimum lease comps for 'high' confidence rent estimate */
const HIGH_CONFIDENCE_LEASE_COMPS = 3

/** Minimum average comp score for 'high' confidence */
const HIGH_CONFIDENCE_MIN_SCORE = 60

/** Divergence threshold above which we flag a discrepancy (25%) */
const DIVERGENCE_WARNING_THRESHOLD = 0.25

// ─── Market Rent Estimation ─────────────────────────────────

/**
 * Derive a market rent estimate from actual lease comp data.
 *
 * Uses two methods depending on available data:
 * 1. comp-weighted: Weights each lease comp's rent by its similarity score
 * 2. comp-average: Simple average if no scores available
 * 3. synthetic-multiplier: Falls back to modeled estimate if no lease comps
 *
 * @param subject - Subject property
 * @param leaseComps - Lease properties (IS_RENTAL = 'Y', STATUS = 'C')
 * @param compScores - Optional M2 similarity scores for lease comps
 * @param modeledNOI - Existing modeled NOI from analysis 21 (fallback)
 */
export function estimateMarketRent(
  subject: PropertyData,
  leaseComps: PropertyData[],
  compScores?: Map<string, ScoredComp>,
  modeledNOI?: ExpectedNOIResult
): MarketRentEstimate {
  // Filter to closed lease comps with valid rent
  const validLeases = leaseComps.filter(
    lc => lc.IS_RENTAL === 'Y' && lc.STATUS === 'C' && lc.SALE_PRICE > 0
  )

  if (validLeases.length === 0) {
    // No lease comps — fall back to modeled
    const monthlyRent = modeledNOI?.monthlyRent ?? 0
    return {
      monthlyRent,
      annualRent: monthlyRent * 12,
      rentPerSqFtMonthly: subject.SQFT > 0 ? round2(monthlyRent / subject.SQFT) : 0,
      leaseCompCount: 0,
      avgCompScore: 0,
      confidence: 'synthetic',
      method: 'synthetic-multiplier',
    }
  }

  // Try comp-weighted approach if scores are available
  if (compScores && compScores.size > 0) {
    const weighted = computeWeightedRent(validLeases, subject, compScores)
    if (weighted) return weighted
  }

  // Fallback: simple sqft-based average
  const rentPerSqFtValues = validLeases
    .filter(lc => lc.SQFT > 0)
    .map(lc => lc.SALE_PRICE / lc.SQFT)

  if (rentPerSqFtValues.length > 0 && subject.SQFT > 0) {
    const avgRentPerSqFt = rentPerSqFtValues.reduce((a, b) => a + b, 0) / rentPerSqFtValues.length
    const monthlyRent = round2(avgRentPerSqFt * subject.SQFT)
    const confidence = gradeLeaseConfidence(validLeases.length, 0)

    return {
      monthlyRent,
      annualRent: round2(monthlyRent * 12),
      rentPerSqFtMonthly: round2(avgRentPerSqFt),
      leaseCompCount: validLeases.length,
      avgCompScore: 0,
      confidence,
      method: 'comp-average',
    }
  }

  // Last resort: average raw rent
  const avgRent = validLeases.reduce((sum, lc) => sum + lc.SALE_PRICE, 0) / validLeases.length
  return {
    monthlyRent: round2(avgRent),
    annualRent: round2(avgRent * 12),
    rentPerSqFtMonthly: subject.SQFT > 0 ? round2(avgRent / subject.SQFT) : 0,
    leaseCompCount: validLeases.length,
    avgCompScore: 0,
    confidence: gradeLeaseConfidence(validLeases.length, 0),
    method: 'comp-average',
  }
}

/** Compute score-weighted rent estimate */
function computeWeightedRent(
  leaseComps: PropertyData[],
  subject: PropertyData,
  compScores: Map<string, ScoredComp>
): MarketRentEstimate | null {
  const scoredLeases: Array<{ rent: number; score: number; sqft: number }> = []

  for (const lc of leaseComps) {
    const key = lc.APN || lc.FULL_ADDRESS
    const compScore = compScores.get(key)
    if (!compScore || compScore.overallScore === 0) continue

    scoredLeases.push({
      rent: lc.SALE_PRICE, // monthly rent (polymorphic SALE_PRICE)
      score: compScore.overallScore,
      sqft: lc.SQFT,
    })
  }

  if (scoredLeases.length === 0) return null

  // Weight by similarity score
  const totalWeight = scoredLeases.reduce((sum, sl) => sum + sl.score, 0)
  const avgCompScore = Math.round(totalWeight / scoredLeases.length)

  if (subject.SQFT > 0) {
    // Sqft-normalized weighted average
    const weightedRentPerSqFt = scoredLeases
      .filter(sl => sl.sqft > 0)
      .reduce((sum, sl) => sum + (sl.rent / sl.sqft) * (sl.score / totalWeight), 0)

    if (weightedRentPerSqFt > 0) {
      const monthlyRent = round2(weightedRentPerSqFt * subject.SQFT)
      return {
        monthlyRent,
        annualRent: round2(monthlyRent * 12),
        rentPerSqFtMonthly: round2(weightedRentPerSqFt),
        leaseCompCount: scoredLeases.length,
        avgCompScore,
        confidence: gradeLeaseConfidence(scoredLeases.length, avgCompScore),
        method: 'comp-weighted',
      }
    }
  }

  // Raw weighted average if sqft normalization fails
  const weightedRent = scoredLeases.reduce(
    (sum, sl) => sum + sl.rent * (sl.score / totalWeight),
    0
  )
  const monthlyRent = round2(weightedRent)

  return {
    monthlyRent,
    annualRent: round2(monthlyRent * 12),
    rentPerSqFtMonthly: subject.SQFT > 0 ? round2(monthlyRent / subject.SQFT) : 0,
    leaseCompCount: scoredLeases.length,
    avgCompScore,
    confidence: gradeLeaseConfidence(scoredLeases.length, avgCompScore),
    method: 'comp-weighted',
  }
}

// ─── Reconciled NOI ─────────────────────────────────────────

/**
 * Reconcile modeled NOI (analysis 21) with market-derived rental estimates.
 *
 * Three outcomes:
 * 1. 'market': sufficient lease comps → use market-derived NOI
 * 2. 'blended': some lease comps → blend market + modeled
 * 3. 'modeled': no lease comps → use modeled NOI with 'synthetic' confidence
 */
export function reconcileNOI(
  marketRent: MarketRentEstimate,
  modeledNOI: ExpectedNOIResult | null,
  subjectPrice: number
): ReconciledNOI {
  const modeledAnnualNOI = modeledNOI?.annualNOI ?? 0

  // Market-based NOI
  let marketNOI: number | null = null
  if (marketRent.method !== 'synthetic-multiplier' && marketRent.annualRent > 0) {
    const grossIncome = marketRent.annualRent
    const opex = grossIncome * OPERATING_EXPENSE_RATIO
    marketNOI = round2(grossIncome - opex)
  }

  // Determine reconciled value
  let reconciledNOI: number
  let source: 'market' | 'blended' | 'modeled'
  let confidence: ConfidenceGrade
  let explanation: string

  if (marketNOI !== null && marketRent.confidence === 'high') {
    // High-confidence market data — use it
    reconciledNOI = marketNOI
    source = 'market'
    confidence = 'high'
    explanation = `Market-derived NOI from ${marketRent.leaseCompCount} lease comps (avg score ${marketRent.avgCompScore}/100)`
  } else if (marketNOI !== null && modeledAnnualNOI > 0) {
    // Some market data — blend 60% market / 40% modeled
    const marketWeight = marketRent.confidence === 'medium' ? 0.6 : 0.4
    reconciledNOI = round2(marketNOI * marketWeight + modeledAnnualNOI * (1 - marketWeight))
    source = 'blended'
    confidence = marketRent.confidence === 'medium' ? 'medium' : 'low'
    explanation = `Blended NOI: ${Math.round(marketWeight * 100)}% market (${marketRent.leaseCompCount} comps) + ${Math.round((1 - marketWeight) * 100)}% modeled`
  } else {
    // No market data — modeled only
    reconciledNOI = modeledAnnualNOI
    source = 'modeled'
    confidence = 'synthetic'
    explanation = 'Modeled NOI only — no lease comps available for market validation'
  }

  // Cap rate
  const reconciledCapRate = subjectPrice > 0 ? round4(reconciledNOI / subjectPrice) : null

  // Divergence between modeled and market
  let divergence: number | null = null
  if (marketNOI !== null && modeledAnnualNOI > 0) {
    divergence = round4((marketNOI - modeledAnnualNOI) / modeledAnnualNOI)
    if (Math.abs(divergence) > DIVERGENCE_WARNING_THRESHOLD) {
      explanation += ` — WARNING: ${Math.round(Math.abs(divergence) * 100)}% divergence between market and modeled`
    }
  }

  return {
    modeledNOI: modeledAnnualNOI,
    marketNOI,
    reconciledNOI,
    reconciledCapRate,
    confidence,
    divergence,
    source,
    explanation,
  }
}

// ─── Reconciled Value Estimate ──────────────────────────────

/**
 * Produce a reconciled value estimate using multiple approaches.
 *
 * Approaches:
 * 1. Sales comparison: weighted average from scored sale comps
 * 2. Income approach: reconciledNOI / cap rate
 *
 * Cost approach is not implemented (would require improvement cost data).
 */
export function reconcileValue(
  saleComps: Array<PropertyData & { compScore: ScoredComp }>,
  reconciledNOI: ReconciledNOI,
  capRateOverride?: number
): ReconciledValueEstimate {
  const approaches: ValueApproach[] = []

  // ── Sales comparison approach ──
  const closedComps = saleComps.filter(c => c.STATUS === 'C' && c.SALE_PRICE > 0 && c.IS_RENTAL !== 'Y')
  let compWeightedValue: number | null = null
  let primaryCompMedian: number | null = null

  if (closedComps.length > 0) {
    // Score-weighted value
    const totalScore = closedComps.reduce((sum, c) => sum + c.compScore.overallScore, 0)
    if (totalScore > 0) {
      compWeightedValue = round2(
        closedComps.reduce(
          (sum, c) => sum + c.SALE_PRICE * (c.compScore.overallScore / totalScore),
          0
        )
      )
    }

    // Primary tier median
    const primaryComps = closedComps
      .filter(c => c.compScore.tier === 'primary')
      .map(c => c.SALE_PRICE)
      .sort((a, b) => a - b)

    if (primaryComps.length > 0) {
      const mid = Math.floor(primaryComps.length / 2)
      primaryCompMedian = primaryComps.length % 2 === 0
        ? round2((primaryComps[mid - 1] + primaryComps[mid]) / 2)
        : primaryComps[mid]
    }

    const salesConfidence = gradeSalesConfidence(closedComps.length, closedComps)
    approaches.push({
      name: 'sales-comparison',
      value: compWeightedValue,
      weight: salesConfidence === 'high' ? 0.7 : salesConfidence === 'medium' ? 0.6 : 0.4,
      confidence: salesConfidence,
      compCount: closedComps.length,
    })
  }

  // ── Income approach ──
  let incomeApproachValue: number | null = null
  const capRate = capRateOverride ?? reconciledNOI.reconciledCapRate ?? DEFAULT_CAP_RATE

  if (reconciledNOI.reconciledNOI > 0 && capRate > 0) {
    incomeApproachValue = round2(reconciledNOI.reconciledNOI / capRate)
    approaches.push({
      name: 'income',
      value: incomeApproachValue,
      weight: reconciledNOI.confidence === 'high' ? 0.5 : reconciledNOI.confidence === 'medium' ? 0.3 : 0.2,
      confidence: reconciledNOI.confidence,
      compCount: 0,
    })
  }

  // ── Blend approaches ──
  let reconciledValue: number | null = null
  let range: { low: number; high: number } | null = null
  let overallConfidence: ConfidenceGrade = 'synthetic'

  if (approaches.length > 0) {
    // Normalize weights
    const totalWeight = approaches.reduce((sum, a) => sum + (a.value !== null ? a.weight : 0), 0)
    if (totalWeight > 0) {
      reconciledValue = round2(
        approaches.reduce(
          (sum, a) => sum + (a.value ?? 0) * (a.weight / totalWeight),
          0
        )
      )

      // Range: ±10% for high confidence, ±20% for medium, ±30% for low
      const bestConfidence = approaches
        .filter(a => a.value !== null)
        .sort((a, b) => confidenceRank(b.confidence) - confidenceRank(a.confidence))[0]

      overallConfidence = bestConfidence?.confidence ?? 'synthetic'
      const rangeMultiplier = overallConfidence === 'high' ? 0.10
        : overallConfidence === 'medium' ? 0.20
        : overallConfidence === 'low' ? 0.30
        : 0.40

      range = {
        low: round2(reconciledValue * (1 - rangeMultiplier)),
        high: round2(reconciledValue * (1 + rangeMultiplier)),
      }
    }
  }

  return {
    compWeightedValue,
    primaryCompMedian,
    incomeApproachValue,
    reconciledValue,
    confidence: overallConfidence,
    range,
    approaches,
  }
}

// ─── Full Reconciliation Orchestrator ───────────────────────

/**
 * Run the full reconciliation pipeline for a subject property.
 *
 * This is the main entry point for M3. It takes:
 * - Subject property (from Analysis sheet)
 * - All properties (sale + lease)
 * - Comp scores from M2 (optional)
 * - Existing modeled NOI from analysis 21 (optional)
 *
 * Returns a ReconciliationResult that augments the existing breakups output.
 */
export function reconcileAnalysis(
  subject: PropertyData,
  allProperties: PropertyData[],
  saleCompScores?: Array<PropertyData & { compScore: ScoredComp }>,
  modeledNOI?: ExpectedNOIResult
): ReconciliationResult {
  const leaseComps = allProperties.filter(p => p.IS_RENTAL === 'Y')
  const saleComps = allProperties.filter(p => p.IS_RENTAL !== 'Y' && p.STATUS === 'C')

  // Build score lookup for lease comps
  const scoreMap = new Map<string, ScoredComp>()
  if (saleCompScores) {
    for (const sc of saleCompScores) {
      scoreMap.set(sc.APN || sc.FULL_ADDRESS, sc.compScore)
    }
  }

  // Step 1: Market rent estimation
  const marketRent = estimateMarketRent(subject, leaseComps, scoreMap, modeledNOI)

  // Step 2: Reconcile NOI
  const subjectPrice = subject.SALE_PRICE > 0 ? subject.SALE_PRICE : subject.OG_LIST_PRICE
  const reconciledNOI = reconcileNOI(marketRent, modeledNOI ?? null, subjectPrice)

  // Step 3: Reconcile value
  const scoredSaleComps = saleCompScores
    ?? allProperties
      .filter(p => p.IS_RENTAL !== 'Y' && p.STATUS === 'C' && p.SALE_PRICE > 0)
      .map(p => ({
        ...p,
        compScore: {
          overallScore: 50, // default middle score if no M2 scores
          tier: 'supporting' as CompTier,
          factors: { distance: null, price: null, sqft: null, age: null, bedBath: null, features: null },
          factorsAvailable: 0,
          factorsTotal: 6,
          explanation: 'Default score — no M2 scoring applied',
        },
      }))

  const valueEstimate = reconcileValue(scoredSaleComps, reconciledNOI)

  // Diagnostics
  const compsByTier: Record<CompTier, number> = { primary: 0, supporting: 0, context: 0 }
  for (const sc of scoredSaleComps) {
    compsByTier[sc.compScore.tier]++
  }

  return {
    marketRent,
    reconciledNOI,
    valueEstimate,
    diagnostics: {
      totalCompsScored: scoredSaleComps.length,
      compsByTier,
      leaseCompsAvailable: leaseComps.filter(lc => lc.STATUS === 'C' && lc.SALE_PRICE > 0).length,
      saleCompsAvailable: saleComps.filter(sc => sc.SALE_PRICE > 0).length,
      hasMarketRent: marketRent.method !== 'synthetic-multiplier',
      hasModeledNOI: !!modeledNOI && modeledNOI.annualNOI > 0,
    },
  }
}

// ─── Utilities (private) ────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000
}

function gradeLeaseConfidence(compCount: number, avgScore: number): ConfidenceGrade {
  if (compCount >= HIGH_CONFIDENCE_LEASE_COMPS && avgScore >= HIGH_CONFIDENCE_MIN_SCORE) {
    return 'high'
  }
  if (compCount >= 2) return 'medium'
  if (compCount >= 1) return 'low'
  return 'synthetic'
}

function gradeSalesConfidence(
  compCount: number,
  comps: Array<{ compScore: ScoredComp }>
): ConfidenceGrade {
  const primaryCount = comps.filter(c => c.compScore.tier === 'primary').length
  if (primaryCount >= 3) return 'high'
  if (primaryCount >= 1 || compCount >= 3) return 'medium'
  if (compCount >= 1) return 'low'
  return 'synthetic'
}

function confidenceRank(grade: ConfidenceGrade): number {
  switch (grade) {
    case 'high': return 3
    case 'medium': return 2
    case 'low': return 1
    case 'synthetic': return 0
  }
}
