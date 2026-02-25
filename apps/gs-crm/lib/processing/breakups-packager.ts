/**
 * Breakups Report Packager
 *
 * Packages all breakups analysis outputs into a single downloadable .zip file:
 * - 1 Enhanced Excel file (with analysis data)
 * - 22 PNG chart images
 * - 5 PDF reports
 * - Raw data files (CSV/JSON)
 *
 * @module lib/processing/breakups-packager
 */

import * as fs from 'fs'
import * as path from 'path'
import archiver from 'archiver'
import { promisify } from 'util'

const LOG_PREFIX = '[Breakups Packager]'

// Promisify file system operations
const mkdir = promisify(fs.mkdir)
const writeFile = promisify(fs.writeFile)
const unlink = promisify(fs.unlink)
const rm = promisify(fs.rm)
const stat = promisify(fs.stat)

/**
 * Breakups Analysis Result Interface
 * Represents the complete analysis data for a property dataset
 */
export interface BreakupsAnalysisResult {
  // Category A: Property Characteristics
  brDistribution_Sale: any
  brDistribution_Lease: any
  hoaAnalysis: any
  strAnalysis_Sale: any
  strAnalysis_Lease: any
  renovationImpact_Sale: any
  renovationImpact_Lease: any
  compsClassification: any

  // Category B: Market Positioning
  sqftVariance_Sale: any
  sqftVariance_Lease: any
  priceVariance_Sale: any
  priceVariance_Lease: any
  leaseVsSale: any
  propertyRadarComps: any
  individualPRComps: any

  // Category C: Time & Location
  brPrecision_Sale: any
  brPrecision_Lease: any
  timeFrames: any
  directVsIndirect: any
  recentDirectVsIndirect: any

  // Category D: Market Activity
  activeVsClosed_Sale: any
  activeVsClosed_Lease: any
  activeVsPending_Sale: any
  activeVsPending_Lease: any

  // Category E: Financial Impact
  renovationDelta_Sale: any
  renovationDelta_Lease: any
  partialRenovationDelta_Sale: any
  partialRenovationDelta_Lease: any
  interquartileRanges_Sale: any
  interquartileRanges_Lease: any
  distributionTails_Sale: any
  distributionTails_Lease: any
  expectedNOI: any
  improvedNOI: any

  // Metadata
  metadata?: { totalProperties: number }
  totalProperties?: number
  analysisDate?: string
  clientName?: string
}

/**
 * Package Inputs Interface
 * All required inputs to create the complete package
 */
export interface PackageInputs {
  fileId: string
  clientName: string
  enhancedExcel: Buffer
  analysisResults: BreakupsAnalysisResult
  chartPaths: string[] // Paths to 22 PNG files
  pdfPaths: string[] // Paths to 5 PDF files
  propertyRadarPath?: string // Path to PropertyRadar Excel export (optional)
  properties: any[] // Property data for CSV export
  outputDir: string
}

/**
 * Package Result Interface
 * Result of the packaging operation
 */
export interface PackageResult {
  success: boolean
  zipPath: string
  zipSize: number
  fileName: string
  contents: {
    excel: boolean
    charts: number
    pdfs: number
    propertyRadar: boolean
    dataFiles: number
  }
  error?: string
}

/**
 * Chart Configuration
 * Defines expected chart files and their display names
 */
