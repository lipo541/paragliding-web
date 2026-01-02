-- =====================================================
-- Fix Deposit Amount Calculation
-- =====================================================
-- deposit_amount = 50₾ × number_of_people (not fixed 50₾)
-- amount_due = total_price - deposit_amount
-- =====================================================

-- 1. Update the calculate_amount_due function to always calculate based on number_of_people
CREATE OR REPLACE FUNCTION calculate_amount_due()
RETURNS TRIGGER AS $$
BEGIN
    -- Always calculate deposit_amount = 50₾ per person
    NEW.deposit_amount := 50 * COALESCE(NEW.number_of_people, 1);
    
    -- amount_due = total_price - deposit_amount
    NEW.amount_due := COALESCE(NEW.total_price, 0) - NEW.deposit_amount;
    
    -- Ensure amount_due is not negative
    IF NEW.amount_due < 0 THEN
        NEW.amount_due := 0;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Update the trigger to also fire on number_of_people changes
DROP TRIGGER IF EXISTS calculate_amount_due_trigger ON public.bookings;
CREATE TRIGGER calculate_amount_due_trigger
    BEFORE INSERT OR UPDATE OF total_price, deposit_amount, number_of_people ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION calculate_amount_due();

-- 3. Update existing bookings to have correct deposit_amount
UPDATE public.bookings
SET 
    deposit_amount = 50 * COALESCE(number_of_people, 1),
    amount_due = COALESCE(total_price, 0) - (50 * COALESCE(number_of_people, 1))
WHERE deposit_amount = 50 OR deposit_amount IS NULL;

-- 4. Update comments
COMMENT ON COLUMN public.bookings.deposit_amount IS 'ონლაინ გადახდილი თანხა (პლატფორმის საკომისიო) - 50₾ თითო პერსონაზე';
COMMENT ON COLUMN public.bookings.amount_due IS 'ადგილზე გადასახდელი თანხა პილოტისთვის/კომპანიისთვის (total_price - deposit_amount)';
