import { Metadata } from 'next';
import PromotionPage from '@/components/promotions/PromotionPage';
import { 
  getStaticPageAlternateUrls, 
  getPageSEO,
  SITE_NAME,
  BASE_URL,
  DEFAULT_OG_IMAGE,
  BreadcrumbJsonLd,
  generateLocaleParams,
  type Locale 
} from '@/lib/seo';

// ✅ ISR: Revalidate hourly (promotions change often - 3600 seconds)
export const revalidate = 3600;

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
  
  const { title, description } = getPageSEO('promotions', safeLocale);
  const alternateUrls = getStaticPageAlternateUrls('promotions', safeLocale);

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
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: SITE_NAME,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

export default async function PromotionsPage({ params }: PageProps) {
  const { locale } = await params;
  const safeLocale = (locale as Locale) || 'ka';
  const { title } = getPageSEO('promotions', safeLocale);
  
  // Breadcrumb items
  const breadcrumbItems = [
    { name: 'Home', url: `${BASE_URL}/${locale}` },
    { name: 'Promotions', url: `${BASE_URL}/${locale}/promotions` },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbItems} />
      {/* SEO: Server-rendered h1 for crawlers */}
      <h1 className="sr-only">{title}</h1>
      <PromotionPage locale={locale || 'ka'} />
    </>
  );
}
