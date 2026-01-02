-- Create profile-IMG-bucket storage bucket for all profile images
-- ფოლდერების სტრუქტურა: 
--   users/{user_id}/ - user ებისთვის
--   სხვა როლებისთვის შემდგომში შეიძლება დაემატოს: admins/{admin_id}/, pilots/{pilot_id}/ და ა.შ.
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-IMG-bucket', 'profile-IMG-bucket', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS for profile-IMG-bucket
-- Public read access for all profile images
CREATE POLICY "Profile images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-IMG-bucket');

-- Users can upload their own avatar in users/{user_id}/ folder
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-IMG-bucket' 
    AND (storage.foldername(name))[1] = 'users'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Users can update their own avatar
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'profile-IMG-bucket' 
    AND (storage.foldername(name))[1] = 'users'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Users can delete their own avatar
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'profile-IMG-bucket' 
    AND (storage.foldername(name))[1] = 'users'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );
