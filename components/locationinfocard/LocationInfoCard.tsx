'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Star } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/hooks/useTranslation';

interface LocationInfoCardProps {
  id: string;
  name: string;
  countryName?: string;
  imageUrl?: string;
  rating?: number;
  ratingCount?: number;
  altitude?: number;
  bestSeasonStart?: number;
  bestSeasonEnd?: number;
  difficultyLevel?: string;
  minPrice?: number;
  locationUrl: string;
  locale?: string;
}

export default function LocationInfoCard({ 
  id,
  name,
  countryName,
  imageUrl,
  rating,
  ratingCount,
  altitude,
  bestSeasonStart,
  bestSeasonEnd,
  difficultyLevel,
  minPrice,
  locationUrl,
  locale = 'ka'
}: LocationInfoCardProps) {
  const { t } = useTranslation('locationinfocard');

  const getMonthName = (month: number) => {
    const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    return t(`months.${monthKeys[month - 1]}`) || '';
  };

  const getDifficultyLabel = (level: string) => {
    return t(`difficulty.${level}`) || level;
  };

  const getDifficultyColor = (level: string) => {
    const colors: { [key: string]: string } = {
      beginner: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
      intermediate: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
      advanced: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
      expert: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
    };
    return colors[level] || 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20';
  };

  return (
    <div className="group rounded-xl overflow-hidden backdrop-blur-lg bg-white/70 dark:bg-black/40 border border-white/50 dark:border-white/20 hover:bg-white/80 dark:hover:bg-black/50 hover:shadow-2xl transition-all duration-300 shadow-xl relative">
      {/* Image */}
      <div className="relative aspect-video overflow-hidden bg-foreground/5">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <MapPin className="w-12 h-12 text-foreground/20" />
          </div>
        )}
        
        {/* Difficulty Badge */}
        {difficultyLevel && (
          <div className="absolute top-2 right-2 lg:top-3 lg:right-3">
            <span className={`px-2 py-0.5 lg:px-2.5 lg:py-1 text-[9px] lg:text-[10px] font-semibold rounded-full backdrop-blur-md border ${getDifficultyColor(difficultyLevel)}`}>
              {getDifficultyLabel(difficultyLevel)}
            </span>
          </div>
        )}
      </div>

      {/* Content - Compact */}
      <div className="p-3 lg:p-4">
        <h3 className="text-sm lg:text-base font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1.5 lg:mb-2 line-clamp-1">
          {name}
        </h3>
        
        {/* Country Name */}
        {countryName && (
          <p className="text-xs text-foreground/60 mb-2">{countryName}</p>
        )}
        
        {/* Rating */}
        {rating && rating > 0 && (
          <div className="flex items-center gap-0.5 lg:gap-1 mb-2 lg:mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-3 h-3 lg:w-3.5 lg:h-3.5 ${
                  star <= Math.round(rating)
                    ? 'text-yellow-500 fill-yellow-500'
                    : 'text-foreground/20 fill-foreground/20'
                }`}
              />
            ))}
            <span className="text-[11px] lg:text-xs font-semibold text-foreground ml-1">
              {rating.toFixed(1)}
            </span>
            {ratingCount && (
              <span className="text-[9px] lg:text-[10px] text-foreground/60">
                ({ratingCount})
              </span>
            )}
          </div>
        )}
        
        {/* Info Tags */}
        <div className="space-y-1 lg:space-y-1.5">
          {altitude && (
            <div className="flex items-center gap-1 lg:gap-1.5 text-[11px] lg:text-xs text-foreground/70">
              <svg className="w-3 h-3 lg:w-3.5 lg:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <span>{altitude}{t('altitude')}</span>
            </div>
          )}
          
          {bestSeasonStart && bestSeasonEnd && (
            <div className="flex items-center gap-1 lg:gap-1.5 text-[11px] lg:text-xs text-foreground/70">
              <svg className="w-3 h-3 lg:w-3.5 lg:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>
                {getMonthName(bestSeasonStart)} - {getMonthName(bestSeasonEnd)}
              </span>
            </div>
          )}
          
          {minPrice && (
            <div className="flex items-center gap-1 lg:gap-1.5 text-[11px] lg:text-xs text-green-600 dark:text-green-400 font-semibold">
              <svg className="w-3 h-3 lg:w-3.5 lg:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{minPrice}₾ {t('priceFrom')}</span>
            </div>
          )}
        </div>
        
        {/* Booking Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            window.location.href = `${locationUrl}#flight-types-section`;
          }}
          className="w-full mt-2 lg:mt-3 px-3 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm font-semibold rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] z-10 relative"
        >
          {t('bookNow')}
        </button>
      </div>
      
      {/* Clickable overlay for card */}
      <Link
        href={locationUrl}
        className="absolute inset-0 z-0"
        aria-label={name}
      />
    </div>
  );
}
