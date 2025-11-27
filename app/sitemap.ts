/**
 * Dynamic Sitemap Generator
 * ==========================
 * აგენერირებს sitemap.xml-ს ბაზის მონაცემებიდან
 * 
 * URL: /sitemap.xml
 */

import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/client';
import { BASE_URL, locales, STATIC_ROUTES, type Locale } from '@/lib/seo';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient();
  const entries: MetadataRoute.Sitemap = [];

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
        lastModified: new Date(),
        changeFrequency: isHomePage ? 'weekly' : (isLegalPage ? 'yearly' : 'weekly'),
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

  if (countries) {
    for (const country of countries) {
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
          lastModified: country.updated_at ? new Date(country.updated_at as string) : new Date(),
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

  if (locations) {
    for (const location of locations) {
      const country = location.countries as Record<string, string>;
      
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
          lastModified: location.updated_at ? new Date(location.updated_at as string) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.85,
          alternates: {
            languages: alternateLanguages,
          },
        });
      }
    }
  }

  return entries;
}
