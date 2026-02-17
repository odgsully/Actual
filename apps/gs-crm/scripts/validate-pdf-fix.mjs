#!/usr/bin/env node
/**
 * Validation Script: PDF Generation Fix
 *
 * This script validates that the PDF generation fix is working correctly
 * by simulating the exact flow used in the breakups pipeline.
 *
 * Run: node validate-pdf-fix.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('====================================');
console.log('PDF Generation Fix Validation Script');
console.log('====================================\n');

let testsPassed = 0;
let testsFailed = 0;

// Helper functions
function pass(message) {
  console.log(`✅ PASS: ${message}`);
  testsPassed++;
}

function fail(message) {
  console.log(`❌ FAIL: ${message}`);
  testsFailed++;
}

function info(message) {
  console.log(`ℹ️  ${message}`);
}

// Test 1: Verify PDFKit is installed
console.log('Test 1: Checking PDFKit installation...');
try {
  const pdfkit = await import('pdfkit');
  if (pdfkit.default) {
    pass('PDFKit is installed');
  } else {
    fail('PDFKit import failed');
  }
} catch (error) {
  fail(`PDFKit not installed: ${error.message}`);
}

// Test 2: Verify breakups-pdf-generator.ts exists and has the fix
console.log('\nTest 2: Verifying fix in breakups-pdf-generator.ts...');
const generatorPath = path.join(__dirname, '..', 'lib/processing/breakups-pdf-generator.ts');
try {
  const content = fs.readFileSync(generatorPath, 'utf-8');

  // Check for the fix
  if (content.includes('i + range.start')) {
    pass('Fix is present: switchToPage(i + range.start)');
  } else if (content.includes('switchToPage(i)') && !content.includes('i + range.start')) {
    fail('Fix NOT present: still using switchToPage(i)');
  } else {
    info('Could not verify fix pattern in code');
  }

  // Check for enhanced logging
  if (content.includes('[PDF Generator]')) {
    pass('Enhanced logging is present');
  } else {
    fail('Enhanced logging is missing');
  }
} catch (error) {
  fail(`Could not read generator file: ${error.message}`);
}

// Test 3: Run simple PDFKit test
console.log('\nTest 3: Testing PDFKit functionality...');
try {
  const PDFDocument = (await import('pdfkit')).default;
  const testDir = path.join(__dirname, 'tmp', 'validation-test');

  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  const testPdfPath = path.join(testDir, 'test.pdf');

  const doc = new PDFDocument();
  const stream = fs.createWriteStream(testPdfPath);
  doc.pipe(stream);

  doc.fontSize(14).text('Test PDF', 100, 100);
  doc.addPage();
  doc.text('Page 2', 100, 100);

  // Test the switchToPage fix
  const range = doc.bufferedPageRange();
  try {
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(i + range.start);
      doc.fontSize(8).text(`Footer page ${i + 1}`, 100, 700);
    }
    pass('switchToPage with range.start works correctly');
  } catch (error) {
    fail(`switchToPage failed: ${error.message}`);
  }

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  if (fs.existsSync(testPdfPath)) {
    const fileSize = fs.statSync(testPdfPath).size;
    if (fileSize > 0) {
      pass(`Test PDF created successfully (${fileSize} bytes)`);

      // Verify PDF magic bytes
      const buffer = fs.readFileSync(testPdfPath);
      const magic = buffer.toString('ascii', 0, 4);
      if (magic === '%PDF') {
        pass('PDF has valid magic bytes');
      } else {
        fail(`Invalid PDF magic bytes: ${magic}`);
      }
    } else {
      fail('Test PDF is empty');
    }
  } else {
    fail('Test PDF was not created');
  }
} catch (error) {
  fail(`PDFKit test failed: ${error.message}`);
  console.error(error);
}

// Test 4: Import and test the actual PDF generator
console.log('\nTest 4: Testing breakups-pdf-generator module...');
try {
  const { generateAllPDFReports } = await import('../lib/processing/breakups-pdf-generator.ts');

  if (typeof generateAllPDFReports === 'function') {
    pass('generateAllPDFReports function is exported');

    // Create mock data
    const mockData = {
      analysisDate: new Date().toISOString(),
      propertyCount: 100,
      subjectProperty: {
        address: '123 Validation Test Street',
        price: 400000,
        sqft: 2500,
        bedrooms: 4,
        bathrooms: 2.5,
      },
      analyses: [
        {
          id: 1,
          name: 'Test Analysis',
          category: 'A',
          categoryName: 'Test Category',
          results: { test: 'data' },
          insight: 'This is a test insight.',
        },
      ],
      summary: {
        overallConfidence: 90,
        dataQuality: 'High',
        recommendedValue: 400000,
        valueRange: { low: 380000, high: 420000 },
      },
    };

    const testOutputDir = path.join(__dirname, 'tmp', 'validation-test', 'reports');
    if (!fs.existsSync(testOutputDir)) {
      fs.mkdirSync(testOutputDir, { recursive: true });
    }

    info('Generating 5 PDFs with mock data...');
    const result = await generateAllPDFReports(mockData, [], testOutputDir);

    if (result.success) {
      pass(`PDF generation succeeded: ${result.generatedFiles.length}/5 files`);
    } else {
      fail(`PDF generation failed with ${result.errors.length} errors`);
      result.errors.forEach(err => console.error(`   - ${err}`));
    }

    // Verify each expected PDF
    const expectedPdfs = [
      'Executive_Summary.pdf',
      'Property_Characteristics.pdf',
      'Market_Analysis.pdf',
      'Financial_Analysis.pdf',
      'Market_Activity.pdf',
    ];

    expectedPdfs.forEach(filename => {
      const filePath = path.join(testOutputDir, filename);
      if (fs.existsSync(filePath)) {
        const fileSize = fs.statSync(filePath).size;
        if (fileSize > 0) {
          pass(`${filename} exists (${(fileSize / 1024).toFixed(2)} KB)`);
        } else {
          fail(`${filename} is empty`);
        }
      } else {
        fail(`${filename} does not exist`);
      }
    });

  } else {
    fail('generateAllPDFReports is not a function');
  }
} catch (error) {
  fail(`Could not import or test PDF generator: ${error.message}`);
  console.error(error);
}

// Final summary
console.log('\n====================================');
console.log('Validation Summary');
console.log('====================================');
console.log(`Tests Passed: ${testsPassed}`);
console.log(`Tests Failed: ${testsFailed}`);

if (testsFailed === 0) {
  console.log('\n✅ ALL TESTS PASSED! PDF generation fix is working correctly.\n');
  console.log('Next steps:');
  console.log('1. Test with real data upload through the UI');
  console.log('2. Verify ZIP download contains /reports/ directory with 5 PDFs');
  console.log('3. Open downloaded PDFs to verify quality and content');
  process.exit(0);
} else {
  console.log('\n❌ SOME TESTS FAILED! Please review the errors above.\n');
  process.exit(1);
}
