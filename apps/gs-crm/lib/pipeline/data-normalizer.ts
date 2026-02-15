/**
 * Data normalization pipeline for property data from multiple sources
 */

import { 
  RawPropertyData, 
  NormalizedProperty, 
  PropertyType, 
  ListingStatus,
  PropertySource 
} from '@/lib/scraping/types';

export class DataNormalizer {
  private readonly maricopaCities = new Set([
    'phoenix', 'mesa', 'chandler', 'scottsdale', 'glendale', 
    'tempe', 'peoria', 'surprise', 'avondale', 'goodyear',
    'buckeye', 'el mirage', 'gilbert', 'queen creek', 'fountain hills',
    'paradise valley', 'cave creek', 'carefree', 'wickenburg', 'litchfield park',
    'tolleson', 'youngtown', 'guadalupe', 'sun city', 'sun city west',
    'anthem', 'laveen', 'ahwatukee'
  ]);

  private readonly maricopaZipCodes = new Set([
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
    // Other cities
    '85331', '85335', '85338', '85339', '85340', '85342', '85343', '85351', '85353',
    '85354', '85355', '85361', '85363', '85364', '85365', '85373', '85374', '85375',
    '85376', '85377', '85378', '85379', '85387', '85388', '85390', '85392', '85395'
  ]);

  /**
   * Normalize raw property data from any source
   */
  normalize(raw: RawPropertyData): NormalizedProperty | null {
    // Validate required fields
    if (!this.validateRequired(raw)) {
      console.warn(`Invalid property data: missing required fields for ${raw.address}`);
      return null;
    }

    // Check if property is in Maricopa County
    if (!this.isInMaricopaCounty(raw)) {
      console.log(`Property not in Maricopa County: ${raw.address}, ${raw.city}, ${raw.zipCode}`);
      return null;
    }

    // Create normalized property
    const normalized: NormalizedProperty = {
      // Location
      address: this.normalizeAddress(raw.address),
      city: this.normalizeCity(raw.city),
      state: 'AZ', // Always Arizona
      zipCode: this.normalizeZipCode(raw.zipCode),
      county: 'Maricopa',
      latitude: raw.latitude,
      longitude: raw.longitude,

      // Listing information
      listPrice: this.normalizePrice(raw.listPrice),
      status: raw.status || 'active',
      listingDate: raw.listingDate,
      daysOnMarket: raw.daysOnMarket,

      // Property details
      propertyType: this.normalizePropertyType(raw.propertyType),
      bedrooms: Math.max(0, raw.bedrooms || 0),
      bathrooms: Math.max(0, raw.bathrooms || 0),
      squareFeet: raw.squareFeet ? Math.round(raw.squareFeet) : undefined,
      lotSize: this.normalizeLotSize(raw.lotSize),
      yearBuilt: this.normalizeYear(raw.yearBuilt),

      // Features
      hasPool: raw.hasPool || false,
      garageSpaces: Math.max(0, raw.garageSpaces || 0),
      hasHOA: raw.hasHOA || false,
      hoaFee: raw.hoaFee,

      // Schools
      elementarySchool: this.normalizeSchoolName(raw.elementarySchool),
      middleSchool: this.normalizeSchoolName(raw.middleSchool),
      highSchool: this.normalizeSchoolName(raw.highSchool),
      schoolDistrict: raw.schoolDistrict,

      // Images
      primaryImageUrl: raw.primaryImageUrl,
      additionalImageUrls: raw.imageUrls?.slice(1),

      // MLS
      mlsNumber: this.normalizeMlsNumber(raw.mlsNumber),

      // Source tracking
      dataSources: [raw.source],
      lastScrapedAt: raw.scrapedAt || new Date(),
      scrapeHistory: [{
        source: raw.source,
        scrapedAt: raw.scrapedAt || new Date()
      }]
    };

    // Calculate match score if we have enough data
    if (normalized.listPrice && normalized.bedrooms && normalized.bathrooms) {
      normalized.matchScore = this.calculateBaseMatchScore(normalized);
    }

    return normalized;
  }

