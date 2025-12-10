// =====================================================
// Company Types
// =====================================================
// TypeScript types for company-related data
// =====================================================

export type CompanyStatus = 'pending' | 'verified' | 'blocked' | 'hidden';

export interface Company {
  id: string;
  user_id: string;
  
  // Basic Information
  name: string;
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
  
  // Logo
  logo_url?: string | null;
  
  // Status
  status: CompanyStatus;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface CompanyInsert {
  user_id: string;
  name: string;
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
  name?: string;
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
