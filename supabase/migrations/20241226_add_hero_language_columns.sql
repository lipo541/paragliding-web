-- =====================================================
-- Add missing language columns to hero tables
-- =====================================================
-- Adds ar, de, tr language support to hero_slides and hero_slide_buttons
-- =====================================================

-- Add missing columns to hero_slides
ALTER TABLE hero_slides ADD COLUMN IF NOT EXISTS title_ar TEXT;
ALTER TABLE hero_slides ADD COLUMN IF NOT EXISTS title_de TEXT;
ALTER TABLE hero_slides ADD COLUMN IF NOT EXISTS title_tr TEXT;
ALTER TABLE hero_slides ADD COLUMN IF NOT EXISTS description_ar TEXT;
ALTER TABLE hero_slides ADD COLUMN IF NOT EXISTS description_de TEXT;
ALTER TABLE hero_slides ADD COLUMN IF NOT EXISTS description_tr TEXT;

-- Update existing rows with default values
UPDATE hero_slides SET 
  title_ar = COALESCE(title_ar, title_en),
  title_de = COALESCE(title_de, title_en),
  title_tr = COALESCE(title_tr, title_en),
  description_ar = COALESCE(description_ar, description_en),
  description_de = COALESCE(description_de, description_en),
  description_tr = COALESCE(description_tr, description_en);

-- Make title columns NOT NULL after setting defaults
ALTER TABLE hero_slides ALTER COLUMN title_ar SET NOT NULL;
ALTER TABLE hero_slides ALTER COLUMN title_de SET NOT NULL;
ALTER TABLE hero_slides ALTER COLUMN title_tr SET NOT NULL;

-- Add missing columns to hero_slide_buttons
ALTER TABLE hero_slide_buttons ADD COLUMN IF NOT EXISTS text_ar TEXT;
ALTER TABLE hero_slide_buttons ADD COLUMN IF NOT EXISTS text_de TEXT;
ALTER TABLE hero_slide_buttons ADD COLUMN IF NOT EXISTS text_tr TEXT;

-- Update existing button rows with default values
UPDATE hero_slide_buttons SET 
  text_ar = COALESCE(text_ar, text_en),
  text_de = COALESCE(text_de, text_en),
  text_tr = COALESCE(text_tr, text_en);

-- Make text columns NOT NULL after setting defaults
ALTER TABLE hero_slide_buttons ALTER COLUMN text_ar SET NOT NULL;
ALTER TABLE hero_slide_buttons ALTER COLUMN text_de SET NOT NULL;
ALTER TABLE hero_slide_buttons ALTER COLUMN text_tr SET NOT NULL;
