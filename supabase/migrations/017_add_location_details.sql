-- Add altitude, season, and difficulty fields to locations table

-- Add altitude field (in meters)
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS altitude INTEGER;

-- Add best season fields (month numbers 1-12)
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS best_season_start INTEGER CHECK (best_season_start BETWEEN 1 AND 12),
ADD COLUMN IF NOT EXISTS best_season_end INTEGER CHECK (best_season_end BETWEEN 1 AND 12);

-- Add difficulty level field
DO $$ BEGIN
  CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS difficulty_level difficulty_level;

-- Add comments for documentation
COMMENT ON COLUMN locations.altitude IS 'Altitude of the takeoff location in meters';
COMMENT ON COLUMN locations.best_season_start IS 'Best season start month (1-12)';
COMMENT ON COLUMN locations.best_season_end IS 'Best season end month (1-12)';
COMMENT ON COLUMN locations.difficulty_level IS 'Difficulty level: beginner, intermediate, or advanced';

-- Create index for filtering by difficulty
CREATE INDEX IF NOT EXISTS idx_locations_difficulty ON locations(difficulty_level);
