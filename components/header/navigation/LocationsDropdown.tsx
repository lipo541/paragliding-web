'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface Location {
  id: string;
  name_ka: string;
  name_en: string;
  name_ru: string;
  slug_ka: string;
  slug_en: string;
  slug_ru: string;
  country_id: string;
}

interface Country {
  id: string;
  name_ka: string;
  name_en: string;
  name_ru: string;
  slug_ka: string;
  slug_en: string;
  slug_ru: string;
}

interface CountryWithLocations extends Country {
  locations: Location[];
}

interface LocationsDropdownProps {
  locale: string;
}

export default function LocationsDropdown({ locale }: LocationsDropdownProps) {
  const [countriesWithLocations, setCountriesWithLocations] = useState<CountryWithLocations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch active countries
        const { data: countries, error: countriesError } = await supabase
          .from('countries')
          .select('id, name_ka, name_en, name_ru, slug_ka, slug_en, slug_ru')
          .eq('is_active', true)
          .order('name_ka');

        if (countriesError) {
          console.error('Countries error:', countriesError);
          throw countriesError;
        }

        // Fetch all locations (locations table doesn't have is_active column)
        const { data: locations, error: locationsError } = await supabase
          .from('locations')
          .select('id, name_ka, name_en, name_ru, slug_ka, slug_en, slug_ru, country_id')
          .order('name_ka');

        if (locationsError) {
          console.error('Locations error:', locationsError);
          throw locationsError;
        }

        console.log('Countries fetched:', countries?.length || 0);
        console.log('Locations fetched:', locations?.length || 0);

        // Group locations by country
        const grouped: CountryWithLocations[] = (countries || []).map(country => ({
          ...country,
          locations: (locations || []).filter(loc => loc.country_id === country.id)
        }));

        setCountriesWithLocations(grouped);
      } catch (error: any) {
        console.error('Error fetching locations:', error);
        console.error('Error details:', error?.message, error?.code, error?.details);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const getLocalizedName = (item: Country | Location, lang: string) => {
    if (lang === 'en') return item.name_en;
    if (lang === 'ru') return item.name_ru;
    return item.name_ka;
  };

  const getLocalizedSlug = (item: Country | Location, lang: string) => {
    if (lang === 'en') return item.slug_en;
    if (lang === 'ru') return item.slug_ru;
    return item.slug_ka;
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
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {countriesWithLocations.map((country, index) => (
        <div key={country.id} className="lg:col-span-5">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Country Featured Card - Left Side */}
            <div className="lg:col-span-2">
              <Link
                href={`/${locale}/locations/${getLocalizedSlug(country, locale)}`}
                className="group block h-full p-5 rounded-xl border border-foreground/10 hover:border-foreground/30 hover:shadow-lg bg-gradient-to-br from-foreground/[0.02] to-foreground/[0.05] transition-all duration-300"
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-foreground/10 group-hover:bg-foreground/20 transition-colors">
                    <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground group-hover:text-foreground/70 transition-colors mb-1">
                      {getLocalizedName(country, locale)}
                    </h3>
                    <p className="text-xs text-foreground/50">
                      {country.locations.length} {locale === 'en' ? 'locations' : locale === 'ru' ? 'локаций' : 'ლოკაცია'}
                    </p>
                  </div>
                  <svg className="w-4 h-4 text-foreground/30 group-hover:text-foreground/50 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <p className="text-sm text-foreground/60 leading-relaxed">
                  {locale === 'en' 
                    ? 'Explore paragliding locations and discover breathtaking flying spots' 
                    : locale === 'ru' 
                    ? 'Изучите места для полетов на параплане и откройте захватывающие дух точки' 
                    : 'გაეცანით პარაგლაიდინგის ლოკაციებს და აღმოაჩინეთ უნიკალური ფრენის ადგილები'
                  }
                </p>
              </Link>
            </div>

            {/* Locations Grid - Right Side */}
            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {country.locations.length > 0 ? (
                  country.locations.map((location) => (
                    <Link
                      key={location.id}
                      href={`/${locale}/locations/${getLocalizedSlug(country, locale)}/${getLocalizedSlug(location, locale)}`}
                      className="group block p-3 rounded-lg border border-foreground/10 hover:border-foreground/20 hover:bg-foreground/[0.02] transition-all duration-200"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <svg className="w-3.5 h-3.5 text-foreground/40 group-hover:text-foreground/60 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <h4 className="text-sm font-semibold text-foreground group-hover:text-foreground/70 transition-colors">
                          {getLocalizedName(location, locale)}
                        </h4>
                      </div>
                      <p className="text-xs text-foreground/50 pl-5">
                        {locale === 'en' ? 'View details' : locale === 'ru' ? 'Подробнее' : 'დეტალურად →'}
                      </p>
                    </Link>
                  ))
                ) : (
                  <div className="col-span-2 p-6 rounded-lg border border-dashed border-foreground/10 text-center">
                    <svg className="w-8 h-8 mx-auto mb-2 text-foreground/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <p className="text-xs text-foreground/40">
                      {locale === 'en' ? 'No locations yet' : locale === 'ru' ? 'Пока нет локаций' : 'ლოკაციები არ არის'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {countriesWithLocations.length === 0 && !isLoading && (
        <div className="col-span-full text-center py-12 text-foreground/40">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">
            {locale === 'en' ? 'No countries available' : locale === 'ru' ? 'Страны не найдены' : 'ქვეყნები არ მოიძებნა'}
          </p>
        </div>
      )}
    </div>
  );
}
