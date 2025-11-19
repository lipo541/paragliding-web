-- =====================================================
-- Migration 015: Change ratable_id from UUID to TEXT
-- =====================================================
-- Purpose: Support flight_type ratings which use string IDs (not UUIDs)
-- The shared_flight_types in location_pages use generated string IDs like "flight-xxxxx"
-- =====================================================

-- Step 1: Drop existing foreign key constraints and indexes
DROP INDEX IF EXISTS idx_ratings_ratable;

-- Step 2: Change ratable_id column type from UUID to TEXT
ALTER TABLE ratings 
ALTER COLUMN ratable_id TYPE TEXT;

-- Step 3: Recreate index
CREATE INDEX idx_ratings_ratable ON ratings(ratable_type, ratable_id);

-- Step 4: Update column comment
COMMENT ON COLUMN ratings.ratable_id IS 'ID of the rated entity. UUID for countries/locations, string ID for flight_types';

-- Step 5: Update trigger function to handle TEXT to UUID conversion
CREATE OR REPLACE FUNCTION update_cached_ratings()
RETURNS TRIGGER AS $$
DECLARE
    target_table TEXT;
    avg_rating DECIMAL(3,2);
    total_count INTEGER;
BEGIN
    IF TG_OP = 'DELETE' THEN
        target_table := OLD.ratable_type::TEXT;
        
        -- Recalculate aggregates after deletion
        SELECT 
            COALESCE(AVG(rating), 0)::DECIMAL(3,2),
            COUNT(*)
        INTO avg_rating, total_count
        FROM ratings
        WHERE ratable_type = OLD.ratable_type 
        AND ratable_id = OLD.ratable_id;
        
        -- Update the appropriate table with UUID casting
        IF target_table = 'country' THEN
            UPDATE countries 
            SET average_rating = avg_rating,
                ratings_count = total_count
            WHERE id = OLD.ratable_id::UUID;
        ELSIF target_table = 'location' THEN
            UPDATE locations 
            SET average_rating = avg_rating,
                ratings_count = total_count
            WHERE id = OLD.ratable_id::UUID;
        END IF;
        
        RETURN OLD;
    ELSE
        -- INSERT or UPDATE
        target_table := NEW.ratable_type::TEXT;
        
        -- Calculate new aggregates
        SELECT 
            COALESCE(AVG(rating), 0)::DECIMAL(3,2),
            COUNT(*)
        INTO avg_rating, total_count
        FROM ratings
        WHERE ratable_type = NEW.ratable_type 
        AND ratable_id = NEW.ratable_id;
        
        -- Update the appropriate table with UUID casting
        IF target_table = 'country' THEN
            UPDATE countries 
            SET average_rating = avg_rating,
                ratings_count = total_count
            WHERE id = NEW.ratable_id::UUID;
        ELSIF target_table = 'location' THEN
            UPDATE locations 
            SET average_rating = avg_rating,
                ratings_count = total_count
            WHERE id = NEW.ratable_id::UUID;
        END IF;
        
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Verification
DO $$
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Migration 015 completed successfully';
  RAISE NOTICE 'ratable_id column type changed to TEXT';
  RAISE NOTICE 'Trigger function updated with UUID casting';
  RAISE NOTICE '====================================';
END $$;
