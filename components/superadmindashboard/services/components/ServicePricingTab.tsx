'use client';

import { useState } from 'react';
import { DollarSign, Plus, Trash2, Info, GripVertical } from 'lucide-react';
import type { ServicePricing, SharedPricingOption, PricingType } from '@/lib/types/services';

type Language = 'ka' | 'en' | 'ru' | 'ar' | 'de' | 'tr';

const languages: { code: Language; label: string; flag: string }[] = [
  { code: 'ka', label: 'ქართული', flag: '🇬🇪' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
];

const priceTypes: { value: PricingType; label: string; description: string }[] = [
  { value: 'fixed', label: 'ფიქსირებული', description: 'ერთჯერადი ფასი' },
  { value: 'per_minute', label: 'წუთში', description: 'ფასი თითო წუთზე' },
  { value: 'per_hour', label: 'საათში', description: 'ფასი თითო საათზე' },
  { value: 'per_person', label: 'ადამიანზე', description: 'ფასი თითო ადამიანზე' },
];

interface ServicePricingTabProps {
  pricing: ServicePricing;
  onChange: (pricing: ServicePricing) => void;
}

// Helper to get localized option for a shared pricing option
const getLocalizedOption = (pricing: ServicePricing, sharedId: string, lang: Language) => {
  const langOptions = pricing[lang]?.options || [];
  return langOptions.find(opt => opt.shared_id === sharedId);
};

export default function ServicePricingTab({
  pricing,
  onChange,
}: ServicePricingTabProps) {
  const [activeLang, setActiveLang] = useState<Language>('ka');
  const [expandedOption, setExpandedOption] = useState<string | null>(null);

  // Get shared pricing options
  const sharedOptions = pricing.shared_pricing || [];

  // Add new pricing option
  const addOption = () => {
    const newId = crypto.randomUUID();
    const newSharedOption: SharedPricingOption = {
      id: newId,
      type: 'fixed',
      price_gel: 0,
      price_usd: 0,
      price_eur: 0,
    };

    // Create localized options for all languages
    const newPricing = { ...pricing };
    newPricing.shared_pricing = [...sharedOptions, newSharedOption];

    // Add empty localized options for each language
    languages.forEach(lang => {
      const currentOptions = newPricing[lang.code]?.options || [];
      newPricing[lang.code] = {
        options: [
          ...currentOptions,
          { shared_id: newId, name: '', description: '' }
        ]
      };
    });

    onChange(newPricing);
    setExpandedOption(newId);
  };

  // Update shared pricing option
  const updateSharedOption = (id: string, updates: Partial<SharedPricingOption>) => {
    const newSharedPricing = sharedOptions.map(opt =>
      opt.id === id ? { ...opt, ...updates } : opt
    );
    onChange({
      ...pricing,
      shared_pricing: newSharedPricing,
    });
  };

  // Update localized option
  const updateLocalizedOption = (sharedId: string, lang: Language, name: string, description?: string) => {
    const currentOptions = pricing[lang]?.options || [];
    const existingIndex = currentOptions.findIndex(opt => opt.shared_id === sharedId);

    let newOptions;
    if (existingIndex >= 0) {
      newOptions = currentOptions.map((opt, i) =>
        i === existingIndex ? { ...opt, name, description } : opt
      );
    } else {
      newOptions = [...currentOptions, { shared_id: sharedId, name, description }];
    }

    onChange({
      ...pricing,
      [lang]: { options: newOptions },
    });
  };

  // Delete pricing option
  const deleteOption = (id: string) => {
    const newPricing = { ...pricing };
    newPricing.shared_pricing = sharedOptions.filter(opt => opt.id !== id);

    // Remove from all languages
    languages.forEach(lang => {
      const currentOptions = newPricing[lang.code]?.options || [];
      newPricing[lang.code] = {
        options: currentOptions.filter(opt => opt.shared_id !== id)
      };
    });

    onChange(newPricing);
  };

  // Format price for display
  const formatPrice = (option: SharedPricingOption) => {
    const suffix = {
      fixed: '',
      per_minute: '/წთ',
      per_hour: '/სთ',
      per_person: '/ადამ.',
    }[option.type];
    return `${option.price_gel}₾${suffix}`;
  };

  // Get display name for an option
  const getDisplayName = (option: SharedPricingOption) => {
    const localizedKa = getLocalizedOption(pricing, option.id, 'ka');
    const localizedEn = getLocalizedOption(pricing, option.id, 'en');
    return localizedKa?.name || localizedEn?.name || 'უსახელო ვარიანტი';
  };

  return (
    <div className="space-y-6">
      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 mt-0.5" />
          <div className="text-sm text-foreground/70">
            <p className="font-medium text-blue-600 dark:text-blue-400 mb-1">ფასის სტრუქტურა</p>
            <p>თითოეული ვარიანტისთვის შეიყვანეთ ფასები (GEL, USD, EUR) და სახელები ყველა ენაზე.</p>
          </div>
        </div>
      </div>

      {/* Pricing Options */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">ფასის ვარიანტები</h3>
          <button
            onClick={addOption}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            დამატება
          </button>
        </div>

        {sharedOptions.length === 0 ? (
          <div className="text-center py-8 bg-foreground/5 rounded-lg">
            <DollarSign className="w-8 h-8 text-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-foreground/50">
              დაამატეთ ფასის ვარიანტები (მაგ: 5 წუთიანი, 10 წუთიანი, და ა.შ.)
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sharedOptions.map((option) => (
              <div
                key={option.id}
                className="bg-foreground/5 rounded-lg overflow-hidden"
              >
                {/* Option Header */}
                <div
                  onClick={() => setExpandedOption(
                    expandedOption === option.id ? null : option.id
                  )}
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-foreground/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-foreground/30" />
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium">{getDisplayName(option)}</p>
                      <p className="text-sm text-foreground/50">
                        {formatPrice(option)}
                        {option.duration_minutes && ` • ${option.duration_minutes} წუთი`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteOption(option.id);
                    }}
                    className="p-2 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Option Expanded */}
                {expandedOption === option.id && (
                  <div className="px-4 pb-4 space-y-4 border-t border-border/50">
                    {/* Price Settings */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
                      <div>
                        <label className="block text-sm text-foreground/60 mb-1">GEL ₾</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={option.price_gel}
                          onChange={(e) => updateSharedOption(option.id, {
                            price_gel: parseFloat(e.target.value) || 0,
                          })}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-foreground/60 mb-1">USD $</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={option.price_usd}
                          onChange={(e) => updateSharedOption(option.id, {
                            price_usd: parseFloat(e.target.value) || 0,
                          })}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-foreground/60 mb-1">EUR €</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={option.price_eur}
                          onChange={(e) => updateSharedOption(option.id, {
                            price_eur: parseFloat(e.target.value) || 0,
                          })}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-foreground/60 mb-1">ფასის ტიპი</label>
                        <select
                          value={option.type}
                          onChange={(e) => updateSharedOption(option.id, {
                            type: e.target.value as PricingType,
                          })}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                        >
                          {priceTypes.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Duration */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-foreground/60 mb-1">ხანგრძლივობა (წუთი)</label>
                        <input
                          type="number"
                          min="0"
                          value={option.duration_minutes || ''}
                          onChange={(e) => updateSharedOption(option.id, {
                            duration_minutes: parseInt(e.target.value) || undefined,
                          })}
                          placeholder="არჩევითი"
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                        />
                      </div>
                    </div>

                    {/* Language Tabs */}
                    <div>
                      <label className="block text-sm text-foreground/60 mb-2">
                        სახელი და აღწერა ენების მიხედვით
                      </label>
                      <div className="flex gap-1 mb-3 overflow-x-auto">
                        {languages.map(lang => (
                          <button
                            key={lang.code}
                            onClick={() => setActiveLang(lang.code)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm whitespace-nowrap ${
                              activeLang === lang.code
                                ? 'bg-blue-500 text-white'
                                : 'bg-foreground/10 text-foreground/70 hover:bg-foreground/20'
                            }`}
                          >
                            <span>{lang.flag}</span>
                            <span>{lang.label}</span>
                          </button>
                        ))}
                      </div>

                      {/* Name & Description for current language */}
                      <div className="grid gap-3">
                        <div>
                          <input
                            type="text"
                            value={getLocalizedOption(pricing, option.id, activeLang)?.name || ''}
                            onChange={(e) => {
                              const current = getLocalizedOption(pricing, option.id, activeLang);
                              updateLocalizedOption(
                                option.id,
                                activeLang,
                                e.target.value,
                                current?.description
                              );
                            }}
                            placeholder={`სახელი (${activeLang.toUpperCase()})`}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                            dir={activeLang === 'ar' ? 'rtl' : 'ltr'}
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={getLocalizedOption(pricing, option.id, activeLang)?.description || ''}
                            onChange={(e) => {
                              const current = getLocalizedOption(pricing, option.id, activeLang);
                              updateLocalizedOption(
                                option.id,
                                activeLang,
                                current?.name || '',
                                e.target.value
                              );
                            }}
                            placeholder={`აღწერა (${activeLang.toUpperCase()}) - არჩევითი`}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                            dir={activeLang === 'ar' ? 'rtl' : 'ltr'}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview */}
      {sharedOptions.length > 0 && (
        <div className="bg-foreground/5 rounded-lg p-4">
          <h4 className="text-sm font-medium text-foreground/60 mb-3">წინასწარი ხედი</h4>
          <div className="flex flex-wrap gap-2">
            {sharedOptions.map(option => (
              <div
                key={option.id}
                className="px-4 py-2 bg-background border border-border rounded-lg"
              >
                <span className="font-medium">{getDisplayName(option)}</span>
                <span className="text-blue-500 ml-2">{formatPrice(option)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
