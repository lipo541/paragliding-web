import { Metadata } from 'next';
import { 
  getStaticPageAlternateUrls, 
  getPageSEO,
  SITE_NAME,
  BASE_URL,
  BreadcrumbJsonLd,
  generateLocaleParams,
  type Locale 
} from '@/lib/seo';

// ✅ ISR: Revalidate daily (86400 seconds)
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
  
  const { title, description } = getPageSEO('terms', safeLocale);
  const alternateUrls = getStaticPageAlternateUrls('terms', safeLocale);

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
      url: alternateUrls.canonical,
    },
  };
}

export default async function TermsPage({ params }: PageProps) {
  const { locale } = await params;
  
  // Breadcrumb items
  const breadcrumbItems = [
    { name: 'Home', url: `${BASE_URL}/${locale}` },
    { name: 'Terms of Service', url: `${BASE_URL}/${locale}/terms` },
  ];

  // TODO: Replace with actual terms content component
  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
        <p className="text-gray-600">Terms of Service content coming soon...</p>
      </div>
    </>
  );
}
