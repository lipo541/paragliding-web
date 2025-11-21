-- Drop existing function if exists
DROP FUNCTION IF EXISTS public.increment_promo_usage(TEXT);
DROP FUNCTION IF EXISTS public.validate_promo_code(TEXT, INTEGER, UUID);

-- Updated function to increment promo code usage count by number of people
CREATE OR REPLACE FUNCTION public.increment_promo_usage(
  promo_code_text TEXT,
  people_count INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.promo_codes
  SET usage_count = usage_count + people_count
  WHERE code = promo_code_text
  AND is_active = true;
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.increment_promo_usage(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_promo_usage(TEXT, INTEGER) TO anon;

-- Function to validate promo code before booking
CREATE OR REPLACE FUNCTION public.validate_promo_code(
  promo_code_text TEXT,
  people_count INTEGER,
  location_id_param UUID
)
RETURNS TABLE (
  is_valid BOOLEAN,
  promo_code_id UUID,
  discount_percentage INTEGER,
  error_message TEXT
) AS $$
DECLARE
  promo_record RECORD;
BEGIN
  -- Check if promo code exists and is active
  SELECT * INTO promo_record 
  FROM public.promo_codes 
  WHERE code = promo_code_text AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, 0, 'Invalid or inactive promo code';
    RETURN;
  END IF;
  
  -- Check valid_from date
  IF promo_record.valid_from IS NOT NULL AND NOW() < promo_record.valid_from THEN
    RETURN QUERY SELECT false, NULL::UUID, 0, 'Promo code not yet valid';
    RETURN;
  END IF;
  
  -- Check valid_until date
  IF promo_record.valid_until IS NOT NULL AND NOW() > promo_record.valid_until THEN
    RETURN QUERY SELECT false, NULL::UUID, 0, 'Promo code has expired';
    RETURN;
  END IF;
  
  -- Check usage_limit (considering people_count)
  IF promo_record.usage_limit IS NOT NULL 
     AND (promo_record.usage_count + people_count) > promo_record.usage_limit THEN
    RETURN QUERY SELECT false, NULL::UUID, 0, 'Promo code usage limit exceeded';
    RETURN;
  END IF;
  
  -- Check location restriction (if any locations are specified for this promo code)
  IF EXISTS (
    SELECT 1 FROM public.promo_code_locations 
    WHERE public.promo_code_locations.promo_code_id = promo_record.id
  ) THEN
    -- Locations are specified, check if current location is allowed
    IF NOT EXISTS (
      SELECT 1 FROM public.promo_code_locations 
      WHERE public.promo_code_locations.promo_code_id = promo_record.id 
      AND public.promo_code_locations.location_id = location_id_param
    ) THEN
      RETURN QUERY SELECT false, NULL::UUID, 0, 'Promo code not valid for this location';
      RETURN;
    END IF;
  END IF;
  
  -- All validations passed
  RETURN QUERY SELECT 
    true, 
    promo_record.id, 
    promo_record.discount_percentage, 
    NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.validate_promo_code(TEXT, INTEGER, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_promo_code(TEXT, INTEGER, UUID) TO anon;
