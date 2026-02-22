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
 * Generate all 26 visualizations from analysis results (v2 with Sale/Lease split)
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

  console.log('[Visualizer] Starting chart generation (v2 - 26 charts)');
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

  // Access v2 analyses structure
  const analyses = analysisResults.analyses || analysisResults;

  // Generate each visualization (v2 - 26 analyses)
  const generators = [
    () => generateAnalysis1(analyses['1A'], outputDir, '1A', 'br_distribution_sale'),          // 1A: BR Distribution - Sale
    () => generateAnalysis1(analyses['1B'], outputDir, '1B', 'br_distribution_lease'),        // 1B: BR Distribution - Lease
    () => generateAnalysis2(analyses[2], outputDir, 2, 'hoa_vs_non_hoa'),                     // 2: HOA Analysis
    () => generateAnalysis3(analyses['3A'], outputDir, '3A', 'str_vs_non_str_sale'),          // 3A: STR - Sale
    () => generateAnalysis3(analyses['3B'], outputDir, '3B', 'str_vs_non_str_lease'),         // 3B: STR - Lease
    () => generateAnalysis4(analyses['4A'], outputDir, '4A', 'renovation_impact_sale'),       // 4A: Renovation Impact - Sale
    () => generateAnalysis4(analyses['4B'], outputDir, '4B', 'renovation_impact_lease'),      // 4B: Renovation Impact - Lease
    () => generateAnalysis5(analyses[5], outputDir, 5, 'comps_classification'),               // 5: Comps Classification
    () => generateAnalysis6(analyses['6A'], outputDir, '6A', 'sqft_variance_sale'),           // 6A: SQFT Variance - Sale
    () => generateAnalysis6(analyses['6B'], outputDir, '6B', 'sqft_variance_lease'),          // 6B: SQFT Variance - Lease
    () => generateAnalysis7(analyses['7A'], outputDir, '7A', 'price_variance_sale'),          // 7A: Price Variance - Sale
    () => generateAnalysis7(analyses['7B'], outputDir, '7B', 'price_variance_lease'),         // 7B: Price Variance - Lease
    () => generateAnalysis8(analyses[8], outputDir, 8, 'lease_vs_sale'),                      // 8: Lease vs Sale
    () => generateAnalysis9(analyses[9], outputDir, 9, 'property_radar_comps'),               // 9: PropertyRadar Comps
    () => generateAnalysis10(analyses[10], outputDir, 10, 'individual_pr_comps'),             // 10: Individual PR Comps
    () => generateAnalysis11(analyses['11A'], outputDir, '11A', 'br_precision_sale'),         // 11A: BR Precision - Sale
    () => generateAnalysis11(analyses['11B'], outputDir, '11B', 'br_precision_lease'),        // 11B: BR Precision - Lease
    () => generateAnalysis12(analyses[12], outputDir, 12, 'time_frame_analysis'),             // 12: Time Frame
    () => generateAnalysis13(analyses[13], outputDir, 13, 'direct_vs_indirect'),              // 13: Direct vs Indirect
    () => generateAnalysis14(analyses[14], outputDir, 14, 'recent_direct_vs_indirect'),       // 14: Recent Direct vs Indirect
    () => generateAnalysis15(analyses['15A'], outputDir, '15A', 'active_vs_closed_sale'),     // 15A: Active vs Closed - Sale
    () => generateAnalysis15(analyses['15B'], outputDir, '15B', 'active_vs_closed_lease'),    // 15B: Active vs Closed - Lease
    () => generateAnalysis16(analyses['16A'], outputDir, '16A', 'active_vs_pending_sale'),    // 16A: Active vs Pending - Sale
    () => generateAnalysis16(analyses['16B'], outputDir, '16B', 'active_vs_pending_lease'),   // 16B: Active vs Pending - Lease
    () => generateAnalysis17(analyses['17A'], outputDir, '17A', 'renovation_delta_sale'),     // 17A: Renovation Delta - Sale
    () => generateAnalysis17(analyses['17B'], outputDir, '17B', 'renovation_delta_lease'),    // 17B: Renovation Delta - Lease
    () => generateAnalysis18(analyses['18A'], outputDir, '18A', 'partial_renovation_delta_sale'), // 18A: Partial Renovation - Sale
    () => generateAnalysis18(analyses['18B'], outputDir, '18B', 'partial_renovation_delta_lease'), // 18B: Partial Renovation - Lease
    () => generateAnalysis19(analyses['19A'], outputDir, '19A', 'interquartile_range_sale'),  // 19A: IQR - Sale
    () => generateAnalysis19(analyses['19B'], outputDir, '19B', 'interquartile_range_lease'), // 19B: IQR - Lease
    () => generateAnalysis20(analyses['20A'], outputDir, '20A', 'distribution_tails_sale'),   // 20A: Distribution Tails - Sale
    () => generateAnalysis20(analyses['20B'], outputDir, '20B', 'distribution_tails_lease'),  // 20B: Distribution Tails - Lease
    () => generateAnalysis21(analyses[21], outputDir, 21, 'expected_noi'),                    // 21: Expected NOI
    () => generateAnalysis22(analyses[22], outputDir, 22, 'improved_noi'),                    // 22: Improved NOI
  ];

  for (let i = 0; i < generators.length; i++) {
    console.log(`[Visualizer] Generating chart ${i + 1}/26...`);
    try {
      const result = await generators[i]();
      charts.push(result);
      if (result.success) {
        console.log(`[Visualizer] ✅ Chart ${i + 1} generated: ${result.filePath}`);
      } else {
        console.error(`[Visualizer] ❌ Chart ${i + 1} failed: ${result.error}`);
      }
    } catch (error) {
      const errorMsg = `Chart ${i + 1} failed: ${error}`;
      console.error(`[Visualizer] ❌ Chart ${i + 1} threw error:`, error);
      errors.push(errorMsg);
      charts.push({
        analysisNumber: i + 1,
        analysisName: `chart_${i + 1}`,
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
async function generateAnalysis1(data: any, outputDir: string, analysisId: string | number, analysisName: string): Promise<SingleVisualizationResult> {
  if (!data || !data.distribution) {
    return {
      analysisNumber: typeof analysisId === 'string' ? 0 : analysisId,
      analysisName,
      chartType: 'pie',
      filePath: '',
      width: 0,
      height: 0,
      dpi: 0,
      success: false,
      error: 'No data available for BR Distribution analysis',
    };
  }

  const labels = Object.keys(data.distribution).map(br => `${br} BR`);
  const values = Object.values(data.distribution) as number[];

  const marketType = analysisName.includes('lease') ? 'Lease' : 'Sale';

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
        text: `Bedroom Distribution - ${marketType} Market`,
        fontSize: 18,
      },
      plugins: {
        datalabels: {
          formatter: (value: number, context: any) => {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
            return `${percentage}%`;
          },
          color: '#fff',
          font: { weight: 'bold', size: 14 },
        },
      },
    },
  };

  return await saveChart(config, analysisId, analysisName, outputDir);
}

/**
 * Analysis 2: HOA vs Non-HOA (Bar Chart)
 */
async function generateAnalysis2(data: any, outputDir: string, analysisId: string | number, analysisName: string): Promise<SingleVisualizationResult> {
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

  return await saveChart(config, analysisId, analysisName, outputDir);
}

/**
 * Analysis 3: STR vs Non-STR (Pie Chart)
 * Enhanced with count labels and premium highlighting
 */
async function generateAnalysis3(data: any, outputDir: string, analysisId: string | number, analysisName: string): Promise<SingleVisualizationResult> {
  const strCount = data?.strEligible?.count || 0;
  const nonSTRCount = data?.nonSTR?.count || 0;
  const premiumPct = data?.premiumPercentage || 0;
  const strAvgPrice = data?.strEligible?.avgPricePerSqft || data?.strEligible?.avgAnnualRent || 0;
  const nonSTRAvgPrice = data?.nonSTR?.avgPricePerSqft || data?.nonSTR?.avgAnnualRent || 0;

  const marketType = analysisName.includes('lease') ? 'Lease' : 'Sale';

  const config = {
    type: 'pie',
    data: {
      labels: [
        `STR Eligible ($${strAvgPrice.toFixed(0)}/sqft)`,
        `Non-STR ($${nonSTRAvgPrice.toFixed(0)}/sqft)`
      ],
      datasets: [{
        data: [strCount, nonSTRCount],
        backgroundColor: [
          premiumPct > 10 ? CHART_COLORS.positive : CHART_COLORS.primary,
          CHART_COLORS.neutral
        ],
      }],
    },
    options: {
      title: {
        display: true,
        text: `STR Eligibility Distribution - ${marketType} | Premium: ${premiumPct.toFixed(1)}% | ${strCount + nonSTRCount} Properties`,
        fontSize: 18,
        fontStyle: 'bold',
      },
      plugins: {
        datalabels: {
          formatter: (value: number, context: any) => {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
            return `${value}\n(${percentage}%)`;
          },
          color: '#fff',
          font: { weight: 'bold', size: 14 },
        },
      },
    },
  };

  return await saveChart(config, analysisId, analysisName, outputDir);
}

/**
 * Analysis 4: Renovation Impact (Bar Chart)
 * Enhanced with dual-axis, data labels, and premium display
 */
async function generateAnalysis4(data: any, outputDir: string, analysisId: string | number, analysisName: string): Promise<SingleVisualizationResult> {
  const high = data?.High || data?.Y || {};
  const mid = data?.Mid || data?.['0.5'] || {};
  const low = data?.Low || data?.N || {};
  const premiumHigh = data?.premiumHighvsLow ?? data?.premiumYvsN ?? 0;
  const premiumMid = data?.premiumMidvsLow ?? data?.premium05vsN ?? 0;

  const config = {
    type: 'bar',
    data: {
      labels: [
        `High (${high.count || 0}, avg ${(high.avgScore || 0).toFixed(1)}/10)`,
        `Mid (${mid.count || 0}, avg ${(mid.avgScore || 0).toFixed(1)}/10)`,
        `Low (${low.count || 0}, avg ${(low.avgScore || 0).toFixed(1)}/10)`
      ],
      datasets: [
        {
          label: 'Price per SqFt ($)',
          data: [
            high.avgPricePerSqft || 0,
            mid.avgPricePerSqft || 0,
            low.avgPricePerSqft || 0
          ],
          backgroundColor: [
            getThresholdColor(premiumHigh, 'roi'),
            CHART_COLORS.secondary,
            CHART_COLORS.neutral
          ],
          yAxisID: 'y',
        },
      ],
    },
    options: {
      title: {
        display: true,
        text: `Renovation Score Analysis | High Premium: ${premiumHigh.toFixed(1)}% | Mid Premium: ${premiumMid.toFixed(1)}%`,
        fontSize: 18,
        fontStyle: 'bold',
      },
      scales: {
        y: {
          type: 'linear',
          position: 'left',
          title: { display: true, text: 'Price per SqFt ($)', font: { size: 14, weight: 'bold' } },
          beginAtZero: true,
        },
      },
      plugins: {
        datalabels: getDataLabelsConfig('currency'),
      },
    },
  };

  return await saveChart(config, analysisId, analysisName, outputDir);
}

/**
 * Analysis 5: Comps Classification (Bar Chart)
 * Enhanced with data labels and detailed metrics
 */
async function generateAnalysis5(data: any, outputDir: string, analysisId: string | number, analysisName: string): Promise<SingleVisualizationResult> {
  const compsCount = data?.comps?.count || 0;
  const nonCompsCount = data?.nonComps?.count || 0;
  const compsAvg = data?.comps?.avgPrice || 0;
  const nonCompsAvg = data?.nonComps?.avgPrice || 0;
  const totalProps = compsCount + nonCompsCount;
  const compsPct = totalProps > 0 ? ((compsCount / totalProps) * 100).toFixed(1) : '0';

  const config = {
    type: 'bar',
    data: {
      labels: [
        `Direct Comps\n${compsCount} props (${compsPct}%)`,
        `Non-Comps\n${nonCompsCount} props`
      ],
      datasets: [
        {
          label: 'Average Price ($)',
          data: [compsAvg, nonCompsAvg],
          backgroundColor: [CHART_COLORS.positive, CHART_COLORS.neutral],
        },
      ],
    },
    options: {
      title: {
        display: true,
        text: `Comparable Properties Classification | ${totalProps} Total Properties`,
        fontSize: 18,
        fontStyle: 'bold',
      },
      scales: {
        y: {
          title: { display: true, text: 'Average Price ($)', font: { size: 14, weight: 'bold' } },
          beginAtZero: true,
        },
      },
      plugins: {
        datalabels: getDataLabelsConfig('currency'),
      },
    },
  };

  return await saveChart(config, analysisId, analysisName, outputDir);
}

/**
 * Analysis 6: Square Footage Variance (Scatter Plot)
 */
async function generateAnalysis6(data: any, outputDir: string, analysisId: string | number, analysisName: string): Promise<SingleVisualizationResult> {
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

  return await saveChart(config, analysisId, analysisName, outputDir);
}

/**
 * Analysis 7: Price Variance (Box Plot - approximated with bar)
 */
async function generateAnalysis7(data: any, outputDir: string, analysisId: string | number, analysisName: string): Promise<SingleVisualizationResult> {
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

  return await saveChart(config, analysisId, analysisName, outputDir);
}

/**
 * Analysis 8: Lease vs Sale (Bar Chart)
 * Enhanced with cap rate threshold coloring and data labels
 */
async function generateAnalysis8(data: any, outputDir: string, analysisId: string | number, analysisName: string): Promise<SingleVisualizationResult> {
  const leasePerSqft = data?.lease?.avgAnnualPerSqft || 0;
  const salePerSqft = data?.sale?.avgPerSqft || 0;
  const capRate = (data?.lease?.capRate || 0) * 100; // Convert to percentage
  const rentToValue = (data?.rentToValueRatio || 0) * 100; // Convert to percentage

  const config = {
    type: 'bar',
    data: {
      labels: ['Annual Lease $/SqFt', 'Sale Price $/SqFt'],
      datasets: [{
        label: 'Price per SqFt ($)',
        data: [leasePerSqft, salePerSqft],
        backgroundColor: [
          getThresholdColor(capRate, 'capRate'),
          CHART_COLORS.primary
        ],
      }],
    },
    options: {
      title: {
        display: true,
        text: `Lease vs Sale Analysis | Cap Rate: ${capRate.toFixed(2)}% | Rent-to-Value: ${rentToValue.toFixed(2)}%`,
        fontSize: 18,
        fontStyle: 'bold',
      },
      scales: {
        y: {
          title: { display: true, text: 'Price per SqFt ($)', font: { size: 14, weight: 'bold' } },
          beginAtZero: true,
        },
      },
      plugins: {
        datalabels: getDataLabelsConfig('currency'),
      },
    },
  };

  // Add 6% cap rate reference line (industry benchmark)
  if (capRate > 0) {
    addReferenceLine(config, leasePerSqft, '6% Cap Rate Benchmark', CHART_COLORS.secondary);
  }

  return await saveChart(config, analysisId, analysisName, outputDir);
}

/**
 * Analysis 9: PropertyRadar Comps (Bar Chart)
 * Enhanced with data labels and concordance display
 */
async function generateAnalysis9(data: any, outputDir: string, analysisId: string | number, analysisName: string): Promise<SingleVisualizationResult> {
  const prCount = data?.propertyRadar?.count || 0;
  const standardCount = data?.standard?.count || 0;
  const concordance = data?.concordance || 0;
  const totalComps = prCount + standardCount;

  const config = {
    type: 'bar',
    data: {
      labels: [
        `PropertyRadar\nSelected (${prCount})`,
        `Standard MLS\nComps (${standardCount})`
      ],
      datasets: [{
        label: 'Property Count',
        data: [prCount, standardCount],
        backgroundColor: [CHART_COLORS.primary, CHART_COLORS.secondary],
      }],
    },
    options: {
      title: {
        display: true,
        text: `PropertyRadar Comp Selection | ${totalComps} Total Comps | Concordance: ${concordance.toFixed(1)}%`,
        fontSize: 18,
        fontStyle: 'bold',
      },
      scales: {
        y: {
          title: { display: true, text: 'Number of Comps', font: { size: 14, weight: 'bold' } },
          beginAtZero: true,
        },
      },
      plugins: {
        datalabels: getDataLabelsConfig('number'),
      },
    },
  };

  return await saveChart(config, analysisId, analysisName, outputDir);
}

/**
 * Analysis 10: Individual PR Comps (Bar Chart)
 * Enhanced with color-coded price differences and data labels
 */
async function generateAnalysis10(data: any, outputDir: string, analysisId: string | number, analysisName: string): Promise<SingleVisualizationResult> {
  const comparisons = data?.comparisons || [];
  const labels = comparisons.map((c: any) => `Comp ${c.compNumber}`);
  const priceDiffs = comparisons.map((c: any) => c.priceDiff || 0);
  const avgSimilarity = data?.avgSimilarity || 0;
  const suggestedValue = data?.suggestedValue || 0;

  const config = {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Price Difference from Subject ($)',
        data: priceDiffs,
        backgroundColor: priceDiffs.map((d: number) =>
          d >= 0 ? CHART_COLORS.positive : CHART_COLORS.negative
        ),
      }],
    },
    options: {
      title: {
        display: true,
        text: `Individual PropertyRadar Comp Analysis | Avg Similarity: ${avgSimilarity.toFixed(1)}% | Suggested Value: $${suggestedValue.toLocaleString()}`,
        fontSize: 18,
        fontStyle: 'bold',
      },
      scales: {
        y: {
          title: { display: true, text: 'Price Difference ($)', font: { size: 14, weight: 'bold' } },
        },
      },
      plugins: {
        datalabels: getDataLabelsConfig('currency'),
      },
    },
  };

  // Add zero reference line
  addReferenceLine(config, 0, 'Subject Property Value', CHART_COLORS.neutral);

  return await saveChart(config, analysisId, analysisName, outputDir);
}

