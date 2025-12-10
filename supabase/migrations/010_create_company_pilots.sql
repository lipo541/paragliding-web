-- =============================================
-- Company-Pilot Relations Migration
-- =============================================
-- This migration creates the junction table for 
-- many-to-many relationship between companies and pilots
-- =============================================

-- Create company_pilots junction table
CREATE TABLE IF NOT EXISTS company_pilots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
    pilot_id UUID NOT NULL REFERENCES pilot_profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    invited_by TEXT DEFAULT 'company', -- 'company' or 'pilot' to track who initiated
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique company-pilot pairs
    UNIQUE(company_id, pilot_id)
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_company_pilots_company_id ON company_pilots(company_id);
CREATE INDEX IF NOT EXISTS idx_company_pilots_pilot_id ON company_pilots(pilot_id);
CREATE INDEX IF NOT EXISTS idx_company_pilots_status ON company_pilots(status);

-- Enable RLS
ALTER TABLE company_pilots ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view relations for their own company or pilot profile
CREATE POLICY "Users can view their own company-pilot relations"
    ON company_pilots
    FOR SELECT
    USING (
        company_id IN (SELECT id FROM company_profiles WHERE user_id = auth.uid())
        OR 
        pilot_id IN (SELECT id FROM pilot_profiles WHERE user_id = auth.uid())
    );

-- Policy: Companies can insert (invite pilots)
CREATE POLICY "Companies can invite pilots"
    ON company_pilots
    FOR INSERT
    WITH CHECK (
        company_id IN (SELECT id FROM company_profiles WHERE user_id = auth.uid())
    );

-- Policy: Pilots can also insert (request to join company)
CREATE POLICY "Pilots can request to join companies"
    ON company_pilots
    FOR INSERT
    WITH CHECK (
        pilot_id IN (SELECT id FROM pilot_profiles WHERE user_id = auth.uid())
    );

-- Policy: Both company and pilot can update (approve/reject)
CREATE POLICY "Users can update their own relations"
    ON company_pilots
    FOR UPDATE
    USING (
        company_id IN (SELECT id FROM company_profiles WHERE user_id = auth.uid())
        OR 
        pilot_id IN (SELECT id FROM pilot_profiles WHERE user_id = auth.uid())
    );

-- Policy: Both company and pilot can delete their relations
CREATE POLICY "Users can delete their own relations"
    ON company_pilots
    FOR DELETE
    USING (
        company_id IN (SELECT id FROM company_profiles WHERE user_id = auth.uid())
        OR 
        pilot_id IN (SELECT id FROM pilot_profiles WHERE user_id = auth.uid())
    );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_company_pilots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_company_pilots_updated_at
    BEFORE UPDATE ON company_pilots
    FOR EACH ROW
    EXECUTE FUNCTION update_company_pilots_updated_at();

-- =============================================
-- Grant permissions
-- =============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON company_pilots TO authenticated;
