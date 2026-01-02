'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Play } from 'lucide-react';
import { useCart } from '@/lib/context/CartContext';
import type { AdditionalService } from '@/lib/types/services';
import { getLocalizedField, getServiceMinPrice, getLocalizedPricing } from '@/lib/data/services';
import type { Locale } from '@/lib/data/services';

interface ServiceCardProps {
  service: AdditionalService;
  locale: Locale;
  showAddToCart?: boolean;
}

export default function ServiceCard({ 
  service, 
  locale, 
  showAddToCart = true 
}: ServiceCardProps) {
  const { addItem } = useCart();
  const [addedToCart, setAddedToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  
  const name = getLocalizedField<string>(service, 'name', locale) || service.name_en;
  const description = getLocalizedField<string>(service, 'description', locale) || service.description_en;
  const slug = getLocalizedField<string>(service, 'slug', locale) || service.slug_en;
  const minPrice = getServiceMinPrice(service, 'gel');
  
  // Get first gallery image or placeholder
  const thumbnailUrl = service.gallery_images?.[0]?.url || '/images/service-placeholder.jpg';
  const hasVideo = service.video_urls && service.video_urls.length > 0;
  
  // Get category name
  const categoryName = service.category 
    ? (service.category[`name_${locale}` as keyof typeof service.category] || service.category.name_en)
    : null;

  // Get first pricing option for quick add
  const pricingOptions = getLocalizedPricing(service, locale);
  const firstOption = pricingOptions[0];

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!firstOption) return;
    
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
    
    setAddedToCart(true);
    setQuantity(1);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const updateQuantity = (delta: number) => {
    setQuantity(prev => Math.min(10, Math.max(1, prev + delta)));
  };

  return (
    <Link 
      href={`/${locale}/services/${slug}`}
      className="group block"
    >
      <div className="relative backdrop-blur-xl rounded-xl shadow-xl shadow-black/10 dark:shadow-black/30 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-black/15 dark:hover:shadow-black/50 hover:-translate-y-1 text-gray-800 dark:text-white border border-[#4697D2]/30 dark:border-white/10 bg-[rgba(70,151,210,0.15)] dark:bg-black/40">
        {/* Gradient Border - hidden in dark mode */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#4697D2]/30 via-[#4697D2]/15 to-white/10 dark:from-transparent dark:via-transparent dark:to-transparent p-[1px]">
          <div className="absolute inset-[1px] rounded-xl bg-[rgba(70,151,210,0.1)] dark:bg-black/50 backdrop-blur-xl" />
        </div>
        
        {/* Top Highlight Line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent z-10" />
        
        {/* Hover Glow */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10" />
        
        {/* Content */}
        <div className="relative z-10">
          {/* Image Container */}
          <div className="relative aspect-[16/10] overflow-hidden">
            <Image
              src={thumbnailUrl}
              alt={name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            
            {/* Video indicator */}
            {hasVideo && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/60 backdrop-blur-sm rounded-full text-white text-xs font-medium">
                <Play className="w-3 h-3 fill-current" />
                <span>ვიდეო</span>
              </div>
            )}
            
            {/* Category badge */}
            {categoryName && (
              <div className="absolute top-3 right-3 px-2.5 py-1 bg-[#4697D2]/80 backdrop-blur-sm rounded-full text-white text-xs font-medium">
                {categoryName}
              </div>
            )}
            
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Price badge */}
            {minPrice && (
              <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-[#CAFA00] rounded-lg text-black text-sm font-bold shadow-lg">
                {minPrice}₾-დან
              </div>
            )}
          </div>
          
          {/* Text Content */}
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white line-clamp-1 mb-2 group-hover:text-[#4697D2] dark:group-hover:text-[#CAFA00] transition-colors">
              {name}
            </h3>
            
            {description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
                {description}
              </p>
            )}
            
            {/* Footer with Quantity + Add to Cart (same style as flight types) */}
            <div className="pt-3 border-t border-[#4697D2]/20 dark:border-white/10">
              {showAddToCart && firstOption ? (
                <div className="flex items-center gap-2">
                  {/* Quantity Selector */}
                  <div className="flex items-center bg-white/60 dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/20 rounded-lg overflow-hidden">
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(-1); }}
                      className="px-2.5 py-2 text-[#1a1a1a] dark:text-white hover:bg-[#4697D2]/20 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
                      disabled={quantity <= 1}
                    >
                      <span className="text-sm font-bold">−</span>
                    </button>
                    <span className="px-2 py-2 min-w-[32px] text-center text-sm font-semibold text-[#1a1a1a] dark:text-white">
                      {quantity}
                    </span>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(1); }}
                      className="px-2.5 py-2 text-[#1a1a1a] dark:text-white hover:bg-[#4697D2]/20 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
                      disabled={quantity >= 10}
                    >
                      <span className="text-sm font-bold">+</span>
                    </button>
                  </div>
                  
                  {/* Add to Cart Button */}
                  <button
                    onClick={handleAddToCart}
                    className={`flex-1 py-2.5 px-3 rounded-lg font-medium text-sm text-center transition-all duration-300 flex items-center justify-center gap-2 border ${
                      addedToCart
                        ? 'bg-green-500/20 border-green-500/50 text-green-700 dark:text-green-400'
                        : 'bg-white/60 dark:bg-black/40 border-[#4697D2]/30 dark:border-white/20 text-[#1a1a1a] dark:text-white hover:bg-[#4697D2]/10 dark:hover:bg-white/10'
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {addedToCart 
                      ? (locale === 'ka' ? 'დამატებულია!' : 'Added!') 
                      : (locale === 'ka' ? 'კალათაში' : 'Add')
                    }
                  </button>
                </div>
              ) : (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {locale === 'ka' ? 'დაწვრილებით →' : 'View details →'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
