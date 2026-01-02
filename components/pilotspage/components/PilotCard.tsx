'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { User, Star, Plane, Building2, Award, Languages, ShoppingCart, ArrowRight } from 'lucide-react';
import { Pilot, Company, ViewMode } from '../hooks/usePilotsFilter';
import { SupportedLocale, getPilotName, getLocalizedField, getLocalizedSlug, formatRating, calculateExperience, formatFlightsCount } from '../utils/pilotHelpers';
import LocationSelectModal from '@/components/pilot/LocationSelectModal';
import FlightTypeModal from '@/components/pilot/FlightTypeModal';
import { useCart } from '@/lib/context/CartContext';

// Language code mapping for display
const LANG_CODES: Record<string, string> = {
  ka: '🇬🇪',
  en: '🇬🇧',
  ru: '🇷🇺',
  de: '🇩🇪',
  fr: '🇫🇷',
  es: '🇪🇸',
  it: '🇮🇹',
  tr: '🇹🇷',
  ar: '🇸🇦',
  zh: '🇨🇳',
  ja: '🇯🇵',
  ko: '🇰🇷',
  he: '🇮🇱',
  pl: '🇵🇱',
};

interface Location {
  id: string;
  name_ka: string;
  name_en: string;
  name_ru?: string;
}

interface PilotCardProps {
  pilot: Pilot;
  company?: Company;
  locale: SupportedLocale;
  viewMode: ViewMode;
  translations: {
    experience: string;
    years: string;
    flights: string;
    languages: string;
    viewProfile: string;
    independent: string;
  };
}

