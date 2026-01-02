-- =====================================================
-- Additional Services System Migration
-- Created: 2025-12-23
-- Description: Creates tables for additional services 
-- (drone filming, ATV, photo/video, etc.) with multi-language support
-- =====================================================

-- =====================================================
-- 1. SERVICE CATEGORIES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Unique identifier slug
  slug TEXT NOT NULL UNIQUE,
  
  -- Multi-language names (6 languages)
  name_ka TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_ru TEXT,
  name_ar TEXT,
  name_de TEXT,
  name_tr TEXT,
  
  -- Icon (Lucide icon name)
  icon TEXT DEFAULT 'package',
  
  -- Sorting and status
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE public.service_categories IS 'Categories for additional services (drone, transport, photo/video, etc.)';

-- =====================================================
-- 2. SERVICE STATUS ENUM
-- =====================================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_status') THEN
    CREATE TYPE public.service_status AS ENUM ('draft', 'pending', 'active', 'hidden');
  END IF;
END $$;

-- =====================================================
-- 3. ADDITIONAL SERVICES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.additional_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Category reference
  category_id UUID REFERENCES public.service_categories(id) ON DELETE SET NULL,
  
  -- =====================================================
  -- Multi-language names (6 languages)
  -- =====================================================
  name_ka TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_ru TEXT,
  name_ar TEXT,
  name_de TEXT,
  name_tr TEXT,
  
  -- =====================================================
  -- Multi-language descriptions (6 languages)
  -- =====================================================
  description_ka TEXT,
  description_en TEXT,
  description_ru TEXT,
  description_ar TEXT,
  description_de TEXT,
  description_tr TEXT,
  
  -- =====================================================
  -- Multi-language slugs (6 languages)
  -- =====================================================
  slug_ka TEXT NOT NULL,
  slug_en TEXT NOT NULL,
  slug_ru TEXT,
  slug_ar TEXT,
  slug_de TEXT,
  slug_tr TEXT,
  
  -- =====================================================
  -- SEO: Meta Title (6 languages)
  -- =====================================================
  seo_title_ka TEXT,
  seo_title_en TEXT,
  seo_title_ru TEXT,
  seo_title_ar TEXT,
  seo_title_de TEXT,
  seo_title_tr TEXT,
  
  -- =====================================================
  -- SEO: Meta Description (6 languages)
  -- =====================================================
  seo_description_ka TEXT,
  seo_description_en TEXT,
  seo_description_ru TEXT,
  seo_description_ar TEXT,
  seo_description_de TEXT,
  seo_description_tr TEXT,
  
  -- =====================================================
  -- OG: Title (6 languages)
  -- =====================================================
  og_title_ka TEXT,
  og_title_en TEXT,
  og_title_ru TEXT,
  og_title_ar TEXT,
  og_title_de TEXT,
  og_title_tr TEXT,
  
  -- =====================================================
  -- OG: Description (6 languages)
  -- =====================================================
  og_description_ka TEXT,
  og_description_en TEXT,
  og_description_ru TEXT,
  og_description_ar TEXT,
  og_description_de TEXT,
  og_description_tr TEXT,
  
  -- =====================================================
  -- OG Image (shared across languages)
  -- =====================================================
  og_image TEXT,
  
  -- =====================================================
  -- Location IDs (UUID array with GIN index)
  -- Services are linked to multiple locations
  -- =====================================================
  location_ids UUID[] DEFAULT '{}',
  
  -- =====================================================
  -- Gallery Images (JSONB)
  -- Structure: [{ 
  --   "url": "https://...", 
  --   "alt_ka": "...", "alt_en": "...", "alt_ru": "...", 
  --   "alt_ar": "...", "alt_de": "...", "alt_tr": "...", 
  --   "order": 1 
  -- }]
  -- =====================================================
  gallery_images JSONB DEFAULT '[]'::jsonb,
  
  -- =====================================================
  -- Video URLs (YouTube/Vimeo)
  -- =====================================================
  video_urls TEXT[] DEFAULT '{}',
  
  -- =====================================================
  -- Pricing (JSONB - shared/localized split pattern)
  -- Structure:
  -- {
  --   "shared_pricing": [
  --     { 
  --       "id": "option-uuid", 
  --       "type": "fixed" | "per_minute" | "per_hour" | "per_person",
  --       "duration_minutes": 10, // optional, for time-based
  --       "price_gel": 100, 
  --       "price_usd": 35, 
  --       "price_eur": 30 
  --     }
  --   ],
  --   "ka": { 
  --     "options": [{ 
  --       "shared_id": "option-uuid", 
  --       "name": "პაკეტი", 
  --       "description": "...",
  --       "features": ["feature1", "feature2"]
  --     }] 
  --   },
  --   "en": { 
  --     "options": [{ 
  --       "shared_id": "option-uuid", 
  --       "name": "Package", 
  --       "description": "...",
  --       "features": ["feature1", "feature2"]
  --     }] 
  --   }
  -- }
  -- =====================================================
  pricing JSONB DEFAULT '{}'::jsonb,
  
  -- =====================================================
  -- Status
  -- =====================================================
  status service_status DEFAULT 'draft',
  
  -- =====================================================
  -- Timestamps
  -- =====================================================
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE public.additional_services IS 'Additional services like drone filming, ATV rides, photo/video packages linked to locations';

-- =====================================================
-- 4. INDEXES
-- =====================================================

-- GIN index for location_ids array (efficient contains queries)
CREATE INDEX IF NOT EXISTS idx_additional_services_location_ids 
  ON public.additional_services USING GIN (location_ids);

