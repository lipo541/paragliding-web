-- ============================================
-- CHECK ALL RLS POLICIES DIAGNOSTIC SCRIPT
-- ============================================

-- 1. Check if RLS is enabled on tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('location_pages', 'locations', 'countries', 'profiles', 'flight_types')
ORDER BY tablename;

-- 2. Check all policies for location_pages table
SELECT 
  schemaname as "Schema",
  tablename as "Table",
  policyname as "Policy Name",
  permissive as "Permissive",
  roles as "Roles",
  cmd as "Command",
  qual as "USING Expression",
  with_check as "WITH CHECK Expression"
FROM pg_policies 
WHERE tablename = 'location_pages'
ORDER BY cmd, policyname;

-- 3. Check all policies for related tables
SELECT 
  tablename as "Table",
  policyname as "Policy Name",
  cmd as "Command",
  roles as "Roles"
FROM pg_policies 
WHERE tablename IN ('locations', 'countries', 'flight_types', 'profiles')
ORDER BY tablename, cmd, policyname;

-- 4. Check current user's role
SELECT 
  id,
  email,
  role,
  created_at
FROM profiles 
WHERE id = auth.uid();

-- 5. Check if location_pages table exists and its structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'location_pages'
ORDER BY ordinal_position;

-- 6. Check for any existing location_pages records
SELECT 
  id,
  country_id,
  location_id,
  is_active,
  created_at
FROM location_pages
LIMIT 5;

-- 7. Test INSERT permission (this will show if policy blocks it)
-- Uncomment to test:
/*
DO $$
BEGIN
  INSERT INTO location_pages (country_id, location_id, content, is_active)
  VALUES (
    (SELECT id FROM countries LIMIT 1),
    (SELECT id FROM locations LIMIT 1),
    '{"test": "data"}'::jsonb,
    true
  );
  RAISE NOTICE 'INSERT test: SUCCESS';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'INSERT test: FAILED - %', SQLERRM;
END $$;
*/

-- 8. Check flight_types table policies (related table)
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'flight_types';

-- 9. Summary: Count policies by table
SELECT 
  tablename as "Table",
  COUNT(*) as "Policy Count",
  STRING_AGG(DISTINCT cmd::text, ', ') as "Commands"
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
