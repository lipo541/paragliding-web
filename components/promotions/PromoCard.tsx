'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import Link from 'next/link';
import { Tag, Calendar, MapPin, Copy, Check, Clock, Sparkles, ArrowRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/hooks/useTranslation';

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
        name_ar: string;
        name_de: string;
        name_tr: string;
      };
    }>;
  };
  locale: string;
}

export default function PromoCard({ promo, locale }: PromoCardProps) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const supabase = createClient();
  const { t } = useTranslation('promotionpage');
  
  // Helper function to get localized name
  const getLocalizedName = (item: any) => {
    const nameKey = `name_${locale}` as keyof typeof item;
    return item[nameKey] || item.name_ka || '';
  };

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
        setTimeLeft(t('card.daysLeft', { days }));
      } else if (hours > 0) {
        setTimeLeft(t('card.hoursLeft', { hours }));
      } else {
        setTimeLeft(t('card.minutesLeft'));
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [promo.valid_until, locale, t]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(promo.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getDescription = (): string | null => {
    const descKey = `description_${locale}` as keyof typeof promo;
    const desc = promo[descKey];
    if (typeof desc === 'string') return desc;
    if (typeof promo.description_ka === 'string') return promo.description_ka;
    return null;
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
    <div className="group relative rounded-lg overflow-hidden backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 hover:shadow-xl transition-all border border-[#4697D2]/30 dark:border-white/10 shadow-lg flex flex-col h-full">
      {/* Image Section */}
      <div className="relative h-32 lg:h-36 overflow-hidden flex-shrink-0">
        {/* Background Image */}
        <div className="absolute inset-0">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={promo.code}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
              <Sparkles className="w-16 h-16 text-foreground/20" />
            </div>
          )}
        </div>

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/70" />

        {/* Discount Badge */}
        <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-red-500 text-white font-bold text-xs">
          -{promo.discount_percentage}%
        </div>

        {/* Expiring Badge */}
        {isExpiringSoon && timeLeft !== 'expired' && (
          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-amber-500 text-white text-[9px] font-semibold flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5" />
            {t('card.soon')}
          </div>
        )}

        {/* Promo Code - Bottom */}
        <div className="absolute bottom-2 left-2 right-2">
          <p className="text-[9px] text-white/70 mb-0.5">{t('card.code')}</p>
          <h3 className="text-sm font-bold text-white drop-shadow-lg truncate">{promo.code}</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-2.5 flex flex-col flex-grow">
        {/* Description - Fixed height container */}
        <div className="h-8 mb-2">
          {description && (
            <p className="text-[10px] text-[#1a1a1a]/70 dark:text-white/70 line-clamp-2 leading-snug">{description}</p>
          )}
        </div>

        {/* Detailed Timer */}
        {promo.valid_until && timeLeft && timeLeft !== 'expired' && (
          <div className="bg-[#4697D2]/10 dark:bg-white/5 rounded-md p-2 border border-[#4697D2]/20 dark:border-white/10 mb-2">
            <div className="flex items-center gap-1 mb-1">
              <Clock className="w-3 h-3 text-[#4697D2]" />
              <p className="text-[9px] font-medium text-[#1a1a1a]/60 dark:text-white/60">
                {t('card.timeLeft')}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {(() => {
                const now = new Date().getTime();
                const end = new Date(promo.valid_until!).getTime();
                const diff = end - now;
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                
                return (
                  <>
                    <div className="text-center">
                      <p className="text-sm font-bold text-[#1a1a1a] dark:text-white">{days}</p>
                      <p className="text-[8px] text-[#1a1a1a]/60 dark:text-white/60">{t('card.days')}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-[#1a1a1a] dark:text-white">{hours}</p>
                      <p className="text-[8px] text-[#1a1a1a]/60 dark:text-white/60">{t('card.hours')}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-[#1a1a1a] dark:text-white">{minutes}</p>
                      <p className="text-[8px] text-[#1a1a1a]/60 dark:text-white/60">{t('card.minutes')}</p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* Usage Info */}
        {promo.usage_limit && (
          <div className="flex items-center justify-between text-[9px] text-[#1a1a1a]/60 dark:text-white/60 mb-2">
            <span>{t('card.usage')}</span>
            <span className="font-medium">{promo.usage_count}/{promo.usage_limit}</span>
          </div>
        )}

        {/* Locations */}
        {locations.length > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <MapPin className="w-2.5 h-2.5 text-[#4697D2]/60 flex-shrink-0" />
            <p className="text-[9px] text-[#1a1a1a]/60 dark:text-white/60 line-clamp-1">
              {locations.map((loc) => getLocalizedName(loc)).join(', ')}
            </p>
          </div>
        )}

        {/* Spacer to push buttons to bottom */}
        <div className="flex-grow"></div>

        {/* Actions */}
        <div className="flex gap-1.5 pt-1">
          <button
            onClick={handleCopy}
            className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-[10px] font-medium transition-all ${
              copied ? 'bg-green-500 text-white' : 'bg-white/60 dark:bg-black/30 hover:bg-white dark:hover:bg-black/50 text-[#1a1a1a] dark:text-white border border-[#4697D2]/30 dark:border-white/20'
            }`}
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? t('card.copied') : t('card.copy')}</span>
          </button>

          <Link
            href={`/${locale}/bookings?promo=${promo.code}`}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-[10px] font-medium bg-[#4697D2] hover:bg-[#3a7bb0] text-white transition-all"
          >
            {t('card.book')}
          </Link>
        </div>
      </div>
    </div>
  );
}
