-- Add country_id column to companies table
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS country_id UUID REFERENCES countries(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_companies_country_id ON companies(country_id);

-- Add comment for documentation
COMMENT ON COLUMN companies.country_id IS 'Reference to country where company operates';
