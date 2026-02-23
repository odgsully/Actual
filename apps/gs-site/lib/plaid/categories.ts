/**
 * Plaid Category Mapping
 *
 * Maps Plaid's Personal Finance Categories (PFC) to our budget categories.
 * Uses PFC v2 taxonomy (primary → detailed).
 */

// Plaid PFC primary category → our budget category name
const PLAID_CATEGORY_MAP: Record<string, string> = {
  // Food
  'FOOD_AND_DRINK': 'Food & Dining',

  // Transportation
  'TRANSPORTATION': 'Transportation',

  // Entertainment
  'ENTERTAINMENT': 'Entertainment',

  // Shopping / Retail
  'GENERAL_MERCHANDISE': 'Shopping',

  // Bills
  'RENT_AND_UTILITIES': 'Bills & Utilities',
  'LOAN_PAYMENTS': 'Bills & Utilities',
  'HOME_IMPROVEMENT': 'Bills & Utilities',

  // Health
  'MEDICAL': 'Health & Fitness',

  // Personal
  'PERSONAL_CARE': 'Personal Care',

  // Skip these (transfers, income, etc.)
  'TRANSFER_IN': '__SKIP__',
  'TRANSFER_OUT': '__SKIP__',
  'INCOME': '__SKIP__',
  'BANK_FEES': 'Bills & Utilities',

  // Travel maps to transportation
  'TRAVEL': 'Transportation',

  // Government/tax
  'GOVERNMENT_AND_NON_PROFIT': 'Bills & Utilities',
};

/**
 * Map a Plaid personal_finance_category to our budget category name.
 * Returns null if the transaction should be skipped (transfers, income).
 */
export function mapPlaidCategory(
  primaryCategory: string,
  _detailedCategory?: string
): string | null {
  const mapped = PLAID_CATEGORY_MAP[primaryCategory];
  if (mapped === '__SKIP__') return null;
  return mapped || 'Other';
}

/**
 * Check if a Plaid transaction should be skipped
 */
export function shouldSkipPlaidTransaction(primaryCategory: string): boolean {
  return PLAID_CATEGORY_MAP[primaryCategory] === '__SKIP__';
}
