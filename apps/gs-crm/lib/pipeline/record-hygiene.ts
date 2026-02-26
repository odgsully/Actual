/**
 * Record Hygiene — Status Classification, Deduplication, and Quality Scoring
 *
 * Phase 0.5a: Prevent bad-status and noisy records from contaminating valuation sets.
 * Provides deterministic classification, deduplication, and per-record quality scoring.
 */

import type { MLSRow, MLSStatus } from '../types/mls-data'

// ─── Status Class Policy ────────────────────────────────────

/**
 * Analysis-level status classification.
 * Controls which records are used for valuation vs context vs excluded.
 */
export type StatusClass = 'valuation' | 'supporting' | 'context' | 'excluded'

/**
 * Classify an MLS status code into an analysis class.
 *
 * - valuation: Closed/Sold (C) — used for comp valuation
 * - supporting: Pending (P), Under Contract (U) — supporting market data
 * - context: Active (A) — market context, not for valuation math
 * - excluded: Cancelled (X), Temp Off (T), Withdrawn (W) — excluded from analysis
 */
export function classifyStatus(status: MLSStatus): StatusClass {
  switch (status) {
    case 'C':
      return 'valuation'
    case 'P':
    case 'U':
      return 'supporting'
    case 'A':
      return 'context'
    case 'X':
    case 'T':
    case 'W':
      return 'excluded'
    default:
      return 'excluded'
  }
}

/** Check if a record should be included in valuation analysis */
export function isValuationRecord(row: MLSRow): boolean {
  return classifyStatus(row.status) === 'valuation'
}

/** Check if a record should be excluded from all analysis */
export function isExcludedRecord(row: MLSRow): boolean {
  return classifyStatus(row.status) === 'excluded'
}

/**
 * Filter records by status class. Returns only records matching the given classes.
 */
export function filterByStatusClass(rows: MLSRow[], classes: StatusClass[]): MLSRow[] {
  return rows.filter(row => classes.includes(classifyStatus(row.status)))
}

// ─── Deterministic Deduplication ────────────────────────────

/**
 * Deduplication key — MLS number is primary, address+zip is fallback.
 */
function dedupeKey(row: MLSRow): string {
  if (row.mlsNumber) {
    return `mls:${row.mlsNumber}`
  }
  const addr = row.address.toUpperCase().replace(/\s+/g, ' ').trim()
  return `addr:${addr}|${row.zip}`
}

/**
 * Completeness score for tiebreaking — higher = more complete record.
 * Used when two records have the same dedupe key.
 */
function completenessScore(row: MLSRow): number {
  let score = 0
  if (row.salePrice) score += 10
  if (row.saleDate) score += 10
  if (row.apn) score += 5
  if (row.squareFeet > 0) score += 3
  if (row.yearBuilt > 0) score += 3
  if (row.bedrooms > 0) score += 2
  if (row.bathrooms > 0) score += 2
  if (row.lotSize > 0) score += 2
  if (row.latitude && row.longitude) score += 2
  if (row.subdivision) score += 1
  if (row.remarks) score += 1
  return score
}

/**
 * Status priority for tiebreaking — Sold > Under Contract > Pending > Active > rest.
 */
function statusPriority(status: MLSStatus): number {
  const priority: Record<MLSStatus, number> = {
    'C': 5, // Sold — most valuable
    'U': 4, // Under Contract
    'P': 3, // Pending
    'A': 2, // Active
    'T': 1, // Temp Off
    'W': 1, // Withdrawn
    'X': 0, // Cancelled — least valuable
  }
  return priority[status] ?? 0
}

export interface DedupeResult {
  /** Deduplicated records */
  records: MLSRow[]
  /** Number of duplicates removed */
  duplicatesRemoved: number
  /** Duplicate keys that were collapsed (for diagnostics) */
  collapsedKeys: string[]
}

/**
 * Deterministic deduplication of MLS records.
 *
 * When duplicates exist, keeps the record with:
 * 1. Higher status priority (Sold > Under Contract > Active > ...)
 * 2. Higher completeness score (more fields populated)
 * 3. More recent sale date (if both have one)
 */
export function deduplicateRecords(rows: MLSRow[]): DedupeResult {
  const seen = new Map<string, MLSRow>()
  const collapsedKeys: string[] = []

  for (const row of rows) {
    const key = dedupeKey(row)
    const existing = seen.get(key)

    if (!existing) {
      seen.set(key, row)
      continue
    }

    // Tiebreak: status priority → completeness → sale date recency
    const existingPriority = statusPriority(existing.status)
    const newPriority = statusPriority(row.status)

    if (newPriority > existingPriority) {
      seen.set(key, row)
      if (!collapsedKeys.includes(key)) collapsedKeys.push(key)
    } else if (newPriority === existingPriority) {
      const existingScore = completenessScore(existing)
      const newScore = completenessScore(row)

      if (newScore > existingScore) {
        seen.set(key, row)
        if (!collapsedKeys.includes(key)) collapsedKeys.push(key)
      } else if (newScore === existingScore && row.saleDate && existing.saleDate) {
        if (row.saleDate > existing.saleDate) {
          seen.set(key, row)
          if (!collapsedKeys.includes(key)) collapsedKeys.push(key)
        }
      }
    }
    // else: existing wins, do nothing
  }

  return {
    records: Array.from(seen.values()),
    duplicatesRemoved: rows.length - seen.size,
    collapsedKeys,
  }
}

// ─── Data Quality Scoring ───────────────────────────────────

export interface QualityScore {
  /** Overall quality score 0–100 */
  score: number
  /** Breakdown of contributing factors */
  factors: QualityFactor[]
  /** Reasons this record might be excluded from analysis */
  exclusionReasons: string[]
  /** Whether the record passes minimum quality threshold */
  passes: boolean
}

interface QualityFactor {
  name: string
  weight: number
  present: boolean
  points: number
}

/** Minimum quality score to be included in analysis (out of 100) */
export const MIN_QUALITY_SCORE = 30

/**
 * Score a single MLS record for data quality.
 *
 * Factors (total 100 points):
 * - Core identification (15): MLS number + APN
 * - Pricing (25): sale price or list price + price per sqft
 * - Physical characteristics (25): sqft + beds + baths + year built + lot size
 * - Location (15): coordinates + city + subdivision
 * - Market data (10): status + DOM + sale date
 * - Transaction context (10): listing terms + agent info
 */
