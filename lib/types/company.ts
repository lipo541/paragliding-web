// =====================================================
// Company Types
// =====================================================
// TypeScript types for company-related data
// =====================================================

export type CompanyStatus = 'pending' | 'verified' | 'blocked' | 'hidden';

export interface Company {
  id: string;
  user_id: string;
  
  // Multi-language Names
  name_ka: string;
  name_en?: string | null;
  name_ru?: string | null;
  name_ar?: string | null;
  name_de?: string | null;
  name_tr?: string | null;
  
  // Basic Information
  phone: string;
  email: string;
  founded_date?: string | null;
  identification_code: string;
  
  // Multi-language descriptions
  description_ka?: string | null;
  description_en?: string | null;
  description_ru?: string | null;
  description_ar?: string | null;
  description_de?: string | null;
  description_tr?: string | null;
  
  // Slugs
  slug_ka?: string | null;
  slug_en?: string | null;
  slug_ru?: string | null;
  slug_ar?: string | null;
  slug_de?: string | null;
  slug_tr?: string | null;
  
  // Logo
  logo_url?: string | null;
  
  // Stripe (for future payouts)
  stripe_account_id?: string | null;
  stripe_onboarding_complete?: boolean;
  
  // Status
  status: CompanyStatus;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface CompanyInsert {
  user_id: string;
  name_ka: string;
  name_en?: string | null;
  name_ru?: string | null;
  name_ar?: string | null;
  name_de?: string | null;
  name_tr?: string | null;
  phone: string;
  email: string;
  founded_date?: string | null;
  identification_code: string;
  description_ka?: string | null;
  description_en?: string | null;
  description_ru?: string | null;
  description_ar?: string | null;
  description_de?: string | null;
  description_tr?: string | null;
  logo_url?: string | null;
  status?: CompanyStatus;
}

export interface CompanyUpdate {
  name_ka?: string;
  name_en?: string | null;
  name_ru?: string | null;
  name_ar?: string | null;
  name_de?: string | null;
  name_tr?: string | null;
  phone?: string;
  email?: string;
  founded_date?: string | null;
  identification_code?: string;
  description_ka?: string | null;
  description_en?: string | null;
  description_ru?: string | null;
  description_ar?: string | null;
  description_de?: string | null;
  description_tr?: string | null;
  logo_url?: string | null;
  status?: CompanyStatus;
}

// For admin dashboard - company with profile info
export interface CompanyWithProfile extends Company {
  profiles?: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

// For public display - only verified companies
export interface PublicCompany {
  id: string;
  name: string;
  logo_url: string | null;
  description_ka: string | null;
  description_en: string | null;
  description_ru: string | null;
  description_ar: string | null;
  description_de: string | null;
  description_tr: string | null;
}
