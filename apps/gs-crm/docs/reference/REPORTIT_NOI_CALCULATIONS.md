# ReportIt NOI Calculations Documentation

**Project:** GSRealty Client Management System - ReportIt Feature
**Purpose:** Net Operating Income (NOI) and rental rate calculation methodology
**Created:** October 23, 2024
**Version:** 1.0

---

## Overview

This document specifies the Net Operating Income (NOI) calculation methodology for the ReportIt system. NOI calculations help evaluate investment potential and compare properties based on their income-generating capability. The system uses renovation scores as a key factor in determining rental rates and projected returns.

---

## Core Calculation Components

### 1. Rental Rate Estimation

The rental rate estimation is based on the property's sale price and renovation status, using empirically-derived multipliers for the Maricopa County market.

#### Base Formula

```javascript
monthlyRent = salePrice × renovationMultiplier
```

#### Renovation Multipliers

| RENOVATE_SCORE | Monthly Multiplier | Annual Rate | Description |
|----------------|-------------------|-------------|-------------|
| **Y** (Yes) | 0.0065 | 7.8% | Fully renovated property |
| **0.5** (Partial) | 0.0055 | 6.6% | Partially renovated property |
| **N** (No) | 0.0045 | 5.4% | Not renovated property |

#### Implementation

```javascript
function estimateMonthlyRent(salePrice, renovateScore) {
  const multipliers = {
    'Y': 0.0065,    // Premium for fully renovated
    '0.5': 0.0055,  // Mid-range for partial renovation
    'N': 0.0045,    // Base rate for unrenovated
    'default': 0.0050 // Fallback if score unknown
  };

  const multiplier = multipliers[renovateScore] || multipliers['default'];
  return Math.round(salePrice * multiplier);
}

// Example calculations
// $400,000 property:
// - Renovated (Y): $400,000 × 0.0065 = $2,600/month
// - Partial (0.5): $400,000 × 0.0055 = $2,200/month
// - Not renovated (N): $400,000 × 0.0045 = $1,800/month
```

---

### 2. Operating Expenses Estimation

Operating expenses are estimated as a percentage of gross rental income, with adjustments based on property type and condition.

#### Base Expense Ratio

```javascript
const baseExpenseRatio = 0.35; // 35% of gross income
```

#### Detailed Expense Breakdown

```javascript
function calculateOperatingExpenses(annualIncome, propertyDetails) {
  const expenses = {
    // Fixed percentages of annual income
    propertyManagement: annualIncome * 0.08,    // 8% management fee
    maintenance: annualIncome * 0.06,           // 6% maintenance/repairs
    insurance: annualIncome * 0.03,             // 3% insurance
    utilities: annualIncome * 0.02,             // 2% utilities (if included)
    vacancy: annualIncome * 0.05,               // 5% vacancy allowance
    reserves: annualIncome * 0.03,              // 3% capital reserves

    // Fixed amounts (annual)
    propertyTax: propertyDetails.annualTax || (propertyDetails.salePrice * 0.01),
    hoaFees: (propertyDetails.hoaMonthly || 0) * 12,
    other: annualIncome * 0.03                  // 3% misc expenses
  };

  expenses.total = Object.values(expenses).reduce((sum, val) => sum + val, 0);

  return expenses;
}
```

#### Expense Ratio Adjustments

```javascript
function getAdjustedExpenseRatio(propertyType, renovateScore, age) {
  let ratio = 0.35; // Base ratio

  // Property type adjustments
  const typeAdjustments = {
    'Single Family': 0,
    'Condo': -0.05,        // Lower maintenance (HOA handles exterior)
    'Townhouse': -0.03,
    'Multi-Family': +0.05
  };

  // Renovation score adjustments
  const renovationAdjustments = {
    'Y': -0.05,   // Lower maintenance for renovated
    '0.5': 0,     // No adjustment for partial
    'N': +0.05    // Higher maintenance for unrenovated
  };

  // Age adjustments
  const ageAdjustment = age > 20 ? 0.02 : 0; // 2% increase for older properties

  ratio += typeAdjustments[propertyType] || 0;
  ratio += renovationAdjustments[renovateScore] || 0;
  ratio += ageAdjustment;

  // Ensure ratio stays within reasonable bounds
  return Math.max(0.25, Math.min(0.50, ratio));
}
```

---

### 3. Net Operating Income (NOI) Calculation

NOI represents the property's ability to generate income after operating expenses but before debt service.

#### Standard NOI Formula

