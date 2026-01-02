"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Sparkles, Plus, Check, ChevronDown, ChevronUp, Loader2, Package } from "lucide-react";
import { getActiveServicesForLocation, getCompanySelectedServices } from "@/lib/data/company-services";
import { AdditionalService } from "@/lib/types/services";
import { CartItem } from "@/components/cart/types/cart";

interface SelectedService {
  serviceId: string;
  name: string;
  price: number;
  quantity: number;
}

interface AdditionalServicesUpsellProps {
  locationIds: string[];
  locale: string;
  selectedServices: SelectedService[];
  onServicesChange: (services: SelectedService[]) => void;
  cartItems?: CartItem[]; // Cart items to extract company IDs and filter already added services
}

const translations = {
  ka: {
    title: "დამატებითი სერვისები",
    subtitle: "გააუმჯობესეთ თქვენი ფრენის გამოცდილება",
    add: "დამატება",
    added: "დამატებული",
    perFlight: "ფრენაზე",
    loading: "იტვირთება...",
    noServices: "დამატებითი სერვისები არ არის ხელმისაწვდომი",
    recommended: "რეკომენდებული",
  },
  en: {
    title: "Additional Services",
    subtitle: "Enhance your flight experience",
    add: "Add",
    added: "Added",
    perFlight: "per flight",
    loading: "Loading...",
    noServices: "No additional services available",
    recommended: "Recommended",
  },
};

