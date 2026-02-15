/**
 * ReportIt Break-ups Analysis Type Definitions
 *
 * Type definitions for 26 comparative property analyses (v2 with lease/sale differentiation)
 * Used by breakups-generator.ts and breakups-visualizer.ts
 *
 * @module lib/types/breakups-analysis
 */

// ============================================================================
// Transaction Type Enum (v2)
// ============================================================================

/**
 * Transaction type for property differentiation
 * IS_RENTAL='N' → SALE (SALE_PRICE = purchase price)
 * IS_RENTAL='Y' → LEASE (SALE_PRICE = monthly rent)
 */
export enum TransactionType {
  SALE = 'sale',
  LEASE = 'lease',
}

// ============================================================================
// Analysis Result Types (for each of the 26 analyses)
// ============================================================================

/**
 * Analysis 1A: BR Sizes Distribution - Sale Market
 */
export interface BRDistributionAnalysis {
  distribution: Record<number, number>; // bedroom count -> property count
  mostCommon: number;
  average: number;
  chartType: 'pie';
}

/**
 * Analysis 1B: BR Sizes Distribution - Lease Market
 */
export interface BRDistributionAnalysisLease {
  distribution: Record<number, number>; // bedroom count -> property count
  mostCommon: number;
  average: number;
  chartType: 'pie';
}

/**
 * Analysis 2: HOA vs Non-HOA
 */
export interface HOAAnalysis {
  withHOA: {
    count: number;
    avgPrice: number;
    avgHOAFee: number;
  };
  withoutHOA: {
    count: number;
    avgPrice: number;
  };
  priceDifferential: number;
  chartType: 'bar';
}

/**
 * Analysis 3: STR vs Non-STR (Base interface)
 */
export interface STRAnalysis {
  strEligible: {
    count: number;
    avgPrice: number;
    avgPricePerSqft: number;
  };
  nonSTR: {
    count: number;
    avgPrice: number;
    avgPricePerSqft: number;
  };
  premiumPercentage: number;
  chartType: 'pie';
}

/**
 * Analysis 3B: STR vs Non-STR (Lease Market)
 */
export interface STRAnalysisLease {
  strEligible: {
    count: number;
    avgMonthlyRent: number;
    avgAnnualRent: number;
  };
  nonSTR: {
    count: number;
    avgMonthlyRent: number;
    avgAnnualRent: number;
  };
  premiumPercentage: number;
  chartType: 'pie';
}

/**
 * Analysis 4A: RENOVATE_SCORE Impact (Sale Market)
 */
export interface RenovationImpactAnalysis {
  Y: PropertyMetrics;
  N: PropertyMetrics;
  '0.5': PropertyMetrics;
  premiumYvsN: number;
  premium05vsN: number;
  chartType: 'bar';
}

/**
 * Analysis 4B: RENOVATE_SCORE Impact (Lease Market)
 */
export interface RenovationImpactAnalysisLease {
  Y: PropertyMetricsLease;
  N: PropertyMetricsLease;
  '0.5': PropertyMetricsLease;
  premiumYvsN: number;
  premium05vsN: number;
  chartType: 'bar';
}

/**
 * Analysis 5: Comps Classification
 */
export interface CompsClassificationAnalysis {
  comps: {
    count: number;
    characteristics: CharacteristicsSummary;
    priceRange: PriceRange;
  };
  nonComps: {
    count: number;
    characteristics: CharacteristicsSummary;
    priceRange: PriceRange;
  };
  similarity: number;
  chartType: 'scatter';
}

/**
 * Analysis 6A: Square Footage Variance (Within 20%) - Sale Market
 */
export interface SqftVarianceAnalysis {
  subjectSqft: number;
  within20: {
    count: number;
    avgPricePerSqft: number;
    priceCorrelation: number;
  };
  outside20: {
    count: number;
    avgPricePerSqft: number;
  };
  optimalRange: {
    min: number;
    max: number;
  };
  chartType: 'scatter';
}