/**
 * Analysis 11: BR Precision (Bar Chart)
 * Enhanced with dual-axis display and data labels
 */
async function generateAnalysis11(data: any, outputDir: string, analysisId: string | number, analysisName: string): Promise<SingleVisualizationResult> {
  const exactCount = data?.exact?.count || 0;
  const within1Count = data?.within1?.count || 0;
  const exactPrice = data?.exact?.avgPrice || 0;
  const within1Price = data?.within1?.avgPrice || 0;
  const precisionImpact = data?.precisionImpact || 0;
  const totalComps = exactCount + within1Count;

  const config = {
    type: 'bar',
    data: {
      labels: [
        `Exact BR Match\n(${exactCount} props)`,
        `Within ±1 BR\n(${within1Count} props)`
      ],
      datasets: [
        {
          label: 'Average Price ($)',
          data: [exactPrice, within1Price],
          backgroundColor: [CHART_COLORS.positive, CHART_COLORS.secondary],
          yAxisID: 'y',
        },
      ],
    },
    options: {
      title: {
        display: true,
        text: `Bedroom Precision Impact | ${totalComps} Comps | Precision Impact: ${precisionImpact.toFixed(1)}%`,
        fontSize: 18,
        fontStyle: 'bold',
      },
      scales: {
        y: {
          type: 'linear',
          position: 'left',
          title: { display: true, text: 'Average Price ($)', font: { size: 14, weight: 'bold' } },
          beginAtZero: true,
        },
      },
      plugins: {
        datalabels: getDataLabelsConfig('currency'),
      },
    },
  };

  return await saveChart(config, analysisId, analysisName, outputDir);
}

/**
 * Analysis 12: Time Frame Analysis (Line Chart)
 */
async function generateAnalysis12(data: any, outputDir: string, analysisId: string | number, analysisName: string): Promise<SingleVisualizationResult> {
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

  return await saveChart(config, analysisId, analysisName, outputDir);
}

/**
 * Analysis 13: Direct vs Indirect (Bar Chart)
 */
async function generateAnalysis13(data: any, outputDir: string, analysisId: string | number, analysisName: string): Promise<SingleVisualizationResult> {
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

  return await saveChart(config, analysisId, analysisName, outputDir);
}

/**
 * Analysis 14: Recent Direct vs Indirect (Line Chart)
 */
async function generateAnalysis14(data: any, outputDir: string, analysisId: string | number, analysisName: string): Promise<SingleVisualizationResult> {
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

  return await saveChart(config, analysisId, analysisName, outputDir);
}

/**
 * Analysis 15: Active vs Closed (Bar Chart)
 */
async function generateAnalysis15(data: any, outputDir: string, analysisId: string | number, analysisName: string): Promise<SingleVisualizationResult> {
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

  return await saveChart(config, analysisId, analysisName, outputDir);
}

/**
 * Analysis 16: Active vs Pending (Bar Chart)
 * Enhanced with market momentum coloring and data labels
 */
async function generateAnalysis16(data: any, outputDir: string, analysisId: string | number, analysisName: string): Promise<SingleVisualizationResult> {
  const activeCount = data?.active?.count || 0;
  const pendingCount = data?.pending?.count || 0;
  const pendingRatio = (data?.pendingRatio || 0) * 100;
  const marketMomentum = data?.marketMomentum || 0;

  const config = {
    type: 'bar',
    data: {
      labels: [
        `Active Listings\n(${activeCount} props)`,
        `Pending Sales\n(${pendingCount} props)`
      ],
      datasets: [{
        label: 'Property Count',
        data: [activeCount, pendingCount],
        backgroundColor: [
          CHART_COLORS.primary,
          pendingRatio > 30 ? CHART_COLORS.positive : CHART_COLORS.secondary
        ],
      }],
    },
    options: {
      title: {
        display: true,
        text: `Market Pipeline Analysis | Pending Ratio: ${pendingRatio.toFixed(1)}% | Momentum: ${marketMomentum.toFixed(1)}`,
        fontSize: 18,
        fontStyle: 'bold',
      },
      scales: {
        y: {
          title: { display: true, text: 'Number of Properties', font: { size: 14, weight: 'bold' } },
          beginAtZero: true,
        },
      },
      plugins: {
        datalabels: getDataLabelsConfig('number'),
      },
    },
  };

  return await saveChart(config, analysisId, analysisName, outputDir);
}

