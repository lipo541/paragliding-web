'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Building2, Star, Users, BadgeCheck, ShoppingCart, ArrowRight, MapPin } from 'lucide-react';
import { Company, ViewMode, Location as LocationType } from '../hooks/useCompaniesFilter';
import { SupportedLocale, getLocalizedField, getLocalizedSlug, formatRating } from '../utils/companyHelpers';
import { useCart } from '@/lib/context/CartContext';
import LocationSelectModal from '@/components/pilot/LocationSelectModal';
import FlightTypeModal from '@/components/pilot/FlightTypeModal';

interface Location {
  id: string;
  name_ka: string;
  name_en: string;
  name_ru?: string;
}

interface CompanyCardProps {
  company: Company;
  locale: SupportedLocale;
  viewMode: ViewMode;
  allLocations?: LocationType[];
  translations: {
    verified: string;
    pilots: string;
    reviews: string;
    viewDetails: string;
  };
}

export default function CompanyCard({
  company,
  locale,
  viewMode,
  allLocations = [],
  translations
}: CompanyCardProps) {
  const { addItem } = useCart();
  
  // Cart state
  const [quantity, setQuantity] = useState(1);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showFlightTypeModal, setShowFlightTypeModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);
  
  const name = getLocalizedField(company, 'name', locale);
  const description = getLocalizedField(company, 'description', locale);
  const slug = getLocalizedSlug(company, locale);
  const rating = company.cached_rating || 0;
  const ratingCount = company.cached_rating_count || 0;
  const pilotCount = company.pilot_count || 0;
  
  // Check if company has locations
  const hasLocations = company.location_ids && company.location_ids.length > 0;
  const hasMultipleLocations = company.location_ids && company.location_ids.length > 1;
  
  // Get company location names
  const companyLocationNames = (company.location_ids || []).map(locId => {
    const loc = allLocations.find(l => l.id === locId);
    if (!loc) return '';
    return getLocalizedField(loc, 'name', locale);
  }).filter(Boolean);
  
  // Render star rating (5 stars total)
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        // Full star
        stars.push(
          <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
        );
      } else if (i === fullStars && hasHalfStar) {
        // Half star (using full for simplicity, could implement half)
        stars.push(
          <Star key={i} className="w-3 h-3 fill-amber-400/50 text-amber-400" />
        );
      } else {
        // Empty star
        stars.push(
          <Star key={i} className="w-3 h-3 text-gray-300 dark:text-zinc-600" />
        );
      }
    }
    return stars;
  };

  // Handle add to cart click
  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!hasLocations) return;
    
    if (hasMultipleLocations) {
      setShowLocationModal(true);
    } else {
      setSelectedLocation({ 
        id: company.location_ids![0], 
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
    
    addItem({
      type: flightType.shared_id,
      name: flightTypeName,
      price: flightType.price_gel || 0,
      quantity: quantity,
      company: {
        id: company.id,
        name: name,
        logoUrl: company.logo_url || undefined,
      },
      location: {
        id: selectedLocation.id,
        name: locationName,
      },
    });
    
    // Show added feedback
    setAddedToCart(true);
    setTimeout(() => {
      setAddedToCart(false);
      setQuantity(1);
    }, 2000);
    
    // Reset state
    setShowFlightTypeModal(false);
    setSelectedLocation(null);
  };

  // Quantity controls
  const updateQuantity = (delta: number) => {
    setQuantity(prev => Math.max(1, Math.min(10, prev + delta)));
  };

  // Compact star rating
  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex items-center gap-px">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-3 h-3 ${
            star <= rating
              ? 'fill-[#ffc107] text-[#ffc107]'
              : 'fill-transparent text-[#2d2d2d]/20 dark:text-white/20'
          }`}
        />
      ))}
    </div>
  );

  if (viewMode === 'list') {
    return (
      <>
        <div className="group block">
          <article className="relative rounded-lg backdrop-blur-sm bg-white/40 dark:bg-black/30 border border-[#4697D2]/15 dark:border-white/10 hover:border-[#4697D2]/30 dark:hover:border-white/20 transition-all overflow-hidden">
            <div className="flex items-stretch">
              {/* Logo - clickable */}
              <Link href={`/${locale}/companies/${slug}`} className="relative w-14 flex-shrink-0 rounded-l-lg bg-gradient-to-br from-[#4697D2]/10 to-transparent overflow-hidden">
                {company.logo_url ? (
                  <Image src={company.logo_url} alt={name} fill className="object-contain p-1.5" sizes="56px" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-[#4697D2]/30 dark:text-white/20" />
                  </div>
                )}
              </Link>
              
              {/* Content - clickable */}
              <Link href={`/${locale}/companies/${slug}`} className="flex-1 min-w-0 p-2.5">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-sm font-semibold text-[#1a1a1a] dark:text-white group-hover:text-[#4697D2] transition-colors truncate">
                    {name}
                  </h3>
                  {company.status === 'verified' && (
                    <BadgeCheck className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  )}
                </div>
                {/* Locations */}
                {companyLocationNames.length > 0 && (
                  <div className="flex items-center gap-1 mb-1">
                    <MapPin className="w-3 h-3 text-[#4697D2] flex-shrink-0" />
                    <span className="text-[10px] text-gray-600 dark:text-zinc-400 truncate">
                      {companyLocationNames.slice(0, 3).join(', ')}
                      {companyLocationNames.length > 3 && ` +${companyLocationNames.length - 3}`}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1">
                    <StarRating rating={rating} />
                    <span className="text-[10px] text-gray-500 dark:text-zinc-400">({ratingCount})</span>
                  </div>
                  <div className="flex items-center gap-1 text-[#2d2d2d]/50 dark:text-white/40">
                    <Users className="w-3 h-3" />
                    <span>{pilotCount}</span>
                  </div>
                </div>
              </Link>
              
              {/* Cart Section */}
              {hasLocations && (
                <div className="flex items-center gap-2 p-2.5 border-l border-[#4697D2]/20 dark:border-white/10">
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
          </article>
        </div>
        
        {/* Location Select Modal */}
        <LocationSelectModal
          isOpen={showLocationModal}
          onClose={() => setShowLocationModal(false)}
          onSelect={handleLocationSelect}
          locationIds={company.location_ids || []}
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

  // Grid view - matching PilotCard style
  return (
    <>
      <div className="block max-w-[220px]">
        <div className="
          relative overflow-hidden rounded-2xl
          backdrop-blur-xl
          bg-[rgba(70,151,210,0.15)] dark:bg-black/40
          shadow-xl shadow-black/10 dark:shadow-black/30
          border border-[#4697D2]/30 dark:border-white/10
          transition-all duration-500 ease-out
          hover:shadow-2xl hover:shadow-black/15 dark:hover:shadow-black/50
        ">
          
          {/* Clickable area for company details */}
          <Link href={`/${locale}/companies/${slug}`} className="block group">
            {/* Image Section */}
            <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#4697D2]/10 to-[#4697D2]/5 dark:from-zinc-800 dark:to-zinc-900">
              {company.logo_url ? (
                <Image
                  src={company.logo_url}
                  alt={name}
                  fill
                  className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Building2 className="w-12 h-12 text-zinc-300 dark:text-zinc-600" />
                </div>
              )}
              
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              
              {/* Verified indicator - pulsing green */}
              {company.status === 'verified' && (
                <div className="absolute top-2 left-2">
                  <div className="relative flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/90 dark:bg-black/70 backdrop-blur-sm">
                    <div className="relative">
                      <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-500 animate-ping" />
                      <div className="relative w-2 h-2 rounded-full bg-green-500" />
                    </div>
                    <span className="text-[10px] font-medium text-zinc-700 dark:text-zinc-200">
                      {locale === 'ka' ? 'ვერიფიცირებული' : 'Verified'}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Pilots count badge */}
              {pilotCount > 0 && (
                <div className="absolute top-2 right-2">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/90 dark:bg-black/70 backdrop-blur-sm">
                    <Users className="w-3 h-3 text-[#4697D2]" />
                    <span className="text-[10px] font-medium text-zinc-700 dark:text-zinc-200">
                      {pilotCount} {locale === 'ka' ? 'პილოტი' : 'pilots'}
                    </span>
                  </div>
                </div>
              )}
              
            </div>
            
            {/* Content Section */}
            <div className="p-3 pb-2">
              {/* Name */}
              <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-1 group-hover:text-gray-600 dark:group-hover:text-zinc-200 transition-colors truncate">
                {name}
              </h3>
              
              {/* Locations */}
              {companyLocationNames.length > 0 && (
                <div className="flex items-center gap-1 mb-1.5">
                  <MapPin className="w-3 h-3 text-[#4697D2] flex-shrink-0" />
                  <span className="text-[10px] text-gray-600 dark:text-zinc-400 truncate">
                    {companyLocationNames.slice(0, 2).join(', ')}
                    {companyLocationNames.length > 2 && ` +${companyLocationNames.length - 2}`}
                  </span>
                </div>
              )}
              
              {/* Rating Stars */}
              <div className="flex items-center gap-1 mb-2">
                <div className="flex items-center">
                  {renderStars(rating)}
                </div>
                <span className="text-[10px] text-gray-500 dark:text-zinc-400">
                  ({ratingCount})
                </span>
              </div>
              
              {/* View Button */}
              <button className="
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
                <span>{locale === 'ka' ? 'ნახვა' : 'View'}</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </Link>
          
          {/* Cart Section - Outside of Link */}
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
                  {addedToCart ? '✓' : (locale === 'ka' ? 'კალათა' : 'Cart')}
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
        locationIds={company.location_ids || []}
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
