-- Remove slug column and its constraint from location_pages table
-- slug is not needed since we use location_id for identification

-- Drop the index first
DROP INDEX IF EXISTS idx_location_pages_slug;

-- Drop the slug column (this also removes the unique constraint)
-- Drop and recreate location_pages table without slug
DROP TABLE IF EXISTS location_pages CASCADE;

CREATE TABLE location_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on location_id for faster queries
CREATE INDEX idx_location_pages_location_id ON location_pages(location_id);

-- Create index on country_id
CREATE INDEX idx_location_pages_country_id ON location_pages(country_id);

-- Enable RLS
ALTER TABLE location_pages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow public read access" ON location_pages
  FOR SELECT USING (is_active = true);

CREATE POLICY "Allow authenticated users full access" ON location_pages
  FOR ALL USING (auth.role() = 'authenticated');
