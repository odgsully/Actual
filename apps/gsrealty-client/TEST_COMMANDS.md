# GSRealty Client - Unit Test Commands

## Quick Reference

### Run All Unit Tests
```bash
npm test -- lib/validation/__tests__/ lib/types/__tests__/ lib/database/__tests__/
```

### Run with Coverage
```bash
npm test -- lib/validation/__tests__/ lib/types/__tests__/ lib/database/__tests__/ --coverage
```

### Run Specific Test Suite
```bash
# Validation tests
npm test -- lib/validation/__tests__/upload-schema.test.ts

# MLS data type tests
npm test -- lib/types/__tests__/mls-data.test.ts

# MCAO data type tests
npm test -- lib/types/__tests__/mcao-data.test.ts

# Database clients tests
npm test -- lib/database/__tests__/clients.test.ts

# Database files tests
npm test -- lib/database/__tests__/files.test.ts

# Database MCAO tests
npm test -- lib/database/__tests__/mcao.test.ts
```

### Watch Mode (Auto-run on file changes)
```bash
npm test -- lib/validation/__tests__/ lib/types/__tests__/ lib/database/__tests__/ --watch
```

### Verbose Output
```bash
npm test -- lib/validation/__tests__/ lib/types/__tests__/ lib/database/__tests__/ --verbose
```

### Run Only Failed Tests
```bash
npm test -- lib/validation/__tests__/ lib/types/__tests__/ lib/database/__tests__/ --onlyFailures
```

## Test Files Location

```
apps/gsrealty-client/
├── lib/
│   ├── validation/
│   │   └── __tests__/
│   │       └── upload-schema.test.ts (37 tests)
│   ├── types/
│   │   └── __tests__/
│   │       ├── mls-data.test.ts (59 tests)
│   │       └── mcao-data.test.ts (51 tests)
│   └── database/
│       └── __tests__/
│           ├── clients.test.ts (25 tests)
│           ├── files.test.ts (16 tests)
│           └── mcao.test.ts (17 tests)
```

## Current Test Statistics

- **Total Test Suites:** 6
- **Total Tests:** 179
- **Overall Line Coverage:** 81%
- **Function Coverage:** 88%
- **All Tests:** ✅ PASSING

## Coverage by Module

| Module | Statements | Branches | Functions | Lines |
|--------|-----------|----------|-----------|-------|
| **validation/** | 100% | 88.88% | 100% | 100% |
| **types/** | 100% | 98.3% | 100% | 100% |
| **database/clients.ts** | 95.12% | 68.42% | 100% | 100% |
| **database/files.ts** | 57.04% | 25.58% | 73.33% | 60.71% |
| **database/mcao.ts** | 72.72% | 51.02% | 77.77% | 76.23% |

## Integration with CI/CD

### GitHub Actions
```yaml
- name: Run Unit Tests
  run: |
    cd apps/gsrealty-client
    npm test -- lib/validation/__tests__/ lib/types/__tests__/ lib/database/__tests__/ --coverage
```

### Pre-commit Hook
```bash
#!/bin/bash
cd apps/gsrealty-client
npm test -- lib/validation/__tests__/ lib/types/__tests__/ lib/database/__tests__/ --silent
```

## Troubleshooting

### Module Resolution Errors
If you see errors about `@/lib/...` paths, ensure `jest.config.js` has:
```javascript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/$1',
}
```

### Integration Tests Running
To exclude integration tests:
```javascript
// jest.config.js
testPathIgnorePatterns: [
  '/node_modules/',
  '/__tests__/integration/',
],
```

### Coverage Not Generating
Ensure you're running from the correct directory:
```bash
cd /Users/garrettsullivan/Desktop/AUTOMATE/Vibe\ Code/Wabbit/clients/sullivan_realestate/Actual/apps/gsrealty-client
npm test -- lib/validation/__tests__/ lib/types/__tests__/ lib/database/__tests__/ --coverage
```

## Next Steps

### For Agent N (Integration Tests)
Run integration tests separately:
```bash
npm run test:integration
```

### For Agent O (E2E Tests)
Run E2E tests with Playwright:
```bash
npm run test:e2e
```

### Run All Tests
```bash
npm run test:all
```
