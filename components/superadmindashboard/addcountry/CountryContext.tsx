"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

type Language = 'ka' | 'en' | 'ru' | 'ar' | 'de' | 'tr';

interface Country {
  id: string;
  name_ka: string;
  name_en: string;
  name_ru: string;
  name_ar: string;
  name_de: string;
  name_tr: string;
  slug_ka: string;
  slug_en: string;
}

interface SharedImage {
  url: string;
  alt_ka: string;
  alt_en: string;
  alt_ru: string;
  alt_ar: string;
  alt_de: string;
  alt_tr: string;
}

interface SharedImages {
  hero_image: SharedImage | null;
  gallery: SharedImage[];
}

interface SharedVideos {
  videoUrls: string[];
}

interface LanguageContent {
  h1_tag: string;
  p_tag: string;
  h2_history: string;
  history_text: string;
  gallery_description: string;
}

interface PendingImages {
  heroImage: { 
    file: File; 
    alt_ka: string;
    alt_en: string;
    alt_ru: string;
    alt_ar: string;
    alt_de: string;
    alt_tr: string;
  } | null;
  galleryImages: { 
    file: File; 
    alt_ka: string;
    alt_en: string;
    alt_ru: string;
    alt_ar: string;
    alt_de: string;
    alt_tr: string;
  }[];
}

interface ImagePreviews {
  heroPreview: string | null;
  galleryPreviews: { preview: string; alt: string }[];
}

interface CountryContextType {
  activeLanguage: Language;
  setActiveLanguage: (lang: Language) => void;
  countries: Country[];
  isLoading: boolean;
  selectedCountryId: string | null;
  setSelectedCountryId: (id: string | null) => void;
  isEditMode: boolean;
  sharedImages: SharedImages;
  setSharedImages: (images: SharedImages) => void;
  sharedVideos: SharedVideos;
  setSharedVideos: (videos: SharedVideos) => void;
  pendingImages: PendingImages;
  setPendingImages: (images: PendingImages) => void;
  imagePreviews: ImagePreviews;
  setImagePreviews: (previews: ImagePreviews) => void;
  languageContent: Record<Language, LanguageContent>;
  updateLanguageContent: (lang: Language, content: Partial<LanguageContent>) => void;
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;
  getCountryName: (country: Country) => string;
  getSelectedCountry: () => Country | undefined;
  loadCountryForEdit: (countryId: string) => Promise<void>;
  saveAllLanguages: () => Promise<void>;
  resetAllFields: () => void;
}

const CountryContext = createContext<CountryContextType | undefined>(undefined);

const createEmptyLanguageContent = (): LanguageContent => ({
  h1_tag: "",
  p_tag: "",
  h2_history: "",
  history_text: "",
  gallery_description: ""
});

