'use client';

import Image from 'next/image';
import { Building2, BadgeCheck, Share2, QrCode, Star, MapPin } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { SupportedLocale, getLocalizedField, formatRating } from '../utils/companyProfileHelpers';

interface CompanyData {
  id: string;
  slug?: string | null;
  logo_url?: string | null;
  og_image?: string | null;
  cover_image_url?: string | null;
  status: string;
  cached_rating?: number | null;
  cached_rating_count?: number | null;
  name_ka?: string | null;
  name_en?: string | null;
  name_ru?: string | null;
  name_ar?: string | null;
  name_de?: string | null;
  name_tr?: string | null;
  country?: {
    name_ka?: string | null;
    name_en?: string | null;
  } | null;
}

interface CompanyHeaderProps {
  company: CompanyData;
  locale: SupportedLocale;
  translations: {
    verified: string;
    share: string;
    qrCode: string;
    reviews: string;
  };
}

export default function CompanyHeader({ company, locale, translations }: CompanyHeaderProps) {
  const [qrModal, setQrModal] = useState(false);
  const name = getLocalizedField(company, 'name', locale);
  const rating = company.cached_rating || 0;
  const reviewCount = company.cached_rating_count || 0;
  const verified = company.status === 'verified';
  const countryName = company.country 
    ? getLocalizedField(company.country, 'name', locale)
    : '';

  // Build profile URL statically to avoid hydration mismatch
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://flygeorgia.co';
  const companySlug = company.slug || company.id;
  const profileUrl = `${baseUrl}/${locale}/company/${companySlug}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: name,
          url: profileUrl,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(profileUrl);
    }
  };

  return (
    <>
      {/* Cover/Background */}
      <div className="relative h-32 md:h-40 bg-gradient-to-br from-[#4697D2]/20 via-[#4697D2]/10 to-transparent dark:from-[#4697D2]/30 dark:via-[#4697D2]/15">
        {(company.cover_image_url || company.og_image) && (
          <Image
            src={company.cover_image_url || company.og_image!}
            alt={name}
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-white/80 dark:from-zinc-950/90 to-transparent" />
      </div>

      {/* Profile Section */}
      <div className="relative px-4 md:px-6 -mt-16 pb-4">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          {/* Logo */}
          <div className="relative">
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl bg-white dark:bg-zinc-900 border-4 border-white dark:border-zinc-900 shadow-xl overflow-hidden">
              {company.logo_url ? (
                <Image
                  src={company.logo_url}
                  alt={name}
                  fill
                  className="object-contain p-2"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#4697D2]/10 to-transparent">
                  <Building2 className="w-12 h-12 text-[#4697D2]/40" />
                </div>
              )}
            </div>
            {verified && (
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center border-2 border-white dark:border-zinc-900">
                <BadgeCheck className="w-5 h-5 text-white" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white truncate">
                  {name}
                </h1>
                {countryName && (
                  <div className="flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{countryName}</span>
                  </div>
                )}
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  title={translations.share}
                >
                  <Share2 className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                </button>
                <button
                  onClick={() => setQrModal(true)}
                  className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  title={translations.qrCode}
                >
                  <QrCode className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                </button>
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= rating
                        ? 'fill-[#ffc107] text-[#ffc107]'
                        : 'fill-transparent text-zinc-300 dark:text-zinc-600'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-zinc-900 dark:text-white">
                {formatRating(rating)}
              </span>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                ({reviewCount} {translations.reviews})
              </span>
            </div>
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
            className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-xs w-full"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-center mb-4 text-zinc-900 dark:text-white">
              {translations.qrCode}
            </h3>
            <div className="flex justify-center p-4 bg-white rounded-xl">
              <QRCodeSVG value={profileUrl} size={200} />
            </div>
            <p className="text-center text-sm text-zinc-500 mt-4 break-all">
              {profileUrl}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
