/**
 * ReportIt Upload API Route
 *
 * Handles file uploads for Break-ups Report and PropertyRadar processing
 *
 * @route POST /api/admin/reportit/upload
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readFile as fsReadFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import * as path from 'path';
import ExcelJS from 'exceljs';
import { generatePropertyRadarExcel, generatePropertyRadarFilename } from '@/lib/processing/propertyradar-generator';
import { generateAllBreakupsAnalyses } from '@/lib/processing/breakups-generator';
import { generateAllVisualizations } from '@/lib/processing/breakups-visualizer';
import { generateUnifiedPDFReport } from '@/lib/processing/breakups-pdf-unified';
import { packageBreakupsReport } from '@/lib/processing/breakups-packager';
import { rateLimiters } from '@/lib/rate-limit';
import { requireAdmin } from '@/lib/api/admin-auth';

const LOG_PREFIX = '[ReportIt API - Upload]';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const UPLOAD_DIR = join(process.cwd(), 'tmp', 'reportit');

/**
 * Transform analysis results from breakups-generator format to PDF generator format
 * Converts flat structure with individual properties to array-based structure
 */
function transformAnalysisResultsForPDF(results: any, clientName: string): any {
  // Map analysis results to array format expected by PDF generator
  // v2 Note: Using _Sale variants for now, will add lease variants in Phase 3-5
  const analysisArray = [
    // Category A: Property Characteristics (1-5)
    { id: '1A', name: 'Bedroom Distribution (Sale)', category: 'A', categoryName: 'Property Characteristics', results: results.brDistribution_Sale, insight: generateBRDistributionInsight(results.brDistribution_Sale) },
    { id: '1B', name: 'Bedroom Distribution (Lease)', category: 'A', categoryName: 'Property Characteristics', results: results.brDistribution_Lease, insight: generateBRDistributionInsight(results.brDistribution_Lease) },
    { id: 2, name: 'HOA Fee Analysis', category: 'A', categoryName: 'Property Characteristics', results: results.hoaAnalysis, insight: generateHOAAnalysisInsight(results.hoaAnalysis) },
    { id: '3A', name: 'STR vs Non-STR (Sale)', category: 'A', categoryName: 'Property Characteristics', results: results.strAnalysis_Sale, insight: generateSTRAnalysisInsight(results.strAnalysis_Sale) },
    { id: '3B', name: 'STR vs Non-STR (Lease)', category: 'A', categoryName: 'Property Characteristics', results: results.strAnalysis_Lease, insight: generateSTRAnalysisInsight(results.strAnalysis_Lease) },
    { id: '4A', name: 'Renovation Impact (Sale)', category: 'A', categoryName: 'Property Characteristics', results: results.renovationImpact_Sale, insight: generateRenovationImpactInsight(results.renovationImpact_Sale) },
    { id: '4B', name: 'Renovation Impact (Lease)', category: 'A', categoryName: 'Property Characteristics', results: results.renovationImpact_Lease, insight: generateRenovationImpactInsight(results.renovationImpact_Lease) },
    { id: 5, name: 'Comps Classification', category: 'A', categoryName: 'Property Characteristics', results: results.compsClassification, insight: generateCompsClassificationInsight(results.compsClassification) },

    // Category B: Market Positioning (6-10)
    { id: '6A', name: 'Square Footage Variance (Sale)', category: 'B', categoryName: 'Market Positioning', results: results.sqftVariance_Sale, insight: generateSqftVarianceInsight(results.sqftVariance_Sale) },
    { id: '6B', name: 'Square Footage Variance (Lease)', category: 'B', categoryName: 'Market Positioning', results: results.sqftVariance_Lease, insight: generateSqftVarianceInsight(results.sqftVariance_Lease) },
    { id: '7A', name: 'Price Variance (Sale)', category: 'B', categoryName: 'Market Positioning', results: results.priceVariance_Sale, insight: generatePriceVarianceInsight(results.priceVariance_Sale) },
    { id: '7B', name: 'Price Variance (Lease)', category: 'B', categoryName: 'Market Positioning', results: results.priceVariance_Lease, insight: generatePriceVarianceInsight(results.priceVariance_Lease) },
    { id: 8, name: 'Lease vs Sale Properties', category: 'B', categoryName: 'Market Positioning', results: results.leaseVsSale, insight: generateLeaseVsSaleInsight(results.leaseVsSale) },
    { id: 9, name: 'PropertyRadar Comps', category: 'B', categoryName: 'Market Positioning', results: results.propertyRadarComps, insight: generatePropertyRadarCompsInsight(results.propertyRadarComps) },
    { id: 10, name: 'Individual PropertyRadar Comps', category: 'B', categoryName: 'Market Positioning', results: results.individualPRComps, insight: generateIndividualPRCompsInsight(results.individualPRComps) },

    // Category C: Time & Location (11-14)
    { id: '11A', name: 'Bedroom Precision (Sale)', category: 'C', categoryName: 'Time & Location', results: results.brPrecision_Sale, insight: generateBRPrecisionInsight(results.brPrecision_Sale) },
    { id: '11B', name: 'Bedroom Precision (Lease)', category: 'C', categoryName: 'Time & Location', results: results.brPrecision_Lease, insight: generateBRPrecisionInsight(results.brPrecision_Lease) },
    { id: 12, name: 'Time Frame Analysis', category: 'C', categoryName: 'Time & Location', results: results.timeFrames, insight: generateTimeFramesInsight(results.timeFrames) },
    { id: 13, name: 'Direct vs Indirect Comps', category: 'C', categoryName: 'Time & Location', results: results.directVsIndirect, insight: generateDirectVsIndirectInsight(results.directVsIndirect) },
    { id: 14, name: 'Recent Direct vs Indirect', category: 'C', categoryName: 'Time & Location', results: results.recentDirectVsIndirect, insight: generateRecentDirectVsIndirectInsight(results.recentDirectVsIndirect) },

    // Category D: Market Activity (15-16)
    { id: '15A', name: 'Active vs Closed (Sale)', category: 'D', categoryName: 'Market Activity', results: results.activeVsClosed_Sale, insight: generateActiveVsClosedInsight(results.activeVsClosed_Sale) },
    { id: '15B', name: 'Active vs Closed (Lease)', category: 'D', categoryName: 'Market Activity', results: results.activeVsClosed_Lease, insight: generateActiveVsClosedInsight(results.activeVsClosed_Lease) },
    { id: '16A', name: 'Active vs Pending (Sale)', category: 'D', categoryName: 'Market Activity', results: results.activeVsPending_Sale, insight: generateActiveVsPendingInsight(results.activeVsPending_Sale) },
    { id: '16B', name: 'Active vs Pending (Lease)', category: 'D', categoryName: 'Market Activity', results: results.activeVsPending_Lease, insight: generateActiveVsPendingInsight(results.activeVsPending_Lease) },

    // Category E: Financial Impact (17-22)
    { id: '17A', name: 'Renovation Price Delta (Sale)', category: 'E', categoryName: 'Financial Impact', results: results.renovationDelta_Sale, insight: generateRenovationDeltaInsight(results.renovationDelta_Sale) },
    { id: '17B', name: 'Renovation Price Delta (Lease)', category: 'E', categoryName: 'Financial Impact', results: results.renovationDelta_Lease, insight: generateRenovationDeltaInsight(results.renovationDelta_Lease) },
    { id: '18A', name: 'Partial Renovation Delta (Sale)', category: 'E', categoryName: 'Financial Impact', results: results.partialRenovationDelta_Sale, insight: generatePartialRenovationDeltaInsight(results.partialRenovationDelta_Sale) },
    { id: '18B', name: 'Partial Renovation Delta (Lease)', category: 'E', categoryName: 'Financial Impact', results: results.partialRenovationDelta_Lease, insight: generatePartialRenovationDeltaInsight(results.partialRenovationDelta_Lease) },
    { id: '19A', name: 'Interquartile Ranges (Sale)', category: 'E', categoryName: 'Financial Impact', results: results.interquartileRanges_Sale, insight: generateInterquartileRangesInsight(results.interquartileRanges_Sale) },
    { id: '19B', name: 'Interquartile Ranges (Lease)', category: 'E', categoryName: 'Financial Impact', results: results.interquartileRanges_Lease, insight: generateInterquartileRangesInsight(results.interquartileRanges_Lease) },
    { id: '20A', name: 'Distribution Tails (Sale)', category: 'E', categoryName: 'Financial Impact', results: results.distributionTails_Sale, insight: generateDistributionTailsInsight(results.distributionTails_Sale) },
    { id: '20B', name: 'Distribution Tails (Lease)', category: 'E', categoryName: 'Financial Impact', results: results.distributionTails_Lease, insight: generateDistributionTailsInsight(results.distributionTails_Lease) },
    { id: 21, name: 'Expected Net Operating Income', category: 'E', categoryName: 'Financial Impact', results: results.expectedNOI, insight: generateExpectedNOIInsight(results.expectedNOI) },
    { id: 22, name: 'Improved Net Operating Income', category: 'E', categoryName: 'Financial Impact', results: results.improvedNOI, insight: generateImprovedNOIInsight(results.improvedNOI) },
  ];

  return {
    analysisDate: new Date().toISOString(),
    propertyCount: results.metadata?.totalProperties || 0,
    subjectProperty: {
      address: clientName || 'Unknown Property',
      apn: '',
      price: 0,
      sqft: 0,
      bedrooms: 0,
      bathrooms: 0,
    },
    analyses: analysisArray,
    summary: {
      overallConfidence: 85, // Default confidence
      dataQuality: 'Good',
      recommendedValue: 0,
      valueRange: { low: 0, high: 0 },
    },
  };
}

