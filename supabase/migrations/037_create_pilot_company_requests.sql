-- =====================================================
-- Migration 037: Create Pilot Company Requests Table
-- =====================================================
-- Purpose: Manage pilot requests to join companies
-- Features:
--   - Request status tracking (pending, approved, rejected)
--   - Message from pilot to company
--   - Response from company
--   - RLS policies for security
-- =====================================================

-- 1. Create request status ENUM
CREATE TYPE pilot_company_request_status AS ENUM ('pending', 'approved', 'rejected');

-- 2. Create pilot_company_requests table
CREATE TABLE pilot_company_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pilot_id UUID NOT NULL REFERENCES pilots(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Request status
    status pilot_company_request_status DEFAULT 'pending' NOT NULL,
    
    -- Message from pilot
    message TEXT,
    
    -- Response from company
    response_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    responded_at TIMESTAMPTZ,
    
    -- Constraint: one active request per pilot-company pair
    CONSTRAINT unique_active_request UNIQUE (pilot_id, company_id)
);

-- 3. Create indexes for better performance
CREATE INDEX idx_pilot_company_requests_pilot_id ON pilot_company_requests(pilot_id);
CREATE INDEX idx_pilot_company_requests_company_id ON pilot_company_requests(company_id);
CREATE INDEX idx_pilot_company_requests_status ON pilot_company_requests(status);
CREATE INDEX idx_pilot_company_requests_created_at ON pilot_company_requests(created_at DESC);

-- 4. Enable Row Level Security
ALTER TABLE pilot_company_requests ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Pilots can view their own requests
CREATE POLICY "Pilots can view own requests"
    ON pilot_company_requests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM pilots
            WHERE pilots.id = pilot_company_requests.pilot_id
            AND pilots.user_id = auth.uid()
        )
    );

-- Pilots can create requests from their profile
CREATE POLICY "Pilots can create requests"
    ON pilot_company_requests
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM pilots
            WHERE pilots.id = pilot_company_requests.pilot_id
            AND pilots.user_id = auth.uid()
        )
    );

-- Pilots can cancel their pending requests
CREATE POLICY "Pilots can delete pending requests"
    ON pilot_company_requests
    FOR DELETE
    USING (
        status = 'pending'
        AND EXISTS (
            SELECT 1 FROM pilots
            WHERE pilots.id = pilot_company_requests.pilot_id
            AND pilots.user_id = auth.uid()
        )
    );

-- Companies can view requests sent to them
CREATE POLICY "Companies can view their requests"
    ON pilot_company_requests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM companies
            WHERE companies.id = pilot_company_requests.company_id
            AND companies.user_id = auth.uid()
        )
    );

-- Companies can update requests sent to them (approve/reject)
CREATE POLICY "Companies can respond to requests"
    ON pilot_company_requests
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM companies
            WHERE companies.id = pilot_company_requests.company_id
            AND companies.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM companies
            WHERE companies.id = pilot_company_requests.company_id
            AND companies.user_id = auth.uid()
        )
    );

-- Super admin can view all requests
CREATE POLICY "Super admin can view all pilot company requests"
    ON pilot_company_requests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'SUPER_ADMIN'
        )
    );

-- Super admin can update any request
CREATE POLICY "Super admin can update any pilot company request"
    ON pilot_company_requests
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'SUPER_ADMIN'
        )
    );

-- Super admin can delete any request
CREATE POLICY "Super admin can delete any pilot company request"
    ON pilot_company_requests
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'SUPER_ADMIN'
        )
    );

-- 6. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pilot_company_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    -- Set responded_at when status changes from pending
    IF OLD.status = 'pending' AND NEW.status != 'pending' THEN
        NEW.responded_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER pilot_company_requests_updated_at_trigger
    BEFORE UPDATE ON pilot_company_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_pilot_company_requests_updated_at();

-- 7. Create function to approve pilot request (updates request and pilot's company_id)
CREATE OR REPLACE FUNCTION approve_pilot_request(request_id UUID, response TEXT DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
    req_pilot_id UUID;
    req_company_id UUID;
BEGIN
    -- Get the pilot_id and company_id from the request
    SELECT pilot_id, company_id INTO req_pilot_id, req_company_id
    FROM pilot_company_requests
    WHERE id = request_id AND status = 'pending';
    
    IF req_pilot_id IS NULL THEN
        RAISE EXCEPTION 'Request not found or already processed';
    END IF;
    
    -- Update request status
    UPDATE pilot_company_requests
    SET 
        status = 'approved',
        response_message = response,
        responded_at = NOW(),
        updated_at = NOW()
    WHERE id = request_id;
    
    -- Update pilot's company_id
    UPDATE pilots
    SET company_id = req_company_id, updated_at = NOW()
    WHERE id = req_pilot_id;
    
    -- Reject all other pending requests from the same pilot
    UPDATE pilot_company_requests
    SET 
        status = 'rejected',
        response_message = 'პილოტმა სხვა კომპანიაში დაიწყო მუშაობა',
        responded_at = NOW(),
        updated_at = NOW()
    WHERE pilot_id = req_pilot_id
    AND id != request_id
    AND status = 'pending';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create function to reject pilot request
CREATE OR REPLACE FUNCTION reject_pilot_request(request_id UUID, response TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
    UPDATE pilot_company_requests
    SET 
        status = 'rejected',
        response_message = response,
        responded_at = NOW(),
        updated_at = NOW()
    WHERE id = request_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request not found or already processed';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create function for pilot to leave company
CREATE OR REPLACE FUNCTION pilot_leave_company(p_pilot_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Remove company association
    UPDATE pilots
    SET company_id = NULL, updated_at = NOW()
    WHERE id = p_pilot_id
    AND user_id = auth.uid();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pilot not found or not authorized';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION approve_pilot_request(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_pilot_request(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION pilot_leave_company(UUID) TO authenticated;

-- 10. Comments for documentation
COMMENT ON TABLE pilot_company_requests IS 'Stores pilot requests to join companies';
COMMENT ON COLUMN pilot_company_requests.status IS 'pending: awaiting company response, approved: pilot joined company, rejected: request declined';
COMMENT ON COLUMN pilot_company_requests.message IS 'Optional message from pilot to company';
COMMENT ON COLUMN pilot_company_requests.response_message IS 'Optional response message from company';
COMMENT ON FUNCTION approve_pilot_request IS 'Approves a pilot request and updates pilot company_id. Rejects other pending requests from same pilot.';
COMMENT ON FUNCTION reject_pilot_request IS 'Rejects a pilot request with optional response message';
COMMENT ON FUNCTION pilot_leave_company IS 'Allows a pilot to leave their current company';
