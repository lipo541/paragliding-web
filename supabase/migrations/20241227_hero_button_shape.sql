-- =====================================================
-- Add button shape column to hero_slide_buttons
-- =====================================================

-- Add shape column
ALTER TABLE hero_slide_buttons ADD COLUMN IF NOT EXISTS shape TEXT DEFAULT 'rounded';

-- Update constraint for variant to new values
ALTER TABLE hero_slide_buttons DROP CONSTRAINT IF EXISTS hero_slide_buttons_variant_check;
ALTER TABLE hero_slide_buttons ADD CONSTRAINT hero_slide_buttons_variant_check 
  CHECK (variant IN ('glass-dark', 'glass-light', 'glass-primary', 'primary', 'secondary', 'outline'));

-- Add constraint for shape
ALTER TABLE hero_slide_buttons ADD CONSTRAINT hero_slide_buttons_shape_check 
  CHECK (shape IN ('rounded', 'pill', 'square'));

-- Update existing rows to new variant names
UPDATE hero_slide_buttons SET variant = 'glass-dark' WHERE variant = 'primary';
UPDATE hero_slide_buttons SET variant = 'glass-light' WHERE variant = 'secondary';
UPDATE hero_slide_buttons SET variant = 'glass-primary' WHERE variant = 'outline';
