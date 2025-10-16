/**
 * Template Populator for GSRealty Excel Template
 *
 * Populates gsrealty-client-template.xlsx with comparable sales data
 * following strict column rules (Column A always reserved/blank).
 *
 * @module lib/processing/template-populator
 */

import ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';
import {
  MLSRow,
  PropertyData,
  PopulateTemplateResult,
  TemplatePopulationStats,
  ProcessingWarning,
  ProcessingError,
  TEMPLATE_SHEETS,
  COMPS_COLUMNS,
  MCAOData,
} from '@/lib/types/mls-data';

// ============================================================================
// Constants
// ============================================================================

const LOG_PREFIX = '[GSRealty Excel - Template]';

/**
 * Column A is ALWAYS reserved for manual notes
 * All automated data starts at Column B
 */
const RESERVED_COLUMN = 'A';
const DATA_START_COLUMN = 'B';
const DATA_START_ROW = 2;

/**
 * Distance threshold for .5mile sheet (in miles)
 */
const HALF_MILE_THRESHOLD = 0.5;

// ============================================================================
// Main Populator Function
// ============================================================================

/**
 * Populate template.xlsx with comp data
 *
 * @param templatePath - Path to template.xlsx file
 * @param compsData - Array of comparable sales from MLS
 * @param subjectProperty - Subject property data
 * @param mcaoData - MCAO API data (optional)
 * @returns Promise with populated workbook and statistics
 */
export async function populateTemplate(
  templatePath: string,
  compsData: MLSRow[],
  subjectProperty: PropertyData,
  mcaoData?: MCAOData
): Promise<PopulateTemplateResult> {
  const startTime = Date.now();
  const stats: TemplatePopulationStats = {
    compsPopulated: 0,
    halfMileCompsPopulated: 0,
    mcaoDataPopulated: false,
    analysisCalculated: false,
    lotDataPopulated: false,
    warnings: [],
    errors: [],
    processingTime: 0,
  };

  try {
    console.log(`${LOG_PREFIX} Loading template from:`, templatePath);

    // Load template workbook
    const workbook = await loadTemplate(templatePath);

    // Validate template structure
    const validation = validateTemplate(workbook);
    if (!validation.valid) {
      throw new Error(`Invalid template: ${validation.errors.join(', ')}`);
    }

    console.log(`${LOG_PREFIX} Template validated, sheets:`, workbook.worksheets.map(ws => ws.name));

    // Populate comps sheet
    await populateCompsSheet(workbook, compsData, stats);

    // Populate .5mile sheet (filtered comps)
    await populateHalfMileSheet(workbook, compsData, stats);

    // Populate Full_API_call sheet (if MCAO data provided)
    if (mcaoData) {
      await populateFullAPICallSheet(workbook, mcaoData, stats);
      await populateMaricopaSheet(workbook, mcaoData, stats);
      await populateLotSheet(workbook, mcaoData, stats);
    }

    // Update Analysis sheet (formulas will auto-calculate)
    await updateAnalysisSheet(workbook, subjectProperty, stats);

    // List populated sheets
    const populatedSheets: string[] = [
      TEMPLATE_SHEETS.COMPS,
      TEMPLATE_SHEETS.HALF_MILE,
    ];

    if (mcaoData) {
      populatedSheets.push(
        TEMPLATE_SHEETS.FULL_API_CALL as string,
        TEMPLATE_SHEETS.MARICOPA as string,
        TEMPLATE_SHEETS.LOT as string
      );
    }

    stats.processingTime = Date.now() - startTime;

    console.log(`${LOG_PREFIX} Template population complete:`, {
      comps: stats.compsPopulated,
      halfMile: stats.halfMileCompsPopulated,
      mcao: stats.mcaoDataPopulated,
      sheets: populatedSheets.length,
    });

    return {
      workbook,
      populatedSheets,
      stats,
      error: null,
    };
  } catch (error) {
    console.error(`${LOG_PREFIX} Fatal error:`, error);
    stats.processingTime = Date.now() - startTime;

    return {
      workbook: null as any,
      populatedSheets: [],
      stats,
      error: error instanceof Error ? error : new Error('Unknown error occurred'),
    };
  }
}

