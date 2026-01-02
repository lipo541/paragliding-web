'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import RatingModal from '@/components/rating/RatingModal';
import CommentsList from '@/components/comments/CommentsList';
import LocationSelectModal from './LocationSelectModal';
import FlightTypeModal from './FlightTypeModal';
import { useCart } from '@/lib/context/CartContext';
import Breadcrumbs, { breadcrumbLabels, type Locale as BreadcrumbLocale } from '@/components/shared/Breadcrumbs';
import { PilotServicesSection } from './components';
import {
  User, MapPin, Calendar, Award, Plane, Languages, Building2, Star,
  Play, X, ChevronLeft, ChevronRight, Shield, CheckCircle2, Clock,
  Image as ImageIcon, Video, MessageCircle, Share2, Mail, Phone,
  Wind, Umbrella, Users, Globe, Heart, ShoppingCart, Plus, Minus
} from 'lucide-react';
import { LANGUAGE_NAMES, type SupportedLanguage } from '@/lib/types/pilot';
import { QRCodeSVG } from 'qrcode.react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface PilotData {
  id: string;
  user_id: string;
  // Slugs
  slug_ka?: string | null;
  slug_en?: string | null;
  // Names (multi-language)
  first_name_ka?: string | null;
  first_name_en?: string | null;
  first_name_ru?: string | null;
  first_name_de?: string | null;
  first_name_tr?: string | null;
  first_name_ar?: string | null;
  last_name_ka?: string | null;
  last_name_en?: string | null;
  last_name_ru?: string | null;
  last_name_de?: string | null;
  last_name_tr?: string | null;
  last_name_ar?: string | null;
  // Profile
  avatar_url?: string | null;
  cover_image_url?: string | null;
  birth_date?: string | null;
  gender?: string | null;
  phone: string;
  email: string;
  // Bio (multi-language)
  bio_ka?: string | null;
  bio_en?: string | null;
  bio_ru?: string | null;
  bio_de?: string | null;
  bio_tr?: string | null;
  bio_ar?: string | null;
  // Experience
  commercial_start_date?: string | null;
  total_flights?: number | null;
  tandem_flights?: number | null;
  // Equipment
  wing_brand?: string | null;
  wing_model?: string | null;
  pilot_harness_brand?: string | null;
  pilot_harness_model?: string | null;
  passenger_harness_brand?: string | null;
  passenger_harness_model?: string | null;
  reserve_brand?: string | null;
  reserve_model?: string | null;
  // Media
  gallery_images?: any[] | null;
  video_urls?: string[] | null;
  // Status & Rating
  status: string;
  languages?: SupportedLanguage[] | null;
  cached_rating?: number | null;
  cached_rating_count?: number | null;
  // Relations
  company?: {
    id: string;
    name_ka?: string | null;
    name_en?: string | null;
    logo_url?: string | null;
    slug_ka?: string | null;
  } | null;
  locations?: {
    id: string;
    name_ka: string;
    name_en: string;
    slug_ka: string;
    country?: { name_ka: string; name_en: string; slug_ka: string } | null;
  }[] | null;
}

