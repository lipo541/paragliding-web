'use client';

import { useState, useEffect, useRef } from 'react';
import { useSupabase } from '@/lib/supabase/SupabaseProvider';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Grid, List, MapPin, Filter, ChevronDown, ChevronUp, TrendingUp, Globe, Star, X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/hooks/useTranslation';

// --- Interfaces ---

interface Country {
  id: string;
  name_ka: string;
  name_en: string;
  name_ru: string;
  name_ar: string;
  name_de: string;
  name_tr: string;
  slug_ka: string;
  slug_en: string;
  slug_ru: string;
  slug_ar: string;
  slug_de: string;
  slug_tr: string;
  og_image_url?: string;
  cached_rating?: number;
  cached_rating_count?: number;
}

interface FlightType {
  name: string;
  price_gel?: number;
  price_usd?: number;
  price_eur?: number;
}

interface Location {
  id: string;
  country_id: string;
  name_ka: string;
  name_en: string;
  name_ru: string;
  name_ar: string;
  name_de: string;
  name_tr: string;
  slug_ka: string;
  slug_en: string;
  slug_ru: string;
  slug_ar: string;
  slug_de: string;
  slug_tr: string;
  og_image_url?: string;
  hero_image_url?: string;
  cached_rating?: number;
  cached_rating_count?: number;
  altitude?: number;
  best_season_start?: number;
  best_season_end?: number;
  difficulty_level?: string;
  flight_types?: FlightType[];
  min_price?: number;
}

