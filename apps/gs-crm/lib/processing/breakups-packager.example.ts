/**
 * Breakups Packager - Usage Examples
 *
 * This file demonstrates how to use the breakups-packager.ts module
 * to create complete .zip packages for breakups analysis reports.
 */

import {
  packageBreakupsReport,
  type PackageInputs,
  type BreakupsAnalysisResult,
  type PackageResult,
  exportAnalysisToJSON,
  exportPropertiesToCSV,
  createSummaryStats,
  createReadmeFile,
} from './breakups-packager'
import * as path from 'path'

/**
 * Create v2 mock analysis results for examples
 */
function createMockAnalysisResults(overrides?: Partial<BreakupsAnalysisResult>): BreakupsAnalysisResult {
  return {
    // Category A: Property Characteristics
    brDistribution_Sale: { distribution: { '3': 45, '2': 20, '4': 30 }, average: 3.1, mostCommon: '3' },
    brDistribution_Lease: { distribution: { '2': 30, '3': 50, '1': 20 }, average: 2.2, mostCommon: '3' },
    hoaAnalysis: { withHOA: { count: 60, avgHOAFee: 250 }, withoutHOA: { count: 40 } },
    strAnalysis_Sale: { strEligible: { count: 15 }, nonSTR: { count: 85 }, premiumPercentage: 12 },
    strAnalysis_Lease: { strEligible: { count: 5 }, nonSTR: { count: 30 }, premiumPercentage: 8 },
    renovationImpact_Sale: { high: { count: 20 }, mid: { count: 40 }, low: { count: 40 } },
    renovationImpact_Lease: { high: { count: 8 }, mid: { count: 15 }, low: { count: 12 } },
    compsClassification: { propertyRadar: 25, standard: 75 },

    // Category B: Market Positioning
    sqftVariance_Sale: { within20: { count: 60 }, outside20: { count: 40 }, subjectSqft: 1200 },
    sqftVariance_Lease: { within20: { count: 25 }, outside20: { count: 10 }, subjectSqft: 1200 },
    priceVariance_Sale: { within20: 55, outside20: 45, estimatedValue: 350000 },
    priceVariance_Lease: { within20: 20, outside20: 15, estimatedRent: 2500 },
    leaseVsSale: { saleCount: 100, leaseCount: 35, avgSalePrice: 350000, avgMonthlyRent: 2500 },
    propertyRadarComps: { count: 25, avgPrice: 340000 },
    individualPRComps: { comparisons: [{ address: '123 Main', priceDiff: 5000 }] },

    // Category C: Time & Location
    brPrecision_Sale: { exact: { count: 40, avgPrice: 350000 }, within1: { count: 60, avgPrice: 340000 } },
    brPrecision_Lease: { exact: { count: 15, avgPrice: 2500 }, within1: { count: 25, avgPrice: 2400 } },
    timeFrames: { t12: { count: 30, avgPrice: 360000 }, t36: { count: 100, avgPrice: 340000 }, appreciation: 5.8 },
    directVsIndirect: { direct: { count: 40 }, indirect: { count: 60 }, reliabilityScore: 0.72 },
    recentDirectVsIndirect: { recentDirect: { count: 10 }, recentIndirect: { count: 20 } },

    // Category D: Market Activity
    activeVsClosed_Sale: { active: { count: 30 }, closed: { count: 70 }, absorptionRate: 0.7 },
    activeVsClosed_Lease: { active: { count: 10 }, closed: { count: 25 }, absorptionRate: 0.71 },
    activeVsPending_Sale: { active: { count: 30 }, pending: { count: 15 }, pendingRatio: 0.33 },
    activeVsPending_Lease: { active: { count: 10 }, pending: { count: 5 }, pendingRatio: 0.33 },

    // Category E: Financial Impact
    renovationDelta_Sale: { renovatedAvg: 310, notRenovatedAvg: 260, delta: 50, percentageIncrease: 19.2 },
    renovationDelta_Lease: { renovatedAvg: 2.8, notRenovatedAvg: 2.2, delta: 0.6, percentageIncrease: 27.3 },
    partialRenovationDelta_Sale: { partialAvg: 285, notRenovatedAvg: 260, delta: 25, percentageIncrease: 9.6 },
    partialRenovationDelta_Lease: { partialAvg: 2.5, notRenovatedAvg: 2.2, delta: 0.3, percentageIncrease: 13.6 },
    interquartileRanges_Sale: { q1: 300000, median: 350000, q3: 400000, iqr: 100000 },
    interquartileRanges_Lease: { q1: 2000, median: 2500, q3: 3000, iqr: 1000 },
    distributionTails_Sale: { lowerTail: 5, upperTail: 5 },
    distributionTails_Lease: { lowerTail: 2, upperTail: 2 },
    expectedNOI: { annualIncome: 30000, expenses: 10000, noi: 20000, capRate: 5.7 },
    improvedNOI: { currentNOI: 20000, improvedNOI: 26000, improvementCost: 35000, roi: 17.1, paybackYears: 5.8 },

    // Metadata
    metadata: { totalProperties: 100 },
    totalProperties: 100,
    analysisDate: new Date().toISOString(),
    clientName: 'Smith Family',
    ...overrides,
  }
}

