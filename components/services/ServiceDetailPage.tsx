'use client';

import { useState } from 'react';
import { Package, MapPin, Tag, Share2, Heart, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { 
  ServiceGallery, 
  ServiceVideoPlayer, 
  ServicePricingDisplay, 
  ServiceBreadcrumbs,
  ServiceCardList
} from './components';
import type { AdditionalService } from '@/lib/types/services';
import { getLocalizedField } from '@/lib/data/services';
import type { Locale } from '@/lib/data/services';

interface ServiceDetailPageProps {
  service: AdditionalService;
  locale: Locale;
  relatedServices?: AdditionalService[];
}

// Translation labels
const labels: Record<Locale, {
  description: string;
  pricing: string;
  gallery: string;
  videos: string;
  locations: string;
  related: string;
  back: string;
  share: string;
  save: string;
}> = {
  ka: {
    description: 'აღწერა',
    pricing: 'ფასები',
    gallery: 'გალერეა',
    videos: 'ვიდეოები',
    locations: 'ლოკაციები',
    related: 'მსგავსი სერვისები',
    back: 'უკან',
    share: 'გაზიარება',
    save: 'შენახვა'
  },
  en: {
    description: 'Description',
    pricing: 'Pricing',
    gallery: 'Gallery',
    videos: 'Videos',
    locations: 'Locations',
    related: 'Related Services',
    back: 'Back',
    share: 'Share',
    save: 'Save'
  },
  ru: {
    description: 'Описание',
    pricing: 'Цены',
    gallery: 'Галерея',
    videos: 'Видео',
    locations: 'Локации',
    related: 'Похожие услуги',
    back: 'Назад',
    share: 'Поделиться',
    save: 'Сохранить'
  },
  ar: {
    description: 'الوصف',
    pricing: 'الأسعار',
    gallery: 'المعرض',
    videos: 'مقاطع الفيديو',
    locations: 'المواقع',
    related: 'خدمات مشابهة',
    back: 'رجوع',
    share: 'مشاركة',
    save: 'حفظ'
  },
  de: {
    description: 'Beschreibung',
    pricing: 'Preise',
    gallery: 'Galerie',
    videos: 'Videos',
    locations: 'Standorte',
    related: 'Ähnliche Dienste',
    back: 'Zurück',
    share: 'Teilen',
    save: 'Speichern'
  },
  tr: {
    description: 'Açıklama',
    pricing: 'Fiyatlandırma',
    gallery: 'Galeri',
    videos: 'Videolar',
    locations: 'Konumlar',
    related: 'İlgili Hizmetler',
    back: 'Geri',
    share: 'Paylaş',
    save: 'Kaydet'
  }
};

export default function ServiceDetailPage({ 
  service, 
  locale,
  relatedServices = []
}: ServiceDetailPageProps) {
  const [isSaved, setIsSaved] = useState(false);

  const name = getLocalizedField<string>(service, 'name', locale) || service.name_en;
  const description = getLocalizedField<string>(service, 'description', locale) || service.description_en;
  
  // Get category name
  const categoryName = service.category 
    ? (service.category[`name_${locale}` as keyof typeof service.category] || service.category.name_en)
    : null;

  const localeLabels = labels[locale] || labels.en;

  const hasGallery = service.gallery_images && service.gallery_images.length > 0;
  const hasVideos = service.video_urls && service.video_urls.length > 0;
  const hasRelated = relatedServices.length > 0;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: name,
          text: description || '',
          url: window.location.href
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="min-h-screen pb-16">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#4697D2]/10 to-transparent dark:from-[#4697D2]/5 py-6 lg:py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Breadcrumbs */}
          <div className="mb-6">
            <ServiceBreadcrumbs locale={locale} serviceName={name} />
          </div>
          
          {/* Back button & Actions */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <Link
              href={`/${locale}/services`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:bg-[rgba(70,151,210,0.25)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{localeLabels.back}</span>
            </Link>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="p-2.5 rounded-xl bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:bg-[rgba(70,151,210,0.25)] transition-colors"
                title={localeLabels.share}
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsSaved(!isSaved)}
                className={`p-2.5 rounded-xl border transition-colors ${
                  isSaved
                    ? 'bg-red-500/20 border-red-500/30 text-red-500'
                    : 'bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border-[#4697D2]/30 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:bg-[rgba(70,151,210,0.25)]'
                }`}
                title={localeLabels.save}
              >
                <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>
          
          {/* Title */}
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-[#4697D2]/30 to-[#4697D2]/10 dark:from-white/10 dark:to-white/5 flex-shrink-0">
              <Package className="w-8 h-8 text-[#4697D2] dark:text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-4xl font-bold text-gray-800 dark:text-white mb-2">
                {name}
              </h1>
              {categoryName && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4697D2]/20 text-[#4697D2] dark:text-[#CAFA00] text-sm font-medium">
                  <Tag className="w-3.5 h-3.5" />
                  {categoryName}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 max-w-7xl py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Media & Description */}
          <div className="lg:col-span-2 space-y-8">
            {/* Gallery */}
            {hasGallery && (
              <section>
                <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800 dark:text-white mb-4">
                  {localeLabels.gallery}
                </h2>
                <div className="bg-[rgba(70,151,210,0.15)] dark:bg-black/40 backdrop-blur-xl rounded-xl border border-[#4697D2]/30 dark:border-white/10 p-4">
                  <ServiceGallery
                    images={service.gallery_images}
                    locale={locale}
                    serviceName={name}
                  />
                </div>
              </section>
            )}

            {/* Videos */}
            {hasVideos && (
              <section>
                <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800 dark:text-white mb-4">
                  {localeLabels.videos}
                </h2>
                <div className="bg-[rgba(70,151,210,0.15)] dark:bg-black/40 backdrop-blur-xl rounded-xl border border-[#4697D2]/30 dark:border-white/10 p-4">
                  <ServiceVideoPlayer videoUrls={service.video_urls} />
                </div>
              </section>
            )}

            {/* Description */}
            {description && (
              <section>
                <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800 dark:text-white mb-4">
                  {localeLabels.description}
                </h2>
                <div className="bg-[rgba(70,151,210,0.15)] dark:bg-black/40 backdrop-blur-xl rounded-xl border border-[#4697D2]/30 dark:border-white/10 p-6">
                  <div 
                    className="prose prose-gray dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: description.replace(/\n/g, '<br />') }}
                  />
                </div>
              </section>
            )}
          </div>

          {/* Right Column - Pricing (Sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <section>
                <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800 dark:text-white mb-4">
                  {localeLabels.pricing}
                </h2>
                <div className="bg-[rgba(70,151,210,0.15)] dark:bg-black/40 backdrop-blur-xl rounded-xl border border-[#4697D2]/30 dark:border-white/10 p-6">
                  <ServicePricingDisplay
                    service={service}
                    locale={locale}
                  />
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* Related Services */}
        {hasRelated && (
          <section className="mt-16">
            <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-800 dark:text-white mb-6">
              {localeLabels.related}
            </h2>
            <ServiceCardList
              services={relatedServices}
              locale={locale}
              maxItems={4}
              showAddToCart={true}
            />
          </section>
        )}
      </div>
    </div>
  );
}
