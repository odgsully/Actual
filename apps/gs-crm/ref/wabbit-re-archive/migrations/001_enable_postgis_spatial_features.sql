-- ==========================================
-- Migration: Enable PostGIS and Spatial Features
-- Date: 2025-09-06
-- Description: Adds PostGIS extension and spatial search capabilities
-- ==========================================

-- Enable PostGIS extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- ==========================================
-- USER SEARCH AREAS TABLE
-- ==========================================

-- Table for storing user-drawn search areas on the map
CREATE TABLE IF NOT EXISTS public.user_search_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  
  -- Core fields
  area_name VARCHAR(255) NOT NULL,
  area_type VARCHAR(50) NOT NULL CHECK (area_type IN ('rectangle', 'polygon', 'circle')),
  is_active BOOLEAN DEFAULT true,
  is_inclusion BOOLEAN DEFAULT true, -- true = include properties, false = exclude properties
  
  -- Spatial data (dual storage for flexibility and performance)
  geometry GEOMETRY(GEOMETRY, 4326), -- PostGIS geometry for spatial queries
  bounds JSONB, -- Quick access bounds: {north, south, east, west}
  center_point JSONB, -- For circles: {lat, lng, radius_meters}
  coordinates JSONB, -- Original coordinates array for reconstruction
  
  -- Display settings
  color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color for map display
  opacity DECIMAL(3,2) DEFAULT 0.3 CHECK (opacity >= 0 AND opacity <= 1),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create spatial index for ultra-fast geometric queries
CREATE INDEX IF NOT EXISTS idx_search_areas_geometry 
  ON public.user_search_areas USING GIST(geometry);

-- Create index for user queries
CREATE INDEX IF NOT EXISTS idx_search_areas_user 
  ON public.user_search_areas(user_id);

-- Create index for active areas
CREATE INDEX IF NOT EXISTS idx_search_areas_active 
  ON public.user_search_areas(user_id, is_active) 
  WHERE is_active = true;

-- ==========================================
-- PROPERTY AREA CACHE TABLE
-- ==========================================

-- Cache table for storing pre-computed spatial relationships
CREATE TABLE IF NOT EXISTS public.property_area_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  search_area_id UUID NOT NULL REFERENCES public.user_search_areas(id) ON DELETE CASCADE,
  is_inside BOOLEAN NOT NULL,
  distance_meters DECIMAL(10,2),
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_property_area UNIQUE(property_id, search_area_id)
);

-- Indexes for efficient cache queries
CREATE INDEX IF NOT EXISTS idx_cache_property 
  ON public.property_area_cache(property_id);

CREATE INDEX IF NOT EXISTS idx_cache_area 
  ON public.property_area_cache(search_area_id);

CREATE INDEX IF NOT EXISTS idx_cache_inside 
  ON public.property_area_cache(search_area_id, is_inside) 
  WHERE is_inside = true;

-- ==========================================
-- ADD SPATIAL COLUMN TO PROPERTIES TABLE
-- ==========================================

-- Add PostGIS point geometry to existing properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS location GEOMETRY(POINT, 4326);

-- Populate location from existing latitude/longitude columns
UPDATE public.properties 
SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
WHERE latitude IS NOT NULL 
  AND longitude IS NOT NULL 
  AND location IS NULL;

-- Create spatial index on property locations for fast queries
CREATE INDEX IF NOT EXISTS idx_properties_location 
  ON public.properties USING GIST(location);

-- ==========================================
-- ROW LEVEL SECURITY POLICIES
-- ==========================================

-- Enable RLS on new tables
ALTER TABLE public.user_search_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_area_cache ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Users can view own search areas" ON public.user_search_areas;
DROP POLICY IF EXISTS "Users can insert own search areas" ON public.user_search_areas;
DROP POLICY IF EXISTS "Users can update own search areas" ON public.user_search_areas;
DROP POLICY IF EXISTS "Users can delete own search areas" ON public.user_search_areas;
DROP POLICY IF EXISTS "Users can view own cache" ON public.property_area_cache;

-- Policies for user_search_areas
CREATE POLICY "Users can view own search areas" 
  ON public.user_search_areas
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own search areas" 
  ON public.user_search_areas
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own search areas" 
  ON public.user_search_areas
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own search areas" 
  ON public.user_search_areas
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Policies for property_area_cache (read-only for users)
CREATE POLICY "Users can view own cache" 
  ON public.property_area_cache
  FOR SELECT 
  USING (
    search_area_id IN (
      SELECT id FROM public.user_search_areas WHERE user_id = auth.uid()
    )
  );

-- ==========================================
-- TRIGGER FOR UPDATING TIMESTAMPS
-- ==========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_search_areas
DROP TRIGGER IF EXISTS update_user_search_areas_updated_at ON public.user_search_areas;
CREATE TRIGGER update_user_search_areas_updated_at
  BEFORE UPDATE ON public.user_search_areas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- COMMENTS FOR DOCUMENTATION
-- ==========================================

COMMENT ON TABLE public.user_search_areas IS 'Stores user-drawn search areas for spatial property filtering';
COMMENT ON TABLE public.property_area_cache IS 'Caches spatial relationships between properties and search areas for performance';
COMMENT ON COLUMN public.user_search_areas.geometry IS 'PostGIS geometry representation of the drawn area';
COMMENT ON COLUMN public.user_search_areas.bounds IS 'Bounding box for quick filtering before spatial operations';
COMMENT ON COLUMN public.user_search_areas.is_inclusion IS 'Whether to include (true) or exclude (false) properties in this area';
COMMENT ON COLUMN public.properties.location IS 'PostGIS point geometry for spatial queries';