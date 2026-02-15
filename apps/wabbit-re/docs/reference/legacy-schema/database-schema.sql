-- Wabbit Real Estate Platform Database Schema
-- PostgreSQL / Supabase Implementation

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- USERS & AUTHENTICATION
-- ==========================================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    privacy_accepted BOOLEAN NOT NULL DEFAULT false,
    marketing_opt_in BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- BUYER PREFERENCES
-- ==========================================

-- Buyer preferences from form submissions
CREATE TABLE public.buyer_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    
    -- Property Type (Page 1)
    property_type VARCHAR(50),
    
    -- Size Requirements (Page 2)
    min_square_footage INTEGER,
    min_lot_square_footage INTEGER,
    price_range_min DECIMAL(12,2),
    price_range_max DECIMAL(12,2),
    
    -- Commute Preferences (Page 3)
    commute_address_1 TEXT,
    commute_max_minutes_1 INTEGER,
    commute_address_2 TEXT,
    commute_max_minutes_2 INTEGER,
    commute_address_3 TEXT,
    commute_max_minutes_3 INTEGER,
    
    -- Room Requirements (Page 4)
    bedrooms_needed INTEGER,
    bathrooms_needed DECIMAL(3,1),
    
    -- Location Preferences (Page 5)
    city_preferences TEXT[], -- Array of cities
    preferred_zip_codes TEXT[], -- Array of zip codes
    
    -- Home Features (Page 6)
    home_style VARCHAR(20), -- 'single-story' or 'multi-level'
    pool_preference VARCHAR(20), -- 'yes', 'no', 'neutral'
    min_garage_spaces INTEGER,
    hoa_preference VARCHAR(20), -- 'need', 'want', 'neutral', 'dont_need', 'dont_want'
    renovation_openness INTEGER, -- Scale 1-5
    
    -- Current Residence Feedback (Page 7)
    current_residence_address TEXT,
    current_residence_works_well TEXT,
    current_residence_doesnt_work TEXT,
    
    -- Metadata
    form_version INTEGER DEFAULT 1,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_user_preferences UNIQUE(user_id)
);

-- ==========================================
-- PROPERTIES
-- ==========================================

-- Properties from MLS data
CREATE TABLE public.properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mls_number VARCHAR(50) UNIQUE,
    
    -- Basic Information
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(2) DEFAULT 'AZ',
    zip_code VARCHAR(10),
    
    -- Property Details
    list_price DECIMAL(12,2),
    bedrooms INTEGER,
    bathrooms DECIMAL(3,1),
    square_footage INTEGER,
    lot_size INTEGER,
    year_built INTEGER,
    renovation_year INTEGER,
    
    -- Additional Details
    property_type VARCHAR(50),
    home_style VARCHAR(50),
    has_pool BOOLEAN,
    garage_spaces INTEGER,
    has_hoa BOOLEAN,
    hoa_fee DECIMAL(10,2),
    
    -- School Information
    elementary_school VARCHAR(100),
    middle_school VARCHAR(100),
    high_school VARCHAR(100),
    school_district VARCHAR(100),
    
    -- Location Data
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    jurisdiction VARCHAR(100),
    
    -- MLS Data
    listing_date DATE,
    status VARCHAR(50), -- 'active', 'pending', 'sold', etc.
    days_on_market INTEGER,
    
    -- Metadata
    data_source VARCHAR(50), -- 'mls', 'zillow', 'redfin', 'homes.com'
    external_url TEXT,
    raw_data JSONB, -- Store complete MLS record
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- PROPERTY IMAGES
-- ==========================================

CREATE TABLE public.property_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_type VARCHAR(50), -- 'primary', 'interior', 'exterior', 'floorplan'
    display_order INTEGER DEFAULT 0,
    caption TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- USER PROPERTY ASSOCIATIONS
-- ==========================================

-- Links users to properties (from their MLS lists, favorites, etc.)
CREATE TABLE public.user_properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    source VARCHAR(50), -- 'mls_list', 'zillow', 'redfin', 'homes.com', 'manual'
    is_favorite BOOLEAN DEFAULT false,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_user_property UNIQUE(user_id, property_id)
);

-- ==========================================
-- RANKINGS
-- ==========================================

