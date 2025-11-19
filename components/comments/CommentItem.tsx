'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ThumbsUp, ThumbsDown, Reply, Trash2, Edit2, MessageSquare } from 'lucide-react';
import CommentInput from './CommentInput';
import { formatDistanceToNow } from 'date-fns';
import { ka } from 'date-fns/locale';

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

interface CommentItemProps {
  comment: Comment;
  commentableType: 'country' | 'location' | 'flight_type';
  commentableId: string;
  onCommentAdded: () => void;
  isReply?: boolean;
}

export default function CommentItem({
  comment,
  commentableType,
  commentableId,
  onCommentAdded,
  isReply = false,
}: CommentItemProps) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const [userReaction, setUserReaction] = useState<'like' | 'dislike' | null>(null);
  const [localLikesCount, setLocalLikesCount] = useState(comment.likes_count);
  const [localDislikesCount, setLocalDislikesCount] = useState(comment.dislikes_count);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showReplies, setShowReplies] = useState(false);
  const [isReacting, setIsReacting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const supabase = createClient();
  
  // Recursively count all nested replies
  const getTotalRepliesCount = (comment: Comment): number => {
    if (!comment.replies || comment.replies.length === 0) return 0;
    
    let count = comment.replies.length;
    comment.replies.forEach(reply => {
      count += getTotalRepliesCount(reply);
    });
    
    return count;
  };
  
  const repliesCount = getTotalRepliesCount(comment);
  
  // Check if comment was edited
  const isEdited = comment.updated_at !== comment.created_at;
  
  // Format time intelligently
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 10) return 'ახლახანს';
    return formatDistanceToNow(date, { addSuffix: true, locale: ka });
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        
        // Fetch user role
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profileData) {
          setUserRole(profileData.role);
        }

        // Fetch user's existing reaction
        const { data } = await supabase
          .from('comment_reactions')
          .select('reaction_type')
          .eq('comment_id', comment.id)
          .eq('user_id', user.id)
          .single();

        if (data) {
          setUserReaction(data.reaction_type);
        }
      }
    };
    fetchUserData();
  }, [comment.id, supabase]);

  const handleReaction = async (reactionType: 'like' | 'dislike') => {
    if (!currentUserId) {
      alert('გთხოვთ შეხვიდეთ სისტემაში');
      return;
    }
    
    if (isReacting) return;
    setIsReacting(true);
    
    // Store previous state for rollback
    const previousReaction = userReaction;
    const previousLikes = localLikesCount;
    const previousDislikes = localDislikesCount;

    try {
      // Optimistic update
      if (userReaction === reactionType) {
        // Remove reaction
        setUserReaction(null);
        if (reactionType === 'like') {
          setLocalLikesCount((prev) => prev - 1);
        } else {
          setLocalDislikesCount((prev) => prev - 1);
        }
      } else {
        // Add or switch reaction
        setUserReaction(reactionType);
        if (userReaction) {
          // Switching
          if (userReaction === 'like') {
            setLocalLikesCount((prev) => prev - 1);
            setLocalDislikesCount((prev) => prev + 1);
          } else {
            setLocalDislikesCount((prev) => prev - 1);
            setLocalLikesCount((prev) => prev + 1);
          }
        } else {
          // New reaction
          if (reactionType === 'like') {
            setLocalLikesCount((prev) => prev + 1);
          } else {
            setLocalDislikesCount((prev) => prev + 1);
          }
        }
      }
      
      // Server update
      if (previousReaction === reactionType) {
        await supabase
          .from('comment_reactions')
          .delete()
          .eq('comment_id', comment.id)
          .eq('user_id', currentUserId);
      } else {
        await supabase.from('comment_reactions').upsert(
          {
            comment_id: comment.id,
            user_id: currentUserId,
            reaction_type: reactionType,
          },
          {
            onConflict: 'user_id,comment_id',
          }
        );
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
      // Rollback on error
      setUserReaction(previousReaction);
      setLocalLikesCount(previousLikes);
      setLocalDislikesCount(previousDislikes);
    } finally {
      setIsReacting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('დარწმუნებული ხართ რომ გსურთ კომენტარის წაშლა?')) return;

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', comment.id);

      if (error) throw error;
      onCommentAdded();
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('კომენტარის წაშლა ვერ მოხერხდა');
    }
  };

  const handleEdit = async () => {
    try {
      const { error } = await supabase
        .from('comments')
        .update({ content: editedContent })
        .eq('id', comment.id);

      if (error) throw error;
      setIsEditing(false);
      onCommentAdded();
    } catch (error) {
      console.error('Error updating comment:', error);
      alert('კომენტარის განახლება ვერ მოხერხდა');
    }
  };
  
  const handleApprove = async () => {
    if (!currentUserId) return;
    setIsApproving(true);
    
    try {
      const { error } = await supabase
        .from('comments')
        .update({
          is_approved: true,
          approved_at: new Date().toISOString(),
          approved_by: currentUserId,
        })
        .eq('id', comment.id);

      if (error) throw error;
      onCommentAdded();
    } catch (error) {
      console.error('Error approving comment:', error);
      alert('დადასტურება ვერ მოხერხდა');
    } finally {
      setIsApproving(false);
    }
  };
  
  const handleReject = async () => {
    if (!confirm('დარწმუნებული ხართ რომ გსურთ კომენტარის უარყოფა?')) return;
    setIsApproving(true);
    
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', comment.id);

      if (error) throw error;
      onCommentAdded();
    } catch (error) {
      console.error('Error rejecting comment:', error);
      alert('უარყოფა ვერ მოხერხდა');
    } finally {
      setIsApproving(false);
    }
  };

  const isOwner = currentUserId === comment.user_id;
  const isSuperAdmin = userRole === 'SUPER_ADMIN';

  return (
    <div 
      className={`${isReply ? 'ml-6 sm:ml-8' : ''} rounded-lg transition-colors duration-200 ${isHovered ? 'bg-foreground/[0.02]' : ''} p-2 -m-2`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header: Avatar + Name + Time */}
      <div className="flex gap-1.5 sm:gap-3 items-center mb-1 sm:mb-2">
        <div className="flex-shrink-0">
          <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-[9px] sm:text-xs font-semibold">
            {comment.profiles.full_name?.[0]?.toUpperCase() || 'U'}
          </div>
        </div>
        <p className="font-semibold text-[10px] sm:text-sm">
          {comment.profiles.full_name || 'მომხმარებელი'}
        </p>
        <span className="text-[8px] sm:text-[11px] text-foreground/40 flex items-center gap-1">
          {formatTime(comment.created_at)}
          {isEdited && (
            <span className="text-[8px] text-foreground/30" title="რედაქტირებული">
              (რედ.)
            </span>
          )}
        </span>
      </div>
      
      {/* Content */}
      <div className="ml-[30px] sm:ml-[48px]">
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-foreground/10 rounded-2xl bg-foreground/[0.03] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={2}
            />
            <div className="flex gap-2">
              <button
                onClick={handleEdit}
                className="px-3 py-1.5 text-xs font-medium bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
              >
                შენახვა
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedContent(comment.content);
                }}
                className="px-3 py-1.5 text-xs font-medium bg-foreground/10 rounded-full hover:bg-foreground/20 transition-colors"
              >
                გაუქმება
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-foreground/90 text-[11px] sm:text-sm leading-relaxed break-words">{comment.content}</p>
            {!comment.is_approved && (
              <p className="text-[9px] text-yellow-600 dark:text-yellow-500 mt-1 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
                მოდერაციის მოლოდინში
              </p>
            )}
            
            {/* Actions row */}
            <div className="flex items-center flex-wrap gap-1.5 sm:gap-3 mt-1 sm:mt-2">
                <button
                  onClick={() => handleReaction('like')}
                  disabled={isReacting}
                  className={`text-[9px] sm:text-xs font-medium transition-all disabled:opacity-50 ${
                    userReaction === 'like'
                      ? 'text-blue-500 scale-110'
                      : 'text-foreground/50 hover:text-blue-500 hover:scale-110'
                  }`}
                  title="მოწონება"
                  aria-label="მოწონება"
                >
                  <span className="flex items-center gap-0.5 sm:gap-1">
                    <ThumbsUp className="w-2 h-2 sm:w-3.5 sm:h-3.5" />
                    {localLikesCount > 0 && <span>{localLikesCount}</span>}
                  </span>
                </button>

                <button
                  onClick={() => handleReaction('dislike')}
                  disabled={isReacting}
                  className={`text-[9px] sm:text-xs font-medium transition-all disabled:opacity-50 ${
                    userReaction === 'dislike'
                      ? 'text-red-500 scale-110'
                      : 'text-foreground/50 hover:text-red-500 hover:scale-110'
                  }`}
                  title="არ მოწონება"
                  aria-label="არ მოწონება"
                >
                  <span className="flex items-center gap-0.5 sm:gap-1">
                    <ThumbsDown className="w-2 h-2 sm:w-3.5 sm:h-3.5" />
                    {localDislikesCount > 0 && <span>{localDislikesCount}</span>}
                  </span>
                </button>

                <button
                  onClick={() => setShowReplyInput(!showReplyInput)}
                  className="text-[9px] sm:text-xs font-medium text-foreground/50 hover:text-foreground/80 hover:scale-110 transition-all"
                  title="პასუხის დაწერა"
                  aria-label="პასუხის დაწერა"
                >
                  პასუხი
                </button>
                
                {repliesCount > 0 && (
                  <button
                    onClick={() => setShowReplies(!showReplies)}
                    className="text-[9px] sm:text-xs font-medium text-blue-500/80 hover:text-blue-500 transition-colors flex items-center gap-0.5 sm:gap-1.5"
                  >
                    <MessageSquare className="w-2 h-2 sm:w-3.5 sm:h-3.5" />
                    {repliesCount} პასუხი
                  </button>
                )}
                
                {isOwner && (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-[9px] sm:text-xs font-medium text-foreground/50 hover:text-foreground/80 transition-colors"
                    >
                      რედაქტირება
                    </button>
                    <button
                      onClick={handleDelete}
                      className="text-[9px] sm:text-xs font-medium text-red-500/70 hover:text-red-500 transition-colors"
                    >
                      წაშლა
                    </button>
                  </>
                )}
                
                {/* Admin moderation buttons */}
                {isSuperAdmin && !comment.is_approved && !isOwner && (
                  <>
                    <button
                      onClick={handleApprove}
                      disabled={isApproving}
                      className="text-[9px] sm:text-xs font-medium text-green-600 hover:text-green-700 disabled:opacity-50 transition-colors flex items-center gap-1"
                      title="დადასტურება"
                    >
                      ✓ დადასტურება
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={isApproving}
                      className="text-[9px] sm:text-xs font-medium text-red-500/70 hover:text-red-500 disabled:opacity-50 transition-colors flex items-center gap-1"
                      title="უარყოფა"
                    >
                      ✕ უარყოფა
                    </button>
                  </>
                )}
            </div>
          </>
        )}
      </div>

      {/* Reply Input - Always reply to root comment, not nested */}
      {showReplyInput && (
        <div className="mt-1.5 sm:mt-3 ml-[30px] sm:ml-[48px]">
          <CommentInput
            commentableType={commentableType}
            commentableId={commentableId}
            parentCommentId={isReply ? comment.parent_comment_id : comment.id}
            replyToUserName={comment.profiles.full_name}
            onCommentAdded={() => {
              setShowReplyInput(false);
              onCommentAdded();
            }}
            placeholder="დაწერეთ პასუხი..."
          />
        </div>
      )}

      {/* Replies - Only show when showReplies is true */}
      {showReplies && comment.replies && comment.replies.length > 0 && (
        <div className="mt-1 sm:mt-1.5 space-y-1 sm:space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              commentableType={commentableType}
              commentableId={commentableId}
              onCommentAdded={onCommentAdded}
              isReply={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}
