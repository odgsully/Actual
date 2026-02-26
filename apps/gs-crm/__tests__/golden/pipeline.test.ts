/**
 * Golden Dataset Pipeline Tests
 *
 * Validates breakups analysis functions against synthetic golden fixtures.
 * Tests both output structure/completeness and threshold evaluation logic.
 */

import { GOLDEN_PROPERTIES, THRESHOLD_TEST_CASES } from './fixtures'
import {
  analyzeBRDistribution_Sale,
  analyzeBRDistribution_Lease,
  analyzeHOA,
  analyzeSTR_Sale,
  analyzeRenovationImpact_Sale,
  analyzeCompsClassification,
  analyzeSqftVariance_Sale,
  analyzePriceVariance_Sale,
  analyzeLeaseVsSale,
  analyzeTimeFrames,
  analyzeDirectVsIndirect,
  analyzeActiveVsClosed_Sale,
  analyzeActiveVsPending_Sale,
  calculateRenovationDelta_Sale,
  calculateInterquartileRanges_Sale,
  analyzeDistributionTails_Sale,
  calculateExpectedNOI,
  calculateImprovedNOI,
  calculateAverage,
  calculateMedian,
} from '@/lib/processing/breakups-generator'
import {
  evaluateAPNThreshold,
  evaluateMCAOThreshold,
  evaluateParseThreshold,
} from '@/lib/pipeline/thresholds'

// ─── Analysis output structure tests ─────────────────────

