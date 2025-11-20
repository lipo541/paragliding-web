-- Add new fields to promo_codes table for enhanced functionality
-- 1. Image path in Supabase Storage bucket 'Promo'
-- 2. Description fields (multilingual)
-- 3. Location-specific promo codes (many-to-many relationship)

-- Add new columns to promo_codes
ALTER TABLE promo_codes
ADD COLUMN IF NOT EXISTS image_path TEXT,
ADD COLUMN IF NOT EXISTS description_ka TEXT,
ADD COLUMN IF NOT EXISTS description_en TEXT,
ADD COLUMN IF NOT EXISTS description_ru TEXT,
ADD COLUMN IF NOT EXISTS description_ar TEXT,
ADD COLUMN IF NOT EXISTS description_de TEXT,
ADD COLUMN IF NOT EXISTS description_tr TEXT;

-- Create junction table for promo_codes <-> locations relationship
CREATE TABLE IF NOT EXISTS promo_code_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(promo_code_id, location_id)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_promo_code_locations_promo_code_id ON promo_code_locations(promo_code_id);
CREATE INDEX IF NOT EXISTS idx_promo_code_locations_location_id ON promo_code_locations(location_id);

-- Comments for documentation
COMMENT ON COLUMN promo_codes.image_path IS 'Path to image in Promo bucket (e.g., promo-code-id/image.jpg)';
COMMENT ON COLUMN promo_codes.description_ka IS 'Georgian description of the promotion';
COMMENT ON COLUMN promo_codes.description_en IS 'English description of the promotion';
COMMENT ON COLUMN promo_codes.description_ru IS 'Russian description of the promotion';
COMMENT ON TABLE promo_code_locations IS 'Junction table linking promo codes to specific locations. If empty, promo code applies to all locations.';

-- Storage policies for Promo bucket (bucket already created manually)

-- Public can view promo images
CREATE POLICY "Public can view promo images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'Promo');

-- Super admin can upload promo images
CREATE POLICY "Super admin can upload promo images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'Promo' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'SUPER_ADMIN'
  )
);

-- Super admin can update promo images
CREATE POLICY "Super admin can update promo images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'Promo' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'SUPER_ADMIN'
  )
);

-- Super admin can delete promo images
CREATE POLICY "Super admin can delete promo images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'Promo' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'SUPER_ADMIN'
  )
);

-- RLS Policies for promo_code_locations

-- Enable RLS
ALTER TABLE promo_code_locations ENABLE ROW LEVEL SECURITY;

-- Public can read active promo code locations
CREATE POLICY "Public can view promo code locations"
ON promo_code_locations FOR SELECT
TO public
USING (true);

-- Super admin can manage promo code locations
CREATE POLICY "Super admin can manage promo code locations"
ON promo_code_locations FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'SUPER_ADMIN'
  )
);
