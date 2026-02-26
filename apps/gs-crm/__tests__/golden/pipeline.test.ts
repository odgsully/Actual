/**
 * Golden Dataset Pipeline Tests
 *
 * Validates breakups analysis functions against synthetic golden fixtures.
 * Tests both output structure/completeness and threshold evaluation logic.
 */

import { GOLDEN_PROPERTIES, GOLDEN_MLS_ROWS, GOLDEN_SUBJECT, THRESHOLD_TEST_CASES } from './fixtures'
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
import {
  computeMLSMetrics,
  computeBreakupsMetrics,
  enrichMLSBatch,
  enrichBreakupsBatch,
  summarizeMLSMetrics,
} from '@/lib/pipeline/computed-metrics'
import {
  scoreDistance,
  scorePriceSimilarity,
  scoreSqftSimilarity,
  scoreAgeSimilarity,
  scoreBedBathMatch,
  scoreFeatureMatch,
  scoreMLSComp,
  rankMLSComps,
  scoreBreakupsComp,
  rankBreakupsComps,
  DEFAULT_CONFIG,
} from '@/lib/pipeline/comp-scoring'
import {
  estimateMarketRent,
  reconcileNOI,
  reconcileValue,
  reconcileAnalysis,
} from '@/lib/pipeline/reconciled-outputs'
import type { ExpectedNOIResult } from '@/lib/processing/breakups-generator'

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

  test('Direct vs Indirect counts reflect fixture Item values (sale only)', () => {
    const result = analyzeDirectVsIndirect(GOLDEN_PROPERTIES)
    // Function filters to sale properties only (IS_RENTAL !== 'Y') before matching Item labels
    const saleOnly = GOLDEN_PROPERTIES.filter(p => p.IS_RENTAL !== 'Y')
    const expectedDirect = saleOnly.filter(p => p.Item.toLowerCase().includes('direct')).length
    const expectedIndirect = saleOnly.filter(p => p.Item.toLowerCase().includes('1.5')).length
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

// ─── Computed Metrics: MLS Context ──────────────────────────

describe('Computed Metrics: MLS', () => {
  describe('Price per sqft', () => {
    test('sold row 0: salePricePerSqFt = 215000 / 702', () => {
      const m = computeMLSMetrics(GOLDEN_MLS_ROWS[0])
      expect(m.salePricePerSqFt).toBeCloseTo(215000 / 702, 2)
    })

    test('sold row 1: salePricePerSqFt = 385000 / 1100', () => {
      const m = computeMLSMetrics(GOLDEN_MLS_ROWS[1])
      expect(m.salePricePerSqFt).toBeCloseTo(385000 / 1100, 2)
    })

    test('active row (no sale price) -> salePricePerSqFt is null', () => {
      const m = computeMLSMetrics(GOLDEN_MLS_ROWS[2])
      expect(m.salePricePerSqFt).toBeNull()
    })

    test('listPricePerSqFt computed for all rows with listPrice > 0', () => {
      for (const row of GOLDEN_MLS_ROWS) {
        const m = computeMLSMetrics(row)
        if (row.listPrice > 0 && row.squareFeet > 0) {
          expect(m.listPricePerSqFt).toBeCloseTo(row.listPrice / row.squareFeet, 2)
        }
      }
    })

    test('zero sqft -> both price/sqft are null', () => {
      const row = { ...GOLDEN_MLS_ROWS[0], squareFeet: 0 }
      const m = computeMLSMetrics(row)
      expect(m.salePricePerSqFt).toBeNull()
      expect(m.listPricePerSqFt).toBeNull()
    })
  })

  describe('List-to-sale ratio', () => {
    test('sold row 0: 215000 / 229000 ≈ 0.9389', () => {
      const m = computeMLSMetrics(GOLDEN_MLS_ROWS[0])
      expect(m.listToSaleRatio).toBeCloseTo(215000 / 229000, 3)
      expect(m.listToSaleRatioFlagged).toBe(false)
    })

    test('active row -> listToSaleRatio is null', () => {
      const m = computeMLSMetrics(GOLDEN_MLS_ROWS[2])
      expect(m.listToSaleRatio).toBeNull()
      expect(m.listToSaleRatioFlagged).toBeNull()
    })

    test('pending row -> listToSaleRatio is null', () => {
      const m = computeMLSMetrics(GOLDEN_MLS_ROWS[5])
      expect(m.listToSaleRatio).toBeNull()
    })

    test('all sold rows produce ratios in 0.50-2.00 range', () => {
      for (const row of GOLDEN_MLS_ROWS) {
        if (row.status !== 'C') continue
        const m = computeMLSMetrics(row)
        expect(m.listToSaleRatio).not.toBeNull()
        expect(m.listToSaleRatio!).toBeGreaterThanOrEqual(0.5)
        expect(m.listToSaleRatio!).toBeLessThanOrEqual(2.0)
      }
    })
  })

  describe('Distance to subject', () => {
    test('rows with coordinates produce non-null distance', () => {
      for (const row of GOLDEN_MLS_ROWS) {
        const m = computeMLSMetrics(row, GOLDEN_SUBJECT)
        if (row.latitude !== null && row.longitude !== null) {
          expect(m.distanceToSubject).not.toBeNull()
          expect(m.distanceToSubject!).toBeGreaterThanOrEqual(0)
        }
      }
    })

    test('without subject -> distance is null', () => {
      const m = computeMLSMetrics(GOLDEN_MLS_ROWS[0])
      expect(m.distanceToSubject).toBeNull()
    })

    test('all golden distances are within 5 miles of subject', () => {
      // All golden properties are in Scottsdale within a few miles
      for (const row of GOLDEN_MLS_ROWS) {
        const m = computeMLSMetrics(row, GOLDEN_SUBJECT)
        if (m.distanceToSubject !== null) {
          expect(m.distanceToSubject).toBeLessThan(5)
        }
      }
    })
  })

  describe('True DOM', () => {
    test('sold row 0: saleDate(2024-03-01) - listDate(2023-12-08) ≈ 84 days', () => {
      const m = computeMLSMetrics(GOLDEN_MLS_ROWS[0])
      expect(m.trueDaysOnMarket).toBe(84)
      expect(m.mlsReportedDOM).toBe(83)
      expect(m.domDiscrepancy).toBe(1) // true is 1 day more than MLS reported
    })

    test('active row (no sale date) -> trueDaysOnMarket is null', () => {
      const m = computeMLSMetrics(GOLDEN_MLS_ROWS[2])
      expect(m.trueDaysOnMarket).toBeNull()
      expect(m.domDiscrepancy).toBeNull()
    })

    test('sold row 1: saleDate(2024-03-01) - listDate(2024-01-18) ≈ 43 days', () => {
      const m = computeMLSMetrics(GOLDEN_MLS_ROWS[1])
      expect(m.trueDaysOnMarket).toBe(43)
      expect(m.domDiscrepancy).toBe(1) // 43 - 42
    })
  })

  describe('Batch enrichment', () => {
    test('enrichMLSBatch returns correct count', () => {
      const enriched = enrichMLSBatch(GOLDEN_MLS_ROWS, GOLDEN_SUBJECT)
      expect(enriched).toHaveLength(GOLDEN_MLS_ROWS.length)
      for (const row of enriched) {
        expect(row.computedMetrics).toBeDefined()
      }
    })

    test('summarizeMLSMetrics returns valid coverage stats', () => {
      const enriched = enrichMLSBatch(GOLDEN_MLS_ROWS, GOLDEN_SUBJECT)
      const summary = summarizeMLSMetrics(enriched)
      expect(summary.totalRecords).toBe(6)
      // 4 sold rows have sale price
      expect(summary.salePricePerSqFtAvailable).toBe(4)
      // All 6 rows have list price
      expect(summary.listPricePerSqFtAvailable).toBe(6)
      // 4 sold rows have list-to-sale ratio
      expect(summary.listToSaleRatioAvailable).toBe(4)
      // All rows have coordinates + subject provided
      expect(summary.distanceToSubjectAvailable).toBe(6)
      // 4 sold rows have true DOM (saleDate + listDate both present)
      expect(summary.trueDOMAvailable).toBe(4)
    })
  })
})

// ─── Computed Metrics: Breakups Context ─────────────────────

describe('Computed Metrics: Breakups', () => {
  describe('Hold period and seller basis deltas', () => {
    test('golden prop 0: holdPeriodDays from 2020-06-15 to 2024-03-01', () => {
      const m = computeBreakupsMetrics(GOLDEN_PROPERTIES[0])
      // 2020-06-15 to 2024-03-01 ≈ 1355 days (approx, depends on leap years)
      expect(m.holdPeriodDays).not.toBeNull()
      expect(m.holdPeriodDays!).toBeGreaterThan(1300)
      expect(m.holdPeriodDays!).toBeLessThan(1400)
    })

    test('golden prop 0: sellerBasisDelta = 215000 - 350000 = -135000', () => {
      const m = computeBreakupsMetrics(GOLDEN_PROPERTIES[0])
      expect(m.sellerBasisDelta).toBe(-135000)
    })

    test('golden prop 0: sellerBasisAppreciation = (215000 - 350000) / 350000', () => {
      const m = computeBreakupsMetrics(GOLDEN_PROPERTIES[0])
      expect(m.sellerBasisAppreciation).toBeCloseTo(-135000 / 350000, 3)
    })

    test('active prop (SALE_PRICE=0) -> sellerBasisDelta is null', () => {
      const m = computeBreakupsMetrics(GOLDEN_PROPERTIES[2])
      expect(m.sellerBasisDelta).toBeNull()
      expect(m.sellerBasisAppreciation).toBeNull()
    })
  })

  describe('Sale price per sqft (breakups)', () => {
    test('golden prop 0: 215000 / 702', () => {
      const m = computeBreakupsMetrics(GOLDEN_PROPERTIES[0])
      expect(m.salePricePerSqFt).toBeCloseTo(215000 / 702, 2)
    })

    test('zero SQFT -> null', () => {
      const prop = { ...GOLDEN_PROPERTIES[0], SQFT: 0 }
      const m = computeBreakupsMetrics(prop)
      expect(m.salePricePerSqFt).toBeNull()
    })
  })

  describe('List-to-sale ratio (breakups)', () => {
    test('sold prop: 215000 / 229000', () => {
      const m = computeBreakupsMetrics(GOLDEN_PROPERTIES[0])
      expect(m.listToSaleRatio).toBeCloseTo(215000 / 229000, 3)
    })

    test('active prop -> null', () => {
      const m = computeBreakupsMetrics(GOLDEN_PROPERTIES[2])
      expect(m.listToSaleRatio).toBeNull()
    })
  })

  describe('True DOM (breakups)', () => {
    test('golden prop 0: SALE_DATE(2024-03-01) - OG_LIST_DATE(2024-01-15) = 46 days', () => {
      const m = computeBreakupsMetrics(GOLDEN_PROPERTIES[0])
      // Default makeProperty has OG_LIST_DATE: '2024-01-15', SALE_DATE: '2024-03-01'
      // But golden prop 0 overrides to use the same dates
      expect(m.trueDaysOnMarket).not.toBeNull()
      expect(m.trueDaysOnMarket!).toBeGreaterThan(40)
      expect(m.trueDaysOnMarket!).toBeLessThan(50)
    })

    test('active prop (no SALE_DATE) -> null trueDaysOnMarket', () => {
      // Golden prop 2 has STATUS 'A', SALE_PRICE 0, but still has SALE_DATE from makeProperty default
      // Override to empty sale date
      const prop = { ...GOLDEN_PROPERTIES[2], SALE_DATE: '' as any }
      const m = computeBreakupsMetrics(prop)
      expect(m.trueDaysOnMarket).toBeNull()
    })
  })

  describe('Batch enrichment (breakups)', () => {
    test('enrichBreakupsBatch returns correct count', () => {
      const enriched = enrichBreakupsBatch(GOLDEN_PROPERTIES)
      expect(enriched).toHaveLength(GOLDEN_PROPERTIES.length)
      for (const row of enriched) {
        expect(row.computedMetrics).toBeDefined()
      }
    })
  })
})

// ─── Comp Scoring: Factor-Level ─────────────────────────────

describe('Comp Scoring: Factor Functions', () => {
  describe('scoreDistance', () => {
    test('0 miles = 1.0', () => {
      expect(scoreDistance(0)).toBe(1.0)
    })

    test('at maxDistance = 0.0', () => {
      expect(scoreDistance(3.0, 3.0)).toBe(0.0)
    })

    test('1.5 miles with max 3.0 = 0.5', () => {
      expect(scoreDistance(1.5, 3.0)).toBe(0.5)
    })

    test('null distance -> null', () => {
      expect(scoreDistance(null)).toBeNull()
    })

    test('beyond max -> 0.0', () => {
      expect(scoreDistance(5.0, 3.0)).toBe(0.0)
    })
  })

  describe('scorePriceSimilarity', () => {
    test('identical price = 1.0', () => {
      expect(scorePriceSimilarity(500000, 500000)).toBe(1.0)
    })

    test('10% deviation ≈ 0.9', () => {
      expect(scorePriceSimilarity(450000, 500000)).toBeCloseTo(0.9, 2)
    })

    test('100%+ deviation = 0.0', () => {
      expect(scorePriceSimilarity(1000000, 500000)).toBe(0.0)
    })

    test('null price -> null', () => {
      expect(scorePriceSimilarity(null, 500000)).toBeNull()
    })

    test('zero subject price -> null', () => {
      expect(scorePriceSimilarity(500000, 0)).toBeNull()
    })
  })

  describe('scoreSqftSimilarity', () => {
    test('identical sqft = 1.0', () => {
      expect(scoreSqftSimilarity(1800, 1800)).toBe(1.0)
    })

    test('20% deviation ≈ 0.8', () => {
      expect(scoreSqftSimilarity(1440, 1800)).toBeCloseTo(0.8, 2)
    })

    test('zero sqft -> null', () => {
      expect(scoreSqftSimilarity(0, 1800)).toBeNull()
    })
  })

  describe('scoreAgeSimilarity', () => {
    test('same year = 1.0', () => {
      expect(scoreAgeSimilarity(1985, 1985)).toBe(1.0)
    })

    test('15 yr diff with max 30 = 0.5', () => {
      expect(scoreAgeSimilarity(2000, 1985, 30)).toBe(0.5)
    })

    test('30+ yr diff = 0.0', () => {
      expect(scoreAgeSimilarity(2020, 1985, 30)).toBeCloseTo(0.0, 1)
    })

    test('zero year -> null', () => {
      expect(scoreAgeSimilarity(0, 1985)).toBeNull()
    })
  })

  describe('scoreBedBathMatch', () => {
    test('exact match = 1.0', () => {
      expect(scoreBedBathMatch(3, 2, 3, 2)).toBe(1.0)
    })

    test('±1 bed = 0.7', () => {
      expect(scoreBedBathMatch(2, 2, 3, 2)).toBe(0.7)
    })

    test('±2 bed = 0.3', () => {
      expect(scoreBedBathMatch(1, 2, 3, 2)).toBe(0.3)
    })

    test('±3+ bed = 0.0', () => {
      expect(scoreBedBathMatch(6, 2, 3, 2)).toBe(0.0)
    })

    test('null inputs -> null', () => {
      expect(scoreBedBathMatch(null, 2, 3, 2)).toBeNull()
    })
  })

  describe('scoreFeatureMatch', () => {
    test('all match = 1.0', () => {
      const comp = { pool: true, garageSpaces: 2, hoa: true }
      const subj = { pool: true, garageSpaces: 2, hoa: true }
      expect(scoreFeatureMatch(comp, subj)).toBeCloseTo(1.0, 2)
    })

    test('none match = 0.0', () => {
      const comp = { pool: true, garageSpaces: 2, hoa: true }
      const subj = { pool: false, garageSpaces: 0, hoa: false }
      expect(scoreFeatureMatch(comp, subj)).toBeCloseTo(0.0, 2)
    })

    test('2 of 3 match ≈ 0.667', () => {
      const comp = { pool: true, garageSpaces: 2, hoa: false }
      const subj = { pool: true, garageSpaces: 1, hoa: false }
      expect(scoreFeatureMatch(comp, subj)).toBeCloseTo(0.6667, 2)
    })
  })
})

// ─── Comp Scoring: MLS Ranking ──────────────────────────────

describe('Comp Scoring: MLS Ranking', () => {
  // Use golden row 0 as "subject" — it's a sold 702 sqft 1bd/1ba in Scottsdale
  const subject = {
    latitude: GOLDEN_SUBJECT.latitude,
    longitude: GOLDEN_SUBJECT.longitude,
    price: 215000,
    squareFeet: 702,
    yearBuilt: 1974,
    bedrooms: 1,
    bathrooms: 1,
    pool: true,
    garageSpaces: 2,
    hoa: true,
  }

  test('scoreMLSComp returns valid ScoredComp structure', () => {
    const result = scoreMLSComp(GOLDEN_MLS_ROWS[0], subject)
    expect(result).toHaveProperty('overallScore')
    expect(result).toHaveProperty('tier')
    expect(result).toHaveProperty('factors')
    expect(result).toHaveProperty('factorsAvailable')
    expect(result).toHaveProperty('explanation')
    expect(result.overallScore).toBeGreaterThanOrEqual(0)
    expect(result.overallScore).toBeLessThanOrEqual(100)
    expect(['primary', 'supporting', 'context']).toContain(result.tier)
  })

  test('row 0 (near-identical to subject) scores highest', () => {
    // Row 0 is in the same subdivision, same price range, same bed/bath
    const score0 = scoreMLSComp(GOLDEN_MLS_ROWS[0], subject)
    const score1 = scoreMLSComp(GOLDEN_MLS_ROWS[1], subject)
    const score2 = scoreMLSComp(GOLDEN_MLS_ROWS[2], subject)
    expect(score0.overallScore).toBeGreaterThan(score1.overallScore)
    expect(score0.overallScore).toBeGreaterThan(score2.overallScore)
  })

  test('rankMLSComps returns deterministic order', () => {
    const result1 = rankMLSComps(GOLDEN_MLS_ROWS, subject)
    const result2 = rankMLSComps(GOLDEN_MLS_ROWS, subject)

    // Same order both times
    expect(result1.ranked.map(r => r.mlsNumber))
      .toEqual(result2.ranked.map(r => r.mlsNumber))
  })

  test('rankMLSComps returns descending score order', () => {
    const result = rankMLSComps(GOLDEN_MLS_ROWS, subject)
    for (let i = 1; i < result.ranked.length; i++) {
      expect(result.ranked[i - 1].compScore.overallScore)
        .toBeGreaterThanOrEqual(result.ranked[i].compScore.overallScore)
    }
  })

  test('tierCounts sum to total comps', () => {
    const result = rankMLSComps(GOLDEN_MLS_ROWS, subject)
    const sum = result.tierCounts.primary + result.tierCounts.supporting + result.tierCounts.context
    expect(sum).toBe(GOLDEN_MLS_ROWS.length)
  })

  test('summary has valid factor coverage', () => {
    const result = rankMLSComps(GOLDEN_MLS_ROWS, subject)
    expect(result.summary.totalScored).toBe(GOLDEN_MLS_ROWS.length)
    expect(result.summary.avgScore).toBeGreaterThan(0)
    expect(result.summary.medianScore).toBeGreaterThan(0)
    // All rows have sqft, age, bed/bath
    expect(result.summary.factorCoverage.sqft).toBe(6)
    expect(result.summary.factorCoverage.age).toBe(6)
    expect(result.summary.factorCoverage.bedBath).toBe(6)
  })

  test('explanation string contains score and tier', () => {
    const result = scoreMLSComp(GOLDEN_MLS_ROWS[0], subject)
    expect(result.explanation).toContain('Score')
    expect(result.explanation).toContain('/100')
    expect(result.explanation).toContain('factors')
  })
})

// ─── Comp Scoring: Breakups Ranking ─────────────────────────

describe('Comp Scoring: Breakups Ranking', () => {
  // Use golden prop 0 as subject
  const subject = GOLDEN_PROPERTIES[0]

  test('scoreBreakupsComp returns valid structure', () => {
    const result = scoreBreakupsComp(GOLDEN_PROPERTIES[1], subject)
    expect(result.overallScore).toBeGreaterThanOrEqual(0)
    expect(result.overallScore).toBeLessThanOrEqual(100)
    expect(['primary', 'supporting', 'context']).toContain(result.tier)
  })

  test('rankBreakupsComps produces deterministic order', () => {
    const result1 = rankBreakupsComps(GOLDEN_PROPERTIES.slice(1), subject)
    const result2 = rankBreakupsComps(GOLDEN_PROPERTIES.slice(1), subject)
    expect(result1.ranked.map(r => r.APN)).toEqual(result2.ranked.map(r => r.APN))
  })

  test('rankBreakupsComps returns descending scores', () => {
    const result = rankBreakupsComps(GOLDEN_PROPERTIES.slice(1), subject)
    for (let i = 1; i < result.ranked.length; i++) {
      expect(result.ranked[i - 1].compScore.overallScore)
        .toBeGreaterThanOrEqual(result.ranked[i].compScore.overallScore)
    }
  })

  test('tier counts sum correctly', () => {
    const result = rankBreakupsComps(GOLDEN_PROPERTIES.slice(1), subject)
    const sum = result.tierCounts.primary + result.tierCounts.supporting + result.tierCounts.context
    expect(sum).toBe(GOLDEN_PROPERTIES.length - 1)
  })
})

// ─── Reconciled Outputs ─────────────────────────────────────

describe('Reconciled Outputs: Market Rent', () => {
  const subject = GOLDEN_PROPERTIES[0] // sale property

  test('with lease comps -> derives market rent from actual data', () => {
    const leaseComps = GOLDEN_PROPERTIES.filter(p => p.IS_RENTAL === 'Y')
    const result = estimateMarketRent(subject, leaseComps)
    expect(result.leaseCompCount).toBe(2) // two lease comps in golden set
    expect(result.method).toBe('comp-average')
    expect(result.monthlyRent).toBeGreaterThan(0)
    expect(result.annualRent).toBe(result.monthlyRent * 12)
    expect(result.confidence).not.toBe('synthetic')
  })

  test('without lease comps -> falls back to modeled', () => {
    const modeledNOI: ExpectedNOIResult = {
      monthlyRent: 1500,
      annualIncome: 18000,
      operatingExpenses: 6300,
      annualNOI: 11700,
      capRate: 0.065,
      renoScore: 5,
      renoRecency: 'Mid',
      multiplierUsed: 0.0055,
    }
    const result = estimateMarketRent(subject, [], undefined, modeledNOI)
    expect(result.leaseCompCount).toBe(0)
    expect(result.method).toBe('synthetic-multiplier')
    expect(result.confidence).toBe('synthetic')
    expect(result.monthlyRent).toBe(1500)
  })

  test('rentPerSqFtMonthly is calculated when sqft available', () => {
    const leaseComps = GOLDEN_PROPERTIES.filter(p => p.IS_RENTAL === 'Y')
    const result = estimateMarketRent(subject, leaseComps)
    expect(result.rentPerSqFtMonthly).toBeGreaterThan(0)
  })
})

describe('Reconciled Outputs: NOI Reconciliation', () => {
  test('market-derived rent with high confidence -> source is market', () => {
    const marketRent = {
      monthlyRent: 2000,
      annualRent: 24000,
      rentPerSqFtMonthly: 2.85,
      leaseCompCount: 4,
      avgCompScore: 70,
      confidence: 'high' as const,
      method: 'comp-weighted' as const,
    }
    const modeledNOI: ExpectedNOIResult = {
      monthlyRent: 1800,
      annualIncome: 21600,
      operatingExpenses: 7560,
      annualNOI: 14040,
      capRate: 0.065,
      renoScore: 5,
      renoRecency: 'Mid',
      multiplierUsed: 0.0055,
    }
    const result = reconcileNOI(marketRent, modeledNOI, 215000)
    expect(result.source).toBe('market')
    expect(result.confidence).toBe('high')
    expect(result.reconciledNOI).toBeGreaterThan(0)
    // Market NOI = 24000 * 0.65 = 15600
    expect(result.marketNOI).toBeCloseTo(24000 * 0.65, 0)
    expect(result.divergence).not.toBeNull()
  })

  test('synthetic rent -> source is modeled', () => {
    const marketRent = {
      monthlyRent: 1500,
      annualRent: 18000,
      rentPerSqFtMonthly: 0,
      leaseCompCount: 0,
      avgCompScore: 0,
      confidence: 'synthetic' as const,
      method: 'synthetic-multiplier' as const,
    }
    const modeledNOI: ExpectedNOIResult = {
      monthlyRent: 1500,
      annualIncome: 18000,
      operatingExpenses: 6300,
      annualNOI: 11700,
      capRate: 0.054,
      renoScore: 5,
      renoRecency: 'Mid',
      multiplierUsed: 0.0055,
    }
    const result = reconcileNOI(marketRent, modeledNOI, 215000)
    expect(result.source).toBe('modeled')
    expect(result.confidence).toBe('synthetic')
    expect(result.reconciledNOI).toBe(11700)
    expect(result.divergence).toBeNull() // no market to compare
  })

  test('reconciled cap rate is calculated when price > 0', () => {
    const marketRent = {
      monthlyRent: 2000,
      annualRent: 24000,
      rentPerSqFtMonthly: 2.85,
      leaseCompCount: 3,
      avgCompScore: 65,
      confidence: 'high' as const,
      method: 'comp-weighted' as const,
    }
    const result = reconcileNOI(marketRent, null, 300000)
    expect(result.reconciledCapRate).not.toBeNull()
    expect(result.reconciledCapRate!).toBeGreaterThan(0)
    expect(result.reconciledCapRate!).toBeLessThan(0.20) // sanity
  })
})

describe('Reconciled Outputs: Value Estimate', () => {
  test('with scored sale comps -> produces weighted value', () => {
    const scoredComps = GOLDEN_PROPERTIES
      .filter(p => p.IS_RENTAL !== 'Y' && p.STATUS === 'C')
      .map(p => ({
        ...p,
        compScore: {
          overallScore: 60,
          tier: 'supporting' as const,
          factors: { distance: null, price: 0.8, sqft: 0.7, age: 0.6, bedBath: 0.7, features: null },
          factorsAvailable: 4,
          factorsTotal: 6,
          explanation: 'test',
        },
      }))

    const reconciledNOI = {
      modeledNOI: 11700,
      marketNOI: 15600,
      reconciledNOI: 14000,
      reconciledCapRate: 0.065,
      confidence: 'medium' as const,
      divergence: 0.33,
      source: 'blended' as const,
      explanation: 'test',
    }

    const result = reconcileValue(scoredComps, reconciledNOI)
    expect(result.compWeightedValue).not.toBeNull()
    expect(result.compWeightedValue!).toBeGreaterThan(0)
    expect(result.reconciledValue).not.toBeNull()
    expect(result.range).not.toBeNull()
    expect(result.range!.low).toBeLessThan(result.range!.high)
    expect(result.approaches.length).toBeGreaterThanOrEqual(1)
  })

  test('without comps -> value from income approach only', () => {
    const reconciledNOI = {
      modeledNOI: 11700,
      marketNOI: null,
      reconciledNOI: 11700,
      reconciledCapRate: 0.065,
      confidence: 'synthetic' as const,
      divergence: null,
      source: 'modeled' as const,
      explanation: 'test',
    }

    const result = reconcileValue([], reconciledNOI)
    expect(result.compWeightedValue).toBeNull()
    expect(result.incomeApproachValue).not.toBeNull()
    // 11700 / 0.065 ≈ 180000
    expect(result.incomeApproachValue!).toBeCloseTo(11700 / 0.065, -2)
  })
})

describe('Reconciled Outputs: Full Reconciliation', () => {
  test('reconcileAnalysis returns complete structure', () => {
    const subject = GOLDEN_PROPERTIES[0]
    const result = reconcileAnalysis(subject, GOLDEN_PROPERTIES)

    expect(result.marketRent).toBeDefined()
    expect(result.reconciledNOI).toBeDefined()
    expect(result.valueEstimate).toBeDefined()
    expect(result.diagnostics).toBeDefined()

    // Diagnostics reflect golden dataset
    expect(result.diagnostics.leaseCompsAvailable).toBe(2)
    expect(result.diagnostics.saleCompsAvailable).toBeGreaterThanOrEqual(1)
    expect(result.diagnostics.hasMarketRent).toBe(true)
  })

  test('reconcileAnalysis with modeled NOI produces divergence', () => {
    const subject = GOLDEN_PROPERTIES[0]
    const modeledNOI: ExpectedNOIResult = {
      monthlyRent: 1500,
      annualIncome: 18000,
      operatingExpenses: 6300,
      annualNOI: 11700,
      capRate: 0.054,
      renoScore: 7,
      renoRecency: 'Fresh',
      multiplierUsed: 0.0065,
    }
    const result = reconcileAnalysis(subject, GOLDEN_PROPERTIES, undefined, modeledNOI)

    // Should have divergence since market rent differs from modeled
    expect(result.reconciledNOI.divergence).not.toBeNull()
    expect(result.reconciledNOI.source).not.toBe('modeled') // has lease comps
  })

  test('confidence is never high when only 2 lease comps', () => {
    const subject = GOLDEN_PROPERTIES[0]
    const result = reconcileAnalysis(subject, GOLDEN_PROPERTIES)
    // Only 2 lease comps in golden set — not enough for 'high'
    expect(result.marketRent.confidence).not.toBe('high')
  })
})
