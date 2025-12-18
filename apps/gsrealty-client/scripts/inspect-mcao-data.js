/**
 * MCAO Data Inspector
 * Checks if Owner_SalePrice and Owner_SaleDate exist in Full-MCAO-API sheet
 */

const ExcelJS = require('exceljs');

async function inspectMCAOData() {
  const filePath = '/Users/garrettsullivan/Desktop/‼️/RE/RealtyONE/MY LISTINGS/Mozingo 10.25/Uploads/Upload_Mozingo_2025-10-24-1655.xlsx';

  console.log('='.repeat(80));
  console.log('MCAO DATA INSPECTION - Subject Property Row 2');
  console.log('='.repeat(80));
  console.log('\n');

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const mcaoSheet = workbook.getWorksheet('Full-MCAO-API');
    if (!mcaoSheet) {
      console.log('✗ Full-MCAO-API sheet not found');
      return;
    }

    // Get headers from row 1
    const headerRow = mcaoSheet.getRow(1);
    const headers = [];
    headerRow.eachCell((cell, colNumber) => {
      headers[colNumber - 1] = cell.value?.toString() || '';
    });

    console.log(`Total columns: ${headers.length}`);
    console.log('\n');

    // Find Owner_SalePrice column (should be column AG = 33)
    const ownerSalePriceIndex = headers.findIndex(h =>
      h.toLowerCase().includes('owner') && h.toLowerCase().includes('sale') && h.toLowerCase().includes('price')
    );

    // Find Owner_SaleDate column (should be column AH = 34)
    const ownerSaleDateIndex = headers.findIndex(h =>
      h.toLowerCase().includes('owner') && h.toLowerCase().includes('sale') && h.toLowerCase().includes('date')
    );

    console.log('Looking for SELLER_BASIS source columns:');
    console.log(`  Owner_SalePrice: ${ownerSalePriceIndex >= 0 ? `Found at column ${ownerSalePriceIndex + 1} (${headers[ownerSalePriceIndex]})` : '✗ NOT FOUND'}`);
    console.log(`  Owner_SaleDate: ${ownerSaleDateIndex >= 0 ? `Found at column ${ownerSaleDateIndex + 1} (${headers[ownerSaleDateIndex]})` : '✗ NOT FOUND'}`);
    console.log('\n');

    // Get Subject Property row (row 2)
    const subjectRow = mcaoSheet.getRow(2);

    console.log('Subject Property Data (Row 2):');
    console.log(`  Item (Col B): ${subjectRow.getCell(2).value}`);
    console.log(`  APN (Col C): ${subjectRow.getCell(3).value}`);
    console.log('\n');

    if (ownerSalePriceIndex >= 0) {
      const value = subjectRow.getCell(ownerSalePriceIndex + 1).value;
      console.log(`  Owner_SalePrice (Col ${ownerSalePriceIndex + 1}): ${value || '(empty)'}`);
    }

    if (ownerSaleDateIndex >= 0) {
      const value = subjectRow.getCell(ownerSaleDateIndex + 1).value;
      console.log(`  Owner_SaleDate (Col ${ownerSaleDateIndex + 1}): ${value || '(empty)'}`);
    }
    console.log('\n');

    // Show first 50 column headers to see what data exists
    console.log('─'.repeat(80));
    console.log('First 50 Column Headers in Full-MCAO-API:');
    console.log('─'.repeat(80));
    for (let i = 0; i < Math.min(50, headers.length); i++) {
      const value = subjectRow.getCell(i + 1).value;
      const hasValue = value !== null && value !== undefined && value !== '';
      console.log(`  ${String(i + 1).padStart(3)}. ${headers[i].padEnd(40)} ${hasValue ? '✓' : '✗'} ${value || ''}`);
    }
    console.log('\n');

    // Search for any field with "sale" or "owner" in the name
    console.log('─'.repeat(80));
    console.log('All columns containing "sale" or "owner":');
    console.log('─'.repeat(80));
    headers.forEach((header, index) => {
      if (header.toLowerCase().includes('sale') || header.toLowerCase().includes('owner')) {
        const value = subjectRow.getCell(index + 1).value;
        console.log(`  Col ${index + 1}: ${header}`);
        console.log(`    Value: ${value || '(empty)'}`);
      }
    });

    // Check Analysis sheet columns I and J
    console.log('\n');
    console.log('='.repeat(80));
    console.log('ANALYSIS SHEET - Subject Property Row 2');
    console.log('='.repeat(80));
    console.log('\n');

    const analysisSheet = workbook.getWorksheet('Analysis');
    if (analysisSheet) {
      const analysisHeaders = [];
      const analysisHeaderRow = analysisSheet.getRow(1);
      analysisHeaderRow.eachCell((cell, colNumber) => {
        analysisHeaders[colNumber - 1] = cell.value?.toString() || '';
      });

      const analysisSubjectRow = analysisSheet.getRow(2);

      console.log('Subject Property Data:');
      console.log(`  Item (Col A): ${analysisSubjectRow.getCell(1).value}`);
      console.log(`  FULL_ADDRESS (Col B): ${analysisSubjectRow.getCell(2).value}`);
      console.log(`  APN (Col C): ${analysisSubjectRow.getCell(3).value}`);
      console.log(`  SELLER_BASIS (Col I): ${analysisSubjectRow.getCell(9).value || '(empty)'}`);
      console.log(`  SELLER_BASIS_DATE (Col J): ${analysisSubjectRow.getCell(10).value || '(empty)'}`);
      console.log('\n');

      console.log('All 29 columns:');
      for (let i = 0; i < analysisHeaders.length; i++) {
        const value = analysisSubjectRow.getCell(i + 1).value;
        const hasValue = value !== null && value !== undefined && value !== '';
        console.log(`  ${String.fromCharCode(65 + i).padEnd(2)} (${String(i + 1).padStart(2)}). ${analysisHeaders[i].padEnd(30)} ${hasValue ? '✓' : '✗'} ${value || ''}`);
      }
    }

    console.log('\n');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('ERROR:', error.message);
  }
}

inspectMCAOData();
