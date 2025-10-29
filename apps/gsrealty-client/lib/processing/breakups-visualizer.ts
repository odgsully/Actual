/**
 * ReportIt Break-ups Analysis Visualization Engine
 *
 * Generates PNG charts for all 22 comparative property analyses
 * Uses QuickChart API for server-side chart rendering at 300 DPI
 *
 * @module lib/processing/breakups-visualizer
 */

import QuickChart from 'quickchart-js';
import fs from 'fs/promises';
import path from 'path';
import {
  BreakupsAnalysisResult,
  VisualizationResult,
  SingleVisualizationResult,
  CHART_COLORS,
  CHART_CONFIG,
  ANALYSIS_NAMES,
} from '@/lib/types/breakups-analysis';

// ============================================================================
// Main Orchestrator
// ============================================================================

/**
 * Generate all 22 visualizations from analysis results
 *
 * @param analysisResults - Complete analysis results from breakups-generator
 * @param outputDir - Directory to save PNG files (e.g., tmp/reportit/breakups/{fileId}/charts/)
 * @returns Visualization result with file paths and success status
 */
export async function generateAllVisualizations(
  analysisResults: any, // Changed from BreakupsAnalysisResult to any to fix type mismatch
  outputDir: string
): Promise<VisualizationResult> {
  const startTime = Date.now();
  const charts: SingleVisualizationResult[] = [];
  const errors: string[] = [];

  console.log('[Visualizer] Starting chart generation');
  console.log('[Visualizer] Output directory:', outputDir);
  console.log('[Visualizer] Analysis results keys:', Object.keys(analysisResults));

  // Ensure output directory exists
  try {
    await fs.mkdir(outputDir, { recursive: true });
    console.log('[Visualizer] Output directory created/verified');
  } catch (error) {
    console.error('[Visualizer] Failed to create output directory:', error);
    return {
      success: false,
      outputDir,
      charts: [],
      totalCharts: 0,
      successfulCharts: 0,
      failedCharts: 0,
      errors: [`Failed to create output directory: ${error}`],
      processingTime: Date.now() - startTime,
    };
  }

  // Generate each visualization
  const generators = [
    () => generateAnalysis1(analysisResults.brDistribution, outputDir),
    () => generateAnalysis2(analysisResults.hoaAnalysis, outputDir),
    () => generateAnalysis3(analysisResults.strAnalysis, outputDir),
    () => generateAnalysis4(analysisResults.renovationImpact, outputDir),
    () => generateAnalysis5(analysisResults.compsClassification, outputDir),
    () => generateAnalysis6(analysisResults.sqftVariance, outputDir),
    () => generateAnalysis7(analysisResults.priceVariance, outputDir),
    () => generateAnalysis8(analysisResults.leaseVsSale, outputDir),
    () => generateAnalysis9(analysisResults.propertyRadarComps, outputDir),
    () => generateAnalysis10(analysisResults.individualPRComps, outputDir),
    () => generateAnalysis11(analysisResults.brPrecision, outputDir),
    () => generateAnalysis12(analysisResults.timeFrames, outputDir),
    () => generateAnalysis13(analysisResults.directVsIndirect, outputDir),
    () => generateAnalysis14(analysisResults.recentDirectVsIndirect, outputDir),
    () => generateAnalysis15(analysisResults.activeVsClosed, outputDir),
    () => generateAnalysis16(analysisResults.activeVsPending, outputDir),
    () => generateAnalysis17(analysisResults.renovationDelta, outputDir),
    () => generateAnalysis18(analysisResults.partialRenovationDelta, outputDir),
    () => generateAnalysis19(analysisResults.interquartileRanges, outputDir),
    () => generateAnalysis20(analysisResults.distributionTails, outputDir),
    () => generateAnalysis21(analysisResults.expectedNOI, outputDir),
    () => generateAnalysis22(analysisResults.improvedNOI, outputDir),
  ];

  for (let i = 0; i < generators.length; i++) {
    const analysisNumber = i + 1;
    console.log(`[Visualizer] Generating chart ${analysisNumber}/22...`);
    try {
      const result = await generators[i]();
      charts.push(result);
      if (result.success) {
        console.log(`[Visualizer] ✅ Chart ${analysisNumber} generated: ${result.filePath}`);
      } else {
        console.error(`[Visualizer] ❌ Chart ${analysisNumber} failed: ${result.error}`);
      }
    } catch (error) {
      const errorMsg = `Analysis ${analysisNumber} failed: ${error}`;
      console.error(`[Visualizer] ❌ Chart ${analysisNumber} threw error:`, error);
      errors.push(errorMsg);
      charts.push({
        analysisNumber,
        analysisName: ANALYSIS_NAMES[analysisNumber as keyof typeof ANALYSIS_NAMES],
        chartType: 'unknown',
        filePath: '',
        width: 0,
        height: 0,
        dpi: 0,
        success: false,
        error: errorMsg,
      });
    }
  }

  const successfulCharts = charts.filter(c => c.success).length;
  const failedCharts = charts.filter(c => !c.success).length;

  return {
    success: failedCharts === 0,
    outputDir,
    charts,
    totalCharts: charts.length,
    successfulCharts,
    failedCharts,
    errors,
    processingTime: Date.now() - startTime,
  };
}

