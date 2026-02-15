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
 * Example 1: Basic Usage
 * Creates a complete package with all required inputs
 */
export async function example1_BasicUsage(): Promise<void> {
  // Simulate enhanced Excel file (in real usage, this comes from Excel processing)
  const enhancedExcel = Buffer.from('...excel binary data...')

  // Simulate analysis results (in real usage, this comes from breakups analyzer)
  const analysisResults: BreakupsAnalysisResult = {
    // Property Characteristics
    bedroomDistribution: {
      summary: { mostCommon: '3 bedrooms', percentage: 45 },
      data: [
        { bedrooms: 2, count: 20, percentage: 20 },
        { bedrooms: 3, count: 45, percentage: 45 },
        { bedrooms: 4, count: 30, percentage: 30 },
        { bedrooms: 5, count: 5, percentage: 5 },
      ],
    },
    hoaComparison: {
      summary: { withHOA: 60, withoutHOA: 40 },
      data: { avgHOAFee: 250, medianHOAFee: 200 },
    },
    garageAnalysis: {
      summary: { avgSpaces: 2.3 },
      data: [
        { spaces: 0, count: 10 },
        { spaces: 1, count: 15 },
        { spaces: 2, count: 50 },
        { spaces: 3, count: 25 },
      ],
    },
    poolAnalysis: {
      summary: { withPool: 35, withoutPool: 65 },
      data: { avgPriceWithPool: 450000, avgPriceWithoutPool: 380000 },
    },
    architecturalStyle: {
      summary: { mostCommon: 'Contemporary' },
      data: [
        { style: 'Contemporary', count: 40 },
        { style: 'Ranch', count: 30 },
        { style: 'Mediterranean', count: 20 },
        { style: 'Other', count: 10 },
      ],
    },

    // Market Positioning
    pricePerSqftComparison: {
      summary: { average: 250, median: 240 },
      data: { min: 180, max: 350, stdDev: 35 },
    },
    priceRangeDistribution: {
      summary: { mostCommon: '$400k-$500k' },
      data: [
        { range: '$300k-$400k', count: 25 },
        { range: '$400k-$500k', count: 45 },
        { range: '$500k-$600k', count: 20 },
        { range: '$600k+', count: 10 },
      ],
    },
    sqftRangeDistribution: {
      summary: { average: 2200 },
      data: [
        { range: '1500-2000', count: 30 },
        { range: '2000-2500', count: 40 },
        { range: '2500-3000', count: 20 },
        { range: '3000+', count: 10 },
      ],
    },
    lotSizeAnalysis: {
      summary: { averageSqft: 8500 },
      data: { median: 7800, min: 5000, max: 20000 },
    },
    yearBuiltTrends: {
      summary: { averageAge: 15 },
      data: [
        { decade: '2020s', count: 10 },
        { decade: '2010s', count: 35 },
        { decade: '2000s', count: 30 },
        { decade: '1990s', count: 20 },
        { decade: 'Pre-1990', count: 5 },
      ],
    },

    // Time & Location
    daysOnMarketAnalysis: {
      summary: { average: 45, median: 38 },
      data: { min: 5, max: 180, stdDev: 25 },
    },
    listingStatusBreakdown: {
      summary: { active: 60, pending: 25, sold: 15 },
      data: [
        { status: 'Active', count: 60 },
        { status: 'Pending', count: 25 },
        { status: 'Sold', count: 15 },
      ],
    },
    geographicDistribution: {
      summary: { topCity: 'Scottsdale' },
      data: [
        { city: 'Scottsdale', count: 40 },
        { city: 'Phoenix', count: 30 },
        { city: 'Tempe', count: 20 },
        { city: 'Gilbert', count: 10 },
      ],
    },
    proximityToAmenities: {
      summary: { avgDistanceToSchool: 1.2 },
      data: { avgDistanceToShopping: 2.5, avgDistanceToPark: 0.8 },
    },

    // Market Activity
    listingVolumeByMonth: {
      summary: { peakMonth: 'June' },
      data: [
        { month: 'Jan', count: 8 },
        { month: 'Feb', count: 10 },
        { month: 'Mar', count: 12 },
        { month: 'Apr', count: 15 },
        { month: 'May', count: 18 },
        { month: 'Jun', count: 20 },
      ],
    },
    seasonalPriceVariation: {
      summary: { highestSeason: 'Spring', lowestSeason: 'Winter' },
      data: [
        { season: 'Spring', avgPrice: 425000 },
        { season: 'Summer', avgPrice: 415000 },
        { season: 'Fall', avgPrice: 410000 },
        { season: 'Winter', avgPrice: 395000 },
      ],
    },

    // Financial Impact
    hoaImpactOnPrice: {
      summary: { priceIncrease: 5000 },
      data: { withHOA: 420000, withoutHOA: 415000 },
    },
    garageImpactOnPrice: {
      summary: { pricePerSpace: 15000 },
      data: { correlation: 0.72 },
    },
    poolImpactOnPrice: {
      summary: { premiumPercentage: 8 },
      data: { avgPremium: 35000 },
    },
    sqftImpactOnPrice: {
      summary: { pricePerSqft: 250 },
      data: { correlation: 0.89 },
    },
    ageImpactOnPrice: {
      summary: { depreciationPerYear: 2500 },
      data: { correlation: -0.45 },
    },
    improvedNetOperatingIncome: {
      summary: { projectedIncrease: 12000 },
      data: { roi: 6.5, paybackYears: 8 },
    },

    // Metadata
    totalProperties: 100,
    analysisDate: new Date().toISOString(),
    clientName: 'Smith Family',
  }

  // Chart file paths (in real usage, these are generated by chart renderer)
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

  // PDF file paths (in real usage, these are generated by PDF generator)
  const pdfPaths = [
    '/tmp/reports/Executive_Summary.pdf',
    '/tmp/reports/Property_Characteristics.pdf',
    '/tmp/reports/Market_Analysis.pdf',
    '/tmp/reports/Financial_Analysis.pdf',
    '/tmp/reports/Market_Activity.pdf',
  ]

  // Property data (in real usage, this comes from Excel parser)
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
    // ... more properties
  ]

  // Create package
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
    console.log('✅ Package created successfully!')
    console.log('📦 File:', result.fileName)
    console.log('📍 Path:', result.zipPath)
    console.log('💾 Size:', (result.zipSize / 1024 / 1024).toFixed(2), 'MB')
    console.log('📊 Contents:')
    console.log('   - Excel:', result.contents.excel ? '✓' : '✗')
    console.log('   - Charts:', result.contents.charts, '/ 22')
    console.log('   - PDFs:', result.contents.pdfs, '/ 5')
    console.log('   - Data files:', result.contents.dataFiles, '/ 3')
  } else {
    console.error('❌ Package creation failed:', result.error)
  }
}

