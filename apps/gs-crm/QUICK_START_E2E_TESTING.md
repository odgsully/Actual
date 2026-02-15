# Quick Start: E2E Testing

## 🚀 Run Your First Test (5 minutes)

### Step 1: Start the Dev Server
```bash
npm run dev
```

Keep this terminal window open. The server should be running on http://localhost:3004

### Step 2: Open a New Terminal and Run a Single Test
```bash
# Test admin authentication (simplest test)
npx playwright test admin/auth.spec.ts --project=chromium

# Or test with UI mode (interactive)
npx playwright test admin/auth.spec.ts --ui
```

### Step 3: View the Results
```bash
# Open HTML report
npx playwright show-report
```

---

## 📋 Common Test Commands

### Run All Tests
```bash
npm run test:e2e
```

### Run Specific Test Suite
```bash
# Admin tests only
npx playwright test tests/e2e/admin/

# Client tests only
npx playwright test tests/e2e/client/

# Single file
npx playwright test admin/auth.spec.ts
```

### Run Single Test
```bash
npx playwright test -g "should successfully sign in"
```

### Debug Mode (Step Through Tests)
```bash
npx playwright test --debug admin/auth.spec.ts
```

### Watch Mode (See Tests Run)
```bash
npx playwright test --headed --slow-mo=1000 admin/auth.spec.ts
```

---

## 🎯 Quick Test Examples

### Example 1: Test Admin Login
```bash
npx playwright test admin/auth.spec.ts --project=chromium --headed
```

**What it tests:**
- Admin can sign in with valid credentials
- Invalid credentials show error
- Session persists after reload

### Example 2: Test Client Properties
```bash
npx playwright test client/properties.spec.ts --project=chromium --headed
```

**What it tests:**
- Properties display correctly
- Search and filters work
- Users can favorite properties

### Example 3: Test File Upload
```bash
npx playwright test admin/file-upload.spec.ts --project=chromium --headed
```

**What it tests:**
- CSV/XLSX uploads work
- File validation works
- Upload progress displays

---

## 🐛 Troubleshooting

### Problem: Tests timeout
**Solution:** Make sure dev server is running on port 3004
```bash
curl http://localhost:3004/api/health
```

### Problem: Browser not found
**Solution:** Install Playwright browsers
```bash
npx playwright install
```

### Problem: Tests fail with "element not found"
**Solution:** Run in headed mode to see what's happening
```bash
npx playwright test --headed admin/auth.spec.ts
```

---

## 📊 Test Statistics

- **Total Tests**: 185 test scenarios
- **Test Files**: 11 spec files
- **Helper Modules**: 3 files
- **Lines of Code**: 4,115 lines
- **Browsers Tested**: Chrome, Firefox, Safari, Mobile
- **Estimated Run Time**: 5-7 minutes (single browser), 15-20 minutes (all browsers)

---

## 🎓 Learning Resources

### Playwright Docs
- Official Docs: https://playwright.dev
- Test Generator: `npx playwright codegen localhost:3004`
- Trace Viewer: `npx playwright show-trace trace.zip`

### Project-Specific
- Full Documentation: `tests/e2e/README.md`
- Test Summary: `E2E_TESTING_SUMMARY.md`
- Helper Functions: `tests/e2e/helpers/`

---

## 🚦 CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run dev &
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## ✅ Pre-Deployment Checklist

Before deploying to production, run:

```bash
# 1. Start dev server
npm run dev

# 2. Run all E2E tests (in another terminal)
npm run test:e2e

# 3. View report
npx playwright show-report

# 4. Verify all tests passed
# If any tests fail, fix the issues before deploying
```

---

## 🎉 Success!

You've successfully run your first E2E test! The complete test suite covers:
- ✅ Admin Authentication
- ✅ Client Management
- ✅ File Uploads
- ✅ MCAO Lookup
- ✅ Client Portal
- ✅ Property Browsing
- ✅ File Management
- ✅ User Profiles
- ✅ Email Invitations
- ✅ Navigation

**Happy Testing!** 🚀

---

**Need Help?**
- Check `tests/e2e/README.md` for detailed documentation
- Review `E2E_TESTING_SUMMARY.md` for complete test coverage
- Look at existing test files for examples
