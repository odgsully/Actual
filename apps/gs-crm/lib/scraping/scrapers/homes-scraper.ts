/**
 * Homes.com property scraper implementation
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

export class HomesScraper extends PropertyScraper {
  private userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
  ];

  constructor() {
    const rateLimitConfig: RateLimitConfig = {
      source: 'homes.com',
      requestsPerHour: 150,
      requestsPerMinute: 8,
      delayBetweenRequests: 3000, // 3 seconds
      maxConcurrent: 3,
      retryDelay: 6000, // 6 seconds
      maxRetries: 3
    };
    super('homes.com', rateLimitConfig);
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
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=IsolateOrigins',
        '--disable-site-isolation-trials'
      ]
    });

    this.context = await this.browser.newContext({
      userAgent,
      viewport: { width: 1920, height: 1080 },
      locale: 'en-US',
      timezoneId: 'America/Phoenix',
      permissions: [],
      ignoreHTTPSErrors: true
    });

    // Add stealth modifications
    await this.context.addInitScript(() => {
      // Override navigator properties
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined
      });
      
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3]
      });

      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en']
      });

      // Mock permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters: any) => {
        return parameters.name === 'notifications' 
          ? Promise.resolve({ state: 'denied' } as any)
          : originalQuery.call(navigator.permissions, parameters);
      };
    });

    this.page = await this.context.newPage();
    
    // Set extra headers
    await this.page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
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
      await this.page.waitForSelector('.property-details', { 
        timeout: 10000 
      }).catch(() => {
        // Try alternative selectors
        return this.page?.waitForSelector('.ldp-header-price', { timeout: 5000 });
      });

      // Add small delay to ensure dynamic content loads
      await this.sleep(3000);

      // Extract property data
      const propertyData = await this.page.evaluate((pageUrl) => {
        const data: any = {
          sourceUrl: pageUrl,
          scrapedAt: new Date().toISOString()
        };

        // Helper functions
        const getText = (selector: string): string | undefined => {
          const element = document.querySelector(selector);
          return element?.textContent?.trim();
        };

        const getTextByContains = (text: string, parent = document): string | undefined => {
          const xpath = `//*[contains(text(), '${text}')]`;
          const result = document.evaluate(xpath, parent, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
          const element = result.singleNodeValue as HTMLElement;
          return element?.textContent?.trim();
        };

        const extractNumber = (text: string | undefined): number | undefined => {
          if (!text) return undefined;
          const cleaned = text.replace(/[^0-9.-]/g, '');
          const num = parseFloat(cleaned);
          return isNaN(num) ? undefined : num;
        };

        // Extract price
        const priceText = getText('.ldp-header-price .property-price') ||
                         getText('.price-wrap .price') ||
                         getText('[data-testid="price"]');
        data.listPrice = extractNumber(priceText);

        // Extract address
        const addressElement = document.querySelector('.ldp-header-address h1') ||
                             document.querySelector('.property-address') ||
                             document.querySelector('[data-testid="address"]');
        
        if (addressElement) {
          const fullAddress = addressElement.textContent?.trim() || '';
          // Try to parse address
          const addressMatch = fullAddress.match(/^(.+?),\s*([^,]+),\s*([A-Z]{2})\s*(\d{5})$/);
          if (addressMatch) {
            data.address = addressMatch[1];
            data.city = addressMatch[2];
            data.state = addressMatch[3];
            data.zipCode = addressMatch[4];
          } else {
            // Fallback parsing
            const parts = fullAddress.split(',').map(s => s.trim());
            if (parts.length >= 3) {
              data.address = parts[0];
              data.city = parts[1];
              const stateZip = parts[2].split(' ').filter(s => s);
              if (stateZip.length >= 2) {
                data.state = stateZip[0];
                data.zipCode = stateZip[1];
              }
            }
          }
        }

        // Extract bed/bath/sqft from property meta
        const metaItems = document.querySelectorAll('.property-meta-item, .ldp-header-meta li, [data-testid="bed-bath-sqft"] > div');
        
        metaItems.forEach((item: any) => {
          const text = item.textContent?.toLowerCase() || '';
          
          if (text.includes('bed')) {
            data.bedrooms = extractNumber(text);
          } else if (text.includes('bath')) {
            data.bathrooms = extractNumber(text);
          } else if (text.includes('sq ft') || text.includes('sqft')) {
            data.squareFeet = extractNumber(text);
          } else if (text.includes('acre') || text.includes('lot')) {
            const lotNum = extractNumber(text);
            if (text.includes('acre') && lotNum) {
              data.lotSize = Math.round(lotNum * 43560); // Convert acres to sqft
            } else {
              data.lotSize = lotNum;
            }
          }
        });

        // Extract property type
        const typeElement = Array.from(document.querySelectorAll('.property-info-item, .key-fact-item'))
          .find((el: any) => el.textContent?.includes('Property Type') || el.textContent?.includes('Home Type'));
        if (typeElement) {
          const typeText = typeElement.querySelector('.value, dd')?.textContent?.trim();
          data.propertyType = typeText;
        }

        // Extract year built
        const yearElement = Array.from(document.querySelectorAll('.property-info-item, .key-fact-item'))
          .find((el: any) => el.textContent?.includes('Year Built'));
        if (yearElement) {
          data.yearBuilt = extractNumber(yearElement.querySelector('.value, dd')?.textContent);
        }

        // Extract HOA
        const hoaElement = Array.from(document.querySelectorAll('.property-info-item, .key-fact-item'))
          .find((el: any) => el.textContent?.includes('HOA'));
        if (hoaElement) {
          data.hoaText = hoaElement.querySelector('.value, dd')?.textContent?.trim();
        }

        // Extract garage
        const garageElement = Array.from(document.querySelectorAll('.property-info-item, .amenity-item'))
          .find((el: any) => el.textContent?.toLowerCase().includes('garage'));
        if (garageElement) {
          const garageText = garageElement.textContent || '';
          const garageMatch = garageText.match(/(\d+)[\s-]*(car|space|garage)/i);
          data.garageSpaces = garageMatch ? parseInt(garageMatch[1]) : 0;
        }

        // Extract pool from amenities
        const amenitiesSection = document.querySelector('.amenities-section, .property-amenities');
        const amenitiesText = amenitiesSection?.textContent?.toLowerCase() || '';
        data.hasPool = amenitiesText.includes('pool') || amenitiesText.includes('spa');

        // Extract MLS number
        const mlsElement = Array.from(document.querySelectorAll('.property-info-item, .listing-info-item'))
          .find((el: any) => el.textContent?.includes('MLS') || el.textContent?.includes('Listing ID'));
        if (mlsElement) {
          const mlsText = mlsElement.querySelector('.value, dd')?.textContent?.trim();
          data.mlsNumber = mlsText?.replace(/[^A-Z0-9]/gi, '');
        }

        // Extract status
        const statusElement = document.querySelector('.property-status, .listing-status, [data-testid="status"]');
        data.status = statusElement?.textContent?.trim();

        // Extract days on market
        const domElement = Array.from(document.querySelectorAll('.property-info-item, .key-fact-item'))
          .find((el: any) => el.textContent?.includes('Days on') || el.textContent?.includes('On Market'));
        if (domElement) {
          data.daysOnMarket = extractNumber(domElement.querySelector('.value, dd')?.textContent);
        }

        // Extract images
        const imageElements = document.querySelectorAll('.photo-carousel img, .gallery-photo img, [data-testid="photo"] img');
        data.imageUrls = Array.from(imageElements)
          .map((img: any) => {
            let src = img.src || img.dataset.src || img.dataset.lazySrc;
            // Get high-res version if available
            if (src && src.includes('w=')) {
              src = src.replace(/w=\d+/, 'w=1920').replace(/h=\d+/, 'h=1080');
            }
            return src;
          })
          .filter((src: string) => src && !src.includes('placeholder') && !src.includes('blank'));

        // Try hero image as primary
        const heroImage = document.querySelector('.hero-image img, .main-photo img');
        data.primaryImageUrl = heroImage?.getAttribute('src') || data.imageUrls?.[0];

        // Extract school information
        const schoolSection = document.querySelector('.schools-section, .school-info');
        if (schoolSection) {
          const schoolItems = schoolSection.querySelectorAll('.school-item, .school-row');
          schoolItems.forEach((school: any) => {
            const name = school.querySelector('.school-name')?.textContent?.trim();
            const type = school.querySelector('.school-type, .grades')?.textContent?.toLowerCase();
            
            if (name) {
              if (type?.includes('elementary') || type?.includes('k-5')) {
                data.elementarySchool = name;
              } else if (type?.includes('middle') || type?.includes('6-8')) {
                data.middleSchool = name;
              } else if (type?.includes('high') || type?.includes('9-12')) {
                data.highSchool = name;
              }
            }
          });
        }

        // Try to get coordinates from page data or scripts
        try {
          const scriptTags = Array.from(document.querySelectorAll('script'));
          for (const script of scriptTags) {
            const content = script.textContent || '';
            
            // Look for various coordinate patterns
            const patterns = [
              /"latitude":\s*([-\d.]+).*?"longitude":\s*([-\d.]+)/,
              /lat['"]*:\s*([-\d.]+).*?lng['"]*:\s*([-\d.]+)/,
              /coordinates.*?lat.*?([-\d.]+).*?lng.*?([-\d.]+)/i
            ];
            
            for (const pattern of patterns) {
              const match = content.match(pattern);
              if (match) {
                data.latitude = parseFloat(match[1]);
                data.longitude = parseFloat(match[2]);
                break;
              }
            }
            if (data.latitude) break;
          }
        } catch (e) {
          // Ignore coordinate extraction errors
        }

        // Extract listing date
        const listingDateElement = Array.from(document.querySelectorAll('.property-info-item, .listing-info-item'))
          .find((el: any) => el.textContent?.includes('Listed') || el.textContent?.includes('List Date'));
        if (listingDateElement) {
          const dateText = listingDateElement.querySelector('.value, dd')?.textContent?.trim();
          data.listingDate = dateText;
        }

        return data;
      }, url);

      // Parse and normalize the extracted data
      const normalizedData: RawPropertyData = {
        source: 'homes.com',
        sourceUrl: url,
        sourcePropertyId: this.extractHomesId(url),
        address: propertyData.address || '',
        city: propertyData.city || '',
        state: propertyData.state || 'AZ',
        zipCode: propertyData.zipCode || '',
        county: 'Maricopa',
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
        hasPool: propertyData.hasPool || false,
        garageSpaces: propertyData.garageSpaces || 0,
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
      if (propertyData.hoaText && !propertyData.hoaText.toLowerCase().includes('no hoa')) {
        const hoaInfo = this.parseHOAFee(propertyData.hoaText);
        if (hoaInfo) {
          normalizedData.hasHOA = true;
          normalizedData.hoaFee = hoaInfo.fee;
          normalizedData.hoaFrequency = hoaInfo.frequency;
        }
      } else if (propertyData.hoaText?.toLowerCase().includes('no hoa')) {
        normalizedData.hasHOA = false;
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
    minSqft?: number;
    minLotSize?: number;
    pool?: 'Yes' | 'No' | 'Neutral';
    hoa?: 'No HOA' | 'HOA only' | 'No preference';
    homeStyle?: 'Single-story' | 'Multi-level' | 'No preference';
    garageSpaces?: number;
  }): Promise<ScrapeResult> {
    const startTime = Date.now();
    const properties: RawPropertyData[] = [];
    const errors: string[] = [];

    try {
      await this.initBrowser();
      if (!this.page) {
        throw this.createError(ScrapeErrorType.UNKNOWN, 'Failed to initialize browser');
      }

      // Build search URL with preference mappings
      const searchUrl = this.buildSearchUrl(criteria);
      
      // Navigate to search page
      await this.page.goto(searchUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });

      // Wait for results to load
      await this.page.waitForSelector('.property-card', {
        timeout: 10000
      }).catch(() => {
        // Try alternative selectors
        return this.page?.waitForSelector('.listing-card', { timeout: 5000 });
      });

      await this.sleep(3000);

      // Extract property URLs from search results
      const propertyUrls = await this.page.evaluate(() => {
        const cards = document.querySelectorAll('.property-card a, .listing-card a, [data-testid="property-card"] a');
        const urls: string[] = [];
        
        cards.forEach((card: any) => {
          const href = card.href;
          if (href && href.includes('/p/')) {
            // Ensure it's a full URL
            const fullUrl = href.startsWith('http') ? href : `https://www.homes.com${href}`;
            if (!urls.includes(fullUrl)) {
              urls.push(fullUrl);
            }
          }
        });

        return urls.slice(0, 20); // Limit to 20 properties
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
        source: 'homes.com',
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
        source: 'homes.com',
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
    let baseUrl = 'https://www.homes.com/';
    
    // Location-based URL
    if (criteria.zipCode) {
      baseUrl += `${criteria.zipCode}-az/`;
    } else if (criteria.city) {
      const citySlug = criteria.city.toLowerCase().replace(/\s+/g, '-');
      baseUrl += `${citySlug}-az/`;
    } else {
      baseUrl += 'maricopa-county-az/';
    }

    // Build query parameters
    const params: string[] = [];
    
    // Price range
    if (criteria.minPrice) {
      params.push(`price-min=${criteria.minPrice}`);
    }
    if (criteria.maxPrice) {
      params.push(`price-max=${criteria.maxPrice}`);
    }
    
    // Bedrooms (matching form field)
    if (criteria.minBeds) {
      params.push(`beds-min=${criteria.minBeds}`);
    }
    
    // Bathrooms (matching form field)
    if (criteria.minBaths) {
      params.push(`baths-min=${criteria.minBaths}`);
    }
    
    // Square footage (from form's minSquareFootage)
    if (criteria.minSqft) {
      params.push(`sqft-min=${criteria.minSqft}`);
    }
    
    // Lot size in square feet (from form's minLotSize)
    if (criteria.minLotSize) {
      params.push(`lot-sqft-min=${criteria.minLotSize}`);
    }
    
    // Property type mapping (from form's propertyType)
    if (criteria.propertyType) {
      const typeMap: { [key: string]: string } = {
        'Single Family': 'single-family',
        'Condo': 'condos',
        'Townhouse': 'townhomes',
        'Multi-Family': 'multi-family'
      };
      const homesType = typeMap[criteria.propertyType];
      if (homesType) {
        params.push(`type=${homesType}`);
      }
    }
    
    // HOA preference (from form's hoa field)
    if (criteria.hoa === 'No HOA') {
      params.push('no-hoa=true');
    }
    
    // Pool preference (from form's pool field)
    if (criteria.pool === 'Yes') {
      params.push('pool=true');
    }
    
    // Stories/home style (from form's homeStyle)
    if (criteria.homeStyle === 'Single-story') {
      params.push('stories=1');
    }
    
    // Garage spaces (from form's garageSpaces)
    if (criteria.garageSpaces && criteria.garageSpaces > 0) {
      params.push(`parking-min=${criteria.garageSpaces}`);
    }

    // Add parameters to URL
    if (params.length > 0) {
      baseUrl += '?' + params.join('&');
    }

    return baseUrl;
  }

  private extractHomesId(url: string): string | undefined {
    // Extract property ID from Homes.com URL pattern
    const match = url.match(/\/p\/([A-Z0-9-]+)/i);
    return match ? match[1] : undefined;
  }

  private parseListingStatus(status: string | undefined): ListingStatus {
    if (!status) return 'active';
    
    const normalized = status.toLowerCase();
    if (normalized.includes('pending')) return 'pending';
    if (normalized.includes('sold')) return 'sold';
    if (normalized.includes('coming soon')) return 'coming-soon';
    if (normalized.includes('off market') || normalized.includes('off-market')) return 'off-market';
    
    return 'active';
  }

  private parsePropertyType(type: string | undefined): PropertyType {
    if (!type) return 'Single Family';
    
    const normalized = type.toLowerCase();
    if (normalized.includes('condo')) return 'Condo';
    if (normalized.includes('townhouse') || normalized.includes('townhome')) return 'Townhouse';
    if (normalized.includes('multi') || normalized.includes('duplex') || normalized.includes('triplex')) return 'Multi-Family';
    if (normalized.includes('manufactured') || normalized.includes('mobile')) return 'Manufactured';
    if (normalized.includes('land') || normalized.includes('lot')) return 'Land';
    
    return 'Single Family';
  }
}