-- =====================================================
-- Migration 043: Booking System Upgrade for Payment Integration
-- =====================================================
-- Purpose: Add pilot/company assignment, payment tracking, and booking source
-- Financial Model: 50₾ platform fee (deposit) + remaining paid on-site
-- =====================================================

-- 1. Create booking source ENUM
DO $$ BEGIN
    CREATE TYPE booking_source_enum AS ENUM (
        'platform_general',  -- ჯავშანი xparagliding.com-დან (პლატფორმა ანაწილებს)
        'company_direct',    -- ჯავშანი კომპანიის გვერდიდან (კომპანია ანაწილებს)
        'pilot_direct'       -- ჯავშანი პილოტის პროფილიდან (პირდაპირი)
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create payment status ENUM
DO $$ BEGIN
    CREATE TYPE payment_status_enum AS ENUM (
        'pending_deposit',   -- დეპოზიტი არ არის გადახდილი
        'deposit_paid',      -- 50₾ გადახდილია
        'fully_paid',        -- სრულად გადახდილი (ადგილზე)
        'refunded',          -- დაბრუნებულია
        'failed'             -- გადახდა ჩაიშალა
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Create refund status ENUM
DO $$ BEGIN
    CREATE TYPE refund_status_enum AS ENUM (
        'none',              -- დაბრუნება არ მოხდა
        'pending',           -- დაბრუნება პროცესშია
        'processed',         -- დაბრუნებულია
        'rejected'           -- უარყოფილია
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Add new columns to bookings table
-- Assignment columns (ვის ეკუთვნის ჯავშანი)
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS pilot_id UUID REFERENCES public.pilots(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;

-- Booking source (საიდან მოვიდა კლიენტი)
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS booking_source booking_source_enum DEFAULT 'platform_general';

-- Financial columns (50₾ დეპოზიტის მოდელი)
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10, 2) DEFAULT 50.00,
ADD COLUMN IF NOT EXISTS amount_due DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS payment_status payment_status_enum DEFAULT 'pending_deposit';

-- Cancellation columns
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS refund_status refund_status_enum DEFAULT 'none';

-- 5. Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_bookings_pilot_id ON public.bookings(pilot_id);
CREATE INDEX IF NOT EXISTS idx_bookings_company_id ON public.bookings(company_id);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_source ON public.bookings(booking_source);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON public.bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_stripe_payment_intent ON public.bookings(stripe_payment_intent_id);

-- 6. Add Stripe account columns to pilots and companies (for future auto-payouts)
ALTER TABLE public.pilots
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT FALSE;

ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT FALSE;

-- 7. Create transactions table for payment history
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    
    -- Amount
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'GEL',
    
    -- Type
    transaction_type TEXT NOT NULL CHECK (
        transaction_type IN ('deposit', 'refund', 'onsite_payment')
    ),
    
    -- Stripe references
    stripe_payment_id TEXT,
    stripe_refund_id TEXT,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (
        status IN ('pending', 'completed', 'failed', 'cancelled')
    ),
    
    -- Metadata (JSON for additional info)
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Notes
    notes TEXT
);

-- 8. Create indexes for transactions
CREATE INDEX IF NOT EXISTS idx_transactions_booking_id ON public.transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_payment_id ON public.transactions(stripe_payment_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);

-- 9. Enable RLS on transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies for transactions
-- Users can view transactions for their bookings
CREATE POLICY "Users can view own transactions"
    ON public.transactions
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.bookings
            WHERE bookings.id = transactions.booking_id
            AND bookings.user_id = auth.uid()
        )
    );

-- Super admins can view all transactions
CREATE POLICY "Super admins can view all transactions"
    ON public.transactions
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'SUPER_ADMIN'
        )
    );

-- Super admins can insert transactions
CREATE POLICY "Super admins can insert transactions"
    ON public.transactions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'SUPER_ADMIN'
        )
    );

-- Service role can do everything (for API routes)
CREATE POLICY "Service role full access to transactions"
    ON public.transactions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 11. New RLS policies for bookings (pilot and company access)

-- Pilots can view their assigned bookings
DROP POLICY IF EXISTS "Pilots can view assigned bookings" ON public.bookings;
CREATE POLICY "Pilots can view assigned bookings"
    ON public.bookings
    FOR SELECT
    TO authenticated
    USING (
        pilot_id IN (
            SELECT id FROM public.pilots WHERE user_id = auth.uid()
        )
    );

