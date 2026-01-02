-- =====================================================
-- Add missing columns to bookings table
-- =====================================================
-- This migration adds columns for:
-- - pilot_id: Direct pilot booking reference
-- - company_id: Company booking reference  
-- - booking_source: Track where booking originated
-- - services_total: Total price of additional services
-- - additional_services: JSONB array of selected services
-- =====================================================

-- Add pilot_id column with foreign key reference
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS pilot_id UUID REFERENCES public.pilots(id) ON DELETE SET NULL;

-- Add company_id column with foreign key reference
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

-- Add booking_source column to track booking origin
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS booking_source TEXT DEFAULT 'platform_general';

-- Add services_total column for additional services pricing
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS services_total NUMERIC(10,2) DEFAULT 0;

-- Add additional_services JSONB column for service details
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS additional_services JSONB;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_pilot_id ON public.bookings(pilot_id);
CREATE INDEX IF NOT EXISTS idx_bookings_company_id ON public.bookings(company_id);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_source ON public.bookings(booking_source);

-- Add check constraint for booking_source values
ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS bookings_booking_source_check;

ALTER TABLE public.bookings
ADD CONSTRAINT bookings_booking_source_check 
CHECK (booking_source IN ('platform_general', 'company_direct', 'pilot_direct'));

-- Add comment for documentation
COMMENT ON COLUMN public.bookings.pilot_id IS 'Reference to the pilot for direct pilot bookings';
COMMENT ON COLUMN public.bookings.company_id IS 'Reference to the company for company bookings';
COMMENT ON COLUMN public.bookings.booking_source IS 'Origin of booking: platform_general, company_direct, or pilot_direct';
COMMENT ON COLUMN public.bookings.services_total IS 'Total price of additional services selected';
COMMENT ON COLUMN public.bookings.additional_services IS 'JSONB array of selected additional services with details';
