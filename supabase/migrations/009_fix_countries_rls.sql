-- Clean up all existing policies on countries table
DROP POLICY IF EXISTS "Anyone can view countries" ON countries;
DROP POLICY IF EXISTS "Only SUPER_ADMIN can insert countries" ON countries;
DROP POLICY IF EXISTS "Only SUPER_ADMIN can update countries" ON countries;
DROP POLICY IF EXISTS "Only SUPER_ADMIN can delete countries" ON countries;
DROP POLICY IF EXISTS "Enable read access for all users" ON countries;
DROP POLICY IF EXISTS "Enable insert for super_admin" ON countries;
DROP POLICY IF EXISTS "Enable update for super_admin" ON countries;
DROP POLICY IF EXISTS "Enable delete for super_admin" ON countries;

-- Enable RLS on countries table
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;

-- Allow public read access to countries (for website)
CREATE POLICY "Public can read countries"
ON countries
FOR SELECT
TO public
USING (true);

-- Allow SUPER_ADMIN to insert countries
CREATE POLICY "SUPER_ADMIN can insert countries"
ON countries
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'SUPER_ADMIN'
  )
);

-- Allow SUPER_ADMIN to update countries
CREATE POLICY "SUPER_ADMIN can update countries"
ON countries
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'SUPER_ADMIN'
  )
);

-- Allow SUPER_ADMIN to delete countries
CREATE POLICY "SUPER_ADMIN can delete countries"
ON countries
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'SUPER_ADMIN'
  )
);
