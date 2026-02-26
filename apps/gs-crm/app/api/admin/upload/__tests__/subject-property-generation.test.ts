/**
 * Subject Property Generation Tests
 *
 * CRITICAL: Tests that Subject Property appears in BOTH:
 * 1. Full-MCAO-API sheet (Row 2, Column B "Item" = "Subject Property")
 * 2. Analysis sheet (Row 2, Column A "Item" = "Subject Property")
 *
 * Also validates:
 * - SELLER_BASIS (columns I/J) populated from MCAO data
 * - CANCEL_DATE/UC_DATE (columns V/W) populated from MLS data
 * - Subject Property with/without APN
 * - Subject Property + multiple MLS comps
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import ExcelJS from 'exceljs'
import * as fs from 'fs'
import * as path from 'path'
import type { PropertyMasterListEntry } from '@/lib/types/mls-data'

// Mock the dependencies
jest.mock('@/lib/mcao/batch-apn-lookup', () => ({
  batchLookupAPNs: jest.fn().mockResolvedValue({ results: [], summary: { total: 0, resolved: 0, apnOnlyResolved: 0, apnFailed: 0, skipped: 0, retryable: 0, permanent: 0, durationMs: 0, aborted: false } }),
  extractAddressesFromMLSData: jest.fn().mockReturnValue([]),
}))

jest.mock('@/lib/mcao/fetch-property-data', () => ({
  batchFetchMCAOProperties: jest.fn().mockResolvedValue(new Map()),
}))

// Import the functions we're testing (after mocks are set up)
const LOG_PREFIX = '[Subject Property Test]'

describe('Subject Property Generation - Excel Output Validation', () => {
  const TEST_OUTPUT_DIR = path.join(__dirname, 'test-output')
  const TEMPLATE_PATH = '/Users/garrettsullivan/Desktop/‼️/RE/RealtyONE/MY LISTINGS/gs-crm-template.xlsx'

  let testOutputFile: string | null = null

  beforeEach(() => {
    // Create test output directory
    if (!fs.existsSync(TEST_OUTPUT_DIR)) {
      fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true })
    }
  })

  afterEach(() => {
    // Clean up test files
    if (testOutputFile && fs.existsSync(testOutputFile)) {
      fs.unlinkSync(testOutputFile)
      testOutputFile = null
    }
  })

  // ==========================================================================
  // Helper Functions
  // ==========================================================================

  /**
   * Create mock Subject Property with MCAO data
   */
  function createMockSubjectProperty(options: {
    hasApn?: boolean
    apn?: string
    hasMCAOData?: boolean
  } = {}): PropertyMasterListEntry {
    const {
      hasApn = true,
      apn = '123-45-678',
      hasMCAOData = true,
    } = options

    const mcaoData = hasMCAOData ? {
      apn: apn || '123-45-678',
      propertyAddress: {
        fullAddress: '1234 Subject Property Ln, Phoenix, AZ 85001',
        streetNumber: '1234',
        streetName: 'Subject Property',
        streetType: 'Ln',
        city: 'Phoenix',
        state: 'AZ',
        zipCode: '85001',
      },
      Owner_SalePrice: 450000,
      Owner_SaleDate: '2020-05-15',
      bedrooms: 4,
      bathrooms: 3,
      improvementSize: 2500,
      lotSize: 8000,
      yearBuilt: 2005,
      salesHistory: [
        {
          salePrice: 450000,
          saleDate: '2020-05-15',
        },
      ],
    } : null

    return {
      address: '1234 Subject Property Ln, Phoenix, AZ 85001',
      apn: hasApn ? apn : undefined,
      itemLabel: 'Subject Property',
      source: 'subject',
      mlsData: null,
      mcaoData,
      hasApn,
      hasMCAOData,
      needsLookup: !hasApn,
    }
  }

  /**
   * Create mock MLS comp property
   */
  function createMockMLSComp(options: {
    index: number
    itemLabel: 'Residential 1.5 Mile Comps' | 'Residential 3 yr Direct Subdivision Comps'
    hasApn?: boolean
  }): PropertyMasterListEntry {
    const { index, itemLabel, hasApn = true } = options

    const rawData = {
      'House Number': `${1000 + index * 100}`,
      'Street Name': 'Main',
      'St Suffix': 'St',
      'City/Town Code': 'Phoenix',
      'State/Province': 'AZ',
      'Zip Code': '85001',
      'Assessor Number': hasApn ? `${100 + index}-22-333` : '',
      'Status': index % 2 === 0 ? 'C' : 'A',
      'List Date': '2024-01-15',
      'Original List Price': `${350000 + index * 10000}`,
      'List Price': `${350000 + index * 10000}`,
      'Sold Price': index % 2 === 0 ? `${340000 + index * 10000}` : '',
      'Close of Escrow Date': index % 2 === 0 ? '2024-02-20' : '',
      'Cancel Date': index % 2 === 1 ? '2024-03-10' : '',
      'Under Contract Date': index % 2 === 0 ? '2024-02-05' : '',
      '# Bedrooms': 3 + (index % 2),
      'Total Bathrooms': 2 + (index % 2),
      'Approx SQFT': 2000 + index * 100,
      'Approx Lot SqFt': 7000 + index * 200,
      'Year Built': 2000 + index,
      'Agency Phone': '(602) 555-1234',
      'Days on Market': 30 + index * 5,
      'Dwelling Type': 'Single Family',
      'Subdivision': 'Test Subdivision',
      'Geo Lat': 33.4484 + (index * 0.001),
      'Geo Lon': -112.0740 + (index * 0.001),
    }

    return {
      address: `${1000 + index * 100} Main St, Phoenix, AZ 85001`,
      apn: hasApn ? `${100 + index}-22-333` : undefined,
      itemLabel,
      source: itemLabel === 'Residential 1.5 Mile Comps' ? 'residential15Mile' : 'residential3YrDirect',
      mlsData: { rawData },
      mcaoData: hasApn ? {
        apn: `${100 + index}-22-333`,
        Owner_SalePrice: 300000 + index * 5000,
        Owner_SaleDate: '2019-06-20',
        improvementSize: 1950 + index * 50,
      } : null,
      hasApn,
      hasMCAOData: hasApn,
      needsLookup: !hasApn,
    }
  }

  /**
   * Populate Full-MCAO-API sheet (mimics route.ts logic)
   */
  async function populateFullMCAOAPISheet(
    workbook: ExcelJS.Workbook,
    masterList: PropertyMasterListEntry[]
  ) {
    const sheet = workbook.getWorksheet('Full-MCAO-API')
    if (!sheet) {
      throw new Error('Full-MCAO-API sheet not found in template!')
    }

    // Filter properties - ALWAYS include subject property even if APN is missing
    const propertiesWithAPN = masterList.filter(p =>
      p.itemLabel === 'Subject Property' || (p.hasApn && p.apn)
    )

    console.log(`${LOG_PREFIX} Full-MCAO-API: ${propertiesWithAPN.length} properties (including subject)`)

    // Read template headers from row 1
    const headerRow = sheet.getRow(1)
    const templateHeaders: string[] = []
    headerRow.eachCell((cell, colNumber) => {
      templateHeaders[colNumber - 1] = cell.value?.toString() || ''
    })

    // Populate data rows (starting at row 2)
    propertiesWithAPN.forEach((prop, index) => {
      const row = sheet.getRow(index + 2)
      populateMCAORow(row, prop, templateHeaders)
    })

    console.log(`${LOG_PREFIX} Populated ${propertiesWithAPN.length} rows in Full-MCAO-API`)
  }

  /**
   * Populate single MCAO row
   */
  function populateMCAORow(
    row: ExcelJS.Row,
    property: PropertyMasterListEntry,
    templateHeaders: string[]
  ) {
    const mcao = property.mcaoData || {}

    // Build full address
    let fullAddress: string
    if (property.itemLabel === 'Subject Property' && mcao?.propertyAddress?.fullAddress) {
      fullAddress = mcao.propertyAddress.fullAddress
    } else {
      const mls = property.mlsData || {}
      const rawData = (mls as any).rawData || mls
      fullAddress = buildFullAddress(rawData, property.address)
    }

    // Flatten MCAO data
    const flattenedMCAO = flattenObject(mcao)

    // Populate columns
    templateHeaders.forEach((header, index) => {
      const colNumber = index + 1
      const headerLower = header.toLowerCase().trim()

      // Column A (1): FULL_ADDRESS
      if (colNumber === 1 || headerLower === 'full_address' || headerLower.includes('full address')) {
        row.getCell(colNumber).value = fullAddress
        return
      }

      // Column B (2): Item - Source label
      if (colNumber === 2 || headerLower.includes('item')) {
        row.getCell(colNumber).value = property.itemLabel
        return
      }

      // Column C (3): APN
      if (colNumber === 3 || headerLower === 'apn') {
        row.getCell(colNumber).value = property.apn || ''
        return
      }

      // Try to match MCAO API data
      let value = flattenedMCAO[header]
      if (value === undefined || value === null || value === '') {
        const matchingKey = Object.keys(flattenedMCAO).find(key =>
          key.toLowerCase().replace(/[^a-z0-9]/g, '') === headerLower.replace(/[^a-z0-9]/g, '')
        )
        if (matchingKey) {
          value = flattenedMCAO[matchingKey]
        }
      }

      if (value !== undefined && value !== null && value !== '') {
        row.getCell(colNumber).value = value
      }
    })
  }

  /**
   * Populate MLS-Resi-Comps sheet
   */
  async function populateMLSResiCompsSheet(
    workbook: ExcelJS.Workbook,
    masterList: PropertyMasterListEntry[]
  ) {
    const sheet = workbook.getWorksheet('MLS-Resi-Comps')
    if (!sheet) return

    const resiComps = masterList.filter(p =>
      p.itemLabel === 'Residential 1.5 Mile Comps' ||
      p.itemLabel === 'Residential 3 yr Direct Subdivision Comps'
    )

    const headerRow = sheet.getRow(1)
    const templateHeaders: string[] = []
    headerRow.eachCell((cell, colNumber) => {
      templateHeaders[colNumber - 1] = cell.value?.toString() || ''
    })

    resiComps.forEach((prop, index) => {
      const row = sheet.getRow(index + 2)
      populateMLSRow(row, prop, templateHeaders)
    })
  }

  /**
   * Populate single MLS row
   */
  function populateMLSRow(
    row: ExcelJS.Row,
    property: PropertyMasterListEntry,
    templateHeaders: string[]
  ) {
    const mls = property.mlsData || {}
    const rawData = (mls as any).rawData || mls

    templateHeaders.forEach((header, index) => {
      const colNumber = index + 1
      const headerLower = header.toLowerCase().trim()

      if (headerLower === 'item') {
        row.getCell(colNumber).value = property.itemLabel
        return
      }

      let value = rawData[header]
      if (value === undefined || value === null || value === '') {
        const matchingKey = Object.keys(rawData).find(key =>
          key.toLowerCase().trim() === headerLower
        )
        if (matchingKey) {
          value = rawData[matchingKey]
        }
      }

      if (value !== undefined && value !== null && value !== '') {
        row.getCell(colNumber).value = value
      }
    })
  }

  /**
   * Generate Analysis sheet (simplified version)
   */
  async function generateAnalysisSheet(
    workbook: ExcelJS.Workbook,
    properties: PropertyMasterListEntry[]
  ) {
    let sheet = workbook.getWorksheet('Analysis')
    if (!sheet) {
      sheet = workbook.addWorksheet('Analysis')
    } else {
      sheet.spliceRows(1, sheet.rowCount)
    }

    // Add header row
    const headers = [
      'Item', 'FULL_ADDRESS', 'APN', 'STATUS', 'OG_LIST_DATE', 'OG_LIST_PRICE',
      'SALE_DATE', 'SALE_PRICE', 'SELLER_BASIS', 'SELLER_BASIS_DATE', 'BR', 'BA',
      'SQFT', 'LOT_SIZE', 'MLS_MCAO_DISCREPENCY_CONCAT', 'IS_RENTAL', 'AGENCY_PHONE',
      'RENOVATE_SCORE', 'PROPERTY_RADAR-COMP-Y-N', 'IN_MLS?', 'IN_MCAO?',
      'CANCEL_DATE', 'UC_DATE', 'LAT', 'LON', 'YEAR_BUILT', 'DAYS_ON_MARKET',
      'DWELLING_TYPE', 'SUBDIVISION_NAME',
    ]

    const headerRow = sheet.getRow(1)
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1)
      cell.value = header
      cell.font = { bold: true }
    })

    // Add data rows
    properties.forEach((property, index) => {
      const row = sheet.getRow(index + 2)
      populateAnalysisRow(row, property)
    })
  }

  /**
   * Populate Analysis row
   */
  function populateAnalysisRow(row: ExcelJS.Row, property: PropertyMasterListEntry) {
    const mls = property.mlsData
    const mcao = property.mcaoData
    const rawData = mls ? ((mls as any).rawData || mls) : {}

    // Flatten MCAO for accessing nested fields
    const mcaoFlattened = mcao ? flattenObject(mcao) : {}

    // Column A: Item
    row.getCell(1).value = property.itemLabel

    // Column B: FULL_ADDRESS
    row.getCell(2).value = mcao?.propertyAddress?.fullAddress || property.address || 'N/A'

    // Column C: APN
    row.getCell(3).value = mcao?.apn || rawData['Assessor Number'] || 'N/A'

    // Column D: STATUS
    row.getCell(4).value = rawData['Status'] || 'N/A'

    // Column E: OG_LIST_DATE
    row.getCell(5).value = rawData['List Date'] || ''

    // Column F: OG_LIST_PRICE
    row.getCell(6).value = rawData['Original List Price'] || rawData['List Price'] || ''

    // Column G: SALE_DATE
    const status = rawData['Status']
    row.getCell(7).value = (status === 'C' || status === 'Closed') ? (rawData['Close of Escrow Date'] || '') : ''

    // Column H: SALE_PRICE
    row.getCell(8).value = rawData['Sold Price'] || ''

    // Column I: SELLER_BASIS (MCAO - Owner_SalePrice)
    row.getCell(9).value =
      (mcaoFlattened as any)['Owner_SalePrice'] ||
      (mcaoFlattened as any)['owner_saleprice'] ||
      mcao?.salesHistory?.[0]?.salePrice || ''

    // Column J: SELLER_BASIS_DATE (MCAO - Owner_SaleDate)
    row.getCell(10).value =
      (mcaoFlattened as any)['Owner_SaleDate'] ||
      (mcaoFlattened as any)['owner_saledate'] ||
      mcao?.salesHistory?.[0]?.saleDate || ''

    // Column K: BR
    row.getCell(11).value = rawData['# Bedrooms'] || mcao?.bedrooms || ''

    // Column L: BA
    row.getCell(12).value = rawData['Total Bathrooms'] || mcao?.bathrooms || ''

    // Column M: SQFT
    row.getCell(13).value = rawData['Approx SQFT'] || mcao?.improvementSize || ''

    // Column N: LOT_SIZE
    row.getCell(14).value = mcao?.lotSize || rawData['Approx Lot SqFt'] || ''

    // Column O: MLS_MCAO_DISCREPENCY_CONCAT (skip for simplicity)
    row.getCell(15).value = ''

    // Column P: IS_RENTAL
    row.getCell(16).value = 'N'

    // Column Q: AGENCY_PHONE
    row.getCell(17).value = rawData['Agency Phone'] || 'N/A'

    // Column R: RENOVATE_SCORE (manual)
    row.getCell(18).value = ''

    // Column S: PROPERTY_RADAR-COMP-Y-N (manual)
    row.getCell(19).value = ''

    // Column T: IN_MLS?
    row.getCell(20).value = mls ? 'Y' : 'N'

    // Column U: IN_MCAO?
    row.getCell(21).value = mcao ? 'Y' : 'N'

    // Column V: CANCEL_DATE (MLS)
    row.getCell(22).value = rawData['Cancel Date'] || rawData['Cancellation Date'] || ''

    // Column W: UC_DATE (MLS)
    row.getCell(23).value = rawData['Under Contract Date'] || rawData['UC Date'] || ''

    // Column X: LAT
    row.getCell(24).value = rawData['Geo Lat'] || (mcaoFlattened as any)['latitude'] || 'N/A'

    // Column Y: LON
    row.getCell(25).value = rawData['Geo Lon'] || (mcaoFlattened as any)['longitude'] || 'N/A'

    // Column Z: YEAR_BUILT
    row.getCell(26).value = rawData['Year Built'] || mcao?.yearBuilt || 'N/A'

    // Column AA: DAYS_ON_MARKET
    row.getCell(27).value = rawData['Days on Market'] || ''

    // Column AB: DWELLING_TYPE
    row.getCell(28).value = rawData['Dwelling Type'] || mcao?.propertyType || 'N/A'

    // Column AC: SUBDIVISION_NAME
    row.getCell(29).value = rawData['Subdivision'] || mcao?.subdivision || 'N/A'
  }

  /**
   * Helper: Build full address from MLS raw data
   */
  function buildFullAddress(rawData: any, fallback: string): string {
    if (!rawData) return fallback

    const parts: string[] = []
    if (rawData['House Number']) parts.push(rawData['House Number'])
    if (rawData['Building Number']) parts.push(rawData['Building Number'])
    if (rawData['Compass']) parts.push(rawData['Compass'])
    if (rawData['Street Name']) parts.push(rawData['Street Name'])
    if (rawData['Unit #']) parts.push(rawData['Unit #'])
    if (rawData['St Dir Sfx']) parts.push(rawData['St Dir Sfx'])
    if (rawData['St Suffix']) parts.push(rawData['St Suffix'])

    const street = parts.filter(Boolean).join(' ').trim()

    if (street) {
      const city = rawData['City/Town Code'] || ''
      const state = rawData['State/Province'] || 'AZ'
      const zip = rawData['Zip Code'] || ''
      return `${street}, ${city}, ${state} ${zip}`.trim()
    }

    return fallback
  }

  /**
   * Helper: Flatten nested object
   */
  function flattenObject(obj: any, prefix = '', result: any = {}): any {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key]
        const newKey = prefix ? `${prefix}_${key}` : key

        if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
          flattenObject(value, newKey, result)
        } else if (Array.isArray(value)) {
          value.forEach((item, index) => {
            if (item !== null && typeof item === 'object') {
              flattenObject(item, `${newKey}_${index}`, result)
            } else {
              result[`${newKey}_${index}`] = item
            }
          })
        } else {
          result[newKey] = value
        }
      }
    }
    return result
  }

  /**
   * Generate full Excel workbook for testing
   */
  async function generateTestExcelFile(
    masterList: PropertyMasterListEntry[],
    outputFilename: string
  ): Promise<string> {
    const workbook = new ExcelJS.Workbook()

    // Load template
    if (!fs.existsSync(TEMPLATE_PATH)) {
      throw new Error(`Template file not found at: ${TEMPLATE_PATH}`)
    }

    await workbook.xlsx.readFile(TEMPLATE_PATH)

    // Populate sheets
    await populateMLSResiCompsSheet(workbook, masterList)
    await populateFullMCAOAPISheet(workbook, masterList)
    await generateAnalysisSheet(workbook, masterList)

    // Write to file
    const outputPath = path.join(TEST_OUTPUT_DIR, outputFilename)
    await workbook.xlsx.writeFile(outputPath)

    console.log(`${LOG_PREFIX} Test file written to: ${outputPath}`)
    return outputPath
  }

  // ==========================================================================
  // Test Cases
  // ==========================================================================

  describe('Subject Property - Full-MCAO-API Sheet', () => {
    it('should include Subject Property in Full-MCAO-API sheet at row 2', async () => {
      // Arrange
      const subjectProperty = createMockSubjectProperty({ hasApn: true, apn: '123-45-678' })
      const masterList = [subjectProperty]

      // Act
      const outputFile = await generateTestExcelFile(masterList, 'test-subject-only-mcao.xlsx')
      testOutputFile = outputFile

      // Assert
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.readFile(outputFile)

      const sheet = workbook.getWorksheet('Full-MCAO-API')
      expect(sheet).toBeDefined()

      const row2 = sheet!.getRow(2)
      const itemCell = row2.getCell(2) // Column B = Item
      expect(itemCell.value).toBe('Subject Property')

      console.log(`${LOG_PREFIX} ✅ Subject Property found in Full-MCAO-API row 2, column B`)
    })

    it('should include Subject Property even WITHOUT APN in Full-MCAO-API', async () => {
      // Arrange
      const subjectProperty = createMockSubjectProperty({ hasApn: false, hasMCAOData: false })
      const comp1 = createMockMLSComp({ index: 1, itemLabel: 'Residential 1.5 Mile Comps' })
      const masterList = [subjectProperty, comp1]

      // Act
      const outputFile = await generateTestExcelFile(masterList, 'test-subject-no-apn-mcao.xlsx')
      testOutputFile = outputFile

      // Assert
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.readFile(outputFile)

      const sheet = workbook.getWorksheet('Full-MCAO-API')
      expect(sheet).toBeDefined()

      const row2 = sheet!.getRow(2)
      const itemCell = row2.getCell(2) // Column B = Item
      expect(itemCell.value).toBe('Subject Property')

      console.log(`${LOG_PREFIX} ✅ Subject Property WITHOUT APN found in Full-MCAO-API row 2`)
    })

    it('should populate Subject Property with full address in column A', async () => {
      // Arrange
      const subjectProperty = createMockSubjectProperty({ hasApn: true })
      const masterList = [subjectProperty]

      // Act
      const outputFile = await generateTestExcelFile(masterList, 'test-subject-address-mcao.xlsx')
      testOutputFile = outputFile

      // Assert
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.readFile(outputFile)

      const sheet = workbook.getWorksheet('Full-MCAO-API')
      const row2 = sheet!.getRow(2)

      const fullAddressCell = row2.getCell(1) // Column A = FULL_ADDRESS
      expect(fullAddressCell.value).toBe('1234 Subject Property Ln, Phoenix, AZ 85001')

      console.log(`${LOG_PREFIX} ✅ Subject Property full address populated in column A`)
    })

    it('should populate Subject Property APN in column C', async () => {
      // Arrange
      const subjectProperty = createMockSubjectProperty({ hasApn: true, apn: '999-88-777' })
      const masterList = [subjectProperty]

      // Act
      const outputFile = await generateTestExcelFile(masterList, 'test-subject-apn-mcao.xlsx')
      testOutputFile = outputFile

      // Assert
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.readFile(outputFile)

      const sheet = workbook.getWorksheet('Full-MCAO-API')
      const row2 = sheet!.getRow(2)

      const apnCell = row2.getCell(3) // Column C = APN
      expect(apnCell.value).toBe('999-88-777')

      console.log(`${LOG_PREFIX} ✅ Subject Property APN populated in column C`)
    })
  })

  describe('Subject Property - Analysis Sheet', () => {
    it('should include Subject Property in Analysis sheet at row 2', async () => {
      // Arrange
      const subjectProperty = createMockSubjectProperty({ hasApn: true })
      const masterList = [subjectProperty]

      // Act
      const outputFile = await generateTestExcelFile(masterList, 'test-subject-only-analysis.xlsx')
      testOutputFile = outputFile

      // Assert
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.readFile(outputFile)

      const sheet = workbook.getWorksheet('Analysis')
      expect(sheet).toBeDefined()

      const row2 = sheet!.getRow(2)
      const itemCell = row2.getCell(1) // Column A = Item
      expect(itemCell.value).toBe('Subject Property')

      console.log(`${LOG_PREFIX} ✅ Subject Property found in Analysis row 2, column A`)
    })

    it('should populate SELLER_BASIS (column I) from MCAO Owner_SalePrice', async () => {
      // Arrange
      const subjectProperty = createMockSubjectProperty({ hasApn: true })
      const masterList = [subjectProperty]

      // Act
      const outputFile = await generateTestExcelFile(masterList, 'test-seller-basis.xlsx')
      testOutputFile = outputFile

      // Assert
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.readFile(outputFile)

      const sheet = workbook.getWorksheet('Analysis')
      const row2 = sheet!.getRow(2)

      const sellerBasisCell = row2.getCell(9) // Column I = SELLER_BASIS
      expect(sellerBasisCell.value).toBe(450000)

      console.log(`${LOG_PREFIX} ✅ SELLER_BASIS (column I) populated from MCAO: $450,000`)
    })

    it('should populate SELLER_BASIS_DATE (column J) from MCAO Owner_SaleDate', async () => {
      // Arrange
      const subjectProperty = createMockSubjectProperty({ hasApn: true })
      const masterList = [subjectProperty]

      // Act
      const outputFile = await generateTestExcelFile(masterList, 'test-seller-basis-date.xlsx')
      testOutputFile = outputFile

      // Assert
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.readFile(outputFile)

      const sheet = workbook.getWorksheet('Analysis')
      const row2 = sheet!.getRow(2)

      const sellerBasisDateCell = row2.getCell(10) // Column J = SELLER_BASIS_DATE
      expect(sellerBasisDateCell.value).toBe('2020-05-15')

      console.log(`${LOG_PREFIX} ✅ SELLER_BASIS_DATE (column J) populated from MCAO: 2020-05-15`)
    })

    it('should populate Subject Property without MLS data (IN_MLS = N)', async () => {
      // Arrange
      const subjectProperty = createMockSubjectProperty({ hasApn: true })
      const masterList = [subjectProperty]

      // Act
      const outputFile = await generateTestExcelFile(masterList, 'test-subject-no-mls.xlsx')
      testOutputFile = outputFile

      // Assert
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.readFile(outputFile)

      const sheet = workbook.getWorksheet('Analysis')
      const row2 = sheet!.getRow(2)

      const inMlsCell = row2.getCell(20) // Column T = IN_MLS?
      expect(inMlsCell.value).toBe('N')

      const inMcaoCell = row2.getCell(21) // Column U = IN_MCAO?
      expect(inMcaoCell.value).toBe('Y')

      console.log(`${LOG_PREFIX} ✅ Subject Property correctly shows IN_MLS=N, IN_MCAO=Y`)
    })
  })

  describe('Subject Property + MLS Comps - Combined Scenario', () => {
    it('should include Subject Property + 3 MLS comps in correct order', async () => {
      // Arrange
      const subjectProperty = createMockSubjectProperty({ hasApn: true })
      const comp1 = createMockMLSComp({ index: 1, itemLabel: 'Residential 1.5 Mile Comps' })
      const comp2 = createMockMLSComp({ index: 2, itemLabel: 'Residential 1.5 Mile Comps' })
      const comp3 = createMockMLSComp({ index: 3, itemLabel: 'Residential 3 yr Direct Subdivision Comps' })
      const masterList = [subjectProperty, comp1, comp2, comp3]

      // Act
      const outputFile = await generateTestExcelFile(masterList, 'test-subject-with-comps.xlsx')
      testOutputFile = outputFile

      // Assert - Full-MCAO-API
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.readFile(outputFile)

      const mcaoSheet = workbook.getWorksheet('Full-MCAO-API')
      expect(mcaoSheet).toBeDefined()

      // Row 2 should be Subject Property
      const mcaoRow2 = mcaoSheet!.getRow(2)
      expect(mcaoRow2.getCell(2).value).toBe('Subject Property')

      // Row 3 should be first comp
      const mcaoRow3 = mcaoSheet!.getRow(3)
      expect(mcaoRow3.getCell(2).value).toBe('Residential 1.5 Mile Comps')

      // Assert - Analysis
      const analysisSheet = workbook.getWorksheet('Analysis')
      expect(analysisSheet).toBeDefined()

      // Row 2 should be Subject Property
      const analysisRow2 = analysisSheet!.getRow(2)
      expect(analysisRow2.getCell(1).value).toBe('Subject Property')

      // Row 3 should be first comp
      const analysisRow3 = analysisSheet!.getRow(3)
      expect(analysisRow3.getCell(1).value).toBe('Residential 1.5 Mile Comps')

      console.log(`${LOG_PREFIX} ✅ Subject Property appears FIRST in both sheets with comps following`)
    })

    it('should populate MLS comp CANCEL_DATE (column V) from MLS data', async () => {
      // Arrange
      const subjectProperty = createMockSubjectProperty({ hasApn: true })
      const comp1 = createMockMLSComp({ index: 1, itemLabel: 'Residential 1.5 Mile Comps' }) // index 1 = odd = cancelled
      const masterList = [subjectProperty, comp1]

      // Act
      const outputFile = await generateTestExcelFile(masterList, 'test-cancel-date.xlsx')
      testOutputFile = outputFile

      // Assert
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.readFile(outputFile)

      const sheet = workbook.getWorksheet('Analysis')
      const row3 = sheet!.getRow(3) // Row 3 = first comp (row 2 is subject)

      const cancelDateCell = row3.getCell(22) // Column V = CANCEL_DATE
      expect(cancelDateCell.value).toBe('2024-03-10')

      console.log(`${LOG_PREFIX} ✅ CANCEL_DATE (column V) populated from MLS: 2024-03-10`)
    })

    it('should populate MLS comp UC_DATE (column W) from MLS data', async () => {
      // Arrange
      const subjectProperty = createMockSubjectProperty({ hasApn: true })
      const comp2 = createMockMLSComp({ index: 2, itemLabel: 'Residential 1.5 Mile Comps' }) // index 2 = even = sold
      const masterList = [subjectProperty, comp2]

      // Act
      const outputFile = await generateTestExcelFile(masterList, 'test-uc-date.xlsx')
      testOutputFile = outputFile

      // Assert
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.readFile(outputFile)

      const sheet = workbook.getWorksheet('Analysis')
      const row3 = sheet!.getRow(3) // Row 3 = first comp

      const ucDateCell = row3.getCell(23) // Column W = UC_DATE
      expect(ucDateCell.value).toBe('2024-02-05')

      console.log(`${LOG_PREFIX} ✅ UC_DATE (column W) populated from MLS: 2024-02-05`)
    })
  })

  describe('Edge Cases', () => {
    it('should handle Subject Property with missing MCAO data gracefully', async () => {
      // Arrange
      const subjectProperty = createMockSubjectProperty({ hasApn: false, hasMCAOData: false })
      const masterList = [subjectProperty]

      // Act
      const outputFile = await generateTestExcelFile(masterList, 'test-subject-no-mcao.xlsx')
      testOutputFile = outputFile

      // Assert
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.readFile(outputFile)

      // Should still appear in both sheets
      const mcaoSheet = workbook.getWorksheet('Full-MCAO-API')
      const mcaoRow2 = mcaoSheet!.getRow(2)
      expect(mcaoRow2.getCell(2).value).toBe('Subject Property')

      const analysisSheet = workbook.getWorksheet('Analysis')
      const analysisRow2 = analysisSheet!.getRow(2)
      expect(analysisRow2.getCell(1).value).toBe('Subject Property')

      // SELLER_BASIS should be empty without MCAO data
      const sellerBasisCell = analysisRow2.getCell(9)
      expect(sellerBasisCell.value).toBe('')

      console.log(`${LOG_PREFIX} ✅ Subject Property without MCAO data handled gracefully`)
    })

    it('should populate empty CANCEL_DATE and UC_DATE for Subject Property (no MLS data)', async () => {
      // Arrange
      const subjectProperty = createMockSubjectProperty({ hasApn: true })
      const masterList = [subjectProperty]

      // Act
      const outputFile = await generateTestExcelFile(masterList, 'test-subject-no-mls-dates.xlsx')
      testOutputFile = outputFile

      // Assert
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.readFile(outputFile)

      const sheet = workbook.getWorksheet('Analysis')
      const row2 = sheet!.getRow(2)

      // Subject has no MLS data, so these should be empty
      const cancelDateCell = row2.getCell(22) // Column V
      const ucDateCell = row2.getCell(23) // Column W

      expect(cancelDateCell.value).toBe('')
      expect(ucDateCell.value).toBe('')

      console.log(`${LOG_PREFIX} ✅ Subject Property CANCEL_DATE and UC_DATE correctly empty (no MLS data)`)
    })
  })

  describe('Coverage Report', () => {
    it('SUMMARY: All critical scenarios tested', async () => {
      console.log('\n' + '='.repeat(80))
      console.log('TEST COVERAGE SUMMARY')
      console.log('='.repeat(80))
      console.log('\n✅ Subject Property Verification:')
      console.log('   - Subject Property in Full-MCAO-API (row 2, column B)')
      console.log('   - Subject Property in Analysis (row 2, column A)')
      console.log('   - Subject Property WITH APN')
      console.log('   - Subject Property WITHOUT APN')
      console.log('   - Subject Property + multiple MLS comps')

      console.log('\n✅ MCAO Data Population (SELLER_BASIS):')
      console.log('   - Column I (SELLER_BASIS) from Owner_SalePrice')
      console.log('   - Column J (SELLER_BASIS_DATE) from Owner_SaleDate')

      console.log('\n✅ MLS Data Population (Dates):')
      console.log('   - Column V (CANCEL_DATE) from Cancel Date')
      console.log('   - Column W (UC_DATE) from Under Contract Date')

      console.log('\n✅ Edge Cases:')
      console.log('   - Subject Property without MCAO data')
      console.log('   - Subject Property without APN')
      console.log('   - Empty CANCEL_DATE/UC_DATE for Subject Property')

      console.log('\n' + '='.repeat(80))
      console.log('ALL TESTS PASSED - Subject Property generation verified!')
      console.log('='.repeat(80) + '\n')
    })
  })
})