/**
 * Analysis 6B: Square Footage Variance (Within 20%) - Lease Market
 */
export interface SqftVarianceAnalysisLease {
  subjectSqft: number;
  within20: {
    count: number;
    avgRentPerSqft: number;
    rentCorrelation: number;
  };
  outside20: {
    count: number;
    avgRentPerSqft: number;
  };
  optimalRange: {
    min: number;
    max: number;
  };
  chartType: 'scatter';
}

/**
 * Analysis 7A: Price Variance (Within 20%) - Sale Market
 */
export interface PriceVarianceAnalysis {
  estimatedValue: number;
  within20: {
    count: number;
    characteristics: CharacteristicsSummary;
    avgDaysOnMarket: number;
  };
  outside20: {
    count: number;
    underpriced: number;
    overpriced: number;
  };
  chartType: 'scatter';
}

/**
 * Analysis 7B: Rent Variance (Within 20%) - Lease Market
 */
export interface PriceVarianceAnalysisLease {
  estimatedRent: number;
  within20: {
    count: number;
    characteristics: CharacteristicsSummary;
    avgDaysOnMarket: number;
  };
  outside20: {
    count: number;
    belowMarket: number;
    aboveMarket: number;
  };
  chartType: 'scatter';
}

/**
 * Analysis 8: Lease SQFT vs Expected Value SQFT
 */
export interface LeaseVsSaleAnalysis {
  lease: {
    avgAnnualPerSqft: number;
    capRate: number;
  };
  sale: {
    avgPerSqft: number;
  };
  rentToValueRatio: number;
  chartType: 'bar';
}

/**
 * Analysis 9: PropertyRadar Comps vs Standard Comps
 */
export interface PropertyRadarCompsAnalysis {
  propertyRadar: {
    count: number;
    uniqueProperties: number;
    overlap: number;
  };
  standard: {
    count: number;
  };
  concordance: number;
  chartType: 'bar';
}

/**
 * Analysis 10: Property Radar Individual Comparisons
 */
export interface IndividualPRCompsAnalysis {
  comparisons: Array<{
    compNumber: number;
    property: any;
    similarity: number;
    priceDiff: number;
    sqftDiff: number;
    adjustedValue: number;
  }>;
  avgSimilarity: number;
  suggestedValue: number;
  chartType: 'bar';
}

/**
 * Analysis 11A: Exact BR vs Within ±1 BR - Sale Market
 */
export interface BRPrecisionAnalysis {
  subjectBR: number;
  exact: {
    count: number;
    avgPrice: number;
    priceRange: PriceRange;
  };
  within1: {
    count: number;
    avgPrice: number;
    priceRange: PriceRange;
  };
  precisionImpact: number;
  chartType: 'bar';
}

/**
 * Analysis 11B: Exact BR vs Within ±1 BR - Lease Market
 */
export interface BRPrecisionAnalysisLease {
  subjectBR: number;
  exact: {
    count: number;
    avgMonthlyRent: number;
    rentRange: PriceRange;
  };
  within1: {
    count: number;
    avgMonthlyRent: number;
    rentRange: PriceRange;
  };
  precisionImpact: number;
  chartType: 'bar';
}

/**
 * Analysis 12: T-36 vs T-12 Time Analysis
 */
export interface TimeFrameAnalysis {
  t12: {
    count: number;
    avgPrice: number;
    trend: number;
  };
  t36: {
    count: number;
    avgPrice: number;
    trend: number;
  };
  appreciation: number;
  chartType: 'line';
}

/**
 * Analysis 13: Direct vs Indirect 1.5mi
 */
export interface DirectVsIndirectAnalysis {
  direct: {
    count: number;
    avgPrice: number;
    similarity: number;
  };
  indirect: {
    count: number;
    avgPrice: number;
    avgDistance: number;
  };
  reliabilityScore: number;
  chartType: 'bar';
}

/**
 * Analysis 14: T-12 Direct vs T-12 Indirect 1.5mi
 */
