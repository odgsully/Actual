/**
 * CSV Processor for MLS Data
 *
 * Parses ARMLS (Arizona Regional MLS) CSV exports and converts them
 * to structured MLSRow objects for template population.
 *
 * @module lib/processing/csv-processor
 */

import Papa from 'papaparse';
import {
  MLSRow,
  ParseMLSCSVResult,
  ProcessingStats,
  ProcessingWarning,
  ProcessingError,
  SubjectProperty,
  MLSStatus,
  isMLSStatus,
  statusToDisplay,
  mlsBooleanToBoolean,
  APN_REGEX,
  VALIDATION_RULES,
} from '@/lib/types/mls-data';

// ============================================================================
// Constants
// ============================================================================

const LOG_PREFIX = '[CRM Excel - CSV]';

/**
 * Required fields that must be present in CSV
 */
const REQUIRED_FIELDS = [
  'House Number',
  'Street Name',
  '# Bedrooms',
  'Approx SQFT',
  'Status',
];

// ============================================================================
// Main Parser Function
// ============================================================================

/**
 * Parse MLS CSV file and convert to structured data
 *
 * @param file - File object from upload
 * @param subjectProperty - Subject property for distance calculation (optional)
 * @returns Promise with parsed data, stats, and any errors
 */
export async function parseMLSCSV(
  file: File,
  subjectProperty?: SubjectProperty
): Promise<ParseMLSCSVResult> {
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
    console.log(`${LOG_PREFIX} Starting CSV parse:`, file.name);

    // Parse CSV file
    const parseResult = await parseCSVFile(file);

    if (!parseResult.data || parseResult.data.length === 0) {
      throw new Error('CSV file is empty or could not be parsed');
    }

    stats.totalRows = parseResult.data.length;
    console.log(`${LOG_PREFIX} Parsed ${stats.totalRows} rows from CSV`);

    // Process each row
    const mlsRows: MLSRow[] = [];

    for (let i = 0; i < parseResult.data.length; i++) {
      const rowNumber = i + 2; // Account for header row
      const rawRow = parseResult.data[i];

      try {
        // Validate row
        const validation = validateRow(rawRow, rowNumber);
        if (!validation.valid) {
          stats.skippedRows++;
          stats.errors.push({
            row: rowNumber,
            message: validation.error || 'Row validation failed',
          });
          continue;
        }

        // Parse row to MLSRow
        const mlsRow = parseRowToMLSRow(rawRow, subjectProperty);
        mlsRows.push(mlsRow);
        stats.validRows++;

        // Add warnings if any
        if (validation.warnings) {
          validation.warnings.forEach((warning) => {
            stats.warnings.push({
              row: rowNumber,
              message: warning,
            });
          });
        }
      } catch (error) {
        stats.skippedRows++;
        stats.errors.push({
          row: rowNumber,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
        console.error(`${LOG_PREFIX} Error processing row ${rowNumber}:`, error);
      }
    }

    stats.processedRows = mlsRows.length;
    stats.processingTime = Date.now() - startTime;

    console.log(`${LOG_PREFIX} Processing complete:`, {
      total: stats.totalRows,
      processed: stats.processedRows,
      skipped: stats.skippedRows,
      warnings: stats.warnings.length,
      errors: stats.errors.length,
    });

    return {
      data: mlsRows,
      stats,
      error: null,
    };
  } catch (error) {
    console.error(`${LOG_PREFIX} Fatal error:`, error);
    stats.processingTime = Date.now() - startTime;

    return {
      data: [],
      stats,
      error: error instanceof Error ? error : new Error('Unknown error occurred'),
    };
  }
}

// ============================================================================
// CSV Parsing Helper
// ============================================================================

/**
 * Parse CSV file using PapaParse
 */
async function parseCSVFile(file: File): Promise<Papa.ParseResult<any>> {
  // In Next.js API routes, we need to read the file content first
  // because PapaParse's File handling uses browser APIs not available in Node.js
  const fileContent = await file.text()

  return new Promise((resolve, reject) => {
    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false, // Keep all as strings for manual parsing
      complete: (results) => {
        resolve(results);
      },
      error: (error: any) => {
        reject(new Error(`CSV parse error: ${error.message}`));
      },
    });
  });
}

