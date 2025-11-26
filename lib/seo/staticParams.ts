/**
 * Static Params Generators
 * =========================
 * generateStaticParams ფუნქციები ISR/SSG-თვის
 * Next.js build-ის დროს წინასწარ აგენერირებს გვერდებს
 */

import { createServerClient } from '@/lib/supabase/server';
import { locales, type Locale } from './constants';

// ============================================
// 🌐 Static Pages Params
// ============================================

/**
 * აგენერირებს params-ს სტატიკური გვერდებისთვის
 * (home, about, contact, promotions, locations, terms, privacy)
 */
export async function generateLocaleParams(): Promise<Array<{ locale: Locale }>> {
  return locales.map((locale) => ({ locale }));
}

// ============================================
// 🌍 Country Pages Params
// ============================================

interface CountryParams {
  locale: Locale;
  country: string;
}

/**
 * აგენერირებს params-ს ქვეყნის გვერდებისთვის
 * /[locale]/locations/[country]
 */
export async function generateCountryParams(): Promise<CountryParams[]> {
  const supabase = createServerClient();
  
  const { data: countries, error } = await supabase
    .from('countries')
    .select('slug_ka, slug_en, slug_ru, slug_de, slug_tr, slug_ar')
    .eq('is_active', true);

  if (error || !countries) {
    console.error('Error fetching countries for static params:', error);
    return [];
  }

  const params: CountryParams[] = [];

  for (const country of countries) {
    for (const locale of locales) {
      const slugKey = `slug_${locale}` as keyof typeof country;
      const slug = (country[slugKey] as string) || country.slug_en;
      
      if (slug) {
        params.push({
          locale,
          country: slug,
        });
      }
    }
  }

  return params;
}

// ============================================
// 📍 Location Pages Params
// ============================================

interface LocationParams {
  locale: Locale;
  country: string;
  location: string;
}

/**
 * აგენერირებს params-ს ლოკაციის გვერდებისთვის
 * /[locale]/locations/[country]/[location]
 */
export async function generateLocationParams(): Promise<LocationParams[]> {
  const supabase = createServerClient();
  
  const { data: locations, error } = await supabase
    .from('locations')
    .select(`
      slug_ka, slug_en, slug_ru, slug_de, slug_tr, slug_ar,
      countries!inner(
        slug_ka, slug_en, slug_ru, slug_de, slug_tr, slug_ar,
        is_active
      )
    `)
    .eq('countries.is_active', true);

  if (error || !locations) {
    console.error('Error fetching locations for static params:', error);
    return [];
  }

  const params: LocationParams[] = [];

  for (const location of locations) {
    // countries შეიძლება იყოს array ან object Supabase join-ის შედეგად
    const countriesData = Array.isArray(location.countries) 
      ? location.countries[0] 
      : location.countries;
    const country = countriesData as Record<string, string | boolean>;
    
    for (const locale of locales) {
      const locationSlugKey = `slug_${locale}`;
      const countrySlugKey = `slug_${locale}`;
      
      const locationSlug = (location[locationSlugKey as keyof typeof location] as string) || location.slug_en;
      const countrySlug = (country[countrySlugKey] as string) || (country.slug_en as string);
      
      if (locationSlug && countrySlug) {
        params.push({
          locale,
          country: countrySlug,
          location: locationSlug,
        });
      }
    }
  }

  return params;
}

// ============================================
// 🎯 Revalidation Config
// ============================================

/**
 * რეკომენდებული revalidation დროები (წამებში)
 */
export const REVALIDATION_TIMES = {
  /** სტატიკური გვერდები (about, terms, privacy) - 1 დღე */
  STATIC_PAGES: 86400,
  
  /** მთავარი გვერდი - 1 საათი */
  HOME: 3600,
  
  /** ლოკაციები - 4 საათი (ფასები/ხელმისაწვდომობა შეიძლება შეიცვალოს) */
  LOCATIONS: 14400,
  
  /** ქვეყნები - 12 საათი */
  COUNTRIES: 43200,
  
  /** პრომოციები - 1 საათი (ხშირად იცვლება) */
  PROMOTIONS: 3600,
  
  /** კონტაქტი - 1 კვირა */
  CONTACT: 604800,
} as const;