/**
 * Example 1: Basic Usage
 * Creates a complete package with all required inputs
 */
export async function example1_BasicUsage(): Promise<void> {
  const enhancedExcel = Buffer.from('...excel binary data...')
  const analysisResults = createMockAnalysisResults()

  const chartPaths = [
    '/tmp/charts/analysis_01_br_distribution.png',
    '/tmp/charts/analysis_02_hoa_comparison.png',
    '/tmp/charts/analysis_03_garage_analysis.png',
    '/tmp/charts/analysis_04_pool_analysis.png',
    '/tmp/charts/analysis_05_architectural_style.png',
    '/tmp/charts/analysis_06_price_per_sqft.png',
    '/tmp/charts/analysis_07_price_range.png',
    '/tmp/charts/analysis_08_sqft_range.png',
    '/tmp/charts/analysis_09_lot_size.png',
    '/tmp/charts/analysis_10_year_built.png',
    '/tmp/charts/analysis_11_days_on_market.png',
    '/tmp/charts/analysis_12_listing_status.png',
    '/tmp/charts/analysis_13_geographic_dist.png',
    '/tmp/charts/analysis_14_proximity.png',
    '/tmp/charts/analysis_15_listing_volume.png',
    '/tmp/charts/analysis_16_seasonal_price.png',
    '/tmp/charts/analysis_17_hoa_impact.png',
    '/tmp/charts/analysis_18_garage_impact.png',
    '/tmp/charts/analysis_19_pool_impact.png',
    '/tmp/charts/analysis_20_sqft_impact.png',
    '/tmp/charts/analysis_21_age_impact.png',
    '/tmp/charts/analysis_22_improved_noi.png',
  ]

  const pdfPaths = [
    '/tmp/reports/Executive_Summary.pdf',
    '/tmp/reports/Property_Characteristics.pdf',
    '/tmp/reports/Market_Analysis.pdf',
    '/tmp/reports/Financial_Analysis.pdf',
    '/tmp/reports/Market_Activity.pdf',
  ]

  const properties = [
    {
      Address: '123 Main St',
      City: 'Scottsdale',
      Price: 425000,
      Bedrooms: 3,
      Bathrooms: 2.5,
      SQFT: 2200,
      LotSize: 8500,
      YearBuilt: 2015,
    },
  ]

  const packageInputs: PackageInputs = {
    fileId: 'abc123',
    clientName: 'Smith Family',
    enhancedExcel,
    analysisResults,
    chartPaths,
    pdfPaths,
    properties,
    outputDir: '/tmp/output',
  }

  const result: PackageResult = await packageBreakupsReport(packageInputs)

  if (result.success) {
    console.log('Package created successfully!')
    console.log('File:', result.fileName)
    console.log('Path:', result.zipPath)
    console.log('Size:', (result.zipSize / 1024 / 1024).toFixed(2), 'MB')
  } else {
    console.error('Package creation failed:', result.error)
  }
}

