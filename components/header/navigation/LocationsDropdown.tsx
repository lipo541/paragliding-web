'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSupabase } from '@/lib/supabase/SupabaseProvider';

interface Location {
  id: string;
  name_ka: string;
  name_en: string;
  name_ru: string;
  slug_ka: string;
  slug_en: string;
  slug_ru: string;
  country_id: string;
  cached_rating?: number;
  cached_rating_count?: number;
  location_pages?: {
    content?: {
      shared_images?: {
        hero_image?: {
          url: string;
          alt_ka?: string;
          alt_en?: string;
          alt_ru?: string;
        };
      };
    };
  };
}

interface Country {
  id: string;
  name_ka: string;
  name_en: string;
  name_ru: string;
  slug_ka: string;
  slug_en: string;
  slug_ru: string;
  cached_rating?: number;
  cached_rating_count?: number;
  content?: {
    shared_images?: {
      hero_image?: {
        url: string;
        alt_ka?: string;
        alt_en?: string;
        alt_ru?: string;
      };
    };
  };
  og_image_url?: string;
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
  const { client: supabase, session } = useSupabase();

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch active countries with ratings and images
        const { data: countries, error: countriesError } = await supabase
          .from('countries')
          .select('id, name_ka, name_en, name_ru, slug_ka, slug_en, slug_ru, cached_rating, cached_rating_count, content, og_image_url')
          .eq('is_active', true)
          .order('name_ka');

        if (countriesError) {
          console.error('Countries error:', countriesError);
          throw countriesError;
        }

        // Fetch all locations with ratings and join with location_pages for images
        const { data: locations, error: locationsError } = await supabase
          .from('locations')
          .select(`
            id, 
            name_ka, 
            name_en, 
            name_ru, 
            slug_ka, 
            slug_en, 
            slug_ru, 
            country_id, 
            cached_rating, 
            cached_rating_count,
            location_pages(content)
          `)
          .order('name_ka');

        if (locationsError) {
          console.error('Locations error:', locationsError);
          throw locationsError;
        }

        console.log('Countries fetched:', countries?.length || 0);
        console.log('Locations fetched:', locations?.length || 0);
        console.log('Sample location with pages:', locations?.[0]);

        // Group locations by country
        const grouped: CountryWithLocations[] = (countries || []).map(country => ({
          ...country,
          locations: (locations || []).filter(loc => loc.country_id === country.id) as Location[]
        }));

        setCountriesWithLocations(grouped);
      } catch (error: any) {
        console.error('Error fetching locations:', error);
        console.error('Error details:', error?.message, error?.code, error?.details);
      } finally {
        setIsLoading(false);
      }
    }

    // Re-fetch when session changes (covers tab visibility auth refresh scenarios)
    fetchData();
  }, [supabase, session]);

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
                className="group block h-full p-6 rounded-2xl border border-foreground/10 hover:border-foreground/20 hover:shadow-2xl shadow-lg bg-gradient-to-br from-foreground/[0.03] via-foreground/[0.02] to-transparent transition-all duration-500 hover:scale-[1.02]"
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-foreground/5 flex-shrink-0 ring-1 ring-foreground/10 group-hover:ring-foreground/20 transition-all duration-300">
                    <img 
                      src={country.content?.shared_images?.hero_image?.url || country.og_image_url || '/images/default-hero.jpg'}
                      alt={getLocalizedName(country, locale)}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/10"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-foreground group-hover:text-foreground/80 transition-colors mb-2 tracking-tight">
                      {getLocalizedName(country, locale)}
                    </h3>
                    <div className="flex items-center gap-2.5 text-xs flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-foreground/5 text-foreground/60 font-medium">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        {country.locations.length} {locale === 'en' ? 'locations' : locale === 'ru' ? 'локаций' : 'ლოკაცია'}
                      </span>
                      {country.cached_rating && country.cached_rating > 0 && (
                        <>
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
                            {/* Render 5 stars based on rating */}
                            {[1, 2, 3, 4, 5].map((star) => {
                              const filled = country.cached_rating! >= star;
                              const partial = country.cached_rating! > star - 1 && country.cached_rating! < star;
                              
                              return (
                                <div key={star} className="relative">
                                  {partial ? (
                                    <>
                                      <svg className="w-3.5 h-3.5 text-foreground/10" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                      </svg>
                                      <svg 
                                        className="w-3.5 h-3.5 text-yellow-500 absolute inset-0" 
                                        fill="currentColor" 
                                        viewBox="0 0 20 20"
                                        style={{ clipPath: `inset(0 ${100 - (country.cached_rating! % 1) * 100}% 0 0)` }}
                                      >
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                      </svg>
                                    </>
                                  ) : (
                                    <svg 
                                      className={`w-3.5 h-3.5 ${filled ? 'text-yellow-500' : 'text-foreground/10'}`} 
                                      fill="currentColor" 
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  )}
                                </div>
                              );
                            })}
                            <span className="ml-0.5 text-xs font-semibold text-foreground/70">{country.cached_rating.toFixed(1)}</span>
                            <span className="text-[10px] font-medium text-foreground/40">({country.cached_rating_count})</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="p-2 rounded-full bg-foreground/5 group-hover:bg-foreground/10 transition-colors">
                    <svg className="w-4 h-4 text-foreground/40 group-hover:text-foreground/70 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                <p className="text-sm text-foreground/60 leading-relaxed line-clamp-2">
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
                      className="group/location block p-3 rounded-xl border border-foreground/10 hover:border-foreground/25 hover:bg-foreground/[0.03] hover:shadow-md transition-all duration-300 hover:scale-[1.02]"
                    >
                      <div className="flex items-center gap-2.5">
                        {/* Location Image */}
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-foreground/5 flex-shrink-0 ring-1 ring-foreground/10 group-hover/location:ring-foreground/20 transition-all">
                          <img 
                            src={location.location_pages?.content?.shared_images?.hero_image?.url || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'}
                            alt={getLocalizedName(location, locale)}
                            className="w-full h-full object-cover group-hover/location:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/5"></div>
                        </div>
                        
                        {/* Location Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-foreground group-hover/location:text-foreground/80 transition-colors mb-1 truncate">
                            {getLocalizedName(location, locale)}
                          </h4>
                          
                          {/* Rating Stars */}
                          {location.cached_rating && location.cached_rating > 0 ? (
                            <div className="flex items-center gap-1">
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => {
                                  const filled = location.cached_rating! >= star;
                                  const partial = location.cached_rating! > star - 1 && location.cached_rating! < star;
                                  
                                  return (
                                    <div key={star} className="relative">
                                      {partial ? (
                                        <>
                                          <svg className="w-3 h-3 text-foreground/10" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                          </svg>
                                          <svg 
                                            className="w-3 h-3 text-yellow-500 absolute inset-0" 
                                            fill="currentColor" 
                                            viewBox="0 0 20 20"
                                            style={{ clipPath: `inset(0 ${100 - (location.cached_rating! % 1) * 100}% 0 0)` }}
                                          >
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                          </svg>
                                        </>
                                      ) : (
                                        <svg 
                                          className={`w-3 h-3 ${filled ? 'text-yellow-500' : 'text-foreground/10'}`} 
                                          fill="currentColor" 
                                          viewBox="0 0 20 20"
                                        >
                                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                              <span className="text-xs font-semibold text-foreground/70">{location.cached_rating.toFixed(1)}</span>
                              <span className="text-[10px] font-medium text-foreground/40">({location.cached_rating_count})</span>
                            </div>
                          ) : (
                            <p className="text-xs text-foreground/50 group-hover/location:text-foreground/60 transition-colors">
                              {locale === 'en' ? 'View details' : locale === 'ru' ? 'Подробнее' : 'დეტალურად →'}
                            </p>
                          )}
                        </div>
                        
                        {/* Arrow Icon */}
                        <svg className="w-4 h-4 text-foreground/30 group-hover/location:text-foreground/50 group-hover/location:translate-x-0.5 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
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
