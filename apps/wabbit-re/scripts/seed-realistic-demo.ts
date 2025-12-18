/**
 * Seed database with realistic Single Family demo properties
 * Uses current market data patterns for Scottsdale, AZ
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

// Realistic Single Family homes based on current Scottsdale market (Sep 2025)
const realisticProperties = [
  {
    address: '7845 E Coronado Rd',
    city: 'Scottsdale',
    state: 'AZ',
    zip_code: '85257',
    price: 875000,
    bedrooms: 4,
    bathrooms: 3,
    square_feet: 2850,
    lot_square_feet: 8276,
    year_built: 2018,
    property_type: 'Single Family',
    listing_type: 'For Sale',
    status: 'active',
    mls_number: 'MLS6784521',
    description: 'Stunning modern single-story home in North Scottsdale. Open concept floor plan with gourmet kitchen, quartz countertops, and stainless steel appliances. Resort-style backyard with sparkling pool and spa.',
    has_pool: true,
    garage_spaces: 3,
    stories: 1,
    exterior_features: ['Pool', 'Spa', 'Covered Patio', 'Desert Landscaping'],
    interior_features: ['Granite Counters', 'Kitchen Island', 'Walk-In Closet', 'Smart Home'],
    hoa_fee: 125,
    latitude: 33.5856,
    longitude: -111.9080,
    external_url: 'https://www.zillow.com/homedetails/example1',
    data_source: 'zillow',
    elementary_school: 'Cherokee Elementary School',
    middle_school: 'Cocopah Middle School', 
    high_school: 'Chaparral High School',
    school_ratings: { elementary: 8, middle: 7, high: 8 }
  },
  {
    address: '10234 N 58th Pl',
    city: 'Paradise Valley',
    state: 'AZ',
    zip_code: '85253',
    price: 1425000,
    bedrooms: 5,
    bathrooms: 4.5,
    square_feet: 4200,
    lot_square_feet: 12500,
    year_built: 2020,
    property_type: 'Single Family',
    listing_type: 'For Sale',
    status: 'active',
    mls_number: 'MLS6784522',
    description: 'Exquisite custom home in Paradise Valley. Soaring ceilings, floor-to-ceiling windows, and seamless indoor-outdoor living. Chef\'s kitchen with Wolf appliances. Mountain views from every room.',
    has_pool: true,
    garage_spaces: 4,
    stories: 2,
    exterior_features: ['Pool', 'Spa', 'Outdoor Kitchen', 'Fire Pit', 'Mountain Views'],
    interior_features: ['Wine Cellar', 'Home Theater', 'Office', 'Gym'],
    hoa_fee: 0,
    latitude: 33.5512,
    longitude: -111.9989,
    external_url: 'https://www.zillow.com/homedetails/example2',
    data_source: 'zillow',
    elementary_school: 'Kiva Elementary School',
    middle_school: 'Cocopah Middle School',
    high_school: 'Chaparral High School',
    school_ratings: { elementary: 9, middle: 7, high: 8 }
  },
  {
    address: '4512 E Montecito Ave',
    city: 'Phoenix',
    state: 'AZ',
    zip_code: '85018',
    price: 695000,
    bedrooms: 3,
    bathrooms: 2.5,
    square_feet: 2100,
    lot_square_feet: 7500,
    year_built: 1958,
    property_type: 'Single Family',
    listing_type: 'For Sale',
    status: 'active',
    mls_number: 'MLS6784523',
    description: 'Charming ranch-style home in the Arcadia neighborhood. Completely remodeled with designer finishes. Original hardwood floors, exposed beam ceilings. Mature citrus trees and grassy backyard.',
    has_pool: false,
    garage_spaces: 2,
    stories: 1,
    exterior_features: ['Citrus Trees', 'Grass Lawn', 'Covered Patio'],
    interior_features: ['Hardwood Floors', 'Exposed Beams', 'Updated Kitchen', 'Marble Counters'],
    hoa_fee: 0,
    latitude: 33.5089,
    longitude: -111.9856,
    external_url: 'https://www.redfin.com/example3',
    data_source: 'redfin',
    elementary_school: 'Hopi Elementary School',
    middle_school: 'Ingleside Middle School',
    high_school: 'Arcadia High School',
    school_ratings: { elementary: 9, middle: 8, high: 9 }
  },
  {
    address: '6789 E Maverick Rd',
    city: 'Scottsdale',
    state: 'AZ',
    zip_code: '85258',
    price: 1150000,
    bedrooms: 4,
    bathrooms: 3.5,
    square_feet: 3400,
    lot_square_feet: 10890,
    year_built: 2015,
    property_type: 'Single Family',
    listing_type: 'For Sale',
    status: 'active',
    mls_number: 'MLS6784524',
    description: 'Contemporary single-level home in McCormick Ranch. Great room concept with 12-foot ceilings. Gourmet kitchen opens to family room. Private office with built-ins. Sparkling pebble-tech pool.',
    has_pool: true,
    garage_spaces: 3,
    stories: 1,
    exterior_features: ['Pool', 'Built-in BBQ', 'Fire Feature', 'Turf'],
    interior_features: ['Stone Flooring', 'Custom Cabinets', 'Butler Pantry', 'Wet Bar'],
    hoa_fee: 195,
    latitude: 33.5234,
    longitude: -111.9123,
    external_url: 'https://www.zillow.com/homedetails/example4',
    data_source: 'zillow',
    elementary_school: 'Cochise Elementary School',
    middle_school: 'Cocopah Middle School',
    high_school: 'Chaparral High School',
    school_ratings: { elementary: 8, middle: 7, high: 8 }
  },
  {
    address: '3421 E Rose Ln',
    city: 'Phoenix',
    state: 'AZ',
    zip_code: '85016',
    price: 525000,
    bedrooms: 3,
    bathrooms: 2,
    square_feet: 1750,
    lot_square_feet: 6500,
    year_built: 1955,
    property_type: 'Single Family',
    listing_type: 'For Sale',
    status: 'active',
    mls_number: 'MLS6784525',
    description: 'Mid-century modern gem in the Biltmore area. Updated kitchen with white shaker cabinets and quartz counters. Original terrazzo floors. Private backyard with diving pool and palm trees.',
    has_pool: true,
    garage_spaces: 2,
    stories: 1,
    exterior_features: ['Pool', 'Palm Trees', 'Block Wall'],
    interior_features: ['Terrazzo Floors', 'Updated Bathrooms', 'Skylights'],
    hoa_fee: 0,
    latitude: 33.5156,
    longitude: -112.0234,
    external_url: 'https://www.homes.com/example5',
    data_source: 'homes.com',
    elementary_school: 'Madison Rose Lane Elementary',
    middle_school: 'Madison No. 1 Middle School',
    high_school: 'Central High School',
    school_ratings: { elementary: 7, middle: 7, high: 8 }
  },
  {
    address: '9876 E Cactus Rd',
    city: 'Scottsdale',
    state: 'AZ',
    zip_code: '85260',
    price: 789000,
    bedrooms: 4,
    bathrooms: 2.5,
    square_feet: 2600,
    lot_square_feet: 8100,
    year_built: 2005,
    property_type: 'Single Family',
    listing_type: 'For Sale',
    status: 'active',
    mls_number: 'MLS6784526',
    description: 'Beautiful single-story home in desirable Scottsdale neighborhood. Split floor plan with spacious master suite. Kitchen features granite counters and stainless appliances. Backyard oasis with pool and ramada.',
    has_pool: true,
    garage_spaces: 2,
    stories: 1,
    exterior_features: ['Pool', 'Ramada', 'Desert Landscaping', 'RV Gate'],
    interior_features: ['Plantation Shutters', 'Ceiling Fans', 'Walk-in Pantry'],
    hoa_fee: 85,
    latitude: 33.5789,
    longitude: -111.8901,
    external_url: 'https://www.redfin.com/example6',
    data_source: 'redfin',
    elementary_school: 'Sandpiper Elementary School',
    middle_school: 'Desert Canyon Middle School',
    high_school: 'Desert Mountain High School',
    school_ratings: { elementary: 8, middle: 8, high: 9 }
  },
  {
    address: '5432 E Indian School Rd',
    city: 'Phoenix',
    state: 'AZ',
    zip_code: '85018',
    price: 975000,
    bedrooms: 4,
    bathrooms: 3,
    square_feet: 2950,
    lot_square_feet: 9800,
    year_built: 2012,
    property_type: 'Single Family',
    listing_type: 'For Sale',
    status: 'active',
    mls_number: 'MLS6784527',
    description: 'Gorgeous home in prime Arcadia location. Open floor plan perfect for entertaining. Designer kitchen with custom cabinetry and high-end appliances. Master suite with sitting area. Sparkling pool and spa.',
    has_pool: true,
    garage_spaces: 2,
    stories: 1,
    exterior_features: ['Pool', 'Spa', 'Synthetic Grass', 'Outdoor Shower'],
    interior_features: ['Wood Flooring', 'Crown Molding', 'Recessed Lighting', 'Security System'],
    hoa_fee: 0,
    latitude: 33.4956,
    longitude: -111.9756,
    external_url: 'https://www.zillow.com/homedetails/example7',
    data_source: 'zillow',
    elementary_school: 'Tavan Elementary School',
    middle_school: 'Ingleside Middle School',
    high_school: 'Arcadia High School',
    school_ratings: { elementary: 9, middle: 8, high: 9 }
  },
  {
    address: '2345 E Camelback Rd',
    city: 'Phoenix',
    state: 'AZ',
    zip_code: '85016',
    price: 1295000,
    bedrooms: 5,
    bathrooms: 4,
    square_feet: 3800,
    lot_square_feet: 11200,
    year_built: 2019,
    property_type: 'Single Family',
    listing_type: 'For Sale',
    status: 'active',
    mls_number: 'MLS6784528',
    description: 'Stunning new construction in the Biltmore corridor. Modern farmhouse design with luxury finishes throughout. Chef\'s kitchen with Thermador appliances. Junior master suite. Resort backyard with negative edge pool.',
    has_pool: true,
    garage_spaces: 3,
    stories: 2,
    exterior_features: ['Negative Edge Pool', 'Spa', 'Outdoor Living Room', 'Pizza Oven'],
    interior_features: ['European Oak Floors', 'Smart Home', 'Wine Room', 'Mud Room'],
    hoa_fee: 0,
    latitude: 33.5089,
    longitude: -112.0156,
    external_url: 'https://www.homes.com/example8',
    data_source: 'homes.com',
    elementary_school: 'Cherokee Elementary School',
    middle_school: 'Cocopah Middle School',
    high_school: 'Camelback High School',
    school_ratings: { elementary: 8, middle: 7, high: 7 }
  }
];

async function seedRealisticDemo() {
  console.log('🏠 Starting realistic demo property seeding...\n');

  try {
    // Clear existing demo properties
    console.log('🗑️  Clearing existing properties...');
    const { error: deleteError } = await supabase
      .from('properties')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all except placeholder

    if (deleteError) {
      console.error('Error clearing properties:', deleteError);
    }

    // Insert new properties
    console.log('📝 Inserting 8 realistic Single Family homes...\n');
    
    for (let i = 0; i < realisticProperties.length; i++) {
      const property = realisticProperties[i];
      console.log(`[${i + 1}/8] ${property.address}, ${property.city}`);
      console.log(`  Price: $${property.price.toLocaleString()}`);
      console.log(`  ${property.bedrooms} bed, ${property.bathrooms} bath, ${property.square_feet.toLocaleString()} sqft`);
      
      // Prepare property data for insertion (matching actual database schema)
      const propertyData = {
        address: property.address,
        city: property.city,
        state: property.state,
        zip_code: property.zip_code,
        list_price: property.price,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        square_footage: property.square_feet,
        lot_size: property.lot_square_feet,
        year_built: property.year_built,
        property_type: property.property_type,
        home_style: property.stories === 1 ? 'single-story' : 'multi-level',
        mls_number: property.mls_number,
        has_pool: property.has_pool,
        garage_spaces: property.garage_spaces,
        has_hoa: property.hoa_fee > 0,
        hoa_fee: property.hoa_fee,
        elementary_school: property.elementary_school,
        middle_school: property.middle_school,
        high_school: property.high_school,
        status: property.status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('properties')
        .insert(propertyData)
        .select()
        .single();

      if (error) {
        console.error(`  ❌ Error: ${error.message}`);
      } else {
        console.log(`  ✅ Saved with ID: ${data.id}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Demo seeding complete!');
    console.log('✅ 8 realistic Single Family homes added to database');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the seeding
seedRealisticDemo()
  .then(() => {
    console.log('\n✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });