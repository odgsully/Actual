/**
 * Zillow property scraper implementation
 */

import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { PropertyScraper } from '../property-scraper';
import { 
  RawPropertyData, 
  ScrapeResult, 
  PropertyType,
  ListingStatus,
  ScrapeErrorType,
  RateLimitConfig
} from '../types';

export class ZillowScraper extends PropertyScraper {
  private userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
  ];

  constructor() {
    const rateLimitConfig: RateLimitConfig = {
      source: 'zillow',
      requestsPerHour: 100,
      requestsPerMinute: 5,
      delayBetweenRequests: 5000, // 5 seconds
      maxConcurrent: 2,
      retryDelay: 10000, // 10 seconds
      maxRetries: 3
    };
    super('zillow', rateLimitConfig);
  }

  protected async initBrowser(): Promise<void> {
    const userAgent = this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
    
    this.browser = await chromium.launch({
      headless: true,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });

    this.context = await this.browser.newContext({
      userAgent,
      viewport: { width: 1920, height: 1080 },
      locale: 'en-US',
      timezoneId: 'America/Phoenix'
    });

    // Add stealth modifications
    await this.context.addInitScript(() => {
      // Override navigator.webdriver
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined
      });

      // Override plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5]
      });

      // Override languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en']
      });
    });

    this.page = await this.context.newPage();
    
    // Set extra headers
    await this.page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    });
  }

  protected async extractPropertyData(url: string): Promise<RawPropertyData> {
    if (!this.page) {
      throw this.createError(ScrapeErrorType.UNKNOWN, 'Browser not initialized');
    }

    try {
      // Navigate to property page
      await this.page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });

      // Wait for main content to load
      await this.page.waitForSelector('[data-test="home-details-summary"]', { 
        timeout: 10000 
      }).catch(() => {
        // Try alternative selector
        return this.page?.waitForSelector('.summary-container', { timeout: 5000 });
      });

      // Add small delay to ensure dynamic content loads
      await this.sleep(2000);

      // Extract property data
      const propertyData = await this.page.evaluate((pageUrl) => {
        const data: any = {
          sourceUrl: pageUrl,
          scrapedAt: new Date().toISOString()
        };

        // Helper function to safely get text content
        const getText = (selector: string): string | undefined => {
          const element = document.querySelector(selector);
          return element?.textContent?.trim();
        };

        // Helper function to extract number from text
        const extractNumber = (text: string | undefined): number | undefined => {
          if (!text) return undefined;
          const cleaned = text.replace(/[^0-9.-]/g, '');
          const num = parseFloat(cleaned);
          return isNaN(num) ? undefined : num;
        };

        // Extract price
        const priceText = getText('[data-test="home-details-summary"] span[data-test="property-price"]') ||
                         getText('.summary-container .home-summary-row span');
        data.listPrice = extractNumber(priceText);

        // Extract address
        const addressElement = document.querySelector('[data-test="home-details-summary"] h1') ||
                              document.querySelector('.summary-container h1');
        if (addressElement) {
          const fullAddress = addressElement.textContent?.trim() || '';
          const addressParts = fullAddress.split(',').map(s => s.trim());
          
          if (addressParts.length >= 3) {
            data.address = addressParts[0];
            data.city = addressParts[1];
            const stateZip = addressParts[2].split(' ');
            data.state = stateZip[0];
            data.zipCode = stateZip[1];
          }
        }

        // Extract bed/bath/sqft from summary
        const bedBathElements = document.querySelectorAll('[data-test="bed-bath-sqft-fact"] span') ||
                               document.querySelectorAll('.home-summary-row span');
        
        bedBathElements.forEach((el: any) => {
          const text = el.textContent?.toLowerCase() || '';
          if (text.includes('bd') || text.includes('bed')) {
            data.bedrooms = extractNumber(text);
          } else if (text.includes('ba') || text.includes('bath')) {
            data.bathrooms = extractNumber(text);
          } else if (text.includes('sqft') || text.includes('sq ft')) {
            data.squareFeet = extractNumber(text);
          }
        });

        // Extract property type
        const typeText = getText('[data-test="home-type"]') || 
                        getText('.home-facts-at-a-glance .fact-value');
        data.propertyType = typeText;

        // Extract year built
        const yearText = getText('[data-test="year-built"]') ||
                        Array.from(document.querySelectorAll('.fact-label'))
                          .find((el: any) => el.textContent?.includes('Year built'))
                          ?.nextElementSibling?.textContent;
        data.yearBuilt = extractNumber(yearText);

        // Extract lot size
        const lotText = Array.from(document.querySelectorAll('.fact-label'))
                         .find((el: any) => el.textContent?.includes('Lot'))
                         ?.nextElementSibling?.textContent;
        data.lotSize = extractNumber(lotText);

        // Extract HOA
        const hoaText = Array.from(document.querySelectorAll('.fact-label'))
                         .find((el: any) => el.textContent?.includes('HOA'))
                         ?.nextElementSibling?.textContent;
        data.hoaText = hoaText;

        // Extract MLS number
        const mlsText = Array.from(document.querySelectorAll('.fact-label'))
                         .find((el: any) => el.textContent?.includes('MLS'))
                         ?.nextElementSibling?.textContent;
        data.mlsNumber = mlsText;

        // Extract status
        const statusElement = document.querySelector('[data-test="home-status"]') ||
                             document.querySelector('.home-status');
        data.status = statusElement?.textContent?.trim();

        // Extract days on market
        const daysText = Array.from(document.querySelectorAll('.fact-label'))
                          .find((el: any) => el.textContent?.includes('Days on'))
                          ?.nextElementSibling?.textContent;
        data.daysOnMarket = extractNumber(daysText);

        // Extract images
        const imageElements = document.querySelectorAll('[data-test="photo-carousel"] img') ||
                             document.querySelectorAll('.photo-carousel img');
        data.imageUrls = Array.from(imageElements)
          .map((img: any) => img.src)
          .filter((src: string) => src && !src.includes('placeholder'));

        // Extract primary image
        data.primaryImageUrl = data.imageUrls?.[0];

        // Extract school information
        const schoolElements = document.querySelectorAll('[data-test="school-name"]');
        schoolElements.forEach((school: any) => {
          const name = school.textContent?.trim();
          const type = school.closest('[data-test="school-row"]')
                            ?.querySelector('[data-test="school-type"]')
                            ?.textContent?.toLowerCase();
          
          if (type?.includes('elementary')) {
            data.elementarySchool = name;
          } else if (type?.includes('middle')) {
            data.middleSchool = name;
          } else if (type?.includes('high')) {
            data.highSchool = name;
          }
        });

        // Try to get coordinates from page data
        try {
          const scriptTags = Array.from(document.querySelectorAll('script'));
          for (const script of scriptTags) {
            const content = script.textContent || '';
            if (content.includes('latitude') && content.includes('longitude')) {
              const latMatch = content.match(/"latitude":\s*([-\d.]+)/);
              const lngMatch = content.match(/"longitude":\s*([-\d.]+)/);
              if (latMatch && lngMatch) {
                data.latitude = parseFloat(latMatch[1]);
                data.longitude = parseFloat(lngMatch[1]);
                break;
              }
            }
          }
        } catch (e) {
          // Ignore coordinate extraction errors
        }

        return data;
      }, url);

      // Parse and normalize the extracted data
      const normalizedData: RawPropertyData = {
        source: 'zillow',
        sourceUrl: url,
        sourcePropertyId: this.extractZillowId(url),
        address: propertyData.address || '',
        city: propertyData.city || '',
        state: propertyData.state || 'AZ',
        zipCode: propertyData.zipCode || '',
        county: 'Maricopa', // Default for now, can be enhanced
        listPrice: propertyData.listPrice || 0,
        status: this.parseListingStatus(propertyData.status),
        listingDate: propertyData.listingDate ? new Date(propertyData.listingDate) : undefined,
        daysOnMarket: propertyData.daysOnMarket,
        propertyType: this.parsePropertyType(propertyData.propertyType),
        bedrooms: propertyData.bedrooms || 0,
        bathrooms: propertyData.bathrooms || 0,
        squareFeet: propertyData.squareFeet,
        lotSize: propertyData.lotSize,
        yearBuilt: propertyData.yearBuilt,
        hasPool: this.detectPool(propertyData),
        garageSpaces: this.detectGarageSpaces(propertyData),
        latitude: propertyData.latitude,
        longitude: propertyData.longitude,
        elementarySchool: propertyData.elementarySchool,
        middleSchool: propertyData.middleSchool,
        highSchool: propertyData.highSchool,
        primaryImageUrl: propertyData.primaryImageUrl,
        imageUrls: propertyData.imageUrls || [],
        mlsNumber: propertyData.mlsNumber,
        scrapedAt: new Date(),
        lastUpdated: new Date(),
        rawData: propertyData
      };

      // Parse HOA information
      if (propertyData.hoaText) {
        const hoaInfo = this.parseHOAFee(propertyData.hoaText);
        if (hoaInfo) {
          normalizedData.hasHOA = true;
          normalizedData.hoaFee = hoaInfo.fee;
          normalizedData.hoaFrequency = hoaInfo.frequency;
        }
      }

      // Validate the data
      if (!this.validatePropertyData(normalizedData)) {
        throw this.createError(
          ScrapeErrorType.INVALID_DATA,
          'Extracted property data is invalid or incomplete'
        );
      }

      return normalizedData;

    } catch (error) {
      if (error instanceof Error && error.message.includes('timeout')) {
        throw this.createError(
          ScrapeErrorType.TIMEOUT,
          `Page load timeout for ${url}`,
          true
        );
      }
      throw error;
    }
  }

  public async searchProperties(criteria: {
    city?: string;
    zipCode?: string;
    minPrice?: number;
    maxPrice?: number;
    propertyType?: string;
    minBeds?: number;
    minBaths?: number;
  }): Promise<ScrapeResult> {
    const startTime = Date.now();
    const properties: RawPropertyData[] = [];
    const errors: string[] = [];

    try {
      await this.initBrowser();
      if (!this.page) {
        throw this.createError(ScrapeErrorType.UNKNOWN, 'Failed to initialize browser');
      }

      // Build search URL
      const searchUrl = this.buildSearchUrl(criteria);
      
      // Navigate to search page
      await this.page.goto(searchUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });

      // Wait for results to load
      await this.page.waitForSelector('[data-test="property-card"]', {
        timeout: 10000
      }).catch(() => {
        // Try alternative selector
        return this.page?.waitForSelector('.list-card', { timeout: 5000 });
      });

      // Extract property URLs from search results
      const propertyUrls = await this.page.evaluate(() => {
        const cards = document.querySelectorAll('[data-test="property-card"] a, .list-card a');
        const urls: string[] = [];
        
        cards.forEach((card: any) => {
          const href = card.href;
          if (href && href.includes('/homedetails/')) {
            urls.push(href);
          }
        });

        return urls.slice(0, 20); // Limit to 20 properties for now
      });

      // Scrape each property
      for (const propertyUrl of propertyUrls) {
        try {
          await this.enforceRateLimit();
          const property = await this.extractPropertyData(propertyUrl);
          properties.push(property);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Failed to scrape ${propertyUrl}: ${errorMessage}`);
        }
      }

      // Filter for Maricopa County
      const maricopaProperties = this.filterMaricopaCounty(properties);

      return {
        success: maricopaProperties.length > 0,
        source: 'zillow',
        properties: maricopaProperties,
        totalFound: propertyUrls.length,
        totalProcessed: maricopaProperties.length,
        errors: errors.length > 0 ? errors : undefined,
        duration: Date.now() - startTime,
        metadata: {
          searchUrl,
          filters: criteria
        }
      };

    } catch (error) {
      return {
        success: false,
        source: 'zillow',
        properties: [],
        totalFound: 0,
        totalProcessed: 0,
        errors: [error instanceof Error ? error.message : 'Search failed'],
        duration: Date.now() - startTime
      };
    } finally {
      await this.closeBrowser();
    }
  }

  private buildSearchUrl(criteria: any): string {
    let baseUrl = 'https://www.zillow.com/homes/';
    
    if (criteria.zipCode) {
      baseUrl += `${criteria.zipCode}_rb/`;
    } else if (criteria.city) {
      baseUrl += `${criteria.city.replace(/\s+/g, '-')}-AZ_rb/`;
    } else {
      baseUrl += 'Maricopa-County-AZ_rb/';
    }

    const params: string[] = [];
    
    if (criteria.minPrice) {
      params.push(`${criteria.minPrice}-_price`);
    }
    if (criteria.maxPrice) {
      params.push(`${criteria.maxPrice}_price`);
    }
    if (criteria.minBeds) {
      params.push(`${criteria.minBeds}-_beds`);
    }
    if (criteria.minBaths) {
      params.push(`${criteria.minBaths}-_baths`);
    }

    if (params.length > 0) {
      baseUrl += '?' + params.join('/') + '/';
    }

    return baseUrl;
  }

  private extractZillowId(url: string): string | undefined {
    const match = url.match(/(\d+)_zpid/);
    return match ? match[1] : undefined;
  }

  private parseListingStatus(status: string | undefined): ListingStatus {
    if (!status) return 'active';
    
    const normalized = status.toLowerCase();
    if (normalized.includes('pending')) return 'pending';
    if (normalized.includes('sold')) return 'sold';
    if (normalized.includes('coming soon')) return 'coming-soon';
    if (normalized.includes('off market')) return 'off-market';
    
    return 'active';
  }

  private parsePropertyType(type: string | undefined): PropertyType {
    if (!type) return 'Single Family';
    
    const normalized = type.toLowerCase();
    if (normalized.includes('condo')) return 'Condo';
    if (normalized.includes('townhouse') || normalized.includes('townhome')) return 'Townhouse';
    if (normalized.includes('multi') || normalized.includes('duplex')) return 'Multi-Family';
    if (normalized.includes('manufactured') || normalized.includes('mobile')) return 'Manufactured';
    if (normalized.includes('land') || normalized.includes('lot')) return 'Land';
    
    return 'Single Family';
  }

  private detectPool(data: any): boolean {
    const poolKeywords = ['pool', 'spa', 'hot tub'];
    const searchText = JSON.stringify(data).toLowerCase();
    return poolKeywords.some(keyword => searchText.includes(keyword));
  }

  private detectGarageSpaces(data: any): number {
    const searchText = JSON.stringify(data).toLowerCase();
    const garageMatch = searchText.match(/(\d+)[\s-]*(car|garage)/);
    return garageMatch ? parseInt(garageMatch[1]) : 0;
  }
}