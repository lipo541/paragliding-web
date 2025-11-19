-- Fix RLS policies for ratings table to allow authenticated users

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view all ratings" ON ratings;
DROP POLICY IF EXISTS "Users can insert their own ratings" ON ratings;
DROP POLICY IF EXISTS "Users can update their own ratings" ON ratings;
DROP POLICY IF EXISTS "Users can delete their own ratings" ON ratings;

-- Allow anyone to view ratings (public read)
CREATE POLICY "Anyone can view ratings"
ON ratings FOR SELECT
USING (true);

-- Allow authenticated users to insert ratings
CREATE POLICY "Authenticated users can insert ratings"
ON ratings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own ratings
CREATE POLICY "Users can update own ratings"
ON ratings FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own ratings
CREATE POLICY "Users can delete own ratings"
ON ratings FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Fix comment_reactions policies
DROP POLICY IF EXISTS "Anyone can view comment reactions" ON comment_reactions;
DROP POLICY IF EXISTS "Authenticated users can insert reactions" ON comment_reactions;
DROP POLICY IF EXISTS "Users can update own reactions" ON comment_reactions;
DROP POLICY IF EXISTS "Users can delete own reactions" ON comment_reactions;

-- Allow anyone to view comment reactions (public read)
CREATE POLICY "Anyone can view comment reactions"
ON comment_reactions FOR SELECT
USING (true);

-- Allow authenticated users to insert reactions
CREATE POLICY "Authenticated users can insert reactions"
ON comment_reactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own reactions
CREATE POLICY "Users can update own reactions"
ON comment_reactions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own reactions
CREATE POLICY "Users can delete own reactions"
ON comment_reactions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
