-- Add rating fields to companies table
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS cached_rating DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cached_rating_count INTEGER DEFAULT 0;

-- Create index for sorting by rating
CREATE INDEX IF NOT EXISTS idx_companies_rating ON companies(cached_rating DESC);

-- Add comments
COMMENT ON COLUMN companies.cached_rating IS 'Cached average rating (0-5 scale)';
COMMENT ON COLUMN companies.cached_rating_count IS 'Cached total number of ratings';
