/**
 * Test Break-ups PDF Generator
 *
 * Test the actual breakups-pdf-generator with mock data
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamic import of TypeScript module
const { generateAllPDFReports } = await import('./lib/processing/breakups-pdf-generator.ts');

console.log('=== Break-ups PDF Generator Test ===\n');

// Create test output directory
const testDir = path.join(__dirname, 'tmp', 'breakups-pdf-test', 'reports');
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
  console.log(`✓ Created test directory: ${testDir}`);
}

// Mock analysis results
const mockAnalysisResults = {
  analysisDate: new Date().toISOString(),
  propertyCount: 150,
  subjectProperty: {
    address: '123 Test Street, Phoenix, AZ 85001',
    apn: '123-45-678',
    price: 500000,
    sqft: 3000,
    bedrooms: 4,
    bathrooms: 3,
  },
  analyses: [
    {
      id: 1,
      name: 'Bedroom Distribution',
      category: 'A',
      categoryName: 'Property Characteristics',
      results: { '3BR': 40, '4BR': 60, '5BR': 20 },
      insight: 'Most properties have 4 bedrooms (60%), followed by 3 bedrooms (40%).',
    },
    {
      id: 2,
      name: 'HOA Distribution',
      category: 'A',
      categoryName: 'Property Characteristics',
      results: { hasHOA: 80, noHOA: 70 },
      insight: 'Approximately 53% of properties have HOA fees.',
    },
    {
      id: 6,
      name: 'Price Distribution',
      category: 'B',
      categoryName: 'Market Analysis',
      results: { min: 300000, max: 800000, avg: 500000, median: 480000 },
      insight: 'Price range from $300K to $800K with median at $480K.',
    },
    {
      id: 15,
      name: 'Active vs Closed',
      category: 'D',
      categoryName: 'Market Activity',
      results: {
        active: { count: 100, avgListPrice: 520000, avgDaysOnMarket: 45 },
        closed: { count: 50, avgSalePrice: 490000, avgDaysToClose: 30 },
      },
      insight: 'Active listings outnumber closed sales 2:1, indicating slower market absorption.',
    },
    {
      id: 16,
      name: 'Active vs Pending',
      category: 'D',
      categoryName: 'Market Activity',
      results: {
        active: { count: 100, avgListPrice: 520000, avgDaysActive: 45 },
        pending: { count: 30, avgContractPrice: 505000, avgDaysToContract: 25 },
      },
      insight: 'Pending ratio of 23% suggests moderate market momentum.',
    },
    {
      id: 17,
      name: 'Renovation Delta',
      category: 'E',
      categoryName: 'Financial Analysis',
      results: { avgDelta: 50000, minDelta: 10000, maxDelta: 150000 },
      insight: 'Renovated properties sell for $50K more on average.',
    },
    {
      id: 21,
      name: 'Expected Annual NOI',
      category: 'E',
      categoryName: 'Financial Analysis',
      results: {
        monthlyRent: 2500,
        annualIncome: 30000,
        operatingExpenses: 8000,
        annualNOI: 22000,
        capRate: 0.044,
      },
      insight: 'Expected annual NOI of $22,000 with 4.4% cap rate.',
    },
    {
      id: 22,
      name: 'Improvement Investment',
      category: 'E',
      categoryName: 'Financial Analysis',
      results: {
        estimatedCost: 75000,
        expectedReturn: 125000,
        roi: 0.67,
      },
      insight: 'Improvement investment of $75K could yield $125K return (67% ROI).',
    },
  ],
  summary: {
    overallConfidence: 92.5,
    dataQuality: 'High',
    recommendedValue: 485000,
    valueRange: { low: 460000, high: 510000 },
  },
};

// Test PDF generation
console.log('\nGenerating 5 PDF reports...\n');

try {
  const startTime = Date.now();

  const result = await generateAllPDFReports(
    mockAnalysisResults,
    [], // No chart paths for this test
    testDir
  );

  const endTime = Date.now();

  console.log('=== PDF Generation Results ===\n');
  console.log(`Success: ${result.success}`);
  console.log(`Generation Time: ${result.generationTime}ms`);
  console.log(`Total Size: ${(result.totalSize / 1024).toFixed(2)} KB`);
  console.log(`\nGenerated Files (${result.generatedFiles.length}):`);

  result.generatedFiles.forEach((filePath, idx) => {
    const fileName = path.basename(filePath);
    const fileExists = fs.existsSync(filePath);
    const fileSize = fileExists ? fs.statSync(filePath).size : 0;

    console.log(`  ${idx + 1}. ${fileName}`);
    console.log(`     Exists: ${fileExists ? '✓' : '✗'}`);
    console.log(`     Size: ${(fileSize / 1024).toFixed(2)} KB`);
    console.log(`     Path: ${filePath}`);

    // Verify PDF magic bytes
    if (fileExists && fileSize > 0) {
      const buffer = fs.readFileSync(filePath);
      const magic = buffer.toString('ascii', 0, 4);
      console.log(`     Valid PDF: ${magic === '%PDF' ? '✓' : '✗ (magic: ' + magic + ')'}`);
    }
  });

  if (result.errors.length > 0) {
    console.log(`\nErrors (${result.errors.length}):`);
    result.errors.forEach((error, idx) => {
      console.log(`  ${idx + 1}. ${error}`);
    });
  }

  // Expected files
  const expectedFiles = [
    'Executive_Summary.pdf',
    'Property_Characteristics.pdf',
    'Market_Analysis.pdf',
    'Financial_Analysis.pdf',
    'Market_Activity.pdf',
  ];

  console.log('\n=== Validation ===\n');

  const missingFiles = expectedFiles.filter(
    fileName => !result.generatedFiles.some(path => path.endsWith(fileName))
  );

  if (missingFiles.length === 0) {
    console.log('✓ All 5 expected PDF files were generated!');
  } else {
    console.log(`✗ Missing ${missingFiles.length} PDF files:`);
    missingFiles.forEach(fileName => console.log(`  - ${fileName}`));
  }

  if (result.success) {
    console.log('\n✓ PDF generation test PASSED!\n');
    console.log(`Test output directory: ${testDir}`);
  } else {
    console.log('\n✗ PDF generation test FAILED!\n');
    process.exit(1);
  }
} catch (error) {
  console.error('\n✗ PDF generation test CRASHED:\n');
  console.error(error);
  process.exit(1);
}
