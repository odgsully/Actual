# MCAO Lookup Error Fix - COMPLETE ✅

**Date:** October 17, 2025
**Issue:** "Unknown error occurred" when fetching APN data
**Status:** FIXED - Now shows clear error message

---

## 🐛 Root Cause Analysis

### The Problem

When users entered an APN and clicked "Fetch" on the Upload MLS Data page, they saw:
```
❌ Unknown error occurred
```

### ULTRATHINK Investigation

**Traced the bug through the entire stack:**

1. **Frontend** (`app/admin/upload/page.tsx`):
   - User enters APN and clicks "Fetch"
   - Calls `POST /api/admin/mcao/lookup`
   - Receives error response

2. **API Route** (`app/api/admin/mcao/lookup/route.ts`):
   - Validates APN format ✅
   - Checks database cache (empty) ✅
   - Calls MCAO client library
   - Receives error from client
   - Returns error to frontend

3. **MCAO Client** (`lib/mcao/client.ts`):
   - Fetches from MCAO API: `https://mcassessor.maricopa.gov/api/property/123-45-678`
   - **BUG FOUND HERE** ⚠️

### The Actual Bug

**What we expected:**
- MCAO API returns HTTP 404 with JSON error
- Code catches 404 and shows "Property not found"

**What actually happened:**
- MCAO API returns HTTP **200 OK** with **HTML error page** (not JSON!)
- Content-Type: `text/html;charset=UTF-8`
- Body: `<!DOCTYPE html>...` (full HTML page)
- Code tried to parse HTML as JSON → **JSON parsing error**
- Error message: `"Unexpected token '<', \"<!DOCTYPE \"... is not valid JSON"`
- Generic error handler caught it → **"Unknown error occurred"**

### Why This Happened

The MCAO API endpoint doesn't exist yet, but the server returns:
- Status: 200 OK (not 404!)
- Content-Type: text/html
- Body: HTML error page

Our code assumed:
- Errors would have non-OK status (4xx, 5xx)
- Success responses would be JSON

---

## ✅ The Fix

### Changes Made to `lib/mcao/client.ts`

**Added Content-Type validation** before parsing JSON:

```typescript
// Check if response is actually JSON before parsing
const contentType = response.headers.get('content-type')
if (!contentType || !contentType.includes('application/json')) {
  // MCAO API sometimes returns HTML with 200 status when property not found
  throw new Error(`API_ERROR: API returned non-JSON response (${contentType || 'unknown'}). The MCAO API may be unavailable or the endpoint URL may be incorrect.`)
}

// Try-catch for JSON parsing
let rawData
try {
  rawData = await response.json()
} catch (jsonError) {
  throw new Error(`API_ERROR: Failed to parse API response as JSON. The MCAO API endpoint may be incorrect or unavailable.`)
}
```

**Enhanced error handling** in `handleError()`:

```typescript
} else if (errorMessage.startsWith('API_ERROR')) {
  errorCode = MCAOErrorCode.API_ERROR
  message = 'MCAO API Error'
  details = errorMessage.replace('API_ERROR: ', '')
} else {
  message = 'Unexpected error'
  details = errorMessage
}
```

---

## 📊 Before & After

### Before (Broken)

**User sees:**
```
❌ Unknown error occurred
```

**API Response:**
```json
{
  "success": false,
  "error": "Unknown error occurred",
  "errorCode": "API_ERROR",
  "details": "Unexpected token '<', \"<!DOCTYPE \"... is not valid JSON"
}
```

**User experience:** Confusing, no actionable information

---

### After (Fixed)

**User sees:**
```
❌ MCAO API Error
API returned non-JSON response (text/html;charset=UTF-8).
The MCAO API may be unavailable or the endpoint URL may be incorrect.
```

**API Response:**
```json
{
  "success": false,
  "error": "MCAO API Error",
  "errorCode": "API_ERROR",
  "details": "API returned non-JSON response (text/html;charset=UTF-8). The MCAO API may be unavailable or the endpoint URL may be incorrect."
}
```

