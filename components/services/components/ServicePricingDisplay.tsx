'use client';

import { useState } from 'react';
import { ShoppingCart, Check, Clock, Users } from 'lucide-react';
import { useCart } from '@/lib/context/CartContext';
import type { AdditionalService, PricingType, SharedPricingOption, LocalizedPricingOption } from '@/lib/types/services';
import { getLocalizedPricing, getLocalizedField } from '@/lib/data/services';
import type { Locale } from '@/lib/data/services';

interface ServicePricingDisplayProps {
  service: AdditionalService;
  locale: Locale;
}

// Pricing type labels
const pricingTypeLabels: Record<Locale, Record<PricingType, string>> = {
  ka: {
    fixed: 'ფიქსირებული',
    per_minute: 'წუთი',
    per_hour: 'საათი',
    per_person: 'ადამიანი'
  },
  en: {
    fixed: 'Fixed',
    per_minute: 'Per minute',
    per_hour: 'Per hour',
    per_person: 'Per person'
  },
  ru: {
    fixed: 'Фиксированная',
    per_minute: 'За минуту',
    per_hour: 'За час',
    per_person: 'За человека'
  },
  ar: {
    fixed: 'ثابت',
    per_minute: 'لكل دقيقة',
    per_hour: 'لكل ساعة',
    per_person: 'لكل شخص'
  },
  de: {
    fixed: 'Festpreis',
    per_minute: 'Pro Minute',
    per_hour: 'Pro Stunde',
    per_person: 'Pro Person'
  },
  tr: {
    fixed: 'Sabit',
    per_minute: 'Dakika başına',
    per_hour: 'Saat başına',
    per_person: 'Kişi başına'
  }
};

// Currency symbols
const currencySymbols = {
  gel: '₾',
  usd: '$',
  eur: '€'
};

export default function ServicePricingDisplay({ 
  service, 
  locale 
}: ServicePricingDisplayProps) {
  const { addItem } = useCart();
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState<string | null>(null);
  const [currency, setCurrency] = useState<'gel' | 'usd' | 'eur'>('gel');
  const [quantity, setQuantity] = useState(1);

  const pricingOptions = getLocalizedPricing(service, locale);
  
  const name = getLocalizedField<string>(service, 'name', locale) || service.name_en;
  const slug = getLocalizedField<string>(service, 'slug', locale) || service.slug_en;
  const thumbnailUrl = service.gallery_images?.[0]?.url;
  const categoryName = service.category 
    ? (service.category[`name_${locale}` as keyof typeof service.category] || service.category.name_en)
    : null;

  if (!pricingOptions || pricingOptions.length === 0) {
    return null;
  }

  // Select first option by default
  const selectedOption = pricingOptions.find(opt => opt.id === selectedOptionId) || pricingOptions[0];

  const handleAddToCart = () => {
    if (!selectedOption) return;
    
    const price = currency === 'gel' ? selectedOption.price_gel 
                : currency === 'usd' ? selectedOption.price_usd 
                : selectedOption.price_eur;
    
    addItem({
      type: `service-${service.id}-${selectedOption.id}`,
      itemType: 'service',
      name: name,
      price: price,
      quantity: quantity,
      imageUrl: thumbnailUrl,
      service: {
        id: service.id,
        name: name,
        slug: slug,
        categoryName: categoryName as string | undefined,
        pricingOptionId: selectedOption.id,
        pricingOptionName: selectedOption.name,
        thumbnailUrl: thumbnailUrl,
      }
    });
    
    setAddedToCart(selectedOption.id);
    setQuantity(1);
    
    setTimeout(() => {
      setAddedToCart(null);
    }, 2000);
  };

  const getPrice = (option: SharedPricingOption & LocalizedPricingOption) => {
    const priceKey = `price_${currency}` as keyof SharedPricingOption;
    return option[priceKey] as number;
  };

  const getPricingIcon = (type: PricingType) => {
    switch (type) {
      case 'per_minute':
      case 'per_hour':
        return Clock;
      case 'per_person':
        return Users;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Currency selector */}
      <div className="flex items-center gap-2">
        {(['gel', 'usd', 'eur'] as const).map((curr) => (
          <button
            key={curr}
            onClick={() => setCurrency(curr)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              currency === curr
                ? 'bg-[#4697D2] text-white'
                : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20'
            }`}
          >
            {currencySymbols[curr]} {curr.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Pricing options */}
      <div className="space-y-3">
        {pricingOptions.map((option) => {
          const price = getPrice(option);
          const isSelected = selectedOption?.id === option.id;
          const isAdded = addedToCart === option.id;
          const PricingIcon = getPricingIcon(option.type);
          
          return (
            <div
              key={option.id}
              onClick={() => setSelectedOptionId(option.id)}
              className={`relative p-4 rounded-xl cursor-pointer transition-all ${
                isSelected
                  ? 'bg-[#4697D2]/10 border-2 border-[#4697D2]'
                  : 'bg-gray-50 dark:bg-white/5 border-2 border-transparent hover:border-[#4697D2]/30'
              }`}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#4697D2] flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-1">
                    {option.name || `ვარიანტი ${pricingOptions.indexOf(option) + 1}`}
                  </h4>
                  
                  {option.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      {option.description}
                    </p>
                  )}
                  
                  {/* Features */}
                  {option.features && option.features.length > 0 && (
                    <ul className="space-y-1">
                      {option.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Check className="w-3.5 h-3.5 text-[#CAFA00]" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  )}
                  
                  {/* Duration / Type info */}
                  <div className="flex items-center gap-2 mt-2">
                    {PricingIcon && (
                      <PricingIcon className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {pricingTypeLabels[locale]?.[option.type] || option.type}
                      {option.duration_minutes && ` • ${option.duration_minutes} წთ`}
                    </span>
                  </div>
                </div>
                
                {/* Price */}
                <div className="text-right flex-shrink-0">
                  <div className="text-2xl font-bold text-[#4697D2]">
                    {price}{currencySymbols[currency]}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quantity selector + Add to Cart (same style as flight types) */}
      <div className="flex items-center gap-2">
        {/* Quantity Selector */}
        <div className="flex items-center bg-white/60 dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/20 rounded-lg overflow-hidden">
          <button
            onClick={() => setQuantity(q => Math.max(1, q - 1))}
            className="px-2.5 py-2 text-[#1a1a1a] dark:text-white hover:bg-[#4697D2]/20 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
            disabled={quantity <= 1}
          >
            <span className="text-sm font-bold">−</span>
          </button>
          <span className="px-2 py-2 min-w-[32px] text-center text-sm font-semibold text-[#1a1a1a] dark:text-white">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity(q => Math.min(10, q + 1))}
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
    </div>
  );
}
