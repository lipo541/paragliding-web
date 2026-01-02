'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Minus, Check, ChevronDown, ChevronUp, Loader2, Gift, Camera, Video, Car, Sparkles, Star, Zap, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import { getCompanySelectedServices, getActiveServicesForLocation } from '@/lib/data/company-services';
import { AdditionalService } from '@/lib/types/services';
import { SelectedServiceItem } from '../types/cart';

interface CartItemServicesProps {
  companyId: string;
  companyName: string;
  locationId?: string;
  locale: string;
  numberOfPeople?: number; // For suggesting quantity
  selectedServices: SelectedServiceItem[];
  onServicesChange: (services: SelectedServiceItem[]) => void;
}

const translations = {
  ka: {
    enhanceExperience: '✨ გააძლიერე შენი გამოცდილება',
    subtitle: 'დაამატე სერვისები და გახადე ფრენა დაუვიწყარი',
    popular: 'პოპულარული',
    recommended: 'რეკომენდებული',
    add: 'დამატება',
    added: 'არჩეულია',
    loading: 'იტვირთება...',
    noServices: 'სერვისები არ არის',
    servicesTotal: 'სერვისების ჯამი',
    saveMemories: 'შეინახე მოგონებები',
    selected: 'არჩეული',
    showMore: 'მეტის ნახვა',
    showLess: 'ნაკლები',
    service: 'სერვისი',
  },
  en: {
    enhanceExperience: '✨ Enhance Your Experience',
    subtitle: 'Add services to make your flight unforgettable',
    popular: 'Popular',
    recommended: 'Recommended',
    add: 'Add',
    added: 'Added',
    loading: 'Loading...',
    noServices: 'No services available',
    servicesTotal: 'Services total',
    saveMemories: 'Save your memories',
    selected: 'selected',
    showMore: 'Show more',
    showLess: 'Show less',
    service: 'service',
  },
  ru: {
    enhanceExperience: '✨ Улучшите свой опыт',
    subtitle: 'Добавьте услуги и сделайте полёт незабываемым',
    popular: 'Популярное',
    recommended: 'Рекомендуем',
    add: 'Добавить',
    added: 'Добавлено',
    loading: 'Загрузка...',
    noServices: 'Нет доступных услуг',
    servicesTotal: 'Итого за услуги',
    saveMemories: 'Сохраните воспоминания',
    selected: 'выбрано',
    showMore: 'Показать больше',
    showLess: 'Меньше',
    service: 'услуга',
  },
  ar: {
    enhanceExperience: '✨ عزز تجربتك',
    subtitle: 'أضف خدمات لجعل رحلتك لا تُنسى',
    popular: 'شائع',
    recommended: 'موصى به',
    add: 'إضافة',
    added: 'مُضاف',
    loading: 'جاري التحميل...',
    noServices: 'لا توجد خدمات متاحة',
    servicesTotal: 'إجمالي الخدمات',
    saveMemories: 'احفظ ذكرياتك',
    selected: 'محدد',
    showMore: 'عرض المزيد',
    showLess: 'أقل',
    service: 'خدمة',
  },
  de: {
    enhanceExperience: '✨ Verbessern Sie Ihr Erlebnis',
    subtitle: 'Fügen Sie Services hinzu und machen Sie Ihren Flug unvergesslich',
    popular: 'Beliebt',
    recommended: 'Empfohlen',
    add: 'Hinzufügen',
    added: 'Hinzugefügt',
    loading: 'Wird geladen...',
    noServices: 'Keine Services verfügbar',
    servicesTotal: 'Services gesamt',
    saveMemories: 'Bewahren Sie Ihre Erinnerungen',
    selected: 'ausgewählt',
    showMore: 'Mehr anzeigen',
    showLess: 'Weniger',
    service: 'Service',
  },
  tr: {
    enhanceExperience: '✨ Deneyiminizi Geliştirin',
    subtitle: 'Uçuşunuzu unutulmaz kılmak için hizmet ekleyin',
    popular: 'Popüler',
    recommended: 'Önerilen',
    add: 'Ekle',
    added: 'Eklendi',
    loading: 'Yükleniyor...',
    noServices: 'Mevcut hizmet yok',
    servicesTotal: 'Hizmetler toplamı',
    saveMemories: 'Anılarınızı kaydedin',
    selected: 'seçildi',
    showMore: 'Daha fazla göster',
    showLess: 'Daha az',
    service: 'hizmet',
  },
};

// Service icon mapping based on category or name
const getServiceIcon = (service: AdditionalService) => {
  const slug = service.category?.slug?.toLowerCase() || '';
  const name = (service.name_en || '').toLowerCase();
  
  if (slug.includes('photo') || slug.includes('video') || name.includes('photo') || name.includes('video') || name.includes('drone')) {
    return Camera;
  }
  if (slug.includes('transport') || name.includes('transport') || name.includes('transfer')) {
    return Car;
  }
  if (slug.includes('gift') || name.includes('gift') || name.includes('souvenir')) {
    return Gift;
  }
  return Sparkles;
};

