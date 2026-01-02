'use client';

import { useEffect, useState } from 'react';
import { Package, MapPin, ShoppingCart, Play } from 'lucide-react';
import { getCompanyServicesGroupedByLocation } from '@/lib/data/company-services';
import { ServicesByLocation, getLocalizedLocationName, CompanySelectedServiceWithDetails } from '@/lib/types/company-services';
import { getServiceLocalizedField, type ServiceLocale } from '@/lib/types/services';
import Spinner from '@/components/ui/Spinner';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/lib/context/CartContext';

// Translations
const translations = {
  ka: {
    title: 'დამატებითი სერვისები',
    noServices: 'ამ კომპანიას სერვისები არ აქვს დამატებული',
    services: 'სერვისი',
    video: 'ვიდეო',
    addToCart: 'კალათაში',
    added: 'დამატებულია!',
  },
  en: {
    title: 'Additional Services',
    noServices: 'This company has no services added',
    services: 'services',
    video: 'Video',
    addToCart: 'Add',
    added: 'Added!',
  },
};

interface CompanyServicesSectionProps {
  companyId: string;
  locale: string;
}

export default function CompanyServicesSection({ companyId, locale }: CompanyServicesSectionProps) {
  const [loading, setLoading] = useState(true);
  const [servicesByLocation, setServicesByLocation] = useState<ServicesByLocation[]>([]);
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const { addItem } = useCart();
  const t = translations[locale as keyof typeof translations] || translations.ka;

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const services = await getCompanyServicesGroupedByLocation(companyId);
        setServicesByLocation(services);
      } catch (error) {
        console.error('Error fetching company services:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [companyId]);

  // Get service min price
  const getServicePrice = (service: any): number => {
    if (!service.pricing?.shared_pricing?.length) return 0;
    return Math.min(...service.pricing.shared_pricing.map((p: any) => p.price_gel || 0));
  };

  // Get first pricing option
  const getFirstPricingOption = (service: any) => {
    if (!service.pricing?.shared_pricing?.length) return null;
    return service.pricing.shared_pricing[0];
  };

  // Get thumbnail
  const getThumbnail = (service: any) => {
    return service.gallery_images?.[0]?.url || '/images/service-placeholder.jpg';
  };

  // Check if has video
  const hasVideo = (service: any) => {
    return service.video_urls && service.video_urls.length > 0;
  };

  // Get category name
  const getCategoryName = (service: any) => {
    if (!service.category) return null;
    return getServiceLocalizedField(service.category as any, 'name', locale as ServiceLocale);
  };

  const handleAddToCart = (service: any, locationName: string, itemId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const firstOption = getFirstPricingOption(service);
    if (!firstOption) return;
    
    const name = getServiceLocalizedField(service as any, 'name', locale as ServiceLocale);
    const slug = (service as any)[`slug_${locale}`] || service.slug_en || service.slug_ka;
    const thumbnailUrl = getThumbnail(service);
    const categoryName = getCategoryName(service);
    const quantity = quantities[itemId] || 1;
    
    addItem({
      type: `service-${service.id}`,
      itemType: 'service',
      name: name,
      price: firstOption.price_gel,
      quantity: quantity,
      imageUrl: thumbnailUrl,
      service: {
        id: service.id,
        name: name,
        slug: slug,
        categoryName: categoryName as string | undefined,
        pricingOptionId: firstOption.id,
        pricingOptionName: firstOption.name,
        thumbnailUrl: thumbnailUrl,
      }
    });
    
    setAddedItems(prev => new Set(prev).add(itemId));
    setQuantities(prev => ({ ...prev, [itemId]: 1 }));
    setTimeout(() => {
      setAddedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }, 2000);
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [itemId]: Math.min(10, Math.max(1, (prev[itemId] || 1) + delta))
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="md" />
      </div>
    );
  }

  if (servicesByLocation.length === 0) {
    return null; // Don't show section if no services
  }

  const totalServices = servicesByLocation.reduce(
    (acc, loc) => acc + loc.services.length,
    0
  );

  // Flatten all services for card display
  const allServices = servicesByLocation.flatMap(loc => 
    loc.services.map(item => ({
      ...item,
      locationName: getLocalizedLocationName(loc, locale)
    }))
  );

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-[#4697D2]/20 to-[#4697D2]/10 dark:from-[#CAFA00]/20 dark:to-[#CAFA00]/10">
            <Package className="w-5 h-5 text-[#4697D2] dark:text-[#CAFA00]" />
          </div>
          <h2 className="text-xl font-bold text-foreground">{t.title}</h2>
        </div>
        <span className="text-xs text-foreground/60 px-2 py-1 rounded-full bg-foreground/5">
          {totalServices} {t.services}
        </span>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
        {allServices.map(({ service, id, locationName }) => {
          const price = getServicePrice(service);
          const firstOption = getFirstPricingOption(service);
          const isAdded = addedItems.has(id);
          const quantity = quantities[id] || 1;
          const categoryName = getCategoryName(service);
          const thumbnail = getThumbnail(service);
          const hasVideoContent = hasVideo(service);
          const serviceName = getServiceLocalizedField(service as any, 'name', locale as ServiceLocale);
          const serviceDescription = getServiceLocalizedField(service as any, 'description', locale as ServiceLocale);
          const serviceSlug = (service as any)[`slug_${locale}`] || service.slug_en || service.slug_ka;

          return (
            <Link
              key={id}
              href={`/${locale}/services/${serviceSlug}`}
              className="group block"
            >
              <div className="relative backdrop-blur-xl rounded-lg sm:rounded-xl shadow-md sm:shadow-lg shadow-black/10 dark:shadow-black/30 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-[#4697D2]/20 dark:border-white/10 bg-white/60 dark:bg-black/40">
                {/* Image Container */}
                <div className="relative aspect-[4/3] sm:aspect-[16/10] overflow-hidden">
                  <Image
                    src={thumbnail}
                    alt={serviceName}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  
                  {/* Video indicator */}
                  {hasVideoContent && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded-full text-white text-[10px] font-medium">
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>{t.video}</span>
                    </div>
                  )}
                  
                  {/* Category badge */}
                  {categoryName && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-[#4697D2]/90 backdrop-blur-sm rounded-full text-white text-[10px] font-medium">
                      {categoryName}
                    </div>
                  )}
                  
                  {/* Location badge */}
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded-full text-white text-[10px]">
                    <MapPin className="w-2.5 h-2.5" />
                    <span>{locationName}</span>
                  </div>
                  
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  
                  {/* Price badge */}
                  {price > 0 && (
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-[#CAFA00] rounded-lg text-black text-xs font-bold shadow-lg">
                      {price}₾
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="p-2 sm:p-3">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-white line-clamp-1 mb-0.5 sm:mb-1 group-hover:text-[#4697D2] dark:group-hover:text-[#CAFA00] transition-colors">
                    {serviceName}
                  </h3>
                  
                  {serviceDescription && (
                    <p className="hidden sm:block text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                      {serviceDescription}
                    </p>
                  )}
                  
                  {/* Footer with Add to Cart */}
                  {firstOption && (
                    <div className="flex items-center gap-1 sm:gap-2 pt-1.5 sm:pt-2 border-t border-[#4697D2]/10 dark:border-white/10">
                      {/* Quantity Selector - hidden on mobile */}
                      <div className="hidden sm:flex items-center bg-white/80 dark:bg-black/40 border border-[#4697D2]/20 dark:border-white/10 rounded-lg overflow-hidden">
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(id, -1); }}
                          className="px-2 py-1.5 text-zinc-700 dark:text-white hover:bg-[#4697D2]/10 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
                          disabled={quantity <= 1}
                        >
                          <span className="text-xs font-bold">−</span>
                        </button>
                        <span className="px-1.5 py-1.5 min-w-[24px] text-center text-xs font-semibold text-zinc-700 dark:text-white">
                          {quantity}
                        </span>
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(id, 1); }}
                          className="px-2 py-1.5 text-zinc-700 dark:text-white hover:bg-[#4697D2]/10 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
                          disabled={quantity >= 10}
                        >
                          <span className="text-xs font-bold">+</span>
                        </button>
                      </div>
                      
                      {/* Add to Cart Button */}
                      <button
                        onClick={(e) => handleAddToCart(service, locationName, id, e)}
                        className={`flex-1 py-1 sm:py-1.5 px-1.5 sm:px-2 rounded-md sm:rounded-lg font-medium text-[10px] sm:text-xs text-center transition-all duration-300 flex items-center justify-center gap-1 sm:gap-1.5 border ${
                          isAdded
                            ? 'bg-green-500/20 border-green-500/50 text-green-700 dark:text-green-400'
                            : 'bg-white/80 dark:bg-black/40 border-[#4697D2]/20 dark:border-white/10 text-zinc-700 dark:text-white hover:bg-[#4697D2]/10 dark:hover:bg-white/10'
                        }`}
                      >
                        <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        {isAdded ? t.added : t.addToCart}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
