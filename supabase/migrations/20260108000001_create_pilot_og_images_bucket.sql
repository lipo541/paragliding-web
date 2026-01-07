-- Create storage bucket for pilot Open Graph images
-- These are used for social media previews of pilot profiles

-- Create bucket for pilot OG images (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pilot-og-images',
  'pilot-og-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for pilot-og-images bucket

-- Public can view OG images
DROP POLICY IF EXISTS "Public can view pilot OG images" ON storage.objects;
CREATE POLICY "Public can view pilot OG images"
ON storage.objects FOR SELECT
USING (bucket_id = 'pilot-og-images');

-- Authenticated users can upload OG images
DROP POLICY IF EXISTS "Authenticated users can upload pilot OG images" ON storage.objects;
CREATE POLICY "Authenticated users can upload pilot OG images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'pilot-og-images');

-- Users can update their own OG images
DROP POLICY IF EXISTS "Users can update own pilot OG images" ON storage.objects;
CREATE POLICY "Users can update own pilot OG images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'pilot-og-images');

-- Users can delete their own OG images
DROP POLICY IF EXISTS "Users can delete own pilot OG images" ON storage.objects;
CREATE POLICY "Users can delete own pilot OG images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'pilot-og-images');
