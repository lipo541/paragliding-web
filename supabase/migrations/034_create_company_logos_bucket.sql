-- =====================================================
-- Migration 034: Create Company Logos Storage Bucket
-- =====================================================
-- Purpose: Create storage bucket for company logo uploads
-- =====================================================

-- 1. Create the storage bucket for company logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'company-logos',
    'company-logos',
    true,  -- Public bucket for logos
    5242880,  -- 5MB max file size
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Policies

-- Allow authenticated users to upload their company logo
CREATE POLICY "Users can upload own company logo"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'company-logos'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Allow authenticated users to update their own logo
CREATE POLICY "Users can update own company logo"
    ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'company-logos'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Allow authenticated users to delete their own logo
CREATE POLICY "Users can delete own company logo"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'company-logos'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Allow public read access to all company logos
CREATE POLICY "Public can view company logos"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'company-logos');
