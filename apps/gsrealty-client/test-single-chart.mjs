/**
 * Test Single Chart Generation
 * Minimal test to see if QuickChart can save a single PNG file
 *
 * Run with: node test-single-chart.mjs
 */

import QuickChart from 'quickchart-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testSingleChart() {
  console.log('🧪 Testing Single Chart Generation\n');

  const outputDir = path.join(__dirname, 'tmp', 'single-chart-test');
  await fs.mkdir(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, 'test-chart.png');

  console.log(`Output directory: ${outputDir}`);
  console.log(`Output path: ${outputPath}\n`);

  try {
    // Create a simple chart
    const chart = new QuickChart();
    chart.setConfig({
      type: 'bar',
      data: {
        labels: ['Red', 'Blue', 'Yellow', 'Green'],
        datasets: [{
          label: 'Test Data',
          data: [12, 19, 3, 5],
          backgroundColor: '#1E40AF',
        }],
      },
      options: {
        title: {
          display: true,
          text: 'Simple Test Chart',
          fontSize: 18,
        },
      },
    });

    chart.setWidth(1200);
    chart.setHeight(800);
    chart.setBackgroundColor('#FFFFFF');

    console.log('📡 Fetching chart from QuickChart API...');
    const startTime = Date.now();
    const buffer = await chart.toBinary();
    const duration = Date.now() - startTime;

    console.log(`✅ Got buffer in ${duration}ms (${(buffer.length / 1024).toFixed(2)} KB)\n`);

    console.log('💾 Writing file to disk...');
    await fs.writeFile(outputPath, buffer);

    // Verify file was written
    const stats = await fs.stat(outputPath);
    console.log(`✅ File written successfully!`);
    console.log(`   Path: ${outputPath}`);
    console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB\n`);

    // Try reading it back
    const readBuffer = await fs.readFile(outputPath);
    console.log(`✅ File verified readable (${(readBuffer.length / 1024).toFixed(2)} KB)\n`);

    console.log('🎉 SUCCESS! Chart generation works correctly.\n');
    return true;
  } catch (error) {
    console.error('❌ FAILED:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

testSingleChart();
