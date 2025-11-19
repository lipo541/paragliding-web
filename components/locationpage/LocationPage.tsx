'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
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
}

// --- Components ---

const GlassCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-sm ${className}`}>
    {children}
  </div>
);

const SectionTitle = ({ icon: Icon, title }: { icon: any; title: string }) => (
  <div className="flex items-center gap-2 mb-4 text-foreground/80">
    <Icon className="w-5 h-5" />
    <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
  </div>
);

export default function LocationPage({ countrySlug, locationSlug, locale }: LocationPageProps) {
  const [location, setLocation] = useState<Location | null>(null);
  const [locationPage, setLocationPage] = useState<LocationPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [userRating, setUserRating] = useState<number | undefined>(undefined);
  const [showRatingInput, setShowRatingInput] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [flightTypeRatings, setFlightTypeRatings] = useState<{ [key: string]: { userRating: number | null; showInput: boolean; avgRating: number; count: number } }>({});

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
      ? flightRatings.reduce((sum, r) => sum + r.rating, 0) / flightRatings.length
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
      setIsLoading(true);
      const supabase = createClient();

      try {
        const slugField = `slug_${locale}`;
        const { data: locationData, error: locationError } = await supabase
          .from('locations')
          .select('*')
          .eq(slugField, locationSlug)
          .single();

        if (locationError) throw locationError;
        setLocation(locationData);

        const { data: pageData, error: pageError } = await supabase
          .from('location_pages')
          .select('*')
          .eq('location_id', locationData.id)
          .eq('is_active', true)
          .single();

        if (pageError && pageError.code !== 'PGRST116') throw pageError;
        setLocationPage(pageData);

        // Fetch user's rating if authenticated
        const { data: { user } } = await supabase.auth.getUser();
        if (user && locationData) {
          const { data: ratingData } = await supabase
            .from('ratings')
            .select('rating')
            .eq('ratable_type', 'location')
            .eq('ratable_id', String(locationData.id))
            .eq('user_id', user.id)
            .single();
          
          if (ratingData) {
            setUserRating(ratingData.rating);
          }

          // Fetch flight type ratings
          if (pageData?.content?.[locale]?.flight_types) {
            const flightTypesData: FlightType[] = pageData.content[locale].flight_types;
            const sharedIds = flightTypesData.map((ft: FlightType) => ft.shared_id).filter(Boolean) as string[];
            
            if (sharedIds.length > 0) {
              // Fetch all ratings for these flight types
              const { data: flightRatings } = await supabase
                .from('ratings')
                .select('ratable_id, rating, user_id')
                .eq('ratable_type', 'flight_type')
                .in('ratable_id', sharedIds);

              const ratingsMap: { [key: string]: { userRating: number | null; showInput: boolean; avgRating: number; count: number } } = {};
              
              sharedIds.forEach((id: string) => {
                const typeRatings = flightRatings?.filter((r: any) => r.ratable_id === id) || [];
                const userRatingData = typeRatings.find((r: any) => r.user_id === user.id);
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
        }
      } catch (error) {
        console.error('Error fetching location data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocationData();
  }, [countrySlug, locationSlug, locale]);

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
        <h1 className="text-xl font-medium text-foreground/60">ლოკაცია ვერ მოიძებნა</h1>
        <Link 
          href={`/${locale}/locations/${countrySlug}`}
          className="px-4 py-2 text-sm font-medium bg-foreground/5 hover:bg-foreground/10 rounded-full transition-colors"
        >
          უკან დაბრუნება
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

  // Labels
  const labels = {
    bookNow: locale === 'ka' ? 'დაჯავშნე ახლავე' : locale === 'ru' ? 'Забронировать' : 'Book Now',
    contact: locale === 'ka' ? 'კონტაქტი' : locale === 'ru' ? 'Контакты' : 'Contact',
    readMore: locale === 'ka' ? 'მეტის ნახვა' : locale === 'ru' ? 'Читать далее' : 'Read More',
    showLess: locale === 'ka' ? 'აკეცვა' : locale === 'ru' ? 'Свернуть' : 'Show Less',
    gallery: locale === 'ka' ? 'გალერეა' : locale === 'ru' ? 'Галерея' : 'Gallery',
    videos: locale === 'ka' ? 'ვიდეოები' : locale === 'ru' ? 'Видео' : 'Videos',
    map: locale === 'ka' ? 'რუკა' : locale === 'ru' ? 'Карта' : 'Map',
    packages: locale === 'ka' ? 'პაკეტები' : locale === 'ru' ? 'Пакеты' : 'Packages',
    startFrom: locale === 'ka' ? 'ფასი' : locale === 'ru' ? 'От' : 'Starts from',
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black selection:bg-blue-500/30">
      
      {/* Full Screen Hero - Behind Header with Parallax & Ken Burns Effect */}
      <div className="relative h-screen w-full overflow-hidden -mt-16 lg:-mt-20">
        {/* Animated Background Image */}
        <div 
          className="absolute inset-0"
          style={{
            animation: 'kenBurns 25s ease-in-out infinite'
          }}
        >
          <Image 
            src={heroImageUrl} 
            alt={heroImageAlt} 
            fill 
            priority 
            unoptimized 
            className="object-cover"
            style={{ transform: 'scale(1.1)' }}
            sizes="100vw" 
          />
        </div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-zinc-50 dark:to-black"></div>
        
        {/* Floating Particles Effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/30 rounded-full blur-sm"
            style={{ animation: 'floatSlow 15s ease-in-out infinite' }}
          ></div>
          <div 
            className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-white/20 rounded-full blur-sm"
            style={{ animation: 'floatMedium 12s ease-in-out infinite' }}
          ></div>
          <div 
            className="absolute top-2/3 left-1/2 w-1 h-1 bg-white/40 rounded-full blur-sm"
            style={{ animation: 'floatFast 9s ease-in-out infinite' }}
          ></div>
          <div 
            className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-white/25 rounded-full blur-sm"
            style={{ animation: 'floatSlow 15s ease-in-out infinite 5s' }}
          ></div>
          <div 
            className="absolute top-1/2 left-1/3 w-1.5 h-1.5 bg-white/30 rounded-full blur-sm"
            style={{ animation: 'floatMedium 12s ease-in-out infinite 3s' }}
          ></div>
        </div>
        
        {/* Add keyframes */}
        <style jsx>{`
          @keyframes kenBurns {
            0% {
              transform: scale(1) translate(0, 0);
            }
            50% {
              transform: scale(1.15) translate(-2%, -1%);
            }
            100% {
              transform: scale(1) translate(0, 0);
            }
          }

          @keyframes floatSlow {
            0%, 100% {
              transform: translateY(0) translateX(0);
              opacity: 0.3;
            }
            50% {
              transform: translateY(-100px) translateX(50px);
              opacity: 0.6;
            }
          }

          @keyframes floatMedium {
            0%, 100% {
              transform: translateY(0) translateX(0);
              opacity: 0.2;
            }
            50% {
              transform: translateY(-150px) translateX(-30px);
              opacity: 0.5;
            }
          }

          @keyframes floatFast {
            0%, 100% {
              transform: translateY(0) translateX(0);
              opacity: 0.4;
            }
            50% {
              transform: translateY(-80px) translateX(40px);
              opacity: 0.7;
            }
          }
        `}</style>
        
        <div className="absolute inset-0 flex items-start pt-48 lg:pt-64">
          <div className="w-full max-w-[1280px] mx-auto px-4">
            <h1 className="text-xl lg:text-3xl font-bold text-white mb-2 drop-shadow-2xl max-w-3xl">{h1Tag || locationName}</h1>
            {pTag && <p className="text-xs lg:text-sm text-white/90 max-w-2xl leading-relaxed drop-shadow-lg mb-6">{pTag}</p>}
            
            {/* Compact Premium Rating Section */}
            <div className="mb-5 inline-flex flex-col gap-2 animate-fade-in-up">
              {/* Compact Rating Display Card */}
              <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.01]">
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 via-orange-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Shine Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                  <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                </div>

                <div className="relative px-4 py-2.5 flex items-center gap-3">
                  <RatingDisplay 
                    averageRating={location.cached_rating || 0}
                    ratingsCount={location.cached_rating_count || 0}
                    size="md"
                  />
                  
                  {/* Compact Decorative Icon */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400/20 to-orange-500/20 flex items-center justify-center backdrop-blur-sm border border-white/10">
                    <svg className="w-4 h-4 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Rate Button - Opens Modal */}
              <button
                onClick={() => setShowRatingModal(true)}
                className="group relative overflow-hidden rounded-lg px-5 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <div className="relative flex items-center justify-center gap-2 text-sm font-semibold text-white">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span>{userRating ? (locale === 'ka' ? 'შეცვალეთ' : locale === 'ru' ? 'Изменить' : 'Change') : (locale === 'ka' ? 'შეაფასეთ' : locale === 'ru' ? 'Оценить' : 'Rate')}</span>
                </div>
                
                {/* Hover shine */}
                <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              </button>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex items-center gap-3 mt-4">
              <Link
                href={`/${locale}/contact`}
                className="group flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-lg hover:bg-white/20 hover:border-white/30 transition-all duration-300 text-xs lg:text-sm font-medium shadow-lg hover:shadow-xl"
              >
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>{locale === 'en' ? 'Contact Us' : locale === 'ru' ? 'Связаться' : 'დაკავშირება'}</span>
              </Link>
              
              <button
                onClick={() => {
                  const flightTypesSection = document.getElementById('flight-types-section');
                  if (flightTypesSection) {
                    flightTypesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="group flex items-center gap-2 px-5 py-2.5 bg-background backdrop-blur-sm border border-background/20 text-foreground rounded-lg hover:bg-background/90 hover:border-background/30 transition-all duration-300 text-xs lg:text-sm font-semibold shadow-lg hover:shadow-2xl hover:scale-[1.02]"
              >
                <svg className="w-4 h-4 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span>{locale === 'en' ? 'Book a Flight' : locale === 'ru' ? 'Забронировать полёт' : 'დაჯავშნე ფრენა'}</span>
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
              <article className="rounded-lg border border-foreground/10 bg-foreground/[0.02] overflow-hidden">
                {/* Header with Mobile Accordion and Desktop Read More */}
                <div className="w-full p-4 lg:p-5 flex items-start justify-between gap-3">
                  <button
                    onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                    className="flex items-start gap-2 flex-1 lg:pointer-events-none text-left"
                  >
                    <div className="p-1.5 rounded bg-foreground/10 flex-shrink-0 mt-0.5">
                      <Info className="w-4 h-4 text-foreground/70" />
                    </div>
                    <h2 className="text-sm lg:text-lg font-bold text-foreground text-left">{h2History || 'About Location'}</h2>
                  </button>
                  
                  {/* Mobile: Dropdown Arrow */}
                  <button
                    onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                    className="lg:hidden p-1"
                  >
                    <ChevronDown 
                      className={`w-5 h-5 text-foreground/60 transition-transform duration-300 ${isHistoryExpanded ? 'rotate-180' : ''}`} 
                    />
                  </button>
                  
                  {/* Desktop: Read More Button */}
                  <button
                    onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                    className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-foreground/20 bg-foreground/5 hover:bg-foreground/10 hover:border-foreground/30 transition-all text-[11px] font-medium text-foreground/70 hover:text-foreground whitespace-nowrap"
                  >
                    <span>
                      {isHistoryExpanded ? labels.showLess : labels.readMore}
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
                      className={`prose prose-sm max-w-none text-foreground/80 transition-all duration-500 ease-in-out break-words
                        [&>h2]:text-base [&>h2]:lg:text-lg [&>h2]:font-bold [&>h2]:text-foreground [&>h2]:mt-4 [&>h2]:mb-2 [&>h2]:break-words
                        [&>h3]:text-sm [&>h3]:lg:text-base [&>h3]:font-semibold [&>h3]:text-foreground [&>h3]:mt-3 [&>h3]:mb-2 [&>h3]:break-words
                        [&>p]:mb-2 [&>p]:text-xs [&>p]:lg:text-sm [&>p]:leading-relaxed [&>p]:break-words
                        [&>ul]:my-2 [&>ul]:space-y-1 [&>ul]:pl-5
                        [&>ol]:my-2 [&>ol]:space-y-1 [&>ol]:pl-5
                        [&>li]:text-xs [&>li]:lg:text-sm [&>li]:leading-relaxed [&>li]:break-words
                        [&>li>p]:mb-1
                        [&>hr]:my-4 [&>hr]:border-foreground/10
                        [&_strong]:font-semibold [&_strong]:text-foreground
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
            {flightTypes.length > 0 && <div className="border-t border-foreground/10 my-6"></div>}

            {/* Flight Packages */}
            {flightTypes.length > 0 && (
              <section id="flight-types-section" className="scroll-mt-20">
                <SectionTitle icon={Wind} title={h3FlightTypes || labels.packages} />
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
                        className="flex flex-col p-4 md:p-5 rounded-xl border border-foreground/10 bg-foreground/[0.02] hover:border-foreground/30 hover:bg-foreground/[0.04] hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
                      >
                        {/* Header */}
                        <div className="mb-3">
                          <h3 className="text-base md:text-lg font-bold text-foreground mb-2">{pkg.name}</h3>
                          <p className="text-xs text-foreground/60 min-h-[32px] line-clamp-2">
                            {pkg.description}
                          </p>
                        </div>

                        {/* Super Compact 5-Star Rating System - Above Price */}
                        {pkg.shared_id && flightTypeRatings[pkg.shared_id] && (
                          <div className="mb-3 pb-3 border-b border-foreground/10">
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
                                              <stop offset="50%" stopColor="rgb(234, 179, 8)" />
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
                                            fill={isFilled ? 'rgb(234, 179, 8)' : 'rgb(209, 213, 219)'}
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
                                <span className="text-xs md:text-sm font-bold text-foreground">
                                  {flightTypeRatings[pkg.shared_id].avgRating > 0 
                                    ? flightTypeRatings[pkg.shared_id].avgRating.toFixed(1) 
                                    : '0.0'}
                                </span>
                                <span className="text-[10px] text-foreground/50">
                                  ({flightTypeRatings[pkg.shared_id].count})
                                </span>
                              </div>

                              {/* Rate Button */}
                              <button
                                onClick={() => setFlightTypeRatings(prev => ({
                                  ...prev,
                                  [pkg.shared_id!]: {
                                    ...prev[pkg.shared_id!],
                                    showInput: !prev[pkg.shared_id!].showInput
                                  }
                                }))}
                                className="ml-auto px-2 py-1 text-[10px] font-medium bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-600 dark:text-yellow-500 rounded border border-yellow-500/20 hover:border-yellow-500/40 transition-all"
                              >
                                {flightTypeRatings[pkg.shared_id].userRating ? 'შეცვლა' : 'შეფასება'}
                              </button>
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
                        <div className="mb-4 pb-4 border-b border-foreground/10">
                          <div className="flex items-baseline gap-1.5 mb-1.5">
                            <span className="text-2xl md:text-3xl font-bold text-foreground">
                              {priceGel}
                            </span>
                            <span className="text-lg md:text-xl font-bold text-foreground/70">₾</span>
                            <span className="text-[10px] md:text-xs text-foreground/50">/ person</span>
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
                            <div className="h-px flex-1 bg-foreground/10"></div>
                            <p className="text-[10px] font-semibold text-foreground/50 uppercase tracking-wider">
                              შედის
                            </p>
                            <div className="h-px flex-1 bg-foreground/10"></div>
                          </div>
                          {pkg.features && (
                            <ul className="space-y-2.5">
                              {pkg.features.map((feature, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-foreground/70">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                                  <span className="leading-tight">{feature}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        {/* Action */}
                        <Link
                          href={`/${locale}/contact?package=${encodeURIComponent(pkg.name)}`}
                          className="w-full py-3 px-4 bg-foreground text-background rounded-lg font-semibold text-sm text-center hover:opacity-90 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 shadow-md"
                        >
                          {labels.bookNow}
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Divider */}
            {gallery.length > 0 && <div className="border-t border-foreground/10 my-6"></div>}

            {/* Gallery */}
            {gallery.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-foreground/60" />
                    {galleryDescription || labels.gallery}
                  </h3>
                  <span className="text-xs text-foreground/50 px-2 py-0.5 rounded bg-foreground/5">{gallery.length}</span>
                </div>
                
                <div className="columns-2 lg:columns-3 gap-2">
                  {gallery.map((image: any, index: number) => (
                    <div key={index} className="break-inside-avoid mb-2">
                      <button
                        onClick={() => setLightboxIndex(index)}
                        className="relative rounded-lg overflow-hidden border border-foreground/10 hover:border-foreground/20 hover:shadow-md transition-all group w-full cursor-pointer"
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
                            <ExternalLink className="w-5 h-5 text-foreground" />
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
            {videos.length > 0 && <div className="border-t border-foreground/10 my-6"></div>}

            {/* Videos */}
            {videos.length > 0 && (
              <section>
                <SectionTitle icon={Video} title={labels.videos} />
                
                {/* YouTube Style Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  
                  {/* Main Video Player - Left/Top */}
                  <div className="lg:col-span-2 space-y-2">
                    <div id="main-video-player" className="relative rounded-lg overflow-hidden border border-foreground/10 bg-black shadow-lg">
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
                      <div className="flex items-center gap-2 px-2 py-1 rounded bg-red-600/10 border border-red-600/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></div>
                        <span className="text-[10px] font-semibold text-red-600 uppercase tracking-wide">
                          {locale === 'en' ? 'Now Playing' : locale === 'ru' ? 'Играет' : 'მიმდინარე'}
                        </span>
                      </div>
                      <span className="text-xs text-foreground/60">
                        {activeVideoIndex + 1} / {videos.length}
                      </span>
                    </div>
                  </div>

                  {/* Playlist - Right/Bottom - Height matches main video */}
                  <div className="lg:col-span-1 lg:self-start">
                    <div className="rounded-lg border border-foreground/10 bg-foreground/[0.02] overflow-hidden max-h-[400px] lg:max-h-[360px] flex flex-col">
                      {/* Playlist Header */}
                      <div className="px-3 py-2 bg-foreground/5 border-b border-foreground/10 flex-shrink-0">
                        <h4 className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wide">
                          {locale === 'en' ? 'Playlist' : locale === 'ru' ? 'Плейлист' : 'პლეილისტი'}
                        </h4>
                      </div>
                      
                      {/* Playlist Items - Scrollable, fills remaining height */}
                      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-foreground/40 scrollbar-track-foreground/10 hover:scrollbar-thumb-foreground/60 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-foreground/5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-foreground/30 hover:[&::-webkit-scrollbar-thumb]:bg-foreground/50">
                        {videos.map((videoUrl: string, index: number) => {
                          const videoId = getYouTubeID(videoUrl);
                          if (!videoId) return null;

                          const isActive = index === activeVideoIndex;
                          const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

                          return (
                            <button
                              key={index}
                              onClick={() => setActiveVideoIndex(index)}
                              className={`w-full flex items-start gap-2 p-2 transition-all hover:bg-foreground/5 border-l-2 ${
                                isActive 
                                  ? 'bg-foreground/10 border-l-red-600' 
                                  : 'border-l-transparent hover:border-l-foreground/20'
                              }`}
                            >
                              {/* Thumbnail */}
                              <div className="relative w-28 flex-shrink-0 rounded overflow-hidden border border-foreground/10 group-hover:border-foreground/20">
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
                                    ? 'text-foreground font-semibold' 
                                    : 'text-foreground/70 hover:text-foreground'
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
            {location.map_iframe_url && <div className="border-t border-foreground/10 my-6"></div>}

            {/* Map */}
            {location.map_iframe_url && (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-foreground/60" />
                    {labels.map}
                  </h3>
                </div>
                <div className="rounded-lg border border-foreground/10 bg-foreground/[0.02] overflow-hidden h-[400px]">
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
            <div className="border-t border-foreground/10 my-6"></div>

            {/* Contact via Messaging Apps */}
            <div className="overflow-hidden rounded-xl border border-foreground/10 bg-foreground/[0.02] shadow-sm">
              {/* Header with Icon */}
              <div className="px-4 py-3 border-b border-foreground/10 bg-gradient-to-r from-foreground/[0.03] to-transparent">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-foreground/10">
                    <svg className="w-4 h-4 text-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-foreground">
                    კონტაქტი და ინფორმაცია
                  </h3>
                </div>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Info Text */}
                <div className="text-xs text-foreground/70 leading-relaxed space-y-2">
                  <p className="flex items-start gap-2">
                    <svg className="w-3.5 h-3.5 text-foreground/40 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span>ჩვენს პლატფორმაზე განთავსებულ ყველა ლოკაციას აქვს განსხვავებული ფრენის ღირებულება, პაკეტები და პირობები.</span>
                  </p>
                  <p className="pl-5">
                    ეწვიეთ{' '}
                    <Link 
                      href={`/${locale}/locations`}
                      className="font-semibold text-foreground hover:text-foreground/80 underline decoration-foreground/30 hover:decoration-foreground/60 transition-colors inline-flex items-center gap-1"
                    >
                      ლოკაციების გვერდს
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </Link>
                    , სადაც ყველა ლოკაცია დეტალურადაა განხილული, ან დაგვიკავშირდით პირდაპირ:
                  </p>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-foreground/10"></div>
                  <span className="text-[10px] font-semibold text-foreground/40 uppercase tracking-wider">მესენჯერები</span>
                  <div className="h-px flex-1 bg-foreground/10"></div>
                </div>

                {/* Messaging Apps */}
                <div className="flex items-center justify-center gap-3">
                  {/* WhatsApp */}
                  <a
                    href="https://wa.me/your-number"
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
                    href="viber://chat?number=your-number"
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
                    href="https://t.me/your-username"
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
              <div className="rounded-xl border-2 border-foreground/10 bg-foreground/[0.02] overflow-hidden shadow-lg">
                {/* Header */}
                <div className="bg-foreground text-background px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-background/20 backdrop-blur-sm">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-wide">
                      {labels.bookNow}
                    </h3>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                  {/* Icon & Text */}
                  <div className="text-center space-y-3">
                    <div className="flex justify-center">
                      <div className="p-3 rounded-full bg-foreground/10 border-2 border-foreground/20">
                        <Wind className="w-8 h-8 text-foreground" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-sm font-bold text-foreground">
                        მზად ხართ თავგადასავლისთვის?
                      </h4>
                      <p className="text-[11px] text-foreground/70 leading-relaxed">
                        განიცადეთ ფრენის შეუდარებელი გამოცდილება {locationName}-ში. დაჯავშნეთ ახლავე!
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
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-foreground text-background hover:bg-foreground/90 rounded-lg font-semibold text-sm transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
                    >
                      <Calendar className="w-4 h-4" />
                      {labels.bookNow}
                    </button>
                    
                    <Link
                      href={`/${locale}/contact`}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-background border border-foreground/10 text-foreground hover:bg-foreground/5 rounded-lg font-semibold text-sm transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {labels.contact}
                    </Link>
                  </div>

                  {/* Stats */}
                  <div className="pt-4 border-t border-foreground/10 grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-[10px] text-foreground/40 uppercase tracking-wider font-semibold mb-1">ფრენები</p>
                      <p className="text-sm font-bold">{flightTypes.length}</p>
                    </div>
                    <div className="text-center border-l border-foreground/10">
                      <p className="text-[10px] text-foreground/40 uppercase tracking-wider font-semibold mb-1">ფოტოები</p>
                      <p className="text-sm font-bold">{gallery.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Info / Weather Placeholder */}
              <div className="p-5 rounded-lg border border-foreground/10 bg-foreground/[0.02]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground/50">საუკეთესო სეზონი</p>
                    <p className="text-sm font-semibold">მთელი წელი</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                    <Wind className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground/50">ფრენის პირობები</p>
                    <p className="text-sm font-semibold">თერმული და დინამიური</p>
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
        <div className="backdrop-blur-xl bg-background/80 border border-foreground/10 rounded-2xl p-8 shadow-2xl">
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
        title={locale === 'ka' ? 'შეაფასეთ ლოკაცია' : locale === 'ru' ? 'Оцените локацию' : 'Rate Location'}
        subtitle={locale === 'ka' ? 'თქვენი აზრი ძალიან მნიშვნელოვანია' : locale === 'ru' ? 'Ваше мнение очень важно' : 'Your opinion matters'}
      />

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
