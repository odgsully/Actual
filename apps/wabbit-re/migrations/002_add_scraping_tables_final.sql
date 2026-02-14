-- Migration: Add tables for property scraping and notifications system
-- Run this after the initial database-schema.sql
-- FINAL VERSION - Compatible with existing schema

-- ==========================================
-- PROPERTY NOTIFICATIONS
-- ==========================================

CREATE TABLE IF NOT EXISTS public.property_notifications (
    id VARCHAR(255) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'new_match', 'price_drop', 'status_change', 'back_on_market'
    match_score INTEGER,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    viewed BOOLEAN DEFAULT false,
    viewed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes separately
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.property_notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_property ON public.property_notifications (property_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.property_notifications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_viewed ON public.property_notifications (viewed, user_id);

-- ==========================================
-- NOTIFICATION QUEUE (for digest emails)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.notification_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    notification_id VARCHAR(255) REFERENCES public.property_notifications(id) ON DELETE CASCADE,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE,
    error TEXT
);

CREATE INDEX IF NOT EXISTS idx_queue_scheduled ON public.notification_queue (scheduled_for, sent);
CREATE INDEX IF NOT EXISTS idx_queue_user ON public.notification_queue (user_id);

-- ==========================================
-- USER NOTIFICATION PREFERENCES
-- ==========================================

CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    email_enabled BOOLEAN DEFAULT true,
    email_frequency VARCHAR(20) DEFAULT 'instant', -- 'instant', 'daily', 'weekly'
    min_match_score INTEGER DEFAULT 70,
    max_notifications_per_day INTEGER DEFAULT 5,
    digest_time TIME DEFAULT '09:00:00',
    notification_types JSONB DEFAULT '["new_match", "price_drop"]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- SCRAPING METRICS
-- ==========================================

CREATE TABLE IF NOT EXISTS public.scraping_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source VARCHAR(50) NOT NULL, -- 'zillow', 'redfin', 'homes.com'
    job_type VARCHAR(50) NOT NULL, -- 'scheduled', 'on-demand', 'user-triggered'
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    properties_found INTEGER DEFAULT 0,
    properties_processed INTEGER DEFAULT 0,
    properties_saved INTEGER DEFAULT 0,
    errors INTEGER DEFAULT 0,
    error_details JSONB,
    duration_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_metrics_source ON public.scraping_metrics (source);
CREATE INDEX IF NOT EXISTS idx_metrics_created ON public.scraping_metrics (created_at DESC);

-- ==========================================
-- USER SCRAPING QUOTA
-- ==========================================

CREATE TABLE IF NOT EXISTS public.user_scraping_quota (
    user_id UUID PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    tier VARCHAR(20) DEFAULT 'free', -- 'free', 'premium', 'enterprise'
    hourly_limit INTEGER DEFAULT 10,
    daily_limit INTEGER DEFAULT 100,
    monthly_limit INTEGER DEFAULT 1000,
    hourly_used INTEGER DEFAULT 0,
    daily_used INTEGER DEFAULT 0,
    monthly_used INTEGER DEFAULT 0,
    last_reset_hourly TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_reset_daily TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_reset_monthly TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- PROPERTY SEARCH AREAS (User-drawn polygons)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.user_search_areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    name VARCHAR(255),
    polygon JSONB NOT NULL, -- GeoJSON polygon
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_areas_user ON public.user_search_areas (user_id, is_active);

-- ==========================================
-- PROPERTY PRICE HISTORY
-- ==========================================

CREATE TABLE IF NOT EXISTS public.property_price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    price DECIMAL(12,2) NOT NULL,
    source VARCHAR(50),
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_history_property ON public.property_price_history (property_id, recorded_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS unique_price_record ON public.property_price_history (property_id, price, recorded_at);

-- ==========================================
-- SCRAPING ERRORS LOG
-- ==========================================

CREATE TABLE IF NOT EXISTS public.scraping_errors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source VARCHAR(50) NOT NULL,
    url TEXT,
    error_type VARCHAR(50),
    error_message TEXT,
    error_stack TEXT,
    retryable BOOLEAN DEFAULT false,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_errors_source ON public.scraping_errors (source, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_errors_retryable ON public.scraping_errors (retryable, retry_count);

-- ==========================================
-- BLOCKED URLS (to avoid repeated failures)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.blocked_urls (
    url TEXT PRIMARY KEY,
    source VARCHAR(50),
    reason TEXT,
    blocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_blocked_expires ON public.blocked_urls (expires_at);

-- ==========================================
-- EXTEND EXISTING PROPERTY_IMAGES TABLE
-- Add columns if they don't exist (for scraping system)
-- ==========================================

-- Add storage_path column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'property_images' 
                   AND column_name = 'storage_path') THEN
        ALTER TABLE public.property_images 
        ADD COLUMN storage_path TEXT;
    END IF;
END $$;

-- Add width column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'property_images' 
                   AND column_name = 'width') THEN
        ALTER TABLE public.property_images 
        ADD COLUMN width INTEGER;
    END IF;
END $$;

-- Add height column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'property_images' 
                   AND column_name = 'height') THEN
        ALTER TABLE public.property_images 
        ADD COLUMN height INTEGER;
    END IF;
END $$;

-- Add size_bytes column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'property_images' 
                   AND column_name = 'size_bytes') THEN
        ALTER TABLE public.property_images 
        ADD COLUMN size_bytes INTEGER;
    END IF;
END $$;

-- Create indexes for property_images if they don't exist
CREATE INDEX IF NOT EXISTS idx_images_property ON public.property_images (property_id, display_order);

-- ==========================================
-- ADD SCRAPING FIELDS TO PROPERTIES TABLE
-- ==========================================

-- Add last_scraped_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'properties' 
                   AND column_name = 'last_scraped_at') THEN
        ALTER TABLE public.properties 
        ADD COLUMN last_scraped_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add scrape_count column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'properties' 
                   AND column_name = 'scrape_count') THEN
        ALTER TABLE public.properties 
        ADD COLUMN scrape_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add match_score column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'properties' 
                   AND column_name = 'match_score') THEN
        ALTER TABLE public.properties 
        ADD COLUMN match_score INTEGER;
    END IF;
