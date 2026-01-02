'use client';

import Image from 'next/image';
import Link from 'next/link';
import { X, Star, Building2, Users, ExternalLink } from 'lucide-react';

interface CompanyBookingBannerProps {
  company: {
    id: string;
    name_ka?: string | null;
    name_en?: string | null;
    logo_url?: string | null;
    cached_rating?: number | null;
    cached_rating_count?: number | null;
    status?: string;
    // Slug fields for SEO-friendly URLs
    slug_ka?: string | null;
    slug_en?: string | null;
  };
  pilotsCount?: number;
  locale: string;
  onRemove?: () => void;
}

// Helper to get localized slug (returns null if no slug)
const getLocalizedSlug = (entity: { slug_ka?: string | null; slug_en?: string | null }, locale: string): string | null => {
  const slugKey = `slug_${locale}` as 'slug_ka' | 'slug_en';
  return entity[slugKey] || entity.slug_en || entity.slug_ka || null;
};

export default function CompanyBookingBanner({ company, pilotsCount, locale, onRemove }: CompanyBookingBannerProps) {
  const name = locale === 'ka' 
    ? company.name_ka 
    : (company.name_en || company.name_ka);
  
  const rating = company.cached_rating || 0;
  const reviews = company.cached_rating_count || 0;

  // URL - only if slug exists
  const companySlug = getLocalizedSlug(company, locale);

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
        {/* Logo - Clickable only if slug exists */}
        {companySlug ? (
          <Link
            href={`/${locale}/company/${companySlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="relative w-14 h-14 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border-2 border-[#4697D2]/30 dark:border-[#CAFA00]/30 flex-shrink-0 hover:ring-2 hover:ring-[#4697D2] dark:hover:ring-[#CAFA00] transition-all"
          >
            {company.logo_url ? (
              <Image src={company.logo_url} alt={name || ''} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building2 className="w-6 h-6 text-zinc-400" />
              </div>
            )}
          </Link>
        ) : (
          <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border-2 border-[#4697D2]/30 dark:border-[#CAFA00]/30 flex-shrink-0">
            {company.logo_url ? (
              <Image src={company.logo_url} alt={name || ''} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building2 className="w-6 h-6 text-zinc-400" />
              </div>
            )}
          </div>
        )}
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-[#4697D2] dark:text-[#CAFA00] mb-1">
            {locale === 'ka' ? 'ჯავშნა კომპანიასთან' : 'Booking with company'}
          </div>
          
          {/* Company Name - Clickable only if slug exists */}
          {companySlug ? (
            <Link
              href={`/${locale}/company/${companySlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-1.5 hover:text-[#4697D2] dark:hover:text-[#CAFA00] transition-colors"
            >
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white truncate group-hover:text-[#4697D2] dark:group-hover:text-[#CAFA00]">
                {name || (locale === 'ka' ? 'კომპანია' : 'Company')}
              </h3>
              <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#4697D2] dark:text-[#CAFA00]" />
            </Link>
          ) : (
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white truncate">
              {name || (locale === 'ka' ? 'კომპანია' : 'Company')}
            </h3>
          )}
          
          <div className="flex items-center gap-3 mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="font-medium">{rating.toFixed(1)}</span>
                <span className="text-zinc-400">({reviews})</span>
              </div>
            )}
            
            {/* Pilots Count - Link to company page only if slug exists */}
            {pilotsCount !== undefined && pilotsCount > 0 && companySlug ? (
              <Link
                href={`/${locale}/company/${companySlug}#pilots`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-[#4697D2] dark:hover:text-[#CAFA00] transition-colors"
              >
                <Users className="w-3.5 h-3.5" />
                <span>{pilotsCount} {locale === 'ka' ? 'პილოტი' : 'pilots'}</span>
              </Link>
            ) : pilotsCount !== undefined && pilotsCount > 0 ? (
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>{pilotsCount} {locale === 'ka' ? 'პილოტი' : 'pilots'}</span>
              </span>
            ) : null}
          </div>
        </div>
      </div>
      
      {/* Info text */}
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3 leading-relaxed">
        {locale === 'ka' 
          ? 'ჯავშანი მიენიჭება ამ კომპანიას და კომპანია მოგინიშნავთ პილოტს. აირჩიეთ ლოკაცია და ფრენის ტიპი ქვემოთ.'
          : 'This booking will be assigned to this company. They will assign you a pilot. Select location and flight type below.'}
      </p>
    </div>
  );
}