interface GlobalLocationsProps {
  locale: string;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'rating' | 'name' | 'altitude';

export default function GlobalLocations({ locale }: GlobalLocationsProps) {
  // Translation hook
  const { t } = useTranslation('globallocations');
  
  // --- State Management ---
  const [countries, setCountries] = useState<Country[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [heroSearchQuery, setHeroSearchQuery] = useState('');
  const [isHeroSearchOpen, setIsHeroSearchOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('rating');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [collapsedCountries, setCollapsedCountries] = useState<Set<string>>(new Set());
  
  // Background rotation state
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [backgroundImages, setBackgroundImages] = useState<string[]>([]);
  
  // Scroll tracking for hero
  const [scrollY, setScrollY] = useState(0);
  const [heroVisible, setHeroVisible] = useState(true);
  const heroRef = useRef<HTMLDivElement>(null);

  const { client: supabase, session } = useSupabase();

  // --- Helper Functions ---
  
  const getLocalizedName = (obj: any, field: string) => {
    if (!obj) return '';
    const localizedValue = obj?.[`${field}_${locale}`];
    if (localizedValue) return localizedValue;
    
    // Fallback logic: ar/de/tr → en → ka
    if (['ar', 'de', 'tr'].includes(locale)) {
      return obj?.[`${field}_en`] || obj?.[`${field}_ka`] || '';
    }
    return obj?.[`${field}_ka`] || obj?.[`${field}_en`] || '';
  };

  const getLocalizedSlug = (obj: any) => {
    if (!obj) return '';
    const localizedSlug = obj?.[`slug_${locale}`];
    if (localizedSlug) return localizedSlug;
    
    // Fallback logic: ar/de/tr → en → ka
    if (['ar', 'de', 'tr'].includes(locale)) {
      return obj?.[`slug_en`] || obj?.[`slug_ka`] || '';
    }
    return obj?.[`slug_ka`] || obj?.[`slug_en`] || '';
  };

  const getMonthName = (month: number) => {
    const months = t('months') as unknown as string[];
    return months[month - 1] || '';
  };

  const getDifficultyLabel = (level: string) => {
    return t(`difficulty.${level}`) || level;
  };

  const getDifficultyColor = (level: string) => {
    const colors: { [key: string]: string } = {
      beginner: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
      intermediate: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
      advanced: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
      expert: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
    };
    return colors[level] || 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20';
  };

  // --- Data Fetching ---
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Refresh session if needed
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        // Fetch countries (public data, no auth required)
        const { data: countriesData, error: countriesError } = await supabase
          .from('countries')
          .select('id, name_ka, name_en, name_ru, name_ar, name_de, name_tr, slug_ka, slug_en, slug_ru, slug_ar, slug_de, slug_tr, og_image_url, cached_rating, cached_rating_count')
          .eq('is_active', true)
          .order('name_ka', { ascending: true });

        if (countriesError) {
          console.error('Countries error:', countriesError);
          // Continue even if error - show empty state
        }
        setCountries(countriesData || []);

        // Fetch locations (public data, no auth required)
        const { data: locationsData, error: locationsError } = await supabase
          .from('locations')
          .select('id, country_id, name_ka, name_en, name_ru, name_ar, name_de, name_tr, slug_ka, slug_en, slug_ru, slug_ar, slug_de, slug_tr, og_image_url, cached_rating, cached_rating_count, altitude, best_season_start, best_season_end, difficulty_level')
          .order('name_ka', { ascending: true });

        if (locationsError) {
          console.error('Error fetching locations:', locationsError);
          // Continue even if error - show empty state
        }

        // Fetch location_pages for hero images and flight types
        const { data: locationPagesData, error: pagesError } = await supabase
          .from('location_pages')
          .select('location_id, content')
          .eq('is_active', true);

        if (pagesError) {
          console.error('Error fetching location_pages:', pagesError);
        }

        // Merge hero images and flight types with locations
        const locationsWithHero = (locationsData || []).map((loc: any) => {
          const locationPage = locationPagesData?.find((lp: any) => lp.location_id === loc.id);
          const heroImageUrl = locationPage?.content?.shared_images?.hero_image?.url;
          
          // Extract flight types and prices from current locale with fallback
          const localeFlightTypes = locationPage?.content?.[locale]?.flight_types || 
                                    locationPage?.content?.en?.flight_types || 
                                    locationPage?.content?.ka?.flight_types || [];
          const sharedFlightTypes = locationPage?.content?.shared_flight_types || [];
          
          // Merge locale flight types with shared prices
          const flightTypes = localeFlightTypes.map((ft: any) => {
            const shared = sharedFlightTypes.find((s: any) => String(s.id) === String(ft.shared_id));
            return {
              name: ft.name,
              description: ft.description,
              price_gel: ft.price_gel ?? shared?.price_gel,
              price_usd: ft.price_usd ?? shared?.price_usd,
              price_eur: ft.price_eur ?? shared?.price_eur,
            };
          });
          
          const minPrice = flightTypes.length > 0
            ? Math.min(...flightTypes.map((ft: any) => ft.price_gel || Infinity).filter((p: number) => p !== Infinity))
            : null;
          
          return {
            ...loc,
            hero_image_url: heroImageUrl || loc.og_image_url || null,
            flight_types: flightTypes,
            min_price: minPrice
          };
        });
        
        setLocations(locationsWithHero);

        // Get top 6 locations by rating for background rotation
        const topLocations = [...locationsWithHero]
          .filter(loc => loc.hero_image_url && loc.cached_rating)
          .sort((a, b) => (b.cached_rating || 0) - (a.cached_rating || 0))
          .slice(0, 6)
          .map(loc => loc.hero_image_url)
          .filter(Boolean);
        
        setBackgroundImages(topLocations.length > 0 ? topLocations : [
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070'
        ]);

      } catch (error: any) {
        console.error('Error fetching data:', error);
        // Don't block UI - show empty state with fallback background
        setBackgroundImages(['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070']);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [supabase]);

  // Background rotation - 9 seconds (modern timing)
  useEffect(() => {
    if (backgroundImages.length < 2) return;
    
    const interval = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 9000);

    return () => clearInterval(interval);
  }, [backgroundImages]);

  // Scroll tracking with hysteresis
  useEffect(() => {
    const THRESHOLD = 300;
    
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      setScrollY(currentScroll);
      
      // Close hero search dropdown on scroll
      if (isHeroSearchOpen) {
        setIsHeroSearchOpen(false);
      }
      
      if (currentScroll > THRESHOLD && heroVisible) {
        setHeroVisible(false);
      } else if (currentScroll <= 50 && !heroVisible) {
        setHeroVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [heroVisible, isHeroSearchOpen]);

  // Ref for main content area
  const contentRef = useRef<HTMLDivElement>(null);

  // Smart scroll to content only when filters change (not on every keystroke)
  useEffect(() => {
    // Only scroll when filter is applied (not during typing)
    if (selectedCountry !== 'all') {
      // Scroll to content area if it's not visible
      if (contentRef.current) {
        const rect = contentRef.current.getBoundingClientRect();
        const stickyBarHeight = 100; // Approximate sticky bar height
        
        // If content is below viewport, scroll to it
        if (rect.top > window.innerHeight) {
          contentRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }
    }
  }, [selectedCountry]); // Only on country filter change, NOT on searchQuery

  // --- Filtering & Sorting ---

  const filteredLocations = locations.filter((location) => {
    const matchesSearch = getLocalizedName(location, 'name').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCountry = selectedCountry === 'all' || location.country_id === selectedCountry;
    return matchesSearch && matchesCountry;
  });

  const sortedLocations = [...filteredLocations].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return (b.cached_rating || 0) - (a.cached_rating || 0);
      case 'name':
        return getLocalizedName(a, 'name').localeCompare(getLocalizedName(b, 'name'), 'ka');
      case 'altitude':
        return (b.altitude || 0) - (a.altitude || 0);
      default:
        return 0;
    }
  });

  // Group by country
  const groupedLocations = countries.map(country => ({
    country,
    locations: sortedLocations.filter(loc => loc.country_id === country.id)
  })).filter(group => group.locations.length > 0);

  // Stats for hero
  const totalLocations = locations.length;
  const totalCountries = countries.length;
  const avgRating = locations.length > 0
    ? (locations.reduce((sum, loc) => sum + (loc.cached_rating || 0), 0) / locations.filter(loc => loc.cached_rating).length)
    : 0;

  // Toggle country collapse
  const toggleCountry = (countryId: string) => {
    setCollapsedCountries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(countryId)) {
        newSet.delete(countryId);
      } else {
        newSet.add(countryId);
      }
      return newSet;
    });
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
  };

  // Clear filters
  const clearFilters = () => {
    setSelectedCountry('all');
    setSearchQuery('');
    setSortBy('rating');
  };

  const hasActiveFilters = selectedCountry !== 'all' || searchQuery !== '';

  // Hero search dropdown results (instant preview with smart matching)
  const heroSearchResults = heroSearchQuery.trim()
    ? (() => {
        const searchTerms = heroSearchQuery.toLowerCase().split(' ').filter(t => t.length > 0);
        
        // Match locations - check if ALL search terms match (name OR country)
        const matchedLocations = locations
          .filter((location) => {
            const locationName = getLocalizedName(location, 'name').toLowerCase();
            const country = countries.find(c => c.id === location.country_id);
            const countryName = country ? getLocalizedName(country, 'name').toLowerCase() : '';
            
            // ALL search terms must match somewhere (location name OR country name)
            return searchTerms.every(term => 
              locationName.includes(term) || countryName.includes(term)
            );
          })
          .map(loc => ({ type: 'location' as const, data: loc }));

        // Match countries - check if ANY search term matches country name
        const matchedCountries = countries
          .filter((country) => {
            const countryName = getLocalizedName(country, 'name').toLowerCase();
            return searchTerms.some(term => countryName.includes(term));
          })
          .map(country => ({ type: 'country' as const, data: country }));

        // Combine: Locations first (more specific), then countries
        return [...matchedLocations, ...matchedCountries].slice(0, 8);
      })()
    : [];

  // --- Loading State ---
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          <p className="text-sm text-foreground/60 animate-pulse">{t('hero.loading')}</p>
        </div>
      </div>
    );
  }

  // --- Render ---

  return (
    <div className="min-h-screen relative selection:bg-blue-500/30">
      {/* Enhanced Background System - Triple Layer with Rotation */}
      <div className="fixed inset-0 -z-10">
        {/* Layer 1: Rotating Background Images (Top 6 Locations) */}
        {backgroundImages.map((imageUrl: string, index: number) => (
          <div
            key={index}
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-in-out"
            style={{
              backgroundImage: `url(${imageUrl})`,
              opacity: currentBgIndex === index ? 1 : 0,
              zIndex: currentBgIndex === index ? 1 : 0,
            }}
          />
        ))}
        
        {/* Layer 2: Smart Overlay - Adaptive darkness */}
        <div 
          className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/75 dark:from-black/80 dark:via-black/70 dark:to-black/85" 
          style={{ zIndex: 2 }} 
        />
        
        {/* Layer 3: Depth Gradient */}
        <div 
          className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" 
          style={{ zIndex: 3 }} 
        />
      </div>

      {/* Hero Section - Compact for Mobile - with Hysteresis Fade */}
      <div
        ref={heroRef}
        className="relative z-[60] min-h-[50vh] lg:min-h-[60vh] w-full flex items-center justify-center transition-all duration-500 ease-out"
        style={{
          opacity: heroVisible ? 1 : 0,
          transform: heroVisible ? 'translateY(0)' : 'translateY(-50px)',
          pointerEvents: heroVisible ? 'auto' : 'none',
        }}
      >
        <div className="max-w-[1280px] mx-auto px-4 py-6 lg:py-12 w-full">
          <div className="text-center space-y-4 lg:space-y-6">
            {/* Main Heading */}
            <div className="space-y-1.5 lg:space-y-3">
              <h1 className="text-2xl lg:text-5xl xl:text-6xl font-bold text-foreground">
                {t('hero.title')}
              </h1>
              <p className="text-sm lg:text-lg text-foreground/80 max-w-2xl mx-auto px-4">
                {t('hero.subtitle')}
              </p>
            </div>

            {/* Hero Search Bar - Dropdown Results */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/60 z-10" />
                <input
                  type="text"
                  value={heroSearchQuery}
                  onChange={(e) => {
                    setHeroSearchQuery(e.target.value);
                    setIsHeroSearchOpen(true);
                  }}
                  onFocus={() => setIsHeroSearchOpen(true)}
                  onBlur={() => {
                    // Delay to allow click on dropdown items
                    setTimeout(() => setIsHeroSearchOpen(false), 300);
                  }}
                  placeholder={t('hero.searchPlaceholder')}
                  className="w-full pl-12 pr-12 py-4 text-base rounded-xl backdrop-blur-lg bg-white/70 dark:bg-black/40 border border-white/50 dark:border-white/20 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all text-foreground placeholder:text-foreground/50 shadow-xl"
                />
                {heroSearchQuery && (
                  <button
                    onClick={() => {
                      setHeroSearchQuery('');
                      setIsHeroSearchOpen(false);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-foreground/10 transition-colors z-10"
                  >
                    <X className="w-4 h-4 text-foreground/60" />
                  </button>
                )}

                {/* Dropdown Results */}
                {isHeroSearchOpen && heroSearchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 backdrop-blur-xl bg-white/95 dark:bg-black/95 border border-white/50 dark:border-white/20 rounded-xl shadow-2xl overflow-hidden z-[100] max-h-[500px] overflow-y-auto">
                    {heroSearchResults.map((result, index) => {
                      if (result.type === 'location') {
                        // LOCATION CARD - with image and country info
                        const location = result.data;
                        const country = countries.find(c => c.id === location.country_id);
                        const locationSlug = getLocalizedSlug(location);
                        const countrySlug = country ? getLocalizedSlug(country) : '';
                        
                        return (
                          <Link
                            key={`location-${location.id}`}
                            href={`/${locale}/${countrySlug}/${locationSlug}`}
                            className="block p-3 hover:bg-black/5 dark:hover:bg-white/10 transition-all border-b border-foreground/5 last:border-0 group"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setHeroSearchQuery('');
                              setIsHeroSearchOpen(false);
                              window.location.href = `/${locale}/locations/${countrySlug}/${locationSlug}`;
                            }}
                          >
                            <div className="flex gap-3">
                              {/* Location Image */}
                              <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 shadow-md ring-1 ring-blue-500/30 group-hover:ring-blue-500/50 group-hover:shadow-lg transition-all">
                                {location.og_image_url ? (
                                  <Image
                                    src={location.og_image_url}
                                    alt={getLocalizedName(location, 'name')}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                                    <MapPin className="w-8 h-8 text-foreground/40" />
                                  </div>
                                )}
                                {/* Location Badge */}
                                <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md text-[9px] font-bold bg-blue-500 text-white shadow-md backdrop-blur-sm">
                                  {t('hero.locationBadge')}
                                </div>
                                {/* Rating Badge on Image */}
                                {location.cached_rating && (
                                  <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-sm">
                                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                    <span className="text-[11px] font-bold text-white">
                                      {location.cached_rating.toFixed(1)}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Location Info */}
                              <div className="flex-1 min-w-0 flex flex-col">
                                {/* Title & Country */}
                                <div className="mb-2">
                                  <h3 className="font-bold text-base text-foreground mb-0.5 truncate group-hover:text-blue-500 transition-colors">
                                    {getLocalizedName(location, 'name')}
                                  </h3>
                                  <div className="flex items-center gap-1.5 text-xs text-foreground/60">
                                    <Globe className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">{country ? getLocalizedName(country, 'name') : ''}</span>
                                  </div>
                                </div>
                                
                                {/* Flight Types with Prices - Compact Grid */}
                                {location.flight_types && location.flight_types.length > 0 && (
                                  <div className="flex-1 space-y-1">
                                    {location.flight_types.slice(0, 2).map((ft, ftIdx) => (
                                      <div key={ftIdx} className="flex items-start justify-between gap-3 py-1 px-2 rounded-md bg-foreground/5 hover:bg-foreground/10 transition-colors">
                                        <span className="text-xs font-medium text-foreground/80 truncate flex-1">
                                          {ft.name}
                                        </span>
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                          {ft.price_gel && (
                                            <span className="text-xs font-bold text-green-600 dark:text-green-400 whitespace-nowrap">
                                              {ft.price_gel}₾
                                            </span>
                                          )}
                                          {ft.price_usd && (
                                            <span className="text-[10px] font-semibold text-blue-600/80 dark:text-blue-400/80 whitespace-nowrap">
                                              ${ft.price_usd}
                                            </span>
                                          )}
                                          {ft.price_eur && (
                                            <span className="text-[10px] font-semibold text-purple-600/80 dark:text-purple-400/80 whitespace-nowrap">
                                              €{ft.price_eur}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                    {location.flight_types.length > 2 && (
                                      <p className="text-[10px] text-foreground/50 italic text-center pt-0.5">
                                        +{location.flight_types.length - 2} {t('hero.moreFlight')}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </Link>
                        );
                      } else {
                        // COUNTRY CARD - more compact, different style
                        const country = result.data;
                        const countrySlug = getLocalizedSlug(country);
                        const countryLocationsCount = locations.filter(loc => loc.country_id === country.id).length;
                        
                        return (
                          <Link
                            key={`country-${country.id}`}
                            href={`/${locale}/${countrySlug}`}
                            className="flex items-center gap-4 p-4 hover:bg-green-500/5 dark:hover:bg-green-500/10 transition-all border-b border-foreground/5 last:border-0 group"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setHeroSearchQuery('');
                              setIsHeroSearchOpen(false);
                              window.location.href = `/${locale}/locations/${countrySlug}`;
                            }}
                          >
                            {/* Country Icon */}
                            <div className="relative w-16 h-16 rounded-lg flex-shrink-0 bg-gradient-to-br from-green-500/20 to-blue-500/20 flex items-center justify-center shadow-lg ring-2 ring-green-500/20 group-hover:ring-green-500/40 transition-all">
                              <Globe className="w-8 h-8 text-green-500" />
                              {/* Country Badge */}
                              <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-500 text-white shadow-lg">
                                {t('hero.countryBadge')}
                              </div>
                            </div>

                            {/* Country Info */}
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-base text-foreground mb-1 truncate group-hover:text-green-500 transition-colors">
                                {getLocalizedName(country, 'name')}
                              </p>
                              <p className="text-sm text-foreground/60">
                                {countryLocationsCount} {t('country.locations')}
                              </p>
                            </div>

                            {/* Country Rating */}
                            {country.cached_rating && (
                              <div className="flex items-center gap-1.5 flex-shrink-0 px-3 py-1.5 rounded-lg bg-green-500/10">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                <span className="text-sm font-bold text-foreground">
                                  {country.cached_rating.toFixed(1)}
                                </span>
                              </div>
                            )}
                          </Link>
                        );
                      }
                    })}
                  </div>
                )}

                {/* No Results Message */}
                {isHeroSearchOpen && heroSearchQuery && heroSearchResults.length === 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 backdrop-blur-xl bg-white/95 dark:bg-black/95 border border-white/50 dark:border-white/20 rounded-xl shadow-2xl p-6 text-center z-[100]">
                    <p className="text-foreground/60">
                      "{heroSearchQuery}" - {t('hero.notFound')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats - Compact Mobile */}
            <div className="grid grid-cols-3 gap-2 lg:gap-4 max-w-3xl mx-auto">
              {/* Total Locations */}
              <div className="p-3 lg:p-6 rounded-xl backdrop-blur-lg bg-white/70 dark:bg-black/40 border border-white/50 dark:border-white/20 shadow-xl transition-all hover:bg-white/80 dark:hover:bg-black/50">
                <div className="flex flex-col lg:flex-row items-center justify-center gap-1 lg:gap-3 mb-1 lg:mb-2">
                  <MapPin className="w-4 h-4 lg:w-6 lg:h-6 text-blue-500" />
                  <p className="text-xl lg:text-3xl font-bold text-foreground">{totalLocations}</p>
                </div>
                <p className="text-[10px] lg:text-sm text-foreground/80 font-medium">{t('stats.location')}</p>
              </div>

              {/* Total Countries */}
              <div className="p-3 lg:p-6 rounded-xl backdrop-blur-lg bg-white/70 dark:bg-black/40 border border-white/50 dark:border-white/20 shadow-xl transition-all hover:bg-white/80 dark:hover:bg-black/50">
                <div className="flex flex-col lg:flex-row items-center justify-center gap-1 lg:gap-3 mb-1 lg:mb-2">
                  <Globe className="w-4 h-4 lg:w-6 lg:h-6 text-green-500" />
                  <p className="text-xl lg:text-3xl font-bold text-foreground">{totalCountries}</p>
                </div>
                <p className="text-[10px] lg:text-sm text-foreground/80 font-medium">{t('stats.country')}</p>
              </div>

              {/* Average Rating */}
              <div className="p-3 lg:p-6 rounded-xl backdrop-blur-lg bg-white/70 dark:bg-black/40 border border-white/50 dark:border-white/20 shadow-xl transition-all hover:bg-white/80 dark:hover:bg-black/50">
                <div className="flex flex-col lg:flex-row items-center justify-center gap-1 lg:gap-3 mb-1 lg:mb-2">
                  <Star className="w-4 h-4 lg:w-6 lg:h-6 text-yellow-500 fill-yellow-500" />
                  <p className="text-xl lg:text-3xl font-bold text-foreground">{avgRating > 0 ? avgRating.toFixed(1) : '—'}</p>
                </div>
                <p className="text-[10px] lg:text-sm text-foreground/80 font-medium">{t('stats.rating')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Filters Bar - With backdrop blur contained in max-width */}
      <div className="sticky top-[49px] lg:top-[65px] z-40 border-b border-foreground/10 -mt-4">
        <div className="max-w-[1280px] mx-auto px-3 lg:px-4 py-2 lg:py-3 backdrop-blur-xl bg-white/80 dark:bg-black/80 rounded-b-xl">
          <div className="flex flex-col lg:flex-row gap-2 lg:gap-4 items-start lg:items-center justify-between">
            
            {/* Left: Filters */}
            <div className="flex items-center gap-2 lg:gap-3 flex-wrap w-full lg:w-auto">
              
              {/* Country Filter */}
              <div className="relative flex-1 lg:flex-initial">
                <button
                  onClick={() => {
                    setIsFilterOpen(!isFilterOpen);
                    setIsSortOpen(false);
                  }}
                  className="flex items-center justify-between gap-2 px-3 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm rounded-lg backdrop-blur-lg bg-white/70 dark:bg-black/40 border border-white/50 dark:border-white/20 hover:bg-white/80 dark:hover:bg-black/50 transition-all text-foreground shadow-lg w-full lg:w-auto"
                >
                  <Filter className="w-3.5 h-3.5 lg:w-4 lg:h-4 flex-shrink-0" />
                  <span className="truncate">
                    {selectedCountry === 'all' 
                      ? t('filters.allCountries') 
                      : getLocalizedName(countries.find(c => c.id === selectedCountry), 'name')}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 lg:w-4 lg:h-4 flex-shrink-0 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                </button>

                {isFilterOpen && (
                  <div className="absolute top-full left-0 right-0 lg:right-auto mt-2 lg:w-64 backdrop-blur-xl bg-white/95 dark:bg-black/95 border border-white/50 dark:border-white/20 rounded-xl shadow-2xl overflow-hidden z-50 max-h-[60vh] overflow-y-auto">
                    <button
                      onClick={() => {
                        setSelectedCountry('all');
                        setIsFilterOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-sm text-left text-foreground hover:bg-black/10 dark:hover:bg-white/10 transition-all ${
                        selectedCountry === 'all' ? 'bg-blue-500/10 font-semibold' : ''
                      }`}
                    >
                      {t('filters.allCountries')}
                    </button>
                    {countries.map((country) => (
                      <button
                        key={country.id}
                        onClick={() => {
                          setSelectedCountry(country.id);
                          setIsFilterOpen(false);
                        }}
                        className={`w-full px-4 py-3 text-sm text-left text-foreground hover:bg-black/10 dark:hover:bg-white/10 transition-all ${
                          selectedCountry === country.id ? 'bg-blue-500/10 font-semibold' : ''
                        }`}
                      >
                        {getLocalizedName(country, 'name')}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Search Input - Filter Locations */}
              <div className="relative flex-1 lg:flex-initial lg:min-w-[280px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 lg:w-4 lg:h-4 text-foreground/60" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('filters.searchPlaceholder')}
                  className="w-full pl-9 lg:pl-10 pr-9 lg:pr-10 py-1.5 lg:py-2 text-xs lg:text-sm rounded-lg backdrop-blur-lg bg-white/70 dark:bg-black/40 border border-white/50 dark:border-white/20 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all text-foreground placeholder:text-foreground/50 shadow-lg"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-foreground/10 transition-colors"
                  >
                    <X className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-foreground/60" />
                  </button>
                )}
              </div>

              {/* Sort Dropdown */}
              <div className="relative flex-1 lg:flex-initial">
                <button
                  onClick={() => {
                    setIsSortOpen(!isSortOpen);
                    setIsFilterOpen(false);
                  }}
                  className="flex items-center justify-between gap-2 px-3 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm rounded-lg backdrop-blur-lg bg-white/70 dark:bg-black/40 border border-white/50 dark:border-white/20 hover:bg-white/80 dark:hover:bg-black/50 transition-all text-foreground shadow-lg w-full lg:w-auto"
                >
                  <TrendingUp className="w-3.5 h-3.5 lg:w-4 lg:h-4 flex-shrink-0" />
                  <span className="truncate">
                    {sortBy === 'rating' ? t('filters.ratingShort') : sortBy === 'name' ? t('filters.nameShort') : t('filters.altitudeShort')}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 lg:w-4 lg:h-4 flex-shrink-0 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
                </button>

                {isSortOpen && (
                  <div className="absolute top-full left-0 right-0 lg:right-auto mt-2 lg:w-48 backdrop-blur-xl bg-white/95 dark:bg-black/95 border border-white/50 dark:border-white/20 rounded-xl shadow-2xl overflow-hidden z-50">
                    <button
                      onClick={() => {
                        setSortBy('rating');
                        setIsSortOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-sm text-left text-foreground hover:bg-black/10 dark:hover:bg-white/10 transition-all ${
                        sortBy === 'rating' ? 'bg-blue-500/10 font-semibold' : ''
                      }`}
                    >
                      {t('filters.sortByRating')}
                    </button>
                    <button
                      onClick={() => {
                        setSortBy('name');
                        setIsSortOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-sm text-left text-foreground hover:bg-black/10 dark:hover:bg-white/10 transition-all ${
                        sortBy === 'name' ? 'bg-blue-500/10 font-semibold' : ''
                      }`}
                    >
                      {t('filters.sortByName')}
                    </button>
                    <button
                      onClick={() => {
                        setSortBy('altitude');
                        setIsSortOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-sm text-left text-foreground hover:bg-black/10 dark:hover:bg-white/10 transition-all ${
                        sortBy === 'altitude' ? 'bg-blue-500/10 font-semibold' : ''
                      }`}
                    >
                      {t('filters.sortByAltitude')}
                    </button>
                  </div>
                )}
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 px-3 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm rounded-lg backdrop-blur-lg bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 hover:bg-red-500/20 dark:hover:bg-red-500/30 transition-all text-red-600 dark:text-red-400 shadow-lg"
                >
                  <X className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                  <span className="hidden lg:inline">{t('filters.clearFilters')}</span>
                  <span className="lg:hidden">{t('filters.clear')}</span>
                </button>
              )}
            </div>

            {/* Right: View Mode */}
            <div className="flex items-center justify-between gap-2 lg:gap-3 w-full lg:w-auto">
              {/* Results Count - Mobile First */}
              <p className="text-[10px] lg:text-xs text-foreground/70 order-1 lg:order-2">
                {t('filters.resultsFound')} <span className="font-semibold text-foreground">{sortedLocations.length}</span>
              </p>
              
              {/* View Mode Toggle */}
              <div className="flex items-center gap-0.5 lg:gap-1 backdrop-blur-lg bg-white/70 dark:bg-black/40 border border-white/50 dark:border-white/20 rounded-lg p-0.5 lg:p-1 shadow-lg order-2 lg:order-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 lg:p-2 rounded transition-all ${
                    viewMode === 'grid' 
                      ? 'bg-white/90 dark:bg-black/90 text-foreground shadow-md' 
                      : 'text-foreground/60 hover:text-foreground'
                  }`}
                  title="Grid View"
                >
                  <Grid className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 lg:p-2 rounded transition-all ${
                    viewMode === 'list' 
                      ? 'bg-white/90 dark:bg-black/90 text-foreground shadow-md' 
                      : 'text-foreground/60 hover:text-foreground'
                  }`}
                  title="List View"
                >
                  <List className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Filter Badges */}
          {hasActiveFilters && (
            <div className="flex items-center gap-1.5 lg:gap-2 mt-2 lg:mt-3 flex-wrap">
              <span className="text-[10px] lg:text-xs text-foreground/70">{t('filters.activeFilters')}</span>
              
              {selectedCountry !== 'all' && (
                <span className="flex items-center gap-1 lg:gap-1.5 px-2 lg:px-3 py-0.5 lg:py-1 text-[10px] lg:text-xs rounded-full backdrop-blur-lg bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400">
                  <span className="truncate max-w-[120px]">{getLocalizedName(countries.find(c => c.id === selectedCountry), 'name')}</span>
                  <button
                    onClick={() => setSelectedCountry('all')}
                    className="hover:bg-blue-500/20 rounded-full p-0.5 transition-colors flex-shrink-0"
                  >
                    <X className="w-2.5 h-2.5 lg:w-3 lg:h-3" />
                  </button>
                </span>
              )}
              
              {searchQuery && (
                <span className="flex items-center gap-1 lg:gap-1.5 px-2 lg:px-3 py-0.5 lg:py-1 text-[10px] lg:text-xs rounded-full backdrop-blur-lg bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400">
                  <span className="truncate max-w-[100px]">{searchQuery}</span>
                  <button
                    onClick={clearSearch}
                    className="hover:bg-blue-500/20 rounded-full p-0.5 transition-colors flex-shrink-0"
                  >
                    <X className="w-2.5 h-2.5 lg:w-3 lg:h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div ref={contentRef} className="max-w-[1280px] mx-auto px-4 py-8 lg:py-12">
        {groupedLocations.length === 0 ? (
          // Empty State
          <div className="text-center py-16 lg:py-24">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full backdrop-blur-lg bg-white/70 dark:bg-black/40 border border-white/50 dark:border-white/20 mb-6 shadow-xl">
              <MapPin className="w-10 h-10 text-foreground/40" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">{t('empty.title')}</h3>
            <p className="text-foreground/70 mb-6">{t('empty.description')}</p>
            <button
              onClick={clearFilters}
              className="px-6 py-3 rounded-lg backdrop-blur-lg bg-white/70 dark:bg-black/40 border border-white/50 dark:border-white/20 hover:bg-white/80 dark:hover:bg-black/50 transition-all text-foreground font-medium shadow-xl"
            >
              {t('empty.viewAll')}
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            {groupedLocations.map(({ country, locations: countryLocations }) => {
              const isCollapsed = collapsedCountries.has(country.id);
              
              return (
                <div key={country.id} className="space-y-6">
                  {/* Country Header - Enhanced Glass - Mobile Optimized */}
                  <div className="rounded-xl backdrop-blur-lg bg-white/70 dark:bg-black/40 border border-white/50 dark:border-white/20 shadow-xl p-3 lg:p-6">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
                      {/* Top Row: Collapse Button + Country Info */}
                      <div className="flex items-center gap-2 lg:gap-4 flex-1">
                        <button
                          onClick={() => toggleCountry(country.id)}
                          className="p-1.5 lg:p-2 rounded-lg hover:bg-white/50 dark:hover:bg-black/50 transition-all flex-shrink-0"
                        >
                          {isCollapsed ? (
                            <ChevronDown className="w-4 h-4 lg:w-5 lg:h-5 text-foreground" />
                          ) : (
                            <ChevronUp className="w-4 h-4 lg:w-5 lg:h-5 text-foreground" />
                          )}
                        </button>
                        
                        <div className="flex-1 min-w-0">
                          <h2 className="text-base lg:text-2xl font-bold text-foreground mb-1 truncate">
                            {getLocalizedName(country, 'name')}
                          </h2>
                          
                          <div className="flex items-center gap-2 lg:gap-3 flex-wrap">
                            <span className="text-xs lg:text-sm text-foreground/70 whitespace-nowrap">
                              {countryLocations.length} {t('country.locations')}
                            </span>
                            
                            {country.cached_rating && country.cached_rating > 0 && (
                              <div className="flex items-center gap-1 lg:gap-1.5 px-2 lg:px-3 py-0.5 lg:py-1 rounded-full backdrop-blur-md bg-yellow-500/10 border border-yellow-500/20">
                                <Star className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-yellow-500 fill-yellow-500" />
                                <span className="text-[11px] lg:text-xs font-semibold text-foreground">
                                  {country.cached_rating.toFixed(1)}
                                </span>
                                <span className="text-[9px] lg:text-[10px] text-foreground/60">
                                  ({country.cached_rating_count})
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Bottom Row (Mobile) / Right Side (Desktop): Country Page Link */}
                      <Link
                        href={`/${locale}/locations/${getLocalizedSlug(country)}`}
                        className="px-3 py-1.5 lg:px-4 lg:py-2 text-xs lg:text-sm rounded-lg backdrop-blur-lg bg-white/70 dark:bg-black/40 border border-white/50 dark:border-white/20 hover:bg-white/80 dark:hover:bg-black/50 transition-all text-foreground font-medium shadow-lg text-center lg:whitespace-nowrap"
                      >
                        {t('country.countryPage')}
                      </Link>
                    </div>
                  </div>

                  {/* Locations Grid/List */}
                  {!isCollapsed && (
                    viewMode === 'grid' ? (
                      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
                        {countryLocations.map((location, index) => {
                          const countrySlug = getLocalizedSlug(country);
                          const locationSlug = getLocalizedSlug(location);
                          const locationUrl = `/${locale}/locations/${countrySlug}/${locationSlug}`;
                          
                          return (
                            <div
                              key={location.id}
                              className="group rounded-xl overflow-hidden backdrop-blur-lg bg-white/70 dark:bg-black/40 border border-white/50 dark:border-white/20 hover:bg-white/80 dark:hover:bg-black/50 hover:shadow-2xl transition-all duration-300 shadow-xl relative"
                              style={{
                                animation: `fadeInUp 0.5s ease-out ${index * 0.05}s both`
                              }}
                            >
                              {/* Image */}
                              <div className="relative aspect-video overflow-hidden bg-foreground/5">
                                {location.hero_image_url ? (
                                  <Image
                                    src={location.hero_image_url}
                                    alt={getLocalizedName(location, 'name')}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                  />
                                ) : (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <MapPin className="w-12 h-12 text-foreground/20" />
                                  </div>
                                )}
                                
                                {/* Difficulty Badge */}
                                {location.difficulty_level && (
                                  <div className="absolute top-2 right-2 lg:top-3 lg:right-3">
                                    <span className={`px-2 py-0.5 lg:px-2.5 lg:py-1 text-[9px] lg:text-[10px] font-semibold rounded-full backdrop-blur-md border ${getDifficultyColor(location.difficulty_level)}`}>
                                      {getDifficultyLabel(location.difficulty_level)}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Content - Compact Mobile */}
                              <div className="p-3 lg:p-4">
                                <h3 className="text-sm lg:text-base font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1.5 lg:mb-2 line-clamp-1">
                                  {getLocalizedName(location, 'name')}
                                </h3>
                                
                                {/* Rating */}
                                {location.cached_rating && location.cached_rating > 0 && (
                                  <div className="flex items-center gap-0.5 lg:gap-1 mb-2 lg:mb-3">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`w-3 h-3 lg:w-3.5 lg:h-3.5 ${
                                          star <= Math.round(location.cached_rating!)
                                            ? 'text-yellow-500 fill-yellow-500'
                                            : 'text-foreground/20 fill-foreground/20'
                                        }`}
                                      />
                                    ))}
                                    <span className="text-[11px] lg:text-xs font-semibold text-foreground ml-1">
                                      {location.cached_rating.toFixed(1)}
                                    </span>
                                    <span className="text-[9px] lg:text-[10px] text-foreground/60">
                                      ({location.cached_rating_count})
                                    </span>
                                  </div>
                                )}
                                
                                {/* Info Tags */}
                                <div className="space-y-1 lg:space-y-1.5">
                                  {location.altitude && (
                                    <div className="flex items-center gap-1 lg:gap-1.5 text-[11px] lg:text-xs text-foreground/70">
                                      <svg className="w-3 h-3 lg:w-3.5 lg:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                      </svg>
                                      <span>{location.altitude}მ</span>
                                    </div>
                                  )}
                                  
                                  {location.best_season_start && location.best_season_end && (
                                    <div className="flex items-center gap-1 lg:gap-1.5 text-[11px] lg:text-xs text-foreground/70">
                                      <svg className="w-3 h-3 lg:w-3.5 lg:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      <span>
                                        {getMonthName(location.best_season_start)} - {getMonthName(location.best_season_end)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Booking Button - Clicks go to flight types section */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.location.href = `${locationUrl}#flight-types-section`;
                                  }}
                                  className="w-full mt-2 lg:mt-3 px-3 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm font-semibold rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] z-10 relative"
                                >
                                  {t('location.bookNow')}
                                </button>
                              </div>
                              
                              {/* Clickable overlay for card - goes to location page */}
                              <Link
                                href={locationUrl}
                                className="absolute inset-0 z-0"
                                aria-label={getLocalizedName(location, 'name')}
                              />
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      // List View
                      <div className="space-y-2">
                        {countryLocations.map((location, index) => {
                          const countrySlug = getLocalizedSlug(country);
                          const locationSlug = getLocalizedSlug(location);
                          const locationUrl = `/${locale}/locations/${countrySlug}/${locationSlug}`;
                          
                          return (
                            <div
                              key={location.id}
                              className="group flex items-center gap-3 lg:gap-4 p-2 lg:p-3 rounded-lg lg:rounded-xl backdrop-blur-lg bg-white/70 dark:bg-black/40 border border-white/50 dark:border-white/20 hover:bg-white/80 dark:hover:bg-black/50 hover:shadow-xl transition-all duration-300 shadow-lg relative"
                              style={{
                                animation: `fadeInUp 0.5s ease-out ${index * 0.03}s both`
                              }}
                            >
                              {/* Thumbnail */}
                              <div className="relative w-16 h-16 lg:w-20 lg:h-20 rounded-md lg:rounded-lg overflow-hidden bg-foreground/5 flex-shrink-0">
                                {location.hero_image_url ? (
                                  <Image
                                    src={location.hero_image_url}
                                    alt={getLocalizedName(location, 'name')}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                    sizes="96px"
                                  />
                                ) : (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <MapPin className="w-6 h-6 lg:w-8 lg:h-8 text-foreground/20" />
                                  </div>
                                )}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm lg:text-base font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1 truncate">
                                  {getLocalizedName(location, 'name')}
                                </h3>
                                
                                {/* Rating */}
                                {location.cached_rating && location.cached_rating > 0 && (
                                  <div className="flex items-center gap-0.5 lg:gap-1 mb-1.5 lg:mb-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`w-2.5 h-2.5 lg:w-3 lg:h-3 ${
                                          star <= Math.round(location.cached_rating!)
                                            ? 'text-yellow-500 fill-yellow-500'
                                            : 'text-foreground/20 fill-foreground/20'
                                        }`}
                                      />
                                    ))}
                                    <span className="text-[11px] lg:text-xs font-semibold text-foreground ml-0.5 lg:ml-1">
                                      {location.cached_rating.toFixed(1)}
                                    </span>
                                    <span className="text-[9px] lg:text-[10px] text-foreground/60">
                                      ({location.cached_rating_count})
                                    </span>
                                  </div>
                                )}
                                
                                {/* Details */}
                                <div className="flex items-center gap-2 lg:gap-3 flex-wrap text-[10px] lg:text-xs text-foreground/70">
                                  {location.altitude && (
                                    <span className="flex items-center gap-0.5 lg:gap-1">
                                      <svg className="w-2.5 h-2.5 lg:w-3 lg:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                      </svg>
                                      {location.altitude}მ
                                    </span>
                                  )}
                                  
                                  {location.best_season_start && location.best_season_end && (
                                    <span className="flex items-center gap-0.5 lg:gap-1">
                                      <svg className="w-2.5 h-2.5 lg:w-3 lg:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      {getMonthName(location.best_season_start)} - {getMonthName(location.best_season_end)}
                                    </span>
                                  )}
                                  
                                  {location.difficulty_level && (
                                    <span className={`px-1.5 lg:px-2 py-0.5 rounded-full text-[9px] lg:text-[10px] font-semibold border ${getDifficultyColor(location.difficulty_level)}`}>
                                      {getDifficultyLabel(location.difficulty_level)}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Booking Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = `${locationUrl}#flight-types-section`;
                                }}
                                className="px-3 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm font-semibold rounded-md lg:rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white shadow-md hover:shadow-lg transition-all duration-300 flex-shrink-0 z-10 relative"
                              >
                                {t('location.book')}
                              </button>

                              {/* Clickable overlay for card */}
                              <Link
                                href={locationUrl}
                                className="absolute inset-0 z-0"
                                aria-label={getLocalizedName(location, 'name')}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Keyframe Animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
