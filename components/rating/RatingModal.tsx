'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import RatingInput from './RatingInput';
import { useTranslation } from '@/lib/i18n/hooks/useTranslation';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  ratableType: 'country' | 'location' | 'flight_type' | 'pilot' | 'company';
  ratableId: string;
  existingRating?: number;
  onRatingChange?: (newRating: number | null) => void;
  title?: string;
  subtitle?: string;
}

export default function RatingModal({
  isOpen,
  onClose,
  ratableType,
  ratableId,
  existingRating,
  onRatingChange,
  title,
  subtitle,
}: RatingModalProps) {
  const { t } = useTranslation('rating');
  
  // Use translations as default if not provided
  const displayTitle = title || t('modal.defaultTitle');
  const displaySubtitle = subtitle || t('modal.defaultSubtitle');

  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleRatingSubmit = (newRating: number | null) => {
    if (onRatingChange) {
      onRatingChange(newRating);
    }
    // Auto-close after successful rating
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fadeIn">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md backdrop-blur-xl bg-white/95 dark:bg-black/95 rounded-2xl shadow-2xl border border-white/30 dark:border-white/10 overflow-hidden animate-scale-in">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-yellow-400/20 via-orange-400/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-yellow-500/20 via-amber-400/10 to-transparent rounded-full blur-3xl" />
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full backdrop-blur-md bg-white/30 dark:bg-black/20 hover:bg-white/40 dark:hover:bg-black/30 border border-white/30 dark:border-white/10 transition-all duration-200 group"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-foreground group-hover:text-foreground/80 transition-colors" />
        </button>

        {/* Content */}
        <div className="relative p-8 pb-6">
          {/* Header */}
          <div className="text-center mb-8">
            {/* Star Icon */}
            <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {displayTitle}
            </h2>
            <p className="text-sm text-foreground/90">
              {displaySubtitle}
            </p>
          </div>

          {/* Rating Component */}
          <div className="backdrop-blur-md bg-white/30 dark:bg-black/20 rounded-xl p-6 border border-white/30 dark:border-white/10 shadow-lg">
            <RatingInput
              ratableType={ratableType}
              ratableId={ratableId}
              existingRating={existingRating}
              onRatingChange={handleRatingSubmit}
            />
          </div>

          {/* Footer Note */}
          <p className="text-center text-xs text-foreground/80 mt-4">
            {t('modal.clickToRate')}
          </p>
        </div>
      </div>
    </div>
  );
}
