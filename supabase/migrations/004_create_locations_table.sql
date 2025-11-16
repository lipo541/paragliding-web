-- Create location_pages table with JSONB content for multilingual data
-- This is different from 'locations' table - this stores full page content for each location
CREATE TABLE IF NOT EXISTS location_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  location_id UUID UNIQUE NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  content JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_location_pages_country_id ON location_pages(country_id);
CREATE INDEX IF NOT EXISTS idx_location_pages_location_id ON location_pages(location_id);
CREATE INDEX IF NOT EXISTS idx_location_pages_content ON location_pages USING GIN(content);
CREATE INDEX IF NOT EXISTS idx_location_pages_is_active ON location_pages(is_active);

-- Enable Row Level Security
ALTER TABLE location_pages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Public can view active location pages
CREATE POLICY "Public location_pages are viewable by everyone"
  ON location_pages FOR SELECT
  USING (is_active = true);

-- SUPER_ADMIN can view all location pages
CREATE POLICY "SUPER_ADMIN can view all location_pages"
  ON location_pages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

-- SUPER_ADMIN can insert location pages
CREATE POLICY "SUPER_ADMIN can insert location_pages"
  ON location_pages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

-- SUPER_ADMIN can update location pages
CREATE POLICY "SUPER_ADMIN can update location_pages"
  ON location_pages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

-- SUPER_ADMIN can delete location pages
CREATE POLICY "SUPER_ADMIN can delete location_pages"
  ON location_pages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

-- Add comment to explain JSONB structure
COMMENT ON COLUMN location_pages.content IS 'Multilingual content: shared_images + ka/en/ru/ar/de/tr languages with h1_tag, p_tag, h2_history, history_text, gallery_description, h3_flight_types, flight_types';

-- ============================================
-- JSONB Content Structure Documentation
-- ============================================

/*
location_pages.content JSONB structure:

{
  "shared_images": {
    "hero_image": {
      "url": "https://.../locations/gudauri/hero.jpg",
      "alt_ka": "გუდაურის პარაპლანერიზმი",
      "alt_en": "Paragliding in Gudauri",
      "alt_ru": "Парапланеризм в Гудаури",
      "alt_ar": "الطيران المظلي في جودوري",
      "alt_de": "Gleitschirmfliegen in Gudauri",
      "alt_tr": "Gudauri'de Yamaç Paraşütü"
    },
    "gallery": [
      {
        "url": "https://.../locations/gudauri/gallery/image-1.jpg",
        "alt_ka": "გუდაურის ხედი",
        "alt_en": "Gudauri view",
        "alt_ru": "Вид на Гудаури",
        "alt_ar": "منظر جودوري",
        "alt_de": "Gudauri Aussicht",
        "alt_tr": "Gudauri manzarası"
      }
    ]
  },
  "ka": {
    "h1_tag": "პარაპლანერიზმი გუდაურში",
    "p_tag": "საუკეთესო პარაპლანერიზმის ადგილი საქართველოში",
    "h2_history": "გუდაურის ისტორია",
    "history_text": "<p>Rich text HTML content...</p>",
    "gallery_description": "გუდაურის პარაპლანერიზმის გალერეა",
    "h3_flight_types": "ფრენის ტიპები გუდაურში",
    "flight_types": [
      {
        "name": "ტანდემ ფრენა",
        "description": "დამწყებთათვის იდეალური ფრენა ინსტრუქტორთან ერთად",
        "features": ["უსაფრთხო", "ინსტრუქტორი", "ვიდეო გადაღება"],
        "price_gel": 150,
        "price_usd": 50,
        "price_eur": 45
      }
    ]
  },
  "en": {
    "h1_tag": "Paragliding in Gudauri",
    "p_tag": "Best paragliding location in Georgia",
    "h2_history": "History of Gudauri",
    "history_text": "<p>Rich text HTML content...</p>",
    "gallery_description": "Gudauri Paragliding Gallery",
    "h3_flight_types": "Flight Types in Gudauri",
    "flight_types": [...]
  },
  "ru": { ...same structure... },
  "ar": { ...same structure... },
  "de": { ...same structure... },
  "tr": { ...same structure... }
}

Key Changes:
- shared_images: ერთი სურათი ყველა ენისთვის, მხოლოდ ALT თარგმნილია
- Languages (ka/en/ru/ar/de/tr): ტექსტური კონტენტი ცალკე თითოეული ენისთვის
- Prices: საერთო ყველა ენისთვის (GEL/USD/EUR)

Storage Structure:
locationsIMG-gallery/
├── locations/
│   ├── gudauri/
│   │   ├── hero.jpg              ← ერთი hero სურათი
│   │   └── gallery/
│   │       ├── image-1.jpg       ← საერთო gallery სურათები
│   │       ├── image-2.jpg
│   │       └── image-3.jpg
│   ├── kazbegi/
│   └── ...
*/
