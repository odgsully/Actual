/**
 * Test script for PDF generation with pdf-lib
 * This tests that the new PDF generator works without font loading errors
 */

import { PDFDocument, rgb, StandardFonts, PageSizes } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('=== pdf-lib PDF Generation Test ===\n');

async function testPDFGeneration() {
  const outputDir = path.join(__dirname, 'tmp', 'test-pdfs');

  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`✓ Created output directory: ${outputDir}`);
  }

  try {
    // Test 1: Simple PDF with standard fonts
    console.log('\nTest 1: Creating simple test PDF with pdf-lib...');
    const pdfDoc = await PDFDocument.create();
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const page = pdfDoc.addPage(PageSizes.Letter);
    const { width, height } = page.getSize();

    // Title
    page.drawText('ReportIt PDF Generation Test', {
      x: 72,
      y: height - 72,
      size: 24,
      font: helveticaBoldFont,
      color: rgb(0.12, 0.25, 0.69),
    });

    // Subtitle
    page.drawText('Generated with pdf-lib (No external fonts required)', {
      x: 72,
      y: height - 110,
      size: 14,
      font: helveticaFont,
      color: rgb(0.39, 0.46, 0.55),
    });

    // Subject Property Box
    page.drawRectangle({
      x: 72,
      y: height - 250,
      width: 450,
      height: 100,
      borderColor: rgb(0.90, 0.91, 0.92),
      borderWidth: 1,
      color: rgb(0.98, 0.98, 0.98),
    });

    page.drawText('Subject Property:', {
      x: 82,
      y: height - 170,
      size: 14,
      font: helveticaBoldFont,
      color: rgb(0.12, 0.25, 0.69),
    });

    page.drawText('123 Test Street, Phoenix, AZ 85001', {
      x: 82,
      y: height - 195,
      size: 12,
      font: helveticaFont,
      color: rgb(0.12, 0.16, 0.22),
    });

    page.drawText('APN: TEST-123-456 | Price: $450,000', {
      x: 82,
      y: height - 215,
      size: 10,
      font: helveticaFont,
      color: rgb(0.12, 0.16, 0.22),
    });

    page.drawText('2,500 sqft | 4 BR | 2.5 BA', {
      x: 82,
      y: height - 235,
      size: 10,
      font: helveticaFont,
      color: rgb(0.12, 0.16, 0.22),
    });

    // Key Metrics
    page.drawText('Key Metrics:', {
      x: 72,
      y: height - 290,
      size: 14,
      font: helveticaBoldFont,
      color: rgb(0.12, 0.25, 0.69),
    });

    const metrics = [
      'Property Count: 25',
      'Data Quality: Good',
      'Confidence Level: 85.5%',
      'Analysis Date: ' + new Date().toLocaleDateString(),
    ];

    let yPos = height - 315;
    metrics.forEach(metric => {
      page.drawText(metric, {
        x: 82,
        y: yPos,
        size: 10,
        font: helveticaFont,
        color: rgb(0.12, 0.16, 0.22),
      });
      yPos -= 20;
    });

    // Line separator
    page.drawLine({
      start: { x: 72, y: 60 },
      end: { x: width - 72, y: 60 },
      thickness: 1,
      color: rgb(0.90, 0.91, 0.92),
    });

    // Footer
    page.drawText(`Generated: ${new Date().toLocaleString()}`, {
      x: 72,
      y: 40,
      size: 8,
      font: helveticaFont,
      color: rgb(0.42, 0.45, 0.50),
    });

    // Save PDF
    const testPdfPath = path.join(outputDir, 'Test_PDF_Generation.pdf');
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(testPdfPath, pdfBytes);

    const fileSize = fs.statSync(testPdfPath).size;
    console.log(`✓ Test PDF generated successfully!`);
    console.log(`  Path: ${testPdfPath}`);
    console.log(`  Size: ${(fileSize / 1024).toFixed(2)} KB`);

    // Test 2: Multi-page PDF
    console.log('\nTest 2: Creating multi-page test PDF...');
    const multiPageDoc = await PDFDocument.create();
    const font = await multiPageDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await multiPageDoc.embedFont(StandardFonts.HelveticaBold);

    // Page 1: Executive Summary
    let currentPage = multiPageDoc.addPage(PageSizes.Letter);
    currentPage.drawText('Page 1: Executive Summary', {
      x: 72,
      y: currentPage.getHeight() - 72,
      size: 20,
      font: boldFont,
      color: rgb(0.12, 0.25, 0.69),
    });
    currentPage.drawText('This page contains the executive summary of the analysis.', {
      x: 72,
      y: currentPage.getHeight() - 110,
      size: 12,
      font: font,
      color: rgb(0.12, 0.16, 0.22),
    });

    // Page 2: Property Characteristics
    currentPage = multiPageDoc.addPage(PageSizes.Letter);
    currentPage.drawText('Page 2: Property Characteristics', {
      x: 72,
      y: currentPage.getHeight() - 72,
      size: 20,
      font: boldFont,
      color: rgb(0.12, 0.25, 0.69),
    });
    currentPage.drawText('Analysis 1-5: Property characteristic analyses appear here.', {
      x: 72,
      y: currentPage.getHeight() - 110,
      size: 12,
      font: font,
      color: rgb(0.12, 0.16, 0.22),
    });

    // Page 3: Market Analysis
    currentPage = multiPageDoc.addPage(PageSizes.Letter);
    currentPage.drawText('Page 3: Market Analysis', {
      x: 72,
      y: currentPage.getHeight() - 72,
      size: 20,
      font: boldFont,
      color: rgb(0.12, 0.25, 0.69),
    });
    currentPage.drawText('Analysis 6-14: Market analysis data appears here.', {
      x: 72,
      y: currentPage.getHeight() - 110,
      size: 12,
      font: font,
      color: rgb(0.12, 0.16, 0.22),
    });

    // Page 4: Financial Analysis
    currentPage = multiPageDoc.addPage(PageSizes.Letter);
    currentPage.drawText('Page 4: Financial Analysis', {
      x: 72,
      y: currentPage.getHeight() - 72,
      size: 20,
      font: boldFont,
      color: rgb(0.12, 0.25, 0.69),
    });
    currentPage.drawText('Analysis 17-22: Financial analysis data appears here.', {
      x: 72,
      y: currentPage.getHeight() - 110,
      size: 12,
      font: font,
      color: rgb(0.12, 0.16, 0.22),
    });

    // Page 5: Market Activity
    currentPage = multiPageDoc.addPage(PageSizes.Letter);
    currentPage.drawText('Page 5: Market Activity', {
      x: 72,
      y: currentPage.getHeight() - 72,
      size: 20,
      font: boldFont,
      color: rgb(0.12, 0.25, 0.69),
    });
    currentPage.drawText('Analysis 15-16: Market activity data appears here.', {
      x: 72,
      y: currentPage.getHeight() - 110,
      size: 12,
      font: font,
      color: rgb(0.12, 0.16, 0.22),
    });

    // Add page numbers to all pages
    const pages = multiPageDoc.getPages();
    pages.forEach((page, index) => {
      const pageText = `Page ${index + 1} of ${pages.length}`;
      const textWidth = font.widthOfTextAtSize(pageText, 8);

      page.drawText(pageText, {
        x: (page.getWidth() - textWidth) / 2,
        y: 30,
        size: 8,
        font: font,
        color: rgb(0.42, 0.45, 0.50),
      });
    });

    const multiPagePath = path.join(outputDir, 'Test_Multi_Page.pdf');
    const multiPageBytes = await multiPageDoc.save();
    fs.writeFileSync(multiPagePath, multiPageBytes);

    const multiPageSize = fs.statSync(multiPagePath).size;
    console.log(`✓ Multi-page PDF generated successfully!`);
    console.log(`  Path: ${multiPagePath}`);
    console.log(`  Size: ${(multiPageSize / 1024).toFixed(2)} KB`);

    // Test 3: Verify PDFs are readable
    console.log('\nTest 3: Verifying PDF files...');
    const testBuffer = fs.readFileSync(testPdfPath);
    const multiBuffer = fs.readFileSync(multiPagePath);

    const testMagic = testBuffer.toString('ascii', 0, 4);
    const multiMagic = multiBuffer.toString('ascii', 0, 4);

    if (testMagic === '%PDF' && multiMagic === '%PDF') {
      console.log('✓ Both PDFs have valid PDF magic bytes (%PDF)');
    } else {
      console.error(`✗ PDFs missing magic bytes. Test: ${testMagic}, Multi: ${multiMagic}`);
      process.exit(1);
    }

    console.log('\n===== PDF GENERATION TEST SUCCESSFUL =====');
    console.log('✓ pdf-lib works correctly in this environment!');
    console.log(`✓ Test PDFs saved to: ${outputDir}`);
    console.log('✓ The PDF generator should now work without font loading errors.');
    console.log('\nNext steps:');
    console.log('  1. Upload a file through the ReportIt interface');
    console.log('  2. Check for 5 PDF files in tmp/reportit/breakups/{fileId}/reports/');
    console.log('  3. Verify PDFs can be opened and contain analysis data\n');

  } catch (error) {
    console.error('✗ PDF generation test failed:', error);
    process.exit(1);
  }
}

testPDFGeneration();
