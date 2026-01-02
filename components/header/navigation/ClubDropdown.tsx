'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSupabase } from '@/lib/supabase/SupabaseProvider';

interface Pilot {
  id: string;
  first_name_ka: string;
  first_name_en: string;
  first_name_ru: string;
  first_name_ar: string | null;
  first_name_de: string | null;
  first_name_tr: string | null;
  last_name_ka: string;
  last_name_en: string;
  last_name_ru: string;
  last_name_ar: string | null;
  last_name_de: string | null;
  last_name_tr: string | null;
  slug_ka: string;
  slug_en: string;
  slug_ru: string;
  slug_ar: string | null;
  slug_de: string | null;
  slug_tr: string | null;
  avatar_url?: string;
  company_id: string;
  cached_rating?: number;
  cached_rating_count?: number;
}

interface Company {
  id: string;
  name_ka: string;
  name_en: string;
  name_ru: string;
  name_ar: string | null;
  name_de: string | null;
  name_tr: string | null;
  slug_ka: string;
  slug_en: string;
  slug_ru: string;
  slug_ar: string | null;
  slug_de: string | null;
  slug_tr: string | null;
  logo_url?: string;
  country_id: string;
  cached_rating?: number;
  cached_rating_count?: number;
  pilots: Pilot[];
}

interface Country {
  id: string;
  name_ka: string;
  name_en: string;
  name_ru: string;
  name_ar: string | null;
  name_de: string | null;
  name_tr: string | null;
  slug_ka: string;
  slug_en: string;
  slug_ru: string;
  slug_ar: string | null;
  slug_de: string | null;
  slug_tr: string | null;
  og_image_url?: string;
  companies: Company[];
}

interface ClubDropdownProps {
  locale: string;
}

export default function ClubDropdown({ locale }: ClubDropdownProps) {
  const [countriesWithCompanies, setCountriesWithCompanies] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { client: supabase, session } = useSupabase();

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch active countries
        const { data: countries, error: countriesError } = await supabase
          .from('countries')
          .select('id, name_ka, name_en, name_ru, name_ar, name_de, name_tr, slug_ka, slug_en, slug_ru, slug_ar, slug_de, slug_tr, og_image_url')
          .eq('is_active', true)
          .order('name_ka');

        if (countriesError) throw countriesError;

        // Fetch verified companies with country_id
        const { data: companies, error: companiesError } = await supabase
          .from('companies')
          .select('id, name_ka, name_en, name_ru, name_ar, name_de, name_tr, slug_ka, slug_en, slug_ru, slug_ar, slug_de, slug_tr, logo_url, country_id, cached_rating, cached_rating_count')
          .eq('status', 'verified')
          .not('country_id', 'is', null)
          .order('name_ka');

        if (companiesError) throw companiesError;

        // Fetch verified pilots with company_id
        const { data: pilots, error: pilotsError } = await supabase
          .from('pilots')
          .select('id, first_name_ka, first_name_en, first_name_ru, first_name_ar, first_name_de, first_name_tr, last_name_ka, last_name_en, last_name_ru, last_name_ar, last_name_de, last_name_tr, slug_ka, slug_en, slug_ru, slug_ar, slug_de, slug_tr, avatar_url, company_id, cached_rating, cached_rating_count')
          .eq('status', 'verified')
          .not('company_id', 'is', null)
          .order('first_name_ka');

        if (pilotsError) throw pilotsError;

        // Group pilots by company
        const companiesWithPilots = (companies || []).map((company: any) => ({
          ...company,
          pilots: (pilots || []).filter((pilot: any) => pilot.company_id === company.id)
        }));

        // Group companies by country
        const grouped: Country[] = (countries || []).map((country: any) => ({
          ...country,
          companies: companiesWithPilots.filter((company: any) => company.country_id === country.id)
        })).filter((country: Country) => country.companies.length > 0); // Only show countries with companies

        setCountriesWithCompanies(grouped);
      } catch (error) {
        console.error('Error fetching club data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [supabase, session]);

  const getLocalizedName = (item: any, lang: string) => {
    if (lang === 'en') return item.name_en || item.name_ka;
    if (lang === 'ru') return item.name_ru || item.name_en || item.name_ka;
    if (lang === 'ar') return item.name_ar || item.name_en || item.name_ka;
    if (lang === 'de') return item.name_de || item.name_en || item.name_ka;
    if (lang === 'tr') return item.name_tr || item.name_en || item.name_ka;
    return item.name_ka || item.name_en;
  };

  const getLocalizedSlug = (item: any, lang: string) => {
    if (lang === 'en') return item.slug_en || item.slug_ka;
    if (lang === 'ru') return item.slug_ru || item.slug_en || item.slug_ka;
    if (lang === 'ar') return item.slug_ar || item.slug_en || item.slug_ka;
    if (lang === 'de') return item.slug_de || item.slug_en || item.slug_ka;
    if (lang === 'tr') return item.slug_tr || item.slug_en || item.slug_ka;
    return item.slug_ka || item.slug_en;
  };

  const getPilotName = (pilot: Pilot, lang: string) => {
    const firstName = lang === 'en' ? pilot.first_name_en :
                      lang === 'ru' ? pilot.first_name_ru :
                      lang === 'ar' ? (pilot.first_name_ar || pilot.first_name_en) :
                      lang === 'de' ? (pilot.first_name_de || pilot.first_name_en) :
                      lang === 'tr' ? (pilot.first_name_tr || pilot.first_name_en) :
                      pilot.first_name_ka;
    
    const lastName = lang === 'en' ? pilot.last_name_en :
                     lang === 'ru' ? pilot.last_name_ru :
                     lang === 'ar' ? (pilot.last_name_ar || pilot.last_name_en) :
                     lang === 'de' ? (pilot.last_name_de || pilot.last_name_en) :
                     lang === 'tr' ? (pilot.last_name_tr || pilot.last_name_en) :
                     pilot.last_name_ka;
    
    return `${firstName} ${lastName}`;
  };

  const getTranslation = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      viewAllCompanies: {
        ka: 'ყველა კომპანია',
        en: 'All Companies',
        ru: 'Все компании',
        ar: 'جميع الشركات',
        de: 'Alle Unternehmen',
        tr: 'Tüm Şirketler'
      },
      viewAllPilots: {
        ka: 'ყველა პილოტი',
        en: 'All Pilots',
        ru: 'Все пилоты',
        ar: 'جميع الطيارين',
        de: 'Alle Piloten',
        tr: 'Tüm Pilotlar'
      },
      pilots: {
        ka: 'პილოტი',
        en: 'pilots',
        ru: 'пилотов',
        ar: 'طيارين',
        de: 'Piloten',
        tr: 'pilot'
      },
      noPilots: {
        ka: 'პილოტები არ არის',
        en: 'No pilots yet',
        ru: 'Пока нет пилотов',
        ar: 'لا يوجد طيارون بعد',
        de: 'Noch keine Piloten',
        tr: 'Henüz pilot yok'
      },
      noData: {
        ka: 'მონაცემები არ მოიძებნა',
        en: 'No data found',
        ru: 'Данные не найдены',
        ar: 'لم يتم العثور على بيانات',
        de: 'Keine Daten gefunden',
        tr: 'Veri bulunamadı'
      }
    };
    return translations[key]?.[locale] || translations[key]?.en || key;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-5 bg-foreground/10 rounded w-24 mb-2"></div>
            <div className="space-y-1">
              <div className="h-4 bg-foreground/5 rounded w-full"></div>
              <div className="h-4 bg-foreground/5 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Links */}
      <div className="flex items-center gap-3 pb-4 border-b border-[#4697D2]/20 dark:border-white/10">
        <Link
          href={`/${locale}/companies`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg backdrop-blur-md border border-[#4697D2]/40 dark:border-white/10 hover:border-[#CAFA00]/60 dark:hover:border-white/20 hover:shadow-md transition-all duration-300 bg-gradient-to-br from-[rgba(70,151,210,0.25)] to-[rgba(70,151,210,0.15)] dark:bg-black/20 dark:from-transparent dark:to-transparent"
        >
          <svg className="w-4 h-4 text-[#4697D2] dark:text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span className="text-sm font-medium text-gray-800 dark:text-white">{getTranslation('viewAllCompanies')}</span>
        </Link>
        <Link
          href={`/${locale}/pilots`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg backdrop-blur-md border border-[#4697D2]/40 dark:border-white/10 hover:border-[#CAFA00]/60 dark:hover:border-white/20 hover:shadow-md transition-all duration-300 bg-gradient-to-br from-[rgba(70,151,210,0.25)] to-[rgba(70,151,210,0.15)] dark:bg-black/20 dark:from-transparent dark:to-transparent"
        >
          <svg className="w-4 h-4 text-[#4697D2] dark:text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="text-sm font-medium text-gray-800 dark:text-white">{getTranslation('viewAllPilots')}</span>
        </Link>
      </div>

      {/* Countries with Companies */}
      <div className="space-y-6">
        {countriesWithCompanies.map((country) => (
          <div key={country.id} className="space-y-3">
            {/* Country Header */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full overflow-hidden bg-foreground/10 flex-shrink-0">
                {country.og_image_url ? (
                  <img 
                    src={country.og_image_url} 
                    alt={getLocalizedName(country, locale)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#4697D2] to-[#2d7ab8]" />
                )}
              </div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-white tracking-wide uppercase">
                {getLocalizedName(country, locale)}
              </h3>
              <div className="flex-1 h-px bg-gradient-to-r from-[#4697D2]/30 to-transparent dark:from-white/10" />
            </div>

            {/* Companies Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {country.companies.map((company) => (
                <div 
                  key={company.id}
                  className="group p-4 rounded-xl backdrop-blur-md border border-[#4697D2]/40 dark:border-white/10 hover:border-[#CAFA00]/60 dark:hover:border-white/20 hover:shadow-lg hover:shadow-[#CAFA00]/10 transition-all duration-300 bg-gradient-to-br from-[rgba(70,151,210,0.25)] to-[rgba(70,151,210,0.15)] dark:bg-black/20 dark:from-transparent dark:to-transparent"
                >
                  {/* Company Header */}
                  <Link
                    href={`/${locale}/company/${getLocalizedSlug(company, locale)}`}
                    className="flex items-center gap-3 mb-3"
                  >
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-foreground/5 flex-shrink-0 ring-1 ring-foreground/10 group-hover:ring-[#CAFA00]/50 transition-all">
                      {company.logo_url ? (
                        <img 
                          src={company.logo_url}
                          alt={getLocalizedName(company, locale)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#4697D2] to-[#2d7ab8] flex items-center justify-center">
                          <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-800 dark:text-white group-hover:text-[#4697D2] dark:group-hover:text-[#CAFA00] transition-colors truncate">
                        {getLocalizedName(company, locale)}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-white/60">
                        <span>{company.pilots.length} {getTranslation('pilots')}</span>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span>{(company.cached_rating || 0).toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-gray-400 dark:text-white/40 group-hover:text-[#CAFA00] group-hover:translate-x-0.5 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>

                  {/* Pilots Row */}
                  {company.pilots.length > 0 ? (
                    <div className="flex items-center gap-2 pt-3 border-t border-[#4697D2]/20 dark:border-white/10">
                      <div className="flex -space-x-2">
                        {company.pilots.slice(0, 4).map((pilot) => (
                          <Link
                            key={pilot.id}
                            href={`/${locale}/pilot/${getLocalizedSlug(pilot, locale)}`}
                            className="relative group/pilot"
                            title={`${getPilotName(pilot, locale)}${pilot.cached_rating ? ` ★${pilot.cached_rating.toFixed(1)}` : ''}`}
                          >
                            <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-white dark:ring-gray-800 hover:ring-[#CAFA00] transition-all hover:scale-110 hover:z-10">
                              {pilot.avatar_url ? (
                                <img 
                                  src={pilot.avatar_url}
                                  alt={getPilotName(pilot, locale)}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-[#4697D2] to-[#2d7ab8] flex items-center justify-center">
                                  <span className="text-xs font-bold text-white">
                                    {pilot.first_name_ka?.charAt(0) || pilot.first_name_en?.charAt(0) || '?'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </Link>
                        ))}
                        {company.pilots.length > 4 && (
                          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 ring-2 ring-white dark:ring-gray-800 flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600 dark:text-white/70">
                              +{company.pilots.length - 4}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap gap-1 items-center">
                          {company.pilots.slice(0, 2).map((pilot, idx) => (
                            <Link
                              key={pilot.id}
                              href={`/${locale}/pilot/${getLocalizedSlug(pilot, locale)}`}
                              className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-white/60 hover:text-[#4697D2] dark:hover:text-[#CAFA00] transition-colors"
                            >
                              <span className="truncate">{getPilotName(pilot, locale)}</span>
                              {pilot.cached_rating && pilot.cached_rating > 0 && (
                                <span className="inline-flex items-center gap-0.5 text-yellow-600 dark:text-yellow-500">
                                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                  <span className="text-[10px]">{pilot.cached_rating.toFixed(1)}</span>
                                </span>
                              )}
                              {idx < 1 && company.pilots.length > 1 ? <span>,</span> : null}
                            </Link>
                          ))}
                          {company.pilots.length > 2 && (
                            <span className="text-xs text-gray-500 dark:text-white/50">
                              +{company.pilots.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-3 border-t border-[#4697D2]/20 dark:border-white/10">
                      <p className="text-xs text-gray-500 dark:text-white/40 italic">
                        {getTranslation('noPilots')}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {countriesWithCompanies.length === 0 && !isLoading && (
          <div className="text-center py-12 text-gray-500 dark:text-white/50">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="text-sm">{getTranslation('noData')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
