/**
 * Golden Dataset Fixtures
 *
 * Synthetic PropertyData arrays for testing the breakups analysis pipeline.
 * Synthetic MLSRow arrays for testing the computed-metrics pipeline.
 * Based on realistic Scottsdale, AZ property characteristics from ref/examples/.
 */

import type { PropertyData } from '@/lib/processing/breakups-generator'
import type { MLSRow, SubjectProperty } from '@/lib/types/mls-data'

/** Minimal valid property for testing */
export function makeProperty(overrides: Partial<PropertyData> = {}): PropertyData {
  return {
    Item: 'Residential 1.5 Mile Comps',
    FULL_ADDRESS: '1234 N TEST ST, SCOTTSDALE, AZ 85251',
    APN: '173-35-001',
    STATUS: 'C',
    OG_LIST_DATE: '2024-01-15',
    OG_LIST_PRICE: 450000,
    SALE_DATE: '2024-03-01',
    SALE_PRICE: 440000,
    SELLER_BASIS: 350000,
    SELLER_BASIS_DATE: '2020-06-15',
    BR: 3,
    BA: 2,
    SQFT: 1800,
    LOT_SIZE: 7200,
    MLS_MCAO_DISCREPENCY_CONCAT: '',
    IS_RENTAL: 'N',
    AGENCY_PHONE: '',
    RENOVATE_SCORE: 5,
    RENO_YEAR_EST: 2020,
    PROPERTY_RADAR_COMP_YN: 'N',
    IN_MLS: 'Y',
    IN_MCAO: 'Y',
    CANCEL_DATE: '',
    UC_DATE: '',
    LAT: 33.4942,
    LON: -111.9261,
    YEAR_BUILT: 1985,
    DAYS_ON_MARKET: 45,
    DWELLING_TYPE: 'SFR',
    SUBDIVISION_NAME: 'Test Subdivision',
    ...overrides,
  } as PropertyData
}