  /**
   * Merge data from multiple sources for the same property
   */
  mergeProperties(properties: NormalizedProperty[]): NormalizedProperty {
    if (properties.length === 0) {
      throw new Error('Cannot merge empty property array');
    }

    if (properties.length === 1) {
      return properties[0];
    }

    // Sort by last scraped date (most recent first)
    const sorted = properties.sort((a, b) => 
      b.lastScrapedAt.getTime() - a.lastScrapedAt.getTime()
    );

    // Use most recent as base
    const merged = { ...sorted[0] };

    // Merge data sources
    const allSources = new Set<PropertySource>();
    const allHistory: any[] = [];

    for (const prop of properties) {
      prop.dataSources.forEach(s => allSources.add(s));
      if (prop.scrapeHistory) {
        allHistory.push(...prop.scrapeHistory);
      }

      // Fill in missing data from other sources
      if (!merged.latitude && prop.latitude) merged.latitude = prop.latitude;
      if (!merged.longitude && prop.longitude) merged.longitude = prop.longitude;
      if (!merged.squareFeet && prop.squareFeet) merged.squareFeet = prop.squareFeet;
      if (!merged.lotSize && prop.lotSize) merged.lotSize = prop.lotSize;
      if (!merged.yearBuilt && prop.yearBuilt) merged.yearBuilt = prop.yearBuilt;
      if (!merged.mlsNumber && prop.mlsNumber) merged.mlsNumber = prop.mlsNumber;
      
      // Schools
      if (!merged.elementarySchool && prop.elementarySchool) {
        merged.elementarySchool = prop.elementarySchool;
      }
      if (!merged.middleSchool && prop.middleSchool) {
        merged.middleSchool = prop.middleSchool;
      }
      if (!merged.highSchool && prop.highSchool) {
        merged.highSchool = prop.highSchool;
      }

      // Merge image URLs
      if (prop.additionalImageUrls) {
        merged.additionalImageUrls = [
          ...(merged.additionalImageUrls || []),
          ...prop.additionalImageUrls
        ].filter((url, index, self) => self.indexOf(url) === index); // Remove duplicates
      }
    }

    merged.dataSources = Array.from(allSources);
    merged.scrapeHistory = allHistory;

    return merged;
  }

  /**
   * Validate required fields
   */
  private validateRequired(raw: RawPropertyData): boolean {
    return !!(
      raw.address &&
      raw.city &&
      raw.zipCode &&
      raw.listPrice &&
      raw.listPrice > 0 &&
      raw.bedrooms >= 0 &&
      raw.bathrooms >= 0
    );
  }

  /**
   * Check if property is in Maricopa County
   */
  private isInMaricopaCounty(raw: RawPropertyData): boolean {
    // Check zip code
    if (raw.zipCode && this.maricopaZipCodes.has(raw.zipCode)) {
      return true;
    }

    // Check city
    const cityLower = raw.city?.toLowerCase().trim();
    if (cityLower && this.maricopaCities.has(cityLower)) {
      return true;
    }

    // Check explicit county field
    if (raw.county?.toLowerCase() === 'maricopa') {
      return true;
    }

    // Check coordinates (rough bounding box for Maricopa County)
    if (raw.latitude && raw.longitude) {
      const lat = raw.latitude;
      const lng = raw.longitude;
      
      // Approximate Maricopa County boundaries
      if (lat >= 32.5 && lat <= 34.0 && lng >= -113.5 && lng <= -111.0) {
        return true;
      }
    }

    return false;
  }

