-- =====================================================
-- Migration 039: Fix Pilots RLS Policy (Remove Recursion)
-- =====================================================

-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Companies can view pilots with requests" ON pilots;
DROP POLICY IF EXISTS "Companies can view their pilots" ON pilots;

-- Simple policy: Companies can view any verified pilot (they're public anyway)
-- The existing "Public can view verified pilots" policy already handles this

-- For non-verified pilots who sent requests, we'll fetch them separately
-- or use a function with SECURITY DEFINER

-- Alternative: Create a view or function for company to fetch their requests with pilot data
