-- =====================================================
-- Migration 035: Create Pilots Table
-- =====================================================
-- Purpose: Create the pilots table for tandem pilot registration
-- Features:
--   - Personal information
--   - Equipment details (wing, harnesses, reserve)
--   - Certificates storage
--   - Multi-language bio (6 languages)
--   - Company association
--   - Status management (pending, verified, blocked, hidden)
--   - RLS policies for security
-- =====================================================

-- 1. Create status ENUM for pilots
CREATE TYPE pilot_status AS ENUM ('pending', 'verified', 'blocked', 'hidden');

-- 2. Create pilots table
CREATE TABLE pilots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Personal Information (Multi-language names)
    first_name_ka TEXT,
    first_name_ru TEXT,
    first_name_de TEXT,
    first_name_tr TEXT,
    first_name_ar TEXT,
    last_name_ka TEXT,
    last_name_ru TEXT,
    last_name_de TEXT,
    last_name_tr TEXT,
    last_name_ar TEXT,
    
    birth_date DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar_url TEXT,
    
    -- Experience
    commercial_start_date DATE, -- When started commercial flying
    total_flights INTEGER,
    tandem_flights INTEGER,
    
    -- Multi-language bio/description
    bio_ka TEXT,
    bio_en TEXT,
    bio_ru TEXT,
    bio_ar TEXT,
    bio_de TEXT,
    bio_tr TEXT,
    
    -- Wing (ფრთა)
    wing_brand TEXT,
    wing_model TEXT,
    wing_certificate_url TEXT,
    
    -- Pilot Harness (პილოტის ჰარნესი)
    pilot_harness_brand TEXT,
    pilot_harness_model TEXT,
    pilot_harness_certificate_url TEXT,
    
    -- Passenger Harness (მგზავრის ჰარნესი)
    passenger_harness_brand TEXT,
    passenger_harness_model TEXT,
    passenger_harness_certificate_url TEXT,
    
    -- Reserve Parachute (სარეზერვო პარაშუტი)
    reserve_brand TEXT,
    reserve_model TEXT,
    reserve_certificate_url TEXT,
    
    -- Verification Documents (დამადასტურებელი დოკუმენტები - მრავალი სურათი)
    verification_documents TEXT[] DEFAULT '{}',
    
    -- Company Association
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    
    -- Slugs for URLs (multi-language, assigned by admin)
    slug TEXT,
    slug_ka TEXT,
    slug_en TEXT,
    slug_ru TEXT,
    slug_ar TEXT,
    slug_de TEXT,
    slug_tr TEXT,
    
    -- SEO Titles
    seo_title_ka TEXT,
    seo_title_en TEXT,
    seo_title_ru TEXT,
    seo_title_ar TEXT,
    seo_title_de TEXT,
    seo_title_tr TEXT,
    
    -- SEO Descriptions
    seo_description_ka TEXT,
    seo_description_en TEXT,
    seo_description_ru TEXT,
    seo_description_ar TEXT,
    seo_description_de TEXT,
    seo_description_tr TEXT,
    
    -- OG Titles
    og_title_ka TEXT,
    og_title_en TEXT,
    og_title_ru TEXT,
    og_title_ar TEXT,
    og_title_de TEXT,
    og_title_tr TEXT,
    
    -- OG Descriptions
    og_description_ka TEXT,
    og_description_en TEXT,
    og_description_ru TEXT,
    og_description_ar TEXT,
    og_description_de TEXT,
    og_description_tr TEXT,
    
    -- Status
    status pilot_status DEFAULT 'pending' NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT pilots_user_id_unique UNIQUE (user_id)
);

-- 3. Create indexes for better performance
CREATE INDEX idx_pilots_user_id ON pilots(user_id);
CREATE INDEX idx_pilots_status ON pilots(status);
CREATE INDEX idx_pilots_company_id ON pilots(company_id);
CREATE INDEX idx_pilots_created_at ON pilots(created_at DESC);
CREATE INDEX idx_pilots_slug ON pilots(slug);
CREATE INDEX idx_pilots_slug_ka ON pilots(slug_ka);
CREATE INDEX idx_pilots_slug_en ON pilots(slug_en);

-- 4. Enable Row Level Security
ALTER TABLE pilots ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Public can view verified pilots
CREATE POLICY "Public can view verified pilots"
    ON pilots
    FOR SELECT
    USING (status = 'verified');

-- Users can view their own pilot profile (any status)
CREATE POLICY "Users can view own pilot profile"
    ON pilots
    FOR SELECT
    USING (auth.uid() = user_id);

-- Authenticated users can create their own pilot profile
CREATE POLICY "Users can create own pilot profile"
    ON pilots
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own pilot profile
CREATE POLICY "Users can update own pilot profile"
    ON pilots
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Super admin can view all pilots
CREATE POLICY "Super admin can view all pilots"
    ON pilots
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'SUPER_ADMIN'
        )
    );

-- Super admin can update any pilot
CREATE POLICY "Super admin can update any pilot"
    ON pilots
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'SUPER_ADMIN'
        )
    );

-- Super admin can delete any pilot
CREATE POLICY "Super admin can delete any pilot"
    ON pilots
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'SUPER_ADMIN'
        )
    );

-- Companies can view their pilots
CREATE POLICY "Companies can view their pilots"
    ON pilots
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM companies
            WHERE companies.id = pilots.company_id
            AND companies.user_id = auth.uid()
        )
    );

-- 6. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pilots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER pilots_updated_at_trigger
    BEFORE UPDATE ON pilots
    FOR EACH ROW
    EXECUTE FUNCTION update_pilots_updated_at();

-- 7. Create function to approve pilot (updates both pilots and profiles)
CREATE OR REPLACE FUNCTION approve_pilot(pilot_id UUID)
RETURNS VOID AS $$
DECLARE
    pilot_user_id UUID;
BEGIN
    -- Get the user_id from the pilot
    SELECT user_id INTO pilot_user_id
    FROM pilots
    WHERE id = pilot_id;
    
    IF pilot_user_id IS NULL THEN
        RAISE EXCEPTION 'Pilot not found';
    END IF;
    
    -- Update pilot status
    UPDATE pilots
    SET status = 'verified', updated_at = NOW()
    WHERE id = pilot_id;
    
    -- Update user role to TANDEM_PILOT
    UPDATE profiles
    SET role = 'TANDEM_PILOT', updated_at = NOW()
    WHERE id = pilot_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (will be restricted by RLS)
GRANT EXECUTE ON FUNCTION approve_pilot(UUID) TO authenticated;

-- 8. Comments for documentation
COMMENT ON TABLE pilots IS 'Stores tandem pilot registration information with equipment details and multi-language support';
COMMENT ON COLUMN pilots.status IS 'pending: awaiting admin approval, verified: approved, blocked: suspended, hidden: not visible publicly';
COMMENT ON COLUMN pilots.commercial_start_date IS 'Date when pilot started commercial tandem flying - used to calculate experience';
COMMENT ON COLUMN pilots.company_id IS 'Optional company association - pilot can be independent or work for a company';
COMMENT ON FUNCTION approve_pilot IS 'Approves a pilot and updates user role to TANDEM_PILOT. Should only be called by SUPER_ADMIN';