/** Standard golden dataset: 6 properties, mix of sale/lease/active/closed */
export const GOLDEN_PROPERTIES: PropertyData[] = [
  makeProperty({
    Item: 'Residential Direct Comps',
    FULL_ADDRESS: '4600 N 68TH ST 371, SCOTTSDALE, AZ 85251',
    APN: '173-35-524',
    STATUS: 'C',
    SALE_PRICE: 215000,
    OG_LIST_PRICE: 229000,
    BR: 1, BA: 1, SQFT: 702, LOT_SIZE: 738,
    YEAR_BUILT: 1974, IS_RENTAL: 'N',
    RENOVATE_SCORE: 7, RENO_YEAR_EST: 2013,
    PROPERTY_RADAR_COMP_YN: 'Y',
    DAYS_ON_MARKET: 83,
  }),
  makeProperty({
    Item: 'Residential 1.5 Mile Comps',
    FULL_ADDRESS: '7320 E CAMELBACK RD 210, SCOTTSDALE, AZ 85251',
    APN: '173-36-100',
    STATUS: 'C',
    SALE_PRICE: 385000,
    OG_LIST_PRICE: 399000,
    BR: 2, BA: 2, SQFT: 1100, LOT_SIZE: 1200,
    YEAR_BUILT: 1988, IS_RENTAL: 'N',
    RENOVATE_SCORE: 6, RENO_YEAR_EST: 2018,
    PROPERTY_RADAR_COMP_YN: 'N',
    DAYS_ON_MARKET: 42,
  }),
  makeProperty({
    Item: 'Residential 1.5 Mile Comps',
    FULL_ADDRESS: '8055 E THOMAS RD 301, SCOTTSDALE, AZ 85251',
    APN: '173-37-200',
    STATUS: 'A',
    SALE_PRICE: 0,
    OG_LIST_PRICE: 525000,
    BR: 3, BA: 2, SQFT: 1650, LOT_SIZE: 5000,
    YEAR_BUILT: 2005, IS_RENTAL: 'N',
    RENOVATE_SCORE: 8, RENO_YEAR_EST: 2022,
    PROPERTY_RADAR_COMP_YN: 'N',
    DAYS_ON_MARKET: 15,
  }),
  makeProperty({
    Item: 'Residential Lease 1.5 Mile Comps',
    FULL_ADDRESS: '6800 E CAMELBACK RD 105, SCOTTSDALE, AZ 85251',
    APN: '173-38-050',
    STATUS: 'C',
    SALE_PRICE: 2200,
    OG_LIST_PRICE: 2400,
    BR: 2, BA: 1, SQFT: 950, LOT_SIZE: 900,
    YEAR_BUILT: 1980, IS_RENTAL: 'Y',
    RENOVATE_SCORE: 4, RENO_YEAR_EST: undefined,
    PROPERTY_RADAR_COMP_YN: 'N',
    DAYS_ON_MARKET: 28,
  }),
  makeProperty({
    Item: 'Residential Lease 1.5 Mile Comps',
    FULL_ADDRESS: '4400 N SCOTTSDALE RD 202, SCOTTSDALE, AZ 85251',
    APN: '173-39-075',
    STATUS: 'C',
    SALE_PRICE: 1850,
    OG_LIST_PRICE: 1900,
    BR: 1, BA: 1, SQFT: 720, LOT_SIZE: 700,
    YEAR_BUILT: 1976, IS_RENTAL: 'Y',
    RENOVATE_SCORE: 3, RENO_YEAR_EST: undefined,
    PROPERTY_RADAR_COMP_YN: 'N',
    DAYS_ON_MARKET: 35,
  }),
  makeProperty({
    Item: 'Residential 1.5 Mile Comps',
    FULL_ADDRESS: '7600 E MCDONALD DR, SCOTTSDALE, AZ 85250',
    APN: '173-40-300',
    STATUS: 'P',
    SALE_PRICE: 0,
    OG_LIST_PRICE: 875000,
    BR: 4, BA: 3, SQFT: 2800, LOT_SIZE: 12000,
    YEAR_BUILT: 1995, IS_RENTAL: 'N',
    RENOVATE_SCORE: 9, RENO_YEAR_EST: 2023,
    PROPERTY_RADAR_COMP_YN: 'N',
    DAYS_ON_MARKET: 8,
  }),
]

// ─── MLSRow Fixtures (Phase 1 M1: computed metrics) ──────

/** Minimal valid MLSRow for testing */
export function makeMLSRow(overrides: Partial<MLSRow> = {}): MLSRow {
  return {
    mlsNumber: 'MLS-TEST-001',
    apn: '173-35-001',
    address: '1234 N TEST ST',
    city: 'Scottsdale',
    state: 'AZ',
    zip: '85251',
    salePrice: 440000,
    listPrice: 450000,
    pricePerSqFt: 244.44,
    saleDate: new Date('2024-03-01'),
    listDate: new Date('2024-01-15'),
    underContractDate: new Date('2024-02-10'),
    propertyType: 'Residential',
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1800,
    lotSize: 7200,
    yearBuilt: 1985,
    garageSpaces: 2,
    pool: true,
    stories: 1,
    fireplace: false,
    hoa: true,
    hoaFee: 250,
    hoaPaidFrequency: 'Monthly',
    hoaTransferFee: null,
    coveredParkingSpaces: 0,
    totalParkingSpaces: 2,
    parkingFeatures: ['Garage'],
    sellerConcessions: null,
    buyerIncentives: null,
    listingTerms: ['Conventional'],
    isShortSale: false,
    isForeclosure: false,
    isREO: false,
    isNewConstruction: false,
    daysOnMarket: 45,
    status: 'C',
    statusDisplay: 'Sold',
    distance: null,
    latitude: 33.4942,
    longitude: -111.9261,
    subdivision: 'Test Subdivision',
    remarks: '',
    legalDescription: null,
    taxYear: null,
    annualTaxes: null,
    listingAgent: null,
    listingAgency: null,
    ...overrides,
  }
}

