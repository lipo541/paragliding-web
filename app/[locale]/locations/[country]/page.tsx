import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import CountryPage from '@/components/countrypage/CountryPage';

interface PageProps {
  params: Promise<{
    locale: string;
    country: string;
  }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, country } = await params;
  const supabase = createClient();

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

  return {
    title,
    description,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      images: data.og_image_url ? [data.og_image_url] : [],
      type: 'website',
      locale: locale,
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

  return <CountryPage slug={country} locale={locale} />;
}
