'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

// Types
export interface SearchArea {
  id: string
  area_name: string
  area_type: 'rectangle' | 'polygon' | 'circle'
  is_active: boolean
  is_inclusion: boolean
  bounds: {
    north: number
    south: number
    east: number
    west: number
  }
  center_point?: {
    lat: number
    lng: number
    radius_meters: number
  }
  coordinates?: any // GeoJSON coordinates
  color: string
  opacity: number
  property_count?: number
  created_at: string
  updated_at: string
}

export interface PropertyWithArea {
  property_id: string
  in_inclusion_area: boolean
  in_exclusion_area: boolean
  area_names: string[]
}

interface MapContextType {
  // State
  searchAreas: SearchArea[]
  activeAreaIds: string[]
  filteredProperties: PropertyWithArea[]
  isLoading: boolean
  isDrawing: boolean
  
  // Actions
  loadSearchAreas: () => Promise<void>
  saveSearchArea: (area: Omit<SearchArea, 'id' | 'created_at' | 'updated_at'>) => Promise<SearchArea | null>
  deleteSearchArea: (areaId: string) => Promise<boolean>
  toggleAreaActive: (areaId: string) => Promise<void>
  setActiveAreaIds: (ids: string[]) => void
  filterPropertiesByAreas: (areaIds?: string[]) => Promise<void>
  countPropertiesInGeometry: (geojson: any) => Promise<{ total: number; included: number; excluded: number }>
  setIsDrawing: (drawing: boolean) => void
  clearAllAreas: () => Promise<void>
}

const MapContext = createContext<MapContextType | undefined>(undefined)

export function MapProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [searchAreas, setSearchAreas] = useState<SearchArea[]>([])
  const [activeAreaIds, setActiveAreaIds] = useState<string[]>([])
  const [filteredProperties, setFilteredProperties] = useState<PropertyWithArea[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  
  const supabase = createClient()

  // Load user's search areas
  const loadSearchAreas = useCallback(async () => {
    if (!user) {
      console.log('MapContext: No user, clearing search areas')
      setSearchAreas([])
      return
    }

    console.log('MapContext: Loading search areas for user:', user.id)
    setIsLoading(true)
    try {
      const { data, error } = await supabase.rpc('get_user_search_areas_with_counts')
      
      if (error) {
        // Check if it's a function not found error
        if (error.message?.includes('function') || error.message?.includes('does not exist')) {
          console.warn('MapContext: RPC function not found, likely migrations not run:', error.message)
          console.log('MapContext: Falling back to direct table query')
          
          // Fallback: Try direct table query
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('user_search_areas')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
          
          if (!fallbackError && fallbackData) {
            console.log('MapContext: Loaded areas via fallback:', fallbackData.length)
            setSearchAreas(fallbackData)
            const activeIds = fallbackData
              .filter((area: SearchArea) => area.is_active)
              .map((area: SearchArea) => area.id)
            setActiveAreaIds(activeIds)
          } else if (fallbackError) {
            console.error('MapContext: Fallback also failed:', fallbackError)
          }
        } else {
          console.error('MapContext: Error loading search areas:', error)
        }
        return
      }

      if (data) {
        console.log('MapContext: Successfully loaded search areas:', data.length)
        console.log('MapContext: Area details:', data.map((a: any) => ({
          id: a.id,
          name: a.area_name,
          type: a.area_type,
          hasBounds: !!a.bounds,
          hasCoordinates: !!a.coordinates,
          hasCenter: !!a.center_point
        })))
        setSearchAreas(data)
        // Set active areas
        const activeIds = data
          .filter((area: SearchArea) => area.is_active)
          .map((area: SearchArea) => area.id)
        setActiveAreaIds(activeIds)
      } else {
        console.log('MapContext: No search areas found for user')
      }
    } catch (error) {
      console.error('MapContext: Unexpected error loading search areas:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user, supabase])

  // Save a new search area
  const saveSearchArea = useCallback(async (
    area: Omit<SearchArea, 'id' | 'created_at' | 'updated_at'>
  ): Promise<SearchArea | null> => {
    // For now, save locally without requiring authentication
    // This allows testing without Supabase backend setup
    try {
      // Create a new area with a unique ID
      const newArea: SearchArea = {
        ...area,
        id: `area-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        property_count: 0
      }

      console.log('MapContext: Saving new area:', newArea)

      // Add to local state
      setSearchAreas(prev => {
        const updated = [...prev, newArea]
        console.log('MapContext: Updated areas count:', updated.length)
        return updated
      })
      
      // If user is logged in, try to save to Supabase
      if (user) {
        try {
          const { data, error } = await supabase.rpc('save_search_area', {
            p_area_name: area.area_name,
            p_area_type: area.area_type,
            p_geojson: area.coordinates,
            p_bounds: area.bounds,
            p_center_point: area.center_point || null,
            p_is_inclusion: area.is_inclusion,
            p_color: area.color,
            p_opacity: area.opacity
          })

          if (error) {
            // If RPC doesn't exist, try direct insert
            if (error.message?.includes('function') || error.message?.includes('does not exist')) {
              console.log('MapContext: RPC save function not found, using direct insert')
              const { data: directData, error: directError } = await supabase
                .from('user_search_areas')
                .insert({
                  user_id: user.id,
                  area_name: area.area_name,
                  area_type: area.area_type,
                  coordinates: area.coordinates,
                  bounds: area.bounds,
                  center_point: area.center_point || null,
                  is_inclusion: area.is_inclusion,
                  is_active: area.is_active,
                  color: area.color,
                  opacity: area.opacity
                })
                .select()
                .single()
              
              if (!directError && directData) {
                // Update with the real ID from database
                setSearchAreas(prev => prev.map(a => 
                  a.id === newArea.id ? { ...directData } : a
                ))
                newArea.id = directData.id
                console.log('MapContext: Area saved via direct insert')
              } else if (directError) {
                console.error('MapContext: Direct insert also failed:', directError)
              }
            } else {
              console.error('MapContext: Error saving area via RPC:', error)
            }
          } else if (data) {
            // Update with the real ID from database
            setSearchAreas(prev => prev.map(a => 
              a.id === newArea.id ? { ...a, id: data } : a
            ))
            newArea.id = data
            console.log('MapContext: Area saved via RPC')
          }
        } catch (dbError) {
          console.log('Note: Areas saved locally only (database error):', dbError)
        }
      }
      
      return newArea
    } catch (error) {
      console.error('Error saving search area:', error)
      return null
    }
  }, [user, supabase])

  // Delete a search area
  const deleteSearchArea = useCallback(async (areaId: string): Promise<boolean> => {
    console.log('MapContext: Deleting area:', areaId)
    
    // Allow deletion of local areas even without user
    try {
      // If user is logged in and it's a database area, try to delete from Supabase
      if (user && !areaId.startsWith('area-')) {
        const { data, error } = await supabase.rpc('delete_search_area', {
          p_area_id: areaId
        })

        if (error) {
          console.error('Error deleting search area from database:', error)
          // Continue with local deletion even if database fails
        }
      }

      // Always remove from local state
      setSearchAreas(prev => {
        const updated = prev.filter(area => area.id !== areaId)
        console.log('MapContext: Areas after delete:', updated.length)
        return updated
      })
      setActiveAreaIds(prev => prev.filter(id => id !== areaId))
      
      return true
    } catch (error) {
      console.error('Error deleting search area:', error)
      return false
    }
  }, [user, supabase])

  // Toggle area active status
  const toggleAreaActive = useCallback(async (areaId: string) => {
    console.log('MapContext: Toggling area active:', areaId)
    
    try {
      // Find the current area to toggle its state
      const currentArea = searchAreas.find(a => a.id === areaId)
      if (!currentArea) return
      
      const newActiveState = !currentArea.is_active
      
      // If user is logged in and it's a database area, try to update in Supabase
      if (user && !areaId.startsWith('area-')) {
        try {
          const { data, error } = await supabase.rpc('toggle_search_area_active', {
            p_area_id: areaId
          })

          if (error) {
            console.error('Error toggling area active in database:', error)
            // Continue with local toggle even if database fails
          }
        } catch (dbError) {
          console.log('Toggling locally only')
        }
      }

      // Always update local state
      setSearchAreas(prev => prev.map(area => 
        area.id === areaId 
          ? { ...area, is_active: newActiveState }
          : area
      ))

      // Update active IDs
      if (newActiveState) {
        setActiveAreaIds(prev => [...prev, areaId])
      } else {
        setActiveAreaIds(prev => prev.filter(id => id !== areaId))
      }

      // Re-filter properties will happen via useEffect
    } catch (error) {
      console.error('Error toggling area active:', error)
    }
  }, [user, supabase, searchAreas])

  // Filter properties by active areas
  const filterPropertiesByAreas = useCallback(async (areaIds?: string[]) => {
    if (!user) {
      setFilteredProperties([])
      return
    }

    setIsLoading(true)
    try {
      const idsToUse = areaIds || activeAreaIds
      
      if (idsToUse.length === 0) {
        setFilteredProperties([])
        return
      }

      const { data, error } = await supabase.rpc('get_properties_in_areas', {
        p_user_id: user.id,
        p_area_ids: idsToUse
      })

      if (error) {
        console.error('Error filtering properties:', error)
        return
      }

      if (data) {
        setFilteredProperties(data)
      }
    } catch (error) {
      console.error('Error filtering properties:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user, supabase, activeAreaIds])

  // Count properties in a geometry (for real-time drawing feedback)
  const countPropertiesInGeometry = useCallback(async (geojson: any): Promise<{
    total: number
    included: number
    excluded: number
  }> => {
    try {
      const { data, error } = await supabase.rpc('count_properties_in_geometry', {
        p_geojson: geojson
      })

      if (error) {
        console.error('Error counting properties:', error)
        return { total: 0, included: 0, excluded: 0 }
      }

      if (data && data.length > 0) {
        return {
          total: data[0].total_count || 0,
          included: data[0].included_count || 0,
          excluded: data[0].excluded_count || 0
        }
      }

      return { total: 0, included: 0, excluded: 0 }
    } catch (error) {
      console.error('Error counting properties:', error)
      return { total: 0, included: 0, excluded: 0 }
    }
  }, [supabase])

  // Clear all areas
  const clearAllAreas = useCallback(async () => {
    if (!user) return

    setIsLoading(true)
    try {
      // Delete all areas one by one (could be optimized with a batch delete RPC)
      const deletePromises = searchAreas.map(area => deleteSearchArea(area.id))
      await Promise.all(deletePromises)
      
      setSearchAreas([])
      setActiveAreaIds([])
      setFilteredProperties([])
    } catch (error) {
      console.error('Error clearing all areas:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user, searchAreas, deleteSearchArea])

  // Load areas when user changes
  useEffect(() => {
    if (user) {
      loadSearchAreas()
    } else {
      setSearchAreas([])
      setActiveAreaIds([])
      setFilteredProperties([])
    }
  }, [user, loadSearchAreas])

  // Re-filter when active areas change
  useEffect(() => {
    if (activeAreaIds.length > 0) {
      filterPropertiesByAreas()
    } else {
      setFilteredProperties([])
    }
  }, [activeAreaIds, filterPropertiesByAreas])

  return (
    <MapContext.Provider value={{
      searchAreas,
      activeAreaIds,
      filteredProperties,
      isLoading,
      isDrawing,
      loadSearchAreas,
      saveSearchArea,
      deleteSearchArea,
      toggleAreaActive,
      setActiveAreaIds,
      filterPropertiesByAreas,
      countPropertiesInGeometry,
      setIsDrawing,
      clearAllAreas
    }}>
      {children}
    </MapContext.Provider>
  )
}

export function useMapContext() {
  const context = useContext(MapContext)
  if (context === undefined) {
    throw new Error('useMapContext must be used within a MapProvider')
  }
  return context
}