// ============================================================================
// Row Validation
// ============================================================================

interface ValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
}

/**
 * Validate a CSV row has required fields and valid data
 */
function validateRow(row: any, rowNumber: number): ValidationResult {
  const warnings: string[] = [];

  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (!row[field] || row[field].toString().trim() === '') {
      return {
        valid: false,
        error: `Missing required field: ${field}`,
      };
    }
  }

  // Validate square feet
  const sqft = parseFloat(row['Approx SQFT']);
  if (isNaN(sqft) || sqft <= 0) {
    return {
      valid: false,
      error: 'Square feet must be greater than 0',
    };
  }

  // Validate bedrooms
  const beds = parseInt(row['# Bedrooms'], 10);
  if (isNaN(beds) || beds < 0) {
    return {
      valid: false,
      error: 'Bedrooms must be a non-negative number',
    };
  }

  // Validate status
  const status = row['Status'];
  if (!isMLSStatus(status)) {
    return {
      valid: false,
      error: `Invalid status code: ${status}`,
    };
  }

  // Check optional fields and add warnings
  if (!row['Sold Price'] && status === 'C') {
    warnings.push('Status is Closed but no sale price provided');
  }

  if (!row['Close of Escrow Date'] && status === 'C') {
    warnings.push('Status is Closed but no close date provided');
  }

  if (!row['Geo Lat'] || !row['Geo Lon']) {
    warnings.push('Missing latitude/longitude - distance cannot be calculated');
  }

  return {
    valid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

// ============================================================================
// Row Parsing
// ============================================================================

/**
 * Parse a raw CSV row into an MLSRow object
 */
function parseRowToMLSRow(row: any, subjectProperty?: SubjectProperty): MLSRow {
  // Build address from components
  const address = buildAddress(row);

  // Parse coordinates
  const latitude = row['Geo Lat'] ? parseFloat(row['Geo Lat']) : null;
  const longitude = row['Geo Lon'] ? parseFloat(row['Geo Lon']) : null;

  // Calculate distance from subject property
  let distance: number | null = null;
  if (subjectProperty && latitude && longitude) {
    distance = haversineDistance(
      subjectProperty.latitude,
      subjectProperty.longitude,
      latitude,
      longitude
    );
  }

  // Parse dates
  const saleDate = parseDate(row['Close of Escrow Date']);
  const listDate = parseDate(row['List Date']) || new Date();
  const underContractDate = parseDate(row['Under Contract Date']);

  // Parse numeric fields
  const salePrice = parseFloat(row['Sold Price']) || null;
  const listPrice = parseFloat(row['List Price']) || 0;
  const squareFeet = parseFloat(row['Approx SQFT']) || 0;
  const pricePerSqFt = salePrice && squareFeet > 0 ? salePrice / squareFeet : listPrice / squareFeet;

  // Parse features from Features field
  const features = parseFeatures(row['Features'] || '');

  // Parse status
  const status = row['Status'] as MLSStatus;

  // Build MLSRow object
  const mlsRow: MLSRow = {
    mlsNumber: row['List Number'] || '',
    apn: row['Assessor Number'] || '',
    address,
    city: row['City/Town Code'] || '',
    state: row['State/Province'] || 'AZ',
    zip: row['Zip Code'] || '',
    salePrice,
    listPrice,
    pricePerSqFt,
    saleDate,
    listDate,
    underContractDate,
    propertyType: row['Property Type'] || 'Residential',
    bedrooms: parseInt(row['# Bedrooms'], 10) || 0,
    bathrooms: parseFloat(row['Total Bathrooms']) || 0,
    squareFeet,
    lotSize: parseFloat(row['Approx Lot SqFt']) || 0,
    yearBuilt: parseInt(row['Year Built'], 10) || 0,
    garageSpaces: parseInt(row['Garage Spaces'], 10) || 0,
    pool: row['Private Pool Y/N'] === 'Y' || features.pool === 'Y',
    stories: parseInt(row['Exterior Stories'], 10) || 1,
    fireplace: features.fireplace === 'Y',
    hoa: features.hoa === 'Y',
    hoaFee: features.hoaFee || 0,
    hoaPaidFrequency: features.hoaPaidFrequency || null,
    hoaTransferFee: features.hoaTransferFee ?? null,
    coveredParkingSpaces: features.coveredParkingSpaces || 0,
    totalParkingSpaces: features.totalParkingSpaces || (parseInt(row['Garage Spaces'], 10) || 0) + (features.coveredParkingSpaces || 0),
    parkingFeatures: features.parkingFeatures || [],
    sellerConcessions: features.sellerConcessions ?? null,
    buyerIncentives: features.buyerIncentives || null,
    listingTerms: features.listingTerms || [],
    isShortSale: features.isShortSale || false,
    isForeclosure: features.isForeclosure || false,
    isREO: features.isREO || false,
    isNewConstruction: features.isNewConstruction || false,
    daysOnMarket: parseInt(row['Days on Market'], 10) || 0,
    status,
    statusDisplay: statusToDisplay(status),
    distance,
    latitude,
    longitude,
    subdivision: row['Subdivision'] || null,
    remarks: row['Public Remarks'] || '',
    legalDescription: row['Legal Description (Abbrev)'] || null,
    taxYear: parseInt(row['Tax Year'], 10) || null,
    annualTaxes: parseFloat(row['Taxes']) || null,
    listingAgent: row['Listing Agent'] || null,
    listingAgency: row['Agency Name'] || null,
    rawData: row,

    // Vision pipeline fields (Phase 6C)
    cardFormat: row['Card Format'] || '',
    totalUnits: parseInt(row['Total # of Units']) || undefined,
    dwellingType: row['Dwelling Type'] || '',
    projectType: row['Project Type'] || '',
  };

  return mlsRow;
}

// ============================================================================
// Address Building
// ============================================================================

/**
 * Build full address from ARMLS components
 *
 * Example: "4620 N 68TH ST 155"
 */
function buildAddress(row: any): string {
  const parts: string[] = [];

  // House number
  if (row['House Number']) parts.push(row['House Number']);

  // Building number — sanitize MLS agent-entered garbage:
  //   Skip if: duplicate of house number, contains unit prefix (Unit/Apt/Suite),
  //   or is a directional word (already in Compass field).
  //   Legitimate numeric building IDs (e.g., "3") are also skipped because they
  //   are indistinguishable from unit numbers and the Unit # field always exists
  //   when Building Number is populated in ARMLS data.
  if (row['Building Number']) {
    const bldg = row['Building Number'].toString().trim();
    const houseNum = (row['House Number'] || '').toString().trim();
    const isDuplicateHouse = bldg === houseNum;
    const isUnitPrefix = /^(unit|apt|apartment|suite|ste|bldg|building)\b/i.test(bldg);
    const isDirectional = /^(north|south|east|west|[nsew])$/i.test(bldg);
    if (!isDuplicateHouse && !isUnitPrefix && !isDirectional) {
      // Only include if it's a multi-character non-numeric identifier (rare edge case)
      if (!/^\d+$/.test(bldg)) {
        parts.push(bldg);
      }
    }
  }

  // Compass direction (N, S, E, W)
  if (row['Compass']) parts.push(row['Compass']);

  // Street name
  if (row['Street Name']) parts.push(row['Street Name']);

  // Street direction suffix
  if (row['St Dir Sfx']) parts.push(row['St Dir Sfx']);

  // Street suffix (ST, AVE, RD, etc.)
  if (row['St Suffix']) parts.push(row['St Suffix']);

  // Unit number AFTER suffix (standard postal format: "4610 N 68TH ST 409")
  if (row['Unit #']) parts.push(row['Unit #']);

  return parts.filter(Boolean).join(' ').trim();
}

// ============================================================================
// Features Parsing
// ============================================================================

/**
 * Parse the Features field (pipe-delimited key-value pairs)
 *
 * Example:
 * "Association & Fees|HOA Y/N|Y;Association & Fees|HOA Fee|346.5;Fireplace|Fireplace YN|N"
 */
function parseFeatures(featuresString: string): Record<string, any> {
  const features: Record<string, any> = {
    hoa: 'N',
    hoaFee: 0,
    hoaPaidFrequency: null,
    hoaTransferFee: null,
    fireplace: 'N',
    pool: 'N',
    // Parking (Phase 0.5a)
    coveredParkingSpaces: 0,
    totalParkingSpaces: 0,
    parkingFeatures: [] as string[],
    // Concessions (Phase 0.5a)
    sellerConcessions: null,
    buyerIncentives: null,
    // Transaction flags (Phase 0.5a)
    listingTerms: [] as string[],
    isShortSale: false,
    isForeclosure: false,
    isREO: false,
    isNewConstruction: false,
  };

  if (!featuresString) return features;

  try {
    // Split by semicolon to get feature groups
    const groups = featuresString.split(';');

    groups.forEach((group) => {
      // Split by pipe to get [category, subcategory, value]
      const parts = group.split('|');
      if (parts.length !== 3) return;

      const [category, subcategory, value] = parts;
      const catUpper = category.toUpperCase().trim();
      const subUpper = subcategory.toUpperCase().trim();

      // ── HOA ──
      if (subcategory === 'HOA Y/N') {
        features.hoa = value === 'Y' ? 'Y' : 'N';
      }
      if (subcategory === 'HOA Fee') {
        const fee = parseFloat(value);
        if (!isNaN(fee)) features.hoaFee = fee;
      }
      if (subUpper === 'HOA PAID FREQUENCY' && value) {
        features.hoaPaidFrequency = value.trim();
      }
      if (subUpper === 'HOA TRANSFER FEE') {
        const fee = parseFloat(value);
        if (!isNaN(fee)) features.hoaTransferFee = fee;
      }

      // ── Fireplace ──
      if (subcategory === 'Fireplace YN') {
        features.fireplace = value === 'Y' ? 'Y' : 'N';
      }

      // ── Pool ──
      if (subcategory.includes('Pool') && value === 'Yes') {
        features.pool = 'Y';
      }

      // ── Parking (Phase 0.5a) ──
      if (catUpper === 'PARKING' || subUpper.includes('PARKING') || subUpper.includes('GARAGE')) {
        // Covered spaces count
        if (subUpper.includes('COVERED SPACES')) {
          const n = parseInt(value, 10);
          if (!isNaN(n)) features.coveredParkingSpaces = n;
        }
        // Total spaces count
        if (subUpper.includes('TOTAL SPACES') || subUpper === '# OF SPACES') {
          const n = parseInt(value, 10);
          if (!isNaN(n)) features.totalParkingSpaces = n;
        }
        // Parking type features (Garage, Covered, RV Gate, etc.)
        if (value === 'Y' || value === 'Yes') {
          features.parkingFeatures.push(subcategory.trim());
        }
      }

      // ── Concessions (Phase 0.5a) ──
      if (subUpper.includes('SELLER CONCESSION')) {
        const amount = parseFloat(value.replace(/[$,]/g, ''));
        if (!isNaN(amount)) features.sellerConcessions = amount;
      }
      if (subUpper.includes('BUYER INCENTIVE') || subUpper.includes('BUYER CONCESSION')) {
        features.buyerIncentives = value.trim();
      }

      // ── Transaction flags (Phase 0.5a) ──
      if (subUpper === 'LISTING TERMS' && value) {
        features.listingTerms.push(value.trim());
      }
      if (subUpper.includes('SHORT SALE') && (value === 'Y' || value === 'Yes')) {
        features.isShortSale = true;
      }
      if (subUpper.includes('FORECLOSURE') && (value === 'Y' || value === 'Yes')) {
        features.isForeclosure = true;
      }
      if ((subUpper.includes('REO') || subUpper.includes('BANK OWNED')) && (value === 'Y' || value === 'Yes')) {
        features.isREO = true;
      }
      if (subUpper.includes('NEW CONSTRUCTION') && (value === 'Y' || value === 'Yes')) {
        features.isNewConstruction = true;
      }
    });
  } catch (error) {
    console.warn(`${LOG_PREFIX} Error parsing features:`, error);
  }

  return features;
}

// ============================================================================
// Date Parsing
// ============================================================================

/**
 * Parse date string to Date object
 * Handles formats: "2025-07-15", "2025-07-03", "MM/DD/YYYY"
 */
function parseDate(dateString: any): Date | null {
  if (!dateString) return null;

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return date;
  } catch {
    return null;
  }
}