END $$;

-- Create index for scraping queries
CREATE INDEX IF NOT EXISTS idx_properties_scraped ON public.properties (last_scraped_at);
CREATE INDEX IF NOT EXISTS idx_properties_match ON public.properties (match_score DESC) WHERE match_score IS NOT NULL;

-- ==========================================
-- FUNCTIONS
-- ==========================================

-- Function to check if a property is within a user's search areas
CREATE OR REPLACE FUNCTION check_property_in_search_area(
    p_property_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    property_lat DECIMAL;
    property_lng DECIMAL;
    search_area RECORD;
BEGIN
    -- Get property coordinates
    SELECT latitude, longitude INTO property_lat, property_lng
    FROM public.properties
    WHERE id = p_property_id;
    
    IF property_lat IS NULL OR property_lng IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check each active search area
    FOR search_area IN 
        SELECT polygon 
        FROM public.user_search_areas 
        WHERE user_id = p_user_id AND is_active = true
    LOOP
        -- This is a simplified check - in production, use PostGIS
        -- for proper point-in-polygon testing
        RETURN TRUE; -- Placeholder - implement actual polygon check
    END LOOP;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to update user quota usage
CREATE OR REPLACE FUNCTION update_user_quota(
    p_user_id UUID,
    p_count INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update hourly usage
    UPDATE public.user_scraping_quota
    SET 
        hourly_used = CASE 
            WHEN EXTRACT(EPOCH FROM (NOW() - last_reset_hourly)) / 3600 >= 1 
            THEN p_count 
            ELSE hourly_used + p_count 
        END,
        last_reset_hourly = CASE 
            WHEN EXTRACT(EPOCH FROM (NOW() - last_reset_hourly)) / 3600 >= 1 
            THEN NOW() 
            ELSE last_reset_hourly 
        END,
        -- Update daily usage
        daily_used = CASE 
            WHEN DATE(last_reset_daily) < DATE(NOW()) 
            THEN p_count 
            ELSE daily_used + p_count 
        END,
        last_reset_daily = CASE 
            WHEN DATE(last_reset_daily) < DATE(NOW()) 
            THEN NOW() 
            ELSE last_reset_daily 
        END,
        -- Update monthly usage
        monthly_used = CASE 
            WHEN DATE_TRUNC('month', last_reset_monthly) < DATE_TRUNC('month', NOW()) 
            THEN p_count 
            ELSE monthly_used + p_count 
        END,
        last_reset_monthly = CASE 
            WHEN DATE_TRUNC('month', last_reset_monthly) < DATE_TRUNC('month', NOW()) 
            THEN NOW() 
            ELSE last_reset_monthly 
        END,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has quota available
CREATE OR REPLACE FUNCTION check_user_quota(
    p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    quota RECORD;
BEGIN
    SELECT * INTO quota
    FROM public.user_scraping_quota
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        -- Create default quota for new user
        INSERT INTO public.user_scraping_quota (user_id)
        VALUES (p_user_id);
        RETURN TRUE;
    END IF;
    
    -- Check hourly limit
    IF EXTRACT(EPOCH FROM (NOW() - quota.last_reset_hourly)) / 3600 >= 1 THEN
        RETURN TRUE; -- Reset period has passed
    END IF;
    
    IF quota.hourly_used >= quota.hourly_limit THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- TRIGGERS
-- ==========================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_user_notification_preferences_updated_at
    BEFORE UPDATE ON public.user_notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_scraping_quota_updated_at
    BEFORE UPDATE ON public.user_scraping_quota
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_search_areas_updated_at
    BEFORE UPDATE ON public.user_search_areas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- INITIAL DATA
-- ==========================================

-- Create default notification preferences for existing users
INSERT INTO public.user_notification_preferences (user_id)
SELECT id FROM public.user_profiles
ON CONFLICT (user_id) DO NOTHING;

-- Create default scraping quota for existing users
INSERT INTO public.user_scraping_quota (user_id)
SELECT id FROM public.user_profiles
ON CONFLICT (user_id) DO NOTHING;

-- ==========================================
-- PERMISSIONS (Row Level Security)
-- ==========================================

-- Enable RLS on new tables
ALTER TABLE public.property_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_scraping_quota ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_search_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraping_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraping_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_urls ENABLE ROW LEVEL SECURITY;

-- Also enable RLS on existing property_images table if not already enabled
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;

-- Create policies for user-specific tables
CREATE POLICY "Users can view own notifications" 
    ON public.property_notifications FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notification status" 
    ON public.property_notifications FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own notification preferences" 
    ON public.user_notification_preferences FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences" 
    ON public.user_notification_preferences FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own quota" 
    ON public.user_scraping_quota FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own search areas" 
    ON public.user_search_areas FOR ALL 
    USING (auth.uid() = user_id);

-- Public read access for property-related tables
CREATE POLICY "Property images are public" 
    ON public.property_images FOR SELECT 
    USING (true);

CREATE POLICY "Price history is public" 
    ON public.property_price_history FOR SELECT 
    USING (true);

-- Service role access for system tables
CREATE POLICY "Service role can manage all notifications" 
    ON public.property_notifications FOR ALL 
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage notification queue" 
    ON public.notification_queue FOR ALL 
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage metrics" 
    ON public.scraping_metrics FOR ALL 
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage errors" 
    ON public.scraping_errors FOR ALL 
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage blocked URLs" 
    ON public.blocked_urls FOR ALL 
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage property images" 
    ON public.property_images FOR ALL 
    USING (auth.role() = 'service_role');

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================
-- Run these after migration to verify everything was created:

-- Check all tables exist:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN (
--     'property_notifications', 'notification_queue', 
--     'user_notification_preferences', 'scraping_metrics',
--     'user_scraping_quota', 'user_search_areas',
--     'property_price_history', 'scraping_errors',
--     'blocked_urls'
-- );

-- Check new columns were added to properties table:
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name = 'properties' 
-- AND column_name IN ('last_scraped_at', 'scrape_count', 'match_score');

-- ==========================================
-- MIGRATION COMPLETE!
-- ==========================================
-- All scraping-related tables have been created
-- The existing property_images table has been extended
-- The properties table has been extended with scraping fields
-- All indexes and RLS policies are in place