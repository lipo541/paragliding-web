'use client';

import { useState, useMemo } from 'react';
import { Package } from 'lucide-react';
import { 
  ServiceCardList, 
  ServiceCategoryFilter, 
  ServiceBreadcrumbs 
} from './components';
import type { AdditionalService, ServiceCategory } from '@/lib/types/services';
import type { Locale } from '@/lib/data/services';

interface ServicesPageProps {
  services: AdditionalService[];
  categories: ServiceCategory[];
  locale: Locale;
  serviceCounts?: Record<string, number>;
}

// Page title translations
const pageTitles: Record<Locale, { title: string; subtitle: string }> = {
  ka: { 
    title: 'დამატებითი სერვისები', 
    subtitle: 'აირჩიეთ სასურველი სერვისი თქვენი გამოცდილების გასაუმჯობესებლად' 
  },
  en: { 
    title: 'Additional Services', 
    subtitle: 'Choose additional services to enhance your experience' 
  },
  ru: { 
    title: 'Дополнительные услуги', 
    subtitle: 'Выберите дополнительные услуги для улучшения вашего опыта' 
  },
  ar: { 
    title: 'خدمات إضافية', 
    subtitle: 'اختر الخدمات الإضافية لتحسين تجربتك' 
  },
  de: { 
    title: 'Zusätzliche Dienstleistungen', 
    subtitle: 'Wählen Sie zusätzliche Dienste, um Ihr Erlebnis zu verbessern' 
  },
  tr: { 
    title: 'Ek Hizmetler', 
    subtitle: 'Deneyiminizi geliştirmek için ek hizmetleri seçin' 
  }
};

export default function ServicesPage({ 
  services, 
  categories, 
  locale,
  serviceCounts 
}: ServicesPageProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Filter services by category
  const filteredServices = useMemo(() => {
    if (!selectedCategoryId) return services;
    return services.filter(s => s.category_id === selectedCategoryId);
  }, [services, selectedCategoryId]);

  // Calculate service counts if not provided
  const computedServiceCounts = useMemo(() => {
    if (serviceCounts) return serviceCounts;
    
    const counts: Record<string, number> = {};
    services.forEach(service => {
      if (service.category_id) {
        counts[service.category_id] = (counts[service.category_id] || 0) + 1;
      }
    });
    return counts;
  }, [services, serviceCounts]);

  const pageContent = pageTitles[locale] || pageTitles.en;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative py-16 lg:py-24 bg-gradient-to-b from-[#4697D2]/10 to-transparent dark:from-[#4697D2]/5">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Breadcrumbs */}
          <div className="mb-8">
            <ServiceBreadcrumbs locale={locale} />
          </div>
          
          {/* Title */}
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-[#4697D2]/30 to-[#4697D2]/10 dark:from-white/10 dark:to-white/5">
                <Package className="w-8 h-8 text-[#4697D2] dark:text-white" />
              </div>
            </div>
            <h1 className="text-3xl lg:text-5xl font-bold text-gray-800 dark:text-white mb-4">
              {pageContent.title}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              {pageContent.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 max-w-7xl py-8 lg:py-12">
        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="mb-8">
            <ServiceCategoryFilter
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onCategoryChange={setSelectedCategoryId}
              locale={locale}
              serviceCounts={computedServiceCounts}
            />
          </div>
        )}

        {/* Services Grid */}
        <ServiceCardList
          services={filteredServices}
          locale={locale}
          showAddToCart={true}
        />
      </div>
    </div>
  );
}
