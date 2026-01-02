-- =====================================================
-- Company Selected Services Migration
-- Created: 2025-12-27
-- Description: Links companies to their selected additional services
-- =====================================================

-- =====================================================
-- 1. CREATE TABLE: company_selected_services
-- =====================================================
CREATE TABLE IF NOT EXISTS public.company_selected_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- References
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.additional_services(id) ON DELETE CASCADE,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint: one company can select each service only once
    CONSTRAINT unique_company_service UNIQUE (company_id, service_id)
);

-- =====================================================
-- 2. INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_company_selected_services_company 
    ON public.company_selected_services(company_id);

CREATE INDEX IF NOT EXISTS idx_company_selected_services_service 
    ON public.company_selected_services(service_id);

CREATE INDEX IF NOT EXISTS idx_company_selected_services_active 
    ON public.company_selected_services(is_active) 
    WHERE is_active = true;

-- =====================================================
-- 3. COMMENTS
-- =====================================================
COMMENT ON TABLE public.company_selected_services IS 
    'Junction table linking companies to their selected additional services';

COMMENT ON COLUMN public.company_selected_services.company_id IS 
    'Reference to the company that selected the service';

COMMENT ON COLUMN public.company_selected_services.service_id IS 
    'Reference to the additional service selected by the company';

COMMENT ON COLUMN public.company_selected_services.is_active IS 
    'Whether the service selection is currently active';

-- =====================================================
-- 4. ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.company_selected_services ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view active selections for verified companies
CREATE POLICY "Public can view active company services"
    ON public.company_selected_services
    FOR SELECT
    USING (
        is_active = true 
        AND EXISTS (
            SELECT 1 FROM public.companies 
            WHERE companies.id = company_selected_services.company_id 
            AND companies.status = 'verified'
        )
    );

-- Policy: Company owners can view their own service selections
CREATE POLICY "Company owners can view own services"
    ON public.company_selected_services
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.companies 
            WHERE companies.id = company_selected_services.company_id 
            AND companies.user_id = auth.uid()
        )
    );

-- Policy: Company owners can insert their own service selections
CREATE POLICY "Company owners can insert own services"
    ON public.company_selected_services
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.companies 
            WHERE companies.id = company_selected_services.company_id 
            AND companies.user_id = auth.uid()
        )
    );

-- Policy: Company owners can update their own service selections
CREATE POLICY "Company owners can update own services"
    ON public.company_selected_services
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.companies 
            WHERE companies.id = company_selected_services.company_id 
            AND companies.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.companies 
            WHERE companies.id = company_selected_services.company_id 
            AND companies.user_id = auth.uid()
        )
    );

-- Policy: Company owners can delete their own service selections
CREATE POLICY "Company owners can delete own services"
    ON public.company_selected_services
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.companies 
            WHERE companies.id = company_selected_services.company_id 
            AND companies.user_id = auth.uid()
        )
    );

-- Policy: Super admin has full access (SELECT)
CREATE POLICY "Super admin can view all company services"
    ON public.company_selected_services
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'SUPER_ADMIN'
        )
    );

-- Policy: Super admin has full access (INSERT)
CREATE POLICY "Super admin can insert company services"
    ON public.company_selected_services
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'SUPER_ADMIN'
        )
    );

-- Policy: Super admin has full access (UPDATE)
CREATE POLICY "Super admin can update company services"
    ON public.company_selected_services
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'SUPER_ADMIN'
        )
    );

-- Policy: Super admin has full access (DELETE)
CREATE POLICY "Super admin can delete company services"
    ON public.company_selected_services
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'SUPER_ADMIN'
        )
    );

-- =====================================================
-- 5. TRIGGER: Auto-update updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_company_selected_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS company_selected_services_updated_at_trigger ON public.company_selected_services;

CREATE TRIGGER company_selected_services_updated_at_trigger
    BEFORE UPDATE ON public.company_selected_services
    FOR EACH ROW
    EXECUTE FUNCTION update_company_selected_services_updated_at();

-- =====================================================
-- 6. FUNCTION: Clean up services when company changes locations
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_company_services_on_location_change()
RETURNS TRIGGER AS $$
BEGIN
    -- If location_ids changed, remove services that are no longer valid
    IF OLD.location_ids IS DISTINCT FROM NEW.location_ids THEN
        DELETE FROM public.company_selected_services css
        WHERE css.company_id = NEW.id
        AND NOT EXISTS (
            SELECT 1 FROM public.additional_services s
            WHERE s.id = css.service_id
            AND s.location_ids && NEW.location_ids  -- Array overlap operator
            AND s.status = 'active'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS company_location_change_cleanup_trigger ON public.companies;

CREATE TRIGGER company_location_change_cleanup_trigger
    AFTER UPDATE OF location_ids ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_company_services_on_location_change();