interface Props {
  pilotSlug: string;
  locale: string;
  initialData?: { pilot: PilotData | null };
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

const getName = (p: PilotData, l: string): string => {
  const localeKey = l as 'ka' | 'en' | 'ru' | 'de' | 'tr' | 'ar';
  const fn = p[`first_name_${localeKey}` as keyof PilotData] as string || p.first_name_ka || p.first_name_en || '';
  const ln = p[`last_name_${localeKey}` as keyof PilotData] as string || p.last_name_ka || p.last_name_en || '';
  return `${fn} ${ln}`.trim() || (l === 'ka' ? 'პილოტი' : 'Pilot');
};

const getBio = (p: PilotData, l: string): string => {
  const localeKey = l as 'ka' | 'en' | 'ru' | 'de' | 'tr' | 'ar';
  return (p[`bio_${localeKey}` as keyof PilotData] as string) || p.bio_ka || p.bio_en || '';
};

const getExp = (d?: string | null): number => {
  if (!d) return 0;
  return Math.floor((Date.now() - new Date(d).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
};

const getAge = (d?: string | null): number | null => {
  if (!d) return null;
  return Math.floor((Date.now() - new Date(d).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
};

const ytEmbed = (url: string) => {
  const m = url.match(/^.*(youtu.be\/|v\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
  return m?.[2]?.length === 11 ? `https://www.youtube.com/embed/${m[2]}` : null;
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function PilotDetailPage({ pilotSlug, locale, initialData }: Props) {
  const [pilot, setPilot] = useState<PilotData | null>(initialData?.pilot ?? null);
  const [loading, setLoading] = useState(!initialData?.pilot);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [videoIdx, setVideoIdx] = useState(0);
  const [ratingModal, setRatingModal] = useState(false);
  const [qrModal, setQrModal] = useState(false);
  const [avatarModal, setAvatarModal] = useState(false);
  
  // Build profile URL statically to avoid hydration mismatch
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://flygeorgia.co';
  const pilotSlugForUrl = pilot?.slug_ka || pilot?.slug_en || pilotSlug;
  const profileUrl = `${baseUrl}/${locale}/pilot/${pilotSlugForUrl}`;
  
  // Cart state
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showFlightTypeModal, setShowFlightTypeModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ id: string; name_ka: string; name_en: string } | null>(null);

  // Fetch pilot data
  useEffect(() => {
    if (initialData?.pilot) return;
    const load = async () => {
      const sb = createClient();
      const { data } = await sb
        .from('pilots')
        .select(`*, company:companies(id, name_ka, name_en, logo_url, slug_ka)`)
        .or(`slug_ka.eq.${pilotSlug},slug_en.eq.${pilotSlug},id.eq.${pilotSlug}`)
        .single();
      
      if (data?.location_ids?.length) {
        const { data: locs } = await sb
          .from('locations')
          .select('id, name_ka, name_en, slug_ka, country:countries(name_ka, name_en, slug_ka)')
          .in('id', data.location_ids);
        data.locations = locs;
      }
      setPilot(data);
      setLoading(false);
    };
    load();
  }, [pilotSlug, initialData]);

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-[3px] border-zinc-200 dark:border-zinc-800 border-t-[#4697D2] animate-spin" />
          <span className="text-sm text-zinc-400">{locale === 'ka' ? 'იტვირთება...' : 'Loading...'}</span>
        </div>
      </div>
    );
  }

  // Not found
  if (!pilot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
            <User className="w-10 h-10 text-zinc-300 dark:text-zinc-700" />
          </div>
          <p className="text-zinc-500 mb-4">{locale === 'ka' ? 'პილოტი ვერ მოიძებნა' : 'Pilot not found'}</p>
          <Link href={`/${locale}`} className="text-[#4697D2] hover:underline text-sm">
            {locale === 'ka' ? '← მთავარზე დაბრუნება' : '← Back to Home'}
          </Link>
        </div>
      </div>
    );
  }

  // Cart handlers
  const locationIds = pilot.locations?.map(loc => loc.id) || [];
  const hasLocations = locationIds.length > 0;
  const hasMultipleLocations = locationIds.length > 1;

  const handleAddToCartClick = () => {
    if (!hasLocations) return;
    
    if (hasMultipleLocations) {
      setShowLocationModal(true);
    } else if (pilot.locations?.[0]) {
      setSelectedLocation(pilot.locations[0]);
      setShowFlightTypeModal(true);
    }
  };

  const handleLocationSelect = (location: { id: string; name_ka: string; name_en: string }) => {
    setSelectedLocation(location);
    setShowLocationModal(false);
    setShowFlightTypeModal(true);
  };

  const handleFlightTypeSelect = (flightType: { shared_id: string; name_ka?: string; name_en?: string; price_gel?: number }) => {
    if (!selectedLocation || !pilot) return;
    
    const pilotName = getName(pilot, locale);
    const flightTypeName = (locale === 'ka' ? flightType.name_ka : flightType.name_en) || flightType.name_ka || '';
    const locationName = (locale === 'ka' ? selectedLocation.name_ka : selectedLocation.name_en) || selectedLocation.name_ka || '';
    const compName = pilot.company ? (locale === 'ka' ? pilot.company.name_ka : pilot.company.name_en) : null;
    
    addItem({
      type: flightType.shared_id,
      name: flightTypeName,
      price: flightType.price_gel || 0,
      quantity: quantity,
      pilot: {
        id: pilot.id,
        name: pilotName,
        avatarUrl: pilot.avatar_url || undefined,
      },
      company: pilot.company ? {
        id: pilot.company.id,
        name: compName || '',
        logoUrl: pilot.company.logo_url || undefined,
      } : undefined,
      location: {
        id: selectedLocation.id,
        name: locationName,
      },
    });
    
    setShowFlightTypeModal(false);
    setSelectedLocation(null);
    setQuantity(1);
  };

  // Data
  const name = getName(pilot, locale);
  const bio = getBio(pilot, locale);
  const exp = getExp(pilot.commercial_start_date);
  const age = getAge(pilot.birth_date);
  const rating = pilot.cached_rating || 0;
  const reviews = pilot.cached_rating_count || 0;
  const verified = pilot.status === 'verified';
  const gallery = pilot.gallery_images || [];
  const videos = pilot.video_urls || [];
  const companyName = pilot.company ? (locale === 'ka' ? pilot.company.name_ka : pilot.company.name_en) : null;

  // Equipment list
  const equipment = [
    { icon: Wind, label: locale === 'ka' ? 'ფრთა' : 'Wing', value: [pilot.wing_brand, pilot.wing_model].filter(Boolean).join(' ') },
    { icon: User, label: locale === 'ka' ? 'პილოტის აღკაზმულობა' : 'Pilot Harness', value: [pilot.pilot_harness_brand, pilot.pilot_harness_model].filter(Boolean).join(' ') },
    { icon: Users, label: locale === 'ka' ? 'მგზავრის აღკაზმულობა' : 'Passenger Harness', value: [pilot.passenger_harness_brand, pilot.passenger_harness_model].filter(Boolean).join(' ') },
    { icon: Umbrella, label: locale === 'ka' ? 'სარეზერვო პარაშუტი' : 'Reserve Parachute', value: [pilot.reserve_brand, pilot.reserve_model].filter(Boolean).join(' ') },
  ].filter(e => e.value);

  // Stats
  const stats = [
    { value: exp, label: locale === 'ka' ? 'წლის გამოცდილება' : 'Years Experience', show: exp > 0 },
    { value: pilot.tandem_flights?.toLocaleString() || '0', label: locale === 'ka' ? 'ტანდემ ფრენა' : 'Tandem Flights', show: (pilot.tandem_flights ?? 0) > 0 },
    { value: pilot.total_flights?.toLocaleString() || '0', label: locale === 'ka' ? 'სულ ფრენა' : 'Total Flights', show: (pilot.total_flights ?? 0) > 0 },
  ].filter(s => s.show);

  return (
    <div className="min-h-screen">
      
      {/* ═══════════════════════════════════════════════════════════════════
          HERO SECTION - Full Width Cover (Behind Header)
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative -mt-20">
        {/* Cover Image - Extended to go behind header */}
        <div className="relative h-[280px] sm:h-[360px] lg:h-[440px] w-full overflow-hidden">
          {pilot.cover_image_url ? (
            <Image
              src={pilot.cover_image_url}
              alt=""
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#4697D2] via-[#4697D2]/80 to-[#CAFA00]/30 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-50 dark:from-zinc-950 via-transparent to-black/20" />
          
          {/* Pattern Overlay */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </div>

        {/* Breadcrumbs */}
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <Breadcrumbs 
            items={[
              { label: breadcrumbLabels[locale as BreadcrumbLocale]?.home || 'Home', href: `/${locale}` },
              { label: breadcrumbLabels[locale as BreadcrumbLocale]?.pilots || 'Pilots', href: `/${locale}/pilots` },
              { label: name }
            ]} 
          />
        </div>

        {/* Profile Card - Overlapping */}
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 -mt-16 sm:-mt-20 relative z-10">
          <div className="bg-[rgba(70,151,210,0.15)] dark:bg-black/40 backdrop-blur-xl rounded-xl shadow-xl shadow-black/10 dark:shadow-black/30 border border-[#4697D2]/30 dark:border-white/10 overflow-hidden">
            
            {/* Profile Header */}
            <div className="p-4 sm:p-5 lg:p-6 relative">
              {/* Mobile QR Button - Top Right Corner */}
              <button
                onClick={() => setQrModal(true)}
                className="lg:hidden absolute top-3 right-3 p-2 rounded-lg bg-white/50 dark:bg-white/10 border border-[#4697D2]/20 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/20 transition-colors"
                title={locale === 'ka' ? 'QR კოდი' : 'QR Code'}
              >
                <svg className="w-5 h-5 text-zinc-700 dark:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="3" height="3" />
                  <rect x="18" y="14" width="3" height="3" />
                  <rect x="14" y="18" width="3" height="3" />
                  <rect x="18" y="18" width="3" height="3" />
                </svg>
              </button>

              <div className="flex flex-col lg:flex-row lg:items-start gap-6 lg:gap-8">
                
                {/* Avatar + QR Code */}
                <div className="flex-shrink-0 mx-auto lg:mx-0 flex flex-col items-center gap-3">
                  <button 
                    onClick={() => pilot.avatar_url && setAvatarModal(true)}
                    className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border-2 border-[#4697D2]/30 dark:border-white/20 hover:border-[#4697D2] dark:hover:border-[#CAFA00] transition-colors cursor-pointer"
                    disabled={!pilot.avatar_url}
                  >
                    {pilot.avatar_url ? (
                      <Image src={pilot.avatar_url} alt={name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-10 h-10 text-zinc-300 dark:text-zinc-600" />
                      </div>
                    )}
                  </button>
                  
                  {/* QR Code - Desktop only */}
                  <div className="hidden lg:flex flex-col items-center gap-1.5">
                    <button 
                      onClick={() => setQrModal(true)}
                      className="p-2 bg-white rounded-lg shadow-sm hover:shadow-md hover:scale-105 transition-all cursor-pointer"
                      title={locale === 'ka' ? 'დააჭირე გასადიდებლად' : 'Click to enlarge'}
                    >
                      <QRCodeSVG 
                        value={profileUrl}
                        size={72}
                        level="M"
                        bgColor="#ffffff"
                        fgColor="#18181b"
                      />
                    </button>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                      {locale === 'ka' ? 'სკანირება' : 'Scan to share'}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 text-center lg:text-left">
                  {/* Name & Verified */}
                  <div className="flex items-center justify-center lg:justify-start gap-2 mb-3">
                    <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
                      {name}
                    </h1>
                    {verified && (
                      <>
                        {/* Mobile: Just icon */}
                        <span className="lg:hidden flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white" title={locale === 'ka' ? 'ვერიფიცირებული' : 'Verified'}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </span>
                        {/* Desktop: Full badge */}
                        <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          {locale === 'ka' ? 'ვერიფიცირებული' : 'Verified Pilot'}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Company */}
                  {pilot.company && (
                    <Link
                      href={`/${locale}/company/${pilot.company.slug_ka || pilot.company.id}`}
                      className="inline-flex items-center gap-2 mb-3 text-zinc-600 dark:text-zinc-400 hover:text-[#4697D2] dark:hover:text-[#4697D2] transition-colors group"
                    >
                      {pilot.company.logo_url ? (
                        <Image src={pilot.company.logo_url} alt="" width={18} height={18} className="rounded" />
                      ) : (
                        <Building2 className="w-4 h-4" />
                      )}
                      <span className="text-sm font-medium group-hover:underline">{companyName}</span>
                    </Link>
                  )}

                  {/* Locations */}
                  {pilot.locations && pilot.locations.length > 0 && (
                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-4">
                      <MapPin className="w-4 h-4 text-zinc-400" />
                      {pilot.locations.map((loc, i) => (
                        <span key={loc.id}>
                          <Link
                            href={`/${locale}/locations/${loc.slug_ka}`}
                            className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-[#4697D2] dark:hover:text-[#4697D2] transition-colors"
                          >
                            {locale === 'ka' ? loc.name_ka : loc.name_en}
                          </Link>
                          {i < pilot.locations!.length - 1 && <span className="text-zinc-300 dark:text-zinc-700">, </span>}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Rating - 5 Stars Display */}
                  <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                    <button
                      onClick={() => setRatingModal(true)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/30 dark:bg-white/10 border border-[#4697D2]/20 dark:border-white/10 hover:bg-white/50 dark:hover:bg-white/20 transition-colors"
                    >
                      {/* 5 Stars */}
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const fillPercent = Math.min(100, Math.max(0, (rating - star + 1) * 100));
                          return (
                            <div key={star} className="relative w-4 h-4">
                              {/* Empty star background */}
                              <Star className="absolute inset-0 w-4 h-4 text-zinc-300 dark:text-zinc-600" />
                              {/* Filled star overlay with clip */}
                              {fillPercent > 0 && (
                                <div 
                                  className="absolute inset-0 overflow-hidden" 
                                  style={{ width: `${fillPercent}%` }}
                                >
                                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {rating > 0 ? (
                        <>
                          <span className="text-sm font-bold text-zinc-900 dark:text-white">{rating.toFixed(1)}</span>
                          <span className="text-xs text-zinc-600 dark:text-zinc-300">({reviews})</span>
                        </>
                      ) : (
                        <span className="text-xs text-zinc-600 dark:text-zinc-300">{locale === 'ka' ? 'შეაფასე პირველმა' : 'Be first to rate'}</span>
                      )}
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2">
                    <Link
                      href={`/${locale}/bookings?pilot=${pilot.id}`}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#4697D2] hover:bg-[#3a7fb8] dark:bg-[#CAFA00] dark:hover:bg-[#b8e600] text-white dark:text-black text-sm font-semibold transition-all shadow-md shadow-[#4697D2]/25 dark:shadow-[#CAFA00]/25 hover:shadow-lg hover:-translate-y-0.5"
                    >
                      <Calendar className="w-4 h-4" />
                      {locale === 'ka' ? 'ფრენის დაჯავშნა' : 'Book a Flight'}
                    </Link>
                    
                    {/* Add to Cart Button */}
                    {hasLocations && (
                      <div className="w-full sm:w-auto flex items-center gap-1">
                        {/* Quantity selector */}
                        <div className="flex items-center gap-0.5 bg-white/50 dark:bg-white/10 rounded-lg p-0.5 border border-[#4697D2]/20 dark:border-white/10">
                          <button
                            onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-[#4697D2]/10 text-zinc-700 dark:text-white transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-6 text-center text-sm font-medium text-zinc-900 dark:text-white">{quantity}</span>
                          <button
                            onClick={() => setQuantity(prev => Math.min(10, prev + 1))}
                            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-[#4697D2]/10 text-zinc-700 dark:text-white transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <button
                          onClick={handleAddToCartClick}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-all shadow-md shadow-emerald-500/25 hover:shadow-lg hover:-translate-y-0.5"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          {locale === 'ka' ? 'კალათაში' : 'Add to Cart'}
                        </button>
                      </div>
                    )}
                    
                    <button
                      onClick={() => navigator.share?.({ title: name, url: location.href }) || navigator.clipboard.writeText(location.href)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-white/30 dark:bg-white/10 border border-[#4697D2]/20 dark:border-white/10 hover:bg-white/50 dark:hover:bg-white/20 text-zinc-700 dark:text-zinc-300 text-sm font-medium transition-all"
                    >
                      <Share2 className="w-4 h-4" />
                      {locale === 'ka' ? 'გაზიარება' : 'Share'}
                    </button>
                  </div>
                </div>

                {/* Stats - Desktop */}
                {stats.length > 0 && (
                  <div className="hidden lg:flex flex-col gap-2 min-w-[140px]">
                    {stats.map((stat, i) => (
                      <div key={i} className="text-center p-3 rounded-xl bg-white/30 dark:bg-white/5 border border-[#4697D2]/20 dark:border-white/10">
                        <div className="text-xl font-bold text-zinc-900 dark:text-white">{stat.value}</div>
                        <div className="text-[10px] text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stats - Mobile */}
              {stats.length > 0 && (
                <div className="flex lg:hidden justify-center gap-3 mt-4 pt-4 border-t border-[#4697D2]/20 dark:border-white/10">
                  {stats.map((stat, i) => (
                    <div key={i} className="text-center flex-1 max-w-[100px]">
                      <div className="text-lg font-bold text-zinc-900 dark:text-white">{stat.value}</div>
                      <div className="text-[9px] text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">{stat.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN CONTENT - Two Column Layout
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          
          {/* ═══════════════════════════════════════════════════════════════
              LEFT COLUMN - Main Content
          ═══════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-2 space-y-4 order-2 lg:order-1">
            
            {/* About */}
            {bio && (
              <div className="bg-[rgba(70,151,210,0.15)] dark:bg-black/40 backdrop-blur-xl rounded-xl shadow-xl shadow-black/10 dark:shadow-black/30 border border-[#4697D2]/30 dark:border-white/10 p-4">
                <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-white mb-3">
                  <User className="w-4 h-4 text-[#4697D2] dark:text-[#CAFA00]" />
                  {locale === 'ka' ? 'ჩემს შესახებ' : 'About Me'}
                </h2>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                  {bio}
                </p>
              </div>
            )}

            {/* Gallery */}
            {gallery.length > 0 && (
              <div className="bg-[rgba(70,151,210,0.15)] dark:bg-black/40 backdrop-blur-xl rounded-xl shadow-xl shadow-black/10 dark:shadow-black/30 border border-[#4697D2]/30 dark:border-white/10 p-4">
                <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-white mb-3">
                  <ImageIcon className="w-4 h-4 text-[#4697D2] dark:text-[#CAFA00]" />
                  {locale === 'ka' ? 'ფოტო გალერეა' : 'Photo Gallery'}
                  <span className="ml-auto text-xs px-2 py-0.5 rounded bg-[rgba(70,151,210,0.2)] dark:bg-black/50 text-zinc-600 dark:text-white/80">{gallery.length}</span>
                </h2>
                
                {/* Masonry Gallery - Like LocationPage */}
                <div className="columns-2 lg:columns-3 gap-2">
                  {gallery.map((img, i) => (
                    <div key={i} className="break-inside-avoid mb-2">
                      <button
                        onClick={() => setLightbox(i)}
                        className="relative rounded-lg overflow-hidden border border-[#4697D2]/30 dark:border-white/10 hover:border-[#4697D2]/50 dark:hover:border-white/20 hover:shadow-md transition-all group w-full cursor-pointer"
                      >
                        <Image
                          src={typeof img === 'string' ? img : img.url}
                          alt=""
                          width={600}
                          height={400}
                          className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {/* Zoom icon overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-white/0 group-hover:bg-white/90 flex items-center justify-center transition-all scale-0 group-hover:scale-100">
                            <ImageIcon className="w-4 h-4 text-zinc-800" />
                          </div>
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Videos */}
            {videos.length > 0 && (
              <div className="bg-[rgba(70,151,210,0.15)] dark:bg-black/40 backdrop-blur-xl rounded-xl shadow-xl shadow-black/10 dark:shadow-black/30 border border-[#4697D2]/30 dark:border-white/10 p-4">
                <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-white mb-3">
                  <Video className="w-4 h-4 text-[#4697D2] dark:text-[#CAFA00]" />
                  {locale === 'ka' ? 'ვიდეოები' : 'Videos'}
                  <span className="ml-auto text-xs px-2 py-0.5 rounded bg-[rgba(70,151,210,0.2)] dark:bg-black/50 text-zinc-600 dark:text-white/80">{videos.length}</span>
                </h2>
                
                {/* YouTube Style Layout - Like LocationPage */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  {/* Main Video Player */}
                  <div className="lg:col-span-2 space-y-2">
                    <div className="relative rounded-lg overflow-hidden border border-white/20 bg-black shadow-lg">
                      <div className="relative aspect-video">
                        {ytEmbed(videos[videoIdx]) ? (
                          <iframe
                            key={videoIdx}
                            src={ytEmbed(videos[videoIdx])!}
                            title={`Video ${videoIdx + 1}`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="absolute inset-0 w-full h-full"
                          />
                        ) : (
                          <video src={videos[videoIdx]} controls className="absolute inset-0 w-full h-full object-contain" />
                        )}
                      </div>
                    </div>
                    
                    {/* Now Playing Info */}
                    <div className="flex items-center gap-2 px-1">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-600/20 border border-red-600/30">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[9px] font-semibold text-red-400 uppercase tracking-wide">
                          {locale === 'ka' ? 'მიმდინარე' : 'Now Playing'}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-500 dark:text-white/80">{videoIdx + 1} / {videos.length}</span>
                    </div>
                  </div>

                  {/* Playlist */}
                  {videos.length > 1 && (
                    <div className="lg:col-span-1 lg:self-start">
                      <div className="rounded-lg overflow-hidden max-h-[280px] lg:max-h-[240px] flex flex-col border border-[#4697D2]/30 dark:border-white/10 bg-[rgba(70,151,210,0.1)] dark:bg-black/30">
                        {/* Playlist Header */}
                        <div className="px-3 py-2 bg-[rgba(70,151,210,0.15)] dark:bg-black/50 border-b border-[#4697D2]/30 dark:border-white/10 flex-shrink-0">
                          <h4 className="text-[10px] font-semibold text-zinc-700 dark:text-white uppercase tracking-wide">
                            {locale === 'ka' ? 'პლეილისტი' : 'Playlist'}
                          </h4>
                        </div>
                        
                        {/* Playlist Items */}
                        <div className="flex-1 overflow-y-auto">
                          {videos.map((videoUrl, i) => {
                            const videoId = ytEmbed(videoUrl)?.split('/embed/')[1];
                            const isActive = i === videoIdx;
                            const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : '';

                            return (
                              <button
                                key={i}
                                onClick={() => setVideoIdx(i)}
                                className={`w-full flex items-start gap-2 p-2 transition-all hover:bg-[rgba(70,151,210,0.15)] dark:hover:bg-black/50 border-l-2 ${
                                  isActive 
                                    ? 'bg-[rgba(70,151,210,0.2)] dark:bg-black/60 border-l-red-600' 
                                    : 'border-l-transparent hover:border-l-[#4697D2]/50'
                                }`}
                              >
                                {/* Thumbnail */}
                                <div className="relative w-20 flex-shrink-0 rounded overflow-hidden border border-[#4697D2]/30 dark:border-white/10">
                                  <div className="relative aspect-video bg-black">
                                    {thumbnailUrl && (
                                      <img src={thumbnailUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                                    )}
                                    {/* Play overlay */}
                                    <div className={`absolute inset-0 flex items-center justify-center ${isActive ? 'bg-black/50' : 'bg-black/30'}`}>
                                      {isActive ? (
                                        <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-red-600 text-white">
                                          <span className="text-[7px] font-bold">▶</span>
                                        </div>
                                      ) : (
                                        <Play className="w-4 h-4 text-white" />
                                      )}
                                    </div>
                                    {/* Number badge */}
                                    <div className="absolute top-0.5 left-0.5 px-1 py-0.5 rounded bg-black/80">
                                      <span className="text-[8px] text-white font-bold">{i + 1}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Video title */}
                                <div className="flex-1 min-w-0 text-left">
                                  <p className={`text-[10px] font-medium truncate ${isActive ? 'text-[#4697D2] dark:text-[#CAFA00]' : 'text-zinc-700 dark:text-white'}`}>
                                    {locale === 'ka' ? 'ვიდეო' : 'Video'} {i + 1}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Additional Services */}
            <PilotServicesSection pilotId={pilot.id} locale={locale} />

            {/* Reviews */}
            <div className="bg-[rgba(70,151,210,0.15)] dark:bg-black/40 backdrop-blur-xl rounded-xl shadow-xl shadow-black/10 dark:shadow-black/30 border border-[#4697D2]/30 dark:border-white/10 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-white">
                  <MessageCircle className="w-4 h-4 text-[#4697D2] dark:text-[#CAFA00]" />
                  {locale === 'ka' ? 'შეფასებები' : 'Reviews'}
                </h2>
                <button
                  onClick={() => setRatingModal(true)}
                  className="px-3 py-1.5 rounded-md bg-[#4697D2]/10 dark:bg-[#4697D2]/20 text-[#4697D2] text-xs font-semibold hover:bg-[#4697D2]/20 dark:hover:bg-[#4697D2]/30 transition-colors"
                >
                  {locale === 'ka' ? '+ დაწერე შეფასება' : '+ Write Review'}
                </button>
              </div>
              <CommentsList commentableType="location" commentableId={pilot.id} />
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              RIGHT COLUMN - Sidebar
          ═══════════════════════════════════════════════════════════════ */}
          <div className="space-y-4 order-1 lg:order-2">
            
            {/* Quick Info Card */}
            <div className="bg-[rgba(70,151,210,0.15)] dark:bg-black/40 backdrop-blur-xl rounded-xl shadow-xl shadow-black/10 dark:shadow-black/30 border border-[#4697D2]/30 dark:border-white/10 p-4 sticky top-20">
              
              {/* Languages */}
              {pilot.languages && pilot.languages.length > 0 && (
                <div className="mb-4">
                  <h3 className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900 dark:text-white mb-2">
                    <Languages className="w-3.5 h-3.5 text-[#4697D2] dark:text-[#CAFA00]" />
                    {locale === 'ka' ? 'კომუნიკაციის ენები' : 'Languages'}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {pilot.languages.map((lang) => (
                      <span
                        key={lang}
                        className="px-2 py-1 rounded-md bg-white/30 dark:bg-white/10 border border-[#4697D2]/20 dark:border-white/10 text-xs text-zinc-700 dark:text-zinc-300"
                      >
                        {LANGUAGE_NAMES[lang]?.[locale as 'ka' | 'en'] || lang.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Equipment */}
              {equipment.length > 0 && (
                <div className="mb-4">
                  <h3 className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900 dark:text-white mb-2">
                    <Shield className="w-3.5 h-3.5 text-[#4697D2] dark:text-[#CAFA00]" />
                    {locale === 'ka' ? 'ეკიპირება' : 'Equipment'}
                  </h3>
                  <div className="space-y-2">
                    {equipment.map((eq, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-md bg-white/30 dark:bg-white/10 border border-[#4697D2]/20 dark:border-white/10 flex items-center justify-center flex-shrink-0">
                          <eq.icon className="w-3 h-3 text-[#4697D2] dark:text-[#CAFA00]" />
                        </div>
                        <div>
                          <div className="text-[10px] text-zinc-700 dark:text-zinc-200 uppercase tracking-wider">{eq.label}</div>
                          <div className="text-xs font-medium text-zinc-900 dark:text-white">{eq.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Info */}
              <div className="pt-3 border-t border-[#4697D2]/20 dark:border-white/10 space-y-2">
                {age && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-600 dark:text-zinc-300">{locale === 'ka' ? 'ასაკი' : 'Age'}</span>
                    <span className="font-medium text-zinc-800 dark:text-white">{age} {locale === 'ka' ? 'წელი' : 'years'}</span>
                  </div>
                )}
                {pilot.gender && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-600 dark:text-zinc-300">{locale === 'ka' ? 'სქესი' : 'Gender'}</span>
                    <span className="font-medium text-zinc-800 dark:text-white">
                      {pilot.gender === 'male' ? (locale === 'ka' ? 'მამრობითი' : 'Male') : 
                       pilot.gender === 'female' ? (locale === 'ka' ? 'მდედრობითი' : 'Female') : pilot.gender}
                    </span>
                  </div>
                )}
                {pilot.commercial_start_date && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-600 dark:text-zinc-300">{locale === 'ka' ? 'კომერციული საქმიანობა' : 'Commercial since'}</span>
                    <span className="font-medium text-zinc-800 dark:text-white">{new Date(pilot.commercial_start_date).getFullYear()}</span>
                  </div>
                )}
              </div>

              {/* CTA */}
              <div className="mt-4">
                <Link
                  href={`/${locale}/bookings?pilot=${pilot.id}`}
                  className="block w-full py-2 text-center text-sm rounded-lg bg-gradient-to-r from-[#4697D2] to-[#3a7fb8] dark:from-[#CAFA00] dark:to-[#b8e600] text-white dark:text-black font-semibold shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
                >
                  {locale === 'ka' ? 'დაჯავშნე ახლავე' : 'Book Now'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          LIGHTBOX
      ═══════════════════════════════════════════════════════════════════ */}
      {lightbox !== null && gallery.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center" onClick={() => setLightbox(null)}>
          <button onClick={() => setLightbox(null)} className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <X className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setLightbox((lightbox - 1 + gallery.length) % gallery.length); }}
            className="absolute left-6 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="w-8 h-8 text-white" />
          </button>
          <div className="relative max-w-5xl max-h-[85vh] w-full h-full mx-4" onClick={(e) => e.stopPropagation()}>
            <Image
              src={typeof gallery[lightbox] === 'string' ? gallery[lightbox] : gallery[lightbox].url}
              alt=""
              fill
              className="object-contain"
            />
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setLightbox((lightbox + 1) % gallery.length); }}
            className="absolute right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ChevronRight className="w-8 h-8 text-white" />
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 text-white text-sm">
            {lightbox + 1} / {gallery.length}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          RATING MODAL
      ═══════════════════════════════════════════════════════════════════ */}
      {ratingModal && (
        <RatingModal
          isOpen={ratingModal}
          onClose={() => setRatingModal(false)}
          ratableType="pilot"
          ratableId={pilot.id}
          title={locale === 'ka' ? `შეაფასე ${name}` : `Rate ${name}`}
          subtitle={locale === 'ka' ? 'შენი გამოცდილება მნიშვნელოვანია' : 'Your feedback matters'}
          onRatingChange={() => { setRatingModal(false); window.location.reload(); }}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          QR CODE MODAL
      ═══════════════════════════════════════════════════════════════════ */}
      {qrModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setQrModal(false)}
        >
          <div 
            className="relative bg-white rounded-2xl p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setQrModal(false)}
              className="absolute -top-3 -right-3 p-2 rounded-full bg-zinc-800 text-white hover:bg-zinc-700 transition-colors shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center gap-4">
              <QRCodeSVG 
                value={profileUrl}
                size={200}
                level="H"
                bgColor="#ffffff"
                fgColor="#18181b"
              />
              <div className="text-center">
                <p className="text-lg font-semibold text-zinc-800">{name}</p>
                <p className="text-sm text-zinc-500">
                  {locale === 'ka' ? 'დაასკანერე გასაზიარებლად' : 'Scan to share this profile'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          AVATAR MODAL
      ═══════════════════════════════════════════════════════════════════ */}
      {avatarModal && pilot.avatar_url && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setAvatarModal(false)}
        >
          <button
            onClick={() => setAvatarModal(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <div className="relative w-[90vw] h-[90vw] max-w-[500px] max-h-[500px] rounded-2xl overflow-hidden">
            <Image 
              src={pilot.avatar_url} 
              alt={name} 
              fill 
              className="object-cover"
            />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          CART MODALS
      ═══════════════════════════════════════════════════════════════════ */}
      {/* Location Select Modal */}
      <LocationSelectModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSelect={handleLocationSelect}
        locationIds={locationIds}
        locale={locale}
        pilotName={name}
      />
      
      {/* Flight Type Modal */}
      {selectedLocation && (
        <FlightTypeModal
          isOpen={showFlightTypeModal}
          onClose={() => {
            setShowFlightTypeModal(false);
            setSelectedLocation(null);
          }}
          onSelect={handleFlightTypeSelect}
          locationId={selectedLocation.id}
          locale={locale}
          pilotName={name}
        />
      )}
    </div>
  );
}
