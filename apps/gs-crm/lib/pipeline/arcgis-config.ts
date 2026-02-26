/**
 * ArcGIS Endpoint Configuration
 *
 * Phase 0.5a: Extract hardcoded URLs to config.
 * These are public Maricopa County ArcGIS REST endpoints (no auth required).
 */

export const ARCGIS_ENDPOINTS = {
  /** Parcel query — lookup APN by address components */
  parcels: process.env.ARCGIS_PARCELS_URL
    || 'https://gis.mcassessor.maricopa.gov/arcgis/rest/services/Parcels/MapServer/0/query',

  /** Geocoder — convert address to coordinates */
  geocoder: process.env.ARCGIS_GEOCODER_URL
    || 'https://gis.mcassessor.maricopa.gov/arcgis/rest/services/AssessorCompositeLocator/GeocodeServer/findAddressCandidates',

  /** Identify — find parcel at coordinates */
  identify: process.env.ARCGIS_IDENTIFY_URL
    || 'https://gis.mcassessor.maricopa.gov/arcgis/rest/services/Parcels/MapServer/identify',
} as const

export type ArcGISEndpointName = keyof typeof ARCGIS_ENDPOINTS

/** Timeout for individual ArcGIS requests (ms) */
export const ARCGIS_REQUEST_TIMEOUT_MS = 20_000

/** Rate limit for ArcGIS requests per second */
export const ARCGIS_REQUESTS_PER_SECOND = 5

/**
 * ArcGIS health-check probe result
 */
export interface ArcGISHealthResult {
  endpoint: ArcGISEndpointName
  healthy: boolean
  responseTimeMs: number
  error?: string
}

/**
 * Probe a single ArcGIS endpoint to check if it's responding.
 * Uses a lightweight request (empty query for parcels, simple geocode for geocoder).
 */
export async function probeEndpoint(
  endpoint: ArcGISEndpointName,
  timeoutMs: number = 10_000
): Promise<ArcGISHealthResult> {
  const url = ARCGIS_ENDPOINTS[endpoint]
  const start = Date.now()

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    // Lightweight probe — just check the endpoint responds with valid JSON
    const probeUrl = endpoint === 'parcels'
      ? `${url}?f=json&where=1=0&returnGeometry=false&outFields=APN`
      : endpoint === 'geocoder'
      ? `${url}?f=json&SingleLine=test&maxLocations=1`
      : `${url}?f=json&geometry=0,0&geometryType=esriGeometryPoint&tolerance=1&mapExtent=0,0,1,1&imageDisplay=1,1,96&layers=all:0&returnGeometry=false`

    const response = await fetch(probeUrl, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
    clearTimeout(timeout)

    const data = await response.json()
    const healthy = response.ok && !data.error

    return {
      endpoint,
      healthy,
      responseTimeMs: Date.now() - start,
      error: data.error ? JSON.stringify(data.error) : undefined,
    }
  } catch (error) {
    return {
      endpoint,
      healthy: false,
      responseTimeMs: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Probe all 3 ArcGIS endpoints in parallel.
 * Returns overall health status + individual results.
 */
export async function probeAllEndpoints(
  timeoutMs: number = 10_000
): Promise<{ healthy: boolean; results: ArcGISHealthResult[] }> {
  const results = await Promise.all([
    probeEndpoint('parcels', timeoutMs),
    probeEndpoint('geocoder', timeoutMs),
    probeEndpoint('identify', timeoutMs),
  ])

  // Parcels endpoint is critical — if it's down, we can't do any lookups
  const healthy = results[0].healthy

  return { healthy, results }
}
