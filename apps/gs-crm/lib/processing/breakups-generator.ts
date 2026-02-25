/**
 * ReportIt Break-ups Analysis Generator (v2)
 *
 * Core calculation engine for 26 comparative property analyses with lease/sale differentiation
 * Reads data from Analysis sheet and returns structured results
 *
 * @module breakups-generator
 * @see docs/reference/REPORTIT_BREAKUPS_ANALYSIS.md for full specification
 */

import * as ExcelJS from 'exceljs'
import {
  filterSaleProperties,
  filterLeaseProperties,
  calculateAverageSalePrice,
  calculateAverageMonthlyRent,
  calculateAverageAnnualRent,
  calculatePricePerSqft,
  calculateRentPerSqft,
  calculateAnnualRentPerSqft,
} from './transaction-utils'

const LOG_PREFIX = '[Breakups Generator v2]'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Property data structure matching Analysis sheet columns (A-AC)
 */
export interface PropertyData {
  // Column A
  Item: string

  // Columns B-AC (29 total columns)
  FULL_ADDRESS: string
  APN: string
  STATUS: string // A=Active, C=Closed, P=Pending
  OG_LIST_DATE: Date | string
  OG_LIST_PRICE: number
  SALE_DATE: Date | string
  SALE_PRICE: number
  SELLER_BASIS: number
  SELLER_BASIS_DATE: Date | string
  BR: number // Bedrooms
  BA: number // Bathrooms
  SQFT: number
  LOT_SIZE: number
  MLS_MCAO_DISCREPENCY_CONCAT: string
  IS_RENTAL: string // Y/N
  AGENCY_PHONE: string
  RENOVATE_SCORE: number | string // 1-10 numeric, or legacy Y/N/0.5
  RENO_YEAR_EST?: number | string // estimated renovation year (e.g. 2018), optional
  PROPERTY_RADAR_COMP_YN: string // Y/N
  IN_MLS: string // Y/N
  IN_MCAO: string // Y/N
  CANCEL_DATE: Date | string
  UC_DATE: Date | string
  LAT: number | string
  LON: number | string
  YEAR_BUILT: number
  DAYS_ON_MARKET: number
  DWELLING_TYPE: string
  SUBDIVISION_NAME: string
}

// ============================================================================
// RENOVATION SCORING UTILITIES (1-10 scale with renovation year recency)
// ============================================================================

/**
 * Normalize any RENOVATE_SCORE value to an integer 1-10.
 * Handles legacy Y/N/0.5, numeric values, Excel quirks (0.5 as number), and bad input.
 */
export function normalizeRenoScore(raw: any): number {
  if (raw === null || raw === undefined || raw === '') return 2

  // Handle numeric values directly (Excel often stores as number)
  if (typeof raw === 'number') {
    if (raw === 0.5) return 5 // legacy 0.5
    if (raw === 0) return 1
    if (raw >= 1 && raw <= 10) return Math.round(raw)
    return Math.max(1, Math.min(10, Math.round(raw))) // clamp
  }

  // Handle string values
  const str = String(raw).trim().toUpperCase()
  if (str === 'Y') return 7
  if (str === 'N') return 2
  if (str === '0.5') return 5

  // Try parsing as number
  const parsed = parseFloat(str)
  if (!isNaN(parsed) && parsed === 0.5) return 5
  if (!isNaN(parsed) && parsed >= 1 && parsed <= 10) return Math.round(parsed)

  return 2 // unrecognized input defaults to unrenovated
}

/**
 * Compute renovation recency category from estimated renovation year.
 * Missing/invalid defaults to 'Mid' (neutral — no penalty for unknowns).
 */
export function getRenoRecency(renoYear: any): 'Fresh' | 'Mid' | 'Dated' {
  const year = Number(renoYear)
  if (isNaN(year) || year < 1900) return 'Mid' // missing/invalid = neutral default
  const currentYear = new Date().getFullYear()
  if (year > currentYear + 2) return 'Fresh' // under-renovation / future
  const age = currentYear - year
  if (age <= 3) return 'Fresh'
  if (age <= 10) return 'Mid'
  return 'Dated'
}

/**
 * Map a normalized 1-10 score to a tier for chart grouping.
 */
export function getRenoTier(score: number): 'High' | 'Mid' | 'Low' {
  if (score >= 7) return 'High'
  if (score >= 4) return 'Mid'
  return 'Low'
}

/**
 * 2D NOI multiplier: score (1-10) × renovation recency.
 * Returns monthly rent-to-value ratio (e.g. 0.0065 = 0.65%).
 */
export function getNoiMultiplier(score: number, renoYear: any): number {
  const recency = getRenoRecency(renoYear)
  const s = Math.round(Math.max(1, Math.min(10, score)))

  // Lookup table: score range → [Fresh, Mid, Dated]
  const table: Record<string, [number, number, number]> = {
    '1-2':  [0.0045, 0.0045, 0.0045],
    '3-4':  [0.0050, 0.0048, 0.0046],
    '5-6':  [0.0058, 0.0055, 0.0050],
    '7-8':  [0.0065, 0.0060, 0.0053],
    '9-10': [0.0070, 0.0065, 0.0055],
  }

  let key: string
  if (s <= 2) key = '1-2'
  else if (s <= 4) key = '3-4'
  else if (s <= 6) key = '5-6'
  else if (s <= 8) key = '7-8'
  else key = '9-10'

  const [fresh, mid, dated] = table[key]
  if (recency === 'Fresh') return fresh
  if (recency === 'Mid') return mid
  return dated
}

/**
 * Estimate improvement cost based on score range.
 * Costs scale nonlinearly — upgrading from 7→10 costs far more than 2→5.
 */
export function estimateImprovementCost(fromScore: number, toScore: number): number {
  const costPerPoint: Record<number, number> = {
    1: 4000, 2: 5000, 3: 7000, 4: 10000, 5: 15000,
    6: 20000, 7: 30000, 8: 45000, 9: 60000, 10: 0,
  }

  let total = 0
  const from = Math.max(1, Math.min(10, Math.round(fromScore)))
  const to = Math.max(1, Math.min(10, Math.round(toScore)))
  for (let i = from; i < to; i++) {
    total += costPerPoint[i] || 15000
  }
  return total
}

/**
 * Complete breakups analysis results container (v2 with 26 differentiated analyses)
 */
export interface BreakupsAnalysisResult {
  // v2 Structure: 26 analyses (13 split + 9 combined + 2 lease-only + 2 sale-only)

  // Category A: Property Characteristics - SPLIT: 1, 3, 4 | KEEP: 2, 5
  brDistribution_Sale: BRDistributionResult
  brDistribution_Lease: BRDistributionResultLease
  hoaAnalysis: HOAAnalysisResult // Analysis 2: Combined
  strAnalysis_Sale: STRAnalysisResult
  strAnalysis_Lease: STRAnalysisResultLease
  renovationImpact_Sale: RenovationImpactResult
  renovationImpact_Lease: RenovationImpactResultLease
  compsClassification: CompsClassificationResult // Analysis 5: Combined

  // Category B: Market Positioning - SPLIT: 6, 7 | KEEP: 8, 9, 10
  sqftVariance_Sale: SqftVarianceResult
  sqftVariance_Lease: SqftVarianceResultLease
  priceVariance_Sale: PriceVarianceResult
  priceVariance_Lease: PriceVarianceResultLease
  leaseVsSale: LeaseVsSaleResult // Analysis 8: Comparison
  propertyRadarComps: PropertyRadarCompsResult // Analysis 9: Combined
  individualPRComps: IndividualPRCompsResult // Analysis 10: Combined

  // Category C: Time & Location - SPLIT: 11 | KEEP: 12, 13, 14
  brPrecision_Sale: BRPrecisionResult
  brPrecision_Lease: BRPrecisionResultLease
  timeFrames: TimeFramesResult // Analysis 12: Combined
  directVsIndirect: DirectVsIndirectResult // Analysis 13: Combined
  recentDirectVsIndirect: RecentDirectVsIndirectResult // Analysis 14: Combined

  // Category D: Market Activity - SPLIT: 15, 16
  activeVsClosed_Sale: ActiveVsClosedResult
  activeVsClosed_Lease: ActiveVsClosedResultLease
  activeVsPending_Sale: ActiveVsPendingResult
  activeVsPending_Lease: ActiveVsPendingResultLease

  // Category E: Financial Impact - SPLIT: 17, 18, 19, 20 | KEEP: 21, 22
  renovationDelta_Sale: RenovationDeltaResult
  renovationDelta_Lease: RenovationDeltaResultLease
  partialRenovationDelta_Sale: PartialRenovationDeltaResult
  partialRenovationDelta_Lease: PartialRenovationDeltaResultLease
  interquartileRanges_Sale: InterquartileRangesResult
  interquartileRanges_Lease: InterquartileRangesResultLease
  distributionTails_Sale: DistributionTailsResult
  distributionTails_Lease: DistributionTailsResult
  expectedNOI: ExpectedNOIResult // Analysis 21: Lease-only
  improvedNOI: ImprovedNOIResult // Analysis 22: Lease-only