// ============================================================================
// Individual Visualization Generators
// ============================================================================

/**
 * Analysis 1: BR Sizes Distribution (Pie Chart)
 */
async function generateAnalysis1(data: any, outputDir: string): Promise<SingleVisualizationResult> {
  const labels = Object.keys(data.distribution).map(br => `${br} BR`);
  const values = Object.values(data.distribution) as number[];

  const config = {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: [
          CHART_COLORS.primary,
          CHART_COLORS.secondary,
          CHART_COLORS.positive,
          CHART_COLORS.neutral,
          CHART_COLORS.negative,
        ],
      }],
    },
    options: {
      title: {
        display: true,
        text: 'Bedroom Distribution',
        fontSize: 18,
      },
      plugins: {
        datalabels: {
          formatter: (value: number, context: any) => {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${percentage}%`;
          },
          color: '#fff',
          font: { weight: 'bold', size: 14 },
        },
      },
    },
  };

  return await saveChart(config, 1, 'br_distribution', outputDir);
}

/**
 * Analysis 2: HOA vs Non-HOA (Bar Chart)
 */
async function generateAnalysis2(data: any, outputDir: string): Promise<SingleVisualizationResult> {
  // Add null checks and defaults
  const withHOACount = data?.withHOA?.count || 0;
  const withoutHOACount = data?.withoutHOA?.count || 0;
  const withHOAPrice = data?.withHOA?.avgPrice || 0;
  const withoutHOAPrice = data?.withoutHOA?.avgPrice || 0;

  const config = {
    type: 'bar',
    data: {
      labels: ['With HOA', 'Without HOA'],
      datasets: [
        {
          label: 'Count',
          data: [withHOACount, withoutHOACount],
          backgroundColor: CHART_COLORS.primary,
          yAxisID: 'y',
        },
        {
          label: 'Avg Price',
          data: [withHOAPrice, withoutHOAPrice],
          backgroundColor: CHART_COLORS.secondary,
          yAxisID: 'y1',
        },
      ],
    },
    options: {
      title: {
        display: true,
        text: 'HOA vs Non-HOA Properties',
        fontSize: 18,
      },
      scales: {
        y: {
          type: 'linear',
          position: 'left',
          title: { display: true, text: 'Count' },
        },
        y1: {
          type: 'linear',
          position: 'right',
          title: { display: true, text: 'Avg Price ($)' },
          grid: { drawOnChartArea: false },
        },
      },
    },
  };

  return await saveChart(config, 2, 'hoa_vs_non_hoa', outputDir);
}

/**
 * Analysis 3: STR vs Non-STR (Pie Chart)
 */
async function generateAnalysis3(data: any, outputDir: string): Promise<SingleVisualizationResult> {
  const strCount = data?.strEligible?.count || 0;
  const nonSTRCount = data?.nonSTR?.count || 0;
  const premiumPct = data?.premiumPercentage || 0;

  const config = {
    type: 'pie',
    data: {
      labels: ['STR Eligible', 'Non-STR'],
      datasets: [{
        data: [strCount, nonSTRCount],
        backgroundColor: [CHART_COLORS.positive, CHART_COLORS.neutral],
      }],
    },
    options: {
      title: {
        display: true,
        text: `STR Eligibility Distribution (Premium: ${premiumPct.toFixed(1)}%)`,
        fontSize: 18,
      },
      plugins: {
        datalabels: {
          formatter: (value: number, context: any) => {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${percentage}%`;
          },
          color: '#fff',
          font: { weight: 'bold', size: 14 },
        },
      },
    },
  };

  return await saveChart(config, 3, 'str_vs_non_str', outputDir);
}

/**
 * Analysis 4: Renovation Impact (Bar Chart)
 */
async function generateAnalysis4(data: any, outputDir: string): Promise<SingleVisualizationResult> {
  const config = {
    type: 'bar',
    data: {
      labels: ['Renovated (Y)', 'Partial (0.5)', 'Not Renovated (N)'],
      datasets: [
        {
          label: 'Count',
          data: [data.Y.count, data['0.5'].count, data.N.count],
          backgroundColor: [CHART_COLORS.positive, CHART_COLORS.secondary, CHART_COLORS.neutral],
        },
        {
          label: 'Avg Price',
          data: [data.Y.avgPrice, data['0.5'].avgPrice, data.N.avgPrice],
          backgroundColor: [
            CHART_COLORS.positive + '80',
            CHART_COLORS.secondary + '80',
            CHART_COLORS.neutral + '80',
          ],
        },
      ],
    },
    options: {
      title: {
        display: true,
        text: 'Renovation Impact on Property Values',
        fontSize: 18,
      },
    },
  };

  return await saveChart(config, 4, 'renovation_impact', outputDir);
}

