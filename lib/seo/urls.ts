/**
 * SEO URL Utilities
 * ==================
 * Helper ფუნქციები URL-ების გენერაციისა და slug-ების წამოღებისთვის
 */

import { createServerClient } from '@/lib/supabase/server';
import { 
  BASE_URL, 
  locales, 
  X_DEFAULT_LOCALE,
  type Locale,
  type AlternateUrls 
} from './constants';

// ============================================
// 🔗 URL Builders
// ============================================

/**
 * აგენერირებს სრულ URL-ს path-დან
 */
export function buildUrl(path: string): string {
  // წაშალე დასაწყისის slash თუ არის
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${cleanPath}`;
}

/**
 * აგენერირებს canonical URL-ს
 */
export function buildCanonicalUrl(
  locale: Locale,
  path: string = ''
): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${BASE_URL}/${locale}${cleanPath ? `/${cleanPath}` : ''}`;
}

/**
 * აგენერირებს alternate URLs ობიექტს (hreflang-ისთვის)
 */
export function buildAlternateUrls(
  pathsByLocale: Record<Locale, string>,
  currentLocale: Locale
): AlternateUrls {
  const languages: Record<string, string> = {};
  
  for (const locale of locales) {
    const path = pathsByLocale[locale] || pathsByLocale[X_DEFAULT_LOCALE];
    languages[locale] = `${BASE_URL}/${locale}${path ? `/${path}` : ''}`;
  }
  
  // x-default ჩვეულებრივ მიუთითებს ინგლისურზე
  languages['x-default'] = languages[X_DEFAULT_LOCALE];
  
  return {
    canonical: languages[currentLocale],
    languages: languages as Record<Locale | 'x-default', string>,
  };
}

// ============================================
// 🗄️ Database Slug Fetchers
// ============================================

interface LocationSlugs {
  location: Record<Locale, string>;
  country: Record<Locale, string>;
}

interface CountrySlugs {
  country: Record<Locale, string>;
}

/**
 * წამოიღებს ლოკაციის ყველა ენის slug-ებს ბაზიდან
 * 
 * @param locationSlug - მიმდინარე ენის slug
 * @param sourceLocale - რომელ ენაზეა მოცემული slug
 * @returns ყველა ენის slug-ები ან null თუ ვერ მოიძებნა
 * 
 * @example
 * const slugs = await getLocationSlugs('gudauri', 'en');
 * // { location: { ka: 'გუდაური', en: 'gudauri', ... }, country: { ka: 'საქართველო', ... } }
 */
export async function getLocationSlugs(
  locationSlug: string,
  sourceLocale: Locale
): Promise<LocationSlugs | null> {
  const supabase = createServerClient();
  
  const slugColumn = `slug_${sourceLocale}`;
  
  const { data: location, error } = await supabase
    .from('locations')
    .select(`
      slug_ka, slug_en, slug_ru, slug_de, slug_tr, slug_ar,
      countries!inner(
        slug_ka, slug_en, slug_ru, slug_de, slug_tr, slug_ar
      )
    `)
    .eq(slugColumn, locationSlug)
    .single();

  if (error || !location) {
    console.error('Error fetching location slugs:', error);
    return null;
  }

  // countries შეიძლება იყოს array ან object Supabase join-ის შედეგად
  const countriesData = Array.isArray(location.countries) 
    ? location.countries[0] 
    : location.countries;
  const countries = countriesData as Record<string, string>;

  return {
    location: {
      ka: location.slug_ka || locationSlug,
      en: location.slug_en || locationSlug,
      ru: location.slug_ru || location.slug_en || locationSlug,
      de: location.slug_de || location.slug_en || locationSlug,
      tr: location.slug_tr || location.slug_en || locationSlug,
      ar: location.slug_ar || location.slug_en || locationSlug,
    },
    country: {
      ka: countries.slug_ka,
      en: countries.slug_en,
      ru: countries.slug_ru || countries.slug_en,
      de: countries.slug_de || countries.slug_en,
      tr: countries.slug_tr || countries.slug_en,
      ar: countries.slug_ar || countries.slug_en,
    },
  };
}

/**
 * წამოიღებს ქვეყნის ყველა ენის slug-ებს ბაზიდან
 */
export async function getCountrySlugs(
  countrySlug: string,
  sourceLocale: Locale
): Promise<CountrySlugs | null> {
  const supabase = createServerClient();
  
  const slugColumn = `slug_${sourceLocale}`;
  
  const { data: country, error } = await supabase
    .from('countries')
    .select('slug_ka, slug_en, slug_ru, slug_de, slug_tr, slug_ar')
    .eq(slugColumn, countrySlug)
    .single();

  if (error || !country) {
    console.error('Error fetching country slugs:', error);
    return null;
  }

  return {
    country: {
      ka: country.slug_ka || countrySlug,
      en: country.slug_en || countrySlug,
      ru: country.slug_ru || country.slug_en || countrySlug,
      de: country.slug_de || country.slug_en || countrySlug,
      tr: country.slug_tr || country.slug_en || countrySlug,
      ar: country.slug_ar || country.slug_en || countrySlug,
    },
  };
}

// ============================================
// 🗺️ Alternate URL Generators
// ============================================

/**
 * აგენერირებს location გვერდის alternate URLs
 */
export async function getLocationAlternateUrls(
  locationSlug: string,
  sourceLocale: Locale
): Promise<AlternateUrls | null> {
  const slugs = await getLocationSlugs(locationSlug, sourceLocale);
  
  if (!slugs) return null;
  
  const pathsByLocale: Record<Locale, string> = {} as Record<Locale, string>;
  
  for (const locale of locales) {
    pathsByLocale[locale] = `locations/${slugs.country[locale]}/${slugs.location[locale]}`;
  }
  
  return buildAlternateUrls(pathsByLocale, sourceLocale);
}

/**
 * აგენერირებს country გვერდის alternate URLs
 */
export async function getCountryAlternateUrls(
  countrySlug: string,
  sourceLocale: Locale
): Promise<AlternateUrls | null> {
  const slugs = await getCountrySlugs(countrySlug, sourceLocale);
  
  if (!slugs) return null;
  
  const pathsByLocale: Record<Locale, string> = {} as Record<Locale, string>;
  
  for (const locale of locales) {
    pathsByLocale[locale] = `locations/${slugs.country[locale]}`;
  }
  
  return buildAlternateUrls(pathsByLocale, sourceLocale);
}

/**
 * აგენერირებს სტატიკური გვერდის alternate URLs
 * (about, contact, terms, privacy და ა.შ. - სადაც slug არ იცვლება)
 */
export function getStaticPageAlternateUrls(
  path: string,
  currentLocale: Locale
): AlternateUrls {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  const pathsByLocale: Record<Locale, string> = {} as Record<Locale, string>;
  
  for (const locale of locales) {
    pathsByLocale[locale] = cleanPath;
  }
  
  return buildAlternateUrls(pathsByLocale, currentLocale);
}

// ============================================
// 🧪 Validation Helpers
// ============================================

/**
 * ამოწმებს არის თუ არა slug ვალიდური
 */
export function isValidSlug(slug: string): boolean {
  // slug უნდა იყოს lowercase, შეიცავდეს მხოლოდ ასოებს, რიცხვებს და დეფისებს
  return /^[a-z0-9\u10D0-\u10FF\u0400-\u04FF\u0600-\u06FF-]+$/.test(slug);
}

/**
 * ანორმალიზებს slug-ს
 */
export function normalizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\u10D0-\u10FF\u0400-\u04FF\u0600-\u06FF-]/g, '');
}
