'use client';

import { useState } from 'react';
import type { AdditionalService, ServiceCategory } from '@/lib/types/services';

// Georgian to Latin transliteration map
const georgianToLatin: Record<string, string> = {
  'ა': 'a', 'ბ': 'b', 'გ': 'g', 'დ': 'd', 'ე': 'e', 'ვ': 'v', 'ზ': 'z',
  'თ': 't', 'ი': 'i', 'კ': 'k', 'ლ': 'l', 'მ': 'm', 'ნ': 'n', 'ო': 'o',
  'პ': 'p', 'ჟ': 'zh', 'რ': 'r', 'ს': 's', 'ტ': 't', 'უ': 'u', 'ფ': 'p',
  'ქ': 'k', 'ღ': 'gh', 'ყ': 'q', 'შ': 'sh', 'ჩ': 'ch', 'ც': 'ts', 'ძ': 'dz',
  'წ': 'ts', 'ჭ': 'ch', 'ხ': 'kh', 'ჯ': 'j', 'ჰ': 'h'
};

const transliterateToLatin = (text: string): string => {
  return text
    .split('')
    .map(char => georgianToLatin[char] || char)
    .join('');
};

type Language = 'ka' | 'en' | 'ru' | 'ar' | 'de' | 'tr';

const languages: { code: Language; label: string; flag: string }[] = [
  { code: 'ka', label: 'ქართული', flag: '🇬🇪' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
];

interface ServiceBasicInfoTabProps {
  formData: Partial<AdditionalService>;
  categories: ServiceCategory[];
  onChange: (updates: Partial<AdditionalService>) => void;
}

export default function ServiceBasicInfoTab({
  formData,
  categories,
  onChange,
}: ServiceBasicInfoTabProps) {
  const [activeLang, setActiveLang] = useState<Language>('ka');

  const handleChange = (field: string, value: string) => {
    onChange({ [field]: value });
  };

  const generateSlug = (lang: Language) => {
    const nameField = `name_${lang}` as keyof AdditionalService;
    const name = formData[nameField] as string;
    if (!name) return;
    
    // Transliterate to Latin and clean up
    const transliterated = transliterateToLatin(name);
    const slug = transliterated
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-+/g, '-');
    
    const slugField = `slug_${lang}`;
    onChange({ [slugField]: slug });
  };

  return (
    <div className="space-y-6">
      {/* Category & Status Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">
            კატეგორია
          </label>
          <select
            value={formData.category_id || ''}
            onChange={(e) => onChange({ category_id: e.target.value || null })}
            className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="">აირჩიეთ კატეგორია</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name_ka} ({cat.name_en})
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">
            სტატუსი
          </label>
          <select
            value={formData.status || 'draft'}
            onChange={(e) => onChange({ status: e.target.value as AdditionalService['status'] })}
            className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="draft">დრაფტი</option>
            <option value="pending">მოლოდინში</option>
            <option value="active">აქტიური</option>
            <option value="hidden">დამალული</option>
          </select>
        </div>
      </div>

      {/* Language Tabs */}
      <div>
        <div className="flex flex-wrap gap-2 mb-4">
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => setActiveLang(lang.code)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeLang === lang.code
                  ? 'bg-blue-500 text-white'
                  : 'bg-foreground/10 text-foreground/70 hover:bg-foreground/20'
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
              {(lang.code === 'ka' || lang.code === 'en') && (
                <span className="text-red-400 text-xs">*</span>
              )}
            </button>
          ))}
        </div>

        {/* Language-specific fields */}
        <div className="space-y-4 p-4 bg-foreground/5 rounded-lg">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1">
              სახელი ({activeLang.toUpperCase()})
              {(activeLang === 'ka' || activeLang === 'en') && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </label>
            <input
              type="text"
              value={(formData[`name_${activeLang}` as keyof AdditionalService] as string) || ''}
              onChange={(e) => handleChange(`name_${activeLang}`, e.target.value)}
              className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder={activeLang === 'ka' ? 'დრონით გადაღება' : 'Drone Filming'}
              dir={activeLang === 'ar' ? 'rtl' : 'ltr'}
              required={activeLang === 'ka' || activeLang === 'en'}
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1">
              Slug ({activeLang.toUpperCase()})
              {(activeLang === 'ka' || activeLang === 'en') && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={(formData[`slug_${activeLang}` as keyof AdditionalService] as string) || ''}
                onChange={(e) => handleChange(`slug_${activeLang}`, e.target.value)}
                className="flex-1 px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder={activeLang === 'ka' ? 'ka-dronit-gadagheba' : 'en-drone-filming'}
                required={activeLang === 'ka' || activeLang === 'en'}
              />
              <button
                type="button"
                onClick={() => generateSlug(activeLang)}
                className="px-4 py-2 bg-foreground/10 hover:bg-foreground/20 rounded-lg text-sm transition-colors"
              >
                Auto
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1">
              აღწერა ({activeLang.toUpperCase()})
            </label>
            <textarea
              value={(formData[`description_${activeLang}` as keyof AdditionalService] as string) || ''}
              onChange={(e) => handleChange(`description_${activeLang}`, e.target.value)}
              rows={5}
              className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
              placeholder="სერვისის დეტალური აღწერა..."
              dir={activeLang === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>
        </div>
      </div>

      {/* Quick view of all languages */}
      <div className="mt-6 p-4 bg-foreground/5 rounded-lg">
        <h4 className="text-sm font-medium text-foreground/70 mb-3">ყველა ენის სახელები:</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
          {languages.map(lang => (
            <div key={lang.code} className="flex items-center gap-2">
              <span>{lang.flag}</span>
              <span className="text-foreground/50">{lang.code.toUpperCase()}:</span>
              <span className={
                (formData[`name_${lang.code}` as keyof AdditionalService] as string) 
                  ? 'text-foreground' 
                  : 'text-foreground/30 italic'
              }>
                {(formData[`name_${lang.code}` as keyof AdditionalService] as string) || 'არ არის'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
