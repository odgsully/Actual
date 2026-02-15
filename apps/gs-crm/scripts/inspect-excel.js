/**
 * Excel File Inspector
 * Reads the actual production Excel file and reports what's in it
 */

const ExcelJS = require('exceljs');
const path = require('path');

async function inspectExcel() {
  const filePath = '/Users/garrettsullivan/Desktop/‼️/RE/RealtyONE/MY LISTINGS/Mozingo 10.25/Uploads/Upload_Mozingo_2025-10-24-1655.xlsx';

  console.log('='.repeat(80));
  console.log('EXCEL FILE INSPECTION REPORT');
  console.log('='.repeat(80));
  console.log(`File: ${path.basename(filePath)}`);
  console.log('\n');

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    console.log(`Total sheets: ${workbook.worksheets.length}`);
    workbook.worksheets.forEach(sheet => {
      console.log(`  - ${sheet.name} (${sheet.rowCount} rows)`);
    });
    console.log('\n');

    // Check Full-MCAO-API sheet
    const mcaoSheet = workbook.getWorksheet('Full-MCAO-API');
    if (mcaoSheet) {
      console.log('─'.repeat(80));
      console.log('FULL-MCAO-API SHEET');
      console.log('─'.repeat(80));
      console.log(`Total rows: ${mcaoSheet.rowCount}`);
      console.log(`Total columns: ${mcaoSheet.columnCount}`);
      console.log('\n');

      console.log('First 10 rows, Column A (FULL_ADDRESS) and Column B (Item):');
      for (let i = 1; i <= Math.min(10, mcaoSheet.rowCount); i++) {
        const row = mcaoSheet.getRow(i);
        const colA = row.getCell(1).value;
        const colB = row.getCell(2).value;
        const colC = row.getCell(3).value; // APN

        console.log(`Row ${i}:`);
        console.log(`  Col A (FULL_ADDRESS): ${colA}`);
        console.log(`  Col B (Item): ${colB}`);
        console.log(`  Col C (APN): ${colC}`);
        console.log('');
      }

      // Search for "Subject Property" in column B
      let foundSubject = false;
      for (let i = 1; i <= mcaoSheet.rowCount; i++) {
        const itemValue = mcaoSheet.getRow(i).getCell(2).value;
        if (itemValue && itemValue.toString().includes('Subject')) {
          console.log(`✓ FOUND "Subject Property" at row ${i}, column B: "${itemValue}"`);
          foundSubject = true;

          // Show the full row
          const row = mcaoSheet.getRow(i);
          console.log(`  Full Address: ${row.getCell(1).value}`);
          console.log(`  APN: ${row.getCell(3).value}`);
          break;
        }
      }

      if (!foundSubject) {
        console.log(`✗ "Subject Property" NOT FOUND in Full-MCAO-API sheet`);
      }
      console.log('\n');
    } else {
      console.log('✗ Full-MCAO-API sheet NOT FOUND\n');
    }

    // Check Analysis sheet
    const analysisSheet = workbook.getWorksheet('Analysis');
    if (analysisSheet) {
      console.log('─'.repeat(80));
      console.log('ANALYSIS SHEET');
      console.log('─'.repeat(80));
      console.log(`Total rows: ${analysisSheet.rowCount}`);
      console.log(`Total columns: ${analysisSheet.columnCount}`);
      console.log('\n');

      console.log('First 10 rows, Column A (Item) and Column B (FULL_ADDRESS):');
      for (let i = 1; i <= Math.min(10, analysisSheet.rowCount); i++) {
        const row = analysisSheet.getRow(i);
        const colA = row.getCell(1).value;
        const colB = row.getCell(2).value;
        const colC = row.getCell(3).value; // APN

        console.log(`Row ${i}:`);
        console.log(`  Col A (Item): ${colA}`);
        console.log(`  Col B (FULL_ADDRESS): ${colB}`);
        console.log(`  Col C (APN): ${colC}`);
        console.log('');
      }

      // Search for "Subject Property" in column A
      let foundSubject = false;
      for (let i = 1; i <= analysisSheet.rowCount; i++) {
        const itemValue = analysisSheet.getRow(i).getCell(1).value;
        if (itemValue && itemValue.toString().includes('Subject')) {
          console.log(`✓ FOUND "Subject Property" at row ${i}, column A: "${itemValue}"`);
          foundSubject = true;

          // Show columns I and J (SELLER_BASIS fields)
          const row = analysisSheet.getRow(i);
          console.log(`  Full Address: ${row.getCell(2).value}`);
          console.log(`  APN: ${row.getCell(3).value}`);
          console.log(`  SELLER_BASIS (Col I): ${row.getCell(9).value}`);
          console.log(`  SELLER_BASIS_DATE (Col J): ${row.getCell(10).value}`);
          break;
        }
      }

      if (!foundSubject) {
        console.log(`✗ "Subject Property" NOT FOUND in Analysis sheet`);
      }
      console.log('\n');
    } else {
      console.log('✗ Analysis sheet NOT FOUND\n');
    }

    // Summary
    console.log('='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));

    // Count properties in Full-MCAO-API
    if (mcaoSheet) {
      const mcaoRows = [];
      for (let i = 2; i <= mcaoSheet.rowCount; i++) {
        const item = mcaoSheet.getRow(i).getCell(2).value;
        if (item) mcaoRows.push(item);
      }
      console.log(`Full-MCAO-API: ${mcaoRows.length} properties`);

      const hasSubject = mcaoRows.some(item => item.toString().includes('Subject'));
      console.log(`  Subject Property present: ${hasSubject ? '✓ YES' : '✗ NO'}`);
    }

    // Count properties in Analysis
    if (analysisSheet) {
      const analysisRows = [];
      for (let i = 2; i <= analysisSheet.rowCount; i++) {
        const item = analysisSheet.getRow(i).getCell(1).value;
        if (item) analysisRows.push(item);
      }
      console.log(`Analysis: ${analysisRows.length} properties`);

      const hasSubject = analysisRows.some(item => item.toString().includes('Subject'));
      console.log(`  Subject Property present: ${hasSubject ? '✓ YES' : '✗ NO'}`);
    }

    console.log('='.repeat(80));

  } catch (error) {
    console.error('ERROR reading Excel file:', error.message);
    console.error(error.stack);
  }
}

inspectExcel();
