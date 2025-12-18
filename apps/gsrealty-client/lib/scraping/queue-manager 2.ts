/**
 * Queue manager for property scraping jobs
 */

import PQueue from 'p-queue';
import { 
  ScrapeJob, 
  PropertySource, 
  UserPreferences,
  ScrapeResult 
} from './types';
import { ZillowScraper } from './scrapers/zillow-scraper';
import { RedfinScraper } from './scrapers/redfin-scraper';
import { HomesScraper } from './scrapers/homes-scraper';
import { createClient } from '@/lib/supabase/client';

export class QueueManager {
  private queues: Map<PropertySource, PQueue>;
  private scrapers: Map<PropertySource, any>;
  private activeJobs: Map<string, ScrapeJob>;

  constructor() {
    // Initialize separate queues for each source
    this.queues = new Map([
      ['zillow', new PQueue({ concurrency: 2, interval: 60000, intervalCap: 5 })], // 5 per minute
      ['redfin', new PQueue({ concurrency: 2, interval: 60000, intervalCap: 6 })], // 6 per minute
      ['homes.com', new PQueue({ concurrency: 3, interval: 60000, intervalCap: 8 })] // 8 per minute
    ]);

    // Initialize scrapers
    this.scrapers = new Map<PropertySource, any>([
      ['zillow', new ZillowScraper()],
      ['redfin', new RedfinScraper()],
      ['homes.com', new HomesScraper()]
    ]);

    this.activeJobs = new Map();
  }

  /**
   * Add a scraping job to the queue
   */
  async addJob(job: ScrapeJob): Promise<void> {
    const queue = this.queues.get(job.source);
    const scraper = this.scrapers.get(job.source);

    if (!queue || !scraper) {
      throw new Error(`Invalid source: ${job.source}`);
    }

    this.activeJobs.set(job.id, job);

    await queue.add(async () => {
      try {
        job.status = 'processing';
        job.startedAt = new Date();

        const result = await this.executeScrapeJob(job, scraper);
        
        job.status = 'completed';
        job.completedAt = new Date();
        job.propertiesFound = result.totalFound;
        job.propertiesProcessed = result.totalProcessed;

        // Store results in database
        await this.storeResults(result, job);

      } catch (error) {
        job.status = 'failed';
        job.attempts++;
        
        if (!job.errors) {
          job.errors = [];
        }
        
        job.errors.push({
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
          stack: error instanceof Error ? error.stack : undefined
        });

        // Retry if under max attempts
        if (job.attempts < job.maxAttempts) {
          job.status = 'pending';
          await this.sleep(10000); // Wait 10 seconds before retry
          await this.addJob(job); // Re-add to queue
        }
      } finally {
        this.activeJobs.delete(job.id);
      }
    });
  }

  /**
   * Execute a scraping job
   */
  private async executeScrapeJob(job: ScrapeJob, scraper: any): Promise<ScrapeResult> {
    if (job.url) {
      // Single URL scraping
      const property = await scraper.scrapePropertyUrl(job.url);
      return {
        success: true,
        source: job.source,
        properties: [property],
        totalFound: 1,
        totalProcessed: 1,
        duration: 0
      };
    } else if (job.searchCriteria) {
      // Search-based scraping
      return await scraper.searchProperties(job.searchCriteria);
    } else if (job.userPreferences) {
      // User preference-based scraping
      const criteria = this.mapPreferencesToSearchCriteria(job.userPreferences);
      return await scraper.searchProperties(criteria);
    } else {
      throw new Error('No valid scraping criteria provided');
    }
  }

