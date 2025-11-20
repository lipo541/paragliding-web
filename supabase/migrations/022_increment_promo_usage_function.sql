-- Function to increment promo code usage count
CREATE OR REPLACE FUNCTION increment_promo_usage(promo_code_text TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.promo_codes
    SET usage_count = usage_count + 1
    WHERE code = promo_code_text
    AND is_active = true;
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION increment_promo_usage(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_promo_usage(TEXT) TO anon;
