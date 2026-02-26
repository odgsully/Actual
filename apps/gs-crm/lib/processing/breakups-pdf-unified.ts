/**
 * Unified Professional PDF Report Generator
 *
 * Generates a single comprehensive PDF report with:
 * - Professional cover page with branding
 * - Hyperlinked table of contents
 * - All 22 analyses with embedded charts
 * - Branded footer (logo + Garrett Sullivan)
 *
 * @module lib/processing/breakups-pdf-unified
 */

import { PDFDocument, PDFPage, rgb, StandardFonts, PageSizes, PDFImage } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

const LOG_PREFIX = '[Unified PDF Generator]';

// ============================================================================
// Type Definitions
// ============================================================================

export interface UnifiedPDFOptions {
  analysisResults: any;
  chartPaths: string[];
  outputPath: string;
  subjectPropertyAddress: string;
  logoPath?: string;
}

export interface PDFGenerationResult {
  success: boolean;
  filePath: string;
  fileSize: number;
  pageCount: number;
  generationTime: number;
  error?: string;
}

// ============================================================================
// Color Scheme & Layout Constants
// ============================================================================

const COLORS = {
  primary: rgb(0.71, 0.62, 0.38),      // Gold #B59F61 (matches logo)
  secondary: rgb(0.12, 0.25, 0.69),    // Blue #1E40AF
  text: rgb(0.12, 0.16, 0.22),         // Dark gray #1F2937
  lightText: rgb(0.42, 0.45, 0.50),    // Medium gray #6B7280
  background: rgb(0.98, 0.98, 0.98),   // Light background #F9FAFB
  border: rgb(0.90, 0.91, 0.92),       // Light border #E5E7EB
  white: rgb(1, 1, 1),
  black: rgb(0, 0, 0),
};

const MARGINS = {
  top: 72,
  bottom: 72,
  left: 72,
  right: 72,
};

const FONTS = {
  title: 28,
  heading1: 20,
  heading2: 16,
  heading3: 12,
  body: 10,
  small: 8,
};

const FOOTER_HEIGHT = 50;

// ============================================================================
// Main Generator Function
// ============================================================================

/**
 * Generate unified professional PDF report
 */
export async function generateUnifiedPDFReport(
  options: UnifiedPDFOptions
): Promise<PDFGenerationResult> {
  const startTime = Date.now();
  console.log(`${LOG_PREFIX} Starting unified PDF generation`);

  try {
    // Create new PDF document
    const pdfDoc = await PDFDocument.create();

    // Embed fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const timesFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    // Load and embed logo
    let logoImage: PDFImage | null = null;
    const logoPath = options.logoPath || path.join(process.cwd(), 'logo1.png');
    if (fs.existsSync(logoPath)) {
      const logoBytes = fs.readFileSync(logoPath);
      logoImage = await pdfDoc.embedPng(logoBytes);
      console.log(`${LOG_PREFIX} Logo embedded from ${logoPath}`);
    } else {
      console.warn(`${LOG_PREFIX} Logo not found at ${logoPath}`);
    }

    // Load chart images
    const chartImages = await loadChartImages(pdfDoc, options.chartPaths);
    console.log(`${LOG_PREFIX} Loaded ${chartImages.size} chart images`);

    // Page tracking for TOC
    const pageReferences: Map<string, number> = new Map();

    // 1. Generate Cover Page
    console.log(`${LOG_PREFIX} Generating cover page...`);
    await generateCoverPage(
      pdfDoc,
      helveticaBoldFont,
      timesBoldFont,
      logoImage,
      options.subjectPropertyAddress
    );

    // 2. Generate Table of Contents (will update page numbers later)
    console.log(`${LOG_PREFIX} Generating table of contents...`);
    const tocPageIndex = pdfDoc.getPageCount();
    await generateTableOfContents(
      pdfDoc,
      helveticaBoldFont,
      helveticaFont,
      pageReferences
    );

    // 3. Generate Executive Summary
    console.log(`${LOG_PREFIX} Generating executive summary...`);
    pageReferences.set('executive-summary', pdfDoc.getPageCount());
    await generateExecutiveSummary(
      pdfDoc,
      helveticaBoldFont,
      helveticaFont,
      options.analysisResults
    );

    // 4. Generate Analysis Sections (Categories A-E)
    console.log(`${LOG_PREFIX} Generating analysis sections...`);
    await generateAnalysisSections(
      pdfDoc,
      helveticaBoldFont,
      helveticaFont,
      options.analysisResults.analyses,
      chartImages,
      pageReferences
    );

    // 5. Add footer to all pages except cover
    console.log(`${LOG_PREFIX} Adding footers...`);
    await addFootersToPages(
      pdfDoc,
      helveticaFont,
      logoImage
    );

    // 6. Update TOC with actual page numbers and add hyperlinks
    console.log(`${LOG_PREFIX} Updating table of contents with page numbers...`);
    await updateTableOfContents(
      pdfDoc,
      tocPageIndex,
      helveticaFont,
      pageReferences
    );

    // Save PDF
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(options.outputPath, pdfBytes);

    const fileSize = fs.statSync(options.outputPath).size;
    const pageCount = pdfDoc.getPageCount();
    const generationTime = Date.now() - startTime;

    console.log(`${LOG_PREFIX} PDF generated successfully:`);
    console.log(`  - File: ${options.outputPath}`);
    console.log(`  - Size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  - Pages: ${pageCount}`);
    console.log(`  - Time: ${generationTime}ms`);

    return {
      success: true,
      filePath: options.outputPath,
      fileSize,
      pageCount,
      generationTime,
    };
  } catch (error) {
    console.error(`${LOG_PREFIX} Error generating PDF:`, error);
    return {
      success: false,
      filePath: '',
      fileSize: 0,
      pageCount: 0,
      generationTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================================================
// Cover Page
// ============================================================================

async function generateCoverPage(
  pdfDoc: PDFDocument,
  boldFont: any,
  titleFont: any,
  logoImage: PDFImage | null,
  address: string
): Promise<void> {
  const page = pdfDoc.addPage(PageSizes.Letter);
  const { width, height } = page.getSize();

  // Background color
  page.drawRectangle({
    x: 0,
    y: 0,
    width: width,
    height: height,
    color: COLORS.white,
  });

  let yPosition = height - 340; // Start much lower - more white space at top

  // Logo (smaller, centered with breathing room for text)
  if (logoImage) {
    const logoDims = logoImage.scale(0.175); // 30% smaller (0.25 * 0.7)
    const logoX = (width - logoDims.width) / 2;
    page.drawImage(logoImage, {
      x: logoX,
      y: yPosition,
      width: logoDims.width,
      height: logoDims.height,
    });
    yPosition -= logoDims.height + 25; // Add breathing room
  }

  // Main title
  const title = 'Property Analysis Report';
  const titleSize = FONTS.title;
  const titleWidth = titleFont.widthOfTextAtSize(title, titleSize);
  page.drawText(title, {
    x: (width - titleWidth) / 2,
    y: yPosition,
    size: titleSize,
    font: titleFont,
    color: COLORS.primary,
  });
  yPosition -= 45; // Good spacing to Subject Property

  // Subject Property Section
  page.drawText('Subject Property', {
    x: (width - boldFont.widthOfTextAtSize('Subject Property', FONTS.heading2)) / 2,
    y: yPosition,
    size: FONTS.heading2,
    font: boldFont,
    color: COLORS.text,
  });
  yPosition -= 40;

  // Address (wrapped if needed)
  const addressLines = wrapText(address, boldFont, FONTS.heading1, width - 150);
  for (const line of addressLines) {
    const lineWidth = boldFont.widthOfTextAtSize(line, FONTS.heading1);
    page.drawText(line, {
      x: (width - lineWidth) / 2,
      y: yPosition,
      size: FONTS.heading1,
      font: boldFont,
      color: COLORS.secondary,
    });
    yPosition -= 30;
  }

  yPosition -= 80;

  // Prepared by
  const preparedBy = 'Prepared by';
  const preparedByWidth = boldFont.widthOfTextAtSize(preparedBy, FONTS.body);
  page.drawText(preparedBy, {
    x: (width - preparedByWidth) / 2,
    y: yPosition,
    size: FONTS.body,
    font: boldFont,
    color: COLORS.lightText,
  });
  yPosition -= 30;

  const name = 'Garrett Sullivan';
  const nameWidth = boldFont.widthOfTextAtSize(name, FONTS.heading2);
  page.drawText(name, {
    x: (width - nameWidth) / 2,
    y: yPosition,
    size: FONTS.heading2,
    font: boldFont,
    color: COLORS.primary,
  });
  yPosition -= 60;

  // Date
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const dateWidth = boldFont.widthOfTextAtSize(date, FONTS.body);
  page.drawText(date, {
    x: (width - dateWidth) / 2,
    y: yPosition,
    size: FONTS.body,
    font: boldFont,
    color: COLORS.lightText,
  });
}

// ============================================================================
// Table of Contents
// ============================================================================

async function generateTableOfContents(
  pdfDoc: PDFDocument,
  boldFont: any,
  regularFont: any,
  pageReferences: Map<string, number>
): Promise<void> {
  const page = pdfDoc.addPage(PageSizes.Letter);
  const { width, height } = page.getSize();
  let yPosition = height - MARGINS.top;

  // Title
  page.drawText('Table of Contents', {
    x: MARGINS.left,
    y: yPosition,
    size: FONTS.heading1,
    font: boldFont,
    color: COLORS.primary,
  });
  yPosition -= 20;

  // Horizontal line
  page.drawLine({
    start: { x: MARGINS.left, y: yPosition },
    end: { x: width - MARGINS.right, y: yPosition },
    thickness: 2,
    color: COLORS.primary,
  });
  yPosition -= 50;

  // TOC Entries (page numbers will be added later)
  const tocEntries = [
    { key: 'executive-summary', label: 'Executive Summary', level: 0 },
    { key: 'category-a', label: 'Property Characteristics', level: 0 },
    { key: 'analysis-1', label: 'Analysis 1: Bedroom Distribution', level: 1 },
    { key: 'analysis-2', label: 'Analysis 2: HOA Fee Analysis', level: 1 },
    { key: 'analysis-3', label: 'Analysis 3: STR vs Non-STR Properties', level: 1 },
    { key: 'analysis-4', label: 'Analysis 4: Renovation Impact', level: 1 },
    { key: 'analysis-5', label: 'Analysis 5: Comps Classification', level: 1 },
    { key: 'category-b', label: 'Market Positioning', level: 0 },
    { key: 'analysis-6', label: 'Analysis 6: Square Footage Variance', level: 1 },
    { key: 'analysis-7', label: 'Analysis 7: Price Variance', level: 1 },
    { key: 'analysis-8', label: 'Analysis 8: Lease vs Sale Properties', level: 1 },
    { key: 'analysis-9', label: 'Analysis 9: PropertyRadar Comps', level: 1 },
    { key: 'analysis-10', label: 'Analysis 10: Individual PropertyRadar Comps', level: 1 },
    { key: 'category-c', label: 'Time & Location', level: 0 },
    { key: 'analysis-11', label: 'Analysis 11: Bedroom Precision', level: 1 },
    { key: 'analysis-12', label: 'Analysis 12: Time Frame Analysis', level: 1 },
    { key: 'analysis-13', label: 'Analysis 13: Direct vs Indirect Comps', level: 1 },
    { key: 'analysis-14', label: 'Analysis 14: Recent Direct vs Indirect', level: 1 },
    { key: 'category-d', label: 'Market Activity', level: 0 },
    { key: 'analysis-15', label: 'Analysis 15: Active vs Closed Properties', level: 1 },
    { key: 'analysis-16', label: 'Analysis 16: Active vs Pending Properties', level: 1 },
    { key: 'category-e', label: 'Financial Impact', level: 0 },
    { key: 'analysis-17', label: 'Analysis 17: Renovation Price Delta', level: 1 },
    { key: 'analysis-18', label: 'Analysis 18: Partial Renovation Delta', level: 1 },
    { key: 'analysis-19', label: 'Analysis 19: Interquartile Ranges', level: 1 },
    { key: 'analysis-20', label: 'Analysis 20: Distribution Tails', level: 1 },
    { key: 'analysis-21', label: 'Analysis 21: Expected Net Operating Income', level: 1 },
    { key: 'analysis-22', label: 'Analysis 22: Improved Net Operating Income', level: 1 },
  ];

  // Track TOC entries with their page and position for later page number updates
  const tocEntryPositions: Array<{ entry: any; page: any; yPosition: number; font: any }> = [];

  // Draw placeholder entries (will be updated with page numbers later)
  let currentPage = page;
  for (const entry of tocEntries) {
    const indent = entry.level * 20;
    const font = entry.level === 0 ? boldFont : regularFont;
    const size = entry.level === 0 ? FONTS.body + 1 : FONTS.body;

    // Check if we need a new page BEFORE drawing (not after)
    // Need extra space for page number on right side (added later)
    const lineHeight = entry.level === 0 ? 25 : 20;
    // Break to new page earlier to ensure page numbers don't overlap footer
    // Financial Impact section should start on page 2
    if (yPosition < MARGINS.bottom + FOOTER_HEIGHT + 100) {
      currentPage = pdfDoc.addPage(PageSizes.Letter);
      yPosition = currentPage.getHeight() - MARGINS.top;

      // Add continuation header
      currentPage.drawText('Table of Contents (continued)', {
        x: MARGINS.left,
        y: yPosition,
        size: FONTS.heading3,
        font: boldFont,
        color: COLORS.primary,
      });
      yPosition -= 40;
    }

    // Draw the label
    currentPage.drawText(entry.label, {
      x: MARGINS.left + indent,
      y: yPosition,
      size: size,
      font: font,
      color: COLORS.text,
    });

    // Store this entry's position for page number update
    tocEntryPositions.push({
      entry: entry,
      page: currentPage,
      yPosition: yPosition,
      font: font,
    });

    yPosition -= lineHeight;
  }

  // Store for later update
  (pdfDoc as any)._tocEntryPositions = tocEntryPositions;
}

// ============================================================================
// Executive Summary
// ============================================================================

async function generateExecutiveSummary(
  pdfDoc: PDFDocument,
  boldFont: any,
  regularFont: any,
  analysisResults: any
): Promise<void> {
  const page = pdfDoc.addPage(PageSizes.Letter);
  const { width, height } = page.getSize();
  let yPosition = height - MARGINS.top;

  // Section header
  yPosition = addSectionHeader(page, 'Executive Summary', boldFont, yPosition, width);
  yPosition -= 30;

  // Key metrics
  const metrics = [
    { label: 'Property Count', value: analysisResults.propertyCount || 0 },
    { label: 'Analysis Date', value: new Date(analysisResults.analysisDate).toLocaleDateString() },
    { label: 'Data Quality', value: analysisResults.summary?.dataQuality || 'Good' },
    { label: 'Confidence Level', value: `${analysisResults.summary?.overallConfidence || 85}%` },
  ];

  for (const metric of metrics) {
    page.drawText(`${metric.label}:`, {
      x: MARGINS.left,
      y: yPosition,
      size: FONTS.body,
      font: boldFont,
      color: COLORS.text,
    });

    page.drawText(String(metric.value), {
      x: MARGINS.left + 150,
      y: yPosition,
      size: FONTS.body,
      font: regularFont,
      color: COLORS.text,
    });

    yPosition -= 20;
  }

  yPosition -= 30;

  // Top findings
  page.drawText('Top Findings', {
    x: MARGINS.left,
    y: yPosition,
    size: FONTS.heading3,
    font: boldFont,
    color: COLORS.primary,
  });
  yPosition -= 25;

  const topAnalyses = analysisResults.analyses.slice(0, 5);
  for (let i = 0; i < topAnalyses.length; i++) {
    const analysis = topAnalyses[i];
    const bulletText = `${i + 1}. ${analysis.name}`;
    yPosition = addWrappedText(page, bulletText, regularFont, FONTS.body, yPosition, width - MARGINS.left - MARGINS.right, MARGINS.left);
    yPosition -= 10;

    const insight = analysis.insight || 'No insight available';
    yPosition = addWrappedText(page, `   ${insight}`, regularFont, FONTS.small, yPosition, width - MARGINS.left - MARGINS.right - 20, MARGINS.left + 20);
    yPosition -= 15;
  }
}

// ============================================================================
// Analysis Sections
// ============================================================================

async function generateAnalysisSections(
  pdfDoc: PDFDocument,
  boldFont: any,
  regularFont: any,
  analyses: any[],
  chartImages: Map<string, PDFImage>,
  pageReferences: Map<string, number>
): Promise<void> {
  // Group analyses by category
  const categories = [
    { key: 'category-a', name: 'Property Characteristics', ids: ['1A', '1B', 2, '3A', '3B', '4A', '4B', 5] as (string | number)[] },
    { key: 'category-b', name: 'Market Positioning', ids: ['6A', '6B', '7A', '7B', 8, 9, 10] as (string | number)[] },
    { key: 'category-c', name: 'Time & Location', ids: ['11A', '11B', 12, 13, 14] as (string | number)[] },
    { key: 'category-d', name: 'Market Activity', ids: ['15A', '15B', '16A', '16B'] as (string | number)[] },
    { key: 'category-e', name: 'Financial Impact', ids: ['17A', '17B', '18A', '18B', '19A', '19B', '20A', '20B', 21, 22] as (string | number)[] },
  ];

  for (const category of categories) {
    // Add category page reference
    pageReferences.set(category.key, pdfDoc.getPageCount());

    // Start new page for category
    let page = pdfDoc.addPage(PageSizes.Letter);
    let yPosition = page.getHeight() - MARGINS.top;

    // Category header
    yPosition = addSectionHeader(page, category.name, boldFont, yPosition, page.getWidth());
    yPosition -= 40;

    // Render each analysis in this category
    for (const id of category.ids) {
      const analysis = analyses.find(a => a.id === id);
      if (!analysis) continue;

      // Store page reference for this analysis
      // Use base number key (e.g., 'analysis-1') for TOC matching; only set for first variant (A or solo)
      const idStr = String(id);
      const baseNumStr = idStr.replace(/[abAB]$/, '');
      const tocKey = `analysis-${baseNumStr}`;
      if (!pageReferences.has(tocKey)) {
        pageReferences.set(tocKey, pdfDoc.getPageCount() - 1);
      }

      // Check if we need a new page
      if (yPosition < 400) { // Need space for analysis + chart
        page = pdfDoc.addPage(PageSizes.Letter);
        yPosition = page.getHeight() - MARGINS.top;
      }

      // Analysis title
      page.drawText(`Analysis ${analysis.id}: ${analysis.name}`, {
        x: MARGINS.left,
        y: yPosition,
        size: FONTS.heading3,
        font: boldFont,
        color: COLORS.secondary,
      });
      yPosition -= 25;

      // Category label
      page.drawText(`Category: ${analysis.categoryName}`, {
        x: MARGINS.left,
        y: yPosition,
        size: FONTS.small,
        font: regularFont,
        color: COLORS.lightText,
      });
      yPosition -= 25;

      // Insight
      if (analysis.insight) {
        yPosition = addWrappedText(
          page,
          analysis.insight,
          regularFont,
          FONTS.body,
          yPosition,
          page.getWidth() - MARGINS.left - MARGINS.right,
          MARGINS.left
        );
        yPosition -= 20;
      }

      // Embed chart if available — use full ID for lookup (e.g., '1a', '15b', '2')
      const chartKey = String(analysis.id).toLowerCase();
      const chartImage = chartImages.get(chartKey);
      if (chartImage) {
        const chartScale = 0.8;
        const chartDims = chartImage.scale(chartScale);
        const maxWidth = page.getWidth() - MARGINS.left - MARGINS.right;
        const maxHeight = 250;

        let chartWidth = chartDims.width;
        let chartHeight = chartDims.height;

        // Scale down if too large
        if (chartWidth > maxWidth) {
          const scale = maxWidth / chartWidth;
          chartWidth = maxWidth;
          chartHeight = chartHeight * scale;
        }
        if (chartHeight > maxHeight) {
          const scale = maxHeight / chartHeight;
          chartHeight = maxHeight;
          chartWidth = chartWidth * scale;
        }

        // Check if chart fits on current page
        if (yPosition - chartHeight < MARGINS.bottom + FOOTER_HEIGHT + 20) {
          page = pdfDoc.addPage(PageSizes.Letter);
          yPosition = page.getHeight() - MARGINS.top;
        }

        // Draw chart (centered)
        const chartX = (page.getWidth() - chartWidth) / 2;
        page.drawImage(chartImage, {
          x: chartX,
          y: yPosition - chartHeight,
          width: chartWidth,
          height: chartHeight,
        });

        yPosition -= chartHeight + 30;
      } else {
        console.warn(`${LOG_PREFIX} Chart image not found for analysis ${id}`);
      }

      yPosition -= 10;
    }
  }
}

// ============================================================================
// Footer
// ============================================================================

async function addFootersToPages(
  pdfDoc: PDFDocument,
  font: any,
  logoImage: PDFImage | null
): Promise<void> {
  const pages = pdfDoc.getPages();

  for (let i = 1; i < pages.length; i++) { // Skip cover page (index 0)
    const page = pages[i];
    const { width, height } = page.getSize();

    // Horizontal line
    const lineY = MARGINS.bottom + 25;
    page.drawLine({
      start: { x: MARGINS.left, y: lineY },
      end: { x: width - MARGINS.right, y: lineY },
      thickness: 1,
      color: COLORS.border,
    });

    // Footer elements positioned below the line
    const footerY = MARGINS.bottom + 10;

    // Logo (small, left side) - 50% smaller
    if (logoImage) {
      const logoScale = 0.0225; // Half of previous size (0.045 / 2)
      const logoDims = logoImage.scale(logoScale);
      page.drawImage(logoImage, {
        x: MARGINS.left,
        y: footerY - 2,
        width: logoDims.width,
        height: logoDims.height,
      });
    }

    // Name (next to logo)
    page.drawText('Garrett Sullivan', {
      x: MARGINS.left + 25,
      y: footerY,
      size: FONTS.small,
      font: font,
      color: COLORS.primary,
    });

    // Page number (center)
    const pageNum = `Page ${i} of ${pages.length - 1}`;
    const pageNumWidth = font.widthOfTextAtSize(pageNum, FONTS.small);
    page.drawText(pageNum, {
      x: (width - pageNumWidth) / 2,
      y: footerY,
      size: FONTS.small,
      font: font,
      color: COLORS.lightText,
    });

    // Date (right side, top line)
    const date = new Date().toLocaleDateString();
    const dateWidth = font.widthOfTextAtSize(date, FONTS.small);
    page.drawText(date, {
      x: width - MARGINS.right - dateWidth,
      y: footerY,
      size: FONTS.small,
      font: font,
      color: COLORS.lightText,
    });

    // AI report message (right side, below date)
    const aiMessage = 'AI report by GS, ask me about it for more info';
    const aiMessageWidth = font.widthOfTextAtSize(aiMessage, FONTS.small - 1);
    page.drawText(aiMessage, {
      x: width - MARGINS.right - aiMessageWidth,
      y: footerY - 10,
      size: FONTS.small - 1,
      font: font,
      color: COLORS.lightText,
    });
  }
}

// ============================================================================
// Update Table of Contents
// ============================================================================

async function updateTableOfContents(
  pdfDoc: PDFDocument,
  tocPageIndex: number,
  font: any,
  pageReferences: Map<string, number>
): Promise<void> {
  const tocEntryPositions = (pdfDoc as any)._tocEntryPositions;

  if (!tocEntryPositions) {
    console.warn('[PDF Generator] No TOC entry positions found for updating');
    return;
  }

  // Update each entry with its page number on the correct TOC page
  for (const item of tocEntryPositions) {
    const { entry, page, yPosition, font: itemFont } = item;
    const pageNum = pageReferences.get(entry.key);

    if (pageNum !== undefined) {
      // Draw page number (right-aligned) on the same page where the label was drawn
      const pageNumText = String(pageNum);
      const pageNumWidth = itemFont.widthOfTextAtSize(pageNumText, FONTS.body);

      page.drawText(pageNumText, {
        x: page.getWidth() - MARGINS.right - pageNumWidth,
        y: yPosition,
        size: FONTS.body,
        font: itemFont,
        color: COLORS.text,
      });

      // TODO: Add hyperlink annotation using proper pdf-lib API
      // Skipping for now to avoid errors - can be added later with correct API
    }
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function addSectionHeader(
  page: PDFPage,
  title: string,
  font: any,
  yPosition: number,
  width: number
): number {
  page.drawText(title, {
    x: MARGINS.left,
    y: yPosition,
    size: FONTS.heading1,
    font: font,
    color: COLORS.primary,
  });

  yPosition -= 15;

  page.drawLine({
    start: { x: MARGINS.left, y: yPosition },
    end: { x: width - MARGINS.right, y: yPosition },
    thickness: 2,
    color: COLORS.primary,
  });

  return yPosition - 10;
}

function addWrappedText(
  page: PDFPage,
  text: string,
  font: any,
  fontSize: number,
  yPosition: number,
  maxWidth: number,
  xPosition: number
): number {
  const lines = wrapText(text, font, fontSize, maxWidth);

  for (const line of lines) {
    page.drawText(line, {
      x: xPosition,
      y: yPosition,
      size: fontSize,
      font: font,
      color: COLORS.text,
    });
    yPosition -= fontSize + 4;
  }

  return yPosition;
}

function wrapText(text: string, font: any, fontSize: number, maxWidth: number): string[] {
  // Split on newlines first to handle \n characters (pdf-lib WinAnsi can't encode them)
  const paragraphs = text.split(/\n/);
  const allLines: string[] = [];

  for (const paragraph of paragraphs) {
    if (paragraph.trim() === '') {
      allLines.push('');
      continue;
    }
    const words = paragraph.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const width = font.widthOfTextAtSize(testLine, fontSize);

      if (width > maxWidth && currentLine) {
        allLines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      allLines.push(currentLine);
    }
  }

  return allLines;
}

async function loadChartImages(
  pdfDoc: PDFDocument,
  chartPaths: string[]
): Promise<Map<string, PDFImage>> {
  const chartMap = new Map<string, PDFImage>();

  for (const chartPath of chartPaths) {
    try {
      if (!fs.existsSync(chartPath)) {
        console.warn(`${LOG_PREFIX} Chart not found: ${chartPath}`);
        continue;
      }

      const chartBytes = fs.readFileSync(chartPath);
      const chartImage = await pdfDoc.embedPng(chartBytes);

      // Extract analysis ID from filename (e.g., analysis_01a_br_distribution.png -> '1a', analysis_02_hoa.png -> '2')
      const filename = path.basename(chartPath);
      const match = filename.match(/analysis_(\d+[ab]?)/i);
      if (match) {
        const analysisId = match[1].toLowerCase().replace(/^0+/, '') || '0';
        chartMap.set(analysisId, chartImage);
      }
    } catch (error) {
      console.error(`${LOG_PREFIX} Error loading chart ${chartPath}:`, error);
    }
  }

  return chartMap;
}
