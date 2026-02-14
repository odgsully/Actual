-- Migration: Add temporary preferences and email verification support
-- Run this after the main database-schema.sql

-- ==========================================
-- TEMPORARY PREFERENCES TABLE
-- ==========================================

-- Temporary storage for preferences before email verification
CREATE TABLE IF NOT EXISTS public.temporary_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    verification_token VARCHAR(255) UNIQUE NOT NULL,
    
    -- All preference fields (same as buyer_preferences)
    property_type VARCHAR(50),
    min_square_footage INTEGER,
    min_lot_square_footage INTEGER,
    price_range_min DECIMAL(12,2),
    price_range_max DECIMAL(12,2),
    commute_address_1 TEXT,
    commute_max_minutes_1 INTEGER,
    commute_address_2 TEXT,
    commute_max_minutes_2 INTEGER,
    commute_address_3 TEXT,
    commute_max_minutes_3 INTEGER,
    bedrooms_needed INTEGER,
    bathrooms_needed DECIMAL(3,1),
    city_preferences TEXT[],
    preferred_zip_codes TEXT[],
    home_style VARCHAR(20),
    pool_preference VARCHAR(20),
    min_garage_spaces INTEGER,
    hoa_preference VARCHAR(20),
    renovation_openness INTEGER,
    current_residence_address TEXT,
    current_residence_works_well TEXT,
    current_residence_doesnt_work TEXT,
    
    -- Additional fields for account creation
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    privacy_accepted BOOLEAN DEFAULT false,
    marketing_opt_in BOOLEAN DEFAULT false,
    
    -- Metadata
    form_data JSONB, -- Store complete form data as JSON
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Index for cleanup
    INDEX idx_temp_prefs_expires ON temporary_preferences(expires_at)
);

-- ==========================================
-- UPDATE USER PROFILES TABLE
-- ==========================================

-- Add email verification fields to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS verification_sent_at TIMESTAMP WITH TIME ZONE;

-- Create index for verification tokens
CREATE INDEX IF NOT EXISTS idx_user_profiles_verification_token 
ON public.user_profiles(verification_token) 
WHERE verification_token IS NOT NULL;

-- ==========================================
-- CLEANUP FUNCTION
-- ==========================================

-- Function to clean up expired temporary preferences
CREATE OR REPLACE FUNCTION cleanup_expired_temp_preferences()
RETURNS void AS $$
BEGIN
    DELETE FROM public.temporary_preferences
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- VERIFICATION TOKEN GENERATION
-- ==========================================

-- Function to generate unique verification token
CREATE OR REPLACE FUNCTION generate_verification_token()
RETURNS TEXT AS $$
DECLARE
    token TEXT;
    exists BOOLEAN;
BEGIN
    LOOP
        -- Generate a random token (URL-safe base64)
        token := encode(gen_random_bytes(32), 'base64');
        token := replace(token, '+', '-');
        token := replace(token, '/', '_');
        token := replace(token, '=', '');
        
        -- Check if token already exists
        SELECT EXISTS(
            SELECT 1 FROM public.temporary_preferences WHERE verification_token = token
            UNION
            SELECT 1 FROM public.user_profiles WHERE verification_token = token
        ) INTO exists;
        
        EXIT WHEN NOT exists;
    END LOOP;
    RETURN token;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- TRANSFER PREFERENCES FUNCTION
-- ==========================================

-- Function to transfer preferences from temporary to permanent
CREATE OR REPLACE FUNCTION transfer_temp_preferences_to_user(
    p_verification_token TEXT,
    p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    temp_pref public.temporary_preferences%ROWTYPE;
BEGIN
    -- Get temporary preferences
    SELECT * INTO temp_pref 
    FROM public.temporary_preferences 
    WHERE verification_token = p_verification_token
    AND expires_at > NOW();
    
    IF temp_pref.id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Insert or update buyer preferences
    INSERT INTO public.buyer_preferences (
        user_id,
        property_type,
        min_square_footage,
        min_lot_square_footage,
        price_range_min,
        price_range_max,
        commute_address_1,
        commute_max_minutes_1,
        commute_address_2,
        commute_max_minutes_2,
        commute_address_3,
        commute_max_minutes_3,
        bedrooms_needed,
        bathrooms_needed,
        city_preferences,
        preferred_zip_codes,
        home_style,
        pool_preference,
        min_garage_spaces,
        hoa_preference,
        renovation_openness,
        current_residence_address,
        current_residence_works_well,
        current_residence_doesnt_work,
        completed_at
    ) VALUES (
        p_user_id,
        temp_pref.property_type,
        temp_pref.min_square_footage,
        temp_pref.min_lot_square_footage,
        temp_pref.price_range_min,
        temp_pref.price_range_max,
        temp_pref.commute_address_1,
        temp_pref.commute_max_minutes_1,
        temp_pref.commute_address_2,
        temp_pref.commute_max_minutes_2,
        temp_pref.commute_address_3,
        temp_pref.commute_max_minutes_3,
        temp_pref.bedrooms_needed,
        temp_pref.bathrooms_needed,
        temp_pref.city_preferences,
        temp_pref.preferred_zip_codes,
        temp_pref.home_style,
        temp_pref.pool_preference,
        temp_pref.min_garage_spaces,
        temp_pref.hoa_preference,
        temp_pref.renovation_openness,
        temp_pref.current_residence_address,
        temp_pref.current_residence_works_well,
        temp_pref.current_residence_doesnt_work,
        NOW()
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
        property_type = EXCLUDED.property_type,
        min_square_footage = EXCLUDED.min_square_footage,
        min_lot_square_footage = EXCLUDED.min_lot_square_footage,
        price_range_min = EXCLUDED.price_range_min,
        price_range_max = EXCLUDED.price_range_max,
        commute_address_1 = EXCLUDED.commute_address_1,
        commute_max_minutes_1 = EXCLUDED.commute_max_minutes_1,
        commute_address_2 = EXCLUDED.commute_address_2,
        commute_max_minutes_2 = EXCLUDED.commute_max_minutes_2,
        commute_address_3 = EXCLUDED.commute_address_3,
        commute_max_minutes_3 = EXCLUDED.commute_max_minutes_3,
        bedrooms_needed = EXCLUDED.bedrooms_needed,
        bathrooms_needed = EXCLUDED.bathrooms_needed,
        city_preferences = EXCLUDED.city_preferences,
        preferred_zip_codes = EXCLUDED.preferred_zip_codes,
        home_style = EXCLUDED.home_style,
        pool_preference = EXCLUDED.pool_preference,
        min_garage_spaces = EXCLUDED.min_garage_spaces,
        hoa_preference = EXCLUDED.hoa_preference,
        renovation_openness = EXCLUDED.renovation_openness,
        current_residence_address = EXCLUDED.current_residence_address,
        current_residence_works_well = EXCLUDED.current_residence_works_well,
        current_residence_doesnt_work = EXCLUDED.current_residence_doesnt_work,
        updated_at = NOW();
    
    -- Delete temporary preferences
    DELETE FROM public.temporary_preferences 
    WHERE verification_token = p_verification_token;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- RLS POLICIES
-- ==========================================

-- Enable RLS on temporary_preferences
ALTER TABLE public.temporary_preferences ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (for form submission)
CREATE POLICY "Anyone can insert temp preferences" ON public.temporary_preferences
    FOR INSERT WITH CHECK (true);

-- Only service role can read/delete (for verification)
CREATE POLICY "Service role can manage temp preferences" ON public.temporary_preferences
    FOR ALL USING (auth.role() = 'service_role');