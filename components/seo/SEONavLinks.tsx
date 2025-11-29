/**
 * SEO Navigation Links - Server Component
 * ========================================
 * ეს კომპონენტი უზრუნველყოფს ნავიგაციის ლინკების
 * server-side rendering-ს Google-ისთვის.
 * 
 * ლინკები ვიზუალურად დამალულია (sr-only) მაგრამ
 * Google Crawler-ისთვის ხილვადია HTML-ში.
 */

import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';

// ნავიგაციის მონაცემები - ყველა მთავარი გვერდი
const NAV_ITEMS = [
  { href: '/locations', label: 'Locations' },
  { href: '/promotions', label: 'Promotions' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
  { href: '/bookings', label: 'My Bookings' },
  { href: '/profile', label: 'User Profile' },
];

// ყველა locale
const LOCALES = ['ka', 'en', 'ru', 'de', 'tr', 'ar'] as const;
type LocaleType = typeof LOCALES[number];

interface SEONavLinksProps {
  locale: string;
}

// Helper to get localized slug
function getLocalizedSlug(item: any, locale: string): string {
  const slugKey = `slug_${locale}` as keyof typeof item;
  return item[slugKey] || item.slug_en || '';
}

export default async function SEONavLinks({ locale }: SEONavLinksProps) {
  const supabase = createServerClient();
  
  // Fetch countries and locations for SEO links
  const { data: countries } = await supabase
    .from('countries')
    .select('id, slug_ka, slug_en, slug_ru, slug_de, slug_tr, slug_ar, name_en')
    .eq('is_active', true);

  const { data: locations } = await supabase
    .from('locations')
    .select('id, country_id, slug_ka, slug_en, slug_ru, slug_de, slug_tr, slug_ar, name_en');

  return (
    <nav 
      aria-label="SEO Navigation" 
      className="sr-only"
    >
      {/* Main navigation links */}
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={`/${locale}${item.href}`}
        >
          {item.label}
        </Link>
      ))}
      
      {/* Country links */}
      {countries?.map((country) => (
        <Link
          key={country.id}
          href={`/${locale}/locations/${getLocalizedSlug(country, locale)}`}
        >
          {country.name_en}
        </Link>
      ))}
      
      {/* Location links */}
      {locations?.map((location) => {
        const country = countries?.find(c => c.id === location.country_id);
        if (!country) return null;
        
        return (
          <Link
            key={location.id}
            href={`/${locale}/locations/${getLocalizedSlug(country, locale)}/${getLocalizedSlug(location, locale)}`}
          >
            {location.name_en}
          </Link>
        );
      })}
      
      {/* Alternate language links */}
      {LOCALES.map((lang) => (
        <Link
          key={lang}
          href={`/${lang}`}
          hrefLang={lang}
        >
          {lang.toUpperCase()}
        </Link>
      ))}
    </nav>
  );
}