  // Metadata
  metadata?: { totalProperties: number }
  totalProperties?: number
  analysisDate?: string
}

// Individual analysis result types
export interface BRDistributionResult {
  distribution: Record<string, number>
  mostCommon: string
  average: number
}

export interface BRDistributionResultLease {
  distribution: Record<string, number>
  mostCommon: string
  average: number
}

export interface HOAAnalysisResult {
  withHOA: { count: number; avgPrice: number; avgHOAFee: number }
  withoutHOA: { count: number; avgPrice: number }
  priceDifferential: number
}

export interface STRAnalysisResult {
  strEligible: { count: number; avgPrice: number; avgPricePerSqft: number }
  nonSTR: { count: number; avgPrice: number; avgPricePerSqft: number }
  premiumPercentage: number
}

export interface STRAnalysisResultLease {
  strEligible: { count: number; avgMonthlyRent: number; avgAnnualRent: number }
  nonSTR: { count: number; avgMonthlyRent: number; avgAnnualRent: number }
  premiumPercentage: number
}

interface RenoTierMetricsSale { count: number; avgPrice: number; avgPricePerSqft: number; avgScore: number }
interface RenoTierMetricsLease { count: number; avgMonthlyRent: number; avgAnnualRent: number; avgScore: number }

export interface RenovationImpactResult {
  // Primary tier keys (1-10 scale)
  High: RenoTierMetricsSale
  Mid: RenoTierMetricsSale
  Low: RenoTierMetricsSale
  premiumHighvsLow: number
  premiumMidvsLow: number
  // Backward-compat aliases (deprecated — use High/Mid/Low)
  Y: RenoTierMetricsSale
  N: RenoTierMetricsSale
  '0.5': RenoTierMetricsSale
  premiumYvsN: number
  premium05vsN: number
}

export interface RenovationImpactResultLease {
  // Primary tier keys (1-10 scale)
  High: RenoTierMetricsLease
  Mid: RenoTierMetricsLease
  Low: RenoTierMetricsLease
  premiumHighvsLow: number
  premiumMidvsLow: number
  // Backward-compat aliases (deprecated — use High/Mid/Low)
  Y: RenoTierMetricsLease
  N: RenoTierMetricsLease
  '0.5': RenoTierMetricsLease
  premiumYvsN: number
  premium05vsN: number
}

export interface CompsClassificationResult {
  comps: { count: number; avgPrice: number; priceRange: { min: number; max: number } }
  nonComps: { count: number; avgPrice: number; priceRange: { min: number; max: number } }
}

export interface SqftVarianceResult {
  within20: { count: number; avgPricePerSqft: number }
  outside20: { count: number; avgPricePerSqft: number }
  optimalRange: { min: number; max: number }
}

export interface SqftVarianceResultLease {
  within20: { count: number; avgRentPerSqft: number }
  outside20: { count: number; avgRentPerSqft: number }
  optimalRange: { min: number; max: number }
}

export interface PriceVarianceResult {
  within20: { count: number; avgDaysOnMarket: number }
  outside20: { count: number; underpriced: number; overpriced: number }
}

export interface PriceVarianceResultLease {
  within20: { count: number; avgDaysOnMarket: number }
  outside20: { count: number; belowMarket: number; aboveMarket: number }
}

export interface LeaseVsSaleResult {
  lease: { avgAnnualPerSqft: number; capRate: number }
  sale: { avgPerSqft: number }
  rentToValueRatio: number
}

export interface PropertyRadarCompsResult {
  propertyRadar: { count: number }
  standard: { count: number }
}

export interface IndividualPRCompsResult {
  comparisons: Array<{
    compNumber: number
    address: string
    priceDiff: number
    sqftDiff: number
  }>
  avgSimilarity: number
}

export interface BRPrecisionResult {
  exact: { count: number; avgPrice: number; priceRange: { min: number; max: number } }
  within1: { count: number; avgPrice: number; priceRange: { min: number; max: number } }
}

export interface BRPrecisionResultLease {
  exact: { count: number; avgMonthlyRent: number; rentRange: { min: number; max: number } }
  within1: { count: number; avgMonthlyRent: number; rentRange: { min: number; max: number } }
}

export interface TimeFramesResult {
  t12: { count: number; avgPrice: number }
  t36: { count: number; avgPrice: number }
  appreciation: number
}

export interface DirectVsIndirectResult {
  direct: { count: number; avgPrice: number }
  indirect: { count: number; avgPrice: number }
  reliabilityScore: number
}

export interface RecentDirectVsIndirectResult {
  recentDirect: { count: number; avgPrice: number; avgDaysOnMarket: number }
  recentIndirect: { count: number; avgPrice: number; avgDaysOnMarket: number }
}

export interface ActiveVsClosedResult {
  active: { count: number; avgListPrice: number; avgDaysOnMarket: number }
  closed: { count: number; avgSalePrice: number; avgDaysToClose: number }
  absorptionRate: number
  listToSaleRatio: number
}

export interface ActiveVsClosedResultLease {
  active: { count: number; avgListRent: number; avgDaysOnMarket: number }
  closed: { count: number; avgLeaseRent: number; avgDaysToLease: number }
  absorptionRate: number
  listToLeaseRatio: number
}

export interface ActiveVsPendingResult {
  active: { count: number; avgListPrice: number; avgDaysActive: number }
  pending: { count: number; avgDaysToContract: number }
  pendingRatio: number
}

export interface ActiveVsPendingResultLease {
  active: { count: number; avgListRent: number; avgDaysActive: number }
  pending: { count: number; avgDaysToPending: number }
  pendingRatio: number
}

export interface RenovationDeltaResult {
  renovatedAvg: number
  notRenovatedAvg: number
  delta: number
  percentageIncrease: number
}

export interface RenovationDeltaResultLease {
  renovatedAvg: number
  notRenovatedAvg: number
  delta: number
  percentageIncrease: number
  monthlyIncomeUplift: number
  annualIncomeUplift: number
}

export interface PartialRenovationDeltaResult {
  partialAvg: number
  notRenovatedAvg: number
  delta: number
  percentageIncrease: number
}

export interface PartialRenovationDeltaResultLease {
  partialAvg: number
  notRenovatedAvg: number
  delta: number
  percentageIncrease: number
  monthlyIncomeUplift: number
  annualIncomeUplift: number
}

export interface InterquartileRangesResult {
  price: { q25: number; median: number; q75: number; iqr: number }
  pricePerSqft: { q25: number; median: number; q75: number; iqr: number }
}

export interface InterquartileRangesResultLease {
  monthlyRent: { q25: number; median: number; q75: number; iqr: number }
  annualRent: { q25: number; median: number; q75: number; iqr: number }
  rentPerSqft: { q25: number; median: number; q75: number; iqr: number }
}

export interface DistributionTailsResult {
  percentiles: { p5: number; p10: number; p50: number; p90: number; p95: number }
  ranges: { middle80: number; middle90: number }
}

export interface DistributionTailsResultLease {
  percentiles: { p5: number; p10: number; p50: number; p90: number; p95: number }
  ranges: { middle80: number; middle90: number }
}

export interface ExpectedNOIResult {
  monthlyRent: number
  annualIncome: number
  operatingExpenses: number
  annualNOI: number
  capRate: number
  renoScore: number
  renoRecency: 'Fresh' | 'Mid' | 'Dated'
  multiplierUsed: number
}

export interface ImprovedNOIResult {
  currentNOI: number
  improvedNOI: number
  noiIncrease: number
  improvementCost: number
  paybackPeriod: number
  roi: number
  currentScore: number
  improvedScore: number
  scoreDelta: number
}

// ============================================================================
// MAIN ORCHESTRATOR FUNCTION
// ============================================================================

/**
 * Generate all 26 breakups analyses from workbook (v2 with lease/sale differentiation)
 *
 * @param workbook - ExcelJS workbook with Analysis sheet
 * @param subjectProperty - Subject property data for relative comparisons
 * @returns Complete analysis results with 26 differentiated analyses
 */
