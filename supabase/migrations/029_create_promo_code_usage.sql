-- Create promo_code_usage table to track individual promo code usage per booking
CREATE TABLE IF NOT EXISTS public.promo_code_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  promo_code_id UUID REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  people_count INTEGER NOT NULL CHECK (people_count > 0),
  discount_amount DECIMAL(10, 2) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_promo_usage_user_id ON public.promo_code_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_promo_usage_booking_id ON public.promo_code_usage(booking_id);
CREATE INDEX IF NOT EXISTS idx_promo_usage_promo_code_id ON public.promo_code_usage(promo_code_id);
CREATE INDEX IF NOT EXISTS idx_promo_usage_used_at ON public.promo_code_usage(used_at DESC);

-- Enable RLS
ALTER TABLE public.promo_code_usage ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their promo usage" ON public.promo_code_usage;
DROP POLICY IF EXISTS "Users can view their promo usage" ON public.promo_code_usage;
DROP POLICY IF EXISTS "SuperAdmin can view all promo usage" ON public.promo_code_usage;
DROP POLICY IF EXISTS "Anonymous users can insert promo usage" ON public.promo_code_usage;

-- Anonymous users can insert promo usage (for guest bookings)
CREATE POLICY "Anonymous users can insert promo usage"
  ON public.promo_code_usage
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Users can insert their promo usage
CREATE POLICY "Users can insert their promo usage"
  ON public.promo_code_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own promo usage
CREATE POLICY "Users can view their promo usage"
  ON public.promo_code_usage
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- SuperAdmin can view all promo usage
CREATE POLICY "SuperAdmin can view all promo usage"
  ON public.promo_code_usage
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'SUPER_ADMIN'
    )
  );

-- SuperAdmin can delete promo usage records
CREATE POLICY "SuperAdmin can delete promo usage"
  ON public.promo_code_usage
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'SUPER_ADMIN'
    )
  );
