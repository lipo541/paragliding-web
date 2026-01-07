-- Add missing foreign key constraint for pilot_company_requests.pilot_id
-- This is needed for PostgREST to detect the relationship for joins

-- First check if the constraint already exists and add if not
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'pilot_company_requests_pilot_id_fkey'
    ) THEN
        ALTER TABLE "public"."pilot_company_requests"
        ADD CONSTRAINT "pilot_company_requests_pilot_id_fkey" 
        FOREIGN KEY ("pilot_id") 
        REFERENCES "public"."pilots"("id") 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
