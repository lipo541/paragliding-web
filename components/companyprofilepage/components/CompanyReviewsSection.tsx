'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import RatingModal from '@/components/rating/RatingModal';
import CommentsList from '@/components/comments/CommentsList';

interface CompanyReviewsSectionProps {
  companyId: string;
  companyName: string;
  locale: string;
  translations: {
    reviews: string;
    writeReview: string;
  };
}

export default function CompanyReviewsSection({ companyId, companyName, locale, translations }: CompanyReviewsSectionProps) {
  const [ratingModal, setRatingModal] = useState(false);

  return (
    <>
      <div className="bg-[rgba(70,151,210,0.15)] dark:bg-black/40 backdrop-blur-xl rounded-xl shadow-xl shadow-black/10 dark:shadow-black/30 border border-[#4697D2]/30 dark:border-white/10 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-white">
            <MessageCircle className="w-4 h-4 text-[#4697D2] dark:text-[#CAFA00]" />
            {translations.reviews}
          </h2>
          <button
            onClick={() => setRatingModal(true)}
            className="px-3 py-1.5 rounded-md bg-[#4697D2]/10 dark:bg-[#4697D2]/20 text-[#4697D2] text-xs font-semibold hover:bg-[#4697D2]/20 dark:hover:bg-[#4697D2]/30 transition-colors"
          >
            + {translations.writeReview}
          </button>
        </div>
        <CommentsList commentableType="company" commentableId={companyId} />
      </div>

      {/* Rating Modal */}
      {ratingModal && (
        <RatingModal
          isOpen={ratingModal}
          onClose={() => setRatingModal(false)}
          ratableType="company"
          ratableId={companyId}
          title={companyName}
        />
      )}
    </>
  );
}
