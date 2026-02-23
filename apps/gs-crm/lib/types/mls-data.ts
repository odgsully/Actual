/**
 * MLS Data Types for GSRealty Client Management System
 *
 * Type definitions for MLS data processing, template population,
 * and Excel file handling.
 *
 * @module lib/types/mls-data
 */

// ============================================================================
// Core MLS Data Types
// ============================================================================

/**
 * Status codes from ARMLS
 */
export type MLSStatus = 'A' | 'C' | 'P' | 'U' | 'X' | 'T' | 'W';

/**
 * Human-readable status display values
 */
export type StatusDisplay =
  | 'Active'
  | 'Sold'
  | 'Pending'
  | 'Under Contract'
  | 'Cancelled'
  | 'Temp Off'
  | 'Withdrawn';

/**
 * Upload type options
 */
export type UploadType = 'direct_comps' | 'all_scopes' | 'half_mile';

/**
 * Boolean values accepted in MLS data
 */
export type MLSBoolean = 'Y' | 'N' | 'Yes' | 'No' | 'TRUE' | 'FALSE';

// ============================================================================
// MLS Row Interface (Parsed from CSV/XLSX)
// ============================================================================

/**
 * Represents a single comparable sale property from MLS
 * Maps directly to template.xlsx `comps` sheet columns (B through Z+)
 */
export interface MLSRow {
  // Core identification
  mlsNumber: string;                    // Column X - MLS listing number
  apn: string;                          // Column F - Assessor Parcel Number

  // Address fields
  address: string;                      // Column B - Full concatenated address
  city: string;                         // Column C - City name
  state: string;                        // Column D - State (2-letter)
  zip: string;                          // Column E - ZIP code

  // Pricing
  salePrice: number | null;             // Column G - Final sale price (null if not sold)
  listPrice: number;                    // Column I - List price
  pricePerSqFt: number;                 // Column V - Calculated price per sqft

  // Dates
  saleDate: Date | null;                // Column H - Sale date (null if not sold)
  listDate: Date;                       // List date
  underContractDate: Date | null;       // Under contract date

  // Property characteristics
  propertyType: string;                 // Column K - Property type
  bedrooms: number;                     // Column L - Number of bedrooms
  bathrooms: number;                    // Column M - Total bathrooms
  squareFeet: number;                   // Column N - Living area sqft
  lotSize: number;                      // Column O - Lot size sqft
  yearBuilt: number;                    // Column P - Year built

  // Features
  garageSpaces: number;                 // Column Q - Garage spaces
  pool: boolean;                        // Column R - Has pool (Y/N)
  stories: number;                      // Column S - Number of stories
  fireplace: boolean;                   // Column AA - Has fireplace

  // HOA
  hoa: boolean;                         // Column T - Has HOA
  hoaFee: number;                       // Column U - Monthly HOA fee

  // Market data
  daysOnMarket: number;                 // Column J - Days on market
  status: MLSStatus;                    // Column Y - MLS status code
  statusDisplay: StatusDisplay;         // Human-readable status

  // Location
  distance: number | null;              // Column W - Distance from subject (miles)
  latitude: number | null;              // For mapping
  longitude: number | null;             // For mapping
  subdivision: string | null;           // Column AC - Subdivision name

  // Additional fields
  remarks: string;                      // Column Z - Property description
  legalDescription: string | null;      // Column AI - Legal description
  taxYear: number | null;               // Column AG - Tax year
  annualTaxes: number | null;           // Column AH - Annual property taxes

  // Agent information
  listingAgent: string | null;          // Column AD - Agent name
  listingAgency: string | null;         // Column AE - Brokerage name

  // Raw data (for debugging)
  rawData?: Record<string, any>;        // Original CSV row

  // Vision pipeline fields (Phase 6C)
  cardFormat?: string;       // '' (residential) or 'Multiple Dwellings' (multifamily)
  totalUnits?: number;       // Unit count for multifamily (2, 3, 4, 6-24+)
  dwellingType?: string;     // 'Single Family - Detached', 'Apartment', etc. — empty for multifamily CSVs
  projectType?: string;      // Used by vision pipeline for dwelling type classification
}

// ============================================================================
// Property Data (General Interface)
// ============================================================================

/**
 * General property data interface used across the system
 * Can represent subject property or comparables
 */
export interface PropertyData {
  id?: string;                          // Database ID (if saved)
  apn: string;                          // Assessor Parcel Number
  address: string;                      // Full address
  city: string;
  state: string;
  zip: string;

  // Pricing
  price: number;                        // Current price or sale price
  pricePerSqFt?: number;

