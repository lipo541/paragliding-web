'use client';

import Link from 'next/link';
import { MapPin, ExternalLink } from 'lucide-react';
import { SupportedLocale, getLocalizedField, getLocalizedSlug } from '../utils/companyProfileHelpers';

interface Location {
  id: string;
  name_ka?: string | null;
  name_en?: string | null;
  name_ru?: string | null;
  name_ar?: string | null;
  name_de?: string | null;
  name_tr?: string | null;
  slug_ka?: string | null;
  slug_en?: string | null;
  country?: {
    name_ka?: string | null;
    name_en?: string | null;
    slug_ka?: string | null;
  } | null;
}

interface CompanyLocationsProps {
  locations: Location[];
  locale: SupportedLocale;
  translations: {
    locations: string;
    noLocations: string;
    viewLocation: string;
  };
}

export default function CompanyLocations({ locations, locale, translations }: CompanyLocationsProps) {
  if (!locations || locations.length === 0) {
    return null;
  }

  return (
    <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="w-4 h-4 text-green-500" />
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
          {translations.locations}
        </h2>
        <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
          {locations.length}
        </span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {locations.map((location) => {
          const locationName = getLocalizedField(location, 'name', locale);
          const countryName = location.country 
            ? getLocalizedField(location.country, 'name', locale)
            : '';
          const slug = getLocalizedSlug(location, locale);
          const countrySlug = location.country?.slug_ka || '';
          
          return (
            <Link
              key={location.id}
              href={`/${locale}/locations/${countrySlug}/${slug}`}
              className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-[#4697D2]/10 dark:hover:bg-[#4697D2]/20 border border-transparent hover:border-[#4697D2]/30 transition-all"
            >
              <MapPin className="w-3.5 h-3.5 text-green-500" />
              <span className="text-sm text-zinc-700 dark:text-zinc-300 group-hover:text-[#4697D2]">
                {locationName}
              </span>
              {countryName && (
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  ({countryName})
                </span>
              )}
              <ExternalLink className="w-3 h-3 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
