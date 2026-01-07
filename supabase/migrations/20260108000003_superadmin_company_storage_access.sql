-- Grant superadmin full access to company storage bucket
-- This allows superadmins to manage all company files from the admin panel

-- Superadmin policies for company-logos bucket
DROP POLICY IF EXISTS "Superadmin can view all company logos" ON storage.objects;
DROP POLICY IF EXISTS "Superadmin can upload company logos" ON storage.objects;
DROP POLICY IF EXISTS "Superadmin can update company logos" ON storage.objects;
DROP POLICY IF EXISTS "Superadmin can delete company logos" ON storage.objects;

CREATE POLICY "Superadmin can view all company logos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'company-logos'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'SUPER_ADMIN'
  )
);

CREATE POLICY "Superadmin can upload company logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company-logos'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'SUPER_ADMIN'
  )
);

CREATE POLICY "Superadmin can update company logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'company-logos'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'SUPER_ADMIN'
  )
);

CREATE POLICY "Superadmin can delete company logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'company-logos'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'SUPER_ADMIN'
  )
);
