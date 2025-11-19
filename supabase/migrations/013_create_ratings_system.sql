-- =====================================================
-- Migration 013: Create Ratings System
-- =====================================================
-- Purpose: Implement 5-star rating system for countries, locations, and flight types
-- Features:
--   - ratings table with polymorphic relationships
--   - Cached aggregations (average_rating, ratings_count)
--   - Automatic trigger-based updates
--   - RLS policies for security
-- =====================================================

-- =====================================================
-- 1. Create ENUM for ratable types
-- =====================================================
CREATE TYPE ratable_type AS ENUM ('country', 'location', 'flight_type');

-- =====================================================
-- 2. Create ratings table
-- =====================================================
CREATE TABLE ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ratable_type ratable_type NOT NULL,
    ratable_id UUID NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure one user can rate one item only once
    CONSTRAINT unique_user_rating UNIQUE (user_id, ratable_type, ratable_id)
);

-- =====================================================
-- 3. Create indexes for performance
-- =====================================================
CREATE INDEX idx_ratings_ratable ON ratings(ratable_type, ratable_id);
CREATE INDEX idx_ratings_user ON ratings(user_id);
CREATE INDEX idx_ratings_created_at ON ratings(created_at DESC);

-- =====================================================
-- 4. Add cached rating columns to countries table
-- =====================================================
ALTER TABLE countries 
ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN ratings_count INTEGER DEFAULT 0;

CREATE INDEX idx_countries_rating ON countries(average_rating DESC);

-- =====================================================
-- 5. Add cached rating columns to locations table
-- =====================================================
ALTER TABLE locations 
ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN ratings_count INTEGER DEFAULT 0;

CREATE INDEX idx_locations_rating ON locations(average_rating DESC);

-- =====================================================
-- 6. Create trigger function to update cached ratings
-- =====================================================
CREATE OR REPLACE FUNCTION update_cached_ratings()
RETURNS TRIGGER AS $$
DECLARE
    target_table TEXT;
    avg_rating DECIMAL(3,2);
    total_count INTEGER;
BEGIN
    -- Determine which operation and which record to update
    IF TG_OP = 'DELETE' THEN
        target_table := OLD.ratable_type::TEXT;
        
        -- Calculate new aggregates after deletion
        SELECT 
            COALESCE(AVG(rating), 0)::DECIMAL(3,2),
            COUNT(*)
        INTO avg_rating, total_count
        FROM ratings
        WHERE ratable_type = OLD.ratable_type 
        AND ratable_id = OLD.ratable_id;
        
        -- Update the appropriate table
        IF target_table = 'country' THEN
            UPDATE countries 
            SET average_rating = avg_rating,
                ratings_count = total_count
            WHERE id = OLD.ratable_id;
        ELSIF target_table = 'location' THEN
            UPDATE locations 
            SET average_rating = avg_rating,
                ratings_count = total_count
            WHERE id = OLD.ratable_id;
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
        
        -- Update the appropriate table
        IF target_table = 'country' THEN
            UPDATE countries 
            SET average_rating = avg_rating,
                ratings_count = total_count
            WHERE id = NEW.ratable_id;
        ELSIF target_table = 'location' THEN
            UPDATE locations 
            SET average_rating = avg_rating,
                ratings_count = total_count
            WHERE id = NEW.ratable_id;
        END IF;
        
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. Create triggers on ratings table
-- =====================================================
CREATE TRIGGER trigger_update_ratings_after_insert
    AFTER INSERT ON ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_cached_ratings();

CREATE TRIGGER trigger_update_ratings_after_update
    AFTER UPDATE ON ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_cached_ratings();

CREATE TRIGGER trigger_update_ratings_after_delete
    AFTER DELETE ON ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_cached_ratings();

-- =====================================================
-- 8. Create updated_at trigger for ratings
-- =====================================================
CREATE TRIGGER set_ratings_updated_at
    BEFORE UPDATE ON ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. Enable Row Level Security
-- =====================================================
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 10. Create RLS Policies
-- =====================================================

-- Everyone can read ratings
CREATE POLICY "ratings_select_policy"
    ON ratings
    FOR SELECT
    USING (true);

-- Authenticated users can insert their own ratings
CREATE POLICY "ratings_insert_policy"
    ON ratings
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update only their own ratings
CREATE POLICY "ratings_update_policy"
    ON ratings
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete only their own ratings
CREATE POLICY "ratings_delete_policy"
    ON ratings
    FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- 11. Grant permissions
-- =====================================================
GRANT SELECT ON ratings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ratings TO authenticated;

-- =====================================================
-- Comments for documentation
-- =====================================================
COMMENT ON TABLE ratings IS 'Stores user ratings (1-5 stars) for countries, locations, and flight types';
COMMENT ON COLUMN ratings.ratable_type IS 'Type of entity being rated: country, location, or flight_type';
COMMENT ON COLUMN ratings.ratable_id IS 'UUID of the entity being rated';
COMMENT ON COLUMN ratings.rating IS 'Rating value from 1 to 5 stars';
COMMENT ON CONSTRAINT unique_user_rating ON ratings IS 'Ensures each user can rate each item only once';
