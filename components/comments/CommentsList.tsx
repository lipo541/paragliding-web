'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import CommentItem from './CommentItem';
import CommentInput from './CommentInput';
import { MessageSquare } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/hooks/useTranslation';

interface Comment {
  id: string;
  user_id: string;
  content: string;
  parent_comment_id: string | null;
  likes_count: number;
  dislikes_count: number;
  created_at: string;
  updated_at: string;
  is_approved: boolean;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  };
  replies?: Comment[];
}

interface CommentsListProps {
  commentableType: 'country' | 'location' | 'flight_type';
  commentableId: string;
}

export default function CommentsList({
  commentableType,
  commentableId,
}: CommentsListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const { t } = useTranslation('comments');

  const fetchComments = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Fetching comments for:', { commentableType, commentableId });
      
      // Get current user to show their unapproved comments too
      const { data: { user } } = await supabase.auth.getUser();
      
      // Fetch top-level comments (approved OR user's own)
      const { data: commentsData, error: fetchError } = await supabase
        .from('comments')
        .select('*')
        .eq('commentable_type', commentableType)
        .eq('commentable_id', commentableId)
        .is('parent_comment_id', null)
        .or(user ? `is_approved.eq.true,user_id.eq.${user.id}` : 'is_approved.eq.true')
        .order('created_at', { ascending: false });

      console.log('Fetched comments:', { commentsData, fetchError });

      if (fetchError) {
        console.error('Fetch error:', fetchError);
        throw fetchError;
      }

      // Fetch ALL comments at once (not just top-level)
      const { data: allCommentsData } = await supabase
        .from('comments')
        .select('*')
        .eq('commentable_type', commentableType)
        .eq('commentable_id', commentableId)
        .or(user ? `is_approved.eq.true,user_id.eq.${user.id}` : 'is_approved.eq.true')
        .order('created_at', { ascending: true });

      // Fetch profiles for all user_ids
      const allUserIds = [...new Set((allCommentsData || []).map((c: any) => c.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', allUserIds);

      const profilesMap = new Map(profilesData?.map((p: any) => [p.id, p]) || []);

      // Recursive function to build nested comment tree
      const buildCommentTree = (parentId: string | null): Comment[] => {
        const children = (allCommentsData || [])
          .filter((c: any) => c.parent_comment_id === parentId)
          .map((comment: any) => ({
            ...comment,
            profiles: profilesMap.get(comment.user_id) || { full_name: null, avatar_url: null },
            replies: buildCommentTree(comment.id), // Recursively get nested replies
          }));
        
        return children;
      };

      // Build tree starting from top-level comments (parent_comment_id = null)
      const commentsWithReplies = buildCommentTree(null);

      setComments(commentsWithReplies);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError(t('list.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [commentableType, commentableId]);

  const handleCommentAdded = () => {
    fetchComments();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          {t('list.title')} <span className="text-foreground/50 text-sm font-normal">({comments.length})</span>
        </h3>
      </div>

      <CommentInput
        commentableType={commentableType}
        commentableId={commentableId}
        onCommentAdded={handleCommentAdded}
      />

      {error && (
        <div className="text-red-500 text-xs">{error}</div>
      )}

      {comments.length === 0 ? (
        <p className="text-foreground/40 text-center py-6 text-sm">
          {t('list.noComments')}
        </p>
      ) : (
        <div className="space-y-3 mt-6">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              commentableType={commentableType}
              commentableId={commentableId}
              onCommentAdded={handleCommentAdded}
            />
          ))}
        </div>
      )}
    </div>
  );
}

