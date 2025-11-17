-- Ensure locations table has public read access for website

-- Enable RLS if not already enabled
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Drop existing public read policy if exists
DROP POLICY IF EXISTS "Public can read active locations" ON locations;
DROP POLICY IF EXISTS "Public can read locations" ON locations;

-- Allow public read access to all locations (for website navigation)
CREATE POLICY "Public can read locations"
ON locations
FOR SELECT
TO public
USING (true);
