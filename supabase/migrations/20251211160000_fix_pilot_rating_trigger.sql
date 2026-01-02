-- Fix pilot rating trigger - ratable_id is TEXT, pilots.id is UUID
-- Need to cast properly when comparing

CREATE OR REPLACE FUNCTION update_pilot_cached_rating()
RETURNS TRIGGER AS $$
DECLARE
  target_id TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_id := OLD.ratable_id;
  ELSE
    target_id := NEW.ratable_id;
  END IF;
  
  -- Only process if ratable_type is 'pilot'
  IF (TG_OP = 'DELETE' AND OLD.ratable_type::text = 'pilot') OR 
     (TG_OP != 'DELETE' AND NEW.ratable_type::text = 'pilot') THEN
    UPDATE pilots
    SET 
      cached_rating = COALESCE((
        SELECT ROUND(AVG(rating)::numeric, 2)
        FROM ratings
        WHERE ratable_type::text = 'pilot' AND ratable_id = target_id
      ), 0),
      cached_rating_count = (
        SELECT COUNT(*)
        FROM ratings
        WHERE ratable_type::text = 'pilot' AND ratable_id = target_id
      )
    WHERE id = target_id::UUID;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger to use fixed function
DROP TRIGGER IF EXISTS trigger_update_pilot_rating ON ratings;
CREATE TRIGGER trigger_update_pilot_rating
AFTER INSERT OR UPDATE OR DELETE ON ratings
FOR EACH ROW
EXECUTE FUNCTION update_pilot_cached_rating();
