/**
 * Unit Tests for MLS Data Type Guards and Utilities
 *
 * Tests type guard functions, converters, and validation utilities
 * for MLS data processing.
 */

import {
  isMLSStatus,
  isMLSBoolean,
  mlsBooleanToBoolean,
  booleanToMLSBoolean,
  statusToDisplay,
  APN_REGEX,
  VALIDATION_RULES,
  TEMPLATE_SHEETS,
  UPLOAD_TEMPLATE_SHEETS,
  COMPS_COLUMNS,
  type MLSStatus,
  type MLSBoolean,
  type StatusDisplay,
} from '../mls-data'

describe('mls-data type guards and utilities', () => {
  describe('isMLSStatus', () => {
    it('should return true for valid MLS status codes', () => {
      const validStatuses: MLSStatus[] = ['A', 'C', 'P', 'U', 'X', 'T', 'W']

      validStatuses.forEach(status => {
        expect(isMLSStatus(status)).toBe(true)
      })
    })

    it('should return false for invalid status codes', () => {
      expect(isMLSStatus('Z')).toBe(false)
      expect(isMLSStatus('Active')).toBe(false)
      expect(isMLSStatus('')).toBe(false)
      expect(isMLSStatus(null)).toBe(false)
      expect(isMLSStatus(undefined)).toBe(false)
      expect(isMLSStatus(123)).toBe(false)
    })

    it('should return false for lowercase status codes', () => {
      expect(isMLSStatus('a')).toBe(false)
      expect(isMLSStatus('c')).toBe(false)
    })
  })

  describe('isMLSBoolean', () => {
    it('should return true for valid MLS boolean values', () => {
      const validBooleans: MLSBoolean[] = ['Y', 'N', 'Yes', 'No', 'TRUE', 'FALSE']

      validBooleans.forEach(value => {
        expect(isMLSBoolean(value)).toBe(true)
      })
    })

    it('should return false for invalid boolean values', () => {
      expect(isMLSBoolean('true')).toBe(false)
      expect(isMLSBoolean('false')).toBe(false)
      expect(isMLSBoolean('1')).toBe(false)
      expect(isMLSBoolean('0')).toBe(false)
      expect(isMLSBoolean(true)).toBe(false)
      expect(isMLSBoolean(false)).toBe(false)
      expect(isMLSBoolean('')).toBe(false)
      expect(isMLSBoolean(null)).toBe(false)
      expect(isMLSBoolean(undefined)).toBe(false)
    })

    it('should return false for lowercase variations', () => {
      expect(isMLSBoolean('y')).toBe(false)
      expect(isMLSBoolean('n')).toBe(false)
      expect(isMLSBoolean('yes')).toBe(false)
      expect(isMLSBoolean('no')).toBe(false)
    })
  })

  describe('mlsBooleanToBoolean', () => {
    it('should convert Y to true', () => {
      expect(mlsBooleanToBoolean('Y')).toBe(true)
    })

    it('should convert Yes to true', () => {
      expect(mlsBooleanToBoolean('Yes')).toBe(true)
    })

    it('should convert TRUE to true', () => {
      expect(mlsBooleanToBoolean('TRUE')).toBe(true)
    })

    it('should convert N to false', () => {
      expect(mlsBooleanToBoolean('N')).toBe(false)
    })

    it('should convert No to false', () => {
      expect(mlsBooleanToBoolean('No')).toBe(false)
    })

    it('should convert FALSE to false', () => {
      expect(mlsBooleanToBoolean('FALSE')).toBe(false)
    })
  })

  describe('booleanToMLSBoolean', () => {
    it('should convert true to Y', () => {
      expect(booleanToMLSBoolean(true)).toBe('Y')
    })

    it('should convert false to N', () => {
      expect(booleanToMLSBoolean(false)).toBe('N')
    })
  })

  describe('statusToDisplay', () => {
    it('should convert A to Active', () => {
      expect(statusToDisplay('A')).toBe('Active')
    })

    it('should convert C to Sold', () => {
      expect(statusToDisplay('C')).toBe('Sold')
    })

    it('should convert P to Pending', () => {
      expect(statusToDisplay('P')).toBe('Pending')
    })

    it('should convert U to Under Contract', () => {
      expect(statusToDisplay('U')).toBe('Under Contract')
    })

    it('should convert X to Cancelled', () => {
      expect(statusToDisplay('X')).toBe('Cancelled')
    })

    it('should convert T to Temp Off', () => {
      expect(statusToDisplay('T')).toBe('Temp Off')
    })

    it('should convert W to Withdrawn', () => {
      expect(statusToDisplay('W')).toBe('Withdrawn')
    })

    it('should handle all status codes', () => {
      const allStatuses: MLSStatus[] = ['A', 'C', 'P', 'U', 'X', 'T', 'W']

      allStatuses.forEach(status => {
        const display = statusToDisplay(status)
        expect(display).toBeTruthy()
        expect(typeof display).toBe('string')
      })
    })
  })

  describe('APN_REGEX', () => {
    it('should match valid APN format ###-##-###', () => {
      expect(APN_REGEX.test('123-45-678')).toBe(true)
      expect(APN_REGEX.test('999-99-999')).toBe(true)
      expect(APN_REGEX.test('100-00-001')).toBe(true)
    })

    it('should match valid APN format ###-##-####', () => {
      expect(APN_REGEX.test('123-45-6789')).toBe(true)
      expect(APN_REGEX.test('999-99-9999')).toBe(true)
    })

    it('should match valid APN format with suffix letter ###-##-###A', () => {
      expect(APN_REGEX.test('123-45-678A')).toBe(true)
      expect(APN_REGEX.test('123-45-678Z')).toBe(true)
      expect(APN_REGEX.test('123-45-6789B')).toBe(true)
    })

    it('should reject invalid APN formats', () => {
      expect(APN_REGEX.test('12-34-567')).toBe(false) // Too short
      expect(APN_REGEX.test('1234-56-789')).toBe(false) // First part too long
      expect(APN_REGEX.test('123-456-789')).toBe(false) // Second part too long
      expect(APN_REGEX.test('123-45-67')).toBe(false) // Third part too short
      expect(APN_REGEX.test('123-45-67890')).toBe(false) // Third part too long
      expect(APN_REGEX.test('12345678')).toBe(false) // No dashes
      expect(APN_REGEX.test('123-45-678a')).toBe(false) // Lowercase suffix
      expect(APN_REGEX.test('123-45-678AB')).toBe(false) // Multiple suffix letters
      expect(APN_REGEX.test('A23-45-678')).toBe(false) // Letter in number
    })

    it('should reject APNs with spaces', () => {
      expect(APN_REGEX.test('123 45 678')).toBe(false)
      expect(APN_REGEX.test('123-45-678 ')).toBe(false)
    })
  })

  describe('VALIDATION_RULES', () => {
    describe('APN validation', () => {
      it('should have correct APN pattern', () => {
        expect(VALIDATION_RULES.APN.pattern).toBe(APN_REGEX)
      })

      it('should have descriptive message', () => {
        expect(VALIDATION_RULES.APN.message).toContain('###-##-###')
        expect(VALIDATION_RULES.APN.message).toContain('format')
      })
    })

    describe('SALE_PRICE validation', () => {
      it('should have min value of 0', () => {
        expect(VALIDATION_RULES.SALE_PRICE.min).toBe(0)
      })

      it('should have max value of 99,999,999', () => {
        expect(VALIDATION_RULES.SALE_PRICE.max).toBe(99999999)
      })

      it('should have descriptive message', () => {
        expect(VALIDATION_RULES.SALE_PRICE.message).toContain('price')
      })
    })

    describe('SQUARE_FEET validation', () => {
      it('should have min value of 1', () => {
        expect(VALIDATION_RULES.SQUARE_FEET.min).toBe(1)
      })

      it('should have max value of 50,000', () => {
        expect(VALIDATION_RULES.SQUARE_FEET.max).toBe(50000)
      })

      it('should have descriptive message', () => {
        expect(VALIDATION_RULES.SQUARE_FEET.message).toContain('Square feet')
      })
    })

    describe('BEDROOMS validation', () => {
      it('should have min value of 0', () => {
        expect(VALIDATION_RULES.BEDROOMS.min).toBe(0)
      })

      it('should have max value of 99', () => {
        expect(VALIDATION_RULES.BEDROOMS.max).toBe(99)
      })

      it('should have descriptive message', () => {
        expect(VALIDATION_RULES.BEDROOMS.message).toContain('Bedrooms')
      })
    })

    describe('YEAR_BUILT validation', () => {
      it('should have min value of 1800', () => {
        expect(VALIDATION_RULES.YEAR_BUILT.min).toBe(1800)
      })

      it('should have max value of current year + 2', () => {
        const currentYear = new Date().getFullYear()
        expect(VALIDATION_RULES.YEAR_BUILT.max).toBe(currentYear + 2)
      })

      it('should have descriptive message', () => {
        expect(VALIDATION_RULES.YEAR_BUILT.message).toContain('Year built')
      })
    })
  })

  describe('TEMPLATE_SHEETS', () => {
    it('should have all expected sheet names', () => {
      expect(TEMPLATE_SHEETS.COMPS).toBe('comps')
      expect(TEMPLATE_SHEETS.FULL_API_CALL).toBe('Full_API_call')
      expect(TEMPLATE_SHEETS.ANALYSIS).toBe('Analysis')
      expect(TEMPLATE_SHEETS.CALCS).toBe('Calcs')
      expect(TEMPLATE_SHEETS.MARICOPA).toBe('Maricopa')
      expect(TEMPLATE_SHEETS.HALF_MILE).toBe('.5mile')
      expect(TEMPLATE_SHEETS.LOT).toBe('Lot')
    })

    it('should have 7 sheet names', () => {
      const sheetNames = Object.values(TEMPLATE_SHEETS)
      expect(sheetNames).toHaveLength(7)
    })
  })

  describe('UPLOAD_TEMPLATE_SHEETS', () => {
    it('should have the current upload template sheet names', () => {
      expect(UPLOAD_TEMPLATE_SHEETS.RESI_COMPS).toBe('MLS-Resi-Comps')
      expect(UPLOAD_TEMPLATE_SHEETS.LEASE_COMPS).toBe('MLS-Lease-Comps')
      expect(UPLOAD_TEMPLATE_SHEETS.MCAO_API).toBe('Full-MCAO-API')
      expect(UPLOAD_TEMPLATE_SHEETS.ANALYSIS).toBe('Analysis')
    })

    it('should share Analysis sheet name with TEMPLATE_SHEETS', () => {
      expect(UPLOAD_TEMPLATE_SHEETS.ANALYSIS).toBe(TEMPLATE_SHEETS.ANALYSIS)
    })
  })

  describe('COMPS_COLUMNS', () => {
    it('should have NOTES in column A', () => {
      expect(COMPS_COLUMNS.NOTES).toBe('A')
    })

    it('should have ADDRESS in column B', () => {
      expect(COMPS_COLUMNS.ADDRESS).toBe('B')
    })

    it('should have core fields in correct columns', () => {
      expect(COMPS_COLUMNS.CITY).toBe('C')
      expect(COMPS_COLUMNS.STATE).toBe('D')
      expect(COMPS_COLUMNS.ZIP).toBe('E')
      expect(COMPS_COLUMNS.APN).toBe('F')
      expect(COMPS_COLUMNS.SALE_PRICE).toBe('G')
      expect(COMPS_COLUMNS.SALE_DATE).toBe('H')
      expect(COMPS_COLUMNS.LIST_PRICE).toBe('I')
      expect(COMPS_COLUMNS.DAYS_ON_MARKET).toBe('J')
    })

    it('should have property characteristics in correct columns', () => {
      expect(COMPS_COLUMNS.PROPERTY_TYPE).toBe('K')
      expect(COMPS_COLUMNS.BEDROOMS).toBe('L')
      expect(COMPS_COLUMNS.BATHROOMS).toBe('M')
      expect(COMPS_COLUMNS.SQUARE_FEET).toBe('N')
      expect(COMPS_COLUMNS.LOT_SIZE).toBe('O')
      expect(COMPS_COLUMNS.YEAR_BUILT).toBe('P')
    })

    it('should have features in correct columns', () => {
      expect(COMPS_COLUMNS.GARAGE_SPACES).toBe('Q')
      expect(COMPS_COLUMNS.POOL).toBe('R')
      expect(COMPS_COLUMNS.STORIES).toBe('S')
      expect(COMPS_COLUMNS.FIREPLACE).toBe('AA')
    })

    it('should have MLS data in correct columns', () => {
      expect(COMPS_COLUMNS.MLS_NUMBER).toBe('X')
      expect(COMPS_COLUMNS.STATUS).toBe('Y')
      expect(COMPS_COLUMNS.REMARKS).toBe('Z')
    })

    it('should have location data in correct columns', () => {
      expect(COMPS_COLUMNS.DISTANCE).toBe('W')
      expect(COMPS_COLUMNS.GEO_LAT).toBe('AJ')
      expect(COMPS_COLUMNS.GEO_LON).toBe('AK')
    })

    it('should have all expected column mappings', () => {
      const columns = Object.keys(COMPS_COLUMNS)
      expect(columns.length).toBeGreaterThan(20) // Should have many columns

      // Verify no duplicate column letters
      const columnLetters = Object.values(COMPS_COLUMNS)
      const uniqueLetters = new Set(columnLetters)
      expect(uniqueLetters.size).toBe(columnLetters.length)
    })
  })

  describe('Type conversions', () => {
    it('should round-trip boolean conversions', () => {
      expect(mlsBooleanToBoolean(booleanToMLSBoolean(true))).toBe(true)
      expect(mlsBooleanToBoolean(booleanToMLSBoolean(false))).toBe(false)
    })

    it('should handle all MLS boolean variants', () => {
      const trueValues: MLSBoolean[] = ['Y', 'Yes', 'TRUE']
      const falseValues: MLSBoolean[] = ['N', 'No', 'FALSE']

      trueValues.forEach(value => {
        expect(mlsBooleanToBoolean(value)).toBe(true)
      })

      falseValues.forEach(value => {
        expect(mlsBooleanToBoolean(value)).toBe(false)
      })
    })

    it('should produce consistent status display strings', () => {
      const statuses: MLSStatus[] = ['A', 'C', 'P', 'U', 'X', 'T', 'W']
      const displays: StatusDisplay[] = [
        'Active',
        'Sold',
        'Pending',
        'Under Contract',
        'Cancelled',
        'Temp Off',
        'Withdrawn',
      ]

      statuses.forEach((status, index) => {
        expect(statusToDisplay(status)).toBe(displays[index])
      })
    })
  })
})
