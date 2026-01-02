'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Sparkles, Plus, Check, ChevronDown, ChevronUp, Loader2, Package } from 'lucide-react';
import { getActiveServicesForLocation, getCompanySelectedServices } from '@/lib/data/company-services';
import { AdditionalService } from '@/lib/types/services';

// =====================================================
// Types
// =====================================================
export interface SelectedService {
  serviceId: string;
  name: string;
  price: number;
  priceUsd: number;
  priceEur: number;
  quantity: number;
  pricingOptionId?: string;
}

interface QuickBookingServicesProps {
  locationId: string;
  companyId?: string | null;
  locale: string;
  selectedCurrency: 'GEL' | 'USD' | 'EUR';
  selectedServices: SelectedService[];
  onServicesChange: (services: SelectedService[]) => void;
}

// =====================================================
// Translations
// =====================================================
const translations = {
  ka: {
    title: 'დამატებითი სერვისები',
    subtitle: 'გააუმჯობესეთ თქვენი ფრენის გამოცდილება',
    add: 'დამატება',
    added: 'დამატებული',
    perFlight: 'ფრენაზე',
    loading: 'იტვირთება...',
    noServices: 'დამატებითი სერვისები არ არის ხელმისაწვდომი',
    recommended: 'რეკომენდებული',
    selected: 'არჩეული',
    total: 'სულ',
  },
  en: {
    title: 'Additional Services',
    subtitle: 'Enhance your flight experience',
    add: 'Add',
    added: 'Added',
    perFlight: 'per flight',
    loading: 'Loading...',
    noServices: 'No additional services available',
    recommended: 'Recommended',
    selected: 'selected',
    total: 'Total',
  },
  ru: {
    title: 'Дополнительные услуги',
    subtitle: 'Улучшите ваш полет',
    add: 'Добавить',
    added: 'Добавлено',
    perFlight: 'за полет',
    loading: 'Загрузка...',
    noServices: 'Дополнительные услуги недоступны',
    recommended: 'Рекомендуемое',
    selected: 'выбрано',
    total: 'Итого',
  },
  de: {
    title: 'Zusätzliche Dienste',
    subtitle: 'Verbessern Sie Ihr Flugerlebnis',
    add: 'Hinzufügen',
    added: 'Hinzugefügt',
    perFlight: 'pro Flug',
    loading: 'Lädt...',
    noServices: 'Keine zusätzlichen Dienste verfügbar',
    recommended: 'Empfohlen',
    selected: 'ausgewählt',
    total: 'Gesamt',
  },
  tr: {
    title: 'Ek Hizmetler',
    subtitle: 'Uçuş deneyiminizi geliştirin',
    add: 'Ekle',
    added: 'Eklendi',
    perFlight: 'uçuş başına',
    loading: 'Yükleniyor...',
    noServices: 'Ek hizmet mevcut değil',
    recommended: 'Önerilen',
    selected: 'seçili',
    total: 'Toplam',
  },
  ar: {
    title: 'خدمات إضافية',
    subtitle: 'حسّن تجربة طيرانك',
    add: 'إضافة',
    added: 'مضاف',
    perFlight: 'لكل رحلة',
    loading: 'جاري التحميل...',
    noServices: 'لا توجد خدمات إضافية',
    recommended: 'موصى به',
    selected: 'محدد',
    total: 'المجموع',
  },
};

