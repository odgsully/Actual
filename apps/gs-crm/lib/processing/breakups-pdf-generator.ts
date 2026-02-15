/**
 * ReportIt Break-ups PDF Report Generator
 *
 * Generates 5 professional PDF reports from break-ups analysis:
 * 1. Executive Summary (2-3 pages)
 * 2. Property Characteristics Report (Analyses 1-5)
 * 3. Market Analysis Report (Analyses 6-14)
 * 4. Financial Analysis Report (Analyses 17-22)
 * 5. Comparative Market Activity Report (Analyses 15-16)
 *
 * @module lib/processing/breakups-pdf-generator
 * @requires pdf-lib - Professional PDF generation library (works in Next.js)
 * @requires fs - File system operations
 */

import { PDFDocument, rgb, StandardFonts, PageSizes } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Analysis result from breakups-analyzer
 */
export interface BreakupsAnalysisResult {
  analysisDate: string;
  propertyCount: number;
  subjectProperty: {
    address: string;
    apn?: string;
    price?: number;
    sqft?: number;
    bedrooms?: number;
    bathrooms?: number;
  };
  analyses: AnalysisItem[];
  summary: {
    overallConfidence: number;
    dataQuality: string;
    recommendedValue?: number;
    valueRange?: { low: number; high: number };
  };
}

/**
 * Individual analysis item
 */
export interface AnalysisItem {
  id: number;
  name: string;
  category: 'A' | 'B' | 'C' | 'D' | 'E';
  categoryName: string;
  results: any;
  insight: string;
  chartPath?: string;
}

/**
 * PDF generation result
 */
export interface PDFGenerationResult {
  success: boolean;
  generatedFiles: string[];
  errors: string[];
  totalSize: number;
  generationTime: number;
}

/**
 * Color scheme for professional output
 */
const COLORS = {
  primary: rgb(0.12, 0.25, 0.69),      // Blue #1E40AF
  secondary: rgb(0.96, 0.62, 0.04),    // Amber #F59E0B
  positive: rgb(0.02, 0.59, 0.41),     // Green #059669
  negative: rgb(0.86, 0.15, 0.15),     // Red #DC2626
  neutral: rgb(0.39, 0.46, 0.55),      // Gray #64748B
  text: rgb(0.12, 0.16, 0.22),         // Dark gray #1F2937
  lightText: rgb(0.42, 0.45, 0.50),    // Medium gray #6B7280
  background: rgb(0.98, 0.98, 0.98),   // Light background #F9FAFB
  border: rgb(0.90, 0.91, 0.92),       // Light border #E5E7EB
  black: rgb(0, 0, 0),
  white: rgb(1, 1, 1),
};

/**
 * Document margins (in points)
 */
const MARGINS = {
  top: 72,
  bottom: 72,
  left: 72,
  right: 72,
};

/**
 * Font sizes (in points)
 */
const FONTS = {
  title: 24,
  heading1: 18,
  heading2: 14,
  heading3: 12,
  body: 10,
  small: 8,
};

// ============================================================================
// Main Orchestrator Function
// ============================================================================

/**
 * Generate all 5 PDF reports from break-ups analysis results
 *
 * @param analysisResults - Complete analysis results from breakups-analyzer
 * @param chartPaths - Array of chart image file paths from visualizer
 * @param outputDir - Directory to save PDF files
 * @returns Generation result with file paths and statistics
 */
