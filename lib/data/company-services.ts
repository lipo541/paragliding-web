// =====================================================
// Company Services Data Functions
// =====================================================
// Data fetching and mutation functions for company-service relationships
// =====================================================

import { createClient } from '@/lib/supabase/client';
import { 
  CompanySelectedService, 
  CompanySelectedServiceWithDetails,
  ServicesByLocation,
  AvailableServiceForSelection,
  AvailableServicesByLocation
} from '@/lib/types/company-services';
import { AdditionalService, ServiceCategory } from '@/lib/types/services';

// =====================================================
// GET: Available services for company (based on locations)
// =====================================================
export async function getAvailableServicesForCompany(
  companyId: string
): Promise<AvailableServiceForSelection[]> {
  const supabase = createClient();
  
  // 1. Get company's location_ids
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('location_ids')
    .eq('id', companyId)
    .single();
  
  if (companyError || !company?.location_ids?.length) {
    console.error('Error fetching company locations:', companyError);
    return [];
  }
  
  // 2. Get all active services for those locations
  const { data: services, error: servicesError } = await supabase
    .from('additional_services')
    .select(`
      *,
      category:service_categories(*)
    `)
    .eq('status', 'active')
    .overlaps('location_ids', company.location_ids);
  
  if (servicesError) {
    console.error('Error fetching services:', servicesError);
    return [];
  }
  
  // 3. Get company's already selected services
  const { data: selectedServices } = await supabase
    .from('company_selected_services')
    .select('service_id')
    .eq('company_id', companyId)
    .eq('is_active', true);
  
  const selectedIds = new Set(selectedServices?.map((s: { service_id: string }) => s.service_id) || []);
  
  // 4. Map to AvailableServiceForSelection
  return (services || []).map((service: AdditionalService & { category?: ServiceCategory }) => ({
    service,
    is_selected: selectedIds.has(service.id),
    location_ids: service.location_ids || []
  }));
}

// =====================================================
// GET: Available services grouped by location for selection UI
// =====================================================
export async function getAvailableServicesGroupedByLocation(
  companyId: string
): Promise<AvailableServicesByLocation[]> {
  const supabase = createClient();
  
  // 1. Get company with location_ids
  const { data: company } = await supabase
    .from('companies')
    .select('location_ids')
    .eq('id', companyId)
    .single();
  
  if (!company?.location_ids?.length) return [];
  
  // 2. Get locations info
  const { data: locations } = await supabase
    .from('locations')
    .select('id, name_ka, name_en, name_ru, name_ar, name_de, name_tr')
    .in('id', company.location_ids);
  
  // 3. Get all available services
  const availableServices = await getAvailableServicesForCompany(companyId);
  
  // 4. Group by location
  type LocationRow = {
    id: string;
    name_ka: string;
    name_en: string;
    name_ru?: string | null;
    name_ar?: string | null;
    name_de?: string | null;
    name_tr?: string | null;
  };
  
  return (locations || []).map((location: LocationRow) => ({
    location_id: location.id,
    location_name_ka: location.name_ka,
    location_name_en: location.name_en,
    location_name_ru: location.name_ru,
    location_name_ar: location.name_ar,
    location_name_de: location.name_de,
    location_name_tr: location.name_tr,
    services: availableServices.filter(s => 
      s.location_ids.includes(location.id)
    )
  })).filter((group: AvailableServicesByLocation) => group.services.length > 0);
}

// =====================================================
// GET: Company's selected services
// =====================================================
export async function getCompanySelectedServices(
  companyId: string
): Promise<CompanySelectedServiceWithDetails[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('company_selected_services')
    .select(`
      *,
      service:additional_services(
        *,
        category:service_categories(*)
      )
    `)
    .eq('company_id', companyId)
    .eq('is_active', true);
  
  if (error) {
    console.error('Error fetching company selected services:', error);
    return [];
  }
  
  return (data || []).filter((item: any) => item.service !== null) as CompanySelectedServiceWithDetails[];
}

// =====================================================
// GET: Company's services grouped by location (for profile display)
// =====================================================
export async function getCompanyServicesGroupedByLocation(
  companyId: string
): Promise<ServicesByLocation[]> {
  const supabase = createClient();
  
  // 1. Get company with location_ids
  const { data: company } = await supabase
    .from('companies')
    .select('location_ids')
    .eq('id', companyId)
    .single();
  
  if (!company?.location_ids?.length) return [];
  
  // 2. Get locations
  const { data: locations } = await supabase
    .from('locations')
    .select('id, name_ka, name_en, name_ru, name_ar, name_de, name_tr')
    .in('id', company.location_ids);
  
  // 3. Get selected services with details
  const selectedServices = await getCompanySelectedServices(companyId);
  
  // 4. Group by location
  type LocationRow = {
    id: string;
    name_ka: string;
    name_en: string;
    name_ru?: string | null;
    name_ar?: string | null;
    name_de?: string | null;
    name_tr?: string | null;
  };
  
  return (locations || []).map((location: LocationRow) => ({
    location_id: location.id,
    location_name_ka: location.name_ka,
    location_name_en: location.name_en,
    location_name_ru: location.name_ru,
    location_name_ar: location.name_ar,
    location_name_de: location.name_de,
    location_name_tr: location.name_tr,
    services: selectedServices.filter(ss => 
      ss.service?.location_ids?.includes(location.id)
    )
  })).filter((group: ServicesByLocation) => group.services.length > 0);
}