// ============================================================================
// ANALYSIS-SPECIFIC INSIGHT GENERATORS
// ============================================================================
// Each function generates a detailed 3-4 sentence insight with market context
// Recommendations are included for high-value analyses meeting specific criteria

/**
 * Analysis 1: BR Sizes Distribution
 */
function generateBRDistributionInsight(result: any): string {
  if (!result) return 'Bedroom distribution data is not available for this analysis.';

  const totalProps = Object.values(result.distribution || {}).reduce((sum: number, count) => sum + (count as number), 0);
  const mostCommonCount = result.distribution?.[result.mostCommon] || 0;
  const mostCommonPct = totalProps > 0 ? ((mostCommonCount / totalProps) * 100).toFixed(1) : '0';

  const sortedBRs = Object.keys(result.distribution || {})
    .filter(br => br !== 'Unknown')
    .sort((a, b) => (result.distribution[b] || 0) - (result.distribution[a] || 0));

  let insight = `The market consists of ${totalProps} comparable properties with an average of ${result.average?.toFixed(1) || 0} bedrooms. `;
  insight += `${result.mostCommon || 'Unknown'}-bedroom homes dominate at ${mostCommonPct}% of the market (${mostCommonCount} properties)`;

  if (sortedBRs.length > 1) {
    const secondMost = sortedBRs[1];
    const secondPct = ((result.distribution[secondMost] / totalProps) * 100).toFixed(1);
    insight += `, followed by ${secondMost}-bedroom properties at ${secondPct}%. `;
  } else {
    insight += '. ';
  }

  insight += `This distribution indicates ${
    parseFloat(mostCommonPct) > 60
      ? 'a highly concentrated market with strong buyer preference for this configuration'
      : 'a diverse market with multiple viable bedroom configurations'
  }.`;

  return insight;
}

/**
 * Analysis 2: HOA vs Non-HOA
 */
function generateHOAAnalysisInsight(result: any): string {
  if (!result) return 'HOA analysis data is not available.';

  const totalProps = (result.withHOA?.count || 0) + (result.withoutHOA?.count || 0);

  // Handle missing data case
  if ((result.withHOA?.count || 0) === 0) {
    return `HOA fee data is currently unavailable for this market analysis. ${totalProps} properties were analyzed, but HOA information requires additional data collection. For investment properties, HOA fees typically range from $50-$300/month and can impact rental NOI by 2-8%. Buyers should verify HOA status and fees during due diligence.`;
  }

  const hoaPct = ((result.withHOA.count / totalProps) * 100).toFixed(1);
  const priceDiff = Math.abs(result.priceDifferential || 0).toFixed(0);
  const avgHOAFee = (result.withHOA.avgHOAFee || 0).toFixed(0);

  let insight = `${result.withHOA.count} properties (${hoaPct}%) have HOA fees averaging $${avgHOAFee}/month, `;
  insight += `while ${result.withoutHOA.count} properties have no HOA. `;

  if ((result.priceDifferential || 0) > 0) {
    insight += `HOA properties sell for an average of $${priceDiff} more, suggesting buyers value community amenities. `;
    insight += `However, monthly HOA fees of $${avgHOAFee} reduce annual NOI by $${(result.withHOA.avgHOAFee * 12).toFixed(0)} for investors.`;
  } else {
    insight += `Non-HOA properties command a $${priceDiff} premium, indicating buyer preference for autonomy and lower monthly obligations.`;
  }

  return insight;
}

/**
 * Analysis 3: STR vs Non-STR
 */
function generateSTRAnalysisInsight(result: any): string {
  if (!result) return 'STR analysis data is not available.';

  const totalProps = (result.strEligible?.count || 0) + (result.nonSTR?.count || 0);

  // Handle missing data case
  if ((result.strEligible?.count || 0) === 0) {
    return `Short-term rental (STR) eligibility data is not currently available for this market. ${totalProps} properties were analyzed, but zoning and licensing information requires additional research. In Maricopa County, STR regulations vary by city—Scottsdale and Phoenix have specific licensing requirements. Buyers interested in Airbnb/VRBO should verify local ordinances, as STR-eligible properties can command 15-30% rental premiums in permitted areas.`;
  }

  const strPct = ((result.strEligible.count / totalProps) * 100).toFixed(1);
  const premiumPct = (result.premiumPercentage || 0).toFixed(1);

  let insight = `${result.strEligible.count} properties (${strPct}%) are eligible for short-term rentals, `;
  insight += `averaging $${(result.strEligible.avgPricePerSqft || 0).toFixed(0)}/sqft compared to `;
  insight += `$${(result.nonSTR.avgPricePerSqft || 0).toFixed(0)}/sqft for traditional residential use. `;

  if ((result.premiumPercentage || 0) > 10) {
    insight += `The ${premiumPct}% STR premium reflects strong vacation rental demand. `;
    insight += `Investors should model 60-75% occupancy rates and higher operational costs (cleaning, property management, licensing) when evaluating STR potential.`;
  } else {
    insight += `The modest ${premiumPct}% premium suggests limited STR demand in this market, `;
    insight += `making traditional long-term leasing more viable for consistent cash flow.`;
  }

  return insight;
}

/**
 * Analysis 4: RENOVATE_SCORE Impact (Y vs N vs 0.5)
 * Includes recommendation if premium is significant
 */
