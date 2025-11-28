import { Metadata } from 'next';
import GlobalLocations from '@/components/globallocation/GlobalLocations';
import { 
  getPageSEO, 
  getPageOG, 
  buildCanonicalUrl,
  getStaticPageAlternateUrls,
  BASE_URL,
  SITE_NAME,
  BreadcrumbJsonLd,
  generateLocaleParams,
  type Locale 
} from '@/lib/seo';

// ✅ ISR: Revalidate every 4 hours (14400 seconds)
export const revalidate = 14400;

// ✅ SSG: Pre-generate for all locales
export async function generateStaticParams() {
  return generateLocaleParams();
}

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale = (locale as Locale) || 'ka';
  const seo = getPageSEO('locations', safeLocale);
  const og = getPageOG('locations', safeLocale);
  const alternateUrls = getStaticPageAlternateUrls('locations', safeLocale);

  return {
    title: seo.title,
    description: seo.description,
    alternates: {
      canonical: alternateUrls.canonical,
      languages: alternateUrls.languages,
    },
    openGraph: {
      title: og.title,
      description: og.description,
      url: alternateUrls.canonical,
      type: 'website',
      locale,
      siteName: SITE_NAME,
    },
    twitter: {
      card: 'summary_large_image',
      title: og.title,
      description: og.description,
    },
  };
}

export default async function LocationsPage({ params }: PageProps) {
  const { locale } = await params;

  // Breadcrumb items
  const breadcrumbItems = [
    { name: 'Home', url: `${BASE_URL}/${locale}` },
    { name: 'Locations', url: `${BASE_URL}/${locale}/locations` },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <GlobalLocations locale={locale} />
    </>
  );
}
