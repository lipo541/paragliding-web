/**
 * Dynamic Sitemap Generator
 * ==========================
 * აგენერირებს sitemap.xml-ს ბაზის მონაცემებიდან
 * 
 * URL: /sitemap.xml
 * 
 * FIX: Server-Side Rendering + Real lastModified dates
 */

import { MetadataRoute } from 'next';
import { createServerClient } from '@/lib/supabase/server';
import { BASE_URL, locales, STATIC_ROUTES, type Locale } from '@/lib/seo';

// Revalidate sitemap every 24 hours (ISR)
// ეს საშუალებას აძლევს sitemap-ს განახლდეს ახალი კონტენტით
export const revalidate = 86400; // 24 საათში ერთხელ

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServerClient();
  const entries: MetadataRoute.Sitemap = [];
  
  // სტატიკური გვერდების ფიქსირებული თარიღი (არ იცვლება ხშირად)
  const staticPagesDate = new Date('2025-11-24T00:00:00Z');

  // ============================================
  // 1. სტატიკური გვერდები (ყველა ენაზე)
  // ============================================
  
  for (const route of STATIC_ROUTES) {
    for (const locale of locales) {
      // პრიორიტეტები გვერდის ტიპის მიხედვით
      const isHomePage = route === '';
      const isLocationsIndex = route === '/locations';
      const isPromotions = route === '/promotions';
      const isBookings = route === '/bookings';
      const isLegalPage = route === '/terms' || route === '/privacy';
      const isInfoPage = route === '/about' || route === '/contact';
      
      // პრიორიტეტის განსაზღვრა (SEO ოპტიმიზებული)
      let priority: number;
      let changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
      
      if (isHomePage) {
        priority = 1.0;
        changeFrequency = 'daily';
      } else if (isLocationsIndex) {
        priority = 0.9; // ლოკაციების მთავარი გვერდი - მაღალი
        changeFrequency = 'weekly';
      } else if (isBookings) {
        priority = 0.85; // ჯავშნის გვერდი - კონვერსიის გვერდი
        changeFrequency = 'weekly';
      } else if (isPromotions) {
        priority = 0.8; // აქციები ხშირად იცვლება
        changeFrequency = 'daily';
      } else if (isInfoPage) {
        priority = 0.6; // about/contact - საინფორმაციო
        changeFrequency = 'monthly';
      } else if (isLegalPage) {
        priority = 0.3; // იურიდიული - დაბალი
        changeFrequency = 'yearly';
      } else {
        priority = 0.5;
        changeFrequency = 'weekly';
      }
      
      entries.push({
        url: `${BASE_URL}/${locale}${route}`,
        lastModified: staticPagesDate,
        changeFrequency,
        priority,
        alternates: {
          languages: {
            ...Object.fromEntries(
              locales.map(l => [l, `${BASE_URL}/${l}${route}`])
            ),
            'x-default': `${BASE_URL}/en${route}`, // English as default
          },
        },
      });
    }
  }

  // ============================================
  // 2. ქვეყნების გვერდები (დინამიური)
  // ============================================
  
  const { data: countries } = await supabase
    .from('countries')
    .select('slug_ka, slug_en, slug_ru, slug_de, slug_tr, slug_ar, updated_at, content')
    .eq('is_active', true);

  if (countries && countries.length > 0) {
    for (const country of countries) {
      // ✅ REAL lastModified from database or fallback to static date
      const countryLastModified = country.updated_at 
        ? new Date(country.updated_at as string) 
        : staticPagesDate;
      
      // Check which locales have actual content
      const countryContent = country.content as Record<string, unknown> | null;
      let availableLocales = [...locales];
      if (countryContent) {
        availableLocales = locales.filter(l => {
          const localeContent = countryContent[l] as Record<string, unknown> | undefined;
          return localeContent && (localeContent.h1_tag || localeContent.p_tag || localeContent.history_text);
        });
        // Always include ka and en as fallback
        if (!availableLocales.includes('ka')) availableLocales.push('ka');
        if (!availableLocales.includes('en')) availableLocales.push('en');
      }
      
      // მხოლოდ იმ ენებისთვის დავამატოთ URL, სადაც კონტენტი არსებობს
      for (const locale of availableLocales) {
        const slug = country[`slug_${locale}` as keyof typeof country] || country.slug_en;
        
        // Alternates - მხოლოდ იმ ენებისთვის სადაც კონტენტი არსებობს
        const alternateLanguages: Record<string, string> = {};
        for (const l of availableLocales) {
          const altSlug = country[`slug_${l}` as keyof typeof country] || country.slug_en;
          alternateLanguages[l] = `${BASE_URL}/${l}/locations/${altSlug}`;
        }
        // x-default: English if available, otherwise Georgian
        const xDefaultSlug = country.slug_en || country.slug_ka;
        alternateLanguages['x-default'] = `${BASE_URL}/en/locations/${xDefaultSlug}`;

        entries.push({
          url: `${BASE_URL}/${locale}/locations/${slug}`,
          lastModified: countryLastModified,
          changeFrequency: 'weekly',
          priority: 0.85, // ქვეყნები - მაღალი პრიორიტეტი
          alternates: {
            languages: alternateLanguages,
          },
        });
      }
    }
  }

  // ============================================
  // 3. ლოკაციების გვერდები (დინამიური)
  // ============================================
  
  // Fetch locations with their page content to check available translations
  const { data: locations } = await supabase
    .from('locations')
    .select(`
      id,
      slug_ka, slug_en, slug_ru, slug_de, slug_tr, slug_ar,
      updated_at,
      countries!inner(
        slug_ka, slug_en, slug_ru, slug_de, slug_tr, slug_ar
      ),
      location_pages(content)
    `);
    // .eq('is_active', true);  // TODO: გააქტიურეთ როცა is_active ველი დაემატება

  if (locations && locations.length > 0) {
    for (const location of locations) {
      // countries არის ობიექტი (inner join), არა array
      const country = location.countries as unknown as Record<string, string>;

      // ✅ REAL lastModified from database or fallback to static date
      const locationLastModified = location.updated_at
        ? new Date(location.updated_at as string) 
        : staticPagesDate;
      
      // Check which locales have actual content (to avoid hreflang mismatch)
      const locationPage = Array.isArray(location.location_pages) 
        ? location.location_pages[0] 
        : location.location_pages;
      const pageContent = locationPage?.content;
      
      // Determine available locales based on content
      let availableLocales = [...locales];
      if (pageContent) {
        availableLocales = locales.filter(l => {
          const localeContent = pageContent[l];
          return localeContent && (localeContent.h1_tag || localeContent.p_tag || localeContent.history_text);
        });
        // Always include ka and en as fallback
        if (!availableLocales.includes('ka')) availableLocales.push('ka');
        if (!availableLocales.includes('en')) availableLocales.push('en');
      }
      
      // მხოლოდ იმ ენებისთვის დავამატოთ URL, სადაც კონტენტი არსებობს
      for (const locale of availableLocales) {
        const locationSlug = location[`slug_${locale}` as keyof typeof location] || location.slug_en;
        const countrySlug = country[`slug_${locale}`] || country.slug_en;

        // Alternates - მხოლოდ იმ ენებისთვის სადაც კონტენტი არსებობს
        const alternateLanguages: Record<string, string> = {};
        for (const l of availableLocales) {
          const altLocationSlug = location[`slug_${l}` as keyof typeof location] || location.slug_en;
          const altCountrySlug = country[`slug_${l}`] || country.slug_en;
          alternateLanguages[l] = `${BASE_URL}/${l}/locations/${altCountrySlug}/${altLocationSlug}`;
        }
        // x-default: English if available, otherwise Georgian
        const xDefaultLocationSlug = location.slug_en || location.slug_ka;
        const xDefaultCountrySlug = country.slug_en || country.slug_ka;
        alternateLanguages['x-default'] = `${BASE_URL}/en/locations/${xDefaultCountrySlug}/${xDefaultLocationSlug}`;

        entries.push({
          url: `${BASE_URL}/${locale}/locations/${countrySlug}/${locationSlug}`,
          lastModified: locationLastModified,
          changeFrequency: 'daily', // ლოკაციები - ხშირი განახლება (ჯავშნები, ფასები)
          priority: 0.95, // 🔺 ყველაზე მაღალი - ეს არის კონვერსიის გვერდები!
          alternates: {
            languages: alternateLanguages,
          },
        });
      }
    }
  }

  // ============================================
  // 📊 Debug Info (visible in server logs)
  // ============================================
  const staticCount = STATIC_ROUTES.length * locales.length;
  const dynamicCount = entries.length - staticCount;
  
  console.log(`[SITEMAP] Generated ${entries.length} URLs total`);
  console.log(`[SITEMAP] - Static pages: ${staticCount}`);
  console.log(`[SITEMAP] - Dynamic pages (countries + locations): ${dynamicCount}`);

  return entries;
}
