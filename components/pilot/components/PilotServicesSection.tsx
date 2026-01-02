"use client";

import React, { useEffect, useState } from "react";
import { Package, MapPin, ShoppingCart, Play } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ServicesByLocation, CompanySelectedServiceWithDetails, getLocalizedLocationName } from "@/lib/types/company-services";
import { getPilotCompanyServices } from "@/lib/data/company-services";
import { useCart } from "@/lib/context/CartContext";
import Spinner from "@/components/ui/Spinner";

interface PilotServicesSectionProps {
  pilotId: string;
  locale: string;
}

export function PilotServicesSection({ pilotId, locale }: PilotServicesSectionProps) {
  const [servicesByLocation, setServicesByLocation] = useState<ServicesByLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const { addItem } = useCart();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await getPilotCompanyServices(pilotId);
        setServicesByLocation(data);
      } catch (error) {
        console.error("Error fetching pilot services:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [pilotId]);

  // Helper function for localized service name
  const getLocalizedServiceName = (item: CompanySelectedServiceWithDetails) => {
    const service = item.service;
    const nameKey = `name_${locale}` as keyof typeof service;
    return (service[nameKey] as string) || service.name_en || service.name_ka || "";
  };

  // Helper function for localized service description
  const getLocalizedServiceDescription = (item: CompanySelectedServiceWithDetails) => {
    const service = item.service;
    const descKey = `description_${locale}` as keyof typeof service;
    return (service[descKey] as string) || service.description_en || service.description_ka || "";
  };
  
  // Helper function for localized service slug
  const getLocalizedServiceSlug = (item: CompanySelectedServiceWithDetails) => {
    const service = item.service;
    const slugKey = `slug_${locale}` as keyof typeof service;
    return (service[slugKey] as string) || service.slug_en || service.slug_ka || "";
  };
  
  // Helper function for service price (first pricing option)
  const getServicePrice = (item: CompanySelectedServiceWithDetails): number => {
    const pricing = item.service.pricing;
    if (pricing?.shared_pricing?.length > 0) {
      return pricing.shared_pricing[0].price_gel || 0;
    }
    return 0;
  };

  // Get first pricing option
  const getFirstPricingOption = (item: CompanySelectedServiceWithDetails) => {
    const pricing = item.service.pricing;
    if (pricing?.shared_pricing?.length > 0) {
      return pricing.shared_pricing[0];
    }
    return null;
  };

  // Get category name
  const getCategoryName = (item: CompanySelectedServiceWithDetails) => {
    const category = item.service.category;
    if (!category) return null;
    const nameKey = `name_${locale}` as keyof typeof category;
    return (category[nameKey] as string) || category.name_en || category.name_ka || null;
  };

  // Get thumbnail
  const getThumbnail = (item: CompanySelectedServiceWithDetails) => {
    return item.service.gallery_images?.[0]?.url || '/images/service-placeholder.jpg';
  };

  // Check if has video
  const hasVideo = (item: CompanySelectedServiceWithDetails) => {
    return item.service.video_urls && item.service.video_urls.length > 0;
  };

  const handleAddToCart = (item: CompanySelectedServiceWithDetails, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const firstOption = getFirstPricingOption(item);
    if (!firstOption) return;
    
    const name = getLocalizedServiceName(item);
    const slug = getLocalizedServiceSlug(item);
    const thumbnailUrl = getThumbnail(item);
    const categoryName = getCategoryName(item);
    const quantity = quantities[item.id] || 1;
    
    addItem({
      type: `service-${item.service.id}`,
      itemType: 'service',
      name: name,
      price: firstOption.price_gel,
      quantity: quantity,
      imageUrl: thumbnailUrl,
      service: {
        id: item.service.id,
        name: name,
        slug: slug,
        categoryName: categoryName as string | undefined,
        pricingOptionId: firstOption.id,
        pricingOptionName: String(firstOption.price_gel) + '₾',
        thumbnailUrl: thumbnailUrl,
      }
    });
    
    setAddedItems(prev => new Set(prev).add(item.id));
    setQuantities(prev => ({ ...prev, [item.id]: 1 }));
    setTimeout(() => {
      setAddedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
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

  // Don't render if no services
  if (servicesByLocation.length === 0) {
    return null;
  }

  const totalServices = servicesByLocation.reduce(
    (acc, loc) => acc + loc.services.length,
    0
  );

  // Flatten all services for card display
  const allServices = servicesByLocation.flatMap(loc => 
    loc.services.map(service => ({
      ...service,
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
          <h2 className="text-xl font-bold text-foreground">
            {locale === "ka" ? "დამატებითი სერვისები" : "Additional Services"}
          </h2>
        </div>
        <span className="text-xs text-foreground/60 px-2 py-1 rounded-full bg-foreground/5">
          {totalServices} {locale === "ka" ? "სერვისი" : "services"}
        </span>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
        {allServices.map((item) => {
          const price = getServicePrice(item);
          const firstOption = getFirstPricingOption(item);
          const isAdded = addedItems.has(item.id);
          const quantity = quantities[item.id] || 1;
          const categoryName = getCategoryName(item);
          const thumbnail = getThumbnail(item);
          const hasVideoContent = hasVideo(item);

          return (
            <Link
              key={item.id}
              href={`/${locale}/services/${getLocalizedServiceSlug(item)}`}
              className="group block"
            >
              <div className="relative backdrop-blur-xl rounded-lg sm:rounded-xl shadow-md sm:shadow-lg shadow-black/10 dark:shadow-black/30 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-[#4697D2]/20 dark:border-white/10 bg-white/60 dark:bg-black/40">
                {/* Image Container */}
                <div className="relative aspect-[4/3] sm:aspect-[16/10] overflow-hidden">
                  <Image
                    src={thumbnail}
                    alt={getLocalizedServiceName(item)}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  
                  {/* Video indicator */}
                  {hasVideoContent && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded-full text-white text-[10px] font-medium">
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>{locale === 'ka' ? 'ვიდეო' : 'Video'}</span>
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
                    <span>{item.locationName}</span>
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
                    {getLocalizedServiceName(item)}
                  </h3>
                  
                  {getLocalizedServiceDescription(item) && (
                    <p className="hidden sm:block text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                      {getLocalizedServiceDescription(item)}
                    </p>
                  )}
                  
                  {/* Footer with Add to Cart */}
                  {firstOption && (
                    <div className="flex items-center gap-1 sm:gap-2 pt-1.5 sm:pt-2 border-t border-[#4697D2]/10 dark:border-white/10">
                      {/* Quantity Selector - hidden on mobile */}
                      <div className="hidden sm:flex items-center bg-white/80 dark:bg-black/40 border border-[#4697D2]/20 dark:border-white/10 rounded-lg overflow-hidden">
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(item.id, -1); }}
                          className="px-2 py-1.5 text-zinc-700 dark:text-white hover:bg-[#4697D2]/10 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
                          disabled={quantity <= 1}
                        >
                          <span className="text-xs font-bold">−</span>
                        </button>
                        <span className="px-1.5 py-1.5 min-w-[24px] text-center text-xs font-semibold text-zinc-700 dark:text-white">
                          {quantity}
                        </span>
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(item.id, 1); }}
                          className="px-2 py-1.5 text-zinc-700 dark:text-white hover:bg-[#4697D2]/10 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
                          disabled={quantity >= 10}
                        >
                          <span className="text-xs font-bold">+</span>
                        </button>
                      </div>
                      
                      {/* Add to Cart Button */}
                      <button
                        onClick={(e) => handleAddToCart(item, e)}
                        className={`flex-1 py-1 sm:py-1.5 px-1.5 sm:px-2 rounded-md sm:rounded-lg font-medium text-[10px] sm:text-xs text-center transition-all duration-300 flex items-center justify-center gap-1 sm:gap-1.5 border ${
                          isAdded
                            ? 'bg-green-500/20 border-green-500/50 text-green-700 dark:text-green-400'
                            : 'bg-white/80 dark:bg-black/40 border-[#4697D2]/20 dark:border-white/10 text-zinc-700 dark:text-white hover:bg-[#4697D2]/10 dark:hover:bg-white/10'
                        }`}
                      >
                        <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        {isAdded 
                          ? (locale === 'ka' ? 'დამატებულია!' : 'Added!') 
                          : (locale === 'ka' ? 'კალათაში' : 'Add')
                        }
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

export default PilotServicesSection;