  // Characteristics
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  lotSize: number;
  yearBuilt: number;

  // Features
  pool: boolean;
  garage: number;                       // Garage spaces
  stories: number;

  // Location
  latitude?: number;
  longitude?: number;

  // Metadata
  propertyType?: string;
  subdivision?: string;

  // For comps
  distance?: number;                    // Distance from subject
  saleDate?: Date;
  daysOnMarket?: number;
}

// ============================================================================
// Comparable Sale (Enhanced)
// ============================================================================

/**
 * Enhanced comparable sale with similarity scores
 * Used in Analysis and Calcs sheets
 */
export interface ComparableSale extends PropertyData {
  mlsNumber: string;
  status: MLSStatus;

  // Similarity scores (0-1)
  distanceScore?: number;               // Proximity score
  priceSimilarityScore?: number;        // Price similarity
  sqftSimilarityScore?: number;         // Square footage similarity
  ageSimilarityScore?: number;          // Age similarity
  bedroomBathScore?: number;            // Bed/bath match score
  overallScore?: number;                // Overall comp score (0-100)

  // Adjustments
  adjustedSalePrice?: number;           // Price after adjustments
}

// ============================================================================
// MCAO API Data
// ============================================================================

/**
 * Maricopa County Assessor's Office API response data
 * Populates Full_API_call and Maricopa sheets
 */
export interface MCAOData {
  // Parcel identification
  apn: string;                          // Column B
  parcelId: string;                     // Column C

  // Owner information
  ownerName: string;                    // Column D
  ownerAddress: string;                 // Column E

  // Legal
  legalDescription: string;             // Column F
  propertyAddress: string;              // Column G
  propertyCity: string;                 // Column H
  propertyZip: string;                  // Column I
  propertyClass: string;                // Column J
  landUseCode: string;                  // Column K
  legalClass: string;                   // Column L

  // Location details
  subdivision: string | null;           // Column M
  lotNumber: string | null;             // Column N
  blockNumber: string | null;           // Column O
  section: string | null;               // Column P
  township: string | null;              // Column Q
  range: string | null;                 // Column R

  // Valuations
  assessedLandValue: number;            // Column S
  assessedImprovementValue: number;     // Column T
  totalAssessedValue: number;           // Column U
  fullCashValueLand: number;            // Column V
  fullCashValueImprovement: number;     // Column W
  fullCashValueTotal: number;           // Column X

  // Tax information
  taxAmount: number;                    // Column Y
  taxYear: number;                      // Column Z

  // Property characteristics
  sqftLiving: number;                   // Column AA
  sqftLot: number;                      // Column AB
  yearBuilt: number;                    // Column AC
  bedrooms: number;                     // Column AD
  bathrooms: number;                    // Column AE
  hasPool: boolean;                     // Column AF
  garageType: string | null;            // Column AG
  garageSpaces: number;                 // Column AH
  stories: number;                      // Column AI

  // Construction details
  constructionType: string | null;      // Column AJ
  roofType: string | null;              // Column AK
  exteriorWalls: string | null;         // Column AL

  // Sale history
  lastSaleDate: Date | null;            // Column AM
  lastSalePrice: number | null;         // Column AN
  saleDocumentNumber: string | null;    // Column AO

  // Zoning
  zoning: string | null;                // Column AP

  // Metadata
  apiCallTimestamp: Date;               // Column AQ - When API called
  apiResponseStatus: string;            // Column AR - Success or error

  // Tax history (for matrix rows 26+)
  taxHistory?: TaxHistoryRecord[];
}

/**
 * Tax history record for Maricopa sheet matrix
 */
export interface TaxHistoryRecord {
  taxYear: number;
  assessedValue: number;
  taxAmount: number;
  taxRate: number;
}

// ============================================================================
// Processing Statistics
// ============================================================================

/**
 * Statistics from CSV/Excel processing
 */
export interface ProcessingStats {
  totalRows: number;                    // Total rows in file
  validRows: number;                    // Rows that passed validation
  skippedRows: number;                  // Rows skipped (invalid)
  processedRows: number;                // Successfully processed
  warnings: ProcessingWarning[];        // List of warnings
  errors: ProcessingError[];            // List of errors
  processingTime: number;               // Time in milliseconds
  fileSize?: number;                    // File size in bytes
  fileName?: string;                    // Original file name
}

/**
 * Processing warning (non-fatal)
 */
export interface ProcessingWarning {
  row?: number;                         // Row number (if applicable)
  field?: string;                       // Field name (if applicable)
  message: string;                      // Warning message
  value?: any;                          // Problematic value
}

