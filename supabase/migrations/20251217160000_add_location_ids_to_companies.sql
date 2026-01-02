-- Add location_ids to companies table for multi-location support
-- Similar to pilots table structure

-- Add location_ids column
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS location_ids UUID[] DEFAULT '{}';

-- Create GIN index for efficient array queries
CREATE INDEX IF NOT EXISTS idx_companies_location_ids ON public.companies USING GIN (location_ids);

-- Add comment
COMMENT ON COLUMN public.companies.location_ids IS 'Array of location UUIDs where company operates';
