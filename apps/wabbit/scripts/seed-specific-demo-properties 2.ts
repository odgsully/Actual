/**
 * Seed database with 8 specific Scottsdale properties for demo user
 * These replace the hardcoded placeholders in List View
 */

import { createClient } from '@supabase/supabase-js';
import { ZillowScraper } from '../lib/scraping/scrapers/zillow-scraper';
import { getDataNormalizer } from '../lib/pipeline/data-normalizer';
import { getPropertyManager } from '../lib/database/property-manager';
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

// The 8 specific properties to scrape
const TARGET_PROPERTIES = [
  { address: '7622 N VIA DE MANANA', city: 'Scottsdale', state: 'AZ', zip: '85258' },
  { address: '8347 E VIA DE DORADO DR', city: 'Scottsdale', state: 'AZ', zip: '85258' },
  { address: '6746 E MONTEROSA ST', city: 'Scottsdale', state: 'AZ', zip: '85251' },
  { address: '8520 E TURNEY AVE', city: 'Scottsdale', state: 'AZ', zip: '85251' },
  { address: '12028 N 80TH PL', city: 'Scottsdale', state: 'AZ', zip: '85260' },
  { address: '6911 E THUNDERBIRD RD', city: 'Scottsdale', state: 'AZ', zip: '85254' },
  { address: '7043 E HEARN RD', city: 'Scottsdale', state: 'AZ', zip: '85254' },
  { address: '13034 N 48TH PL', city: 'Scottsdale', state: 'AZ', zip: '85254' }
];

async function seedSpecificDemoProperties() {
  console.log('🏠 Starting demo property seeding with specific addresses...\n');

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

    // Initialize scraper and normalizer
    const scraper = new ZillowScraper();
    const normalizer = getDataNormalizer();
    const propertyManager = getPropertyManager();

    const savedProperties = [];
    const failedProperties = [];

    // Process each target property
    for (let i = 0; i < TARGET_PROPERTIES.length; i++) {
      const target = TARGET_PROPERTIES[i];
      const fullAddress = `${target.address}, ${target.city}, ${target.state} ${target.zip}`;
      
      console.log(`\n[${i + 1}/${TARGET_PROPERTIES.length}] Searching for: ${fullAddress}`);

      try {
        // Search for the property on Zillow
        const searchCriteria = {
          city: target.city,
          address: target.address, // Some scrapers support address search
          zipCode: target.zip,
          state: target.state
        };

        const searchResult = await scraper.searchProperties(searchCriteria);
        
        // Find the matching property in results
        let propertyData = null;
        
        if (searchResult.properties && searchResult.properties.length > 0) {
          // Try to find exact address match
          propertyData = searchResult.properties.find(p => {
            const propAddress = p.address?.toUpperCase().replace(/[^\w\s]/g, '');
            const targetAddress = target.address.toUpperCase().replace(/[^\w\s]/g, '');
            return propAddress?.includes(targetAddress);
          });

          // If no exact match, take first result (might be close)
          if (!propertyData) {
            console.log('  ⚠️  No exact match found, using closest result');
            propertyData = searchResult.properties[0];
          }
        }

        if (!propertyData) {
          console.log('  ❌ Property not found in search results');
          failedProperties.push(fullAddress);
          continue;
        }

        // Normalize the property data
        const normalized = normalizer.normalize(propertyData);
        
        if (!normalized) {
          console.log('  ❌ Failed to normalize property data');
          failedProperties.push(fullAddress);
          continue;
        }

        // Validate critical fields
        if (!normalized.listPrice || !normalized.bedrooms || !normalized.bathrooms) {
          console.log('  ❌ Missing critical data (price, beds, or baths)');
          failedProperties.push(fullAddress);
          continue;
        }

        // Check if property is active/coming soon
        const validStatuses = ['active', 'for sale', 'coming soon', 'pending'];
        const isValidStatus = !normalized.status || 
                             validStatuses.some(s => normalized.status?.toLowerCase().includes(s));
        
        if (!isValidStatus) {
          console.log(`  ⚠️  Property status is "${normalized.status}" - including anyway for demo`);
        }

        // Prepare property for database
        const dbProperty = {
          address: normalized.address || target.address,
          city: normalized.city || target.city,
          state: normalized.state || target.state,
          zip_code: normalized.zipCode || target.zip,
          county: 'Maricopa',
          list_price: normalized.listPrice,
          bedrooms: normalized.bedrooms,
          bathrooms: normalized.bathrooms,
          square_footage: normalized.squareFeet,
          lot_size: normalized.lotSize,
          year_built: normalized.yearBuilt,
          renovation_year: normalized.renovationYear,
          property_type: normalized.propertyType || 'Single Family',
          home_style: normalized.homeStyle,
          has_pool: normalized.hasPool || false,
          garage_spaces: normalized.garageSpaces,
          has_hoa: normalized.hasHOA || false,
          hoa_fee: normalized.hoaFee,
          elementary_school: normalized.elementarySchool,
          middle_school: normalized.middleSchool,
          high_school: normalized.highSchool,
          school_district: normalized.schoolDistrict,
          latitude: normalized.latitude,
          longitude: normalized.longitude,
          mls_number: normalized.mlsNumber,
          status: 'active', // Force active for demo
          listing_date: normalized.listingDate?.toISOString(),
          days_on_market: normalized.daysOnMarket,
          data_source: 'zillow',
          external_url: normalized.sourceUrl || propertyData.sourceUrl,
          primary_image_url: normalized.primaryImageUrl || propertyData.primaryImageUrl,
          primary_image_stored: false,
          last_scraped_at: new Date().toISOString(),
          is_demo: true,
          raw_data: {
            ...normalized.rawData,
            originalSearch: target,
            scrapedAt: new Date().toISOString()
          }
        };

        // Insert property into database
        const { data: insertedProperty, error: insertError } = await supabase
          .from('properties')
          .insert(dbProperty)
          .select()
          .single();

        if (insertError) {
          console.log('  ❌ Failed to insert property:', insertError.message);
          failedProperties.push(fullAddress);
          continue;
        }

        // Link property to demo user
        await supabase
          .from('user_properties')
          .insert({
            user_id: demoUserId,
            property_id: insertedProperty.id,
            source: 'demo',
            is_favorite: i < 3 // Make first 3 favorites
          });

        // Store images if available
        if (normalized.primaryImageUrl) {
          await supabase
            .from('property_images')
            .insert({
              property_id: insertedProperty.id,
              image_url: normalized.primaryImageUrl,
              image_type: 'primary',
              display_order: 0
            });

          // Add additional images if available
          if (normalized.additionalImageUrls && normalized.additionalImageUrls.length > 0) {
            const additionalImages = normalized.additionalImageUrls.slice(0, 5).map((url, idx) => ({
              property_id: insertedProperty.id,
              image_url: url,
              image_type: 'interior',
              display_order: idx + 1
            }));

            await supabase
              .from('property_images')
              .insert(additionalImages);
          }
        }

        savedProperties.push({
          address: dbProperty.address,
          price: `$${dbProperty.list_price.toLocaleString()}`,
          beds: dbProperty.bedrooms,
          baths: dbProperty.bathrooms,
          sqft: dbProperty.square_footage,
          hasImage: !!dbProperty.primary_image_url
        });

        console.log(`  ✅ Saved: $${dbProperty.list_price.toLocaleString()} - ${dbProperty.bedrooms}bd/${dbProperty.bathrooms}ba - ${dbProperty.square_footage}sqft`);
        
        // Add delay between properties to avoid rate limiting
        if (i < TARGET_PROPERTIES.length - 1) {
          console.log('  ⏳ Waiting 3 seconds before next property...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }

      } catch (error) {
        console.error(`  ❌ Error processing ${fullAddress}:`, error instanceof Error ? error.message : error);
        failedProperties.push(fullAddress);
      }
    }

    // Close scraper
    await scraper.cleanup();

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SEEDING COMPLETE');
    console.log('='.repeat(60));
    console.log(`✅ Successfully saved: ${savedProperties.length} properties`);
    
    if (savedProperties.length > 0) {
      console.log('\nSaved properties:');
      savedProperties.forEach((prop, idx) => {
        console.log(`  ${idx + 1}. ${prop.address}`);
        console.log(`     ${prop.price} | ${prop.beds}bd/${prop.baths}ba | ${prop.sqft}sqft | Image: ${prop.hasImage ? '✅' : '❌'}`);
      });
    }

    if (failedProperties.length > 0) {
      console.log(`\n❌ Failed to save: ${failedProperties.length} properties`);
      failedProperties.forEach(addr => {
        console.log(`  - ${addr}`);
      });
    }

    console.log('\n✨ Demo properties are now available for the demo user!');
    console.log('📝 Note: Run the migration first if you see database errors');
    console.log('   npx supabase db push or run the migration file manually');

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run the seeding
seedSpecificDemoProperties()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });