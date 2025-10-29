/**
 * Check all Excel sheets for data
 */

import ExcelJS from 'exceljs';
import { readFileSync } from 'fs';

async function checkExcel(filename) {
  console.log(`\n📊 Checking: ${filename}\n`);

  const buffer = readFileSync(filename);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  for (const sheet of workbook.worksheets) {
    console.log(`\n=== Sheet: ${sheet.name} ===`);
    console.log(`Rows: ${sheet.rowCount}, Columns: ${sheet.columnCount}`);

    if (sheet.rowCount > 1) {
      console.log(`✅ Has ${sheet.rowCount - 1} data rows`);

      // Show first 3 data rows
      console.log('\nSample data (first 3 rows):');
      for (let i = 1; i <= Math.min(4, sheet.rowCount); i++) {
        const row = sheet.getRow(i);
        const values = [];
        for (let j = 1; j <= Math.min(5, sheet.columnCount); j++) {
          const val = row.getCell(j).value;
          values.push(val ? String(val).substring(0, 30) : '');
        }
        console.log(`Row ${i}:`, values);
      }
    } else {
      console.log(`❌ Only has header row`);
    }
  }
}

checkExcel('gsrealty-client-template.xlsx');
