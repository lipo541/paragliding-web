// =====================================================
// Pilot Types
// =====================================================
// TypeScript types for pilot-related data
// Aligned with database schema
// =====================================================

export type PilotStatus = 'pending' | 'verified' | 'blocked' | 'hidden';

// Gallery image structure
export interface GalleryImage {
  url: string;
  caption_ka?: string;
  caption_en?: string;
  caption_ru?: string;
  order?: number;
}

// Available languages for communication
export type SupportedLanguage = 'ka' | 'en' | 'ru' | 'de' | 'tr' | 'ar' | 'he' | 'fr' | 'es' | 'it' | 'zh';

export interface Pilot {
  id: string;
  user_id: string;
  
  // Personal Information - Multi-language names
  first_name_ka?: string | null;
  first_name_en?: string | null;
  first_name_ru?: string | null;
  first_name_de?: string | null;
  first_name_tr?: string | null;
  first_name_ar?: string | null;
  
  last_name_ka?: string | null;
  last_name_en?: string | null;
  last_name_ru?: string | null;
  last_name_de?: string | null;
  last_name_tr?: string | null;
  last_name_ar?: string | null;
  
  birth_date?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  phone: string;
  email: string;
  avatar_url?: string | null;
  
  // Experience
  commercial_start_date?: string | null;
  total_flights?: number | null;
  tandem_flights?: number | null;
  
  // Multi-language bio
  bio_ka?: string | null;
  bio_en?: string | null;
  bio_ru?: string | null;
  bio_ar?: string | null;
  bio_de?: string | null;
  bio_tr?: string | null;
  
  // Equipment - Wing (ფრთა)
  wing_brand?: string | null;
  wing_model?: string | null;
  wing_certificate_url?: string | null;
  
  // Equipment - Pilot Harness (პილოტის სავარძელი)
  pilot_harness_brand?: string | null;
  pilot_harness_model?: string | null;
  pilot_harness_certificate_url?: string | null;
  
  // Equipment - Passenger Harness (მგზავრის სავარძელი)
  passenger_harness_brand?: string | null;
  passenger_harness_model?: string | null;
  passenger_harness_certificate_url?: string | null;
  
  // Equipment - Reserve Parachute (სარეზერვო პარაშუტი)
  reserve_brand?: string | null;
  reserve_model?: string | null;
  reserve_certificate_url?: string | null;
  
  // Verification documents
  verification_documents?: string[];
  
  // Company Association
  company_id?: string | null;
  
  // =====================================================
  // Profile page content (NEW)
  // =====================================================
  
  // Cover/Hero image for profile page
  cover_image_url?: string | null;
  
  // Gallery images (JSON array)
  gallery_images?: GalleryImage[];
  
  // Video URLs (YouTube, Vimeo, etc.)
  video_urls?: string[];
  
  // Languages pilot speaks (for client communication)
  languages?: SupportedLanguage[];
  
  // Locations where pilot operates
  location_ids?: string[];
  
  // SEO Fields - Slugs
  slug?: string | null;
  slug_ka?: string | null;
  slug_en?: string | null;
  slug_ru?: string | null;
  slug_ar?: string | null;
  slug_de?: string | null;
  slug_tr?: string | null;
  
  // SEO Fields - Titles
  seo_title_ka?: string | null;
  seo_title_en?: string | null;
  seo_title_ru?: string | null;
  seo_title_ar?: string | null;
  seo_title_de?: string | null;
  seo_title_tr?: string | null;
  
  // SEO Fields - Descriptions
  seo_description_ka?: string | null;
  seo_description_en?: string | null;
  seo_description_ru?: string | null;
  seo_description_ar?: string | null;
  seo_description_de?: string | null;
  seo_description_tr?: string | null;
  
  // SEO Fields - OG Titles
  og_title_ka?: string | null;
  og_title_en?: string | null;
  og_title_ru?: string | null;
  og_title_ar?: string | null;
  og_title_de?: string | null;
  og_title_tr?: string | null;
  