export async function generateAllPDFReports(
  analysisResults: BreakupsAnalysisResult,
  chartPaths: string[],
  outputDir: string
): Promise<PDFGenerationResult> {
  const startTime = Date.now();
  const generatedFiles: string[] = [];
  const errors: string[] = [];
  let totalSize = 0;

  console.log(`[PDF Generator] Starting PDF generation in ${outputDir}`);
  console.log(`[PDF Generator] Chart paths provided: ${chartPaths.length}`);

  try {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`[PDF Generator] Created output directory: ${outputDir}`);
    } else {
      console.log(`[PDF Generator] Output directory exists: ${outputDir}`);
    }

    // Map chart paths to analysis IDs for easy lookup
    const chartMap = mapChartsToAnalyses(chartPaths);
    console.log(`[PDF Generator] Mapped ${chartMap.size} charts to analysis IDs`);

    // 1. Generate Executive Summary
    try {
      console.log(`[PDF Generator] [1/5] Generating Executive_Summary.pdf...`);
      const execPath = path.join(outputDir, 'Executive_Summary.pdf');
      await generateExecutiveSummary(analysisResults, chartMap, execPath);
      generatedFiles.push(execPath);
      const fileSize = fs.statSync(execPath).size;
      totalSize += fileSize;
      console.log(`[PDF Generator] ✓ Executive_Summary.pdf generated (${(fileSize / 1024).toFixed(2)} KB)`);
    } catch (error) {
      const errorMsg = `Executive Summary: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMsg);
      console.error(`[PDF Generator] ✗ Executive Summary failed:`, error);
    }

    // 2. Generate Property Characteristics Report (Analyses 1-5)
    try {
      console.log(`[PDF Generator] [2/5] Generating Property_Characteristics.pdf...`);
      const propPath = path.join(outputDir, 'Property_Characteristics.pdf');
      await generatePropertyCharacteristicsReport(
        analysisResults,
        chartMap,
        propPath
      );
      generatedFiles.push(propPath);
      const fileSize = fs.statSync(propPath).size;
      totalSize += fileSize;
      console.log(`[PDF Generator] ✓ Property_Characteristics.pdf generated (${(fileSize / 1024).toFixed(2)} KB)`);
    } catch (error) {
      const errorMsg = `Property Characteristics: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMsg);
      console.error(`[PDF Generator] ✗ Property Characteristics failed:`, error);
    }

    // 3. Generate Market Analysis Report (Analyses 6-14)
    try {
      console.log(`[PDF Generator] [3/5] Generating Market_Analysis.pdf...`);
      const marketPath = path.join(outputDir, 'Market_Analysis.pdf');
      await generateMarketAnalysisReport(
        analysisResults,
        chartMap,
        marketPath
      );
      generatedFiles.push(marketPath);
      const fileSize = fs.statSync(marketPath).size;
      totalSize += fileSize;
      console.log(`[PDF Generator] ✓ Market_Analysis.pdf generated (${(fileSize / 1024).toFixed(2)} KB)`);
    } catch (error) {
      const errorMsg = `Market Analysis: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMsg);
      console.error(`[PDF Generator] ✗ Market Analysis failed:`, error);
    }

    // 4. Generate Financial Analysis Report (Analyses 17-22)
    try {
      console.log(`[PDF Generator] [4/5] Generating Financial_Analysis.pdf...`);
      const financialPath = path.join(outputDir, 'Financial_Analysis.pdf');
      await generateFinancialAnalysisReport(
        analysisResults,
        chartMap,
        financialPath
      );
      generatedFiles.push(financialPath);
      const fileSize = fs.statSync(financialPath).size;
      totalSize += fileSize;
      console.log(`[PDF Generator] ✓ Financial_Analysis.pdf generated (${(fileSize / 1024).toFixed(2)} KB)`);
    } catch (error) {
      const errorMsg = `Financial Analysis: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMsg);
      console.error(`[PDF Generator] ✗ Financial Analysis failed:`, error);
    }

    // 5. Generate Market Activity Report (Analyses 15-16)
    try {
      console.log(`[PDF Generator] [5/5] Generating Market_Activity.pdf...`);
      const activityPath = path.join(outputDir, 'Market_Activity.pdf');
      await generateMarketActivityReport(
        analysisResults,
        chartMap,
        activityPath
      );
      generatedFiles.push(activityPath);
      const fileSize = fs.statSync(activityPath).size;
      totalSize += fileSize;
      console.log(`[PDF Generator] ✓ Market_Activity.pdf generated (${(fileSize / 1024).toFixed(2)} KB)`);
    } catch (error) {
      const errorMsg = `Market Activity: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMsg);
      console.error(`[PDF Generator] ✗ Market Activity failed:`, error);
    }

    const generationTime = Date.now() - startTime;

    console.log(`[PDF Generator] PDF generation complete: ${generatedFiles.length}/5 PDFs generated in ${generationTime}ms`);
    if (errors.length > 0) {
      console.error(`[PDF Generator] Errors encountered: ${errors.length}`);
      errors.forEach(err => console.error(`  - ${err}`));
    }

    return {
      success: errors.length === 0,
      generatedFiles,
      errors,
      totalSize,
      generationTime,
    };
  } catch (error) {
    console.error(`[PDF Generator] Fatal error:`, error);
    return {
      success: false,
      generatedFiles,
      errors: [`Fatal error: ${error instanceof Error ? error.message : String(error)}`],
      totalSize,
      generationTime: Date.now() - startTime,
    };
  }
}

// ============================================================================
// Individual Report Generators
// ============================================================================

/**
 * Generate Executive Summary PDF (2-3 pages)
 */
export async function generateExecutiveSummary(
  data: BreakupsAnalysisResult,
  chartMap: Map<number, string>,
  outputPath: string
): Promise<void> {
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Page 1: Overview
  let page = pdfDoc.addPage(PageSizes.Letter);
  let yPosition = page.getHeight() - MARGINS.top;

  // Header
  yPosition = addPageHeader(page, 'Executive Summary', helveticaBoldFont, yPosition);
  yPosition -= 40;

  // Property details box
  yPosition = addPropertyDetailsBox(page, data.subjectProperty, helveticaFont, helveticaBoldFont, yPosition);
  yPosition -= 30;

  // Key metrics dashboard
  yPosition = addSectionHeading(page, 'Key Metrics', helveticaBoldFont, yPosition);
  yPosition -= 20;

  const metrics = [
    { label: 'Property Count', value: data.propertyCount.toString() },
    { label: 'Data Quality', value: data.summary.dataQuality },
    { label: 'Confidence Level', value: `${data.summary.overallConfidence.toFixed(1)}%` },
    { label: 'Analysis Date', value: new Date(data.analysisDate).toLocaleDateString() },
  ];

  yPosition = addMetricsList(page, metrics, helveticaFont, yPosition);
  yPosition -= 30;

  // Market position summary
  yPosition = addSectionHeading(page, 'Market Position Summary', helveticaBoldFont, yPosition);
  yPosition -= 15;

  const topInsights = getTopInsights(data.analyses, 5);
  yPosition = addBulletList(page, topInsights, helveticaFont, yPosition);
  yPosition -= 30;

  // Investment highlights
  if (yPosition < 150) {
    page = pdfDoc.addPage(PageSizes.Letter);
    yPosition = page.getHeight() - MARGINS.top;
    yPosition = addPageHeader(page, 'Executive Summary (continued)', helveticaBoldFont, yPosition);
    yPosition -= 40;
  }

  yPosition = addSectionHeading(page, 'Investment Highlights', helveticaBoldFont, yPosition);
  yPosition -= 15;
  yPosition = addInvestmentHighlights(page, data, helveticaFont, yPosition);

  // Page 2: Analysis Summary
  page = pdfDoc.addPage(PageSizes.Letter);
  yPosition = page.getHeight() - MARGINS.top;
  yPosition = addPageHeader(page, 'Analysis Summary', helveticaBoldFont, yPosition);
  yPosition -= 40;

  yPosition = addSectionHeading(page, 'Top 5 Findings', helveticaBoldFont, yPosition);
  yPosition -= 20;

  const findings = extractTopFindings(data.analyses, 5);
  yPosition = addFindings(page, findings, helveticaFont, helveticaBoldFont, yPosition);
  yPosition -= 30;

  // Pricing recommendation
  if (yPosition < 200 && data.summary.recommendedValue) {
    page = pdfDoc.addPage(PageSizes.Letter);
    yPosition = page.getHeight() - MARGINS.top;
    yPosition = addPageHeader(page, 'Analysis Summary (continued)', helveticaBoldFont, yPosition);
    yPosition -= 40;
  }

  yPosition = addSectionHeading(page, 'Pricing Recommendation', helveticaBoldFont, yPosition);
  yPosition -= 15;

  if (data.summary.recommendedValue && data.summary.valueRange) {
    const pricingLines = [
      `Recommended Value: ${formatCurrency(data.summary.recommendedValue)}`,
      `Value Range: ${formatCurrency(data.summary.valueRange.low)} - ${formatCurrency(data.summary.valueRange.high)}`,
      `Confidence Level: ${data.summary.overallConfidence.toFixed(1)}%`,
    ];
    yPosition = addTextLines(page, pricingLines, helveticaFont, FONTS.body, yPosition);
  }

  // Page 3: Visualizations Reference
  page = pdfDoc.addPage(PageSizes.Letter);
  yPosition = page.getHeight() - MARGINS.top;
  yPosition = addPageHeader(page, 'Key Visualizations', helveticaBoldFont, yPosition);
  yPosition -= 40;

  const chartReferences = [
    'Analysis 1: Bedroom Distribution',
    'Analysis 2: HOA Fees Analysis',
    'Analysis 17: Renovation Delta',
    'Analysis 21: Net Operating Income (NOI)',
  ];

  page.drawText('Visual charts are available in the individual analysis reports:', {
    x: MARGINS.left,
    y: yPosition,
    size: FONTS.body,
    font: helveticaFont,
    color: COLORS.text,
  });
  yPosition -= 30;

  yPosition = addBulletList(page, chartReferences, helveticaFont, yPosition);

  // Add page numbers to all pages
  addPageNumbers(pdfDoc, helveticaFont);

  // Save PDF
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);
}

/**
 * Generate Property Characteristics Report (Analyses 1-5)
 */
export async function generatePropertyCharacteristicsReport(
  data: BreakupsAnalysisResult,
  chartMap: Map<number, string>,
  outputPath: string
): Promise<void> {
  const pdfDoc = await PDFDocument.create();
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Filter analyses 1-5 (Category A)
  const categoryA = data.analyses.filter(a => a.id >= 1 && a.id <= 5);

  let page = pdfDoc.addPage(PageSizes.Letter);
  let yPosition = page.getHeight() - MARGINS.top;
  yPosition = addPageHeader(page, 'Property Characteristics Analysis', helveticaBoldFont, yPosition);
  yPosition -= 40;

  for (let idx = 0; idx < categoryA.length; idx++) {
    const analysis = categoryA[idx];

    // Add new page for each analysis after the first
    if (idx > 0) {
      page = pdfDoc.addPage(PageSizes.Letter);
      yPosition = page.getHeight() - MARGINS.top;
      yPosition = addPageHeader(page, 'Property Characteristics Analysis', helveticaBoldFont, yPosition);
      yPosition -= 40;
    }

    // Analysis title
    yPosition = addSectionHeading(page, `Analysis ${analysis.id}: ${analysis.name}`, helveticaBoldFont, yPosition);
    yPosition -= 20;

    // Category
    page.drawText(`Category: ${analysis.categoryName}`, {
      x: MARGINS.left,
      y: yPosition,
      size: FONTS.body,
      font: helveticaFont,
      color: COLORS.lightText,
    });
    yPosition -= 25;

    // Analysis insight
    yPosition = addWrappedText(page, analysis.insight, helveticaFont, FONTS.body, yPosition, 450);
    yPosition -= 25;

    // Chart reference
    const chartPath = chartMap.get(analysis.id);
    if (chartPath) {
      const chartFile = path.basename(chartPath);
      page.drawText(`Chart: ${chartFile}`, {
        x: MARGINS.left,
        y: yPosition,
        size: FONTS.small,
        font: helveticaFont,
        color: COLORS.lightText,
      });
      yPosition -= 25;
    }

    // Data summary
    if (analysis.results && typeof analysis.results === 'object') {
      yPosition = addSectionHeading(page, 'Data Summary', helveticaBoldFont, yPosition);
      yPosition -= 15;
      yPosition = addResultsData(page, analysis.results, helveticaFont, yPosition);
    }
  }

  // Add page numbers
  addPageNumbers(pdfDoc, helveticaFont);

  // Save PDF
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);
}

/**
 * Generate Market Analysis Report (Analyses 6-14)
 */
export async function generateMarketAnalysisReport(
  data: BreakupsAnalysisResult,
  chartMap: Map<number, string>,
  outputPath: string
): Promise<void> {
  const pdfDoc = await PDFDocument.create();
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Filter analyses 6-14 (Categories B & C)
  const marketAnalyses = data.analyses.filter(a => a.id >= 6 && a.id <= 14);

  let page = pdfDoc.addPage(PageSizes.Letter);
  let yPosition = page.getHeight() - MARGINS.top;
  yPosition = addPageHeader(page, 'Market Analysis Report', helveticaBoldFont, yPosition);
  yPosition -= 40;

  for (let idx = 0; idx < marketAnalyses.length; idx++) {
    const analysis = marketAnalyses[idx];

    // Add new page every 2 analyses
    if (idx > 0 && idx % 2 === 0) {
      page = pdfDoc.addPage(PageSizes.Letter);
      yPosition = page.getHeight() - MARGINS.top;
      yPosition = addPageHeader(page, 'Market Analysis Report', helveticaBoldFont, yPosition);
      yPosition -= 40;
    }

    // Check if we need a new page
    if (yPosition < 200) {
      page = pdfDoc.addPage(PageSizes.Letter);
      yPosition = page.getHeight() - MARGINS.top;
      yPosition = addPageHeader(page, 'Market Analysis Report', helveticaBoldFont, yPosition);
      yPosition -= 40;
    }

    yPosition = addSectionHeading(page, `Analysis ${analysis.id}: ${analysis.name}`, helveticaBoldFont, yPosition);
    yPosition -= 20;

    // Category
    page.drawText(`Category: ${analysis.categoryName}`, {
      x: MARGINS.left,
      y: yPosition,
      size: FONTS.body,
      font: helveticaFont,
      color: COLORS.lightText,
    });
    yPosition -= 25;

    // Insight
    yPosition = addWrappedText(page, analysis.insight, helveticaFont, FONTS.body, yPosition, 450);
    yPosition -= 25;

    // Chart reference
    const chartPath = chartMap.get(analysis.id);
    if (chartPath) {
      const chartFile = path.basename(chartPath);
      page.drawText(`Chart: ${chartFile}`, {
        x: MARGINS.left,
        y: yPosition,
        size: FONTS.small,
        font: helveticaFont,
        color: COLORS.lightText,
      });
      yPosition -= 30;
    }
  }

  // Add page numbers
  addPageNumbers(pdfDoc, helveticaFont);

  // Save PDF
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);
}

/**
 * Generate Financial Analysis Report (Analyses 17-22)
 */
export async function generateFinancialAnalysisReport(
  data: BreakupsAnalysisResult,
  chartMap: Map<number, string>,
  outputPath: string
): Promise<void> {
  const pdfDoc = await PDFDocument.create();
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Filter analyses 17-22 (Category E)
  const financialAnalyses = data.analyses.filter(a => a.id >= 17 && a.id <= 22);

  let page = pdfDoc.addPage(PageSizes.Letter);
  let yPosition = page.getHeight() - MARGINS.top;
  yPosition = addPageHeader(page, 'Financial Analysis Report', helveticaBoldFont, yPosition);
  yPosition -= 40;

  for (let idx = 0; idx < financialAnalyses.length; idx++) {
    const analysis = financialAnalyses[idx];

    // Add new page for each analysis after the first
    if (idx > 0) {
      page = pdfDoc.addPage(PageSizes.Letter);
      yPosition = page.getHeight() - MARGINS.top;
      yPosition = addPageHeader(page, 'Financial Analysis Report', helveticaBoldFont, yPosition);
      yPosition -= 40;
    }

    yPosition = addSectionHeading(page, `Analysis ${analysis.id}: ${analysis.name}`, helveticaBoldFont, yPosition);
    yPosition -= 20;

    // Category
    page.drawText(`Category: ${analysis.categoryName}`, {
      x: MARGINS.left,
      y: yPosition,
      size: FONTS.body,
      font: helveticaFont,
      color: COLORS.lightText,
    });
    yPosition -= 25;

    // Financial metrics
    if (analysis.results && typeof analysis.results === 'object') {
      yPosition = addSectionHeading(page, 'Financial Metrics', helveticaBoldFont, yPosition);
      yPosition -= 15;
      yPosition = addResultsData(page, analysis.results, helveticaFont, yPosition);
      yPosition -= 20;
    }

    // Insight
    yPosition = addWrappedText(page, analysis.insight, helveticaFont, FONTS.body, yPosition, 450);
    yPosition -= 25;

    // Chart reference
    const chartPath = chartMap.get(analysis.id);
    if (chartPath) {
      const chartFile = path.basename(chartPath);
      page.drawText(`Chart: ${chartFile}`, {
        x: MARGINS.left,
        y: yPosition,
        size: FONTS.small,
        font: helveticaFont,
        color: COLORS.lightText,
      });
      yPosition -= 25;
    }
  }

  // Add page numbers
  addPageNumbers(pdfDoc, helveticaFont);

  // Save PDF
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);
}

/**
 * Generate Comparative Market Activity Report (Analyses 15-16)
 */
export async function generateMarketActivityReport(
  data: BreakupsAnalysisResult,
  chartMap: Map<number, string>,
  outputPath: string
): Promise<void> {
  const pdfDoc = await PDFDocument.create();
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Filter analyses 15-16 (Category D)
  const activityAnalyses = data.analyses.filter(a => a.id === 15 || a.id === 16);

  let page = pdfDoc.addPage(PageSizes.Letter);
  let yPosition = page.getHeight() - MARGINS.top;
  yPosition = addPageHeader(page, 'Comparative Market Activity Report', helveticaBoldFont, yPosition);
  yPosition -= 40;

  for (let idx = 0; idx < activityAnalyses.length; idx++) {
    const analysis = activityAnalyses[idx];

    // Add new page for second analysis
    if (idx > 0) {
      page = pdfDoc.addPage(PageSizes.Letter);
      yPosition = page.getHeight() - MARGINS.top;
      yPosition = addPageHeader(page, 'Comparative Market Activity Report', helveticaBoldFont, yPosition);
      yPosition -= 40;
    }

    yPosition = addSectionHeading(page, `Analysis ${analysis.id}: ${analysis.name}`, helveticaBoldFont, yPosition);
    yPosition -= 20;

    // Category
    page.drawText(`Category: ${analysis.categoryName}`, {
      x: MARGINS.left,
      y: yPosition,
      size: FONTS.body,
      font: helveticaFont,
      color: COLORS.lightText,
    });
    yPosition -= 25;

    // Market activity metrics
    if (analysis.results && typeof analysis.results === 'object') {
      yPosition = addSectionHeading(page, 'Market Activity Metrics', helveticaBoldFont, yPosition);
      yPosition -= 15;
      yPosition = addResultsData(page, analysis.results, helveticaFont, yPosition);
      yPosition -= 20;
    }

    // Insight
    yPosition = addWrappedText(page, analysis.insight, helveticaFont, FONTS.body, yPosition, 450);
    yPosition -= 25;

    // Chart reference
    const chartPath = chartMap.get(analysis.id);
    if (chartPath) {
      const chartFile = path.basename(chartPath);
      page.drawText(`Chart: ${chartFile}`, {
        x: MARGINS.left,
        y: yPosition,
        size: FONTS.small,
        font: helveticaFont,
        color: COLORS.lightText,
      });
      yPosition -= 30;
    }

    // Market velocity explanation
    if (analysis.id === 15) {
      yPosition = addSectionHeading(page, 'Market Velocity Analysis', helveticaBoldFont, yPosition);
      yPosition -= 15;
      yPosition = addWrappedText(
        page,
        'Absorption rate indicates how quickly properties are selling in the current market. A higher ratio of closed sales suggests strong buyer demand.',
        helveticaFont,
        FONTS.body,
        yPosition,
        450
      );
    } else if (analysis.id === 16) {
      yPosition = addSectionHeading(page, 'Market Momentum Analysis', helveticaBoldFont, yPosition);
      yPosition -= 15;
      yPosition = addWrappedText(
        page,
        'Pending ratio shows the current pipeline of properties moving toward closing. A higher pending ratio indicates strong market momentum and buyer activity.',
        helveticaFont,
        FONTS.body,
        yPosition,
        450
      );
    }
  }

  // Add page numbers
  addPageNumbers(pdfDoc, helveticaFont);

  // Save PDF
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);
}

// ============================================================================
// Helper Functions - Document Layout
// ============================================================================

/**
 * Add page header
 */
function addPageHeader(page: any, title: string, font: any, yPosition: number): number {
  // Title
  page.drawText(title, {
    x: MARGINS.left,
    y: yPosition,
    size: FONTS.title,
    font: font,
    color: COLORS.primary,
  });

  yPosition -= 15;

  // Horizontal line
  page.drawLine({
    start: { x: MARGINS.left, y: yPosition },
    end: { x: page.getWidth() - MARGINS.right, y: yPosition },
    thickness: 1,
    color: COLORS.border,
  });

  return yPosition - 10;
}

/**
 * Add section heading
 */
function addSectionHeading(page: any, heading: string, font: any, yPosition: number): number {
  page.drawText(heading, {
    x: MARGINS.left,
    y: yPosition,
    size: FONTS.heading2,
    font: font,
    color: COLORS.primary,
  });
  return yPosition - 10;
}

/**
 * Add property details box
 */
function addPropertyDetailsBox(
  page: any,
  property: BreakupsAnalysisResult['subjectProperty'],
  font: any,
  boldFont: any,
  yPosition: number
): number {
  const boxHeight = 120;
  const startY = yPosition;

  // Draw box
  page.drawRectangle({
    x: MARGINS.left,
    y: yPosition - boxHeight,
    width: 500,
    height: boxHeight,
    borderColor: COLORS.border,
    borderWidth: 1,
    color: COLORS.background,
  });

  yPosition -= 20;

  // Title
  page.drawText('Subject Property', {
    x: MARGINS.left + 10,
    y: yPosition,
    size: FONTS.heading2,
    font: boldFont,
    color: COLORS.primary,
  });

  yPosition -= 25;

  // Address
  page.drawText(property.address, {
    x: MARGINS.left + 10,
    y: yPosition,
    size: FONTS.body,
    font: font,
    color: COLORS.text,
  });

  yPosition -= 18;

  // APN
  if (property.apn) {
    page.drawText(`APN: ${property.apn}`, {
      x: MARGINS.left + 10,
      y: yPosition,
      size: FONTS.body,
      font: font,
      color: COLORS.text,
    });
    yPosition -= 18;
  }

  // Price
  if (property.price) {
    page.drawText(`Price: ${formatCurrency(property.price)}`, {
      x: MARGINS.left + 10,
      y: yPosition,
      size: FONTS.body,
      font: font,
      color: COLORS.text,
    });
    yPosition -= 18;
  }

  // Property details
  if (property.sqft && property.bedrooms && property.bathrooms) {
    page.drawText(
      `${property.sqft} sqft | ${property.bedrooms} BR | ${property.bathrooms} BA`,
      {
        x: MARGINS.left + 10,
        y: yPosition,
        size: FONTS.body,
        font: font,
        color: COLORS.text,
      }
    );
  }

  return startY - boxHeight - 10;
}

/**
 * Add metrics list
 */
function addMetricsList(page: any, metrics: Array<{ label: string; value: string }>, font: any, yPosition: number): number {
  metrics.forEach(metric => {
    page.drawText(`${metric.label}: ${metric.value}`, {
      x: MARGINS.left,
      y: yPosition,
      size: FONTS.body,
      font: font,
      color: COLORS.text,
    });
    yPosition -= 18;
  });
  return yPosition;
}

/**
 * Add bullet list
 */
function addBulletList(page: any, items: string[], font: any, yPosition: number): number {
  items.forEach((item, idx) => {
    const bulletText = `${idx + 1}. ${item}`;
    yPosition = addWrappedText(page, bulletText, font, FONTS.body, yPosition, 450);
    yPosition -= 15;
  });
  return yPosition;
}

/**
 * Add investment highlights
 */
function addInvestmentHighlights(page: any, data: BreakupsAnalysisResult, font: any, yPosition: number): number {
  const noiAnalysis = data.analyses.find(a => a.id === 21);
  const improvementAnalysis = data.analyses.find(a => a.id === 22);

  if (noiAnalysis) {
    const text = `• Expected Annual NOI: ${noiAnalysis.insight}`;
    yPosition = addWrappedText(page, text, font, FONTS.body, yPosition, 450);
    yPosition -= 15;
  }

  if (improvementAnalysis) {
    const text = `• Improvement Potential: ${improvementAnalysis.insight}`;
    yPosition = addWrappedText(page, text, font, FONTS.body, yPosition, 450);
    yPosition -= 15;
  }

  return yPosition;
}

/**
 * Add findings with titles and descriptions
 */
function addFindings(
  page: any,
  findings: Array<{ title: string; description: string }>,
  font: any,
  boldFont: any,
  yPosition: number
): number {
  findings.forEach((finding, idx) => {
    page.drawText(`${idx + 1}. ${finding.title}`, {
      x: MARGINS.left,
      y: yPosition,
      size: FONTS.heading3,
      font: boldFont,
      color: COLORS.primary,
    });
    yPosition -= 18;

    yPosition = addWrappedText(page, finding.description, font, FONTS.body, yPosition, 450);
    yPosition -= 20;
  });
  return yPosition;
}

/**
 * Add text lines
 */
function addTextLines(page: any, lines: string[], font: any, fontSize: number, yPosition: number): number {
  lines.forEach(line => {
    page.drawText(line, {
      x: MARGINS.left,
      y: yPosition,
      size: fontSize,
      font: font,
      color: COLORS.text,
    });
    yPosition -= 18;
  });
  return yPosition;
}

/**
 * Add wrapped text
 */
function addWrappedText(page: any, text: string, font: any, fontSize: number, yPosition: number, maxWidth: number): number {
  const words = text.split(' ');
  let line = '';
  const lines: string[] = [];

  words.forEach(word => {
    const testLine = line + (line ? ' ' : '') + word;
    const width = font.widthOfTextAtSize(testLine, fontSize);

    if (width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  });

  if (line) {
    lines.push(line);
  }

  lines.forEach(line => {
    page.drawText(line, {
      x: MARGINS.left,
      y: yPosition,
      size: fontSize,
      font: font,
      color: COLORS.text,
    });
    yPosition -= fontSize + 4;
  });

  return yPosition;
}

/**
 * Add results data
 */
function addResultsData(page: any, results: any, font: any, yPosition: number): number {
  const entries = Object.entries(results);

  entries.forEach(([key, value]) => {
    const displayKey = formatKey(key);
    const displayValue = formatValue(value);

    page.drawText(`${displayKey}: ${displayValue}`, {
      x: MARGINS.left + 10,
      y: yPosition,
      size: FONTS.body,
      font: font,
      color: COLORS.text,
    });
    yPosition -= 16;
  });

  return yPosition;
}

/**
 * Add page numbers to all pages
 */
function addPageNumbers(pdfDoc: any, font: any): void {
  const pages = pdfDoc.getPages();

  pages.forEach((page: any, index: number) => {
    const { height } = page.getSize();

    // Horizontal line
    page.drawLine({
      start: { x: MARGINS.left, y: MARGINS.bottom - 20 },
      end: { x: page.getWidth() - MARGINS.right, y: MARGINS.bottom - 20 },
      thickness: 1,
      color: COLORS.border,
    });

    // Page number
    const pageText = `Page ${index + 1} of ${pages.length}`;
    const textWidth = font.widthOfTextAtSize(pageText, FONTS.small);

    page.drawText(pageText, {
      x: (page.getWidth() - textWidth) / 2,
      y: MARGINS.bottom - 35,
      size: FONTS.small,
      font: font,
      color: COLORS.lightText,
    });

    // Generated timestamp
    const timestamp = `Generated: ${new Date().toLocaleDateString()}`;
    const timestampWidth = font.widthOfTextAtSize(timestamp, FONTS.small);

    page.drawText(timestamp, {
      x: page.getWidth() - MARGINS.right - timestampWidth,
      y: MARGINS.bottom - 35,
      size: FONTS.small,
      font: font,
      color: COLORS.lightText,
    });
  });
}

// ============================================================================
// Helper Functions - Data Extraction
// ============================================================================

/**
 * Map chart paths to analysis IDs
 */
function mapChartsToAnalyses(chartPaths: string[]): Map<number, string> {
  const map = new Map<number, string>();

  chartPaths.forEach(chartPath => {
    const filename = path.basename(chartPath);
    const match = filename.match(/^(\d+)_/) || filename.match(/analysis_(\d+)/);
    if (match) {
      const analysisId = parseInt(match[1], 10);
      map.set(analysisId, chartPath);
    }
  });

  return map;
}

/**
 * Get top insights from analyses
 */
function getTopInsights(analyses: AnalysisItem[], count: number): string[] {
  return analyses
    .slice(0, count)
    .map(a => a.insight)
    .filter(Boolean);
}

/**
 * Extract top findings
 */
function extractTopFindings(
  analyses: AnalysisItem[],
  count: number
): Array<{ title: string; description: string }> {
  return analyses.slice(0, count).map(a => ({
    title: a.name,
    description: a.insight || 'No insight available',
  }));
}

// ============================================================================
// Helper Functions - Formatting
// ============================================================================

/**
 * Format currency value
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format percentage value
 */
function formatPercent(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * Format object key for display
 */
function formatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

/**
 * Format value for display
 */
function formatValue(value: any): string {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'number') {
    if (value > 1000) return formatCurrency(value);
    return value.toFixed(2);
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
