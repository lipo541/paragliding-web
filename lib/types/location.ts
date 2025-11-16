// TypeScript interfaces for location_pages table

export interface FlightType {
  name: string;
  description: string;
  features: string[];
  price_gel: number;
  price_usd: number;
  price_eur: number;
}

export interface SharedHeroImage {
  url: string;
  alt_ka: string;
  alt_en: string;
  alt_ru: string;
  alt_ar: string;
  alt_de: string;
  alt_tr: string;
}

export interface SharedGalleryImage {
  url: string;
  alt_ka: string;
  alt_en: string;
  alt_ru: string;
  alt_ar: string;
  alt_de: string;
  alt_tr: string;
}

export interface SharedImages {
  hero_image: SharedHeroImage;
  gallery: SharedGalleryImage[];
}

export interface LocationLanguageContent {
  h1_tag: string;
  p_tag: string;
  h2_history: string;
  history_text: string; // Rich text HTML
  gallery_description: string;
  h3_flight_types: string;
  flight_types: FlightType[];
}

export interface LocationPageContent {
  shared_images: SharedImages;
  ka?: LocationLanguageContent;
  en?: LocationLanguageContent;
  ru?: LocationLanguageContent;
  ar?: LocationLanguageContent;
  de?: LocationLanguageContent;
  tr?: LocationLanguageContent;
}

export interface LocationPage {
  id?: string;
  country_id: string;
  location_id: string;
  is_active: boolean;
  content: LocationPageContent;
  created_at?: string;
  updated_at?: string;
}
