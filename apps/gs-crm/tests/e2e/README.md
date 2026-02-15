# End-to-End Testing Suite for GSRealty Client Management System

## Overview

This E2E test suite provides comprehensive browser-based testing for the GSRealty Client Management System using Playwright. The tests cover all major user workflows for both Admin and Client portals.

## Test Coverage

### Admin Workflows (61 tests)
- **Authentication** (15 tests)
  - Sign in with valid/invalid credentials
  - Sign out functionality
  - Session persistence
  - Protected route access
  - Role-based authorization

- **Client Management** (12 tests)
  - View client list
  - Add new clients
  - Edit existing clients
  - Delete clients
  - Search and filter clients
  - View client details

- **File Upload** (14 tests)
  - CSV file uploads
  - XLSX file uploads
  - Drag and drop functionality
  - File validation
  - Upload progress tracking
  - Client selection requirement

- **MCAO Lookup** (20 tests)
  - APN search functionality
  - Property details display
  - Link property to client
  - Search history
  - Cached results
  - Error handling

### Client Workflows (49 tests)
- **Authentication** (9 tests)
  - Sign in/sign out
  - Session persistence
  - Protected routes

- **Dashboard** (18 tests)
  - Statistics display
  - Quick actions
  - Recent activity
  - Responsive design
  - Dashboard widgets

- **Properties** (22 tests)
  - Property listing (grid/list views)
  - Search and filters
  - Favorite properties
  - Property details
  - Pagination and sorting

### Shared Tests (24 tests)
- **Files** (16 tests)
  - File list display
  - File downloads
  - Search and filters
  - Sorting options

- **Profile** (8 tests)
  - View/edit profile
  - Change password
  - Account settings

### Email Invitation Flow (16 tests)
- Send invitation
- Token validation
- Account setup
- Password creation
- Auto sign-in

## Total Test Scenarios: 150+ tests

## Prerequisites

1. **Server Running**: The development server must be running on port 3004
   ```bash
   npm run dev
   ```

2. **Database**: Supabase must be configured with:
   - Admin user: gbsullivan@mac.com / chicago1
   - Test client user (optional for some tests)

3. **Browsers**: Playwright will automatically install browsers on first run
   ```bash
   npx playwright install
   ```

## Running Tests

### All Tests
```bash
npm run test:e2e
```

### Specific Test File
```bash
npx playwright test admin/auth.spec.ts
```

### Specific Test
```bash
npx playwright test -g "should successfully sign in"
```

### With UI Mode (Interactive)
```bash
npx playwright test --ui
```

### Debug Mode
```bash
npx playwright test --debug
```

### Single Browser
```bash
npx playwright test --project=chromium
```

### Headed Mode (See Browser)
```bash
npx playwright test --headed
```

## Test Organization

```
tests/e2e/
├── admin/                  # Admin portal tests
│   ├── auth.spec.ts       # Admin authentication
│   ├── client-management.spec.ts
│   ├── file-upload.spec.ts
│   └── mcao-lookup.spec.ts
├── client/                 # Client portal tests
│   ├── auth.spec.ts
│   ├── dashboard.spec.ts
│   ├── properties.spec.ts
│   ├── files.spec.ts
│   └── profile.spec.ts
├── invitation/             # Email invitation flow
│   └── setup-flow.spec.ts
├── shared/                 # Shared functionality
│   └── navigation.spec.ts
└── helpers/                # Test utilities
    ├── auth.ts            # Authentication helpers
    ├── navigation.ts      # Navigation helpers
    └── data.ts            # Test data generators
```

## Test Helpers

### Authentication
```typescript
import { signInAsAdmin, signInAsClient, signOut } from '../helpers/auth';

// Sign in as admin
await signInAsAdmin(page);

// Sign in as client
await signInAsClient(page, email, password);

// Sign out
await signOut(page);
```

### Navigation
```typescript
import { navigateToAdminClients } from '../helpers/navigation';

// Navigate to admin clients page
await navigateToAdminClients(page);
```

### Test Data
```typescript
import { generateTestClient } from '../helpers/data';

// Generate test client data
const client = generateTestClient();
```

## Configuration

The test configuration is in `playwright.config.ts`:

- **Base URL**: http://localhost:3004
- **Timeout**: 60 seconds per test
- **Retries**: 2 on CI, 0 locally
- **Workers**: 1 on CI, parallel locally
- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari, iPad

## Reports

### HTML Report
After running tests, view the report:
```bash
npx playwright show-report
```

### JSON Report
Results are saved to `test-results.json`

### Screenshots and Videos
- Screenshots: Taken on failure
- Videos: Recorded on failure
- Location: `test-results/` directory

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright Browsers
  run: npx playwright install --with-deps

- name: Run dev server
  run: npm run dev &

- name: Run E2E tests
  run: npm run test:e2e
```

## Debugging Tests

### 1. Use Playwright Inspector
```bash
npx playwright test --debug
```

### 2. Add Console Logs
```typescript
test('my test', async ({ page }) => {
  console.log('Current URL:', page.url());
  await page.screenshot({ path: 'debug.png' });
});
```

### 3. Slow Down Execution
```typescript
test('my test', async ({ page }) => {
  await page.pause(); // Opens inspector
});
```

### 4. Use --headed Mode
```bash
npx playwright test --headed --slow-mo=1000
```

## Best Practices

1. **Unique Test Data**: Use `generateTestClient()` to create unique test data
2. **Clean State**: Each test starts fresh with `beforeEach` hooks
3. **Wait Strategies**: Use `waitForLoadState('networkidle')` for reliable timing
4. **Selectors**: Prefer test IDs, then ARIA labels, then text content
5. **Assertions**: Use Playwright's auto-waiting assertions
6. **Error Handling**: Tests are defensive with conditional checks

## Known Issues

1. **Server Startup**: Tests require dev server running on port 3004
2. **Test Data**: Some tests create data that persists in database
3. **Timing**: Adjust `WAIT_TIMES` in `helpers/data.ts` if tests are flaky
4. **Browser Support**: Safari may have different timing characteristics

## Test Maintenance

### Adding New Tests
1. Create test file in appropriate directory
2. Import helpers from `../helpers/`
3. Follow existing test patterns
4. Use descriptive test names
5. Group related tests with `describe` blocks

### Updating Selectors
When UI changes, update selectors in test files:
- Check for `data-testid` attributes first
- Use semantic selectors (roles, labels)
- Avoid brittle selectors (classes, deep nesting)

## Performance

- **Fast Tests**: Auth tests (~100ms each)
- **Medium Tests**: Form tests (~500ms each)
- **Slow Tests**: File upload tests (~5s each)
- **Full Suite**: ~15-20 minutes (all browsers)
- **Single Browser**: ~5-7 minutes

## Troubleshooting

### Tests Timing Out
- Increase timeout in `playwright.config.ts`
- Check if server is running
- Verify database connectivity

### Flaky Tests
- Add explicit waits: `await page.waitForTimeout(500)`
- Use `waitForLoadState('networkidle')`
- Check for race conditions

### Tests Failing
- Run in headed mode: `--headed`
- Use debug mode: `--debug`
- Check screenshots in `test-results/`
- Review console logs

## Contact

For questions or issues with the E2E test suite:
- Check existing test files for examples
- Review Playwright documentation: https://playwright.dev
- Update test helpers for reusable functionality
