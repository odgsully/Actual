import { Loader } from '@googlemaps/js-api-loader'

let loaderInstance: Loader | null = null
let loadPromise: Promise<typeof google> | null = null

/**
 * Get or create the Google Maps loader instance
 */
function getLoader(): Loader {
  if (!loaderInstance) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    
    if (!apiKey) {
      throw new Error(
        'Google Maps API key is not configured. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file'
      )
    }

    loaderInstance = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places', 'drawing', 'geometry', 'marker'],
      // Optional: Add map IDs for cloud-based map styling
      // mapIds: ['your_map_id_here']
    })
  }
  
  return loaderInstance
}

/**
 * Load Google Maps API and return the google object
 * This function ensures the API is only loaded once
 */
export async function loadGoogleMaps(): Promise<typeof google> {
  // Check for API key before attempting to load
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
    throw new Error(
      'Google Maps API key is not configured. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file'
    )
  }
  
  if (!loadPromise) {
    const loader = getLoader()
    loadPromise = loader.load()
  }
  
  return loadPromise
}

/**
 * Check if Google Maps is already loaded
 */
export function isGoogleMapsLoaded(): boolean {
  return typeof window !== 'undefined' && typeof window.google !== 'undefined' && !!window.google.maps
}

/**
 * Get the Google Maps object if it's already loaded
 */
export function getGoogleMaps(): typeof google | null {
  if (isGoogleMapsLoaded()) {
    return window.google
  }
  return null
}

/**
 * Load Google Maps and create a map instance
 */
export async function createMap(
  container: HTMLElement,
  options?: google.maps.MapOptions
): Promise<google.maps.Map> {
  const google = await loadGoogleMaps()
  
  const defaultOptions: google.maps.MapOptions = {
    center: { lat: 33.4484, lng: -112.0740 }, // Phoenix, AZ
    zoom: 11,
    mapTypeControl: true,
    mapTypeControlOptions: {
      style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
      position: google.maps.ControlPosition.TOP_RIGHT,
    },
    streetViewControl: true,
    fullscreenControl: true,
    zoomControl: true,
    zoomControlOptions: {
      position: google.maps.ControlPosition.RIGHT_CENTER,
    },
    // Modern map styling
    styles: [
      {
        featureType: 'poi.business',
        stylers: [{ visibility: 'off' }],
      },
      {
        featureType: 'transit',
        elementType: 'labels.icon',
        stylers: [{ visibility: 'off' }],
      },
    ],
  }
  
  const map = new google.maps.Map(container, {
    ...defaultOptions,
    ...options,
  })
  
  return map
}

/**
 * Create a Drawing Manager for the map
 */
export async function createDrawingManager(
  map: google.maps.Map,
  options?: google.maps.drawing.DrawingManagerOptions
): Promise<google.maps.drawing.DrawingManager> {
  const google = await loadGoogleMaps()
  
  const defaultOptions: google.maps.drawing.DrawingManagerOptions = {
    drawingMode: null,
    drawingControl: true,
    drawingControlOptions: {
      position: google.maps.ControlPosition.TOP_CENTER,
      drawingModes: [
        google.maps.drawing.OverlayType.RECTANGLE,
        google.maps.drawing.OverlayType.POLYGON,
        google.maps.drawing.OverlayType.CIRCLE,
      ],
    },
    rectangleOptions: {
      fillColor: '#3B82F6',
      fillOpacity: 0.3,
      strokeColor: '#3B82F6',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      clickable: true,
      editable: true,
      draggable: true,
      zIndex: 1,
    },
    polygonOptions: {
      fillColor: '#3B82F6',
      fillOpacity: 0.3,
      strokeColor: '#3B82F6',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      clickable: true,
      editable: true,
      draggable: true,
      zIndex: 1,
    },
    circleOptions: {
      fillColor: '#3B82F6',
      fillOpacity: 0.3,
      strokeColor: '#3B82F6',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      clickable: true,
      editable: true,
      draggable: true,
      zIndex: 1,
    },
  }
  
  const drawingManager = new google.maps.drawing.DrawingManager({
    ...defaultOptions,
    ...options,
    map,
  })
  
  return drawingManager
}

/**
 * Convert a Google Maps Rectangle to GeoJSON
 */
