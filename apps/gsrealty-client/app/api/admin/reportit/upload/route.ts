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
import ExcelJS from 'exceljs';
import { generatePropertyRadarExcel, generatePropertyRadarFilename } from '@/lib/processing/propertyradar-generator';
import { generateAllBreakupsAnalyses } from '@/lib/processing/breakups-generator';
import { generateAllVisualizations } from '@/lib/processing/breakups-visualizer';
import { generateAllPDFReports } from '@/lib/processing/breakups-pdf-generator';
import { packageBreakupsReport } from '@/lib/processing/breakups-packager';

const LOG_PREFIX = '[ReportIt API - Upload]';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const UPLOAD_DIR = join(process.cwd(), 'tmp', 'reportit');

/**
 * Transform analysis results from breakups-generator format to PDF generator format
 * Converts flat structure with individual properties to array-based structure
 */
function transformAnalysisResultsForPDF(results: any, clientName: string): any {
  // Map analysis results to array format expected by PDF generator
  const analysisArray = [
    // Category A: Property Characteristics (1-5)
    { id: 1, name: 'Bedroom Distribution', category: 'A', categoryName: 'Property Characteristics', results: results.brDistribution, insight: generateInsight(results.brDistribution, 'bedroom distribution') },
    { id: 2, name: 'HOA Fee Analysis', category: 'A', categoryName: 'Property Characteristics', results: results.hoaAnalysis, insight: generateInsight(results.hoaAnalysis, 'HOA fees') },
    { id: 3, name: 'STR vs Non-STR Properties', category: 'A', categoryName: 'Property Characteristics', results: results.strAnalysis, insight: generateInsight(results.strAnalysis, 'short-term rentals') },
    { id: 4, name: 'Renovation Impact', category: 'A', categoryName: 'Property Characteristics', results: results.renovationImpact, insight: generateInsight(results.renovationImpact, 'renovations') },
    { id: 5, name: 'Comps Classification', category: 'A', categoryName: 'Property Characteristics', results: results.compsClassification, insight: generateInsight(results.compsClassification, 'comparable properties') },

    // Category B: Market Positioning (6-10)
    { id: 6, name: 'Square Footage Variance', category: 'B', categoryName: 'Market Positioning', results: results.sqftVariance, insight: generateInsight(results.sqftVariance, 'square footage') },
    { id: 7, name: 'Price Variance', category: 'B', categoryName: 'Market Positioning', results: results.priceVariance, insight: generateInsight(results.priceVariance, 'price distribution') },
    { id: 8, name: 'Lease vs Sale Properties', category: 'B', categoryName: 'Market Positioning', results: results.leaseVsSale, insight: generateInsight(results.leaseVsSale, 'lease vs sale') },
    { id: 9, name: 'PropertyRadar Comps', category: 'B', categoryName: 'Market Positioning', results: results.propertyRadarComps, insight: generateInsight(results.propertyRadarComps, 'PropertyRadar comparables') },
    { id: 10, name: 'Individual PropertyRadar Comps', category: 'B', categoryName: 'Market Positioning', results: results.individualPRComps, insight: generateInsight(results.individualPRComps, 'individual PropertyRadar comps') },

    // Category C: Time & Location (11-14)
    { id: 11, name: 'Bedroom Precision', category: 'C', categoryName: 'Time & Location', results: results.brPrecision, insight: generateInsight(results.brPrecision, 'bedroom matching') },
    { id: 12, name: 'Time Frame Analysis', category: 'C', categoryName: 'Time & Location', results: results.timeFrames, insight: generateInsight(results.timeFrames, 'time frames') },
    { id: 13, name: 'Direct vs Indirect Comps', category: 'C', categoryName: 'Time & Location', results: results.directVsIndirect, insight: generateInsight(results.directVsIndirect, 'comparable types') },
    { id: 14, name: 'Recent Direct vs Indirect', category: 'C', categoryName: 'Time & Location', results: results.recentDirectVsIndirect, insight: generateInsight(results.recentDirectVsIndirect, 'recent comparables') },

    // Category D: Market Activity (15-16)
    { id: 15, name: 'Active vs Closed Properties', category: 'D', categoryName: 'Market Activity', results: results.activeVsClosed, insight: generateInsight(results.activeVsClosed, 'market activity') },
    { id: 16, name: 'Active vs Pending Properties', category: 'D', categoryName: 'Market Activity', results: results.activeVsPending, insight: generateInsight(results.activeVsPending, 'pending properties') },

    // Category E: Financial Impact (17-22)
    { id: 17, name: 'Renovation Price Delta', category: 'E', categoryName: 'Financial Impact', results: results.renovationDelta, insight: generateInsight(results.renovationDelta, 'renovation impact on price') },
    { id: 18, name: 'Partial Renovation Delta', category: 'E', categoryName: 'Financial Impact', results: results.partialRenovationDelta, insight: generateInsight(results.partialRenovationDelta, 'partial renovations') },
    { id: 19, name: 'Interquartile Ranges', category: 'E', categoryName: 'Financial Impact', results: results.interquartileRanges, insight: generateInsight(results.interquartileRanges, 'price quartiles') },
    { id: 20, name: 'Distribution Tails', category: 'E', categoryName: 'Financial Impact', results: results.distributionTails, insight: generateInsight(results.distributionTails, 'price outliers') },
    { id: 21, name: 'Expected Net Operating Income', category: 'E', categoryName: 'Financial Impact', results: results.expectedNOI, insight: generateInsight(results.expectedNOI, 'expected NOI') },
    { id: 22, name: 'Improved Net Operating Income', category: 'E', categoryName: 'Financial Impact', results: results.improvedNOI, insight: generateInsight(results.improvedNOI, 'improved NOI') },
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

/**
 * Generate human-readable insight from analysis results
 */
function generateInsight(result: any, topic: string): string {
  if (!result) return `Analysis of ${topic} could not be completed due to missing data.`;

  try {
    // Try to extract meaningful insight from result object
    if (result.summary) return result.summary;
    if (result.insight) return result.insight;
    if (result.description) return result.description;

    // Generate basic insight from available data
    const keys = Object.keys(result);
    if (keys.length > 0) {
      return `Analysis of ${topic} shows ${keys.length} data points. See detailed results for more information.`;
    }

    return `Analysis of ${topic} completed successfully.`;
  } catch (error) {
    return `Analysis of ${topic} completed with limited data.`;
  }
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

      // STEP 1: Generate all 22 analyses
      console.log(`${LOG_PREFIX} [1/4] Running 22 break-ups analyses...`);
      const analysisResults = await generateAllBreakupsAnalyses(uploadedWorkbook, {});
      console.log(`${LOG_PREFIX} Analysis complete: 22 analyses generated`);

      // STEP 2: Generate 22 visualization charts
      console.log(`${LOG_PREFIX} [2/4] Generating 22 visualization charts...`);
      console.log(`${LOG_PREFIX} [DEBUG] Analysis results structure:`, Object.keys(analysisResults));
      const visualizationResult = await generateAllVisualizations(analysisResults, chartsDir);
      console.log(`${LOG_PREFIX} [DEBUG] Visualization result:`, JSON.stringify(visualizationResult, null, 2));
      console.log(`${LOG_PREFIX} Charts complete: ${visualizationResult.successfulCharts}/${visualizationResult.totalCharts} generated`);
      console.log(`${LOG_PREFIX} [DEBUG] Charts array length:`, visualizationResult.charts.length);
      console.log(`${LOG_PREFIX} [DEBUG] Errors:`, visualizationResult.errors);

      // STEP 3: Generate 5 PDF reports
      console.log(`${LOG_PREFIX} [3/5] Generating 5 professional PDF reports...`);
      // Extract chart file paths from successful charts
      const chartPaths = visualizationResult.charts
        .filter(chart => chart.success && chart.filePath)
        .map(chart => chart.filePath);
      console.log(`${LOG_PREFIX} [DEBUG] Chart paths extracted:`, chartPaths.length);

      // Transform analysis results to format expected by PDF generator
      const transformedData = transformAnalysisResultsForPDF(analysisResults, clientName);
      console.log(`${LOG_PREFIX} [DEBUG] Transformed data for PDF generation`);

      // Generate PDFs using pdf-lib (no external font dependencies)
      const pdfResult = await generateAllPDFReports(
        transformedData,
        chartPaths,
        reportsDir
      );
      console.log(`${LOG_PREFIX} PDFs complete: ${pdfResult.generatedFiles.length}/5 generated`);
      if (pdfResult.errors.length > 0) {
        console.error(`${LOG_PREFIX} PDF errors:`, pdfResult.errors);
      }

      // STEP 4: Generate PropertyRadar export
      console.log(`${LOG_PREFIX} [4/5] Generating PropertyRadar export...`);
      const propertyRadarBuffer = await generatePropertyRadarExcel(uploadedWorkbook, clientName);
      const propertyRadarFileName = generatePropertyRadarFilename(clientName);
      const propertyRadarPath = join(breakupsDir, propertyRadarFileName);
      await writeFile(propertyRadarPath, propertyRadarBuffer);
      console.log(`${LOG_PREFIX} PropertyRadar export generated: ${propertyRadarPath}`);

      // STEP 5: Package everything into a .zip file
      console.log(`${LOG_PREFIX} [5/5] Packaging into downloadable .zip file...`);

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
        pdfPaths: pdfResult.generatedFiles,
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
