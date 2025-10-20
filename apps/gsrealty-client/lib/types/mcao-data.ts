/**
 * MCAO (Maricopa County Assessor's Office) Data Types
 *
 * Types for property data from Maricopa County Assessor's Office API
 * Used for property lookups by APN (Assessor Parcel Number)
 *
 * @see DOCUMENTATION/GSREALTY_PROJECT_REQUIREMENTS.md - Section 3.2.4, 3.2.5
 */

/**
 * Assessor Parcel Number (APN)
 * Format: "XXX-XX-XXXA" (e.g., "123-45-678A")
 */
export type APN = string

/**
 * Raw MCAO API Response
 * Full response from Maricopa County Assessor's Office API
 */
export interface MCAOApiResponse {
  // Property identification
  apn: APN
  parcelNumber: string

  // Owner information
  ownerName: string
  ownerAddress?: {
    street: string
    city: string
    state: string
    zip: string
  }

  // Legal description
  legalDescription: string
  subdivision?: string
  lot?: string
  block?: string

  // Property details
  propertyAddress: {
    number: string
    street: string
    unit?: string
    city: string
    state: string
    zip: string
    fullAddress: string
  }

  // Property characteristics
  propertyType: string
  landUse: string
  zoning?: string

  // Size and dimensions
  lotSize: number // square feet
  lotDimensions?: {
    frontage?: number
    depth?: number
    irregular?: boolean
  }
  improvementSize?: number // square feet

  // Building details
  yearBuilt?: number
  bedrooms?: number
  bathrooms?: number
  stories?: number
  constructionType?: string
  roofType?: string

  // Valuation
  assessedValue: {
    total: number
    land: number
    improvement: number
  }

  // Tax information
  taxInfo: {
    taxYear: number
    taxAmount: number
    taxRate: number
    taxArea: string
  }

  // Sales history
  salesHistory?: Array<{
    saleDate: string
    salePrice: number
    saleType: string
    recordingNumber?: string
  }>

  // Additional features
  features?: {
    pool?: boolean
    garage?: boolean
    garageSpaces?: number
    fireplace?: boolean
    ac?: boolean
    heating?: string
  }

  // Metadata
  lastUpdated: string
  dataSource: string
  apiVersion?: string

  // Raw response (for debugging/full data access)
  rawResponse?: Record<string, any>
}

/**
 * MCAO Property Summary
 * Simplified property data for UI display
 */
export interface MCAOPropertySummary {
  apn: APN
  ownerName: string
  propertyAddress: string
  assessedValue: number
  taxAmount: number
  yearBuilt?: number
  lotSize: number
  lastUpdated: string
}

/**
 * MCAO Data for Maricopa Sheet (Template)
 *
 * Fields for populating the "Maricopa" sheet in template.xlsx
 * Rows 2-24: Column B = label, Column C = data value
 *
 * @see DOCUMENTATION/GSREALTY_PROJECT_REQUIREMENTS.md - Section 4.2 (Sheet: Maricopa)
 */
export interface MCAOMaricopaSheetData {
  // Row 2
  apn: APN

  // Row 3
  ownerName: string

  // Row 4
  propertyAddress: string

  // Row 5
  legalDescription: string

  // Row 6
  lotSize: string // formatted (e.g., "7,500 sqft")

  // Row 7
  yearBuilt: string

  // Row 8
  propertyType: string

  // Row 9
  landUse: string

  // Row 10
  zoning: string

  // Row 11
  assessedValueTotal: string // formatted currency

  // Row 12
  assessedValueLand: string // formatted currency

  // Row 13
  assessedValueImprovement: string // formatted currency

  // Row 14
  taxYear: string

  // Row 15
  taxAmount: string // formatted currency

  // Row 16
  taxRate: string

  // Row 17
  subdivision: string

  // Row 18
  lot: string

  // Row 19
  block: string

  // Row 20
  bedrooms: string

  // Row 21
  bathrooms: string

  // Row 22
  improvementSize: string // formatted sqft

  // Row 23
  constructionType: string

  // Row 24
  features: string // comma-separated features

  // Matrix data (Row 26+) - flexible structure
  matrixData?: Array<{
    row: number
    columnC: string
    columnD: string
  }>
}

/**
 * MCAO Lookup Request
 * Request payload for APN lookup
 */
export interface MCAOLookupRequest {
  apn: APN
  includeHistory?: boolean // include sales history
  includeTax?: boolean // include tax details
  refresh?: boolean // bypass cache
}

/**
 * MCAO Lookup Result
 * Response from MCAO API lookup
 */