export function CountryProvider({ children }: { children: ReactNode }) {
  const [activeLanguage, setActiveLanguage] = useState<Language>('ka');
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [sharedImages, setSharedImages] = useState<SharedImages>({
    hero_image: null,
    gallery: []
  });

  const [sharedVideos, setSharedVideos] = useState<SharedVideos>({
    videoUrls: []
  });

  const [pendingImages, setPendingImages] = useState<PendingImages>({
    heroImage: null,
    galleryImages: []
  });

  const [imagePreviews, setImagePreviews] = useState<ImagePreviews>({
    heroPreview: null,
    galleryPreviews: []
  });

  const [languageContent, setLanguageContent] = useState<Record<Language, LanguageContent>>({
    ka: createEmptyLanguageContent(),
    en: createEmptyLanguageContent(),
    ru: createEmptyLanguageContent(),
    ar: createEmptyLanguageContent(),
    de: createEmptyLanguageContent(),
    tr: createEmptyLanguageContent()
  });

  const supabase = createClient();

  useEffect(() => {
    fetchCountries();
  }, []);

  useEffect(() => {
    const checkAndLoadExistingCountry = async () => {
      if (!selectedCountryId) {
        setIsEditMode(false);
        setSharedImages({ hero_image: null, gallery: [] });
        setSharedVideos({ videoUrls: [] });
        setPendingImages({ heroImage: null, galleryImages: [] });
        setImagePreviews({ heroPreview: null, galleryPreviews: [] });
        setLanguageContent({
          ka: createEmptyLanguageContent(),
          en: createEmptyLanguageContent(),
          ru: createEmptyLanguageContent(),
          ar: createEmptyLanguageContent(),
          de: createEmptyLanguageContent(),
          tr: createEmptyLanguageContent()
        });
        return;
      }

      try {
        const { data: existingCountry, error } = await supabase
          .from('countries')
          .select('id, content')
          .eq('id', selectedCountryId)
          .single();

        if (!error && existingCountry?.content) {
          console.log("ქვეყანა უკვე არსებობს, ჩატვირთვა რედაქტირებისთვის...");
          setIsEditMode(true);
          await loadCountryForEdit(existingCountry.id);
        } else {
          console.log("ახალი ქვეყანის კონტენტი");
          setIsEditMode(false);
          setSharedImages({ hero_image: null, gallery: [] });
          setPendingImages({ heroImage: null, galleryImages: [] });
          setImagePreviews({ heroPreview: null, galleryPreviews: [] });
          setLanguageContent({
            ka: createEmptyLanguageContent(),
            en: createEmptyLanguageContent(),
            ru: createEmptyLanguageContent(),
            ar: createEmptyLanguageContent(),
            de: createEmptyLanguageContent(),
            tr: createEmptyLanguageContent()
          });
        }
      } catch (err) {
        console.error("Error checking existing country:", err);
      }
    };

    checkAndLoadExistingCountry();
  }, [selectedCountryId]);

  const fetchCountries = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("countries")
        .select("id, name_ka, name_en, name_ru, name_ar, name_de, name_tr, slug_ka, slug_en")
        .order("name_ka");

      if (error) throw error;
      setCountries(data || []);
    } catch (error) {
      console.error("Error fetching countries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateLanguageContent = (lang: Language, content: Partial<LanguageContent>) => {
    setLanguageContent(prev => ({
      ...prev,
      [lang]: { ...prev[lang], ...content }
    }));
  };

  const getCountryName = (country: Country) => {
    const names = {
      ka: country.name_ka,
      en: country.name_en,
      ru: country.name_ru,
      ar: country.name_ar,
      de: country.name_de,
      tr: country.name_tr
    };
    return names[activeLanguage];
  };

  const getSelectedCountry = () => {
    if (!selectedCountryId) return undefined;
    return countries.find(c => c.id === selectedCountryId);
  };

  const loadCountryForEdit = async (countryId: string) => {
    try {
      console.log("Loading country for edit:", countryId);
      
      const { data: countryData, error } = await supabase
        .from('countries')
        .select('*')
        .eq('id', countryId)
        .single();

      if (error) {
        console.error("Error loading country:", error);
        return;
      }

      if (!countryData) {
        console.error("Country not found");
        return;
      }

      if (!selectedCountryId) {
        setSelectedCountryId(countryData.id);
      }

      const content = countryData.content || {};
      
      // Load shared images
      if (content.shared_images) {
        setSharedImages(content.shared_images);
        
        if (content.shared_images.hero_image) {
          setImagePreviews(prev => ({
            ...prev,
            heroPreview: content.shared_images.hero_image.url
          }));
        }
        
        if (content.shared_images.gallery && content.shared_images.gallery.length > 0) {
          setImagePreviews(prev => ({
            ...prev,
            galleryPreviews: content.shared_images.gallery.map((img: SharedImage) => ({
              preview: img.url,
              alt: img.alt_ka
            }))
          }));
        }
      }

      // Load shared videos
      if (content.shared_videos && Array.isArray(content.shared_videos)) {
        setSharedVideos({ videoUrls: content.shared_videos });
      } else {
        setSharedVideos({ videoUrls: [] });
      }

      const languages: Language[] = ['ka', 'en', 'ru', 'ar', 'de', 'tr'];
      const newLanguageContent: Record<Language, LanguageContent> = {
        ka: createEmptyLanguageContent(),
        en: createEmptyLanguageContent(),
        ru: createEmptyLanguageContent(),
        ar: createEmptyLanguageContent(),
        de: createEmptyLanguageContent(),
        tr: createEmptyLanguageContent()
      };

      languages.forEach(lang => {
        if (content[lang]) {
          newLanguageContent[lang] = {
            h1_tag: content[lang].h1_tag || "",
            p_tag: content[lang].p_tag || "",
            h2_history: content[lang].h2_history || "",
            history_text: content[lang].history_text || "",
            gallery_description: content[lang].gallery_description || ""
          };
        }
      });

      setLanguageContent(newLanguageContent);
      console.log("Country loaded successfully for editing");
    } catch (error) {
      console.error("Error in loadCountryForEdit:", error);
    }
  };

  const saveAllLanguages = async () => {
    console.log("=== SAVE START ===");
    
    if (!selectedCountryId) {
      alert("გთხოვთ აირჩიოთ ქვეყანა");
      return;
    }

    const country = countries.find(c => c.id === selectedCountryId);
    if (!country) {
      alert("ქვეყანა ვერ მოიძებნა");
      return;
    }

    try {
      setIsSaving(true);

      let finalSharedImages = { ...sharedImages };

      if (pendingImages.heroImage?.file || pendingImages.galleryImages.some(img => img.file)) {
        console.log("Starting image upload. Country:", country);
        
        const uploadedImages: SharedImages = {
          hero_image: finalSharedImages.hero_image,
          gallery: [...finalSharedImages.gallery]
        };

        if (pendingImages.heroImage?.file) {
          const heroImageFileName = `${country.slug_en}-hero-${Date.now()}.${pendingImages.heroImage.file.name.split('.').pop()}`;
          const { data: heroUploadData, error: heroUploadError } = await supabase.storage
            .from('countryIMGgallery')
            .upload(`countries/${country.slug_en}/${heroImageFileName}`, pendingImages.heroImage.file);

          if (heroUploadError) throw heroUploadError;

          const { data: { publicUrl: heroUrl } } = supabase.storage
            .from('countryIMGgallery')
            .getPublicUrl(heroUploadData.path);

          uploadedImages.hero_image = {
            url: heroUrl,
            alt_ka: pendingImages.heroImage.alt_ka,
            alt_en: pendingImages.heroImage.alt_en,
            alt_ru: pendingImages.heroImage.alt_ru,
            alt_ar: pendingImages.heroImage.alt_ar,
            alt_de: pendingImages.heroImage.alt_de,
            alt_tr: pendingImages.heroImage.alt_tr
          };
        }

        if (pendingImages.galleryImages.length > 0) {
          for (let i = 0; i < pendingImages.galleryImages.length; i++) {
            const img = pendingImages.galleryImages[i];
            
            if (!img.file) {
              continue;
            }
            
            const galleryFileName = `${country.slug_en}-gallery-${Date.now()}-${i}.${img.file.name.split('.').pop()}`;
            
            const { data: galleryUploadData, error: galleryUploadError } = await supabase.storage
              .from('countryIMGgallery')
              .upload(`countries/${country.slug_en}/gallery/${galleryFileName}`, img.file);

            if (galleryUploadError) throw galleryUploadError;

            const { data: { publicUrl: galleryUrl } } = supabase.storage
              .from('countryIMGgallery')
              .getPublicUrl(galleryUploadData.path);

            uploadedImages.gallery.push({
              url: galleryUrl,
              alt_ka: img.alt_ka,
              alt_en: img.alt_en,
              alt_ru: img.alt_ru,
              alt_ar: img.alt_ar,
              alt_de: img.alt_de,
              alt_tr: img.alt_tr
            });
          }
        }

        finalSharedImages = uploadedImages;
        setSharedImages(uploadedImages);
        
        setPendingImages({
          heroImage: null,
          galleryImages: []
        });
      }

      // Build content object with shared images and videos
      const content: any = {
        shared_images: finalSharedImages,
        shared_videos: sharedVideos.videoUrls
      };

      const languages: Language[] = ['ka', 'en', 'ru', 'ar', 'de', 'tr'];
      languages.forEach(lang => {
        const langContent = languageContent[lang];
        if (langContent.h1_tag.trim()) {
          content[lang] = langContent;
        }
      });

      if (!content.ka || !content.ka.h1_tag.trim()) {
        alert("მინიმუმ ქართული ენა უნდა იყოს შევსებული");
        return;
      }

      const { error } = await supabase
        .from('countries')
        .update({ content, is_active: true })
        .eq('id', selectedCountryId);

      if (error) throw error;

      alert("ქვეყნის კონტენტი წარმატებით შეინახა!");

    } catch (error: any) {
      console.error("Error saving:", error);
      alert(`შეცდომა: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const resetAllFields = () => {
    setSelectedCountryId(null);
    setSharedImages({ hero_image: null, gallery: [] });
    setSharedVideos({ videoUrls: [] });
    setPendingImages({ heroImage: null, galleryImages: [] });
    setImagePreviews({ heroPreview: null, galleryPreviews: [] });
    setLanguageContent({
      ka: { h1_tag: '', p_tag: '', h2_history: '', history_text: '', gallery_description: '' },
      en: { h1_tag: '', p_tag: '', h2_history: '', history_text: '', gallery_description: '' },
      ru: { h1_tag: '', p_tag: '', h2_history: '', history_text: '', gallery_description: '' },
      ar: { h1_tag: '', p_tag: '', h2_history: '', history_text: '', gallery_description: '' },
      de: { h1_tag: '', p_tag: '', h2_history: '', history_text: '', gallery_description: '' },
      tr: { h1_tag: '', p_tag: '', h2_history: '', history_text: '', gallery_description: '' },
    });
    setActiveLanguage('ka');
  };

  const value: CountryContextType = {
    activeLanguage,
    setActiveLanguage,
    countries,
    isLoading,
    selectedCountryId,
    setSelectedCountryId,
    isEditMode,
    sharedImages,
    setSharedImages,
    sharedVideos,
    setSharedVideos,
    pendingImages,
    setPendingImages,
    imagePreviews,
    setImagePreviews,
    languageContent,
    updateLanguageContent,
    isSaving,
    setIsSaving,
    getCountryName,
    getSelectedCountry,
    loadCountryForEdit,
    saveAllLanguages,
    resetAllFields
  };

  return (
    <CountryContext.Provider value={value}>
      {children}
    </CountryContext.Provider>
  );
}

export function useCountry() {
  const context = useContext(CountryContext);
  if (context === undefined) {
    throw new Error('useCountry must be used within CountryProvider');
  }
  return context;
}
