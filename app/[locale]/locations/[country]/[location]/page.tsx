import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import LocationPage from '@/components/locationpage/LocationPage';

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
  const supabase = createClient();

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

  return {
    title: seoTitle,
    description: seoDescription,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type: 'website',
      locale: locale,
      images: ogImage ? [{ url: ogImage }] : undefined,
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

  return <LocationPage countrySlug={country} locationSlug={location} locale={locale} />;
}
