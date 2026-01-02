-- =====================================================
-- Migration: Add Company Invites to Pilots
-- =====================================================
-- Purpose: Allow companies to invite pilots
-- Features:
--   - request_type: 'pilot_request' or 'company_invite'
--   - Companies can invite pilots
--   - Pilots can respond to invites
-- =====================================================

-- 1. Add request_type to differentiate who initiated
ALTER TABLE pilot_company_requests
ADD COLUMN IF NOT EXISTS request_type TEXT DEFAULT 'pilot_request' CHECK (
    request_type IN ('pilot_request', 'company_invite')
);

-- Add comment
COMMENT ON COLUMN pilot_company_requests.request_type IS 'Who initiated: pilot_request = pilot asked to join, company_invite = company invited pilot';

-- 2. Create index for request_type
CREATE INDEX IF NOT EXISTS idx_pilot_company_requests_type ON pilot_company_requests(request_type);

-- 3. Add policy for companies to create invites
DROP POLICY IF EXISTS "Companies can create invites" ON pilot_company_requests;
CREATE POLICY "Companies can create invites"
    ON pilot_company_requests
    FOR INSERT
    WITH CHECK (
        request_type = 'company_invite'
        AND EXISTS (
            SELECT 1 FROM companies
            WHERE companies.id = pilot_company_requests.company_id
            AND companies.user_id = auth.uid()
        )
    );

-- 4. Add policy for pilots to respond to company invites
DROP POLICY IF EXISTS "Pilots can respond to company invites" ON pilot_company_requests;
CREATE POLICY "Pilots can respond to company invites"
    ON pilot_company_requests
    FOR UPDATE
    USING (
        request_type = 'company_invite'
        AND EXISTS (
            SELECT 1 FROM pilots
            WHERE pilots.id = pilot_company_requests.pilot_id
            AND pilots.user_id = auth.uid()
        )
    )
    WITH CHECK (
        request_type = 'company_invite'
        AND EXISTS (
            SELECT 1 FROM pilots
            WHERE pilots.id = pilot_company_requests.pilot_id
            AND pilots.user_id = auth.uid()
        )
    );

-- 5. Create function for company to invite a pilot
CREATE OR REPLACE FUNCTION company_invite_pilot(
    p_pilot_id UUID,
    p_company_id UUID,
    p_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_request_id UUID;
    company_owner_id UUID;
BEGIN
    -- Check if company belongs to current user
    SELECT user_id INTO company_owner_id
    FROM companies
    WHERE id = p_company_id;
    
    IF company_owner_id != auth.uid() THEN
        RAISE EXCEPTION 'Not authorized to invite pilots for this company';
    END IF;
    
    -- Check if pilot already has a company
    IF EXISTS (
        SELECT 1 FROM pilots 
        WHERE id = p_pilot_id AND company_id IS NOT NULL
    ) THEN
        RAISE EXCEPTION 'Pilot already belongs to a company';
    END IF;
    
    -- Check if there's already an active request/invite
    IF EXISTS (
        SELECT 1 FROM pilot_company_requests
        WHERE pilot_id = p_pilot_id
        AND company_id = p_company_id
        AND status = 'pending'
    ) THEN
        RAISE EXCEPTION 'There is already a pending request between this pilot and company';
    END IF;
    
    -- Create the invite
    INSERT INTO pilot_company_requests (
        pilot_id,
        company_id,
        request_type,
        message,
        status
    ) VALUES (
        p_pilot_id,
        p_company_id,
        'company_invite',
        p_message,
        'pending'
    )
    RETURNING id INTO new_request_id;
    
    RETURN new_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create function for pilot to accept company invite
CREATE OR REPLACE FUNCTION accept_company_invite(p_request_id UUID)
RETURNS VOID AS $$
DECLARE
    req_pilot_id UUID;
    req_company_id UUID;
    req_type TEXT;
    pilot_user_id UUID;
BEGIN
    -- Get request details
    SELECT pilot_id, company_id, request_type
    INTO req_pilot_id, req_company_id, req_type
    FROM pilot_company_requests
    WHERE id = p_request_id AND status = 'pending';
    
    IF req_pilot_id IS NULL THEN
        RAISE EXCEPTION 'Request not found or already processed';
    END IF;
    
    IF req_type != 'company_invite' THEN
        RAISE EXCEPTION 'This is not a company invite';
    END IF;
    
    -- Check pilot owns this profile
    SELECT user_id INTO pilot_user_id
    FROM pilots WHERE id = req_pilot_id;
    
    IF pilot_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Not authorized to accept this invite';
    END IF;
    
    -- Update request status
    UPDATE pilot_company_requests
    SET 
        status = 'approved',
        responded_at = NOW(),
        updated_at = NOW()
    WHERE id = p_request_id;
    
    -- Update pilot's company_id
    UPDATE pilots
    SET company_id = req_company_id, updated_at = NOW()
    WHERE id = req_pilot_id;
    
    -- Reject all other pending requests/invites for this pilot
    UPDATE pilot_company_requests
    SET 
        status = 'rejected',
        response_message = 'პილოტმა სხვა კომპანიაში დაიწყო მუშაობა',
        responded_at = NOW(),
        updated_at = NOW()
    WHERE pilot_id = req_pilot_id
    AND id != p_request_id
    AND status = 'pending';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create function for pilot to decline company invite
CREATE OR REPLACE FUNCTION decline_company_invite(p_request_id UUID, p_message TEXT DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
    req_pilot_id UUID;
    req_type TEXT;
    pilot_user_id UUID;
BEGIN
    -- Get request details
    SELECT pilot_id, request_type
    INTO req_pilot_id, req_type
    FROM pilot_company_requests
    WHERE id = p_request_id AND status = 'pending';
    
    IF req_pilot_id IS NULL THEN
        RAISE EXCEPTION 'Request not found or already processed';
    END IF;
    
    IF req_type != 'company_invite' THEN
        RAISE EXCEPTION 'This is not a company invite';
    END IF;
    
    -- Check pilot owns this profile
    SELECT user_id INTO pilot_user_id
    FROM pilots WHERE id = req_pilot_id;
    
    IF pilot_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Not authorized to decline this invite';
    END IF;
    
    -- Update request status
    UPDATE pilot_company_requests
    SET 
        status = 'rejected',
        response_message = p_message,
        responded_at = NOW(),
        updated_at = NOW()
    WHERE id = p_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION company_invite_pilot(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION accept_company_invite(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decline_company_invite(UUID, TEXT) TO authenticated;

-- Comments
COMMENT ON FUNCTION company_invite_pilot IS 'Company invites a pilot to join. Creates invite with status pending.';
COMMENT ON FUNCTION accept_company_invite IS 'Pilot accepts company invite. Updates pilot company_id.';
COMMENT ON FUNCTION decline_company_invite IS 'Pilot declines company invite.';
