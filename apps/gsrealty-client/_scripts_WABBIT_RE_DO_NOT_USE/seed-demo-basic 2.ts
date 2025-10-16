/**
 * Basic seeding of demo properties using only existing database columns
 * This version works without the migration
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

// The 8 specific demo properties with realistic data
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
    jurisdiction: 'Scottsdale',
    elementary_school: 'Cherokee Elementary School',
    middle_school: 'Cocopah Middle School',
    high_school: 'Chaparral High School',
    school_district: 'Scottsdale Unified'
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
    jurisdiction: 'Scottsdale',
    elementary_school: 'Cherokee Elementary School',
    middle_school: 'Cocopah Middle School',
    high_school: 'Chaparral High School',
    school_district: 'Scottsdale Unified'
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
    jurisdiction: 'Scottsdale',
    elementary_school: 'Kiva Elementary School',
    middle_school: 'Mohave Middle School',
    high_school: 'Arcadia High School',
    school_district: 'Scottsdale Unified'
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
    jurisdiction: 'Scottsdale',
    elementary_school: 'Kiva Elementary School',
    middle_school: 'Mohave Middle School',
    high_school: 'Arcadia High School',
    school_district: 'Scottsdale Unified'
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
    jurisdiction: 'Scottsdale',
    elementary_school: 'Copper Ridge School',
    middle_school: 'Desert Mountain Middle School',
    high_school: 'Desert Mountain High School',
    school_district: 'Scottsdale Unified'
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
    jurisdiction: 'Scottsdale',
    elementary_school: 'Cherokee Elementary School',
    middle_school: 'Cocopah Middle School',
    high_school: 'Chaparral High School',
    school_district: 'Scottsdale Unified'
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
    jurisdiction: 'Scottsdale',
    elementary_school: 'Cherokee Elementary School',
    middle_school: 'Cocopah Middle School',
    high_school: 'Chaparral High School',
    school_district: 'Scottsdale Unified'
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
    jurisdiction: 'Scottsdale',
    elementary_school: 'Cherokee Elementary School',
    middle_school: 'Cocopah Middle School',
    high_school: 'Chaparral High School',
    school_district: 'Scottsdale Unified'
  }
];

// Image URLs from Unsplash (architectural/home photos)
const IMAGE_URLS = [
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80',
  'https://images.unsplash.com/photo-1567684014761-b65e2e59b9eb?w=800&q=80',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
  'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&q=80',
  'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80',
  'https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=800&q=80'
];

async function seedBasicDemoProperties() {
  console.log('🏠 Seeding demo properties (basic version)...\n');

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

    // Clear any existing properties with these addresses
    console.log('🗑️  Clearing existing properties with these addresses...');
    for (const prop of DEMO_PROPERTIES) {
      await supabase
        .from('properties')
        .delete()
        .eq('address', prop.address)
        .eq('city', prop.city);
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

      // Prepare property data using only existing columns
      const dbProperty = {
        ...prop,
        status: 'active',
        listing_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Random date within last 30 days
        days_on_market: Math.floor(Math.random() * 30) + 1,
        data_source: 'manual',
        external_url: `https://www.zillow.com/homes/${prop.address.replace(/\s/g, '-')}-${prop.city}-${prop.state}-${prop.zip_code}`,
        mls_number: `DEMO-${Date.now()}-${i}`,
        raw_data: {
          source: 'manual_entry',
          enteredAt: new Date().toISOString(),
          purpose: 'demo_properties',
          imageUrl: IMAGE_URLS[i]
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

      console.log(`  ✅ Property saved with ID: ${insertedProperty.id}`);

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
      } else {
        console.log(`  ✅ Linked to demo user${i < 3 ? ' (favorited)' : ''}`);
      }

      // Add to property_images table
      const { error: imageError } = await supabase
        .from('property_images')
        .insert({
          property_id: insertedProperty.id,
          image_url: IMAGE_URLS[i],
          image_type: 'primary',
          display_order: 0,
          caption: `${prop.bedrooms} bed, ${prop.bathrooms} bath home in ${prop.city}`
        });

      if (imageError) {
        console.error(`  ⚠️  Failed to add image: ${imageError.message}`);
      } else {
        console.log(`  ✅ Image added`);
      }

      savedProperties.push({
        id: insertedProperty.id,
        address: prop.address,
        price: `$${prop.list_price.toLocaleString()}`,
        beds: prop.bedrooms,
        baths: prop.bathrooms,
        sqft: prop.square_footage
      });

      console.log('');
    }

    // Print summary
    console.log('='.repeat(60));
    console.log('📊 SEEDING COMPLETE');
    console.log('='.repeat(60));
    console.log(`✅ Successfully saved: ${savedProperties.length} properties\n`);
    
    savedProperties.forEach((prop, idx) => {
      console.log(`${idx + 1}. ${prop.address}`);
      console.log(`   ${prop.price} | ${prop.beds}bd/${prop.baths}ba | ${prop.sqft}sqft`);
      console.log(`   ID: ${prop.id}`);
    });

    console.log('\n✨ Demo properties are now available!');
    console.log('📱 Sign in as support@wabbit-rank.ai to see them in List View');
    console.log('\n💡 Note: Since images are stored in property_images table,');
    console.log('   you may need to update the List View component to fetch them.');

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run the seeding
seedBasicDemoProperties()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });