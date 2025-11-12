-- Assign SUPER_ADMIN role to existing user
-- Email: zaza.liparteliani888@gmail.com
-- This user is already registered, we just need to update their role

-- Update user role to SUPER_ADMIN
UPDATE profiles
SET role = 'SUPER_ADMIN'
WHERE email = 'zaza.liparteliani888@gmail.com';

-- Verify the update
SELECT id, email, full_name, role, created_at
FROM profiles 
WHERE email = 'zaza.liparteliani888@gmail.com';
