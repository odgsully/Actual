// Hardcoded Market Analysis Fundamentals Quiz
// General real estate knowledge (not property-specific)

import type { Quiz } from './types'

export const MARKET_ANALYSIS_QUIZ: Quiz = {
  id: 'market-analysis-fundamentals',
  title: 'Market Analysis Fundamentals',
  description:
    'Test your knowledge of real estate market analysis, pricing strategies, and valuation concepts.',
  category: 'market-analysis',
  questions: [
    {
      type: 'multiple-choice',
      question:
        'What does CMA stand for in real estate?',
      options: [
        'Comparative Market Analysis',
        'Competitive Market Assessment',
        'Commercial Market Appraisal',
        'Certified Market Audit',
      ],
      correctIndex: 0,
      explanation:
        'CMA stands for Comparative Market Analysis. It\'s a tool used by real estate agents to estimate a property\'s value by comparing it to similar recently sold properties in the area.',
    },
    {
      type: 'true-false',
      statement:
        'Days on Market (DOM) is a key indicator of market health - lower DOM typically indicates a seller\'s market.',
      isTrue: true,
      explanation:
        'Correct! When properties sell quickly (low DOM), it indicates high demand and limited inventory, characteristics of a seller\'s market. Conversely, high DOM suggests a buyer\'s market with more negotiating power for purchasers.',
    },
    {
      type: 'fill-blank',
      question:
        'The {{BLANK}} is the difference between the listing price and the final sale price, expressed as a percentage.',
      correctAnswer: 'list-to-sale ratio',
      acceptableAnswers: ['list to sale ratio', 'sale-to-list ratio', 'sale to list ratio'],
      explanation:
        'The list-to-sale ratio (or sale-to-list ratio) helps agents understand how properties are actually selling relative to their asking prices. A ratio above 100% indicates properties are selling above list price.',
    },
    {
      type: 'multiple-choice',
      question:
        'Which of the following is NOT typically considered a comparable (comp) adjustment factor?',
      options: [
        'Square footage difference',
        'Number of bedrooms',
        'Seller\'s purchase price history',
        'Lot size',
      ],
      correctIndex: 2,
      explanation:
        'The seller\'s original purchase price is not relevant to current market value. Comparable adjustments are based on physical property differences (square footage, bedrooms, lot size, condition, etc.) and location factors.',
    },
    {
      type: 'true-false',
      statement:
        'In Arizona, property values are assessed annually by the Maricopa County Assessor\'s Office (MCAO) for tax purposes.',
      isTrue: true,
      explanation:
        'Correct! The MCAO annually determines Limited Property Values (LPV) for tax calculations and Full Cash Values (FCV) that represent market value estimates. These assessments are crucial for property tax calculations.',
    },
    {
      type: 'multiple-choice',
      question:
        'What is the typical radius used when pulling comparable sales for a CMA in a suburban area?',
      options: [
        '0.25 miles',
        '0.5 to 1 mile',
        '3 to 5 miles',
        '10 miles',
      ],
      correctIndex: 1,
      explanation:
        'For suburban areas, 0.5 to 1 mile is the standard radius for pulling comps. Urban areas may use tighter radiuses (0.25-0.5 miles) while rural areas may require wider searches (2-5 miles) due to fewer sales.',
    },
    {
      type: 'fill-blank',
      question:
        'The absorption rate measures how quickly available homes are {{BLANK}} in a specific market over a given time period.',
      correctAnswer: 'sold',
      acceptableAnswers: ['selling', 'absorbed', 'purchased'],
      explanation:
        'Absorption rate = Number of homes sold / Number of homes available. It indicates market velocity and helps determine if there\'s a buyer\'s or seller\'s market. Higher rates indicate faster-moving markets.',
    },
    {
      type: 'multiple-choice',
      question:
        'A months of inventory of 3 or less typically indicates:',
      options: [
        'A buyer\'s market',
        'A balanced market',
        'A seller\'s market',
        'A stagnant market',
      ],
      correctIndex: 2,
      explanation:
        'Generally, 0-3 months of inventory indicates a seller\'s market, 4-6 months is balanced, and 7+ months favors buyers. Lower inventory means fewer choices for buyers, giving sellers more pricing power.',
    },
    {
      type: 'true-false',
      statement:
        'Price per square foot is always the most reliable metric for comparing property values.',
      isTrue: false,
      explanation:
        'False! While price per square foot is useful, it doesn\'t account for lot size, location quality, updates/condition, views, or other amenities. A smaller high-end home may have a higher $/sqft than a larger basic home.',
    },
    {
      type: 'multiple-choice',
      question:
        'When should a real estate agent recommend a property price adjustment?',
      options: [
        'After the first week with no showings',
        'After 2-3 weeks with showings but no offers',
        'After receiving an offer below asking price',
        'After the listing has been active for 60+ days',
      ],
      correctIndex: 1,
      explanation:
        'If a property receives showings but no offers after 2-3 weeks, it often indicates the price is too high relative to perceived value. Early price corrections tend to be more effective than waiting for an extended period.',
    },
  ],
}

export const ALL_QUIZZES: Quiz[] = [MARKET_ANALYSIS_QUIZ]
