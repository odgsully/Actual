/**
 * ReportIt Break-ups Analysis Generator
 *
 * Core calculation engine for 22 comparative property analyses
 * Reads data from Analysis sheet and returns structured results
 *
 * @module breakups-generator
 * @see DOCUMENTATION/REPORTIT_BREAKUPS_ANALYSIS.md for full specification
 */

import * as ExcelJS from 'exceljs'

const LOG_PREFIX = '[Breakups Generator]'

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
  RENOVATE_SCORE: string // Y/N/0.5
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

/**
 * Complete breakups analysis results container
 */
export interface BreakupsAnalysisResult {
  // Category A: Property Characteristics (1-5)
  brDistribution: BRDistributionResult
  hoaAnalysis: HOAAnalysisResult
  strAnalysis: STRAnalysisResult
  renovationImpact: RenovationImpactResult
  compsClassification: CompsClassificationResult

  // Category B: Market Positioning (6-10)
  sqftVariance: SqftVarianceResult
  priceVariance: PriceVarianceResult
  leaseVsSale: LeaseVsSaleResult
  propertyRadarComps: PropertyRadarCompsResult
  individualPRComps: IndividualPRCompsResult

  // Category C: Time & Location (11-14)
  brPrecision: BRPrecisionResult
  timeFrames: TimeFramesResult
  directVsIndirect: DirectVsIndirectResult
  recentDirectVsIndirect: RecentDirectVsIndirectResult

  // Category D: Market Activity (15-16)
  activeVsClosed: ActiveVsClosedResult
  activeVsPending: ActiveVsPendingResult

  // Category E: Financial Impact (17-22)
  renovationDelta: RenovationDeltaResult
  partialRenovationDelta: PartialRenovationDeltaResult
  interquartileRanges: InterquartileRangesResult
  distributionTails: DistributionTailsResult
  expectedNOI: ExpectedNOIResult
  improvedNOI: ImprovedNOIResult
}