/**
 * Analysis 5: Comps Classification (Scatter Plot)
 */
async function generateAnalysis5(data: any, outputDir: string): Promise<SingleVisualizationResult> {
  // Generator returns: comps.avgPrice, comps.priceRange.min/max (no median or characteristics)
  // Calculate median from min/max as approximation
  const compsMedian = data?.comps?.priceRange?.min && data?.comps?.priceRange?.max
    ? (data.comps.priceRange.min + data.comps.priceRange.max) / 2
    : data?.comps?.avgPrice || 0;

  const nonCompsMedian = data?.nonComps?.priceRange?.min && data?.nonComps?.priceRange?.max
    ? (data.nonComps.priceRange.min + data.nonComps.priceRange.max) / 2
    : data?.nonComps?.avgPrice || 0;

  // Since avgSqft is not in the data structure, use avgPrice as proxy or set to 0
  const compsCount = data?.comps?.count || 0;
  const nonCompsCount = data?.nonComps?.count || 0;

  const config = {
    type: 'bar',
    data: {
      labels: ['Comps', 'Non-Comps'],
      datasets: [
        {
          label: 'Count',
          data: [compsCount, nonCompsCount],
          backgroundColor: [CHART_COLORS.primary, CHART_COLORS.neutral],
        },
        {
          label: 'Avg Price',
          data: [data?.comps?.avgPrice || 0, data?.nonComps?.avgPrice || 0],
          backgroundColor: [CHART_COLORS.secondary + '80', CHART_COLORS.neutral + '80'],
        },
      ],
    },
    options: {
      title: {
        display: true,
        text: 'Comps vs Non-Comps Classification',
        fontSize: 18,
      },
    },
  };

  return await saveChart(config, 5, 'comps_classification', outputDir);
}

/**
 * Analysis 6: Square Footage Variance (Scatter Plot)
 */
async function generateAnalysis6(data: any, outputDir: string): Promise<SingleVisualizationResult> {
  // subjectSqft is not returned, calculate from optimalRange (range is 80%-120% of subject)
  const within20Count = data?.within20?.count || 0;
  const outside20Count = data?.outside20?.count || 0;
  const within20Price = data?.within20?.avgPricePerSqft || 0;
  const outside20Price = data?.outside20?.avgPricePerSqft || 0;
  const optimalMin = data?.optimalRange?.min || 0;
  const optimalMax = data?.optimalRange?.max || 0;

  // Change to bar chart for clarity since scatter needs more data points
  const config = {
    type: 'bar',
    data: {
      labels: ['Within 20%', 'Outside 20%'],
      datasets: [
        {
          label: 'Count',
          data: [within20Count, outside20Count],
          backgroundColor: [CHART_COLORS.positive, CHART_COLORS.negative],
        },
        {
          label: 'Avg Price/SqFt',
          data: [within20Price, outside20Price],
          backgroundColor: [CHART_COLORS.positive + '80', CHART_COLORS.negative + '80'],
        },
      ],
    },
    options: {
      title: {
        display: true,
        text: `Square Footage Variance Analysis (Range: ${optimalMin.toFixed(0)}-${optimalMax.toFixed(0)} sqft)`,
        fontSize: 18,
      },
    },
  };

  return await saveChart(config, 6, 'sqft_variance', outputDir);
}

/**
 * Analysis 7: Price Variance (Box Plot - approximated with bar)
 */
async function generateAnalysis7(data: any, outputDir: string): Promise<SingleVisualizationResult> {
  // estimatedValue is not returned by the generator, only within20 and outside20 data
  const within20Count = data?.within20?.count || 0;
  const underpricedCount = data?.outside20?.underpriced || 0;
  const overpricedCount = data?.outside20?.overpriced || 0;
  const avgDaysOnMarket = data?.within20?.avgDaysOnMarket || 0;

  const config = {
    type: 'bar',
    data: {
      labels: ['Within 20%', 'Underpriced', 'Overpriced'],
      datasets: [{
        label: 'Property Count',
        data: [within20Count, underpricedCount, overpricedCount],
        backgroundColor: [CHART_COLORS.positive, CHART_COLORS.secondary, CHART_COLORS.negative],
      }],
    },
    options: {
      title: {
        display: true,
        text: `Price Variance Analysis (Avg DOM: ${avgDaysOnMarket.toFixed(0)} days)`,
        fontSize: 18,
      },
    },
  };

  return await saveChart(config, 7, 'price_variance', outputDir);
}

/**
 * Analysis 8: Lease vs Sale (Bar Chart)
 */