  /**
   * Normalize address
   */
  private normalizeAddress(address: string): string {
    if (!address) return '';

    return address
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/,\s*/g, ', ')
      .replace(/\.\s*/g, '. ')
      .replace(/^(\d+)\s+([NSEW])\s+/i, '$1 $2 ')
      .replace(/\b(St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Ln|Lane|Blvd|Boulevard|Ct|Court|Pl|Place|Way|Cir|Circle|Pkwy|Parkway|Ter|Terrace)\b\.?$/gi, (match, p1) => {
        // Standardize street suffixes
        const suffixMap: { [key: string]: string } = {
          'st': 'St',
          'street': 'St',
          'ave': 'Ave',
          'avenue': 'Ave',
          'rd': 'Rd',
          'road': 'Rd',
          'dr': 'Dr',
          'drive': 'Dr',
          'ln': 'Ln',
          'lane': 'Ln',
          'blvd': 'Blvd',
          'boulevard': 'Blvd',
          'ct': 'Ct',
          'court': 'Ct',
          'pl': 'Pl',
          'place': 'Pl',
          'way': 'Way',
          'cir': 'Cir',
          'circle': 'Cir',
          'pkwy': 'Pkwy',
          'parkway': 'Pkwy',
          'ter': 'Ter',
          'terrace': 'Ter'
        };
        return suffixMap[p1.toLowerCase()] || p1;
      });
  }

  /**
   * Normalize city name
   */
  private normalizeCity(city: string): string {
    if (!city) return '';

    // Proper case for city names
    return city
      .trim()
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .replace(/\bEl\s+Mirage\b/i, 'El Mirage')
      .replace(/\bSun\s+City\s+West\b/i, 'Sun City West')
      .replace(/\bSun\s+City\b/i, 'Sun City')
      .replace(/\bParadise\s+Valley\b/i, 'Paradise Valley')
      .replace(/\bCave\s+Creek\b/i, 'Cave Creek')
      .replace(/\bLitchfield\s+Park\b/i, 'Litchfield Park')
      .replace(/\bQueen\s+Creek\b/i, 'Queen Creek')
      .replace(/\bFountain\s+Hills\b/i, 'Fountain Hills');
  }

  /**
   * Normalize zip code
   */
  private normalizeZipCode(zip: string): string {
    if (!zip) return '';
    
    // Extract 5-digit zip
    const match = zip.match(/(\d{5})/);
    return match ? match[1] : zip.trim();
  }

  /**
   * Normalize price
   */
  private normalizePrice(price: number): number {
    // Ensure price is reasonable
    if (price < 10000) return 0; // Likely an error
    if (price > 100000000) return 0; // Likely an error
    return Math.round(price);
  }

  /**
   * Normalize property type
   */
  private normalizePropertyType(type: PropertyType | string): PropertyType {
    if (!type) return 'Single Family';

    const typeLower = type.toLowerCase();
    
    if (typeLower.includes('condo')) return 'Condo';
    if (typeLower.includes('townhouse') || typeLower.includes('townhome')) return 'Townhouse';
    if (typeLower.includes('multi') || typeLower.includes('duplex') || typeLower.includes('triplex')) {
      return 'Multi-Family';
    }
    if (typeLower.includes('manufactured') || typeLower.includes('mobile')) return 'Manufactured';
    if (typeLower.includes('land') || typeLower.includes('lot')) return 'Land';
    
    return 'Single Family';
  }

  /**
   * Normalize lot size
   */
  private normalizeLotSize(lotSize?: number): number | undefined {
    if (!lotSize) return undefined;
    
    // Convert to square feet if needed (assuming anything under 500 is in acres)
    if (lotSize < 500) {
      return Math.round(lotSize * 43560);
    }
    
    return Math.round(lotSize);
  }

  /**
   * Normalize year
   */
  private normalizeYear(year?: number): number | undefined {
    if (!year) return undefined;
    
    const currentYear = new Date().getFullYear();
    
    // Validate reasonable year range
    if (year < 1800 || year > currentYear + 2) {
      return undefined;
    }
    
    return year;
  }

  /**
   * Normalize school name
   */
  private normalizeSchoolName(name?: string): string | undefined {
    if (!name) return undefined;
    
    return name
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/elementary school/i, 'Elementary')
      .replace(/middle school/i, 'Middle')
      .replace(/high school/i, 'High')
      .replace(/school$/i, 'School');
  }

  /**
   * Normalize MLS number
   */
  private normalizeMlsNumber(mls?: string): string | undefined {
    if (!mls) return undefined;
    
    // Remove common prefixes and clean up
    return mls
      .toUpperCase()
      .replace(/^(MLS|ARMLS|AZ)[#:\s]*/i, '')
      .replace(/[^A-Z0-9]/g, '')
      .trim();
  }

  /**
   * Calculate base match score
   */
  private calculateBaseMatchScore(property: NormalizedProperty): number {
    let score = 50; // Base score

    // Price factors
    if (property.listPrice) {
      if (property.listPrice < 300000) score += 10;
      else if (property.listPrice < 500000) score += 5;
    }

    // Size factors
    if (property.squareFeet) {
      if (property.squareFeet >= 2000) score += 10;
      if (property.squareFeet >= 3000) score += 5;
    }

    // Room factors
    if (property.bedrooms >= 3) score += 10;
    if (property.bathrooms >= 2) score += 10;

    // Feature factors
    if (property.hasPool) score += 5;
    if (property.garageSpaces >= 2) score += 5;
    if (!property.hasHOA) score += 5;

    // Location factors (premium cities)
    const premiumCities = ['Scottsdale', 'Paradise Valley', 'Gilbert'];
    if (premiumCities.includes(property.city)) {
      score += 10;
    }

    return Math.min(100, score);
  }

  /**
   * Detect duplicates based on address matching
   */
  isDuplicate(prop1: NormalizedProperty, prop2: NormalizedProperty): boolean {
    // Check MLS number first (most reliable)
    if (prop1.mlsNumber && prop2.mlsNumber) {
      return prop1.mlsNumber === prop2.mlsNumber;
    }

    // Check address and zip
    const addr1 = this.normalizeAddress(prop1.address).toLowerCase();
    const addr2 = this.normalizeAddress(prop2.address).toLowerCase();
    
    if (addr1 === addr2 && prop1.zipCode === prop2.zipCode) {
      return true;
    }

    // Check coordinates (within ~50 meters)
    if (prop1.latitude && prop1.longitude && prop2.latitude && prop2.longitude) {
      const distance = this.calculateDistance(
        prop1.latitude, prop1.longitude,
        prop2.latitude, prop2.longitude
      );
      
      if (distance < 0.05) { // ~50 meters
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate distance between two coordinates (in km)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
}

// Singleton instance
let dataNormalizerInstance: DataNormalizer | null = null;

export function getDataNormalizer(): DataNormalizer {
  if (!dataNormalizerInstance) {
    dataNormalizerInstance = new DataNormalizer();
  }
  return dataNormalizerInstance;
}