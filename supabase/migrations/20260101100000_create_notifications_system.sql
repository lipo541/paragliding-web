-- =====================================================
-- Notifications System
-- Migration: 20260101100000
-- =====================================================
-- Real-time notifications for pilots, companies, and admins
-- Supports booking notifications, group bookings, and more
-- =====================================================

-- 1. Create notification type ENUM
DO $$ BEGIN
    CREATE TYPE notification_type_enum AS ENUM (
        'new_booking',           -- ახალი ჯავშანი
        'booking_confirmed',     -- ჯავშანი დადასტურდა
        'booking_cancelled',     -- ჯავშანი გაუქმდა
        'booking_completed',     -- ფრენა დასრულდა
        'booking_assigned',      -- ჯავშანი მიენიჭა (პილოტს)
        'booking_reassigned',    -- ჯავშანი გადანიჭდა
        'booking_rescheduled',   -- ჯავშანი გადაიდო
        'group_booking',         -- გრუპური ჯავშანი (რამდენიმე პილოტი/კომპანია)
        'payment_received',      -- გადახდა მიღებულია
        'payment_failed',        -- გადახდა ჩაიშალა
        'pilot_request',         -- პილოტმა მოითხოვა კომპანიაში გაწევრიანება
        'company_invite',        -- კომპანიამ მოიწვია პილოტი
        'request_approved',      -- მოთხოვნა დამტკიცდა
        'request_rejected',      -- მოთხოვნა უარყოფილია
        'system_message',        -- სისტემური შეტყობინება
        'reminder'               -- შეხსენება
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create recipient type ENUM
DO $$ BEGIN
    CREATE TYPE recipient_type_enum AS ENUM (
        'pilot',
        'company',
        'customer',
        'admin'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Recipient (user who should see this notification)
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_type recipient_type_enum NOT NULL,
    
    -- Notification content
    type notification_type_enum NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    
    -- Related entities
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    group_id UUID,  -- For grouped cart bookings
    pilot_id UUID REFERENCES public.pilots(id) ON DELETE SET NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    
    -- Metadata (additional JSON data)
    metadata JSONB DEFAULT '{}',
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Expiration (optional - for temporary notifications)
    expires_at TIMESTAMPTZ
);

-- 4. Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_type ON public.notifications(recipient_type);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_booking ON public.notifications(booking_id);
CREATE INDEX IF NOT EXISTS idx_notifications_group ON public.notifications(group_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(recipient_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- 5. Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
    ON public.notifications
    FOR SELECT
    TO authenticated
    USING (recipient_id = auth.uid());

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update own notifications"
    ON public.notifications
    FOR UPDATE
    TO authenticated
    USING (recipient_id = auth.uid())
    WITH CHECK (recipient_id = auth.uid());

-- System can insert notifications (via functions)
CREATE POLICY "Service role can insert notifications"
    ON public.notifications
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Also allow authenticated users to receive notifications (for triggers)
CREATE POLICY "Authenticated can receive notifications"
    ON public.notifications
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
    ON public.notifications
    FOR DELETE
    TO authenticated
    USING (recipient_id = auth.uid());

-- Super admins can view all notifications
CREATE POLICY "Super admins can view all notifications"
    ON public.notifications
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'SUPER_ADMIN'
        )
    );

-- 7. Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
    p_recipient_id UUID,
    p_recipient_type TEXT,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT DEFAULT NULL,
    p_booking_id UUID DEFAULT NULL,
    p_group_id UUID DEFAULT NULL,
    p_pilot_id UUID DEFAULT NULL,
    p_company_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO public.notifications (
        recipient_id,
        recipient_type,
        type,
        title,
        message,
        booking_id,
        group_id,
        pilot_id,
        company_id,
        metadata
    )
    VALUES (
        p_recipient_id,
        p_recipient_type::recipient_type_enum,
        p_type::notification_type_enum,
        p_title,
        p_message,
        p_booking_id,
        p_group_id,
        p_pilot_id,
        p_company_id,
        p_metadata
    )
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$;

-- 8. Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.notifications
    SET is_read = TRUE, read_at = NOW()
    WHERE id = p_notification_id
    AND recipient_id = auth.uid();
    
    RETURN FOUND;
END;
$$;

-- 9. Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE public.notifications
    SET is_read = TRUE, read_at = NOW()
    WHERE recipient_id = auth.uid()
    AND is_read = FALSE;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

-- 10. Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM public.notifications
    WHERE recipient_id = auth.uid()
    AND is_read = FALSE;
    
    RETURN v_count;
END;
$$;

-- 11. Trigger function to create notifications on new booking
CREATE OR REPLACE FUNCTION notify_on_new_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_pilot_user_id UUID;
    v_company_owner_id UUID;
    v_customer_name TEXT;
    v_flight_type TEXT;
    v_booking_date DATE;
BEGIN
    -- Get booking details
    v_customer_name := NEW.full_name;
    v_flight_type := NEW.flight_type_name;
    v_booking_date := NEW.selected_date;
    
    -- Notify assigned pilot
    IF NEW.pilot_id IS NOT NULL THEN
        SELECT user_id INTO v_pilot_user_id
        FROM public.pilots
        WHERE id = NEW.pilot_id;
        
        IF v_pilot_user_id IS NOT NULL THEN
            PERFORM create_notification(
                v_pilot_user_id,
                'pilot',
                'new_booking',
                'ახალი ჯავშანი!',
                format('%s - %s (%s)', v_customer_name, v_flight_type, v_booking_date),
                NEW.id,
                NEW.group_id,
                NEW.pilot_id,
                NEW.company_id,
                jsonb_build_object(
                    'passengers', NEW.number_of_people,
                    'total_price', NEW.total_price
                )
            );
        END IF;
    END IF;
    
    -- Notify company owner
    IF NEW.company_id IS NOT NULL THEN
        SELECT owner_id INTO v_company_owner_id
        FROM public.companies
        WHERE id = NEW.company_id;
        
        IF v_company_owner_id IS NOT NULL THEN
            PERFORM create_notification(
                v_company_owner_id,
                'company',
                'new_booking',
                'ახალი ჯავშანი კომპანიისთვის!',
                format('%s - %s (%s)', v_customer_name, v_flight_type, v_booking_date),
                NEW.id,
                NEW.group_id,
                NEW.pilot_id,
                NEW.company_id,
                jsonb_build_object(
                    'passengers', NEW.number_of_people,
                    'total_price', NEW.total_price,
                    'assigned_pilot_id', NEW.pilot_id
                )
            );
        END IF;
    END IF;
    
    -- Notify all super admins
    INSERT INTO public.notifications (
        recipient_id,
        recipient_type,
        type,
        title,
        message,
        booking_id,
        group_id,
        pilot_id,
        company_id,
        metadata
    )
    SELECT 
        profiles.id,
        'admin'::recipient_type_enum,
        'new_booking'::notification_type_enum,
        'ახალი ჯავშანი სისტემაში!',
        format('%s - %s (%s)', v_customer_name, v_flight_type, v_booking_date),
        NEW.id,
        NEW.group_id,
        NEW.pilot_id,
        NEW.company_id,
        jsonb_build_object(
            'passengers', NEW.number_of_people,
            'total_price', NEW.total_price,
            'booking_source', NEW.booking_source
        )
    FROM public.profiles
    WHERE profiles.role = 'SUPER_ADMIN';
    
    RETURN NEW;
END;
$$;

-- 12. Create trigger for new bookings
DROP TRIGGER IF EXISTS trigger_notify_new_booking ON public.bookings;
CREATE TRIGGER trigger_notify_new_booking
    AFTER INSERT ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION notify_on_new_booking();

-- 13. Trigger function to notify on booking status change
CREATE OR REPLACE FUNCTION notify_on_booking_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_pilot_user_id UUID;
    v_company_owner_id UUID;
    v_customer_id UUID;
    v_title TEXT;
    v_message TEXT;
    v_type notification_type_enum;
BEGIN
    -- Only trigger if status actually changed
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;
    
    -- Determine notification type and message based on new status
    CASE NEW.status
        WHEN 'confirmed' THEN
            v_type := 'booking_confirmed';
            v_title := 'ჯავშანი დადასტურდა!';
            v_message := format('ჯავშანი %s თარიღზე დადასტურებულია', NEW.selected_date);
        WHEN 'cancelled' THEN
            v_type := 'booking_cancelled';
            v_title := 'ჯავშანი გაუქმდა';
            v_message := format('ჯავშანი %s თარიღზე გაუქმდა', NEW.selected_date);
        WHEN 'completed' THEN
            v_type := 'booking_completed';
            v_title := 'ფრენა დასრულდა!';
            v_message := format('ფრენა %s თარიღზე წარმატებით დასრულდა', NEW.selected_date);
        ELSE
            RETURN NEW;
    END CASE;
    
    -- Notify customer if exists
    IF NEW.user_id IS NOT NULL THEN
        PERFORM create_notification(
            NEW.user_id,
            'customer',
            v_type::TEXT,
            v_title,
            v_message,
            NEW.id,
            NEW.group_id,
            NEW.pilot_id,
            NEW.company_id
        );
    END IF;
    
    -- Notify pilot on cancellation
    IF NEW.status = 'cancelled' AND NEW.pilot_id IS NOT NULL THEN
        SELECT user_id INTO v_pilot_user_id
        FROM public.pilots WHERE id = NEW.pilot_id;
        
        IF v_pilot_user_id IS NOT NULL THEN
            PERFORM create_notification(
                v_pilot_user_id,
                'pilot',
                v_type::TEXT,
                v_title,
                v_message,
                NEW.id,
                NEW.group_id,
                NEW.pilot_id,
                NEW.company_id
            );
        END IF;
    END IF;
    
    -- Notify company on cancellation
    IF NEW.status = 'cancelled' AND NEW.company_id IS NOT NULL THEN
        SELECT owner_id INTO v_company_owner_id
        FROM public.companies WHERE id = NEW.company_id;
        
        IF v_company_owner_id IS NOT NULL THEN
            PERFORM create_notification(
                v_company_owner_id,
                'company',
                v_type::TEXT,
                v_title,
                v_message,
                NEW.id,
                NEW.group_id,
                NEW.pilot_id,
                NEW.company_id
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- 14. Create trigger for booking status changes
DROP TRIGGER IF EXISTS trigger_notify_booking_status ON public.bookings;
CREATE TRIGGER trigger_notify_booking_status
    AFTER UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION notify_on_booking_status_change();

-- 15. Trigger function to notify on pilot assignment
CREATE OR REPLACE FUNCTION notify_on_pilot_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_pilot_user_id UUID;
    v_customer_name TEXT;
    v_booking_date DATE;
BEGIN
    -- Only trigger if pilot_id changed from NULL or different value
    IF OLD.pilot_id IS NOT DISTINCT FROM NEW.pilot_id THEN
        RETURN NEW;
    END IF;
    
    -- Get pilot's user_id
    IF NEW.pilot_id IS NOT NULL THEN
        SELECT user_id INTO v_pilot_user_id
        FROM public.pilots WHERE id = NEW.pilot_id;
        
        v_customer_name := NEW.full_name;
        v_booking_date := NEW.selected_date;
        
        IF v_pilot_user_id IS NOT NULL THEN
            PERFORM create_notification(
                v_pilot_user_id,
                'pilot',
                'booking_assigned',
                'ახალი ჯავშანი მიგენიჭა!',
                format('%s - %s', v_customer_name, v_booking_date),
                NEW.id,
                NEW.group_id,
                NEW.pilot_id,
                NEW.company_id,
                jsonb_build_object(
                    'passengers', NEW.number_of_people,
                    'total_price', NEW.total_price
                )
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- 16. Create trigger for pilot assignment
DROP TRIGGER IF EXISTS trigger_notify_pilot_assignment ON public.bookings;
CREATE TRIGGER trigger_notify_pilot_assignment
    AFTER UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION notify_on_pilot_assignment();

-- 17. Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_read TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_read TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notification_count TO authenticated;

-- 18. Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 19. Add group_id column to bookings if not exists (for grouped cart bookings)
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS group_id UUID;
CREATE INDEX IF NOT EXISTS idx_bookings_group_id ON public.bookings(group_id);

COMMENT ON COLUMN public.bookings.group_id IS 'Groups multiple bookings from a single cart checkout';
COMMENT ON TABLE public.notifications IS 'Real-time notifications for pilots, companies, customers, and admins';
