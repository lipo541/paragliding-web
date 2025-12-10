-- =====================================================
-- Migration 040: Add initiated_by field to pilot_company_requests
-- =====================================================
-- Purpose: Track who initiated the request (pilot or company)
-- This determines who should approve:
--   - pilot_request: Company approves
--   - company_invite: Pilot approves
-- =====================================================

-- 1. Create ENUM type for request initiator
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_initiator') THEN
        CREATE TYPE request_initiator AS ENUM ('pilot_request', 'company_invite');
    END IF;
END $$;

-- 2. Add initiated_by column (default to pilot_request for backwards compatibility)
ALTER TABLE pilot_company_requests 
ADD COLUMN IF NOT EXISTS initiated_by request_initiator DEFAULT 'pilot_request' NOT NULL;

-- 3. Create index for filtering by initiator
CREATE INDEX IF NOT EXISTS idx_pilot_company_requests_initiated_by 
ON pilot_company_requests(initiated_by);

-- Comment
COMMENT ON COLUMN pilot_company_requests.initiated_by IS 
'Who initiated the request: pilot_request (pilot asked to join) or company_invite (company invited pilot)';
