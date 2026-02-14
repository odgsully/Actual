-- ==========================================
-- Migration: Fix Search Areas Display on Map
-- Date: 2025-09-08
-- Description: Updates RPC function to include coordinates and center_point
--              fields needed for rendering areas on the map
-- ==========================================

-- Drop existing function first (required when changing return type)
DROP FUNCTION IF EXISTS public.get_user_search_areas_with_counts(UUID);

-- Recreate the function with the missing fields
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
  center_point JSONB,        -- Added: needed for circles
  coordinates JSONB,          -- Added: needed for polygons
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
    usa.center_point,         -- Added to SELECT
    usa.coordinates,           -- Added to SELECT
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

-- Ensure permissions are set
GRANT EXECUTE ON FUNCTION public.get_user_search_areas_with_counts TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.get_user_search_areas_with_counts IS 
  'Returns all user search areas with property counts and complete geometry data for map rendering';