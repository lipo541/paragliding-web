'use client';

import { useState } from 'react';
import { Search, Globe, Image as ImageIcon, Info } from 'lucide-react';
import type { AdditionalService } from '@/lib/types/services';

type Language = 'ka' | 'en' | 'ru' | 'ar' | 'de' | 'tr';

const languages: { code: Language; label: string; flag: string }[] = [
  { code: 'ka', label: 'ქართული', flag: '🇬🇪' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
];

interface ServiceSeoTabProps {
  formData: Partial<AdditionalService>;
  onChange: (data: Partial<AdditionalService>) => void;
}

export default function ServiceSeoTab({
  formData,
  onChange,
}: ServiceSeoTabProps) {
  const [activeLang, setActiveLang] = useState<Language>('ka');
  const [showOgPreview, setShowOgPreview] = useState(false);

  const seoTitle = (formData[`seo_title_${activeLang}` as keyof AdditionalService] as string) || '';
  const seoDescription = (formData[`seo_description_${activeLang}` as keyof AdditionalService] as string) || '';
  const ogTitle = (formData[`og_title_${activeLang}` as keyof AdditionalService] as string) || '';
  const ogDescription = (formData[`og_description_${activeLang}` as keyof AdditionalService] as string) || '';
  const serviceName = formData.name_ka || formData.name_en || '';

  // Character count helpers
  const titleLength = seoTitle.length;
  const descLength = seoDescription.length;
  const titleMax = 60;
  const descMax = 160;

  // Get status color for character count
  const getCountColor = (current: number, max: number) => {
    if (current === 0) return 'text-foreground/40';
    if (current <= max) return 'text-green-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Language Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {languages.map(lang => (
          <button
            key={lang.code}
            onClick={() => setActiveLang(lang.code)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
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

      {/* SEO Fields */}
      <div className="space-y-4">
        {/* SEO Title */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium">
              SEO Title ({activeLang.toUpperCase()})
            </label>
            <span className={`text-xs ${getCountColor(titleLength, titleMax)}`}>
              {titleLength}/{titleMax}
            </span>
          </div>
          <input
            type="text"
            value={seoTitle}
            onChange={(e) => onChange({
              [`seo_title_${activeLang}`]: e.target.value,
            })}
            placeholder={`${serviceName} | Paragliding Georgia`}
            className="w-full px-4 py-3 bg-foreground/5 border border-border rounded-lg text-sm"
            dir={activeLang === 'ar' ? 'rtl' : 'ltr'}
          />
          <p className="text-xs text-foreground/50 mt-1">
            რეკომენდირებული: 50-60 სიმბოლო. გამოჩნდება საძიებო სისტემებში.
          </p>
        </div>

        {/* SEO Description */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium">
              SEO Description ({activeLang.toUpperCase()})
            </label>
            <span className={`text-xs ${getCountColor(descLength, descMax)}`}>
              {descLength}/{descMax}
            </span>
          </div>
          <textarea
            value={seoDescription}
            onChange={(e) => onChange({
              [`seo_description_${activeLang}`]: e.target.value,
            })}
            placeholder="აღწერეთ სერვისი მოკლედ..."
            rows={3}
            className="w-full px-4 py-3 bg-foreground/5 border border-border rounded-lg text-sm resize-none"
            dir={activeLang === 'ar' ? 'rtl' : 'ltr'}
          />
          <p className="text-xs text-foreground/50 mt-1">
            რეკომენდირებული: 120-160 სიმბოლო. გამოჩნდება საძიებო შედეგებში.
          </p>
        </div>

        {/* OG Title */}
        <div>
          <label className="block text-sm font-medium mb-1">
            OG Title ({activeLang.toUpperCase()})
          </label>
          <input
            type="text"
            value={ogTitle}
            onChange={(e) => onChange({
              [`og_title_${activeLang}`]: e.target.value,
            })}
            placeholder="სოციალურ ქსელებში გაზიარებისას..."
            className="w-full px-4 py-3 bg-foreground/5 border border-border rounded-lg text-sm"
            dir={activeLang === 'ar' ? 'rtl' : 'ltr'}
          />
        </div>

        {/* OG Description */}
        <div>
          <label className="block text-sm font-medium mb-1">
            OG Description ({activeLang.toUpperCase()})
          </label>
          <textarea
            value={ogDescription}
            onChange={(e) => onChange({
              [`og_description_${activeLang}`]: e.target.value,
            })}
            placeholder="სოციალურ ქსელებში გაზიარებისას..."
            rows={2}
            className="w-full px-4 py-3 bg-foreground/5 border border-border rounded-lg text-sm resize-none"
            dir={activeLang === 'ar' ? 'rtl' : 'ltr'}
          />
        </div>

        {/* OG Image */}
        <div>
          <label className="block text-sm font-medium mb-1">
            OG Image URL
          </label>
          <div className="relative">
            <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
            <input
              type="url"
              value={formData.og_image || ''}
              onChange={(e) => onChange({ og_image: e.target.value || '' })}
              placeholder="https://example.com/image.jpg"
              className="w-full pl-10 pr-4 py-3 bg-foreground/5 border border-border rounded-lg text-sm"
            />
          </div>
          <p className="text-xs text-foreground/50 mt-1">
            სურათი რომელიც გამოჩნდება სოციალურ ქსელებში გაზიარებისას. რეკომენდირებული: 1200x630px
          </p>
        </div>
      </div>

      {/* Google Preview */}
      <div className="bg-foreground/5 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Search className="w-4 h-4 text-foreground/50" />
          <h4 className="text-sm font-medium">Google Preview</h4>
        </div>
        
        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-sm">
          <div className="text-sm text-green-600 dark:text-green-400 mb-1">
            paragliding.ge › services › {serviceName.toLowerCase().replace(/\s+/g, '-') || 'service'}
          </div>
          <div className="text-blue-600 dark:text-blue-400 text-lg font-medium mb-1 hover:underline cursor-pointer">
            {seoTitle || `${serviceName} | Paragliding Georgia`}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {seoDescription || 'აღწერა ჯერ არ არის დამატებული...'}
          </div>
        </div>
      </div>

      {/* Social Preview Toggle */}
      <div>
        <button
          onClick={() => setShowOgPreview(!showOgPreview)}
          className="flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground transition-colors"
        >
          <Globe className="w-4 h-4" />
          {showOgPreview ? 'დამალვა' : 'სოციალური ქსელების Preview'}
        </button>

        {showOgPreview && (
          <div className="mt-3 grid md:grid-cols-2 gap-4">
            {/* Facebook Preview */}
            <div className="bg-foreground/5 rounded-xl p-4">
              <div className="text-xs font-medium text-foreground/50 mb-2">Facebook</div>
              <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm">
                {formData.og_image ? (
                  <div className="aspect-[1.91/1] bg-foreground/10 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={formData.og_image} 
                      alt="OG Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-[1.91/1] bg-foreground/10 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-foreground/30" />
                  </div>
                )}
                <div className="p-3">
                  <div className="text-xs text-gray-500 uppercase mb-1">paragliding.ge</div>
                  <div className="font-medium text-sm line-clamp-2">
                    {ogTitle || serviceName || 'სერვისის სახელი'}
                  </div>
                  <div className="text-xs text-gray-500 line-clamp-2 mt-1">
                    {ogDescription || 'აღწერა...'}
                  </div>
                </div>
              </div>
            </div>

            {/* Twitter Preview */}
            <div className="bg-foreground/5 rounded-xl p-4">
              <div className="text-xs font-medium text-foreground/50 mb-2">Twitter / X</div>
              <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm">
                {formData.og_image ? (
                  <div className="aspect-[2/1] bg-foreground/10 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={formData.og_image} 
                      alt="OG Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-[2/1] bg-foreground/10 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-foreground/30" />
                  </div>
                )}
                <div className="p-3">
                  <div className="font-medium text-sm line-clamp-1">
                    {ogTitle || serviceName || 'სერვისის სახელი'}
                  </div>
                  <div className="text-xs text-gray-500 line-clamp-2 mt-1">
                    {ogDescription || 'აღწერა...'}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">paragliding.ge</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SEO Tips */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-600 dark:text-blue-400 mb-2">SEO რჩევები</h4>
            <ul className="text-sm text-foreground/70 space-y-1">
              <li>• Meta Title-ში ჩართეთ ძირითადი საკვანძო სიტყვები</li>
              <li>• Description უნდა იყოს მოქმედებაზე ორიენტირებული</li>
              <li>• თითოეული ენისთვის ინდივიდუალურად გაწერეთ SEO</li>
              <li>• OG სურათი უნდა იყოს მაღალი ხარისხის (1200x630px)</li>
              <li>• არ გამოიყენოთ იგივე ტექსტი ყველა სერვისისთვის</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