  /**
   * Map user preferences to search criteria
   */
  private mapPreferencesToSearchCriteria(preferences: UserPreferences): any {
    const criteria: any = {};

    // Price range
    if (preferences.priceMin) criteria.minPrice = preferences.priceMin;
    if (preferences.priceMax) criteria.maxPrice = preferences.priceMax;

    // Property specs
    if (preferences.minBedrooms) criteria.minBeds = preferences.minBedrooms;
    if (preferences.minBathrooms) criteria.minBaths = preferences.minBathrooms;
    if (preferences.minSquareFeet) criteria.minSqft = preferences.minSquareFeet;
    if (preferences.minLotSize) criteria.minLotSize = preferences.minLotSize;

    // Property type
    if (preferences.propertyTypes?.length > 0) {
      criteria.propertyType = preferences.propertyTypes[0]; // Use first type for now
    }

    // Location - prioritize zip codes, then cities
    if (preferences.zipCodes?.length > 0) {
      criteria.zipCode = preferences.zipCodes[0]; // Use first zip for now
    } else if (preferences.cities?.length > 0) {
      criteria.city = preferences.cities[0]; // Use first city for now
    }

    // Features
    if (preferences.poolPreference) {
      if (preferences.poolPreference === 'required') {
        criteria.pool = 'Yes';
      } else if (preferences.poolPreference === 'avoid') {
        criteria.pool = 'No';
      } else {
        criteria.pool = 'Neutral';
      }
    }

    if (preferences.hoaPreference) {
      if (preferences.hoaPreference === 'avoid') {
        criteria.hoa = 'No HOA';
      } else if (preferences.hoaPreference === 'required') {
        criteria.hoa = 'HOA only';
      } else {
        criteria.hoa = 'No preference';
      }
    }

    if (preferences.homeStyle) {
      if (preferences.homeStyle === 'single-story') {
        criteria.homeStyle = 'Single-story';
      } else if (preferences.homeStyle === 'multi-level') {
        criteria.homeStyle = 'Multi-level';
      } else {
        criteria.homeStyle = 'No preference';
      }
    }

    if (preferences.minGarageSpaces) {
      criteria.garageSpaces = preferences.minGarageSpaces;
    }

    return criteria;
  }

  /**
   * Store scraping results in database
   */
  private async storeResults(result: ScrapeResult, job: ScrapeJob): Promise<void> {
    if (!result.properties || result.properties.length === 0) {
      return;
    }

    const supabase = createClient();

    for (const property of result.properties) {
      try {
        // Check if property already exists by address
        const { data: existing } = await supabase
          .from('properties')
          .select('id')
          .eq('address', property.address)
          .eq('zip_code', property.zipCode)
          .single();

        const propertyData = {
          address: property.address,
          city: property.city,
          state: property.state,
          zip_code: property.zipCode,
          list_price: property.listPrice,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          square_footage: property.squareFeet,
          lot_size: property.lotSize,
          year_built: property.yearBuilt,
          property_type: property.propertyType,
          has_pool: property.hasPool,
          garage_spaces: property.garageSpaces,
          has_hoa: property.hasHOA,
          hoa_fee: property.hoaFee,
          elementary_school: property.elementarySchool,
          middle_school: property.middleSchool,
          high_school: property.highSchool,
          latitude: property.latitude,
          longitude: property.longitude,
          mls_number: property.mlsNumber,
          status: property.status,
          days_on_market: property.daysOnMarket,
          data_source: property.source,
          external_url: property.sourceUrl,
          raw_data: property.rawData,
          last_scraped_at: new Date().toISOString(),
          primary_image_url: property.primaryImageUrl
        };

        let finalPropertyId: string | undefined;
        
        if (existing) {
          // Update existing property
          await supabase
            .from('properties')
            .update(propertyData)
            .eq('id', existing.id);
          finalPropertyId = existing.id;
        } else {
          // Insert new property
          const { data: newProperty } = await supabase
            .from('properties')
            .insert(propertyData)
            .select()
            .single();

          finalPropertyId = newProperty?.id;

          // If user-triggered, link to user
          if (job.userId && newProperty) {
            await supabase
              .from('user_properties')
              .insert({
                user_id: job.userId,
                property_id: newProperty.id,
                source: property.source,
                is_favorite: false
              });
          }
        }

        // Store additional image URLs separately
        if (property.imageUrls?.length > 1 && finalPropertyId) {
          const propertyId = finalPropertyId;
          const imageRecords = property.imageUrls.slice(1).map((url, index) => ({
            property_id: propertyId,
            image_url: url,
            image_type: index === 0 ? 'primary' : 'interior',
            display_order: index + 1
          }));

          await supabase
            .from('property_images')
            .insert(imageRecords);
        }

      } catch (error) {
        console.error(`Failed to store property ${property.address}:`, error);
      }
    }
  }

  /**
   * Get queue statistics
   */
  getQueueStats(): { source: PropertySource; pending: number; active: number }[] {
    const stats = [];
    
    for (const [source, queue] of Array.from(this.queues.entries())) {
      stats.push({
        source,
        pending: queue.pending,
        active: queue.size - queue.pending
      });
    }

    return stats;
  }

  /**
   * Get active jobs
   */
  getActiveJobs(): ScrapeJob[] {
    return Array.from(this.activeJobs.values());
  }

  /**
   * Clear all queues
   */
  async clearQueues(): Promise<void> {
    for (const queue of Array.from(this.queues.values())) {
      queue.clear();
    }
    this.activeJobs.clear();
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
let queueManagerInstance: QueueManager | null = null;

export function getQueueManager(): QueueManager {
  if (!queueManagerInstance) {
    queueManagerInstance = new QueueManager();
  }
  return queueManagerInstance;
}