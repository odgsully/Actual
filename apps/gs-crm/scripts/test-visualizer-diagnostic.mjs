/**
 * Comprehensive Visualizer Diagnostic Test
 * Tests chart generation with mock data and QuickChart API
 *
 * Run with: node test-visualizer-diagnostic.mjs
 */

import QuickChart from 'quickchart-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEST_OUTPUT_DIR = path.join(__dirname, 'tmp', 'test-charts');

async function testQuickChartAPI() {
  console.log('🧪 Testing QuickChart API Connection...\n');

  try {
    // Create a simple test chart
    const chart = new QuickChart();
    chart.setConfig({
      type: 'bar',
      data: {
        labels: ['Test 1', 'Test 2', 'Test 3'],
        datasets: [{
          label: 'Sample Data',
          data: [10, 20, 30],
          backgroundColor: '#1E40AF',
        }],
      },
      options: {
        title: {
          display: true,
          text: 'QuickChart API Test',
          fontSize: 18,
        },
      },
    });

    chart.setWidth(800);
    chart.setHeight(600);
    chart.setBackgroundColor('#FFFFFF');

    console.log('📡 Attempting to fetch chart from QuickChart API...');
    console.log(`   API URL: ${chart.getUrl()}\n`);

    // Try to get chart as binary
    const startTime = Date.now();
    const buffer = await chart.toBinary();
    const duration = Date.now() - startTime;

    console.log(`✅ QuickChart API responded in ${duration}ms`);
    console.log(`   Buffer size: ${(buffer.length / 1024).toFixed(2)} KB\n`);

    // Save test chart
    await fs.mkdir(TEST_OUTPUT_DIR, { recursive: true });
    const testFilePath = path.join(TEST_OUTPUT_DIR, 'api-test.png');
    await fs.writeFile(testFilePath, buffer);
    console.log(`💾 Test chart saved to: ${testFilePath}\n`);

    return { success: true, buffer, duration };
  } catch (error) {
    console.error('❌ QuickChart API Test Failed:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}\n`);
    return { success: false, error };
  }
}

async function testMockAnalysisData() {
  console.log('🧪 Testing Visualization with Mock Analysis Data...\n');

  try {
    // Import the visualizer
    const { generateAllVisualizations } = await import('../lib/processing/breakups-visualizer.ts');

    // Create mock analysis results
    const mockAnalysisResults = {
      metadata: {
        fileId: 'test_123',
        timestamp: new Date(),
        propertyCount: 50,
      },
      analyses: {
        1: {
          distribution: { 2: 10, 3: 25, 4: 12, 5: 3 },
          mostCommon: 3,
          average: 3.2,
          chartType: 'pie',
        },
        2: {
          withHOA: { count: 30, avgPrice: 450000, avgHOAFee: 150 },
          withoutHOA: { count: 20, avgPrice: 420000 },
          priceDifferential: 30000,
          chartType: 'bar',
        },
        3: {
          strEligible: { count: 15, avgPrice: 480000, avgPricePerSqft: 250 },
          nonSTR: { count: 35, avgPrice: 430000, avgPricePerSqft: 220 },
          premiumPercentage: 11.6,
          chartType: 'pie',
        },
        4: {
          Y: { count: 20, avgPrice: 460000, avgPricePerSqft: 240 },
          N: { count: 25, avgPrice: 420000, avgPricePerSqft: 210 },
          '0.5': { count: 5, avgPrice: 440000, avgPricePerSqft: 225 },
          premiumYvsN: 9.5,
          premium05vsN: 4.8,
          chartType: 'bar',
        },
        5: {
          comps: {
            count: 30,
            characteristics: { avgBedrooms: 3, avgBathrooms: 2, avgSqft: 1800, avgYearBuilt: 2005 },
            priceRange: { min: 380000, max: 520000, median: 445000 },
          },
          nonComps: {
            count: 20,
            characteristics: { avgBedrooms: 3.5, avgBathrooms: 2.5, avgSqft: 2200, avgYearBuilt: 2010 },
            priceRange: { min: 450000, max: 680000, median: 550000 },
          },
          similarity: 0.75,
          chartType: 'scatter',
        },
        6: {
          subjectSqft: 1850,
          within20: { count: 35, avgPricePerSqft: 235, priceCorrelation: 0.82 },
          outside20: { count: 15, avgPricePerSqft: 215 },
          optimalRange: { min: 1480, max: 2220 },
          chartType: 'scatter',
        },
        7: {
          estimatedValue: 445000,
          within20: {
            count: 38,
            characteristics: { avgBedrooms: 3, avgBathrooms: 2, avgSqft: 1850, avgYearBuilt: 2005 },
            avgDaysOnMarket: 32,
          },
          outside20: { count: 12, underpriced: 5, overpriced: 7 },
          chartType: 'scatter',
        },
        8: {
          lease: { avgAnnualPerSqft: 18, capRate: 0.055 },
          sale: { avgPerSqft: 240 },
          rentToValueRatio: 0.075,
          chartType: 'bar',
        },
        9: {
          propertyRadar: { count: 12, uniqueProperties: 10, overlap: 8 },
          standard: { count: 30 },
          concordance: 0.67,
          chartType: 'bar',
        },
        10: {
          comparisons: [
            { compNumber: 1, property: {}, similarity: 0.85, priceDiff: -15000, sqftDiff: 50, adjustedValue: 445000 },
            { compNumber: 2, property: {}, similarity: 0.78, priceDiff: 8000, sqftDiff: -30, adjustedValue: 442000 },
            { compNumber: 3, property: {}, similarity: 0.92, priceDiff: -2000, sqftDiff: 10, adjustedValue: 448000 },
          ],
          avgSimilarity: 0.85,
          suggestedValue: 445000,
          chartType: 'bar',
        },
        11: {
          subjectBR: 3,
          exact: { count: 32, avgPrice: 445000, priceRange: { min: 380000, max: 520000, median: 445000 } },
          within1: { count: 18, avgPrice: 438000, priceRange: { min: 350000, max: 550000, median: 438000 } },
          precisionImpact: 1.6,
          chartType: 'bar',
        },
        12: {
          t12: { count: 25, avgPrice: 455000, trend: 2.5 },
          t36: { count: 45, avgPrice: 425000, trend: 5.8 },
          appreciation: 7.1,
          chartType: 'line',
        },
        13: {
          direct: { count: 35, avgPrice: 448000, similarity: 0.88 },
          indirect: { count: 15, avgPrice: 442000, avgDistance: 1.2 },
          reliabilityScore: 0.85,
          chartType: 'bar',
        },
        14: {
          recentDirect: { count: 20, avgPrice: 458000, avgDaysOnMarket: 28 },
          recentIndirect: { count: 12, avgPrice: 450000, avgDaysOnMarket: 35 },
          marketVelocity: 1.78,
          chartType: 'line',
        },
        15: {
          active: { count: 18, avgListPrice: 465000, avgDaysOnMarket: 42 },
          closed: { count: 32, avgSalePrice: 445000, avgDaysToClose: 35 },
          absorptionRate: 0.64,
          listToSaleRatio: 0.957,
          chartType: 'bar',
        },
        16: {
          active: { count: 18, avgListPrice: 465000, avgDaysActive: 42 },
          pending: { count: 8, avgContractPrice: 455000, avgDaysToContract: 28 },
          pendingRatio: 0.31,
          marketMomentum: 1.22,
          chartType: 'bar',
        },
        17: {
          renovatedAvg: 255,
          notRenovatedAvg: 220,
          delta: 35,
          percentageIncrease: 15.9,
          roiEstimate: 2.5,
          chartType: 'waterfall',
        },
        18: {
          partialAvg: 235,
          notRenovatedAvg: 220,
          delta: 15,
          percentageIncrease: 6.8,
          costBenefit: 1.8,
          chartType: 'waterfall',
        },
        19: {
          price: { q25: 395000, median: 445000, q75: 485000, iqr: 90000 },
          pricePerSqft: { q25: 215, median: 240, q75: 265, iqr: 50 },
          outliers: [320000, 580000],
          chartType: 'boxplot',
        },
        20: {
          percentiles: { p5: 365000, p10: 385000, p50: 445000, p90: 505000, p95: 530000 },
          ranges: { middle80: 120000, middle90: 145000 },
          skewness: 0.15,
          kurtosis: -0.35,
          chartType: 'boxplot',
        },
        21: {
          monthlyRent: 2200,
          annualIncome: 26400,
          operatingExpenses: 6600,
          annualNOI: 19800,
          capRate: 0.0445,
          cashOnCashReturn: 0.052,
          chartType: 'dashboard',
        },
        22: {
          currentNOI: 19800,
          improvedNOI: 24000,
          noiIncrease: 4200,
          improvementCost: 15000,
          paybackPeriod: 3.57,
          roi: 28.0,
          npv: 28500,
          chartType: 'dashboard',
        },
      },
    };

    console.log('📊 Mock analysis data created with 22 analyses');
    console.log(`   Testing chart generation in: ${TEST_OUTPUT_DIR}\n`);

    // Generate visualizations
    const startTime = Date.now();
    const result = await generateAllVisualizations(mockAnalysisResults, TEST_OUTPUT_DIR);
    const duration = Date.now() - startTime;

    console.log(`\n⏱️  Total processing time: ${duration}ms (${(duration / 1000).toFixed(2)}s)\n`);

    // Report results
    console.log('📈 Visualization Results:');
    console.log(`   Total charts: ${result.totalCharts}`);
    console.log(`   Successful: ${result.successfulCharts} ✅`);
    console.log(`   Failed: ${result.failedCharts} ❌`);
    console.log(`   Output directory: ${result.outputDir}\n`);

    if (result.errors.length > 0) {
      console.log('⚠️  Errors encountered:');
      result.errors.forEach((error, idx) => {
        console.log(`   ${idx + 1}. ${error}`);
      });
      console.log('');
    }

    // List generated files
    console.log('📁 Generated Files:');
    const files = await fs.readdir(TEST_OUTPUT_DIR);
    for (const file of files) {
      const filePath = path.join(TEST_OUTPUT_DIR, file);
      const stats = await fs.stat(filePath);
      console.log(`   ${file} - ${(stats.size / 1024).toFixed(2)} KB`);
    }
    console.log('');

    // Verify each chart result
    console.log('🔍 Chart Details:');
    for (const chart of result.charts) {
      const status = chart.success ? '✅' : '❌';
      const sizeInfo = chart.success ? ` (${chart.width}x${chart.height})` : '';
      const errorInfo = chart.error ? ` - ${chart.error}` : '';
      console.log(`   ${status} Analysis ${chart.analysisNumber}: ${chart.analysisName}${sizeInfo}${errorInfo}`);
    }
    console.log('');

    return { success: result.success, result };
  } catch (error) {
    console.error('❌ Visualization Test Failed:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}\n`);
    return { success: false, error };
  }
}

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════\n');
  console.log('   BREAKUPS VISUALIZER DIAGNOSTIC TEST SUITE\n');
  console.log('═══════════════════════════════════════════════════════\n\n');

  // Test 1: QuickChart API
  const apiTest = await testQuickChartAPI();

  if (!apiTest.success) {
    console.log('⛔ Cannot proceed without QuickChart API access\n');
    console.log('Possible causes:');
    console.log('   1. Network connectivity issues');
    console.log('   2. QuickChart service is down');
    console.log('   3. Firewall blocking external API calls');
    console.log('   4. npm package quickchart-js misconfigured\n');
    process.exit(1);
  }

  console.log('───────────────────────────────────────────────────────\n');

  // Test 2: Full visualization pipeline
  const vizTest = await testMockAnalysisData();

  console.log('═══════════════════════════════════════════════════════\n');

  if (vizTest.success) {
    console.log('🎉 ALL TESTS PASSED!\n');
    console.log('The visualization system is working correctly.');
    console.log(`Check the generated charts at: ${TEST_OUTPUT_DIR}\n`);
    process.exit(0);
  } else {
    console.log('❌ TESTS FAILED\n');
    console.log('The visualization system has issues that need fixing.\n');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch((error) => {
  console.error('\n💥 FATAL ERROR:', error);
  process.exit(1);
});
