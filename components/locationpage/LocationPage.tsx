'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/i18n/hooks/useTranslation';
import RatingDisplay from '@/components/rating/RatingDisplay';
import RatingInput from '@/components/rating/RatingInput';
import RatingModal from '@/components/rating/RatingModal';
import CommentsList from '@/components/comments/CommentsList';
import { 
  MapPin, 
  Calendar, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  Play, 
  X, 
  ChevronLeft, 
  ChevronRight,
  ExternalLink,
  Wind,
  Clock,
  CheckCircle2,
  Image as ImageIcon,
  Video
} from 'lucide-react';

// --- Interfaces ---

interface Location {
  id: string;
  country_id: string;
  created_at: string;
  updated_at: string;
  // Localized Names
  name_ka: string;
  name_en: string;
  name_ru: string;
  name_ar?: string;
  name_de?: string;
  name_tr?: string;
  // Localized Slugs
  slug_ka: string;
  slug_en: string;
  slug_ru: string;
  slug_ar?: string;
  slug_de?: string;
  slug_tr?: string;
  // SEO & OG
  og_image_url?: string;
  map_iframe_url?: string;
  // Ratings
  cached_rating?: number;
  cached_rating_count?: number;
}

interface LocationPageData {
  id: string;
  location_id: string;
  country_id: string;
  content?: any;
  is_active: boolean;
}

interface FlightType {
  shared_id?: string;
  name: string;
  description: string;
  features: string[];
  duration?: string;
  price_gel?: number;
  price_usd?: number;
  price_eur?: number;
  cached_rating?: number;
  cached_rating_count?: number;
}

interface SharedFlightType {
  id: string;
  price_gel: number;
  price_usd: number;
  price_eur: number;
}

interface LocationPageProps {
  countrySlug: string;
  locationSlug: string;
  locale: string;
  // ✅ Server-side fetched data for SSR/SEO
  initialData?: {
    location: Location | null;
    locationPage: LocationPageData | null;
  };
}

// --- Components ---

const GlassCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`group relative backdrop-blur-xl rounded-xl shadow-xl shadow-black/10 dark:shadow-black/30 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-black/15 dark:hover:shadow-black/50 hover:-translate-y-1 text-gray-800 dark:text-white border border-[#4697D2]/30 dark:border-white/10 bg-[rgba(70,151,210,0.15)] dark:bg-black/40 ${className}`}>
    {/* Gradient Border - hidden in dark mode */}
    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#4697D2]/30 via-[#4697D2]/15 to-white/10 dark:from-transparent dark:via-transparent dark:to-transparent p-[1px]">
      <div className="absolute inset-[1px] rounded-xl bg-[rgba(70,151,210,0.1)] dark:bg-black/50 backdrop-blur-xl" />
    </div>
    {/* Top Highlight Line */}
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    {/* Hover Glow */}
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10" />
    {/* Content */}
    <div className="relative z-10">
      {children}
    </div>
  </div>
);

const SectionTitle = ({ icon: Icon, title }: { icon: any; title: string }) => (
  <div className="group inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-xl backdrop-blur-xl bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 shadow-xl shadow-black/10 transition-all duration-300 hover:shadow-2xl">
    {/* Top highlight */}
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 dark:via-white/20 to-transparent" />
    <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#4697D2]/30 to-[#4697D2]/10 dark:from-white/10 dark:to-white/5 dark:bg-white/10">
      <Icon className="w-5 h-5 text-[#4697D2] dark:text-white drop-shadow-sm" />
    </div>
    <h2 className="text-lg font-semibold tracking-tight text-gray-800 dark:text-white drop-shadow-sm">{title}</h2>
  </div>
);

export default function LocationPage({ countrySlug, locationSlug, locale, initialData }: LocationPageProps) {
  const { t } = useTranslation('locationpage');
  // ✅ Use initialData for SSR if available, otherwise null for client fetch
  const [location, setLocation] = useState<Location | null>(initialData?.location ?? null);
  const [locationPage, setLocationPage] = useState<LocationPageData | null>(initialData?.locationPage ?? null);
  const [isLoading, setIsLoading] = useState(!initialData?.location); // Not loading if we have initialData
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [userRating, setUserRating] = useState<number | undefined>(undefined);
  const [showRatingInput, setShowRatingInput] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [flightTypeRatings, setFlightTypeRatings] = useState<{ [key: string]: { userRating: number | null; showInput: boolean; avgRating: number; count: number } }>({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Hero visibility state
  const [heroVisible, setHeroVisible] = useState(true);
  const heroRef = useRef<HTMLDivElement>(null);

  // Helper to get localized string
  const getLocalizedField = (obj: any, field: string, loc: string) => {
    const suffix = loc || 'en';
    return obj?.[`${field}_${suffix}`] || obj?.[`${field}_en`] || '';
  };

  const handleRatingChange = async (newRating: number | null) => {
    setUserRating(newRating || undefined);
    
    // Refetch location to get updated cached rating
    if (location) {
      const supabase = createClient();
      const { data: updatedLocation } = await supabase
        .from('locations')
        .select('cached_rating, cached_rating_count')
        .eq('id', location.id)
        .single();
      
      if (updatedLocation) {
        setLocation({ ...location, ...updatedLocation });
      }
    }
  };

  const handleFlightTypeRatingChange = async (sharedId: string, newRating: number | null) => {
    const supabase = createClient();
    
    // Fetch updated aggregated ratings for this flight type
    const { data: flightRatings } = await supabase
      .from('ratings')
      .select('rating')
      .eq('ratable_type', 'flight_type')
      .eq('ratable_id', sharedId);

    const avgRating = flightRatings && flightRatings.length > 0
      ? flightRatings.reduce((sum: number, r: any) => sum + r.rating, 0) / flightRatings.length
      : 0;

    setFlightTypeRatings(prev => ({
      ...prev,
      [sharedId]: {
        ...prev[sharedId],
        userRating: newRating,
        avgRating: Number(avgRating.toFixed(1)),
        count: flightRatings?.length || 0
      }
    }));
  };

  useEffect(() => {
    const fetchLocationData = async () => {
      const supabase = createClient();

      // ✅ If we have initialData, use it - skip location/locationPage fetch
      // This enables SSR - data is already loaded server-side
      let currentLocation = initialData?.location || location;
      let currentLocationPage = initialData?.locationPage || locationPage;

      // Only fetch if initialData is not provided (client-side navigation)
      if (!initialData?.location) {
        setIsLoading(true);
        try {
          const slugField = `slug_${locale}`;
          const { data: locationData, error: locationError } = await supabase
            .from('locations')
            .select('*')
            .eq(slugField, locationSlug)
            .single();

          if (locationError) throw locationError;
          setLocation(locationData);
          currentLocation = locationData;

          const { data: pageData, error: pageError } = await supabase
            .from('location_pages')
            .select('*')
            .eq('location_id', locationData.id)
            .eq('is_active', true)
            .single();

          if (pageError && pageError.code !== 'PGRST116') throw pageError;
          setLocationPage(pageData);
          currentLocationPage = pageData;
        } catch (error) {
          console.error('Error fetching location data:', error);
          setIsLoading(false);
          return;
        }
      }

      // ✅ Always fetch ratings (user-specific data, can't be SSR'd)
      try {
        // Fetch flight type ratings for ALL users (including non-authenticated)
        if (currentLocationPage?.content?.[locale]?.flight_types) {
          const flightTypesData: FlightType[] = currentLocationPage.content[locale].flight_types;
          const sharedIds = flightTypesData.map((ft: FlightType) => ft.shared_id).filter(Boolean) as string[];
          
          if (sharedIds.length > 0) {
            // Fetch all ratings for these flight types
            const { data: flightRatings } = await supabase
              .from('ratings')
              .select('ratable_id, rating, user_id')
              .eq('ratable_type', 'flight_type')
              .in('ratable_id', sharedIds);

            const ratingsMap: { [key: string]: { userRating: number | null; showInput: boolean; avgRating: number; count: number } } = {};
            
            // Get current user (may be null for non-authenticated)
            const { data: { user } } = await supabase.auth.getUser();
            
            sharedIds.forEach((id: string) => {
              const typeRatings = flightRatings?.filter((r: any) => r.ratable_id === id) || [];
              const userRatingData = user ? typeRatings.find((r: any) => r.user_id === user.id) : null;
              const avgRating = typeRatings.length > 0 
                ? typeRatings.reduce((sum: number, r: any) => sum + r.rating, 0) / typeRatings.length 
                : 0;
              
              ratingsMap[id] = {
                userRating: userRatingData?.rating || null,
                showInput: false,
                avgRating: Number(avgRating.toFixed(1)),
                count: typeRatings.length
              };
            });
            
            setFlightTypeRatings(ratingsMap);
          }
        }

        // Fetch user's own location rating if authenticated
        const { data: { user } } = await supabase.auth.getUser();
        setIsAuthenticated(!!user);
        
        if (user && currentLocation) {
          const { data: ratingData } = await supabase
            .from('ratings')
            .select('rating')
            .eq('ratable_type', 'location')
            .eq('ratable_id', String(currentLocation.id))
            .eq('user_id', user.id)
            .single();
          
          if (ratingData) {
            setUserRating(ratingData.rating);
          }
        }
      } catch (error) {
        console.error('Error fetching ratings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocationData();
  }, [countrySlug, locationSlug, locale, initialData]);

  // Handle hash navigation for auto-scroll
  useEffect(() => {
    // Check if there's a hash in the URL and location data is loaded
    if (window.location.hash && location && locationPage) {
      // Delay to ensure the page is fully rendered and all content is loaded
      setTimeout(() => {
        const id = window.location.hash.substring(1);
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
    }
  }, [location, locationPage]);

  // Scroll tracking for hero visibility
  useEffect(() => {
    const THRESHOLD = 300; // When to start hiding hero
    
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      
      // Once scroll passes threshold, commit to hiding hero
      if (currentScroll > THRESHOLD && heroVisible) {
        setHeroVisible(false);
      } else if (currentScroll <= 50 && !heroVisible) {
        // Only show hero again when scrolled back to top
        setHeroVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [heroVisible]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (!location || !locationPage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-zinc-50 dark:bg-black">
        <h2 className="text-xl font-medium text-foreground/80">{t('error.notFound')}</h2>
        <Link 
          href={`/${locale}/locations/${countrySlug}`}
          className="px-4 py-2 text-sm font-medium backdrop-blur-md bg-white/20 dark:bg-black/20 hover:bg-white/30 dark:hover:bg-black/30 border border-white/30 dark:border-white/20 rounded-full transition-all shadow-xl"
        >
          {t('error.backButton')}
        </Link>
      </div>
    );
  }

  // Data Extraction
  const locationName = getLocalizedField(location, 'name', locale);
  const contentData = locationPage.content?.[locale] || locationPage.content?.en || {};
  
  const heroImageUrl = locationPage.content?.shared_images?.hero_image?.url || location.og_image_url || '/images/default-hero.jpg';
  const heroImageAlt = locationPage.content?.shared_images?.hero_image?.[`alt_${locale}`] || locationName;
  
  const {
    h1_tag: h1Tag,
    p_tag: pTag,
    h2_history: h2History,
    history_text: historyText,
    h3_flight_types: h3FlightTypes,
    gallery_description: galleryDescription,
  } = contentData;

  const flightTypes: FlightType[] = contentData.flight_types || [];

  const gallery = locationPage.content?.shared_images?.gallery || [];
  const videos = locationPage.content?.shared_videos || [];
  const sharedFlightTypes: SharedFlightType[] = locationPage.content?.shared_flight_types || [];

  return (
    <div className="min-h-screen relative selection:bg-blue-500/30">
      {/* Full Screen Hero - Using Global Background */}
      <div 
        ref={heroRef}
        className="relative h-[85vh] lg:h-[calc(100vh+5rem)] w-full overflow-hidden -mt-16 lg:-mt-20"
        style={{
          opacity: heroVisible ? 1 : 0,
          transform: heroVisible ? 'translateY(0) scale(1)' : 'translateY(-30px) scale(0.98)',
          transition: 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: heroVisible ? 'auto' : 'none',
        }}
      >
        {/* Hero Background Image */}
        <div className="absolute inset-0">
          <Image 
            src={heroImageUrl} 
            alt={heroImageAlt} 
            fill 
            priority 
            unoptimized 
            className="object-cover"
            sizes="100vw" 
          />
        </div>
        
        {/* Light Mode Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-white/20 to-transparent dark:hidden" />
        
        {/* Dark Mode Overlay */}
        <div className="absolute inset-0 hidden dark:block bg-black/60" />
        
        {/* Hero Content - Info-Rich Layout */}
        <div 
          className="absolute inset-0 flex items-center pb-16 lg:items-center lg:pb-0 lg:pt-0"
        >
          <div className="w-full max-w-[1280px] mx-auto px-4">
            {/* Top Bar: Location Badge + Rating */}
            <div className="flex flex-wrap items-center gap-2 lg:gap-3 mb-3 lg:mb-4">
              {/* Location Badge */}
              <div className="inline-flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3 py-1 lg:py-1.5 rounded-full backdrop-blur-md bg-gradient-to-r from-[rgba(70,151,210,0.4)] to-[rgba(70,151,210,0.3)] dark:from-transparent dark:to-transparent dark:bg-black/40 border border-[#4697D2]/40 dark:border-white/10 shadow-lg shadow-[#4697D2]/10 dark:shadow-black/30">
                <MapPin className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-[#CAFA00]" />
                <span className="text-xs lg:text-sm font-medium text-[#1a1a1a] dark:text-white">{locationName}</span>
              </div>
              
              {/* Rating Pill with 5 Stars */}
              <div className="inline-flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3 py-1 lg:py-1.5 rounded-full backdrop-blur-md bg-gradient-to-r from-[rgba(70,151,210,0.4)] to-[rgba(70,151,210,0.3)] dark:from-transparent dark:to-transparent dark:bg-black/40 border border-[#4697D2]/40 dark:border-white/10 shadow-lg shadow-[#4697D2]/10 dark:shadow-black/30">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const rating = location.cached_rating || 0;
                    const filled = star <= Math.floor(rating);
                    const partial = star === Math.ceil(rating) && rating % 1 !== 0;
                    const fillPercent = partial ? (rating % 1) * 100 : 0;
                    
                    return (
                      <div key={star} className="relative">
                        {/* Empty star background */}
                        <svg className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-white/30" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {/* Filled star overlay */}
                        <div 
                          className="absolute inset-0 overflow-hidden"
                          style={{ width: filled ? '100%' : partial ? `${fillPercent}%` : '0%' }}
                        >
                          <svg className="w-3 h-3 lg:w-3.5 lg:h-3.5" style={{ color: '#ffc107' }} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <span className="text-xs lg:text-sm font-semibold text-[#1a1a1a] dark:text-white">{location.cached_rating?.toFixed(1) || '0.0'}</span>
                <span className="text-[10px] lg:text-xs text-[#2d2d2d]/70 dark:text-white/70">({location.cached_rating_count || 0})</span>
              </div>
            </div>
            
            {/* Main Title - Using h2 because h1 is in page.tsx for SEO */}
            <h2 className="text-xl lg:text-4xl font-bold text-[#1a1a1a] dark:text-white mb-2 lg:mb-3 drop-shadow-sm dark:drop-shadow-2xl max-w-4xl leading-tight">
              {h1Tag || locationName}
            </h2>
            
            {/* Subtitle/Description - Hidden on mobile */}
            {pTag && (
              <p className="hidden lg:block text-base text-[#2d2d2d]/90 dark:text-white/85 max-w-2xl leading-relaxed drop-shadow-sm dark:drop-shadow-lg mb-6">
                {pTag}
              </p>
            )}
            
            {/* Info Stats Row - Simplified on mobile */}
            <div className="flex flex-wrap gap-2 lg:gap-4 mb-4 lg:mb-6">
              {/* Best Season */}
              <div className="hidden lg:flex items-center gap-2 text-[#2d2d2d]/90 dark:text-white/90">
                <Calendar className="w-4 h-4 text-[#4697D2] dark:text-blue-300" />
                <span className="text-sm">{t('quickInfo.bestSeason')}: <strong className="text-[#1a1a1a] dark:text-white">{t('quickInfo.yearRound')}</strong></span>
              </div>
              
              {/* Photos Count - Show on mobile */}
              {gallery.length > 0 && (
                <div className="flex items-center gap-1.5 lg:gap-2 text-[#2d2d2d]/90 dark:text-white/90">
                  <ImageIcon className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-purple-500 dark:text-purple-300" />
                  <span className="text-xs lg:text-sm"><strong className="text-[#1a1a1a] dark:text-white">{gallery.length}</strong> {t('sidebar.photos')}</span>
                </div>
              )}
              
              {/* Packages Count - Show on mobile */}
              {flightTypes.length > 0 && (
                <div className="flex items-center gap-1.5 lg:gap-2 text-[#2d2d2d]/90 dark:text-white/90">
                  <CheckCircle2 className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-green-500 dark:text-green-300" />
                  <span className="text-xs lg:text-sm"><strong className="text-[#1a1a1a] dark:text-white">{flightTypes.length}</strong> {t('flightTypes.title')}</span>
                </div>
              )}
            </div>
            
            {/* CTA Buttons Row */}
            <div className="flex flex-wrap items-center gap-2 lg:gap-3">
              {/* Primary CTA - Book Flight */}
              <button
                onClick={() => {
                  const flightTypesSection = document.getElementById('flight-types-section');
                  if (flightTypesSection) {
                    flightTypesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="group relative flex items-center gap-1.5 lg:gap-2 px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl transition-all duration-300 text-xs lg:text-sm font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] overflow-hidden"
                style={{ 
                  backgroundColor: '#2196f3',
                  color: '#ffffff',
                  boxShadow: '0 10px 15px -3px rgba(33, 150, 243, 0.3)'
                }}
              >
                {/* Shine effect */}
                <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                <svg className="relative w-4 h-4 lg:w-5 lg:h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span className="relative">{t('hero.bookFlight')}</span>
              </button>
              
              {/* Secondary CTA - Contact */}
              <Link
                href={`/${locale}/contact`}
                className="group flex items-center gap-1.5 lg:gap-2 px-3 lg:px-5 py-2.5 lg:py-3 bg-gradient-to-r from-[rgba(70,151,210,0.4)] to-[rgba(70,151,210,0.3)] dark:from-transparent dark:to-transparent dark:bg-black/40 backdrop-blur-md border border-[#4697D2]/40 dark:border-white/10 text-[#1a1a1a] dark:text-white rounded-xl hover:from-[rgba(70,151,210,0.5)] hover:to-[rgba(70,151,210,0.4)] dark:hover:bg-black/50 hover:border-[#CAFA00]/50 dark:hover:border-white/20 transition-all duration-300 text-xs lg:text-sm font-medium shadow-lg shadow-[#4697D2]/10 dark:shadow-black/30 hover:shadow-xl"
              >
                <svg className="w-3.5 h-3.5 lg:w-4 lg:h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>{t('hero.contact')}</span>
              </Link>
              
              {/* Rate Button - Golden Gradient */}
              <button
                onClick={() => setShowRatingModal(true)}
                className="group relative flex items-center gap-1.5 lg:gap-2 px-3 lg:px-5 py-2.5 lg:py-3 text-white rounded-xl transition-all duration-300 text-xs lg:text-sm font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #ffc107 0%, #ffa000 100%)',
                  boxShadow: '0 10px 15px -3px rgba(255, 193, 7, 0.3)'
                }}
              >
                {/* Shine effect */}
                <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                <svg className="relative w-3.5 h-3.5 lg:w-4 lg:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="relative">{userRating ? t('hero.changeRating') : t('hero.rate')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="w-full max-w-[1280px] mx-auto px-4 py-5 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          
          {/* Left Column (Content) */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* About / History */}
            {historyText && (
              <article className="group relative rounded-xl backdrop-blur-md shadow-xl shadow-black/5 dark:shadow-black/30 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-0.5 border border-[#4697D2]/30 dark:border-white/10 bg-[rgba(70,151,210,0.15)] dark:bg-black/40">
                {/* Gradient Border Effect - hidden in dark mode */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/30 via-white/10 to-transparent dark:from-transparent dark:via-transparent dark:to-transparent p-[1px] pointer-events-none" />
                {/* Top Highlight Line */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent" />
                {/* Animated Accent Glow - disabled in dark mode */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 dark:bg-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 dark:group-hover:opacity-0 transition-opacity duration-700" />
                {/* Header with Mobile Accordion and Desktop Read More */}
                <div className="w-full p-4 lg:p-5 flex items-start justify-between gap-3">
                  <button
                    onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                    className="flex items-start gap-2 flex-1 lg:pointer-events-none text-left"
                  >
                    <div className="p-1.5 rounded bg-[rgba(70,151,210,0.3)] dark:bg-white/10 flex-shrink-0 mt-0.5">
                      <Info className="w-4 h-4 text-[#4697D2] dark:text-white" />
                    </div>
                    <h2 className="text-sm lg:text-lg font-bold text-[#1a1a1a] dark:text-white text-left">{h2History || t('content.aboutLocation')}</h2>
                  </button>
                  
                  {/* Mobile: Dropdown Arrow */}
                  <button
                    onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                    className="lg:hidden p-1"
                  >
                    <ChevronDown 
                      className={`w-5 h-5 text-[#1a1a1a] dark:text-white transition-transform duration-300 ${isHistoryExpanded ? 'rotate-180' : ''}`} 
                    />
                  </button>
                  
                  {/* Desktop: Read More Button */}
                  <button
                    onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                    className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-md backdrop-blur-md bg-[rgba(70,151,210,0.2)] dark:bg-black/50 hover:bg-[rgba(70,151,210,0.3)] dark:hover:bg-black/60 border border-[#4697D2]/30 dark:border-white/10 transition-all text-[11px] font-medium text-[#1a1a1a] dark:text-white shadow-xl whitespace-nowrap"
                  >
                    <span>
                      {isHistoryExpanded ? t('content.showLess') : t('content.readMore')}
                    </span>
                    <ChevronDown 
                      className={`w-3.5 h-3.5 transition-transform duration-300 ${isHistoryExpanded ? 'rotate-180' : ''}`} 
                    />
                  </button>
                </div>
                
                {/* Content with smooth expand/collapse */}
                <div className={`relative overflow-hidden transition-all duration-500 ease-in-out ${isHistoryExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0 lg:max-h-[200px] lg:opacity-100'}`}>
                  <div className="px-4 pb-4 lg:px-5 lg:pb-5">
                    <div 
                      className={`prose prose-sm max-w-none text-[#2d2d2d] dark:text-white/90 transition-all duration-500 ease-in-out break-words
                        [&>h2]:text-base [&>h2]:lg:text-lg [&>h2]:font-bold [&>h2]:text-[#1a1a1a] dark:[&>h2]:text-white [&>h2]:mt-4 [&>h2]:mb-2 [&>h2]:break-words
                        [&>h3]:text-sm [&>h3]:lg:text-base [&>h3]:font-semibold [&>h3]:text-[#1a1a1a] dark:[&>h3]:text-white [&>h3]:mt-3 [&>h3]:mb-2 [&>h3]:break-words
                        [&>p]:mb-2 [&>p]:text-xs [&>p]:lg:text-sm [&>p]:leading-relaxed [&>p]:break-words
                        [&>ul]:my-2 [&>ul]:space-y-1 [&>ul]:pl-5
                        [&>ol]:my-2 [&>ol]:space-y-1 [&>ol]:pl-5
                        [&>li]:text-xs [&>li]:lg:text-sm [&>li]:leading-relaxed [&>li]:break-words
                        [&>li>p]:mb-1
                        [&>hr]:my-4 [&>hr]:border-[#4697D2]/30 dark:[&>hr]:border-white/20
                        [&_strong]:font-semibold [&_strong]:text-[#1a1a1a] dark:[&_strong]:text-white
                        [&_em]:italic
                        ${!isHistoryExpanded ? 'lg:max-h-[200px]' : 'lg:max-h-none'}`}
                      dangerouslySetInnerHTML={{ __html: historyText }}
                    />
                    
                    {/* Gradient overlay when collapsed - Desktop only */}
                    {!isHistoryExpanded && (
                      <div className="hidden lg:block absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-foreground/[0.02] to-transparent pointer-events-none"></div>
                    )}
                  </div>
                </div>
              </article>
            )}

            {/* Divider */}
            {flightTypes.length > 0 && <div className="border-t border-[#4697D2]/30 dark:border-white/20 my-6"></div>}

            {/* Flight Packages */}
            {flightTypes.length > 0 && (
              <section id="flight-types-section" className="scroll-mt-20">
                <SectionTitle icon={Wind} title={h3FlightTypes || t('flightTypes.title')} />
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {flightTypes.map((pkg, idx) => {
                    // Try to find shared flight type by ID (handle both string and number types)
                    const shared = sharedFlightTypes.find(s => String(s.id) === String(pkg.shared_id));
                    
                    // Get prices from package or fallback to shared type
                    const priceGel = pkg.price_gel ?? shared?.price_gel;
                    const priceUsd = pkg.price_usd ?? shared?.price_usd;
                    const priceEur = pkg.price_eur ?? shared?.price_eur;

                    return (
                      <div 
                        key={idx} 
                        className="flex flex-col p-4 md:p-5 rounded-xl backdrop-blur-md border border-[#4697D2]/30 dark:border-white/10 hover:border-[#4697D2]/50 dark:hover:border-white/20 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 bg-[rgba(70,151,210,0.15)] dark:bg-black/40"
                      >
                        {/* Header */}
                        <div className="mb-3">
                          <h3 className="text-base md:text-lg font-bold text-[#1a1a1a] dark:text-white mb-2">{pkg.name}</h3>
                          <p className="text-xs text-[#2d2d2d] dark:text-white/90 min-h-[32px] line-clamp-2">
                            {pkg.description}
                          </p>
                        </div>

                        {/* Super Compact 5-Star Rating System - Above Price */}
                        {pkg.shared_id && flightTypeRatings[pkg.shared_id] && (
                          <div className="mb-3 pb-3 border-b border-[#4697D2]/30 dark:border-white/20">
                            <div className="flex items-center justify-between gap-2">
                              {/* 5 Stars Display */}
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => {
                                  const rating = flightTypeRatings[pkg.shared_id!].avgRating;
                                  const isFilled = star <= Math.floor(rating);
                                  const isHalf = !isFilled && star <= Math.ceil(rating) && rating % 1 >= 0.3;
                                  
                                  return (
                                    <div key={star} className="relative w-3.5 h-3.5 md:w-4 md:h-4">
                                      {isHalf ? (
                                        <svg className="w-full h-full" viewBox="0 0 20 20">
                                          <defs>
                                            <linearGradient id={`half-${idx}-${star}`}>
                                              <stop offset="50%" stopColor="rgb(249, 115, 22)" />
                                              <stop offset="50%" stopColor="rgb(209, 213, 219)" />
                                            </linearGradient>
                                          </defs>
                                          <path 
                                            fill={`url(#half-${idx}-${star})`}
                                            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                                          />
                                        </svg>
                                      ) : (
                                        <svg className="w-full h-full" viewBox="0 0 20 20">
                                          <path 
                                            fill={isFilled ? 'rgb(249, 115, 22)' : 'rgb(209, 213, 219)'}
                                            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                                          />
                                        </svg>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Rating Number & Count */}
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs md:text-sm font-bold text-[#1a1a1a] dark:text-white">
                                  {flightTypeRatings[pkg.shared_id].avgRating > 0 
                                    ? flightTypeRatings[pkg.shared_id].avgRating.toFixed(1) 
                                    : '0.0'}
                                </span>
                                <span className="text-[10px] text-[#2d2d2d] dark:text-white/80">
                                  ({flightTypeRatings[pkg.shared_id].count})
                                </span>
                              </div>

                              {/* Rate Button - Only for authenticated users */}
                              {isAuthenticated ? (
                                <button
                                  onClick={() => setFlightTypeRatings(prev => ({
                                    ...prev,
                                    [pkg.shared_id!]: {
                                      ...prev[pkg.shared_id!],
                                      showInput: !prev[pkg.shared_id!].showInput
                                    }
                                  }))}
                                  className="group relative ml-auto flex items-center gap-1.5 px-3 py-1.5 text-white rounded-lg transition-all duration-300 text-[11px] font-semibold shadow-md shadow-[#ffa000]/30 hover:shadow-lg hover:shadow-[#ffa000]/40 hover:scale-105 overflow-hidden"
                                  style={{ background: 'linear-gradient(135deg, #ffc107 0%, #ffa000 100%)' }}
                                >
                                  <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                                  <svg className="relative w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                  <span className="relative">{flightTypeRatings[pkg.shared_id].userRating ? t('flightTypes.changeButton') : t('flightTypes.rateButton')}</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => setShowAuthModal(true)}
                                  className="group relative ml-auto flex items-center gap-1.5 px-3 py-1.5 text-white rounded-lg transition-all duration-300 text-[11px] font-semibold shadow-md shadow-[#ffa000]/30 hover:shadow-lg hover:shadow-[#ffa000]/40 hover:scale-105 overflow-hidden"
                                  style={{ background: 'linear-gradient(135deg, #ffc107 0%, #ffa000 100%)' }}
                                >
                                  <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                                  <svg className="relative w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                  <span className="relative">{t('flightTypes.rateButton')}</span>
                                </button>
                              )}
                            </div>

                            {/* Rating Input Dropdown */}
                            {flightTypeRatings[pkg.shared_id].showInput && (
                              <>
                                {/* Backdrop overlay - closes on click */}
                                <div 
                                  className="fixed inset-0 z-40"
                                  onClick={() => setFlightTypeRatings(prev => ({
                                    ...prev,
                                    [pkg.shared_id!]: {
                                      ...prev[pkg.shared_id!],
                                      showInput: false
                                    }
                                  }))}
                                />
                                {/* Rating input - positioned relative to parent */}
                                <div className="relative z-50 mt-2 p-2 rounded-lg bg-white/90 dark:bg-black/70 backdrop-blur-md border border-foreground/20 shadow-lg animate-fadeIn">
                                  <RatingInput
                                    ratableType="flight_type"
                                    ratableId={pkg.shared_id}
                                    existingRating={flightTypeRatings[pkg.shared_id].userRating || undefined}
                                    onRatingChange={(newRating) => {
                                      handleFlightTypeRatingChange(pkg.shared_id!, newRating);
                                      // Auto-close after rating
                                      setTimeout(() => {
                                        setFlightTypeRatings(prev => ({
                                          ...prev,
                                          [pkg.shared_id!]: {
                                            ...prev[pkg.shared_id!],
                                            showInput: false
                                          }
                                        }));
                                      }, 1500);
                                    }}
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        )}

                        {/* Price */}
                        <div className="mb-4 pb-4 border-b border-[#4697D2]/30 dark:border-white/20">
                          <div className="flex items-baseline gap-1.5 mb-1.5">
                            <span className="text-2xl md:text-3xl font-bold text-[#1a1a1a] dark:text-white">
                              {priceGel}
                            </span>
                            <span className="text-lg md:text-xl font-bold text-[#1a1a1a] dark:text-white">₾</span>
                            <span className="text-[10px] md:text-xs text-[#2d2d2d] dark:text-white/80">/ person</span>
                          </div>
                          <div className="flex gap-1.5">
                            <span className="px-1.5 py-0.5 md:px-2 md:py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-[9px] md:text-[10px] font-semibold">
                              ${priceUsd}
                            </span>
                            <span className="px-1.5 py-0.5 md:px-2 md:py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded text-[9px] md:text-[10px] font-semibold">
                              €{priceEur}
                            </span>
                          </div>
                        </div>

                        {/* Features */}
                        <div className="flex-1 mb-5">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="h-px flex-1 bg-[#4697D2]/30 dark:bg-white/20"></div>
                            <p className="text-[10px] font-semibold text-[#2d2d2d] dark:text-white/90 uppercase tracking-wider">
                              შედის
                            </p>
                            <div className="h-px flex-1 bg-[#4697D2]/30 dark:bg-white/20"></div>
                          </div>
                          {pkg.features && (
                            <ul className="space-y-2.5">
                              {pkg.features.map((feature, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-[#2d2d2d] dark:text-white/90">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 dark:text-green-400 shrink-0 mt-0.5" />
                                  <span className="leading-tight">{feature}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        {/* Action */}
                        <Link
                          href={`/${locale}/bookings?locationId=${location.id}&flightTypeId=${pkg.shared_id}`}
                          className="w-full py-3 px-4 rounded-lg font-semibold text-sm text-center hover:opacity-90 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 shadow-md dark:bg-foreground dark:text-background"
                          style={{ 
                            backgroundColor: '#2196f3',
                            color: '#ffffff'
                          }}
                        >
                          {t('sidebar.bookNow')}
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Divider */}
            {gallery.length > 0 && <div className="border-t border-[#4697D2]/30 dark:border-white/20 my-6"></div>}

            {/* Gallery */}
            {gallery.length > 0 && (
              <div className="space-y-4">
                <div className="group relative flex items-center justify-between px-4 py-3 rounded-xl backdrop-blur-md shadow-xl shadow-black/5 dark:shadow-black/30 overflow-hidden border border-[#4697D2]/30 dark:border-white/10 bg-[rgba(70,151,210,0.15)] dark:bg-black/40">
                  {/* Gradient Border - hidden in dark mode */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/30 via-white/10 to-white/30 dark:from-transparent dark:via-transparent dark:to-transparent p-[1px] pointer-events-none" />
                  {/* Top Highlight */}
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent" />
                  <h3 className="text-sm font-semibold text-[#1a1a1a] dark:text-white flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#4697D2] dark:text-white" />
                    {galleryDescription || t('gallery.title')}
                  </h3>
                  <span className="text-xs text-[#2d2d2d] dark:text-white/80 px-2 py-0.5 rounded bg-[rgba(70,151,210,0.2)] dark:bg-black/50">{gallery.length}</span>
                </div>
                
                <div className="columns-2 lg:columns-3 gap-2">
                  {gallery.map((image: any, index: number) => (
                    <div key={index} className="break-inside-avoid mb-2">
                      <button
                        onClick={() => setLightboxIndex(index)}
                        className="relative rounded-lg overflow-hidden border border-[#4697D2]/30 dark:border-white/10 hover:border-[#4697D2]/50 dark:hover:border-white/20 hover:shadow-md transition-all group w-full cursor-pointer"
                      >
                        <Image
                          src={image.url}
                          alt={image[`alt_${locale}`] || `${index + 1}`}
                          width={600}
                          height={400}
                          unoptimized
                          className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 1024px) 50vw, 33vw"
                        />
                        {/* Zoom icon overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-white/0 group-hover:bg-white/90 flex items-center justify-center transition-all scale-0 group-hover:scale-100">
                            <ExternalLink className="w-5 h-5 text-gray-800" />
                          </div>
                        </div>
                        {image[`alt_${locale}`] && (
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-[10px] text-white">{image[`alt_${locale}`]}</p>
                          </div>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Divider */}
            {videos.length > 0 && <div className="border-t border-[#4697D2]/30 dark:border-white/20 my-6"></div>}

            {/* Videos */}
            {videos.length > 0 && (
              <section className="space-y-4">
                <SectionTitle icon={Video} title={t('gallery.videos')} />
                
                {/* YouTube Style Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  
                  {/* Main Video Player - Left/Top */}
                  <div className="lg:col-span-2 space-y-2">
                    <div id="main-video-player" className="relative rounded-lg overflow-hidden border border-white/20 bg-black shadow-lg">
                      <div className="relative aspect-video">
                        <iframe
                          key={activeVideoIndex}
                          src={`https://www.youtube.com/embed/${getYouTubeID(videos[activeVideoIndex])}?autoplay=0`}
                          title={`${locale === 'en' ? 'Video' : locale === 'ru' ? 'Видео' : 'ვიდეო'} ${activeVideoIndex + 1}`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="absolute inset-0 w-full h-full"
                        />
                      </div>
                    </div>
                    
                    {/* Active Video Info */}
                    <div className="flex items-center gap-2 px-1">
                      <div className="flex items-center gap-2 px-2 py-1 rounded bg-red-600/20 border border-red-600/30">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                        <span className="text-[10px] font-semibold text-red-400 uppercase tracking-wide">
                          {locale === 'en' ? 'Now Playing' : locale === 'ru' ? 'Играет' : 'მიმდინარე'}
                        </span>
                      </div>
                      <span className="text-xs text-white/80">
                        {activeVideoIndex + 1} / {videos.length}
                      </span>
                    </div>
                  </div>

                  {/* Playlist - Right/Bottom - Height matches main video */}
                  <div className="lg:col-span-1 lg:self-start">
                    <div className="group relative rounded-xl backdrop-blur-md shadow-xl shadow-black/5 dark:shadow-black/30 overflow-hidden max-h-[400px] lg:max-h-[360px] flex flex-col border border-[#4697D2]/30 dark:border-white/10 bg-[rgba(70,151,210,0.15)] dark:bg-black/40">
                      {/* Gradient Border - hidden in dark mode */}
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/30 via-white/10 to-white/5 dark:from-transparent dark:via-transparent dark:to-transparent p-[1px] pointer-events-none" />
                      {/* Top Highlight */}
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent z-10" />
                      {/* Playlist Header */}
                      <div className="px-3 py-2 bg-[rgba(70,151,210,0.15)] dark:bg-black/50 border-b border-[#4697D2]/30 dark:border-white/10 flex-shrink-0">
                        <h4 className="text-[11px] font-semibold text-[#1a1a1a] dark:text-white uppercase tracking-wide">
                          {locale === 'en' ? 'Playlist' : locale === 'ru' ? 'Плейлист' : 'პლეილისტი'}
                        </h4>
                      </div>
                      
                      {/* Playlist Items - Scrollable, fills remaining height */}
                      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-[#4697D2]/40 dark:scrollbar-thumb-white/40 scrollbar-track-[#4697D2]/10 dark:scrollbar-track-white/10 hover:scrollbar-thumb-[#4697D2]/60 dark:hover:scrollbar-thumb-white/60 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-[#4697D2]/5 dark:[&::-webkit-scrollbar-track]:bg-white/5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#4697D2]/30 dark:[&::-webkit-scrollbar-thumb]:bg-white/30 hover:[&::-webkit-scrollbar-thumb]:bg-[#4697D2]/50 dark:hover:[&::-webkit-scrollbar-thumb]:bg-white/50">
                        {videos.map((videoUrl: string, index: number) => {
                          const videoId = getYouTubeID(videoUrl);
                          if (!videoId) return null;

                          const isActive = index === activeVideoIndex;
                          const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

                          return (
                            <button
                              key={index}
                              onClick={() => setActiveVideoIndex(index)}
                              className={`w-full flex items-start gap-2 p-2 transition-all hover:bg-[rgba(70,151,210,0.15)] dark:hover:bg-black/50 border-l-2 ${
                                isActive 
                                  ? 'bg-[rgba(70,151,210,0.2)] dark:bg-black/60 border-l-red-600' 
                                  : 'border-l-transparent hover:border-l-[#4697D2]/50 dark:hover:border-l-white/20'
                              }`}
                            >
                              {/* Thumbnail */}
                              <div className="relative w-28 flex-shrink-0 rounded overflow-hidden border border-[#4697D2]/30 dark:border-white/10 group-hover:border-[#4697D2]/50 dark:group-hover:border-white/20">
                                <div className="relative aspect-video bg-black">
                                  <img 
                                    src={thumbnailUrl}
                                    alt={`Video ${index + 1}`}
                                    className="absolute inset-0 w-full h-full object-cover"
                                  />
                                  
                                  {/* Play overlay */}
                                  <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                                    isActive ? 'bg-black/50' : 'bg-black/30 group-hover:bg-black/40'
                                  }`}>
                                    {isActive ? (
                                      <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-600 text-white">
                                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                                        </svg>
                                        <span className="text-[9px] font-bold">PLAYING</span>
                                      </div>
                                    ) : (
                                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                      </svg>
                                    )}
                                  </div>
                                  
                                  {/* Video number badge */}
                                  <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-sm">
                                    <span className="text-[9px] text-white font-bold">{index + 1}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Video Info */}
                              <div className="flex-1 min-w-0 text-left">
                                <p className={`text-[11px] leading-tight line-clamp-2 transition-colors ${
                                  isActive 
                                    ? 'text-[#1a1a1a] dark:text-white font-semibold' 
                                    : 'text-[#2d2d2d] dark:text-white/80 hover:text-[#1a1a1a] dark:hover:text-white'
                                }`}>
                                  {locale === 'en' ? 'Video' : locale === 'ru' ? 'Видео' : 'ვიდეო'} {index + 1}
                                </p>
                                {isActive && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <div className="w-1 h-1 rounded-full bg-red-600 animate-pulse"></div>
                                    <span className="text-[9px] text-red-600 font-semibold">
                                      {locale === 'en' ? 'Now' : locale === 'ru' ? 'Сейчас' : 'ახლა'}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Divider */}
            {location.map_iframe_url && <div className="border-t border-[#4697D2]/30 dark:border-white/10 my-6"></div>}

            {/* Map */}
            {location.map_iframe_url && (
              <div className="group relative space-y-4 p-4 rounded-xl backdrop-blur-md shadow-xl shadow-black/5 dark:shadow-black/30 overflow-hidden border border-[#4697D2]/30 dark:border-white/10 bg-[rgba(70,151,210,0.15)] dark:bg-black/40">
                {/* Gradient Border - hidden in dark mode */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/30 via-white/10 to-white/5 dark:from-transparent dark:via-transparent dark:to-transparent p-[1px] pointer-events-none" />
                {/* Top Highlight */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent" />
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-semibold text-[#1a1a1a] dark:text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#4697D2] dark:text-white" />
                    {t('map.title')}
                  </h3>
                </div>
                <div className="rounded-lg border border-[#4697D2]/30 dark:border-white/10 bg-[rgba(70,151,210,0.1)] dark:bg-black/30 overflow-hidden h-[400px]">
                  <iframe
                    src={getMapSrc(location.map_iframe_url)}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-[#4697D2]/30 dark:border-white/10 my-6"></div>

            {/* Contact via Messaging Apps */}
            <div className="group relative rounded-xl backdrop-blur-md shadow-xl shadow-black/5 dark:shadow-black/30 overflow-hidden border border-[#4697D2]/30 dark:border-white/10 bg-[rgba(70,151,210,0.15)] dark:bg-black/40">
              {/* Gradient Border - hidden in dark mode */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/30 via-white/10 to-white/5 dark:from-transparent dark:via-transparent dark:to-transparent p-[1px] pointer-events-none" />
              {/* Top Highlight */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent" />
              {/* Accent Glow - disabled in dark mode */}
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-gradient-to-br from-green-500/10 to-blue-500/10 dark:from-transparent dark:to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 dark:group-hover:opacity-0 transition-opacity duration-700" />
              {/* Header with Icon */}
              <div className="px-4 py-3 border-b border-[#4697D2]/30 dark:border-white/10 bg-gradient-to-r from-[rgba(70,151,210,0.1)] dark:from-black/30 to-transparent">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[rgba(70,151,210,0.2)] dark:bg-white/10">
                    <svg className="w-4 h-4 text-[#4697D2] dark:text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-[#1a1a1a] dark:text-white">
                    {t('contact.title')}
                  </h3>
                </div>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Info Text */}
                <div className="text-xs text-[#2d2d2d] dark:text-white/90 leading-relaxed space-y-2">
                  <p className="flex items-start gap-2">
                    <svg className="w-3.5 h-3.5 text-[#4697D2]/70 dark:text-white/50 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span>{t('contact.description')}</span>
                  </p>
                  <p className="pl-5">
                    {t('contact.visitText')}{' '}
                    <Link 
                      href={`/${locale}/locations`}
                      className="font-semibold text-[#4697D2] dark:text-white hover:text-[#4697D2]/80 dark:hover:text-white/80 underline decoration-[#4697D2]/40 dark:decoration-white/40 hover:decoration-[#4697D2]/70 dark:hover:decoration-white/70 transition-colors inline-flex items-center gap-1"
                    >
                      {t('contact.locationsPage')}
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </Link>
                    {t('contact.detailsText')}
                  </p>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-[#4697D2]/30 dark:bg-white/10"></div>
                  <span className="text-[10px] font-semibold text-[#2d2d2d]/50 dark:text-white/50 uppercase tracking-wider">{t('contact.messengers')}</span>
                  <div className="h-px flex-1 bg-[#4697D2]/30 dark:bg-white/20"></div>
                </div>

                {/* Messaging Apps */}
                <div className="flex items-center justify-center gap-3">
                  {/* WhatsApp */}
                  <a
                    href="https://wa.me/995511440400"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex items-center justify-center w-10 h-10 rounded-lg bg-[#25D366]/10 dark:bg-[#25D366]/20 border border-[#25D366]/20 dark:border-[#25D366]/30 hover:bg-[#25D366]/20 dark:hover:bg-[#25D366]/30 hover:border-[#25D366]/40 transition-all hover:scale-110 active:scale-95"
                    title="WhatsApp"
                  >
                    <svg className="w-5 h-5 text-[#25D366] dark:text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </a>

                  {/* Viber */}
                  <a
                    href="viber://chat?number=995511440400"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex items-center justify-center w-10 h-10 rounded-lg bg-[#7360F2]/10 dark:bg-[#7360F2]/20 border border-[#7360F2]/20 dark:border-[#7360F2]/30 hover:bg-[#7360F2]/20 dark:hover:bg-[#7360F2]/30 hover:border-[#7360F2]/40 transition-all hover:scale-110 active:scale-95"
                    title="Viber"
                  >
                    <svg className="w-5 h-5 text-[#7360F2] dark:text-[#7360F2]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.4 0C9.473.028 5.333.344 2.746 2.699 1.497 3.814.704 5.316.088 7.113c-.614 1.798-.634 3.635-.647 5.522-.013 1.887.014 3.774.497 5.622.44 1.684 1.369 3.075 2.674 4.086.515.4 1.042.627 1.638.795.649.184 1.306.199 1.964.199h.005c.582 0 1.13-.019 1.665-.058 1.018-.074 1.897-.309 2.71-.664 3.155-1.382 5.28-4.254 6.197-7.383.684-2.334.851-4.79.493-7.234-.401-2.741-1.516-5.03-3.314-6.803C13.513.515 12.227.144 11.4 0zm.6 1.988c.682.124 1.697.464 2.813 1.746 1.465 1.685 2.434 3.693 2.787 5.912.29 1.824.189 3.694-.389 5.484-.837 2.593-2.549 4.977-5.096 6.021-.652.268-1.35.452-2.145.511-.504.037-1.016.055-1.554.055-2.175 0-3.682-.454-4.479-1.351-1.147-.952-1.922-2.16-2.298-3.587-.414-1.57-.414-3.178-.401-4.784.013-1.605.03-3.21.557-4.752.485-1.421 1.158-2.612 2.115-3.453 2.034-1.787 5.426-2.031 7.09-1.802zM8.08 6.576c-.206.033-.4.162-.54.35-.206.28-.474.96-.474.96s-.224.473-.224 1.126v.656c0 .653.224 1.126.224 1.126.06.12.134.224.22.318.52.573 1.22.764 1.957.764h.658c.734 0 1.434-.19 1.955-.764.086-.094.16-.199.22-.318 0 0 .224-.473.224-1.126v-.656c0-.653-.224-1.126-.224-1.126-.14-.188-.334-.317-.54-.35-.43-.07-1.083-.15-1.634-.15-.55 0-1.204.08-1.634.15zm3.49 2.395c.083 0 .15.068.15.15v.5c0 .083-.067.15-.15.15h-.5c-.082 0-.15-.067-.15-.15v-.5c0-.082.068-.15.15-.15zm-3.14 0c.083 0 .15.068.15.15v.5c0 .083-.067.15-.15.15h-.5c-.082 0-.15-.067-.15-.15v-.5c0-.082.068-.15.15-.15zm1.57 1.91c.7 0 1.27.57 1.27 1.27 0 .7-.57 1.27-1.27 1.27-.7 0-1.27-.57-1.27-1.27 0-.7.57-1.27 1.27-1.27z"/>
                    </svg>
                  </a>

                  {/* Telegram */}
                  <a
                    href="https://t.me/+995511440400"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex items-center justify-center w-10 h-10 rounded-lg bg-[#229ED9]/10 dark:bg-[#229ED9]/20 border border-[#229ED9]/20 dark:border-[#229ED9]/30 hover:bg-[#229ED9]/20 dark:hover:bg-[#229ED9]/30 hover:border-[#229ED9]/40 transition-all hover:scale-110 active:scale-95"
                    title="Telegram"
                  >
                    <svg className="w-5 h-5 text-[#229ED9] dark:text-[#229ED9]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column (Sidebar) */}
          <aside className="lg:col-span-1">
            <div className="sticky top-16 pt-2 space-y-3">
              
              {/* Booking Card */}
              <div className="group relative rounded-xl backdrop-blur-md shadow-xl shadow-black/5 dark:shadow-black/30 overflow-hidden transition-all duration-500 hover:shadow-2xl border border-[#4697D2]/30 dark:border-white/10 bg-[rgba(70,151,210,0.15)] dark:bg-black/40">
                {/* Gradient Border - hidden in dark mode */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-400/30 via-purple-400/20 to-pink-400/30 dark:from-transparent dark:via-transparent dark:to-transparent p-[1px] pointer-events-none" />
                {/* Top Highlight */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent" />
                {/* Corner Glow - disabled in dark mode */}
                <div className="absolute -top-10 -left-10 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 dark:from-transparent dark:to-transparent rounded-full blur-3xl" />
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 dark:from-transparent dark:to-transparent rounded-full blur-3xl" />
                {/* Header */}
                <div className="bg-foreground text-background px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-background/20 backdrop-blur-sm">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-wide">
                      {t('sidebar.bookNow')}
                    </h3>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                  {/* Icon & Text */}
                  <div className="text-center space-y-3">
                    <div className="flex justify-center">
                      <div className="p-3 rounded-full bg-[rgba(70,151,210,0.2)] dark:bg-white/10 border-2 border-[#4697D2]/30 dark:border-white/15">
                        <Wind className="w-8 h-8 text-[#4697D2] dark:text-white" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-[11px] text-[#1a1a1a]/80 dark:text-white/90 leading-relaxed">
                        {t('sidebar.experienceText').replace('{locationName}', locationName)}
                      </p>
                    </div>
                  </div>

                  {/* CTA Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        const flightTypesSection = document.getElementById('flight-types-section');
                        if (flightTypesSection) {
                          flightTypesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 hover:opacity-90 rounded-lg font-semibold text-sm transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] dark:bg-foreground dark:text-background"
                      style={{ 
                        backgroundColor: '#2196f3',
                        color: '#ffffff'
                      }}
                    >
                      <Calendar className="w-4 h-4" />
                      {t('sidebar.bookNow')}
                    </button>
                    
                    <Link
                      href={`/${locale}/contact`}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 border rounded-lg font-semibold text-sm transition-all border-[#4697D2]/30 dark:border-white/10 text-[#1a1a1a] dark:text-white hover:bg-[rgba(70,151,210,0.25)] dark:hover:bg-black/50 bg-[rgba(70,151,210,0.15)] dark:bg-black/30"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {t('hero.contact')}
                    </Link>
                  </div>

                  {/* Stats */}
                  <div className="pt-4 border-t border-[#4697D2]/30 dark:border-white/10 grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-[10px] text-[#1a1a1a]/50 dark:text-white/50 uppercase tracking-wider font-semibold mb-1">{t('sidebar.flights')}</p>
                      <p className="text-sm font-bold text-[#1a1a1a] dark:text-white">{flightTypes.length}</p>
                    </div>
                    <div className="text-center border-l border-[#4697D2]/30 dark:border-white/10">
                      <p className="text-[10px] text-[#1a1a1a]/50 dark:text-white/50 uppercase tracking-wider font-semibold mb-1">{t('sidebar.photos')}</p>
                      <p className="text-sm font-bold text-[#1a1a1a] dark:text-white">{gallery.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Info / Weather Placeholder */}
              <div className="group relative p-5 rounded-xl backdrop-blur-md shadow-xl shadow-black/5 dark:shadow-black/30 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-0.5 border border-[#4697D2]/30 dark:border-white/10 bg-[rgba(70,151,210,0.15)] dark:bg-black/40">
                {/* Gradient Border - hidden in dark mode */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/30 via-white/10 to-white/5 dark:from-transparent dark:via-transparent dark:to-transparent p-[1px] pointer-events-none" />
                {/* Top Highlight */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#1a1a1a]/60 dark:text-white/60">{t('quickInfo.bestSeason')}</p>
                    <p className="text-sm font-semibold text-[#1a1a1a] dark:text-white">{t('quickInfo.yearRound')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                    <Wind className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#1a1a1a]/60 dark:text-white/60">{t('quickInfo.flightConditions')}</p>
                    <p className="text-sm font-semibold text-[#1a1a1a] dark:text-white">{t('quickInfo.thermalAndDynamic')}</p>
                  </div>
                </div>
              </div>

            </div>
          </aside>

        </div>
      </div>

      {/* Lightbox Overlay */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center animate-in fade-in duration-200">
          <button 
            onClick={() => setLightboxIndex(null)}
            className="absolute top-6 right-6 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(prev => prev === null ? null : (prev - 1 + gallery.length) % gallery.length);
            }}
            className="absolute left-4 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          <div className="relative max-w-6xl max-h-[85vh] w-full px-4">
            <Image
              src={gallery[lightboxIndex].url}
              alt={gallery[lightboxIndex][`alt_${locale}`] || 'Gallery image'}
              width={1920}
              height={1080}
              className="w-full h-full object-contain max-h-[85vh]"
            />
            <div className="absolute bottom-0 left-0 right-0 text-center p-4">
              <p className="text-white/90 font-medium text-lg">
                {gallery[lightboxIndex][`alt_${locale}`]}
              </p>
              <p className="text-white/50 text-sm mt-1">
                {lightboxIndex + 1} / {gallery.length}
              </p>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(prev => prev === null ? null : (prev + 1) % gallery.length);
            }}
            className="absolute right-4 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>
      )}

      {/* Comments Section */}
      <div className="max-w-[1280px] mx-auto px-4 py-16">
        <div className="group relative backdrop-blur-md rounded-xl p-8 shadow-xl shadow-black/5 dark:shadow-black/30 overflow-hidden border border-[#4697D2]/30 dark:border-white/10 bg-[rgba(70,151,210,0.15)] dark:bg-black/40">
          {/* Gradient Border - hidden in dark mode */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/30 via-white/10 to-white/5 dark:from-transparent dark:via-transparent dark:to-transparent p-[1px] pointer-events-none" />
          {/* Top Highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent" />
          {/* Decorative Glow - disabled in dark mode */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent dark:from-transparent dark:via-transparent dark:to-transparent rounded-full blur-3xl" />
          <CommentsList
            commentableType="location"
            commentableId={String(location.id)}
          />
        </div>
      </div>

      {/* Rating Modal */}
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        ratableType="location"
        ratableId={String(location.id)}
        existingRating={userRating}
        onRatingChange={(newRating) => {
          handleRatingChange(newRating);
        }}
        title={t('ratingModal.title')}
      />

      {/* Auth Required Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAuthModal(false)}
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-md rounded-xl backdrop-blur-xl bg-white/15 dark:bg-black/20 shadow-2xl shadow-black/20 p-6 animate-in zoom-in-95 duration-200 overflow-hidden">
            {/* Gradient Border */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/40 via-white/20 to-white/10 dark:from-white/30 dark:via-white/10 dark:to-white/5 p-[1px] pointer-events-none" />
            {/* Top Highlight */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            {/* Corner Glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-full blur-3xl" />
            {/* Close Button */}
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-foreground/10 transition-colors"
            >
              <X className="w-5 h-5 text-foreground/60" />
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full border" style={{ background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.2) 0%, rgba(255, 160, 0, 0.2) 100%)', borderColor: 'rgba(255, 193, 7, 0.3)' }}>
                <svg className="w-8 h-8" style={{ color: '#ffc107' }} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-foreground text-center mb-2">
              {t('authModal.title')}
            </h3>

            {/* Description */}
            <p className="text-sm text-foreground/70 text-center mb-6">
              {t('authModal.description')}
            </p>

            {/* Buttons */}
            <div className="space-y-3">
              <Link
                href={`/${locale}/login`}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-foreground text-background rounded-xl font-semibold text-sm hover:bg-foreground/90 transition-all shadow-lg hover:shadow-xl"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                {t('authModal.loginButton')}
              </Link>
              
              <Link
                href={`/${locale}/register`}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-foreground/10 hover:bg-foreground/20 text-foreground rounded-xl font-semibold text-sm border border-foreground/20 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                {t('authModal.registerButton')}
              </Link>
            </div>

            {/* Footer Text */}
            <p className="text-xs text-foreground/50 text-center mt-4">
              {t('authModal.footerText')}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}

// Helper
function getYouTubeID(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Helper to extract src from iframe string if needed
function getMapSrc(url: string) {
  if (!url) return '';
  if (url.startsWith('<iframe')) {
    const srcMatch = url.match(/src="([^"]*)"/);
    return srcMatch ? srcMatch[1] : '';
  }
  return url;
}
