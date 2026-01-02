// =====================================================
// Company Services Types
// =====================================================
// TypeScript types for company-service relationship
// =====================================================

import { AdditionalService, ServiceCategory } from './services';

// =====================================================
// Company Selected Service (Base)
// =====================================================
export interface CompanySelectedService {
  id: string;
  company_id: string;
  service_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// =====================================================
// With service details (JOIN)
// =====================================================
export interface CompanySelectedServiceWithDetails extends CompanySelectedService {
  service: AdditionalService & {
    category?: ServiceCategory;
  };
}

// =====================================================
// Grouped by location for display
// =====================================================
export interface ServicesByLocation {
  location_id: string;
  location_name_ka: string;
  location_name_en: string;
  location_name_ru?: string | null;
  location_name_ar?: string | null;
  location_name_de?: string | null;
  location_name_tr?: string | null;
  services: CompanySelectedServiceWithDetails[];
}

// =====================================================
// For selection UI (shows if already selected)
// =====================================================
export interface AvailableServiceForSelection {
  service: AdditionalService & {
    category?: ServiceCategory;
  };
  is_selected: boolean;
  location_ids: string[];
}

// =====================================================
// Available services grouped by location for selection UI
// =====================================================
export interface AvailableServicesByLocation {
  location_id: string;
  location_name_ka: string;
  location_name_en: string;
  location_name_ru?: string | null;
  location_name_ar?: string | null;
  location_name_de?: string | null;
  location_name_tr?: string | null;
  services: AvailableServiceForSelection[];
}

// =====================================================
// Insert type
// =====================================================
export interface CompanySelectedServiceInsert {
  company_id: string;
  service_id: string;
  is_active?: boolean;
}

// =====================================================
// Update type
// =====================================================
export interface CompanySelectedServiceUpdate {
  is_active?: boolean;
}

// =====================================================
// Helper function: Get localized location name
// =====================================================
export function getLocalizedLocationName(
  location: Pick<ServicesByLocation, 'location_name_ka' | 'location_name_en' | 'location_name_ru' | 'location_name_ar' | 'location_name_de' | 'location_name_tr'>,
  locale: string
): string {
  const key = `location_name_${locale}` as keyof typeof location;
  return (location[key] as string) || location.location_name_en || location.location_name_ka;
}
