-- =====================================================
-- Migration 020: Fix Comments Trigger Security and RLS Policies
-- =====================================================
-- Purpose: Fix comments system triggers and RLS policies
-- Issue 1: When a regular user submits a comment, the trigger tries to
--          update countries/locations tables, but RLS blocks this.
-- Solution 1: Make trigger function SECURITY DEFINER so it runs with
--             postgres privileges, bypassing RLS for the update.
-- Issue 2: Migration 014 created different policy names than migration 018 tried to drop
-- Solution 2: Drop the correct policy names and recreate them properly
-- =====================================================

-- =====================================================
-- PART 1: Fix comment trigger function with SECURITY DEFINER
-- =====================================================

-- Drop the existing trigger function
DROP FUNCTION IF EXISTS update_cached_comments_count() CASCADE;

-- Recreate with SECURITY DEFINER
CREATE OR REPLACE FUNCTION update_cached_comments_count()
RETURNS TRIGGER 
SECURITY DEFINER  -- This makes the function run with the privileges of the function owner (postgres)
SET search_path = public
AS $$
DECLARE
    target_table TEXT;
    total_count INTEGER;
BEGIN
    -- Only count approved comments
    IF TG_OP = 'DELETE' THEN
        target_table := OLD.commentable_type::TEXT;
        
        -- Calculate new count after deletion
        SELECT COUNT(*)
        INTO total_count
        FROM comments
        WHERE commentable_type = OLD.commentable_type 
        AND commentable_id = OLD.commentable_id
        AND is_approved = true;
        
        -- Update the appropriate table (bypasses RLS due to SECURITY DEFINER)
        IF target_table = 'country' THEN
            UPDATE countries 
            SET comments_count = total_count
            WHERE id = OLD.commentable_id;
        ELSIF target_table = 'location' THEN
            UPDATE locations 
            SET comments_count = total_count
            WHERE id = OLD.commentable_id;
        END IF;
        
        RETURN OLD;
    ELSE
        -- INSERT or UPDATE
        target_table := NEW.commentable_type::TEXT;
        
        -- Calculate new count
        SELECT COUNT(*)
        INTO total_count
        FROM comments
        WHERE commentable_type = NEW.commentable_type 
        AND commentable_id = NEW.commentable_id
        AND is_approved = true;
        
        -- Update the appropriate table (bypasses RLS due to SECURITY DEFINER)
        IF target_table = 'country' THEN
            UPDATE countries 
            SET comments_count = total_count
            WHERE id = NEW.commentable_id;
        ELSIF target_table = 'location' THEN
            UPDATE locations 
            SET comments_count = total_count
            WHERE id = NEW.commentable_id;
        END IF;
        
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Recreate the triggers (they were dropped when we dropped the function)
CREATE TRIGGER trigger_update_comments_count_after_insert
    AFTER INSERT ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_cached_comments_count();

CREATE TRIGGER trigger_update_comments_count_after_update
    AFTER UPDATE ON comments
    FOR EACH ROW
    WHEN (OLD.is_approved IS DISTINCT FROM NEW.is_approved)
    EXECUTE FUNCTION update_cached_comments_count();

CREATE TRIGGER trigger_update_comments_count_after_delete
    AFTER DELETE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_cached_comments_count();

-- =====================================================
-- PART 2: Fix comments RLS policies
-- =====================================================

-- Drop the policies created by migration 014 (using correct names)
DROP POLICY IF EXISTS "comments_select_approved_policy" ON comments;
DROP POLICY IF EXISTS "comments_select_own_policy" ON comments;
DROP POLICY IF EXISTS "comments_select_admin_policy" ON comments;
DROP POLICY IF EXISTS "comments_insert_policy" ON comments;
DROP POLICY IF EXISTS "comments_update_own_policy" ON comments;
DROP POLICY IF EXISTS "comments_update_admin_policy" ON comments;
DROP POLICY IF EXISTS "comments_delete_own_policy" ON comments;
DROP POLICY IF EXISTS "comments_delete_admin_policy" ON comments;

-- Create simplified, working policies

-- Allow anyone to view approved comments
CREATE POLICY "Anyone can view approved comments"
ON comments FOR SELECT
USING (is_approved = true OR auth.uid() = user_id);

