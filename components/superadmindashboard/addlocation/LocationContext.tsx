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
}

interface Location {
  id: string;
  country_id: string;
  name_ka: string;
  name_en: string;
  name_ru: string;
  name_ar: string;
  name_de: string;
  name_tr: string;
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

interface SharedFlightType {
  id: string;
  price_gel: number;
  price_usd: number;
  price_eur: number;
}

interface LanguageContent {
  h1_tag: string;
  p_tag: string;
  h2_history: string;
  history_text: string;
  gallery_description: string;
  h3_flight_types: string;
  flight_types: {
    shared_id: string;
    name: string;
    description: string;
    features: string[];
  }[];
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

interface LocationContextType {
  // Current Language
  activeLanguage: Language;
  setActiveLanguage: (lang: Language) => void;

  // Data
  countries: Country[];
  locations: Location[];
  isLoading: boolean;

  // Selected Location
  selectedLocationId: string | null;
  setSelectedLocationId: (id: string | null) => void;
  isEditMode: boolean;

  // Shared Images (across all languages)
  sharedImages: SharedImages;
  setSharedImages: (images: SharedImages) => void;

  // Shared Videos (across all languages)
  sharedVideos: SharedVideos;
  setSharedVideos: (videos: SharedVideos) => void;

  // Shared Flight Types (across all languages)
  sharedFlightTypes: SharedFlightType[];
  setSharedFlightTypes: (types: SharedFlightType[]) => void;

  // Pending images (before upload)
  pendingImages: PendingImages;
  setPendingImages: (images: PendingImages) => void;
  
  // Image previews (shared across all languages)
  imagePreviews: ImagePreviews;
  setImagePreviews: (previews: ImagePreviews) => void;

  // Language-specific content
  languageContent: Record<Language, LanguageContent>;
  updateLanguageContent: (lang: Language, content: Partial<LanguageContent>) => void;

  // Saving state
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;

  // Helper functions
  getCountryName: (country: Country) => string;
  getLocationName: (location: Location) => string;
  getSelectedLocation: () => Location | undefined;
  
  // Load location for editing
  loadLocationForEdit: (locationId: string) => Promise<void>;
  
  // Save all data
  saveAllLanguages: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const createEmptyLanguageContent = (): LanguageContent => ({
  h1_tag: "",
  p_tag: "",
  h2_history: "",
  history_text: "",
  gallery_description: "",
  h3_flight_types: "",
  flight_types: []
});

export function LocationProvider({ children }: { children: ReactNode }) {
  const [activeLanguage, setActiveLanguage] = useState<Language>('ka');
  const [countries, setCountries] = useState<Country[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [sharedImages, setSharedImages] = useState<SharedImages>({
    hero_image: null,
    gallery: []
  });

  const [sharedVideos, setSharedVideos] = useState<SharedVideos>({
    videoUrls: []
  });

  const [sharedFlightTypes, setSharedFlightTypes] = useState<SharedFlightType[]>([]);

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
    fetchData();
  }, []);

