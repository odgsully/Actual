/**
 * Test Data Helper Functions
 *
 * Provides test data generators and fixtures for E2E tests
 */

/**
 * Generate test client data
 */
export function generateTestClient(suffix: string = Date.now().toString()) {
  return {
    firstName: 'Test',
    lastName: `Client ${suffix}`,
    email: `test-client-${suffix}@example.com`,
    phone: '555-0100',
    address: '123 Test Street',
    city: 'Phoenix',
    state: 'AZ',
    zipCode: '85001',
  };
}

/**
 * Generate multiple test clients
 */
export function generateTestClients(count: number) {
  const clients = [];
  for (let i = 0; i < count; i++) {
    clients.push(generateTestClient(`${Date.now()}-${i}`));
  }
  return clients;
}

/**
 * Admin credentials
 */
export const ADMIN_CREDENTIALS = {
  email: 'gbsullivan@mac.com',
  password: 'chicago1',
};

/**
 * Test client credentials (for pre-created test accounts)
 */
export const TEST_CLIENT_CREDENTIALS = {
  email: 'test-client@example.com',
  password: 'TestPassword123!',
};

/**
 * Sample property data
 */
export function generateTestProperty(suffix: string = Date.now().toString()) {
  return {
    address: `${Math.floor(Math.random() * 10000)} Test Ave ${suffix}`,
    city: 'Phoenix',
    state: 'AZ',
    zipCode: '85001',
    price: Math.floor(Math.random() * 500000) + 200000,
    bedrooms: Math.floor(Math.random() * 4) + 2,
    bathrooms: Math.floor(Math.random() * 3) + 1,
    sqft: Math.floor(Math.random() * 2000) + 1000,
    yearBuilt: Math.floor(Math.random() * 30) + 1990,
    propertyType: 'Single Family',
    status: 'Active',
  };
}

/**
 * Sample APN numbers for MCAO lookup testing
 */
export const TEST_APN_NUMBERS = {
  valid: '123-45-678',
  invalid: '000-00-000',
  malformed: 'invalid-apn',
};

/**
 * File upload test data
 */
export const TEST_FILES = {
  csvPath: './tests/fixtures/test-properties.csv',
  xlsxPath: './tests/fixtures/test-properties.xlsx',
  invalidPath: './tests/fixtures/invalid-file.txt',
};

/**
 * Wait times for various operations (in ms)
 */
export const WAIT_TIMES = {
  short: 500,
  medium: 1000,
  long: 2000,
  fileUpload: 5000,
  mcaoLookup: 3000,
};

/**
 * Generate random string
 */
export function randomString(length: number = 8): string {
  return Math.random().toString(36).substring(2, length + 2);
}

/**
 * Generate random email
 */
export function randomEmail(): string {
  return `test-${randomString()}@example.com`;
}

/**
 * Generate random phone number
 */
export function randomPhone(): string {
  return `555-${Math.floor(Math.random() * 9000) + 1000}`;
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);
}
