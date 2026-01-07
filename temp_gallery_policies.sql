-- Superadmin policies for pilot-gallery bucket
DROP POLICY IF EXISTS "Superadmin can view all pilot gallery" ON storage.objects;
DROP POLICY IF EXISTS "Superadmin can upload pilot gallery" ON storage.objects;
DROP POLICY IF EXISTS "Superadmin can update pilot gallery" ON storage.objects;
DROP POLICY IF EXISTS "Superadmin can delete pilot gallery" ON storage.objects;

CREATE POLICY "Superadmin can view all pilot gallery"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'pilot-gallery'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'SUPER_ADMIN'
  )
);

CREATE POLICY "Superadmin can upload pilot gallery"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pilot-gallery'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'SUPER_ADMIN'
  )
);

CREATE POLICY "Superadmin can update pilot gallery"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'pilot-gallery'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'SUPER_ADMIN'
  )
);

CREATE POLICY "Superadmin can delete pilot gallery"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'pilot-gallery'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'SUPER_ADMIN'
  )
);