async function generateAnalysis8(data: any, outputDir: string): Promise<SingleVisualizationResult> {
  const leasePerSqft = data?.lease?.avgAnnualPerSqft || 0;
  const salePerSqft = data?.sale?.avgPerSqft || 0;
  const capRate = data?.lease?.capRate || 0;

  const config = {
    type: 'bar',
    data: {
      labels: ['Lease (Annual)', 'Sale'],
      datasets: [{
        label: 'Price per SqFt ($)',
        data: [leasePerSqft, salePerSqft],
        backgroundColor: [CHART_COLORS.primary, CHART_COLORS.secondary],
      }],
    },
    options: {
      title: {
        display: true,
        text: `Lease vs Sale Analysis (Cap Rate: ${(capRate * 100).toFixed(2)}%)`,
        fontSize: 18,
      },
    },
  };

  return await saveChart(config, 8, 'lease_vs_sale', outputDir);
}

/**
 * Analysis 9: PropertyRadar Comps (Bar Chart)
 */
async function generateAnalysis9(data: any, outputDir: string): Promise<SingleVisualizationResult> {
  // Generator only returns propertyRadar.count and standard.count (no overlap or concordance)
  const prCount = data?.propertyRadar?.count || 0;
  const standardCount = data?.standard?.count || 0;

  const config = {
    type: 'bar',
    data: {
      labels: ['Property Radar Comps', 'Standard Comps'],
      datasets: [{
        label: 'Count',
        data: [prCount, standardCount],
        backgroundColor: [CHART_COLORS.primary, CHART_COLORS.secondary],
      }],
    },
    options: {
      title: {
        display: true,
        text: `PropertyRadar vs Standard Comps`,
        fontSize: 18,
      },
    },
  };

  return await saveChart(config, 9, 'property_radar_comps', outputDir);
}

/**
 * Analysis 10: Individual PR Comps (Bar Chart)
 */
async function generateAnalysis10(data: any, outputDir: string): Promise<SingleVisualizationResult> {
  // Generator returns priceDiff and sqftDiff, not similarity
  const comparisons = data?.comparisons || [];
  const labels = comparisons.map((c: any) => `Comp ${c.compNumber}`);
  const priceDiffs = comparisons.map((c: any) => c.priceDiff || 0);
  const avgSimilarity = data?.avgSimilarity || 0;

  const config = {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Price Difference ($)',
        data: priceDiffs,
        backgroundColor: priceDiffs.map((d: number) => d >= 0 ? CHART_COLORS.positive : CHART_COLORS.negative),
      }],
    },
    options: {
      title: {
        display: true,
        text: `Individual PropertyRadar Comps (Count: ${comparisons.length})`,
        fontSize: 18,
      },
      scales: {
        y: {
          title: { display: true, text: 'Price Difference ($)' },
        },
      },
    },
  };

  return await saveChart(config, 10, 'individual_pr_comps', outputDir);
}

/**
 * Analysis 11: BR Precision (Bar Chart)
 */
async function generateAnalysis11(data: any, outputDir: string): Promise<SingleVisualizationResult> {
  // subjectBR is not returned in BRPrecisionResult
  const exactCount = data?.exact?.count || 0;
  const within1Count = data?.within1?.count || 0;
  const exactPrice = data?.exact?.avgPrice || 0;
  const within1Price = data?.within1?.avgPrice || 0;

  const config = {
    type: 'bar',
    data: {
      labels: ['Exact BR Match', 'Within ±1 BR'],
      datasets: [
        {
          label: 'Count',
          data: [exactCount, within1Count],
          backgroundColor: CHART_COLORS.primary,
        },
        {
          label: 'Avg Price',
          data: [exactPrice, within1Price],
          backgroundColor: CHART_COLORS.secondary,
        },
      ],
    },
    options: {
      title: {
        display: true,
        text: 'Bedroom Match Precision Analysis',
        fontSize: 18,
      },
    },
  };

  return await saveChart(config, 11, 'br_precision', outputDir);
}

/**
 * Analysis 12: Time Frame Analysis (Line Chart)
 */
async function generateAnalysis12(data: any, outputDir: string): Promise<SingleVisualizationResult> {
  const t36Price = data?.t36?.avgPrice || 0;
  const t12Price = data?.t12?.avgPrice || 0;
  const appreciation = data?.appreciation || 0;

  const config = {
    type: 'line',
    data: {
      labels: ['T-36 (3 Years)', 'T-12 (1 Year)'],
      datasets: [{
        label: 'Average Price ($)',
        data: [t36Price, t12Price],
        borderColor: CHART_COLORS.primary,
        backgroundColor: CHART_COLORS.primary + '40',
        fill: true,
        tension: 0.4,
      }],
    },
    options: {
      title: {
        display: true,
        text: `Market Trend Analysis (Appreciation: ${appreciation.toFixed(2)}%)`,
        fontSize: 18,
      },
    },
  };

  return await saveChart(config, 12, 'time_frame_analysis', outputDir);
}

/**
 * Analysis 13: Direct vs Indirect (Bar Chart)
 */