```javascript
function calculateNOI(property) {
  const monthlyRent = estimateMonthlyRent(property.salePrice, property.renovateScore);
  const annualIncome = monthlyRent * 12;

  const expenseRatio = getAdjustedExpenseRatio(
    property.propertyType,
    property.renovateScore,
    property.age
  );

  const operatingExpenses = annualIncome * expenseRatio;
  const netOperatingIncome = annualIncome - operatingExpenses;

  return {
    monthlyRent,
    annualIncome,
    operatingExpenses,
    expenseRatio,
    netOperatingIncome,
    capRate: netOperatingIncome / property.salePrice
  };
}
```

#### Detailed NOI Breakdown

```javascript
function calculateDetailedNOI(property) {
  // Gross Rental Income
  const monthlyRent = estimateMonthlyRent(property.salePrice, property.renovateScore);
  const grossMonthlyIncome = monthlyRent;
  const grossAnnualIncome = grossMonthlyIncome * 12;

  // Vacancy Loss (5% typical)
  const vacancyRate = 0.05;
  const vacancyLoss = grossAnnualIncome * vacancyRate;

  // Effective Gross Income
  const effectiveGrossIncome = grossAnnualIncome - vacancyLoss;

  // Operating Expenses (detailed)
  const expenses = calculateOperatingExpenses(effectiveGrossIncome, property);

  // Net Operating Income
  const noi = effectiveGrossIncome - expenses.total;

  return {
    // Income
    grossMonthlyIncome,
    grossAnnualIncome,
    vacancyLoss,
    effectiveGrossIncome,

    // Expenses
    expenses,
    totalExpenses: expenses.total,

    // NOI
    monthlyNOI: noi / 12,
    annualNOI: noi,

    // Metrics
    expenseRatio: expenses.total / effectiveGrossIncome,
    capRate: (noi / property.salePrice) * 100,
    grossRentMultiplier: property.salePrice / grossAnnualIncome
  };
}
```

---

## Investment Metrics

### 4. Capitalization Rate (Cap Rate)

Cap rate measures the property's return on investment without considering financing.

```javascript
function calculateCapRate(noi, propertyValue) {
  return (noi / propertyValue) * 100;
}

// Industry benchmarks for Maricopa County
const capRateBenchmarks = {
  excellent: "> 8%",
  good: "6-8%",
  average: "4-6%",
  poor: "< 4%"
};
```

### 5. Cash-on-Cash Return

Measures the cash income earned on cash invested, accounting for financing.

```javascript
function calculateCashOnCashReturn(property, financing) {
  const noi = calculateNOI(property).netOperatingIncome;

  // Annual Debt Service
  const loanAmount = property.salePrice * (1 - financing.downPaymentPercent);
  const monthlyPayment = calculateMortgagePayment(
    loanAmount,
    financing.interestRate,
    financing.termYears
  );
  const annualDebtService = monthlyPayment * 12;

  // Cash Flow
  const annualCashFlow = noi - annualDebtService;

  // Initial Cash Investment
  const downPayment = property.salePrice * financing.downPaymentPercent;
  const closingCosts = property.salePrice * 0.03; // 3% closing costs
  const initialInvestment = downPayment + closingCosts;

  // Cash-on-Cash Return
  const cashOnCashReturn = (annualCashFlow / initialInvestment) * 100;

  return {
    annualCashFlow,
    monthlyC cashFlow: annualCashFlow / 12,
    initialInvestment,
    cashOnCashReturn,
    paybackPeriod: initialInvestment / annualCashFlow
  };
}

function calculateMortgagePayment(principal, annualRate, years) {
  const monthlyRate = annualRate / 12 / 100;
  const numPayments = years * 12;

  const payment = principal *
    (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1);

  return payment;
}
```

### 6. Return on Investment (ROI)

Total return considering appreciation, cash flow, and tax benefits.

```javascript
function calculateROI(property, holdingPeriod = 5) {
  const initialInvestment = property.salePrice * 0.25; // 25% down
  const noi = calculateNOI(property).netOperatingIncome;

  // Annual appreciation (3% average)
  const appreciationRate = 0.03;
  const futureValue = property.salePrice * Math.pow(1 + appreciationRate, holdingPeriod);
  const appreciation = futureValue - property.salePrice;

  // Total cash flow over holding period
  const totalCashFlow = noi * holdingPeriod;

  // Principal paydown (simplified)
  const principalPaydown = (property.salePrice * 0.75) * 0.15; // ~15% of loan

  // Total return
  const totalReturn = appreciation + totalCashFlow + principalPaydown;
  const roi = (totalReturn / initialInvestment) * 100;

  return {
    initialInvestment,
    futureValue,
    appreciation,
    totalCashFlow,
    principalPaydown,
    totalReturn,
    roi,
    annualizedROI: roi / holdingPeriod
  };
}
```

