-- Enable RLS on countries table if not already enabled
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Enable read access for all users" ON countries;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON countries;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON countries;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON countries;
DROP POLICY IF EXISTS "Enable insert for super_admin" ON countries;
DROP POLICY IF EXISTS "Enable update for super_admin" ON countries;
DROP POLICY IF EXISTS "Enable delete for super_admin" ON countries;

-- Allow all authenticated users to read countries
CREATE POLICY "Enable read access for all users"
ON countries
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated super_admin to insert countries
CREATE POLICY "Enable insert for super_admin"
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

-- Allow authenticated super_admin to update countries
CREATE POLICY "Enable update for super_admin"
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

-- Allow authenticated super_admin to delete countries
CREATE POLICY "Enable delete for super_admin"
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
