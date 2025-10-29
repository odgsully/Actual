/**
 * ReportIt Break-ups Analysis Type Definitions
 *
 * Type definitions for 22 comparative property analyses
 * Used by breakups-generator.ts and breakups-visualizer.ts
 *
 * @module lib/types/breakups-analysis
 */

// ============================================================================
// Analysis Result Types (for each of the 22 analyses)
// ============================================================================

/**
 * Analysis 1: BR Sizes Distribution
 */
export interface BRDistributionAnalysis {
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
 * Analysis 3: STR vs Non-STR
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
 * Analysis 4: RENOVATE_SCORE Impact
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
 * Analysis 6: Square Footage Variance (Within 20%)
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
 * Analysis 7: Price Variance (Within 20%)
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
 * Analysis 11: Exact BR vs Within ±1 BR
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
 * Analysis 15: Active vs Closed
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
 * Analysis 16: Active vs Pending
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
 * Analysis 17: Delta $/sqft (Y RENOVATION_SCORE vs N)
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
 * Analysis 18: Delta $/sqft (0.5 vs N)
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
 * Analysis 19: Interquartile Range
 */
export interface InterquartileRangeAnalysis {
  price: QuartileData;
  pricePerSqft: QuartileData;
  outliers: number[];
  chartType: 'boxplot';
}

/**
 * Analysis 20: Distribution Tails
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
 * Complete result containing all 22 analyses
 * This is what breakups-generator.ts returns
 */
export interface BreakupsAnalysisResult {
  // Analysis metadata
  metadata: {
    fileId: string;
    timestamp: Date;
    propertyCount: number;
    subjectProperty?: any;
  };

  // All 22 analyses
  analyses: {
    1: BRDistributionAnalysis;
    2: HOAAnalysis;
    3: STRAnalysis;
    4: RenovationImpactAnalysis;
    5: CompsClassificationAnalysis;
    6: SqftVarianceAnalysis;
    7: PriceVarianceAnalysis;
    8: LeaseVsSaleAnalysis;
    9: PropertyRadarCompsAnalysis;
    10: IndividualPRCompsAnalysis;
    11: BRPrecisionAnalysis;
    12: TimeFrameAnalysis;
    13: DirectVsIndirectAnalysis;
    14: RecentDirectVsIndirectAnalysis;
    15: ActiveVsClosedAnalysis;
    16: ActiveVsPendingAnalysis;
    17: RenovationDeltaAnalysis;
    18: PartialRenovationDeltaAnalysis;
    19: InterquartileRangeAnalysis;
    20: DistributionTailsAnalysis;
    21: ExpectedNOIAnalysis;
    22: ImprovedNOIAnalysis;
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
  dpi: 300,
  backgroundColor: '#FFFFFF',
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontSize: 14,
} as const;

/**
 * Analysis names for file naming
 */
export const ANALYSIS_NAMES: Record<number, string> = {
  1: 'br_distribution',
  2: 'hoa_vs_non_hoa',
  3: 'str_vs_non_str',
  4: 'renovation_impact',
  5: 'comps_classification',
  6: 'sqft_variance',
  7: 'price_variance',
  8: 'lease_vs_sale',
  9: 'property_radar_comps',
  10: 'individual_pr_comps',
  11: 'br_precision',
  12: 'time_frame_analysis',
  13: 'direct_vs_indirect',
  14: 'recent_direct_vs_indirect',
  15: 'active_vs_closed',
  16: 'active_vs_pending',
  17: 'renovation_delta',
  18: 'partial_renovation_delta',
  19: 'interquartile_range',
  20: 'distribution_tails',
  21: 'expected_noi',
  22: 'improved_noi',
} as const;
