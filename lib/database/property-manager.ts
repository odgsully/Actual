/**
 * Comprehensive property data management with Supabase
 */

import { createClient } from '@/lib/supabase/client';
import { NormalizedProperty, PropertySource, UserPreferences } from '@/lib/scraping/types';
import { getDataNormalizer } from '@/lib/pipeline/data-normalizer';
import { getImageOptimizer } from '@/lib/storage/image-optimizer';

export interface PropertyFilter {
  userId?: string;
  cities?: string[];
  zipCodes?: string[];
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  minBathrooms?: number;
  minSquareFeet?: number;
  propertyTypes?: string[];
  hasPool?: boolean;
  hasHOA?: boolean;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface PropertyStats {
  totalProperties: number;
  averagePrice: number;
  priceRange: { min: number; max: number };
  cityCounts: Record<string, number>;
  typeCounts: Record<string, number>;
  lastUpdated: Date;
}

export class PropertyManager {
  private supabase: ReturnType<typeof createClient>;
  private normalizer: ReturnType<typeof getDataNormalizer>;
  private imageOptimizer: ReturnType<typeof getImageOptimizer>;

  constructor() {
    this.supabase = createClient();
    this.normalizer = getDataNormalizer();
    this.imageOptimizer = getImageOptimizer();
  }

  /**
   * Store a normalized property in the database
   */
  async storeProperty(property: NormalizedProperty, userId?: string): Promise<string | null> {
    try {
      // Check for existing property
      const existing = await this.findExistingProperty(property);

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
        renovation_year: property.renovationYear,
        property_type: property.propertyType,
        home_style: property.homeStyle,
        has_pool: property.hasPool,
        garage_spaces: property.garageSpaces,
        has_hoa: property.hasHOA,
        hoa_fee: property.hoaFee,
        elementary_school: property.elementarySchool,
        middle_school: property.middleSchool,
        high_school: property.highSchool,
        school_district: property.schoolDistrict,
        latitude: property.latitude,
        longitude: property.longitude,
        jurisdiction: property.city, // Can be enhanced
        mls_number: property.mlsNumber,
        status: property.status,
        listing_date: property.listingDate?.toISOString(),
        days_on_market: property.daysOnMarket,
        data_source: property.dataSources[0],
        external_url: property.sourceUrl,
        raw_data: property.rawData,
        last_scraped_at: new Date().toISOString(),
        primary_image_url: property.primaryImageUrl
      };

      let propertyId: string;

      if (existing) {
        // Update existing property
        const { data, error } = await this.supabase
          .from('properties')
          .update(propertyData)
          .eq('id', existing.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating property:', error);
          return null;
        }

        propertyId = data.id;

        // Update scrape history
        await this.updateScrapeHistory(propertyId, property.dataSources[0]);

      } else {
        // Insert new property
        const { data, error } = await this.supabase
          .from('properties')
          .insert(propertyData)
          .select()
          .single();

        if (error) {
          console.error('Error inserting property:', error);
          return null;
        }

        propertyId = data.id;
      }

      // Link to user if provided
      if (userId && propertyId) {
        await this.linkPropertyToUser(propertyId, userId, property.dataSources[0]);
      }

      // Process and store images
      if (property.primaryImageUrl && propertyId) {
        await this.processPropertyImages(propertyId, property.primaryImageUrl, property.additionalImageUrls);
      }

      return propertyId;

    } catch (error) {
      console.error('Error storing property:', error);
      return null;
    }
  }

  /**
   * Find existing property by address or MLS number
   */
  private async findExistingProperty(property: NormalizedProperty): Promise<{ id: string } | null> {
    // Try MLS number first (most reliable)
    if (property.mlsNumber) {
      const { data } = await this.supabase
        .from('properties')
        .select('id')
        .eq('mls_number', property.mlsNumber)
        .single();

      if (data) return data;
    }

    // Try address and zip
    const { data } = await this.supabase
      .from('properties')
      .select('id')
      .eq('address', property.address)
      .eq('zip_code', property.zipCode)
      .single();

    return data;
  }

  /**
   * Link property to user
   */
  private async linkPropertyToUser(
    propertyId: string, 
    userId: string, 
    source: PropertySource
  ): Promise<void> {
    try {
      // Check if link already exists
      const { data: existing } = await this.supabase
        .from('user_properties')
        .select('id')
        .eq('user_id', userId)
        .eq('property_id', propertyId)
        .single();

      if (!existing) {
        await this.supabase
          .from('user_properties')
          .insert({
            user_id: userId,
            property_id: propertyId,
            source,
            is_favorite: false
          });
      }
    } catch (error) {
      console.error('Error linking property to user:', error);
    }
  }

