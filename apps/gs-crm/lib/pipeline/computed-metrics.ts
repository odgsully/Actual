/**
 * Computed Metrics — Derived Fields for MLS and Breakups Analysis
 *
 * Phase 1 Milestone 1: Pipeline-level derived metric computation.
 * Keeps metric computation separate from parsing (csv-processor) and hygiene (record-hygiene).
 *
 * Two contexts:
 * 1. MLSRow-based metrics: price/sqft, list-to-sale ratio, distance, true DOM
 * 2. PropertyData-based metrics (breakups): hold period, seller basis deltas
 */

import type { MLSRow, SubjectProperty } from '../types/mls-data'
import type { PropertyData } from '../processing/breakups-generator'

// ─── Types ──────────────────────────────────────────────────

/**
 * Derived metrics computed from an MLSRow.
 * Attached to the row via `computeMLSMetrics()`.
 */
export interface MLSComputedMetrics {
  /**
   * Sale price divided by living area square footage.
   * Lineage: MLSRow.salePrice / MLSRow.squareFeet
   * Null when: salePrice is null/0 OR squareFeet is 0
   */
  salePricePerSqFt: number | null

  /**
   * List price divided by living area square footage.
   * Lineage: MLSRow.listPrice / MLSRow.squareFeet
   * Null when: listPrice is 0 OR squareFeet is 0
   */
  listPricePerSqFt: number | null

  /**
   * Ratio of final sale price to original list price.
   * Lineage: MLSRow.salePrice / MLSRow.listPrice
   * Null when: status !== 'C' (not sold), or salePrice/listPrice is null/0.
   * Typical range: 0.90–1.10. Values outside 0.50–2.00 are flagged.
   */
  listToSaleRatio: number | null

  /**
   * Whether the list-to-sale ratio is outside the typical 0.50–2.00 range.
   * Null when listToSaleRatio is null.
   */
  listToSaleRatioFlagged: boolean | null

  /**
   * Haversine distance from subject property in miles.
   * Lineage: computed from MLSRow.latitude/longitude vs SubjectProperty coords.
   * Null when: either the row or subject lacks coordinates.
   * Note: this re-derives from authoritative lat/lon rather than trusting
   * the parse-time `distance` field, ensuring consistency.
   */
  distanceToSubject: number | null

  /**
   * True days on market: saleDate - listDate, in calendar days.
   * Lineage: (MLSRow.saleDate - MLSRow.listDate) / 86400000
   * Null when: saleDate or listDate is missing.
   */
  trueDaysOnMarket: number | null

  /**
   * MLS-reported cumulative days on market (may include relists).
   * Lineage: MLSRow.daysOnMarket (passthrough)
   */
  mlsReportedDOM: number

  /**
   * Difference between true DOM and MLS-reported DOM.
   * Lineage: trueDaysOnMarket - mlsReportedDOM
   * Null when: trueDaysOnMarket is null.
   * Positive = MLS under-reports, negative = MLS over-reports.
   */
  domDiscrepancy: number | null
}

/**
 * Derived metrics computed from a breakups PropertyData row.
 * Attached via `computeBreakupsMetrics()`.
 */
export interface BreakupsComputedMetrics {
  /**
   * Days between seller basis date and sale date.
   * Lineage: PropertyData.SALE_DATE - PropertyData.SELLER_BASIS_DATE
   * Null when: either date is missing/invalid.
   */
  holdPeriodDays: number | null

  /**
   * Dollar gain/loss from seller basis to sale.
   * Lineage: PropertyData.SALE_PRICE - PropertyData.SELLER_BASIS
   * Null when: SALE_PRICE is 0/missing OR SELLER_BASIS is 0/missing.
   */
  sellerBasisDelta: number | null

  /**
   * Percentage appreciation from seller basis to sale.
   * Lineage: (SALE_PRICE - SELLER_BASIS) / SELLER_BASIS
   * Null when: SELLER_BASIS is 0/missing OR SALE_PRICE is 0/missing.
   */
  sellerBasisAppreciation: number | null

  /**
   * Sale price per sqft for breakups context.
   * Lineage: PropertyData.SALE_PRICE / PropertyData.SQFT
   * Null when: SALE_PRICE is 0 OR SQFT is 0.
   */
  salePricePerSqFt: number | null

  /**
   * List-to-sale ratio for breakups context.
   * Lineage: PropertyData.SALE_PRICE / PropertyData.OG_LIST_PRICE
   * Null when: STATUS !== 'C', or either price is 0/missing.
   */
  listToSaleRatio: number | null

  /**
   * True DOM: SALE_DATE - OG_LIST_DATE in calendar days.
   * Lineage: PropertyData.SALE_DATE - PropertyData.OG_LIST_DATE
   * Null when: either date is missing/invalid.
   */
  trueDaysOnMarket: number | null
}

/** MLSRow with computed metrics attached */
export interface EnrichedMLSRow extends MLSRow {
  computedMetrics: MLSComputedMetrics
}

/** PropertyData with computed metrics attached */
export interface EnrichedPropertyData extends PropertyData {
  computedMetrics: BreakupsComputedMetrics
}

// ─── Constants ──────────────────────────────────────────────

/** List-to-sale ratios outside this range are flagged as anomalous */
const LIST_TO_SALE_MIN = 0.50
const LIST_TO_SALE_MAX = 2.00

/** Milliseconds in one day */
const MS_PER_DAY = 86_400_000

/** Earth radius in miles (for Haversine) */
const EARTH_RADIUS_MILES = 3959

// ─── MLS Metric Computation ────────────────────────────────

/**
 * Compute derived metrics for a single MLSRow.
 * Pure function — does not mutate the input row.
 */
export function computeMLSMetrics(
  row: MLSRow,
  subject?: SubjectProperty
): MLSComputedMetrics {
  const sqft = row.squareFeet > 0 ? row.squareFeet : null

  // ── Price per sqft ──
  const hasSalePrice = row.salePrice !== null && row.salePrice > 0
  const salePricePerSqFt =
    hasSalePrice && sqft ? round4(row.salePrice! / sqft) : null

  const hasListPrice = row.listPrice > 0
  const listPricePerSqFt =
    hasListPrice && sqft ? round4(row.listPrice / sqft) : null

  // ── List-to-sale ratio (sold records only) ──
  let listToSaleRatio: number | null = null
  let listToSaleRatioFlagged: boolean | null = null
  if (row.status === 'C' && hasSalePrice && hasListPrice) {
    listToSaleRatio = round4(row.salePrice! / row.listPrice)
    listToSaleRatioFlagged =
      listToSaleRatio < LIST_TO_SALE_MIN || listToSaleRatio > LIST_TO_SALE_MAX
  }

  // ── Distance to subject ──
  let distanceToSubject: number | null = null
  if (
    subject &&
    row.latitude !== null &&
    row.longitude !== null &&
    isFinite(subject.latitude) &&
    isFinite(subject.longitude)
  ) {
    distanceToSubject = haversineDistance(
      subject.latitude,
      subject.longitude,
      row.latitude,
      row.longitude
    )
  }

  // ── True DOM ──
  let trueDaysOnMarket: number | null = null
  if (row.saleDate && row.listDate) {
    const saleMs = row.saleDate.getTime()
    const listMs = row.listDate.getTime()
    if (isFinite(saleMs) && isFinite(listMs) && saleMs >= listMs) {
      trueDaysOnMarket = Math.round((saleMs - listMs) / MS_PER_DAY)
    }
  }

  const mlsReportedDOM = row.daysOnMarket || 0
  const domDiscrepancy =
    trueDaysOnMarket !== null ? trueDaysOnMarket - mlsReportedDOM : null

  return {
    salePricePerSqFt,
    listPricePerSqFt,
    listToSaleRatio,
    listToSaleRatioFlagged,
    distanceToSubject,
    trueDaysOnMarket,
    mlsReportedDOM,
    domDiscrepancy,
  }
}

/**
 * Compute derived metrics for an array of MLSRows.
 * Returns EnrichedMLSRow[] with `computedMetrics` attached to each row.
 */
export function enrichMLSBatch(
  rows: MLSRow[],
  subject?: SubjectProperty
): EnrichedMLSRow[] {
  return rows.map(row => ({
    ...row,
    computedMetrics: computeMLSMetrics(row, subject),
  }))
}

// ─── Breakups Metric Computation ────────────────────────────

/**
 * Compute derived metrics for a single breakups PropertyData row.
 * Pure function — does not mutate the input.
 */
export function computeBreakupsMetrics(prop: PropertyData): BreakupsComputedMetrics {
  const sqft = prop.SQFT > 0 ? prop.SQFT : null
  const hasSalePrice = prop.SALE_PRICE > 0
  const hasListPrice = prop.OG_LIST_PRICE > 0
  const hasBasis = prop.SELLER_BASIS > 0

  // ── Price per sqft ──
  const salePricePerSqFt =
    hasSalePrice && sqft ? round4(prop.SALE_PRICE / sqft) : null

  // ── List-to-sale ratio (sold only) ──
  let listToSaleRatio: number | null = null
  if (prop.STATUS === 'C' && hasSalePrice && hasListPrice) {
    listToSaleRatio = round4(prop.SALE_PRICE / prop.OG_LIST_PRICE)
  }

  // ── Hold period ──
  let holdPeriodDays: number | null = null
  const saleDate = toDate(prop.SALE_DATE)
  const basisDate = toDate(prop.SELLER_BASIS_DATE)
  if (saleDate && basisDate) {
    const diffMs = saleDate.getTime() - basisDate.getTime()
    if (diffMs >= 0) {
      holdPeriodDays = Math.round(diffMs / MS_PER_DAY)
    }
  }

  // ── Seller basis deltas ──
  let sellerBasisDelta: number | null = null
  let sellerBasisAppreciation: number | null = null
  if (hasSalePrice && hasBasis) {
    sellerBasisDelta = round2(prop.SALE_PRICE - prop.SELLER_BASIS)
    sellerBasisAppreciation = round4(
      (prop.SALE_PRICE - prop.SELLER_BASIS) / prop.SELLER_BASIS
    )
  }

  // ── True DOM ──
  let trueDaysOnMarket: number | null = null
  const listDate = toDate(prop.OG_LIST_DATE)
  if (saleDate && listDate) {
    const diffMs = saleDate.getTime() - listDate.getTime()
    if (diffMs >= 0) {
      trueDaysOnMarket = Math.round(diffMs / MS_PER_DAY)
    }
  }

  return {
    holdPeriodDays,
    sellerBasisDelta,
    sellerBasisAppreciation,
    salePricePerSqFt,
    listToSaleRatio,
    trueDaysOnMarket,
  }
}

/**
 * Compute derived metrics for an array of breakups PropertyData rows.
 * Returns EnrichedPropertyData[] with `computedMetrics` attached.
 */
export function enrichBreakupsBatch(
  props: PropertyData[]
): EnrichedPropertyData[] {
  return props.map(prop => ({
    ...prop,
    computedMetrics: computeBreakupsMetrics(prop),
  }))
}

// ─── Batch Summary ──────────────────────────────────────────

export interface MetricsSummary {
  totalRecords: number
  salePricePerSqFtAvailable: number
  listPricePerSqFtAvailable: number
  listToSaleRatioAvailable: number
  listToSaleRatioFlagged: number
  distanceToSubjectAvailable: number
  trueDOMAvailable: number
  domDiscrepancyCount: number
}

/**
 * Summarize metric coverage for a batch of enriched MLS rows.
 * Useful for diagnostics and quality reporting.
 */
export function summarizeMLSMetrics(rows: EnrichedMLSRow[]): MetricsSummary {
  let salePricePerSqFtAvailable = 0
  let listPricePerSqFtAvailable = 0
  let listToSaleRatioAvailable = 0
  let listToSaleRatioFlagged = 0
  let distanceToSubjectAvailable = 0
  let trueDOMAvailable = 0
  let domDiscrepancyCount = 0

  for (const row of rows) {
    const m = row.computedMetrics
    if (m.salePricePerSqFt !== null) salePricePerSqFtAvailable++
    if (m.listPricePerSqFt !== null) listPricePerSqFtAvailable++
    if (m.listToSaleRatio !== null) listToSaleRatioAvailable++
    if (m.listToSaleRatioFlagged === true) listToSaleRatioFlagged++
    if (m.distanceToSubject !== null) distanceToSubjectAvailable++
    if (m.trueDaysOnMarket !== null) trueDOMAvailable++
    if (m.domDiscrepancy !== null && m.domDiscrepancy !== 0) domDiscrepancyCount++
  }

  return {
    totalRecords: rows.length,
    salePricePerSqFtAvailable,
    listPricePerSqFtAvailable,
    listToSaleRatioAvailable,
    listToSaleRatioFlagged,
    distanceToSubjectAvailable,
    trueDOMAvailable,
    domDiscrepancyCount,
  }
}

// ─── Utilities (private) ────────────────────────────────────

/** Round to 4 decimal places */
function round4(n: number): number {
  return Math.round(n * 10000) / 10000
}

/** Round to 2 decimal places */
function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * Haversine distance between two lat/lon points.
 * Returns distance in miles, rounded to 2 decimal places.
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(EARTH_RADIUS_MILES * c * 100) / 100
}

/**
 * Coerce a Date | string | falsy value to a Date object.
 * Returns null if the input is falsy or results in an invalid date.
 */
function toDate(value: Date | string | undefined | null | number): Date | null {
  if (!value) return null
  if (value instanceof Date) {
    return isFinite(value.getTime()) ? value : null
  }
  const d = new Date(value)
  return isFinite(d.getTime()) ? d : null
}