---

## Improvement Analysis (Break-up #22)

### 7. NOI with Cosmetic Improvements

Calculates the impact of upgrading from RENOVATE_SCORE 'N' to '0.5'.

```javascript
function calculateImprovedNOI(property, improvementCost = 15000) {
  // Current NOI (not renovated)
  const currentProperty = {...property, renovateScore: 'N'};
  const currentNOI = calculateNOI(currentProperty);

  // Improved NOI (partially renovated)
  const improvedProperty = {...property, renovateScore: '0.5'};
  const improvedNOI = calculateNOI(improvedProperty);

  // Calculate improvements
  const monthlyRentIncrease = improvedNOI.monthlyRent - currentNOI.monthlyRent;
  const annualIncomeIncrease = monthlyRentIncrease * 12;
  const noiIncrease = improvedNOI.netOperatingIncome - currentNOI.netOperatingIncome;

  // Investment metrics
  const paybackPeriod = improvementCost / noiIncrease; // Years
  const returnOnImprovement = (noiIncrease / improvementCost) * 100;

  // NPV calculation (5 year, 8% discount rate)
  const discountRate = 0.08;
  const years = 5;
  let npv = -improvementCost;
  for (let year = 1; year <= years; year++) {
    npv += noiIncrease / Math.pow(1 + discountRate, year);
  }

  return {
    // Current state
    current: {
      monthlyRent: currentNOI.monthlyRent,
      annualIncome: currentNOI.annualIncome,
      noi: currentNOI.netOperatingIncome,
      capRate: currentNOI.capRate
    },

    // Improved state
    improved: {
      monthlyRent: improvedNOI.monthlyRent,
      annualIncome: improvedNOI.annualIncome,
      noi: improvedNOI.netOperatingIncome,
      capRate: improvedNOI.capRate
    },

    // Improvements
    improvements: {
      cost: improvementCost,
      monthlyRentIncrease,
      annualIncomeIncrease,
      noiIncrease,
      capRateIncrease: improvedNOI.capRate - currentNOI.capRate
    },

    // Returns
    metrics: {
      paybackPeriod,
      returnOnImprovement,
      npv,
      irr: calculateIRR(improvementCost, noiIncrease, years)
    }
  };
}
```

### 8. Full Renovation Analysis

Analyzes upgrade from RENOVATE_SCORE 'N' to 'Y'.

```javascript
function calculateFullRenovationNOI(property, renovationCost = 35000) {
  // Current NOI (not renovated)
  const currentProperty = {...property, renovateScore: 'N'};
  const currentNOI = calculateNOI(currentProperty);

  // Fully renovated NOI
  const renovatedProperty = {...property, renovateScore: 'Y'};
  const renovatedNOI = calculateNOI(renovatedProperty);

  // Value addition
  const estimatedValueIncrease = renovationCost * 1.5; // 150% of cost
  const newPropertyValue = property.salePrice + estimatedValueIncrease;

  return {
    current: currentNOI,
    renovated: renovatedNOI,
    investment: {
      cost: renovationCost,
      noiIncrease: renovatedNOI.netOperatingIncome - currentNOI.netOperatingIncome,
      valueIncrease: estimatedValueIncrease,
      newCapRate: renovatedNOI.netOperatingIncome / newPropertyValue
    }
  };
}
```

---

## Market Adjustments

### 9. Location-Based Adjustments

Adjust rental rates based on specific Maricopa County submarkets.

```javascript
const marketAdjustments = {
  // Premium markets (multiply base rent by factor)
  'Scottsdale': 1.15,
  'Paradise Valley': 1.25,
  'Arcadia': 1.20,
  'Desert Ridge': 1.10,

  // Standard markets
  'Phoenix': 1.00,
  'Tempe': 1.00,
  'Chandler': 1.05,
  'Gilbert': 1.05,

  // Value markets
  'Mesa': 0.90,
  'Glendale': 0.85,
  'Peoria': 0.95,

  // Default
  'default': 1.00
};

function adjustRentForLocation(baseRent, city) {
  const adjustment = marketAdjustments[city] || marketAdjustments['default'];
  return Math.round(baseRent * adjustment);
}
```