/**
 * Analysis 17: Renovation Delta (Waterfall - approximated with bar)
 */
async function generateAnalysis17(data: any, outputDir: string, analysisId: string | number, analysisName: string): Promise<SingleVisualizationResult> {
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

  return await saveChart(config, analysisId, analysisName, outputDir);
}

/**
 * Analysis 18: Partial Renovation Delta (Waterfall - approximated with bar)
 */
async function generateAnalysis18(data: any, outputDir: string, analysisId: string | number, analysisName: string): Promise<SingleVisualizationResult> {
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

  return await saveChart(config, analysisId, analysisName, outputDir);
}

/**
 * Analysis 19: Interquartile Range (True Box Plot)
 * Enhanced with proper box-and-whisker visualization
 */
async function generateAnalysis19(data: any, outputDir: string, analysisId: string | number, analysisName: string): Promise<SingleVisualizationResult> {
  const priceIQR = data?.price?.iqr || 0;
  const priceSqftIQR = data?.pricePerSqft?.iqr || 0;
  const outliers = data?.outliers || [];

  // QuickChart supports Chart.js boxplot plugin
  const config = {
    type: 'boxplot',
    data: {
      labels: ['Total Price ($)', 'Price per SqFt ($/sqft)'],
      datasets: [{
        label: 'Distribution',
        backgroundColor: CHART_COLORS.primary + '60',
        borderColor: CHART_COLORS.primary,
        borderWidth: 2,
        outlierColor: CHART_COLORS.negative,
        padding: 10,
        itemRadius: 3,
        data: [
          {
            min: data.price.q25 - (priceIQR * 1.5),
            q1: data.price.q25,
            median: data.price.median,
            q3: data.price.q75,
            max: data.price.q75 + (priceIQR * 1.5),
          },
          {
            min: data.pricePerSqft.q25 - (priceSqftIQR * 1.5),
            q1: data.pricePerSqft.q25,
            median: data.pricePerSqft.median,
            q3: data.pricePerSqft.q75,
            max: data.pricePerSqft.q75 + (priceSqftIQR * 1.5),
          },
        ],
      }],
    },
    options: {
      title: {
        display: true,
        text: `Interquartile Range (IQR) Analysis | Price IQR: $${priceIQR.toLocaleString()} | $/SqFt IQR: $${priceSqftIQR.toFixed(0)} | Outliers: ${outliers.length}`,
        fontSize: 18,
        fontStyle: 'bold',
      },
      scales: {
        y: {
          title: { display: true, text: 'Value Distribution', font: { size: 14, weight: 'bold' } },
          beginAtZero: false,
        },
      },
      plugins: {
        legend: {
          display: true,
        },
      },
    },
  };

  return await saveChart(config, analysisId, analysisName, outputDir);
}

