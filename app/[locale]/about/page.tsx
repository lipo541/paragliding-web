import { Metadata } from 'next';
import AboutUs from '@/components/aboutus/AboutUs';
import { 
  getStaticPageAlternateUrls, 
  getPageSEO,
  SITE_NAME,
  BASE_URL,
  BreadcrumbJsonLd,
  generateLocaleParams,
  type Locale 
} from '@/lib/seo';

// ✅ ISR: Revalidate every 24 hours (86400 seconds)
export const revalidate = 86400;

// ✅ SSG: Pre-generate for all locales
export async function generateStaticParams() {
  return generateLocaleParams();
}

interface PageProps {
  params: Promise<{ locale: string }>;
}

// SEO Metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale = (locale as Locale) || 'ka';
  
  const { title, description } = getPageSEO('about', safeLocale);
  const alternateUrls = getStaticPageAlternateUrls('about', safeLocale);

  return {
    title,
    description,
    alternates: {
      canonical: alternateUrls.canonical,
      languages: alternateUrls.languages,
    },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      type: 'website',
      locale: safeLocale,
      siteName: SITE_NAME,
      url: alternateUrls.canonical,
    },
  };
}

export default async function AboutPage({ params }: PageProps) {
  const { locale } = await params;
  
  // Breadcrumb items
  const breadcrumbItems = [
    { name: 'Home', url: `${BASE_URL}/${locale}` },
    { name: 'About Us', url: `${BASE_URL}/${locale}/about` },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <AboutUs locale={locale || 'ka'} />
    </>
  );
}
