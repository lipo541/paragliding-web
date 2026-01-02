'use client';

import { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import ServiceCard from './ServiceCard';
import type { AdditionalService } from '@/lib/types/services';
import type { Locale } from '@/lib/data/services';

interface ServiceCardListProps {
  services: AdditionalService[];
  locale: Locale;
  locationId?: string;
  categoryId?: string;
  showAddToCart?: boolean;
  maxItems?: number;
  emptyMessage?: string;
  title?: string;
  showTitle?: boolean;
}

export default function ServiceCardList({
  services,
  locale,
  locationId,
  categoryId,
  showAddToCart = true,
  maxItems,
  emptyMessage,
  title,
  showTitle = false
}: ServiceCardListProps) {
  const [filteredServices, setFilteredServices] = useState<AdditionalService[]>(services);

  useEffect(() => {
    let result = [...services];
    
    // Filter by location if provided
    if (locationId) {
      result = result.filter(s => s.location_ids?.includes(locationId));
    }
    
    // Filter by category if provided
    if (categoryId) {
      result = result.filter(s => s.category_id === categoryId);
    }
    
    // Limit items if maxItems is set
    if (maxItems && maxItems > 0) {
      result = result.slice(0, maxItems);
    }
    
    setFilteredServices(result);
  }, [services, locationId, categoryId, maxItems]);

  // Empty state translations
  const emptyTexts: Record<Locale, string> = {
    ka: 'სერვისები არ მოიძებნა',
    en: 'No services found',
    ru: 'Услуги не найдены',
    ar: 'لم يتم العثور على خدمات',
    de: 'Keine Dienste gefunden',
    tr: 'Hizmet bulunamadı'
  };

  if (filteredServices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 flex items-center justify-center mb-4">
          <Package className="w-8 h-8 text-[#4697D2] dark:text-white/60" />
        </div>
        <p className="text-gray-500 dark:text-gray-400">
          {emptyMessage || emptyTexts[locale]}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showTitle && title && (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-[#4697D2]/30 to-[#4697D2]/10 dark:from-white/10 dark:to-white/5">
            <Package className="w-5 h-5 text-[#4697D2] dark:text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h2>
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredServices.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            locale={locale}
            showAddToCart={showAddToCart}
          />
        ))}
      </div>
    </div>
  );
}
