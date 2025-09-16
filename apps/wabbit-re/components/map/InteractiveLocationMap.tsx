'use client'

import React, { useEffect, useRef, useState } from 'react'
import { loadGoogleMaps } from '@/lib/map/google-maps-loader'

interface LocationProperty {
  id: string
  address: string
  latitude: number
  longitude: number
}

interface CommuteAddress {
  address: string
  maxMinutes: number
}

interface SchoolData {
  name: string
  type: 'Private' | 'Public'
  grades: string
  distance: number
  studentPopulation: number
  latitude: number
  longitude: number
}

interface EntertainmentDistrict {
  name: string
  address: string
  distance: number
  latitude: number
  longitude: number
}

interface GroceryStore {
  name: string
  address: string
  type: string
  latitude: number
  longitude: number
}

interface InteractiveLocationMapProps {
  property: LocationProperty
  commuteAddress1?: CommuteAddress
  commuteAddress2?: CommuteAddress
  schools?: SchoolData[]
  entertainment?: EntertainmentDistrict[]
  groceries?: GroceryStore[]
  height?: string
}

const InteractiveLocationMap: React.FC<InteractiveLocationMapProps> = ({
  property,
  commuteAddress1,
  commuteAddress2,
  schools = [],
  entertainment = [],
  groceries = [],
  height = '400px'
}) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [markers, setMarkers] = useState<google.maps.Marker[]>([])
  const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const initializeMap = async () => {
      try {
        const google = await loadGoogleMaps()
        
        if (!isMounted || !mapRef.current) return

        // Create map centered on property
        const mapInstance = new google.maps.Map(mapRef.current, {
          center: { lat: property.latitude, lng: property.longitude },
          zoom: 13,
          mapTypeId: 'roadmap',
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
          mapTypeControl: true,
          styles: [
            {
              featureType: 'poi.business',
              stylers: [{ visibility: 'off' }]
            }
          ]
        })

        setMap(mapInstance)

        // Create info window
        const infoWindowInstance = new google.maps.InfoWindow()
        setInfoWindow(infoWindowInstance)

        const newMarkers: google.maps.Marker[] = []

        // Add property marker (red)
        const propertyMarker = new google.maps.Marker({
          position: { lat: property.latitude, lng: property.longitude },
          map: mapInstance,
          title: property.address,
          icon: {
            url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
            scaledSize: new google.maps.Size(40, 40)
          },
          zIndex: 100
        })

        propertyMarker.addListener('click', () => {
          infoWindowInstance.setContent(`
            <div style="padding: 8px;">
              <h3 style="font-weight: bold; margin-bottom: 4px;">Current Property</h3>
              <p style="margin: 0;">${property.address}</p>
            </div>
          `)
          infoWindowInstance.open(mapInstance, propertyMarker)
        })

        newMarkers.push(propertyMarker)

        // Add commute address markers (blue)
        if (commuteAddress1?.address) {
          // For demo, use a sample location near Phoenix
          const commute1Marker = new google.maps.Marker({
            position: { lat: 33.4484, lng: -112.0740 }, // Downtown Phoenix
            map: mapInstance,
            title: `Commute 1: ${commuteAddress1.address}`,
            icon: {
              url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
              scaledSize: new google.maps.Size(32, 32)
            },
            zIndex: 90
          })

          commute1Marker.addListener('click', () => {
            infoWindowInstance.setContent(`
              <div style="padding: 8px;">
                <h3 style="font-weight: bold; margin-bottom: 4px;">Commute Address #1</h3>
                <p style="margin: 2px 0;">${commuteAddress1.address}</p>
                <p style="margin: 2px 0; color: #666;">Max: ${commuteAddress1.maxMinutes} minutes</p>
                <p style="margin: 2px 0; color: #0066cc;">Est. drive time: 15-25 min</p>
              </div>
            `)
            infoWindowInstance.open(mapInstance, commute1Marker)
          })

          newMarkers.push(commute1Marker)
        }

        if (commuteAddress2?.address) {
          // For demo, use another sample location
          const commute2Marker = new google.maps.Marker({
            position: { lat: 33.5093, lng: -111.8903 }, // Scottsdale
            map: mapInstance,
            title: `Commute 2: ${commuteAddress2.address}`,
            icon: {
              url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
              scaledSize: new google.maps.Size(32, 32)
            },
            zIndex: 89
          })

          commute2Marker.addListener('click', () => {
            infoWindowInstance.setContent(`
              <div style="padding: 8px;">
                <h3 style="font-weight: bold; margin-bottom: 4px;">Commute Address #2</h3>
                <p style="margin: 2px 0;">${commuteAddress2.address}</p>
                <p style="margin: 2px 0; color: #666;">Max: ${commuteAddress2.maxMinutes} minutes</p>
                <p style="margin: 2px 0; color: #0066cc;">Est. drive time: 10-20 min</p>
              </div>
            `)
            infoWindowInstance.open(mapInstance, commute2Marker)
          })

          newMarkers.push(commute2Marker)
        }

        // Add school markers (yellow)
        schools.forEach((school, index) => {
          if (school.latitude && school.longitude) {
            const schoolMarker = new google.maps.Marker({
              position: { lat: school.latitude, lng: school.longitude },
              map: mapInstance,
              title: school.name,
              icon: {
                url: 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
                scaledSize: new google.maps.Size(24, 24)
              },
              zIndex: 70
            })

            schoolMarker.addListener('click', () => {
              infoWindowInstance.setContent(`
                <div style="padding: 8px;">
                  <h3 style="font-weight: bold; margin-bottom: 4px;">${school.name}</h3>
                  <p style="margin: 2px 0;"><strong>Type:</strong> ${school.type}</p>
                  <p style="margin: 2px 0;"><strong>Grades:</strong> ${school.grades}</p>
                  <p style="margin: 2px 0;"><strong>Distance:</strong> ${school.distance} miles</p>
                  <p style="margin: 2px 0;"><strong>Students:</strong> ${school.studentPopulation}</p>
                </div>
              `)
              infoWindowInstance.open(mapInstance, schoolMarker)
            })

            newMarkers.push(schoolMarker)
          }
        })

        // Add entertainment district markers (purple)
        entertainment.forEach((district) => {
          if (district.latitude && district.longitude) {
            const entertainmentMarker = new google.maps.Marker({
              position: { lat: district.latitude, lng: district.longitude },
              map: mapInstance,
              title: district.name,
              icon: {
                url: 'http://maps.google.com/mapfiles/ms/icons/purple-dot.png',
                scaledSize: new google.maps.Size(24, 24)
              },
              zIndex: 60
            })

            entertainmentMarker.addListener('click', () => {
              infoWindowInstance.setContent(`
                <div style="padding: 8px;">
                  <h3 style="font-weight: bold; margin-bottom: 4px;">${district.name}</h3>
                  <p style="margin: 2px 0;">${district.address}</p>
                  <p style="margin: 2px 0;"><strong>Distance:</strong> ${district.distance} miles</p>
                </div>
              `)
              infoWindowInstance.open(mapInstance, entertainmentMarker)
            })

            newMarkers.push(entertainmentMarker)
          }
        })

        // Add grocery store markers (green)
        groceries.forEach((store) => {
          if (store.latitude && store.longitude) {
            const groceryMarker = new google.maps.Marker({
              position: { lat: store.latitude, lng: store.longitude },
              map: mapInstance,
              title: store.name,
              icon: {
                url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
                scaledSize: new google.maps.Size(24, 24)
              },
              zIndex: 50
            })

            groceryMarker.addListener('click', () => {
              infoWindowInstance.setContent(`
                <div style="padding: 8px;">
                  <h3 style="font-weight: bold; margin-bottom: 4px;">${store.name}</h3>
                  <p style="margin: 2px 0;">${store.address}</p>
                  ${store.type ? `<p style="margin: 2px 0;"><strong>Type:</strong> ${store.type}</p>` : ''}
                </div>
              `)
              infoWindowInstance.open(mapInstance, groceryMarker)
            })

            newMarkers.push(groceryMarker)
          }
        })

        setMarkers(newMarkers)

        // Adjust bounds to show all markers
        if (newMarkers.length > 1) {
          const bounds = new google.maps.LatLngBounds()
          newMarkers.forEach(marker => {
            const position = marker.getPosition()
            if (position) bounds.extend(position)
          })
          mapInstance.fitBounds(bounds)
          
          // Ensure we don't zoom in too much
          const listener = google.maps.event.addListenerOnce(mapInstance, 'idle', () => {
            const currentZoom = mapInstance.getZoom()
            if (currentZoom && currentZoom > 14) {
              mapInstance.setZoom(14)
            }
          })
        }

      } catch (error: any) {
        console.error('Error loading Google Maps:', error)
        setMapError(error.message || 'Failed to load Google Maps')
      }
    }

    initializeMap()

    return () => {
      isMounted = false
      // Clean up markers
      markers.forEach(marker => marker.setMap(null))
    }
  }, [property, commuteAddress1, commuteAddress2, schools, entertainment, groceries])

  // Show error state if map fails to load
  if (mapError) {
    return (
      <div 
        className="bg-gray-50 dark:bg-gray-800 rounded-lg flex flex-col items-center justify-center p-6"
        style={{ height }}
      >
        <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
          Map unavailable - API key required
        </p>
      </div>
    )
  }

  return (
    <div 
      ref={mapRef} 
      style={{ height, width: '100%' }}
      className="rounded-lg overflow-hidden"
      data-testid="interactive-location-map"
    />
  )
}

export default InteractiveLocationMap