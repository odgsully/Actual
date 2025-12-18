/**
 * Seed properties with VERIFIED accurate data
 * This is a fallback when Zillow scraping is blocked
 * Data should be manually verified from Zillow before using
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// IMPORTANT: Update these with ACTUAL data from Zillow
// NO PLACEHOLDERS - only real, verified data
const VERIFIED_PROPERTIES = [
  {
    address: '12028 N 80TH PL',
    city: 'Scottsdale',
    state: 'AZ',
    zip_code: '85260',
    // CORRECTED DATA based on user feedback - should be 4bd/2ba/2,984sqft
    list_price: 899000, // Update with actual price from Zillow
    bedrooms: 4, // CORRECTED from 5
    bathrooms: 2, // CORRECTED from 4.5
    square_footage: 2984, // CORRECTED from 4200
    property_type: 'Single Family',
    status: 'active',
    // Add actual Zillow image URLs here
    images: [
      // Replace with actual Zillow image URLs
    ]
  },
  // Add the other 7 properties with VERIFIED data
  {
    address: '7622 N VIA DE MANANA',
    city: 'Scottsdale',
    state: 'AZ',
    zip_code: '85258',
    list_price: 0, // MUST BE FILLED WITH ACTUAL DATA
    bedrooms: 0, // MUST BE FILLED WITH ACTUAL DATA
    bathrooms: 0, // MUST BE FILLED WITH ACTUAL DATA
    square_footage: 0, // MUST BE FILLED WITH ACTUAL DATA
    property_type: 'Single Family',
    status: 'active',
    images: []
  },
  {
    address: '8347 E VIA DE DORADO DR',
    city: 'Scottsdale',
    state: 'AZ',
    zip_code: '85258',
    list_price: 0, // MUST BE FILLED WITH ACTUAL DATA
    bedrooms: 0, // MUST BE FILLED WITH ACTUAL DATA
    bathrooms: 0, // MUST BE FILLED WITH ACTUAL DATA
    square_footage: 0, // MUST BE FILLED WITH ACTUAL DATA
    property_type: 'Single Family',
    status: 'active',
    images: []
  },
  {
    address: '6746 E MONTEROSA ST',
    city: 'Scottsdale',
    state: 'AZ',
    zip_code: '85251',
    list_price: 0, // MUST BE FILLED WITH ACTUAL DATA
    bedrooms: 0, // MUST BE FILLED WITH ACTUAL DATA
    bathrooms: 0, // MUST BE FILLED WITH ACTUAL DATA
    square_footage: 0, // MUST BE FILLED WITH ACTUAL DATA
    property_type: 'Single Family',
    status: 'active',
    images: []
  },
  {
    address: '8520 E TURNEY AVE',
    city: 'Scottsdale',
    state: 'AZ',
    zip_code: '85251',
    list_price: 0, // MUST BE FILLED WITH ACTUAL DATA
    bedrooms: 0, // MUST BE FILLED WITH ACTUAL DATA
    bathrooms: 0, // MUST BE FILLED WITH ACTUAL DATA
    square_footage: 0, // MUST BE FILLED WITH ACTUAL DATA
    property_type: 'Single Family',
    status: 'active',
    images: []
  },
  {
    address: '6911 E THUNDERBIRD RD',
    city: 'Scottsdale',
    state: 'AZ',
    zip_code: '85254',
    list_price: 0, // MUST BE FILLED WITH ACTUAL DATA
    bedrooms: 0, // MUST BE FILLED WITH ACTUAL DATA
    bathrooms: 0, // MUST BE FILLED WITH ACTUAL DATA
    square_footage: 0, // MUST BE FILLED WITH ACTUAL DATA
    property_type: 'Single Family',
    status: 'active',
    images: []
  },
  {
    address: '7043 E HEARN RD',
    city: 'Scottsdale',
    state: 'AZ',
    zip_code: '85254',
    list_price: 0, // MUST BE FILLED WITH ACTUAL DATA
    bedrooms: 0, // MUST BE FILLED WITH ACTUAL DATA
    bathrooms: 0, // MUST BE FILLED WITH ACTUAL DATA
    square_footage: 0, // MUST BE FILLED WITH ACTUAL DATA
    property_type: 'Single Family',
    status: 'active',
    images: []
  },
  {
    address: '13034 N 48TH PL',
    city: 'Scottsdale',
    state: 'AZ',
    zip_code: '85254',
    list_price: 0, // MUST BE FILLED WITH ACTUAL DATA
    bedrooms: 0, // MUST BE FILLED WITH ACTUAL DATA
    bathrooms: 0, // MUST BE FILLED WITH ACTUAL DATA
    square_footage: 0, // MUST BE FILLED WITH ACTUAL DATA
    property_type: 'Single Family',
    status: 'active',
    images: []
  }
];

async function seedVerifiedProperties() {
  console.log('📊 Seeding properties with VERIFIED data\n');

  // Check for incomplete data
  const incomplete = VERIFIED_PROPERTIES.filter(p => 
    p.list_price === 0 || 
    p.bedrooms === 0 || 
    p.bathrooms === 0 || 
    p.square_footage === 0
  );

  if (incomplete.length > 0) {
    console.log('❌ ERROR: The following properties have incomplete data:');
    incomplete.forEach(p => {
      console.log(`   - ${p.address}`);
    });
    console.log('\n⚠️  Please update the VERIFIED_PROPERTIES array with actual data from Zillow');
    console.log('   NO PLACEHOLDERS - only real, verified data should be used');
    console.log('\nFor 12028 N 80TH PL, it should be:');
    console.log('   4 bedrooms (not 5)');
    console.log('   2 bathrooms (not 4.5)');
    console.log('   2,984 sqft (not 4,200)');
    return;
  }

  try {
    // Get demo user
    const { data: demoUser } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', 'support@wabbit-rank.ai')
      .single();

    if (!demoUser) {
      console.error('❌ Demo user not found');
      return;
    }

    const savedProperties = [];

    for (let i = 0; i < VERIFIED_PROPERTIES.length; i++) {
      const prop = VERIFIED_PROPERTIES[i];
      console.log(`[${i + 1}/${VERIFIED_PROPERTIES.length}] ${prop.address}`);

      // Insert property
      const { data: insertedProperty, error } = await supabase
        .from('properties')
        .insert({
          address: prop.address,
          city: prop.city,
          state: prop.state,
          zip_code: prop.zip_code,
          list_price: prop.list_price,
          bedrooms: prop.bedrooms,
          bathrooms: prop.bathrooms,
          square_footage: prop.square_footage,
          property_type: prop.property_type,
          status: prop.status,
          data_source: 'manual_verified',
          jurisdiction: prop.city,
          raw_data: {
            verifiedAt: new Date().toISOString(),
            source: 'manual_entry_verified'
          }
        })
        .select()
        .single();

      if (error) {
        console.error(`   ❌ Failed to insert: ${error.message}`);
        continue;
      }

      // Link to demo user
      await supabase
        .from('user_properties')
        .insert({
          user_id: demoUser.id,
          property_id: insertedProperty.id,
          source: 'manual',
          is_favorite: i < 3
        });

      // Add images if provided
      if (prop.images && prop.images.length > 0) {
        const imageRecords = prop.images.map((url, idx) => ({
          property_id: insertedProperty.id,
          image_url: url,
          image_type: idx === 0 ? 'primary' : 'additional',
          display_order: idx
        }));

        await supabase
          .from('property_images')
          .insert(imageRecords);
      }

      savedProperties.push({
        address: prop.address,
        price: `$${prop.list_price.toLocaleString()}`,
        beds: prop.bedrooms,
        baths: prop.bathrooms,
        sqft: prop.square_footage
      });

      console.log(`   ✅ Saved: ${prop.bedrooms}bd/${prop.bathrooms}ba/${prop.square_footage}sqft`);
    }

    console.log('\n✅ Complete!');
    console.log(`Saved ${savedProperties.length} properties with verified data`);

    // Special note about 12028 N 80TH PL
    const property12028 = savedProperties.find(p => p.address.includes('12028'));
    if (property12028) {
      console.log('\n📍 12028 N 80TH PL verified as:');
      console.log(`   ${property12028.beds}bd/${property12028.baths}ba/${property12028.sqft}sqft`);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the seeding
seedVerifiedProperties()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });