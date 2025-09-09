/**
 * Seed database with real Single Family properties from live market
 * Limited to 8 properties for demo purposes
 */

import { createClient } from '@supabase/supabase-js';
import { ZillowScraper } from '../lib/scraping/scrapers/zillow-scraper';
import { DataNormalizer } from '../lib/pipeline/data-normalizer';
import { PropertyManager } from '../lib/database/property-manager';
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

async function seedLiveDemoProperties() {
  console.log('🏠 Starting live demo property seeding...\n');

  try {
    // Initialize components
    const scraper = new ZillowScraper();
    const normalizer = new DataNormalizer();
    const propertyManager = new PropertyManager();

    // Search criteria for Single Family homes in Scottsdale, AZ
    const searchCriteria = {
      city: 'Scottsdale',
      zipCode: '85260', // Central Scottsdale
      minPrice: 400000,
      maxPrice: 1500000,
      propertyType: 'Single Family',
      minBeds: 3,
      minBaths: 2
    };

    console.log('🔍 Searching for Single Family homes in Scottsdale, AZ...');
    console.log('Criteria:', searchCriteria);

    // Scrape properties
    const scrapeResult = await scraper.searchProperties(searchCriteria);
    
    if (!scrapeResult.success || !scrapeResult.properties || scrapeResult.properties.length === 0) {
      console.error('❌ No properties found. Scraper may be blocked or criteria too restrictive.');
      if (scrapeResult.errors) {
        console.error('Errors:', scrapeResult.errors);
      }
      return;
    }

    console.log(`✅ Found ${scrapeResult.properties.length} properties\n`);

    // Filter and limit to 8 Single Family homes
    const singleFamilyHomes = scrapeResult.properties
      .filter(p => {
        // Ensure it's really a Single Family home
        const isSingleFamily = 
          p.propertyType?.toLowerCase().includes('single') ||
          p.propertyType?.toLowerCase().includes('detached') ||
          p.propertyType === 'Single Family';
        
        // Exclude townhouses, condos, etc.
        const notTownhouse = !p.propertyType?.toLowerCase().includes('town');
        const notCondo = !p.propertyType?.toLowerCase().includes('condo');
        const notApartment = !p.propertyType?.toLowerCase().includes('apartment');
        
        return isSingleFamily && notTownhouse && notCondo && notApartment;
      })
      .slice(0, 8);

    if (singleFamilyHomes.length === 0) {
      console.error('❌ No Single Family homes found after filtering');
      return;
    }

    console.log(`📝 Processing ${singleFamilyHomes.length} Single Family homes...\n`);

    // Clear existing demo properties
    console.log('🗑️  Clearing existing demo properties...');
    const { error: deleteError } = await supabase
      .from('properties')
      .delete()
      .eq('is_demo', true);

    if (deleteError) {
      console.error('Error clearing demo properties:', deleteError);
    }

    // Process and save each property
    const savedProperties = [];
    for (let i = 0; i < singleFamilyHomes.length; i++) {
      const property = singleFamilyHomes[i];
      console.log(`\n[${i + 1}/${singleFamilyHomes.length}] Processing property:`);
      console.log(`  Address: ${property.address}`);
      console.log(`  Price: $${property.listPrice?.toLocaleString()}`);
      console.log(`  Type: ${property.propertyType}`);
      console.log(`  Beds/Baths: ${property.bedrooms}/${property.bathrooms}`);
      console.log(`  Sqft: ${property.squareFeet?.toLocaleString()}`);

      // Normalize the data
      const normalized = await normalizer.normalizeProperty(property, 'zillow');

      // Add demo flag and ensure it's marked as Single Family
      const demoProperty = {
        ...normalized,
        is_demo: true,
        property_type: 'Single Family',
        status: 'active',
        last_scraped_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save to database
      const { data, error } = await supabase
        .from('properties')
        .insert(demoProperty)
        .select()
        .single();

      if (error) {
        console.error(`  ❌ Error saving property:`, error.message);
      } else {
        console.log(`  ✅ Saved successfully with ID: ${data.id}`);
        savedProperties.push(data);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`🎉 Demo seeding complete!`);
    console.log(`✅ Successfully saved ${savedProperties.length} Single Family homes`);
    console.log('='.repeat(60));

    // Create demo user preferences if not exists
    console.log('\n📝 Checking demo user preferences...');
    const { data: demoUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'demo@wabbit-rank.ai')
      .single();

    if (demoUser) {
      // Ensure preferences match Single Family homes
      const { error: prefError } = await supabase
        .from('buyer_preferences')
        .upsert({
          user_id: demoUser.id,
          property_type: 'Single Family',
          bedrooms_needed: 3,
          bathrooms_needed: 2,
          price_range_min: 400000,
          price_range_max: 1500000,
          city_preferences: ['Scottsdale'],
          preferred_zip_codes: ['85260', '85258', '85254'],
          home_style: 'single-story',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (prefError) {
        console.error('Error updating demo preferences:', prefError);
      } else {
        console.log('✅ Demo user preferences updated for Single Family homes');
      }
    }

  } catch (error) {
    console.error('\n❌ Fatal error during demo seeding:', error);
    process.exit(1);
  }
}

// Run the seeding
seedLiveDemoProperties()
  .then(() => {
    console.log('\n✨ Demo seeding script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });