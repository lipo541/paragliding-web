-- Grant superadmin full access to pilot storage buckets
-- This allows superadmins to manage all pilot files from the admin panel

-- Superadmin policies for pilot-avatars bucket
DROP POLICY IF EXISTS "Superadmin can view all pilot avatars" ON storage.objects;
DROP POLICY IF EXISTS "Superadmin can upload pilot avatars" ON storage.objects;
DROP POLICY IF EXISTS "Superadmin can update pilot avatars" ON storage.objects;
DROP POLICY IF EXISTS "Superadmin can delete pilot avatars" ON storage.objects;

CREATE POLICY "Superadmin can view all pilot avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'pilot-avatars'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'SUPER_ADMIN'
  )
);

CREATE POLICY "Superadmin can upload pilot avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pilot-avatars'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'SUPER_ADMIN'
  )
);

CREATE POLICY "Superadmin can update pilot avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'pilot-avatars'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'SUPER_ADMIN'
  )
);

CREATE POLICY "Superadmin can delete pilot avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'pilot-avatars'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'SUPER_ADMIN'
  )
);

-- Superadmin policies for pilot-certificates bucket
DROP POLICY IF EXISTS "Superadmin can view all pilot certificates" ON storage.objects;
DROP POLICY IF EXISTS "Superadmin can upload pilot certificates" ON storage.objects;
DROP POLICY IF EXISTS "Superadmin can update pilot certificates" ON storage.objects;
DROP POLICY IF EXISTS "Superadmin can delete pilot certificates" ON storage.objects;

CREATE POLICY "Superadmin can view all pilot certificates"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'pilot-certificates'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'SUPER_ADMIN'
  )
);

CREATE POLICY "Superadmin can upload pilot certificates"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pilot-certificates'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'SUPER_ADMIN'
  )
);

CREATE POLICY "Superadmin can update pilot certificates"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'pilot-certificates'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'SUPER_ADMIN'
  )
);

CREATE POLICY "Superadmin can delete pilot certificates"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'pilot-certificates'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'SUPER_ADMIN'
  )
);

-- Superadmin policies for pilot-og-images bucket
DROP POLICY IF EXISTS "Superadmin can view all pilot OG images" ON storage.objects;
DROP POLICY IF EXISTS "Superadmin can upload pilot OG images" ON storage.objects;
DROP POLICY IF EXISTS "Superadmin can update pilot OG images" ON storage.objects;
DROP POLICY IF EXISTS "Superadmin can delete pilot OG images" ON storage.objects;

CREATE POLICY "Superadmin can view all pilot OG images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'pilot-og-images'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'SUPER_ADMIN'
  )
);

CREATE POLICY "Superadmin can upload pilot OG images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pilot-og-images'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'SUPER_ADMIN'
  )
);

CREATE POLICY "Superadmin can update pilot OG images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'pilot-og-images'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'SUPER_ADMIN'
  )
);

CREATE POLICY "Superadmin can delete pilot OG images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'pilot-og-images'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'SUPER_ADMIN'
  )
);

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
