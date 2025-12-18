/**
 * Transaction Type Utilities
 *
 * Helper functions for filtering and interpreting property data based on transaction type
 *
 * CRITICAL CONTEXT:
 * - Column H (SALE_PRICE) contains BOTH sale prices ($250K) and monthly rents ($1,500)
 * - IS_RENTAL field differentiates: 'Y' = lease/rent, 'N' = sale
 * - This utility ensures we never mix these incompatible values in the same calculation
 *
 * @module lib/processing/transaction-utils
 */

import { TransactionType } from '../types/breakups-analysis';

/**
 * Base property data interface (minimal required fields)
 * Full PropertyData interface is defined in breakups-generator.ts
 */
export interface PropertyDataBase {
  SALE_PRICE: number;
  IS_RENTAL: 'Y' | 'N' | string;
  SQFT: number;
  BR: number;
  BA: number;
  [key: string]: any;
}

/**
 * Sale property type marker (IS_RENTAL='N')
 * SALE_PRICE represents actual purchase price
 */
export type SaleProperty = PropertyDataBase & {
  IS_RENTAL: 'N';
}

/**
 * Lease property type marker (IS_RENTAL='Y')
 * SALE_PRICE represents monthly rent
 */
export type LeaseProperty = PropertyDataBase & {
  IS_RENTAL: 'Y';
}

// ============================================================================
// Filter Functions
// ============================================================================

/**
 * Filter properties to sale transactions only (IS_RENTAL='N')
 * SALE_PRICE represents actual purchase price
 */
export function filterSaleProperties<T extends PropertyDataBase>(properties: T[]): T[] {
  return properties.filter((p) => p.IS_RENTAL === 'N');
}

/**
 * Filter properties to lease transactions only (IS_RENTAL='Y')
 * SALE_PRICE represents monthly rent
 */
export function filterLeaseProperties<T extends PropertyDataBase>(properties: T[]): T[] {
  return properties.filter((p) => p.IS_RENTAL === 'Y');
}

/**
 * Get transaction type from IS_RENTAL field
 */
export function getTransactionType(property: PropertyDataBase): TransactionType {
  return property.IS_RENTAL === 'Y' ? TransactionType.LEASE : TransactionType.SALE;
}

// ============================================================================
// Price Interpretation Functions
// ============================================================================

/**
 * Safely interpret SALE_PRICE based on transaction type
 * Returns { value, unit, transactionType }
 */
export function interpretPrice(property: PropertyDataBase): {
  value: number;
  unit: 'sale_price' | 'monthly_rent';
  transactionType: TransactionType;
} {
  if (property.IS_RENTAL === 'Y') {
    return {
      value: property.SALE_PRICE,
      unit: 'monthly_rent',
      transactionType: TransactionType.LEASE,
    };
  }
  return {
    value: property.SALE_PRICE,
    unit: 'sale_price',
    transactionType: TransactionType.SALE,
  };
}

/**
 * Get sale price for sale properties (throws error if lease property)
 */
export function getSalePrice(property: PropertyDataBase): number {
  if (property.IS_RENTAL === 'Y') {
    throw new Error('Cannot get sale price from lease property');
  }
  return property.SALE_PRICE;
}

/**
 * Get monthly rent for lease properties (throws error if sale property)
 */
export function getMonthlyRent(property: PropertyDataBase): number {
  if (property.IS_RENTAL === 'N') {
    throw new Error('Cannot get monthly rent from sale property');
  }
  return property.SALE_PRICE;
}

/**
 * Get annual rent for lease properties
 */
export function getAnnualRent(property: PropertyDataBase): number {
  return getMonthlyRent(property) * 12;
}

// ============================================================================
// Per-Square-Foot Calculations
// ============================================================================

/**
 * Calculate price per square foot for sale properties
 */
export function calculatePricePerSqft(saleProperty: PropertyData): number {
  if (saleProperty.IS_RENTAL === 'Y') {
    throw new Error('Cannot calculate price/sqft for lease property');
  }
  if (!saleProperty.SQFT || saleProperty.SQFT <= 0) {
    return 0;
  }
  return saleProperty.SALE_PRICE / saleProperty.SQFT;
}