/**
 * Processing error (fatal or row-level)
 */
export interface ProcessingError {
  row?: number;                         // Row number (if applicable)
  field?: string;                       // Field name (if applicable)
  message: string;                      // Error message
  value?: any;                          // Problematic value
  code?: string;                        // Error code
}

// ============================================================================
// CSV Parser Results
// ============================================================================

/**
 * Result from parsing MLS CSV file
 */
export interface ParseMLSCSVResult {
  data: MLSRow[];                       // Parsed and validated rows
  stats: ProcessingStats;               // Processing statistics
  error: Error | null;                  // Fatal error (if any)
}

// ============================================================================
// Excel Processor Results
// ============================================================================

/**
 * Result from processing Excel workbook
 */
export interface ProcessMLSExcelResult {
  workbook: any;                        // ExcelJS Workbook object
  properties: PropertyData[];           // Extracted property data
  stats: ProcessingStats;               // Processing statistics
  error: Error | null;                  // Fatal error (if any)
}

// ============================================================================
// Template Population Results
// ============================================================================

/**
 * Result from populating template with comp data
 */
export interface PopulateTemplateResult {
  workbook: any;                        // ExcelJS Workbook object (populated)
  populatedSheets: string[];            // List of sheets that were populated
  stats: TemplatePopulationStats;       // Population statistics
  error: Error | null;                  // Fatal error (if any)
}

/**
 * Statistics from template population
 */
export interface TemplatePopulationStats {
  compsPopulated: number;               // Number of comps added to `comps` sheet
  halfMileCompsPopulated: number;       // Number of comps added to `.5mile` sheet
  mcaoDataPopulated: boolean;           // MCAO data added to `Full_API_call`
  analysisCalculated: boolean;          // Analysis sheet formulas calculated
  lotDataPopulated: boolean;            // Lot sheet populated
  warnings: ProcessingWarning[];        // Warnings during population
  errors: ProcessingError[];            // Errors during population
  processingTime: number;               // Time in milliseconds
}

// ============================================================================
// Subject Property (for distance calculations)
// ============================================================================

/**
 * Subject property information for comparison
 */
export interface SubjectProperty {
  address: string;
  apn?: string;
  latitude: number;
  longitude: number;
  price?: number;
  squareFeet?: number;
  bedrooms?: number;
  bathrooms?: number;
  yearBuilt?: number;
}

// ============================================================================
// File Upload Metadata
// ============================================================================

/**
 * Metadata about uploaded file
 */
export interface UploadFileMetadata {
  fileName: string;
  fileSize: number;                     // Bytes
  fileType: string;                     // MIME type
  uploadType: UploadType;               // Type of upload
  uploadedAt: Date;                     // Upload timestamp
  uploadedBy?: string;                  // User ID (if authenticated)
  clientId?: string;                    // Client ID (if associated)
}

// ============================================================================
// Template Sheet Names
// ============================================================================

/**
 * Sheet names in template.xlsx
 */
export const TEMPLATE_SHEETS = {
  COMPS: 'comps',
  FULL_API_CALL: 'Full_API_call',
  ANALYSIS: 'Analysis',
  CALCS: 'Calcs',
  MARICOPA: 'Maricopa',
  HALF_MILE: '.5mile',
  LOT: 'Lot',
} as const;

export type TemplateSheetName = typeof TEMPLATE_SHEETS[keyof typeof TEMPLATE_SHEETS];

// ============================================================================
// Column Mapping Constants
// ============================================================================

/**
 * Template column letters for comps sheet
 * NOTE: Column A is ALWAYS reserved for Notes (blank on import)
 */
export const COMPS_COLUMNS = {
  NOTES: 'A',              // Reserved - always blank
  ADDRESS: 'B',
  CITY: 'C',
  STATE: 'D',
  ZIP: 'E',
  APN: 'F',
  SALE_PRICE: 'G',
  SALE_DATE: 'H',
  LIST_PRICE: 'I',
  DAYS_ON_MARKET: 'J',
  PROPERTY_TYPE: 'K',
  BEDROOMS: 'L',
  BATHROOMS: 'M',
  SQUARE_FEET: 'N',
  LOT_SIZE: 'O',
  YEAR_BUILT: 'P',
  GARAGE_SPACES: 'Q',
  POOL: 'R',
  STORIES: 'S',
  HOA: 'T',
  HOA_FEE: 'U',
  PRICE_PER_SQFT: 'V',
  DISTANCE: 'W',
  MLS_NUMBER: 'X',
  STATUS: 'Y',
  REMARKS: 'Z',
  FIREPLACE: 'AA',
  VIEW: 'AB',
  SUBDIVISION: 'AC',
  LISTING_AGENT: 'AD',
  LISTING_AGENCY: 'AE',
  UNDER_CONTRACT_DATE: 'AF',
  TAX_YEAR: 'AG',
  ANNUAL_TAXES: 'AH',
  LEGAL_DESCRIPTION: 'AI',
  GEO_LAT: 'AJ',
  GEO_LON: 'AK',
} as const;

