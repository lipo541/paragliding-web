// =====================================================
// Additional Services Types
// =====================================================
// TypeScript types for additional services (drone, transport, photo/video, etc.)
// =====================================================

// =====================================================
// Service Status
// =====================================================
export type ServiceStatus = 'draft' | 'pending' | 'active' | 'hidden';

// =====================================================
// Pricing Types
// =====================================================
export type PricingType = 'fixed' | 'per_minute' | 'per_hour' | 'per_person';

export interface SharedPricingOption {
  id: string;
  type: PricingType;
  duration_minutes?: number;
  price_gel: number;
  price_usd: number;
  price_eur: number;
}

export interface LocalizedPricingOption {
  shared_id: string;
  name: string;
  description?: string;
  features?: string[];
}

export interface ServicePricing {
  shared_pricing: SharedPricingOption[];
  ka?: { options: LocalizedPricingOption[] };
  en?: { options: LocalizedPricingOption[] };
  ru?: { options: LocalizedPricingOption[] };
  ar?: { options: LocalizedPricingOption[] };
  de?: { options: LocalizedPricingOption[] };
  tr?: { options: LocalizedPricingOption[] };
}

// =====================================================
// Gallery Image Type
// =====================================================
export interface ServiceGalleryImage {
  url: string;
  alt_ka?: string;
  alt_en?: string;
  alt_ru?: string;
  alt_ar?: string;
  alt_de?: string;
  alt_tr?: string;
  order: number;
}

// =====================================================
// Service Category
// =====================================================
export interface ServiceCategory {
  id: string;
  slug: string;
  
  // Multi-language names
  name_ka: string;
  name_en: string;
  name_ru?: string | null;
  name_ar?: string | null;
  name_de?: string | null;
  name_tr?: string | null;
  
  // Icon (Lucide icon name)
  icon?: string | null;
  