// =====================================================
// GET: Services for location (from all verified companies)
// Used for XParagliding bookings
// =====================================================
export async function getActiveServicesForLocation(
  locationId: string
): Promise<AdditionalService[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('additional_services')
    .select(`
      *,
      category:service_categories(*)
    `)
    .eq('status', 'active')
    .contains('location_ids', [locationId]);
  
  if (error) {
    console.error('Error fetching services for location:', error);
    return [];
  }
  
  return data || [];
}

// =====================================================
// GET: Services selected by companies for a location
// Returns services that at least one verified company has selected
// =====================================================
export async function getCompanyServicesForLocation(
  locationId: string
): Promise<(AdditionalService & { companies: { id: string; name_ka: string; name_en?: string | null; logo_url?: string | null }[] })[]> {
  const supabase = createClient();
  
  // 1. Get all active services for this location
  const { data: services } = await supabase
    .from('additional_services')
    .select(`
      *,
      category:service_categories(*)
    `)
    .eq('status', 'active')
    .contains('location_ids', [locationId]);
  
  if (!services?.length) return [];
  
  // 2. Get companies that have selected these services
  const serviceIds = services.map((s: AdditionalService) => s.id);
  
  type SelectionRow = {
    service_id: string;
    company: { id: string; name_ka: string; name_en?: string | null; logo_url?: string | null; status?: string } | null;
  };
  
  const { data: selections } = await supabase
    .from('company_selected_services')
    .select(`
      service_id,
      company:companies(id, name_ka, name_en, logo_url, status)
    `)
    .in('service_id', serviceIds)
    .eq('is_active', true);
  
  // 3. Map services with their companies
  return services.map((service: AdditionalService) => ({
    ...service,
    companies: (selections || [])
      .filter((s: SelectionRow) => s.service_id === service.id && s.company?.status === 'verified')
      .map((s: SelectionRow) => s.company as { id: string; name_ka: string; name_en?: string | null; logo_url?: string | null })
      .filter(Boolean)
  }));
}

// =====================================================
// GET: Services for pilot (from their company)
// =====================================================
export async function getPilotCompanyServices(
  pilotId: string
): Promise<ServicesByLocation[]> {
  const supabase = createClient();
  
  // 1. Get pilot's company_id
  const { data: pilot } = await supabase
    .from('pilots')
    .select('company_id')
    .eq('id', pilotId)
    .single();
  
  if (!pilot?.company_id) return [];
  
  // 2. Use company services function
  return getCompanyServicesGroupedByLocation(pilot.company_id);
}

// =====================================================
// TOGGLE: Select/Deselect service for company
// =====================================================
export async function toggleCompanyService(
  companyId: string,
  serviceId: string,
  isActive: boolean
): Promise<CompanySelectedService | null> {
  const supabase = createClient();
  
  if (isActive) {
    // Insert or update to active
    const { data, error } = await supabase
      .from('company_selected_services')
      .upsert({
        company_id: companyId,
        service_id: serviceId,
        is_active: true
      }, {
        onConflict: 'company_id,service_id'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error toggling service:', error);
      throw error;
    }
    return data;
  } else {
    // Set to inactive (soft delete)
    const { data, error } = await supabase
      .from('company_selected_services')
      .update({ is_active: false })
      .eq('company_id', companyId)
      .eq('service_id', serviceId)
      .select()
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error toggling service:', error);
      throw error;
    }
    return data;
  }
}

// =====================================================
// BULK: Select multiple services at once
// =====================================================
export async function bulkSelectCompanyServices(
  companyId: string,
  serviceIds: string[]
): Promise<void> {
  const supabase = createClient();
  
  const records = serviceIds.map(serviceId => ({
    company_id: companyId,
    service_id: serviceId,
    is_active: true
  }));
  
  const { error } = await supabase
    .from('company_selected_services')
    .upsert(records, {
      onConflict: 'company_id,service_id'
    });
  
  if (error) {
    console.error('Error bulk selecting services:', error);
    throw error;
  }
}

// =====================================================
// BULK: Deselect all services for company
// =====================================================
export async function deselectAllCompanyServices(
  companyId: string
): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('company_selected_services')
    .update({ is_active: false })
    .eq('company_id', companyId);
  
  if (error) {
    console.error('Error deselecting all services:', error);
    throw error;
  }
}

// =====================================================
// GET: Count of selected services per company
// =====================================================
export async function getCompanyServicesCount(
  companyId: string
): Promise<number> {
  const supabase = createClient();
  
  const { count, error } = await supabase
    .from('company_selected_services')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .eq('is_active', true);
  
  if (error) {
    console.error('Error counting services:', error);
    return 0;
  }
  
  return count || 0;
}