function generateRenovationImpactInsight(result: any): string {
  if (!result) return 'Renovation impact data is not available.';

  const totalProps = (result.Y?.count || 0) + (result.N?.count || 0) + (result['0.5']?.count || 0);

  let insight = `Of ${totalProps} properties analyzed, ${result.N?.count || 0} are original condition, `;
  insight += `${result['0.5']?.count || 0} have partial updates, and ${result.Y?.count || 0} are fully renovated. `;

  insight += `Fully renovated homes command $${(result.Y?.avgPricePerSqft || 0).toFixed(0)}/sqft vs `;
  insight += `$${(result.N?.avgPricePerSqft || 0).toFixed(0)}/sqft for original condition—`;
  insight += `a ${(result.premiumYvsN || 0).toFixed(1)}% premium worth $${((result.Y?.avgPrice || 0) - (result.N?.avgPrice || 0)).toFixed(0)} on average. `;

  if ((result['0.5']?.count || 0) > 0) {
    insight += `Partial renovations yield $${(result['0.5']?.avgPricePerSqft || 0).toFixed(0)}/sqft `;
    insight += `(${(result.premium05vsN || 0).toFixed(1)}% premium), demonstrating strong ROI for cosmetic improvements.`;
  }

  // Add recommendation if premium is significant
  if ((result.premiumYvsN || 0) > 15) {
    insight += `\n\n**RECOMMENDATION:** With a ${(result.premiumYvsN || 0).toFixed(1)}% renovation premium, `;
    insight += `buyers acquiring original-condition properties should model improvement costs of $30-50/sqft `;
    insight += `for kitchen/bath updates to capture this value spread.`;
  }

  return insight;
}

/**
 * Analysis 5: Comps Classification (PropertyRadar Y vs N)
 */
function generateCompsClassificationInsight(result: any): string {
  if (!result) return 'Comps classification data is not available.';

  const totalProps = (result.comps?.count || 0) + (result.nonComps?.count || 0);
  const compsPct = totalProps > 0 ? (((result.comps?.count || 0) / totalProps) * 100).toFixed(1) : '0';

  let insight = `PropertyRadar identified ${result.comps?.count || 0} properties (${compsPct}%) `;
  insight += `as true comparables, with ${result.nonComps?.count || 0} excluded as outliers. `;

  const compsRange = (result.comps?.priceRange?.max || 0) - (result.comps?.priceRange?.min || 0);
  const nonCompsRange = (result.nonComps?.priceRange?.max || 0) - (result.nonComps?.priceRange?.min || 0);

  insight += `Comps trade in a $${compsRange.toLocaleString()} range `;
  insight += `($${(result.comps?.priceRange?.min || 0).toLocaleString()}-$${(result.comps?.priceRange?.max || 0).toLocaleString()}), `;
  insight += `averaging $${(result.comps?.avgPrice || 0).toFixed(0)}, while non-comps show `;
  insight += `a wider $${nonCompsRange.toLocaleString()} variance. `;

  const variability = result.comps?.avgPrice ? (compsRange / result.comps.avgPrice) : 0;
  insight += `This ${(variability * 100).toFixed(1)}% price variability `;
  insight += `within comps suggests ${
    variability < 0.15
      ? 'a highly homogeneous market with reliable pricing signals'
      : 'meaningful property differentiation based on condition, location, or features'
  }.`;

  return insight;
}

/**
 * Analysis 6: Square Footage Variance (Within 20%)
 */
function generateSqftVarianceInsight(result: any): string {
  if (!result) return 'Square footage variance data is not available.';

  const totalProps = (result.within20?.count || 0) + (result.outside20?.count || 0);
  const within20Pct = totalProps > 0 ? (((result.within20?.count || 0) / totalProps) * 100).toFixed(1) : '0';

  let insight = `${result.within20?.count || 0} properties (${within20Pct}%) fall within the optimal `;
  insight += `${(result.optimalRange?.min || 0).toFixed(0)}-${(result.optimalRange?.max || 0).toFixed(0)} sqft range `;
  insight += `(±20% of subject), averaging $${(result.within20?.avgPricePerSqft || 0).toFixed(0)}/sqft. `;

  if ((result.outside20?.count || 0) > 0) {
    const priceDiff = Math.abs((result.within20?.avgPricePerSqft || 0) - (result.outside20?.avgPricePerSqft || 0));
    const direction = (result.within20?.avgPricePerSqft || 0) > (result.outside20?.avgPricePerSqft || 0) ? 'higher' : 'lower';

    insight += `Properties outside this range (${result.outside20.count}) trade $${priceDiff.toFixed(0)}/sqft ${direction}, `;
    insight += `indicating ${
      direction === 'higher'
        ? 'a size premium for properties in the sweet spot'
        : 'better value per square foot in larger/smaller homes'
    }. `;
  }

  insight += `The ±20% sqft band provides the most reliable comparisons for appraisal and pricing strategy.`;

  return insight;
}

/**
 * Analysis 7: Price Variance (Within 20% of Estimated Value)
 */
function generatePriceVarianceInsight(result: any): string {
  if (!result) return 'Price variance data is not available.';

  const totalProps = (result.within20?.count || 0) + (result.outside20?.count || 0);
  const within20Pct = totalProps > 0 ? (((result.within20?.count || 0) / totalProps) * 100).toFixed(1) : '0';

  let insight = `${result.within20?.count || 0} properties (${within20Pct}%) are priced within 20% of the estimated value, `;
  insight += `selling in an average of ${(result.within20?.avgDaysOnMarket || 0).toFixed(0)} days. `;

  if ((result.outside20?.underpriced || 0) > 0 || (result.outside20?.overpriced || 0) > 0) {
    insight += `Of the ${result.outside20?.count || 0} outliers, ${result.outside20?.underpriced || 0} are underpriced `;
    insight += `(potential value opportunities) and ${result.outside20?.overpriced || 0} are overpriced `;
    insight += `(likely to experience price reductions or extended market time). `;
  }

  insight += `Properties within the ±20% band demonstrate market acceptance of current pricing levels `;
  insight += `${(result.within20?.avgDaysOnMarket || 0) < 30 ? 'with strong buyer urgency' : 'with typical absorption rates'}.`;

  return insight;
}

/**
 * Analysis 8: Lease vs Sale Pricing
 * Includes recommendation if rental strategy is strong
 */
function generateLeaseVsSaleInsight(result: any): string {
  if (!result) return 'Lease vs sale data is not available.';

  // Handle missing rental data
  if ((result.lease?.avgAnnualPerSqft || 0) === 0) {
    return `Rental rate data is currently unavailable for this market. Based on the average sales price per square foot of $${(result.sale?.avgPerSqft || 0).toFixed(0)}, investors should target monthly rents of 0.5-0.7% of property value (1% rule) to achieve positive cash flow. Actual rental comps should be verified through MLS rental listings, Zillow Rent Zestimate, or local property management firms to model accurate NOI.`;
  }

  const monthlyRent = result.lease.avgAnnualPerSqft / 12;
  const rentToValuePct = ((result.rentToValueRatio || 0) * 100).toFixed(2);

  let insight = `Rental properties generate $${(result.lease.avgAnnualPerSqft || 0).toFixed(2)}/sqft/year `;
  insight += `($${monthlyRent.toFixed(2)}/sqft/month) compared to sales averaging `;
  insight += `$${(result.sale.avgPerSqft || 0).toFixed(0)}/sqft. `;

  insight += `The ${rentToValuePct}% monthly rent-to-value ratio `;
  insight += `${(result.rentToValueRatio || 0) >= 0.01 ? 'exceeds' : 'falls short of'} `;
  insight += `the 1% rule, indicating ${
    (result.rentToValueRatio || 0) >= 0.01
      ? 'strong rental cash flow potential with positive leverage'
      : 'a challenging rental market requiring significant down payments for positive cash flow'
  }. `;

  insight += `At a ${((result.lease.capRate || 0) * 100).toFixed(2)}% cap rate, `;
  insight += `rental strategy is ${
    (result.lease.capRate || 0) > 0.06
      ? 'viable for buy-and-hold investors seeking income'
      : 'marginal without appreciation upside or value-add opportunities'
  }.`;

  // Add recommendation if rental strategy is strong
  if ((result.rentToValueRatio || 0) >= 0.01 && (result.lease.capRate || 0) > 0.06) {
    insight += `\n\n**RECOMMENDATION:** Strong rental fundamentals support a buy-and-hold strategy. `;
    insight += `Model 75% financing at current rates to maximize cash-on-cash returns while maintaining `;
    insight += `positive monthly cash flow after PITI, HOA, and reserves.`;
  }

  return insight;
}

