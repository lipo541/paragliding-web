"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

interface LocationTranslations {
  name: string;
  slug: string;
  seoTitle: string;
  seoDescription: string;
  ogTitle: string;
  ogDescription: string;
}

interface Location {
  id: string;
  country_id: string;
  og_image_url?: string;
  map_iframe_url?: string;
  translations: {
    georgian: LocationTranslations;
    english: LocationTranslations;
    russian: LocationTranslations;
    arabic: LocationTranslations;
    german: LocationTranslations;
    turkish: LocationTranslations;
  };
}

interface EditLocationProps {
  location: Location;
  countryName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditLocation({ location, countryName, onClose, onSuccess }: EditLocationProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [ogImage, setOgImage] = useState<File | null>(null);
  const [ogImagePreview, setOgImagePreview] = useState<string | null>(null);
  const [mapIframeUrl, setMapIframeUrl] = useState<string>("");
  const [locationForm, setLocationForm] = useState({
    georgian: { name: "", slug: "", seoTitle: "", seoDescription: "", ogTitle: "", ogDescription: "" },
    english: { name: "", slug: "", seoTitle: "", seoDescription: "", ogTitle: "", ogDescription: "" },
    russian: { name: "", slug: "", seoTitle: "", seoDescription: "", ogTitle: "", ogDescription: "" },
    arabic: { name: "", slug: "", seoTitle: "", seoDescription: "", ogTitle: "", ogDescription: "" },
    german: { name: "", slug: "", seoTitle: "", seoDescription: "", ogTitle: "", ogDescription: "" },
    turkish: { name: "", slug: "", seoTitle: "", seoDescription: "", ogTitle: "", ogDescription: "" },
  });

  const supabase = createClient();

  // Pre-fill form with location data
  useEffect(() => {
    setLocationForm({
      georgian: location.translations.georgian,
      english: location.translations.english,
      russian: location.translations.russian,
      arabic: location.translations.arabic,
      german: location.translations.german,
      turkish: location.translations.turkish,
    });

    if (location.og_image_url) {
      setOgImagePreview(location.og_image_url);
    }
    if (location.map_iframe_url) {
      setMapIframeUrl(location.map_iframe_url);
    }
  }, [location]);

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
    language: keyof typeof locationForm,
    field: keyof LocationTranslations,
    value: string
  ) => {
    setLocationForm((prev) => ({
      ...prev,
      [language]: {
        ...prev[language],
        [field]: value,
        ...(field === "name" && { slug: generateSlug(value, language) }),
      },
    }));
  };