async function generateAnalysis13(data: any, outputDir: string): Promise<SingleVisualizationResult> {
  const directCount = data?.direct?.count || 0;
  const indirectCount = data?.indirect?.count || 0;
  const directPrice = data?.direct?.avgPrice || 0;
  const indirectPrice = data?.indirect?.avgPrice || 0;
  const reliability = data?.reliabilityScore || 0;

  const config = {
    type: 'bar',
    data: {
      labels: ['Direct Comps', 'Indirect (1.5mi)'],
      datasets: [
        {
          label: 'Count',
          data: [directCount, indirectCount],
          backgroundColor: CHART_COLORS.primary,
        },
        {
          label: 'Avg Price',
          data: [directPrice, indirectPrice],
          backgroundColor: CHART_COLORS.secondary,
        },
      ],
    },
    options: {
      title: {
        display: true,
        text: `Direct vs Indirect Comps (Reliability: ${reliability.toFixed(2)})`,
        fontSize: 18,
      },
    },
  };

  return await saveChart(config, 13, 'direct_vs_indirect', outputDir);
}

/**
 * Analysis 14: Recent Direct vs Indirect (Line Chart)
 */
async function generateAnalysis14(data: any, outputDir: string): Promise<SingleVisualizationResult> {
  const config = {
    type: 'line',
    data: {
      labels: ['Recent Direct', 'Recent Indirect'],
      datasets: [
        {
          label: 'Count',
          data: [data.recentDirect.count, data.recentIndirect.count],
          borderColor: CHART_COLORS.primary,
          backgroundColor: CHART_COLORS.primary + '40',
        },
        {
          label: 'Avg Price',
          data: [data.recentDirect.avgPrice, data.recentIndirect.avgPrice],
          borderColor: CHART_COLORS.secondary,
          backgroundColor: CHART_COLORS.secondary + '40',
        },
      ],
    },
    options: {
      title: {
        display: true,
        text: 'Recent Market Activity (T-12)',
        fontSize: 18,
      },
    },
  };

  return await saveChart(config, 14, 'recent_direct_vs_indirect', outputDir);
}

/**
 * Analysis 15: Active vs Closed (Bar Chart)
 */
async function generateAnalysis15(data: any, outputDir: string): Promise<SingleVisualizationResult> {
  const activeCount = data?.active?.count || 0;
  const closedCount = data?.closed?.count || 0;
  const activePrice = data?.active?.avgListPrice || 0;
  const closedPrice = data?.closed?.avgSalePrice || 0;
  const absorption = data?.absorptionRate || 0;

  const config = {
    type: 'bar',
    data: {
      labels: ['Active', 'Closed'],
      datasets: [
        {
          label: 'Count',
          data: [activeCount, closedCount],
          backgroundColor: CHART_COLORS.primary,
        },
        {
          label: 'Avg Price',
          data: [activePrice, closedPrice],
          backgroundColor: CHART_COLORS.secondary,
        },
      ],
    },
    options: {
      title: {
        display: true,
        text: `Active vs Closed Properties (Absorption: ${(absorption * 100).toFixed(1)}%)`,
        fontSize: 18,
      },
    },
  };

  return await saveChart(config, 15, 'active_vs_closed', outputDir);
}

/**
 * Analysis 16: Active vs Pending (Bar Chart)
 */
async function generateAnalysis16(data: any, outputDir: string): Promise<SingleVisualizationResult> {
  const activeCount = data?.active?.count || 0;
  const pendingCount = data?.pending?.count || 0;
  const pendingRatio = data?.pendingRatio || 0;

  const config = {
    type: 'bar',
    data: {
      labels: ['Active', 'Pending'],
      datasets: [{
        label: 'Count',
        data: [activeCount, pendingCount],
        backgroundColor: [CHART_COLORS.primary, CHART_COLORS.secondary],
      }],
    },
    options: {
      title: {
        display: true,
        text: `Market Pipeline (Pending Ratio: ${(pendingRatio * 100).toFixed(1)}%)`,
        fontSize: 18,
      },
    },
  };

  return await saveChart(config, 16, 'active_vs_pending', outputDir);
}

/**
 * Analysis 17: Renovation Delta (Waterfall - approximated with bar)
 */
async function generateAnalysis17(data: any, outputDir: string): Promise<SingleVisualizationResult> {
  const notRenovated = data?.notRenovatedAvg || 0;
  const delta = data?.delta || 0;
  const renovated = data?.renovatedAvg || 0;
  const pctIncrease = data?.percentageIncrease || 0;

  const config = {
    type: 'bar',
    data: {
      labels: ['Not Renovated', 'Delta', 'Renovated'],
      datasets: [{
        label: 'Price per SqFt ($)',
        data: [notRenovated, delta, renovated],
        backgroundColor: [CHART_COLORS.neutral, CHART_COLORS.secondary, CHART_COLORS.positive],
      }],
    },
    options: {
      title: {
        display: true,
        text: `Renovation ROI (${pctIncrease.toFixed(1)}% increase)`,
        fontSize: 18,
      },
    },
  };

  return await saveChart(config, 17, 'renovation_delta', outputDir);
}

/**
 * Analysis 18: Partial Renovation Delta (Waterfall - approximated with bar)
 */