export interface MCAOLookupResult {
  success: boolean
  data?: MCAOApiResponse
  summary?: MCAOPropertySummary
  flattenedData?: FlattenedMCAOData  // All 559+ fields flattened
  categorizedData?: CategorizedMCAOData  // Organized by category for UI display
  fieldCount?: number  // Total number of fields retrieved
  error?: {
    code: string
    message: string
    details?: string
  }
  cached?: boolean
  cachedAt?: string
  timestamp: string
}

/**
 * MCAO Database Record
 * Record stored in gsrealty_mcao_data table
 * Note: Uses snake_case to match PostgreSQL column names
 */
export interface MCAODatabaseRecord {
  id: string // UUID
  property_id?: string | null // UUID reference to gsrealty_properties
  apn: APN
  owner_name: string | null
  legal_description: string | null
  tax_amount: number | null
  assessed_value: number | null
  api_response: MCAOApiResponse // JSONB
  fetched_at: string // timestamp
  updated_at: string // timestamp
}

/**
 * MCAO Cache Entry
 * Cached API response to reduce API calls
 */
export interface MCAOCacheEntry {
  apn: APN
  data: MCAOApiResponse
  cachedAt: string
  expiresAt: string
  hitCount: number
}

/**
 * MCAO API Configuration
 */
export interface MCAOApiConfig {
  baseUrl: string
  apiKey?: string
  timeout: number // milliseconds
  retryAttempts: number
  retryDelay: number // milliseconds
  cacheEnabled: boolean
  cacheDuration: number // seconds
}

/**
 * MCAO Error Types
 */
export enum MCAOErrorCode {
  INVALID_APN = 'INVALID_APN',
  APN_NOT_FOUND = 'APN_NOT_FOUND',
  API_ERROR = 'API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  RATE_LIMIT = 'RATE_LIMIT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  PARSE_ERROR = 'PARSE_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR'
}

/**
 * MCAO API Status
 */
export interface MCAOApiStatus {
  available: boolean
  lastChecked: string
  responseTime?: number // milliseconds
  version?: string
  message?: string
}

/**
 * Type guard: Check if APN is valid format
 * Expected format: XXX-XX-XXXA (e.g., "123-45-678A")
 */
export function isValidAPN(apn: string): apn is APN {
  const apnRegex = /^\d{3}-\d{2}-\d{3,4}[A-Z]?$/
  return apnRegex.test(apn)
}

/**
 * Format APN with dashes
 */
export function formatAPN(apn: string): APN {
  // Remove existing dashes and spaces
  const cleaned = apn.replace(/[-\s]/g, '')

  // Expected format: XXXXXXXXXXXAAA -> XXX-XX-XXXA
  if (cleaned.length >= 8) {
    const part1 = cleaned.slice(0, 3)
    const part2 = cleaned.slice(3, 5)
    const part3 = cleaned.slice(5)
    return `${part1}-${part2}-${part3}` as APN
  }

  return apn as APN
}

/**
 * Parse MCAO API response to summary
 */
