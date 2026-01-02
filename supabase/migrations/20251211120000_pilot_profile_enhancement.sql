-- =====================================================
-- Migration: Pilot Profile Enhancement
-- =====================================================
-- Purpose: Add gallery, cover image, videos, languages 
-- and location support for pilot public profiles
-- =====================================================

-- 1. Add missing English name fields
ALTER TABLE public.pilots
ADD COLUMN IF NOT EXISTS first_name_en TEXT,
ADD COLUMN IF NOT EXISTS last_name_en TEXT;

-- 2. Add cover image for hero section
ALTER TABLE public.pilots
ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- 3. Add gallery images (JSONB for flexibility)
-- Structure: [{ "url": "...", "caption_ka": "...", "caption_en": "...", "order": 1 }, ...]
ALTER TABLE public.pilots
ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]'::jsonb;

-- 4. Add video URLs array
ALTER TABLE public.pilots
ADD COLUMN IF NOT EXISTS video_urls TEXT[] DEFAULT '{}';

-- 5. Add spoken languages (for client communication)
-- Values: ['ka', 'en', 'ru', 'de', 'tr', 'ar', 'he', 'fr', 'es', ...]
ALTER TABLE public.pilots
ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}';

-- 6. Add location IDs (where pilot operates)
ALTER TABLE public.pilots
ADD COLUMN IF NOT EXISTS location_ids UUID[] DEFAULT '{}';

-- 7. Create index for location search
CREATE INDEX IF NOT EXISTS idx_pilots_location_ids ON public.pilots USING GIN (location_ids);

-- 8. Create index for language search
CREATE INDEX IF NOT EXISTS idx_pilots_languages ON public.pilots USING GIN (languages);

-- 9. Add comments for documentation
COMMENT ON COLUMN public.pilots.first_name_en IS 'English first name for international display';
COMMENT ON COLUMN public.pilots.last_name_en IS 'English last name for international display';
COMMENT ON COLUMN public.pilots.cover_image_url IS 'Hero/cover image URL for pilot profile page';
COMMENT ON COLUMN public.pilots.gallery_images IS 'JSON array of gallery images with captions: [{"url": "...", "caption_ka": "...", "caption_en": "...", "order": 1}]';
COMMENT ON COLUMN public.pilots.video_urls IS 'Array of video URLs (YouTube, Vimeo embeds)';
COMMENT ON COLUMN public.pilots.languages IS 'Languages pilot speaks for client communication: [''ka'', ''en'', ''ru'', ...]';
COMMENT ON COLUMN public.pilots.location_ids IS 'Array of location UUIDs where pilot operates';

-- =====================================================
-- Migration Complete
-- =====================================================
