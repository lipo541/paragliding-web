import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import CountryPage from '@/components/countrypage/CountryPage';
import { 
  getCountryAlternateUrls, 
  BASE_URL,
  SITE_NAME,
  BreadcrumbJsonLd,
  CountryJsonLd,
  generateCountryParams,
  type Locale 
} from '@/lib/seo';

// ✅ ISR: Revalidate every 12 hours (43200 seconds)
export const revalidate = 43200;

// ✅ SSG: Pre-generate all country pages at build time
export async function generateStaticParams() {
  return generateCountryParams();
}

interface PageProps {
  params: Promise<{
    locale: string;
    country: string;
  }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, country } = await params;
  const supabase = createServerClient();

  const slugField = `slug_${locale}`;
  const { data } = await supabase
    .from('countries')
    .select('*')
    .eq(slugField, country)
    .eq('is_active', true)
    .single();

  if (!data) {
    return {
      title: 'Country Not Found',
    };
  }

  const getLocalizedField = (field: string) => {
    const localeKey = `${field}_${locale}` as keyof typeof data;
    const enKey = `${field}_en` as keyof typeof data;
    return (data[localeKey] as string) || (data[enKey] as string) || '';
  };

  const title = getLocalizedField('seo_title') || getLocalizedField('name');
  const description = getLocalizedField('seo_description');
  const ogTitle = getLocalizedField('og_title') || title;
  const ogDescription = getLocalizedField('og_description') || description;

  // ✅ Hreflang alternates - ბაზიდან ყველა ენის URL-ები
  const alternateUrls = await getCountryAlternateUrls(country, locale as Locale);

  return {
    title,
    description,
    // ✅ Canonical და Hreflang
    alternates: alternateUrls ? {
      canonical: alternateUrls.canonical,
      languages: alternateUrls.languages,
    } : {
      canonical: `${BASE_URL}/${locale}/locations/${country}`,
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      images: data.og_image_url ? [data.og_image_url] : [],
      type: 'website',
      locale: locale,
      siteName: SITE_NAME,
      url: alternateUrls?.canonical || `${BASE_URL}/${locale}/locations/${country}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: data.og_image_url ? [data.og_image_url] : [],
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { locale, country } = await params;
  const supabase = createServerClient();

  // Fetch country data for breadcrumb and SSR
  const slugField = `slug_${locale}`;
  const { data: countryData } = await supabase
    .from('countries')
    .select('*')
    .eq(slugField, country)
    .eq('is_active', true)
    .single();

  // ✅ Fetch locations for SSR
  const { data: locationsData } = countryData ? await supabase
    .from('locations')
    .select('id, name_ka, name_en, name_ru, name_ar, name_de, name_tr, slug_ka, slug_en, slug_ru, slug_ar, slug_de, slug_tr, country_id, og_image_url, cached_rating, cached_rating_count, altitude, best_season_start, best_season_end, difficulty_level')
    .eq('country_id', countryData.id)
    .order('name_ka') : { data: null };

  const getLocalizedField = (data: Record<string, unknown>, field: string) => {
    const localeKey = `${field}_${locale}`;
    const enKey = `${field}_en`;
    return (data[localeKey] as string) || (data[enKey] as string) || '';
  };

  const countryName = countryData ? getLocalizedField(countryData, 'name') : country;

  // Breadcrumb items
  const breadcrumbItems = [
    { name: 'Home', url: `${BASE_URL}/${locale}` },
    { name: 'Locations', url: `${BASE_URL}/${locale}/locations` },
    { name: countryName, url: `${BASE_URL}/${locale}/locations/${country}` },
  ];

  // Prepare locations for JSON-LD
  const locationsForSchema = (locationsData || []).map((loc) => ({
    id: loc.id,
    name: getLocalizedField(loc, 'name'),
    slug: (loc[`slug_${locale}` as keyof typeof loc] || loc.slug_en) as string,
    image: loc.og_image_url,
    rating: loc.cached_rating,
    ratingCount: loc.cached_rating_count,
    altitude: loc.altitude,
  }));

  return (
    <>
      {/* JSON-LD Structured Data */}
      <BreadcrumbJsonLd items={breadcrumbItems} />
      
      {/* ✅ ItemList with LocalBusiness items - enables Review Snippets */}
      {locationsForSchema.length > 0 && (
        <CountryJsonLd
          countryName={countryName}
          countrySlug={country}
          locale={locale}
          locations={locationsForSchema}
        />
      )}
      
      {/* ✅ Pass initialData for SSR - all content will be server-rendered */}
      <CountryPage 
        slug={country} 
        locale={locale}
        initialData={{
          country: countryData,
          locations: locationsData || []
        }}
      />
    </>
  );
}
