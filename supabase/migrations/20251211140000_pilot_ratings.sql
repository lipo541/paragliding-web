-- Add pilot rating support
-- This migration adds pilot to the ratable_type enum and adds cached rating fields

-- Add 'pilot' to ratable_type enum
ALTER TYPE ratable_type ADD VALUE IF NOT EXISTS 'pilot';

-- Add cached rating fields to pilots table
ALTER TABLE pilots
ADD COLUMN IF NOT EXISTS cached_rating DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS cached_rating_count INTEGER DEFAULT 0;

-- Create index for faster rating lookups
CREATE INDEX IF NOT EXISTS idx_pilots_rating ON pilots(cached_rating DESC) WHERE status = 'verified';

-- Function to update pilot cached rating (similar to existing pattern)
CREATE OR REPLACE FUNCTION update_pilot_cached_rating()
RETURNS TRIGGER AS $$
DECLARE
  target_id UUID;
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
    WHERE id = target_id;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Note: Trigger will be created in a separate migration after enum value is committed
-- For now, we'll create a simple trigger that checks type as text
