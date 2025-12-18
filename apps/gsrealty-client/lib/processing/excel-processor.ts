/**
 * Excel Processor for MLS Data
 *
 * Processes XLSX uploads (All scopes, Half mile, etc.) and extracts
 * property data for template population.
 *
 * @module lib/processing/excel-processor
 */

import ExcelJS from 'exceljs';
import {
  ProcessMLSExcelResult,
  PropertyData,
  ProcessingStats,
  ProcessingWarning,
  ProcessingError,
  UploadType,
  SubjectProperty,
} from '@/lib/types/mls-data';

// ============================================================================
// Constants
// ============================================================================

const LOG_PREFIX = '[GSRealty Excel - XLSX]';

/**
 * Expected sheet names in MLS Excel exports
 */
const EXPECTED_SHEETS = ['comps', 'Sheet1', 'Data', 'Export'];

// ============================================================================
// Main Processor Function
// ============================================================================

/**
 * Process MLS Excel workbook and extract property data
 *
 * @param file - File object from upload
 * @param uploadType - Type of upload (direct_comps, all_scopes, half_mile)
 * @param subjectProperty - Subject property for context (optional)
 * @returns Promise with workbook, extracted properties, stats, and any errors
 */
export async function processMLSExcel(
  file: File,
  uploadType: UploadType,
  subjectProperty?: SubjectProperty
): Promise<ProcessMLSExcelResult> {
  const startTime = Date.now();
  const stats: ProcessingStats = {
    totalRows: 0,
    validRows: 0,
    skippedRows: 0,
    processedRows: 0,
    warnings: [],
    errors: [],
    processingTime: 0,
    fileSize: file.size,
    fileName: file.name,
  };

  try {
    console.log(`${LOG_PREFIX} Starting Excel processing:`, {
      file: file.name,
      type: uploadType,
      size: file.size,
    });

    // Load workbook
    const workbook = await loadWorkbook(file);
    console.log(`${LOG_PREFIX} Workbook loaded, sheets:`, workbook.worksheets.map(ws => ws.name));

    // Find data sheet
    const dataSheet = findDataSheet(workbook);
    if (!dataSheet) {
      throw new Error('Could not find data sheet in workbook');
    }

    console.log(`${LOG_PREFIX} Using sheet: ${dataSheet.name}`);

    // Extract properties from sheet
    const properties = extractPropertiesFromSheet(
      dataSheet,
      uploadType,
      subjectProperty,
      stats
    );

    stats.processedRows = properties.length;
    stats.processingTime = Date.now() - startTime;

    console.log(`${LOG_PREFIX} Processing complete:`, {
      total: stats.totalRows,
      processed: stats.processedRows,
      skipped: stats.skippedRows,
      warnings: stats.warnings.length,
      errors: stats.errors.length,
    });

    return {
      workbook,
      properties,
      stats,
      error: null,
    };
  } catch (error) {
    console.error(`${LOG_PREFIX} Fatal error:`, error);
    stats.processingTime = Date.now() - startTime;

    return {
      workbook: null as any,
      properties: [],
      stats,
      error: error instanceof Error ? error : new Error('Unknown error occurred'),
    };
  }
}

// ============================================================================
// Workbook Loading
// ============================================================================

/**
 * Load Excel workbook from File object
 */
async function loadWorkbook(file: File): Promise<ExcelJS.Workbook> {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  return workbook;
}

// ============================================================================
// Sheet Detection
// ============================================================================

/**
 * Find the sheet containing property data
 */
function findDataSheet(workbook: ExcelJS.Workbook): ExcelJS.Worksheet | null {
  // Try to find sheet by expected names
  for (const sheetName of EXPECTED_SHEETS) {
    const sheet = workbook.getWorksheet(sheetName);
    if (sheet) return sheet;
  }

  // Fall back to first sheet with data
  for (const sheet of workbook.worksheets) {
    if (sheet.rowCount > 1) {
      return sheet;
    }
  }

  return null;
}

// ============================================================================
// Property Extraction
// ============================================================================

/**
 * Extract property data from worksheet
 */
