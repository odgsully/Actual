/**
 * Template Populator for CRM Excel Template
 *
 * Populates gs-crm-template.xlsx with comparable sales data
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
import type { MCAOApiResponse } from '@/lib/types/mcao-data';
import { toMaricopaSheetData } from '@/lib/types/mcao-data';

// ============================================================================
// Constants
// ============================================================================

const LOG_PREFIX = '[CRM Excel - Template]';

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
 * @param mcaoData - MCAO API data (optional) - supports both MCAOData and MCAOApiResponse
 * @returns Promise with populated workbook and statistics
 */
export async function populateTemplate(
  templatePath: string,
  compsData: MLSRow[],
  subjectProperty: PropertyData,
  mcaoData?: MCAOData | MCAOApiResponse
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
 * Convert MCAOApiResponse to MCAOData (for backward compatibility)
 */
function convertMCAOApiResponseToMCAOData(apiResponse: MCAOApiResponse): MCAOData {
  return {
    apn: apiResponse.apn,
    parcelId: apiResponse.parcelNumber,
    ownerName: apiResponse.ownerName,
    ownerAddress: apiResponse.ownerAddress
      ? `${apiResponse.ownerAddress.street}, ${apiResponse.ownerAddress.city}, ${apiResponse.ownerAddress.state} ${apiResponse.ownerAddress.zip}`
      : '',
    legalDescription: apiResponse.legalDescription,
    propertyAddress: apiResponse.propertyAddress.fullAddress,
    propertyCity: apiResponse.propertyAddress.city,
    propertyZip: apiResponse.propertyAddress.zip,
    propertyClass: apiResponse.propertyType,
    landUseCode: apiResponse.landUse,
    legalClass: apiResponse.propertyType,
    subdivision: apiResponse.subdivision || null,
    lotNumber: apiResponse.lot || null,
    blockNumber: apiResponse.block || null,
    section: null,
    township: null,
    range: null,
    assessedLandValue: apiResponse.assessedValue.land,
    assessedImprovementValue: apiResponse.assessedValue.improvement,
    totalAssessedValue: apiResponse.assessedValue.total,
    fullCashValueLand: apiResponse.assessedValue.land,
    fullCashValueImprovement: apiResponse.assessedValue.improvement,
    fullCashValueTotal: apiResponse.assessedValue.total,
    taxAmount: apiResponse.taxInfo.taxAmount,
    taxYear: apiResponse.taxInfo.taxYear,
    sqftLiving: apiResponse.improvementSize || 0,
    sqftLot: apiResponse.lotSize,
    yearBuilt: apiResponse.yearBuilt || 0,
    bedrooms: apiResponse.bedrooms || 0,
    bathrooms: apiResponse.bathrooms || 0,
    hasPool: apiResponse.features?.pool || false,
    garageType: null,
    garageSpaces: apiResponse.features?.garageSpaces || 0,
    stories: apiResponse.stories || 1,
    constructionType: apiResponse.constructionType || null,
    roofType: apiResponse.roofType || null,
    exteriorWalls: null,
    lastSaleDate: apiResponse.salesHistory?.[0]?.saleDate
      ? new Date(apiResponse.salesHistory[0].saleDate)
      : null,
    lastSalePrice: apiResponse.salesHistory?.[0]?.salePrice || null,
    saleDocumentNumber: apiResponse.salesHistory?.[0]?.recordingNumber || null,
    zoning: apiResponse.zoning || null,
    apiCallTimestamp: new Date(apiResponse.lastUpdated),
    apiResponseStatus: 'Success',
    taxHistory: undefined,
  };
}

/**
 * Populate Full_API_call sheet with MCAO data
 * Now supports both MCAOData and MCAOApiResponse types
 */
async function populateFullAPICallSheet(
  workbook: ExcelJS.Workbook,
  mcaoData: MCAOData | MCAOApiResponse,
  stats: TemplatePopulationStats
): Promise<void> {
  console.log(`${LOG_PREFIX} Populating Full_API_call sheet`);

  const sheet = workbook.getWorksheet(TEMPLATE_SHEETS.FULL_API_CALL);
  if (!sheet) {
    stats.warnings.push({ message: 'Full_API_call sheet not found, skipping' });
    return;
  }

  // Convert MCAOApiResponse to MCAOData if needed
  const data: MCAOData =
    'apiVersion' in mcaoData
      ? convertMCAOApiResponseToMCAOData(mcaoData as MCAOApiResponse)
      : (mcaoData as MCAOData);

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
  dataRow.getCell('B').value = data.apn;
  dataRow.getCell('C').value = data.parcelId;
  dataRow.getCell('D').value = data.ownerName;
  dataRow.getCell('E').value = data.ownerAddress;
  dataRow.getCell('F').value = data.legalDescription;
  dataRow.getCell('G').value = data.propertyAddress;
  dataRow.getCell('H').value = data.propertyCity;
  dataRow.getCell('I').value = data.propertyZip;
  dataRow.getCell('J').value = data.propertyClass;
  dataRow.getCell('K').value = data.landUseCode;
  dataRow.getCell('L').value = data.legalClass;
  dataRow.getCell('M').value = data.subdivision;
  dataRow.getCell('N').value = data.lotNumber;
  dataRow.getCell('O').value = data.blockNumber;
  dataRow.getCell('P').value = data.section;
  dataRow.getCell('Q').value = data.township;
  dataRow.getCell('R').value = data.range;
  dataRow.getCell('S').value = data.assessedLandValue;
  dataRow.getCell('T').value = data.assessedImprovementValue;
  dataRow.getCell('U').value = data.totalAssessedValue;
  dataRow.getCell('V').value = data.fullCashValueLand;
  dataRow.getCell('W').value = data.fullCashValueImprovement;
  dataRow.getCell('X').value = data.fullCashValueTotal;
  dataRow.getCell('Y').value = data.taxAmount;
  dataRow.getCell('Z').value = data.taxYear;
  dataRow.getCell('AA').value = data.sqftLiving;
  dataRow.getCell('AB').value = data.sqftLot;
  dataRow.getCell('AC').value = data.yearBuilt;
  dataRow.getCell('AD').value = data.bedrooms;
  dataRow.getCell('AE').value = data.bathrooms;
  dataRow.getCell('AF').value = data.hasPool ? 'Y' : 'N';
  dataRow.getCell('AG').value = data.garageType;
  dataRow.getCell('AH').value = data.garageSpaces;
  dataRow.getCell('AI').value = data.stories;
  dataRow.getCell('AJ').value = data.constructionType;
  dataRow.getCell('AK').value = data.roofType;
  dataRow.getCell('AL').value = data.exteriorWalls;
  dataRow.getCell('AM').value = data.lastSaleDate;
  dataRow.getCell('AN').value = data.lastSalePrice;
  dataRow.getCell('AO').value = data.saleDocumentNumber;
  dataRow.getCell('AP').value = data.zoning;
  dataRow.getCell('AQ').value = data.apiCallTimestamp;
  dataRow.getCell('AR').value = data.apiResponseStatus;

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
 * Now supports both MCAOData and MCAOApiResponse types
 * Uses toMaricopaSheetData() helper for MCAOApiResponse
 */
async function populateMaricopaSheet(
  workbook: ExcelJS.Workbook,
  mcaoData: MCAOData | MCAOApiResponse,
  stats: TemplatePopulationStats
): Promise<void> {
  console.log(`${LOG_PREFIX} Populating Maricopa sheet`);

  const sheet = workbook.getWorksheet(TEMPLATE_SHEETS.MARICOPA);
  if (!sheet) {
    stats.warnings.push({ message: 'Maricopa sheet not found, skipping' });
    return;
  }

  // Convert MCAOApiResponse to formatted sheet data if needed
  if ('apiVersion' in mcaoData) {
    const sheetData = toMaricopaSheetData(mcaoData as MCAOApiResponse);

    // Populate using the helper's formatted data (rows 2-24)
    const dataMapping: Record<number, { label: string; value: string }> = {
      2: { label: 'APN', value: sheetData.apn },
      3: { label: 'Owner Name', value: sheetData.ownerName },
      4: { label: 'Property Address', value: sheetData.propertyAddress },
      5: { label: 'Legal Description', value: sheetData.legalDescription },
      6: { label: 'Lot Size', value: sheetData.lotSize },
      7: { label: 'Year Built', value: sheetData.yearBuilt },
      8: { label: 'Property Type', value: sheetData.propertyType },
      9: { label: 'Land Use', value: sheetData.landUse },
      10: { label: 'Zoning', value: sheetData.zoning },
      11: { label: 'Assessed Value (Total)', value: sheetData.assessedValueTotal },
      12: { label: 'Assessed Value (Land)', value: sheetData.assessedValueLand },
      13: { label: 'Assessed Value (Improvement)', value: sheetData.assessedValueImprovement },
      14: { label: 'Tax Year', value: sheetData.taxYear },
      15: { label: 'Tax Amount', value: sheetData.taxAmount },
      16: { label: 'Tax Rate', value: sheetData.taxRate },
      17: { label: 'Subdivision', value: sheetData.subdivision },
      18: { label: 'Lot', value: sheetData.lot },
      19: { label: 'Block', value: sheetData.block },
      20: { label: 'Bedrooms', value: sheetData.bedrooms },
      21: { label: 'Bathrooms', value: sheetData.bathrooms },
      22: { label: 'Improvement Size', value: sheetData.improvementSize },
      23: { label: 'Construction Type', value: sheetData.constructionType },
      24: { label: 'Features', value: sheetData.features },
    };

    // Populate rows 2-24
    for (const [rowNum, data] of Object.entries(dataMapping)) {
      const row = sheet.getRow(parseInt(rowNum));
      row.getCell('A').value = ''; // Reserved
      row.getCell('B').value = data.label;
      row.getCell('B').font = { bold: true };
      row.getCell('C').value = data.value;
    }

    // Matrix data if provided
    if (sheetData.matrixData && sheetData.matrixData.length > 0) {
      sheetData.matrixData.forEach((matrixRow) => {
        const row = sheet.getRow(matrixRow.row);
        row.getCell('C').value = matrixRow.columnC;
        row.getCell('D').value = matrixRow.columnD;
      });
    }
  } else {
    // Legacy MCAOData format
    const data = mcaoData as MCAOData;

    // Rows 2-24: Two-column format (B=label, C=value)
    // Column A is BLANK (reserved)
    const dataMapping: Record<number, { label: string; value: any }> = {
      2: { label: 'APN', value: data.apn },
      3: { label: 'Owner Name', value: data.ownerName },
      4: { label: 'Legal Description', value: data.legalDescription },
      5: { label: 'Property Address', value: data.propertyAddress },
      6: { label: 'Subdivision', value: data.subdivision },
      7: { label: 'Lot Number', value: data.lotNumber },
      8: {
        label: 'Section/Township/Range',
        value: `${data.section || ''}/${data.township || ''}/${data.range || ''}`,
      },
      9: { label: 'Assessed Value (Land)', value: data.assessedLandValue },
      10: { label: 'Assessed Value (Improvements)', value: data.assessedImprovementValue },
      11: { label: 'Total Assessed Value', value: data.totalAssessedValue },
      12: { label: 'Full Cash Value (Land)', value: data.fullCashValueLand },
      13: { label: 'Full Cash Value (Improvements)', value: data.fullCashValueImprovement },
      14: { label: 'Full Cash Value (Total)', value: data.fullCashValueTotal },
      15: { label: 'Tax Amount', value: data.taxAmount },
      16: { label: 'Tax Year', value: data.taxYear },
      17: { label: 'Year Built', value: data.yearBuilt },
      18: { label: 'Living Area (SqFt)', value: data.sqftLiving },
      19: { label: 'Lot Size (SqFt)', value: data.sqftLot },
      20: { label: 'Bedrooms', value: data.bedrooms },
      21: { label: 'Bathrooms', value: data.bathrooms },
      22: { label: 'Pool', value: data.hasPool ? 'Yes' : 'No' },
      23: { label: 'Zoning', value: data.zoning },
      24: { label: 'Last Sale Date', value: data.lastSaleDate },
    };

    // Populate rows 2-24
    for (const [rowNum, rowData] of Object.entries(dataMapping)) {
      const row = sheet.getRow(parseInt(rowNum));
      row.getCell('A').value = ''; // Reserved
      row.getCell('B').value = rowData.label;
      row.getCell('B').font = { bold: true };
      row.getCell('C').value = rowData.value;

      // Format currency
      if (rowData.label.includes('Value') || rowData.label.includes('Tax Amount')) {
        row.getCell('C').numFmt = '$#,##0.00';
      }

      // Format date
      if (rowData.label.includes('Date')) {
        row.getCell('C').numFmt = 'mm/dd/yyyy';
      }
    }

    // Rows 26+: Matrix format (tax history)
    if (data.taxHistory && data.taxHistory.length > 0) {
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
      data.taxHistory.forEach((record, index) => {
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
  }

  console.log(`${LOG_PREFIX} Maricopa sheet populated`);
}

// ============================================================================
// Lot Sheet Population
// ============================================================================

/**
 * Populate Lot sheet with light grey background
 * Now supports both MCAOData and MCAOApiResponse types
 */
async function populateLotSheet(
  workbook: ExcelJS.Workbook,
  mcaoData: MCAOData | MCAOApiResponse,
  stats: TemplatePopulationStats
): Promise<void> {
  console.log(`${LOG_PREFIX} Populating Lot sheet`);

  const sheet = workbook.getWorksheet(TEMPLATE_SHEETS.LOT);
  if (!sheet) {
    stats.warnings.push({ message: 'Lot sheet not found, skipping' });
    return;
  }

  // Convert MCAOApiResponse to MCAOData if needed
  const data: MCAOData =
    'apiVersion' in mcaoData
      ? convertMCAOApiResponseToMCAOData(mcaoData as MCAOApiResponse)
      : (mcaoData as MCAOData);

  // Light grey background for all cells
  const greyFill: ExcelJS.FillPattern = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF2F2F2' }, // RGB(242, 242, 242)
  };

  // Lot dimensions section (rows 2-15)
  const lotData: Record<number, { label: string; value: any }> = {
    2: { label: 'Lot Size (SqFt)', value: data.sqftLot },
    3: { label: 'Lot Size (Acres)', value: data.sqftLot / 43560 },
    17: { label: 'Zoning Classification', value: data.zoning },
    18: { label: 'Land Use Code', value: data.landUseCode },
    19: { label: 'Legal Class', value: data.legalClass },
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
  return path.join(process.cwd(), 'gs-crm-template.xlsx');
}
