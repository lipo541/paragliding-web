-- =====================================================
-- Migration 038: Create Pilot Storage Buckets
-- =====================================================
-- Purpose: Create storage buckets for pilot photos and certificates
-- Buckets:
--   - pilot-avatars: Profile photos
--   - pilot-certificates: Equipment and tandem certificates
-- =====================================================

-- 1. Create the storage bucket for pilot avatars/photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'pilot-avatars',
    'pilot-avatars',
    true,  -- Public bucket for profile photos
    5242880,  -- 5MB max file size
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Create the storage bucket for pilot certificates
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'pilot-certificates',
    'pilot-certificates',
    true,  -- Public bucket for certificates (will be viewed by users)
    10485760,  -- 10MB max file size (certificates may be larger PDFs/images)
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 3. Storage Policies for pilot-avatars bucket
-- =====================================================

-- Allow authenticated users to upload their pilot avatar
CREATE POLICY "Users can upload own pilot avatar"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'pilot-avatars'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Allow authenticated users to update their own avatar
CREATE POLICY "Users can update own pilot avatar"
    ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'pilot-avatars'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Allow authenticated users to delete their own avatar
CREATE POLICY "Users can delete own pilot avatar"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'pilot-avatars'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Allow public read access to all pilot avatars
CREATE POLICY "Public can view pilot avatars"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'pilot-avatars');

-- =====================================================
-- 4. Storage Policies for pilot-certificates bucket
-- =====================================================

-- Allow authenticated users to upload their certificates
CREATE POLICY "Users can upload own pilot certificates"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'pilot-certificates'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Allow authenticated users to update their own certificates
CREATE POLICY "Users can update own pilot certificates"
    ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'pilot-certificates'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Allow authenticated users to delete their own certificates
CREATE POLICY "Users can delete own pilot certificates"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'pilot-certificates'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Allow public read access to certificates (for verification display)
CREATE POLICY "Public can view pilot certificates"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'pilot-certificates');

-- =====================================================
-- 5. Super Admin policies for both buckets
-- =====================================================

-- Super admin can upload to pilot-avatars
CREATE POLICY "Super admin can upload pilot avatars"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'pilot-avatars'
        AND EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'SUPER_ADMIN'
        )
    );

-- Super admin can update pilot-avatars
CREATE POLICY "Super admin can update pilot avatars"
    ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'pilot-avatars'
        AND EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'SUPER_ADMIN'
        )
    );

-- Super admin can delete pilot-avatars
CREATE POLICY "Super admin can delete pilot avatars"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'pilot-avatars'
        AND EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'SUPER_ADMIN'
        )
    );

-- Super admin can upload to pilot-certificates
CREATE POLICY "Super admin can upload pilot certificates"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'pilot-certificates'
        AND EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'SUPER_ADMIN'
        )
    );

-- Super admin can update pilot-certificates
CREATE POLICY "Super admin can update pilot certificates"
    ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'pilot-certificates'
        AND EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'SUPER_ADMIN'
        )
    );

-- Super admin can delete pilot-certificates
CREATE POLICY "Super admin can delete pilot certificates"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'pilot-certificates'
        AND EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'SUPER_ADMIN'
        )
    );

-- =====================================================
-- 6. Comments for documentation
-- =====================================================
COMMENT ON POLICY "Users can upload own pilot avatar" ON storage.objects IS 'Pilots can upload their profile photos to their own folder';
COMMENT ON POLICY "Users can upload own pilot certificates" ON storage.objects IS 'Pilots can upload equipment certificates and tandem certificate to their own folder';