/**
 * Analysis 9: PropertyRadar Comps vs Standard Comps
 */
function generatePropertyRadarCompsInsight(result: any): string {
  if (!result) return 'PropertyRadar comps data is not available.';

  const totalComps = (result.propertyRadar?.count || 0) + (result.standard?.count || 0);
  const prPct = totalComps > 0 ? (((result.propertyRadar?.count || 0) / totalComps) * 100).toFixed(1) : '0';

  let insight = `PropertyRadar's algorithm selected ${result.propertyRadar?.count || 0} comps (${prPct}% of total), `;
  insight += `while standard MLS criteria identified ${result.standard?.count || 0} comparables. `;

  if ((result.propertyRadar?.count || 0) > (result.standard?.count || 0)) {
    insight += `The broader PropertyRadar selection suggests it prioritized market coverage over strict similarity, `;
    insight += `potentially including properties with different bed/bath counts or locations to build a larger dataset. `;
  } else if ((result.propertyRadar?.count || 0) < (result.standard?.count || 0)) {
    insight += `PropertyRadar's more selective approach indicates it applied tighter filtering for similarity, `;
    insight += `excluding outliers that standard MLS searches included based on basic criteria alone. `;
  } else {
    insight += `The identical comp counts suggest strong agreement between PropertyRadar's algorithm and `;
    insight += `traditional MLS selection criteria for this property type. `;
  }

  insight += `Appraisers and brokers typically prefer a balanced approach—narrower comps for accuracy, `;
  insight += `broader comps for market context.`;

  return insight;
}

/**
 * Analysis 10: Individual PropertyRadar Comp Comparisons
 */
function generateIndividualPRCompsInsight(result: any): string {
  if (!result || !result.comparisons || result.comparisons.length === 0) {
    return `No PropertyRadar comps were identified for detailed comparison. Standard MLS comps should be analyzed individually for price and square footage adjustments.`;
  }

  const avgPriceDiff = result.comparisons.reduce((sum: number, c: any) => sum + (c.priceDiff || 0), 0) / result.comparisons.length;
  const avgSqftDiff = result.comparisons.reduce((sum: number, c: any) => sum + (c.sqftDiff || 0), 0) / result.comparisons.length;

  const higherCount = result.comparisons.filter((c: any) => (c.priceDiff || 0) > 0).length;
  const lowerCount = result.comparisons.filter((c: any) => (c.priceDiff || 0) < 0).length;

  let insight = `PropertyRadar identified ${result.comparisons.length} direct comps with an average `;
  insight += `${avgPriceDiff >= 0 ? 'premium' : 'discount'} of $${Math.abs(avgPriceDiff).toFixed(0)} vs subject. `;

  const higherAvg = higherCount > 0
    ? result.comparisons.filter((c: any) => c.priceDiff > 0).reduce((sum: number, c: any) => sum + c.priceDiff, 0) / higherCount
    : 0;
  const lowerAvg = lowerCount > 0
    ? Math.abs(result.comparisons.filter((c: any) => c.priceDiff < 0).reduce((sum: number, c: any) => sum + c.priceDiff, 0) / lowerCount)
    : 0;

  insight += `${higherCount} comps sold higher (avg +$${higherAvg.toFixed(0)}), `;
  insight += `${lowerCount} sold lower (avg -$${lowerAvg.toFixed(0)}). `;

  insight += `Square footage variance averaged ${Math.abs(avgSqftDiff).toFixed(0)} sqft, `;
  insight += `${Math.abs(avgSqftDiff) < 100 ? 'indicating tight similarity' : 'suggesting meaningful size differences requiring adjustment'}. `;

  insight += `These comps should be individually reviewed for condition, location, and timing adjustments `;
  insight += `to refine the subject's estimated value.`;

  return insight;
}

/**
 * Analysis 11: Exact BR vs Within ±1 BR Precision
 */
function generateBRPrecisionInsight(result: any): string {
  if (!result) return 'Bedroom precision data is not available.';

  const totalComps = (result.exact?.count || 0) + (result.within1?.count || 0);
  const exactPct = totalComps > 0 ? (((result.exact?.count || 0) / totalComps) * 100).toFixed(1) : '0';
  const priceDiff = Math.abs((result.exact?.avgPrice || 0) - (result.within1?.avgPrice || 0));
  const priceDiffPct = result.within1?.avgPrice ? ((priceDiff / result.within1.avgPrice) * 100).toFixed(1) : '0';

  let insight = `${result.exact?.count || 0} properties (${exactPct}%) match the subject's exact bedroom count, `;
  insight += `trading at $${(result.exact?.avgPrice || 0).toFixed(0)} on average. `;

  insight += `Including ±1 BR expands the dataset to ${result.within1?.count || 0} properties `;
  insight += `averaging $${(result.within1?.avgPrice || 0).toFixed(0)}—`;
  insight += `a $${priceDiff.toFixed(0)} (${priceDiffPct}%) ${
    (result.exact?.avgPrice || 0) > (result.within1?.avgPrice || 0) ? 'premium' : 'discount'
  } for exact matches. `;

  const exactRange = (result.exact?.priceRange?.max || 0) - (result.exact?.priceRange?.min || 0);
  const within1Range = (result.within1?.priceRange?.max || 0) - (result.within1?.priceRange?.min || 0);

  insight += `Exact matches show a $${exactRange.toLocaleString()} price range vs `;
  insight += `$${within1Range.toLocaleString()} for ±1 BR, demonstrating ${
    exactRange < within1Range * 0.8
      ? 'tighter clustering and higher pricing confidence with exact BR matches'
      : 'similar price variability regardless of bedroom precision'
  }. `;

  insight += `For appraisal accuracy, exact BR comps should be weighted more heavily.`;

  return insight;
}

/**
 * Analysis 12: T-36 vs T-12 Time Frame Analysis
 */
function generateTimeFramesInsight(result: any): string {
  if (!result) return 'Time frame analysis data is not available.';

  const appreciationAbs = Math.abs(result.appreciation || 0);
  const direction = (result.appreciation || 0) > 0 ? 'appreciation' : 'depreciation';
  const annualRate = (result.appreciation || 0) / 2; // 24 months = 2 years

  let insight = `Recent sales (T-12) include ${result.t12?.count || 0} properties averaging $${(result.t12?.avgPrice || 0).toFixed(0)}, `;
  insight += `while the 3-year dataset (T-36) includes ${result.t36?.count || 0} properties at $${(result.t36?.avgPrice || 0).toFixed(0)}. `;

  insight += `Comparing T-12 to earlier T-36 sales reveals ${appreciationAbs.toFixed(1)}% ${direction} `;
  insight += `over the past 2 years, translating to ${annualRate.toFixed(1)}% annually. `;

  if ((result.appreciation || 0) > 5) {
    insight += `This strong appreciation trend indicates a seller's market with rising values—`;
    insight += `buyers should expect upward pricing pressure and potential multiple offers. `;
  } else if ((result.appreciation || 0) < -5) {
    insight += `This depreciation suggests a buyer's market with weakening prices—`;
    insight += `buyers have negotiating leverage and should reference older (lower) comps. `;
  } else {
    insight += `This stable pricing environment suggests balanced market conditions with `;
    insight += `neither significant buyer nor seller advantage. `;
  }

  insight += `Recent comps (T-12) should be weighted more heavily for current value estimation.`;

  return insight;
}

