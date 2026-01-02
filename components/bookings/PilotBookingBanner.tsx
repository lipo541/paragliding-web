'use client';

import Image from 'next/image';
import Link from 'next/link';
import { X, Star, CheckCircle2, User, ExternalLink } from 'lucide-react';

interface PilotBookingBannerProps {
  pilot: {
    id: string;
    first_name_ka?: string | null;
    first_name_en?: string | null;
    last_name_ka?: string | null;
    last_name_en?: string | null;
    avatar_url?: string | null;
    cached_rating?: number | null;
    cached_rating_count?: number | null;
    status?: string;
    // Slug fields for SEO-friendly URLs
    slug_ka?: string | null;
    slug_en?: string | null;
    company?: {
      id: string;
      name_ka?: string | null;
      name_en?: string | null;
      slug_ka?: string | null;
      slug_en?: string | null;
    } | null;
  };
  locale: string;
  onRemove?: () => void;
}

// Helper to get localized slug (returns null if no slug)
const getLocalizedSlug = (entity: { slug_ka?: string | null; slug_en?: string | null }, locale: string): string | null => {
  const slugKey = `slug_${locale}` as 'slug_ka' | 'slug_en';
  return entity[slugKey] || entity.slug_en || entity.slug_ka || null;
};

export default function PilotBookingBanner({ pilot, locale, onRemove }: PilotBookingBannerProps) {
  const name = locale === 'ka' 
    ? `${pilot.first_name_ka || ''} ${pilot.last_name_ka || ''}`.trim()
    : `${pilot.first_name_en || pilot.first_name_ka || ''} ${pilot.last_name_en || pilot.last_name_ka || ''}`.trim();
  
  const companyName = pilot.company 
    ? (locale === 'ka' ? pilot.company.name_ka : pilot.company.name_en) 
    : null;
  
  const rating = pilot.cached_rating || 0;
  const reviews = pilot.cached_rating_count || 0;
  const verified = pilot.status === 'verified';

  // URLs - only if slug exists
  const pilotSlug = getLocalizedSlug(pilot, locale);
  const companySlug = pilot.company ? getLocalizedSlug(pilot.company, locale) : null;

  return (
    <div className="relative bg-gradient-to-r from-[#4697D2]/20 to-[#4697D2]/10 dark:from-[#CAFA00]/20 dark:to-[#CAFA00]/10 border border-[#4697D2]/30 dark:border-[#CAFA00]/30 rounded-xl p-4 mb-6">
      {/* Remove button */}
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-white/50 dark:bg-black/30 hover:bg-white/80 dark:hover:bg-black/50 transition-colors"
          title={locale === 'ka' ? 'გაუქმება' : 'Remove'}
        >
          <X className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
        </button>
      )}
      
      <div className="flex items-center gap-4">
        {/* Avatar - Clickable only if slug exists */}
        {pilotSlug ? (
          <Link 
            href={`/${locale}/pilot/${pilotSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="relative w-14 h-14 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border-2 border-[#4697D2]/30 dark:border-[#CAFA00]/30 flex-shrink-0 hover:ring-2 hover:ring-[#4697D2] dark:hover:ring-[#CAFA00] transition-all"
          >
            {pilot.avatar_url ? (
              <Image src={pilot.avatar_url} alt={name} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-6 h-6 text-zinc-400" />
              </div>
            )}
          </Link>
        ) : (
          <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border-2 border-[#4697D2]/30 dark:border-[#CAFA00]/30 flex-shrink-0">
            {pilot.avatar_url ? (
              <Image src={pilot.avatar_url} alt={name} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-6 h-6 text-zinc-400" />
              </div>
            )}
          </div>
        )}
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-[#4697D2] dark:text-[#CAFA00] mb-1">
            {locale === 'ka' ? 'ჯავშნა პილოტთან' : 'Booking with pilot'}
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            {/* Pilot Name - Clickable only if slug exists */}
            {pilotSlug ? (
              <Link
                href={`/${locale}/pilot/${pilotSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-1.5 hover:text-[#4697D2] dark:hover:text-[#CAFA00] transition-colors"
              >
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white truncate group-hover:text-[#4697D2] dark:group-hover:text-[#CAFA00]">
                  {name || (locale === 'ka' ? 'პილოტი' : 'Pilot')}
                </h3>
                <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#4697D2] dark:text-[#CAFA00]" />
              </Link>
            ) : (
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white truncate">
                {name || (locale === 'ka' ? 'პილოტი' : 'Pilot')}
              </h3>
            )}
            
            {verified && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white flex-shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3 mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="font-medium">{rating.toFixed(1)}</span>
                <span className="text-zinc-400">({reviews})</span>
              </div>
            )}
            
            {/* Company Name - Clickable only if slug exists */}
            {companyName && companySlug && (
              <Link
                href={`/${locale}/company/${companySlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate hover:text-[#4697D2] dark:hover:text-[#CAFA00] hover:underline transition-colors"
              >
                {companyName}
              </Link>
            )}
            {companyName && !companySlug && (
              <span className="truncate">{companyName}</span>
            )}
          </div>
        </div>
      </div>
      
      {/* Info text */}
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3 leading-relaxed">
        {locale === 'ka' 
          ? 'ჯავშანი პირდაპირ მიენიჭება ამ პილოტს. აირჩიეთ ლოკაცია და ფრენის ტიპი ქვემოთ.'
          : 'This booking will be assigned directly to this pilot. Select location and flight type below.'}
      </p>
    </div>
  );
}
