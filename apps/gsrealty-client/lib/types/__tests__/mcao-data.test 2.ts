/**
 * Unit Tests for MCAO Data Type Guards and Utilities
 *
 * Tests type guard functions, formatters, and utility functions
 * for Maricopa County Assessor's Office data processing.
 */

import {
  isValidAPN,
  formatAPN,
  formatCurrency,
  formatSquareFeet,
  parseToSummary,
  toMaricopaSheetData,
  MCAOErrorCode,
  type APN,
  type MCAOApiResponse,
  type MCAOPropertySummary,
  type MCAOMaricopaSheetData,
} from '../mcao-data'

describe('mcao-data type guards and utilities', () => {
  describe('isValidAPN', () => {
    it('should return true for valid APN format ###-##-###', () => {
      expect(isValidAPN('123-45-678')).toBe(true)
      expect(isValidAPN('999-99-999')).toBe(true)
      expect(isValidAPN('100-00-001')).toBe(true)
    })

    it('should return true for valid APN format ###-##-####', () => {
      expect(isValidAPN('123-45-6789')).toBe(true)
      expect(isValidAPN('999-99-9999')).toBe(true)
    })

    it('should return true for valid APN with suffix letter', () => {
      expect(isValidAPN('123-45-678A')).toBe(true)
      expect(isValidAPN('123-45-678Z')).toBe(true)
      expect(isValidAPN('123-45-6789B')).toBe(true)
    })

    it('should return false for invalid formats', () => {
      expect(isValidAPN('12-34-567')).toBe(false)
      expect(isValidAPN('1234-56-789')).toBe(false)
      expect(isValidAPN('123-456-789')).toBe(false)
      expect(isValidAPN('123-45-67')).toBe(false)
      expect(isValidAPN('12345678')).toBe(false)
      expect(isValidAPN('123-45-678a')).toBe(false) // lowercase
      expect(isValidAPN('A23-45-678')).toBe(false)
      expect(isValidAPN('')).toBe(false)
    })

    it('should return false for APNs with spaces', () => {
      expect(isValidAPN('123 45 678')).toBe(false)
      expect(isValidAPN('123-45-678 ')).toBe(false)
      expect(isValidAPN(' 123-45-678')).toBe(false)
    })
  })

  describe('formatAPN', () => {
    it('should format APN without dashes', () => {
      expect(formatAPN('12345678')).toBe('123-45-678')
      expect(formatAPN('123456789')).toBe('123-45-6789')
    })

    it('should format APN with suffix', () => {
      expect(formatAPN('12345678A')).toBe('123-45-678A')
      expect(formatAPN('123456789B')).toBe('123-45-6789B')
    })

    it('should handle already formatted APNs', () => {
      expect(formatAPN('123-45-678')).toBe('123-45-678')
      expect(formatAPN('123-45-6789')).toBe('123-45-6789')
    })

    it('should remove spaces', () => {
      expect(formatAPN('123 45 678')).toBe('123-45-678')
      expect(formatAPN('123 45 6789')).toBe('123-45-6789')
    })

    it('should handle mixed formatting', () => {
      expect(formatAPN('123-45 678')).toBe('123-45-678')
      expect(formatAPN('123 45-678')).toBe('123-45-678')
    })

    it('should return input if too short', () => {
      expect(formatAPN('1234567')).toBe('1234567')
      expect(formatAPN('123')).toBe('123')
    })

    it('should handle extra characters', () => {
      expect(formatAPN('12345678ABC')).toBe('123-45-678ABC')
    })
  })

  describe('formatCurrency', () => {
    it('should format whole dollar amounts', () => {
      expect(formatCurrency(0)).toBe('$0')
      expect(formatCurrency(100)).toBe('$100')
      expect(formatCurrency(1000)).toBe('$1,000')
      expect(formatCurrency(1000000)).toBe('$1,000,000')
    })

    it('should not show cents', () => {
      expect(formatCurrency(100.50)).toBe('$100')
      expect(formatCurrency(1234.99)).toBe('$1,234')
    })

    it('should handle large amounts', () => {
      expect(formatCurrency(999999999)).toBe('$999,999,999')
    })

    it('should handle negative amounts', () => {
      expect(formatCurrency(-100)).toBe('-$100')
      expect(formatCurrency(-1000)).toBe('-$1,000')
    })

    it('should include thousands separators', () => {
      expect(formatCurrency(12345)).toBe('$12,345')
      expect(formatCurrency(123456)).toBe('$123,456')
      expect(formatCurrency(1234567)).toBe('$1,234,567')
    })
  })

  describe('formatSquareFeet', () => {
    it('should format square feet with unit', () => {
      expect(formatSquareFeet(1000)).toBe('1,000 sqft')
      expect(formatSquareFeet(2500)).toBe('2,500 sqft')
      expect(formatSquareFeet(10000)).toBe('10,000 sqft')
    })

    it('should include thousands separators', () => {
      expect(formatSquareFeet(12345)).toBe('12,345 sqft')
    })

    it('should handle small values', () => {
      expect(formatSquareFeet(0)).toBe('0 sqft')
      expect(formatSquareFeet(1)).toBe('1 sqft')
      expect(formatSquareFeet(100)).toBe('100 sqft')
    })

    it('should handle large values', () => {
      expect(formatSquareFeet(50000)).toBe('50,000 sqft')
    })
  })

  describe('parseToSummary', () => {
    const mockApiResponse: MCAOApiResponse = {
      apn: '123-45-678' as APN,
      parcelNumber: 'PARCEL123',
      ownerName: 'John Doe',
      ownerAddress: {
        street: '123 Main St',
        city: 'Phoenix',
        state: 'AZ',
        zip: '85001',
      },
      legalDescription: 'Lot 1, Block 2, Subdivision ABC',
      propertyAddress: {
        number: '456',
        street: 'Oak Street',
        city: 'Phoenix',
        state: 'AZ',
        zip: '85002',
        fullAddress: '456 Oak Street, Phoenix, AZ 85002',
      },
      propertyType: 'Single Family',
      landUse: 'Residential',
      lotSize: 7500,
      yearBuilt: 2005,
      assessedValue: {
        total: 350000,
        land: 100000,
        improvement: 250000,
      },
      taxInfo: {
        taxYear: 2024,
        taxAmount: 3500,
        taxRate: 0.01,
        taxArea: 'TA-001',
      },
      lastUpdated: '2024-01-15T10:00:00Z',
      dataSource: 'MCAO',
    }

    it('should extract summary data correctly', () => {
      const summary = parseToSummary(mockApiResponse)

      expect(summary.apn).toBe('123-45-678')
      expect(summary.ownerName).toBe('John Doe')
      expect(summary.propertyAddress).toBe('456 Oak Street, Phoenix, AZ 85002')
      expect(summary.assessedValue).toBe(350000)
      expect(summary.taxAmount).toBe(3500)
      expect(summary.yearBuilt).toBe(2005)
      expect(summary.lotSize).toBe(7500)
      expect(summary.lastUpdated).toBe('2024-01-15T10:00:00Z')
    })

    it('should handle missing optional fields', () => {
      const responseWithoutYear = {
        ...mockApiResponse,
        yearBuilt: undefined,
      }

      const summary = parseToSummary(responseWithoutYear)

      expect(summary.yearBuilt).toBeUndefined()
      expect(summary.apn).toBe('123-45-678')
    })
  })

  describe('toMaricopaSheetData', () => {
    const mockApiResponse: MCAOApiResponse = {
      apn: '123-45-678' as APN,
      parcelNumber: 'PARCEL123',
      ownerName: 'John Doe',
      legalDescription: 'Lot 1, Block 2, Subdivision ABC',
      subdivision: 'Test Subdivision',
      lot: '1',
      block: '2',
      propertyAddress: {
        number: '456',
        street: 'Oak Street',
        city: 'Phoenix',
        state: 'AZ',
        zip: '85002',
        fullAddress: '456 Oak Street, Phoenix, AZ 85002',
      },
      propertyType: 'Single Family',
      landUse: 'Residential',
      zoning: 'R1-6',
      lotSize: 7500,
      improvementSize: 2000,
      yearBuilt: 2005,
      bedrooms: 3,
      bathrooms: 2,
      stories: 1,
      constructionType: 'Frame',
      roofType: 'Shingle',
      assessedValue: {
        total: 350000,
        land: 100000,
        improvement: 250000,
      },
      taxInfo: {
        taxYear: 2024,
        taxAmount: 3500,
        taxRate: 0.01,
        taxArea: 'TA-001',
      },
      features: {
        pool: true,
        garage: true,
        garageSpaces: 2,
        fireplace: true,
        ac: true,
        heating: 'Gas',
      },
      lastUpdated: '2024-01-15T10:00:00Z',
      dataSource: 'MCAO',
    }

    it('should convert to Maricopa sheet format', () => {
      const sheetData = toMaricopaSheetData(mockApiResponse)

      expect(sheetData.apn).toBe('123-45-678')
      expect(sheetData.ownerName).toBe('John Doe')
      expect(sheetData.propertyAddress).toBe('456 Oak Street, Phoenix, AZ 85002')
      expect(sheetData.legalDescription).toBe('Lot 1, Block 2, Subdivision ABC')
    })

    it('should format numeric values correctly', () => {
      const sheetData = toMaricopaSheetData(mockApiResponse)

      expect(sheetData.lotSize).toBe('7,500 sqft')
      expect(sheetData.improvementSize).toBe('2,000 sqft')
      expect(sheetData.yearBuilt).toBe('2005')
      expect(sheetData.assessedValueTotal).toBe('$350,000')
      expect(sheetData.assessedValueLand).toBe('$100,000')
      expect(sheetData.assessedValueImprovement).toBe('$250,000')
      expect(sheetData.taxAmount).toBe('$3,500')
    })

    it('should handle tax information', () => {
      const sheetData = toMaricopaSheetData(mockApiResponse)

      expect(sheetData.taxYear).toBe('2024')
      expect(sheetData.taxAmount).toBe('$3,500')
      expect(sheetData.taxRate).toBe('0.01')
    })

    it('should format features list', () => {
      const sheetData = toMaricopaSheetData(mockApiResponse)

      expect(sheetData.features).toContain('Pool')
      expect(sheetData.features).toContain('Garage (2 spaces)')
      expect(sheetData.features).toContain('Fireplace')
      expect(sheetData.features).toContain('A/C')
    })

    it('should handle missing features', () => {
      const responseWithoutFeatures = {
        ...mockApiResponse,
        features: undefined,
      }

      const sheetData = toMaricopaSheetData(responseWithoutFeatures)

      expect(sheetData.features).toBe('None listed')
    })

    it('should handle missing optional fields with N/A', () => {
      const minimalResponse: MCAOApiResponse = {
        apn: '123-45-678' as APN,
        parcelNumber: 'PARCEL123',
        ownerName: 'John Doe',
        legalDescription: 'Lot 1',
        propertyAddress: {
          number: '456',
          street: 'Oak Street',
          city: 'Phoenix',
          state: 'AZ',
          zip: '85002',
          fullAddress: '456 Oak Street, Phoenix, AZ 85002',
        },
        propertyType: 'Single Family',
        landUse: 'Residential',
        lotSize: 7500,
        assessedValue: {
          total: 350000,
          land: 100000,
          improvement: 250000,
        },
        taxInfo: {
          taxYear: 2024,
          taxAmount: 3500,
          taxRate: 0.01,
          taxArea: 'TA-001',
        },
        lastUpdated: '2024-01-15T10:00:00Z',
        dataSource: 'MCAO',
      }

      const sheetData = toMaricopaSheetData(minimalResponse)

      expect(sheetData.zoning).toBe('N/A')
      expect(sheetData.subdivision).toBe('N/A')
      expect(sheetData.lot).toBe('N/A')
      expect(sheetData.block).toBe('N/A')
      expect(sheetData.yearBuilt).toBe('N/A')
      expect(sheetData.bedrooms).toBe('N/A')
      expect(sheetData.bathrooms).toBe('N/A')
      expect(sheetData.improvementSize).toBe('N/A')
      expect(sheetData.constructionType).toBe('N/A')
    })

    it('should include property characteristics', () => {
      const sheetData = toMaricopaSheetData(mockApiResponse)

      expect(sheetData.propertyType).toBe('Single Family')
      expect(sheetData.landUse).toBe('Residential')
      expect(sheetData.zoning).toBe('R1-6')
      expect(sheetData.bedrooms).toBe('3')
      expect(sheetData.bathrooms).toBe('2')
      expect(sheetData.constructionType).toBe('Frame')
    })

    it('should include subdivision information', () => {
      const sheetData = toMaricopaSheetData(mockApiResponse)

      expect(sheetData.subdivision).toBe('Test Subdivision')
      expect(sheetData.lot).toBe('1')
      expect(sheetData.block).toBe('2')
    })
  })

  describe('MCAOErrorCode', () => {
    it('should have all expected error codes', () => {
      expect(MCAOErrorCode.INVALID_APN).toBe('INVALID_APN')
      expect(MCAOErrorCode.APN_NOT_FOUND).toBe('APN_NOT_FOUND')
      expect(MCAOErrorCode.API_ERROR).toBe('API_ERROR')
      expect(MCAOErrorCode.NETWORK_ERROR).toBe('NETWORK_ERROR')
      expect(MCAOErrorCode.TIMEOUT).toBe('TIMEOUT')
      expect(MCAOErrorCode.RATE_LIMIT).toBe('RATE_LIMIT')
      expect(MCAOErrorCode.UNAUTHORIZED).toBe('UNAUTHORIZED')
      expect(MCAOErrorCode.PARSE_ERROR).toBe('PARSE_ERROR')
      expect(MCAOErrorCode.CACHE_ERROR).toBe('CACHE_ERROR')
      expect(MCAOErrorCode.DATABASE_ERROR).toBe('DATABASE_ERROR')
    })

    it('should have 10 error codes', () => {
      const errorCodes = Object.values(MCAOErrorCode)
      expect(errorCodes).toHaveLength(10)
    })
  })

  describe('Edge cases and integration', () => {
    it('should handle empty strings', () => {
      expect(isValidAPN('')).toBe(false)
      expect(formatAPN('')).toBe('')
    })

    it('should format zero values', () => {
      expect(formatCurrency(0)).toBe('$0')
      expect(formatSquareFeet(0)).toBe('0 sqft')
    })

    it('should handle very large numbers', () => {
      expect(formatCurrency(999999999)).toBe('$999,999,999')
      expect(formatSquareFeet(999999)).toBe('999,999 sqft')
    })

    it('should preserve APN case sensitivity', () => {
      expect(isValidAPN('123-45-678A')).toBe(true)
      expect(isValidAPN('123-45-678a')).toBe(false)
      expect(formatAPN('12345678A')).toBe('123-45-678A')
    })
  })
})