### 10. Seasonal Adjustments

Account for seasonal rental demand variations.

```javascript
function getSeasonalAdjustment(month) {
  const seasonalFactors = {
    1: 0.95,  // January - Lower demand
    2: 0.95,  // February
    3: 1.05,  // March - Spring market
    4: 1.10,  // April
    5: 1.10,  // May - Peak spring
    6: 1.00,  // June
    7: 0.90,  // July - Summer slowdown
    8: 0.90,  // August
    9: 1.00,  // September - Fall pickup
    10: 1.05, // October
    11: 0.95, // November - Holiday slowdown
    12: 0.90  // December
  };

  return seasonalFactors[month] || 1.00;
}
```

---

## Comparative Analysis

### 11. Peer Comparison NOI

Compare subject property NOI to comparable properties.

```javascript
function comparativeNOIAnalysis(subjectProperty, comparables) {
  const subjectNOI = calculateNOI(subjectProperty);

  const compAnalysis = comparables.map(comp => {
    const compNOI = calculateNOI(comp);
    return {
      address: comp.address,
      noi: compNOI.netOperatingIncome,
      capRate: compNOI.capRate,
      variance: ((compNOI.netOperatingIncome - subjectNOI.netOperatingIncome) /
                 subjectNOI.netOperatingIncome) * 100
    };
  });

  const avgCompNOI = compAnalysis.reduce((sum, comp) => sum + comp.noi, 0) /
                     compAnalysis.length;

  return {
    subject: subjectNOI,
    comparables: compAnalysis,
    market: {
      averageNOI: avgCompNOI,
      subjectPosition: subjectNOI.netOperatingIncome > avgCompNOI ? 'Above' : 'Below',
      percentDifference: ((subjectNOI.netOperatingIncome - avgCompNOI) / avgCompNOI) * 100
    }
  };
}
```

---

## Sensitivity Analysis

### 12. NOI Sensitivity Testing

Test NOI sensitivity to various input changes.

```javascript
function noiSensitivityAnalysis(property) {
  const baseNOI = calculateNOI(property);
  const sensitivities = {};

  // Test rent changes (-10% to +10%)
  const rentChanges = [-0.10, -0.05, 0, 0.05, 0.10];
  sensitivities.rent = rentChanges.map(change => {
    const adjustedPrice = property.salePrice * (1 + change);
    const adjustedProperty = {...property, salePrice: adjustedPrice};
    const noi = calculateNOI(adjustedProperty);
    return {
      change: change * 100,
      noi: noi.netOperatingIncome,
      impact: ((noi.netOperatingIncome - baseNOI.netOperatingIncome) /
               baseNOI.netOperatingIncome) * 100
    };
  });

  // Test expense ratio changes
  const expenseChanges = [-0.05, -0.025, 0, 0.025, 0.05];
  sensitivities.expenses = expenseChanges.map(change => {
    const adjustedRatio = 0.35 + change;
    const income = baseNOI.annualIncome;
    const expenses = income * adjustedRatio;
    const noi = income - expenses;
    return {
      change: change * 100,
      noi,
      impact: ((noi - baseNOI.netOperatingIncome) /
               baseNOI.netOperatingIncome) * 100
    };
  });

  // Test vacancy changes
  const vacancyChanges = [0.02, 0.03, 0.05, 0.07, 0.10];
  sensitivities.vacancy = vacancyChanges.map(rate => {
    const income = baseNOI.annualIncome * (1 - rate);
    const expenses = baseNOI.operatingExpenses;
    const noi = income - expenses;
    return {
      vacancyRate: rate * 100,
      noi,
      impact: ((noi - baseNOI.netOperatingIncome) /
               baseNOI.netOperatingIncome) * 100
    };
  });

  return sensitivities;
}
```

---

## Visualization Functions

### 13. NOI Chart Data Preparation

Prepare data for NOI visualization charts.