  // SEO Fields - OG Descriptions
  og_description_ka?: string | null;
  og_description_en?: string | null;
  og_description_ru?: string | null;
  og_description_ar?: string | null;
  og_description_de?: string | null;
  og_description_tr?: string | null;
  
  // Stripe (for future payouts)
  stripe_account_id?: string | null;
  stripe_onboarding_complete?: boolean;
  
  // Status
  status: PilotStatus;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface PilotInsert {
  user_id: string;
  first_name: string;
  last_name: string;
  birth_date?: string | null;
  phone: string;
  email: string;
  avatar_url?: string | null;
  commercial_start_date?: string | null;
  bio_ka?: string | null;
  bio_en?: string | null;
  bio_ru?: string | null;
  bio_ar?: string | null;
  bio_de?: string | null;
  bio_tr?: string | null;
  wing_model?: string | null;
  wing_certificate_url?: string | null;
  pilot_harness_model?: string | null;
  pilot_harness_certificate_url?: string | null;
  passenger_harness_model?: string | null;
  passenger_harness_certificate_url?: string | null;
  reserve_model?: string | null;
  reserve_certificate_url?: string | null;
  tandem_certificate_url?: string | null;
  company_id?: string | null;
  status?: PilotStatus;
}

export interface PilotUpdate {
  first_name?: string;
  last_name?: string;
  birth_date?: string | null;
  phone?: string;
  email?: string;
  avatar_url?: string | null;
  commercial_start_date?: string | null;
  bio_ka?: string | null;
  bio_en?: string | null;
  bio_ru?: string | null;
  bio_ar?: string | null;
  bio_de?: string | null;
  bio_tr?: string | null;
  wing_model?: string | null;
  wing_certificate_url?: string | null;
  pilot_harness_model?: string | null;
  pilot_harness_certificate_url?: string | null;
  passenger_harness_model?: string | null;
  passenger_harness_certificate_url?: string | null;
  reserve_model?: string | null;
  reserve_certificate_url?: string | null;
  tandem_certificate_url?: string | null;
  company_id?: string | null;
  status?: PilotStatus;
  // SEO fields
  name_ka?: string | null;
  name_en?: string | null;
  name_ru?: string | null;
  name_ar?: string | null;
  name_de?: string | null;
  name_tr?: string | null;
  slug_ka?: string | null;
  slug_en?: string | null;
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
}

// For admin dashboard - pilot with profile and company info
export interface PilotWithProfile extends Pilot {
  profiles?: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
    role: string;
  };
  company?: {
    id: string;
    name_ka: string | null;
    name_en: string | null;
    logo_url: string | null;
  } | null;
}

// For public display - only verified pilots
export interface PublicPilot {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  commercial_start_date: string | null;
  bio_ka: string | null;
  bio_en: string | null;
  bio_ru: string | null;
  bio_ar: string | null;
  bio_de: string | null;
  bio_tr: string | null;
  wing_model: string | null;
  company?: {
    id: string;
    name_ka: string | null;
    name_en: string | null;
    logo_url: string | null;
  } | null;
}

// =====================================================
// Pilot Achievement Types
// =====================================================

export interface PilotAchievement {
  id: string;
  pilot_id: string;
  
  // Multi-language titles
  title_ka?: string | null;
  title_en?: string | null;
  title_ru?: string | null;
  title_ar?: string | null;
  title_de?: string | null;
  title_tr?: string | null;
  
  // Multi-language descriptions
  description_ka?: string | null;
  description_en?: string | null;
  description_ru?: string | null;
  description_ar?: string | null;
  description_de?: string | null;
  description_tr?: string | null;
  
  // Achievement date
  achievement_date?: string | null;
  
