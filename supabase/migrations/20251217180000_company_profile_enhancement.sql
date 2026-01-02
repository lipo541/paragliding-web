-- =====================================================
-- Migration: Company Profile Enhancement (Part 1)
-- =====================================================
-- Purpose: Add gallery, cover image, and videos support
-- for company public profiles (similar to pilots)
-- =====================================================

-- 1. Add cover image for hero section
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- 2. Add gallery images (JSONB for flexibility)
-- Structure: [{ "url": "...", "caption_ka": "...", "caption_en": "...", "order": 1 }, ...]
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]'::jsonb;

-- 3. Add video URLs array (YouTube links)
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS video_urls TEXT[] DEFAULT '{}';

-- 4. Add comments for documentation
COMMENT ON COLUMN public.companies.cover_image_url IS 'Hero/cover image URL for company profile page';
COMMENT ON COLUMN public.companies.gallery_images IS 'JSON array of gallery images: [{"url": "...", "caption_ka": "...", "caption_en": "...", "order": 1}]';
COMMENT ON COLUMN public.companies.video_urls IS 'Array of YouTube video URLs for company profile';

-- =====================================================
-- Migration Complete (Part 1)
-- =====================================================
