'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
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

  const supabase = createClient();

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
        // Fetch countries
        const { data: countriesData, error: countriesError } = await supabase
          .from('countries')
          .select('*')
          .eq('is_active', true)
          .order('name_ka', { ascending: true });

        if (countriesError) throw countriesError;
        setCountries(countriesData || []);

        // Fetch locations with hero images
        const { data: locationsData, error: locationsError } = await supabase
          .from('locations')
          .select(`
            *,
            location_pages(
              content,
              is_active
            )
          `)
          .order('name_ka', { ascending: true });

        if (locationsError) throw locationsError;
        
        // Extract hero image from location_pages content
        const locationsWithHero = (locationsData || []).map((loc: any) => {
          return {
            ...loc,
            hero_image_url: loc.location_pages?.content?.shared_images?.hero_image?.url || loc.og_image_url || null
          };
        });
        setLocations(locationsWithHero);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

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
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Header */}
      <div className="w-full bg-background border-b border-foreground/10">
        <div className="max-w-[1280px] mx-auto px-4 py-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
            ყველა ლოკაცია
          </h1>
          <p className="text-sm text-foreground/60">
            აღმოაჩინე პარაპლანერიზმის საუკეთესო ლოკაციები საქართველოში და მის ფარგლებს გარეთ
          </p>
        </div>
      </div>

      {/* Filters & Controls */}
      <div className="w-full bg-background border-b border-foreground/10 sticky top-16 z-40">
        <div className="max-w-[1280px] mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            
            {/* Search */}
            <div className="relative flex-1 w-full lg:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ძებნა ლოკაციის მიხედვით..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-foreground/20 rounded-lg focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 outline-none transition-all bg-background text-foreground"
              />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 w-full lg:w-auto">
              
              {/* Country Filter */}
              <div className="relative flex-1 lg:flex-initial">
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="w-full lg:w-auto flex items-center justify-between gap-2 px-4 py-2 text-sm border border-foreground/20 rounded-lg hover:bg-foreground/5 transition-all bg-background"
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
                  <div className="absolute top-full left-0 right-0 lg:right-auto lg:w-64 mt-2 bg-background border border-foreground/20 rounded-lg shadow-lg overflow-hidden z-50">
                    <button
                      onClick={() => {
                        setSelectedCountry('all');
                        setIsFilterOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-sm text-left hover:bg-foreground/5 transition-colors ${
                        selectedCountry === 'all' ? 'bg-foreground/10 font-semibold' : ''
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
                        className={`w-full px-4 py-2 text-sm text-left hover:bg-foreground/5 transition-colors ${
                          selectedCountry === country.id ? 'bg-foreground/10 font-semibold' : ''
                        }`}
                      >
                        {getLocalizedName(country, 'name')}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-foreground/5 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition-all ${
                    viewMode === 'grid' 
                      ? 'bg-foreground text-background' 
                      : 'text-foreground/60 hover:text-foreground'
                  }`}
                  title="Grid View"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded transition-all ${
                    viewMode === 'list' 
                      ? 'bg-foreground text-background' 
                      : 'text-foreground/60 hover:text-foreground'
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-3 text-xs text-foreground/60">
            ნაპოვნია {filteredLocations.length} ლოკაცია
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1280px] mx-auto px-4 py-8">
        {groupedLocations.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-foreground/60">ლოკაცია ვერ მოიძებნა</p>
          </div>
        ) : (
          <div className="space-y-12">
            {groupedLocations.map(({ country, locations }) => (
              <div key={country.id}>
                {/* Country Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex-1 h-px bg-foreground/10"></div>
                  <h2 className="text-lg font-bold text-foreground">
                    {getLocalizedName(country, 'name')}
                  </h2>
                  <div className="flex-1 h-px bg-foreground/10"></div>
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
                          className="group rounded-xl border border-foreground/10 bg-foreground/[0.02] overflow-hidden hover:border-foreground/30 hover:shadow-lg transition-all duration-300"
                        >
                          {/* Image */}
                          <div className="relative aspect-video overflow-hidden bg-foreground/5">
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
                                <MapPin className="w-12 h-12 text-foreground/20" />
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="p-4">
                            <h3 className="text-base font-bold text-foreground group-hover:text-foreground/80 transition-colors">
                              {getLocalizedName(location, 'name')}
                            </h3>
                            <p className="text-xs text-foreground/60 mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {getLocalizedName(country, 'name')}
                            </p>
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
                          className="group flex items-center gap-4 p-4 rounded-lg border border-foreground/10 bg-foreground/[0.02] hover:border-foreground/30 hover:bg-foreground/[0.04] transition-all duration-300"
                        >
                          {/* Thumbnail */}
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-foreground/5 flex-shrink-0">
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
                                <MapPin className="w-8 h-8 text-foreground/20" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1">
                            <h3 className="text-base font-bold text-foreground group-hover:text-foreground/80 transition-colors">
                              {getLocalizedName(location, 'name')}
                            </h3>
                            <p className="text-xs text-foreground/60 mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {getLocalizedName(country, 'name')}
                            </p>
                          </div>

                          {/* Arrow */}
                          <div className="text-foreground/40 group-hover:text-foreground group-hover:translate-x-1 transition-all">
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
