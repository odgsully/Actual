/**
 * Integration Test Setup
 *
 * Sets up test environment, utilities, and cleanup for integration tests
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

// ============================================================================
// Test Configuration
// ============================================================================

export const TEST_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3004',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  adminEmail: process.env.ADMIN_USERNAME || 'gbsullivan@mac.com',
  testTimeout: 30000, // 30 seconds
};

// Validate required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// ============================================================================
// Supabase Clients
// ============================================================================

export const supabaseAnon = createClient(
  TEST_CONFIG.supabaseUrl,
  TEST_CONFIG.supabaseAnonKey
);

export const supabaseAdmin = createClient(
  TEST_CONFIG.supabaseUrl,
  TEST_CONFIG.supabaseServiceKey
);

// ============================================================================
// Test Data Generators
// ============================================================================

export const generateTestClient = (override?: Partial<any>) => ({
  first_name: `Test${Math.random().toString(36).substring(7)}`,
  last_name: `Client${Math.random().toString(36).substring(7)}`,
  email: `test${Math.random().toString(36).substring(7)}@test.com`,
  phone: '555-1234',
  address: '123 Test St, Phoenix, AZ 85001',
  property_address: '456 Property Ave, Scottsdale, AZ 85250',
  notes: 'Test client for integration tests',
  ...override,
});

export const generateTestUser = (override?: Partial<any>) => ({
  email: `testuser${Math.random().toString(36).substring(7)}@test.com`,
  password: 'TestPassword123!',
  ...override,
});

// ============================================================================
// Authentication Utilities
// ============================================================================

export interface AuthSession {
  user: any;
  session: any;
  accessToken: string;
  refreshToken: string;
}

/**
 * Create admin user session for testing
 */
export async function getAdminSession(): Promise<AuthSession | null> {
  try {
    // Sign in as admin
    const { data, error } = await supabaseAnon.auth.signInWithPassword({
      email: TEST_CONFIG.adminEmail,
      password: 'TestPassword123!', // This should match your test setup
    });

    if (error || !data.session) {
      console.error('Admin sign in failed:', error);
      return null;
    }

    return {
      user: data.user,
      session: data.session,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  } catch (error) {
    console.error('Failed to get admin session:', error);
    return null;
  }
}

/**
 * Create test user and return session
 */
export async function createTestUserSession(
  email?: string,
  password?: string
): Promise<AuthSession | null> {
  try {
    const testEmail = email || generateTestUser().email;
    const testPassword = password || 'TestPassword123!';

    // Create user with admin client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      console.error('Failed to create test user:', authError);
      return null;
    }

    // Sign in to get session
    const { data: signInData, error: signInError } = await supabaseAnon.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (signInError || !signInData.session) {
      console.error('Failed to sign in test user:', signInError);
      return null;
    }

    return {
      user: signInData.user,
      session: signInData.session,
      accessToken: signInData.session.access_token,
      refreshToken: signInData.session.refresh_token,
    };
  } catch (error) {
    console.error('Failed to create test user session:', error);
    return null;
  }
}

/**
 * Sign out current user
 */
export async function signOut() {
  await supabaseAnon.auth.signOut();
}

// ============================================================================
// HTTP Request Utilities
// ============================================================================

export interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  accessToken?: string;
}

/**
 * Make authenticated API request
 */
export async function makeRequest(
  endpoint: string,
  options: RequestOptions = {}
): Promise<Response> {
  const {
    method = 'GET',
    headers = {},
    body,
    accessToken,
  } = options;

  const url = `${TEST_CONFIG.baseUrl}${endpoint}`;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (accessToken) {
    requestHeaders['Authorization'] = `Bearer ${accessToken}`;
  }

  const requestOptions: RequestInit = {
    method,
    headers: requestHeaders,
  };

  if (body) {
    requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  return fetch(url, requestOptions);
}

/**
 * Make form data request (for file uploads)
 */
export async function makeFormDataRequest(
  endpoint: string,
  formData: FormData,
  accessToken?: string
): Promise<Response> {
  const url = `${TEST_CONFIG.baseUrl}${endpoint}`;

  const headers: Record<string, string> = {};
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  return fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });
}

// ============================================================================
// Database Cleanup Utilities
// ============================================================================

export const TEST_TABLES = [
  'gsrealty_clients',
  'gsrealty_files',
  'gsrealty_invitations',
  'mcao_property_cache',
  'gsrealty_users',
] as const;

/**
 * Clean up test data from database
 */
export async function cleanupTestData(testIds: {
  clientIds?: string[];
  fileIds?: string[];
  invitationIds?: string[];
  userIds?: string[];
}) {
  const { clientIds = [], fileIds = [], invitationIds = [], userIds = [] } = testIds;

  try {
    // Delete test clients
    if (clientIds.length > 0) {
      await supabaseAdmin
        .from('gsrealty_clients')
        .delete()
        .in('id', clientIds);
    }

    // Delete test files
    if (fileIds.length > 0) {
      await supabaseAdmin
        .from('gsrealty_files')
        .delete()
        .in('id', fileIds);
    }

    // Delete test invitations
    if (invitationIds.length > 0) {
      await supabaseAdmin
        .from('gsrealty_invitations')
        .delete()
        .in('id', invitationIds);
    }

    // Delete test users (auth users)
    for (const userId of userIds) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
    }

    console.log('Test data cleaned up successfully');
  } catch (error) {
    console.error('Failed to clean up test data:', error);
  }
}

/**
 * Clean up all test data (use with caution!)
 */
export async function cleanupAllTestData() {
  try {
    // Delete test clients (those with email containing 'test')
    await supabaseAdmin
      .from('gsrealty_clients')
      .delete()
      .ilike('email', '%test%');

    // Delete test invitations
    await supabaseAdmin
      .from('gsrealty_invitations')
      .delete()
      .ilike('email', '%test%');

    console.log('All test data cleaned up successfully');
  } catch (error) {
    console.error('Failed to clean up all test data:', error);
  }
}

// ============================================================================
// Mock Data
// ============================================================================

export const MOCK_MCAO_RESPONSE = {
  apn: '123-45-678A',
  ownerName: 'John Doe',
  propertyAddress: {
    fullAddress: '123 Main St, Phoenix, AZ 85001',
    streetNumber: '123',
    streetName: 'Main',
    streetType: 'St',
    city: 'Phoenix',
    state: 'AZ',
    zipCode: '85001',
  },
  assessedValue: {
    total: 350000,
    land: 100000,
    improvements: 250000,
  },
  taxInfo: {
    taxAmount: 3500,
    taxYear: 2024,
  },
  propertyDetails: {
    yearBuilt: 1995,
    squareFeet: 2000,
    bedrooms: 3,
    bathrooms: 2,
  },
};

export const MOCK_CSV_DATA = `Address,City,State,Zip,Price,Beds,Baths,SqFt,YearBuilt,Status
123 Main St,Phoenix,AZ,85001,350000,3,2,2000,1995,Active
456 Oak Ave,Scottsdale,AZ,85250,450000,4,3,2500,2000,Active
789 Pine Rd,Tempe,AZ,85281,275000,2,2,1500,1990,Pending`;

// ============================================================================
// Test Lifecycle Hooks
// ============================================================================

let testDataIds: {
  clientIds: string[];
  fileIds: string[];
  invitationIds: string[];
  userIds: string[];
} = {
  clientIds: [],
  fileIds: [],
  invitationIds: [],
  userIds: [],
};

/**
 * Register test data for cleanup
 */
export function registerTestData(
  type: 'client' | 'file' | 'invitation' | 'user',
  id: string
) {
  switch (type) {
    case 'client':
      testDataIds.clientIds.push(id);
      break;
    case 'file':
      testDataIds.fileIds.push(id);
      break;
    case 'invitation':
      testDataIds.invitationIds.push(id);
      break;
    case 'user':
      testDataIds.userIds.push(id);
      break;
  }
}

/**
 * Global setup
 */
export async function globalSetup() {
  console.log('🚀 Starting integration tests...');
  console.log('Base URL:', TEST_CONFIG.baseUrl);
  console.log('Supabase URL:', TEST_CONFIG.supabaseUrl);
}

/**
 * Global teardown
 */
export async function globalTeardown() {
  console.log('🧹 Cleaning up test data...');
  await cleanupTestData(testDataIds);
  console.log('✅ Integration tests complete');
}

/**
 * Reset test data IDs (call in beforeEach)
 */
export function resetTestDataIds() {
  testDataIds = {
    clientIds: [],
    fileIds: [],
    invitationIds: [],
    userIds: [],
  };
}

// ============================================================================
// Exports
// ============================================================================

export default {
  TEST_CONFIG,
  supabaseAnon,
  supabaseAdmin,
  generateTestClient,
  generateTestUser,
  getAdminSession,
  createTestUserSession,
  signOut,
  makeRequest,
  makeFormDataRequest,
  cleanupTestData,
  cleanupAllTestData,
  registerTestData,
  globalSetup,
  globalTeardown,
  resetTestDataIds,
  MOCK_MCAO_RESPONSE,
  MOCK_CSV_DATA,
};
