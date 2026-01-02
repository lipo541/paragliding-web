-- Assign giorgi qatamadze to xcaucasus company for testing
-- This demonstrates that pilots must have company_id to appear on location pages

-- Get the pilot ID and company ID, then update
UPDATE pilots
SET company_id = (
    SELECT id FROM companies WHERE name_ka = 'xcaucasus' LIMIT 1
)
WHERE first_name_ka = 'giorgi' AND last_name_ka = 'qatamadze';

-- Verify the update
DO $$
DECLARE
    pilot_company_id UUID;
    pilot_name TEXT;
BEGIN
    SELECT company_id, first_name_ka || ' ' || last_name_ka
    INTO pilot_company_id, pilot_name
    FROM pilots
    WHERE first_name_ka = 'giorgi' AND last_name_ka = 'qatamadze';
    
    IF pilot_company_id IS NOT NULL THEN
        RAISE NOTICE 'SUCCESS: % now has company_id: %', pilot_name, pilot_company_id;
    ELSE
        RAISE NOTICE 'WARNING: % still has no company_id', pilot_name;
    END IF;
END $$;

-- Add comment
COMMENT ON COLUMN pilots.company_id IS 'Company the pilot belongs to. Pilots must have a company to appear on location pages.';
