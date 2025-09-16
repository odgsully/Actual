/**
 * Test script to verify scraping works for a single address
 * Use this to debug scraping issues before running full setup
 */

import { ZillowScraper } from '../lib/scraping/scrapers/zillow-scraper';
import { getDataNormalizer } from '../lib/pipeline/data-normalizer';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

// Test with first address
const TEST_ADDRESS = '7622 N VIA DE MANANA, Scottsdale, AZ 85258';

async function testScraping() {
  console.log('🔍 Testing property scraping...\n');
  console.log(`Address: ${TEST_ADDRESS}\n`);

  const scraper = new ZillowScraper();
  const normalizer = getDataNormalizer();

  try {
    // Try searching by city first
    console.log('Attempting to search Scottsdale properties...');
    const searchResult = await scraper.searchProperties({
      city: 'Scottsdale',
      state: 'AZ',
      zipCode: '85258',
      minPrice: 300000,
      maxPrice: 2000000
    });

    console.log(`Found ${searchResult.totalFound || 0} properties`);
    console.log(`Processed ${searchResult.totalProcessed || 0} properties`);

    if (searchResult.properties && searchResult.properties.length > 0) {
      console.log('\nFirst 3 properties found:');
      searchResult.properties.slice(0, 3).forEach((prop, idx) => {
        console.log(`\n${idx + 1}. ${prop.address || 'No address'}`);
        console.log(`   Price: $${prop.listPrice?.toLocaleString() || 'N/A'}`);
        console.log(`   Beds/Baths: ${prop.bedrooms || '?'}/${prop.bathrooms || '?'}`);
        console.log(`   Sqft: ${prop.squareFeet || 'N/A'}`);
        console.log(`   Image: ${prop.primaryImageUrl ? '✅' : '❌'}`);
      });

      // Try to find our target address
      const targetProp = searchResult.properties.find(p => 
        p.address?.toUpperCase().includes('7622') || 
        p.address?.toUpperCase().includes('VIA DE MANANA')
      );

      if (targetProp) {
        console.log('\n✅ Found target property!');
        console.log('Full details:', JSON.stringify(targetProp, null, 2));
        
        // Test normalization
        const normalized = normalizer.normalize(targetProp);
        if (normalized) {
          console.log('\n✅ Normalization successful');
          console.log('Normalized data:', {
            address: normalized.address,
            price: normalized.listPrice,
            beds: normalized.bedrooms,
            baths: normalized.bathrooms,
            sqft: normalized.squareFeet,
            hasImage: !!normalized.primaryImageUrl
          });
        }
      } else {
        console.log('\n⚠️  Target property not found in results');
      }
    } else {
      console.log('\n❌ No properties found');
      if (searchResult.errors) {
        console.log('Errors:', searchResult.errors);
      }
    }

  } catch (error) {
    console.error('❌ Scraping failed:', error);
  } finally {
    await scraper.cleanup();
  }
}

// Run test
testScraping()
  .then(() => {
    console.log('\n✨ Test complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });