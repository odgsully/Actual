# Integration Tests - GSRealty Client Management System

## Overview

Comprehensive integration tests for the GSRealty Client Management System covering API endpoints, workflows, authentication, and database operations.

## Test Coverage

### 1. API Endpoint Tests (`api/`)

#### Client Management API (`client-management.test.ts`)
- ✅ GET `/api/admin/clients` - List all clients
- ✅ POST `/api/admin/clients` - Create new client
- ✅ GET `/api/admin/clients/[id]` - Get client by ID
- ✅ PATCH `/api/admin/clients/[id]` - Update client
- ✅ DELETE `/api/admin/clients/[id]` - Delete client
- ✅ Client search functionality
- ✅ Authentication & authorization
- ✅ Validation & error handling

**Test Count:** 20+ tests

### 2. Workflow Tests (`workflows/`)

#### File Upload Workflow (`file-upload.test.ts`)
- ✅ CSV file processing
- ✅ File validation (type, size)
- ✅ Subject property distance calculations
- ✅ Template generation
- ✅ Complete upload-process-store workflow
- ✅ Error handling for malformed files

**Test Count:** 15+ tests

#### MCAO Integration Workflow (`mcao-integration.test.ts`)
- ✅ APN lookup with validation
- ✅ Database caching
- ✅ Cache bypass (refresh)
- ✅ Property retrieval
- ✅ Cache deletion
- ✅ Complete lookup-cache-retrieve-delete workflow
- ✅ Cache statistics

**Test Count:** 18+ tests

#### Invitation Workflow (`invitation-workflow.test.ts`)
- ✅ Send invitation
- ✅ Token verification
- ✅ Resend invitation
- ✅ Security (UUID v4 tokens, expiration)
- ✅ Complete send-verify-setup workflow
- ✅ Edge cases (expired tokens, invalid tokens)

**Test Count:** 16+ tests

#### Authentication Flow (`authentication.test.ts`)
- ✅ User sign up
- ✅ User sign in
- ✅ User sign out
- ✅ Session management
- ✅ Protected route access
- ✅ Admin role verification
- ✅ Password reset
- ✅ Email verification
- ✅ Token expiration
- ✅ Complete authentication workflow

**Test Count:** 25+ tests

### 3. Database Tests (`database/`)

#### Database Operations (`operations.test.ts`)
- ✅ CRUD operations on all tables
- ✅ Filtering & searching
- ✅ Ordering & pagination
- ✅ Constraints & validation
- ✅ Auto-generated fields (UUIDs, timestamps)
- ✅ Batch operations
- ✅ Connection handling

**Tables Tested:**
- `gsrealty_clients`
- `gsrealty_users`
- `gsrealty_invitations`
- `mcao_property_cache`

**Test Count:** 28+ tests

## Total Test Count

**122+ integration tests** covering all critical system components.

## Running Tests

### Prerequisites

1. **Environment Variables**
   Ensure `.env.local` is configured with:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_key
   ADMIN_USERNAME=gbsullivan@mac.com
   ```

2. **Database Setup**
   - Supabase instance must be running
   - All tables must be created
   - Admin user must exist in database

3. **Development Server (Optional)**
   Some tests require the Next.js dev server:
   ```bash
   npm run dev
   ```

### Run All Integration Tests

```bash
npm run test:integration
```

### Run Specific Test Suites

```bash
# Client management only
npm run test:integration -- client-management

# File upload workflow
npm run test:integration -- file-upload

# MCAO integration
npm run test:integration -- mcao-integration

# Invitation workflow
npm run test:integration -- invitation-workflow

# Authentication
npm run test:integration -- authentication

# Database operations
npm run test:integration -- operations
```

### Watch Mode

```bash
npm run test:integration:watch
```

### Run All Tests (Unit + Integration + E2E)

```bash
npm run test:all
```

## Test Structure

```
__tests__/integration/
├── README.md                           # This file
├── setup.ts                            # Test utilities and configuration
├── run-integration-tests.ts            # Test runner
├── api/
│   └── client-management.test.ts       # API endpoint tests
├── workflows/
│   ├── file-upload.test.ts             # File upload workflow tests
│   ├── mcao-integration.test.ts        # MCAO integration tests
│   ├── invitation-workflow.test.ts     # Invitation workflow tests
│   └── authentication.test.ts          # Auth workflow tests
└── database/
    └── operations.test.ts              # Database operation tests
```

## Test Utilities

### Authentication Helpers

```typescript
import { getAdminSession, createTestUserSession, signOut } from '../setup';

// Get admin session
const adminSession = await getAdminSession();

// Create test user
const userSession = await createTestUserSession();

// Sign out
await signOut();
```

### HTTP Request Helpers

```typescript
import { makeRequest, makeFormDataRequest } from '../setup';

// Make API request
const response = await makeRequest('/api/admin/clients', {
  method: 'POST',
  body: { /* data */ },
  accessToken: adminSession.accessToken,
});

// Upload file
const formData = new FormData();
formData.append('file', file);
const response = await makeFormDataRequest(
  '/api/admin/upload/process',
  formData,
  accessToken
);
```

### Test Data Generators

```typescript
import { generateTestClient, generateTestUser } from '../setup';

// Generate test client
const testClient = generateTestClient({
  email: 'custom@test.com',
});

// Generate test user
const testUser = generateTestUser();
```

### Database Operations

```typescript
import { supabaseAdmin, supabaseAnon } from '../setup';

// Admin operations (bypass RLS)
const { data, error } = await supabaseAdmin
  .from('gsrealty_clients')
  .select('*');

// Anonymous operations (with RLS)
const { data, error } = await supabaseAnon
  .from('gsrealty_clients')
  .select('*');
```

### Cleanup

```typescript
import { cleanupTestData, registerTestData } from '../setup';

// Register for cleanup
registerTestData('client', clientId);
registerTestData('file', fileId);
registerTestData('invitation', invitationId);
registerTestData('user', userId);

// Clean up
await cleanupTestData({
  clientIds: [clientId],
  fileIds: [fileId],
  invitationIds: [invitationId],
  userIds: [userId],
});
```

## Mock Data

### MCAO Response

```typescript
import { MOCK_MCAO_RESPONSE } from '../setup';

// Use in tests
const mockData = MOCK_MCAO_RESPONSE;
```

### CSV Data

```typescript
import { MOCK_CSV_DATA } from '../setup';

// Create CSV blob
const csvBlob = new Blob([MOCK_CSV_DATA], { type: 'text/csv' });
```

## Best Practices

### 1. Test Isolation

Each test should be independent and not rely on state from other tests:

```typescript
beforeEach(() => {
  resetTestDataIds();
});

afterAll(async () => {
  await cleanupTestData(testDataIds);
});
```

### 2. Use Descriptive Test Names

```typescript
it('should return 401 for unauthenticated requests', async () => {
  // Test implementation
});
```

### 3. Test Both Success and Failure Cases

```typescript
// Success case
it('should create client with valid data', async () => { /* ... */ });

// Failure cases
it('should reject invalid email format', async () => { /* ... */ });
it('should return 404 for non-existent client', async () => { /* ... */ });
```

### 4. Clean Up Test Data

Always clean up test data in `afterAll` or `afterEach`:

```typescript
afterAll(async () => {
  await cleanupTestData({ clientIds: [testClientId] });
});
```

### 5. Use Realistic Data

Use test data generators to create realistic test data:

```typescript
const testClient = generateTestClient({
  email: `test-${Date.now()}@test.com`,
});
```

## Troubleshooting

### Tests Timing Out

- Increase timeout in `jest.integration.config.js`
- Check database connection
- Ensure dev server is running (if needed)

### Authentication Errors

- Verify `.env.local` has correct Supabase credentials
- Check admin user exists in database
- Ensure user has admin role

### Database Errors

- Check Supabase instance is running
- Verify all tables exist
- Check RLS policies are applied

### Cleanup Issues

- Manually clean test data: `await cleanupAllTestData()`
- Check foreign key constraints
- Verify permissions

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Integration Tests

on: [push, pull_request]

jobs:
  integration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:integration
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
```

## Performance

- **Average test execution time:** 2-5 minutes
- **Tests run sequentially:** To avoid database conflicts
- **Cleanup:** Automatic after each test suite

## Contributing

When adding new integration tests:

1. Create test file in appropriate directory
2. Import setup utilities
3. Add cleanup in `afterAll`
4. Use descriptive test names
5. Test both success and failure cases
6. Update this README with new coverage

## Support

For issues or questions:
- Check troubleshooting section
- Review test logs
- Contact: Garrett Sullivan (gbsullivan@mac.com)
