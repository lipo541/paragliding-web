-- =====================================================
-- Migration 038: Add RLS Policy for Companies to View Pilots
-- =====================================================
-- Purpose: Allow companies to view pilots who have sent requests
-- =====================================================

-- Companies can view pilots who have sent them requests
DROP POLICY IF EXISTS "Companies can view pilots with requests" ON pilots;
CREATE POLICY "Companies can view pilots with requests"
    ON pilots
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM pilot_company_requests pcr
            JOIN companies c ON c.id = pcr.company_id
            WHERE pcr.pilot_id = pilots.id
            AND c.user_id = auth.uid()
        )
    );

-- Companies can view pilots who work for them
DROP POLICY IF EXISTS "Companies can view their pilots" ON pilots;
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
