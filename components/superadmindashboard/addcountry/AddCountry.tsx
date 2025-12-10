"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import EditCountry from "./EditCountry";
import AddLocation from "./AddLocation";
import EditLocation from "./EditLocation";
import ConfirmDialog from "./ConfirmDialog";

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
  locations: Location[];
  isExpanded: boolean;
}

interface Location {
  id: string;
  country_id: string;
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

export default function AddCountry() {
  const [isAddingCountry, setIsAddingCountry] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [addingLocationForCountry, setAddingLocationForCountry] = useState<Country | null>(null);
  const [editingLocation, setEditingLocation] = useState<{ location: Location; countryName: string } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    details?: string[];
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [ogImage, setOgImage] = useState<File | null>(null);
  const [ogImagePreview, setOgImagePreview] = useState<string | null>(null);
  const [countryForm, setCountryForm] = useState({
    georgian: { name: "", slug: "", seoTitle: "", seoDescription: "", ogTitle: "", ogDescription: "" },
    english: { name: "", slug: "", seoTitle: "", seoDescription: "", ogTitle: "", ogDescription: "" },
    russian: { name: "", slug: "", seoTitle: "", seoDescription: "", ogTitle: "", ogDescription: "" },
    arabic: { name: "", slug: "", seoTitle: "", seoDescription: "", ogTitle: "", ogDescription: "" },
    german: { name: "", slug: "", seoTitle: "", seoDescription: "", ogTitle: "", ogDescription: "" },
    turkish: { name: "", slug: "", seoTitle: "", seoDescription: "", ogTitle: "", ogDescription: "" },
  });

  const supabase = createClient();

  // ქვეყნების ჩატვირთვა მონაცემთა ბაზიდან
  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    try {
      setIsLoading(true);
      
      // Fetch countries
      const { data: countriesData, error: countriesError } = await supabase
        .from('countries')
        .select('*')
        .order('created_at', { ascending: false });

      if (countriesError) throw countriesError;

      if (countriesData) {
        // Fetch all locations
        const { data: locationsData, error: locationsError } = await supabase
          .from('locations')
          .select('*')
          .order('created_at', { ascending: false });

        if (locationsError) throw locationsError;

        // Transform database format to UI format
        const transformedCountries: Country[] = countriesData.map((country: any) => {
          // Find locations for this country
          const countryLocations = (locationsData || [])
            .filter((loc: any) => loc.country_id === country.id)
            .map((location: any) => ({
              id: location.id,
              country_id: location.country_id,
              og_image_url: location.og_image_url,
              map_iframe_url: location.map_iframe_url,
              altitude: location.altitude,
              best_season_start: location.best_season_start,
              best_season_end: location.best_season_end,
              difficulty_level: location.difficulty_level,
              translations: {
                georgian: {
                  name: location.name_ka || '',
                  slug: location.slug_ka || '',
                  seoTitle: location.seo_title_ka || '',
                  seoDescription: location.seo_description_ka || '',
                  ogTitle: location.og_title_ka || '',
                  ogDescription: location.og_description_ka || ''
                },
                english: {
                  name: location.name_en || '',
                  slug: location.slug_en || '',
                  seoTitle: location.seo_title_en || '',
                  seoDescription: location.seo_description_en || '',
                  ogTitle: location.og_title_en || '',
                  ogDescription: location.og_description_en || ''
                },
                russian: {
                  name: location.name_ru || '',
                  slug: location.slug_ru || '',
                  seoTitle: location.seo_title_ru || '',
                  seoDescription: location.seo_description_ru || '',
                  ogTitle: location.og_title_ru || '',
                  ogDescription: location.og_description_ru || ''
                },
                arabic: {
                  name: location.name_ar || '',
                  slug: location.slug_ar || '',
                  seoTitle: location.seo_title_ar || '',
                  seoDescription: location.seo_description_ar || '',
                  ogTitle: location.og_title_ar || '',
                  ogDescription: location.og_description_ar || ''
                },
                german: {
                  name: location.name_de || '',
                  slug: location.slug_de || '',
                  seoTitle: location.seo_title_de || '',
                  seoDescription: location.seo_description_de || '',
                  ogTitle: location.og_title_de || '',
                  ogDescription: location.og_description_de || ''
                },
                turkish: {
                  name: location.name_tr || '',
                  slug: location.slug_tr || '',
                  seoTitle: location.seo_title_tr || '',
                  seoDescription: location.seo_description_tr || '',
                  ogTitle: location.og_title_tr || '',
                  ogDescription: location.og_description_tr || ''
                }
              }
            }));

          return {
            id: country.id,
            og_image_url: country.og_image_url,
            translations: {
              georgian: {
                name: country.name_ka || '',
                slug: country.slug_ka || '',
                seoTitle: country.seo_title_ka || '',
                seoDescription: country.seo_description_ka || '',
                ogTitle: country.og_title_ka || '',
                ogDescription: country.og_description_ka || ''
              },
              english: {
                name: country.name_en || '',
                slug: country.slug_en || '',
                seoTitle: country.seo_title_en || '',
                seoDescription: country.seo_description_en || '',
                ogTitle: country.og_title_en || '',
                ogDescription: country.og_description_en || ''
              },
              russian: {
                name: country.name_ru || '',
                slug: country.slug_ru || '',
                seoTitle: country.seo_title_ru || '',
                seoDescription: country.seo_description_ru || '',
                ogTitle: country.og_title_ru || '',
                ogDescription: country.og_description_ru || ''
              },
              arabic: {
                name: country.name_ar || '',
                slug: country.slug_ar || '',
                seoTitle: country.seo_title_ar || '',
                seoDescription: country.seo_description_ar || '',
                ogTitle: country.og_title_ar || '',
                ogDescription: country.og_description_ar || ''
              },
              german: {
                name: country.name_de || '',
                slug: country.slug_de || '',
                seoTitle: country.seo_title_de || '',
                seoDescription: country.seo_description_de || '',
                ogTitle: country.og_title_de || '',
                ogDescription: country.og_description_de || ''
              },
              turkish: {
                name: country.name_tr || '',
                slug: country.slug_tr || '',
                seoTitle: country.seo_title_tr || '',
                seoDescription: country.seo_description_tr || '',
                ogTitle: country.og_title_tr || '',
                ogDescription: country.og_description_tr || ''
              }
            },
            locations: countryLocations,
            isExpanded: false
          };
        });
        
        setCountries(transformedCountries);
      }
    } catch (error) {
      console.error('ქვეყნების ჩატვირთვის შეცდომა:', error);
      alert('ქვეყნების ჩატვირთვისას მოხდა შეცდომა');
    } finally {
      setIsLoading(false);
    }
  };

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
    
