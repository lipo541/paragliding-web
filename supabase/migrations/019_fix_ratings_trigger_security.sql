-- =====================================================
-- Migration 019: Fix Ratings Trigger Security
-- =====================================================
-- Purpose: Fix the ratings trigger to run with elevated privileges
-- Issue: When a regular user submits a rating, the trigger tries to
--        update countries/locations tables, but RLS blocks this.
-- Solution: Make trigger function SECURITY DEFINER so it runs with
--           postgres privileges, bypassing RLS for the update.
-- =====================================================

-- Drop the existing trigger function
DROP FUNCTION IF EXISTS update_cached_ratings() CASCADE;

-- Recreate the trigger function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION update_cached_ratings()
RETURNS TRIGGER 
SECURITY DEFINER  -- This makes the function run with the privileges of the function owner (postgres)
SET search_path = public
AS $$
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
        
        -- Update the appropriate table (bypasses RLS due to SECURITY DEFINER)
        -- Cast TEXT ratable_id to UUID for countries/locations
        IF target_table = 'country' THEN
            UPDATE countries 
            SET cached_rating = avg_rating,
                cached_rating_count = total_count
            WHERE id = OLD.ratable_id::UUID;
        ELSIF target_table = 'location' THEN
            UPDATE locations 
            SET cached_rating = avg_rating,
                cached_rating_count = total_count
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
        
        -- Update the appropriate table (bypasses RLS due to SECURITY DEFINER)
        -- Cast TEXT ratable_id to UUID for countries/locations
        IF target_table = 'country' THEN
            UPDATE countries 
            SET cached_rating = avg_rating,
                cached_rating_count = total_count
            WHERE id = NEW.ratable_id::UUID;
        ELSIF target_table = 'location' THEN
            UPDATE locations 
            SET cached_rating = avg_rating,
                cached_rating_count = total_count
            WHERE id = NEW.ratable_id::UUID;
        END IF;
        
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Recreate the triggers (they were dropped when we dropped the function)
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
-- Comments for documentation
-- =====================================================
COMMENT ON FUNCTION update_cached_ratings IS 'Trigger function to update cached rating aggregates. Uses SECURITY DEFINER to bypass RLS when updating countries/locations tables.';