/**
 * Example 2: Individual Helper Functions
 */
export async function example2_IndividualHelpers(): Promise<void> {
  const analysisResults = createMockAnalysisResults({ clientName: 'Test Client' })

  const readmeContent = createReadmeFile(analysisResults)
  console.log('README preview:')
  console.log(readmeContent.substring(0, 500) + '...')

  await exportAnalysisToJSON(analysisResults, '/tmp/test_analysis.json')
  console.log('Exported analysis to JSON')

  const properties = [
    { Address: '123 Main', Price: 425000, Bedrooms: 3 },
    { Address: '456 Oak', Price: 550000, Bedrooms: 4 },
  ]
  await exportPropertiesToCSV(properties, '/tmp/test_properties.csv')
  console.log('Exported properties to CSV')

  const summary = createSummaryStats(analysisResults)
  console.log('Summary statistics:', JSON.stringify(summary, null, 2))
}

/**
 * Example 3: Error Handling
 */
export async function example3_ErrorHandling(): Promise<void> {
  try {
    const result = await packageBreakupsReport({
      fileId: 'test123',
      clientName: 'Test Client',
      enhancedExcel: Buffer.from(''),
      analysisResults: {} as BreakupsAnalysisResult,
      chartPaths: [],
      pdfPaths: [],
      properties: [],
      outputDir: '/tmp/output',
    })

    if (!result.success) {
      console.error('Packaging failed:', result.error)
    }
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

/**
 * Example 4: Integration with API Route
 */
export async function example4_APIRouteUsage(
  enhancedExcel: Buffer,
  analysisResults: BreakupsAnalysisResult,
  chartPaths: string[],
  pdfPaths: string[],
  properties: any[]
): Promise<Response> {
  const outputDir = path.join(process.cwd(), 'tmp', 'packages')

  const result = await packageBreakupsReport({
    fileId: `report_${Date.now()}`,
    clientName: analysisResults.clientName || 'Unknown',
    enhancedExcel,
    analysisResults,
    chartPaths,
    pdfPaths,
    properties,
    outputDir,
  })

  if (!result.success) {
    return new Response(
      JSON.stringify({ error: 'Failed to create package', details: result.error }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({
      success: true,
      downloadUrl: `/api/download/${result.fileName}`,
      fileName: result.fileName,
      size: result.zipSize,
      contents: result.contents,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
}

/**
 * Example 5: Complete Workflow
 */
export async function example5_CompleteWorkflow(): Promise<void> {
  console.log('Starting complete breakups analysis workflow...')

  const result = await packageBreakupsReport({
    fileId: 'workflow_test',
    clientName: 'Complete Workflow Test',
    enhancedExcel: Buffer.from('simulated data'),
    analysisResults: createMockAnalysisResults({ clientName: 'Complete Workflow Test' }),
    chartPaths: [],
    pdfPaths: [],
    properties: [],
    outputDir: '/tmp/complete_workflow',
  })

  if (result.success) {
    console.log('Complete workflow finished successfully!')
    console.log('Package:', result.zipPath)
  } else {
    console.error('Workflow failed:', result.error)
  }
}

/**
 * Example 6: Testing/Development Usage
 */
export async function example6_QuickTest(): Promise<void> {
  const testExcel = Buffer.from('Test Excel Data')
  const testAnalysis = createMockAnalysisResults({
    totalProperties: 50,
    clientName: 'Quick Test',
  })

  const result = await packageBreakupsReport({
    fileId: 'quick_test',
    clientName: 'Quick Test',
    enhancedExcel: testExcel,
    analysisResults: testAnalysis,
    chartPaths: [],
    pdfPaths: [],
    properties: [{ test: 'data' }],
    outputDir: '/tmp',
  })

  console.log('Test result:', result)
}

export const examples = {
  basicUsage: example1_BasicUsage,
  individualHelpers: example2_IndividualHelpers,
  errorHandling: example3_ErrorHandling,
  apiRouteUsage: example4_APIRouteUsage,
  completeWorkflow: example5_CompleteWorkflow,
  quickTest: example6_QuickTest,
}
