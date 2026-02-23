// Note (Feb 2026): RENOVATE_SCORE upgraded from Y/N/0.5 to 1-10 numeric + RENO_YEAR_EST.
// Vision AI auto-scoring via FlexMLS PDF pipeline now available.
// See docs/calibration/ for current schema and docs/reference/vision-scoring-pipeline.md for the AI pipeline reference.

/**
 * Example Usage of Break-ups PDF Generator
 *
 * This file demonstrates how to use the PDF generation system
 * to create professional reports from break-ups analysis results.
 *
 * @module lib/processing/breakups-pdf-generator.example
 */

import {
  generateAllPDFReports,
  generateExecutiveSummary,
  BreakupsAnalysisResult,
} from './breakups-pdf-generator';
import path from 'path';

// ============================================================================
// Example 1: Generate All PDF Reports
// ============================================================================

async function exampleGenerateAllReports() {
  // Sample analysis results (in production, this comes from breakups-analyzer)
  const analysisResults: BreakupsAnalysisResult = {
    analysisDate: new Date().toISOString(),
    propertyCount: 234,
    subjectProperty: {
      address: '4600 N 68TH ST UNIT 371, Scottsdale, AZ 85251',
      apn: '173-35-524',
      price: 425000,
      sqft: 702,
      bedrooms: 1,
      bathrooms: 1,
    },
    analyses: [
      {
        id: 1,
        name: 'BR Distribution',
        category: 'A',
        categoryName: 'Property Characteristics',
        results: {
          distribution: { '1BR': 23, '2BR': 67, '3BR': 105, '4BR': 39 },
          mostCommon: '3BR',
          percentage: 44.9,
        },
        insight: '3-bedroom properties dominate at 45% of market',
        chartPath: '/tmp/reportit/breakups/charts/01_br_distribution.png',
      },
      {
        id: 2,
        name: 'HOA vs Non-HOA',
        category: 'A',
        categoryName: 'Property Characteristics',
        results: {
          withHOA: { count: 156, avgPrice: 450000, avgHOAFee: 275 },
          withoutHOA: { count: 78, avgPrice: 400000 },
          priceDifferential: 50000,
        },
        insight: 'HOA properties command 12.5% premium on average',
        chartPath: '/tmp/reportit/breakups/charts/02_hoa_comparison.png',
      },
      // ... (more analyses 3-22)
    ],
    summary: {
      overallConfidence: 92.3,
      dataQuality: 'High',
      recommendedValue: 425000,
      valueRange: { low: 405000, high: 445000 },
    },
  };

  // Chart paths from visualizer
  const chartPaths = [
    '/tmp/reportit/breakups/charts/01_br_distribution.png',
    '/tmp/reportit/breakups/charts/02_hoa_comparison.png',
    '/tmp/reportit/breakups/charts/03_str_analysis.png',
    // ... (all 22 chart paths)
  ];

  // Output directory
  const outputDir = '/tmp/reportit/breakups/file123/reports';

  // Generate all PDFs
  try {
    const result = await generateAllPDFReports(
      analysisResults,
      chartPaths,
      outputDir
    );

    console.log('PDF Generation Results:');
    console.log('Success:', result.success);
    console.log('Generated Files:', result.generatedFiles);
    console.log('Total Size:', (result.totalSize / 1024 / 1024).toFixed(2), 'MB');
    console.log('Generation Time:', result.generationTime, 'ms');

    if (result.errors.length > 0) {
      console.error('Errors:', result.errors);
    }
  } catch (error) {
    console.error('Fatal error:', error);
  }
}

// ============================================================================
// Example 2: Generate Single Report (Executive Summary Only)
// ============================================================================