/**
 * Example 2: Individual Helper Functions
 * Demonstrates using individual export functions
 */
export async function example2_IndividualHelpers(): Promise<void> {
  const analysisResults: BreakupsAnalysisResult = {
    // ... (same as above)
    bedroomDistribution: {},
    hoaComparison: {},
    garageAnalysis: {},
    poolAnalysis: {},
    architecturalStyle: {},
    pricePerSqftComparison: {},
    priceRangeDistribution: {},
    sqftRangeDistribution: {},
    lotSizeAnalysis: {},
    yearBuiltTrends: {},
    daysOnMarketAnalysis: {},
    listingStatusBreakdown: {},
    geographicDistribution: {},
    proximityToAmenities: {},
    listingVolumeByMonth: {},
    seasonalPriceVariation: {},
    hoaImpactOnPrice: {},
    garageImpactOnPrice: {},
    poolImpactOnPrice: {},
    sqftImpactOnPrice: {},
    ageImpactOnPrice: {},
    improvedNetOperatingIncome: {},
    totalProperties: 100,
    analysisDate: new Date().toISOString(),
    clientName: 'Test Client',
  }

  // 1. Create README file
  const readmeContent = createReadmeFile(analysisResults)
  console.log('README preview:')
  console.log(readmeContent.substring(0, 500) + '...')

  // 2. Export analysis to JSON
  await exportAnalysisToJSON(analysisResults, '/tmp/test_analysis.json')
  console.log('✅ Exported analysis to JSON')

  // 3. Export properties to CSV
  const properties = [
    { Address: '123 Main', Price: 425000, Bedrooms: 3 },
    { Address: '456 Oak', Price: 550000, Bedrooms: 4 },
  ]
  await exportPropertiesToCSV(properties, '/tmp/test_properties.csv')
  console.log('✅ Exported properties to CSV')

  // 4. Create summary statistics
  const summary = createSummaryStats(analysisResults)
  console.log('📊 Summary statistics:', JSON.stringify(summary, null, 2))
}

/**
 * Example 3: Error Handling
 * Demonstrates proper error handling
 */
