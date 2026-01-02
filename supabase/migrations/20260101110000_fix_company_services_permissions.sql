-- =====================================================
-- Fix permissions for company_selected_services table
-- Grant SELECT to anon and authenticated roles
-- =====================================================

-- Grant SELECT permission to anon role (for public viewing)
GRANT SELECT ON public.company_selected_services TO anon;

-- Grant SELECT permission to authenticated role
GRANT SELECT ON public.company_selected_services TO authenticated;

-- Grant INSERT, UPDATE, DELETE to authenticated (RLS will filter)
GRANT INSERT, UPDATE, DELETE ON public.company_selected_services TO authenticated;

-- =====================================================
-- Also ensure additional_services has proper permissions
-- =====================================================
GRANT SELECT ON public.additional_services TO anon;
GRANT SELECT ON public.additional_services TO authenticated;

-- =====================================================
-- Ensure service_categories has proper permissions
-- =====================================================
GRANT SELECT ON public.service_categories TO anon;
GRANT SELECT ON public.service_categories TO authenticated;

-- =====================================================
-- Fix permissions for notifications table
-- =====================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;

-- Grant usage on sequence for notifications
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
