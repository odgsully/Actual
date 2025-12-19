# Zillow Authenticated Favorites Extraction System
## Complete Implementation Guide for User's Saved Properties

---

## 🎯 Objective
Extract a user's saved/favorited properties from their Zillow account with proper authentication, session management, and data persistence.

---

## 📋 Table of Contents
1. [Authentication Architecture](#authentication-architecture)
2. [Session Management](#session-management)
3. [Favorites API Discovery](#favorites-api-discovery)
4. [Data Extraction Methods](#data-extraction-methods)
5. [Implementation Strategies](#implementation-strategies)
6. [Security & Storage](#security--storage)
7. [Error Handling](#error-handling)
8. [Production Deployment](#production-deployment)

---

## Authentication Architecture

### Method 1: Direct API Authentication
```typescript
class ZillowAuthenticator {
  private readonly endpoints = {
    login: 'https://www.zillow.com/user/acct/login/',
    session: 'https://www.zillow.com/user/acct/ajax/login/',
    favorites: 'https://www.zillow.com/myzillow/favorites',
    graphql: 'https://www.zillow.com/graphql'
  };

  async authenticate(email: string, password: string): Promise<Session> {
    // Step 1: Get CSRF token
    const csrfToken = await this.getCSRFToken();
    
    // Step 2: Submit login
    const response = await fetch(this.endpoints.session, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-CSRF-Token': csrfToken,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        'Accept': 'application/json',
        'Origin': 'https://www.zillow.com',
        'Referer': 'https://www.zillow.com/user/acct/login/'
      },
      body: new URLSearchParams({
        email,
        password,
        remember: 'true',
        source: 'https://www.zillow.com/'
      })
    });

    // Step 3: Extract session cookies
    const cookies = this.extractCookies(response.headers);
    
    return {
      accessToken: cookies['x-access-token'],
      userId: cookies['userid'],
      sessionId: cookies['JSESSIONID'],
      csrfToken: cookies['_csrf'],
      expiry: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };
  }

  private async getCSRFToken(): Promise<string> {
    const response = await fetch('https://www.zillow.com/user/acct/login/');
    const html = await response.text();
    
    // Extract CSRF from meta tag or hidden input
    const csrfMatch = html.match(/<meta name="csrf-token" content="([^"]+)"/);
    if (!csrfMatch) {
      // Fallback to hidden input
      const inputMatch = html.match(/<input[^>]+name="_csrf"[^>]+value="([^"]+)"/);
      return inputMatch?.[1] || '';
    }
    
    return csrfMatch[1];
  }
}
```

### Method 2: Browser Automation Authentication
```typescript
import { chromium, Browser, Page } from 'playwright';

class BrowserAuthenticator {
  private browser: Browser;
  private page: Page;

  async authenticate(email: string, password: string): Promise<Session> {
    // Launch browser with specific settings
    this.browser = await chromium.launch({
      headless: false, // Set to true in production
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-features=site-per-process',
        '--disable-dev-shm-usage'
      ]
    });

    this.page = await this.browser.newPage({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });

    // Step 1: Navigate to login
    await this.page.goto('https://www.zillow.com/user/acct/login/', {
      waitUntil: 'networkidle'
    });

    // Step 2: Fill credentials
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', password);
    
    // Step 3: Handle potential CAPTCHA
    const hasCaptcha = await this.page.isVisible('.recaptcha');
    if (hasCaptcha) {
      await this.handleCaptcha();
    }

    // Step 4: Submit login
    await Promise.all([
      this.page.waitForNavigation(),
      this.page.click('button[type="submit"]')
    ]);

    // Step 5: Extract session data
    const cookies = await this.page.context().cookies();
    const localStorage = await this.page.evaluate(() => {
      return Object.entries(localStorage);
    });

    return this.buildSession(cookies, localStorage);
  }

  private async handleCaptcha(): Promise<void> {
    // Option 1: 2Captcha service integration
    // Option 2: Manual solving with pause
    // Option 3: Audio challenge automation
    console.log('CAPTCHA detected - implementing solving strategy...');
  }
}
```

### Method 3: Mobile App Authentication
```python
import requests
from hashlib import md5
import hmac

class ZillowMobileAuth:
    """Mobile API often has different/weaker protection"""
    
    def __init__(self):
        self.base_url = "https://api.zillow.com/mobile/v2"
        self.app_version = "12.45.0"
        self.device_id = self.generate_device_id()
        
    def authenticate(self, email: str, password: str) -> dict:
        # Mobile endpoints use different auth flow
        headers = {
            'X-App-Version': self.app_version,
            'X-Device-Id': self.device_id,
            'X-Platform': 'iOS',
            'User-Agent': 'Zillow/12.45.0 (iPhone; iOS 15.0; Scale/3.00)',
            'Accept': 'application/json'
        }
        
        # Step 1: Initialize session
        init_response = requests.post(
            f"{self.base_url}/auth/init",
            headers=headers,
            json={'device_id': self.device_id}
        )
        
        session_token = init_response.json()['session_token']
        
        # Step 2: Submit credentials
        auth_response = requests.post(
            f"{self.base_url}/auth/login",
            headers={**headers, 'X-Session-Token': session_token},
            json={
                'email': email,
                'password': password,
                'persist': True
            }
        )
        
        return auth_response.json()
    
    def generate_device_id(self) -> str:
        """Generate consistent device ID"""
        import uuid
        return str(uuid.uuid4())
```

---

## Session Management

### Persistent Session Storage
```typescript
class SessionManager {
  private readonly STORAGE_KEY = 'zillow_session';
  private session: Session | null = null;

  async saveSession(session: Session): Promise<void> {
    // Encrypt sensitive data
    const encrypted = await this.encrypt(session);
    
    // Store in multiple locations for redundancy
    localStorage.setItem(this.STORAGE_KEY, encrypted);
    await this.saveToDatabase(session);
    await this.saveToRedis(session);
  }

  async loadSession(): Promise<Session | null> {
    // Try loading from cache first
    if (this.session && !this.isExpired(this.session)) {
      return this.session;
    }

    // Load from storage
    const encrypted = localStorage.getItem(this.STORAGE_KEY);
    if (!encrypted) return null;

    const session = await this.decrypt(encrypted);
    
    // Validate session is still active
    if (await this.validateSession(session)) {
      this.session = session;
      return session;
    }

    return null;
  }

  async refreshSession(session: Session): Promise<Session> {
    // Zillow sessions can be refreshed via heartbeat
    const response = await fetch('https://www.zillow.com/user/acct/ajax/heartbeat/', {
      headers: {
        'Cookie': this.buildCookieString(session),
        'X-CSRF-Token': session.csrfToken
      }
    });

    if (response.ok) {
      session.expiry = Date.now() + (24 * 60 * 60 * 1000);
      await this.saveSession(session);
    }

    return session;
  }

  private buildCookieString(session: Session): string {
    return [
      `x-access-token=${session.accessToken}`,
      `userid=${session.userId}`,
      `JSESSIONID=${session.sessionId}`,
      `_csrf=${session.csrfToken}`
    ].join('; ');
  }
}
```

### Session Health Monitoring
```python
class SessionHealthMonitor:
    def __init__(self, session_manager):
        self.session_manager = session_manager
        self.health_checks = []
        
    async def monitor_session(self, interval=300):  # 5 minutes
        """Continuously monitor session health"""
        while True:
            health = await self.check_health()
            self.health_checks.append(health)
            
            if not health['is_valid']:
                await self.handle_invalid_session(health)
            
            await asyncio.sleep(interval)
    
    async def check_health(self):
        """Comprehensive health check"""
        return {
            'timestamp': datetime.now(),
            'is_valid': await self.validate_session(),
            'response_time': await self.measure_response_time(),
            'rate_limit_remaining': await self.check_rate_limit(),
            'cookies_valid': self.check_cookie_expiry(),
            'csrf_valid': await self.validate_csrf()
        }
    
    async def handle_invalid_session(self, health_check):
        """Auto-recovery strategies"""
        if not health_check['cookies_valid']:
            await self.refresh_cookies()
        elif not health_check['csrf_valid']:
            await self.refresh_csrf()
        else:
            # Full re-authentication needed
            await self.reauthenticate()
```

---

## Favorites API Discovery

### GraphQL Endpoint Analysis
```typescript
interface FavoritesQuery {
  operationName: 'FavoritesQuery';
  variables: {
    userId: string;
    offset: number;
    limit: number;
    sortType: 'RECENTLY_ADDED' | 'PRICE_HIGH_LOW' | 'PRICE_LOW_HIGH';
  };
  query: string;
}

class FavoritesAPI {
  private readonly GRAPHQL_ENDPOINT = 'https://www.zillow.com/graphql';
  
  async getFavoritesViaGraphQL(session: Session, limit = 50): Promise<Property[]> {
    const query = `
      query FavoritesQuery($userId: ID!, $offset: Int!, $limit: Int!, $sortType: SavedHomeSortType!) {
        viewer {
          savedHomes(
            userId: $userId,
            offset: $offset,
            limit: $limit,
            sortType: $sortType
          ) {
            homes {
              zpid
              address {
                streetAddress
                city
                state
                zipcode
              }
              price
              bedrooms
              bathrooms
              livingArea
              yearBuilt
              propertyType
              listingStatus
              photos {
                url
                caption
              }
              savedDate
              notes
              listing {
                listPrice
                listDate
                daysOnMarket
                agent {
                  name
                  phone
                  email
                }
              }
            }
            totalCount
            hasNextPage
          }
        }
      }
    `;

    const response = await fetch(this.GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': this.buildCookieString(session),
        'X-CSRF-Token': session.csrfToken,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        operationName: 'FavoritesQuery',
        variables: {
          userId: session.userId,
          offset: 0,
          limit: limit,
          sortType: 'RECENTLY_ADDED'
        },
        query: query
      })
    });

    const data = await response.json();
    return this.transformGraphQLResponse(data);
  }

  private transformGraphQLResponse(data: any): Property[] {
    const homes = data?.data?.viewer?.savedHomes?.homes || [];
    
    return homes.map((home: any) => ({
      zpid: home.zpid,
      address: this.formatAddress(home.address),
      price: home.price,
      details: {
        bedrooms: home.bedrooms,
        bathrooms: home.bathrooms,
        sqft: home.livingArea,
        yearBuilt: home.yearBuilt,
        type: home.propertyType
      },
      listing: home.listing,
      savedDate: home.savedDate,
      notes: home.notes,
      images: home.photos?.map((p: any) => p.url) || []
    }));
  }
}
```

### REST API Endpoints
```python
class FavoritesREST:
    """Alternative REST endpoints for favorites"""
    
    endpoints = {
        'favorites_list': 'https://www.zillow.com/myzillow/ajax/favorites/GetFavorites.htm',
        'property_details': 'https://www.zillow.com/myzillow/ajax/favorites/GetPropertyDetails.htm',
        'saved_searches': 'https://www.zillow.com/myzillow/ajax/SavedSearches.htm',
        'activity_feed': 'https://www.zillow.com/myzillow/ajax/ActivityFeed.htm'
    }
    
    async def get_favorites_list(self, session, page=1, page_size=50):
        """Get paginated favorites list"""
        
        params = {
            'page': page,
            'pageSize': page_size,
            'sortOrder': 'dateDescending',
            'includeOffMarket': 'true',
            'includePending': 'true'
        }
        
        response = await self.session.get(
            self.endpoints['favorites_list'],
            params=params,
            headers=self.build_headers(session)
        )
        
        return response.json()
    
    async def get_property_details(self, session, zpids):
        """Get detailed info for multiple properties"""
        
        # Batch request for efficiency
        response = await self.session.post(
            self.endpoints['property_details'],
            json={'zpids': zpids},
            headers=self.build_headers(session)
        )
        
        return response.json()
```

### DOM Scraping Fallback
```typescript
class FavoritesDOMScraper {
  async scrapeFavoritesPage(session: Session): Promise<Property[]> {
    const browser = await this.launchAuthenticatedBrowser(session);
    const page = await browser.newPage();
    
    // Navigate to favorites
    await page.goto('https://www.zillow.com/myzillow/favorites', {
      waitUntil: 'networkidle'
    });

    // Wait for content to load
    await page.waitForSelector('[data-test="saved-homes-list"]', {
      timeout: 10000
    });

    // Scroll to load all properties (lazy loading)
    await this.autoScroll(page);

    // Extract property data
    const properties = await page.evaluate(() => {
      const cards = document.querySelectorAll('[data-test="property-card"]');
      
      return Array.from(cards).map(card => {
        const getTextContent = (selector: string) => 
          card.querySelector(selector)?.textContent?.trim() || '';
        
        const getAttribute = (selector: string, attr: string) =>
          card.querySelector(selector)?.getAttribute(attr) || '';

        return {
          zpid: getAttribute('[data-test="property-card"]', 'data-zpid'),
          address: getTextContent('[data-test="property-card-addr"]'),
          price: getTextContent('[data-test="property-card-price"]'),
          beds: getTextContent('[data-test="bed-bath-item"]:nth-child(1)'),
          baths: getTextContent('[data-test="bed-bath-item"]:nth-child(2)'),
          sqft: getTextContent('[data-test="bed-bath-item"]:nth-child(3)'),
          imageUrl: getAttribute('img', 'src'),
          link: getAttribute('a', 'href'),
          savedDate: getAttribute('[data-test="saved-date"]', 'datetime'),
          notes: getTextContent('[data-test="property-notes"]')
        };
      });
    });

    await browser.close();
    return properties;
  }

  private async autoScroll(page: Page): Promise<void> {
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
  }
}
```

---

## Data Extraction Methods

### Method 1: Network Interception
```typescript
class NetworkInterceptor {
  async interceptFavoritesData(page: Page): Promise<any[]> {
    const responses: any[] = [];
    
    // Intercept all GraphQL responses
    page.on('response', async (response) => {
      const url = response.url();
      
      if (url.includes('/graphql') || url.includes('/ajax/favorites')) {
        try {
          const data = await response.json();
          if (this.isFavoritesResponse(data)) {
            responses.push(data);
          }
        } catch (e) {
          // Not JSON response
        }
      }
    });

    // Navigate to trigger requests
    await page.goto('https://www.zillow.com/myzillow/favorites');
    await page.waitForTimeout(5000);

    return responses;
  }

  private isFavoritesResponse(data: any): boolean {
    return data?.data?.viewer?.savedHomes !== undefined ||
           data?.favorites !== undefined ||
           data?.savedProperties !== undefined;
  }
}
```

### Method 2: Direct Database Query
```python
class ZillowDatabaseExtractor:
    """Extract from browser's IndexedDB/LocalStorage"""
    
    async def extract_from_browser_storage(self, page):
        """Access browser's local database"""
        
        # Extract from IndexedDB
        indexed_db_data = await page.evaluate("""
            async () => {
                const dbs = await indexedDB.databases();
                const data = {};
                
                for (const db of dbs) {
                    if (db.name.includes('zillow')) {
                        const connection = await indexedDB.open(db.name);
                        const stores = Array.from(connection.objectStoreNames);
                        
                        for (const store of stores) {
                            if (store.includes('favorite') || store.includes('saved')) {
                                // Extract data from store
                                const tx = connection.transaction(store, 'readonly');
                                const objectStore = tx.objectStore(store);
                                data[store] = await objectStore.getAll();
                            }
                        }
                    }
                }
                
                return data;
            }
        """)
        
        # Extract from LocalStorage
        local_storage_data = await page.evaluate("""
            () => {
                const data = {};
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key.includes('favorite') || key.includes('saved')) {
                        data[key] = JSON.parse(localStorage.getItem(key));
                    }
                }
                return data;
            }
        """)
        
        return {
            'indexed_db': indexed_db_data,
            'local_storage': local_storage_data
        }
```

### Method 3: API Replay Attack
```typescript
class APIReplayExtractor {
  private recordedRequests: Request[] = [];

  async recordAuthenticatedSession(): Promise<void> {
    // Use Chrome DevTools Protocol to record
    const client = await this.page.target().createCDPSession();
    
    await client.send('Network.enable');
    
    client.on('Network.requestWillBeSent', (params) => {
      if (this.isRelevantRequest(params.request.url)) {
        this.recordedRequests.push({
          url: params.request.url,
          method: params.request.method,
          headers: params.request.headers,
          postData: params.request.postData
        });
      }
    });
  }

  async replayRequests(session: Session): Promise<any[]> {
    const results = [];
    
    for (const request of this.recordedRequests) {
      const response = await fetch(request.url, {
        method: request.method,
        headers: {
          ...request.headers,
          'Cookie': this.buildCookieString(session)
        },
        body: request.postData
      });
      
      results.push(await response.json());
    }
    
    return results;
  }
}
```

---

## Implementation Strategies

### Strategy 1: Hybrid Approach
```typescript
class HybridFavoritesExtractor {
  private strategies = [
    new GraphQLStrategy(),
    new RESTStrategy(),
    new DOMStrategy(),
    new NetworkInterceptStrategy()
  ];

  async extractFavorites(session: Session, limit = 50): Promise<Property[]> {
    // Try strategies in order of preference
    for (const strategy of this.strategies) {
      try {
        const result = await strategy.extract(session, limit);
        
        if (result && result.length > 0) {
          // Validate data completeness
          const validity = this.validateData(result);
          
          if (validity.score > 0.8) {
            return result;
          }
          
          // Try to enhance with another strategy
          const enhanced = await this.enhanceData(result, session);
          return enhanced;
        }
      } catch (error) {
        console.error(`Strategy ${strategy.name} failed:`, error);
        continue;
      }
    }
    
    throw new Error('All extraction strategies failed');
  }

  private validateData(properties: Property[]): ValidationResult {
    let score = 0;
    const requiredFields = ['zpid', 'address', 'price', 'savedDate'];
    
    for (const property of properties) {
      const fieldScore = requiredFields.reduce((acc, field) => {
        return acc + (property[field] ? 1 : 0);
      }, 0) / requiredFields.length;
      
      score += fieldScore;
    }
    
    return {
      score: score / properties.length,
      missingFields: this.findMissingFields(properties)
    };
  }
}
```

### Strategy 2: Incremental Extraction
```python
class IncrementalExtractor:
    """Extract favorites in batches to avoid detection"""
    
    def __init__(self, session, batch_size=10):
        self.session = session
        self.batch_size = batch_size
        self.extracted = []
        
    async def extract_all_favorites(self):
        """Extract all favorites incrementally"""
        
        page = 1
        has_more = True
        
        while has_more:
            # Add random delay between batches
            await self.random_delay(2, 5)
            
            # Extract batch
            batch = await self.extract_batch(page)
            
            if batch:
                self.extracted.extend(batch)
                page += 1
                
                # Check if we have more pages
                has_more = len(batch) == self.batch_size
                
                # Save progress in case of failure
                await self.save_checkpoint(page)
            else:
                has_more = False
        
        return self.extracted
    
    async def extract_batch(self, page):
        """Extract single batch with retry logic"""
        
        max_retries = 3
        
        for attempt in range(max_retries):
            try:
                response = await self.fetch_page(page)
                return self.parse_response(response)
            except Exception as e:
                if attempt == max_retries - 1:
                    raise
                await self.exponential_backoff(attempt)
    
    async def random_delay(self, min_seconds, max_seconds):
        """Human-like delay between requests"""
        import random
        delay = random.uniform(min_seconds, max_seconds)
        await asyncio.sleep(delay)
```

### Strategy 3: Change Detection
```typescript
class ChangeDetectionExtractor {
  private lastSnapshot: Map<string, Property> = new Map();

  async extractWithChangeDetection(session: Session): Promise<{
    all: Property[];
    new: Property[];
    updated: Property[];
    removed: string[];
  }> {
    // Get current favorites
    const current = await this.extractFavorites(session);
    
    // Compare with last snapshot
    const changes = this.detectChanges(current);
    
    // Update snapshot
    this.updateSnapshot(current);
    
    // Notify about changes
    if (changes.new.length > 0 || changes.updated.length > 0) {
      await this.notifyChanges(changes);
    }
    
    return changes;
  }

  private detectChanges(current: Property[]): Changes {
    const currentMap = new Map(current.map(p => [p.zpid, p]));
    
    const newProperties = [];
    const updatedProperties = [];
    const removedProperties = [];
    
    // Find new and updated
    for (const [zpid, property] of currentMap) {
      if (!this.lastSnapshot.has(zpid)) {
        newProperties.push(property);
      } else {
        const old = this.lastSnapshot.get(zpid);
        if (this.hasChanged(old, property)) {
          updatedProperties.push(property);
        }
      }
    }
    
    // Find removed
    for (const zpid of this.lastSnapshot.keys()) {
      if (!currentMap.has(zpid)) {
        removedProperties.push(zpid);
      }
    }
    
    return {
      all: current,
      new: newProperties,
      updated: updatedProperties,
      removed: removedProperties
    };
  }
}
```

---

## Security & Storage

### Credential Encryption
```typescript
class CredentialVault {
  private readonly algorithm = 'aes-256-gcm';
  private key: Buffer;

  constructor(masterPassword: string) {
    // Derive key from master password
    this.key = crypto.pbkdf2Sync(
      masterPassword,
      'zillow-salt-v1',
      100000,
      32,
      'sha256'
    );
  }

  async storeCredentials(email: string, password: string): Promise<void> {
    const encrypted = this.encrypt({
      email,
      password,
      timestamp: Date.now()
    });

    // Store in secure location
    await this.secureStorage.set('zillow_creds', encrypted);
    
    // Also store in OS keychain if available
    if (process.platform === 'darwin') {
      await this.storeInKeychain(email, password);
    }
  }

  private encrypt(data: any): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return JSON.stringify({
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      encrypted
    });
  }

  async retrieveCredentials(): Promise<{email: string, password: string}> {
    const encrypted = await this.secureStorage.get('zillow_creds');
    return this.decrypt(encrypted);
  }
}
```

### Database Schema for Favorites
```sql
-- Store user's Zillow credentials (encrypted)
CREATE TABLE zillow_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    email_encrypted TEXT NOT NULL,
    password_encrypted TEXT NOT NULL,
    session_data JSONB,
    last_sync TIMESTAMP,
    sync_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Store extracted favorites
CREATE TABLE zillow_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    zpid VARCHAR(20) UNIQUE NOT NULL,
    address TEXT NOT NULL,
    price DECIMAL(12, 2),
    bedrooms INTEGER,
    bathrooms DECIMAL(3, 1),
    sqft INTEGER,
    year_built INTEGER,
    property_type VARCHAR(50),
    listing_status VARCHAR(50),
    saved_date TIMESTAMP,
    notes TEXT,
    raw_data JSONB,
    images TEXT[],
    last_updated TIMESTAMP DEFAULT NOW(),
    sync_id UUID REFERENCES sync_history(id)
);

-- Track sync history
CREATE TABLE sync_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    sync_type VARCHAR(50), -- 'full', 'incremental', 'manual'
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    status VARCHAR(50), -- 'pending', 'success', 'partial', 'failed'
    properties_synced INTEGER,
    properties_new INTEGER,
    properties_updated INTEGER,
    properties_removed INTEGER,
    error_message TEXT,
    metadata JSONB
);

-- Indexes for performance
CREATE INDEX idx_zillow_favorites_user ON zillow_favorites(user_id);
CREATE INDEX idx_zillow_favorites_zpid ON zillow_favorites(zpid);
CREATE INDEX idx_zillow_favorites_saved ON zillow_favorites(saved_date DESC);
CREATE INDEX idx_sync_history_user ON sync_history(user_id, started_at DESC);
```

### Secure API Endpoints
```typescript
// API route protection
export async function POST(request: Request) {
  // Verify user authentication
  const session = await getServerSession();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Rate limiting
  const rateLimitOk = await checkRateLimit(session.user.id, 'zillow_sync', {
    requests: 10,
    window: '1h'
  });
  
  if (!rateLimitOk) {
    return new Response('Rate limit exceeded', { status: 429 });
  }

  // Validate request
  const { action } = await request.json();
  
  switch (action) {
    case 'store_credentials':
      return handleStoreCredentials(request, session.user.id);
    
    case 'sync_favorites':
      return handleSyncFavorites(session.user.id);
    
    case 'get_favorites':
      return handleGetFavorites(session.user.id);
    
    default:
      return new Response('Invalid action', { status: 400 });
  }
}
```

---

## Error Handling

### Comprehensive Error Recovery
```typescript
class ErrorRecovery {
  private readonly strategies = {
    RATE_LIMIT: this.handleRateLimit,
    SESSION_EXPIRED: this.handleSessionExpired,
    CAPTCHA_REQUIRED: this.handleCaptcha,
    ACCOUNT_LOCKED: this.handleAccountLocked,
    NETWORK_ERROR: this.handleNetworkError,
    PARSING_ERROR: this.handleParsingError
  };

  async handleError(error: ZillowError): Promise<RecoveryResult> {
    const errorType = this.classifyError(error);
    const strategy = this.strategies[errorType];
    
    if (!strategy) {
      throw new Error(`No recovery strategy for error type: ${errorType}`);
    }
    
    return await strategy.call(this, error);
  }

  private classifyError(error: any): ErrorType {
    if (error.status === 429) return 'RATE_LIMIT';
    if (error.status === 401) return 'SESSION_EXPIRED';
    if (error.message?.includes('captcha')) return 'CAPTCHA_REQUIRED';
    if (error.message?.includes('locked')) return 'ACCOUNT_LOCKED';
    if (error.code === 'ECONNREFUSED') return 'NETWORK_ERROR';
    return 'PARSING_ERROR';
  }

  private async handleRateLimit(error: ZillowError): Promise<RecoveryResult> {
    // Extract retry-after header
    const retryAfter = error.headers?.['retry-after'] || 3600;
    
    // Wait and retry
    await this.delay(retryAfter * 1000);
    
    return {
      shouldRetry: true,
      delay: 0,
      alternativeStrategy: 'USE_DIFFERENT_ENDPOINT'
    };
  }

  private async handleSessionExpired(error: ZillowError): Promise<RecoveryResult> {
    // Attempt to refresh session
    try {
      const newSession = await this.refreshSession();
      return {
        shouldRetry: true,
        newSession,
        delay: 0
      };
    } catch (e) {
      // Full re-authentication needed
      const credentials = await this.getStoredCredentials();
      const newSession = await this.authenticate(credentials);
      
      return {
        shouldRetry: true,
        newSession,
        delay: 0
      };
    }
  }
}
```

### Monitoring & Alerting
```python
class ZillowMonitor:
    def __init__(self):
        self.metrics = {
            'sync_success_rate': deque(maxlen=100),
            'sync_duration': deque(maxlen=100),
            'errors': deque(maxlen=100),
            'rate_limits': deque(maxlen=100)
        }
        
    async def monitor_sync(self, user_id: str):
        """Monitor sync operation"""
        
        start_time = time.time()
        
        try:
            result = await self.sync_favorites(user_id)
            
            # Record success
            self.metrics['sync_success_rate'].append(1)
            self.metrics['sync_duration'].append(time.time() - start_time)
            
            # Check for anomalies
            if result['properties_count'] == 0:
                await self.alert('No properties found', user_id)
            
            return result
            
        except Exception as e:
            # Record failure
            self.metrics['sync_success_rate'].append(0)
            self.metrics['errors'].append({
                'timestamp': datetime.now(),
                'error': str(e),
                'user_id': user_id
            })
            
            # Alert if critical
            if self.is_critical_error(e):
                await self.alert_critical(e, user_id)
            
            raise
    
    def get_health_status(self):
        """Calculate overall health"""
        
        if not self.metrics['sync_success_rate']:
            return 'UNKNOWN'
        
        success_rate = sum(self.metrics['sync_success_rate']) / len(self.metrics['sync_success_rate'])
        
        if success_rate > 0.9:
            return 'HEALTHY'
        elif success_rate > 0.7:
            return 'DEGRADED'
        else:
            return 'CRITICAL'
```

---

## Production Deployment

### Docker Container
```dockerfile
FROM node:18-alpine

# Install Playwright dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set Playwright path
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=true
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Security: Run as non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000

CMD ["node", "server.js"]
```

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: zillow-favorites-extractor
spec:
  replicas: 3
  selector:
    matchLabels:
      app: zillow-extractor
  template:
    metadata:
      labels:
        app: zillow-extractor
    spec:
      containers:
      - name: extractor
        image: zillow-extractor:latest
        env:
        - name: NODE_ENV
          value: "production"
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: url
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: zillow-extractor-service
spec:
  selector:
    app: zillow-extractor
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

### Monitoring Stack
```yaml
# Prometheus configuration
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'zillow-extractor'
    static_configs:
      - targets: ['zillow-extractor-service:3000']
    
# Grafana dashboard
{
  "dashboard": {
    "title": "Zillow Favorites Extraction",
    "panels": [
      {
        "title": "Sync Success Rate",
        "targets": [
          {
            "expr": "rate(zillow_sync_success_total[5m])"
          }
        ]
      },
      {
        "title": "Average Sync Duration",
        "targets": [
          {
            "expr": "avg(zillow_sync_duration_seconds)"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(zillow_sync_errors_total[5m])"
          }
        ]
      }
    ]
  }
}
```

---

## Usage Examples

### Basic Implementation
```typescript
// Initialize extractor
const extractor = new ZillowFavoritesExtractor({
  storage: new SecureStorage(),
  monitor: new HealthMonitor(),
  errorHandler: new ErrorRecovery()
});

// Store user credentials (one-time)
await extractor.storeCredentials(userId, {
  email: 'user@example.com',
  password: 'secure_password'
});

// Sync favorites
const result = await extractor.syncFavorites(userId, {
  limit: 50,
  includeOffMarket: true,
  includePending: true
});

console.log(`Synced ${result.properties.length} properties`);
console.log(`New: ${result.new.length}`);
console.log(`Updated: ${result.updated.length}`);
console.log(`Removed: ${result.removed.length}`);

// Get stored favorites
const favorites = await extractor.getFavorites(userId, {
  sortBy: 'savedDate',
  order: 'desc',
  limit: 20
});
```

### Advanced Implementation with Scheduling
```typescript
// Set up automatic sync
const scheduler = new ZillowSyncScheduler();

// Configure sync schedule
await scheduler.schedule(userId, {
  frequency: 'HOURLY', // HOURLY, DAILY, WEEKLY
  time: '09:00',       // For DAILY/WEEKLY
  dayOfWeek: 'MONDAY', // For WEEKLY
  
  onSuccess: async (result) => {
    // Send notification
    await notificationService.send(userId, {
      type: 'SYNC_SUCCESS',
      properties: result.new
    });
  },
  
  onError: async (error) => {
    // Alert user
    await alertService.alert(userId, {
      type: 'SYNC_FAILED',
      error: error.message
    });
  }
});

// Manual trigger
await scheduler.triggerSync(userId);

// Pause/resume
await scheduler.pause(userId);
await scheduler.resume(userId);
```

---

## Testing Strategy

### Unit Tests
```typescript
describe('ZillowFavoritesExtractor', () => {
  let extractor: ZillowFavoritesExtractor;
  
  beforeEach(() => {
    extractor = new ZillowFavoritesExtractor({
      storage: new MockStorage(),
      monitor: new MockMonitor()
    });
  });

  describe('Authentication', () => {
    it('should authenticate with valid credentials', async () => {
      const session = await extractor.authenticate('test@example.com', 'password');
      expect(session).toBeDefined();
      expect(session.accessToken).toBeTruthy();
    });

    it('should handle invalid credentials', async () => {
      await expect(
        extractor.authenticate('invalid@example.com', 'wrong')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should refresh expired session', async () => {
      const expiredSession = createExpiredSession();
      const newSession = await extractor.refreshSession(expiredSession);
      expect(newSession.expiry).toBeGreaterThan(Date.now());
    });
  });

  describe('Favorites Extraction', () => {
    it('should extract favorites via GraphQL', async () => {
      const session = await getValidSession();
      const favorites = await extractor.extractViaGraphQL(session, 10);
      
      expect(favorites).toHaveLength(10);
      expect(favorites[0]).toHaveProperty('zpid');
      expect(favorites[0]).toHaveProperty('address');
    });

    it('should fallback to DOM scraping on API failure', async () => {
      mockGraphQLFailure();
      
      const session = await getValidSession();
      const favorites = await extractor.extract(session);
      
      expect(favorites).toBeDefined();
      expect(extractionMethod).toBe('DOM');
    });

    it('should handle rate limiting', async () => {
      mockRateLimit();
      
      const session = await getValidSession();
      const startTime = Date.now();
      
      await extractor.extract(session);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeGreaterThan(3000); // Should wait on rate limit
    });
  });
});
```

### Integration Tests
```python
@pytest.mark.integration
class TestZillowIntegration:
    
    @pytest.fixture
    def authenticated_session(self):
        """Create authenticated session for tests"""
        return authenticate_test_account()
    
    def test_end_to_end_sync(self, authenticated_session):
        """Test complete sync flow"""
        
        # Initialize extractor
        extractor = ZillowFavoritesExtractor()
        
        # Perform sync
        result = extractor.sync_favorites(
            authenticated_session,
            limit=5
        )
        
        # Verify results
        assert result['success'] == True
        assert len(result['properties']) == 5
        assert all('zpid' in p for p in result['properties'])
        
    def test_incremental_sync(self, authenticated_session):
        """Test incremental updates"""
        
        extractor = ZillowFavoritesExtractor()
        
        # Initial sync
        initial = extractor.sync_favorites(authenticated_session)
        
        # Wait and sync again
        time.sleep(5)
        incremental = extractor.sync_favorites(authenticated_session)
        
        # Should detect no changes
        assert incremental['new'] == []
        assert incremental['updated'] == []
```

---

## Troubleshooting Guide

### Common Issues & Solutions

#### 1. Authentication Failures
```typescript
// Issue: "Invalid credentials" even with correct password
// Solution: Check for 2FA, CAPTCHA, or account flags

if (error.message.includes('Invalid credentials')) {
  // Check if 2FA is enabled
  const needs2FA = await check2FAStatus(email);
  
  if (needs2FA) {
    // Handle 2FA flow
    const code = await prompt2FACode();
    session = await authenticateWith2FA(email, password, code);
  }
}
```

#### 2. Session Expiration
```typescript
// Issue: Session expires during extraction
// Solution: Implement session refresh

const withSessionRefresh = async (fn: Function) => {
  try {
    return await fn();
  } catch (error) {
    if (error.status === 401) {
      const newSession = await refreshSession();
      return await fn(newSession);
    }
    throw error;
  }
};
```

#### 3. Rate Limiting
```python
# Issue: 429 Too Many Requests
# Solution: Implement adaptive rate limiting

class AdaptiveRateLimiter:
    def __init__(self):
        self.delay = 1  # Start with 1 second
        
    async def execute_with_backoff(self, func):
        while True:
            try:
                result = await func()
                self.delay = max(1, self.delay * 0.9)  # Decrease delay on success
                return result
            except RateLimitError as e:
                self.delay = min(60, self.delay * 2)  # Increase delay on failure
                await asyncio.sleep(self.delay)
```

#### 4. Data Inconsistency
```typescript
// Issue: Missing or incomplete property data
// Solution: Multi-source validation

const validateAndEnhance = async (properties: Property[]) => {
  for (const property of properties) {
    // Check completeness
    const missingFields = getMissingFields(property);
    
    if (missingFields.length > 0) {
      // Try to fill from alternative source
      const enhanced = await enhanceFromAlternativeSource(property.zpid);
      Object.assign(property, enhanced);
    }
  }
  
  return properties;
};
```

---

## Performance Optimization

### Caching Strategy
```typescript
class FavoritesCache {
  private cache = new Map<string, CachedData>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  async get(userId: string): Promise<Property[] | null> {
    const cached = this.cache.get(userId);
    
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(userId);
      return null;
    }
    
    return cached.data;
  }

  set(userId: string, data: Property[]): void {
    this.cache.set(userId, {
      data,
      timestamp: Date.now()
    });
  }
}
```

### Parallel Processing
```python
async def extract_favorites_parallel(session, zpids):
    """Extract multiple properties in parallel"""
    
    # Split into chunks
    chunks = [zpids[i:i+10] for i in range(0, len(zpids), 10)]
    
    # Process chunks in parallel
    tasks = [
        extract_chunk(session, chunk)
        for chunk in chunks
    ]
    
    results = await asyncio.gather(*tasks)
    
    # Flatten results
    return [item for sublist in results for item in sublist]
```

---

## Conclusion

This comprehensive guide provides everything needed to implement authenticated Zillow favorites extraction:

1. **Multiple authentication methods** (API, Browser, Mobile)
2. **Robust session management** with refresh and monitoring
3. **Various extraction strategies** (GraphQL, REST, DOM, Network)
4. **Production-ready architecture** with error handling and monitoring
5. **Security best practices** for credential storage
6. **Scalable deployment** options

The system is designed to be resilient, maintainable, and adaptable to Zillow's evolving platform while maintaining user privacy and security.

---

*Last Updated: January 2025*
*Version: 1.0*
*Security Level: Confidential*