export function parseToSummary(response: MCAOApiResponse): MCAOPropertySummary {
  return {
    apn: response.apn,
    ownerName: response.ownerName,
    propertyAddress: response.propertyAddress.fullAddress,
    assessedValue: response.assessedValue.total,
    taxAmount: response.taxInfo.taxAmount,
    yearBuilt: response.yearBuilt,
    lotSize: response.lotSize,
    lastUpdated: response.lastUpdated
  }
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * Format square feet for display
 */
export function formatSquareFeet(sqft: number): string {
  return new Intl.NumberFormat('en-US').format(sqft) + ' sqft'
}

/**
 * Convert MCAO API response to Maricopa sheet data
 */
export function toMaricopaSheetData(response: MCAOApiResponse): MCAOMaricopaSheetData {
  const features = []
  if (response.features?.pool) features.push('Pool')
  if (response.features?.garage) features.push(`Garage (${response.features.garageSpaces || 0} spaces)`)
  if (response.features?.fireplace) features.push('Fireplace')
  if (response.features?.ac) features.push('A/C')

  return {
    apn: response.apn,
    ownerName: response.ownerName,
    propertyAddress: response.propertyAddress.fullAddress,
    legalDescription: response.legalDescription,
    lotSize: formatSquareFeet(response.lotSize),
    yearBuilt: response.yearBuilt?.toString() || 'N/A',
    propertyType: response.propertyType,
    landUse: response.landUse,
    zoning: response.zoning || 'N/A',
    assessedValueTotal: formatCurrency(response.assessedValue.total),
    assessedValueLand: formatCurrency(response.assessedValue.land),
    assessedValueImprovement: formatCurrency(response.assessedValue.improvement),
    taxYear: response.taxInfo.taxYear.toString(),
    taxAmount: formatCurrency(response.taxInfo.taxAmount),
    taxRate: response.taxInfo.taxRate.toString(),
    subdivision: response.subdivision || 'N/A',
    lot: response.lot || 'N/A',
    block: response.block || 'N/A',
    bedrooms: response.bedrooms?.toString() || 'N/A',
    bathrooms: response.bathrooms?.toString() || 'N/A',
    improvementSize: response.improvementSize ? formatSquareFeet(response.improvementSize) : 'N/A',
    constructionType: response.constructionType || 'N/A',
    features: features.join(', ') || 'None listed'
  }
}

/**
 * Flattened MCAO Data
 * All nested fields flattened into a single level for comprehensive display
 */
export type FlattenedMCAOData = Record<string, any>

/**
 * Categorized MCAO Fields
 * Fields organized into logical categories for UI display
 */
export interface CategorizedMCAOData {
  'Owner Information': Record<string, any>
  'Property Details': Record<string, any>
  'Valuations & Tax': Record<string, any>
  'Residential Data': Record<string, any>
  'Location/GIS': Record<string, any>
  'Maps & Documents': Record<string, any>
  'Legal & Administrative': Record<string, any>
}

/**
 * Flatten nested JSON structure into a single level dictionary
 * Based on PV Splittable MCAO-UI implementation
 * @param data - Nested object to flatten
 * @returns Flattened key-value pairs
 */
export function flattenJSON(data: Record<string, any>): FlattenedMCAOData {
  const out: Record<string, any> = {}

  function flatten(x: any, name = ''): void {
    if (typeof x === 'object' && x !== null && !Array.isArray(x)) {
      // Handle objects
      for (const key in x) {
        flatten(x[key], `${name}${key}_`)
      }
    } else if (Array.isArray(x)) {
      // Handle arrays
      x.forEach((item, i) => {
        flatten(item, `${name}${i}_`)
      })
    } else {
      // Handle primitive values
      out[name.slice(0, -1)] = x
    }
  }

  flatten(data)
  return out
}

/**
 * Categorize flattened MCAO data into logical sections
 * Based on PV Splittable MCAO-UI categorization logic
 * @param flatData - Flattened key-value pairs
 * @returns Data organized by category
 */
export function categorizeMCAOData(flatData: FlattenedMCAOData): CategorizedMCAOData {
  const categories: CategorizedMCAOData = {
    'Owner Information': {},
    'Property Details': {},
    'Valuations & Tax': {},
    'Residential Data': {},
    'Location/GIS': {},
    'Maps & Documents': {},
    'Legal & Administrative': {}
  }

  for (const [key, value] of Object.entries(flatData)) {
    // Owner Information
    if (key.startsWith('Owner_') || key.includes('owner')) {
      categories['Owner Information'][key] = value
    }
    // Valuations
    else if (
      key.includes('Valuation') ||
      key.includes('Value') ||
      key.includes('Tax') ||
      key.includes('tax')
    ) {
      categories['Valuations & Tax'][key] = value
    }
    // Residential Data
    else if (key.startsWith('ResidentialPropertyData_') || key.includes('Residential')) {
      categories['Residential Data'][key] = value
    }
    // Location/GIS
    else if (
      key.startsWith('Geo_') ||
      key.includes('Coordinate') ||
      key.includes('Latitude') ||
      key.includes('Longitude') ||
      key.includes('latitude') ||
      key.includes('longitude')
    ) {
      categories['Location/GIS'][key] = value
    }
    // Maps & Documents
    else if (key.includes('Map') || key.includes('Url') || key.includes('FileName')) {
      categories['Maps & Documents'][key] = value
    }
    // Legal & Administrative
    else if (
      key.includes('Legal') ||
      key.includes('MCR') ||
      key.includes('APL') ||
      key.includes('Deed')
    ) {
      categories['Legal & Administrative'][key] = value
    }
    // Property Details (default)
    else {
      categories['Property Details'][key] = value
    }
  }

  // Remove empty categories
  const filtered: Partial<CategorizedMCAOData> = {}
  for (const [category, fields] of Object.entries(categories)) {
    if (Object.keys(fields).length > 0) {
      filtered[category as keyof CategorizedMCAOData] = fields
    }
  }

  return filtered as CategorizedMCAOData
}