/** Subject property for distance calculations */
export const GOLDEN_SUBJECT: SubjectProperty = {
  address: '4620 N 68TH ST 155, SCOTTSDALE, AZ 85251',
  latitude: 33.5088,
  longitude: -111.9250,
}

/**
 * Golden MLSRow dataset: 6 rows matching the PropertyData golden set.
 * Includes sold, active, pending, and a lease comp.
 */
export const GOLDEN_MLS_ROWS: MLSRow[] = [
  // Row 0: Sold, 702 sqft — should produce sale price/sqft, list-to-sale, true DOM
  makeMLSRow({
    mlsNumber: 'MLS-G-001',
    address: '4600 N 68TH ST 371',
    status: 'C',
    statusDisplay: 'Sold',
    salePrice: 215000,
    listPrice: 229000,
    squareFeet: 702,
    saleDate: new Date('2024-03-01'),
    listDate: new Date('2023-12-08'),
    daysOnMarket: 83,
    latitude: 33.5070,
    longitude: -111.9255,
  }),
  // Row 1: Sold, 1100 sqft
  makeMLSRow({
    mlsNumber: 'MLS-G-002',
    address: '7320 E CAMELBACK RD 210',
    status: 'C',
    statusDisplay: 'Sold',
    salePrice: 385000,
    listPrice: 399000,
    squareFeet: 1100,
    saleDate: new Date('2024-03-01'),
    listDate: new Date('2024-01-18'),
    daysOnMarket: 42,
    latitude: 33.5092,
    longitude: -111.9180,
  }),
  // Row 2: Active — no sale price, no list-to-sale ratio
  makeMLSRow({
    mlsNumber: 'MLS-G-003',
    address: '8055 E THOMAS RD 301',
    status: 'A',
    statusDisplay: 'Active',
    salePrice: null,
    listPrice: 525000,
    squareFeet: 1650,
    saleDate: null,
    listDate: new Date('2024-02-15'),
    daysOnMarket: 15,
    latitude: 33.4803,
    longitude: -111.9120,
  }),
  // Row 3: Sold lease comp — low "sale" price is actually rent
  makeMLSRow({
    mlsNumber: 'MLS-G-004',
    address: '6800 E CAMELBACK RD 105',
    status: 'C',
    statusDisplay: 'Sold',
    salePrice: 2200,
    listPrice: 2400,
    squareFeet: 950,
    saleDate: new Date('2024-02-01'),
    listDate: new Date('2024-01-04'),
    daysOnMarket: 28,
    latitude: 33.5090,
    longitude: -111.9300,
  }),
  // Row 4: Sold lease comp
  makeMLSRow({
    mlsNumber: 'MLS-G-005',
    address: '4400 N SCOTTSDALE RD 202',
    status: 'C',
    statusDisplay: 'Sold',
    salePrice: 1850,
    listPrice: 1900,
    squareFeet: 720,
    saleDate: new Date('2024-02-15'),
    listDate: new Date('2024-01-10'),
    daysOnMarket: 35,
    latitude: 33.4960,
    longitude: -111.9270,
  }),
  // Row 5: Pending — no sale price, no list-to-sale
  makeMLSRow({
    mlsNumber: 'MLS-G-006',
    address: '7600 E MCDONALD DR',
    status: 'P',
    statusDisplay: 'Pending',
    salePrice: null,
    listPrice: 875000,
    squareFeet: 2800,
    saleDate: null,
    listDate: new Date('2024-02-22'),
    daysOnMarket: 8,
    latitude: 33.5230,
    longitude: -111.9195,
  }),
]

/** Threshold test helpers */
export const THRESHOLD_TEST_CASES = {
  /** All lookups succeed */
  allSuccess: { failed: 0, total: 10 },
  /** Below warn threshold */
  belowWarn: { failed: 1, total: 10 },
  /** Between warn and abort */
  warnRange: { failed: 3, total: 10 },
  /** Above abort threshold */
  abortRange: { failed: 5, total: 10 },
  /** Too small for thresholds */
  tooSmall: { failed: 2, total: 3 },
}
