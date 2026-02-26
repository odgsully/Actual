/**
 * Maricopa County ArcGIS APN Lookup Service
 *
 * Implements the same lookup logic as apn_lookup.py using public ArcGIS REST endpoints.
 * NO API KEY REQUIRED - uses public Maricopa County services.
 *
 * Endpoints:
 * - Parcels: https://gis.mcassessor.maricopa.gov/arcgis/rest/services/Parcels/MapServer/0/query
 * - Geocoder: https://gis.mcassessor.maricopa.gov/arcgis/rest/services/AssessorCompositeLocator/GeocodeServer/findAddressCandidates
 * - Identify: https://gis.mcassessor.maricopa.gov/arcgis/rest/services/Parcels/MapServer/identify
 */

const LOG_PREFIX = '[ArcGIS MCAO Lookup]'

// Public ArcGIS endpoints (NO AUTH REQUIRED)
const PARCEL_QUERY_URL = 'https://gis.mcassessor.maricopa.gov/arcgis/rest/services/Parcels/MapServer/0/query'
const GEOCODER_URL = 'https://gis.mcassessor.maricopa.gov/arcgis/rest/services/AssessorCompositeLocator/GeocodeServer/findAddressCandidates'
const IDENTIFY_URL = 'https://gis.mcassessor.maricopa.gov/arcgis/rest/services/Parcels/MapServer/identify'

const TIMEOUT_MS = 20000 // 20 seconds
const REQUESTS_PER_SECOND = 5

interface AddressComponents {
  number?: string
  predir?: string
  name?: string
  stype?: string
  city?: string
  raw: string
}

interface ParcelFeature {
  attributes: {
    APN?: string
    APN_DASH?: string
    PHYSICAL_ADDRESS?: string
    PHYSICAL_STREET_NUM?: string
    PHYSICAL_STREET_NAME?: string
    PHYSICAL_STREET_TYPE?: string
    PHYSICAL_CITY?: string
  }
}

interface GeocodeCandidate {
  score: number
  location: {
    x: number
    y: number
  }
  attributes?: any
}

export interface APNLookupResult {
  apn: string | null
  method: 'exact_where' | 'loose_where' | 'geocode_identify' | 'not_found' | 'cached' | 'skipped'
  confidence: number
  notes: string
}

/**
 * Main lookup function - tries multiple methods in order
 */
export async function lookupAPNFromAddress(address: string): Promise<APNLookupResult> {
  console.log(`${LOG_PREFIX} Starting APN lookup`)

  // Pre-filter obviously invalid addresses
  if (shouldSkipAddress(address)) {
    return {
      apn: null,
      method: 'skipped',
      confidence: 0,
      notes: 'PRE_FILTERED (PO Box, no number, or too short)'
    }
  }

  const startTime = Date.now()

  try {
    // Normalize address into components
    const components = normalizeAddress(address)
    console.log(`${LOG_PREFIX} Address parsed (city: ${components.city || 'unknown'})`)

    // Method 1: Exact WHERE query (street number + name + type + city)
    let result = await tryExactWhereQuery(components)
    if (result.apn) {
      const elapsed = Date.now() - startTime
      return { ...result, notes: `${result.notes} | ${elapsed}ms` }
    }

    // Method 2: Loose WHERE query (without street type)
    result = await tryLooseWhereQuery(components)
    if (result.apn) {
      const elapsed = Date.now() - startTime
      return { ...result, notes: `${result.notes} | ${elapsed}ms` }
    }

    // Method 3: Geocode + Identify
    result = await tryGeocodeIdentify(address)
    if (result.apn) {
      const elapsed = Date.now() - startTime
      return { ...result, notes: `${result.notes} | ${elapsed}ms` }
    }

    // No APN found
    const elapsed = Date.now() - startTime
    return {
      apn: null,
      method: 'not_found',
      confidence: 0,
      notes: `All methods failed | ${elapsed}ms`
    }

  } catch (error) {
    const elapsed = Date.now() - startTime
    console.error(`${LOG_PREFIX} Lookup error:`, error instanceof Error ? error.message : 'Unknown')
    return {
      apn: null,
      method: 'not_found',
      confidence: 0,
      notes: `Error: ${error instanceof Error ? error.message : 'Unknown'} | ${elapsed}ms`
    }
  }
}

/**
 * Method 1: Exact WHERE query with street type
 */
async function tryExactWhereQuery(components: AddressComponents): Promise<APNLookupResult> {
  const where = buildWhereClause(components, false)
  if (!where) {
    return { apn: null, method: 'not_found', confidence: 0, notes: 'Missing required components' }
  }

  console.log(`${LOG_PREFIX} Trying exact WHERE query`)

  const features = await queryParcels(where)

  if (features.length > 0) {
    const { apn, picked } = chooseFeature(features, components.raw)
    if (apn) {
      const notes = features.length > 1
        ? `MULTI_APN_CANDIDATES=${features.length} pick=${picked}`
        : picked
      return { apn, method: 'exact_where', confidence: 1.0, notes }
    }
  }

  return { apn: null, method: 'not_found', confidence: 0, notes: 'No features found' }
}

/**
 * Method 2: Loose WHERE query without street type
 */
async function tryLooseWhereQuery(components: AddressComponents): Promise<APNLookupResult> {
  const where = buildWhereClause(components, true)
  if (!where) {
    return { apn: null, method: 'not_found', confidence: 0, notes: 'Missing required components' }
  }

  console.log(`${LOG_PREFIX} Trying loose WHERE query`)

  const features = await queryParcels(where)

  if (features.length > 0) {
    const { apn, picked } = chooseFeature(features, components.raw)
    if (apn) {
      const notes = features.length > 1
        ? `MULTI_APN_CANDIDATES=${features.length} pick=${picked}`
        : picked
      return { apn, method: 'loose_where', confidence: 0.85, notes }
    }
  }

  return { apn: null, method: 'not_found', confidence: 0, notes: 'No features found' }
}

/**
 * Method 3: Geocode address to coords, then identify parcel
 */
async function tryGeocodeIdentify(address: string): Promise<APNLookupResult> {
  console.log(`${LOG_PREFIX} Trying geocode + identify`)

  const coords = await geocodeAddress(address)
  if (!coords) {
    return { apn: null, method: 'not_found', confidence: 0, notes: 'Geocode failed' }
  }

  const attributes = await identifyParcel(coords.x, coords.y)
  if (!attributes) {
    return { apn: null, method: 'not_found', confidence: 0, notes: 'Identify failed' }
  }

  const apn = attributes.APN_DASH || attributes.APN
  if (apn) {
    return {
      apn: String(apn),
      method: 'geocode_identify',
      confidence: 0.75,
      notes: `Geocoded to ${coords.x.toFixed(6)}, ${coords.y.toFixed(6)}`
    }
  }

  return { apn: null, method: 'not_found', confidence: 0, notes: 'No APN in identify result' }
}

/**
 * Query parcels by WHERE clause
 */
async function queryParcels(where: string): Promise<ParcelFeature[]> {
  const params = new URLSearchParams({
    f: 'json',
    where,
    outFields: 'APN,APN_DASH,PHYSICAL_ADDRESS,PHYSICAL_STREET_NUM,PHYSICAL_STREET_NAME,PHYSICAL_STREET_TYPE,PHYSICAL_CITY',
    returnGeometry: 'false'
  })

  const url = `${PARCEL_QUERY_URL}?${params}`
  console.log(`${LOG_PREFIX} Querying parcels`)

  const response = await fetchWithTimeout(url, TIMEOUT_MS)
  const data = await response.json()

  console.log(`${LOG_PREFIX} Response status: ${response.status}, features found: ${data.features?.length || 0}`)

  if (data.error) {
    console.error(`${LOG_PREFIX} ArcGIS error:`, data.error)
    throw new Error(`ArcGIS error: ${JSON.stringify(data.error)}`)
  }

  return data.features || []
}

/**
 * Geocode address to X,Y coordinates
 */
async function geocodeAddress(address: string): Promise<{ x: number, y: number } | null> {
  const params = new URLSearchParams({
    f: 'json',
    SingleLine: address,
    outFields: 'Match_addr,Addr_type,Score',
    maxLocations: '5'
  })

  const url = `${GEOCODER_URL}?${params}`
  console.log(`${LOG_PREFIX} Geocoding address`)

  const response = await fetchWithTimeout(url, TIMEOUT_MS)
  const data = await response.json()

  const candidates: GeocodeCandidate[] = data.candidates || []
  console.log(`${LOG_PREFIX} Geocode candidates found: ${candidates.length}`)

  if (candidates.length === 0) {
    return null
  }

  // Choose highest score
  const best = candidates.reduce((prev, curr) =>
    (curr.score > prev.score) ? curr : prev
  )

  const { x, y } = best.location
  if (x === undefined || y === undefined) {
    return null
  }

  return { x, y }
}