const CHART_CONFIGS = [
  { id: '01', name: 'analysis_01_br_distribution.png', title: 'Bedroom Distribution' },
  { id: '02', name: 'analysis_02_hoa_comparison.png', title: 'HOA Comparison' },
  { id: '03', name: 'analysis_03_garage_analysis.png', title: 'Garage Analysis' },
  { id: '04', name: 'analysis_04_pool_analysis.png', title: 'Pool Analysis' },
  { id: '05', name: 'analysis_05_architectural_style.png', title: 'Architectural Style' },
  { id: '06', name: 'analysis_06_price_per_sqft.png', title: 'Price per Sqft Comparison' },
  { id: '07', name: 'analysis_07_price_range.png', title: 'Price Range Distribution' },
  { id: '08', name: 'analysis_08_sqft_range.png', title: 'Sqft Range Distribution' },
  { id: '09', name: 'analysis_09_lot_size.png', title: 'Lot Size Analysis' },
  { id: '10', name: 'analysis_10_year_built.png', title: 'Year Built Trends' },
  { id: '11', name: 'analysis_11_days_on_market.png', title: 'Days on Market' },
  { id: '12', name: 'analysis_12_listing_status.png', title: 'Listing Status' },
  { id: '13', name: 'analysis_13_geographic_dist.png', title: 'Geographic Distribution' },
  { id: '14', name: 'analysis_14_proximity.png', title: 'Proximity to Amenities' },
  { id: '15', name: 'analysis_15_listing_volume.png', title: 'Listing Volume by Month' },
  { id: '16', name: 'analysis_16_seasonal_price.png', title: 'Seasonal Price Variation' },
  { id: '17', name: 'analysis_17_hoa_impact.png', title: 'HOA Impact on Price' },
  { id: '18', name: 'analysis_18_garage_impact.png', title: 'Garage Impact on Price' },
  { id: '19', name: 'analysis_19_pool_impact.png', title: 'Pool Impact on Price' },
  { id: '20', name: 'analysis_20_sqft_impact.png', title: 'Sqft Impact on Price' },
  { id: '21', name: 'analysis_21_age_impact.png', title: 'Age Impact on Price' },
  { id: '22', name: 'analysis_22_improved_noi.png', title: 'Improved Net Operating Income' },
]

/**
 * PDF Report Configuration
 * Single unified professional PDF report
 */
const PDF_CONFIGS = [
  { pattern: /CRM_Analysis_.*\.pdf/, title: 'Comprehensive Property Analysis Report' },
]

/**
 * Create README.txt file content
 * Provides user instructions for the package contents
 */
export function createReadmeFile(analysisResults: BreakupsAnalysisResult): string {
  const timestamp = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })

  return `BREAKUPS ANALYSIS REPORT
Generated: ${timestamp}
Client: ${analysisResults.clientName || 'N/A'}
Total Properties Analyzed: ${analysisResults.metadata?.totalProperties || analysisResults.totalProperties || 0}

================================================================================
CONTENTS
================================================================================

1. Breakups_Analysis_Complete.xlsx
   Enhanced Excel file with all property data and 26 analysis columns
   - Complete property listings with sale and lease splits
   - Market analysis data
   - Financial metrics
   - Computed statistics and Analysis_Summary sheet

2. PropertyRadar Export (PropertyRadar_*.xlsx)
   Ready-to-use PropertyRadar import template
   - 12 Property Radar comp columns pre-formatted
   - Populate PROPERTY_RADAR-COMP-Y-N column in Analysis sheet before upload
   - Can be uploaded directly to PropertyRadar platform

3. charts/ (26 Visualization Charts)
   High-quality PNG images for presentations

   Property Characteristics (8):
   - 1A/1B: Bedroom Distribution (Sale/Lease)
   - 2: HOA Analysis
   - 3A/3B: STR Eligibility (Sale/Lease)
   - 4A/4B: Renovation Impact (Sale/Lease)
   - 5: Comps Classification

   Market Positioning (7):
   - 6A/6B: Square Footage Variance (Sale/Lease)
   - 7A/7B: Price Variance (Sale/Lease)
   - 8: Lease vs Sale Comparison
   - 9: PropertyRadar Comps
   - 10: Individual PR Comps

   Time & Location (5):
   - 11A/11B: Bedroom Precision (Sale/Lease)
   - 12: Time Frame Analysis
   - 13: Direct vs Indirect Comps
   - 14: Recent Direct vs Indirect

   Market Activity (4):
   - 15A/15B: Active vs Closed (Sale/Lease)
   - 16A/16B: Active vs Pending (Sale/Lease)

   Financial Impact (10):
   - 17A/17B: Renovation Delta (Sale/Lease)
   - 18A/18B: Partial Renovation Delta (Sale/Lease)
   - 19A/19B: Interquartile Ranges (Sale/Lease)
   - 20A/20B: Distribution Tails (Sale/Lease)
   - 21: Expected NOI
   - 22: Improved NOI

4. reports/ (Professional PDF Report)
   - GSRealty_Analysis_[Address]_[Date].pdf - Comprehensive analysis report with:
     * Professional cover page with branding
     * Hyperlinked table of contents
     * Executive summary
     * All 26 analyses with embedded charts
     * Category-organized sections

5. data/ (Raw Data Exports)
   - analysis_results.json - Complete analysis data in JSON format
   - property_data.csv - Property data in CSV format for custom analysis
   - summary_statistics.json - Key metrics and statistics summary

================================================================================
QUICK START GUIDE
================================================================================

1. REVIEW ANALYSIS REPORT
   Open: reports/GSRealty_Analysis_[Address]_[Date].pdf
   Comprehensive report with executive summary, all 26 analyses, and embedded charts

2. EXPLORE COMPLETE DATA
   Open: Breakups_Analysis_Complete.xlsx
   View all properties with complete analysis columns

3. VIEW VISUALIZATIONS
   Browse: charts/ folder
   Use in presentations, reports, or client communications

4. DEEP DIVE ANALYSIS
   Open the PDF report in reports/ folder
   Contains all 26 analyses organized by category with embedded charts

5. CUSTOM ANALYSIS
   Use data/property_data.csv for custom spreadsheet work
   Use data/analysis_results.json for programmatic analysis

================================================================================
ANALYSIS CATEGORIES
================================================================================

Property Characteristics
- Understand property features distribution
- Compare HOA vs non-HOA properties
- Analyze garage and pool prevalence
- Review architectural style trends

Market Positioning
- Price per square foot benchmarks
- Price and size distribution analysis
- Lot size trends
- Age of inventory analysis

Time & Location
- Time on market insights
- Listing status patterns
- Geographic concentration
- Proximity to key amenities

Market Activity
- Monthly listing volume trends
- Seasonal pricing patterns
- Market momentum indicators

Financial Impact
- Feature impact on pricing
- ROI calculations
- Net operating income projections
- Investment opportunity identification

================================================================================
SUPPORT & QUESTIONS
================================================================================

For questions or support regarding this analysis:
- Email: support@sullivanrealty.com
- Phone: (555) 123-4567

For technical issues with files:
- Ensure Excel 2016 or later (or compatible software)
- PDF Reader required for reports
- Image viewer for PNG charts

================================================================================

© 2024 Sullivan Realty CRM. All rights reserved.
This report is confidential and intended solely for the use of the client.
Unauthorized distribution or reproduction is prohibited.
`
}