export function scoreRecordQuality(row: MLSRow): QualityScore {
  const factors: QualityFactor[] = []
  const exclusionReasons: string[] = []

  // ── Core identification (15 pts) ──
  factors.push({
    name: 'MLS number',
    weight: 10,
    present: !!row.mlsNumber,
    points: row.mlsNumber ? 10 : 0,
  })
  factors.push({
    name: 'APN',
    weight: 5,
    present: !!row.apn,
    points: row.apn ? 5 : 0,
  })

  // ── Pricing (25 pts) ──
  const hasSalePrice = row.salePrice !== null && row.salePrice > 0
  const hasListPrice = row.listPrice > 0
  factors.push({
    name: 'Sale price',
    weight: 15,
    present: hasSalePrice,
    points: hasSalePrice ? 15 : 0,
  })
  factors.push({
    name: 'List price',
    weight: 5,
    present: hasListPrice,
    points: hasListPrice ? 5 : 0,
  })
  factors.push({
    name: 'Price per sqft',
    weight: 5,
    present: row.pricePerSqFt > 0 && isFinite(row.pricePerSqFt),
    points: row.pricePerSqFt > 0 && isFinite(row.pricePerSqFt) ? 5 : 0,
  })

  // ── Physical characteristics (25 pts) ──
  factors.push({
    name: 'Square footage',
    weight: 8,
    present: row.squareFeet > 0,
    points: row.squareFeet > 0 ? 8 : 0,
  })
  factors.push({
    name: 'Bedrooms',
    weight: 4,
    present: row.bedrooms > 0,
    points: row.bedrooms > 0 ? 4 : 0,
  })
  factors.push({
    name: 'Bathrooms',
    weight: 4,
    present: row.bathrooms > 0,
    points: row.bathrooms > 0 ? 4 : 0,
  })
  factors.push({
    name: 'Year built',
    weight: 5,
    present: row.yearBuilt > 0,
    points: row.yearBuilt > 0 ? 5 : 0,
  })
  factors.push({
    name: 'Lot size',
    weight: 4,
    present: row.lotSize > 0,
    points: row.lotSize > 0 ? 4 : 0,
  })

  // ── Location (15 pts) ──
  factors.push({
    name: 'Coordinates',
    weight: 5,
    present: row.latitude !== null && row.longitude !== null,
    points: row.latitude !== null && row.longitude !== null ? 5 : 0,
  })
  factors.push({
    name: 'City',
    weight: 5,
    present: !!row.city,
    points: row.city ? 5 : 0,
  })
  factors.push({
    name: 'Subdivision',
    weight: 5,
    present: !!row.subdivision,
    points: row.subdivision ? 5 : 0,
  })

  // ── Market data (10 pts) ──
  factors.push({
    name: 'Valid status',
    weight: 4,
    present: !!row.status,
    points: row.status ? 4 : 0,
  })
  factors.push({
    name: 'Days on market',
    weight: 3,
    present: row.daysOnMarket > 0,
    points: row.daysOnMarket > 0 ? 3 : 0,
  })
  factors.push({
    name: 'Sale date',
    weight: 3,
    present: row.saleDate !== null,
    points: row.saleDate !== null ? 3 : 0,
  })

  // ── Transaction context (10 pts) ──
  factors.push({
    name: 'Listing terms',
    weight: 5,
    present: row.listingTerms && row.listingTerms.length > 0,
    points: row.listingTerms && row.listingTerms.length > 0 ? 5 : 0,
  })
  factors.push({
    name: 'Agent info',
    weight: 5,
    present: !!row.listingAgent,
    points: row.listingAgent ? 5 : 0,
  })

  const score = factors.reduce((sum, f) => sum + f.points, 0)

  // ── Exclusion reasons ──
  if (isExcludedRecord(row)) {
    exclusionReasons.push(`Status '${row.status}' is excluded from analysis`)
  }
  if (!row.address) {
    exclusionReasons.push('Missing address')
  }
  if (row.squareFeet <= 0 && !hasSalePrice) {
    exclusionReasons.push('Missing both square footage and sale price')
  }
  if (row.isForeclosure) {
    exclusionReasons.push('Foreclosure — may not reflect market value')
  }
  if (row.isREO) {
    exclusionReasons.push('REO/Bank-owned — may not reflect market value')
  }
  if (row.isShortSale) {
    exclusionReasons.push('Short sale — may not reflect market value')
  }

  return {
    score,
    factors,
    exclusionReasons,
    passes: score >= MIN_QUALITY_SCORE && exclusionReasons.filter(r => r.includes('Missing address')).length === 0,
  }
}

/**
 * Score and annotate a batch of records. Returns records with quality metadata.
 */
export interface ScoredMLSRow extends MLSRow {
  qualityScore: number
  statusClass: StatusClass
  exclusionReasons: string[]
  qualityPasses: boolean
}

export function scoreAndClassifyBatch(rows: MLSRow[]): {
  scored: ScoredMLSRow[]
  stats: {
    total: number
    passing: number
    failing: number
    byStatusClass: Record<StatusClass, number>
    avgScore: number
  }
} {
  const scored: ScoredMLSRow[] = rows.map(row => {
    const quality = scoreRecordQuality(row)
    const statusClass = classifyStatus(row.status)
    return {
      ...row,
      qualityScore: quality.score,
      statusClass,
      exclusionReasons: quality.exclusionReasons,
      qualityPasses: quality.passes,
    }
  })

  const passing = scored.filter(r => r.qualityPasses).length
  const totalScore = scored.reduce((sum, r) => sum + r.qualityScore, 0)

  const byStatusClass: Record<StatusClass, number> = {
    valuation: 0,
    supporting: 0,
    context: 0,
    excluded: 0,
  }
  for (const r of scored) {
    byStatusClass[r.statusClass]++
  }

  return {
    scored,
    stats: {
      total: rows.length,
      passing,
      failing: rows.length - passing,
      byStatusClass,
      avgScore: rows.length > 0 ? Math.round(totalScore / rows.length) : 0,
    },
  }
}