/**
 * Analysis 13: Direct (Subdivision) vs Indirect (1.5mi Radius)
 */
function generateDirectVsIndirectInsight(result: any): string {
  if (!result) return 'Direct vs indirect comps data is not available.';

  const totalComps = (result.direct?.count || 0) + (result.indirect?.count || 0);
  const directPct = totalComps > 0 ? (((result.direct?.count || 0) / totalComps) * 100).toFixed(1) : '0';
  const priceDiff = Math.abs((result.direct?.avgPrice || 0) - (result.indirect?.avgPrice || 0));
  const priceDiffPct = result.indirect?.avgPrice ? ((priceDiff / result.indirect.avgPrice) * 100).toFixed(1) : '0';

  let insight = `${result.direct?.count || 0} direct subdivision comps (${directPct}%) average `;
  insight += `$${(result.direct?.avgPrice || 0).toFixed(0)}, while ${result.indirect?.count || 0} indirect (1.5mi) comps `;
  insight += `average $${(result.indirect?.avgPrice || 0).toFixed(0)}—`;
  insight += `a $${priceDiff.toFixed(0)} (${priceDiffPct}%) ${
    (result.direct?.avgPrice || 0) > (result.indirect?.avgPrice || 0) ? 'premium' : 'discount'
  } for same-subdivision properties. `;

  insight += `The ${((result.reliabilityScore || 0) * 100).toFixed(1)}% reliability score `;
  insight += `${(result.reliabilityScore || 0) > 0.6
    ? '(high) indicates strong subdivision-level data—direct comps should drive valuation'
    : '(low) suggests limited subdivision sales—indirect comps necessary for market context'
  }. `;

  if ((result.direct?.avgPrice || 0) > (result.indirect?.avgPrice || 0) * 1.1) {
    insight += `The significant subdivision premium reflects location desirability, amenities, or `;
    insight += `HOA-maintained common areas not present in surrounding neighborhoods.`;
  } else if ((result.indirect?.avgPrice || 0) > (result.direct?.avgPrice || 0) * 1.1) {
    insight += `Surrounding area trades higher, suggesting the subject subdivision offers value `;
    insight += `relative to nearby alternatives.`;
  } else {
    insight += `Tight price parity indicates homogeneous market conditions across the 1.5-mile radius.`;
  }

  return insight;
}

/**
 * Analysis 14: Recent Direct vs Recent Indirect (T-12 + Geography)
 */
function generateRecentDirectVsIndirectInsight(result: any): string {
  if (!result) return 'Recent direct vs indirect data is not available.';

  const totalRecent = (result.recentDirect?.count || 0) + (result.recentIndirect?.count || 0);

  if (totalRecent === 0) {
    return `No sales in the past 12 months within the subdivision or 1.5-mile radius. Market analysis should expand to T-36 timeframe and/or broader geographic search to establish current pricing trends.`;
  }

  const directPct = totalRecent > 0 ? (((result.recentDirect?.count || 0) / totalRecent) * 100).toFixed(1) : '0';
  const priceDiff = Math.abs((result.recentDirect?.avgPrice || 0) - (result.recentIndirect?.avgPrice || 0));
  const domDiff = (result.recentDirect?.avgDaysOnMarket || 0) - (result.recentIndirect?.avgDaysOnMarket || 0);

  let insight = `In the past 12 months, ${result.recentDirect?.count || 0} subdivision sales (${directPct}%) `;
  insight += `averaged $${(result.recentDirect?.avgPrice || 0).toFixed(0)} with ${(result.recentDirect?.avgDaysOnMarket || 0).toFixed(0)} days on market, `;
  insight += `while ${result.recentIndirect?.count || 0} indirect sales averaged `;
  insight += `$${(result.recentIndirect?.avgPrice || 0).toFixed(0)} at ${(result.recentIndirect?.avgDaysOnMarket || 0).toFixed(0)} DOM. `;

  insight += `Recent subdivision sales show a $${priceDiff.toFixed(0)} ${
    (result.recentDirect?.avgPrice || 0) > (result.recentIndirect?.avgPrice || 0) ? 'premium' : 'discount'
  }, moving ${Math.abs(domDiff).toFixed(0)} days ${domDiff < 0 ? 'faster' : 'slower'} than nearby comps. `;

  if (domDiff < -10) {
    insight += `The faster absorption in the subdivision indicates strong buyer demand and pricing power.`;
  } else if (domDiff > 10) {
    insight += `Slower subdivision sales suggest buyer resistance to pricing or limited demand for this specific location.`;
  } else {
    insight += `Similar days on market indicates balanced demand across the area.`;
  }

  return insight;
}

/**
 * Analysis 15: Active vs Closed Listings
 */
function generateActiveVsClosedInsight(result: any): string {
  if (!result) return 'Active vs closed data is not available.';

  const totalListings = (result.active?.count || 0) + (result.closed?.count || 0);
  const activePct = totalListings > 0 ? (((result.active?.count || 0) / totalListings) * 100).toFixed(1) : '0';
  const listSaleDiff = (result.active?.avgListPrice || 0) - (result.closed?.avgSalePrice || 0);
  const listSalePct = (((result.listToSaleRatio || 0) - 1) * 100).toFixed(1);

  let insight = `Current inventory includes ${result.active?.count || 0} active listings (${activePct}%) `;
  insight += `at $${(result.active?.avgListPrice || 0).toFixed(0)} list price, with ${result.closed?.count || 0} closed sales `;
  insight += `averaging $${(result.closed?.avgSalePrice || 0).toFixed(0)}. `;

  insight += `The ${((result.absorptionRate || 0) * 100).toFixed(1)}% absorption rate indicates `;
  insight += `${(result.absorptionRate || 0) > 0.7
    ? 'strong buyer demand—listings convert to sales quickly'
    : (result.absorptionRate || 0) > 0.4
      ? 'balanced market conditions with moderate inventory turnover'
      : 'buyer hesitation with inventory buildup'
  }. `;

  insight += `Active listings average ${(result.active?.avgDaysOnMarket || 0).toFixed(0)} DOM vs `;
  insight += `${(result.closed?.avgDaysToClose || 0).toFixed(0)} days for closed sales. `;

  if (Math.abs(parseFloat(listSalePct)) > 3) {
    insight += `The ${Math.abs(parseFloat(listSalePct)).toFixed(1)}% list-to-sale ${
      parseFloat(listSalePct) > 0 ? 'premium' : 'discount'
    } (${listSaleDiff >= 0 ? 'sellers asking more' : 'buyers negotiating down'}) `;
    insight += `suggests ${
      parseFloat(listSalePct) > 0
        ? 'current listings may need price reductions to match recent sold comps'
        : 'strong buyer leverage with below-asking sales'
    }.`;
  } else {
    insight += `Tight list-to-sale alignment (${listSalePct}%) indicates well-priced inventory.`;
  }

  return insight;
}

/**
 * Analysis 16: Active vs Pending Listings
 */