/**
 * Export analysis results to JSON
 * Creates a formatted JSON file with all analysis data
 */
export async function exportAnalysisToJSON(
  analysisResults: BreakupsAnalysisResult,
  outputPath: string
): Promise<void> {
  const totalProps = analysisResults.metadata?.totalProperties || analysisResults.totalProperties || 0
  const jsonData = {
    metadata: {
      generatedAt: new Date().toISOString(),
      totalProperties: totalProps,
      clientName: analysisResults.clientName,
      analysisDate: analysisResults.analysisDate,
    },
    propertyCharacteristics: {
      brDistribution_Sale: analysisResults.brDistribution_Sale,
      brDistribution_Lease: analysisResults.brDistribution_Lease,
      hoaAnalysis: analysisResults.hoaAnalysis,
      strAnalysis_Sale: analysisResults.strAnalysis_Sale,
      strAnalysis_Lease: analysisResults.strAnalysis_Lease,
      renovationImpact_Sale: analysisResults.renovationImpact_Sale,
      renovationImpact_Lease: analysisResults.renovationImpact_Lease,
      compsClassification: analysisResults.compsClassification,
    },
    marketPositioning: {
      sqftVariance_Sale: analysisResults.sqftVariance_Sale,
      sqftVariance_Lease: analysisResults.sqftVariance_Lease,
      priceVariance_Sale: analysisResults.priceVariance_Sale,
      priceVariance_Lease: analysisResults.priceVariance_Lease,
      leaseVsSale: analysisResults.leaseVsSale,
      propertyRadarComps: analysisResults.propertyRadarComps,
      individualPRComps: analysisResults.individualPRComps,
    },
    timeAndLocation: {
      brPrecision_Sale: analysisResults.brPrecision_Sale,
      brPrecision_Lease: analysisResults.brPrecision_Lease,
      timeFrames: analysisResults.timeFrames,
      directVsIndirect: analysisResults.directVsIndirect,
      recentDirectVsIndirect: analysisResults.recentDirectVsIndirect,
    },
    marketActivity: {
      activeVsClosed_Sale: analysisResults.activeVsClosed_Sale,
      activeVsClosed_Lease: analysisResults.activeVsClosed_Lease,
      activeVsPending_Sale: analysisResults.activeVsPending_Sale,
      activeVsPending_Lease: analysisResults.activeVsPending_Lease,
    },
    financialImpact: {
      renovationDelta_Sale: analysisResults.renovationDelta_Sale,
      renovationDelta_Lease: analysisResults.renovationDelta_Lease,
      partialRenovationDelta_Sale: analysisResults.partialRenovationDelta_Sale,
      partialRenovationDelta_Lease: analysisResults.partialRenovationDelta_Lease,
      interquartileRanges_Sale: analysisResults.interquartileRanges_Sale,
      interquartileRanges_Lease: analysisResults.interquartileRanges_Lease,
      distributionTails_Sale: analysisResults.distributionTails_Sale,
      distributionTails_Lease: analysisResults.distributionTails_Lease,
      expectedNOI: analysisResults.expectedNOI,
      improvedNOI: analysisResults.improvedNOI,
    },
  }

  await writeFile(outputPath, JSON.stringify(jsonData, null, 2), 'utf-8')
  console.log(`${LOG_PREFIX} Exported analysis to JSON: ${outputPath}`)
}

