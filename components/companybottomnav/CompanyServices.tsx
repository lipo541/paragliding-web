'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  getAvailableServicesGroupedByLocation, 
  toggleCompanyService,
  getCompanyServicesCount
} from '@/lib/data/company-services';
import { AvailableServicesByLocation, getLocalizedLocationName } from '@/lib/types/company-services';
import { getServiceLocalizedField, type ServiceLocale } from '@/lib/types/services';
import { MapPin, Package, Check, Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import toast from 'react-hot-toast';
import * as LucideIcons from 'lucide-react';

// Dynamic icon component
const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
  const IconComponent = (LucideIcons as any)[name.charAt(0).toUpperCase() + name.slice(1)] || LucideIcons.Package;
  return <IconComponent className={className} />;
};

// Translations
const translations = {
  ka: {
    title: 'აირჩიე სერვისები',
    subtitle: 'აირჩიეთ დამატებითი სერვისები თქვენი ლოკაციებისთვის',
    noLocations: 'ჯერ არ გაქვთ არჩეული ლოკაციები',
    noLocationsDesc: 'პროფილის გვერდზე აირჩიეთ ლოკაციები, რომლებზეც მუშაობთ',
    noServices: 'ამ ლოკაციაზე სერვისები არ არის',
    selected: 'არჩეული',
    notSelected: 'აირჩიე',
    totalSelected: 'სულ არჩეული სერვისები',
    price: 'ფასი',
    loading: 'იტვირთება...',
    error: 'შეცდომა მოხდა',
    serviceAdded: 'სერვისი დამატებულია',
    serviceRemoved: 'სერვისი წაშლილია',
    goToProfile: 'პროფილზე გადასვლა',
  },
  en: {
    title: 'Select Services',
    subtitle: 'Choose additional services for your locations',
    noLocations: 'No locations selected yet',
    noLocationsDesc: 'Go to profile page to select locations where you operate',
    noServices: 'No services available for this location',
    selected: 'Selected',
    notSelected: 'Select',
    totalSelected: 'Total selected services',
    price: 'Price',
    loading: 'Loading...',
    error: 'An error occurred',
    serviceAdded: 'Service added',
    serviceRemoved: 'Service removed',
    goToProfile: 'Go to Profile',
  },
};

