-- Migration: Add 'pilot' and 'company' to ratable_type enum
-- This allows users to rate pilots and companies

-- Add new values to the ratable_type enum
ALTER TYPE public.ratable_type ADD VALUE IF NOT EXISTS 'pilot';
ALTER TYPE public.ratable_type ADD VALUE IF NOT EXISTS 'company';

-- Note: The ratings and comments tables already use this enum type,
-- so no table changes are needed. The existing RLS policies should work for these types as well.