export interface RecentDirectVsIndirectAnalysis {
  recentDirect: {
    count: number;
    avgPrice: number;
    avgDaysOnMarket: number;
  };
  recentIndirect: {
    count: number;
    avgPrice: number;
    avgDaysOnMarket: number;
  };
  marketVelocity: number;
  chartType: 'line';
}

/**
 * Analysis 15A: Active vs Closed - Sale Market
 */
export interface ActiveVsClosedAnalysis {
  active: {
    count: number;
    avgListPrice: number;
    avgDaysOnMarket: number;
  };
  closed: {
    count: number;
    avgSalePrice: number;
    avgDaysToClose: number;
  };
  absorptionRate: number;
  listToSaleRatio: number;
  chartType: 'bar';
}

/**
 * Analysis 15B: Active vs Closed - Lease Market
 */
export interface ActiveVsClosedAnalysisLease {
  active: {
    count: number;
    avgListRent: number;
    avgDaysOnMarket: number;
  };
  closed: {
    count: number;
    avgLeaseRent: number;
    avgDaysToLease: number;
  };
  absorptionRate: number;
  listToLeaseRatio: number;
  chartType: 'bar';
}

/**
 * Analysis 16A: Active vs Pending - Sale Market
 */
export interface ActiveVsPendingAnalysis {
  active: {
    count: number;
    avgListPrice: number;
    avgDaysActive: number;
  };
  pending: {
    count: number;
    avgContractPrice: number;
    avgDaysToContract: number;
  };
  pendingRatio: number;
  marketMomentum: number;
  chartType: 'bar';
}

/**
 * Analysis 16B: Active vs Pending - Lease Market
 */
export interface ActiveVsPendingAnalysisLease {
  active: {
    count: number;
    avgListRent: number;
    avgDaysActive: number;
  };
  pending: {
    count: number;
    avgPendingRent: number;
    avgDaysToPending: number;
  };
  pendingRatio: number;
  marketMomentum: number;
  chartType: 'bar';
}

/**
 * Analysis 17A: Delta $/sqft (Y RENOVATION_SCORE vs N) - Sale Market
 */
export interface RenovationDeltaAnalysis {
  renovatedAvg: number;
  notRenovatedAvg: number;
  delta: number;
  percentageIncrease: number;
  roiEstimate: number;
  chartType: 'waterfall';
}

/**
 * Analysis 17B: Delta rent/sqft (Y RENOVATION_SCORE vs N) - Lease Market
 */
export interface RenovationDeltaAnalysisLease {
  renovatedAvg: number;
  notRenovatedAvg: number;
  delta: number;
  percentageIncrease: number;
  monthlyIncomeUplift: number;
  annualIncomeUplift: number;
  chartType: 'waterfall';
}

/**
 * Analysis 18A: Delta $/sqft (0.5 vs N) - Sale Market
 */
export interface PartialRenovationDeltaAnalysis {
  partialAvg: number;
  notRenovatedAvg: number;
  delta: number;
  percentageIncrease: number;
  costBenefit: number;
  chartType: 'waterfall';
}

/**
 * Analysis 18B: Delta rent/sqft (0.5 vs N) - Lease Market
 */
export interface PartialRenovationDeltaAnalysisLease {
  partialAvg: number;
  notRenovatedAvg: number;
  delta: number;
  percentageIncrease: number;
  monthlyIncomeUplift: number;
  annualIncomeUplift: number;
  chartType: 'waterfall';
}

/**
 * Analysis 19A: Interquartile Range - Sale Market
 */
export interface InterquartileRangeAnalysis {
  price: QuartileData;
  pricePerSqft: QuartileData;
  outliers: number[];
  chartType: 'boxplot';
}

/**
 * Analysis 19B: Interquartile Range - Lease Market
 */
export interface InterquartileRangeAnalysisLease {
  monthlyRent: QuartileData;
  annualRent: QuartileData;
  rentPerSqft: QuartileData;
  outliers: number[];
  chartType: 'boxplot';
}

