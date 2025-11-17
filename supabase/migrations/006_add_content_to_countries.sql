-- Add content column to countries table for rich content
ALTER TABLE public.countries 
ADD COLUMN IF NOT EXISTS content JSONB;

-- Add is_active column
ALTER TABLE public.countries 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add comment
COMMENT ON COLUMN public.countries.content IS 'Rich content including images, descriptions, and history in multiple languages';
COMMENT ON COLUMN public.countries.is_active IS 'Whether the country page is active/published';
