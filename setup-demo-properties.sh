#!/bin/bash

# Setup script to prepare demo properties
# This script runs the migration and seeds the 8 specific properties

echo "🏠 Setting up Demo Properties for Wabbit"
echo "========================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check for required environment variables
if [ ! -f ".env.local" ]; then
    echo "❌ Error: .env.local file not found"
    echo "Please create .env.local with your Supabase credentials"
    exit 1
fi

echo "Step 1: Running database migration..."
echo "-------------------------------------"
echo "Adding columns for image storage and demo properties"
echo ""

# Run the migration using Supabase CLI if available
if command -v supabase &> /dev/null; then
    echo "Using Supabase CLI to run migration..."
    supabase db push --file migrations/006_add_image_and_demo_columns.sql
else
    echo "Supabase CLI not found. Trying API endpoint..."
    # Start dev server in background if not running
    if ! curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "Starting development server..."
        npm run dev &
        DEV_PID=$!
        sleep 10  # Wait for server to start
    fi
    
    # Run migration via API
    curl -X POST http://localhost:3000/api/admin/run-migration \
        -H "Content-Type: application/json" \
        -d '{"migrationFile": "006_add_image_and_demo_columns.sql"}' \
        | python3 -m json.tool
fi

echo ""
echo "Step 2: Compiling TypeScript files..."
echo "-------------------------------------"
npx tsc scripts/seed-specific-demo-properties.ts --outDir dist --esModuleInterop --resolveJsonModule --skipLibCheck

echo ""
echo "Step 3: Seeding the 8 specific demo properties..."
echo "-------------------------------------------------"
echo "This will scrape real data for:"
echo "  1. 7622 N VIA DE MANANA, Scottsdale, AZ 85258"
echo "  2. 8347 E VIA DE DORADO DR, Scottsdale, AZ 85258"
echo "  3. 6746 E MONTEROSA ST, Scottsdale, AZ 85251"
echo "  4. 8520 E TURNEY AVE, Scottsdale, AZ 85251"
echo "  5. 12028 N 80TH PL, Scottsdale, AZ 85260"
echo "  6. 6911 E THUNDERBIRD RD, Scottsdale, AZ 85254"
echo "  7. 7043 E HEARN RD, Scottsdale, AZ 85254"
echo "  8. 13034 N 48TH PL, Scottsdale, AZ 85254"
echo ""
echo "⏳ This may take 2-3 minutes due to rate limiting..."
echo ""

# Run the seeding script
node dist/scripts/seed-specific-demo-properties.js

# Clean up
if [ -d "dist" ]; then
    rm -rf dist
fi

# Kill dev server if we started it
if [ ! -z "$DEV_PID" ]; then
    kill $DEV_PID 2>/dev/null
fi

echo ""
echo "========================================"
echo "✅ Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Start the development server: npm run dev"
echo "2. Sign in as demo user: support@wabbit-rank.ai"
echo "3. Navigate to List View to see the real properties"
echo ""
echo "If properties don't appear:"
echo "- Check the console for any errors"
echo "- Verify migration ran successfully"
echo "- Try running: npm run db:seed-demo"
echo ""