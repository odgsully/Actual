/**
 * Redfin property scraper implementation
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

export class RedfinScraper extends PropertyScraper {
  private userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  ];

  constructor() {
    const rateLimitConfig: RateLimitConfig = {
      source: 'redfin',
      requestsPerHour: 120,
      requestsPerMinute: 6,
      delayBetweenRequests: 4000, // 4 seconds
      maxConcurrent: 2,
      retryDelay: 8000, // 8 seconds
      maxRetries: 3
    };
    super('redfin', rateLimitConfig);
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
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });

    this.context = await this.browser.newContext({
      userAgent,
      viewport: { width: 1920, height: 1080 },
      locale: 'en-US',
      timezoneId: 'America/Phoenix',
      permissions: [],
      geolocation: { latitude: 33.4484, longitude: -112.0740 } // Phoenix coordinates
    });

    // Add stealth modifications
    await this.context.addInitScript(() => {
      // Override navigator properties
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined
      });
      
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5]
      });

      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en']
      });

      // Override chrome object
      (window as any).chrome = {
        runtime: {}
      };
    });

    this.page = await this.context.newPage();
    
    // Set extra headers
    await this.page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none'
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
      await this.page.waitForSelector('.aboveTheFold', { 
        timeout: 10000 
      }).catch(() => {
        // Try alternative selector
        return this.page?.waitForSelector('[data-rf-test-id="abp-homeinfo"]', { timeout: 5000 });
      });

      // Add small delay to ensure dynamic content loads
      await this.sleep(2000);

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

        const extractNumber = (text: string | undefined): number | undefined => {
          if (!text) return undefined;
          const cleaned = text.replace(/[^0-9.-]/g, '');
          const num = parseFloat(cleaned);
          return isNaN(num) ? undefined : num;
        };

        // Extract price
        const priceText = getText('[data-rf-test-id="abp-price"] .statsValue') ||
                         getText('.price .statsValue') ||
                         getText('[data-rf-test-id="abp-price"]');
        data.listPrice = extractNumber(priceText);

        // Extract address
        const streetAddress = getText('[data-rf-test-id="abp-streetLine"]') ||
                            getText('.street-address');
        const cityStateZip = getText('[data-rf-test-id="abp-cityStateZip"]') ||
                           getText('.locality');
        
        if (streetAddress) {
          data.address = streetAddress;
        }
        
        if (cityStateZip) {
          const parts = cityStateZip.split(',').map(s => s.trim());
          if (parts.length >= 2) {
            data.city = parts[0];
            const stateZip = parts[1].trim().split(' ');
            data.state = stateZip[0];
            data.zipCode = stateZip[1];
          }
        }

        // Extract bed/bath/sqft
        const bedText = getText('[data-rf-test-id="abp-beds"] .statsValue') ||
                       getText('.beds .statsValue');
        data.bedrooms = extractNumber(bedText);

        const bathText = getText('[data-rf-test-id="abp-baths"] .statsValue') ||
                        getText('.baths .statsValue');
        data.bathrooms = extractNumber(bathText);

        const sqftText = getText('[data-rf-test-id="abp-sqFt"] .statsValue') ||
                        getText('.sqft .statsValue');
        data.squareFeet = extractNumber(sqftText);

        // Extract property type
        const propertyTypeElement = Array.from(document.querySelectorAll('.keyDetail'))
          .find((el: any) => el.textContent?.includes('Style'));
        data.propertyType = propertyTypeElement?.querySelector('.content')?.textContent?.trim();

        // Extract year built
        const yearBuiltElement = Array.from(document.querySelectorAll('.keyDetail'))
          .find((el: any) => el.textContent?.includes('Year Built'));
        data.yearBuilt = extractNumber(yearBuiltElement?.querySelector('.content')?.textContent);

        // Extract lot size
        const lotElement = Array.from(document.querySelectorAll('.keyDetail'))
          .find((el: any) => el.textContent?.includes('Lot Size'));
        const lotText = lotElement?.querySelector('.content')?.textContent;
        if (lotText) {
          // Convert acres to sqft if needed
          if (lotText.includes('Acre')) {
            const acres = extractNumber(lotText);
            data.lotSize = acres ? acres * 43560 : undefined;
          } else {
            data.lotSize = extractNumber(lotText);
          }
        }

        // Extract HOA
        const hoaElement = Array.from(document.querySelectorAll('.keyDetail'))
          .find((el: any) => el.textContent?.includes('HOA Dues'));
        data.hoaText = hoaElement?.querySelector('.content')?.textContent?.trim();

        // Extract garage
        const garageElement = Array.from(document.querySelectorAll('.amenity-group'))
          .find((el: any) => el.textContent?.includes('Garage'));
        if (garageElement) {
          const garageText = garageElement.textContent;
          const garageMatch = garageText.match(/(\d+)[\s-]*(car|space)/i);
          data.garageSpaces = garageMatch ? parseInt(garageMatch[1]) : 0;
        }

        // Extract pool
        const amenityText = document.querySelector('.amenities-container')?.textContent?.toLowerCase() || '';
        data.hasPool = amenityText.includes('pool') || amenityText.includes('spa');

        // Extract MLS number
        const mlsElement = Array.from(document.querySelectorAll('.keyDetail'))
          .find((el: any) => el.textContent?.includes('MLS#'));
        data.mlsNumber = mlsElement?.querySelector('.content')?.textContent?.trim();

        // Extract status
        const statusElement = document.querySelector('.HomeMainStats .Pill') ||
                            document.querySelector('[data-rf-test-id="abp-status"]');
        data.status = statusElement?.textContent?.trim();

        // Extract days on market
        const domElement = Array.from(document.querySelectorAll('.keyDetail'))
          .find((el: any) => el.textContent?.includes('Days on Redfin'));
        data.daysOnMarket = extractNumber(domElement?.querySelector('.content')?.textContent);

        // Extract images
        const imageElements = document.querySelectorAll('.InlinePhotoPreview img, .PhotoThumbnail img');
        data.imageUrls = Array.from(imageElements)
          .map((img: any) => {
            // Get high-res version of image
            let src = img.src || img.dataset.src;
            if (src && src.includes('resize')) {
              src = src.replace(/resize\?.*$/, '');
            }
            return src;
          })
          .filter((src: string) => src && !src.includes('placeholder'));

        data.primaryImageUrl = data.imageUrls?.[0];

        // Extract school information
        const schoolElements = document.querySelectorAll('.school-name');
        schoolElements.forEach((school: any) => {
          const name = school.textContent?.trim();
          const schoolCard = school.closest('.school-card');
          const grades = schoolCard?.querySelector('.grades')?.textContent?.toLowerCase();
          
          if (grades?.includes('k-5') || grades?.includes('elementary')) {
            data.elementarySchool = name;
          } else if (grades?.includes('6-8') || grades?.includes('middle')) {
            data.middleSchool = name;
          } else if (grades?.includes('9-12') || grades?.includes('high')) {
            data.highSchool = name;
          }
        });

        // Try to get coordinates
        try {
          const scriptTags = Array.from(document.querySelectorAll('script'));
          for (const script of scriptTags) {
            const content = script.textContent || '';
            if (content.includes('"latitude"') && content.includes('"longitude"')) {
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

        // Extract listing date
        const listingDateElement = Array.from(document.querySelectorAll('.keyDetail'))
          .find((el: any) => el.textContent?.includes('Listed'));
        const listingDateText = listingDateElement?.querySelector('.content')?.textContent;
        if (listingDateText) {
          data.listingDate = listingDateText;
        }

        return data;
      }, url);

      // Parse and normalize the extracted data
      const normalizedData: RawPropertyData = {
        source: 'redfin',
        sourceUrl: url,
        sourcePropertyId: this.extractRedfinId(url),
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

      // Build search URL with user preference mappings
      const searchUrl = this.buildSearchUrl(criteria);
      
      // Navigate to search page
      await this.page.goto(searchUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });

      // Wait for results to load
      await this.page.waitForSelector('[data-rf-test-name="mapHomeCard"]', {
        timeout: 10000
      }).catch(() => {
        // Try alternative selector
        return this.page?.waitForSelector('.HomeCard', { timeout: 5000 });
      });

      await this.sleep(2000);

      // Extract property URLs from search results
      const propertyUrls = await this.page.evaluate(() => {
        const cards = document.querySelectorAll('[data-rf-test-name="mapHomeCard"] a, .HomeCard a');
        const urls: string[] = [];
        
        cards.forEach((card: any) => {
          const href = card.href;
          if (href && (href.includes('/home/') || href.includes('/AZ/'))) {
            // Ensure it's a full URL
            const fullUrl = href.startsWith('http') ? href : `https://www.redfin.com${href}`;
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
        source: 'redfin',
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
        source: 'redfin',
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
    let baseUrl = 'https://www.redfin.com/city/';
    
    // Map cities to Redfin city IDs for Arizona
    const cityMap: { [key: string]: string } = {
      'Phoenix': '14240/AZ/Phoenix',
      'Scottsdale': '16657/AZ/Scottsdale',
      'Mesa': '11857/AZ/Mesa',
      'Chandler': '3833/AZ/Chandler',
      'Tempe': '18409/AZ/Tempe',
      'Gilbert': '6826/AZ/Gilbert',
      'Glendale': '7001/AZ/Glendale',
      'Paradise Valley': '30916/AZ/Paradise-Valley',
      'Peoria': '14372/AZ/Peoria'
    };

    if (criteria.zipCode) {
      baseUrl = `https://www.redfin.com/zipcode/${criteria.zipCode}`;
    } else if (criteria.city && cityMap[criteria.city]) {
      baseUrl = `https://www.redfin.com/city/${cityMap[criteria.city]}`;
    } else {
      baseUrl = 'https://www.redfin.com/county/332/AZ/Maricopa-County';
    }

    // Build filter parameters
    const filters: string[] = [];
    
    // Price range (convert to Redfin format)
    if (criteria.minPrice) {
      filters.push(`min-price=${criteria.minPrice}`);
    }
    if (criteria.maxPrice) {
      filters.push(`max-price=${criteria.maxPrice}`);
    }
    
    // Bedrooms
    if (criteria.minBeds) {
      filters.push(`min-beds=${criteria.minBeds}`);
    }
    
    // Bathrooms  
    if (criteria.minBaths) {
      filters.push(`min-baths=${criteria.minBaths}`);
    }
    
    // Square footage (from form's minSquareFootage)
    if (criteria.minSqft) {
      filters.push(`min-sqft=${criteria.minSqft}`);
    }
    
    // Lot size (convert from sqft to acres for Redfin)
    if (criteria.minLotSize) {
      const acres = criteria.minLotSize / 43560;
      filters.push(`min-lot-size=${acres.toFixed(2)}`);
    }
    
    // Property type mapping
    if (criteria.propertyType) {
      const typeMap: { [key: string]: string } = {
        'Single Family': 'house',
        'Condo': 'condo',
        'Townhouse': 'townhouse',
        'Multi-Family': 'multifamily'
      };
      const redfinType = typeMap[criteria.propertyType];
      if (redfinType) {
        filters.push(`property-type=${redfinType}`);
      }
    }
    
    // Pool filter (from form's pool preference)
    if (criteria.pool === 'Yes') {
      filters.push('pool=1');
    }
    
    // HOA filter (from form's hoa preference)
    if (criteria.hoa === 'No HOA') {
      filters.push('hoa=0');
    } else if (criteria.hoa === 'HOA only') {
      filters.push('min-hoa=1');
    }
    
    // Stories/home style (Single-story = 1 story)
    if (criteria.homeStyle === 'Single-story') {
      filters.push('max-num-stories=1');
    }
    
    // Garage spaces
    if (criteria.garageSpaces) {
      filters.push(`min-parking=${criteria.garageSpaces}`);
    }

    // Add filters to URL
    if (filters.length > 0) {
      baseUrl += '/filter/' + filters.join(',');
    }

    return baseUrl;
  }

  private extractRedfinId(url: string): string | undefined {
    const match = url.match(/\/(\d+)(?:\/|$)/);
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
}