-- Allow authenticated users to insert comments
CREATE POLICY "Authenticated users can insert comments"
ON comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own comments
CREATE POLICY "Users can update own comments"
ON comments FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own comments
CREATE POLICY "Users can delete own comments"
ON comments FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Allow super admins full access
CREATE POLICY "Super admins have full access to comments"
ON comments FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'SUPER_ADMIN'
    )
);

-- =====================================================
-- PART 3: Fix comment_reactions RLS policies (already mostly done in migration 018)
-- =====================================================

-- Drop old policies from migration 014
DROP POLICY IF EXISTS "comment_reactions_select_policy" ON comment_reactions;
DROP POLICY IF EXISTS "comment_reactions_insert_policy" ON comment_reactions;
DROP POLICY IF EXISTS "comment_reactions_update_policy" ON comment_reactions;
DROP POLICY IF EXISTS "comment_reactions_delete_policy" ON comment_reactions;

-- Drop policies from migration 018 (to recreate them)
DROP POLICY IF EXISTS "Anyone can view comment reactions" ON comment_reactions;
DROP POLICY IF EXISTS "Authenticated users can insert reactions" ON comment_reactions;
DROP POLICY IF EXISTS "Users can update own reactions" ON comment_reactions;
DROP POLICY IF EXISTS "Users can delete own reactions" ON comment_reactions;

-- Create the correct policies

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

-- =====================================================
-- PART 4: Fix comment_reaction_counts trigger function with SECURITY DEFINER
-- =====================================================

-- Drop the existing trigger function
DROP FUNCTION IF EXISTS update_comment_reaction_counts() CASCADE;

-- Recreate with SECURITY DEFINER
CREATE OR REPLACE FUNCTION update_comment_reaction_counts()
RETURNS TRIGGER 
SECURITY DEFINER  -- This makes the function run with the privileges of the function owner (postgres)
SET search_path = public
AS $$
DECLARE
    likes_total INTEGER;
    dislikes_total INTEGER;
BEGIN
    -- Determine which comment to update
    IF TG_OP = 'DELETE' THEN
        -- Calculate new counts after deletion
        SELECT 
            COUNT(*) FILTER (WHERE reaction_type = 'like'),
            COUNT(*) FILTER (WHERE reaction_type = 'dislike')
        INTO likes_total, dislikes_total
        FROM comment_reactions
        WHERE comment_id = OLD.comment_id;
        
        -- Update comment (bypasses RLS due to SECURITY DEFINER)
        UPDATE comments 
        SET likes_count = likes_total,
            dislikes_count = dislikes_total
        WHERE id = OLD.comment_id;
        
        RETURN OLD;
    ELSE
        -- INSERT or UPDATE
        SELECT 
            COUNT(*) FILTER (WHERE reaction_type = 'like'),
            COUNT(*) FILTER (WHERE reaction_type = 'dislike')
        INTO likes_total, dislikes_total
        FROM comment_reactions
        WHERE comment_id = NEW.comment_id;
        
        -- Update comment (bypasses RLS due to SECURITY DEFINER)
        UPDATE comments 
        SET likes_count = likes_total,
            dislikes_count = dislikes_total
        WHERE id = NEW.comment_id;
        
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Recreate the triggers (they were dropped when we dropped the function)
CREATE TRIGGER trigger_update_reaction_counts_after_insert
    AFTER INSERT ON comment_reactions
    FOR EACH ROW
    EXECUTE FUNCTION update_comment_reaction_counts();

CREATE TRIGGER trigger_update_reaction_counts_after_update
    AFTER UPDATE ON comment_reactions
    FOR EACH ROW
    EXECUTE FUNCTION update_comment_reaction_counts();

CREATE TRIGGER trigger_update_reaction_counts_after_delete
    AFTER DELETE ON comment_reactions
    FOR EACH ROW
    EXECUTE FUNCTION update_comment_reaction_counts();

-- =====================================================
-- Comments for documentation
-- =====================================================
COMMENT ON FUNCTION update_cached_comments_count IS 'Trigger function to update cached comment counts. Uses SECURITY DEFINER to bypass RLS when updating countries/locations tables.';
COMMENT ON FUNCTION update_comment_reaction_counts IS 'Trigger function to update comment reaction counts. Uses SECURITY DEFINER to bypass RLS when updating comments table.';
