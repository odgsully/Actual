/**
 * Base abstract class for property scrapers
 */

import { Page, Browser, BrowserContext } from 'playwright';
import { 
  PropertySource, 
  RawPropertyData, 
  ScrapeResult, 
  ScrapeError,
  ScrapeErrorType,
  RateLimitConfig 
} from './types';

export abstract class PropertyScraper {
  protected source: PropertySource;
  protected browser: Browser | null = null;
  protected context: BrowserContext | null = null;
  protected page: Page | null = null;
  protected rateLimitConfig: RateLimitConfig;
  protected lastRequestTime: number = 0;
  protected requestCount: number = 0;
  protected requestCountResetTime: number = Date.now();

  constructor(source: PropertySource, rateLimitConfig: RateLimitConfig) {
    this.source = source;
    this.rateLimitConfig = rateLimitConfig;
  }

  /**
   * Initialize the browser and page
   */
  protected abstract initBrowser(): Promise<void>;

  /**
   * Close the browser
   */
  protected async closeBrowser(): Promise<void> {
    if (this.page) await this.page.close();
    if (this.context) await this.context.close();
    if (this.browser) await this.browser.close();
    this.page = null;
    this.context = null;
    this.browser = null;
  }

  /**
   * Check and enforce rate limits
   */
  protected async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    
    // Reset hourly counter if needed
    if (now - this.requestCountResetTime > 3600000) {
      this.requestCount = 0;
      this.requestCountResetTime = now;
    }

    // Check hourly limit
    if (this.requestCount >= this.rateLimitConfig.requestsPerHour) {
      const waitTime = 3600000 - (now - this.requestCountResetTime);
      throw this.createError(
        ScrapeErrorType.RATE_LIMIT,
        `Hourly rate limit reached. Wait ${Math.ceil(waitTime / 60000)} minutes.`,
        true,
        new Date(now + waitTime)
      );
    }

