-- =====================================================
-- Service Images Storage Bucket Migration
-- Created: 2025-12-23
-- Description: Creates storage bucket for additional services gallery images
-- =====================================================

-- Create bucket for service images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'service-images',
  'service-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- Storage RLS Policies
-- =====================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public can view service images" ON storage.objects;
DROP POLICY IF EXISTS "Super admins can upload service images" ON storage.objects;
DROP POLICY IF EXISTS "Super admins can update service images" ON storage.objects;
DROP POLICY IF EXISTS "Super admins can delete service images" ON storage.objects;

-- Public read access
CREATE POLICY "Public can view service images"
ON storage.objects FOR SELECT
USING (bucket_id = 'service-images');

-- Super admin upload
CREATE POLICY "Super admins can upload service images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'service-images' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
  )
);

-- Super admin update
CREATE POLICY "Super admins can update service images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'service-images' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
  )
);

-- Super admin delete
CREATE POLICY "Super admins can delete service images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'service-images' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
  )
);
