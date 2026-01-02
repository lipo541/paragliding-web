-- Create trigger for pilot ratings (separate migration after enum commit)
DROP TRIGGER IF EXISTS update_pilot_rating_trigger ON ratings;

CREATE TRIGGER update_pilot_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON ratings
FOR EACH ROW
EXECUTE FUNCTION update_pilot_cached_rating();