function extractPropertiesFromSheet(
  sheet: ExcelJS.Worksheet,
  uploadType: UploadType,
  subjectProperty: SubjectProperty | undefined,
  stats: ProcessingStats
): PropertyData[] {
  const properties: PropertyData[] = [];

  // Get headers from first row
  const headerRow = sheet.getRow(1);
  const headers = extractHeaders(headerRow);

  console.log(`${LOG_PREFIX} Found ${headers.size} headers:`, Array.from(headers.keys()).slice(0, 10));

  // Get column indices for required fields
  const columnMap = buildColumnMap(headers);

  // Validate required columns exist
  const missingColumns = validateRequiredColumns(columnMap);
  if (missingColumns.length > 0) {
    stats.errors.push({
      message: `Missing required columns: ${missingColumns.join(', ')}`,
    });
    return properties;
  }

  // Process each data row
  stats.totalRows = sheet.rowCount - 1; // Exclude header

  sheet.eachRow((row, rowNumber) => {
    // Skip header row
    if (rowNumber === 1) return;

    try {
      // Extract property from row
      const property = extractPropertyFromRow(
        row,
        columnMap,
        rowNumber,
        subjectProperty
      );

      if (property) {
        properties.push(property);
        stats.validRows++;
      } else {
        stats.skippedRows++;
      }
    } catch (error) {
      stats.skippedRows++;
      stats.errors.push({
        row: rowNumber,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return properties;
}

// ============================================================================
// Header Extraction
// ============================================================================

/**
 * Extract headers from first row
 * Returns Map of header name -> column letter
 */
function extractHeaders(row: ExcelJS.Row): Map<string, string> {
  const headers = new Map<string, string>();

  row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const value = cell.value?.toString().trim();
    if (value) {
      const columnLetter = getColumnLetter(colNumber);
      headers.set(value, columnLetter);
    }
  });

  return headers;
}

/**
 * Convert column number to letter (1 -> A, 2 -> B, etc.)
 */
function getColumnLetter(colNumber: number): string {
  let letter = '';
  let temp = colNumber;

  while (temp > 0) {
    const remainder = (temp - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    temp = Math.floor((temp - remainder) / 26);
  }

  return letter;
}

// ============================================================================
// Column Mapping
// ============================================================================

interface ColumnMap {
  address?: number;
  city?: number;
  state?: number;
  zip?: number;
  apn?: number;
  price?: number;
  salePrice?: number;
  listPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  lotSize?: number;
  yearBuilt?: number;
  pool?: number;
  garage?: number;
  garageSpaces?: number;
  stories?: number;
  propertyType?: number;
  subdivision?: number;
  saleDate?: number;
  daysOnMarket?: number;
  latitude?: number;
  longitude?: number;
}

/**
 * Build column map from headers
 * Maps field names to column numbers
 */
function buildColumnMap(headers: Map<string, string>): ColumnMap {
  const map: ColumnMap = {};

  // Common field name variations
  const fieldMappings: Record<string, string[]> = {
    address: ['Address', 'PropertyAddress', 'Property Address', 'Street Address', 'Full Address'],
    city: ['City', 'City/Town Code', 'CityName'],
    state: ['State', 'State/Province', 'StateOrProvince'],
    zip: ['ZIP', 'Zip Code', 'PostalCode', 'Postal Code'],
    apn: ['APN', 'Assessor Number', 'ParcelNumber', 'Parcel Number'],
    price: ['Price', 'Sale Price', 'Sold Price'],
    salePrice: ['Sale Price', 'Sold Price', 'ClosePrice'],
    listPrice: ['List Price', 'ListPrice', 'Original Price'],
    bedrooms: ['Bedrooms', '# Bedrooms', 'BedroomsTotal', 'Beds'],
    bathrooms: ['Bathrooms', 'Total Bathrooms', 'BathroomsTotalInteger', 'Baths'],
    squareFeet: ['Square Feet', 'Approx SQFT', 'LivingArea', 'SqFt', 'Sqft'],
    lotSize: ['Lot Size', 'Approx Lot SqFt', 'LotSizeSquareFeet'],
    yearBuilt: ['Year Built', 'YearBuilt'],
    pool: ['Pool', 'Private Pool Y/N', 'PoolFeatures'],
    garage: ['Garage', 'Garage Spaces', 'GarageSpaces'],
    garageSpaces: ['Garage Spaces', 'GarageSpaces'],
    stories: ['Stories', 'Exterior Stories', 'StoriesTotal'],
    propertyType: ['Property Type', 'PropertyType'],
    subdivision: ['Subdivision', 'SubdivisionName'],
    saleDate: ['Sale Date', 'Close of Escrow Date', 'CloseDate'],
    daysOnMarket: ['Days on Market', 'DaysOnMarket', 'DOM'],
    latitude: ['Latitude', 'Geo Lat', 'Lat'],
    longitude: ['Longitude', 'Geo Lon', 'Lon', 'Long'],
  };

  // Find matching columns
  for (const [field, variations] of Object.entries(fieldMappings)) {
    for (const variation of variations) {
      const columnLetter = headers.get(variation);
      if (columnLetter) {
        map[field as keyof ColumnMap] = columnLetterToNumber(columnLetter);
        break;
      }
    }
  }

  return map;
}

/**
 * Convert column letter to number (A -> 1, B -> 2, etc.)
 */
function columnLetterToNumber(letter: string): number {
  let result = 0;
  for (let i = 0; i < letter.length; i++) {
    result *= 26;
    result += letter.charCodeAt(i) - 64;
  }
  return result;
}

// ============================================================================
// Column Validation
// ============================================================================

/**
 * Validate that required columns exist
 */
function validateRequiredColumns(columnMap: ColumnMap): string[] {
  const required: (keyof ColumnMap)[] = [
    'address',
    'bedrooms',
    'squareFeet',
  ];

  const missing: string[] = [];

  for (const field of required) {
    if (!columnMap[field]) {
      missing.push(field);
    }
  }

  return missing;
}

// ============================================================================
// Property Extraction from Row
// ============================================================================

/**
 * Extract PropertyData from Excel row
 */
function extractPropertyFromRow(
  row: ExcelJS.Row,
  columnMap: ColumnMap,
  rowNumber: number,
  subjectProperty?: SubjectProperty
): PropertyData | null {
  try {
    // Get cell values
    const getValue = (colNum: number | undefined): any => {
      if (!colNum) return null;
      return row.getCell(colNum).value;
    };

    const getStringValue = (colNum: number | undefined): string => {
      const value = getValue(colNum);
      return value?.toString().trim() || '';
    };

    const getNumberValue = (colNum: number | undefined): number => {
      const value = getValue(colNum);
      if (value === null || value === undefined || value === '') return 0;
      const num = parseFloat(value.toString());
      return isNaN(num) ? 0 : num;
    };

    const getBooleanValue = (colNum: number | undefined): boolean => {
      const value = getStringValue(colNum);
      return ['Y', 'Yes', 'TRUE', 'true', '1'].includes(value);
    };

    const getDateValue = (colNum: number | undefined): Date | undefined => {
      const value = getValue(colNum);
      if (!value) return undefined;
      if (value instanceof Date) return value;
      const date = new Date(value.toString());
      return isNaN(date.getTime()) ? undefined : date;
    };

    // Extract required fields
    const address = getStringValue(columnMap.address);
    const bedrooms = getNumberValue(columnMap.bedrooms);
    const squareFeet = getNumberValue(columnMap.squareFeet);

    // Validate required fields
    if (!address || squareFeet <= 0) {
      return null;
    }

    // Extract price (try salePrice first, then price, then listPrice)
    let price = getNumberValue(columnMap.salePrice);
    if (price === 0) price = getNumberValue(columnMap.price);
    if (price === 0) price = getNumberValue(columnMap.listPrice);

    // Calculate distance if coordinates available
    let distance: number | undefined;
    const latitude = getNumberValue(columnMap.latitude);
    const longitude = getNumberValue(columnMap.longitude);

    if (subjectProperty && latitude && longitude) {
      distance = haversineDistance(
        subjectProperty.latitude,
        subjectProperty.longitude,
        latitude,
        longitude
      );
    }

    // Build PropertyData object
    const property: PropertyData = {
      apn: getStringValue(columnMap.apn),
      address,
      city: getStringValue(columnMap.city),
      state: getStringValue(columnMap.state) || 'AZ',
      zip: getStringValue(columnMap.zip),
      price,
      pricePerSqFt: price > 0 && squareFeet > 0 ? price / squareFeet : undefined,
      bedrooms,
      bathrooms: getNumberValue(columnMap.bathrooms),
      squareFeet,
      lotSize: getNumberValue(columnMap.lotSize),
      yearBuilt: getNumberValue(columnMap.yearBuilt),
      pool: getBooleanValue(columnMap.pool),
      garage: getNumberValue(columnMap.garage) || getNumberValue(columnMap.garageSpaces),
      stories: getNumberValue(columnMap.stories) || 1,
      propertyType: getStringValue(columnMap.propertyType),
      subdivision: getStringValue(columnMap.subdivision) || undefined,
      latitude: latitude || undefined,
      longitude: longitude || undefined,
      distance,
      saleDate: getDateValue(columnMap.saleDate),
      daysOnMarket: getNumberValue(columnMap.daysOnMarket) || undefined,
    };

    return property;
  } catch (error) {
    console.error(`${LOG_PREFIX} Error extracting row ${rowNumber}:`, error);
    return null;
  }
}

// ============================================================================
// Distance Calculation
// ============================================================================

/**
 * Calculate distance using Haversine formula (same as csv-processor)
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth radius in miles

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;

  return Math.round(distance * 100) / 100;
}

// ============================================================================
// Export Utilities
// ============================================================================

/**
 * Detect upload type from filename or workbook
 */
export function detectUploadType(fileName: string): UploadType {
  const lower = fileName.toLowerCase();

  if (lower.includes('direct') || lower.includes('comp')) {
    return 'direct_comps';
  }

  if (lower.includes('half') || lower.includes('0.5') || lower.includes('.5')) {
    return 'half_mile';
  }

  if (lower.includes('all') || lower.includes('scope')) {
    return 'all_scopes';
  }

  // Default to all_scopes
  return 'all_scopes';
}

/**
 * Create empty workbook for testing
 */
export function createEmptyWorkbook(): ExcelJS.Workbook {
  return new ExcelJS.Workbook();
}

/**
 * Get workbook info for debugging
 */
export function getWorkbookInfo(workbook: ExcelJS.Workbook): {
  sheetCount: number;
  sheetNames: string[];
  totalRows: number;
} {
  const sheetNames = workbook.worksheets.map((ws) => ws.name);
  const totalRows = workbook.worksheets.reduce((sum, ws) => sum + ws.rowCount, 0);

  return {
    sheetCount: workbook.worksheets.length,
    sheetNames,
    totalRows,
  };
}