    // Enforce delay between requests
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.rateLimitConfig.delayBetweenRequests) {
      const delay = this.rateLimitConfig.delayBetweenRequests - timeSinceLastRequest;
      await this.sleep(delay);
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  /**
   * Sleep for specified milliseconds
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a standardized error
   */
  protected createError(
    type: ScrapeErrorType,
    message: string,
    retryable: boolean = false,
    retryAfter?: Date
  ): ScrapeError {
    return {
      type,
      message,
      source: this.source,
      timestamp: new Date(),
      retryable,
      retryAfter
    };
  }

  /**
   * Extract property data from a listing page
   */
  protected abstract extractPropertyData(url: string): Promise<RawPropertyData>;

  /**
   * Search for properties based on criteria
   */
  public abstract searchProperties(criteria: {
    city?: string;
    zipCode?: string;
    minPrice?: number;
    maxPrice?: number;
    propertyType?: string;
    minBeds?: number;
    minBaths?: number;
  }): Promise<ScrapeResult>;

  /**
   * Scrape a single property URL
   */
  public async scrapePropertyUrl(url: string): Promise<RawPropertyData> {
    try {
      await this.enforceRateLimit();
      
      if (!this.browser) {
        await this.initBrowser();
      }

      return await this.extractPropertyData(url);
    } catch (error) {
      if (error && typeof error === 'object' && 'type' in error && 'retryable' in error) {
        throw error;
      }
      throw this.createError(
        ScrapeErrorType.UNKNOWN,
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }

  /**
   * Scrape multiple property URLs
   */
  public async scrapeMultipleUrls(urls: string[]): Promise<ScrapeResult> {
    const startTime = Date.now();
    const properties: RawPropertyData[] = [];
    const errors: string[] = [];

    try {
      if (!this.browser) {
        await this.initBrowser();
      }

      for (const url of urls) {
        try {
          await this.enforceRateLimit();
          const property = await this.extractPropertyData(url);
          properties.push(property);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Failed to scrape ${url}: ${errorMessage}`);
          console.error(`Error scraping ${url}:`, error);
        }
      }

      return {
        success: properties.length > 0,
        source: this.source,
        properties,
        totalFound: urls.length,
        totalProcessed: properties.length,
        errors: errors.length > 0 ? errors : undefined,
        duration: Date.now() - startTime
      };
    } finally {
      await this.closeBrowser();
    }
  }

  /**
   * Filter properties for Maricopa County
   */
  protected filterMaricopaCounty(properties: RawPropertyData[]): RawPropertyData[] {
    const maricopaCities = [
      'Phoenix', 'Mesa', 'Chandler', 'Scottsdale', 'Glendale', 
      'Tempe', 'Peoria', 'Surprise', 'Avondale', 'Goodyear',
      'Buckeye', 'El Mirage', 'Gilbert', 'Queen Creek', 'Fountain Hills',
      'Paradise Valley', 'Cave Creek', 'Carefree', 'Wickenburg', 'Litchfield Park',
      'Tolleson', 'Youngtown', 'Guadalupe', 'Sun City', 'Sun City West',
      'Anthem', 'Laveen', 'Ahwatukee'
    ];

    const maricopaZipCodes = [
      // Phoenix area
      '85001', '85002', '85003', '85004', '85005', '85006', '85007', '85008', '85009',
      '85012', '85013', '85014', '85015', '85016', '85017', '85018', '85019', '85020',
      '85021', '85022', '85023', '85024', '85027', '85028', '85029', '85031', '85032',
      '85033', '85034', '85035', '85037', '85040', '85041', '85042', '85043', '85044',
      '85045', '85048', '85050', '85051', '85053', '85054', '85083', '85085', '85086',
      '85087',
      // Scottsdale
      '85250', '85251', '85252', '85253', '85254', '85255', '85256', '85257', '85258',
      '85259', '85260', '85261', '85262', '85263', '85264', '85266', '85267', '85268',
      '85269',
      // Mesa
      '85201', '85202', '85203', '85204', '85205', '85206', '85207', '85208', '85209',
      '85210', '85212', '85213', '85215', '85216',
      // Tempe
      '85280', '85281', '85282', '85283', '85284', '85285', '85287',
      // Chandler
      '85224', '85225', '85226', '85248', '85249', '85286',
      // Gilbert
      '85233', '85234', '85295', '85296', '85297', '85298',
      // Glendale
      '85301', '85302', '85303', '85304', '85305', '85306', '85307', '85308', '85310',
      // Peoria
      '85345', '85380', '85381', '85382', '85383',
      // Other Maricopa cities
      '85331', '85335', '85338', '85339', '85340', '85342', '85343', '85351', '85353',
      '85354', '85355', '85361', '85363', '85364', '85365', '85373', '85374', '85375',
      '85376', '85377', '85378', '85379', '85387', '85388', '85390', '85392', '85395',
      '85396'
    ];

    return properties.filter(property => {
      const cityMatch = maricopaCities.some(city => 
        property.city.toLowerCase().includes(city.toLowerCase())
      );
      const zipMatch = maricopaZipCodes.includes(property.zipCode);
      
      return cityMatch || zipMatch;
    });
  }

  /**
   * Validate extracted property data
   */
  protected validatePropertyData(data: Partial<RawPropertyData>): boolean {
    // Required fields validation
    if (!data.address || !data.city || !data.state || !data.zipCode) {
      return false;
    }
    
    if (!data.listPrice || data.listPrice <= 0) {
      return false;
    }

    if (!data.bedrooms || data.bedrooms < 0) {
      return false;
    }

    if (!data.bathrooms || data.bathrooms < 0) {
      return false;
    }

    // Arizona state validation
    if (data.state !== 'AZ' && data.state !== 'Arizona') {
      return false;
    }

    return true;
  }

  /**
   * Normalize address format
   */
  protected normalizeAddress(address: string): string {
    return address
      .replace(/\s+/g, ' ')
      .replace(/,\s*/g, ', ')
      .replace(/\.\s*/g, '. ')
      .trim()
      .replace(/^(\d+)\s+([NSEW])\s+/i, '$1 $2 ')
      .replace(/\s+(St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Ln|Lane|Blvd|Boulevard|Ct|Court|Pl|Place|Way|Cir|Circle)\.?$/i, ' $1');
  }

  /**
   * Extract numbers from string (for parsing prices, sqft, etc.)
   */
  protected extractNumber(str: string): number | undefined {
    if (!str) return undefined;
    const cleaned = str.replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? undefined : num;
  }

  /**
   * Parse HOA fee from various formats
   */
  protected parseHOAFee(hoaText: string): { fee: number; frequency: 'monthly' | 'quarterly' | 'annually' } | undefined {
    if (!hoaText || hoaText.toLowerCase().includes('no hoa')) {
      return undefined;
    }

    const fee = this.extractNumber(hoaText);
    if (!fee) return undefined;

    let frequency: 'monthly' | 'quarterly' | 'annually' = 'monthly';
    
    if (hoaText.toLowerCase().includes('year') || hoaText.toLowerCase().includes('annual')) {
      frequency = 'annually';
    } else if (hoaText.toLowerCase().includes('quarter')) {
      frequency = 'quarterly';
    }

    return { fee, frequency };
  }
}