export async function example3_ErrorHandling(): Promise<void> {
  try {
    const result = await packageBreakupsReport({
      fileId: 'test123',
      clientName: 'Test Client',
      enhancedExcel: Buffer.from(''), // Empty buffer - will cause error
      analysisResults: {} as BreakupsAnalysisResult, // Invalid data
      chartPaths: [],
      pdfPaths: [],
      properties: [],
      outputDir: '/tmp/output',
    })

    if (!result.success) {
      console.error('❌ Packaging failed:', result.error)
      console.error('Contents:', result.contents)
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

/**
 * Example 4: Integration with API Route
 * Shows how to use in a Next.js API route
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
      JSON.stringify({
        error: 'Failed to create package',
        details: result.error,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  // Return download URL
  return new Response(
    JSON.stringify({
      success: true,
      downloadUrl: `/api/download/${result.fileName}`,
      fileName: result.fileName,
      size: result.zipSize,
      contents: result.contents,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}

/**
 * Example 5: Complete Workflow
 * Demonstrates full end-to-end workflow
 */
export async function example5_CompleteWorkflow(): Promise<void> {
  console.log('🚀 Starting complete breakups analysis workflow...')

  // Step 1: Parse uploaded Excel file
  console.log('📥 Step 1: Parsing Excel file...')
  // const excelData = await parseExcelFile(uploadedFile)

  // Step 2: Run breakups analysis
  console.log('📊 Step 2: Running analysis...')
  // const analysisResults = await runBreakupsAnalysis(excelData)

  // Step 3: Generate charts
  console.log('📈 Step 3: Generating charts...')
  // const chartPaths = await generateCharts(analysisResults)

  // Step 4: Generate PDFs
  console.log('📄 Step 4: Generating PDF reports...')
  // const pdfPaths = await generatePDFReports(analysisResults)

  // Step 5: Enhance Excel with analysis columns
  console.log('📝 Step 5: Enhancing Excel file...')
  // const enhancedExcel = await enhanceExcelWithAnalysis(excelData, analysisResults)

  // Step 6: Package everything into ZIP
  console.log('📦 Step 6: Creating ZIP package...')
  const result = await packageBreakupsReport({
    fileId: 'workflow_test',
    clientName: 'Complete Workflow Test',
    enhancedExcel: Buffer.from('simulated data'),
    analysisResults: {
      // ... all analysis results
    } as BreakupsAnalysisResult,
    chartPaths: [], // Generated chart paths
    pdfPaths: [], // Generated PDF paths
    properties: [], // Property data
    outputDir: '/tmp/complete_workflow',
  })

  // Step 7: Return result
  if (result.success) {
    console.log('✅ Complete workflow finished successfully!')
    console.log('📦 Package:', result.zipPath)
    console.log('💾 Size:', (result.zipSize / 1024 / 1024).toFixed(2), 'MB')
  } else {
    console.error('❌ Workflow failed:', result.error)
  }
}

/**
 * Example 6: Testing/Development Usage
 * Quick test with minimal setup
 */
export async function example6_QuickTest(): Promise<void> {
  // Create minimal test data
  const testExcel = Buffer.from('Test Excel Data')

  const testAnalysis: BreakupsAnalysisResult = {
    bedroomDistribution: { summary: 'test' },
    hoaComparison: { summary: 'test' },
    garageAnalysis: { summary: 'test' },
    poolAnalysis: { summary: 'test' },
    architecturalStyle: { summary: 'test' },
    pricePerSqftComparison: { summary: 'test' },
    priceRangeDistribution: { summary: 'test' },
    sqftRangeDistribution: { summary: 'test' },
    lotSizeAnalysis: { summary: 'test' },
    yearBuiltTrends: { summary: 'test' },
    daysOnMarketAnalysis: { summary: 'test' },
    listingStatusBreakdown: { summary: 'test' },
    geographicDistribution: { summary: 'test' },
    proximityToAmenities: { summary: 'test' },
    listingVolumeByMonth: { summary: 'test' },
    seasonalPriceVariation: { summary: 'test' },
    hoaImpactOnPrice: { summary: 'test' },
    garageImpactOnPrice: { summary: 'test' },
    poolImpactOnPrice: { summary: 'test' },
    sqftImpactOnPrice: { summary: 'test' },
    ageImpactOnPrice: { summary: 'test' },
    improvedNetOperatingIncome: { summary: 'test' },
    totalProperties: 50,
    analysisDate: new Date().toISOString(),
    clientName: 'Quick Test',
  }

  const result = await packageBreakupsReport({
    fileId: 'quick_test',
    clientName: 'Quick Test',
    enhancedExcel: testExcel,
    analysisResults: testAnalysis,
    chartPaths: [], // Empty - will show warnings but won't fail
    pdfPaths: [],
    properties: [{ test: 'data' }],
    outputDir: '/tmp',
  })

  console.log('Test result:', result)
}

// Export all examples for easy testing
export const examples = {
  basicUsage: example1_BasicUsage,
  individualHelpers: example2_IndividualHelpers,
  errorHandling: example3_ErrorHandling,
  apiRouteUsage: example4_APIRouteUsage,
  completeWorkflow: example5_CompleteWorkflow,
  quickTest: example6_QuickTest,
}
