"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface CountryTranslations {
  name: string;
  slug: string;
  seoTitle: string;
  seoDescription: string;
  ogTitle: string;
  ogDescription: string;
}

interface Country {
  id: string;
  og_image_url?: string;
  translations: {
    georgian: CountryTranslations;
    english: CountryTranslations;
    russian: CountryTranslations;
    arabic: CountryTranslations;
    german: CountryTranslations;
    turkish: CountryTranslations;
  };
}

interface EditCountryProps {
  country: Country;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditCountry({ country, onClose, onSuccess }: EditCountryProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [ogImage, setOgImage] = useState<File | null>(null);
  const [ogImagePreview, setOgImagePreview] = useState<string | null>(country.og_image_url || null);
  const [countryForm, setCountryForm] = useState(country.translations);

  const supabase = createClient();

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

  const generateSlug = (text: string, language?: string): string => {
    const transliterated = transliterate(text);
    const slug = transliterated
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    if (language) {
      const prefixes: { [key: string]: string } = {
        'georgian': 'ka',
        'english': 'en',
        'russian': 'ru',
        'arabic': 'ar',
        'german': 'de',
        'turkish': 'tr'
      };
      return `${prefixes[language]}-${slug}`;
    }
    return slug;
  };

  const handleInputChange = (
    language: keyof typeof countryForm,
    field: keyof CountryTranslations,
    value: string
  ) => {
    setCountryForm((prev) => ({
      ...prev,
      [language]: {
        ...prev[language],
        [field]: value,
        ...(field === "name" && { slug: generateSlug(value, language) }),
      },
    }));
  };

  const handleAutoGenerateSlug = (language: keyof typeof countryForm) => {
    const name = countryForm[language].name;
    if (name) {
      setCountryForm((prev) => ({
        ...prev,
        [language]: {
          ...prev[language],
          slug: generateSlug(name, language),
        },
      }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("სურათის ზომა არ უნდა აღემატებოდეს 5MB-ს");
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert("გთხოვთ ატვირთოთ მხოლოდ სურათი");
        return;
      }
      setOgImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setOgImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setOgImage(null);
    setOgImagePreview(country.og_image_url || null);
  };

  const handleUpdateCountry = async () => {
    try {
      setIsSaving(true);

      if (!countryForm.georgian.name || !countryForm.english.name || !countryForm.russian.name) {
        alert("ქართული, ინგლისური და რუსული სახელები სავალდებულოა");
        return;
      }

      let ogImageUrl = country.og_image_url;

      if (ogImage) {
        const fileExt = ogImage.name.split('.').pop();
        const fileName = `${country.id}/og-image.${fileExt}`;

        if (ogImageUrl) {
          const oldFileName = ogImageUrl.split('/').slice(-2).join('/');
          await supabase.storage
            .from('countries-og-images')
            .remove([oldFileName]);
        }

        const { error: uploadError } = await supabase.storage
          .from('countries-og-images')
          .upload(fileName, ogImage, { upsert: true });

        if (uploadError) {
          console.error('Image upload error:', uploadError);
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('countries-og-images')
          .getPublicUrl(fileName);
        
        ogImageUrl = publicUrl;
      }

      const { error } = await supabase
        .from('countries')
        .update({
          og_image_url: ogImageUrl,
          name_ka: countryForm.georgian.name,
          slug_ka: countryForm.georgian.slug,
          seo_title_ka: countryForm.georgian.seoTitle,
          seo_description_ka: countryForm.georgian.seoDescription,
          og_title_ka: countryForm.georgian.ogTitle,
          og_description_ka: countryForm.georgian.ogDescription,
          name_en: countryForm.english.name,
          slug_en: countryForm.english.slug,
          seo_title_en: countryForm.english.seoTitle,
          seo_description_en: countryForm.english.seoDescription,
          og_title_en: countryForm.english.ogTitle,
          og_description_en: countryForm.english.ogDescription,
          name_ru: countryForm.russian.name,
          slug_ru: countryForm.russian.slug,
          seo_title_ru: countryForm.russian.seoTitle,
          seo_description_ru: countryForm.russian.seoDescription,
          og_title_ru: countryForm.russian.ogTitle,
          og_description_ru: countryForm.russian.ogDescription,
          name_ar: countryForm.arabic.name,
          slug_ar: countryForm.arabic.slug,
          seo_title_ar: countryForm.arabic.seoTitle,
          seo_description_ar: countryForm.arabic.seoDescription,
          og_title_ar: countryForm.arabic.ogTitle,
          og_description_ar: countryForm.arabic.ogDescription,
          name_de: countryForm.german.name,
          slug_de: countryForm.german.slug,
          seo_title_de: countryForm.german.seoTitle,
          seo_description_de: countryForm.german.seoDescription,
          og_title_de: countryForm.german.ogTitle,
          og_description_de: countryForm.german.ogDescription,
          name_tr: countryForm.turkish.name,
          slug_tr: countryForm.turkish.slug,
          seo_title_tr: countryForm.turkish.seoTitle,
          seo_description_tr: countryForm.turkish.seoDescription,
          og_title_tr: countryForm.turkish.ogTitle,
          og_description_tr: countryForm.turkish.ogDescription,
        })
        .eq('id', country.id);

      if (error) throw error;

      alert("ქვეყანა წარმატებით განახლდა!");
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Update error:', err);
      alert("განახლებისას მოხდა შეცდომა");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mb-6 bg-background border-2 border-blue-600/30 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-foreground">ქვეყნის რედაქტირება</h3>
        <button
          onClick={onClose}
          className="p-2 hover:bg-red-600/10 text-red-600 rounded-md transition-colors"
          title="დახურვა"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* OG Image Upload */}
      <div className="mb-6 p-4 bg-foreground/5 rounded-lg border border-foreground/10">
        <label className="block text-sm font-semibold text-foreground mb-3">
          Open Graph სურათი (1200x630px რეკომენდებული) *
        </label>
        
        {!ogImagePreview ? (
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md cursor-pointer transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              სურათის არჩევა
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
            <span className="text-sm text-foreground/60">მაქსიმუმ 5MB</span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative inline-block">
              <img
                src={ogImagePreview}
                alt="OG Image Preview"
                className="max-w-md h-auto rounded-lg border-2 border-blue-500"
              />
              <button
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
                type="button"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-blue-600 font-medium">✓ სურათი მზადაა ატვირთვისთვის</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Georgian */}
        <div className="space-y-4">
          <h4 className="font-semibold text-foreground text-lg border-b pb-2">ქართული *</h4>
          <input
            type="text"
            value={countryForm.georgian.name}
            onChange={(e) => handleInputChange("georgian", "name", e.target.value)}
            placeholder="მაგ: საქართველო"
            className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div>
            <label className="block text-xs text-foreground/60 mb-1">Slug (ქართული)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={countryForm.georgian.slug}
                onChange={(e) => handleInputChange("georgian", "slug", e.target.value)}
                placeholder="ავტომატურად გენერირდება"
                className="flex-1 px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => handleAutoGenerateSlug("georgian")}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm font-medium"
                title="ავტომატური გენერაცია"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-foreground/60 mb-1">SEO Title</label>
            <input
              type="text"
              value={countryForm.georgian.seoTitle}
              onChange={(e) => handleInputChange("georgian", "seoTitle", e.target.value)}
              placeholder="SEO სათაური"
              maxLength={60}
              className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-between text-xs mt-1">
              <span className={countryForm.georgian.seoTitle.length > 60 ? "text-red-500" : countryForm.georgian.seoTitle.length >= 50 ? "text-green-500" : "text-foreground/40"}>
                {countryForm.georgian.seoTitle.length}/60 სიმბოლო
              </span>
              <span className="text-foreground/40">
                ოპტიმალური: 50-60
              </span>
            </div>
          </div>
          <div>
            <label className="block text-xs text-foreground/60 mb-1">SEO Description</label>
            <textarea
              value={countryForm.georgian.seoDescription}
              onChange={(e) => handleInputChange("georgian", "seoDescription", e.target.value)}
              placeholder="SEO აღწერა"
              rows={3}
              maxLength={160}
              className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-between text-xs mt-1">
              <span className={countryForm.georgian.seoDescription.length > 160 ? "text-red-500" : countryForm.georgian.seoDescription.length >= 120 ? "text-green-500" : "text-foreground/40"}>
                {countryForm.georgian.seoDescription.length}/160 სიმბოლო
              </span>
              <span className="text-foreground/40">
                ოპტიმალური: 120-160
              </span>
            </div>
          </div>
          
          <div className="pt-3 mt-3 border-t border-foreground/10">
            <h5 className="text-xs font-semibold text-blue-600 mb-2">📱 Open Graph</h5>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-foreground/60 mb-1">OG სათაური</label>
                <input
                  type="text"
                  value={countryForm.georgian.ogTitle}
                  onChange={(e) => handleInputChange("georgian", "ogTitle", e.target.value)}
                  placeholder="თუ ცარიელია, გამოიყენება SEO სათაური"
                  maxLength={60}
                  className="w-full px-3 py-2 bg-background border border-blue-200 rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-foreground/60 mb-1">OG აღწერა</label>
                <textarea
                  value={countryForm.georgian.ogDescription}
                  onChange={(e) => handleInputChange("georgian", "ogDescription", e.target.value)}
                  placeholder="თუ ცარიელია, გამოიყენება SEO აღწერა"
                  rows={2}
                  maxLength={160}
                  className="w-full px-3 py-2 bg-background border border-blue-200 rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* English */}
        <div className="space-y-4">
          <h4 className="font-semibold text-foreground text-lg border-b pb-2">ინგლისური *</h4>
          <input
            type="text"
            value={countryForm.english.name}
            onChange={(e) => handleInputChange("english", "name", e.target.value)}
            placeholder="e.g: Georgia"
            className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div>
            <label className="block text-xs text-foreground/60 mb-1">Slug (ინგლისური)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={countryForm.english.slug}
                onChange={(e) => handleInputChange("english", "slug", e.target.value)}
                placeholder="auto-generated"
                className="flex-1 px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => handleAutoGenerateSlug("english")}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm font-medium"
                title="Auto Generate"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-foreground/60 mb-1">SEO სათაური</label>
            <input
              type="text"
              value={countryForm.english.seoTitle}
              onChange={(e) => handleInputChange("english", "seoTitle", e.target.value)}
              placeholder="SEO სათაური"
              maxLength={60}
              className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-between text-xs mt-1">
              <span className={countryForm.english.seoTitle.length > 60 ? "text-red-500" : countryForm.english.seoTitle.length >= 50 ? "text-green-500" : "text-foreground/40"}>
                {countryForm.english.seoTitle.length}/60 სიმბოლო
              </span>
              <span className="text-foreground/40">
                ოპტიმალური: 50-60
              </span>
            </div>
          </div>
          <div>
            <label className="block text-xs text-foreground/60 mb-1">SEO აღწერა</label>
            <textarea
              value={countryForm.english.seoDescription}
              onChange={(e) => handleInputChange("english", "seoDescription", e.target.value)}
              placeholder="SEO აღწერა"
              rows={3}
              maxLength={160}
              className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-between text-xs mt-1">
              <span className={countryForm.english.seoDescription.length > 160 ? "text-red-500" : countryForm.english.seoDescription.length >= 120 ? "text-green-500" : "text-foreground/40"}>
                {countryForm.english.seoDescription.length}/160 სიმბოლო
              </span>
              <span className="text-foreground/40">
                ოპტიმალური: 120-160
              </span>
            </div>
          </div>
          
          <div className="pt-3 mt-3 border-t border-foreground/10">
            <h5 className="text-xs font-semibold text-blue-600 mb-2">📱 Open Graph</h5>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-foreground/60 mb-1">OG სათაური</label>
                <input
                  type="text"
                  value={countryForm.english.ogTitle}
                  onChange={(e) => handleInputChange("english", "ogTitle", e.target.value)}
                  placeholder="თუ ცარიელია, გამოიყენება SEO სათაური"
                  maxLength={60}
                  className="w-full px-3 py-2 bg-background border border-blue-200 rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-foreground/60 mb-1">OG აღწერა</label>
                <textarea
                  value={countryForm.english.ogDescription}
                  onChange={(e) => handleInputChange("english", "ogDescription", e.target.value)}
                  placeholder="თუ ცარიელია, გამოიყენება SEO აღწერა"
                  rows={2}
                  maxLength={160}
                  className="w-full px-3 py-2 bg-background border border-blue-200 rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Russian */}
        <div className="space-y-4">
          <h4 className="font-semibold text-foreground text-lg border-b pb-2">რუსული *</h4>
          <input
            type="text"
            value={countryForm.russian.name}
            onChange={(e) => handleInputChange("russian", "name", e.target.value)}
            placeholder="напр: Грузия"
            className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div>
            <label className="block text-xs text-foreground/60 mb-1">Slug (რუსული)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={countryForm.russian.slug}
                onChange={(e) => handleInputChange("russian", "slug", e.target.value)}
                placeholder="автоматически"
                className="flex-1 px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => handleAutoGenerateSlug("russian")}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm font-medium"
                title="Автоматическая генерация"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-foreground/60 mb-1">SEO სათაური</label>
            <input
              type="text"
              value={countryForm.russian.seoTitle}
              onChange={(e) => handleInputChange("russian", "seoTitle", e.target.value)}
              placeholder="SEO სათაური"
              maxLength={60}
              className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-between text-xs mt-1">
              <span className={countryForm.russian.seoTitle.length > 60 ? "text-red-500" : countryForm.russian.seoTitle.length >= 50 ? "text-green-500" : "text-foreground/40"}>
                {countryForm.russian.seoTitle.length}/60 სიმბოლო
              </span>
              <span className="text-foreground/40">
                ოპტიმალური: 50-60
              </span>
            </div>
          </div>
          <div>
            <label className="block text-xs text-foreground/60 mb-1">SEO აღწერა</label>
            <textarea
              value={countryForm.russian.seoDescription}
              onChange={(e) => handleInputChange("russian", "seoDescription", e.target.value)}
              placeholder="SEO აღწერა"
              rows={3}
              maxLength={160}
              className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-between text-xs mt-1">
              <span className={countryForm.russian.seoDescription.length > 160 ? "text-red-500" : countryForm.russian.seoDescription.length >= 120 ? "text-green-500" : "text-foreground/40"}>
                {countryForm.russian.seoDescription.length}/160 სიმბოლო
              </span>
              <span className="text-foreground/40">
                ოპტიმალური: 120-160
              </span>
            </div>
          </div>
          
          <div className="pt-3 mt-3 border-t border-foreground/10">
            <h5 className="text-xs font-semibold text-blue-600 mb-2">📱 Open Graph</h5>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-foreground/60 mb-1">OG სათაური</label>
                <input
                  type="text"
                  value={countryForm.russian.ogTitle}
                  onChange={(e) => handleInputChange("russian", "ogTitle", e.target.value)}
                  placeholder="თუ ცარიელია, გამოიყენება SEO სათაური"
                  maxLength={60}
                  className="w-full px-3 py-2 bg-background border border-blue-200 rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-foreground/60 mb-1">OG აღწერა</label>
                <textarea
                  value={countryForm.russian.ogDescription}
                  onChange={(e) => handleInputChange("russian", "ogDescription", e.target.value)}
                  placeholder="თუ ცარიელია, გამოიყენება SEO აღწერა"
                  rows={2}
                  maxLength={160}
                  className="w-full px-3 py-2 bg-background border border-blue-200 rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Arabic */}
        <div className="space-y-4">
          <h4 className="font-semibold text-foreground text-lg border-b pb-2">არაბული</h4>
          <input
            type="text"
            value={countryForm.arabic.name}
            onChange={(e) => handleInputChange("arabic", "name", e.target.value)}
            placeholder="مثال: جورجيا"
            dir="rtl"
            className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div>
            <label className="block text-xs text-foreground/60 mb-1">Slug (არაბული)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={countryForm.arabic.slug}
                onChange={(e) => handleInputChange("arabic", "slug", e.target.value)}
                placeholder="تلقائي"
                dir="rtl"
                className="flex-1 px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => handleAutoGenerateSlug("arabic")}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm font-medium"
                title="توليد تلقائي"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-foreground/60 mb-1">SEO სათაური</label>
            <input
              type="text"
              value={countryForm.arabic.seoTitle}
              onChange={(e) => handleInputChange("arabic", "seoTitle", e.target.value)}
              placeholder="SEO სათაური"
              dir="rtl"
              maxLength={60}
              className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-between text-xs mt-1">
              <span className={countryForm.arabic.seoTitle.length > 60 ? "text-red-500" : countryForm.arabic.seoTitle.length >= 50 ? "text-green-500" : "text-foreground/40"}>
                {countryForm.arabic.seoTitle.length}/60 სიმბოლო
              </span>
              <span className="text-foreground/40">
                ოპტიმალური: 50-60
              </span>
            </div>
          </div>
          <div>
            <label className="block text-xs text-foreground/60 mb-1">SEO აღწერა</label>
            <textarea
              value={countryForm.arabic.seoDescription}
              onChange={(e) => handleInputChange("arabic", "seoDescription", e.target.value)}
              placeholder="SEO აღწერა"
              dir="rtl"
              rows={3}
              maxLength={160}
              className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-between text-xs mt-1">
              <span className={countryForm.arabic.seoDescription.length > 160 ? "text-red-500" : countryForm.arabic.seoDescription.length >= 120 ? "text-green-500" : "text-foreground/40"}>
                {countryForm.arabic.seoDescription.length}/160 სიმბოლო
              </span>
              <span className="text-foreground/40">
                ოპტიმალური: 120-160
              </span>
            </div>
          </div>
          
          <div className="pt-3 mt-3 border-t border-foreground/10">
            <h5 className="text-xs font-semibold text-blue-600 mb-2">📱 Open Graph</h5>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-foreground/60 mb-1">OG სათაური</label>
                <input
                  type="text"
                  value={countryForm.arabic.ogTitle}
                  onChange={(e) => handleInputChange("arabic", "ogTitle", e.target.value)}
                  placeholder="თუ ცარიელია, გამოიყენება SEO სათაური"
                  dir="rtl"
                  maxLength={60}
                  className="w-full px-3 py-2 bg-background border border-blue-200 rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-foreground/60 mb-1">OG აღწერა</label>
                <textarea
                  value={countryForm.arabic.ogDescription}
                  onChange={(e) => handleInputChange("arabic", "ogDescription", e.target.value)}
                  placeholder="თუ ცარიელია, გამოიყენება SEO აღწერა"
                  dir="rtl"
                  rows={2}
                  maxLength={160}
                  className="w-full px-3 py-2 bg-background border border-blue-200 rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* German */}
        <div className="space-y-4">
          <h4 className="font-semibold text-foreground text-lg border-b pb-2">გერმანული</h4>
          <input
            type="text"
            value={countryForm.german.name}
            onChange={(e) => handleInputChange("german", "name", e.target.value)}
            placeholder="z.B: Georgien"
            className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div>
            <label className="block text-xs text-foreground/60 mb-1">Slug (გერმანული)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={countryForm.german.slug}
                onChange={(e) => handleInputChange("german", "slug", e.target.value)}
                placeholder="automatisch"
                className="flex-1 px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => handleAutoGenerateSlug("german")}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm font-medium"
                title="Automatisch generieren"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-foreground/60 mb-1">SEO სათაური</label>
            <input
              type="text"
              value={countryForm.german.seoTitle}
              onChange={(e) => handleInputChange("german", "seoTitle", e.target.value)}
              placeholder="SEO სათაური"
              maxLength={60}
              className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-between text-xs mt-1">
              <span className={countryForm.german.seoTitle.length > 60 ? "text-red-500" : countryForm.german.seoTitle.length >= 50 ? "text-green-500" : "text-foreground/40"}>
                {countryForm.german.seoTitle.length}/60 სიმბოლო
              </span>
              <span className="text-foreground/40">
                ოპტიმალური: 50-60
              </span>
            </div>
          </div>
          <div>
            <label className="block text-xs text-foreground/60 mb-1">SEO აღწერა</label>
            <textarea
              value={countryForm.german.seoDescription}
              onChange={(e) => handleInputChange("german", "seoDescription", e.target.value)}
              placeholder="SEO აღწერა"
              rows={3}
              maxLength={160}
              className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-between text-xs mt-1">
              <span className={countryForm.german.seoDescription.length > 160 ? "text-red-500" : countryForm.german.seoDescription.length >= 120 ? "text-green-500" : "text-foreground/40"}>
                {countryForm.german.seoDescription.length}/160 სიმბოლო
              </span>
              <span className="text-foreground/40">
                ოპტიმალური: 120-160
              </span>
            </div>
          </div>
          
          <div className="pt-3 mt-3 border-t border-foreground/10">
            <h5 className="text-xs font-semibold text-blue-600 mb-2">📱 Open Graph</h5>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-foreground/60 mb-1">OG სათაური</label>
                <input
                  type="text"
                  value={countryForm.german.ogTitle}
                  onChange={(e) => handleInputChange("german", "ogTitle", e.target.value)}
                  placeholder="თუ ცარიელია, გამოიყენება SEO სათაური"
                  maxLength={60}
                  className="w-full px-3 py-2 bg-background border border-blue-200 rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-foreground/60 mb-1">OG აღწერა</label>
                <textarea
                  value={countryForm.german.ogDescription}
                  onChange={(e) => handleInputChange("german", "ogDescription", e.target.value)}
                  placeholder="თუ ცარიელია, გამოიყენება SEO აღწერა"
                  rows={2}
                  maxLength={160}
                  className="w-full px-3 py-2 bg-background border border-blue-200 rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Turkish */}
        <div className="space-y-4">
          <h4 className="font-semibold text-foreground text-lg border-b pb-2">თურქული</h4>
          <input
            type="text"
            value={countryForm.turkish.name}
            onChange={(e) => handleInputChange("turkish", "name", e.target.value)}
            placeholder="örn: Gürcistan"
            className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div>
            <label className="block text-xs text-foreground/60 mb-1">Slug (თურქული)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={countryForm.turkish.slug}
                onChange={(e) => handleInputChange("turkish", "slug", e.target.value)}
                placeholder="otomatik"
                className="flex-1 px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => handleAutoGenerateSlug("turkish")}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm font-medium"
                title="Otomatik oluştur"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-foreground/60 mb-1">SEO სათაური</label>
            <input
              type="text"
              value={countryForm.turkish.seoTitle}
              onChange={(e) => handleInputChange("turkish", "seoTitle", e.target.value)}
              placeholder="SEO სათაური"
              maxLength={60}
              className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-between text-xs mt-1">
              <span className={countryForm.turkish.seoTitle.length > 60 ? "text-red-500" : countryForm.turkish.seoTitle.length >= 50 ? "text-green-500" : "text-foreground/40"}>
                {countryForm.turkish.seoTitle.length}/60 სიმბოლო
              </span>
              <span className="text-foreground/40">
                ოპტიმალური: 50-60
              </span>
            </div>
          </div>
          <div>
            <label className="block text-xs text-foreground/60 mb-1">SEO აღწერა</label>
            <textarea
              value={countryForm.turkish.seoDescription}
              onChange={(e) => handleInputChange("turkish", "seoDescription", e.target.value)}
              placeholder="SEO აღწერა"
              rows={3}
              maxLength={160}
              className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-between text-xs mt-1">
              <span className={countryForm.turkish.seoDescription.length > 160 ? "text-red-500" : countryForm.turkish.seoDescription.length >= 120 ? "text-green-500" : "text-foreground/40"}>
                {countryForm.turkish.seoDescription.length}/160 სიმბოლო
              </span>
              <span className="text-foreground/40">
                ოპტიმალური: 120-160
              </span>
            </div>
          </div>
          
          <div className="pt-3 mt-3 border-t border-foreground/10">
            <h5 className="text-xs font-semibold text-blue-600 mb-2">📱 Open Graph</h5>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-foreground/60 mb-1">OG სათაური</label>
                <input
                  type="text"
                  value={countryForm.turkish.ogTitle}
                  onChange={(e) => handleInputChange("turkish", "ogTitle", e.target.value)}
                  placeholder="თუ ცარიელია, გამოიყენება SEO სათაური"
                  maxLength={60}
                  className="w-full px-3 py-2 bg-background border border-blue-200 rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-foreground/60 mb-1">OG აღწერა</label>
                <textarea
                  value={countryForm.turkish.ogDescription}
                  onChange={(e) => handleInputChange("turkish", "ogDescription", e.target.value)}
                  placeholder="თუ ცარიელია, გამოიყენება SEO აღწერა"
                  rows={2}
                  maxLength={160}
                  className="w-full px-3 py-2 bg-background border border-blue-200 rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 mt-6">
        <button
          onClick={handleUpdateCountry}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              მიმდინარეობს განახლება...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              განახლება
            </>
          )}
        </button>
        <button
          onClick={onClose}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2 bg-foreground/10 hover:bg-foreground/20 text-foreground rounded-md transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          გაუქმება
        </button>
      </div>
    </div>
  );
}