export async function generateAllBreakupsAnalyses(
  workbook: ExcelJS.Workbook,
  subjectProperty: any
): Promise<BreakupsAnalysisResult> {
  console.log(`${LOG_PREFIX} Starting all breakups analyses (v2 - 26 analyses)`)

  // Read property data from Analysis sheet
  const { properties, warnings } = readAnalysisSheet(workbook)
  console.log(`${LOG_PREFIX} Read ${properties.length} properties from Analysis sheet`)
  if (warnings.length > 0) {
    console.warn(`${LOG_PREFIX} Validation warnings:\n  ${warnings.join('\n  ')}`)
  }

  if (properties.length === 0) {
    throw new Error('No properties found in Analysis sheet')
  }

  // Get subject property data (first row)
  const subject = properties[0]
  const subjectSqft = subject.SQFT || subjectProperty?.sqft || 0
  const subjectBR = subject.BR || subjectProperty?.bedrooms || 0
  const estimatedValue = subject.SALE_PRICE || subjectProperty?.estimatedValue || 0

  // Filter properties by transaction type (v2 differentiation)
  const saleProperties = filterSaleProperties(properties)
  const leaseProperties = filterLeaseProperties(properties)

  console.log(`${LOG_PREFIX} Filtered: ${saleProperties.length} sale properties, ${leaseProperties.length} lease properties`)

  // Category A: Property Characteristics (1-5) - SPLIT: 1, 3, 4 | KEEP: 2, 5
  console.log(`${LOG_PREFIX} Running Category A: Property Characteristics`)
  const brDistribution_Sale = analyzeBRDistribution_Sale(saleProperties)
  const brDistribution_Lease = analyzeBRDistribution_Lease(leaseProperties)
  const hoaAnalysis = analyzeHOA(properties) // Analysis 2: Combined (no split needed)
  const strAnalysis_Sale = analyzeSTR_Sale(saleProperties)
  const strAnalysis_Lease = analyzeSTR_Lease(leaseProperties)
  const renovationImpact_Sale = analyzeRenovationImpact_Sale(saleProperties)
  const renovationImpact_Lease = analyzeRenovationImpact_Lease(leaseProperties)
  const compsClassification = analyzeCompsClassification(properties) // Analysis 5: Combined (no split needed)

  // Category B: Market Positioning (6-10) - SPLIT: 6, 7 | KEEP: 8, 9, 10
  console.log(`${LOG_PREFIX} Running Category B: Market Positioning`)
  const sqftVariance_Sale = analyzeSqftVariance_Sale(saleProperties, subjectSqft)
  const sqftVariance_Lease = analyzeSqftVariance_Lease(leaseProperties, subjectSqft)
  const priceVariance_Sale = analyzePriceVariance_Sale(saleProperties, estimatedValue)
  const priceVariance_Lease = analyzePriceVariance_Lease(leaseProperties, estimatedValue)
  const leaseVsSale = analyzeLeaseVsSale(properties) // Analysis 8: Comparison (no split needed)
  const propertyRadarComps = analyzePropertyRadarComps(properties) // Analysis 9: Combined (no split needed)
  const individualPRComps = analyzeIndividualPRComps(properties, subject) // Analysis 10: Combined (no split needed)

  // Category C: Time & Location (11-14) - SPLIT: 11 | KEEP: 12, 13, 14
  console.log(`${LOG_PREFIX} Running Category C: Time & Location`)
  const brPrecision_Sale = analyzeBRPrecision_Sale(saleProperties, subjectBR)
  const brPrecision_Lease = analyzeBRPrecision_Lease(leaseProperties, subjectBR)
  const timeFrames = analyzeTimeFrames(properties) // Analysis 12: Combined (no split needed)
  const directVsIndirect = analyzeDirectVsIndirect(properties) // Analysis 13: Combined (no split needed)
  const recentDirectVsIndirect = analyzeRecentDirectVsIndirect(properties) // Analysis 14: Combined (no split needed)

  // Category D: Market Activity (15-16) - SPLIT: 15, 16
  console.log(`${LOG_PREFIX} Running Category D: Market Activity`)
  const activeVsClosed_Sale = analyzeActiveVsClosed_Sale(saleProperties)
  const activeVsClosed_Lease = analyzeActiveVsClosed_Lease(leaseProperties)
  const activeVsPending_Sale = analyzeActiveVsPending_Sale(saleProperties)
  const activeVsPending_Lease = analyzeActiveVsPending_Lease(leaseProperties)

  // Category E: Financial Impact (17-22) - SPLIT: 17, 18, 19, 20 | KEEP: 21, 22
  console.log(`${LOG_PREFIX} Running Category E: Financial Impact`)
  const renovationDelta_Sale = calculateRenovationDelta_Sale(saleProperties)
  const renovationDelta_Lease = calculateRenovationDelta_Lease(leaseProperties)
  const partialRenovationDelta_Sale = calculatePartialRenovationDelta_Sale(saleProperties)
  const partialRenovationDelta_Lease = calculatePartialRenovationDelta_Lease(leaseProperties)
  const interquartileRanges_Sale = calculateInterquartileRanges_Sale(saleProperties)
  const interquartileRanges_Lease = calculateInterquartileRanges_Lease(leaseProperties)
  const distributionTails_Sale = analyzeDistributionTails_Sale(saleProperties)
  const distributionTails_Lease = analyzeDistributionTails_Lease(leaseProperties)
  const expectedNOI = calculateExpectedNOI(subject) // Analysis 21: Lease-only (no split needed)
  const improvedNOI = calculateImprovedNOI(subject) // Analysis 22: Lease-only (no split needed)

  console.log(`${LOG_PREFIX} All 26 analyses complete (v2)`)

  return {
    // v2: 26 differentiated analyses (13 split analyses = 26, plus 9 combined = 35 total properties)
    // Note: Some analyses are kept combined when differentiation doesn't apply
    brDistribution_Sale,
    brDistribution_Lease,
    hoaAnalysis,
    strAnalysis_Sale,
    strAnalysis_Lease,
    renovationImpact_Sale,
    renovationImpact_Lease,
    compsClassification,
    sqftVariance_Sale,
    sqftVariance_Lease,
    priceVariance_Sale,
    priceVariance_Lease,
    leaseVsSale,
    propertyRadarComps,
    individualPRComps,
    brPrecision_Sale,
    brPrecision_Lease,
    timeFrames,
    directVsIndirect,
    recentDirectVsIndirect,
    activeVsClosed_Sale,
    activeVsClosed_Lease,
    activeVsPending_Sale,
    activeVsPending_Lease,
    renovationDelta_Sale,
    renovationDelta_Lease,
    partialRenovationDelta_Sale,
    partialRenovationDelta_Lease,
    interquartileRanges_Sale,
    interquartileRanges_Lease,
    distributionTails_Sale,
    distributionTails_Lease,
    expectedNOI,
    improvedNOI,

    // Metadata
    metadata: { totalProperties: properties.length },
    totalProperties: properties.length,
    analysisDate: new Date().toISOString(),
  }
}

// ============================================================================
// CATEGORY A: PROPERTY CHARACTERISTICS (1-5)
// ============================================================================

/**
 * Analysis 1A: BR Sizes Distribution - Sale Market
 * Analyze distribution of sale properties by bedroom count
 */
export function analyzeBRDistribution_Sale(properties: PropertyData[]): BRDistributionResult {
  const saleProps = filterSaleProperties(properties)
  const distribution: Record<string, number> = {}

  saleProps.forEach((prop) => {
    const br = prop.BR ? String(prop.BR) : 'Unknown'
    distribution[br] = (distribution[br] || 0) + 1
  })

  // Handle empty distribution (no sale properties)
  const keys = Object.keys(distribution)
  const mostCommon = keys.length > 0
    ? keys.reduce((a, b) => distribution[a] > distribution[b] ? a : b)
    : 'N/A'

  const validBRs = saleProps.filter((p) => p.BR && !isNaN(Number(p.BR))).map((p) => Number(p.BR))
  const average = calculateAverage(validBRs)

  return {
    distribution,
    mostCommon,
    average,
  }
}

/**
 * Analysis 1B: BR Sizes Distribution - Lease Market
 * Analyze distribution of lease properties by bedroom count
 */
export function analyzeBRDistribution_Lease(properties: PropertyData[]): BRDistributionResultLease {
  const leaseProps = filterLeaseProperties(properties)
  const distribution: Record<string, number> = {}

  leaseProps.forEach((prop) => {
    const br = prop.BR ? String(prop.BR) : 'Unknown'
    distribution[br] = (distribution[br] || 0) + 1
  })

  // Handle empty distribution (no lease properties)
  const keys = Object.keys(distribution)
  const mostCommon = keys.length > 0
    ? keys.reduce((a, b) => distribution[a] > distribution[b] ? a : b)
    : 'N/A'

  const validBRs = leaseProps.filter((p) => p.BR && !isNaN(Number(p.BR))).map((p) => Number(p.BR))
  const average = calculateAverage(validBRs)

  return {
    distribution,
    mostCommon,
    average,
  }
}

/**
 * Analysis 2: HOA vs Non-HOA
 * Compare properties with and without HOA fees
 * Note: HOA_FEE field not in current schema, returns placeholder
 */