  // Certificate URL
  certificate_url?: string | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface PilotAchievementInsert {
  pilot_id: string;
  title_ka?: string | null;
  title_en?: string | null;
  title_ru?: string | null;
  title_ar?: string | null;
  title_de?: string | null;
  title_tr?: string | null;
  description_ka?: string | null;
  description_en?: string | null;
  description_ru?: string | null;
  description_ar?: string | null;
  description_de?: string | null;
  description_tr?: string | null;
  achievement_date?: string | null;
  certificate_url?: string | null;
}

export interface PilotAchievementUpdate {
  title_ka?: string | null;
  title_en?: string | null;
  title_ru?: string | null;
  title_ar?: string | null;
  title_de?: string | null;
  title_tr?: string | null;
  description_ka?: string | null;
  description_en?: string | null;
  description_ru?: string | null;
  description_ar?: string | null;
  description_de?: string | null;
  description_tr?: string | null;
  achievement_date?: string | null;
  certificate_url?: string | null;
}

// =====================================================
// Pilot Company Request Types
// =====================================================

export type PilotCompanyRequestStatus = 'pending' | 'approved' | 'rejected';

export interface PilotCompanyRequest {
  id: string;
  pilot_id: string;
  company_id: string;
  
  // Status
  status: PilotCompanyRequestStatus;
  
  // Messages
  message?: string | null;
  response_message?: string | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  responded_at?: string | null;
}

export interface PilotCompanyRequestInsert {
  pilot_id: string;
  company_id: string;
  message?: string | null;
}

export interface PilotCompanyRequestWithDetails extends PilotCompanyRequest {
  pilot?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    phone: string;
    email: string;
  };
  company?: {
    id: string;
    name_ka: string | null;
    name_en: string | null;
    logo_url: string | null;
  };
}

// =====================================================
// Helper Types
// =====================================================

export interface ExperienceInfo {
  years: number;
  months: number;
  displayText: string;
}

// Equipment types for form
export type EquipmentType = 'wing' | 'pilot_harness' | 'passenger_harness' | 'reserve';

export interface EquipmentInfo {
  model: string;
  certificate_url?: string;
}

// =====================================================
// Language Names (for display)
// =====================================================

export const LANGUAGE_NAMES: Record<SupportedLanguage, { ka: string; en: string }> = {
  ka: { ka: 'ქართული', en: 'Georgian' },
  en: { ka: 'ინგლისური', en: 'English' },
  ru: { ka: 'რუსული', en: 'Russian' },
  de: { ka: 'გერმანული', en: 'German' },
  tr: { ka: 'თურქული', en: 'Turkish' },
  ar: { ka: 'არაბული', en: 'Arabic' },
  he: { ka: 'ებრაული', en: 'Hebrew' },
  fr: { ka: 'ფრანგული', en: 'French' },
  es: { ka: 'ესპანური', en: 'Spanish' },
  it: { ka: 'იტალიური', en: 'Italian' },
  zh: { ka: 'ჩინური', en: 'Chinese' },
};

// =====================================================
// Helper Functions
// =====================================================

/**
 * Get pilot's full name in specified locale
 */
export function getPilotName(pilot: Pilot, locale: string): string {
  const pilotRecord = pilot as unknown as Record<string, string | null>;
  const firstName = pilotRecord[`first_name_${locale}`]
    || pilotRecord['first_name_en'] 
    || pilotRecord['first_name_ka'] 
    || '';
  const lastName = pilotRecord[`last_name_${locale}`]
    || pilotRecord['last_name_en'] 
    || pilotRecord['last_name_ka'] 
    || '';
  return `${firstName} ${lastName}`.trim();
}

/**
 * Get pilot's bio in specified locale
 */
export function getPilotBio(pilot: Pilot, locale: string): string | null {
  const pilotRecord = pilot as unknown as Record<string, string | null>;
  return pilotRecord[`bio_${locale}`]
    || pilotRecord['bio_en'] 
    || pilotRecord['bio_ka'] 
    || null;
}

/**
 * Calculate years of experience from commercial_start_date
 */
export function getPilotExperienceYears(pilot: Pilot): number | null {
  if (!pilot.commercial_start_date) return null;
  const startDate = new Date(pilot.commercial_start_date);
  const now = new Date();
  const years = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365));
  return years;
}
