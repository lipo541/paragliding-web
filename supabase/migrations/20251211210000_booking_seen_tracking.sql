-- =====================================================
-- Booking Seen Tracking
-- Migration: 20251211210000
-- =====================================================
-- Adds tracking for which roles have seen new bookings
-- Each role sees the "new" indicator until they acknowledge it
-- =====================================================

-- Add seen tracking columns to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS seen_by_pilot BOOLEAN DEFAULT FALSE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS seen_by_company BOOLEAN DEFAULT FALSE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS seen_by_admin BOOLEAN DEFAULT FALSE;

-- Add timestamps for when each role saw the booking
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS seen_by_pilot_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS seen_by_company_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS seen_by_admin_at TIMESTAMPTZ;

-- Comments
COMMENT ON COLUMN bookings.seen_by_pilot IS 'Whether the assigned pilot has seen/acknowledged this booking';
COMMENT ON COLUMN bookings.seen_by_company IS 'Whether the company has seen/acknowledged this booking';
COMMENT ON COLUMN bookings.seen_by_admin IS 'Whether a super admin has seen/acknowledged this booking';

-- Index for quick filtering of unseen bookings
CREATE INDEX IF NOT EXISTS idx_bookings_seen_by_pilot ON bookings(pilot_id, seen_by_pilot) WHERE seen_by_pilot = FALSE;
CREATE INDEX IF NOT EXISTS idx_bookings_seen_by_company ON bookings(company_id, seen_by_company) WHERE seen_by_company = FALSE;
CREATE INDEX IF NOT EXISTS idx_bookings_seen_by_admin ON bookings(seen_by_admin) WHERE seen_by_admin = FALSE;

-- Function to mark booking as seen by specific role
CREATE OR REPLACE FUNCTION mark_booking_seen(
  p_booking_id UUID,
  p_role TEXT -- 'pilot', 'company', 'admin'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_role = 'pilot' THEN
    UPDATE bookings 
    SET seen_by_pilot = TRUE, seen_by_pilot_at = NOW()
    WHERE id = p_booking_id;
  ELSIF p_role = 'company' THEN
    UPDATE bookings 
    SET seen_by_company = TRUE, seen_by_company_at = NOW()
    WHERE id = p_booking_id;
  ELSIF p_role = 'admin' THEN
    UPDATE bookings 
    SET seen_by_admin = TRUE, seen_by_admin_at = NOW()
    WHERE id = p_booking_id;
  ELSE
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION mark_booking_seen TO authenticated;