/**
 * Analysis 20A: Distribution Tails - Sale Market
 */
export interface DistributionTailsAnalysis {
  percentiles: {
    p5: number;
    p10: number;
    p50: number;
    p90: number;
    p95: number;
  };
  ranges: {
    middle80: number;
    middle90: number;
  };
  skewness: number;
  kurtosis: number;
  chartType: 'boxplot';
}

/**
 * Analysis 20B: Distribution Tails - Lease Market
 */
export interface DistributionTailsAnalysisLease {
  percentiles: {
    p5: number;
    p10: number;
    p50: number;
    p90: number;
    p95: number;
  };
  ranges: {
    middle80: number;
    middle90: number;
  };
  skewness: number;
  kurtosis: number;
  chartType: 'boxplot';
}

/**
 * Analysis 21: Expected Annual NOI Leasing
 */
export interface ExpectedNOIAnalysis {
  monthlyRent: number;
  annualIncome: number;
  operatingExpenses: number;
  annualNOI: number;
  capRate: number;
  cashOnCashReturn: number;
  chartType: 'dashboard';
}

/**
 * Analysis 22: Expected NOI with Cosmetic Improvements
 */
export interface ImprovedNOIAnalysis {
  currentNOI: number;
  improvedNOI: number;
  noiIncrease: number;
  improvementCost: number;
  paybackPeriod: number;
  roi: number;
  npv: number;
  chartType: 'dashboard';
}

// ============================================================================
// Supporting Types
// ============================================================================

export interface PropertyMetrics {
  count: number;
  avgPrice: number;
  avgPricePerSqft?: number;
  avgSqft?: number;
}

export interface PropertyMetricsLease {
  count: number;
  avgMonthlyRent: number;
  avgAnnualRent: number;
  avgRentPerSqft?: number;
  avgSqft?: number;
}

export interface CharacteristicsSummary {
  avgBedrooms: number;
  avgBathrooms: number;
  avgSqft: number;
  avgYearBuilt: number;
}

export interface PriceRange {
  min: number;
  max: number;
  median: number;
}

export interface QuartileData {
  q25: number;
  median: number;
  q75: number;
  iqr: number;
}

// ============================================================================
// Complete Analysis Result
// ============================================================================

/**
 * Complete result containing all 26 analyses (v2 with lease/sale differentiation)
 * This is what breakups-generator.ts returns
 */
export interface BreakupsAnalysisResult {
  // Analysis metadata
  metadata: {
    fileId: string;
    timestamp: Date;
    propertyCount: number;
    salePropertyCount: number;
    leasePropertyCount: number;
    subjectProperty?: any;
  };

  // All 26 analyses (13 split into A/B, plus 9 unchanged, plus 2 lease-only)
  analyses: {
    '1A': BRDistributionAnalysis; // Sale market
    '1B': BRDistributionAnalysisLease; // Lease market
    2: HOAAnalysis; // Not split (count-based, minimal price impact)
    '3A': STRAnalysis; // Sale market
    '3B': STRAnalysisLease; // Lease market
    '4A': RenovationImpactAnalysis; // Sale market
    '4B': RenovationImpactAnalysisLease; // Lease market
    5: CompsClassificationAnalysis; // Not split (categorization analysis)
    '6A': SqftVarianceAnalysis; // Sale market
    '6B': SqftVarianceAnalysisLease; // Lease market
    '7A': PriceVarianceAnalysis; // Sale market
    '7B': PriceVarianceAnalysisLease; // Lease market
    8: LeaseVsSaleAnalysis; // Lease vs Sale comparison (keeps differentiation)
    9: PropertyRadarCompsAnalysis; // Not split (PropertyRadar specific)
    10: IndividualPRCompsAnalysis; // Not split (PropertyRadar specific)
    '11A': BRPrecisionAnalysis; // Sale market
    '11B': BRPrecisionAnalysisLease; // Lease market
    12: TimeFrameAnalysis; // Not split (time-based trends)
    13: DirectVsIndirectAnalysis; // Not split (location-based)
    14: RecentDirectVsIndirectAnalysis; // Not split (location + time based)
    '15A': ActiveVsClosedAnalysis; // Sale market
    '15B': ActiveVsClosedAnalysisLease; // Lease market
    '16A': ActiveVsPendingAnalysis; // Sale market
    '16B': ActiveVsPendingAnalysisLease; // Lease market
    '17A': RenovationDeltaAnalysis; // Sale market
    '17B': RenovationDeltaAnalysisLease; // Lease market
    '18A': PartialRenovationDeltaAnalysis; // Sale market
    '18B': PartialRenovationDeltaAnalysisLease; // Lease market
    '19A': InterquartileRangeAnalysis; // Sale market
    '19B': InterquartileRangeAnalysisLease; // Lease market
    '20A': DistributionTailsAnalysis; // Sale market
    '20B': DistributionTailsAnalysisLease; // Lease market
    21: ExpectedNOIAnalysis; // Lease-only (NOI analysis)
    22: ImprovedNOIAnalysis; // Lease-only (NOI analysis)
  };
}