export default function CompanyServices() {
  const params = useParams();
  const locale = (params?.locale as string) || 'ka';
  const t = translations[locale as keyof typeof translations] || translations.ka;
  
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [servicesByLocation, setServicesByLocation] = useState<AvailableServicesByLocation[]>([]);
  const [totalSelected, setTotalSelected] = useState(0);
  const [togglingServices, setTogglingServices] = useState<Set<string>>(new Set());
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());
  
  const supabase = createClient();

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Get company ID
        const { data: company } = await supabase
          .from('companies')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!company) {
          setLoading(false);
          return;
        }

        setCompanyId(company.id);

        // Get available services grouped by location
        const services = await getAvailableServicesGroupedByLocation(company.id);
        setServicesByLocation(services);

        // Get total selected count
        const count = await getCompanyServicesCount(company.id);
        setTotalSelected(count);

        // Expand all locations by default
        setExpandedLocations(new Set(services.map(s => s.location_id)));
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error(t.error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase, t.error]);

  // Toggle service selection
  const handleToggleService = async (serviceId: string, currentlySelected: boolean) => {
    if (!companyId) return;

    setTogglingServices(prev => new Set(prev).add(serviceId));

    try {
      await toggleCompanyService(companyId, serviceId, !currentlySelected);

      // Update local state
      setServicesByLocation(prev => prev.map(location => ({
        ...location,
        services: location.services.map(s => 
          s.service.id === serviceId 
            ? { ...s, is_selected: !currentlySelected }
            : s
        )
      })));

      // Update count
      setTotalSelected(prev => currentlySelected ? prev - 1 : prev + 1);

      toast.success(currentlySelected ? t.serviceRemoved : t.serviceAdded);
    } catch (error) {
      console.error('Error toggling service:', error);
      toast.error(t.error);
    } finally {
      setTogglingServices(prev => {
        const next = new Set(prev);
        next.delete(serviceId);
        return next;
      });
    }
  };

  // Toggle location expansion
  const toggleLocationExpansion = (locationId: string) => {
    setExpandedLocations(prev => {
      const next = new Set(prev);
      if (next.has(locationId)) {
        next.delete(locationId);
      } else {
        next.add(locationId);
      }
      return next;
    });
  };

  // Get service min price
  const getServicePrice = (service: any): number => {
    if (!service.pricing?.shared_pricing?.length) return 0;
    return Math.min(...service.pricing.shared_pricing.map((p: any) => p.price_gel || 0));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (servicesByLocation.length === 0) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-orange-500" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">{t.noLocations}</h2>
        <p className="text-foreground/60 mb-6 max-w-md">{t.noLocationsDesc}</p>
        <a
          href={`/${locale}/company/profile`}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold hover:opacity-90 transition-opacity"
        >
          {t.goToProfile}
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-600/20">
              <Package className="w-6 h-6 text-blue-500" />
            </div>
            {t.title}
          </h1>
          <p className="text-foreground/60 mt-1">{t.subtitle}</p>
        </div>
        
        {/* Total count badge */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20">
          <Check className="w-5 h-5 text-green-500" />
          <span className="text-sm font-medium text-foreground">
            {t.totalSelected}: <span className="text-green-500 font-bold">{totalSelected}</span>
          </span>
        </div>
      </div>

      {/* Services by Location */}
      <div className="space-y-4">
        {servicesByLocation.map((locationGroup) => {
          const locationName = getLocalizedLocationName(locationGroup, locale);
          const isExpanded = expandedLocations.has(locationGroup.location_id);
          const selectedInLocation = locationGroup.services.filter(s => s.is_selected).length;

          return (
            <div
              key={locationGroup.location_id}
              className="rounded-2xl backdrop-blur-md bg-white/60 dark:bg-black/40 border border-white/20 dark:border-white/10 shadow-xl overflow-hidden"
            >
              {/* Location Header */}
              <button
                onClick={() => toggleLocationExpansion(locationGroup.location_id)}
                className="w-full flex items-center justify-between p-4 hover:bg-foreground/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/20">
                    <MapPin className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-lg font-semibold text-foreground">{locationName}</h2>
                    <p className="text-sm text-foreground/60">
                      {selectedInLocation} / {locationGroup.services.length} {t.selected.toLowerCase()}
                    </p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-foreground/60" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-foreground/60" />
                )}
              </button>

              {/* Services Grid */}
              {isExpanded && (
                <div className="p-4 pt-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {locationGroup.services.map(({ service, is_selected }) => {
                    const serviceName = getServiceLocalizedField(service as any, 'name', locale as ServiceLocale);
                    const categoryName = service.category 
                      ? getServiceLocalizedField(service.category as any, 'name', locale as ServiceLocale)
                      : '';
                    const price = getServicePrice(service);
                    const isToggling = togglingServices.has(service.id);

                    return (
                      <button
                        key={service.id}
                        onClick={() => handleToggleService(service.id, is_selected)}
                        disabled={isToggling}
                        className={`
                          relative flex items-start gap-3 p-4 rounded-xl border transition-all duration-200
                          ${is_selected 
                            ? 'bg-green-500/10 border-green-500/30 hover:border-green-500/50' 
                            : 'bg-foreground/5 border-foreground/10 hover:border-foreground/20 hover:bg-foreground/10'
                          }
                          ${isToggling ? 'opacity-70 cursor-wait' : 'cursor-pointer'}
                        `}
                      >
                        {/* Icon */}
                        <div className={`
                          p-2 rounded-lg flex-shrink-0
                          ${is_selected ? 'bg-green-500/20' : 'bg-foreground/10'}
                        `}>
                          <DynamicIcon 
                            name={service.category?.icon || 'package'} 
                            className={`w-5 h-5 ${is_selected ? 'text-green-500' : 'text-foreground/60'}`}
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 text-left min-w-0">
                          <h3 className="font-medium text-foreground truncate">{serviceName}</h3>
                          {categoryName && (
                            <p className="text-xs text-foreground/50 truncate">{categoryName}</p>
                          )}
                          <p className="text-sm font-semibold text-blue-500 mt-1">
                            {price > 0 ? `${price}₾` : '-'}
                          </p>
                        </div>

                        {/* Status indicator */}
                        <div className={`
                          absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center
                          ${is_selected ? 'bg-green-500' : 'bg-foreground/20'}
                        `}>
                          {isToggling ? (
                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                          ) : is_selected ? (
                            <Check className="w-4 h-4 text-white" />
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
