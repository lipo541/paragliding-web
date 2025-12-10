-- =====================================================
-- Migration 041: Add pilot respond policy
-- =====================================================
-- Purpose: Allow pilots to respond (accept/reject) to company invites
-- =====================================================

-- Drop if exists and recreate
DROP POLICY IF EXISTS "Pilots can respond to company invites" ON pilot_company_requests;

-- Pilots can update requests where they are the pilot (to respond to company invites)
CREATE POLICY "Pilots can respond to company invites"
    ON pilot_company_requests
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM pilots
            WHERE pilots.id = pilot_company_requests.pilot_id
            AND pilots.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM pilots
            WHERE pilots.id = pilot_company_requests.pilot_id
            AND pilots.user_id = auth.uid()
        )
    );

COMMENT ON POLICY "Pilots can respond to company invites" ON pilot_company_requests IS 
'Allows pilots to accept or reject company invitations';
