/**
 * Test PDF Generation Standalone
 *
 * Simple test to verify PDFKit can generate a PDF file
 */

import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== PDF Generation Test ===\n');

// Create test output directory
const testDir = path.join(__dirname, 'tmp', 'pdf-test');
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
  console.log(`✓ Created test directory: ${testDir}`);
}

// Test 1: Simple PDF generation
console.log('\nTest 1: Creating simple PDF...');
const simplePdfPath = path.join(testDir, 'simple-test.pdf');

try {
  const doc = new PDFDocument({
    size: 'LETTER',
    margins: { top: 72, bottom: 72, left: 72, right: 72 },
  });

  const stream = fs.createWriteStream(simplePdfPath);
  doc.pipe(stream);

  // Add content
  doc.fontSize(24)
     .fillColor('#1E40AF')
     .text('Test PDF Document', { align: 'center' });

  doc.moveDown(2);

  doc.fontSize(12)
     .fillColor('#000000')
     .text('This is a test PDF to verify PDFKit is working correctly.');

  doc.moveDown();
  doc.text(`Generated at: ${new Date().toISOString()}`);

  // Draw a simple rectangle
  doc.moveDown();
  doc.rect(72, doc.y, 200, 50)
     .fillAndStroke('#F59E0B', '#1E40AF');

  doc.end();

  // Wait for stream to finish
  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  const fileSize = fs.statSync(simplePdfPath).size;
  console.log(`✓ Simple PDF created successfully!`);
  console.log(`  Path: ${simplePdfPath}`);
  console.log(`  Size: ${fileSize} bytes`);
} catch (error) {
  console.error(`✗ Simple PDF creation failed:`, error);
  process.exit(1);
}

// Test 2: PDF with mock data (similar to breakups structure)
console.log('\nTest 2: Creating structured PDF with mock data...');
const structuredPdfPath = path.join(testDir, 'structured-test.pdf');

try {
  const doc = new PDFDocument({
    size: 'LETTER',
    margins: { top: 72, bottom: 72, left: 72, right: 72 },
  });

  const stream = fs.createWriteStream(structuredPdfPath);
  doc.pipe(stream);

  // Header
  doc.fontSize(24)
     .fillColor('#1E40AF')
     .text('Executive Summary', { align: 'left' });

  doc.moveDown(2);

  // Property details box
  const boxX = 72;
  const boxY = doc.y;
  const boxWidth = 500;
  const boxHeight = 100;

  doc.rect(boxX, boxY, boxWidth, boxHeight)
     .fillAndStroke('#F9FAFB', '#E5E7EB');

  doc.fontSize(14)
     .fillColor('#1E40AF')
     .text('Subject Property', boxX + 10, boxY + 10);

  doc.fontSize(10)
     .fillColor('#1F2937')
     .text('123 Test Street, Phoenix, AZ 85001', boxX + 10, boxY + 35);
  doc.text('Price: $500,000', boxX + 10, boxY + 50);
  doc.text('3,000 sqft | 4 BR | 3 BA', boxX + 10, boxY + 65);

  doc.y = boxY + boxHeight + 20;

  // Key metrics section
  doc.fontSize(14)
     .fillColor('#1E40AF')
     .text('Key Metrics', { underline: true });

  doc.moveDown(0.5);

  const metrics = [
    { label: 'Property Count', value: '150' },
    { label: 'Data Quality', value: 'High' },
    { label: 'Confidence Level', value: '92.5%' },
    { label: 'Analysis Date', value: new Date().toLocaleDateString() },
  ];

  metrics.forEach(metric => {
    doc.fontSize(10)
       .fillColor('#6B7280')
       .text(metric.label + ':', { continued: true })
       .fillColor('#1F2937')
       .text(' ' + metric.value);
  });

  // Add page 2
  doc.addPage();
  doc.fontSize(18)
     .fillColor('#1E40AF')
     .text('Analysis Summary');

  doc.moveDown();
  doc.fontSize(10)
     .fillColor('#1F2937')
     .text('This is page 2 of the structured test PDF.');

  // Footer on all pages
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    // PDFKit uses 0-based index but switchToPage expects page number starting from range.start
    doc.switchToPage(i + range.start);

    const bottomY = 792 - 36;

    doc.moveTo(72, bottomY - 20)
       .lineTo(612 - 72, bottomY - 20)
       .strokeColor('#E5E7EB')
       .stroke();

    doc.fontSize(8)
       .fillColor('#6B7280')
       .text(
         `Page ${i + 1} of ${range.count}`,
         72,
         bottomY - 10,
         { width: 468, align: 'center' }
       );
  }

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  const fileSize = fs.statSync(structuredPdfPath).size;
  console.log(`✓ Structured PDF created successfully!`);
  console.log(`  Path: ${structuredPdfPath}`);
  console.log(`  Size: ${fileSize} bytes`);
} catch (error) {
  console.error(`✗ Structured PDF creation failed:`, error);
  process.exit(1);
}

// Test 3: Check if files are readable
console.log('\nTest 3: Verifying PDF files can be read...');
try {
  const simpleBuffer = fs.readFileSync(simplePdfPath);
  const structuredBuffer = fs.readFileSync(structuredPdfPath);

  // Check if they start with PDF magic bytes
  const simpleMagic = simpleBuffer.toString('ascii', 0, 4);
  const structuredMagic = structuredBuffer.toString('ascii', 0, 4);

  if (simpleMagic === '%PDF' && structuredMagic === '%PDF') {
    console.log(`✓ Both PDFs have valid PDF magic bytes (%PDF)`);
  } else {
    console.error(`✗ PDFs missing magic bytes. Simple: ${simpleMagic}, Structured: ${structuredMagic}`);
    process.exit(1);
  }
} catch (error) {
  console.error(`✗ PDF verification failed:`, error);
  process.exit(1);
}

console.log('\n=== All PDF Tests Passed! ===\n');
console.log('Test files created:');
console.log(`  1. ${simplePdfPath}`);
console.log(`  2. ${structuredPdfPath}`);
console.log('\nPDFKit is working correctly. Issue likely in breakups-pdf-generator logic.\n');
