-- ==========================================
-- Migration: Populate Missing Coordinates from Geometry
-- Date: 2025-09-08
-- Description: Converts PostGIS geometry to GeoJSON coordinates for areas
--              that were saved without the coordinates/bounds fields
-- ==========================================

-- First, let's check if there are any areas with missing coordinates
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM public.user_search_areas
  WHERE geometry IS NOT NULL 
    AND (coordinates IS NULL OR bounds IS NULL);
    
  IF missing_count > 0 THEN
    RAISE NOTICE 'Found % areas with missing coordinates/bounds. Fixing...', missing_count;
  ELSE
    RAISE NOTICE 'All areas have coordinates/bounds populated.';
  END IF;
END $$;

-- Update rectangles with missing bounds or coordinates
UPDATE public.user_search_areas
SET 
  bounds = CASE 
    WHEN bounds IS NULL AND geometry IS NOT NULL THEN
      jsonb_build_object(
        'north', ST_YMax(geometry),
        'south', ST_YMin(geometry),
        'east', ST_XMax(geometry),
        'west', ST_XMin(geometry)
      )
    ELSE bounds
  END,
  coordinates = CASE
    WHEN coordinates IS NULL AND geometry IS NOT NULL THEN
      ST_AsGeoJSON(geometry)::jsonb
    ELSE coordinates
  END
WHERE geometry IS NOT NULL 
  AND (coordinates IS NULL OR bounds IS NULL);

-- For circles, ensure center_point is populated if missing
UPDATE public.user_search_areas
SET center_point = jsonb_build_object(
  'lat', ST_Y(ST_Centroid(geometry)),
  'lng', ST_X(ST_Centroid(geometry)),
  'radius_meters', 1000  -- Default radius, adjust as needed
)
WHERE area_type = 'circle' 
  AND geometry IS NOT NULL 
  AND center_point IS NULL;

-- Verify the fix
DO $$
DECLARE
  still_missing INTEGER;
BEGIN
  SELECT COUNT(*) INTO still_missing
  FROM public.user_search_areas
  WHERE geometry IS NOT NULL 
    AND (coordinates IS NULL OR bounds IS NULL);
    
  IF still_missing = 0 THEN
    RAISE NOTICE 'Success! All areas now have coordinates and bounds populated.';
  ELSE
    RAISE WARNING 'Still have % areas with missing data.', still_missing;
  END IF;
END $$;

-- Also update the RPC function to handle legacy data by converting geometry on the fly
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
    -- Fallback to calculating bounds from geometry if null
    COALESCE(
      usa.bounds,
      CASE 
        WHEN usa.geometry IS NOT NULL THEN
          jsonb_build_object(
            'north', ST_YMax(usa.geometry),
            'south', ST_YMin(usa.geometry),
            'east', ST_XMax(usa.geometry),
            'west', ST_XMin(usa.geometry)
          )
        ELSE NULL
      END
    ) as bounds,
    -- Fallback for center_point
    COALESCE(
      usa.center_point,
      CASE 
        WHEN usa.area_type = 'circle' AND usa.geometry IS NOT NULL THEN
          jsonb_build_object(
            'lat', ST_Y(ST_Centroid(usa.geometry)),
            'lng', ST_X(ST_Centroid(usa.geometry)),
            'radius_meters', 1000
          )
        ELSE NULL
      END
    ) as center_point,
    -- Fallback to converting geometry to GeoJSON if coordinates is null
    COALESCE(
      usa.coordinates,
      CASE 
        WHEN usa.geometry IS NOT NULL THEN
          ST_AsGeoJSON(usa.geometry)::jsonb
        ELSE NULL
      END
    ) as coordinates,
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_search_areas_with_counts TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.get_user_search_areas_with_counts IS 
  'Returns user search areas with automatic fallback to convert PostGIS geometry to GeoJSON if needed';