export function analyzeHOA(properties: PropertyData[]): HOAAnalysisResult {
  // Note: HOA_FEE field not currently in Analysis sheet schema
  // This is a placeholder implementation
  console.warn(`${LOG_PREFIX} HOA_FEE field not available in Analysis sheet`)

  return {
    withHOA: { count: 0, avgPrice: 0, avgHOAFee: 0 },
    withoutHOA: { count: properties.length, avgPrice: calculateAverage(properties.map((p) => p.SALE_PRICE)) },
    priceDifferential: 0,
  }
}

/**
 * Analysis 3A: STR vs Non-STR - Sale Market
 * Short-term rental eligibility comparison for sale properties
 * Note: STR_ELIGIBLE field not in current schema, returns placeholder
 */
export function analyzeSTR_Sale(properties: PropertyData[]): STRAnalysisResult {
  const saleProps = filterSaleProperties(properties)

  // Note: STR_ELIGIBLE field not currently in Analysis sheet schema
  // This is a placeholder implementation
  console.warn(`${LOG_PREFIX} STR_ELIGIBLE field not available - Analysis 3A (Sale)`)

  const avgPrice = calculateAverageSalePrice(saleProps)
  const avgPricePerSqft = calculateAverage(
    saleProps.map((p) => p.SALE_PRICE / p.SQFT).filter((x) => !isNaN(x) && isFinite(x))
  )

  return {
    strEligible: { count: 0, avgPrice: 0, avgPricePerSqft: 0 },
    nonSTR: { count: saleProps.length, avgPrice, avgPricePerSqft },
    premiumPercentage: 0,
  }
}

/**
 * Analysis 3B: STR vs Non-STR - Lease Market
 * Short-term rental eligibility comparison for lease properties
 * Note: STR_ELIGIBLE field not in current schema, returns placeholder
 */
export function analyzeSTR_Lease(properties: PropertyData[]): STRAnalysisResultLease {
  const leaseProps = filterLeaseProperties(properties)

  // Note: STR_ELIGIBLE field not currently in Analysis sheet schema
  // This is a placeholder implementation
  console.warn(`${LOG_PREFIX} STR_ELIGIBLE field not available - Analysis 3B (Lease)`)

  const avgMonthlyRent = calculateAverageMonthlyRent(leaseProps)
  const avgAnnualRent = avgMonthlyRent * 12

  return {
    strEligible: { count: 0, avgMonthlyRent: 0, avgAnnualRent: 0 },
    nonSTR: { count: leaseProps.length, avgMonthlyRent, avgAnnualRent },
    premiumPercentage: 0,
  }
}

/**
 * Analysis 4A: Renovation Score Impact (High/Mid/Low tiers) - Sale Market
 * Analyze impact of renovation quality on sale property values
 */
export function analyzeRenovationImpact_Sale(properties: PropertyData[]): RenovationImpactResult {
  const saleProps = filterSaleProperties(properties)
  const highTier = saleProps.filter((p) => getRenoTier(normalizeRenoScore(p.RENOVATE_SCORE)) === 'High')
  const midTier = saleProps.filter((p) => getRenoTier(normalizeRenoScore(p.RENOVATE_SCORE)) === 'Mid')
  const lowTier = saleProps.filter((p) => getRenoTier(normalizeRenoScore(p.RENOVATE_SCORE)) === 'Low')

  const calculateMetrics = (props: PropertyData[]): RenoTierMetricsSale => {
    const prices = props.map((p) => p.SALE_PRICE).filter((x) => !isNaN(x))
    const pricesPerSqft = props.map((p) => p.SALE_PRICE / p.SQFT).filter((x) => !isNaN(x) && isFinite(x))
    const scores = props.map((p) => normalizeRenoScore(p.RENOVATE_SCORE))
    return {
      count: props.length,
      avgPrice: calculateAverage(prices),
      avgPricePerSqft: calculateAverage(pricesPerSqft),
      avgScore: calculateAverage(scores),
    }
  }

  const metricsHigh = calculateMetrics(highTier)
  const metricsLow = calculateMetrics(lowTier)
  const metricsMid = calculateMetrics(midTier)

  const premiumHighvsLow = metricsLow.avgPrice > 0 ? ((metricsHigh.avgPrice - metricsLow.avgPrice) / metricsLow.avgPrice) * 100 : 0
  const premiumMidvsLow = metricsLow.avgPrice > 0 ? ((metricsMid.avgPrice - metricsLow.avgPrice) / metricsLow.avgPrice) * 100 : 0

  return {
    High: metricsHigh, Mid: metricsMid, Low: metricsLow,
    premiumHighvsLow, premiumMidvsLow,
    // Backward-compat aliases
    Y: metricsHigh, N: metricsLow, '0.5': metricsMid,
    premiumYvsN: premiumHighvsLow, premium05vsN: premiumMidvsLow,
  }
}

/**
 * Analysis 4B: Renovation Score Impact (High/Mid/Low tiers) - Lease Market
 * Analyze impact of renovation quality on lease property rents
 */
export function analyzeRenovationImpact_Lease(properties: PropertyData[]): RenovationImpactResultLease {
  const leaseProps = filterLeaseProperties(properties)
  const highTier = leaseProps.filter((p) => getRenoTier(normalizeRenoScore(p.RENOVATE_SCORE)) === 'High')
  const midTier = leaseProps.filter((p) => getRenoTier(normalizeRenoScore(p.RENOVATE_SCORE)) === 'Mid')
  const lowTier = leaseProps.filter((p) => getRenoTier(normalizeRenoScore(p.RENOVATE_SCORE)) === 'Low')

  const calculateMetrics = (props: PropertyData[]): RenoTierMetricsLease => {
    const monthlyRents = props.map((p) => p.SALE_PRICE).filter((x) => !isNaN(x))
    const annualRents = props.map((p) => p.SALE_PRICE * 12).filter((x) => !isNaN(x))
    const scores = props.map((p) => normalizeRenoScore(p.RENOVATE_SCORE))
    return {
      count: props.length,
      avgMonthlyRent: calculateAverage(monthlyRents),
      avgAnnualRent: calculateAverage(annualRents),
      avgScore: calculateAverage(scores),
    }
  }

  const metricsHigh = calculateMetrics(highTier)
  const metricsLow = calculateMetrics(lowTier)
  const metricsMid = calculateMetrics(midTier)

  const premiumHighvsLow = metricsLow.avgMonthlyRent > 0 ? ((metricsHigh.avgMonthlyRent - metricsLow.avgMonthlyRent) / metricsLow.avgMonthlyRent) * 100 : 0
  const premiumMidvsLow = metricsLow.avgMonthlyRent > 0 ? ((metricsMid.avgMonthlyRent - metricsLow.avgMonthlyRent) / metricsLow.avgMonthlyRent) * 100 : 0

  return {
    High: metricsHigh, Mid: metricsMid, Low: metricsLow,
    premiumHighvsLow, premiumMidvsLow,
    // Backward-compat aliases
    Y: metricsHigh, N: metricsLow, '0.5': metricsMid,
    premiumYvsN: premiumHighvsLow, premium05vsN: premiumMidvsLow,
  }
}

/**
 * Analysis 5: Comps Classification (Y vs N)
 * Analyze properties marked as comparables vs non-comparables
 */
export function analyzeCompsClassification(properties: PropertyData[]): CompsClassificationResult {
  const comps = properties.filter((p) => p.PROPERTY_RADAR_COMP_YN === 'Y')
  const nonComps = properties.filter((p) => p.PROPERTY_RADAR_COMP_YN === 'N')

  const calculateMetrics = (props: PropertyData[]) => {
    const prices = props.map((p) => p.SALE_PRICE).filter((x) => !isNaN(x))
    return {
      count: props.length,
      avgPrice: calculateAverage(prices),
      priceRange: getRange(prices),
    }
  }

  return {
    comps: calculateMetrics(comps),
    nonComps: calculateMetrics(nonComps),
  }
}

// ============================================================================
// CATEGORY B: MARKET POSITIONING (6-10)
// ============================================================================

/**
 * Analysis 6A: Square Footage Variance (Within 20%) - Sale Market
 * Analyze sale properties within/outside 20% of subject property square footage
 */
export function analyzeSqftVariance_Sale(properties: PropertyData[], subjectSqft: number): SqftVarianceResult {
  const saleProps = filterSaleProperties(properties)
  const threshold = subjectSqft * 0.2
  const within20 = saleProps.filter((p) => Math.abs(p.SQFT - subjectSqft) <= threshold)
  const outside20 = saleProps.filter((p) => Math.abs(p.SQFT - subjectSqft) > threshold)

  const within20PricePerSqft = within20.map((p) => p.SALE_PRICE / p.SQFT).filter((x) => !isNaN(x) && isFinite(x))
  const outside20PricePerSqft = outside20.map((p) => p.SALE_PRICE / p.SQFT).filter((x) => !isNaN(x) && isFinite(x))

  return {
    within20: {
      count: within20.length,
      avgPricePerSqft: calculateAverage(within20PricePerSqft),
    },
    outside20: {
      count: outside20.length,
      avgPricePerSqft: calculateAverage(outside20PricePerSqft),
    },
    optimalRange: {
      min: subjectSqft * 0.8,
      max: subjectSqft * 1.2,
    },
  }
}