function generateActiveVsPendingInsight(result: any): string {
  if (!result) return 'Active vs pending data is not available.';

  const totalCurrent = (result.active?.count || 0) + (result.pending?.count || 0);
  const pendingPct = totalCurrent > 0 ? (((result.pending?.count || 0) / totalCurrent) * 100).toFixed(1) : '0';

  let insight = `Current market activity shows ${result.active?.count || 0} active listings and `;
  insight += `${result.pending?.count || 0} pending contracts (${pendingPct}% pending ratio). `;

  insight += `Active listings average $${(result.active?.avgListPrice || 0).toFixed(0)} with `;
  insight += `${(result.active?.avgDaysActive || 0).toFixed(0)} days on market, while pending properties `;
  insight += `went under contract in ${(result.pending?.avgDaysToContract || 0).toFixed(0)} days. `;

  if ((result.pendingRatio || 0) > 0.4) {
    insight += `The high pending ratio indicates strong buyer urgency—properties are moving quickly `;
    insight += `from active to contract status. Sellers have pricing power in this environment.`;
  } else if ((result.pendingRatio || 0) < 0.2) {
    insight += `The low pending ratio suggests buyer hesitation—listings sit active longer without `;
    insight += `contract activity. Buyers have negotiating leverage and should expect price flexibility.`;
  } else {
    insight += `The balanced pending ratio reflects steady market activity with normal absorption rates.`;
  }

  if ((result.active?.avgDaysActive || 0) > (result.pending?.avgDaysToContract || 0) * 2) {
    insight += ` Current active inventory has been on market ${
      ((result.active?.avgDaysActive || 0) / (result.pending?.avgDaysToContract || 1)).toFixed(1)
    }x longer than recently-pending properties, suggesting these listings may be overpriced or less desirable.`;
  }

  return insight;
}

/**
 * Analysis 17: Renovation Delta (Fully Renovated vs Original)
 * Includes recommendation if ROI is strong
 */
function generateRenovationDeltaInsight(result: any): string {
  if (!result) return 'Renovation delta data is not available.';

  const deltaAbs = Math.abs(result.delta || 0);
  const roiEst = result.notRenovatedAvg ? (deltaAbs / 40) * 100 : 0; // Assuming $40/sqft renovation cost

  let insight = `Fully renovated properties command $${(result.renovatedAvg || 0).toFixed(2)}/sqft vs `;
  insight += `$${(result.notRenovatedAvg || 0).toFixed(2)}/sqft for original condition—`;
  insight += `a $${deltaAbs.toFixed(2)}/sqft premium (${(result.percentageIncrease || 0).toFixed(1)}%). `;

  insight += `On a 1,600 sqft property, this translates to a $${(deltaAbs * 1600).toFixed(0)} value increase. `;

  insight += `Assuming renovation costs of $35-50/sqft for kitchen/bath updates, flooring, and paint, `;
  insight += `the ROI is approximately ${roiEst.toFixed(0)}%, making cosmetic improvements `;
  insight += `${roiEst > 100 ? 'highly profitable' : roiEst > 50 ? 'financially viable' : 'marginally beneficial'} `;
  insight += `for value creation.`;

  // Add recommendation if ROI is strong
  if ((result.percentageIncrease || 0) > 15 && roiEst > 75) {
    insight += `\n\n**RECOMMENDATION:** With ${(result.percentageIncrease || 0).toFixed(1)}% premium and strong ROI, `;
    insight += `buyers should target original-condition properties for value-add opportunities. Budget $50-70k `;
    insight += `for full renovation (1,400-1,800 sqft homes) to capture this spread. Partner with licensed `;
    insight += `contractors and pull permits for kitchen/bath work to maximize resale appeal.`;
  }

  return insight;
}

/**
 * Analysis 18: Partial Renovation Delta (0.5 vs Original)
 */
function generatePartialRenovationDeltaInsight(result: any): string {
  if (!result) return 'Partial renovation delta data is not available.';

  const deltaAbs = Math.abs(result.delta || 0);
  const roiEst = result.notRenovatedAvg ? (deltaAbs / 20) * 100 : 0; // Assuming $20/sqft for partial updates

  let insight = `Partial renovations (0.5 score) yield $${(result.partialAvg || 0).toFixed(2)}/sqft vs `;
  insight += `$${(result.notRenovatedAvg || 0).toFixed(2)}/sqft for original condition—`;
  insight += `a $${deltaAbs.toFixed(2)}/sqft gain (${(result.percentageIncrease || 0).toFixed(1)}%). `;

  insight += `This represents approximately half of the full renovation premium, `;
  insight += `achievable with cosmetic updates (paint, flooring, fixtures) at 40-50% of full renovation costs. `;

  insight += `For a 1,600 sqft property, partial improvements costing $25-35k can add `;
  insight += `$${(deltaAbs * 1600).toFixed(0)} in value, yielding ${roiEst.toFixed(0)}% ROI. `;

  insight += `This is the "sweet spot" for budget-conscious flippers or buy-and-hold investors `;
  insight += `seeking immediate equity without major construction.`;

  return insight;
}

/**
 * Analysis 19: Interquartile Range (Middle 50% of Market)
 */
function generateInterquartileRangesInsight(result: any): string {
  if (!result) return 'Interquartile range data is not available.';

  const priceSpread = (result.price?.q75 || 0) - (result.price?.q25 || 0);
  const priceSpreadPct = result.price?.median ? ((priceSpread / result.price.median) * 100).toFixed(1) : '0';
  const sqftSpread = (result.pricePerSqft?.q75 || 0) - (result.pricePerSqft?.q25 || 0);
  const sqftSpreadPct = result.pricePerSqft?.median ? ((sqftSpread / result.pricePerSqft.median) * 100).toFixed(1) : '0';

  let insight = `The middle 50% of the market (25th-75th percentile) trades between `;
  insight += `$${(result.price?.q25 || 0).toFixed(0)} and $${(result.price?.q75 || 0).toFixed(0)} `;
  insight += `(median: $${(result.price?.median || 0).toFixed(0)}), with an IQR of $${(result.price?.iqr || 0).toFixed(0)} `;
  insight += `(${priceSpreadPct}% variance). `;

  insight += `Price per square foot spans $${(result.pricePerSqft?.q25 || 0).toFixed(0)}-$${(result.pricePerSqft?.q75 || 0).toFixed(0)}/sqft `;
  insight += `(median: $${(result.pricePerSqft?.median || 0).toFixed(0)}, IQR: $${(result.pricePerSqft?.iqr || 0).toFixed(0)}). `;

  insight += `The ${sqftSpreadPct}% $/sqft variance indicates ${
    parseFloat(sqftSpreadPct) < 15
      ? 'a homogeneous market with tight pricing—condition and location drive modest premiums'
      : parseFloat(sqftSpreadPct) > 25
        ? 'significant property differentiation—renovations, views, or lot size create wide value spreads'
        : 'moderate variability typical of suburban markets with mixed property conditions'
  }. `;

  insight += `Buyers targeting the median should expect to pay $${(result.price?.median || 0).toFixed(0)} `;
  insight += `for average-condition homes.`;

  return insight;
}

/**
 * Analysis 20: Distribution Tails (Extreme Market Values)
 */
function generateDistributionTailsInsight(result: any): string {
  if (!result) return 'Distribution tails data is not available.';

  const middle80Pct = result.percentiles?.p50 ? ((result.ranges?.middle80 / result.percentiles.p50) * 100).toFixed(1) : '0';
  const middle90Pct = result.percentiles?.p50 ? ((result.ranges?.middle90 / result.percentiles.p50) * 100).toFixed(1) : '0';

  let insight = `Market extremes range from $${(result.percentiles?.p5 || 0).toFixed(0)} (5th percentile) to `;
  insight += `$${(result.percentiles?.p95 || 0).toFixed(0)} (95th percentile), with a median of $${(result.percentiles?.p50 || 0).toFixed(0)}. `;

  insight += `The middle 80% (10th-90th) spans $${(result.ranges?.middle80 || 0).toFixed(0)} `;
  insight += `(${middle80Pct}% of median), while the middle 90% spans $${(result.ranges?.middle90 || 0).toFixed(0)} `;
  insight += `(${middle90Pct}% of median). `;

  const tailSkew = ((result.percentiles?.p95 || 0) - (result.percentiles?.p50 || 0)) - ((result.percentiles?.p50 || 0) - (result.percentiles?.p5 || 0));

  if (result.percentiles?.p50 && tailSkew > result.percentiles.p50 * 0.1) {
    insight += `The distribution is right-skewed—high-end properties ($${(result.percentiles?.p90 || 0).toFixed(0)}+) `;
    insight += `extend the upper tail, driven by luxury features, larger lots, or premium locations.`;
  } else if (result.percentiles?.p50 && tailSkew < -result.percentiles.p50 * 0.1) {
    insight += `The distribution is left-skewed—distressed sales or entry-level properties `;
    insight += `($${(result.percentiles?.p10 || 0).toFixed(0)}-) pull the lower tail down.`;
  } else {
    insight += `The distribution is relatively symmetric, indicating a balanced mix of property types `;
    insight += `without extreme outliers skewing the market.`;
  }

  insight += ` Properties below the 10th percentile ($${(result.percentiles?.p10 || 0).toFixed(0)}) `;
  insight += `or above the 90th ($${(result.percentiles?.p90 || 0).toFixed(0)}) should be excluded from `;
  insight += `standard comp analysis unless justified by unique characteristics.`;

  return insight;
}