-- Pilots can update status of their assigned bookings
DROP POLICY IF EXISTS "Pilots can update assigned bookings" ON public.bookings;
CREATE POLICY "Pilots can update assigned bookings"
    ON public.bookings
    FOR UPDATE
    TO authenticated
    USING (
        pilot_id IN (
            SELECT id FROM public.pilots WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        pilot_id IN (
            SELECT id FROM public.pilots WHERE user_id = auth.uid()
        )
    );

-- Companies can view their bookings
DROP POLICY IF EXISTS "Companies can view their bookings" ON public.bookings;
CREATE POLICY "Companies can view their bookings"
    ON public.bookings
    FOR SELECT
    TO authenticated
    USING (
        company_id IN (
            SELECT id FROM public.companies WHERE user_id = auth.uid()
        )
    );

-- Companies can update their bookings (assign pilots)
DROP POLICY IF EXISTS "Companies can update their bookings" ON public.bookings;
CREATE POLICY "Companies can update their bookings"
    ON public.bookings
    FOR UPDATE
    TO authenticated
    USING (
        company_id IN (
            SELECT id FROM public.companies WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        company_id IN (
            SELECT id FROM public.companies WHERE user_id = auth.uid()
        )
    );

-- 12. Function to calculate amount_due when booking is created
CREATE OR REPLACE FUNCTION calculate_amount_due()
RETURNS TRIGGER AS $$
BEGIN
    -- amount_due = total_price - deposit_amount
    NEW.amount_due := COALESCE(NEW.total_price, 0) - COALESCE(NEW.deposit_amount, 50);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 13. Trigger to auto-calculate amount_due
DROP TRIGGER IF EXISTS calculate_amount_due_trigger ON public.bookings;
CREATE TRIGGER calculate_amount_due_trigger
    BEFORE INSERT OR UPDATE OF total_price, deposit_amount ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION calculate_amount_due();

-- 14. Function to check if booking can be cancelled with full refund (24+ hours before)
CREATE OR REPLACE FUNCTION can_cancel_with_refund(booking_id UUID)
RETURNS TABLE (
    can_cancel BOOLEAN,
    refund_amount DECIMAL,
    reason TEXT
) AS $$
DECLARE
    v_selected_date DATE;
    v_deposit_amount DECIMAL;
    v_hours_until_flight INTERVAL;
BEGIN
    SELECT selected_date, deposit_amount 
    INTO v_selected_date, v_deposit_amount
    FROM public.bookings 
    WHERE id = booking_id;
    
    IF v_selected_date IS NULL THEN
        RETURN QUERY SELECT FALSE, 0::DECIMAL, 'ჯავშანი ვერ მოიძებნა'::TEXT;
        RETURN;
    END IF;
    
    v_hours_until_flight := v_selected_date - CURRENT_DATE;
    
    IF v_hours_until_flight > INTERVAL '1 day' THEN
        -- მეტია 24 საათზე - სრული დაბრუნება
        RETURN QUERY SELECT TRUE, v_deposit_amount, 'სრული თანხის დაბრუნება (24+ საათი ფრენამდე)'::TEXT;
    ELSIF v_hours_until_flight > INTERVAL '0 days' THEN
        -- ნაკლებია 24 საათზე - თანხა არ ბრუნდება
        RETURN QUERY SELECT TRUE, 0::DECIMAL, 'თანხა არ ბრუნდება (24 საათზე ნაკლები ფრენამდე)'::TEXT;
    ELSE
        -- ფრენის დრო გავიდა
        RETURN QUERY SELECT FALSE, 0::DECIMAL, 'გაუქმება შეუძლებელია (ფრენის დრო გავიდა)'::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION can_cancel_with_refund(UUID) TO authenticated;

-- 15. Comments for documentation
COMMENT ON COLUMN public.bookings.pilot_id IS 'პილოტი რომელიც შეასრულებს ფრენას';
COMMENT ON COLUMN public.bookings.company_id IS 'კომპანია რომელსაც ეკუთვნის ჯავშანი';
COMMENT ON COLUMN public.bookings.booking_source IS 'საიდან მოვიდა ჯავშანი: platform_general (საიტიდან), company_direct (კომპანიის გვერდიდან), pilot_direct (პილოტის გვერდიდან)';
COMMENT ON COLUMN public.bookings.deposit_amount IS 'ონლაინ გადახდილი თანხა (პლატფორმის საკომისიო) - ფიქსირებული 50₾';
COMMENT ON COLUMN public.bookings.amount_due IS 'ადგილზე გადასახდელი თანხა (total_price - deposit_amount)';
COMMENT ON COLUMN public.bookings.payment_status IS 'გადახდის სტატუსი: pending_deposit, deposit_paid, fully_paid, refunded, failed';
COMMENT ON TABLE public.transactions IS 'გადახდების ისტორია - ინახავს ყველა ფინანსურ ტრანზაქციას';

-- =====================================================
-- Migration Complete!
-- =====================================================
