-- Grant explicit permissions to anon role for bookings table

-- Grant INSERT permission to anon role
GRANT INSERT ON public.bookings TO anon;

-- Grant USAGE on the sequence (for id generation)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Ensure the policy works
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Re-create the insert policy with explicit anon grant
DROP POLICY IF EXISTS "Enable insert for all users" ON public.bookings;

CREATE POLICY "Enable insert for all users"
    ON public.bookings
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);
