/**
 * Test endpoint for property scraping
 * Development only - allows testing individual scrapers
 */

import { NextRequest, NextResponse } from 'next/server';
import { ZillowScraper } from '@/lib/scraping/scrapers/zillow-scraper';
import { RedfinScraper } from '@/lib/scraping/scrapers/redfin-scraper';
import { HomesScraper } from '@/lib/scraping/scrapers/homes-scraper';
import { getDataNormalizer } from '@/lib/pipeline/data-normalizer';
import { getPropertyManager } from '@/lib/database/property-manager';
import { getErrorHandler } from '@/lib/scraping/error-handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 1 minute max for testing

/**
 * POST /api/scrape/test
 * Test scraping functionality
 */
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Test endpoint only available in development' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { 
      source = 'zillow',
      url,
      searchCriteria,
      saveToDatabase = false,
      userId
    } = body;

    // Validate source
    if (!['zillow', 'redfin', 'homes.com'].includes(source)) {
      return NextResponse.json(
        { error: 'Invalid source. Must be zillow, redfin, or homes.com' },
        { status: 400 }
      );
    }

    // Create scraper instance
    let scraper;
    switch (source) {
      case 'zillow':
        scraper = new ZillowScraper();
        break;
      case 'redfin':
        scraper = new RedfinScraper();
        break;
      case 'homes.com':
        scraper = new HomesScraper();
        break;
      default:
        return NextResponse.json(
          { error: `Unsupported source: ${source}` },
          { status: 400 }
        );
    }

    const startTime = Date.now();
    let result;

    if (url) {
      // Single URL scraping
      console.log(`Testing ${source} scraper with URL: ${url}`);
      
      const property = await scraper.scrapePropertyUrl(url);
      
      // Normalize the data
      const normalizer = getDataNormalizer();
      const normalized = normalizer.normalize(property);

      if (saveToDatabase && normalized) {
        const propertyManager = getPropertyManager();
        const propertyId = await propertyManager.storeProperty(normalized, userId);
        
        result = {
          success: true,
          source,
          property: normalized,
          propertyId,
          duration: Date.now() - startTime
        };
      } else {
        result = {
          success: true,
          source,
          property: normalized || property,
          raw: property,
          duration: Date.now() - startTime
        };
      }

    } else if (searchCriteria) {
      // Search-based scraping
      console.log(`Testing ${source} search with criteria:`, searchCriteria);
      
      const searchResult = await scraper.searchProperties(searchCriteria);
      
      // Normalize all properties
      const normalizer = getDataNormalizer();
      const normalized = searchResult.properties
        .map(p => normalizer.normalize(p))
        .filter(p => p !== null);

      if (saveToDatabase && normalized.length > 0) {
        const propertyManager = getPropertyManager();
        const savedIds = [];
        
        for (const property of normalized) {
          const propertyId = await propertyManager.storeProperty(property, userId);
          if (propertyId) {
            savedIds.push(propertyId);
          }
        }

        result = {
          success: searchResult.success,
          source,
          totalFound: searchResult.totalFound,
          totalProcessed: searchResult.totalProcessed,
          totalNormalized: normalized.length,
          totalSaved: savedIds.length,
          properties: normalized.slice(0, 5), // Return first 5 for preview
          savedIds,
          errors: searchResult.errors,
          duration: Date.now() - startTime
        };
      } else {
        result = {
          success: searchResult.success,
          source,
          totalFound: searchResult.totalFound,
          totalProcessed: searchResult.totalProcessed,
          totalNormalized: normalized.length,
          properties: normalized.slice(0, 5), // Return first 5 for preview
          errors: searchResult.errors,
          duration: Date.now() - startTime
        };
      }

    } else {
      // Test with default Scottsdale search
      const defaultCriteria = {
        city: 'Scottsdale',
        minPrice: 500000,
        maxPrice: 1500000,
        minBeds: 3,
        minBaths: 2,
        minSqft: 2000
      };

      console.log(`Testing ${source} with default Scottsdale search`);
      
      const searchResult = await scraper.searchProperties(defaultCriteria);
      
      // Normalize all properties
      const normalizer = getDataNormalizer();
      const normalized = searchResult.properties
        .map(p => normalizer.normalize(p))
        .filter(p => p !== null);

      result = {
        success: searchResult.success,
        source,
        searchCriteria: defaultCriteria,
        totalFound: searchResult.totalFound,
        totalProcessed: searchResult.totalProcessed,
        totalNormalized: normalized.length,
        properties: normalized.slice(0, 3), // Return first 3 for preview
        errors: searchResult.errors,
        duration: Date.now() - startTime
      };
    }

    // Get error handler stats
    const errorHandler = getErrorHandler();
    const systemHealth = errorHandler.getSystemHealth();

    return NextResponse.json({
      ...result,
      systemHealth
    });

  } catch (error) {
    console.error('Test scraping error:', error);
    
    return NextResponse.json(
      { 
        error: 'Scraping failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/scrape/test
 * Get test endpoint info
 */
export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Test endpoint only available in development' },
      { status: 403 }
    );
  }

  return NextResponse.json({
    message: 'Property scraping test endpoint',
    usage: {
      method: 'POST',
      body: {
        source: 'zillow | redfin | homes.com',
        url: '(optional) Single property URL to scrape',
        searchCriteria: {
          city: 'City name',
          zipCode: 'ZIP code',
          minPrice: 'Minimum price',
          maxPrice: 'Maximum price',
          minBeds: 'Minimum bedrooms',
          minBaths: 'Minimum bathrooms',
          minSqft: 'Minimum square feet',
          propertyType: 'Property type'
        },
        saveToDatabase: 'Boolean - whether to save results',
        userId: '(optional) User ID to associate properties with'
      }
    },
    examples: {
      singleProperty: {
        source: 'zillow',
        url: 'https://www.zillow.com/homedetails/123-Main-St-Phoenix-AZ-85001/12345_zpid/',
        saveToDatabase: true
      },
      search: {
        source: 'redfin',
        searchCriteria: {
          city: 'Scottsdale',
          minPrice: 500000,
          maxPrice: 1000000,
          minBeds: 3,
          minBaths: 2
        },
        saveToDatabase: false
      },
      default: {
        source: 'zillow',
        saveToDatabase: false
      }
    }
  });
}