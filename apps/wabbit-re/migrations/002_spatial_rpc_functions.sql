-- ==========================================
-- Migration: Spatial RPC Functions
-- Date: 2025-09-06
-- Description: Optimized RPC functions for spatial queries
-- ==========================================

-- ==========================================
-- UTILITY FUNCTIONS
-- ==========================================

-- Function to convert GeoJSON to PostGIS geometry
CREATE OR REPLACE FUNCTION public.geojson_to_geometry(geojson JSONB)
RETURNS GEOMETRY
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN ST_SetSRID(ST_GeomFromGeoJSON(geojson::text), 4326);
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Invalid GeoJSON: %', SQLERRM;
END;
$$;

-- Function to convert Google Maps bounds to PostGIS polygon
CREATE OR REPLACE FUNCTION public.bounds_to_geometry(bounds JSONB)
RETURNS GEOMETRY
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  north NUMERIC;
  south NUMERIC;
  east NUMERIC;
  west NUMERIC;
BEGIN
  north := (bounds->>'north')::NUMERIC;
  south := (bounds->>'south')::NUMERIC;
  east := (bounds->>'east')::NUMERIC;
  west := (bounds->>'west')::NUMERIC;
  
  RETURN ST_SetSRID(
    ST_MakeEnvelope(west, south, east, north),
    4326
  );
END;
$$;

-- Function to create circle geometry from center and radius
CREATE OR REPLACE FUNCTION public.circle_to_geometry(center_lat NUMERIC, center_lng NUMERIC, radius_meters NUMERIC)
RETURNS GEOMETRY
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Create a circle using ST_Buffer with geography for accurate meters
  RETURN ST_Transform(
    ST_Buffer(
      ST_Transform(
        ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326),
        3857  -- Web Mercator for meter calculations
      ),
      radius_meters
    ),
    4326  -- Convert back to WGS84
  );
END;
$$;

-- ==========================================
-- MAIN SPATIAL QUERY FUNCTIONS
-- ==========================================

