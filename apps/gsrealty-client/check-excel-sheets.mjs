/**
 * Check Excel sheets and data
 */

import ExcelJS from 'exceljs';
import { readFileSync } from 'fs';

async function checkExcel(filename) {
  console.log(`\n📊 Checking: ${filename}\n`);

  const buffer = readFileSync(filename);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  console.log(`Sheets found: ${workbook.worksheets.length}`);
  console.log(`Sheet names: ${workbook.worksheets.map(s => s.name).join(', ')}\n`);

  const analysisSheet = workbook.getWorksheet('Analysis');
  if (!analysisSheet) {
    console.log('❌ No "Analysis" sheet found');
    return;
  }

  console.log(`Analysis sheet rows: ${analysisSheet.rowCount}`);
  console.log(`Analysis sheet columns: ${analysisSheet.columnCount}\n`);

  // Read first 5 rows
  console.log('First 5 rows:');
  for (let i = 1; i <= Math.min(5, analysisSheet.rowCount); i++) {
    const row = analysisSheet.getRow(i);
    const values = [];
    for (let j = 1; j <= Math.min(10, analysisSheet.columnCount); j++) {
      values.push(row.getCell(j).value);
    }
    console.log(`Row ${i}:`, values.slice(0, 5));
  }
}

checkExcel('gsrealty-client-template.xlsx');
