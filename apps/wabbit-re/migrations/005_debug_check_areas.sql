-- ==========================================
-- Debug: Check Search Areas Data
-- Date: 2025-09-08
-- Description: Diagnostic query to check what data exists in search areas
-- ==========================================

-- Check what's actually in the database
SELECT 
  id,
  area_name,
  area_type,
  is_active,
  -- Check if fields are populated
  CASE WHEN bounds IS NULL THEN 'NULL' ELSE 'EXISTS' END as bounds_status,
  CASE WHEN coordinates IS NULL THEN 'NULL' ELSE 'EXISTS' END as coordinates_status,
  CASE WHEN center_point IS NULL THEN 'NULL' ELSE 'EXISTS' END as center_status,
  CASE WHEN geometry IS NULL THEN 'NULL' ELSE 'EXISTS' END as geometry_status,
  -- Show actual values for debugging
  bounds,
  coordinates::text as coordinates_text,  -- Cast to text to see full value
  center_point,
  created_at
FROM public.user_search_areas
ORDER BY created_at DESC;

-- Check if PostGIS functions are available
SELECT 
  proname as function_name
FROM pg_proc 
WHERE proname IN ('st_asgeojson', 'st_xmax', 'st_ymax', 'st_xmin', 'st_ymin')
ORDER BY proname;

-- Test the updated RPC function with your user ID
-- Replace 'YOUR_USER_ID' with an actual user ID from your system
-- You can get this from: SELECT id FROM auth.users LIMIT 1;
/*
SELECT * FROM public.get_user_search_areas_with_counts(
  p_user_id := 'YOUR_USER_ID_HERE'::UUID
);
*/