// ============================================================================
// Distance Calculation (Haversine Formula)
// ============================================================================

/**
 * Calculate distance between two points using Haversine formula
 *
 * @param lat1 - Latitude of point 1 (degrees)
 * @param lon1 - Longitude of point 1 (degrees)
 * @param lat2 - Latitude of point 2 (degrees)
 * @param lon2 - Longitude of point 2 (degrees)
 * @returns Distance in miles
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth radius in miles

  // Convert degrees to radians
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

  // Round to 2 decimal places
  return Math.round(distance * 100) / 100;
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate APN format
 */
export function validateAPN(apn: string): boolean {
  return APN_REGEX.test(apn);
}

/**
 * Validate sale price range
 */
export function validateSalePrice(price: number): boolean {
  return (
    price >= VALIDATION_RULES.SALE_PRICE.min &&
    price <= VALIDATION_RULES.SALE_PRICE.max
  );
}

/**
 * Validate square feet range
 */
export function validateSquareFeet(sqft: number): boolean {
  return (
    sqft >= VALIDATION_RULES.SQUARE_FEET.min &&
    sqft <= VALIDATION_RULES.SQUARE_FEET.max
  );
}

/**
 * Validate year built
 */
export function validateYearBuilt(year: number): boolean {
  return (
    year >= VALIDATION_RULES.YEAR_BUILT.min &&
    year <= VALIDATION_RULES.YEAR_BUILT.max
  );
}

// ============================================================================
// Export Utilities
// ============================================================================

/**
 * Filter comps by distance threshold
 *
 * @param comps - Array of MLSRow objects
 * @param maxDistance - Maximum distance in miles
 * @returns Filtered array of comps
 */
export function filterCompsByDistance(
  comps: MLSRow[],
  maxDistance: number
): MLSRow[] {
  return comps.filter((comp) => {
    if (comp.distance === null) return false;
    return comp.distance <= maxDistance;
  });
}

/**
 * Sort comps by distance (closest first)
 */
export function sortCompsByDistance(comps: MLSRow[]): MLSRow[] {
  return [...comps].sort((a, b) => {
    if (a.distance === null && b.distance === null) return 0;
    if (a.distance === null) return 1;
    if (b.distance === null) return -1;
    return a.distance - b.distance;
  });
}

/**
 * Sort comps by sale date (most recent first)
 */
export function sortCompsBySaleDate(comps: MLSRow[]): MLSRow[] {
  return [...comps].sort((a, b) => {
    if (a.saleDate === null && b.saleDate === null) return 0;
    if (a.saleDate === null) return 1;
    if (b.saleDate === null) return -1;
    return b.saleDate.getTime() - a.saleDate.getTime();
  });
}
