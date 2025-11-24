'use client';

import { useState, useEffect } from 'react';
import { Star, X, Check, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/i18n/hooks/useTranslation';

interface RatingInputProps {
  ratableType: 'country' | 'location' | 'flight_type';
  ratableId: string;
  existingRating?: number;
  onRatingChange?: (newRating: number | null) => void;
}

export default function RatingInput({
  ratableType,
  ratableId,
  existingRating,
  onRatingChange,
}: RatingInputProps) {
  const [rating, setRating] = useState<number>(existingRating || 0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const { t } = useTranslation('rating');

  useEffect(() => {
    if (existingRating) {
      setRating(existingRating);
    }
  }, [existingRating]);

  const handleRatingClick = async (selectedRating: number) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError(t('input.loginRequired'));
        setIsSubmitting(false);
        return;
      }

      // Check if rating already exists
      const { data: existingRatings } = await supabase
        .from('ratings')
        .select('id')
        .eq('user_id', user.id)
        .eq('ratable_type', ratableType)
        .eq('ratable_id', ratableId)
        .limit(1);

      let error;

      if (existingRatings && existingRatings.length > 0) {
        // Update existing rating
        const { error: updateError } = await supabase
          .from('ratings')
          .update({
            rating: selectedRating,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
          .eq('ratable_type', ratableType)
          .eq('ratable_id', ratableId);
        error = updateError;
      } else {
        // Insert new rating
        const { error: insertError } = await supabase
          .from('ratings')
          .insert({
            user_id: user.id,
            ratable_type: ratableType,
            ratable_id: ratableId,
            rating: selectedRating,
            updated_at: new Date().toISOString(),
          });
        error = insertError;
      }

      if (error) throw error;

      setRating(selectedRating);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      if (onRatingChange) {
        onRatingChange(selectedRating);
      }
    } catch (err: any) {
      console.error('Error submitting rating:', err?.message || err);
      setError(t('input.saveError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRating = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError(t('input.loginRequired'));
        setIsSubmitting(false);
        return;
      }

      const { error: deleteError } = await supabase
        .from('ratings')
        .delete()
        .match({
          user_id: user.id,
          ratable_type: ratableType,
          ratable_id: ratableId,
        });

      if (deleteError) throw deleteError;

      setRating(0);
      if (onRatingChange) {
        onRatingChange(null);
      }
    } catch (err) {
      console.error('Error deleting rating:', err);
      setError(t('input.deleteError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRating = hoverRating || rating;

  const ratingLabels = [
    t('input.labels.poor'),
    t('input.labels.average'),
    t('input.labels.good'),
    t('input.labels.veryGood'),
    t('input.labels.excellent')
  ];

  return (
    <div className="space-y-2.5">
      {/* Compact Stars Container */}
      <div className="flex flex-col items-center gap-2 py-2">
        {/* Stars */}
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              disabled={isSubmitting}
              onClick={() => handleRatingClick(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="group relative transition-all duration-200 hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-yellow-400/50 rounded-full p-0.5"
            >
              <div className={`absolute inset-0 rounded-full ${star <= displayRating ? 'bg-yellow-400/15' : 'bg-foreground/5'} blur-sm transition-all duration-200`}></div>
              <Star
                className={`relative w-7 h-7 transition-all duration-200 ${
                  star <= displayRating
                    ? 'fill-yellow-400 text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.4)]'
                    : 'text-foreground/30 group-hover:text-foreground/50'
                } ${star === displayRating ? 'scale-105' : ''}`}
              />
            </button>
          ))}
        </div>

        {/* Compact Rating Label */}
        {displayRating > 0 && (
          <div className="flex items-center gap-1.5 text-foreground animate-fadeIn">
            <Sparkles className="w-3 h-3 text-yellow-400" />
            <p className="text-xs font-medium">
              {ratingLabels[displayRating - 1]}
            </p>
          </div>
        )}
      </div>

      {/* Compact Actions & Status */}
      <div className="flex items-center justify-between pt-2 border-t border-foreground/10">
        <div className="flex items-center gap-2">
          {rating > 0 && (
            <>
              <p className="text-[10px] text-foreground/80">
                <span className="font-semibold text-foreground">{rating}/5</span>
              </p>
              <button
                type="button"
                onClick={handleDeleteRating}
                disabled={isSubmitting}
                className="group flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] text-foreground/80 hover:text-red-400 hover:bg-red-400/10 rounded transition-all disabled:opacity-50"
                title={t('input.delete')}
              >
                <X className="w-3 h-3" />
                <span>{t('input.delete')}</span>
              </button>
            </>
          )}
        </div>

        {/* Compact Success Message */}
        {showSuccess && (
          <div className="flex items-center gap-1 text-green-400 animate-fadeIn">
            <Check className="w-3 h-3" />
            <span className="text-[10px] font-medium">{t('input.saved')}</span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-2xl flex items-center justify-center">
          <div className="flex items-center gap-2 text-foreground">
            <div className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin"></div>
            <span className="text-sm font-medium">{t('input.saving')}</span>
          </div>
        </div>
      )}
    </div>
  );
}
