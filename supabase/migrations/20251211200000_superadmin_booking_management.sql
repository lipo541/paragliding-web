-- =====================================================
-- SuperAdmin Booking Management System
-- Migration: 20251211200000
-- =====================================================
-- Adds:
-- 1. New booking_status enum values (on_hold, no_show, rescheduled)
-- 2. New columns on bookings table
-- 3. booking_notes table
-- 4. booking_history table (audit log)
-- 5. RLS policies
-- =====================================================

-- =====================================================
-- 1. Update status CHECK constraint to include new values
-- =====================================================

-- Drop existing constraint and add new one with additional status values
DO $$
BEGIN
  -- Drop existing status check constraint if exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'bookings_status_check' 
    OR conname = 'bookings_status_check1'
  ) THEN
    ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
    ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check1;
  END IF;
  
  -- Add new constraint with extended status values
  ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'on_hold', 'no_show', 'rescheduled'));
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Constraint already exists, skip
END
$$;

-- =====================================================
-- 2. Add new columns to bookings table
-- =====================================================

-- Reschedule columns
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS original_date DATE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reschedule_count INT DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS last_rescheduled_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reschedule_reason TEXT;

-- Refund columns (enhance existing)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refunded_by UUID REFERENCES profiles(id);

-- No-Show columns
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS no_show_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS no_show_action VARCHAR(20);

-- On Hold columns
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS on_hold_reason TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS on_hold_until DATE;

-- Internal management columns
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS internal_notes TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS priority VARCHAR(10) DEFAULT 'normal';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Add check constraint for priority
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bookings_priority_check'
  ) THEN
    ALTER TABLE bookings ADD CONSTRAINT bookings_priority_check 
      CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
  END IF;
END
$$;

-- Add check constraint for no_show_action
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bookings_no_show_action_check'
  ) THEN
    ALTER TABLE bookings ADD CONSTRAINT bookings_no_show_action_check 
      CHECK (no_show_action IN ('refund', 'keep_deposit', 'reschedule'));
  END IF;
END
$$;

-- =====================================================
-- 3. Create booking_notes table
-- =====================================================

CREATE TABLE IF NOT EXISTS booking_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id),
  author_name TEXT,
  note TEXT NOT NULL,
  note_type VARCHAR(20) DEFAULT 'info',
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT booking_notes_type_check 
    CHECK (note_type IN ('info', 'warning', 'action', 'customer_contact', 'system'))
);