/**
 * Analysis 6B: Square Footage Variance (Within 20%) - Lease Market
 * Analyze lease properties within/outside 20% of subject property square footage
 */
export function analyzeSqftVariance_Lease(properties: PropertyData[], subjectSqft: number): SqftVarianceResultLease {
  const leaseProps = filterLeaseProperties(properties)
  const threshold = subjectSqft * 0.2
  const within20 = leaseProps.filter((p) => Math.abs(p.SQFT - subjectSqft) <= threshold)
  const outside20 = leaseProps.filter((p) => Math.abs(p.SQFT - subjectSqft) > threshold)

  const within20RentPerSqft = within20.map((p) => p.SALE_PRICE / p.SQFT).filter((x) => !isNaN(x) && isFinite(x))
  const outside20RentPerSqft = outside20.map((p) => p.SALE_PRICE / p.SQFT).filter((x) => !isNaN(x) && isFinite(x))

  return {
    within20: {
      count: within20.length,
      avgRentPerSqft: calculateAverage(within20RentPerSqft),
    },
    outside20: {
      count: outside20.length,
      avgRentPerSqft: calculateAverage(outside20RentPerSqft),
    },
    optimalRange: {
      min: subjectSqft * 0.8,
      max: subjectSqft * 1.2,
    },
  }
}

/**
 * Analysis 7A: Price Variance (Within 20% estimated) - Sale Market
 * Analyze sale properties within/outside 20% of estimated value
 */
export function analyzePriceVariance_Sale(properties: PropertyData[], estimatedValue: number): PriceVarianceResult {
  const saleProps = filterSaleProperties(properties)
  const threshold = estimatedValue * 0.2
  const within20 = saleProps.filter((p) => Math.abs(p.SALE_PRICE - estimatedValue) <= threshold)
  const outside20 = saleProps.filter((p) => Math.abs(p.SALE_PRICE - estimatedValue) > threshold)

  const underpriced = outside20.filter((p) => p.SALE_PRICE < estimatedValue - threshold).length
  const overpriced = outside20.filter((p) => p.SALE_PRICE > estimatedValue + threshold).length

  return {
    within20: {
      count: within20.length,
      avgDaysOnMarket: calculateAverage(within20.map((p) => p.DAYS_ON_MARKET)),
    },
    outside20: {
      count: outside20.length,
      underpriced,
      overpriced,
    },
  }
}

/**
 * Analysis 7B: Rent Variance (Within 20% estimated) - Lease Market
 * Analyze lease properties within/outside 20% of estimated monthly rent
 */
export function analyzePriceVariance_Lease(properties: PropertyData[], estimatedRent: number): PriceVarianceResultLease {
  const leaseProps = filterLeaseProperties(properties)
  const threshold = estimatedRent * 0.2
  const within20 = leaseProps.filter((p) => Math.abs(p.SALE_PRICE - estimatedRent) <= threshold)
  const outside20 = leaseProps.filter((p) => Math.abs(p.SALE_PRICE - estimatedRent) > threshold)

  const belowMarket = outside20.filter((p) => p.SALE_PRICE < estimatedRent - threshold).length
  const aboveMarket = outside20.filter((p) => p.SALE_PRICE > estimatedRent + threshold).length

  return {
    within20: {
      count: within20.length,
      avgDaysOnMarket: calculateAverage(within20.map((p) => p.DAYS_ON_MARKET)),
    },
    outside20: {
      count: outside20.length,
      belowMarket,
      aboveMarket,
    },
  }
}

/**
 * Analysis 8: Lease vs Sale Comparison
 * Compare rental pricing per square foot to sales pricing (v2 - FIXED)
 */
export function analyzeLeaseVsSale(properties: PropertyData[]): LeaseVsSaleResult {
  const leaseProps = filterLeaseProperties(properties)
  const saleProps = filterSaleProperties(properties)

  // Calculate sale price per sqft
  const salePricePerSqft = saleProps
    .map((p) => p.SALE_PRICE / p.SQFT)
    .filter((x) => !isNaN(x) && isFinite(x))
  const avgSalePricePerSqft = calculateAverage(salePricePerSqft)

  // Calculate monthly and annual rent per sqft
  const monthlyRentPerSqft = leaseProps
    .map((p) => p.SALE_PRICE / p.SQFT) // SALE_PRICE = monthly rent for leases
    .filter((x) => !isNaN(x) && isFinite(x))
  const avgMonthlyRentPerSqft = calculateAverage(monthlyRentPerSqft)
  const avgAnnualRentPerSqft = avgMonthlyRentPerSqft * 12

  // Calculate cap rate (assuming 30% operating expenses)
  const capRate = avgSalePricePerSqft > 0 ? (avgAnnualRentPerSqft * 0.7) / avgSalePricePerSqft : 0

  // Calculate rent-to-value ratio
  const avgMonthlyRent = calculateAverageMonthlyRent(leaseProps)
  const avgSalePrice = calculateAverageSalePrice(saleProps)
  const rentToValueRatio = avgSalePrice > 0 ? (avgMonthlyRent * 12) / avgSalePrice : 0

  return {
    lease: {
      avgAnnualPerSqft: avgAnnualRentPerSqft,
      capRate: capRate * 100, // Convert to percentage
    },
    sale: {
      avgPerSqft: avgSalePricePerSqft,
    },
    rentToValueRatio: rentToValueRatio * 100, // Convert to percentage
  }
}

/**
 * Analysis 9: PropertyRadar Comps vs Standard Comps
 * Compare PropertyRadar selected comps to standard MLS comps
 */
export function analyzePropertyRadarComps(properties: PropertyData[]): PropertyRadarCompsResult {
  const prComps = properties.filter((p) => p.PROPERTY_RADAR_COMP_YN === 'Y')
  const standardComps = properties.filter((p) => p.Item.includes('Comp'))

  return {
    propertyRadar: {
      count: prComps.length,
    },
    standard: {
      count: standardComps.length,
    },
  }
}

/**
 * Analysis 10: Property Radar Individual Comparisons
 * Detailed analysis of Property Radar comp properties
 */
export function analyzeIndividualPRComps(properties: PropertyData[], subjectProperty: PropertyData): IndividualPRCompsResult {
  const prComps = properties.filter((p) => p.PROPERTY_RADAR_COMP_YN === 'Y')

  const comparisons = prComps.map((comp, index) => ({
    compNumber: index + 1,
    address: comp.FULL_ADDRESS,
    priceDiff: comp.SALE_PRICE - subjectProperty.SALE_PRICE,
    sqftDiff: comp.SQFT - subjectProperty.SQFT,
  }))

  return {
    comparisons,
    avgSimilarity: 0, // Placeholder - would need similarity algorithm
  }
}

// ============================================================================
// CATEGORY C: TIME & LOCATION (11-14)
// ============================================================================

/**
 * Analysis 11: Exact BR vs Within ±1 BR
 * Analyze impact of bedroom count matching precision
 */
/**
 * Analysis 11A: BR Precision (Exact vs Within ±1) - Sale Market
 * Compare exact BR match vs properties within 1 BR difference for sale properties
 */
export function analyzeBRPrecision_Sale(properties: PropertyData[], subjectBR: number): BRPrecisionResult {
  const saleProps = filterSaleProperties(properties)
  const exact = saleProps.filter((p) => p.BR === subjectBR)
  const within1 = saleProps.filter((p) => Math.abs(p.BR - subjectBR) <= 1)

  const calculateMetrics = (props: PropertyData[]) => {
    const prices = props.map((p) => p.SALE_PRICE).filter((x) => !isNaN(x))
    return {
      count: props.length,
      avgPrice: calculateAverage(prices),
      priceRange: getRange(prices),
    }
  }

  return {
    exact: calculateMetrics(exact),
    within1: calculateMetrics(within1),
  }
}

/**
 * Analysis 11B: BR Precision (Exact vs Within ±1) - Lease Market
 * Compare exact BR match vs properties within 1 BR difference for lease properties
 */
export function analyzeBRPrecision_Lease(properties: PropertyData[], subjectBR: number): BRPrecisionResultLease {
  const leaseProps = filterLeaseProperties(properties)
  const exact = leaseProps.filter((p) => p.BR === subjectBR)
  const within1 = leaseProps.filter((p) => Math.abs(p.BR - subjectBR) <= 1)

  const calculateMetrics = (props: PropertyData[]) => {
    const monthlyRents = props.map((p) => p.SALE_PRICE).filter((x) => !isNaN(x))
    return {
      count: props.length,
      avgMonthlyRent: calculateAverage(monthlyRents),
      rentRange: getRange(monthlyRents),
    }
  }

  return {
    exact: calculateMetrics(exact),
    within1: calculateMetrics(within1),
  }
}

