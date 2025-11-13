-- Create countries table
CREATE TABLE IF NOT EXISTS countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  og_image_url TEXT,
  
  -- ქართული
  name_ka TEXT NOT NULL,
  slug_ka TEXT NOT NULL UNIQUE,
  seo_title_ka TEXT,
  seo_description_ka TEXT,
  og_title_ka TEXT,
  og_description_ka TEXT,
  
  -- ინგლისური
  name_en TEXT NOT NULL,
  slug_en TEXT NOT NULL UNIQUE,
  seo_title_en TEXT,
  seo_description_en TEXT,
  og_title_en TEXT,
  og_description_en TEXT,
  
  -- რუსული
  name_ru TEXT NOT NULL,
  slug_ru TEXT NOT NULL UNIQUE,
  seo_title_ru TEXT,
  seo_description_ru TEXT,
  og_title_ru TEXT,
  og_description_ru TEXT,
  
  -- არაბული
  name_ar TEXT,
  slug_ar TEXT UNIQUE,
  seo_title_ar TEXT,
  seo_description_ar TEXT,
  og_title_ar TEXT,
  og_description_ar TEXT,
  
  -- გერმანული
  name_de TEXT,
  slug_de TEXT UNIQUE,
  seo_title_de TEXT,
  seo_description_de TEXT,
  og_title_de TEXT,
  og_description_de TEXT,
  
  -- თურქული
  name_tr TEXT,
  slug_tr TEXT UNIQUE,
  seo_title_tr TEXT,
  seo_description_tr TEXT,
  og_title_tr TEXT,
  og_description_tr TEXT
);

-- Create locations table (subcategories of countries)
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  og_image_url TEXT,
  map_iframe_url TEXT,
  
  -- ქართული
  name_ka TEXT NOT NULL,
  slug_ka TEXT NOT NULL,
  seo_title_ka TEXT,
  seo_description_ka TEXT,
  og_title_ka TEXT,
  og_description_ka TEXT,
  
  -- ინგლისური
  name_en TEXT NOT NULL,
  slug_en TEXT NOT NULL,
  seo_title_en TEXT,
  seo_description_en TEXT,
  og_title_en TEXT,
  og_description_en TEXT,
  
  -- რუსული
  name_ru TEXT NOT NULL,
  slug_ru TEXT NOT NULL,
  seo_title_ru TEXT,
  seo_description_ru TEXT,
  og_title_ru TEXT,
  og_description_ru TEXT,
  
  -- არაბული
  name_ar TEXT,
  slug_ar TEXT,
  seo_title_ar TEXT,
  seo_description_ar TEXT,
  og_title_ar TEXT,
  og_description_ar TEXT,
  
  -- გერმანული
  name_de TEXT,
  slug_de TEXT,
  seo_title_de TEXT,
  seo_description_de TEXT,
  og_title_de TEXT,
  og_description_de TEXT,
  
  -- თურქული
  name_tr TEXT,
  slug_tr TEXT,
  seo_title_tr TEXT,
  seo_description_tr TEXT,
  og_title_tr TEXT,
  og_description_tr TEXT,
  
  -- Unique constraint: slug უნიკალური უნდა იყოს ქვეყნის ფარგლებში
  CONSTRAINT unique_location_slug_ka_per_country UNIQUE (country_id, slug_ka),
  CONSTRAINT unique_location_slug_en_per_country UNIQUE (country_id, slug_en),
  CONSTRAINT unique_location_slug_ru_per_country UNIQUE (country_id, slug_ru)
);

-- Indexes for countries
CREATE INDEX idx_countries_slug_ka ON countries(slug_ka);
CREATE INDEX idx_countries_slug_en ON countries(slug_en);
CREATE INDEX idx_countries_slug_ru ON countries(slug_ru);
CREATE INDEX idx_countries_slug_ar ON countries(slug_ar);
CREATE INDEX idx_countries_slug_de ON countries(slug_de);
CREATE INDEX idx_countries_slug_tr ON countries(slug_tr);
CREATE INDEX idx_countries_created_at ON countries(created_at DESC);

-- Indexes for locations
CREATE INDEX idx_locations_country_id ON locations(country_id);
CREATE INDEX idx_locations_slug_ka ON locations(slug_ka);
CREATE INDEX idx_locations_slug_en ON locations(slug_en);
CREATE INDEX idx_locations_slug_ru ON locations(slug_ru);
CREATE INDEX idx_locations_created_at ON locations(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-updating updated_at
CREATE TRIGGER update_countries_updated_at
  BEFORE UPDATE ON countries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for countries
-- ყველას შეუძლია წაკითხვა
CREATE POLICY "Anyone can view countries"
  ON countries FOR SELECT
  USING (true);

-- მხოლოდ SUPER_ADMIN-ს შეუძლია დამატება
CREATE POLICY "Only SUPER_ADMIN can insert countries"
  ON countries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

-- მხოლოდ SUPER_ADMIN-ს შეუძლია განახლება
CREATE POLICY "Only SUPER_ADMIN can update countries"
  ON countries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

-- მხოლოდ SUPER_ADMIN-ს შეუძლია წაშლა
CREATE POLICY "Only SUPER_ADMIN can delete countries"
  ON countries FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

-- RLS Policies for locations
-- ყველას შეუძლია წაკითხვა
CREATE POLICY "Anyone can view locations"
  ON locations FOR SELECT
  USING (true);

-- მხოლოდ SUPER_ADMIN-ს შეუძლია დამატება
CREATE POLICY "Only SUPER_ADMIN can insert locations"
  ON locations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

-- მხოლოდ SUPER_ADMIN-ს შეუძლია განახლება
CREATE POLICY "Only SUPER_ADMIN can update locations"
  ON locations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

-- მხოლოდ SUPER_ADMIN-ს შეუძლია წაშლა
CREATE POLICY "Only SUPER_ADMIN can delete locations"
  ON locations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

-- Comments for documentation
COMMENT ON TABLE countries IS 'ქვეყნების ცხრილი - მთავარი კატეგორიები';
COMMENT ON TABLE locations IS 'ლოკაციების ცხრილი - ქვეყნების subcategories';
COMMENT ON COLUMN locations.country_id IS 'ლოკაციის მშობელი ქვეყანა';
COMMENT ON COLUMN locations.map_iframe_url IS 'Google Maps embed iframe URL for displaying location on map';
