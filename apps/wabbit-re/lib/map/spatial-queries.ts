import { createClient } from '@/lib/supabase/client'
import type { SearchArea } from '@/contexts/MapContext'

/**
 * Types for spatial query results
 */
export interface SpatialProperty {
  id: string
  address: string
  city: string
  list_price: number
  latitude: number
  longitude: number
  in_inclusion_area: boolean
  in_exclusion_area: boolean
  area_names: string[]
}

export interface PropertyCount {
  total: number
  included: number
  excluded: number
}

/**
 * Get properties filtered by search areas
 */
export async function getPropertiesInAreas(
  userId: string,
  areaIds?: string[],
  includeExcluded: boolean = false
): Promise<SpatialProperty[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase.rpc('get_properties_in_areas', {
    p_user_id: userId,
    p_area_ids: areaIds || null,
    p_include_excluded: includeExcluded
  })
  
  if (error) {
    console.error('Error fetching properties in areas:', error)
    return []
  }
  
  return data || []
}

/**
 * Count properties in a geometry
 */
export async function countPropertiesInGeometry(
  geojson: any,
  excludeAreaIds?: string[]
): Promise<PropertyCount> {
  const supabase = createClient()
  
  const { data, error } = await supabase.rpc('count_properties_in_geometry', {
    p_geojson: geojson,
    p_exclude_area_ids: excludeAreaIds || null
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
}

/**
 * Get user's search areas with property counts
 */
export async function getUserSearchAreasWithCounts(
  userId?: string
): Promise<SearchArea[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase.rpc('get_user_search_areas_with_counts', {
    p_user_id: userId || null
  })
  
  if (error) {
    console.error('Error fetching search areas:', error)
    return []
  }
  
  return data || []
}

/**
 * Save or update a search area
 */
export async function saveSearchArea(
  areaName: string,
  areaType: 'rectangle' | 'polygon' | 'circle',
  geojson: any,
  bounds: any,
  centerPoint?: any,
  isInclusion: boolean = true,
  color: string = '#3B82F6',
  opacity: number = 0.3,
  areaId?: string
): Promise<string | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase.rpc('save_search_area', {
    p_area_name: areaName,
    p_area_type: areaType,
    p_geojson: geojson,
    p_bounds: bounds,
    p_center_point: centerPoint || null,
    p_is_inclusion: isInclusion,
    p_color: color,
    p_opacity: opacity,
    p_area_id: areaId || null
  })
  
  if (error) {
    console.error('Error saving search area:', error)
    return null
  }
  
  return data
}

/**
 * Delete a search area
 */
export async function deleteSearchArea(areaId: string): Promise<boolean> {
  const supabase = createClient()
  
  const { data, error } = await supabase.rpc('delete_search_area', {
    p_area_id: areaId
  })
  
  if (error) {
    console.error('Error deleting search area:', error)
    return false
  }
  
  return data || false
}

/**
 * Toggle search area active status
 */
export async function toggleSearchAreaActive(areaId: string): Promise<boolean | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase.rpc('toggle_search_area_active', {
    p_area_id: areaId
  })
  
  if (error) {
    console.error('Error toggling area active:', error)
    return null
  }
  
  return data
}

/**
 * Get property details with area information
 */
export async function getPropertyWithAreas(propertyId: string): Promise<{
  property: any
  searchAreas: any[]
} | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase.rpc('get_property_with_areas', {
    p_property_id: propertyId
  })
  
  if (error) {
    console.error('Error fetching property with areas:', error)
    return null
  }
  
  if (data && data.length > 0) {
    return {
      property: data[0].property,
      searchAreas: data[0].search_areas || []
    }
  }
  
  return null
}

/**
 * Batch update property cache for multiple areas
 */
export async function updatePropertyCache(areaIds: string[]): Promise<void> {
  const supabase = createClient()
  
  // Update cache for each area
  const promises = areaIds.map(areaId => 
    supabase.rpc('update_property_cache_for_area', {
      p_area_id: areaId
    })
  )
  
  await Promise.all(promises)
}

/**
 * Get properties within a radius of a point
 */
export async function getPropertiesWithinRadius(
  centerLat: number,
  centerLng: number,
  radiusMeters: number,
  limit: number = 100
): Promise<SpatialProperty[]> {
  const supabase = createClient()
  
  // Create a circle geometry using PostGIS
  const { data, error } = await supabase.rpc('get_properties_within_radius', {
    p_center_lat: centerLat,
    p_center_lng: centerLng,
    p_radius_meters: radiusMeters,
    p_limit: limit
  })
  
  if (error) {
    console.error('Error fetching properties within radius:', error)
    return []
  }
  
  return data || []
}

/**
 * Get area statistics
 */
export async function getAreaStatistics(areaId: string): Promise<{
  propertyCount: number
  avgPrice: number
  priceRange: { min: number; max: number }
  avgSquareFootage: number
  avgPricePerSqft: number
} | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('property_area_cache')
    .select(`
      property_id,
      properties!inner(
        list_price,
        square_footage
      )
    `)
    .eq('search_area_id', areaId)
    .eq('is_inside', true)
  
  if (error) {
    console.error('Error fetching area statistics:', error)
    return null
  }
  
  if (!data || data.length === 0) {
    return {
      propertyCount: 0,
      avgPrice: 0,
      priceRange: { min: 0, max: 0 },
      avgSquareFootage: 0,
      avgPricePerSqft: 0
    }
  }
  
  // Calculate statistics
  const properties = data.map(d => d.properties).flat().filter(p => p)
  const prices = properties.map((p: any) => p.list_price).filter(p => p > 0)
  const squareFootages = properties.map((p: any) => p.square_footage).filter(s => s > 0)
  
  const avgPrice = prices.length > 0 
    ? prices.reduce((a, b) => a + b, 0) / prices.length 
    : 0
  
  const avgSquareFootage = squareFootages.length > 0
    ? squareFootages.reduce((a, b) => a + b, 0) / squareFootages.length
    : 0
  
  const avgPricePerSqft = avgPrice > 0 && avgSquareFootage > 0
    ? avgPrice / avgSquareFootage
    : 0
  
  return {
    propertyCount: properties.length,
    avgPrice,
    priceRange: {
      min: prices.length > 0 ? Math.min(...prices) : 0,
      max: prices.length > 0 ? Math.max(...prices) : 0
    },
    avgSquareFootage,
    avgPricePerSqft
  }
}

/**
 * Convert commute addresses to search areas
 */
export async function createCommuteAreas(
  userId: string,
  commuteAddresses: Array<{ address: string; maxMinutes: number }>
): Promise<string[]> {
  const areaIds: string[] = []
  
  // This would integrate with Google Maps Geocoding API
  // For now, returning empty array as placeholder
  // Implementation would:
  // 1. Geocode each address
  // 2. Calculate radius based on average driving speed and time
  // 3. Create circular search areas
  
  return areaIds
}

/**
 * Convert zip codes to polygon boundaries
 */
export async function createZipCodeAreas(
  userId: string,
  zipCodes: string[]
): Promise<string[]> {
  const areaIds: string[] = []
  
  // This would integrate with a zip code boundary service
  // For now, returning empty array as placeholder
  // Implementation would:
  // 1. Fetch polygon boundaries for each zip code
  // 2. Create polygon search areas
  
  return areaIds
}