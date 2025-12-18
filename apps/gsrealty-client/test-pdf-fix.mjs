#!/usr/bin/env node
/**
 * Test script to verify PDF generation fix
 * Tests that the transformer correctly converts data and PDFs are generated
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = 'http://localhost:3004/api/admin/reportit/upload';
const TEST_FILE = '/Users/garrettsullivan/Desktop/‼️/RE/RealtyONE/MY LISTINGS/Mozingo 10.25/Uploads/Upload_Client_2025-10-26-2132.xlsx';

console.log('🧪 Testing PDF Generation Fix\n');
console.log('=' .repeat(60));

async function testPDFGeneration() {
  try {
    // Check if test file exists
    if (!fs.existsSync(TEST_FILE)) {
      console.error('❌ Test file not found:', TEST_FILE);
      console.log('\nAvailable test files:');
      const files = fs.readdirSync(__dirname).filter(f => f.startsWith('Complete') && f.endsWith('.xlsx'));
      files.forEach(f => console.log('  -', f));
      process.exit(1);
    }

    console.log('✓ Test file found:', path.basename(TEST_FILE));
    console.log('✓ File size:', (fs.statSync(TEST_FILE).size / 1024).toFixed(2), 'KB\n');

    // Create form data
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(TEST_FILE);
    const blob = new Blob([fileBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    formData.append('file', blob, path.basename(TEST_FILE));
    formData.append('type', 'breakups');

    console.log('📤 Uploading file to', API_URL, '...\n');

    const startTime = Date.now();
    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData,
    });

    const elapsed = Date.now() - startTime;

    if (!response.ok) {
      console.error('❌ Upload failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error:', errorText);
      process.exit(1);
    }

    const result = await response.json();
    console.log('✅ Upload successful!\n');
    console.log('Processing time:', (elapsed / 1000).toFixed(2), 'seconds');
    console.log('Response:', JSON.stringify(result, null, 2));

    if (result.success && result.data) {
      console.log('\n' + '='.repeat(60));
      console.log('📦 Generated Package Details:');
      console.log('='.repeat(60));
      console.log('File ID:', result.data.fileId);
      console.log('File Name:', result.data.fileName);
      console.log('Download URL:', result.data.downloadUrl);

      // Download and inspect the ZIP file
      console.log('\n📥 Downloading ZIP to inspect contents...\n');
      const downloadUrl = `http://localhost:3004${result.data.downloadUrl}`;
      const downloadResponse = await fetch(downloadUrl);

      if (downloadResponse.ok) {
        const zipBuffer = await downloadResponse.arrayBuffer();
        const zipPath = path.join(__dirname, 'tmp', 'test_download.zip');

        // Ensure tmp directory exists
        const tmpDir = path.dirname(zipPath);
        if (!fs.existsSync(tmpDir)) {
          fs.mkdirSync(tmpDir, { recursive: true });
        }

        fs.writeFileSync(zipPath, Buffer.from(zipBuffer));
        console.log('✓ ZIP downloaded:', zipPath);
        console.log('✓ ZIP size:', (zipBuffer.byteLength / 1024).toFixed(2), 'KB');

        // Extract and inspect ZIP contents using unzip command
        const { execSync } = await import('child_process');
        try {
          const zipContents = execSync(`unzip -l "${zipPath}"`, { encoding: 'utf8' });
          console.log('\n📋 ZIP Contents:\n');
          console.log(zipContents);

          // Check for /reports/ folder and PDF files
          const hasReportsFolder = zipContents.includes('reports/');
          const pdfCount = (zipContents.match(/\.pdf/g) || []).length;

          console.log('\n' + '='.repeat(60));
          console.log('🎯 PDF Generation Test Results:');
          console.log('='.repeat(60));
          console.log('Reports folder present:', hasReportsFolder ? '✅ YES' : '❌ NO');
          console.log('PDF files found:', pdfCount);

          if (pdfCount === 5) {
            console.log('\n🎉 SUCCESS! All 5 PDFs generated correctly!');
          } else if (pdfCount > 0) {
            console.log('\n⚠️  PARTIAL: Only', pdfCount, '/ 5 PDFs generated');
          } else {
            console.log('\n❌ FAILED: No PDFs found in ZIP');
          }

          // Extract the PDF filenames
          const pdfMatches = zipContents.match(/(\w+\.pdf)/g);
          if (pdfMatches && pdfMatches.length > 0) {
            console.log('\nPDF files:');
            pdfMatches.forEach(pdf => console.log('  ✓', pdf));
          }

        } catch (error) {
          console.error('Error inspecting ZIP:', error.message);
        }
      } else {
        console.error('❌ Failed to download ZIP:', downloadResponse.status);
      }
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

testPDFGeneration();