// ============================================================================
// Visualization Result Types
// ============================================================================

/**
 * Result from generating a single visualization
 */
export interface SingleVisualizationResult {
  analysisNumber: number;
  analysisName: string;
  chartType: string;
  filePath: string;
  width: number;
  height: number;
  dpi: number;
  success: boolean;
  error?: string;
}

/**
 * Result from generating all visualizations
 */
export interface VisualizationResult {
  success: boolean;
  outputDir: string;
  charts: SingleVisualizationResult[];
  totalCharts: number;
  successfulCharts: number;
  failedCharts: number;
  errors: string[];
  processingTime: number; // milliseconds
}

// ============================================================================
// Chart Configuration Types
// ============================================================================

/**
 * Color scheme from specification
 */
export const CHART_COLORS = {
  positive: '#059669',  // Green
  negative: '#DC2626',  // Red
  neutral: '#64748B',   // Gray
  primary: '#1E40AF',   // Blue
  secondary: '#F59E0B', // Amber
} as const;

/**
 * Chart dimensions and quality settings
 */
export const CHART_CONFIG = {
  width: 1200,
  height: 800,
  dpi: 400, // Increased from 300 for higher print quality
  backgroundColor: '#FFFFFF',
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontSize: 14,
} as const;

/**
 * Analysis names for file naming (v2 with 26 analyses)
 */
export const ANALYSIS_NAMES: Record<string, string> = {
  '1A': 'br_distribution_sale',
  '1B': 'br_distribution_lease',
  2: 'hoa_vs_non_hoa',
  '3A': 'str_vs_non_str_sale',
  '3B': 'str_vs_non_str_lease',
  '4A': 'renovation_impact_sale',
  '4B': 'renovation_impact_lease',
  5: 'comps_classification',
  '6A': 'sqft_variance_sale',
  '6B': 'sqft_variance_lease',
  '7A': 'price_variance_sale',
  '7B': 'price_variance_lease',
  8: 'lease_vs_sale',
  9: 'property_radar_comps',
  10: 'individual_pr_comps',
  '11A': 'br_precision_sale',
  '11B': 'br_precision_lease',
  12: 'time_frame_analysis',
  13: 'direct_vs_indirect',
  14: 'recent_direct_vs_indirect',
  '15A': 'active_vs_closed_sale',
  '15B': 'active_vs_closed_lease',
  '16A': 'active_vs_pending_sale',
  '16B': 'active_vs_pending_lease',
  '17A': 'renovation_delta_sale',
  '17B': 'renovation_delta_lease',
  '18A': 'partial_renovation_delta_sale',
  '18B': 'partial_renovation_delta_lease',
  '19A': 'interquartile_range_sale',
  '19B': 'interquartile_range_lease',
  '20A': 'distribution_tails_sale',
  '20B': 'distribution_tails_lease',
  21: 'expected_noi',
  22: 'improved_noi',
} as const;
