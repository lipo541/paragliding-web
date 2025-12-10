'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, Save, Globe, RefreshCw, Image } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';

interface CompanyData {
  id: string;
  user_id: string;
  identification_code: string;
  phone: string;
  email: string | null;
  founded_date: string | null;
  logo_url: string | null;
  status: string;
  // Multi-language names
  name_ka: string | null;
  name_en: string | null;
  name_ru: string | null;
  name_ar: string | null;
  name_de: string | null;
  name_tr: string | null;
  // Slugs
  slug_ka: string | null;
  slug_en: string | null;
  slug_ru: string | null;
  slug_ar: string | null;
  slug_de: string | null;
  slug_tr: string | null;
  // SEO titles
  seo_title_ka: string | null;
  seo_title_en: string | null;
  seo_title_ru: string | null;
  seo_title_ar: string | null;
  seo_title_de: string | null;
  seo_title_tr: string | null;
  // SEO descriptions
  seo_description_ka: string | null;
  seo_description_en: string | null;
  seo_description_ru: string | null;
  seo_description_ar: string | null;
  seo_description_de: string | null;
  seo_description_tr: string | null;
  // OG titles
  og_title_ka: string | null;
  og_title_en: string | null;
  og_title_ru: string | null;
  og_title_ar: string | null;
  og_title_de: string | null;
  og_title_tr: string | null;
  // OG descriptions
  og_description_ka: string | null;
  og_description_en: string | null;
  og_description_ru: string | null;
  og_description_ar: string | null;
  og_description_de: string | null;
  og_description_tr: string | null;
  // Shared OG image
  og_image: string | null;
  // Descriptions
  description_ka: string | null;
  description_en: string | null;
  description_ru: string | null;
  description_ar: string | null;
  description_de: string | null;
  description_tr: string | null;
}

interface CompanyEditFormProps {
  company: CompanyData;
  onCancel: () => void;
  onSave: (updatedCompany: CompanyData) => void;
}

type Language = 'ka' | 'en' | 'ru' | 'ar' | 'de' | 'tr';

const languages: { code: Language; name: string; flag: string }[] = [
  { code: 'ka', name: 'ქარ', flag: '🇬🇪' },
  { code: 'en', name: 'Eng', flag: '🇬🇧' },
  { code: 'ru', name: 'Рус', flag: '🇷🇺' },
  { code: 'ar', name: 'عرب', flag: '🇸🇦' },
  { code: 'de', name: 'Deu', flag: '🇩🇪' },
  { code: 'tr', name: 'Tür', flag: '🇹🇷' },
];

