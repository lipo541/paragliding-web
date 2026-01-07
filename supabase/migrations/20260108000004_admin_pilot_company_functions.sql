-- =====================================================
-- Admin Functions for Pilot-Company Management
-- =====================================================
-- These functions allow SuperAdmin to:
-- 1. Directly assign a pilot to a company
-- 2. Remove a pilot from a company
-- 3. View and manage all pilot-company requests
-- All actions create notifications for transparency
-- =====================================================

-- Function: Admin assigns pilot to company
CREATE OR REPLACE FUNCTION admin_assign_pilot_to_company(
    p_pilot_id UUID,
    p_company_id UUID,
    p_admin_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_pilot_name TEXT;
    v_company_name TEXT;
    v_pilot_user_id UUID;
    v_company_owner_id UUID;
    v_old_company_id UUID;
    v_old_company_name TEXT;
    v_old_company_owner_id UUID;
BEGIN
    -- Get pilot info
    SELECT 
        user_id,
        company_id,
        COALESCE(first_name_ka, '') || ' ' || COALESCE(last_name_ka, '')
    INTO v_pilot_user_id, v_old_company_id, v_pilot_name
    FROM pilots
    WHERE id = p_pilot_id;
    
    IF v_pilot_user_id IS NULL THEN
        RAISE EXCEPTION 'პილოტი ვერ მოიძებნა';
    END IF;
    
    -- Get new company info
    SELECT name_ka, user_id INTO v_company_name, v_company_owner_id
    FROM companies
    WHERE id = p_company_id;
    
    IF v_company_name IS NULL THEN
        RAISE EXCEPTION 'კომპანია ვერ მოიძებნა';
    END IF;
    
    -- Get old company info (if exists)
    IF v_old_company_id IS NOT NULL AND v_old_company_id != p_company_id THEN
        SELECT name_ka, user_id INTO v_old_company_name, v_old_company_owner_id
        FROM companies
        WHERE id = v_old_company_id;
        
        -- Notify old company owner about pilot leaving
        IF v_old_company_owner_id IS NOT NULL THEN
            INSERT INTO notifications (
                recipient_id,
                recipient_type,
                type,
                title,
                message,
                pilot_id,
                company_id,
                metadata
            ) VALUES (
                v_old_company_owner_id,
                'company',
                'system_message',
                'პილოტი გადავიდა სხვა კომპანიაში',
                v_pilot_name || ' ადმინის მიერ გადაყვანილია სხვა კომპანიაში',
                p_pilot_id,
                v_old_company_id,
                jsonb_build_object('action', 'admin_transfer', 'new_company_id', p_company_id, 'admin_id', p_admin_id)
            );
        END IF;
    END IF;
    
    -- Update pilot's company
    UPDATE pilots
    SET company_id = p_company_id, updated_at = NOW()
    WHERE id = p_pilot_id;
    
    -- Cancel any pending requests from this pilot
    UPDATE pilot_company_requests
    SET 
        status = 'rejected',
        response_message = 'ადმინმა პირდაპირ მიანიჭა კომპანია',
        responded_at = NOW(),
        updated_at = NOW()
    WHERE pilot_id = p_pilot_id
    AND status = 'pending';
    
    -- Notify pilot about assignment
    INSERT INTO notifications (
        recipient_id,
        recipient_type,
        type,
        title,
        message,
        pilot_id,
        company_id,
        metadata
    ) VALUES (
        v_pilot_user_id,
        'pilot',
        'request_approved',
        'მინიჭებული გაქვთ კომპანია',
        'ადმინმა თქვენ მიანიჭათ კომპანია: ' || v_company_name,
        p_pilot_id,
        p_company_id,
        jsonb_build_object('action', 'admin_assign', 'admin_id', p_admin_id)
    );
    
    -- Notify new company owner about new pilot
    IF v_company_owner_id IS NOT NULL THEN
        INSERT INTO notifications (
            recipient_id,
            recipient_type,
            type,
            title,
            message,
            pilot_id,
            company_id,
            metadata
        ) VALUES (
            v_company_owner_id,
            'company',
            'request_approved',
            'ახალი პილოტი დაემატა',
            'ადმინმა თქვენს კომპანიას მიაკუთვნა პილოტი: ' || v_pilot_name,
            p_pilot_id,
            p_company_id,
            jsonb_build_object('action', 'admin_assign', 'admin_id', p_admin_id)
        );
    END IF;
END;
$$;

COMMENT ON FUNCTION admin_assign_pilot_to_company(UUID, UUID, UUID) IS 
'SuperAdmin directly assigns a pilot to a company. Sends notifications to pilot, new company, and old company (if applicable). Cancels any pending requests.';


-- Function: Admin removes pilot from company
CREATE OR REPLACE FUNCTION admin_remove_pilot_from_company(
    p_pilot_id UUID,
    p_admin_id UUID DEFAULT NULL,
    p_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_pilot_name TEXT;
    v_pilot_user_id UUID;
    v_company_id UUID;
    v_company_name TEXT;
    v_company_owner_id UUID;
BEGIN
    -- Get pilot info
    SELECT 
        user_id,
        company_id,
        COALESCE(first_name_ka, '') || ' ' || COALESCE(last_name_ka, '')
    INTO v_pilot_user_id, v_company_id, v_pilot_name
    FROM pilots
    WHERE id = p_pilot_id;
    
    IF v_pilot_user_id IS NULL THEN
        RAISE EXCEPTION 'პილოტი ვერ მოიძებნა';
    END IF;
    
    IF v_company_id IS NULL THEN
        RAISE EXCEPTION 'პილოტს კომპანია არ აქვს მინიჭებული';
    END IF;
    
    -- Get company info
    SELECT name_ka, user_id INTO v_company_name, v_company_owner_id
    FROM companies
    WHERE id = v_company_id;
    
    -- Remove pilot from company
    UPDATE pilots
    SET company_id = NULL, updated_at = NOW()
    WHERE id = p_pilot_id;
    
    -- Notify pilot about removal
    INSERT INTO notifications (
        recipient_id,
        recipient_type,
        type,
        title,
        message,
        pilot_id,
        company_id,
        metadata
    ) VALUES (
        v_pilot_user_id,
        'pilot',
        'system_message',
        'კომპანიიდან გათავისუფლება',
        COALESCE(p_reason, 'ადმინმა თქვენ გაგათავისუფლათ კომპანიიდან: ' || COALESCE(v_company_name, '')),
        p_pilot_id,
        v_company_id,
        jsonb_build_object('action', 'admin_remove', 'admin_id', p_admin_id, 'reason', p_reason)
    );
    
    -- Notify company owner about pilot removal
    IF v_company_owner_id IS NOT NULL THEN
        INSERT INTO notifications (
            recipient_id,
            recipient_type,
            type,
            title,
            message,
            pilot_id,
            company_id,
            metadata
        ) VALUES (
            v_company_owner_id,
            'company',
            'system_message',
            'პილოტი გათავისუფლდა',
            'ადმინმა გაათავისუფლა პილოტი: ' || v_pilot_name || COALESCE(' - მიზეზი: ' || p_reason, ''),
            p_pilot_id,
            v_company_id,
            jsonb_build_object('action', 'admin_remove', 'admin_id', p_admin_id, 'reason', p_reason)
        );
    END IF;
END;
$$;

COMMENT ON FUNCTION admin_remove_pilot_from_company(UUID, UUID, TEXT) IS 
'SuperAdmin removes a pilot from their current company. Sends notifications to both pilot and company owner.';


-- Function: Admin approves pilot-company request
CREATE OR REPLACE FUNCTION admin_approve_pilot_request(
    p_request_id UUID,
    p_admin_id UUID DEFAULT NULL,
    p_response TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_pilot_id UUID;
    v_company_id UUID;
    v_pilot_name TEXT;
    v_company_name TEXT;
    v_pilot_user_id UUID;
    v_company_owner_id UUID;
    v_request_type TEXT;
BEGIN
    -- Get request info
    SELECT pilot_id, company_id, request_type
    INTO v_pilot_id, v_company_id, v_request_type
    FROM pilot_company_requests
    WHERE id = p_request_id AND status = 'pending';
    
    IF v_pilot_id IS NULL THEN
        RAISE EXCEPTION 'მოთხოვნა ვერ მოიძებნა ან უკვე დამუშავებულია';
    END IF;
    
    -- Get pilot info
    SELECT 
        user_id,
        COALESCE(first_name_ka, '') || ' ' || COALESCE(last_name_ka, '')
    INTO v_pilot_user_id, v_pilot_name
    FROM pilots
    WHERE id = v_pilot_id;
    
    -- Get company info
    SELECT name_ka, user_id INTO v_company_name, v_company_owner_id
    FROM companies
    WHERE id = v_company_id;
    
    -- Approve the request
    UPDATE pilot_company_requests
    SET 
        status = 'approved',
        response_message = COALESCE(p_response, 'დამტკიცებული ადმინის მიერ'),
        responded_at = NOW(),
        updated_at = NOW()
    WHERE id = p_request_id;
    
    -- Update pilot's company
    UPDATE pilots
    SET company_id = v_company_id, updated_at = NOW()
    WHERE id = v_pilot_id;
    
    -- Reject other pending requests from same pilot
    UPDATE pilot_company_requests
    SET 
        status = 'rejected',
        response_message = 'პილოტი სხვა კომპანიაში გაწევრიანდა',
        responded_at = NOW(),
        updated_at = NOW()
    WHERE pilot_id = v_pilot_id
    AND id != p_request_id
    AND status = 'pending';
    
    -- Notify pilot
    INSERT INTO notifications (
        recipient_id,
        recipient_type,
        type,
        title,
        message,
        pilot_id,
        company_id,
        metadata
    ) VALUES (
        v_pilot_user_id,
        'pilot',
        'request_approved',
        'მოთხოვნა დამტკიცდა',
        'თქვენი მოთხოვნა ' || v_company_name || '-ში დამტკიცდა ადმინის მიერ',
        v_pilot_id,
        v_company_id,
        jsonb_build_object('action', 'admin_approve', 'admin_id', p_admin_id, 'request_type', v_request_type)
    );
    
    -- Notify company
    IF v_company_owner_id IS NOT NULL THEN
        INSERT INTO notifications (
            recipient_id,
            recipient_type,
            type,
            title,
            message,
            pilot_id,
            company_id,
            metadata
        ) VALUES (
            v_company_owner_id,
            'company',
            'request_approved',
            'პილოტი დაემატა',
            v_pilot_name || ' დაემატა თქვენს კომპანიას (ადმინის მიერ)',
            v_pilot_id,
            v_company_id,
            jsonb_build_object('action', 'admin_approve', 'admin_id', p_admin_id, 'request_type', v_request_type)
        );
    END IF;
END;
$$;

COMMENT ON FUNCTION admin_approve_pilot_request(UUID, UUID, TEXT) IS 
'SuperAdmin approves a pending pilot-company request. Sends notifications to both parties.';


-- Function: Admin rejects pilot-company request
CREATE OR REPLACE FUNCTION admin_reject_pilot_request(
    p_request_id UUID,
    p_admin_id UUID DEFAULT NULL,
    p_response TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_pilot_id UUID;
    v_company_id UUID;
    v_pilot_name TEXT;
    v_company_name TEXT;
    v_pilot_user_id UUID;
    v_company_owner_id UUID;
    v_request_type TEXT;
BEGIN
    -- Get request info
    SELECT pilot_id, company_id, request_type
    INTO v_pilot_id, v_company_id, v_request_type
    FROM pilot_company_requests
    WHERE id = p_request_id AND status = 'pending';
    
    IF v_pilot_id IS NULL THEN
        RAISE EXCEPTION 'მოთხოვნა ვერ მოიძებნა ან უკვე დამუშავებულია';
    END IF;
    
    -- Get pilot info
    SELECT 
        user_id,
        COALESCE(first_name_ka, '') || ' ' || COALESCE(last_name_ka, '')
    INTO v_pilot_user_id, v_pilot_name
    FROM pilots
    WHERE id = v_pilot_id;
    
    -- Get company info
    SELECT name_ka, user_id INTO v_company_name, v_company_owner_id
    FROM companies
    WHERE id = v_company_id;
    
    -- Reject the request
    UPDATE pilot_company_requests
    SET 
        status = 'rejected',
        response_message = COALESCE(p_response, 'უარყოფილი ადმინის მიერ'),
        responded_at = NOW(),
        updated_at = NOW()
    WHERE id = p_request_id;
    
    -- Notify pilot
    INSERT INTO notifications (
        recipient_id,
        recipient_type,
        type,
        title,
        message,
        pilot_id,
        company_id,
        metadata
    ) VALUES (
        v_pilot_user_id,
        'pilot',
        'request_rejected',
        'მოთხოვნა უარყოფილია',
        'თქვენი მოთხოვნა ' || v_company_name || '-ში უარყოფილია ადმინის მიერ' || COALESCE(': ' || p_response, ''),
        v_pilot_id,
        v_company_id,
        jsonb_build_object('action', 'admin_reject', 'admin_id', p_admin_id, 'request_type', v_request_type, 'reason', p_response)
    );
    
    -- Notify company
    IF v_company_owner_id IS NOT NULL THEN
        INSERT INTO notifications (
            recipient_id,
            recipient_type,
            type,
            title,
            message,
            pilot_id,
            company_id,
            metadata
        ) VALUES (
            v_company_owner_id,
            'company',
            'request_rejected',
            'მოთხოვნა უარყოფილია',
            v_pilot_name || '-ის მოთხოვნა უარყოფილია ადმინის მიერ',
            v_pilot_id,
            v_company_id,
            jsonb_build_object('action', 'admin_reject', 'admin_id', p_admin_id, 'request_type', v_request_type, 'reason', p_response)
        );
    END IF;
END;
$$;

COMMENT ON FUNCTION admin_reject_pilot_request(UUID, UUID, TEXT) IS 
'SuperAdmin rejects a pending pilot-company request. Sends notifications to both parties.';


-- Grant execute permissions
GRANT EXECUTE ON FUNCTION admin_assign_pilot_to_company(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_remove_pilot_from_company(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_approve_pilot_request(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_reject_pilot_request(UUID, UUID, TEXT) TO authenticated;