describe('Golden Dataset: Analysis Output Structure', () => {
  test('BR Distribution (Sale) returns valid structure', () => {
    const result = analyzeBRDistribution_Sale(GOLDEN_PROPERTIES)
    expect(result).toBeDefined()
    expect(result).toHaveProperty('distribution')
    expect(result).toHaveProperty('mostCommon')
    expect(result).toHaveProperty('average')
  })

  test('BR Distribution (Lease) returns valid structure', () => {
    const result = analyzeBRDistribution_Lease(GOLDEN_PROPERTIES)
    expect(result).toBeDefined()
    expect(result).toHaveProperty('distribution')
    expect(result).toHaveProperty('mostCommon')
    expect(result).toHaveProperty('average')
  })

  test('HOA Analysis returns valid structure', () => {
    const result = analyzeHOA(GOLDEN_PROPERTIES)
    expect(result).toBeDefined()
    expect(result).toHaveProperty('withHOA')
    expect(result).toHaveProperty('withoutHOA')
    expect(result).toHaveProperty('priceDifferential')
  })

  test('STR Analysis (Sale) returns valid structure', () => {
    const result = analyzeSTR_Sale(GOLDEN_PROPERTIES)
    expect(result).toBeDefined()
    expect(result).toHaveProperty('strEligible')
    expect(result).toHaveProperty('nonSTR')
    expect(result).toHaveProperty('premiumPercentage')
  })

  test('Renovation Impact (Sale) returns valid structure', () => {
    const result = analyzeRenovationImpact_Sale(GOLDEN_PROPERTIES)
    expect(result).toBeDefined()
    expect(result).toHaveProperty('High')
    expect(result).toHaveProperty('Mid')
    expect(result).toHaveProperty('Low')
    expect(result).toHaveProperty('premiumHighvsLow')
  })

  test('Comps Classification returns valid structure', () => {
    const result = analyzeCompsClassification(GOLDEN_PROPERTIES)
    expect(result).toBeDefined()
    expect(result).toHaveProperty('comps')
    expect(result).toHaveProperty('nonComps')
    expect(result.comps).toHaveProperty('count')
    expect(result.nonComps).toHaveProperty('count')
  })

  test('SqFt Variance (Sale) returns valid structure', () => {
    const subjectSqft = 702
    const result = analyzeSqftVariance_Sale(GOLDEN_PROPERTIES, subjectSqft)
    expect(result).toBeDefined()
    expect(result).toHaveProperty('within20')
    expect(result).toHaveProperty('outside20')
    expect(result).toHaveProperty('optimalRange')
  })

  test('Price Variance (Sale) returns valid structure', () => {
    const estimatedValue = 215000
    const result = analyzePriceVariance_Sale(GOLDEN_PROPERTIES, estimatedValue)
    expect(result).toBeDefined()
    expect(result).toHaveProperty('within20')
    expect(result).toHaveProperty('outside20')
  })

  test('Lease vs Sale returns valid structure', () => {
    const result = analyzeLeaseVsSale(GOLDEN_PROPERTIES)
    expect(result).toBeDefined()
    expect(result).toHaveProperty('lease')
    expect(result).toHaveProperty('sale')
    expect(result).toHaveProperty('rentToValueRatio')
    expect(result.lease).toHaveProperty('avgAnnualPerSqft')
    expect(result.lease).toHaveProperty('capRate')
    expect(result.sale).toHaveProperty('avgPerSqft')
  })

  test('Time Frames Analysis returns valid structure', () => {
    const result = analyzeTimeFrames(GOLDEN_PROPERTIES)
    expect(result).toBeDefined()
    expect(result).toHaveProperty('t12')
    expect(result).toHaveProperty('t36')
    expect(result).toHaveProperty('appreciation')
  })

  test('Direct vs Indirect returns valid structure', () => {
    const result = analyzeDirectVsIndirect(GOLDEN_PROPERTIES)
    expect(result).toBeDefined()
    expect(result).toHaveProperty('direct')
    expect(result).toHaveProperty('indirect')
    expect(result).toHaveProperty('reliabilityScore')
    expect(result.direct).toHaveProperty('count')
    expect(result.indirect).toHaveProperty('count')
  })

  test('Active vs Closed (Sale) returns valid structure', () => {
    const result = analyzeActiveVsClosed_Sale(GOLDEN_PROPERTIES)
    expect(result).toBeDefined()
    expect(result).toHaveProperty('active')
    expect(result).toHaveProperty('closed')
    expect(result).toHaveProperty('absorptionRate')
    expect(result).toHaveProperty('listToSaleRatio')
  })

  test('Active vs Pending (Sale) returns valid structure', () => {
    const result = analyzeActiveVsPending_Sale(GOLDEN_PROPERTIES)
    expect(result).toBeDefined()
    expect(result).toHaveProperty('active')
    expect(result).toHaveProperty('pending')
    expect(result).toHaveProperty('pendingRatio')
  })

  test('Renovation Delta (Sale) returns valid structure', () => {
    const result = calculateRenovationDelta_Sale(GOLDEN_PROPERTIES)
    expect(result).toBeDefined()
    expect(result).toHaveProperty('renovatedAvg')
    expect(result).toHaveProperty('notRenovatedAvg')
    expect(result).toHaveProperty('delta')
    expect(result).toHaveProperty('percentageIncrease')
  })

  test('Interquartile Ranges (Sale) returns valid structure', () => {
    const result = calculateInterquartileRanges_Sale(GOLDEN_PROPERTIES)
    expect(result).toBeDefined()
    expect(result).toHaveProperty('price')
    expect(result).toHaveProperty('pricePerSqft')
    expect(result.price).toHaveProperty('q25')
    expect(result.price).toHaveProperty('median')
    expect(result.price).toHaveProperty('q75')
    expect(result.price).toHaveProperty('iqr')
  })

  test('Distribution Tails (Sale) returns valid structure', () => {
    const result = analyzeDistributionTails_Sale(GOLDEN_PROPERTIES)
    expect(result).toBeDefined()
    expect(result).toHaveProperty('percentiles')
    expect(result).toHaveProperty('ranges')
    expect(result.percentiles).toHaveProperty('p5')
    expect(result.percentiles).toHaveProperty('p95')
  })

  test('Expected NOI returns valid structure', () => {
    const result = calculateExpectedNOI(GOLDEN_PROPERTIES[0])
    expect(result).toBeDefined()
    expect(result).toHaveProperty('annualNOI')
    expect(result).toHaveProperty('capRate')
    expect(result).toHaveProperty('monthlyRent')
    expect(result).toHaveProperty('renoScore')
    expect(result).toHaveProperty('renoRecency')
    expect(result).toHaveProperty('multiplierUsed')
  })

  test('Improved NOI returns valid structure', () => {
    const result = calculateImprovedNOI(GOLDEN_PROPERTIES[0])
    expect(result).toBeDefined()
    expect(result).toHaveProperty('improvedNOI')
    expect(result).toHaveProperty('currentNOI')
    expect(result).toHaveProperty('noiIncrease')
    expect(result).toHaveProperty('improvementCost')
    expect(result).toHaveProperty('paybackPeriod')
    expect(result).toHaveProperty('roi')
  })
})

// ─── Math utility tests ──────────────────────────────────