export function rectangleToGeoJSON(rectangle: google.maps.Rectangle): any {
  const bounds = rectangle.getBounds()
  if (!bounds) return null
  
  const ne = bounds.getNorthEast()
  const sw = bounds.getSouthWest()
  
  return {
    type: 'Polygon',
    coordinates: [[
      [sw.lng(), sw.lat()],
      [ne.lng(), sw.lat()],
      [ne.lng(), ne.lat()],
      [sw.lng(), ne.lat()],
      [sw.lng(), sw.lat()], // Close the polygon
    ]],
  }
}

/**
 * Convert a Google Maps Polygon to GeoJSON
 */
export function polygonToGeoJSON(polygon: google.maps.Polygon): any {
  const path = polygon.getPath()
  const coordinates: number[][] = []
  
  path.forEach((latLng) => {
    coordinates.push([latLng.lng(), latLng.lat()])
  })
  
  // Close the polygon if not already closed
  if (coordinates.length > 0) {
    const first = coordinates[0]
    const last = coordinates[coordinates.length - 1]
    if (first[0] !== last[0] || first[1] !== last[1]) {
      coordinates.push([first[0], first[1]])
    }
  }
  
  return {
    type: 'Polygon',
    coordinates: [coordinates],
  }
}

/**
 * Convert a Google Maps Circle to GeoJSON (approximate)
 * Note: GeoJSON doesn't have a native circle type, so we approximate with a polygon
 */
export function circleToGeoJSON(circle: google.maps.Circle, points: number = 64): any {
  const center = circle.getCenter()
  if (!center) return null
  
  const radius = circle.getRadius()
  const coordinates: number[][] = []
  
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * 2 * Math.PI
    const lat = center.lat() + (radius / 111320) * Math.cos(angle)
    const lng = center.lng() + (radius / (111320 * Math.cos(center.lat() * Math.PI / 180))) * Math.sin(angle)
    coordinates.push([lng, lat])
  }
  
  // Close the polygon
  coordinates.push(coordinates[0])
  
  return {
    type: 'Polygon',
    coordinates: [coordinates],
  }
}

/**
 * Get bounds from a Google Maps shape
 */
export function getShapeBounds(shape: google.maps.Rectangle | google.maps.Polygon | google.maps.Circle): {
  north: number
  south: number
  east: number
  west: number
} | null {
  if ('getBounds' in shape && shape.getBounds) {
    const bounds = shape.getBounds()
    if (bounds) {
      return {
        north: bounds.getNorthEast().lat(),
        south: bounds.getSouthWest().lat(),
        east: bounds.getNorthEast().lng(),
        west: bounds.getSouthWest().lng(),
      }
    }
  } else if (shape instanceof google.maps.Polygon) {
    const path = shape.getPath()
    let north = -90, south = 90, east = -180, west = 180
    
    path.forEach((latLng) => {
      const lat = latLng.lat()
      const lng = latLng.lng()
      north = Math.max(north, lat)
      south = Math.min(south, lat)
      east = Math.max(east, lng)
      west = Math.min(west, lng)
    })
    
    return { north, south, east, west }
  }
  
  return null
}

/**
 * Create a custom map control button
 */
export function createMapControl(
  map: google.maps.Map,
  text: string,
  position: google.maps.ControlPosition,
  onClick: () => void
): HTMLElement {
  const controlDiv = document.createElement('div')
  
  const controlUI = document.createElement('button')
  controlUI.style.backgroundColor = '#fff'
  controlUI.style.border = '2px solid #fff'
  controlUI.style.borderRadius = '3px'
  controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)'
  controlUI.style.cursor = 'pointer'
  controlUI.style.marginTop = '10px'
  controlUI.style.marginRight = '10px'
  controlUI.style.padding = '8px 12px'
  controlUI.style.textAlign = 'center'
  controlUI.title = text
  controlUI.type = 'button'
  controlDiv.appendChild(controlUI)
  
  const controlText = document.createElement('div')
  controlText.style.color = 'rgb(25,25,25)'
  controlText.style.fontFamily = 'Roboto,Arial,sans-serif'
  controlText.style.fontSize = '14px'
  controlText.style.lineHeight = '20px'
  controlText.innerHTML = text
  controlUI.appendChild(controlText)
  
  controlUI.addEventListener('click', onClick)
  
  map.controls[position].push(controlDiv)
  
  return controlDiv
}