/**
 * Identify parcel at given X,Y coordinates
 */
async function identifyParcel(x: number, y: number): Promise<ParcelFeature['attributes'] | null> {
  const tolerance = 1
  const buffer = 0.0001

  const params = new URLSearchParams({
    f: 'json',
    geometry: `${x},${y}`,
    geometryType: 'esriGeometryPoint',
    tolerance: String(tolerance),
    mapExtent: `${x - buffer},${y - buffer},${x + buffer},${y + buffer}`,
    imageDisplay: '400,400,96',
    sr: '4326',
    layers: 'all:0',
    returnGeometry: 'false'
  })

  const url = `${IDENTIFY_URL}?${params}`

  const response = await fetchWithTimeout(url, TIMEOUT_MS)
  const data = await response.json()

  const results = data.results || []
  if (results.length === 0) {
    return null
  }

  return results[0].attributes
}

/**
 * Build SQL WHERE clause for parcel query
 */
function buildWhereClause(components: AddressComponents, loose: boolean): string | null {
  const { number, name, city, stype, predir } = components

  // Require all essential components like Python implementation
  if (!number || !name || !city) {
    return null
  }

  // Escape single quotes for SQL
  const esc = (s: string) => s.replace(/'/g, "''")

  // Include predir in the name if present (e.g., "N WILKINSON" instead of just "WILKINSON")
  const fullStreetName = predir ? `${predir} ${name}` : name

  // Build WHERE clause matching Python implementation - always include city
  let where = `PHYSICAL_STREET_NUM='${esc(number)}' AND PHYSICAL_STREET_NAME='${esc(fullStreetName)}' AND PHYSICAL_CITY='${esc(city)}'`

  // Add street type for exact match (not for loose match)
  if (!loose && stype) {
    where += ` AND PHYSICAL_STREET_TYPE='${esc(stype)}'`
  }

  return where
}

/**
 * Choose best APN from multiple features
 */
function chooseFeature(features: ParcelFeature[], rawAddress: string): { apn: string | null, picked: string } {
  if (features.length === 0) {
    return { apn: null, picked: 'NO_FEATURES' }
  }

  const norm = (s: string) => s.replace(/\s+/g, ' ').toUpperCase().trim()
  const normAddr = norm(rawAddress)

  // Prefer exact PHYSICAL_ADDRESS match
  for (const feature of features) {
    const physicalAddr = feature.attributes.PHYSICAL_ADDRESS || ''
    if (norm(physicalAddr) === normAddr) {
      const apn = feature.attributes.APN_DASH || feature.attributes.APN
      if (apn) {
        return { apn: String(apn), picked: 'EXACT_ADDRESS' }
      }
    }
  }

  // Otherwise take first feature
  const apn = features[0].attributes.APN_DASH || features[0].attributes.APN
  return { apn: apn ? String(apn) : null, picked: 'FIRST_FEATURE' }
}

/**
 * Normalize address into components
 */
function normalizeAddress(address: string): AddressComponents {
  const raw = address.trim()

  // Remove unit numbers (APT, UNIT, SUITE, #)
  let cleaned = raw.replace(/\s+(?:APT|UNIT|SUITE|STE|#)\s*\S+\b/gi, '')
  cleaned = cleaned.replace(/\s+/g, ' ').trim().toUpperCase()

  // Normalize street type
  const typeMap: Record<string, string> = {
    'STREET': 'ST', 'ST': 'ST', 'AVENUE': 'AVE', 'AVE': 'AVE',
    'ROAD': 'RD', 'RD': 'RD', 'DRIVE': 'DR', 'DR': 'DR',
    'BOULEVARD': 'BLVD', 'BLVD': 'BLVD', 'LANE': 'LN', 'LN': 'LN',
    'COURT': 'CT', 'CT': 'CT', 'PLACE': 'PL', 'PL': 'PL', 'WAY': 'WAY',
    'CIRCLE': 'CIR', 'CIR': 'CIR', 'PLAZA': 'PLZ', 'PLZ': 'PLZ',
    'TERRACE': 'TER', 'TER': 'TER', 'PARKWAY': 'PKWY', 'PKWY': 'PKWY'
  }

  // Common street types to help identify the pattern
  const streetTypes = ['ST', 'STREET', 'AVE', 'AVENUE', 'RD', 'ROAD', 'DR', 'DRIVE',
    'BLVD', 'BOULEVARD', 'LN', 'LANE', 'CT', 'COURT', 'PL', 'PLACE', 'WAY',
    'CIR', 'CIRCLE', 'PLZ', 'PLAZA', 'TER', 'TERRACE', 'PKWY', 'PARKWAY', 'TRAIL', 'PATH']

  // Try to parse addresses with optional city at the end
  // Pattern: NUMBER [PREDIR] NAME(S) STYPE [CITY]
  const regexWithOptionalCity = /^\s*(\d+)\s+(?:([NSEW]|NE|NW|SE|SW)\s+)?(.+?)\s+(ST|STREET|AVE|AVENUE|RD|ROAD|DR|DRIVE|BLVD|BOULEVARD|LN|LANE|CT|COURT|PL|PLACE|WAY|CIR|CIRCLE|PLZ|PLAZA|TER|TERRACE|PKWY|PARKWAY|TRAIL|PATH)\b\s*(.*)$/i
  const match = regexWithOptionalCity.exec(cleaned)

  if (match) {
    const [, number, predir, name, stype, tail] = match

    // Extract city from tail if present (remove state/zip)
    const cityParts = tail
      .replace(/,/g, ' ')
      .split(/\s+/)
      .filter(p => p && !/^\d{5}(-\d{4})?$/.test(p) && !['AZ', 'ARIZONA'].includes(p))

    // Don't default to any city - require explicit city like Python implementation
    const city = cityParts[0] || undefined

    return {
      number,
      predir: predir || undefined,
      name: name.trim(),
      stype: typeMap[stype.toUpperCase().replace(/\./g, '')] || stype.toUpperCase().replace(/\./g, ''),
      city,
      raw
    }
  }

  // Special case for numbered streets (e.g., "5660 N 68TH PL")
  const numberedStreetRegex = /^\s*(\d+)\s+(?:([NSEW]|NE|NW|SE|SW)\s+)?(\d+(?:ST|ND|RD|TH))\s+(ST|STREET|AVE|AVENUE|RD|ROAD|DR|DRIVE|BLVD|BOULEVARD|LN|LANE|CT|COURT|PL|PLACE|WAY|CIR|CIRCLE)\b\s*(.*)$/i
  const numberedMatch = numberedStreetRegex.exec(cleaned)

  if (numberedMatch) {
    const [, number, predir, name, stype, tail] = numberedMatch

    // Extract city from tail if present
    const cityParts = tail
      .replace(/,/g, ' ')
      .split(/\s+/)
      .filter(p => p && !/^\d{5}(-\d{4})?$/.test(p) && !['AZ', 'ARIZONA'].includes(p))

    const city = cityParts[0] || undefined

    return {
      number,
      predir: predir || undefined,
      name: name.trim(),
      stype: typeMap[stype.toUpperCase().replace(/\./g, '')] || stype.toUpperCase().replace(/\./g, ''),
      city,
      raw
    }
  }

  // Fallback: can't parse, return raw
  return { raw }
}

/**
 * Check if address should be skipped
 */
function shouldSkipAddress(address: string): boolean {
  const addr = address.toUpperCase().trim()

  // Skip PO Boxes
  if (/\bP\.?O\.?\s*BOX\b/.test(addr)) {
    return true
  }

  // Skip addresses without numbers
  if (!/^\d+/.test(addr)) {
    return true
  }

  // Skip too short
  if (addr.length < 10) {
    return true
  }

  return false
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'apn-lookup-ts/1.0 (+https://mcassessor.maricopa.gov)',
        'Accept': 'application/json'
      }
    })
    clearTimeout(timeout)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response
  } catch (error) {
    clearTimeout(timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`)
    }
    throw error
  }
}

/**
 * Rate limiting helper
 */
export async function sleepForRate(requestsPerSecond: number = REQUESTS_PER_SECOND): Promise<void> {
  if (requestsPerSecond <= 0) return
  const baseMs = 1000 / requestsPerSecond
  const jitter = Math.random() * 150 // 0-150ms jitter
  await new Promise(resolve => setTimeout(resolve, baseMs + jitter))
}