export function AdditionalServicesUpsell({
  locationIds,
  locale,
  selectedServices,
  onServicesChange,
  cartItems = [],
}: AdditionalServicesUpsellProps) {
  const [services, setServices] = useState<AdditionalService[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  
  const t = translations[locale as keyof typeof translations] || translations.en;

  // Extract company IDs and check for platform bookings from cart items
  const { companyIds, hasPlatformBooking } = React.useMemo(() => {
    const ids = new Set<string>();
    let hasPlatform = false;
    
    for (const item of cartItems) {
      if (item.itemType === 'service') continue; // Skip service items
      if (item.company?.id) {
        ids.add(item.company.id);
      } else {
        hasPlatform = true;
      }
    }
    
    return { companyIds: Array.from(ids), hasPlatformBooking: hasPlatform };
  }, [cartItems]);

  // Get service IDs already in cart
  const cartServiceIds = React.useMemo(() => {
    return new Set(
      cartItems
        .filter(item => item.itemType === 'service' && item.service?.id)
        .map(item => item.service!.id)
    );
  }, [cartItems]);

  // Fetch services based on cart context
  useEffect(() => {
    const fetchServices = async () => {
      if (locationIds.length === 0) {
        setServices([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const allServices: AdditionalService[] = [];
        const seenIds = new Set<string>();

        // Case 1: If there are company bookings, fetch their selected services
        if (companyIds.length > 0) {
          for (const companyId of companyIds) {
            const companySelectedServices = await getCompanySelectedServices(companyId);
            
            for (const css of companySelectedServices) {
              if (!css.service) continue;
              
              // Check if service is available in any of the cart locations
              const isInCartLocations = css.service.location_ids?.some(
                (lid: string) => locationIds.includes(lid)
              );
              
              if (isInCartLocations && !seenIds.has(css.service.id)) {
                seenIds.add(css.service.id);
                allServices.push(css.service as AdditionalService);
              }
            }
          }
        }

        // Case 2: If there are platform bookings (no company), fetch all services for those locations
        if (hasPlatformBooking) {
          for (const locationId of locationIds) {
            const locationServices = await getActiveServicesForLocation(locationId);
            for (const service of locationServices) {
              if (!seenIds.has(service.id)) {
                seenIds.add(service.id);
                allServices.push(service);
              }
            }
          }
        }

        // Filter out services already in cart
        const filteredServices = allServices.filter(
          service => !cartServiceIds.has(service.id)
        );

        setServices(filteredServices);
      } catch (error) {
        console.error("Error fetching services:", error);
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [locationIds, companyIds, hasPlatformBooking, cartServiceIds]);

  // Helper function for localized service name
  const getLocalizedName = useCallback((service: AdditionalService) => {
    const nameKey = `name_${locale}` as keyof AdditionalService;
    return (service[nameKey] as string) || service.name_en || service.name_ka || "";
  }, [locale]);

  // Helper function for localized service description
  const getLocalizedDescription = useCallback((service: AdditionalService) => {
    const descKey = `description_${locale}` as keyof AdditionalService;
    return (service[descKey] as string) || service.description_en || service.description_ka || "";
  }, [locale]);
  
  // Helper function to get first pricing option price
  const getServicePrice = useCallback((service: AdditionalService): number => {
    if (service.pricing?.shared_pricing?.length > 0) {
      return service.pricing.shared_pricing[0].price_gel || 0;
    }
    return 0;
  }, []);

  // Check if service is selected
  const isServiceSelected = useCallback((serviceId: string) => {
    return selectedServices.some((s) => s.serviceId === serviceId);
  }, [selectedServices]);

  // Toggle service selection
  const toggleService = useCallback((service: AdditionalService) => {
    const isSelected = isServiceSelected(service.id);
    
    if (isSelected) {
      // Remove service
      onServicesChange(selectedServices.filter((s) => s.serviceId !== service.id));
    } else {
      // Add service
      onServicesChange([
        ...selectedServices,
        {
          serviceId: service.id,
          name: getLocalizedName(service),
          price: getServicePrice(service),
          quantity: 1,
        },
      ]);
    }
  }, [selectedServices, onServicesChange, isServiceSelected, getLocalizedName, getServicePrice]);

  // Don't render if no services
  if (!loading && services.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-[#4697D2]/10 via-white/50 to-[#CAFA00]/5 dark:from-[#4697D2]/20 dark:via-black/40 dark:to-[#CAFA00]/10 backdrop-blur-xl rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/30 border border-[#4697D2]/30 dark:border-white/10 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/30 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#4697D2]/20 dark:bg-[#CAFA00]/20">
            <Sparkles className="w-5 h-5 text-[#4697D2] dark:text-[#CAFA00]" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
              {t.title}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {t.subtitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedServices.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-[#4697D2] text-white text-xs font-medium">
              {selectedServices.length}
            </span>
          )}
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-zinc-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-zinc-500" />
          )}
        </div>
      </button>

      {/* Content */}
      {expanded && (
        <div className="p-4 pt-0 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-6 h-6 text-[#4697D2] animate-spin" />
              <span className="ml-2 text-sm text-zinc-500">{t.loading}</span>
            </div>
          ) : (
            <div className="grid gap-2">
              {services.map((service, index) => {
                const isSelected = isServiceSelected(service.id);
                const name = getLocalizedName(service);
                const description = getLocalizedDescription(service);

                return (
                  <button
                    key={service.id}
                    onClick={() => toggleService(service)}
                    className={`
                      w-full p-3 rounded-xl border transition-all duration-200
                      ${isSelected
                        ? "bg-[#4697D2]/10 dark:bg-[#CAFA00]/10 border-[#4697D2] dark:border-[#CAFA00] shadow-lg shadow-[#4697D2]/20 dark:shadow-[#CAFA00]/20"
                        : "bg-white/50 dark:bg-white/5 border-zinc-200/50 dark:border-white/10 hover:border-[#4697D2]/50 dark:hover:border-[#CAFA00]/50 hover:shadow-md"
                      }
                    `}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Selection indicator */}
                        <div
                          className={`
                            mt-0.5 w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors
                            ${isSelected
                              ? "bg-[#4697D2] dark:bg-[#CAFA00]"
                              : "bg-zinc-200/70 dark:bg-white/10"
                            }
                          `}
                        >
                          {isSelected ? (
                            <Check className="w-3.5 h-3.5 text-white dark:text-black" />
                          ) : (
                            <Plus className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium text-zinc-800 dark:text-white truncate">
                              {name}
                            </h4>
                            {index === 0 && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#4697D2]/20 text-[#4697D2] dark:bg-[#CAFA00]/20 dark:text-[#CAFA00]">
                                {t.recommended}
                              </span>
                            )}
                          </div>
                          {description && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1">
                              {description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Price */}
                      <div className="flex flex-col items-end flex-shrink-0">
                        <span className={`text-base font-bold ${isSelected ? "text-[#4697D2] dark:text-[#CAFA00]" : "text-zinc-700 dark:text-white"}`}>
                          ₾{getServicePrice(service)}
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          {t.perFlight}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Selected services summary */}
          {selectedServices.length > 0 && (
            <div className="mt-3 pt-3 border-t border-zinc-200/50 dark:border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                  <Package className="w-4 h-4" />
                  <span>
                    {selectedServices.length} {locale === "ka" ? "სერვისი არჩეული" : "service(s) selected"}
                  </span>
                </div>
                <span className="text-base font-bold text-[#4697D2] dark:text-[#CAFA00]">
                  +₾{selectedServices.reduce((sum, s) => sum + s.price * s.quantity, 0)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdditionalServicesUpsell;