  // Auto-load location data if it already exists when selectedLocationId changes
  useEffect(() => {
    const checkAndLoadExistingLocation = async () => {
      if (!selectedLocationId) {
        // Reset form when no location selected
        setIsEditMode(false);
        setSharedImages({ hero_image: null, gallery: [] });
        setSharedVideos({ videoUrls: [] });
        setSharedFlightTypes([]);
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
        // Check if this location already has a page
        const { data: existingPage, error } = await supabase
          .from('location_pages')
          .select('id')
          .eq('location_id', selectedLocationId)
          .single();

        if (!error && existingPage) {
          // Location page exists - load it for editing
          console.log("ლოკაცია უკვე არსებობს, ჩატვირთვა რედაქტირებისთვის...");
          setIsEditMode(true);
          await loadLocationForEdit(existingPage.id);
        } else {
          // New location - clear form
          console.log("ახალი ლოკაცია");
          setIsEditMode(false);
          setSharedImages({ hero_image: null, gallery: [] });
          setSharedVideos({ videoUrls: [] });
          setSharedFlightTypes([]);
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
        console.error("Error checking existing location:", err);
      }
    };

    checkAndLoadExistingLocation();
  }, [selectedLocationId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const { data: countriesData, error: countriesError } = await supabase
        .from("countries")
        .select("id, name_ka, name_en, name_ru, name_ar, name_de, name_tr")
        .order("name_ka");

      if (countriesError) throw countriesError;

      const { data: locationsData, error: locationsError } = await supabase
        .from("locations")
        .select("id, country_id, name_ka, name_en, name_ru, name_ar, name_de, name_tr")
        .order("name_ka");

      if (locationsError) throw locationsError;

      setCountries(countriesData || []);
      setLocations(locationsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
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
    switch(activeLanguage) {
      case 'ka': return country.name_ka;
      case 'en': return country.name_en;
      case 'ru': return country.name_ru;
      case 'ar': return country.name_ar;
      case 'de': return country.name_de;
      case 'tr': return country.name_tr;
    }
  };

  const getLocationName = (location: Location) => {
    switch(activeLanguage) {
      case 'ka': return location.name_ka;
      case 'en': return location.name_en;
      case 'ru': return location.name_ru;
      case 'ar': return location.name_ar;
      case 'de': return location.name_de;
      case 'tr': return location.name_tr;
    }
  };

  const getSelectedLocation = () => {
    if (!selectedLocationId) return undefined;
    return locations.find(loc => loc.id === selectedLocationId);
  };

  const loadLocationForEdit = async (locationId: string) => {
    try {
      console.log("Loading location for edit:", locationId);
      
      // Fetch location page data
      const { data: locationData, error } = await supabase
        .from('location_pages')
        .select('*')
        .eq('id', locationId)
        .single();

      if (error) {
        console.error("Error loading location:", error);
        return;
      }

      if (!locationData) {
        console.error("Location not found");
        return;
      }

      // Only set selectedLocationId if not already set (for external edit calls)
      if (!selectedLocationId) {
        setSelectedLocationId(locationData.location_id);
      }

      // Load content from database
      const content = locationData.content || {};
      
      // Load shared videos
      if (content.shared_videos && Array.isArray(content.shared_videos)) {
        setSharedVideos({ videoUrls: content.shared_videos });
      }

      // Load shared flight types
      if (content.shared_flight_types && Array.isArray(content.shared_flight_types)) {
        setSharedFlightTypes(content.shared_flight_types);
      }
      
      // Load shared images
      if (content.shared_images) {
        setSharedImages(content.shared_images);
        
        // Set image previews from existing URLs
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

      // Load language-specific content
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
            gallery_description: content[lang].gallery_description || "",
            h3_flight_types: content[lang].h3_flight_types || "",
            flight_types: content[lang].flight_types || []
          };
          console.log(`✅ Loaded ${lang} flight_types:`, content[lang].flight_types);
        }
      });

      setLanguageContent(newLanguageContent);
      
      console.log("✅ Location loaded successfully for editing");
      console.log("✅ Russian flight_types:", newLanguageContent.ru.flight_types);
    } catch (error) {
      console.error("Error in loadLocationForEdit:", error);
    }
  };

