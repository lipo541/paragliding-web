-- Create storage buckets for pilot media
-- Run this migration to create necessary storage buckets

-- Insert bucket for pilot gallery images (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pilot-gallery',
  'pilot-gallery',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Insert bucket for pilot avatars (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pilot-avatars',
  'pilot-avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Insert bucket for pilot certificates/documents (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pilot-certificates',
  'pilot-certificates',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for pilot-gallery bucket (drop if exists first)
DROP POLICY IF EXISTS "Public can view pilot gallery images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to pilot-gallery" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own pilot gallery images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own pilot gallery images" ON storage.objects;

CREATE POLICY "Public can view pilot gallery images"
ON storage.objects FOR SELECT
USING (bucket_id = 'pilot-gallery');

CREATE POLICY "Authenticated users can upload to pilot-gallery"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'pilot-gallery');

CREATE POLICY "Users can update their own pilot gallery images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'pilot-gallery' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own pilot gallery images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'pilot-gallery' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Storage policies for pilot-avatars bucket (drop if exists first)
DROP POLICY IF EXISTS "Public can view pilot avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to pilot-avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

CREATE POLICY "Public can view pilot avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'pilot-avatars');

CREATE POLICY "Authenticated users can upload to pilot-avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'pilot-avatars');

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'pilot-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'pilot-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Storage policies for pilot-certificates bucket (drop if exists first)
DROP POLICY IF EXISTS "Public can view pilot certificates" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to pilot-certificates" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own certificates" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own certificates" ON storage.objects;

CREATE POLICY "Public can view pilot certificates"
ON storage.objects FOR SELECT
USING (bucket_id = 'pilot-certificates');

CREATE POLICY "Authenticated users can upload to pilot-certificates"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'pilot-certificates');

CREATE POLICY "Users can update their own certificates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'pilot-certificates' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own certificates"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'pilot-certificates' AND (storage.foldername(name))[1] = auth.uid()::text);
