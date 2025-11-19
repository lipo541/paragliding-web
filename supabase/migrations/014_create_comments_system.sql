-- =====================================================
-- Migration 014: Create Comments System
-- =====================================================
-- Purpose: Implement commenting system with likes/dislikes, threading, and moderation
-- Features:
--   - comments table with polymorphic relationships
--   - Threading support (replies to comments)
--   - Like/Dislike reactions system
--   - Moderation workflow (is_approved)
--   - Cached aggregations (likes_count, dislikes_count, comments_count)
--   - Automatic trigger-based updates
--   - RLS policies for security
-- =====================================================

-- =====================================================
-- 1. Create ENUM for commentable types
-- =====================================================
CREATE TYPE commentable_type AS ENUM ('country', 'location', 'flight_type');

-- =====================================================
-- 2. Create ENUM for reaction types
-- =====================================================
CREATE TYPE reaction_type AS ENUM ('like', 'dislike');

-- =====================================================
-- 3. Create comments table
-- =====================================================
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    commentable_type commentable_type NOT NULL,
    commentable_id UUID NOT NULL,
    content TEXT NOT NULL CHECK (length(content) > 0 AND length(content) <= 5000),
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    is_approved BOOLEAN NOT NULL DEFAULT false,
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    likes_count INTEGER NOT NULL DEFAULT 0,
    dislikes_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 4. Create comment_reactions table
-- =====================================================
CREATE TABLE comment_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    reaction_type reaction_type NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure one user can react to one comment only once
    CONSTRAINT unique_user_comment_reaction UNIQUE (user_id, comment_id)
);

-- =====================================================
-- 5. Create indexes for comments table
-- =====================================================
CREATE INDEX idx_comments_commentable ON comments(commentable_type, commentable_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_parent ON comments(parent_comment_id);
CREATE INDEX idx_comments_approved ON comments(is_approved);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);

-- =====================================================
-- 6. Create indexes for comment_reactions table
-- =====================================================
CREATE INDEX idx_comment_reactions_comment ON comment_reactions(comment_id);
CREATE INDEX idx_comment_reactions_user ON comment_reactions(user_id);

-- =====================================================
-- 7. Add cached comments_count column to countries table
-- =====================================================
ALTER TABLE countries 
ADD COLUMN comments_count INTEGER DEFAULT 0;

CREATE INDEX idx_countries_comments_count ON countries(comments_count DESC);

-- =====================================================
-- 8. Add cached comments_count column to locations table
-- =====================================================
ALTER TABLE locations 
ADD COLUMN comments_count INTEGER DEFAULT 0;

CREATE INDEX idx_locations_comments_count ON locations(comments_count DESC);

-- =====================================================
-- 9. Create trigger function to update comment reaction counts
-- =====================================================
CREATE OR REPLACE FUNCTION update_comment_reaction_counts()
RETURNS TRIGGER AS $$
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
        
        -- Update comment
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
        
        -- Update comment
        UPDATE comments 
        SET likes_count = likes_total,
            dislikes_count = dislikes_total
        WHERE id = NEW.comment_id;
        
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. Create triggers for comment reactions
-- =====================================================
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
-- 11. Create trigger function to update cached comments count
-- =====================================================
CREATE OR REPLACE FUNCTION update_cached_comments_count()
RETURNS TRIGGER AS $$
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
        
        -- Update the appropriate table
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
        
        -- Update the appropriate table
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

-- =====================================================
-- 12. Create triggers for comments count
-- =====================================================
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
-- 13. Create updated_at trigger for comments
-- =====================================================
CREATE TRIGGER set_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 14. Enable Row Level Security
-- =====================================================
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 15. Create RLS Policies for comments
-- =====================================================

-- Anonymous and authenticated users can read approved comments
CREATE POLICY "comments_select_approved_policy"
    ON comments
    FOR SELECT
    USING (is_approved = true);

-- Users can read their own comments (even if not approved)
CREATE POLICY "comments_select_own_policy"
    ON comments
    FOR SELECT
    USING (auth.uid() = user_id);

-- Super admins can read all comments (for moderation)
CREATE POLICY "comments_select_admin_policy"
    ON comments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'SUPER_ADMIN'
        )
    );

-- Authenticated users can insert comments (they start as not approved)
CREATE POLICY "comments_insert_policy"
    ON comments
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update only their own comments (but not approval status)
CREATE POLICY "comments_update_own_policy"
    ON comments
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Super admins can update any comment (including approval)
CREATE POLICY "comments_update_admin_policy"
    ON comments
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'SUPER_ADMIN'
        )
    );

-- Users can delete only their own comments
CREATE POLICY "comments_delete_own_policy"
    ON comments
    FOR DELETE
    USING (auth.uid() = user_id);

-- Super admins can delete any comment
CREATE POLICY "comments_delete_admin_policy"
    ON comments
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'SUPER_ADMIN'
        )
    );

-- =====================================================
-- 16. Create RLS Policies for comment_reactions
-- =====================================================

-- Everyone can read reactions
CREATE POLICY "comment_reactions_select_policy"
    ON comment_reactions
    FOR SELECT
    USING (true);

-- Authenticated users can insert their own reactions
CREATE POLICY "comment_reactions_insert_policy"
    ON comment_reactions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update only their own reactions
CREATE POLICY "comment_reactions_update_policy"
    ON comment_reactions
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete only their own reactions
CREATE POLICY "comment_reactions_delete_policy"
    ON comment_reactions
    FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- 17. Grant permissions
-- =====================================================
GRANT SELECT ON comments TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON comments TO authenticated;

GRANT SELECT ON comment_reactions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON comment_reactions TO authenticated;

-- =====================================================
-- 18. Comments for documentation
-- =====================================================
COMMENT ON TABLE comments IS 'Stores user comments for countries, locations, and flight types with threading and moderation support';
COMMENT ON COLUMN comments.commentable_type IS 'Type of entity being commented on: country, location, or flight_type';
COMMENT ON COLUMN comments.commentable_id IS 'UUID of the entity being commented on';
COMMENT ON COLUMN comments.content IS 'Comment text content (max 5000 characters)';
COMMENT ON COLUMN comments.parent_comment_id IS 'Reference to parent comment for threading/replies (NULL for top-level comments)';
COMMENT ON COLUMN comments.is_approved IS 'Moderation flag - comments must be approved to be publicly visible';
COMMENT ON COLUMN comments.likes_count IS 'Cached count of like reactions';
COMMENT ON COLUMN comments.dislikes_count IS 'Cached count of dislike reactions';

COMMENT ON TABLE comment_reactions IS 'Stores user reactions (like/dislike) to comments';
COMMENT ON COLUMN comment_reactions.reaction_type IS 'Type of reaction: like or dislike';
COMMENT ON CONSTRAINT unique_user_comment_reaction ON comment_reactions IS 'Ensures each user can react to each comment only once';
