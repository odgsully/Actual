/**
 * Example usage of breakups-visualizer.ts
 *
 * This demonstrates how to use the visualization engine
 * with sample data from the breakups-generator
 */

import {
  generateAllVisualizations,
  generatePieChart,
  generateBarChart,
  generateLineChart,
  generateScatterPlot,
} from '../breakups-visualizer';
import { BreakupsAnalysisResult } from '@/lib/types/breakups-analysis';
import path from 'path';

/**
 * Example: Generate all 22 visualizations
 */
async function exampleGenerateAll() {
  // Sample analysis results (would come from breakups-generator.ts)
  const analysisResults: BreakupsAnalysisResult = {
    metadata: {
      fileId: 'example-file-123',
      timestamp: new Date(),
      propertyCount: 50,
    },
    analyses: {
      1: {
        distribution: { 2: 5, 3: 15, 4: 20, 5: 10 },
        mostCommon: 4,
        average: 3.7,
        chartType: 'pie',
      },
      2: {
        withHOA: { count: 30, avgPrice: 350000, avgHOAFee: 250 },
        withoutHOA: { count: 20, avgPrice: 320000 },
        priceDifferential: 30000,
        chartType: 'bar',
      },
      3: {
        strEligible: { count: 15, avgPrice: 400000, avgPricePerSqft: 200 },
        nonSTR: { count: 35, avgPrice: 330000, avgPricePerSqft: 165 },
        premiumPercentage: 21.2,
        chartType: 'pie',
      },
      4: {
        Y: { count: 10, avgPrice: 420000, avgPricePerSqft: 210 },
        N: { count: 30, avgPrice: 310000, avgPricePerSqft: 155 },
        '0.5': { count: 10, avgPrice: 365000, avgPricePerSqft: 182 },
        premiumYvsN: 35.5,
        premium05vsN: 17.7,
        chartType: 'bar',
      },
      5: {
        comps: {
          count: 25,
          characteristics: { avgBedrooms: 3.5, avgBathrooms: 2.5, avgSqft: 2000, avgYearBuilt: 2010 },
          priceRange: { min: 300000, max: 450000, median: 375000 },
        },
        nonComps: {
          count: 25,
          characteristics: { avgBedrooms: 3.2, avgBathrooms: 2.2, avgSqft: 1800, avgYearBuilt: 2005 },
          priceRange: { min: 250000, max: 400000, median: 325000 },
        },
        similarity: 0.75,
        chartType: 'scatter',
      },
      6: {
        subjectSqft: 2000,
        within20: { count: 35, avgPricePerSqft: 185, priceCorrelation: 0.85 },
        outside20: { count: 15, avgPricePerSqft: 170 },
        optimalRange: { min: 1600, max: 2400 },
        chartType: 'scatter',
      },
      7: {
        estimatedValue: 375000,
        within20: { count: 40, characteristics: {} as any, avgDaysOnMarket: 25 },
        outside20: { count: 10, underpriced: 3, overpriced: 7 },
        chartType: 'scatter',
      },
      8: {
        lease: { avgAnnualPerSqft: 18, capRate: 0.055 },
        sale: { avgPerSqft: 185 },
        rentToValueRatio: 0.097,
        chartType: 'bar',
      },
      9: {
        propertyRadar: { count: 12, uniqueProperties: 10, overlap: 8 },
        standard: { count: 15 },
        concordance: 0.67,
        chartType: 'bar',
      },
      10: {
        comparisons: [
          { compNumber: 1, property: {}, similarity: 0.85, priceDiff: 5000, sqftDiff: 50, adjustedValue: 375000 },
          { compNumber: 2, property: {}, similarity: 0.78, priceDiff: -3000, sqftDiff: -30, adjustedValue: 372000 },
          { compNumber: 3, property: {}, similarity: 0.92, priceDiff: 2000, sqftDiff: 20, adjustedValue: 377000 },
        ],
        avgSimilarity: 0.85,
        suggestedValue: 374667,
        chartType: 'bar',
      },
      11: {
        subjectBR: 3,
        exact: { count: 30, avgPrice: 360000, priceRange: { min: 320000, max: 420000, median: 360000 } },
        within1: { count: 45, avgPrice: 355000, priceRange: { min: 300000, max: 450000, median: 355000 } },
        precisionImpact: 5000,
        chartType: 'bar',
      },
      12: {
        t12: { count: 20, avgPrice: 375000, trend: 0.08 },
        t36: { count: 50, avgPrice: 330000, trend: 0.15 },
        appreciation: 13.6,
        chartType: 'line',
      },
      13: {
        direct: { count: 30, avgPrice: 370000, similarity: 0.88 },
        indirect: { count: 20, avgPrice: 350000, avgDistance: 1.2 },
        reliabilityScore: 0.6,
        chartType: 'bar',
      },
      14: {
        recentDirect: { count: 15, avgPrice: 380000, avgDaysOnMarket: 22 },
        recentIndirect: { count: 12, avgPrice: 365000, avgDaysOnMarket: 28 },
        marketVelocity: 0.85,
        chartType: 'line',
      },
      15: {
        active: { count: 25, avgListPrice: 385000, avgDaysOnMarket: 30 },
        closed: { count: 40, avgSalePrice: 365000, avgDaysToClose: 35 },
        absorptionRate: 0.615,
        listToSaleRatio: 0.948,
        chartType: 'bar',
      },
      16: {
        active: { count: 25, avgListPrice: 385000, avgDaysActive: 30 },
        pending: { count: 10, avgContractPrice: 375000, avgDaysToContract: 20 },
        pendingRatio: 0.286,
        marketMomentum: 0.75,
        chartType: 'bar',
      },
      17: {
        renovatedAvg: 210,
        notRenovatedAvg: 155,
        delta: 55,
        percentageIncrease: 35.5,
        roiEstimate: 0.85,
        chartType: 'waterfall',
      },
      18: {
        partialAvg: 182,
        notRenovatedAvg: 155,
        delta: 27,
        percentageIncrease: 17.4,
        costBenefit: 1.2,
        chartType: 'waterfall',
      },
      19: {
        price: { q25: 320000, median: 365000, q75: 410000, iqr: 90000 },
        pricePerSqft: { q25: 160, median: 185, q75: 205, iqr: 45 },
        outliers: [],
        chartType: 'boxplot',
      },
      20: {
        percentiles: { p5: 280000, p10: 300000, p50: 365000, p90: 450000, p95: 480000 },
        ranges: { middle80: 150000, middle90: 200000 },
        skewness: 0.3,
        kurtosis: 2.8,
        chartType: 'boxplot',
      },
      21: {
        monthlyRent: 2250,
        annualIncome: 27000,
        operatingExpenses: 9450,
        annualNOI: 17550,
        capRate: 0.047,
        cashOnCashReturn: 0.088,
        chartType: 'dashboard',
      },
      22: {
        currentNOI: 15300,
        improvedNOI: 18700,
        noiIncrease: 3400,
        improvementCost: 15000,
        paybackPeriod: 4.4,
        roi: 22.7,
        npv: 12500,
        chartType: 'dashboard',
      },
    },
  };

  // Generate all visualizations
  const outputDir = '/tmp/reportit/breakups/example-file-123/charts';
  const result = await generateAllVisualizations(analysisResults, outputDir);

  console.log('Visualization Generation Complete:');
  console.log(`Success: ${result.success}`);
  console.log(`Total Charts: ${result.totalCharts}`);
  console.log(`Successful: ${result.successfulCharts}`);
  console.log(`Failed: ${result.failedCharts}`);
  console.log(`Processing Time: ${result.processingTime}ms`);

  if (result.errors.length > 0) {
    console.log('\nErrors:');
    result.errors.forEach(err => console.log(`  - ${err}`));
  }

  console.log('\nGenerated Charts:');
  result.charts.forEach(chart => {
    if (chart.success) {
      console.log(`  ✓ Analysis ${chart.analysisNumber}: ${chart.filePath}`);
    } else {
      console.log(`  ✗ Analysis ${chart.analysisNumber}: ${chart.error}`);
    }
  });

  return result;
}

/**
 * Example: Generate a single pie chart
 */
async function examplePieChart() {
  const data = {
    labels: ['2 BR', '3 BR', '4 BR', '5 BR'],
    values: [5, 15, 20, 10],
  };

  const outputPath = '/tmp/example-pie-chart.png';
  const success = await generatePieChart(data, 'Bedroom Distribution', outputPath);

  console.log(`Pie chart generated: ${success ? 'Success' : 'Failed'}`);
  console.log(`Output: ${outputPath}`);
}

/**
 * Example: Generate a single bar chart
 */
async function exampleBarChart() {
  const data = {
    labels: ['With HOA', 'Without HOA'],
    datasets: [
      { label: 'Count', data: [30, 20] },
      { label: 'Avg Price', data: [350000, 320000] },
    ],
  };

  const outputPath = '/tmp/example-bar-chart.png';
  const success = await generateBarChart(data, 'HOA Comparison', outputPath);

  console.log(`Bar chart generated: ${success ? 'Success' : 'Failed'}`);
  console.log(`Output: ${outputPath}`);
}

/**
 * Example: Generate a line chart
 */
async function exampleLineChart() {
  const data = {
    labels: ['T-36', 'T-24', 'T-12', 'Now'],
    datasets: [
      { label: 'Average Price', data: [330000, 345000, 360000, 375000] },
    ],
  };

  const outputPath = '/tmp/example-line-chart.png';
  const success = await generateLineChart(data, 'Price Trend', outputPath);

  console.log(`Line chart generated: ${success ? 'Success' : 'Failed'}`);
  console.log(`Output: ${outputPath}`);
}

/**
 * Example: Generate a scatter plot
 */
async function exampleScatterPlot() {
  const data = {
    datasets: [
      {
        label: 'Comps',
        data: [
          { x: 350000, y: 2000 },
          { x: 375000, y: 2100 },
          { x: 400000, y: 2200 },
        ],
      },
      {
        label: 'Non-Comps',
        data: [
          { x: 300000, y: 1800 },
          { x: 325000, y: 1900 },
          { x: 350000, y: 2000 },
        ],
      },
    ],
  };

  const outputPath = '/tmp/example-scatter-plot.png';
  const success = await generateScatterPlot(
    data,
    'Comps Classification',
    outputPath,
    'Price ($)',
    'Square Feet'
  );

  console.log(`Scatter plot generated: ${success ? 'Success' : 'Failed'}`);
  console.log(`Output: ${outputPath}`);
}

// Export for testing
export {
  exampleGenerateAll,
  examplePieChart,
  exampleBarChart,
  exampleLineChart,
  exampleScatterPlot,
};
