-- Create bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- User info (optional - can be guest booking)
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Customer details
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    
    -- Booking details
    country_id UUID REFERENCES public.countries(id) ON DELETE SET NULL,
    country_name TEXT NOT NULL,
    location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    location_name TEXT NOT NULL,
    flight_type_id TEXT NOT NULL,
    flight_type_name TEXT NOT NULL,
    
    -- Date and people
    selected_date DATE NOT NULL,
    number_of_people INTEGER NOT NULL DEFAULT 1,
    
    -- Contact preferences
    contact_method TEXT CHECK (contact_method IN ('whatsapp', 'telegram', 'viber')),
    
    -- Promo code
    promo_code TEXT,
    promo_discount INTEGER DEFAULT 0,
    
    -- Special requests
    special_requests TEXT,
    
    -- Pricing
    base_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'GEL',
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_location_id ON public.bookings(location_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_selected_date ON public.bookings(selected_date);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings(created_at DESC);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Super admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Super admins can update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Super admins can delete bookings" ON public.bookings;

-- Policies

-- Anyone can create a booking (guest or authenticated)
CREATE POLICY "Anyone can create bookings"
    ON public.bookings
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Users can view their own bookings
CREATE POLICY "Users can view own bookings"
    ON public.bookings
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Super admins can view all bookings
CREATE POLICY "Super admins can view all bookings"
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

-- Super admins can update any booking
CREATE POLICY "Super admins can update bookings"
    ON public.bookings
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'SUPER_ADMIN'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'SUPER_ADMIN'
        )
    );

-- Super admins can delete bookings
CREATE POLICY "Super admins can delete bookings"
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

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_bookings_updated_at ON public.bookings;
CREATE TRIGGER set_bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_bookings_updated_at();
