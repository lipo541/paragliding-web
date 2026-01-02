'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Users, Star, User, Plane, ShoppingCart, Award, Languages, ArrowRight } from 'lucide-react';
import { useCart } from '@/lib/context/CartContext';
import LocationSelectModal from '@/components/pilot/LocationSelectModal';
import FlightTypeModal from '@/components/pilot/FlightTypeModal';

interface PilotLocation {
  id: string;
  name: string;
  slug: string;
}

interface Location {
  id: string;
  name_ka: string;
  name_en: string;
  name_ru?: string;
}

interface Pilot {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  slug: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  tandemFlights?: number | null;
  totalFlights?: number | null;
  locationIds?: string[];
  locations?: PilotLocation[];
  experience?: number;
  languages?: string[];
  bio?: string;
}

interface CompanyPilotsSectionProps {
  pilots: Pilot[];
  locale: string;
  companyName?: string;
  companyId?: string;
  companyLogoUrl?: string;
  companySlug?: string;
  translations: {
    pilots: string;
    viewPilot: string;
    reviews: string;
    verified: string;
    flights: string;
    tandemFlights: string;
    addToCart?: string;
    selectLocation?: string;
  };
}

// Language code mapping
const LANG_CODES: Record<string, string> = {
  ka: 'GE', en: 'EN', ru: 'RU', de: 'DE', tr: 'TR',
  ar: 'AR', he: 'HE', fr: 'FR', es: 'ES', it: 'IT', zh: 'ZH',
};

