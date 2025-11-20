'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/lib/supabase/SupabaseProvider';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Grid, List, MapPin, Filter, ChevronDown } from 'lucide-react';

interface Country {
  id: string;
  name_ka: string;
  name_en: string;
  name_ru: string;
  slug_ka: string;
  slug_en: string;
  slug_ru: string;
  og_image_url?: string;
  cached_rating?: number;
  cached_rating_count?: number;
}

interface Location {
  id: string;
  country_id: string;
  name_ka: string;
  name_en: string;
  name_ru: string;
  slug_ka: string;
  slug_en: string;
  slug_ru: string;
  og_image_url?: string;
  hero_image_url?: string;
  cached_rating?: number;
  cached_rating_count?: number;
  altitude?: number;
  best_season_start?: number;
  best_season_end?: number;
  difficulty_level?: string;
}

interface GlobalLocationsProps {
  locale: string;
}

type ViewMode = 'grid' | 'list';

export default function GlobalLocations({ locale }: GlobalLocationsProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const { client: supabase, session } = useSupabase();

  // Helper to get localized field - always use Georgian for display
  const getLocalizedName = (obj: any, field: string) => {
    return obj?.[`${field}_ka`] || obj?.[`${field}_en`] || '';
  };

  // Helper to get slug based on locale for routing
  const getLocalizedSlug = (obj: any) => {
    const slug = obj?.[`slug_${locale}`] || obj?.[`slug_en`] || '';
    console.log('Getting slug for locale:', locale, 'Object:', obj, 'Result:', slug);
    return slug;
  };

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch countries with ratings
        const { data: countriesData, error: countriesError } = await supabase
          .from('countries')
          .select('id, name_ka, name_en, name_ru, slug_ka, slug_en, slug_ru, og_image_url, cached_rating, cached_rating_count')
          .eq('is_active', true)
          .order('name_ka', { ascending: true });

        if (countriesError) throw countriesError;
        setCountries(countriesData || []);

        // Fetch locations with ratings and details
        const { data: locationsData, error: locationsError } = await supabase
          .from('locations')
          .select('id, country_id, name_ka, name_en, name_ru, slug_ka, slug_en, slug_ru, og_image_url, cached_rating, cached_rating_count, altitude, best_season_start, best_season_end, difficulty_level')
          .order('name_ka', { ascending: true });

        if (locationsError) {
          console.error('Locations error:', locationsError);
          throw locationsError;
        }
        
        console.log('Fetched locations:', locationsData?.length);
        
        // Fetch location_pages for hero images
        const { data: locationPagesData } = await supabase
          .from('location_pages')
          .select('location_id, content');
        
        // Merge hero images with locations
        const locationsWithHero = (locationsData || []).map((loc: any) => {
          const locationPage = locationPagesData?.find((lp: any) => lp.location_id === loc.id);
          const heroImageUrl = locationPage?.content?.shared_images?.hero_image?.url;
          
          return {
            ...loc,
            hero_image_url: heroImageUrl || loc.og_image_url || null
          };
        });
        setLocations(locationsWithHero);
      } catch (error: any) {
        console.error('Error fetching data:', error);
        console.error('Error details:', error?.message, error?.code, error?.hint);
      } finally {
        setIsLoading(false);
      }
    };

    // Re-fetch when auth session changes to avoid stale data after tab switches
    fetchData();
  }, [supabase, session]);

  // Filter locations
  const filteredLocations = locations.filter((location) => {
    const matchesSearch = getLocalizedName(location, 'name').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCountry = selectedCountry === 'all' || location.country_id === selectedCountry;
    return matchesSearch && matchesCountry;
  });

  // Group locations by country
  const groupedLocations = countries.map(country => ({
    country,
    locations: filteredLocations.filter(loc => loc.country_id === country.id)
  })).filter(group => group.locations.length > 0);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="w-full bg-background border-b border-gray-200 dark:border-zinc-800">
        <div className="max-w-[1280px] mx-auto px-4 py-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            ყველა ლოკაცია
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            აღმოაჩინე პარაპლანერიზმის საუკეთესო ლოკაციები საქართველოში და მის ფარგლებს გარეთ
          </p>
        </div>
      </div>

      {/* Filters & Controls */}
      <div className="w-full bg-background border-b border-gray-200 dark:border-zinc-800 sticky top-16 z-40">
        <div className="max-w-[1280px] mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            
            {/* Search */}
            <div className="relative flex-1 w-full lg:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ძებნა ლოკაციის მიხედვით..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white dark:bg-zinc-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 w-full lg:w-auto">
              
              {/* Country Filter */}
              <div className="relative flex-1 lg:flex-initial">
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="w-full lg:w-auto flex items-center justify-between gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all bg-white dark:bg-zinc-900 text-gray-900 dark:text-white"
                >
                  <Filter className="w-4 h-4" />
                  <span className="flex-1 text-left lg:flex-initial">
                    {selectedCountry === 'all' 
                      ? 'ყველა ქვეყანა' 
                      : getLocalizedName(countries.find(c => c.id === selectedCountry), 'name')}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                </button>

                {isFilterOpen && (
                  <div className="absolute top-full left-0 right-0 lg:right-auto lg:w-64 mt-2 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-lg shadow-lg overflow-hidden z-50">
                    <button
                      onClick={() => {
                        setSelectedCountry('all');
                        setIsFilterOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-sm text-left text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors ${
                        selectedCountry === 'all' ? 'bg-blue-50 dark:bg-blue-950 font-semibold' : ''
                      }`}
                    >
                      ყველა ქვეყანა
                    </button>
                    {countries.map(country => (
                      <button
                        key={country.id}
                        onClick={() => {
                          setSelectedCountry(country.id);
                          setIsFilterOpen(false);
                        }}
                        className={`w-full px-4 py-2 text-sm text-left text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors ${
                          selectedCountry === country.id ? 'bg-blue-50 dark:bg-blue-950 font-semibold' : ''
                        }`}
                      >
                        {getLocalizedName(country, 'name')}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition-all ${
                    viewMode === 'grid' 
                      ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-sm' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  title="Grid View"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded transition-all ${
                    viewMode === 'list' 
                      ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-sm' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
            ნაპოვნია {filteredLocations.length} ლოკაცია
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1280px] mx-auto px-4 py-8">
        {groupedLocations.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600 dark:text-gray-400">ლოკაცია ვერ მოიძებნა</p>
          </div>
        ) : (
          <div className="space-y-12">
            {groupedLocations.map(({ country, locations }) => (
              <div key={country.id}>
                {/* Country Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-800"></div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                      {getLocalizedName(country, 'name')}
                    </h2>
                    {country.cached_rating && country.cached_rating > 0 && (
                      <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`w-3 h-3 ${
                              star <= Math.round(country.cached_rating!)
                                ? 'text-yellow-500 fill-current'
                                : 'text-gray-300 dark:text-zinc-600 fill-current'
                            }`}
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 ml-1">
                          {country.cached_rating.toFixed(1)}
                        </span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">
                          ({country.cached_rating_count})
                        </span>
                      </div>
                    )}
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      • {locations.length} ლოკაცია
                    </span>
                  </div>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-800"></div>
                </div>

                {/* Locations Grid/List */}
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {locations.map(location => {
                      const countrySlug = getLocalizedSlug(country);
                      const locationSlug = getLocalizedSlug(location);
                      
                      return (
                        <Link
                          key={location.id}
                          href={`/${locale}/locations/${countrySlug}/${locationSlug}`}
                          className="group rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg transition-all duration-300"
                        >
                          {/* Image */}
                          <div className="relative aspect-video overflow-hidden bg-gray-100 dark:bg-zinc-800">
                            {location.hero_image_url ? (
                              <Image
                                src={location.hero_image_url}
                                alt={getLocalizedName(location, 'name')}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <MapPin className="w-12 h-12 text-gray-300 dark:text-zinc-600" />
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="p-4">
                            <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2">
                              {getLocalizedName(location, 'name')}
                            </h3>
                            
                            {/* Rating */}
                            {location.cached_rating && location.cached_rating > 0 && (
                              <div className="flex items-center gap-1 mb-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <svg
                                    key={star}
                                    className={`w-3.5 h-3.5 ${
                                      star <= Math.round(location.cached_rating!)
                                        ? 'text-yellow-500 fill-current'
                                        : 'text-gray-300 dark:text-zinc-600 fill-current'
                                    }`}
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 ml-1">
                                  {location.cached_rating.toFixed(1)}
                                </span>
                                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                  ({location.cached_rating_count})
                                </span>
                              </div>
                            )}
                            
                            {/* Location Info */}
                            <div className="space-y-1">
                              <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {getLocalizedName(country, 'name')}
                              </p>
                              {location.altitude && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                  </svg>
                                  {location.altitude}მ
                                </p>
                              )}
                              {location.best_season_start && location.best_season_end && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {['იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ', 'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ'][location.best_season_start - 1]} - {['იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ', 'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ'][location.best_season_end - 1]}
                                </p>
                              )}
                              {location.difficulty_level && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                  </svg>
                                  {location.difficulty_level === 'beginner' ? 'დამწყები' : location.difficulty_level === 'intermediate' ? 'საშუალო' : 'პროფესიონალი'}
                                </p>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {locations.map(location => {
                      const countrySlug = getLocalizedSlug(country);
                      const locationSlug = getLocalizedSlug(location);
                      
                      return (
                        <Link
                          key={location.id}
                          href={`/${locale}/locations/${countrySlug}/${locationSlug}`}
                          className="group flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all duration-300"
                        >
                          {/* Thumbnail */}
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-zinc-800 flex-shrink-0">
                            {location.hero_image_url ? (
                              <Image
                                src={location.hero_image_url}
                                alt={getLocalizedName(location, 'name')}
                                fill
                                className="object-cover"
                                sizes="80px"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <MapPin className="w-8 h-8 text-gray-300 dark:text-zinc-600" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1">
                                  {getLocalizedName(location, 'name')}
                                </h3>
                                
                                {/* Rating */}
                                {location.cached_rating && location.cached_rating > 0 && (
                                  <div className="flex items-center gap-1 mb-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <svg
                                        key={star}
                                        className={`w-3 h-3 ${
                                          star <= Math.round(location.cached_rating!)
                                            ? 'text-yellow-500 fill-current'
                                            : 'text-gray-300 dark:text-zinc-600 fill-current'
                                        }`}
                                        viewBox="0 0 20 20"
                                      >
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                      </svg>
                                    ))}
                                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 ml-1">
                                      {location.cached_rating.toFixed(1)}
                                    </span>
                                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                      ({location.cached_rating_count})
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Quick Stats */}
                              <div className="flex flex-col gap-1 text-right">
                                {location.altitude && (
                                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    {location.altitude}მ
                                  </span>
                                )}
                                {location.difficulty_level && (
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    location.difficulty_level === 'beginner' 
                                      ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                                      : location.difficulty_level === 'intermediate'
                                      ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                                      : 'bg-red-500/10 text-red-600 dark:text-red-400'
                                  }`}>
                                    {location.difficulty_level === 'beginner' ? 'დამწყები' : location.difficulty_level === 'intermediate' ? 'საშუალო' : 'პროფი'}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Location Details */}
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                              <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {getLocalizedName(country, 'name')}
                              </p>
                              {location.best_season_start && location.best_season_end && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {['იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ', 'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ'][location.best_season_start - 1]} - {['იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ', 'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ'][location.best_season_end - 1]}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Arrow */}
                          <div className="text-gray-400 dark:text-zinc-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
