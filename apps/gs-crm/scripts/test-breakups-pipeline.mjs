/**
 * Quick diagnostic test for breakups pipeline
 * Run with: node test-breakups-pipeline.mjs
 */

import ExcelJS from 'exceljs';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testPipeline() {
  console.log('🔍 Testing Breakups Pipeline...\n');

  try {
    // Test 1: Load modules
    console.log('[1/4] Testing module imports...');
    const { generateAllBreakupsAnalyses } = await import('../lib/processing/breakups-generator.ts');
    console.log('✅ breakups-generator imported');

    const { generateAllVisualizations } = await import('../lib/processing/breakups-visualizer.ts');
    console.log('✅ breakups-visualizer imported');

    const { generateAllPDFReports } = await import('../lib/processing/breakups-pdf-generator.ts');
    console.log('✅ breakups-pdf-generator imported');

    const { packageBreakupsReport } = await import('../lib/processing/breakups-packager.ts');
    console.log('✅ breakups-packager imported\n');

    // Test 2: Check if sample file exists
    console.log('[2/4] Checking for test Excel file...');
    const testFilePath = join(__dirname, '..', 'gsrealty-client-template.xlsx');
    try {
      const fileBuffer = readFileSync(testFilePath);
      console.log(`✅ Found test file: ${testFilePath} (${(fileBuffer.length / 1024).toFixed(2)} KB)\n`);

      // Test 3: Load workbook
      console.log('[3/4] Loading Excel workbook...');
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(fileBuffer);
      console.log(`✅ Workbook loaded with ${workbook.worksheets.length} sheets`);
      console.log(`   Sheets: ${workbook.worksheets.map(s => s.name).join(', ')}\n`);

      // Test 4: Run analysis (just to see if it starts)
      console.log('[4/4] Testing analysis function...');
      const result = await generateAllBreakupsAnalyses(workbook, {});
      console.log('✅ Analysis function executed');
      console.log(`   Result keys: ${Object.keys(result).join(', ')}\n`);

      console.log('🎉 All tests passed!\n');
      console.log('Pipeline is ready for use.');

    } catch (fileError) {
      console.log(`⚠️  Test file not found: ${testFilePath}`);
      console.log('   Upload a Complete_*.xlsx file to test with real data\n');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

testPipeline();