/**
 * Analysis 21: Expected Annual NOI from Leasing
 * Includes recommendation if cap rate is competitive
 */
function generateExpectedNOIInsight(result: any): string {
  if (!result) return 'Expected NOI data is not available.';

  const capRatePct = ((result.capRate || 0) * 100).toFixed(2);
  const cashOnCash = (result.capRate || 0) * 1.3; // Rough estimate assuming 75% LTV

  let insight = `Leasing this property at $${(result.monthlyRent || 0).toFixed(0)}/month generates `;
  insight += `$${(result.annualIncome || 0).toFixed(0)} in annual gross income. After operating expenses of `;
  insight += `$${(result.operatingExpenses || 0).toFixed(0)} (35% of income for property tax, insurance, `;
  insight += `maintenance, vacancy), annual NOI is $${(result.annualNOI || 0).toFixed(0)}. `;

  insight += `The ${capRatePct}% cap rate indicates ${
    (result.capRate || 0) > 0.07
      ? 'strong rental cash flow potential—competitive with alternative investments'
      : (result.capRate || 0) > 0.05
        ? 'moderate rental returns—viable for buy-and-hold with appreciation upside'
        : 'low rental yield—difficult to justify without significant appreciation expectations'
  }. `;

  insight += `With 75% financing, cash-on-cash return would approximate ${(cashOnCash * 100).toFixed(1)}%, `;
  insight += `${cashOnCash > 0.08 ? 'exceeding' : 'falling short of'} most investors' 8-10% hurdle rates.`;

  // Add recommendation if cap rate is competitive
  if ((result.capRate || 0) > 0.06) {
    insight += `\n\n**RECOMMENDATION:** Rental fundamentals support a buy-and-hold strategy. `;
    insight += `Model worst-case scenarios: 10% vacancy (reduces NOI to $${((result.annualNOI || 0) * 0.9).toFixed(0)}), `;
    insight += `$3-5k annual CapEx reserves, and 8-10% property management fees if not self-managing. `;
    insight += `At current rates (~7%), ensure positive cash flow after PITI on 75-80% LTV financing.`;
  }

  return insight;
}

/**
 * Analysis 22: Improved NOI with Cosmetic Renovations
 * Includes recommendation if payback is strong
 */
function generateImprovedNOIInsight(result: any): string {
  if (!result) return 'Improved NOI data is not available.';

  const noiIncreasePct = result.currentNOI ? ((result.noiIncrease / result.currentNOI) * 100).toFixed(1) : '0';
  const roiPct = (result.roi || 0).toFixed(1);

  let insight = `Upgrading from original condition (N) to partial renovation (0.5 score) increases `;
  insight += `annual NOI from $${(result.currentNOI || 0).toFixed(0)} to $${(result.improvedNOI || 0).toFixed(0)}—`;
  insight += `a $${(result.noiIncrease || 0).toFixed(0)} gain (${noiIncreasePct}%). `;

  insight += `With estimated improvement costs of $${(result.improvementCost || 0).toFixed(0)} `;
  insight += `(paint, flooring, updated fixtures), the payback period is ${(result.paybackPeriod || 0).toFixed(1)} years `;
  insight += `through incremental rent increases alone. `;

  insight += `The ${roiPct}% annual ROI on improvements makes this a compelling value-add play `;
  insight += `for buy-and-hold investors seeking immediate equity and enhanced cash flow.`;

  // Add recommendation if payback is strong
  if ((result.paybackPeriod || 0) < 4 && (result.roi || 0) > 15) {
    insight += `\n\n**RECOMMENDATION:** With ${(result.paybackPeriod || 0).toFixed(1)}-year payback and ${roiPct}% ROI, `;
    insight += `cosmetic improvements are highly advisable. Budget breakdown: $8-10k flooring (LVP throughout), `;
    insight += `$3-4k paint (interior), $2-3k fixtures/hardware (kitchen/bath). Total investment of $15-18k `;
    insight += `boosts rent by $${((result.noiIncrease || 0) / 12).toFixed(0)}/month and adds $${
      ((result.noiIncrease || 0) / 0.065).toFixed(0)
    } in resale value (6.5% cap rate). `;
    insight += `Complete improvements before tenant placement to maximize first-year returns.`;
  }

  return insight;
}