// =====================================================
// Component
// =====================================================
export function QuickBookingServices({
  locationId,
  companyId,
  locale,
  selectedCurrency,
  selectedServices,
  onServicesChange,
}: QuickBookingServicesProps) {
  const [services, setServices] = useState<AdditionalService[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

  const t = translations[locale as keyof typeof translations] || translations.en;

  // =====================================================
  // Fetch services based on mode
  // =====================================================
  useEffect(() => {
    const fetchServices = async () => {
      if (!locationId) {
        setServices([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        if (companyId) {
          // Company direct booking - show only company's selected services
          const companyServices = await getCompanySelectedServices(companyId);
          // Filter services that are available at this location
          const locationServices = companyServices
            .filter(cs => cs.service?.location_ids?.includes(locationId))
            .map(cs => cs.service as AdditionalService)
            .filter(Boolean);
          setServices(locationServices);
        } else {
          // Platform general booking - show all services for this location
          const locationServices = await getActiveServicesForLocation(locationId);
          setServices(locationServices);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [locationId, companyId]);

  // =====================================================
  // Helper: Get localized name
  // =====================================================
  const getLocalizedName = useCallback(
    (service: AdditionalService) => {
      const nameKey = `name_${locale}` as keyof AdditionalService;
      return (service[nameKey] as string) || service.name_en || service.name_ka || '';
    },
    [locale]
  );

  // =====================================================
  // Helper: Get localized description
  // =====================================================
  const getLocalizedDescription = useCallback(
    (service: AdditionalService) => {
      const descKey = `description_${locale}` as keyof AdditionalService;
      return (service[descKey] as string) || service.description_en || service.description_ka || '';
    },
    [locale]
  );

  // =====================================================
  // Helper: Get price based on currency
  // =====================================================
  const getServicePrice = useCallback(
    (service: AdditionalService, currency: 'GEL' | 'USD' | 'EUR' = 'GEL'): number => {
      if (service.pricing?.shared_pricing?.length > 0) {
        const pricing = service.pricing.shared_pricing[0];
        switch (currency) {
          case 'USD':
            return pricing.price_usd || 0;
          case 'EUR':
            return pricing.price_eur || 0;
          default:
            return pricing.price_gel || 0;
        }
      }
      return 0;
    },
    []
  );

  // =====================================================
  // Helper: Get currency symbol
  // =====================================================
  const getCurrencySymbol = useCallback((currency: 'GEL' | 'USD' | 'EUR') => {
    switch (currency) {
      case 'USD':
        return '$';
      case 'EUR':
        return '€';
      default:
        return '₾';
    }
  }, []);

  // =====================================================
  // Check if service is selected
  // =====================================================
  const isServiceSelected = useCallback(
    (serviceId: string) => {
      return selectedServices.some(s => s.serviceId === serviceId);
    },
    [selectedServices]
  );

  // =====================================================
  // Toggle service selection
  // =====================================================
  const toggleService = useCallback(
    (service: AdditionalService) => {
      const isSelected = isServiceSelected(service.id);

      if (isSelected) {
        // Remove service
        onServicesChange(selectedServices.filter(s => s.serviceId !== service.id));
      } else {
        // Add service with all currency prices
        const pricing = service.pricing?.shared_pricing?.[0];
        onServicesChange([
          ...selectedServices,
          {
            serviceId: service.id,
            name: getLocalizedName(service),
            price: pricing?.price_gel || 0,
            priceUsd: pricing?.price_usd || 0,
            priceEur: pricing?.price_eur || 0,
            quantity: 1,
            pricingOptionId: pricing?.id,
          },
        ]);
      }
    },
    [selectedServices, onServicesChange, isServiceSelected, getLocalizedName]
  );

  // =====================================================
  // Calculate total services price
  // =====================================================
  const getServicesTotal = useCallback(() => {
    return selectedServices.reduce((sum, s) => {
      switch (selectedCurrency) {
        case 'USD':
          return sum + s.priceUsd * s.quantity;
        case 'EUR':
          return sum + s.priceEur * s.quantity;
        default:
          return sum + s.price * s.quantity;
      }
    }, 0);
  }, [selectedServices, selectedCurrency]);

  // Don't render if no services available
  if (!loading && services.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-[#4697D2]/10 via-white/50 to-[#CAFA00]/5 dark:from-[#4697D2]/20 dark:via-black/40 dark:to-[#CAFA00]/10 backdrop-blur-xl rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/30 border border-[#4697D2]/30 dark:border-white/10 overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-white/30 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#4697D2]/20 dark:bg-[#CAFA00]/20">
            <Sparkles className="w-4 h-4 text-[#4697D2] dark:text-[#CAFA00]" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{t.title}</h3>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{t.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedServices.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-[#4697D2] text-white text-[10px] font-medium">
              {selectedServices.length}
            </span>
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-zinc-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-500" />
          )}
        </div>
      </button>

      {/* Content */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 text-[#4697D2] animate-spin" />
              <span className="ml-2 text-xs text-zinc-500">{t.loading}</span>
            </div>
          ) : (
            <div className="grid gap-1.5">
              {services.map((service, index) => {
                const isSelected = isServiceSelected(service.id);
                const name = getLocalizedName(service);
                const description = getLocalizedDescription(service);
                const price = getServicePrice(service, selectedCurrency);

                return (
                  <button
                    type="button"
                    key={service.id}
                    onClick={() => toggleService(service)}
                    className={`
                      w-full p-2.5 rounded-xl border transition-all duration-200
                      ${
                        isSelected
                          ? 'bg-[#4697D2]/10 dark:bg-[#CAFA00]/10 border-[#4697D2] dark:border-[#CAFA00] shadow-md shadow-[#4697D2]/20 dark:shadow-[#CAFA00]/20'
                          : 'bg-white/50 dark:bg-white/5 border-zinc-200/50 dark:border-white/10 hover:border-[#4697D2]/50 dark:hover:border-[#CAFA00]/50 hover:shadow-sm'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        {/* Selection indicator */}
                        <div
                          className={`
                            mt-0.5 w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors
                            ${
                              isSelected
                                ? 'bg-[#4697D2] dark:bg-[#CAFA00]'
                                : 'bg-zinc-200/70 dark:bg-white/10'
                            }
                          `}
                        >
                          {isSelected ? (
                            <Check className="w-2.5 h-2.5 text-white dark:text-black" />
                          ) : (
                            <Plus className="w-2.5 h-2.5 text-zinc-500 dark:text-zinc-400" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-medium text-zinc-800 dark:text-white truncate">
                              {name}
                            </h4>
                            {index === 0 && (
                              <span className="px-1 py-0.5 rounded text-[8px] font-medium bg-[#4697D2]/20 text-[#4697D2] dark:bg-[#CAFA00]/20 dark:text-[#CAFA00]">
                                {t.recommended}
                              </span>
                            )}
                          </div>
                          {description && (
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1">
                              {description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Price */}
                      <div className="flex flex-col items-end flex-shrink-0">
                        <span
                          className={`text-sm font-bold ${
                            isSelected ? 'text-[#4697D2] dark:text-[#CAFA00]' : 'text-zinc-700 dark:text-white'
                          }`}
                        >
                          {getCurrencySymbol(selectedCurrency)}
                          {price}
                        </span>
                        <span className="text-[9px] text-zinc-400">{t.perFlight}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Selected services summary */}
          {selectedServices.length > 0 && (
            <div className="mt-2 pt-2 border-t border-zinc-200/50 dark:border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                  <Package className="w-3.5 h-3.5" />
                  <span>
                    {selectedServices.length} {t.selected}
                  </span>
                </div>
                <span className="text-sm font-bold text-[#4697D2] dark:text-[#CAFA00]">
                  +{getCurrencySymbol(selectedCurrency)}
                  {getServicesTotal()}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default QuickBookingServices;