-- Category index for filtering
CREATE INDEX IF NOT EXISTS idx_additional_services_category_id 
  ON public.additional_services (category_id);

-- Status index for filtering active services
CREATE INDEX IF NOT EXISTS idx_additional_services_status 
  ON public.additional_services (status);

-- Unique slug indexes (prevent duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS idx_additional_services_slug_ka 
  ON public.additional_services (slug_ka);
CREATE UNIQUE INDEX IF NOT EXISTS idx_additional_services_slug_en 
  ON public.additional_services (slug_en);

-- Category slug index
CREATE INDEX IF NOT EXISTS idx_service_categories_slug 
  ON public.service_categories (slug);

-- Category active index
CREATE INDEX IF NOT EXISTS idx_service_categories_is_active 
  ON public.service_categories (is_active);

-- =====================================================
-- 5. UPDATED_AT TRIGGER FUNCTIONS
-- =====================================================

-- Trigger function for service_categories
CREATE OR REPLACE FUNCTION public.handle_service_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for additional_services
CREATE OR REPLACE FUNCTION public.handle_additional_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS on_service_categories_updated ON public.service_categories;
CREATE TRIGGER on_service_categories_updated
  BEFORE UPDATE ON public.service_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_service_categories_updated_at();

DROP TRIGGER IF EXISTS on_additional_services_updated ON public.additional_services;
CREATE TRIGGER on_additional_services_updated
  BEFORE UPDATE ON public.additional_services
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_additional_services_updated_at();

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.additional_services ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6.1 SERVICE CATEGORIES POLICIES
-- =====================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public can view active categories" ON public.service_categories;
DROP POLICY IF EXISTS "Super admins can manage categories" ON public.service_categories;
DROP POLICY IF EXISTS "Super admins can insert categories" ON public.service_categories;
DROP POLICY IF EXISTS "Super admins can update categories" ON public.service_categories;
DROP POLICY IF EXISTS "Super admins can delete categories" ON public.service_categories;

-- Public read access for active categories
CREATE POLICY "Public can view active categories" 
  ON public.service_categories
  FOR SELECT 
  USING (is_active = true);

-- Super admin insert
CREATE POLICY "Super admins can insert categories" 
  ON public.service_categories
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
  );

-- Super admin update
CREATE POLICY "Super admins can update categories" 
  ON public.service_categories
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
  );

-- Super admin delete
CREATE POLICY "Super admins can delete categories" 
  ON public.service_categories
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
  );

-- =====================================================
-- 6.2 ADDITIONAL SERVICES POLICIES
-- =====================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public can view active services" ON public.additional_services;
DROP POLICY IF EXISTS "Super admins can manage services" ON public.additional_services;
DROP POLICY IF EXISTS "Super admins can insert services" ON public.additional_services;
DROP POLICY IF EXISTS "Super admins can update services" ON public.additional_services;
DROP POLICY IF EXISTS "Super admins can delete services" ON public.additional_services;

-- Public read access for active services
CREATE POLICY "Public can view active services" 
  ON public.additional_services
  FOR SELECT 
  USING (status = 'active');

-- Super admin insert
CREATE POLICY "Super admins can insert services" 
  ON public.additional_services
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
  );

-- Super admin update
CREATE POLICY "Super admins can update services" 
  ON public.additional_services
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
  );

-- Super admin delete
CREATE POLICY "Super admins can delete services" 
  ON public.additional_services
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
  );

-- =====================================================
-- 7. GRANT PERMISSIONS
-- =====================================================

-- Grant select to anon and authenticated for public read
GRANT SELECT ON public.service_categories TO anon, authenticated;
GRANT SELECT ON public.additional_services TO anon, authenticated;

-- Grant all to authenticated (RLS will restrict)
GRANT INSERT, UPDATE, DELETE ON public.service_categories TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.additional_services TO authenticated;

-- =====================================================
-- 8. INSERT DEFAULT CATEGORIES
-- =====================================================

INSERT INTO public.service_categories (slug, name_ka, name_en, name_ru, name_ar, name_de, name_tr, icon, sort_order, is_active)
VALUES 
  ('photo-video', 'ფოტო/ვიდეო', 'Photo/Video', 'Фото/Видео', 'صور/فيديو', 'Foto/Video', 'Fotoğraf/Video', 'camera', 1, true),
  ('drone', 'დრონით გადაღება', 'Drone Filming', 'Съемка дроном', 'تصوير بطائرة بدون طيار', 'Drohnenaufnahmen', 'Drone Çekimi', 'plane', 2, true),
  ('transport', 'ტრანსპორტი', 'Transport', 'Транспорт', 'النقل', 'Transport', 'Ulaşım', 'car', 3, true),
  ('equipment', 'აღჭურვილობა', 'Equipment Rental', 'Аренда оборудования', 'تأجير المعدات', 'Ausrüstungsverleih', 'Ekipman Kiralama', 'backpack', 4, true),
  ('training', 'ტრენინგი', 'Training', 'Обучение', 'تدريب', 'Training', 'Eğitim', 'graduation-cap', 5, true),
  ('accommodation', 'განთავსება', 'Accommodation', 'Размещение', 'إقامة', 'Unterkunft', 'Konaklama', 'hotel', 6, true),
  ('other', 'სხვა', 'Other', 'Другое', 'آخر', 'Sonstiges', 'Diğer', 'package', 99, true)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- Migration Complete!
-- =====================================================