interface UploadResponse {
  success: boolean;
  data?: {
    fileId: string;
    fileName: string;
    type: 'breakups' | 'propertyradar';
    downloadUrl: string;
  };
  error?: {
    message: string;
    code?: string;
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Verify admin authentication
  const auth = await requireAdmin()
  if (!auth.success) return auth.response

  // Rate limit: 5 report generations per minute (expensive operation)
  const rateLimitResult = await rateLimiters.expensive.check(request)
  if (!rateLimitResult.success) {
    return rateLimitResult.response!
  }

  console.log(`${LOG_PREFIX} Received upload request`);

  try {
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as 'breakups' | 'propertyradar' | null;

    // Validate file
    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'No file provided',
            code: 'NO_FILE',
          },
        } as UploadResponse,
        { status: 400 }
      );
    }

    // Validate type
    if (!type || (type !== 'breakups' && type !== 'propertyradar')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Invalid type. Must be "breakups" or "propertyradar"',
            code: 'INVALID_TYPE',
          },
        } as UploadResponse,
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
            code: 'FILE_TOO_LARGE',
          },
        } as UploadResponse,
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith('.xlsx')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Invalid file type. Only .xlsx files are allowed.',
            code: 'INVALID_FILE_TYPE',
          },
        } as UploadResponse,
        { status: 400 }
      );
    }

    console.log(`${LOG_PREFIX} Processing ${type} upload:`, {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // Create upload directory if it doesn't exist
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Load uploaded Excel file
    const bytes = await file.arrayBuffer();
    const uploadedBuffer = Buffer.from(bytes);
    const uploadedWorkbook = new ExcelJS.Workbook();
    // @ts-expect-error - ExcelJS types incompatible with Node.js 20+ Buffer types
    await uploadedWorkbook.xlsx.load(uploadedBuffer);

    console.log(`${LOG_PREFIX} Workbook loaded with ${uploadedWorkbook.worksheets.length} sheets`);

    // Generate unique file ID
    const fileId = `${type}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    if (type === 'propertyradar') {
      // Process PropertyRadar extraction
      console.log(`${LOG_PREFIX} Generating PropertyRadar extraction...`);
      const clientName = file.name.replace(/^Complete_/, '').replace(/\.xlsx$/, '');
      const outputBuffer = await generatePropertyRadarExcel(uploadedWorkbook, clientName);
      const outputFileName = generatePropertyRadarFilename(clientName);

      // Save PropertyRadar file
      const extension = 'xlsx';
      const fileName = `${fileId}.${extension}`;
      const filePath = join(UPLOAD_DIR, fileName);
      await writeFile(filePath, outputBuffer);

      console.log(`${LOG_PREFIX} PropertyRadar file processed and saved:`, {
        fileId,
        path: filePath,
        size: outputBuffer.length,
      });

      return NextResponse.json(
        {
          success: true,
          data: {
            fileId,
            fileName: outputFileName,
            type,
            downloadUrl: `/api/admin/reportit/download/${type}?fileId=${fileId}`,
          },
        } as UploadResponse,
        { status: 200 }
      );
    } else {
      // BREAKUPS PROCESSING - Full 22-analysis pipeline
      console.log(`${LOG_PREFIX} Starting complete break-ups analysis pipeline...`);
      const clientName = file.name.replace(/^Complete_/, '').replace(/\.xlsx$/, '');

      // Create output directories
      const breakupsDir = join(UPLOAD_DIR, 'breakups', fileId);
      const chartsDir = join(breakupsDir, 'charts');
      const reportsDir = join(breakupsDir, 'reports');
      await mkdir(chartsDir, { recursive: true });
      await mkdir(reportsDir, { recursive: true });

      // STEP 1: Generate all 26 analyses (v2)
      console.log(`${LOG_PREFIX} [1/4] Running 26 break-ups analyses (v2)...`);
      const analysisResults = await generateAllBreakupsAnalyses(uploadedWorkbook, {});
      console.log(`${LOG_PREFIX} Analysis complete: 26 analyses generated (v2 with lease/sale differentiation)`);

      // STEP 2: Generate 26 visualization charts
      console.log(`${LOG_PREFIX} [2/4] Generating 26 visualization charts...`);
      console.log(`${LOG_PREFIX} [DEBUG] Analysis results structure:`, Object.keys(analysisResults));
      const visualizationResult = await generateAllVisualizations(analysisResults, chartsDir);
      console.log(`${LOG_PREFIX} [DEBUG] Visualization result:`, JSON.stringify(visualizationResult, null, 2));
      console.log(`${LOG_PREFIX} Charts complete: ${visualizationResult.successfulCharts}/${visualizationResult.totalCharts} generated`);
      console.log(`${LOG_PREFIX} [DEBUG] Charts array length:`, visualizationResult.charts.length);
      console.log(`${LOG_PREFIX} [DEBUG] Errors:`, visualizationResult.errors);

      // STEP 3: Extract subject property address from row 2
      console.log(`${LOG_PREFIX} [3/6] Extracting subject property address...`);
      const analysisSheetForAddress = uploadedWorkbook.getWorksheet('Analysis');
      let subjectPropertyAddress = 'Unknown Property';
      if (analysisSheetForAddress && analysisSheetForAddress.rowCount >= 2) {
        const row2 = analysisSheetForAddress.getRow(2);
        const fullAddress = row2.getCell(2).value; // Column B = FULL_ADDRESS
        if (fullAddress) {
          subjectPropertyAddress = String(fullAddress);
          console.log(`${LOG_PREFIX} Subject property: ${subjectPropertyAddress}`);
        }
      }

      // STEP 4: Generate unified professional PDF report
      console.log(`${LOG_PREFIX} [4/6] Generating unified professional PDF report...`);
      // Extract chart file paths from successful charts
      const chartPaths = visualizationResult.charts
        .filter(chart => chart.success && chart.filePath)
        .map(chart => chart.filePath);
      console.log(`${LOG_PREFIX} [DEBUG] Chart paths extracted:`, chartPaths.length);

      // Transform analysis results to format expected by PDF generator
      const transformedData = transformAnalysisResultsForPDF(analysisResults, clientName);
      console.log(`${LOG_PREFIX} [DEBUG] Transformed data for PDF generation`);

      // Generate filename from address
      const addressSlug = subjectPropertyAddress
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 50);
      const timestamp = new Date().toISOString().split('T')[0];
      const pdfFileName = `GSRealty_Analysis_${addressSlug}_${timestamp}.pdf`;
      const pdfFilePath = path.join(reportsDir, pdfFileName);

      // Generate unified PDF using pdf-lib
      const logoPath = path.join(process.cwd(), 'logo1.png');
      const pdfResult = await generateUnifiedPDFReport({
        analysisResults: transformedData,
        chartPaths: chartPaths,
        outputPath: pdfFilePath,
        subjectPropertyAddress: subjectPropertyAddress,
        logoPath: logoPath,
      });

      if (pdfResult.success) {
        console.log(`${LOG_PREFIX} PDF complete: ${pdfResult.filePath}`);
        console.log(`${LOG_PREFIX}   - Size: ${(pdfResult.fileSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`${LOG_PREFIX}   - Pages: ${pdfResult.pageCount}`);
      } else {
        console.error(`${LOG_PREFIX} PDF generation failed:`, pdfResult.error);
      }

      // STEP 5: Generate PropertyRadar export
      console.log(`${LOG_PREFIX} [5/6] Generating PropertyRadar export...`);
      const propertyRadarBuffer = await generatePropertyRadarExcel(uploadedWorkbook, clientName);
      const propertyRadarFileName = generatePropertyRadarFilename(clientName);
      const propertyRadarPath = join(breakupsDir, propertyRadarFileName);
      await writeFile(propertyRadarPath, propertyRadarBuffer);
      console.log(`${LOG_PREFIX} PropertyRadar export generated: ${propertyRadarPath}`);

      // STEP 6: Package everything into a .zip file
      console.log(`${LOG_PREFIX} [6/6] Packaging into downloadable .zip file...`);

      // Read properties from Analysis sheet for CSV export
      const analysisSheet = uploadedWorkbook.getWorksheet('Analysis');
      const properties: any[] = [];
      if (analysisSheet) {
        analysisSheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // Skip header
          properties.push({
            item: row.getCell(1).value,
            address: row.getCell(2).value,
            apn: row.getCell(3).value,
            status: row.getCell(4).value,
          });
        });
      }

      const packageResult = await packageBreakupsReport({
        fileId,
        clientName,
        enhancedExcel: uploadedBuffer,
        analysisResults: analysisResults as any, // Type conversion needed
        chartPaths: chartPaths,
        pdfPaths: pdfResult.success ? [pdfResult.filePath] : [], // Single PDF file
        propertyRadarPath: propertyRadarPath, // NEW: Include PropertyRadar export
        properties,
        outputDir: breakupsDir,
      });

      if (!packageResult.success) {
        throw new Error(`Packaging failed: ${packageResult.error}`);
      }

      console.log(`${LOG_PREFIX} Break-ups pipeline complete!`, {
        zipFile: packageResult.fileName,
        zipSize: `${(packageResult.zipSize / 1024 / 1024).toFixed(2)} MB`,
        contents: packageResult.contents,
      });

      const outputFileName = packageResult.fileName;

      // Change extension to zip for the fileId reference
      const fileName = `${fileId}.zip`;
      const filePath = join(UPLOAD_DIR, fileName);
      // Copy the zip file to the expected location
      await writeFile(filePath, await fsReadFile(packageResult.zipPath));

      return NextResponse.json(
        {
          success: true,
          data: {
            fileId,
            fileName: outputFileName,
            type,
            downloadUrl: `/api/admin/reportit/download/${type}?fileId=${fileId}`,
          },
        } as UploadResponse,
        { status: 200 }
      );
    }
  } catch (error) {
    console.error(`${LOG_PREFIX} Upload error:`, error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          code: 'INTERNAL_ERROR',
        },
      } as UploadResponse,
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return NextResponse.json({
    status: 'ready',
    version: '1.0.0',
    supportedFormats: ['XLSX'],
    maxFileSize: MAX_FILE_SIZE,
    types: ['breakups', 'propertyradar'],
  });
}
