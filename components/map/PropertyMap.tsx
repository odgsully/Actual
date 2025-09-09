'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  createMap,
  createDrawingManager,
  loadGoogleMaps,
  rectangleToGeoJSON,
  polygonToGeoJSON,
  circleToGeoJSON,
  getShapeBounds,
  createMapControl
} from '@/lib/map/google-maps-loader'
import {
  formatArea,
  calculateRectangleArea,
  calculatePolygonArea,
  generateAreaColor
} from '@/lib/map/geometry-utils'
import { countPropertiesInGeometry } from '@/lib/map/spatial-queries'
import { useMapContext } from '@/contexts/MapContext'
import { useAuth } from '@/hooks/useAuth'

interface PropertyMapProps {
  properties?: Array<{
    id: string
    address: string
    latitude: number
    longitude: number
    list_price?: number
  }>
  height?: string
  onAreaDrawn?: (area: any) => void
  showDrawingControls?: boolean
  showPropertyMarkers?: boolean
  className?: string
}

export default function PropertyMap({
  properties = [],
  height = '600px',
  onAreaDrawn,
  showDrawingControls = true,
  showPropertyMarkers = true,
  className = ''
}: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapRef = useRef<google.maps.Map | null>(null)
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null)
  const drawnShapesRef = useRef<Map<string, any>>(new Map())
  const propertyMarkersRef = useRef<google.maps.Marker[]>([])
  
  const { user } = useAuth()
  const {
    searchAreas,
    saveSearchArea,
    deleteSearchArea,
    toggleAreaActive,
    setIsDrawing,
    isLoading
  } = useMapContext()
  
  const [currentDrawing, setCurrentDrawing] = useState<any>(null)
  const [drawingStats, setDrawingStats] = useState<{
    area: string
    propertyCount: number
  } | null>(null)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [areaName, setAreaName] = useState('')
  const [isInclusion, setIsInclusion] = useState(true)
  const [mapError, setMapError] = useState<string | null>(null)
  const [mapInitialized, setMapInitialized] = useState(false)

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return

    const initMap = async () => {
      try {
        const google = await loadGoogleMaps()
        
        // Create map centered on Phoenix area
        const map = await createMap(mapRef.current!, {
          center: properties.length > 0
            ? { lat: properties[0].latitude, lng: properties[0].longitude }
            : { lat: 33.5093, lng: -111.8990 }, // Scottsdale/Phoenix area
          zoom: properties.length > 0 ? 12 : 11,
        })
        
        googleMapRef.current = map
        setMapInitialized(true) // Mark map as ready

        // Add property markers
        if (showPropertyMarkers && properties.length > 0) {
          addPropertyMarkers(map, google)
        }

        // Initialize drawing manager
        if (showDrawingControls) {
          const drawingManager = await createDrawingManager(map)
          drawingManagerRef.current = drawingManager
          
          // Listen for drawing complete events
          google.maps.event.addListener(
            drawingManager,
            'overlaycomplete',
            handleOverlayComplete
          )
        }

        // Add custom controls
        if (showDrawingControls) {
          addCustomControls(map)
        }

        // Don't load areas on initial mount - wait for them to come from context
        // loadExistingAreas(map, google, searchAreas)
      } catch (error: any) {
        console.error('Error initializing map:', error)
        setMapError(error.message || 'Failed to load Google Maps')
      }
    }

    initMap()

    // Cleanup
    return () => {
      // Clear markers
      propertyMarkersRef.current.forEach(marker => marker.setMap(null))
      propertyMarkersRef.current = []
      
      // Clear drawn shapes
      drawnShapesRef.current.forEach(shape => {
        if (shape.overlay) shape.overlay.setMap(null)
      })
      drawnShapesRef.current.clear()
    }
  }, [properties, showDrawingControls, showPropertyMarkers]) // Include relevant deps but not searchAreas (handled separately)

  // Single effect to handle area loading when both map and areas are ready
  useEffect(() => {
    // Need both map to be initialized and areas to be available
    if (!mapInitialized || !googleMapRef.current) {
      console.log('PropertyMap: Waiting - Map initialized:', mapInitialized, 'Areas:', searchAreas.length)
      return
    }
    
    console.log('PropertyMap: Map ready and areas available, count:', searchAreas.length)
    
    // Small delay to ensure map is fully ready for overlays
    const timeoutId = setTimeout(() => {
      loadGoogleMaps().then(google => {
        console.log('PropertyMap: Loading areas onto map...')
        loadExistingAreas(googleMapRef.current!, google, searchAreas)
      }).catch(err => {
        console.error('PropertyMap: Error loading areas:', err)
      })
    }, 500) // Half second delay ensures map is fully ready
    
    return () => clearTimeout(timeoutId)
  }, [mapInitialized, searchAreas])

  // Add property markers to map
  const addPropertyMarkers = async (map: google.maps.Map, google: typeof window.google) => {
    // Clear existing markers
    propertyMarkersRef.current.forEach(marker => marker.setMap(null))
    propertyMarkersRef.current = []

    // Add new markers
    properties.forEach(property => {
      const marker = new google.maps.Marker({
        position: { lat: property.latitude, lng: property.longitude },
        map,
        title: property.address,
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new google.maps.Size(32, 32)
        }
      })

      // Add info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold;">
              ${property.address}
            </h3>
            ${property.list_price ? `
              <p style="margin: 0; font-size: 12px;">
                Price: $${property.list_price.toLocaleString()}
              </p>
            ` : ''}
          </div>
        `
      })

      marker.addListener('click', () => {
        infoWindow.open(map, marker)
      })

      propertyMarkersRef.current.push(marker)
    })
  }

  // Load existing search areas
  const loadExistingAreas = async (map: google.maps.Map, google: typeof window.google, areas: typeof searchAreas) => {
    console.log('PropertyMap: Loading existing areas, count:', areas.length)
    
    // Debug log the full area data
    if (areas.length > 0) {
      console.log('PropertyMap: Full area data:', areas)
    }
    
    // ALWAYS clear ALL existing overlays first to ensure fresh render
    drawnShapesRef.current.forEach((shape, id) => {
      if (shape.overlay) {
        shape.overlay.setMap(null)
      }
    })
    drawnShapesRef.current.clear() // Clear the ref completely
    console.log('PropertyMap: Cleared all existing overlays')
    
    areas.forEach(area => {
      // Don't skip - always create fresh overlays
      
      console.log('PropertyMap: Creating overlay for area:', {
        id: area.id,
        name: area.area_name,
        type: area.area_type,
        bounds: area.bounds,
        coordinates: area.coordinates ? 'present' : 'missing',
        coordinatesType: area.coordinates ? typeof area.coordinates : 'null',
        coordinatesValue: area.coordinates,
        center: area.center_point
      })
      let overlay: any = null
      const displayColor = area.color || '#4285F4' // Default blue if no color
      const displayOpacity = area.is_active ? (area.opacity || 0.35) : 0.15

      if (area.area_type === 'rectangle' && area.bounds) {
        console.log('PropertyMap: Creating rectangle with bounds:', area.bounds)
        overlay = new google.maps.Rectangle({
          bounds: {
            north: area.bounds.north,
            south: area.bounds.south,
            east: area.bounds.east,
            west: area.bounds.west
          },
          map,
          fillColor: displayColor,
          fillOpacity: displayOpacity,
          strokeColor: displayColor,
          strokeOpacity: area.is_active ? 0.8 : 0.4,
          strokeWeight: area.is_active ? 3 : 2,
          editable: false,
          draggable: false,
          clickable: true
        })
      } else if (area.area_type === 'circle' && area.center_point) {
        overlay = new google.maps.Circle({
          center: {
            lat: area.center_point.lat,
            lng: area.center_point.lng
          },
          radius: area.center_point.radius_meters,
          map,
          fillColor: displayColor,
          fillOpacity: displayOpacity,
          strokeColor: displayColor,
          strokeOpacity: area.is_active ? 0.8 : 0.4,
          strokeWeight: area.is_active ? 3 : 2,
          editable: false,
          draggable: false,
          clickable: true
        })
      } else if (area.area_type === 'polygon' && area.coordinates) {
        console.log('PropertyMap: Creating polygon with coordinates:', area.coordinates)
        // Convert GeoJSON coordinates to Google Maps path
        // Handle both direct coordinates array and GeoJSON format
        let coordinates = area.coordinates
        
        // Parse if it's a string (from database ST_AsGeoJSON)
        if (typeof coordinates === 'string') {
          try {
            coordinates = JSON.parse(coordinates)
          } catch (e) {
            console.error('PropertyMap: Failed to parse coordinates string:', e)
          }
        }
        
        if (coordinates.type === 'Polygon' && coordinates.coordinates) {
          coordinates = coordinates.coordinates[0]
        } else if (Array.isArray(coordinates) && coordinates[0] && !Array.isArray(coordinates[0])) {
          // Already in the right format
          coordinates = coordinates
        } else if (Array.isArray(coordinates) && Array.isArray(coordinates[0])) {
          coordinates = coordinates[0]
        }
        
        const path = coordinates.map((coord: any) => {
          // Handle both [lng, lat] and {lat, lng} formats
          if (Array.isArray(coord)) {
            return { lat: coord[1], lng: coord[0] }
          } else if (coord.lat !== undefined && coord.lng !== undefined) {
            return coord
          } else {
            console.warn('PropertyMap: Unknown coordinate format:', coord)
            return { lat: 0, lng: 0 }
          }
        })
        
        overlay = new google.maps.Polygon({
          paths: path,
          map,
          fillColor: displayColor,
          fillOpacity: displayOpacity,
          strokeColor: displayColor,
          strokeOpacity: area.is_active ? 0.8 : 0.4,
          strokeWeight: area.is_active ? 3 : 2,
          editable: false,
          draggable: false,
          clickable: true
        })
      } else {
        console.warn('PropertyMap: Could not create overlay for area:', {
          id: area.id,
          name: area.area_name,
          type: area.area_type,
          hasBounds: !!area.bounds,
          hasCoordinates: !!area.coordinates,
          hasCenter: !!area.center_point
        })
      }

      if (overlay) {
        console.log('PropertyMap: Successfully created overlay for area:', area.id, area.area_name)
        drawnShapesRef.current.set(area.id, {
          overlay,
          area,
          type: area.area_type
        })
        console.log('PropertyMap: Total overlays displayed:', drawnShapesRef.current.size)

        // Add click listener to toggle or delete
        overlay.addListener('click', () => {
          handleAreaClick(area.id)
        })
        
        // Add a label to show the area name
        const labelPosition = area.area_type === 'circle' && area.center_point
          ? new google.maps.LatLng(area.center_point.lat, area.center_point.lng)
          : area.bounds
          ? new google.maps.LatLng(
              (area.bounds.north + area.bounds.south) / 2,
              (area.bounds.east + area.bounds.west) / 2
            )
          : null
          
        if (labelPosition) {
          new google.maps.Marker({
            position: labelPosition,
            map,
            label: {
              text: area.area_name,
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold'
            },
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 0
            }
          })
        }
      } else {
        console.log('Failed to create overlay for area:', area.id)
      }
    })
  }

  // Handle drawing complete
  const handleOverlayComplete = async (event: any) => {
    const { type, overlay } = event
    
    // Hide the drawn shape temporarily
    overlay.setMap(null)
    
    // Stop drawing mode
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(null)
    }

    setIsDrawing(false)
    setCurrentDrawing({ type, overlay })

    // Get GeoJSON representation
    let geojson: any = null
    let bounds: any = null
    let centerPoint: any = null
    let area = 0

    if (type === 'rectangle') {
      geojson = rectangleToGeoJSON(overlay)
      bounds = getShapeBounds(overlay)
      area = calculateRectangleArea(bounds!)
    } else if (type === 'polygon') {
      geojson = polygonToGeoJSON(overlay)
      bounds = getShapeBounds(overlay)
      const coords = geojson.coordinates[0]
      area = calculatePolygonArea(coords)
    } else if (type === 'circle') {
      const center = overlay.getCenter()
      const radius = overlay.getRadius()
      geojson = circleToGeoJSON(overlay)
      bounds = getShapeBounds(overlay)
      centerPoint = {
        lat: center.lat(),
        lng: center.lng(),
        radius_meters: radius
      }
      area = Math.PI * radius * radius
    }

    // Count properties in the drawn area
    const counts = await countPropertiesInGeometry(geojson)
    
    setDrawingStats({
      area: formatArea(area),
      propertyCount: counts.included
    })
    
    setShowSaveDialog(true)
  }

  // Save the drawn area
  const handleSaveArea = async () => {
    if (!currentDrawing || !areaName.trim()) return

    const { type, overlay } = currentDrawing
    
    let geojson: any = null
    let bounds: any = null
    let centerPoint: any = null

    if (type === 'rectangle') {
      geojson = rectangleToGeoJSON(overlay)
      bounds = getShapeBounds(overlay)
    } else if (type === 'polygon') {
      geojson = polygonToGeoJSON(overlay)
      bounds = getShapeBounds(overlay)
    } else if (type === 'circle') {
      const center = overlay.getCenter()
      const radius = overlay.getRadius()
      geojson = circleToGeoJSON(overlay)
      bounds = getShapeBounds(overlay)
      centerPoint = {
        lat: center.lat(),
        lng: center.lng(),
        radius_meters: radius
      }
    }

    const color = generateAreaColor()
    const opacity = 0.35
    
    console.log('Saving area:', areaName, type, isInclusion)
    
    const savedArea = await saveSearchArea({
      area_name: areaName,
      area_type: type,
      is_active: true,
      is_inclusion: isInclusion,
      preference: 'curious', // Default preference
      bounds,
      center_point: centerPoint,
      coordinates: geojson,
      color,
      opacity
    })

    console.log('Area saved:', savedArea)

    if (savedArea) {
      // Show the overlay with the saved color and enhanced visibility
      overlay.setOptions({
        fillColor: color,
        fillOpacity: opacity,
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeWeight: 3
      })
      overlay.setMap(googleMapRef.current)
      
      // Add a label for the area name
      const google = await loadGoogleMaps()
      const labelPosition = type === 'circle' && centerPoint
        ? new google.maps.LatLng(centerPoint.lat, centerPoint.lng)
        : bounds
        ? new google.maps.LatLng(
            (bounds.north + bounds.south) / 2,
            (bounds.east + bounds.west) / 2
          )
        : null
        
      if (labelPosition) {
        new google.maps.Marker({
          position: labelPosition,
          map: googleMapRef.current,
          label: {
            text: areaName,
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold'
          },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 0
          }
        })
      }
      
      // Add a brief animation effect
      setTimeout(() => {
        overlay.setOptions({
          strokeWeight: 2
        })
      }, 500)
      
      // Store reference BEFORE triggering reload
      drawnShapesRef.current.set(savedArea.id, {
        overlay,
        area: savedArea,
        type
      })

      // Add click listener
      overlay.addListener('click', () => {
        handleAreaClick(savedArea.id)
      })

      // Notify parent component
      if (onAreaDrawn) {
        onAreaDrawn(savedArea)
      }
    } else {
      console.error('Failed to save area')
      // Remove the overlay if save failed
      overlay.setMap(null)
    }

    // Reset state
    setShowSaveDialog(false)
    setCurrentDrawing(null)
    setDrawingStats(null)
    setAreaName('')
    setIsInclusion(true)
  }

  // Cancel drawing
  const handleCancelDrawing = () => {
    if (currentDrawing) {
      // Permanently remove the overlay
      currentDrawing.overlay.setMap(null)
    }
    
    setShowSaveDialog(false)
    setCurrentDrawing(null)
    setDrawingStats(null)
    setAreaName('')
  }

  // Handle area click
  const handleAreaClick = (areaId: string) => {
    // For now, just toggle active status
    // Could add a context menu for more options
    toggleAreaActive(areaId)
  }

  // Add custom map controls
  const addCustomControls = (map: google.maps.Map) => {
    // Clear all areas button
    createMapControl(
      map,
      'Clear All',
      google.maps.ControlPosition.TOP_LEFT,
      () => {
        if (confirm('Clear all drawn areas?')) {
          drawnShapesRef.current.forEach(shape => {
            shape.overlay.setMap(null)
          })
          drawnShapesRef.current.clear()
        }
      }
    )
  }

  // Show error state if map fails to load
  if (mapError) {
    return (
      <div 
        className="bg-gray-50 dark:bg-gray-800 rounded-lg flex flex-col items-center justify-center p-8"
        style={{ height }}
      >
        <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Google Maps Not Available</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-md mb-4">
          {mapError}
        </p>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 max-w-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-2">
            To enable the map:
          </p>
          <ol className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
            <li>Get a Google Maps API key from the <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
            <li>Enable Maps JavaScript API, Places API, and Drawing Library</li>
            <li>Add to your <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">.env.local</code> file:</li>
          </ol>
          <pre className="mt-2 p-2 bg-blue-100 dark:bg-blue-800 rounded text-xs overflow-x-auto">
            <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here</code>
          </pre>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
            Note: You can still use the form without the map feature.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {/* Map container */}
      <div
        ref={mapRef}
        style={{ height }}
        className="w-full rounded-lg shadow-lg"
      />

      {/* Drawing stats overlay */}
      {drawingStats && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-lg px-4 py-2">
          <div className="flex items-center space-x-4 text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Area: <strong>{drawingStats.area}</strong>
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              Properties: <strong>{drawingStats.propertyCount}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Save area dialog */}
      {showSaveDialog && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Save Search Area
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Area Name
                </label>
                <input
                  type="text"
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Downtown Scottsdale"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Area Type
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={isInclusion}
                      onChange={() => setIsInclusion(true)}
                      className="mr-2"
                    />
                    <span className="text-sm">Include properties</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!isInclusion}
                      onChange={() => setIsInclusion(false)}
                      className="mr-2"
                    />
                    <span className="text-sm">Exclude properties</span>
                  </label>
                </div>
              </div>

              {drawingStats && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    <div>Area: {drawingStats.area}</div>
                    <div>Properties found: {drawingStats.propertyCount}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleCancelDrawing}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveArea}
                disabled={!areaName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Area
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      )}
    </div>
  )
}