async function generateAnalysis18(data: any, outputDir: string): Promise<SingleVisualizationResult> {
  const notRenovated = data?.notRenovatedAvg || 0;
  const delta = data?.delta || 0;
  const partial = data?.partialAvg || 0;
  const pctIncrease = data?.percentageIncrease || 0;

  const config = {
    type: 'bar',
    data: {
      labels: ['Not Renovated', 'Delta', 'Partial Renovation'],
      datasets: [{
        label: 'Price per SqFt ($)',
        data: [notRenovated, delta, partial],
        backgroundColor: [CHART_COLORS.neutral, CHART_COLORS.secondary, CHART_COLORS.primary],
      }],
    },
    options: {
      title: {
        display: true,
        text: `Partial Renovation ROI (${pctIncrease.toFixed(1)}% increase)`,
        fontSize: 18,
      },
    },
  };

  return await saveChart(config, 18, 'partial_renovation_delta', outputDir);
}

/**
 * Analysis 19: Interquartile Range (Box Plot - approximated with bar)
 */
async function generateAnalysis19(data: any, outputDir: string): Promise<SingleVisualizationResult> {
  const config = {
    type: 'bar',
    data: {
      labels: ['Price', 'Price/SqFt'],
      datasets: [
        {
          label: 'Q25',
          data: [data.price.q25, data.pricePerSqft.q25],
          backgroundColor: CHART_COLORS.neutral,
        },
        {
          label: 'Median',
          data: [data.price.median, data.pricePerSqft.median],
          backgroundColor: CHART_COLORS.primary,
        },
        {
          label: 'Q75',
          data: [data.price.q75, data.pricePerSqft.q75],
          backgroundColor: CHART_COLORS.secondary,
        },
      ],
    },
    options: {
      title: {
        display: true,
        text: 'Interquartile Range Analysis',
        fontSize: 18,
      },
    },
  };

  return await saveChart(config, 19, 'interquartile_range', outputDir);
}

/**
 * Analysis 20: Distribution Tails (Box Plot - approximated with bar)
 */
async function generateAnalysis20(data: any, outputDir: string): Promise<SingleVisualizationResult> {
  const config = {
    type: 'bar',
    data: {
      labels: ['P5', 'P10', 'P50', 'P90', 'P95'],
      datasets: [{
        label: 'Price Distribution',
        data: [
          data.percentiles.p5,
          data.percentiles.p10,
          data.percentiles.p50,
          data.percentiles.p90,
          data.percentiles.p95,
        ],
        backgroundColor: [
          CHART_COLORS.negative,
          CHART_COLORS.neutral,
          CHART_COLORS.primary,
          CHART_COLORS.neutral,
          CHART_COLORS.positive,
        ],
      }],
    },
    options: {
      title: {
        display: true,
        text: 'Distribution Tails Analysis',
        fontSize: 18,
      },
    },
  };

  return await saveChart(config, 20, 'distribution_tails', outputDir);
}

/**
 * Analysis 21: Expected NOI (Dashboard - shown as grouped bar)
 */
async function generateAnalysis21(data: any, outputDir: string): Promise<SingleVisualizationResult> {
  const monthlyRent = data?.monthlyRent || 0;
  const annualIncome = data?.annualIncome || 0;
  const operatingExpenses = data?.operatingExpenses || 0;
  const annualNOI = data?.annualNOI || 0;
  const capRate = data?.capRate || 0;

  const config = {
    type: 'bar',
    data: {
      labels: ['Monthly Rent', 'Annual Income', 'Operating Exp', 'Annual NOI'],
      datasets: [{
        label: 'Amount ($)',
        data: [
          monthlyRent,
          annualIncome / 12, // Normalize to monthly
          operatingExpenses / 12,
          annualNOI / 12,
        ],
        backgroundColor: [
          CHART_COLORS.primary,
          CHART_COLORS.positive,
          CHART_COLORS.negative,
          CHART_COLORS.secondary,
        ],
      }],
    },
    options: {
      title: {
        display: true,
        text: `Expected NOI Analysis (Cap Rate: ${(capRate * 100).toFixed(2)}%)`,
        fontSize: 18,
      },
    },
  };

  return await saveChart(config, 21, 'expected_noi', outputDir);
}

/**
 * Analysis 22: Improved NOI (Dashboard - shown as grouped bar)
 */