-- Index for fast lookup by booking
CREATE INDEX IF NOT EXISTS idx_booking_notes_booking_id ON booking_notes(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_notes_created_at ON booking_notes(created_at DESC);

-- =====================================================
-- 4. Create booking_history table (Audit Log)
-- =====================================================

CREATE TABLE IF NOT EXISTS booking_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  
  -- What changed
  action VARCHAR(50) NOT NULL,
  
  -- Old and new values
  old_value JSONB,
  new_value JSONB,
  
  -- Who changed
  changed_by UUID REFERENCES profiles(id),
  changed_by_role VARCHAR(20),
  changed_by_name TEXT,
  
  -- Metadata
  reason TEXT,
  metadata JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for booking_history
CREATE INDEX IF NOT EXISTS idx_booking_history_booking_id ON booking_history(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_history_created_at ON booking_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_booking_history_action ON booking_history(action);
CREATE INDEX IF NOT EXISTS idx_booking_history_changed_by ON booking_history(changed_by);

-- =====================================================
-- 5. Helper function to log booking changes
-- =====================================================

CREATE OR REPLACE FUNCTION log_booking_change(
  p_booking_id UUID,
  p_action VARCHAR(50),
  p_old_value JSONB,
  p_new_value JSONB,
  p_changed_by UUID,
  p_changed_by_role VARCHAR(20),
  p_changed_by_name TEXT,
  p_reason TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_history_id UUID;
BEGIN
  INSERT INTO booking_history (
    booking_id, action, old_value, new_value,
    changed_by, changed_by_role, changed_by_name,
    reason, metadata
  ) VALUES (
    p_booking_id, p_action, p_old_value, p_new_value,
    p_changed_by, p_changed_by_role, p_changed_by_name,
    p_reason, p_metadata
  ) RETURNING id INTO v_history_id;
  
  RETURN v_history_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. Trigger for automatic history logging
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_log_booking_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_changed_by UUID;
  v_changes JSONB := '{}'::JSONB;
  v_old_values JSONB := '{}'::JSONB;
BEGIN
  -- Get current user
  v_changed_by := auth.uid();
  
  -- Build change log for status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    v_old_values := v_old_values || jsonb_build_object('status', OLD.status);
    v_changes := v_changes || jsonb_build_object('status', NEW.status);
  END IF;
  
  -- Log pilot assignment changes
  IF OLD.pilot_id IS DISTINCT FROM NEW.pilot_id THEN
    v_old_values := v_old_values || jsonb_build_object('pilot_id', OLD.pilot_id);
    v_changes := v_changes || jsonb_build_object('pilot_id', NEW.pilot_id);
  END IF;
  
  -- Log company assignment changes
  IF OLD.company_id IS DISTINCT FROM NEW.company_id THEN
    v_old_values := v_old_values || jsonb_build_object('company_id', OLD.company_id);
    v_changes := v_changes || jsonb_build_object('company_id', NEW.company_id);
  END IF;
  
  -- Log payment status changes
  IF OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
    v_old_values := v_old_values || jsonb_build_object('payment_status', OLD.payment_status);
    v_changes := v_changes || jsonb_build_object('payment_status', NEW.payment_status);
  END IF;
  
  -- Log date changes (reschedule)
  IF OLD.selected_date IS DISTINCT FROM NEW.selected_date THEN
    v_old_values := v_old_values || jsonb_build_object('selected_date', OLD.selected_date);
    v_changes := v_changes || jsonb_build_object('selected_date', NEW.selected_date);
  END IF;
  
  -- Only log if something changed
  IF v_changes != '{}'::JSONB THEN
    INSERT INTO booking_history (
      booking_id, action, old_value, new_value,
      changed_by, changed_by_role, reason
    ) VALUES (
      NEW.id,
      CASE 
        WHEN OLD.status IS DISTINCT FROM NEW.status THEN 'status_change'
        WHEN OLD.pilot_id IS DISTINCT FROM NEW.pilot_id THEN 'pilot_change'
        WHEN OLD.company_id IS DISTINCT FROM NEW.company_id THEN 'company_change'
        WHEN OLD.selected_date IS DISTINCT FROM NEW.selected_date THEN 'reschedule'
        ELSE 'update'
      END,
      v_old_values,
      v_changes,
      v_changed_by,
      'system',
      NEW.reschedule_reason
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS booking_changes_audit ON bookings;
CREATE TRIGGER booking_changes_audit
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_log_booking_changes();

-- =====================================================
-- 7. RLS Policies
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE booking_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_history ENABLE ROW LEVEL SECURITY;

-- booking_notes policies
-- SuperAdmin can do everything
CREATE POLICY "superadmin_all_booking_notes" ON booking_notes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
  );

-- Pilots can view notes for their bookings
CREATE POLICY "pilots_view_booking_notes" ON booking_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN pilots p ON p.user_id = auth.uid()
      WHERE b.id = booking_notes.booking_id
        AND b.pilot_id = p.id
    )
  );

-- Companies can view notes for their bookings
CREATE POLICY "companies_view_booking_notes" ON booking_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN companies c ON c.user_id = auth.uid()
      WHERE b.id = booking_notes.booking_id
        AND b.company_id = c.id
    )
  );

-- booking_history policies
-- Only SuperAdmin can view history
CREATE POLICY "superadmin_view_booking_history" ON booking_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
  );

-- =====================================================
-- 8. Comments for documentation
-- =====================================================

COMMENT ON TABLE booking_notes IS 'Internal notes for bookings - visible to SuperAdmin, pilots, and companies';
COMMENT ON TABLE booking_history IS 'Audit log for all booking changes - only visible to SuperAdmin';

COMMENT ON COLUMN bookings.original_date IS 'Original booking date before any rescheduling';
COMMENT ON COLUMN bookings.reschedule_count IS 'Number of times booking has been rescheduled';
COMMENT ON COLUMN bookings.priority IS 'Booking priority: low, normal, high, urgent';
COMMENT ON COLUMN bookings.tags IS 'Array of tags: VIP, repeat_customer, problematic, etc.';
