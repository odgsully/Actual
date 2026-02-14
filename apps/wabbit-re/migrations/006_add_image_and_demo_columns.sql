-- Migration: Add missing columns for image storage and demo properties
-- Date: January 2025

-- Add missing columns to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS primary_image_url TEXT,
ADD COLUMN IF NOT EXISTS primary_image_stored BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_scraped_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS county VARCHAR(100) DEFAULT 'Maricopa';

-- Add index for demo properties
CREATE INDEX IF NOT EXISTS idx_properties_demo ON public.properties (is_demo) WHERE is_demo = true;

-- Add index for last scraped to find stale properties
CREATE INDEX IF NOT EXISTS idx_properties_last_scraped ON public.properties (last_scraped_at);

-- Add index for active properties
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties (status) WHERE status = 'active';

-- Update existing properties to set county if null
UPDATE public.properties 
SET county = 'Maricopa' 
WHERE county IS NULL AND state = 'AZ';

-- Create or replace function to get demo properties for demo user
CREATE OR REPLACE FUNCTION get_demo_properties()
RETURNS SETOF public.properties AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public.properties
    WHERE is_demo = true
    AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 8;
END;
$$ LANGUAGE plpgsql;

-- Comment on new columns
COMMENT ON COLUMN public.properties.primary_image_url IS 'URL of the primary/hero image for the property';
COMMENT ON COLUMN public.properties.primary_image_stored IS 'Whether the primary image has been downloaded and stored in Supabase Storage';
COMMENT ON COLUMN public.properties.last_scraped_at IS 'Timestamp of the last successful scrape for this property';
COMMENT ON COLUMN public.properties.is_demo IS 'Whether this property is part of the demo dataset';
COMMENT ON COLUMN public.properties.county IS 'County where the property is located';