    // Add language prefix
    if (language) {
      const prefixes: { [key: string]: string } = {
        'georgian': 'ka',
        'english': 'en',
        'russian': 'ru',
        'arabic': 'ar',
        'german': 'de',
        'turkish': 'tr'
      };
      const prefix = prefixes[language] || '';
      return prefix ? `${prefix}-${slug}` : slug;
    }
    
    return slug;
  };

  const handleInputChange = (
    language: keyof typeof countryForm,
    field: keyof CountryTranslations,
    value: string
  ) => {
    if (field === 'name') {
      // Auto-generate slug when name changes
      const autoSlug = generateSlug(value, language);
      setCountryForm((prev) => ({
        ...prev,
        [language]: { ...prev[language], name: value, slug: autoSlug },
      }));
    } else {
      setCountryForm((prev) => ({
        ...prev,
        [language]: { ...prev[language], [field]: value },
      }));
    }
  };

  const handleAutoGenerateSlug = (language: keyof typeof countryForm) => {
    const name = countryForm[language].name;
    if (name) {
      const autoSlug = generateSlug(name, language);
      setCountryForm((prev) => ({
        ...prev,
        [language]: { ...prev[language], slug: autoSlug },
      }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('გთხოვთ ატვირთოთ მხოლოდ სურათი!');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('სურათის ზომა არ უნდა აღემატებოდეს 5MB-ს!');
        return;
      }

      setOgImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setOgImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setOgImage(null);
    setOgImagePreview(null);
  };

  const handleSaveCountry = async () => {
    // ვალიდაცია - სავალდებულო ველები
    if (!countryForm.georgian.name || !countryForm.english.name || !countryForm.russian.name) {
      alert("გთხოვთ შეავსოთ ქვეყნის სახელი ქართულად, ინგლისურად და რუსულად!");
      return;
    }

    if (!ogImage) {
      alert("გთხოვთ ატვირთოთ OG სურათი!");
      return;
    }

    setIsSaving(true);

    try {
      // 1. ჯერ ვამატებთ ქვეყანას რომ მივიღოთ ID
      const { data, error } = await supabase
        .from('countries')
        .insert([
          {
            name_ka: countryForm.georgian.name,
            slug_ka: countryForm.georgian.slug,
            seo_title_ka: countryForm.georgian.seoTitle,
            seo_description_ka: countryForm.georgian.seoDescription,
            og_title_ka: countryForm.georgian.ogTitle || countryForm.georgian.seoTitle,
            og_description_ka: countryForm.georgian.ogDescription || countryForm.georgian.seoDescription,
            
            name_en: countryForm.english.name,
            slug_en: countryForm.english.slug,
            seo_title_en: countryForm.english.seoTitle,
            seo_description_en: countryForm.english.seoDescription,
            og_title_en: countryForm.english.ogTitle || countryForm.english.seoTitle,
            og_description_en: countryForm.english.ogDescription || countryForm.english.seoDescription,
            
            name_ru: countryForm.russian.name,
            slug_ru: countryForm.russian.slug,
            seo_title_ru: countryForm.russian.seoTitle,
            seo_description_ru: countryForm.russian.seoDescription,
            og_title_ru: countryForm.russian.ogTitle || countryForm.russian.seoTitle,
            og_description_ru: countryForm.russian.ogDescription || countryForm.russian.seoDescription,
            
            name_ar: countryForm.arabic.name || null,
            slug_ar: countryForm.arabic.slug || null,
            seo_title_ar: countryForm.arabic.seoTitle || null,
            seo_description_ar: countryForm.arabic.seoDescription || null,
            og_title_ar: countryForm.arabic.ogTitle || countryForm.arabic.seoTitle || null,
            og_description_ar: countryForm.arabic.ogDescription || countryForm.arabic.seoDescription || null,
            
            name_de: countryForm.german.name || null,
            slug_de: countryForm.german.slug || null,
            seo_title_de: countryForm.german.seoTitle || null,
            seo_description_de: countryForm.german.seoDescription || null,
            og_title_de: countryForm.german.ogTitle || countryForm.german.seoTitle || null,
            og_description_de: countryForm.german.ogDescription || countryForm.german.seoDescription || null,
            
            name_tr: countryForm.turkish.name || null,
            slug_tr: countryForm.turkish.slug || null,
            seo_title_tr: countryForm.turkish.seoTitle || null,
            seo_description_tr: countryForm.turkish.seoDescription || null,
            og_title_tr: countryForm.turkish.ogTitle || countryForm.turkish.seoTitle || null,
            og_description_tr: countryForm.turkish.ogDescription || countryForm.turkish.seoDescription || null,
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error saving country:', error);
        alert(`შეცდომა: ${error.message}`);
        return;
      }

      const countryId = data.id;
      let ogImageUrl = null;

      // 2. ვატვირთავთ სურათს Storage-ში
      if (ogImage) {
        const fileExt = ogImage.name.split('.').pop();
        const fileName = `${countryId}/og-image.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('countries-og-images')
          .upload(fileName, ogImage, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          // ვაგრძელებთ მაინც, სურათის გარეშე
        } else {
          // მივიღებთ public URL-ს
          const { data: { publicUrl } } = supabase.storage
            .from('countries-og-images')
            .getPublicUrl(fileName);
          
          ogImageUrl = publicUrl;

          // 3. ვაახლებთ country record-ს og_image_url-ით
          await supabase
            .from('countries')
            .update({ og_image_url: ogImageUrl })
            .eq('id', countryId);
        }
      }

      // წარმატებით შენახვის შემდეგ
      // Reload countries from database
      await fetchCountries();
      
      setIsAddingCountry(false);
      
      // ფორმის გასუფთავება
      setCountryForm({
        georgian: { name: "", slug: "", seoTitle: "", seoDescription: "", ogTitle: "", ogDescription: "" },
        english: { name: "", slug: "", seoTitle: "", seoDescription: "", ogTitle: "", ogDescription: "" },
        russian: { name: "", slug: "", seoTitle: "", seoDescription: "", ogTitle: "", ogDescription: "" },
        arabic: { name: "", slug: "", seoTitle: "", seoDescription: "", ogTitle: "", ogDescription: "" },
        german: { name: "", slug: "", seoTitle: "", seoDescription: "", ogTitle: "", ogDescription: "" },
        turkish: { name: "", slug: "", seoTitle: "", seoDescription: "", ogTitle: "", ogDescription: "" },
      });
      setOgImage(null);
      setOgImagePreview(null);

      alert("ქვეყანა წარმატებით დაემატა!");
    } catch (err) {
      console.error('Unexpected error:', err);
      alert("დაფიქსირდა შეცდომა. გთხოვთ სცადოთ თავიდან.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleCountry = (countryId: string) => {
    setCountries((prev) =>
      prev.map((c) =>
        c.id === countryId ? { ...c, isExpanded: !c.isExpanded } : c
      )
    );
  };

  const deleteCountry = async (countryId: string) => {
    const country = countries.find(c => c.id === countryId);
    if (!country) return;

    setConfirmDialog({
      isOpen: true,
      title: 'ქვეყნის წაშლა',
      message: `დარწმუნებული ხართ რომ გსურთ "${country.translations.georgian.name}" ქვეყნის წაშლა?`,
      details: [
        `ქვეყანას და მის სურათს`,
        `ყველა ლოკაციას (${country.locations.length} ცალი) და მათ სურათებს`
      ],
      onConfirm: async () => {
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        
        try {
          console.log('=== Deleting Country ===');
          console.log('Country ID:', countryId);
          console.log('Country Name:', country.translations.georgian.name);
          console.log('Locations to delete:', country.locations.length);

          // 1. Delete all location images from storage
          for (const location of country.locations) {
            if (location.og_image_url) {
              try {
                const locationPath = `locations/${location.id}/`;
                console.log('Deleting location images from path:', locationPath);
                
                const { data: files } = await supabase.storage
                  .from('countries-og-images')
                  .list(`locations/${location.id}`);
                
                if (files && files.length > 0) {
                  const filePaths = files.map((file: any) => `locations/${location.id}/${file.name}`);
                  await supabase.storage
                    .from('countries-og-images')
                    .remove(filePaths);
                  console.log('Deleted location images:', filePaths);
                }
              } catch (err) {
                console.error('Error deleting location image:', err);
              }
            }
          }

          // 2. Delete country image from storage
          if (country.og_image_url) {
            try {
              const countryPath = `countries/${countryId}/`;
              console.log('Deleting country images from path:', countryPath);
              
              const { data: files } = await supabase.storage
                .from('countries-og-images')
                .list(`countries/${countryId}`);
              
              if (files && files.length > 0) {
                const filePaths = files.map((file: any) => `countries/${countryId}/${file.name}`);
                await supabase.storage
                  .from('countries-og-images')
                  .remove(filePaths);
                console.log('Deleted country images:', filePaths);
              }
            } catch (err) {
              console.error('Error deleting country image:', err);
            }
          }

          // 3. Delete country from database
          console.log('Deleting country from database...');
          const { error } = await supabase
            .from('countries')
            .delete()
            .eq('id', countryId);

          if (error) throw error;

          console.log('Country deleted successfully!');
          alert('ქვეყანა და ყველა ლოკაცია წარმატებით წაიშალა!');
          fetchCountries();
        } catch (err: any) {
          console.error('Delete error:', err);
          alert(`წაშლის შეცდომა: ${err.message || 'გთხოვთ სცადოთ თავიდან'}`);
        }
      }
    });
  };

  const deleteLocation = async (location: Location, countryName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'ლოკაციის წაშლა',
      message: `დარწმუნებული ხართ რომ გსურთ "${location.translations.georgian.name}" ლოკაციის წაშლა?`,
      details: [
        `ქვეყანა: ${countryName}`,
        `ლოკაციას და მის სურათს`
      ],
      onConfirm: async () => {
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        
        try {
          console.log('=== Deleting Location ===');
          console.log('Location ID:', location.id);
          console.log('Location Name:', location.translations.georgian.name);

          // 1. Delete location image from storage if exists
          if (location.og_image_url) {
            try {
              const locationPath = `locations/${location.id}/`;
              console.log('Deleting location images from path:', locationPath);
              
              const { data: files } = await supabase.storage
                .from('countries-og-images')
                .list(`locations/${location.id}`);
              
              if (files && files.length > 0) {
                const filePaths = files.map((file: any) => `locations/${location.id}/${file.name}`);
                await supabase.storage
                  .from('countries-og-images')
                  .remove(filePaths);
                console.log('Deleted location images:', filePaths);
              }
            } catch (err) {
              console.error('Error deleting location image:', err);
            }
          }

          // 2. Delete location from database
          console.log('Deleting location from database...');
          const { error } = await supabase
            .from('locations')
            .delete()
            .eq('id', location.id);

          if (error) throw error;

          console.log('Location deleted successfully!');
          alert('ლოკაცია წარმატებით წაიშალა!');
          fetchCountries();
        } catch (err: any) {
          console.error('Delete error:', err);
          alert(`წაშლის შეცდომა: ${err.message || 'გთხოვთ სცადოთ თავიდან'}`);
        }
      }
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-foreground/10">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-1">არსებული კატეგორიები</h2>
          <p className="text-sm text-foreground/60">ქვეყნების და ლოკაციების მართვა</p>
        </div>
        <button
          onClick={() => setIsAddingCountry(!isAddingCountry)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg transition-all font-medium shadow-lg shadow-green-600/20 hover:shadow-xl hover:shadow-green-600/30"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          შექმენი კატეგორია
        </button>
      </div>

      {/* ჩატვირთვის ინდიკატორი */}
      {isLoading && (
        <div className="text-center py-8 text-foreground/60">
          იტვირთება...
        </div>
      )}

      {/* ცარიელი სია */}
      {!isLoading && countries.length === 0 && !isAddingCountry && (
        <p className="text-foreground/60 text-center py-8">ქვეყნები ჯერ არ არის დამატებული. დააჭირე ღილაკს დასამატებლად.</p>
      )}

      {/* Add Country Form */}
      {isAddingCountry && (
        <div className="mb-6 bg-background border-2 border-green-600/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-foreground">ახალი ქვეყნის დამატება</h3>
            <button
              onClick={() => {
                setIsAddingCountry(false);
                setOgImage(null);
                setOgImagePreview(null);
                setCountryForm({
                  georgian: { name: "", slug: "", seoTitle: "", seoDescription: "", ogTitle: "", ogDescription: "" },
                  english: { name: "", slug: "", seoTitle: "", seoDescription: "", ogTitle: "", ogDescription: "" },
                  russian: { name: "", slug: "", seoTitle: "", seoDescription: "", ogTitle: "", ogDescription: "" },
                  arabic: { name: "", slug: "", seoTitle: "", seoDescription: "", ogTitle: "", ogDescription: "" },
                  german: { name: "", slug: "", seoTitle: "", seoDescription: "", ogTitle: "", ogDescription: "" },
                  turkish: { name: "", slug: "", seoTitle: "", seoDescription: "", ogTitle: "", ogDescription: "" },
                });
              }}
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
                    className="max-w-md h-auto rounded-lg border-2 border-green-500"
                  />
                  <button
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
                    type="button"
                    aria-label="Remove image"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-green-600 font-medium">✓ სურათი მზადაა ატვირთვისთვის</p>
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
                className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <div>
                <label className="block text-xs text-foreground/60 mb-1">Slug (ქართული)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={countryForm.georgian.slug}
                    onChange={(e) => handleInputChange("georgian", "slug", e.target.value)}
                    placeholder="ავტომატურად გენერირდება"
                    className="flex-1 px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
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
              
              {/* OG Fields for Georgian */}
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
                className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <div>
                <label className="block text-xs text-foreground/60 mb-1">Slug (ინგლისური)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={countryForm.english.slug}
                    onChange={(e) => handleInputChange("english", "slug", e.target.value)}
                    placeholder="auto-generated"
                    className="flex-1 px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
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
              
              {/* OG Fields for English */}
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
                className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <div>
                <label className="block text-xs text-foreground/60 mb-1">Slug (რუსული)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={countryForm.russian.slug}
                    onChange={(e) => handleInputChange("russian", "slug", e.target.value)}
                    placeholder="автоматически"
                    className="flex-1 px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
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
              
              {/* OG Fields for Russian */}
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
                className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
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
                    className="flex-1 px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
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
              
              {/* OG Fields for Arabic */}
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
                className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <div>
                <label className="block text-xs text-foreground/60 mb-1">Slug (გერმანული)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={countryForm.german.slug}
                    onChange={(e) => handleInputChange("german", "slug", e.target.value)}
                    placeholder="automatisch"
                    className="flex-1 px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
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
              
              {/* OG Fields for German */}
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
                className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <div>
                <label className="block text-xs text-foreground/60 mb-1">Slug (თურქული)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={countryForm.turkish.slug}
                    onChange={(e) => handleInputChange("turkish", "slug", e.target.value)}
                    placeholder="otomatik"
                    className="flex-1 px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
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
              
              {/* OG Fields for Turkish */}
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
              onClick={handleSaveCountry}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  მიმდინარეობს შენახვა...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  შენახვა
                </>
              )}
            </button>
            <button
              onClick={() => setIsAddingCountry(false)}
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
      )}

      {/* Countries List */}
      <div className="space-y-3">
        {countries.map((country) => (
          <div key={country.id} className="border border-foreground/10 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-background">
            {/* Country Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-foreground/5 to-foreground/[0.02] hover:from-foreground/10 hover:to-foreground/5 transition-all">
              <button
                onClick={() => toggleCountry(country.id)}
                className="flex items-center gap-3 flex-1 text-left group"
              >
                <div className="p-1.5 rounded-lg bg-foreground/5 group-hover:bg-foreground/10 transition-colors">
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${country.isExpanded ? "rotate-90" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground text-base">
                    {country.translations.georgian.name}
                  </span>
                  <span className="text-foreground/40 text-sm">•</span>
                  <span className="text-foreground/70 text-sm">
                    {country.translations.english.name}
                  </span>
                  <span className="text-foreground/40 text-sm">•</span>
                  <span className="text-foreground/70 text-sm">
                    {country.translations.russian.name}
                  </span>
                  {country.locations.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-600/10 text-blue-600 text-xs font-medium rounded-full">
                      {country.locations.length} ლოკაცია
                    </span>
                  )}
                </div>
              </button>

              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setEditingCountry(country)}
                  className="p-2 text-blue-600 hover:bg-blue-600/10 rounded-lg transition-all hover:scale-105" 
                  title="რედაქტირება"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button 
                  onClick={() => setAddingLocationForCountry(country)}
                  className="p-2 text-green-600 hover:bg-green-600/10 rounded-lg transition-all hover:scale-105" 
                  title="ლოკაციის დამატება"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                <button
                  onClick={() => deleteCountry(country.id)}
                  className="p-2 text-red-600 hover:bg-red-600/10 rounded-lg transition-all hover:scale-105"
                  title="წაშლა"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Edit Country Form - Shows below the country being edited */}
            {editingCountry && editingCountry.id === country.id && (
              <div className="border-t-2 border-blue-600">
                <EditCountry
                  country={editingCountry}
                  onClose={() => setEditingCountry(null)}
                  onSuccess={fetchCountries}
                />
              </div>
            )}

            {/* Add Location Form - Shows below the country when adding location */}
            {addingLocationForCountry && addingLocationForCountry.id === country.id && (
              <div className="border-t-2 border-green-600">
                <AddLocation
                  countryId={addingLocationForCountry.id}
                  countryName={addingLocationForCountry.translations.georgian.name}
                  onClose={() => setAddingLocationForCountry(null)}
                  onSuccess={fetchCountries}
                />
              </div>
            )}

            {/* Locations (when expanded) */}
            {country.isExpanded && (
              <div className="px-4 py-3 bg-gradient-to-b from-foreground/[0.02] to-background">
                {country.locations.length === 0 ? (
                  <div className="text-center py-6">
                    <svg className="w-12 h-12 mx-auto text-foreground/20 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-foreground/40 text-sm italic">ამ ქვეყანას ჯერ არ აქვს დამატებული ლოკაციები</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {country.locations.map((location) => (
                      <div key={location.id}>
                        <div className="flex items-center justify-between p-2.5 bg-foreground/5 hover:bg-foreground/10 rounded-lg transition-all group border border-transparent hover:border-foreground/10">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <svg className="w-4 h-4 text-foreground/40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <div className="flex items-center gap-2 flex-wrap text-sm min-w-0">
                              <span className="font-medium text-foreground">
                                {location.translations.georgian.name}
                              </span>
                              <span className="text-foreground/30">•</span>
                              <span className="text-foreground/60 text-xs">
                                {location.translations.english.name}
                              </span>
                              <span className="text-foreground/30">•</span>
                              <span className="text-foreground/60 text-xs">
                                {location.translations.russian.name}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => setEditingLocation({ location, countryName: country.translations.georgian.name })}
                              className="p-1.5 text-blue-600 hover:bg-blue-600/10 rounded-md transition-all hover:scale-110"
                              title="რედაქტირება"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button 
                              onClick={() => deleteLocation(location, country.translations.georgian.name)}
                              className="p-1.5 text-red-600 hover:bg-red-600/10 rounded-md transition-all hover:scale-110" 
                              title="წაშლა"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Edit Location Form - Shows below the location being edited */}
                        {editingLocation && editingLocation.location.id === location.id && (
                          <div className="mt-2 border-t-2 border-blue-600">
                            <EditLocation
                              location={editingLocation.location}
                              countryName={editingLocation.countryName}
                              onClose={() => setEditingLocation(null)}
                              onSuccess={fetchCountries}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        details={confirmDialog.details}
        confirmText="წაშლა"
        cancelText="გაუქმება"
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
        isDangerous={true}
      />
    </div>
  );
}