/**
 * Analysis 12: T-36 vs T-12 Time Analysis
 * Compare 3-year vs 1-year market trends
 */
export function analyzeTimeFrames(properties: PropertyData[]): TimeFramesResult {
  const now = new Date()
  const cutoffDate12 = new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000) // ~12 months
  const cutoffDate36 = new Date(now.getTime() - 36 * 30 * 24 * 60 * 60 * 1000) // ~36 months

  const t12 = properties.filter((p) => {
    const saleDate = parseDate(p.SALE_DATE)
    return saleDate && saleDate >= cutoffDate12
  })

  const t36 = properties.filter((p) => {
    const saleDate = parseDate(p.SALE_DATE)
    return saleDate && saleDate >= cutoffDate36
  })

  const t36Only = properties.filter((p) => {
    const saleDate = parseDate(p.SALE_DATE)
    return saleDate && saleDate >= cutoffDate36 && saleDate < cutoffDate12
  })

  const t12Prices = t12.map((p) => p.SALE_PRICE).filter((x) => !isNaN(x))
  const t36Prices = t36.map((p) => p.SALE_PRICE).filter((x) => !isNaN(x))
  const t36OnlyPrices = t36Only.map((p) => p.SALE_PRICE).filter((x) => !isNaN(x))

  const t12AvgPrice = calculateAverage(t12Prices)
  const t36OnlyAvgPrice = calculateAverage(t36OnlyPrices)

  const appreciation = t36OnlyAvgPrice > 0 ? ((t12AvgPrice - t36OnlyAvgPrice) / t36OnlyAvgPrice) * 100 : 0

  return {
    t12: {
      count: t12.length,
      avgPrice: t12AvgPrice,
    },
    t36: {
      count: t36.length,
      avgPrice: calculateAverage(t36Prices),
    },
    appreciation,
  }
}

/**
 * Analysis 13: Direct vs Indirect 1.5mi
 * Compare direct subdivision comps vs 1.5-mile radius comps
 */
export function analyzeDirectVsIndirect(properties: PropertyData[]): DirectVsIndirectResult {
  const direct = properties.filter((p) => p.Item.toLowerCase().includes('direct'))
  const indirect = properties.filter((p) => p.Item.toLowerCase().includes('1.5'))

  const directPrices = direct.map((p) => p.SALE_PRICE).filter((x) => !isNaN(x))
  const indirectPrices = indirect.map((p) => p.SALE_PRICE).filter((x) => !isNaN(x))

  const reliabilityScore = direct.length / (direct.length + indirect.length) || 0

  return {
    direct: {
      count: direct.length,
      avgPrice: calculateAverage(directPrices),
    },
    indirect: {
      count: indirect.length,
      avgPrice: calculateAverage(indirectPrices),
    },
    reliabilityScore,
  }
}

/**
 * Analysis 14: T-12 Direct vs T-12 Indirect 1.5mi
 * Recent direct comps vs recent area comps
 */
export function analyzeRecentDirectVsIndirect(properties: PropertyData[]): RecentDirectVsIndirectResult {
  const now = new Date()
  const cutoffDate = new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000) // ~12 months

  const recent = properties.filter((p) => {
    const saleDate = parseDate(p.SALE_DATE)
    return saleDate && saleDate >= cutoffDate
  })

  const recentDirect = recent.filter((p) => p.Item.toLowerCase().includes('direct'))
  const recentIndirect = recent.filter((p) => p.Item.toLowerCase().includes('1.5'))

  return {
    recentDirect: {
      count: recentDirect.length,
      avgPrice: calculateAverage(recentDirect.map((p) => p.SALE_PRICE)),
      avgDaysOnMarket: calculateAverage(recentDirect.map((p) => p.DAYS_ON_MARKET)),
    },
    recentIndirect: {
      count: recentIndirect.length,
      avgPrice: calculateAverage(recentIndirect.map((p) => p.SALE_PRICE)),
      avgDaysOnMarket: calculateAverage(recentIndirect.map((p) => p.DAYS_ON_MARKET)),
    },
  }
}

// ============================================================================
// CATEGORY D: MARKET ACTIVITY (15-16)
// ============================================================================

/**
 * Analysis 15A: Active vs Closed - Sale Market
 * Compare active sale listings to closed sales
 */
export function analyzeActiveVsClosed_Sale(properties: PropertyData[]): ActiveVsClosedResult {
  const saleProps = filterSaleProperties(properties)
  const active = saleProps.filter((p) => p.STATUS === 'A')
  const closed = saleProps.filter((p) => p.STATUS === 'C')

  const activePrices = active.map((p) => p.OG_LIST_PRICE).filter((x) => !isNaN(x))
  const closedPrices = closed.map((p) => p.SALE_PRICE).filter((x) => !isNaN(x))

  const avgListPrice = calculateAverage(activePrices)
  const avgSalePrice = calculateAverage(closedPrices)

  // Handle empty arrays - check denominator to avoid NaN
  const totalCount = active.length + closed.length
  const absorptionRate = totalCount > 0 ? closed.length / totalCount : 0
  const listToSaleRatio = avgListPrice > 0 ? avgSalePrice / avgListPrice : 0

  return {
    active: {
      count: active.length,
      avgListPrice,
      avgDaysOnMarket: calculateAverage(active.map((p) => p.DAYS_ON_MARKET)),
    },
    closed: {
      count: closed.length,
      avgSalePrice,
      avgDaysToClose: calculateAverage(closed.map((p) => p.DAYS_ON_MARKET)),
    },
    absorptionRate,
    listToSaleRatio,
  }
}

/**
 * Analysis 15B: Active vs Closed - Lease Market
 * Compare active lease listings to closed leases
 */
export function analyzeActiveVsClosed_Lease(properties: PropertyData[]): ActiveVsClosedResultLease {
  const leaseProps = filterLeaseProperties(properties)
  const active = leaseProps.filter((p) => p.STATUS === 'A')
  const closed = leaseProps.filter((p) => p.STATUS === 'C')

  const activeRents = active.map((p) => p.OG_LIST_PRICE).filter((x) => !isNaN(x))
  const closedRents = closed.map((p) => p.SALE_PRICE).filter((x) => !isNaN(x))

  const avgListRent = calculateAverage(activeRents)
  const avgLeaseRent = calculateAverage(closedRents)

  // Handle empty arrays - check denominator to avoid NaN
  const totalCount = active.length + closed.length
  const absorptionRate = totalCount > 0 ? closed.length / totalCount : 0
  const listToLeaseRatio = avgListRent > 0 ? avgLeaseRent / avgListRent : 0

  return {
    active: {
      count: active.length,
      avgListRent,
      avgDaysOnMarket: calculateAverage(active.map((p) => p.DAYS_ON_MARKET)),
    },
    closed: {
      count: closed.length,
      avgLeaseRent,
      avgDaysToLease: calculateAverage(closed.map((p) => p.DAYS_ON_MARKET)),
    },
    absorptionRate,
    listToLeaseRatio,
  }
}

/**
 * Analysis 16A: Active vs Pending - Sale Market
 * Analyze current sale market activity levels
 */
export function analyzeActiveVsPending_Sale(properties: PropertyData[]): ActiveVsPendingResult {
  const saleProps = filterSaleProperties(properties)
  const active = saleProps.filter((p) => p.STATUS === 'A')
  const pending = saleProps.filter((p) => p.STATUS === 'P')

  // Handle empty arrays - check denominator to avoid NaN
  const totalCount = active.length + pending.length
  const pendingRatio = totalCount > 0 ? pending.length / totalCount : 0

  return {
    active: {
      count: active.length,
      avgListPrice: calculateAverage(active.map((p) => p.OG_LIST_PRICE)),
      avgDaysActive: calculateAverage(active.map((p) => p.DAYS_ON_MARKET)),
    },
    pending: {
      count: pending.length,
      avgDaysToContract: calculateAverage(pending.map((p) => p.DAYS_ON_MARKET)),
    },
    pendingRatio,
  }
}

/**
 * Analysis 16B: Active vs Pending - Lease Market
 * Analyze current lease market activity levels
 */
export function analyzeActiveVsPending_Lease(properties: PropertyData[]): ActiveVsPendingResultLease {
  const leaseProps = filterLeaseProperties(properties)
  const active = leaseProps.filter((p) => p.STATUS === 'A')
  const pending = leaseProps.filter((p) => p.STATUS === 'P')

  // Handle empty arrays - check denominator to avoid NaN
  const totalCount = active.length + pending.length
  const pendingRatio = totalCount > 0 ? pending.length / totalCount : 0

  return {
    active: {
      count: active.length,
      avgListRent: calculateAverage(active.map((p) => p.OG_LIST_PRICE)),
      avgDaysActive: calculateAverage(active.map((p) => p.DAYS_ON_MARKET)),
    },
    pending: {
      count: pending.length,
      avgDaysToPending: calculateAverage(pending.map((p) => p.DAYS_ON_MARKET)),
    },
    pendingRatio,
  }
}

