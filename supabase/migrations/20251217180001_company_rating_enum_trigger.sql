-- =====================================================
-- Migration: Company Rating Enum & Trigger (Part 2)
-- =====================================================
-- Purpose: Add 'company' to enum types and create rating trigger
-- Must be separate migration to use new enum values
-- =====================================================

-- Add 'company' to ratable_type if not exists
DO $$
BEGIN
    ALTER TYPE ratable_type ADD VALUE IF NOT EXISTS 'company';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Add 'company' to commentable_type if not exists
DO $$
BEGIN
    ALTER TYPE commentable_type ADD VALUE IF NOT EXISTS 'company';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
