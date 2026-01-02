-- =====================================================
-- Hero Slider System Migration
-- =====================================================
-- Created: 2024-12-25
-- Description: Hero slider tables, storage bucket, and RLS policies
-- =====================================================

-- =====================================================
-- 1. Hero Slides Table
-- =====================================================

CREATE TABLE IF NOT EXISTS hero_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- სურათები (Light/Dark რეჟიმი)
  image_url_light TEXT NOT NULL,
  image_url_dark TEXT NOT NULL,
  
  -- მრავალენოვანი ტექსტი (6 ენა: ka, en, ru, ar, de, tr)
  title_ka TEXT NOT NULL,
  title_en TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  title_de TEXT NOT NULL,
  title_tr TEXT NOT NULL,
  description_ka TEXT,
  description_en TEXT,
  description_ru TEXT,
  description_ar TEXT,
  description_de TEXT,
  description_tr TEXT,
  
  -- კონტროლი
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  -- მეტადატა
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Index for ordering
CREATE INDEX IF NOT EXISTS idx_hero_slides_order ON hero_slides(display_order);
CREATE INDEX IF NOT EXISTS idx_hero_slides_active ON hero_slides(is_active);

-- =====================================================
-- 2. Hero Slide Buttons Table
-- =====================================================

CREATE TABLE IF NOT EXISTS hero_slide_buttons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slide_id UUID NOT NULL REFERENCES hero_slides(id) ON DELETE CASCADE,
  
  -- ღილაკის ტექსტი (6 ენა: ka, en, ru, ar, de, tr)
  text_ka TEXT NOT NULL,
  text_en TEXT NOT NULL,
  text_ru TEXT NOT NULL,
  text_ar TEXT NOT NULL,
  text_de TEXT NOT NULL,
  text_tr TEXT NOT NULL,
  
  -- მოქმედების სისტემა
  action_type TEXT NOT NULL CHECK (action_type IN (
    'link',        -- პირდაპირი URL
    'contact',     -- კონტაქტის გვერდი
    'pilot',       -- პილოტის პროფილი
    'location',    -- ლოკაციის გვერდი
    'company',     -- კომპანიის გვერდი
    'service'      -- სერვისის გვერდი
  )),
  
  -- მოქმედების მონაცემები (action_type-ზე დამოკიდებული)
  action_url TEXT,
  pilot_id UUID REFERENCES pilots(id) ON DELETE SET NULL,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  service_id UUID,  -- services ცხრილი შეიძლება არ არსებობდეს
  
  -- გარე ბმულის ოფცია
  open_in_new_tab BOOLEAN DEFAULT false,
  
  -- სტილი
  variant TEXT DEFAULT 'primary' CHECK (variant IN ('primary', 'secondary', 'outline')),
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for slide buttons
CREATE INDEX IF NOT EXISTS idx_hero_buttons_slide ON hero_slide_buttons(slide_id);
CREATE INDEX IF NOT EXISTS idx_hero_buttons_order ON hero_slide_buttons(display_order);

-- =====================================================
-- 3. Updated At Trigger
-- =====================================================

CREATE OR REPLACE FUNCTION update_hero_slides_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_hero_slides_updated_at ON hero_slides;
CREATE TRIGGER trigger_hero_slides_updated_at
  BEFORE UPDATE ON hero_slides
  FOR EACH ROW
  EXECUTE FUNCTION update_hero_slides_updated_at();

-- =====================================================
-- 4. Row Level Security Policies
-- =====================================================

-- Enable RLS
ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_slide_buttons ENABLE ROW LEVEL SECURITY;

-- Hero Slides Policies
-- Public can view active slides
DROP POLICY IF EXISTS "Public can view active hero slides" ON hero_slides;
CREATE POLICY "Public can view active hero slides" ON hero_slides
  FOR SELECT USING (is_active = true);

-- Super admin full access
DROP POLICY IF EXISTS "Super admin full access to hero slides" ON hero_slides;
CREATE POLICY "Super admin full access to hero slides" ON hero_slides
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

-- Hero Slide Buttons Policies
-- Public can view buttons of active slides
DROP POLICY IF EXISTS "Public can view hero buttons" ON hero_slide_buttons;
CREATE POLICY "Public can view hero buttons" ON hero_slide_buttons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM hero_slides 
      WHERE hero_slides.id = hero_slide_buttons.slide_id 
      AND hero_slides.is_active = true
    )
  );

-- Super admin full access to buttons
DROP POLICY IF EXISTS "Super admin full access to hero buttons" ON hero_slide_buttons;
CREATE POLICY "Super admin full access to hero buttons" ON hero_slide_buttons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

-- =====================================================
-- 5. Storage Bucket for Hero Images
-- =====================================================

-- Create bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hero-images',
  'hero-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Storage policies
-- Public can view hero images
DROP POLICY IF EXISTS "Public can view hero images" ON storage.objects;
CREATE POLICY "Public can view hero images" ON storage.objects
  FOR SELECT USING (bucket_id = 'hero-images');

-- Super admin can upload hero images
DROP POLICY IF EXISTS "Super admin can upload hero images" ON storage.objects;
CREATE POLICY "Super admin can upload hero images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'hero-images' 
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

-- Super admin can update hero images
DROP POLICY IF EXISTS "Super admin can update hero images" ON storage.objects;
CREATE POLICY "Super admin can update hero images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'hero-images' 
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

-- Super admin can delete hero images
DROP POLICY IF EXISTS "Super admin can delete hero images" ON storage.objects;
CREATE POLICY "Super admin can delete hero images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'hero-images' 
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

-- =====================================================
-- 6. Grant Permissions
-- =====================================================

GRANT SELECT ON hero_slides TO anon, authenticated;
GRANT ALL ON hero_slides TO authenticated;

GRANT SELECT ON hero_slide_buttons TO anon, authenticated;
GRANT ALL ON hero_slide_buttons TO authenticated;

-- =====================================================
-- Migration Complete
-- =====================================================