CREATE TABLE public.rankings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    
    -- 4 Key Ranking Metrics (1-10 scale)
    price_value_score INTEGER CHECK (price_value_score >= 1 AND price_value_score <= 10),
    location_score INTEGER CHECK (location_score >= 1 AND location_score <= 10),
    layout_score INTEGER CHECK (layout_score >= 1 AND layout_score <= 10),
    turnkey_score INTEGER CHECK (turnkey_score >= 1 AND turnkey_score <= 10),
    
    -- Calculated Fields
    overall_score DECIMAL(3,1) GENERATED ALWAYS AS (
        (price_value_score + location_score + layout_score + turnkey_score)::DECIMAL / 4
    ) STORED,
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_user_property_ranking UNIQUE(user_id, property_id)
);

-- ==========================================
-- MULTI-USER COLLABORATION
-- ==========================================

-- Shared accounts for collaborative decision making
CREATE TABLE public.shared_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    primary_user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    secondary_user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    invitation_code VARCHAR(20) UNIQUE,
    invitation_email VARCHAR(255),
    invitation_phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collaborative rankings view
CREATE OR REPLACE VIEW public.collaborative_rankings AS
SELECT 
    p.id as property_id,
    p.address,
    p.list_price,
    sa.id as shared_account_id,
    
    -- Primary user rankings
    r1.price_value_score as user1_price_value,
    r1.location_score as user1_location,
    r1.layout_score as user1_layout,
    r1.turnkey_score as user1_turnkey,
    
    -- Secondary user rankings
    r2.price_value_score as user2_price_value,
    r2.location_score as user2_location,
    r2.layout_score as user2_layout,
    r2.turnkey_score as user2_turnkey,
    
    -- Average scores
    (COALESCE(r1.price_value_score, 0) + COALESCE(r2.price_value_score, 0))::DECIMAL / 
        NULLIF(CASE WHEN r1.price_value_score IS NOT NULL THEN 1 ELSE 0 END + 
               CASE WHEN r2.price_value_score IS NOT NULL THEN 1 ELSE 0 END, 0) as avg_price_value,
    
    (COALESCE(r1.location_score, 0) + COALESCE(r2.location_score, 0))::DECIMAL / 
        NULLIF(CASE WHEN r1.location_score IS NOT NULL THEN 1 ELSE 0 END + 
               CASE WHEN r2.location_score IS NOT NULL THEN 1 ELSE 0 END, 0) as avg_location,
    
    (COALESCE(r1.layout_score, 0) + COALESCE(r2.layout_score, 0))::DECIMAL / 
        NULLIF(CASE WHEN r1.layout_score IS NOT NULL THEN 1 ELSE 0 END + 
               CASE WHEN r2.layout_score IS NOT NULL THEN 1 ELSE 0 END, 0) as avg_layout,
    
    (COALESCE(r1.turnkey_score, 0) + COALESCE(r2.turnkey_score, 0))::DECIMAL / 
        NULLIF(CASE WHEN r1.turnkey_score IS NOT NULL THEN 1 ELSE 0 END + 
               CASE WHEN r2.turnkey_score IS NOT NULL THEN 1 ELSE 0 END, 0) as avg_turnkey,
    
    -- Vote count
    CASE WHEN r1.id IS NOT NULL THEN 1 ELSE 0 END + 
    CASE WHEN r2.id IS NOT NULL THEN 1 ELSE 0 END as vote_count
    
FROM public.shared_accounts sa
CROSS JOIN public.properties p
LEFT JOIN public.rankings r1 ON r1.user_id = sa.primary_user_id AND r1.property_id = p.id
LEFT JOIN public.rankings r2 ON r2.user_id = sa.secondary_user_id AND r2.property_id = p.id
WHERE sa.status = 'accepted'
  AND (r1.id IS NOT NULL OR r2.id IS NOT NULL);

-- ==========================================
-- LOCATION INTELLIGENCE (OpenAI Generated)
-- ==========================================

CREATE TABLE public.property_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    
    -- Schools Data
    schools_data JSONB, -- Array of schools with type, grade, distance, population
    
    -- Entertainment Districts
    entertainment_districts JSONB, -- Array of districts with name, address, distance
    
    -- Grocery Stores
    grocery_stores JSONB, -- Array of stores with name, address, distance, chain
    
    -- Commute Times (calculated)
    commute_times JSONB, -- Object with times to user's commute addresses
    
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_property_location UNIQUE(property_id)
);

-- ==========================================
-- THIRD PARTY INTEGRATIONS
-- ==========================================

CREATE TABLE public.third_party_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- 'zillow', 'redfin', 'homes.com'
    is_connected BOOLEAN DEFAULT false,
    credentials_encrypted TEXT, -- Encrypted credentials
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_user_platform UNIQUE(user_id, platform)
);

-- ==========================================
-- AUDIT & ACTIVITY TRACKING
-- ==========================================

CREATE TABLE public.activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- ROW LEVEL SECURITY POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.third_party_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- User profiles: Users can only see and edit their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Buyer preferences: Users can only see and edit their own preferences
CREATE POLICY "Users can view own preferences" ON public.buyer_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON public.buyer_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.buyer_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- Rankings: Users can see and manage their own rankings
CREATE POLICY "Users can view own rankings" ON public.rankings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rankings" ON public.rankings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rankings" ON public.rankings
    FOR UPDATE USING (auth.uid() = user_id);

-- Shared accounts: Users can see shared accounts they're part of
CREATE POLICY "Users can view shared accounts" ON public.shared_accounts
    FOR SELECT USING (
        auth.uid() = primary_user_id OR 
        auth.uid() = secondary_user_id
    );

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================

-- User lookups
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);

-- Property searches
CREATE INDEX idx_properties_city_zip ON public.properties(city, zip_code);
CREATE INDEX idx_properties_price ON public.properties(list_price);
CREATE INDEX idx_properties_status ON public.properties(status);
CREATE INDEX idx_properties_mls ON public.properties(mls_number);

-- Rankings queries
CREATE INDEX idx_rankings_user_property ON public.rankings(user_id, property_id);
CREATE INDEX idx_rankings_overall_score ON public.rankings(overall_score DESC);

-- User properties associations
CREATE INDEX idx_user_properties_user ON public.user_properties(user_id);
CREATE INDEX idx_user_properties_property ON public.user_properties(property_id);

-- Shared accounts
CREATE INDEX idx_shared_accounts_users ON public.shared_accounts(primary_user_id, secondary_user_id);
CREATE INDEX idx_shared_accounts_status ON public.shared_accounts(status);

-- ==========================================
-- TRIGGERS
-- ==========================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to relevant tables
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_buyer_preferences_updated_at
    BEFORE UPDATE ON public.buyer_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON public.properties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_rankings_updated_at
    BEFORE UPDATE ON public.rankings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ==========================================
-- FUNCTIONS
-- ==========================================

-- Generate unique invitation code
CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists BOOLEAN;
BEGIN
    LOOP
        code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8));
        SELECT EXISTS(SELECT 1 FROM public.shared_accounts WHERE invitation_code = code) INTO exists;
        EXIT WHEN NOT exists;
    END LOOP;
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Calculate property match score based on preferences
CREATE OR REPLACE FUNCTION calculate_property_match_score(
    p_property_id UUID,
    p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 0;
    pref public.buyer_preferences%ROWTYPE;
    prop public.properties%ROWTYPE;
BEGIN
    SELECT * INTO pref FROM public.buyer_preferences WHERE user_id = p_user_id;
    SELECT * INTO prop FROM public.properties WHERE id = p_property_id;
    
    -- Price range match (30 points)
    IF prop.list_price BETWEEN pref.price_range_min AND pref.price_range_max THEN
        score := score + 30;
    END IF;
    
    -- Bedroom match (20 points)
    IF prop.bedrooms >= pref.bedrooms_needed THEN
        score := score + 20;
    END IF;
    
    -- Bathroom match (20 points)
    IF prop.bathrooms >= pref.bathrooms_needed THEN
        score := score + 20;
    END IF;
    
    -- Square footage match (15 points)
    IF prop.square_footage >= pref.min_square_footage THEN
        score := score + 15;
    END IF;
    
    -- Location match (15 points)
    IF prop.city = ANY(pref.city_preferences) OR 
       prop.zip_code = ANY(pref.preferred_zip_codes) THEN
        score := score + 15;
    END IF;
    
    RETURN score;
END;
$$ LANGUAGE plpgsql;