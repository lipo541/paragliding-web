-- =====================================================
-- Migration: Company Rating Trigger (Part 3)
-- =====================================================
-- Purpose: Create trigger to update cached_rating for companies
-- =====================================================

-- Function to update company cached rating
CREATE OR REPLACE FUNCTION update_company_cached_rating()
RETURNS TRIGGER AS $$
BEGIN
    -- Update cached rating for the company
    UPDATE companies
    SET 
        cached_rating = (
            SELECT COALESCE(AVG(rating), 0)
            FROM ratings
            WHERE ratable_type = 'company' AND ratable_id = COALESCE(NEW.ratable_id, OLD.ratable_id)
        ),
        cached_rating_count = (
            SELECT COUNT(*)
            FROM ratings
            WHERE ratable_type = 'company' AND ratable_id = COALESCE(NEW.ratable_id, OLD.ratable_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.ratable_id, OLD.ratable_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for company ratings
DROP TRIGGER IF EXISTS trigger_update_company_cached_rating ON ratings;
CREATE TRIGGER trigger_update_company_cached_rating
    AFTER INSERT OR UPDATE OR DELETE ON ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_company_cached_rating();

-- =====================================================
-- Migration Complete
-- =====================================================