/**
 * Export properties to CSV
 * Creates a CSV file from property data array
 */
export async function exportPropertiesToCSV(properties: any[], outputPath: string): Promise<void> {
  if (!properties || properties.length === 0) {
    console.warn(`${LOG_PREFIX} No properties to export to CSV`)
    return
  }

  // Get all unique keys from all properties
  const allKeys = new Set<string>()
  properties.forEach((prop) => {
    Object.keys(prop).forEach((key) => allKeys.add(key))
  })

  const headers = Array.from(allKeys)

  // Create CSV content
  const csvRows: string[] = []

  // Add header row
  csvRows.push(headers.map((h) => `"${h}"`).join(','))

  // Add data rows
  properties.forEach((prop) => {
    const values = headers.map((header) => {
      const value = prop[header]
      if (value === null || value === undefined) return '""'
      // Serialize dates in UTC to prevent timezone shift (e.g., midnight UTC → previous day in MST)
      if (value instanceof Date) {
        const y = value.getUTCFullYear()
        const m = String(value.getUTCMonth() + 1).padStart(2, '0')
        const d = String(value.getUTCDate()).padStart(2, '0')
        return `"${y}-${m}-${d}"`
      }
      // Escape quotes and wrap in quotes
      const stringValue = String(value).replace(/"/g, '""')
      return `"${stringValue}"`
    })
    csvRows.push(values.join(','))
  })

  await writeFile(outputPath, csvRows.join('\n'), 'utf-8')
  console.log(`${LOG_PREFIX} Exported ${properties.length} properties to CSV: ${outputPath}`)
}

/**
 * Create summary statistics JSON
 * Generates a summary of key metrics from the analysis
 */
export function createSummaryStats(analysisResults: BreakupsAnalysisResult): any {
  const totalProps = analysisResults.metadata?.totalProperties || analysisResults.totalProperties || 0
  return {
    overview: {
      totalProperties: totalProps,
      analysisDate: analysisResults.analysisDate,
      clientName: analysisResults.clientName,
    },
    keyMetrics: {
      brDistribution_Sale: analysisResults.brDistribution_Sale?.summary || analysisResults.brDistribution_Sale || null,
      hoaAnalysis: analysisResults.hoaAnalysis?.summary || analysisResults.hoaAnalysis || null,
      sqftVariance_Sale: analysisResults.sqftVariance_Sale?.summary || analysisResults.sqftVariance_Sale || null,
      activeVsClosed_Sale: analysisResults.activeVsClosed_Sale?.summary || analysisResults.activeVsClosed_Sale || null,
      expectedNOI: analysisResults.expectedNOI?.summary || analysisResults.expectedNOI || null,
      improvedNOI: analysisResults.improvedNOI?.summary || analysisResults.improvedNOI || null,
    },
    recommendations: {
      topFindings: [],
      actionItems: [],
    },
  }
}

/**
 * Validate chart files exist
 * Checks that all expected chart files are present
 */
async function validateChartFiles(chartPaths: string[]): Promise<{ valid: string[]; missing: string[] }> {
  const valid: string[] = []
  const missing: string[] = []

  for (const chartPath of chartPaths) {
    try {
      await stat(chartPath)
      valid.push(chartPath)
    } catch (error) {
      missing.push(chartPath)
      console.warn(`${LOG_PREFIX} Chart file missing: ${chartPath}`)
    }
  }

  return { valid, missing }
}

/**
 * Validate PDF files exist
 * Checks that all expected PDF files are present
 */
async function validatePdfFiles(pdfPaths: string[]): Promise<{ valid: string[]; missing: string[] }> {
  const valid: string[] = []
  const missing: string[] = []

  for (const pdfPath of pdfPaths) {
    try {
      await stat(pdfPath)
      valid.push(pdfPath)
    } catch (error) {
      missing.push(pdfPath)
      console.warn(`${LOG_PREFIX} PDF file missing: ${pdfPath}`)
    }
  }

  return { valid, missing }
}

/**
 * Create temporary working directory
 * Sets up the directory structure for packaging
 */
async function createWorkingDirectory(baseDir: string): Promise<string> {
  const timestamp = Date.now()
  const workDir = path.join(baseDir, `temp_packaging_${timestamp}`)

  await mkdir(workDir, { recursive: true })
  await mkdir(path.join(workDir, 'charts'), { recursive: true })
  await mkdir(path.join(workDir, 'reports'), { recursive: true })
  await mkdir(path.join(workDir, 'data'), { recursive: true })

  console.log(`${LOG_PREFIX} Created working directory: ${workDir}`)
  return workDir
}

/**
 * Create ZIP archive
 * Packages all files into a single .zip file
 */
async function createZipArchive(sourceDir: string, outputZipPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputZipPath)
    const archive = archiver('zip', {
      zlib: { level: 9 }, // Maximum compression
    })

    let zipSize = 0

    output.on('close', () => {
      zipSize = archive.pointer()
      console.log(`${LOG_PREFIX} ZIP archive created: ${outputZipPath} (${zipSize} bytes)`)
      resolve(zipSize)
    })

    archive.on('error', (err: Error) => {
      console.error(`${LOG_PREFIX} ZIP archive error:`, err)
      reject(err)
    })

    archive.on('warning', (err: archiver.ArchiverError) => {
      if (err.code === 'ENOENT') {
        console.warn(`${LOG_PREFIX} ZIP warning:`, err)
      } else {
        reject(err)
      }
    })

    archive.pipe(output)

    // Add all files from the working directory
    archive.directory(sourceDir, false)

    archive.finalize()
  })
}

