#!/bin/bash

# Test upload with log capture
# This script uploads a test file and captures server logs

cd "$(dirname "$0")"

echo "🧪 Testing Breakups Pipeline with Real Upload"
echo "=============================================="
echo ""

# Find or create test file
TEST_FILE="Complete_TestUpload_2025-10-29-1226.xlsx"

if [ ! -f "$TEST_FILE" ]; then
    echo "❌ Test file not found: $TEST_FILE"
    exit 1
fi

echo "📁 Test file: $TEST_FILE"
echo "📊 File size: $(ls -lh "$TEST_FILE" | awk '{print $5}')"
echo ""

# Upload file
echo "📤 Uploading file to API..."
echo ""

curl -X POST http://localhost:3004/api/admin/reportit/upload \
  -F "file=@$TEST_FILE" \
  -F "type=breakups" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -o /tmp/upload-response.json

echo ""
echo "📋 Response saved to: /tmp/upload-response.json"
echo ""
echo "Response:"
cat /tmp/upload-response.json | python3 -m json.tool 2>/dev/null || cat /tmp/upload-response.json
echo ""
