-- Add cached rating columns to countries table
ALTER TABLE countries 
ADD COLUMN IF NOT EXISTS cached_rating DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cached_rating_count INTEGER DEFAULT 0;

-- Add cached rating columns to locations table
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS cached_rating DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cached_rating_count INTEGER DEFAULT 0;

-- Update trigger function to handle countries ratings
CREATE OR REPLACE FUNCTION update_cached_ratings()
RETURNS TRIGGER AS $$
BEGIN
  -- Update locations table
  IF NEW.ratable_type = 'location' THEN
    UPDATE locations
    SET 
      cached_rating = (
        SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0)
        FROM ratings
        WHERE ratable_type = 'location' AND ratable_id = NEW.ratable_id
      ),
      cached_rating_count = (
        SELECT COUNT(*)
        FROM ratings
        WHERE ratable_type = 'location' AND ratable_id = NEW.ratable_id
      )
    WHERE id = NEW.ratable_id::UUID;
  END IF;

  -- Update countries table
  IF NEW.ratable_type = 'country' THEN
    UPDATE countries
    SET 
      cached_rating = (
        SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0)
        FROM ratings
        WHERE ratable_type = 'country' AND ratable_id = NEW.ratable_id
      ),
      cached_rating_count = (
        SELECT COUNT(*)
        FROM ratings
        WHERE ratable_type = 'country' AND ratable_id = NEW.ratable_id
      )
    WHERE id = NEW.ratable_id::UUID;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist (this will replace the existing one)
DROP TRIGGER IF EXISTS update_cached_ratings_trigger ON ratings;
CREATE TRIGGER update_cached_ratings_trigger
AFTER INSERT OR UPDATE ON ratings
FOR EACH ROW
EXECUTE FUNCTION update_cached_ratings();

-- Recalculate all cached ratings for countries
UPDATE countries
SET 
  cached_rating = (
    SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0)
    FROM ratings
    WHERE ratable_type = 'country' AND ratable_id = countries.id::TEXT
  ),
  cached_rating_count = (
    SELECT COUNT(*)
    FROM ratings
    WHERE ratable_type = 'country' AND ratable_id = countries.id::TEXT
  );

-- Recalculate all cached ratings for locations
UPDATE locations
SET 
  cached_rating = (
    SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0)
    FROM ratings
    WHERE ratable_type = 'location' AND ratable_id = locations.id::TEXT
  ),
  cached_rating_count = (
    SELECT COUNT(*)
    FROM ratings
    WHERE ratable_type = 'location' AND ratable_id = locations.id::TEXT
  );