// Individual pilot card component - matching LocationPage PilotCard style
function PilotCard({ 
  pilot, 
  locale, 
  translations,
  companyName,
  companyId,
  companyLogoUrl,
  companySlug,
}: { 
  pilot: Pilot; 
  locale: string; 
  translations: CompanyPilotsSectionProps['translations'];
  companyName?: string;
  companyId?: string;
  companyLogoUrl?: string;
  companySlug?: string;
}) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showFlightTypeModal, setShowFlightTypeModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);

  const hasLocations = pilot.locationIds && pilot.locationIds.length > 0;
  const hasMultipleLocations = pilot.locationIds && pilot.locationIds.length > 1;
  const name = `${pilot.firstName} ${pilot.lastName}`.trim();
  const profileUrl = `/${locale}/pilot/${pilot.slug || pilot.id}`;

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!hasLocations) return;
    
    if (hasMultipleLocations) {
      setShowLocationModal(true);
    } else {
      setSelectedLocation({ 
        id: pilot.locationIds![0], 
        name_ka: '', 
        name_en: '' 
      });
      setShowFlightTypeModal(true);
    }
  };

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
    setShowLocationModal(false);
    setShowFlightTypeModal(true);
  };

  const handleFlightTypeSelect = (flightType: { shared_id: string; name_ka?: string; name_en?: string; price_gel?: number }) => {
    if (!selectedLocation) return;
    
    const flightTypeName = (locale === 'ka' ? flightType.name_ka : flightType.name_en) || flightType.name_ka || '';
    const locationName = (locale === 'ka' ? selectedLocation.name_ka : selectedLocation.name_en) || selectedLocation.name_ka || '';
    
    addItem({
      type: flightType.shared_id,
      name: flightTypeName,
      price: flightType.price_gel || 0,
      quantity: quantity,
      pilot: {
        id: pilot.id,
        name: name,
        avatarUrl: pilot.avatarUrl || undefined,
        slug: pilot.slug || undefined,
      },
      company: companyId ? {
        id: companyId,
        name: companyName || '',
        logoUrl: companyLogoUrl || undefined,
        slug: companySlug || undefined,
      } : undefined,
      location: {
        id: selectedLocation.id,
        name: locationName,
      },
    });
    
    setAddedToCart(true);
    setTimeout(() => {
      setAddedToCart(false);
      setQuantity(1);
    }, 2000);
    
    setShowFlightTypeModal(false);
    setSelectedLocation(null);
  };

  const updateQuantity = (delta: number) => {
    setQuantity(prev => Math.max(1, Math.min(10, prev + delta)));
  };

  return (
    <>
      <div className="block">
        <div className="
          relative overflow-hidden rounded-lg sm:rounded-xl
          backdrop-blur-xl
          bg-white/60 dark:bg-black/40
          shadow-md sm:shadow-lg shadow-black/10 dark:shadow-black/30
          border border-[#4697D2]/20 dark:border-white/10
          transition-all duration-300
          hover:shadow-xl hover:-translate-y-1
        ">
          
          {/* Clickable area for profile */}
          <Link href={profileUrl} className="block group">
            {/* Image Section */}
            <div className="relative aspect-[4/3] sm:aspect-[16/10] overflow-hidden bg-gradient-to-br from-[#4697D2]/10 to-[#4697D2]/5 dark:from-zinc-800 dark:to-zinc-900">
              {pilot.avatarUrl ? (
                <Image
                  src={pilot.avatarUrl}
                  alt={name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-12 h-12 text-zinc-300 dark:text-zinc-600" />
                </div>
              )}
              
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              
              {/* Online indicator - pulsing green */}
              {pilot.verified && (
                <div className="absolute top-2 left-2">
                  <div className="relative flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/90 dark:bg-black/70 backdrop-blur-sm">
                    <div className="relative">
                      <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-500 animate-ping" />
                      <div className="relative w-2 h-2 rounded-full bg-green-500" />
                    </div>
                    <span className="text-[10px] font-medium text-zinc-700 dark:text-zinc-200">
                      {locale === 'ka' ? 'აქტიური' : 'Active'}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Rating badge */}
              {pilot.rating > 0 && (
                <div className="absolute bottom-2 left-2">
                  <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-white/90 dark:bg-black/70 backdrop-blur-sm">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-bold text-zinc-800 dark:text-white">{pilot.rating.toFixed(1)}</span>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400">({pilot.reviewCount})</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Content Section */}
            <div className="p-2 sm:p-3 pb-1.5 sm:pb-2">
              {/* Name */}
              <h3 className="text-xs sm:text-sm font-bold text-gray-800 dark:text-white mb-0.5 group-hover:text-gray-600 dark:group-hover:text-zinc-200 transition-colors line-clamp-1">
                {name}
              </h3>
              
              {/* Bio - hidden on mobile */}
              {pilot.bio && (
                <p className="hidden sm:block text-xs text-gray-600 dark:text-zinc-400 line-clamp-1 mb-2">
                  {pilot.bio}
                </p>
              )}
              
              {/* Stats Row */}
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                {(pilot.experience ?? 0) > 0 && (
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <Award className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#4697D2] dark:text-zinc-400" />
                    <span className="text-[10px] sm:text-xs text-gray-700 dark:text-zinc-300">
                      {pilot.experience}{locale === 'ka' ? 'წ' : 'yr'}
                    </span>
                  </div>
                )}
                
                {(pilot.tandemFlights ?? 0) > 0 && (
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <Plane className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#4697D2] dark:text-zinc-400" />
                    <span className="text-[10px] sm:text-xs text-gray-700 dark:text-zinc-300">
                      {(pilot.tandemFlights ?? 0).toLocaleString()}+
                    </span>
                  </div>
                )}
              </div>
              
              {/* Languages - hidden on mobile */}
              {pilot.languages && pilot.languages.length > 0 && (
                <div className="hidden sm:flex items-center gap-1 mb-2">
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
              <button className="
                w-full flex items-center justify-center gap-1
                py-1 sm:py-1.5 px-1.5 sm:px-2 rounded-md sm:rounded-lg
                bg-gradient-to-r from-[rgba(70,151,210,0.4)] to-[rgba(70,151,210,0.3)] 
                dark:from-transparent dark:to-transparent dark:bg-black/40
                backdrop-blur-md
                border border-[#4697D2]/40 dark:border-white/10
                text-gray-800 dark:text-white
                font-semibold text-[10px] sm:text-xs
                transition-all duration-300
                hover:from-[rgba(70,151,210,0.5)] hover:to-[rgba(70,151,210,0.4)] 
                dark:hover:bg-black/50 dark:hover:border-white/20
                shadow-md sm:shadow-lg shadow-[#4697D2]/10 dark:shadow-black/30
                hover:shadow-xl
                active:scale-[0.98]
              ">
                <span>{locale === 'ka' ? 'ნახვა' : 'View'}</span>
                <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </Link>
          
          {/* Add to Cart Section - Outside of Link */}
          {hasLocations && (
            <div className="px-2 sm:px-3 pb-2 sm:pb-3 pt-1 border-t border-[#4697D2]/20 dark:border-white/10">
              <div className="flex items-stretch gap-1.5 sm:gap-2">
                {/* Quantity Selector - hidden on mobile */}
                <div className="hidden sm:flex items-center bg-white/60 dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/20 rounded-lg overflow-hidden">
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
                  className={`flex-1 py-1 sm:py-1.5 px-1.5 sm:px-2 rounded-md sm:rounded-lg font-medium text-[10px] sm:text-xs text-center transition-all duration-300 flex items-center justify-center gap-1 border ${
                    addedToCart
                      ? 'bg-green-500/20 border-green-500/50 text-green-700 dark:text-green-400'
                      : 'bg-white/60 dark:bg-black/40 border-[#4697D2]/30 dark:border-white/20 text-[#1a1a1a] dark:text-white hover:bg-[#4697D2]/10 dark:hover:bg-white/10'
                  }`}
                >
                  <ShoppingCart className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  {addedToCart 
                    ? '✓' 
                    : (translations.addToCart || (locale === 'ka' ? 'კალათა' : 'Cart'))
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
        locationIds={pilot.locationIds || []}
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

export default function CompanyPilotsSection({ 
  pilots, 
  locale, 
  translations,
  companyName,
  companyId,
  companyLogoUrl,
  companySlug,
}: CompanyPilotsSectionProps) {
  if (!pilots || pilots.length === 0) return null;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-[#4697D2]/20 to-[#4697D2]/10 dark:from-[#CAFA00]/20 dark:to-[#CAFA00]/10">
            <Users className="w-5 h-5 text-[#4697D2] dark:text-[#CAFA00]" />
          </div>
          <h2 className="text-xl font-bold text-foreground">{translations.pilots}</h2>
        </div>
        <span className="text-xs text-foreground/60 px-2 py-1 rounded-full bg-foreground/5">
          {pilots.length} {locale === 'ka' ? 'პილოტი' : 'pilots'}
        </span>
      </div>

      {/* Pilots Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
        {pilots.map((pilot) => (
          <PilotCard
            key={pilot.id}
            pilot={pilot}
            locale={locale}
            translations={translations}
            companyName={companyName}
            companyId={companyId}
            companyLogoUrl={companyLogoUrl}
            companySlug={companySlug}
          />
        ))}
      </div>
    </div>
  );
}