// ============================================================================
// Validation Rules
// ============================================================================

/**
 * APN format validation regex (Maricopa County)
 */
export const APN_REGEX = /^\d{3}-\d{2}-\d{3,4}[A-Z]?$/;

/**
 * Validation rules for MLS data
 */
export const VALIDATION_RULES = {
  APN: {
    pattern: APN_REGEX,
    message: 'APN must be in format ###-##-###[A] or ###-##-####[A]',
  },
  SALE_PRICE: {
    min: 0,
    max: 99999999,
    message: 'Sale price must be between $0 and $99,999,999',
  },
  SQUARE_FEET: {
    min: 1,
    max: 50000,
    message: 'Square feet must be between 1 and 50,000',
  },
  BEDROOMS: {
    min: 0,
    max: 99,
    message: 'Bedrooms must be between 0 and 99',
  },
  YEAR_BUILT: {
    min: 1800,
    max: new Date().getFullYear() + 2,
    message: 'Year built must be reasonable',
  },
} as const;

// ============================================================================
// Helper Type Guards
// ============================================================================

/**
 * Check if value is a valid MLS status code
 */
export function isMLSStatus(value: any): value is MLSStatus {
  return ['A', 'C', 'P', 'U', 'X', 'T', 'W'].includes(value);
}

/**
 * Check if value is a valid MLS boolean
 */
export function isMLSBoolean(value: any): value is MLSBoolean {
  return ['Y', 'N', 'Yes', 'No', 'TRUE', 'FALSE'].includes(value);
}

/**
 * Convert MLS boolean to TypeScript boolean
 */
export function mlsBooleanToBoolean(value: MLSBoolean): boolean {
  return ['Y', 'Yes', 'TRUE'].includes(value);
}

/**
 * Convert TypeScript boolean to MLS boolean
 */
export function booleanToMLSBoolean(value: boolean): MLSBoolean {
  return value ? 'Y' : 'N';
}

/**
 * Convert MLS status code to display string
 */
export function statusToDisplay(status: MLSStatus): StatusDisplay {
  const mapping: Record<MLSStatus, StatusDisplay> = {
    'A': 'Active',
    'C': 'Sold',
    'P': 'Pending',
    'U': 'Under Contract',
    'X': 'Cancelled',
    'T': 'Temp Off',
    'W': 'Withdrawn',
  };
  return mapping[status];
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Make all properties of T required and non-nullable
 */
export type Complete<T> = {
  [P in keyof T]-?: NonNullable<T[P]>;
};

/**
 * Extract error information
 */
export type ErrorInfo = {
  message: string;
  code?: string;
  details?: any;
};

// ============================================================================
// ReportIt Upload Types (New)
// ============================================================================

/**
 * Source type for uploaded MLS data
 */
export type MLSSourceType =
  | 'residential15Mile'
  | 'residentialLease15Mile'
  | 'residential3YrDirect'
  | 'residentialLease3YrDirect'
  | 'subject'

/**
 * Item label for Column A tracking
 */
export type ItemLabel =
  | 'Subject Property'
  | 'Residential 1.5 Mile Comps'
  | 'Residential Lease 1.5 Mile Comps'
  | 'Residential 3 yr Direct Subdivision Comps'
  | 'Residential Lease 3yr Direct Subdivision Comps'

/**
 * Property master list entry
 * Combines MLS and MCAO data with source tracking
 */
export interface PropertyMasterListEntry {
  address: string
  apn?: string
  itemLabel: ItemLabel
  source: MLSSourceType
  mlsData?: any
  mcaoData?: any
  hasApn: boolean
  hasMCAOData: boolean
  needsLookup: boolean
  lookupAttempted?: boolean
  lookupError?: string
}

/**
 * Upload metadata for the complete Excel generation
 */
export interface UploadGenerationMetadata {
  clientName: string
  timestamp: Date
  propertyCounts: {
    residential15Mile: number
    residentialLease15Mile: number
    residential3YrDirect: number
    residentialLease3YrDirect: number
    total: number
  }
  apnLookupStats: {
    total: number
    existing: number
    lookedUp: number
    successful: number
    failed: number
  }
  generationTime?: number
}
