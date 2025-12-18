import ExcelJS from 'exceljs';

async function inspectExcel() {
  const filePath = '/Users/garrettsullivan/Desktop/‼️/RE/RealtyONE/MY LISTINGS/Mozingo 10.25/Uploads/Upload_Mozingo_2025-10-24-1655.xlsx';

  console.log('🔍 Inspecting Excel file:', filePath);
  console.log('='.repeat(80));

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  console.log('\n📊 WORKBOOK OVERVIEW');
  console.log('Total sheets:', workbook.worksheets.length);
  workbook.worksheets.forEach(sheet => {
    console.log(`  - ${sheet.name}: ${sheet.rowCount} rows, ${sheet.columnCount} columns`);
  });

  // Check Full-MCAO-API sheet
  console.log('\n\n📋 FULL-MCAO-API SHEET');
  console.log('='.repeat(80));
  const mcaoSheet = workbook.getWorksheet('Full-MCAO-API');
  if (mcaoSheet) {
    console.log('Total rows:', mcaoSheet.rowCount);
    console.log('\nFirst 15 rows, Column B (Item):');
    for (let i = 1; i <= Math.min(15, mcaoSheet.rowCount); i++) {
      const itemValue = mcaoSheet.getRow(i).getCell(2).value;
      const typeValue = mcaoSheet.getRow(i).getCell(3).value; // Column C (Type)
      console.log(`  Row ${i.toString().padStart(2)}, Col B: "${itemValue}" | Col C: "${typeValue}"`);
    }
  } else {
    console.log('❌ Full-MCAO-API sheet not found!');
  }

  // Check Analysis sheet
  console.log('\n\n📈 ANALYSIS SHEET');
  console.log('='.repeat(80));
  const analysisSheet = workbook.getWorksheet('Analysis');
  if (analysisSheet) {
    console.log('Total rows:', analysisSheet.rowCount);
    console.log('\nFirst 15 rows, Column A (Item):');
    for (let i = 1; i <= Math.min(15, analysisSheet.rowCount); i++) {
      const itemValue = analysisSheet.getRow(i).getCell(1).value;
      const valueCol = analysisSheet.getRow(i).getCell(2).value; // Column B (Value)
      console.log(`  Row ${i.toString().padStart(2)}, Col A: "${itemValue}" | Col B: "${valueCol}"`);
    }
  } else {
    console.log('❌ Analysis sheet not found!');
  }

  // Search for "Subject" anywhere in the workbook
  console.log('\n\n🔎 SEARCHING FOR "SUBJECT" IN ENTIRE WORKBOOK');
  console.log('='.repeat(80));
  let foundSubject = false;

  workbook.worksheets.forEach(sheet => {
    sheet.eachRow((row, rowNum) => {
      row.eachCell((cell, colNum) => {
        if (cell.value) {
          const cellStr = cell.value.toString().toLowerCase();
          if (cellStr.includes('subject')) {
            foundSubject = true;
            const colLetter = String.fromCharCode(64 + colNum);
            console.log(`  ✓ Found in [${sheet.name}] ${colLetter}${rowNum}: "${cell.value}"`);
          }
        }
      });
    });
  });

  if (!foundSubject) {
    console.log('  ❌ NO "Subject" found anywhere in the workbook!');
  }

  // List all unique property items from Full-MCAO-API
  console.log('\n\n🏠 ALL PROPERTIES IN FULL-MCAO-API (Column B)');
  console.log('='.repeat(80));
  if (mcaoSheet) {
    const uniqueItems = new Set<string>();
    mcaoSheet.eachRow((row, rowNum) => {
      if (rowNum > 1) { // Skip header
        const itemValue = row.getCell(2).value;
        if (itemValue) {
          uniqueItems.add(itemValue.toString());
        }
      }
    });

    console.log('Unique properties found:', uniqueItems.size);
    Array.from(uniqueItems).forEach((item, idx) => {
      console.log(`  ${(idx + 1).toString().padStart(2)}. ${item}`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Inspection complete');
}

inspectExcel().catch(err => {
  console.error('❌ Error:', err.message);
  console.error(err.stack);
});
