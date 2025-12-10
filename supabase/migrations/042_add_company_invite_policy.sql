-- =====================================================
-- Migration 042: Add company invite policy
-- =====================================================
-- Purpose: Allow companies to create invitations for pilots
-- =====================================================

-- Drop if exists and recreate
DROP POLICY IF EXISTS "Companies can create invites" ON pilot_company_requests;

-- Companies can create invitations for pilots
CREATE POLICY "Companies can create invites"
    ON pilot_company_requests
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM companies
            WHERE companies.id = pilot_company_requests.company_id
            AND companies.user_id = auth.uid()
        )
    );

COMMENT ON POLICY "Companies can create invites" ON pilot_company_requests IS 
'Allows companies to send invitations to pilots';
