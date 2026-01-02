'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MapPin, ChevronRight } from 'lucide-react';

interface Location {
  id: string;
  name: string;
  slug: string;
  countrySlug: string;
  countryName?: string | null;
}

interface CompanyLocationsSectionProps {
  locations: Location[];
  locale: string;
  translations: {
    locations: string;
    viewLocation: string;
  };
}

export default function CompanyLocationsSection({ locations, locale, translations }: CompanyLocationsSectionProps) {
  if (!locations || locations.length === 0) return null;

  return (
    <div className="bg-[rgba(70,151,210,0.15)] dark:bg-black/40 backdrop-blur-xl rounded-xl shadow-xl shadow-black/10 dark:shadow-black/30 border border-[#4697D2]/30 dark:border-white/10 p-4">
      <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-white mb-3">
        <MapPin className="w-4 h-4 text-[#4697D2] dark:text-[#CAFA00]" />
        {translations.locations}
        <span className="ml-auto text-xs px-2 py-0.5 rounded bg-[rgba(70,151,210,0.2)] dark:bg-black/50 text-zinc-600 dark:text-white/80">
          {locations.length}
        </span>
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {locations.map((location) => (
          <Link
            key={location.id}
            href={`/${locale}/locations/${location.countrySlug}/${location.slug}`}
            className="group flex items-center gap-3 p-3 rounded-lg bg-white/30 dark:bg-white/5 border border-[#4697D2]/20 dark:border-white/10 hover:bg-white/50 dark:hover:bg-white/10 hover:border-[#4697D2]/40 transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-[#4697D2]/10 dark:bg-[#4697D2]/20 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-[#4697D2] dark:text-[#CAFA00]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900 dark:text-white truncate group-hover:text-[#4697D2] dark:group-hover:text-[#CAFA00] transition-colors">
                {location.name}
              </p>
              {location.countryName && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                  {location.countryName}
                </p>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-[#4697D2] dark:group-hover:text-[#CAFA00] transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
