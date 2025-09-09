/**
 * Core types and interfaces for the property scraping system
 */

// Source platforms
export type PropertySource = 'zillow' | 'redfin' | 'homes.com';

// Property types found in listings
export type PropertyType = 
  | 'Single Family'
  | 'Condo'
  | 'Townhouse'
  | 'Multi-Family'
  | 'Manufactured'
  | 'Land'
  | 'Other';

// Listing status types
export type ListingStatus = 
  | 'active'
  | 'pending'
  | 'sold'
  | 'off-market'
  | 'coming-soon';

// Home style preferences
export type HomeStyle = 'single-story' | 'multi-level' | 'any';

// Pool preferences
export type PoolPreference = 'required' | 'preferred' | 'neutral' | 'avoid';

// HOA preferences
export type HOAPreference = 'required' | 'preferred' | 'neutral' | 'avoid';

/**
 * Raw property data extracted from listing sites
 */
export interface RawPropertyData {
  // Source information
  source: PropertySource;
  sourceUrl: string;
  sourcePropertyId?: string;
  
  // Basic property information
  address: string;
  unit?: string;
  city: string;
  state: string;
  zipCode: string;
  county?: string;
  
  // Listing details
  listPrice: number;
  status: ListingStatus;
  listingDate?: Date;
  daysOnMarket?: number;
  
  // Property characteristics
  propertyType: PropertyType;
  bedrooms: number;
  bathrooms: number;
  squareFeet?: number;
  lotSize?: number;
  yearBuilt?: number;
  
  // Additional features
  hasPool?: boolean;
  garageSpaces?: number;
  hasHOA?: boolean;
  hoaFee?: number;
  hoaFrequency?: 'monthly' | 'quarterly' | 'annually';
  
  // Location data
  latitude?: number;
  longitude?: number;
  
  // School information
  elementarySchool?: string;
  middleSchool?: string;
  highSchool?: string;
  schoolDistrict?: string;
  
  // Images
  primaryImageUrl?: string;
  imageUrls: string[];
  virtualTourUrl?: string;
  
  // MLS information
  mlsNumber?: string;
  mlsSource?: string;
  
  // Price history
  priceHistory?: Array<{
    date: Date;
    price: number;
    event?: string;
  }>;
  
  // Raw HTML/JSON for debugging
  rawHtml?: string;
  rawData?: any;
  
  // Metadata
  scrapedAt: Date;
  lastUpdated: Date;
}

/**
 * User preferences for property matching
 */
export interface UserPreferences {
  userId: string;
  
  // Property requirements
  propertyTypes: PropertyType[];
  minBedrooms: number;
  minBathrooms: number;
  minSquareFeet?: number;
  minLotSize?: number;
  
  // Price range
  priceMin: number;
  priceMax: number;
  
  // Location preferences
  cities: string[];
  zipCodes: string[];
  maxCommuteMinutes?: number;
  commuteAddresses?: Array<{
    address: string;
    maxMinutes: number;
    priority: 'high' | 'medium' | 'low';
  }>;
  
  // Features
  homeStyle?: HomeStyle;
  poolPreference?: PoolPreference;
  hoaPreference?: HOAPreference;
  minGarageSpaces?: number;
  renovationOpenness?: number; // 1-5 scale
  
  // School preferences
  minSchoolRating?: number;
  preferredSchoolDistricts?: string[];
  
  // Search area (GeoJSON polygon)
  searchAreaPolygon?: any;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Normalized property data for database storage
 */
export interface NormalizedProperty {
  // Unique identifiers
  id?: string;
  mlsNumber?: string;
  
  // Location
  address: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
  latitude?: number;
  longitude?: number;
  
  // Listing information
  listPrice: number;
  status: ListingStatus;
  listingDate?: Date;
  daysOnMarket?: number;
  
  // Property details
  propertyType: PropertyType;
  bedrooms: number;
  bathrooms: number;
  squareFeet?: number;
  lotSize?: number;
  yearBuilt?: number;
  renovationYear?: number;
  
  // Features
  homeStyle?: HomeStyle;
  hasPool: boolean;
  garageSpaces: number;
  hasHOA: boolean;
  hoaFee?: number;
  
  // Schools
  elementarySchool?: string;
  middleSchool?: string;
  highSchool?: string;
  schoolDistrict?: string;
  
  // Images
  primaryImageUrl?: string;
  primaryImageStored?: boolean;
  additionalImageUrls?: string[];
  
  // Source tracking
  dataSources: PropertySource[];
  sourceUrl?: string;
  lastScrapedAt: Date;
  scrapeHistory?: Array<{
    source: PropertySource;
    scrapedAt: Date;
    changes?: string[];
  }>;
  
  // Matching score for user
  matchScore?: number;
  matchReasons?: string[];
  
  // Raw data
  rawData?: any;
}

/**
 * Scraping job configuration
 */
export interface ScrapeJob {
  id: string;
  type: 'scheduled' | 'on-demand' | 'user-triggered';
  source: PropertySource;
  
  // Job configuration
  url?: string;
  searchCriteria?: {
    city?: string;
    zipCode?: string;
    minPrice?: number;
    maxPrice?: number;
    propertyType?: PropertyType;
  };
  
  // User association
  userId?: string;
  userPreferences?: UserPreferences;
  
  // Job metadata
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  maxAttempts: number;
  
  // Timing
  scheduledFor?: Date;
  startedAt?: Date;
  completedAt?: Date;
  
  // Results
  propertiesFound?: number;
  propertiesProcessed?: number;
  errors?: Array<{
    message: string;
    timestamp: Date;
    stack?: string;
  }>;
}

/**
 * Scraping result
 */
export interface ScrapeResult {
  success: boolean;
  source: PropertySource;
  properties: RawPropertyData[];
  totalFound: number;
  totalProcessed: number;
  errors?: string[];
  duration: number;
  metadata?: {
    searchUrl?: string;
    filters?: any;
    pagination?: {
      currentPage: number;
      totalPages: number;
      hasMore: boolean;
    };
  };
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  source: PropertySource;
  requestsPerHour: number;
  requestsPerMinute: number;
  delayBetweenRequests: number; // milliseconds
  maxConcurrent: number;
  retryDelay: number; // milliseconds
  maxRetries: number;
}

/**
 * Image processing configuration
 */
export interface ImageConfig {
  sizes: {
    thumbnail: { width: number; height?: number; quality: number };
    card: { width: number; height?: number; quality: number };
    full: { width: number; height?: number; quality: number };
  };
  formats: ('webp' | 'jpg' | 'png')[];
  maxSizeBytes: number;
  compressionQuality: number;
}

/**
 * Error types for scraping operations
 */
export enum ScrapeErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  BLOCKED = 'BLOCKED',
  INVALID_DATA = 'INVALID_DATA',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Scraping error
 */
export interface ScrapeError {
  type: ScrapeErrorType;
  message: string;
  source: PropertySource;
  url?: string;
  timestamp: Date;
  stack?: string;
  retryable: boolean;
  retryAfter?: Date;
}