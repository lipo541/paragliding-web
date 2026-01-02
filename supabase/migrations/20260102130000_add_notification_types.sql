-- =====================================================
-- Add Notification Types for User Requests
-- =====================================================
-- Adds reschedule_request and booking_status_changed types
-- =====================================================

-- Add reschedule_request type
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'reschedule_request' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type_enum')
    ) THEN
        ALTER TYPE notification_type_enum ADD VALUE 'reschedule_request';
    END IF;
END $$;

-- Add booking_status_changed type
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'booking_status_changed' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type_enum')
    ) THEN
        ALTER TYPE notification_type_enum ADD VALUE 'booking_status_changed';
    END IF;
END $$;
