-- Migration: Add tables for property scraping and notifications system
-- Run this after the initial database-schema.sql

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
    viewed_at TIMESTAMP WITH TIME ZONE,
    
    INDEX idx_notifications_user (user_id),
    INDEX idx_notifications_property (property_id),
    INDEX idx_notifications_created (created_at DESC),
    INDEX idx_notifications_viewed (viewed, user_id)
);

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
    error TEXT,
    
    INDEX idx_queue_scheduled (scheduled_for, sent),
    INDEX idx_queue_user (user_id)
);

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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_metrics_source (source),
    INDEX idx_metrics_created (created_at DESC)
);

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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_search_areas_user (user_id, is_active)
);

-- ==========================================
-- PROPERTY PRICE HISTORY
-- ==========================================

CREATE TABLE IF NOT EXISTS public.property_price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    price DECIMAL(12,2) NOT NULL,
    source VARCHAR(50),
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_price_history_property (property_id, recorded_at DESC),
    UNIQUE KEY unique_price_record (property_id, price, recorded_at)
);

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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_errors_source (source, created_at DESC),
    INDEX idx_errors_retryable (retryable, retry_count)
);

-- ==========================================
-- BLOCKED URLS (to avoid repeated failures)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.blocked_urls (
    url TEXT PRIMARY KEY,
    source VARCHAR(50),
    reason TEXT,
    blocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    INDEX idx_blocked_expires (expires_at)
);

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
        RETURN TRUE; -- Placeholder
    END LOOP;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to reset user quotas
CREATE OR REPLACE FUNCTION reset_user_quotas()
RETURNS void AS $$
BEGIN
    -- Reset hourly quotas
    UPDATE public.user_scraping_quota
    SET hourly_used = 0,
        last_reset_hourly = NOW()
    WHERE last_reset_hourly < NOW() - INTERVAL '1 hour';
    
    -- Reset daily quotas
    UPDATE public.user_scraping_quota
    SET daily_used = 0,
        last_reset_daily = NOW()
    WHERE last_reset_daily < NOW() - INTERVAL '1 day';
    
    -- Reset monthly quotas
    UPDATE public.user_scraping_quota
    SET monthly_used = 0,
        last_reset_monthly = NOW()
    WHERE last_reset_monthly < NOW() - INTERVAL '1 month';
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- TRIGGERS
-- ==========================================

-- Update timestamp trigger for new tables
CREATE TRIGGER update_user_notification_preferences_updated_at
    BEFORE UPDATE ON public.user_notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_scraping_quota_updated_at
    BEFORE UPDATE ON public.user_scraping_quota
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_search_areas_updated_at
    BEFORE UPDATE ON public.user_search_areas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

-- Enable RLS on new tables
ALTER TABLE public.property_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_scraping_quota ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_search_areas ENABLE ROW LEVEL SECURITY;

-- Policies for property_notifications
CREATE POLICY "Users can view own notifications" ON public.property_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.property_notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Policies for notification_queue
CREATE POLICY "Users can view own queue" ON public.notification_queue
    FOR SELECT USING (auth.uid() = user_id);

-- Policies for user_notification_preferences
CREATE POLICY "Users can view own preferences" ON public.user_notification_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.user_notification_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Policies for user_scraping_quota
CREATE POLICY "Users can view own quota" ON public.user_scraping_quota
    FOR SELECT USING (auth.uid() = user_id);

-- Policies for user_search_areas
CREATE POLICY "Users can manage own search areas" ON public.user_search_areas
    FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================

-- Additional indexes for scraping operations
CREATE INDEX IF NOT EXISTS idx_properties_last_scraped ON public.properties(last_scraped_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_properties_data_source ON public.properties(data_source);
CREATE INDEX IF NOT EXISTS idx_properties_primary_image ON public.properties(primary_image_stored);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_properties_search ON public.properties(
    status, city, list_price, bedrooms, bathrooms
) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_user_properties_composite ON public.user_properties(
    user_id, is_favorite, added_at DESC
);

-- ==========================================
-- SEED DEFAULT DATA
-- ==========================================

-- Insert default notification preferences for existing users
INSERT INTO public.user_notification_preferences (user_id)
SELECT id FROM public.user_profiles
ON CONFLICT (user_id) DO NOTHING;

-- Insert default scraping quota for existing users
INSERT INTO public.user_scraping_quota (user_id)
SELECT id FROM public.user_profiles
ON CONFLICT (user_id) DO NOTHING;