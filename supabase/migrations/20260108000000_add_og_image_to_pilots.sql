-- Add og_image column to pilots table
-- This column is needed for Open Graph image URLs used in SEO

ALTER TABLE pilots ADD COLUMN IF NOT EXISTS og_image TEXT;

COMMENT ON COLUMN pilots.og_image IS 'URL for Open Graph/social media preview image';
