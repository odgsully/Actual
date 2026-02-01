/**
 * Category Mapper
 *
 * Maps raw transaction descriptions and categories to budget categories.
 */

// Discover category mapping
const DISCOVER_CATEGORY_MAP: Record<string, string> = {
  'Restaurants': 'Food & Dining',
  'Supermarkets': 'Food & Dining',
  'Groceries': 'Food & Dining',
  'Merchandise': 'Shopping',
  'Department Stores': 'Shopping',
  'Services': 'Bills & Utilities',
  'Travel': 'Transportation',
  'Gas': 'Transportation',
  'Automotive': 'Transportation',
  'Medical Services': 'Health & Fitness',
  'Pharmacy': 'Health & Fitness',
  'Entertainment': 'Entertainment',
  'Payments and Credits': '__SKIP__',
  'Awards and Rebate Credits': '__SKIP__',
};

// Pattern-based rules for First Bank (no category in export)
const DESCRIPTION_PATTERNS: Array<{ pattern: RegExp; category: string }> = [
  // Food & Dining
  { pattern: /chipotle|in-n-out|mcdonald|starbucks|dunkin|panera|subway|chick-fil-a|wendy|taco bell|pizza|restaurant|cafe|diner|grubhub|doordash|uber eats|postmates/i, category: 'Food & Dining' },
  { pattern: /costco whse|safeway|albertsons|kroger|trader joe|whole foods|fry's food|sprouts|grocery/i, category: 'Food & Dining' },

  // Transportation
  { pattern: /costco gas|shell|chevron|exxon|mobil|arco|circle k|quicktrip|gas station|fuel/i, category: 'Transportation' },
  { pattern: /uber(?! eats)|lyft|taxi|parking|toll|dmv|vehicle/i, category: 'Transportation' },

  // Bills & Utilities
  { pattern: /openai|chatgpt|midjourney|anthropic|claude|cursor|github|vercel|netlify|aws|azure|google cloud/i, category: 'Bills & Utilities' },
  { pattern: /netflix|spotify|hulu|disney\+|hbo|apple music|youtube premium|amazon prime/i, category: 'Bills & Utilities' },
  { pattern: /electric|water|sewer|internet|comcast|cox|centurylink|t-mobile|verizon|at&t|phone/i, category: 'Bills & Utilities' },
  { pattern: /insurance|geico|state farm|allstate|progressive/i, category: 'Bills & Utilities' },

  // Shopping
  { pattern: /amazon|target|walmart|best buy|home depot|lowes|ikea|costco(?! gas)/i, category: 'Shopping' },
  { pattern: /apple\.com|ebay|etsy|shopify/i, category: 'Shopping' },

  // Entertainment
  { pattern: /amc|regal|cinemark|movie|theater|concert|ticketmaster|stubhub|xbox|playstation|steam|nintendo/i, category: 'Entertainment' },

  // Health & Fitness
  { pattern: /gym|fitness|planet fitness|la fitness|orangetheory|cvs|walgreens|pharmacy|doctor|medical|dental|vision|hospital/i, category: 'Health & Fitness' },

  // Personal Care
  { pattern: /salon|barber|spa|massage|nail|beauty|sephora|ulta/i, category: 'Personal Care' },
];

// Skip patterns (internal transfers, interest, etc.)
const SKIP_PATTERNS: RegExp[] = [
  /^transfer\s*#/i,
  /^internet transfer/i,
  /^interest earned/i,
  /^e-payment/i,
  /^directpay/i,
];

/**
 * Map Discover's category to our budget category
 */
export function mapDiscoverCategory(discoverCategory: string): string | null {
  const mapped = DISCOVER_CATEGORY_MAP[discoverCategory];
  if (mapped === '__SKIP__') return null;
  return mapped || 'Other';
}

/**
 * Map First Bank transaction to category based on description
 */
export function mapFirstBankCategory(description: string, type?: string): string | null {
  // Check skip patterns first
  for (const pattern of SKIP_PATTERNS) {
    if (pattern.test(description)) return null;
  }

  // Check if it's a transfer type
  if (type === 'TRANSFER' || type === 'INTEREST') {
    return null;
  }

  // Match against description patterns
  for (const { pattern, category } of DESCRIPTION_PATTERNS) {
    if (pattern.test(description)) {
      return category;
    }
  }

  return 'Other';
}

/**
 * Check if a transaction should be skipped (internal transfer, payment, etc.)
 */
export function shouldSkipTransaction(description: string, type?: string, category?: string): boolean {
  // Skip if Discover category is payment/credit
  if (category && DISCOVER_CATEGORY_MAP[category] === '__SKIP__') {
    return true;
  }

  // Skip transfers and interest
  if (type === 'TRANSFER' || type === 'INTEREST' || type === 'EFT') {
    // But don't skip if it looks like a real payment
    if (!/^e-payment|^directpay/i.test(description)) {
      return true;
    }
  }

  // Skip based on description patterns
  for (const pattern of SKIP_PATTERNS) {
    if (pattern.test(description)) return true;
  }

  return false;
}