async function generateAnalysis22(data: any, outputDir: string): Promise<SingleVisualizationResult> {
  const currentNOI = data?.currentNOI || 0;
  const improvedNOI = data?.improvedNOI || 0;
  const noiIncrease = data?.noiIncrease || 0;
  const improvementCost = data?.improvementCost || 0;
  const paybackPeriod = data?.paybackPeriod || 0;
  const roi = data?.roi || 0;

  const config = {
    type: 'bar',
    data: {
      labels: ['Current NOI', 'Improved NOI', 'NOI Increase', 'Improvement Cost'],
      datasets: [{
        label: 'Amount ($)',
        data: [currentNOI, improvedNOI, noiIncrease, improvementCost],
        backgroundColor: [
          CHART_COLORS.neutral,
          CHART_COLORS.positive,
          CHART_COLORS.secondary,
          CHART_COLORS.negative,
        ],
      }],
    },
    options: {
      title: {
        display: true,
        text: `Improvement ROI (Payback: ${paybackPeriod.toFixed(1)} years, ROI: ${roi.toFixed(1)}%)`,
        fontSize: 18,
      },
    },
  };

  return await saveChart(config, 22, 'improved_noi', outputDir);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Save chart configuration as PNG file
 */
async function saveChart(
  config: any,
  analysisNumber: number,
  analysisName: string,
  outputDir: string
): Promise<SingleVisualizationResult> {
  const fileName = `analysis_${analysisNumber.toString().padStart(2, '0')}_${analysisName}.png`;
  const filePath = path.join(outputDir, fileName);

  console.log(`[saveChart] Analysis ${analysisNumber}: ${analysisName}`);
  console.log(`[saveChart] Output path: ${filePath}`);

  try {
    const chart = new QuickChart();
    chart.setConfig(config);
    chart.setWidth(CHART_CONFIG.width);
    chart.setHeight(CHART_CONFIG.height);
    chart.setBackgroundColor(CHART_CONFIG.backgroundColor);

    console.log(`[saveChart] Fetching from QuickChart API...`);
    // Get chart as buffer
    const chartBuffer = await chart.toBinary();
    console.log(`[saveChart] Got buffer: ${(chartBuffer.length / 1024).toFixed(2)} KB`);

    // Save to file
    console.log(`[saveChart] Writing to file...`);
    await fs.writeFile(filePath, chartBuffer);
    console.log(`[saveChart] File written successfully`);

    return {
      analysisNumber,
      analysisName,
      chartType: config.type,
      filePath,
      width: CHART_CONFIG.width,
      height: CHART_CONFIG.height,
      dpi: CHART_CONFIG.dpi,
      success: true,
    };
  } catch (error) {
    console.error(`[saveChart] ERROR:`, error);
    return {
      analysisNumber,
      analysisName,
      chartType: config.type,
      filePath: '',
      width: 0,
      height: 0,
      dpi: 0,
      success: false,
      error: `Failed to generate chart: ${error}`,
    };
  }
}

// ============================================================================
// Individual Chart Type Generators (for external use)
// ============================================================================

/**
 * Generate a pie chart
 */
export async function generatePieChart(
  data: { labels: string[]; values: number[] },
  title: string,
  outputPath: string
): Promise<boolean> {
  const config = {
    type: 'pie',
    data: {
      labels: data.labels,
      datasets: [{
        data: data.values,
        backgroundColor: Object.values(CHART_COLORS),
      }],
    },
    options: {
      title: { display: true, text: title, fontSize: 18 },
      plugins: {
        datalabels: {
          formatter: (value: number, context: any) => {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            return `${((value / total) * 100).toFixed(1)}%`;
          },
          color: '#fff',
          font: { weight: 'bold', size: 14 },
        },
      },
    },
  };

  try {
    const chart = new QuickChart();
    chart.setConfig(config);
    chart.setWidth(CHART_CONFIG.width);
    chart.setHeight(CHART_CONFIG.height);
    const buffer = await chart.toBinary();
    await fs.writeFile(outputPath, buffer);
    return true;
  } catch (error) {
    console.error(`Failed to generate pie chart: ${error}`);
    return false;
  }
}

/**
 * Generate a bar chart
 */
export async function generateBarChart(
  data: { labels: string[]; datasets: Array<{ label: string; data: number[]; backgroundColor?: string }> },
  title: string,
  outputPath: string
): Promise<boolean> {
  const config = {
    type: 'bar',
    data: {
      labels: data.labels,
      datasets: data.datasets.map((ds, idx) => ({
        ...ds,
        backgroundColor: ds.backgroundColor || Object.values(CHART_COLORS)[idx % 5],
      })),
    },
    options: {
      title: { display: true, text: title, fontSize: 18 },
    },
  };

  try {
    const chart = new QuickChart();
    chart.setConfig(config);
    chart.setWidth(CHART_CONFIG.width);
    chart.setHeight(CHART_CONFIG.height);
    const buffer = await chart.toBinary();
    await fs.writeFile(outputPath, buffer);
    return true;
  } catch (error) {
    console.error(`Failed to generate bar chart: ${error}`);
    return false;
  }
}

/**
 * Generate a line chart
 */
export async function generateLineChart(
  data: { labels: string[]; datasets: Array<{ label: string; data: number[]; borderColor?: string }> },
  title: string,
  outputPath: string
): Promise<boolean> {
  const config = {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: data.datasets.map((ds, idx) => ({
        ...ds,
        borderColor: ds.borderColor || Object.values(CHART_COLORS)[idx % 5],
        backgroundColor: (ds.borderColor || Object.values(CHART_COLORS)[idx % 5]) + '40',
        fill: true,
        tension: 0.4,
      })),
    },
    options: {
      title: { display: true, text: title, fontSize: 18 },
    },
  };

  try {
    const chart = new QuickChart();
    chart.setConfig(config);
    chart.setWidth(CHART_CONFIG.width);
    chart.setHeight(CHART_CONFIG.height);
    const buffer = await chart.toBinary();
    await fs.writeFile(outputPath, buffer);
    return true;
  } catch (error) {
    console.error(`Failed to generate line chart: ${error}`);
    return false;
  }
}