```javascript
function prepareNOIChartData(properties) {
  return {
    // Bar chart: NOI by renovation score
    noiByRenovation: {
      labels: ['Not Renovated', 'Partial', 'Fully Renovated'],
      datasets: [{
        label: 'Annual NOI',
        data: [
          properties.filter(p => p.renovateScore === 'N')
                   .map(p => calculateNOI(p).netOperatingIncome)
                   .reduce((sum, noi, _, arr) => sum + noi / arr.length, 0),
          properties.filter(p => p.renovateScore === '0.5')
                   .map(p => calculateNOI(p).netOperatingIncome)
                   .reduce((sum, noi, _, arr) => sum + noi / arr.length, 0),
          properties.filter(p => p.renovateScore === 'Y')
                   .map(p => calculateNOI(p).netOperatingIncome)
                   .reduce((sum, noi, _, arr) => sum + noi / arr.length, 0)
        ],
        backgroundColor: ['#DC2626', '#F59E0B', '#059669']
      }]
    },

    // Line chart: NOI vs Property Value
    noiScatter: {
      datasets: [{
        label: 'Properties',
        data: properties.map(p => ({
          x: p.salePrice,
          y: calculateNOI(p).netOperatingIncome,
          r: calculateNOI(p).capRate * 2 // Bubble size by cap rate
        }))
      }]
    },

    // Pie chart: Expense breakdown
    expenseBreakdown: {
      labels: ['Management', 'Maintenance', 'Tax', 'Insurance', 'Vacancy', 'Other'],
      datasets: [{
        data: [8, 6, 10, 3, 5, 3], // Percentages
        backgroundColor: [
          '#3B82F6', '#10B981', '#F59E0B',
          '#EF4444', '#8B5CF6', '#6B7280'
        ]
      }]
    }
  };
}
```

---

## Implementation Examples

### Complete NOI Analysis

```javascript
// Example: Complete NOI analysis for a property
const property = {
  salePrice: 425000,
  renovateScore: '0.5',
  propertyType: 'Single Family',
  age: 15,
  annualTax: 4250,
  hoaMonthly: 150,
  address: '4600 N 68TH ST UNIT 371',
  city: 'Scottsdale'
};

// Calculate base NOI
const noiAnalysis = calculateDetailedNOI(property);
console.log('Annual NOI:', noiAnalysis.annualNOI);
console.log('Cap Rate:', noiAnalysis.capRate + '%');

// Calculate improvement scenario
const improvementAnalysis = calculateImprovedNOI(property, 20000);
console.log('NOI Increase:', improvementAnalysis.improvements.noiIncrease);
console.log('Payback Period:', improvementAnalysis.metrics.paybackPeriod + ' years');

// Sensitivity analysis
const sensitivity = noiSensitivityAnalysis(property);
console.log('Rent sensitivity:', sensitivity.rent);

// Comparative analysis
const comparables = [/* ... array of comparable properties ... */];
const comparison = comparativeNOIAnalysis(property, comparables);
console.log('Market position:', comparison.market.subjectPosition);
```

---

## Testing & Validation

### Unit Tests

```javascript
describe('NOI Calculations', () => {
  test('rental rate calculation', () => {
    expect(estimateMonthlyRent(400000, 'Y')).toBe(2600);
    expect(estimateMonthlyRent(400000, '0.5')).toBe(2200);
    expect(estimateMonthlyRent(400000, 'N')).toBe(1800);
  });

  test('NOI calculation', () => {
    const property = {
      salePrice: 400000,
      renovateScore: 'Y',
      propertyType: 'Condo',
      age: 10
    };

    const noi = calculateNOI(property);
    expect(noi.annualIncome).toBe(31200); // $2600 * 12
    expect(noi.netOperatingIncome).toBeGreaterThan(20000);
    expect(noi.capRate).toBeGreaterThan(0.05);
  });

  test('improvement analysis', () => {
    const property = {
      salePrice: 400000,
      renovateScore: 'N'
    };

    const improvement = calculateImprovedNOI(property, 15000);
    expect(improvement.improvements.noiIncrease).toBeGreaterThan(0);
    expect(improvement.metrics.paybackPeriod).toBeLessThan(10);
  });
});
```

---

## Best Practices

### Accuracy Guidelines

1. **Use Actual Data When Available**
   - Prefer actual rental comps over estimates
   - Use real expense data when known
   - Verify tax amounts with MCAO

2. **Conservative Assumptions**
   - Include vacancy allowance (5% minimum)
   - Budget for maintenance reserves
   - Account for property management

3. **Regular Updates**
   - Review multipliers quarterly
   - Update market adjustments annually
   - Validate against actual performance

### Documentation Requirements

- Document all assumptions
- Note data sources
- Include calculation date
- Specify confidence levels

---

## Change Log

| Version | Date | Changes | Author |
|---------|------|---------|---------|
| 1.0 | 2024-10-23 | Initial NOI calculation specification | GSRealty Team |

---

**End of ReportIt Documentation Suite**