/**
 * Calculate rent per square foot for lease properties (monthly)
 */
export function calculateRentPerSqft(leaseProperty: PropertyData): number {
  if (leaseProperty.IS_RENTAL === 'N') {
    throw new Error('Cannot calculate rent/sqft for sale property');
  }
  if (!leaseProperty.SQFT || leaseProperty.SQFT <= 0) {
    return 0;
  }
  return leaseProperty.SALE_PRICE / leaseProperty.SQFT;
}

/**
 * Calculate annual rent per square foot for lease properties
 */
export function calculateAnnualRentPerSqft(leaseProperty: PropertyData): number {
  return calculateRentPerSqft(leaseProperty) * 12;
}

// ============================================================================
// Statistics Helper Functions
// ============================================================================

/**
 * Calculate average for sale properties
 */
export function calculateAverageSalePrice(saleProperties: PropertyData[]): number {
  const filtered = saleProperties.filter((p) => p.IS_RENTAL === 'N' && p.SALE_PRICE > 0);
  if (filtered.length === 0) return 0;
  const sum = filtered.reduce((acc, p) => acc + p.SALE_PRICE, 0);
  return sum / filtered.length;
}

/**
 * Calculate average for lease properties (monthly)
 */
export function calculateAverageMonthlyRent(leaseProperties: PropertyData[]): number {
  const filtered = leaseProperties.filter((p) => p.IS_RENTAL === 'Y' && p.SALE_PRICE > 0);
  if (filtered.length === 0) return 0;
  const sum = filtered.reduce((acc, p) => acc + p.SALE_PRICE, 0);
  return sum / filtered.length;
}

/**
 * Calculate average annual rent for lease properties
 */
export function calculateAverageAnnualRent(leaseProperties: PropertyData[]): number {
  return calculateAverageMonthlyRent(leaseProperties) * 12;
}

/**
 * Calculate median for sale properties
 */
export function calculateMedianSalePrice(saleProperties: PropertyData[]): number {
  const filtered = saleProperties.filter((p) => p.IS_RENTAL === 'N' && p.SALE_PRICE > 0);
  if (filtered.length === 0) return 0;

  const sorted = filtered.map((p) => p.SALE_PRICE).sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/**
 * Calculate median monthly rent for lease properties
 */
export function calculateMedianMonthlyRent(leaseProperties: PropertyData[]): number {
  const filtered = leaseProperties.filter((p) => p.IS_RENTAL === 'Y' && p.SALE_PRICE > 0);
  if (filtered.length === 0) return 0;

  const sorted = filtered.map((p) => p.SALE_PRICE).sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate that array contains only sale properties
 */
export function validateSaleProperties(properties: PropertyDataBase[]): boolean {
  return properties.every((p) => p.IS_RENTAL === 'N');
}

/**
 * Validate that array contains only lease properties
 */
export function validateLeaseProperties(properties: PropertyDataBase[]): boolean {
  return properties.every((p) => p.IS_RENTAL === 'Y');
}

/**
 * Count properties by transaction type
 */
export function countByTransactionType(properties: PropertyDataBase[]): {
  sale: number;
  lease: number;
  total: number;
} {
  const sale = properties.filter((p) => p.IS_RENTAL === 'N').length;
  const lease = properties.filter((p) => p.IS_RENTAL === 'Y').length;
  return { sale, lease, total: properties.length };
}

// ============================================================================
// Format Helper Functions
// ============================================================================

/**
 * Format sale price as currency
 */
export function formatSalePrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Format monthly rent as currency
 */
export function formatMonthlyRent(rent: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(rent);
}

/**
 * Format annual rent as currency
 */
export function formatAnnualRent(rent: number): string {
  return formatSalePrice(rent);
}

/**
 * Get display label for transaction type
 */
export function getTransactionTypeLabel(type: TransactionType): string {
  return type === TransactionType.SALE ? 'Sale Market' : 'Lease Market';
}

/**
 * Get price/rent label based on transaction type
 */
export function getPriceLabel(type: TransactionType): string {
  return type === TransactionType.SALE ? 'Sale Price' : 'Monthly Rent';
}