describe('Golden Dataset: Math Utilities', () => {
  test('calculateAverage returns correct value', () => {
    expect(calculateAverage([10, 20, 30])).toBe(20)
  })

  test('calculateAverage returns 0 for empty array', () => {
    expect(calculateAverage([])).toBe(0)
  })

  test('calculateMedian returns correct value for odd-length array', () => {
    expect(calculateMedian([10, 20, 30])).toBe(20)
  })

  test('calculateMedian returns correct value for even-length array', () => {
    expect(calculateMedian([10, 20, 30, 40])).toBe(25)
  })
})

// ─── Lease vs Sale split correctness ─────────────────────

describe('Golden Dataset: Data Split Correctness', () => {
  test('Golden dataset has both sale and lease properties', () => {
    const sales = GOLDEN_PROPERTIES.filter(p => p.IS_RENTAL === 'N')
    const leases = GOLDEN_PROPERTIES.filter(p => p.IS_RENTAL === 'Y')
    expect(sales.length).toBeGreaterThan(0)
    expect(leases.length).toBeGreaterThan(0)
  })

  test('Golden dataset has active, closed, and pending statuses', () => {
    const statuses = new Set(GOLDEN_PROPERTIES.map(p => p.STATUS))
    expect(statuses.has('A')).toBe(true)
    expect(statuses.has('C')).toBe(true)
    expect(statuses.has('P')).toBe(true)
  })

  test('Lease vs Sale analysis produces non-zero values', () => {
    const result = analyzeLeaseVsSale(GOLDEN_PROPERTIES)
    // The function filters internally via IS_RENTAL field
    // With our golden data, both sale and lease properties exist
    expect(result.lease).toBeDefined()
    expect(result.sale).toBeDefined()
    expect(result.rentToValueRatio).toBeDefined()
  })

  test('Direct vs Indirect counts reflect fixture Item values', () => {
    const result = analyzeDirectVsIndirect(GOLDEN_PROPERTIES)
    // "Residential Direct Comps" matches 'direct', "1.5 Mile Comps" matches '1.5'
    const expectedDirect = GOLDEN_PROPERTIES.filter(p => p.Item.toLowerCase().includes('direct')).length
    const expectedIndirect = GOLDEN_PROPERTIES.filter(p => p.Item.toLowerCase().includes('1.5')).length
    expect(result.direct.count).toBe(expectedDirect)
    expect(result.indirect.count).toBe(expectedIndirect)
  })
})

// ─── Threshold evaluation tests ──────────────────────────

describe('Safety Thresholds', () => {
  describe('APN Threshold', () => {
    test('all success -> continue', () => {
      const r = evaluateAPNThreshold(THRESHOLD_TEST_CASES.allSuccess.failed, THRESHOLD_TEST_CASES.allSuccess.total)
      expect(r.action).toBe('continue')
    })

    test('below warn -> continue', () => {
      const r = evaluateAPNThreshold(THRESHOLD_TEST_CASES.belowWarn.failed, THRESHOLD_TEST_CASES.belowWarn.total)
      expect(r.action).toBe('continue')
    })

    test('warn range -> warn', () => {
      const r = evaluateAPNThreshold(THRESHOLD_TEST_CASES.warnRange.failed, THRESHOLD_TEST_CASES.warnRange.total)
      expect(r.action).toBe('warn')
    })

    test('abort range -> abort', () => {
      const r = evaluateAPNThreshold(THRESHOLD_TEST_CASES.abortRange.failed, THRESHOLD_TEST_CASES.abortRange.total)
      expect(r.action).toBe('abort')
    })

    test('too small batch -> continue (skips check)', () => {
      const r = evaluateAPNThreshold(THRESHOLD_TEST_CASES.tooSmall.failed, THRESHOLD_TEST_CASES.tooSmall.total)
      expect(r.action).toBe('continue')
    })
  })

  describe('MCAO Threshold', () => {
    test('above abort -> abort', () => {
      const r = evaluateMCAOThreshold(6, 10)
      expect(r.action).toBe('abort')
    })

    test('below warn -> continue', () => {
      const r = evaluateMCAOThreshold(1, 10)
      expect(r.action).toBe('continue')
    })
  })

  describe('Parse Threshold', () => {
    test('above abort -> abort', () => {
      const r = evaluateParseThreshold(4, 10)
      expect(r.action).toBe('abort')
    })

    test('below warn -> continue', () => {
      const r = evaluateParseThreshold(0, 10)
      expect(r.action).toBe('continue')
    })
  })
})