/**
 * Clean up temporary files
 * Removes the working directory after packaging
 */
async function cleanupWorkingDirectory(workDir: string): Promise<void> {
  try {
    await rm(workDir, { recursive: true, force: true })
    console.log(`${LOG_PREFIX} Cleaned up working directory: ${workDir}`)
  } catch (error) {
    console.error(`${LOG_PREFIX} Error cleaning up working directory:`, error)
    // Don't throw - cleanup failure shouldn't fail the whole operation
  }
}

/**
 * Package Breakups Report
 * Main orchestrator function that creates the complete .zip package
 *
 * @param inputs - All required inputs for packaging
 * @returns PackageResult with zip path and metadata
 */
export async function packageBreakupsReport(inputs: PackageInputs): Promise<PackageResult> {
  const startTime = Date.now()
  console.log(`${LOG_PREFIX} Starting package creation for ${inputs.clientName}`)

  let workDir: string | null = null

  try {
    // 1. Validate inputs
    if (!inputs.enhancedExcel || inputs.enhancedExcel.length === 0) {
      throw new Error('Enhanced Excel file is required')
    }

    // 2. Validate chart and PDF files
    const chartValidation = await validateChartFiles(inputs.chartPaths)
    const pdfValidation = await validatePdfFiles(inputs.pdfPaths)

    if (chartValidation.missing.length > 0) {
      console.warn(`${LOG_PREFIX} Missing ${chartValidation.missing.length} chart files`)
    }

    if (pdfValidation.missing.length > 0) {
      console.warn(`${LOG_PREFIX} Missing ${pdfValidation.missing.length} PDF files`)
    }

    // 3. Create working directory
    workDir = await createWorkingDirectory(inputs.outputDir)

    // 4. Write Excel file
    const excelPath = path.join(workDir, 'Breakups_Analysis_Complete.xlsx')
    await writeFile(excelPath, inputs.enhancedExcel)
    console.log(`${LOG_PREFIX} Wrote Excel file: ${excelPath}`)

    // 5. Copy PropertyRadar file (if provided)
    let propertyRadarIncluded = false
    if (inputs.propertyRadarPath) {
      try {
        const fileName = path.basename(inputs.propertyRadarPath)
        const destPath = path.join(workDir, fileName)
        await fs.promises.copyFile(inputs.propertyRadarPath, destPath)
        propertyRadarIncluded = true
        console.log(`${LOG_PREFIX} Copied PropertyRadar file: ${fileName}`)
      } catch (error) {
        console.warn(`${LOG_PREFIX} Failed to copy PropertyRadar file:`, error)
      }
    }

    // 6. Copy chart files
    for (const chartPath of chartValidation.valid) {
      const fileName = path.basename(chartPath)
      const destPath = path.join(workDir, 'charts', fileName)
      await fs.promises.copyFile(chartPath, destPath)
    }
    console.log(`${LOG_PREFIX} Copied ${chartValidation.valid.length} chart files`)

    // 7. Copy PDF files
    for (const pdfPath of pdfValidation.valid) {
      const fileName = path.basename(pdfPath)
      const destPath = path.join(workDir, 'reports', fileName)
      await fs.promises.copyFile(pdfPath, destPath)
    }
    console.log(`${LOG_PREFIX} Copied ${pdfValidation.valid.length} PDF files`)

    // 8. Generate README.txt
    const readmeContent = createReadmeFile(inputs.analysisResults)
    const readmePath = path.join(workDir, 'README.txt')
    await writeFile(readmePath, readmeContent, 'utf-8')
    console.log(`${LOG_PREFIX} Created README.txt`)

    // 9. Export analysis to JSON
    const analysisJsonPath = path.join(workDir, 'data', 'analysis_results.json')
    await exportAnalysisToJSON(inputs.analysisResults, analysisJsonPath)

    // 10. Export properties to CSV
    const propertiesCsvPath = path.join(workDir, 'data', 'property_data.csv')
    await exportPropertiesToCSV(inputs.properties, propertiesCsvPath)

    // 11. Create summary statistics JSON
    const summaryStats = createSummaryStats(inputs.analysisResults)
    const summaryPath = path.join(workDir, 'data', 'summary_statistics.json')
    await writeFile(summaryPath, JSON.stringify(summaryStats, null, 2), 'utf-8')
    console.log(`${LOG_PREFIX} Created summary statistics`)

    // 12. Create ZIP archive
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
    const clientNameClean = inputs.clientName.replace(/[^a-zA-Z0-9]/g, '_')
    const zipFileName = `Breakups_Report_${clientNameClean}_${timestamp}.zip`
    const zipPath = path.join(inputs.outputDir, zipFileName)

    const zipSize = await createZipArchive(workDir, zipPath)

    // 13. Clean up working directory
    await cleanupWorkingDirectory(workDir)
    workDir = null

    const elapsed = Date.now() - startTime
    console.log(`${LOG_PREFIX} Package created successfully in ${elapsed}ms`)

    return {
      success: true,
      zipPath,
      zipSize,
      fileName: zipFileName,
      contents: {
        excel: true,
        charts: chartValidation.valid.length,
        pdfs: pdfValidation.valid.length,
        propertyRadar: propertyRadarIncluded,
        dataFiles: 3, // analysis_results.json, property_data.csv, summary_statistics.json
      },
    }
  } catch (error) {
    console.error(`${LOG_PREFIX} Error creating package:`, error)

    // Clean up on error
    if (workDir) {
      await cleanupWorkingDirectory(workDir)
    }

    return {
      success: false,
      zipPath: '',
      zipSize: 0,
      fileName: '',
      contents: {
        excel: false,
        charts: 0,
        pdfs: 0,
        propertyRadar: false,
        dataFiles: 0,
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Example Usage:
 *
 * ```typescript
 * import { packageBreakupsReport } from '@/lib/processing/breakups-packager'
 *
 * const result = await packageBreakupsReport({
 *   fileId: 'abc123',
 *   clientName: 'Smith Family',
 *   enhancedExcel: excelBuffer,
 *   analysisResults: {
 *     bedroomDistribution: {...},
 *     hoaComparison: {...},
 *     // ... all 22 analyses
 *     totalProperties: 150,
 *     analysisDate: '2024-10-29',
 *     clientName: 'Smith Family'
 *   },
 *   chartPaths: [
 *     '/tmp/charts/analysis_01_br_distribution.png',
 *     // ... 21 more chart paths
 *   ],
 *   pdfPaths: [
 *     '/tmp/reports/Executive_Summary.pdf',
 *     // ... 4 more PDF paths
 *   ],
 *   properties: propertyDataArray,
 *   outputDir: '/tmp/output'
 * })
 *
 * if (result.success) {
 *   console.log('Package created:', result.zipPath)
 *   console.log('Size:', result.zipSize, 'bytes')
 *   console.log('Contents:', result.contents)
 * }
 * ```
 */
