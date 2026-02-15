/**
 * Geometry utility functions for spatial operations
 */

/**
 * Calculate the area of a polygon in square meters
 */
export function calculatePolygonArea(coordinates: number[][]): number {
  if (coordinates.length < 3) return 0
  
  let area = 0
  const numPoints = coordinates.length
  
  for (let i = 0; i < numPoints - 1; i++) {
    const [x1, y1] = coordinates[i]
    const [x2, y2] = coordinates[i + 1]
    area += x1 * y2 - x2 * y1
  }
  
  // Earth's radius in meters
  const earthRadius = 6371000
  
  // Convert to square meters (approximate)
  return Math.abs(area / 2) * Math.pow(earthRadius * Math.PI / 180, 2)
}

/**
 * Calculate the area of a rectangle given bounds
 */
export function calculateRectangleArea(bounds: {
  north: number
  south: number
  east: number
  west: number
}): number {
  const { north, south, east, west } = bounds
  
  // Calculate dimensions in degrees
  const heightDeg = north - south
  const widthDeg = east - west
  
  // Convert to meters (approximate at middle latitude)
  const midLat = (north + south) / 2
  const metersPerDegreeLat = 111320
  const metersPerDegreeLng = 111320 * Math.cos(midLat * Math.PI / 180)
  
  const heightMeters = heightDeg * metersPerDegreeLat
  const widthMeters = widthDeg * metersPerDegreeLng
  
  return Math.abs(heightMeters * widthMeters)
}

/**
 * Convert area from square meters to other units
 */
export function convertArea(squareMeters: number, unit: 'sqft' | 'acres' | 'sqmi' | 'hectares'): number {
  switch (unit) {
    case 'sqft':
      return squareMeters * 10.764
    case 'acres':
      return squareMeters / 4047
    case 'sqmi':
      return squareMeters / 2589988
    case 'hectares':
      return squareMeters / 10000
    default:
      return squareMeters
  }
}

/**
 * Format area for display
 */
export function formatArea(squareMeters: number): string {
  const sqft = convertArea(squareMeters, 'sqft')
  const acres = convertArea(squareMeters, 'acres')
  
  if (acres > 1) {
    return `${acres.toFixed(2)} acres`
  } else {
    return `${sqft.toLocaleString()} sq ft`
  }
}

/**
 * Check if a point is inside a polygon
 */
export function isPointInPolygon(point: [number, number], polygon: number[][]): boolean {
  const [x, y] = point
  let inside = false
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]
    const [xj, yj] = polygon[j]
    
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
    
    if (intersect) inside = !inside
  }
  
  return inside
}

/**
 * Check if a point is inside a rectangle
 */
export function isPointInRectangle(
  point: [number, number],
  bounds: { north: number; south: number; east: number; west: number }
): boolean {
  const [lng, lat] = point
  return lat <= bounds.north && lat >= bounds.south && lng <= bounds.east && lng >= bounds.west
}

/**
 * Check if a point is inside a circle
 */
export function isPointInCircle(
  point: [number, number],
  center: [number, number],
  radiusMeters: number
): boolean {
  const distance = calculateDistance(point, center)
  return distance <= radiusMeters
}

/**
 * Calculate distance between two points in meters (Haversine formula)
 */
export function calculateDistance(point1: [number, number], point2: [number, number]): number {
  const [lng1, lat1] = point1
  const [lng2, lat2] = point2
  
  const R = 6371000 // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lng2 - lng1) * Math.PI / 180
  
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  
  return R * c
}

/**
 * Get the center point of a polygon
 */
export function getPolygonCenter(coordinates: number[][]): [number, number] {
  let sumLng = 0
  let sumLat = 0
  let count = 0
  
  for (const [lng, lat] of coordinates) {
    sumLng += lng
    sumLat += lat
    count++
  }
  
  return [sumLng / count, sumLat / count]
}

/**
 * Get the center point of a rectangle
 */
export function getRectangleCenter(bounds: {
  north: number
  south: number
  east: number
  west: number
}): [number, number] {
  return [
    (bounds.east + bounds.west) / 2,
    (bounds.north + bounds.south) / 2,
  ]
}

/**
 * Simplify a polygon by removing redundant points (Douglas-Peucker algorithm)
 */
export function simplifyPolygon(coordinates: number[][], tolerance: number = 0.0001): number[][] {
  if (coordinates.length <= 2) return coordinates
  
  // Find the point with maximum distance from the line between first and last
  let maxDistance = 0
  let maxIndex = 0
  
  const first = coordinates[0]
  const last = coordinates[coordinates.length - 1]
  
  for (let i = 1; i < coordinates.length - 1; i++) {
    const distance = perpendicularDistance(coordinates[i], first, last)
    if (distance > maxDistance) {
      maxDistance = distance
      maxIndex = i
    }
  }
  
  // If max distance is greater than tolerance, recursively simplify
  if (maxDistance > tolerance) {
    const left = simplifyPolygon(coordinates.slice(0, maxIndex + 1), tolerance)
    const right = simplifyPolygon(coordinates.slice(maxIndex), tolerance)
    
    return [...left.slice(0, -1), ...right]
  } else {
    return [first, last]
  }
}

/**
 * Calculate perpendicular distance from a point to a line
 */
function perpendicularDistance(
  point: number[],
  lineStart: number[],
  lineEnd: number[]
): number {
  const [x, y] = point
  const [x1, y1] = lineStart
  const [x2, y2] = lineEnd
  
  const A = x - x1
  const B = y - y1
  const C = x2 - x1
  const D = y2 - y1
  
  const dot = A * C + B * D
  const lenSq = C * C + D * D
  let param = -1
  
  if (lenSq !== 0) {
    param = dot / lenSq
  }
  
  let xx, yy
  
  if (param < 0) {
    xx = x1
    yy = y1
  } else if (param > 1) {
    xx = x2
    yy = y2
  } else {
    xx = x1 + param * C
    yy = y1 + param * D
  }
  
  const dx = x - xx
  const dy = y - yy
  
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Validate GeoJSON coordinates
 */
export function validateGeoJSON(geojson: any): boolean {
  if (!geojson || typeof geojson !== 'object') return false
  if (!geojson.type || !geojson.coordinates) return false
  
  if (geojson.type === 'Polygon') {
    if (!Array.isArray(geojson.coordinates) || geojson.coordinates.length === 0) return false
    
    for (const ring of geojson.coordinates) {
      if (!Array.isArray(ring) || ring.length < 4) return false
      
      // Check if polygon is closed
      const first = ring[0]
      const last = ring[ring.length - 1]
      if (first[0] !== last[0] || first[1] !== last[1]) return false
      
      // Check coordinate format
      for (const coord of ring) {
        if (!Array.isArray(coord) || coord.length !== 2) return false
        if (typeof coord[0] !== 'number' || typeof coord[1] !== 'number') return false
      }
    }
    
    return true
  }
  
  return false
}

/**
 * Generate a random color for area display
 */
export function generateAreaColor(): string {
  const colors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#14B8A6', // Teal
    '#F97316', // Orange
  ]
  
  return colors[Math.floor(Math.random() * colors.length)]
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S'
  const lngDir = lng >= 0 ? 'E' : 'W'
  
  return `${Math.abs(lat).toFixed(6)}°${latDir}, ${Math.abs(lng).toFixed(6)}°${lngDir}`
}