**User experience:** Clear explanation of what went wrong and why

---

## 🔍 Technical Details

### Error Flow (After Fix)

1. **Fetch MCAO API:**
   ```
   GET https://mcassessor.maricopa.gov/api/property/123-45-678
   Headers: X-API-Key: cc6f7947-2054-479b-ae49-f3fa1c57f3d8
   ```

2. **MCAO Server Response:**
   ```
   HTTP/1.1 200 OK
   Content-Type: text/html;charset=UTF-8

   <!DOCTYPE html>
   <html>
   <head><title>Page not found...</title></head>
   ...
   ```

3. **Our Code Detects Issue:**
   - Checks `response.ok` → TRUE (200 status)
   - Checks Content-Type → "text/html;charset=UTF-8"
   - **Not JSON!** → Throws descriptive error
   - Does NOT attempt JSON parsing

4. **Error Handler Formats Message:**
   - Recognizes "API_ERROR" prefix
   - Extracts details
   - Returns user-friendly message

5. **Frontend Displays:**
   - Error shown in red box
   - Clear explanation provided

---

## 🎯 Benefits of This Fix

### For Users
- ✅ **Clear error messages** instead of "Unknown error"
- ✅ **Actionable information** (API may be unavailable)
- ✅ **Better UX** - users understand what's wrong

### For Developers
- ✅ **Better debugging** - know immediately it's a content-type issue
- ✅ **Prevents crashes** - no JSON parsing errors
- ✅ **Future-proof** - handles any non-JSON responses

### For Production
- ✅ **Graceful degradation** - doesn't break when API is down
- ✅ **Proper error tracking** - clear error messages in logs
- ✅ **User confidence** - transparent about what's happening

---

## 📝 Files Modified

1. **lib/mcao/client.ts**
   - Added Content-Type validation (lines 210-215)
   - Added try-catch for JSON parsing (lines 217-222)
   - Enhanced error handling in `handleError()` (lines 334-337, 339-340)

---

## ✅ Testing Checklist

- [x] Test with non-existent APN
- [x] Verify clear error message displayed
- [x] Confirm no "Unknown error occurred"
- [x] Check error details are helpful
- [x] Verify doesn't crash with HTML response
- [x] Check Content-Type validation works
- [x] Confirm JSON parsing errors handled

---

## 🚀 Current Behavior

**What happens now when you fetch an APN:**

1. If MCAO API is unavailable or endpoint is wrong:
   - Shows: **"MCAO API Error"**
   - Details: "API returned non-JSON response (text/html;charset=UTF-8). The MCAO API may be unavailable or the endpoint URL may be incorrect."

2. If network error occurs:
   - Shows: **"Network connection failed"**
   - With appropriate details

3. If timeout occurs:
   - Shows: **"Request timed out"**
   - After 30 seconds

4. If property not found (when API works):
   - Shows: **"Property not found"**
   - Details: "No property found for APN XXX-XX-XXX"

---

## 🔮 Future Improvements

When the real MCAO API becomes available:

1. **Update API URL** in `.env.local`:
   ```
   MCAO_API_URL=https://[correct-mcao-api-url]/api
   ```

2. **API should return:**
   - Status: 404 for not found
   - Content-Type: application/json
   - Body: JSON error or success response

3. **Our code will automatically:**
   - Detect JSON responses
   - Parse correctly
   - Show appropriate messages
   - Cache successful responses

---

## 💡 Key Takeaway

**Always validate Content-Type before parsing JSON!**

This prevents:
- JSON parsing errors
- Cryptic error messages
- Unclear user feedback
- Potential crashes

The fix is simple but critical for production reliability.

---

## ✅ Status: Bug Fixed

The MCAO lookup now provides clear, actionable error messages when the API is unavailable. Users understand what's happening and developers can debug issues quickly.

**Test it:**
1. Go to http://localhost:3004/admin/upload
2. Enter any APN (e.g., "123-45-678")
3. Click "Fetch"
4. See clear error message (not "Unknown error occurred")

Server healthy and running with fix applied! ✅
