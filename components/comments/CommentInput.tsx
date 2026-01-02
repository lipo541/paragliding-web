'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Send, Smile } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/hooks/useTranslation';

interface CommentInputProps {
  commentableType: 'country' | 'location' | 'flight_type' | 'company';
  commentableId: string;
  parentCommentId?: string | null;
  onCommentAdded: () => void;
  placeholder?: string;
  replyToUserName?: string | null;
}

export default function CommentInput({
  commentableType,
  commentableId,
  parentCommentId = null,
  onCommentAdded,
  placeholder,
  replyToUserName = null,
}: CommentInputProps) {
  const { t } = useTranslation('comments');
  const [content, setContent] = useState(replyToUserName ? `@${replyToUserName} ` : '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const supabase = createClient();
  
  const displayPlaceholder = placeholder || (parentCommentId ? t('input.replyPlaceholder') : t('input.placeholder'));

  // Paragliding and flying related emojis with common ones
  const commonEmojis = [
    '🪂', '🏔️', '⛰️', '🌄', '🌅', '🌤️', '☀️', '🌈', '⛅', '☁️',
    '💨', '🌬️', '🦅', '🕊️', '✈️', '🛩️', '🚁', '🎈', '🪁', '🌍',
    '🗺️', '🧭', '📸', '📹', '🎥', '👨‍✈️', '👩‍✈️', '🏆', '🥇', '🎯',
    '💪', '👍', '👏', '🙌', '✌️', '🤙', '🤘', '👌', '🔥', '⚡',
    '✨', '💫', '⭐', '🌟', '💯', '🎉', '🎊', '🥳', '😎', '😍',
    '🤩', '😊', '😁', '🤗', '🙏', '❤️', '🧡', '💛', '💚', '💙'
  ];

  const insertEmoji = (emoji: string) => {
    setContent(prev => prev + emoji);
    // Don't close picker - let user add multiple emojis
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setError(t('input.emptyError'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      console.log('Starting comment submission...');
      const {
        data: { user },
      } = await supabase.auth.getUser();

      console.log('User:', user);

      if (!user) {
        setError(t('input.loginRequired'));
        setIsSubmitting(false);
        return;
      }

      // Check if user is SUPER_ADMIN
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const isSuperAdmin = profile?.role === 'SUPER_ADMIN';

      const commentData = {
        user_id: user.id,
        commentable_type: commentableType,
        commentable_id: commentableId,
        parent_comment_id: parentCommentId,
        content: content.trim(),
        is_approved: isSuperAdmin, // Auto-approve for SUPER_ADMIN
        ...(isSuperAdmin && {
          approved_at: new Date().toISOString(),
          approved_by: user.id,
        }),
      };

      console.log('Inserting comment:', commentData);

      const { data: insertedData, error: insertError } = await supabase
        .from('comments')
        .insert(commentData)
        .select();

      console.log('Insert result:', { insertedData, insertError });

      if (insertError) throw insertError;

      setContent('');
      if (isSuperAdmin) {
        alert(t('input.published'));
      } else {
        alert(t('input.awaitingModeration'));
      }
      onCommentAdded();
    } catch (err) {
      console.error('Error submitting comment:', err);
      setError(t('input.submitError') + ': ' + (err as any)?.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="relative bg-[#4697D2]/10 dark:bg-white/5 rounded-2xl border border-[#4697D2]/30 dark:border-white/20 hover:border-[#4697D2]/50 dark:hover:border-white/30 transition-all">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={displayPlaceholder}
          rows={1}
          maxLength={5000}
          disabled={isSubmitting}
          className="w-full px-3 py-2 sm:px-4 sm:py-3 pr-16 sm:pr-20 text-xs sm:text-sm bg-transparent text-[#1a1a1a] dark:text-white
                   placeholder:text-[#1a1a1a]/40 dark:placeholder:text-white/40
                   focus:outline-none
                   disabled:opacity-50 disabled:cursor-not-allowed
                   resize-none"
          onFocus={() => setShowEmojiPicker(false)}
        />
        <div className="absolute right-1.5 top-1.5 sm:right-2 sm:top-2 flex items-center gap-0.5 sm:gap-1">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-1 sm:p-1.5 hover:bg-[#4697D2]/10 dark:hover:bg-white/10 rounded-full transition-colors"
            title={t('input.addEmoji')}
          >
            <Smile className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#1a1a1a]/50 dark:text-white/50" />
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="p-1 sm:p-1.5 bg-blue-500 text-white rounded-full
                     hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all"
            title={t('input.send')}
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 border-2 border-white border-t-transparent"></div>
            ) : (
              <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            )}
          </button>
        </div>
        
        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="absolute bottom-full mb-2 right-0 bg-white/95 dark:bg-black/90 backdrop-blur-xl border border-[#4697D2]/30 dark:border-white/20 rounded-xl shadow-2xl p-2 sm:p-3 z-50 max-h-60 sm:max-h-72 overflow-y-auto">
            <div className="grid grid-cols-8 sm:grid-cols-10 gap-1 sm:gap-1.5">
              {commonEmojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => insertEmoji(emoji)}
                  className="text-base sm:text-xl hover:scale-110 sm:hover:scale-125 transition-transform p-0.5 sm:p-1 hover:bg-[#4697D2]/10 dark:hover:bg-white/10 rounded"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500 px-2">{error}</p>
      )}

      <div className="flex justify-between items-center px-2">
        <p className="text-[10px] text-[#1a1a1a]/40 dark:text-white/40">
          {content.length > 0 && `${content.length}/5000`}
        </p>
      </div>
    </form>
  );
}
