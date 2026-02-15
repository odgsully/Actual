/**
 * Compare MCAO Data between Subject Property and Comparables
 */

const ExcelJS = require('exceljs');

async function compareMCAOData() {
  const filePath = '/Users/garrettsullivan/Desktop/‼️/RE/RealtyONE/MY LISTINGS/Mozingo 10.25/Uploads/Upload_Mozingo_2025-10-24-1655.xlsx';

  console.log('='.repeat(80));
  console.log('MCAO DATA COMPARISON');
  console.log('='.repeat(80));
  console.log('\n');

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const mcaoSheet = workbook.getWorksheet('Full-MCAO-API');
    const analysisSheet = workbook.getWorksheet('Analysis');

    if (!mcaoSheet || !analysisSheet) {
      console.log('✗ Required sheets not found');
      return;
    }

    // Get headers
    const headerRow = mcaoSheet.getRow(1);
    const headers = [];
    headerRow.eachCell((cell, colNumber) => {
      headers[colNumber - 1] = cell.value?.toString() || '';
    });

    // Find Owner_SalePrice and Owner_SaleDate columns
    const ownerSalePriceCol = headers.findIndex(h => h === 'Owner_SalePrice') + 1;
    const ownerSaleDateCol = headers.findIndex(h => h === 'Owner_SaleDate') + 1;

    console.log(`Owner_SalePrice column: ${ownerSalePriceCol}`);
    console.log(`Owner_SaleDate column: ${ownerSaleDateCol}`);
    console.log('\n');

    // Check first 10 properties
    console.log('Checking first 10 properties:');
    console.log('─'.repeat(80));

    for (let i = 2; i <= Math.min(11, mcaoSheet.rowCount); i++) {
      const row = mcaoSheet.getRow(i);
      const item = row.getCell(2).value;
      const apn = row.getCell(3).value;
      const salePrice = row.getCell(ownerSalePriceCol).value;
      const saleDate = row.getCell(ownerSaleDateCol).value;

      console.log(`Row ${i}: ${item}`);
      console.log(`  APN: ${apn}`);
      console.log(`  Owner_SalePrice: ${salePrice || '(empty)'}`);
      console.log(`  Owner_SaleDate: ${saleDate || '(empty)'}`);
      console.log('');
    }

    // Count how many properties have Owner_SalePrice
    let countWithPrice = 0;
    let countWithDate = 0;
    let totalProperties = mcaoSheet.rowCount - 1; // Exclude header

    for (let i = 2; i <= mcaoSheet.rowCount; i++) {
      const row = mcaoSheet.getRow(i);
      const salePrice = row.getCell(ownerSalePriceCol).value;
      const saleDate = row.getCell(ownerSaleDateCol).value;

      if (salePrice) countWithPrice++;
      if (saleDate) countWithDate++;
    }

    console.log('='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total properties: ${totalProperties}`);
    console.log(`Properties with Owner_SalePrice: ${countWithPrice} (${Math.round(countWithPrice/totalProperties*100)}%)`);
    console.log(`Properties with Owner_SaleDate: ${countWithDate} (${Math.round(countWithDate/totalProperties*100)}%)`);
    console.log('\n');

    // Check Analysis sheet SELLER_BASIS columns
    console.log('─'.repeat(80));
    console.log('ANALYSIS SHEET - SELLER_BASIS Columns');
    console.log('─'.repeat(80));

    for (let i = 2; i <= Math.min(11, analysisSheet.rowCount); i++) {
      const row = analysisSheet.getRow(i);
      const item = row.getCell(1).value;
      const sellerBasis = row.getCell(9).value; // Column I
      const sellerBasisDate = row.getCell(10).value; // Column J

      console.log(`Row ${i}: ${item}`);
      console.log(`  SELLER_BASIS (Col I): ${sellerBasis || '(empty)'}`);
      console.log(`  SELLER_BASIS_DATE (Col J): ${sellerBasisDate || '(empty)'}`);
      console.log('');
    }

    console.log('='.repeat(80));

  } catch (error) {
    console.error('ERROR:', error.message);
  }
}

compareMCAOData();
