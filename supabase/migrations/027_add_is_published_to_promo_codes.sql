-- Add is_published column to promo_codes table
ALTER TABLE public.promo_codes 
ADD COLUMN is_published boolean NOT NULL DEFAULT false;

-- Add index for is_published for better query performance
CREATE INDEX IF NOT EXISTS idx_promo_codes_published 
ON public.promo_codes USING btree (is_published) 
TABLESPACE pg_default;

-- Add comment for clarity
COMMENT ON COLUMN public.promo_codes.is_published IS 'Whether the promo code is visible on public promotions page. Active codes can be used even if not published (for personal offers).';
