-- Fix notify_on_new_booking trigger to use 'platform_general' instead of 'platform'
-- Run this in Supabase SQL Editor

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
    -- 1. NOTIFY CUSTOMER
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
                'booking_source', COALESCE(NEW.booking_source::text, 'platform_general'),
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
            'booking_source', COALESCE(NEW.booking_source::text, 'platform_general'),
            'user_id', NEW.user_id
        )
    FROM public.profiles
    WHERE profiles.role = 'SUPER_ADMIN';
    
    RETURN NEW;
END;
$$;
