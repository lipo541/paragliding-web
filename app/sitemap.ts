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
      // terms და privacy გვერდებს დაბალი პრიორიტეტი
      const isLegalPage = route === '/terms' || route === '/privacy';
      const isHomePage = route === '';
      
      entries.push({
        url: `${BASE_URL}/${locale}${route}`,
        lastModified: staticPagesDate, // ✅ ფიქსირებული თარიღი
        changeFrequency: isHomePage ? 'daily' : (isLegalPage ? 'yearly' : 'weekly'),
        priority: isHomePage ? 1.0 : (isLegalPage ? 0.3 : 0.8),
        alternates: {
          languages: Object.fromEntries(
            locales.map(l => [l, `${BASE_URL}/${l}${route}`])
          ),
        },
      });
    }
  }

  // ============================================
  // 2. ქვეყნების გვერდები (დინამიური)
  // ============================================
  
  const { data: countries } = await supabase
    .from('countries')
    .select('slug_ka, slug_en, slug_ru, slug_de, slug_tr, slug_ar, updated_at')
    .eq('is_active', true);

  if (countries && countries.length > 0) {
    for (const country of countries) {
      // ✅ REAL lastModified from database or fallback to static date
      const countryLastModified = country.updated_at 
        ? new Date(country.updated_at as string) 
        : staticPagesDate;
      
      for (const locale of locales) {
        const slug = country[`slug_${locale}` as keyof typeof country] || country.slug_en;
        
        // Alternates - ყველა ენის URL-ები
        const alternateLanguages: Record<string, string> = {};
        for (const l of locales) {
          const altSlug = country[`slug_${l}` as keyof typeof country] || country.slug_en;
          alternateLanguages[l] = `${BASE_URL}/${l}/locations/${altSlug}`;
        }

        entries.push({
          url: `${BASE_URL}/${locale}/locations/${slug}`,
          lastModified: countryLastModified,
          changeFrequency: 'weekly',
          priority: 0.9,
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
  
  const { data: locations } = await supabase
    .from('locations')
    .select(`
      slug_ka, slug_en, slug_ru, slug_de, slug_tr, slug_ar,
      updated_at,
      countries!inner(
        slug_ka, slug_en, slug_ru, slug_de, slug_tr, slug_ar
      )
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
      
      for (const locale of locales) {
        const locationSlug = location[`slug_${locale}` as keyof typeof location] || location.slug_en;
        const countrySlug = country[`slug_${locale}`] || country.slug_en;

        // Alternates - ყველა ენის URL-ები
        const alternateLanguages: Record<string, string> = {};
        for (const l of locales) {
          const altLocationSlug = location[`slug_${l}` as keyof typeof location] || location.slug_en;
          const altCountrySlug = country[`slug_${l}`] || country.slug_en;
          alternateLanguages[l] = `${BASE_URL}/${l}/locations/${altCountrySlug}/${altLocationSlug}`;
        }

        entries.push({
          url: `${BASE_URL}/${locale}/locations/${countrySlug}/${locationSlug}`,
          lastModified: locationLastModified,
          changeFrequency: 'weekly',
          priority: 0.85,
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
  console.log(`[SITEMAP] Generated ${entries.length} URLs`);
  console.log(`[SITEMAP] - Static pages: ${STATIC_ROUTES.length * locales.length}`);
  console.log(`[SITEMAP] - Countries: ${countries?.length || 0} x ${locales.length} = ${(countries?.length || 0) * locales.length}`);
  console.log(`[SITEMAP] - Locations: ${locations?.length || 0} x ${locales.length} = ${(locations?.length || 0) * locales.length}`);

  return entries;
}
