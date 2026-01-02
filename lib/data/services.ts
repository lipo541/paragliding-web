// =====================================================
// Services Data - Supabase Queries
// =====================================================
// Server-side data fetching for additional services
// =====================================================

import { createServerClient } from '@/lib/supabase/server';
import type { 
  AdditionalService, 
  ServiceCategory,
  ServicePricing,
  SharedPricingOption,
  LocalizedPricingOption
} from '@/lib/types/services';

// Supported locales
export type Locale = 'ka' | 'en' | 'ru' | 'ar' | 'de' | 'tr';

// =====================================================
// Helper: Get localized field
// =====================================================
export function getLocalizedField<T>(
  service: AdditionalService,
  field: string,
  locale: Locale
): T | null {
  const localizedKey = `${field}_${locale}` as keyof AdditionalService;
  const fallbackKey = `${field}_en` as keyof AdditionalService;
  const defaultKey = `${field}_ka` as keyof AdditionalService;
  
  return (service[localizedKey] ?? service[fallbackKey] ?? service[defaultKey] ?? null) as T | null;
}

// =====================================================
// Helper: Get minimum price from service
// =====================================================
export function getServiceMinPrice(service: AdditionalService, currency: 'gel' | 'usd' | 'eur' = 'gel'): number | null {
  const pricing = service.pricing;
  if (!pricing?.shared_pricing?.length) return null;
  
  const priceKey = `price_${currency}` as keyof SharedPricingOption;
  const prices = pricing.shared_pricing
    .map(opt => opt[priceKey] as number)
    .filter(p => p != null && p > 0);
  
  return prices.length > 0 ? Math.min(...prices) : null;
}

// =====================================================
// Helper: Get pricing options for locale
// =====================================================
export function getLocalizedPricing(
  service: AdditionalService,
  locale: Locale
): Array<SharedPricingOption & LocalizedPricingOption> {
  const pricing = service.pricing;
  if (!pricing?.shared_pricing?.length) return [];
  
  const localizedOptions = pricing[locale]?.options || pricing.en?.options || pricing.ka?.options || [];
  
  return pricing.shared_pricing.map(shared => {
    const localized = localizedOptions.find(opt => opt.shared_id === shared.id);
    return {
      ...shared,
      shared_id: shared.id,
      name: localized?.name || '',
      description: localized?.description,
      features: localized?.features
    };
  });
}

// =====================================================
// Get All Active Services
// =====================================================
export async function getAllActiveServices(): Promise<AdditionalService[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('additional_services')
    .select(`
      *,
      category:service_categories(*)
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching services:', error);
    return [];
  }

  return data || [];
}

// =====================================================
// Get Services by Location ID
// =====================================================
export async function getServicesByLocation(locationId: string): Promise<AdditionalService[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('additional_services')
    .select(`
      *,
      category:service_categories(*)
    `)
    .eq('status', 'active')
    .contains('location_ids', [locationId])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching services by location:', error);
    return [];
  }

  return data || [];
}

// =====================================================
// Get Service by Slug
// =====================================================
export async function getServiceBySlug(
  slug: string, 
  locale: Locale
): Promise<AdditionalService | null> {
  const supabase = createServerClient();
  
  // Build slug field for current locale
  const slugField = `slug_${locale}`;

  const { data, error } = await supabase
    .from('additional_services')
    .select(`
      *,
      category:service_categories(*)
    `)
    .eq(slugField, slug)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    console.error('Error fetching service by slug:', error);
    return null;
  }

  if (data) {
    return data;
  }

  // Try fallback: search across ALL slug fields to handle language switching
  const allLocales: Locale[] = ['ka', 'en', 'ru', 'ar', 'de', 'tr'];
  
  for (const loc of allLocales) {
    if (loc === locale) continue; // Already checked this locale
    
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('additional_services')
      .select(`
        *,
        category:service_categories(*)
      `)
      .eq(`slug_${loc}`, slug)
      .eq('status', 'active')
      .maybeSingle();

    if (!fallbackError && fallbackData) {
      return fallbackData;
    }
  }

  return null;
}

// =====================================================
// Get All Services for Static Params
// =====================================================
export async function getAllServicesForStaticParams(): Promise<
  Array<{ slug_ka: string; slug_en: string; slug_ru?: string; slug_ar?: string; slug_de?: string; slug_tr?: string }>
> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('additional_services')
    .select('slug_ka, slug_en, slug_ru, slug_ar, slug_de, slug_tr')
    .eq('status', 'active');

  if (error) {
    console.error('Error fetching service slugs:', error);
    return [];
  }

  return data || [];
}

// =====================================================
// Get All Active Categories
// =====================================================
export async function getServiceCategories(): Promise<ServiceCategory[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('service_categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching service categories:', error);
    return [];
  }

  return data || [];
}

// =====================================================
// Get Services by Category
// =====================================================
export async function getServicesByCategory(categoryId: string): Promise<AdditionalService[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('additional_services')
    .select(`
      *,
      category:service_categories(*)
    `)
    .eq('category_id', categoryId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching services by category:', error);
    return [];
  }

  return data || [];
}

// =====================================================
// Get Services Count by Category
// =====================================================
export async function getServicesCountByCategory(): Promise<Record<string, number>> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('additional_services')
    .select('category_id')
    .eq('status', 'active');

  if (error) {
    console.error('Error fetching services count:', error);
    return {};
  }

  const counts: Record<string, number> = {};
  data?.forEach(service => {
    if (service.category_id) {
      counts[service.category_id] = (counts[service.category_id] || 0) + 1;
    }
  });

  return counts;
}
