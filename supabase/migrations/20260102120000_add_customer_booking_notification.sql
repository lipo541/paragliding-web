-- =====================================================
-- Add Customer Notification on Booking Creation
-- =====================================================
-- This migration updates the notify_on_new_booking function
-- to also notify the customer who made the booking
-- =====================================================

-- Update the trigger function to include customer notification
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
    v_location_name TEXT;
BEGIN
    -- Get booking details
    v_customer_name := NEW.full_name;
    v_flight_type := NEW.flight_type_name;
    v_booking_date := NEW.selected_date;
    v_location_name := NEW.location_name;
    
    -- =====================================================
    -- 1. NOTIFY CUSTOMER (NEW!)
    -- =====================================================
    IF NEW.user_id IS NOT NULL THEN
        PERFORM create_notification(
            NEW.user_id,
            'customer',
            'booking_confirmed',
            'ჯავშანი წარმატებით შეიქმნა! ✈️',
            format('%s - %s | %s', v_flight_type, v_location_name, v_booking_date),
            NEW.id,
            NEW.group_id,
            NEW.pilot_id,
            NEW.company_id,
            jsonb_build_object(
                'passengers', NEW.number_of_people,
                'total_price', NEW.total_price,
                'booking_source', COALESCE(NEW.booking_source, 'platform'),
                'status', NEW.status
            )
        );
    END IF;
    
    -- =====================================================
    -- 2. NOTIFY ASSIGNED PILOT
    -- =====================================================
    IF NEW.pilot_id IS NOT NULL THEN
        SELECT user_id INTO v_pilot_user_id
        FROM public.pilots
        WHERE id = NEW.pilot_id;
        
        IF v_pilot_user_id IS NOT NULL THEN
            PERFORM create_notification(
                v_pilot_user_id,
                'pilot',
                'new_booking',
                'ახალი ჯავშანი! 🎯',
                format('%s - %s (%s)', v_customer_name, v_flight_type, v_booking_date),
                NEW.id,
                NEW.group_id,
                NEW.pilot_id,
                NEW.company_id,
                jsonb_build_object(
                    'passengers', NEW.number_of_people,
                    'total_price', NEW.total_price,
                    'customer_phone', NEW.phone
                )
            );
        END IF;
    END IF;
    
    -- =====================================================
    -- 3. NOTIFY COMPANY OWNER
    -- =====================================================
    IF NEW.company_id IS NOT NULL THEN
        SELECT owner_id INTO v_company_owner_id
        FROM public.companies
        WHERE id = NEW.company_id;
        
        IF v_company_owner_id IS NOT NULL THEN
            PERFORM create_notification(
                v_company_owner_id,
                'company',
                'new_booking',
                'ახალი ჯავშანი კომპანიისთვის! 📋',
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
    
    -- =====================================================
    -- 4. NOTIFY ALL SUPER ADMINS
    -- =====================================================
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
        'ახალი ჯავშანი სისტემაში! 📊',
        format('%s - %s (%s)', v_customer_name, v_flight_type, v_booking_date),
        NEW.id,
        NEW.group_id,
        NEW.pilot_id,
        NEW.company_id,
        jsonb_build_object(
            'passengers', NEW.number_of_people,
            'total_price', NEW.total_price,
            'booking_source', COALESCE(NEW.booking_source, 'platform'),
            'user_id', NEW.user_id
        )
    FROM public.profiles
    WHERE profiles.role = 'SUPER_ADMIN';
    
    RETURN NEW;
END;
$$;

-- =====================================================
-- Add 'booking_confirmed' to notification types if not exists
-- =====================================================
DO $$
BEGIN
    -- Check if booking_confirmed already exists in the enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'booking_confirmed' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type_enum')
    ) THEN
        ALTER TYPE notification_type_enum ADD VALUE IF NOT EXISTS 'booking_confirmed';
    END IF;
END $$;

-- =====================================================
-- Also update the booking status change trigger to notify customer
-- =====================================================
CREATE OR REPLACE FUNCTION notify_on_booking_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_pilot_user_id UUID;
    v_company_owner_id UUID;
    v_status_title_customer TEXT;
    v_status_title_pilot TEXT;
    v_status_emoji TEXT;
