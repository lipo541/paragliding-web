-- Storage bucket RLS policies for countryIMGgallery

-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads to countryIMGgallery"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'countryIMGgallery' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'SUPER_ADMIN'
  )
);

-- Allow authenticated users to update files
CREATE POLICY "Allow authenticated updates to countryIMGgallery"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'countryIMGgallery' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'SUPER_ADMIN'
  )
);

-- Allow authenticated users to delete files
CREATE POLICY "Allow authenticated deletes from countryIMGgallery"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'countryIMGgallery' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'SUPER_ADMIN'
  )
);

-- Allow public read access to files
CREATE POLICY "Allow public read access to countryIMGgallery"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'countryIMGgallery');
