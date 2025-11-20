-- Fix bookings RLS policies for guest bookings

-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Super admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Super admins can update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Super admins can delete bookings" ON public.bookings;

-- Allow anyone (including anon) to insert bookings
CREATE POLICY "Enable insert for all users"
    ON public.bookings
    FOR INSERT
    WITH CHECK (true);

-- Authenticated users can view their own bookings
CREATE POLICY "Enable select for own bookings"
    ON public.bookings
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Super admins can view all bookings
CREATE POLICY "Enable select for super admins"
    ON public.bookings
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'SUPER_ADMIN'
        )
    );

-- Super admins can update bookings
CREATE POLICY "Enable update for super admins"
    ON public.bookings
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'SUPER_ADMIN'
        )
    );

-- Super admins can delete bookings
CREATE POLICY "Enable delete for super admins"
    ON public.bookings
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'SUPER_ADMIN'
        )
    );