export default function CartItemServices({
  companyId,
  companyName,
  locationId,
  locale,
  numberOfPeople = 1,
  selectedServices,
  onServicesChange,
}: CartItemServicesProps) {
  const [services, setServices] = useState<AdditionalService[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true); // Start expanded by default

  const t = translations[locale as keyof typeof translations] || translations.en;

  // Fetch company's selected services OR location services for platform booking
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        let filteredServices: AdditionalService[] = [];
        
        if (companyId) {
          // Company booking - fetch company's selected services
          const companyServices = await getCompanySelectedServices(companyId);
          
          // Filter services for this location if locationId is provided
          filteredServices = companyServices
            .filter(cs => {
              if (!cs.service) return false;
              if (!locationId) return true;
              return cs.service.location_ids?.includes(locationId);
            })
            .map(cs => cs.service as AdditionalService)
            .filter(Boolean);
        } else if (locationId) {
          // Platform booking - fetch all active services for the location
          filteredServices = await getActiveServicesForLocation(locationId);
        }

        setServices(filteredServices);
        // Auto-expand if there are services
        if (filteredServices.length > 0) {
          setExpanded(true);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if we have at least a companyId or locationId
    if (companyId || locationId) {
      fetchServices();
    } else {
      setLoading(false);
      setServices([]);
    }
  }, [companyId, locationId]);

  // Helper function for localized service name
  const getLocalizedName = useCallback((service: AdditionalService) => {
    const nameKey = `name_${locale}` as keyof AdditionalService;
    return (service[nameKey] as string) || service.name_en || service.name_ka || '';
  }, [locale]);

  // Helper function for localized description
  const getLocalizedDescription = useCallback((service: AdditionalService) => {
    const descKey = `description_${locale}` as keyof AdditionalService;
    const desc = (service[descKey] as string) || service.description_en || '';
    // Return first 100 chars as short description
    return desc.length > 100 ? desc.substring(0, 100) + '...' : desc;
  }, [locale]);

  // Get first pricing option price
  const getServicePrice = useCallback((service: AdditionalService): number => {
    if (service.pricing?.shared_pricing?.length > 0) {
      return service.pricing.shared_pricing[0].price_gel || 0;
    }
    return 0;
  }, []);

  // Check if service is selected
  const isServiceSelected = useCallback((serviceId: string) => {
    return selectedServices.some(s => s.serviceId === serviceId);
  }, [selectedServices]);

  // Get selected service quantity
  const getServiceQuantity = useCallback((serviceId: string) => {
    const service = selectedServices.find(s => s.serviceId === serviceId);
    return service?.quantity || 0;
  }, [selectedServices]);

  // Toggle service selection
  const toggleService = useCallback((service: AdditionalService) => {
    const isSelected = isServiceSelected(service.id);

    if (isSelected) {
      onServicesChange(selectedServices.filter(s => s.serviceId !== service.id));
    } else {
      onServicesChange([
        ...selectedServices,
        {
          serviceId: service.id,
          name: getLocalizedName(service),
          price: getServicePrice(service),
          quantity: numberOfPeople, // Default to number of people
        },
      ]);
    }
  }, [selectedServices, onServicesChange, isServiceSelected, getLocalizedName, getServicePrice, numberOfPeople]);

  // Update service quantity
  const updateServiceQuantity = useCallback((serviceId: string, delta: number) => {
    onServicesChange(
      selectedServices.map(s => {
        if (s.serviceId === serviceId) {
          const newQuantity = Math.max(1, s.quantity + delta);
          return { ...s, quantity: newQuantity };
        }
        return s;
      })
    );
  }, [selectedServices, onServicesChange]);

  // Calculate services total
  const servicesTotal = selectedServices.reduce((sum, s) => sum + s.price * s.quantity, 0);

  // Don't render if no services available
  if (!loading && services.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 relative">
      <div className="relative bg-foreground/5 rounded-lg overflow-hidden">
        {/* Header - Compact */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-2.5 py-1.5 flex items-center justify-between hover:bg-foreground/10 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-[#4697D2] to-purple-500 dark:from-[#CAFA00] dark:to-[#4697D2] flex items-center justify-center">
              <Gift className="w-3 h-3 text-white dark:text-black" />
            </div>
            <span className="text-[11px] font-medium text-foreground/70">
              + სერვისები
              {services.length > 0 && <span className="text-foreground/40 ml-1">({services.length})</span>}
            </span>
          </div>
          
          <div className="flex items-center gap-1.5">
            {selectedServices.length > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-[#4697D2] dark:bg-[#CAFA00] text-white dark:text-black text-[10px] font-bold">
                {selectedServices.length}✓
              </span>
            )}
            <ChevronDown className={`w-3 h-3 text-foreground/40 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {/* Services List - Compact */}
        {expanded && (
          <div className="px-2 pb-2">
            {loading ? (
              <div className="flex items-center justify-center py-3">
                <Loader2 className="w-4 h-4 text-[#4697D2] animate-spin" />
              </div>
            ) : (
              <div className="space-y-1">
                {services.map((service, index) => {
                  const isSelected = isServiceSelected(service.id);
                  const quantity = getServiceQuantity(service.id);
                  const name = getLocalizedName(service);
                  const description = getLocalizedDescription(service);
                  const price = getServicePrice(service);
                  const IconComponent = getServiceIcon(service);
                  const thumbnail = service.gallery_images?.[0]?.url;
                  const categoryName = service.category?.name_ka || service.category?.name_en || '';

                  return (
                    <div
                      key={service.id}
                      className={`
                        w-full flex items-start gap-2 px-2 py-2 rounded-lg transition-all
                        ${isSelected
                          ? 'bg-[#4697D2]/15 dark:bg-[#CAFA00]/15 ring-1 ring-[#4697D2]/30 dark:ring-[#CAFA00]/30'
                          : 'bg-white/50 dark:bg-white/5 hover:bg-foreground/10'
                        }
                      `}
                    >
                      {/* Thumbnail or Icon - Clickable */}
                      <button
                        onClick={() => toggleService(service)}
                        className={`w-10 h-10 rounded flex-shrink-0 overflow-hidden ${isSelected ? '' : 'opacity-80'}`}
                      >
                        {thumbnail ? (
                          <Image src={thumbnail} alt={name} width={40} height={40} className="w-full h-full object-cover" />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center ${isSelected ? 'bg-[#4697D2]/20' : 'bg-foreground/10'}`}>
                            <IconComponent className={`w-5 h-5 ${isSelected ? 'text-[#4697D2] dark:text-[#CAFA00]' : 'text-foreground/50'}`} />
                          </div>
                        )}
                      </button>

                      {/* Content - Clickable */}
                      <button
                        onClick={() => toggleService(service)}
                        className="flex-1 min-w-0 text-left"
                      >
                        {/* Name + Category badge */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[11px] font-medium ${isSelected ? 'text-[#4697D2] dark:text-[#CAFA00]' : 'text-foreground'}`}>
                            {name}
                          </span>
                          {categoryName && (
                            <span className="text-[9px] px-1 py-0.5 rounded bg-foreground/10 text-foreground/50">
                              {categoryName}
                            </span>
                          )}
                        </div>
                        
                        {/* Description */}
                        {description && (
                          <p className="text-[10px] text-foreground/50 mt-0.5 line-clamp-2 leading-tight">
                            {description}
                          </p>
                        )}
                      </button>

                      {/* Price & Quantity Controls */}
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`text-[11px] font-bold ${isSelected ? 'text-[#4697D2] dark:text-[#CAFA00]' : 'text-foreground'}`}>
                          {isSelected && quantity > 1 ? `${quantity}×` : '+'}{price}₾
                        </span>
                        
                        {isSelected ? (
                          /* Quantity Controls */
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (quantity <= 1) {
                                  toggleService(service); // Remove if quantity would be 0
                                } else {
                                  updateServiceQuantity(service.id, -1);
                                }
                              }}
                              className="w-5 h-5 rounded flex items-center justify-center bg-foreground/10 hover:bg-foreground/20 transition-colors"
                            >
                              <Minus className="w-3 h-3 text-foreground/60" />
                            </button>
                            <span className="w-5 text-center text-[11px] font-medium text-foreground">{quantity}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateServiceQuantity(service.id, 1);
                              }}
                              className="w-5 h-5 rounded flex items-center justify-center bg-[#4697D2] dark:bg-[#CAFA00] hover:opacity-80 transition-opacity"
                            >
                              <Plus className="w-3 h-3 text-white dark:text-black" />
                            </button>
                          </div>
                        ) : (
                          /* Add Button */
                          <button
                            onClick={() => toggleService(service)}
                            className="w-5 h-5 rounded flex items-center justify-center bg-foreground/10 hover:bg-foreground/20 transition-colors"
                          >
                            <Plus className="w-3 h-3 text-foreground/40" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Total - Compact */}
                {selectedServices.length > 0 && (
                  <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-foreground/10 text-[11px]">
                    <span className="text-foreground/60">
                      {selectedServices.length} {t.service}
                      {selectedServices.reduce((sum, s) => sum + s.quantity, 0) > selectedServices.length && 
                        ` (${selectedServices.reduce((sum, s) => sum + s.quantity, 0)} ერთ.)`
                      }
                    </span>
                    <span className="font-bold text-[#4697D2] dark:text-[#CAFA00]">+{servicesTotal}₾</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Collapsed Summary - Ultra Compact */}
        {!expanded && selectedServices.length > 0 && (
          <div className="px-2 pb-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-foreground/50 truncate">
                {selectedServices.map(s => s.quantity > 1 ? `${s.name} ×${s.quantity}` : s.name).join(', ')}
              </span>
              <span className="font-bold text-[#4697D2] dark:text-[#CAFA00] ml-1">+{servicesTotal}₾</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
