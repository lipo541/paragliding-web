'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Users, Star, ExternalLink } from 'lucide-react';
import { SupportedLocale, getLocalizedField, getLocalizedSlug } from '../utils/companyProfileHelpers';

interface Pilot {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string | null;
  slug_ka?: string | null;
  slug_en?: string | null;
  slug_ru?: string | null;
  slug_de?: string | null;
  slug_tr?: string | null;
  slug_ar?: string | null;
  cached_rating?: number | null;
  cached_rating_count?: number | null;
  status?: string | null;
}

interface CompanyPilotsProps {
  pilots: Pilot[];
  locale: SupportedLocale;
  translations: {
    pilots: string;
    noPilots: string;
    viewPilot: string;
    rating: string;
    reviews: string;
    verified: string;
  };
}

export default function CompanyPilots({ pilots, locale, translations }: CompanyPilotsProps) {
  if (!pilots || pilots.length === 0) {
    return null;
  }

  return (
    <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-[#4697D2]" />
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
          {translations.pilots}
        </h2>
        <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-[#4697D2]/10 text-[#4697D2]">
          {pilots.length}
        </span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {pilots.map((pilot) => {
          const slug = getLocalizedSlug(pilot, locale);
          const isVerified = pilot.status === 'verified';
          
          return (
            <Link
              key={pilot.id}
              href={`/${locale}/pilot/${slug}`}
              className="group flex items-center gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 hover:bg-[#4697D2]/5 dark:hover:bg-[#4697D2]/10 border border-transparent hover:border-[#4697D2]/30 transition-all"
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-700">
                  {pilot.avatar_url ? (
                    <Image
                      src={pilot.avatar_url}
                      alt={`${pilot.first_name} ${pilot.last_name}`}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-400 dark:text-zinc-500 font-medium">
                      {pilot.first_name?.[0]}{pilot.last_name?.[0]}
                    </div>
                  )}
                </div>
                {isVerified && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-zinc-900 dark:text-white truncate group-hover:text-[#4697D2] transition-colors">
                    {pilot.first_name} {pilot.last_name}
                  </span>
                  <ExternalLink className="w-3 h-3 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </div>
                
                {/* Rating */}
                {pilot.cached_rating && pilot.cached_rating > 0 && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star className="w-3 h-3 text-amber-400 fill-current" />
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">
                      {pilot.cached_rating.toFixed(1)}
                    </span>
                    {pilot.cached_rating_count && pilot.cached_rating_count > 0 && (
                      <span className="text-xs text-zinc-400 dark:text-zinc-500">
                        ({pilot.cached_rating_count} {translations.reviews})
                      </span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