  const handleAutoGenerateSlug = (language: keyof typeof locationForm) => {
    const name = locationForm[language].name;
    if (name) {
      setLocationForm((prev) => ({
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
    setOgImagePreview(location.og_image_url || null);
  };

  // Extract iframe src URL from the full iframe code
  const extractIframeSrc = (iframeCode: string): string | null => {
    const match = iframeCode.match(/src=["']([^"']+)["']/);
    return match ? match[1] : null;
  };

  const mapSrc = useMemo(() => {
    return extractIframeSrc(mapIframeUrl);
  }, [mapIframeUrl]);

  const handleUpdateLocation = async () => {
    try {
      setIsSaving(true);

      if (!locationForm.georgian.name || !locationForm.english.name || !locationForm.russian.name) {
        alert("ქართული, ინგლისური და რუსული სახელები სავალდებულოა");
        setIsSaving(false);
        return;
      }

      let ogImageUrl = location.og_image_url;

      // If new image uploaded
      if (ogImage) {
        // Delete old image if exists
        if (location.og_image_url) {
          const oldPath = location.og_image_url.split('/').slice(-3).join('/');
          await supabase.storage
            .from('countries-og-images')
            .remove([oldPath]);
        }

        const fileExt = ogImage.name.split('.').pop();
        const fileName = `locations/${location.id}/og-image.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('countries-og-images')
          .upload(fileName, ogImage, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          console.error('Image upload error:', uploadError);
          alert(`სურათის ატვირთვის შეცდომა: ${uploadError.message}`);
          setIsSaving(false);
          return;
        }

        if (uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from('countries-og-images')
            .getPublicUrl(fileName);
          
          ogImageUrl = publicUrl;
        }
      }

      const { error } = await supabase
        .from('locations')
        .update({
          og_image_url: ogImageUrl,
          map_iframe_url: mapIframeUrl || null,
          name_ka: locationForm.georgian.name,
          slug_ka: locationForm.georgian.slug,
          seo_title_ka: locationForm.georgian.seoTitle,
          seo_description_ka: locationForm.georgian.seoDescription,
          og_title_ka: locationForm.georgian.ogTitle,
          og_description_ka: locationForm.georgian.ogDescription,
          name_en: locationForm.english.name,
          slug_en: locationForm.english.slug,
          seo_title_en: locationForm.english.seoTitle,
          seo_description_en: locationForm.english.seoDescription,
          og_title_en: locationForm.english.ogTitle,
          og_description_en: locationForm.english.ogDescription,
          name_ru: locationForm.russian.name,
          slug_ru: locationForm.russian.slug,
          seo_title_ru: locationForm.russian.seoTitle,
          seo_description_ru: locationForm.russian.seoDescription,
          og_title_ru: locationForm.russian.ogTitle,
          og_description_ru: locationForm.russian.ogDescription,
          name_ar: locationForm.arabic.name,
          slug_ar: locationForm.arabic.slug,
          seo_title_ar: locationForm.arabic.seoTitle,
          seo_description_ar: locationForm.arabic.seoDescription,
          og_title_ar: locationForm.arabic.ogTitle,
          og_description_ar: locationForm.arabic.ogDescription,
          name_de: locationForm.german.name,
          slug_de: locationForm.german.slug,
          seo_title_de: locationForm.german.seoTitle,
          seo_description_de: locationForm.german.seoDescription,
          og_title_de: locationForm.german.ogTitle,
          og_description_de: locationForm.german.ogDescription,
          name_tr: locationForm.turkish.name,
          slug_tr: locationForm.turkish.slug,
          seo_title_tr: locationForm.turkish.seoTitle,
          seo_description_tr: locationForm.turkish.seoDescription,
          og_title_tr: locationForm.turkish.ogTitle,
          og_description_tr: locationForm.turkish.ogDescription,
        })
        .eq('id', location.id);

      if (error) {
        console.error('Database update error:', error);
        alert(`მონაცემთა ბაზაში განახლების შეცდომა: ${error.message}`);
        setIsSaving(false);
        return;
      }

      alert("ლოკაცია წარმატებით განახლდა!");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Update error:', err);
      alert(`დაფიქსირდა შეცდომა: ${err.message || 'გთხოვთ სცადოთ თავიდან'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mb-6 bg-background border-2 border-blue-600/30 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-foreground">
          ლოკაციის რედაქტირება - <span className="text-blue-600">{countryName}</span>
        </h3>
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
          Open Graph სურათი (1200x630px რეკომენდებული)
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
            {ogImage ? (
              <p className="text-sm text-blue-600 font-medium">✓ ახალი სურათი მზადაა ატვირთვისთვის</p>
            ) : (
              <p className="text-sm text-foreground/60">მიმდინარე სურათი</p>
            )}
          </div>
        )}
      </div>

      {/* Google Maps iframe URL */}
      <div className="mb-6 p-4 bg-foreground/5 rounded-lg border border-foreground/10">
        <label className="block text-sm font-semibold text-foreground mb-3">
          🗺️ Google Maps Embed URL
        </label>
        <div className="space-y-3">
          <textarea
            value={mapIframeUrl}
            onChange={(e) => setMapIframeUrl(e.target.value)}
            placeholder='<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12..." width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy"></iframe>'
            rows={4}
            className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
          <div className="text-xs text-foreground/60 space-y-1">
            <p>📍 როგორ მივიღოთ iframe URL:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>გახსენი <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Maps</a></li>
              <li>იპოვე ლოკაცია რუკაზე</li>
              <li>დააჭირე "Share" → "Embed a map"</li>
              <li>დააკოპირე მთლიანი iframe კოდი და ჩასვი აქ</li>
            </ol>
          </div>
          {mapSrc && (
            <div className="border-2 border-blue-500 rounded-lg overflow-hidden">
              <div className="bg-blue-600 text-white px-3 py-1 text-xs font-semibold">
                ✓ რუკის გადახედვა
              </div>
              <iframe
                src={mapSrc}
                width="100%"
                height="256"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full"
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Georgian */}
        <div className="space-y-4">
          <h4 className="font-semibold text-foreground text-lg border-b pb-2">ქართული *</h4>
          <input
            type="text"
            value={locationForm.georgian.name}
            onChange={(e) => handleInputChange("georgian", "name", e.target.value)}
            placeholder="მაგ: გუდაური"
            className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div>
            <label className="block text-xs text-foreground/60 mb-1">Slug (ქართული)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={locationForm.georgian.slug}
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
              value={locationForm.georgian.seoTitle}
              onChange={(e) => handleInputChange("georgian", "seoTitle", e.target.value)}
              placeholder="SEO სათაური"
              maxLength={60}
              className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-between text-xs mt-1">
              <span className={locationForm.georgian.seoTitle.length > 60 ? "text-red-500" : locationForm.georgian.seoTitle.length >= 50 ? "text-green-500" : "text-foreground/40"}>
                {locationForm.georgian.seoTitle.length}/60 სიმბოლო
              </span>
              <span className="text-foreground/40">
                ოპტიმალური: 50-60
              </span>
            </div>
          </div>
          <div>
            <label className="block text-xs text-foreground/60 mb-1">SEO Description</label>
            <textarea
              value={locationForm.georgian.seoDescription}
              onChange={(e) => handleInputChange("georgian", "seoDescription", e.target.value)}
              placeholder="SEO აღწერა"
              rows={3}
              maxLength={160}
              className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-between text-xs mt-1">
              <span className={locationForm.georgian.seoDescription.length > 160 ? "text-red-500" : locationForm.georgian.seoDescription.length >= 120 ? "text-green-500" : "text-foreground/40"}>
                {locationForm.georgian.seoDescription.length}/160 სიმბოლო
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
                  value={locationForm.georgian.ogTitle}
                  onChange={(e) => handleInputChange("georgian", "ogTitle", e.target.value)}
                  placeholder="თუ ცარიელია, გამოიყენება SEO სათაური"
                  maxLength={60}
                  className="w-full px-3 py-2 bg-background border border-blue-200 rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-foreground/60 mb-1">OG აღწერა</label>
                <textarea
                  value={locationForm.georgian.ogDescription}
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
            value={locationForm.english.name}
            onChange={(e) => handleInputChange("english", "name", e.target.value)}
            placeholder="e.g: Gudauri"
            className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div>
            <label className="block text-xs text-foreground/60 mb-1">Slug (ინგლისური)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={locationForm.english.slug}
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
              value={locationForm.english.seoTitle}
              onChange={(e) => handleInputChange("english", "seoTitle", e.target.value)}
              placeholder="SEO სათაური"
              maxLength={60}
              className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-between text-xs mt-1">
              <span className={locationForm.english.seoTitle.length > 60 ? "text-red-500" : locationForm.english.seoTitle.length >= 50 ? "text-green-500" : "text-foreground/40"}>
                {locationForm.english.seoTitle.length}/60 სიმბოლო
              </span>
              <span className="text-foreground/40">
                ოპტიმალური: 50-60
              </span>
            </div>
          </div>
          <div>
            <label className="block text-xs text-foreground/60 mb-1">SEO აღწერა</label>
            <textarea
              value={locationForm.english.seoDescription}
              onChange={(e) => handleInputChange("english", "seoDescription", e.target.value)}
              placeholder="SEO აღწერა"
              rows={3}
              maxLength={160}
              className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-between text-xs mt-1">
              <span className={locationForm.english.seoDescription.length > 160 ? "text-red-500" : locationForm.english.seoDescription.length >= 120 ? "text-green-500" : "text-foreground/40"}>
                {locationForm.english.seoDescription.length}/160 სიმბოლო
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
                  value={locationForm.english.ogTitle}
                  onChange={(e) => handleInputChange("english", "ogTitle", e.target.value)}
                  placeholder="თუ ცარიელია, გამოიყენება SEO სათაური"
                  maxLength={60}
                  className="w-full px-3 py-2 bg-background border border-blue-200 rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-foreground/60 mb-1">OG აღწერა</label>
                <textarea
                  value={locationForm.english.ogDescription}
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
            value={locationForm.russian.name}
            onChange={(e) => handleInputChange("russian", "name", e.target.value)}
            placeholder="напр: Гудаури"
            className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div>
            <label className="block text-xs text-foreground/60 mb-1">Slug (რუსული)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={locationForm.russian.slug}
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
              value={locationForm.russian.seoTitle}
              onChange={(e) => handleInputChange("russian", "seoTitle", e.target.value)}
              placeholder="SEO სათაური"
              maxLength={60}
              className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-between text-xs mt-1">
              <span className={locationForm.russian.seoTitle.length > 60 ? "text-red-500" : locationForm.russian.seoTitle.length >= 50 ? "text-green-500" : "text-foreground/40"}>
                {locationForm.russian.seoTitle.length}/60 სიმბოლო
              </span>
              <span className="text-foreground/40">
                ოპტიმალური: 50-60
              </span>
            </div>
          </div>
          <div>
            <label className="block text-xs text-foreground/60 mb-1">SEO აღწერა</label>
            <textarea
              value={locationForm.russian.seoDescription}
              onChange={(e) => handleInputChange("russian", "seoDescription", e.target.value)}
              placeholder="SEO აღწერა"
              rows={3}
              maxLength={160}
              className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-between text-xs mt-1">
              <span className={locationForm.russian.seoDescription.length > 160 ? "text-red-500" : locationForm.russian.seoDescription.length >= 120 ? "text-green-500" : "text-foreground/40"}>
                {locationForm.russian.seoDescription.length}/160 სიმბოლო
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
                  value={locationForm.russian.ogTitle}
                  onChange={(e) => handleInputChange("russian", "ogTitle", e.target.value)}
                  placeholder="თუ ცარიელია, გამოიყენება SEO სათაური"
                  maxLength={60}
                  className="w-full px-3 py-2 bg-background border border-blue-200 rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-foreground/60 mb-1">OG აღწერა</label>
                <textarea
                  value={locationForm.russian.ogDescription}
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
            value={locationForm.arabic.name}
            onChange={(e) => handleInputChange("arabic", "name", e.target.value)}
            placeholder="مثال: جودوري"
            dir="rtl"
            className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div>
            <label className="block text-xs text-foreground/60 mb-1">Slug (არაბული)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={locationForm.arabic.slug}
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
              value={locationForm.arabic.seoTitle}
              onChange={(e) => handleInputChange("arabic", "seoTitle", e.target.value)}
              placeholder="SEO სათაური"
              dir="rtl"
              maxLength={60}
              className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-between text-xs mt-1">
              <span className={locationForm.arabic.seoTitle.length > 60 ? "text-red-500" : locationForm.arabic.seoTitle.length >= 50 ? "text-green-500" : "text-foreground/40"}>
                {locationForm.arabic.seoTitle.length}/60 სიმბოლო
              </span>
              <span className="text-foreground/40">
                ოპტიმალური: 50-60
              </span>
            </div>
          </div>
          <div>
            <label className="block text-xs text-foreground/60 mb-1">SEO აღწერა</label>
            <textarea
              value={locationForm.arabic.seoDescription}
              onChange={(e) => handleInputChange("arabic", "seoDescription", e.target.value)}
              placeholder="SEO აღწერა"
              dir="rtl"
              rows={3}
              maxLength={160}
              className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-between text-xs mt-1">
              <span className={locationForm.arabic.seoDescription.length > 160 ? "text-red-500" : locationForm.arabic.seoDescription.length >= 120 ? "text-green-500" : "text-foreground/40"}>
                {locationForm.arabic.seoDescription.length}/160 სიმბოლო
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
                  value={locationForm.arabic.ogTitle}
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
                  value={locationForm.arabic.ogDescription}
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
            value={locationForm.german.name}
            onChange={(e) => handleInputChange("german", "name", e.target.value)}
            placeholder="z.B: Gudauri"
            className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div>
            <label className="block text-xs text-foreground/60 mb-1">Slug (გერმანული)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={locationForm.german.slug}
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
              value={locationForm.german.seoTitle}
              onChange={(e) => handleInputChange("german", "seoTitle", e.target.value)}
              placeholder="SEO სათაური"
              maxLength={60}
              className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-between text-xs mt-1">
              <span className={locationForm.german.seoTitle.length > 60 ? "text-red-500" : locationForm.german.seoTitle.length >= 50 ? "text-green-500" : "text-foreground/40"}>
                {locationForm.german.seoTitle.length}/60 სიმბოლო
              </span>
              <span className="text-foreground/40">
                ოპტიმალური: 50-60
              </span>
            </div>
          </div>
          <div>
            <label className="block text-xs text-foreground/60 mb-1">SEO აღწერა</label>
            <textarea
              value={locationForm.german.seoDescription}
              onChange={(e) => handleInputChange("german", "seoDescription", e.target.value)}
              placeholder="SEO აღწერა"
              rows={3}
              maxLength={160}
              className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-between text-xs mt-1">
              <span className={locationForm.german.seoDescription.length > 160 ? "text-red-500" : locationForm.german.seoDescription.length >= 120 ? "text-green-500" : "text-foreground/40"}>
                {locationForm.german.seoDescription.length}/160 სიმბოლო
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
                  value={locationForm.german.ogTitle}
                  onChange={(e) => handleInputChange("german", "ogTitle", e.target.value)}
                  placeholder="თუ ცარიელია, გამოიყენება SEO სათაური"
                  maxLength={60}
                  className="w-full px-3 py-2 bg-background border border-blue-200 rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-foreground/60 mb-1">OG აღწერა</label>
                <textarea
                  value={locationForm.german.ogDescription}
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
            value={locationForm.turkish.name}
            onChange={(e) => handleInputChange("turkish", "name", e.target.value)}
            placeholder="örn: Gudauri"
            className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div>
            <label className="block text-xs text-foreground/60 mb-1">Slug (თურქული)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={locationForm.turkish.slug}
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
              value={locationForm.turkish.seoTitle}
              onChange={(e) => handleInputChange("turkish", "seoTitle", e.target.value)}
              placeholder="SEO სათაური"
              maxLength={60}
              className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-between text-xs mt-1">
              <span className={locationForm.turkish.seoTitle.length > 60 ? "text-red-500" : locationForm.turkish.seoTitle.length >= 50 ? "text-green-500" : "text-foreground/40"}>
                {locationForm.turkish.seoTitle.length}/60 სიმბოლო
              </span>
              <span className="text-foreground/40">
                ოპტიმალური: 50-60
              </span>
            </div>
          </div>
          <div>
            <label className="block text-xs text-foreground/60 mb-1">SEO აღწერა</label>
            <textarea
              value={locationForm.turkish.seoDescription}
              onChange={(e) => handleInputChange("turkish", "seoDescription", e.target.value)}
              placeholder="SEO აღწერა"
              rows={3}
              maxLength={160}
              className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-between text-xs mt-1">
              <span className={locationForm.turkish.seoDescription.length > 160 ? "text-red-500" : locationForm.turkish.seoDescription.length >= 120 ? "text-green-500" : "text-foreground/40"}>
                {locationForm.turkish.seoDescription.length}/160 სიმბოლო
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
                  value={locationForm.turkish.ogTitle}
                  onChange={(e) => handleInputChange("turkish", "ogTitle", e.target.value)}
                  placeholder="თუ ცარიელია, გამოიყენება SEO სათაური"
                  maxLength={60}
                  className="w-full px-3 py-2 bg-background border border-blue-200 rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-foreground/60 mb-1">OG აღწერა</label>
                <textarea
                  value={locationForm.turkish.ogDescription}
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
          onClick={handleUpdateLocation}
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