async function exampleGenerateExecutiveSummary() {
  const analysisResults: BreakupsAnalysisResult = {
    // ... (same structure as above)
  } as any;

  const chartMap = new Map<number, string>([
    [1, '/tmp/reportit/breakups/charts/01_br_distribution.png'],
    [2, '/tmp/reportit/breakups/charts/02_hoa_comparison.png'],
    [17, '/tmp/reportit/breakups/charts/17_renovation_delta_y_n.png'],
    [21, '/tmp/reportit/breakups/charts/21_expected_noi.png'],
  ]);

  const outputPath = '/tmp/reportit/breakups/file123/Executive_Summary.pdf';

  try {
    await generateExecutiveSummary(analysisResults, chartMap, outputPath);
    console.log('Executive Summary generated:', outputPath);
  } catch (error) {
    console.error('Error generating Executive Summary:', error);
  }
}

// ============================================================================
// Example 3: Integration with ReportIt Pipeline
// ============================================================================

/**
 * This is how the PDF generator integrates with the ReportIt pipeline
 */
async function integrateWithReportItPipeline(
  fileId: string,
  analysisResults: BreakupsAnalysisResult,
  visualizationResults: { chartPaths: string[] }
) {
  // Define output directories
  const baseDir = `/tmp/reportit/breakups/${fileId}`;
  const reportsDir = path.join(baseDir, 'reports');
  const chartsDir = path.join(baseDir, 'charts');

  console.log(`Generating PDF reports for file ${fileId}...`);

  // Generate all PDF reports
  const result = await generateAllPDFReports(
    analysisResults,
    visualizationResults.chartPaths,
    reportsDir
  );

  if (!result.success) {
    throw new Error(`PDF generation failed: ${result.errors.join(', ')}`);
  }

  console.log(`Generated ${result.generatedFiles.length} PDF reports`);
  console.log(`Total size: ${(result.totalSize / 1024 / 1024).toFixed(2)} MB`);

  // Return file paths for ZIP packaging
  return {
    pdfFiles: result.generatedFiles,
    totalSize: result.totalSize,
    generationTime: result.generationTime,
  };
}

// ============================================================================
// Example 4: Error Handling
// ============================================================================

async function exampleWithErrorHandling() {
  try {
    const result = await generateAllPDFReports(
      {} as any, // Invalid data
      [],
      '/invalid/path'
    );

    // Check for errors
    if (!result.success) {
      console.error('PDF generation encountered errors:');
      result.errors.forEach((error, idx) => {
        console.error(`  ${idx + 1}. ${error}`);
      });

      // Still show what was generated
      if (result.generatedFiles.length > 0) {
        console.log(`Successfully generated ${result.generatedFiles.length} files despite errors`);
      }
    }
  } catch (error) {
    console.error('Fatal error during PDF generation:', error);
  }
}

// ============================================================================
// Example 5: Custom Configuration
// ============================================================================

/**
 * You can customize colors, fonts, and layout by modifying the constants
 * in breakups-pdf-generator.ts:
 *
 * - COLORS: Primary, secondary, positive, negative colors
 * - FONTS: Title, heading, body font sizes
 * - MARGINS: Top, bottom, left, right margins
 *
 * For example, to match company branding:
 */

const CUSTOM_COLORS = {
  primary: '#1E40AF',      // Company blue
  secondary: '#F59E0B',    // Company amber
  positive: '#059669',     // Success green
  negative: '#DC2626',     // Alert red
  neutral: '#64748B',      // Neutral gray
};

// ============================================================================
// Run Examples
// ============================================================================

if (require.main === module) {
  (async () => {
    console.log('Running PDF Generator Examples...\n');

    // Example 1: Generate all reports
    console.log('Example 1: Generate All Reports');
    // await exampleGenerateAllReports();

    // Example 2: Generate single report
    console.log('\nExample 2: Generate Executive Summary Only');
    // await exampleGenerateExecutiveSummary();

    // Example 3: Integration
    console.log('\nExample 3: Pipeline Integration');
    // (see function above)

    // Example 4: Error handling
    console.log('\nExample 4: Error Handling');
    // await exampleWithErrorHandling();

    console.log('\nExamples complete!');
  })();
}

export {
  exampleGenerateAllReports,
  exampleGenerateExecutiveSummary,
  integrateWithReportItPipeline,
};