/**
 * Analysis 20: Distribution Tails (Box Plot - approximated with bar)
 */
async function generateAnalysis20(data: any, outputDir: string, analysisId: string | number, analysisName: string): Promise<SingleVisualizationResult> {
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

  return await saveChart(config, analysisId, analysisName, outputDir);
}

/**
 * Analysis 21: Expected NOI (Waterfall Chart)
 * Enhanced with waterfall-style progression and cap rate thresholds
 */
async function generateAnalysis21(data: any, outputDir: string, analysisId: string | number, analysisName: string): Promise<SingleVisualizationResult> {
  const monthlyRent = data?.monthlyRent || 0;
  const annualIncome = data?.annualIncome || 0;
  const operatingExpenses = data?.operatingExpenses || 0;
  const annualNOI = data?.annualNOI || 0;
  const capRate = (data?.capRate || 0) * 100; // Convert to percentage
  const cashOnCash = data?.cashOnCashReturn || 0;

  // Waterfall values: start, additions, subtractions, end
  const config = {
    type: 'bar',
    data: {
      labels: ['Annual Income', 'Operating Expenses', 'Annual NOI'],
      datasets: [{
        label: 'Cash Flow ($)',
        data: [annualIncome, -operatingExpenses, annualNOI],
        backgroundColor: [
          CHART_COLORS.positive,
          CHART_COLORS.negative,
          getThresholdColor(capRate, 'capRate'),
        ],
      }],
    },
    options: {
      title: {
        display: true,
        text: `Expected NOI Waterfall | Cap Rate: ${capRate.toFixed(2)}% | Monthly Rent: $${monthlyRent.toLocaleString()}${data?.renoScore ? ` | Reno: ${data.renoScore}/10 (${data.renoRecency})` : ''}`,
        fontSize: 18,
        fontStyle: 'bold',
      },
      scales: {
        y: {
          title: { display: true, text: 'Annual Amount ($)', font: { size: 14, weight: 'bold' } },
        },
      },
      plugins: {
        datalabels: {
          display: true,
          formatter: (value: number) => {
            return `$${Math.abs(value).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
          },
          color: '#1F2937',
          font: { weight: 'bold', size: 12 },
        },
      },
    },
  };

  // Add reference line for 6% cap rate benchmark
  addReferenceLine(config, annualNOI, '6% Cap Rate Benchmark', CHART_COLORS.secondary);

  return await saveChart(config, analysisId, analysisName, outputDir);
}

/**
 * Analysis 22: Improved NOI (Waterfall Chart)
 * Enhanced with ROI progression and threshold-based coloring
 */
async function generateAnalysis22(data: any, outputDir: string, analysisId: string | number, analysisName: string): Promise<SingleVisualizationResult> {
  const currentNOI = data?.currentNOI || 0;
  const improvedNOI = data?.improvedNOI || 0;
  const noiIncrease = data?.noiIncrease || 0;
  const improvementCost = data?.improvementCost || 0;
  const paybackPeriod = data?.paybackPeriod || 0;
  const roi = data?.roi || 0;
  const npv = data?.npv || 0;

  // Waterfall: Current NOI → -Improvement Cost → +NOI Increase → Improved NOI
  const config = {
    type: 'bar',
    data: {
      labels: ['Current NOI', 'Improvement Cost', 'NOI Increase', 'Improved NOI'],
      datasets: [{
        label: 'Cash Flow ($)',
        data: [currentNOI, -improvementCost, noiIncrease, improvedNOI],
        backgroundColor: [
          CHART_COLORS.neutral,
          CHART_COLORS.negative,
          CHART_COLORS.secondary,
          getThresholdColor(roi, 'roi'),
        ],
      }],
    },
    options: {
      title: {
        display: true,
        text: `Renovation ROI Waterfall | Payback: ${paybackPeriod.toFixed(1)} yrs | ROI: ${roi.toFixed(1)}%${data?.currentScore ? ` | Score: ${data.currentScore}→${data.improvedScore}/10` : ''} | Cost: $${improvementCost.toLocaleString()}`,
        fontSize: 18,
        fontStyle: 'bold',
      },
      scales: {
        y: {
          title: { display: true, text: 'Annual Amount ($)', font: { size: 14, weight: 'bold' } },
        },
      },
      plugins: {
        datalabels: {
          display: true,
          formatter: (value: number) => {
            return `$${Math.abs(value).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
          },
          color: '#1F2937',
          font: { weight: 'bold', size: 12 },
        },
      },
    },
  };

  // Add reference line for break-even
  addReferenceLine(config, currentNOI, 'Break-Even Point', CHART_COLORS.secondary);

  return await saveChart(config, analysisId, analysisName, outputDir);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Universal data labels configuration for bar and line charts
 */
function getDataLabelsConfig(formatType: 'currency' | 'number' | 'percentage' = 'number') {
  return {
    display: true,
    anchor: 'end' as const,
    align: 'top' as const,
    formatter: (value: number) => {
      if (formatType === 'currency') {
        return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
      } else if (formatType === 'percentage') {
        return `${value.toFixed(1)}%`;
      } else {
        return value.toLocaleString('en-US', { maximumFractionDigits: 1 });
      }
    },
    color: '#1F2937',
    font: { weight: 'bold' as const, size: 12 },
  };
}

/**
 * Get color based on threshold ranges
 */
function getThresholdColor(value: number, metric: 'capRate' | 'absorption' | 'roi' | 'variance'): string {
  switch (metric) {
    case 'capRate':
      // Cap Rate: Red <4%, Amber 4-6%, Green >6%
      if (value < 4) return CHART_COLORS.negative;
      if (value < 6) return CHART_COLORS.secondary;
      return CHART_COLORS.positive;

    case 'absorption':
      // Absorption Rate: Red <20%, Amber 20-40%, Green >40%
      if (value < 20) return CHART_COLORS.negative;
      if (value < 40) return CHART_COLORS.secondary;
      return CHART_COLORS.positive;

    case 'roi':
      // ROI: Red <5%, Amber 5-15%, Green >15%
      if (value < 5) return CHART_COLORS.negative;
      if (value < 15) return CHART_COLORS.secondary;
      return CHART_COLORS.positive;

    case 'variance':
      // Within range is green, outside is red
      return value <= 20 ? CHART_COLORS.positive : CHART_COLORS.negative;

    default:
      return CHART_COLORS.primary;
  }
}

/**
 * Add reference line annotation to chart config
 */
function addReferenceLine(config: any, yValue: number, label: string, color: string = '#9CA3AF') {
  if (!config.options) config.options = {};
  if (!config.options.plugins) config.options.plugins = {};
  if (!config.options.plugins.annotation) config.options.plugins.annotation = { annotations: [] };

  config.options.plugins.annotation.annotations.push({
    type: 'line',
    yMin: yValue,
    yMax: yValue,
    borderColor: color,
    borderWidth: 2,
    borderDash: [5, 5],
    label: {
      content: label,
      enabled: true,
      position: 'end',
      backgroundColor: color,
      color: '#fff',
      font: { size: 11, weight: 'bold' }
    }
  });
}

/**
 * Save chart configuration as PNG file
 */
async function saveChart(
  config: any,
  analysisId: string | number,
  analysisName: string,
  outputDir: string
): Promise<SingleVisualizationResult> {
  // Convert analysisId to a number for display (e.g., "1A" -> 1, "11B" -> 11, 5 -> 5)
  const analysisNumber = typeof analysisId === 'string' ? parseInt(analysisId.replace(/[AB]/, ''), 10) : analysisId;

  // Generate filename (e.g., analysis_1A_br_distribution_sale.png or analysis_5_comps_classification.png)
  const idStr = analysisId.toString().toLowerCase();
  const fileName = `analysis_${idStr}_${analysisName}.png`;
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