// ============================================================================
// CATEGORY E: FINANCIAL IMPACT (17-22)
// ============================================================================

/**
 * Analysis 17A: Δ $/sqft (High vs Low renovation tier) - Sale Market
 * Calculate price per square foot differential for renovated sale properties
 */
export function calculateRenovationDelta_Sale(properties: PropertyData[]): RenovationDeltaResult {
  const saleProps = filterSaleProperties(properties)
  const renovated = saleProps.filter((p) => getRenoTier(normalizeRenoScore(p.RENOVATE_SCORE)) === 'High')
  const notRenovated = saleProps.filter((p) => getRenoTier(normalizeRenoScore(p.RENOVATE_SCORE)) === 'Low')

  const avgSqftY = calculateAverage(renovated.map((p) => p.SALE_PRICE / p.SQFT).filter((x) => !isNaN(x) && isFinite(x)))
  const avgSqftN = calculateAverage(notRenovated.map((p) => p.SALE_PRICE / p.SQFT).filter((x) => !isNaN(x) && isFinite(x)))

  const delta = avgSqftY - avgSqftN
  const percentageIncrease = avgSqftN > 0 ? (delta / avgSqftN) * 100 : 0

  return {
    renovatedAvg: avgSqftY,
    notRenovatedAvg: avgSqftN,
    delta,
    percentageIncrease,
  }
}

/**
 * Analysis 17B: Δ rent/sqft (High vs Low renovation tier) - Lease Market
 * Calculate rent per square foot differential for renovated lease properties
 */
export function calculateRenovationDelta_Lease(properties: PropertyData[]): RenovationDeltaResultLease {
  const leaseProps = filterLeaseProperties(properties)
  const renovated = leaseProps.filter((p) => getRenoTier(normalizeRenoScore(p.RENOVATE_SCORE)) === 'High')
  const notRenovated = leaseProps.filter((p) => getRenoTier(normalizeRenoScore(p.RENOVATE_SCORE)) === 'Low')

  const avgRentSqftY = calculateAverage(renovated.map((p) => p.SALE_PRICE / p.SQFT).filter((x) => !isNaN(x) && isFinite(x)))
  const avgRentSqftN = calculateAverage(notRenovated.map((p) => p.SALE_PRICE / p.SQFT).filter((x) => !isNaN(x) && isFinite(x)))

  const delta = avgRentSqftY - avgRentSqftN
  const percentageIncrease = avgRentSqftN > 0 ? (delta / avgRentSqftN) * 100 : 0

  const avgMonthlyRentY = calculateAverageMonthlyRent(renovated)
  const avgMonthlyRentN = calculateAverageMonthlyRent(notRenovated)

  return {
    renovatedAvg: avgRentSqftY,
    notRenovatedAvg: avgRentSqftN,
    delta,
    percentageIncrease,
    monthlyIncomeUplift: avgMonthlyRentY - avgMonthlyRentN,
    annualIncomeUplift: (avgMonthlyRentY - avgMonthlyRentN) * 12,
  }
}

/**
 * Analysis 18A: Δ $/sqft (Mid vs Low renovation tier) - Sale Market
 * Calculate impact of partial renovations on sale properties
 */
export function calculatePartialRenovationDelta_Sale(properties: PropertyData[]): PartialRenovationDeltaResult {
  const saleProps = filterSaleProperties(properties)
  const partial = saleProps.filter((p) => getRenoTier(normalizeRenoScore(p.RENOVATE_SCORE)) === 'Mid')
  const notRenovated = saleProps.filter((p) => getRenoTier(normalizeRenoScore(p.RENOVATE_SCORE)) === 'Low')

  const avgSqft05 = calculateAverage(partial.map((p) => p.SALE_PRICE / p.SQFT).filter((x) => !isNaN(x) && isFinite(x)))
  const avgSqftN = calculateAverage(notRenovated.map((p) => p.SALE_PRICE / p.SQFT).filter((x) => !isNaN(x) && isFinite(x)))

  const delta = avgSqft05 - avgSqftN
  const percentageIncrease = avgSqftN > 0 ? (delta / avgSqftN) * 100 : 0

  return {
    partialAvg: avgSqft05,
    notRenovatedAvg: avgSqftN,
    delta,
    percentageIncrease,
  }
}

/**
 * Analysis 18B: Δ rent/sqft (Mid vs Low renovation tier) - Lease Market
 * Calculate impact of partial renovations on lease properties
 */
export function calculatePartialRenovationDelta_Lease(properties: PropertyData[]): PartialRenovationDeltaResultLease {
  const leaseProps = filterLeaseProperties(properties)
  const partial = leaseProps.filter((p) => getRenoTier(normalizeRenoScore(p.RENOVATE_SCORE)) === 'Mid')
  const notRenovated = leaseProps.filter((p) => getRenoTier(normalizeRenoScore(p.RENOVATE_SCORE)) === 'Low')

  const avgRentSqft05 = calculateAverage(partial.map((p) => p.SALE_PRICE / p.SQFT).filter((x) => !isNaN(x) && isFinite(x)))
  const avgRentSqftN = calculateAverage(notRenovated.map((p) => p.SALE_PRICE / p.SQFT).filter((x) => !isNaN(x) && isFinite(x)))

  const delta = avgRentSqft05 - avgRentSqftN
  const percentageIncrease = avgRentSqftN > 0 ? (delta / avgRentSqftN) * 100 : 0

  const avgMonthlyRent05 = calculateAverageMonthlyRent(partial)
  const avgMonthlyRentN = calculateAverageMonthlyRent(notRenovated)

  return {
    partialAvg: avgRentSqft05,
    notRenovatedAvg: avgRentSqftN,
    delta,
    percentageIncrease,
    monthlyIncomeUplift: avgMonthlyRent05 - avgMonthlyRentN,
    annualIncomeUplift: (avgMonthlyRent05 - avgMonthlyRentN) * 12,
  }
}

/**
 * Analysis 19A: Interquartile Range (25th-75th percentile) - Sale Market
 * Analyze middle 50% of sale market for price AND $/sqft
 */
export function calculateInterquartileRanges_Sale(properties: PropertyData[]): InterquartileRangesResult {
  const saleProps = filterSaleProperties(properties)

  const prices = saleProps.map((p) => p.SALE_PRICE).filter((x) => !isNaN(x)).sort((a, b) => a - b)
  const pricesPerSqft = saleProps
    .map((p) => p.SALE_PRICE / p.SQFT)
    .filter((x) => !isNaN(x) && isFinite(x))
    .sort((a, b) => a - b)

  return {
    price: {
      q25: percentile(prices, 25),
      median: percentile(prices, 50),
      q75: percentile(prices, 75),
      iqr: percentile(prices, 75) - percentile(prices, 25),
    },
    pricePerSqft: {
      q25: percentile(pricesPerSqft, 25),
      median: percentile(pricesPerSqft, 50),
      q75: percentile(pricesPerSqft, 75),
      iqr: percentile(pricesPerSqft, 75) - percentile(pricesPerSqft, 25),
    },
  }
}

/**
 * Analysis 19B: Interquartile Range (25th-75th percentile) - Lease Market
 * Analyze middle 50% of lease market for monthly rent, annual rent, and rent/sqft
 */
export function calculateInterquartileRanges_Lease(properties: PropertyData[]): InterquartileRangesResultLease {
  const leaseProps = filterLeaseProperties(properties)

  const monthlyRents = leaseProps.map((p) => p.SALE_PRICE).filter((x) => !isNaN(x)).sort((a, b) => a - b)
  const annualRents = leaseProps.map((p) => p.SALE_PRICE * 12).filter((x) => !isNaN(x)).sort((a, b) => a - b)
  const rentPerSqft = leaseProps
    .map((p) => p.SALE_PRICE / p.SQFT)
    .filter((x) => !isNaN(x) && isFinite(x))
    .sort((a, b) => a - b)

  return {
    monthlyRent: {
      q25: percentile(monthlyRents, 25),
      median: percentile(monthlyRents, 50),
      q75: percentile(monthlyRents, 75),
      iqr: percentile(monthlyRents, 75) - percentile(monthlyRents, 25),
    },
    annualRent: {
      q25: percentile(annualRents, 25),
      median: percentile(annualRents, 50),
      q75: percentile(annualRents, 75),
      iqr: percentile(annualRents, 75) - percentile(annualRents, 25),
    },
    rentPerSqft: {
      q25: percentile(rentPerSqft, 25),
      median: percentile(rentPerSqft, 50),
      q75: percentile(rentPerSqft, 75),
      iqr: percentile(rentPerSqft, 75) - percentile(rentPerSqft, 25),
    },
  }
}

