'use client';

import { useState } from 'react';
import { Star, MessageSquare } from 'lucide-react';
import RatingModal from '@/components/rating/RatingModal';
import { formatRating, getStarFill } from '../utils/companyProfileHelpers';

interface CompanyRatingProps {
  companyId: string;
  companyName: string;
  cachedRating?: number | null;
  cachedRatingCount?: number | null;
  locale: string;
  translations: {
    rating: string;
    reviews: string;
    noReviews: string;
    leaveReview: string;
    basedOn: string;
  };
}

export default function CompanyRating({
  companyId,
  companyName,
  cachedRating,
  cachedRatingCount,
  locale,
  translations,
}: CompanyRatingProps) {
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

  const rating = cachedRating || 0;
  const count = cachedRatingCount || 0;

  return (
    <>
      <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
              {translations.rating}
            </h2>
          </div>
          
          <button
            onClick={() => setIsRatingModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#4697D2]/10 hover:bg-[#4697D2]/20 text-[#4697D2] transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            {translations.leaveReview}
          </button>
        </div>

        {count > 0 ? (
          <div className="flex items-center gap-4">
            {/* Rating display */}
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
              <span className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                {formatRating(rating)}
              </span>
              <div className="flex items-center gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${getStarFill(star, rating)}`}
                  />
                ))}
              </div>
            </div>

            {/* Reviews count */}
            <div className="flex-1">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {translations.basedOn}
              </p>
              <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                {count} {translations.reviews}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-6">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {translations.noReviews}
            </p>
          </div>
        )}
      </div>

      {/* Rating Modal - Note: company rating may need to be added to ratableType in RatingModal */}
      {/* For now, we'll use 'pilot' as a placeholder since company type isn't supported yet */}
      <RatingModal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        ratableType="pilot"
        ratableId={companyId}
        title={companyName}
      />
    </>
  );
}