  const saveAllLanguages = async () => {
    console.log("=== SAVE START ===");
    console.log("selectedLocationId:", selectedLocationId);
    console.log("locations array:", locations);
    console.log("locations.length:", locations.length);
    
    if (!selectedLocationId) {
      alert("გთხოვთ აირჩიოთ ლოკაცია");
      return;
    }

    const location = getSelectedLocation();
    console.log("Selected location from getSelectedLocation():", location);
    console.log("All locations:", locations);
    
    if (!location) {
      alert("ლოკაცია ვერ მოიძებნა");
      return;
    }
    
    if (!location.name_en) {
      alert("ლოკაციას არ აქვს ინგლისური სახელი");
      return;
    }

    try {
      setIsSaving(true);

      // Start with current sharedImages (might have ALT updates from other languages)
      let finalSharedImages = { ...sharedImages };

      // Upload NEW images if pending (only if file exists)
      if (pendingImages.heroImage?.file || pendingImages.galleryImages.some(img => img.file)) {
        console.log("Starting image upload. Location:", location);
        
        const uploadedImages: SharedImages = {
          hero_image: finalSharedImages.hero_image, // Keep existing or null
          gallery: [...finalSharedImages.gallery]    // Keep existing gallery
        };

        // Upload hero image ONLY if new file exists
        if (pendingImages.heroImage?.file) {
          console.log("Uploading hero image. Location name_en:", location.name_en);
          const heroImageFileName = `${location.name_en.toLowerCase()}-hero-${Date.now()}.${pendingImages.heroImage.file.name.split('.').pop()}`;
          const { data: heroUploadData, error: heroUploadError } = await supabase.storage
            .from('locationsIMG-gallery')
            .upload(`locations/${location.name_en.toLowerCase()}/${heroImageFileName}`, pendingImages.heroImage.file);

          if (heroUploadError) throw heroUploadError;

          const { data: { publicUrl: heroUrl } } = supabase.storage
            .from('locationsIMG-gallery')
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

        // Upload gallery images
        if (pendingImages.galleryImages.length > 0) {
          console.log("Uploading gallery images. Location:", location);
          for (let i = 0; i < pendingImages.galleryImages.length; i++) {
            const img = pendingImages.galleryImages[i];
            console.log(`Gallery image ${i}:`, img);
            
            // Skip if no file (might be only ALT text update from other language)
            if (!img.file) {
              console.log(`Gallery image ${i} has no file, skipping upload`);
              continue;
            }
            
            console.log(`Gallery image ${i} file:`, img.file);
            console.log(`Gallery image ${i} file.name:`, img.file?.name);
            console.log(`Gallery image ${i}. Location name_en:`, location?.name_en);
            const galleryFileName = `${location.name_en.toLowerCase()}-gallery-${Date.now()}-${i}.${img.file.name.split('.').pop()}`;
            
            const { data: galleryUploadData, error: galleryUploadError } = await supabase.storage
              .from('locationsIMG-gallery')
              .upload(`locations/${location.name_en.toLowerCase()}/gallery/${galleryFileName}`, img.file);

            if (galleryUploadError) throw galleryUploadError;

            const { data: { publicUrl: galleryUrl } } = supabase.storage
              .from('locationsIMG-gallery')
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
        
        // Clear pending images
        setPendingImages({
          heroImage: null,
          galleryImages: []
        });
      }

      // Build content object
      const content: any = {
        shared_videos: sharedVideos.videoUrls,
        shared_flight_types: sharedFlightTypes,
        shared_images: finalSharedImages
      };

      // Add all languages that have content
      const languages: Language[] = ['ka', 'en', 'ru', 'ar', 'de', 'tr'];
      languages.forEach(lang => {
        const langContent = languageContent[lang];
        // Add if h1_tag is filled OR flight_types exist
        if (langContent.h1_tag.trim() || (langContent.flight_types && langContent.flight_types.length > 0)) {
          content[lang] = langContent;
          console.log(`✅ Saving ${lang} with flight_types:`, langContent.flight_types);
        }
      });

      // Validation: at least Georgian must be filled
      if (!content.ka || !content.ka.h1_tag.trim()) {
        alert("მინიმუმ ქართული ენა უნდა იყოს შევსებული");
        return;
      }

      const country = countries.find(c => c.id === location.country_id);
      if (!country) return;

      // Check and refresh session if needed
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        alert("სესია ამოიწურა! გთხოვთ logout → login გააკეთოთ ხელახლა.");
        console.error("Session error:", sessionError);
        return;
      }

      // Insert or update
      const { error } = await supabase
        .from('location_pages')
        .upsert({
          country_id: location.country_id,
          location_id: selectedLocationId,
          is_active: true,
          content: content
        }, {
          onConflict: 'location_id'
        });

      if (error) throw error;

      alert("ლოკაცია წარმატებით შეინახა!");

    } catch (error: any) {
      console.error("Error saving:", error);
      alert(`შეცდომა: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const value: LocationContextType = {
    activeLanguage,
    setActiveLanguage,
    countries,
    locations,
    isLoading,
    selectedLocationId,
    setSelectedLocationId,
    isEditMode,
    sharedImages,
    setSharedImages,
    sharedVideos,
    setSharedVideos,
    sharedFlightTypes,
    setSharedFlightTypes,
    pendingImages,
    setPendingImages,
    imagePreviews,
    setImagePreviews,
    languageContent,
    updateLanguageContent,
    isSaving,
    setIsSaving,
    getCountryName,
    getLocationName,
    getSelectedLocation,
    loadLocationForEdit,
    saveAllLanguages
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  return context;
}