// ============================================================================
// Template Loading
// ============================================================================

/**
 * Load template workbook from file path
 */
async function loadTemplate(templatePath: string): Promise<ExcelJS.Workbook> {
  // Check if running in browser (File object) or Node.js (path)
  if (typeof window !== 'undefined') {
    throw new Error('populateTemplate should be called server-side only');
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(templatePath);
  return workbook;
}

/**
 * Load template from buffer (for API usage)
 */
export async function loadTemplateFromBuffer(buffer: ArrayBuffer | Buffer): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);
  return workbook;
}

// ============================================================================
// Template Validation
// ============================================================================

interface TemplateValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate template has required sheets and structure
 */
function validateTemplate(workbook: ExcelJS.Workbook): TemplateValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required sheets exist
  const requiredSheets = [
    TEMPLATE_SHEETS.COMPS,
    TEMPLATE_SHEETS.FULL_API_CALL,
    TEMPLATE_SHEETS.ANALYSIS,
    TEMPLATE_SHEETS.MARICOPA,
    TEMPLATE_SHEETS.HALF_MILE,
    TEMPLATE_SHEETS.LOT,
  ];

  for (const sheetName of requiredSheets) {
    const sheet = workbook.getWorksheet(sheetName);
    if (!sheet) {
      errors.push(`Missing required sheet: ${sheetName}`);
    }
  }

  // Check comps sheet has header row with "Notes" in column A
  const compsSheet = workbook.getWorksheet(TEMPLATE_SHEETS.COMPS);
  if (compsSheet) {
    const headerCell = compsSheet.getCell('A1');
    if (headerCell.value?.toString().toLowerCase() !== 'notes') {
      warnings.push('Column A header should be "Notes"');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// Comps Sheet Population
// ============================================================================

/**
 * Populate comps sheet with MLS data
 * CRITICAL: Column A must remain blank (reserved for Notes)
 */
async function populateCompsSheet(
  workbook: ExcelJS.Workbook,
  compsData: MLSRow[],
  stats: TemplatePopulationStats
): Promise<void> {
  console.log(`${LOG_PREFIX} Populating comps sheet with ${compsData.length} rows`);

  const sheet = workbook.getWorksheet(TEMPLATE_SHEETS.COMPS);
  if (!sheet) {
    throw new Error('Comps sheet not found in template');
  }

  // Ensure header row exists with "Notes" in A1
  const headerRow = sheet.getRow(1);
  if (!headerRow.getCell(1).value) {
    headerRow.getCell(1).value = 'Notes';
  }

  // Populate data rows starting at row 2
  for (let i = 0; i < compsData.length; i++) {
    const comp = compsData[i];
    const rowNumber = DATA_START_ROW + i;
    const row = sheet.getRow(rowNumber);

    try {
      // Column A: Leave BLANK (reserved)
      row.getCell(RESERVED_COLUMN).value = '';

      // Column B onwards: Populate with MLS data
      populateCompRow(row, comp);

      // Format row
      formatCompRow(row);

      stats.compsPopulated++;
    } catch (error) {
      stats.errors.push({
        row: rowNumber,
        message: `Error populating comp: ${error instanceof Error ? error.message : 'Unknown'}`,
      });
    }
  }

  console.log(`${LOG_PREFIX} Populated ${stats.compsPopulated} comps`);
}

/**
 * Populate a single comp row (starting at Column B)
 */
function populateCompRow(row: ExcelJS.Row, comp: MLSRow): void {
  // Use column letters from COMPS_COLUMNS constant
  row.getCell(COMPS_COLUMNS.ADDRESS).value = comp.address;
  row.getCell(COMPS_COLUMNS.CITY).value = comp.city;
  row.getCell(COMPS_COLUMNS.STATE).value = comp.state;
  row.getCell(COMPS_COLUMNS.ZIP).value = comp.zip;
  row.getCell(COMPS_COLUMNS.APN).value = comp.apn;
  row.getCell(COMPS_COLUMNS.SALE_PRICE).value = comp.salePrice;
  row.getCell(COMPS_COLUMNS.SALE_DATE).value = comp.saleDate;
  row.getCell(COMPS_COLUMNS.LIST_PRICE).value = comp.listPrice;
  row.getCell(COMPS_COLUMNS.DAYS_ON_MARKET).value = comp.daysOnMarket;
  row.getCell(COMPS_COLUMNS.PROPERTY_TYPE).value = comp.propertyType;
  row.getCell(COMPS_COLUMNS.BEDROOMS).value = comp.bedrooms;
  row.getCell(COMPS_COLUMNS.BATHROOMS).value = comp.bathrooms;
  row.getCell(COMPS_COLUMNS.SQUARE_FEET).value = comp.squareFeet;
  row.getCell(COMPS_COLUMNS.LOT_SIZE).value = comp.lotSize;
  row.getCell(COMPS_COLUMNS.YEAR_BUILT).value = comp.yearBuilt;
  row.getCell(COMPS_COLUMNS.GARAGE_SPACES).value = comp.garageSpaces;
  row.getCell(COMPS_COLUMNS.POOL).value = comp.pool ? 'Y' : 'N';
  row.getCell(COMPS_COLUMNS.STORIES).value = comp.stories;
  row.getCell(COMPS_COLUMNS.HOA).value = comp.hoa ? 'Y' : 'N';
  row.getCell(COMPS_COLUMNS.HOA_FEE).value = comp.hoaFee;
  row.getCell(COMPS_COLUMNS.PRICE_PER_SQFT).value = comp.pricePerSqFt;
  row.getCell(COMPS_COLUMNS.DISTANCE).value = comp.distance;
  row.getCell(COMPS_COLUMNS.MLS_NUMBER).value = comp.mlsNumber;
  row.getCell(COMPS_COLUMNS.STATUS).value = comp.statusDisplay;
  row.getCell(COMPS_COLUMNS.REMARKS).value = comp.remarks;

  // Extended columns
  row.getCell(COMPS_COLUMNS.FIREPLACE).value = comp.fireplace ? 'Y' : 'N';
  row.getCell(COMPS_COLUMNS.SUBDIVISION).value = comp.subdivision;
  row.getCell(COMPS_COLUMNS.LISTING_AGENT).value = comp.listingAgent;
  row.getCell(COMPS_COLUMNS.LISTING_AGENCY).value = comp.listingAgency;
  row.getCell(COMPS_COLUMNS.UNDER_CONTRACT_DATE).value = comp.underContractDate;
  row.getCell(COMPS_COLUMNS.TAX_YEAR).value = comp.taxYear;
  row.getCell(COMPS_COLUMNS.ANNUAL_TAXES).value = comp.annualTaxes;
  row.getCell(COMPS_COLUMNS.LEGAL_DESCRIPTION).value = comp.legalDescription;
  row.getCell(COMPS_COLUMNS.GEO_LAT).value = comp.latitude;
  row.getCell(COMPS_COLUMNS.GEO_LON).value = comp.longitude;
}

/**
 * Format comp row with proper number/date formats
 */
function formatCompRow(row: ExcelJS.Row): void {
  // Currency format
  const currencyCells = [
    COMPS_COLUMNS.SALE_PRICE,
    COMPS_COLUMNS.LIST_PRICE,
    COMPS_COLUMNS.HOA_FEE,
    COMPS_COLUMNS.PRICE_PER_SQFT,
    COMPS_COLUMNS.ANNUAL_TAXES,
  ];

  currencyCells.forEach((col) => {
    const cell = row.getCell(col);
    if (cell.value) {
      cell.numFmt = '$#,##0.00';
    }
  });

  // Date format
  const dateCells = [
    COMPS_COLUMNS.SALE_DATE,
    COMPS_COLUMNS.UNDER_CONTRACT_DATE,
  ];

  dateCells.forEach((col) => {
    const cell = row.getCell(col);
    if (cell.value) {
      cell.numFmt = 'mm/dd/yyyy';
    }
  });

  // Integer format
  const integerCells = [
    COMPS_COLUMNS.BEDROOMS,
    COMPS_COLUMNS.SQUARE_FEET,
    COMPS_COLUMNS.LOT_SIZE,
    COMPS_COLUMNS.YEAR_BUILT,
    COMPS_COLUMNS.GARAGE_SPACES,
    COMPS_COLUMNS.STORIES,
    COMPS_COLUMNS.DAYS_ON_MARKET,
  ];

  integerCells.forEach((col) => {
    const cell = row.getCell(col);
    if (cell.value) {
      cell.numFmt = '0';
    }
  });

  // Decimal format (bathrooms, distance)
  row.getCell(COMPS_COLUMNS.BATHROOMS).numFmt = '0.00';
  row.getCell(COMPS_COLUMNS.DISTANCE).numFmt = '0.00';
}

// ============================================================================
// Half Mile Sheet Population
// ============================================================================

/**
 * Populate .5mile sheet with comps within 0.5 miles
 */
async function populateHalfMileSheet(
  workbook: ExcelJS.Workbook,
  compsData: MLSRow[],
  stats: TemplatePopulationStats
): Promise<void> {
  console.log(`${LOG_PREFIX} Populating .5mile sheet`);

  const sheet = workbook.getWorksheet(TEMPLATE_SHEETS.HALF_MILE);
  if (!sheet) {
    stats.warnings.push({ message: '.5mile sheet not found, skipping' });
    return;
  }

  // Filter comps within 0.5 miles
  const halfMileComps = compsData.filter((comp) => {
    return comp.distance !== null && comp.distance <= HALF_MILE_THRESHOLD;
  });

  console.log(`${LOG_PREFIX} Found ${halfMileComps.length} comps within 0.5 miles`);

  // Ensure header row
  const headerRow = sheet.getRow(1);
  if (!headerRow.getCell(1).value) {
    headerRow.getCell(1).value = 'Notes';
  }

  // Populate filtered comps (same format as comps sheet)
  for (let i = 0; i < halfMileComps.length; i++) {
    const comp = halfMileComps[i];
    const rowNumber = DATA_START_ROW + i;
    const row = sheet.getRow(rowNumber);

    try {
      // Column A: Leave BLANK (reserved)
      row.getCell(RESERVED_COLUMN).value = '';

      // Column B onwards: Populate
      populateCompRow(row, comp);
      formatCompRow(row);

      stats.halfMileCompsPopulated++;
    } catch (error) {
      stats.errors.push({
        row: rowNumber,
        message: `Error populating .5mile comp: ${error instanceof Error ? error.message : 'Unknown'}`,
      });
    }
  }

  console.log(`${LOG_PREFIX} Populated ${stats.halfMileCompsPopulated} half-mile comps`);
}

// ============================================================================
// Full API Call Sheet Population
// ============================================================================

/**
 * Populate Full_API_call sheet with MCAO data
 */
async function populateFullAPICallSheet(
  workbook: ExcelJS.Workbook,
  mcaoData: MCAOData,
  stats: TemplatePopulationStats
): Promise<void> {
  console.log(`${LOG_PREFIX} Populating Full_API_call sheet`);

  const sheet = workbook.getWorksheet(TEMPLATE_SHEETS.FULL_API_CALL);
  if (!sheet) {
    stats.warnings.push({ message: 'Full_API_call sheet not found, skipping' });
    return;
  }

  // Ensure header row
  const headerRow = sheet.getRow(1);
  if (!headerRow.getCell(1).value) {
    headerRow.getCell(1).value = 'Notes';
  }

  // Populate MCAO data starting at row 2
  const dataRow = sheet.getRow(DATA_START_ROW);

  // Column A: BLANK (reserved)
  dataRow.getCell('A').value = '';

  // Column B onwards: MCAO fields
  dataRow.getCell('B').value = mcaoData.apn;
  dataRow.getCell('C').value = mcaoData.parcelId;
  dataRow.getCell('D').value = mcaoData.ownerName;
  dataRow.getCell('E').value = mcaoData.ownerAddress;
  dataRow.getCell('F').value = mcaoData.legalDescription;
  dataRow.getCell('G').value = mcaoData.propertyAddress;
  dataRow.getCell('H').value = mcaoData.propertyCity;
  dataRow.getCell('I').value = mcaoData.propertyZip;
  dataRow.getCell('J').value = mcaoData.propertyClass;
  dataRow.getCell('K').value = mcaoData.landUseCode;
  dataRow.getCell('L').value = mcaoData.legalClass;
  dataRow.getCell('M').value = mcaoData.subdivision;
  dataRow.getCell('N').value = mcaoData.lotNumber;
  dataRow.getCell('O').value = mcaoData.blockNumber;
  dataRow.getCell('P').value = mcaoData.section;
  dataRow.getCell('Q').value = mcaoData.township;
  dataRow.getCell('R').value = mcaoData.range;
  dataRow.getCell('S').value = mcaoData.assessedLandValue;
  dataRow.getCell('T').value = mcaoData.assessedImprovementValue;
  dataRow.getCell('U').value = mcaoData.totalAssessedValue;
  dataRow.getCell('V').value = mcaoData.fullCashValueLand;
  dataRow.getCell('W').value = mcaoData.fullCashValueImprovement;
  dataRow.getCell('X').value = mcaoData.fullCashValueTotal;
  dataRow.getCell('Y').value = mcaoData.taxAmount;
  dataRow.getCell('Z').value = mcaoData.taxYear;
  dataRow.getCell('AA').value = mcaoData.sqftLiving;
  dataRow.getCell('AB').value = mcaoData.sqftLot;
  dataRow.getCell('AC').value = mcaoData.yearBuilt;
  dataRow.getCell('AD').value = mcaoData.bedrooms;
  dataRow.getCell('AE').value = mcaoData.bathrooms;
  dataRow.getCell('AF').value = mcaoData.hasPool ? 'Y' : 'N';
  dataRow.getCell('AG').value = mcaoData.garageType;
  dataRow.getCell('AH').value = mcaoData.garageSpaces;
  dataRow.getCell('AI').value = mcaoData.stories;
  dataRow.getCell('AJ').value = mcaoData.constructionType;
  dataRow.getCell('AK').value = mcaoData.roofType;
  dataRow.getCell('AL').value = mcaoData.exteriorWalls;
  dataRow.getCell('AM').value = mcaoData.lastSaleDate;
  dataRow.getCell('AN').value = mcaoData.lastSalePrice;
  dataRow.getCell('AO').value = mcaoData.saleDocumentNumber;
  dataRow.getCell('AP').value = mcaoData.zoning;
  dataRow.getCell('AQ').value = mcaoData.apiCallTimestamp;
  dataRow.getCell('AR').value = mcaoData.apiResponseStatus;

  // Format currency and date cells
  ['S', 'T', 'U', 'V', 'W', 'X', 'Y', 'AN'].forEach((col) => {
    dataRow.getCell(col).numFmt = '$#,##0.00';
  });

  ['AM', 'AQ'].forEach((col) => {
    dataRow.getCell(col).numFmt = 'mm/dd/yyyy hh:mm';
  });

  stats.mcaoDataPopulated = true;
  console.log(`${LOG_PREFIX} MCAO data populated`);
}

// ============================================================================
// Maricopa Sheet Population
// ============================================================================

/**
 * Populate Maricopa sheet with two-column format (rows 2-24)
 */
async function populateMaricopaSheet(
  workbook: ExcelJS.Workbook,
  mcaoData: MCAOData,
  stats: TemplatePopulationStats
): Promise<void> {
  console.log(`${LOG_PREFIX} Populating Maricopa sheet`);

  const sheet = workbook.getWorksheet(TEMPLATE_SHEETS.MARICOPA);
  if (!sheet) {
    stats.warnings.push({ message: 'Maricopa sheet not found, skipping' });
    return;
  }

  // Rows 2-24: Two-column format (B=label, C=value)
  // Column A is BLANK (reserved)
  const dataMapping: Record<number, { label: string; value: any }> = {
    2: { label: 'APN', value: mcaoData.apn },
    3: { label: 'Owner Name', value: mcaoData.ownerName },
    4: { label: 'Legal Description', value: mcaoData.legalDescription },
    5: { label: 'Property Address', value: mcaoData.propertyAddress },
    6: { label: 'Subdivision', value: mcaoData.subdivision },
    7: { label: 'Lot Number', value: mcaoData.lotNumber },
    8: {
      label: 'Section/Township/Range',
      value: `${mcaoData.section || ''}/${mcaoData.township || ''}/${mcaoData.range || ''}`,
    },
    9: { label: 'Assessed Value (Land)', value: mcaoData.assessedLandValue },
    10: { label: 'Assessed Value (Improvements)', value: mcaoData.assessedImprovementValue },
    11: { label: 'Total Assessed Value', value: mcaoData.totalAssessedValue },
    12: { label: 'Full Cash Value (Land)', value: mcaoData.fullCashValueLand },
    13: { label: 'Full Cash Value (Improvements)', value: mcaoData.fullCashValueImprovement },
    14: { label: 'Full Cash Value (Total)', value: mcaoData.fullCashValueTotal },
    15: { label: 'Tax Amount', value: mcaoData.taxAmount },
    16: { label: 'Tax Year', value: mcaoData.taxYear },
    17: { label: 'Year Built', value: mcaoData.yearBuilt },
    18: { label: 'Living Area (SqFt)', value: mcaoData.sqftLiving },
    19: { label: 'Lot Size (SqFt)', value: mcaoData.sqftLot },
    20: { label: 'Bedrooms', value: mcaoData.bedrooms },
    21: { label: 'Bathrooms', value: mcaoData.bathrooms },
    22: { label: 'Pool', value: mcaoData.hasPool ? 'Yes' : 'No' },
    23: { label: 'Zoning', value: mcaoData.zoning },
    24: { label: 'Last Sale Date', value: mcaoData.lastSaleDate },
  };

  // Populate rows 2-24
  for (const [rowNum, data] of Object.entries(dataMapping)) {
    const row = sheet.getRow(parseInt(rowNum));
    row.getCell('A').value = ''; // Reserved
    row.getCell('B').value = data.label;
    row.getCell('B').font = { bold: true };
    row.getCell('C').value = data.value;

    // Format currency
    if (data.label.includes('Value') || data.label.includes('Tax Amount')) {
      row.getCell('C').numFmt = '$#,##0.00';
    }

    // Format date
    if (data.label.includes('Date')) {
      row.getCell('C').numFmt = 'mm/dd/yyyy';
    }
  }

  // Rows 26+: Matrix format (tax history)
  if (mcaoData.taxHistory && mcaoData.taxHistory.length > 0) {
    const matrixStartRow = 26;

    // Headers
    const headerRow = sheet.getRow(matrixStartRow);
    headerRow.getCell('B').value = 'Tax Year';
    headerRow.getCell('C').value = 'Assessed Value';
    headerRow.getCell('D').value = 'Tax Amount';
    headerRow.getCell('E').value = 'Tax Rate';

    // Make headers bold
    ['B', 'C', 'D', 'E'].forEach((col) => {
      headerRow.getCell(col).font = { bold: true };
    });

    // Data rows
    mcaoData.taxHistory.forEach((record, index) => {
      const row = sheet.getRow(matrixStartRow + 1 + index);
      row.getCell('B').value = record.taxYear;
      row.getCell('C').value = record.assessedValue;
      row.getCell('D').value = record.taxAmount;
      row.getCell('E').value = record.taxRate;

      // Format
      row.getCell('C').numFmt = '$#,##0.00';
      row.getCell('D').numFmt = '$#,##0.00';
      row.getCell('E').numFmt = '0.00%';
    });
  }

  console.log(`${LOG_PREFIX} Maricopa sheet populated`);
}

// ============================================================================
// Lot Sheet Population
// ============================================================================

/**
 * Populate Lot sheet with light grey background
 */
async function populateLotSheet(
  workbook: ExcelJS.Workbook,
  mcaoData: MCAOData,
  stats: TemplatePopulationStats
): Promise<void> {
  console.log(`${LOG_PREFIX} Populating Lot sheet`);

  const sheet = workbook.getWorksheet(TEMPLATE_SHEETS.LOT);
  if (!sheet) {
    stats.warnings.push({ message: 'Lot sheet not found, skipping' });
    return;
  }

  // Light grey background for all cells
  const greyFill: ExcelJS.FillPattern = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF2F2F2' }, // RGB(242, 242, 242)
  };

  // Lot dimensions section (rows 2-15)
  const lotData: Record<number, { label: string; value: any }> = {
    2: { label: 'Lot Size (SqFt)', value: mcaoData.sqftLot },
    3: { label: 'Lot Size (Acres)', value: mcaoData.sqftLot / 43560 },
    17: { label: 'Zoning Classification', value: mcaoData.zoning },
    18: { label: 'Land Use Code', value: mcaoData.landUseCode },
    19: { label: 'Legal Class', value: mcaoData.legalClass },
  };

  for (const [rowNum, data] of Object.entries(lotData)) {
    const row = sheet.getRow(parseInt(rowNum));
    row.getCell('A').fill = greyFill;
    row.getCell('B').value = data.label;
    row.getCell('B').font = { bold: true };
    row.getCell('B').fill = greyFill;
    row.getCell('C').value = data.value;
    row.getCell('C').fill = greyFill;
  }

  stats.lotDataPopulated = true;
  console.log(`${LOG_PREFIX} Lot sheet populated`);
}

// ============================================================================
// Analysis Sheet Updates
// ============================================================================

/**
 * Update Analysis sheet with subject property info
 * Formulas will auto-calculate from comps sheet
 */
async function updateAnalysisSheet(
  workbook: ExcelJS.Workbook,
  subjectProperty: PropertyData,
  stats: TemplatePopulationStats
): Promise<void> {
  console.log(`${LOG_PREFIX} Updating Analysis sheet`);

  const sheet = workbook.getWorksheet(TEMPLATE_SHEETS.ANALYSIS);
  if (!sheet) {
    stats.warnings.push({ message: 'Analysis sheet not found, skipping' });
    return;
  }

  // Subject property section (rows 2-10)
  sheet.getRow(2).getCell('B').value = 'Subject Property';
  sheet.getRow(2).getCell('B').font = { bold: true, size: 14 };

  sheet.getRow(3).getCell('B').value = 'Address:';
  sheet.getRow(3).getCell('C').value = subjectProperty.address;

  sheet.getRow(4).getCell('B').value = 'APN:';
  sheet.getRow(4).getCell('C').value = subjectProperty.apn;

  sheet.getRow(5).getCell('B').value = 'Bedrooms/Bathrooms:';
  sheet.getRow(5).getCell('C').value = `${subjectProperty.bedrooms}/${subjectProperty.bathrooms}`;

  sheet.getRow(6).getCell('B').value = 'Square Feet:';
  sheet.getRow(6).getCell('C').value = subjectProperty.squareFeet;

  sheet.getRow(7).getCell('B').value = 'Year Built:';
  sheet.getRow(7).getCell('C').value = subjectProperty.yearBuilt;

  // Formulas in Analysis sheet reference comps sheet
  // They will auto-calculate when the workbook is opened in Excel
  stats.analysisCalculated = true;

  console.log(`${LOG_PREFIX} Analysis sheet updated`);
}

// ============================================================================
// Export Utilities
// ============================================================================

/**
 * Save workbook to file
 */
export async function saveWorkbook(
  workbook: ExcelJS.Workbook,
  outputPath: string
): Promise<void> {
  await workbook.xlsx.writeFile(outputPath);
  console.log(`${LOG_PREFIX} Workbook saved to:`, outputPath);
}

/**
 * Save workbook to buffer (for API responses)
 */
export async function saveWorkbookToBuffer(
  workbook: ExcelJS.Workbook
): Promise<Uint8Array> {
  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}

/**
 * Get default template path
 */
export function getDefaultTemplatePath(): string {
  return path.join(process.cwd(), 'gsrealty-client-template.xlsx');
}