/**
 * Analysis 20A: Distribution Tails (10th-90th & 5th-95th percentiles) - Sale Market
 * Analyze extreme sale price values
 */
export function analyzeDistributionTails_Sale(properties: PropertyData[]): DistributionTailsResult {
  const saleProps = filterSaleProperties(properties)
  const prices = saleProps.map((p) => p.SALE_PRICE).filter((x) => !isNaN(x)).sort((a, b) => a - b)

  return {
    percentiles: {
      p5: percentile(prices, 5),
      p10: percentile(prices, 10),
      p50: percentile(prices, 50),
      p90: percentile(prices, 90),
      p95: percentile(prices, 95),
    },
    ranges: {
      middle80: percentile(prices, 90) - percentile(prices, 10),
      middle90: percentile(prices, 95) - percentile(prices, 5),
    },
  }
}

/**
 * Analysis 20B: Distribution Tails (10th-90th & 5th-95th percentiles) - Lease Market
 * Analyze extreme monthly rent values
 */
export function analyzeDistributionTails_Lease(properties: PropertyData[]): DistributionTailsResultLease {
  const leaseProps = filterLeaseProperties(properties)
  const monthlyRents = leaseProps.map((p) => p.SALE_PRICE).filter((x) => !isNaN(x)).sort((a, b) => a - b)

  return {
    percentiles: {
      p5: percentile(monthlyRents, 5),
      p10: percentile(monthlyRents, 10),
      p50: percentile(monthlyRents, 50),
      p90: percentile(monthlyRents, 90),
      p95: percentile(monthlyRents, 95),
    },
    ranges: {
      middle80: percentile(monthlyRents, 90) - percentile(monthlyRents, 10),
      middle90: percentile(monthlyRents, 95) - percentile(monthlyRents, 5),
    },
  }
}

/**
 * Analysis 21: Expected Annual NOI Leasing
 * Project net operating income from rental strategy using 2D multiplier (score × recency)
 */
export function calculateExpectedNOI(property: PropertyData): ExpectedNOIResult {
  const salePrice = property.SALE_PRICE
  const numericScore = normalizeRenoScore(property.RENOVATE_SCORE)
  const recency = getRenoRecency(property.RENO_YEAR_EST)
  const multiplier = getNoiMultiplier(numericScore, property.RENO_YEAR_EST)

  const monthlyRent = salePrice * multiplier
  const annualIncome = monthlyRent * 12

  // Operating expenses (35% of income)
  const operatingExpenses = annualIncome * 0.35

  const annualNOI = annualIncome - operatingExpenses
  const capRate = salePrice > 0 ? annualNOI / salePrice : 0

  return {
    monthlyRent,
    annualIncome,
    operatingExpenses,
    annualNOI,
    capRate,
    renoScore: numericScore,
    renoRecency: recency,
    multiplierUsed: multiplier,
  }
}

/**
 * Analysis 22: Expected NOI with Renovation Improvements
 * Project NOI after upgrading renovation score by up to 3 points with scaled costs
 */
export function calculateImprovedNOI(property: PropertyData): ImprovedNOIResult {
  const currentScore = normalizeRenoScore(property.RENOVATE_SCORE)
  const improvedScore = Math.min(currentScore + 3, 10)
  const improvementCost = estimateImprovementCost(currentScore, improvedScore)

  const currentNOI = calculateExpectedNOI(property)
  const improvedNOI = calculateExpectedNOI({
    ...property,
    RENOVATE_SCORE: improvedScore,
    RENO_YEAR_EST: new Date().getFullYear(), // model as fresh renovation
  })

  const noiIncrease = improvedNOI.annualNOI - currentNOI.annualNOI
  const paybackPeriod = noiIncrease > 0 ? improvementCost / noiIncrease : 0
  const roi = improvementCost > 0 ? (noiIncrease / improvementCost) * 100 : 0

  return {
    currentNOI: currentNOI.annualNOI,
    improvedNOI: improvedNOI.annualNOI,
    noiIncrease,
    improvementCost,
    paybackPeriod,
    roi,
    currentScore,
    improvedScore,
    scoreDelta: improvedScore - currentScore,
  }
}

// ============================================================================
// HELPER UTILITIES
// ============================================================================

/**
 * Read property data from Analysis sheet.
 * Returns properties with normalized RENOVATE_SCORE (1-10) and validation warnings.
 */
function readAnalysisSheet(workbook: ExcelJS.Workbook): { properties: PropertyData[]; warnings: string[] } {
  const sheet = workbook.getWorksheet('Analysis')
  if (!sheet) {
    throw new Error('Analysis sheet not found in workbook')
  }

  const properties: PropertyData[] = []
  const warnings: string[] = []

  // Get headers from row 1
  const headers: string[] = []
  const headerRow = sheet.getRow(1)
  headerRow.eachCell((cell, colNumber) => {
    headers[colNumber - 1] = cell.value?.toString() || ''
  })

  // Read data rows (starting from row 2)
  for (let rowNum = 2; rowNum <= sheet.rowCount; rowNum++) {
    const row = sheet.getRow(rowNum)
    const rowData: any = {}

    // Map each cell to header name
    row.eachCell((cell, colNumber) => {
      const header = headers[colNumber - 1]
      if (header) {
        rowData[header] = cell.value
      }
    })

    // Coerce all numeric fields to numbers (ExcelJS may return strings, Dates, or objects)
    const numericFields = [
      'SALE_PRICE', 'OG_LIST_PRICE', 'SELLER_BASIS', 'BR', 'BA',
      'SQFT', 'LOT_SIZE', 'YEAR_BUILT', 'DAYS_ON_MARKET', 'LAT', 'LON',
    ];
    for (const field of numericFields) {
      if (rowData[field] !== undefined && rowData[field] !== '' && rowData[field] !== null) {
        const n = Number(rowData[field]);
        rowData[field] = isNaN(n) || !isFinite(n) ? 0 : (field === 'DAYS_ON_MARKET' ? Math.round(n) : n);
      } else {
        rowData[field] = 0;
      }
    }

    // Only add if row has data (check if Item column exists)
    if (rowData['Item']) {
      // Validate and normalize RENOVATE_SCORE
      const rawScore = rowData['RENOVATE_SCORE']
      const normalized = normalizeRenoScore(rawScore)
      if (rawScore !== null && rawScore !== undefined && rawScore !== '') {
        const rawStr = String(rawScore).trim()
        const isLegacy = /^[YyNn]$/.test(rawStr) || rawStr === '0.5'
        const isNumeric = !isNaN(Number(rawStr)) && Number(rawStr) >= 1 && Number(rawStr) <= 10
        if (!isLegacy && !isNumeric && !(typeof rawScore === 'number' && rawScore === 0.5)) {
          warnings.push(`Row ${rowNum}: RENOVATE_SCORE '${rawStr}' not recognized, defaulted to ${normalized}`)
        }
      }
      rowData['RENOVATE_SCORE'] = normalized

      // Validate RENO_YEAR_EST if present
      const rawYear = rowData['RENO_YEAR_EST']
      if (rawYear !== null && rawYear !== undefined && rawYear !== '') {
        const yearNum = Number(rawYear)
        const currentYear = new Date().getFullYear()
        if (isNaN(yearNum) || yearNum < 1950 || yearNum > currentYear + 5) {
          warnings.push(`Row ${rowNum}: RENO_YEAR_EST '${rawYear}' invalid, will use Mid recency default`)
          rowData['RENO_YEAR_EST'] = undefined
        }
      }

      properties.push(rowData as PropertyData)
    }
  }

  return { properties, warnings }
}

/**
 * Calculate average of number array
 */
export function calculateAverage(values: number[]): number {
  // Filter to valid finite numbers to prevent string concatenation and NaN propagation
  const valid = values.filter((v) => typeof v === 'number' && isFinite(v))
  if (valid.length === 0) return 0
  const sum = valid.reduce((acc, val) => acc + val, 0)
  return sum / valid.length
}

/**
 * Calculate median of number array
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0

  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2
  }

  return sorted[mid]
}

/**
 * Calculate percentile of sorted values
 * @param values - Array of numbers (will be sorted internally)
 * @param p - Percentile (0-100)
 */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0

  const sorted = [...values].sort((a, b) => a - b)
  const index = (p / 100) * (sorted.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  const weight = index % 1

  if (lower === upper) {
    return sorted[lower]
  }

  return sorted[lower] * (1 - weight) + sorted[upper] * weight
}

/**
 * Get min and max range of values
 */
function getRange(values: number[]): { min: number; max: number } {
  if (values.length === 0) return { min: 0, max: 0 }
  return {
    min: Math.min(...values),
    max: Math.max(...values),
  }
}

/**
 * Parse date from various formats
 */
function parseDate(value: any): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value === 'string') {
    const parsed = new Date(value)
    if (!isNaN(parsed.getTime())) return parsed
  }
  return null
}