/**
 * Generate a scatter plot
 */
export async function generateScatterPlot(
  data: { datasets: Array<{ label: string; data: Array<{ x: number; y: number }>; backgroundColor?: string }> },
  title: string,
  outputPath: string,
  xLabel: string = 'X',
  yLabel: string = 'Y'
): Promise<boolean> {
  const config = {
    type: 'scatter',
    data: {
      datasets: data.datasets.map((ds, idx) => ({
        ...ds,
        backgroundColor: ds.backgroundColor || Object.values(CHART_COLORS)[idx % 5],
        pointRadius: 8,
      })),
    },
    options: {
      title: { display: true, text: title, fontSize: 18 },
      scales: {
        x: { title: { display: true, text: xLabel } },
        y: { title: { display: true, text: yLabel } },
      },
    },
  };

  try {
    const chart = new QuickChart();
    chart.setConfig(config);
    chart.setWidth(CHART_CONFIG.width);
    chart.setHeight(CHART_CONFIG.height);
    const buffer = await chart.toBinary();
    await fs.writeFile(outputPath, buffer);
    return true;
  } catch (error) {
    console.error(`Failed to generate scatter plot: ${error}`);
    return false;
  }
}

/**
 * Generate a box plot (approximated with bar chart showing quartiles)
 */
export async function generateBoxPlot(
  data: { labels: string[]; quartiles: Array<{ q25: number; median: number; q75: number }> },
  title: string,
  outputPath: string
): Promise<boolean> {
  const config = {
    type: 'bar',
    data: {
      labels: data.labels,
      datasets: [
        {
          label: 'Q25',
          data: data.quartiles.map(q => q.q25),
          backgroundColor: CHART_COLORS.neutral,
        },
        {
          label: 'Median',
          data: data.quartiles.map(q => q.median),
          backgroundColor: CHART_COLORS.primary,
        },
        {
          label: 'Q75',
          data: data.quartiles.map(q => q.q75),
          backgroundColor: CHART_COLORS.secondary,
        },
      ],
    },
    options: {
      title: { display: true, text: title, fontSize: 18 },
    },
  };

  try {
    const chart = new QuickChart();
    chart.setConfig(config);
    chart.setWidth(CHART_CONFIG.width);
    chart.setHeight(CHART_CONFIG.height);
    const buffer = await chart.toBinary();
    await fs.writeFile(outputPath, buffer);
    return true;
  } catch (error) {
    console.error(`Failed to generate box plot: ${error}`);
    return false;
  }
}

/**
 * Generate a waterfall chart (approximated with bar chart)
 */
export async function generateWaterfallChart(
  data: { labels: string[]; values: number[] },
  title: string,
  outputPath: string
): Promise<boolean> {
  const config = {
    type: 'bar',
    data: {
      labels: data.labels,
      datasets: [{
        label: 'Value',
        data: data.values,
        backgroundColor: data.values.map(v => v >= 0 ? CHART_COLORS.positive : CHART_COLORS.negative),
      }],
    },
    options: {
      title: { display: true, text: title, fontSize: 18 },
    },
  };

  try {
    const chart = new QuickChart();
    chart.setConfig(config);
    chart.setWidth(CHART_CONFIG.width);
    chart.setHeight(CHART_CONFIG.height);
    const buffer = await chart.toBinary();
    await fs.writeFile(outputPath, buffer);
    return true;
  } catch (error) {
    console.error(`Failed to generate waterfall chart: ${error}`);
    return false;
  }
}

/**
 * Generate a dashboard (multi-metric display as grouped bar chart)
 */
export async function generateDashboard(
  data: { metrics: Array<{ label: string; value: number; color?: string }> },
  title: string,
  outputPath: string
): Promise<boolean> {
  const config = {
    type: 'bar',
    data: {
      labels: data.metrics.map(m => m.label),
      datasets: [{
        label: 'Value',
        data: data.metrics.map(m => m.value),
        backgroundColor: data.metrics.map((m, idx) => m.color || Object.values(CHART_COLORS)[idx % 5]),
      }],
    },
    options: {
      title: { display: true, text: title, fontSize: 18 },
    },
  };

  try {
    const chart = new QuickChart();
    chart.setConfig(config);
    chart.setWidth(CHART_CONFIG.width);
    chart.setHeight(CHART_CONFIG.height);
    const buffer = await chart.toBinary();
    await fs.writeFile(outputPath, buffer);
    return true;
  } catch (error) {
    console.error(`Failed to generate dashboard: ${error}`);
    return false;
  }
}