export default function CompanyEditForm({ company, onCancel, onSave }: CompanyEditFormProps) {
  const [activeTab, setActiveTab] = useState<Language>('ka');
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<CompanyData>({ ...company });
  const supabase = createClient();

  // Transliterate non-Latin characters to Latin
  const transliterate = (text: string): string => {
    const georgianMap: { [key: string]: string } = {
      'ა': 'a', 'ბ': 'b', 'გ': 'g', 'დ': 'd', 'ე': 'e', 'ვ': 'v', 'ზ': 'z', 'თ': 'th', 'ი': 'i',
      'კ': 'k', 'ლ': 'l', 'მ': 'm', 'ნ': 'n', 'ო': 'o', 'პ': 'p', 'ჟ': 'zh', 'რ': 'r', 'ს': 's',
      'ტ': 't', 'უ': 'u', 'ფ': 'f', 'ქ': 'k', 'ღ': 'gh', 'ყ': 'q', 'შ': 'sh', 'ჩ': 'ch', 'ც': 'ts',
      'ძ': 'dz', 'წ': 'w', 'ჭ': 'tch', 'ხ': 'kh', 'ჯ': 'j', 'ჰ': 'h'
    };

    const russianMap: { [key: string]: string } = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z',
      'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r',
      'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
      'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
    };

    const arabicMap: { [key: string]: string } = {
      'ا': 'a', 'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh',
      'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a',
      'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ه': 'h', 'و': 'w',
      'ي': 'y', 'ى': 'a', 'ة': 'h', 'ؤ': 'o', 'ئ': 'e', 'ء': ''
    };

    return text.split('').map(char => {
      const lower = char.toLowerCase();
      return georgianMap[lower] || russianMap[lower] || arabicMap[char] || char;
    }).join('');
  };

  // Generate slug from name with language prefix
  const generateSlug = (name: string, lang: Language): string => {
    const transliterated = transliterate(name);
    const slug = transliterated
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    return `${lang}-${slug}`;
  };

  // Auto-generate slug for current language
  const handleAutoGenerateSlug = () => {
    const nameKey = `name_${activeTab}` as keyof CompanyData;
    const slugKey = `slug_${activeTab}` as keyof CompanyData;
    const name = formData[nameKey] as string;
    
    if (name) {
      setFormData(prev => ({
        ...prev,
        [slugKey]: generateSlug(name, activeTab),
      }));
    }
  };

  // Handle name change and auto-generate slug
  const handleNameChange = (lang: Language, value: string) => {
    const nameKey = `name_${lang}` as keyof CompanyData;
    const slugKey = `slug_${lang}` as keyof CompanyData;
    
    setFormData(prev => ({
      ...prev,
      [nameKey]: value,
      [slugKey]: prev[slugKey] || generateSlug(value, lang),
    }));
  };

  // Handle field change
  const handleFieldChange = (field: keyof CompanyData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Save changes
  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          // Names
          name_ka: formData.name_ka,
          name_en: formData.name_en,
          name_ru: formData.name_ru,
          name_ar: formData.name_ar,
          name_de: formData.name_de,
          name_tr: formData.name_tr,
          // Slugs
          slug_ka: formData.slug_ka,
          slug_en: formData.slug_en,
          slug_ru: formData.slug_ru,
          slug_ar: formData.slug_ar,
          slug_de: formData.slug_de,
          slug_tr: formData.slug_tr,
          // SEO titles
          seo_title_ka: formData.seo_title_ka,
          seo_title_en: formData.seo_title_en,
          seo_title_ru: formData.seo_title_ru,
          seo_title_ar: formData.seo_title_ar,
          seo_title_de: formData.seo_title_de,
          seo_title_tr: formData.seo_title_tr,
          // SEO descriptions
          seo_description_ka: formData.seo_description_ka,
          seo_description_en: formData.seo_description_en,
          seo_description_ru: formData.seo_description_ru,
          seo_description_ar: formData.seo_description_ar,
          seo_description_de: formData.seo_description_de,
          seo_description_tr: formData.seo_description_tr,
          // OG titles
          og_title_ka: formData.og_title_ka,
          og_title_en: formData.og_title_en,
          og_title_ru: formData.og_title_ru,
          og_title_ar: formData.og_title_ar,
          og_title_de: formData.og_title_de,
          og_title_tr: formData.og_title_tr,
          // OG descriptions
          og_description_ka: formData.og_description_ka,
          og_description_en: formData.og_description_en,
          og_description_ru: formData.og_description_ru,
          og_description_ar: formData.og_description_ar,
          og_description_de: formData.og_description_de,
          og_description_tr: formData.og_description_tr,
          // OG image
          og_image: formData.og_image,
          // Descriptions
          description_ka: formData.description_ka,
          description_en: formData.description_en,
          description_ru: formData.description_ru,
          description_ar: formData.description_ar,
          description_de: formData.description_de,
          description_tr: formData.description_tr,
        })
        .eq('id', company.id);

      if (error) throw error;

      onSave(formData);
    } catch (error) {
      console.error('Error saving company:', error);
      alert('შენახვისას მოხდა შეცდომა');
    } finally {
      setSaving(false);
    }
  };

  // Get field value for current language
  const getFieldValue = (prefix: string): string => {
    const key = `${prefix}_${activeTab}` as keyof CompanyData;
    return (formData[key] as string) || '';
  };

  // Set field value for current language
  const setFieldValue = (prefix: string, value: string) => {
    const key = `${prefix}_${activeTab}` as keyof CompanyData;
    handleFieldChange(key, value);
  };

  return (
    <div className="space-y-4">
      {/* Header with Language Tabs */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-foreground/60" />
          <span className="text-sm font-medium text-foreground">კონტენტის რედაქტირება</span>
        </div>
        
        {/* Language Tabs */}
        <div className="flex items-center gap-1">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setActiveTab(lang.code)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === lang.code
                  ? 'bg-foreground text-background'
                  : 'bg-foreground/5 text-foreground/70 hover:bg-foreground/10'
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="space-y-4">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-foreground/70 mb-1">
              სახელი ({languages.find(l => l.code === activeTab)?.flag})
            </label>
            <input
              type="text"
              value={getFieldValue('name')}
              onChange={(e) => handleNameChange(activeTab, e.target.value)}
              className="w-full px-3 py-2 bg-foreground/5 border border-foreground/10 rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
              placeholder="კომპანიის სახელი"
              dir={activeTab === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-xs font-medium text-foreground/70 mb-1">
              URL Slug
            </label>
            <div className="flex items-center gap-1">
              <span className="text-xs text-foreground/40">/</span>
              <input
                type="text"
                value={getFieldValue('slug')}
                onChange={(e) => setFieldValue('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                className="flex-1 px-3 py-2 bg-foreground/5 border border-foreground/10 rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-foreground/20"
                placeholder={`${activeTab}-company-slug`}
                dir="ltr"
              />
              <button
                type="button"
                onClick={handleAutoGenerateSlug}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                title="ავტომატური გენერაცია"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-foreground/70 mb-1">
            აღწერა ({languages.find(l => l.code === activeTab)?.flag})
          </label>
          <textarea
            value={getFieldValue('description')}
            onChange={(e) => setFieldValue('description', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 bg-foreground/5 border border-foreground/10 rounded-lg text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-foreground/20"
            placeholder="კომპანიის აღწერა"
            dir={activeTab === 'ar' ? 'rtl' : 'ltr'}
          />
        </div>

        {/* SEO Section */}
        <div className="pt-3 border-t border-foreground/10">
          <p className="text-xs font-medium text-foreground/60 mb-3 flex items-center gap-1.5">
            🔍 SEO ({languages.find(l => l.code === activeTab)?.flag})
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground/70 mb-1">
                Meta Title
              </label>
              <input
                type="text"
                value={getFieldValue('seo_title')}
                onChange={(e) => setFieldValue('seo_title', e.target.value)}
                className="w-full px-3 py-2 bg-foreground/5 border border-foreground/10 rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                placeholder="SEO სათაური (50-60 სიმბ.)"
                dir={activeTab === 'ar' ? 'rtl' : 'ltr'}
              />
              <p className="text-[10px] text-foreground/40 mt-0.5">{getFieldValue('seo_title').length}/60</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground/70 mb-1">
                Meta Description
              </label>
              <input
                type="text"
                value={getFieldValue('seo_description')}
                onChange={(e) => setFieldValue('seo_description', e.target.value)}
                className="w-full px-3 py-2 bg-foreground/5 border border-foreground/10 rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                placeholder="SEO აღწერა (150-160 სიმბ.)"
                dir={activeTab === 'ar' ? 'rtl' : 'ltr'}
              />
              <p className="text-[10px] text-foreground/40 mt-0.5">{getFieldValue('seo_description').length}/160</p>
            </div>
          </div>
        </div>

        {/* Open Graph Section */}
        <div className="pt-3 border-t border-foreground/10">
          <p className="text-xs font-medium text-foreground/60 mb-3 flex items-center gap-1.5">
            📱 Open Graph ({languages.find(l => l.code === activeTab)?.flag})
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground/70 mb-1">
                OG Title
              </label>
              <input
                type="text"
                value={getFieldValue('og_title')}
                onChange={(e) => setFieldValue('og_title', e.target.value)}
                className="w-full px-3 py-2 bg-foreground/5 border border-foreground/10 rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                placeholder="სოციალური სათაური"
                dir={activeTab === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground/70 mb-1">
                OG Description
              </label>
              <input
                type="text"
                value={getFieldValue('og_description')}
                onChange={(e) => setFieldValue('og_description', e.target.value)}
                className="w-full px-3 py-2 bg-foreground/5 border border-foreground/10 rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                placeholder="სოციალური აღწერა"
                dir={activeTab === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>
          </div>

          {/* OG Image - Auto from Logo */}
          <div className="mt-3">
            <label className="block text-xs font-medium text-foreground/70 mb-1">
              OG სურათი
            </label>
            <div className="flex items-center gap-3">
              {(formData.og_image || formData.logo_url) ? (
                <div className="relative">
                  <img
                    src={formData.og_image || formData.logo_url || ''}
                    alt="OG"
                    className="w-24 h-14 object-cover rounded-lg border border-foreground/10"
                  />
                  {formData.og_image && (
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, og_image: null }))}
                      className="absolute -top-1.5 -right-1.5 p-0.5 bg-red-500 rounded-full text-white hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="w-24 h-14 bg-foreground/5 rounded-lg border border-dashed border-foreground/20 flex items-center justify-center">
                  <Image className="w-4 h-4 text-foreground/30" />
                </div>
              )}
              <div className="space-y-1">
                {formData.logo_url && !formData.og_image && (
                  <p className="text-[10px] text-green-600">✓ ლოგო გამოიყენება OG სურათად</p>
                )}
                {formData.og_image && formData.og_image !== formData.logo_url && (
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, og_image: prev.logo_url }))}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-foreground/5 text-foreground/70 rounded-lg text-xs hover:bg-foreground/10 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    ლოგოზე დაბრუნება
                  </button>
                )}
                {!formData.logo_url && (
                  <p className="text-[10px] text-foreground/40">ლოგო არ არის ატვირთული</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-2 pt-3 border-t border-foreground/10">
        <button
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-2 text-sm text-foreground/70 hover:bg-foreground/5 rounded-lg transition-colors"
        >
          გაუქმება
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 bg-foreground text-background rounded-lg text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <Spinner size="sm" className="border-background" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          შენახვა
        </button>
      </div>
    </div>
  );
}