// Individual analysis result types
export interface BRDistributionResult {
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

export interface RenovationImpactResult {
  Y: { count: number; avgPrice: number; avgPricePerSqft: number }
  N: { count: number; avgPrice: number; avgPricePerSqft: number }
  '0.5': { count: number; avgPrice: number; avgPricePerSqft: number }
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

export interface PriceVarianceResult {
  within20: { count: number; avgDaysOnMarket: number }
  outside20: { count: number; underpriced: number; overpriced: number }
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

export interface ActiveVsPendingResult {
  active: { count: number; avgListPrice: number; avgDaysActive: number }
  pending: { count: number; avgDaysToContract: number }
  pendingRatio: number
}

export interface RenovationDeltaResult {
  renovatedAvg: number
  notRenovatedAvg: number
  delta: number
  percentageIncrease: number
}

export interface PartialRenovationDeltaResult {
  partialAvg: number
  notRenovatedAvg: number
  delta: number
  percentageIncrease: number
}

export interface InterquartileRangesResult {
  price: { q25: number; median: number; q75: number; iqr: number }
  pricePerSqft: { q25: number; median: number; q75: number; iqr: number }
}

export interface DistributionTailsResult {
  percentiles: { p5: number; p10: number; p50: number; p90: number; p95: number }
  ranges: { middle80: number; middle90: number }
}

export interface ExpectedNOIResult {
  monthlyRent: number
  annualIncome: number
  operatingExpenses: number
  annualNOI: number
  capRate: number
}

export interface ImprovedNOIResult {
  currentNOI: number
  improvedNOI: number
  noiIncrease: number
  improvementCost: number
  paybackPeriod: number
  roi: number
}

// ============================================================================
// MAIN ORCHESTRATOR FUNCTION
// ============================================================================

/**
 * Generate all 22 breakups analyses from workbook
 *
 * @param workbook - ExcelJS workbook with Analysis sheet
 * @param subjectProperty - Subject property data for relative comparisons
 * @returns Complete analysis results
 */
export async function generateAllBreakupsAnalyses(
  workbook: ExcelJS.Workbook,
  subjectProperty: any
): Promise<BreakupsAnalysisResult> {
  console.log(`${LOG_PREFIX} Starting all breakups analyses`)

  // Read property data from Analysis sheet
  const properties = readAnalysisSheet(workbook)
  console.log(`${LOG_PREFIX} Read ${properties.length} properties from Analysis sheet`)

  if (properties.length === 0) {
    throw new Error('No properties found in Analysis sheet')
  }

  // Get subject property data (first row)
  const subject = properties[0]
  const subjectSqft = subject.SQFT || subjectProperty?.sqft || 0
  const subjectBR = subject.BR || subjectProperty?.bedrooms || 0
  const estimatedValue = subject.SALE_PRICE || subjectProperty?.estimatedValue || 0

  // Category A: Property Characteristics (1-5)
  console.log(`${LOG_PREFIX} Running Category A: Property Characteristics`)
  const brDistribution = analyzeBRDistribution(properties)
  const hoaAnalysis = analyzeHOA(properties)
  const strAnalysis = analyzeSTR(properties)
  const renovationImpact = analyzeRenovationImpact(properties)
  const compsClassification = analyzeCompsClassification(properties)

  // Category B: Market Positioning (6-10)
  console.log(`${LOG_PREFIX} Running Category B: Market Positioning`)
  const sqftVariance = analyzeSqftVariance(properties, subjectSqft)
  const priceVariance = analyzePriceVariance(properties, estimatedValue)
  const leaseVsSale = analyzeLeaseVsSale(properties)
  const propertyRadarComps = analyzePropertyRadarComps(properties)
  const individualPRComps = analyzeIndividualPRComps(properties, subject)

  // Category C: Time & Location (11-14)
  console.log(`${LOG_PREFIX} Running Category C: Time & Location`)
  const brPrecision = analyzeBRPrecision(properties, subjectBR)
  const timeFrames = analyzeTimeFrames(properties)
  const directVsIndirect = analyzeDirectVsIndirect(properties)
  const recentDirectVsIndirect = analyzeRecentDirectVsIndirect(properties)

  // Category D: Market Activity (15-16)
  console.log(`${LOG_PREFIX} Running Category D: Market Activity`)
  const activeVsClosed = analyzeActiveVsClosed(properties)
  const activeVsPending = analyzeActiveVsPending(properties)

  // Category E: Financial Impact (17-22)
  console.log(`${LOG_PREFIX} Running Category E: Financial Impact`)
  const renovationDelta = calculateRenovationDelta(properties)
  const partialRenovationDelta = calculatePartialRenovationDelta(properties)
  const interquartileRanges = calculateInterquartileRanges(properties)
  const distributionTails = analyzeDistributionTails(properties)
  const expectedNOI = calculateExpectedNOI(subject)
  const improvedNOI = calculateImprovedNOI(subject)

  console.log(`${LOG_PREFIX} All analyses complete`)

  return {
    brDistribution,
    hoaAnalysis,
    strAnalysis,
    renovationImpact,
    compsClassification,
    sqftVariance,
    priceVariance,
    leaseVsSale,
    propertyRadarComps,
    individualPRComps,
    brPrecision,
    timeFrames,
    directVsIndirect,
    recentDirectVsIndirect,
    activeVsClosed,
    activeVsPending,
    renovationDelta,
    partialRenovationDelta,
    interquartileRanges,
    distributionTails,
    expectedNOI,
    improvedNOI,
  }
}

// ============================================================================
// CATEGORY A: PROPERTY CHARACTERISTICS (1-5)
// ============================================================================

/**
 * Analysis 1: BR Sizes Distribution
 * Analyze distribution of properties by bedroom count
 */
export function analyzeBRDistribution(properties: PropertyData[]): BRDistributionResult {
  const distribution: Record<string, number> = {}

  properties.forEach((prop) => {
    const br = prop.BR ? String(prop.BR) : 'Unknown'
    distribution[br] = (distribution[br] || 0) + 1
  })

  const mostCommon = Object.keys(distribution).reduce((a, b) =>
    distribution[a] > distribution[b] ? a : b
  )

  const validBRs = properties.filter((p) => p.BR && !isNaN(Number(p.BR))).map((p) => Number(p.BR))
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
 * Analysis 3: STR vs Non-STR
 * Short-term rental eligibility comparison
 * Note: STR_ELIGIBLE field not in current schema, returns placeholder
 */
export function analyzeSTR(properties: PropertyData[]): STRAnalysisResult {
  // Note: STR_ELIGIBLE field not currently in Analysis sheet schema
  // This is a placeholder implementation
  console.warn(`${LOG_PREFIX} STR_ELIGIBLE field not available in Analysis sheet`)

  const avgPrice = calculateAverage(properties.map((p) => p.SALE_PRICE))
  const avgPricePerSqft = calculateAverage(properties.map((p) => p.SALE_PRICE / p.SQFT).filter((x) => !isNaN(x)))

  return {
    strEligible: { count: 0, avgPrice: 0, avgPricePerSqft: 0 },
    nonSTR: { count: properties.length, avgPrice, avgPricePerSqft },
    premiumPercentage: 0,
  }
}

/**
 * Analysis 4: RENOVATE_SCORE Impact (Y vs N vs 0.5)
 * Analyze impact of renovation status on property values
 */
export function analyzeRenovationImpact(properties: PropertyData[]): RenovationImpactResult {
  const renovated = properties.filter((p) => p.RENOVATE_SCORE === 'Y')
  const notRenovated = properties.filter((p) => p.RENOVATE_SCORE === 'N')
  const partial = properties.filter((p) => p.RENOVATE_SCORE === '0.5')

  const calculateMetrics = (props: PropertyData[]) => {
    const prices = props.map((p) => p.SALE_PRICE).filter((x) => !isNaN(x))
    const pricesPerSqft = props.map((p) => p.SALE_PRICE / p.SQFT).filter((x) => !isNaN(x) && isFinite(x))
    return {
      count: props.length,
      avgPrice: calculateAverage(prices),
      avgPricePerSqft: calculateAverage(pricesPerSqft),
    }
  }

  const metricsY = calculateMetrics(renovated)
  const metricsN = calculateMetrics(notRenovated)
  const metrics05 = calculateMetrics(partial)

  const premiumYvsN = metricsN.avgPrice > 0 ? ((metricsY.avgPrice - metricsN.avgPrice) / metricsN.avgPrice) * 100 : 0
  const premium05vsN = metricsN.avgPrice > 0 ? ((metrics05.avgPrice - metricsN.avgPrice) / metricsN.avgPrice) * 100 : 0

  return {
    Y: metricsY,
    N: metricsN,
    '0.5': metrics05,
    premiumYvsN,
    premium05vsN,
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
 * Analysis 6: Square Footage Variance (Within 20%)
 * Analyze properties within/outside 20% of subject property square footage
 */
export function analyzeSqftVariance(properties: PropertyData[], subjectSqft: number): SqftVarianceResult {
  const threshold = subjectSqft * 0.2
  const within20 = properties.filter((p) => Math.abs(p.SQFT - subjectSqft) <= threshold)
  const outside20 = properties.filter((p) => Math.abs(p.SQFT - subjectSqft) > threshold)

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
 * Analysis 7: Price Variance (Within 20% estimated)
 * Analyze properties within/outside 20% of estimated value
 */
export function analyzePriceVariance(properties: PropertyData[], estimatedValue: number): PriceVarianceResult {
  const threshold = estimatedValue * 0.2
  const within20 = properties.filter((p) => Math.abs(p.SALE_PRICE - estimatedValue) <= threshold)
  const outside20 = properties.filter((p) => Math.abs(p.SALE_PRICE - estimatedValue) > threshold)

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
 * Analysis 8: Lease SQFT vs Expected Value SQFT
 * Compare rental pricing per square foot to sales pricing
 */
export function analyzeLeaseVsSale(properties: PropertyData[]): LeaseVsSaleResult {
  const leases = properties.filter((p) => p.IS_RENTAL === 'Y')
  const sales = properties.filter((p) => p.IS_RENTAL === 'N')

  // Note: MONTHLY_RENT field not in current schema
  // Using placeholder calculation
  const salePricePerSqft = sales.map((p) => p.SALE_PRICE / p.SQFT).filter((x) => !isNaN(x) && isFinite(x))

  return {
    lease: {
      avgAnnualPerSqft: 0,
      capRate: 0,
    },
    sale: {
      avgPerSqft: calculateAverage(salePricePerSqft),
    },
    rentToValueRatio: 0,
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
export function analyzeBRPrecision(properties: PropertyData[], subjectBR: number): BRPrecisionResult {
  const exact = properties.filter((p) => p.BR === subjectBR)
  const within1 = properties.filter((p) => Math.abs(p.BR - subjectBR) <= 1)

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
 * Analysis 15: Active vs Closed
 * Compare active listings to closed sales
 */
export function analyzeActiveVsClosed(properties: PropertyData[]): ActiveVsClosedResult {
  const active = properties.filter((p) => p.STATUS === 'A')
  const closed = properties.filter((p) => p.STATUS === 'C')

  const activePrices = active.map((p) => p.OG_LIST_PRICE).filter((x) => !isNaN(x))
  const closedPrices = closed.map((p) => p.SALE_PRICE).filter((x) => !isNaN(x))

  const avgListPrice = calculateAverage(activePrices)
  const avgSalePrice = calculateAverage(closedPrices)

  const absorptionRate = closed.length / (active.length + closed.length) || 0
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
 * Analysis 16: Active vs Pending
 * Analyze current market activity levels
 */
export function analyzeActiveVsPending(properties: PropertyData[]): ActiveVsPendingResult {
  const active = properties.filter((p) => p.STATUS === 'A')
  const pending = properties.filter((p) => p.STATUS === 'P')

  const pendingRatio = pending.length / (active.length + pending.length) || 0

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

// ============================================================================
// CATEGORY E: FINANCIAL IMPACT (17-22)
// ============================================================================

/**
 * Analysis 17: Δ $/sqft (Y RENOVATION_SCORE vs N)
 * Calculate price per square foot differential for renovated properties
 */
export function calculateRenovationDelta(properties: PropertyData[]): RenovationDeltaResult {
  const renovated = properties.filter((p) => p.RENOVATE_SCORE === 'Y')
  const notRenovated = properties.filter((p) => p.RENOVATE_SCORE === 'N')

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
 * Analysis 18: Δ $/sqft (0.5 vs N)
 * Calculate impact of partial renovations
 */
export function calculatePartialRenovationDelta(properties: PropertyData[]): PartialRenovationDeltaResult {
  const partial = properties.filter((p) => p.RENOVATE_SCORE === '0.5')
  const notRenovated = properties.filter((p) => p.RENOVATE_SCORE === 'N')

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
 * Analysis 19: Interquartile Range (25th-75th percentile)
 * Analyze middle 50% of market for price AND $/sqft
 */
export function calculateInterquartileRanges(properties: PropertyData[]): InterquartileRangesResult {
  const prices = properties.map((p) => p.SALE_PRICE).filter((x) => !isNaN(x)).sort((a, b) => a - b)
  const pricesPerSqft = properties
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
 * Analysis 20: Distribution Tails (10th-90th & 5th-95th percentiles)
 * Analyze extreme market values
 */
export function analyzeDistributionTails(properties: PropertyData[]): DistributionTailsResult {
  const prices = properties.map((p) => p.SALE_PRICE).filter((x) => !isNaN(x)).sort((a, b) => a - b)

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
 * Analysis 21: Expected Annual NOI Leasing
 * Project net operating income from rental strategy
 */
export function calculateExpectedNOI(property: PropertyData): ExpectedNOIResult {
  const salePrice = property.SALE_PRICE
  const renovateScore = property.RENOVATE_SCORE

  // Rental rate multipliers based on renovation status
  const multipliers: Record<string, number> = {
    Y: 0.0065, // 0.65% monthly
    '0.5': 0.0055, // 0.55% monthly
    N: 0.0045, // 0.45% monthly
  }

  const monthlyRent = salePrice * (multipliers[renovateScore] || multipliers.N)
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
  }
}

/**
 * Analysis 22: Expected NOI with Cosmetic Improvements
 * Project NOI after upgrading from N to 0.5 renovation score
 */
export function calculateImprovedNOI(property: PropertyData, improvementCost: number = 15000): ImprovedNOIResult {
  const currentNOI = calculateExpectedNOI({ ...property, RENOVATE_SCORE: 'N' })
  const improvedNOI = calculateExpectedNOI({ ...property, RENOVATE_SCORE: '0.5' })

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
  }
}

// ============================================================================
// HELPER UTILITIES
// ============================================================================

/**
 * Read property data from Analysis sheet
 */
function readAnalysisSheet(workbook: ExcelJS.Workbook): PropertyData[] {
  const sheet = workbook.getWorksheet('Analysis')
  if (!sheet) {
    throw new Error('Analysis sheet not found in workbook')
  }

  const properties: PropertyData[] = []

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

    // Only add if row has data (check if Item column exists)
    if (rowData['Item']) {
      properties.push(rowData as PropertyData)
    }
  }

  return properties
}

/**
 * Calculate average of number array
 */
export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0
  const sum = values.reduce((acc, val) => acc + val, 0)
  return sum / values.length
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
