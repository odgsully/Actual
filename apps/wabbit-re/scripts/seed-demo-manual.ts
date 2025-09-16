/**
 * Manual seeding of the 8 demo properties with realistic data
 * Use this if scraping fails or for immediate setup
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

// Manual property data based on typical Scottsdale market
// These are realistic estimates for the addresses
const DEMO_PROPERTIES = [
  {
    address: '7622 N VIA DE MANANA',
    city: 'Scottsdale',
    state: 'AZ',
    zip_code: '85258',
    list_price: 875000,
    bedrooms: 4,
    bathrooms: 3,
    square_footage: 2850,
    lot_size: 8500,
    year_built: 1998,
    property_type: 'Single Family',
    home_style: 'single-story',
    has_pool: true,
    garage_spaces: 3,
    has_hoa: true,
    hoa_fee: 125,
    latitude: 33.6147,
    longitude: -111.9245,
    primary_image_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800'
  },
  {
    address: '8347 E VIA DE DORADO DR',
    city: 'Scottsdale',
    state: 'AZ',
    zip_code: '85258',
    list_price: 1250000,
    bedrooms: 5,
    bathrooms: 4,
    square_footage: 3600,
    lot_size: 12000,
    year_built: 2001,
    property_type: 'Single Family',
    home_style: 'multi-level',
    has_pool: true,
    garage_spaces: 3,
    has_hoa: true,
    hoa_fee: 150,
    latitude: 33.6189,
    longitude: -111.9156,
    primary_image_url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800'
  },
  {
    address: '6746 E MONTEROSA ST',
    city: 'Scottsdale',
    state: 'AZ',
    zip_code: '85251',
    list_price: 695000,
    bedrooms: 3,
    bathrooms: 2.5,
    square_footage: 2200,
    lot_size: 7200,
    year_built: 1985,
    renovation_year: 2018,
    property_type: 'Single Family',
    home_style: 'single-story',
    has_pool: true,
    garage_spaces: 2,
    has_hoa: false,
    latitude: 33.4937,
    longitude: -111.9389,
    primary_image_url: 'https://images.unsplash.com/photo-1567684014761-b65e2e59b9eb?w=800'
  },
  {
    address: '8520 E TURNEY AVE',
    city: 'Scottsdale',
    state: 'AZ',
    zip_code: '85251',
    list_price: 525000,
    bedrooms: 3,
    bathrooms: 2,
    square_footage: 1850,
    lot_size: 6500,
    year_built: 1978,
    renovation_year: 2020,
    property_type: 'Single Family',
    home_style: 'single-story',
    has_pool: false,
    garage_spaces: 2,
    has_hoa: false,
    latitude: 33.4869,
    longitude: -111.9125,
    primary_image_url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'
  },
  {
    address: '12028 N 80TH PL',
    city: 'Scottsdale',
    state: 'AZ',
    zip_code: '85260',
    list_price: 1450000,
    bedrooms: 5,
    bathrooms: 4.5,
    square_footage: 4200,
    lot_size: 15000,
    year_built: 2005,
    property_type: 'Single Family',
    home_style: 'multi-level',
    has_pool: true,
    garage_spaces: 3,
    has_hoa: true,
    hoa_fee: 200,
    latitude: 33.5892,
    longitude: -111.8934,
    primary_image_url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'
  },
  {
    address: '6911 E THUNDERBIRD RD',
    city: 'Scottsdale',
    state: 'AZ',
    zip_code: '85254',
    list_price: 925000,
    bedrooms: 4,
    bathrooms: 3,
    square_footage: 3100,
    lot_size: 9800,
    year_built: 1999,
    property_type: 'Single Family',
    home_style: 'single-story',
    has_pool: true,
    garage_spaces: 3,
    has_hoa: true,
    hoa_fee: 135,
    latitude: 33.6089,
    longitude: -111.9372,
    primary_image_url: 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800'
  },
  {
    address: '7043 E HEARN RD',
    city: 'Scottsdale',
    state: 'AZ',
    zip_code: '85254',
    list_price: 775000,
    bedrooms: 4,
    bathrooms: 2.5,
    square_footage: 2650,
    lot_size: 8200,
    year_built: 1996,
    property_type: 'Single Family',
    home_style: 'single-story',
    has_pool: true,
    garage_spaces: 2,
    has_hoa: false,
    latitude: 33.6234,
    longitude: -111.9358,
    primary_image_url: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800'
  },
  {
    address: '13034 N 48TH PL',
    city: 'Scottsdale',
    state: 'AZ',
    zip_code: '85254',
    list_price: 650000,
    bedrooms: 3,
    bathrooms: 2,
    square_footage: 2100,
    lot_size: 7000,
    year_built: 1992,
    renovation_year: 2019,
    property_type: 'Single Family',
    home_style: 'single-story',
    has_pool: false,
    garage_spaces: 2,
    has_hoa: true,
    hoa_fee: 95,
    latitude: 33.6028,
    longitude: -111.9786,
    primary_image_url: 'https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=800'
  }
];

async function seedManualDemoProperties() {
  console.log('🏠 Seeding demo properties with manual data...\n');

  try {
    // Get demo user ID
    const { data: demoUser, error: userError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', 'support@wabbit-rank.ai')
      .single();

    if (userError || !demoUser) {
      console.error('❌ Demo user not found. Please run seed-demo-account.ts first');
      return;
    }

    const demoUserId = demoUser.id;
    console.log(`✅ Found demo user: ${demoUserId}\n`);

    // Clear existing demo properties
    console.log('🗑️  Clearing existing demo properties...');
    const { error: deleteError } = await supabase
      .from('properties')
      .delete()
      .eq('is_demo', true);

    if (deleteError) {
      console.error('Warning: Could not clear existing demo properties:', deleteError.message);
    }

    // Clear existing user_properties links for demo user
    await supabase
      .from('user_properties')
      .delete()
      .eq('user_id', demoUserId);

    const savedProperties = [];

    // Insert each property
    for (let i = 0; i < DEMO_PROPERTIES.length; i++) {
      const prop = DEMO_PROPERTIES[i];
      const fullAddress = `${prop.address}, ${prop.city}, ${prop.state} ${prop.zip_code}`;
      
      console.log(`[${i + 1}/${DEMO_PROPERTIES.length}] Adding: ${fullAddress}`);

      // Add common fields
      const dbProperty = {
        ...prop,
        county: 'Maricopa',
        status: 'active',
        listing_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(), // Random date within last 30 days
        days_on_market: Math.floor(Math.random() * 30) + 1,
        data_source: 'manual',
        external_url: `https://www.zillow.com/homes/${prop.address.replace(/\s/g, '-')}-${prop.city}-${prop.state}-${prop.zip_code}`,
        primary_image_stored: false,
        last_scraped_at: new Date().toISOString(),
        is_demo: true,
        mls_number: `AZ-DEMO-${Date.now()}-${i}`,
        raw_data: {
          source: 'manual_entry',
          enteredAt: new Date().toISOString(),
          purpose: 'demo_properties'
        }
      };

      // Insert property
      const { data: insertedProperty, error: insertError } = await supabase
        .from('properties')
        .insert(dbProperty)
        .select()
        .single();

      if (insertError) {
        console.error(`  ❌ Failed to insert: ${insertError.message}`);
        continue;
      }

      // Link to demo user
      const { error: linkError } = await supabase
        .from('user_properties')
        .insert({
          user_id: demoUserId,
          property_id: insertedProperty.id,
          source: 'demo',
          is_favorite: i < 3 // First 3 are favorites
        });

      if (linkError) {
        console.error(`  ⚠️  Failed to link to user: ${linkError.message}`);
      }

      // Add to property_images table
      if (prop.primary_image_url) {
        await supabase
          .from('property_images')
          .insert({
            property_id: insertedProperty.id,
            image_url: prop.primary_image_url,
            image_type: 'primary',
            display_order: 0,
            caption: `${prop.bedrooms} bed, ${prop.bathrooms} bath home in ${prop.city}`
          });
      }

      savedProperties.push({
        address: prop.address,
        price: `$${prop.list_price.toLocaleString()}`,
        beds: prop.bedrooms,
        baths: prop.bathrooms,
        sqft: prop.square_footage
      });

      console.log(`  ✅ Saved: $${prop.list_price.toLocaleString()} - ${prop.bedrooms}bd/${prop.bathrooms}ba - ${prop.square_footage}sqft`);
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SEEDING COMPLETE');
    console.log('='.repeat(60));
    console.log(`✅ Successfully saved: ${savedProperties.length} properties\n`);
    
    savedProperties.forEach((prop, idx) => {
      console.log(`${idx + 1}. ${prop.address}`);
      console.log(`   ${prop.price} | ${prop.beds}bd/${prop.baths}ba | ${prop.sqft}sqft`);
    });

    console.log('\n✨ Demo properties are now available!');
    console.log('📱 Sign in as support@wabbit-rank.ai to see them in List View');

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run the seeding
seedManualDemoProperties()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });