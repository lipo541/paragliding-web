-- =====================================================
-- Migration 033: Create Companies Table
-- =====================================================
-- Purpose: Create the companies table for company registration
-- Features:
--   - Company profile information
--   - Multi-language descriptions (6 languages)
--   - Status management (pending, verified, blocked, hidden)
--   - RLS policies for security
-- =====================================================

-- 1. Create status ENUM for companies
CREATE TYPE company_status AS ENUM ('pending', 'verified', 'blocked', 'hidden');

-- 2. Create companies table
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    country_id UUID REFERENCES countries(id) ON DELETE SET NULL,
    
    -- Basic Information
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    founded_date DATE,
    identification_code TEXT NOT NULL,
    
    -- Multi-language descriptions
    description_ka TEXT,
    description_en TEXT,
    description_ru TEXT,
    description_ar TEXT,
    description_de TEXT,
    description_tr TEXT,
    
    -- Logo
    logo_url TEXT,
    
    -- Status
    status company_status DEFAULT 'pending' NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT companies_user_id_unique UNIQUE (user_id),
    CONSTRAINT companies_identification_code_unique UNIQUE (identification_code)
);

-- 3. Create indexes for better performance
CREATE INDEX idx_companies_user_id ON companies(user_id);
CREATE INDEX idx_companies_country_id ON companies(country_id);
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_created_at ON companies(created_at DESC);

-- 4. Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Public can view verified companies
CREATE POLICY "Public can view verified companies"
    ON companies
    FOR SELECT
    USING (status = 'verified');

-- Users can view their own company (any status)
CREATE POLICY "Users can view own company"
    ON companies
    FOR SELECT
    USING (auth.uid() = user_id);

-- Authenticated users can create their own company
CREATE POLICY "Users can create own company"
    ON companies
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own company
CREATE POLICY "Users can update own company"
    ON companies
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Super admin can view all companies
CREATE POLICY "Super admin can view all companies"
    ON companies
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'SUPER_ADMIN'
        )
    );

-- Super admin can update any company
CREATE POLICY "Super admin can update any company"
    ON companies
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'SUPER_ADMIN'
        )
    );

-- Super admin can delete any company
CREATE POLICY "Super admin can delete any company"
    ON companies
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'SUPER_ADMIN'
        )
    );

-- 6. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER companies_updated_at_trigger
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_companies_updated_at();

-- 7. Create function to approve company (updates both companies and profiles)
CREATE OR REPLACE FUNCTION approve_company(company_id UUID)
RETURNS VOID AS $$
DECLARE
    company_user_id UUID;
BEGIN
    -- Get the user_id from the company
    SELECT user_id INTO company_user_id
    FROM companies
    WHERE id = company_id;
    
    IF company_user_id IS NULL THEN
        RAISE EXCEPTION 'Company not found';
    END IF;
    
    -- Update company status
    UPDATE companies
    SET status = 'verified', updated_at = NOW()
    WHERE id = company_id;
    
    -- Update user role to COMPANY
    UPDATE profiles
    SET role = 'COMPANY', updated_at = NOW()
    WHERE id = company_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (will be restricted by RLS)
GRANT EXECUTE ON FUNCTION approve_company(UUID) TO authenticated;

-- 8. Comments for documentation
COMMENT ON TABLE companies IS 'Stores company registration information with multi-language support';
COMMENT ON COLUMN companies.country_id IS 'Country where the company operates - used for grouping on public companies page';
COMMENT ON COLUMN companies.status IS 'pending: awaiting admin approval, verified: approved, blocked: suspended, hidden: not visible publicly';
COMMENT ON COLUMN companies.identification_code IS 'Company tax/registration identification code';
COMMENT ON FUNCTION approve_company IS 'Approves a company and updates user role to COMPANY. Should only be called by SUPER_ADMIN';
