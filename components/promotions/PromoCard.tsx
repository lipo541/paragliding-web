'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import Link from 'next/link';
import { Tag, Calendar, MapPin, Copy, Check, Clock, Sparkles } from 'lucide-react';

interface PromoCardProps {
  promo: {
    id: string;
    code: string;
    discount_percentage: number;
    valid_from: string | null;
    valid_until: string | null;
    usage_limit: number | null;
    usage_count: number;
    image_path: string | null;
    description_ka: string | null;
    description_en: string | null;
    description_ru: string | null;
    description_ar: string | null;
    description_de: string | null;
    description_tr: string | null;
    promo_code_locations: Array<{
      location_id: string;
      locations: {
        id: string;
        name_ka: string;
        name_en: string;
        name_ru: string;
      };
    }>;
  };
  locale: string;
}

export default function PromoCard({ promo, locale }: PromoCardProps) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const supabase = createClient();

  useEffect(() => {
    if (!promo.valid_until) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(promo.valid_until!).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('expired');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(
          locale === 'ka'
            ? `${days} დღე ${hours} საათი`
            : locale === 'en'
            ? `${days}d ${hours}h`
            : `${days}д ${hours}ч`
        );
      } else if (hours > 0) {
        setTimeLeft(
          locale === 'ka'
            ? `${hours} საათი ${minutes} წუთი`
            : locale === 'en'
            ? `${hours}h ${minutes}m`
            : `${hours}ч ${minutes}м`
        );
      } else {
        setTimeLeft(
          locale === 'ka'
            ? `${minutes} წუთი`
            : locale === 'en'
            ? `${minutes} min`
            : `${minutes} мин`
        );
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [promo.valid_until, locale]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(promo.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getDescription = () => {
    if (locale === 'en') return promo.description_en || promo.description_ka;
    if (locale === 'ru') return promo.description_ru || promo.description_ka;
    if (locale === 'ar') return promo.description_ar || promo.description_ka;
    if (locale === 'de') return promo.description_de || promo.description_ka;
    if (locale === 'tr') return promo.description_tr || promo.description_ka;
    return promo.description_ka;
  };

  const getLocationName = (location: any) => {
    if (locale === 'en') return location.name_en || location.name_ka;
    if (locale === 'ru') return location.name_ru || location.name_ka;
    return location.name_ka;
  };

  const imageUrl = promo.image_path
    ? supabase.storage.from('Promo').getPublicUrl(promo.image_path).data.publicUrl
    : null;

  const description = getDescription();
  const locations = promo.promo_code_locations.map((pl) => pl.locations);
  
  const usagePercentage = promo.usage_limit
    ? (promo.usage_count / promo.usage_limit) * 100
    : 0;

  const isExpiringSoon = promo.valid_until && 
    new Date(promo.valid_until).getTime() - new Date().getTime() < 3 * 24 * 60 * 60 * 1000; // 3 days

  return (
    <div className="group relative rounded-xl overflow-hidden border border-foreground/10 bg-foreground/5 hover:bg-foreground/10 transition-all duration-300 hover:shadow-xl hover:shadow-foreground/5">
      {/* Image */}
      <div className="relative h-40 bg-gradient-to-br from-blue-500/10 to-purple-500/10 overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={promo.code}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            unoptimized
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Sparkles className="w-12 h-12 text-foreground/10" />
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent" />

        {/* Discount Badge */}
        <div className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold text-sm shadow-lg">
          -{promo.discount_percentage}%
        </div>

        {/* Expiring Soon Badge */}
        {isExpiringSoon && timeLeft !== 'expired' && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-amber-500 text-white text-xs font-medium shadow-lg flex items-center gap-1 animate-pulse">
            <Clock className="w-3 h-3" />
            {locale === 'ka' ? 'იწურება' : locale === 'en' ? 'Expiring' : 'Истекает'}
          </div>
        )}

        {/* Promo Code */}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-xl font-bold text-foreground tracking-wide mb-0.5 drop-shadow-md">
            {promo.code}
          </h3>
          <p className="text-xs text-foreground/70 drop-shadow">
            {promo.discount_percentage}%{' '}
            {locale === 'ka' ? 'ფასდაკლება' : locale === 'en' ? 'discount' : 'скидка'}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Description */}
        {description && (
          <p className="text-sm text-foreground/70 line-clamp-2 leading-relaxed">{description}</p>
        )}

        {/* Timer */}
        {promo.valid_until && timeLeft && timeLeft !== 'expired' && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-foreground/50 truncate">
                {locale === 'ka' ? 'დარჩენილი' : locale === 'en' ? 'Time left' : 'Осталось'}
              </p>
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{timeLeft}</p>
            </div>
          </div>
        )}

        {/* Usage Progress */}
        {promo.usage_limit && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground/50">
                {locale === 'ka' ? 'გამოყენებული' : locale === 'en' ? 'Used' : 'Использовано'}
              </span>
              <span className="text-foreground/70 font-medium">
                {promo.usage_count} / {promo.usage_limit}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-foreground/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Dates */}
        {(promo.valid_from || promo.valid_until) && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-foreground/50">
            {promo.valid_from && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 flex-shrink-0" />
                <span>
                  {locale === 'ka' ? 'დან ' : locale === 'en' ? 'From ' : 'С '}
                  {new Date(promo.valid_from!).toLocaleDateString(
                    locale === 'en' ? 'en-US' : locale === 'ru' ? 'ru-RU' : 'ka-GE',
                    { month: 'short', day: 'numeric' }
                  )}
                </span>
              </div>
            )}
            {promo.valid_until && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 flex-shrink-0" />
                <span>
                  {locale === 'ka' ? 'მდე ' : locale === 'en' ? 'Until ' : 'До '}
                  {new Date(promo.valid_until!).toLocaleDateString(
                    locale === 'en' ? 'en-US' : locale === 'ru' ? 'ru-RU' : 'ka-GE',
                    { month: 'short', day: 'numeric' }
                  )}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Locations */}
        {locations.length > 0 && (
          <div className="flex items-start gap-2 text-xs text-foreground/60 p-2 rounded-lg bg-foreground/5 border border-foreground/10">
            <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0 text-green-500" />
            <div className="flex-1 min-w-0">
              <span className="font-medium">
                {locale === 'ka' ? 'ლოკაციები: ' : locale === 'en' ? 'Locations: ' : 'Локации: '}
              </span>
              <span className="text-foreground/50">
                {locations.map((loc) => getLocationName(loc)).join(', ')}
              </span>
            </div>
          </div>
        )}

        {/* Actions - Compact */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleCopy}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              copied
                ? 'bg-green-500 text-white'
                : 'bg-foreground/10 hover:bg-foreground/20 text-foreground border border-foreground/10'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                {locale === 'ka' ? 'კოპირდა' : locale === 'en' ? 'Copied' : 'Скопировано'}
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                {locale === 'ka' ? 'კოპირება' : locale === 'en' ? 'Copy' : 'Копировать'}
              </>
            )}
          </button>

          <Link
            href={`/${locale}/bookings?promo=${promo.code}`}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-md hover:shadow-lg transition-all"
          >
            {locale === 'ka' ? 'ჯავშანი' : locale === 'en' ? 'Book' : 'Бронь'}
          </Link>
        </div>
      </div>
    </div>
  );
}
