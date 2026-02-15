# Quick Start Guide - Subject Property Tests

## ⚡ Run Tests Now

```bash
npm test -- app/api/admin/upload/__tests__/subject-property-generation.test.ts
```

**Expected Output**:
```
Test Suites: 1 passed, 1 total
Tests:       14 passed, 14 total
Time:        ~8 seconds
```

---

## 📋 What Gets Tested

### ✅ Subject Property Appears in BOTH Sheets
- Full-MCAO-API sheet (Row 2, Column B)
- Analysis sheet (Row 2, Column A)

### ✅ MCAO Data Fields
- SELLER_BASIS (Column I) from Owner_SalePrice
- SELLER_BASIS_DATE (Column J) from Owner_SaleDate

### ✅ MLS Data Fields
- CANCEL_DATE (Column V) from Cancel Date
- UC_DATE (Column W) from Under Contract Date

### ✅ Edge Cases
- Subject Property without APN
- Subject Property without MCAO data
- Subject Property + multiple MLS comps

---

## 🎯 Test Scenarios (14 Total)

| # | Test | Duration | Status |
|---|------|----------|--------|
| 1 | Subject in Full-MCAO-API row 2 | ~720ms | ✅ |
| 2 | Subject WITHOUT APN in Full-MCAO-API | ~573ms | ✅ |
| 3 | Subject full address in column A | ~548ms | ✅ |
| 4 | Subject APN in column C | ~523ms | ✅ |
| 5 | Subject in Analysis row 2 | ~529ms | ✅ |
| 6 | SELLER_BASIS from MCAO | ~526ms | ✅ |
| 7 | SELLER_BASIS_DATE from MCAO | ~538ms | ✅ |
| 8 | Subject without MLS data | ~537ms | ✅ |
| 9 | Subject + 3 MLS comps | ~533ms | ✅ |
| 10 | CANCEL_DATE from MLS | ~529ms | ✅ |
| 11 | UC_DATE from MLS | ~529ms | ✅ |
| 12 | Subject without MCAO data | ~520ms | ✅ |
| 13 | Empty MLS dates for Subject | ~528ms | ✅ |
| 14 | Coverage summary | ~25ms | ✅ |

**Total**: 8 seconds

---

## 📖 Documentation

- **README.md**: Full documentation (254 lines)
- **TEST_EXECUTION_REPORT.md**: Detailed test results (387 lines)
- **DELIVERABLE_SUMMARY.md**: Complete deliverable summary

---

## 🔍 Quick Verification

After running tests, you should see:

```
✅ Subject Property Verification:
   - Subject Property in Full-MCAO-API (row 2, column B)
   - Subject Property in Analysis (row 2, column A)
   - Subject Property WITH APN
   - Subject Property WITHOUT APN
   - Subject Property + multiple MLS comps

✅ MCAO Data Population (SELLER_BASIS):
   - Column I (SELLER_BASIS) from Owner_SalePrice
   - Column J (SELLER_BASIS_DATE) from Owner_SaleDate

✅ MLS Data Population (Dates):
   - Column V (CANCEL_DATE) from Cancel Date
   - Column W (UC_DATE) from Under Contract Date

✅ Edge Cases:
   - Subject Property without MCAO data
   - Subject Property without APN
   - Empty CANCEL_DATE/UC_DATE for Subject Property

ALL TESTS PASSED - Subject Property generation verified!
```

---

## 🐛 Troubleshooting

### Test Fails: Template Not Found
```bash
Error: Template file not found
```
**Fix**: Update `TEMPLATE_PATH` in test file (line 31)

### Test Timeout
```bash
Timeout - Async callback was not invoked
```
**Fix**: Tests already set to 120s timeout, should not occur

### All Tests Fail
```bash
Multiple test failures
```
**Fix**: Check that template file exists and contains required sheets

---

## 🚀 Next Steps

1. **Review Results**: Check console output for ✅ marks
2. **Read Docs**: See `README.md` for detailed documentation
3. **Commit Code**: Tests are ready for production
4. **Add to CI/CD**: Integrate into automated pipeline

---

**Quick Start Created**: October 24, 2025
**Status**: Ready to Run ✅
