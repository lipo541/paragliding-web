'use client';

import { memo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { User, Award, Plane, Languages, Building2, Star, ArrowRight, ShoppingCart } from 'lucide-react';
import { LANGUAGE_NAMES, type SupportedLanguage } from '@/lib/types/pilot';

// Public pilot data for card display
export interface PilotCardData {
  id: string;
  first_name_ka?: string | null;
  first_name_en?: string | null;
  first_name_ru?: string | null;
  last_name_ka?: string | null;
  last_name_en?: string | null;
  last_name_ru?: string | null;
  avatar_url?: string | null;
  bio_ka?: string | null;
  bio_en?: string | null;
  bio_ru?: string | null;
  commercial_start_date?: string | null;
  tandem_flights?: number | null;
  languages?: SupportedLanguage[] | null;
  status: string;
  cached_rating?: number | null;
  cached_rating_count?: number | null;
  slug_ka?: string | null;
  slug_en?: string | null;
  company?: {
    id: string;
    name_ka?: string | null;
    name_en?: string | null;
    logo_url?: string | null;
  } | null;
}

interface PilotCardProps {
  pilot: PilotCardData;
  locale: string;
  locationId?: string;
  locationName?: string;
  onAddToCart?: (pilot: PilotCardData, quantity: number) => void;
}

function calculateExperience(startDate?: string | null): number {
  if (!startDate) return 0;
  const start = new Date(startDate);
  const now = new Date();
  return Math.floor((now.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

function getLocalizedName(pilot: PilotCardData, locale: string): string {
  const firstNameKey = `first_name_${locale}` as keyof PilotCardData;
  const lastNameKey = `last_name_${locale}` as keyof PilotCardData;
  const firstName = (pilot[firstNameKey] as string) || pilot.first_name_ka || pilot.first_name_en || '';
  const lastName = (pilot[lastNameKey] as string) || pilot.last_name_ka || pilot.last_name_en || '';
  return `${firstName} ${lastName}`.trim() || 'პილოტი';
}

function getLocalizedBio(pilot: PilotCardData, locale: string): string {
  const bioKey = `bio_${locale}` as keyof PilotCardData;
  return (pilot[bioKey] as string) || pilot.bio_ka || pilot.bio_en || '';
}

function getPilotUrl(pilot: PilotCardData, locale: string): string {
  const slugKey = `slug_${locale}` as keyof PilotCardData;
  const slug = (pilot[slugKey] as string) || pilot.slug_ka || pilot.id;
  return `/${locale}/pilot/${slug}`;
}

const LANG_CODES: Record<SupportedLanguage, string> = {
  ka: 'GE', en: 'EN', ru: 'RU', de: 'DE', tr: 'TR',
  ar: 'AR', he: 'HE', fr: 'FR', es: 'ES', it: 'IT', zh: 'ZH',
};

function PilotCard({ pilot, locale, locationId, locationName, onAddToCart }: PilotCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  
  const name = getLocalizedName(pilot, locale);
  const bio = getLocalizedBio(pilot, locale);
  const experience = calculateExperience(pilot.commercial_start_date);
  const profileUrl = getPilotUrl(pilot, locale);
  const isVerified = pilot.status === 'verified';
  const rating = pilot.cached_rating || 0;
  const ratingCount = pilot.cached_rating_count || 0;

  const companyName = pilot.company 
    ? (locale === 'ka' ? pilot.company.name_ka : pilot.company.name_en) || pilot.company.name_ka || pilot.company.name_en
    : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(pilot, quantity);
      setAddedToCart(true);
      setTimeout(() => {
        setAddedToCart(false);
        setQuantity(1);
      }, 2000);
    }
  };

  const updateQuantity = (delta: number) => {
    setQuantity(prev => Math.max(1, Math.min(10, prev + delta)));
  };

  return (
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
        
        {/* Clickable area for profile */}
        <Link href={profileUrl} className="block group">
          {/* Image Section */}
          <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#4697D2]/10 to-[#4697D2]/5 dark:from-zinc-800 dark:to-zinc-900">
            {pilot.avatar_url ? (
              <Image
                src={pilot.avatar_url}
                alt={name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-12 h-12 text-zinc-300 dark:text-zinc-600" />
              </div>
            )}
            
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            
            {/* Online indicator - pulsing green */}
            {isVerified && (
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
            
            {/* Company badge */}
            {pilot.company && (
              <div className="absolute top-2 right-2">
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/90 dark:bg-black/70 backdrop-blur-sm">
                  {pilot.company.logo_url ? (
                    <Image
                      src={pilot.company.logo_url}
                      alt={companyName || ''}
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
              <div className="absolute bottom-2 left-2">
                <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-white/90 dark:bg-black/70 backdrop-blur-sm">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-bold text-zinc-800 dark:text-white">{rating.toFixed(1)}</span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400">({ratingCount})</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Content Section */}
          <div className="p-3 pb-2">
            {/* Name */}
            <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-0.5 group-hover:text-gray-600 dark:group-hover:text-zinc-200 transition-colors">
              {name}
            </h3>
            
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
              
              {(pilot.tandem_flights ?? 0) > 0 && (
                <div className="flex items-center gap-1">
                  <Plane className="w-3 h-3 text-[#4697D2] dark:text-zinc-400" />
                  <span className="text-xs text-gray-700 dark:text-zinc-300">
                    {pilot.tandem_flights?.toLocaleString()}+
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
                      title={LANGUAGE_NAMES[lang]?.ka || lang}
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
        
        {/* Add to Cart Section - Outside of Link */}
        {onAddToCart && locationId && (
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
                onClick={handleAddToCart}
                className={`flex-1 py-1.5 px-2 rounded-lg font-medium text-xs text-center transition-all duration-300 flex items-center justify-center gap-1 border ${
                  addedToCart
                    ? 'bg-green-500/20 border-green-500/50 text-green-700 dark:text-green-400'
                    : 'bg-white/60 dark:bg-black/40 border-[#4697D2]/30 dark:border-white/20 text-[#1a1a1a] dark:text-white hover:bg-[#4697D2]/10 dark:hover:bg-white/10'
                }`}
              >
                <ShoppingCart className="w-3 h-3" />
                {addedToCart 
                  ? (locale === 'ka' ? '✓' : '✓') 
                  : (locale === 'ka' ? 'კალათა' : 'Cart')
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(PilotCard);