-- Get properties filtered by user's search areas (optimized)
CREATE OR REPLACE FUNCTION public.get_properties_in_areas(
  p_user_id UUID,
  p_area_ids UUID[] DEFAULT NULL,
  p_include_excluded BOOLEAN DEFAULT false
)
RETURNS TABLE (
  property_id UUID,
  address VARCHAR(255),
  city VARCHAR(100),
  list_price DECIMAL(12,2),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  in_inclusion_area BOOLEAN,
  in_exclusion_area BOOLEAN,
  area_names TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH active_areas AS (
    SELECT 
      usa.id,
      usa.area_name,
      usa.geometry,
      usa.is_inclusion
    FROM public.user_search_areas usa
    WHERE usa.user_id = p_user_id
      AND usa.is_active = true
      AND (p_area_ids IS NULL OR usa.id = ANY(p_area_ids))
      AND usa.geometry IS NOT NULL
  ),
  property_areas AS (
    SELECT 
      p.id AS property_id,
      p.address,
      p.city,
      p.list_price,
      p.latitude,
      p.longitude,
      bool_or(aa.is_inclusion = true AND ST_Contains(aa.geometry, p.location)) AS in_inclusion,
      bool_or(aa.is_inclusion = false AND ST_Contains(aa.geometry, p.location)) AS in_exclusion,
      array_agg(
        CASE 
          WHEN ST_Contains(aa.geometry, p.location) THEN aa.area_name 
          ELSE NULL 
        END
      ) FILTER (WHERE ST_Contains(aa.geometry, p.location)) AS area_names_arr
    FROM public.properties p
    CROSS JOIN active_areas aa
    WHERE p.location IS NOT NULL
    GROUP BY p.id, p.address, p.city, p.list_price, p.latitude, p.longitude
  )
  SELECT 
    pa.property_id,
    pa.address,
    pa.city,
    pa.list_price,
    pa.latitude,
    pa.longitude,
    pa.in_inclusion,
    pa.in_exclusion,
    pa.area_names_arr
  FROM property_areas pa
  WHERE (
    -- Include properties that are in inclusion areas and not in exclusion areas
    (pa.in_inclusion = true AND (p_include_excluded = true OR pa.in_exclusion = false))
    -- Or include all if no areas are active
    OR NOT EXISTS (SELECT 1 FROM active_areas)
  );
END;
$$;

-- Count properties in a given geometry (for real-time drawing feedback)
CREATE OR REPLACE FUNCTION public.count_properties_in_geometry(
  p_geojson JSONB,
  p_exclude_area_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
  total_count INTEGER,
  included_count INTEGER,
  excluded_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_geometry GEOMETRY;
  v_user_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- Convert GeoJSON to geometry
  v_geometry := public.geojson_to_geometry(p_geojson);
  
  RETURN QUERY
  WITH counts AS (
    SELECT 
      COUNT(*) AS total,
      COUNT(*) FILTER (
        WHERE NOT EXISTS (
          SELECT 1 
          FROM public.user_search_areas usa
          WHERE usa.user_id = v_user_id
            AND usa.is_active = true
            AND usa.is_inclusion = false
            AND (p_exclude_area_ids IS NULL OR usa.id != ALL(p_exclude_area_ids))
            AND ST_Contains(usa.geometry, p.location)
        )
      ) AS not_excluded
    FROM public.properties p
    WHERE p.location IS NOT NULL
      AND ST_Contains(v_geometry, p.location)
  )
  SELECT 
    counts.total::INTEGER,
    counts.not_excluded::INTEGER,
    (counts.total - counts.not_excluded)::INTEGER
  FROM counts;
END;
$$;

-- Get all search areas for a user with property counts
CREATE OR REPLACE FUNCTION public.get_user_search_areas_with_counts(
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  area_name VARCHAR(255),
  area_type VARCHAR(50),
  is_active BOOLEAN,
  is_inclusion BOOLEAN,
  bounds JSONB,
  center_point JSONB,
  coordinates JSONB,
  color VARCHAR(7),
  opacity DECIMAL(3,2),
  property_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Use current user if not specified
  p_user_id := COALESCE(p_user_id, auth.uid());
  
  RETURN QUERY
  SELECT 
    usa.id,
    usa.area_name,
    usa.area_type,
    usa.is_active,
    usa.is_inclusion,
    usa.bounds,
    usa.center_point,
    usa.coordinates,
    usa.color,
    usa.opacity,
    (
      SELECT COUNT(*)::INTEGER
      FROM public.properties p
      WHERE p.location IS NOT NULL
        AND ST_Contains(usa.geometry, p.location)
    ) AS property_count,
    usa.created_at,
    usa.updated_at
  FROM public.user_search_areas usa
  WHERE usa.user_id = p_user_id
  ORDER BY usa.created_at DESC;
END;
$$;

-- Save or update a search area
CREATE OR REPLACE FUNCTION public.save_search_area(
  p_area_name VARCHAR(255),
  p_area_type VARCHAR(50),
  p_geojson JSONB,
  p_bounds JSONB,
  p_center_point JSONB DEFAULT NULL,
  p_is_inclusion BOOLEAN DEFAULT true,
  p_color VARCHAR(7) DEFAULT '#3B82F6',
  p_opacity DECIMAL(3,2) DEFAULT 0.3,
  p_area_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_geometry GEOMETRY;
  v_area_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Convert GeoJSON to geometry
  v_geometry := public.geojson_to_geometry(p_geojson);
  
  -- Insert or update
  IF p_area_id IS NULL THEN
    -- Insert new area
    INSERT INTO public.user_search_areas (
      user_id,
      area_name,
      area_type,
      geometry,
      bounds,
      center_point,
      coordinates,
      is_inclusion,
      color,
      opacity
    ) VALUES (
      v_user_id,
      p_area_name,
      p_area_type,
      v_geometry,
      p_bounds,
      p_center_point,
      p_geojson,
      p_is_inclusion,
      p_color,
      p_opacity
    )
    RETURNING id INTO v_area_id;
  ELSE
    -- Update existing area
    UPDATE public.user_search_areas
    SET 
      area_name = p_area_name,
      area_type = p_area_type,
      geometry = v_geometry,
      bounds = p_bounds,
      center_point = p_center_point,
      coordinates = p_geojson,
      is_inclusion = p_is_inclusion,
      color = p_color,
      opacity = p_opacity,
      updated_at = NOW()
    WHERE id = p_area_id AND user_id = v_user_id
    RETURNING id INTO v_area_id;
  END IF;
  
  -- Trigger cache update (async in production)
  PERFORM public.update_property_cache_for_area(v_area_id);
  
  RETURN v_area_id;
END;
$$;

-- Update property cache for a specific area
CREATE OR REPLACE FUNCTION public.update_property_cache_for_area(
  p_area_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_geometry GEOMETRY;
BEGIN
  -- Get area geometry
  SELECT geometry INTO v_geometry
  FROM public.user_search_areas
  WHERE id = p_area_id;
  
  IF v_geometry IS NULL THEN
    RETURN;
  END IF;
  
  -- Delete existing cache entries
  DELETE FROM public.property_area_cache
  WHERE search_area_id = p_area_id;
  
  -- Insert new cache entries
  INSERT INTO public.property_area_cache (
    property_id,
    search_area_id,
    is_inside,
    distance_meters
  )
  SELECT 
    p.id,
    p_area_id,
    ST_Contains(v_geometry, p.location),
    ST_Distance(
      v_geometry::geography,
      p.location::geography
    )
  FROM public.properties p
  WHERE p.location IS NOT NULL;
END;
$$;

-- Delete a search area
CREATE OR REPLACE FUNCTION public.delete_search_area(
  p_area_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_deleted INTEGER;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- Delete the area (RLS will ensure user owns it)
  DELETE FROM public.user_search_areas
  WHERE id = p_area_id AND user_id = v_user_id;
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  
  RETURN v_deleted > 0;
END;
$$;

-- Toggle area active status
CREATE OR REPLACE FUNCTION public.toggle_search_area_active(
  p_area_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_new_status BOOLEAN;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- Toggle the active status
  UPDATE public.user_search_areas
  SET is_active = NOT is_active
  WHERE id = p_area_id AND user_id = v_user_id
  RETURNING is_active INTO v_new_status;
  
  RETURN v_new_status;
END;
$$;

-- Get property details with area information
CREATE OR REPLACE FUNCTION public.get_property_with_areas(
  p_property_id UUID
)
RETURNS TABLE (
  property JSONB,
  search_areas JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  RETURN QUERY
  WITH property_data AS (
    SELECT to_jsonb(p.*) AS prop
    FROM public.properties p
    WHERE p.id = p_property_id
  ),
  area_data AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', usa.id,
        'name', usa.area_name,
        'type', usa.area_type,
        'is_inclusion', usa.is_inclusion,
        'contains_property', ST_Contains(usa.geometry, p.location)
      )
    ) AS areas
    FROM public.user_search_areas usa
    JOIN public.properties p ON p.id = p_property_id
    WHERE usa.user_id = v_user_id
      AND usa.is_active = true
      AND p.location IS NOT NULL
  )
  SELECT 
    pd.prop,
    COALESCE(ad.areas, '[]'::jsonb)
  FROM property_data pd
  CROSS JOIN area_data ad;
END;
$$;

-- ==========================================
-- FUNCTION PERMISSIONS
-- ==========================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.geojson_to_geometry TO authenticated;
GRANT EXECUTE ON FUNCTION public.bounds_to_geometry TO authenticated;
GRANT EXECUTE ON FUNCTION public.circle_to_geometry TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_properties_in_areas TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_properties_in_geometry TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_search_areas_with_counts TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_search_area TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_search_area TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_search_area_active TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_property_with_areas TO authenticated;

-- ==========================================
-- FUNCTION COMMENTS
-- ==========================================

COMMENT ON FUNCTION public.get_properties_in_areas IS 'Returns properties filtered by user search areas with inclusion/exclusion logic';
COMMENT ON FUNCTION public.count_properties_in_geometry IS 'Counts properties within a given geometry for real-time drawing feedback';
COMMENT ON FUNCTION public.save_search_area IS 'Saves or updates a user search area and updates the cache';
COMMENT ON FUNCTION public.get_user_search_areas_with_counts IS 'Returns all user search areas with property counts';