  // Sorting & Status
  sort_order: number;
  is_active: boolean;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface ServiceCategoryInsert {
  slug: string;
  name_ka: string;
  name_en: string;
  name_ru?: string | null;
  name_ar?: string | null;
  name_de?: string | null;
  name_tr?: string | null;
  icon?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export interface ServiceCategoryUpdate {
  slug?: string;
  name_ka?: string;
  name_en?: string;
  name_ru?: string | null;
  name_ar?: string | null;
  name_de?: string | null;
  name_tr?: string | null;
  icon?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

// =====================================================
// Additional Service
// =====================================================
export interface AdditionalService {
  id: string;
  
  // Category
  category_id?: string | null;
  category?: ServiceCategory;
  
  // Multi-language names
  name_ka: string;
  name_en: string;
  name_ru?: string | null;
  name_ar?: string | null;
  name_de?: string | null;
  name_tr?: string | null;
  
  // Multi-language descriptions
  description_ka?: string | null;
  description_en?: string | null;
  description_ru?: string | null;
  description_ar?: string | null;
  description_de?: string | null;
  description_tr?: string | null;
  
  // Multi-language slugs
  slug_ka: string;
  slug_en: string;
  slug_ru?: string | null;
  slug_ar?: string | null;
  slug_de?: string | null;
  slug_tr?: string | null;
  
  // SEO: Meta Title
  seo_title_ka?: string | null;
  seo_title_en?: string | null;
  seo_title_ru?: string | null;
  seo_title_ar?: string | null;
  seo_title_de?: string | null;
  seo_title_tr?: string | null;
  
  // SEO: Meta Description
  seo_description_ka?: string | null;
  seo_description_en?: string | null;
  seo_description_ru?: string | null;
  seo_description_ar?: string | null;
  seo_description_de?: string | null;
  seo_description_tr?: string | null;
  
  // OG: Title
  og_title_ka?: string | null;
  og_title_en?: string | null;
  og_title_ru?: string | null;
  og_title_ar?: string | null;
  og_title_de?: string | null;
  og_title_tr?: string | null;
  
  // OG: Description
  og_description_ka?: string | null;
  og_description_en?: string | null;
  og_description_ru?: string | null;
  og_description_ar?: string | null;
  og_description_de?: string | null;
  og_description_tr?: string | null;
  
  // OG Image (shared)
  og_image?: string | null;
  
  // Locations (UUID array)
  location_ids: string[];
  
  // Media
  gallery_images: ServiceGalleryImage[];
  video_urls: string[];
  
  // Pricing
  pricing: ServicePricing;
  
  // Status
  status: ServiceStatus;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

// =====================================================
// Insert Type
// =====================================================
export interface AdditionalServiceInsert {
  category_id?: string | null;
  
  // Names (required)
  name_ka: string;
  name_en: string;
  name_ru?: string | null;
  name_ar?: string | null;
  name_de?: string | null;
  name_tr?: string | null;
  
  // Descriptions
  description_ka?: string | null;
  description_en?: string | null;
  description_ru?: string | null;
  description_ar?: string | null;
  description_de?: string | null;
  description_tr?: string | null;
  
  // Slugs (required)
  slug_ka: string;
  slug_en: string;
  slug_ru?: string | null;
  slug_ar?: string | null;
  slug_de?: string | null;
  slug_tr?: string | null;
  
  // SEO
  seo_title_ka?: string | null;
  seo_title_en?: string | null;
  seo_title_ru?: string | null;
  seo_title_ar?: string | null;
  seo_title_de?: string | null;
  seo_title_tr?: string | null;
  
  seo_description_ka?: string | null;
  seo_description_en?: string | null;
  seo_description_ru?: string | null;
  seo_description_ar?: string | null;
  seo_description_de?: string | null;
  seo_description_tr?: string | null;
  
  // OG
  og_title_ka?: string | null;
  og_title_en?: string | null;
  og_title_ru?: string | null;
  og_title_ar?: string | null;
  og_title_de?: string | null;
  og_title_tr?: string | null;
  
  og_description_ka?: string | null;
  og_description_en?: string | null;
  og_description_ru?: string | null;
  og_description_ar?: string | null;
  og_description_de?: string | null;
  og_description_tr?: string | null;
  
  og_image?: string | null;
  
  // Data
  location_ids?: string[];
  gallery_images?: ServiceGalleryImage[];
  video_urls?: string[];
  pricing?: ServicePricing;
  
  status?: ServiceStatus;
}

// =====================================================
// Update Type
// =====================================================
export interface AdditionalServiceUpdate {
  category_id?: string | null;
  
  name_ka?: string;
  name_en?: string;
  name_ru?: string | null;
  name_ar?: string | null;
  name_de?: string | null;
  name_tr?: string | null;
  
  description_ka?: string | null;
  description_en?: string | null;
  description_ru?: string | null;
  description_ar?: string | null;
  description_de?: string | null;
  description_tr?: string | null;
  
  slug_ka?: string;
  slug_en?: string;
  slug_ru?: string | null;
  slug_ar?: string | null;
  slug_de?: string | null;
  slug_tr?: string | null;
  
  seo_title_ka?: string | null;
  seo_title_en?: string | null;
  seo_title_ru?: string | null;
  seo_title_ar?: string | null;
  seo_title_de?: string | null;
  seo_title_tr?: string | null;
  
  seo_description_ka?: string | null;
  seo_description_en?: string | null;
  seo_description_ru?: string | null;
  seo_description_ar?: string | null;
  seo_description_de?: string | null;
  seo_description_tr?: string | null;
  
  og_title_ka?: string | null;
  og_title_en?: string | null;
  og_title_ru?: string | null;
  og_title_ar?: string | null;
  og_title_de?: string | null;
  og_title_tr?: string | null;
  
  og_description_ka?: string | null;
  og_description_en?: string | null;
  og_description_ru?: string | null;
  og_description_ar?: string | null;
  og_description_de?: string | null;
  og_description_tr?: string | null;
  
  og_image?: string | null;
  
  location_ids?: string[];
  gallery_images?: ServiceGalleryImage[];
  video_urls?: string[];
  pricing?: ServicePricing;
  
  status?: ServiceStatus;
}

// =====================================================
// Utility Types & Functions
// =====================================================
export type ServiceLocale = 'ka' | 'en' | 'ru' | 'ar' | 'de' | 'tr';

/**
 * Get localized field value from service or category
 */
export function getServiceLocalizedField<T extends Record<string, unknown>>(
  item: T,
  field: string,
  locale: ServiceLocale,
  fallbackLocale: ServiceLocale = 'ka'
): string {
  const localizedKey = `${field}_${locale}` as keyof T;
  const fallbackKey = `${field}_${fallbackLocale}` as keyof T;
  return (item[localizedKey] as string) || (item[fallbackKey] as string) || '';
}

/**
 * Get localized pricing option
 */
export function getLocalizedPricingOptions(
  pricing: ServicePricing,
  locale: ServiceLocale
): Array<SharedPricingOption & LocalizedPricingOption> {
  const localizedOptions = pricing[locale]?.options || pricing.ka?.options || [];
  const sharedPricing = pricing.shared_pricing || [];
  
  return localizedOptions.map(opt => {
    const shared = sharedPricing.find(s => s.id === opt.shared_id);
    return {
      ...opt,
      id: opt.shared_id,
      type: shared?.type || 'fixed',
      duration_minutes: shared?.duration_minutes,
      price_gel: shared?.price_gel || 0,
      price_usd: shared?.price_usd || 0,
      price_eur: shared?.price_eur || 0,
    };
  });
}

/**
 * Get localized gallery image alt text
 */
export function getGalleryImageAlt(
  image: ServiceGalleryImage,
  locale: ServiceLocale
): string {
  const altKey = `alt_${locale}` as keyof ServiceGalleryImage;
  return (image[altKey] as string) || image.alt_ka || image.alt_en || '';
}