  /**
   * Update scrape history
   */
  private async updateScrapeHistory(propertyId: string, source: PropertySource): Promise<void> {
    try {
      const { data: property } = await this.supabase
        .from('properties')
        .select('raw_data')
        .eq('id', propertyId)
        .single();

      if (property) {
        const history = property.raw_data?.scrapeHistory || [];
        history.push({
          source,
          scrapedAt: new Date().toISOString()
        });

        // Keep only last 10 entries
        const recentHistory = history.slice(-10);

        await this.supabase
          .from('properties')
          .update({
            raw_data: {
              ...property.raw_data,
              scrapeHistory: recentHistory
            }
          })
          .eq('id', propertyId);
      }
    } catch (error) {
      console.error('Error updating scrape history:', error);
    }
  }

  /**
   * Process and store property images
   */
  private async processPropertyImages(
    propertyId: string,
    primaryImageUrl: string,
    additionalImageUrls?: string[]
  ): Promise<void> {
    try {
      // Process primary image
      const primaryImage = await this.imageOptimizer.processImageFromUrl(
        primaryImageUrl,
        propertyId,
        true
      );

      if (primaryImage?.primaryUrl) {
        // Update property with optimized primary image URL
        await this.supabase
          .from('properties')
          .update({
            primary_image_url: primaryImage.primaryUrl,
            primary_image_stored: true
          })
          .eq('id', propertyId);
      }

      // Store additional image URLs (not downloading them yet)
      if (additionalImageUrls && additionalImageUrls.length > 0) {
        const imageRecords = additionalImageUrls.slice(0, 20).map((url, index) => ({
          property_id: propertyId,
          image_url: url,
          image_type: 'interior',
          display_order: index + 1
        }));

        await this.supabase
          .from('property_images')
          .insert(imageRecords);
      }
    } catch (error) {
      console.error('Error processing property images:', error);
    }
  }

  /**
   * Get properties matching user preferences
   */
  async getMatchingProperties(
    preferences: UserPreferences,
    limit: number = 20
  ): Promise<NormalizedProperty[]> {
    try {
      let query = this.supabase
        .from('properties')
        .select('*')
        .eq('status', 'active');

      // Apply price filter
      if (preferences.priceMin) {
        query = query.gte('list_price', preferences.priceMin);
      }
      if (preferences.priceMax) {
        query = query.lte('list_price', preferences.priceMax);
      }

      // Apply bedroom/bathroom filters
      if (preferences.minBedrooms) {
        query = query.gte('bedrooms', preferences.minBedrooms);
      }
      if (preferences.minBathrooms) {
        query = query.gte('bathrooms', preferences.minBathrooms);
      }

      // Apply square footage filter
      if (preferences.minSquareFeet) {
        query = query.gte('square_footage', preferences.minSquareFeet);
      }

      // Apply location filters
      if (preferences.cities && preferences.cities.length > 0) {
        query = query.in('city', preferences.cities);
      } else if (preferences.zipCodes && preferences.zipCodes.length > 0) {
        query = query.in('zip_code', preferences.zipCodes);
      }

      // Apply property type filter
      if (preferences.propertyTypes && preferences.propertyTypes.length > 0) {
        query = query.in('property_type', preferences.propertyTypes);
      }

      // Apply pool preference
      if (preferences.poolPreference === 'required') {
        query = query.eq('has_pool', true);
      } else if (preferences.poolPreference === 'avoid') {
        query = query.eq('has_pool', false);
      }

      // Apply HOA preference
      if (preferences.hoaPreference === 'avoid') {
        query = query.eq('has_hoa', false);
      } else if (preferences.hoaPreference === 'required') {
        query = query.eq('has_hoa', true);
      }

      // Apply garage filter
      if (preferences.minGarageSpaces) {
        query = query.gte('garage_spaces', preferences.minGarageSpaces);
      }

      // Execute query
      const { data, error } = await query
        .order('list_price', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error fetching matching properties:', error);
        return [];
      }

      // Convert to NormalizedProperty format
      return data.map(this.dbToNormalized);

    } catch (error) {
      console.error('Error getting matching properties:', error);
      return [];
    }
  }

  /**
   * Get properties for a specific user
   */
  async getUserProperties(userId: string, limit: number = 50): Promise<NormalizedProperty[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_properties')
        .select(`
          *,
          property:properties(*)
        `)
        .eq('user_id', userId)
        .limit(limit);

      if (error) {
        console.error('Error fetching user properties:', error);
        return [];
      }

      return data.map(item => this.dbToNormalized(item.property));

    } catch (error) {
      console.error('Error getting user properties:', error);
      return [];
    }
  }

  /**
   * Get property statistics
   */
  async getPropertyStats(filter?: PropertyFilter): Promise<PropertyStats> {
    try {
      let query = this.supabase
        .from('properties')
        .select('list_price, city, property_type, updated_at');

      // Apply filters
      if (filter?.cities && filter.cities.length > 0) {
        query = query.in('city', filter.cities);
      }
      if (filter?.minPrice) {
        query = query.gte('list_price', filter.minPrice);
      }
      if (filter?.maxPrice) {
        query = query.lte('list_price', filter.maxPrice);
      }

      const { data, error } = await query;

      if (error || !data || data.length === 0) {
        return {
          totalProperties: 0,
          averagePrice: 0,
          priceRange: { min: 0, max: 0 },
          cityCounts: {},
          typeCounts: {},
          lastUpdated: new Date()
        };
      }

      // Calculate statistics
      const prices = data.map(p => p.list_price).filter(p => p > 0);
      const cityCounts: Record<string, number> = {};
      const typeCounts: Record<string, number> = {};

      data.forEach(property => {
        if (property.city) {
          cityCounts[property.city] = (cityCounts[property.city] || 0) + 1;
        }
        if (property.property_type) {
          typeCounts[property.property_type] = (typeCounts[property.property_type] || 0) + 1;
        }
      });

      return {
        totalProperties: data.length,
        averagePrice: prices.length > 0 
          ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
          : 0,
        priceRange: {
          min: prices.length > 0 ? Math.min(...prices) : 0,
          max: prices.length > 0 ? Math.max(...prices) : 0
        },
        cityCounts,
        typeCounts,
        lastUpdated: new Date(Math.max(...data.map(p => new Date(p.updated_at).getTime())))
      };

    } catch (error) {
      console.error('Error getting property stats:', error);
      return {
        totalProperties: 0,
        averagePrice: 0,
        priceRange: { min: 0, max: 0 },
        cityCounts: {},
        typeCounts: {},
        lastUpdated: new Date()
      };
    }
  }

  /**
   * Convert database record to NormalizedProperty
   */
  private dbToNormalized(dbRecord: any): NormalizedProperty {
    return {
      id: dbRecord.id,
      mlsNumber: dbRecord.mls_number,
      address: dbRecord.address,
      city: dbRecord.city,
      state: dbRecord.state,
      zipCode: dbRecord.zip_code,
      county: dbRecord.county || 'Maricopa',
      latitude: dbRecord.latitude,
      longitude: dbRecord.longitude,
      listPrice: dbRecord.list_price,
      status: dbRecord.status,
      listingDate: dbRecord.listing_date ? new Date(dbRecord.listing_date) : undefined,
      daysOnMarket: dbRecord.days_on_market,
      propertyType: dbRecord.property_type,
      bedrooms: dbRecord.bedrooms,
      bathrooms: dbRecord.bathrooms,
      squareFeet: dbRecord.square_footage,
      lotSize: dbRecord.lot_size,
      yearBuilt: dbRecord.year_built,
      renovationYear: dbRecord.renovation_year,
      hasPool: dbRecord.has_pool,
      garageSpaces: dbRecord.garage_spaces,
      hasHOA: dbRecord.has_hoa,
      hoaFee: dbRecord.hoa_fee,
      elementarySchool: dbRecord.elementary_school,
      middleSchool: dbRecord.middle_school,
      highSchool: dbRecord.high_school,
      schoolDistrict: dbRecord.school_district,
      primaryImageUrl: dbRecord.primary_image_url,
      primaryImageStored: dbRecord.primary_image_stored,
      dataSources: dbRecord.data_source ? [dbRecord.data_source] : [],
      lastScrapedAt: new Date(dbRecord.last_scraped_at || dbRecord.updated_at),
      matchScore: dbRecord.match_score
    };
  }

  /**
   * Cleanup old properties
   */
  async cleanupOldProperties(daysOld: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { data, error } = await this.supabase
        .from('properties')
        .delete()
        .eq('status', 'sold')
        .lt('updated_at', cutoffDate.toISOString())
        .select();

      if (error) {
        console.error('Error cleaning up old properties:', error);
        return 0;
      }

      return data?.length || 0;

    } catch (error) {
      console.error('Error in cleanup:', error);
      return 0;
    }
  }
}

// Singleton instance
let propertyManagerInstance: PropertyManager | null = null;

export function getPropertyManager(): PropertyManager {
  if (!propertyManagerInstance) {
    propertyManagerInstance = new PropertyManager();
  }
  return propertyManagerInstance;
}