export default function PilotCard({
  pilot,
  company,
  locale,
  viewMode,
  translations
}: PilotCardProps) {
  const { addItem } = useCart();
  
  // Cart & Modal state
  const [quantity, setQuantity] = useState(1);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showFlightTypeModal, setShowFlightTypeModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);
  
  const name = getPilotName(pilot, locale);
  const bio = getLocalizedField(pilot, 'bio', locale);
  const slug = getLocalizedSlug(pilot, locale);
  const rating = pilot.cached_rating || 0;
  const ratingCount = pilot.cached_rating_count || 0;
  const experience = calculateExperience(pilot.commercial_start_date);
  const flights = pilot.tandem_flights || 0;
  const companyName = company ? getLocalizedField(company, 'name', locale) : translations.independent;
  
  // Check if pilot has locations
  const hasLocations = pilot.location_ids && pilot.location_ids.length > 0;
  const hasMultipleLocations = pilot.location_ids && pilot.location_ids.length > 1;

  // Handle add to cart click
  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!hasLocations) return;
    
    if (hasMultipleLocations) {
      // Show location selector first
      setShowLocationModal(true);
    } else {
      // Single location - go directly to flight type modal
      // We'll fetch location details in the modal
      setSelectedLocation({ 
        id: pilot.location_ids![0], 
        name_ka: '', 
        name_en: '' 
      });
      setShowFlightTypeModal(true);
    }
  };

  // Handle location selection
  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
    setShowLocationModal(false);
    setShowFlightTypeModal(true);
  };

  // Handle flight type selection
  const handleFlightTypeSelect = (flightType: { shared_id: string; name_ka?: string; name_en?: string; price_gel?: number }) => {
    if (!selectedLocation) return;
    
    const flightTypeName = (locale === 'ka' ? flightType.name_ka : flightType.name_en) || flightType.name_ka || '';
    const locationName = (locale === 'ka' ? selectedLocation.name_ka : selectedLocation.name_en) || selectedLocation.name_ka || '';
    
    // Get localized slugs
    const pilotSlug = getLocalizedSlug(pilot, locale);
    const companySlug = company ? getLocalizedSlug(company, locale) : undefined;
    
    addItem({
      type: flightType.shared_id,
      name: flightTypeName,
      price: flightType.price_gel || 0,
      quantity: quantity,
      pilot: {
        id: pilot.id,
        name: name,
        avatarUrl: pilot.avatar_url || undefined,
        slug: pilotSlug || undefined,
      },
      company: company ? {
        id: company.id,
        name: companyName,
        logoUrl: company.logo_url || undefined,
        slug: companySlug || undefined,
      } : undefined,
      location: {
        id: selectedLocation.id,
        name: locationName,
      },
    });
    
    // Show added feedback
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
    
    // Reset state
    setShowFlightTypeModal(false);
    setSelectedLocation(null);
    setQuantity(1);
  };

  // Quantity controls
  const updateQuantity = (delta: number) => {
    setQuantity(prev => Math.max(1, Math.min(10, prev + delta)));
  };

  if (viewMode === 'list') {
    return (
      <>
        <div className="group w-full">
          <div className="
            relative rounded-xl overflow-hidden
            bg-[rgba(70,151,210,0.15)] dark:bg-black/30
            backdrop-blur-md
            border border-[#4697D2]/30 dark:border-white/10
            shadow-lg shadow-[#4697D2]/5 dark:shadow-black/20
            hover:shadow-xl hover:shadow-[#4697D2]/10
            hover:border-[#4697D2]/50 dark:hover:border-white/20
            transition-all duration-300
          ">
            <div className="flex items-stretch">
              {/* Avatar - with aspect ratio */}
              <Link href={`/${locale}/pilot/${slug}`} className="relative w-28 flex-shrink-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20 z-10" />
                {pilot.avatar_url ? (
                  <Image 
                    src={pilot.avatar_url} 
                    alt={name} 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-500" 
                    sizes="112px" 
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#4697D2]/20 to-[#4697D2]/5 flex items-center justify-center">
                    <User className="w-10 h-10 text-[#4697D2]/40" />
                  </div>
                )}
                
                {/* Verified badge */}
                {pilot.status === 'verified' && (
                  <div className="absolute top-2 left-2 z-20">
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/90 dark:bg-black/70 backdrop-blur-sm border border-green-500/30">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                      </span>
                    </div>
                  </div>
                )}
              </Link>
              
              {/* Content */}
              <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Link href={`/${locale}/pilot/${slug}`}>
                      <h3 className="text-sm font-bold text-gray-800 dark:text-white group-hover:text-[#4697D2] transition-colors truncate">
                        {name}
                      </h3>
                    </Link>
                    {rating > 0 && (
                      <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white/80 dark:bg-black/50">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-bold text-zinc-800 dark:text-white">{formatRating(rating)}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Company */}
                  <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-zinc-400 mb-2">
                    {company?.logo_url ? (
                      <Image src={company.logo_url} alt={companyName} width={14} height={14} className="rounded-full" />
                    ) : (
                      <Building2 className="w-3.5 h-3.5" />
                    )}
                    <span className="truncate">{companyName}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-zinc-400">
                    {experience > 0 && (
                      <div className="flex items-center gap-1">
                        <Award className="w-3 h-3 text-[#4697D2]" />
                        <span>{experience} {translations.years}</span>
                      </div>
                    )}
                    {flights > 0 && (
                      <div className="flex items-center gap-1">
                        <Plane className="w-3 h-3 text-[#4697D2]" />
                        <span>{formatFlightsCount(flights)}+</span>
                      </div>
                    )}
                    {pilot.languages && pilot.languages.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Languages className="w-3 h-3 text-[#4697D2]" />
                        <div className="flex gap-0.5">
                          {pilot.languages.slice(0, 2).map((lang) => (
                            <span key={lang} className="text-[10px]">
                              {LANG_CODES[lang] || lang.toUpperCase()}
                            </span>
                          ))}
                          {pilot.languages.length > 2 && (
                            <span className="text-[10px]">+{pilot.languages.length - 2}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Right side - Cart Button */}
              {hasLocations && (
                <div className="flex items-center gap-2 p-3 border-l border-[#4697D2]/20 dark:border-white/10">
                  {/* Quantity Selector */}
                  <div className="flex flex-col items-center bg-white/60 dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/20 rounded-lg overflow-hidden">
                    <button
                      onClick={(e) => { e.stopPropagation(); updateQuantity(1); }}
                      className="px-2 py-1 text-[#1a1a1a] dark:text-white hover:bg-[#4697D2]/20 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
                      disabled={quantity >= 10}
                    >
                      <span className="text-xs font-bold">+</span>
                    </button>
                    <span className="px-2 py-0.5 min-w-[24px] text-center text-xs font-semibold text-[#1a1a1a] dark:text-white">
                      {quantity}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); updateQuantity(-1); }}
                      className="px-2 py-1 text-[#1a1a1a] dark:text-white hover:bg-[#4697D2]/20 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
                      disabled={quantity <= 1}
                    >
                      <span className="text-xs font-bold">−</span>
                    </button>
                  </div>
                  
                  {/* Add to Cart Button */}
                  <button
                    onClick={handleAddToCartClick}
                    className={`p-2.5 rounded-lg font-medium transition-all duration-300 border ${
                      addedToCart
                        ? 'bg-green-500/20 border-green-500/50 text-green-700 dark:text-green-400'
                        : 'bg-[#4697D2] border-[#4697D2] text-white hover:bg-[#4697D2]/90'
                    }`}
                    title={locale === 'ka' ? 'კალათაში დამატება' : 'Add to cart'}
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Location Select Modal */}
        <LocationSelectModal
          isOpen={showLocationModal}
          onClose={() => setShowLocationModal(false)}
          onSelect={handleLocationSelect}
          locationIds={pilot.location_ids || []}
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
      </>
    );
  }

  // Grid view - matching location page pilot card style
  return (
    <>
      <div className="group w-full max-w-[220px]">
        <div className="
          relative rounded-xl overflow-hidden
          bg-[rgba(70,151,210,0.15)] dark:bg-black/30
          backdrop-blur-md
          border border-[#4697D2]/30 dark:border-white/10
          shadow-xl shadow-[#4697D2]/5 dark:shadow-black/20
          hover:shadow-2xl hover:shadow-[#4697D2]/10
          hover:border-[#4697D2]/50 dark:hover:border-white/20
          hover:-translate-y-1
          transition-all duration-300
        ">
          {/* Image Section with Link */}
          <Link href={`/${locale}/pilot/${slug}`} className="relative block aspect-[4/3] overflow-hidden">
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent z-10" />
            
            {pilot.avatar_url ? (
              <Image
                src={pilot.avatar_url}
                alt={name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="220px"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#4697D2]/20 to-[#4697D2]/5 flex items-center justify-center">
                <User className="w-12 h-12 text-[#4697D2]/40" />
              </div>
            )}
            
            {/* Active/Verified Status Badge */}
            {pilot.status === 'verified' && (
              <div className="absolute top-2 left-2 z-20">
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/90 dark:bg-black/70 backdrop-blur-sm border border-green-500/30">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-[10px] font-medium text-zinc-700 dark:text-zinc-200">
                    {locale === 'ka' ? 'აქტიური' : 'Active'}
                  </span>
                </div>
              </div>
            )}
            
            {/* Company badge */}
            {company && (
              <div className="absolute top-2 right-2 z-20">
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/90 dark:bg-black/70 backdrop-blur-sm">
                  {company.logo_url ? (
                    <Image
                      src={company.logo_url}
                      alt={companyName}
                      width={12}
                      height={12}
                      className="rounded-full"
                    />
                  ) : (
                    <Building2 className="w-3 h-3 text-zinc-500" />
                  )}
                  <span className="text-[10px] font-medium text-zinc-700 dark:text-zinc-200 max-w-[50px] truncate">
                    {companyName}
                  </span>
                </div>
              </div>
            )}
            
            {/* Rating badge */}
            {rating > 0 && (
              <div className="absolute bottom-2 left-2 z-20">
                <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-white/90 dark:bg-black/70 backdrop-blur-sm">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-bold text-zinc-800 dark:text-white">{formatRating(rating)}</span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400">({ratingCount})</span>
                </div>
              </div>
            )}
          </Link>
          
          {/* Content Section */}
          <div className="p-3 pb-2">
            {/* Name */}
            <Link href={`/${locale}/pilot/${slug}`}>
              <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-0.5 group-hover:text-gray-600 dark:group-hover:text-zinc-200 transition-colors">
                {name}
              </h3>
            </Link>
            
            {/* Bio */}
            {bio && (
              <p className="text-xs text-gray-600 dark:text-zinc-400 line-clamp-1 mb-2">
                {bio}
              </p>
            )}
            
            {/* Stats Row */}
            <div className="flex items-center gap-2 mb-2">
              {experience > 0 && (
                <div className="flex items-center gap-1">
                  <Award className="w-3 h-3 text-[#4697D2] dark:text-zinc-400" />
                  <span className="text-xs text-gray-700 dark:text-zinc-300">
                    {experience} {locale === 'ka' ? 'წ' : 'yr'}
                  </span>
                </div>
              )}
              
              {flights > 0 && (
                <div className="flex items-center gap-1">
                  <Plane className="w-3 h-3 text-[#4697D2] dark:text-zinc-400" />
                  <span className="text-xs text-gray-700 dark:text-zinc-300">
                    {formatFlightsCount(flights)}+
                  </span>
                </div>
              )}
            </div>
            
            {/* Languages */}
            {pilot.languages && pilot.languages.length > 0 && (
              <div className="flex items-center gap-1 mb-2">
                <Languages className="w-3 h-3 text-[#4697D2] dark:text-zinc-400" />
                <div className="flex gap-1 flex-wrap">
                  {pilot.languages.slice(0, 3).map((lang) => (
                    <span
                      key={lang}
                      className="text-[10px] font-medium text-gray-700 dark:text-zinc-300 px-1.5 py-0.5 rounded-full bg-[rgba(70,151,210,0.2)] dark:bg-white/10"
                    >
                      {LANG_CODES[lang] || lang.toUpperCase()}
                    </span>
                  ))}
                  {pilot.languages.length > 3 && (
                    <span className="text-[10px] text-gray-500 dark:text-zinc-400">+{pilot.languages.length - 3}</span>
                  )}
                </div>
              </div>
            )}
            
            {/* View Profile Button */}
            <Link href={`/${locale}/pilot/${slug}`} className="
              w-full flex items-center justify-center gap-1
              py-1.5 px-2 rounded-lg
              bg-gradient-to-r from-[rgba(70,151,210,0.4)] to-[rgba(70,151,210,0.3)] 
              dark:from-transparent dark:to-transparent dark:bg-black/40
              backdrop-blur-md
              border border-[#4697D2]/40 dark:border-white/10
              text-gray-800 dark:text-white
              font-semibold text-xs
              transition-all duration-300
              hover:from-[rgba(70,151,210,0.5)] hover:to-[rgba(70,151,210,0.4)] 
              dark:hover:bg-black/50 dark:hover:border-white/20
              shadow-lg shadow-[#4697D2]/10 dark:shadow-black/30
              hover:shadow-xl
              active:scale-[0.98]
            ">
              <span>{translations.viewProfile}</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          
          {/* Add to Cart Section */}
          {hasLocations && (
            <div className="px-3 pb-3 pt-1 border-t border-[#4697D2]/20 dark:border-white/10">
              <div className="flex items-stretch gap-2">
                {/* Quantity Selector */}
                <div className="flex items-center bg-white/60 dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/20 rounded-lg overflow-hidden">
                  <button
                    onClick={(e) => { e.stopPropagation(); updateQuantity(-1); }}
                    className="px-2 py-1.5 text-[#1a1a1a] dark:text-white hover:bg-[#4697D2]/20 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
                    disabled={quantity <= 1}
                  >
                    <span className="text-xs font-bold">−</span>
                  </button>
                  <span className="px-1.5 min-w-[24px] text-center text-xs font-semibold text-[#1a1a1a] dark:text-white flex items-center justify-center">
                    {quantity}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); updateQuantity(1); }}
                    className="px-2 py-1.5 text-[#1a1a1a] dark:text-white hover:bg-[#4697D2]/20 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
                    disabled={quantity >= 10}
                  >
                    <span className="text-xs font-bold">+</span>
                  </button>
                </div>
                
                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCartClick}
                  className={`flex-1 py-1.5 px-2 rounded-lg font-medium text-xs text-center transition-all duration-300 flex items-center justify-center gap-1 border ${
                    addedToCart
                      ? 'bg-green-500/20 border-green-500/50 text-green-700 dark:text-green-400'
                      : 'bg-white/60 dark:bg-black/40 border-[#4697D2]/30 dark:border-white/20 text-[#1a1a1a] dark:text-white hover:bg-[#4697D2]/10 dark:hover:bg-white/10'
                  }`}
                >
                  <ShoppingCart className="w-3 h-3" />
                  {addedToCart 
                    ? '✓' 
                    : (locale === 'ka' ? 'კალათა' : 'Cart')
                  }
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Location Select Modal */}
      <LocationSelectModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSelect={handleLocationSelect}
        locationIds={pilot.location_ids || []}
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
    </>
  );
}
