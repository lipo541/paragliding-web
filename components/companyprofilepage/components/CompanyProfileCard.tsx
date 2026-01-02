'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Building2, Star, MapPin, Share2, Calendar, BadgeCheck, ShoppingCart, Plus, Minus } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useCart } from '@/lib/context/CartContext';
import LocationSelectModal from '@/components/pilot/LocationSelectModal';
import FlightTypeModal from '@/components/pilot/FlightTypeModal';

interface Location {
  id: string;
  name: string;
  slug: string;
  countrySlug: string;
  countryName?: string | null;
}

interface CompanyProfileCardProps {
  company: {
    id: string;
    logoUrl?: string | null;
    name: string;
    slug?: string | null;
    countryName?: string | null;
    verified: boolean;
    rating: number;
    reviewCount: number;
    foundedDate?: string | null;
    pilotsCount: number;
  };
  locations: Location[];
  locale: string;
  translations: {
    verified: string;
    share: string;
    qrCode: string;
    reviews: string;
    bookFlight: string;
    yearsActive: string;
    pilots: string;
    rateFirst: string;
  };
}

export default function CompanyProfileCard({ company, locations, locale, translations }: CompanyProfileCardProps) {
  const [qrModal, setQrModal] = useState(false);
  const { addItem } = useCart();
  
  // Cart state
  const [quantity, setQuantity] = useState(1);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showFlightTypeModal, setShowFlightTypeModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ id: string; name_ka: string; name_en: string } | null>(null);
  
  // Build profile URL statically to avoid hydration mismatch
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://flygeorgia.co';
  const companySlug = company.slug || company.id;
  const profileUrl = `${baseUrl}/${locale}/company/${companySlug}`;
  
  // Calculate years active
  const yearsActive = company.foundedDate 
    ? new Date().getFullYear() - new Date(company.foundedDate).getFullYear()
    : null;

  // Stats
  const stats = [
    { value: yearsActive, label: translations.yearsActive, show: yearsActive && yearsActive > 0 },
    { value: company.pilotsCount, label: translations.pilots, show: true },
  ].filter(s => s.show);

  // Cart logic
  const locationIds = locations.map(l => l.id);
  const hasLocations = locationIds.length > 0;
  const hasMultipleLocations = locationIds.length > 1;

  const handleAddToCartClick = () => {
    if (!hasLocations) return;
    
    if (hasMultipleLocations) {
      setShowLocationModal(true);
    } else {
      setSelectedLocation({ 
        id: locations[0].id, 
        name_ka: locations[0].name, 
        name_en: locations[0].name 
      });
      setShowFlightTypeModal(true);
    }
  };

  const handleLocationSelect = (location: { id: string; name_ka: string; name_en: string }) => {
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
      company: {
        id: company.id,
        name: company.name,
        logoUrl: company.logoUrl || undefined,
      },
      location: {
        id: selectedLocation.id,
        name: locationName,
      },
    });
    
    // Reset state
    setShowFlightTypeModal(false);
    setSelectedLocation(null);
    setQuantity(1);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: company.name, url: profileUrl });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(profileUrl);
    }
  };

  return (
    <>
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 -mt-20 sm:-mt-24 relative z-10">
        <div className="bg-[rgba(70,151,210,0.15)] dark:bg-black/40 backdrop-blur-xl rounded-xl shadow-xl shadow-black/10 dark:shadow-black/30 border border-[#4697D2]/30 dark:border-white/10 overflow-hidden">
          
          {/* Profile Header */}
          <div className="p-4 sm:p-5 lg:p-6 relative">
            {/* Mobile QR Button - Top Right Corner */}
            <button
              onClick={() => setQrModal(true)}
              className="lg:hidden absolute top-3 right-3 p-2 rounded-lg bg-white/50 dark:bg-white/10 border border-[#4697D2]/20 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/20 transition-colors"
              title={translations.qrCode}
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
              
              {/* Logo + QR Code */}
              <div className="flex-shrink-0 mx-auto lg:mx-0 flex flex-col items-center gap-3">
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-white dark:bg-zinc-800 border-2 border-[#4697D2]/30 dark:border-white/20 shadow-lg">
                  {company.logoUrl ? (
                    <Image src={company.logoUrl} alt={company.name} fill className="object-contain p-2" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#4697D2]/10 to-transparent">
                      <Building2 className="w-12 h-12 text-[#4697D2]/40" />
                    </div>
                  )}
                  {company.verified && (
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-green-500 flex items-center justify-center border-2 border-white dark:border-zinc-900">
                      <BadgeCheck className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                
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
                      fgColor="#1a1a1a"
                    />
                  </button>
                  <span className="text-[9px] text-zinc-600 dark:text-zinc-300 font-medium uppercase tracking-wider">
                    {translations.qrCode}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 text-center lg:text-left">
                {/* Name & Badge */}
                <div className="flex flex-col lg:flex-row lg:items-center gap-2 mb-2">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-zinc-900 dark:text-white">
                    {company.name}
                  </h1>
                  {company.verified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 text-green-600 dark:text-green-400 text-xs font-medium mx-auto lg:mx-0">
                      <BadgeCheck className="w-3.5 h-3.5" />
                      {translations.verified}
                    </span>
                  )}
                </div>

                {/* Location */}
                {company.countryName && (
                  <div className="flex items-center justify-center lg:justify-start gap-1.5 text-zinc-600 dark:text-zinc-300 mb-3">
                    <MapPin className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm">{company.countryName}</span>
                  </div>
                )}

                {/* Rating */}
                <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/30 dark:bg-white/10 border border-[#4697D2]/20 dark:border-white/10">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const fillPercent = Math.min(100, Math.max(0, (company.rating - star + 1) * 100));
                        return (
                          <div key={star} className="relative w-4 h-4">
                            <Star className="absolute inset-0 w-4 h-4 text-zinc-300 dark:text-zinc-600" />
                            {fillPercent > 0 && (
                              <div className="absolute inset-0 overflow-hidden" style={{ width: `${fillPercent}%` }}>
                                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {company.rating > 0 ? (
                      <>
                        <span className="text-sm font-bold text-zinc-900 dark:text-white">{company.rating.toFixed(1)}</span>
                        <span className="text-xs text-zinc-600 dark:text-zinc-300">({company.reviewCount} {translations.reviews})</span>
                      </>
                    ) : (
                      <span className="text-xs text-zinc-600 dark:text-zinc-300">{translations.rateFirst}</span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2">
                  <Link
                    href={`/${locale}/bookings?company=${company.id}`}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#4697D2] hover:bg-[#3a7fb8] dark:bg-[#CAFA00] dark:hover:bg-[#b8e600] text-white dark:text-black text-sm font-semibold transition-all shadow-md shadow-[#4697D2]/25 dark:shadow-[#CAFA00]/25 hover:shadow-lg hover:-translate-y-0.5"
                  >
                    <Calendar className="w-4 h-4" />
                    {translations.bookFlight}
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
                    onClick={handleShare}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-white/30 dark:bg-white/10 border border-[#4697D2]/20 dark:border-white/10 hover:bg-white/50 dark:hover:bg-white/20 text-zinc-700 dark:text-zinc-300 text-sm font-medium transition-all"
                  >
                    <Share2 className="w-4 h-4" />
                    {translations.share}
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

      {/* QR Modal */}
      {qrModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setQrModal(false)}
        >
          <div 
            className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-xs w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-center mb-4 text-zinc-900 dark:text-white">
              {translations.qrCode}
            </h3>
            <div className="flex justify-center p-4 bg-white rounded-xl">
              <QRCodeSVG value={profileUrl} size={200} level="H" />
            </div>
            <p className="text-center text-xs text-zinc-500 mt-4 break-all">
              {profileUrl}
            </p>
          </div>
        </div>
      )}

      {/* Location Select Modal */}
      <LocationSelectModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSelect={handleLocationSelect}
        locationIds={locationIds}
        locale={locale}
        pilotName={company.name}
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
          pilotName={company.name}
        />
      )}
    </>
  );
}
