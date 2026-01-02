import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import LocationPage from '@/components/locationpage/LocationPage';
import { getServicesByLocation } from '@/lib/data/services';
import { 
  getLocationAlternateUrls, 
  BASE_URL,
  SITE_NAME,
  LocationJsonLd,
  BreadcrumbJsonLd,
  generateLocationParams,
  type Locale 
} from '@/lib/seo';

// ✅ ISR: Revalidate every 4 hours (14400 seconds)
export const revalidate = 14400;

// ✅ SSG: Pre-generate all location pages at build time
export async function generateStaticParams() {
  return generateLocationParams();
}

interface PageProps {
  params: Promise<{
    locale: string;
    country: string;
    location: string;
  }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, country, location } = await params;
  const supabase = createServerClient();

  const slugField = `slug_${locale}`;
  const { data } = await supabase
    .from('locations')
    .select('*')
    .eq(slugField, location)
    .single();

  if (!data) {
    return {
      title: 'Location Not Found',
    };
  }

  const getLocalizedField = (field: string) => {
    const localeKey = `${field}_${locale}` as keyof typeof data;
    const enKey = `${field}_en` as keyof typeof data;
    return (data[localeKey] as string) || (data[enKey] as string) || '';
  };

  const locationName = getLocalizedField('name');
  
  // Fetch country name for full title
  const { data: countryData } = await supabase
    .from('countries')
    .select('*')
    .eq('id', data.country_id)
    .single();

  const countryName = countryData 
    ? (countryData[`name_${locale}` as keyof typeof countryData] as string || countryData.name_en)
    : '';

  const seoTitle = getLocalizedField('seo_title') || `${locationName} - ${countryName} | Paragliding`;
  const seoDescription = getLocalizedField('seo_description') || `Paragliding in ${locationName}, ${countryName}. Book your tandem flight today!`;
  
  const ogTitle = getLocalizedField('og_title') || seoTitle;
  const ogDescription = getLocalizedField('og_description') || seoDescription;
  const ogImage = data.og_image_url;

  // ✅ Hreflang alternates - ბაზიდან ყველა ენის URL-ები
  const alternateUrls = await getLocationAlternateUrls(location, locale as Locale);

  return {
    title: seoTitle,
    description: seoDescription,
    // ✅ Canonical და Hreflang
    alternates: alternateUrls ? {
      canonical: alternateUrls.canonical,
      languages: alternateUrls.languages,
    } : {
      canonical: `${BASE_URL}/${locale}/locations/${country}/${location}`,
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type: 'website',
      locale: locale,
      siteName: SITE_NAME,
      images: ogImage ? [{ url: ogImage }] : undefined,
      url: alternateUrls?.canonical || `${BASE_URL}/${locale}/locations/${country}/${location}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { locale, country, location } = await params;
  const supabase = createServerClient();

  // Fetch location data for JSON-LD
  const slugField = `slug_${locale}`;
  const { data: locationData } = await supabase
    .from('locations')
    .select('*')
    .eq(slugField, location)
    .single();

  // Fetch country data
  const { data: countryData } = locationData ? await supabase
    .from('countries')
    .select('*')
    .eq('id', locationData.country_id)
    .single() : { data: null };

  // ✅ Fetch location_pages for SSR (full content for SEO)
  const { data: locationPageData } = locationData ? await supabase
    .from('location_pages')
    .select('*')
    .eq('location_id', locationData.id)
    .eq('is_active', true)
    .single() : { data: null };

  // Helper for localized fields
  const getLocalizedField = (data: Record<string, unknown>, field: string) => {
    const localeKey = `${field}_${locale}`;
    const enKey = `${field}_en`;
    return (data[localeKey] as string) || (data[enKey] as string) || '';
  };

  const locationName = locationData ? getLocalizedField(locationData, 'name') : '';
  const countryName = countryData ? getLocalizedField(countryData, 'name') : '';
  const description = locationData ? getLocalizedField(locationData, 'seo_description') : '';
  const pageUrl = `${BASE_URL}/${locale}/locations/${country}/${location}`;

  // ✅ Extract H1 tag from location_pages content
  const contentData = locationPageData?.content?.[locale] || locationPageData?.content?.en || {};
  const h1Tag = contentData.h1_tag || locationName;

  // Breadcrumb items
  const breadcrumbItems = [
    { name: 'Home', url: `${BASE_URL}/${locale}` },
    { name: 'Locations', url: `${BASE_URL}/${locale}/locations` },
    { name: countryName, url: `${BASE_URL}/${locale}/locations/${country}` },
    { name: locationName, url: pageUrl },
  ];

  // ✅ Filter locationPageData to include ONLY current locale content
  // This reduces HTML size and prevents SEO confusion from multiple languages
  const filteredLocationPageData = locationPageData ? {
    ...locationPageData,
    content: {
      // Only include current locale (fallback to 'en')
      [locale]: locationPageData.content?.[locale] || locationPageData.content?.en || {},
      // Include shared data (images, videos, flight types)
      shared_images: locationPageData.content?.shared_images,
      shared_videos: locationPageData.content?.shared_videos,
      shared_flight_types: locationPageData.content?.shared_flight_types,
    }
  } : null;

  // ✅ Fetch companies operating at this location
  const { data: locationCompanies } = locationData ? await supabase
    .from('companies')
    .select('id, name_ka, name_en, logo_url, slug_ka, slug_en, cached_rating')
    .contains('location_ids', [locationData.id])
    .eq('status', 'verified')
    .not('logo_url', 'is', null)
    .order('cached_rating', { ascending: false })
  : { data: null };

  // ✅ Fetch additional services for this location
  const locationServices = locationData 
    ? await getServicesByLocation(locationData.id) 
    : [];

  // ✅ Extract flight types for JSON-LD (current locale with prices)
  const localeFlightTypes = contentData.flight_types || [];
  const sharedFlightTypes = locationPageData?.content?.shared_flight_types || [];
  
  // Map flight types with prices for Schema.org
  const flightTypesForSchema = localeFlightTypes.map((ft: { shared_id?: string; name: string; description?: string }) => {
    const sharedFT = sharedFlightTypes.find((sft: { id: string }) => sft.id === ft.shared_id);
    return {
      name: ft.name,
      description: ft.description,
      price: sharedFT?.price_gel || 350, // fallback price
      currency: 'GEL',
    };
  }).filter((ft: { name: string }) => ft.name); // filter empty

  return (
    <>
      {/* JSON-LD Structured Data */}
      {locationData && (
        <>
          <LocationJsonLd
            name={locationName}
            description={description}
            image={locationData.og_image_url}
            countryName={countryName}
            rating={locationData.cached_rating}
            ratingCount={locationData.cached_rating_count}
            altitude={locationData.altitude}
            url={pageUrl}
            flightTypes={flightTypesForSchema.length > 0 ? flightTypesForSchema : undefined}
          />
          <BreadcrumbJsonLd items={breadcrumbItems} />
        </>
      )}

      {/* ✅ Server-rendered H1 for SEO - Google will see this! */}
      <h1 className="sr-only">{h1Tag}</h1>
      
      {/* ✅ Pass filtered initialData - only current locale content (SEO optimized) */}
      <LocationPage 
        countrySlug={country} 
        locationSlug={location} 
        locale={locale}
        initialData={{
          location: locationData,
          locationPage: filteredLocationPageData,
          companies: locationCompanies || [],
          services: locationServices
        }}
      />
    </>
  );
}