BEGIN
    -- Only trigger on status change
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;
    
    -- Set emoji and titles based on new status
    CASE NEW.status
        WHEN 'confirmed' THEN
            v_status_emoji := '✅';
            v_status_title_customer := 'ჯავშანი დადასტურდა!';
            v_status_title_pilot := 'ჯავშანი დადასტურებულია';
        WHEN 'cancelled' THEN
            v_status_emoji := '❌';
            v_status_title_customer := 'ჯავშანი გაუქმდა';
            v_status_title_pilot := 'ჯავშანი გაუქმდა';
        WHEN 'completed' THEN
            v_status_emoji := '🎉';
            v_status_title_customer := 'ფრენა დასრულდა! გმადლობთ!';
            v_status_title_pilot := 'ფრენა დასრულდა';
        WHEN 'rescheduled' THEN
            v_status_emoji := '📅';
            v_status_title_customer := 'ჯავშნის თარიღი შეიცვალა';
            v_status_title_pilot := 'ჯავშნის თარიღი შეიცვალა';
        ELSE
            v_status_emoji := 'ℹ️';
            v_status_title_customer := 'ჯავშნის სტატუსი განახლდა';
            v_status_title_pilot := 'ჯავშნის სტატუსი განახლდა';
    END CASE;
    
    -- =====================================================
    -- NOTIFY CUSTOMER about status change
    -- =====================================================
    IF NEW.user_id IS NOT NULL THEN
        PERFORM create_notification(
            NEW.user_id,
            'customer',
            'booking_status_changed',
            format('%s %s', v_status_emoji, v_status_title_customer),
            format('%s - %s | %s', NEW.flight_type_name, COALESCE(NEW.location_name, ''), NEW.selected_date),
            NEW.id,
            NEW.group_id,
            NEW.pilot_id,
            NEW.company_id,
            jsonb_build_object(
                'old_status', OLD.status,
                'new_status', NEW.status,
                'passengers', NEW.number_of_people
            )
        );
    END IF;
    
    -- =====================================================
    -- NOTIFY PILOT about status change (if assigned)
    -- =====================================================
    IF NEW.pilot_id IS NOT NULL THEN
        SELECT user_id INTO v_pilot_user_id
        FROM public.pilots
        WHERE id = NEW.pilot_id;
        
        IF v_pilot_user_id IS NOT NULL THEN
            PERFORM create_notification(
                v_pilot_user_id,
                'pilot',
                'booking_status_changed',
                format('%s %s', v_status_emoji, v_status_title_pilot),
                format('%s - %s', NEW.full_name, NEW.flight_type_name),
                NEW.id,
                NEW.group_id,
                NEW.pilot_id,
                NEW.company_id,
                jsonb_build_object(
                    'old_status', OLD.status,
                    'new_status', NEW.status
                )
            );
        END IF;
    END IF;
    
    -- =====================================================
    -- NOTIFY COMPANY OWNER about status change (if company booking)
    -- =====================================================
    IF NEW.company_id IS NOT NULL THEN
        SELECT owner_id INTO v_company_owner_id
        FROM public.companies
        WHERE id = NEW.company_id;
        
        IF v_company_owner_id IS NOT NULL THEN
            PERFORM create_notification(
                v_company_owner_id,
                'company',
                'booking_status_changed',
                format('%s %s', v_status_emoji, v_status_title_pilot),
                format('%s - %s', NEW.full_name, NEW.flight_type_name),
                NEW.id,
                NEW.group_id,
                NEW.pilot_id,
                NEW.company_id,
                jsonb_build_object(
                    'old_status', OLD.status,
                    'new_status', NEW.status
                )
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Recreate the trigger if it doesn't exist
DROP TRIGGER IF EXISTS trigger_booking_status_change ON public.bookings;
CREATE TRIGGER trigger_booking_status_change
    AFTER UPDATE OF status ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION notify_on_booking_status_change();
